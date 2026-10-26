/* =====================================================================
   MOBILIA4.JS — móveis de hospital, escritório, banco, estádio, barbearia e shopping:
   leito e maca, soro, monitor, cadeira de rodas, armário de remédios, máquina de lanche,
   biombo, bebedouro, balança, arquivo, caixa eletrônico, catraca, trave de gol,
   banco de reservas, arquibancada com torcida, bandeira, cadeira de barbeiro, poste de
   barbeiro, fonte do shopping e forno de pizza. Chão de gramado e linhas do campo.
   Convenção: o.x,o.y,o.w,o.h = pegada no chão; o.e = altura.
   ===================================================================== */
(function (G) {
  'use strict';
  const L = G.lugares, K = L.kit, D = G.deco, TAU = Math.PI * 2;
  const shade = K.shade, hh = K.hh, rr = D.rr, mix = D.mix, rng = D.rng;
  const reg = D.reg, caixa = D.caixa, sombra = D.sombra;
  const circ = (c, x, y, r, cor) => { c.fillStyle = cor; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const elip = (c, x, y, rx, ry, cor) => { c.fillStyle = cor; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); };
  const contorno = (c, x, y, w, h, r) => { c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 1; rr(c, x + 0.5, y + 0.5, w - 1, h - 1, r || 1); c.stroke(); };
  const brilho = (c, x, y, w, a) => { c.fillStyle = 'rgba(255,255,255,' + (a || 0.4) + ')'; c.fillRect(x, y, w, 1.2); };
  const aco = (c, x, y, w, h, r, claro) => { const g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, claro ? '#fafbfc' : '#eef1f4'); g.addColorStop(0.5, claro ? '#d8dde2' : '#c2c8ce'); g.addColorStop(1, claro ? '#aab1b8' : '#8a9199'); c.fillStyle = g; rr(c, x, y, w, h, r || 0); c.fill(); };
  const barra = (c, x, y, w, h, cor) => { const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, shade(cor, 0.35)); g.addColorStop(0.45, cor); g.addColorStop(1, shade(cor, -0.42)); c.fillStyle = g; c.fillRect(x, y, w, h); };
  const roda = (c, x, y, r) => { circ(c, x, y, r, '#23262d'); circ(c, x, y, r * 0.45, '#9aa2aa'); };

  // =====================================================================
  //  LEITO E MACA
  // =====================================================================
  function camaHosp(c, o, maca) {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || (maca ? 20 : 16), top = y - e, cor = o.cor || (maca ? '#9ec8e8' : '#6aa8d8');
    sombra(c, x, y, w, h, { dx: 4, dy: 8, r: 5 });
    if (!maca) {   // cabeceira: painel alto atrás do colchão
      const g = c.createLinearGradient(0, top - 18, 0, top + 6); g.addColorStop(0, '#eef2f5'); g.addColorStop(1, '#b8c2cc');
      c.fillStyle = g; rr(c, x + 1, top - 18, w - 2, 26, 3); c.fill(); contorno(c, x + 1, top - 18, w - 2, 26, 3);
      c.fillStyle = 'rgba(0,0,0,0.12)'; rr(c, x + 6, top - 13, w - 12, 12, 2); c.fill(); brilho(c, x + 3, top - 17, w - 6, 0.6);
    }
    caixa(c, x, y, w, h, e, '#f6f8fa', '#aeb6be', { r: 3, semSombra: true });
    // rodinhas
    roda(c, x + 7, y + h + 0.5, 3.4); roda(c, x + w - 7, y + h + 0.5, 3.4);
    // colchão e lençol
    c.fillStyle = '#e6ebef'; rr(c, x + 3, top + 3, w - 6, h - 6, 4); c.fill();
    // cobertor (parte de baixo)
    const by = top + h * (maca ? 0.3 : 0.36), bh = top + h - 4 - by;
    const gb = c.createLinearGradient(x, by, x + w, by + bh); gb.addColorStop(0, shade(cor, 0.16)); gb.addColorStop(1, shade(cor, -0.16));
    c.fillStyle = gb; rr(c, x + 4, by, w - 8, bh, 4); c.fill();
    c.fillStyle = '#f8fafc'; c.fillRect(x + 4, by, w - 8, 6); c.fillStyle = 'rgba(0,0,0,0.14)'; c.fillRect(x + 4, by + 6, w - 8, 1.4);   // dobra do lençol
    c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 1; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x + 8, by + 8 + k * bh / 4.4); c.quadraticCurveTo(x + w / 2, by + 4 + k * bh / 4.4, x + w - 8, by + 9 + k * bh / 4.4); c.stroke(); }
    if (maca) { c.fillStyle = '#2a3a5a'; c.fillRect(x + 4, by + bh * 0.42, w - 8, 3.4); c.fillStyle = '#c8d0d8'; c.fillRect(x + w / 2 - 3, by + bh * 0.42 - 0.5, 6, 4.4); }
    // travesseiro
    const pw = w * 0.66, ph = Math.min(17, h * 0.2);
    c.fillStyle = 'rgba(0,0,0,0.18)'; rr(c, x + (w - pw) / 2 + 1, top + 6, pw, ph, 6); c.fill();
    c.fillStyle = '#fdfdfd'; rr(c, x + (w - pw) / 2, top + 5, pw, ph, 6); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = 1; rr(c, x + (w - pw) / 2 + 0.5, top + 5.5, pw - 1, ph - 1, 6); c.stroke();
    // grades laterais
    [x - 1, x + w - 3].forEach(px => { c.fillStyle = '#d0d7de'; c.fillRect(px, top + 9, 4, h - 20); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(px + 0.5, top + 9, 1, h - 20); c.fillStyle = '#8a929a'; c.fillRect(px + 1, top + 9, 1, h - 20); c.fillRect(px, top + 9, 4, 1.6); c.fillRect(px, top + h - 12, 4, 1.6); });
    // pé da cama
    c.fillStyle = '#d6dce2'; c.fillRect(x + 2, top + h - 5, w - 4, 4); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + 2, top + h - 1.5, w - 4, 1.5);
  }
  reg('leito', (c, o) => camaHosp(c, o, false), { alto: 24 });
  reg('maca', (c, o) => camaHosp(c, o, true), { alto: 6 });

  // =====================================================================
  //  SORO, MONITOR, CADEIRA DE RODAS
  // =====================================================================
  reg('soro', (c, o) => {
    const cx = o.x + o.w / 2, cy = o.y + o.h - 5, e = o.e || 72;
    elip(c, cx + 3, cy + 3, 13, 5, 'rgba(0,0,0,0.22)');
    c.strokeStyle = '#9aa2aa'; c.lineWidth = 2.2; c.lineCap = 'round';
    [[-12, 2], [12, 2], [-7, 6], [7, 6], [0, -4]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + dx, cy + dy); c.stroke(); });
    [[-12, 2], [12, 2], [-7, 6], [7, 6]].forEach(([dx, dy]) => circ(c, cx + dx, cy + dy + 1, 1.9, '#23262d'));
    barra(c, cx - 1.5, cy - e, 3, e, '#c8d0d8');
    c.strokeStyle = '#c8d0d8'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 10, cy - e + 2); c.lineTo(cx + 10, cy - e + 2); c.stroke();
    // bolsa de soro pendurada
    const bx = cx - 14, by = cy - e + 4;
    c.fillStyle = 'rgba(225,240,250,0.92)'; rr(c, bx, by, 12, 24, 4); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 1; rr(c, bx + 0.5, by + 0.5, 11, 23, 4); c.stroke();
    c.fillStyle = 'rgba(90,170,230,0.75)'; rr(c, bx + 2, by + 9, 8, 13, 3); c.fill(); c.fillStyle = '#e8f4ff'; c.fillRect(bx + 2, by + 4, 8, 4); c.fillStyle = '#c8302a'; c.fillRect(bx + 3, by + 5, 4, 1.4);
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(bx + 2, by + 2, 1.6, 18);
    // gotejador e tubinho
    c.fillStyle = '#e8f4ff'; rr(c, bx + 4, by + 24, 4, 7, 1.5); c.fill(); contorno(c, bx + 4, by + 24, 4, 7, 1.5);
    c.strokeStyle = 'rgba(215,235,248,0.95)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(bx + 6, by + 31); c.bezierCurveTo(bx + 6, by + 46, cx + 20, by + 36, cx + 22, cy - e * 0.3); c.stroke();
  }, { alto: 14 });

  reg('monitor_vital', (c, o) => {
    const cx = o.x + o.w / 2, cy = o.y + o.h - 4, e = o.e || 48;
    elip(c, cx + 2, cy + 2, 14, 5, 'rgba(0,0,0,0.22)');
    c.strokeStyle = '#7a828a'; c.lineWidth = 2; [[-11, 3], [11, 3]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(cx, cy - 4); c.lineTo(cx + dx, cy + dy); c.stroke(); roda(c, cx + dx, cy + dy + 1.4, 2); });
    barra(c, cx - 2, cy - e + 22, 4, e - 22, '#9aa2aa');
    const mw = 36, mh = 26, mx = cx - mw / 2, my = cy - e;
    c.fillStyle = 'rgba(0,0,0,0.3)'; rr(c, mx + 2, my + 3, mw, mh, 3); c.fill();
    aco(c, mx, my, mw, mh, 3, false); contorno(c, mx, my, mw, mh, 3);
    c.fillStyle = '#05080c'; rr(c, mx + 3, my + 3, mw - 6, mh - 9, 2); c.fill();
    c.strokeStyle = 'rgba(80,200,120,0.18)'; c.lineWidth = 1; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(mx + 3 + k * (mw - 6) / 4, my + 3); c.lineTo(mx + 3 + k * (mw - 6) / 4, my + mh - 6); c.stroke(); }
    c.fillStyle = '#4a5058'; for (let k = 0; k < 4; k++) c.fillRect(mx + 5 + k * 7, my + mh - 5, 5, 2.4);
    circ(c, mx + mw - 5, my + mh - 4, 1.3, '#e84a4a');
  }, {
    alto: 8, din(ctx, o, t) {
      const cx = o.x + o.w / 2, cy = o.y + o.h - 4, e = o.e || 48, mw = 36, mh = 26, mx = cx - mw / 2, my = cy - e;
      ctx.save(); ctx.beginPath(); ctx.rect(mx + 3, my + 3, mw - 6, mh - 9); ctx.clip();
      ctx.strokeStyle = '#4af08a'; ctx.lineWidth = 1.3; ctx.beginPath();
      for (let i = 0; i <= 30; i++) { const ph = ((i / 30) * 2 + t * 1.2) % 1, v = ph < 0.08 ? -9 * Math.sin(ph / 0.08 * Math.PI) : ph < 0.14 ? 5 * Math.sin((ph - 0.08) / 0.06 * Math.PI) : 0; const px = mx + 3 + i * (mw - 6) / 30, py = my + 3 + (mh - 9) * 0.55 - v * 0.8; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.stroke(); ctx.restore();
      ctx.fillStyle = '#f2e84a'; ctx.font = 'bold 6px Arial'; ctx.fillText('72', mx + mw - 14, my + 9); ctx.fillStyle = '#5ac8ff'; ctx.fillText('98', mx + mw - 14, my + 16);
      if (Math.sin(t * 7) > 0.6) circ(ctx, mx + 6, my + 7, 1.2, '#e84a4a');
    }
  });

  reg('cadeira_rodas', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, cor = o.cor || '#2a4a7a';
    sombra(c, x, y, w, h, { dx: 3, dy: 5, r: 6 });
    // rodas grandes dos lados (vistas de cima)
    [x - 1, x + w - 4].forEach(px => { c.fillStyle = '#1c1f24'; rr(c, px, y + 5, 5, h * 0.62, 2); c.fill(); c.strokeStyle = '#9aa2aa'; c.lineWidth = 1; rr(c, px + 0.5, y + 5.5, 4, h * 0.62 - 1, 2); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); for (let k = 0; k < 4; k++) { c.moveTo(px + 1, y + 9 + k * 5); c.lineTo(px + 4, y + 9 + k * 5); } c.stroke(); });
    // rodinhas da frente e apoio dos pés
    roda(c, x + 6, y + h - 3, 2.6); roda(c, x + w - 6, y + h - 3, 2.6);
    c.fillStyle = '#8a929a'; rr(c, x + 7, y + h - 9, w - 14, 5, 2); c.fill();
    // assento e encosto
    const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, shade(cor, 0.2)); g.addColorStop(1, shade(cor, -0.2));
    c.fillStyle = g; rr(c, x + 4, y + 9, w - 8, h * 0.5, 4); c.fill(); contorno(c, x + 4, y + 9, w - 8, h * 0.5, 4);
    c.fillStyle = shade(cor, -0.1); rr(c, x + 4, y - 4, w - 8, 14, 4); c.fill(); contorno(c, x + 4, y - 4, w - 8, 14, 4); brilho(c, x + 7, y - 3, w - 14, 0.4);
    // apoios de braço e manoplas
    c.fillStyle = '#16181e'; c.fillRect(x + 3, y + 3, 3, 12); c.fillRect(x + w - 6, y + 3, 3, 12);
    c.fillStyle = '#16181e'; rr(c, x + 3, y - 7, 5, 4, 1.5); c.fill(); rr(c, x + w - 8, y - 7, 5, 4, 1.5); c.fill();
  }, { alto: 14 });

  // =====================================================================
  //  ARMÁRIO DE REMÉDIOS, MÁQUINA DE LANCHE, BIOMBO, BEBEDOURO, BALANÇA, ARQUIVO
  // =====================================================================
  reg('armario_med', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 70, fy = y + h - e;
    caixa(c, x, y, w, h, e, '#e8edf0', '#d4dce2', { r: 2 });
    // metade de cima: vidro com frascos
    const gh = e * 0.52, n = Math.max(2, Math.round(w / 28)), pw = (w - 6) / n;
    for (let i = 0; i < n; i++) {
      const px = x + 3 + i * pw; c.fillStyle = '#7a8c98'; rr(c, px + 1, fy + 4, pw - 2, gh, 2); c.fill(); c.fillStyle = '#c8dae6'; rr(c, px + 2, fy + 5, pw - 4, gh - 2, 2); c.fill();
      c.fillStyle = 'rgba(40,60,80,0.25)'; c.fillRect(px + 2, fy + 5 + gh * 0.5, pw - 4, 1.4);
      for (let k = 0; k < 2; k++) for (let j = 0; j < 3; j++) { const bx = px + 5 + j * ((pw - 10) / 3), by = fy + 8 + k * gh * 0.5, cc = ['#e8402a', '#2a58b8', '#f2c82a', '#2f9a4a', '#f4f4f4'][(i * 7 + j * 3 + k) % 5]; c.fillStyle = cc; c.fillRect(bx, by + 4, 4.5, 8); c.fillStyle = '#f4f4f4'; c.fillRect(bx + 0.8, by + 2, 2.8, 2.4); }
      c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.moveTo(px + 3, fy + 5); c.lineTo(px + 9, fy + 5); c.lineTo(px + 4, fy + 4 + gh); c.lineTo(px + 2, fy + 4 + gh); c.closePath(); c.fill();
      c.fillStyle = '#9aa4ac'; c.fillRect(px + pw - 6, fy + 4 + gh * 0.5, 2, 6);
    }
    // metade de baixo: portas lisas com cruz vermelha
    c.fillStyle = 'rgba(0,0,0,0.16)'; c.fillRect(x + 2, fy + gh + 8, w - 4, 1.4);
    for (let i = 0; i < n; i++) { const px = x + 3 + i * pw; c.strokeStyle = 'rgba(0,0,0,0.22)'; c.strokeRect(px + 1.5, fy + gh + 11.5, pw - 3, e - gh - 18); c.fillStyle = '#9aa4ac'; c.fillRect(px + pw - 6, fy + gh + 16, 2, 7); }
    c.fillStyle = '#d93636'; c.fillRect(x + w / 2 - 1.8, fy + gh + 15, 3.6, 11); c.fillRect(x + w / 2 - 5.5, fy + gh + 18.6, 11, 3.6);
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + 2, y + h - 3, w - 4, 3);
  }, { alto: 8 });

  reg('maquina_venda', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 78, fy = y + h - e, cor = o.cor || '#c8302a';
    caixa(c, x, y, w, h, e, shade(cor, 0.1), cor, { r: 3 });
    // letreiro aceso
    c.fillStyle = '#fff4c8'; rr(c, x + 4, fy + 4, w - 8, 9, 2); c.fill(); c.fillStyle = shade(cor, -0.2); c.font = 'bold 7px Arial'; c.textAlign = 'center'; c.fillText(o.nome || 'LANCHES', x + w / 2, fy + 11.2); c.textAlign = 'left';
    // vitrine com produtos
    const vx = x + 4, vy = fy + 16, vw = w * 0.66, vh = e - 36;
    c.fillStyle = '#0d1014'; rr(c, vx, vy, vw, vh, 2); c.fill();
    const r = rng((x * 7 + y) | 0), nl = 5, lh = vh / nl;
    for (let l = 0; l < nl; l++) {
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(vx + 1, vy + (l + 1) * lh - 2, vw - 2, 1.6);
      for (let k = 0; k < 5; k++) { const bw = (vw - 6) / 5, bx = vx + 3 + k * bw; c.fillStyle = ['#e8402a', '#f2c82a', '#2a58b8', '#2f9a4a', '#e84a8a', '#f08a2a', '#8a4fc2'][(r() * 7) | 0]; rr(c, bx + 0.8, vy + l * lh + 3, bw - 2, lh - 6, 1.4); c.fill(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(bx + 1.6, vy + l * lh + 4, bw - 4, 1.2); }
    }
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.moveTo(vx + 2, vy); c.lineTo(vx + 14, vy); c.lineTo(vx + 3, vy + vh); c.lineTo(vx + 1, vy + vh); c.closePath(); c.fill();
    // painel lateral: teclado e moedeiro
    const px = x + w * 0.72, pw = w * 0.24; c.fillStyle = '#2a2d34'; rr(c, px, vy, pw, vh * 0.7, 2); c.fill();
    c.fillStyle = '#4af08a'; c.fillRect(px + 2, vy + 3, pw - 4, 5); for (let k = 0; k < 6; k++) { c.fillStyle = '#c8ccd2'; c.fillRect(px + 2 + (k % 2) * (pw / 2 - 1), vy + 12 + ((k / 2) | 0) * 6, pw / 2 - 3, 4); }
    c.fillStyle = '#0d1014'; c.fillRect(px + 3, vy + vh * 0.7 - 7, pw - 6, 2.4);
    // bandeja de retirada
    c.fillStyle = '#0d1014'; rr(c, vx, vy + vh + 3, vw, 8, 2); c.fill(); c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(vx + 2, vy + vh + 4, vw - 4, 1.4);
  }, { alto: 8 });

  reg('biombo', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 72, cor = o.cor || '#9ccab8', fy = y + h - e;
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(x + 3, y + h - 1, w, 4);
    // cortina com dobras
    const g = c.createLinearGradient(x, 0, x + w, 0); const n = Math.max(3, Math.round(w / 12));
    for (let i = 0; i < n; i++) { const a = x + i * w / n, b = x + (i + 1) * w / n; const gg = c.createLinearGradient(a, 0, b, 0); gg.addColorStop(0, shade(cor, -0.2)); gg.addColorStop(0.5, shade(cor, 0.16)); gg.addColorStop(1, shade(cor, -0.22)); c.fillStyle = gg; c.fillRect(a, fy + 3, b - a + 0.6, e - 14); }
    // faixa de tela no alto
    c.fillStyle = 'rgba(255,255,255,0.28)'; c.fillRect(x, fy + 3, w, 14); c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1; for (let i = 0; i <= w; i += 4) { c.beginPath(); c.moveTo(x + i, fy + 3); c.lineTo(x + i, fy + 17); c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(x, fy + e - 11, w, 1.4);
    // trilho e argolas
    c.fillStyle = '#c8d0d8'; c.fillRect(x - 2, fy, w + 4, 3); brilho(c, x - 2, fy, w + 4, 0.7);
    for (let i = 0; i < w; i += 9) { c.strokeStyle = '#d8dee4'; c.lineWidth = 1.2; c.beginPath(); c.arc(x + 4 + i, fy + 5, 2, 0, TAU); c.stroke(); }
    // pés com rodinhas
    barra(c, x - 1, fy + 3, 3, e - 3, '#c8d0d8'); barra(c, x + w - 2, fy + 3, 3, e - 3, '#c8d0d8'); roda(c, x, y + h, 2.4); roda(c, x + w, y + h, 2.4);
  }, { alto: 8 });

  reg('bebedouro', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 62, cx = x + w / 2, fy = y + h - e;
    sombra(c, x, y, w, h, { dx: 3, dy: 5, r: 5 });
    caixa(c, x + 2, y + 2, w - 4, h - 2, e * 0.62, '#dfe4e8', '#c2cad2', { r: 3, semSombra: true });
    // torneiras e bandeja
    const ty = y + h - e * 0.62 + 8;
    c.fillStyle = '#3a8ad8'; c.fillRect(cx - 7, ty, 4, 5); c.fillStyle = '#d84a3a'; c.fillRect(cx + 3, ty, 4, 5);
    c.fillStyle = '#8a929a'; rr(c, cx - 9, ty + 9, 18, 4, 1.4); c.fill(); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(cx - 8, ty + 10, 16, 1.4);
    // galão de água emborcado
    const gx = cx - 10, gy = fy - 2;
    const gg = c.createLinearGradient(gx, 0, gx + 20, 0); gg.addColorStop(0, 'rgba(120,190,240,0.95)'); gg.addColorStop(0.5, 'rgba(190,225,250,0.95)'); gg.addColorStop(1, 'rgba(90,160,220,0.95)');
    c.fillStyle = gg; rr(c, gx, gy, 20, 26, 8); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1; rr(c, gx + 0.5, gy + 0.5, 19, 25, 8); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.65)'; c.fillRect(gx + 3, gy + 4, 2, 15); c.fillStyle = 'rgba(30,90,160,0.4)'; c.fillRect(gx + 14, gy + 6, 2, 14);
    c.fillStyle = '#d0d6dc'; rr(c, gx + 5, gy + 24, 10, 4, 1.4); c.fill();
  }, { alto: 10 });

  reg('balanca', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h;
    caixa(c, x, y, w, h, 7, '#dfe4e8', '#8a929a', { r: 4 });
    c.fillStyle = '#c0c8d0'; rr(c, x + 4, y - 7 + 4, w - 8, h - 8, 3); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = 1; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(x + 7, y - 3 + k * (h - 10) / 4 + 2); c.lineTo(x + w - 7, y - 3 + k * (h - 10) / 4 + 2); c.stroke(); }
    // coluna com visor e régua de altura
    caixa(c, x + w - 12, y - 6, 8, 5, 46, '#c8cdd2', '#a8aeb6', { r: 2, semSombra: true });
    c.fillStyle = '#05080c'; rr(c, x + w - 11, y - 6 - 46 + 4, 6, 8, 1); c.fill(); c.fillStyle = '#4af08a'; c.fillRect(x + w - 10, y - 6 - 46 + 6, 4, 2);
    c.fillStyle = '#16181e'; c.fillRect(x + 4, y - 6 - 46 + 14, 3, 40); c.fillStyle = '#f2f2f2'; for (let k = 0; k < 10; k++) c.fillRect(x + 4, y - 6 - 46 + 16 + k * 4, 3, 1);
  }, { alto: 12 });

  reg('arquivo', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 56, cor = o.cor || '#7f8f93', fy = y + h - e;
    caixa(c, x, y, w, h, e, shade(cor, 0.15), cor, { r: 2 });
    const n = 4, gh = (e - 6) / n;
    for (let i = 0; i < n; i++) {
      const gy = fy + 3 + i * gh; c.fillStyle = 'rgba(0,0,0,0.22)'; rr(c, x + 3, gy + 1, w - 6, gh - 2, 1.5); c.fill(); c.fillStyle = shade(cor, 0.08); rr(c, x + 3, gy, w - 6, gh - 2, 1.5); c.fill(); contorno(c, x + 3, gy, w - 6, gh - 2, 1.5);
      c.fillStyle = '#e8e4d0'; c.fillRect(x + w / 2 - 6, gy + 2, 12, 3.6); c.fillStyle = '#2a2d34'; c.fillRect(x + w / 2 - 5, gy + 3, 7, 1);
      c.fillStyle = '#d0d6dc'; rr(c, x + w / 2 - 5, gy + gh - 6, 10, 2.6, 1); c.fill(); brilho(c, x + w / 2 - 5, gy + gh - 6, 10, 0.7);
    }
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x + 1, y + h - 2.4, w - 2, 2.4);
  }, { alto: 8 });

  reg('caixa_eletronico', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 62, fy = y + h - e, cor = o.cor || '#23406e';
    caixa(c, x, y, w, h, e, shade(cor, 0.2), cor, { r: 3 });
    c.fillStyle = '#e8f0ff'; rr(c, x + 4, fy + 3, w - 8, 9, 2); c.fill(); c.fillStyle = cor; c.font = 'bold 6.5px Arial'; c.textAlign = 'center'; c.fillText('24 HORAS', x + w / 2, fy + 10); c.textAlign = 'left';
    c.fillStyle = '#05080c'; rr(c, x + 5, fy + 15, w - 10, 20, 2); c.fill(); c.fillStyle = '#3a9af0'; rr(c, x + 7, fy + 17, w - 14, 16, 1.5); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(x + 9, fy + 20, w - 22, 2); c.fillRect(x + 9, fy + 25, w - 28, 2); c.fillStyle = '#ffe04a'; c.fillRect(x + w - 15, fy + 27, 6, 3);
    for (let k = 0; k < 12; k++) { c.fillStyle = '#c8ccd2'; c.fillRect(x + 7 + (k % 3) * 8, fy + 38 + ((k / 3) | 0) * 4.4, 6, 3); }
    c.fillStyle = '#0d1014'; c.fillRect(x + w - 12, fy + 38, 7, 2); c.fillStyle = '#0d1014'; rr(c, x + 6, fy + e - 8, w - 12, 4, 1.5); c.fill();
  }, { alto: 8 });

  // =====================================================================
  //  ESTÁDIO: catraca, trave, banco de reservas, arquibancada, bandeira
  // =====================================================================
  reg('catraca', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 36, cx = x + w / 2, topo = y + h - e;
    sombra(c, x, y, w, h, { dx: 3, dy: 5, r: 4 });
    caixa(c, x + w * 0.1, y, w * 0.8, h, e, '#d0d6dc', '#9aa2aa', { r: 3, semSombra: true });
    c.fillStyle = '#2f9a4a'; c.beginPath(); c.moveTo(cx - 4, topo + 8); c.lineTo(cx + 4, topo + 8); c.lineTo(cx, topo + 14); c.closePath(); c.fill();
    c.fillStyle = '#16181e'; rr(c, cx - 5, topo + 17, 10, 5, 1.5); c.fill(); c.fillStyle = '#4af08a'; c.fillRect(cx - 3, topo + 18.4, 6, 1.6);
    // braços giratórios (3 barras)
    c.strokeStyle = '#c8d0d8'; c.lineWidth = 3; c.lineCap = 'round';
    [[-1, -0.1], [1, -0.1], [0, 1]].forEach(([dx, dy], i) => { c.beginPath(); c.moveTo(cx, topo - 6); c.lineTo(cx + dx * w * 0.42, topo - 6 + dy * 12 + (i === 2 ? 0 : 6)); c.stroke(); });
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1; [[-1, 0.1], [1, 0.1]].forEach(([dx]) => { c.beginPath(); c.moveTo(cx, topo - 7); c.lineTo(cx + dx * w * 0.42, topo - 1); c.stroke(); });
    circ(c, cx, topo - 6, 3.4, '#aab2ba'); circ(c, cx, topo - 6.6, 1.6, '#e8edf0');
  }, { alto: 14 });

  reg('trave', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 48, rede = 'rgba(240,244,248,0.6)', dir = o.dir || 'n';
    if (dir === 'w' || dir === 'e') {          // gol na lateral: a boca do gol vai de y até y+h; a rede é para o lado
      const gx = dir === 'w' ? x + w : x, sg = dir === 'w' ? -1 : 1, prof = w;
      const tras = gx + sg * prof, topoTras = e * 0.55;
      c.fillStyle = 'rgba(0,0,0,0.16)'; c.fillRect(Math.min(gx, tras) + 3, y + 2, prof, h + 5);
      // fundo e teto da rede
      c.fillStyle = 'rgba(210,220,230,0.2)'; c.beginPath(); c.moveTo(gx, y - e); c.lineTo(gx, y + h - e); c.lineTo(tras, y + h - topoTras); c.lineTo(tras, y - topoTras); c.closePath(); c.fill();
      c.fillStyle = 'rgba(210,220,230,0.14)'; c.beginPath(); c.moveTo(tras, y - topoTras); c.lineTo(tras, y + h - topoTras); c.lineTo(tras, y + h); c.lineTo(tras, y); c.closePath(); c.fill();
      c.fillStyle = 'rgba(210,220,230,0.16)'; c.beginPath(); c.moveTo(gx, y); c.lineTo(gx, y - e); c.lineTo(tras, y - topoTras); c.lineTo(tras, y); c.closePath(); c.fill();
      c.strokeStyle = rede; c.lineWidth = 0.8; c.beginPath();
      for (let k = 0; k <= prof; k += 5) { c.moveTo(gx + sg * k, y - e + (e - topoTras) * k / prof); c.lineTo(gx + sg * k, y + h - e + (e - topoTras) * k / prof); }
      for (let k = 0; k <= h; k += 5) { c.moveTo(gx, y - e + k); c.lineTo(tras, y - topoTras + k); }
      for (let k = 0; k <= e; k += 5) { c.moveTo(tras, y - topoTras + (k / e) * topoTras); c.lineTo(tras, y + h - topoTras + (k / e) * topoTras); }
      c.stroke();
      barra(c, gx - 2, y - e - 1, 4, e + 2, '#f2f4f6'); barra(c, gx - 2, y + h - e - 1, 4, e + 3, '#f2f4f6');
      c.fillStyle = '#f2f4f6'; c.fillRect(gx - 2, y - e - 2, 4, h + 5); c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(gx - 2, y - e - 2, 1.2, h + 5);
      elip(c, gx, y + 1, 3.4, 1.6, 'rgba(0,0,0,0.35)'); elip(c, gx, y + h + 1, 3.4, 1.6, 'rgba(0,0,0,0.35)');
      return;
    }
    // gol de frente (rede vai para trás, para o norte)
    const prof = 22, base = y + h;
    c.fillStyle = 'rgba(0,0,0,0.16)'; c.fillRect(x + 4, base - 2, w, 10);
    c.fillStyle = 'rgba(210,220,230,0.22)'; c.beginPath(); c.moveTo(x, base - e); c.lineTo(x + w, base - e); c.lineTo(x + w - 6, base - e - prof); c.lineTo(x + 6, base - e - prof); c.closePath(); c.fill();
    c.fillStyle = 'rgba(210,220,230,0.16)'; c.beginPath(); c.moveTo(x + 6, base - e - prof); c.lineTo(x + w - 6, base - e - prof); c.lineTo(x + w - 6, base - prof * 0.4); c.lineTo(x + 6, base - prof * 0.4); c.closePath(); c.fill();
    c.strokeStyle = rede; c.lineWidth = 0.8; c.beginPath();
    for (let i = 0; i <= w; i += 5) { c.moveTo(x + i, base - e); c.lineTo(x + 6 + (i / w) * (w - 12), base - e - prof); c.moveTo(x + 6 + (i / w) * (w - 12), base - e - prof); c.lineTo(x + 6 + (i / w) * (w - 12), base - prof * 0.4); }
    for (let j = 0; j <= prof; j += 4) { c.moveTo(x + j * 0.27, base - e - j); c.lineTo(x + w - j * 0.27, base - e - j); }
    for (let j = 0; j <= e - prof * 0.6; j += 5) { c.moveTo(x + 6, base - e - prof + j); c.lineTo(x + w - 6, base - e - prof + j); }
    c.stroke();
    barra(c, x - 2, base - e - 1, 4, e + 1, '#f2f4f6'); barra(c, x + w - 2, base - e - 1, 4, e + 1, '#f2f4f6');
    c.fillStyle = '#f2f4f6'; c.fillRect(x - 2, base - e - 2, w + 4, 4); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x - 2, base - e + 2, w + 4, 1.2);
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(x - 2, base - e - 2, w + 4, 1.2);
    elip(c, x, base + 1, 3.4, 1.6, 'rgba(0,0,0,0.35)'); elip(c, x + w, base + 1, 3.4, 1.6, 'rgba(0,0,0,0.35)');
  }, { alto: 34, pad: 40 });

  reg('banco_reserva', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 46, cor = o.cor || '#2a58b8';
    sombra(c, x, y, w, h, { dx: 4, dy: 7, r: 4 });
    // banco com assentos coloridos
    caixa(c, x, y + h - 14, w, 14, 12, '#d8dde2', shade(cor, -0.1), { r: 3, semSombra: true });
    const n = Math.max(2, Math.round(w / 34)), sw = (w - 8) / n;
    for (let i = 0; i < n; i++) { c.fillStyle = cor; rr(c, x + 4 + i * sw + 1, y + h - 24, sw - 2, 11, 3); c.fill(); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x + 6 + i * sw, y + h - 23, sw - 5, 1.4); contorno(c, x + 4 + i * sw + 1, y + h - 24, sw - 2, 11, 3); }
    // cobertura de acrílico transparente
    const ty = y + h - e;
    c.fillStyle = 'rgba(170,215,240,0.32)'; c.beginPath(); c.moveTo(x - 4, ty + 6); c.lineTo(x + w + 4, ty + 6); c.lineTo(x + w + 2, y + h - 8); c.lineTo(x - 2, y + h - 8); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(x + 8, ty + 6); c.lineTo(x + 30, ty + 6); c.lineTo(x + 14, y + h - 8); c.lineTo(x + 2, y + h - 8); c.closePath(); c.fill();
    c.fillStyle = '#c8d0d8'; c.fillRect(x - 4, ty + 3, w + 8, 4); brilho(c, x - 4, ty + 3, w + 8, 0.7);
    barra(c, x - 4, ty + 6, 3, e - 12, '#aab2ba'); barra(c, x + w + 1, ty + 6, 3, e - 12, '#aab2ba');
  }, { alto: 10 });

  // arquibancada: degraus com assentos; torcida só aparece na hora do jogo (din)
  const CORES_TORCIDA = ['#e8402a', '#f2f2f2', '#2a58b8', '#f2c82a', '#2f9a4a', '#e84a8a'];
  reg('arquibancada', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 60, n = o.n || 5, cor = o.cor || '#aab4c0', r = rng((x * 13 + y) | 0);
    const tot = h + e, bh = tot / n, top = y - e;
    sombra(c, x, y, w, h, { dx: 4, dy: 6, r: 3 });
    for (let i = 0; i < n; i++) {
      const by = top + i * bh;
      // degrau: assento (claro) e espelho vertical (escuro)
      c.fillStyle = shade(cor, 0.12 - i * 0.015); c.fillRect(x, by, w, bh * 0.58);
      c.fillStyle = shade(cor, -0.3 - i * 0.02); c.fillRect(x, by + bh * 0.58, w, bh * 0.42);
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x, by, w, 1.2); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x, by + bh - 1.2, w, 1.2);
      // cadeiras
      for (let k = x + 4; k < x + w - 10; k += 13) { c.fillStyle = shade(o.cadeira || '#2a58b8', (r() - 0.5) * 0.12); rr(c, k, by + 1, 9, bh * 0.5, 2); c.fill(); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(k + 1, by + 1.5, 7, 1); }
    }
    // escadas laterais e murinho
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x, top, 3, tot); c.fillRect(x + w - 3, top, 3, tot);
    c.fillStyle = '#e8edf0'; c.fillRect(x, y + h - 5, w, 5); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x, y + h - 1.4, w, 1.4); brilho(c, x, y + h - 5, w, 0.6);
    contorno(c, x, top, w, tot, 1);
  }, {
    alto: 4, din(ctx, o, t) {
      if (!o.torcida) return;
      const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 60, n = o.n || 5, bh = (h + e) / n, top = y - e;
      const tem = typeof o.torcida === 'function' ? o.torcida() : o.torcida; if (!tem) return;
      const gol = tem === 'gol', jogo = tem === 'jogo' || gol;
      for (let i = 0; i < n; i++) {
        const by = top + i * bh;
        for (let k = x + 6, j = 0; k < x + w - 10; k += 13, j++) {
          const hs = hh(j * 3 + i, o.x * 0.1 + 1); if (hs < (jogo ? 0.12 : 0.62)) continue;
          const cc = CORES_TORCIDA[((hs * 100) | 0) % CORES_TORCIDA.length], pulo = jogo ? Math.abs(Math.sin(t * (gol ? 9 : 5) + hs * 20)) * (gol ? 6 : 3) : 0;
          const px = k + 4.5, py = by + bh * 0.3 - pulo;
          ctx.fillStyle = cc; rr(ctx, px - 4, py - 1, 8, 8, 3); ctx.fill();
          ctx.fillStyle = ['#e8c8a0', '#c8946a', '#8a5a3a', '#f2d4b0'][((hs * 40) | 0) % 4]; ctx.beginPath(); ctx.arc(px, py - 3, 3, 0, TAU); ctx.fill();
          if (jogo && (gol || hs > 0.7)) { ctx.fillStyle = cc; ctx.fillRect(px + 3, py - 8 - pulo * 0.4, 1.8, 6); }
        }
      }
    }
  });

  reg('bandeira', (c, o) => {
    const cx = o.x + o.w / 2, by = o.y + o.h - 3, e = o.e || 90, pais = o.pais || 'br', fw = 54, fh = 36, fy = by - e + 3, fx = cx + 2;
    elip(c, cx + 2, by + 1, 9, 3.4, 'rgba(0,0,0,0.3)'); elip(c, cx, by, 7, 3, '#4a4e58'); elip(c, cx, by - 1.4, 5.4, 2.2, '#8a929a');
    barra(c, cx - 1.5, fy - 4, 3, e, '#c8a24a'); circ(c, cx, fy - 5, 2.6, '#e8c870');
    c.save(); c.beginPath(); c.moveTo(fx, fy); for (let i = 0; i <= fw; i += 3) c.lineTo(fx + i, fy + Math.sin(i * 0.12) * 2.2); for (let i = fw; i >= 0; i -= 3) c.lineTo(fx + i, fy + fh + Math.sin(i * 0.12 + 0.6) * 2.2); c.closePath(); c.clip();
    if (pais === 'sp') {
      for (let k = 0; k < 13; k++) { c.fillStyle = k % 2 ? '#f6f6f6' : '#16161a'; c.fillRect(fx, fy + k * fh / 13 - 1, fw, fh / 13 + 1); }
      c.fillStyle = '#d02a2a'; c.fillRect(fx, fy - 2, fw * 0.42, fh * 0.56); circ(c, fx + fw * 0.21, fy + fh * 0.26, 6.6, '#f6f6f6'); circ(c, fx + fw * 0.21, fy + fh * 0.26, 4.8, '#1f3a8a');
    } else {
      c.fillStyle = '#1f8a3a'; c.fillRect(fx - 2, fy - 3, fw + 4, fh + 6);
      c.fillStyle = '#f6d82a'; c.beginPath(); c.moveTo(fx + fw / 2, fy + 3); c.lineTo(fx + fw - 6, fy + fh / 2); c.lineTo(fx + fw / 2, fy + fh - 3); c.lineTo(fx + 6, fy + fh / 2); c.closePath(); c.fill();
      circ(c, fx + fw / 2, fy + fh / 2, 8.6, '#2a4aa8'); c.strokeStyle = '#f6f6f6'; c.lineWidth = 1.6; c.beginPath(); c.arc(fx + fw / 2, fy + fh / 2 + 9, 11, Math.PI * 1.2, Math.PI * 1.8); c.stroke();
    }
    const gs = c.createLinearGradient(fx, 0, fx + fw, 0); for (let i = 0; i <= 6; i++) gs.addColorStop(i / 6, i % 2 ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)'); c.fillStyle = gs; c.fillRect(fx - 2, fy - 3, fw + 4, fh + 6);
    c.restore();
  }, { alto: 14, pad: 40 });

  // =====================================================================
  //  BARBEARIA: cadeira de barbeiro e poste
  // =====================================================================
  reg('cadeira_b', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, cx = x + w / 2, cor = o.cor || '#b8242a', e = o.e || 20;
    sombra(c, x + 2, y + 6, w - 4, h - 6, { dx: 3, dy: 6, r: 12, oval: true });
    // base redonda cromada
    elip(c, cx, y + h - 6, w * 0.34, 8, '#6a7078'); elip(c, cx, y + h - 8, w * 0.3, 6.4, '#c8d0d8'); elip(c, cx, y + h - 9, w * 0.2, 4, '#e8edf0');
    barra(c, cx - 4, y + h - 8 - e + 4, 8, e, '#b8c0c8');
    const ty = y + h - 8 - e;   // altura do assento
    // apoio dos pés
    c.fillStyle = '#9aa2aa'; rr(c, cx - 12, ty + 14, 24, 7, 2.5); c.fill(); c.fillStyle = '#16181e'; rr(c, cx - 10, ty + 15, 20, 3, 1.5); c.fill(); brilho(c, cx - 11, ty + 14, 22, 0.7);
    // assento de couro
    const g = c.createLinearGradient(x, ty - 6, x + w, ty + 14); g.addColorStop(0, shade(cor, 0.22)); g.addColorStop(1, shade(cor, -0.22));
    c.fillStyle = g; rr(c, x + 5, ty - 5, w - 10, 20, 8); c.fill(); contorno(c, x + 5, ty - 5, w - 10, 20, 8);
    c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = 1; rr(c, x + 9, ty - 2, w - 18, 14, 6); c.stroke();
    // braços cromados com pontas de couro
    [x + 1, x + w - 6].forEach(px => { c.fillStyle = '#c8d0d8'; rr(c, px, ty - 4, 5, 17, 2); c.fill(); c.fillStyle = shade(cor, -0.1); rr(c, px - 1, ty - 6, 7, 9, 3); c.fill(); contorno(c, px - 1, ty - 6, 7, 9, 3); });
    // encosto alto + apoio de cabeça (ao norte)
    const bg = c.createLinearGradient(0, ty - 34, 0, ty - 4); bg.addColorStop(0, shade(cor, 0.2)); bg.addColorStop(1, shade(cor, -0.3));
    c.fillStyle = bg; rr(c, x + 7, ty - 32, w - 14, 30, 8); c.fill(); contorno(c, x + 7, ty - 32, w - 14, 30, 8);
    c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = 1; [0.34, 0.68].forEach(k => { c.beginPath(); c.moveTo(x + 10, ty - 32 + k * 30); c.lineTo(x + w - 10, ty - 32 + k * 30); c.stroke(); });
    c.fillStyle = shade(cor, 0.1); rr(c, cx - 9, ty - 40, 18, 11, 5); c.fill(); contorno(c, cx - 9, ty - 40, 18, 11, 5); brilho(c, cx - 6, ty - 39, 12, 0.5);
    brilho(c, x + 10, ty - 31, w - 20, 0.4);
  }, { alto: 32 });

  reg('poste_barb', (c, o) => {
    const cx = o.x + o.w / 2, by = o.y + o.h - 2, e = o.e || 60, ww = 12;
    elip(c, cx + 2, by + 1, 9, 3.4, 'rgba(0,0,0,0.3)'); elip(c, cx, by - 1, 8, 3, '#2a2d34');
    const ty = by - e;
    c.fillStyle = '#e8edf0'; rr(c, cx - ww / 2, ty, ww, e - 3, 4); c.fill();
    c.save(); rr(c, cx - ww / 2, ty, ww, e - 3, 4); c.clip();
    for (let k = -2; k < 10; k++) { const yy = ty + k * 12; c.fillStyle = k % 3 === 0 ? '#d02a2a' : k % 3 === 1 ? '#2a4aa8' : '#f2f2f2'; c.beginPath(); c.moveTo(cx - ww / 2, yy); c.lineTo(cx + ww / 2, yy - 9); c.lineTo(cx + ww / 2, yy - 1); c.lineTo(cx - ww / 2, yy + 8); c.closePath(); c.fill(); }
    const gg = c.createLinearGradient(cx - ww / 2, 0, cx + ww / 2, 0); gg.addColorStop(0, 'rgba(0,0,0,0.28)'); gg.addColorStop(0.35, 'rgba(255,255,255,0.4)'); gg.addColorStop(1, 'rgba(0,0,0,0.38)'); c.fillStyle = gg; c.fillRect(cx - ww / 2, ty, ww, e);
    c.restore();
    circ(c, cx, ty - 1, 7, '#c8d0d8'); circ(c, cx, ty - 2.2, 5, '#e8edf0'); circ(c, cx, ty - 8, 3.4, '#d02a2a');
    c.fillStyle = '#c8d0d8'; rr(c, cx - 8, by - 5, 16, 5, 2); c.fill();
  }, { alto: 16 });

  // =====================================================================
  //  SHOPPING: fonte
  // =====================================================================
  reg('fonte', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, cx = x + w / 2, cy = y + h / 2 + 4, e = o.e || 16;
    sombra(c, x, y, w, h, { dx: 4, dy: 8, r: 20, oval: true });
    // borda de mármore (frente + topo)
    elip(c, cx, cy + 3, w / 2, h / 2, '#8a8478'); elip(c, cx, cy - e * 0.2, w / 2, h / 2, '#e8e2d6');
    elip(c, cx, cy - e * 0.2 + 1, w / 2 - 6, h / 2 - 5, '#bdb6a6');
    const ga = c.createLinearGradient(0, cy - h / 2, 0, cy + h / 2); ga.addColorStop(0, '#5ab0e0'); ga.addColorStop(1, '#2a78b8');
    c.fillStyle = ga; c.beginPath(); c.ellipse(cx, cy - e * 0.2 + 2, w / 2 - 9, h / 2 - 8, 0, 0, TAU); c.fill();
    // moedinhas no fundo
    for (let k = 0; k < 8; k++) circ(c, cx + (hh(k, 3) - 0.5) * (w - 40), cy + (hh(k, 7) - 0.5) * (h - 30), 1.4, 'rgba(255,230,140,0.8)');
    // coluna central com duas bacias
    barra(c, cx - 5, cy - e - 26, 10, 28, '#d8d2c4');
    elip(c, cx, cy - e - 8, 20, 8, '#cfc9ba'); elip(c, cx, cy - e - 9.5, 17, 6.4, '#8ac8ea');
    elip(c, cx, cy - e - 26, 11, 4.6, '#cfc9ba'); elip(c, cx, cy - e - 27, 8.4, 3.4, '#8ac8ea');
    circ(c, cx, cy - e - 32, 4, '#e8e2d6');
  }, {
    alto: 36, din(ctx, o, t) {
      const x = o.x, y = o.y, w = o.w, h = o.h, cx = x + w / 2, cy = y + h / 2 + 4, e = o.e || 16;
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) { const ph = (t * 0.7 + k / 3) % 1, rx = 8 + ph * (w / 2 - 20), ry = rx * (h / w); ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.ellipse(cx, cy - e * 0.2 + 3, rx, ry, 0, 0, TAU); ctx.stroke(); }
      ctx.globalAlpha = 1;
      // esguicho central e gotas
      ctx.strokeStyle = 'rgba(200,235,255,0.9)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx, cy - e - 33); ctx.lineTo(cx, cy - e - 44 + Math.sin(t * 6) * 1.5); ctx.stroke();
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, ph = (t * 1.4 + k * 0.13) % 1, rr2 = 4 + ph * 16; ctx.fillStyle = 'rgba(200,235,255,' + (0.9 - ph * 0.8) + ')'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rr2, cy - e - 26 + ph * ph * 22, 1.3, 0, TAU); ctx.fill(); }
    }
  });

  // =====================================================================
  //  PIZZARIA: forno de lenha
  // =====================================================================
  reg('forno', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 70, cx = x + w / 2, fy = y + h - e;
    caixa(c, x, y, w, h, e * 0.42, '#b86a4a', '#9a4a32', { r: 3 });
    // tijolinhos na base
    const bt = y + h - e * 0.42; c.fillStyle = 'rgba(0,0,0,0.25)'; for (let j = 0; j < 3; j++) { c.fillRect(x + 2, bt + 3 + j * 8, w - 4, 1); for (let i = (j % 2) * 8; i < w; i += 16) c.fillRect(x + 2 + i, bt + 3 + j * 8, 1, 8); }
    // cúpula
    const dg = c.createRadialGradient(cx - 10, fy + e * 0.4, 6, cx, fy + e * 0.55, w * 0.62); dg.addColorStop(0, '#d8a07a'); dg.addColorStop(1, '#8a4a30');
    c.fillStyle = dg; c.beginPath(); c.moveTo(x + 4, bt); c.quadraticCurveTo(x + 4, fy + 6, cx, fy + 4); c.quadraticCurveTo(x + w - 4, fy + 6, x + w - 4, bt); c.closePath(); c.fill(); contorno(c, x + 4, fy + 4, w - 8, bt - fy - 4, 6);
    c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = 1; for (let k = 1; k < 5; k++) { c.beginPath(); c.arc(cx, bt, k * (w / 2 - 4) / 4.4, Math.PI, TAU); c.stroke(); }
    // chaminé
    barra(c, cx - 7, fy - 20, 14, 28, '#7a4a38'); c.fillStyle = '#4a2a20'; c.fillRect(cx - 9, fy - 22, 18, 4);
    // boca do forno (arco escuro)
    const mw = w * 0.42, mx = cx - mw / 2, my = bt - e * 0.34;
    c.fillStyle = '#1a0c06'; c.beginPath(); c.moveTo(mx, bt - 2); c.lineTo(mx, my + 10); c.quadraticCurveTo(cx, my - 6, mx + mw, my + 10); c.lineTo(mx + mw, bt - 2); c.closePath(); c.fill();
    c.strokeStyle = '#6a4a38'; c.lineWidth = 3; c.stroke();
    // lenha empilhada ao lado
    for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? '#7a5230' : '#8a6038'; rr(c, x + w + 2, y + h - 8 - k * 5, 16, 5, 2); c.fill(); c.fillStyle = '#d8b078'; c.beginPath(); c.arc(x + w + 3, y + h - 5.5 - k * 5, 2, 0, TAU); c.fill(); }
  }, {
    alto: 30, din(ctx, o, t) {
      const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 70, cx = x + w / 2, bt = y + h - e * 0.42, mw = w * 0.42, my = bt - e * 0.34;
      ctx.save(); ctx.beginPath(); ctx.moveTo(cx - mw / 2 + 2, bt - 3); ctx.lineTo(cx - mw / 2 + 2, my + 12); ctx.quadraticCurveTo(cx, my - 2, cx + mw / 2 - 2, my + 12); ctx.lineTo(cx + mw / 2 - 2, bt - 3); ctx.closePath(); ctx.clip();
      const g = ctx.createRadialGradient(cx, bt, 2, cx, bt - 6, mw * 0.7); g.addColorStop(0, 'rgba(255,230,120,0.95)'); g.addColorStop(0.5, 'rgba(255,120,30,0.9)'); g.addColorStop(1, 'rgba(160,30,10,0.9)'); ctx.fillStyle = g; ctx.fillRect(cx - mw / 2, my, mw, bt - my);
      for (let k = 0; k < 4; k++) { const fx = cx - mw * 0.3 + k * mw * 0.2, fh = 10 + 6 * Math.sin(t * 8 + k * 2); ctx.fillStyle = 'rgba(255,200,60,0.9)'; ctx.beginPath(); ctx.moveTo(fx - 4, bt - 3); ctx.quadraticCurveTo(fx, bt - fh - 4, fx + 4, bt - 3); ctx.fill(); }
      ctx.restore();
    }
  });


  // banco de concreto com pernas de aço (pátio e corredor da prisão, estádio, praça)
  reg('banco_aco', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 12, cor = o.cor || '#9a9ea6';
    [x + 6, x + w - 12].forEach(px => { c.fillStyle = '#3a3e46'; c.fillRect(px, y + h - e + 2, 6, e - 2); });
    caixa(c, x, y, w, h, e * 0.55, cor, shade(cor, -0.3), { r: 2 });
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x + 3, y - e * 0.55 + 2, w - 6, 1.4);
    for (let k = 12; k < w - 8; k += 26) circ(c, x + k, y - e * 0.55 + h / 2, 1.3, '#555a62');
  }, { alto: 4 });

  // =====================================================================
  //  CHÃO DE GRAMADO + LINHAS DO CAMPO
  // =====================================================================
  D.PISOS.gramado = (c, X, Y, w, h, cs, sd) => {
    const r = rng(sd || 1), a = cs[0], b = cs[1], faixa = 44;
    for (let i = 0; i * faixa < w + faixa; i++) { c.fillStyle = i % 2 ? a : b; c.fillRect(X + i * faixa, Y, faixa + 1, h); }
    for (let k = 0; k < w * h / 55; k++) { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,30,0,0.08)'; c.fillRect(X + r() * w, Y + r() * h, 2, 3); }
    const g = c.createLinearGradient(0, Y, 0, Y + h); g.addColorStop(0, 'rgba(0,20,0,0.18)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,20,0,0.14)'); c.fillStyle = g; c.fillRect(X, Y, w, h);
  };
  // linhas brancas de um campo de futebol (gols nos lados esquerdo e direito), medidas de verdade
  // (campo de 105 x 68 m: x,y,w,h = o retângulo do campo em pixels)
  D.campoFutebol = (c, x, y, w, h) => {
    const s = w / 105, cx = x + w / 2, cy = y + h / 2;
    c.save(); c.strokeStyle = 'rgba(255,255,255,0.92)'; c.fillStyle = c.strokeStyle; c.lineWidth = 3; c.lineJoin = 'round';
    c.strokeRect(x, y, w, h);
    c.beginPath(); c.moveTo(cx, y); c.lineTo(cx, y + h); c.stroke();
    c.beginPath(); c.arc(cx, cy, 9.15 * s, 0, TAU); c.stroke(); c.beginPath(); c.arc(cx, cy, 3.6, 0, TAU); c.fill();
    const pa = 16.5 * s, pw = 40.32 * s, ga = 5.5 * s, gw = 18.32 * s, ps = 11 * s, rr9 = 9.15 * s, a0 = Math.acos((pa - ps) / rr9);
    [[x, 1], [x + w, -1]].forEach(([gx, sg]) => {
      c.strokeRect(sg > 0 ? gx : gx - pa, cy - pw / 2, pa, pw);
      c.strokeRect(sg > 0 ? gx : gx - ga, cy - gw / 2, ga, gw);
      c.beginPath(); c.arc(gx + sg * ps, cy, 3, 0, TAU); c.fill();
      c.beginPath(); if (sg > 0) c.arc(gx + ps, cy, rr9, -a0, a0); else c.arc(gx - ps, cy, rr9, Math.PI - a0, Math.PI + a0); c.stroke();
    });
    [[x, y, 0], [x + w, y, Math.PI / 2], [x + w, y + h, Math.PI], [x, y + h, -Math.PI / 2]].forEach(([qx, qy, a]) => { c.beginPath(); c.arc(qx, qy, 10, a, a + Math.PI / 2); c.stroke(); });
    c.restore();
  };

  // =====================================================================
  //  PLACAR ELETRÔNICO (o texto vem de o.fnTexto() e muda a cada quadro)
  // =====================================================================
  reg('placar', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h;
    c.fillStyle = 'rgba(0,0,0,0.3)'; rr(c, x + 3, y + 5, w, h, 5); c.fill();
    c.fillStyle = '#23262e'; rr(c, x - 5, y - 5, w + 10, h + 10, 6); c.fill(); contorno(c, x - 5, y - 5, w + 10, h + 10, 6);
    c.fillStyle = '#05080c'; rr(c, x, y, w, h, 3); c.fill();
    [[x - 2, y - 2], [x + w + 1, y - 2], [x - 2, y + h + 1], [x + w + 1, y + h + 1]].forEach(([px, py]) => circ(c, px, py, 1.4, '#8a929a'));
    c.fillStyle = 'rgba(255,255,255,0.05)'; for (let k = 0; k < h; k += 3) c.fillRect(x, y + k, w, 1);
  }, {
    alto: 6, din(ctx, o, t) {
      const lin = o.fnTexto ? o.fnTexto() : ['PLACAR']; const n = lin.length, lh = o.h / n;
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      lin.forEach((l, i) => { ctx.fillStyle = i === 0 ? '#ffd24a' : '#7aff9a'; ctx.font = 'bold ' + Math.min(lh * 0.74, o.w / (l.length * 0.62 + 1)) + 'px "Courier New", monospace'; ctx.fillText(l, o.x + o.w / 2, o.y + lh * (i + 0.5)); });
      ctx.restore();
    }
  });

  // =====================================================================
  //  BOLA DE FUTEBOL (desenhada direto, todo quadro: o.z = altura do chute)
  // =====================================================================
  K.novos.bola_jogo = (ctx, o, t) => {
    const x = o.x + 5, y = o.y + 5, z = o.z || 0;
    ctx.fillStyle = 'rgba(0,0,0,' + (0.3 - Math.min(0.15, z * 0.004)) + ')'; ctx.beginPath(); ctx.ellipse(x + 2, y + 3, 5.2, 2.8, 0, 0, TAU); ctx.fill();
    const by = y - 4 - z, rot = (o.rot || 0);
    ctx.fillStyle = '#f8f8f8'; ctx.beginPath(); ctx.arc(x, by, 5.6, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 0.9; ctx.stroke();
    ctx.fillStyle = '#16181e'; for (let k = 0; k < 3; k++) { const a = rot + k * TAU / 3; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 2.6, by + Math.sin(a) * 2.6, 1.3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x - 3, by - 3.4, 1.6, 1.2);
  };

  // =====================================================================
  //  BANDEIRINHA DE ESCANTEIO e HOLOFOTE
  // =====================================================================
  reg('bandeirinha', (c, o) => {
    const cx = o.x + o.w / 2, by = o.y + o.h - 2, e = o.e || 28;
    elip(c, cx + 2, by + 1, 5, 2, 'rgba(0,0,0,0.3)'); barra(c, cx - 1, by - e, 2, e, '#f2f4f6');
    c.fillStyle = o.cor || '#f2d82a'; c.beginPath(); c.moveTo(cx + 1, by - e); c.lineTo(cx + 15, by - e + 4); c.lineTo(cx + 1, by - e + 9); c.closePath(); c.fill();
  }, { alto: 4, pad: 20 });
  reg('holofote', (c, o) => {
    const cx = o.x + o.w / 2, by = o.y + o.h - 3, e = o.e || 140;
    elip(c, cx + 4, by + 2, 14, 5, 'rgba(0,0,0,0.3)'); elip(c, cx, by, 10, 4, '#5a5e68');
    barra(c, cx - 3, by - e, 6, e, '#8a929a'); c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1; for (let k = 0; k < e; k += 12) { c.beginPath(); c.moveTo(cx - 3, by - k); c.lineTo(cx + 3, by - k - 6); c.stroke(); }
    const bw = 44, bh = 28, bx = cx - bw / 2, bt = by - e - bh + 4;
    c.fillStyle = '#2a2d34'; rr(c, bx, bt, bw, bh, 3); c.fill(); contorno(c, bx, bt, bw, bh, 3);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) { circ(c, bx + 6 + i * 8, bt + 6 + j * 8, 2.8, '#fff6c8'); circ(c, bx + 6 + i * 8, bt + 6 + j * 8, 1.4, '#ffffff'); }
  }, { alto: 40, pad: 40 });

  // =====================================================================
  //  MALAS (hotel, aeroporto): duas malas de rodinha e uma maleta
  // =====================================================================
  reg('malas', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h;
    sombra(c, x, y, w, h, { dx: 3, dy: 5, r: 5 });
    const mala = (mx, my, mw, mh, e, cor) => {
      caixa(c, mx, my, mw, mh, e, shade(cor, 0.2), cor, { r: 3, semSombra: true });
      c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(mx + k * mw / 4, my - e + 3); c.lineTo(mx + k * mw / 4, my + mh - 3); c.stroke(); }
      c.strokeStyle = '#2a2d34'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(mx + mw * 0.3, my - e + 1); c.lineTo(mx + mw * 0.3, my - e - 5); c.lineTo(mx + mw * 0.7, my - e - 5); c.lineTo(mx + mw * 0.7, my - e + 1); c.stroke();
      c.fillStyle = '#c8a24a'; c.fillRect(mx + mw / 2 - 3, my + mh - e * 0.5, 6, 3); roda(c, mx + 4, my + mh + 1, 2); roda(c, mx + mw - 4, my + mh + 1, 2);
    };
    mala(x, y + 4, w * 0.5, h - 4, 30, o.cor || '#8a2a3a');
    mala(x + w * 0.56, y + 10, w * 0.4, h - 10, 22, o.cor2 || '#2a4a7a');
  }, { alto: 12 });

})(window.G = window.G || {});
