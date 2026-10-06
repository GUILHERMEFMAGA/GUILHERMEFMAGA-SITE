#!/usr/bin/env python3
"""Animacao melhorada de apontar e atirar do Dante:
idle -> aponta -> atira (flash) -> recuo -> aponta -> idle."""
from PIL import Image

W, H = 220, 470
BG = (18, 14, 22, 255)

idle = Image.open("jogo/sprites/dante.png").convert("RGBA")
aim = Image.open("assets/dante-apontando.png").convert("RGBA").resize((W, H), Image.LANCZOS)
fire = Image.open("assets/dante-atirando.png").convert("RGBA").resize((W, H), Image.LANCZOS)

# recuo: rotacao leve + deslocamento pra tras, sem apagar nada (flash ja esta na pose)
recoil = Image.new("RGBA", (W, H), (0, 0, 0, 0))
recoil.alpha_composite(fire.rotate(2.5, resample=Image.BICUBIC, center=(W / 2, H)), (-5, 1))

FRAMES = [idle, aim, fire, recoil, aim, idle]
DURS = [220, 130, 90, 120, 130, 220]

sheet = Image.new("RGBA", (W * len(FRAMES), H), (0, 0, 0, 0))
for i, f in enumerate(FRAMES):
    sheet.alpha_composite(f, (i * W, 0))
sheet.save("assets/dante-tiro-sheet.png")
print("sheet:", sheet.size, "| quadros:", len(FRAMES))

rgb = []
for f in FRAMES:
    bg = Image.new("RGBA", (W, H), BG)
    bg.alpha_composite(f)
    rgb.append(bg.convert("RGB"))
rgb[0].save("assets/anim-dante-apontar-atirar.gif", save_all=True,
            append_images=rgb[1:], duration=DURS, loop=0)
print("gif: anim-dante-apontar-atirar", len(FRAMES), "quadros")
