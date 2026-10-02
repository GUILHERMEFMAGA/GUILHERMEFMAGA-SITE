"""
Gera a versão de ARQUIVO ÚNICO do LIFE: CIDADE VIVA.

Junta index.html + css/style.css + todos os js/*.js num só arquivo HTML,
que funciona offline com dois cliques (sem servidor, sem instalação).

Uso:
    python3 build_arquivo_unico.py
Saída:
    LIFE-CIDADE-VIVA.html  (na raiz do projeto)
"""

import os
import re

PASTA = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.normpath(os.path.join(PASTA, "..", "LIFE-CIDADE-VIVA.html"))


def ler(caminho):
    with open(os.path.join(PASTA, caminho), "r", encoding="utf-8") as f:
        return f.read()


def proteger_js(codigo):
    """Impede que um '</script>' dentro do código feche a tag no HTML."""
    return codigo.replace("</script", "<\\/script")


def main():
    html = ler("index.html")

    # 1. CSS inline
    css = ler("css/style.css")
    html = re.sub(
        r'<link rel="stylesheet" href="css/style\.css">',
        "<style>\n" + css + "\n</style>",
        html,
    )

    # 2. JS inline, na ordem em que aparece
    def troca_script(m):
        caminho = m.group(1)
        codigo = proteger_js(ler(caminho))
        return "<script>\n/* ===== " + caminho + " ===== */\n" + codigo + "\n</script>"

    html, n = re.subn(r'<script src="([^"]+)"></script>', troca_script, html)

    # 3. aviso no título
    html = html.replace(
        "<title>LIFE: CIDADE VIVA</title>",
        "<title>LIFE: CIDADE VIVA</title>",
    )

    destino = SAIDA
    with open(destino, "w", encoding="utf-8") as f:
        f.write(html)

    kb = os.path.getsize(destino) / 1024
    print(f"OK: {n} arquivos JS embutidos")
    print(f"Gerado: {destino} ({kb:.0f} KB)")


if __name__ == "__main__":
    main()
