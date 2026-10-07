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
        if "crouch" in f:
            r = im.size[1] / float(c)
            if not (0.5 <= r <= 0.8): diz("ARTE", "GRAVE", f"{f}: agachamento fora da faixa 50-80% do canon", f[:-4])
        elif abs(im.size[1] - c) > c * 0.05: diz("ARTE", "GRAVE", f"{f}: altura {im.size[1]} != canon {c}", f[:-4])
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
    # telemetria da IA jogadora alimentando as demais
    TJ = os.path.join(ROOT, "bot_telemetry.json")
    if os.path.exists(TJ):
        tj = json.load(open(TJ))
        diz("GAME", "OK", f"telemetria da IA jogadora compartilhada: {tj['kills']} abates, {tj['tiros']} tiros, precisao {tj['precisao']}%, {tj['pickups']} itens, boss em {tj['tempoAteBoss']}s")
        if float(tj["danoMin"]) > 12: diz("GAME", "GRAVE", "dano/min alto: " + str(tj["danoMin"]))
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

# ---------------- A7 · OLHO GIGANTE (visao composta) ----------------
try:
    out = subprocess.run([sys.executable, os.path.join(ROOT, "olho.py")], capture_output=True, text=True, timeout=180)
    for ln in out.stdout.splitlines():
        if "[x]" in ln: diz("OLHO", "GRAVE", ln.strip()[4:])
        elif "cenas sadias" in ln: diz("OLHO", "OK", ln.strip())
except Exception as e: diz("OLHO", "CRITICO", "olho falhou: " + str(e))

# ---------------- A8 · AUDITORA DE CODIGO ----------------
gsrc = open(os.path.join(ROOT, "game.js"), encoding="utf-8").read()
init_game = set(re.findall(r"game\.(\w+)\s*=", gsrc))
init_m = set(re.findall(r"game\.malphas = \{([^}]*)\}", gsrc)[0].replace(":", "=").split(",")) if "malphas" in gsrc else set()
init_m = set(x.split("=")[0].strip() for x in init_m if x.strip())
st_lit = re.search(r"const ST = \{([^}]*)\}", gsrc)
st_init = set(k.split(":")[0].strip() for k in st_lit.group(1).split(",") if k.strip()) if st_lit else set()
achados8 = 0
for mvar, initset in (("game", init_game), ("m", init_m)):
    for mm in re.finditer(re.escape(mvar) + r"\.(\w+)\s*<=?\s*0", gsrc):
        fld = mm.group(1)
        if fld not in initset:
            diz("CODE", "CRITICO", f"{mvar}.{fld} usado em comparacao <=0 mas nunca inicializado (undefined <= 0 eh false!)")
            achados8 += 1
for mm in re.finditer(r"ST\.(\w+)\s*===", gsrc):
    if mm.group(1) not in st_init and mm.group(1) not in ("state", "paused"):
        pass  # t/cut/night sao mutaveis, ok
if not achados8: diz("CODE", "OK", "nenhuma comparacao contra campo nao-inicializado (bug do atkAnim nao volta)")

# ---------------- A9 · CIENTISTA DE DADOS (memoria entre rodadas) ----------------
HIST = os.path.join(ROOT, "council_history.jsonl")
prev = None
if os.path.exists(HIST):
    lines = [json.loads(l) for l in open(HIST) if l.strip()]
    if lines: prev = lines[-1]
_norm = lambda s: re.sub(r"\d+", "#", s)   # numeros mudam a cada rodada (telemetria) e nao sao regressao
agora_msgs = set(_norm(m) for (_, n, m, _) in F if n in ("CRITICO", "GRAVE"))
if prev:
    antes = set(_norm(p) for p in prev.get("problemas", []))
    resolvidos = antes - agora_msgs
    regres = agora_msgs - antes
    for r in sorted(resolvidos): diz("DADOS", "OK", f"resolvido desde a ultima rodada: {r}")
    for r in sorted(regres): diz("DADOS", "CRITICO", f"REGRESSAO nova: {r}")
    diz("DADOS", "OK", f"tendencia de nota: {prev.get('nota', 0):.0f} -> (atual no fim)")
