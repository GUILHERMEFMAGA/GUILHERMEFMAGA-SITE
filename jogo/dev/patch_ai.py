import re, sys
f = 'v2/ai.js'; s = open(f, encoding='utf-8').read()
def sub(old, new):
    global s
    assert s.count(old) == 1, ('ancora', s.count(old), old[:70])
    s = s.replace(old, new, 1)
# luzes só nas cidades
sub("      const cx = W.nodeX(i), cy = W.nodeY(j);\n      if (cx < x0 - 200", "      if (!W.urbano(i, j)) continue;\n      const cx = W.nodeX(i), cy = W.nodeY(j);\n      if (cx < x0 - 200")
# ruas apagadas (florestas): o carro nunca entra nelas
sub("  const okH = (i, j, hd) => W.cruzaOk(hd > 0 ? i : i - 1, j);",
    "  const okH = (i, j, hd) => W.cruzaOk(hd > 0 ? i : i - 1, j);\n  // dentro das florestas gigantes as ruas verticais de dentro NÃO existem (W.viaV): esse trecho é barrado\n  const okV = (i, j, vd) => W.viaV(i, vd > 0 ? j : j - 1);")
sub("      if (d > 0 ? j < ROWS : j > 0) opts.push({ k: 's', ni: i, nj: j + d });", "      if ((d > 0 ? j < ROWS : j > 0) && okV(i, j, d)) opts.push({ k: 's', ni: i, nj: j + d });")
sub("[[rv, 'r'], [-rv, 'l']].forEach(([vd, k]) => { if (vd > 0 ? j < ROWS : j > 0) opts.push(", "[[rv, 'r'], [-rv, 'l']].forEach(([vd, k]) => { if ((vd > 0 ? j < ROWS : j > 0) && okV(i, j, vd)) opts.push(")
# semáforo só em cruzamento de cidade
sub("    if (!car.ignoreLights) {\n      const stopAt", "    if (!car.ignoreLights && W.urbano(n.ni, n.nj)) {\n      const stopAt")
# pontos aleatórios: nunca num trecho apagado
sub("      const x = axis === 'v' ? W.laneV(idx, dir) : along, y = axis === 'v' ? along : W.laneH(idx, dir);\n      const dd = Math.hypot(x - cx, y - cy);",
    "      const sg = clamp(Math.floor((along / T - MG - W.ROAD / 2) / PITCH), 0, (axis === 'v' ? ROWS : COLS) - 1);\n      if (axis === 'v' ? !W.viaV(idx, sg) : !W.viaH(idx, sg)) continue;\n      const x = axis === 'v' ? W.laneV(idx, dir) : along, y = axis === 'v' ? along : W.laneH(idx, dir);\n      const dd = Math.hypot(x - cx, y - cy);")
open(f, 'w', encoding='utf-8').write(s); print('ai.js ok')
