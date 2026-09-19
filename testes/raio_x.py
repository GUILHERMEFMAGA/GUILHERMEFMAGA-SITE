# -*- coding: utf-8 -*-
# RAIO-X do super-agente: fotografa o corpo inteiro e explica em portugues.
# Ele NAO toca em nada do paciente: so le. O unico arquivo que escreve e um
# teste de escrita em relatorios/, criado e apagado na hora.
# Saida: [OK] funciona, [DICA] pode melhorar, [AVISO] atencao, [PROBLEMA] quebrou.
# Codigo de saida: 0 = sem problemas, 1 = pelo menos um PROBLEMA (pra portao usar).

import ast
import json
import os
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

# anatomia obrigatoria do loop (versao com fila + coleira + fiscal + dois olhos)
FERRAMENTAS_DO_CORPO = [
    "ler_json", "escrever_json", "ler_cerebro", "listar_pastas", "arquivos_de",
    "descobrir_acao", "decidir_acao", "executar", "lembrar", "ler_contadores",
    "registrar_rodada", "contar_fatos", "corpo", "dentro_do_projeto",
    "inventariar", "olhar_mundo", "descobrir_pasta", "comando_permitido",
    "executar_comando", "ler_tarefa", "mover_fila", "tratar_fila",
    "fiscal_da_fila", "ensaiar", "propor", "promover",
]

# comandos que o raio-x reconhece como leitura pura (dicionario de seguranca)
DICT_SEGURO = ["git status", "git log", "python --version", "pip list", "pip show",
               "ver", "whoami"]

# verbos que nunca podem estar na coleira (escrevem ou destroem no PC)
VERBOS_PERIGO = ["del", "erase", "rd", "rm", "format", "move", "copy", "md", "mkdir",
                 "shutdown", "taskkill", "reg", "curl", "wget", "start", "runas",
                 "cipher", "attrib", "takeown", "icacls", "rmdir", "powershell", "cmd"]

SIMBOLOS_INJECAO = ["&&", "||", "|", ">", "<", ";", "`", "$(", "%"]

problemas = []
avisos = []
dicas = 0
oks = 0


def linha(marcador, rotulo, texto):
    print("[%s] %-16s %s" % (marcador, rotulo, texto))


def ok(rotulo, texto):
    global oks
    oks += 1
    linha("OK      ", rotulo, texto)


def dica(rotulo, texto):
    global dicas
    dicas += 1
    linha("DICA    ", rotulo, texto)


def aviso(rotulo, texto, continuação=None):
    avisos.append(rotulo)
    linha("AVISO   ", rotulo, texto)
    if continuação:
        print("         ↳ %s" % continuação)


def problema(rotulo, texto, conserto):
    problemas.append(rotulo)
    linha("PROBLEMA", rotulo, texto)
    linha("CONERTO ", rotulo, conserto)


def posicao_do_erro(erro, caminho):
    try:
        return "linha %d, coluna %d" % (erro.lineno, erro.colno)
    except AttributeError:
        return "em algum lugar de %s" % caminho


def ler_json_seguro(caminho):
    return json.loads(Path(caminho).read_text(encoding="utf-8"))


# ---------------------------------------------------------------- python
def checar_python():
    v = sys.version_info
    if (v.major, v.minor) >= (3, 8):
        ok("python", "versao %d.%d.%d — o laco roda bem aqui" % (v.major, v.minor, v.micro))
    else:
        problema("python", "versao %d.%d abaixo do minimo 3.8" % (v.major, v.minor),
                 "instale um Python novo do python.org e abra o VS Code de novo")


