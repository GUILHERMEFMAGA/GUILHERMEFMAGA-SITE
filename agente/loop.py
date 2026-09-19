# agente/loop.py
"""Primeiro laco do agente: perceber -> decidir -> agir -> lembrar."""
import json
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
MEMORIA = RAIZ / "memoria" / "historico.json"


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


def agir(acao, alvo):
    """Executa o que foi decidido e devolve o relato do que aconteceu."""
    if acao == "nada_a_fazer":
        return "Nenhum trabalho: todas as pastas ja tem conteudo."
    destino = RAIZ / alvo / "base.py"
    if destino.exists():
        return f"Pulei {alvo}/base.py porque ja existe."
    destino.write_text("# espaco de trabalho criado pelo agente\n", encoding="utf-8")
    return f"Criei {alvo}/base.py"


def lembrar(evento):
    """Acrescenta um evento ao diario do agente e devolve quantos registros ha."""
    MEMORIA.parent.mkdir(parents=True, exist_ok=True)
    registro = []
    if MEMORIA.exists():
        registro = json.loads(MEMORIA.read_text(encoding="utf-8"))
    evento["quando"] = datetime.now().isoformat(timespec="seconds")
    registro.append(evento)
    MEMORIA.write_text(json.dumps(registro, indent=2, ensure_ascii=False), encoding="utf-8")
    return len(registro)


if __name__ == "__main__":
    pastas = perceber()
    acao, alvo = decidir(pastas)
    resultado = agir(acao, alvo)
    total = lembrar({"viu": len(pastas), "decidiu": acao, "alvo": alvo, "fez": resultado})
    print("o agente viu:", pastas)
    print("o agente decidiu:", acao, "->", alvo)
    print("o agente fez:", resultado)
    print("o agente lembra:", total, "registros em memoria/historico.json")
    

    