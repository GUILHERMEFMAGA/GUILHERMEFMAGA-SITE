import unittest
from unittest.mock import Mock
from test_roteamento_conversa import carregar
from test_ideias_fundamentadas import NOMES


class RegressoesR12(unittest.TestCase):
    def test_ideias_implicitas_do_agente(self):
        fn = carregar(*NOMES)['_pedido_ideias_do_agente']
        self.assertTrue(fn('me de 50 ideias do que gostaria de ter?'))
        self.assertTrue(fn('qual ideias no seu codigo que ainda vc nao tem tipo ferramentas e funcoes analisando seu codigo e me responde mais de 40 funcoes e ferramenats que vc nao tem?'))
        self.assertFalse(fn('me de 50 ideias de receitas para jantar'))

    def test_controle_pc(self):
        env = carregar('_norm_pt', '_pergunta_de_identidade', _IDENTIDADE_TRECHOS=(),
                       _parece_pedido_de_acao=lambda x: x.startswith('abre'))
        self.assertTrue(env['_pergunta_de_identidade']('vc tem todo controle sobre pc?'))
        self.assertFalse(env['_pergunta_de_identidade']('abre o painel de controle'))

    def test_lista_repetida_nao_conta_como_50(self):
        fn = carregar('_remover_itens_repetidos_local')['_remover_itens_repetidos_local']
        nomes = ['Calculadora de despesas.', 'Plano de foco.', 'Feedback local.', 'Revisao de codigo.']
        r, removidos = fn('\n'.join(f'{i+1}. {nomes[i % 4]}' for i in range(50)))
        self.assertEqual(removidos, 46)
        self.assertEqual(len(r.splitlines()), 4)
        self.assertEqual(r.count('Calculadora'), 1)

    def test_quantidade_funcoes_e_erro_de_digitacao(self):
        fn = carregar('_quantidade_lista_local')['_quantidade_lista_local']
        self.assertEqual(fn('mais de 40 funções e ferramenats'), 41)
        self.assertEqual(fn('50 ferramenats'), 50)

    def test_sobreposicao_considera_funcoes_fora_do_recorte(self):
        fn = carregar('_relacionadas_no_inventario')['_relacionadas_no_inventario']
        inv = {'funcoes': {'central_agenda': {'linha': 10, 'descricao': 'Compromissos'},
                           'pomodoro': {'linha': 20, 'descricao': 'Foco'},
                           'outra': {'linha': 30, 'descricao': 'Imagem'}}}
        nomes = [x[1] for x in fn('Adicionar funções de gerenciamento de tempo', inv)]
        self.assertIn('central_agenda', nomes)
        self.assertIn('pomodoro', nomes)
        self.assertNotIn('outra', nomes)

    def test_lote_informa_limite_mesmo_com_json_invalido(self):
        env = carregar(*NOMES, ia_local_disponivel=lambda: True, _CAMINHO_AGENTE_PY='nao-ler',
                       _chamar_neural=Mock(return_value='texto sem json'))
        env['_inventario_para_ideias'] = lambda _: {'hash':'teste', 'funcoes':
            {'salvar_json': {'nome': 'salvar_json', 'linha':1, 'descricao':'Salva JSON', 'chamadas':[]}}}
        r = env['_sugerir_ideias_do_codigo']('me de 50 ideias do que gostaria de ter?')
        self.assertIn('somente um lote de ate 5', r)
        self.assertIn('Nao consegui estruturar', r)
        self.assertIn('nao gerado pela IA', r)


if __name__ == '__main__':
    unittest.main()