# ---------------------------------------------------------------- cerebro
def checar_cerebro():
    caminho = RAIZ / "fluxos" / "regras.json"
    if not caminho.exists():
        problema("cerebro", "fluxos/regras.json nao existe",
                 "crie o arquivo com o conteudo do bloco combinado (regras.json)")
        return None
    try:
        cerebro = ler_json_seguro(caminho)
    except json.JSONDecodeError as erro:
        problema("cerebro", "JSON quebrado em %s: %s" % (posicao_do_erro(erro, caminho), erro.msg),
                 "abra o arquivo no VS Code e conserte a linha apontada (faltou virgula, aspas ou chaves)")
        return None
    except OSError as erro:
        problema("cerebro", "o disco nao deixou ler: %s" % erro,
                 "feche o arquivo em outros programas e tente de novo")
        return None
    if not isinstance(cerebro, dict):
        problema("cerebro", "o topo do arquivo nao e um objeto { }",
                 "a raiz do JSON precisa comecar com { e terminar com }")
        return None
    faltas = [c for c in ("acoes", "mundo", "execucao", "auto_promocao") if c not in cerebro]
    if faltas:
        problema("cerebro", "faltam blocos: %s" % ", ".join(faltas),
                 "use o regras.json inteiro do bloco entregue; nao apague chaves por engano")
        return cerebro
    acoes = cerebro["acoes"]
    if not isinstance(acoes, list):
        problema("cerebro", "acoes nao e uma lista [ ]",
                 "acoes precisa ser lista de regras entre colchetes")
    else:
        quebradas = []
        for i, regra in enumerate(acoes):
            if not isinstance(regra, dict):
                quebradas.append("posicao %d nao e objeto" % i)
            elif not all(k in regra for k in ("id", "pasta_com_conteudo", "criar_arquivo", "conteudo")):
                quebradas.append("'%s' sem id/pasta_com_conteudo/criar_arquivo/conteudo" % regra.get("id", i))
        ids = [r.get("id") for r in acoes if isinstance(r, dict)]
        repetidos = sorted({x for x in ids if ids.count(x) > 1}, key=str)
        if quebradas:
            problema("cerebro", "%d regra(s) malformada(s): %s" % (len(quebradas), "; ".join(quebradas[:3])),
                     "copie o bloco da regra no modelo do README inteiro, sem editar as chaves")
        elif repetidos:
            problema("cerebro", "ids de regra repetidos: %s" % ", ".join(map(str, repetidos)),
                     "cada regra precisa de id unico; renomeie a duplicata")
        elif len(acoes) > 6:
            aviso("cerebro", "%d regras — acima do limite de seguranca do proprio agente (6)" % len(acoes),
                  "o agente para de propor sozinho nesse tamanho; considere aposentar uma regra")
        else:
            ok("cerebro", "%d regra(s): %s" % (len(acoes), ", ".join(map(str, ids))))

    mundo = cerebro["mundo"]
    if not isinstance(mundo, dict):
        problema("cerebro.mundo", "bloco mundo nao e objeto { }", "conserte as chaves do bloco mundo")
    else:
        olhos = mundo.get("olhos")
        rels = []
        if isinstance(olhos, list) and olhos:
            rels = [o.get("relatorio_em") for o in olhos if isinstance(o, dict)]
        if mundo.get("relatorio_em"):
            rels.append(mundo["relatorio_em"])
        fora = [r for r in rels if not (isinstance(r, str) and r.startswith("relatorios") and ".." not in r)]
        if fora:
            problema("cerebro.mundo", "relatorio aponta pra fora de relatorios/: %s" % fora,
                     "relatorio_em deve comecar com relatorios/ — exemplo: relatorios/inventario-x.txt")
        elif not mundo.get("ligado"):
            dica("cerebro.mundo", "os olhos estao fechados (ligado: false) — ele nao ve o Desktop nem o Downloads")
        else:
            ok("cerebro.mundo", "%d olho(s) vigiando, relatorios dentro do projeto" % max(len(rels), 1))

    execu = cerebro["execucao"]
    if not isinstance(execu, dict):
        problema("cerebro.execucao", "bloco execucao nao e objeto { }", "conserte as chaves do bloco execucao")
        return cerebro
    permitidas = execu.get("permitidas", [])
    timeout = execu.get("timeout", 15)
    teto = execu.get("teto_saida", 4000)
    males = []
    if not isinstance(permitidas, list) or not permitidas:
        males.append("permitidas vazia ou fora de formato — sem lista a coleira barra TODO mundo (seguro, mas mudo)")
    if not (isinstance(timeout, int) and not isinstance(timeout, bool) and 1 <= timeout <= 120):
        males.append("timeout=%r precisa ser inteiro entre 1 e 120 segundos" % (timeout,))
    if not (isinstance(teto, int) and not isinstance(teto, bool) and teto >= 200):
        males.append("teto_saida=%r precisa ser inteiro >= 200" % (teto,))
    if males:
        problema("cerebro.execucao", "; ".join(males),
                 "conserte so o campo apontado; o modelo seguro e timeout 15 e teto_saida 4000")
    else:
        ok("cerebro.execucao", "coleira ligada=%s, %d comandos, timeout %ds, teto %d chars"
           % (execu.get("ligada", False), len(permitidas), timeout, teto))

    promo = cerebro["auto_promocao"]
    if isinstance(promo, dict) and promo.get("ligada") and promo.get("promover_so_apos_teste", True):
        ok("cerebro.promocao", "autopromocao so depois de ensaio — dentro da regra de ferro")
    elif isinstance(promo, dict) and promo.get("promover_so_apos_teste") is False:
        problema("cerebro.promocao", "promover_so_apos_teste desligado: regra entraria no cerebro sem teste",
                 "volte para true — o agente propoe, o teste decide, o humano aprova")
    else:
        dica("cerebro.promocao", "autopromocao desligada: o agente nao propoe regras novas (so voce cria)")
    return cerebro


