# -*- coding: utf-8 -*-
# PORTAO DE TESTES v10: roda as regras do cerebro num mundo de mentirinha.
# Codigo novo so entra no cerebro se este portao abrir.
# v8: cena saude (B13) — medir nunca explode, o ponto vira linha, a janela corta e a
# madrugada conta a fome.
# v9: cena fluxos (Fase C) — gatilho com condicao, 'se' por passo e o --ensaiar que
# mostra o plano sem tocar no mundo nem gastar limites.

import importlib.util
import json
import os
import shutil
import sys
import time
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CENAS = [("so_gitkeep", [".gitkeep"], "base.py"),
         ("com_base", [".gitkeep", "base.py"], "LEIA-ME.txt"),
         ("resolvida", [".gitkeep", "base.py", "LEIA-ME.txt"], None),
         ("estranha", [".gitkeep", "nota.txt"], None)]

spec = importlib.util.spec_from_file_location("loop", RAIZ / "agente" / "loop.py")
loop = importlib.util.module_from_spec(spec)
spec.loader.exec_module(loop)

palco = RAIZ / "testes" / "mundo_falso"
print("PORTAO DE TESTES do super-agente")
print("mundo de mentirinha:", palco)

falhas = []
if palco.exists():
    shutil.rmtree(palco)
palco.mkdir(parents=True)
for nome, conteudo, _ in CENAS:
    (palco / nome).mkdir()
    for arquivo in conteudo:
        (palco / nome / arquivo).write_text("", encoding="utf-8")
falsa = RAIZ / ".vscode"
guardada = RAIZ / ".vscode_portao_backup"
if falsa.exists():
    falsa.rename(guardada)
falsa.mkdir()
(falsa / "settings.json").write_text("{}", encoding="utf-8")

antigo = loop.RAIZ
loop.RAIZ = palco
try:
    regras = loop.ler_cerebro()

    for nome, _, esperado in CENAS:
        regra, alvo = loop.descobrir_acao([nome], regras)
        if regra is None:
            saida = "Nenhum trabalho: nenhuma regra bateu com o mundo."
            criado = None
        else:
            saida = loop.executar(regra, alvo)
            criado = (palco / nome / loop.arquivos_de(regra)).exists()
        ok = (esperado is None and criado is None) or (esperado is not None and criado)
        print("  [%s] %s  -> %s" % ("ok  " if ok else "FALHA", nome, saida))
        if not ok:
            falhas.append(nome)

finally:
    loop.RAIZ = antigo
    shutil.rmtree(palco, ignore_errors=True)

vistos = loop.listar_pastas()
limpo = ".vscode" not in vistos and not any("mundo_falso" in p for p in vistos)
print("  [%s] olho limpo  -> vejo %s" % ("ok  " if limpo else "FALHA", vistos))
if not limpo:
    falhas.append("olho limpo")
if falsa.exists():
    shutil.rmtree(falsa)
if guardada.exists():
    guardada.rename(falsa)

verdadeiro = loop.SO_OLHAR
loop.SO_OLHAR = True
try:
    travado = loop.propor({"config|base.py": 9}) == ([], [], [], [])
except Exception as erro:
    travado = False
    print("     (o modo observacao quebrou: %s)" % erro)
finally:
    loop.SO_OLHAR = verdadeiro
print("  [%s] modo observacao  -> propor devolve vazio, cerebro nao muda"
      % ("ok  " if travado else "FALHA"))
if not travado:
    falhas.append("modo observacao")

permitidas = loop.ler_cerebro().get("execucao", {}).get("permitidas", [])
if isinstance(permitidas, list) and permitidas:
    amostra = str(permitidas[0])
    coleira = (loop.comando_permitido(amostra)
               and not loop.comando_permitido(amostra + " && apaga tudo")
               and not loop.comando_permitido(amostra + " | calc")
               and not loop.comando_permitido("shutdown"))
else:
    coleira = False
print("  [%s] coleira de comandos  -> lista dentro vale, injecao fora nao"
      % ("ok  " if coleira else "FALHA"))
