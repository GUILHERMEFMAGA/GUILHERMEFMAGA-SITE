#!/usr/bin/env python3
"""Prepara assets redimensionados pro motor (sprites2/)."""
import os
from PIL import Image

A = "assets"
O = "jogo/sprites2"
os.makedirs(O, exist_ok=True)


def save(src, out, h=None, w=None):
    im = Image.open(f"{A}/{src}").convert("RGBA")
    if h:
        w = int(im.width * h / im.height)
    elif w:
        h = int(im.height * w / im.width)
    im = im.resize((w, h), Image.LANCZOS)
    im.save(f"{O}/{out}")
    print(out, im.size)


# Dante (canvas 220x470)
for src, out in [("dante-andar-a.png", "d-walkA.png"), ("dante-andar-b.png", "d-walkB.png"),
                 ("dante-correr.png", "d-runA.png"), ("dante-correr-b.png", "d-runB.png"),
                 ("dante-apontando.png", "d-aim.png"), ("dante-atirando.png", "d-fire.png"),
                 ("dante-recarregando.png", "d-reload.png"), ("dante-ferido.png", "d-hurt.png"),
                 ("dante-agachado.png", "d-crouch.png"), ("dante-pulo.png", "d-jump.png")]:
    im = Image.open(f"{A}/{src}").convert("RGBA").resize((220, 470), Image.LANCZOS)
    im.save(f"{O}/{out}"); print(out, im.size)

# Luca (canvas 208x470)
for src, out in [("luca-andar-a.png", "l-walkA.png"), ("luca-andar-b.png", "l-walkB.png"),
                 ("luca-correr.png", "l-runA.png"), ("luca-correr-b.png", "l-runB.png"),
                 ("luca-preparando.png", "l-prep.png"), ("luca-esfaqueando.png", "l-thrust.png"),
                 ("luca-ferido.png", "l-hurt.png"), ("luca-agachado.png", "l-crouch.png"),
                 ("luca-pulo.png", "l-jump.png")]:
    im = Image.open(f"{A}/{src}").convert("RGBA").resize((208, 470), Image.LANCZOS)
    im.save(f"{O}/{out}"); print(out, im.size)

# Inimigos
save("inimigo-espectro.png", "e-espectro.png", h=300)
save("espectro-ataque.png", "e-espectro-atk.png", h=300)
save("inimigo-cao-sombrio.png", "e-cao.png", h=240)
save("cao-sombrio-b.png", "e-cao-b.png", h=240)
save("inimigo-vulto.png", "e-vulto.png", h=430)
save("vulto-ataque.png", "e-vulto-atk.png", h=430)

# Malphas
save("malphas-idle.png", "m-idle.png", h=620)
save("malphas-ataque.png", "m-atk.png", h=620)
save("malphas-derrota.png", "m-def.png", h=620)

# Itens
save("item-sal.png", "i-sal.png", h=56)
save("item-diario.png", "i-diario.png", h=56)

# Retratos p/ dialogos
for c, tag in [("dante", "d"), ("luca", "l")]:
    for e in ["neutro", "raiva", "dor", "sorriso"]:
        save(f"retrato-{c}-{e}.png", f"p-{tag}-{e}.png", h=170)

# Cenarios
save("impala-lateral.png", "bg-impala.png", w=1536)
save("cenario-quarto-motel.png", "bg-quarto.png", w=1536)
save("cenario-floresta-noite.png", "bg-floresta.png", w=1536)
print("sprites2 pronto:", len(os.listdir(O)), "arquivos")
