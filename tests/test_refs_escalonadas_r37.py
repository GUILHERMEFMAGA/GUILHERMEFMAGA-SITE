"""r37: referencia em niveis nas ideias da conversa livre — citacao falsa
nunca e exibida como verificada; auto-verificacao pelo programa quando o
modelo cita o nome real no texto; sem referencia = parcial honesto.
AST isolado; sem rede, sem GGUF."""
import json
import unittest
from test_roteamento_conversa import carregar


def env_r37():
    return carregar('_norm_pt', '_r26_propostas_catalogo',
                    '_r31_ideia_ja_existe', '_r31_numero_no_catalogo',
                    '_titulo_ideia_repetido', '_roteiro_revisao_alternativo',
                    '_relacionadas_no_inventario', '_formatar_ideias_verificadas')


INVENTARIO = {'funcoes': {'gerar_senha': {'linha': 10},
                          'morse_converter': {'linha': 20},
                          'ler': {'linha': 30}},
              'hash': 'abc123def456'}
EVIDENCIAS = [{'nome': 'gerar_senha'}]


def base_item(titulo, justificativa='para uso diario'):
    return {'titulo': titulo, 'justificativa': justificativa,
            'beneficio': 'b', 'risco': 'c', 'teste': 'd'}


class NiveisDeReferencia(unittest.TestCase):
    def setUp(self):
        self.env = env_r37()

    def formatar(self, itens):
        return self.env['_formatar_ideias_verificadas'](
            json.dumps({'ideias': itens}, ensure_ascii=False),
            INVENTARIO, EVIDENCIAS, len(itens), [], [])

    def test_refs_validas_continuam_sem_marcador(self):
        item = base_item('Organizador de gavetas')
        item['funcoes'] = ['gerar_senha']
        saida = self.formatar([item])
        self.assertIn('validos: 1/1', saida)
        self.assertNotIn('sem referencia', saida)
        self.assertIn('gerar_senha (linha 10)', saida)

    def test_sem_funcoes_vira_parcial_honesto(self):
        saida = self.formatar([base_item('Controle de enxadas')])
        self.assertIn('validos: 1/1', saida)
        self.assertIn('[parcial: sem referencia verificada no codigo]', saida)
        self.assertIn('nenhuma verificada (parcial)', saida)
        self.assertIn('1 sem referencia verificada', saida)

    def test_citacao_falsa_nao_e_exibida_mas_ideia_vira_parcial(self):
        item = base_item('Inventada sem pe')
        item['funcoes'] = ['nao_existe']
        saida = self.formatar([item])
        self.assertIn('validos: 1/1', saida)
        self.assertNotIn('nao_existe (linha', saida)
        self.assertIn('[parcial: sem referencia verificada no codigo]', saida)

    def test_auto_verificacao_quando_o_nome_real_esta_no_texto(self):
        item = base_item('Melhorias para o morse converter',
                         justificativa='ajudar o morse_converter do dia a dia')
        item['funcoes'] = ['nao_existe']
        saida = self.formatar([item])
        self.assertIn('validos: 1/1', saida)
        self.assertIn('[referencia auto-verificada no codigo]', saida)
        self.assertIn('morse_converter (linha 20)', saida)
        self.assertIn('1 com referencia auto-verificada', saida)

    def test_nome_curto_nao_vira_auto_referencia(self):
        item = base_item('Simples leitor',
                         justificativa='melhorar o ler do sistema')
        item['funcoes'] = ['nao_existe']
        saida = self.formatar([item])
        self.assertIn('[parcial: sem referencia verificada no codigo]', saida)
        self.assertNotIn('ler (linha 30)', saida)


class ContratoAntigoAtualizado(unittest.TestCase):
    def test_sem_titulo_ou_justificativa_continua_descartado(self):
        env = env_r37()
        saida = env['_formatar_ideias_verificadas']('{"ideias": [{}]}', INVENTARIO, [], 3)
        self.assertIn('validos: 0/3', saida)


if __name__ == '__main__':
    unittest.main()
