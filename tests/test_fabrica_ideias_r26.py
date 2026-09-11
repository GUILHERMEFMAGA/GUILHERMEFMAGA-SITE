"""r26: fabrica de ideias (catalogo + telemetria r25 + filtros r23). AST isolado;
sem rede, sem GGUF, sem acoes reais; arquivos de catalogo so em pasta temporaria
(excecao: leitura do catalogo real do repositorio, somente leitura)."""
import io
import os
import contextlib
import tempfile
import types
import unittest
from test_roteamento_conversa import carregar


def fake_tool(nome):
    return types.SimpleNamespace(name=nome, description='descricao de teste')


def base_env(**extras):
    base = dict(tools=[fake_tool('status_defender'), fake_tool('gerar_senha')],
                config={'ideias_rejeitadas': []}, _r25_uso_ferramentas={},
                __file__=os.path.join(tempfile.gettempdir(), 'agente_fake_sem_docs.py'))
    base.update(extras)
    return carregar('_norm_pt', '_r26_palavras', '_r26_propostas_catalogo',
                    '_r26_filtrar_rejeitadas', '_r26_sem_colisao',
                    '_r26_ideias_robustez', '_r26_priorizar',
                    '_r26_relatorio', '_r26_comandos', **base)


def capturar(funcao, *args):
    tampao = io.StringIO()
    with contextlib.redirect_stdout(tampao):
        resultado = funcao(*args)
    return resultado, tampao.getvalue()


CATALOGO_EXEMPLO = (
    '# titulo\n\n'
    '## G9. Testes da fabrica\n'
    '1. \u2705 `ja_existe` — usada no lote 1.\n'
    '9. Proposta `medidor_de_x` — mede x com precisao (viz: nada).\n'
    '10. Proposta `organizador_de_y` — organiza y por cor e tamanho.\n'
)

USO = {'usos': 1, 'erros': 0, 'tempo_s': 0.1, 'ultimo_erro': '', 'ultima_duracao_s': 0.1}


class PropostasDoCatalogo(unittest.TestCase):
    def test_parser_le_propostas_e_pula_implementadas(self):
        with tempfile.TemporaryDirectory() as pasta:
            docs = os.path.join(pasta, 'docs')
            os.makedirs(docs)
            arq = os.path.join(docs, 'CATALOGO_PROPOSTAS_FERRAMENTAS.md')
            with open(arq, 'w', encoding='utf-8') as f:
                f.write(CATALOGO_EXEMPLO)
            env = base_env(__file__=os.path.join(pasta, 'agente.py'))
            propostas, caminho = env['_r26_propostas_catalogo']()
            self.assertEqual(len(propostas), 2)
            self.assertEqual(propostas[0]['nome'], 'medidor_de_x')
            self.assertEqual(propostas[0]['tema'], 'G9. Testes da fabrica')
            self.assertEqual(propostas[1]['nome'], 'organizador_de_y')
            self.assertTrue(str(caminho).endswith('.md'))

    def test_sem_arquivo_retorna_vazio_sem_quebrar(self):
        env = base_env()
        propostas, caminho = env['_r26_propostas_catalogo']()
        self.assertEqual(propostas, [])
        self.assertIsNone(caminho)

    def test_catalogo_real_tem_mais_de_cem_propostas_sem_repetir(self):
        env = base_env(__file__=os.path.abspath('agente.py'))
        propostas, caminho = env['_r26_propostas_catalogo']()
        self.assertTrue(caminho and os.path.exists(caminho))
        self.assertGreater(len(propostas), 100)
        nomes = [p['nome'] for p in propostas]
        self.assertEqual(len(nomes), len(set(nomes)))
        self.assertNotIn('estatisticas_ia_local', nomes)  # item 163 entregue na r25


