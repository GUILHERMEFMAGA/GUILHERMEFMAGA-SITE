#!/usr/bin/env python3
"""Novas animacoes: correr, andar cauteloso, andar calmo/guarda e agachar."""
from PIL import Image

A = "assets"
BG = (18, 14, 22, 255)
D = (220, 470)
L = (208, 470)


def load(p, size):
    return Image.open(p).convert("RGBA").resize(size, Image.LANCZOS)


def canv(f, size, dx=0, dy=0, rot=0.0):
    c = Image.new("RGBA", size, (0, 0, 0, 0))
    s = f if not rot else f.rotate(rot, resample=Image.BICUBIC, center=(size[0] / 2, size[1]))
    c.alpha_composite(s, (dx, dy))
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


def cycle(pose, size, dy=3, rot=1.2):
    return [canv(pose, size), canv(pose, size, 0, dy, rot),
            canv(pose, size), canv(pose, size, 0, dy, -rot)]


def build(char, size):
    idle = load(f"jogo/sprites/{char}.png", size)
    c = load(f"{A}/{char}-andar-c.png", size)
    dd = load(f"{A}/{char}-andar-d.png", size)
    run = load(f"{A}/{char}-correr.png", size)
    aga = load(f"{A}/{char}-agachado.png", size)

    # andar calmo (ombro/guarda)
    wc = cycle(c, size)
    gif(f"anim-{char}-andar-calmo", wc, 200, size)

    # andar cauteloso
    wk = cycle(dd, size, dy=2, rot=0.8)
    gif(f"anim-{char}-andar-cauteloso", wk, 240, size)

    # correr: bounce rapido com inclinacao
    runf = [canv(run, size), canv(run, size, 0, -8, -1.5),
            canv(run, size, 0, -2), canv(run, size, 0, 3, 1.0)]
    gif(f"anim-{char}-correr", runf, 100, size)
    sheet(f"{char}-correr-sheet", runf, size)

    # agachar: idle -> meio -> agachado
    meio = Image.blend(idle, aga, 0.5)
    crouch = [canv(idle, size), canv(meio, size, 0, 2), canv(aga, size),
              canv(aga, size, 0, 1)]
    gif(f"anim-{char}-agachar", crouch, 140, size)


build("dante", D)
build("luca", L)
