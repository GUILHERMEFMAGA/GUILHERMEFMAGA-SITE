/* ============================================================
   car.js — física arcade dos carros e colisões
   ============================================================ */
(function (G) {
  'use strict';
  const W = G.world;
  const CAR_W = G.sprites.CAR_W, CAR_L = G.sprites.CAR_L;

  const STATS = {
    coupe:  { max: 400, acc: 470, turn: 2.7 },
    sedan:  { max: 320, acc: 380, turn: 2.4 },
    taxi:   { max: 340, acc: 400, turn: 2.45 },
    police: { max: 420, acc: 500, turn: 2.6 },
    ambulancia: { max: 340, acc: 380, turn: 2.3 },
    limo:   { max: 390, acc: 390, turn: 2.1 },
    golf:   { max: 220, acc: 280, turn: 3.3 },
  };

  class Car {
    constructor(o) {
      this.x = o.x; this.y = o.y; this.a = o.a || 0; this.vx = 0; this.vy = 0;
      this.kind = o.kind || 'sedan'; this.color = o.color || '#2e5fb5';
      const s = STATS[this.kind] || STATS.sedan;
      this.max = o.max || s.max; this.acc = s.acc; this.turn = s.turn;
      this.hp = 100; this.dead = false; this.burnT = 0;
      this.driver = o.driver || 'none';  // 'player' | 'ai' | 'none'
      this.mode = o.mode || 'parked';
      this.thr = 0; this.steer = 0; this.hb = false; this.brakeLight = false;
      this.vf = 0; this.vr = 0; this.angV = 0;
      this.siren = false; this.owned = !!o.owned; this.tag = o.tag || '';
      this.mass = o.mass || 1; this.hornT = 0; this.nav = null; this.stuckT = 0; this.revT = 0;
      this.hitCool = 0; this.onGrass = false; this.smokeT = 0;
      this.lights = true; this.id = (Car.n = (Car.n || 0) + 1); this.idleT = 0;
    }
    get fx() { return Math.sin(this.a); }
    get fy() { return -Math.cos(this.a); }
    get speed() { return Math.hypot(this.vx, this.vy); }
  }

  // pontos do contorno do carro (para testar parede)
  const LOC = (() => {
    const hw = CAR_W / 2 - 3, hl = CAR_L / 2 - 2;
    return [[-hw, -hl], [0, -hl], [hw, -hl], [hw, -hl / 2], [hw, 0], [hw, hl / 2], [hw, hl], [0, hl], [-hw, hl], [-hw, hl / 2], [-hw, 0], [-hw, -hl / 2]];
  })();
  function blocked(x, y, a) {
    const c = Math.cos(a), s = Math.sin(a);
    for (let k = 0; k < LOC.length; k++) {
      const lx = LOC[k][0], ly = LOC[k][1];
      const wx = x + c * lx + s * (-ly), wy = y + s * lx + c * ly;
      if (W.isSolid(wx, wy)) return true;
      if (W.trees.length && W.treeHit(wx, wy, 0)) return true;
    }
    return false;
  }

  // círculos de colisão (2 por carro)
  function circles(c) {
    const R = CAR_W * 0.56, off = CAR_L * 0.27;
    return [[c.x + c.fx * off, c.y + c.fy * off, R], [c.x - c.fx * off, c.y - c.fy * off, R]];
  }

  function updateCar(c, dt) {
    if (c.hitCool > 0) c.hitCool -= dt;
    // --- decomposição da velocidade ---
    const fx = c.fx, fy = c.fy, rx = Math.cos(c.a), ry = Math.sin(c.a);
    let vf = c.vx * fx + c.vy * fy, vr = c.vx * rx + c.vy * ry;
    const t = W.tileAt(c.x, c.y);
    c.onGrass = t === W.TILE.GRASS;
    const grip = c.onGrass ? 0.55 : 1;
    const maxV = c.max * (c.onGrass ? 0.55 : 1);

    if (c.dead) { c.thr = 0; c.steer = 0; c.hb = false; }
    // acelerar
    if (c.thr > 0) { vf += c.thr * c.acc * grip * dt * (vf < 0 ? 2.2 : 1); }
    else if (c.thr < 0) { vf += c.thr * c.acc * 0.8 * dt * (vf > 0 ? 2.4 : 1); }
    c.brakeLight = (c.thr < 0 && vf > 20) || (c.hb && Math.abs(vf) > 20) || c.brakeHold;
    // limite e resistência
    const lim = c.thr < 0 ? maxV * 0.4 : maxV;
    if (vf > lim) vf -= (vf - lim) * Math.min(1, 4 * dt);
    if (vf < -maxV * 0.4) vf = -maxV * 0.4;
    const drag = (c.thr === 0 ? 0.9 : 0.25) + (c.onGrass ? 1.3 : 0);
    vf -= vf * drag * dt;
    if (c.hb) vf -= vf * 1.8 * dt;
    if (c.thr === 0 && Math.abs(vf) < 6) vf = 0;
    // atrito lateral (derrapagem)
    const k = c.hb ? 1.6 : (c.onGrass ? 4 : 7.5);
    vr *= Math.exp(-k * dt);
    // direção
    const sp = Math.min(1, Math.abs(vf) / 140);
    const fall = 1 - 0.45 * Math.min(1, Math.abs(vf) / c.max);
    const want = c.steer * c.turn * sp * fall * (vf < 0 ? -1 : 1) * (c.hb ? 1.35 : 1);
    c.angV += (want - c.angV) * Math.min(1, 10 * dt);
    const newA = c.a + c.angV * dt;
    if (!blocked(c.x, c.y, newA) || blocked(c.x, c.y, c.a)) c.a = newA; else c.angV *= -0.2;
    // recompõe a velocidade no novo ângulo
    const nfx = Math.sin(c.a), nfy = -Math.cos(c.a), nrx = Math.cos(c.a), nry = Math.sin(c.a);
    c.vx = nfx * vf + nrx * vr; c.vy = nfy * vf + nry * vr;
    c.vf = vf; c.vr = vr;
    // --- movimento com colisão de parede ---
    const nx = c.x + c.vx * dt, ny = c.y + c.vy * dt;
    if (!blocked(nx, ny, c.a)) { c.x = nx; c.y = ny; }
    else {
      const was = blocked(c.x, c.y, c.a);
      let hitx = false, hity = false;
      if (!blocked(nx, c.y, c.a)) c.x = nx; else hitx = true;
      if (!blocked(c.x, ny, c.a)) c.y = ny; else hity = true;
      const imp = Math.hypot(hitx ? c.vx : 0, hity ? c.vy : 0);
      if (hitx) c.vx *= -0.25; if (hity) c.vy *= -0.25;
      if (!hitx && !hity) { c.vx *= 0.5; c.vy *= 0.5; }
      if (was) { // preso dentro de algo: empurra pra fora
        c.x -= Math.sign(c.vx || 1) * 2; c.y -= Math.sign(c.vy || 1) * 2;
      }
      if (imp > 40) { G.carCrash(c, null, imp, c.x + c.fx * 30, c.y + c.fy * 30); c.hitCool = 0.35; }
    }
    // fumaça / fogo
    if (!c.dead && c.hp < 50) {
      c.smokeT -= dt;
      if (c.smokeT <= 0) {
        c.smokeT = c.hp < 25 ? 0.05 : 0.12;
        G.particle({ x: c.x + c.fx * 26, y: c.y + c.fy * 26, vx: (Math.random() - 0.5) * 20, vy: -25 - Math.random() * 20, life: 1.1, size: 6 + Math.random() * 6, col: c.hp < 25 ? 'fire' : 'smoke' });
      }
    }
    if (c.hp <= 0 && !c.dead) G.explodeCar(c);
    if (c.dead) { c.vx *= 0.96; c.vy *= 0.96; c.burnT += dt; if (Math.random() < dt * 6) G.particle({ x: c.x + (Math.random() - 0.5) * 30, y: c.y + (Math.random() - 0.5) * 50, vx: 0, vy: -30, life: 1.3, size: 7 + Math.random() * 6, col: Math.random() < 0.4 ? 'fire' : 'smoke' }); }
  }

  // colisão carro x carro
  function carVsCar(a, b) {
    if (Math.abs(a.x - b.x) > 110 || Math.abs(a.y - b.y) > 110) return;
    const ca = circles(a), cb = circles(b);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const dx = cb[j][0] - ca[i][0], dy = cb[j][1] - ca[i][1];
      const min = ca[i][2] + cb[j][2], d2 = dx * dx + dy * dy;
      if (d2 >= min * min || d2 === 0) continue;
      const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, ov = min - d;
      const ma = a.mass * (a.dead ? 4 : 1), mb = b.mass * (b.dead ? 4 : 1);
      const ia = 1 / ma, ib = 1 / mb, sum = ia + ib;
      if (!blocked(a.x - nx * ov * ia / sum, a.y - ny * ov * ia / sum, a.a)) { a.x -= nx * ov * ia / sum; a.y -= ny * ov * ia / sum; }
      if (!blocked(b.x + nx * ov * ib / sum, b.y + ny * ov * ib / sum, b.a)) { b.x += nx * ov * ib / sum; b.y += ny * ov * ib / sum; }
      const rvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (rvn < 0) {
        const e = 0.35, jn = -(1 + e) * rvn / sum;
        a.vx -= jn * ia * nx; a.vy -= jn * ia * ny; b.vx += jn * ib * nx; b.vy += jn * ib * ny;
        // gira um pouquinho
        a.angV += (Math.random() - 0.5) * 0.8; b.angV += (Math.random() - 0.5) * 0.8;
        const imp = -rvn;
        if (imp > 35) G.carCrash(a, b, imp, (ca[i][0] + cb[j][0]) / 2, (ca[i][1] + cb[j][1]) / 2);
      }
    }
  }

  function damage(c, amt) {
    if (c.dead) return;
    c.hp = Math.max(0, c.hp - amt);
  }

  G.Car = Car; G.updateCar = updateCar; G.carVsCar = carVsCar; G.carDamage = damage;
  G.carBlocked = blocked; G.carCircles = circles;
})(window.G = window.G || {});