if not coleira:
    falhas.append("coleira de comandos")

ensaio_fila = palco
ensaio_fila.mkdir(parents=True)
censa = ensaio_fila / "exemplo.txt"
censa.write_text("# comentario\n\nexecutar:%s\n" % (str(permitidas[0]) if permitidas else "nada"), encoding="utf-8")
(ensaio_fila / "vazia.txt").write_text("# so comentario\n", encoding="utf-8")
esperada = {"tipo": "executar", "rest": str(permitidas[0]) if permitidas else "nada"}
leu_certo = loop.ler_tarefa(censa) == esperada and loop.ler_tarefa(ensaio_fila / "vazia.txt") is None
shutil.rmtree(ensaio_fila, ignore_errors=True)
print("  [%s] leitor de fila  -> pula comentario, le o primeiro pedido, vazio vira None"
      % ("ok  " if leu_certo else "FALHA"))
if not leu_certo:
    falhas.append("leitor de fila")

# cena nova: dois olhos no mundo (desktop + downloads), com cerebro velho ainda valendo
palco.mkdir(parents=True)
casa_falsa = palco / "casa"
(casa_falsa / "Desktop").mkdir(parents=True)
(casa_falsa / "Desktop" / "nota.txt").write_text("oi", encoding="utf-8")
(casa_falsa / "Downloads").mkdir(parents=True)
(casa_falsa / "Downloads" / "pacote.zip").write_text("pesado", encoding="utf-8")
proj_olhos = palco / "proj"
(proj_olhos / "relatorios").mkdir(parents=True)
(proj_olhos / "fluxos").mkdir(parents=True)
cerebro_velho = {"acoes": [], "mundo": {"ligado": True, "relatorio_em": "relatorios/inventario-velho.txt"}}
(proj_olhos / "fluxos" / "regras.json").write_text(json.dumps(cerebro_velho), encoding="utf-8")
env_antigo = os.environ.get("AGENTE_CASA")
raiz_antiga, cerebro_antigo = loop.RAIZ, loop.CEREBRO
os.environ["AGENTE_CASA"] = str(casa_falsa)
try:
    loop.RAIZ = proj_olhos
    loop.CEREBRO = proj_olhos / "fluxos" / "regras.json"
    velho = loop.olhar_mundo()
    compativel = (len(velho) == 1 and velho[0]["mudou"]
                  and (proj_olhos / "relatorios" / "inventario-velho.txt").exists())
    cerebro_novo = {"acoes": [], "mundo": {"ligado": True, "so_quando_mudar": True, "olhos": [
        {"nome": "desktop", "relatorio_em": "relatorios/inventario-desktop.txt"},
        {"nome": "downloads", "relatorio_em": "relatorios/inventario-downloads.txt"}]}}
    (proj_olhos / "fluxos" / "regras.json").write_text(json.dumps(cerebro_novo), encoding="utf-8")
    dois = loop.olhar_mundo()
    dois_ok = (len(dois) == 2 and all(r["mudou"] for r in dois)
               and (proj_olhos / "relatorios" / "inventario-desktop.txt").exists()
               and (proj_olhos / "relatorios" / "inventario-downloads.txt").exists())
    calmos = loop.olhar_mundo()
    calmo_ok = len(calmos) == 2 and not any(r["mudou"] for r in calmos)
    olhos_ok = compativel and dois_ok and calmo_ok
finally:
    loop.RAIZ, loop.CEREBRO = raiz_antiga, cerebro_antigo
    if env_antigo is None:
        os.environ.pop("AGENTE_CASA", None)
    else:
        os.environ["AGENTE_CASA"] = env_antigo
print("  [%s] dois olhos no mundo  -> cerebro velho vira 1 olho, novo da 2, e a 2a passada nao reescreve"
      % ("ok  " if olhos_ok else "FALHA"))
if not olhos_ok:
    falhas.append("dois olhos no mundo")

