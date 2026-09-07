#!/usr/bin/env python3
"""Servidor HTTP simples com cabecalho no-cache para evitar cache do navegador."""
import http.server
import socketserver
from functools import partial

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass

PORT = 8000
Handler = partial(NoCacheHandler)
with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"Servidor em http://0.0.0.0:{PORT} (no-cache)")
    httpd.serve_forever()