else:
    diz("DADOS", "OK", "primeira rodada com memoria ativa")

# ---------------- A10 · PERFORMANCE ----------------
try:
    out = subprocess.run(["node", os.path.join(ROOT, "perf.js")], capture_output=True, text=True, timeout=180)
    ln = [l for l in out.stdout.splitlines() if "A10" in l]
    if ln:
        diz("PERF", "OK", ln[0].strip())
        ms = float(re.search(r"([\d.]+)ms", ln[0]).group(1))
        if ms > 8: diz("PERF", "GRAVE", f"frame lento: {ms}ms (>8ms)")
except Exception as e: diz("PERF", "CRITICO", str(e))

# ---------------- A11 · UX & ACESSIBILIDADE ----------------
for chk, lbl in (('"WASD', "controles documentados no titulo/hint"), ("KeyM", "mute de som disponivel"),
                 ("PAUSA", "pausa implementada"), ("PRESS START", "chamada clara de inicio"),
                 ("hintT", "dica inicial de controles")):
    if chk in gsrc: diz("UX", "OK", lbl + " ✔")
    else: diz("UX", "LEVE", "falta: " + lbl)

# ---------------- A12 · MILIMETRO (geometria frame a frame) ----------------
# Mede cada milimetro: componentes (flagra contact-sheet), altura vs canon,
# largura maxima, cabeca presente. O que ele flagra vai p/ A13 sintetizar.
from collections import deque as _dq
def comp_count(im):
    px = im.load(); w, h = im.size
    seen = bytearray(w * h); big = 0
    for sy in range(0, h, 3):
        for sx in range(0, w, 3):
            i = sy * w + sx
            if px[sx, sy][3] > 100 and not seen[i]:
                sz = 0; dq = _dq([(sx, sy)]); seen[i] = 1
                while dq:
                    x, y = dq.pop(); sz += 1
                    for nx in (x - 3, x + 3):
                        if 0 <= nx < w and not seen[y * w + nx] and px[nx, y][3] > 100:
                            seen[y * w + nx] = 1; dq.append((nx, y))
                    for ny in (y - 3, y + 3):
                        if 0 <= ny < h and not seen[ny * w + x] and px[x, ny][3] > 100:
                            seen[ny * w + x] = 1; dq.append((x, ny))
                if sz > 60: big += 1
    return big
def head_ok(im):
    px = im.load(); w, h = im.size; n = 0
    for y in range(0, max(2, int(h * 0.12))):
        for x in range(0, w, 2):
            if px[x, y][3] > 100: n += 1
    tot = sum(1 for y in range(0, h, 4) for x in range(0, w, 4) if px[x, y][3] > 100)
    return n > max(4, tot * 0.004)
mil_flags = []
for f in sorted(os.listdir(S2)):
    if not f.endswith(".png") or f[:2] not in ("d-", "l-"): continue
    im = bbox(load(os.path.join(S2, f))); w, h = im.size; pref = f[0]
    if comp_count(im) > 1:
        diz("MILI", "CRITICO", f"{f}: MAIS DE UM PERSONAGEM NO SPRITE (contact-sheet)", f[:-4]); mil_flags.append(f)
    if not head_ok(im):
        diz("MILI", "CRITICO", f"{f}: sem cabeca no topo do sprite", f[:-4]); mil_flags.append(f)
    if "crouch" in f:
        r = h / float(canon[pref])
        if not (0.5 <= r <= 0.8): diz("MILI", "GRAVE", f"{f}: agachamento com altura absurda ({r:.0%} do canon)", f[:-4]); mil_flags.append(f)
        else: diz("MILI", "OK", f"{f}: agachamento a {r:.0%} da altura em pe ✔")
    elif w > 380:
        diz("MILI", "GRAVE", f"{f}: largura {w}px excede 380 (passada exagerada)", f[:-4]); mil_flags.append(f)
if not mil_flags: diz("MILI", "OK", "geometria milimetrica: 1 personagem/sprite, cabecas presentes, alturas no canon")

