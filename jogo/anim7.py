#!/usr/bin/env python3
"""Animacoes derivadas sem IA: inimigos (flutuar/trote/deriva), neon do motel
piscando, olhos do Malphas pulsando e andar de re (ciclo invertido)."""
from PIL import Image, ImageDraw, ImageEnhance

A = "assets"
BG = (18, 14, 22, 255)


def gif(name, frames, ms):
    rgb = []
    for f in frames:
        bg = Image.new("RGBA", f.size, BG)
        bg.alpha_composite(f)
        rgb.append(bg.convert("RGB"))
    rgb[0].save(f"{A}/{name}.gif", save_all=True, append_images=rgb[1:],
                duration=ms, loop=0)
    print("gif:", name, len(frames), "quadros")


def canv(f, size, dx=0, dy=0, rot=0.0):
    c = Image.new("RGBA", size, (0, 0, 0, 0))
    s = f if not rot else f.rotate(rot, resample=Image.BICUBIC, center=(size[0] / 2, size[1]))
    c.alpha_composite(s, (dx, dy))
    return c


# --- espectro flutuando ---
e = Image.open(f"{A}/inimigo-espectro.png").convert("RGBA")
W, H = e.size
frames = []
for dx, dy in [(0, 0), (6, -12), (12, -20), (6, -12), (0, -6), (-6, -12)]:
    frames.append(canv(e, (W + 40, H + 40), dx + 14, dy + 26))
gif("anim-espectro-flutuar", frames, 160)

# --- cao sombrio trotando ---
c = Image.open(f"{A}/inimigo-cao-sombrio.png").convert("RGBA")
W, H = c.size
frames = [canv(c, (W, H)), canv(c, (W, H), 0, 4, 1.5),
          canv(c, (W, H), 0, 1), canv(c, (W, H), 0, 4, -1.5)]
gif("anim-cao-trote", frames, 130)

# --- vulto derivando ---
v = Image.open(f"{A}/inimigo-vulto.png").convert("RGBA")
W, H = v.size
frames = []
for i, dy in enumerate([0, -10, -18, -10, 0, 6]):
    f = canv(v, (W, H + 40), 0, dy + 20)
    f = ImageEnhance.Brightness(f).enhance(1.0 if i % 2 else 0.85)
    frames.append(f)
gif("anim-vulto-deriva", frames, 200)

# --- neon do motel piscando (sobre a plate) ---
p = Image.open("jogo/sprites/plate.png").convert("RGBA")
SIGN = (1120, 215, 1390, 350)     # placa MOTEL
STRIP = (1085, 415, 1536, 470)    # filete de neon do predio
seq = [0.0, 0.75, 0.15, 0.6, 0.0, 0.35]
frames = []
for dim in seq:
    f = p.copy()
    if dim > 0:
        ov = Image.new("RGBA", f.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(ov)
        a = int(200 * dim)
        d.rectangle(SIGN, fill=(5, 0, 5, a))
        d.rectangle(STRIP, fill=(5, 0, 5, a))
        f.alpha_composite(ov)
    frames.append(f)
gif("anim-neon-motel", frames, 140)

# --- olhos do Malphas pulsando ---
frames = []
for r, a in [(10, 60), (16, 110), (22, 160), (16, 110)]:
    f = p.copy()
    ov = Image.new("RGBA", f.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for ex in (737, 766):
        d.ellipse([ex - r, 250 - r, ex + r, 250 + r], fill=(255, 30, 30, a))
    f.alpha_composite(ov)
    frames.append(f)
gif("anim-olhos-malphas", frames, 220)

# --- andar de re: ciclo invertido ---
for char, size in [("dante", (220, 470)), ("luca", (208, 470))]:
    wa = Image.open(f"{A}/{char}-andar-a.png").convert("RGBA").resize(size, Image.LANCZOS)
    wb = Image.open(f"{A}/{char}-andar-b.png").convert("RGBA").resize(size, Image.LANCZOS)
    p1 = canv(Image.blend(wa, wb, 0.5), size, 0, 2)
    p2 = canv(Image.blend(wb, wa, 0.5), size, 0, 2)
    walk = [canv(wa, size), p1, canv(wb, size), p2]
    gif(f"anim-{char}-andar-tras", list(reversed(walk)), 150)
