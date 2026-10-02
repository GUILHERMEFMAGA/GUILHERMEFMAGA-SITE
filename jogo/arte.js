/* ============================================================
   arte.js — a "pintura" do mundo: janelas realistas, paredes, telhados,
   casas de vários formatos (térrea, sobrado, em L, em U, mansão...) e quintais.
   Tudo é desenhado por código no canvas (sem imagens).
   É usado por world.js (casas e prédios do mapa) e por cidade.js (obras prontas).
   ============================================================ */
(function (G) {
  'use strict';
  const A = G.arte = {};
  const T = 32;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- utilidades ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  A.mulberry32 = mulberry32;
  // lê '#rrggbb' ou 'rgb(r,g,b)' e devolve [r,g,b]
  function rgb(c) {
    if (c[0] === '#') { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    const m = c.match(/\d+/g); return [+m[0], +m[1], +m[2]];
  }
  // clareia (+) ou escurece (-) uma cor
  function shade(c, k) {
    const v = rgb(c), f = x => Math.max(0, Math.min(255, Math.round(k >= 0 ? x + (255 - x) * k : x * (1 + k))));
    return 'rgb(' + f(v[0]) + ',' + f(v[1]) + ',' + f(v[2]) + ')';
  }
  function mix(c1, c2, t) { const a = rgb(c1), b = rgb(c2); return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')'; }
  A.shade = shade; A.mix = mix;
  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

  // ---------- paletas ----------
  // paredes por estilo de cidade: cor + material
  A.PAREDES = {
    classica: [['#efe3c4', 'reboco'], ['#e6cfa6', 'reboco'], ['#f5f0e4', 'reboco'], ['#dcae8c', 'reboco'], ['#cdd9c4', 'reboco'], ['#b9593a', 'tijolo'], ['#e9d29a', 'reboco'], ['#c9bfa6', 'pedra']],
    moderna: [['#f4f4f2', 'reboco'], ['#d9dde2', 'concreto'], ['#3f4650', 'reboco'], ['#e8e2d6', 'reboco'], ['#b7bdc6', 'concreto'], ['#8a6f55', 'madeira']],
    ecologica: [['#d9e4c8', 'reboco'], ['#9a7650', 'madeira'], ['#e7dcbd', 'reboco'], ['#7d9a6c', 'madeira'], ['#c9d8b4', 'reboco'], ['#b08a5a', 'madeira']],
    portuaria: [['#8fc3dd', 'reboco'], ['#f2e3b0', 'reboco'], ['#f4a58a', 'reboco'], ['#ffffff', 'reboco'], ['#a9d6b0', 'reboco'], ['#6f8fb8', 'madeira'], ['#e9c46a', 'reboco']],
    rustica: [['#a4552f', 'tijolo'], ['#8f6a45', 'madeira'], ['#b9a98a', 'pedra'], ['#d8c7a0', 'reboco'], ['#7a5a3a', 'madeira']]
  };
  // cores de telha: [base]
  A.TELHAS = {
    classica: ['#c2602e', '#b44a30', '#a85430', '#7b5a42', '#5d636b', '#c9703a'],
    moderna: ['#5b6068', '#3c3f47', '#8b9098', '#6a6f78'],
    ecologica: ['#476b50', '#6a7a44', '#7b5a42', '#5a7a5a'],
    portuaria: ['#3f6d96', '#c0463a', '#5d7a9a', '#2f5b7a', '#b8493a'],
    rustica: ['#7b5a42', '#5d4636', '#8a6a48', '#4a4038']
  };
  const MOLDURAS = ['#f4f1e8', '#f4f1e8', '#ffffff', '#4a3526', '#2f3640', '#d9d2bd'];

  // ============================================================
  //  JANELA REALISTA
  //  o: { cor (moldura), luz (acesa), cortina, persiana (0..1), veneziana (cor), flores (bool),
  //       arco, redonda, grade, ar (aparelho de ar), rng, vidro (tom), sacada }
  // ============================================================
  A.janela = function (ctx, x, y, w, h, o) {
    o = o || {};
    const r = o.rng || Math.random, cor = o.cor || '#f4f1e8';
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    // folhas de veneziana (persiana de madeira) dos dois lados
    if (o.veneziana) {
      const sw = Math.max(4, Math.round(w * 0.46));
      [x - sw - 1, x + w + 1].forEach(sx => {
        ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(sx + 1, y - 1, sw, h + 3);
        ctx.fillStyle = o.veneziana; ctx.fillRect(sx, y - 1, sw, h + 2);
        ctx.fillStyle = 'rgba(0,0,0,0.28)'; for (let yy = y + 1; yy < y + h; yy += 3) ctx.fillRect(sx + 1, yy, sw - 2, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(sx, y - 1, sw, 1); ctx.fillRect(sx, y - 1, 1, h + 2);
      });
    }
    // recuo da parede (a janela é embutida, sombra em volta)
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    if (o.arco) { ctx.fillRect(x - 2, y + w / 2 - 1, w + 4, h - w / 2 + 3); ctx.beginPath(); ctx.arc(x + w / 2, y + w / 2, w / 2 + 2, Math.PI, 0); ctx.fill(); }
    else if (o.redonda) { ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w / 2 + 2.5, 0, TAU); ctx.fill(); }
    else ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    // moldura
    ctx.fillStyle = cor;
    if (o.arco) { ctx.fillRect(x - 1, y + w / 2, w + 2, h - w / 2 + 1); ctx.beginPath(); ctx.arc(x + w / 2, y + w / 2, w / 2 + 1, Math.PI, 0); ctx.fill(); }
    else if (o.redonda) { ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w / 2 + 1, 0, TAU); ctx.fill(); }
    else ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    // vidro
    const gx = x + 1, gy = y + 1, gw = w - 2, gh = h - 2;
    ctx.save(); ctx.beginPath();
    if (o.arco) { ctx.rect(gx, gy + w / 2, gw, gh - w / 2); ctx.moveTo(gx + gw, gy + w / 2); ctx.arc(x + w / 2, gy + w / 2, gw / 2, 0, Math.PI, true); }
    else if (o.redonda) ctx.arc(x + w / 2, y + h / 2, w / 2 - 1, 0, TAU);
    else ctx.rect(gx, gy, gw, gh);
    ctx.clip();
    const g = ctx.createLinearGradient(0, gy, 0, gy + gh);
    if (o.luz) { g.addColorStop(0, '#fff1bd'); g.addColorStop(0.5, '#ffd978'); g.addColorStop(1, '#e8963a'); }
    else { const v = o.vidro || '#9cc9e4'; g.addColorStop(0, v); g.addColorStop(0.45, mix(v, '#2d4658', 0.55)); g.addColorStop(1, '#1d2e3c'); }
    ctx.fillStyle = g; ctx.fillRect(gx, gy, gw, gh);
    if (o.luz) {
      // dentro do quarto aceso: parede, móvel e um abajur
      ctx.fillStyle = 'rgba(120,60,20,0.30)'; ctx.fillRect(gx, gy + gh * 0.66, gw * (0.4 + r() * 0.4), gh * 0.34);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(gx + gw * (0.1 + r() * 0.5), gy + gh * 0.3, 2, 2);
      ctx.fillStyle = 'rgba(80,40,10,0.35)'; ctx.fillRect(gx + gw * 0.55, gy, gw * 0.45, 2);
    } else {
      // céu e nuvem refletidos + a silhueta de uma árvore do outro lado da rua
      ctx.fillStyle = 'rgba(255,255,255,0.20)'; ctx.beginPath(); ctx.ellipse(gx + gw * 0.35, gy + gh * 0.22, gw * 0.32, gh * 0.10, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(20,50,30,0.38)'; ctx.beginPath(); ctx.ellipse(gx + gw * 0.7, gy + gh * 0.98, gw * 0.5, gh * 0.24, 0, 0, TAU); ctx.fill();
    }
    // cortina: panos dos dois lados com pregas
    if (o.cortina) {
      const cw = Math.max(2, gw * 0.34), cc = o.cortina;
      [[gx, 1], [gx + gw - cw, -1]].forEach(([cx0, dir]) => {
        ctx.fillStyle = cc; ctx.fillRect(cx0, gy, cw, gh);
        ctx.fillStyle = 'rgba(0,0,0,0.20)'; ctx.fillRect(cx0 + cw * 0.35, gy, 1, gh); ctx.fillRect(cx0 + cw * 0.7, gy, 1, gh);
        ctx.fillStyle = 'rgba(255,255,255,0.20)'; ctx.fillRect(cx0 + cw * 0.15, gy, 1, gh);
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(cx0 + (dir > 0 ? 0 : cw - 1), gy + gh * 0.55, cw, 1);   // laço
      });
    }
    // persiana enrolada em cima
    if (o.persiana) {
      const ph = Math.max(2, Math.round(gh * o.persiana));
      ctx.fillStyle = '#ece6d4'; ctx.fillRect(gx, gy, gw, ph);
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; for (let yy = gy + 2; yy < gy + ph; yy += 2) ctx.fillRect(gx, yy, gw, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(gx, gy + ph, gw, 1);
    }
    // reflexo diagonal do sol
    ctx.fillStyle = o.luz ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.26)';
    ctx.beginPath(); ctx.moveTo(gx, gy + gh * 0.62); ctx.lineTo(gx + gw * 0.58, gy); ctx.lineTo(gx + gw * 0.86, gy); ctx.lineTo(gx, gy + gh * 0.95); ctx.closePath(); ctx.fill();
    ctx.restore();
    // caixilho: travessas (vidros divididos)
    ctx.fillStyle = cor;
    if (o.redonda) { ctx.fillRect(x + w / 2 - 0.5, y, 1, h); ctx.fillRect(x, y + h / 2 - 0.5, w, 1); }
    else {
      const cols = w >= 22 ? 3 : w >= 11 ? 2 : 1, rows = h >= 34 ? 3 : h >= 17 ? 2 : 1;
      for (let c = 1; c < cols; c++) ctx.fillRect(Math.round(x + w * c / cols) - 0.5, y, 1, h);
      for (let q = 1; q < rows; q++) ctx.fillRect(x, Math.round(y + h * q / rows) - 0.5, w, 1);
    }
    // sombra interna superior (a verga projeta sombra no vidro)
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(gx, gy, gw, 2);
    // verga (viga acima) e peitoril (soleira que sai da parede)
    if (!o.redonda) {
      ctx.fillStyle = shade(cor, -0.10); if (!o.arco) ctx.fillRect(x - 2, y - 3, w + 4, 2);
      ctx.fillStyle = shade(cor, 0.05); ctx.fillRect(x - 2, y + h + 1, w + 4, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fillRect(x - 1, y + h + 3, w + 2, 2);
    }
    // grade de ferro (casas simples)
    if (o.grade) {
      ctx.fillStyle = 'rgba(30,30,36,0.9)'; for (let xx = gx + 1.5; xx < gx + gw; xx += 3.5) ctx.fillRect(xx, gy, 1, gh);
      ctx.fillRect(gx, gy + gh * 0.5, gw, 1);
    }
    // jardineira com flores
    if (o.flores) {
      ctx.fillStyle = '#6a4228'; ctx.fillRect(x - 1, y + h + 3, w + 2, 4);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - 1, y + h + 6, w + 2, 1);
      const fc = ['#ff5a7a', '#ffd84a', '#ffffff', '#ff8a3c', '#c070e0'];
      for (let xx = x; xx < x + w; xx += 2.5) { ctx.fillStyle = '#2f7a34'; ctx.fillRect(xx, y + h + 1, 2, 3); ctx.fillStyle = fc[Math.floor(r() * fc.length)]; ctx.fillRect(xx, y + h, 2, 2); }
    }
    // sacada: laje de concreto com guarda-corpo de vidro e ferro
    if (o.sacada) {
      ctx.fillStyle = 'rgba(0,0,0,0.34)'; ctx.fillRect(x - 4, y + h + 6, w + 9, 3);
      ctx.fillStyle = '#d9d6cf'; ctx.fillRect(x - 5, y + h + 3, w + 10, 4); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - 5, y + h + 3, w + 10, 1);
      ctx.fillStyle = 'rgba(150,200,225,0.55)'; ctx.fillRect(x - 5, y + h - 5, w + 10, 8);
      ctx.fillStyle = '#4a4e58'; ctx.fillRect(x - 5, y + h - 5, w + 10, 1); for (let xx = x - 5; xx <= x + w + 4; xx += (w + 9) / 3) ctx.fillRect(Math.round(xx), y + h - 5, 1, 8);
    }
    // aparelho de ar-condicionado
    if (o.ar) {
      const ax = x + w * 0.5 - 6, ay = y + h + 3;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(ax + 1, ay + 1, 13, 8); ctx.fillStyle = '#dfe2e6'; ctx.fillRect(ax, ay, 12, 7);
      ctx.fillStyle = '#9aa0a8'; for (let q = 0; q < 4; q++) ctx.fillRect(ax + 2 + q * 2.4, ay + 2, 1, 4); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(ax, ay, 12, 1);
    }
  };

  // ============================================================
  //  PAREDE (a parede da frente, na sombra do beiral)
  //  wall: { cor, tex }
  // ============================================================
  A.parede = function (ctx, x, y, w, h, wall, seed) {
    const r = mulberry32(seed | 0), c = wall.cor;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, shade(c, -0.10)); g.addColorStop(0.55, shade(c, -0.18)); g.addColorStop(1, shade(c, -0.30));
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    if (wall.tex === 'tijolo') {
      ctx.fillStyle = 'rgba(0,0,0,0.20)';
      for (let yy = 0, k = 0; yy < h; yy += 4, k++) {
        ctx.fillRect(x, y + yy + 3, w, 1);
        for (let xx = (k % 2) * 4; xx < w; xx += 8) ctx.fillRect(x + xx, y + yy, 1, 3);
      }
      for (let k = 0; k < w * h / 40; k++) { ctx.fillStyle = r() < 0.5 ? 'rgba(255,200,150,0.10)' : 'rgba(40,10,0,0.14)'; ctx.fillRect(x + r() * w, y + r() * h, 7, 3); }
    } else if (wall.tex === 'madeira') {
      for (let yy = 0; yy < h; yy += 5) { ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.fillRect(x, y + yy + 4, w, 1); ctx.fillStyle = 'rgba(255,255,255,0.09)'; ctx.fillRect(x, y + yy, w, 1); if (r() < 0.5) { ctx.fillStyle = 'rgba(60,30,10,0.10)'; ctx.fillRect(x + r() * w, y + yy + 1, 20 + r() * 40, 2); } }
    } else if (wall.tex === 'pedra') {
      for (let yy = 0, k = 0; yy < h; yy += 7, k++) {
        for (let xx = -(k % 2) * 6; xx < w; xx += 11 + Math.floor(r() * 6)) {
          ctx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'; ctx.fillRect(x + xx, y + yy, 10, 6);
          ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + xx, y + yy + 6, 11, 1); ctx.fillRect(x + xx + 10, y + yy, 1, 7);
        }
      }
    } else if (wall.tex === 'concreto') {
      ctx.fillStyle = 'rgba(0,0,0,0.14)'; for (let xx = 0; xx < w; xx += 40) ctx.fillRect(x + xx, y, 1, h); ctx.fillRect(x, y + h * 0.5, w, 1);
      for (let k = 0; k < 10; k++) { ctx.fillStyle = 'rgba(0,0,0,0.05)'; ctx.fillRect(x + r() * w, y + r() * h * 0.6, 3, 8 + r() * 14); }
    } else {   // reboco: salpicado fino e manchas de umidade
      for (let k = 0; k < w * h / 60; k++) { ctx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'; ctx.fillRect(x + r() * w, y + r() * h, 2, 1); }
      for (let k = 0; k < Math.max(2, w / 60); k++) { const sx = x + r() * w, sy = y + h * (0.1 + r() * 0.3), g2 = ctx.createLinearGradient(0, sy, 0, sy + 14 + r() * 16); g2.addColorStop(0, 'rgba(40,30,10,0.10)'); g2.addColorStop(1, 'rgba(40,30,10,0)'); ctx.fillStyle = g2; ctx.fillRect(sx, sy, 1 + r() * 2, 30); }
    }
    ctx.restore();
    // rodapé (faixa escura embaixo) e quina clara nas pontas
    ctx.fillStyle = shade(c, -0.45); ctx.fillRect(x, y + h - 4, w, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x, y + h - 4, w, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x, y, 1, h); ctx.fillStyle = 'rgba(0,0,0,0.20)'; ctx.fillRect(x + w - 1, y, 1, h);
    // sombra do beiral no alto da parede
    const sg = ctx.createLinearGradient(0, y, 0, y + 8); sg.addColorStop(0, 'rgba(0,0,0,0.5)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg; ctx.fillRect(x, y, w, 8);
  };

  // ============================================================
  //  TELHADOS
  //  pal = { base, claro, escuro }  tipo: 'duas' | 'quatro' | 'plano' | 'meia'
  // ============================================================
  function telhasLinhas(ctx, x, y, w, h, base, horiz, r, passo) {
    // várias fileiras de telhas com variação de tom e juntas alternadas
    passo = passo || 6;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
    const n = Math.ceil((horiz ? h : w) / passo);
    for (let k = 0; k < n; k++) {
      const v = (r() - 0.5) * 0.12;
      ctx.fillStyle = v > 0 ? 'rgba(255,255,255,' + v + ')' : 'rgba(0,0,0,' + (-v) + ')';
      if (horiz) ctx.fillRect(x, y + k * passo, w, passo); else ctx.fillRect(x + k * passo, y, passo, h);
      ctx.fillStyle = 'rgba(0,0,0,0.30)';
      if (horiz) { ctx.fillRect(x, y + k * passo + passo - 1, w, 1); for (let xx = (k % 2) * 5; xx < w; xx += 10) ctx.fillRect(x + xx, y + k * passo, 1, passo - 1); }
      else { ctx.fillRect(x + k * passo + passo - 1, y, 1, h); for (let yy = (k % 2) * 5; yy < h; yy += 10) ctx.fillRect(x + k * passo, y + yy, passo - 1, 1); }
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      if (horiz) ctx.fillRect(x, y + k * passo, w, 1); else ctx.fillRect(x + k * passo, y, 1, h);
    }
    ctx.restore();
  }
  // telhado (a área do telhado visto de cima). Devolve nada; desenha dentro de (x,y,w,h).
  A.telhado = function (ctx, x, y, w, h, tipo, crista, pal, seed) {
    const r = mulberry32(seed | 0);
    // sombra do beiral para a parede (fica logo abaixo)
    ctx.fillStyle = 'rgba(0,0,10,0.30)'; ctx.fillRect(x + 2, y + h, w - 2, 3);
    if (tipo === 'plano') {
      ctx.fillStyle = pal.escuro; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = pal.claro; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      ctx.fillStyle = pal.base; ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
      ctx.save(); ctx.beginPath(); ctx.rect(x + 6, y + 6, w - 12, h - 12); ctx.clip();
      for (let k = 0; k < (w * h) / 50; k++) { ctx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'; ctx.fillRect(x + r() * w, y + r() * h, 3, 2); }
      const lg = ctx.createLinearGradient(x, y, x + w, y + h); lg.addColorStop(0, 'rgba(255,255,255,0.14)'); lg.addColorStop(1, 'rgba(0,0,30,0.16)'); ctx.fillStyle = lg; ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 2, y + 2, w - 4, 2); ctx.fillRect(x + 2, y + 2, 2, h - 4);
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fillRect(x + 2, y + h - 4, w - 4, 2); ctx.fillRect(x + w - 4, y + 2, 2, h - 4);
      return;
    }
    if (tipo === 'meia') {   // uma água só: cai para a frente
      telhasLinhas(ctx, x, y, w, h, pal.base, true, r, 6);
      const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,0.16)'); g.addColorStop(1, 'rgba(0,0,30,0.22)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = pal.claro; ctx.fillRect(x, y, w, 3);
      ctx.strokeStyle = pal.escuro; ctx.lineWidth = 1.5; ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
      return;
    }
    if (tipo === 'quatro' && Math.min(w, h) > 40) {
      const horiz = w >= h, k = (horiz ? h : w) / 2, cx = x + w / 2, cy = y + h / 2;
      const A1 = horiz ? [x + k, cy] : [cx, y + k], B1 = horiz ? [x + w - k, cy] : [cx, y + h - k];
      const faces = [
        { pts: [x, y, x + w, y, B1[0], B1[1], A1[0], A1[1]], lado: 'topo' },
        { pts: [x, y + h, x + w, y + h, B1[0], B1[1], A1[0], A1[1]], lado: 'baixo' },
        { pts: [x, y, x, y + h, A1[0], A1[1]], lado: 'esq' },
        { pts: [x + w, y, x + w, y + h, B1[0], B1[1]], lado: 'dir' }];
      faces.forEach(f => {
        ctx.save(); ctx.beginPath(); ctx.moveTo(f.pts[0], f.pts[1]); for (let q = 2; q < f.pts.length; q += 2) ctx.lineTo(f.pts[q], f.pts[q + 1]); ctx.closePath(); ctx.clip();
        telhasLinhas(ctx, x, y, w, h, pal.base, f.lado === 'topo' || f.lado === 'baixo', r, 6);
        ctx.fillStyle = { topo: 'rgba(255,255,255,0.20)', esq: 'rgba(255,255,255,0.08)', dir: 'rgba(0,0,25,0.20)', baixo: 'rgba(0,0,25,0.32)' }[f.lado]; ctx.fillRect(x, y, w, h);
        ctx.restore();
      });
      ctx.strokeStyle = pal.escuro; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(A1[0], A1[1]); ctx.lineTo(B1[0], B1[1]); ctx.moveTo(A1[0], A1[1]); ctx.lineTo(x, y); ctx.moveTo(A1[0], A1[1]); ctx.lineTo(x, y + h); ctx.moveTo(B1[0], B1[1]); ctx.lineTo(x + w, y); ctx.moveTo(B1[0], B1[1]); ctx.lineTo(x + w, y + h); ctx.stroke();
      ctx.strokeStyle = pal.claro; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(A1[0], A1[1] - 1.5); ctx.lineTo(B1[0], B1[1] - 1.5); ctx.stroke();
      ctx.strokeStyle = pal.escuro; ctx.lineWidth = 2.5; ctx.strokeRect(x + 1.25, y + 1.25, w - 2.5, h - 2.5);
      return;
    }
    // DUAS ÁGUAS: duas abas, uma ao sol e outra na sombra, cumeeira no meio
    const horiz = crista !== 'v';
    if (horiz) {
      const m = Math.round(h / 2);
      telhasLinhas(ctx, x, y, w, m, pal.base, true, r, 6); telhasLinhas(ctx, x, y + m, w, h - m, pal.base, true, r, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x, y, w, m); ctx.fillStyle = 'rgba(0,0,28,0.26)'; ctx.fillRect(x, y + m, w, h - m);
      ctx.fillStyle = pal.claro; ctx.fillRect(x, y + m - 3, w, 5); ctx.fillStyle = pal.escuro; ctx.fillRect(x, y + m + 2, w, 1.5);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, y + m - 3, w, 1);
    } else {
      const m = Math.round(w / 2);
      telhasLinhas(ctx, x, y, m, h, pal.base, false, r, 6); telhasLinhas(ctx, x + m, y, w - m, h, pal.base, false, r, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x, y, m, h); ctx.fillStyle = 'rgba(0,0,28,0.26)'; ctx.fillRect(x + m, y, w - m, h);
      ctx.fillStyle = pal.claro; ctx.fillRect(x + m - 3, y, 5, h); ctx.fillStyle = pal.escuro; ctx.fillRect(x + m + 2, y, 1.5, h);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + m - 3, y, 1, h);
    }
    ctx.strokeStyle = pal.escuro; ctx.lineWidth = 2.5; ctx.strokeRect(x + 1.25, y + 1.25, w - 2.5, h - 2.5);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
  };

  // pequenos objetos de telhado
  function chamine(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,10,0.32)'; ctx.fillRect(x + 4, y + 5, 12, 14);
    ctx.fillStyle = '#8f4a36'; ctx.fillRect(x, y, 12, 14);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let q = 0; q < 14; q += 4) ctx.fillRect(x, y + q + 3, 12, 1);
    ctx.fillStyle = '#c8c2b8'; ctx.fillRect(x - 1, y - 1, 14, 3); ctx.fillStyle = '#1a1210'; ctx.fillRect(x + 3, y + 2, 6, 5);
  }
  function claraboia(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(0,0,10,0.3)'; ctx.fillRect(x + 3, y + 3, w, h); ctx.fillStyle = '#e8eaee'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#bfe4f4'); g.addColorStop(1, '#4a86a8'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w * 0.5, y); ctx.lineTo(x + w * 0.75, y); ctx.lineTo(x + w * 0.2, y + h); ctx.fill();
  }
  function paineisSolares(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(0,0,10,0.3)'; ctx.fillRect(x + 3, y + 4, w, h);
    ctx.fillStyle = '#1b3560'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#7da0d8'; ctx.lineWidth = 1; ctx.beginPath();
    for (let xx = x + 8; xx < x + w; xx += 8) { ctx.moveTo(xx + 0.5, y); ctx.lineTo(xx + 0.5, y + h); }
    for (let yy = y + 7; yy < y + h; yy += 7) { ctx.moveTo(x, yy + 0.5); ctx.lineTo(x + w, yy + 0.5); } ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * 0.45, y); ctx.lineTo(x, y + h * 0.7); ctx.fill();
    ctx.strokeStyle = '#d6dae2'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  function antena(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,10,0.3)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 4, 7, 5, 0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#dcdfe4'; ctx.beginPath(); ctx.ellipse(x, y, 7, 5.5, -0.6, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#555a64'; ctx.beginPath(); ctx.arc(x + 2, y - 2, 1.4, 0, TAU); ctx.fill();
  }
  function caixaDagua(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,10,0.3)'; ctx.beginPath(); ctx.arc(x + 4, y + 5, 10, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 10); g.addColorStop(0, '#6fb4e8'); g.addColorStop(1, '#2a6aa8'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#1f4a78'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#e8eef4'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, TAU); ctx.fill();
  }
  // água-furtada (janelinha que sai do telhado) — fica na água da frente
  function aguaFurtada(ctx, x, y, pal, wall, seed, luz) {
    const r = mulberry32(seed), w = 26, h = 22;
    ctx.fillStyle = 'rgba(0,0,10,0.34)'; ctx.fillRect(x + 4, y + 5, w, h);
    ctx.fillStyle = wall.cor; ctx.fillRect(x, y + 8, w, h - 8);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, y + 8, w, h - 8);
    A.janela(ctx, x + 6, y + 11, 14, h - 14, { cor: '#f4f1e8', luz, rng: r, vidro: '#9cc9e4' });
    ctx.fillStyle = pal.escuro; ctx.beginPath(); ctx.moveTo(x - 3, y + 9); ctx.lineTo(x + w / 2, y - 3); ctx.lineTo(x + w + 3, y + 9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = pal.base; ctx.beginPath(); ctx.moveTo(x - 1, y + 8); ctx.lineTo(x + w / 2, y - 1); ctx.lineTo(x + w + 1, y + 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(x - 1, y + 8); ctx.lineTo(x + w / 2, y - 1); ctx.lineTo(x + w / 2, y + 8); ctx.closePath(); ctx.fill();
  }

  // ============================================================
  //  PORTAS
  // ============================================================
  function porta(ctx, cx, yBase, h, o) {
    const w = o.larga ? 24 : 18, x = Math.round(cx - w / 2), y = yBase - h;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x - 3, y - 3, w + 6, h + 3);                     // recuo
    ctx.fillStyle = o.moldura || '#f4f1e8'; ctx.fillRect(x - 2, y - 2, w + 4, h + 2);                // batente
    const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, shade(o.cor, 0.10)); g.addColorStop(1, shade(o.cor, -0.22)); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    // almofadas (painéis) da porta
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    const pw = (w - 6) / 2; for (let qx = 0; qx < 2; qx++) { ctx.fillRect(x + 2 + qx * (pw + 2), y + 3, pw, h * 0.38); ctx.fillRect(x + 2 + qx * (pw + 2), y + h * 0.5, pw, h * 0.42); }
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; for (let qx = 0; qx < 2; qx++) { ctx.fillRect(x + 2 + qx * (pw + 2), y + 3, pw, 1); ctx.fillRect(x + 2 + qx * (pw + 2), y + h * 0.5, pw, 1); }
    if (o.vidro) { ctx.fillStyle = '#9ac4dc'; ctx.fillRect(x + 3, y + 4, w - 6, h * 0.34); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x + 3, y + 4, 3, h * 0.34); }
    ctx.fillStyle = '#e6c25a'; ctx.fillRect(x + w - 5, y + h * 0.5, 2, 3);                           // maçaneta
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - 2, yBase, w + 4, 1);
    // degrau de pedra
    ctx.fillStyle = '#cfc8b4'; ctx.fillRect(x - 4, yBase, w + 8, 3); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - 4, yBase + 3, w + 8, 1);
    // lampadinha ao lado
    if (o.lampada) { ctx.fillStyle = '#4a4a50'; ctx.fillRect(x + w + 4, y + 2, 3, 5); ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(x + w + 5.5, y + 9, 2.2, 0, TAU); ctx.fill(); }
  }
  function portaoGaragem(ctx, x, yBase, w, h, cor, r) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - 2, yBase - h - 2, w + 4, h + 2);
    ctx.fillStyle = cor; ctx.fillRect(x, yBase - h, w, h);
    for (let yy = yBase - h; yy < yBase - 2; yy += 6) { ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.fillRect(x, yy + 5, w, 1); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x, yy, w, 1); }
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x, yBase - h, w * 0.4, h);
    ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(x, yBase - h, w, 2);
    for (let k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(170,200,220,0.5)'; ctx.fillRect(x + 4 + k * ((w - 10) / 4), yBase - h + 5, (w - 10) / 4 - 3, 3); }   // visores de vidro
    ctx.fillStyle = '#dcdcdc'; ctx.fillRect(x + w / 2 - 3, yBase - 6, 6, 2);
  }

  // ============================================================
  //  UMA PARTE DA CASA (corpo, ala ou garagem): parede + telhado + detalhes
  //  p = parte em pixels { x,y,w,h, andares, teto, crista, t, varanda }
  //  c = a casa (c.wall, c.pal, c.moldura, c.porta, c.seed, c.rq, c.est)
  // ============================================================
  function fachadaAltura(p) { return p.t === 'garagem' ? 30 : p.andares === 2 ? 58 : 36; }
  A.fachadaAltura = fachadaAltura;
  function desenhaParte(ctx, p, c, jl) {
    const fh = fachadaAltura(p), wy = p.y + p.h - fh, r = mulberry32(c.seed + p.x * 3 + p.y * 7);
    const wall = c.wall;
    // parede
    A.parede(ctx, p.x, wy, p.w, fh, wall, c.seed + Math.floor(p.x));
    // janelas
    const nAnd = p.t === 'garagem' ? 1 : p.andares;
    const rowH = (fh - 8) / nAnd, wh = Math.min(22, rowH - 12), ww = p.w >= 150 ? 16 : 14;
    const cx = p.x + p.w / 2;
    let temPorta = p.t === 'corpo', slots = [];
    const nSlot = Math.max(1, Math.floor((p.w - 10) / (ww + 18)));
    const gap = (p.w - 10) / nSlot;
    for (let k = 0; k < nSlot; k++) slots.push(p.x + 5 + gap * (k + 0.5));
    if (p.t === 'garagem') {
      const gw = Math.min(p.w - 14, 54);
      portaoGaragem(ctx, Math.round(cx - gw / 2), p.y + p.h - 2, gw, fh - 8, c.garagemCor, r);
    } else {
      for (let andar = 0; andar < nAnd; andar++) {
        const baseY = wy + 8 + andar * rowH + (rowH - wh) / 2 - 2;
        // andar de cima tem janelas; andar de baixo tem janelas + porta
        slots.forEach((sx, k) => {
          const ehPorta = temPorta && andar === nAnd - 1 && Math.abs(sx - cx) < (ww + 22);
          if (ehPorta) return;
          const luz = r() < 0.38, jo = {
            cor: c.moldura, luz, rng: r, cortina: r() < 0.55 ? pick(r, ['#e8d8b8', '#d89a9a', '#9ac0d8', '#e8e8e8', '#b8d8b0']) : null,
            persiana: !luz && r() < 0.25 ? 0.25 + r() * 0.5 : 0, veneziana: c.veneziana && r() < 0.8 ? c.veneziana : null,
            flores: andar === nAnd - 1 && c.rq >= 1 && r() < 0.3, grade: c.rq === 0 && andar === nAnd - 1 && r() < 0.6,
            arco: c.est === 'classica' && c.rq === 2 && r() < 0.5, ar: c.rq >= 1 && r() < 0.15, vidro: c.vidro
          };
          A.janela(ctx, sx - ww / 2, baseY, ww, wh, jo);
          if (luz && jl) jl.push({ x: sx - ww / 2 - 1, y: baseY - 1, w: ww + 2, h: wh + 2 });
        });
      }
      if (temPorta) {
        porta(ctx, cx, p.y + p.h - 1, Math.min(fh - 7, 30), { cor: c.porta, moldura: c.moldura, vidro: c.rq >= 1, larga: c.rq === 2, lampada: true });
        if (p.varanda) {   // varanda: faixa de telhado + colunas
          const vw = Math.min(p.w - 8, 92), vx = cx - vw / 2, vy = p.y + p.h - fh + 6;
          ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fillRect(vx + 3, vy + 12, vw, 6);
          telhasLinhas(ctx, vx, vy, vw, 13, c.pal.base, true, r, 4);
          ctx.fillStyle = 'rgba(0,0,25,0.25)'; ctx.fillRect(vx, vy + 6, vw, 7); ctx.fillStyle = c.pal.escuro; ctx.fillRect(vx, vy + 12, vw, 2); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(vx, vy, vw, 1);
          [vx + 3, vx + vw - 6].forEach(px => { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px + 2, vy + 13, 3, fh - 17); ctx.fillStyle = '#f2eee2'; ctx.fillRect(px, vy + 13, 3, fh - 17); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(px + 2, vy + 13, 1, fh - 17); });
        } else if (c.est !== 'moderna') {
          // toldo sobre a porta
          const aw = 40, ax = cx - aw / 2, ay = p.y + p.h - Math.min(fh - 7, 30) - 9, cs = c.toldo;
          ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(ax + 2, ay + 6, aw, 4);
          for (let k = 0; k < 8; k++) { ctx.fillStyle = cs[k % 2]; ctx.fillRect(ax + k * (aw / 8), ay, aw / 8 + 0.5, 7); }
          ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(ax, ay + 5, aw, 2); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(ax, ay, aw, 1);
        }
      }
    }
    // calha e canos de chuva
    ctx.fillStyle = 'rgba(200,204,210,0.75)'; ctx.fillRect(p.x + 3, wy + 3, 2, fh - 7); ctx.fillRect(p.x + p.w - 5, wy + 3, 2, fh - 7);
    // telhado (acima da parede)
    const ry = p.y, rh = p.h - fh + 3;
    A.telhado(ctx, p.x - 2, ry, p.w + 4, rh, p.teto, p.crista, c.pal, c.seed + Math.floor(p.y));
    ctx.fillStyle = 'rgba(0,0,10,0.28)'; ctx.fillRect(p.x, ry + rh, p.w, 3);   // sombra do beiral na parede
    return { ry, rh };
  }

  // ============================================================
  //  A CASA INTEIRA (todas as partes, de trás para frente)
  //  b.casa3 = { partes (px), wall, pal, ... }
  // ============================================================
  A.drawCasa = function (ctx, b) {
    const c = b.casa3, jl = [];
    const ordem = c.partes.slice().sort((a, d) => (a.y + a.h) - (d.y + d.h) || a.x - d.x);
    ordem.forEach(p => {
      const info = desenhaParte(ctx, p, c, jl);
      // detalhes do telhado (só no corpo e nas alas grandes)
      const rr = mulberry32(c.seed + Math.floor(p.x) * 5 + 11), rx = p.x + 12, ry2 = p.y + 10, rw = p.w - 24, rh2 = info.rh - 18;
      if (p.t !== 'garagem' && rw > 30 && rh2 > 20) {
        if (p.teto === 'plano') {
          if (c.est === 'ecologica' || c.est === 'moderna') { if (rw > 60) paineisSolares(ctx, rx + rw * 0.1, ry2 + 6, Math.min(48, rw * 0.5), Math.min(26, rh2 - 12)); }
          caixaDagua(ctx, rx + rw - 12, ry2 + rh2 / 2); if (rr() < 0.5) antena(ctx, rx + 12, ry2 + rh2 * 0.5);
        } else {
          if (p.t === 'corpo' && rr() < 0.7 && c.chamine) chamine(ctx, rx + rw * (0.15 + rr() * 0.6), ry2 + 4);
          if (p.t === 'corpo' && c.furtada && info.rh > 38 && p.w > 110) aguaFurtada(ctx, p.x + p.w * 0.5 - 13 + (rr() < 0.5 ? -p.w * 0.22 : p.w * 0.22), p.y + info.rh - 24, c.pal, c.wall, c.seed + 5, rr() < 0.4);
          if (c.est === 'ecologica' && rw > 70) paineisSolares(ctx, rx + 6, ry2 + info.rh * 0.45, Math.min(44, rw * 0.4), 20);
          if (rr() < 0.25) antena(ctx, rx + rw * rr(), ry2 + rh2 * 0.3);
          if (rr() < 0.18) claraboia(ctx, rx + rw * (0.2 + rr() * 0.5), ry2 + rh2 * 0.35, 14, 10);
        }
      }
    });
    b.jl = jl;   // janelas acesas (a luz da noite usa isto)
  };

  // ============================================================
  //  QUINTAL (o chão em volta da casa): gramado, caminho, garagem, cerca, flores, piscina
  //  q em pixels: { x,y,w,h (lote), cerca, portaoX, caminho:{x,y0,y1}, garagem:{x,w,y0,y1}, piscina, canteiros, arbustos }
  // ============================================================
  A.drawQuintal = function (ctx, q, tex, seed) {
    const r = mulberry32(seed | 0), { x, y, w, h } = q;
    // gramado com faixas de corte
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    if (tex && tex.grass) { ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fillRect(x, y, w, h); }
    else { ctx.fillStyle = '#4f9a3a'; ctx.fillRect(x, y, w, h); }
    for (let yy = 0, k = 0; yy < h; yy += 14, k++) { ctx.fillStyle = k % 2 ? 'rgba(255,255,255,0.045)' : 'rgba(0,30,0,0.06)'; ctx.fillRect(x, y + yy, w, 14); }
    // piscina (com borda de pedra, água e espreguiçadeiras)
    if (q.piscina) {
      const p = q.piscina;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; rrect(ctx, p.x + 3, p.y + 4, p.w, p.h, 10); ctx.fill();
      ctx.fillStyle = '#e4dfd0'; rrect(ctx, p.x - 6, p.y - 6, p.w + 12, p.h + 12, 12); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let xx = p.x - 6; xx < p.x + p.w + 6; xx += 8) ctx.fillRect(xx, p.y - 6, 1, p.h + 12);
      const g = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h); g.addColorStop(0, '#5fd8ee'); g.addColorStop(1, '#1f9ad0');
      ctx.fillStyle = g; rrect(ctx, p.x, p.y, p.w, p.h, 8); ctx.fill();
      ctx.save(); rrect(ctx, p.x, p.y, p.w, p.h, 8); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
      for (let k = 0; k < 6; k++) { const yy = p.y + 6 + k * (p.h - 10) / 5; ctx.beginPath(); ctx.moveTo(p.x, yy); ctx.bezierCurveTo(p.x + p.w * 0.3, yy - 3, p.x + p.w * 0.6, yy + 3, p.x + p.w, yy); ctx.stroke(); }
      ctx.restore();
      [0, 1].forEach(k => { ctx.fillStyle = '#f4f0e4'; ctx.fillRect(p.x + 6 + k * 16, p.y + p.h + 9, 12, 6); ctx.fillStyle = k ? '#d6503a' : '#2a7ad0'; ctx.fillRect(p.x + 6 + k * 16, p.y + p.h + 9, 12, 2); });
    }
    // canteiros de flores e arbustos
    (q.canteiros || []).forEach(c => {
      ctx.fillStyle = '#5a3d26'; rrect(ctx, c.x, c.y, c.w, c.h, 5); ctx.fill();
      const fc = [['#ff5a7a', '#ffd84a'], ['#ffffff', '#ffd84a'], ['#c070e0', '#ffffff'], ['#ff8a3c', '#ffe070']][Math.floor(r() * 4)];
      for (let k = 0; k < c.w * c.h / 22; k++) { ctx.fillStyle = r() < 0.4 ? '#2f7a34' : fc[Math.floor(r() * 2)]; ctx.beginPath(); ctx.arc(c.x + 4 + r() * (c.w - 8), c.y + 4 + r() * (c.h - 8), 1.6 + r() * 1.4, 0, TAU); ctx.fill(); }
    });
    (q.arbustos || []).forEach(a => {
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(a.x + 3, a.y + 4, a.r, a.r * 0.85, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2b6a2a'; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3f8a38'; ctx.beginPath(); ctx.arc(a.x - a.r * 0.25, a.y - a.r * 0.25, a.r * 0.72, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(190,255,150,0.30)'; ctx.beginPath(); ctx.arc(a.x - a.r * 0.4, a.y - a.r * 0.4, a.r * 0.35, 0, TAU); ctx.fill();
      if (a.flor) { for (let k = 0; k < 5; k++) { ctx.fillStyle = a.flor; ctx.fillRect(a.x - a.r + r() * a.r * 1.8, a.y - a.r + r() * a.r * 1.8, 2, 2); } }
    });
    // caminho de lajotas até a porta
    if (q.caminho) {
      const c = q.caminho;
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(c.x - 12, c.y0 + 2, 26, c.y1 - c.y0);
      ctx.fillStyle = '#d8d0b8'; ctx.fillRect(c.x - 12, c.y0, 24, c.y1 - c.y0);
      ctx.fillStyle = 'rgba(0,0,0,0.20)'; for (let yy = c.y0; yy < c.y1; yy += 10) ctx.fillRect(c.x - 12, yy + 9, 24, 1); ctx.fillRect(c.x, c.y0, 1, c.y1 - c.y0);
    }
    // entrada de garagem de concreto
    if (q.garagem) {
      const g = q.garagem;
      ctx.fillStyle = '#9d9ca4'; ctx.fillRect(g.x, g.y0, g.w, g.y1 - g.y0);
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let yy = g.y0 + 22; yy < g.y1; yy += 22) ctx.fillRect(g.x, yy, g.w, 1); ctx.fillRect(g.x + g.w / 2, g.y0, 1, g.y1 - g.y0);
      ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(g.x, g.y0, 2, g.y1 - g.y0);
      if (q.carro) {   // carro estacionado na entrada
        const cx = g.x + g.w / 2, cy = g.y0 + 36;
        ctx.fillStyle = 'rgba(0,0,0,0.30)'; rrect(ctx, cx - 12, cy - 22, 28, 50, 8); ctx.fill();
        ctx.fillStyle = q.carro; rrect(ctx, cx - 13, cy - 24, 26, 48, 8); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; rrect(ctx, cx - 11, cy - 22, 10, 40, 5); ctx.fill();
        ctx.fillStyle = '#243038'; rrect(ctx, cx - 9, cy - 12, 18, 9, 3); ctx.fill(); rrect(ctx, cx - 9, cy + 9, 18, 8, 3); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(cx - 11, cy - 2, 22, 10);
        ctx.fillStyle = '#ffeaa0'; ctx.fillRect(cx - 10, cy - 24, 5, 2); ctx.fillRect(cx + 5, cy - 24, 5, 2);
        ctx.fillStyle = '#c0242a'; ctx.fillRect(cx - 10, cy + 22, 5, 2); ctx.fillRect(cx + 5, cy + 22, 5, 2);
      }
    }
    ctx.restore();
    // cerca / muro / sebe na frente e nas laterais
    const cc = q.cerca;
    if (cc && cc !== 'nenhuma') {
      const pts = [[x + 1, y + h - 3, x + w - 1, y + h - 3, true], [x + 1.5, y + 3, x + 1.5, y + h - 3, false], [x + w - 1.5, y + 3, x + w - 1.5, y + h - 3, false]];
      pts.forEach(([x0, y0, x1, y1, frente], idx) => {
        // abre um vão no portão da frente e na entrada da garagem
        const vaos = frente ? [q.portaoX != null ? [q.portaoX - 12, q.portaoX + 12] : null, q.garagem ? [q.garagem.x, q.garagem.x + q.garagem.w] : null].filter(Boolean) : [];
        const seg = []; let a0 = x0;
        vaos.sort((a, b) => a[0] - b[0]).forEach(v => { seg.push([a0, v[0]]); a0 = v[1]; }); seg.push([a0, x1]);
        (frente ? seg : [[y0, y1]]).forEach(s => {
          const hz = frente, from = s[0], to = s[1];
          if (cc === 'sebe') { ctx.fillStyle = '#245f24'; if (hz) ctx.fillRect(from, y0 - 3, to - from, 7); else ctx.fillRect(x0 - 3, from, 7, to - from); ctx.fillStyle = '#3a8a34'; if (hz) { for (let k = from; k < to; k += 5) ctx.fillRect(k, y0 - 3 + (k % 10 ? 0 : 1), 4, 4); } else { for (let k = from; k < to; k += 5) ctx.fillRect(x0 - 3, k, 4, 4); } }
          else if (cc === 'muro') { ctx.fillStyle = 'rgba(0,0,0,0.3)'; if (hz) ctx.fillRect(from + 2, y0 + 1, to - from, 4); else ctx.fillRect(x0 + 1, from + 2, 4, to - from); ctx.fillStyle = q.muroCor || '#d9cfb4'; if (hz) ctx.fillRect(from, y0 - 3, to - from, 6); else ctx.fillRect(x0 - 2, from, 5, to - from); ctx.fillStyle = 'rgba(255,255,255,0.3)'; if (hz) ctx.fillRect(from, y0 - 3, to - from, 1); else ctx.fillRect(x0 - 2, from, 1, to - from); }
          else { // grade de ferro
            ctx.fillStyle = 'rgba(0,0,0,0.25)'; if (hz) ctx.fillRect(from + 2, y0 + 1, to - from, 2); else ctx.fillRect(x0 + 1, from + 2, 2, to - from);
            ctx.fillStyle = '#2d2f36'; if (hz) { ctx.fillRect(from, y0 - 3, to - from, 1.5); ctx.fillRect(from, y0 + 1, to - from, 1.5); for (let k = from; k < to; k += 5) ctx.fillRect(k, y0 - 4, 1.5, 6); }
            else { ctx.fillRect(x0 - 1, from, 1.5, to - from); for (let k = from; k < to; k += 5) ctx.fillRect(x0 - 2, k, 4, 1.5); }
          }
        });
      });
    }
    // portão: pilares
    if (cc && cc !== 'nenhuma' && q.portaoX != null) {
      [q.portaoX - 13, q.portaoX + 13].forEach(px => { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px - 1, y + h - 8, 7, 9); ctx.fillStyle = '#d6cdb6'; ctx.fillRect(px - 3, y + h - 9, 6, 8); ctx.fillStyle = '#8a8270'; ctx.fillRect(px - 3, y + h - 9, 6, 2); ctx.fillStyle = '#ffe9a0'; ctx.fillRect(px - 1, y + h - 11, 2, 2); });
    }
  };


  // ============================================================
  //  FACHADA DE PRÉDIO / LOJA (vários andares, vitrine, letreiro, toldo, sacadas)
  //  b: { x,y,w,h, wall, andares, place, casa, est, p }   fh = altura total da parede
  // ============================================================
  A.ANDAR_TERREO = 44; A.ANDAR = 24;
  A.fachadaPredio = function (ctx, b, fh, shade2) {
    const x = b.x, w = b.w, y = b.y + b.h - fh, r = mulberry32(Math.floor(b.x * 5 + b.y * 11));
    const wall = b.wall || { cor: '#d8cdb0', tex: 'reboco' };
    const lugar = b.place, loja = !!lugar && (lugar.tipo === 'loja' || lugar.tipo === 'lugar' || lugar.tipo === 'mercado' || lugar.tipo === 'hotel');
    const temPorta = !!(lugar || b.casa), and = Math.max(1, b.andares || 1), gf = fh - A.ANDAR * (and - 1);
    A.parede(ctx, x, y, w, fh, wall, Math.floor(b.x + b.y));
    const jl = [], cx = x + w / 2;
    const moldura = wall.tex === 'concreto' ? '#2f3640' : (r() < 0.5 ? '#f4f1e8' : '#d9d2bd');
    const sacadas = and >= 3 && b.est !== 'portuaria' && r() < 0.6;
    const ww = and >= 3 ? 15 : 14, nSlot = Math.max(1, Math.floor((w - 14) / (ww + 15))), sp = (w - 14) / nSlot;
    // andares de cima (do mais alto para o térreo)
    for (let k = 0; k < and - 1; k++) {
      const fy = y + k * A.ANDAR, wh = 16;
      ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x, fy + A.ANDAR - 1, w, 1); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(x, fy + A.ANDAR, w, 1);
      for (let s = 0; s < nSlot; s++) {
        const sx = x + 7 + sp * (s + 0.5), luz = r() < 0.36;
        A.janela(ctx, sx - ww / 2, fy + 5, ww, wh, { cor: moldura, luz, rng: r, cortina: r() < 0.5 ? pick(r, ['#e8d8b8', '#d89a9a', '#9ac0d8', '#e8e8e8', '#b8d8b0']) : null, persiana: !luz && r() < 0.25 ? 0.3 : 0, sacada: sacadas && r() < 0.7, ar: !sacadas && r() < 0.14, flores: b.casa && r() < 0.3, vidro: b.est === 'moderna' ? '#7fc8e8' : null, veneziana: b.casa && r() < 0.3 ? '#2f6a4a' : null });
        if (luz) jl.push({ x: sx - ww / 2 - 1, y: fy + 4, w: ww + 2, h: wh + 2 });
      }
    }
    // térreo
    const ty = y + (and - 1) * A.ANDAR, tb = ty + gf;   // topo e base do térreo
    if (and > 1) { ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(x, ty - 1, w, 1); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(x, ty, w, 1); }
    if (loja) {
      // vitrine: vidros grandes entre pilastras, com mercadorias à mostra
      const vy = ty + 24, vh = gf - 24 - 4, pw = 7, dw = 22;
      const vit = (vx, vw) => {
        if (vw < 8) return;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(vx - 1, vy - 1, vw + 2, vh + 2);
        const g = ctx.createLinearGradient(0, vy, 0, vy + vh); g.addColorStop(0, '#ffe9b0'); g.addColorStop(1, '#c88a3a'); ctx.fillStyle = g; ctx.fillRect(vx, vy, vw, vh);
        for (let q = 0; q < vw / 9; q++) { ctx.fillStyle = pick(r, ['#c8302a', '#2a6ac8', '#f2c42a', '#2a9a52', '#f2ecdc', '#8a3ac2']); ctx.fillRect(vx + 2 + q * 9, vy + vh - 7 - Math.floor(r() * 5), 6, 7); }
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(vx, vy, vw, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.moveTo(vx, vy + vh); ctx.lineTo(vx + vw * 0.5, vy); ctx.lineTo(vx + vw * 0.7, vy); ctx.lineTo(vx + vw * 0.15, vy + vh); ctx.fill();
        ctx.fillStyle = '#3a3e48'; ctx.fillRect(vx, vy + vh, vw, 2); ctx.fillRect(vx + vw / 2 - 0.5, vy, 1, vh);
      };
      vit(x + pw, cx - dw / 2 - 4 - (x + pw)); vit(cx + dw / 2 + 4, x + w - pw - (cx + dw / 2 + 4));
      // toldo listrado com a cor da loja
      const cs = [lugar.cor || '#c8302a', '#f2ecdc'];
      ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(x + 4, ty + 22, w - 6, 4);
      for (let q = 0, qx = x + 3; qx < x + w - 3; q++, qx += 9) { ctx.fillStyle = cs[q % 2]; ctx.fillRect(qx, ty + 14, Math.min(9, x + w - 3 - qx) + 0.5, 9); }
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x + 3, ty + 21, w - 6, 2); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(x + 3, ty + 14, w - 6, 1);
      // porta de vidro
      const dx = Math.round(cx - dw / 2);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(dx - 2, vy - 2, dw + 4, vh + 6); ctx.fillStyle = '#3a3e48'; ctx.fillRect(dx - 1, vy - 1, dw + 2, vh + 5);
      const gd = ctx.createLinearGradient(dx, vy, dx + dw, vy + vh); gd.addColorStop(0, '#bfe4f4'); gd.addColorStop(1, '#3f7a9a'); ctx.fillStyle = gd; ctx.fillRect(dx + 1, vy, dw - 2, vh + 3);
      ctx.fillStyle = '#3a3e48'; ctx.fillRect(dx + dw / 2 - 0.5, vy, 1, vh + 3); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(dx + 2, vy + 1, 3, vh);
      ctx.fillStyle = '#cfc8b4'; ctx.fillRect(dx - 3, tb - 3, dw + 6, 3);
    } else {
      // térreo de prédio/casa: janelas e porta
      const wy = ty + 8, wh2 = Math.min(22, gf - 20);
      for (let s = 0; s < nSlot; s++) {
        const sx = x + 7 + sp * (s + 0.5);
        if (temPorta && Math.abs(sx - cx) < ww + 14) continue;
        const luz = r() < 0.36;
        A.janela(ctx, sx - ww / 2, wy, ww, wh2, { cor: moldura, luz, rng: r, cortina: r() < 0.5 ? pick(r, ['#e8d8b8', '#d89a9a', '#9ac0d8', '#e8e8e8']) : null, persiana: !luz && r() < 0.25 ? 0.3 : 0, grade: !b.place && r() < 0.35, flores: !!b.casa && r() < 0.3, vidro: b.est === 'moderna' ? '#7fc8e8' : null, veneziana: b.casa && r() < 0.3 ? '#2f6a4a' : null });
        if (luz) jl.push({ x: sx - ww / 2 - 1, y: wy - 1, w: ww + 2, h: wh2 + 2 });
      }
      if (temPorta) {
        const dh = Math.min(gf - 8, 32), dw2 = 20, dx = Math.round(cx - dw2 / 2), dy = tb - dh;
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(dx - 3, dy - 3, dw2 + 6, dh + 3); ctx.fillStyle = moldura; ctx.fillRect(dx - 2, dy - 2, dw2 + 4, dh + 2);
        const gg = ctx.createLinearGradient(dx, 0, dx + dw2, 0); gg.addColorStop(0, '#7a4f30'); gg.addColorStop(1, '#4a2f1c'); ctx.fillStyle = gg; ctx.fillRect(dx, dy, dw2, dh);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(dx + 2, dy + 3, dw2 / 2 - 3, dh * 0.4); ctx.fillRect(dx + dw2 / 2 + 1, dy + 3, dw2 / 2 - 3, dh * 0.4); ctx.fillRect(dx + 2, dy + dh * 0.52, dw2 - 4, dh * 0.4);
        ctx.fillStyle = '#e6c25a'; ctx.fillRect(dx + dw2 - 5, dy + dh * 0.5, 2, 3);
        ctx.fillStyle = '#cfc8b4'; ctx.fillRect(dx - 4, tb - 3, dw2 + 8, 3);
        ctx.fillStyle = '#4a4a50'; ctx.fillRect(dx + dw2 + 5, dy + 2, 3, 5); ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(dx + dw2 + 6.5, dy + 9, 2.2, 0, TAU); ctx.fill();
      }
    }
    // letreiro do lugar (dá para entrar!)
    if (lugar) {
      const nome = lugar.nome; ctx.font = 'bold 9px Arial, sans-serif';
      const tw8 = ctx.measureText(nome).width, fs = Math.max(6, Math.min(10, 9 * (w - 24) / tw8)); ctx.font = 'bold ' + fs + 'px Arial, sans-serif';
      const sw = Math.min(w - 8, Math.max(70, Math.ceil(tw8 * fs / 9) + 16)), sx = x + w / 2 - sw / 2, sy = ty + 1, sh = 12;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(sx + 1.5, sy + 2.5, sw, sh);
      const sg = ctx.createLinearGradient(0, sy, 0, sy + sh); sg.addColorStop(0, shade(lugar.cor, 0.25)); sg.addColorStop(1, shade(lugar.cor, -0.2));
      ctx.fillStyle = sg; ctx.fillRect(sx, sy, sw, sh); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.8; ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);
      ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText(nome, x + w / 2 + 0.7, sy + 9.4); ctx.fillStyle = '#ffffff'; ctx.fillText(nome, x + w / 2, sy + 8.7); ctx.textAlign = 'left';
    } else if (b.casa && !loja) {
      // toldo sobre a porta das casas da cidade
      const aw = 38, ax = cx - aw / 2, ay = tb - Math.min(gf - 8, 32) - 9, cs2 = pick(r, [['#c8302a', '#f2ecdc'], ['#2a6ac8', '#f2ecdc'], ['#2a9a52', '#f2ecdc'], ['#e0a42a', '#f2ecdc']]);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(ax + 2, ay + 6, aw, 4); for (let q = 0; q < 8; q++) { ctx.fillStyle = cs2[q % 2]; ctx.fillRect(ax + q * (aw / 8), ay, aw / 8 + 0.5, 7); }
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(ax, ay + 5, aw, 2);
    }
    // calhas
    ctx.fillStyle = 'rgba(200,204,210,0.7)'; ctx.fillRect(x + 3, y + 3, 2, fh - 7); ctx.fillRect(x + w - 5, y + 3, 2, fh - 7);
    b.jl = jl;
  };


  // ============================================================
  //  CELEIRO / ESTÁBULO (vistos de cima): telhado de zinco e a grande porta em X
  // ============================================================
  A.drawCeleiro = function (ctx, b, estabulo) {
    const { x, y, w, h } = b, fh = 32, wy = y + h - fh;
    A.parede(ctx, x, wy, w, fh, { cor: estabulo ? '#8a6a44' : '#a8342a', tex: 'madeira' }, Math.floor(x + y));
    const dw = Math.min(46, w * 0.4), dx = x + w / 2 - dw / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(dx - 2, wy + 5, dw + 4, fh - 5);
    ctx.fillStyle = estabulo ? '#6a4a2a' : '#8f2a20'; ctx.fillRect(dx, wy + 7, dw, fh - 7);
    ctx.strokeStyle = '#f2eee2'; ctx.lineWidth = 2; ctx.strokeRect(dx + 1, wy + 8, dw - 2, fh - 9);
    ctx.beginPath(); ctx.moveTo(dx + 1, wy + 8); ctx.lineTo(dx + dw - 1, wy + fh - 1); ctx.moveTo(dx + dw - 1, wy + 8); ctx.lineTo(dx + 1, wy + fh - 1); ctx.stroke();
    // janelinhas do palheiro
    [x + 14, x + w - 26].forEach(jx => { ctx.fillStyle = '#f2eee2'; ctx.fillRect(jx - 1, wy + 7, 14, 12); ctx.fillStyle = '#2a1a10'; ctx.fillRect(jx + 1, wy + 9, 10, 8); });
    // telhado de zinco
    A.telhado(ctx, x - 2, y, w + 4, h - fh + 3, 'duas', 'h', { base: '#9aa0a8', claro: '#d0d5db', escuro: '#4a4f58' }, Math.floor(x * 3 + y));
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h - fh); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,0.10)'; for (let xx = x + 4; xx < x + w; xx += 7) ctx.fillRect(xx, y, 1, h - fh); ctx.restore();
    ctx.fillStyle = 'rgba(0,0,10,0.28)'; ctx.fillRect(x, y + h - fh + 3, w, 3);
  };

  // ============================================================
  //  PROJETO DA CASA (layout em tiles dentro de um lote LW x LD; a frente é o sul)
  //  devolve { tipo, partes[], porta:{tx}, box, quintal info, ... } — tudo em tiles
  // ============================================================
  A.casaLayout = function (rng, LW, LD, o) {
    o = o || {};
    const rq = o.riqueza == null ? 1 : o.riqueza, est = o.estilo || 'classica';
    const bd = LD >= 7 ? 4 : 3;           // profundidade do corpo
    const yb = Math.max(bd, LD - 2);      // base (sul) do corpo: sobram 2 tiles de quintal na frente
    const yt = yb - bd;
    const partes = [];
    let tipo = o.tipo;
    const sorteia = lista => lista[Math.floor(rng() * lista.length)];
    if (!tipo) {
      if (LW <= 5) tipo = rq === 0 ? 'simples' : sorteia(['sobrado', 'terrea', 'simples']);
      else if (LW <= 7) tipo = rq === 0 ? 'simples' : sorteia(['terrea', 'terrea', 'sobrado', 'garagem', 'ele']);
      else if (LW <= 9) tipo = rq === 0 ? sorteia(['simples', 'terrea']) : rq === 1 ? sorteia(['garagem', 'ele', 'sobrado_g', 'terrea', 'garagem']) : sorteia(['sobrado_g', 'ele', 'garagem', 'moderna']);
      else if (LW <= 12) tipo = rq === 0 ? sorteia(['terrea', 'garagem']) : rq === 1 ? sorteia(['ume', 'sobrado_g', 'ele', 'garagem']) : sorteia(['ume', 'sobrado_g', 'moderna']);
      else tipo = rq === 2 ? sorteia(['mansao', 'mansao', 'ume']) : sorteia(['ume', 'sobrado_g', 'ele']);
    }
    if (est === 'moderna' && rq >= 1 && (tipo === 'terrea' || tipo === 'garagem' || tipo === 'sobrado_g')) tipo = 'moderna';
    const lado = rng() < 0.5 ? 'e' : 'd';        // de que lado fica a garagem / ala
    const teto = () => est === 'moderna' ? 'plano' : (rng() < 0.55 ? 'quatro' : 'duas');
    const P = (t, x, y, w, h, and, tt, cr) => partes.push({ t, x, y, w, h, andares: and, teto: tt, crista: cr || (w >= h ? 'h' : 'v') });
    let porta = 0, corpo = null, varanda = false;
    const maxW = LW;
    if (tipo === 'simples') {
      const w = Math.min(LW - (LW > 4 ? 1 : 0), 4 + (LW >= 8 ? 1 : 0)), x = LW >= 8 ? 1 : 0;
      P('corpo', x, yt, w, bd, 1, 'duas', 'h'); porta = x + w / 2;
    } else if (tipo === 'terrea') {
      const w = Math.min(LW, LW >= 8 ? 6 : LW - 1), x = Math.floor((LW - w) / 2);
      P('corpo', x, yt, w, bd, 1, teto(), 'h'); porta = x + w / 2; varanda = rq >= 1 && rng() < 0.55;
    } else if (tipo === 'sobrado') {
      const w = Math.min(LW, 5), x = Math.floor((LW - w) / 2);
      P('corpo', x, yt, w, bd, 2, 'quatro', 'h'); porta = x + w / 2;
    } else if (tipo === 'garagem' || tipo === 'sobrado_g' || tipo === 'moderna') {
      const gw = 3, cw = Math.min(LW - gw, tipo === 'moderna' ? 6 : 5), tot = cw + gw, x0 = Math.floor((LW - tot) / 2);
      const and = tipo === 'garagem' ? 1 : 2;
      const cx = lado === 'e' ? x0 + gw : x0, gx = lado === 'e' ? x0 : x0 + cw;
      P('corpo', cx, yt, cw, bd, tipo === 'moderna' && rng() < 0.5 ? 1 : and, tipo === 'moderna' ? 'plano' : teto(), 'h');
      P('garagem', gx, yt + 1, gw, bd - 1, 1, tipo === 'moderna' ? 'plano' : 'meia', 'h');
      porta = cx + cw / 2; varanda = tipo === 'garagem' && rq >= 1 && rng() < 0.4;
    } else if (tipo === 'ele') {
      const aw = 3, cw = Math.min(LW - aw, 5), tot = cw + aw, x0 = Math.floor((LW - tot) / 2);
      const cx = lado === 'e' ? x0 + aw : x0, ax = lado === 'e' ? x0 : x0 + cw;
      const and = rq === 2 ? 2 : 1;
      P('corpo', cx, yt, cw, bd, and, teto(), 'h');
      P('ala', ax, yt, aw, Math.min(bd + 1, LD - 1 - yt), and, 'duas', 'v');   // a ala avança 1 tile para a frente
      porta = cx + cw / 2;
    } else if (tipo === 'ume') {
      const aw = 3, cw = Math.max(4, Math.min(LW - aw * 2, 6)), tot = cw + aw * 2, x0 = Math.floor((LW - tot) / 2);
      const and = rq === 2 ? 2 : 1;
      P('corpo', x0 + aw, yt, cw, bd, and, 'duas', 'h');
      P('ala', x0, yt, aw, Math.min(bd + 1, LD - 1 - yt), and, 'duas', 'v');
      P('ala', x0 + aw + cw, yt, aw, Math.min(bd + 1, LD - 1 - yt), and, 'duas', 'v');
      porta = x0 + aw + cw / 2;
    } else if (tipo === 'mansao') {
      const aw = 3, cw = Math.max(6, Math.min(LW - aw * 2 - 4, 8)), tot = cw + aw * 2, x0 = lado === 'e' ? 0 : LW - tot;
      const tm = est === 'moderna' ? 'plano' : 'quatro';
      P('corpo', x0 + aw, yt, cw, bd, 2, tm, 'h');
      P('ala', x0, yt, aw, Math.min(bd + 1, LD - 1 - yt), 2, tm, 'v');
      P('ala', x0 + aw + cw, yt, aw, Math.min(bd + 1, LD - 1 - yt), 2, tm, 'v');
      porta = x0 + aw + cw / 2; varanda = false;
    }
    corpo = partes.find(p => p.t === 'corpo'); corpo.varanda = varanda;
    // caixa que envolve tudo (em tiles)
    let bx0 = 1e9, by0 = 1e9, bx1 = -1, by1 = -1; partes.forEach(p => { bx0 = Math.min(bx0, p.x); by0 = Math.min(by0, p.y); bx1 = Math.max(bx1, p.x + p.w); by1 = Math.max(by1, p.y + p.h); });
    return { tipo, partes, porta, box: { x: bx0, y: by0, w: bx1 - bx0, h: by1 - by0 }, corpo, riqueza: rq, estilo: est, lado, garagem: partes.find(p => p.t === 'garagem') || null };
  };

  // monta o "casa3" (cores, texturas e partes em pixels) a partir de um layout e da posição do lote
  // ox,oy = canto do lote em pixels; devolve { b-like fields }
  A.casaMontar = function (lay, ox, oy, seed, est) {
    const r = mulberry32(seed), rq = lay.riqueza;
    const pl = A.PAREDES[est] || A.PAREDES.classica, tl = A.TELHAS[est] || A.TELHAS.classica;
    const w = rq === 0 ? pl[Math.floor(r() * Math.min(pl.length, 4))] : pl[Math.floor(r() * pl.length)];
    let wall = { cor: w[0], tex: w[1] };
    if (rq === 0 && r() < 0.3) wall = { cor: '#b8593a', tex: 'tijolo' };   // casa simples de tijolo aparente
    const tb = tl[Math.floor(r() * tl.length)];
    const pal = { base: tb, claro: shade(tb, 0.22), escuro: shade(tb, -0.38) };
    // as partes em pixels: encosta as partes vizinhas (sem vão) e deixa 4px nas bordas livres
    const IN = 4, ps = lay.partes.map(p => ({ t: p.t, andares: p.andares, teto: p.teto, crista: p.crista, varanda: p.varanda, tx: p.x, ty: p.y, tw: p.w, th: p.h }));
    ps.forEach(p => {
      const toca = (lado) => ps.some(q => q !== p && (lado === 'e' ? (q.tx + q.tw === p.tx) : lado === 'd' ? (q.tx === p.tx + p.tw) : false) && q.ty < p.ty + p.th && q.ty + q.th > p.ty);
      const ie = toca('e') ? 0 : IN, id = toca('d') ? 0 : IN;
      p.x = ox + p.tx * T + ie; p.w = p.tw * T - ie - id; p.y = oy + p.ty * T + IN; p.h = p.th * T - IN * 2;
    });
    const molduras = rq === 2 ? ['#f4f1e8', '#ffffff', '#3a2a1e'] : MOLDURAS;
    const casa3 = {
      partes: ps, wall, pal, seed, rq, est: est || 'classica',
      moldura: molduras[Math.floor(r() * molduras.length)], porta: pick(r, ['#5a3d28', '#7a4a2a', '#3a5a7a', '#8a2a2a', '#2f5a3a', '#e8e0cc']),
      veneziana: rq >= 1 && r() < 0.35 ? pick(r, ['#2f6a4a', '#3a5a8a', '#f2eee2', '#6a4a2a', '#8a3a3a']) : null,
      garagemCor: pick(r, ['#e8e4d8', '#c8ccd2', '#8a6a4a', '#4a5a6a', '#f2eee2']),
      toldo: pick(r, [['#c8302a', '#f2ecdc'], ['#2a6ac8', '#f2ecdc'], ['#2a9a52', '#f2ecdc'], ['#e0a42a', '#f2ecdc'], ['#8a3ac2', '#f2ecdc']]),
      chamine: rq >= 1 && est !== 'moderna' && est !== 'portuaria', furtada: lay.partes.some(p => p.andares === 1) && rq >= 1 && r() < 0.35 && est !== 'moderna',
      vidro: est === 'moderna' ? '#7fc8e8' : null
    };
    return casa3;
  };
  // pixels da caixa que envolve a casa
  A.casaCaixa = function (casa3) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    casa3.partes.forEach(p => { x0 = Math.min(x0, p.x - 2); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + p.w + 2); y1 = Math.max(y1, p.y + p.h); });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  };

  // quintal da casa (pixels) a partir do layout
  A.quintalDe = function (lay, ox, oy, LW, LD, seed, est) {
    const r = mulberry32(seed + 77), rq = lay.riqueza, c = lay.corpo;
    const q = { x: ox, y: oy, w: LW * T, h: LD * T };
    q.cerca = rq === 0 ? (r() < 0.5 ? 'muro' : 'nenhuma') : rq === 1 ? (r() < 0.5 ? 'sebe' : 'grade') : (r() < 0.5 ? 'muro' : 'grade');
    q.muroCor = ['#d9cfb4', '#e8dcc0', '#c8b898', '#f2eee2'][Math.floor(r() * 4)];
    q.portaoX = ox + lay.porta * T;
    q.caminho = { x: ox + lay.porta * T, y0: oy + (c.y + c.h) * T - 6, y1: oy + LD * T - 4 };
    if (lay.garagem) {
      const g = lay.garagem; q.garagem = { x: ox + g.x * T + 8, w: g.w * T - 16, y0: oy + (g.y + g.h) * T - 6, y1: oy + LD * T - 4 };
      if (rq >= 1 && r() < 0.8) q.carro = ['#c4161c', '#1f4fd8', '#f0f0f0', '#15151a', '#e8a020', '#2fa84f', '#8a8a96'][Math.floor(r() * 7)];
      // a calçada da frente do portão da casa e a entrada da garagem não se juntam: o portão fica na casa
    }
    q.canteiros = []; q.arbustos = [];
    const frente = oy + (c.y + c.h) * T, base = oy + LD * T;
    // canteiros junto à parede e arbustos nos cantos
    lay.partes.forEach(p => { if (p.t === 'garagem') return; const wy = oy + (p.y + p.h) * T; if (p.w >= 3 && r() < 0.8) q.canteiros.push({ x: ox + p.x * T + 8, y: wy + 2, w: p.w * T / 2 - 22, h: 10 }, { x: ox + (p.x + p.w) * T - p.w * T / 2 + 14, y: wy + 2, w: p.w * T / 2 - 22, h: 10 }); });
    const nArb = 2 + Math.floor(r() * 3);
    for (let k = 0; k < nArb; k++) q.arbustos.push({ x: ox + 14 + r() * (LW * T - 28), y: frente + 24 + r() * Math.max(6, base - frente - 40), r: 6 + r() * 5, flor: r() < 0.5 ? ['#ff5a7a', '#ffd84a', '#ffffff'][Math.floor(r() * 3)] : null });
    // piscina nas casas ricas, atrás ou ao lado
    if (rq === 2 && r() < 0.8) {
      const bx0 = lay.box.x, bx1 = lay.box.x + lay.box.w, livreE = bx0, livreD = LW - bx1;
      if (lay.box.y >= 2) q.piscina = { x: ox + (lay.box.x + 0.4) * T, y: oy + 12, w: Math.min(4, LW - 2) * T - 6, h: lay.box.y * T - 26 };            // atrás da casa
      else if (Math.max(livreE, livreD) >= 3) { const e = livreE >= livreD; q.piscina = { x: e ? ox + 14 : ox + bx1 * T + 14, y: oy + (lay.corpo.y + lay.corpo.h - 2) * T, w: Math.max(livreE, livreD) * T - 28, h: 2 * T - 6 }; }   // ao lado
    }
    return q;
  };
})(window.G = window.G || {});
