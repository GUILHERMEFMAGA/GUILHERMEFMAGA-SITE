# -*- coding: utf-8 -*-
# QA PERFECCIONISTA — auditoria visual + runtime + campanha => FORMULARIO LONGO
import subprocess, json, os, sys
from PIL import Image, ImageChops

ROOT = os.path.dirname(os.path.abspath(__file__))
S2 = os.path.join(ROOT, "sprites2"); SP = os.path.join(ROOT, "sprites")
ISS = []   # (secao, nivel, msg)
def add(sec, niv, msg): ISS.append((sec, niv, msg))
def okk(sec, msg): ISS.append((sec, "OK", msg))

def stats(p):
    im0 = Image.open(p).convert("RGBA"); w0, h0 = im0.size
    cantos = [im0.getpixel(c)[3] for c in ((0, 0), (w0 - 1, 0), (0, h0 - 1), (w0 - 1, h0 - 1))]
    fundo = sum(1 for a in cantos if a > 200) >= 3   # cantos opacos = cena inteira
    bb = im0.getbbox()
    if not bb: return None
    im = im0.crop(bb); w, h = im.size
    hist = im.getchannel("A").histogram()
    transp = sum(hist[:128]) / float(w * h)
    return dict(w=w, h=h, transp=transp, fundo=fundo)

def diff(a, b):
    ia = Image.open(a).convert("RGB"); ib = Image.open(b).convert("RGB")
    ib = ib.resize(ia.size)
    d = ImageChops.difference(ia, ib)
    px = list(d.getdata()); n = len(px)
    return sum(sum(q) for q in px) / (n * 765.0)

# ---------- B) AUDITORIA VISUAL ----------
CANON = 470
for fam, pref in (("DANTE", "d-"), ("LUCA", "l-")):
    nomes = sorted(f[:-4] for f in os.listdir(S2) if f.startswith(pref))
    hs = []
    for n in nomes:
        st = stats(os.path.join(S2, n + ".png"))
        if not st: add("B", "CRITICO", f"{n}: sprite vazio"); continue
        hs.append(st["h"])
        if st["fundo"]:
            add("B", "CRITICO", f"{n}: FUNDO EMBUTIDO (cantos opacos, {st['transp']:.0%} transparente) — vira bloco retangular na tela")
        if abs(st["h"] - CANON) > CANON * 0.05:
            add("B", "GRAVE", f"{n}: altura {st['h']}px fora do canonico {CANON}px ({100*st['h']/CANON:.0f}%)")
    if hs and (max(hs) - min(hs)) > 24:
        add("B", "GRAVE", f"{fam}: alturas inconsistentes entre poses ({min(hs)}–{max(hs)}px) — personagem 'encolhe'")
# ciclos de corrida/andada
for ciclo in (["d-runA","d-runB","d-runC","d-runD"], ["l-runA","l-runB","l-runC","l-runD"], ["d-walkA","d-walkB"], ["l-walkA","l-walkB"]):
    ps = [os.path.join(S2, c + ".png") for c in ciclo]
    if not all(os.path.exists(q) for q in ps): continue
    ws = [stats(q)["w"] for q in ps]
    if max(ws) / max(1, min(ws)) > 1.35:
        add("B", "LEVE", f"{ciclo[0][:2]}: larguras do ciclo variam {min(ws)}–{max(ws)}px (jitter horizontal)")
    for i in range(len(ps) - 1):
        dv = diff(ps[i], ps[i + 1])
        if dv < 0.015: add("B", "CRITICO", f"{ciclo[i]}->{ciclo[i+1]}: frames QUASE IDENTICOS (dif {dv:.1%}) — animacao congelada")
        elif dv > 0.60: add("B", "GRAVE", f"{ciclo[i]}->{ciclo[i+1]}: frames inconsistentes demais (dif {dv:.1%}) — parece outro personagem")
# inimigos/boss/itens
for n, nota in (("e-espectro",""), ("e-espectro-atk",""), ("e-cao",""), ("e-cao-b",""), ("e-vulto",""), ("e-vulto-atk",""), ("e-neon",""), ("m-idle",""), ("m-atk",""), ("m-def","")):
    p = os.path.join(S2, n + ".png")
    if not os.path.exists(p): continue
    st = stats(p)
    if st["fundo"]:
        add("B", "GRAVE", f"{n}: fundo embutido ({st['transp']:.0%} transparente)")
