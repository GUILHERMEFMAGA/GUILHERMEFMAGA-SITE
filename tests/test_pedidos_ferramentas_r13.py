import unittest
from unittest.mock import Mock
from contextlib import redirect_stdout
from io import StringIO
from test_roteamento_conversa import carregar

FRASE = ('quais ferramentas vc ainda não tem me de uma lista grande de ferramentas '
         'e funções que vc ainda não tem? faça lista de 100')


class PedidosFerramentas(unittest.TestCase):
    def test_ausencia_de_recursos_e_quantidade(self):
        env = carregar('_norm_pt', '_pedido_ideias_do_agente', '_quantidade_lista_local')
        for texto in [FRASE, 'quais funções você não possui?', 'que recursos faltam no agente?']:
            self.assertTrue(env['_pedido_ideias_do_agente'](texto), texto)
        for texto in ['quais ferramentas meu vizinho não tem?', 'quais ferramentas você tem?',
                      'adicione ferramentas que você não tem', 'qual a função do teclado?']:
            self.assertFalse(env['_pedido_ideias_do_agente'](texto), texto)
        self.assertEqual(env['_quantidade_lista_local'](FRASE), 100)
        self.assertEqual(env['_quantidade_lista_local']('lista com 40'), 40)
        self.assertEqual(env['_quantidade_lista_local']('arquivo 100.py'), 0)

    def test_frase_real_nao_chega_a_conversa_generica(self):
        for nuvem in (False, True):
            analise = Mock(return_value='Lote de ate 5 propostas; ausencia nao comprovada.')
            env = carregar('processar_atalho_rapido', '_norm_pt', '_pedido_ideias_do_agente',
                           config={'usar_ia_nuvem': nuvem},
                           _resposta_contextual_curta=lambda *args: None,
                           _comandos_precisao_local=lambda _: False,
                           _menu_avancado_codigo=lambda _: False,
                           _historico_ideias_local=lambda _: False,
                           _processar_autoedicao_controlada=lambda _: False,
                           _interacao_e_feedback_local=lambda _: False,
                           _configurar_conversa_local=lambda _: False,
                           _sugerir_ideias_do_codigo=analise,
                           historico_conversas=[], salvar_historico=Mock())
            with redirect_stdout(StringIO()):
                self.assertTrue(env['processar_atalho_rapido'](FRASE))
            analise.assert_called_once_with(FRASE)


if __name__ == '__main__':
    unittest.main()
