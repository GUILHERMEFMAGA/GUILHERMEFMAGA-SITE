/* =====================================================================
   MOBILIA2.JS — móveis de LOJA, com formas de verdade:
   prateleiras com mercadoria (tintas, ração, celulares, garrafas...), vitrines de vidro,
   arara de roupas, manequim, aquário, gaiola, flores em baldes, mesas de café/lanchonete/bar,
   cadeiras, bancos, sacos de cimento, caixotes de fruta, provador com cortina...
   + peças de PAREDE: lousa de cardápio, TVs, ganchos de carne, painel de ferramentas...
   Mesmos nomes de objeto de sempre: só o desenho mudou. Cada móvel é pintado uma vez (D.est).
   Convenção: o.x,o.y,o.w,o.h = pegada no chão; o.e = altura.
   ===================================================================== */
(function (G) {
  'use strict';
  const L = G.lugares, K = L.kit, D = G.deco, TAU = Math.PI * 2;
  const shade = K.shade, hh = K.hh, rr = D.rr, mix = D.mix, rng = D.rng;
  const reg = D.reg, caixa = D.caixa, sombra = D.sombra;
  const pick = (r, a) => a[(r() * a.length) | 0];
  const poe = (c, cor, f) => { c.fillStyle = cor; f(); };
  const bola = (c, x, y, r, cor) => { c.fillStyle = cor; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const brilho = (c, x, y, w, a) => { c.fillStyle = 'rgba(255,255,255,' + (a || 0.35) + ')'; c.fillRect(x, y, w, 1.2); };
  const contorno = (c, x, y, w, h, r) => { c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 1; rr(c, x + 0.5, y + 0.5, w - 1, h - 1, r || 1); c.stroke(); };

  // =====================================================================
  //  PRATELEIRA DE LOJA: cada tema com a mercadoria certa
  // =====================================================================
  const COR_VIVA = ['#e8402a', '#2a58b8', '#f2c82a', '#2f9a4a', '#8a4fc2', '#f08a2a', '#e84a8a', '#2ab0c8'];
  const ITENS = {
    // cada item desenha dentro da prateleira: (c, px, base, rh, r) e devolve a largura usada
    tintas(c, px, b, rh, r) { const cc = pick(r, COR_VIVA), h = Math.min(rh - 6, 13); c.fillStyle = '#c8ccd2'; c.fillRect(px, b - h, 10, h); c.fillStyle = cc; c.fillRect(px, b - h * 0.78, 10, h * 0.5); c.fillStyle = '#e8ecf0'; c.beginPath(); c.ellipse(px + 5, b - h, 5, 1.8, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(px + 1, b - h + 1, 1.6, h - 2); return 12; },
    parafusos(c, px, b, rh, r) { const h = rh * 0.5; c.fillStyle = pick(r, ['#e8a02a', '#c8ccd2', '#2a58b8', '#e8402a']); c.fillRect(px, b - h, 14, h); c.fillStyle = '#f4f0e0'; c.fillRect(px + 2, b - h + 2, 10, h * 0.4); c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(px + 4, b - h + 4, 6, 1.4); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(px, b - 2, 14, 2); return 16; },
    ferramentas(c, px, b, rh, r) { const h = rh * 0.62; c.fillStyle = pick(r, ['#c8302a', '#e8a02a', '#2a58b8', '#3a3e48']); rr(c, px, b - h, 18, h, 2); c.fill(); c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(px + 5, b - h - 2.4, 8, 2.4); c.fillStyle = '#f4f0e0'; c.fillRect(px + 3, b - h + 3, 12, 4); c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(px + 4, b - h + 4.4, 8, 1.2); return 20; },
    racao(c, px, b, rh, r) { const h = rh * 0.78, cc = pick(r, ['#c8702a', '#2a58b8', '#2f9a4a', '#c8302a']); c.fillStyle = cc; rr(c, px, b - h, 16, h, 2.5); c.fill(); c.fillStyle = '#f4ecd8'; c.fillRect(px + 2, b - h * 0.68, 12, h * 0.36); bola(c, px + 8, b - h * 0.5, 2.6, '#5a3a22'); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(px + 1.5, b - h + 2, 1.6, h - 5); return 18; },
    pet(c, px, b, rh, r) { const t = r(); if (t < 0.4) { c.fillStyle = pick(r, COR_VIVA); c.beginPath(); c.ellipse(px + 6, b - 3, 6, 3, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(px + 6, b - 4, 4, 1.6, 0, 0, TAU); c.fill(); return 14; } if (t < 0.75) { bola(c, px + 5, b - 5, 5, pick(r, ['#e8402a', '#f2c82a', '#2ab0c8'])); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(px + 2, b - 8, 3, 1.6); return 12; } c.fillStyle = '#f4ecd8'; c.fillRect(px, b - 4, 14, 3); bola(c, px, b - 5, 2.4, '#f4ecd8'); bola(c, px + 14, b - 5, 2.4, '#f4ecd8'); return 18; },
    celulares(c, px, b, rh, r) { const h = rh * 0.7; c.fillStyle = pick(r, ['#16181e', '#f2f2f2', '#2a58b8', '#e84a5a']); rr(c, px, b - h, 8, h, 1.6); c.fill(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(px + 1, b - h + 1, 1.4, h - 3); c.fillStyle = '#7ab8f0'; c.fillRect(px + 2.4, b - h + 3, 3.6, h * 0.45); return 10; },
    fones(c, px, b, rh, r) { const h = rh * 0.55; c.fillStyle = pick(r, ['#e84a8a', '#16181e', '#2ab0c8', '#f2f2f2']); rr(c, px, b - h, 14, h, 2); c.fill(); c.strokeStyle = '#2a2d36'; c.lineWidth = 1.6; c.beginPath(); c.arc(px + 7, b - h + 4, 4.4, Math.PI, 0); c.stroke(); bola(c, px + 2.6, b - h + 5, 2, '#2a2d36'); bola(c, px + 11.4, b - h + 5, 2, '#2a2d36'); return 16; },
    doces(c, px, b, rh, r) { const cc = pick(r, ['#e84a8a', '#f2c82a', '#8a4fc2', '#2f9a4a', '#e8802a']); c.fillStyle = 'rgba(210,230,240,0.55)'; rr(c, px, b - 11, 11, 11, 2.4); c.fill(); c.fillStyle = cc; for (let i = 0; i < 4; i++) bola(c, px + 3 + (i % 2) * 5, b - 3.4 - ((i / 2) | 0) * 4, 2.3, cc); c.fillStyle = '#c8a24a'; c.fillRect(px, b - 12.6, 11, 2.2); return 13; },
    garrafas(c, px, b, rh, r) { const cc = pick(r, ['#2f8a3c', '#6a3a1a', '#d8a82a', '#c8e0e8', '#8a2a3a']), h = rh * 0.8; c.fillStyle = cc; rr(c, px, b - h * 0.62, 6, h * 0.62, 1.6); c.fill(); c.fillRect(px + 2, b - h, 2.2, h * 0.4); c.fillStyle = '#f4f0e0'; c.fillRect(px + 0.6, b - h * 0.4, 4.8, h * 0.18); c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(px + 1, b - h * 0.6, 1.2, h * 0.4); return 8; },
    vasos(c, px, b, rh, r) { const cc = pick(r, ['#c8702a', '#e8e2d6', '#8a5a3a']), h = Math.min(8, rh * 0.3); c.fillStyle = cc; c.beginPath(); c.moveTo(px, b - h); c.lineTo(px + 11, b - h); c.lineTo(px + 9, b); c.lineTo(px + 2, b); c.closePath(); c.fill(); for (let i = 0; i < 3; i++) bola(c, px + 3 + i * 2.6, b - h - 3 - (i % 2) * 2, 3.2, pick(r, ['#2f9a4a', '#3aa85a', '#58b848'])); if (r() < 0.5) bola(c, px + 5.5, b - h - 7, 1.8, pick(r, ['#e84a6a', '#f2d84a', '#fff'])); return 14; },
    tenis(c, px, b, rh, r) { c.fillStyle = pick(r, ['#f2f2f2', '#d33a3a', '#2a5ac8', '#e0b32a', '#16181e']); rr(c, px, b - 8, 15, 8, 3.4); c.fill(); c.fillStyle = '#f2f2f2'; c.fillRect(px, b - 2.6, 15, 2.6); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(px + 9, b - 7, 3, 2); return 17; },
    roupas(c, px, b, rh, r) { const n = 2 + ((r() * 3) | 0); for (let i = 0; i < n; i++) { c.fillStyle = pick(r, COR_VIVA.concat(['#f2f2f2', '#3a4a6a', '#16181e'])); c.fillRect(px, b - 4 - i * 3.6, 18, 3.4); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(px, b - 1.4 - i * 3.6, 18, 0.9); } return 20; },
    graos(c, px, b, rh, r) { const cc = pick(r, ['#e8d8a0', '#c8302a', '#5a3a22', '#2f9a4a', '#f2c82a']), h = rh * 0.55; c.fillStyle = '#c8a870'; rr(c, px, b - h, 14, h, 2); c.fill(); c.fillStyle = cc; c.fillRect(px + 1, b - h - 1.4, 12, 3); c.fillStyle = '#f4ecd8'; c.fillRect(px + 3, b - h * 0.7, 8, h * 0.3); return 16; },
    caixas(c, px, b, rh, r) { const h = rh * 0.8, cc = pick(r, COR_VIVA); c.fillStyle = cc; c.fillRect(px, b - h, 11, h); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(px + 1.4, b - h * 0.62, 8.2, h * 0.3); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(px + 9, b - h, 2, h); return 12; },
    bebidas(c, px, b, rh, r) { const cc = pick(r, ['#c8302a', '#2f9a4a', '#f2c82a', '#2a58b8', '#e8802a']), h = rh * 0.75; c.fillStyle = cc; rr(c, px, b - h * 0.7, 7, h * 0.7, 2); c.fill(); c.fillRect(px + 2, b - h, 3, h * 0.35); c.fillStyle = '#f4f0e0'; c.fillRect(px + 0.8, b - h * 0.5, 5.4, h * 0.22); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(px + 1, b - h * 0.68, 1.2, h * 0.4); return 9; },
    cafe(c, px, b, rh, r) { if (r() < 0.5) { c.fillStyle = pick(r, ['#5a3a22', '#8a2a1a', '#2a2a30', '#c8a24a']); rr(c, px, b - rh * 0.6, 12, rh * 0.6, 2); c.fill(); c.fillStyle = '#f4ecd8'; c.fillRect(px + 2, b - rh * 0.42, 8, rh * 0.2); return 14; } c.fillStyle = '#f4f0e8'; c.beginPath(); c.moveTo(px, b - 7); c.lineTo(px + 9, b - 7); c.lineTo(px + 8, b); c.lineTo(px + 1, b); c.closePath(); c.fill(); c.strokeStyle = '#f4f0e8'; c.lineWidth = 1.4; c.beginPath(); c.arc(px + 10, b - 4, 2.4, -1.4, 1.4); c.stroke(); return 13; },
    oculos(c, px, b, rh, r) { const cc = pick(r, ['#16181e', '#8a4a1a', '#c8302a', '#2a58b8', '#c8a24a']); c.strokeStyle = cc; c.lineWidth = 1.8; c.beginPath(); c.arc(px + 4, b - 6, 3.8, 0, TAU); c.moveTo(px + 15.6, b - 6); c.arc(px + 12, b - 6, 3.8, 0, TAU); c.moveTo(px + 7.8, b - 6.4); c.lineTo(px + 8.2, b - 6.4); c.stroke(); c.fillStyle = 'rgba(120,180,230,0.35)'; c.beginPath(); c.arc(px + 4, b - 6, 3, 0, TAU); c.arc(px + 12, b - 6, 3, 0, TAU); c.fill(); return 18; }
  };
  ITENS.frutas = (c, px, b, rh, r) => { bola(c, px + 4, b - 4, 4.2, pick(r, ['#e8801a', '#c8302a', '#e8d02a', '#4aa02a'])); c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(px + 2, b - 7, 2, 2); return 9; };
  ITENS.livros = (c, px, b, rh, r) => { const bh = rh * (0.5 + r() * 0.4), bw = 4 + r() * 4; c.fillStyle = pick(r, ['#c8402a', '#2a58b8', '#e0b32a', '#2f8a6a', '#7a3a8a', '#e8e0cc', '#3a2a22']); c.fillRect(px, b - bh, bw, bh); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(px + 1, b - bh + 1, 1, bh - 3); c.fillStyle = 'rgba(255,220,140,0.7)'; c.fillRect(px, b - bh + 3, bw, 1.2); return bw + 1; };

  reg('prateleira', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 52, tema = o.tema || 'caixas', quadro = o.front || '#8a9099';
    caixa(c, x, y, w, h, e, o.top || shade(quadro, 0.2), quadro, { r: 2 });
    const fy = y + h - e, nr = e > 66 ? 4 : e > 44 ? 3 : 2, rh = (e - 8) / nr, r = rng((x * 5 + y * 3) | 0), fn = ITENS[tema] || ITENS.caixas;
    c.fillStyle = shade(quadro, -0.62); c.fillRect(x + 3, fy + 3, w - 6, e - 6);
    for (let q = 0; q < nr; q++) {
      const base = fy + 3 + q * rh + rh - 2; let px = x + 5;
      while (px < x + w - 10) px += fn(c, px, base, rh, r);
      c.fillStyle = shade(quadro, 0.12); c.fillRect(x + 3, base, w - 6, 2.4); c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x + 3, base + 2.4, w - 6, 1);
      // etiquetinhas de preço na borda
      c.fillStyle = '#f2e84a'; for (let k = x + 9; k < x + w - 14; k += 26 + ((r() * 14) | 0)) c.fillRect(k, base + 0.4, 7, 1.8);
    }
    c.fillStyle = quadro; c.fillRect(x, fy, 3, e); c.fillRect(x + w - 3, fy, 3, e);
    c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(x + 3, fy + 3, w - 6, 2);
    if (o.nome) { c.fillStyle = '#16181e'; rr(c, x + w / 2 - 28, y - e - 7, 56, 11, 2); c.fill(); c.fillStyle = '#ffe04a'; c.font = 'bold 8px Arial'; c.textAlign = 'center'; c.fillText(o.nome, x + w / 2, y - e + 1.5); c.textAlign = 'left'; }
  }, { alto: 12 });

  // =====================================================================
  //  VITRINE DE VIDRO (carne, doces, óculos, celulares, sorvete)
  // =====================================================================
  reg('vitrine', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 36, tema = o.tema || 'doces', corpo = o.front || (tema === 'carne' ? '#e8e8ec' : '#8a5a34'), r = rng((x * 7 + y) | 0);
    const bh = Math.round(e * 0.46);           // base (corpo) e vidro por cima
    caixa(c, x, y, w, h, bh, o.top || '#d8dce0', corpo, { r: 3 });
    // frente da base
    const fb = y + h - bh; c.fillStyle = 'rgba(0,0,0,0.2)'; for (let k = x + 8; k < x + w - 14; k += 40) c.fillRect(k, fb + 4, 30, bh - 8);
    // bandejas com a mercadoria (vistas pelo vidro)
    const ty = y - bh, ah = e - bh;           // altura do vidro
    c.fillStyle = tema === 'oculos' ? '#2a1a30' : tema === 'celular' ? '#2a2d36' : '#f4f0e8'; rr(c, x + 4, ty - 4, w - 8, h - 2, 3); c.fill();
    const cx0 = x + 10;
    for (let k = cx0, i = 0; k < x + w - 14; k += (tema === 'carne' ? 22 : tema === 'oculos' ? 20 : tema === 'celular' ? 18 : 17), i++) {
      const my = ty + h * 0.38;
      if (tema === 'carne') { const t = i % 4; if (t === 0) { c.fillStyle = '#c8303a'; rr(c, k - 8, my - 6, 16, 10, 4); c.fill(); c.fillStyle = '#f0d0c8'; c.fillRect(k - 6, my - 3, 12, 2); } else if (t === 1) { c.fillStyle = '#8a3a22'; rr(c, k - 9, my - 3, 18, 5, 2.5); c.fill(); rr(c, k - 9, my + 2, 18, 5, 2.5); c.fill(); } else if (t === 2) { c.fillStyle = '#e8b878'; c.beginPath(); c.ellipse(k, my, 8, 5, 0, 0, TAU); c.fill(); c.fillStyle = '#c8884a'; c.beginPath(); c.ellipse(k - 2, my - 1, 4, 2.4, 0, 0, TAU); c.fill(); } else { c.fillStyle = '#e8504a'; rr(c, k - 8, my - 6, 16, 11, 4); c.fill(); c.fillStyle = '#fff0e8'; c.fillRect(k - 5, my - 3, 5, 6); } c.fillStyle = '#f2e84a'; c.fillRect(k - 4, my + 6, 8, 3); }
      else if (tema === 'doces') { const t = i % 3; c.fillStyle = ['#c8884a', '#e8c070', '#8a5a3a'][t]; c.beginPath(); c.ellipse(k, my, 8, 5, 0, 0, TAU); c.fill(); c.fillStyle = ['#f4ecd8', '#e84a8a', '#f4ecd8'][t]; c.beginPath(); c.ellipse(k, my - 2, 6, 2.6, 0, 0, TAU); c.fill(); bola(c, k, my - 3.4, 1.6, '#c8302a'); }
      else if (tema === 'oculos') { const cc = ['#16181e', '#8a4a1a', '#c8302a', '#2a58b8', '#c8a24a'][i % 5]; c.strokeStyle = cc; c.lineWidth = 1.8; c.beginPath(); c.arc(k - 4, my, 3.6, 0, TAU); c.moveTo(k + 7.6, my); c.arc(k + 4, my, 3.6, 0, TAU); c.stroke(); c.fillStyle = 'rgba(160,210,250,0.45)'; c.beginPath(); c.arc(k - 4, my, 2.8, 0, TAU); c.arc(k + 4, my, 2.8, 0, TAU); c.fill(); }
      else if (tema === 'celular') { c.fillStyle = ['#16181e', '#f2f2f2', '#2a58b8', '#e84a5a'][i % 4]; rr(c, k - 4, my - 8, 8, 14, 1.6); c.fill(); c.fillStyle = '#7ab8f0'; c.fillRect(k - 2.6, my - 6, 5.2, 9); c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(k - 4, my + 6, 8, 2); }
      else if (tema === 'sorvete') { c.fillStyle = '#e8ecf0'; c.beginPath(); c.ellipse(k, my + 1, 8, 5, 0, 0, TAU); c.fill(); const cc = ['#e84a8a', '#8a5a3a', '#f2e8a0', '#6ad0a8', '#e8802a'][i % 5]; c.fillStyle = cc; c.beginPath(); c.ellipse(k, my - 1, 6.6, 3.8, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(k - 2, my - 2.4, 2.4, 1.2, 0, 0, TAU); c.fill(); }
    }
    // vidro: quase transparente, com reflexos, moldura de metal
    const gv = c.createLinearGradient(x, ty - ah, x + w, ty); gv.addColorStop(0, 'rgba(210,235,250,0.28)'); gv.addColorStop(0.5, 'rgba(210,235,250,0.1)'); gv.addColorStop(1, 'rgba(210,235,250,0.3)');
    c.fillStyle = gv; rr(c, x + 2, ty - ah, w - 4, ah + 3, 3); c.fill();
    c.strokeStyle = '#aab0b8'; c.lineWidth = 2; rr(c, x + 2, ty - ah, w - 4, ah + 3, 3); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.moveTo(x + 8, ty - ah + 2); c.lineTo(x + 20, ty - ah + 2); c.lineTo(x + 10, ty + 1); c.lineTo(x + 4, ty + 1); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x + 4, ty - ah + 1, w - 8, 1.4);
    if (tema === 'carne' || tema === 'sorvete') { c.fillStyle = 'rgba(190,230,255,0.12)'; c.fillRect(x + 3, ty - ah, w - 6, ah); }
  }, { alto: 26 });

  // =====================================================================
  //  ARARA DE ROUPAS e MANEQUIM
  // =====================================================================
  reg('arara', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 40, r = rng((x * 3 + y * 7) | 0), tema = o.tema || 'camisa', by = y + h;
    sombra(c, x, y, w, h, { dx: 5, dy: 6, r: 3, a: 0.07 });
    // pés em T e barra de cima
    c.strokeStyle = '#9aa0a8'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + 6, by - 1); c.lineTo(x + 6, by - e); c.moveTo(x + w - 6, by - 1); c.lineTo(x + w - 6, by - e); c.stroke();
    c.fillStyle = '#6a7078'; c.fillRect(x + 1, by - 3, 11, 3); c.fillRect(x + w - 12, by - 3, 11, 3);
    const n = Math.max(3, Math.floor((w - 16) / 11)), cores = ['#e84a8a', '#f2f2f2', '#4ab0e8', '#2f9a4a', '#f2c82a', '#8a4fc2', '#e8402a', '#16181e', '#3a4a6a'];
    for (let i = 0; i < n; i++) {
      const px = x + 12 + i * ((w - 24) / Math.max(1, n - 1)), cc = pick(r, cores), top = by - e + 2;
      c.strokeStyle = '#b8bec6'; c.lineWidth = 1; c.beginPath(); c.moveTo(px, top - 3); c.lineTo(px - 5, top + 4); c.lineTo(px + 5, top + 4); c.closePath(); c.stroke();
      if (tema === 'calca') { c.fillStyle = cc; c.fillRect(px - 5, top + 3, 10, 5); c.fillRect(px - 5, top + 8, 4.4, e * 0.5); c.fillRect(px + 0.6, top + 8, 4.4, e * 0.5); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(px - 0.4, top + 8, 1, e * 0.5); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(px - 4.6, top + 9, 1.4, e * 0.4); }
      else { c.fillStyle = cc; c.beginPath(); c.moveTo(px - 4, top + 3); c.lineTo(px - 9, top + 9); c.lineTo(px - 6.5, top + 12); c.lineTo(px - 4.5, top + 10); c.lineTo(px - 4.5, top + e * 0.6); c.lineTo(px + 4.5, top + e * 0.6); c.lineTo(px + 4.5, top + 10); c.lineTo(px + 6.5, top + 12); c.lineTo(px + 9, top + 9); c.lineTo(px + 4, top + 3); c.closePath(); c.fill(); c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(px - 4.5, top + e * 0.6 - 2, 9, 2); c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(px - 3.4, top + 8, 1.6, e * 0.38); }
    }
    c.strokeStyle = '#c8ced6'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + 4, by - e); c.lineTo(x + w - 4, by - e); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 4, by - e - 1); c.lineTo(x + w - 4, by - e - 1); c.stroke();
  }, { alto: 12 });

  reg('manequim', (c, o) => {
    const cx = o.x + o.w / 2, by = o.y + o.h, cor = o.cor || '#e84a8a', cor2 = o.cor2 || '#3a4a6a', e = o.e || 64;
    sombra(c, o.x, o.y + 6, o.w, o.h - 6, { oval: true, dx: 5, dy: 5, a: 0.1 });
    c.fillStyle = '#2a2d36'; c.beginPath(); c.ellipse(cx, by - 3, 11, 4.4, 0, 0, TAU); c.fill(); c.fillStyle = '#4a4e58'; c.beginPath(); c.ellipse(cx, by - 5, 11, 4, 0, 0, TAU); c.fill();
    c.fillStyle = '#8a9099'; c.fillRect(cx - 1.2, by - e * 0.5, 2.4, e * 0.5 - 4);
    // calça / saia
    c.fillStyle = cor2; c.beginPath(); c.moveTo(cx - 8, by - e * 0.46); c.lineTo(cx + 8, by - e * 0.46); c.lineTo(cx + 9, by - e * 0.2); c.lineTo(cx + 1, by - e * 0.2); c.lineTo(cx, by - e * 0.38); c.lineTo(cx - 1, by - e * 0.2); c.lineTo(cx - 9, by - e * 0.2); c.closePath(); c.fill();
    // tronco com camisa
    const gt = c.createLinearGradient(cx - 10, 0, cx + 10, 0); gt.addColorStop(0, shade(cor, -0.2)); gt.addColorStop(0.4, shade(cor, 0.14)); gt.addColorStop(1, shade(cor, -0.3));
    c.fillStyle = gt; c.beginPath(); c.moveTo(cx - 7, by - e * 0.9); c.quadraticCurveTo(cx - 13, by - e * 0.82, cx - 11, by - e * 0.7); c.lineTo(cx - 8, by - e * 0.46); c.lineTo(cx + 8, by - e * 0.46); c.lineTo(cx + 11, by - e * 0.7); c.quadraticCurveTo(cx + 13, by - e * 0.82, cx + 7, by - e * 0.9); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#e8dcc8'; c.fillRect(cx - 2.4, by - e * 0.97, 4.8, e * 0.08); c.beginPath(); c.ellipse(cx, by - e * 1.04, 5.2, 6.4, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.ellipse(cx - 1.6, by - e * 1.08, 1.8, 3, 0, 0, TAU); c.fill();
  }, { alto: 30, pad: 24 });

  // =====================================================================
  //  PETSHOP: aquário, gaiola, caminha de cachorro
  // =====================================================================
  reg('aquario', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 46, r = rng((x + y) | 0), pe = 16;
    caixa(c, x, y, w, h, pe, '#2a2d36', '#3a2a1e', { r: 3 });
    const ty = y - pe, th = e - pe;                 // o tanque fica em cima do móvel
    // fundo (parede de trás) e água
    const gw = c.createLinearGradient(0, ty - th, 0, ty); gw.addColorStop(0, '#6ad0e8'); gw.addColorStop(1, '#2a7ab0');
    c.fillStyle = gw; c.fillRect(x + 3, ty - th, w - 6, th + h * 0.1);
    c.fillStyle = 'rgba(255,255,255,0.12)'; for (let k = 0; k < 5; k++) c.fillRect(x + 6 + k * (w / 5), ty - th, 3, th);
    // cascalho, plantas, pedra
    c.fillStyle = '#c8b890'; c.fillRect(x + 3, ty - 6, w - 6, 7); for (let k = 0; k < 30; k++) { c.fillStyle = pick(r, ['#a89870', '#e8dcc0', '#8a7a58']); c.fillRect(x + 4 + r() * (w - 8), ty - 5 + r() * 5, 1.6, 1.6); }
    for (let k = 0; k < 4; k++) { const px = x + 10 + r() * (w - 20); c.strokeStyle = pick(r, ['#2f9a4a', '#58b848', '#1f7a3a']); c.lineWidth = 2; c.beginPath(); c.moveTo(px, ty - 5); c.quadraticCurveTo(px + 4 * (r() - 0.5) * 3, ty - th * 0.5, px + (r() - 0.5) * 8, ty - th * 0.8); c.stroke(); }
    c.fillStyle = '#6a6a72'; c.beginPath(); c.ellipse(x + w * 0.74, ty - 6, 9, 5, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.2)'; c.beginPath(); c.ellipse(x + w * 0.74 - 2, ty - 8, 4, 2, 0, 0, TAU); c.fill();
    // peixes
    [['#f08a2a', 0.28, 0.45, 1], ['#f2e02a', 0.55, 0.3, -1], ['#e84a6a', 0.45, 0.62, 1], ['#4aa0f0', 0.78, 0.4, -1]].forEach(([cc, a, b, d]) => {
      const fx = x + w * a, fy = ty - th * (1 - b) - 4; c.fillStyle = cc; c.beginPath(); c.ellipse(fx, fy, 5.4, 3, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(fx - d * 4, fy); c.lineTo(fx - d * 9, fy - 3.6); c.lineTo(fx - d * 9, fy + 3.6); c.closePath(); c.fill(); bola(c, fx + d * 3, fy - 0.8, 0.9, '#16181e');
    });
    c.fillStyle = 'rgba(255,255,255,0.55)'; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(x + w * 0.2 + k * 2, ty - th * (0.2 + 0.12 * k), 1.2 + (k % 2) * 0.6, 0, TAU); c.fill(); }
    // vidro, moldura e luminária de cima
    c.strokeStyle = '#16181e'; c.lineWidth = 3; c.strokeRect(x + 1.5, ty - th - 1.5, w - 3, th + 3); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1; c.strokeRect(x + 4, ty - th + 1, w - 8, th - 2);
    c.fillStyle = 'rgba(255,255,255,0.28)'; c.beginPath(); c.moveTo(x + 8, ty - th + 2); c.lineTo(x + 22, ty - th + 2); c.lineTo(x + 12, ty - 4); c.lineTo(x + 5, ty - 4); c.closePath(); c.fill();
    c.fillStyle = '#16181e'; rr(c, x - 1, ty - th - 7, w + 2, 6, 2); c.fill(); c.fillStyle = 'rgba(190,230,255,0.9)'; c.fillRect(x + 5, ty - th - 5, w - 10, 2);
  }, { alto: 22 });

  reg('gaiola', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 28, bicho = o.bicho || 'cao', cor = o.cor || '#c89858';
    caixa(c, x, y, w, h, 6, '#e8dcc0', '#8a9099', { r: 2 });          // bandeja com jornal
    const ty = y - 6, fy = y + h - 6;
    c.fillStyle = 'rgba(0,0,0,0.12)'; for (let k = 0; k < 4; k++) c.fillRect(x + 4, ty + 4 + k * (h / 4), w - 8, 1);
    // o bichinho (visto de cima, de lado)
    const bx = x + w * 0.45, by = ty + h * 0.55;
    if (bicho === 'gato') { c.fillStyle = cor; c.beginPath(); c.ellipse(bx, by, 11, 6.4, 0, 0, TAU); c.fill(); bola(c, bx + 10, by - 2, 5, cor); c.beginPath(); c.moveTo(bx + 7, by - 6); c.lineTo(bx + 8.4, by - 11); c.lineTo(bx + 11, by - 6.4); c.fill(); c.beginPath(); c.moveTo(bx + 11, by - 6.4); c.lineTo(bx + 13.4, by - 10.6); c.lineTo(bx + 14.4, by - 5.6); c.fill(); c.strokeStyle = cor; c.lineWidth = 2.4; c.beginPath(); c.moveTo(bx - 10, by); c.quadraticCurveTo(bx - 18, by - 4, bx - 16, by - 10); c.stroke(); bola(c, bx + 11.6, by - 3, 0.9, '#16181e'); bola(c, bx + 14.4, by - 3, 0.9, '#16181e'); }
    else { c.fillStyle = cor; c.beginPath(); c.ellipse(bx, by, 12, 7, 0, 0, TAU); c.fill(); c.fillStyle = shade(cor, -0.18); c.beginPath(); c.ellipse(bx - 3, by - 1, 6, 3.6, 0, 0, TAU); c.fill(); bola(c, bx + 11, by - 1, 5.6, cor); c.fillStyle = shade(cor, -0.3); c.beginPath(); c.ellipse(bx + 8, by - 5, 2.4, 4, 0.5, 0, TAU); c.fill(); c.beginPath(); c.ellipse(bx + 14, by - 5, 2.4, 4, -0.5, 0, TAU); c.fill(); bola(c, bx + 16, by, 1.6, '#16181e'); bola(c, bx + 12, by - 3, 0.9, '#16181e'); c.strokeStyle = cor; c.lineWidth = 2.6; c.beginPath(); c.moveTo(bx - 11, by - 1); c.quadraticCurveTo(bx - 17, by - 6, bx - 15, by - 9); c.stroke(); }
    c.fillStyle = '#4a90e0'; c.beginPath(); c.ellipse(x + w - 12, ty + h * 0.3, 6, 3, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.ellipse(x + w - 12, ty + h * 0.3 - 1, 3.4, 1.4, 0, 0, TAU); c.fill();
    // grades na frente + teto fininho
    c.strokeStyle = '#7a8088'; c.lineWidth = 1.6; c.beginPath(); for (let k = x + 5; k < x + w; k += 7) { c.moveTo(k, ty - e + 6); c.lineTo(k, fy); } c.stroke();
    c.strokeStyle = '#aab0b8'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + 1, ty - e + 6); c.lineTo(x + w - 1, ty - e + 6); c.moveTo(x + 1, fy - 1); c.lineTo(x + w - 1, fy - 1); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(x + 3, ty - e + 8, 2.4, e - 8);
  }, { alto: 12 });

  reg('cama_pet', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, cx = x + w / 2, cy = y + h / 2, cor = o.cor || '#c8402a';
    sombra(c, x, y, w, h, { oval: true, dx: 3, dy: 4, a: 0.1 });
    c.fillStyle = shade(cor, -0.15); c.beginPath(); c.ellipse(cx, cy + 2, w / 2, h / 2, 0, 0, TAU); c.fill();
    c.fillStyle = cor; c.beginPath(); c.ellipse(cx, cy, w / 2, h / 2 - 1, 0, 0, TAU); c.fill(); c.fillStyle = '#f2e0c0'; c.beginPath(); c.ellipse(cx, cy + 1, w / 2 - 7, h / 2 - 7, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(cx, cy - 1, w / 2 - 2, h / 2 - 4, 0, Math.PI * 1.1, Math.PI * 1.7); c.stroke();
    const dc = o.cao || '#b8803a';   // cachorro dormindo enrolado
    c.fillStyle = dc; c.beginPath(); c.ellipse(cx - 2, cy + 1, w * 0.26, h * 0.26, 0, 0, TAU); c.fill(); c.fillStyle = shade(dc, -0.2); c.beginPath(); c.ellipse(cx - 6, cy, w * 0.14, h * 0.16, 0.3, 0, TAU); c.fill();
    bola(c, cx + w * 0.2, cy - 2, h * 0.2, dc); c.fillStyle = shade(dc, -0.3); c.beginPath(); c.ellipse(cx + w * 0.17, cy - h * 0.18, 3, 4.6, 0.4, 0, TAU); c.fill(); c.beginPath(); c.ellipse(cx + w * 0.27, cy - h * 0.12, 3, 4.6, -0.3, 0, TAU); c.fill(); bola(c, cx + w * 0.33, cy - 1, 1.8, '#16181e');
    c.fillStyle = 'rgba(30,20,10,0.5)'; c.fillRect(cx + w * 0.23, cy - 4, 2.4, 1.2);
    c.fillStyle = '#c8302a'; c.font = 'bold 6px Arial'; c.textAlign = 'center'; c.fillText('z z', cx + w * 0.1, cy - h * 0.38); c.textAlign = 'left';
  }, { alto: 14 });

  // =====================================================================
  //  FLORICULTURA: baldes de flores em degraus
  // =====================================================================
  reg('balde_flores', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 40, r = rng((x * 3 + y * 5) | 0);
    sombra(c, x, y, w, h, { dx: 4, dy: 6, r: 3, a: 0.09 });
    const nd = 3;
    c.fillStyle = '#7a5230'; c.fillRect(x, y - e, w, e + h); const g = c.createLinearGradient(0, y - e, 0, y + h); g.addColorStop(0, '#9a7040'); g.addColorStop(1, '#5a3a22'); c.fillStyle = g; rr(c, x, y - e, w, e + h, 3); c.fill(); contorno(c, x, y - e, w, e + h, 3);
    for (let d = 0; d < nd; d++) {
      const ly = y - e + d * (e + h) / nd, rowH = (e + h) / nd; c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x + 1, ly + rowH - 2, w - 2, 2); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x + 1, ly + rowH - 4, w - 2, 1.2);
      const nb = Math.max(2, Math.floor(w / 30)), bw = (w - 8) / nb;
      for (let i = 0; i < nb; i++) {
        const bx = x + 4 + i * bw + bw / 2, by = ly + rowH - 4, cor = pick(r, ['#e84a6a', '#f2d84a', '#ffffff', '#8a4fc2', '#e8802a', '#e84a8a', '#4ab0e8']);
        // balde de zinco
        c.fillStyle = '#aab0b8'; c.beginPath(); c.moveTo(bx - 8, by - 9); c.lineTo(bx + 8, by - 9); c.lineTo(bx + 6.4, by); c.lineTo(bx - 6.4, by); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(bx - 6.4, by - 9, 2, 9); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(bx + 3, by - 9, 3, 9);
        // flores saindo
        for (let k = 0; k < 7; k++) { const fx = bx + (k - 3) * 2.2 + (r() - 0.5) * 2, fy = by - 14 - r() * 9; c.strokeStyle = '#2f8a3c'; c.lineWidth = 1; c.beginPath(); c.moveTo(bx + (k - 3) * 0.8, by - 9); c.lineTo(fx, fy); c.stroke(); bola(c, fx, fy, 3 + r() * 1.2, cor); bola(c, fx, fy, 1.1, shade(cor, -0.3)); }
        c.fillStyle = '#2f9a4a'; c.beginPath(); c.ellipse(bx - 7, by - 12, 4, 1.6, -0.5, 0, TAU); c.fill(); c.beginPath(); c.ellipse(bx + 7, by - 12, 4, 1.6, 0.5, 0, TAU); c.fill();
      }
    }
    c.fillStyle = '#16181e'; rr(c, x + w / 2 - 18, y - e - 9, 36, 10, 2); c.fill(); c.fillStyle = '#f4f0e8'; c.font = 'bold 7px Arial'; c.textAlign = 'center'; c.fillText('R$ 5', x + w / 2, y - e - 1.4); c.textAlign = 'left';
  }, { alto: 24 });

  // =====================================================================
  //  MESAS e CADEIRAS de comércio (café, lanchonete, bar, sorveteria)
  // =====================================================================
  reg('mesa', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 18, cx = x + w / 2, ty = y - e, est = o.estilo || 'padrao', cy = ty + h / 2, redonda = est !== 'lanche';
    sombra(c, x, y, w, h, { oval: redonda, dx: 4, dy: 6, a: 0.1 });
    if (redonda) {
      // pé central e base
      c.fillStyle = '#2a2d36'; c.beginPath(); c.ellipse(cx, y + h - 3, w * 0.28, 3.4, 0, 0, TAU); c.fill(); const gp = c.createLinearGradient(cx - 3, 0, cx + 3, 0); gp.addColorStop(0, '#6a707a'); gp.addColorStop(1, '#2a2d36'); c.fillStyle = gp; c.fillRect(cx - 2.6, cy + 2, 5.2, e - 2);
      const top = est === 'cafe' ? '#f2efe8' : est === 'sorvete' ? '#f8c8dc' : est === 'bar' ? '#4a3220' : '#b88a58';
      c.fillStyle = shade(top, -0.35); c.beginPath(); c.ellipse(cx, cy + 2.4, w / 2, h / 2, 0, 0, TAU); c.fill();
      const g = c.createRadialGradient(cx - w * 0.2, cy - h * 0.2, 2, cx, cy, w * 0.55); g.addColorStop(0, shade(top, 0.2)); g.addColorStop(1, shade(top, -0.14)); c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, w / 2, h / 2, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 1; c.stroke();
      if (est === 'cafe') { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(cx - 7, cy, 6.4, 3.8, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.stroke(); c.fillStyle = '#5a3220'; c.beginPath(); c.ellipse(cx - 7, cy, 3.8, 2.2, 0, 0, TAU); c.fill(); c.fillStyle = '#e8402a'; c.fillRect(cx + 6, cy - 5, 2.4, 7); bola(c, cx + 7.2, cy - 6.6, 2.6, '#f2c82a'); c.fillStyle = '#2f8a3c'; c.fillRect(cx + 6.4, cy - 11, 1.6, 5); }
      else if (est === 'bar') { c.fillStyle = 'rgba(200,230,255,0.55)'; c.fillRect(cx - 9, cy - 5, 5, 7); c.fillStyle = '#e8a82a'; c.fillRect(cx - 9, cy - 2, 5, 4); c.fillStyle = '#fff'; c.fillRect(cx - 9, cy - 3.6, 5, 1.6); c.fillStyle = '#2f8a3c'; rr(c, cx + 3, cy - 9, 3.6, 10, 1.4); c.fill(); c.fillRect(cx + 4, cy - 12, 1.6, 4); c.fillStyle = '#e8c070'; for (let k = 0; k < 5; k++) bola(c, cx + (k - 2) * 2.4, cy + 4.6 - (k % 2), 1.3, '#e8c070'); }
      else if (est === 'sorvete') { c.fillStyle = 'rgba(220,240,250,0.8)'; c.beginPath(); c.moveTo(cx - 5, cy - 6); c.lineTo(cx + 5, cy - 6); c.lineTo(cx + 2, cy + 2); c.lineTo(cx - 2, cy + 2); c.closePath(); c.fill(); bola(c, cx - 2, cy - 8, 3.4, '#e84a8a'); bola(c, cx + 2.4, cy - 8, 3.4, '#8a5a3a'); bola(c, cx, cy - 11, 3.2, '#f2e8a0'); bola(c, cx, cy - 14, 1.6, '#c8302a'); }
      else { c.fillStyle = 'rgba(200,230,255,0.6)'; c.fillRect(cx - 12, cy - 4, 5, 7); c.fillStyle = '#e8a82a'; c.fillRect(cx - 12, cy - 1, 5, 4); c.fillRect(cx + 5, cy - 4, 5, 7); c.fillStyle = '#e8a82a'; c.fillRect(cx + 5, cy - 1, 5, 4); }
    } else {
      // lanchonete: quadrada com toalha xadrez, ketchup e mostarda
      c.fillStyle = '#2a2d36'; c.fillRect(x + 6, ty + h - 2, 4, e + 2); c.fillRect(x + w - 10, ty + h - 2, 4, e + 2);
      caixa(c, x, y, w, h, e, '#f4ecd8', '#c8302a', { r: 3, semSombra: true });
      for (let j = 0; j * 7 < h; j++) for (let i = 0; i * 7 < w; i++) if ((i + j) % 2) { c.fillStyle = 'rgba(200,48,42,0.85)'; c.fillRect(x + 1 + i * 7, ty + 1 + j * 7, Math.min(7, w - 2 - i * 7), Math.min(7, h - 2 - j * 7)); }
      contorno(c, x, ty, w, h, 3);
      c.fillStyle = '#e8402a'; rr(c, x + w * 0.2, ty + h * 0.2, 4.4, 9, 1.6); c.fill(); c.fillStyle = '#f2c82a'; rr(c, x + w * 0.2 + 7, ty + h * 0.2, 4.4, 9, 1.6); c.fill(); c.fillStyle = '#f4f0e8'; c.fillRect(x + w * 0.6, ty + h * 0.3, 9, 6); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x + w * 0.6 + 1, ty + h * 0.3 + 2, 7, 1);
      c.fillStyle = 'rgba(200,230,255,0.6)'; c.fillRect(x + w * 0.42, ty + h * 0.55, 5, 7); c.fillStyle = '#7a3a1a'; c.fillRect(x + w * 0.42, ty + h * 0.55 + 2, 5, 5);
    }
  }, { alto: 24 });

  reg('cadeira', (c, o) => {
    // dir = lado do ENCOSTO ('n','s','e','w'); estilo 'plastico' (colorida) ou 'madeira'
    const x = o.x, y = o.y, w = Math.max(o.w, 22), h = Math.max(o.h, 22), dir = o.dir || 's', est = o.estilo || 'madeira';
    const cor = o.cor || (est === 'plastico' ? '#e8402a' : '#8a5a34'), cx = x + o.w / 2, cy = y + o.h / 2, R0 = Math.max(9, Math.min(o.w, o.h) / 2 - 0.5);
    sombra(c, cx - R0, cy - R0 + 2, R0 * 2, R0 * 2 - 2, { oval: false, r: 5, dx: 3, dy: 4, a: 0.1 });
    const lado = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[dir], px = lado[0], py = lado[1];
    // assento
    const g = c.createRadialGradient(cx - 3, cy - 4, 1, cx, cy, 13); g.addColorStop(0, shade(cor, 0.22)); g.addColorStop(1, shade(cor, -0.18));
    c.fillStyle = g; rr(c, cx - R0, cy - R0 + 1, R0 * 2, R0 * 2 - 2, est === 'plastico' ? 7 : 3); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 1; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.28)'; c.fillRect(cx - R0 + 3, cy - R0 + 3, R0 * 2 - 8, 1.6);
    if (est === 'madeira') { c.strokeStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.moveTo(cx - R0 + 2, cy - 3); c.lineTo(cx + R0 - 2, cy - 3); c.moveTo(cx - R0 + 2, cy + 3); c.lineTo(cx + R0 - 2, cy + 3); c.stroke(); }
    // encosto (uma faixa mais alta do lado escolhido)
    const bw = px ? 5 : R0 * 2, bh = py ? 6 : R0 * 2, bx = px > 0 ? cx + R0 - 2 : px < 0 ? cx - R0 - 3 : cx - R0, by = py > 0 ? cy + R0 - 4 : py < 0 ? cy - R0 - 4 : cy - R0;
    const up = py > 0 ? -2 : 0;      // encosto de frente: sobe um pouco
    const g2 = c.createLinearGradient(bx, by, bx + bw, by + bh); g2.addColorStop(0, shade(cor, 0.24)); g2.addColorStop(1, shade(cor, -0.28)); c.fillStyle = g2; rr(c, bx, by + up, bw, bh, 2.4); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.5)'; c.stroke();
    if (py > 0) { c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(bx + 2, by + up + 1, bw - 4, 1.4); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(bx + 1, by + up + bh - 2, bw - 2, 1.4); }
    // pezinhos
    c.fillStyle = '#2a2d36'; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => c.fillRect(cx + a * (R0 - 2) - 1, cy + b * (R0 - 2) + 1, 2.4, 2.4));
  }, { alto: 18, pad: 14 });

  // =====================================================================
  //  BANCO DE ESPERA (estofado), CEPO de açougueiro, caixote de frutas
  // =====================================================================
  reg('banco_espera', (c, o) => K.novos.sofa(c, Object.assign({}, o, { almofadas: false, dir: o.dir || 'n', cor: o.cor || '#4a5a7a', e: 14, _cv: null }), 0), { alto: 30 });

  reg('cepo', (c, o) => {
    const cx = o.x + o.w / 2, e = o.e || 26;
    sombra(c, o.x, o.y, o.w, o.h, { oval: true, dx: 4, dy: 6, a: 0.12 });
    c.fillStyle = '#4a2e18'; c.beginPath(); c.ellipse(cx, o.y + o.h - o.h * 0.5 + 0, o.w / 2, o.h / 2, 0, 0, TAU); c.fill(); c.fillRect(cx - o.w / 2, o.y + o.h / 2 - e + 0, o.w, e);
    const gl = c.createLinearGradient(cx - o.w / 2, 0, cx + o.w / 2, 0); gl.addColorStop(0, '#6a4a2a'); gl.addColorStop(0.5, '#8a6438'); gl.addColorStop(1, '#4a2e18'); c.fillStyle = gl; c.fillRect(cx - o.w / 2, o.y + o.h / 2 - e, o.w, e);
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(cx - o.w / 2 + k * o.w / 5, o.y + o.h / 2 - e); c.lineTo(cx - o.w / 2 + k * o.w / 5, o.y + o.h / 2); c.stroke(); }
    const tcy = o.y + o.h / 2 - e; c.fillStyle = '#b88a58'; c.beginPath(); c.ellipse(cx, tcy, o.w / 2, o.h / 2, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(60,30,10,0.5)'; for (let k = 1; k < 4; k++) { c.beginPath(); c.ellipse(cx, tcy, o.w / 2 - k * 5, o.h / 2 - k * 4, 0, 0, TAU); c.stroke(); }
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); c.ellipse(cx, tcy, o.w / 2, o.h / 2, 0, 0, TAU); c.stroke();
    // cutelo fincado + um pedaço de carne
    c.fillStyle = '#c8302a'; rr(c, cx - 9, tcy - 3, 12, 8, 3); c.fill(); c.fillStyle = '#f0d0c8'; c.fillRect(cx - 7, tcy, 8, 1.6);
    c.fillStyle = '#c8ccd2'; c.fillRect(cx + 4, tcy - 9, 11, 7); c.fillStyle = '#e8ecf0'; c.fillRect(cx + 4, tcy - 9, 11, 1.6); c.fillStyle = '#5a3a22'; c.fillRect(cx + 14, tcy - 7, 6, 3);
  }, { alto: 22 });

  reg('caixote_frutas', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 20, r = rng((x + y * 3) | 0), n = Math.max(1, Math.round(w / 52)), cw = w / n;
    for (let i = 0; i < n; i++) {
      const bx = x + i * cw, tipo = i % 3;
      caixa(c, bx + 1, y, cw - 2, h, e, '#8a5a34', '#b88a58', { r: 2 });
      const ty = y - e; c.fillStyle = '#3a2412'; rr(c, bx + 4, ty + 3, cw - 8, h - 6, 2); c.fill();
      for (let k = 0; k < 22; k++) { const fx = bx + 7 + r() * (cw - 14), fy = ty + 5 + r() * (h - 10); if (tipo === 0) { bola(c, fx, fy, 4, pick(r, ['#e8801a', '#f08a2a'])); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(fx - 2, fy - 2.4, 2, 1.6); } else if (tipo === 1) { bola(c, fx, fy, 4, pick(r, ['#c8302a', '#a82020', '#4aa02a'])); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(fx - 2, fy - 2.4, 2, 1.6); } else { c.fillStyle = pick(r, ['#2f9a4a', '#58b848', '#8ad048']); c.beginPath(); c.ellipse(fx, fy, 5, 3, r() * 3, 0, TAU); c.fill(); } }
      // ripas na frente e etiqueta
      const fy0 = y + h - e; c.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 0; k < 3; k++) c.fillRect(bx + 3, fy0 + 3 + k * (e / 3), cw - 6, 1.2); c.fillStyle = '#f2e84a'; c.fillRect(bx + cw / 2 - 8, fy0 + e * 0.3, 16, 7); c.fillStyle = '#16181e'; c.font = 'bold 6px Arial'; c.textAlign = 'center'; c.fillText(['LARANJA', 'MAÇÃ', 'ALFACE'][tipo], bx + cw / 2, fy0 + e * 0.3 + 5.4); c.textAlign = 'left';
    }
  }, { alto: 8 });

  // =====================================================================
  //  PILHA DE SACOS (cimento, ração, arroz) e ESCADA
  // =====================================================================
  reg('pilha_sacos', (c, o) => {
    // bloco de sacos empilhados (2 camadas) sobre um palete de madeira
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 34, tipo = o.tipo || 'cimento', pal = 5, eb = e - pal;
    const corSaco = tipo === 'cimento' ? '#b4b0a4' : tipo === 'racao' ? '#c8702a' : '#e8e0c8', corFaixa = tipo === 'cimento' ? '#2a58b8' : tipo === 'racao' ? '#f2e8c8' : '#c8302a';
    caixa(c, x, y, w, h, pal, '#8a5a34', '#6a4a2a', { r: 1 });
    caixa(c, x + 1, y - pal, w - 2, h - 2, eb, shade(corSaco, 0.22), corSaco, { r: 4, semSombra: true });
    const fy = y - pal + (h - 2) - eb, fh = eb, bw = (w - 2) / 2;       // frente do bloco
    c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 2, fy + fh / 2); c.lineTo(x + w - 2, fy + fh / 2); c.moveTo(x + 1 + bw, fy + 2); c.lineTo(x + 1 + bw, fy + fh - 1); c.stroke();
    for (let row = 0; row < 2; row++) for (let i = 0; i < 2; i++) {
      const sx = x + 1 + i * bw, sy = fy + row * fh / 2;
      c.fillStyle = corFaixa; c.fillRect(sx + 4, sy + fh * 0.12, bw - 8, fh * 0.26); c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(sx + 7, sy + fh * 0.2, (bw - 14) * 0.7, 1.8);
      c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(sx + 3, sy + 2, bw - 6, 1.4);
    }
    // costura no topo
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.setLineDash([2, 2]); c.beginPath(); c.moveTo(x + 4, y - pal - eb + 4); c.lineTo(x + w - 4, y - pal - eb + 4); c.moveTo(x + 4, y - pal - eb + h - 6); c.lineTo(x + w - 4, y - pal - eb + h - 6); c.stroke(); c.setLineDash([]);
  }, { alto: 8 });

  reg('escada', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 70, by = y + h;
    sombra(c, x, y, w, h, { dx: 5, dy: 5, a: 0.07 });
    c.strokeStyle = '#e8a02a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 3, by); c.lineTo(x + 7, by - e); c.moveTo(x + w - 3, by); c.lineTo(x + w - 7, by - e); c.stroke();
    c.strokeStyle = '#c8ccd2'; c.lineWidth = 2; for (let k = 1; k <= 7; k++) { const t = k / 8, yy = by - e * t, ins = 3 + 4 * t; c.beginPath(); c.moveTo(x + ins - 0.5, yy); c.lineTo(x + w - ins + 0.5, yy); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(x + 2.4, by - e * 0.8, 1.4, e * 0.7);
  }, { alto: 8 });

  // =====================================================================
  //  PROVADOR, MESAS DE EXPOSIÇÃO, GUICHÊ DE VIDRO, FILA, PENDENTE
  // =====================================================================
  reg('cabine_prova', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 70, cor = o.cor || '#c04a8a';
    caixa(c, x, y, w, h, e, '#d8c8b0', '#f0e8dc', { r: 2 });
    const fy = y + h - e;
    c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(x + 1, fy, 4, e); c.fillRect(x + w - 5, fy, 4, e);
    // cortinão: duas folhas com dobras, aberto no meio
    const cw = w * 0.36;
    [[x + 3, 1], [x + w - 3 - cw, -1]].forEach(([cx0, sg]) => {
      const g = c.createLinearGradient(cx0, 0, cx0 + cw, 0); g.addColorStop(0, shade(cor, -0.2)); g.addColorStop(0.3, shade(cor, 0.15)); g.addColorStop(0.55, shade(cor, -0.12)); g.addColorStop(0.8, shade(cor, 0.12)); g.addColorStop(1, shade(cor, -0.24));
      c.fillStyle = g; c.beginPath(); c.moveTo(cx0, fy + 3); c.lineTo(cx0 + cw, fy + 3); c.lineTo(cx0 + cw - (sg > 0 ? 4 : 0), y + h - 2); c.lineTo(cx0 + (sg > 0 ? 0 : 4), y + h - 2); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1; c.beginPath(); for (let k = 1; k < 5; k++) { c.moveTo(cx0 + k * cw / 5, fy + 4); c.lineTo(cx0 + k * cw / 5, y + h - 3); } c.stroke();
    });
    // dentro: espelho e banquinho
    const gm = c.createLinearGradient(x, fy, x + w, fy + e); gm.addColorStop(0, '#cfe2ee'); gm.addColorStop(1, '#8aa4b8'); c.fillStyle = gm; c.fillRect(x + w * 0.4, fy + 8, w * 0.2, e - 22);
    c.fillStyle = '#16181e'; c.fillRect(x, fy - 1, w, 4); c.fillStyle = '#c8a24a'; c.beginPath(); c.arc(x + w / 2, fy + 1, 2, 0, TAU); c.fill();
    c.fillStyle = '#16181e'; c.font = 'bold 7px Arial'; c.textAlign = 'center'; c.fillStyle = '#f2e8d8'; c.fillText('PROVADOR', x + w / 2, fy + e * 0.5 + 2); c.textAlign = 'left';
  }, { alto: 8 });

  reg('mesa_expo', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 24, tema = o.tema || 'eletronicos', ty = y - e, r = rng((x + y) | 0);
    caixa(c, x, y, w, h, e, o.top || '#e8e4dc', o.front || '#6a707a', { r: 3 });
    const fy = y + h - e; c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(x + 4, fy + 4, w - 8, 2); c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(x + 4, fy + e - 6, w - 8, 1.4);
    const n = Math.max(2, Math.floor(w / 36));
    for (let i = 0; i < n; i++) {
      const px = x + 10 + i * ((w - 20) / Math.max(1, n - 1)) - (n === 1 ? 0 : 0), py = ty + h * 0.55;
      if (tema === 'eletronicos') { // notebook aberto
        c.fillStyle = '#3a3e48'; rr(c, px - 12, py - 2, 24, 9, 1.6); c.fill(); c.fillStyle = '#16181e'; rr(c, px - 11, py - 16, 22, 15, 1.6); c.fill(); const gs = c.createLinearGradient(px - 10, py - 15, px + 10, py - 3); gs.addColorStop(0, ['#4a90e0', '#e84a8a', '#4ad0a0'][i % 3]); gs.addColorStop(1, '#16181e'); c.fillStyle = gs; c.fillRect(px - 10, py - 15, 20, 13); c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(px - 10, py - 15, 20, 4); c.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < 3; k++) c.fillRect(px - 9 + k * 6, py + 1, 4, 2);
      } else if (tema === 'livros') { // pilhas de livros
        for (let k = 0; k < 4; k++) { c.fillStyle = pick(r, ['#c8402a', '#2a58b8', '#e0b32a', '#2f8a6a', '#7a3a8a']); c.fillRect(px - 10 + (k % 2) * 2, py + 4 - k * 4, 20, 3.6); c.fillStyle = '#f4ecd8'; c.fillRect(px - 9 + (k % 2) * 2, py + 4.6 - k * 4, 18, 1.4); }
      } else if (tema === 'volantes') { // volantes de aposta e lápis
        c.fillStyle = '#f2d88a'; rr(c, px - 10, py - 6, 20, 13, 1); c.fill(); c.fillStyle = '#8a1f3a'; c.fillRect(px - 10, py - 6, 20, 3); c.fillStyle = 'rgba(0,0,0,0.4)'; for (let k = 0; k < 4; k++) c.fillRect(px - 8, py - 1 + k * 2.2, 14, 0.9); c.fillStyle = '#e8a02a'; c.fillRect(px + 6, py - 12, 2, 11);
      } else if (tema === 'roupas') { // roupas dobradas
        for (let k = 0; k < 4; k++) { c.fillStyle = pick(r, ['#e84a8a', '#f2f2f2', '#4ab0e8', '#2f9a4a', '#f2c82a']); c.fillRect(px - 11, py + 4 - k * 4, 22, 3.6); c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(px - 11, py + 6.4 - k * 4, 22, 1); }
      } else { // doces / bolo
        c.fillStyle = '#f4ecd8'; c.beginPath(); c.ellipse(px, py, 12, 6, 0, 0, TAU); c.fill(); c.fillStyle = '#c8884a'; c.beginPath(); c.ellipse(px, py - 3, 10, 4.6, 0, 0, TAU); c.fill(); c.fillStyle = '#f4ecd8'; c.beginPath(); c.ellipse(px, py - 5.4, 8, 3, 0, 0, TAU); c.fill(); bola(c, px, py - 7, 1.8, '#c8302a');
      }
    }
  }, { alto: 22 });

  reg('vidro_guiche', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 52, ty = y - e;
    const g = c.createLinearGradient(x, ty, x + w, y + h); g.addColorStop(0, 'rgba(190,225,245,0.34)'); g.addColorStop(0.5, 'rgba(190,225,245,0.12)'); g.addColorStop(1, 'rgba(190,225,245,0.32)');
    c.fillStyle = g; c.fillRect(x, ty, w, e + h);
    c.strokeStyle = '#aab0b8'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, ty); c.lineTo(x + w, ty); c.moveTo(x + 1, ty); c.lineTo(x + 1, y + h); c.moveTo(x + w - 1, ty); c.lineTo(x + w - 1, y + h); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(x + 18, ty + 2); c.lineTo(x + 40, ty + 2); c.lineTo(x + 20, y + h - 2); c.lineTo(x + 8, y + h - 2); c.closePath(); c.fill();
    for (let k = 1; k < 3; k++) { const sx = x + w * k / 3; c.fillStyle = '#aab0b8'; c.fillRect(sx - 1.5, ty, 3, e + h); }
    // vãos para falar e passar dinheiro
    c.fillStyle = 'rgba(20,20,26,0.8)'; for (let k = 0; k < 3; k++) rr(c, x + w * (k + 0.5) / 3 - 14, y + h - 10, 28, 7, 2), c.fill();
  }, { alto: 8 });

  reg('fila', (c, o) => {
    // dois postes com fita (corda de fila)
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 26, by = y + h;
    [x + 4, x + w - 4].forEach(px => { c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(px + 2, by + 1, 6, 2.4, 0, 0, TAU); c.fill(); c.fillStyle = '#3a3e48'; c.beginPath(); c.ellipse(px, by - 1, 5, 2, 0, 0, TAU); c.fill(); const gp = c.createLinearGradient(px - 1.6, 0, px + 1.6, 0); gp.addColorStop(0, '#d8dce2'); gp.addColorStop(1, '#6a707a'); c.fillStyle = gp; c.fillRect(px - 1.6, by - e, 3.2, e - 1); bola(c, px, by - e, 2.8, '#c8a24a'); });
    c.strokeStyle = o.cor || '#c8302a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 4, by - e + 2); c.quadraticCurveTo(x + w / 2, by - e + 8, x + w - 4, by - e + 2); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 4, by - e + 1); c.quadraticCurveTo(x + w / 2, by - e + 7, x + w - 4, by - e + 1); c.stroke();
  }, { alto: 10 });

  reg('pendente', (c, o) => {
    // lâmpada pendurada: o fio vem de cima
    const cx = o.x + o.w / 2, ty = o.y - (o.e || 90), cor = o.cor || '#e8c070';
    c.strokeStyle = '#16181e'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx, ty - 40); c.lineTo(cx, ty); c.stroke();
    const g = c.createLinearGradient(cx - 11, 0, cx + 11, 0); g.addColorStop(0, shade(cor, -0.3)); g.addColorStop(0.4, shade(cor, 0.2)); g.addColorStop(1, shade(cor, -0.4));
    c.fillStyle = g; c.beginPath(); c.moveTo(cx - 4, ty); c.lineTo(cx + 4, ty); c.lineTo(cx + 12, ty + 11); c.lineTo(cx - 12, ty + 11); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1; c.stroke();
    c.fillStyle = 'rgba(255,240,200,0.95)'; c.beginPath(); c.ellipse(cx, ty + 11.4, 10, 2.4, 0, 0, TAU); c.fill();
  }, { alto: 60, pad: 30 });

  reg('espelho_pe', (c, o) => {
    // espelho de chão com moldura e pés (para experimentar óculos, roupa...)
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 70, by = y + h, cor = o.cor || '#6a4a2a';
    sombra(c, x, y, w, h, { dx: 5, dy: 5, a: 0.08 });
    c.fillStyle = shade(cor, -0.2); c.fillRect(x + 4, by - 3, 6, 3); c.fillRect(x + w - 10, by - 3, 6, 3);
    c.fillStyle = cor; rr(c, x + 2, by - e, w - 4, e - 2, 6); c.fill(); contorno(c, x + 2, by - e, w - 4, e - 2, 6);
    const g = c.createLinearGradient(x, by - e, x + w, by); g.addColorStop(0, '#dff0fa'); g.addColorStop(0.5, '#9ab8cc'); g.addColorStop(1, '#6a8aa0'); c.fillStyle = g; rr(c, x + 6, by - e + 4, w - 12, e - 10, 4); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.moveTo(x + 10, by - e + 6); c.lineTo(x + 22, by - e + 6); c.lineTo(x + 12, by - 12); c.lineTo(x + 8, by - 12); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x + 28, by - e + 6, 4, e - 20);
  }, { alto: 8 });

  // =====================================================================
  //  PEÇAS DE PAREDE (desenhadas no fundo da sala, em R.deco)
  // =====================================================================
  // lousa de cardápio
  D.quadroNegro = function (c, px, py, w, h, linhas, titulo) {
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(px + 3, py + 4, w, h);
    c.fillStyle = '#7a5230'; c.fillRect(px - 4, py - 4, w + 8, h + 8); c.fillStyle = '#9a7040'; c.fillRect(px - 4, py - 4, w + 8, 1.6);
    const g = c.createLinearGradient(px, py, px + w, py + h); g.addColorStop(0, '#2a3a30'); g.addColorStop(1, '#1a2620'); c.fillStyle = g; c.fillRect(px, py, w, h);
    c.fillStyle = 'rgba(255,255,255,0.05)'; for (let k = 0; k < 18; k++) c.fillRect(px + hh(k, px) * w, py + hh(px, k) * h, 9, 1.6);
    c.fillStyle = '#f4efe0'; c.font = 'bold ' + Math.max(8, Math.min(12, h / 5)) + 'px "Comic Sans MS", Arial'; c.textAlign = 'center'; c.fillText(titulo || 'CARDÁPIO', px + w / 2, py + Math.max(11, h / 5)); c.font = '8px Arial';
    c.strokeStyle = 'rgba(244,239,224,0.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(px + 8, py + Math.max(14, h / 5 + 3)); c.lineTo(px + w - 8, py + Math.max(14, h / 5 + 3)); c.stroke();
    (linhas || []).forEach((l, i) => { c.fillStyle = i % 2 ? '#f2d86a' : '#f4efe0'; c.textAlign = 'left'; c.fillText(l[0], px + 8, py + 24 + i * 10); c.textAlign = 'right'; c.fillText(l[1], px + w - 8, py + 24 + i * 10); });
    c.textAlign = 'left'; c.fillStyle = '#c8a24a'; c.fillRect(px, py + h - 2, w, 2);
  };
  // TV de parede com imagem
  D.tvParede = function (c, px, py, w, h, tema) {
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(px + 3, py + 4, w, h);
    c.fillStyle = '#0c0c10'; rr(c, px - 2, py - 2, w + 4, h + 4, 2.4); c.fill();
    const g = c.createLinearGradient(px, py, px + w, py + h);
    if (tema === 'futebol') { g.addColorStop(0, '#2f8a3c'); g.addColorStop(1, '#1f6a2c'); c.fillStyle = g; c.fillRect(px, py, w, h); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1; c.strokeRect(px + 3, py + 3, w - 6, h - 6); c.beginPath(); c.moveTo(px + w / 2, py + 3); c.lineTo(px + w / 2, py + h - 3); c.stroke(); c.beginPath(); c.arc(px + w / 2, py + h / 2, h * 0.2, 0, TAU); c.stroke(); bola(c, px + w * 0.4, py + h * 0.45, 1.8, '#fff'); [[0.3, 0.3, '#e8402a'], [0.6, 0.6, '#2a58b8'], [0.5, 0.35, '#e8402a'], [0.7, 0.4, '#2a58b8']].forEach(([a, b, cc]) => bola(c, px + w * a, py + h * b, 1.8, cc)); }
    else if (tema === 'noticia') { g.addColorStop(0, '#2a3a6a'); g.addColorStop(1, '#16203a'); c.fillStyle = g; c.fillRect(px, py, w, h); c.fillStyle = '#c8302a'; c.fillRect(px, py + h * 0.78, w, h * 0.22); c.fillStyle = '#fff'; c.fillRect(px + 3, py + h * 0.84, w * 0.5, 2); bola(c, px + w * 0.3, py + h * 0.38, h * 0.18, '#e8c8a0'); c.fillStyle = '#16181e'; c.fillRect(px + w * 0.2, py + h * 0.52, w * 0.2, h * 0.26); }
    else { g.addColorStop(0, '#e84a8a'); g.addColorStop(0.5, '#4a90e0'); g.addColorStop(1, '#4ad0a0'); c.fillStyle = g; c.fillRect(px, py, w, h); c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.arc(px + w * 0.7, py + h * 0.35, h * 0.2, 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.moveTo(px, py); c.lineTo(px + w * 0.5, py); c.lineTo(px + w * 0.25, py + h); c.lineTo(px, py + h); c.closePath(); c.fill();
    c.fillStyle = '#2a2d36'; c.fillRect(px + w / 2 - 6, py + h + 2, 12, 2);
  };
  // trilho de ganchos com carnes penduradas
  D.ganchos = function (c, px, py, w) {
    c.fillStyle = '#9aa0a8'; c.fillRect(px, py, w, 3); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(px, py, w, 1);
    const r = rng(px | 0); let x = px + 10, i = 0;
    while (x < px + w - 12) {
      c.strokeStyle = '#8a9099'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, py + 3); c.lineTo(x, py + 9); c.arc(x + 2, py + 9, 2, Math.PI, 0.3 * Math.PI, true); c.stroke();
      const t = i % 3;
      if (t === 0) { // linguiça em gomos
        for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? '#8a3a22' : '#a04a2a'; rr(c, x - 3, py + 11 + k * 7, 8, 8, 3); c.fill(); }
        c.strokeStyle = '#d8c8a0'; c.beginPath(); c.moveTo(x + 1, py + 10); c.lineTo(x + 1, py + 40); c.stroke();
      } else if (t === 1) { // pernil
        c.fillStyle = '#b84a3a'; c.beginPath(); c.ellipse(x + 1, py + 26, 9, 15, 0, 0, TAU); c.fill(); c.fillStyle = '#f0c8b8'; c.beginPath(); c.ellipse(x + 1, py + 36, 6, 4, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.ellipse(x - 3, py + 22, 2, 7, 0, 0, TAU); c.fill();
      } else { // frango
        c.fillStyle = '#e8b058'; c.beginPath(); c.ellipse(x + 1, py + 22, 8, 11, 0, 0, TAU); c.fill(); c.fillStyle = '#d89a40'; c.beginPath(); c.ellipse(x + 1, py + 26, 6, 6, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(x - 2, py + 18, 2, 5, 0, 0, TAU); c.fill();
      }
      x += 26 + r() * 8; i++;
    }
  };
  // painel de ferramentas (pegboard)
  D.pegboard = function (c, px, py, w, h) {
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(px + 3, py + 3, w, h);
    c.fillStyle = '#b89868'; c.fillRect(px, py, w, h); c.fillStyle = 'rgba(0,0,0,0.25)'; for (let j = 4; j < h; j += 8) for (let i = 4; i < w; i += 8) c.fillRect(px + i, py + j, 1.6, 1.6);
    c.strokeStyle = '#6a4a2a'; c.lineWidth = 2; c.strokeRect(px, py, w, h);
    const r = rng((px + py) | 0); let x = px + 8;
    while (x < px + w - 14) {
      const t = (r() * 4) | 0;
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + 2, py + 12, 4, h * 0.55);
      if (t === 0) { c.fillStyle = '#8a5a34'; c.fillRect(x, py + 10 + h * 0.2, 3.4, h * 0.38); c.fillStyle = '#6a707a'; c.fillRect(x - 4, py + 8 + h * 0.18, 12, 6); }            // martelo
      else if (t === 1) { c.fillStyle = '#c8302a'; c.fillRect(x, py + 10 + h * 0.25, 3.4, h * 0.34); c.fillStyle = '#c8ccd2'; c.fillRect(x - 1, py + 10, 5.4, h * 0.26); c.fillStyle = 'rgba(0,0,0,0.4)'; for (let k = 0; k < 5; k++) c.fillRect(x - 1, py + 12 + k * 3, 1.6, 1.6); }   // serrote
      else if (t === 2) { c.fillStyle = '#e8a02a'; c.fillRect(x, py + 14, 3.4, h * 0.5); c.fillStyle = '#c8ccd2'; c.beginPath(); c.arc(x + 1.7, py + 12, 4.4, 0, TAU); c.fill(); c.fillStyle = '#b89868'; c.beginPath(); c.arc(x + 1.7, py + 12, 2, 0, TAU); c.fill(); }   // chave
      else { c.fillStyle = '#2a58b8'; c.fillRect(x, py + 10, 3.4, h * 0.32); c.fillStyle = '#c8ccd2'; c.fillRect(x - 3, py + 10 + h * 0.3, 9.4, 4); c.fillRect(x - 2, py + 10 + h * 0.3 + 4, 2, 5); c.fillRect(x + 3.4, py + 10 + h * 0.3 + 4, 2, 5); }   // alicate
      x += 15 + r() * 6;
    }
    c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(px + 2, py + 2, w - 4, 3);
  };
  // tabela de optotipos (letrinhas da ótica)
  D.optotipo = function (c, px, py, w, h) {
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(px + 3, py + 3, w, h); c.fillStyle = '#f4f2ea'; c.fillRect(px, py, w, h); c.strokeStyle = '#9a9a92'; c.lineWidth = 1.4; c.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1);
    c.fillStyle = '#16181e'; c.textAlign = 'center'; const L1 = ['E', 'FP', 'TOZ', 'LPED', 'PECFD', 'EDFCZP']; L1.forEach((t, i) => { c.font = 'bold ' + Math.max(4, 12 - i * 2) + 'px Arial'; c.fillText(t, px + w / 2, py + 12 + i * (h - 12) / 6.2 + (i > 0 ? i * 1.2 : 0)); }); c.textAlign = 'left';
  };
  // alvo de dardos
  D.alvo = function (c, px, py, r) {
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.arc(px + 2, py + 3, r + 3, 0, TAU); c.fill(); c.fillStyle = '#16181e'; c.beginPath(); c.arc(px, py, r + 3, 0, TAU); c.fill();
    [['#e8e0c8', r], ['#16181e', r * 0.82], ['#e8e0c8', r * 0.66], ['#c8302a', r * 0.48], ['#e8e0c8', r * 0.3], ['#2f8a3c', r * 0.16]].forEach(([cc, rr0]) => { c.fillStyle = cc; c.beginPath(); c.arc(px, py, rr0, 0, TAU); c.fill(); });
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 0.8; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + 0.4; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r); c.stroke(); }
    c.fillStyle = '#e8402a'; c.fillRect(px + 3, py - 4, 7, 1.6); c.fillStyle = '#c8ccd2'; c.fillRect(px - 8, py + 2, 6, 1.6);
  };
  // placa de neon (cerveja, open, etc.)
  D.neonPlaca = function (c, px, py, w, h, texto, cor) {
    c.fillStyle = 'rgba(8,6,16,0.85)'; rr(c, px, py, w, h, 5); c.fill(); c.strokeStyle = cor; c.lineWidth = 1.6; rr(c, px + 2, py + 2, w - 4, h - 4, 4); c.stroke();
    K.neon(c, texto, px + w / 2, py + h * 0.68, Math.max(8, Math.min(16, h * 0.5)), cor);
  };
  // bandeira de time
  D.bandeira = function (c, px, py, w, h, c1, c2) {
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(px + 3, py + 3, w, h); c.fillStyle = '#5a4a3a'; c.fillRect(px - 2, py - 3, w + 4, 3);
    c.fillStyle = c1; c.fillRect(px, py, w, h); c.fillStyle = c2; for (let k = 0; k < 5; k++) if (k % 2) c.fillRect(px, py + k * h / 5, w, h / 5);
    c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(px + w / 2, py + h / 2, Math.min(w, h) * 0.2, 0, TAU); c.fill(); c.fillStyle = c1; c.beginPath(); c.arc(px + w / 2, py + h / 2, Math.min(w, h) * 0.12, 0, TAU); c.fill();
  };
  // toldo listrado (para cima da vitrine/balcão)
  D.toldo = function (c, px, py, w, h, c1, c2) {
    const n = Math.max(4, Math.round(w / 18)), sw = w / n;
    for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? c2 : c1; c.beginPath(); c.moveTo(px + i * sw, py); c.lineTo(px + (i + 1) * sw, py); c.lineTo(px + (i + 1) * sw, py + h - 4); c.arc(px + i * sw + sw / 2, py + h - 4, sw / 2, 0, Math.PI); c.closePath(); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(px, py, w, 3); c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(px, py + h - 8, w, 2);
  };
  // pôster de promoção colorido
  D.cartazLoja = function (c, px, py, w, h, cor, linhas, cor2) {
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(px + 3, py + 4, w, h); c.fillStyle = cor; c.fillRect(px, py, w, h); c.strokeStyle = cor2 || '#fff'; c.lineWidth = 2; c.strokeRect(px + 3, py + 3, w - 6, h - 6);
    c.textAlign = 'center'; (linhas || []).forEach((l, i) => { c.fillStyle = i === 0 ? (cor2 || '#fff') : '#fff'; c.font = 'bold ' + (i === 0 ? Math.min(14, w / 6) : Math.min(11, w / 8)) + 'px Arial'; c.fillText(l, px + w / 2, py + 16 + i * 14); }); c.textAlign = 'left';
  };
})(window.G = window.G || {});
