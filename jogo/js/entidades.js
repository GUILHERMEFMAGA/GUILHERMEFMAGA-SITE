'use strict';
/* =========================================================
   Entidades: carros (física), pedestres, jogador, polícia,
   partículas e dinheiro espalhado pela cidade.
   ========================================================= */

let _uid = 0;
const POP = { ai: 100, peds: 80, patrols: 2, maxFree: 16, pickups: 14 };

function makeCar(type, color, x, y, angle, mode) {
  const spec = CAR_TYPES[type];
  color = color || pick(spec.colors);
  return {
    uid: ++_uid, type, spec, color, len: spec.len, wid: spec.wid, x, y, angle,
    vx: 0, vy: 0, v: 0, mode, ai: null, health: 100, burning: 0, wreck: false,
    sprite: carSprite(type, color), isPolice: type === 'police', siren: false,
    smokeT: 0, hitCd: 0, freeT: 0, driverExitT: 0, hasDriver: mode === 'ai' || mode === 'police',
    stuckT: 0, revT: 0, repathT: 0, wp: null, officerOut: false, mission: false, removed: false,
  };
}

function spawnAICar(type, avoid) {
  type = type || pick(AI_TYPE_POOL);
  const sp = findLaneSpawn(CAR_TYPES[type].len, avoid);
  if (!sp) return null;
  const c = makeCar(type, null, sp.x, sp.y, DIR_ANG[sp.dir], 'ai');
  c.ai = makeAI(sp.road, sp.dir, sp.lane, sp.s);
  c.v = c.ai.cruise * 0.6;
  placeAICar(c);
  World.cars.push(c);
  return c;
}

/* ---------- Colisão com o cenário ---------- */
function carHitsSolid(c, x, y, a) {
  const ca = Math.cos(a), sa = Math.sin(a);
  const hl = c.len / 2 - 0.5, hw = c.wid / 2 - 0.5;
  const pts = [[hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw], [hl, 0], [-hl, 0], [0, hw], [0, -hw], [hl / 2, hw], [hl / 2, -hw], [-hl / 2, hw], [-hl / 2, -hw]];
  for (let i = 0; i < pts.length; i++) {
    const lx = pts[i][0], ly = pts[i][1];
    if (solidPx(x + ca * lx - sa * ly, y + sa * lx + ca * ly)) return true;
  }
  return false;
}

function carImpact(c, speed) {
  if (speed < 45 || c.hitCd > 0) return;
  c.hitCd = 0.15;
  damageCar(c, (speed - 45) * 0.13);
  for (let i = 0; i < 4; i++) addParticle('spark', c.x + Math.cos(c.angle) * c.len / 2, c.y + Math.sin(c.angle) * c.len / 2);
  if (World.player && World.player.car === c) { World.shake = Math.min(6, speed / 40); Sound.crash(speed); }
  else if (World.player && dist(c.x, c.y, World.player.x, World.player.y) < 200) Sound.crash(speed * 0.5);
}

function damageCar(c, amount) {
  if (c.wreck) return;
  c.health -= amount;
  if (c.health <= 0 && c.burning <= 0) {
    c.health = 0;
    if (c.mode === 'ai') convertToFree(c);
    c.burning = 4;
    if (World.player && World.player.car === c) uiToast('SAIA DO CARRO! VAI EXPLODIR!', 'warn');
  }
}

function convertToFree(c) {
  if (c.mode === 'ai') {
    c.vx = Math.cos(c.angle) * c.v;
    c.vy = Math.sin(c.angle) * c.v;
    c.ai = null;
    c.driverExitT = randRange(1, 2.2);
  }
  c.mode = 'free';
  c.freeT = 0;
}

function moveCar(c, dt) {
  const sp = Math.hypot(c.vx, c.vy);
  const steps = Math.max(1, Math.ceil((sp * dt) / 5));
  const sdt = dt / steps;
  for (let i = 0; i < steps; i++) {
    const nx = c.x + c.vx * sdt;
    if (!carHitsSolid(c, nx, c.y, c.angle)) c.x = nx;
    else { carImpact(c, Math.abs(c.vx)); c.vx *= -0.3; }
    const ny = c.y + c.vy * sdt;
    if (!carHitsSolid(c, c.x, ny, c.angle)) c.y = ny;
    else { carImpact(c, Math.abs(c.vy)); c.vy *= -0.3; }
  }
}

function updatePhysicsCar(c, dt, ctl) {
  const sp = c.spec;
  let fx = Math.cos(c.angle), fy = Math.sin(c.angle);
  let vf = c.vx * fx + c.vy * fy;
  let vl = -c.vx * fy + c.vy * fx;
  const dead = c.wreck || c.burning > 0;
  const th = dead ? 0 : ctl.throttle;
  const st = dead ? 0 : ctl.steer;
  const maxV = sp.max * (c.isPolice && c.mode === 'police' ? 1 + 0.03 * Math.min(5, wantedStars()) : 1);
  if (th > 0) {
    if (vf < -4) vf += 360 * dt * th;
    else vf += sp.accel * dt * th * (1 - Math.max(0, vf) / (maxV * 1.08));
  } else if (th < 0) {
    if (vf > 4) vf -= 380 * dt * -th;
    else vf -= sp.accel * 0.55 * dt * -th;
  } else {
    const fr = (dead ? 140 : 70) * dt;
    vf = Math.abs(vf) <= fr ? 0 : vf - Math.sign(vf) * fr;
  }
  vf = clamp(vf, -maxV * 0.4, maxV);
  if (ctl.handbrake) { const fr = 150 * dt; vf = Math.abs(vf) <= fr ? 0 : vf - Math.sign(vf) * fr; }

  const sf = clamp(vf / 60, -1, 1);
  const turn = st * sp.turn * sf * (ctl.handbrake ? 1.4 : 1) * (1 - 0.32 * Math.min(1, Math.abs(vf) / sp.max));
  const oldA = c.angle;
  c.angle += turn * dt;
  if (carHitsSolid(c, c.x, c.y, c.angle)) c.angle = oldA;
  fx = Math.cos(c.angle); fy = Math.sin(c.angle);
  const grip = ctl.handbrake ? 1.7 : Math.abs(vl) > 80 ? 4.5 : 11;
  vl *= Math.exp(-grip * dt);
  c.vx = fx * vf - fy * vl;
  c.vy = fy * vf + fx * vl;
  if ((Math.abs(vl) > 40 || (ctl.handbrake && Math.abs(vf) > 50)) && !dead) skidMark(c);
  moveCar(c, dt);
  c.v = vf;
}

