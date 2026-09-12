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
    def test_r49_um_python_so_no_caminho_rapido(self):
        # r49: a decisao mora DENTRO do main.py; o BAT roda UM python so e
        # so volta a ele (uma vez) quando o main.py pede (codigos 7/8).
        bat = texto_bat()
        self.assertEqual(bat.count('python main.py'), 1)
        self.assertIn('if errorlevel 8 goto instalar_libs', bat)
        self.assertIn('if errorlevel 7 goto verificar_agora', bat)
        self.assertEqual(bat.count('find_spec'), 0)  # decisao nao e mais do BAT
        self.assertNotIn('TotalHours', bat)
        self.assertIn(':verificar_agora', bat)
        self.assertIn('goto lancar', bat)  # recomeca com carimbo em dia

    def test_fluxos_e_protecoes_preservados(self):
        bat = texto_bat()
        self.assertIn('if exist "SEM_ATUALIZAR.txt" goto lancar', bat)
        self.assertIn('if /i not "%~1"=="atualizar" goto lancar', bat)
        self.assertIn(BRANCH + '/agente.py', bat)
        self.assertIn(BRANCH + '/iniciar.bat', bat)
        self.assertIn('type nul > ".ultima_verificacao"', bat)
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
        # r47: langchain_core saiu do topo — @tool virou stub e o import real
        # acontece dentro de _garantir_tools() na primeira leitura da lista
        self.assertNotIn('langchain_core', topo)

    def test_create_agent_somente_no_caminho_da_nuvem(self):
        t = texto_agente()
        self.assertEqual(t.count('from langchain.agents import create_agent'), 1)
        self.assertIn('        from langchain.agents import create_agent  # r45: import so no caminho da nuvem\n', t)

    def test_pyautogui_totalmente_via_accessor(self):
        t = texto_agente()
        self.assertEqual(t.count('_r45_pyautogui().'), 18)  # r51: +1 em _r51_capturar_quadro
        self.assertEqual(t.count('pyautogui.'), 0)  # nenhum uso direto sobrando
        self.assertIn('def _r45_pyautogui():', t)

    def test_pypdf_somente_import_local(self):
        t = texto_agente()
        self.assertNotIn('\nfrom pypdf import PdfReader', t)  # sem import no nivel 0
        self.assertEqual(t.count('from pypdf import PdfReader'), 5)  # 4 + catalogar_pdfs (r52)

    def test_embeddings_somente_via_accessor(self):
        t = texto_agente()
        self.assertNotIn('\nembeddings_model', t)  # global de arranque sumiu
        self.assertEqual(t.count('GoogleGenerativeAIEmbeddings'), 2)  # import+chamada, so no accessor
        self.assertIn('def _r45_embeddings_model():', t)
        self.assertEqual(t.count('_r45_embeddings_model()'), 4)  # def + comentario + 2 usos

    def test_selo_r56_no_banner(self):
        self.assertIn('[Motor e avaliacao local 2026-09-11-r56]', texto_agente())


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
