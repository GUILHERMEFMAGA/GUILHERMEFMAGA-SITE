"""r53: comando DIRETO de atalho — "atalho do agente" cria o icone do agente
na Area de Trabalho (reaproveitando criar_atalho_area_trabalho, sem duplicar)
e "atalho para <programa>" resolve apelidos conhecidos (chrome, bloco de
notas, vscode...). Fecha o buraco que fazia "crie um atalho pra abrir isso
rapido" cair no seletor de ferramentas com sugestoes sem relacao."""
import io
import os
import unittest
from contextlib import redirect_stdout

from test_roteamento_conversa import carregar


def rodar(env, *args, **kwargs):
    tampao = io.StringIO()
    with redirect_stdout(tampao):
        ok = env['_r53_comandos'](*args, **kwargs)
    return ok, tampao.getvalue()


class ResolverApp(unittest.TestCase):
    def test_apelidos_conhecidos_resolvem_o_primeiro_caminho_existente(self):
        env = carregar('_r53_resolver_app', '_norm_pt')
        existentes = {'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                      'C:\\Windows\\System32\\notepad.exe'}
        resolve = lambda nome: env['_r53_resolver_app'](nome, existe=existentes.__contains__)
        self.assertEqual(resolve('chrome'),
                         'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe')
        self.assertEqual(resolve('bloco de notas'), 'C:\\Windows\\System32\\notepad.exe')
        self.assertEqual(resolve('não conheço esse'), '')

    def test_apelido_conhecido_sem_exe_devolve_vazio(self):
        env = carregar('_r53_resolver_app', '_norm_pt')
        self.assertEqual(env['_r53_resolver_app']('chrome', existe=lambda c: False), '')


class AlvoAtalho(unittest.TestCase):
    def setUp(self):
        self.env = carregar('_r53_alvo_atalho', '_norm_pt')
        self.alvo = self.env['_r53_alvo_atalho']

    def test_frase_do_usuario_real_vira_agente(self):
        self.assertEqual(self.alvo('crie um atalho pra abrir isso rapido'), '')

    def test_variacoes_para_o_agente(self):
        for frase in ('atalho agente', 'faz o atalho de novo'):
            self.assertEqual(self.alvo(frase), '', frase)
        for frase in ('atalho do agente', 'criar atalho do agente',
                      'crie um atalho do super agente'):
            self.assertIn('agente', self.alvo(frase), frase)

    def test_alvos_explicitos_sao_extraidos_limpos(self):
        self.assertEqual(self.alvo('atalho para o chrome'), 'chrome')
        self.assertEqual(self.alvo('crie um atalho pro vscode'), 'vscode')
        self.assertEqual(self.alvo('atalho pra abrir o bloco de notas'), 'bloco de notas')
        self.assertEqual(self.alvo('atalho para c:/tools/app.exe rapido'), 'c:/tools/app.exe')

    def test_nao_captura_frases_que_so_mencionam_atalho(self):
        for frase in ('status', 'onde fica o atalho do whatsapp', 'remover atalho da area de trabalho'):
            self.assertIsNone(self.alvo(frase), frase)


class ComandosAtalho(unittest.TestCase):
    def test_agente_usa_iniciar_bat_ou_agente_py_e_avisa_de_outros_alvos(self):
        pasta = '/x/pasta'
        env = carregar('_r53_comandos', '_r53_alvo_atalho', '_r53_resolver_app', '_norm_pt', os=os)
        feitos = []
        ok, saida = rodar(env, 'crie um atalho pra abrir isso rapido',
                          criar=lambda alvo, nome: feitos.append((alvo, nome)) or 'ATALHO CRIADO',
                          pasta=pasta)
        self.assertTrue(ok)
        self.assertEqual(feitos, [(pasta + '/agente.py', 'Super Agente')])  # sem bat na pasta
        self.assertIn('ATALHO CRIADO', saida)
        self.assertIn('OUTRO programa', saida)
        # com iniciar.bat presente, e o bat que vira o atalho
        import tempfile
        pasta_real = tempfile.mkdtemp()
        io.open(pasta_real + '/iniciar.bat', 'w').write('rem bat')
        feitos.clear()
        rodar(env, 'atalho do agente',
              criar=lambda alvo, nome: feitos.append((alvo, nome)), pasta=pasta_real)
        self.assertEqual(feitos, [(pasta_real + '/iniciar.bat', 'Super Agente')])

    def test_programa_conhecido_e_desconhecido(self):
        env = carregar('_r53_comandos', '_r53_alvo_atalho', '_r53_resolver_app', '_norm_pt', os=os)
        feitos = []
        rodar(env, 'atalho para o chrome',
              criar=lambda alvo, nome: feitos.append((alvo, nome)),
              existe=lambda c: True)
        self.assertEqual(feitos[0][0], 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
        feitos.clear()
        rodar(env, 'atalho para c:/minha pasta/programa.exe',
              criar=lambda alvo, nome: feitos.append((alvo, nome)),
              existe=lambda c: False)
        self.assertEqual(feitos, [('c:/minha pasta/programa.exe', 'c:/minha pasta/programa.exe'[:40])])

    def test_nao_captura_fora_do_tema(self):
        env = carregar('_r53_comandos', '_r53_alvo_atalho', '_r53_resolver_app', '_norm_pt', os=os)
        ok, saida = rodar(env, 'status', criar=lambda a, n: self.fail('nao deveria criar'))
        self.assertFalse(ok)


class Estrutura(unittest.TestCase):
    def test_cadeia_menu_e_selo(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        self.assertLess(texto.index('if _r53_comandos(comando):'),
                        texto.index('if _r50_comandos(comando):'))
        self.assertIn("ATALHOS (r56): 'atalho do agente'", texto)  # rotulo evoluiu (r54/r56)
        self.assertIn('[Motor e avaliacao local 2026-09-11-r71]', texto)
        self.assertIn('criar_atalho_area_trabalho', texto)  # reuso, sem duplicar


if __name__ == '__main__':
    unittest.main()
