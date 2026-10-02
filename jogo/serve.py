#!/usr/bin/env python3
"""Servidor do jogo com cache desligado (evita preview com arquivo velho)."""
import http.server
import socketserver
import os

PORT = int(os.environ.get('PORT', '8000'))
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.js'):
            return 'text/javascript; charset=utf-8'
        return super().guess_type(path)

    def log_message(self, fmt, *args):
        pass


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == '__main__':
    with Server(('0.0.0.0', PORT), Handler) as httpd:
        print(f'Cidade Dourada em http://0.0.0.0:{PORT}')
        httpd.serve_forever()
