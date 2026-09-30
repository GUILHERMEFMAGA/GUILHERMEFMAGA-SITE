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

  function drawPed(ctx, p, time) {
    const r = 7;
    if (p.state === 'down') {
      const k = Math.min(1, p.downT / 0.25);
      if (Math.floor(time * 12) % 2 === 0 && p.downT > 1.0) return; // pisca antes de sumir
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.h);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(3, 4, 12, 7, 0, 0, 7); ctx.fill();
      ctx.fillStyle = p.shirt; ctx.beginPath(); ctx.ellipse(0, 0, 6 + 2 * k, 10 - 2 * k, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(0, -10, 4, 0, 7); ctx.fill(); ctx.stroke();
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
    // braços
    ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(-7.6, 1 + ph * 0.5, 2, 0, 7); ctx.arc(7.6, 1 - ph * 0.5, 2, 0, 7); ctx.fill();
    // cabeça
    ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(0, -1, 4.1, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = p.hair; ctx.beginPath(); ctx.arc(0, 0.2, 3.9, 0.15 * Math.PI, 0.85 * Math.PI); ctx.fill();
    if (p.player) { ctx.fillStyle = '#000'; ctx.fillRect(-3, -3.6, 6, 1.6); }
    if (p.punchT > 0) { ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(3, -12, 3, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }

  function randomLook() {
    const r = a => a[Math.floor(Math.random() * a.length)];
    return { shirt: r(SHIRTS), skin: r(SKINS), hair: r(HAIRS) };
  }

  G.sprites = { CAR_W, CAR_L, carSprite, drawCar, drawPed, randomLook, shade };
})(window.G = window.G || {});