function skidMark(c) {
  if (!Art.worldCtx) return;
  const g = Art.worldCtx;
  g.fillStyle = 'rgba(14,14,18,0.5)';
  const ca = Math.cos(c.angle), sa = Math.sin(c.angle);
  for (const side of [-1, 1]) {
    const lx = -c.len / 2 + 3, ly = side * (c.wid / 2 - 1);
    const x = Math.round(c.x + ca * lx - sa * ly), y = Math.round(c.y + sa * lx + ca * ly);
    const t = tileAt(Math.floor(x / T), Math.floor(y / T));
    if (t === TL.ROAD || t === TL.BRIDGE || t === TL.LOT || t === TL.ALLEY || t === TL.SIDEWALK || t === TL.GARAGE || t === TL.PLAZA) g.fillRect(x, y, 1, 1);
  }
}

/* ---------- Estado do carro (fumaça, fogo, explosão) ---------- */
function updateCarStatus(c, dt) {
  if (c.hitCd > 0) c.hitCd -= dt;
  if (c.wreck) return;
  if (c.health < 35 && c.burning <= 0) {
    c.smokeT -= dt;
    if (c.smokeT <= 0) { c.smokeT = 0.1 + c.health / 200; addParticle('smoke', c.x + Math.cos(c.angle) * c.len * 0.35, c.y + Math.sin(c.angle) * c.len * 0.35); }
  }
  if (c.burning > 0) {
    c.burning -= dt;
    if (Math.random() < 0.7) addParticle('fire', c.x + randRange(-4, 4), c.y + randRange(-4, 4));
    if (Math.random() < 0.3) addParticle('smoke', c.x, c.y);
    if (c.burning <= 0) explodeCar(c);
  }
  if (c.mode === 'free' && c.driverExitT > 0) {
    c.driverExitT -= dt;
    if (c.driverExitT <= 0 && c.hasDriver) ejectDriver(c, true);
  }
}

function explodeCar(c) {
  c.wreck = true; c.burning = 0; c.health = 0;
  c.sprite = carSprite(c.type, c.color, true);
  c.mode = 'free'; c.siren = false;
  c.vx *= 0.2; c.vy *= 0.2;
  c.hasDriver = false;
  World.flashes.push({ x: c.x, y: c.y, t: 0.5 });
  for (let i = 0; i < 26; i++) addParticle(i % 3 ? 'fire' : 'smoke', c.x + randRange(-6, 6), c.y + randRange(-6, 6), randRange(-60, 60), randRange(-60, 60));
  for (let i = 0; i < 10; i++) addParticle('spark', c.x, c.y, randRange(-120, 120), randRange(-120, 120));
  const p = World.player;
  const d = dist(c.x, c.y, p.x, p.y);
  if (d < 260) { World.shake = 9 * (1 - d / 260) + 2; Sound.explosion(); }
  if (p.car === c) hurtPlayer(200, 'explosão');
  else if (p.onFoot && d < 48) hurtPlayer(80 * (1 - d / 48), 'explosão');
  for (const o of World.cars) {
    if (o === c || o.wreck) continue;
    const dd = dist(c.x, c.y, o.x, o.y);
    if (dd < 52) {
      if (o.mode === 'ai') convertToFree(o);
      damageCar(o, 55 * (1 - dd / 52));
      const k = 140 * (1 - dd / 52) / (dd || 1);
      o.vx += (o.x - c.x) * k; o.vy += (o.y - c.y) * k;
    }
  }
  for (const q of World.peds) if (dist(c.x, c.y, q.x, q.y) < 44) knockPed(q, q.x - c.x, q.y - c.y, 140);
}

/* ---------- Colisões entre carros ---------- */
function carCircles(c) {
  const off = c.len / 2 - c.wid / 2;
  const ca = Math.cos(c.angle), sa = Math.sin(c.angle);
  return [c.x + ca * off, c.y + sa * off, c.x - ca * off, c.y - sa * off, c.wid / 2 + 0.5];
}

function resolveCarPairs() {
  const cars = World.cars;
  for (let i = 0; i < cars.length; i++) {
    const a = cars[i];
    if (a.removed) continue;
    for (let j = i + 1; j < cars.length; j++) {
      const b = cars[j];
      if (b.removed) continue;
      if (Math.abs(a.x - b.x) > 34 || Math.abs(a.y - b.y) > 34) continue;
      if (a.mode === 'ai' && b.mode === 'ai') continue;
      const A = carCircles(a), B = carCircles(b);
      let best = null;
      for (let p = 0; p < 2; p++) for (let q = 0; q < 2; q++) {
        const dx = B[q * 2] - A[p * 2], dy = B[q * 2 + 1] - A[p * 2 + 1];
        const d = Math.hypot(dx, dy) || 0.01;
        const ov = A[4] + B[4] - d;
        if (ov > 0 && (!best || ov > best.ov)) best = { ov, nx: dx / d, ny: dy / d };
      }
      if (!best) continue;
      collideCars(a, b, best);
    }
  }
}