# cena nova: fiscal da fila — conta presos em fila/erros, ignora o resto
fila_antiga = loop.FILA
fiscal_palco = palco / "fiscal"
try:
    (fiscal_palco / "erros").mkdir(parents=True)
    (fiscal_palco / "erros" / "t1.txt").write_text("x", encoding="utf-8")
    (fiscal_palco / "erros" / "t2.txt").write_text("x", encoding="utf-8")
    (fiscal_palco / "erros" / "nota.md").write_text("x", encoding="utf-8")
    loop.FILA = fiscal_palco
    conta_certo = loop.fiscal_da_fila() == 2
    (fiscal_palco / "erros" / "t1.txt").unlink()
    (fiscal_palco / "erros" / "t2.txt").unlink()
    zerada = loop.fiscal_da_fila() == 0
    loop.FILA = palco / "pasta-que-nao-existe"
    sumida = loop.fiscal_da_fila() == 0
    fiscal_ok = conta_certo and zerada and sumida
finally:
    loop.FILA = fila_antiga
    shutil.rmtree(palco, ignore_errors=True)
print("  [%s] fiscal da fila  -> conta presos em fila/erros, pasta vazia ou sumida vira zero"
      % ("ok  " if fiscal_ok else "FALHA"))
if not fiscal_ok:
    falhas.append("fiscal da fila")

# cena nova: canal abrir: — dentro do projeto vale, .exe/.ps1/fuga barrados, cerebro sem canal vira tudo "nao"
abrir_palco = palco / "abrir"
casa_ab = abrir_palco / "casa"
(casa_ab / "Desktop").mkdir(parents=True)
(casa_ab / "Desktop" / "nota-desktop.txt").write_text("oi", encoding="utf-8")
proj_ab = abrir_palco / "proj"
(proj_ab / "relatorios").mkdir(parents=True)
(proj_ab / "fluxos").mkdir(parents=True)
(proj_ab / "relatorios" / "ok.txt").write_text("inocente", encoding="utf-8")
(proj_ab / "evil.exe").write_text("nao", encoding="utf-8")
(proj_ab / "relatorios" / "script.ps1").write_text("nao", encoding="utf-8")
(abrir_palco / "escapada.txt").write_text("fora do projeto", encoding="utf-8")
regras_abrir = {"acoes": [], "mundo": {"ligado": False},
                "abrir": {"ligado": True, "raizes": ["projeto", "desktop"],
                          "jamais_abrir": [".exe", ".bat", ".ps1"]}}
(proj_ab / "fluxos" / "regras.json").write_text(json.dumps(regras_abrir), encoding="utf-8")
env_ab = os.environ.get("AGENTE_CASA")
raiz_ab, cerebro_ab = loop.RAIZ, loop.CEREBRO
os.environ["AGENTE_CASA"] = str(casa_ab)
try:
    loop.RAIZ = proj_ab
    loop.CEREBRO = proj_ab / "fluxos" / "regras.json"
    dentro_txt = loop.validar_abrir("relatorios/ok.txt")[0]
    pasta_ok = loop.validar_abrir("relatorios")[0]
    exe_barro = not loop.validar_abrir("evil.exe")[0]
    ps1_barro = not loop.validar_abrir(str(Path("relatorios") / "script.ps1"))[0]
    fuga_barra = not loop.validar_abrir("../escapada.txt")[0]
    olho_de_fora = loop.validar_abrir(str(casa_ab / "Desktop" / "nota-desktop.txt"))[0]
    (proj_ab / "fluxos" / "regras.json").write_text(json.dumps({"acoes": [], "mundo": {"ligado": False}}), encoding="utf-8")
    sem_canal_barra = not loop.validar_abrir("relatorios/ok.txt")[0]
    abrir_ok = (dentro_txt and pasta_ok and exe_barro and ps1_barro and fuga_barra
                and olho_de_fora and sem_canal_barra)
