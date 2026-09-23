# -*- coding: utf-8 -*-
# O cerebro do agente (v4): ver -> olhar o mundo -> decidir -> fazer -> lembrar -> contar -> propor.
# v3: a fila ganha o verbo abrir: — abre arquivo ou pasta no app padrao do Windows,
# so dentro das areas liberadas e nunca um executavel (lista jamais_abrir).
# Regra de ferro: ele pode LER o mundo la de fora, mas so escreve dentro do projeto.
# Modo agendado (--so-olhar): ele olha, anota e NAO se autopromove, porque nao ha voce ali.
# v4: o porteiro — --vigiar detecta arquivos novos nas pastas vigiadas e
# reage so com vocabulario aprovado; a noite (com --so-olhar) ele observa e enfileira, nunca age sozinho.
# v5: correntes — quando a vigilia nota um arquivo, o cerebro pode disparar fluxos de etapas
# (bloco `correntes`). Cada elo usa so ferramentas blindadas: copia so pra dentro do projeto,
# abrir com os 3 cadeados, e na madrugada abrir/executar viram fila — nunca mao sola.
# v6: olhos de saude (B13) — a cada tick o PC mede ram/disco/nucleos (so LER, sem verbo
# novo na coleira), anota o pulso em memoria/saude.txt, e de manha o resumo conta se a
# madrugada apertou. Silencio = saude; linha com fome = decisao sua de ler de manha.
# v7: motor de fluxos (Fase C do ROTEIRO) — gatilhos declarativos com condicoes por
# passo (quando/passos/se), mesmo executor blindado das correntes, e --ensaiar: o
# dry-run que mostra o plano sem tocar em disco, sem enfileirar e sem gastar limites.

import json
import os
import shutil
import subprocess
import time
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DIARIO = RAIZ / "memoria" / "historico.json"
CONTADORES = RAIZ / "memoria" / "contadores.json"
CEREBRO = RAIZ / "fluxos" / "regras.json"
RASCUNHOS = RAIZ / "fluxos" / "rascunhos"
FILA = RAIZ / "fila"
VIGILIA = RAIZ / "memoria" / "vigilia.json"
CORRENTES_DIARIO = RAIZ / "memoria" / "correntes.json"
PALCO = RAIZ / "testes" / "mundo_falso" / "ensaios"
IGNORADAS = {"__pycache__", "mundo_falso", "fila", ".git"}

SO_OLHAR = False
VIGIAR = False
ENSAIAR = False
PODAR = False
AJUDA = False
TRAVA_VELHA = False
FLAGS_CONHECIDAS = {"--so-olhar", "--vigiar", "--ensaiar", "--podar-sombra", "--ajuda"}


def _flags(argv, trava_velha=False):
    """Bandeiras lidas SEMPRE da lista passada: flag congelada no import ja
    mordeu teste as costas. Flag desconhecida devolve False (aviso no main)."""
    global SO_OLHAR, VIGIAR, ENSAIAR, PODAR, AJUDA, TRAVA_VELHA
    extra = {"--trava-velha"} if trava_velha else set()
    if set(argv) - (FLAGS_CONHECIDAS | extra):
        return False
    SO_OLHAR = "--so-olhar" in argv
    VIGIAR = "--vigiar" in argv
    ENSAIAR = "--ensaiar" in argv
    PODAR = "--podar-sombra" in argv
    AJUDA = "--ajuda" in argv
    TRAVA_VELHA = "--trava-velha" in argv
    return True


_flags(os.sys.argv[1:])


def ajuda_texto():
    return ("super-agente — usos:\n"
            "  python agente\\loop.py                :: uma rodada vigiada por voce\n"
            "  python agente\\loop.py --so-olhar      :: observa, nao toca em nada (nem julga)\n"
            "  python agente\\loop.py --vigiar         :: o porteiro bate ponto\n"
            "  python agente\\loop.py --vigiar --ensaiar :: ensaio: mostra o plano, zero toque\n"
            "  python agente\\loop.py --podar-sombra  :: varre fantasmas (arquivos que sumiram)\n"
            "  --trava-velha                          :: (tick) cede a vez se outra batida estiver viva\n"
            "qualquer outra flag: erro claro em vez de silencio\n")


_CORROMPIDOS = []


def ler_json(caminho, padrao):
    """Corrompido NAO e ausente: ausencia e recomeco limpo, corrupcao e um
    grito gravado em _CORROMPIDOS (visivel por ler_json_info). O arquivo
    suspeito fica onde esta — apagar ou nao e decisao humana."""
    origem = Path(caminho)
    try:
        texto = origem.read_text(encoding="utf-8")
    except FileNotFoundError:
        return padrao
    except OSError as erro:
        _CORROMPIDOS.append("%s: o disco nao deixou ler (%s)" % (origem.name, erro))
        return padrao
    try:
        return json.loads(texto)
    except json.JSONDecodeError as erro:
        _CORROMPIDOS.append("%s: existe mas esta corrompido (%s) — usei o padrao e deixei o "
                            "arquivo la; a decisao de apagar e sua" % (origem.name, erro))
        return padrao


def ler_json_info():
    return list(_CORROMPIDOS)


def escrever_json(caminho, dados):
    """Atomico: .part + fsync + os.replace. Queda de luz no meio da escrita nao
    deixa mais JSON cortado pra tras — ou vale o antigo inteiro, ou o novo."""
    destino = Path(caminho)
    destino.parent.mkdir(parents=True, exist_ok=True)
    provisorio = destino.with_name(destino.name + ".part")
    with open(provisorio, "w", encoding="utf-8") as f:
        json.dump(dados, f, indent=2, ensure_ascii=False)
        f.flush()
        os.fsync(f.fileno())
    os.replace(str(provisorio), str(destino))


def ler_cerebro():
    regras = ler_json(CEREBRO, {})
    if not isinstance(regras.get("acoes"), list):
        return {"acoes": []}
    return regras


def listar_pastas():
    pastas = []
    for item in sorted(RAIZ.iterdir()):
        if item.is_dir() and item.name not in IGNORADAS:
            if item.name.startswith("."):
                continue
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
    registrar_experiencia("acao:%s" % regra.get("id", "?"), "criou", +1.0)
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


PASTAS_CANDIDATAS = {
    "desktop": ("Desktop", os.path.join("OneDrive", "Desktop"),
                os.path.join("OneDrive", "\u00c1rea de Trabalho"), "\u00c1rea de Trabalho"),
    "downloads": ("Downloads", "Transfer\u00eancias",
                  os.path.join("OneDrive", "Downloads"),
                  os.path.join("OneDrive", "Transfer\u00eancias")),
}


