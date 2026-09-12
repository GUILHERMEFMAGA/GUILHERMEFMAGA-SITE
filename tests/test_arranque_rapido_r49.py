"""r49: iniciar.bat ainda mais rapido — o caminho comum agora roda UM python
so. A decisao (carimbo de 12h + bibliotecas via find_spec) mora dentro do
main.py, que so sai com codigo 7 (verificar atualizacao) ou 8 (instalar libs)
quando precisa de algo; o BAT trata os dois codigos e recomeca uma vez.
Verificacao por texto/AST; sem rede, sem GGUF, sem executar o agente."""
import ast
import io
import unittest

from test_roteamento_conversa import SOURCE

BRANCH = 'arena/01a08d8e-guilhermefmaga-site'


def texto(caminho):
    with io.open(caminho, encoding='utf-8') as f:
        return f.read()


def texto_main():
    return texto(str(SOURCE.parent / 'main.py'))


def texto_bat():
    return texto(str(SOURCE.parent / 'iniciar.bat'))


class MainDecideTudo(unittest.TestCase):
    def test_codigos_7_e_8_antes_do_import_do_agente(self):
        corpo = texto_main()
        self.assertIn('sys.exit(7)', corpo)
        self.assertIn('sys.exit(8)', corpo)
        arvore = ast.parse(corpo)
        # import agente e a ultima instrucao do modulo (nada carrega antes)
        self.assertIsInstance(arvore.body[-1], ast.Import)
        self.assertEqual(arvore.body[-1].names[0].name, 'agente')
        # e as checagens usam so stdlib
        self.assertIn('< 43200', corpo)  # 12 horas em segundos
        self.assertIn("find_spec('langchain_openai')", corpo)
        self.assertIn("find_spec('langchain_google_genai')", corpo)

    def test_sem_atualizar_pula_todas_as_checagens(self):
        corpo = texto_main()
        # SEM_ATUALIZAR.txt: nem prazo nem bibliotecas sao checados aqui
        self.assertIn("os.path.isfile(os.path.join(_PASTA, 'SEM_ATUALIZAR.txt'))", corpo)
        self.assertIn('if not os.path.isfile', corpo)


class BatCaminhoRapido(unittest.TestCase):
    def test_um_python_so_e_tratamento_de_7_e_8(self):
        bat = texto_bat()
        self.assertEqual(bat.count('python main.py'), 1)
        self.assertIn('if errorlevel 8 goto instalar_libs', bat)
        self.assertIn('if errorlevel 7 goto verificar_agora', bat)
        self.assertIn('goto lancar', bat)  # depois de verificar/instalar, recomeca
        # a decisao antiga por python -c saiu do BAT
        self.assertNotIn("python -c \"import os, sys, time", bat)

    def test_atualizar_forca_e_recomeca(self):
        bat = texto_bat()
        self.assertIn('if /i not "%~1"=="atualizar" goto lancar', bat)
        self.assertIn('if exist ".ultima_verificacao" del /q ".ultima_verificacao"', bat)
        self.assertIn(':verificar_agora', bat)
        self.assertIn('type nul > ".ultima_verificacao"', bat)

    def test_protecoes_e_urls_preservadas(self):
        bat = texto_bat()
        self.assertIn('if exist "SEM_ATUALIZAR.txt" goto lancar', bat)
        self.assertIn('if errorlevel 1 goto verificar_bat', bat)  # falha de rede: sem carimbo
        self.assertIn(BRANCH + '/agente.py', bat)
        self.assertIn(BRANCH + '/iniciar.bat', bat)
        self.assertIn('agente_backup.py', bat)
        self.assertIn('py_compile agente_novo.py', bat)
        self.assertIn("move /y \"_atualizacao_iniciar.tmp\" \"iniciar.bat\"", bat)
        self.assertIn("-ArgumentList '%*'", bat)
        self.assertIn('if /i not "%~nx0"=="iniciar.bat"', bat)


class EntregaDoMainEFallback(unittest.TestCase):
    def test_bat_baixa_o_main_py_na_verificacao(self):
        bat = texto_bat()
        self.assertIn(BRANCH + '/main.py?cache=', bat)
        self.assertIn("Lancador main.py em dia.", bat)

    def test_fallback_sem_main_py_nunca_bricka(self):
        bat = texto_bat()
        self.assertIn('if not exist "main.py" goto lancar_antigo', bat)
        self.assertIn(':lancar_antigo', bat)
        self.assertIn('python agente.py', bat)  # roda do jeito antigo, funciona sempre


class ContagemDeProcessos(unittest.TestCase):
    def test_caminho_rapido_tem_um_processo_python_e_zero_extras(self):
        bat = texto_bat()
        # o fast path (lancar -> python main.py -> fim_normal) nao passa por
        # powershell nem por python auxiliar
        secao = bat.split(':lancar', 1)[1].split(':verificar_agora', 1)[0]
        self.assertIn('python main.py', secao)
        self.assertNotIn('powershell', secao)
        self.assertNotIn('python -c', secao)


if __name__ == '__main__':
    unittest.main()
