# anim15: assets da NOITE 2 -> sprites2 (cenarios redimensionados, sprites chroma-cut)
import os
from PIL import Image
A = os.path.join(os.path.dirname(__file__), "..", "assets")
S2 = os.path.join(os.path.dirname(__file__), "sprites2")

for bg in ("bg-cidade", "bg-porta"):
    im = Image.open(os.path.join(A, bg + ".png")).convert("RGB")
    im.resize((1536, 1024), Image.LANCZOS).save(os.path.join(S2, bg + ".png"))
    print(bg, "-> 1536x1024")

def chroma_cut(path):
    im = Image.open(path).convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if g > 90 and g - r > 30 and g - b > 30: px[x, y] = (r, g, b, 0)
            elif g - r > 12 and g - b > 12: px[x, y] = (r, g, b, 110)
    bb = im.getbbox()
    return im.crop(bb) if bb else im

b = chroma_cut(os.path.join(A, "boss2-idle.png"))
b.save(os.path.join(S2, "boss2-idle.png")); print("boss2", b.size)
n = chroma_cut(os.path.join(A, "e-neon.png"))
n.save(os.path.join(S2, "e-neon.png")); print("e-neon", n.size)
print("DONE")
