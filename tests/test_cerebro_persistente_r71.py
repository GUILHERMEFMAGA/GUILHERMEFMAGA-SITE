"""r71: os 3 criticos da analise de lacunas resolvidos — (1) o cerebro
(fatos/padroes/pesos da r69/r70) agora SOBREVIVE ao fechar (cerebro.json,
load na abertura, save a cada mutacao, kill-switch 'cerebro_persistente');
(2) esquecer UM padrao especifico (nao todos) + listar aprendizado;
(3) dependencias pinadas: requirements.txt por faixa major, entregue pelo
'atualizar agora' (r62) e usado pelo iniciar.bat."""
import io
import json
import os
import tempfile
import unittest
from contextlib import redirect_stdout

from test_roteamento_conversa import carregar


def _env(*nomes):
    return carregar(*nomes, '_norm_pt', os=os, json=json)


class Persistencia(unittest.TestCase):
    def test_salvar_e_reabrir_preserva_o_cerebro(self):
        pasta = tempfile.mkdtemp()
        env1 = _env('_r71_salvar_cerebro', '_r69_instalar_estado')
        st = env1['_r69_instalar_estado']()
        st['conhecimento'] = {'minha casa': [{'texto': 'moro em Ribeirao Preto'}]}
        st['aprendidas'] = {'arruma pc': 'organizar downloads'}
        self.assertTrue(env1['_r71_salvar_cerebro'](pasta=pasta))
        env2 = _env('_r71_carregar_cerebro', '_r69_instalar_estado')
        with redirect_stdout(io.StringIO()) as saida:
            resumo = env2['_r71_carregar_cerebro'](pasta=pasta)
        self.assertIn('Cerebro restaurado', resumo)
        self.assertIn('1 topico(s)', resumo)
        st2 = env2['_r69_instalar_estado']()
        self.assertEqual(st2['conhecimento']['minha casa'][0]['texto'], 'moro em Ribeirao Preto')
        self.assertEqual(st2['aprendidas'].get('arruma pc'), 'organizar downloads')

    def test_kill_switch_volta_a_memoria_volatil(self):
        pasta = tempfile.mkdtemp()
        with io.open(os.path.join(pasta, 'config.json'), 'w') as f:
            json.dump({'cerebro_persistente': False}, f)
        env = _env('_r71_salvar_cerebro', '_r71_carregar_cerebro', '_r69_instalar_estado',
                   '_r67_ler_config')
        env['_r69_instalar_estado']()['conhecimento'] = {'segredo': [{'texto': 'nao gravar'}]}
        self.assertFalse(env['_r71_salvar_cerebro'](pasta=pasta))
        self.assertFalse(os.path.exists(os.path.join(pasta, 'cerebro.json')))
        io.open(os.path.join(pasta, 'cerebro.json'), 'w').write('{"conhecimento": {"x": []}}')
        self.assertEqual(env['_r71_carregar_cerebro'](pasta=pasta), '')

    def test_arquivo_corrompido_nao_derruba_nada(self):
        pasta = tempfile.mkdtemp()
        io.open(os.path.join(pasta, 'cerebro.json'), 'w').write('{lixo')
        env = _env('_r71_carregar_cerebro', '_r69_instalar_estado')
        with redirect_stdout(io.StringIO()):
            self.assertEqual(env['_r71_carregar_cerebro'](pasta=pasta), '')

    def test_sem_cerebro_a_abertura_fica_silenciosa(self):
        env = _env('_r71_restaurar_na_abertura', '_r71_carregar_cerebro')
        tampao = io.StringIO()
        with redirect_stdout(tampao):
            env['_r71_restaurar_na_abertura'](pasta=tempfile.mkdtemp())
        self.assertEqual(tampao.getvalue(), '')


class HooksDeMutacao(unittest.TestCase):
    def test_ensinar_pelo_r69_dispara_o_save(self):
        env = _env('_r69_comandos')
        capturados = []
        env['_r71_salvar_cerebro'] = lambda *a, **k: capturados.append(1)
        with redirect_stdout(io.StringIO()):
            self.assertTrue(env['_r69_comandos']('conhecimento ensinar casa: teste'))
        self.assertEqual(capturados, [1])

    def test_aprender_palavras_e_esquecer_tambem_salvam(self):
        env = _env('_r69_comandos')
        capturados = []
        env['_r71_salvar_cerebro'] = lambda *a, **k: capturados.append(1)
        with redirect_stdout(io.StringIO()):
            self.assertTrue(env['_r69_comandos']('aprender palavras {"a":"b"}'))
        with redirect_stdout(io.StringIO()):
            self.assertTrue(env['_r69_comandos']('esquecer aprendizado'))
        self.assertEqual(len(capturados), 2)


