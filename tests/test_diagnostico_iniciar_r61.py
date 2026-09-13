"""r61: 'diagnostico do iniciar' — o usuario perguntou POR QUE o iniciar.bat
nao funciona e o modelo bruto respondeu com invencao (renomear pra .exe!).
Agora existe resposta com FATOS: existencia, marcadores da versao atual (BAT
r59+/r57+, main.py com escudo), fim de linha CRLF e compilacao dos .py — tudo
lido do disco, sem rede, sem imaginacao."""
import io
import os
import tempfile
import unittest
from contextlib import redirect_stdout

from test_roteamento_conversa import carregar

BAT_SAUDAVEL = ('@echo off\r\n' + 'REM linha de preenchimento\r\n' * 60
                + ':pedir_admin\r\nset "R58_ARGS="\r\n:quebrou\r\necho ok\r\n')
MAIN_SAUDAVEL = "import os\n\n\ndef _agente_integro():\n    return True\n"


def pasta_saudavel():
    pasta = tempfile.mkdtemp()
    io.open(os.path.join(pasta, 'iniciar.bat'), 'wb').write(BAT_SAUDAVEL.encode('utf-8'))
    io.open(os.path.join(pasta, 'main.py'), 'w', encoding='utf-8').write(MAIN_SAUDAVEL)
    agente = ('# agente falso\n' + '# preenchimento\n' * 6000
              + "print('[Motor e avaliacao local 2026-09-11-r68]')\n")
    io.open(os.path.join(pasta, 'agente.py'), 'w', encoding='utf-8').write(agente)
    return pasta


class DiagnosticoSaudavel(unittest.TestCase):
    def test_tudo_ok_nao_aponta_problema_falso(self):
        env = carregar('_r61_diagnostico_iniciar', '_r61_compila', '_r53_normalizar', os=os)
        saida = env['_r61_diagnostico_iniciar'](pasta=pasta_saudavel())
        self.assertIn('Diagnostico de arranque em:', saida)
        self.assertNotIn('[PROBLEMA]', saida)
        self.assertIn('Tudo saudavel', saida)
        self.assertIn('versao do agente.py: r', saida)  # extracao vale p/ qualquer rN


class DiagnosticoDeProblemas(unittest.TestCase):
    def _env(self):
        return carregar('_r61_diagnostico_iniciar', '_r61_compila', '_r53_normalizar', os=os)

    def test_bat_antigo_e_lf_sao_apontados(self):
        pasta = tempfile.mkdtemp()
        antigo = ('@echo off\n' + 'rem antigo sem parenteses\n' * 60
                  + "powershell -Command \"Start-Process -ArgumentList '%*'\"\n")
        io.open(os.path.join(pasta, 'iniciar.bat'), 'w', encoding='utf-8',
                newline='').write(antigo)
        io.open(os.path.join(pasta, 'main.py'), 'w').write(MAIN_SAUDAVEL)
        io.open(os.path.join(pasta, 'agente.py'), 'w').write('# preenchimento\n' * 6000)
        saida = self._env()['_r61_diagnostico_iniciar'](pasta=pasta)
        self.assertIn('fim de linha errado (LF)', saida)
        self.assertIn('ANTIGO (bug do administrador)', saida)
        self.assertIn('sem o escudo de reparo', saida)
        self.assertIn('Total de problemas: 3', saida)

    def test_agente_corrompido_e_arquivo_faltando(self):
        pasta = tempfile.mkdtemp()
        io.open(os.path.join(pasta, 'iniciar.bat'), 'wb').write(BAT_SAUDAVEL.encode('utf-8'))
        io.open(os.path.join(pasta, 'agente.py'), 'w').write('def quebrado(:\n')
        # main.py nem existe
        saida = self._env()['_r61_diagnostico_iniciar'](pasta=pasta)
        self.assertIn('CORROMPIDO (nao compila)', saida)
        self.assertIn('main.py NAO EXISTE', saida)

    def test_pasta_vazia_aponta_tudo(self):
        saida = self._env()['_r61_diagnostico_iniciar'](pasta=tempfile.mkdtemp())
        self.assertIn('iniciar.bat NAO EXISTE', saida)
        self.assertIn('agente.py NAO EXISTE', saida)
        self.assertIn('main.py NAO EXISTE', saida)


class Rota(unittest.TestCase):
    def test_pergunta_do_usuario_cai_no_diagnostico_real(self):
        def fake_diagnostico():
            return 'FATOS'
        env = carregar('_r61_comandos', '_r53_normalizar', os=os)
        env['_r61_diagnostico_iniciar'] = fake_diagnostico
        tampao = io.StringIO()
        with redirect_stdout(tampao):
            ok = env['_r61_comandos']('porque o iniciar.bat não está funcionando ?')
        self.assertTrue(ok)
        self.assertIn('FATOS', tampao.getvalue())
        with redirect_stdout(io.StringIO()):
            self.assertTrue(env['_r61_comandos']('diagnostico do iniciar'))
            self.assertFalse(env['_r61_comandos']('status'))
            self.assertFalse(env['_r61_comandos']('abra o vscode'))


class Estrutura(unittest.TestCase):
    def test_cadeia_menu_e_selo(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        self.assertLess(texto.index('if _r61_comandos(comando):'),
                        texto.index('if _r53_comandos(comando):'))
        self.assertIn("DIAGNOSTICO (r61): 'diagnostico do iniciar'", texto)
        self.assertEqual(texto.count('[Motor e avaliacao local 2026-09-11-r68]'), 1)


if __name__ == '__main__':
    unittest.main()
