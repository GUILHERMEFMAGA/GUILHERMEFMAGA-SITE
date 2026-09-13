"""r32: verificacao pos-geracao dos esqueletos e radiografia completa do
agente.py (somente leitura). AST isolado; sem rede, sem GGUF; disco somente
em pasta temporaria (excecao: leitura do agente.py real do repositorio)."""
import io
import os
import tempfile
import unittest
from test_roteamento_conversa import carregar


def capturar(funcao, *args):
    import contextlib
    tampao = io.StringIO()
    with contextlib.redirect_stdout(tampao):
        return funcao(*args), tampao.getvalue()


def env_r32(**extras):
    base = dict(PASTA_BASE=tempfile.mkdtemp())
    base.update(extras)
    return carregar('_norm_pt', '_r28_carregar_telemetria', '_r29_pasta_esqueletos',
                    '_r29_nome_seguro', '_r30_analisar_ideia', '_r29_gerar_esqueleto',
                    '_r29_listar', '_r29_abrir', '_r29_comandos',
                    '_r32_conferir_codigo', '_r32_conferir_esqueletos',
                    '_r32_analisar_agente', '_r32_comandos', **base)


CODIGO_OK = ('def minha_ideia(entrada: str = "") -> str:\n'
             '    """doc"""\n'
             '    raise NotImplementedError("pendente")\n')
CODIGO_QUEBRADO = ('def outra_ideia(entrada:\n'
                   '    raise NotImplementedError("pendente")\n')


class VerificacaoPosGeracao(unittest.TestCase):
    def setUp(self):
        self.pasta = tempfile.mkdtemp()
        self.env = env_r32(PASTA_BASE=self.pasta)

    def test_conferir_codigo_ok_e_quebrado(self):
        resultado = self.env['_r32_conferir_codigo'](CODIGO_OK, 'minha_ideia')
        self.assertTrue(resultado['ok'])
        resultado2 = self.env['_r32_conferir_codigo'](CODIGO_QUEBRADO, 'outra_ideia')
        self.assertFalse(resultado2['ok'])
        self.assertIn('sintaxe', resultado2['motivo'])
        resultado3 = self.env['_r32_conferir_codigo'](CODIGO_OK, 'nome_errado')
        self.assertFalse(resultado3['ok'])
        self.assertIn('nao encontrada', resultado3['motivo'])

    def test_gerar_esqueleto_ja_verifica_e_avisa_ok(self):
        msg = self.env['_r29_gerar_esqueleto']('medidor de agua')
        self.assertIn('Verificacao pos-geracao: sintaxe OK, funcao medidor_de_agua presente.', msg)


class ConferirEsqueletos(unittest.TestCase):
    def setUp(self):
        self.pasta = tempfile.mkdtemp()
        self.env = env_r32(PASTA_BASE=self.pasta)
        self.pasta_esq = os.path.join(self.pasta, 'esqueletos_ideias')
        os.makedirs(self.pasta_esq)
        with open(os.path.join(self.pasta_esq, 'bom.py'), 'w', encoding='utf-8') as f:
            f.write(CODIGO_OK.replace('minha_ideia', 'bom'))
        with open(os.path.join(self.pasta_esq, 'ruim.py'), 'w', encoding='utf-8') as f:
            f.write(CODIGO_QUEBRADO.replace('outra_ideia', 'ruim'))

    def test_aponta_ok_e_quebrado(self):
        retorno, saida = capturar(self.env['_r32_comandos'], 'conferir esqueletos')
        self.assertTrue(retorno)
        self.assertIn('1 OK, 1 quebrado(s)', saida)
        self.assertIn('OK bom.py', saida)
        self.assertIn('QUEBRADO ruim.py', saida)
        self.assertIn('Nao apague nada as cegas', saida)

    def test_pasta_vazia_e_inexistente(self):
        env2 = env_r32(PASTA_BASE=tempfile.mkdtemp())
        _, saida2 = capturar(env2['_r32_comandos'], 'conferir esqueletos')
        self.assertIn('ainda nao existe', saida2)
        pasta_vazia = tempfile.mkdtemp()
        os.makedirs(os.path.join(pasta_vazia, 'esqueletos_ideias'))
        env3 = env_r32(PASTA_BASE=pasta_vazia)
        _, saida3 = capturar(env3['_r32_comandos'], 'conferir esqueletos')
        self.assertIn('vazia', saida3)


class RadiografiaCompleta(unittest.TestCase):
    def test_analisar_agente_le_o_arquivo_real(self):
        pasta = tempfile.mkdtemp()
        env = env_r32(PASTA_BASE=pasta,
                      _CAMINHO_AGENTE_PY=os.path.abspath('agente.py'),
                      tools=[])
        texto, _ = capturar(env['_r32_analisar_agente'])
        self.assertIn('ANALISE COMPLETA DO AGENTE', texto)
        self.assertIn('Leitura SOMENTE', texto)
        self.assertIn('Funcoes de topo: ', texto)
        self.assertIn('nomes duplicados: 0', texto)
        self.assertIn('Ferramentas registradas na lista: 0', texto)
        self.assertIn('Camadas de melhoria no arquivo:', texto)

    def test_sem_caminho_responde_honesto(self):
        env = env_r32()
        texto, _ = capturar(env['_r32_analisar_agente'])
        self.assertIn('nada analisado', texto)

    def test_comandos_roteiam_e_estranhos_passam(self):
        env = env_r32(_CAMINHO_AGENTE_PY=os.path.abspath('agente.py'))
        retorno, saida = capturar(env['_r32_comandos'], 'analisar agente')
        self.assertTrue(retorno)
        self.assertIn('ANALISE COMPLETA DO AGENTE', saida)
        retorno2, _ = capturar(env['_r32_comandos'], 'analisar o agente')
        self.assertTrue(retorno2)
        retorno3, saida3 = capturar(env['_r32_comandos'], 'comprar pao')
        self.assertFalse(retorno3)
        self.assertEqual(saida3, '')


if __name__ == '__main__':
    unittest.main()
