# agente/loop.py
"""Laco: perceber -> decidir -> agir -> lembrar -> medir -> analisar -> propor -> promover."""
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
LIMITE_DIARIO = 500


def perceber():
    """Olha a raiz do projeto e devolve as pastas visiveis, em ordem."""
    nomes = [p.name for p in RAIZ.iterdir() if p.is_dir() and not p.name.startswith(".")]
    return sorted(nomes)


def ler_cerebro():
    """Le o arquivo inteiro. None = ilegivel: assim nunca sobrescrevo um cerebro que nao entendi."""
    if not FLUXO.exists():
        return {"auto_promocao": {"ligada": False}, "acoes": []}
    try:
        dados = json.loads(FLUXO.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None
    if not isinstance(dados, dict):
        return None
    dados.setdefault("acoes", [])
    dados.setdefault("auto_promocao", {"ligada": False})
    return dados


def carregar_regras():
    dados = ler_cerebro()
    return [] if dados is None else dados["acoes"]


def ler_diario():
    """Diario e historia, nao prova: corrompeu, comeca do zero sem derrubar o agente."""
    if not MEMORIA.exists():
        return []
    try:
        dados = json.loads(MEMORIA.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []
    return dados if isinstance(dados, list) else []


def decidir(pastas):
    """Compara o mundo com as regras, com os nomes EM ORDEM: senao o mundo 'muda' sem mudar."""
    regras = carregar_regras()
    for nome in pastas:
        conteudo = sorted(p.name for p in (RAIZ / nome).iterdir())
        for regra in regras:
            if conteudo == sorted(regra["pasta_com_conteudo"]):
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
    """Guarda o evento e limita o diario: log sem teto e o problema de amanha."""
    MEMORIA.parent.mkdir(parents=True, exist_ok=True)
    registro = ler_diario()
    evento["quando"] = datetime.now().isoformat(timespec="seconds")
    registro.append(evento)
    registro = registro[-LIMITE_DIARIO:]
    MEMORIA.write_text(json.dumps(registro, indent=2, ensure_ascii=False), encoding="utf-8")
    return len(registro)


def medir(janela=12):
    """Só fatos contados do diario, sem nenhuma frase. Quem decide e a estrutura."""
    registros = ler_diario()[-janela:]
    criacoes = {}
    bloqueios = 0
    paradas = 0
    for r in registros:
        fez = r.get("fez") or ""
        if r.get("decidiu") == "nada_a_fazer":
            paradas += 1
        elif fez.startswith("Criei "):
            pedaco = fez.split(" ", 2)[1]
            alvo, _, nome = pedaco.partition("/")
            if not nome:
                continue
            chave = (alvo, nome)
            criacoes[chave] = criacoes.get(chave, 0) + 1
        elif fez.startswith("Pulei "):
            bloqueios += 1
    por_arquivo = {}
    for (alvo, nome), vezes in criacoes.items():
        por_arquivo.setdefault(nome, set()).add(alvo)
    return {
        "recriacoes": [
            {"alvo": alvo, "arquivo": nome, "vezes": vezes}
            for (alvo, nome), vezes in sorted(criacoes.items()) if vezes > 1
        ],
        "espalhadas": [
            {"arquivo": nome, "pastas": len(alvos)}
            for nome, alvos in sorted(por_arquivo.items()) if len(alvos) > 1
        ],
        "bloqueios": bloqueios,
        "paradas": paradas,
        "lidos": len(registros),
    }


def analisar(fatos):
    """Veste os fatos com frase legivel. O numero que esta aqui vem do medir, nao do chute."""
    lidas = []
    for item in fatos["recriacoes"]:
        lidas.append(f"recriei {item['arquivo']} em {item['alvo']} {item['vezes']}x: algo desfaz isso la")
    for item in fatos["espalhadas"]:
        lidas.append(f"a regra que cria {item['arquivo']} se espalhou por {item['pastas']} pastas sozinha")
    if fatos["bloqueios"]:
        lidas.append(f"fui bloqueado {fatos['bloqueios']}x por arquivo que ja existe")
    if fatos["paradas"]:
        lidas.append(f"em {fatos['paradas']} execucoes nao havia trabalho: o mundo ja estava resolvido")
    if not lidas:
        lidas.append(f"nenhum padrao nos ultimos {fatos['lidos']} registros")
    return lidas


def propor(fatos):
    """So propor onde o MESMO arquivo foi recriado no MESMO lugar. E o gatilho vem do fato observado."""
    RASCUNHOS.mkdir(parents=True, exist_ok=True)
    novos = []
    for item in fatos["recriacoes"]:
        alvo, nome = item["alvo"], item["arquivo"]
        id_novo = f"avisar_sobre_{alvo}"
        destino = RASCUNHOS / f"{id_novo}.json"
        if destino.exists():
            continue
        rascunho = {
            "criada_em": datetime.now().isoformat(timespec="seconds"),
            "ativa": False,
            "evidencia": {
                "alvo": alvo,
                "arquivo": nome,
                "vezes": item["vezes"],
                "fonte": "memoria/historico.json",
            },
            "proposta": {
                "id": id_novo,
                "pasta_com_conteudo": sorted([".gitkeep", nome]),
                "criar_arquivo": "LEIA-ME.txt",
                "conteudo": f"# NAO APAGUE {nome} em {alvo}: ele e gerado pelo agente. Veja memoria/historico.json\n",
            },
        }
        destino.write_text(json.dumps(rascunho, indent=2, ensure_ascii=False), encoding="utf-8")
        novos.append(id_novo)
    return novos


def regra_e_segura(proposta):
    """Jaula por lista de permitidos: o que nao esta na lista ja esta vetado."""
    estranhas = [chave for chave in proposta if chave not in CHAVES_PERMITIDAS]
    return not estranhas, estranhas


def ensaiar(proposta):
    """Palco de mentira, decisao e acao de verdade. Devolve '' se aprovou, senao o motivo."""
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
    """Unica porta do cerebro: jaula, ensaio, limite e sua licenca. E nao escreve se nao leu."""
    dados = ler_cerebro()
    if dados is None:
        return [], ["cerebro ilegivel: nao vou sobrescrever nada. Abra fluxos/regras.json e corrija"]
    regras = dados["acoes"]
    existentes = {regra["id"] for regra in regras}
    politica = dados["auto_promocao"]
    limite = int(politica.get("limite_de_regras", 6))
    aprovadas = []
    barradas = []
    if not RASCUNHOS.exists():
        return [], []
    for arquivo in sorted(RASCUNHOS.glob("*.json")):
        try:
            dado = json.loads(arquivo.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            barradas.append(f"{arquivo.name}: rascunho ilegivel, deixo ele em paz")
            continue
        proposta = dado.get("proposta")
        if not proposta:
            barradas.append(f"{arquivo.name}: sem 'proposta', nao e rascunho meu")
            continue
        if proposta.get("id") in existentes:
            continue
        if dado.get("motivo_da_recusa") and not dado.get("ativa"):
            # recusa e decisao, nao pergunta: so reavalo se voce religar ativa ou editar a proposta
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
            dado["promovida_em"] = datetime.now().isoformat(timespec="seconds")
        arquivo.write_text(json.dumps(dado, indent=2, ensure_ascii=False), encoding="utf-8")
    if aprovadas:
        dados["acoes"] = regras
        FLUXO.write_text(json.dumps(dados, indent=2, ensure_ascii=False), encoding="utf-8")
    return aprovadas, barradas


if __name__ == "__main__":
    fatos = medir()
    aprovadas, barradas = promover()
    pastas = perceber()
    acao, alvo, regra = decidir(pastas)
    resultado = agir(acao, alvo, regra)
    aprendizados = analisar(fatos)
    rascunhos = propor(fatos)
    total = lembrar({"viu": len(pastas), "decidiu": acao, "alvo": alvo, "fez": resultado,
                     "fatos": fatos, "aprendeu": aprendizados, "rascunhou": rascunhos,
                     "promoveu": aprovadas, "barradas": barradas})
    print("o agente viu:", pastas)
    print("o agente decidiu:", acao, "->", alvo)
    print("o agente fez:", resultado)
    print(f"o agente mediu: {len(fatos['recriacoes'])} repeticoes, {len(fatos['espalhadas'])} regras espalhadas")
    for linha in aprendizados:
        print("   - ele aprendeu:", linha)
    for id_rascunho in rascunhos:
        print(f"   - propoe fluxos/rascunhos/{id_rascunho}.json")
    for linha in aprovadas:
        print("   - CEREBRO GANHOU:", linha)
    for linha in barradas:
        print("   - O PORTAO BARROU:", linha)
    print("o agente lembra:", total, "registros em memoria/historico.json")