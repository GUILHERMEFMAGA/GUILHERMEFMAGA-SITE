# anim14: chroma-key + escala POR ALTURA (470px = tamanho canonico dos personagens)
import os
from PIL import Image

A = os.path.join(os.path.dirname(__file__), "..", "assets")
S2 = os.path.join(os.path.dirname(__file__), "sprites2")

def chroma_cut(path):
    im = Image.open(path).convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if g > 90 and g - r > 30 and g - b > 30:
                px[x, y] = (r, g, b, 0)
            elif g - r > 12 and g - b > 12:
                px[x, y] = (r, g, b, 110)
    bbox = im.getbbox()
    return im.crop(bbox) if bbox else im

def scale_h(im, H=470):
    w, h = im.size
    s = H / h
    return im.resize((max(1, round(w * s)), H), Image.LANCZOS)

def place(im, cw):
    # canvas largura cw (>= base), peh na borda inferior, centro x
    w, h = im.size
    canvas = Image.new("RGBA", (max(cw, w), 470), (0, 0, 0, 0))
    canvas.paste(im, ((canvas.width - w) // 2, 470 - h), im)
    return canvas

jobs = [("dante", 220), ("luca", 208)]
for ch, cw in jobs:
    for i in range(1, 5):
        im = place(scale_h(chroma_cut(os.path.join(A, f"run2-{ch}-{i}.png"))), cw)
        out = os.path.join(S2, f"{'d' if ch=='dante' else 'l'}-run{'ABCD'[i-1]}.png")
        im.save(out)
        print(os.path.basename(out), im.size)
    w = chroma_cut(os.path.join(A, f"walk2-{ch}.png"))
    wa = place(scale_h(w), cw)
    wa.save(os.path.join(S2, f"{'d' if ch=='dante' else 'l'}-walkA.png"))
    # fase B derivada da propria pose nova (consistencia): pernas deslocadas
    bw, bh = wa.size
    cut = int(bh * 0.58)
    canvas = Image.new("RGBA", (bw + 24, bh + 12), (0, 0, 0, 0))
    top = wa.crop((0, 0, bw, cut)); bot = wa.crop((0, cut, bw, bh))
    canvas.paste(top, (12 - 3, 6 - 2), top)
    canvas.paste(bot, (12 + 6, 6 - 2), bot)
    bb = canvas.getbbox()
    wb = canvas.crop(bb).resize((bw, bh), Image.LANCZOS)
    wb.save(os.path.join(S2, f"{'d' if ch=='dante' else 'l'}-walkB.png"))
    print(f"{ch} walkA/walkB ok")
print("DONE")
