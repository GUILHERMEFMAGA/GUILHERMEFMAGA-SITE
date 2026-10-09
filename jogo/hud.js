/* ============================================================
   hud.js — interface no estilo dos GTA antigos:
   dinheiro, policiais (procurado), vida, legenda amarela com pager,
   minimapa, setas de missão, avisos na tela
   ============================================================ */
(function (G) {
  'use strict';
  const W = G.world, TAU = Math.PI * 2;
  const FONT = '"Trebuchet MS","Arial Black",Impact,sans-serif';
  let mini = null; const MINI_SCALE = 12;

  function txt(ctx, s, x, y, size, col, align, stroke) {
    ctx.font = 'bold ' + size + 'px ' + FONT;
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, size / 4); ctx.strokeStyle = stroke || '#000';
    ctx.strokeText(s, x, y); ctx.fillStyle = col || '#ffe04a'; ctx.fillText(s, x, y);
  }
  function wrapText(ctx, s, maxW, size) {
    ctx.font = 'bold ' + size + 'px ' + FONT;
    const words = s.split(' '), lines = []; let cur = '';
    words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur); return lines;
  }
  const money = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  function heart(ctx, x, y, s, full) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(-12, -2, -6, -10, 0, -4); ctx.bezierCurveTo(6, -10, 12, -2, 0, 6);
    ctx.fillStyle = full ? '#e3262e' : '#3a1a1e'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#000'; ctx.stroke();
    if (full) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-5, -4, 3, 2); }
    ctx.restore();
  }
  function cop(ctx, x, y, col) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = col; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 2, 13, 0, TAU); ctx.fillStyle = '#e8b890'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1c2f6b'; ctx.fillRect(-14, -8, 28, 9); ctx.strokeRect(-14, -8, 28, 9);
    ctx.beginPath(); ctx.arc(0, -8, 11, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2c231'; ctx.fillRect(-3, -14, 6, 6);
    ctx.fillStyle = '#000'; ctx.fillRect(-7, 3, 4, 3); ctx.fillRect(3, 3, 4, 3); ctx.fillRect(-3, 10, 6, 2);
    ctx.restore();
  }
  function pager(ctx, x, y) {
    ctx.fillStyle = '#16181c'; ctx.fillRect(x, y, 40, 30); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(x, y, 40, 30);
    ctx.fillStyle = '#7bb35a'; ctx.fillRect(x + 4, y + 4, 32, 12);
    ctx.fillStyle = '#2b4a22'; for (let k = 0; k < 4; k++) ctx.fillRect(x + 6 + k * 7, y + 8, 5, 4);
    ctx.fillStyle = '#444'; for (let a = 0; a < 3; a++) for (let b = 0; b < 4; b++) ctx.fillRect(x + 5 + b * 8, y + 19 + a * 3.5, 6, 2.5);
  }

  function drawMini(ctx, S, time) {
    if (!mini) mini = W.makeMini(MINI_SCALE);
    const w = 170, h = 120, x = 800 - w - 10, y = 600 - h - 10;
    const P = S.player, ref = P.car || P;
    const cx = ref.x / MINI_SCALE, cy = ref.y / MINI_SCALE;
    ctx.save();
    ctx.fillStyle = '#000'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = '#111'; ctx.fillRect(x, y, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(mini, cx - w / 2, cy - h / 2, w, h, x, y, w, h);
    const tm = (wx, wy) => [x + w / 2 + (wx - ref.x) / MINI_SCALE, y + h / 2 + (wy - ref.y) / MINI_SCALE];
    const dot = (wx, wy, col, r) => { const [px, py] = tm(wx, wy); if (px < x || px > x + w || py < y || py > y + h) return false; ctx.fillStyle = col; ctx.fillRect(px - r, py - r, r * 2, r * 2); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(px - r, py - r, r * 2, r * 2); return true; };
    G.missions.PHONES.forEach(p => dot(p.x, p.y, G.missions.active ? '#4a88ff' : '#ffe04a', 2.5));
    const po = G.missions.POI; dot(po.garage.x, po.garage.y, '#6fd0ff', 2.5); dot(po.oficina.x, po.oficina.y, '#ff9a3d', 2.5); dot(po.hospital.x, po.hospital.y, '#ff6b6b', 2.5); dot(po.armas.x, po.armas.y, '#ff4fd8', 2.5);
    G.world.places.forEach(pl => dot(pl.x, pl.y, pl.cor, pl.tipo === 'loja' ? 1.7 : 2.5));
    G.world.casas.forEach(c => { if (c.semPorta) return; const mine = S.save.casas && S.save.casas[c.id]; if (mine) dot(c.x, c.y, '#9dff9d', 2); else if (c.venda) dot(c.x, c.y, '#ff4a4a', 1.5); });   // casas suas (verde) e à venda (vermelho)
    if (S.guia) { const gp = G.world.places.find(q => q.id === S.guia.id); if (gp) dot(gp.x, gp.y, Math.floor(time * 5) % 2 ? '#ffffff' : gp.cor, 4); }
    S.cars.forEach(c => { if (c.kind === 'police' && !c.dead && c.mode !== 'wander') dot(c.x, c.y, Math.floor(time * 6) % 2 ? '#ff3030' : '#3a5bff', 2); });
    S.peds.forEach(p => { if ((p.kind === 'cop' || p.target) && p.state !== 'dead') dot(p.x, p.y, p.kind === 'cop' ? '#5a7bff' : '#ff3030', 1.5); });
    S.pickups.forEach(k => dot(k.x, k.y, k.type === 'cash' ? '#3fdc4a' : '#ffffff', 1));
    const m = G.missions.active;
    if (m) m.markers.forEach(mk => {
      if (mk.small) return;
      const [px, py] = tm(mk.x, mk.y);
      const ex = Math.max(x + 5, Math.min(x + w - 5, px)), ey = Math.max(y + 5, Math.min(y + h - 5, py));
      ctx.fillStyle = Math.floor(time * 3) % 2 ? '#ffd21f' : '#fff'; ctx.beginPath(); ctx.arc(ex, ey, 4, 0, TAU); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke();
    });
    // jogador
    ctx.translate(x + w / 2, y + h / 2); ctx.rotate(P.car ? P.car.a : (P.h || 0));
    ctx.fillStyle = Math.floor(time * 4) % 2 ? '#ff2b2b' : '#ffffff';
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4, 4); ctx.lineTo(-4, 4); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }

  // seta apontando para o objetivo
  function drawArrow(ctx, S, time) {
    const m = G.missions.active; if (!m || !m.markers.length) return;
    const mk = m.markers[0], cam = S.cam;
    const sx = (mk.x - cam.x) * cam.z + 400, sy = (mk.y - cam.y) * cam.z + 300;
    const P = S.player, ref = P.car || P;
    const px = (ref.x - cam.x) * cam.z + 400, py = (ref.y - cam.y) * cam.z + 300;
    const d = Math.hypot(sx - px, sy - py);
    if (d < 140) return;
    const ang = Math.atan2(sy - py, sx - px);
    const r = 92 + Math.sin(time * 6) * 4;
    ctx.save(); ctx.translate(px + Math.cos(ang) * r, py + Math.sin(ang) * r); ctx.rotate(ang);
    ctx.fillStyle = '#ffd21f'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -11); ctx.lineTo(-3, 0); ctx.lineTo(-8, 11); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawWeapon(ctx, S, P) {
    const C = G.combat, w = C.WEAPONS[P.weapon] || C.WEAPONS.fist;
    const x = 650, y = 98, bw = 140, bh = 44;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x, y, bw, bh); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(x, y, bw, bh);
    // ícone simples
    ctx.save(); ctx.translate(x + 26, y + 22); ctx.fillStyle = '#ddd'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
    if (w.id === 'fist') { ctx.fillStyle = '#e2b48a'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill(); ctx.stroke(); }
    else if (w.id === 'bat') { ctx.rotate(-0.6); ctx.fillStyle = '#c8955a'; ctx.fillRect(-16, -3, 32, 6); ctx.fillRect(6, -5, 10, 10); ctx.strokeRect(-16, -3, 32, 6); }
    else if (w.id === 'pistol') { ctx.fillStyle = '#16181c'; ctx.fillRect(-14, -6, 24, 8); ctx.fillRect(-12, 1, 8, 12); ctx.fillStyle = '#8a8f99'; ctx.fillRect(2, -6, 8, 3); }
    else if (w.id === 'smg') { ctx.fillStyle = '#16181c'; ctx.fillRect(-16, -6, 32, 8); ctx.fillRect(-4, 1, 6, 13); ctx.fillRect(-14, 1, 6, 8); }
    else if (w.id === 'shotgun') { ctx.fillStyle = '#6a3f1d'; ctx.fillRect(-18, -2, 12, 6); ctx.fillStyle = '#222'; ctx.fillRect(-8, -4, 28, 4); ctx.fillRect(-8, 0, 24, 3); }
    else { ctx.fillStyle = '#3f5a2a'; ctx.beginPath(); ctx.arc(0, 2, 9, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ccc'; ctx.fillRect(-2, -10, 4, 6); }
    ctx.restore();
    txt(ctx, w.name.length > 12 ? w.name.slice(0, 5) + '.' : w.name, x + 50, y + 19, 12, '#fff', 'left');
    if (!w.melee) { const n = C.ammoOf(S, w.id); txt(ctx, 'x' + n, x + 50, y + 37, 16, n > 0 ? '#ffe04a' : '#ff5555', 'left'); }
    else txt(ctx, 'corpo a corpo', x + 50, y + 37, 11, '#bbb', 'left');
  }

  function draw(ctx, S, time) {
    drawArrow(ctx, S, time);
    const P = S.player;
    // --- dinheiro ---
    const mult = G.missions.mult(S.save.done);
    const ms = money(S.save.money), mm = 'x' + (Math.round(mult * 10) / 10);
    ctx.font = 'bold 22px ' + FONT; const mw = ctx.measureText(mm).width;
    txt(ctx, mm, 790, 40, 22, '#ffe04a', 'right');
    ctx.font = 'bold 34px ' + FONT; const nw = ctx.measureText(ms).width;
    txt(ctx, ms, 790 - mw - 10, 40, 34, '#ffe04a', 'right');
    txt(ctx, '$', 790 - mw - 10 - nw - 8, 40, 34, '#3fdc4a', 'right');
    txt(ctx, G.missions.rank(S.save.done).toUpperCase(), 790, 62, 14, '#ffffff', 'right');
    if (S.save.done >= G.missions.TOTAL) txt(ctx, S.save.money >= G.missions.GOAL ? 'META CUMPRIDA' : 'META: $' + money(G.missions.GOAL), 790, 80, 13, '#9ff0ff', 'right');
    // --- corações ---
    const hearts = Math.ceil(P.hp / 20);
    for (let k = 0; k < 5; k++) heart(ctx, 26 + k * 28, 26, 1.25, k < hearts);
    // colete
    if (P.armor > 0) { ctx.fillStyle = '#000'; ctx.fillRect(14, 44 + (P.car ? 16 : 0), 136, 10); ctx.fillStyle = '#3a78d8'; ctx.fillRect(16, 46 + (P.car ? 16 : 0), 132 * P.armor / 100, 6); txt(ctx, 'COLETE', 158, 53 + (P.car ? 16 : 0), 10, '#9ec4ff', 'left'); }
    // arma atual (a pé)
    if (!P.car) drawWeapon(ctx, S, P);
    // vida do carro
    if (P.car) { ctx.fillStyle = '#000'; ctx.fillRect(14, 44, 136, 12); ctx.fillStyle = P.car.hp > 50 ? '#3fdc4a' : P.car.hp > 25 ? '#ffd21f' : '#ff3030'; ctx.fillRect(16, 46, 132 * P.car.hp / 100, 8); txt(ctx, 'CARRO', 158, 55, 11, '#fff', 'left'); }
    // --- procurado ---
    const lv = S.heatLevel;
    for (let k = 0; k < 5; k++) {
      if (k < lv) { const blink = lv > 0 && (S.chasers > 0) && Math.floor(time * 4) % 2 === 0; cop(ctx, 400 - 2.5 * 34 + 17 + k * 34, 28, blink ? '#fff' : '#fff'); }
    }
    if (S.bustT > 0.2) { ctx.fillStyle = '#000'; ctx.fillRect(340, 56, 120, 10); ctx.fillStyle = '#3a6bff'; ctx.fillRect(342, 58, 116 * Math.min(1, S.bustT / 3), 6); txt(ctx, 'PRESO!', 400, 82, 13, '#9ab6ff', 'center'); }
    // --- missão ---
    const m = G.missions.active;
    let ty = 92;
    if (m) {
      txt(ctx, m.def.name.toUpperCase(), 12, ty, 15, '#ffd21f'); ty += 18;
      if (m.hint) { txt(ctx, m.hint, 12, ty, 13, '#fff'); ty += 16; }
      if (m.timeLeft != null) { const t = Math.max(0, m.timeLeft); txt(ctx, 'TEMPO ' + Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0'), 12, ty, 18, t < 15 ? '#ff5555' : '#fff'); ty += 20; }
      if (m.type === 'taxi' && m.stage === 1) { txt(ctx, 'CONFORTO', 12, ty, 13, '#fff'); ctx.fillStyle = '#000'; ctx.fillRect(92, ty - 11, 104, 13); ctx.fillStyle = m.comfort > 50 ? '#3fdc4a' : '#ff6b3a'; ctx.fillRect(94, ty - 9, Math.max(0, m.comfort), 9); ty += 18; }
      if (m.type === 'race' && m.racing) {
        const place = 1 + m.rivals.filter(r => r.finished || r.cp > m.cp).length;
        txt(ctx, place + 'º LUGAR   PONTO ' + Math.min(m.cp + 1, m.cps.length) + '/' + m.cps.length, 12, ty, 15, '#fff'); ty += 18;
      }
    } else {
      txt(ctx, 'Procure um telefone amarelo no mapa', 12, ty, 13, '#ffffff');
    }
    // --- rádio ---
    if (S.radioT > 0) txt(ctx, '♪ ' + G.snd.stationName(), 400, 70, 16, '#ff9ae0', 'center');
    // --- mensagem (legenda) ---
    if (S.msg && S.msg.t > 0) {
      const a = Math.min(1, S.msg.t * 2);
      ctx.save(); ctx.globalAlpha = a;
      const lines = wrapText(ctx, S.msg.text.toUpperCase(), 520, 17);
      const bh = lines.length * 21 + 10;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(60, 594 - bh, 560, bh);
      lines.forEach((l, i) => txt(ctx, l, 68, 594 - bh + 22 + i * 21, 17, '#ffe04a'));
      pager(ctx, 12, 594 - 30);
      ctx.restore();
    } else pager(ctx, 12, 594 - 30);
    // --- dica de interação ---
    if (S.prompt) txt(ctx, S.prompt, 400, 455, 18, '#ffffff', 'center');
    // --- minimapa ---
    drawMini(ctx, S, time);
    // --- faixa grande ---
    if (S.ban && S.ban.t > 0) {
      const b = S.ban, a = Math.min(1, b.t * 2.5, (b.dur - b.t) * 6 + 0.01);
      ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, a)); const sc = 1 + 0.15 * Math.max(0, 1 - (b.dur - b.t) * 5);
      ctx.translate(400, 250); ctx.scale(sc, sc);
      txt(ctx, b.title, 0, 0, 54, b.fail ? '#ff5a5a' : '#ffd21f', 'center');
      txt(ctx, b.sub, 0, 34, 24, '#fff', 'center');
      ctx.restore();
    }
  }

  G.hud = { draw, txt };
})(window.G = window.G || {});