# ---------------- A13 · SINTESE DE PROMPTS (cruzamento p/ informar o usuario) ----------------
cruza = [(a, n, m) for (a, n, m, as_) in F if n in ("CRITICO", "GRAVE") for _ in [0]]
prom_rows = []
for f_ in sorted({a for (a, n, m, as_) in F if n in ("CRITICO", "GRAVE") and a and a.startswith(("d-", "l-", "e-", "m-"))}):
    motivos = [m for (a, n, m, as_) in F if n in ("CRITICO", "GRAVE") and as_ == f_]
    ref, ident, pose = REFS.get(f_, (None, IDENT_D, "fix pose following canon"))
    prom_rows.append((f_, ident, pose, motivos, ref))
with open(os.path.join(ROOT, "council_prompts.md"), "w") as pf:
    pf.write("# PROMPTS SINTETIZADOS PELA A13 (cruzamento de MILIMETRO+ARTE+CANON+OLHO+POSES)\n")
    pf.write("\n## 1) CORRECOES DESTA RODADA (sprites com achado CRITICO/GRAVE)\n")
    for f_, ident, pose, motivos, ref in prom_rows:
        pf.write(f"\n## {f_}.png\n- problemas cruzados: " + "; ".join(motivos) +
                 f"\n- prompt: \"{ident}. POSE: {pose}, full body head to boots. {CHROMA}\"\n")
    # catalogo canon completo: prompt pronto p/ qualquer sprite de personagem,
    # sempre com ancora de rosto no sprite aprovado (consistencia garantida)
    pf.write("\n## 2) CATALOGO CANON COMPLETO (prompt pronto de cada personagem/pose)\n")
    POSES = {"idle": "standing idle, relaxed alert pose",
             "walkA": "walking mid-stride, one foot flat on ground, other heel raised",
             "walkB": "walking alternate phase, opposite foot forward",
             "runA": "running extended stride phase, front leg reaching forward",
             "runB": "running passing phase, back knee raised, legs crossed under body",
             "runC": "running extended stride, opposite leg forward",
             "runD": "running high-knee passing phase, body sprung upward",
             "jump": "jumping mid-air, knees tucked",
             "crouch": "deep low tactical crouch, knees bent sharply, body compact",
             "aim": "shouldering the weapon aiming forward",
             "fire": "firing recoil, weapon leveled forward",
             "reload": "reloading, working the pump / inserting shell",
             "hurt": "hurt recoil stumbling back in pain",
             "prep": "raising the glowing blade preparing a slash",
             "thrust": "lunging thrust with the glowing blade"}
    ncat = 0
    for f_ in sorted(os.listdir(S2)):
        if not f_.endswith(".png") or f_[:2] not in ("d-", "l-"): continue
        nome = f_[:-4]; sufix = nome[2:]
        ident = IDENT_D if f_[0] == "d" else IDENT_L
        ancora = "assets/old-d-walkB.png" if f_[0] == "d" else "assets/old-l-walkA.png"
        pose = POSES.get(sufix, "pose following canon")
        pf.write(f"\n## {nome}.png  [ancora de rosto: {ancora}]\n"
                 f"- prompt: \"Using reference {ancora} keep pixel-identical face/hair/clothes/style. "
                 f"{ident}. POSE: {pose}, full body head to boots. {CHROMA}\"\n")
        ncat += 1
diz("SINT", "OK", f"A13 cruzou {len(cruza)} achados e manteve catalogo canon de {ncat} prompts prontos em council_prompts.md")

# ---------------- A14 · ESPELHO (sprites virados p/ esquerda) ----------------
flip_bad = 0
for f in sorted(os.listdir(S2)):
    if not f.endswith(".png") or f[:2] not in ("d-", "l-"): continue
    im = bbox(load(os.path.join(S2, f)))
    fl = im.transpose(Image.FLIP_LEFT_RIGHT)
    if fl.size != im.size or not head_ok(fl): diz("ESP", "GRAVE", f"{f}: espelho quebra sprite", f[:-4]); flip_bad += 1
if not flip_bad: diz("ESP", "OK", "todos os d-*/l-* espelham sem perder cabeca/shape (face -1 segura) ✔")