# extensoes que o canal abrir: jamais toca: cada uma delas pode rodar codigo
JAMAIS_ABRIR = {".exe", ".bat", ".cmd", ".ps1", ".psm1", ".vbs", ".vbe", ".js", ".jse",
                ".wsf", ".wsh", ".msi", ".msp", ".scr", ".com", ".pif", ".lnk", ".url",
                ".reg", ".hta", ".cpl"}


def descobrir_pasta(nome_olho):
    casa = Path(os.environ.get("AGENTE_CASA") or os.path.expanduser("~"))
    candidatos = PASTAS_CANDIDATAS.get(nome_olho, (nome_olho,))
    for nome in candidatos:
        teste = casa / nome
        if teste.exists():
            return teste
    return casa / candidatos[0]


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
        linhas.append("pastas soltas na pasta vigiada: %d" % len(pastas))
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
        return []
    olhos = politica.get("olhos")
    if not isinstance(olhos, list) or not olhos:
        olhos = [{"nome": "desktop", "relatorio_em": politica.get("relatorio_em")}]
    resultados = []
    for olho in olhos:
        if not isinstance(olho, dict):
            continue
        nome_olho = str(olho.get("nome") or "desktop").strip().lower()
        pasta = descobrir_pasta(nome_olho)
        if not pasta.exists():
            resultados.append({"olho": nome_olho, "mudou": False,
                              "linha": "procurei %s e nao achei: nada feito" % pasta})
            continue
        nome_relatorio = olho.get("relatorio_em") or politica.get("relatorio_em")
        if not nome_relatorio or not dentro_do_projeto(RAIZ / nome_relatorio):
            resultados.append({"olho": nome_olho, "mudou": False,
                              "linha": "o relatorio do olho '%s' aponta pra fora do projeto: barrado" % nome_olho})
            continue
        destino = RAIZ / nome_relatorio
        try:
            novo, soltos = inventariar(pasta)
        except OSError as erro:
            resultados.append({"olho": nome_olho, "mudou": False,
                              "linha": "quase li %s, mas o Windows nao deixou (%s)" % (nome_olho, erro)})
            continue
        antigo = destino.read_text(encoding="utf-8") if destino.exists() else ""
        if politica.get("so_quando_mudar", True) and antigo and corpo(antigo) == corpo(novo):
            resultados.append({"olho": nome_olho, "mudou": False,
                              "linha": "nada mudou em %s: %s ja estava atualizado" % (nome_olho, destino.name)})
            continue
        try:
            destino.parent.mkdir(parents=True, exist_ok=True)
            destino.write_text(novo, encoding="utf-8")
        except OSError as erro:
            resultados.append({"olho": nome_olho, "mudou": False,
                              "linha": "quase escrevi %s, mas o disco disse nao (%s)" % (destino.name, erro)})
            continue
        resultados.append({"olho": nome_olho, "mudou": True,
                          "linha": "olhei %s (%d arquivos soltos) e escrevi %s"
                                   % (pasta.name, soltos, nome_relatorio.replace("\\", "/"))})
    return resultados


def comando_permitido(cmd):
    politica = ler_cerebro().get("execucao", {})
    if not isinstance(politica, dict) or not politica.get("ligada", False):
        return False
    permitidas = politica.get("permitidas", [])
    if not isinstance(permitidas, list):
        return False
    limpo = " ".join(cmd.split())
    if any(c in limpo for c in ("&&", "||", "|", ">", "<", ";", "&", "`", '"')):
        return False
    return limpo in [" ".join(str(p).split()) for p in permitidas]


def executar_comando(cmd):
    if not comando_permitido(cmd):
        return None, "comando fora da coleira: nao esta em execucao.permitidas (ou tem simbolo proibido)"
    politica = ler_cerebro().get("execucao", {})
    if isinstance(politica, dict) and politica.get("so_com_humano", False) and SO_OLHAR:
        return None, ("so_com_humano: com --so-olhar na mesa, comando nenhum roda "
                      "(corrente ja mandou pra fila da madrugada)")
    try:
        proc = subprocess.run(cmd.split(), shell=False, cwd=str(RAIZ),
                              capture_output=True, text=True,
                              timeout=politica.get("timeout", 15))
    except FileNotFoundError:
        return None, "comando nao existe no PATH (lembra: dir e echo moram no cmd, nao valem aqui)"
    except subprocess.TimeoutExpired:
        return None, "estourou o tempo limite e foi cortado"
    except Exception as erro:
        return None, "falhou: %s" % erro
    saida = ((proc.stdout or "") + (proc.stderr or "")).strip()
    teto = politica.get("teto_saida", 4000)
    if len(saida) > teto:
        saida = saida[:teto] + "\n... (saida cortada no teto)"
    if not saida:
        saida = "(sem saida; codigo de saida %d)" % proc.returncode
    return proc.returncode, saida


def ler_tarefa(caminho):
    try:
        texto = Path(caminho).read_text(encoding="utf-8")
    except OSError:
        return None
    for linha in texto.splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#"):
            continue
        if ":" not in linha:
            return {"tipo": None, "rest": linha}
        tipo, resto = linha.split(":", 1)
        return {"tipo": tipo.strip().lower(), "rest": resto.strip()}
    return None


def mover_fila(caminho, estado):
    pasta = FILA / estado
    pasta.mkdir(parents=True, exist_ok=True)
    nome = Path(caminho).name
    destino = pasta / nome
    if destino.exists():
        destino = pasta / (datetime.now().strftime("%H%M%S-") + nome)
    try:
        Path(caminho).rename(destino)
        return destino
    except OSError:
        return None


