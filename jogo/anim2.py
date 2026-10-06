#!/usr/bin/env python3
"""Animacoes frame-a-frame do Luca a partir do proprio sprite:
parado (respirando), andando e esfaqueada (arco da lamina) -> sheet PNG + GIFs."""
import os
from PIL import Image, ImageDraw

SPR = "jogo/sprites"
OUT = "assets"
os.makedirs(OUT, exist_ok=True)

d = Image.open(f"{SPR}/luca.png").convert("RGBA")
W, H = d.size
BG = (18, 14, 22, 255)


def xf(dx=0, dy=0, rot=0.0, slash=False):
    c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s = d if not rot else d.rotate(rot, resample=Image.BICUBIC, center=(W / 2, H))
    c.alpha_composite(s, (dx, dy))
    if slash:
        dr = ImageDraw.Draw(c)
        fx, fy = 150 + dx, 340 + dy
        # arco de golpe branco-azulado da lamina
        dr.arc([fx - 46, fy - 70, fx + 46, fy + 42], start=-35, end=70,
               fill=(160, 210, 255, 230), width=7)
        dr.arc([fx - 34, fy - 56, fx + 34, fy + 30], start=-30, end=65,
               fill=(240, 250, 255, 255), width=4)
    return c


IDLE  = [xf(), xf(dy=2)]
WALK  = [xf(), xf(dy=3, rot=1.2), xf(dy=1), xf(dy=3, rot=-1.2)]
STAB  = [xf(rot=-3), xf(rot=-6, dx=6, slash=True), xf(rot=-2)]

all_frames = IDLE + WALK + STAB
sheet = Image.new("RGBA", (W * len(all_frames), H), (0, 0, 0, 0))
for i, f in enumerate(all_frames):
    sheet.alpha_composite(f, (i * W, 0))
sheet.save(f"{OUT}/luca-anim-sheet.png")
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


gif("anim-luca-parado", IDLE, 420)
gif("anim-luca-andar", WALK, 140)
gif("anim-luca-esfaqueada", STAB, 130)