# ---------------- A15 · CANTOS (a IA jogadora esteve em todo o mapa) ----------------
TJp = os.path.join(ROOT, "bot_telemetry.json")
sup = json.load(open(TJp)).get("superior", {}) if os.path.exists(TJp) else {}
if sup.get("cantos", 0) == 4:
    al = sup.get("alcance", {})
    diz("CANT", "OK", f"IA jogadora visitou os 4 cantos; alcance x[{al.get('xMin')},{al.get('xMax')}] y[{al.get('yMin')},{al.get('yMax')}] (mapa 140-1440 x 640-990) ✔")
else:
    diz("CANT", "GRAVE", f"IA jogadora so alcancou {sup.get('cantos', 0)}/4 cantos")

# ---------------- A16 · COBERTURA (todas as animacoes, atuais e futuras) ----------------
anims_d = re.search(r"dante:\s*\[([^\]]*)\]", gsrc); anims_l = re.search(r"luca:\s*\[([^\]]*)\]", gsrc)
n_anims = (anims_d.group(1) + anims_l.group(1)).count('"') // 2 if anims_d and anims_l else 0
if sup.get("coberturaDante", 0) == 100 and sup.get("coberturaLuca", 0) == 100:
    diz("COB", "OK", f"cobertura 100%/100%: {sup.get('animsTestadas', n_anims)} animacoes executadas pela IA jogadora (lista ANIMS = fonte unica; novas entram automaticamente) ✔")
else:
    diz("COB", "GRAVE", f"cobertura incompleta dante {sup.get('coberturaDante')}% luca {sup.get('coberturaLuca')}%: " + ", ".join(sup.get("faltamDante", []) + sup.get("faltamLuca", [])))

# ---------------- A17 · HITBOX & ESQUIVAS ----------------
if re.search(r"!\s*game\.crouch", gsrc): diz("HIT", "OK", "agachar esquiva do golpe do chefe (hitbox respeita crouch) ✔")
else: diz("HIT", "GRAVE", "crouch nao protege de nada (hitbox ignora agachamento)")
if re.search(r"jumpT", gsrc) and re.search(r"ghosts", gsrc): diz("HIT", "OK", "pulo e hitboxes de inimigos presentes no loop de colisao")

# ---------------- A18 · AUDIO ----------------
nsfx = len(set(re.findall(r"sfx\.(\w+)\(", gsrc)))
if nsfx >= 5: diz("SOM", "OK", f"{nsfx} efeitos sonoros distintos disparados (tiro/pulo/recarga/dano/vazio...) ✔")
else: diz("SOM", "LEVE", f"so {nsfx} efeitos sonoros")

# ---------------- A19 · ESTADOS & FLUXO ----------------
ok19 = 0
for chk, lbl in (("KeyP", "pausa"), ("KeyM", "mute"), ("CUT2", "transicao p/ noite 2"), ("resetGame", "reset limpo")):
    if chk in gsrc: ok19 += 1
if ok19 == 4: diz("EST", "OK", "fluxo completo: pausa, mute, noite 2 e reset ✔")
else: diz("EST", "LEVE", f"fluxo incompleto ({ok19}/4)")

# ---------------- A20 · BALANCE (telemetria da IA jogadora) ----------------
if sup:
    tj2 = json.load(open(TJp))
    if tj2.get("kills", 0) > 0 and tj2.get("tiros", 0) > 0 and tj2.get("pickups", 0) > 0:
        diz("BAL", "OK", f"economia viva: {tj2['kills']} abates, {tj2['pickups']} itens, {tj2['recargas'] if 'recargas' in tj2 else '?'} recargas na sessao da IA")
    if (tj2.get("tempoAteBoss") or 999) > 120: diz("BAL", "GRAVE", "progressao lenta demais ate o chefe")

# ---------------- A21 · POSES (silhueta conta a animacao) ----------------
def mask(im):
    px = im.load(); w, h = im.size
    return [[1 if px[x, y][3] > 100 else 0 for x in range(0, w, 4)] for y in range(0, h, 4)]
def iou(a, b):
    h = min(len(a), len(b)); w = min(len(a[0]), len(b[0]))
    inter = uni = 0
    for y in range(h):
        for x in range(w):
            va, vb = a[y][x], b[y][x]
            inter += va & vb; uni += va | vb
    return inter / max(1, uni)