function collideCars(a, b, h) {
  const { nx, ny, ov } = h;
  const va = a.mode === 'ai' ? [Math.cos(a.angle) * a.v, Math.sin(a.angle) * a.v] : [a.vx, a.vy];
  const vb = b.mode === 'ai' ? [Math.cos(b.angle) * b.v, Math.sin(b.angle) * b.v] : [b.vx, b.vy];
  const vrel = (vb[0] - va[0]) * nx + (vb[1] - va[1]) * ny; // < 0 = se aproximando
  const impact = Math.max(0, -vrel);
  // carro de IA atingido com força vira carro "solto"
  if (a.mode === 'ai' && impact > 70) convertToFree(a);
  if (b.mode === 'ai' && impact > 70) convertToFree(b);
  const p = World.player;
  const playerCar = p.car;
  if ((a === playerCar || b === playerCar) && impact > 25) {
    const other = a === playerCar ? b : a;
    const pv = a === playerCar ? va : vb;
    const approach = (pv[0] * nx + pv[1] * ny) * (a === playerCar ? 1 : -1); // velocidade do jogador em direção ao outro
    if (other.isPolice && other.mode !== 'free' && other.hasDriver && approach > 45) addHeat(0.5, 'bateu na polícia', 3);
    if (other.mode === 'ai') { other.ai.bump = 0.8; other.ai.honkT = 0; }
  }
  if (a.mode === 'ai' || b.mode === 'ai') {
    const ai = a.mode === 'ai' ? a : b, ph = ai === a ? b : a;
    const s = ai === a ? 1 : -1; // normal aponta de a para b
    if (!carHitsSolid(ph, ph.x + nx * ov * s, ph.y + ny * ov * s, ph.angle)) { ph.x += nx * ov * s; ph.y += ny * ov * s; }
    const vn = ph.vx * nx * s + ph.vy * ny * s;
    if (vn < 0) { ph.vx -= vn * nx * s * 1.3; ph.vy -= vn * ny * s * 1.3; }
    ai.ai.bump = Math.max(ai.ai.bump || 0, 0.5);
    if (impact > 30) { damageCar(ai, impact * 0.08); carImpact(ph, impact); }
    return;
  }
  const ma = a.spec.mass * (a.wreck ? 2 : 1), mb = b.spec.mass * (b.wreck ? 2 : 1);
  const tot = ma + mb;
  const ax = a.x - nx * ov * (mb / tot), ay = a.y - ny * ov * (mb / tot);
  const bx = b.x + nx * ov * (ma / tot), by = b.y + ny * ov * (ma / tot);
  if (!carHitsSolid(a, ax, ay, a.angle)) { a.x = ax; a.y = ay; }
  if (!carHitsSolid(b, bx, by, b.angle)) { b.x = bx; b.y = by; }
  if (vrel < 0) {
    const j = (-(1.3) * vrel) / (1 / ma + 1 / mb);
    a.vx -= (j / ma) * nx; a.vy -= (j / ma) * ny;
    b.vx += (j / mb) * nx; b.vy += (j / mb) * ny;
    if (impact > 40) {
      // viatura empurrando o jogador causa menos dano (evita explosões injustas)
      const soft = (x, o) => (x === playerCar && o.isPolice && o.mode === 'police' ? 0.35 : 1);
      damageCar(a, (impact - 40) * 0.12 * (mb / tot) * 2 * soft(a, b));
      damageCar(b, (impact - 40) * 0.12 * (ma / tot) * 2 * soft(b, a));
      carImpact(a, impact); carImpact(b, impact);
    }
  }
}

/* ---------- Pedestres ---------- */
let PED_TILES = [];
function buildPedTiles() {
  PED_TILES = [];
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) if (pedWalkable(x, y) && tileAt(x, y) !== TL.ROAD) PED_TILES.push([x, y]);
}

function makePed(x, y, kind = 'civ') {
  const pal = makePedPalette(kind);
  return {
    isPed: true, kind, x, y, angle: randRange(-3, 3), pal, frames: pedFrames(pal),
    speed: kind === 'officer' ? 56 : randRange(17, 27), dir: randInt(0, 3), tx: x, ty: y,
    state: 'walk', anim: Math.random() * 4, downT: 0, fleeT: 0, off: randRange(-3.5, 3.5),
    threat: null, removed: false, vx: 0, vy: 0, inCar: false, hitCd: 0, wave: 0,
  };
}

function spawnPed(avoid) {
  for (let i = 0; i < 30; i++) {
    const [tx, ty] = pick(PED_TILES);
    const x = tx * T + 8, y = ty * T + 8;
    if (avoid && x > avoid.x0 && x < avoid.x1 && y > avoid.y0 && y < avoid.y1) continue;
    const p = makePed(x, y);
    pedPickTarget(p, false);
    World.peds.push(p);
    return p;
  }
  return null;
}

// Faixa de pedestre: a qual cruzamento pertence e se é seguro atravessar agora
function crossNodeOf(tx, ty) {
  const vert = (flagAt(tx, ty) & F_CROSS_V) !== 0;
  for (const n of City.nodes) {
    if (vert ? tx >= n.vx && tx < n.vx + 4 && (ty === n.hy - 1 || ty === n.hy + 4)
             : ty >= n.hy && ty < n.hy + 4 && (tx === n.vx - 1 || tx === n.vx + 4)) return { n, vert };
  }
  return null;
}
function crossOk(tx, ty) {
  const info = crossNodeOf(tx, ty);
  if (!info) return true;
  if (info.n.lights) return redLeft(info.n, info.vert, World.time) > 4.2;
  const cx = tx * T + 8, cy = ty * T + 8;
  for (const c of World.cars) if (!c.removed && Math.abs(c.x - cx) < 64 && Math.abs(c.y - cy) < 64 && Math.hypot(c.vx || 0, c.vy || 0) + (c.v || 0) > 4) return false;
  return true;
}
const isCrossTile = (tx, ty) => tileAt(tx, ty) === TL.ROAD && (flagAt(tx, ty) & F_CROSS) !== 0;

