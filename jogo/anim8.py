#!/usr/bin/env python3
"""Animacoes das poses novas: vitoria, lendo e lanterna com flicker."""
from PIL import Image, ImageEnhance

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


def gif(name, frames, ms, size=None):
    rgb = []
    for f in frames:
        sz = size or f.size
        bg = Image.new("RGBA", sz, BG)
        bg.alpha_composite(f)
        rgb.append(bg.convert("RGB"))
    rgb[0].save(f"{A}/{name}.gif", save_all=True, append_images=rgb[1:],
                duration=ms, loop=0)
    print("gif:", name, len(frames), "quadros")


for char, size in [("dante", D), ("luca", L)]:
    v = load(f"{A}/{char}-vitoria.png", size)
    gif(f"anim-{char}-vitoria",
        [canv(v, size), canv(v, size, 0, 2, 1.0), canv(v, size), canv(v, size, 0, 2, -1.0)],
        200)
    r = load(f"{A}/{char}-lendo.png", size)
    gif(f"anim-{char}-lendo",
        [canv(r, size), canv(r, size, 0, 1), canv(r, size), canv(r, size, 0, 2)],
        300)

lan = load(f"{A}/dante-lanterna.png", D)
frames = []
for b in (1.0, 0.82, 1.0, 0.9, 1.08, 0.95):
    frames.append(ImageEnhance.Brightness(lan).enhance(b))
gif("anim-dante-lanterna", frames, 120)
