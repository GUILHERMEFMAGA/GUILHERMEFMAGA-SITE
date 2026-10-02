#!/usr/bin/env python3
# Monta jogo/world.js a partir do original (world_original.js.txt) + as peças novas em pieces/.
# Rode:  python3 jogo/dev/splice.py
import os
D = os.path.dirname(os.path.abspath(__file__))
src = open(D + '/world_original.js.txt', encoding='utf-8').read()
P = lambda n: open(D + '/pieces/' + n, encoding='utf-8').read()

def sub(s, old, new):
    n = s.count(old)
    assert n == 1, 'ancora (%d vezes): %s' % (n, old[:80])
    return s.replace(old, new, 1)

def between(s, a, b, new):
    i = s.index(a); j = s.index(b, i)
    return s[:i] + new + s[j:]

s = src
# 1) constantes do mapa novo
s = between(s, '  // ---------- Medidas do mapa ----------\n', '  const tiles = new Uint8Array', P('p1_const.js') + '\n')
# 2) prédio: andares
s = sub(s, "const b = { x, y, w, h, p, ridge: w >= h ? 'h' : 'v', det: [] };", "const b = { x, y, w, h, p, ridge: w >= h ? 'h' : 'v', det: [], andares: 1 };")
# 3) geração do mapa (cidades, vilas, florestas, fazendas...)
s = between(s, '  // ---------- Montagem do mapa ----------\n', '  // prédios da borda do mapa\n', P('p2_gen.js'))
# 4) postes só nas cidades
s = sub(s, "for (let j = 0; j <= ROWS; j++) {\n    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {", "for (let j = 0; j <= ROWS; j++) {\n    if (!urbano(i, j)) continue;\n    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {")
# 5) objetos de calçada só onde há calçada
s = sub(s, "  const propList = [];\n  blocks.forEach(blk => { if (blk.kind !== 'river') blockProps(blk).forEach(p => propList.push(p)); });",
        "  const SEM_PROPS = { river: 1, floresta: 1, campo: 1, fazenda: 1, bosque: 1, porto: 1 };   // quadras sem calçada\n  const propList = [];\n  blocks.forEach(blk => { if (!SEM_PROPS[blk.kind]) blockProps(blk).forEach(p => propList.push(p)); });")
s = sub(s, "const n = 3 + Math.floor(r() * 3);", "const n = Math.max(2, Math.round((3 + Math.floor(r() * 3)) * len / 384));")
# 6) altura da fachada pelo número de andares
FACH = '''  function fachada(b) {
    if (b.casa3) return AR.fachadaAltura(b.casa3.partes.find(p => p.t === 'corpo'));
    if (b.celeiro || b.estabulo) return 32;
    if (b.galpao) return 40;
    let fh = AR.ANDAR_TERREO + AR.ANDAR * (Math.max(1, b.andares || 1) - 1);
    if (b.hotel) fh += 18;
    if (b.mercado) fh = 60;
    return Math.min(fh, b.h - 24);
  }
'''
i = s.index('  function fachada(b) {'); j = s.index('\n', i) + 1
s = s[:i] + FACH + s[j:]
# 7) fachada vem do arte.js
s = between(s, '  function drawFacade(ctx, b, fh) {', '  // telhados especiais: hotel', "  // fachada (parede da frente): janelas de verdade, vitrine, sacadas e porta vêm do arte.js\n  function drawFacade(ctx, b, fh) { AR.fachadaPredio(ctx, b, fh); }\n\n")
# 8) telhados de telha vêm do arte.js
s = sub(s, "    const fh = fachada(b); drawFacade(ctx, b, fh);\n    const { x, y, w, p } = b, h = b.h - fh;\n",
"""    const fh = fachada(b); drawFacade(ctx, b, fh);
    const { x, y, w, p } = b, h = b.h - fh;
    if (p.kind === 'tile' && !b.hotel && !b.mercado) {
      // telhado de telha de verdade (duas ou quatro águas) e chaminé
      const rs0 = mulberry32(Math.floor(x * 7 + y * 13)), tipo = rs0() < 0.5 && Math.min(w, h) > 60 ? 'quatro' : 'duas';
      AR.telhado(ctx, x, y, w, h, tipo, b.ridge, { base: p.base, claro: p.edge, escuro: p.dark }, Math.floor(x * 3 + y * 5));
      b.det.forEach(d => { const dx = x + 12 + d.fx * (w - 40), dy = y + 12 + d.fy * (h - 40); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(dx + 3, dy + 3, 14, 14); ctx.fillStyle = '#8a4a3a'; ctx.fillRect(dx, dy, 12, 12); ctx.fillStyle = '#2a1a1a'; ctx.fillRect(dx + 3, dy + 3, 6, 6); });
      return;
    }
""")
# 9) chão das quadras (novo)
old_bg = s[s.index('  function drawBlockGround(ctx, blk) {'):s.index('  function drawTree(ctx, t) {')]
rio = old_bg[old_bg.index("    if (kind === 'river') {\n"):old_bg.index("      return;\n    }\n", old_bg.index("    if (kind === 'river') {\n")) + len("      return;\n    }\n")]
rio = rio.replace('k < 40;', 'k < 70;').replace('k < 16;', 'k < 28;').replace('k < 7;', 'k < 12;').replace('k < 26;', 'k < 44;')
anel = old_bg[old_bg.index('    // calçada com cantos arredondados\n'):old_bg.index("    if (kind === 'city' || kind === 'hotel') {")]
anel = anel.replace('Math.floor(r() * 12) * T + 1, y + Math.floor(r() * 12) * T + 1', 'Math.floor(r() * BLOCK) * T + 1, y + Math.floor(r() * BLOCK) * T + 1').replace('k < 40;', 'k < 110;').replace('k < 26;', 'k < 70;')
g = P('p3_ground.js').replace('/*RIO*/\n', rio).replace('/*ANEL*/\n', anel)
s = s.replace(old_bg, g)
# 10) árvores: as da mata têm desenho próprio
s = sub(s, '  function drawTree(ctx, t) {', '  function drawTree(ctx, t) { if (t.mata) G.rural.drawTree(ctx, t); else drawTreeCity(ctx, t); }\n  function drawTreeCity(ctx, t) {')
# 11) desenho do mapa em pedaços
s = between(s, '  function drawStatic(ctx, x0, y0, x1, y1) {', '  // ---------- Chunks (o cenário pré-desenhado) ----------', P('p4_static.js') + '\n')
# 12) minimapa
s = between(s, '  // mapa pequeno (minimapa): pintado direto dos tiles, bem rápido\n  function makeMini(scale) {', '  // pontos de sidewalk para missões e lugares', P('p5_mini.js') + '\n')
# 13) pontos de calçada para missões
s = sub(s, "    if (b.kind === 'river') return;\n    ['top', 'bottom', 'left', 'right'].forEach(s =>", "    if (SEM_PROPS[b.kind]) return;\n    ['top', 'bottom', 'left', 'right'].forEach(s =>")
# 14) exportações
s = sub(s, "    chunkCount: NCX * NCY,\n  };", "    chunkCount: NCX * NCY,\n    RODOVIA, MEGAS, trilhas, urbano, viaH, viaV, regiaoDe, PUB_DIMS, naTrilha, megaDe,\n  };\n  if (G.rural) G.rural.trilhas = trilhas;")
open(D + '/v2/world.js', 'w', encoding='utf-8').write(s)
print('world.js:', s.count('\n'), 'linhas')