# ---------------------------------------------------------------- seguranca da coleira
def checar_coleira(cerebro):
    if not isinstance(cerebro, dict):
        return
    permitidas = (cerebro.get("execucao") or {}).get("permitidas", [])
    if not isinstance(permitidas, list):
        return
    sujas = []
    estranhas = []
    for cmd in permitidas:
        c = " ".join(str(cmd).split()).lower()
        if not c:
            continue
        simbolos = [s for s in SIMBOLOS_INJECAO if s in c]
        verbos = [v for v in VERBOS_PERIGO if c.startswith(v + " ") or c == v]
        if simbolos or verbos:
            motivo = ", ".join(["simbolo de injecao " + s for s in simbolos] +
                               ["verbo que escreve/destroi: " + v for v in verbos])
            sujas.append("'%s' (%s)" % (cmd, motivo))
        elif not any(c.startswith(seguro) for seguro in DICT_SEGURO):
            estranhas.append(str(cmd))
    if sujas:
        problema("coleira", "comando perigoso na lista de permitidos: %s" % "; ".join(sujas),
                 "tiro essa linha da permitidas agora — coleira e so para leitura, regra inegociavel")
    elif estranhas:
        aviso("coleira", "%d comando(s) fora do dicionario de leitura pura: %s"
              % (len(estranhas), ", ".join(estranhas)),
              "DICA: confirme que cada um nao altera nada no PC; na duvida, tire da lista")
    elif permitidas:
        ok("coleira", "todos os %d comandos sao leitura pura (dicionario aprovado)" % len(permitidas))


# ---------------------------------------------------------------- anatomia do loop
def checar_loop():
    caminho = RAIZ / "agente" / "loop.py"
    if not caminho.exists():
        problema("loop.py", "o cerebro do agente nao existe em agente/loop.py",
                 "cole o loop.py completo do bloco mais recente")
        return
    try:
        texto = caminho.read_text(encoding="utf-8")
    except OSError as erro:
        problema("loop.py", "o disco nao deixou ler: %s" % erro, "feche a aba do arquivo e tente de novo")
        return
    try:
        arvore = ast.parse(texto)
    except SyntaxError as erro:
        problema("loop.py", "o arquivo nem compila: %s (linha %s)" % (erro.msg, erro.lineno),
                 "colado cortado no meio e o jeito mais comum: feche a aba, cole o arquivo INTEIRO de novo e Ctrl+S")
        return
    funcoes = {no.name for no in ast.walk(arvore) if isinstance(no, ast.FunctionDef)}
    faltando = [f for f in FERRAMENTAS_DO_CORPO if f not in funcoes]
    extras = sorted(funcoes - set(FERRAMENTAS_DO_CORPO))
    total = len(texto.splitlines())
    if faltando:
        problema("loop.py", "anatomia incompleta — faltam: %s (o arquivo no disco tem %d linhas)"
                 % (", ".join(faltando), total),
                 "esse loop.py e de versao ANTIGA ou colado pela metade: feche a aba, cole o bloco inteiro, Ctrl+S, rode o raio-x de novo")
        return
    ok("loop.py", "%d linhas, %d funcoes, anatomia completa (fila + coleira + fiscal + dois olhos)"
       % (total, len(funcoes)))
    if total < 550:
        aviso("loop.py", "%d linhas e anatomia ok — versao antiga com sorte? (a atual tem 584)" % total,
              "se voce ainda nao colou o B9a, esse e o empurrãozinho")
    if extras:
        dica("loop.py", "funcoes fora do meu checklist (suas ou do proprio laco — sem problema): %s"
             % ", ".join(extras[:6]))


