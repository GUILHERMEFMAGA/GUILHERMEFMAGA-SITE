#!/usr/bin/env python3
# Servidor de pré-visualização do jogo RUA VERMELHA.
# Serve a pasta jogo/ (index.html + os .js) na porta 8080, ouvindo em 0.0.0.0 para o preview abrir no navegador.
# Sem cache: toda vez que você recarrega a página (F5) aparecem as últimas mudanças dos arquivos.
# uso:  python3 jogo/dev/servidor_preview.py [porta]      (depois abra http://localhost:8080/ no navegador)
import http.server
import os
import socketserver
import sys

PORTA = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
RAIZ = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))   # a pasta jogo/


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=RAIZ, **kwargs)

    def end_headers(self):
        # nada de cache: o navegador sempre pede o arquivo de novo
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

    def log_message(self, formato, *args):
        sys.stderr.write('%s - %s\n' % (self.address_string(), formato % args))


class Servidor(socketserver.ThreadingTCPServer):
    allow_reuse_address = True   # pode reiniciar logo depois de parar
    daemon_threads = True


if not os.path.isfile(os.path.join(RAIZ, 'index.html')):
    sys.exit('index.html não encontrado em ' + RAIZ)

with Servidor(('0.0.0.0', PORTA), Handler) as srv:
    print('servindo', RAIZ, 'em http://0.0.0.0:%d/' % PORTA, flush=True)
    srv.serve_forever()