function pedPickTarget(p, flee) {
  const tx = Math.floor(p.x / T), ty = Math.floor(p.y / T);
  const opts = [];
  for (let d = 0; d < 4; d++) {
    const nx = tx + DIRS[d][0], ny = ty + DIRS[d][1];
    const ok = flee ? !SOLID[tileAt(nx, ny)] : pedWalkable(nx, ny);
    if (ok) opts.push(d);
  }
  let d;
  if (!opts.length) d = (p.dir + 2) % 4;
  else if (flee && p.threat) {
    let best = -1e9;
    for (const o of opts) {
      const s = dist(p.threat.x, p.threat.y, (tx + DIRS[o][0]) * T + 8, (ty + DIRS[o][1]) * T + 8) + Math.random() * 10;
      if (s > best) { best = s; d = o; }
    }
  } else {
    const nonRev = opts.filter((o) => o !== (p.dir + 2) % 4);
    if (opts.includes(p.dir) && Math.random() < 0.85) d = p.dir;
    else d = nonRev.length ? pick(nonRev) : pick(opts);
  }
  p.dir = d;
  // espera na calçada até o sinal fechar para os carros
  if (!flee && isCrossTile(tx + DIRS[d][0], ty + DIRS[d][1]) && !isCrossTile(tx, ty) && !crossOk(tx + DIRS[d][0], ty + DIRS[d][1])) {
    p.state = 'curb'; p.curbT = 0; p.tx = p.x; p.ty = p.y;
    return;
  }
  const cx = (tx + DIRS[d][0]) * T + 8, cy = (ty + DIRS[d][1]) * T + 8;
  // deslocamento lateral para os pedestres não andarem todos na mesma linha
  p.tx = cx + -DIRS[d][1] * p.off;
  p.ty = cy + DIRS[d][0] * p.off;
}

function knockPed(q, dx, dy, power) {
  if (q.state === 'down' || q.inCar) return;
  const d = Math.hypot(dx, dy) || 1;
  q.state = 'down';
  q.downT = randRange(4, 6);
  q.vx = (dx / d) * power * 0.6;
  q.vy = (dy / d) * power * 0.6;
  q.angle = Math.atan2(dy, dx);
}

function movePedTo(p, nx, ny) {
  if (!solidPx(nx, p.y)) p.x = nx;
  if (!solidPx(p.x, ny)) p.y = ny;
}

function updatePed(p, dt) {
  if (p.hitCd > 0) p.hitCd -= dt;
  if (p.state === 'down') {
    p.vx *= Math.exp(-5 * dt); p.vy *= Math.exp(-5 * dt);
    movePedTo(p, p.x + p.vx * dt, p.y + p.vy * dt);
    p.downT -= dt;
    if (p.downT <= 0) {
      p.state = p.kind === 'officer' ? 'chase' : 'flee';
      p.fleeT = 4; p.threat = World.player;
      pedPickTarget(p, true);
    }
    return;
  }
  if (p.state === 'wait') { // passageiro esperando o táxi
    p.wave += dt;
    const pl = World.player;
    p.angle = Math.atan2(pl.y - p.y, pl.x - p.x);
    return;
  }
  if (p.state === 'curb') {
    p.curbT += dt;
    p.angle = Math.atan2(DIRS[p.dir][1], DIRS[p.dir][0]);
    const tx = Math.floor(p.x / T), ty = Math.floor(p.y / T);
    const nx = tx + DIRS[p.dir][0], ny = ty + DIRS[p.dir][1];
    if (crossOk(nx, ny)) {
      p.state = 'walk';
      p.tx = nx * T + 8 + -DIRS[p.dir][1] * p.off; p.ty = ny * T + 8 + DIRS[p.dir][0] * p.off;
    } else if (p.curbT > 9) { // desiste e segue pela calçada
      p.state = 'walk'; p.dir = (p.dir + 1 + (Math.random() < 0.5 ? 0 : 2)) % 4; pedPickTarget(p, false);
      if (p.state === 'curb') p.curbT = 5;
    }
    return;
  }
  if (p.state === 'chase') {
    const pl = World.player;
    if (wantedStars() === 0 || !pl.alive) { p.state = 'walk'; p.kind = 'civ'; pedPickTarget(p, false); return; }
    const dx = pl.x - p.x, dy = pl.y - p.y, d = Math.hypot(dx, dy) || 1;
    p.angle = Math.atan2(dy, dx);
    const sp = p.speed * dt;
    movePedTo(p, p.x + (dx / d) * sp, p.y + (dy / d) * sp);
    p.anim += dt * 10;
    if (pl.onFoot && d < 7) bustPlayer();
    if (d > 520) p.removed = true;
    return;
  }
  let speed = p.speed;
  if (p.state === 'flee') {
    speed = 58;
    p.fleeT -= dt;
    if (p.fleeT <= 0) { p.state = 'walk'; }
  }
  const dx = p.tx - p.x, dy = p.ty - p.y;
  const d = Math.hypot(dx, dy);
  if (d < 1.2) {
    // se terminou de fugir fora da calçada, tenta voltar para área de pedestre
    pedPickTarget(p, p.state === 'flee' || !pedWalkable(Math.floor(p.x / T), Math.floor(p.y / T)));
  } else {
    const s = Math.min(d, speed * dt);
    const nx = p.x + (dx / d) * s, ny = p.y + (dy / d) * s;
    if (solidPx(nx, ny)) pedPickTarget(p, true);
    else { p.x = nx; p.y = ny; }
    p.angle = Math.atan2(dy, dx);
    p.anim += dt * (speed / 6);
  }
}

function scarePeds(x, y, radius, threat) {
  for (const q of World.peds) {
    if (q.state === 'down' || q.state === 'chase' || q.state === 'wait' || q.inCar) continue;
    if (Math.abs(q.x - x) < radius && Math.abs(q.y - y) < radius) {
      if (q.state !== 'flee') { q.state = 'flee'; q.threat = threat; q.fleeT = randRange(3, 5); pedPickTarget(q, true); }
      else q.fleeT = Math.max(q.fleeT, 2);
    }
  }
}