# ---------------------------------------------------------------- .gitignore
def checar_gitignore():
    caminho = RAIZ / ".gitignore"
    exigidios = ["fila/", "relatorios/fila-", "relatorios/inventario-", "mundo_falso", "memoria/*.json"]
    if not caminho.exists():
        problema(".gitignore", "arquivo nao existe — o Git ia ver a fila inteira",
                 "crie .gitignore na raiz com as linhas do bloco combinado")
        return
    texto = caminho.read_text(encoding="utf-8", errors="replace")
    faltando = [e for e in exigidios if e not in texto]
    if faltando:
        problema(".gitignore", "faltam protecoes: %s" % ", ".join(faltando),
                 "adicione cada linha que falta no fim do .gitignore")
    else:
        ok(".gitignore", "mundo invisivel pro Git (fila, relatorios, diario, palco de ensaio)")


# ---------------------------------------------------------------- memoria
def checar_memoria():
    diario = RAIZ / "memoria" / "historico.json"
    conts = RAIZ / "memoria" / "contadores.json"
    if diario.exists():
        try:
            dados = ler_json_seguro(diario)
            if isinstance(dados, list):
                ultimo = "?"
                if dados and isinstance(dados[-1], dict):
                    ultimo = dados[-1].get("quando", "?")
                ok("diario", "%d registros; ultimo em %s" % (len(dados), ultimo))
            else:
                problema("diario", "historico.json nao e uma lista [ ]",
                         "o laco espera lista; pode apagar o arquivo (ele recomeca) ou consertar as chaves")
        except json.JSONDecodeError as erro:
            problema("diario", "diario corrompido: %s" % posicao_do_erro(erro, diario),
                     "o agente ignora diario quebrado e recomeca do zero — apague o arquivo so se aceitar perder o historico")
        except OSError as erro:
            aviso("diario", "o disco nao deixou ler: %s" % erro)
    else:
        dica("diario", "ainda sem memoria — criado na primeira rodada")
    if conts.exists():
        try:
            dados = ler_json_seguro(conts)
            if isinstance(dados, dict) and "rodadas" in dados:
                ok("contadores", "%d rodadas contadas, %d paradas" % (dados["rodadas"], dados.get("paradas", 0)))
            else:
                aviso("contadores", "sem campo rodadas — o laco reconstroi do diario sozinho",
                      "opcional: apague memoria/contadores.json e rode o laco; nada se perde")
        except (json.JSONDecodeError, OSError):
            aviso("contadores", "arquivo ilegivel — sera reconstruido do diario")
    else:
        dica("contadores", "ainda sem contadores — auto-criado na 1a rodada")


# ---------------------------------------------------------------- fila
def checar_fila():
    fila = RAIZ / "fila"
    if not fila.exists():
        dica("fila", "pasta fila/ ainda nao existe — o laco cria na 1a rodada")
        return
    pendentes = sorted(p for p in fila.glob("*.txt") if p.is_file())
    vazias = []
    formatos_ok = 0
    for p in pendentes:
        try:
            texto = p.read_text(encoding="utf-8", errors="replace").strip()
        except OSError:
            vazias.append(p.name + " (ilegivel)")
            continue
        if not texto:
            vazias.append(p.name)
            continue
        primeira = next((l.strip() for l in texto.splitlines() if l.strip() and not l.strip().startswith("#")), "")
        if ":" in primeira and primeira.split(":")[0].strip().lower() in ("executar", "avisar"):
            formatos_ok += 1
        else:
            vazias.append("%s (nao comeca com executar:/avisar: — vai direto pro erros)" % p.name)
    erros_dir = fila / "erros"
    presas = sorted(erros_dir.glob("*.txt")) if erros_dir.exists() else []
    feitas_dir = fila / "feitas"
    feitas = sorted(feitas_dir.glob("*.txt")) if feitas_dir.exists() else []
    if vazias:
        problema("fila", "tarefa vazia ou fora do formato: %s" % "; ".join(vazias),
                 "recrie com Set-Content no terminal (nunca abra no editor — foi assim que o fantasma vazia a arquivo da ultima vez)")
    if pendentes and formatos_ok == len(pendentes):
        ok("fila.formato", "%d pendente(s), todas comecam com executar:/avisar:" % len(pendentes))
    if presas:
        aviso("fila.erros", "o fiscal esta de plantao: %d presa(s) em fila/erros (%s)"
              % (len(presas), ", ".join(p.name for p in presas[:5])),
              "leia o relatorio correspondente em relatorios/fila-<nome>.txt, corrija e devolva pra fila, ou apague a prova")
    elif pendentes:
        ok("fila", "%d pendente(s) esperando a proxima rodada com voce presente" % len(pendentes))
    else:
        ok("fila", "silencio = sucesso: nada pendente, nada preso")
    if feitas:
        dica("fila.feitas", "%d tarefa(s) ja cumprida(s) desde sempre" % len(feitas))


