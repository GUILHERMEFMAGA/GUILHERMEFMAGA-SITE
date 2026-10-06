#!/usr/bin/env python3
"""Animacoes de expressao do Luca: loop neutro <-> expressao (crossfade) em GIF."""
from PIL import Image

A = "assets"
BG = (18, 14, 22, 255)

n = Image.open(f"{A}/retrato-luca-neutro.png").convert("RGBA")
EXPR = {"raiva": "retrato-luca-raiva.png",
        "dor": "retrato-luca-dor.png",
        "sorriso": "retrato-luca-sorriso.png"}

faces = {"neutro": n}
for k, f in EXPR.items():
    e = Image.open(f"{A}/{f}").convert("RGBA")
    if e.size != n.size:
        e = e.resize(n.size, Image.LANCZOS)
    faces[k] = e

th = 512
cols = []
for k in ["neutro", "raiva", "dor", "sorriso"]:
    im = faces[k].copy()
    im.thumbnail((th, th), Image.LANCZOS)
    cols.append(im)
w = sum(c.width for c in cols) + 10 * 5
h = max(c.height for c in cols) + 20
sheet = Image.new("RGBA", (w, h), (30, 30, 30, 255))
x = 10
for c in cols:
    sheet.alpha_composite(c, (x, 10))
    x += c.width + 10
sheet.save(f"{A}/expressoes-luca-sheet.png")
print("sheet expressoes luca:", sheet.size)


def gif(name, frames, ms):
    rgb = []
    for f in frames:
        bg = Image.new("RGBA", n.size, BG)
        bg.alpha_composite(f)
        rgb.append(bg.convert("RGB"))
    rgb[0].save(f"{A}/{name}.gif", save_all=True, append_images=rgb[1:],
                duration=ms, loop=0)
    print("gif:", name, len(frames), "quadros")


for k in EXPR:
    half = Image.blend(n, faces[k], 0.5)
    gif(f"anim-expressao-luca-{k}", [n, half, faces[k], half], 200)
