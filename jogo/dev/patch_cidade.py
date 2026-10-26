f = 'v2/cidade.js'; s = open(f, encoding='utf-8').read()
def sub(old, new, cnt=1):
    global s
    assert s.count(old) == cnt, ('ancora', s.count(old), old[:80])
    s = s.replace(old, new)
# 1) região interior pela tabela do mundo
sub("const interior = l.bx >= 17 && l.bx <= 22;", "const interior = W.regiaoDe(l.bx).id === 'interior';")
# 2) casa de verdade nos lotes
old = s[s.index("    l.b = W.mkBuilding(l.x, l.y, l.w, l.h, p.roof, rg(p.seed + 7));"):s.index("      l.b.casa = c; l.casa = c; p.nome = 'CASA NOVA ' + (nCasa);")]
new = '''    const est = W.estiloDe(l);
    if (tipo === 'casa') {
      // casa de verdade (várias partes, telhados, janelas e quintal) no lote da obra
      const cs = W.casaNoLote(l, p.seed, est, 1); l.b = cs.b; l.q = cs.q;
    } else {
      l.q = null; l.b = W.mkBuilding(l.x, l.y, l.w, l.h, p.roof, rg(p.seed + 7));
      l.b.andares = df.and; l.b.est = est; l.b.wall = W.sorteiaParede(est, rg(p.seed + 9));
    }
    if (tipo === 'casa') {
      const area = 20 + Math.floor(rg(p.seed + 5)() * 8);
      const c = { id: 'cn' + (nCasa++), tipo: 'casa', nome: 'CASA', b: l.b, x: l.b.x + l.b.w / 2, y: l.b.y + l.b.h + 24, r: 30, seed: p.seed, area, venda: true, preco: Math.round((1200 + area * 26) / 100) * 100, nova: true };
'''
s = s.replace(old, new)
# 3) pontes novas
old = s[s.index("  C.pontes = ["):s.index("  C.pontes.forEach(pt => {")]
new = '''  C.pontes = [
    { rio: 34, j: 2, inicio: -380, dur: 1500, nome: 'PONTE NOVA ERA', fase: -1, pronta: false },
    { rio: 9, j: 7, inicio: 520, dur: 1500, nome: 'PONTE DO PROGRESSO', fase: -1, pronta: false },
    { rio: 59, j: 7, inicio: 900, dur: 1600, nome: 'PONTE DO LITORAL', fase: -1, pronta: false }
  ];
'''
s = s.replace(old, new)
# 4) imagem do prédio pronto (casa + quintal, várias partes)
old = s[s.index("  function fin(l) {"):s.index("  function roofExtra(x, l) {")]
new = '''  function fin(l) {
    if (l.img) return l.img;
    const pad = 44, b = l.b, bb = b.box || b;
    // casa com quintal: a imagem cobre o lote inteiro; prédio comum: só o prédio
    const R = l.q ? { x: l.x - 5, y: l.y - 5, w: l.w + 10, h: l.h + 10 } : { x: bb.x, y: bb.y, w: bb.w, h: bb.h };
    const c = document.createElement('canvas'); c.width = Math.ceil(R.w + pad * 2); c.height = Math.ceil(R.h + pad * 2);
    const x = c.getContext('2d'); x.translate(pad - R.x, pad - R.y);
    if (l.q) W.AR.drawQuintal(x, l.q, W.tex, l.proj.seed);
    // sombra de cada parte do prédio
    x.save(); x.beginPath(); x.rect(R.x - 60, R.y - 60, R.w + 160, R.h + 160); x.clip();
    x.shadowColor = 'rgba(0,0,12,0.55)'; x.shadowBlur = 16; x.shadowOffsetX = 16; x.shadowOffsetY = 18; x.fillStyle = '#000';
    (b.rects || [b]).forEach(r => x.fillRect(r.x + 4, r.y + 4, r.w - 4, r.h - 4)); x.restore();
    W.drawRoof(x, b);
    roofExtra(x, l);
    l.img = c; l.imgX = R.x - pad; l.imgY = R.y - pad; return c;
  }
'''
s = s.replace(old, new)
# 5) os 3 desenhos da imagem
sub("ctx.globalAlpha = a; ctx.drawImage(fin(l), l.b.x - l.imgPad, l.b.y - l.imgPad); ctx.globalAlpha = 1;", "ctx.globalAlpha = a; ctx.drawImage(fin(l), l.imgX, l.imgY); ctx.globalAlpha = 1;")
sub("      ctx.drawImage(fin(l), l.b.x - l.imgPad, l.b.y - l.imgPad);\n      ctx.fillStyle = '#c8c8d0';", "      ctx.drawImage(fin(l), l.imgX, l.imgY);\n      ctx.fillStyle = '#c8c8d0';")
sub("if (e.f === 5) { ctx.drawImage(fin(l), l.b.x - l.imgPad, l.b.y - l.imgPad); return; }", "if (e.f === 5) { ctx.drawImage(fin(l), l.imgX, l.imgY); return; }")
# 6) placa de obra maior (o mundo agora é gigante)
old = s[s.index("  function placa(ctx, l, e) {"):s.index("  function andaime(ctx, r, alt, a) {")]
new = '''  function placa(ctx, l, e) {
    const w = 132, h = 32, x = l.cx - w / 2, y = l.y + l.h - 4;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 3, y + 4, w, h);
    ctx.fillStyle = '#4a321a'; ctx.fillRect(x + 10, y + h, 4, 8); ctx.fillRect(x + w - 14, y + h, 4, 8);
    ctx.fillStyle = e.f < 0 ? '#c9a21a' : '#1f7a3a'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; let nm = (e.f < 0 ? 'EM BREVE: ' : '') + (l.proj.nome || ''), fs = 10; ctx.font = 'bold 10px Arial'; while (fs > 5 && ctx.measureText(nm).width > w - 8) { fs -= 0.5; ctx.font = 'bold ' + fs + 'px Arial'; }
    ctx.fillText(nm, x + w / 2, y + 13);
    ctx.font = 'bold 8px Arial'; ctx.fillStyle = '#ffe9a0'; ctx.fillText(e.f < 0 ? 'AGUARDANDO LICENÇA' : FASES[e.f] + ' ' + Math.round(e.p * 100) + '%', x + w / 2, y + 22.5);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x + 8, y + 25, w - 16, 4); ctx.fillStyle = '#7dff8a'; ctx.fillRect(x + 8, y + 25, (w - 16) * e.g, 4);
    ctx.textAlign = 'left';
  }
'''
s = s.replace(old, new)
# 7) a imagem de lotes longe do jogador é liberada (memória): as casas agora são grandes
sub("    W.lotes.forEach(l => {\n      const e = estadoDe(l, C.t), ant = l.fase; l.est = e; l.fase = e.f;", "    const ref = S.player.car || S.player;\n    W.lotes.forEach(l => {\n      if (l.img && Math.hypot(l.cx - ref.x, l.cy - ref.y) > 3600) l.img = null;   // solta a imagem pesada de lotes longe\n      const e = estadoDe(l, C.t), ant = l.fase; l.est = e; l.fase = e.f;")
open(f, 'w', encoding='utf-8').write(s); print('cidade.js ok')