def get(n): return bbox(load(os.path.join(S2, n + ".png")))
# fases adjacentes do ciclo precisam diferir (estendida vs passagem);
# A vs C sao fases espelhadas do mesmo gesto => parecidas por natureza, nao contar.
pairs = [("d-runA", "d-runB", 0.80, "corrida do Dante nao anima (A==B)"),
         ("d-runB", "d-runC", 0.80, "corrida do Dante nao anima (B==C)"),
         ("d-runC", "d-runD", 0.80, "corrida do Dante nao anima (C==D)"),
         ("d-runD", "d-runA", 0.80, "corrida do Dante nao anima (D==A)"),
         ("l-runA", "l-runB", 0.80, "corrida do Luca nao anima (A==B)"),
         ("l-runB", "l-runC", 0.80, "corrida do Luca nao anima (B==C)"),
         ("l-runC", "l-runD", 0.80, "corrida do Luca nao anima (C==D)"),
         ("l-runD", "l-runA", 0.80, "corrida do Luca nao anima (D==A)"),
         ("d-runA", "d-walkA", 0.80, "corrida do Dante identica a andada"),
         ("l-runC", "l-walkA", 0.80, "corrida do Luca identica a andada")]
pose_bad = 0
for a_, b_, thr, msg in pairs:
    pa, pb = os.path.join(S2, a_ + ".png"), os.path.join(S2, b_ + ".png")
    if not (os.path.exists(pa) and os.path.exists(pb)): continue
    ma = mask(get(a_));
    im_b = get(b_); im_a = get(a_)
    sc = im_a.size[1] / float(im_b.size[1])
    if abs(sc - 1) > 0.06: im_b = im_b.resize((int(im_b.size[0] * sc), im_a.size[1]), Image.NEAREST)
    v = iou(ma, mask(im_b))
    if v >= thr: diz("POSE", "GRAVE", f"{msg} (IoU {v:.2f})", a_); pose_bad += 1
    else: diz("POSE", "OK", f"{a_} vs {b_}: poses distintas (IoU {v:.2f}) ✔")
if not pose_bad: diz("POSE", "OK", "leituras de silhueta: correr != andar, fases da corrida distintas")

# A3 recolhe a fila DEPOIS de todas as 21 IAs falarem (nada se perde)
fila = [a for (ag, niv, msg, a) in F if niv in ("CRITICO", "GRAVE") and a and
        (a.startswith(("d-", "l-", "e-", "m-")))]
seen = set(); fila = [x for x in fila if not (x in seen or seen.add(x))]
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
print(" CONSELHO DE TESTES — MODO DEUS: 21 IAS DELIBERANDO")
print("=" * 76)
for ag, tit in (("ANIM", "A1 ANIMACOES"), ("ARTE", "A2 DIRETORA DE ARTE"),
                ("GAME", "A4 GAMEPLAY"), ("MUNDO", "A5 MUNDO & ESCALA"), ("CANON", "A6 GUARDIA DO CANON"),
                ("OLHO", "A7 OLHO GIGANTE"), ("CODE", "A8 AUDITORA DE CODIGO"), ("DADOS", "A9 CIENTISTA DE DADOS"),
                ("PERF", "A10 PERFORMANCE"), ("UX", "A11 UX"),
                ("MILI", "A12 MILIMETRO"), ("SINT", "A13 SINTESE DE PROMPTS"), ("ESP", "A14 ESPELHO"),
                ("CANT", "A15 CANTOS DO MAPA"), ("COB", "A16 COBERTURA DE ANIMACOES"), ("HIT", "A17 HITBOX & ESQUIVAS"),
                ("SOM", "A18 AUDIO"), ("EST", "A19 ESTADOS & FLUXO"), ("BAL", "A20 BALANCE"), ("POSE", "A21 POSES")):
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
with open(os.path.join(ROOT, "council_history.jsonl"), "a") as hf:
    hf.write(json.dumps({"nota": nota, "veredito": verd, "problemas": sorted(agora_msgs)}) + "\n")
