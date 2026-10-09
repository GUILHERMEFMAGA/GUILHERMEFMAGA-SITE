  // passagem de pedestres entre as duas fileiras de uma quadra
  function travessa(ctx, ax, ay, aw, ah) {
    ctx.fillStyle = '#ece1a2'; ctx.fillRect(ax, ay, aw, ah);
    ctx.fillStyle = ctx.createPattern(tex.paving, 'repeat'); ctx.fillRect(ax, ay, aw, ah);
    ctx.strokeStyle = 'rgba(150,130,70,0.4)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let gx = ax; gx <= ax + aw; gx += T) { ctx.moveTo(gx + 0.5, ay); ctx.lineTo(gx + 0.5, ay + ah); }
    for (let gy = ay; gy <= ay + ah; gy += T) { ctx.moveTo(ax, gy + 0.5); ctx.lineTo(ax + aw, gy + 0.5); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(ax, ay, aw, 5); ctx.fillRect(ax, ay + ah - 3, aw, 3);
  }
  // desenho do miolo de cada tipo de quadra (dentro da calçada)
  const MIOLO = {
    city(ctx, blk) {
      const { x, y } = blk;
      ctx.fillStyle = ctx.createPattern(tex.alley, 'repeat'); ctx.fillRect(x + 2 * T, y + 2 * T, 16 * T, 16 * T);   // "beco" escuro debaixo dos prédios
      travessa(ctx, x + 2 * T, y + 9 * T, 16 * T, 2 * T);
    },
    vila(ctx, blk) {
      const { x, y } = blk;
      ctx.fillStyle = ctx.createPattern(tex.alley, 'repeat'); ctx.fillRect(x + 2 * T, y + 2 * T, 16 * T, 16 * T);
      blk.lotes.forEach(l => AR.drawQuintal(ctx, l.q, tex, l.seed));
      travessa(ctx, x + 2 * T, y + 9 * T, 16 * T, 2 * T);
    },
    hotel(ctx, blk) {
      const { x, y } = blk, lv = blk.hotel.nivel, cx = x + 10 * T, py = y + 13 * T;
      ctx.fillStyle = ctx.createPattern(tex.alley, 'repeat'); ctx.fillRect(x + 2 * T, y + T, 16 * T, 12 * T);
      if (lv === 'luxo' || lv === 'medio') {
        // jardins dos dois lados, caminho central, tapete vermelho, chafariz e bandeiras
        [[x + 2.4 * T, 5.2 * T], [x + 12.4 * T, 5.2 * T]].forEach(([gx, gw]) => {
          rrect(ctx, gx, py + 10, gw, 5 * T - 6, 14); ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fill(); ctx.strokeStyle = '#2f6b26'; ctx.lineWidth = 3; ctx.stroke();
          for (let k = 0; k < 14; k++) { ctx.fillStyle = ['#ff5a7a', '#ffd84a', '#ffffff', '#ff8a3c'][k % 4]; ctx.beginPath(); ctx.arc(gx + 14 + (k * 37) % (gw - 28), py + 22 + (k * 53) % (4 * T), 2.4, 0, 7); ctx.fill(); }
          for (let k = 0; k < 3; k++) { ctx.fillStyle = '#3a8a34'; ctx.beginPath(); ctx.arc(gx + 24 + k * (gw - 48) / 2, py + 4.4 * T, 11, 0, 7); ctx.fill(); }
        });
        ctx.fillStyle = '#e8dfc6'; ctx.fillRect(cx - 2.2 * T, py, 4.4 * T, 5 * T); ctx.fillStyle = 'rgba(120,100,60,0.18)'; for (let k = 0; k < 6; k++) ctx.fillRect(cx - 2.2 * T, py + k * 32, 4.4 * T, 1);
        if (lv === 'luxo') {
          ctx.fillStyle = '#9a1d28'; ctx.fillRect(cx - 22, py - 2, 44, 2.2 * T); ctx.fillStyle = '#e8c36a'; ctx.fillRect(cx - 22, py - 2, 3, 2.2 * T); ctx.fillRect(cx + 19, py - 2, 3, 2.2 * T);
          ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(cx + 3, py + 3.3 * T + 3, 50, 0, 7); ctx.fill();
          ctx.fillStyle = '#d6d0bc'; ctx.beginPath(); ctx.arc(cx, py + 3.3 * T, 48, 0, 7); ctx.fill(); ctx.strokeStyle = '#a89a72'; ctx.lineWidth = 3; ctx.stroke();
          ctx.fillStyle = '#4ab8e0'; ctx.beginPath(); ctx.arc(cx, py + 3.3 * T, 36, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.arc(cx, py + 3.3 * T, 36 - k * 9, 0, 7); ctx.stroke(); }
          ctx.fillStyle = '#e8c36a'; ctx.beginPath(); ctx.arc(cx, py + 3.3 * T, 7, 0, 7); ctx.fill();
          [[-3.4, 0], [3.4, 0], [-5.2, 1], [5.2, 1]].forEach(([k, q]) => { const fx = cx + k * T, fy = py + 6 + q * 14; ctx.fillStyle = '#9a9aa2'; ctx.fillRect(fx - 1, fy, 3, 34); ctx.fillStyle = ['#2a6ac8', '#d9242a', '#f2c42a', '#2a9a52'][((k * 10) | 0 + 20) % 4]; ctx.fillRect(fx + 2, fy, 20, 11); });
        }
      }
    },
    obras(ctx, blk) {
      const { x, y } = blk, gx = x + 2 * T, gy = y + 2 * T;
      ctx.fillStyle = ctx.createPattern(tex.terra, 'repeat'); ctx.fillRect(gx, gy, 16 * T, 16 * T);
      if (blk.kind === 'obras') {
        [[7 * T, 0, 2 * T, 16 * T], [0, 7 * T, 16 * T, 2 * T]].forEach(([a, b, c, d]) => { ctx.fillStyle = '#c9bd8e'; ctx.fillRect(gx + a, gy + b, c, d); ctx.fillStyle = ctx.createPattern(tex.paving, 'repeat'); ctx.fillRect(gx + a, gy + b, c, d); });
      }
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(gx - 4, gy - 4, 16 * T + 8, 4); ctx.fillRect(gx - 4, gy + 16 * T, 16 * T + 8, 4);
    },
    prefeitura(ctx, blk) {
      const { x, y } = blk, d = PUB_DIMS.prefeitura, cx = x + 10 * T, cy = y + 14.2 * T;
      ctx.fillStyle = ctx.createPattern(tex.alley, 'repeat'); ctx.fillRect(x + 2 * T, y + T, d[0] * T, d[1] * T);
      [[x + 2.4 * T, y + 10 * T], [x + 14 * T, y + 10 * T]].forEach(([gx, gy]) => { rrect(ctx, gx, gy, 3.6 * T, 8 * T - 8, 14); ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fill(); ctx.strokeStyle = '#2f6b26'; ctx.lineWidth = 3; ctx.stroke(); });
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(cx + 4, cy + 4, 84, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, 82, 0, 7); ctx.fillStyle = '#d8d0b0'; ctx.fill(); ctx.strokeStyle = '#9a8a5a'; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 44, 0, 7); ctx.fillStyle = ctx.createPattern(tex.water, 'repeat'); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 7); ctx.fill();
      ctx.fillStyle = '#c8c8d0'; ctx.fillRect(cx - 2, cy - 14, 4, 28);
      [[-2.5, '#2a8a3a'], [2.5, '#f2d21a']].forEach(([k, cor]) => { const fx = cx + k * T - 10; ctx.fillStyle = '#6a6a72'; ctx.fillRect(fx, y + 9.6 * T, 3, 46); ctx.fillStyle = cor; ctx.fillRect(fx + 3, y + 9.6 * T, 26, 10); });
    },
    mercado(ctx, blk) {
      const { x, y, w } = blk, lt = y + 14 * T;
      ctx.fillStyle = ctx.createPattern(tex.alley, 'repeat'); ctx.fillRect(x + 2 * T, y + T, 16 * T, 10 * T);
      ctx.fillStyle = ctx.createPattern(tex.asphalt, 'repeat'); ctx.fillRect(x, lt, w, 6 * T);
      ctx.fillStyle = 'rgba(15,10,30,0.28)'; ctx.fillRect(x, lt, w, 6 * T);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x, lt + 2, w, 3);
      for (let k = 0; k < 15; k++) for (const yy of [lt + 40, lt + 138]) { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(x + 4 + k * 40, yy, 2, 50); }
      for (const yy of [lt + 40, lt + 138]) { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(x + 4 + 15 * 40, yy, 2, 50); }
      ctx.fillStyle = 'rgba(40,90,200,0.55)'; ctx.fillRect(x + 8, lt + 44, 32, 42);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.fillText('♿', x + 24, lt + 72);
      ctx.fillStyle = 'rgba(255,224,74,0.7)'; ctx.font = 'bold 11px Arial'; ctx.fillText('ENTRADA / SAÍDA', x + 560, lt + 176); ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < 14; k++) ctx.fillRect(x + 20 + k * 40, lt + 112, 18, 3);
      ctx.fillStyle = '#4a4e58'; ctx.fillRect(x + 538, lt + 12, 40, 18); ctx.fillStyle = '#c8ccd4'; for (let k = 0; k < 6; k++) ctx.fillRect(x + 542 + k * 6, lt + 14, 3, 14);
      // faixa de pedestres da loja até o estacionamento
      ctx.fillStyle = 'rgba(245,245,245,0.85)'; for (let k = 0; k < 8; k++) ctx.fillRect(x + 9.4 * T + k * 14, lt - 3 * T + 4, 8, 3 * T - 6);
    },
    park(ctx, blk) {
      const { x, y, w, h } = blk, gx = x + 2 * T, gy = y + 2 * T, S = 16 * T;
      rrect(ctx, gx, gy, S, S, 18); ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fill(); ctx.strokeStyle = '#2f6b26'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = '#b89a62'; ctx.lineWidth = 18; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(gx + 16, gy + S / 2); ctx.lineTo(gx + S - 16, gy + S / 2); ctx.moveTo(gx + S / 2, gy + 16); ctx.lineTo(gx + S / 2, gy + S - 16); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(gx + S / 2, gy + S / 2, 4.6 * T + 26, 3.3 * T + 26, 0, 0, 7); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx + 16, gy + S / 2 + 9); ctx.lineTo(gx + S - 16, gy + S / 2 + 9); ctx.stroke(); ctx.lineCap = 'butt';
      const fr = mulberry32(blk.bx * 313 + blk.by * 71 + 9);
      for (let k = 0; k < 260; k++) {
        const fx = gx + 14 + fr() * (S - 28), fy = gy + 14 + fr() * (S - 28), cc = fr();
        if (Math.abs(fx - (gx + S / 2)) < 14 || Math.abs(fy - (gy + S / 2)) < 14) continue;
        if (cc < 0.35) { ctx.fillStyle = 'rgba(20,70,20,0.5)'; ctx.fillRect(fx, fy, 1, 3); ctx.fillRect(fx + 2, fy + 1, 1, 2); ctx.fillRect(fx - 2, fy + 1, 1, 2); }
        else { ctx.fillStyle = ['#f5e9ff', '#ffd84a', '#ff7a9a', '#ffffff', '#ff9a3c'][Math.floor(cc * 9) % 5]; ctx.beginPath(); ctx.arc(fx, fy, 1.5, 0, 7); ctx.fill(); }
      }
      ponds.forEach(p => {
        if (p.x < x || p.x > x + w || p.y < y || p.y > y + h) return;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx + 8, p.ry + 8, 0, 0, 7); ctx.fillStyle = '#7d8a6a'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, 7); ctx.fillStyle = ctx.createPattern(tex.water, 'repeat'); ctx.fill();
        ctx.beginPath(); ctx.ellipse(p.x - 8, p.y - 6, p.rx * 0.6, p.ry * 0.5, 0, 0, 7); ctx.fillStyle = 'rgba(120,180,255,0.18)'; ctx.fill();
      });
      ctx.fillStyle = '#6b4a2a';   // bancos
      [[gx + 40, gy + S / 2 - 34], [gx + S - 70, gy + S / 2 + 20], [gx + S / 2 + 20, gy + 40], [gx + S / 2 - 44, gy + S - 70]].forEach(([bx, by]) => { ctx.fillRect(bx, by, 28, 9); ctx.fillStyle = '#4a321c'; ctx.fillRect(bx, by + 7, 28, 2); ctx.fillStyle = '#6b4a2a'; });
      // pracinha de areia com balanço e gira-gira
      const sx = gx + 40, sy = gy + 36; ctx.fillStyle = '#e4d29a'; rrect(ctx, sx, sy, 118, 76, 14); ctx.fill(); ctx.strokeStyle = '#a88a52'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = '#d9352a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx + 14, sy + 14); ctx.lineTo(sx + 14, sy + 54); ctx.moveTo(sx + 52, sy + 14); ctx.lineTo(sx + 52, sy + 54); ctx.moveTo(sx + 14, sy + 14); ctx.lineTo(sx + 52, sy + 14); ctx.stroke();
      ctx.fillStyle = '#2a6ac8'; ctx.fillRect(sx + 20, sy + 40, 12, 5); ctx.fillRect(sx + 34, sy + 44, 12, 5);
      ctx.fillStyle = '#f2c42a'; ctx.beginPath(); ctx.arc(sx + 90, sy + 40, 17, 0, 7); ctx.fill(); ctx.strokeStyle = '#a07a10'; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(sx + 90, sy + 40); ctx.lineTo(sx + 90 + Math.cos(k * 1.57) * 17, sy + 40 + Math.sin(k * 1.57) * 17); } ctx.stroke();
      // coreto
      const ax = gx + S - 78, ay = gy + 70; ctx.fillStyle = 'rgba(0,0,10,0.28)'; ctx.beginPath(); ctx.arc(ax + 6, ay + 8, 36, 0, 7); ctx.fill();
      ctx.fillStyle = '#e8e0cc'; ctx.beginPath(); ctx.arc(ax, ay, 34, 0, 7); ctx.fill(); ctx.fillStyle = '#c8302a'; ctx.beginPath(); ctx.arc(ax, ay, 30, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + Math.cos(k * 0.785) * 30, ay + Math.sin(k * 0.785) * 30); ctx.stroke(); }
      ctx.fillStyle = '#e8c36a'; ctx.beginPath(); ctx.arc(ax, ay, 5, 0, 7); ctx.fill();
    },
    aeroporto(ctx, blk) { const { x, y } = blk; ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fillRect(x + T, y + T, 18 * T, 11 * T); }
  };
  MIOLO.obra = MIOLO.obras;
  MIOLO.delegacia = MIOLO.hospital = MIOLO.estadio = function (ctx, blk) {
    const { x, y, w, h, kind } = blk, d = PUB_DIMS[kind], ox = kind === 'estadio' ? 1 : 2;
    ctx.fillStyle = ctx.createPattern(tex.alley, 'repeat'); ctx.fillRect(x + ox * T, y + T, d[0] * T, d[1] * T);
    if (kind === 'estadio') return;
    const lt = y + (1 + d[1]) * T + 0;
    ctx.fillStyle = ctx.createPattern(tex.asphalt, 'repeat'); ctx.fillRect(x, lt, w, y + h - lt); ctx.fillStyle = 'rgba(15,10,30,0.25)'; ctx.fillRect(x, lt, w, y + h - lt);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let k = 0; k < 15; k++) { ctx.fillRect(x + 20 + k * 40, lt + 16, 2, 46); ctx.fillRect(x + 20 + k * 40, y + h - 70, 2, 46); }
    if (kind === 'hospital') { ctx.fillStyle = 'rgba(217,54,62,0.7)'; ctx.fillRect(x + 7 * T, lt + 6, 6 * T, 4); ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.textAlign = 'center'; ctx.fillText('PRONTO-SOCORRO — AMBULÂNCIAS', x + 10 * T, lt + 100); ctx.textAlign = 'left'; }
    else { ctx.fillStyle = 'rgba(80,120,255,0.8)'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.fillText('VIATURAS — ENTRADA DOS PRESOS', x + 10 * T, lt + 100); ctx.textAlign = 'left'; }
  };
  function drawPorto(ctx, blk) {
    const { x, y, w, h } = blk, fr = mulberry32(blk.bx * 53 + blk.by * 19 + 1);
    ctx.fillStyle = '#8d8f96'; ctx.fillRect(x, y, w, h); ctx.fillStyle = ctx.createPattern(tex.paving, 'repeat'); ctx.globalAlpha = 0.35; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
    ctx.fillStyle = ctx.createPattern(tex.water, 'repeat'); ctx.fillRect(x + 12 * T, y, 8 * T, h);
    ctx.fillStyle = '#3d4a3b'; ctx.fillRect(x + 12 * T - 8, y, 10, h); ctx.fillStyle = '#c8c8d0'; ctx.fillRect(x + 12 * T - 2, y, 3, h);
    for (let k = 0; k < 20; k++) { ctx.fillStyle = 'rgba(180,220,255,0.12)'; ctx.fillRect(x + 12 * T + 10 + (k * 37) % (7 * T), y + (k * 53) % h, 24, 2); }
    const cc = ['#c0392b', '#2a6ab8', '#e0a02a', '#3a8a4a', '#8a4a9a'];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 2; c++) { if (fr() < 0.25) continue; const px = x + 9 * T + c * 44, py = y + 1.4 * T + r * 2.4 * T + (blk.by % 2) * 10; ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(px + 4, py + 5, 34, 54); const col = cc[Math.floor(fr() * 5)]; ctx.fillStyle = col; ctx.fillRect(px, py, 34, 54); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(px, py, 34, 3); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; for (let q = 4; q < 34; q += 5) { ctx.beginPath(); ctx.moveTo(px + q, py + 3); ctx.lineTo(px + q, py + 54); ctx.stroke(); } }
    ctx.fillStyle = '#d8b02a'; ctx.fillRect(x + 11.2 * T, y + 9 * T, 3, 90); ctx.fillRect(x + 11.2 * T, y + 9 * T, 78, 5); ctx.fillStyle = '#c0392b'; ctx.fillRect(x + 11.2 * T + 70, y + 9 * T + 5, 8, 26);
    if (blk.by === 3) { ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.fillText('CAIS — BALSA PARA A ILHA', x + 5.4 * T, y + 9.3 * T); ctx.textAlign = 'left'; }
  }
  const SEM_ANEL = { floresta: 1, bosque: 1, campo: 1, fazenda: 1, porto: 1 };
  function drawBlockGround(ctx, blk, x0, y0, x1, y1) {
    const { x, y, w, h, kind } = blk;
/*RIO*/
    if (SEM_ANEL[kind]) {
      if (kind === 'porto') drawPorto(ctx, blk); else G.rural.desenhaBloco(ctx, blk, tex, x0, y0, x1, y1, AR.drawQuintal);
      return;
    }
/*ANEL*/
    (MIOLO[kind] || MIOLO.city)(ctx, blk);
  }
