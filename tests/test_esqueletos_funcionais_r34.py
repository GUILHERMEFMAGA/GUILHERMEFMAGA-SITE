"""r34: esqueletos FUNCIONAIS (MVP que roda) + teste de amostra gerado junto.
AST isolado; os corpos gerados sao executados AQUI nos testes (template
controlado, sem efeitos externos); sem rede, sem GGUF."""
import io
import os
import tempfile
import types
import unittest
from test_roteamento_conversa import carregar


def capturar(funcao, *args):
    import contextlib
    tampao = io.StringIO()
    with contextlib.redirect_stdout(tampao):
        return funcao(*args), tampao.getvalue()


def env_r34(ferramentas=(), catalogo=None):
    pasta = tempfile.mkdtemp()
    base = dict(PASTA_BASE=pasta,
                tools=[types.SimpleNamespace(name=n, description='desc') for n in ferramentas])
    if catalogo is not None:
        docs = os.path.join(pasta, 'docs')
        os.makedirs(docs, exist_ok=True)
        with open(os.path.join(docs, 'CATALOGO_PROPOSTAS_FERRAMENTAS.md'), 'w',
                  encoding='utf-8') as f:
            f.write(catalogo)
        base['__file__'] = os.path.join(pasta, 'agente.py')
    return carregar('_norm_pt', '_r26_palavras', '_r26_propostas_catalogo',
                    '_r29_pasta_esqueletos', '_r29_nome_seguro',
                    '_r30_analisar_ideia', '_r29_gerar_esqueleto', '_r29_listar',
                    '_r29_abrir', '_r29_comandos', '_r32_conferir_codigo',
                    '_r32_conferir_esqueletos', '_r32_analisar_agente',
                    '_r32_comandos', '_r34_padrao_funcional',
                    '_r34_gerar_teste', **base), pasta


def executar_corpo(codigo):
    """Executa o corpo do MVP gerado (template controlado) e devolve o modulo."""
    ambiente = {}
    exec(compile(codigo, 'mvp_gerado', 'exec'), ambiente)
    return ambiente


class PadroesReconhecidos(unittest.TestCase):
    def test_categorias_detectadas(self):
        env, _ = env_r34()
        for ideia, esperado in (('conversor de metro para polegada', 'conversor'),
                                ('validador de placa antiga', 'validador'),
                                ('gerador de apelidos', 'gerador/sorteador'),
                                ('sorteador de times', 'gerador/sorteador'),
                                ('medidor de gastos da oficina', 'contador/medidor'),
                                ('contar palavras do texto', 'contador/medidor')):
            categoria, corpo = env['_r34_padrao_funcional'](ideia)
            self.assertEqual(categoria, esperado, ideia)
            self.assertIn('def ', corpo)
        categoria2, corpo2 = env['_r34_padrao_funcional']('cata vento quimico')
        self.assertEqual((categoria2, corpo2), ('', None))


class MvpRodamDeVerdade(unittest.TestCase):
    def setUp(self):
        self.env, _ = env_r34()

    def corpo(self, ideia):
        _, corpo = self.env['_r34_padrao_funcional'](ideia)
        return executar_corpo(corpo.replace('_NOME_', 'teste_fn').replace('_IDEIA_', ideia))

    def test_conversor_funciona(self):
        modulo = self.corpo('conversor de metro para polegada')
        saida = modulo['teste_fn']('10 metro para centimetro')
        self.assertIn('1000.0', saida)
        with self.assertRaises(ValueError):
            modulo['teste_fn']('10 metro para parsec')  # nao cadastrado

    def test_validador_funciona(self):
        modulo = self.corpo('validador de placa antiga')
        self.assertIn('SIM', modulo['teste_fn']('ABC-1234'))
        self.assertIn('NAO', modulo['teste_fn']('xyz'))

    def test_gerador_funciona(self):
        modulo = self.corpo('gerador de codigos')
        linhas = modulo['teste_fn']('', quantidade='4').splitlines()
        self.assertEqual(len(linhas), 4)

    def test_medidor_funciona(self):
        modulo = self.corpo('medidor de gastos')
        saida = modulo['teste_fn']('2 4 6')
        self.assertIn('soma: 12.0', saida)
        self.assertIn('media: 4.0', saida)


class GeracaoCompletaComTeste(unittest.TestCase):
    def test_esqueleto_mvp_com_teste_junto(self):
        env, pasta = env_r34()
        _, msg = capturar(env['_r29_comandos'], 'esqueleto de ideia: conversor de minutos para horas')
        self.assertIn('Esqueleto criado', msg)
        self.assertIn('CORPO FUNCIONAL', msg)
        self.assertIn('O corpo JA RODA como conversor minimo (MVP r34)', msg)
        self.assertIn('Teste de amostra:', msg)
        esqueleto = os.path.join(pasta, 'esqueletos_ideias', 'conversor_de_minutos_para_horas.py')
        teste = os.path.join(pasta, 'esqueletos_ideias', 'testes',
                             'test_conversor_de_minutos_para_horas.py')
        self.assertTrue(os.path.exists(esqueleto))
        self.assertTrue(os.path.exists(teste))
        conteudo = io.open(esqueleto, encoding='utf-8').read()
        self.assertIn('MVP r34', conteudo)
        self.assertNotIn('NotImplementedError', conteudo)
        self.assertIn('CONVERSOES', conteudo)

    def test_esqueleto_sem_padrao_continua_honesto(self):
        env, pasta = env_r34()
        _, msg = capturar(env['_r29_comandos'], 'esqueleto de ideia: cata vento quimico')
        self.assertIn('Corpo ainda e template honesto', msg)
        teste = os.path.join(pasta, 'esqueletos_ideias', 'testes', 'test_cata_vento_quimico.py')
        self.assertTrue(os.path.exists(teste))
        self.assertIn('NotImplementedError', io.open(teste, encoding='utf-8').read())


class ConferirValidaTestes(unittest.TestCase):
    def test_conferir_esqueletos_inclui_pasta_testes(self):
        env, pasta = env_r34()
        capturar(env['_r29_comandos'], 'esqueleto de ideia: validador de cpf falso')
        pasta_testes = os.path.join(pasta, 'esqueletos_ideias', 'testes')
        with open(os.path.join(pasta_testes, 'test_quebrado.py'), 'w', encoding='utf-8') as f:
            f.write('def quebrada(:\n  pass\n')
        retorno, saida = capturar(env['_r32_comandos'], 'conferir esqueletos')
        self.assertTrue(retorno)
        self.assertIn('testes/test_quebrado.py', saida)
        self.assertIn('QUEBRADO', saida)


if __name__ == '__main__':
    unittest.main()