finally:
    loop.RAIZ, loop.CEREBRO = raiz_ab, cerebro_ab
    if env_ab is None:
        os.environ.pop("AGENTE_CASA", None)
    else:
        os.environ["AGENTE_CASA"] = env_ab
    shutil.rmtree(palco, ignore_errors=True)
print("  [%s] canal abrir  -> arquivo e pasta de dentro valem, .exe/.ps1/fuga barrados, sem canal tudo morre"
      % ("ok  " if abrir_ok else "FALHA"))
if not abrir_ok:
    falhas.append("canal abrir")

# cena nova: o porteiro — calibra na 1a visita, avisa quando o arquivo amadurece, tolerancia protege, calmo fica quieto
portao_palco = palco / "porteiro"
casa_p = portao_palco / "casa"
(casa_p / "Downloads").mkdir(parents=True)
proj_p = portao_palco / "proj"
(proj_p / "relatorios").mkdir(parents=True)
(proj_p / "memoria").mkdir(parents=True)
(proj_p / "fila").mkdir(parents=True)
(proj_p / "fluxos").mkdir(parents=True)
regras_p = {"acoes": [], "mundo": {"ligado": False},
            "vigilia": {"ligado": True, "tolerancia_seg": 0, "max_eventos": 5,
                        "olhos": [{"pasta": "downloads",
                                   "ao_chegar": ["inventario", {"anotar": "marquinha"}]}]}}
(proj_p / "fluxos" / "regras.json").write_text(json.dumps(regras_p), encoding="utf-8")
env_p = os.environ.get("AGENTE_CASA")
r_p, c_p, v_p = loop.RAIZ, loop.CEREBRO, loop.VIGILIA
os.environ["AGENTE_CASA"] = str(casa_p)
try:
    loop.RAIZ = proj_p
    loop.CEREBRO = proj_p / "fluxos" / "regras.json"
    loop.VIGILIA = proj_p / "memoria" / "vigilia.json"
    calibrou = "calibracao" in " | ".join(loop.vigiar())
    (casa_p / "Downloads" / "recibo.pdf").write_text("x", encoding="utf-8")
    so = loop.vigiar()
    avisou = any("recibo.pdf" in s for s in so)
    invent_ok = (proj_p / "relatorios" / "inventario-downloads.txt").exists()
    log_ok = (proj_p / "memoria" / "vigilia.log").exists() and "marquinha" in (proj_p / "memoria" / "vigilia.log").read_text(encoding="utf-8")
    calmo = not any("recibo.pdf" in s for s in loop.vigiar())
    (casa_p / "Downloads" / "incompleto.zip").write_text("y", encoding="utf-8")
    regras_p["vigilia"]["tolerancia_seg"] = 3600
    (proj_p / "fluxos" / "regras.json").write_text(json.dumps(regras_p), encoding="utf-8")
    imaturo = any("em tolerancia" in s for s in loop.vigiar()) and not any("incompleto.zip ->" in s for s in loop.vigiar())
    maduro = any("incompleto.zip ->" in s for s in loop.vigiar(AGORA=time.time() + 7200))
    porteiro_ok = calibrou and avisou and invent_ok and log_ok and calmo and imaturo and maduro
    # cena bônus: reacao que enfileira obedece so ao vocabulario
    fila_reacoes = "; ".join(loop.aplicar_reacoes({"pasta": "downloads", "ao_chegar": [{"anotar_fila": "format c:"}]}, "x.txt"))
    vocab_ok = "recusei enfileirar" in fila_reacoes and "inventario atualizado" in "; ".join(loop.aplicar_reacoes({"pasta": "downloads", "ao_chegar": ["inventario", {"telepatia": "abra tudo"}]}, "x.txt"))
    vocab_ok = vocab_ok and "telepatia" in "; ".join(loop.aplicar_reacoes({"pasta": "downloads", "ao_chegar": [{"telepatia": 1}]}, "x.txt"))
finally:
    loop.RAIZ, loop.CEREBRO, loop.VIGILIA = r_p, c_p, v_p
    if env_p is None:
        os.environ.pop("AGENTE_CASA", None)
    else:
        os.environ["AGENTE_CASA"] = env_p
    shutil.rmtree(palco, ignore_errors=True)
