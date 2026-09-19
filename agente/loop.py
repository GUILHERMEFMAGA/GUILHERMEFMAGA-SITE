# agente/loop.py
"""Laco: perceber -> decidir -> agir -> lembrar -> analisar -> propor -> promover (com portao)."""
import json
import shutil
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
MEMORIA = RAIZ / "memoria" / "historico.json"
FLUXO = RAIZ / "fluxos" / "regras.json"
RASCUNHOS = RAIZ / "fluxos" / "rascunhos"
PALCO = RAIZ / "testes" / "mundo_falso" / "ensaio"
CHAVES_PERMITIDAS = ["id", "pasta_com_conteudo", "criar_arquivo", "conteudo"]


def perceber():
    """Olha a raiz do projeto e devolve as pastas visiveis, em ordem."""
    nomes = [p.name for p in RAIZ.iterdir() if p.is_dir() and not p.name.startswith(".")]
    return sorted(nomes)


def ler_cerebro():
    """Le o arquivo INTEIRO: politica + regras. So assim promover nao apaga a jaula."""
    if not FLUXO.exists():
        return {"auto_promocao": {"ligada": False}, "acoes": []}
    dados = json.loads(FLUXO.read_text(encoding="utf-8"))
    dados.setdefault("acoes", [])
    dados.setdefault("auto_promocao", {"ligada": False})
    return dados


def carregar_regras():
    return ler_cerebro()["acoes"]


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
    """Le o proprio diario e devolve o que ele ensinou."""
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


def propor(aprendizados):
    """Transforma aprendizado em rascunho de regra. Ele propoe, nunca escreve direto no cerebro."""
    RASCUNHOS.mkdir(parents=True, exist_ok=True)
    novos = []
    for linha in aprendizados:
        if "recriei" not in linha:
            continue
        alvo = linha.split("'")[1]
        id_novo = f"avisar_sobre_{alvo}"
        destino = RASCUNHOS / f"{id_novo}.json"
        if destino.exists():
            continue
        rascunho = {
            "criada_em": datetime.now().isoformat(timespec="seconds"),
            "origem": linha,
            "ativa": False,
            "proposta": {
                "id": id_novo,
                "pasta_com_conteudo": [".gitkeep", "base.py"],
                "criar_arquivo": "LEIA-ME.txt",
                "conteudo": f"# NAO APAGUE base.py em {alvo}: ele e gerado pelo agente. Veja memoria/historico.json\n",
            },
        }
        destino.write_text(json.dumps(rascunho, indent=2, ensure_ascii=False), encoding="utf-8")
        novos.append(id_novo)
    return novos


def regra_e_segura(proposta):
    """Jaula de verdade: lista do que e PERMITIDO. O que nao esta na lista ja esta vetado."""
    estranhas = [chave for chave in proposta if chave not in CHAVES_PERMITIDAS]
    return not estranhas, estranhas


def ensaiar(proposta):
    """Coloca o agente num palco de mentira, roda decidir+agir de verdade, e devolve '' se aprovou."""
    global RAIZ
    mundo_real = RAIZ
    shutil.rmtree(PALCO, ignore_errors=True)
    cena = PALCO / "cena"
    cena.mkdir(parents=True)
    for nome in proposta["pasta_com_conteudo"]:
        (cena / nome).write_text("arquivo de ensaio\n", encoding="utf-8")
    try:
        RAIZ = PALCO
        acao, alvo, regra = decidir(perceber())
        resultado = agir(acao, alvo, regra)
        criado = cena / proposta["criar_arquivo"]
        if acao != proposta["id"]:
            return f"a regra nem disparou na cena feita sob medida para ela (veio: {acao})"
        if not criado.exists():
            return f"o arquivo prometido nao nasceu no disco (agir disse: {resultado})"
        if criado.read_text(encoding="utf-8") != proposta["conteudo"]:
            return "o conteudo escrito difere do prometido pela regra"
        return ""
    finally:
        RAIZ = mundo_real


def promover():
    """Unica porta de entrada do cerebro. Passa pela jaula, pelo ensaio e pela sua licenca."""
    if not RASCUNHOS.exists():
        return [], []
    dados = ler_cerebro()
    regras = dados["acoes"]
    existentes = {regra["id"] for regra in regras}
    politica = dados["auto_promocao"]
    limite = int(politica.get("limite_de_regras", 6))
    aprovadas = []
    barradas = []
    for arquivo in sorted(RASCUNHOS.glob("*.json")):
        dado = json.loads(arquivo.read_text(encoding="utf-8"))
        proposta = dado["proposta"]
        if proposta["id"] in existentes:
            continue
        segura, estranhas = regra_e_segura(proposta)
        if not segura:
            motivo = f"chaves fora da jaula: {estranhas}"
        else:
            motivo = ensaiar(proposta)
        liberada = bool(politica.get("ligada")) and segura and len(regras) < limite
        if motivo:
            barradas.append(f"{proposta['id']}: {motivo}")
            dado["motivo_da_recusa"] = motivo
            dado["recusada_em"] = datetime.now().isoformat(timespec="seconds")
        elif not dado.get("ativa") and not liberada:
            dado["ensaio"] = "aprovada no ensaio, esperando sua licenca"
        else:
            regras.append(proposta)
            existentes.add(proposta["id"])
            origem = "sua licenca" if dado.get("ativa") else "auto_promocao ligada"
            aprovadas.append(f"{proposta['id']} ({origem})")
        arquivo.write_text(json.dumps(dado, indent=2, ensure_ascii=False), encoding="utf-8")
    if aprovadas:
        dados["acoes"] = regras
        FLUXO.write_text(json.dumps(dados, indent=2, ensure_ascii=False), encoding="utf-8")
    return aprovadas, barradas


if __name__ == "__main__":
    aprovadas, barradas = promover()
    pastas = perceber()
    acao, alvo, regra = decidir(pastas)
    resultado = agir(acao, alvo, regra)
    aprendizados = analisar()
    rascunhos = propor(aprendizados)
    total = lembrar({"viu": len(pastas), "decidiu": acao, "alvo": alvo, "fez": resultado,
                     "aprendeu": aprendizados, "rascunhou": rascunhos, "promoveu": aprovadas,
                     "barradas": barradas})
    print("o agente viu:", pastas)
    print("o agente decidiu:", acao, "->", alvo)
    print("o agente fez:", resultado)
    for linha in aprendizados:
        print("   - ele aprendeu:", linha)
    for id_rascunho in rascunhos:
        print(f"   - propoe fluxos/rascunhos/{id_rascunho}.json")
    for linha in aprovadas:
        print("   - CEREBRO GANHOU:", linha)
    for linha in barradas:
        print("   - O PORTAO BARROU:", linha)
    print("o agente lembra:", total, "registros em memoria/historico.json")