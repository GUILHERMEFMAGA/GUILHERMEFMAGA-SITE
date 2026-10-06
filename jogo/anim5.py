#!/usr/bin/env python3
"""Animacoes aprimoradas: ciclo de andar com poses reais de passada,
ferido, pulo e recarga, para Dante e Luca."""
from PIL import Image

A = "assets"
BG = (18, 14, 22, 255)
D = (220, 470)   # canvas Dante
L = (208, 470)   # canvas Luca


def load(p, size):
    return Image.open(p).convert("RGBA").resize(size, Image.LANCZOS)


def on_canvas(f, size, dx=0, dy=0):
    c = Image.new("RGBA", size, (0, 0, 0, 0))
    c.alpha_composite(f, (dx, dy))
    return c


def gif(name, frames, ms, size):
    rgb = []
    for f in frames:
        bg = Image.new("RGBA", size, BG)
        bg.alpha_composite(f)
        rgb.append(bg.convert("RGB"))
    rgb[0].save(f"{A}/{name}.gif", save_all=True, append_images=rgb[1:],
                duration=ms, loop=0)
    print("gif:", name, len(frames), "quadros")


def sheet(name, frames, size):
    w, h = size
    s = Image.new("RGBA", (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        s.alpha_composite(f, (i * w, 0))
    s.save(f"{A}/{name}.png")
    print("sheet:", name, len(frames), "quadros")


def build(char, size):
    idle = load(f"jogo/sprites/{char}.png", size)
    wa = load(f"{A}/{char}-andar-a.png", size)
    wb = load(f"{A}/{char}-andar-b.png", size)
    fer = load(f"{A}/{char}-ferido.png", size)
    pul = load(f"{A}/{char}-pulo.png", size)

    # ciclo de andar aprimorado: A -> transicao -> B -> transicao
    p1 = Image.blend(wa, wb, 0.5)
    p1 = on_canvas(p1, size, 0, 2)
    p2 = Image.blend(wb, wa, 0.5)
    p2 = on_canvas(p2, size, 0, 2)
    walk = [on_canvas(wa, size), p1, on_canvas(wb, size), p2]
    gif(f"anim-{char}-andar-v2", walk, 150, size)
    sheet(f"{char}-andar-v2-sheet", walk, size)

    # ferido: idle -> recuo -> ferido -> volta
    hurt = [on_canvas(idle, size), on_canvas(fer, size, -4, 1),
            on_canvas(fer, size, -6, 2), on_canvas(idle, size)]
    gif(f"anim-{char}-ferido", hurt, 130, size)

    # pulo: agacha levemente -> sobe -> desce
    jump = [on_canvas(idle, size, 0, 2), on_canvas(pul, size, 0, -40),
            on_canvas(pul, size, 0, -90), on_canvas(pul, size, 0, -40),
            on_canvas(idle, size)]
    gif(f"anim-{char}-pulo", jump, 110, size)


build("dante", D)

# recarga do Dante
idle_d = load("jogo/sprites/dante.png", D)
rec = load(f"{A}/dante-recarregando.png", D)
reload_frames = [on_canvas(idle_d, D), on_canvas(rec, D), on_canvas(rec, D, 0, 1),
                 on_canvas(rec, D), on_canvas(idle_d, D)]
gif("anim-dante-recarga", reload_frames, 150, D)
sheet("dante-recarga-sheet", reload_frames[1:4], D)

build("luca", L)