print("  [%s] porteiro  -> calibra, espera a tolerancia, avisa 1 vez, reage so com vocabulario aprovado"
      % ("ok  " if (porteiro_ok and vocab_ok) else "FALHA"))
if not (porteiro_ok and vocab_ok):
    falhas.append("porteiro")

# cena nova: correntes — gatilho .pdf roda etapas, PNG ignora, limite dorme, madrugada enfileira
corr_palco = palco / "correntes"
casa_c = corr_palco / "casa"
(casa_c / "Downloads").mkdir(parents=True)
proj_c = corr_palco / "proj"
for pasta_c in ("memoria", "fila", "fluxos", "entrada"):
    (proj_c / pasta_c).mkdir(parents=True)
regras_c = {"acoes": [], "mundo": {"ligado": False},
            "vigilia": {"ligado": True, "tolerancia_seg": 0, "max_eventos": 9,
                        "olhos": [{"pasta": "downloads", "ao_chegar": ["inventario"]}]},
            "correntes": {"ligado": True, "gatilhos": [
                {"id": "pdf-captura", "se": {"olho": "downloads", "extensao": ".pdf"},
                 "etapas": [{"usar": "copiar_para_projeto", "para": "entrada"},
                            {"usar": "avisar", "texto": "pdf novo capturado: %arquivo%"},
                            {"usar": "telepatia"}]}]}}
(proj_c / "fluxos" / "regras.json").write_text(json.dumps(regras_c), encoding="utf-8")
env_c = os.environ.get("AGENTE_CASA")
r_c, ce_c, v_c = loop.RAIZ, loop.CEREBRO, loop.VIGILIA
f_c, d_c = loop.FILA, loop.CORRENTES_DIARIO
os.environ["AGENTE_CASA"] = str(casa_c)
try:
    loop.RAIZ = proj_c
    loop.CEREBRO = proj_c / "fluxos" / "regras.json"
    loop.VIGILIA = proj_c / "memoria" / "vigilia.json"
    loop.CORRENTES_DIARIO = proj_c / "memoria" / "correntes.json"
    loop.FILA = proj_c / "fila"
    loop.vigiar()
    (casa_c / "Downloads" / "trabalho.pdf").write_text("pdfzito", encoding="utf-8")
    (casa_c / "Downloads" / "foto.png").write_text("png", encoding="utf-8")
    visao = " | ".join(loop.vigiar())
    copiou = (proj_c / "entrada" / "trabalho.pdf").exists()
    ignorou = not (proj_c / "entrada" / "foto.png").exists()
    anotou = "pdf novo capturado: trabalho.pdf" in (proj_c / "memoria" / "vigilia.log").read_text(encoding="utf-8")
    recusou = "fora do vocabulario" in visao and "corrente pdf-captura" in visao
    dormiu = False
    for rodadazinha in range(4):
        # tamanho varia de proposito: igual ao mundo real, um arquivo que muda muda de tamanho
        (casa_c / "Downloads" / "trabalho.pdf").write_text("pdf" + "x" * rodadazinha, encoding="utf-8")
        if "dormiu" in " | ".join(loop.vigiar()):
            dormiu = True
    regras_c["correntes"]["gatilhos"][0]["etapas"] = [{"usar": "abrir"}]
    (proj_c / "fluxos" / "regras.json").write_text(json.dumps(regras_c), encoding="utf-8")
    (proj_c / "memoria" / "correntes.json").write_text("{}", encoding="utf-8")
    verdadeiro_sO = loop.SO_OLHAR
    loop.SO_OLHAR = True
    try:
        (casa_c / "Downloads" / "trabalho.pdf").write_text("noite", encoding="utf-8")
        noite = " | ".join(loop.vigiar())
    finally:
        loop.SO_OLHAR = verdadeiro_sO
    vigia_arquivos = sorted((proj_c / "fila").glob("vigia-*.txt"))
    enfileirou = (len(vigia_arquivos) == 1 and "abrir:" in vigia_arquivos[0].read_text(encoding="utf-8")
                  and "virou fila" in noite)
    corr_ok = copiou and ignorou and anotou and recusou and dormiu and enfileirou