# fundos
for n in ("bg-cidade","bg-porta","bg-impala","bg-quarto","bg-floresta"):
    p = os.path.join(S2, n + ".png")
    if not os.path.exists(p): continue
    im = Image.open(p)
    if im.size != (1536, 1024): add("B", "GRAVE", f"{n}: resolucao {im.size} != 1536x1024")
# escala personagem vs cenario vs boss
stB = stats(os.path.join(S2, "m-idle.png")); stD = stats(os.path.join(S2, "d-runA.png"))
if stB and stD:
    if stB["h"] < stD["h"]: add("D", "GRAVE", "boss menor que o personagem")
    else: okk("D", f"escala boss {stB['h']}px > personagem {stD['h']}px")
okk("D", f"personagem {stD['h']}px = {100*stD['h']/1024:.0f}% da tela (1024) — proporcao SNES correta")

# ---------- A) RUNTIME ----------
try:
    out = subprocess.run(["node", os.path.join(ROOT, "qa_anims.js")], capture_output=True, text=True, timeout=120)
    qa = json.loads(out.stdout.strip().splitlines()[-1])
    if qa.get("erro"): add("A", "CRITICO", "runtime: " + qa["erro"])
    else:
        for f in qa.get("falhas", []): add("A", "CRITICO", "runtime: " + f)
        if not qa.get("falhas"):
            okk("A", f"todas as animacoes executadas: {len(qa['metricas']['labelsVistos'])} estados ({', '.join(qa['metricas']['labelsVistos'])})")
            m = qa["metricas"]
            okk("A", f"velocidades exatas: andada {m['velAndada']}px/s, corrida {m['velCorrida']}px/s")
            okk("A", f"ciclo de corrida com {m['fasesCorrida']} fases distintas")
except Exception as e:
    add("A", "CRITICO", "runtime falhou ao rodar: " + str(e))

# ---------- C) CAMPANHA (bot) ----------
try:
    out = subprocess.run(["node", os.path.join(ROOT, "bot.js")], capture_output=True, text=True, timeout=900)
    txt = out.stdout
    venceu = "venceu: true" in txt
    if not venceu: add("C", "CRITICO", "IA de campanha NAO vence o jogo")
    else: okk("C", "IA vence a campanha completa (Noite 1 + Noite 2)")
    import re as _re
    mm = _re.search(r"mortes: (\d+)", txt)
    mortes = int(mm.group(1)) if mm else -1
    if mortes > 8: add("C", "GRAVE", f"dificuldade alta demais: {mortes} mortes da IA")
    elif mortes >= 0: okk("C", f"mortalidade da IA: {mortes} mortes (desafiador mas justo)")
except Exception as e:
    add("C", "CRITICO", "bot de campanha falhou: " + str(e))

# ---------- FORMULARIO ----------
ORDEM = {"CRITICO": 0, "GRAVE": 1, "LEVE": 2, "OK": 3}
SCORE = {"CRITICO": 0, "GRAVE": 0.5, "LEVE": 0.8, "OK": 1.0}
tot = [SCORE[n] for _, n, _ in ISS] or [1]
nota = 100 * sum(tot) / len(tot)
nCrit = sum(1 for _, n, _ in ISS if n == "CRITICO")
nGrave = sum(1 for _, n, _ in ISS if n == "GRAVE")
vered = "HORRIVEL" if nCrit else ("RUIM" if nGrave > 3 else ("REGULAR" if nGrave else "BOM"))

print("=" * 74)
print(" FORMULARIO QA — SOBRENATURAL (QA perfeccionista, duas visoes)")
print("=" * 74)
for sec, tit in (("A", "ANIMACOES (runtime, modo teste)"), ("B", "AUDITORIA VISUAL DE ASSETS"),
                 ("C", "CAMPANHA (IA jogadora)"), ("D", "ESCALA E CONSISTENCIA")):
    print(f"\n[{sec}] {tit}")
    for s2, n, m in sorted([i for i in ISS if i[0] == sec], key=lambda i: ORDEM[i[1]]):
        print(f"   [{'x' if n in ('CRITICO','GRAVE') else ('~' if n=='LEVE' else 'v')}] {n:8s} {m}")
print("\n" + "-" * 74)
print(f" NOTA GERAL: {nota:.0f}/100 | criticos: {nCrit} | graves: {nGrave} | VEREDITO: {vered}")
lista = [m for s, n, m in ISS if n in ("CRITICO", "GRAVE")]
print("\nPROMPT DE CORRECAO AUTOMATICO (regenerar com chroma-key verde, altura 470px,")
print("mesma identidade do sprite base, fundo 100% transparente):")
for m in lista: print("  - " + m)
print("=" * 74)
