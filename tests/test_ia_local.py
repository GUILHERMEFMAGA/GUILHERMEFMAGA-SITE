"""Testa o caminho local sem carregar modelo ou iniciar o agente."""
import unittest
from unittest.mock import Mock
from test_roteamento_conversa import carregar


class IALocal(unittest.TestCase):
    def ambiente(self, **extras):
        return carregar('_perfil_resposta_local', '_quantidade_lista_local', '_contar_itens_lista_local',
                        '_montar_contexto_local', 'perguntar_ia_local',
                        '_resposta_da_neural',
                        _sys_ia_local=lambda: 'Sistema', config={}, **extras)

    def test_historico_limitado_sem_modificar_memoria(self):
        historico = [{'role': 'user' if i % 2 == 0 else 'assistant',
                      'content': str(i) * 1500} for i in range(6)]
        original = [dict(m) for m in historico]
        msgs = self.ambiente()['_montar_contexto_local']('pergunta', historico)
        self.assertLessEqual(sum(len(m['content']) for m in msgs[1:-1]), 2400)
        self.assertEqual(historico, original)
        self.assertEqual(msgs[-1]['content'], 'pergunta')

    def test_pergunta_nao_duplicada_nem_cortada(self):
        pergunta = 'pergunta longa ' * 500
        msgs = self.ambiente()['_montar_contexto_local'](
            pergunta, [{'role': 'user', 'content': pergunta}])
        self.assertEqual(len(msgs), 2)
        self.assertEqual(msgs[-1]['content'], pergunta)

    def test_uma_geracao_sem_forcar_admin(self):
        chamada = Mock(return_value='Nao consigo confirmar essa permissao.')
        env = self.ambiente(_chamar_neural=chamada)
        self.assertIn('Nao consigo', env['perguntar_ia_local']('Tenho admin?'))
        chamada.assert_called_once()

    def test_lista_completa_tem_orcamento_maior(self):
        texto = '\n'.join(f'{i}. Ideia {i}' for i in range(1, 51))
        chamada = Mock(return_value=texto)
        env = self.ambiente(_chamar_neural=chamada)
        resposta = env['perguntar_ia_local']('me de 50 ideias que vc queria ter dentro de vc?')
        self.assertNotIn('[Aviso', resposta)
        self.assertGreater(chamada.call_args.kwargs['max_tokens'], 350)
        self.assertLessEqual(chamada.call_args.kwargs['max_tokens'], 1800)
        chamada.assert_called_once()

    def test_lista_incompleta_avisa_sem_repetir_geracao(self):
        chamada = Mock(return_value='1. Uma ideia\n2. Outra ideia')
        env = self.ambiente(_chamar_neural=chamada)
        resposta = env['perguntar_ia_local']('liste 50 ideias')
        self.assertIn('identifiquei 2 itens', resposta)
        self.assertIn('voce pediu 50', resposta)
        chamada.assert_called_once()

    def test_limite_e_contagem(self):
        env = self.ambiente(_chamar_neural=Mock(return_value='Sem lista'))
        self.assertEqual(env['_quantidade_lista_local']('arquivo 50.py'), 0)
        self.assertEqual(env['_contar_itens_lista_local']('1. a\n1. b\n3. c'), 1)
        self.assertIn('limite por resposta e 50',
                      env['perguntar_ia_local']('liste 1000 ideias'))

    def test_vazio_nao_vira_sucesso(self):
        env = self.ambiente(_chamar_neural=Mock(return_value='  '))
        with self.assertRaises(ValueError):
            env['perguntar_ia_local']('oi')
        with self.assertRaises(ValueError):
            env['perguntar_ia_local'](' ')

    def test_falha_nao_reinicia_motor_saudavel(self):
        subir = Mock()
        env = self.ambiente(ia_local_disponivel=lambda: True,
                            _chamar_neural=Mock(side_effect=TimeoutError),
                            historico_conversas=[], preparar_ia_local=subir)
        self.assertIsNone(env['_resposta_da_neural']('oi', tentar_subir=True))
        subir.assert_not_called()


if __name__ == '__main__':
    unittest.main()
