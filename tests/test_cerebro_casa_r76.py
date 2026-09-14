# -*- coding: utf-8 -*-
"""r76 — CONHECIMENTO E CASA AMPLIADA: exportar/importar cerebro (14), diff
do cerebro (15), auditoria estendida (42), visao local real c/ modelo
SEPARADO (43) e manual do usuario gerado do codigo (44). Regras da casa:
carregar via AST, 100% local, kill-switch na config, aprimorar SEM apagar
(o import NUNCA apaga fato existente; o GGUF principal segue intacto)."""
import datetime
import io
import json
import os
import shutil
import tempfile
import unittest

from test_roteamento_conversa import SOURCE as AGENTE_PY, carregar

FAKE_AGENTE = '''# fake p/ teste r76
_SELO = "[Motor e avaliacao local 2026-09-11-r86]"


def tool():
    pass


@tool
def abrir_youtube(destino=""):
    """Abre o YouTube no navegador padrao."""
    pass


@tool
def liga_caixeiro():
    """Ligacao rapida (ferramenta de teste)."""
    pass
'''


def _novo_ambiente(**extra):
    pasta = tempfile.mkdtemp(prefix='r76_')
    ambiente = {
        'os': os,
        'json': json,
        'PASTA_BASE': pasta,
        '_R69_NUCLEO': {'conhecimento': {}, 'aprendidas': {}, 'pesos': {},
                        'confiancas': {}, 'desconhecidos': {}},
    }
    ambiente.update(extra)
    return ambiente


def _stub(ambiente, nome, valor):
    ambiente[nome] = valor
    return ambiente


def _carregar(**extra):
    ambiente = _novo_ambiente(**extra)
    return carregar('_r67_ler_config', **ambiente), ambiente