finally:
    loop.RAIZ, loop.CEREBRO, loop.VIGILIA = r_c, ce_c, v_c
    loop.FILA, loop.CORRENTES_DIARIO = f_c, d_c
    if env_c is None:
        os.environ.pop("AGENTE_CASA", None)
    else:
        os.environ["AGENTE_CASA"] = env_c
    shutil.rmtree(palco, ignore_errors=True)
print("  [%s] correntes  -> gatilho .pdf roda etapas, PNG ignora, limite dorme, madrugada enfileira"
      % ("ok  " if corr_ok else "FALHA"))
if not corr_ok:
    falhas.append("correntes")

# cena nova: olhos de saude (B13) — medir e so ler; o ponto vira linha no diario;
# a janela corta as velhas; o resumo conta a fome da madrugada
raiz_sa, cerebro_sa = loop.RAIZ, loop.CEREBRO
sala_sa = palco / "saude"
(sala_sa / "memoria").mkdir(parents=True)
try:
    loop.RAIZ = sala_sa
    retrato = loop.medir_saude()
    honesto = (isinstance(retrato.get("ram_pct"), (int, type(None)))
               and isinstance(retrato.get("disco_gb"), (int, type(None)))
               and isinstance(retrato.get("nucleos"), int)
               and isinstance(retrato.get("fome"), list))
    pulso1, _ = loop.bater_ponto_saude()
    pulso2, _ = loop.bater_ponto_saude()
    diario_sa = sala_sa / "memoria" / "saude.txt"
    duas = diario_sa.exists() and len(diario_sa.read_text(encoding="utf-8").splitlines()) == 2
    formato = (":" in pulso1.split()[0]) and ("ram=" in pulso1) and ("fome=" in pulso1)
    diario_sa.write_text("23:15 ram=97% livre=180MB disco=2GB fome=SIM(ram,disco)\n"
                         "23:30 ram=40% livre=4000MB disco=2GB fome=nao\n", encoding="utf-8")
    conta_certo = loop.resumo_da_madrugada() == "2 batida(s) na madrugada, 1 com o PC apertado"
    diario_sa.write_text("\n".join("%02d:0%d ram=10%% livre=1MB disco=9GB fome=nao" % (i % 24, i % 10)
                                   for i in range(250)), encoding="utf-8")
    loop.bater_ponto_saude()
    janela = len(diario_sa.read_text(encoding="utf-8").splitlines()) == loop.SAUDE_JANELA
    diario_sa.unlink()
    sem_diario = loop.resumo_da_madrugada() is None
    saude_ok = honesto and duas and formato and conta_certo and janela and sem_diario
finally:
    loop.RAIZ, loop.CEREBRO = raiz_sa, cerebro_sa
    shutil.rmtree(palco, ignore_errors=True)
print("  [%s] saude  -> medir so le, ponto vira linha, janela corta velhas, madrugada conta a fome"
      % ("ok  " if saude_ok else "FALHA"))
if not saude_ok:
    falhas.append("saude")

# cena nova: motor de fluxos (Fase C) — gatilho com condicao de nome/tamanho, passo
# com 'se' proprio, e o --ensaiar que mostra o plano sem escrever nada e sem cobrar
# pedagio nos limites
fx_palco = palco / "fluxos"
casa_fx = fx_palco / "casa"
(casa_fx / "Downloads").mkdir(parents=True)
proj_fx = fx_palco / "proj"
for _sub in ("memoria", "fila", "relatorios", "fluxos"):
    (proj_fx / _sub).mkdir(parents=True)
