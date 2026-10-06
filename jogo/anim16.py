# anim16: poses v2 chroma-key -> sprites2 (altura canonica 470)
import os
from PIL import Image
A = os.path.join(os.path.dirname(__file__), "..", "assets")
S2 = os.path.join(os.path.dirname(__file__), "sprites2")

def chroma_cut(path):
    im = Image.open(path).convert("RGBA")
    px = im.load(); w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if g > 90 and g - r > 30 and g - b > 30: px[x, y] = (r, g, b, 0)
            elif g - r > 12 and g - b > 12: px[x, y] = (r, g, b, 110)
    bb = im.getbbox()
    return im.crop(bb) if bb else im

def place(im, cw):
    w, h = im.size
    s = 470 / h
    im = im.resize((max(1, round(w * s)), 470), Image.LANCZOS)
    w, h = im.size
    canvas = Image.new("RGBA", (max(cw, w), 470), (0, 0, 0, 0))
    canvas.paste(im, ((canvas.width - w) // 2, 0), im)
    return canvas

jobs = [
    ("pose2-d-aim", "d-aim", 220), ("pose2-d-fire", "d-fire", 220),
    ("pose2-d-reload", "d-reload", 220), ("pose2-d-crouch", "d-crouch", 220),
    ("pose2-d-jump", "d-jump", 220), ("pose2-d-hurt", "d-hurt", 220),
    ("pose2-l-prep", "l-prep", 208), ("pose2-l-thrust", "l-thrust", 208),
    ("pose2-l-crouch", "l-crouch", 208), ("pose2-l-jump", "l-jump", 208),
]
for srcn, outn, cw in jobs:
    im = place(chroma_cut(os.path.join(A, srcn + ".png")), cw)
    im.save(os.path.join(S2, outn + ".png"))
    print(outn, im.size)
print("DONE")
