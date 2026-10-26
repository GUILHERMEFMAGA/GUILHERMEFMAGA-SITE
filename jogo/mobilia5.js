/* =====================================================================
   MOBILIA5.JS — móveis da MANSÃO DO CHEFÃO (estilo máfia):
   piano de cauda, mesa de sinuca (sinuca_mafia), mesa de pôquer, balcão de bar com garrafas, adega (prateleira de vinhos),
   barril de vinho, estátua de mármore, escadaria grande, lustre, charuteira, armário de armas e telefone.
   Convenção: o.x,o.y,o.w,o.h = pegada no chão; o.e = altura. Quem usa: mansao_int.js
   ===================================================================== */
(function (G) {
  'use strict';
  const L = G.lugares, K = L.kit, D = G.deco, TAU = Math.PI * 2;
  const shade = K.shade, rr = D.rr, rng = D.rng, reg = D.reg, caixa = D.caixa, sombra = D.sombra;
  const circ = (c, x, y, r, cor) => { c.fillStyle = cor; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const brilho = (c, x, y, w, a) => { c.fillStyle = 'rgba(255,255,255,' + (a || 0.4) + ')'; c.fillRect(x, y, w, 1.2); };
  const OURO = '#e8c860';

  // ---------- piano de cauda ----------
  reg('piano', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 34, ty = y - e;
    sombra(c, x, y, w, h, { dx: 5, dy: 8, r: 8 });
    caixa(c, x, y, w, h, e, '#1a1a20', '#0a0a0e', { r: 7, semSombra: true });
    // tampa em forma de asa (curva do lado direito)
    const g = c.createLinearGradient(x, ty, x + w, ty + h); g.addColorStop(0, '#2c2c36'); g.addColorStop(1, '#101016');
    c.fillStyle = g; c.beginPath(); c.moveTo(x + 6, ty + 6); c.lineTo(x + w * 0.55, ty + 6); c.bezierCurveTo(x + w * 0.99, ty + 2, x + w - 2, ty + h * 0.46, x + w * 0.72, ty + h * 0.8); c.lineTo(x + w * 0.55, ty + h - 14); c.lineTo(x + 6, ty + h - 14); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 1; c.stroke();
    brilho(c, x + 12, ty + 11, w * 0.42, 0.22);
    c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(x + 12, ty + 16, w * 0.3, h * 0.35);
    // tampa levantada (a haste)
    c.strokeStyle = '#3a3a44'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + w * 0.58, ty + 8); c.lineTo(x + w * 0.74, ty - 12); c.stroke();
    // teclado na frente
    const kx = x + 8, kw = w * 0.62, ky = ty + h - 14;
    c.fillStyle = '#fbf8ee'; c.fillRect(kx, ky, kw, 12); c.fillStyle = '#b8b4a6'; for (let i = 1; i < kw / 6; i++) c.fillRect(kx + i * 6, ky + 7, 1, 5);
    c.fillStyle = '#16161a'; for (let i = 0; i < kw / 6 - 1; i++) if (i % 7 !== 2 && i % 7 !== 6) c.fillRect(kx + i * 6 + 4, ky, 4, 7.5);
    c.fillStyle = OURO; c.fillRect(x + w * 0.3, ty + h - 17, 22, 2);       // plaquinha dourada
  }, { alto: 24 });

  // ---------- mesa de sinuca ----------
  reg('sinuca_mafia', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 30, ty = y - e;
    sombra(c, x, y, w, h, { dx: 5, dy: 8, r: 6 });
    caixa(c, x, y, w, h, e, '#5c3b22', '#34200f', { r: 5, semSombra: true });
    // pernas torneadas na frente
    c.fillStyle = '#2a190c'; c.fillRect(x + 6, ty + h + 2, 10, e - 4); c.fillRect(x + w - 16, ty + h + 2, 10, e - 4);
    // feltro verde com tabelas e caçapas
    c.fillStyle = '#1b5e36'; rr(c, x + 7, ty + 7, w - 14, h - 14, 4); c.fill();
    const g = c.createLinearGradient(0, ty + 12, 0, ty + h - 12); g.addColorStop(0, '#2c9a58'); g.addColorStop(1, '#1d7544'); c.fillStyle = g; rr(c, x + 14, ty + 14, w - 28, h - 28, 3); c.fill();
    c.fillStyle = '#e8e2d0'; for (let i = 1; i < 8; i++) { c.fillRect(x + w * i / 8 - 1, ty + 9, 2, 2); c.fillRect(x + w * i / 8 - 1, ty + h - 11, 2, 2); }   // sinais da borda
    [[x + 12, ty + 12], [x + w / 2, ty + 10], [x + w - 12, ty + 12], [x + 12, ty + h - 12], [x + w / 2, ty + h - 10], [x + w - 12, ty + h - 12]].forEach(([px, py]) => circ(c, px, py, 6.5, '#0a0a0e'));
    // as bolas em triângulo e a branca
    const cores = ['#e8c820', '#2050c8', '#d02020', '#6a2a8a', '#e87818', '#1f8a3a', '#7a1a20', '#16161a', '#e8c820', '#2050c8'];
    let k = 0; const bx = x + w * 0.66, by = ty + h / 2;
    for (let col = 0; col < 4; col++) for (let r = 0; r <= col; r++) { const px = bx + col * 9, py = by + (r - col / 2) * 9.6; circ(c, px, py, 4.3, cores[k++ % cores.length]); brilho(c, px - 2, py - 2, 3, 0.7); }
    circ(c, x + w * 0.28, by + 2, 4.3, '#f8f6ee'); brilho(c, x + w * 0.28 - 2, by, 3, 0.8);
    c.strokeStyle = '#c8a064'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + w * 0.1, by + 24); c.lineTo(x + w * 0.27, by + 5); c.stroke();   // taco
  }, { alto: 8 });

  // ---------- mesa de pôquer (oval, feltro verde, fichas e cartas) ----------
  reg('mesa_poker', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 26, ty = y - e, rad = Math.min(w, h) / 2 - 1;
    sombra(c, x, y, w, h, { dx: 5, dy: 8, r: rad });
    caixa(c, x, y, w, h, e, '#3a2214', '#1c0f08', { r: rad, semSombra: true });
    c.fillStyle = '#16542e'; rr(c, x + 8, ty + 8, w - 16, h - 16, rad - 8); c.fill();
    const g = c.createRadialGradient(x + w / 2, ty + h / 2, 5, x + w / 2, ty + h / 2, w / 2); g.addColorStop(0, '#2c8a52'); g.addColorStop(1, '#1d6a3c'); c.fillStyle = g; rr(c, x + 13, ty + 13, w - 26, h - 26, rad - 13); c.fill();
    c.strokeStyle = 'rgba(232,200,96,0.55)'; c.lineWidth = 1.2; rr(c, x + 20, ty + 20, w - 40, h - 40, rad - 20); c.stroke();
    for (let i = 0; i < 5; i++) { const px = x + w * 0.3 + i * 14; c.fillStyle = '#fbfaf4'; c.fillRect(px, ty + h / 2 - 8, 10, 15); c.fillStyle = i % 2 ? '#c81c1c' : '#16161a'; c.fillRect(px + 3, ty + h / 2 - 5, 4, 4); }   // cartas no meio
    [[0.2, 0.3, '#c81c1c'], [0.78, 0.32, '#2050c8'], [0.25, 0.7, '#16161a'], [0.74, 0.7, '#c81c1c'], [0.5, 0.78, '#2050c8']].forEach(([fx, fy, cor]) => { for (let k = 0; k < 4; k++) circ(c, x + w * fx, ty + h * fy - k * 1.6, 5, k % 2 ? '#f4f4f0' : cor); });   // pilhas de fichas
    circ(c, x + w * 0.5, ty + h * 0.28, 5, OURO); circ(c, x + w * 0.5, ty + h * 0.28, 3, '#8a6a1a');   // botão do carteador
  }, { alto: 10 });

  // ---------- balcão de bar (madeira, couro com tachas, trilho de latão, garrafas) ----------
  reg('bar_mafia', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 44, ty = y - e, fy = y + h - e, r = rng(x + 5);
    sombra(c, x, y, w, h, { dx: 5, dy: 8, r: 5 });
    caixa(c, x, y, w, h, e, '#7a4a26', '#4a2814', { r: 4, semSombra: true });
    // frente de couro vermelho com tachas douradas
    c.fillStyle = '#5a1a1e'; rr(c, x + 6, fy + 6, w - 12, e - 14, 3); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.07)'; for (let i = 0; i < w - 20; i += 38) c.fillRect(x + 12 + i, fy + 8, 2, e - 18);
    c.fillStyle = OURO; for (let i = 0; i < w - 14; i += 14) { c.fillRect(x + 9 + i, fy + 9, 2, 2); c.fillRect(x + 9 + i, fy + e - 12, 2, 2); }
    c.fillStyle = '#d8b050'; c.fillRect(x + 4, fy + e - 7, w - 8, 3);            // trilho de latão
    brilho(c, x + 2, ty + 1, w - 4, 0.35); c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(x + 2, ty + h - 6, w - 4, 4);
    // garrafas e copos em cima do balcão
    const gc = ['#2f5a2c', '#7a3a14', '#2a3a6a', '#7a1a1a', '#c8a030', '#3a2a1a'];
    for (let i = 0; i < w / 26; i++) { const bx = x + 14 + i * 26 + r() * 6; c.fillStyle = gc[i % gc.length]; c.fillRect(bx, ty + 5, 6, 14); c.fillRect(bx + 1.5, ty - 2, 3, 8); c.fillStyle = OURO; c.fillRect(bx + 1, ty - 3, 4, 2); brilho(c, bx + 1, ty + 7, 2, 0.5); }
    for (let i = 0; i < 4; i++) { const gx = x + w * 0.18 + i * (w * 0.22); circ(c, gx, ty + h - 14, 4, 'rgba(255,255,255,0.55)'); circ(c, gx, ty + h - 14, 2.4, 'rgba(120,70,20,0.7)'); }
  }, { alto: 14 });

  // ---------- adega: prateleira de vinhos ----------
  reg('adega_rack', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 86, fy = y + h - e, r = rng(x + 9);
    sombra(c, x, y, w, h, { dx: 4, dy: 6, r: 3 });
    caixa(c, x, y, w, h, e, '#4a2a16', '#2e180c', { r: 3, semSombra: true });
    c.fillStyle = '#1a0e08'; rr(c, x + 5, fy + 5, w - 10, e - 10, 2); c.fill();
    const cols = Math.floor((w - 16) / 15), rows = Math.floor((e - 14) / 14), gc = ['#27382a', '#3a1a1c', '#222c3a', '#40301a'];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const bx = x + 14 + i * 15 + (j % 2) * 5, by = fy + 14 + j * 14;
      if (r() < 0.12) continue;                                                // buraco vazio
      circ(c, bx, by, 5.2, gc[(i + j) % gc.length]); circ(c, bx, by, 2.8, '#c8a868'); circ(c, bx - 1, by - 1, 1.2, 'rgba(255,255,255,0.5)');
    }
    c.fillStyle = '#6a3e1e'; for (let j = 0; j <= rows; j++) c.fillRect(x + 5, fy + 6 + j * 14, w - 10, 2);
    brilho(c, x + 2, y - e + 1, w - 4, 0.3);
  }, { alto: 10 });

  // ---------- barril de vinho ----------
  reg('barril', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 34, cx = x + w / 2, ty = y - e;
    sombra(c, x, y, w, h, { dx: 4, dy: 6, r: w / 2 });
    c.fillStyle = '#5a3418'; c.fillRect(x + 2, ty + h / 2, w - 4, e); c.beginPath(); c.ellipse(cx, y + h / 2, w / 2 - 2, h / 2, 0, 0, TAU); c.fill();
    c.fillStyle = '#7a4a24'; for (let i = 0; i < 6; i++) c.fillRect(x + 4 + i * (w - 8) / 6, ty + h / 2, 1.2, e);
    c.fillStyle = '#2a2a30'; c.fillRect(x + 1, ty + h / 2 + e * 0.22, w - 2, 3); c.fillRect(x + 1, ty + h / 2 + e * 0.72, w - 2, 3);
    c.fillStyle = '#8a5a2e'; c.beginPath(); c.ellipse(cx, ty + h / 2, w / 2 - 1, h / 2 - 1, 0, 0, TAU); c.fill();
    c.strokeStyle = '#4a2810'; c.lineWidth = 1; c.beginPath(); c.ellipse(cx, ty + h / 2, w / 2 - 6, h / 2 - 6, 0, 0, TAU); c.stroke();
    c.fillStyle = '#6a3e1e'; c.fillRect(cx - w / 2 + 3, ty + h / 2 - 1, w - 6, 1.4);
    circ(c, cx, ty + h / 2, 3, '#2a2a30'); circ(c, cx, y + h - 6, 3, OURO);                                  // tampa e torneira
  }, { alto: 6 });

  // ---------- estátua de mármore sobre pedestal ----------
  reg('estatua', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 78, cx = x + w / 2, ty = y - e;
    sombra(c, x, y, w, h, { dx: 5, dy: 8, r: 4 });
    caixa(c, x, y, w, h, e * 0.42, '#d8d2c4', '#a8a090', { r: 3, semSombra: true });
    const py = y - e * 0.42 + h / 2;
    c.fillStyle = '#ece8de'; c.beginPath(); c.ellipse(cx, py - e * 0.2, w * 0.3, e * 0.26, 0, 0, TAU); c.fill();      // corpo
    c.fillStyle = '#d4cfc2'; c.beginPath(); c.ellipse(cx + 3, py - e * 0.18, w * 0.18, e * 0.2, 0, 0, TAU); c.fill();
    circ(c, cx, py - e * 0.5, w * 0.17, '#f2eee6'); circ(c, cx + 2, py - e * 0.5 + 1, w * 0.1, '#d8d3c6');          // cabeça
    c.strokeStyle = '#ece8de'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - w * 0.28, py - e * 0.3); c.lineTo(cx - w * 0.36, py - e * 0.5); c.moveTo(cx + w * 0.28, py - e * 0.3); c.lineTo(cx + w * 0.34, py - e * 0.1); c.stroke();
    brilho(c, cx - w * 0.2, py - e * 0.4, w * 0.2, 0.5);
  }, { alto: 16 });

  // ---------- escadaria grande (de frente, com tapete vermelho e corrimão) ----------
  reg('escada_grande', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, n = 10, sh = h / n;
    sombra(c, x, y, w, h, { dx: 4, dy: 6, r: 3 });
    for (let k = 0; k < n; k++) {                                                          // k = 0 é o degrau mais alto (fundo)
      const ins = (n - 1 - k) * 0.0 + (k * 1.2), sx = x + ins, sw = w - ins * 2, sy = y + k * sh;
      c.fillStyle = shade('#d8d0c0', -0.02 * (n - k)); c.fillRect(sx, sy, sw, sh);
      c.fillStyle = '#efe9db'; c.fillRect(sx, sy, sw, 4);                                  // piso do degrau (mais claro)
      c.fillStyle = shade('#a89c88', -0.03 * (n - k)); c.fillRect(sx, sy + 4, sw, sh - 4);   // espelho do degrau
    }
    const cw = w * 0.4, cx0 = x + (w - cw) / 2;                                            // tapete vermelho com varões dourados
    c.fillStyle = '#8a1c24'; c.fillRect(cx0, y, cw, h); c.fillStyle = '#a82a32'; c.fillRect(cx0 + 3, y, 4, h); c.fillStyle = '#5a0f16'; c.fillRect(cx0 + cw - 5, y, 5, h);
    c.fillStyle = OURO; for (let k = 0; k < n; k++) { c.fillRect(cx0 - 2, y + k * sh + sh - 3, cw + 4, 2); }
    [[x - 8, 1], [x + w + 2, -1]].forEach(([rx, s]) => {                                   // corrimãos de madeira e balaústres
      c.fillStyle = '#4a2814'; c.fillRect(rx, y, 7, h); c.fillStyle = '#7a4a26'; c.fillRect(rx + (s > 0 ? 0 : 4), y, 3, h);
      for (let k = 0; k < n; k++) { c.fillStyle = '#3a2010'; c.fillRect(rx + 2, y + k * sh + 3, 3, sh - 2); }
      circ(c, rx + 3.5, y + h + 2, 5.5, OURO); brilho(c, rx + 1, y + h - 1, 3, 0.8);       // bola dourada no poste
    });
  }, { alto: 4 });

  // ---------- lustre de cristal (pendurado do teto) ----------
  reg('lustre', (c, o) => {
    const cx = o.x + o.w / 2, ty = o.y - (o.e || 130);
    c.strokeStyle = '#16181e'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx, ty - 60); c.lineTo(cx, ty - 8); c.stroke();
    c.fillStyle = 'rgba(255,224,150,0.10)'; c.beginPath(); c.arc(cx, ty + 4, 54, 0, TAU); c.fill();
    c.strokeStyle = OURO; c.lineWidth = 3; c.beginPath(); c.ellipse(cx, ty, 40, 13, 0, 0, TAU); c.stroke(); c.lineWidth = 2; c.beginPath(); c.ellipse(cx, ty - 6, 24, 8, 0, 0, TAU); c.stroke();
    for (let k = 0; k < 8; k++) {
      const a = k * TAU / 8, px = cx + Math.cos(a) * 40, py = ty + Math.sin(a) * 13;
      c.strokeStyle = OURO; c.lineWidth = 1.5; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py - 8); c.stroke();
      circ(c, px, py - 11, 3.4, '#fff4c0'); circ(c, px, py - 11, 1.6, '#ffffff');                       // lâmpadas-vela
      c.fillStyle = 'rgba(210,235,255,0.85)'; c.beginPath(); c.moveTo(px - 2, py + 2); c.lineTo(px + 2, py + 2); c.lineTo(px, py + 11 + (k % 2) * 4); c.closePath(); c.fill();   // cristais
    }
    circ(c, cx, ty - 8, 4, OURO);
  }, { alto: 80 });

  // ---------- charuteira ----------
  reg('humidor', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 22, ty = y - e;
    sombra(c, x, y, w, h, { dx: 3, dy: 5, r: 3 });
    caixa(c, x, y, w, h, e, '#8a5a30', '#563518', { r: 3, semSombra: true });
    c.fillStyle = OURO; c.fillRect(x + w / 2 - 4, y + h - e + 5, 8, 6); c.fillStyle = '#6a4a14'; c.fillRect(x + w / 2 - 1, y + h - e + 7, 2, 2);   // fecho dourado
    brilho(c, x + 2, ty + 1, w - 4, 0.4);
    ['#6a3a14', '#7a4a1c', '#5a2e10'].forEach((cor, i) => { c.fillStyle = cor; c.fillRect(x + 5 + i * 3, ty + 4, 2.4, h - 9); c.fillStyle = '#e8c860'; c.fillRect(x + 5 + i * 3, ty + 6, 2.4, 1.4); });   // charutos
  }, { alto: 6 });

  // ---------- armário de armas (vitrine com espingardas) ----------
  reg('arsenal', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 92, fy = y + h - e;
    sombra(c, x, y, w, h, { dx: 4, dy: 6, r: 3 });
    caixa(c, x, y, w, h, e, '#2c2f38', '#1a1c22', { r: 3, semSombra: true });
    c.fillStyle = '#0c0d10'; rr(c, x + 6, fy + 6, w - 12, e - 12, 2); c.fill();
    for (let k = 0; k < 4; k++) {                                                           // espingardas na vertical
      const gx = x + 16 + k * ((w - 32) / 3);
      c.fillStyle = '#3a2410'; c.fillRect(gx - 2.4, fy + e * 0.55, 5, e * 0.34); c.fillStyle = '#16181c'; c.fillRect(gx - 1.4, fy + 12, 3, e * 0.5);
      c.fillStyle = '#6a707a'; c.fillRect(gx - 0.6, fy + 12, 1.2, e * 0.5);
    }
    c.fillStyle = '#d8b050'; for (let k = 0; k < 5; k++) c.fillRect(x + 12 + k * 14, fy + e - 17, 8, 5);                  // caixas de munição
    const g = c.createLinearGradient(x, fy, x + w, fy + e); g.addColorStop(0, 'rgba(190,230,255,0.22)'); g.addColorStop(0.5, 'rgba(190,230,255,0.04)'); g.addColorStop(1, 'rgba(190,230,255,0.16)');
    c.fillStyle = g; rr(c, x + 6, fy + 6, w - 12, e - 12, 2); c.fill();
    c.strokeStyle = '#555a66'; c.lineWidth = 1.2; rr(c, x + 6, fy + 6, w - 12, e - 12, 2); c.stroke();
    circ(c, x + w - 12, fy + e / 2, 3, '#d8b050');                                          // fechadura
  }, { alto: 8 });

  // ---------- telefone de disco ----------
  reg('telefone', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 12, ty = y - e;
    sombra(c, x, y, w, h, { dx: 2, dy: 3, r: 4 });
    caixa(c, x, y, w, h, e, '#16161a', '#0a0a0c', { r: 5, semSombra: true });
    circ(c, x + w / 2, ty + h / 2 + 1, h * 0.28, OURO); circ(c, x + w / 2, ty + h / 2 + 1, h * 0.14, '#16161a');
    c.fillStyle = '#16161a'; rr(c, x + 3, ty - 2, w - 6, 6, 3); c.fill(); brilho(c, x + 5, ty - 1, w - 10, 0.5);        // fone no gancho
  }, { alto: 8 });

  G.mobilia5 = true;
})(window.G = window.G || {});