regras_fx = {"acoes": [], "mundo": {"ligado": False},
             "vigilia": {"ligado": True, "tolerancia_seg": 0, "max_eventos": 25,
                         "olhos": [{"pasta": "downloads", "ao_chegar": []}]},
             "correntes": {"ligado": False, "gatilhos": []},
             "fluxos": {"ligado": True, "gatilhos": [{
                 "id": "txt-nota",
                 "quando": {"olho": "downloads", "extensao": ".txt", "nome_contem": "nota"},
                 "passos": [{"usar": "avisar", "texto": "nota vista: %arquivo%"},
                            {"usar": "copiar_para_projeto", "para": "entrada/notas",
                             "se": {"tamanho_min_kb": 1}}]}]}}
(proj_fx / "fluxos" / "regras.json").write_text(json.dumps(regras_fx), encoding="utf-8")
env_fx = os.environ.get("AGENTE_CASA")
r_fx, ce_fx = loop.RAIZ, loop.CEREBRO
v_fx, d_fx, f_fx, e_fx = loop.VIGILIA, loop.CORRENTES_DIARIO, loop.FILA, loop.ENSAIAR
os.environ["AGENTE_CASA"] = str(casa_fx)
try:
    loop.RAIZ = proj_fx
    loop.CEREBRO = proj_fx / "fluxos" / "regras.json"
    loop.VIGILIA = proj_fx / "memoria" / "vigilia.json"
    loop.CORRENTES_DIARIO = proj_fx / "memoria" / "correntes.json"
    loop.FILA = proj_fx / "fila"
    loop.vigiar()
    (casa_fx / "Downloads" / "nota-curta.txt").write_text("oi", encoding="utf-8")
    (casa_fx / "Downloads" / "nota-longa.txt").write_text("x" * 2000, encoding="utf-8")
    (casa_fx / "Downloads" / "esquecido.txt").write_text("x" * 2000, encoding="utf-8")
    visao_fx = " | ".join(loop.vigiar())
    bateu_dois = visao_fx.count("fluxo txt-nota") == 2
    copiou = (proj_fx / "entrada" / "notas" / "nota-longa.txt").exists()
    pulou = (not (proj_fx / "entrada" / "notas" / "nota-curta.txt").exists()) and ("pulado (condicao" in visao_fx)
    quieto = not any("esquecido.txt" in parte and "fluxo txt-nota" in parte for parte in visao_fx.split(" | "))
    loop.ENSAIAR = True
    (casa_fx / "Downloads" / "nota-ensaio.txt").write_text("x" * 3000, encoding="utf-8")
    ensaio_visao = " | ".join(loop.vigiar())
    plano_limpo = ("ensaio: passo" in ensaio_visao and "modo --ensaiar" in ensaio_visao
                   and not (proj_fx / "entrada" / "notas" / "nota-ensaio.txt").exists())
    loop.ENSAIAR = False
    real_visao = " | ".join(loop.vigiar())
    cobrou_depois = (proj_fx / "entrada" / "notas" / "nota-ensaio.txt").exists() and "fluxo txt-nota" in real_visao
    fx_ok = bateu_dois and copiou and pulou and quieto and plano_limpo and cobrou_depois
finally:
    loop.RAIZ, loop.CEREBRO, loop.VIGILIA = r_fx, ce_fx, v_fx
    loop.CORRENTES_DIARIO, loop.FILA, loop.ENSAIAR = d_fx, f_fx, e_fx
    if env_fx is None:
        os.environ.pop("AGENTE_CASA", None)
    else:
        os.environ["AGENTE_CASA"] = env_fx
    shutil.rmtree(palco, ignore_errors=True)
print("  [%s] fluxos  -> gatilho com condicao, 'se' por passo e --ensaiar nao cobra pedagio"
      % ("ok  " if fx_ok else "FALHA"))
if not fx_ok:
    falhas.append("fluxos")

