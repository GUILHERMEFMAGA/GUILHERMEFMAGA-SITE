"""r55: AUDITORIA PERMANENTE de nomes — nenhuma funcao do agente.py pode
referenciar um nome que nao existe (import, global, builtin ou local). Foi
essa varredura que achou as 2 ferramentas mortas por `timedelta` sem import
(agendar_desligamento e dias_uteis_entre_datas) — o self-healing mascarava
como "erro generico". Este teste impede que volte a acontecer."""
import ast
import builtins
import datetime
import io
import unittest
from contextlib import redirect_stdout
from unittest.mock import Mock

from test_roteamento_conversa import SOURCE, carregar

BUILTINS = set(dir(builtins)) | {'__file__', '__name__', '__doc__', '__spec__',
                                 '__loader__', '__package__'}


def nomes_definidos_no_modulo(arvore):
    definidos = set(BUILTINS)
    for no in arvore.body:
        if isinstance(no, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            definidos.add(no.name)
        elif isinstance(no, ast.Import):
            for a in no.names:
                definidos.add((a.asname or a.name).split('.')[0])
        elif isinstance(no, ast.ImportFrom):
            for a in no.names:
                definidos.add(a.asname or a.name)
        elif isinstance(no, ast.Assign):
            for alvo in no.targets:
                for e in ast.walk(alvo):
                    if isinstance(e, ast.Name):
                        definidos.add(e.id)
        elif isinstance(no, ast.AnnAssign) and isinstance(no.target, ast.Name):
            definidos.add(no.target.id)
        elif isinstance(no, (ast.For, ast.While, ast.If, ast.Try, ast.With)):
            for e in ast.walk(no):
                if isinstance(e, ast.Name) and isinstance(e.ctx, (ast.Store, ast.Del)):
                    definidos.add(e.id)
                if isinstance(e, (ast.FunctionDef, ast.ClassDef)):
                    definidos.add(e.name)
                if isinstance(e, ast.Import):
                    for a in e.names:
                        definidos.add((a.asname or a.name).split('.')[0])
                if isinstance(e, ast.ImportFrom):
                    for a in e.names:
                        definidos.add(a.asname or a.name)
    # nomes dinamicos: globals()['x'], globals().get('x'), globals().setdefault('x', ...)
    for no in ast.walk(arvore):
        if isinstance(no, ast.Call) and isinstance(no.func, ast.Name) and no.func.id == 'globals':
            for a in no.args:
                if isinstance(a, ast.Constant) and isinstance(a.value, str):
                    definidos.add(a.value)
        if (isinstance(no, ast.Subscript) and isinstance(no.value, ast.Call)
                and isinstance(no.value.func, ast.Name) and no.value.func.id == 'globals'):
            if isinstance(no.slice, ast.Constant) and isinstance(no.slice.value, str):
                definidos.add(no.slice.value)
    return definidos


def nomes_inresolviveis(arvore, definidos):
    problemas = {}

    def inspecionar(fn, rotulo):
        locais = set()
        for no in ast.walk(fn):
            if isinstance(no, (ast.FunctionDef, ast.AsyncFunctionDef)):
                locais.add(no.name)
                args = no.args
                for a in list(args.args) + list(args.posonlyargs) + list(args.kwonlyargs):
                    locais.add(a.arg)
                if args.vararg:
                    locais.add(args.vararg.arg)
                if args.kwarg:
                    locais.add(args.kwarg.arg)
            elif isinstance(no, ast.ClassDef):
                locais.add(no.name)
            elif isinstance(no, ast.Lambda):
                for a in list(no.args.args) + list(no.args.kwonlyargs):
                    locais.add(a.arg)
            elif isinstance(no, ast.Name) and isinstance(no.ctx, (ast.Store, ast.Del)):
                locais.add(no.id)
            elif isinstance(no, ast.NamedExpr) and isinstance(no.target, ast.Name):
                locais.add(no.target.id)
            elif isinstance(no, ast.ExceptHandler) and no.name:
                locais.add(no.name)
            elif isinstance(no, ast.Global):
                locais.update(no.names)
            elif isinstance(no, ast.Import):
                for a in no.names:
                    locais.add((a.asname or a.name).split('.')[0])
            elif isinstance(no, ast.ImportFrom):
                for a in no.names:
                    locais.add(a.asname or a.name)
        usados = [n.id for n in ast.walk(fn)
                  if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Load)]
        faltando = sorted({u for u in usados if u not in definidos and u not in locais})
        if faltando:
            problemas[rotulo] = faltando

    for no in arvore.body:
        if isinstance(no, (ast.FunctionDef, ast.AsyncFunctionDef)):
            inspecionar(no, no.name)
        elif isinstance(no, ast.ClassDef):
            for m in no.body:
                if isinstance(m, ast.FunctionDef):
                    inspecionar(m, no.name + '.' + m.name)
    return problemas


class AuditoriaDeNomes(unittest.TestCase):
    def test_nenhuma_funcao_usa_nome_que_nao_existe(self):
        arvore = ast.parse(SOURCE.read_text(encoding='utf-8'))
        problemas = nomes_inresolviveis(arvore, nomes_definidos_no_modulo(arvore))
        self.assertEqual(problemas, {})

    def test_as_duas_ferramentas_reparadas_importam_timedelta(self):
        texto = SOURCE.read_text(encoding='utf-8')
        arvore = ast.parse(texto)
        for nome in ('agendar_desligamento', 'dias_uteis_entre_datas'):
            fn = next(n for n in arvore.body
                      if isinstance(n, ast.FunctionDef) and n.name == nome)
            imports = [a.name for n in ast.walk(fn) if isinstance(n, ast.ImportFrom)
                       for a in n.names]
            self.assertIn('timedelta', imports, nome)


class ComportamentoReparado(unittest.TestCase):
    def test_dias_uteis_entre_datas_agora_calcula(self):
        env = carregar('dias_uteis_entre_datas', tool=lambda f: f, datetime=datetime.datetime)
        saida = env['dias_uteis_entre_datas']('11/09/2026', '18/09/2026')
        self.assertIn('6', saida)  # 6 uteis entre as duas sextas
        self.assertNotIn('Use o formato', saida)
        d1 = env['dias_uteis_entre_datas']('32/13/2026', '18/09/2026')
        self.assertIn('Use o formato', d1)

    def test_agendar_desligamento_agenda_e_responde_sem_nameerror(self):
        comandos = []
        env = carregar('agendar_desligamento', tool=lambda f: f, datetime=datetime.datetime,
                       _confirma_poderoso=lambda m: True,
                       _rodar_cmd=lambda cmd, prazo: (comandos.append(cmd) or ('', '', 0)))
        saida = env['agendar_desligamento'](60)
        self.assertIn('agendado', saida.lower())
        self.assertTrue(any('/s /t 3600' in c for c in comandos))
        self.assertTrue(any('/a' in c for c in comandos))  # cancela pendencia antes

    def test_seletor_oferece_cinco_candidatos(self):
        env = carregar('_eh_pergunta_de_conversa', '_despachar_ferramenta_local', '_norm_pt',
                       _buscar_ferramentas=Mock(return_value=[]),
                       _parece_pedido_de_acao=lambda x: x.startswith('instale '),
                       _pedir_parametros=Mock(return_value=None))
        with redirect_stdout(io.StringIO()):
            env['_despachar_ferramenta_local']('instale python')
        env['_buscar_ferramentas'].assert_called_once_with('instale python', 5)


if __name__ == '__main__':
    unittest.main()
