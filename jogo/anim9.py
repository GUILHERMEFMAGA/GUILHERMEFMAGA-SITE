#!/usr/bin/env python3
"""Animacoes novas: Malphas (flutuar/ataque/derrota), corrida v2 com 2 poses,
galope do cao, ataques de espectro/vulto e lanterna do Luca."""
from PIL import Image, ImageEnhance

A = "assets"
BG = (18, 14, 22, 255)


def load(p, size=None):
    im = Image.open(p).convert("RGBA")
    return im.resize(size, Image.LANCZOS) if size else im


def canv(f, size, dx=0, dy=0):
    c = Image.new("RGBA", size, (0, 0, 0, 0))
    c.alpha_composite(f, (dx, dy))
    return c


def gif(name, frames, ms, size=None):
    rgb = []
    for f in frames:
        sz = size or f.size
        bg = Image.new("RGBA", sz, BG)
        bg.alpha_composite(canv(f, sz) if f.size != sz else f)
        rgb.append(bg.convert("RGB"))
    rgb[0].save(f"{A}/{name}.gif", save_all=True, append_images=rgb[1:],
                duration=ms, loop=0)
    print("gif:", name, len(frames), "quadros")


# ---- Malphas ----
mi = load(f"{A}/malphas-idle.png")
S = mi.size
ma = load(f"{A}/malphas-ataque.png", S)
md = load(f"{A}/malphas-derrota.png", S)

gif("anim-malphas-flutuar",
    [canv(mi, (S[0], S[1] + 40), 0, 30), canv(mi, (S[0], S[1] + 40), 0, 18),
     canv(mi, (S[0], S[1] + 40), 0, 8), canv(mi, (S[0], S[1] + 40), 0, 18)], 240)

gif("anim-malphas-ataque",
    [canv(mi, S), canv(Image.blend(mi, ma, 0.5), S), canv(ma, S), canv(ma, S, 10, 0)], 150)

der = [canv(mi, S), canv(Image.blend(mi, md, 0.45), S), canv(md, S),
       canv(ImageEnhance.Brightness(md).enhance(1.5), S),
       canv(ImageEnhance.Brightness(md).enhance(2.0), S)]
gif("anim-malphas-derrota", der, 220)

# ---- corrida v2 (2 poses reais) ----
for char, size in [("dante", (220, 470)), ("luca", (208, 470))]:
    ra = load(f"{A}/{char}-correr.png", size)
    rb = load(f"{A}/{char}-correr-b.png", size)
    gif(f"anim-{char}-correr-v2",
        [ra, Image.blend(ra, rb, 0.5), rb, Image.blend(rb, ra, 0.5)], 110)

# ---- galope do cao ----
ca = load(f"{A}/inimigo-cao-sombrio.png")
CS = ca.size
cb = load(f"{A}/cao-sombrio-b.png", CS)
gif("anim-cao-galope", [ca, Image.blend(ca, cb, 0.5), cb, Image.blend(cb, ca, 0.5)], 110)

# ---- ataques dos inimigos ----
eb = load(f"{A}/inimigo-espectro.png")
ES = eb.size
ea = load(f"{A}/espectro-ataque.png", ES)
gif("anim-espectro-ataque",
    [eb, Image.blend(eb, ea, 0.5), ea, canv(ea, (ES[0] + 24, ES[1]), 24, 0)], 120)

vb = load(f"{A}/inimigo-vulto.png")
VS = vb.size
va = load(f"{A}/vulto-ataque.png", VS)
gif("anim-vulto-ataque",
    [vb, Image.blend(vb, va, 0.5), va, canv(va, (VS[0] + 20, VS[1]), 20, 0)], 140)

# ---- lanterna do Luca ----
ll = load(f"{A}/luca-lanterna.png", (208, 470))
gif("anim-luca-lanterna",
    [ImageEnhance.Brightness(ll).enhance(b) for b in (1.0, 0.82, 1.0, 0.9, 1.08, 0.95)], 120)
