"""r57: ESCUDO DE ARRANQUE — o relato real foi o iniciar.bat "entrar e sair"
no PC: um agente.py corrompido no disco derruba o `python main.py` com codigo
1 e o BAT ANTIGO nao tentava reparo nenhum (so "encerrado"). Agora: main.py
confere se o agente.py COMPILA antes de importar (corrompido = codigo 7 = o
BAT baixa a versao oficial sozinho) e o BAT tenta 1 reparo automatico; se o
erro voltar, a janela FICA ABERTA pedindo o print. Verificacao por texto/AST;
sem rede, sem executar o agente."""
import ast
import io
import unittest

from test_roteamento_conversa import SOURCE

RAIZ = SOURCE.parent


def texto(nome):
    with io.open(str(RAIZ / nome), encoding='utf-8') as f:
        return f.read()


class EscudoNoMainPy(unittest.TestCase):
    def test_integridade_antes_do_import_e_ultimo_no_modulo(self):
        corpo = texto('main.py')
        arvore = ast.parse(corpo)
        self.assertIsInstance(arvore.body[-1], ast.Import)      # nada carrega antes
        self.assertEqual(arvore.body[-1].names[0].name, 'agente')
        self.assertIn('def _agente_integro', corpo)
        self.assertIn("compile(f.read(), 'agente.py', 'exec')", corpo)
        # a checagem roda dentro do mesmo guard do SEM_ATUALIZAR e sai com 7
        guarda = corpo.split("SEM_ATUALIZAR.txt')):", 1)[1].split('import agente', 1)[0]
        self.assertIn('if not _agente_integro():', guarda)
        self.assertIn('corrompido no disco', guarda)
        self.assertIn('sys.exit(7)', guarda)

    def test_corrompido_e_detectado_pela_propria_funcao(self):
        # roda a logica de _agente_integro num diretorio temporario, sem o agente
        import os
        import tempfile
        corpo = texto('main.py')
        arvore = ast.parse(corpo)
        fn = next(n for n in arvore.body if isinstance(n, ast.FunctionDef)
                  and n.name == '_agente_integro')
        ambiente = {'os': os}
        exec(compile(ast.Module(body=[fn], type_ignores=[]), 'main.py', 'exec'), ambiente)
        pasta = tempfile.mkdtemp()
        bom = os.path.join(pasta, 'agente.py')
        with io.open(bom, 'w', encoding='utf-8') as f:
            f.write('print("ok")\n')
        ambiente['_PASTA'] = pasta
        self.assertTrue(ambiente['_agente_integro']())
        with io.open(bom, 'w', encoding='utf-8') as f:
            f.write('def quebrado(:\n')          # sintaxe quebrada (disco corrompido)
        self.assertFalse(ambiente['_agente_integro']())
        ambiente['_PASTA'] = tempfile.mkdtemp()  # arquivo nem existe
        self.assertFalse(ambiente['_agente_integro']())


class ReparoNoBat(unittest.TestCase):
    def setUp(self):
        self.bat = texto('iniciar.bat')

    def test_toda_saida_com_erro_vai_para_o_reparo(self):
        self.assertEqual(self.bat.count('if errorlevel 1 goto quebrou'), 2)  # lancar + lancar_antigo
        self.assertIn(':quebrou', self.bat)
        # reparo de uma tentativa so: cria a flag, e na recida avisa e PAUSA
        self.assertIn('if exist ".reparo_r57" goto errou_de_novo', self.bat)
        self.assertIn('type nul > ".reparo_r57"', self.bat)
        self.assertIn('goto verificar_agora', self.bat.split(':quebrou', 1)[1])
        self.assertIn('ME MANDE UM PRINT', self.bat.split(':errou_de_novo', 1)[1])
        self.assertIn('pause', self.bat.split(':errou_de_novo', 1)[1])
        # a flag nao sobra: some no encerramento normal e no errou_de_novo
        self.assertIn('if exist ".reparo_r57" del /q ".reparo_r57"', self.bat)

    def test_o_resto_da_estrutura_r49_fica_intacto(self):
        self.assertEqual(self.bat.count('python main.py'), 1)
        self.assertIn('if errorlevel 8 goto instalar_libs', self.bat)
        self.assertIn('if errorlevel 7 goto verificar_agora', self.bat)
        self.assertIn('if errorlevel 1 goto verificar_bat', self.bat)  # rede: sem carimbo
        self.assertIn('if not exist "main.py" goto lancar_antigo', self.bat)
        self.assertIn("move /y \"_atualizacao_iniciar.tmp\" \"iniciar.bat\"", self.bat)

    def test_camino_rapido_continua_sem_processos_extras(self):
        secao = self.bat.split(':lancar', 1)[1].split(':verificar_agora', 1)[0]
        self.assertIn('python main.py', secao)
        self.assertNotIn('powershell', secao)
        self.assertNotIn('python -c', secao)


class Selo(unittest.TestCase):
    def test_banner_r57(self):
        self.assertIn('[Motor e avaliacao local 2026-09-11-r69]', texto('agente.py'))


if __name__ == '__main__':
    unittest.main()