function ejectDriver(c, flee) {
  c.hasDriver = false;
  const left = [Math.sin(c.angle), -Math.cos(c.angle)];
  const off = c.wid / 2 + 5;
  let x = c.x + left[0] * off, y = c.y + left[1] * off;
  if (solidPx(x, y)) { x = c.x - left[0] * off; y = c.y - left[1] * off; }
  if (solidPx(x, y)) return;
  const kind = c.isPolice ? 'officer' : 'civ';
  const p = makePed(x, y, kind);
  if (kind === 'officer' && wantedStars() > 0) p.state = 'chase';
  else if (flee) { p.state = 'flee'; p.threat = World.player; p.fleeT = 5; pedPickTarget(p, true); }
  else pedPickTarget(p, false);
  World.peds.push(p);
}

/* ---------- Jogador ---------- */
function makePlayer() {
  const pal = makePedPalette('player');
  return {
    isPlayer: true, x: City.spots.start.x, y: City.spots.start.y, angle: Math.PI, onFoot: true, car: null,
    health: 100, money: 0, heat: 0, alive: true, downT: 0, punchT: 0, punchCd: 0, anim: 0, regenT: 0,
    pal, frames: pedFrames(pal), bustT: 0, crimeCd: {}, deaths: 0, busts: 0,
  };
}

function wantedStars() { return World.player ? Math.min(5, Math.floor(World.player.heat)) : 0; }

function addHeat(v, reason, cdKey) {
  const p = World.player;
  if (cdKey) {
    const k = reason;
    if ((p.crimeCd[k] || 0) > World.time) return;
    p.crimeCd[k] = World.time + cdKey;
  }
  const before = wantedStars();
  // crime testemunhado por patrulha próxima
  for (const c of World.cars) {
    if (c.isPolice && c.mode === 'ai' && c.hasDriver && dist(c.x, c.y, p.x, p.y) < 240) {
      v += 1;
      startChase(c);
      break;
    }
  }
  p.heat = Math.min(5.99, p.heat + v);
  p.lastCrime = World.time;
  if (wantedStars() > before) { Sound.wanted(); uiToast('PROCURADO: ' + '★'.repeat(wantedStars()), 'wanted'); }
}

function startChase(c) {
  if (c.mode === 'ai') { c.vx = Math.cos(c.angle) * c.v; c.vy = Math.sin(c.angle) * c.v; c.ai = null; }
  c.mode = 'police'; c.siren = true; c.repathT = 0; c.officerOut = false;
}

function hurtPlayer(amount, why) {
  const p = World.player;
  if (!p.alive) return;
  p.health -= amount;
  p.regenT = 5;
  World.shake = Math.max(World.shake, 3);
  if (p.health <= 0) { p.health = 0; wastePlayer(why); }
}

function playerCarControls(car) {
  const ax = Input.axis();
  let throttle = 0, steer = 0;
  if (Input.touch.active) {
    const mag = Math.min(1, Math.hypot(ax.x, ax.y));
    if (mag > 0.2) {
      const desired = Math.atan2(ax.y, ax.x);
      const diff = angDiff(car.angle, desired);
      if (Math.abs(diff) > 2.5 && Math.abs(car.v) < 60) { throttle = -mag; steer = 0; }
      else { steer = clamp(diff * 2.4, -1, 1) * (car.v < 0 ? -1 : 1); throttle = mag * (Math.abs(diff) > 1.5 ? 0.35 : 1); }
    }
  } else {
    throttle = (Input.down('up') ? 1 : 0) - (Input.down('down') ? 1 : 0);
    steer = (Input.down('right') ? 1 : 0) - (Input.down('left') ? 1 : 0);
  }
  return { throttle, steer, handbrake: Input.down('action') };
}

function updatePlayer(dt) {
  const p = World.player;
  if (!p.alive) return;
  if (p.punchCd > 0) p.punchCd -= dt;
  if (p.punchT > 0) p.punchT -= dt;
  if (p.regenT > 0) p.regenT -= dt; else if (p.health < 100) p.health = Math.min(100, p.health + 4 * dt);

  if (!p.onFoot) {
    const c = p.car;
    if (!c || c.removed) { p.onFoot = true; p.car = null; return; }
    updatePhysicsCar(c, dt, playerCarControls(c));
    p.x = c.x; p.y = c.y; p.angle = c.angle;
    if (Math.abs(c.v) > 110) scarePeds(c.x + Math.cos(c.angle) * 30, c.y + Math.sin(c.angle) * 30, 34, c);
    if (Input.hit('horn')) { Sound.horn(); scarePeds(c.x, c.y, 60, c); }
    if (Input.hit('enter')) exitCar();
    Sound.setEngine(true, c.v);
    return;
  }
  Sound.setEngine(false, 0);
  if (p.downT > 0) { p.downT -= dt; return; }
  const ax = Input.axis();
  let mx = ax.x, my = ax.y;
  const mag = Math.hypot(mx, my);
  if (mag > 0.15) {
    if (mag > 1) { mx /= mag; my /= mag; }
    const run = Input.down('run') || (Input.touch.active && mag > 0.92);
    const sp = (run ? 84 : 48) * dt;
    const nx = p.x + mx * sp, ny = p.y + my * sp;
    if (!playerSolid(nx, p.y)) p.x = nx;
    if (!playerSolid(p.x, ny)) p.y = ny;
    p.angle = Math.atan2(my, mx);
    p.anim += dt * (run ? 16 : 9);
  } else p.anim = 0;
  pushOutOfCars(p);
  if (Input.hit('action')) punch();
  if (Input.hit('enter')) tryEnterCar();
}

function playerSolid(x, y) {
  return solidPx(x - 3, y - 3) || solidPx(x + 3, y - 3) || solidPx(x - 3, y + 3) || solidPx(x + 3, y + 3);
}

