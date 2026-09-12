"""r45: arranque AINDA mais rapido — BAT decide tudo em UMA chamada de
Python (saiu o PowerShell da verificacao de prazo), e o agente nao importa
mais pyautogui, pypdf nem o pacote langchain inteiro no arranque (create_agent
so no caminho da nuvem; embeddings do Gemini so na primeira memoria).
Texto do BAT + AST do agente + comportamento dos accessors. Sem rede/GGUF."""
import ast
import io
import unittest
from contextlib import redirect_stdout

from test_roteamento_conversa import SOURCE, carregar

BRANCH = 'arena/01a08d8e-guilhermefmaga-site'


def texto_bat():
    with io.open(str(SOURCE.parent / 'iniciar.bat'), encoding='utf-8') as f:
        return f.read()


def texto_agente():
    with io.open(str(SOURCE), encoding='utf-8') as f:
        return f.read()


class BatUmaChamadaSo(unittest.TestCase):
    def test_decisao_em_um_python_sem_powershell_de_prazo(self):
        bat = texto_bat()
        self.assertIn(':decisao_rapida', bat)
        self.assertIn(':instalar_libs', bat)
        self.assertIn('fresco=os.path.exists(s) and (time.time()-os.stat(s).st_mtime)<43200', bat)
        self.assertIn("u.find_spec('langchain_openai')) and bool(u.find_spec('langchain_google_genai')", bat)
        self.assertEqual(bat.count('find_spec'), 5)  # 4 no codigo (2+2) + 1 em comentario
        self.assertNotIn('TotalHours', bat)  # PowerShell do prazo foi embora

    def test_fluxos_e_protecoes_preservados(self):
        bat = texto_bat()
        self.assertIn('if exist "SEM_ATUALIZAR.txt" goto depois_atualizacao', bat)
        self.assertIn('if /i not "%~1"=="atualizar"', bat)
        self.assertIn(BRANCH + '/agente.py', bat)
        self.assertIn(BRANCH + '/iniciar.bat', bat)
        self.assertIn("if errorlevel 3 goto fazer_verificacao", bat)
        self.assertIn('if errorlevel 2 goto instalar_libs', bat)
        self.assertIn('if errorlevel 1 goto fazer_verificacao', bat)
        self.assertIn('type nul > ".ultima_verificacao"', bat)
        self.assertIn('python agente.py', bat)
        self.assertIn("move /y \"_atualizacao_iniciar.tmp\" \"iniciar.bat\"", bat)
        self.assertIn("-ArgumentList '%*'", bat)


class AgenteArranqueSemPesados(unittest.TestCase):
    def test_topo_sem_langchain_agents_pyautogui_nem_pypdf(self):
        with io.open(str(SOURCE), encoding='utf-8') as f:
            arvore = ast.parse(f.read())
        topo = set()
        for no in arvore.body:
            if isinstance(no, ast.Import):
                topo.update(a.name.split('.')[0] for a in no.names)
            elif isinstance(no, ast.ImportFrom) and no.module:
                topo.add(no.module.split('.')[0])
        self.assertNotIn('pyautogui', topo)
        self.assertNotIn('pypdf', topo)
        self.assertNotIn('langchain.agents', topo)
        self.assertIn('langchain_core', topo)  # @tool das 699 ferramentas

    def test_create_agent_somente_no_caminho_da_nuvem(self):
        t = texto_agente()
        self.assertEqual(t.count('from langchain.agents import create_agent'), 1)
        self.assertIn('        from langchain.agents import create_agent  # r45: import so no caminho da nuvem\n', t)

    def test_pyautogui_totalmente_via_accessor(self):
        t = texto_agente()
        self.assertEqual(t.count('_r45_pyautogui().'), 17)
        self.assertEqual(t.count('pyautogui.'), 0)  # nenhum uso direto sobrando
        self.assertIn('def _r45_pyautogui():', t)

    def test_pypdf_somente_import_local(self):
        t = texto_agente()
        self.assertNotIn('\nfrom pypdf import PdfReader', t)  # sem import no nivel 0
        self.assertEqual(t.count('from pypdf import PdfReader'), 4)  # 4 imports locais

    def test_embeddings_somente_via_accessor(self):
        t = texto_agente()
        self.assertNotIn('\nembeddings_model', t)  # global de arranque sumiu
        self.assertEqual(t.count('GoogleGenerativeAIEmbeddings'), 2)  # import+chamada, so no accessor
        self.assertIn('def _r45_embeddings_model():', t)
        self.assertEqual(t.count('_r45_embeddings_model()'), 4)  # def + comentario + 2 usos

    def test_selo_r45_no_banner(self):
        self.assertIn('[Motor e avaliacao local 2026-09-11-r45]', texto_agente())


class ComportamentoDosAccessors(unittest.TestCase):
    def test_embeddings_sem_chave_devolve_none_e_cacheia(self):
        env = carregar('_r45_embeddings_model')
        saida = env['_r45_embeddings_model']()
        self.assertIsNone(saida)
        self.assertIs(env.get('_r45_emb'), None)

    def test_embeddings_com_chave_e_sem_biblioteca_avisa_uma_vez(self):
        env = carregar('_r45_embeddings_model', _chave_ia=lambda k: 'AIzaFake')
        tampao = io.StringIO()
        with redirect_stdout(tampao):
            saida = env['_r45_embeddings_model']()  # venv: biblioteca ausente
        self.assertIsNone(saida)
        self.assertIn('indisponivel', tampao.getvalue())
        again = env['_r45_embeddings_model']()
        self.assertIsNone(again)
        self.assertEqual(tampao.getvalue().count('indisponivel'), 1)  # cache da falha

    def test_pyautogui_importa_na_primeira_chamada_ou_falha_honesta(self):
        env = carregar('_r45_pyautogui')
        try:
            modulo = env['_r45_pyautogui']()
        except ImportError:
            return  # venv sem pyautogui: falha honesta e tardia (antes quebrava o arranque)
        self.assertIsNotNone(modulo)
        self.assertIs(env.get('_r45_pg'), modulo)


if __name__ == '__main__':
    unittest.main()
