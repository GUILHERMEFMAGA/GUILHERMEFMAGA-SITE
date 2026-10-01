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
    const base = wreck ? '#2b2b2f' : (kind === 'police' ? '#f1f1f3' : kind === 'ambulancia' ? '#f6f6f8' : kind === 'taxi' ? '#f2c42a' : color);
    const glass = wreck ? '#111' : '#1f2a33';

    // rodas
    [[-1, -L / 2 + 10], [1, -L / 2 + 10], [-1, L / 2 - 26], [1, L / 2 - 26]].forEach(([sx, y]) => {
      const tx = sx < 0 ? -W / 2 - 2.4 : W / 2 - 2.1;           // pneus aparecem um pouco para fora da lataria
      ctx.fillStyle = '#0b0b0d'; G.world.rrect(ctx, tx, y, 4.5, 16, 1.6); ctx.fill();
      ctx.fillStyle = '#26262c'; ctx.fillRect(tx + (sx < 0 ? 0.6 : 2.6), y + 1.5, 1.2, 13); // reflexo na borracha
      ctx.fillStyle = '#000'; for (let k = 0; k < 4; k++) ctx.fillRect(tx, y + 2 + k * 3.6, 4.5, 0.8);
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
    if (kind === 'ambulancia') {     // faixa vermelha nas laterais e cruz no teto
      ctx.save(); bodyPath(ctx, W, L); ctx.clip();
      ctx.fillStyle = '#d9262e'; ctx.fillRect(-W / 2, -2, 5, 30); ctx.fillRect(W / 2 - 5, -2, 5, 30); ctx.fillRect(-W / 2, -L / 2 + 15, W, 3);
      ctx.fillStyle = '#e8eaee'; ctx.fillRect(-W / 2, L / 2 - 20, W, 20);
      ctx.fillStyle = '#d9262e'; ctx.fillRect(-2.5, 4, 5, 15); ctx.fillRect(-7.5, 9, 15, 5);
      ctx.restore();
    }
    // brilho e volume da lataria (luz vinda de cima-esquerda)
    ctx.save(); bodyPath(ctx, W, L); ctx.clip();
    const lgx = ctx.createLinearGradient(0, -L / 2, 0, L / 2);
    lgx.addColorStop(0, 'rgba(255,255,255,0.16)'); lgx.addColorStop(0.35, 'rgba(255,255,255,0.02)'); lgx.addColorStop(1, 'rgba(0,0,0,0.24)');
    ctx.fillStyle = lgx; ctx.fillRect(-W / 2, -L / 2, W, L);
    const hg = ctx.createRadialGradient(-W * 0.14, -L / 2 + 11, 1, -W * 0.14, -L / 2 + 11, 17);
    hg.addColorStop(0, 'rgba(255,255,255,0.42)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg; ctx.fillRect(-W / 2, -L / 2, W, 32);
    const tg2 = ctx.createRadialGradient(-W * 0.12, L / 2 - 9, 1, -W * 0.12, L / 2 - 9, 13);
    tg2.addColorStop(0, 'rgba(255,255,255,0.22)'); tg2.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = tg2; ctx.fillRect(-W / 2, L / 2 - 26, W, 26);
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 3; bodyPath(ctx, W, L); ctx.stroke();
    ctx.restore();
    // detalhes do capô
    if (!wreck) {
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-W * 0.2, -L / 2 + 4); ctx.lineTo(-W * 0.22, -L / 2 + 22); ctx.moveTo(W * 0.2, -L / 2 + 4); ctx.lineTo(W * 0.22, -L / 2 + 22); ctx.stroke();
      if (kind === 'coupe') { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-6, -L / 2 + 8, 12, 3); ctx.fillRect(-6, -L / 2 + 13, 12, 2); }
    }
    // cabine (vidros)
    const cabT = kind === 'coupe' ? -L / 2 + 19 : -L / 2 + 21, cabB = kind === 'coupe' ? L / 2 - 23 : L / 2 - 19;
    if (wreck) ctx.fillStyle = glass; else { const gg = ctx.createLinearGradient(0, cabT, 0, cabB); gg.addColorStop(0, '#46617a'); gg.addColorStop(0.45, '#17252f'); gg.addColorStop(1, '#0c1319'); ctx.fillStyle = gg; }
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
      ctx.fillStyle = '#15151a'; ctx.fillRect(-W / 2 + 12, -L / 2 + 0.5, W - 24, 3.5);            // grade
      ctx.fillStyle = 'rgba(225,225,235,0.55)'; ctx.fillRect(-W / 2 + 4, -L / 2 + 4.6, W - 8, 1);   // para-choque cromado
      ctx.fillStyle = '#2a2a2e'; ctx.fillRect(-W / 2 + 2, -L / 2, 10, 5); ctx.fillRect(W / 2 - 12, -L / 2, 10, 5);
      ctx.fillStyle = '#fff7b0'; ctx.fillRect(-W / 2 + 3, -L / 2 + 1, 8, 3); ctx.fillRect(W / 2 - 11, -L / 2 + 1, 8, 3);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-W / 2 + 4, -L / 2 + 1.4, 3, 1.2); ctx.fillRect(W / 2 - 10, -L / 2 + 1.4, 3, 1.2);
      ctx.fillStyle = '#3a0a0a'; ctx.fillRect(-W / 2 + 2, L / 2 - 5, 11, 4.5); ctx.fillRect(W / 2 - 13, L / 2 - 5, 11, 4.5);
      ctx.fillStyle = '#d81f1f'; ctx.fillRect(-W / 2 + 3, L / 2 - 4, 9, 3); ctx.fillRect(W / 2 - 12, L / 2 - 4, 9, 3);
      ctx.fillStyle = '#ff7a6a'; ctx.fillRect(-W / 2 + 3.5, L / 2 - 3.6, 3, 1); ctx.fillRect(W / 2 - 11.5, L / 2 - 3.6, 3, 1);
      ctx.fillStyle = '#e8e8e0'; ctx.fillRect(-5, L / 2 - 4.2, 10, 2.8); ctx.strokeStyle = '#333'; ctx.lineWidth = 0.5; ctx.strokeRect(-5, L / 2 - 4.2, 10, 2.8);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; const dy = (cabT + cabB) / 2; ctx.fillRect(-W / 2 + 1.6, dy - 3, 1.6, 4); ctx.fillRect(W / 2 - 3.2, dy - 3, 1.6, 4); // maçanetas
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

  let shadowCv = null;   // sombra borrada, desenhada uma vez só
  function shadowSprite() {
    if (shadowCv) return shadowCv;
    const c = document.createElement('canvas'); c.width = CAR_W + 50; c.height = CAR_L + 50;
    const x = c.getContext('2d'); x.shadowColor = 'rgba(0,0,12,0.75)'; x.shadowBlur = 9; x.shadowOffsetX = 2000;
    x.fillStyle = '#000'; G.world.rrect(x, c.width / 2 - CAR_W / 2 - 2000 + 1, c.height / 2 - CAR_L / 2 + 1, CAR_W - 2, CAR_L - 2, 10); x.fill();
    return (shadowCv = c);
  }
  function drawCarShadow(ctx, car) {
    const sh = shadowSprite();
    ctx.save(); ctx.translate(car.x + 5, car.y + 7); ctx.rotate(car.a);
    ctx.drawImage(sh, -sh.width / 2, -sh.height / 2);
    ctx.restore();
  }
  function drawCar(ctx, car, time) {
    drawCarShadow(ctx, car);
    const sp = carSprite(car.dead ? 'wreck' : car.kind, car.color);
    ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.a);
    ctx.drawImage(sp, -sp.width / SS / 2, -sp.height / SS / 2, sp.width / SS, sp.height / SS);
    if ((car.kind === 'police' || car.kind === 'ambulancia') && !car.dead && car.siren) {
      const on = Math.floor(time * 8) % 2 === 0;
      ctx.fillStyle = on ? '#ff2a2a' : (car.kind === 'ambulancia' ? '#ffffff' : '#3b3bff');
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
    if ((car.kind === 'police' || car.kind === 'ambulancia') && !car.dead && car.siren) {
      const on = Math.floor(time * 8) % 2 === 0;
      const gx = car.x + Math.cos(car.a) * (on ? -6 : 6), gy = car.y + Math.sin(car.a) * (on ? -6 : 6);
      const gr = ctx.createRadialGradient(gx, gy, 2, gx, gy, 46);
      gr.addColorStop(0, on ? 'rgba(255,40,40,0.55)' : 'rgba(60,60,255,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.fillRect(gx - 46, gy - 46, 92, 92);
    }
    if (car.blink && !car.dead) {   // pisca-pisca laranja (direita ou esquerda)
      if (Math.floor(time * 3.6) % 2 === 0) {
        ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.a);
        const sx = car.blink > 0 ? CAR_W / 2 - 1 : -CAR_W / 2 + 1;
        [-CAR_L / 2 + 2, CAR_L / 2 - 2].forEach(yy => { const g = ctx.createRadialGradient(sx, yy, 0.5, sx, yy, 7); g.addColorStop(0, 'rgba(255,190,40,0.95)'); g.addColorStop(1, 'rgba(255,150,0,0)'); ctx.fillStyle = g; ctx.fillRect(sx - 7, yy - 7, 14, 14); });
        ctx.restore();
      }
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

  // cabelo de trás (cai nas costas) — desenhado ANTES da cabeça
  function hairBack(ctx, p) {
    const hs = p.hairStyle || 'curto', c = p.hair;
    if (hs === 'longo') { ctx.fillStyle = shade(c, -0.15); ctx.beginPath(); ctx.ellipse(0, 3.2, 5.2, 5.4, 0, 0, 7); ctx.fill(); }
    else if (hs === 'rabo') { ctx.fillStyle = shade(c, -0.1); ctx.beginPath(); ctx.ellipse(0, 6.4, 1.9, 4, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#d33a6a'; ctx.beginPath(); ctx.arc(0, 3.4, 1.1, 0, 7); ctx.fill(); }
  }
  // cabelo de cima
  function hairTop(ctx, p) {
    const hs = p.hairStyle || 'curto', c = p.hair;
    const brilho = (x, y, rx, ry) => { ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, -0.5, 0, 7); ctx.fill(); };
    if (hs === 'careca') { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(-1, -1.6, 1.8, 1.2, -0.5, 0, 7); ctx.fill(); return; }
    if (hs === 'afro') { ctx.fillStyle = shade(c, -0.2); ctx.beginPath(); ctx.arc(0, 0, 5.8, 0, 7); ctx.fill(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(-0.4, -0.4, 4.9, 0, 7); ctx.fill(); brilho(-1.6, -1.8, 2.2, 1.3); return; }
    if (hs === 'raspado') { ctx.fillStyle = 'rgba(30,20,10,0.55)'; ctx.beginPath(); ctx.ellipse(0, 0.9, 3.9, 3.4, 0, 0, 7); ctx.fill(); return; }
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0.9, 4.2, 3.9, 0, 0, 7); ctx.fill();            // base do cabelo
    ctx.fillStyle = shade(c, -0.25); ctx.beginPath(); ctx.ellipse(0, 2.4, 3.2, 2.2, 0, 0, 7); ctx.fill(); // nuca mais escura
    if (hs === 'coque') { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 2.4, 2.4, 0, 7); ctx.fill(); ctx.strokeStyle = shade(c, -0.35); ctx.lineWidth = 0.7; ctx.stroke(); brilho(-0.6, 1.8, 1, 0.7); }
    if (hs === 'topete') { ctx.fillStyle = shade(c, 0.1); ctx.beginPath(); ctx.ellipse(0, -2.4, 3.4, 1.8, 0, 0, 7); ctx.fill(); brilho(-1, -2.8, 1.8, 0.8); }
    brilho(-1.4, -0.4, 1.9, 1.1);
  }

  function pedHead(ctx, p) {
    hairBack(ctx, p);
    // orelhas, rosto e nariz
    ctx.fillStyle = shade(p.skin, -0.12); ctx.beginPath(); ctx.arc(-4, -0.6, 1.2, 0, 7); ctx.arc(4, -0.6, 1.2, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 0.9;
    const fg = ctx.createRadialGradient(-1.2, -2.6, 0.5, 0, -1, 5); fg.addColorStop(0, shade(p.skin, 0.12)); fg.addColorStop(1, shade(p.skin, -0.1));
    ctx.fillStyle = fg; ctx.beginPath(); ctx.ellipse(0, -1, 3.9, 4.3, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = shade(p.skin, -0.2); ctx.beginPath(); ctx.arc(0, -5.0, 0.95, 0, 7); ctx.fill();      // nariz
    if (p.cap === 'cop' || p.cap === 'swat') { /* sem cabelo aparente */ } else hairTop(ctx, p);
    if (p.cap === 'cop') { ctx.fillStyle = '#14224f'; ctx.beginPath(); ctx.arc(0, -0.6, 4.5, 0, 7); ctx.fill(); ctx.fillStyle = '#0a0a10'; ctx.fillRect(-3.4, -5.8, 6.8, 2); ctx.fillStyle = '#f2c231'; ctx.beginPath(); ctx.arc(0, -3, 1.2, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-2.6, -1.8, 2, 1); }
    else if (p.cap === 'swat') { ctx.fillStyle = '#1a1c22'; ctx.beginPath(); ctx.arc(0, -0.6, 4.9, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(-2.8, -3.8, 2.6, 1.4); ctx.fillStyle = '#0c0d10'; ctx.fillRect(-3.6, -4.8, 7.2, 2.2); }
    else if (p.acc === 'cap') { ctx.fillStyle = p.accCol; ctx.beginPath(); ctx.arc(0, -0.6, 4.4, 0, 7); ctx.fill(); ctx.fillStyle = shade(p.accCol, -0.35); ctx.fillRect(-2.8, -5.8, 5.6, 2); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-2.6, -3, 2, 1.2); ctx.fillStyle = shade(p.accCol, 0.25); ctx.beginPath(); ctx.arc(0, -0.6, 0.9, 0, 7); ctx.fill(); }
    else if (p.acc === 'beanie') { ctx.fillStyle = p.accCol; ctx.beginPath(); ctx.arc(0, -0.6, 4.6, 0, 7); ctx.fill(); ctx.fillStyle = shade(p.accCol, -0.3); for (let k = -3; k <= 3; k += 1.5) ctx.fillRect(k, -4.4, 0.7, 7.6); ctx.fillStyle = shade(p.accCol, 0.3); ctx.beginPath(); ctx.arc(0, -0.6, 1.4, 0, 7); ctx.fill(); }
    else if (p.acc === 'hat') { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(0.8, 0.2, 6.8, 0, 7); ctx.fill(); ctx.fillStyle = '#d2b074'; ctx.beginPath(); ctx.arc(0, -0.8, 6.6, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(80,50,20,0.6)'; ctx.lineWidth = 0.8; ctx.stroke(); ctx.fillStyle = '#a98450'; ctx.beginPath(); ctx.arc(0, -0.8, 3.7, 0, 7); ctx.fill(); ctx.fillStyle = '#4a2e18'; ctx.beginPath(); ctx.arc(0, -0.8, 3.8, 0, 7); ctx.lineWidth = 1.1; ctx.stroke(); }
    else if (p.acc === 'shades') { ctx.fillStyle = '#08080c'; ctx.beginPath(); ctx.ellipse(-1.9, -3.4, 1.7, 1.1, 0, 0, 7); ctx.ellipse(1.9, -3.4, 1.7, 1.1, 0, 0, 7); ctx.fill(); ctx.fillRect(-0.4, -3.8, 0.8, 0.7); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-2.7, -3.9, 1.1, 0.6); ctx.fillRect(1.1, -3.9, 1.1, 0.6); }
    else { // olhos
      ctx.fillStyle = '#16120e'; ctx.beginPath(); ctx.arc(-1.7, -3.3, 0.62, 0, 7); ctx.arc(1.7, -3.3, 0.62, 0, 7); ctx.fill();
    }
    if (p.player) { ctx.fillStyle = '#f2c231'; ctx.beginPath(); ctx.arc(4.2, -0.4, 0.8, 0, 7); ctx.fill(); }   // brinco dourado
  }

  // corpo deitado (pedestre caído ou morto)
  function drawLying(ctx, p, k, dead) {
    const calca = p.cap ? (p.cap === 'swat' ? '#15171c' : '#16224a') : (p.pants || '#2a2a35');
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(3, 4, 12, 7, 0, 0, 7); ctx.fill();
    // pernas e sapatos
    const abre = dead ? 1 : 0.6;
    ctx.fillStyle = calca; ctx.beginPath(); ctx.ellipse(-2.8 * abre, 8, 2.5, 5.4, 0.1 * abre, 0, 7); ctx.ellipse(3 * abre, 8.6, 2.5, 5.4, -0.12 * abre, 0, 7); ctx.fill();
    ctx.fillStyle = p.shoe || '#121216'; ctx.beginPath(); ctx.ellipse(-3 * abre, 13, 2.2, 1.8, 0, 0, 7); ctx.ellipse(3.3 * abre, 13.6, 2.2, 1.8, 0, 0, 7); ctx.fill();
    // tronco
    const tg = ctx.createLinearGradient(-8, 0, 8, 0); tg.addColorStop(0, shade(p.shirt, -0.25)); tg.addColorStop(0.5, shade(p.shirt, 0.12)); tg.addColorStop(1, shade(p.shirt, -0.3));
    ctx.fillStyle = tg; ctx.beginPath(); ctx.ellipse(0, 0, 6.4 + 2 * k, 10 - 2 * k, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    // braços
    ctx.fillStyle = shade(p.shirt, -0.1); ctx.beginPath(); ctx.ellipse(-8.4, 1, 2.2, 4.2, 0.15, 0, 7); ctx.ellipse(8.6, -1.5, 2.2, 4.2, -0.2, 0, 7); ctx.fill();
    ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(-9, 5.2, 1.7, 0, 7); ctx.arc(9.4, 2.4, 1.7, 0, 7); ctx.fill();
    if (dead) { ctx.fillStyle = 'rgba(120,6,10,0.9)'; ctx.beginPath(); ctx.ellipse(1, -1, 3.4, 4.6, 0.4, 0, 7); ctx.fill(); }
    ctx.save(); ctx.translate(0, -9.5);
    hairBack(ctx, p);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 0.9;
    ctx.fillStyle = p.skin; ctx.beginPath(); ctx.ellipse(0, 0, 3.9, 4.2, 0, 0, 7); ctx.fill(); ctx.stroke();
    if (p.cap === 'cop') { ctx.fillStyle = '#14224f'; ctx.beginPath(); ctx.arc(0, 0.4, 4.4, 0, 7); ctx.fill(); }
    else if (p.cap === 'swat') { ctx.fillStyle = '#1a1c22'; ctx.beginPath(); ctx.arc(0, 0.4, 4.8, 0, 7); ctx.fill(); }
    else { ctx.save(); ctx.translate(0, 1); hairTop(ctx, p); ctx.restore(); }
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
    // sombra suave
    const sg = ctx.createRadialGradient(3, 4, 1, 3, 4, r + 4); sg.addColorStop(0, 'rgba(0,0,10,0.42)'); sg.addColorStop(1, 'rgba(0,0,10,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(3, 4, r + 4, r + 2, 0, 0, 7); ctx.fill();
    if (p.player && !p.noRing) { // anel amarelo discreto para você se achar na multidão
      ctx.strokeStyle = 'rgba(255,224,74,' + (0.28 + 0.12 * Math.sin(time * 4)) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, 1, 11, 11, 0, 0, 7); ctx.stroke();
    }
    ctx.rotate(p.h); { const resp = 1.12 + 0.014 * Math.sin(time * 2.3 + (p.x || 0) * 0.37); ctx.scale(resp, 1.12 + (resp - 1.12) * 0.6); }   // respiração
    const cop = p.cap === 'cop' || p.cap === 'swat', fem = !!p.fem && !cop, vest = !!p.dress && fem;
    const calca = cop ? (p.cap === 'swat' ? '#15171c' : '#16224a') : (p.pants || '#2a2a35');
    const sapato = cop ? '#0c0c10' : (p.shoe || '#121216');
    const ph = Math.sin(p.walk) * 4;
    const l1 = -ph * 0.8 + 0.5, l2 = ph * 0.8 + 0.5;
    // pernas (com sombra e dobra) e sapatos
    const pernas = (y, x) => {
      const g = ctx.createLinearGradient(x - 2.4, 0, x + 2.4, 0); g.addColorStop(0, shade(vest ? p.skin : calca, -0.22)); g.addColorStop(0.5, shade(vest ? p.skin : calca, 0.12)); g.addColorStop(1, shade(vest ? p.skin : calca, -0.28));
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, 2.4, 5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = sapato; ctx.beginPath(); ctx.ellipse(x, y - 4.6, 2.3, 2, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = p.player || !cop ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.ellipse(x, y - 4.9, 2.1, 1.5, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    };
    pernas(l1, -2.8); pernas(l2, 2.8);
    if (vest) { // vestido/saia
      const vg = ctx.createRadialGradient(-1, 2, 1, 0, 4, 8); vg.addColorStop(0, shade(p.shirt, 0.15)); vg.addColorStop(1, shade(p.shirt, -0.3));
      ctx.fillStyle = vg; ctx.beginPath(); ctx.ellipse(0, 3.6, 6.8, 5.2, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 0.8; ctx.stroke();
    }
    // tronco: camisa com degradê, pregas e estampa
    const ombro = fem ? 6.6 : 7.8;
    const tgr = ctx.createLinearGradient(-ombro, 0, ombro, 0); tgr.addColorStop(0, shade(p.shirt, -0.3)); tgr.addColorStop(0.42, shade(p.shirt, 0.18)); tgr.addColorStop(1, shade(p.shirt, -0.36));
    ctx.fillStyle = tgr; ctx.beginPath(); ctx.ellipse(0, 1, ombro, 4.9, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 1, ombro, 4.9, 0, 0, 7); ctx.clip();
    if (p.pat === 'hawaii') { // camisa havaiana: flores brancas, azuis e folhas verdes
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; [[-4.6, 0], [3.4, 2.4], [0.4, -2], [-1.8, 3.6], [5.2, -1.4]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b, 1.25, 0, 7); ctx.fill(); });
      ctx.fillStyle = '#2aa0d8'; [[-2.4, 0.6], [2, 0], [-5.4, 2.6], [4.4, 3.2]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b, 1.05, 0, 7); ctx.fill(); });
      ctx.fillStyle = '#2c8a3e'; [[-3.4, -1.8], [1.6, 2.4], [-0.6, 4]].forEach(([a, b]) => { ctx.beginPath(); ctx.ellipse(a, b, 1.5, 0.7, 0.7, 0, 7); ctx.fill(); });
    } else if (p.pat === 'listra') { ctx.fillStyle = 'rgba(255,255,255,0.28)'; for (let y = -4; y < 6; y += 2.4) ctx.fillRect(-9, y, 18, 1.1); }
    else if (p.pat === 'xadrez') { ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.9; ctx.beginPath(); for (let k = -8; k <= 8; k += 3) { ctx.moveTo(k, -4); ctx.lineTo(k, 6); } for (let k = -4; k <= 6; k += 3) { ctx.moveTo(-9, k); ctx.lineTo(9, k); } ctx.stroke(); }
    else if (p.pat === 'jaqueta') { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-0.4, -4, 0.8, 10); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-6.6, -3, 2.4, 0.9); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.ellipse(0, 1, ombro, 4.9, 0, 0, 7); ctx.stroke();
    // gola em V (pele) e pescoço
    if (!cop) { ctx.fillStyle = shade(p.skin, -0.08); ctx.beginPath(); ctx.moveTo(-2.1, -3.2); ctx.lineTo(2.1, -3.2); ctx.lineTo(0, -0.4); ctx.closePath(); ctx.fill(); }
    else { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-1, -2.4, 2, 5); ctx.fillStyle = '#f2c231'; ctx.beginPath(); ctx.arc(-4, 0, 0.9, 0, 7); ctx.fill(); }
    if (p.acc === 'pack' && !cop) { ctx.fillStyle = p.accCol; ctx.beginPath(); ctx.ellipse(0, 4.6, 4.8, 3.8, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 0.8; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-2.8, 2.8, 2.8, 1); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(-4.4, 4.4, 8.8, 0.9); ctx.strokeStyle = shade(p.accCol, -0.4); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-4, -0.6); ctx.lineTo(-3.2, 2.8); ctx.moveTo(4, -0.6); ctx.lineTo(3.2, 2.8); ctx.stroke(); }
    // braços
    const wid = p.player ? p.weapon : (p.state === 'fight' ? p.weapon : null);
    const aiming = wid === 'pistol' || wid === 'smg' || wid === 'shotgun';
    if (!aiming) {
      const longa = p.sleeve === 'longa' || cop, regata = p.sleeve === 'regata' && !cop;
      [[-1, ph * 0.5], [1, -ph * 0.5]].forEach(([sd, sw]) => {
        const ax = sd * 7.4;
        ctx.fillStyle = regata ? p.skin : shade(p.shirt, -0.1); ctx.beginPath(); ctx.ellipse(ax, 1 + sw, 2.2, 3.4, 0, 0, 7); ctx.fill();
        ctx.fillStyle = longa ? shade(p.shirt, -0.16) : shade(p.skin, -0.04); ctx.beginPath(); ctx.ellipse(ax + sd * 0.2, -1.8 + sw, 1.9, 2.6, 0, 0, 7); ctx.fill();
        ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(ax + sd * 0.3, -4 + sw, 1.7, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(ax + sd * 0.3, -4 + sw, 1.7, 0, 7); ctx.stroke();
      });
      if (p.player) { ctx.fillStyle = '#c9ccd2'; ctx.fillRect(-8.6, -2.6 + ph * 0.5, 2.4, 1); }   // relógio
    }
    // cabeça
    pedHead(ctx, p);
    if (wid && wid !== 'fist') drawHeld(ctx, p, wid);
    if (p.punchT > 0 && (!wid || wid === 'fist')) { ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(3, -12, 3, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.8; ctx.stroke(); ctx.fillStyle = shade(p.skin, 0.2); ctx.fillRect(1.6, -13.4, 2, 0.8); }
    ctx.restore();
  }

  function randomLook() {
    const r = a => a[Math.floor(Math.random() * a.length)];
    const fem = Math.random() < 0.45;
    return {
      shirt: r(SHIRTS), skin: r(SKINS), hair: r(HAIRS), fem,
      hairStyle: fem ? r(['longo', 'longo', 'rabo', 'coque', 'curto', 'afro']) : r(['curto', 'curto', 'careca', 'afro', 'raspado']),
      dress: fem && Math.random() < 0.4,
      pat: r(['liso', 'liso', 'liso', 'listra', 'xadrez', 'jaqueta']),
      sleeve: r(['curta', 'curta', 'longa', 'regata']),
      shoe: r(['#121216', '#f2f2f2', '#3a2412', '#d33a3a', '#2a5ac8']),
      acc: r(['none', 'none', 'none', 'cap', 'beanie', 'hat', 'shades', 'pack', 'pack']),
      accCol: r(['#d33a3a', '#2a2a30', '#3a7ad3', '#e8e8e8', '#3aa85a', '#e0b32a']),
      pants: r(['#2a2f45', '#3a3a3f', '#4a3a2a', '#23232c', '#56688a', '#1c1c20', '#6a5a46'])
    };
  }

  G.sprites = { CAR_W, CAR_L, carSprite, drawCar, drawPed, randomLook, shade };
})(window.G = window.G || {});
