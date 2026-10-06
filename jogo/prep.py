#!/usr/bin/env python3
"""Recorta sprites da arte de gameplay, aplica mascara feather e monta a plate limpa."""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageChops

SRC = "assets/sobrenatural-gameplay-pixel.png"
OUT = "jogo/sprites"
os.makedirs(OUT, exist_ok=True)

img = Image.open(SRC).convert("RGBA")
W, H = img.size

# (x, y, w, h)
BOXES = {
    "heart":   (40, 26, 58, 58),
    "shell":   (256, 24, 40, 70),
    "dagger":  (450, 15, 80, 80),
    "banner":  (548, 12, 545, 84),
    "pontos":  (1272, 18, 162, 36),
    "skull":   (472, 102, 52, 54),
    "dante":   (452, 395, 220, 470),
    "luca":    (858, 390, 208, 470),
    "ghost_a": (20, 700, 405, 300),
    "ghost_b": (1160, 520, 360, 355),
}
FEATHER = {"dante": 14, "luca": 14, "ghost_a": 22, "ghost_b": 22}
SHAPE = {"dante": "round", "luca": "round", "ghost_a": "ellipse", "ghost_b": "ellipse"}


def feather_mask(w, h, f, shape):
    m = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(m)
    if shape == "round":
        d.rounded_rectangle((f, f, w - f, h - f), radius=f * 2, fill=255)
    else:
        d.ellipse((f, f, w - f, h - f), fill=255)
    return m.filter(ImageFilter.GaussianBlur(f * 0.7))


crops = {}
for name, (x, y, w, h) in BOXES.items():
    c = img.crop((x, y, x + w, y + h))
    if name in FEATHER:
        c.putalpha(feather_mask(w, h, FEATHER[name], SHAPE[name]))
    crops[name] = c
    c.save(f"{OUT}/{name}.png")
    print(name, "->", c.size)

# ---- plate limpa: borra a regiao original (vira mancha de sombra/nevoa) ----
import random

random.seed(66)
plate = img.copy()
HOLES = {
    "dante":   (452, 395, 220, 470, 0.30),
    "luca":    (858, 390, 208, 470, 0.30),
    "ghost_a": (20, 700, 405, 300, 0.10),
    "ghost_b": (1160, 520, 360, 355, 0.40),
}


def noise_layer(w, h, amp):
    n = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = n.load()
    for yy in range(h):
        for xx in range(w):
            v = random.randint(-amp, amp)
            g = 128 + v
            px[xx, yy] = (g, g, g, min(255, abs(v) * 6))
    return n


def box_mask(w, h, inset, blur):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rectangle((inset, inset, w - inset, h - inset), fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur))


# sanitiza: apaga rim-light vermelho / cromados / neons dentro e ao redor dos furos
san = img.copy()
sp = san.load()
for name, (x, y, w, h, mf) in HOLES.items():
    for yy in range(max(0, y - 14), min(H, y + h + 14)):
        for xx in range(max(0, x - 14), min(W, x + w + 14)):
            r, g, b, a = sp[xx, yy]
            mx = max(r, g, b)
            if (r > 100 and r - g > 50) or mx > 140:
                sp[xx, yy] = (25, 20, 26, 255)

src_px = san.load()


def row_sample(yy, x0, x1):
    """Cores medias de faixas de 6px logo fora de cada borda."""
    ls = [0, 0, 0]
    rs = [0, 0, 0]
    for dx in range(6):
        r, g, b, a = src_px[max(0, x0 - 10 + dx), yy]
        ls[0] += r; ls[1] += g; ls[2] += b
        r, g, b, a = src_px[min(W - 1, x1 + 4 + dx), yy]
        rs[0] += r; rs[1] += g; rs[2] += b
    return tuple(v / 6 for v in ls), tuple(v / 6 for v in rs)


plate = san.copy()
for name, (x, y, w, h, mf) in HOLES.items():
    region = Image.new("RGBA", (w, h), (0, 0, 0, 255))
    rp = region.load()
    for yy in range(h):
        ly, ry = row_sample(y + yy, x, x + w)
        for xx in range(w):
            t = xx / max(1, w - 1)
            n = random.randint(-5, 5)
            r = int(ly[0] + (ry[0] - ly[0]) * t) + n
            g = int(ly[1] + (ry[1] - ly[1]) * t) + n
            b = int(ly[2] + (ry[2] - ly[2]) * t) + n
            rp[xx, yy] = (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)), 255)
    region.putalpha(box_mask(w, h, 4, 18))
    plate.alpha_composite(region, (x, y))

# cobre a faixa do HUD (redesenhada em runtime) mas preserva o resto
d = ImageDraw.Draw(plate)
d.rectangle((0, 0, W, 104), fill=(0, 0, 0, 255))

plate.save(f"{OUT}/plate.png")
print("plate:", plate.size)

# folha de conferencia dos sprites
PAD = 10
names = ["heart", "shell", "dagger", "banner", "pontos", "skull", "dante", "luca", "ghost_a", "ghost_b"]
total_w = sum(crops[n].size[0] for n in names) + PAD * (len(names) + 1)
max_h = max(crops[n].size[1] for n in names) + PAD * 2
sheet = Image.new("RGBA", (total_w, max_h + 24), (30, 30, 30, 255))
x = PAD
for n in names:
    sheet.alpha_composite(crops[n], (x, PAD + 24))
    x += crops[n].size[0] + PAD
sheet.save(f"{OUT}/_sheet.png")
print("sheet ok")
