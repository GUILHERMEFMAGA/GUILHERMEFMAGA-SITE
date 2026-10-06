#!/usr/bin/env python3
"""Gera animacoes frame-a-frame do Dante a partir do proprio sprite:
parado (respirando), andando e atirando -> sprite sheet PNG + GIFs."""
import os
from PIL import Image, ImageDraw

SPR = "jogo/sprites"
OUT = "assets"
os.makedirs(OUT, exist_ok=True)

d = Image.open(f"{SPR}/dante.png").convert("RGBA")
W, H = d.size
BG = (18, 14, 22, 255)


def xf(dx=0, dy=0, rot=0.0, flash=False):
    c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s = d if not rot else d.rotate(rot, resample=Image.BICUBIC, center=(W / 2, H))
    c.alpha_composite(s, (dx, dy))
    if flash:
        dr = ImageDraw.Draw(c)
        fx, fy = 204 + dx, 344 + dy
        dr.polygon([
            (fx + 24, fy + 2), (fx + 7, fy + 5), (fx + 12, fy + 16),
            (fx + 3, fy + 7), (fx - 4, fy + 18), (fx - 3, fy + 5),
            (fx - 16, fy + 4), (fx - 4, fy - 1), (fx - 8, fy - 14),
            (fx + 1, fy - 5), (fx + 9, fy - 16), (fx + 5, fy - 3),
        ], fill=(255, 214, 110, 255))
        dr.ellipse([fx - 7, fy - 7, fx + 7, fy + 7], fill=(255, 250, 220, 255))
    return c


IDLE  = [xf(), xf(dy=2)]
WALK  = [xf(), xf(dy=3, rot=1.2), xf(dy=1), xf(dy=3, rot=-1.2)]
SHOOT = [xf(rot=-2), xf(rot=3, dx=-6, flash=True), xf(rot=-1)]

# sprite sheet pra engine (9 quadros: 2 idle + 4 andar + 3 tiro)
all_frames = IDLE + WALK + SHOOT
sheet = Image.new("RGBA", (W * len(all_frames), H), (0, 0, 0, 0))
for i, f in enumerate(all_frames):
    sheet.alpha_composite(f, (i * W, 0))
sheet.save(f"{OUT}/dante-anim-sheet.png")
print("sheet:", sheet.size, "| quadros:", len(all_frames))


def gif(name, frames, ms):
    rgb = []
    for f in frames:
        bg = Image.new("RGBA", (W, H), BG)
        bg.alpha_composite(f)
        rgb.append(bg.convert("RGB"))
    rgb[0].save(f"{OUT}/{name}.gif", save_all=True, append_images=rgb[1:],
                duration=ms, loop=0)
    print("gif:", name, len(frames), "quadros")


gif("anim-dante-parado", IDLE, 420)
gif("anim-dante-andar", WALK, 140)
gif("anim-dante-tiro", SHOOT, 130)
