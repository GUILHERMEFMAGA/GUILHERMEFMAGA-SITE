# -*- coding: utf-8 -*-
# CONSELHO DE TESTES — 6 IAs especialistas deliberam sobre o jogo e entregam
# o PLANO do Diretor de Arte (imagens a gerar, <=10/rodada, prompts prontos).
import subprocess, json, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
S2 = os.path.join(ROOT, "sprites2"); SP = os.path.join(ROOT, "sprites")
A = os.path.join(ROOT, "..", "assets")
F = []  # (agente, nivel, msg, asset?)
def diz(ag, niv, msg, asset=None): F.append((ag, niv, msg, asset))

def load(p): return Image.open(p).convert("RGBA")
def bbox(im):
    bb = im.getbbox()
    return im.crop(bb) if bb else im
def corners_bg(p):
    im = load(p); w, h = im.size
    return sum(1 for c in ((0,0),(w-1,0),(0,h-1),(w-1,h-1)) if im.getpixel(c)[3] > 200) >= 3
def rim_pct(im):
    px = im.load(); w, h = im.size; n = tot = 0
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            r, g, b, a = px[x, y]
            if a > 100:
                tot += 1
                if r > 90 and r - max(g, b) > 40: n += 1
    return 100 * n / max(1, tot)
def avg_region(im, x0, y0, x1, y1):
    px = im.load(); w, h = im.size
    rs = gs = bs = n = 0
    for y in range(int(y0*h), int(y1*h), 2):
        for x in range(int(x0*w), int(x1*w), 2):
            r, g, b, a = px[x, y]
            if a > 100: rs += r; gs += g; bs += b; n += 1
    return (rs/max(1,n), gs/max(1,n), bs/max(1,n)) if n else (0, 0, 0)

# ---------------- A2 · DIRETORA DE ARTE (sprites) ----------------
canon = {}
for ch, pref in (("dante", "d"), ("luca", "l")):
    im = bbox(load(os.path.join(S2, pref + "-idle.png")))
    canon[pref] = im.size[1]
for f in sorted(os.listdir(S2)):
    if not f.endswith(".png"): continue
    p = os.path.join(S2, f)
    if f[:2] in ("d-", "l-"):
        pref = f[0]
        if corners_bg(p): diz("ARTE", "CRITICO", f"{f}: fundo embutido", f[:-4])
        im = bbox(load(p))
        c = canon[pref]
        if abs(im.size[1] - c) > c * 0.05: diz("ARTE", "GRAVE", f"{f}: altura {im.size[1]} != canon {c}", f[:-4])
        if rim_pct(im) > 9: diz("ARTE", "LEVE", f"{f}: rim ainda forte ({rim_pct(im):.0f}%)", f[:-4])
    elif f[:2] in ("e-",) or f[:2] == "m-":
        if corners_bg(p): diz("ARTE", "GRAVE", f"{f}: fundo embutido", f[:-4])

# ---------------- A6 · GUARDIA DO CANON (identidade) ----------------
d = bbox(load(os.path.join(S2, "d-idle.png")))
hair = avg_region(d, 0.3, 0.0, 0.7, 0.10); torso = avg_region(d, 0.3, 0.25, 0.7, 0.55)
if not (hair[0] < 90 and hair[2] < 90): diz("CANON", "CRITICO", "cabelo do Dante nao eh preto")
if not (torso[0] < 95): diz("CANON", "GRAVE", "casaco do Dante nao esta escuro")
else: diz("CANON", "OK", "Dante: cabelo preto + casaco escuro ✔")
l = bbox(load(os.path.join(S2, "l-idle.png")))
lhair = avg_region(l, 0.35, 0.0, 0.65, 0.10); ltorso = avg_region(l, 0.42, 0.28, 0.60, 0.46)
if not (ltorso[0] > ltorso[1] + 6): diz("CANON", "CRITICO", "camisa do Luca nao esta vermelha")
else: diz("CANON", "OK", "Luca: camisa vermelha + identidade ✔")

# ---------------- A5 · MUNDO & ESCALA ----------------
dh = canon["d"]
for f, expect in (("e-espectro", (200, 400)), ("e-cao", (150, 320)), ("e-vulto", (350, 560)), ("e-neon", (240, 420)), ("m-idle", (500, 900)), ("boss2-idle", (500, 900))):
    p = os.path.join(S2, f + ".png")
    if not os.path.exists(p): continue
    im = bbox(load(p)); h = im.size[1]
    if not (expect[0] <= h <= expect[1]): diz("MUNDO", "GRAVE", f"{f}: altura {h}px fora da faixa {expect} vs personagem {dh}")
    else: diz("MUNDO", "OK", f"{f}: escala coerente ({h}px)")
for f in ("bg-cidade", "bg-porta", "bg-impala", "bg-quarto", "bg-floresta"):
    p = os.path.join(S2, f + ".png")
    if os.path.exists(p) and load(p).size != (1536, 1024): diz("MUNDO", "GRAVE", f"{f}: resolucao errada")

# ---------------- A1 · ANIMACOES (runtime) ----------------
try:
    out = subprocess.run(["node", os.path.join(ROOT, "qa_anims.js")], capture_output=True, text=True, timeout=120)
    qa = json.loads(out.stdout.strip().splitlines()[-1])
    for x in qa.get("falhas", []): diz("ANIM", "CRITICO", x)
    if not qa.get("falhas"): diz("ANIM", "OK", f"{len(qa['metricas']['labelsVistos'])} estados de animacao executados ✔")