function pushOutOfCars(p) {
  for (const c of World.cars) {
    if (c.removed) continue;
    const dx = p.x - c.x, dy = p.y - c.y;
    if (Math.abs(dx) > 24 || Math.abs(dy) > 24) continue;
    const ca = Math.cos(c.angle), sa = Math.sin(c.angle);
    const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
    const hx = c.len / 2 + 3, hy = c.wid / 2 + 3;
    if (Math.abs(lx) < hx && Math.abs(ly) < hy) {
      const speed = c.mode === 'ai' ? Math.abs(c.v) : Math.hypot(c.vx, c.vy);
      if (speed > 55 && p.downT <= 0 && c !== p.car) {
        hurtPlayer(speed * 0.22, 'atropelado');
        p.downT = 1.1;
      }
      const px = hx - Math.abs(lx), py = hy - Math.abs(ly);
      let nlx = lx, nly = ly;
      if (px < py) nlx = Math.sign(lx || 1) * hx; else nly = Math.sign(ly || 1) * hy;
      const nx = c.x + nlx * ca - nly * sa, ny = c.y + nlx * sa + nly * ca;
      if (!playerSolid(nx, ny)) { p.x = nx; p.y = ny; }
    }
  }
}

function punch() {
  const p = World.player;
  if (p.punchCd > 0) return;
  p.punchCd = 0.4; p.punchT = 0.15;
  const fx = Math.cos(p.angle), fy = Math.sin(p.angle);
  let target = null, bd = 14;
  for (const q of World.peds) {
    if (q.state === 'down' || q.inCar) continue;
    const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
    if (d < bd && (dx * fx + dy * fy) / (d || 1) > 0.3) { bd = d; target = q; }
  }
  Sound.punch();
  if (target) {
    knockPed(target, target.x - p.x, target.y - p.y, 60);
    addHeat(target.kind === 'officer' ? 1 : 0.35, target.kind === 'officer' ? 'agrediu policial' : 'agressão');
    scarePeds(p.x, p.y, 70, p);
  }
}

function tryEnterCar() {
  const p = World.player;
  let best = null, bd = 1e9;
  for (const c of World.cars) {
    if (c.removed || c.wreck || c.burning > 0) continue;
    const d = dist(p.x, p.y, c.x, c.y);
    if (d < c.len / 2 + 13 && d < bd) { best = c; bd = d; }
  }
  if (!best) return;
  const speed = best.mode === 'ai' ? Math.abs(best.v) : Math.hypot(best.vx, best.vy);
  if (speed > 45) return;
  if (best.mode === 'ai') {
    best.vx = Math.cos(best.angle) * best.v; best.vy = Math.sin(best.angle) * best.v;
    best.ai = null;
    ejectDriver(best, true);
    addHeat(best.isPolice ? 1.5 : 0.4, 'roubo de carro');
    uiToast(best.isPolice ? 'VIATURA ROUBADA!' : 'CARRO ROUBADO!', best.isPolice ? 'wanted' : '');
  } else if (best.mode === 'police') {
    ejectDriver(best, false);
    addHeat(1.5, 'roubo de viatura');
    uiToast('VIATURA ROUBADA!', 'wanted');
  } else if (best.hasDriver) {
    ejectDriver(best, true);
    addHeat(0.3, 'roubo de carro');
  } else if (best.isPolice) {
    addHeat(1.2, 'roubo de viatura');
    uiToast('VIATURA ROUBADA!', 'wanted');
  }
  best.mode = 'player'; best.ai = null; best.siren = false; best.driverExitT = 0; best.hasDriver = false; best.parkedHome = false;
  p.car = best; p.onFoot = false;
  Sound.door();
  if (typeof Missions !== 'undefined') Missions.onEnterCar(best);
}

function exitCar() {
  const p = World.player, c = p.car;
  if (!c) return;
  const speed = Math.hypot(c.vx, c.vy);
  const left = [Math.sin(c.angle), -Math.cos(c.angle)];
  const fwd = [Math.cos(c.angle), Math.sin(c.angle)];
  const offs = [[left, c.wid / 2 + 5], [[-left[0], -left[1]], c.wid / 2 + 5], [fwd, c.len / 2 + 5], [[-fwd[0], -fwd[1]], c.len / 2 + 5]];
  for (const [v, o] of offs) {
    const x = c.x + v[0] * o, y = c.y + v[1] * o;
    if (!playerSolid(x, y)) {
      p.x = x; p.y = y; p.onFoot = true; p.car = null;
      c.mode = 'free'; c.freeT = 0;
      p.angle = Math.atan2(v[1], v[0]);
      if (speed > 70) { p.downT = 0.8; hurtPlayer(speed * 0.08, 'pulou do carro'); }
      Sound.door();
      if (typeof Missions !== 'undefined') Missions.onExitCar(c);
      return;
    }
  }
}

function bustPlayer() {
  const p = World.player;
  if (!p.alive) return;
  p.alive = false;
  p.busts++;
  const fine = Math.max(150, Math.floor(p.money * 0.15));
  p.money = Math.max(0, p.money - fine);
  Sound.fail();
  uiBig('PRESO!', `Multa de $${fine}. A polícia te levou para a delegacia.`, 'busted');
  respawnLater(City.spots.police);
}

function wastePlayer(why) {
  const p = World.player;
  if (!p.alive) return;
  p.alive = false;
  p.deaths++;
  const fee = Math.min(p.money, 300);
  p.money -= fee;
  Sound.fail();
  uiBig('DETONADO!', `Conta do hospital: $${fee}.`, 'wasted');
  respawnLater(City.spots.hospital);
}

function respawnLater(spot) {
  const p = World.player;
  if (typeof Missions !== 'undefined' && Missions.active) Missions.fail('Missão perdida.', true);
  World.respawn = { t: 3.2, spot };
  if (p.car) { p.car.mode = 'free'; p.car = null; }
  p.onFoot = true;
}

function doRespawn() {
  const p = World.player, r = World.respawn;
  p.x = r.spot.x; p.y = r.spot.y; p.alive = true; p.health = 100; p.heat = 0; p.downT = 0;
  for (const c of World.cars) if (c.mode === 'police') { c.mode = 'free'; c.siren = false; }
  for (const q of World.peds) if (q.state === 'chase') q.removed = true;
  World.respawn = null;
}

