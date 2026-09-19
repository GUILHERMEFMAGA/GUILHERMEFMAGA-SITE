# -*- coding: utf-8 -*-
# O cerebro do agente: ver -> olhar o mundo -> decidir -> fazer -> lembrar -> contar -> propor.
# Regra de ferro: ele pode LER o mundo la de fora, mas so escreve dentro do projeto.
# Modo agendado (--so-olhar): ele olha, anota e NAO se autopromove, porque nao ha voce ali.

import json
import os
import shutil
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DIARIO = RAIZ / "memoria" / "historico.json"
CONTADORES = RAIZ / "memoria" / "contadores.json"
CEREBRO = RAIZ / "fluxos" / "regras.json"
RASCUNHOS = RAIZ / "fluxos" / "rascunhos"
PALCO = RAIZ / "testes" / "mundo_falso" / "ensaios"
IGNORADAS = {"__pycache__", "mundo_falso", ".git"}

SO_OLHAR = "--so-olhar" in os.sys.argv[1:]


def ler_json(caminho, padrao):
    try:
        return json.loads(Path(caminho).read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return padrao


def escrever_json(caminho, dados):
    destino = Path(caminho)
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(dados, indent=2, ensure_ascii=False), encoding="utf-8")


def ler_cerebro():
    regras = ler_json(CEREBRO, {})
    if not isinstance(regras.get("acoes"), list):
        return {"acoes": []}
    return regras


def listar_pastas():
    pastas = []
    for item in sorted(RAIZ.iterdir()):
        if item.is_dir() and item.name not in IGNORADAS:
            if "mundo_falso" in item.parts:
                continue
            pastas.append(item.name)
    return pastas


def arquivos_de(regra):
    nome = regra.get("criar_arquivo") or regra.get("criar") or "?"
    return nome if isinstance(nome, str) else "?"


def decidir_acao(pasta, regras):
    for regra in regras.get("acoes", []):
        if not isinstance(regra, dict):
            continue
        esperado = regra.get("pasta_com_conteudo")
        if not isinstance(esperado, list):
            continue
        try:
            nomes = sorted(p.name for p in (RAIZ / pasta).iterdir() if p.is_file())
        except OSError:
            continue
        if nomes == sorted(esperado):
            return regra
    return None


def descobrir_acao(pastas, regras):
    for pasta in pastas:
        regra = decidir_acao(pasta, regras)
        if regra is not None:
            return regra, pasta
    return None, None


def executar(regra, pasta):
    nome = arquivos_de(regra)
    destino = RAIZ / pasta / nome
    if destino.exists():
        return "Nada a fazer: %s/%s ja existia." % (pasta, nome)
    conteudo = regra.get("conteudo", "")
    if not isinstance(conteudo, str):
        conteudo = str(conteudo)
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(conteudo, encoding="utf-8")
    return "Criei %s/%s seguindo a regra %s" % (pasta, nome, regra.get("id", "?"))


def lembrar(registro):
    historico = ler_json(DIARIO, [])
    if not isinstance(historico, list):
        historico = []
    historico.append(registro)
    if len(historico) > 500:
        historico = historico[-500:]
    escrever_json(DIARIO, historico)
    return len(historico)


def chave_fato(linha):
    pedaco = linha.replace(",", " ").split()
    for item in pedaco:
        if "|" in item:
            return item.strip(":")
    return None


def zerar_contadores():
    return {"rodadas": 0, "paradas": 0, "criacoes": {}, "recusas": {}}


def acumular(cont, fatos, rejeicoes, agiu):
    cont["rodadas"] = cont.get("rodadas", 0) + 1
    if not agiu:
        cont["paradas"] = cont.get("paradas", 0) + 1
    criacoes = cont.setdefault("criacoes", {})
    for linha in fatos:
        chave = chave_fato(linha)
        if chave:
            criacoes[chave] = criacoes.get(chave, 0) + 1
    recusas = cont.setdefault("recusas", {})
    for linha in rejeicoes:
        if ": " in linha:
            id_regra = linha.split(":")[0].strip()
            if id_regra and id_regra != "rascunho":
                recusas[id_regra] = recusas.get(id_regra, 0) + 1
    return cont