class Filtros(unittest.TestCase):
    def test_rejeitadas_cortam_proposta_parecida(self):
        env = base_env()
        propostas = [{'numero': 9, 'tema': 'T', 'nome': 'medidor_de_x', 'descricao': 'mede x'},
                     {'numero': 10, 'tema': 'T', 'nome': 'organizador_de_y', 'descricao': 'organiza y'}]
        aceitas, cortadas = env['_r26_filtrar_rejeitadas'](propostas, ['medidor de x'])
        self.assertEqual(cortadas, 1)
        self.assertEqual([p['nome'] for p in aceitas], ['organizador_de_y'])

    def test_sem_rejeitadas_nao_corta_nada(self):
        env = base_env()
        aceitas, cortadas = env['_r26_filtrar_rejeitadas'](
            [{'numero': 1, 'tema': 'T', 'nome': 'abcd_efgh', 'descricao': 'faz algo'}], [])
        self.assertEqual((len(aceitas), cortadas), (1, 0))

    def test_colisao_com_nome_existente_e_parecido(self):
        env = base_env()
        self.assertFalse(env['_r26_sem_colisao']('gerar_senha'))
        self.assertFalse(env['_r26_sem_colisao']('status_defendr'))
        self.assertTrue(env['_r26_sem_colisao']('cata_vento_quimico_xyz'))

    def test_colisao_sem_tools_nao_quebra(self):
        env = base_env(tools=[])
        self.assertTrue(env['_r26_sem_colisao']('qualquer_coisa_nova'))


class RobustezEPrioridade(unittest.TestCase):
    def test_falhas_ordenadas_pior_primeiro(self):
        env = base_env(_r25_uso_ferramentas={
            'b_tool': dict(USO, usos=5, erros=1, ultimo_erro='ValueError'),
            'a_tool': dict(USO, usos=3, erros=2, ultimo_erro='TimeoutError')})
        falhas = env['_r26_ideias_robustez']()
        self.assertEqual([nome for nome, _ in falhas], ['a_tool', 'b_tool'])

    def test_sem_falhas_lista_vazia(self):
        env = base_env(_r25_uso_ferramentas={'ok_tool': dict(USO, usos=2)})
        self.assertEqual(env['_r26_ideias_robustez'](), [])

    def test_priorizar_sobe_tema_que_o_usuario_usa(self):
        uso = {'gerar_senha': dict(USO, usos=9)}
        env = base_env(_r25_uso_ferramentas=uso)
        propostas = [{'numero': 1, 'tema': 'T', 'nome': 'coisa_aleatoria', 'descricao': 'organiza cores'},
                     {'numero': 2, 'tema': 'T', 'nome': 'forca_de_senha_medir',
                      'descricao': 'mede forca de senha'}]
        self.assertEqual(env['_r26_priorizar'](propostas)[0]['nome'], 'forca_de_senha_medir')

    def test_priorizar_sem_uso_mantem_ordem_do_catalogo(self):
        env = base_env()
        propostas = [{'numero': 7, 'tema': 'T', 'nome': 'bb', 'descricao': 'x'},
                     {'numero': 3, 'tema': 'T', 'nome': 'aa', 'descricao': 'y'}]
        self.assertEqual([p['numero'] for p in env['_r26_priorizar'](propostas)], [3, 7])


class RelatorioEComando(unittest.TestCase):
    def test_relatorio_sem_catalogo_e_sem_uso_e_honesto(self):
        env = base_env()
        texto, _ = capturar(env['_r26_relatorio'])
        self.assertIn('FABRICA DE IDEIAS', texto)
        self.assertIn('GGUF continua o mesmo', texto)
        self.assertIn('(nenhuma falha registrada', texto)
        self.assertIn('ainda sem uso nesta sessao', texto)
        self.assertIn('nao encontrado', texto)

    def test_relatorio_com_uso_e_falha_mostra_dados(self):
        uso = {'gerar_senha': dict(USO, usos=4, erros=1, ultimo_erro='ValueError')}
        env = base_env(_r25_uso_ferramentas=uso)
        texto, _ = capturar(env['_r26_relatorio'])
        self.assertIn('gerar_senha: 1 erro(s) em 4 uso(s) (ultimo: ValueError)', texto)
        self.assertIn('COMO USAR', texto)

    def test_relatorio_com_catalogo_real_lista_propostas(self):
        env = base_env(__file__=os.path.abspath('agente.py'))
        texto, _ = capturar(env['_r26_relatorio'])
        self.assertIn('restantes no arquivo', texto)
        self.assertIn('[3] PROPOSTAS DO CATALOGO', texto)

    def test_comando_fabrica_e_exatidao_da_frase(self):
        env = base_env()
        retorno, saida = capturar(env['_r26_comandos'], 'fabrica de ideias')
        self.assertTrue(retorno)
        self.assertIn('FABRICA DE IDEIAS', saida)
        retorno2, saida2 = capturar(env['_r26_comandos'], 'fabrica de ideias agora')
        self.assertFalse(retorno2)
        self.assertEqual(saida2, '')
        retorno3, saida3 = capturar(env['_r26_comandos'], 'fábrica de ideias')
        self.assertTrue(retorno3)


if __name__ == '__main__':
    unittest.main()