except Exception as e: diz("ANIM", "CRITICO", str(e))

# ---------------- A4 · GAMEPLAY & BALANCE ----------------
try:
    out = subprocess.run(["node", os.path.join(ROOT, "bot.js")], capture_output=True, text=True, timeout=900)
    t = out.stdout
    if "venceu: true" not in t: diz("GAME", "CRITICO", "campanha invencivel")
    else: diz("GAME", "OK", "campanha vencivel (2 noites) ✔")
    m = re.search(r"mortes: (\d+)", t)
    if m and int(m.group(1)) > 8: diz("GAME", "GRAVE", f"muito dificil: {m.group(1)} mortes da IA")
except Exception as e: diz("GAME", "CRITICO", str(e))

# ---------------- A3 · DIRETOR DE IMAGEM (planos de geracao) ----------------
IDENT_D = "adult man, short black hair, long black trench coat, dark pants, pump shotgun, red rim light, same proportions as reference"
IDENT_L = "young man, light brown hair, red shirt under open dark jacket, jeans, glowing silver blade, red rim light, same proportions as reference"
CHROMA = "Isolated on flat solid pure green #00FF00 chroma background, no shadow, no text."
REFS = {"l-hurt": (os.path.join(SP, "luca.png"), IDENT_L, "hurt recoil stumbling back in pain"),
        "e-espectro": (None, "translucent wraith ghost, pale blue tattered spirit, red rim", "floating menacing wraith"),
        "e-espectro-atk": (None, "translucent wraith ghost, pale blue tattered spirit, red rim", "lunging attack with clawed hands forward, mouth open"),
        "e-cao": (None, "black hellhound with glowing red eyes, spectral edges, red rim", "galloping side view legs extended"),
        "e-cao-b": (None, "black hellhound with glowing red eyes, spectral edges, red rim", "galloping side view legs folded under body"),
        "e-vulto": (None, "tall dark shadow figure with long clawed arms, glowing red eyes, red rim", "standing menacing upright"),
        "e-vulto-atk": (None, "tall dark shadow figure with long clawed arms, glowing red eyes, red rim", "swiping claws overhead attack"),
        "m-idle": (None, "horned demon Malphas, massive, glowing red eyes, dark red skin, tattered wings", "upright idle menacing"),
        "m-atk": (None, "horned demon Malphas, massive, glowing red eyes, dark red skin", "raising both arms to slam attack"),
        "m-def": (None, "horned demon Malphas, massive, glowing red eyes, dark red skin", "dissolving laughing into mist")}
fila = [a for (ag, niv, msg, a) in F if niv in ("CRITICO", "GRAVE") and a and
        (a.startswith(("d-", "l-", "e-", "m-")))]
# dedupe mantendo ordem
seen = set(); fila = [x for x in fila if not (x in seen or seen.add(x))]
LIM = 10
plano = fila[:LIM]
restam = fila[LIM:]

# ---------------- DELIBERACAO ----------------
ORDEM = {"CRITICO": 0, "GRAVE": 1, "LEVE": 2, "OK": 3}
SCORE = {"CRITICO": 0, "GRAVE": 0.5, "LEVE": 0.8, "OK": 1.0}
nota = 100 * sum(SCORE[n] for _, n, _, _ in F) / max(1, len(F))
nC = sum(1 for _, n, _, _ in F if n == "CRITICO")
nG = sum(1 for _, n, _, _ in F if n == "GRAVE")
verd = "HORRIVEL" if nC else ("RUIM" if nG > 3 else ("REGULAR" if nG else "BOM"))

print("=" * 76)
print(" CONSELHO DE TESTES — 6 ESPECIALISTAS DELIBERANDO")
print("=" * 76)
for ag, tit in (("ANIM", "A1 ANIMACOES"), ("ARTE", "A2 DIRETORA DE ARTE"), ("IMAGE", "A3 DIRETOR DE IMAGEM"),
                ("GAME", "A4 GAMEPLAY"), ("MUNDO", "A5 MUNDO & ESCALA"), ("CANON", "A6 GUARDIA DO CANON")):
    if ag == "IMAGE": continue
    print(f"\n[{tit}]")
    for a, n, m, _ in sorted([x for x in F if x[0] == ag], key=lambda x: ORDEM[x[1]]):
        print(f"   [{'x' if n in ('CRITICO','GRAVE') else ('~' if n == 'LEVE' else 'v')}] {n:8s} {m}")
print("\n" + "-" * 76)
print(f" VEREDITO DO CONSELHO: {verd} · nota {nota:.0f}/100 · criticos {nC} · graves {nG}")
print(f"\n[A3 DIRETOR DE IMAGEM] PLANO DESTA RODADA ({len(plano)} imagens, limite {LIM}/rodada):")
for i, a in enumerate(plano, 1):
    ref, ident, pose = REFS.get(a, (None, IDENT_D, "pose"))
    print(f"   {i}. {a}.png  <-  \"{ident}. POSE: {pose}, full body head to boots. {CHROMA}\"" +
          (f"  [ref: {os.path.basename(ref)}]" if ref else "  [sem ref: criatura]"))
if restam: print("   FILA P/ PROXIMA RODADA:", ", ".join(restam))
print("=" * 76)
json.dump({"plano": plano, "restam": restam, "nota": nota, "veredito": verd},
          open(os.path.join(ROOT, "council_plan.json"), "w"))
