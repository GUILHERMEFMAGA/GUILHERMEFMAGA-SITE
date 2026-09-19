# agente/loop.py
"""Laco do agente: perceber -> decidir -> agir -> lembrar -> analisar."""
import json
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
MEMORIA = RAIZ / "memoria" / "historico.json"
FLUXO = RAIZ / "fluxos" / "regras.json"


def perceber():
    """Olha a raiz do projeto e devolve as pastas visiveis, em ordem."""
    nomes = [p.name for p in RAIZ.iterdir() if p.is_dir() and not p.name.startswith(".")]
    return sorted(nomes)


def carregar_regras():
    """O cerebro e texto: cada item do arquivo e uma regra de verdade."""
    if not FLUXO.exists():
        return []
    return json.loads(FLUXO.read_text(encoding="utf-8"))["acoes"]


def decidir(pastas):
    """Compara o mundo com as regras do arquivo, na ordem em que estao la."""
    regras = carregar_regras()
    for nome in pastas:
        conteudo = [p.name for p in (RAIZ / nome).iterdir()]
        for regra in regras:
            if conteudo == regra["pasta_com_conteudo"]:
                return (regra["id"], nome, regra)
    return ("nada_a_fazer", None, None)


def agir(acao, alvo, regra):
    """Executa exatamente o que a regra do arquivo mandou."""
    if acao == "nada_a_fazer":
        return "Nenhum trabalho: nenhuma regra bateu com o mundo."
    nome_arquivo = regra["criar_arquivo"]
    destino = RAIZ / alvo / nome_arquivo
    if destino.exists():
        return f"Pulei {alvo}/{nome_arquivo} porque ja existe."
    destino.write_text(regra["conteudo"], encoding="utf-8")
    return f"Criei {alvo}/{nome_arquivo} seguindo a regra {acao}"


def lembrar(evento):
    """Acrescenta um evento ao diario e devolve quantos registros existem."""
    MEMORIA.parent.mkdir(parents=True, exist_ok=True)
    registro = []
    if MEMORIA.exists():
        registro = json.loads(MEMORIA.read_text(encoding="utf-8"))
    evento["quando"] = datetime.now().isoformat(timespec="seconds")
    registro.append(evento)
    MEMORIA.write_text(json.dumps(registro, indent=2, ensure_ascii=False), encoding="utf-8")
    return len(registro)


def analisar(janela=12):
    """Le o proprio diario e devolve o que ele ensinou. Quinto organo."""
    if not MEMORIA.exists():
        return ["Sem diario ainda: nada a aprender."]
    registros = json.loads(MEMORIA.read_text(encoding="utf-8"))[-janela:]
    lidas = []
    criacoes = {}
    bloqueios = []
    paradas = 0
    for r in registros:
        fez = r.get("fez") or ""
        if r.get("decidiu") == "nada_a_fazer":
            paradas += 1
        elif fez.startswith("Criei "):
            alvo = r.get("alvo")
            criacoes[alvo] = criacoes.get(alvo, 0) + 1
        elif fez.startswith("Pulei "):
            bloqueios.append(r.get("alvo"))
    for alvo, vezes in sorted(criacoes.items()):
        if vezes > 1:
            lidas.append(f"eu recriei '{alvo}' {vezes} vezes: alguem desfaz meu trabalho ali")
    if bloqueios:
        lidas.append(f"fui bloqueado {len(bloqueios)}x por arquivo que ja existe: falta condicao de parada")
    if paradas:
        lidas.append(f"em {paradas} execucoes nao havia trabalho: o mundo ja estava resolvido")
    if not lidas:
        lidas.append(f"nenhum padrao repetido nos ultimos {len(registros)} registros")
    return lidas


if __name__ == "__main__":
    pastas = perceber()
    acao, alvo, regra = decidir(pastas)
    resultado = agir(acao, alvo, regra)
    aprendizados = analisar()
    total = lembrar({"viu": len(pastas), "decidiu": acao, "alvo": alvo, "fez": resultado, "aprendeu": aprendizados})
    print("o agente viu:", pastas)
    print("o agente decidiu:", acao, "->", alvo)
    print("o agente fez:", resultado)
    print("o agente analisou:")
    for linha in aprendizados:
        print("   -", linha)
    print("o agente lembra:", total, "registros em memoria/historico.json")