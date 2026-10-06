#!/usr/bin/env python3
"""Animacoes do lote 11: invocacao do Malphas, descanso, chute, giro,
morte do espectro, bote do cao, grito do vulto, triunfo e duo."""
from PIL import Image, ImageEnhance, ImageOps

A = "assets"
BG = (18, 14, 22, 255)


def load(p, size=None):
    im = Image.open(f"{A}/{p}").convert("RGBA")
    return im.resize(size, Image.LANCZOS) if size else im


def canv(f, size, dx=0, dy=0, rot=0.0):
    c = Image.new("RGBA", size, (0, 0, 0, 0))
    s = f if not rot else f.rotate(rot, resample=Image.BICUBIC, center=(size[0] / 2, size[1]))
    c.alpha_composite(s, (dx, dy))
    return c


def gif(name, frames, ms, size=None):
    rgb = []
    for f in frames:
        sz = size or f.size
        bg = Image.new("RGBA", sz, BG)
        if f.size != sz:
            f = canv(f, sz)
        bg.alpha_composite(f)
        rgb.append(bg.convert("RGB"))
    rgb[0].save(f"{A}/{name}.gif", save_all=True, append_images=rgb[1:],
                duration=ms, loop=0)
    print("gif:", name, len(frames), "quadros")


# Malphas invocando
mi = load("malphas-idle.png"); S = mi.size
mv = load("malphas-invocacao.png", S)
gif("anim-malphas-invocar",
    [canv(mi, S), canv(Image.blend(mi, mv, 0.5), S), canv(mv, S),
     canv(ImageEnhance.Brightness(mv).enhance(1.25), S)], 200)

# descansos (respirando)
for p, n, size in [("dante-descanso.png", "anim-dante-descanso", (220, 470)),
                   ("luca-descanso.png", "anim-luca-descanso", (208, 470))]:
    r = load(p, size)
    gif(n, [canv(r, size), canv(r, size, 0, 2), canv(r, size), canv(r, size, 0, 1)], 320)

# chute do Dante
di = Image.open("jogo/sprites/dante.png").convert("RGBA").resize((220, 470), Image.LANCZOS); dc = load("dante-chute.png", (220, 470))
S = (220, 470)
gif("anim-dante-chute",
    [canv(di, S), canv(Image.blend(di, dc, 0.5), S), canv(dc, S), canv(dc, S, 10, 0)], 120)

# giro do Luca (flip = ilusao de rotacao)
li = Image.open("jogo/sprites/luca.png").convert("RGBA").resize((208, 470), Image.LANCZOS); lg = load("luca-giro.png", (208, 470))
S = (208, 470)
gif("anim-luca-giro",
    [canv(li, S), canv(lg, S), canv(ImageOps.mirror(lg), S), canv(li, S)], 110)

# triunfo do Luca
lt = load("luca-lamina-erguida.png", (208, 470)); S = (208, 470)
gif("anim-luca-triunfo",
    [canv(lt, S), canv(lt, S, 0, 2, 1.2), canv(lt, S), canv(lt, S, 0, 2, -1.2)], 200)

# morte do espectro
eb = load("inimigo-espectro.png"); S = eb.size
em = load("espectro-morrendo.png", S)
gif("anim-espectro-morte",
    [canv(eb, S), canv(Image.blend(eb, em, 0.5), S), canv(em, S),
     canv(ImageEnhance.Brightness(em).enhance(1.6), S)], 160)

# bote do cao
cb = load("inimigo-cao-sombrio.png"); S = cb.size
cp = load("cao-bote.png", S)
gif("anim-cao-bote",
    [canv(cb, S), canv(Image.blend(cb, cp, 0.5), S), canv(cp, S), canv(cp, S, 18, -6)], 110)

# grito do vulto
vb = load("inimigo-vulto.png"); S = vb.size
vg = load("vulto-grito.png", S)
gif("anim-vulto-grito",
    [canv(vb, S), canv(Image.blend(vb, vg, 0.5), S), canv(vg, S), canv(vg, S, 0, -6)], 180)

# duo de costas (balanco lento)
du = load("duo-costas.png")
S = du.size
gif("anim-duo-costas",
    [canv(du, (S[0], S[1] + 8)), canv(du, (S[0], S[1] + 8), 0, 2),
     canv(du, (S[0], S[1] + 8)), canv(du, (S[0], S[1] + 8), 0, 3)], 400)