def tratar_fila():
    linhas = []
    if SO_OLHAR:
        return linhas  # fila envenenada por terceiros nao anda sem voce na mesa
    FILA.mkdir(parents=True, exist_ok=True)
    for tarefa in sorted(FILA.glob("*.txt")):
        item = ler_tarefa(tarefa)
        if item is None:
            mover_fila(tarefa, "erros")
            linhas.append("%s: vazio ou ilegivel -> foi pra fila\erros" % tarefa.name)
            continue
        if item["tipo"] == "executar":
            codigo, saida = executar_comando(item["rest"])
            estado = "feitas" if codigo == 0 else "erros"
        elif item["tipo"] == "abrir":
            codigo, saida = executar_abrir(item["rest"])
            estado = "feitas" if codigo == 0 else "erros"
        elif item["tipo"] == "avisar":
            codigo, saida, estado = 0, item["rest"], "feitas"
        else:
            codigo = None
            saida = "tipo que eu nao conheco: use executar:<comando>, abrir:<arquivo ou pasta> ou avisar:<recado>"
            estado = "erros"
        texto = ("# fila atendida em %s\n# tarefa: %s\n# pedido: %s\n# codigo de saida: %s\n\n%s\n"
                 % (datetime.now().isoformat(timespec="seconds"), tarefa.name, item["rest"], codigo, saida))
        relatorio = RAIZ / "relatorios" / ("fila-%s.txt" % "".join(c for c in tarefa.stem if c.isalnum() or c in "-_"))
        try:
            if dentro_do_projeto(relatorio):
                relatorio.parent.mkdir(parents=True, exist_ok=True)
                relatorio.write_text(texto, encoding="utf-8")
        except OSError as erro:
            linhas.append("%s: relatorio nao coube no disco (%s), mas a fila seguiu" % (tarefa.name, erro))
        movida = mover_fila(tarefa, estado)
        rotulo = "FEITA" if estado == "feitas" else ("PROBLEMA" if movida else "TRAVADA")
        linhas.append("%s [%s] -> relatorio em relatorios/fila-%s.txt" % (tarefa.name, rotulo, tarefa.stem))
    return linhas


def fiscal_da_fila():
    # quantas tarefas presas em fila\erros esperando decisao humana
    try:
        return len([p for p in (FILA / "erros").glob("*.txt") if p.is_file()])
    except OSError:
        return 0


def politica_abrir():
    cfg = ler_cerebro().get("abrir")
    if not isinstance(cfg, dict) or not cfg.get("ligado", False):
        return None
    return cfg


def raizes_de_abrir(cfg):
    raizes = []
    for nome in cfg.get("raizes", ["projeto"]):
        rotulo = str(nome).strip().lower()
        base = RAIZ if rotulo == "projeto" else descobrir_pasta(rotulo)
        try:
            base = Path(base).resolve()
        except OSError:
            continue
        if base.exists() and base not in raizes:
            raizes.append(base)
    return raizes


def dentro_de(caminho, raiz):
    try:
        Path(caminho).relative_to(raiz)
        return True
    except ValueError:
        return False


def validar_abrir(caminho_texto):
    cfg = politica_abrir()
    if cfg is None:
        return False, "o canal abrir: esta desligado no cerebro (bloco abrir ausente ou ligado: false)"
    alvo = Path(str(caminho_texto).strip().strip('"'))
    if not alvo.is_absolute():
        alvo = RAIZ / alvo
    try:
        real = alvo.resolve()
    except OSError:
        return False, "caminho esquisito demais pra existir"
    if not real.exists():
        return False, "nao encontrei %s no disco" % real
    raizes = raizes_de_abrir(cfg)
    if not any(dentro_de(real, r) for r in raizes):
        return False, "%s esta fora das areas liberadas (%s)" % (real, ", ".join((r.name or str(r)) for r in raizes))
    if real.is_file():
        banidas = {str(e).lower() for e in cfg.get("jamais_abrir", JAMAIS_ABRIR)}
        if real.suffix.lower() in banidas:
            return False, "abrir %s? isso e um executavel com nome de documento: jamais" % real.suffix
    return True, str(real)


def executar_abrir(caminho_texto):
    liberado, resposta = validar_abrir(caminho_texto)
    if not liberado:
        return None, resposta
    if os.name != "nt":
        return None, "o canal abrir: e um servico do Windows; aqui nao ha app padrao, nao toquei em nada"
    try:
        os.startfile(resposta)
    except OSError as erro:
        return None, "a validacao passou, mas o Windows recusou abrir (%s)" % erro
    return 0, "abri %s com o app padrao do Windows" % resposta


PERMITIDO_REAL = {"ler", "contar", "escrever_dentro_do_projeto"}
PROIBIDO_REAL = {"mover", "apagar", "editar_arquivo_do_mundo"}


def politica_mundo_ok():
    """O cerebro pode declarar o que o corpo faz; o corpo cobra coerencia:
    'permitido' tem que ser verbo que existe, 'proibido' tem que ser verbo que
    de fato NINGUEM implementa. Lista inventada = aviso no log."""
    cfg = ler_cerebro().get("mundo")
    if not isinstance(cfg, dict):
        return None
    defeitos = []
    permitido = cfg.get("permitido")
    if permitido is not None:
        if not isinstance(permitido, list):
            defeitos.append("'permitido' precisa ser lista")
        elif set(permitido) - PERMITIDO_REAL:
            defeitos.append("'permitido' pede verbo que o corpo nao tem: %s"
                           % ", ".join(sorted(set(permitido) - PERMITIDO_REAL)))
    proibido = cfg.get("proibido")
    if proibido is not None:
        if not isinstance(proibido, list):
            defeitos.append("'proibido' precisa ser lista")
        elif set(proibido) - PROIBIDO_REAL:
            defeitos.append("'proibido' teme verbo que nem existe aqui: %s"
                           % ", ".join(sorted(set(proibido) - PROIBIDO_REAL)))
    return "; ".join(defeitos) or None


def politica_vigilia():
    cfg = ler_cerebro().get("vigilia")
    if not isinstance(cfg, dict) or not cfg.get("ligado", False):
        return None
    return cfg


def snapshot_pasta(pasta):
    dados = {}
    try:
        itens = sorted(pasta.iterdir())
    except OSError:
        return dados
    for item in itens:
        if item.name.lower().startswith((".", "thumbs.db")):
            continue
        if item.is_file():
            try:
                st = item.stat()
            except OSError:
                continue
            dados[item.name] = [int(st.st_mtime), st.st_size]
    return dados


