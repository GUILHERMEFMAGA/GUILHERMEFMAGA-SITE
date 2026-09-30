/* ============================================================
   sprites.js — desenha carros e pedestres por código,
   vistos de cima, com brilho suave e contorno (estilo GTA 1).
   ============================================================ */
(function (G) {
  'use strict';
  const CAR_W = 40, CAR_L = 82;
  const SS = 2;           // resolução extra do sprite
  const PAD = 8;

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((f - r) * p + r); g = Math.round((f - g) * p + g); b = Math.round((f - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function bodyPath(ctx, W, L) {
    ctx.beginPath();
    ctx.moveTo(-W / 2 + 9, -L / 2); ctx.lineTo(W / 2 - 9, -L / 2);
    ctx.quadraticCurveTo(W / 2, -L / 2, W / 2, -L / 2 + 11);
    ctx.lineTo(W / 2, L / 2 - 10); ctx.quadraticCurveTo(W / 2, L / 2, W / 2 - 7, L / 2);
    ctx.lineTo(-W / 2 + 7, L / 2); ctx.quadraticCurveTo(-W / 2, L / 2, -W / 2, L / 2 - 10);
    ctx.lineTo(-W / 2, -L / 2 + 11); ctx.quadraticCurveTo(-W / 2, -L / 2, -W / 2 + 9, -L / 2);
    ctx.closePath();
  }

  // kind: coupe | sedan | taxi | police | wreck
  function makeCarSprite(kind, color) {
    const W = CAR_W, L = CAR_L;
    const c = document.createElement('canvas');
    c.width = (W + PAD * 2) * SS; c.height = (L + PAD * 2) * SS;
    const ctx = c.getContext('2d');
    ctx.scale(SS, SS); ctx.translate(c.width / SS / 2, c.height / SS / 2);
    const wreck = kind === 'wreck';
    const base = wreck ? '#2b2b2f' : (kind === 'police' ? '#f1f1f3' : kind === 'taxi' ? '#f2c42a' : color);
    const glass = wreck ? '#111' : '#1f2a33';

    // rodas
    ctx.fillStyle = '#0d0d0d';
    [[-1, -L / 2 + 12], [1, -L / 2 + 12], [-1, L / 2 - 26], [1, L / 2 - 26]].forEach(([sx, y]) => {
      ctx.fillRect(sx * (W / 2) - (sx < 0 ? 3 : 0) - 0, y, 3, 14);
    });
    // corpo com degradê lateral
    bodyPath(ctx, W, L);
    const g = ctx.createLinearGradient(-W / 2, 0, W / 2, 0);
    g.addColorStop(0, shade(base, -0.3)); g.addColorStop(0.25, shade(base, 0.12)); g.addColorStop(0.5, shade(base, 0.22));
    g.addColorStop(0.75, shade(base, 0.05)); g.addColorStop(1, shade(base, -0.35));
    ctx.fillStyle = g; ctx.fill();

    if (kind === 'police') {
      // capô e porta-malas azuis, faixa azul nas portas
      ctx.save(); bodyPath(ctx, W, L); ctx.clip();
      ctx.fillStyle = '#2f55b0';
      ctx.fillRect(-W / 2, -L / 2, W, 20); ctx.fillRect(-W / 2, L / 2 - 22, W, 22);
      ctx.fillRect(-W / 2, -4, 5, 26); ctx.fillRect(W / 2 - 5, -4, 5, 26);
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-W / 2 + 6, -L / 2, 7, 20);
      ctx.restore();
    }
    // detalhes do capô
    if (!wreck) {
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-W * 0.2, -L / 2 + 4); ctx.lineTo(-W * 0.22, -L / 2 + 22); ctx.moveTo(W * 0.2, -L / 2 + 4); ctx.lineTo(W * 0.22, -L / 2 + 22); ctx.stroke();
      if (kind === 'coupe') { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-6, -L / 2 + 8, 12, 3); ctx.fillRect(-6, -L / 2 + 13, 12, 2); }
    }
    // cabine (vidros)
    const cabT = kind === 'coupe' ? -L / 2 + 19 : -L / 2 + 21, cabB = kind === 'coupe' ? L / 2 - 23 : L / 2 - 19;
    ctx.fillStyle = glass;
    ctx.beginPath();
    ctx.moveTo(-W * 0.34, cabT); ctx.lineTo(W * 0.34, cabT); ctx.lineTo(W * 0.42, cabT + 12);
    ctx.lineTo(W * 0.42, cabB - 10); ctx.lineTo(W * 0.32, cabB); ctx.lineTo(-W * 0.32, cabB);
    ctx.lineTo(-W * 0.42, cabB - 10); ctx.lineTo(-W * 0.42, cabT + 12); ctx.closePath(); ctx.fill();
    if (!wreck) { ctx.fillStyle = 'rgba(150,200,255,0.22)'; ctx.beginPath(); ctx.moveTo(-W * 0.3, cabT + 2); ctx.lineTo(-W * 0.05, cabT + 2); ctx.lineTo(-W * 0.16, cabT + 11); ctx.lineTo(-W * 0.36, cabT + 11); ctx.fill(); }
    // teto
    const rT = cabT + 10, rB = cabB - 9;
    const rg = ctx.createLinearGradient(-W * 0.36, 0, W * 0.36, 0);
    rg.addColorStop(0, shade(base, -0.2)); rg.addColorStop(0.35, shade(base, 0.3)); rg.addColorStop(1, shade(base, -0.15));
    ctx.fillStyle = rg; G.world ? G.world.rrect(ctx, -W * 0.36, rT, W * 0.72, rB - rT, 4) : ctx.rect(-W * 0.36, rT, W * 0.72, rB - rT); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    if (kind === 'taxi') {
      ctx.fillStyle = '#fff'; ctx.fillRect(-8, (rT + rB) / 2 - 4, 16, 8); ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.strokeRect(-8, (rT + rB) / 2 - 4, 16, 8);
      ctx.fillStyle = '#111'; for (let k = 0; k < 4; k++) ctx.fillRect(-8 + k * 4, (rT + rB) / 2 - 4 + (k % 2) * 4, 4, 4);
      ctx.fillStyle = '#111'; ctx.fillRect(-W / 2 + 3, L / 2 - 26, W - 6, 2); // faixa
    }
    if (kind === 'coupe') { // faixas esportivas nas laterais
      ctx.fillStyle = 'rgba(40,0,0,0.45)'; ctx.fillRect(-W / 2 + 2, cabT + 4, 2, cabB - cabT); ctx.fillRect(W / 2 - 4, cabT + 4, 2, cabB - cabT);
    }
    if (wreck) { ctx.fillStyle = '#000'; for (let k = 0; k < 7; k++) { ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.arc(-10 + (k * 7) % 22, -28 + k * 9, 4 + k % 3, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
    // faróis, lanternas e retrovisores
    if (!wreck) {
      ctx.fillStyle = '#fff7b0'; ctx.fillRect(-W / 2 + 3, -L / 2 + 1, 8, 3); ctx.fillRect(W / 2 - 11, -L / 2 + 1, 8, 3);
      ctx.fillStyle = '#d81f1f'; ctx.fillRect(-W / 2 + 3, L / 2 - 4, 9, 3); ctx.fillRect(W / 2 - 12, L / 2 - 4, 9, 3);
      ctx.fillStyle = shade(base, -0.35); ctx.fillRect(-W / 2 - 3, cabT + 4, 3, 5); ctx.fillRect(W / 2, cabT + 4, 3, 5);
    }
    // contorno
    bodyPath(ctx, W, L); ctx.strokeStyle = '#0c0c10'; ctx.lineWidth = 2; ctx.stroke();
    return c;
  }

  const cache = {};
  function carSprite(kind, color) {
    const k = kind + color;
    return cache[k] || (cache[k] = makeCarSprite(kind, color));
  }

  function drawCarShadow(ctx, car) {
    ctx.save(); ctx.translate(car.x + 5, car.y + 7); ctx.rotate(car.a);
    ctx.fillStyle = 'rgba(0,0,10,0.34)';
    G.world.rrect(ctx, -CAR_W / 2, -CAR_L / 2, CAR_W, CAR_L, 10); ctx.fill();
    ctx.restore();
  }
  function drawCar(ctx, car, time) {
    drawCarShadow(ctx, car);
    const sp = carSprite(car.dead ? 'wreck' : car.kind, car.color);
    ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.a);
    ctx.drawImage(sp, -sp.width / SS / 2, -sp.height / SS / 2, sp.width / SS, sp.height / SS);
    if (car.kind === 'police' && !car.dead && car.siren) {
      const on = Math.floor(time * 8) % 2 === 0;
      ctx.fillStyle = on ? '#ff2a2a' : '#3b3bff';
      ctx.fillRect(-9, -5, 8, 6); ctx.fillStyle = on ? '#3b3bff' : '#ff2a2a'; ctx.fillRect(1, -5, 8, 6);
      ctx.fillStyle = '#222'; ctx.fillRect(-9, 1, 18, 2);
    }
    // amassados, arranhões e furos de bala
    if (!car.dead && car.hp < 100) {
      const d = 1 - car.hp / 100;
      bodyPath(ctx, CAR_W, CAR_L); ctx.fillStyle = 'rgba(25,12,0,' + (d * 0.42).toFixed(3) + ')'; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1;
      const n = Math.floor(d * 9);
      for (let k = 0; k < n; k++) { // rabiscos fixos por carro (usam o id como semente)
        const r1 = Math.sin(car.id * 12.9898 + k * 78.233) * 43758.5453, a = (r1 - Math.floor(r1)) - 0.5;
        const r2 = Math.sin(car.id * 39.346 + k * 11.135) * 24634.6345, b = (r2 - Math.floor(r2)) - 0.5;
        ctx.beginPath(); ctx.moveTo(a * CAR_W * 0.9, b * CAR_L * 0.9); ctx.lineTo(a * CAR_W * 0.9 + 5, b * CAR_L * 0.9 + 3 - k % 3 * 3); ctx.stroke();
      }
      if (car.hp < 55) { ctx.strokeStyle = 'rgba(230,240,255,0.55)'; ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(2, -14); ctx.moveTo(-2, -11); ctx.lineTo(-10, -16); ctx.moveTo(3, -9); ctx.lineTo(9, -5); ctx.stroke(); }
    }
    if (car.holes) car.holes.forEach(h => { ctx.fillStyle = '#050505'; ctx.beginPath(); ctx.arc(h.x, h.y, 1.5, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.6; ctx.stroke(); });
    ctx.restore();
    if (car.kind === 'police' && !car.dead && car.siren) {
      const on = Math.floor(time * 8) % 2 === 0;
      const gx = car.x + Math.cos(car.a) * (on ? -6 : 6), gy = car.y + Math.sin(car.a) * (on ? -6 : 6);
      const gr = ctx.createRadialGradient(gx, gy, 2, gx, gy, 46);
      gr.addColorStop(0, on ? 'rgba(255,40,40,0.55)' : 'rgba(60,60,255,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.fillRect(gx - 46, gy - 46, 92, 92);
    }
    if (car.brakeLight) {
      ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.a);
      ctx.fillStyle = 'rgba(255,40,40,0.9)'; ctx.fillRect(-CAR_W / 2 + 3, CAR_L / 2 - 4, 9, 3); ctx.fillRect(CAR_W / 2 - 12, CAR_L / 2 - 4, 9, 3);
      ctx.restore();
    }
  }

  // ---------- Pedestres ----------
  const SHIRTS = ['#d33a3a', '#3a7ad3', '#3aa85a', '#e0b32a', '#8a4fc2', '#e8e8e8', '#e07a2a', '#2a8a8a', '#c2478a'];
  const SKINS = ['#f1c9a0', '#d9a06e', '#a86d42', '#7a4b2a', '#5a3620'];
  const HAIRS = ['#1a1208', '#3a2412', '#7a5a2a', '#c9a24a', '#111'];

  function pedHead(ctx, p) {
    ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(0, -1, 4.1, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = p.hair; ctx.beginPath(); ctx.arc(0, 0.2, 3.9, 0.15 * Math.PI, 0.85 * Math.PI); ctx.fill();
    if (p.cap === 'cop') { ctx.fillStyle = '#14224f'; ctx.beginPath(); ctx.arc(0, -0.6, 4.4, 0, 7); ctx.fill(); ctx.fillStyle = '#0a0a10'; ctx.fillRect(-3.2, -5.6, 6.4, 1.8); ctx.fillStyle = '#f2c231'; ctx.fillRect(-0.8, -3.2, 1.6, 1.6); }
    else if (p.cap === 'swat') { ctx.fillStyle = '#1a1c22'; ctx.beginPath(); ctx.arc(0, -0.6, 4.8, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-2.6, -3.8, 2.4, 1.4); ctx.fillStyle = '#0c0d10'; ctx.fillRect(-3.4, -4.6, 6.8, 2); }
    else if (p.player) { ctx.fillStyle = '#000'; ctx.fillRect(-3, -3.6, 6, 1.6); }
  }

  // corpo deitado (pedestre caído ou morto)
  function drawLying(ctx, p, k, dead) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(3, 4, 12, 7, 0, 0, 7); ctx.fill();
    if (dead) { ctx.fillStyle = '#20202a'; ctx.beginPath(); ctx.ellipse(-2.6, 8, 2.4, 5, 0.1, 0, 7); ctx.ellipse(2.8, 8.5, 2.4, 5, -0.12, 0, 7); ctx.fill(); }
    ctx.fillStyle = p.shirt; ctx.beginPath(); ctx.ellipse(0, 0, 6 + 2 * k, 10 - 2 * k, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.stroke();
    if (dead) { ctx.fillStyle = 'rgba(120,6,10,0.9)'; ctx.beginPath(); ctx.ellipse(1, -1, 3.4, 4.6, 0.4, 0, 7); ctx.fill(); ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(-8.2, 1, 2, 0, 7); ctx.arc(8.4, -1.5, 2, 0, 7); ctx.fill(); }
    ctx.save(); ctx.translate(0, -9); ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
    ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill(); ctx.stroke();
    if (p.cap === 'cop') { ctx.fillStyle = '#14224f'; ctx.beginPath(); ctx.arc(0, 0.4, 4.3, 0, 7); ctx.fill(); }
    else if (p.cap === 'swat') { ctx.fillStyle = '#1a1c22'; ctx.beginPath(); ctx.arc(0, 0.4, 4.7, 0, 7); ctx.fill(); }
    else { ctx.fillStyle = p.hair; ctx.beginPath(); ctx.arc(0, 1.5, 3.6, 0, 7); ctx.fill(); }
    if (dead) { ctx.fillStyle = 'rgba(120,6,10,0.85)'; ctx.beginPath(); ctx.arc(2, 1, 1.8, 0, 7); ctx.fill(); }
    ctx.restore();
  }

  function drawHeld(ctx, p, wid) {
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
    if (wid === 'pistol' || wid === 'smg' || wid === 'shotgun') {
      ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(-2.4, -6.5, 2, 0, 7); ctx.arc(2.4, -6.5, 2, 0, 7); ctx.fill();
      if (wid === 'pistol') { ctx.fillStyle = '#111'; ctx.fillRect(-1.3, -15, 2.6, 9); ctx.fillStyle = '#55585f'; ctx.fillRect(-0.6, -15, 1.2, 7); }
      else if (wid === 'smg') { ctx.fillStyle = '#16181c'; ctx.fillRect(-1.6, -18, 3.2, 12); ctx.fillStyle = '#3a3d44'; ctx.fillRect(-0.8, -9, 1.6, 6); }
      else { ctx.fillStyle = '#222'; ctx.fillRect(-1.3, -22, 2.6, 16); ctx.fillStyle = '#6a3f1d'; ctx.fillRect(-1.9, -8, 3.8, 5); }
      if (p.flashT > 0) { const y = wid === 'pistol' ? -17 : wid === 'smg' ? -20 : -24; ctx.fillStyle = '#fff2a0'; ctx.strokeStyle = '#ff9a1e'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.5 : 7, a = i * Math.PI / 5; ctx.lineTo(Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
    } else if (wid === 'bat') {
      const swing = p.punchT > 0 ? (1 - p.punchT / 0.4) : -1;
      ctx.save(); ctx.translate(5, -1);
      ctx.rotate(swing < 0 ? 0.7 : -1.6 + swing * 3.2);
      ctx.fillStyle = '#c8955a'; ctx.fillRect(-1.6, -17, 3.2, 17); ctx.fillStyle = '#9a6a38'; ctx.fillRect(-2.2, -17, 4.4, 7); ctx.strokeRect(-1.6, -17, 3.2, 17);
      ctx.restore();
      ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(5, -1, 2, 0, 7); ctx.fill();
    } else if (wid === 'grenade') {
      ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(4, -4, 2, 0, 7); ctx.fill(); ctx.fillStyle = '#3f5a2a'; ctx.beginPath(); ctx.arc(4, -7, 2.6, 0, 7); ctx.fill(); ctx.stroke();
    }
  }

  function drawPed(ctx, p, time) {
    const r = 7;
    if (p.state === 'dead') {
      if (p.pv == null) p.pv = Math.floor(Math.random() * 6);
      const pool = G.combat ? G.combat.blobSprite(p.pv, p.corpseT > 25) : null;
      ctx.save(); ctx.translate(p.x, p.y);
      if (pool) { const k = 7 + 15 * (p.pool || 0); ctx.save(); ctx.rotate(p.pv); ctx.globalAlpha = 0.92; ctx.drawImage(pool, -k, -k, k * 2, k * 2); ctx.restore(); }
      ctx.rotate(p.h); drawLying(ctx, p, 1, true);
      ctx.restore();
      return;
    }
    if (p.state === 'down') {
      const k = Math.min(1, p.downT / 0.25);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.h);
      drawLying(ctx, p, k, false);
      ctx.restore();
      return;
    }
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.beginPath(); ctx.ellipse(3, 4, r + 1, r - 1, 0, 0, 7); ctx.fill();
    ctx.rotate(p.h);
    // pés (animação de caminhada)
    const ph = Math.sin(p.walk) * 4;
    ctx.fillStyle = '#1b1b22';
    ctx.beginPath(); ctx.arc(-3.2, -ph - 1, 2.3, 0, 7); ctx.arc(3.2, ph - 1, 2.3, 0, 7); ctx.fill();
    // ombros / camisa
    ctx.fillStyle = p.shirt; ctx.beginPath(); ctx.ellipse(0, 1, 7.5, 4.6, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.stroke();
    if (p.player) { // camisa havaiana laranja e azul
      ctx.fillStyle = '#2aa0d8'; [[-4, 1], [1, 3], [4, 0], [-1, -1]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b, 1.3, 0, 7); ctx.fill(); });
    }
    if (p.cap === 'cop' || p.cap === 'swat') { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-1, -2, 2, 4); }
    // braços
    const wid = p.player ? p.weapon : (p.state === 'fight' ? p.weapon : null);
    const aiming = wid === 'pistol' || wid === 'smg' || wid === 'shotgun';
    if (!aiming) { ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(-7.6, 1 + ph * 0.5, 2, 0, 7); ctx.arc(7.6, 1 - ph * 0.5, 2, 0, 7); ctx.fill(); }
    // cabeça
    pedHead(ctx, p);
    if (wid && wid !== 'fist') drawHeld(ctx, p, wid);
    if (p.punchT > 0 && (!wid || wid === 'fist')) { ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(3, -12, 3, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }

  function randomLook() {
    const r = a => a[Math.floor(Math.random() * a.length)];
    return { shirt: r(SHIRTS), skin: r(SKINS), hair: r(HAIRS) };
  }

  G.sprites = { CAR_W, CAR_L, carSprite, drawCar, drawPed, randomLook, shade };
})(window.G = window.G || {});