class TestCerebroCasaR76(unittest.TestCase):

    def setUp(self):
        self._pastas = []

    def tearDown(self):
        for p in self._pastas:
            if p and os.path.isdir(p):
                shutil.rmtree(p, ignore_errors=True)

    def _fake_pasta(self, com_fonte=True):
        pasta = tempfile.mkdtemp(prefix='r76fake_')
        self._pastas.append(pasta)
        if com_fonte:
            with open(os.path.join(pasta, 'agente.py'), 'w', encoding='utf-8') as f:
                f.write(FAKE_AGENTE)
        return pasta

    # ---------- integridade ----------
    def test_selo_r76(self):
        with open(AGENTE_PY, encoding='utf-8') as f:
            fonte = f.read()
        self.assertEqual(fonte.count('[Motor e avaliacao local 2026-09-11-r86]'), 1)
        self.assertEqual(fonte.count('[Motor e avaliacao local 2026-09-11-r75]'), 0)

    def test_bloco_r76_completo(self):
        ambiente, _ = _carregar()
        for nome in ('_r76_selorFonte', '_r76_cerebro_chaves', '_r76_exportar_cerebro',
                     '_r76_importar_cerebro', '_r76_diff_cerebro', '_r76_auditoria_completa',
                     '_r76_visao_pasta', '_r76_visao_achar_modelo', '_r76_visao_descrever',
                     '_r76_gerar_manual'):
            self.assertIn(nome, ambiente, 'faltando: ' + nome)

    def test_rotas_r76_no_cerebro(self):
        with open(AGENTE_PY, encoding='utf-8') as f:
            fonte = f.read()
        for trecho in ('cmd.startswith("exportar cerebro")', 'cmd.startswith("importar cerebro")',
                       'cmd.startswith("diff cerebro")', 'cmd.startswith("auditoria completa")',
                       'cmd.startswith("ver ")', 'cmd.startswith("manual ")'):
            self.assertIn(trecho, fonte)
        # 'ver ' nao pode roubar 'ver conhecimento' (r69)
        self.assertIn('n != "verconhecimento"', fonte)

    def test_fatos_novos_ganham_data_quando(self):
        with open(AGENTE_PY, encoding='utf-8') as f:
            fonte = f.read()
        self.assertIn("'quando': _dt76.datetime.now().isoformat(timespec='seconds')", fonte)

    # ---------- 14: exportar ----------
    def test_exportar_grava_backup_versionado(self):
        ambiente, extra = _carregar()
        ambiente['_R69_NUCLEO']['conhecimento'] = {'casa': [{'texto': 'moro em SP',
                                                             'quando': '2026-09-01T08:00:00'}]}
        pasta = self._fake_pasta()
        ambiente['PASTA_BASE'] = pasta
        caminho = ambiente['_r76_exportar_cerebro'](pasta=pasta)
        self.assertTrue(caminho.endswith('.json'))
        with open(caminho, encoding='utf-8') as f:
            pacote = json.load(f)
        self.assertEqual(pacote['versao'], 1)
        self.assertIn('exportado_em', pacote)
        self.assertIn('dados', pacote)
        self.assertEqual(set(pacote['dados']), set(ambiente['_r76_cerebro_chaves']()))
        self.assertEqual(pacote['selo'], '2026-09-11-r86')  # lido do proprio codigo (fake agora selado r79)

    def test_exportar_vazio_retorna_none(self):
        ambiente, extra = _carregar()
        pasta = self._fake_pasta()
        self.assertIsNone(ambiente['_r76_exportar_cerebro'](pasta=pasta))

    # ---------- 14: importar ----------
    def test_importar_mescla_e_nunca_apaga(self):
        ambiente, extra = _carregar()
        pasta = self._fake_pasta()
        ambiente['PASTA_BASE'] = pasta
        ambiente['_R69_NUCLEO']['conhecimento'] = {
            'casa': [{'texto': 'moro em SP', 'quando': '2026-09-01T08:00:00'}]}
        backup = os.path.join(pasta, 'backup.json')
        with open(backup, 'w', encoding='utf-8') as f:
            json.dump({'versao': 1, 'exportado_em': 'x', 'selo': 'x',
                       'dados': {'conhecimento': {
                           'casa': [{'texto': 'moro em SP', 'quando': '2026-09-01T08:00:00'},
                                    {'texto': 'tenho 2 gatos', 'quando': '2026-09-10T09:00:00'}],
                           'trabalho': [{'texto': 'sou dev', 'quando': '2026-09-10T09:00:00'}]}}}, f)
        _r = ambiente['_r76_importar_cerebro'](backup, pasta=pasta)
        self.assertIsInstance(_r, dict)
        self.assertEqual(_r['adicionados'], 2)
        self.assertEqual(_r['jaexistiam'], 1)
        _c = ambiente['_R69_NUCLEO']['conhecimento']
        self.assertIn('trabalho', _c)
        self.assertEqual(len(_c['casa']), 2)
        # regra da casa: o que ja existia continua (nada apagado)
        self.assertTrue(any('SP' in e['texto'] for e in _c['casa']))

    def test_importar_aceita_cerebro_bruto(self):
        ambiente, extra = _carregar()
        pasta = self._fake_pasta()
        ambiente['PASTA_BASE'] = pasta
        bruto = os.path.join(pasta, 'cerebro_bruto.json')
        with open(bruto, 'w', encoding='utf-8') as f:
            json.dump({'conhecimento': {'x': [{'texto': 'fato x'}]}}, f)
        _r = ambiente['_r76_importar_cerebro'](bruto, pasta=pasta)
        self.assertIsInstance(_r, dict)
        self.assertIn('x', ambiente['_R69_NUCLEO']['conhecimento'])

    def test_importar_arquivo_invalido_nao_quebra(self):
        ambiente, extra = _carregar()
        pasta = self._fake_pasta()
        ruim = os.path.join(pasta, 'ruim.json')
        with open(ruim, 'w', encoding='utf-8') as f:
            f.write('isto nao e json')
        _r = ambiente['_r76_importar_cerebro'](ruim, pasta=pasta)
        self.assertIsInstance(_r, str)
        self.assertIn('nada foi alterado', _r.lower())
        self.assertEqual(ambiente['_R69_NUCLEO']['conhecimento'], {})

    def test_importar_killswitch(self):
        ambiente, extra = _carregar()
        pasta = self._fake_pasta()
        ambiente = _stub(ambiente, '_r67_ler_config',
                         lambda chave, pasta=None, padrao=None: chave != 'exportar_cerebro' and padrao)
        _r = ambiente['_r76_importar_cerebro']('qualquer.txt', pasta=pasta)
        self.assertIsInstance(_r, str)
        self.assertIn('desligada', _r)

    # ---------- 15: diff ----------
    def test_diff_semana_usa_data_quando(self):
        ambiente, extra = _carregar()
        _agora = datetime.datetime(2026, 9, 13, 12, 0)
        ambiente['_R69_NUCLEO']['conhecimento'] = {
            'recente': [{'texto': 'fato novo', 'quando': '2026-09-11T10:00:00'}],
            'antigo': [{'texto': 'fato velho', 'quando': '2026-08-01T10:00:00'}],
            'antigo2': [{'texto': 'sem data'}]}
        _r = ambiente['_r76_diff_cerebro'](pasta=extra['PASTA_BASE'], agora=_agora)
        self.assertEqual(len(_r['recentes']), 1)
        self.assertIn('fato novo', _r['recentes'][0])
        self.assertEqual(_r['fora'], 1)
        self.assertEqual(_r['sem_data'], 1)

    def test_diff_estrutural_com_outro_cerebro(self):
        ambiente, extra = _carregar()
        ambiente['_R69_NUCLEO']['conhecimento'] = {
            'a': [{'texto': '1'}], 'b': [{'texto': '2'}]}
        outro = {'conhecimento': {'a': [{'texto': '1'}], 'c': [{'texto': '3'}]}}
        _r = ambiente['_r76_diff_cerebro'](dados_outro=outro, pasta=extra['PASTA_BASE'])
        self.assertEqual(_r['novos'], ['b: 2'])
        self.assertEqual(_r['ausentes'], ['c: 3'])

    def test_diff_killswitch(self):
        ambiente, extra = _carregar()
        ambiente = _stub(ambiente, '_r67_ler_config',
                         lambda chave, pasta=None, padrao=None: chave != 'diff_cerebro' and padrao)
        self.assertIsNone(ambiente['_r76_diff_cerebro'](pasta=extra['PASTA_BASE']))

    # ---------- 42: auditoria estendida ----------
    def test_auditoria_gera_relatorio_unico(self):
        ambiente, extra = _carregar()
        pasta = self._fake_pasta()
        ambiente['PASTA_BASE'] = pasta
        with open(os.path.join(pasta, 'config.json'), 'w', encoding='utf-8') as f:
            f.write('{}')
        ambiente['_R69_NUCLEO']['conhecimento'] = {'casa': [{'texto': 'moro em SP'}]}
        caminho = ambiente['_r76_auditoria_completa'](
            pasta=pasta, motor='C:/llama-server.exe', gguf='C:/modelo.gguf')
        self.assertTrue(caminho.endswith('.md'))
        with open(caminho, encoding='utf-8') as f:
            txt = f.read()
        for secao in ('## 1. Motor local', '## 2. Rotas e ferramentas', '## 3. Gatilhos',
                      '## 4. Cerebro', '## 5. Arquivos da casa',
                      'Selo do codigo: 2026-09-11-r86', 'C:/llama-server.exe', 'C:/modelo.gguf',
                      'Topicos ensinados: 1', '100% local'):
            self.assertIn(secao, txt, 'faltando: ' + secao)

    def test_auditoria_killswitch(self):
        ambiente, extra = _carregar()
        pasta = self._fake_pasta()
        ambiente = _stub(ambiente, '_r67_ler_config',
                         lambda chave, pasta=None, padrao=None: chave != 'auditoria_completa' and padrao)
        self.assertIsNone(ambiente['_r76_auditoria_completa'](pasta=pasta))

    # ---------- 43: visao local real ----------
    def _imagem(self, pasta):
        img = os.path.join(pasta, 'foto.png')
        with open(img, 'wb') as f:
            f.write(b'\x89PNG fake')
        return img

    def _modelo_visao(self, pasta):
        raiz = os.path.join(pasta, 'modelos_visao')
        os.makedirs(raiz, exist_ok=True)
        g = os.path.join(raiz, 'moondream.gguf')
        with open(g, 'wb') as f:
            f.truncate(20_000_001)
        return g

    def test_visao_sem_modelo_e_honesto(self):
        ambiente, extra = _carregar()
        pasta = self._fake_pasta()
        ambiente['PASTA_BASE'] = pasta
        _r = ambiente['_r76_visao_descrever'](self._imagem(pasta), pasta=pasta)
        self.assertIn('NAO tem um modelo de visao', _r)
        self.assertIn('sim', _r)          # nunca baixa sem 'sim'
        self.assertIn('modelos_visao', _r)

    def test_visao_com_modelo_sem_servidor_avisado(self):
        ambiente, extra = _carregar()
        pasta = self._fake_pasta()
        ambiente['PASTA_BASE'] = pasta
        self._modelo_visao(pasta)
        _r = ambiente['_r76_visao_descrever'](self._imagem(pasta),
                                              chamar=lambda c, p: (_ for _ in ()).throw(
                                                  ConnectionRefusedError('sem servidor')),
                                              pasta=pasta)
        self.assertIn('SERVIDOR', _r)
        self.assertIn('SEPARADO', _r)

    def test_visao_descreve_com_servidor_injetado(self):
        ambiente, extra = _carregar()
        pasta = self._fake_pasta()
        ambiente['PASTA_BASE'] = pasta
        self._modelo_visao(pasta)
        _r = ambiente['_r76_visao_descrever'](self._imagem(pasta),
                                              chamar=lambda c, p: 'Um gato dormindo no sofá.',
                                              pasta=pasta)
        self.assertEqual(_r, 'Um gato dormindo no sofá.')

    def test_visao_imagem_invalida(self):
        ambiente, extra = _carregar()
        pasta = self._fake_pasta()
        ambiente['PASTA_BASE'] = pasta
        _r = ambiente['_r76_visao_descrever'](os.path.join(pasta, 'nao_existe.jpg'), pasta=pasta)
        self.assertIn('Nao achei a imagem', _r)
        txt = os.path.join(pasta, 'algo.txt')
        with open(txt, 'w') as f:
            f.write('x')
        _r2 = ambiente['_r76_visao_descrever'](txt, pasta=pasta)
        self.assertIn('Formato', _r2)

    def test_visao_killswitch(self):
        ambiente, extra = _carregar()
        ambiente = _stub(ambiente, '_r67_ler_config',
                         lambda chave, pasta=None, padrao=None: chave != 'visao_local' and padrao)
        self.assertIsNone(ambiente['_r76_visao_descrever']('x.png'))

    # ---------- 44: manual do usuario ----------
    def test_manual_gerado_do_codigo(self):
        ambiente, extra = _carregar()
        pasta = self._fake_pasta()
        ambiente['PASTA_BASE'] = pasta
        with open(os.path.join(pasta, 'atalhos_aprendidos.json'), 'w', encoding='utf-8') as f:
            json.dump({'bom dia': 'abre o email'}, f)
        caminho = ambiente['_r76_gerar_manual'](pasta=pasta)
        self.assertTrue(caminho.endswith('manual_do_agente.md'))
        with open(caminho, encoding='utf-8') as f:
            txt = f.read()
        for trecho in ('MANUAL DO AGENTE', 'Versao do codigo: 2026-09-11-r86',
                       '## Comandos principais', '## Atalhos que voce ensinou',
                       '## Catalogo completo de ferramentas (2)',
                       '`abrir_youtube` — Abre o YouTube no navegador padrao.',
                       '## Configuracoes (interruptores)', 'fila: <tarefa>'):
            self.assertIn(trecho, txt, 'faltando: ' + trecho)

    def test_manual_killswitch(self):
        ambiente, extra = _carregar()
        pasta = self._fake_pasta()
        ambiente = _stub(ambiente, '_r67_ler_config',
                         lambda chave, pasta=None, padrao=None: chave != 'manual_usuario' and padrao)
        self.assertIsNone(ambiente['_r76_gerar_manual'](pasta=pasta))


if __name__ == '__main__':
    unittest.main()