def reconstruir_contadores():
    cont = zerar_contadores()
    for registro in ler_json(DIARIO, []):
        if isinstance(registro, dict):
            acumular(cont, registro.get("fatos", []),
                     registro.get("rejeitou_propor", []),
                     registro.get("decidiu") != "nada_a_fazer")
    return cont


def ler_contadores():
    cont = ler_json(CONTADORES, None)
    if not isinstance(cont, dict) or "rodadas" not in cont:
        cont = reconstruir_contadores()
        escrever_json(CONTADORES, cont)
    return cont


def registrar_rodada(fatos, rejeicoes, agiu):
    cont = ler_contadores()
    acumular(cont, fatos, rejeicoes, agiu)
    escrever_json(CONTADORES, cont)
    return cont


def contar_fatos(cont):
    cronicos = {}
    for chave, qtd in cont.get("criacoes", {}).items():
        if qtd >= 2:
            cronicos[chave] = qtd
    rotulos = set()
    for regra in ler_cerebro().get("acoes", []):
        if isinstance(regra, dict):
            rotulos.add(arquivos_de(regra))
    espalhadas = {}
    for rotulo in rotulos:
        alcanca = [c for c in cont.get("criacoes", {}) if c.split("|")[-1] == rotulo]
        if len(alcanca) >= 2:
            espalhadas[rotulo] = len(alcanca)
    enterradas = {}
    for id_regra, qtd in cont.get("recusas", {}).items():
        if qtd >= 2:
            enterradas[id_regra] = qtd
    return cronicos, espalhadas, enterradas


def corpo(texto):
    linhas = [l for l in texto.splitlines() if l.strip() and not l.strip().startswith("#")]
    return "\n".join(linhas).strip()


def dentro_do_projeto(caminho):
    try:
        Path(caminho).resolve().relative_to(RAIZ.resolve())
        return True
    except (ValueError, OSError):
        return False


def descobrir_mundo():
    casa = Path(os.environ.get("AGENTE_CASA") or os.path.expanduser("~"))
    for nome in ("Desktop", os.path.join("OneDrive", "Desktop"),
                 os.path.join("OneDrive", "\u00c1rea de Trabalho"), "\u00c1rea de Trabalho"):
        teste = casa / nome
        if teste.exists():
            return teste
    return casa / "Desktop"


