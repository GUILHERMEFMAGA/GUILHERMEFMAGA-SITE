# agente/loop.py
"""Primeiro laco do agente: perceber -> decidir -> agir -> lembrar."""
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def perceber():
    """Olha a raiz do projeto e devolve as pastas visiveis, em ordem."""
    nomes = [p.name for p in RAIZ.iterdir() if p.is_dir() and not p.name.startswith(".")]
    return sorted(nomes)


def decidir(pastas):
    """Regra: pasta que so tem .gitkeep dentro precisa de um arquivo base."""
    for nome in pastas:
        conteudo = [p.name for p in (RAIZ / nome).iterdir()]
        if conteudo == [".gitkeep"]:
            return ("criar_arquivo_base", nome)
    return ("nada_a_fazer", None)


if __name__ == "__main__":
    pastas = perceber()
    acao, alvo = decidir(pastas)
    print("o agente viu:", pastas)
    print("o agente decidiu:", acao, "->", alvo)