/* ============================================================
   rural.js — o campo e a floresta: chão da mata gigante, estradas de terra,
   lavouras (soja, milho, cana, café...), pastos, fazendas de bilionário e as árvores.
   É chamado por world.js na hora de desenhar cada pedaço do mapa.
   ============================================================ */
(function (G) {
  'use strict';
  const R = G.rural = {};
  const T = 32, TAU = Math.PI * 2;
  const mulberry32 = G.arte.mulberry32, shade = G.arte.shade, mix = G.arte.mix;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  // ---------- árvores da mata (baratas de desenhar, porque são dezenas de milhares) ----------
  // k: 0 = folhosa, 1 = pinheiro, 3 = árvore seca
  R.drawTree = function (ctx, t) {
    const r0 = t.r, r = mulberry32(Math.floor(t.x * 13 + t.y * 7));
    // sombra sem desfoque (bem mais rápida)
    ctx.fillStyle = 'rgba(0,0,10,0.30)'; ctx.beginPath(); ctx.ellipse(t.x + r0 * 0.5, t.y + r0 * 0.6, r0 * 0.95, r0 * 0.8, 0, 0, TAU); ctx.fill();
    if (t.k === 3) {   // árvore seca: tronco e galhos
      ctx.strokeStyle = '#5a4a3a'; ctx.lineCap = 'round'; ctx.lineWidth = 3;
      for (let k = 0; k < 7; k++) { const a = k * 0.9 + r() * 0.4, l = r0 * (0.6 + r() * 0.5); ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.x + Math.cos(a) * l, t.y + Math.sin(a) * l); ctx.stroke(); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(t.x + Math.cos(a) * l * 0.6, t.y + Math.sin(a) * l * 0.6); ctx.lineTo(t.x + Math.cos(a + 0.6) * l * 0.95, t.y + Math.sin(a + 0.6) * l * 0.95); ctx.stroke(); ctx.lineWidth = 3; }
      ctx.fillStyle = '#3a2e22'; ctx.beginPath(); ctx.arc(t.x, t.y, 3, 0, TAU); ctx.fill();
      return;
    }
    if (t.k === 1) {   // pinheiro: estrela de galhos verde-escuros vista de cima
      const g = ctx.createRadialGradient(t.x - r0 * 0.3, t.y - r0 * 0.3, 1, t.x, t.y, r0);
      g.addColorStop(0, '#2f7a3a'); g.addColorStop(0.6, '#1b5a2c'); g.addColorStop(1, '#0f3a1e');
      ctx.fillStyle = g; ctx.beginPath();
      const n = 9; for (let k = 0; k <= n * 2; k++) { const a = k * Math.PI / n, rad = k % 2 ? r0 * 0.55 : r0; const px = t.x + Math.cos(a) * rad, py = t.y + Math.sin(a) * rad; if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(170,230,140,0.22)'; ctx.beginPath(); ctx.arc(t.x - r0 * 0.25, t.y - r0 * 0.25, r0 * 0.38, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2a1d12'; ctx.beginPath(); ctx.arc(t.x, t.y, 2, 0, TAU); ctx.fill();
      return;
    }
    // folhosa: copa de várias folhagens sobrepostas
    const greens = ['#1d5c20', '#246b24', '#2f8a2a', '#3a9a31'];
    for (let k = 0; k < 6; k++) { const a = r() * 6.28, d = r() * r0 * 0.5, rad = r0 * (0.45 + r() * 0.22); ctx.fillStyle = greens[Math.floor(r() * 3)]; ctx.beginPath(); ctx.arc(t.x + Math.cos(a) * d, t.y + Math.sin(a) * d, rad, 0, TAU); ctx.fill(); }
    const g = ctx.createRadialGradient(t.x - r0 * 0.35, t.y - r0 * 0.35, 2, t.x, t.y, r0);
    g.addColorStop(0, 'rgba(160,235,110,0.50)'); g.addColorStop(0.55, 'rgba(60,150,50,0.08)'); g.addColorStop(1, 'rgba(0,30,5,0.45)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(t.x, t.y, r0, 0, TAU); ctx.fill();
    for (let k = 0; k < 5; k++) { const a = r() * 6.28, d = r() * r0 * 0.75; ctx.fillStyle = r() < 0.6 ? 'rgba(190,255,140,0.20)' : 'rgba(0,40,0,0.22)'; ctx.beginPath(); ctx.arc(t.x + Math.cos(a) * d, t.y + Math.sin(a) * d, 2 + r() * 4, 0, TAU); ctx.fill(); }
  };

  // ---------- chão da floresta gigante ----------
  R.chaoMata = function (ctx, m, tex, x0, y0, x1, y1) {
    const ax = Math.max(m.x, x0), ay = Math.max(m.y, y0), bx = Math.min(m.x + m.w, x1), by = Math.min(m.y + m.h, y1);
    if (bx <= ax || by <= ay) return;
    ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fillRect(ax, ay, bx - ax, by - ay);

    // Se for o Domínio Aberto do Chefão: puro campo aberto sem floresta, sem agricultura e com a estrada única
    if (m.aberto || m.id === 'campos_chefao') {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let yy = Math.floor(ay / 32) * 32; yy <= by; yy += 32) {
        if ((Math.floor(yy / 32)) % 2 === 0) ctx.fillRect(ax, yy, bx - ax, 32);
      }

      // Desenho da Rodovia Privativa de Pista Dupla (Entrada e Saída Expressa da Cidade)
      const PR_Y = (6 + 2 * 28 + 8 + 10) * 32; // y = 2560 (eixo central da rodovia)
      const PR_X0 = (6 + 14 * 28 + 8) * 32;    // x = 13056 (entrada do domínio)
      const PR_X1 = (6 + 24 * 28 + 8 + 10) * 32; // x = 22272 (mansão)
      const PR_W = PR_X1 - PR_X0;

      if (PR_X1 >= ax && PR_X0 <= bx && PR_Y + 90 >= ay && PR_Y - 90 <= by) {
        ctx.save();
        // 1. Pista Norte (ENTRADA: Cidade ➔ Mansão)
        ctx.fillStyle = '#1c1e24';
        ctx.fillRect(PR_X0, PR_Y - 72, PR_W, 60);
        ctx.fillStyle = '#dfd8c8';
        ctx.fillRect(PR_X0, PR_Y - 74, PR_W, 3);
        ctx.fillRect(PR_X0, PR_Y - 13, PR_W, 3);
        // Faixas e setas verdes de Entrada
        ctx.fillStyle = '#69f0ae';
        for (let xx = PR_X0 + 30; xx < PR_X1 - 20; xx += 120) {
          ctx.fillRect(xx, PR_Y - 44, 40, 4);
        }

        // 2. Canteiro Central com Coqueiros e Iluminação
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(PR_X0, PR_Y - 10, PR_W, 20);
        ctx.fillStyle = '#dfd8c8';
        ctx.fillRect(PR_X0, PR_Y - 11, PR_W, 2);
        ctx.fillRect(PR_X0, PR_Y + 9, PR_W, 2);
        for (let xx = PR_X0 + 40; xx < PR_X1 - 20; xx += 80) {
          // Mini-coqueiros no canteiro central
          ctx.fillStyle = '#6d4c41'; ctx.beginPath(); ctx.arc(xx, PR_Y, 3, 0, TAU); ctx.fill();
          ctx.fillStyle = '#43a047'; ctx.beginPath(); ctx.arc(xx, PR_Y, 7, 0, TAU); ctx.fill();
          // Lâmpada de iluminação dourada
          ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(xx + 15, PR_Y, 2.5, 0, TAU); ctx.fill();
        }

        // 3. Pista Sul (SAÍDA: Mansão ➔ Cidade)
        ctx.fillStyle = '#1c1e24';
        ctx.fillRect(PR_X0, PR_Y + 12, PR_W, 60);
        ctx.fillStyle = '#dfd8c8';
        ctx.fillRect(PR_X0, PR_Y + 11, PR_W, 3);
        ctx.fillRect(PR_X0, PR_Y + 72, PR_W, 3);
        // Faixas e setas vermelhas de Saída
        ctx.fillStyle = '#ff5252';
        for (let xx = PR_X0 + 30; xx < PR_X1 - 20; xx += 120) {
          ctx.fillRect(xx, PR_Y + 40, 40, 4);
        }

        // 4. Posto de Controle e Bloqueio Duplo do Capitão Salvatore (bx=14)
        const ckX = PR_X0 + 90;
        // Cabine blindada central de comando
        ctx.fillStyle = '#111318';
        ctx.fillRect(ckX - 35, PR_Y - 26, 70, 52);
        ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 2;
        ctx.strokeRect(ckX - 35, PR_Y - 26, 70, 52);
        // Vidros espelhados azuis
        ctx.fillStyle = '#42a5f5'; ctx.fillRect(ckX - 25, PR_Y - 18, 50, 36);

        // Cancelas automáticas de Entrada e Saída
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(ckX + 40, PR_Y - 65, 12, 50); // Cancela Entrada
        ctx.fillRect(ckX + 40, PR_Y + 15, 12, 50); // Cancela Saída
        ctx.fillStyle = '#d32f2f';
        for (let k = 0; k < 4; k++) {
          ctx.fillRect(ckX + 40, PR_Y - 65 + k * 12, 12, 6);
          ctx.fillRect(ckX + 40, PR_Y + 15 + k * 12, 12, 6);
        }

        // Placas Luminosas de Entrada e Saída
        ctx.fillStyle = '#0a0c10';
        ctx.fillRect(ckX - 130, PR_Y - 98, 260, 20);
        ctx.strokeStyle = '#00e676'; ctx.lineWidth = 1.8;
        ctx.strokeRect(ckX - 130, PR_Y - 98, 260, 20);
        ctx.fillStyle = '#00e676'; ctx.font = 'bold 8.5px Arial'; ctx.textAlign = 'center';
        ctx.fillText('🟢 PISTA DE ENTRADA EXPRESSA: PALÁCIO DO CHEFÃO ➔', ckX, PR_Y - 84);

        ctx.fillStyle = '#0a0c10';
        ctx.fillRect(ckX - 130, PR_Y + 78, 260, 20);
        ctx.strokeStyle = '#ff1744'; ctx.lineWidth = 1.8;
        ctx.strokeRect(ckX - 130, PR_Y + 78, 260, 20);
        ctx.fillStyle = '#ff5252'; ctx.font = 'bold 8.5px Arial'; ctx.textAlign = 'center';
        ctx.fillText('⬅ PISTA DE SAÍDA EXPRESSA: CENTRO DA CIDADE 🔴', ckX, PR_Y + 92);
        ctx.restore();
      }
      return;
    }

    ctx.fillStyle = 'rgba(5,32,12,0.52)'; ctx.fillRect(ax, ay, bx - ax, by - ay);
    const cs = 128, sd = m.id.length * 131 + m.bx0;
    for (let gy = Math.floor(ay / cs); gy <= Math.floor(by / cs); gy++) for (let gx = Math.floor(ax / cs); gx <= Math.floor(bx / cs); gx++) {
      const r = mulberry32(gx * 7349 + gy * 9151 + sd);
      for (let k = 0; k < 3; k++) {   // manchas de musgo e folhas secas
        const px = (gx + r()) * cs, py = (gy + r()) * cs, rad = 14 + r() * 34, q = r();
        ctx.fillStyle = q < 0.5 ? 'rgba(18,70,22,0.30)' : q < 0.8 ? 'rgba(96,66,30,0.22)' : 'rgba(150,170,60,0.12)';
        ctx.beginPath(); ctx.ellipse(px, py, rad, rad * (0.6 + r() * 0.4), r() * 3, 0, TAU); ctx.fill();
      }
      const q = r(), px = (gx + r()) * cs, py = (gy + r()) * cs;
      if (q < 0.18) {   // tronco caído
        ctx.save(); ctx.translate(px, py); ctx.rotate(r() * 3); const l = 30 + r() * 30;
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-l / 2 + 3, -4 + 4, l, 8); ctx.fillStyle = '#5a4128'; ctx.fillRect(-l / 2, -4, l, 8); ctx.fillStyle = '#7a5a38'; ctx.fillRect(-l / 2, -4, l, 2.5);
        ctx.fillStyle = '#c8a878'; ctx.beginPath(); ctx.ellipse(l / 2, 0, 2.4, 4, 0, 0, TAU); ctx.fill(); ctx.restore();
      } else if (q < 0.32) {   // pedras com musgo
        for (let k = 0; k < 2 + (r() * 3 | 0); k++) { const ox = px + (r() - 0.5) * 24, oy = py + (r() - 0.5) * 18, rr2 = 4 + r() * 7; ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(ox + 2, oy + 3, rr2, rr2 * 0.8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#7a7e78'; ctx.beginPath(); ctx.ellipse(ox, oy, rr2, rr2 * 0.8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(70,130,50,0.5)'; ctx.beginPath(); ctx.ellipse(ox - rr2 * 0.2, oy - rr2 * 0.3, rr2 * 0.6, rr2 * 0.35, 0, 0, TAU); ctx.fill(); }
      } else if (q < 0.46) {   // samambaias
        ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 1.5; for (let k = 0; k < 7; k++) { const a = k * 0.9; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + Math.cos(a) * 8, py + Math.sin(a) * 8 - 3, px + Math.cos(a) * 15, py + Math.sin(a) * 15); ctx.stroke(); }
      } else if (q < 0.54) {   // cogumelos
        for (let k = 0; k < 3; k++) { const ox = px + k * 5 - 5, oy = py + (k % 2) * 4; ctx.fillStyle = '#e8e0cc'; ctx.fillRect(ox, oy, 2, 3); ctx.fillStyle = k % 2 ? '#d9352a' : '#b5651d'; ctx.beginPath(); ctx.arc(ox + 1, oy, 3, Math.PI, 0); ctx.fill(); }
      }
    }
    // estradas de terra (no lugar das ruas apagadas)
    (R.trilhas || []).forEach(tr => {
      if (tr.mega !== m.id || tr.x > bx || tr.x + tr.w < ax || tr.y > by || tr.y + tr.h < ay) return;
      ctx.fillStyle = 'rgba(30,18,6,0.30)'; ctx.fillRect(tr.x - 4, tr.y - 4, tr.w + 8, tr.h + 8);
      ctx.fillStyle = ctx.createPattern(tex.terra, 'repeat'); ctx.fillRect(tr.x, tr.y, tr.w, tr.h);
      ctx.fillStyle = 'rgba(70,46,22,0.28)';
      if (tr.eixo === 'h') { ctx.fillRect(tr.x, tr.y + tr.h * 0.28, tr.w, 4); ctx.fillRect(tr.x, tr.y + tr.h * 0.62, tr.w, 4); ctx.fillStyle = 'rgba(80,120,40,0.35)'; ctx.fillRect(tr.x, tr.y + tr.h * 0.46, tr.w, 6); }
      else { ctx.fillRect(tr.x + tr.w * 0.28, tr.y, 4, tr.h); ctx.fillRect(tr.x + tr.w * 0.62, tr.y, 4, tr.h); ctx.fillStyle = 'rgba(80,120,40,0.35)'; ctx.fillRect(tr.x + tr.w * 0.46, tr.y, 6, tr.h); }
    });
  };

  // ---------- lavouras (padrões repetidos) ----------
  const pad = {};
  function padrao(tipo, vert) {
    const key = tipo + (vert ? 'v' : 'h');
    if (pad[key]) return pad[key];
    const S = 32, c = mk(S, S), g = c.getContext('2d'), r = mulberry32(tipo.length * 77 + (vert ? 5 : 1));
    const cor = { soja: ['#6fb336', '#5a9a28'], milho: ['#4a8f2a', '#3c7a22'], cana: ['#2f6a22', '#265a1c'], trigo: ['#d4ad45', '#c19a35'], arado: ['#7a5a3a', '#5e432a'], cafe: ['#8a6a44', '#765836'], pasto: ['#58a43c', '#4f9636'] }[tipo];
    g.fillStyle = cor[0]; g.fillRect(0, 0, S, S);
    const sp = tipo === 'cana' ? 8 : tipo === 'milho' ? 8 : tipo === 'cafe' ? 16 : 8;
    for (let k = 0; k < S; k += sp) { g.fillStyle = cor[1]; if (vert) g.fillRect(k, 0, sp / 2, S); else g.fillRect(0, k, S, sp / 2); g.fillStyle = 'rgba(0,0,0,0.20)'; if (vert) g.fillRect(k + sp / 2, 0, 1, S); else g.fillRect(0, k + sp / 2, S, 1); }
    if (tipo === 'milho' || tipo === 'cana') for (let k = 0; k < 18; k++) { g.fillStyle = tipo === 'milho' ? 'rgba(220,200,90,0.5)' : 'rgba(150,220,110,0.25)'; g.fillRect(r() * S, r() * S, 2, 2); }
    if (tipo === 'cafe') for (let a = 0; a < S; a += 8) for (let b = 4; b < S; b += 16) { const px = vert ? b : a, py = vert ? a : b; g.fillStyle = '#2f7a2c'; g.beginPath(); g.arc(px + 4, py + 4, 3.2, 0, TAU); g.fill(); g.fillStyle = '#4a9a3c'; g.beginPath(); g.arc(px + 3, py + 3, 1.8, 0, TAU); g.fill(); g.fillStyle = '#c0242a'; g.fillRect(px + 5, py + 4, 1, 1); }
    for (let k = 0; k < 40; k++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'; g.fillRect(r() * S, r() * S, 1, 1); }
    return (pad[key] = c);
  }
  function lavoura(ctx, tipo, x, y, w, h, vert, tex, seed) {
    if (tipo === 'pasto') { ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fillRect(x, y, w, h); return; }
    if (tipo === 'pivo') {
      ctx.fillStyle = ctx.createPattern(padrao('arado', vert), 'repeat'); ctx.fillRect(x, y, w, h);
      const cx = x + w / 2, cy = y + h / 2, rad = Math.min(w, h) / 2 - 2;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.clip();
      ctx.fillStyle = ctx.createPattern(padrao('soja', vert), 'repeat'); ctx.fillRect(x, y, w, h);
      const ang = (seed % 7) * 0.9; ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 8; ctx.beginPath(); for (let k = 0; k < 6; k++) { ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang + k * 1.05) * rad, cy + Math.sin(ang + k * 1.05) * rad); } ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = '#6a8a30'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.stroke();
      // o braço do pivô
      ctx.strokeStyle = 'rgba(0,0,10,0.28)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx + 3, cy + 4); ctx.lineTo(cx + Math.cos(ang) * rad + 3, cy + Math.sin(ang) * rad + 4); ctx.stroke();
      ctx.strokeStyle = '#d6dae0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad); ctx.stroke();
      ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 1; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad); ctx.stroke(); ctx.setLineDash([]);
      for (let k = 1; k <= 5; k++) { ctx.fillStyle = '#4a4e58'; ctx.fillRect(cx + Math.cos(ang) * rad * k / 5 - 2, cy + Math.sin(ang) * rad * k / 5 - 2, 4, 4); }
      ctx.fillStyle = '#e8ecf0'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5; ctx.stroke();
      return;
    }
    ctx.fillStyle = ctx.createPattern(padrao(tipo, vert), 'repeat'); ctx.fillRect(x, y, w, h);
  }
  const cerca = (ctx, x, y, w, h, cor) => {
    ctx.strokeStyle = cor || '#6b4a2a'; ctx.lineWidth = 2.5; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
    ctx.fillStyle = '#4a321a'; for (let k = 0; k <= w; k += 24) { ctx.fillRect(x + k - 1, y - 1, 3, 5); ctx.fillRect(x + k - 1, y + h - 4, 3, 5); } for (let k = 0; k <= h; k += 24) { ctx.fillRect(x - 1, y + k - 1, 5, 3); ctx.fillRect(x + w - 4, y + k - 1, 5, 3); }
  };
  function silo(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,10,0.32)'; ctx.beginPath(); ctx.ellipse(x + 8, y + 10, 26, 22, 0, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(x - 8, y - 8, 2, x, y, 28); g.addColorStop(0, '#f2f4f6'); g.addColorStop(0.5, '#c8ccd2'); g.addColorStop(1, '#8a8f98');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 27, 0, TAU); ctx.fill(); ctx.strokeStyle = '#6a6f78'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1; for (let k = 0; k < 10; k++) { const a = k * TAU / 10; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 27, y + Math.sin(a) * 27); ctx.stroke(); }
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(x - 2, y - 2, 2.4, 0, TAU); ctx.fill();
  }
  function animal(ctx, x, y, tipo, a, r) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(3, 4, 11, 6, 0, 0, TAU); ctx.fill();
    if (tipo === 'vaca') { ctx.fillStyle = '#f4f4f0'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-6, -3, 5, 4); ctx.fillRect(2, 0, 4, 3); ctx.beginPath(); ctx.arc(12, 0, 3.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8c0b0'; ctx.fillRect(10, -1, 2, 2); }
    else if (tipo === 'cavalo') { ctx.fillStyle = r < 0.5 ? '#6a4326' : '#2a1d14'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 5, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(13, -1, 5, 3.4, 0.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a120c'; ctx.fillRect(-14, -1, 4, 2); ctx.fillRect(6, -3, 6, 1.4); }
    else { ctx.fillStyle = '#e8e8e0'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 4.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.arc(6, 0, 2.4, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function trator(ctx, x, y, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-8, -14, 22, 34);
    ctx.fillStyle = '#1a1a1e'; ctx.fillRect(-11, -14, 6, 14); ctx.fillRect(7, -14, 6, 14); ctx.fillRect(-12, 6, 7, 16); ctx.fillRect(6, 6, 7, 16);
    ctx.fillStyle = '#2f9a3a'; ctx.fillRect(-6, -12, 12, 20); ctx.fillStyle = '#e8c82a'; ctx.fillRect(-5, 8, 10, 12); ctx.fillStyle = '#9ad0ee'; ctx.fillRect(-4, 10, 8, 5); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-6, -12, 3, 20);
    ctx.restore();
  }
  function fardos(ctx, x, y, n) { for (let k = 0; k < n; k++) { const px = x + (k % 3) * 22, py = y + Math.floor(k / 3) * 16; ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.arc(px + 3, py + 4, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#d4b04a'; ctx.beginPath(); ctx.arc(px, py, 9, 0, TAU); ctx.fill(); ctx.strokeStyle = '#a08430'; ctx.lineWidth = 1; for (let q = 2; q < 9; q += 3) { ctx.beginPath(); ctx.arc(px, py, q, 0, TAU); ctx.stroke(); } } }

  // ---------- um bloco rural ----------
  R.desenhaBloco = function (ctx, blk, tex, x0, y0, x1, y1, drawQuintal) {
    const { x, y, w, h, kind } = blk, r = mulberry32(blk.bx * 53 + blk.by * 19 + 1);
    if (kind === 'floresta') {
      if (blk.cabana) {   // trilha de terra da cabana até a estrada de terra mais próxima
        const c = blk.cabana, tx = c.x + (r() - 0.5) * 60, ty = c.y + 150;
        ctx.strokeStyle = 'rgba(40,24,8,0.35)'; ctx.lineWidth = 20; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.bezierCurveTo(c.x + 40, c.y + 60, tx - 50, ty - 40, tx, ty); ctx.stroke();
        ctx.strokeStyle = 'rgba(150,115,60,0.7)'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.bezierCurveTo(c.x + 40, c.y + 60, tx - 50, ty - 40, tx, ty); ctx.stroke(); ctx.lineCap = 'butt';
      }
      if (blk.clare) {   // clareira: grama clara e terra batida em volta da cabana
        const c = blk.clare, cx = c.x * T, cy = c.y * T, rad = c.r * T;
        const g = ctx.createRadialGradient(cx, cy, rad * 0.3, cx, cy, rad * 1.05); g.addColorStop(0, 'rgba(120,170,70,0.75)'); g.addColorStop(0.7, 'rgba(90,140,60,0.55)'); g.addColorStop(1, 'rgba(90,140,60,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rad * 1.05, 0, TAU); ctx.fill();
        ctx.fillStyle = ctx.createPattern(tex.terra, 'repeat'); ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.ellipse(cx, cy + 40, rad * 0.55, rad * 0.35, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
        // lenha e machado
        ctx.fillStyle = '#6a4a2a'; for (let k = 0; k < 4; k++) ctx.fillRect(cx + rad * 0.45, cy + k * 5, 18, 4);
      }
      if (blk.camp) {   // acampamento: duas barracas e uma fogueira apagada
        const c = blk.camp, cx = c.x * T, cy = c.y * T;
        ctx.fillStyle = 'rgba(70,46,22,0.5)'; ctx.beginPath(); ctx.ellipse(cx, cy, 52, 40, 0, 0, TAU); ctx.fill();
        [[-26, -8, '#d9622a'], [22, 10, '#2a6ab8']].forEach(([ox, oy, cor], k) => { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(cx + ox - 16, cy + oy + 18); ctx.lineTo(cx + ox + 22, cy + oy + 22); ctx.lineTo(cx + ox + 4, cy + oy - 14); ctx.fill(); ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(cx + ox - 18, cy + oy + 16); ctx.lineTo(cx + ox + 18, cy + oy + 16); ctx.lineTo(cx + ox, cy + oy - 16); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(cx + ox, cy + oy - 16); ctx.lineTo(cx + ox + 18, cy + oy + 16); ctx.lineTo(cx + ox, cy + oy + 16); ctx.fill(); ctx.fillStyle = '#111'; ctx.fillRect(cx + ox - 3, cy + oy + 6, 6, 10); });
        ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.arc(cx, cy + 4, 7, 0, TAU); ctx.fill(); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 8, cy - 2); ctx.lineTo(cx + 8, cy + 10); ctx.moveTo(cx + 8, cy - 2); ctx.lineTo(cx - 8, cy + 10); ctx.stroke();
      }
      if (blk.torreRect) {   // torre de observação dos guardas florestais
        const t = blk.torreRect; ctx.fillStyle = 'rgba(0,0,10,0.3)'; ctx.fillRect(t.x + 10, t.y + 12, t.w, t.h); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(t.x, t.y, t.w, t.h); ctx.strokeStyle = '#3a2a16'; ctx.lineWidth = 2; ctx.strokeRect(t.x + 1, t.y + 1, t.w - 2, t.h - 2); ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.x + t.w, t.y + t.h); ctx.moveTo(t.x + t.w, t.y); ctx.lineTo(t.x, t.y + t.h); ctx.stroke(); ctx.fillStyle = '#8a6a3a'; ctx.fillRect(t.x + 8, t.y + 8, t.w - 16, t.h - 16); ctx.fillStyle = '#d9352a'; ctx.fillRect(t.x + t.w / 2 - 2, t.y + t.h / 2 - 2, 4, 4);
      }
      return;
    }
    if (kind === 'bosque') {
      ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(8,40,14,0.28)'; ctx.fillRect(x, y, w, h);
      for (let k = 0; k < 30; k++) { ctx.fillStyle = r() < 0.5 ? 'rgba(20,70,20,0.30)' : 'rgba(110,80,40,0.20)'; ctx.beginPath(); ctx.arc(x + r() * w, y + r() * h, 6 + r() * 20, 0, TAU); ctx.fill(); }
      return;
    }
    if (kind === 'campo') {
      const vert = (blk.bx + blk.by) % 2 === 1, cul = blk.cultura, sede = blk.sede;
      // terra em volta e os talhões (campos)
      ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fillRect(x, y, w, h);
      const talhoes = [];
      if (sede) {   // a sede ocupa a faixa de baixo: a lavoura fica em cima
        talhoes.push([x + 14, y + 14, w - 28, 11 * T - 14]);
        talhoes.push([x + 14, y + 11 * T + 14, w - 28, 0]);
      } else if (cul === 'pasto' || cul === 'pivo') talhoes.push([x + 14, y + 14, w - 28, h - 28]);
      else { const m = Math.floor((blk.bx * 3 + blk.by) % 3); talhoes.push([x + 14, y + 14, w - 28, h * 0.5 - 20]); talhoes.push([x + 14, y + h * 0.5 + 6, w - 28, h * 0.5 - 20]); }
      talhoes.forEach(([a, b, c, d], k) => {
        if (d < 10 || a + c < x0 || a > x1 || b + d < y0 || b > y1) return;
        const tipo = k === 1 && cul !== 'pasto' && cul !== 'pivo' ? ['soja', 'milho', 'trigo', 'cana', 'cafe', 'arado'][(blk.bx + blk.by * 2) % 6] : cul;
        lavoura(ctx, tipo, a, b, c, d, vert, tex, blk.bx * 5 + blk.by);
        cerca(ctx, a, b, c, d, tipo === 'pasto' ? '#8a6a3a' : '#6b4a2a');
        if (tipo === 'pasto') for (let q = 0; q < 5; q++) animal(ctx, a + 40 + r() * (c - 80), b + 40 + r() * (d - 80), r() < 0.6 ? 'vaca' : (r() < 0.5 ? 'cavalo' : 'ovelha'), r() * TAU, r());
        if (q_trator(blk, k)) trator(ctx, a + c * (0.2 + r() * 0.6), b + d * (0.3 + r() * 0.4), vert ? Math.PI / 2 : 0);
        if (tipo === 'arado' || tipo === 'trigo') fardos(ctx, a + c - 80, b + d - 40, 3 + (r() * 3 | 0));
      });
      if (sede) {
        const s = sede;
        // pátio de terra batida, estradinha até a rua de baixo
        ctx.fillStyle = ctx.createPattern(tex.terra, 'repeat'); ctx.globalAlpha = 0.85; rrect(ctx, x + 8, y + 11 * T + 6, w - 16, h - 11 * T - 6, 16); ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(60,40,20,0.35)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(70,46,22,0.25)'; ctx.fillRect(x + 8, y + 11 * T + 6, w - 16, 5);
        drawQuintal && blk.lotes.forEach(l => drawQuintal(ctx, l.q, tex, l.seed));
        if (blk.silo) silo(ctx, blk.silo.x, blk.silo.y);
        // máquinas e fardos no pátio
        trator(ctx, s.celeiro.x + s.celeiro.w / 2, s.celeiro.y + s.celeiro.h + 24, Math.PI / 2 + 0.2);
      }
      // cerca do bloco e estrada interna
      ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x, y, w, 3); ctx.fillRect(x, y + h - 3, w, 3);
      return;
    }
    if (kind === 'fazenda') {
      ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let yy = 0, k = 0; yy < h; yy += 20, k++) if (k % 2) ctx.fillRect(x, y + yy, w, 20);
      // alameda de entrada (cascalho claro com meio-fio)
      if (blk.alameda) {
        const a = blk.alameda;
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(a.x - T - 3, a.y0 + 2, 2 * T + 6, a.y1 - a.y0); ctx.fillStyle = '#e8dfc6'; ctx.fillRect(a.x - T, a.y0, 2 * T, a.y1 - a.y0);
        ctx.fillStyle = 'rgba(120,100,60,0.25)'; for (let k = 0; k < 60; k++) ctx.fillRect(a.x - T + r() * 2 * T, a.y0 + r() * (a.y1 - a.y0), 2, 1);
        ctx.fillStyle = '#c8bda0'; ctx.fillRect(a.x - T - 2, a.y0, 3, a.y1 - a.y0); ctx.fillRect(a.x + T - 1, a.y0, 3, a.y1 - a.y0);
        // retorno circular com chafariz em frente à mansão
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.arc(a.x + 3, a.y0 + 3, 74, 0, TAU); ctx.fill();
        ctx.fillStyle = '#e8dfc6'; ctx.beginPath(); ctx.arc(a.x, a.y0, 72, 0, TAU); ctx.fill(); ctx.strokeStyle = '#c8bda0'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.beginPath(); ctx.arc(a.x, a.y0, 38, 0, TAU); ctx.fill(); ctx.strokeStyle = '#c8bda0'; ctx.stroke();
        ctx.fillStyle = '#b8c8d0'; ctx.beginPath(); ctx.arc(a.x, a.y0, 20, 0, TAU); ctx.fill(); ctx.fillStyle = '#4ab8e0'; ctx.beginPath(); ctx.arc(a.x, a.y0, 16, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(a.x, a.y0, 4, 0, TAU); ctx.fill();
      }
      blk.lotes.forEach(l => drawQuintal && drawQuintal(ctx, l.q, tex, l.seed));
      // heliponto
      if (blk.heli) { const hp = blk.heli; ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(hp.x + 3, hp.y + 3, 56, 0, TAU); ctx.fill(); ctx.fillStyle = '#6a6c74'; ctx.beginPath(); ctx.arc(hp.x, hp.y, 54, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffe04a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hp.x, hp.y, 42, 0, TAU); ctx.stroke(); ctx.fillStyle = '#ffe04a'; ctx.font = 'bold 44px Arial'; ctx.textAlign = 'center'; ctx.fillText('H', hp.x, hp.y + 15); ctx.textAlign = 'left'; }
      // pasto de cavalos com cerca branca
      const px = x + 2 * T, py = y + 11.2 * T, pw = 6 * T, ph = 4.4 * T;
      cerca(ctx, px, py, pw, ph, '#f2eee2');
      for (let q = 0; q < 3; q++) animal(ctx, px + 30 + r() * (pw - 60), py + 24 + r() * (ph - 48), 'cavalo', r() * TAU, r());
      // muro e portão da propriedade
      const fx = x + 5, fy = y + 5, fw = w - 10, fh2 = h - 10, gx = blk.alameda ? blk.alameda.x : x + w / 2;
      ctx.fillStyle = '#e8e2d2'; ctx.fillRect(fx, fy, fw, 5); ctx.fillRect(fx, fy, 5, fh2); ctx.fillRect(fx + fw - 5, fy, 5, fh2);
      ctx.fillRect(fx, fy + fh2 - 5, gx - T - 6 - fx, 5); ctx.fillRect(gx + T + 6, fy + fh2 - 5, fx + fw - gx - T - 6, 5);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(fx, fy + 5, fw, 3);
      [gx - T - 8, gx + T + 2].forEach(pxx => { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(pxx + 3, fy + fh2 - 22, 12, 24); ctx.fillStyle = '#d6cdb6'; ctx.fillRect(pxx, fy + fh2 - 24, 12, 24); ctx.fillStyle = '#8a8270'; ctx.fillRect(pxx - 1, fy + fh2 - 26, 14, 4); ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(pxx + 6, fy + fh2 - 30, 3, 0, TAU); ctx.fill(); });
      // placa do dono
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(gx - 90 + 2, fy + fh2 - 62, 180, 22); ctx.fillStyle = '#2a2018'; ctx.fillRect(gx - 90, fy + fh2 - 64, 180, 22); ctx.strokeStyle = '#c8a24a'; ctx.lineWidth = 1.5; ctx.strokeRect(gx - 89, fy + fh2 - 63, 178, 20);
      ctx.fillStyle = '#ffd84a'; ctx.font = 'bold 9px Arial'; ctx.textAlign = 'center'; ctx.fillText('FAZENDA PARTICULAR', gx, fy + fh2 - 54); ctx.fillStyle = '#fff'; ctx.fillText(blk.fazenda.dono, gx, fy + fh2 - 44); ctx.textAlign = 'left';
    }
  };
  function q_trator(blk, k) { return ((blk.bx * 7 + blk.by * 3 + k) % 4) === 0; }
})(window.G = window.G || {});