# ---------------------------------------------------------------- guarda noturno
def checar_noturno():
    bat = RAIZ / "rodar_de_madrugada.bat"
    log = RAIZ / "memoria" / "agendado.log"
    if not bat.exists():
        problema("noturno", "rodar_de_madrugada.bat nao existe — a vigilancia noturna esta sem guarda",
                 "crie o .bat com o conteudo do bloco combinado (tem que conter --so-olhar)")
        return
    try:
        texto = bat.read_text(encoding="utf-8", errors="replace")
    except OSError as erro:
        aviso("noturno", "o .bat existe mas o disco nao deixou ler: %s" % erro)
        return
    if "--so-olhar" not in texto:
        problema("noturno", "o .bat roda o agente SEM --so-olhar: ele se autopromoveria sem voce ali",
                 "adicione --so-olhar no comando do python dentro do .bat — inegociavel")
    else:
        ok("noturno", "modo observacao gravado no .bat — de madrugada ele so olha e anota")
    if log.exists():
        try:
            texto_log = log.read_text(encoding="utf-8", errors="replace")
            blocos = texto_log.count("===== inicio")
            fim_bom = texto_log.rstrip().endswith("===== fim =====")
            ultimo = texto_log.rfind("===== inicio")
            carimbo = texto_log[ultimo:ultimo + 80].splitlines()[0].strip() if ultimo != -1 else "?"
            if blocos == 0:
                aviso("noturno.log", "o log existe mas nunca registrou rodada — o agendamento nao disparou de verdade",
                      "confira o Task Scheduler; se o PC dorme a noite, desmarque os 2 checks de energia na aba Condicoes")
            else:
                detalhe = "%d batida(s) de ponto; ultima: %s%s" % (blocos, carimbo,
                            "" if fim_bom else "  (o ultimo bloco nao terminou com '===== fim =====' — rodou e foi cortado)")
                if not fim_bom:
                    aviso("noturno.log", detalhe,
                          "provavel timeout do Windows ao suspender; o arquivo historico.json continua valido")
                else:
                    ok("noturno.log", detalhe)
        except OSError as erro:
            aviso("noturno.log", "o disco nao deixou ler o diario do agendamento: %s" % erro)
    else:
        dica("noturno.log", "sem diario do agendamento ainda — criado no 1o disparo das 19h")


# ---------------------------------------------------------------- olhos no mundo real
def checar_olhos():
    casa = Path(os.environ.get("AGENTE_CASA") or os.path.expanduser("~"))
    nomes = {"desktop": ("Desktop", "Área de Trabalho"), "downloads": ("Downloads", "Transferências")}
    cegos = []
    vivos = []
    for olho, opcoes in nomes.items():
        achado = None
        for nome in opcoes:
            for candidato in (casa / nome, casa / "OneDrive" / nome):
                if candidato.exists() and candidato.is_dir():
                    achado = candidato
                    break
            if achado:
                break
        if achado is None:
            cegos.append(olho)
        else:
            try:
                total = sum(1 for _ in achado.iterdir())
                vivos.append("%s (%d itens, lido de %s)" % (olho, total, achado))
            except OSError as erro:
                cegos.append("%s (o Windows negou leitura: %s)" % (olho, erro))
    if vivos:
        ok("olhos", "lendo " + " | ".join(vivos))
    if cegos:
        aviso("olhos", "cego(s): %s" % "; ".join(cegos),
              "so vira problema se o cerebro listar esse olho; senao, ignore — ou crie a pasta")


# ---------------------------------------------------------------- escrita local
def checar_escrita():
    relatorios = RAIZ / "relatorios"
    teste = relatorios / "raio-x-teste.tmp"
    try:
        relatorios.mkdir(parents=True, exist_ok=True)
        teste.write_text("ok", encoding="utf-8")
        leu = teste.read_text(encoding="utf-8") == "ok"
        teste.unlink()
        apagou = not teste.exists()
        if leu and apagou:
            ok("disco", "escrever, ler e apagar dentro do projeto: funcionando")
        else:
            problema("disco", "escrita falhou no teste (%s)" % ("nao leu de volta" if not leu else "nao conseguiu apagar"),
                     "feche arquivos abertos em outros programas; se persistir, o antivirus esta protegendo a pasta?")
    except OSError as erro:
        problema("disco", "o Windows negou escrita: %s" % erro,
                 "feche outros programas com o arquivo aberto; em ultimo caso, rode o VS Code como sempre e veja se o antivirus bloqueia")


