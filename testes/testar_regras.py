# -*- coding: utf-8 -*-
# PORTAO DE TESTES: roda as regras do cerebro num mundo de mentirinha.
# Codigo novo so entra no cerebro se este portao abrir.

import importlib.util
import shutil
import sys
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

print("  regras no cerebro:", len(loop.ler_cerebro().get("acoes", [])))
if falhas:
    print("PORTAO FECHADO: %d cena(s) nao bateram: %s" % (len(falhas), ", ".join(falhas)))
    sys.exit(1)
print("PORTAO ABERTO: cerebro valido, olho limpo e modo observacao travado.")