# cena nova: aprendizado por experiencia (B15) — caderno com decaimento de
# meia-vida, conselho so com evidencia no registro e --so-olhar que NUNCA julga
from datetime import datetime, timedelta
ap_palco = palco / "aprendizado"
(ap_palco / "memoria").mkdir(parents=True)
(ap_palco / "fluxos").mkdir(parents=True)
(ap_palco / "fluxos" / "regras.json").write_text(
    json.dumps({"acoes": [], "mundo": {"ligado": False},
                "aprendizado": {"ligado": True, "janela_dias": 60,
                                 "meia_vida_dias": 14, "limite_eventos": 1200}}),
    encoding="utf-8")
r_ap, ce_ap, so_ap = loop.RAIZ, loop.CEREBRO, loop.SO_OLHAR
try:
    loop.RAIZ, loop.CEREBRO = ap_palco, ap_palco / "fluxos" / "regras.json"
    # 1) placar puro: 4 acertos de hoje pesam 4.0, um atras de 28 dias vale 1.0 (2 meias-vidas)
    for _ in range(4):
        loop.registrar_experiencia("acao:boa", "criou", 1.0)
    caderno = json.loads((ap_palco / "memoria" / "aprendizado.json").read_text(encoding="utf-8"))
    velho = (datetime.now() - timedelta(days=28)).isoformat(timespec="seconds")
    caderno["eventos"].append([velho, "acao:velha", "criou", 4.0])
    (ap_palco / "memoria" / "aprendizado.json").write_text(json.dumps(caderno), encoding="utf-8")
    placar = dict((c, s) for c, s, q in loop.pesos_aprendido())
    contam = dict((c, q) for c, s, q in loop.pesos_aprendido())
    pontuou = abs(placar.get("acao:boa", 0) - 4.0) < 0.05 and contam.get("acao:boa") == 4
    decaiu = 0.95 <= placar.get("acao:velha", 0) <= 1.05
    # 2) conselho so fala com evidencia: retrucar o torto, elogiar o confiavel
    #    (os nomes passam pelo mesmo crivo minúsculo do corrente_etapa)
    for _ in range(3):
        loop._experiencia_elo("corrente:ruim", "abrir", "abrir barrado: politica nao deixou")
    for _ in range(3):
        loop._experiencia_elo("corrente:otima", "avisar", "anotado em memoria/vigilia.log")
    conselhos = " ;; ".join(loop.conselhos_aprendido())
    aconselhou = "aposentar" in conselhos and "corrente:ruim" in conselhos
    elogiou = any("confiavel" in c and "acao:boa" in c for c in loop.conselhos_aprendido())
    hook_gravou = any(c == "corrente:otima|elo:avisar" and q == 3 for c, s, q in loop.pesos_aprendido())
    # 3) --so-olhar nao julga: nem um evento a mais no caderno
    antes = len(json.loads((ap_palco / "memoria" / "aprendizado.json").read_text(encoding="utf-8"))["eventos"])
    loop.SO_OLHAR = True
    mudo = loop.registrar_experiencia("acao:boa", "criou", 1.0) is False
    loop.SO_OLHAR = False
    depois = len(json.loads((ap_palco / "memoria" / "aprendizado.json").read_text(encoding="utf-8"))["eventos"])
    silencia = mudo and antes == depois
    ap_ok = pontuou and decaiu and aconselhou and elogiou and hook_gravou and silencia
finally:
    loop.RAIZ, loop.CEREBRO, loop.SO_OLHAR = r_ap, ce_ap, so_ap
    shutil.rmtree(palco, ignore_errors=True)
print("  [%s] aprendizado  -> decaimento de meia-vida, conselho com evidencia e --so-olhar mudo"
      % ("ok  " if ap_ok else "FALHA"))
if not ap_ok:
    falhas.append("aprendizado")

print("  regras no cerebro:", len(loop.ler_cerebro().get("acoes", [])))
if falhas:
    print("PORTAO FECHADO: %d cena(s) nao bateram: %s" % (len(falhas), ", ".join(falhas)))
    sys.exit(1)
print("PORTAO ABERTO: cerebro valido, olho limpo, coleira firme, fila vigiada, dois olhos, abrir blindado, porteiro de plantao, correntes no trilho, saude no pulso, fluxo com condicao e experiencia com conselho.")