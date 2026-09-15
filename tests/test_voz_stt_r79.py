# -*- coding: utf-8 -*-
"""r79 — VOZ: STT LOCAL (whisper.cpp). O item 38 da leva de 19 (a "obra
grande"; era a reserva r77, publicado como r79 porque o selo segue a ordem
de publicação). O áudio NUNCA sai do PC; download SÓ com 'sim' explícito;
fontes oficiais; kill-switch 'stt_local'. No sandbox (Linux, sem microfone)
tudo que é testável é testado com injeção; o microfone real se prova no
PC do dono."""
import json
import os
import shutil
import tempfile
import unittest

from test_roteamento_conversa import SOURCE as AGENTE_PY, carregar


def _novo_ambiente():
    pasta = tempfile.mkdtemp(prefix='r79_')
    return {'os': os, 'json': json, 'PASTA_BASE': pasta}


def _stub(ambiente, nome, valor):
    ambiente[nome] = valor
    return ambiente


def _carregar(**extra):
    ambiente = _novo_ambiente()
    ambiente.update(extra)
    return carregar('_r67_ler_config', **ambiente), ambiente


class TestVozSttR79(unittest.TestCase):

    def setUp(self):
        self._pastas = []

    def tearDown(self):
        for p in self._pastas:
            if p and os.path.isdir(p):
                shutil.rmtree(p, ignore_errors=True)

    # ---------- integridade ----------
    def test_selo_r79(self):
        with open(AGENTE_PY, encoding='utf-8') as f:
            fonte = f.read()
        self.assertEqual(fonte.count('[Motor e avaliacao local 2026-09-11-r94]'), 1)
        self.assertEqual(fonte.count('[Motor e avaliacao local 2026-09-11-r78]'), 0)

    def test_bloco_r79_completo(self):
        ambiente, _ = _carregar()
        for nome in ('_r79_pasta_stt', '_r79_stt_urls', '_r79_stt_achar_programa',
                     '_r79_stt_status', '_r79_stt_args', '_r79_gravar_wav',
                     '_r79_stt_transcrever', '_r79_stt_baixar'):
            self.assertIn(nome, ambiente, 'faltando: ' + nome)

    def test_rotas_e_hook_no_codigo(self):
        with open(AGENTE_PY, encoding='utf-8') as f:
            fonte = f.read()
        self.assertIn('cmd.startswith("baixar stt")', fonte)
        self.assertIn("n == \"stt\" or cmd.startswith(\"stt \")", fonte)
        # o hook do main loop: 'falar'/'ouvir' viram comando
        self.assertIn("('falar', 'ouvir', 'meouve', 'falaai')", fonte)
        self.assertIn("_r79_stt_transcrever", fonte)
        # modo convidado bloqueia o download (mexida na casa)
        self.assertIn("'baixar stt'", fonte)

    def test_requirements_tem_sounddevice(self):
        with open('requirements.txt', encoding='utf-8') as f:
            t = f.read()
        self.assertIn('sounddevice', t)

    # ---------- status / urls ----------
    def test_urls_fontes_oficiais(self):
        ambiente, extra = _carregar()
        u = ambiente['_r79_stt_urls'](pasta=extra['PASTA_BASE'])
        self.assertIn('ggml-org/whisper.cpp/releases', u['bin_zip'])
        self.assertIn('huggingface.co/ggerganov/whisper.cpp', u['modelo'])
        self.assertTrue(u['modelo_local'].endswith('ggml-base.bin'))
        self.assertEqual(u['modelo_mb'], 142)

    def test_status_sem_nada_avisado(self):
        ambiente, extra = _carregar()
        self._pastas.append(extra['PASTA_BASE'])
        _s = ambiente['_r79_stt_status'](pasta=extra['PASTA_BASE'])
        self.assertIn('NAO esta completo', _s)
        self.assertIn('baixar stt', _s)

    def test_status_com_tudo_pronto(self):
        ambiente, extra = _carregar()
        self._pastas.append(extra['PASTA_BASE'])
        u = ambiente['_r79_stt_urls'](pasta=extra['PASTA_BASE'])
        os.makedirs(os.path.dirname(u['bin_zip_local']) + os.sep + 'bin' + os.sep + 'Release', exist_ok=True)
        with open(os.path.join(u['bin_dir'], 'Release', 'whisper-cli.exe'), 'wb') as f:
            f.write(b'x')
        with open(u['modelo_local'], 'wb') as f:
            f.write(b'x')
        _s = ambiente['_r79_stt_status'](pasta=extra['PASTA_BASE'])
        self.assertIn('STT pronto', _s)
        self.assertIn('falar', _s)

    # ---------- logica pura ----------
    def test_args_do_whisper(self):
        ambiente, _ = _carregar()
        args = ambiente['_r79_stt_args']('prog', 'modelo.bin', 'a.wav', 'saida.txt', lang='pt')
        self.assertEqual(args, ['-m', 'modelo.bin', '-f', 'a.wav', '-l', 'pt', '-nt', '-of', 'saida.txt'])

    # ---------- transcrever (rodar/gravar injetados) ----------
    def test_transcrever_com_rodar_injetado(self):
        ambiente, extra = _carregar()
        self._pastas.append(extra['PASTA_BASE'])
        u = ambiente['_r79_stt_urls'](pasta=extra['PASTA_BASE'])
        os.makedirs(u['bin_dir'], exist_ok=True)
        with open(os.path.join(u['bin_dir'], 'whisper-cli.exe'), 'wb') as f:
            f.write(b'x')
        with open(u['modelo_local'], 'wb') as f:
            f.write(b'x')
        wav = os.path.join(extra['PASTA_BASE'], 'falou.wav')
        with open(wav, 'wb') as f:
            f.write(b'RIFF')

        def _rodar(binary, args, timeout):
            self.assertIn('-l', args)
            self.assertIn('pt', args)
            saida = args[args.index('-of') + 1]
            with open(saida, 'w', encoding='utf-8') as f:
                f.write('abre o youtube\nabre o youtube\n')  # -nt repete por segmento
            class R:
                returncode = 0
                stderr = ''
            return R()

        _t = ambiente['_r79_stt_transcrever'](wav=wav, rodar=_rodar, pasta=extra['PASTA_BASE'])
        self.assertEqual(_t, 'abre o youtube abre o youtube')

    def test_transcrever_sem_peca_e_honesto(self):
        ambiente, extra = _carregar()
        self._pastas.append(extra['PASTA_BASE'])
        wav = os.path.join(extra['PASTA_BASE'], 'x.wav')
        with open(wav, 'wb') as f:
            f.write(b'x')
        _t = ambiente['_r79_stt_transcrever'](wav=wav, pasta=extra['PASTA_BASE'])
        self.assertIsInstance(_t, str)
        self.assertIn('NAO esta completo', _t)

    def test_transcrever_mudo_avisado(self):
        ambiente, extra = _carregar()
        self._pastas.append(extra['PASTA_BASE'])
        u = ambiente['_r79_stt_urls'](pasta=extra['PASTA_BASE'])
        os.makedirs(u['bin_dir'], exist_ok=True)
        with open(os.path.join(u['bin_dir'], 'whisper-cli.exe'), 'wb') as f:
            f.write(b'x')
        with open(u['modelo_local'], 'wb') as f:
            f.write(b'x')
        wav = os.path.join(extra['PASTA_BASE'], 'x.wav')
        with open(wav, 'wb') as f:
            f.write(b'x')

        def _rodar(binary, args, timeout):  # retorna 0 mas nao escreve saida
            class R:
                returncode = 0
                stderr = ''
            return R()

        _t = ambiente['_r79_stt_transcrever'](wav=wav, rodar=_rodar, pasta=extra['PASTA_BASE'])
        self.assertIn('mudo', _t)

    def test_transcrever_killswitch(self):
        ambiente, extra = _carregar()
        ambiente = _stub(ambiente, '_r67_ler_config',
                         lambda chave, pasta=None, padrao=None: chave != 'stt_local' and padrao)
        self.assertIsNone(ambiente['_r79_stt_transcrever'](wav='x.wav', pasta=extra['PASTA_BASE']))

    # ---------- baixar (baixar/extrair injetados) ----------
    def test_baixar_instala_tudo(self):
        ambiente, extra = _carregar()
        self._pastas.append(extra['PASTA_BASE'])
        u = ambiente['_r79_stt_urls'](pasta=extra['PASTA_BASE'])
        baixados = []

        def _baixar(url, destino):
            baixados.append(url)
            with open(destino, 'wb') as f:
                f.write(b'x')

        def _extrair(zipcaminho, dir_destino):
            os.makedirs(os.path.join(dir_destino, 'Release'), exist_ok=True)
            with open(os.path.join(dir_destino, 'Release', 'whisper-cli.exe'), 'wb') as f:
                f.write(b'x')

        _r = ambiente['_r79_stt_baixar'](baixar=_baixar, extrair=_extrair, pasta=extra['PASTA_BASE'])
        self.assertIn('STT instalado', _r)
        self.assertEqual(baixados[0], u['bin_zip'])
        self.assertEqual(baixados[-1], u['modelo'])
        self.assertTrue(os.path.isfile(u['modelo_local']))

    def test_baixar_falha_honesta(self):
        ambiente, extra = _carregar()
        self._pastas.append(extra['PASTA_BASE'])

        def _baixar(url, destino):
            raise ConnectionError('sem rede')

        _r = ambiente['_r79_stt_baixar'](baixar=_baixar, extrair=lambda z, d: None,
                                         pasta=extra['PASTA_BASE'])
        self.assertIsInstance(_r, str)
        self.assertIn('falhou', _r)
        self.assertIn('ConnectionError', _r)

    def test_baixar_killswitch(self):
        ambiente, extra = _carregar()
        ambiente = _stub(ambiente, '_r67_ler_config',
                         lambda chave, pasta=None, padrao=None: chave != 'stt_local' and padrao)
        self.assertIsNone(ambiente['_r79_stt_baixar'](baixar=lambda u, d: None,
                                                      extrair=lambda z, d: None,
                                                      pasta=extra['PASTA_BASE']))

    # ---------- modo convidado ----------
    def test_convidado_bloqueia_baixar_stt(self):
        ambiente, _ = _carregar()
        ambiente['_r75_convidado_ativo'] = True
        self.assertIsNotNone(ambiente['_r75_convidado_bloqueia']('baixar stt'))


if __name__ == '__main__':
    unittest.main()