/* ---------- Polícia ---------- */
function lineClearWide(x0, y0, x1, y1, w) {
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1;
  const nx = (-dy / d) * w, ny = (dx / d) * w;
  return lineClear(x0 + nx, y0 + ny, x1 + nx, y1 + ny) && lineClear(x0 - nx, y0 - ny, x1 - nx, y1 - ny);
}

function updatePoliceCar(c, dt) {
  const p = World.player;
  let tx = p.x, ty = p.y;
  if (!p.onFoot && p.car) { tx += p.car.vx * 0.35; ty += p.car.vy * 0.35; }
  const d = dist(c.x, c.y, p.x, p.y);
  c.repathT -= dt;
  let direct = d < 150 && lineClearWide(c.x, c.y, p.x, p.y, 5);
  if (!direct) {
    if (c.repathT <= 0 || !c.wp || dist(c.x, c.y, c.wp.cx, c.wp.cy) < 22) {
      c.repathT = 0.7;
      const a = nearestNode(c.x, c.y, (n) => lineClearWide(c.x, c.y, n.cx, n.cy, 4)) || nearestNode(c.x, c.y);
      const b = nearestNode(p.x, p.y);
      const path = nodePath(a, b);
      let wp = path[0];
      for (let i = path.length - 1; i >= 0; i--) {
        if (lineClearWide(c.x, c.y, path[i].cx, path[i].cy, 5)) { wp = path[i]; break; }
      }
      if (dist(c.x, c.y, wp.cx, wp.cy) < 22 && path.length > 1) wp = path[Math.min(path.length - 1, path.indexOf(wp) + 1)];
      c.wp = wp;
    }
    tx = c.wp.cx; ty = c.wp.cy;
  }
  const desired = Math.atan2(ty - c.y, tx - c.x);
  const diff = angDiff(c.angle, desired);
  let steer = clamp(diff * 2.4, -1, 1);
  let throttle = Math.abs(diff) > 1.7 ? 0.3 : 1;
  const speed = Math.hypot(c.vx, c.vy);
  if (!direct && dist(c.x, c.y, tx, ty) < 70 && speed > 130) throttle = 0.2;
  if (d < 46) throttle = p.onFoot ? -0.4 : Math.hypot(p.car.vx, p.car.vy) < 40 ? 0.12 : 0.7;
  let hand = Math.abs(diff) > 1.1 && speed > 120;
  if (c.revT > 0) {
    c.revT -= dt; throttle = -1; steer = -steer; hand = false;
  } else if (speed < 12 && throttle > 0.5) {
    c.stuckT += dt;
    if (c.stuckT > 0.9) { c.revT = 0.8; c.stuckT = 0; }
  } else c.stuckT = 0;
  updatePhysicsCar(c, dt, { throttle, steer, handbrake: hand });

  // prisão
  if (p.onFoot) {
    if (d < 70 && speed < 50 && !c.officerOut && c.hasDriver) { c.officerOut = true; ejectDriver(c, false); }
  } else if (p.car && d < c.len / 2 + p.car.len / 2 + 10 && Math.hypot(p.car.vx, p.car.vy) < 32) {
    p.bustT += dt;
  }
}

function managePolice(dt, view) {
  const p = World.player;
  const stars = wantedStars();
  let chasing = 0, patrols = 0;
  for (const c of World.cars) {
    if (c.removed || !c.isPolice) continue;
    if (c.mode === 'police') chasing++;
    if (c.mode === 'ai') patrols++;
  }
  if (p.alive && !p.onFoot) {
    let near = false;
    for (const c of World.cars) if (c.mode === 'police' && dist(c.x, c.y, p.x, p.y) < c.len / 2 + p.car.len / 2 + 10) near = true;
    if (!near) p.bustT = Math.max(0, p.bustT - dt);
    if (p.bustT > 1.6) { p.bustT = 0; bustPlayer(); }
  }
  // número de viaturas na perseguição
  const want = stars === 0 ? 0 : Math.min(7, stars + (stars >= 3 ? 2 : 0));
  World.policeSpawnT = (World.policeSpawnT || 0) - dt;
  if (p.alive && chasing < want && World.policeSpawnT <= 0) {
    World.policeSpawnT = Math.max(0.8, 3 - stars * 0.4);
    const sp = findLaneSpawn(19, view);
    if (sp && dist(sp.x, sp.y, p.x, p.y) < 700) {
      const c = makeCar('police', null, sp.x, sp.y, DIR_ANG[sp.dir], 'police');
      c.siren = true; c.hasDriver = true;
      c.vx = Math.cos(c.angle) * 60; c.vy = Math.sin(c.angle) * 60;
      World.cars.push(c);
    }
  }
  if (stars === 0) {
    for (const c of World.cars) if (c.mode === 'police') { c.mode = 'free'; c.siren = false; c.freeT = 0; }
  }
  if (patrols < POP.patrols) {
    const c = spawnAICar('police', view);
    if (c) { c.hasDriver = true; c.ai.cruise = 80; }
  }
  // estrelas baixam com o tempo quando a polícia não está por perto
  if (p.heat > 0 && p.alive) {
    let seen = false;
    for (const c of World.cars) if (c.mode === 'police' && dist(c.x, c.y, p.x, p.y) < 280) { seen = true; break; }
    if (!seen) for (const q of World.peds) if (q.state === 'chase' && dist(q.x, q.y, p.x, p.y) < 200) { seen = true; break; }
    const sinceCrime = World.time - (p.lastCrime || 0);
    if (stars === 0) p.heat = Math.max(0, p.heat - dt * 0.03);
    else if (!seen && sinceCrime > 4) {
      const before = stars;
      p.heat = Math.max(0, p.heat - dt / 12);
      if (wantedStars() < before && wantedStars() === 0) uiToast('VOCÊ DESPISTOU A POLÍCIA', 'good');
    }
  }
}

