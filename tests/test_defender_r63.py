"""r63: 'historico de protecao' — o usuario perguntou DENTRO do agente e o
modelo bruto respondeu texto de apostila (a doenca r61 de novo). Agora o
agente responde com FATOS: le o historico real do Windows Defender via
Get-MpThreatDetection; vazio = celebra sem inventar; falha = ensina o
caminho da janela. Nada de conselho generico."""
import io
import os
import unittest
from contextlib import redirect_stdout

from test_roteamento_conversa import carregar


class LeituraDoHistorico(unittest.TestCase):
    def _env(self):
        return carregar('_r63_defender_historico', os=os)

    def test_sem_deteccoes_celebra_sem_inventar(self):
        class Falso:
            returncode = 0
            stdout = '\n'
            stderr = ''
        env = self._env()
        saida = env['_r63_defender_historico'](executar=lambda: Falso())
        self.assertIn('[OK] nenhuma deteccao registrada', saida)
        self.assertNotIn('[PROBLEMA]', saida)

    def test_com_deteccoes_lista_data_e_arquivo(self):
        class Falso:
            returncode = 0
            stderr = ''
            stdout = (' 09/12/2026 03:14:22 | C:\\Users\\gfmag\\iniciar.bat\n'
                      ' 08/12/2026 21:00:00 | C:\\Users\\gfmag\\outro.txt\n')
        env = self._env()
        saida = env['_r63_defender_historico'](executar=lambda: Falso())
        self.assertIn('registrou 2 deteccao(oes)', saida)
        self.assertIn('iniciar.bat', saida)
        self.assertIn('Isso e HISTORICO', saida)

    def test_falha_da_o_caminho_da_janela(self):
        def explodir():
            raise RuntimeError('sem powershell')
        env = self._env()
        saida = env['_r63_defender_historico'](executar=explodir)
        self.assertIn('Historico de protecao', saida)
        self.assertIn('RuntimeError', saida)

    def test_codigo_de_erro_mostra_o_detalhe(self):
        class Falso:
            returncode = 1
            stdout = ''
            stderr = 'Get-MpThreatDetection: termo nao reconhecido'
        env = self._env()
        saida = env['_r63_defender_historico'](executar=lambda: Falso())
        self.assertIn('Historico de protecao', saida)
        self.assertIn('termo nao reconhecido', saida)


class Rota(unittest.TestCase):
    def test_frases_do_usuario_caiem_no_fato(self):
        env = carregar('_r63_comandos', '_r63_defender_historico', '_norm_pt', os=os)
        vistos = []

        def fake():
            vistos.append(1)
            return 'FATOS'
        env['_r63_defender_historico'] = fake
        for frase in ('historico de proteção', 'Histórico de proteção do defender',
                      'historico do defender', 'historico defender'):
            with redirect_stdout(io.StringIO()):
                self.assertTrue(env['_r63_comandos'](frase), frase)
        self.assertEqual(len(vistos), 4)
        # 'defender' NUA nao e nossa (ja existe rota de status dele)
        with redirect_stdout(io.StringIO()):
            self.assertFalse(env['_r63_comandos']('defender'))
            self.assertFalse(env['_r63_comandos']('status'))
            self.assertFalse(env['_r63_comandos']('me defenda do covid'))
        self.assertEqual(len(vistos), 4)


class Estrutura(unittest.TestCase):
    def test_cadeia_menu_e_selo(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        self.assertLess(texto.index('if _r63_comandos(comando):'),
                        texto.index('if _r62_comandos(comando):'))
        self.assertIn("DEFENDER (r63): 'historico de protecao'", texto)
        self.assertIn('status defender', texto)  # rota antiga preservada
        self.assertEqual(texto.count('[Motor e avaliacao local 2026-09-11-r69]'), 1)


if __name__ == '__main__':
    unittest.main()
