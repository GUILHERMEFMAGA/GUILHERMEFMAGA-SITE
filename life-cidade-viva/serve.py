"""
Servidor local do LIFE: CIDADE VIVA.

Uso:
    python serve.py            # abre em http://localhost:8000
    python serve.py 8137       # escolhe a porta
    python serve.py 8137 0.0.0.0
    python serve.py 8000 0.0.0.0 ..     # serve a pasta acima (raiz do projeto)

Por que usar este arquivo em vez de "python -m http.server"?
Além de servir os arquivos, ele manda cabeçalhos que impedem o navegador
de guardar versões antigas do jogo em cache — assim um F5 sempre carrega
a versão mais recente do código.
"""

import os
import sys
import http.server
import socketserver

PORTA = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
HOST = sys.argv[2] if len(sys.argv) > 2 else "0.0.0.0"
# pasta a servir: 3º argumento, senão a própria pasta deste arquivo
PASTA = os.path.abspath(sys.argv[3]) if len(sys.argv) > 3 else os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PASTA, **kwargs)

    def end_headers(self):
        # sem cache: um F5 sempre traz o código mais novo
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, formato, *args):
        # log curto, só o essencial
        print("%s - %s" % (self.address_string(), formato % args), flush=True)


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    with Server((HOST, PORTA), Handler) as httpd:
        print(f"LIFE: CIDADE VIVA rodando em http://localhost:{PORTA}", flush=True)
        print(f"Servindo a pasta: {PASTA}", flush=True)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor encerrado.", flush=True)