/* ---------- Partículas ---------- */
function addParticle(type, x, y, vx, vy) {
  if (World.particles.length > 500) return;
  const p = { type, x, y, vx: vx || 0, vy: vy || 0, life: 0, max: 1, size: 2 };
  if (type === 'smoke') { p.max = randRange(0.9, 1.6); p.vx = vx || randRange(-8, 8); p.vy = vy || randRange(-14, -4); p.size = 2; }
  else if (type === 'fire') { p.max = randRange(0.25, 0.55); p.vx = vx || randRange(-10, 10); p.vy = vy || randRange(-26, -8); p.size = randRange(2, 4); }
  else if (type === 'spark') { p.max = randRange(0.2, 0.4); p.vx = vx || randRange(-70, 70); p.vy = vy || randRange(-70, 70); p.size = 1; }
  else if (type === 'splash') { p.max = 0.6; }
  World.particles.push(p);
}

function updateParticles(dt) {
  const arr = World.particles;
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i];
    p.life += dt;
    if (p.life >= p.max) { arr[i] = arr[arr.length - 1]; arr.pop(); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= Math.exp(-2 * dt); p.vy *= Math.exp(-2 * dt);
    if (p.type === 'smoke') p.size += dt * 5;
  }
}

/* ---------- Dinheiro espalhado ---------- */
function spawnPickup() {
  const p = World.player;
  for (let i = 0; i < 20; i++) {
    const s = pick(City.pickupSpots);
    if (p && dist(s.x, s.y, p.x, p.y) < 300) continue;
    if (World.pickups.some((k) => dist(k.x, k.y, s.x, s.y) < 100)) continue;
    World.pickups.push({ x: s.x, y: s.y, amount: pick([50, 100, 100, 150, 250]), ph: Math.random() * 6 });
    return;
  }
}

function updatePickups(dt) {
  const p = World.player;
  for (let i = World.pickups.length - 1; i >= 0; i--) {
    const k = World.pickups[i];
    k.ph += dt;
    if (p.alive && dist(k.x, k.y, p.x, p.y) < (p.onFoot ? 10 : 16)) {
      p.money += k.amount;
      Sound.coin();
      uiToast(`+$${k.amount}`, 'money');
      World.pickups.splice(i, 1);
    }
  }
  while (World.pickups.length < POP.pickups) { const n = World.pickups.length; spawnPickup(); if (World.pickups.length === n) break; }
}

/* ---------- Atualização geral das entidades ---------- */
function updateEntities(dt, view) {
  const time = World.time;
  const p = World.player;
  for (const c of World.cars) {
    if (c.removed) continue;
    if (c.mode === 'ai') updateAICar(c, dt, time);
    else if (c.mode === 'police') updatePoliceCar(c, dt);
    else if (c.mode === 'free') { updatePhysicsCar(c, dt, { throttle: 0, steer: 0, handbrake: c.wreck }); c.freeT += dt; }
    updateCarStatus(c, dt);
  }
  updatePlayer(dt);
  resolveCarPairs();

  // carros atropelando pedestres
  for (const c of World.cars) {
    if (c.removed || c.mode === 'ai') continue;
    const speed = Math.hypot(c.vx, c.vy);
    if (speed < 25) continue;
    const ca = Math.cos(c.angle), sa = Math.sin(c.angle);
    for (const q of World.peds) {
      if (q.state === 'down' || q.inCar || q.hitCd > 0) continue;
      const dx = q.x - c.x, dy = q.y - c.y;
      if (Math.abs(dx) > 20 || Math.abs(dy) > 20) continue;
      const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
      if (Math.abs(lx) < c.len / 2 + 2 && Math.abs(ly) < c.wid / 2 + 2) {
        q.hitCd = 1;
        knockPed(q, c.vx, c.vy, speed);
        if (c === p.car) {
          addHeat(q.kind === 'officer' ? 1.2 : 0.6, 'atropelamento');
          Sound.punch();
        }
        c.vx *= 0.92; c.vy *= 0.92;
        scarePeds(q.x, q.y, 60, c);
      }
    }
  }
  for (const q of World.peds) if (!q.removed && !q.inCar) updatePed(q, dt);
  managePolice(dt, view);
  updateParticles(dt);
  updatePickups(dt);
  for (let i = World.flashes.length - 1; i >= 0; i--) { World.flashes[i].t -= dt; if (World.flashes[i].t <= 0) World.flashes.splice(i, 1); }
}

// Mantém a cidade viva: repõe carros e pedestres fora da tela e limpa sucata
function maintainPopulation(view) {
  const p = World.player;
  const inView = (o, m = 0) => o.x > view.x0 - m && o.x < view.x1 + m && o.y > view.y0 - m && o.y < view.y1 + m;
  let ai = 0, free = 0;
  for (const c of World.cars) {
    if (c.removed) continue;
    if (c.mode === 'ai' && !c.isPolice) ai++;
    if (c.mode === 'free' && !c.mission) {
      free++;
      const far = !inView(c, 120);
      if (far && ((c.wreck && c.freeT > 25) || (c.freeT > 50) || (c.isPolice && c.freeT > 8 && !c.parkedHome))) c.removed = true;
    }
    if (c.mode === 'police' && dist(c.x, c.y, p.x, p.y) > 1400) c.removed = true;
  }
  if (free > POP.maxFree) {
    const list = World.cars.filter((c) => c.mode === 'free' && !c.mission && !c.removed && !inView(c, 80) && !c.parkedHome).sort((a, b) => b.freeT - a.freeT);
    for (let i = 0; i < free - POP.maxFree && i < list.length; i++) list[i].removed = true;
  }
  if (ai < POP.ai) spawnAICar(null, view);
  World.cars = World.cars.filter((c) => !c.removed);
  let civ = 0;
  for (const q of World.peds) {
    if (q.removed) continue;
    if (q.kind === 'civ' && q.state !== 'wait') civ++;
    if (q.kind === 'officer' && q.state !== 'chase' && !inView(q, 60)) q.removed = true;
  }
  if (civ < POP.peds) spawnPed(view);
  World.peds = World.peds.filter((q) => !q.removed);
}
