# A7 OLHO GIGANTE: compoe frames reais do que aparece na tela e ANALISA visualmente
import os, json
from PIL import Image
ROOT = os.path.dirname(os.path.abspath(__file__))
S2 = os.path.join(ROOT, "sprites2"); SP = os.path.join(ROOT, "sprites")
OUT = os.path.join(ROOT, "olho_frames"); os.makedirs(OUT, exist_ok=True)
R = []
plate = Image.open(os.path.join(SP, "plate.png")).convert("RGBA").resize((1536, 1024))
def spr(n): return Image.open(os.path.join(S2, n + ".png")).convert("RGBA")
def paste_feet(canvas, im, x, feet, lift=0):
    w, h = im.size
    canvas.paste(im, (x - w // 2, feet - h - lift), im)
    return (x - w // 2, feet - h - lift, w, h)
def lum(im, box):
    px = im.crop(box).convert("L").resize((8, 8))
    return sum(px.getdata()) / 64
def lum_silhueta(canvas, box):
    # luminancia media do que REALMENTE aparece (pixels com alpha), nao so o centro
    reg = canvas.crop(box).convert("RGBA")
    px = reg.load(); w, h = reg.size
    tot = n = 0
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            r, g, b, a = px[x, y]
            if a > 100:
                tot += 0.299 * r + 0.587 * g + 0.114 * b; n += 1
    return tot / max(1, n)
def analisa(nome, canvas, boxes, solo=False):
    msg = []
    for lbl, (x, y, w, h) in boxes.items():
        if x < 0 or y < 0 or x + w > 1536 or y + h > 1024: msg.append(f"{lbl} FORA da tela")
        bg = lum(canvas, (max(0, x - 40), max(0, y), max(1, x - 5), min(1024, y + h)))
        fg = lum_silhueta(canvas, (x, y, x + w, y + h))
        reg = canvas.crop((x, y, x + w, y + h)).convert("RGBA")
        rpx = reg.load(); rw, rh = reg.size
        rim = tot = 0
        for yy in range(0, rh, 2):
            for xx in range(0, rw, 2):
                r, g, b, a = rpx[xx, yy]
                if a > 100:
                    tot += 1
                    if r > 140 and r - max(g, b) > 60: rim += 1
        rimc = 100 * rim / max(1, tot)
        # humano ve pelo contorno: invisivel so sem rim E sem contraste
        if rimc < 1.2 and abs(fg - bg) < 5: msg.append(f"{lbl} INVISIVEL no fundo (rim {rimc:.1f}%, contraste {abs(fg-bg):.0f})")
    R.append((nome, msg))
    canvas.convert("RGB").save(os.path.join(OUT, nome + ".png"))
d_i, d_a, d_c, d_j, d_f = spr("d-idle"), spr("d-runA"), spr("d-runC"), spr("d-jump"), spr("d-fire")
c = plate.copy(); b = {}
b["dante"] = paste_feet(c, d_i, 700, 865); analisa("f1_idle", c, b)
c = plate.copy(); b = {"dante": paste_feet(c, d_a, 700, 865)}; analisa("f2_corridaA", c, b)
c = plate.copy(); b = {"dante": paste_feet(c, d_c, 700, 865)}; analisa("f3_corridaC", c, b)
aA = d_a.getbbox(); aC = d_c.getbbox()
areaA = (aA[2]-aA[0])*(aA[3]-aA[1]); areaC = (aC[2]-aC[0])*(aC[3]-aC[1])
if abs(areaA-areaC)/max(areaA,areaC) > 0.3: R.append(("ciclo", ["silhueta salta entre frames da corrida"]))
c = plate.copy(); b = {"dante": paste_feet(c, d_j, 700, 865, 70)}
if 865 - 70 - d_j.size[1] + d_j.size[1] >= 990: R.append(("pulo", ["pulo nao sai do chao"]))
analisa("f4_pulo", c, b)
c = plate.copy(); b = {"dante": paste_feet(c, d_f, 700, 865)}; analisa("f5_tiro", c, b)
c = plate.copy(); b = {"dante": paste_feet(c, spr("d-crouch"), 640, 865), "luca": paste_feet(c, spr("l-crouch"), 950, 865)}; analisa("f7_agachado", c, b)
c = plate.copy(); b = {"dante": paste_feet(c, spr("d-walkA"), 620, 865), "luca": paste_feet(c, spr("l-walkA"), 920, 865)}; analisa("f8_andada", c, b)
c = plate.copy(); b = {"dante": paste_feet(c, d_a, 600, 880)}
b["espectro"] = paste_feet(c, spr("e-espectro"), 1000, 780)
b["cao"] = paste_feet(c, spr("e-cao"), 350, 840)
b["vulto"] = paste_feet(c, spr("e-vulto"), 1200, 760)
b["malphas"] = paste_feet(c, spr("m-idle"), 768, 520 + 260)
analisa("f6_batalha", c, b)
ok = sum(1 for _, m in R if not m); tot = len(R)
print(f"A7 OLHO GIGANTE: {ok}/{tot} cenas sadias")
for nome, msgs in R:
    for m in msgs: print(f"   [x] {nome}: {m}")
    if not msgs: print(f"   [v] {nome}: composicao ok")
