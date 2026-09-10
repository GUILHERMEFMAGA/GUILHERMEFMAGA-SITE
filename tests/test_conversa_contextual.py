import unittest
from datetime import datetime, timezone
from unittest.mock import Mock
from contextlib import redirect_stdout
from io import StringIO
from test_roteamento_conversa import carregar


class ConversaContextual(unittest.TestCase):
    def resposta(self, texto, hora, config=None):
        env = carregar('_norm_pt', '_resposta_contextual_curta')
        return env['_resposta_contextual_curta'](texto, config or {}, hora)

    def test_relogio_em_brasilia_e_virada_da_data(self):
        r = self.resposta('agora e noite ou dia em Ribeirão Preto',
                          datetime(2026, 9, 9, 1, 30, tzinfo=timezone.utc))
        self.assertIn('22:30', r)
        self.assertIn('08/09/2026', r)
        self.assertIn('noite', r)
        self.assertIn('nao verifica a luz', r)

    def test_periodos(self):
        for hora, esperado in [(6, 'madrugada'), (12, 'manha'), (18, 'tarde')]:
            r = self.resposta('é dia ou noite em Ribeirão Preto?',
                              datetime(2026, 9, 9, hora, tzinfo=timezone.utc))
            self.assertIn(esperado, r)

    def test_humor_e_limites(self):
        r = self.resposta('vc esta de bom humor?', None)
        self.assertIn('papo mais leve', r)
        self.assertIn('nao um sentimento', r)
        self.assertIn('mais serio', self.resposta('vc esta de bom humor?', None,
                                                 {'humor_local': 'desligado'}))
        self.assertIsNone(self.resposta('qual o horario em Tokyo?', None))
        self.assertIsNone(self.resposta('abra o youtube', None))

    def test_fluxo_nao_invoca_ferramentas_nem_modelo(self):
        for texto in ['vc esta de bom humor?', 'agora e noite ou dia em Ribeirão Preto']:
            env = carregar('processar_atalho_rapido', '_norm_pt', '_resposta_contextual_curta',
                           config={}, historico_conversas=[], salvar_historico=Mock())
            with redirect_stdout(StringIO()):
                self.assertTrue(env['processar_atalho_rapido'](texto))
            self.assertEqual(env['historico_conversas'][0]['content'], texto)
            env['salvar_historico'].assert_called_once()


if __name__ == '__main__':
    unittest.main()
