# anim13: chroma-key do ciclo de corrida (fundo verde) + caminhada derivada da base transparente
import os
from PIL import Image

A = os.path.join(os.path.dirname(__file__), "..", "assets")
S2 = os.path.join(os.path.dirname(__file__), "sprites2")
SP = os.path.join(os.path.dirname(__file__), "sprites")

def chroma_cut(path):
    im = Image.open(path).convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if g > 90 and g - r > 30 and g - b > 30:
                px[x, y] = (r, g, b, 0)          # verde puro -> transparente
            elif g - r > 12 and g - b > 12:
                px[x, y] = (r, g, b, 110)        # franja verde -> semi
    bbox = im.getbbox()
    im = im.crop(bbox) if bbox else im
    return im

def fit(im, hmax=470, wmax=250):
    w, h = im.size
    s = min(hmax / h, wmax / w)
    return im.resize((max(1, int(w * s)), max(1, int(h * s))), Image.LANCZOS)

for ch, pref, wmax in (("dante", "d-run", 250), ("luca", "l-run", 240)):
    for i in range(1, 5):
        src = os.path.join(A, f"run-{ch}-{i}.png")
        im = fit(chroma_cut(src))
        out = os.path.join(S2, f"{pref}{'ABCD'[i-1]}.png")
        im.save(out)
        print(out.split('/')[-1], im.size)

def derive_walk(base_path, w, h):
    base = Image.open(base_path).convert("RGBA")
    bw, bh = base.size
    cut = int(bh * 0.58)
    frames = []
    for shift, bob in ((6, -3), (-6, 0)):
        canvas = Image.new("RGBA", (bw + 24, bh + 12), (0, 0, 0, 0))
        top = base.crop((0, 0, bw, cut))
        bot = base.crop((0, cut, bw, bh))
        canvas.paste(top, (12 - 3, 6 + bob), top)
        canvas.paste(bot, (12 + shift, 6 + bob), bot)
        bb = canvas.getbbox()
        canvas = canvas.crop(bb) if bb else canvas
        frames.append(canvas.resize((w, h), Image.LANCZOS))
    return frames

for ch, pref, w, h in (("dante", "d-walk", 220, 470), ("luca", "l-walk", 208, 470)):
    fr = derive_walk(os.path.join(SP, ch + ".png"), w, h)
    fr[0].save(os.path.join(S2, pref + "A.png"))
    fr[1].save(os.path.join(S2, pref + "B.png"))
    print(pref, "derivado ok")
print("DONE")
