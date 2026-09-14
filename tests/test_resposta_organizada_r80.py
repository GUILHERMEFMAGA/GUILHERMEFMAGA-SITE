# -*- coding: utf-8 -*-
"""r80 — RESPOSTA ORGANIZADA: a IA LOCAL (e o dono) constroem tabelas,
gráficos e listas de ideias BONITOS — na tela (ASCII, qualquer console) e
em arquivo (HTML autocontido c/ SVG, .md). Organizador automático
determinístico normaliza listas/tabelas que a IA devolve. Regras da casa:
carregar via AST, 100% local, sem libs externas, kill-switch no
organizador automático, comandos só pegam quando parece o formato (a
conversa segue pro modelo, que pode usar as ferramentas construir_*)."""
import json
import os
import shutil
import tempfile
import unittest

from test_roteamento_conversa import SOURCE as AGENTE_PY, carregar


def _carregar(**extra):
    pasta = tempfile.mkdtemp(prefix='r80_')
    ambiente = {'os': os, 'json': json, 'PASTA_BASE': pasta}
    ambiente.update(extra)
    amb = carregar('_r67_ler_config', 'construir_tabela', 'construir_grafico',
                  'construir_ideias', **ambiente)
    return amb, ambiente


def _stub(ambiente, nome, valor):
    ambiente[nome] = valor
    return ambiente


