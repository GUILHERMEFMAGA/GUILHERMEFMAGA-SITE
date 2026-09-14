# -*- coding: utf-8 -*-
"""r83 — DIAGNÓSTICO DE MICROFONE.

Bug real do PC do dono (log 14/09, r82): `falar` devolveu 'PortAudioError'
OPAQUO — sem forma de ver quais microfones o PC expoe (nenhum? nenhum como
padrão? biblioteca faltando?). Correção:
- `_r83_microfones` (injetável, só LEITURA) lista entradas + índice padrão
- `_r83_resumo_microfone` (FUNÇÃO PURA) vira a mensagem PT-BR com o que fazer
- rota leigo `diagnostico microfone` (+ alias `testar microfone`)
- `stt` agora mostra a linha do microfone junto do status
- o erro do `falar` agora imprime a CAUSA real do PortAudioError e aponta
  para `diagnostico microfone`
"""
import os
import tempfile
import unittest
from contextlib import redirect_stdout
from io import StringIO

from test_roteamento_conversa import SOURCE as AGENTE_PY, carregar


def _fonte():
    with open(AGENTE_PY, encoding='utf-8') as f:
        return f.read()


class TestMicrofoneR83(unittest.TestCase):

    def test_selo_r83(self):
        self.assertEqual(_fonte().count('[Motor e avaliacao local 2026-09-11-r83]'), 1)

    def test_microfones_falha_da_biblioteca(self):
        amb = carregar()
        _m = amb['_r83_microfones']
        # biblioteca que "nao existe" -> erro honesto, sem estourar
        def _falha():
            raise ImportError('nao existe')
        devs, ind, erro = _m(listar=_falha, padrao=lambda: None)
        self.assertEqual(devs, [])
        self.assertIsNone(ind)
        self.assertIn('ImportError', erro)

    def test_microfones_fake_ok(self):
        amb = carregar()
        _m = amb['_r83_microfones']
        devs_fake = [
            {'index': 3, 'name': 'Microfone Realtek', 'max_input_channels': 2},
            {'index': 5, 'name': 'Headset USB', 'max_input_channels': 1},
        ]
        devs, ind, erro = _m(listar=lambda: devs_fake, padrao=lambda: 3)
        self.assertEqual(devs, devs_fake)
        self.assertEqual(ind, 3)
        self.assertIsNone(erro)

    def test_resumo_biblioteca_falta(self):
        amb = carregar()
        _r = amb['_r83_resumo_microfone']
        m = _r([], None, 'sounddevice indisponivel (ModuleNotFoundError)')
        self.assertIn('sounddevice', m)
        self.assertIn('pip install sounddevice', m)

    def test_resumo_nenhum_microfone(self):
        amb = carregar()
        _r = amb['_r83_resumo_microfone']
        m = _r([], None, None)
        self.assertIn('NENHUM microfone', m)
        self.assertIn('Configuracoes', m)  # caminho no Windows pra leigo
        self.assertIn('Entrada', m)

    def test_resumo_microfone_sem_padrao(self):
        amb = carregar()
        _r = amb['_r83_resumo_microfone']
        devs = [{'index': 3, 'name': 'Microfone Realtek'}, {'index': 5, 'name': 'Headset USB'}]
        m = _r(devs, None, None)
        self.assertIn('NENHUM selecionado como PADRAO', m)
        self.assertIn('Microfone Realtek', m)
        self.assertIn('Headset USB', m)
        # indice que nao existe na lista tambem conta como "sem padrao"
        m2 = _r(devs, 99, None)
        self.assertIn('NENHUM selecionado como PADRAO', m2)

    def test_resumo_microfone_ok(self):
        amb = carregar()
        _r = amb['_r83_resumo_microfone']
        devs = [{'index': 3, 'name': 'Microfone Realtek'}]
        m = _r(devs, 3, None)
        self.assertIn('Microfone OK', m)
        self.assertIn('Microfone Realtek', m)
        self.assertIn('falar', m)

    def test_rota_diagnostico_no_codigo(self):
        fonte = _fonte()
        self.assertIn("n.startswith('diagnosticomicrofone') or n.startswith('testarmicrofone')", fonte)
        # a rota 'stt' agora mostra tambem a linha do microfone
        self.assertIn('_rel(_r79_stt_status())\n        _devs_mf, _ind_mf, _err_mf = _r83_microfones()', fonte)

    def test_erro_do_falar_aponta_para_diagnostico(self):
        amb = carregar(os=os)
        pasta = tempfile.mkdtemp(prefix='r83_')
        saida = StringIO()
        try:
            with redirect_stdout(saida):
                amb['_r79_gravar_wav'](pasta=pasta)
        finally:
            import shutil
            shutil.rmtree(pasta, ignore_errors=True)
        txt = saida.getvalue()
        self.assertIn('nao consegui gravar o microfone', txt)
        self.assertIn('diagnostico microfone', txt)
        # a CAUSA real vem junto (nome do erro), nao mais so a classe
        self.assertIn(':', txt.split('microfone (')[1].split(')')[0])


if __name__ == '__main__':
    unittest.main()
