/* =====================================================================
   MOBILIA.JS — móveis de CASA com formas de verdade (nada de caixa lisa!)
   Sofá com almofadas, cama com travesseiros e cobertor, TV com brilho,
   geladeira, fogão com panela, pia, armário, plantas, tapetes, banheiro...
   Mesmos nomes de objeto de sempre (sofa, tv, cama2...): o jogo não muda,
   só o desenho. Cada móvel é pintado uma vez e guardado (veja D.est).
   Convenção: o.x,o.y,o.w,o.h = pegada no chão; o.e = altura.
   ===================================================================== */
(function (G) {
  'use strict';
  const L = G.lugares, K = L.kit, D = G.deco, TAU = Math.PI * 2;
  const shade = K.shade, hh = K.hh, rr = D.rr, mix = D.mix, rgba = D.rgba, rng = D.rng;
  const reg = D.reg, caixa = D.caixa, sombra = D.sombra;

  // ---------- peças pequenas ----------
  const puxador = (c, x, y, w, h, cor) => { c.fillStyle = 'rgba(0,0,0,0.35)'; rr(c, x + 1, y + 1.5, w, h, 1.5); c.fill(); c.fillStyle = cor || '#d8c890'; rr(c, x, y, w, h, 1.5); c.fill(); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(x + 0.5, y + 0.5, Math.max(1, w - 1), 1); };
  const painel = (c, x, y, w, h, cor, r) => { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, shade(cor, 0.1)); g.addColorStop(1, shade(cor, -0.12)); c.fillStyle = g; rr(c, x, y, w, h, r == null ? 2 : r); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.38)'; c.lineWidth = 1; rr(c, x + 0.5, y + 0.5, w - 1, h - 1, r == null ? 2 : r); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(x + 2, y + 1, w - 4, 1); };
  const folha = (c, x, y, rx, ry, ang, cor) => {
    c.save(); c.translate(x, y); c.rotate(ang);
    const g = c.createLinearGradient(-rx, 0, rx, 0); g.addColorStop(0, shade(cor, -0.18)); g.addColorStop(0.5, shade(cor, 0.1)); g.addColorStop(1, shade(cor, -0.28));
    c.fillStyle = g; c.beginPath(); c.moveTo(0, ry); c.quadraticCurveTo(rx * 1.5, 0, 0, -ry); c.quadraticCurveTo(-rx * 1.5, 0, 0, ry); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.28)'; c.lineWidth = 0.8; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(0, ry * 0.85); c.lineTo(0, -ry * 0.8); c.stroke();
    c.restore();
  };

  // ======================= SOFÁ e POLTRONA =======================
  // dir 'n' = olha para o norte (vemos as costas), 's' = olha para o sul (vemos a frente)
  function sofa(c, o) {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 18, cor = o.cor || '#a8483a', cor2 = o.cor2 || '#e8c870', solo = w < 80;
    const A = solo ? 11 : Math.min(15, w * 0.1), db = Math.max(13, h * 0.3), hs = 10, ha = hs + 10, hb = Math.max(e + 8, 26);
    const top = shade(cor, 0.12), fr = cor, opc = { r: 6, semSombra: true };
    const frente = o.dir === 's';
    sombra(c, x, y, w, h, { dx: 4, dy: 8, r: 9 });
    const n = Math.max(1, Math.round((w - 2 * A) / 48)), cw = (w - 2 * A) / n;
    const encosto = () => {
      const by = frente ? y : y + h - db;
      caixa(c, x + A - 2, by, w - 2 * A + 4, db, hb, shade(cor, 0.18), shade(cor, -0.04), opc);
      c.strokeStyle = 'rgba(0,0,0,0.26)'; c.lineWidth = 1;
      const fy0 = by + db - hb + 2, fy1 = by + db - 1;
      for (let i = 1; i < n; i++) { const sx = x + A + i * cw; c.beginPath(); c.moveTo(sx, fy0); c.lineTo(sx, fy1); c.stroke(); }
      if (!frente) { c.fillStyle = 'rgba(255,255,255,0.1)'; for (let i = 0; i < n; i++) { rr(c, x + A + i * cw + 4, fy0 + 4, cw - 8, hb * 0.34, 5); c.fill(); } }
    };
    const assento = () => {
      for (let i = 0; i < n; i++) {
        const sx = x + A + i * cw + 0.5, sy = frente ? y + db : y, sh = h - db;
        caixa(c, sx, sy, cw - 1, sh, hs, shade(top, 0.06), fr, opc);
        const cy0 = sy - hs;   // topo da almofada
        c.strokeStyle = 'rgba(0,0,0,0.16)'; c.lineWidth = 1; rr(c, sx + 3, cy0 + 3, cw - 7, sh - 6, 5); c.stroke();
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.arc(sx + cw / 2, cy0 + sh / 2, 1.3, 0, TAU); c.fill();   // botão
      }
    };
    const bracos = () => { caixa(c, x, y, A, h, ha, shade(cor, 0.2), cor, opc); caixa(c, x + w - A, y, A, h, ha, shade(cor, 0.2), cor, opc); };
    if (frente) { encosto(); assento(); bracos(); } else { assento(); bracos(); encosto(); }
    // almofadas de enfeite
    const almofada = (px, py, ang, cc) => { c.save(); c.translate(px, py); c.rotate(ang); c.fillStyle = 'rgba(0,0,0,0.25)'; rr(c, -8, -6, 17, 17, 5); c.fill(); const g = c.createLinearGradient(-9, -9, 9, 9); g.addColorStop(0, shade(cc, 0.22)); g.addColorStop(1, shade(cc, -0.15)); c.fillStyle = g; rr(c, -9, -9, 18, 18, 5); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 1; rr(c, -8.5, -8.5, 17, 17, 5); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.moveTo(-6, -6); c.lineTo(6, 6); c.stroke(); c.restore(); };
    if (!solo && o.almofadas !== false) { const py = frente ? y + db + 6 - hs : y + 6 - hs + 4; almofada(x + A + 12, py, -0.25, cor2); almofada(x + w - A - 12, py, 0.3, shade(cor2, -0.2)); }
    else if (solo) almofada(x + w / 2, (frente ? y + db + 6 : y + 6) - hs, 0.2, cor2);
    // cobertor jogado (só em sofás grandes e quando pedir)
    if (o.manta) { c.fillStyle = o.manta; c.beginPath(); c.moveTo(x + w - A - 38, y + (frente ? db : 0) - hs + 2); c.lineTo(x + w - A - 4, y + (frente ? db : 0) - hs + 2); c.quadraticCurveTo(x + w - A + 2, y + h - hs, x + w - A - 8, y + h - hs + 2); c.lineTo(x + w - A - 30, y + h - hs - 4); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.stroke(); }
  }
  reg('sofa', sofa, { alto: 30 });
  reg('poltrona', (c, o) => sofa(c, Object.assign({}, o, { almofadas: false })), { alto: 30 });

  // ======================= TV com móvel =======================
  reg('tv', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, hc = 18, madeira = o.top || '#7a5a3c', fr = o.front || '#4a3220';
    caixa(c, x, y, w, h, hc, shade(madeira, 0.05), fr, { r: 3 });
    const fy = y + h - hc, sec = w > 150 ? 4 : 3, sw = (w - 8) / sec;
    for (let i = 0; i < sec; i++) { painel(c, x + 4 + i * sw, fy + 3, sw - 3, hc - 7, shade(fr, 0.1), 2); puxador(c, x + 4 + i * sw + (sw - 3) / 2 - 3, fy + hc / 2 - 1, 6, 2.4, '#d8c890'); }
    // objetos em cima do móvel
    const ty = y - hc;
    c.fillStyle = '#16181e'; rr(c, x + 8, ty + h * 0.55, 22, 6, 1.5); c.fill(); c.fillStyle = '#4ae08a'; c.fillRect(x + 24, ty + h * 0.55 + 2, 3, 2);
    c.fillStyle = '#b8683a'; c.fillRect(x + w - 24, ty + h * 0.45, 11, 9); c.fillStyle = '#2f8a3c'; c.beginPath(); c.arc(x + w - 18.5, ty + h * 0.45 - 1, 7, Math.PI, 0); c.fill(); c.beginPath(); c.arc(x + w - 22, ty + h * 0.45 - 3, 4, Math.PI, 0); c.fill();
    // a TV (de frente, em pé sobre o móvel)
    const sw2 = Math.min(w * 0.7, 120), sx = x + (w - sw2) / 2, yb = ty + h * 0.62, sh = Math.round(sw2 * 0.5);
    c.fillStyle = 'rgba(0,0,0,0.3)'; rr(c, sx + 3, yb - sh + 4, sw2, sh, 3); c.fill();
    c.fillStyle = '#2a2d36'; rr(c, sx + w * 0.0, yb - 3, sw2 * 0.34, 3, 1); c.fill();
    c.fillStyle = '#1a1c22'; c.fillRect(x + w / 2 - 14, yb - 4, 28, 4);
    c.fillStyle = '#0c0d12'; rr(c, sx - 1, yb - sh - 1, sw2 + 2, sh + 2, 3); c.fill(); c.strokeStyle = '#3a3e48'; c.lineWidth = 1; rr(c, sx - 0.5, yb - sh - 0.5, sw2 + 1, sh + 1, 3); c.stroke();
  }, {
    alto: 80, din(ctx, o, t) {
      const w = o.w, hc = 18, ty = o.y - hc, sw2 = Math.min(w * 0.7, 120), sx = o.x + (w - sw2) / 2, yb = ty + o.h * 0.62, sh = Math.round(sw2 * 0.5);
      const hue = (t * 22 + o.x) % 360, f = 0.5 + 0.5 * Math.sin(t * 3 + o.x);
      ctx.save(); ctx.beginPath(); rr(ctx, sx + 2, yb - sh + 2, sw2 - 4, sh - 4, 2); ctx.clip();
      const g = ctx.createLinearGradient(sx, yb - sh, sx + sw2, yb); g.addColorStop(0, 'hsl(' + hue + ',62%,48%)'); g.addColorStop(1, 'hsl(' + ((hue + 80) % 360) + ',60%,28%)'); ctx.fillStyle = g; ctx.fillRect(sx, yb - sh, sw2, sh);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(sx + sw2 * 0.12, yb - sh * 0.42, sw2 * 0.34, 3); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(sx, yb - 9, sw2, 9);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.1 + 0.05 * f) + ')'; ctx.beginPath(); ctx.moveTo(sx, yb - sh); ctx.lineTo(sx + sw2 * 0.5, yb - sh); ctx.lineTo(sx, yb - sh * 0.3); ctx.fill();
      ctx.restore();
      // brilho no chão
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(o.x + w / 2, o.y + o.h + 40, 6, o.x + w / 2, o.y + o.h + 40, 120); gr.addColorStop(0, 'hsla(' + hue + ',70%,60%,' + (0.13 + 0.04 * f) + ')'); gr.addColorStop(1, 'hsla(' + hue + ',70%,50%,0)'); ctx.fillStyle = gr; ctx.fillRect(o.x + w / 2 - 130, o.y + o.h - 20, 260, 170); ctx.restore();
    }
  });

  // ======================= COZINHA =======================
  reg('geladeira', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 56, cor = o.cor || '#dfe4ea';
    caixa(c, x, y, w, h, e, shade(cor, 0.12), cor, { r: 4 });
    const fy = y + h - e, fz = e * 0.34;
    const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.16)'); c.fillStyle = g; c.fillRect(x + 1, fy, w - 2, e - 1);
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(x + 1, fy + fz, w - 2, 1.8); c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(x + 1, fy + fz + 1.8, w - 2, 1);
    c.fillStyle = '#7a8088'; rr(c, x + w - 9, fy + 5, 3, fz - 9, 1.5); c.fill(); rr(c, x + w - 9, fy + fz + 7, 3, e - fz - 18, 1.5); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(x + w - 8.5, fy + 6, 1, fz - 11);
    // ímãs e bilhete
    c.fillStyle = '#f4efe0'; c.fillRect(x + 7, fy + fz + 10, 11, 14); c.fillStyle = 'rgba(0,0,0,0.3)'; for (let k = 0; k < 4; k++) c.fillRect(x + 9, fy + fz + 13 + k * 3, 7, 1);
    c.fillStyle = '#e8505a'; c.beginPath(); c.arc(x + 12.5, fy + fz + 10, 2.4, 0, TAU); c.fill(); c.fillStyle = '#4aa0e0'; c.fillRect(x + 22, fy + fz + 20, 6, 6); c.fillStyle = '#f2d84a'; c.beginPath(); c.arc(x + 25, fy + fz + 32, 2.6, 0, TAU); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(x + 4, y + h - 5, w - 8, 3);
    // coisas em cima
    c.fillStyle = '#c8a060'; rr(c, x + 6, y - e + 8, 20, 14, 3); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.stroke(); c.fillStyle = '#e8402a'; c.beginPath(); c.arc(x + 14, y - e + 14, 4, 0, TAU); c.fill();
  }, { alto: 20 });

  reg('fogao', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 30, ty = y - e;
    caixa(c, x, y, w, h, e, '#d4d8de', '#b4b9c1', { r: 3 });
    // bocas com grelha
    [[0.27, 0.3], [0.73, 0.3], [0.27, 0.72], [0.73, 0.72]].forEach(([a, b], i) => {
      const bx = x + w * a, by = ty + h * b;
      c.fillStyle = '#16181e'; c.beginPath(); c.arc(bx, by, 7, 0, TAU); c.fill(); c.strokeStyle = '#6a707a'; c.lineWidth = 1.2; c.beginPath(); c.arc(bx, by, 5, 0, TAU); c.stroke();
      c.strokeStyle = '#2a2d36'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(bx - 7, by); c.lineTo(bx + 7, by); c.moveTo(bx, by - 7); c.lineTo(bx, by + 7); c.stroke();
    });
    // panela com tampa
    const px = x + w * 0.27, py = ty + h * 0.3;
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(px + 3, py + 5, 10, 6, 0, 0, TAU); c.fill();
    c.fillStyle = '#7a8088'; rr(c, px - 9, py - 8, 18, 14, 3); c.fill(); const gp = c.createLinearGradient(px - 9, 0, px + 9, 0); gp.addColorStop(0, 'rgba(255,255,255,0.4)'); gp.addColorStop(1, 'rgba(0,0,0,0.25)'); c.fillStyle = gp; rr(c, px - 9, py - 8, 18, 14, 3); c.fill();
    c.fillStyle = '#b8bec6'; c.beginPath(); c.ellipse(px, py - 9, 9.5, 5, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.4)'; c.stroke(); c.fillStyle = '#2a2d36'; c.beginPath(); c.arc(px, py - 10, 2, 0, TAU); c.fill(); c.fillRect(px + 9, py - 6, 8, 3);
    // frente: botões e porta do forno
    const fy = y + h - e;
    [0.18, 0.39, 0.61, 0.82].forEach(a => { c.fillStyle = '#16181e'; c.beginPath(); c.arc(x + w * a, fy + 4.5, 2.6, 0, TAU); c.fill(); c.fillStyle = '#d0d4da'; c.fillRect(x + w * a - 0.5, fy + 2, 1, 2.5); });
    painel(c, x + 4, fy + 10, w - 8, e - 15, '#2a2d36', 2);
    const og = c.createLinearGradient(0, fy + 13, 0, fy + e - 8); og.addColorStop(0, '#0e1016'); og.addColorStop(1, '#2a3040'); c.fillStyle = og; rr(c, x + 8, fy + 15, w - 16, e - 24, 2); c.fill(); c.fillStyle = 'rgba(255,255,255,0.14)'; c.beginPath(); c.moveTo(x + 8, fy + 15); c.lineTo(x + w * 0.5, fy + 15); c.lineTo(x + 8, fy + e * 0.65); c.fill();
    puxador(c, x + 8, fy + 11.5, w - 16, 2.6, '#c8ccd4');
  }, {
    alto: 30, din(ctx, o, t) {
      const x = o.x, ty = o.y - (o.e || 30), w = o.w, h = o.h;
      if (o.ligado) { [[0.73, 0.3], [0.27, 0.72], [0.73, 0.72]].forEach(([a, b], i) => { ctx.fillStyle = 'rgba(90,170,255,' + (0.7 + 0.3 * Math.sin(t * 10 + i * 2)) + ')'; ctx.beginPath(); ctx.arc(x + w * a, ty + h * b, 3.2, 0, TAU); ctx.fill(); }); }
      const px = x + w * 0.27, py = ty + h * 0.3 - 12;
      ctx.save(); ctx.globalAlpha = 0.4; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++) { const ph = (t * 0.8 + k * 0.33) % 1; ctx.globalAlpha = 0.4 * (1 - ph); ctx.beginPath(); ctx.moveTo(px - 3 + k * 3, py - ph * 18); ctx.quadraticCurveTo(px + 3 + k * 3, py - ph * 18 - 5, px - 1 + k * 3, py - ph * 18 - 10); ctx.stroke(); } ctx.restore();
    }
  });

  reg('pia', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 30, ty = y - e, madeira = o.front || '#8a6a4a';
    caixa(c, x, y, w, h, e, o.top || '#dcd8d0', madeira, { r: 3 });
    // granito
    const r = rng(x * 3 + y); for (let k = 0; k < 40; k++) { c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.3)'; c.fillRect(x + 3 + r() * (w - 6), ty + 2 + r() * (h - 4), 1.5, 1.5); }
    // cubas
    const bw = w * 0.34;
    [[x + 7, bw], [x + 7 + bw + 5, bw * 0.7]].forEach(([bx, ww], i) => { c.fillStyle = 'rgba(0,0,0,0.3)'; rr(c, bx, ty + 5, ww, h - 10, 5); c.fill(); const g = c.createLinearGradient(bx, ty, bx + ww, ty + h); g.addColorStop(0, '#d4dae0'); g.addColorStop(1, '#8a929c'); c.fillStyle = g; rr(c, bx + 1, ty + 6, ww - 2, h - 13, 4); c.fill(); c.fillStyle = '#4a5058'; c.beginPath(); c.arc(bx + ww / 2, ty + h / 2 + 1, 2, 0, TAU); c.fill(); });
    // torneira
    const tx = x + 7 + bw + 2.5; c.fillStyle = '#c8ccd4'; c.beginPath(); c.arc(tx, ty + 4, 3.4, 0, TAU); c.fill(); c.strokeStyle = '#8a9099'; c.lineWidth = 2; c.beginPath(); c.moveTo(tx, ty + 4); c.quadraticCurveTo(tx, ty + 14, tx - 6, ty + 12); c.stroke();
    // escorredor de louça
    const ex = x + w - 22; c.fillStyle = '#b8bec6'; rr(c, ex, ty + 5, 16, h - 10, 2); c.fill(); for (let k = 0; k < 3; k++) { c.fillStyle = '#f4f4f0'; c.beginPath(); c.ellipse(ex + 4 + k * 4, ty + 15, 1.8, 7, 0, 0, TAU); c.fill(); }
    // portas do armário
    const fy = y + h - e, n = Math.max(2, Math.round(w / 34)), dw = (w - 8) / n;
    for (let i = 0; i < n; i++) { painel(c, x + 4 + i * dw, fy + 4, dw - 2.5, e - 9, shade(madeira, 0.08), 2); puxador(c, x + 4 + i * dw + dw - 9, fy + 6, 2.4, 7, '#d8c890'); }
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(x + 2, y + h - 3, w - 4, 3);
  }, { alto: 20 });

  // ======================= QUARTO =======================
  reg('cama2', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, cor = o.cor || '#4a78c8', solteiro = w < 100;
    const hs = 10, hm = 12;   // altura da base e do colchão
    sombra(c, x - 2, y - 6, w + 4, h + 6, { dx: 5, dy: 8, r: 6 });
    // cabeceira (alta, junto à parede)
    const hc = 34; const g0 = c.createLinearGradient(0, y - hc - 6, 0, y); g0.addColorStop(0, shade('#6a4a2a', 0.2)); g0.addColorStop(1, shade('#6a4a2a', -0.15));
    c.fillStyle = g0; rr(c, x - 3, y - hc - 6, w + 6, hc + 10, 5); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 1; rr(c, x - 2.5, y - hc - 5.5, w + 5, hc + 9, 5); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,0.2)'; rr(c, x + 3, y - hc, w - 6, hc - 6, 4); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x, y - hc - 5, w, 1.6);
    // base e colchão
    caixa(c, x, y, w, h, hs, '#5a3e24', '#3a2814', { r: 3, semSombra: true });
    const my = y - hs;
    const gm = c.createLinearGradient(0, my, 0, my + h); gm.addColorStop(0, '#f6f2ea'); gm.addColorStop(1, '#ddd6c8'); c.fillStyle = gm; rr(c, x + 1, my - 2, w - 2, h + 2, 5); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(x + 1, my + h - 2, w - 2, 2);
    // cobertor
    const cy0 = my + h * 0.34;
    const gc = c.createLinearGradient(0, cy0, 0, my + h + 2); gc.addColorStop(0, shade(cor, 0.1)); gc.addColorStop(1, shade(cor, -0.18));
    c.fillStyle = gc; c.beginPath(); c.moveTo(x - 1, cy0 + 3); c.quadraticCurveTo(x + w / 2, cy0 - 4, x + w + 1, cy0 + 3); c.lineTo(x + w + 1, my + h + 5); c.quadraticCurveTo(x + w / 2, my + h + 9, x - 1, my + h + 5); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 1; c.stroke();
    // dobra do lençol
    c.fillStyle = '#fbf8f0'; c.beginPath(); c.moveTo(x - 1, cy0 + 3); c.quadraticCurveTo(x + w / 2, cy0 - 4, x + w + 1, cy0 + 3); c.lineTo(x + w + 1, cy0 + 11); c.quadraticCurveTo(x + w / 2, cy0 + 3, x - 1, cy0 + 11); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.2)'; c.stroke();
    // padrão do cobertor
    c.save(); c.beginPath(); c.moveTo(x, cy0 + 12); c.lineTo(x + w, cy0 + 12); c.lineTo(x + w, my + h + 4); c.lineTo(x, my + h + 4); c.closePath(); c.clip();
    if (o.padrao === 'listras') { c.fillStyle = 'rgba(255,255,255,0.22)'; for (let k = x + 6; k < x + w; k += 14) c.fillRect(k, cy0, 6, h); }
    else { c.fillStyle = 'rgba(255,255,255,0.14)'; for (let j = cy0 + 18; j < my + h; j += 12) for (let i = x + 8 + ((j / 12) % 2) * 7; i < x + w; i += 14) { c.beginPath(); c.moveTo(i, j - 3); c.lineTo(i + 3, j); c.lineTo(i, j + 3); c.lineTo(i - 3, j); c.fill(); } }
    c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + w * 0.2, cy0 + 14); c.quadraticCurveTo(x + w * 0.3, cy0 + 28, x + w * 0.18, cy0 + 42); c.moveTo(x + w * 0.7, cy0 + 16); c.quadraticCurveTo(x + w * 0.62, cy0 + 30, x + w * 0.76, cy0 + 44); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.1)'; c.beginPath(); c.ellipse(x + w * 0.4, cy0 + 24, w * 0.18, 9, -0.3, 0, TAU); c.fill();
    c.restore();
    // travesseiros
    const trav = (px, py, pw) => { c.fillStyle = 'rgba(0,0,0,0.2)'; rr(c, px + 1.5, py + 3, pw, 20, 8); c.fill(); const g = c.createLinearGradient(px, py, px + pw, py + 20); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d8d2c4'); c.fillStyle = g; rr(c, px, py, pw, 20, 8); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1; rr(c, px + 0.5, py + 0.5, pw - 1, 19, 8); c.stroke(); c.strokeStyle = 'rgba(0,0,0,0.1)'; c.beginPath(); c.moveTo(px + 6, py + 10); c.quadraticCurveTo(px + pw / 2, py + 14, px + pw - 6, py + 10); c.stroke(); };
    if (solteiro) trav(x + 6, my - 1, w - 12); else { trav(x + 6, my - 1, w / 2 - 9); trav(x + w / 2 + 3, my - 1, w / 2 - 9); }
    // pés/frente da base
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x + 3, y + h - 2, w - 6, 2);
  }, { alto: 50 });

  // mesa de cabeceira / cômoda / aparador genérico (o antigo 'bloco')
  reg('bloco', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 20, madeira = o.front || '#5a3a22', ty = y - e;
    caixa(c, x, y, w, h, e, o.top || '#7a5230', madeira, { r: 2 });
    const fy = y + h - e, n = w > 60 ? 3 : w > 44 ? 2 : 1, dw = (w - 4) / n, gav = e > 24 && w > 40;
    for (let i = 0; i < n; i++) { painel(c, x + 2 + i * dw, fy + 2, dw - 2, e - 5, shade(madeira, 0.1), 1.5); puxador(c, x + 2 + i * dw + (dw - 2) / 2 - 3, fy + e / 2 - 1, 6, 2.2, '#d8c890'); }
    // objeto em cima: abajur, foto ou planta
    const v = o.variante || ['abajur', 'foto', 'vaso'][(hh(x, y) * 3) | 0];
    if (v === 'abajur') { c.fillStyle = '#3a2a1c'; c.fillRect(x + w / 2 - 1.5, ty + h / 2 - 8, 3, 8); c.fillStyle = '#f4e4b8'; c.beginPath(); c.moveTo(x + w / 2 - 6, ty + h / 2 - 8); c.lineTo(x + w / 2 + 6, ty + h / 2 - 8); c.lineTo(x + w / 2 + 4, ty + h / 2 - 17); c.lineTo(x + w / 2 - 4, ty + h / 2 - 17); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.stroke(); }
    else if (v === 'foto') { c.fillStyle = '#d8b878'; c.fillRect(x + w / 2 - 6, ty + h / 2 - 12, 12, 14); c.fillStyle = '#cfe2f0'; c.fillRect(x + w / 2 - 4, ty + h / 2 - 10, 8, 10); c.fillStyle = '#e8c8a0'; c.beginPath(); c.arc(x + w / 2, ty + h / 2 - 6, 2, 0, TAU); c.fill(); }
    else { c.fillStyle = '#e8e2d6'; c.fillRect(x + w / 2 - 4, ty + h / 2 - 5, 8, 7); c.fillStyle = '#2f8a3c'; c.beginPath(); c.arc(x + w / 2, ty + h / 2 - 9, 6, 0, TAU); c.fill(); c.fillStyle = '#e84a6a'; c.beginPath(); c.arc(x + w / 2 + 2, ty + h / 2 - 11, 2, 0, TAU); c.fill(); }
  }, { alto: 24 });
  K.novos.criado = K.novos.bloco;

  reg('armario', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 64, porta = o.front || '#8a5e3a';
    caixa(c, x, y, w, h, e, o.top || '#6a4a2e', shade(porta, -0.12), { r: 2 });
    const fy = y + h - e, n = Math.max(2, Math.round(w / 40)), dw = (w - 6) / n;
    for (let i = 0; i < n; i++) {
      const px = x + 3 + i * dw;
      painel(c, px, fy + 4, dw - 2, e - 9, porta, 2);
      painel(c, px + 4, fy + 9, dw - 10, (e - 20) * 0.5, shade(porta, -0.06), 1.5); painel(c, px + 4, fy + 12 + (e - 20) * 0.5, dw - 10, (e - 20) * 0.5 - 4, shade(porta, -0.06), 1.5);
      puxador(c, px + (i % 2 ? 3 : dw - 9), fy + e * 0.45, 3, 10, '#e8d8a0');
    }
    if (o.espelho) { const g = c.createLinearGradient(x, fy, x + w, fy + e); g.addColorStop(0, '#cfe2ee'); g.addColorStop(1, '#8aa4b8'); c.fillStyle = g; rr(c, x + 6 + (n - 1) * dw, fy + 8, dw - 12, e - 18, 2); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x, y - e + 1, w, 1.6); c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(x + 2, y + h - 4, w - 4, 3);
    // mala em cima
    const ty = y - e; c.fillStyle = '#3a4a6a'; rr(c, x + 8, ty + h * 0.2, Math.min(40, w * 0.35), h * 0.55, 3); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.4)'; c.stroke(); c.fillStyle = '#c8ccd4'; c.fillRect(x + 12, ty + h * 0.2 + 2, Math.min(32, w * 0.35 - 8), 2);
    c.fillStyle = '#c8a060'; rr(c, x + w - 34, ty + h * 0.25, 24, h * 0.45, 2); c.fill(); c.stroke();
  }, { alto: 30 });

  reg('cofre', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 40, fy = y + h - e;
    caixa(c, x, y, w, h, e, '#4a4e58', '#2c2f38', { r: 3 });
    // porta do cofre
    const px = x + 4, pw = w - 8, ph = e - 8;
    const g = c.createLinearGradient(px, fy, px + pw, fy + ph); g.addColorStop(0, '#5a5e68'); g.addColorStop(1, '#2a2d36'); c.fillStyle = g; rr(c, px, fy + 4, pw, ph, 3); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 1.5; c.stroke();
    if (o.aberto) { c.fillStyle = '#0a0a0e'; rr(c, px + 3, fy + 7, pw - 6, ph - 6, 2); c.fill(); c.fillStyle = '#4a9a4a'; for (let k = 0; k < 3; k++) { c.fillRect(px + 6 + k * 11, fy + 14 + (k % 2) * 3, 9, 6); c.fillStyle = '#6ac86a'; c.fillRect(px + 6 + k * 11, fy + 14 + (k % 2) * 3, 9, 1.5); c.fillStyle = '#4a9a4a'; } }
    else {
      const cx = x + w / 2, cy = fy + 4 + ph / 2;
      c.fillStyle = '#8a8e98'; c.beginPath(); c.arc(cx, cy, 9, 0, TAU); c.fill(); c.strokeStyle = '#16181e'; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = '#c8ccd4'; c.beginPath(); c.arc(cx, cy, 6.4, 0, TAU); c.fill(); c.strokeStyle = '#555'; c.lineWidth = 0.8; for (let k = 0; k < 12; k++) { const a = k * TAU / 12; c.beginPath(); c.moveTo(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5); c.lineTo(cx + Math.cos(a) * 6.4, cy + Math.sin(a) * 6.4); c.stroke(); }
      c.fillStyle = '#16181e'; c.fillRect(cx - 1, cy - 5.5, 2, 5.5); c.fillStyle = '#c8302a'; c.fillRect(px + 5, fy + 9, 4, 2);
    }
    c.fillStyle = '#16181e'; [[px + 3, fy + 8], [px + pw - 3, fy + 8], [px + 3, fy + ph], [px + pw - 3, fy + ph]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 1.2, 0, TAU); c.fill(); });
  }, { alto: 10 });

  // ======================= SALA =======================
  reg('estante', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 44, v = o.variante || '', madeira = o.front || '#5a3c24';
    caixa(c, x, y, w, h, e, o.top || '#7a5a3a', madeira, { r: 2 });
    const fy = y + h - e, nr = e > 50 ? 3 : 2, rh = (e - 6) / nr, r = rng(x * 5 + y * 3);
    c.fillStyle = '#1a120c'; c.fillRect(x + 3, fy + 3, w - 6, e - 6);
    for (let q = 0; q < nr; q++) {
      const ry = fy + 3 + q * rh, base = ry + rh - 2;
      let px = x + 5;
      while (px < x + w - 8) {
        if (v === 'frutas') { const cc = ['#e8801a', '#c8302a', '#e8d02a', '#4aa02a'][(r() * 4) | 0]; c.fillStyle = cc; c.beginPath(); c.arc(px + 4, base - 4, 4.2, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(px + 2, base - 7, 2, 2); px += 9; }
        else if (v === 'remedios') { const cc = ['#ffffff', '#e8505a', '#4aa0e0', '#e8d02a'][(r() * 4) | 0]; c.fillStyle = cc; c.fillRect(px, base - 10, 8, 10); c.fillStyle = '#2f9a4a'; c.fillRect(px + 3.4, base - 8, 1.4, 5); c.fillRect(px + 1.7, base - 6.3, 4.8, 1.4); px += 10; }
        else if (v === 'tenis') { const cc = ['#f2f2f2', '#d33a3a', '#2a5ac8', '#e0b32a'][(r() * 4) | 0]; c.fillStyle = cc; rr(c, px, base - 7, 13, 7, 3); c.fill(); c.fillStyle = '#f2f2f2'; c.fillRect(px, base - 2.6, 13, 2.6); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(px + 8, base - 6, 3, 2); px += 16; }
        else { const t = r(); if (t < 0.7) { const bh = rh * (0.5 + r() * 0.4), bw = 4 + r() * 4; c.fillStyle = ['#c8402a', '#2a58b8', '#e0b32a', '#2f8a6a', '#7a3a8a', '#e8e0cc', '#3a2a22'][(r() * 7) | 0]; c.fillRect(px, base - bh, bw, bh); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(px + 1, base - bh + 1, 1, bh - 3); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(px, base - bh + 3, bw, 1); px += bw + 0.6; } else if (t < 0.85) { c.fillStyle = '#b8683a'; c.fillRect(px, base - 6, 8, 6); c.fillStyle = '#2f8a3c'; c.beginPath(); c.arc(px + 4, base - 9, 4.5, 0, TAU); c.fill(); px += 12; } else { c.fillStyle = '#e8c850'; c.beginPath(); c.arc(px + 5, base - 6, 5.5, 0, TAU); c.fill(); c.strokeStyle = '#a88a30'; c.stroke(); px += 13; } }
      }
      c.fillStyle = shade(madeira, 0.1); c.fillRect(x + 3, base, w - 6, 2.5); c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(x + 3, base + 2.5, w - 6, 1);
    }
    c.fillStyle = madeira; c.fillRect(x, fy, 3, e); c.fillRect(x + w - 3, fy, 3, e);
  }, { alto: 10 });

  reg('mesa_centro', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 12;
    caixa(c, x, y, w, h, e, o.top || '#c8a070', '#5a3a22', { r: 4 });
    const ty = y - e; c.fillStyle = 'rgba(180,210,230,0.28)'; rr(c, x + 3, ty + 3, w - 6, h - 6, 3); c.fill();
    c.fillStyle = '#f4efe0'; rr(c, x + 8, ty + 6, 16, 11, 1); c.fill(); c.fillStyle = '#c8402a'; c.fillRect(x + 8, ty + 6, 16, 3); c.fillStyle = '#e8e8f0'; c.beginPath(); c.arc(x + w - 14, ty + h / 2, 5, 0, TAU); c.fill(); c.fillStyle = '#6a3a1a'; c.beginPath(); c.arc(x + w - 14, ty + h / 2, 3.2, 0, TAU); c.fill(); c.fillStyle = '#1a1c22'; rr(c, x + w * 0.45, ty + h - 12, 10, 4, 1); c.fill();
  }, { alto: 14 });

  reg('luminaria', (c, o) => {
    const cx = o.x + o.w / 2, by = o.y + o.h;
    sombra(c, cx - 9, by - 8, 18, 8, { oval: true, dx: 5, dy: 3, a: 0.1 });
    c.fillStyle = '#2a2018'; c.beginPath(); c.ellipse(cx, by - 3, 8, 3.4, 0, 0, TAU); c.fill(); c.fillRect(cx - 1.4, by - 52, 2.8, 50);
    const g = c.createLinearGradient(cx - 13, 0, cx + 13, 0); g.addColorStop(0, '#d8c898'); g.addColorStop(0.5, '#fff4d0'); g.addColorStop(1, '#c8b888'); c.fillStyle = g; c.beginPath(); c.moveTo(cx - 8, by - 52); c.lineTo(cx + 8, by - 52); c.lineTo(cx + 13, by - 36); c.lineTo(cx - 13, by - 36); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.stroke();
  }, {
    alto: 50, din(ctx, o, t) { const cx = o.x + o.w / 2, by = o.y + o.h; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(cx, by - 30, 4, cx, by - 20, 90); g.addColorStop(0, 'rgba(255,214,140,0.22)'); g.addColorStop(1, 'rgba(255,214,140,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 95, by - 120, 190, 190); ctx.restore(); }
  });

  // mesa de jantar redonda ou retangular, com louça
  reg('mesa_rest', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 16, cx = x + w / 2, cy = y + h / 2, cor = o.cor || '#c8302a', toalha = o.toalha || '#f4f0e8', redonda = o.forma ? o.forma === 'redonda' : w < h * 1.3;
    const ty = e;
    sombra(c, x, y, w, h, { oval: redonda, dx: 5, dy: 8, a: 0.08 });
    if (redonda) {
      c.fillStyle = '#3a2a1c'; c.fillRect(cx - 3, cy - 2, 6, e); c.beginPath(); c.ellipse(cx, cy + e - 2, 12, 4, 0, 0, TAU); c.fill();
      const g = c.createRadialGradient(cx - w * 0.15, cy - e - h * 0.1, 3, cx, cy - e, w / 2); g.addColorStop(0, shade(toalha, 0.1)); g.addColorStop(1, shade(toalha, -0.14));
      c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy - e, w / 2, h / 2.1, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 1; c.stroke();
      c.strokeStyle = shade(toalha, -0.2); c.lineWidth = 3; c.beginPath(); c.ellipse(cx, cy - e + 2, w / 2 - 3, h / 2.1 - 3, 0, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
    } else {
      caixa(c, x, y, w, h, e, toalha, shade(toalha, -0.15), { r: 5, semSombra: true });
      c.fillStyle = cor; c.fillRect(x + w * 0.18, y - e + 1, w * 0.64, h - 2); c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(x + w * 0.18, y - e + 1, w * 0.64, 2);
    }
    const ey = redonda ? cy - e : y - e + h / 2;
    // pratos, talheres e copos
    const lugares = redonda ? [[-0.3, 0.2], [0.3, 0.2], [0, -0.32], [0, 0.34]] : [[-0.32, -0.24], [0.32, -0.24], [-0.32, 0.26], [0.32, 0.26]];
    lugares.forEach(([a, b]) => { const px = cx + a * w, py = ey + b * h; c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(px + 1.5, py + 2, 8, 4.4, 0, 0, TAU); c.fill(); c.fillStyle = '#fbfaf6'; c.beginPath(); c.ellipse(px, py, 8, 4.4, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.8; c.stroke(); c.fillStyle = o.prato || '#d8a040'; c.beginPath(); c.ellipse(px, py - 0.4, 4.4, 2.2, 0, 0, TAU); c.fill(); c.fillStyle = '#c8ccd4'; c.fillRect(px - 12, py - 4, 1.2, 8); c.fillRect(px + 10.6, py - 4, 1.2, 8); c.fillStyle = 'rgba(210,230,245,0.8)'; c.beginPath(); c.arc(px + 10, py - 8, 2.4, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.stroke(); });
    // centro: vaso de flores
    c.fillStyle = '#e8e2d6'; c.beginPath(); c.moveTo(cx - 4, ey + 3); c.lineTo(cx + 4, ey + 3); c.lineTo(cx + 3, ey - 4); c.lineTo(cx - 3, ey - 4); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.stroke();
    [['#e84a6a', -3, -9], ['#f2d84a', 2, -11], ['#ffffff', 4, -7], ['#e8801a', -1, -8]].forEach(([cc, dx, dy]) => { c.fillStyle = '#2f8a3c'; c.fillRect(cx + dx - 0.5, ey + dy, 1, 6); c.fillStyle = cc; c.beginPath(); c.arc(cx + dx, ey + dy, 3, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(cx + dx - 1.2, ey + dy - 1.4, 1.2, 1.2); });
  }, { alto: 20 });

  // cadeira de jantar vista de cima: assento acolchoado + encosto do lado dir (n/s/e/w)
  reg('cadeira_rest', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, cor = o.cor || '#7a2a3a', dir = o.dir || 'n', madeira = '#5a3a22';
    sombra(c, x, y, w, h, { dx: 3, dy: 5, r: 6, a: 0.09 });
    const cx = x + w / 2, cy = y + h / 2 - 4;
    // pernas
    c.fillStyle = madeira; [[x + 2, y + h - 3], [x + w - 4, y + h - 3], [x + 2, y + 4], [x + w - 4, y + 4]].forEach(([a, b]) => c.fillRect(a, b, 2, 4));
    // encosto atrás do assento
    const enc = () => {
      let ex = x, ey = y - 14, ew = w, eh = 8;
      if (dir === 's') { ey = y + h - 8; }
      if (dir === 'e') { ex = x + w - 5; ey = y - 12; ew = 6; eh = h + 6; }
      if (dir === 'w') { ex = x - 1; ey = y - 12; ew = 6; eh = h + 6; }
      c.fillStyle = madeira; rr(c, ex, ey, ew, eh, 3); c.fill(); c.fillStyle = shade(madeira, 0.25); c.fillRect(ex + 1, ey + 1, ew - 2, 1.4); c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1; rr(c, ex + 0.5, ey + 0.5, ew - 1, eh - 1, 3); c.stroke();
      c.fillStyle = shade(cor, -0.1); rr(c, ex + 2, ey + 2, Math.max(2, ew - 4), Math.max(2, eh - 4), 2); c.fill();
    };
    if (dir === 'n' || dir === 'e' || dir === 'w') enc();
    const g = c.createLinearGradient(x, cy - h / 2, x + w, cy + h / 2); g.addColorStop(0, shade(cor, 0.22)); g.addColorStop(1, shade(cor, -0.2));
    c.fillStyle = g; rr(c, x + 1, y - 6, w - 2, h - 2, 6); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1; rr(c, x + 1.5, y - 5.5, w - 3, h - 3, 6); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x + 5, y - 4, w - 10, 1.6); c.strokeStyle = 'rgba(0,0,0,0.15)'; rr(c, x + 5, y - 2, w - 10, h - 9, 4); c.stroke();
    if (dir === 's') enc();
  }, { alto: 20 });

  // ======================= PLANTAS =======================
  reg('planta', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, cx = x + w / 2, by = y + h - 3;
    const v = o.variante || ['folhagem', 'samambaia', 'palmeira', 'espada', 'folhagem', 'suculenta'][(hh(x * 0.37, y * 0.51) * 6) | 0];
    const vc = o.vaso || ['#b8683a', '#e8e2d6', '#3a4a5a', '#8a5a3a', '#c8a070'][(hh(y * 0.3, x * 0.7) * 5) | 0];
    sombra(c, cx - 13, by - 7, 26, 9, { oval: true, dx: 5, dy: 3, a: 0.1 });
    // folhas de trás
    const fo = ['#2f7a2c', '#3a8a34', '#276a28', '#4a9a3a'], topo = by - 20;
    const rn = rng(((x * 31 + y * 17) | 0) + 3);
    if (v === 'folhagem') { for (let k = 0; k < 8; k++) { const a = -1.2 + k * 0.34 + (rn() - 0.5) * 0.2; folha(c, cx + Math.sin(a) * 11, topo - 14 - Math.cos(a) * 9 + (k % 2) * 3, 5.5, 11, a * 0.9, fo[k % 4]); } }
    else if (v === 'samambaia') { for (let k = 0; k < 7; k++) { const a = -1.3 + k * 0.43; const ex = cx + Math.sin(a) * 24, ey = topo - 6 - Math.cos(a) * 18; c.strokeStyle = '#2a6a2a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx, topo); c.quadraticCurveTo(cx + Math.sin(a) * 12, topo - 22, ex, ey + 6); c.stroke(); for (let q = 0; q < 8; q++) { const tq = q / 7, px = (1 - tq) * (1 - tq) * cx + 2 * tq * (1 - tq) * (cx + Math.sin(a) * 12) + tq * tq * ex, py = (1 - tq) * (1 - tq) * topo + 2 * tq * (1 - tq) * (topo - 22) + tq * tq * (ey + 6); c.fillStyle = fo[(q + k) % 4]; c.beginPath(); c.ellipse(px - 2.5, py, 3.4, 1.4, 0.6, 0, TAU); c.ellipse(px + 2.5, py, 3.4, 1.4, -0.6, 0, TAU); c.fill(); } } }
    else if (v === 'palmeira') { for (let k = 0; k < 7; k++) { const a = -1.4 + k * 0.47; const ex = cx + Math.sin(a) * 26, ey = topo - 26 - Math.cos(a) * 6 + Math.abs(a) * 8; c.strokeStyle = '#3a8a34'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, topo); c.quadraticCurveTo(cx + Math.sin(a) * 8, topo - 34, ex, ey); c.stroke(); for (let q = 1; q < 9; q++) { const tq = q / 9, px = (1 - tq) * (1 - tq) * cx + 2 * tq * (1 - tq) * (cx + Math.sin(a) * 8) + tq * tq * ex, py = (1 - tq) * (1 - tq) * topo + 2 * tq * (1 - tq) * (topo - 34) + tq * tq * ey; c.fillStyle = fo[(q + k) % 4]; c.beginPath(); c.ellipse(px, py, 1.4, 5 * (1 - tq * 0.4), 0.9 * Math.sign(a || 1), 0, TAU); c.fill(); } } }
    else if (v === 'espada') { for (let k = 0; k < 7; k++) { const a = (k - 3) * 0.16, hgt = 30 + (k % 3) * 8; c.save(); c.translate(cx + (k - 3) * 2.4, topo); c.rotate(a); const g = c.createLinearGradient(-4, 0, 4, 0); g.addColorStop(0, '#1f5a2a'); g.addColorStop(0.5, '#4a9a4a'); g.addColorStop(1, '#2a6a30'); c.fillStyle = g; c.beginPath(); c.moveTo(-4, 0); c.quadraticCurveTo(-5, -hgt * 0.6, 0, -hgt); c.quadraticCurveTo(5, -hgt * 0.6, 4, 0); c.fill(); c.strokeStyle = '#d8d060'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-4, 0); c.quadraticCurveTo(-5, -hgt * 0.6, 0, -hgt); c.stroke(); c.restore(); } }
    else { for (let k = 0; k < 9; k++) { const a = k * 0.7; folha(c, cx + Math.cos(a) * 6, topo - 6 + Math.sin(a) * 2.5, 3.6, 7, a, ['#6aa86a', '#4a9a5a', '#8ab870'][k % 3]); } }
    // vaso (de frente)
    const g = c.createLinearGradient(cx - 11, 0, cx + 11, 0); g.addColorStop(0, shade(vc, 0.2)); g.addColorStop(0.45, vc); g.addColorStop(1, shade(vc, -0.35));
    c.fillStyle = g; c.beginPath(); c.moveTo(cx - 11, topo); c.lineTo(cx + 11, topo); c.lineTo(cx + 8, by); c.quadraticCurveTo(cx, by + 3, cx - 8, by); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 1; c.stroke();
    c.fillStyle = shade(vc, 0.12); c.beginPath(); c.ellipse(cx, topo, 11.5, 4.4, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#3a2412'; c.beginPath(); c.ellipse(cx, topo + 0.4, 9.5, 3.3, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(cx - 8, topo + 4, 2, 9);
    // frente das folhas (sobre a terra)
    if (v === 'folhagem') { for (let k = 0; k < 4; k++) { const a = -0.8 + k * 0.5; folha(c, cx + Math.sin(a) * 9, topo - 6 - Math.cos(a) * 3, 5, 9, a * 1.1, fo[(k + 1) % 4]); } }
    if (o.flor || (v === 'folhagem' && hh(x, y) > 0.7)) { [['#e84a6a', -8, -34], ['#f2d84a', 6, -38], ['#ffffff', 0, -42]].forEach(([cc, dx, dy]) => { c.fillStyle = cc; c.beginPath(); c.arc(cx + dx, topo + dy + 14, 3, 0, TAU); c.fill(); c.fillStyle = '#f2d84a'; c.beginPath(); c.arc(cx + dx, topo + dy + 14, 1, 0, TAU); c.fill(); }); }
  }, { alto: 50, pad: 20 });
  K.novos.vaso = K.novos.planta;

  // ======================= TAPETES =======================
  reg('tapete', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, cor = o.cor || '#7a2a3a', cor2 = o.cor2 || '#d8b878', forma = o.forma || 'ret', pad = o.padrao || 'persa';
    const caminho = (ix, iy, iw, ih, r) => { if (forma === 'redondo' || forma === 'oval') { c.beginPath(); c.ellipse(ix + iw / 2, iy + ih / 2, iw / 2, ih / 2, 0, 0, TAU); } else rr(c, ix, iy, iw, ih, r); };
    // franjas
    if (forma === 'ret') { c.strokeStyle = shade(cor2, 0.1); c.lineWidth = 1; c.beginPath(); for (let k = 0; k < h; k += 3) { c.moveTo(x - 6, y + k); c.lineTo(x, y + k); c.moveTo(x + w, y + k); c.lineTo(x + w + 6, y + k); } c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,0.22)'; caminho(x + 2, y + 3, w, h, 6); c.fill();
    const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, shade(cor, 0.1)); g.addColorStop(1, shade(cor, -0.14)); c.fillStyle = g; caminho(x, y, w, h, 6); c.fill();
    c.save(); caminho(x, y, w, h, 6); c.clip();
    c.strokeStyle = cor2; c.lineWidth = 4; caminho(x + 4, y + 4, w - 8, h - 8, 4); c.stroke();
    c.strokeStyle = rgba(cor2, 0.55); c.lineWidth = 1.2; caminho(x + 11, y + 11, w - 22, h - 22, 3); c.stroke();
    const cx = x + w / 2, cy = y + h / 2;
    if (pad === 'persa') {
      c.fillStyle = rgba(cor2, 0.9); c.beginPath(); c.moveTo(cx, cy - h * 0.3); c.lineTo(cx + w * 0.22, cy); c.lineTo(cx, cy + h * 0.3); c.lineTo(cx - w * 0.22, cy); c.closePath(); c.fill();
      c.fillStyle = shade(cor, -0.1); c.beginPath(); c.moveTo(cx, cy - h * 0.19); c.lineTo(cx + w * 0.13, cy); c.lineTo(cx, cy + h * 0.19); c.lineTo(cx - w * 0.13, cy); c.closePath(); c.fill();
      c.fillStyle = cor2; c.beginPath(); c.arc(cx, cy, Math.min(w, h) * 0.05, 0, TAU); c.fill();
      c.fillStyle = rgba(cor2, 0.7); for (let k = 0; k < Math.floor((w - 40) / 22); k++) { const px = x + 20 + k * 22 + 5; c.beginPath(); c.moveTo(px, y + 15); c.lineTo(px + 4, y + 19); c.lineTo(px, y + 23); c.lineTo(px - 4, y + 19); c.fill(); c.beginPath(); c.moveTo(px, y + h - 15); c.lineTo(px + 4, y + h - 19); c.lineTo(px, y + h - 23); c.lineTo(px - 4, y + h - 19); c.fill(); }
    } else if (pad === 'geometrico') { c.fillStyle = rgba(cor2, 0.5); for (let j = 0; j * 18 < h; j++) for (let i = 0; i * 18 < w; i++) if ((i + j) % 2 === 0) { const px = x + i * 18 + 9, py = y + j * 18 + 9; c.beginPath(); c.moveTo(px, py - 6); c.lineTo(px + 6, py); c.lineTo(px, py + 6); c.lineTo(px - 6, py); c.fill(); } }
    else if (pad === 'listras') { c.fillStyle = rgba(cor2, 0.5); for (let k = 0; k < w; k += 16) c.fillRect(x + k, y, 7, h); }
    else if (pad === 'pelo') { const r = rng(x + y); for (let k = 0; k < w * h / 18; k++) { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'; c.fillRect(x + r() * w, y + r() * h, 2, 2); } }
    // trama do tecido
    c.fillStyle = 'rgba(0,0,0,0.05)'; for (let k = 0; k < h; k += 3) c.fillRect(x, y + k, w, 1);
    c.restore();
  }, { alto: 0, pad: 14 });

  // ======================= CAIXAS DE PAPELÃO =======================
  reg('pilha_caixas', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 30, r = rng(x * 7 + y);
    sombra(c, x, y, w, h, { dx: 5, dy: 7, r: 3 });
    const caixaPapelao = (bx, by, bw, bh, be) => {
      caixa(c, bx, by, bw, bh, be, '#d8b472', '#b08a4a', { r: 1.5, semSombra: true });
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(bx + bw / 2 - 3, by - be, 6, bh); c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(bx + bw / 2 - 3, by + bh - be, 6, be);
      c.fillStyle = '#f4f0e6'; c.fillRect(bx + 4, by + bh - be + 4, Math.min(12, bw - 8), 7); c.fillStyle = '#c8302a'; c.fillRect(bx + 5, by + bh - be + 5, 4, 2);
    };
    const n = Math.max(1, Math.round(w / 34));
    for (let i = 0; i < n; i++) { const bw = w / n - 2, bh = h * (0.8 + r() * 0.2), be = e * (0.55 + r() * 0.3); caixaPapelao(x + i * (w / n) + 1, y + h - bh, bw, bh, be); }
    if (e > 24) caixaPapelao(x + w * 0.2, y + h * 0.15, w * 0.5, h * 0.6, e * 0.5 + e * 0.55 - e * 0.5);
  }, { alto: 20 });

  // ======================= PORTAS =======================
  reg('porta', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, cor = o.cor || '#6a4a2a';
    c.fillStyle = 'rgba(0,0,0,0.4)'; rr(c, x - 6, y - 5, w + 12, h + 9, 3); c.fill();
    if (o.estilo === 'elevador') {
      c.fillStyle = '#9aa0aa'; rr(c, x - 3, y - 3, w + 6, h + 4, 2); c.fill(); const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#c8ccd4'); g.addColorStop(0.5, '#eef0f4'); g.addColorStop(1, '#b0b6be'); c.fillStyle = g; c.fillRect(x, y, w, h);
      const ab = o.aberta ? 10 : 0; c.fillStyle = '#a8aeb8'; c.fillRect(x + 2, y + 2, w / 2 - 3 - ab, h - 3); c.fillRect(x + w / 2 + 1 + ab, y + 2, w / 2 - 3 - ab, h - 3); c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(x + w / 2 - 1, y, 2, h);
      c.fillStyle = '#16181e'; rr(c, x + w / 2 - 12, y - 18, 24, 11, 2); c.fill(); c.fillStyle = '#ffd24a'; c.beginPath(); c.moveTo(x + w / 2, y - 16); c.lineTo(x + w / 2 + 4, y - 10); c.lineTo(x + w / 2 - 4, y - 10); c.fill();
    } else if (o.estilo === 'vai-vem') {
      c.fillStyle = '#7a808a'; rr(c, x - 3, y - 3, w + 6, h + 4, 2); c.fill();
      [[x + 2, w / 2 - 3], [x + w / 2 + 1, w / 2 - 3]].forEach(([px, pw]) => { const g = c.createLinearGradient(px, y, px + pw, y + h); g.addColorStop(0, '#d8dce4'); g.addColorStop(1, '#9aa0aa'); c.fillStyle = g; rr(c, px, y + 3, pw, h - 3, 2); c.fill(); c.fillStyle = '#5a7a9a'; rr(c, px + 4, y + 9, pw - 8, 13, 2); c.fill(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(px + 5, y + 10, pw - 10, 2); c.fillStyle = '#c8ccd4'; c.fillRect(px + pw * 0.5, y + h * 0.55, pw * 0.4, 4); });
    } else {
      c.fillStyle = shade(cor, -0.35); rr(c, x - 3, y - 3, w + 6, h + 5, 2); c.fill();
      const g = c.createLinearGradient(x, y, x + w, y); g.addColorStop(0, shade(cor, 0.12)); g.addColorStop(1, shade(cor, -0.14)); c.fillStyle = g; c.fillRect(x, y, w, h);
      painel(c, x + 4, y + 4, w - 8, h * 0.42, shade(cor, 0.04), 1.5); painel(c, x + 4, y + h * 0.5, w - 8, h * 0.44, shade(cor, 0.04), 1.5);
      c.fillStyle = '#e8d070'; c.beginPath(); c.arc(x + w - 8, y + h * 0.52, 3, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(x + w - 9.4, y + h * 0.52 - 1.6, 1.4, 1.4); c.fillStyle = '#3a2a1c'; c.fillRect(x + w - 10, y + h * 0.52 + 3.4, 4, 1.2);
    }
    if (o.placa) { c.fillStyle = '#c8a24a'; rr(c, x + w / 2 - 17, y - 22, 34, 13, 2); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.5)'; c.stroke(); c.fillStyle = '#2a1a0a'; c.font = 'bold 8px Arial'; c.textAlign = 'center'; c.fillText(o.placa, x + w / 2, y - 12.2); c.textAlign = 'left'; }
  }, { alto: 30 });

  // ======================= BANHEIRO =======================
  reg('vaso_sanitario', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, cx = x + w / 2;
    sombra(c, x, y - 4, w, h, { dx: 4, dy: 6, r: 8, a: 0.08 });
    // caixa acoplada
    caixa(c, x + 2, y - 4, w - 4, 12, 14, '#f6f6f2', '#d8dad8', { r: 4, semSombra: true });
    c.fillStyle = '#c8ccd4'; c.beginPath(); c.arc(cx, y - 20, 2.6, 0, TAU); c.fill();
    // bacia
    const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfd2d4'); c.fillStyle = g; c.beginPath(); c.ellipse(cx, y + h * 0.52, w * 0.46, h * 0.5, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#e8eaec'; c.beginPath(); c.ellipse(cx, y + h * 0.5, w * 0.34, h * 0.37, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.stroke(); c.fillStyle = '#7ab0d0'; c.beginPath(); c.ellipse(cx, y + h * 0.56, w * 0.18, h * 0.2, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(x + 4, y + h * 0.3, 2, 8);
  }, { alto: 24 });
  reg('lavatorio', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 26, ty = y - e, madeira = o.front || '#8a6a4a';
    caixa(c, x, y, w, h, e, '#e8e4dc', madeira, { r: 3 });
    const g = c.createLinearGradient(x, ty, x + w, ty + h); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c8ccd0'); c.fillStyle = g; c.beginPath(); c.ellipse(x + w / 2, ty + h / 2 + 1, w * 0.36, h * 0.38, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#9aa4ae'; c.beginPath(); c.arc(x + w / 2, ty + h / 2 + 1, 2.2, 0, TAU); c.fill(); c.fillStyle = '#c8ccd4'; c.fillRect(x + w / 2 - 2, ty + 2, 4, 6); c.fillRect(x + w / 2 - 5, ty + 1, 10, 2);
    const fy = y + h - e; painel(c, x + 3, fy + 3, w - 6, e - 7, shade(madeira, 0.08), 2); puxador(c, x + w / 2 - 5, fy + 6, 10, 2.4, '#d8c890');
  }, { alto: 12 });
  reg('chuveiro', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h;
    // box de azulejo com vidro
    c.fillStyle = 'rgba(0,0,0,0.25)'; rr(c, x + 3, y + 4, w, h, 3); c.fill();
    const r = rng(x + y); for (let j = 0; j * 14 < h; j++) for (let i = 0; i * 14 < w; i++) { c.fillStyle = shade('#d4ecf4', (r() - 0.5) * 0.06); c.fillRect(x + i * 14, y + j * 14, 14, 14); }
    c.strokeStyle = 'rgba(80,120,140,0.5)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i * 14 <= w; i++) { c.moveTo(x + i * 14, y); c.lineTo(x + i * 14, y + h); } for (let j = 0; j * 14 <= h; j++) { c.moveTo(x, y + j * 14); c.lineTo(x + w, y + j * 14); } c.stroke();
    c.fillStyle = '#9aa4ae'; c.beginPath(); c.arc(x + w / 2, y + h / 2, 3, 0, TAU); c.fill(); c.strokeStyle = '#6a747e'; c.stroke();
    c.fillStyle = 'rgba(180,220,240,0.3)'; c.fillRect(x, y + h - 22, w, 22); c.strokeStyle = '#c8ccd4'; c.lineWidth = 2.5; c.strokeRect(x + 1, y + 1, w - 2, h - 2); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(x + 3, y + h - 20, 2, 16);
    // chuveiro no alto
    c.strokeStyle = '#b8bec6'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + w - 8, y + 3); c.lineTo(x + w - 8, y - 12); c.lineTo(x + w - 20, y - 12); c.stroke(); c.fillStyle = '#c8ccd4'; c.beginPath(); c.ellipse(x + w - 21, y - 11, 7, 3.4, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 1; c.stroke();
  }, { alto: 20 });
  reg('banheira', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h;
    caixa(c, x, y, w, h, 14, '#f6f6f2', '#d2d6d8', { r: 12 });
    const ty = y - 14; c.fillStyle = '#e4e8ea'; rr(c, x + 6, ty + 6, w - 12, h - 12, 10); c.fill(); const g = c.createLinearGradient(x, ty, x + w, ty + h); g.addColorStop(0, '#7ac8f0'); g.addColorStop(1, '#4a98d0'); c.fillStyle = g; rr(c, x + 8, ty + 8, w - 16, h - 16, 9); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + 18, ty + h * 0.4); c.quadraticCurveTo(x + w * 0.4, ty + h * 0.3, x + w * 0.6, ty + h * 0.45); c.stroke(); c.fillStyle = '#fff'; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(x + 16 + hh(k, x) * (w - 40), ty + 12 + hh(x, k) * (h - 24), 3 + hh(k, k) * 3, 0, TAU); c.fill(); }
    c.fillStyle = '#c8ccd4'; c.beginPath(); c.arc(x + w - 12, ty + 2, 3, 0, TAU); c.fill(); c.fillRect(x + w - 15, ty - 6, 6, 5);
  }, { alto: 14 });
  reg('cesto', (c, o) => {
    const cx = o.x + o.w / 2, by = o.y + o.h; sombra(c, o.x, o.y + 4, o.w, o.h - 4, { oval: true, dx: 4, dy: 3, a: 0.1 });
    const g = c.createLinearGradient(o.x, 0, o.x + o.w, 0); g.addColorStop(0, '#d8b878'); g.addColorStop(1, '#8a6a3a'); c.fillStyle = g; c.beginPath(); c.moveTo(o.x + 1, by - 22); c.lineTo(o.x + o.w - 1, by - 22); c.lineTo(o.x + o.w - 4, by); c.lineTo(o.x + 4, by); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.stroke();
    c.strokeStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); for (let k = 6; k < 22; k += 5) { c.moveTo(o.x + 2, by - k); c.lineTo(o.x + o.w - 2, by - k); } c.stroke(); c.fillStyle = '#e8e2d6'; c.beginPath(); c.ellipse(cx, by - 22, o.w / 2, 5, 0, 0, TAU); c.fill(); c.fillStyle = '#4a78c8'; c.beginPath(); c.ellipse(cx - 3, by - 24, 6, 3, 0.3, 0, TAU); c.fill(); c.fillStyle = '#e8805a'; c.beginPath(); c.ellipse(cx + 5, by - 22, 5, 2.6, -0.2, 0, TAU); c.fill();
  }, { alto: 14 });
  reg('lavadora', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 34, fy = y + h - e;
    caixa(c, x, y, w, h, e, '#f0f2f4', '#dfe3e6', { r: 3 });
    const cx = x + w / 2, cy = fy + e * 0.58; c.fillStyle = '#9aa4ae'; c.beginPath(); c.arc(cx, cy, e * 0.34, 0, TAU); c.fill(); const g = c.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, e * 0.3); g.addColorStop(0, '#6a90b0'); g.addColorStop(1, '#1a2430'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, e * 0.28, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.arc(cx - 4, cy - 4, 3, 0, TAU); c.fill();
    c.fillStyle = '#2a2d36'; rr(c, x + 5, fy + 3, w * 0.4, 6, 1); c.fill(); c.fillStyle = '#4ae08a'; c.fillRect(x + 8, fy + 5, 5, 2); c.fillStyle = '#c8ccd4'; c.beginPath(); c.arc(x + w - 9, fy + 6, 3, 0, TAU); c.fill();
  }, { alto: 14 });

  // ======================= ESCRITÓRIO =======================
  reg('escrivaninha', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 22, ty = y - e;
    caixa(c, x, y, w, h, e, o.top || '#b08a5a', o.front || '#6a4a2e', { r: 2 });
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + 2, ty + 2, w - 4, 2);
    // monitor + teclado + mouse + papel + caneca
    const mx = x + w / 2 - 20;
    c.fillStyle = '#2a2d36'; c.fillRect(mx + 16, ty + h * 0.45, 8, 4); c.fillStyle = '#0c0d12'; rr(c, mx, ty + h * 0.45 - 28, 40, 28, 2); c.fill(); const g = c.createLinearGradient(mx, ty - 6, mx + 40, ty + 22); g.addColorStop(0, '#3a8ae0'); g.addColorStop(1, '#2a4a9a'); c.fillStyle = g; c.fillRect(mx + 2, ty + h * 0.45 - 26, 36, 22); c.fillStyle = 'rgba(255,255,255,0.75)'; for (let k = 0; k < 4; k++) c.fillRect(mx + 5, ty + h * 0.45 - 22 + k * 4.4, 12 + (k % 2) * 12, 1.8);
    c.fillStyle = '#c8ccd4'; rr(c, mx + 4, ty + h - 11, 30, 7, 1.5); c.fill(); c.fillStyle = '#8a9099'; for (let k = 0; k < 3; k++) c.fillRect(mx + 6, ty + h - 9.6 + k * 2, 26, 0.8);
    c.fillStyle = '#e8e8ee'; c.beginPath(); c.ellipse(mx + 44, ty + h - 8, 3, 4, 0, 0, TAU); c.fill(); c.fillStyle = '#f4efe0'; c.fillRect(x + 6, ty + h * 0.3, 16, 12); c.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 0; k < 3; k++) c.fillRect(x + 8, ty + h * 0.3 + 3 + k * 3, 12, 0.9); c.fillStyle = '#c8302a'; rr(c, x + w - 16, ty + h * 0.35, 8, 9, 1.5); c.fill();
  }, { alto: 32 });
  reg('cadeira_esc', (c, o) => {
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
    sombra(c, o.x, o.y, o.w, o.h, { oval: true, dx: 4, dy: 5, a: 0.1 });
    c.fillStyle = '#2a2d36'; c.beginPath(); c.ellipse(cx, cy + 5, 11, 4.4, 0, 0, TAU); c.fill(); c.fillRect(cx - 1.4, cy - 4, 2.8, 9);
    const g = c.createLinearGradient(cx - 11, 0, cx + 11, 0); g.addColorStop(0, '#3a3e48'); g.addColorStop(1, '#16181e'); c.fillStyle = g; rr(c, cx - 11, cy - 8, 22, 14, 6); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.6)'; c.stroke();
    c.fillStyle = '#2a2d36'; rr(c, cx - 10, cy - 24, 20, 14, 5); c.fill(); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(cx - 8, cy - 22, 16, 2);
  }, { alto: 30 });

  // ======================= EXTRAS (cozinha, sala grande, quarto) =======================
  reg('banqueta', (c, o) => {
    const cx = o.x + o.w / 2, by = o.y + o.h, cor = o.cor || '#7a2a3a';
    sombra(c, o.x + 3, o.y + 8, o.w - 6, o.h - 8, { oval: true, dx: 4, dy: 3, a: 0.1 });
    c.strokeStyle = '#8a9099'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 6, by - 14); c.lineTo(cx - 8, by - 1); c.moveTo(cx + 6, by - 14); c.lineTo(cx + 8, by - 1); c.moveTo(cx, by - 14); c.lineTo(cx, by - 3); c.stroke();
    c.strokeStyle = '#6a707a'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(cx, by - 6, 7, 2.6, 0, 0, TAU); c.stroke();
    const g = c.createRadialGradient(cx - 3, by - 20, 2, cx, by - 17, 11); g.addColorStop(0, shade(cor, 0.25)); g.addColorStop(1, shade(cor, -0.2)); c.fillStyle = g; c.beginPath(); c.ellipse(cx, by - 17, 10, 6.4, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(cx - 3, by - 19, 4, 1.8, -0.3, 0, TAU); c.fill();
  }, { alto: 22, pad: 18 });

  reg('ilha', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 30, ty = y - e, madeira = o.front || '#6a4a2e';
    caixa(c, x, y, w, h, e, '#ece8e0', madeira, { r: 4 });
    const r = rng(x + y); for (let k = 0; k < 60; k++) { c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.4)'; c.fillRect(x + 3 + r() * (w - 6), ty + 2 + r() * (h - 4), 1.5, 1.5); }
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(x + 2, ty + h - 4, w - 4, 3);
    // fruteira, tábua e vinho
    c.fillStyle = '#c8a060'; c.beginPath(); c.ellipse(x + 24, ty + h / 2, 13, 8, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.4)'; c.stroke(); [['#e8402a', -5, -2], ['#f2c82a', 2, -3], ['#6aa83a', 6, 1], ['#e8801a', -2, 2]].forEach(([cc, dx, dy]) => { c.fillStyle = cc; c.beginPath(); c.arc(x + 24 + dx, ty + h / 2 + dy, 4, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(x + 22 + dx, ty + h / 2 + dy - 3, 1.6, 1.6); });
    c.fillStyle = '#d8b878'; rr(c, x + w * 0.5, ty + 9, 30, 14, 2); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.stroke(); c.fillStyle = '#c8302a'; c.beginPath(); c.arc(x + w * 0.5 + 10, ty + 16, 4, 0, TAU); c.fill();
    c.fillStyle = '#2a4a2a'; c.fillRect(x + w - 24, ty + 8, 5, 14); c.fillRect(x + w - 22.5, ty + 3, 2, 6);
    const fy = y + h - e, n = Math.max(2, Math.round(w / 40)), dw = (w - 8) / n; for (let i = 0; i < n; i++) { painel(c, x + 4 + i * dw, fy + 4, dw - 3, e - 9, shade(madeira, 0.1), 2); puxador(c, x + 4 + i * dw + (dw - 3) / 2 - 4, fy + 6, 8, 2.4, '#d8c890'); }
  }, { alto: 20 });

  reg('lareira', (c, o) => {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 68;
    caixa(c, x, y, w, h, e, '#d8d0c0', '#b8a888', { r: 3 });
    const fy = y + h - e, r = rng(x);
    // tijolos aparentes
    for (let j = 0; j < 7; j++) for (let i = 0; i < 9; i++) { const bx = x + 3 + i * (w - 6) / 9 + (j % 2) * 5, by = fy + 10 + j * 8; if (bx + 11 > x + w) continue; c.fillStyle = shade('#a8603a', (r() - 0.5) * 0.25); c.fillRect(bx, by, (w - 6) / 9 - 1.5, 6.5); }
    // boca da lareira
    const bx = x + w * 0.2, bw = w * 0.6, by = fy + e * 0.34, bh = e * 0.58;
    c.fillStyle = '#0e0a08'; rr(c, bx, by, bw, bh, 4); c.fill(); c.strokeStyle = '#3a2a22'; c.lineWidth = 3; rr(c, bx, by, bw, bh, 4); c.stroke();
    c.fillStyle = '#4a2a14'; rr(c, bx + 8, by + bh - 12, bw - 16, 7, 3); c.fill(); rr(c, bx + 14, by + bh - 18, bw - 28, 7, 3); c.fill();
    // consolo (prateleira) com enfeites
    c.fillStyle = '#6a4a2a'; c.fillRect(x - 3, fy + 2, w + 6, 6); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x - 3, fy + 2, w + 6, 1.4);
    const ty = y - e; c.fillStyle = '#e8c850'; c.beginPath(); c.arc(x + w / 2, ty + h / 2, 7, 0, TAU); c.fill(); c.strokeStyle = '#8a6a1a'; c.stroke(); c.fillStyle = '#e8e2d6'; c.fillRect(x + 10, ty + h / 2 - 5, 7, 10); c.fillRect(x + w - 17, ty + h / 2 - 5, 7, 10);
  }, {
    alto: 20, din(ctx, o, t) {
      const x = o.x, e = o.e || 68, fy = o.y + o.h - e, bx = x + o.w * 0.2, bw = o.w * 0.6, by = fy + e * 0.34, bh = e * 0.58;
      ctx.save(); ctx.beginPath(); rr(ctx, bx + 2, by + 2, bw - 4, bh - 4, 3); ctx.clip();
      for (let k = 0; k < 6; k++) { const ph = (t * 1.6 + k * 0.7) % 1, fx = bx + bw * (0.18 + k * 0.13) + Math.sin(t * 5 + k) * 3, fh = bh * (0.42 + 0.18 * Math.sin(t * 7 + k * 2)); ctx.fillStyle = ['#e8501a', '#f08a1a', '#f8c82a'][k % 3]; ctx.beginPath(); ctx.moveTo(fx - 7, by + bh - 6); ctx.quadraticCurveTo(fx - 3, by + bh - fh * 0.6, fx + Math.sin(t * 6 + k) * 3, by + bh - fh); ctx.quadraticCurveTo(fx + 3, by + bh - fh * 0.6, fx + 7, by + bh - 6); ctx.fill(); }
      ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x + o.w / 2, o.y + o.h + 20, 6, x + o.w / 2, o.y + o.h + 30, 130); g.addColorStop(0, 'rgba(255,140,50,' + (0.2 + 0.05 * Math.sin(t * 8)) + ')'); g.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = g; ctx.fillRect(x - 100, o.y + o.h - 30, o.w + 200, 190); ctx.restore();
    }
  });

  reg('ventilador', (c, o) => {
    const cx = o.x + o.w / 2, by = o.y + o.h;
    sombra(c, cx - 11, by - 8, 22, 8, { oval: true, dx: 4, dy: 3, a: 0.1 });
    c.fillStyle = '#3a3e48'; c.beginPath(); c.ellipse(cx, by - 3, 10, 4, 0, 0, TAU); c.fill(); c.fillStyle = '#8a9099'; c.fillRect(cx - 1.6, by - 30, 3.2, 28);
  }, {
    alto: 40, din(ctx, o, t) {
      const cx = o.x + o.w / 2, by = o.y + o.h, hy = by - 36;
      ctx.fillStyle = '#4a4e58'; ctx.beginPath(); ctx.arc(cx, hy, 4, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(cx, hy); ctx.rotate(t * 16); for (let k = 0; k < 3; k++) { ctx.rotate(TAU / 3); ctx.fillStyle = 'rgba(120,170,220,0.55)'; ctx.beginPath(); ctx.ellipse(0, -9, 4.4, 9, 0, 0, TAU); ctx.fill(); } ctx.restore();
      ctx.strokeStyle = 'rgba(40,44,52,0.85)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(cx, hy, 15, 0, TAU); ctx.stroke(); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(cx, hy, 8, 0, TAU); ctx.moveTo(cx - 15, hy); ctx.lineTo(cx + 15, hy); ctx.moveTo(cx, hy - 15); ctx.lineTo(cx, hy + 15); ctx.stroke();
    }
  });

  // parede baixa (divisória): tampa clara + frente pintada
  reg('parede_int', (c, o) => {
    const e = o.e || 28, cor = o.cor || '#e6dcc4';
    caixa(c, o.x, o.y, o.w, o.h, e, shade(cor, 0.4), cor, { r: 1.5 });
    if (o.w > o.h) { c.fillStyle = shade(cor, 0.45); c.fillRect(o.x + 1, o.y + o.h - 5, o.w - 2, 4); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(o.x + 1, o.y + o.h - 6, o.w - 2, 1); }
  }, { alto: 4 });
})(window.G = window.G || {});
