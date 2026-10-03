/* =====================================================================
   MOBILIA3.JS — os móveis ANTIGOS refeitos com formas de verdade.
   Balcão de recepção, bancada de aço, beliche, grade de cadeia, esteira, supino,
   halteres, espreguiçadeira, banco de igreja, altar, confessionário, palco, panelão,
   computador, caixa de supermercado, carrinhos, balcão de padaria...
   Mesmos nomes de objeto de sempre (o jogo não muda): só o desenho.
   Convenção: o.x,o.y,o.w,o.h = pegada no chão; o.e = altura.
   ===================================================================== */
(function (G) {
  'use strict';
  const L = G.lugares, K = L.kit, D = G.deco, TAU = Math.PI * 2;
  const shade = K.shade, hh = K.hh, rr = D.rr, mix = D.mix, rng = D.rng;
  const reg = D.reg, caixa = D.caixa, sombra = D.sombra;
  const pick = (r, a) => a[(r() * a.length) | 0];
  const circ = (c, x, y, r, cor) => { c.fillStyle = cor; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const contorno = (c, x, y, w, h, r) => { c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 1; rr(c, x + 0.5, y + 0.5, w - 1, h - 1, r || 1); c.stroke(); };
  const brilho = (c, x, y, w, a) => { c.fillStyle = 'rgba(255,255,255,' + (a || 0.4) + ')'; c.fillRect(x, y, w, 1.2); };
  // chapa de aço escovado (degradê vertical)
  const aco = (c, x, y, w, h, r, claro) => { const g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, claro ? '#fafbfc' : '#eef1f4'); g.addColorStop(0.5, claro ? '#d8dde2' : '#c2c8ce'); g.addColorStop(1, claro ? '#aab1b8' : '#8a9199'); c.fillStyle = g; rr(c, x, y, w, h, r == null ? 2 : r); c.fill(); };
  // cilindro vertical (barra, perna): degradê horizontal
  const barra = (c, x, y, w, h, cor) => { const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, shade(cor, 0.35)); g.addColorStop(0.45, cor); g.addColorStop(1, shade(cor, -0.42)); c.fillStyle = g; c.fillRect(x, y, w, h); };

  // ======================= BALCÃO DE RECEPÇÃO (hotel, banco, delegacia, prefeitura) =======================
  reg('recepcao', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 30, corpo = o.front || '#a8895a', topo = o.top || '#efe6d2', r = rng((x * 3 + y) | 0);
    caixa(c, x, y, w, h, e, topo, corpo, { r: 4 });
    const fy = y + h - e, ty = y - e;
    // painéis almofadados na frente
    const n = Math.max(2, Math.round(w / 54)), pw = (w - 10) / n;
    for (let i = 0; i < n; i++) { const px = x + 5 + i * pw; c.fillStyle = 'rgba(0,0,0,0.22)'; rr(c, px + 3, fy + 6, pw - 6, e - 13, 2); c.fill(); c.strokeStyle = 'rgba(255,255,255,0.2)'; c.lineWidth = 1; rr(c, px + 3.5, fy + 6.5, pw - 7, e - 14, 2); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(px + 5, fy + 8, pw - 10, 2); }
    // filete dourado na quina do tampo e rodapé escuro
    c.fillStyle = o.filete || '#c8a24a'; c.fillRect(x + 2, fy - 2.5, w - 4, 2.4); brilho(c, x + 2, fy - 2.5, w - 4, 0.5);
    c.fillStyle = 'rgba(0,0,0,0.38)'; c.fillRect(x + 2, y + h - 4, w - 4, 3);
    // em cima: monitores (de costas, o atendente está atrás), teclado, sino, pastas, abajur
    const nm = Math.max(1, Math.floor(w / 120));
    for (let i = 0; i < nm; i++) {
      const mx = x + (i + 0.5) * w / nm - 11, my = ty + 6;
      c.fillStyle = 'rgba(0,0,0,0.3)'; rr(c, mx + 2, my + 3, 22, 12, 2); c.fill();
      c.fillStyle = '#2a2d34'; rr(c, mx, my, 22, 12, 2); c.fill(); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(mx + 2, my + 1.5, 18, 1.4); circ(c, mx + 11, my + 7, 1.4, '#6a707a');
      c.fillStyle = '#3a3e48'; c.fillRect(mx + 8, my + 12, 6, 4); c.fillStyle = '#d8dce0'; rr(c, mx + 1, ty + h - 14, 20, 6, 1.4); c.fill(); contorno(c, mx + 1, ty + h - 14, 20, 6, 1.4);
    }
    circ(c, x + w * 0.1, ty + h * 0.5, 4.2, '#d8b24a'); c.fillStyle = '#b8922a'; c.fillRect(x + w * 0.1 - 5, ty + h * 0.5 + 3, 10, 2); circ(c, x + w * 0.1 - 1, ty + h * 0.5 - 1.4, 1.2, 'rgba(255,255,255,0.8)');
    for (let k = 0; k < 3; k++) { c.fillStyle = pick(r, ['#c8402a', '#2a58b8', '#e0b32a', '#f2f2f2']); c.fillRect(x + w * 0.82 + k * 0.6, ty + 8 + k * 3, 16, 3); }
    c.fillStyle = '#16181e'; c.fillRect(x + w * 0.93 - 1, ty + 9, 2, 8); circ(c, x + w * 0.93, ty + 8, 5, '#e8d890'); c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(x + w * 0.93 - 1.5, ty + 6.5, 1.8, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(x + 4, ty + 1, w - 8, 1.2);
  }, { alto: 24 });

  // ======================= BANCADA DE AÇO (cozinha, corte, trabalho) =======================
  reg('bancada', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 26, ty = y - e, fy = y + h - e, r = rng((x * 3 + y) | 0);
    sombra(c, x, y, w, h, { dx: 4, dy: 7, r: 3 });
    c.fillStyle = '#14161c'; c.fillRect(x + 2, fy + 3, w - 4, e - 3);
    const sy = fy + e * 0.64; aco(c, x + 3, sy, w - 6, 3, 1);
    for (let k = x + 14; k < x + w - 28; k += 40 + ((r() * 16) | 0)) { const bw = 22 + ((r() * 10) | 0); aco(c, k, sy - 8, bw, 8, 3); c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(k + 2, sy - 7, bw - 4, 2.4); }
    [x, x + w - 5].forEach(px => barra(c, px, fy + 2, 5, e - 1, '#b8bec6'));
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(x + 5, y + h - 3, w - 10, 2);
    c.fillStyle = 'rgba(0,0,0,0.3)'; rr(c, x - 1, ty + 2, w + 2, h + 4, 3); c.fill();
    aco(c, x, ty, w, h, 3, true);
    c.fillStyle = '#98a0a8'; c.fillRect(x + 1, ty + h - 1, w - 2, 4); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x + 1, ty + h + 2.5, w - 2, 1.3);
    c.fillStyle = '#d6dbe0'; c.fillRect(x + 1, ty, w - 2, 4); brilho(c, x + 1, ty, w - 2, 0.8);
    // cubas
    const nc = w > 160 ? 2 : 1;
    for (let i = 0; i < nc; i++) {
      const cw = Math.min(46, w * 0.2), cx0 = x + w * (nc === 2 ? 0.2 + i * 0.4 : 0.28);
      c.fillStyle = '#7f868e'; rr(c, cx0, ty + 9, cw, h - 18, 3); c.fill();
      const gg = c.createLinearGradient(cx0, ty + 10, cx0, ty + h - 10); gg.addColorStop(0, '#5a6068'); gg.addColorStop(1, '#a4acb3'); c.fillStyle = gg; rr(c, cx0 + 2, ty + 11, cw - 4, h - 22, 2); c.fill();
      circ(c, cx0 + cw / 2, ty + h / 2, 1.7, '#22252c');
      c.strokeStyle = '#d0d4da'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(cx0 + cw / 2, ty + 5); c.lineTo(cx0 + cw / 2, ty + 11); c.stroke(); circ(c, cx0 + cw / 2, ty + 6, 2.3, '#eef1f4');
    }
    // tábua de corte, faca, tigelas
    const tx = x + w * (nc === 2 ? 0.7 : 0.62);
    c.fillStyle = 'rgba(0,0,0,0.25)'; rr(c, tx + 1.5, ty + 12, 34, 20, 2); c.fill(); c.fillStyle = '#c8a070'; rr(c, tx, ty + 10, 34, 20, 2); c.fill(); contorno(c, tx, ty + 10, 34, 20, 2);
    c.fillStyle = '#d8402a'; c.beginPath(); c.arc(tx + 10, ty + 20, 3.4, 0, TAU); c.fill(); c.fillStyle = '#6aa83a'; c.fillRect(tx + 16, ty + 17, 8, 3); c.fillStyle = '#f2c82a'; c.fillRect(tx + 18, ty + 23, 7, 3);
    c.fillStyle = '#e8ecf0'; c.fillRect(tx + 28, ty + 13, 2, 14); c.fillStyle = '#16181e'; c.fillRect(tx + 28, ty + 25, 2, 5);
    circ(c, x + w * 0.06 + 8, ty + h * 0.55, 6, '#f2f2f2'); circ(c, x + w * 0.06 + 8, ty + h * 0.55, 3.8, '#e8c070'); contorno(c, x + w * 0.06 + 2, ty + h * 0.55 - 6, 12, 12, 6);
  }, { alto: 14 });

  // ======================= BELICHE (cadeia, hotel barato) =======================
  reg('beliche', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 24, cor = o.cor || '#6a7a5a', ty = y - e;
    sombra(c, x - 2, y - 2, w + 4, h + 4, { dx: 5, dy: 8, r: 3 });
    // beliche de baixo (aparece embaixo da de cima)
    c.fillStyle = '#16181e'; rr(c, x + 1, ty + h * 0.5, w - 2, e + h * 0.5 - 1, 2); c.fill();
    c.fillStyle = '#e0dccc'; rr(c, x + 4, y + h - e * 0.5 - 6, w - 8, 6, 2); c.fill(); c.fillStyle = shade(cor, -0.1); rr(c, x + 4, y + h - e * 0.5 - 4, w - 8, 4, 2); c.fill();
    // colchão de cima + cobertor + travesseiro
    caixa(c, x, y, w, h, 6, '#d8d4c4', '#8a8a82', { r: 3, semSombra: true });
    const my = y - 6 - 0;
    c.fillStyle = '#ecebe2'; rr(c, x + 3, ty + 2 + 0, w - 6, h - 4, 4); c.fill();
    const gc = c.createLinearGradient(0, ty + h * 0.35, 0, ty + h); gc.addColorStop(0, shade(cor, 0.12)); gc.addColorStop(1, shade(cor, -0.22)); c.fillStyle = gc; rr(c, x + 3, ty + h * 0.34, w - 6, h * 0.66 - 2, 4); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x + 5, ty + h * 0.34 + k * (h * 0.6 / 4)); c.lineTo(x + w - 5, ty + h * 0.34 + k * (h * 0.6 / 4)); c.stroke(); }
    c.fillStyle = '#fbfaf4'; rr(c, x + 6, ty + 4, 24, 14, 5); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.2)'; c.stroke();
    // colunas e escada
    [[x - 1, ty - 2], [x + w - 3, ty - 2], [x - 1, y + h - 8], [x + w - 3, y + h - 8]].forEach(([px, py], i) => barra(c, px, py - (i < 2 ? 0 : 0), 4, (i < 2 ? e + 8 : e + 8), '#7a828c'));
    c.fillStyle = '#9aa2aa'; for (let k = 0; k < 3; k++) c.fillRect(x + w - 2, ty + 6 + k * 7, 4, 2);
    contorno(c, x, ty, w, h + 4, 3);
  }, { alto: 40 });

  // ======================= GRADE DE CADEIA =======================
  reg('grade', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 90, ty = y - e, cor = '#4a4f58';
    // sombra das barras no chão
    c.fillStyle = 'rgba(0,0,0,0.22)'; for (let k = x + 4; k < x + w; k += 11) c.fillRect(k + 3, y + 2, 4, 9);
    // trilhos de cima e de baixo
    const trilho = yy => { const g = c.createLinearGradient(0, yy, 0, yy + 7); g.addColorStop(0, '#9aa2ac'); g.addColorStop(0.5, '#5a606a'); g.addColorStop(1, '#2a2d34'); c.fillStyle = g; c.fillRect(x - 3, yy, w + 6, 7); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x - 3, yy, w + 6, 1.2); };
    // barras verticais (cilindros)
    for (let k = x; k <= x + w - 5; k += 11) barra(c, k, ty + 4, 5, e + 6, '#6a707a');
    // travessas
    const tr = [ty + e * 0.34, ty + e * 0.68];
    tr.forEach(yy => { c.fillStyle = '#3a3e48'; c.fillRect(x - 1, yy, w + 2, 4); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x - 1, yy, w + 2, 1); });
    trilho(ty); trilho(y + h - 2);
    // fechadura
    const lx = x + w * 0.5 - 9; c.fillStyle = '#2a2d34'; rr(c, lx, ty + e * 0.45, 18, 14, 2); c.fill(); circ(c, lx + 9, ty + e * 0.45 + 6, 2.4, '#c8a24a'); c.fillStyle = '#e8c870'; c.fillRect(lx + 8, ty + e * 0.45 + 7, 2, 4);
    // cabo de aço: a porta
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x + w * 0.5 - 1, ty + 6, 2, e);
  }, { alto: 16, pad: 12 });

  // ======================= ESTEIRA =======================
  reg('esteira', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 16, ty = y - e;
    sombra(c, x, y, w, h, { dx: 5, dy: 8, r: 6 });
    // chassi
    caixa(c, x + 4, y + 4, w - 8, h - 6, e - 6, '#2a2d36', '#16181e', { r: 5, semSombra: true });
    // esteira de borracha com listras de movimento
    const by = ty + 8, bh = h - 24;
    const gb = c.createLinearGradient(0, by, 0, by + bh); gb.addColorStop(0, '#2a2c32'); gb.addColorStop(1, '#14151a'); c.fillStyle = gb; rr(c, x + 11, by, w - 22, bh, 5); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.09)'; c.lineWidth = 1; for (let k = 0; k < bh; k += 5) { c.beginPath(); c.moveTo(x + 13, by + k); c.lineTo(x + w - 13, by + k); c.stroke(); }
    c.fillStyle = '#e8402a'; c.fillRect(x + w / 2 - 1, by + 3, 2, bh - 6);
    // trilhos laterais
    [x + 6, x + w - 11].forEach(px => { aco(c, px, by - 2, 5, bh + 4, 2); });
    // rolo da frente
    aco(c, x + 8, by + bh - 1, w - 16, 5, 2); brilho(c, x + 8, by + bh - 1, w - 16, 0.5);
    // coluna e painel (na frente, junto ao fundo da máquina)
    const px = x + 8, py = y - 22;
    barra(c, x + 8, ty - 10, 4, 14, '#3a3e48'); barra(c, x + w - 12, ty - 10, 4, 14, '#3a3e48');
    caixa(c, px + 4, ty - 10, w - 24, 10, 6, '#3a3e48', '#22252c', { r: 3, semSombra: true });
    c.fillStyle = '#0a1a2a'; rr(c, px + 12, ty - 22, w - 40, 8, 2); c.fill(); c.fillStyle = '#3ad0ff'; c.font = 'bold 6px Arial'; c.textAlign = 'left'; c.fillText('8.5 km/h  05:12', px + 14, ty - 15.4);
    circ(c, px + w - 20, ty - 18, 1.6, '#3ad060'); circ(c, px + w - 15, ty - 18, 1.6, '#e8402a');
    // apoio de mãos e suporte de garrafa
    c.strokeStyle = '#8a9099'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + 10, ty - 6); c.quadraticCurveTo(x + 4, ty + bh * 0.4, x + 8, ty + bh * 0.75); c.moveTo(x + w - 10, ty - 6); c.quadraticCurveTo(x + w - 4, ty + bh * 0.4, x + w - 8, ty + bh * 0.75); c.stroke();
    contorno(c, x + 4, ty, w - 8, h, 5);
  }, { alto: 36 });

  // ======================= SUPINO (banco com barra e anilhas) =======================
  reg('supino', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 14, ty = y - e, cy = ty + h / 2;
    sombra(c, x, y, w, h, { dx: 5, dy: 8, r: 6 });
    // tapete de borracha
    c.fillStyle = '#1e2026'; rr(c, x - 2, y - 4, w + 4, h + 8, 5); c.fill(); c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 1; rr(c, x, y - 2, w, h + 4, 4); c.stroke();
    // banco acolchoado (vermelho com costura)
    const bx = x + w * 0.2, bw = w * 0.62, bh = Math.min(20, h * 0.34);
    caixa(c, bx, cy + bh / 2 - 2, bw, bh, 8, '#c8302a', '#7a1a16', { r: 6, semSombra: true });
    c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 1; c.setLineDash([3, 3]); rr(c, bx + 3, cy - bh / 2 + 3 - 6, bw - 6, bh - 4, 4); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#3a3e48'; c.fillRect(bx + bw - 4, cy - bh / 2 - 6, 3, bh + 12);
    // suportes da barra (dois montantes)
    [x + w * 0.26, x + w * 0.62].forEach(px => { barra(c, px, ty - 30, 5, 38, '#4a4f58'); c.fillStyle = '#2a2d34'; c.fillRect(px - 6, ty + 8, 17, 3); });
    // barra olímpica e anilhas nas pontas (vistas de frente)
    const by = ty - 24; c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + 6, by + 9, w - 12, 2);
    const gb = c.createLinearGradient(0, by, 0, by + 4); gb.addColorStop(0, '#f2f4f6'); gb.addColorStop(1, '#8a9099'); c.fillStyle = gb; c.fillRect(x + 4, by, w - 8, 4);
    [[x + 4, 1], [x + w - 4, -1]].forEach(([px, sg]) => { [['#16181e', 9, 34], ['#2a58b8', 5, 28], ['#e8402a', 4, 22]].forEach(([cc, ww, hh2], k) => { const xx = sg > 0 ? px + k * 0 + [0, 9, 14][k] : px - ww - [0, 9, 14][k]; barra(c, xx, by + 2 - hh2 / 2, ww, hh2, cc); c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(xx + 1, by + 2 - hh2 / 2 + 1, ww - 2, 1); }); });
    // anilhas guardadas num suporte à direita
    const tx = x + w - 10; barra(c, tx, ty - 6, 3, 22, '#3a3e48'); [0, 1, 2].forEach(k => { c.fillStyle = ['#16181e', '#2a58b8', '#e8402a'][k]; c.beginPath(); c.ellipse(tx + 1.5, ty + 6 + k * 4, 7, 3, 0, 0, TAU); c.fill(); });
  }, { alto: 36, pad: 16 });

  // ======================= HALTERES (suporte com pesos) =======================
  reg('halteres', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 34, ty = y - e, fy = y + h - e;
    sombra(c, x, y, w, h, { dx: 4, dy: 7, r: 3 });
    // estrutura
    c.fillStyle = '#14161c'; c.fillRect(x + 1, fy + 2, w - 2, e - 2);
    [x, x + w - 6].forEach(px => barra(c, px, ty + 2, 6, e + h - 2, '#3a3e48'));
    // duas prateleiras de pesos (cada halter: barra + duas cabeças sextavadas)
    const r = rng((x * 5 + y) | 0), niv = [fy + e * 0.3, fy + e * 0.72];
    niv.forEach((yy, q) => {
      c.fillStyle = '#5a606a'; c.fillRect(x + 6, yy + 5, w - 12, 3); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x + 6, yy + 5, w - 12, 1);
      const n = Math.floor((w - 20) / 17);
      for (let i = 0; i < n; i++) {
        const px = x + 10 + i * 17, s = 4 + i * 0.62 + q * 3;   // peso cresce da esquerda para a direita
        c.fillStyle = '#9aa2aa'; c.fillRect(px + 1, yy + 1 - 0, 12, 3);
        const cc = shade(['#2a2d36', '#3a3e48'][q % 2], 0); const g = c.createLinearGradient(0, yy - s, 0, yy + 4); g.addColorStop(0, '#6a707a'); g.addColorStop(1, '#16181e');
        c.fillStyle = g; rr(c, px - 1, yy - s * 0.55, 5, s + 4, 1.4); c.fill(); rr(c, px + 9, yy - s * 0.55, 5, s + 4, 1.4); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(px, yy - s * 0.55 + 1, 3, 1); c.fillRect(px + 10, yy - s * 0.55 + 1, 3, 1);
        c.fillStyle = q ? '#e8402a' : '#ffd84a'; c.fillRect(px + 1, yy + 6.5, 11, 1.6);
      }
    });
    // tampo e topo
    caixa(c, x, y, w, 6, 0, '#4a4f58', '#2a2d34', { r: 2, semSombra: true });
    c.fillStyle = '#5a606a'; rr(c, x, ty - 3, w, 5, 2); c.fill(); brilho(c, x + 1, ty - 3, w - 2, 0.5);
    contorno(c, x, ty - 3, w, e + h + 3, 2);
  }, { alto: 20 });

  // ======================= ESPREGUIÇADEIRA =======================
  reg('espreguicadeira', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, cor = o.cor || '#e8402a', cx = x + w / 2;
    sombra(c, x - 2, y, w + 4, h + 2, { dx: 6, dy: 8, r: 6 });
    // pés e quadro branco
    c.fillStyle = '#e8eaee'; rr(c, x - 1, y + 2, w + 2, h - 4, 5); c.fill(); contorno(c, x - 1, y + 2, w + 2, h - 4, 5);
    // encosto reclinado (mais comprido, mostra a espuma)
    const gc = c.createLinearGradient(x, y, x + w, y); gc.addColorStop(0, shade(cor, 0.2)); gc.addColorStop(0.5, cor); gc.addColorStop(1, shade(cor, -0.3));
    c.fillStyle = gc; rr(c, x + 3, y - 6, w - 6, h * 0.42, 5); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.4)'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x + 6, y - 4, w - 12, 1.6);
    // assento e apoio de pernas
    c.fillStyle = gc; rr(c, x + 3, y + h * 0.4 - 4, w - 6, h * 0.58, 5); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.65)'; for (let k = 0; k < 5; k++) c.fillRect(x + 3, y + h * 0.4 + k * (h * 0.12), w - 6, 2.2);
    // toalha e óculos
    c.fillStyle = '#f4f0e8'; rr(c, x + 5, y - 3, w - 10, 11, 3); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.2)'; c.stroke(); c.fillStyle = shade(cor, 0.1); c.fillRect(x + 5, y, w - 10, 2);
    c.strokeStyle = '#16181e'; c.lineWidth = 1.4; c.beginPath(); c.arc(cx - 4, y + h * 0.5, 2.4, 0, TAU); c.arc(cx + 4, y + h * 0.5, 2.4, 0, TAU); c.stroke();
    // rodinhas
    circ(c, x + 3, y + h - 1, 2.6, '#2a2d34'); circ(c, x + w - 3, y + h - 1, 2.6, '#2a2d34');
  }, { alto: 12, pad: 14 });

  // ======================= BANCO DE IGREJA =======================
  reg('banco_igreja', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 14, mad = o.front || '#6a4424', ty = y - e;
    sombra(c, x, y, w, h, { dx: 4, dy: 7, r: 3 });
    const eb = e + 22;   // altura do encosto (visto pelas costas)
    // costas do banco: painel com almofada e filete
    const g = c.createLinearGradient(0, y + h - eb, 0, y + h); g.addColorStop(0, shade(mad, 0.15)); g.addColorStop(1, shade(mad, -0.4)); c.fillStyle = g; rr(c, x, y + h - eb, w, eb, 3); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.25)'; const np = Math.max(2, Math.round(w / 38)), pw = (w - 12) / np;
    for (let i = 0; i < np; i++) { rr(c, x + 6 + i * pw + 2, y + h - eb + 8, pw - 4, eb - 14, 2); c.fill(); c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 1; rr(c, x + 6.5 + i * pw + 2, y + h - eb + 8.5, pw - 5, eb - 15, 2); c.stroke(); c.fillStyle = 'rgba(0,0,0,0.25)'; }
    // tampo do encosto (visto de cima)
    const gt = c.createLinearGradient(0, y + h - eb - 8, 0, y + h - eb); gt.addColorStop(0, shade(mad, 0.4)); gt.addColorStop(1, shade(mad, 0.12)); c.fillStyle = gt; rr(c, x - 2, y + h - eb - 8, w + 4, 9, 3); c.fill(); contorno(c, x - 2, y + h - eb - 8, w + 4, 9, 3);
    // assento visível (um pedaço atrás do encosto)
    c.fillStyle = shade(mad, 0.1); rr(c, x + 2, y - 2, w - 4, h - eb + 14 > 4 ? 6 : 4, 2); c.fill();
    // laterais entalhadas (cheeks) mais altas
    [x - 3, x + w - 5].forEach(px => { const gs = c.createLinearGradient(px, 0, px + 8, 0); gs.addColorStop(0, shade(mad, 0.3)); gs.addColorStop(1, shade(mad, -0.35)); c.fillStyle = gs; rr(c, px, y + h - eb - 12, 8, eb + 14, 3); c.fill(); contorno(c, px, y + h - eb - 12, 8, eb + 14, 3); circ(c, px + 4, y + h - eb - 8, 2.4, shade(mad, 0.45)); });
    // livro de cânticos e filete dourado
    c.fillStyle = '#c8a24a'; c.fillRect(x + 8, y + h - 3, w - 16, 1.4); c.fillStyle = '#8a1428'; rr(c, x + w * 0.3, y + h - eb - 6, 9, 5, 1); c.fill();
  }, { alto: 30 });

  // ======================= ALTAR =======================
  reg('altar', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 30, ty = y - e, fy = y + h - e, cx = x + w / 2;
    sombra(c, x, y, w, h, { dx: 5, dy: 8, r: 4 });
    // degrau de mármore
    caixa(c, x - 10, y + 6, w + 20, h - 4, 5, '#d8d4cc', '#a8a49a', { r: 3, semSombra: true });
    // mesa de mármore com toalha branca e bordado
    caixa(c, x, y, w, h, e, '#f4f2ec', '#fbfaf6', { r: 3, semSombra: true });
    c.fillStyle = '#c8a24a'; c.fillRect(x, fy + e * 0.55, w, 2.4); c.fillRect(x, fy + e - 3, w, 2);
    c.fillStyle = '#8a1428'; c.fillRect(x + w * 0.28, fy + 3, w * 0.44, e * 0.5); c.strokeStyle = '#c8a24a'; c.lineWidth = 1; c.strokeRect(x + w * 0.28 + 0.5, fy + 3.5, w * 0.44 - 1, e * 0.5 - 1);
    c.fillStyle = '#e8c870'; c.fillRect(cx - 1, fy + 5, 2, e * 0.38); c.fillRect(cx - 5, fy + 9, 10, 2);
    c.fillStyle = 'rgba(0,0,0,0.12)'; for (let k = x + 12; k < x + w - 4; k += 18) c.fillRect(k, fy + 2, 1.4, e - 5);   // dobras
    // em cima: cruz dourada, castiçais, flores, livro
    const ty2 = ty + h * 0.5;
    c.fillStyle = '#d8b24a'; c.fillRect(cx - 2, ty2 - 30, 4, 30); c.fillRect(cx - 9, ty2 - 24, 18, 4); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(cx - 2, ty2 - 30, 1.2, 30); circ(c, cx, ty2 - 22, 2.6, '#c8302a');
    [x + w * 0.2, x + w * 0.8].forEach(px => { c.fillStyle = '#c8a24a'; c.fillRect(px - 1.5, ty2 - 12, 3, 12); c.fillRect(px - 5, ty2 - 1, 10, 3); c.fillStyle = '#fbf6e0'; c.fillRect(px - 2, ty2 - 22, 4, 10); c.fillStyle = '#ffd86a'; c.beginPath(); c.ellipse(px, ty2 - 24, 2.2, 3.4, 0, 0, TAU); c.fill(); });
    [[x + w * 0.38, '#e84a6a'], [x + w * 0.46, '#f2f2f2'], [x + w * 0.62, '#f2d84a']].forEach(([px, cc], k) => { c.fillStyle = '#2f8a3c'; c.fillRect(px - 0.5, ty2 - 8, 1.4, 8); circ(c, px, ty2 - 9, 2.8, cc); });
    c.fillStyle = '#8a1428'; rr(c, cx - 9, ty2 + 4, 18, 9, 1.5); c.fill(); c.fillStyle = '#e8c870'; c.fillRect(cx - 7, ty2 + 7, 14, 1.2);
  }, { alto: 40, pad: 16 });

  // ======================= CONFESSIONÁRIO =======================
  reg('confessionario', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 76, ty = y - e, fy = y + h - e, mad = '#4a2c18';
    sombra(c, x, y, w, h, { dx: 6, dy: 9, r: 4 });
    // telhado (de cima) com cumeeira e a frente entalhada
    caixa(c, x, y, w, h, e, shade(mad, 0.22), mad, { r: 3, semSombra: true });
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + w / 2 - 1, ty, 2, h); c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(x + 2, ty + 2, w - 4, 1.6);
    // frente: 3 partes (esquerda: grade do padre, centro: cabine com porta, direita: cortina)
    const sw = (w - 8) / 3;
    for (let i = 0; i < 3; i++) {
      const px = x + 4 + i * sw, py = fy + 12, pw = sw - 3, ph = e - 22;
      c.fillStyle = shade(mad, -0.4); c.beginPath(); c.moveTo(px, py + ph); c.lineTo(px, py + 12); c.quadraticCurveTo(px + pw / 2, py - 6, px + pw, py + 12); c.lineTo(px + pw, py + ph); c.closePath(); c.fill();
      c.strokeStyle = '#c8a24a'; c.lineWidth = 1; c.stroke();
      if (i === 1) {   // porta com cortina roxa
        const g = c.createLinearGradient(px, 0, px + pw, 0); g.addColorStop(0, '#5a1a6a'); g.addColorStop(0.5, '#8a3a9a'); g.addColorStop(1, '#4a1458'); c.fillStyle = g; c.fillRect(px + 2, py + 12, pw - 4, ph - 12);
        c.strokeStyle = 'rgba(0,0,0,0.3)'; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(px + 2 + k * (pw - 4) / 5, py + 12); c.lineTo(px + 2 + k * (pw - 4) / 5, py + ph); c.stroke(); }
        c.fillStyle = '#c8a24a'; c.fillRect(px + pw - 7, py + ph * 0.55, 3, 3);
      } else {   // grade de madeira
        c.fillStyle = '#16100a'; c.fillRect(px + 3, py + 14, pw - 6, ph * 0.4); c.strokeStyle = '#8a5a30'; c.lineWidth = 1; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(px + 3 + k * (pw - 6) / 5, py + 14); c.lineTo(px + 3 + k * (pw - 6) / 5, py + 14 + ph * 0.4); c.stroke(); }
        c.fillStyle = 'rgba(0,0,0,0.3)'; rr(c, px + 4, py + ph * 0.58, pw - 8, ph * 0.34, 2); c.fill();
      }
    }
    // cruz no alto
    const cx = x + w / 2; c.fillStyle = '#c8a24a'; c.fillRect(cx - 1.4, ty - 14, 3, 14); c.fillRect(cx - 5, ty - 10, 10, 3);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x + 2, fy + 1, w - 4, 1.4);
  }, { alto: 24 });

  // ======================= PALCO =======================
  reg('palco', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 24, ty = y - e, fy = y + h - e, r = rng((x + y) | 0);
    sombra(c, x, y, w, h, { dx: 5, dy: 9, r: 3 });
    // frente: saia de veludo vinho com franja dourada
    const g = c.createLinearGradient(0, fy, 0, y + h); g.addColorStop(0, '#9a1a30'); g.addColorStop(1, '#4a0a16'); c.fillStyle = g; c.fillRect(x, fy, w, e);
    c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1.2; for (let k = x + 8; k < x + w; k += 14) { c.beginPath(); c.moveTo(k, fy + 1); c.quadraticCurveTo(k + 3, fy + e * 0.5, k, y + h - 3); c.stroke(); }
    c.fillStyle = '#c8a24a'; c.fillRect(x, fy, w, 2.6); for (let k = x + 3; k < x + w; k += 5) { c.fillRect(k, y + h - 6, 1.6, 6); }
    // piso de tábuas
    c.fillStyle = '#8a5e34'; c.fillRect(x, ty, w, h);
    for (let j = 0; j < h; j += 9) { c.fillStyle = shade('#8a5e34', (r() - 0.5) * 0.18); c.fillRect(x, ty + j, w, 8); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x, ty + j + 8, w, 1); }
    c.fillStyle = 'rgba(255,255,255,0.1)'; for (let k = 0; k < w / 30; k++) c.fillRect(x + r() * w, ty + r() * h, 22, 1);
    // marcas de posição (fita)
    c.fillStyle = '#f2e84a'; [0.25, 0.5, 0.75].forEach(a => { c.fillRect(x + w * a - 5, ty + h * 0.5 - 1, 10, 2); c.fillRect(x + w * a - 1, ty + h * 0.5 - 5, 2, 10); });
    // luzes de rampa na borda da frente
    for (let k = x + 16; k < x + w - 8; k += 36) { circ(c, k, ty + h - 4, 3.4, '#ffd86a'); c.fillStyle = 'rgba(255,220,120,0.25)'; c.beginPath(); c.arc(k, ty + h - 4, 9, 0, TAU); c.fill(); }
    // escadinhas nas pontas
    [x - 14, x + w].forEach(px => { caixa(c, px, y + h - 12, 14, 12, 8, '#a0703a', '#6a4424', { r: 2, semSombra: true }); });
    // microfone no centro
    const mx = x + w / 2; c.strokeStyle = '#2a2d34'; c.lineWidth = 2; c.beginPath(); c.moveTo(mx, ty + h * 0.55); c.lineTo(mx, ty + h * 0.2); c.stroke(); circ(c, mx, ty + h * 0.18, 3, '#16181e'); c.fillStyle = '#4a4f58'; c.fillRect(mx - 4, ty + h * 0.55, 8, 2);
    contorno(c, x, ty, w, h + e, 3);
  }, { alto: 20, pad: 20 });

  // ======================= PANELÃO (cozinha industrial) =======================
  reg('panelao', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 30, ty = y - e, cx = x + w / 2;
    sombra(c, x, y, w, h, { dx: 5, dy: 8, r: 3 });
    // fogão industrial (base) e bocas
    caixa(c, x, y, w, h, e - 10, '#3a3e48', '#22252c', { r: 3, semSombra: true });
    const fy = y + h - (e - 10);
    c.fillStyle = '#16181e'; for (let k = 0; k < 3; k++) { rr(c, x + 8 + k * (w - 16) / 3, fy + 5, (w - 16) / 3 - 6, e - 20, 2); c.fill(); }
    for (let k = 0; k < 4; k++) { circ(c, x + 10 + k * (w - 20) / 3, fy + e - 14, 3, '#8a9099'); circ(c, x + 10 + k * (w - 20) / 3, fy + e - 14, 1.2, '#2a2d34'); }
    // panelão de aço com duas alças e tampa entreaberta
    const py = ty - 8, pr = Math.min(w, h * 1.4) * 0.36;
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(cx + 3, py + 6, pr + 2, pr * 0.8, 0, 0, TAU); c.fill();
    const g = c.createLinearGradient(cx - pr, 0, cx + pr, 0); g.addColorStop(0, '#8a9099'); g.addColorStop(0.35, '#eef1f4'); g.addColorStop(1, '#6a707a'); c.fillStyle = g; c.beginPath(); c.ellipse(cx, py, pr, pr * 0.8, 0, 0, TAU); c.fill(); contorno(c, cx - pr, py - pr * 0.8, pr * 2, pr * 1.6, pr);
    c.fillStyle = '#2a1a0e'; c.beginPath(); c.ellipse(cx, py, pr * 0.78, pr * 0.62, 0, 0, TAU); c.fill(); c.fillStyle = '#c8602a'; c.beginPath(); c.ellipse(cx, py + 1, pr * 0.7, pr * 0.54, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,230,180,0.55)'; for (let k = 0; k < 7; k++) circ(c, cx + Math.cos(k * 2.4) * pr * 0.4, py + Math.sin(k * 2.4) * pr * 0.3, 1.6, 'rgba(255,225,170,0.6)');
    [-1, 1].forEach(sg => { c.fillStyle = '#16181e'; rr(c, cx + sg * pr - 3, py - 3, 6, 6, 2); c.fill(); });
    c.strokeStyle = '#d8dce0'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx + 4, py - 3); c.lineTo(cx + pr * 1.1, py - pr * 0.9); c.stroke(); c.fillStyle = '#8a5a30'; rr(c, cx + pr * 1.05, py - pr * 1.0, 5, 12, 2); c.fill();
  }, { alto: 30, din: (c, o, t) => { const cx = o.x + o.w / 2, py = o.y - (o.e || 30) - 14, pr = Math.min(o.w, o.h * 1.4) * 0.36; for (let k = 0; k < 4; k++) { const ph = (t * 0.8 + k * 0.25) % 1; c.fillStyle = 'rgba(255,255,255,' + 0.26 * (1 - ph) + ')'; c.beginPath(); c.arc(cx + Math.sin(t * 2 + k * 2) * pr * 0.35, py - ph * 34, 3 + ph * 7, 0, TAU); c.fill(); } } });

  // ======================= COMPUTADOR (mesa com PC) =======================
  reg('computador', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 24, ty = y - e, fy = y + h - e;
    caixa(c, x, y, w, h, e, '#c8a878', '#8a6a46', { r: 3 });
    c.fillStyle = 'rgba(0,0,0,0.3)'; rr(c, x + 6, fy + 6, w * 0.4, e - 12, 2); c.fill(); c.fillStyle = 'rgba(0,0,0,0.3)'; rr(c, x + w * 0.52, fy + 6, w * 0.42, e - 12, 2); c.fill();
    c.fillStyle = '#d8c890'; c.fillRect(x + w * 0.4 - 8, fy + e * 0.45, 8, 2); c.fillRect(x + w * 0.52 + 8, fy + e * 0.45, 8, 2);
    // monitor (tela virada para quem usa, ao sul), teclado, mouse, caneca, papéis
    const mx = x + w * 0.5 - 22, my = ty + 3;
    c.fillStyle = 'rgba(0,0,0,0.28)'; rr(c, mx + 3, my + 4, 46, 28, 3); c.fill();
    c.fillStyle = '#d4d8dc'; rr(c, mx, my, 44, 28, 3); c.fill(); contorno(c, mx, my, 44, 28, 3);
    const gs = c.createLinearGradient(mx, my, mx + 40, my + 22); gs.addColorStop(0, '#3a7ad8'); gs.addColorStop(1, '#1a3a78'); c.fillStyle = gs; rr(c, mx + 3, my + 3, 38, 20, 1.6); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.7)'; for (let k = 0; k < 4; k++) c.fillRect(mx + 6, my + 6 + k * 4, 12 + (k % 2) * 8, 1.6); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(mx + 3, my + 3, 38, 3);
    c.fillStyle = '#8a9099'; c.fillRect(mx + 17, my + 28, 10, 2); c.fillRect(mx + 12, my + 30, 20, 2.4);
    c.fillStyle = '#e8ecee'; rr(c, mx + 3, ty + h - 11, 36, 7, 1.6); c.fill(); contorno(c, mx + 3, ty + h - 11, 36, 7, 1.6); c.fillStyle = 'rgba(0,0,0,0.18)'; for (let k = 0; k < 3; k++) c.fillRect(mx + 5, ty + h - 9.5 + k * 2, 32, 0.8);
    c.fillStyle = '#e8ecee'; rr(c, mx + 46, ty + h - 11, 6, 8, 3); c.fill(); contorno(c, mx + 46, ty + h - 11, 6, 8, 3);
    c.fillStyle = '#f4f0e8'; rr(c, x + w - 30, ty + 6, 20, 14, 1); c.fill(); contorno(c, x + w - 30, ty + 6, 20, 14, 1); c.fillStyle = 'rgba(0,0,0,0.3)'; for (let k = 0; k < 3; k++) c.fillRect(x + w - 27, ty + 9 + k * 3.4, 14, 1);
    circ(c, x + 14, ty + 14, 5, '#e8e2d6'); circ(c, x + 14, ty + 14, 3.4, '#5a3a22'); contorno(c, x + 9, ty + 9, 10, 10, 5);
  }, { alto: 26 });

  // ======================= BALCÃO DE PADARIA (vitrine de pães) =======================
  reg('balcao_padaria', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 28, ty = y - e, fy = y + h - e, r = rng((x * 3 + y) | 0), bh = Math.round(e * 0.5);
    caixa(c, x, y, w, h, bh, '#f0e0c0', '#8a5a34', { r: 3 });
    // frente de madeira com almofadas
    const n = Math.max(2, Math.round(w / 46)), pw = (w - 8) / n, fb = y + h - bh;
    for (let i = 0; i < n; i++) { c.fillStyle = 'rgba(0,0,0,0.22)'; rr(c, x + 4 + i * pw + 3, fb + 4, pw - 6, bh - 8, 2); c.fill(); c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 1; rr(c, x + 4.5 + i * pw + 3, fb + 4.5, pw - 7, bh - 9, 2); c.stroke(); }
    // bandejas com pães vistas pelo vidro
    const by = y - bh, ah = e - bh;
    c.fillStyle = '#f4ecd8'; rr(c, x + 3, by - h + 2, w - 6, h - 2, 3); c.fill();
    for (let k = x + 12, i = 0; k < x + w - 12; k += 20, i++) {
      const t = i % 4, my = by - h * 0.55;
      if (t === 0) { c.fillStyle = '#c8884a'; c.beginPath(); c.ellipse(k, my, 9, 4, 0.2, 0, TAU); c.fill(); c.fillStyle = '#e8b070'; c.beginPath(); c.ellipse(k - 1, my - 1, 7, 2.6, 0.2, 0, TAU); c.fill(); c.strokeStyle = 'rgba(120,60,20,0.5)'; for (let q = -1; q <= 1; q++) { c.beginPath(); c.moveTo(k + q * 3 - 1, my - 3); c.lineTo(k + q * 3 + 1, my + 2); c.stroke(); } }
      else if (t === 1) { c.fillStyle = '#d8a060'; circ(c, k - 4, my, 4.4, '#d8a060'); circ(c, k + 4, my + 1, 4.4, '#c8904a'); circ(c, k, my - 3, 4, '#e0b070'); }
      else if (t === 2) { c.fillStyle = '#e8c070'; rr(c, k - 8, my - 4, 16, 8, 4); c.fill(); c.fillStyle = '#f8f0e0'; c.fillRect(k - 6, my - 2, 12, 1.6); circ(c, k, my, 1.4, '#c8302a'); }
      else { c.fillStyle = '#8a5a34'; c.beginPath(); c.ellipse(k, my, 8, 4.6, 0, 0, TAU); c.fill(); c.fillStyle = '#f4ecd8'; c.beginPath(); c.ellipse(k, my - 1, 5, 2.4, 0, 0, TAU); c.fill(); circ(c, k, my - 1, 1.4, '#c8302a'); }
      c.fillStyle = '#f2e84a'; c.fillRect(k - 5, by - 2, 9, 2.4);   // etiqueta de preço
    }
    // vidro curvo
    const gv = c.createLinearGradient(x, by - ah - h, x + w, by); gv.addColorStop(0, 'rgba(210,235,250,0.3)'); gv.addColorStop(0.5, 'rgba(210,235,250,0.08)'); gv.addColorStop(1, 'rgba(210,235,250,0.3)');
    c.fillStyle = gv; rr(c, x + 2, by - ah - h + 2, w - 4, ah + h, 5); c.fill(); c.strokeStyle = '#b8bec6'; c.lineWidth = 2; rr(c, x + 2, by - ah - h + 2, w - 4, ah + h, 5); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.moveTo(x + 10, by - ah - h + 4); c.lineTo(x + 26, by - ah - h + 4); c.lineTo(x + 12, by - 2); c.lineTo(x + 6, by - 2); c.closePath(); c.fill();
    // cesta de pão na ponta e balança
    c.fillStyle = '#b88a4a'; rr(c, x + w - 24, ty - 3, 18, 12, 4); c.fill(); contorno(c, x + w - 24, ty - 3, 18, 12, 4); circ(c, x + w - 18, ty, 3.6, '#d8a060'); circ(c, x + w - 12, ty + 1, 3.4, '#c8904a');
  }, { alto: 26 });

  // ======================= CAIXA DE SUPERMERCADO (esteira + registradora) =======================
  reg('caixa_reg', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 22, ty = y - e, r = rng((x + y) | 0), aberto = o.aberto !== false;
    sombra(c, x, y, w, h, { dx: 4, dy: 7, r: 3 });
    // esteira rolante (lado esquerdo) com rolos e produtos
    const bw = w * 0.56;
    caixa(c, x, y, bw, h, e - 8, '#3a3e48', '#22252c', { r: 3, semSombra: true });
    const by = ty + 8; c.fillStyle = '#16181e'; rr(c, x + 3, by, bw - 6, h - 10, 3); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 1; for (let k = 0; k < bw - 6; k += 6) { c.beginPath(); c.moveTo(x + 4 + k, by + 1); c.lineTo(x + 4 + k, by + h - 11); c.stroke(); }
    if (aberto) {
      circ(c, x + 11, by + 10, 4.6, '#e8402a'); circ(c, x + 11 - 1, by + 9, 1.5, 'rgba(255,255,255,0.7)'); c.fillStyle = '#2a58b8'; rr(c, x + 20, by + 5, 9, 14, 2); c.fill(); c.fillStyle = '#f2c82a'; c.fillRect(x + 21, by + 8, 7, 3);
      c.fillStyle = '#6aa83a'; rr(c, x + 33, by + 9, 14, 7, 3); c.fill();
    }
    c.fillStyle = '#e8402a'; c.fillRect(x + bw - 8, by, 2.4, h - 10);   // separador
    // registradora (direita): pedestal, monitor com tela, scanner, gaveta
    const rx = x + bw + 4, rw = w - bw - 4;
    caixa(c, rx, y, rw, h, e, '#d8dce0', '#5a606a', { r: 3, semSombra: true });
    c.fillStyle = '#14161c'; rr(c, rx + 3, ty - 14, rw - 6, 14, 2); c.fill();
    c.fillStyle = aberto ? '#2a8a4a' : '#8a2a2a'; rr(c, rx + 5, ty - 12, rw - 10, 9, 1); c.fill(); c.fillStyle = 'rgba(255,255,255,0.8)'; for (let k = 0; k < 3; k++) c.fillRect(rx + 7, ty - 10.4 + k * 2.6, 8 + k * 3, 1);
    c.fillStyle = '#16181e'; rr(c, rx + 4, ty + 6, rw - 8, 10, 2); c.fill(); c.fillStyle = 'rgba(255,60,40,0.6)'; c.fillRect(rx + 8, ty + 10, rw - 16, 1.4);
    c.fillStyle = 'rgba(0,0,0,0.35)'; for (let k = 0; k < 2; k++) for (let j = 0; j < 3; j++) c.fillRect(rx + 5 + j * 6, ty + h - 12 + k * 4, 4.4, 2.6);
    circ(c, rx + rw - 5, ty - 15, 2.2, aberto ? '#3ad060' : '#e8402a'); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(rx + 2, ty + 0.5, rw - 4, 1.2);
    contorno(c, x, ty, w, h + e, 3);
  }, { alto: 24 });

  // ======================= PILHA DE CARRINHOS =======================
  reg('pilha_carrinhos', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h;
    sombra(c, x, y + 2, w, h, { dx: 5, dy: 7, r: 4 });
    const n = 5;
    for (let i = n - 1; i >= 0; i--) {
      const ox = x + i * 8, oy = y + h * 0.1 - i * 3;   // cada carrinho encaixado no outro, um pouco mais alto
      const cw = w - 38, ch = h * 0.72;
      c.fillStyle = 'rgba(0,0,0,0.15)'; rr(c, ox + 2, oy + 4, cw, ch, 4); c.fill();
      c.fillStyle = 'rgba(210,225,240,0.2)'; rr(c, ox, oy, cw, ch, 4); c.fill(); c.strokeStyle = i === 0 ? '#e8ecf0' : '#aab2ba'; c.lineWidth = 1.2; rr(c, ox, oy, cw, ch, 4); c.stroke();
      c.strokeStyle = 'rgba(190,200,210,0.65)'; c.lineWidth = 0.8; for (let k = 4; k < cw; k += 5) { c.beginPath(); c.moveTo(ox + k, oy + 1); c.lineTo(ox + k, oy + ch - 1); c.stroke(); } for (let k = 4; k < ch; k += 5) { c.beginPath(); c.moveTo(ox + 1, oy + k); c.lineTo(ox + cw - 1, oy + k); c.stroke(); }
      // cabo vermelho
      c.strokeStyle = '#d8302a'; c.lineWidth = 3; c.beginPath(); c.moveTo(ox + cw - 1, oy + 1); c.lineTo(ox + cw + 10, oy - 1); c.stroke();
      circ(c, ox + 4, oy + ch + 1, 1.8, '#2a2d34'); circ(c, ox + cw - 4, oy + ch + 1, 1.8, '#2a2d34');
    }
    c.fillStyle = '#d8302a'; rr(c, x + 8 * (n - 1) + w - 38 + 4, y + h * 0.1 - (n - 1) * 3 - 3, 12, 4, 2); c.fill();
  }, { alto: 14, pad: 14 });

  // ======================= TORRE DE VIGIA (pátio da cadeia) =======================
  reg('torre', (c, o) => {
    const x = o.x, y = o.y, w = o.w;
    const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#6a707a'); g.addColorStop(0.5, '#4a4f58'); g.addColorStop(1, '#2a2d34'); c.fillStyle = g; c.fillRect(x, y - 150, w, 150);
    c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1; for (let k = 0; k < 150; k += 14) { c.beginPath(); c.moveTo(x, y - k); c.lineTo(x + w, y - k); c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + w, y - 150, 6, 152);
    // cabine com vidro, farol e telhado
    c.fillStyle = '#16181e'; rr(c, x - 12, y - 190, w + 24, 46, 4); c.fill(); c.fillStyle = '#e8d890'; for (let k = 0; k < 3; k++) { c.fillRect(x - 8 + k * ((w + 16) / 3), y - 182, (w + 16) / 3 - 4, 24); }
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x - 8, y - 182, w + 16, 4); c.fillStyle = '#3a3e48'; c.fillRect(x - 16, y - 196, w + 32, 8);
    circ(c, x + w / 2, y - 200, 5, '#fffbe0'); c.fillStyle = 'rgba(255,250,200,0.15)'; c.beginPath(); c.moveTo(x + w / 2, y - 200); c.lineTo(x - 80, y - 90); c.lineTo(x + w + 80, y - 90); c.closePath(); c.fill();
    c.fillStyle = '#2a2d34'; c.fillRect(x + w * 0.35, y - 30, w * 0.3, 30);
  }, { alto: 210, pad: 90 });

  // ======================= HALTER (barra com anilhas, pátio) =======================
  reg('halter', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, cy = y - 4;
    sombra(c, x, y, w, h, { dx: 4, dy: 7, r: 3 });
    // banco de peso
    caixa(c, x + w * 0.3, y + 2, w * 0.4, h - 2, 8, '#2a2d36', '#16181e', { r: 4, semSombra: true });
    [x + w * 0.2, x + w * 0.76].forEach(px => { barra(c, px, cy - 30, 4, 40, '#4a4f58'); });
    const by = cy - 24; const gb = c.createLinearGradient(0, by, 0, by + 4); gb.addColorStop(0, '#f2f4f6'); gb.addColorStop(1, '#8a9099'); c.fillStyle = gb; c.fillRect(x + 2, by, w - 4, 4);
    [[x + 2, 1], [x + w - 2, -1]].forEach(([px, sg]) => { [['#16181e', 8, 30], ['#d8302a', 5, 24], ['#2a58b8', 4, 18]].forEach(([cc, ww, hh2], k) => { const off = [0, 8, 13][k]; const xx = sg > 0 ? px + off : px - ww - off; barra(c, xx, by + 2 - hh2 / 2, ww, hh2, cc); }); });
  }, { alto: 36, pad: 14 });

  // ======================= BALANÇA, SACO, COFRE DE BANCO... (extras de lugar) =======================
  // cofre-forte do banco: porta redonda de aço com volante
  const cofreBanco = (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 46, fy = y + h - e;
    caixa(c, x, y, w, h, e, '#6a707a', '#4a4f58', { r: 4 });
    c.fillStyle = 'rgba(0,0,0,0.25)'; rr(c, x + 6, fy + 6, w - 12, e - 12, 3); c.fill();
    const cx = x + w / 2, cy = fy + e / 2, r = Math.min(e / 2 - 5, w * 0.3);
    const g = c.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 2, cx, cy, r); g.addColorStop(0, '#d8dce0'); g.addColorStop(1, '#7a808a'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill(); contorno(c, cx - r, cy - r, r * 2, r * 2, r);
    c.strokeStyle = '#3a3e48'; c.lineWidth = 2.4; for (let k = 0; k < 6; k++) { const a = k * TAU / 6; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8); c.stroke(); circ(c, cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8, 2, '#c8a24a'); }
    circ(c, cx, cy, 3.6, '#2a2d34'); c.fillStyle = '#e8c870'; c.beginPath(); c.arc(cx, cy, 1.6, 0, TAU); c.fill();
    for (let k = 0; k < 4; k++) circ(c, x + 6 + (k % 2) * (w - 12), fy + 6 + ((k / 2) | 0) * (e - 12), 1.6, '#aab0b8');
  };
  reg('cofre_banco', cofreBanco, { alto: 12 });
})(window.G = window.G || {});
