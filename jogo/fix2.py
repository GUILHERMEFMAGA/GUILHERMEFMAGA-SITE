# fix2: normaliza TODO o elenco — base sem fundo, canon real, rim uniforme
import os
from PIL import Image
SP = os.path.join(os.path.dirname(__file__), "sprites")
S2 = os.path.join(os.path.dirname(__file__), "sprites2")

def rim_mask(px, w, h):
    # vermelho de contorno: criterio vermelho + vizinho transparente (contorno, nao camisa)
    def trans(x, y):
        if 0 <= x < w and 0 <= y < h:
            return px[x, y][3] < 60
        return True
    out = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 100 and r > 90 and r - max(g, b) > 40:
                if any(trans(x + dx, y + dy) for dx in (-2, -1, 0, 1, 2) for dy in (-2, 0, 2)):
                    out[y * w + x] = 1
    return out

def cut_base(path):
    im = Image.open(path).convert("RGBA")
    w, h = im.size; px = im.load()
    from collections import deque
    # 1) halo branco da borda = fundo
    bg = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if min(r, g, b) > 185 and abs(r - g) < 25 and abs(g - b) < 25:
                bg[y * w + x] = 1
    # 2) flood das bordas atraves de roxo/escuro, parando no rim vermelho
    q = deque()
    seen = bytearray(w * h)
    for x in range(w): q.append((x, 0)); q.append((x, h - 1))
    for y in range(h): q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft(); i = y * w + x
        if seen[i]: continue
        seen[i] = 1
        r, g, b, a = px[x, y]
        is_rim = r > 90 and r - max(g, b) > 40
        if is_rim: continue
        bg[i] = 1
        for nx, ny in ((x+1, y), (x-1, y), (x, y+1), (x, y-1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
                q.append((nx, ny))
    for y in range(h):
        for x in range(w):
            if bg[y * w + x]:
                r, g, b, a = px[x, y]; px[x, y] = (r, g, b, 0)
    bb = im.getbbox()
    return im.crop(bb) if bb else im

canon = {}
for ch, pref in (("dante", "d-"), ("luca", "l-")):
    p = os.path.join(SP, ch + ".png")
    base = cut_base(p)
    base.save(p)
    canon[pref] = base.size[1]
    print(f"base {ch} cortada: {base.size}")

# rescala todo o elenco p/ canon real + dim do rim de contorno
for f in sorted(os.listdir(S2)):
    if not (f.startswith("d-") or f.startswith("l-")) or not f.endswith(".png"): continue
    pref = f[:2]
    p = os.path.join(S2, f)
    im = Image.open(p).convert("RGBA")
    bb = im.getbbox()
    if not bb: continue
    im = im.crop(bb)
    w, h = im.size
    alvo = canon[pref + "-"] if (pref + "-") in canon else canon.get(pref, h)
    if abs(h - alvo) > 2:
        s = alvo / h
        im = im.resize((max(1, round(w * s)), alvo), Image.LANCZOS)
    w, h = im.size
    px = im.load()
    rm = rim_mask(px, w, h)
    for y in range(h):
        for x in range(w):
            if rm[y * w + x]:
                r, g, b, a = px[x, y]
                px[x, y] = (min(r, max(g, b) + 48), g, b, a)   # dim: rim suave como a base
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    canvas.paste(im, (0, 0), im)
    canvas.save(p)
print("canon:", canon)
print("DONE")
