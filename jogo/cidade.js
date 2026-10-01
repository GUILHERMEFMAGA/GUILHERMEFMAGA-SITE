/* ============================================================
   cidade.js — a cidade que CRESCE sozinha
   Os operários constroem de verdade, etapa por etapa:
     terraplanagem → fundação → estrutura → fechamento → acabamento → pronto
   Tudo depende só do "relógio da obra" (G.cidade.t), que é salvo no jogo:
   por isso a cidade continua crescendo mesmo quando você fecha e abre o jogo.
   Construímos casas, lojas, prédios, hotéis, hospital, escola, fábrica, empresas,
   shopping, um AEROPORTO e até PONTES novas. Prédios prontos viram lugares de verdade.
   ============================================================ */
(function (G) {
  'use strict';
  const W = G.world, T = W.T, TAU = Math.PI * 2;
  const C = G.cidade = { t: 0, vel: 1, lotes: W.lotes, pontes: [], eventos: [] };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rg = W.mulberry32;
  const FASES = ['TERRAPLANAGEM', 'FUNDAÇÃO', 'ESTRUTURA', 'FECHAMENTO', 'ACABAMENTO', 'PRONTO'];
  const FRAC = [0.12, 0.14, 0.32, 0.22, 0.20];                 // quanto da obra cada etapa ocupa
  const FRAC_AERO = [0.20, 0.30, 0.20, 0.15, 0.15];            // aeroporto: terraplanagem, pista, terminal, fechamento, acabamento

  // ---------- o que se constrói ----------
  const EMPRESAS = ['TECNOVALE', 'AGROFORTE', 'HORIZONTE', 'NOVA ERA', 'SOL NASCENTE', 'MEGA UNIÃO', 'BRASIL SUL', 'ALFA', 'PRIMAVERA', 'CENTRAL'];
  const TIPOS = {
    casa: { tam: 'p', and: 1, dur: [230, 320], nome: () => 'CASA NOVA', cor: '#9dff9d' },
    comercio: { tam: 'p', and: 1, dur: [270, 360], nome: null, cor: '#e0a02a' },
    predio: { tam: 'p', and: 3, dur: [380, 470], nome: r => 'EDIFÍCIO ' + EMPRESAS[Math.floor(r() * 10)], cor: '#7a8aa0' },
    escritorio: { tam: 'p', and: 2, dur: [330, 420], nome: r => 'ESCRITÓRIO ' + EMPRESAS[Math.floor(r() * 10)], cor: '#4a7ab0' },
    hotel: { tam: 'g', and: 5, dur: [640, 780], nome: r => 'HOTEL ' + ['PORTO NOVO', 'VALE VERDE', 'HORIZONTE', 'PALACE', 'DAS PALMEIRAS'][Math.floor(r() * 5)], cor: '#c05a8a' },
    hospital: { tam: 'g', and: 4, dur: [720, 860], nome: () => 'HOSPITAL SÃO LUCAS', cor: '#d9363e', extra: 'cruz' },
    escola: { tam: 'g', and: 2, dur: [520, 620], nome: () => 'ESCOLA MUNICIPAL', cor: '#e0b020', extra: 'escola' },
    fabrica: { tam: 'g', and: 2, dur: [600, 720], nome: r => 'FÁBRICA ' + EMPRESAS[Math.floor(r() * 10)], cor: '#7a6a5a', extra: 'fabrica' },
    empresa: { tam: 'g', and: 6, dur: [660, 780], nome: r => 'EMPRESA ' + EMPRESAS[Math.floor(r() * 10)], cor: '#2a8ab0', extra: 'heliponto' },
    shopping: { tam: 'g', and: 3, dur: [740, 860], nome: () => 'SHOPPING VALE VERDE', cor: '#d07a1a', extra: 'shopping' },
    aeroporto: { tam: 'a', and: 2, dur: [1000, 1000], nome: () => 'AEROPORTO VALE VERDE', cor: '#2a6ab8', extra: 'aero' }
  };
  const ROOF_P = { casa: [3, 4, 5, 6], comercio: [0, 2, 7, 1], predio: [1, 7, 1, 2], escritorio: [1, 7], hotel: [2, 1], hospital: [1], escola: [2], fabrica: [7, 0], empresa: [1], shopping: [2, 1], aeroporto: [1] };

  // ---------- cria os projetos de cada lote (sempre iguais: sementes fixas) ----------
  const ordemG = ['hotel', 'hospital', 'empresa', 'escola', 'shopping', 'fabrica', 'hotel', 'empresa'];
  let nG = 0, nLoja = 0, nHotel = 0, nCasa = 0;
  W.lotes.forEach((l, idx) => {
    const r = rg(9100 + idx * 131);
    let tipo;
    if (l.tam === 'a') tipo = 'aeroporto';
    else if (l.tam === 'g') tipo = ordemG[nG++ % ordemG.length];
    else { const q = r(); tipo = q < 0.42 ? 'casa' : q < 0.68 ? 'comercio' : q < 0.84 ? 'predio' : 'escritorio'; }
    const df = TIPOS[tipo];
    const dur = Math.round(df.dur[0] + r() * (df.dur[1] - df.dur[0]));
    const interior = l.bx >= 17 && l.bx <= 22;
    // quando a obra começa (em segundos do relógio da obra; negativo = já começou antes de você chegar)
    const u = r(), q1 = interior ? 0.30 : 0.14, q2 = interior ? 0.66 : 0.48;
    let inicio = u < q1 ? -dur * (1.05 + r() * 0.8) : u < q2 ? -dur * (0.08 + r() * 0.85) : 20 + r() * (interior ? 700 : 1500);
    if (tipo === 'aeroporto') inicio = -0.32 * dur;
    const nome = df.nome ? df.nome(r) : null;
    const p = { tipo, dur, inicio, nome, cor: df.cor, and: df.and, roof: ROOF_P[tipo][Math.floor(r() * ROOF_P[tipo].length)], seed: 9100 + idx * 131 };
    l.proj = p; l.fase = -2; l.ativo = false; l.cx = l.x + l.w / 2; l.cy = l.y + l.h / 2;
    // objeto do prédio pronto (para o telhado e a fachada de verdade)
    l.b = W.mkBuilding(l.x, l.y, l.w, l.h, p.roof, rg(p.seed + 7));
    if (tipo === 'casa') {
      const area = Math.round(l.w * l.h / (T * T));
      const c = { id: 'cn' + (nCasa++), tipo: 'casa', nome: 'CASA', b: l.b, x: l.b.x + l.b.w / 2, y: l.b.y + l.b.h + 24, r: 30, seed: p.seed, area, venda: true, preco: Math.round((1200 + area * 26) / 100) * 100, nova: true };
      l.b.casa = c; l.casa = c; p.nome = 'CASA NOVA ' + (nCasa);
    } else if (tipo === 'comercio') {
      const LJ = W.LOJAS_DEF, df2 = LJ[(nLoja++ * 5 + idx) % LJ.length];
      const nm = df2.nomes[nLoja % df2.nomes.length] + ' (NOVO)';
      const pl = { tipo: 'loja', id: 'lojaN' + idx, loja: df2.tipo, nome: nm, cor: df2.cor, horario: df2.horario, b: l.b, x: l.b.x + l.b.w / 2, y: l.b.y + l.b.h + 24, r: 34 };
      l.b.place = pl; l.place = pl; p.nome = nm;
    } else if (tipo === 'hotel') {
      const nivel = ['medio', 'luxo', 'simples'][nHotel++ % 3];
      const pl = { tipo: 'hotel', id: 'hotelN' + idx, nome: p.nome, cor: '#c05a8a', nivel, estrelas: nivel === 'luxo' ? 5 : nivel === 'medio' ? 3 : 2, b: l.b, x: l.b.x + l.b.w / 2, y: l.b.y + l.b.h + 24, r: 40 };
      l.b.place = pl; l.b.hotel = pl; l.place = pl;
    } else if (tipo === 'aeroporto') {
      const pl = { tipo: 'loja', id: 'aeroporto', loja: 'cafe', nome: p.nome, cor: '#2a6ab8', horario: [0, 24], b: l.b, x: l.b.x + l.b.w / 2, y: l.b.y + l.b.h + 24, r: 40 };
      l.b.place = pl; l.place = pl;
    }
  });

  // ---------- pontes que estão sendo construídas ----------
  C.pontes = [
    { rio: 16, j: 2, inicio: -380, dur: 1500, nome: 'PONTE NOVA ERA', fase: -1, pronta: false },
    { rio: 9, j: 6, inicio: 520, dur: 1500, nome: 'PONTE DO PROGRESSO', fase: -1, pronta: false },
    { rio: 30, j: 6, inicio: 900, dur: 1600, nome: 'PONTE DO LITORAL', fase: -1, pronta: false }
  ];
  C.pontes.forEach(pt => {
    const rv = W.blocks.find(b => b.kind === 'river' && b.bx === pt.rio);
    pt.x = rv.x; pt.w = rv.w; pt.y = W.roadTop(pt.j); pt.h = W.ROAD * T;
  });

  // ---------- estado de um lote no tempo t ----------
  // devolve { f: fase (-1 = terreno esperando, 0..4 obra, 5 pronto), p: progresso da fase (0..1), geral }
  function estadoDe(l, t) {
    const p = l.proj, dt = t - p.inicio;
    if (dt < 0) return { f: -1, p: 0, g: 0 };
    if (dt >= p.dur) return { f: 5, p: 1, g: 1 };
    const fr = p.tipo === 'aeroporto' ? FRAC_AERO : FRAC;
    let a = 0;
    for (let k = 0; k < 5; k++) { const d = fr[k] * p.dur; if (dt < a + d) return { f: k, p: (dt - a) / d, g: dt / p.dur }; a += d; }
    return { f: 5, p: 1, g: 1 };
  }
  C.estadoDe = l => estadoDe(l, C.t);
  C.faseNome = e => e.f < 0 ? 'EM BREVE' : FASES[e.f];

  // ---------- prédio pronto: desenho guardado numa imagem ----------
  function fin(l) {
    if (l.img) return l.img;
    const pad = 44, b = l.b, c = document.createElement('canvas');
    c.width = Math.ceil(b.w + pad * 2); c.height = Math.ceil(b.h + pad * 2);
    const x = c.getContext('2d'); x.translate(pad - b.x, pad - b.y);
    x.save(); x.beginPath(); x.rect(b.x - 60, b.y - 60, b.w + 160, b.h + 160); x.clip();
    x.shadowColor = 'rgba(0,0,12,0.55)'; x.shadowBlur = 16; x.shadowOffsetX = 16; x.shadowOffsetY = 18; x.fillStyle = '#000'; x.fillRect(b.x + 4, b.y + 4, b.w - 4, b.h - 4); x.restore();
    W.drawRoof(x, b);
    roofExtra(x, l);
    l.img = c; l.imgPad = pad; return c;
  }
  function roofExtra(x, l) {
    const b = l.b, p = l.proj, fh = W.fachada(b), rx = b.x + 8, ry = b.y + 8, rw = b.w - 16, rh = b.h - fh - 16, cx = b.x + b.w / 2, cy = b.y + (b.h - fh) / 2;
    const df = TIPOS[p.tipo], ex = df.extra;
    if (ex === 'cruz') { x.fillStyle = '#fff'; x.fillRect(cx - 20, cy - 20, 40, 40); x.fillStyle = '#d9242a'; x.fillRect(cx - 7, cy - 17, 14, 34); x.fillRect(cx - 17, cy - 7, 34, 14); }
    else if (ex === 'heliponto') { x.fillStyle = '#34383f'; x.beginPath(); x.arc(cx, cy, 34, 0, TAU); x.fill(); x.strokeStyle = '#ffe04a'; x.lineWidth = 3; x.stroke(); x.fillStyle = '#ffe04a'; x.font = 'bold 34px Arial'; x.textAlign = 'center'; x.fillText('H', cx, cy + 12); }
    else if (ex === 'fabrica') { for (let k = 0; k < 3; k++) { const px = rx + 22 + k * 52, py = ry + 22; x.fillStyle = '#3a3a40'; x.beginPath(); x.arc(px, py, 14, 0, TAU); x.fill(); x.fillStyle = '#5a5a62'; x.beginPath(); x.arc(px, py, 9, 0, TAU); x.fill(); x.fillStyle = '#0a0a0e'; x.beginPath(); x.arc(px, py, 5, 0, TAU); x.fill(); } x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 2; for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(rx + 6, ry + 60 + k * 16); x.lineTo(rx + rw - 6, ry + 60 + k * 16); x.stroke(); } }
    else if (ex === 'escola') { x.fillStyle = '#4a9a3a'; x.fillRect(rx + 12, ry + rh - 70, rw - 24, 58); x.strokeStyle = '#fff'; x.lineWidth = 2; x.strokeRect(rx + 16, ry + rh - 66, rw - 32, 50); x.beginPath(); x.arc(rx + rw / 2, ry + rh - 41, 9, 0, TAU); x.stroke(); x.fillStyle = '#d9242a'; x.fillRect(rx + 14, ry + 12, 3, 24); x.fillStyle = '#ffe04a'; x.fillRect(rx + 17, ry + 12, 14, 9); }
    else if (ex === 'shopping') { x.fillStyle = 'rgba(120,200,255,0.45)'; x.fillRect(rx + rw / 2 - 40, ry + 10, 80, 50); x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 2; x.strokeRect(rx + rw / 2 - 40, ry + 10, 80, 50); for (let k = 0; k < 5; k++) { x.fillStyle = '#3a3a44'; x.fillRect(rx + 8 + k * 20, ry + rh - 24, 14, 14); } }
    if (!b.place && !b.casa || ex) { // letreiro no telhado (onde não há porta de verdade)
      const nm = p.nome || ''; x.font = 'bold 11px Arial'; const tw = Math.min(rw - 6, x.measureText(nm).width + 14);
      x.fillStyle = 'rgba(10,10,20,0.62)'; x.fillRect(cx - tw / 2, b.y + b.h - fh - 24, tw, 15); x.fillStyle = '#fff'; x.textAlign = 'center';
      let fs = 11; while (fs > 5 && x.measureText(nm).width > tw - 6) { fs--; x.font = 'bold ' + fs + 'px Arial'; } x.fillText(nm, cx, b.y + b.h - fh - 13);
    }
  }

  // ---------- peças desenhadas (máquinas e operários) ----------
  function operario(ctx, x, y, ang, t, i) {
    const bob = Math.sin(t * 7 + i * 2) * 1.2;
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(2, 3, 6, 4, 0, 0, TAU); ctx.fill();
    ctx.rotate(ang);
    ctx.fillStyle = '#f0782a'; ctx.beginPath(); ctx.ellipse(0, 0, 4, 6.2, 0, 0, TAU); ctx.fill();            // colete laranja
    ctx.fillStyle = '#f2e24a'; ctx.fillRect(-4, -1, 8, 1.4);                                                 // faixa refletiva
    ctx.fillStyle = '#e0b090'; ctx.beginPath(); ctx.arc(bob * 0.3, -1, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f2d21a'; ctx.beginPath(); ctx.arc(bob * 0.3, -1.4, 3.2, Math.PI, TAU); ctx.fill();      // capacete amarelo
    ctx.strokeStyle = '#e0b090'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-3.5, 0); ctx.lineTo(-5 - bob, -5 + Math.sin(t * 9 + i) * 2); ctx.moveTo(3.5, 0); ctx.lineTo(5 + bob, -5 - Math.sin(t * 9 + i) * 2); ctx.stroke();
    ctx.restore();
  }
  function escavadeira(ctx, x, y, ang, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-9, -13, 22, 30);
    ctx.fillStyle = '#26262a'; ctx.fillRect(-11, -14, 5, 28); ctx.fillRect(6, -14, 5, 28);
    ctx.fillStyle = '#e8b81a'; ctx.fillRect(-8, -9, 16, 20); ctx.fillStyle = '#111'; ctx.fillRect(-8, 5, 16, 2);
    ctx.fillStyle = '#9ad0ee'; ctx.fillRect(-5, -7, 10, 7);
    const sw = Math.sin(t * 1.6) * 0.5;                                                                     // braço mexendo
    ctx.save(); ctx.translate(0, -9); ctx.rotate(sw);
    ctx.strokeStyle = '#d0a010'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -20); ctx.stroke();
    ctx.rotate(Math.sin(t * 2.4) * 0.5); ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, -34); ctx.stroke();
    ctx.fillStyle = '#6a6a72'; ctx.fillRect(-5, -39, 10, 7);
    ctx.restore(); ctx.restore();
  }
  function betoneira(ctx, x, y, ang, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-10, -22, 24, 48);
    ctx.fillStyle = '#e8e8ea'; ctx.fillRect(-9, -24, 18, 11); ctx.fillStyle = '#9ad0ee'; ctx.fillRect(-7, -23, 14, 4);
    ctx.fillStyle = '#d8d8dc'; ctx.beginPath(); ctx.ellipse(0, 6, 10, 20, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#f08a1e'; ctx.lineWidth = 3; for (let k = 0; k < 5; k++) { const yy = -10 + ((k * 8 + t * 14) % 40); ctx.beginPath(); ctx.moveTo(-9, yy); ctx.lineTo(9, yy + 3); ctx.stroke(); }
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, 6, 10, 20, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  function cerca(ctx, r, t) {
    ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = '#f08a1e'; ctx.strokeRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
    ctx.strokeStyle = '#fff'; ctx.setLineDash([9, 9]); ctx.strokeRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2); ctx.setLineDash([]);
    ctx.fillStyle = '#d6561a'; [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]].forEach(([a, b]) => ctx.fillRect(a - 3, b - 3, 6, 6));
    ctx.restore();
  }
  function placa(ctx, l, e) {
    const w = 94, h = 22, x = l.cx - w / 2, y = l.y + l.h - 4;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 3, y + 4, w, h);
    ctx.fillStyle = '#4a321a'; ctx.fillRect(x + 8, y + h, 3, 6); ctx.fillRect(x + w - 11, y + h, 3, 6);
    ctx.fillStyle = e.f < 0 ? '#c9a21a' : '#1f7a3a'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; let nm = (e.f < 0 ? 'EM BREVE: ' : '') + (l.proj.nome || ''), fs = 7; ctx.font = 'bold 7px Arial'; while (fs > 4 && ctx.measureText(nm).width > w - 6) { fs -= 0.5; ctx.font = 'bold ' + fs + 'px Arial'; }
    ctx.fillText(nm, x + w / 2, y + 8.5);
    ctx.font = 'bold 6px Arial'; ctx.fillStyle = '#ffe9a0'; ctx.fillText(e.f < 0 ? 'AGUARDANDO LICENÇA' : FASES[e.f] + ' ' + Math.round(e.p * 100) + '%', x + w / 2, y + 14.5);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x + 6, y + 16.5, w - 12, 3); ctx.fillStyle = '#7dff8a'; ctx.fillRect(x + 6, y + 16.5, (w - 12) * e.g, 3);
    ctx.textAlign = 'left';
  }
  function andaime(ctx, r, alt, a) {
    // andaime amarelo/cinza na frente do prédio
    ctx.save(); ctx.globalAlpha = a;
    const h = Math.max(6, alt * 26), y = r.y + r.h - h;
    ctx.strokeStyle = '#8a8d94'; ctx.lineWidth = 1.5; ctx.strokeRect(r.x - 2, y, r.w + 4, h);
    ctx.strokeStyle = '#e0b020'; ctx.lineWidth = 1;
    ctx.beginPath(); for (let xx = r.x; xx < r.x + r.w - 4; xx += 14) { ctx.moveTo(xx, y); ctx.lineTo(xx + 14, y + h); ctx.moveTo(xx + 14, y); ctx.lineTo(xx, y + h); } ctx.stroke();
    ctx.fillStyle = 'rgba(40,40,50,0.35)'; ctx.fillRect(r.x - 2, y + h, r.w + 4, 4);
    ctx.restore();
  }

  // ---------- desenho de cada fase ----------
  function pilha(ctx, x, y, r, cor) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 3, r, r * 0.8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = cor; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.25, r * 0.5, r * 0.35, 0, 0, TAU); ctx.fill(); }
  function trabalhadores(ctx, l, n, t, area) {
    for (let i = 0; i < n; i++) {
      const a = 0.35 + (i * 0.173) % 0.4, ph = i * 2.1 + l.proj.seed;
      const px = area.x + area.w * (0.5 + 0.42 * Math.sin(t * a * 0.6 + ph)), py = area.y + area.h * (0.5 + 0.42 * Math.cos(t * a * 0.5 + ph * 1.3));
      const vx = Math.cos(t * a * 0.6 + ph) * a * 0.6, vy = -Math.sin(t * a * 0.5 + ph * 1.3) * a * 0.5;
      operario(ctx, px, py, Math.atan2(vy * area.h, vx * area.w) + Math.PI / 2, t, i);
    }
  }
  function desenhaObra(ctx, l, e, t, ctxAlto) {
    const r = { x: l.x, y: l.y, w: l.w, h: l.h }, ins = { x: r.x + 8, y: r.y + 8, w: r.w - 16, h: r.h - 16 };
    const grande = l.tam === 'g', nOp = grande ? 5 : 2;
    if (e.f === -1) { cerca(ctx, r); placa(ctx, l, e); pilha(ctx, r.x + 20, r.y + 20, 8, '#7a5f3d'); return; }
    if (e.f === 0) {          // terraplanagem: terra mexida, escavadeira, montes
      ctx.fillStyle = 'rgba(70,45,22,0.35)'; for (let k = 0; k < 9; k++) ctx.fillRect(r.x + 6 + ((k * 37) % (r.w - 30)), r.y + 6 + ((k * 53) % (r.h - 20)), 22, 3);
      pilha(ctx, r.x + r.w - 20, r.y + 22, 8 + 14 * e.p * (grande ? 1.4 : 0.9), '#7a5f3d'); pilha(ctx, r.x + 22, r.y + r.h - 28, 6 + 10 * e.p, '#6a5233');
      const ex = ins.x + ins.w * (0.5 + 0.3 * Math.sin(t * 0.25 + l.proj.seed)), ey = ins.y + ins.h * (0.5 + 0.25 * Math.cos(t * 0.31 + l.proj.seed));
      escavadeira(ctx, ex, ey, Math.sin(t * 0.25 + l.proj.seed) * 0.8, t);
      trabalhadores(ctx, l, nOp, t, ins); cerca(ctx, r); placa(ctx, l, e); return;
    }
    if (e.f === 1) {          // fundação: valas escuras e concreto enchendo
      const fx = ins.x + 6, fy = ins.y + 6, fw = ins.w - 12, fh = ins.h - 12;
      ctx.fillStyle = '#3a2c1c'; ctx.fillRect(fx, fy, fw, fh);
      ctx.fillStyle = '#8e9096'; ctx.fillRect(fx + 3, fy + 3, fw - 6, (fh - 6) * e.p);
      ctx.strokeStyle = '#4a4c52'; ctx.lineWidth = 1; ctx.beginPath(); for (let xx = fx + 8; xx < fx + fw - 4; xx += 10) { ctx.moveTo(xx, fy + 3); ctx.lineTo(xx, fy + fh - 3); } ctx.stroke();
      ctx.strokeStyle = '#b05a2a'; ctx.beginPath(); for (let yy = fy + 8; yy < fy + fh - 4; yy += 14) { ctx.moveTo(fx + 3, yy); ctx.lineTo(fx + fw - 3, yy); } ctx.stroke();
      betoneira(ctx, r.x + r.w - 20, r.y + r.h - 40, Math.PI * 0.5 + 0.2, t); trabalhadores(ctx, l, nOp, t, ins); cerca(ctx, r); placa(ctx, l, e); return;
    }
    if (e.f === 2 || e.f === 3 || e.f === 4) {
      const fh = W.fachada(l.b), corpo = { x: l.b.x, y: l.b.y, w: l.b.w, h: l.b.h };
      // estrutura de concreto (sempre por baixo)
      const estr = e.f === 2 ? e.p : 1;
      ctx.fillStyle = 'rgba(0,0,12,0.35)'; ctx.fillRect(corpo.x + 6, corpo.y + 8, corpo.w, corpo.h);
      ctx.fillStyle = '#9a9ca2'; ctx.fillRect(corpo.x, corpo.y, corpo.w, corpo.h);
      const andares = Math.max(1, Math.floor(estr * l.proj.and + 0.001));
      for (let k = 1; k <= andares; k++) { ctx.fillStyle = k === andares && e.f === 2 ? '#bcbec4' : '#a8aab0'; ctx.fillRect(corpo.x - k * 1.2, corpo.y - k * 2.2, corpo.w, corpo.h); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.strokeRect(corpo.x - k * 1.2 + 0.5, corpo.y - k * 2.2 + 0.5, corpo.w - 1, corpo.h - 1); }
      const nx = Math.max(2, Math.round(corpo.w / 36)), ny = Math.max(2, Math.round(corpo.h / 36));
      for (let a = 0; a <= nx; a++) for (let b = 0; b <= ny; b++) { const px = corpo.x + 6 + (corpo.w - 18) * a / nx, py = corpo.y + 6 + (corpo.h - 18) * b / ny - andares * 2.2; ctx.fillStyle = '#5a5c62'; ctx.fillRect(px, py, 7, 7); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(px, py, 7, 1.5); }
      ctx.strokeStyle = '#6d6f76'; ctx.lineWidth = 2.5; ctx.beginPath(); for (let a = 0; a <= nx; a++) { const px = corpo.x + 9.5 + (corpo.w - 18) * a / nx; ctx.moveTo(px, corpo.y + 9 - andares * 2.2); ctx.lineTo(px, corpo.y + corpo.h - 9 - andares * 2.2); } for (let b = 0; b <= ny; b++) { const py = corpo.y + 9.5 + (corpo.h - 18) * b / ny - andares * 2.2; ctx.moveTo(corpo.x + 9, py); ctx.lineTo(corpo.x + corpo.w - 9, py); } ctx.stroke();
      if (e.f === 2) { ctx.strokeStyle = '#b05a2a'; ctx.lineWidth = 1; for (let k = 0; k < 8; k++) { const px = corpo.x + 12 + (k * 23) % (corpo.w - 24), py = corpo.y + 12 + (k * 31) % (corpo.h - 24) - andares * 2.2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 7); ctx.stroke(); } }
      if (e.f >= 3) { // paredes e telhado de verdade aparecendo
        const a = e.f === 3 ? clamp((e.p - 0.15) / 0.8, 0, 1) : 1;
        ctx.globalAlpha = a; ctx.drawImage(fin(l), l.b.x - l.imgPad, l.b.y - l.imgPad); ctx.globalAlpha = 1;
      }
      if (e.f <= 3) andaime(ctx, { x: corpo.x, y: corpo.y + corpo.h - fh - 4, w: corpo.w, h: fh + 4 }, e.f === 2 ? 0.3 + e.p * 0.7 : 1, 1);
      else andaime(ctx, { x: corpo.x, y: corpo.y + corpo.h - fh - 4, w: corpo.w, h: fh + 4 }, 1, 1 - e.p);
      if (e.f === 4) { ctx.fillStyle = 'rgba(255,255,255,' + (0.1 + 0.1 * Math.sin(t * 3)) + ')'; ctx.fillRect(corpo.x + 4, corpo.y + 4, corpo.w - 8, corpo.h - fh - 8); }
      trabalhadores(ctx, l, e.f === 4 ? 3 : nOp, t, { x: r.x - 14, y: r.y + r.h - 14, w: r.w + 28, h: 24 });
      if (e.f <= 3) cerca(ctx, { x: r.x - 3, y: r.y - 3, w: r.w + 6, h: r.h + 6 }); placa(ctx, l, e);
      if (e.f === 2 && grande) betoneira(ctx, r.x + r.w - 14, r.y + r.h + 20, 0, t);
    }
  }

  // guindaste (camada de cima): braço girando sobre a obra
  function guindaste(ctx, l, t) {
    const mx = l.x + (l.tam === 'g' ? 28 : 12), my = l.y + (l.tam === 'g' ? 28 : 12), len = Math.min(l.w, l.h) * 0.95 + 20, a = t * 0.18 + l.proj.seed;
    const draw = (ox, oy, sombra) => {
      ctx.save(); ctx.translate(mx + ox, my + oy); ctx.rotate(a);
      if (sombra) { ctx.strokeStyle = 'rgba(0,0,10,0.28)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(len, 0); ctx.stroke(); ctx.fillStyle = 'rgba(0,0,10,0.28)'; ctx.fillRect(-34, -6, 16, 12); ctx.restore(); return; }
      ctx.strokeStyle = '#e8b81a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(len, 0); ctx.stroke();
      ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let k = -24; k < len - 8; k += 10) { ctx.moveTo(k, -2.5); ctx.lineTo(k + 5, 2.5); ctx.lineTo(k + 10, -2.5); } ctx.stroke();
      ctx.fillStyle = '#6a6a72'; ctx.fillRect(-34, -6, 16, 12);                                  // contrapeso
      ctx.fillStyle = '#e8b81a'; ctx.fillRect(-6, -7, 14, 14); ctx.fillStyle = '#9ad0ee'; ctx.fillRect(-3, -5, 8, 5);     // cabine
      const hx = len * (0.55 + 0.25 * Math.sin(t * 0.4 + l.proj.seed));                         // carrinho e carga
      ctx.fillStyle = '#222'; ctx.fillRect(hx - 3, -4, 6, 8);
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx, 0); ctx.lineTo(hx, 6 + Math.sin(t * 0.8) * 2); ctx.stroke();
      ctx.fillStyle = '#b05a2a'; ctx.fillRect(hx - 6, 6 + Math.sin(t * 0.8) * 2, 12, 5);
      ctx.restore();
    };
    draw(10, 14, true); draw(0, 0, false);
    ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(mx, my, 5, 0, TAU); ctx.fill();
  }

  // ---------- aeroporto ----------
  function pistaAero(l) { const pa = l.pista; return { x: pa.x + 10, y: pa.y + 2 * T, w: pa.w - 20, h: 72 }; }
  function aviao(ctx, x, y, ang, esc, cor, alt) {
    ctx.save();
    ctx.translate(x + alt * 0.5, y + alt * 0.9); ctx.rotate(ang); ctx.scale(esc, esc); ctx.fillStyle = 'rgba(0,0,10,' + (0.32 - alt * 0.002) + ')'; // sombra no chão
    ctx.beginPath(); ctx.ellipse(0, 0, 5, 24, 0, 0, TAU); ctx.fill(); ctx.fillRect(-26, -3, 52, 7); ctx.restore();
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(esc, esc);
    ctx.fillStyle = '#f4f4f6'; ctx.beginPath(); ctx.ellipse(0, 0, 5.5, 24, 0, 0, TAU); ctx.fill();                  // fuselagem
    ctx.fillStyle = '#e4e6ec'; ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(-28, 4); ctx.lineTo(-28, 9); ctx.lineTo(-3, 5); ctx.fill(); ctx.beginPath(); ctx.moveTo(3, -4); ctx.lineTo(28, 4); ctx.lineTo(28, 9); ctx.lineTo(3, 5); ctx.fill();   // asas
    ctx.fillStyle = cor; ctx.fillRect(-7, 18, 14, 3); ctx.beginPath(); ctx.moveTo(-1, 18); ctx.lineTo(-9, 24); ctx.lineTo(9, 24); ctx.lineTo(1, 18); ctx.fill();   // cauda
    ctx.fillStyle = '#2a6ab8'; ctx.beginPath(); ctx.ellipse(0, -13, 3, 4, 0, 0, TAU); ctx.fill();                      // cabine
    ctx.strokeStyle = 'rgba(30,30,40,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -24, 1, 0, TAU); ctx.stroke();
    const ha = (performance.now ? performance.now() : 0) * 0.05; ctx.strokeStyle = 'rgba(20,20,25,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-9 * Math.cos(ha), -24 + 3 * Math.sin(ha)); ctx.lineTo(9 * Math.cos(ha), -24 - 3 * Math.sin(ha)); ctx.stroke();
    ctx.restore();
  }
  // voos como função do tempo: ciclo de 44s por avião
  function voo(l, t) {
    const rw = pistaAero(l), out = [], CIC = 44;
    for (let k = 0; k < 2; k++) {
      const ph = ((t + k * 22) % CIC) / CIC * CIC;   // 0..44
      const idx = Math.floor((t + k * 22) / CIC);
      const cor = ['#d9363e', '#2a8a4a', '#e0a02a', '#6a3fa0'][(idx + k) % 4];
      if (ph < 9) { const u = ph / 9; out.push({ k, x: rw.x + 30 + (rw.w + 120) * u * u, y: rw.y + rw.h * 0.5, ang: Math.PI / 2, esc: 1 + 0.55 * clamp(u * 1.3 - 0.3, 0, 1), alt: clamp(u * 1.4 - 0.4, 0, 1) * 90, cor, voando: u > 0.55 }); }
      else if (ph >= 22 && ph < 31) { const u = (ph - 22) / 9; out.push({ k, x: rw.x + rw.w + 100 - (rw.w + 100) * (1 - (1 - u) * (1 - u)), y: rw.y + rw.h * 0.5, ang: -Math.PI / 2, esc: 1 + 0.55 * clamp(1 - u * 1.4, 0, 1), alt: clamp(1 - u * 1.5, 0, 1) * 90, cor, voando: u < 0.3 }); }
      else out.push({ k, parado: true, x: rw.x + rw.w * (0.22 + 0.12 * k) , y: rw.y + 120 + k * 18, ang: k ? 0.3 : -0.4, esc: 1, alt: 0, cor });
    }
    return out;
  }
  function desenhaAero(ctx, l, e, t) {
    const pa = l.pista, rw = pistaAero(l), r = { x: pa.x, y: pa.y, w: pa.w, h: pa.h };
    if (e.f === -1) { cerca(ctx, { x: pa.x, y: pa.y, w: pa.w, h: pa.h + 2 * T }); placa(ctx, l, e); return; }
    ctx.fillStyle = ctx.fillStyle = '#8c6e49'; ctx.fillRect(pa.x, pa.y, pa.w, pa.h);
    ctx.fillStyle = 'rgba(70,45,22,0.35)'; for (let k = 0; k < 24; k++) ctx.fillRect(pa.x + 10 + ((k * 61) % (pa.w - 40)), pa.y + 8 + ((k * 43) % (pa.h - 20)), 30, 3);
    if (e.f === 0) { const ex = pa.x + pa.w * (0.5 + 0.4 * Math.sin(t * 0.2)); escavadeira(ctx, ex, pa.y + 70 + 40 * Math.sin(t * 0.4), Math.sin(t * 0.2) * 1.2, t); escavadeira(ctx, pa.x + pa.w * (0.5 - 0.35 * Math.cos(t * 0.17)), pa.y + 150, 2 + Math.cos(t * 0.17), t + 2); trabalhadores(ctx, l, 5, t, { x: pa.x + 10, y: pa.y + 10, w: pa.w - 20, h: pa.h - 20 }); }
    if (e.f >= 1) {
      const prog = e.f === 1 ? e.p : 1, wpx = rw.w * prog;
      ctx.fillStyle = '#2f2f36'; ctx.fillRect(rw.x, rw.y, wpx, rw.h); ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(rw.x, rw.y, wpx, 4);
      ctx.fillStyle = '#f4f4f0'; for (let xx = rw.x + 70; xx < rw.x + wpx - 30; xx += 36) ctx.fillRect(xx, rw.y + rw.h / 2 - 1.5, 20, 3);
      if (wpx > 60) { for (let k = 0; k < 6; k++) { ctx.fillRect(rw.x + 8, rw.y + 8 + k * 10, 24, 3); } }
      if (prog > 0.95) { for (let k = 0; k < 6; k++) ctx.fillRect(rw.x + rw.w - 32, rw.y + 8 + k * 10, 24, 3); ctx.save(); ctx.translate(rw.x + 48, rw.y + 38); ctx.rotate(-Math.PI / 2); ctx.font = 'bold 14px Arial'; ctx.fillText('09', -9, 5); ctx.restore(); ctx.save(); ctx.translate(rw.x + rw.w - 48, rw.y + 38); ctx.rotate(Math.PI / 2); ctx.fillText('27', -9, 5); ctx.restore(); }
      if (e.f === 1) { betoneira(ctx, rw.x + wpx, rw.y + rw.h + 24, Math.PI / 2, t); escavadeira(ctx, rw.x + wpx - 30, rw.y - 26, Math.PI / 2, t); }
      // pátio e taxiway aparecem no fim da fase 1
      const ap = e.f === 1 ? clamp((e.p - 0.55) / 0.45, 0, 1) : 1;
      if (ap > 0) { ctx.fillStyle = '#3a3a42'; ctx.fillRect(pa.x + 2.2 * T, rw.y + rw.h, 2 * T, (pa.y + pa.h - rw.y - rw.h) * ap); ctx.fillRect(pa.x + 1.0 * T, rw.y + rw.h + 70, 6 * T, 100 * ap); ctx.fillStyle = '#ffd84a'; ctx.fillRect(pa.x + 3.2 * T - 1.5, rw.y + rw.h, 3, (pa.y + pa.h - rw.y - rw.h) * ap); }
    }
    // terminal e torre
    const tr = l.torre, term = { x: l.x, y: l.y, w: l.w, h: l.h };
    if (e.f <= 4 && e.f >= 2) {
      const el = { f: e.f - 2 + 2, p: e.p, g: e.g };
      desenhaObra(ctx, l, { f: e.f === 2 ? 2 : e.f, p: e.p, g: e.g }, t);
      ctx.fillStyle = '#9a9ca2'; ctx.fillRect(tr.x, tr.y, tr.w, tr.h);
    } else if (e.f <= 1) { cerca(ctx, { x: l.x - 6, y: l.y - 6, w: l.w + 12, h: l.h + 12 }); pilha(ctx, l.x + 20, l.y + 16, 9, '#7a5f3d'); placa(ctx, l, e); }
    if (e.f >= 3) { ctx.fillStyle = '#c8c8d0'; ctx.fillRect(tr.x, tr.y, tr.w, tr.h); ctx.fillStyle = '#7ec8ee'; ctx.fillRect(tr.x - 4, tr.y - 6, tr.w + 8, 14); ctx.strokeStyle = '#fff'; ctx.strokeRect(tr.x - 3.5, tr.y - 5.5, tr.w + 7, 13); }
    if (e.f === 5) {
      ctx.drawImage(fin(l), l.b.x - l.imgPad, l.b.y - l.imgPad);
      ctx.fillStyle = '#c8c8d0'; ctx.fillRect(tr.x, tr.y, tr.w, tr.h); ctx.fillStyle = '#7ec8ee'; ctx.fillRect(tr.x - 4, tr.y - 6, tr.w + 8, 14); ctx.strokeStyle = '#fff'; ctx.strokeRect(tr.x - 3.5, tr.y - 5.5, tr.w + 7, 13);
      voo(l, t).forEach(v => { if (!v.voando) aviao(ctx, v.x, v.y, v.ang, v.esc, v.cor, v.alt); });
      // cones e luzes da pista
      for (let xx = rw.x + 10; xx < rw.x + rw.w; xx += 60) { const on = Math.floor(t * 2 + xx / 60) % 2; ctx.fillStyle = on ? '#ffe9a0' : '#8a7a40'; ctx.fillRect(xx, rw.y - 6, 3, 3); ctx.fillRect(xx, rw.y + rw.h + 3, 3, 3); }
      // biruta
      ctx.fillStyle = '#d9242a'; ctx.save(); ctx.translate(pa.x + pa.w - 14, pa.y + 14); ctx.rotate(Math.sin(t * 0.7) * 0.5); ctx.fillRect(0, -2, 22, 5); ctx.restore(); ctx.fillStyle = '#444'; ctx.fillRect(pa.x + pa.w - 16, pa.y + 12, 4, 4);
    }
  }
  function altoAero(ctx, l, e, t) {
    if (e.f !== 5) return;
    voo(l, t).forEach(v => { if (v.voando) aviao(ctx, v.x, v.y, v.ang, v.esc, v.cor, v.alt); });
  }

  // ---------- pontes em construção ----------
  function desenhaPonte(ctx, pt, t) {
    if (pt.fase < 0) return;
    const ph = pt.pronta ? 1 : pt.p, x0 = pt.x, y0 = pt.y, w = pt.w, h = pt.h;
    // pilares na água
    for (let k = 1; k < 4; k++) { const px = x0 + w * k / 4; ctx.fillStyle = 'rgba(0,0,20,0.35)'; ctx.fillRect(px - 8, y0 - 2, 16, h + 8); ctx.fillStyle = '#8a8c92'; ctx.fillRect(px - 8, y0 - 6, 16, h + 8); ctx.strokeStyle = '#fff'; ctx.globalAlpha = 0.5; ctx.strokeRect(px - 8.5, y0 - 5.5, 17, h + 7); ctx.globalAlpha = 1; }
    const lado = w / 2 * ph;
    const faixa = (xa, xb) => {
      if (xb - xa <= 1) return;
      ctx.fillStyle = 'rgba(0,0,20,0.35)'; ctx.fillRect(xa, y0 - 14, xb - xa, 14); ctx.fillRect(xa, y0 + h, xb - xa, 18);
      ctx.fillStyle = pt.pronta ? '#4a4a55' : '#9a9aa2'; ctx.fillRect(xa, y0, xb - xa, h);
      ctx.fillStyle = '#9a9aa6'; ctx.fillRect(xa, y0 - 6, xb - xa, 10); ctx.fillRect(xa, y0 + h - 4, xb - xa, 10);
      ctx.fillStyle = '#55555f'; ctx.fillRect(xa, y0 - 2, xb - xa, 4); ctx.fillRect(xa, y0 + h - 2, xb - xa, 4);
      for (let xx = xa + 8; xx < xb; xx += 32) { ctx.fillStyle = '#c8c8d2'; ctx.fillRect(xx, y0 - 6, 5, 10); ctx.fillRect(xx, y0 + h - 4, 5, 10); }
    };
    if (pt.pronta) { // ponte pronta: asfalto escuro, faixas amarelas e guarda-corpo (igual às outras)
      ctx.fillStyle = '#3a3646'; ctx.fillRect(x0, y0, w, h); ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(x0, y0, w, h);
      faixa(x0, x0 + w); ctx.fillStyle = '#f2c231'; for (let xx = x0 + 20; xx < x0 + w - 30; xx += 96) ctx.fillRect(xx, y0 + h / 2 - 3, 56, 6);
      return;
    }
    // em obras: duas metades crescendo das margens (o asfalto vem depois do concreto)
    ctx.fillStyle = '#6a6a72'; ctx.fillRect(x0, y0, lado, h); ctx.fillRect(x0 + w - lado, y0, lado, h);
    ctx.fillStyle = '#3a3646'; const asf = lado * clamp((ph - 0.6) / 0.4, 0, 1); ctx.fillRect(x0, y0, asf, h); ctx.fillRect(x0 + w - asf, y0, asf, h);
    faixa(x0, x0 + lado); faixa(x0 + w - lado, x0 + w);
    // pontas com cones, treliça e guindaste flutuante (balsa)
    [[x0 + lado, 1], [x0 + w - lado, -1]].forEach(([ex, d], i) => {
      ctx.fillStyle = '#d6561a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(ex + d * 8, y0 + 12 + k * ((h - 24) / 3), 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(ex + d * 8 - 2, y0 + 11 + k * ((h - 24) / 3), 4, 2); ctx.fillStyle = '#d6561a'; }
      ctx.save(); ctx.translate(ex + d * 30, y0 + h + 30 + i * 8); ctx.fillStyle = '#7a5a2a'; ctx.fillRect(-26, -10, 52, 20); ctx.fillStyle = '#e8b81a'; ctx.fillRect(-8, -7, 14, 14); ctx.strokeStyle = '#e8b81a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(d * 28 * Math.cos(t * 0.3), -26 - 6 * Math.sin(t * 0.3)); ctx.stroke(); ctx.restore();
      operario(ctx, ex - d * (6 + 10 * Math.sin(t + i)), y0 + h * 0.5 + 12 * Math.cos(t * 0.8 + i), Math.PI / 2 * d, t, i); operario(ctx, ex - d * 22, y0 + h * 0.3 + 6 * Math.sin(t * 0.5), -Math.PI / 2 * d, t, i + 4);
    });
    // placa
    const px = x0 + w / 2 - 50, py = y0 - 40; ctx.fillStyle = '#1f7a3a'; ctx.fillRect(px, py, 100, 22); ctx.strokeStyle = '#fff'; ctx.strokeRect(px + 0.5, py + 0.5, 99, 21); ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Arial'; ctx.textAlign = 'center'; ctx.fillText(pt.nome, px + 50, py + 9); ctx.font = 'bold 7px Arial'; ctx.fillStyle = '#ffe9a0'; ctx.fillText('OBRA DA PONTE ' + Math.round(ph * 100) + '%', px + 50, py + 18); ctx.textAlign = 'left';
  }

  // ---------- chamadas do jogo ----------
  const vis = (o, v) => o.x + (o.w || 0) > v.x0 - 60 && o.x < v.x1 + 60 && o.y + (o.h || 0) > v.y0 - 60 && o.y < v.y1 + 90;
  C.desenhar = function (ctx, S, x0, y0, x1, y1, t) {
    const v = { x0, y0, x1, y1 };
    C.pontes.forEach(pt => { if (vis(pt, v)) desenhaPonte(ctx, pt, t); });
    W.lotes.forEach(l => {
      const box = l.tam === 'a' ? { x: l.pista.x, y: l.pista.y, w: l.pista.w, h: l.pista.h + 2 * T } : l;
      if (!vis(box, v)) return;
      const e = l.est || estadoDe(l, C.t);
      if (l.tam === 'a') { desenhaAero(ctx, l, e, t); return; }
      if (e.f === 5) { ctx.drawImage(fin(l), l.b.x - l.imgPad, l.b.y - l.imgPad); return; }
      desenhaObra(ctx, l, e, t);
    });
  };
  C.desenharAlto = function (ctx, S, x0, y0, x1, y1, t) {
    const v = { x0, y0, x1, y1 };
    W.lotes.forEach(l => {
      const box = l.tam === 'a' ? { x: l.pista.x, y: l.pista.y, w: l.pista.w, h: l.pista.h + 2 * T } : l;
      if (!vis(box, v)) return;
      const e = l.est || estadoDe(l, C.t);
      if (l.tam === 'a') { altoAero(ctx, l, e, t); if (e.f >= 2 && e.f <= 3) guindaste(ctx, l, t); return; }
      if (e.f === 2 || e.f === 3) guindaste(ctx, l, t);
    });
  };

  // ---------- atualização: avança o relógio da obra e ativa o que ficou pronto ----------
  let acc = 0, salvaT = 0;
  C.atualizar = function (S, dt) {
    C.t += dt * C.vel; S.save.cidadeT = C.t;
    acc += dt; if (acc < 0.5) return; acc = 0;
    W.lotes.forEach(l => {
      const e = estadoDe(l, C.t), ant = l.fase; l.est = e; l.fase = e.f;
      if (ant !== -2 && e.f !== ant) C.evento('fase', l, e);
      if (e.f === 5 && !l.ativo) ativar(S, l);
    });
    C.pontes.forEach(pt => {
      const dt2 = C.t - pt.inicio; pt.p = clamp(dt2 / pt.dur, 0, 1); const ant = pt.fase;
      pt.fase = dt2 < 0 ? -1 : pt.p >= 1 ? 5 : 2;
      if (pt.fase === 5 && !pt.pronta) concluirPonte(S, pt); else if (ant === -1 && pt.fase === 2) C.evento('pontecomeca', pt);
    });
    salvaT += 0.5; if (salvaT > 30) { salvaT = 0; if (G.save) G.save(); }
  };
  function ativar(S, l) {
    l.ativo = true;
    if (!l.b.janelaOk) { l.b.janelaOk = true; W.buildings.push(l.b); }
    const pl = l.place;
    if (l.casa) { W.casas.push(l.casa); }
    else if (pl) { W.places.push(pl); if (pl.tipo === 'loja') W.lojas.push(pl); }
    if (l.proj.tipo === 'aeroporto') { const tr = l.torre; }
    if (C.carregado) C.evento('pronto', l, l.est);
  }
  function concluirPonte(S, pt) {
    pt.pronta = true;
    const tx = Math.round(pt.x / T), ty = Math.round(pt.y / T), bw = Math.round(pt.w / T), bh = W.ROAD;
    for (let y = ty; y < ty + bh; y++) for (let x = tx; x < tx + bw; x++) W.tiles[y * W.TW + x] = W.TILE.BRIDGE;
    if (!Array.isArray(W.PONTES[pt.rio])) W.PONTES[pt.rio] = [W.PONTES[pt.rio]];
    W.PONTES[pt.rio].push(pt.j);
    if (C.carregado) C.evento('ponte', pt);
  }
  C.evento = function (tipo, o, e) {
    const reg = C.regiaoDe(o.cx != null ? o.cx : o.x + o.w / 2, o.cy != null ? o.cy : o.y + o.h / 2);
    const ev = { tipo, t: C.t, reg: reg.nome };
    if (tipo === 'fase') { ev.msg = (o.proj.nome || o.proj.tipo) + ' — ' + C.faseNome(e); ev.lote = o.id; }
    else if (tipo === 'pronto') { ev.msg = 'OBRA CONCLUÍDA: ' + (o.proj.nome || o.proj.tipo) + ' (' + reg.nome + ')'; ev.lote = o.id; if (G.say && !(G.S && G.S.inside)) G.say('Nova obra concluída: ' + o.proj.nome + ' em ' + reg.nome + '!', 5); }
    else if (tipo === 'ponte') { ev.msg = 'PONTE INAUGURADA: ' + o.nome; if (G.say) G.say('A ' + o.nome + ' foi inaugurada! Agora tem mais um caminho entre as margens (com pedágio).', 6); }
    else if (tipo === 'pontecomeca') { ev.msg = 'COMEÇOU A OBRA: ' + o.nome; }
    C.eventos.push(ev); if (C.eventos.length > 120) C.eventos.shift();
    if (G.olho && G.olho.obra) G.olho.obra(ev);
  };
  C.regiaoDe = function (x, y) {
    const bx = Math.floor((x / T - W.MG - W.ROAD) / W.PITCH + 0.02);
    return W.CIDADES.find(c => bx < c.ate) || W.CIDADES[0];
  };
  // acelera o tempo da obra (modo observador / testes)
  C.acelerar = function (seg) { C.t += seg; };
  C.resumo = function () {
    const r = { prontas: 0, emObra: 0, aguardando: 0, porTipo: {} };
    W.lotes.forEach(l => { const e = l.est || estadoDe(l, C.t); if (e.f === 5) r.prontas++; else if (e.f >= 0) r.emObra++; else r.aguardando++; r.porTipo[l.proj.tipo] = (r.porTipo[l.proj.tipo] || 0) + 1; });
    return r;
  };
  // chamado quando o jogo carrega o save
  C.carregar = function (S) {
    C.t = S.save.cidadeT || 0;
    W.lotes.forEach(l => { const e = estadoDe(l, C.t); l.est = e; l.fase = e.f; if (e.f === 5 && !l.ativo) ativar(S, l); });
    C.pontes.forEach(pt => { const d = C.t - pt.inicio; pt.p = clamp(d / pt.dur, 0, 1); pt.fase = d < 0 ? -1 : pt.p >= 1 ? 5 : 2; if (pt.fase === 5 && !pt.pronta) concluirPonte(S, pt); });
    C.carregado = true;
  };
  C.zerar = function () { C.t = 0; };
})(window.G = window.G || {});
