import ast
import copy
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from contextlib import redirect_stdout
from io import StringIO
from test_roteamento_conversa import TREE, carregar


NOMES = ('_arquivos_python_limitados', '_grafo_imports_python', 'mapa_imports_projeto',
         '_comparar_requisitos_local', 'conferir_dependencias_projeto')


def ambiente(pasta=''):
    nos = [copy.deepcopy(n) for n in TREE.body if isinstance(n, ast.FunctionDef) and n.name in NOMES]
    for n in nos:
        n.decorator_list = []
    env = {'PASTA_BASE': pasta}
    exec(compile(ast.Module(body=nos, type_ignores=[]), 'ferramentas_isoladas', 'exec'), env)
    return env


class ProjetosAvancados(unittest.TestCase):
    def test_ciclos_imports_relativos_sem_executar(self):
        with tempfile.TemporaryDirectory() as pasta:
            base = Path(pasta); pkg = base/'src'/'pkg'; pkg.mkdir(parents=True)
            (pkg/'__init__.py').write_text('')
            (pkg/'a.py').write_text('raise RuntimeError("nao executar")\nfrom . import b\n')
            (pkg/'b.py').write_text('import pkg.a\n')
            env = ambiente(pasta)
            grafo, ciclos, avisos = env['_grafo_imports_python'](pasta)
            self.assertIn('pkg.b', grafo['pkg.a'])
            self.assertIn(['pkg.a', 'pkg.b'], ciclos)
            self.assertFalse(avisos)
            self.assertIn('Grupos circulares: 1', env['mapa_imports_projeto'](pasta))

    def test_erro_sintaxe_e_limites(self):
        with tempfile.TemporaryDirectory() as pasta:
            base = Path(pasta)
            (base/'quebrado.py').write_text('def (')
            (base/'grande.py').write_text('#' * 512001)
            (base/'.venv').mkdir(); (base/'.venv'/'ignorado.py').write_text('raise Exception')
            (base/'secret.py').write_text('raise Exception')
            env = ambiente(pasta)
            grafo, _, avisos = env['_grafo_imports_python'](pasta)
            self.assertNotIn('secret', grafo)
            self.assertNotIn('.venv.ignorado', grafo)
            self.assertTrue(any('SyntaxError' in x for x in avisos))
            self.assertTrue(any('512 KB' in x for x in avisos))

    def test_modulos_ambiguos_nao_sao_resolvidos_silenciosamente(self):
        with tempfile.TemporaryDirectory() as pasta:
            base = Path(pasta); (base/'src').mkdir()
            (base/'a.py').write_text(''); (base/'src'/'a.py').write_text('')
            grafo, _, avisos = ambiente(pasta)['_grafo_imports_python'](pasta)
            self.assertNotIn('a', grafo)
            self.assertTrue(any('ambiguo' in a for a in avisos))

    def test_requisitos_versoes_extras_diretivas_sem_vazar_url(self):
        fn = ambiente()['_comparar_requisitos_local']
        linhas = ['demo>=2', 'demo<1', 'ausente==1', 'extra[foo]>=1',
                  'skip; python_version < "1"', '-r segredo.txt',
                  'privado @ https://TOKEN_SECRETO@host/pacote.whl', '###']
        versao = lambda nome: {'demo':'2.0', 'extra':'1.0'}.get(nome)
        r = '\n'.join(fn([(str(i),x) for i,x in enumerate(linhas)], versao))
        self.assertIn('NAO atende', r)
        self.assertIn('nao encontrado', r)
        self.assertIn('marcador nao ativo', r)
        self.assertIn('extras nao foram verificadas', r)
        self.assertNotIn('TOKEN_SECRETO', r)
        self.assertNotIn('segredo.txt', r)

    def test_manifestos_nao_instalam_nem_executam_setup(self):
        with tempfile.TemporaryDirectory() as pasta:
            base = Path(pasta)
            (base/'requirements.txt').write_text('demo>=2\n')
            (base/'pyproject.toml').write_text('[project]\nname="exemplo"\ndependencies=["demo>=1"]\n')
            (base/'setup.py').write_text('raise RuntimeError("nao executar")')
            with patch('importlib.metadata.version', return_value='2.0'):
                r = ambiente(pasta)['conferir_dependencias_projeto'](pasta)
            self.assertIn('atende a declaracao', r)
            self.assertIn('pode NAO ser o ambiente virtual', r)
            self.assertEqual((base/'requirements.txt').read_text(), 'demo>=2\n')

    def test_menu_e_caminho_windows_com_dois_pontos(self):
        invocar = Mock(return_value='Relatorio')
        env = carregar('_norm_pt', '_menu_avancado_codigo', _invocar_local=invocar)
        with redirect_stdout(StringIO()):
            self.assertTrue(env['_menu_avancado_codigo']('mapa de imports: C:\\Meus projetos'))
            self.assertTrue(env['_menu_avancado_codigo']('menu avancado'))
        invocar.assert_called_once_with('mapa_imports_projeto', caminho='C:\\Meus projetos')


if __name__ == '__main__':
    unittest.main()
