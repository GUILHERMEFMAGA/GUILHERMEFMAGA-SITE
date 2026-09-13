"""r44: arranque instantaneo — BAT sem downloads em toda abertura (validade
de 12h + 'iniciar.bat atualizar' para forcar), checagem de bibliotecas por
find_spec (sem importar langchain) e agente com imports tardios (pywhatkit,
pandas, classe do Gemini). Verificacao por TEXTO do BAT e AST do agente;
sem rede, sem GGUF, sem executar o agente."""
import ast
import io
import unittest
from contextlib import redirect_stdout

from test_roteamento_conversa import SOURCE

BRANCH = 'arena/01a08d8e-guilhermefmaga-site'


def texto_bat():
    with io.open(str(SOURCE.parent / 'iniciar.bat'), encoding='utf-8') as f:
        return f.read()


def ast_agente():
    with io.open(str(SOURCE), encoding='utf-8') as f:
        return ast.parse(f.read())


class BatArranqueRapido(unittest.TestCase):
    def test_bibliotecas_por_find_spec_sem_importar(self):
        # r49: o find_spec morou no main.py (decisao dentro do processo);
        # o BAT nao importa biblioteca nenhuma para checar nada.
        with io.open(str(SOURCE.parent / 'main.py'), encoding='utf-8') as f:
            main_py = f.read()
        self.assertIn("find_spec('langchain_openai')", main_py)
        self.assertIn("find_spec('langchain_google_genai')", main_py)
        bat = texto_bat()
        self.assertNotIn('python -c "import langchain_openai"', bat)
        self.assertNotIn('python -c "import langchain_google_genai"', bat)

    def test_verificacao_com_validade_e_forcar(self):
        bat = texto_bat()
        self.assertIn('.ultima_verificacao', bat)
        self.assertIn('if /i not "%~1"=="atualizar" goto lancar', bat)
        # carimbo velho -> verifica; fresco -> abre direto (decisao no main.py, r49)
        with io.open(str(SOURCE.parent / 'main.py'), encoding='utf-8') as f:
            self.assertIn('< 43200', f.read())
        # fluxo SEM_ATUALIZAR intacto: vai direto para o agente
        self.assertIn('if exist "SEM_ATUALIZAR.txt" goto lancar', bat)

    def test_urls_e_mecanismo_de_troca_preservados(self):
        bat = texto_bat()
        self.assertIn(BRANCH + '/agente.py', bat)
        self.assertIn(BRANCH + '/iniciar.bat', bat)
        self.assertIn('agente_backup.py', bat)
        self.assertIn('py_compile agente_novo.py', bat)
        self.assertIn('_atualizacao_iniciar.tmp', bat)
        self.assertIn('move /y "_atualizacao_iniciar.tmp" "iniciar.bat"', bat)
        self.assertIn('python main.py', bat)

    def test_elevacao_repassa_argumento(self):
        bat = texto_bat()
        self.assertIn("-ArgumentList '%*'", bat)

    def test_rotulos_do_fluxo_estao_definidos(self):
        bat = texto_bat()
        for rotulo in (':lancar', ':verificar_agora', ':verificar_bat',
                       ':instalar_libs', ':fim_normal'):
            self.assertIn(rotulo, bat)
        # falha de rede NAO grava carimbo (tenta de novo na proxima abertura)
        self.assertIn('if errorlevel 1 goto verificar_bat', bat)
        self.assertIn('type nul > ".ultima_verificacao"', bat)


class AgenteSemImportPesadoNoArranque(unittest.TestCase):
    def test_nada_de_pywhatkit_pandas_ou_gemini_no_topo(self):
        arvore = ast_agente()
        topo_imports = set()
        for no in arvore.body:
            if isinstance(no, ast.Import):
                for apelido in no.names:
                    topo_imports.add(apelido.name.split('.')[0])
            elif isinstance(no, ast.ImportFrom) and no.module:
                topo_imports.add(no.module.split('.')[0])
        self.assertNotIn('pywhatkit', topo_imports)
        self.assertNotIn('pandas', topo_imports)
        self.assertNotIn('langchain_google_genai', topo_imports)
        self.assertNotIn('pyautogui', topo_imports)  # r45: lazy tambem

    def test_imports_tardios_existem_nas_funcoes(self):
        with io.open(str(SOURCE), encoding='utf-8') as f:
            texto = f.read()
        self.assertEqual(texto.count('import pywhatkit as kit'), 2)
        self.assertIn('import pandas as pd  # r44', texto)
        self.assertIn('def _r44_gemini_classe():', texto)
        self.assertIn('_r44_gemini_classe()', texto)

    def test_selo_r67_no_banner(self):
        with io.open(str(SOURCE), encoding='utf-8') as f:
            texto = f.read()
        self.assertIn('[Motor e avaliacao local 2026-09-11-r67]', texto)


class LazyGemini(unittest.TestCase):
    def test_sem_biblioteca_avisa_uma_vez_e_nao_quebra(self):
        env = carregar_lazy()
        tampao = io.StringIO()
        with redirect_stdout(tampao):
            primeira = env['_r44_gemini_classe']()
            segunda = env['_r44_gemini_classe']()
        # neste venv a langchain_google_genai NAO existe: caching de falha
        self.assertFalse(primeira)
        self.assertFalse(segunda)
        self.assertIn('Gemini desligado', tampao.getvalue())
        self.assertEqual(tampao.getvalue().count('Gemini desligado'), 1)  # avisa UMA vez
        self.assertIs(env['_ChatGoogleGenerativeAI'], False)  # cache da falha gravado

    def test_import_dentro_da_funcao_nao_e_do_topo(self):
        import inspect
        env = carregar_lazy()
        codigo = inspect.getsource(env['_r44_gemini_classe'])
        self.assertIn('from langchain_google_genai import', codigo)


def carregar_lazy():
    from test_roteamento_conversa import carregar
    return carregar('_r44_gemini_classe')


if __name__ == '__main__':
    unittest.main()
