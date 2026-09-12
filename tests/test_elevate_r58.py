"""r58: o elevate do iniciar.bat morria com duplo clique (sem argumentos):
o PowerShell rejeita -ArgumentList '' e a janela fechava sem abrir nada
(relato real no resgate do PC). Agora: sem argumentos, o Start-Process nem
leva ArgumentList; com argumentos (ex.: iniciar.bat atualizar), segue como
estava. Verificacao por texto; sem rede, sem executar o BAT."""
import io
import unittest

from test_roteamento_conversa import SOURCE

RAIZ = SOURCE.parent


def texto(nome):
    with io.open(str(RAIZ / nome), encoding='utf-8') as f:
        return f.read()


class ElevateSemArgumentos(unittest.TestCase):
    def setUp(self):
        self.bat = texto('iniciar.bat')

    def test_sem_args_o_start_process_nem_leva_argumentlist(self):
        self.assertIn('if "%~1"=="" (', self.bat)
        ramo_vazio = self.bat.split('if "%~1"=="" (', 1)[1].split(') else (', 1)[0]
        self.assertIn("Start-Process -FilePath '%~f0' -Verb RunAs", ramo_vazio)
        self.assertNotIn('ArgumentList', ramo_vazio)

    def test_com_args_o_argumentlist_continua(self):
        secao = self.bat.split('Pedindo permissao de Administrador', 1)[1]
        ramo_args = secao.split(') else (', 1)[1].split('exit /b', 1)[0]
        self.assertIn("-ArgumentList '%*'", ramo_args)
        self.assertIn("-Verb RunAs", ramo_args)

    def test_guardas_r57_preservados(self):
        self.assertEqual(self.bat.count('if errorlevel 1 goto quebrou'), 2)
        self.assertIn(':quebrou', self.bat)
        self.assertIn('if exist ".reparo_r57" goto errou_de_novo', self.bat)
        self.assertEqual(self.bat.count('python main.py'), 1)
        # o teste r45 continuara valendo: -ArgumentList '%*' segue no arquivo
        self.assertIn("-ArgumentList '%*'", self.bat)


class Selo(unittest.TestCase):
    def test_banner_r58(self):
        self.assertIn('[Motor e avaliacao local 2026-09-11-r58]', texto('agente.py'))


if __name__ == '__main__':
    unittest.main()
