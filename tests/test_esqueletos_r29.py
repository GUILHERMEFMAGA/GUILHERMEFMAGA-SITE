"""r29: esqueletos de ideia (o agente materializa ideias em codigo base .py
na pasta esqueletos_ideias/). AST isolado; sem rede, sem GGUF; disco somente
em pasta temporaria."""
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


def env_r29(**extras):
    base = dict(PASTA_BASE=tempfile.mkdtemp())
    base.update(extras)
    return carregar('_norm_pt', '_r29_pasta_esqueletos', '_r29_nome_seguro',
                    '_r29_gerar_esqueleto', '_r29_listar', '_r29_abrir',
                    '_r29_comandos', **base)


class NomeSeguro(unittest.TestCase):
    def setUp(self):
        self.env = env_r29()

    def test_acentos_espacos_e_maiusculas(self):
        self.assertEqual(self.env['_r29_nome_seguro']('Relatório de Vendas'),
                         'relatorio_de_vendas')

    def test_comeca_com_numero_ganha_prefixo(self):
        self.assertEqual(self.env['_r29_nome_seguro']('7 maravilhas'),
                         'ideia_7_maravilhas')

    def test_vazio_ou_invalido_retorna_none(self):
        self.assertIsNone(self.env['_r29_nome_seguro']('   '))
        self.assertIsNone(self.env['_r29_nome_seguro'](''))
        self.assertIsNone(self.env['_r29_nome_seguro']('!!!'))

    def test_limite_de_60_caracteres(self):
        self.assertEqual(len(self.env['_r29_nome_seguro']('a' * 200)), 60)


class Geracao(unittest.TestCase):
    def setUp(self):
        self.pasta = tempfile.mkdtemp()
        self.env = env_r29(PASTA_BASE=self.pasta)

    def test_gera_arquivo_com_funcao_docstring_e_aviso(self):
        msg = self.env['_r29_gerar_esqueleto']('medidor de água')
        caminho = os.path.join(self.pasta, 'esqueletos_ideias', 'medidor_de_agua.py')
        self.assertTrue(os.path.exists(caminho))
        self.assertIn('medidor_de_agua.py', msg)
        self.assertIn('NAO entra no agente sozinho', msg)
        conteudo = io.open(caminho, encoding='utf-8').read()
        self.assertIn('def medidor_de_agua(', conteudo)
        self.assertIn('NotImplementedError', conteudo)
        self.assertIn('r29', conteudo)
        self.assertIn('esqueletos_ideias', conteudo)

    def test_nunca_sobrescreve_esqueleto_existente(self):
        self.env['_r29_gerar_esqueleto']('coisa boa')
        msg2 = self.env['_r29_gerar_esqueleto']('coisa boa')
        self.assertIn('Ja existe', msg2)
        caminho = os.path.join(self.pasta, 'esqueletos_ideias', 'coisa_boa.py')
        self.assertEqual(len(io.open(caminho, encoding='utf-8').readlines()
                             ), len(io.open(caminho, encoding='utf-8').readlines()))

    def test_nome_invalido_orienta_sem_criar_pasta(self):
        msg = self.env['_r29_gerar_esqueleto']('!!!')
        self.assertIn('Nao consegui transformar', msg)
        self.assertFalse(os.path.isdir(os.path.join(self.pasta, 'esqueletos_ideias')))

    def test_sem_pasta_base_nao_escreve_nada(self):
        env = env_r29(PASTA_BASE=None)
        msg = env['_r29_gerar_esqueleto']('algo util')
        self.assertIn('pasta real', msg)


class ListarAbrirEComandos(unittest.TestCase):
    def setUp(self):
        self.pasta = tempfile.mkdtemp()
        self.env = env_r29(PASTA_BASE=self.pasta)

    def test_listar_sem_nada_orienta_como_criar(self):
        retorno, saida = capturar(self.env['_r29_comandos'], 'listar esqueletos')
        self.assertTrue(retorno)
        self.assertIn('Nenhum esqueleto ainda', saida)
        self.assertIn('esqueleto de ideia:', saida)

    def test_listar_com_arquivos(self):
        self.env['_r29_gerar_esqueleto']('medidor de chuva')
        retorno, saida = capturar(self.env['_r29_comandos'], 'listar esqueletos')
        self.assertTrue(retorno)
        self.assertIn('medidor_de_chuva.py', saida)
        self.assertIn('(1):', saida)

    def test_abrir_inexistente_orienta(self):
        retorno, saida = capturar(self.env['_r29_comandos'], 'abrir esqueleto: algo raro')
        self.assertTrue(retorno)
        self.assertIn('Ainda nao existe', saida)
        self.assertIn('esqueleto de ideia:', saida)

    def test_abrir_existente_mostra_o_caminho(self):
        self.env['_r29_gerar_esqueleto']('medidor de vento')
        retorno, saida = capturar(self.env['_r29_comandos'], 'abrir esqueleto: medidor de vento')
        self.assertTrue(retorno)
        self.assertIn('medidor_de_vento.py', saida)

    def test_comando_esqueleto_de_ideia_cria_arquivo(self):
        retorno, saida = capturar(self.env['_r29_comandos'],
                                  'esqueleto de ideia: conta de luz prevista')
        self.assertTrue(retorno)
        self.assertIn('Esqueleto criado', saida)
        self.assertTrue(os.path.exists(os.path.join(
            self.pasta, 'esqueletos_ideias', 'conta_de_luz_prevista.py')))

    def test_sem_dois_pontos_nao_e_comando_r29(self):
        retorno, saida = capturar(self.env['_r29_comandos'], 'esqueleto de ideia sem ponto')
        self.assertFalse(retorno)
        self.assertEqual(saida, '')

    def test_comando_estranho_passa_direto(self):
        retorno, saida = capturar(self.env['_r29_comandos'], 'comprar pao')
        self.assertFalse(retorno)
        self.assertEqual(saida, '')


if __name__ == '__main__':
    unittest.main()
