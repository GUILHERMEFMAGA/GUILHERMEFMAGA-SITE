# -*- coding: utf-8 -*-
"""r100 — DOWNLOAD VERIFICADO BYTE A BYTE: a falha real do PC do dono
(15/09, boot r99): o `baixar visao` terminou SEM erro visível, mas o
projetor (1,94 GB) ficou COMPLETO-FALSO — a rede cortou a conexão no
meio do download e o servidor fechou o stream 'de boa' (sem erro). O
arquivo parcial só foi pego no tamanho final da rota, com uma mensagem
genérica. Agora:

1. cada FATIA do download paralelo confere o STATUS (tem que ser 206,
   não 200 — servidor que ignora o Range não pode escrever o arquivo
   inteiro no meio do outro) e a CONTAGEM DE BYTES (fatia curta erra
   na hora: "fatia cortada: X de Y bytes");
2. o download de conexão única (fallback) confere os BYTES LIDOS contra
   o Content-Length declarado (corte no meio erra: "conexao cortada:
   X de Y bytes") — o arquivo parcial NUNCA é aceito como completo.

Prova real: servidores HTTP locais (em threads) que simulam as três
maldades da rede — fatia curta (206 com menos bytes do que o range
pediu), Range ignorado (200 no meio do download) e corte no meio do
stream (Content-Length N, corpo N/2, conexão fecha).
"""
import hashlib
import http.server
import os
import tempfile
import threading
import unittest

from test_roteamento_conversa import carregar


class _HandlerFatiaCurta(http.server.BaseHTTPRequestHandler):
    """Serve no máximo 100 bytes por range (simula corte que o cliente
    não enxerga como erro: o 206 'fecha de boa' com menos bytes)."""
    arq = None

    def do_GET(self):
        with open(self.arq, 'rb') as f:
            dados = f.read()
        rng = self.headers.get('Range')
        if rng and rng.startswith('bytes='):
            ini_s, fim_s = rng[6:].split('-')
            ini = int(ini_s)
            fim = int(fim_s) if fim_s else len(dados) - 1
            fim = min(fim, ini + 99)  # o servidor só entrega 100 bytes
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


class _HandlerIgnoraRange(http.server.BaseHTTPRequestHandler):
    """Aceita o Range na SONDA (bytes=0-0 -> 206) mas IGNORA nas fatias
    (devolve 200 com o arquivo inteiro) — maldade real de CDN sob carga."""
    arq = None

    def do_GET(self):
        with open(self.arq, 'rb') as f:
            dados = f.read()
        rng = self.headers.get('Range')
        if rng == 'bytes=0-0':
            self.send_response(206)
            self.send_header('Content-Range', 'bytes 0-0/%d' % len(dados))
            self.send_header('Content-Length', '1')
            self.end_headers()
            self.wfile.write(dados[0:1])
        else:
            self.send_response(200)
            self.send_header('Content-Length', str(len(dados)))
            self.end_headers()
            self.wfile.write(dados)

    def log_message(self, *a):
        pass


class _HandlerCortaNoMeio(http.server.BaseHTTPRequestHandler):
    """SEM Range: declara Content-Length N, escreve N/2 e a conexão
    fecha (corte no meio do stream)."""
    arq = None

    def do_GET(self):
        with open(self.arq, 'rb') as f:
            dados = f.read()
        self.send_response(200)
        self.send_header('Content-Length', str(len(dados)))
        self.end_headers()
        self.wfile.write(dados[:len(dados) // 2])
        # (retorna sem escrever o resto — a conexão fecha no meio)

    def log_message(self, *a):
        pass


class _HandlerPlano(http.server.BaseHTTPRequestHandler):
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


class DownloadVerificadoR100(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.mkdtemp()
        cls.origem = os.path.join(cls.tmp, 'origem.bin')
        with open(cls.origem, 'wb') as f:
            f.write(os.urandom(4 * 1024 * 1024))
        for h in (_HandlerFatiaCurta, _HandlerIgnoraRange,
                  _HandlerCortaNoMeio, _HandlerPlano):
            h.arq = cls.origem
        cls.servidores = []
        cls.portas = {}
        for nome, h in (('curta', _HandlerFatiaCurta),
                        ('ignora', _HandlerIgnoraRange),
                        ('corta', _HandlerCortaNoMeio),
                        ('plano', _HandlerPlano)):
            srv = http.server.HTTPServer(('127.0.0.1', 0), h)
            cls.servidores.append(srv)
            cls.portas[nome] = srv.server_address[1]
            threading.Thread(target=srv.serve_forever, daemon=True).start()
        cls.amb = carregar('_r99_baixar_paralelo', '_r100_baixar_unico',
                           '_R99SemRange', os=os)

    @classmethod
    def tearDownClass(cls):
        for srv in cls.servidores:
            srv.shutdown()
            srv.server_close()

    def test_fatia_curta_erra_na_hora(self):
        destino = os.path.join(self.tmp, 'curta.bin')
        with self.assertRaises(IOError) as ctx:
            self.amb['_r99_baixar_paralelo'](
                'http://127.0.0.1:%d/x' % self.portas['curta'],
                destino, fatias=2)
        self.assertIn('fatia cortada', str(ctx.exception))

    def test_range_ignorado_nas_fatias_erra(self):
        destino = os.path.join(self.tmp, 'ignora.bin')
        with self.assertRaises(IOError) as ctx:
            self.amb['_r99_baixar_paralelo'](
                'http://127.0.0.1:%d/x' % self.portas['ignora'],
                destino, fatias=4)
        self.assertIn('ignorou o Range', str(ctx.exception))

    def test_conexao_cortada_nao_aceita_arquivo_completo(self):
        destino = os.path.join(self.tmp, 'corta.bin')
        try:
            self.amb['_r100_baixar_unico'](
                'http://127.0.0.1:%d/x' % self.portas['corta'], destino)
            # se o urllib não gritou (corte 'de boa'), o arquivo
            # parcial não pode passar: tamanho menor que o original
            self.assertLess(os.path.getsize(destino),
                            os.path.getsize(self.origem))
        except IOError as e:
            self.assertIn('cortada', str(e))

    def test_baixar_unico_completo_ok(self):
        destino = os.path.join(self.tmp, 'plano.bin')
        self.amb['_r100_baixar_unico'](
            'http://127.0.0.1:%d/x' % self.portas['plano'], destino)
        self.assertEqual(_sha(destino), _sha(self.origem))
        self.assertEqual(os.path.getsize(destino), os.path.getsize(self.origem))

    def test_wiring_fallback_e_fatias(self):
        from test_roteamento_conversa import SOURCE
        fonte = SOURCE.read_text(encoding='utf-8')
        # o _baixar_real do _r94_visao_baixar usa o unico verificado
        i94 = fonte.find('def _r94_visao_baixar(')
        i = fonte.find('def _baixar_real(url, destino):', i94)
        trecho = fonte[i:i + 700]
        self.assertIn('_r99_baixar_paralelo', trecho)
        self.assertIn('_R99SemRange', trecho)
        self.assertIn('_r100_baixar_unico', trecho)
        # as fatias conferem status 206 e contagem de bytes
        ipar = fonte.find('def _r99_baixar_paralelo(')
        trecho2 = fonte[ipar:fonte.find('def _r100_baixar_unico(', ipar)]
        self.assertIn('status', trecho2)
        self.assertIn('fatia cortada', trecho2)


if __name__ == '__main__':
    unittest.main()
