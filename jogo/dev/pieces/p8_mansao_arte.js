  // ======================================================================
  // ARTE DA MANSÃO (pixel art): gramado, pavimento, muros, fonte, piscina, quadra, heliponto e as construções do terreno.
  // O chão é pintado nos "pedaços" do mapa (desenhaMansaoChao); torres, guarita e garagem são prédios desenhados por G.mansaoArte.
  // ======================================================================
  const MA = G.mansaoArte = {};
  const hashM = (x, y) => (Math.imul(x | 0, 73856093) ^ Math.imul(y | 0, 19349663)) >>> 0;
  let paverTela = null;
  function paverPad(ctx) {      // pavimento de pedra (paralelepípedo claro, em fiadas)
    if (!paverTela) {
      const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
      g.fillStyle = '#c9bda4'; g.fillRect(0, 0, 32, 32);
      g.fillStyle = '#b3a68c';
      for (let r = 0; r < 4; r++) { g.fillRect(0, r * 8 + 7, 32, 1); const off = (r % 2) * 8; for (let x = off; x < 32 + off; x += 16) g.fillRect(x % 32, r * 8, 1, 7); }
      g.fillStyle = '#d6cbb4'; for (let r = 0; r < 4; r++) g.fillRect(2, r * 8 + 1, 5, 1);
      paverTela = c;
    }
    return ctx.createPattern(paverTela, 'repeat');
  }
  const rr2 = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); };

  // pedaço de muro de pedra (retângulo em pixels). 'face' = desenha a parede da frente (virada para o sul) por baixo
  function muroPedra(ctx, x, y, w, h, face) {
    ctx.fillStyle = '#a9a398'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#cdc7ba'; ctx.fillRect(x, y, w, 3);                        // luz em cima
    ctx.fillStyle = '#8f8a80'; for (let xx = x - (x % 24) + 24; xx < x + w; xx += 24) if (xx > x) ctx.fillRect(xx, y + 3, 1, h - 3);
    ctx.fillStyle = '#7a756c'; ctx.fillRect(x, y + h - 4, w, 4);                // sombra embaixo
    if (face) {
      ctx.fillStyle = '#8b867c'; ctx.fillRect(x, y + h, w, 12);
      ctx.fillStyle = '#6f6a62'; ctx.fillRect(x, y + h + 12, w, 3);
      ctx.fillStyle = '#767168'; for (let xx = x - (x % 24) + 24; xx < x + w; xx += 24) if (xx > x) ctx.fillRect(xx, y + h, 1, 12);
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x, y + h + 15, w, 5);   // sombra no chão
    }
  }
  function pilar(ctx, x, y, s, ouro) {       // pilar de pedra com tampa e lanterna (x,y = canto; s = lado em px)
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 5, y + 6, s, s);
    ctx.fillStyle = '#b3ada1'; ctx.fillRect(x, y, s, s); ctx.fillStyle = '#d4cec1'; ctx.fillRect(x, y, s, 4); ctx.fillRect(x, y, 4, s);
    ctx.fillStyle = '#8a857b'; ctx.fillRect(x + s - 4, y + 4, 4, s - 4); ctx.fillRect(x + 4, y + s - 4, s - 4, 4);
    ctx.fillStyle = '#9d978b'; ctx.fillRect(x + 5, y + 5, s - 10, s - 10);
    ctx.fillStyle = ouro ? '#e8c860' : '#f4e3a0'; ctx.fillRect(x + s / 2 - 4, y + s / 2 - 4, 8, 8);              // lanterna
    ctx.fillStyle = '#fff6c8'; ctx.fillRect(x + s / 2 - 2, y + s / 2 - 2, 4, 4);
  }
  function cerca(ctx, x, y, w, h) {  // sebe quadrada (buxinho)
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; rr2(ctx, x + 3, y + 4, w, h, 6); ctx.fill();
    ctx.fillStyle = '#2b6a2b'; rr2(ctx, x, y, w, h, 6); ctx.fill();
    ctx.fillStyle = '#3d8a3b'; rr2(ctx, x + 2, y + 1, w - 4, h * 0.45, 5); ctx.fill();
    ctx.fillStyle = '#1f4d22'; ctx.fillRect(x + 3, y + h - 4, w - 6, 3);
  }

  function desenhaMansaoChao(ctx, x0, y0, x1, y1) {
    const M = MANSAO, e = M.estrada;
    const hit = (x, y, w, h) => x < x1 && x + w > x0 && y < y1 && y + h > y0;
    const noTerreno = hit(M.x - 24, M.y - 24, M.w + 48, M.h + 60), naEstrada = hit(e.x - 60, e.y - 8, e.w + 120, e.y1 - e.y + 16);
    if (!noTerreno && !naEstrada) return;
    ctx.save();
    const PV = paverPad(ctx);
    // ---------- estrada particular: da rodovia até o portão ----------
    if (naEstrada) {
      ctx.fillStyle = 'rgba(30,22,10,0.35)'; ctx.fillRect(e.x - 4, e.y, e.w + 8, e.y1 - e.y);
      ctx.fillStyle = PV; ctx.fillRect(e.x, e.y, e.w, e.y1 - e.y);
      ctx.fillStyle = '#8f8473'; ctx.fillRect(e.x, e.y, 4, e.y1 - e.y); ctx.fillRect(e.x + e.w - 4, e.y, 4, e.y1 - e.y);
      ctx.fillStyle = '#d9cfba'; ctx.fillRect(e.x + 4, e.y, 2, e.y1 - e.y); ctx.fillRect(e.x + e.w - 6, e.y, 2, e.y1 - e.y);
      // boca da estrada na rodovia: alarga como uma curva
      ctx.fillStyle = PV; ctx.beginPath(); ctx.moveTo(e.x - 3 * T, e.y1); ctx.quadraticCurveTo(e.x, e.y1, e.x, e.y1 - 3 * T); ctx.lineTo(e.x + e.w, e.y1 - 3 * T); ctx.quadraticCurveTo(e.x + e.w, e.y1, e.x + e.w + 3 * T, e.y1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8f8473'; ctx.fillRect(e.x - 3 * T, e.y1 - 3, 3 * T, 3); ctx.fillRect(e.x + e.w, e.y1 - 3, 3 * T, 3);
    }
    if (noTerreno) {
      // ---------- gramado: listras de corte e tufos ----------
      ctx.fillStyle = '#4e9a3a'; ctx.fillRect(M.x, M.y, M.w, M.h);
      ctx.fillStyle = '#58a844'; for (let u = 1; u < 76; u += 4) ctx.fillRect(mu(u), M.y, 2 * T, M.h);
      const ax = Math.max(M.x, x0), bx = Math.min(M.x + M.w, x1), ay = Math.max(M.y, y0), by = Math.min(M.y + M.h, y1);
      for (let yy = Math.floor(ay / 8) * 8; yy < by; yy += 8) for (let xx = Math.floor(ax / 8) * 8; xx < bx; xx += 8) {
        const h = hashM(xx, yy); if (h % 100 < 9) { ctx.fillStyle = (h >> 8) & 1 ? '#3f8a31' : '#68b84e'; ctx.fillRect(xx + ((h >> 4) & 6), yy + ((h >> 6) & 6), 2, 2); }
      }
      // sombra do muro no gramado (por dentro)
      ctx.fillStyle = 'rgba(10,40,10,0.28)'; ctx.fillRect(mu(1), mv(1), 74 * T, 14); ctx.fillRect(mu(1), mv(1), 14, 46 * T); ctx.fillRect(mu(75) - 14, mv(1), 14, 46 * T);
      // ---------- quadra de tênis ----------
      const q = M.quadra;
      ctx.fillStyle = '#2d7a4e'; ctx.fillRect(mu(q.u), mv(q.v), q.w * T, q.h * T);
      ctx.fillStyle = '#3a78b8'; ctx.fillRect(mu(q.u) + 28, mv(q.v) + 22, q.w * T - 56, q.h * T - 44);
      ctx.fillStyle = '#4a8ed0'; ctx.fillRect(mu(q.u) + 28, mv(q.v) + 22, q.w * T - 56, 6);
      ctx.fillStyle = '#e8f0f4'; const cx0 = mu(q.u) + 44, cy0 = mv(q.v) + 38, cw = q.w * T - 88, ch = q.h * T - 76;
      ctx.fillRect(cx0, cy0, cw, 2); ctx.fillRect(cx0, cy0 + ch - 2, cw, 2); ctx.fillRect(cx0, cy0, 2, ch); ctx.fillRect(cx0 + cw - 2, cy0, 2, ch); ctx.fillRect(cx0 + cw / 2 - 1, cy0, 2, ch);
      ctx.fillRect(cx0 + 44, cy0 + ch / 2 - 1, cw - 88, 2); ctx.fillRect(cx0 + 44, cy0, 2, ch); ctx.fillRect(cx0 + cw - 46, cy0, 2, ch);
      ctx.fillStyle = '#20252c'; ctx.fillRect(cx0 + cw / 2 - 3, cy0 - 4, 6, ch + 8);                              // rede
      ctx.fillStyle = '#f4f4f4'; ctx.fillRect(cx0 + cw / 2 - 1, cy0 - 4, 2, ch + 8);
      ctx.fillStyle = '#6a7078'; ctx.fillRect(mu(q.u), mv(q.v), q.w * T, 3); ctx.fillRect(mu(q.u), mv(q.v) + q.h * T - 3, q.w * T, 3);   // alambrado (fundo)
      // ---------- pavimento: alameda, rotatória, pátio, pistas ----------
      ctx.fillStyle = PV;
      const pav = (u, v, w, h) => { ctx.fillRect(mu(u), mv(v), w * T, h * T); };
      pav(35, 36, 6, 12); pav(28, 20, 21, 4); pav(33, 23, 11, 3); pav(17, 29, 14, 3); pav(5, 29, 12, 3);
      const ro = M.rot, rcx = mu(ro.u), rcy = mv(ro.v);
      ctx.beginPath(); ctx.arc(rcx, rcy, ro.R * T, 0, Math.PI * 2); ctx.arc(rcx, rcy, ro.r * T, 0, Math.PI * 2, true); ctx.fill();
      // meios-fios (bordas mais escuras)
      ctx.strokeStyle = '#8f8473'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(rcx, rcy, ro.R * T, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(rcx, rcy, ro.r * T, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#8f8473'; ctx.fillRect(mu(35), mv(37), 4, 9 * T); ctx.fillRect(mu(41) - 4, mv(37), 4, 9 * T);
      // ilha da rotatória: grama escura, sebes em anel, canteiros de flores e a fonte
      ctx.fillStyle = '#3f8a32'; ctx.beginPath(); ctx.arc(rcx, rcy, (ro.r - 0.2) * T, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2b6a2b'; ctx.lineWidth = 11; ctx.beginPath(); ctx.arc(rcx, rcy, 3.2 * T, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#3d8a3b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(rcx, rcy, 3.2 * T - 2, 0, Math.PI * 2); ctx.stroke();
      for (let k = 0; k < 36; k++) { const a = k * Math.PI * 2 / 36, rd = 3.75 * T, h = hashM(k, 9); ctx.fillStyle = ['#e8403a', '#f6d84a', '#f4f0e8', '#e868a8'][h % 4]; ctx.fillRect(Math.round(rcx + Math.cos(a) * rd) - 1, Math.round(rcy + Math.sin(a) * rd) - 1, 3, 3); }
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(rcx + 4, rcy + 5, (ro.fonte + 0.35) * T, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c9c2b3'; ctx.beginPath(); ctx.arc(rcx, rcy, (ro.fonte + 0.3) * T, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e4ded0'; ctx.beginPath(); ctx.arc(rcx - 2, rcy - 2, (ro.fonte + 0.2) * T, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3f90d4'; ctx.beginPath(); ctx.arc(rcx, rcy, ro.fonte * T - 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#62b0e8'; ctx.beginPath(); ctx.arc(rcx - 6, rcy - 7, ro.fonte * T * 0.62, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3f90d4'; ctx.beginPath(); ctx.arc(rcx + 3, rcy + 4, ro.fonte * T * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d9d2c2'; ctx.beginPath(); ctx.arc(rcx, rcy, 15, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#efe9da'; ctx.beginPath(); ctx.arc(rcx - 3, rcy - 3, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8c860'; ctx.beginPath(); ctx.arc(rcx, rcy, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff1b0'; ctx.fillRect(rcx - 2, rcy - 3, 3, 3);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + 0.2; ctx.fillStyle = '#d8f0ff'; ctx.fillRect(Math.round(rcx + Math.cos(a) * 30) - 1, Math.round(rcy + Math.sin(a) * 30) - 1, 3, 3); }   // jatos d'água
      // ---------- sebes do pátio ----------
      cerca(ctx, mu(28), mv(26.2), 4.6 * T, 22); cerca(ctx, mu(44.4), mv(26.2), 4.6 * T, 22);
      cerca(ctx, mu(22), mv(21.1), 6 * T, 18); cerca(ctx, mu(48.2), mv(21.1), 6 * T, 18);
      // ---------- heliponto ----------
      const h = M.heli, hx = mu(h.u + h.w / 2), hy = mv(h.v + h.h / 2);
      ctx.fillStyle = '#5d626b'; ctx.fillRect(mu(h.u), mv(h.v), h.w * T, h.h * T); ctx.fillStyle = '#6b707a'; ctx.fillRect(mu(h.u) + 4, mv(h.v) + 4, h.w * T - 8, h.h * T - 8);
      ctx.strokeStyle = '#f2c231'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(hx, hy, 4.1 * T, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#f4f4f4'; ctx.fillRect(hx - 30, hy - 36, 10, 72); ctx.fillRect(hx + 20, hy - 36, 10, 72); ctx.fillRect(hx - 30, hy - 5, 60, 10);
      [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([a, b]) => { ctx.fillStyle = '#ffd24a'; ctx.fillRect(mu(h.u) + 6 + a * (h.w * T - 18), mv(h.v) + 6 + b * (h.h * T - 18), 6, 6); });
      // ---------- piscina com deck, espreguiçadeiras e guarda-sóis ----------
      const p = M.piscina;
      ctx.fillStyle = '#d9cfba'; ctx.fillRect(mu(p.u - 3), mv(p.v - 1.5), (p.w + 6) * T, (p.h + 3) * T);
      ctx.fillStyle = PV; ctx.globalAlpha = 0.55; ctx.fillRect(mu(p.u - 3), mv(p.v - 1.5), (p.w + 6) * T, (p.h + 3) * T); ctx.globalAlpha = 1;
      ctx.fillStyle = '#f2eee4'; ctx.fillRect(mu(p.u) - 6, mv(p.v) - 6, p.w * T + 12, p.h * T + 12);
      ctx.fillStyle = '#35a6dc'; ctx.fillRect(mu(p.u), mv(p.v), p.w * T, p.h * T);
      ctx.fillStyle = '#4cbbe8'; for (let yy = 0; yy < p.h * 2; yy++) for (let xx = (yy % 2); xx < p.w * 2; xx += 2) ctx.fillRect(mu(p.u) + xx * 16, mv(p.v) + yy * 16, 16, 16);
      ctx.fillStyle = '#7ad2f2'; ctx.fillRect(mu(p.u) + 10, mv(p.v) + 10, 5 * T, 4); ctx.fillRect(mu(p.u) + 9 * T, mv(p.v) + 3 * T, 4 * T, 4);
      ctx.fillStyle = '#e8f6fc'; ctx.fillRect(mu(p.u), mv(p.v), p.w * T, 3);
      ctx.fillStyle = '#c8cdd2'; ctx.fillRect(mu(p.u + p.w) - 12, mv(p.v) + 20, 3, 18); ctx.fillRect(mu(p.u + p.w) - 12, mv(p.v) + 20, 10, 3);    // escada
      for (let k = 0; k < 5; k++) { const lx = mu(p.u + 1 + k * 3), ly = mv(p.v - 1.1); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(lx + 3, ly + 4, 40, 18); ctx.fillStyle = '#f4f4f4'; ctx.fillRect(lx, ly, 40, 16); ctx.fillStyle = '#2f6fb8'; ctx.fillRect(lx + 2, ly + 2, 14, 12); }
      [[p.u + 2, p.v + p.h + 0.6], [p.u + 9, p.v + p.h + 0.6], [p.u + 14, p.v + p.h + 0.6]].forEach(([u, v], k) => {
        const ux = mu(u), uy = mv(v); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(ux + 6, uy + 8, 22, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = ['#b32323', '#f2ecdc', '#b32323'][k]; ctx.beginPath(); ctx.arc(ux, uy, 22, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = ['#f2ecdc', '#b32323', '#f2ecdc'][k]; for (let s = 0; s < 4; s++) { ctx.beginPath(); ctx.moveTo(ux, uy); ctx.arc(ux, uy, 22, s * Math.PI / 2, s * Math.PI / 2 + Math.PI / 4); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = '#5a3d28'; ctx.fillRect(ux - 1, uy - 1, 3, 3);
      });
    }
    // ---------- muros de pedra, pilares e o portão ----------
    M.paredes.forEach(w => {
      const x = mu(w.u), y = mv(w.v), ww = w.w * T, hh = w.h * T;
      if (!hit(x - 20, y - 20, ww + 40, hh + 50)) return;
      muroPedra(ctx, x, y, ww, hh, w.h === 1);                                                  // só os trechos horizontais mostram a parede da frente
    });
    for (let u = 8; u < 75; u += 12) { if (u > 30 && u < 46) continue; pilar(ctx, mu(u) - 6, mv(0) - 6, 44, false); pilar(ctx, mu(u) - 6, mv(47) - 6, 44, false); }
    for (let v = 12; v < 46; v += 12) { pilar(ctx, mu(0) - 6, mv(v) - 6, 44, false); pilar(ctx, mu(75) - 6, mv(v) - 6, 44, false); }
    // pilares grandes do portão (2x2 tiles) com leão em cima
    [[33, 46], [41, 46]].forEach(([u, v], k) => {
      const x = mu(u), y = mv(v) - 8; if (!hit(x - 10, y - 10, 2 * T + 30, 2 * T + 40)) return;
      pilar(ctx, x, y, 2 * T, true);
      ctx.fillStyle = '#e8c860'; ctx.fillRect(x + 8, y + 8, 2 * T - 16, 3); ctx.fillRect(x + 8, y + 2 * T - 11, 2 * T - 16, 3);
      ctx.fillStyle = '#6a655c'; ctx.fillRect(x + 12, y + 14, 2 * T - 24, 2 * T - 28);                      // placa
      ctx.fillStyle = '#e8c860'; ctx.fillRect(x + 20, y + 22, 24, 4); ctx.fillRect(x + 20, y + 30, 24, 4); ctx.fillRect(x + 20, y + 38, 16, 4);
    });
    ctx.restore();
  }

  // cipreste visto de cima: uma gota verde-escura comprida
  function drawCipreste(ctx, t) {
    const r = t.r; ctx.save(); ctx.translate(t.x, t.y);
    ctx.fillStyle = 'rgba(0,0,10,0.30)'; ctx.beginPath(); ctx.ellipse(r * 0.55, r * 0.7, r * 0.7, r * 1.0, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#143f1e'; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.72, r * 1.08, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#1f5a2c'; ctx.beginPath(); ctx.ellipse(-r * 0.06, -r * 0.08, r * 0.6, r * 0.96, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2f7a3a'; ctx.beginPath(); ctx.ellipse(-r * 0.2, -r * 0.3, r * 0.28, r * 0.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#143f1e'; for (let k = 0; k < 5; k++) ctx.fillRect(-2 + (k % 2) * 4 - 3, -r * 0.8 + k * r * 0.4, 2, 2);
    ctx.restore();
  }

  // ---------- construções do terreno (desenhadas como prédios: telhado em cima, parede da frente embaixo) ----------
  const tijolo = (ctx, x, y, w, h, base, junta) => { ctx.fillStyle = base; ctx.fillRect(x, y, w, h); ctx.fillStyle = junta; for (let yy = y + 6; yy < y + h; yy += 8) ctx.fillRect(x, yy, w, 1); for (let yy = y, r = 0; yy < y + h; yy += 8, r++) for (let xx = x + (r % 2) * 8; xx < x + w; xx += 16) ctx.fillRect(xx, yy, 1, 6); };
  MA.torre = function (ctx, b) {
    const fh = b.fh, rh = b.h - fh, x = b.x, y = b.y, w = b.w;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 8, y + b.h - 4, w, 14);
    ctx.fillStyle = '#9a948a'; ctx.fillRect(x, y + rh, w, fh); tijolo(ctx, x, y + rh, w, fh, '#9a948a', '#837d73');
    ctx.fillStyle = '#6f6a62'; ctx.fillRect(x, y + b.h - 5, w, 5); ctx.fillStyle = '#b9b3a7'; ctx.fillRect(x, y + rh, w, 3);
    ctx.fillStyle = '#1c1a1e'; ctx.fillRect(x + w / 2 - 3, y + rh + 10, 6, 18); ctx.fillRect(x + 14, y + rh + 14, 5, 12); ctx.fillRect(x + w - 19, y + rh + 14, 5, 12);          // seteiras
    ctx.fillStyle = '#ffd86a'; ctx.fillRect(x + w / 2 - 1, y + rh + 14, 2, 8);
    // telhado de pirâmide (ardósia)
    const cx = x + w / 2, cy = y + rh / 2 + 2;
    ctx.fillStyle = '#2b2e37'; ctx.fillRect(x - 3, y - 3, w + 6, rh + 6);
    ctx.fillStyle = '#4d5361'; ctx.beginPath(); ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + w + 3, y - 3); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3b3f4a'; ctx.beginPath(); ctx.moveTo(x - 3, y - 3); ctx.lineTo(cx, cy); ctx.lineTo(x - 3, y + rh + 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#23262e'; ctx.beginPath(); ctx.moveTo(x + w + 3, y - 3); ctx.lineTo(x + w + 3, y + rh + 3); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#31343e'; ctx.beginPath(); ctx.moveTo(x - 3, y + rh + 3); ctx.lineTo(cx, cy); ctx.lineTo(x + w + 3, y + rh + 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8c860'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 7); ctx.fill();
  };
  MA.guarita = function (ctx, b) {
    const fh = b.fh, rh = b.h - fh, x = b.x, y = b.y, w = b.w;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 8, y + b.h - 4, w, 14);
    ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x, y + rh, w, fh); ctx.fillStyle = '#cdbf9e'; ctx.fillRect(x, y + b.h - 5, w, 5); ctx.fillStyle = '#f4ecd6'; ctx.fillRect(x, y + rh, w, 3);
    ctx.fillStyle = '#20262c'; ctx.fillRect(x + 12, y + rh + 8, w - 52, 18); ctx.fillStyle = '#7fb4d4'; ctx.fillRect(x + 14, y + rh + 10, w - 56, 14); ctx.fillStyle = '#b9dcec'; ctx.fillRect(x + 16, y + rh + 12, 14, 4);
    ctx.fillStyle = '#3a2a1e'; ctx.fillRect(x + w - 34, y + rh + 8, 22, fh - 13); ctx.fillStyle = '#e8c860'; ctx.fillRect(x + w - 16, y + rh + 22, 3, 3);
    ctx.fillStyle = '#8a1c1c'; ctx.fillRect(x + 12, y + rh + 28, w - 52, 5); ctx.fillStyle = '#f2ecdc'; for (let k = 0; k < (w - 52) / 12; k++) ctx.fillRect(x + 12 + k * 12, y + rh + 28, 6, 5);   // toldo listrado
    ctx.fillStyle = '#6a2418'; ctx.fillRect(x - 5, y - 2, w + 10, rh + 5); ctx.fillStyle = '#a8442c'; ctx.fillRect(x - 3, y, w + 6, rh);
    ctx.fillStyle = '#c4583a'; ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + w + 3, y); ctx.lineTo(x + w / 2, y + rh / 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8a361f'; ctx.beginPath(); ctx.moveTo(x + w + 3, y); ctx.lineTo(x + w + 3, y + rh); ctx.lineTo(x + w / 2, y + rh / 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a2e1a'; ctx.beginPath(); ctx.moveTo(x - 3, y + rh); ctx.lineTo(x + w + 3, y + rh); ctx.lineTo(x + w / 2, y + rh / 2); ctx.closePath(); ctx.fill();
  };
  MA.garagem = function (ctx, b) {
    const fh = b.fh, rh = b.h - fh, x = b.x, y = b.y, w = b.w;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 8, y + b.h - 4, w, 14);
    tijolo(ctx, x, y + rh, w, fh, '#6e2c26', '#552019');
    ctx.fillStyle = '#4b1a16'; ctx.fillRect(x, y + b.h - 5, w, 5); ctx.fillStyle = '#f2ecdc'; ctx.fillRect(x, y + rh, w, 4);
    const dw = 3 * T - 14, gap = (w - 3 * dw) / 4;
    for (let k = 0; k < 3; k++) {
      const dx = x + gap + k * (dw + gap), dy = y + rh + 8;
      ctx.fillStyle = '#f2ecdc'; ctx.fillRect(dx - 4, dy - 3, dw + 8, fh - 12); ctx.fillStyle = '#d8d4cc'; ctx.fillRect(dx, dy, dw, fh - 18);
      ctx.fillStyle = '#b3aea4'; for (let yy = dy + 6; yy < dy + fh - 20; yy += 7) ctx.fillRect(dx, yy, dw, 1);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(dx, dy, dw, 2); ctx.fillStyle = '#3a3a3f'; ctx.fillRect(dx + dw / 2 - 6, dy + fh - 22, 12, 3);
    }
    ctx.fillStyle = '#23262e'; ctx.fillRect(x - 4, y - 3, w + 8, rh + 6); ctx.fillStyle = '#3b3f4a'; ctx.fillRect(x - 2, y - 1, w + 4, rh + 2); ctx.fillStyle = '#4d5361'; ctx.fillRect(x - 2, y - 1, w + 4, 5);
    ctx.fillStyle = '#31343e'; ctx.fillRect(x + 20, y + 14, w - 40, 2); ctx.fillRect(x + 20, y + rh - 14, w - 40, 2);
    ctx.fillStyle = '#e8c860'; ctx.font = 'bold 9px Arial'; ctx.textAlign = 'center'; ctx.fillText('GARAGEM', x + w / 2, y + rh / 2 + 4); ctx.textAlign = 'left';
  };
