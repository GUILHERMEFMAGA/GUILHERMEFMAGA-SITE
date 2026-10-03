  // rastros de pneu e faixas das ruas, trecho por trecho (as ruas apagadas da floresta não ganham marcas)
  function drawMarcas(ctx, x0, y0, x1, y1) {
    const R2 = ROAD / 2 * T, ruralV = (i, s) => !urbano(i, s) && !urbano(i, s + 1), ruralH = (j, s) => !urbano(s, j) && !urbano(s + 1, j);
    ctx.save(); ctx.strokeStyle = 'rgba(30,20,60,0.10)'; ctx.lineWidth = 5;
    for (let i = 0; i <= COLS; i++) {
      const xl = roadLeft(i); if (xl + ROAD * T < x0 - 8 || xl > x1 + 8) continue;
      for (let s = 0; s < ROWS; s++) {
        if (!viaV(i, s) || ruralV(i, s)) continue;
        const ya = nodeY(s) - R2, yb = nodeY(s + 1) + R2; if (yb < y0 - 8 || ya > y1 + 8) continue;
        for (const off of [1.4, 2.6, 5.4, 6.6]) { const xx = xl + off * T; ctx.beginPath(); ctx.moveTo(xx, Math.max(ya, y0)); ctx.lineTo(xx, Math.min(yb, y1)); ctx.stroke(); }
      }
    }
    for (let j = 0; j <= ROWS; j++) {
      const yt = roadTop(j); if (yt + ROAD * T < y0 - 8 || yt > y1 + 8) continue;
      for (let s = 0; s < COLS; s++) {
        if (!viaH(j, s) || ruralH(j, s)) continue;
        const xa = nodeX(s) - R2, xb = nodeX(s + 1) + R2; if (xb < x0 - 8 || xa > x1 + 8) continue;
        for (const off of [1.4, 2.6, 5.4, 6.6]) { const yy = yt + off * T; ctx.beginPath(); ctx.moveTo(Math.max(xa, x0), yy); ctx.lineTo(Math.min(xb, x1), yy); ctx.stroke(); }
      }
    }
    ctx.restore();
    drawRoadDetail(ctx, x0, y0, x1, y1);
    const cruzV = (i, j) => viaH(j, i - 1) || viaH(j, i), cruzH = (i, j) => viaV(i, j - 1) || viaV(i, j);   // existe rua cruzando o nó?
    // ruas verticais
    for (let i = 0; i <= COLS; i++) {
      const cx = nodeX(i); if (cx < x0 - 40 || cx > x1 + 40) continue;
      for (let j = 0; j < ROWS; j++) {
        if (!viaV(i, j)) continue;
        if (!ruralV(i, j)) {   // cidade: tracejado amarelo que para antes do cruzamento
          ctx.fillStyle = '#f2c231';
          const ya = nodeY(j) + (ROAD / 2 + 1.4) * T, yb = nodeY(j + 1) - (ROAD / 2 + 1.4) * T;
          for (let yy = ya; yy < yb - 30; yy += 96) if (yy + 56 > y0 && yy < y1) ctx.fillRect(cx - 3, yy, 6, 56);
        } else {               // estrada: linha dupla contínua e bordas brancas
          const ya = cruzH(i, j) ? nodeY(j) + R2 + 20 : nodeY(j) - R2, yb = cruzH(i, j + 1) ? nodeY(j + 1) - R2 - 20 : nodeY(j + 1) + R2;
          if (yb < y0 || ya > y1) continue; const a = Math.max(ya, y0), b = Math.min(yb, y1);
          ctx.fillStyle = '#f2c231'; ctx.fillRect(cx - 5, a, 3, b - a); ctx.fillRect(cx + 2, a, 3, b - a);
          const xl = roadLeft(i); ctx.fillStyle = 'rgba(240,240,240,0.85)'; ctx.fillRect(xl + 14, a, 3, b - a); ctx.fillRect(xl + ROAD * T - 17, a, 3, b - a);
        }
      }
    }
    // ruas horizontais
    for (let j = 0; j <= ROWS; j++) {
      const cy = nodeY(j); if (cy < y0 - 40 || cy > y1 + 40) continue;
      for (let i = 0; i < COLS; i++) {
        if (!viaH(j, i)) continue;
        const xa0 = nodeX(i), xb0 = nodeX(i + 1); if (xb0 < x0 - 100 || xa0 > x1 + 100) continue;
        if (!ruralH(j, i)) {
          ctx.fillStyle = '#f2c231';
          const xa = xa0 + (ROAD / 2 + 1.4) * T, xb = xb0 - (ROAD / 2 + 1.4) * T;
          for (let xx = xa; xx < xb - 30; xx += 96) if (xx + 56 > x0 && xx < x1) ctx.fillRect(xx, cy - 3, 56, 6);
        } else {
          const xa = cruzV(i, j) ? xa0 + R2 + 20 : xa0 - R2, xb = cruzV(i + 1, j) ? xb0 - R2 - 20 : xb0 + R2;
          if (xb < x0 || xa > x1) continue; const a = Math.max(xa, x0), b = Math.min(xb, x1);
          ctx.fillStyle = '#f2c231'; ctx.fillRect(a, cy - 5, b - a, 3); ctx.fillRect(a, cy + 2, b - a, 3);
          const yt = roadTop(j); ctx.fillStyle = 'rgba(240,240,240,0.85)'; ctx.fillRect(a, yt + 14, b - a, 3); ctx.fillRect(a, yt + ROAD * T - 17, b - a, 3);
        }
      }
    }
  }

  function drawStatic(ctx, x0, y0, x1, y1) {
    const hit = (x, y, w, h) => x < x1 && x + w > x0 && y < y1 && y + h > y0;
    // 1) fundo (borda do mapa)
    ctx.fillStyle = ctx.createPattern(tex.rim, 'repeat'); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    // calçada externa
    const ox = (MG - 2) * T, oy = (MG - 2) * T, ow = (INNER_W + 4) * T, oh = (INNER_H + 4) * T;
    if (hit(ox, oy, ow, oh)) {
      rrect(ctx, ox, oy, ow, oh, 60); ctx.fillStyle = '#ece1a2'; ctx.fill();
      ctx.save(); rrect(ctx, ox, oy, ow, oh, 60); ctx.clip();
      ctx.strokeStyle = 'rgba(150,130,70,0.45)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let gx = Math.max(ox, Math.floor(x0 / T) * T); gx <= Math.min(ox + ow, x1); gx += T) { ctx.moveTo(gx + 0.5, Math.max(oy, y0)); ctx.lineTo(gx + 0.5, Math.min(oy + oh, y1)); }
      for (let gy = Math.max(oy, Math.floor(y0 / T) * T); gy <= Math.min(oy + oh, y1); gy += T) { ctx.moveTo(Math.max(ox, x0), gy + 0.5); ctx.lineTo(Math.min(ox + ow, x1), gy + 0.5); }
      ctx.stroke(); ctx.restore();
    }
    // 2) asfalto das ruas
    const rx0 = MG * T, ry0 = MG * T, rh = INNER_H * T, rw = INNER_W * T;
    if (hit(rx0, ry0, rw, rh)) { ctx.fillStyle = ctx.createPattern(tex.asphalt, 'repeat'); ctx.fillRect(Math.max(rx0, x0), Math.max(ry0, y0), Math.min(rx0 + rw, x1) - Math.max(rx0, x0), Math.min(ry0 + rh, y1) - Math.max(ry0, y0)); }
    // 3) marcas nas ruas
    drawMarcas(ctx, x0, y0, x1, y1);
    // 4) faixas de pedestre (só nas cidades)
    ctx.fillStyle = 'rgba(245,245,245,0.92)';
    crossings.forEach(c => {
      const cx = c.x * T, cy = c.y * T, cw = c.w * T, ch = c.h * T;
      if (!hit(cx, cy, cw, ch)) return;
      const cr = mulberry32(Math.floor(cx * 3 + cy * 5)), tinta = () => { ctx.fillStyle = 'rgba(' + (236 + cr() * 14 | 0) + ',' + (236 + cr() * 14 | 0) + ',' + (236 + cr() * 10 | 0) + ',' + (0.55 + cr() * 0.4) + ')'; };
      if (c.dir === 'h') { for (let xx = cx + 6; xx < cx + cw - 6; xx += 16) { tinta(); ctx.fillRect(xx, cy + 4, 9, ch - 8); } }
      else { for (let yy = cy + 6; yy < cy + ch - 6; yy += 16) { tinta(); ctx.fillRect(cx + 4, yy, cw - 8, 9); } }
    });
    // 4b) chão das florestas gigantes (cobre as ruas apagadas)
    MEGAS.forEach(m => { if (hit(m.x, m.y, m.w, m.h)) G.rural.chaoMata(ctx, m, tex, x0, y0, x1, y1); });
    // 5) quadras (chão) e objetos de calçada
    blocks.forEach(b => { if (hit(b.x - 8, b.y - 8, b.w + 16, b.h + 16)) drawBlockGround(ctx, b, x0, y0, x1, y1); });
    blocks.forEach(b => { if (!SEM_PROPS[b.kind] && hit(b.x - 8, b.y - 8, b.w + 16, b.h + 16)) drawProps(ctx, b); });
    // 6) pontes (e água nas ruas sem ponte): proteção e pilares
    rios.forEach(rv => {
      if (!hit(rv.x - 40, rv.y, rv.w + 80, rv.h)) return;
      for (let j = 0; j <= ROWS; j++) {
        const by = roadTop(j), bx = rv.x;
        if (!hit(bx, by - (BR_S + 4) * T, rv.w, (ROAD + 2 * BR_S + 8) * T)) continue;
        if (!temPonte(rv.bx, j)) {
          ctx.fillStyle = ctx.createPattern(tex.water, 'repeat'); ctx.fillRect(bx, by, rv.w, ROAD * T);
          ctx.fillStyle = 'rgba(180,220,255,0.10)'; for (let k = 0; k < 22; k++) ctx.fillRect(bx + ((k * 97) % rv.w), by + ((k * 41) % (ROAD * T)), 18, 2);
          ctx.fillStyle = '#3d4a3b'; ctx.fillRect(bx, by, 10, ROAD * T); ctx.fillRect(bx + rv.w - 10, by, 10, ROAD * T);
          ctx.fillStyle = '#6f7d6a'; ctx.fillRect(bx + 8, by, 3, ROAD * T); ctx.fillRect(bx + rv.w - 11, by, 3, ROAD * T);
          continue;
        }
        drawBridge(ctx, bx, by, rv.w, ROAD * T, { main: ehPrincipal(rv.bx) });
      }
    });
    // 7) sombras (mais compridas nos prédios mais altos) e telhados
    const vis = buildings.filter(b => { const bb = b.box || b; return hit(bb.x - 6, bb.y - 6, bb.w + 70, bb.h + 70); });
    vis.forEach(b => {
      const bb = b.box || b, rects = b.rects || [b], k = Math.max(1, b.andares || 1), off = Math.min(48, 12 + k * 5);
      ctx.save();
      ctx.beginPath(); ctx.rect(bb.x - 60, bb.y - 60, bb.w + 180, bb.h + 180); ctx.clip();
      ctx.shadowColor = 'rgba(0,0,12,0.55)'; ctx.shadowBlur = 16; ctx.shadowOffsetX = off; ctx.shadowOffsetY = off + 2;
      ctx.fillStyle = '#000'; rects.forEach(r => ctx.fillRect(r.x + 4, r.y + 4, r.w - 4, r.h - 4));
      ctx.restore();
    });
    vis.forEach(b => drawRoof(ctx, b));
    // 8) árvores e postes
    trees.forEach(t => { if (t.x > x0 - 50 && t.x < x1 + 50 && t.y > y0 - 50 && t.y < y1 + 50) drawTree(ctx, t); });
    lamps.forEach(l => {
      if (!hit(l.x - 14, l.y - 14, 28, 28)) return;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(l.x + 4, l.y + 5, 5, 0, 7); ctx.fill();
      ctx.fillStyle = '#4a4a55'; ctx.beginPath(); ctx.arc(l.x, l.y, 4, 0, 7); ctx.fill();
      ctx.fillStyle = '#f7efb0'; ctx.beginPath(); ctx.arc(l.x, l.y, 2.5, 0, 7); ctx.fill();
    });
  }
