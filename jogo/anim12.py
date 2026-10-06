# anim12: recorta o fundo dos sprites de pose (flood-fill das bordas,
# parando no rim vermelho / pixels brilhantes do personagem) e reporta stats.
import os
from PIL import Image
from collections import deque

D = os.path.join(os.path.dirname(__file__), "sprites2")
ALVOS = [f for f in sorted(os.listdir(D)) if f.endswith(".png")
         and f[:2] in ("d-", "l-", "e-", "m-", "i-")]

def is_stop(r, g, b):
    # rim vermelho do personagem
    if r > 90 and r - max(g, b) > 40: return True
    # pixels brilhantes (pele, fantasma claro, lamina)
    if (r + g + b) > 430: return True
    return False

def cut(path):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            q.append((x, y))
    while q:
        x, y = q.popleft()
        i = y * w + x
        if seen[i]: continue
        seen[i] = 1
        r, g, b, a = px[x, y]
        if is_stop(r, g, b): continue      # borda do personagem: nao entra
        for nx, ny in ((x+1, y), (x-1, y), (x, y+1), (x, y-1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
                q.append((nx, ny))
    # o que nao foi alcancado = personagem; limpa ilhas minusculas de "fundo preso"
    char = bytearray(1 if not seen[i] else 0 for i in range(w * h))
    # passa 2: ilhas de char < 40 px viram fundo
    comp = {}
    for i in range(w * h):
        if char[i] and i not in comp:
            stack = [i]; members = []
            comp_ids = len(comp)
            while stack:
                j = stack.pop()
                if comp.get(j) is not None or not char[j]: continue
                comp[j] = comp_ids
                members.append(j)
                x, y = j % w, j // w
                for nx, ny in ((x+1, y), (x-1, y), (x, y+1), (x, y-1)):
                    nj = ny * w + nx
                    if 0 <= nx < w and 0 <= ny < h and char[nj] and comp.get(nj) is None:
                        stack.append(nj)
            if len(members) < 40:
                for j in members: char[j] = 0
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    nchar = 0
    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if char[y * w + x]:
                op[x, y] = px[x, y]
                nchar += 1
                if x < minx: minx = x
                if x > maxx: maxx = x
                if y < miny: miny = y
                if y > maxy: maxy = y
    cov = 100.0 * nchar / (w * h)
    if maxx < 0: return None, 0
    crop = out.crop((minx, miny, maxx + 1, maxy + 1))
    return crop, cov

for f in ALVOS:
    p = os.path.join(D, f)
    crop, cov = cut(p)
    if crop is None:
        print(f"{f:24s} FALHOU (nada recortado)")
        continue
    if cov < 2 or cov > 85:
        print(f"{f:24s} SUSPEITO cov={cov:.1f}% — mantido original")
        continue
    bak = p + ".bak"
    if not os.path.exists(bak): os.rename(p, bak)
    else: os.remove(p)
    crop.save(p)
    print(f"{f:24s} ok cov={cov:.1f}% -> {crop.size}")
print("DONE")
