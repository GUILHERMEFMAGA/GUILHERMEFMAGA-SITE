# agente/loop.py
"""Primeiro laco do agente: perceber -> decidir -> agir -> lembrar."""
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def perceber():
    """Olha a raiz do projeto e devolve as pastas visiveis, em ordem."""
    nomes = [p.name for p in RAIZ.iterdir() if p.is_dir() and not p.name.startswith(".")]
    return sorted(nomes)


if __name__ == "__main__":
    pastas = perceber()
    print("o agente viu:", pastas)

