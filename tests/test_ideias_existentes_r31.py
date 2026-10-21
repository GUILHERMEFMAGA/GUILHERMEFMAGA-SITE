"""r31: checagem dura de existencia no pipeline de ideias da conversa livre
(sugestao com nome de ferramenta existente e descartada; ideia do catalogo
ganha #N). AST isolado; sem rede, sem GGUF; catalogo em pasta temporaria."""
import os
import tempfile
import unittest
from test_roteamento_conversa import carregar

CATEG = ('# catalogo\n\n## G9. Testes\n'
         '9. Proposta `medidor_de_x` - mede x com precisao laboratorial.\n')


def env_r31(pasta=None):
    base = {}
    if pasta:
        docs = os.path.join(pasta, 'docs')
        os.makedirs(docs, exist_ok=True)
        with open(os.path.join(docs, 'CATALOGO_PROPOSTAS_FERRAMENTAS.md'), 'w',
                  encoding='utf-8') as f:
            f.write(CATEG)
        base['__file__'] = os.path.join(pasta, 'agente.py')
    return carregar('_norm_pt', '_r26_propostas_catalogo',
                    '_r31_ideia_ja_existe', '_r31_numero_no_catalogo',
                    '_titulo_ideia_repetido', '_roteiro_revisao_alternativo',
                    '_relacionadas_no_inventario', '_formatar_ideias_verificadas', **base)


INVENTARIO = {'funcoes': {'gerar_senha': {'linha': 10}, 'morse_converter': {'linha': 20}},
              'hash': 'abc123def456'}
EVIDENCIAS = [{'nome': 'gerar_senha'}, {'nome': 'morse_converter'}]


def item(titulo, ref='gerar_senha'):
    return {'titulo': titulo, 'justificativa': 'porque e util', 'beneficio': 'economiza tempo',
            'risco': 'baixo', 'teste': 'rodar e conferir', 'funcoes': [ref]}


class ChecagemDura(unittest.TestCase):
    def test_ideia_ja_existe_por_nome(self):
        env = env_r31()
        self.assertEqual(env['_r31_ideia_ja_existe']('Gerar Senha', INVENTARIO['funcoes']),
                         'gerar_senha')
        self.assertIsNone(env['_r31_ideia_ja_existe']('coisa totalmente nova',
                                                      INVENTARIO['funcoes']))
        self.assertIsNone(env['_r31_ideia_ja_existe']('   ', INVENTARIO['funcoes']))

    def test_numero_no_catalogo_com_e_sem_arquivo(self):
        pasta = tempfile.mkdtemp()
        env = env_r31(pasta)
        self.assertEqual(env['_r31_numero_no_catalogo']('medidor de x'), 9)
        self.assertEqual(env['_r31_numero_no_catalogo']('cata vento quimico'), 0)
        env_sem = env_r31()
        self.assertEqual(env_sem['_r31_numero_no_catalogo']('medidor de x'), 0)

    def test_pipeline_descarta_existente_e_marca_catalogo(self):
        pasta = tempfile.mkdtemp()
        env = env_r31(pasta)
        texto = ('{"ideias":['
                 '{"titulo":"gerar senha","justificativa":"a","beneficio":"b","risco":"c",'
                 '"teste":"d","funcoes":["gerar_senha"]},'
                 '{"titulo":"Medidor de X","justificativa":"a","beneficio":"b","risco":"c",'
                 '"teste":"d","funcoes":["gerar_senha"]},'
                 '{"titulo":"Gerenciador de tampas","justificativa":"a","beneficio":"b",'
                 '"risco":"c","teste":"d","funcoes":["morse_converter"]}]}')
        saida = env['_formatar_ideias_verificadas'](texto, INVENTARIO, EVIDENCIAS, 3,
                                                    [], [])
        self.assertIn('Descartadas porque ja existe ferramenta com esse nome', saida)
        self.assertIn('(catalogo #9)', saida)
        self.assertIn('1. Medidor de X', saida)
        self.assertIn('2. Gerenciador de tampas', saida)
        self.assertIn('validos: 2/3', saida)

    def test_sem_colisao_resumo_sai_limpo(self):
        env = env_r31()
        texto = ('{"ideias":[{"titulo":"Organizador de tampas","justificativa":"a",'
                 '"beneficio":"b","risco":"c","teste":"d",'
                 '"funcoes":["morse_converter"]}]}')
        saida = env['_formatar_ideias_verificadas'](texto, INVENTARIO, EVIDENCIAS, 2, [], [])
        self.assertNotIn('Descartadas porque ja existe', saida)
        self.assertIn('validos: 1/2', saida)


if __name__ == '__main__':
    unittest.main()