def aplicar_reacoes(olho, nome_arquivo):
    logs = []
    reacoes = olho.get("ao_chegar")
    if not isinstance(reacoes, list) or not reacoes:
        reacoes = ["inventario"]
    nome_olho = str(olho.get("pasta") or "desktop").strip().lower()
    for reacao in reacoes:
        if reacao == "inventario":
            pasta = RAIZ if nome_olho == "projeto" else descobrir_pasta(nome_olho)
            try:
                texto, _ = inventariar(pasta)
                destino = RAIZ / "relatorios" / ("inventario-%s.txt" % nome_olho)
                if dentro_do_projeto(destino):
                    destino.parent.mkdir(parents=True, exist_ok=True)
                    destino.write_text(texto, encoding="utf-8")
                    logs.append("inventario atualizado")
                else:
                    logs.append("inventario recusado: fora do projeto")
            except OSError as erro:
                logs.append("inventario falhou (%s)" % erro)
        elif isinstance(reacao, dict) and "anotar" in reacao:
            linha_log = "[%s] %s | %s\n" % (datetime.now().isoformat(timespec="seconds"),
                                            nome_arquivo, reacao["anotar"])
            try:
                diario = RAIZ / "memoria" / "vigilia.log"
                if dentro_do_projeto(diario):
                    diario.parent.mkdir(parents=True, exist_ok=True)
                    with diario.open("a", encoding="utf-8") as arquivo_log:
                        arquivo_log.write(linha_log)
                    logs.append("anotado em memoria/vigilia.log")
                else:
                    logs.append("anotacao recusada: fora do projeto")
            except OSError as erro:
                logs.append("anotacao falhou (%s)" % erro)
        elif isinstance(reacao, dict) and "anotar_fila" in reacao:
            cmd = str(reacao["anotar_fila"]).strip()
            tipo = cmd.split(":", 1)[0].strip().lower() if ":" in cmd else ""
            if tipo not in ("executar", "abrir", "avisar"):
                logs.append("recusei enfileirar: tipo fora do vocabulario")
                continue
            destino = FILA / ("vigia-%s.txt" % datetime.now().strftime("%H%M%S"))
            try:
                destino.parent.mkdir(parents=True, exist_ok=True)
                destino.write_text("# escrito pelo porteiro; obedece a coleira quando voce rodar\n%s\n" % cmd,
                                   encoding="utf-8")
                logs.append("enfileirado %s (roda quando voce rodar)" % cmd.split(":")[0])
            except OSError as erro:
                logs.append("fila nao coube no disco (%s)" % erro)
        else:
            logs.append("reacao fora do vocabulario: %s" % (reacao,))
    return logs


def vigiar(AGORA=None):
    cfg = politica_vigilia()
    if cfg is None:
        return []
    AGORA = AGORA if AGORA is not None else time.time()
    try:
        tolerancia = int(cfg.get("tolerancia_seg", 90))
        teto = int(cfg.get("max_eventos", 25))
    except (TypeError, ValueError):
        tolerancia, teto = 90, 25
    estado = ler_json(VIGILIA, {})
    if not isinstance(estado, dict):
        estado = {}
    saidas = []
    vistos = 0
    for olho in cfg.get("olhos", []):
        if not isinstance(olho, dict):
            continue
        nome = str(olho.get("pasta") or "").strip().lower()
        if not nome:
            continue
        pasta = RAIZ if nome == "projeto" else descobrir_pasta(nome)
        if not pasta.exists():
            saidas.append("%s: nao achei a pasta %s, nada vigiado" % (nome, pasta))
            continue
        atual = snapshot_pasta(pasta)
        reg = estado.get(nome) if isinstance(estado.get(nome), dict) else {}
        calibrado = isinstance(reg.get("arquivos"), dict) and isinstance(reg.get("notificados"), list)
        conhecidos = reg.get("arquivos") if isinstance(reg.get("arquivos"), dict) else {}
        notificados = set(reg.get("notificados") or [])
        if not calibrado:
            estado[nome] = {"arquivos": atual, "notificados": sorted(set(atual))}
            saidas.append("%s: primeira visita — %d arquivo(s) registrados, nada foi avisado (calibracao)"
                          % (nome, len(atual)))
            continue
        mudou = {n for n in atual if n in conhecidos and atual[n] != conhecidos[n]}
        notificados -= mudou
        brutos = (set(atual) - set(conhecidos)) | mudou
        candidatos = sorted(brutos - notificados)
        maduros = [n for n in candidatos if AGORA - atual[n][0] >= tolerancia]
        imaturos = len(candidatos) - len(maduros)
        eventos = maduros[:max(0, teto - vistos)]
        vistos += len(eventos)
        for n in eventos:
            logs = aplicar_reacoes(olho, n)
            logs.extend(correntes_para(nome, pasta / n))
            logs.extend(fluxos_para(nome, pasta / n))
            notificados.add(n)
            saidas.append("%s: chegou %s -> %s" % (nome, n, "; ".join(logs) or "anotado"))
        if len(maduros) > len(eventos):
            saidas.append("%s: teto de %d eventos por rodada — o resto espera a proxima" % (nome, teto))
        if imaturos:
            saidas.append("%s: %d arquivo(s) ainda em tolerancia (chegaram ha pouco)" % (nome, imaturos))
        anunciados = set(eventos)
        atuais_fiaveis = {}
        for n_olho, st_olho in atual.items():
            if n_olho in candidatos and n_olho not in anunciados:
                if n_olho in conhecidos:
                    atuais_fiaveis[n_olho] = conhecidos[n_olho]
                # novo e imaturo fica de fora: o sinal precisa sobreviver ate amadurecer
            else:
                atuais_fiaveis[n_olho] = st_olho
        estado[nome] = {"arquivos": atuais_fiaveis,
                        "notificados": sorted(notificados & set(atuais_fiaveis))}
    if ENSAIAR:
        saidas.append("modo --ensaiar: nem a vigilia nem o diario de limites foram tocados (plano e so leitura)")
        return saidas
    escrever_json(VIGILIA, estado)
    return saidas


# ---------------------------------------------------------------- B13: olhos de saude
# Medir o PC e so ler (ctypes no Windows, /proc no resto, shutil sempre).
# Nenhum verbo novo, nenhuma coleira nova: o pulso virou linha de arquivo.

RAM_FOME_PCT = 90
DISCO_FOME_GB = 5
SAUDE_JANELA = 192  # 192 batidas de 15 min = 48 horas de historia em uma cara so


def podar_sombra():
    """Devolver ao nada os fantasmas: arquivo que sumiu do mundo sai do snapshot
    e da lista de notificados (senao o limite do fluxo gasta pra sempre num nome
    que ja nao existe). --so-olhar NUNCA poda: varrer e mexer no caderno."""
    if SO_OLHAR:
        return ["--so-olhar nao poda sombra (varrer e mexer no caderno)"]
    cfg = politica_vigilia()
    if cfg is None:
        return ["vigilancia desligada: nada a podar"]
    estado = ler_json(VIGILIA, {})
    if not isinstance(estado, dict):
        return ["caderno da vigilia ileso: nada a podar"]
    linhas, varridos = [], 0
    for olho in cfg.get("olhos", []):
        if not isinstance(olho, dict):
            continue
        nome = str(olho.get("pasta") or "").strip().lower()
        reg = estado.get(nome)
        if not nome or not isinstance(reg, dict):
            continue
        pasta = RAIZ if nome == "projeto" else descobrir_pasta(nome)
        vivos = snapshot_pasta(pasta) if pasta.exists() else {}
        arquivos = reg.get("arquivos") if isinstance(reg.get("arquivos"), dict) else {}
        some = [n for n in arquivos if n not in vivos]
        if not some:
            continue
        for n in some:
            arquivos.pop(n, None)
        notificados = [n for n in (reg.get("notificados") or []) if n in arquivos or n in vivos]
        reg["arquivos"], reg["notificados"] = arquivos, notificados
        estado[nome] = reg
        varridos += len(some)
        linhas.append("%s: %d fantasma(s) varrido(s) da sombra (%s)"
                      % (nome, len(some), ", ".join(sorted(some)[:5])))
    if varridos:
        escrever_json(VIGILIA, estado)
    if not linhas:
        linhas.append("nenhuma sombra: o caderno bate com o mundo")
    return linhas


