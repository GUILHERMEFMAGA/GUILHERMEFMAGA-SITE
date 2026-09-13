"""r47: instantaneo parte 2 — o decorador @tool virou stub custo-zero e o
import pesado do langchain_core (medido: ~0,48 s) + a decoracao de ~479
ferramentas (~0,75 s) saem do arranque e acontecem UMA vez, dentro de
_garantir_tools(), so quando alguem le a lista `tools`. Estrutura (AST/texto)
+ comportamento do materializador com fabrica fake (sem langchain_core no
teste). Sem rede, sem GGUF, sem executar o agente."""
import ast
import io
import unittest
from types import SimpleNamespace

from test_roteamento_conversa import SOURCE, carregar

LENDO_TOOLS = ('listar_ferramentas', '_painel_status', 'abrir_painel_web',
               '_indice_ferramentas', '_resposta_identidade', 'estatisticas_uso',
               'agente_opinioes', 'estatisticas_poder', 'resumo_ferramentas_por_tema',
               'achar_ferramenta_para_tarefa', '_selecionar_ferramentas',
               '_pegar_agente')


def texto_agente():
    with io.open(str(SOURCE), encoding='utf-8') as f:
        return f.read()


def ast_topo():
    with io.open(str(SOURCE), encoding='utf-8') as f:
        arvore = ast.parse(f.read())
    topo = set()
    for no in arvore.body:
        if isinstance(no, ast.Import):
            topo.update(a.name.split('.')[0] for a in no.names)
        elif isinstance(no, ast.ImportFrom) and no.module:
            topo.add(no.module.split('.')[0])
    return topo


def fonte_da_funcao(texto, nome):
    inicio = texto.index('def ' + nome + '(')
    fim = texto.find('\ndef ', inicio + 1)
    if fim == -1:
        fim = len(texto)
    return texto[inicio:fim]


class EstruturaDoStub(unittest.TestCase):
    def test_topo_sem_langchain_core(self):
        self.assertNotIn('langchain_core', ast_topo())

    def test_stub_e_materializador_existem(self):
        t = texto_agente()
        self.assertIn('def tool(fn):', t)
        self.assertIn('fn._r47_tool = True', t)
        self.assertIn('def _garantir_tools(fabrica=None):', t)
        self.assertIn('from langchain_core.tools import tool as _tool_real', t)
        self.assertIn('tools[:] = prontas', t)

    def test_import_pesado_so_dentro_do_materializador(self):
        t = texto_agente()
        self.assertEqual(t.count('from langchain_core.tools import'), 1)
        self.assertIn('        from langchain_core.tools import tool as _tool_real\n', t)

    def test_os_12_leitores_materializam(self):
        t = texto_agente()
        for nome in LENDO_TOOLS:
            self.assertIn('_garantir_tools()', fonte_da_funcao(t, nome),
                          'faltou materializar em ' + nome)

    def test_literal_tools_intacto_e_selo_r48(self):
        t = texto_agente()
        self.assertIn('\ntools = [\n', t)
        self.assertIn('[Motor e avaliacao local 2026-09-11-r67]', t)
        self.assertIn('Thread(target=falar', t)  # greeting de voz fora do caminho critico


class Comportamento(unittest.TestCase):
    def test_stub_devolve_funcao_marcada(self):
        env = carregar('tool')

        def minha(x=0):
            "doc"
            return x

        devolvida = env['tool'](minha)
        self.assertIs(devolvida, minha)  # custo zero: mesma funcao crua
        self.assertTrue(getattr(devolvida, '_r47_tool', False))

    def test_materializador_troca_marcadas_e_preserva_solta_e_idempotente(self):
        def f_decorada(x=0):
            "doc"
            return x
        f_decorada._r47_tool = True

        def f_solta():
            "doc"
            return 1

        def fabrica_fake(fn):
            return SimpleNamespace(name=fn.__name__, _fabricada_por='fake')

        env = carregar('_garantir_tools', tools=[f_decorada, f_solta])
        primeira = env['_garantir_tools'](fabrica_fake)
        self.assertEqual(primeira[0].name, 'f_decorada')  # virou StructuredTool (fake)
        self.assertIs(primeira[1], f_solta)  # solta permanece como esta
        self.assertTrue(env['_r47_prontas'])
        segunda = env['_garantir_tools'](fabrica_fake)  # idempotente
        self.assertIs(segunda[0], primeira[0])
        self.assertIs(segunda[1], primeira[1])

    def test_materializador_sem_fabrica_usa_langchain_core_real(self):
        try:
            import langchain_core  # noqa: F401
        except ImportError:
            self.skipTest('langchain-core nao instalado neste venv (teste estrutural cobre)')
        # venv tem langchain-core: materializacao de verdade, 1x
        def f_decorada(x=0):
            "doc"
            return x
        f_decorada._r47_tool = True
        env = carregar('_garantir_tools', tools=[f_decorada, 'nao_e_funcao'])
        resultado = env['_garantir_tools']()
        self.assertEqual(getattr(resultado[0], 'name', ''), 'f_decorada')
        self.assertEqual(resultado[1], 'nao_e_funcao')  # entrada estranha preservada


if __name__ == '__main__':
    unittest.main()
