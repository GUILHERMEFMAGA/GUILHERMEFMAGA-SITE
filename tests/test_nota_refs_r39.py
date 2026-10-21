"""r39: nota de honestidade quando TODAS as sugestoes ancoram na mesma
unica referencia (padrao visto no relato real 5/5 do PC). AST isolado."""
import json
import unittest
from test_roteamento_conversa import carregar


def env_r39():
    return carregar('_norm_pt', '_r26_propostas_catalogo',
                    '_r31_ideia_ja_existe', '_r31_numero_no_catalogo',
                    '_titulo_ideia_repetido', '_roteiro_revisao_alternativo',
                    '_relacionadas_no_inventario', '_formatar_ideias_verificadas')


INVENTARIO = {'funcoes': {'gerar_senha': {'linha': 10},
                          'morse_converter': {'linha': 20}},
              'hash': 'abc123def456'}
EVIDENCIAS = [{'nome': 'gerar_senha'}]


def item(titulo, ref='gerar_senha'):
    return {'titulo': titulo, 'justificativa': 'para uso diario',
            'beneficio': 'b', 'risco': 'c', 'teste': 'd', 'funcoes': [ref]}


class NotaRefsRepetidas(unittest.TestCase):
    def setUp(self):
        self.env = env_r39()

    def test_todos_na_mesma_ref_unica_gera_nota(self):
        itens = [item('Controle de enxadas'), item('Registro de ordenha'),
                 item('Inventario de ferramentas do sitio')]
        saida = self.env['_formatar_ideias_verificadas'](
            json.dumps({'ideias': itens}, ensure_ascii=False),
            INVENTARIO, EVIDENCIAS, 3, [], [])
        self.assertIn('validos: 3/3', saida)
        self.assertIn('ATENCAO r39: todas as sugestoes citaram a MESMA unica referencia (gerar_senha)',
                      saida)

    def test_refs_diversas_nao_geram_nota(self):
        itens = [item('A'), item('B', ref='morse_converter')]
        saida = self.env['_formatar_ideias_verificadas'](
            json.dumps({'ideias': itens}, ensure_ascii=False),
            INVENTARIO, EVIDENCIAS, 2, [], [])
        self.assertIn('validos: 2/2', saida)
        self.assertNotIn('ATENCAO r39', saida)

    def test_uma_sugestao_so_nao_gera_nota(self):
        saida = self.env['_formatar_ideias_verificadas'](
            json.dumps({'ideias': [item('A')]}, ensure_ascii=False),
            INVENTARIO, EVIDENCIAS, 1, [], [])
        self.assertIn('validos: 1/1', saida)
        self.assertNotIn('ATENCAO r39', saida)

    def test_dois_invalidos_vao_como_parciais_sem_nota_de_ancora(self):
        itens = [{'titulo': 'C', 'justificativa': 'j', 'beneficio': 'b',
                  'risco': 'c', 'teste': 'd', 'funcoes': ['nao_existe']},
                 {'titulo': 'D', 'justificativa': 'j', 'beneficio': 'b',
                  'risco': 'c', 'teste': 'd', 'funcoes': ['nao_existe']}]
        saida = self.env['_formatar_ideias_verificadas'](
            json.dumps({'ideias': itens}, ensure_ascii=False),
            INVENTARIO, EVIDENCIAS, 2, [], [])
        self.assertIn('validos: 2/2', saida)
        self.assertNotIn('ATENCAO r39', saida)
        self.assertIn('2 sem referencia verificada', saida)

    def test_auto_verificadas_na_mesma_ref_geram_nota(self):
        itens = [{'titulo': 'Ordem do morse converter', 'justificativa': 'ajudar o morse_converter',
                  'beneficio': 'b', 'risco': 'c', 'teste': 'd', 'funcoes': ['nao_existe']},
                 {'titulo': 'Manual do morse converter', 'justificativa': 'melhorar o morse_converter',
                  'beneficio': 'b', 'risco': 'c', 'teste': 'd', 'funcoes': ['nao_existe']}]
        saida = self.env['_formatar_ideias_verificadas'](
            json.dumps({'ideias': itens}, ensure_ascii=False),
            INVENTARIO, EVIDENCIAS, 2, [], [])
        self.assertIn('validos: 2/2', saida)
        self.assertIn('ATENCAO r39: todas as sugestoes citaram a MESMA unica referencia (morse_converter)',
                      saida)


if __name__ == '__main__':
    unittest.main()