def inventariar(pasta):
    grupos = {}
    pastas = []
    for item in sorted(pasta.iterdir()):
        if item.name.lower().startswith((".", "thumbs.db")):
            continue
        if item.is_dir():
            pastas.append(item)
            continue
        chave = item.suffix.lower() or "(sem extensao)"
        try:
            tamanho = item.stat().st_size
        except OSError:
            tamanho = 0
        grupos.setdefault(chave, []).append((item, tamanho))
    soltos = sum(len(v) for v in grupos.values())
    linhas = ["# inventario do mundo real - %s" % datetime.now().isoformat(timespec="seconds"),
              "# lido de: %s" % pasta,
              "# arquivos soltos encontrados: %d" % soltos, ""]
    if pastas:
        linhas.append("pastas na Area de Trabalho: %d" % len(pastas))
        for item in pastas:
            linhas.append("   - %s" % item.name)
        linhas.append("")
    for chave in sorted(grupos, key=lambda c: (-len(grupos[c]), c)):
        itens = grupos[chave]
        linhas.append("%s: %d arquivo(s), %d KB" % (chave, len(itens), sum(t for _, t in itens) // 1024))
        for item, _ in sorted(itens, key=lambda par: par[0].name):
            linhas.append("   - %s" % item.name)
    return "\n".join(linhas) + "\n", soltos


def olhar_mundo():
    politica = ler_cerebro().get("mundo")
    if not isinstance(politica, dict) or not politica.get("ligado", False):
        return None
    pasta = descobrir_mundo()
    if not pasta.exists():
        return {"linha": "procurei %s e nao achei: nada feito" % pasta, "mudou": False}
    nome_relatorio = politica.get("relatorio_em")
    if not nome_relatorio or not dentro_do_projeto(RAIZ / nome_relatorio):
        return {"linha": "o relatorio do mundo aponta pra fora do projeto: barrado", "mudou": False}
    destino = RAIZ / nome_relatorio
    novo, soltos = inventariar(pasta)
    antigo = destino.read_text(encoding="utf-8") if destino.exists() else ""
    if politica.get("so_quando_mudar", True) and antigo and corpo(antigo) == corpo(novo):
        return {"linha": "nada mudou la fora: %s ja estava atualizado" % destino.name, "mudou": False}
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(novo, encoding="utf-8")
    return {"linha": "olhei %s (%d arquivos soltos) e escrevi %s"
                    % (pasta.name, soltos, nome_relatorio.replace("\\", "/")), "mudou": True}


def ensaiar(proposta):
    if not dentro_do_projeto(PALCO):
        return "palco de ensaio esta fora do projeto"
    global RAIZ
    vera = RAIZ
    try:
        if PALCO.exists():
            shutil.rmtree(PALCO)
        cena = PALCO / "cena"
        cena.mkdir(parents=True)
        for nome in proposta["pasta_com_conteudo"]:
            (cena / os.path.basename(nome)).write_text("", encoding="utf-8")
        RAIZ = PALCO
        try:
            regra, alvo = descobrir_acao(["cena"], {"acoes": [proposta]})
            if regra is None:
                return "a regra nem disparou na cena feita sob medida para ela (veio: nenhuma)"
            executar(regra, alvo)
            criado = cena / arquivos_de(proposta)
            if not criado.exists():
                return "disparou mas nao criou %s" % arquivos_de(proposta)
            if criado.read_text(encoding="utf-8") != proposta.get("conteudo"):
                return "criou %s com conteudo diferente do pedido" % arquivos_de(proposta)
            return None
        finally:
            RAIZ = vera
    except Exception as erro:
        return "ensaio quebrou: %s" % erro
    finally:
        shutil.rmtree(PALCO, ignore_errors=True)


def propor(cronicos):
    novos = []
    ignoradas = []
    enterradas = []
    if SO_OLHAR:
        return novos, [], [], enterradas
    regras = ler_cerebro()
    politica = regras.get("auto_promocao", {})
    if not isinstance(politica, dict) or not politica.get("ligada", False):
        return novos, ignoradas, [], enterradas
    recusas = ler_contadores().get("recusas", {})
    existentes = {r.get("id") for r in regras.get("acoes", []) if isinstance(r, dict)}
    for alvo_chave, qtd in cronicos.items():
        pasta_alvo = alvo_chave.split("|")[0]
        id_nova = "avisar_sobre_" + pasta_alvo
        if id_nova in existentes:
            continue
        if recusas.get(id_nova, 0) >= politica.get("recusas_maximas", 2):
            enterradas.append("%s: voce recusou %dx, nao volto a perguntar" % (id_nova, recusas.get(id_nova, 0)))
            continue
        if qtd < politica.get("repeticoes_minimas", 2):
            continue
        if len(regras.get("acoes", [])) >= politica.get("limite_de_regras", 6):
            ignoradas.append("rascunho: cerebro esta no limite de %d regras" % politica.get("limite_de_regras", 6))
            break
        proposta = {"id": id_nova,
                    "pasta_com_conteudo": [".gitkeep", "base.py"],
                    "criar_arquivo": "LEIA-ME.txt",
                    "conteudo": "# NAO APAGUE base.py em %s: ele e gerado pelo agente. Veja memoria/historico.json\n" % pasta_alvo}
        destino = RASCUNHOS / (id_nova + ".json")
        if destino.exists():
            dados = ler_json(destino, {})
            if dados.get("motivo_da_recusa"):
                continue
            if dados.get("ativa"):
                continue
            if dados.get("proposta", {}).get("conteudo") == proposta["conteudo"]:
                novos.append(id_nova)
                continue
        falha = ensaiar(proposta)
        if falha is not None:
            ignoradas.append("%s: %s" % (id_nova, falha))
            escrever_json(destino, {"ativa": False, "proposta": proposta,
                                   "origem": "recriei %s %dx" % (alvo_chave.replace("|", " em "), qtd),
                                   "motivo_da_recusa": falha})
            continue
        escrever_json(destino, {"ativa": False, "proposta": proposta,
                               "origem": "recriei %s %dx" % (alvo_chave.replace("|", " em "), qtd),
                               "criada_em": datetime.now().isoformat(timespec="seconds")})
        novos.append(id_nova)
    aprovadas = promover()
    return novos, aprovadas, ignoradas, enterradas


def promover():
    regras = ler_json(CEREBRO, {})
    if not isinstance(regras.get("acoes"), list):
        return []
    politica = regras.get("auto_promocao", {})
    if not politica.get("promover_so_apos_teste", True):
        return []
    aprovadas = []
    for arquivo in sorted(RASCUNHOS.glob("*.json")) if RASCUNHOS.exists() else []:
        dados = ler_json(arquivo, {})
        if not isinstance(dados, dict) or not dados.get("ativa"):
            continue
        if dados.get("motivo_da_recusa"):
            continue
        proposta = dados.get("proposta")
        if not isinstance(proposta, dict) or "id" not in proposta:
            continue
        if any(r.get("id") == proposta["id"] for r in regras["acoes"] if isinstance(r, dict)):
            continue
        regras["acoes"].append(proposta)
        escrever_json(CEREBRO, regras)
        escrever_json(arquivo, {"ativa": True, "proposta": proposta,
                               "origem": dados.get("origem"), "criada_em": dados.get("criada_em"),
                               "promovida_em": datetime.now().isoformat(timespec="seconds")})
        aprovadas.append(proposta["id"])
    return aprovadas


if __name__ == "__main__":
    pastas = listar_pastas()
    mundo = olhar_mundo()
    regras = ler_cerebro()
    acao, alvo = descobrir_acao(pastas, regras)
    if acao is None:
        resultado = "Nenhum trabalho: nenhuma regra bateu com o mundo."
        decisao = "nada_a_fazer"
    else:
        resultado = executar(acao, alvo)
        decisao = "%s -> %s" % (acao.get("id", "?"), alvo)
    fatos = []
    if acao is not None:
        nome = arquivos_de(acao)
        fatos = ["recriei %s em %s de: %s|%s" % (nome, alvo, alvo, nome)]
    cont = ler_contadores()
    cronicos, espalhadas, recusas = contar_fatos(cont)
    rascunhos, aprovadas, ignoradas, ja_enterradas = propor(cronicos)
    registro = {"quando": datetime.now().isoformat(timespec="seconds"), "viu": len(pastas),
                "decidiu": decisao.split(" -> ")[0], "alvo": alvo, "fez": resultado,
                "mundo": (mundo or {}).get("linha"), "fatos": fatos,
                "rascunhou": rascunhos, "rejeitou_propor": ignoradas, "promoveu": aprovadas}
    total = lembrar(registro)
    cont = registrar_rodada(fatos, ignoradas, acao is not None)
    cronicos, espalhadas, enterradas_map = contar_fatos(cont)
    enterradas_txt = ["%s foi barrado %dx: ideia enterrada" % (i, q) for i, q in enterradas_map.items()]
    print("o agente viu:", pastas)
    if mundo:
        print("o agente olhou o mundo:", mundo["linha"])
    print("o agente decidiu:", decisao)
    print("o agente fez:", resultado)
    if SO_OLHAR:
        print("o agente em modo observacao: nao se autopromove sem voce aqui")
    print("o agente contou: %d rodadas, %d cronicos, %d regras espalhadas"
          % (cont.get("rodadas", 0), len(cronicos), len(espalhadas)))
    for chave, qtd in cronicos.items():
        print("   - ele aprendeu: CRONICO: recriei %s %dx ao todo" % (chave.replace("|", " em "), qtd))
    for rotulo, qtd in espalhadas.items():
        print("   - ele aprendeu: a regra que cria %s alcancou %d pastas sozinha" % (rotulo, qtd))
    if cont.get("rodadas"):
        print("   - ele aprendeu: %d de %d rodadas nao tinham trabalho"
              % (cont.get("paradas", 0), cont.get("rodadas", 0)))
    for linha in ignoradas:
        print("   - O PORTAO BARROU:", linha)
    for linha in enterradas_txt + ja_enterradas:
        print("   - ele DESISTE de:", linha)
    for id_novo in rascunhos:
        print("   - propoe fluxos/rascunhos/%s.json   (ativa: false)" % id_novo)
    for linha in aprovadas:
        print("   - CEREBRO GANHOU:", linha)
    print("o agente lembra:", total, "registros em memoria/historico.json")