class TestRespostaOrganizadaR80(unittest.TestCase):

    def setUp(self):
        self._pasta = None

    def tearDown(self):
        if self._pasta and os.path.isdir(self._pasta):
            shutil.rmtree(self._pasta, ignore_errors=True)

    # ---------- integridade ----------
    def test_selo_r80(self):
        with open(AGENTE_PY, encoding='utf-8') as f:
            fonte = f.read()
        self.assertEqual(fonte.count('[Motor e avaliacao local 2026-09-11-r85]'), 1)
        self.assertEqual(fonte.count('[Motor e avaliacao local 2026-09-11-r79]'), 0)

    def test_bloco_r80_completo(self):
        ambiente, extra = _carregar()
        self._pasta = extra['PASTA_BASE']
        for nome in ('_r80_parse_tabela', '_r80_tabela_texto', '_r80_tabela_html',
                     '_r80_parse_grafico', '_r80_grafico_ascii', '_r80_grafico_html',
                     '_r80_parse_ideias', '_r80_ideias_texto', '_r80_ideias_md',
                     '_r80_organizar_resposta', '_r80_blocos_tabela',
                     'construir_tabela', 'construir_grafico', 'construir_ideias'):
            self.assertIn(nome, ambiente, 'faltando: ' + nome)

    def test_rotas_e_hooks_no_codigo(self):
        with open(AGENTE_PY, encoding='utf-8') as f:
            fonte = f.read()
        for trecho in ('cmd.startswith("tabela ")', 'cmd.startswith("grafico ")',
                       'cmd.startswith("ideias ")',
                       '_org80 = globals().get(\'_r80_organizar_resposta\')',
                       'construir_tabela', 'construir_grafico', 'construir_ideias'):
            self.assertIn(trecho, fonte)
        # as rotas so pegam quando parece o formato (':' ou '|')
        self.assertIn('":" in cmd or "|" in cmd', fonte)
        # o organizador roda na IA local (_chamar_neural) e na exibicao da nuvem
        self.assertIn('if _org80 and not formato_json:', fonte)
        self.assertIn('_resposta_exibir = _org80(_resposta_exibir)', fonte)

    # ---------- tabela ----------
    def test_parse_tabela(self):
        ambiente, extra = _carregar()
        _p = ambiente['_r80_parse_tabela']
        r = _p('MEU PC: CPU, RAM | i5, 16GB | i7, 32GB')
        self.assertEqual(r, ('MEU PC', ['CPU', 'RAM'], [['i5', '16GB'], ['i7', '32GB']]))
        r = _p('CPU, RAM | i5, 16GB')
        self.assertEqual(r[0], None)
        self.assertEqual(r[1], ['CPU', 'RAM'])
        self.assertIsNone(_p('so uma linha'))
        self.assertIsNone(_p('T: a, b | c'))          # colunas diferentes
        self.assertIsNone(_p('T: a, b |'))            # sem corpo
        self.assertIsNone(_p('a, b: c | d'))          # titulo com virgula

    def test_tabela_texto_alinhada(self):
        ambiente, extra = _carregar()
        _t = ambiente['_r80_tabela_texto']('Meu PC', ['CPU', 'RAM'], [['i5', '16GB'], ['i7 longo', '32GB']])
        linhas = _t.splitlines()
        self.assertEqual(linhas[0], 'MEU PC')
        self.assertIn('CPU', _t)
        self.assertIn('i7 longo', _t)
        # alinhamento: TODAS as linhas da tabela (cabealho e corpo) tem a mesma largura
        tabela_linhas = [l for l in linhas if l.startswith(('|', '+'))]
        self.assertTrue(all(len(l) == len(tabela_linhas[0]) for l in tabela_linhas), _t)

    def test_tabela_html_autocontido(self):
        ambiente, extra = _carregar()
        self._pasta = extra['PASTA_BASE']
        c = ambiente['_r80_tabela_html']('Teste', ['A', 'B'], [['1', '2']], pasta=extra['PASTA_BASE'])
        self.assertTrue(c.endswith('.html'))
        with open(c, encoding='utf-8') as f:
            html = f.read()
        self.assertIn('<table>', html)
        self.assertIn('<th>A</th>', html)
        self.assertIn('<td>1</td>', html)
        self.assertIn('100% local', html)
        self.assertNotIn('http://', html)   # autocontido: nada externo
        self.assertNotIn('https://', html)

    # ---------- grafico ----------
    def test_parse_grafico(self):
        ambiente, extra = _carregar()
        _p = ambiente['_r80_parse_grafico']
        r = _p('VENDAS: jan 100 | fev 150 | mar 90')
        self.assertEqual(r, ('VENDAS', [('jan', 100.0), ('fev', 150.0), ('mar', 90.0)]))
        self.assertEqual(_p('jan 1,5 | fev 2')[1][0][1], 1.5)  # virgula decimal BR
        self.assertIsNone(_p('jan dez | fev 2'))   # valor nao numerico
        self.assertIsNone(_p('so um 10'))          # precisa 2+ pontos

    def test_grafico_ascii_escalado(self):
        ambiente, extra = _carregar()
        _g = ambiente['_r80_grafico_ascii']('Vendas', [('jan', 100), ('fev', 200), ('mar', 50)])
        linhas = _g.splitlines()
        self.assertEqual(linhas[0], 'VENDAS')
        _w = lambda l: len(l.split('|')[1].strip().split(' ', 1)[0])
        self.assertGreater(_w(linhas[2]), _w(linhas[3]))  # fev (200) > jan (100)
        self.assertIn('#', _g)

    def test_grafico_html_svg(self):
        ambiente, extra = _carregar()
        self._pasta = extra['PASTA_BASE']
        c = ambiente['_r80_grafico_html']('Vendas', [('jan', 100), ('fev', 150)], pasta=extra['PASTA_BASE'])
        with open(c, encoding='utf-8') as f:
            html = f.read()
        self.assertIn('<svg', html)
        self.assertIn('<rect', html)
        self.assertIn('100% local', html)
        self.assertNotIn('https://', html)

    # ---------- ideias ----------
    def test_ideias_parse_e_texto(self):
        ambiente, extra = _carregar()
        r = ambiente['_r80_parse_ideias']('APP DE ENTREGA: app X | app Y | app Z')
        self.assertEqual(r, ('APP DE ENTREGA', ['app X', 'app Y', 'app Z']))
        self.assertIsNone(ambiente['_r80_parse_ideias']('so uma ideia'))
        _t = ambiente['_r80_ideias_texto']('App', ['x', 'y', 'z'])
        self.assertIn('1. x', _t)
        self.assertIn('3. z', _t)
        self.assertIn('APP', _t)

    def test_ideias_md(self):
        ambiente, extra = _carregar()
        self._pasta = extra['PASTA_BASE']
        c = ambiente['_r80_ideias_md']('App', ['x', 'y'], pasta=extra['PASTA_BASE'])
        self.assertTrue(c.endswith('.md'))
        with open(c, encoding='utf-8') as f:
            md = f.read()
        self.assertIn('# APP', md)
        self.assertIn('2. y', md)

    # ---------- organizador automatico ----------
    def test_organizador_normaliza_lista_mista(self):
        ambiente, extra = _carregar()
        _o = ambiente['_r80_organizar_resposta']
        entrada = 'Claro! Aqui vao as opcoes:\n- app de entrega\n* app de estudos\n3. app de receitas'
        saida = _o(entrada)
        self.assertIn('1. app de entrega', saida)
        self.assertIn('2. app de estudos', saida)
        self.assertIn('3. app de receitas', saida)

    def test_organizador_nao_toca_prosa_com_o(self):
        ambiente, extra = _carregar()
        _o = ambiente['_r80_organizar_resposta']
        entrada = 'o agente abriu o arquivo\no disco esta ok\no motor esta pronto'
        self.assertEqual(_o(entrada), entrada)  # 'o ' e prosa PT-BR, nao marcador

    def test_organizador_converte_bloco_tabela(self):
        ambiente, extra = _carregar()
        _o = ambiente['_r80_organizar_resposta']
        entrada = 'Aqui vai a comparacao:\ncelular, bateria, camera\niPhone 15, 44ms, boa\nGalaxy S25, 50ms, otima\nEspero que ajude!'
        saida = _o(entrada)
        self.assertIn('+', saida)
        self.assertIn('bateria', saida)
        self.assertIn('iPhone 15', saida)
        self.assertIn('Espero que ajude!', saida)  # o resto segue intato

    def test_organizador_resposta_curta_intacta(self):
        ambiente, extra = _carregar()
        _o = ambiente['_r80_organizar_resposta']
        self.assertEqual(_o('Tudo certo!'), 'Tudo certo!')

    def test_organizador_killswitch(self):
        ambiente, extra = _carregar()
        ambiente = _stub(ambiente, '_r67_ler_config',
                         lambda chave, pasta=None, padrao=None: chave != 'organizar_respostas' and padrao)
        entrada = 'lista:\n- a\n- b\n- c'
        self.assertEqual(ambiente['_r80_organizar_resposta'](entrada), entrada)

    # ---------- ferramentas (a IA local chama sozinha) ----------
    def test_ferramenta_construir_tabela(self):
        ambiente, extra = _carregar()
        self._pasta = extra['PASTA_BASE']
        _r = ambiente['construir_tabela']('MEU PC: CPU, RAM | i5, 16GB')
        self.assertIn('CPU', _r)
        self.assertIn('i5', _r)
        self.assertIn('+', _r)

    def test_ferramenta_construir_grafico(self):
        ambiente, extra = _carregar()
        self._pasta = extra['PASTA_BASE']
        _r = ambiente['construir_grafico']('VENDAS: jan 100 | fev 150')
        self.assertIn('#', _r)
        self.assertIn('graficos/', _r)  # caminho do arquivo bonito
        self.assertIn('150', _r)

    def test_ferramenta_construir_ideias(self):
        ambiente, extra = _carregar()
        self._pasta = extra['PASTA_BASE']
        _r = ambiente['construir_ideias']('APP: x | y | z')
        self.assertIn('1. x', _r)
        self.assertIn('3. z', _r)
        self.assertIn('ideias/', _r)

    def test_ferramentas_formato_invalido_ensina(self):
        ambiente, extra = _carregar()
        self.assertIn('Formato', ambiente['construir_tabela']('nada aqui'))
        self.assertIn('Formato', ambiente['construir_grafico']('nada aqui'))
        self.assertIn('Formato', ambiente['construir_ideias']('nada aqui'))


if __name__ == '__main__':
    unittest.main()
