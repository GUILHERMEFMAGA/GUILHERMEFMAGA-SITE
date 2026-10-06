#!/usr/bin/env python3
"""Animacao de ataque do Luca: idle -> prepara -> estocada -> avancada -> prepara -> idle."""
from PIL import Image

W, H = 208, 470
BG = (18, 14, 22, 255)

idle = Image.open("jogo/sprites/luca.png").convert("RGBA")
prep = Image.open("assets/luca-preparando.png").convert("RGBA").resize((W, H), Image.LANCZOS)
thrust = Image.open("assets/luca-esfaqueando.png").convert("RGBA").resize((W, H), Image.LANCZOS)

# avancada: estocada deslocada pra frente com leve rotacao
adv = Image.new("RGBA", (W, H), (0, 0, 0, 0))
adv.alpha_composite(thrust.rotate(-2, resample=Image.BICUBIC, center=(W / 2, H)), (7, 0))

FRAMES = [idle, prep, thrust, adv, prep, idle]
DURS = [220, 130, 90, 120, 130, 220]

sheet = Image.new("RGBA", (W * len(FRAMES), H), (0, 0, 0, 0))
for i, f in enumerate(FRAMES):
    sheet.alpha_composite(f, (i * W, 0))
sheet.save("assets/luca-ataque-sheet.png")
print("sheet:", sheet.size, "| quadros:", len(FRAMES))

rgb = []
for f in FRAMES:
    bg = Image.new("RGBA", (W, H), BG)
    bg.alpha_composite(f)
    rgb.append(bg.convert("RGB"))
rgb[0].save("assets/anim-luca-ataque.gif", save_all=True,
            append_images=rgb[1:], duration=DURS, loop=0)
print("gif: anim-luca-ataque", len(FRAMES), "quadros")