class EsquecerEspecifico(unittest.TestCase):
    def _env(self, padroes):
        env = _env('_r71_comandos', '_r71_salvar_cerebro')
        env['_norm_pt']('boot')  # instala o estado completo do nucleo
        env['_R69_NUCLEO']['aprendidas'] = dict(padroes)
        return env

    def test_apaga_exatamente_um_e_salva(self):
        pasta = tempfile.mkdtemp()
        env = self._env({'arruma pc': 'organizar', 'faz cafe': 'x'})
        env['_r71_salvar_cerebro'] = lambda *a, **k: io.open(
            os.path.join(pasta, 'cerebro.json'), 'w').write('{"salvo": 1}')
        with redirect_stdout(io.StringIO()) as saida:
            self.assertTrue(env['_r71_comandos']('esquecer arruma pc'))
        self.assertIn('esquecido: "arruma pc"', saida.getvalue())
        self.assertEqual(list(env['_R69_NUCLEO']['aprendidas']), ['faz cafe'])
        self.assertTrue(os.path.isfile(os.path.join(pasta, 'cerebro.json')))

    def test_parecido_propoe_sem_apagar(self):
        env = self._env({'arruma pc': 'x', 'arruma quarto': 'y'})
        with redirect_stdout(io.StringIO()) as saida:
            self.assertTrue(env['_r71_comandos']('esquecer arruma'))
        self.assertIn('repita exatamente', saida.getvalue())
        self.assertIn('arruma pc', saida.getvalue())
        self.assertEqual(len(env['_R69_NUCLEO']['aprendidas']), 2)

    def test_desconhecido_e_honesto(self):
        env = self._env({'a': 'b'})
        with redirect_stdout(io.StringIO()) as saida:
            self.assertTrue(env['_r71_comandos']('esquecer zzz'))
        self.assertIn('Nao encontrei', saida.getvalue())
        with redirect_stdout(io.StringIO()):
            self.assertFalse(env['_r71_comandos']('esquecer'))
            self.assertFalse(env['_r71_comandos']('esquecer aprendizado'))  # rota da r69

    def test_listar_mostra_os_pares(self):
        env = self._env({'b': '2', 'a': '1'})
        with redirect_stdout(io.StringIO()) as saida:
            self.assertTrue(env['_r71_comandos']('listar aprendizado'))
        corpo = saida.getvalue()
        self.assertIn('"a" -> 1', corpo)
        self.assertIn('"b" -> 2', corpo)
        self.assertIn('esquecer aprendizado', corpo)


class DependenciasPinadas(unittest.TestCase):
    def test_requirements_no_repo_e_no_bat(self):
        with io.open('requirements.txt', encoding='utf-8') as f:
            req = f.read()
        self.assertIn('langchain-openai>=1.0,<2.0', req)
        self.assertIn('langchain-google-genai>=4.0,<5.0', req)
        with io.open('iniciar.bat', 'rb') as f:
            bat = f.read()
        self.assertIn(b'python -m pip install -q -r requirements.txt\r\n', bat)
        self.assertNotIn(b'pip install -q langchain-openai langchain-google-genai', bat)


class Estrutura(unittest.TestCase):
    def test_cadeia_gancho_menu_e_selo(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        self.assertLess(texto.index('if _r70_comandos(comando):'),
                        texto.index('if _r71_comandos(comando):'))
        self.assertEqual(texto.count('\n_r71_restaurar_na_abertura()'), 1)
        self.assertGreater(texto.index('\n_r71_restaurar_na_abertura()'),
                           texto.index('if _r71_comandos(comando):'))  # rota definida antes do gancho
        self.assertIn('CEREBRO r71', texto)
        self.assertEqual(texto.count('[Motor e avaliacao local 2026-09-11-r72]'), 1)


if __name__ == '__main__':
    unittest.main()