def _caminho_saude():
    return RAIZ / "memoria" / "saude.txt"  # calculado a cada uso: o portao patcheia RAIZ


def _memoria_uso():
    """(pct_uso, livres_mb) sem pedir licenca: GlobalMemoryStatusEx no Windows, /proc no resto."""
    if os.name == "nt":
        try:
            import ctypes

            class _STATUS(ctypes.Structure):
                _fields_ = [("dwLength", ctypes.c_ulong), ("dwMemoryLoad", ctypes.c_ulong),
                            ("ullTotalPhys", ctypes.c_ulonglong), ("ullAvailPhys", ctypes.c_ulonglong),
                            ("ullTotalPageFile", ctypes.c_ulonglong), ("ullAvailPageFile", ctypes.c_ulonglong),
                            ("ullTotalVirtual", ctypes.c_ulonglong), ("ullAvailVirtual", ctypes.c_ulonglong),
                            ("ullAvailExtendedVirtual", ctypes.c_ulonglong)]

            st = _STATUS()
            st.dwLength = ctypes.sizeof(_STATUS)
            ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(st))
            return int(st.dwMemoryLoad), int(st.ullAvailPhys // (1024 * 1024))
        except Exception:
            return None, None
    try:
        total, livres = 0, 0
        for l in Path("/proc/meminfo").read_text(encoding="utf-8").splitlines():
            if l.startswith("MemTotal:"):
                total = int(l.split()[1])
            elif l.startswith("MemAvailable:"):
                livres = int(l.split()[1])
        if total > 0:
            return int(round(100.0 * (total - livres) / total)), int(livres // 1024)
    except (OSError, ValueError, IndexError):
        pass
    return None, None


def medir_saude():
    """Um retrato do PC em tres numeros: memoria, disco, nucleos. So leitura, nunca escreve la fora."""
    uso, livres_mb = _memoria_uso()
    disco = None
    try:
        du = shutil.disk_usage(str(RAIZ))
        disco = (int(du.total // (1024 ** 3)), int(du.free // (1024 ** 3)))
    except OSError:
        pass
    fome = []
    if uso is not None and uso >= RAM_FOME_PCT:
        fome.append("ram")
    if disco is not None and disco[1] < DISCO_FOME_GB:
        fome.append("disco")
    return {"ram_pct": uso, "ram_livres_mb": livres_mb,
            "disco_gb": disco[1] if disco else None,
            "disco_total_gb": disco[0] if disco else None,
            "nucleos": os.cpu_count() or 0, "fome": fome}


def linha_saude(s=None, agora=None):
    s = s or medir_saude()
    ts = (agora if agora is not None else datetime.now()).strftime("%H:%M")
    ram = "?" if s.get("ram_pct") is None else str(s["ram_pct"])
    livres = "?" if s.get("ram_livres_mb") is None else str(s["ram_livres_mb"])
    gb = "?" if s.get("disco_gb") is None else str(s["disco_gb"])
    fome = "nao" if not s.get("fome") else "SIM(%s)" % ",".join(s["fome"])
    return "%s ram=%s%% livre=%sMB disco=%sGB fome=%s" % (ts, ram, livres, gb, fome)


def bater_ponto_saude():
    """Anota o pulso em memoria/saude.txt com janela deslizante das ultimas batidas."""
    linha = linha_saude()
    caminho = _caminho_saude()
    try:
        linhas = caminho.read_text(encoding="utf-8").splitlines() if caminho.exists() else []
    except OSError:
        linhas = []
    linhas.append(linha)
    try:
        caminho.parent.mkdir(parents=True, exist_ok=True)
        caminho.write_text("\n".join(linhas[-SAUDE_JANELA:]) + "\n", encoding="utf-8")
    except OSError:
        return linha, False
    return linha, "fome=SIM" in linha


def resumo_da_madrugada(hora_fim=6):
    """O que as batidas das 22h as 8h contam: quantas foram, quantas com o PC apertado."""
    caminho = _caminho_saude()
    try:
        texto = caminho.read_text(encoding="utf-8") if caminho.exists() else ""
    except OSError:
        return None
    noturnas = []
    for l in texto.splitlines():
        partes = l.split()
        if not partes or ":" not in partes[0]:
            continue
        try:
            h = int(partes[0].split(":")[0])
        except ValueError:
            continue
        if h >= 22 or h < hora_fim:
            noturnas.append(l)
    if not noturnas:
        return None
    apertadas = sum(1 for l in noturnas if "fome=SIM" in l)
    return "%d batida(s) na madrugada, %d com o PC apertado" % (len(noturnas), apertadas)


def corrente_diario():
    diario = ler_json(CORRENTES_DIARIO, {})
    return diario if isinstance(diario, dict) else {}


def corrente_gatilhos():
    cfg = ler_cerebro().get("correntes")
    if not isinstance(cfg, dict) or not cfg.get("ligado", False):
        return []
    gatilhos = cfg.get("gatilhos")
    return gatilhos if isinstance(gatilhos, list) else []


def _enfileirar(cmd):
    destino = FILA / ("vigia-%s.txt" % datetime.now().strftime("%H%M%S%f"))
    try:
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text("# escrito por uma corrente; obedece a coleira quando voce rodar\n%s\n" % cmd,
                           encoding="utf-8")
        return True
    except OSError:
        return False


def corrente_etapa(gatilho_id, etapa, arquivo_path, disparadas):
    if not isinstance(etapa, dict):
        etapa = {"usar": etapa}
    nome = str(etapa.get("usar") or "?").strip().lower()
    if nome not in ("copiar_para_projeto", "abrir", "avisar", "executar"):
        return "elo '%s' fora do vocabulario (vale: copiar_para_projeto, abrir, avisar, executar)" % nome
    try:
        limite = int(etapa.get("max_por_arquivo", 3))
    except (TypeError, ValueError):
        limite = 3
    limite = max(1, min(limite, 50))
    chave = "%s|%s" % (gatilho_id, nome)
    if disparadas.get(chave, 0) >= limite:
        return "elo '%s' dormiu (limite de %dx por arquivo alcancado)" % (nome, limite)
    if nome == "copiar_para_projeto":
        pasta_destino = str(etapa.get("para") or "").strip().strip("\\/")
        if not pasta_destino or ".." in pasta_destino:
            return "copia barrada: destino vazio ou tenta escapar do projeto"
        destino = RAIZ / pasta_destino / arquivo_path.name
        if not dentro_do_projeto(destino):
            return "copia barrada: destino fora do projeto"
        if destino.exists():
            return "copia pulada: %s/%s ja existia" % (pasta_destino, arquivo_path.name)
        try:
            destino.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(str(arquivo_path), str(destino))
        except OSError as erro:
            return "copia falhou (%s)" % erro
        return "copiei para %s/%s" % (pasta_destino, destino.name)
    if nome == "avisar":
        texto = str(etapa.get("texto") or "(corrente sem texto)").replace("%arquivo%", arquivo_path.name)
        linha_log = "[%s] corrente %s | %s" % (datetime.now().isoformat(timespec="seconds"),
                                               gatilho_id, texto)
        diario = RAIZ / "memoria" / "vigilia.log"
        if dentro_do_projeto(diario):
            try:
                diario.parent.mkdir(parents=True, exist_ok=True)
                with diario.open("a", encoding="utf-8") as arquivo_log:
                    arquivo_log.write(linha_log + "\n")
                return "anotado em memoria/vigilia.log"
            except OSError as erro:
                return "aviso falhou (%s)" % erro
        return "aviso recusado: caderno fora do projeto"
    if nome == "abrir":
        if SO_OLHAR:
            return ("abrir virou fila da madrugada (roda quando voce rodar)"
                    if _enfileirar("abrir:" + str(arquivo_path)) else "fila nao coube no disco")
        codigo, resposta = executar_abrir(str(arquivo_path))
        return "abri" if codigo == 0 else "abrir barrado: %s" % resposta
    cmd = str(etapa.get("comando") or "").replace("%arquivo%", arquivo_path.name)
    if SO_OLHAR:
        return ("executar virou fila da madrugada (roda quando voce rodar)"
                if _enfileirar("executar:" + cmd) else "fila nao coube no disco")
    codigo, resposta = executar_comando(cmd)
    return "comando cumpriu" if codigo == 0 else "comando: %s" % resposta


def correntes_para(nome_olho, arquivo_path):
    saidas = []
    for gatilho in corrente_gatilhos():
        if not isinstance(gatilho, dict):
            continue
        se = gatilho.get("se") if isinstance(gatilho.get("se"), dict) else {}
        olho_g = str(se.get("olho") or "").strip().lower()
        if olho_g and olho_g != str(nome_olho).strip().lower():
            continue
        ext = str(se.get("extensao") or "").strip().lower()
        if ext and ext != arquivo_path.suffix.lower():
            continue
        id_g = str(gatilho.get("id") or "sem-id")
        diario = corrente_diario()
        chave_evt = "%s|%s" % (id_g, arquivo_path.name)
        registro = diario.get(chave_evt)
        if not isinstance(registro, dict):
            registro = {"disparadas": {}, "ultima": None}
        disparadas = registro.get("disparadas") if isinstance(registro.get("disparadas"), dict) else {}
        resultado = []
        etapas = gatilho.get("etapas") if isinstance(gatilho.get("etapas"), list) else []
        for etapa in etapas:
            if ENSAIAR:
                nome_e = str(etapa.get("usar") if isinstance(etapa, dict) else etapa).strip().lower()
                resultado.append("ensaio: passo '%s' dispararia" % (nome_e or "?"))
                continue
            rotulo = corrente_etapa(id_g, etapa, arquivo_path, disparadas)
            resultado.append(rotulo)
            _experiencia_elo(id_g, str(etapa.get("usar") if isinstance(etapa, dict) else etapa).strip().lower() or "?", rotulo)
            agiu = all(p not in rotulo for p in ("dormiu", "barrad", "fora do vocabulario", "falhou", "recusado"))
            if agiu:
                usar = str(etapa.get("usar") if isinstance(etapa, dict) else etapa).strip().lower()
                k = "%s|%s" % (id_g, usar)
                disparadas[k] = disparadas.get(k, 0) + 1
        registro["disparadas"] = disparadas
        registro["ultima"] = datetime.now().isoformat(timespec="seconds")
        if not ENSAIAR:
            diario[chave_evt] = registro
            escrever_json(CORRENTES_DIARIO, diario)
        saidas.append("corrente %s: %s" % (id_g, "; ".join(resultado) or "sem etapas"))
    return saidas


# ---------------------------------------------------------------- Motor de fluxos (Fase C: gatilhos com condicao)
# Herda o executor blindado das correntes (os 4 verbos do vocabulario e os limites por
# arquivo) e acrescenta o que faltava pra virar produto: declaracao condicional por
# passo e --ensaiar, o dry-run que le o plano sem tocar no mundo.

def _txt_normal(texto):
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFD", str(texto))
                   if unicodedata.category(c) != "Mn").lower()


def _fluxos_config():
    cfg = ler_cerebro().get("fluxos")
    if not isinstance(cfg, dict) or not cfg.get("ligado", False):
        return []
    gatilhos = cfg.get("gatilhos")
    return gatilhos if isinstance(gatilhos, list) else []


def _bate_quando(quando, nome_olho, arquivo_path, tamanho):
    if not isinstance(quando, dict):
        return False
    olho = str(quando.get("olho") or "").strip().lower()
    if olho and olho != str(nome_olho).strip().lower():
        return False
    ext = str(quando.get("extensao") or "").strip().lower()
    if ext and ext != arquivo_path.suffix.lower():
        return False
    contem = str(quando.get("nome_contem") or "").strip()
    if contem and _txt_normal(contem) not in _txt_normal(arquivo_path.name):
        return False
    minimo = quando.get("tamanho_min_kb")
    if minimo is not None and (tamanho is None or tamanho < int(minimo) * 1024):
        return False
    maximo = quando.get("tamanho_max_kb")
    if maximo is not None and (tamanho is None or tamanho > int(maximo) * 1024):
        return False
    return True


def _bate_se(se, arquivo_path, tamanho):
    if not isinstance(se, dict) or not se:
        return True
    return _bate_quando(dict(se, olho="", extensao=""), "", arquivo_path, tamanho)


def fluxos_para(nome_olho, arquivo_path):
    saidas = []
    try:
        tamanho = arquivo_path.stat().st_size
    except OSError:
        tamanho = None
    for gatilho in _fluxos_config():
        if not isinstance(gatilho, dict):
            continue
        id_g = str(gatilho.get("id") or "sem-id")
        try:
            bate = _bate_quando(gatilho.get("quando"), nome_olho, arquivo_path, tamanho)
        except (TypeError, ValueError):
            saidas.append("fluxo %s: 'quando' com condicao invalida (fluxo ignorado)" % id_g)
            continue
        if not bate:
            continue
        diario = corrente_diario()
        chave_evt = "fluxo:%s|%s" % (id_g, arquivo_path.name)
        registro = diario.get(chave_evt)
        if not isinstance(registro, dict):
            registro = {"disparadas": {}, "ultima": None}
        disparadas = registro.get("disparadas") if isinstance(registro.get("disparadas"), dict) else {}
        resultado = []
        passos = gatilho.get("passos") if isinstance(gatilho.get("passos"), list) else []
        for passo in passos:
            p = passo if isinstance(passo, dict) else {"usar": passo}
            nome = str(p.get("usar") or "?").strip().lower()
            try:
                ok_se = _bate_se(p.get("se"), arquivo_path, tamanho)
            except (TypeError, ValueError):
                resultado.append("passo '%s': 'se' invalido (passo ignorado)" % nome)
                continue
            if not ok_se:
                resultado.append("passo '%s' pulado (condicao 'se' nao bateu)" % nome)
                continue
            if ENSAIAR:
                resultado.append("ensaio: passo '%s' dispararia" % nome)
                continue
            rotulo = corrente_etapa("fluxo:" + id_g, p, arquivo_path, disparadas)
            resultado.append(rotulo)
            _experiencia_elo("fluxo:" + id_g, nome, rotulo)
            agiu = all(q not in rotulo for q in ("dormiu", "barrad", "fora do vocabulario",
                                                 "falhou", "recusado", "pulado", "ignorado"))
            if agiu:
                k = "fluxo:%s|%s" % (id_g, nome)
                disparadas[k] = disparadas.get(k, 0) + 1
        registro["ultima"] = datetime.now().isoformat(timespec="seconds")
        if not ENSAIAR:
            registro["disparadas"] = disparadas
            diario[chave_evt] = registro
            escrever_json(CORRENTES_DIARIO, diario)
        prefixo = "ensaio fluxo %s" if ENSAIAR else "fluxo %s"
        saidas.append((prefixo + ": %s") % (id_g, "; ".join(resultado) or "sem passos"))
    return saidas


def _caminho_trava():
    return RAIZ / "memoria" / ".trava"


def trava_adquirir(pid=None, agora=None):
    """Vela de ocupacao na porta do caderno: duas batidas mastigariam o diario.
    Ocupada por pid VIVO e fresco (<=10 min) -> recusa, com motivo honesto.
    Vela de pid morto ou velha -> assume e segue."""
    pid = os.getpid() if pid is None else int(pid)
    agora = time.time() if agora is None else float(agora)
    caminho = _caminho_trava()
    dados = ler_json(caminho, {})
    if isinstance(dados, dict) and dados.get("pid"):
        try:
            outro = int(dados.get("pid"))
            idade = agora - float(dados.get("quando_epoch", 0))
        except (TypeError, ValueError):
            outro, idade = None, 10 ** 9
        vivo = outro is not None and outro != pid
        if vivo:
            try:
                os.kill(outro, 0)
            except OSError:
                vivo = False
        if vivo and idade <= 600:
            return False, ("outra batida (pid %s, %ds atras) esta na frente — "
                           "essa aqui recua limpa" % (outro, int(idade)))
    escrever_json(caminho, {"pid": pid,
                            "quando": datetime.now().isoformat(timespec="seconds"),
                            "quando_epoch": agora})
    return True, None


def trava_liberar(pid=None):
    pid = os.getpid() if pid is None else int(pid)
    dados = ler_json(_caminho_trava(), {})
    if isinstance(dados, dict) and dados.get("pid") == pid:
        try:
            _caminho_trava().unlink()
        except OSError:
            pass


# ---------------------------------------------------------------- Aprendizado (B15)
# Aprendizado por experiencia SEM API e SEM GPU: um caderno de eventos com pesos
# e decaimento exponencial (meia-vida de 14 dias) — o primo honesto do reforço.
# O agente nunca muda regra sozinho por causa de placar: ele so da conselho no
# log. O sim continua sendo do humano (doutrina: agente propoe, teste decide).

def _caminho_aprendizado():
    return RAIZ / "memoria" / "aprendizado.json"


def registrar_experiencia(chave, tipo, peso):
    """Uma linha no caderno de experiencia. --so-olhar NUNCA julga: so le o mundo."""
    if SO_OLHAR:
        return False
    caminho = _caminho_aprendizado()
    dados = ler_json(caminho, {})
    eventos = dados.get("eventos") if isinstance(dados, dict) else None
    if not isinstance(eventos, list):
        eventos = []
    eventos.append([datetime.now().isoformat(timespec="seconds"), str(chave),
                    str(tipo), float(peso)])
    cfg = ler_cerebro().get("aprendizado")
    cfg = cfg if isinstance(cfg, dict) else {}
    teto = cfg.get("limite_eventos", 1200)
    if isinstance(eventos, list) and len(eventos) > teto:  # caderno com margem, nada infinito
        eventos = eventos[-teto:]
    escrever_json(caminho, {"eventos": eventos})
    return True


def pesos_aprendido(janela_dias=None, meia_vida_dias=None):
    """Placar por chave: soma de pesos * 0.5^(idade/meia-vida). O tempo apaga
    lembrancas velhas — experiencia de ontem vale mais que a de marco."""
    dados = ler_json(_caminho_aprendizado(), {})
    eventos = dados.get("eventos", []) if isinstance(dados, dict) else []
    cfg = ler_cerebro().get("aprendizado")
    cfg = cfg if isinstance(cfg, dict) else {}
    if janela_dias is None:
        janela_dias = cfg.get("janela_dias", 60)
    if meia_vida_dias is None:
        meia_vida_dias = cfg.get("meia_vida_dias", 14.0)
    agora = datetime.now()
    acumulado = {}
    for ev in eventos:
        try:
            quando = datetime.fromisoformat(str(ev[0]))
            chave, peso = str(ev[1]), float(ev[3])
        except (ValueError, TypeError, IndexError):
            continue
        idade = max(0.0, (agora - quando).total_seconds() / 86400.0)
        if idade > janela_dias:
            continue
        ant = acumulado.get(chave, (0.0, 0))
        acumulado[chave] = (ant[0] + peso * (0.5 ** (idade / meia_vida_dias)), ant[1] + 1)
    return sorted(((c, round(s, 2), q) for c, (s, q) in acumulado.items()),
                  key=lambda item: -item[1])


def conselhos_aprendido():
    """Conselhos nascidos da experiencia — propostas, nunca atos. Alucinacao
    nao tem vez aqui: so fala quem tem evento de verdade no caderno."""
    conselhos = []
    for chave, score, qtd in pesos_aprendido():
        if score <= -2.0 and qtd >= 2:
            conselhos.append("%s: score %s em %d eventos — a experiencia pede retrucar ou aposentar essa regra"
                             % (chave, score, qtd))
        elif score >= 3.0 and qtd >= 3:
            conselhos.append("%s: score %s em %d eventos — regra confiavel, candidata a ganhar mais mundo"
                             % (chave, score, qtd))
    return conselhos[:5]


def _experiencia_elo(gatilho_id, nome_elo, resultado):
    """Uma etapa deu certa ou torta? O julgo e o texto que o proprio executor
    fabricou — sem inventar segunda fonte de verdade."""
    ruins = ("barrada", "barrado", "falhou", "dormiu", "pulado", "recusado", "fora do vocabulario")
    peso = -1.0 if any(m in resultado for m in ruins) else 0.5
    registrar_experiencia("%s|elo:%s" % (gatilho_id, nome_elo), "etapa", peso)


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
    if politica.get("so_acoes_de_criar") is False:
        enterradas.append("auto-promocao calada: o cerebro marcou so_acoes_de_criar=false "
                          "e aqui so existe acao de criar — nada a propor")
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
            registrar_experiencia("rascunho:%s" % id_nova, "portao-barrou", -0.5)
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
        registrar_experiencia("acao:%s" % proposta["id"], "promovida-pelo-humano", +2.0)
        aprovadas.append(proposta["id"])
    return aprovadas


def rodar():
        if VIGIAR and (SO_OLHAR or ENSAIAR):
            rotulo = "ensaio do porteiro em" if ENSAIAR else "tick do porteiro em"
            print("%s %s" % (rotulo, datetime.now().isoformat(timespec="seconds")))
            for v in (vigiar() or ["nada novo por enquanto"]):
                print(" -", v)
            if not ENSAIAR:
                pulso, faminto = bater_ponto_saude()
                print(" - saude:", pulso)
                if 6 <= datetime.now().hour < 9:
                    madrugada = resumo_da_madrugada()
                    if madrugada:
                        print(" - madrugada:", madrugada)
            return 0
        if PODAR and not VIGIAR:
            for linha in podar_sombra():
                print("podar-sombra:", linha)
            return 0
        pastas = listar_pastas()
        mundo = olhar_mundo()
        vigiou = vigiar() if VIGIAR else []
        fila_resumo = tratar_fila()
        presos = fiscal_da_fila()
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
                    "mundo": [m["linha"] for m in mundo] if mundo else None,
                    "vigiou": vigiou if VIGIAR else None,
                    "fila": fila_resumo, "fila_erros": presos, "fatos": fatos,
                    "rascunhou": rascunhos, "rejeitou_propor": ignoradas, "promoveu": aprovadas}
        total = lembrar(registro)
        cont = registrar_rodada(fatos, ignoradas, acao is not None)
        cronicos, espalhadas, enterradas_map = contar_fatos(cont)
        enterradas_txt = ["%s foi barrado %dx: ideia enterrada" % (i, q) for i, q in enterradas_map.items()]
        print("o agente viu:", pastas)
        for m in mundo:
            print("o agente olhou o mundo:", m["linha"])
        for v in vigiou:
            print("o agente vigiou:", v)
        defeito_mundo = politica_mundo_ok()
        if defeito_mundo:
            print("   - AVISO de contrato: mundo.permitido/proibido lista verbo que o corpo nao "
                  "pratica (%s) — conserte o cerebro" % defeito_mundo)
        if PODAR:
            for linha in podar_sombra():
                print("podar-sombra:", linha)
        if VIGIAR:
            pulso, faminto = bater_ponto_saude()
            print("o agente mediu a saude:", pulso)
        if fila_resumo:
            print("o agente atendeu a fila:")
            for linha in fila_resumo:
                print("   -", linha)
        if presos:
            print("   - o fiscal da fila: ha %d tarefa(s) presa(s) em fila\erros; "
                  "leia o relatorio, corrija e devolva pra fila (ou apague com a sua mao)" % presos)
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
        for linha in conselhos_aprendido():
            print("   - a experiencia sugere:", linha)
        for linha in ignoradas:
            print("   - O PORTAO BARROU:", linha)
        saidas = list(enterradas_txt)
        for linha in ja_enterradas:
            if linha.split(":")[0] not in "".join(enterradas_txt):
                saidas.append(linha)
        for linha in saidas:
            print("   - ele DESISTE de:", linha)
        for id_novo in rascunhos:
            print("   - propoe fluxos/rascunhos/%s.json   (ativa: false)" % id_novo)
        for linha in aprovadas:
            print("   - CEREBRO GANHOU:", linha)
        print("o agente lembra:", total, "registros em memoria/historico.json")


if __name__ == "__main__":
    if AJUDA:
        print(ajuda_texto())
        raise SystemExit(0)
    if not _flags(os.sys.argv[1:], trava_velha=True):
        desconhecidas = [a for a in os.sys.argv[1:]
                         if a not in (FLAGS_CONHECIDAS | {"--trava-velha"})]
        print("flag que eu nao conheco: %s\n%s" % (" ".join(desconhecidas), ajuda_texto()))
        raise SystemExit(2)
    travado, codigo = False, 0
    try:
        if not SO_OLHAR:
            travado, motivo = trava_adquirir()
            if not travado:
                print("o agente adiou esta batida: %s" % motivo)
                raise SystemExit(0)
        codigo = rodar() or 0
    finally:
        if travado:
            trava_liberar()
        avisos = ler_json_info()
        if avisos:
            codigo = codigo or 1
            print("ATENCAO — caderno corrompido detectado (nada foi apagado por mim):")
            for a in avisos:
                print("   -", a)
    raise SystemExit(codigo)