# ---------------------------------------------------------------- irmao portao
def checar_portao():
    portao = RAIZ / "testes" / "testar_regras.py"
    if not portao.exists():
        problema("portao", "testes/testar_regras.py nao existe — o portao sumiu do repo",
                 "cole o testar_regras.py v4 inteiro do bloco combinado")
        return
    try:
        arvore = ast.parse(portao.read_text(encoding="utf-8"))
    except (SyntaxError, OSError) as erro:
        problema("portao", "o portao nem compila: %s" % erro,
                  "cole o testar_regras.py inteiro de novo (colado cortado e o suspeito de sempre)")
        return
    cenas = sum(1 for no in ast.walk(arvore) if isinstance(no, ast.Call)
                and isinstance(no.func, ast.Name) and no.func.id == "print")
    ok("portao", "testar_regras.py existe e compila (%d impressoes de relatorio)" % cenas)


# ---------------------------------------------------------------- rascunhos
def checar_rascunhos():
    pasta = RAIZ / "fluxos" / "rascunhos"
    if not pasta.exists():
        return
    ativos = recusados = neutros = 0
    for arquivo in sorted(pasta.glob("*.json")):
        try:
            dados = ler_json_seguro(arquivo)
        except (json.JSONDecodeError, OSError):
            aviso("rascunhos", "%s esta ilegivel — o agente ignora esse" % arquivo.name,
                  "ou conserte o JSON ou apague o rascunho")
            continue
        if not isinstance(dados, dict):
            continue
        if dados.get("motivo_da_recusa"):
            recusados += 1
        elif dados.get("ativa"):
            ativos += 1
        else:
            neutros += 1
    if ativos or recusados or neutros:
        ok("rascunhos", "%d esperando sua decisao, %d recusados, %d ja promovidos" % (neutros, recusados, ativos))


def main():
    print("=" * 78)
    print("RAIO-X do super-agente — corpo inteiro lido com calma, sem tocar em nada")
    print("=" * 78)
    print("o que cada parte faz:")
    print("  cerebro  = regras em JSON (o que ele sabe fazer)")
    print("  coleira  = lista de comandos permitidos (o que ele pode tocar)")
    print("  loop.py  = o corpo: ver, olhar, decidir, fazer, lembrar, contar, propor")
    print("  fila     = suas ordens do dia (funciona so com voce presente)")
    print("  noturno  = o vigia agendado (olha e anota, NAO toca em nada)")
    print("-" * 78)
    cerebro = None
    checagens = [
        ("python", checar_python, ()),
        ("cerebro", checar_cerebro, ()),
        ("loop", checar_loop, ()),
        ("gitignore", checar_gitignore, ()),
        ("memoria", checar_memoria, ()),
        ("fila", checar_fila, ()),
        ("noturno", checar_noturno, ()),
        ("olhos", checar_olhos, ()),
        ("escrita", checar_escrita, ()),
        ("portao", checar_portao, ()),
        ("rascunhos", checar_rascunhos, ()),
    ]
    for rotulo, checagem, args in checagens:
        try:
            resultado = checagem(*args)
            if rotulo == "cerebro":
                cerebro = resultado
        except Exception as erro:
            problema(rotulo, "a checagem quebrou por dentro: %s" % erro,
                     "anota o erro e manda o print — o diagnostico nao pode morrer junto com o doente")
    try:
        checar_coleira(cerebro)
    except Exception as erro:
        problema("coleira", "a checagem quebrou por dentro: %s" % erro, "manda o print que eu conserto o raio-x")
    print("-" * 78)
    print("PLACAR: %d ok | %d dicas | %d avisos | %d problemas" % (oks, dicas, len(avisos), len(problemas)))
    if problemas:
        print("VEREDITO: o corpo PRECISA de atencao. Conserte cada CONERTO acima e rode o raio-x de novo.")
        sys.exit(1)
    if avisos:
        print("VEREDITO: corpo funcionando; os %d aviso(s) sao decisoes suas, nao quebra nada." % len(avisos))
    else:
        print("VEREDITO: corpo 100%. Agora roda o portao de testes com cabeca limpa.")
    sys.exit(0)


if __name__ == "__main__":
    main()