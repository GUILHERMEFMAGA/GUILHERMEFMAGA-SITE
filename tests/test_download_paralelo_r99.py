# -*- coding: utf-8 -*-
"""r99 — DOWNLOAD EM PARALELO: as peças da visão (~8 GB) descem em 4
conexões ao mesmo tempo (Range), em vez de 1 fileira — costuma dar 2 a 4x
mais rápido em linhas domésticas (que limitam por conexão). Se o servidor
não aceitar fatias, cai no download único (fallback honesto).

Prova real: servidor HTTP local com suporte a Range (em thread) — o
download paralelo tem que produzir arquivo IDÊNTICO ao original, byte a
byte (sha256).
"""
import hashlib
import http.server
import os
import tempfile
import threading
import unittest

from test_roteamento_conversa import carregar


class _HandlerRange(http.server.BaseHTTPRequestHandler):
    arq = None

    def do_GET(self):
        with open(self.arq, 'rb') as f:
            dados = f.read()
        rng = self.headers.get('Range')
        if rng and rng.startswith('bytes='):
            ini_s, fim_s = rng[6:].split('-')
            ini, fim = int(ini_s), int(fim_s)
            self.send_response(206)
            self.send_header('Content-Range',
                             'bytes %d-%d/%d' % (ini, fim, len(dados)))
            self.send_header('Content-Length', str(fim - ini + 1))
            self.end_headers()
            self.wfile.write(dados[ini:fim + 1])
        else:
            self.send_response(200)
            self.send_header('Content-Length', str(len(dados)))
            self.end_headers()
            self.wfile.write(dados)

    def log_message(self, *a):
        pass


class _HandlerSemRange(http.server.BaseHTTPRequestHandler):
    arq = None

    def do_GET(self):
        with open(self.arq, 'rb') as f:
            dados = f.read()
        self.send_response(200)
        self.send_header('Content-Length', str(len(dados)))
        self.end_headers()
        self.wfile.write(dados)

    def log_message(self, *a):
        pass


def _sha(caminho):
    return hashlib.sha256(open(caminho, 'rb').read()).hexdigest()


class DownloadParaleloR99(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.mkdtemp()
        cls.origem = os.path.join(cls.tmp, 'origem.bin')
        with open(cls.origem, 'wb') as f:
            f.write(os.urandom(5 * 1024 * 1024))
        _HandlerRange.arq = cls.origem
        cls.srv = http.server.HTTPServer(('127.0.0.1', 0), _HandlerRange)
        cls.porta = cls.srv.server_address[1]
        cls.thread = threading.Thread(target=cls.srv.serve_forever, daemon=True)
        cls.thread.start()
        # servidor SEM range (fallback)
        _HandlerSemRange.arq = cls.origem
        cls.srv2 = http.server.HTTPServer(('127.0.0.1', 0), _HandlerSemRange)
        cls.porta2 = cls.srv2.server_address[1]
        threading.Thread(target=cls.srv2.serve_forever, daemon=True).start()
        cls.amb = carregar('_r99_baixar_paralelo', '_R99SemRange', os=os)

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()
        cls.srv2.shutdown()

    def test_paralelo_produz_arquivo_identico(self):
        destino = os.path.join(self.tmp, 'dest4.bin')
        self.amb['_r99_baixar_paralelo']('http://127.0.0.1:%d/x' % self.porta,
                                         destino, fatias=4)
        self.assertEqual(_sha(destino), _sha(self.origem))
        self.assertEqual(os.path.getsize(destino), os.path.getsize(self.origem))

    def test_paralelo_fatias_variadas(self):
        for fatias in (1, 2, 8):
            with self.subTest(fatias=fatias):
                destino = os.path.join(self.tmp, 'dest%d.bin' % fatias)
                self.amb['_r99_baixar_paralelo']('http://127.0.0.1:%d/x' % self.porta,
                                                 destino, fatias=fatias)
                self.assertEqual(_sha(destino), _sha(self.origem))

    def test_sem_range_lanca_erro_do_fallback(self):
        destino = os.path.join(self.tmp, 'semrange.bin')
        with self.assertRaises(self.amb['_R99SemRange']):
            self.amb['_r99_baixar_paralelo']('http://127.0.0.1:%d/x' % self.porta2,
                                             destino, fatias=4)

    def test_wiring_no_baixar_visao(self):
        from test_roteamento_conversa import SOURCE
        fonte = SOURCE.read_text(encoding='utf-8')
        # o _baixar_real do _r94_visao_baixar (nao o do stt)
        i94 = fonte.find('def _r94_visao_baixar(')
        i = fonte.find('def _baixar_real(url, destino):', i94)
        trecho = fonte[i:i + 900]
        self.assertIn('_r99_baixar_paralelo', trecho)
        self.assertIn('_R99SemRange', trecho)  # o fallback
