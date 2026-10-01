/* ============================================================
   ai.js — tráfego, pedestres, polícia, helicóptero e semáforos
   ============================================================ */
(function (G) {
  'use strict';
  const W = G.world, T = W.T, ROWS = W.ROWS, COLS = W.COLS, MG = W.MG, PITCH = W.PITCH;
  const TAU = Math.PI * 2;
  const wrap = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // ---------- Semáforos ----------
  const CYCLE = 16.4; // verde 5,5s • amarelo 1,5s • todos vermelhos 1,2s (nos dois sentidos)
  function lightState(axis, time) {
    const t = time % CYCLE;
    if (axis === 'v') return t < 5.5 ? 'g' : t < 7 ? 'y' : 'r';
    return t < 8.2 ? 'r' : t < 13.7 ? 'g' : t < 15.2 ? 'y' : 'r';
  }
  function drawLights(ctx, x0, y0, x1, y1, time) {
    const cols = { g: '#3dff6a', y: '#ffe23d', r: '#ff3d3d' };
    const sv = lightState('v', time), sh = lightState('h', time);
    for (let i = 0; i <= COLS; i++) for (let j = 0; j <= ROWS; j++) {
      const cx = W.nodeX(i), cy = W.nodeY(j);
      if (cx < x0 - 200 || cx > x1 + 200 || cy < y0 - 200 || cy > y1 + 200) continue;
      const d = ROWS && (ROAD_HALF() + 14);
      [[-1, -1, sv], [1, 1, sv], [1, -1, sh], [-1, 1, sh]].forEach(([sx, sy, st]) => {
        const x = cx + sx * d, y = cy + sy * d;
        ctx.fillStyle = '#20202a'; ctx.fillRect(x - 6, y - 6, 12, 12);
        ctx.fillStyle = cols[st]; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill();
        const g = ctx.createRadialGradient(x, y, 1, x, y, 16); g.addColorStop(0, st === 'g' ? 'rgba(60,255,100,0.5)' : st === 'y' ? 'rgba(255,230,60,0.5)' : 'rgba(255,60,60,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(x - 16, y - 16, 32, 32);
      });
    }
  }
  function ROAD_HALF() { return W.ROAD * T / 2; }

  // ---------- Navegação por faixas ----------
  const alongOf = (n, c) => n.axis === 'v' ? c.y : c.x;
  const nodeCoord = n => n.axis === 'v' ? W.nodeY(n.nj) : W.nodeX(n.ni);
  const laneCoord = n => n.axis === 'v' ? W.laneV(n.idx, n.dir) : W.laneH(n.idx, n.dir);
  const angFor = (axis, dir) => axis === 'v' ? (dir > 0 ? Math.PI : 0) : (dir > 0 ? Math.PI / 2 : -Math.PI / 2);

  function initNav(axis, idx, dir, along) {
    const k = (along / T - MG - ROWS * 0 - 3) / PITCH;
    let n = dir > 0 ? Math.ceil(k - 1e-6) : Math.floor(k + 1e-6);
    const nav = { axis, idx, dir, ni: 0, nj: 0, m: null, mode: 'wander', target: null };
    if (axis === 'v') { nav.ni = idx; nav.nj = clamp(n, 0, ROWS); } else { nav.nj = idx; nav.ni = clamp(n, 0, COLS); }
    return nav;
  }

  function chooseManeuver(car) {
    const n = car.nav, i = n.ni, j = n.nj, d = n.dir, opts = [];
    if (n.axis === 'v') {
      if (d > 0 ? j < ROWS : j > 0) opts.push({ k: 's', ni: i, nj: j + d });
      const rh = d > 0 ? -1 : 1;
      [[rh, 'r'], [-rh, 'l']].forEach(([hd, k]) => { if (hd > 0 ? i < COLS : i > 0) opts.push({ k, axis: 'h', dir: hd, ni: i + hd, nj: j, trig: W.laneH(j, hd) }); });
    } else {
      if (d > 0 ? i < COLS : i > 0) opts.push({ k: 's', ni: i + d, nj: j });
      const rv = d > 0 ? 1 : -1;
      [[rv, 'r'], [-rv, 'l']].forEach(([vd, k]) => { if (vd > 0 ? j < ROWS : j > 0) opts.push({ k, axis: 'v', dir: vd, ni: i, nj: j + vd, trig: W.laneV(i, vd) }); });
    }
    let m;
    if (n.mode === 'goto' && n.target) {
      let best = 1e9;
      opts.forEach(o => { const sc = Math.abs(o.ni - n.target.i) + Math.abs(o.nj - n.target.j) + Math.random() * 0.3; if (sc < best) { best = sc; m = o; } });
    } else {
      const wt = { s: 0.56, r: 0.22, l: 0.22 };
      let tot = 0; opts.forEach(o => tot += wt[o.k]);
      let r = Math.random() * tot;
      for (const o of opts) { r -= wt[o.k]; if (r <= 0) { m = o; break; } }
      if (!m) m = opts[0];
    }
    m = Object.assign({}, m);
    if (m.k === 's') m.trig = nodeCoord(n);
    return m;
  }
  function applyManeuver(car) {
    const n = car.nav, m = n.m;
    if (m.k === 's') { n.ni = m.ni; n.nj = m.nj; }
    else { n.axis = m.axis; n.dir = m.dir; n.idx = m.axis === 'v' ? n.ni : n.nj; n.ni = m.ni; n.nj = m.nj; }
    n.m = null;
  }

  function aheadGap(car, S, look) {
    const fx = car.fx, fy = car.fy, rx = Math.cos(car.a), ry = Math.sin(car.a);
    let best = 1e9;
    const test = (o, len, latMax) => {
      const dx = o.x - car.x, dy = o.y - car.y;
      if (dx > look + 120 || dx < -look - 120 || dy > look + 120 || dy < -look - 120) return;
      const al = dx * fx + dy * fy, lat = dx * rx + dy * ry;
      if (al > 10 && al < look + len && Math.abs(lat) < latMax) best = Math.min(best, al - len);
    };
    for (const o of S.cars) { if (o === car) continue; if (o.dead && car.stuckT > 5) continue; test(o, G.sprites.CAR_L * 0.55, 34); }
    for (const p of S.peds) if (p.state !== 'down' && p.state !== 'dead') test(p, 14, 26);
    if (!S.player.car) test(S.player, 14, 26);
    return best;
  }

  function driveTraffic(car, dt, S) {
    const n = car.nav; if (!n) return;
    const pos = alongOf(n, car);
    const nc = nodeCoord(n);
    const toNode = (nc - pos) * n.dir;
    if (!n.m && toNode < 340) n.m = chooseManeuver(car);
    if (n.m && (pos - n.m.trig) * n.dir >= -(n.m.k === 's' ? 0 : n.m.k === 'r' ? 34 : 70)) applyManeuver(car);
    // ponto de mira
    const lc = laneCoord(n);
    const tx = n.axis === 'v' ? lc : car.x + n.dir * 150, ty = n.axis === 'v' ? car.y + n.dir * 150 : lc;
    const want = Math.atan2(tx - car.x, -(ty - car.y));
    let steer = clamp(wrap(want - car.a) * 2.6, -1, 1);
    // velocidade desejada
    let v = car.cruise;
    if (n.m && n.m.k !== 's' && toNode < 260) v = Math.min(v, n.m.k === 'l' ? 105 : 95);
    // semáforo
    if (!car.ignoreLights) {
      const stopAt = (nc - n.dir * (ROAD_HALF() + 14));
      const rem = (stopAt - pos) * n.dir;
      const st = lightState(n.axis, S.time);
      if (st !== 'g' && rem > -6 && rem < 260) {
        const brakeD = Math.max(0, rem - 6);
        if (st === 'r' || brakeD > car.vf * car.vf / 500) v = Math.min(v, Math.sqrt(2 * 240 * brakeD));
      }
    }
    // cruzamento: não invadir se estiver ocupado e ceder na conversão à esquerda
    if (toNode > 70 && toNode < 330 && !car.ignoreLights) {
      const nx = W.nodeX(n.ni), ny = W.nodeY(n.nj), hb = ROAD_HALF() + 6;
      let block = false;
      for (const o of S.cars) {
        if (o === car) continue;
        const ox = o.x - nx, oy = o.y - ny, dot = o.fx * car.fx + o.fy * car.fy;
        if (Math.abs(ox) < hb && Math.abs(oy) < hb) {
          if (toNode > hb - 12 && (Math.abs(dot) < 0.5 || (dot < -0.7 && n.m && n.m.k === 'l') || o.speed < 40)) { block = true; break; }
        } else if (n.m && n.m.k === 'l' && dot < -0.7 && o.speed > 40 && Math.hypot(ox, oy) < 330 && toNode < 260) {
          if (!(o.nav && o.nav.m && o.nav.m.k === 'l') || o.id < car.id) { block = true; break; }
        }
      }
      if (block) v = Math.min(v, Math.max(0, toNode - (ROAD_HALF() + 14)) * 1.7);
    }
    // pisca-pisca: avisa antes de virar
    car.blink = (n.m && n.m.k !== 's' && toNode < 280) ? (n.m.k === 'r' ? 1 : -1) : 0;
    // ambulância/polícia de sirene atrás: reduz e deixa passar
    if (car.kind !== 'police') for (const o of S.cars) {
      if (o.kind !== 'police' || !o.siren || o.dead || o === car) continue;
      const dx = o.x - car.x, dy = o.y - car.y; if (Math.abs(dx) > 340 || Math.abs(dy) > 340) continue;
      const al = dx * car.fx + dy * car.fy, lat = dx * Math.cos(car.a) + dy * Math.sin(car.a);
      if (al < 0 && al > -320 && Math.abs(lat) < 70) { v = Math.min(v, 45); car.blink = 1; break; }
    }
    // carro / pessoa na frente (cada motorista tem seu jeito: calmo, normal ou apressado)
    const look = 70 + Math.max(0, car.vf) * 0.9;
    const gap = aheadGap(car, S, look);
    if (gap < 1e8) v = Math.min(v, Math.max(0, gap - 26 - (car.gapX || 0)) * 1.7);
    // buzina quando fica preso atrás de alguém por muito tempo
    if (gap < 70 && car.vf < 10 && lightState(n.axis, S.time) === 'g') car.blockT = (car.blockT || 0) + dt; else if (car.blockT > 0) car.blockT = 0; else if (car.blockT < 0) car.blockT = Math.min(0, car.blockT + dt);
    if (car.blockT > 2.6) {
      car.blockT = -4;
      const P = S.player, d = Math.hypot(car.x - P.x, car.y - P.y);
      if (d < 650 && G.snd.honk) G.snd.honk(1 - d / 650);
      car.honkFlash = 0.5;
    }
    // controle
    const vf = car.vf, err = v - vf;
    car.hb = false;
    if (car.hold > 0) { car.hold -= dt; v = 0; }
    if (err > 8) car.thr = clamp(err / 45, 0.3, 1);
    else if (err < -14) car.thr = -clamp(-err / 60, 0.35, 1);
    else car.thr = 0;
    if (v < 4 && Math.abs(vf) < 40) { car.thr = 0; car.hb = true; }
    // destravar
    if (v > 40 && Math.abs(vf) < 6) car.stuckT += dt; else if (car.revT <= 0) car.stuckT = Math.max(0, car.stuckT - dt);
    if (car.stuckT > 2.5 && car.revT <= 0) { car.revT = 1.1; car.stuckT = 0; }
    if (car.revT > 0) { car.revT -= dt; car.thr = -1; steer = -steer; car.hb = false; }
    car.steer = steer;
  }

  function directPursuit(car, dt, S) {
    const P = S.player, tg = P.car || P;
    const tvx = tg.vx || 0, tvy = tg.vy || 0;
    const dxp = tg.x + tvx * 0.4 - car.x, dyp = tg.y + tvy * 0.4 - car.y;
    const dist = Math.hypot(tg.x - car.x, tg.y - car.y);
    let want = Math.atan2(dxp, -dyp);
    if (car.mode === 'leave') want = Math.atan2(car.x - tg.x, -(car.y - tg.y));
    let diff = wrap(want - car.a);
    let bias = 0;
    const probe = ang => W.isSolid(car.x + Math.sin(ang) * 90, car.y - Math.cos(ang) * 90);
    if (probe(car.a + 0.5)) bias -= 0.9; if (probe(car.a - 0.5)) bias += 0.9;
    if (probe(car.a)) bias += (diff >= 0 ? 0.8 : -0.8);
    let steer = clamp(diff * 2.4 + bias, -1, 1);
    let thr = 1;
    if (car.mode !== 'leave') {
      if (dist < 90 && (!P.car || P.car.speed < 60)) thr = 0.15;
      if (Math.abs(diff) > 2.3 && dist < 350) thr = 0.5;
    }
    if (Math.abs(car.vf) < 14 && thr > 0.3 && car.revT <= 0) car.stuckT += dt; else if (car.revT <= 0) car.stuckT = 0;
    if (car.stuckT > 0.9 && car.revT <= 0) { car.revT = 0.9; car.stuckT = 0; }
    car.hb = false;
    if (car.revT > 0) { car.revT -= dt; thr = -1; steer = -steer; }
    car.thr = thr * (car.chaseScale || 1); if (thr < 0) car.thr = thr;
    car.steer = steer;
  }

  // a polícia segue as ruas e só parte direto para cima quando enxerga o alvo
  function lineClear(ax, ay, bx, by) {
    const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / 36);
    for (let k = 1; k < n; k++) { const t = k / n; if (W.isSolid(ax + (bx - ax) * t, ay + (by - ay) * t)) return false; }
    return true;
  }
  function resnap(car) {
    const cx = Math.round((car.x / T - MG - 3) / PITCH), cy = Math.round((car.y / T - MG - 3) / PITCH);
    const i = clamp(cx, 0, COLS), j = clamp(cy, 0, ROWS);
    const dv = Math.abs(car.x - W.nodeX(i)), dh = Math.abs(car.y - W.nodeY(j));
    if (Math.min(dv, dh) > 110) return false;
    if (dv <= dh) car.nav = initNav('v', i, car.fy > 0 ? 1 : -1, car.y); else car.nav = initNav('h', j, car.fx > 0 ? 1 : -1, car.x);
    return true;
  }
  function driveChase(car, dt, S) {
    const P = S.player, tg = P.car || P;
    const dist = Math.hypot(tg.x - car.x, tg.y - car.y);
    const direct = car.mode === 'chase' && dist < 650 && lineClear(car.x, car.y, tg.x, tg.y);
    if (direct) { car.navDirect = true; return directPursuit(car, dt, S); }
    if (car.navDirect || !car.nav) { car.navDirect = false; if (!resnap(car)) return directPursuit(car, dt, S); }
    const n = car.nav;
    if (car.mode === 'chase') {
      n.mode = 'goto'; n.target = { i: clamp(Math.round((tg.x / T - MG - 3) / PITCH), 0, COLS), j: clamp(Math.round((tg.y / T - MG - 3) / PITCH), 0, ROWS) };
      car.cruise = 300 * (car.chaseScale || 1);
    } else { n.mode = 'wander'; car.cruise = 250; }
    car.ignoreLights = true;
    driveTraffic(car, dt, S);
  }

  // ---------- Pontos aleatórios nas ruas ----------
  function randomRoadPoint(cx, cy, minD, maxD, tries) {
    for (let t = 0; t < (tries || 30); t++) {
      const axis = Math.random() < 0.5 ? 'v' : 'h', dir = Math.random() < 0.5 ? 1 : -1;
      let idx, along;
      const ang = Math.random() * TAU, d = rand(minD, maxD);
      const px = cx + Math.cos(ang) * d, py = cy + Math.sin(ang) * d;
      if (axis === 'v') {
        idx = clamp(Math.round((px / T - MG - 3) / PITCH), 0, COLS);
        along = py;
        const k = clamp(Math.round((along / T - MG - 3) / PITCH), 0, ROWS), nyy = W.nodeY(k);
        if (Math.abs(along - nyy) < 300) along = nyy + (along >= nyy ? 1 : -1) * 320;
        along = clamp(along, W.nodeY(0) + 200, W.nodeY(ROWS) - 200);
      } else {
        idx = clamp(Math.round((py / T - MG - 3) / PITCH), 0, ROWS);
        along = px;
        const k = clamp(Math.round((along / T - MG - 3) / PITCH), 0, COLS), nxx = W.nodeX(k);
        if (Math.abs(along - nxx) < 300) along = nxx + (along >= nxx ? 1 : -1) * 320;
        along = clamp(along, W.nodeX(0) + 200, W.nodeX(COLS) - 200);
      }
      const x = axis === 'v' ? W.laneV(idx, dir) : along, y = axis === 'v' ? along : W.laneH(idx, dir);
      const dd = Math.hypot(x - cx, y - cy);
      if (dd < minD * 0.8 || dd > maxD * 1.2) continue;
      if (W.isSolid(x, y)) continue;
      return { x, y, a: angFor(axis, dir), axis, idx, dir, along };
    }
    return null;
  }

  const CAR_COLORS = ['#2f8a3c', '#2e5fb5', '#e8e8ea', '#8a8a96', '#8a2a3a', '#2a8a8a', '#c47a1e', '#6a3fa0', '#d8d04a'];
  function spawnTraffic(S, kindForce) {
    const P = S.player;
    const pt = randomRoadPoint(P.x, P.y, 620, 1150);
    if (!pt) return null;
    for (const o of S.cars) if (Math.abs(o.x - pt.x) < 140 && Math.abs(o.y - pt.y) < 140) return null;
    let kind = kindForce || (Math.random() < 0.16 ? 'taxi' : 'sedan');
    if (kind === 'police' && S.cars.filter(c => c.kind === 'police' && c.mode === 'wander').length >= 2) kind = 'sedan';
    const car = new G.Car({ x: pt.x, y: pt.y, a: pt.a, kind, color: kind === 'police' ? '#ffffff' : kind === 'taxi' ? '#f2c42a' : pick(CAR_COLORS), driver: 'ai', mode: 'wander' });
    const jeito = Math.random();
    car.pers = jeito < 0.2 ? 'apressado' : jeito < 0.42 ? 'calmo' : 'normal';
    car.cruise = car.pers === 'apressado' ? rand(235, 280) : car.pers === 'calmo' ? rand(120, 160) : rand(160, 230);
    car.gapX = car.pers === 'apressado' ? -10 : car.pers === 'calmo' ? 16 : 0;
    car.nav = initNav(pt.axis, pt.idx, pt.dir, pt.along);
    car.vx = car.fx * 120; car.vy = car.fy * 120;
    S.cars.push(car); return car;
  }

  function spawnPolice(S, n) {
    const P = S.player, tg = P.car || P;
    for (let k = 0; k < n; k++) {
      const pt = randomRoadPoint(tg.x, tg.y, 650, 950);
      if (!pt) continue;
      let ok = true; for (const o of S.cars) if (Math.abs(o.x - pt.x) < 140 && Math.abs(o.y - pt.y) < 140) ok = false;
      if (!ok) continue;
      const c = new G.Car({ x: pt.x, y: pt.y, a: pt.a, kind: 'police', color: '#ffffff', driver: 'ai', mode: 'chase', mass: 1.15 });
      c.siren = true; c.chaseScale = 0.92 + S.heatLevel * 0.02; c.max = 330 + S.heatLevel * 18;
      c.nav = initNav(pt.axis, pt.idx, pt.dir, pt.along); c.cruise = 300;
      c.vx = c.fx * 150; c.vy = c.fy * 150;
      S.cars.push(c);
    }
  }
  function spawnRoadblock(S) {
    const P = S.player, tg = P.car || P;
    const pt = randomRoadPoint(tg.x + (tg.vx || 0) * 2, tg.y + (tg.vy || 0) * 2, 700, 1000);
    if (!pt) return;
    const mid = pt.axis === 'v' ? W.roadLeft(pt.idx) + 3 * T : W.roadTop(pt.idx) + 3 * T;
    const made = [];
    [-1, 1].forEach(s => {
      const cx = pt.axis === 'v' ? mid + s * 48 : pt.along, cy = pt.axis === 'v' ? pt.along : mid + s * 48;
      const c = new G.Car({ x: cx, y: cy, a: pt.a + Math.PI / 2 + s * 0.12, kind: 'police', color: '#ffffff', driver: 'none', mode: 'block', mass: 3 });
      c.siren = true; c.born = S.time; S.cars.push(c); made.push(c);
    });
    if (G.combat) G.combat.roadblockCops(S, made);
  }

  // ---------- Pedestres ----------
  const DIRS = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
  function makePed(x, y) {
    const look = G.sprites.randomLook();
    const d = Math.floor(Math.random() * 4);
    const armed = Math.random() < 0.06; // alguns civis andam armados e reagem se forem atacados
    return Object.assign({ x, y, h: DIRS[d] + Math.PI / 2, d, speed: rand(38, 62), state: 'walk', walk: Math.random() * 6, timer: rand(2, 6), downT: 0, vx: 0, vy: 0, fleeT: 0, kind: 'civ', hp: Math.round(rand(34, 46)), armed, weapon: armed ? 'pistol' : null }, look);
  }
  const pedOk = (x, y) => { const t = W.tileAt(x, y); return W.pedWalkable(t) && !W.treeHit(x, y, 4); };
  function updatePed(p, dt, S) {
    // combate: mortos, caídos, atiradores e guardas são tratados em combat.js
    if (G.combat && G.combat.updatePed(p, dt, S)) return;
    if (p.talkT > 0 && p.state === 'walk') { p.walk = 0; return; }   // parou para conversar com você
    // susto com carros rápidos
    if (p.state === 'walk') for (const c of S.cars) {
      if (Math.abs(c.x - p.x) > 80 || Math.abs(c.y - p.y) > 80) continue;
      if (c.speed > 150 && Math.hypot(c.x - p.x, c.y - p.y) < 70) { p.state = 'flee'; p.fleeT = rand(1.5, 3); p.threat = { x: c.x, y: c.y }; break; }
    }
    if (p.state === 'flee') {
      p.fleeT -= dt;
      const t = p.threat || S.player;
      const ang = Math.atan2(p.y - t.y, p.x - t.x);
      const sp = 115, vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp;
      if (!W.isSolid(p.x + vx * dt * 2, p.y) && !W.treeHit(p.x + vx * dt * 2, p.y, 3)) p.x += vx * dt;
      if (!W.isSolid(p.x, p.y + vy * dt * 2) && !W.treeHit(p.x, p.y + vy * dt * 2, 3)) p.y += vy * dt;
      p.h += wrap(ang + Math.PI / 2 - p.h) * Math.min(1, 10 * dt); p.walk += sp * dt * 0.22;
      if (p.fleeT <= 0) { p.state = 'walk'; p.d = Math.round(((ang % TAU) + TAU) % TAU / (Math.PI / 2)) % 4; }
      return;
    }
    // andando
    const ang = DIRS[p.d];
    const vx = Math.cos(ang) * p.speed, vy = Math.sin(ang) * p.speed;
    const lx = p.x + Math.cos(ang) * 14, ly = p.y + Math.sin(ang) * 14;
    const here = W.tileAt(p.x, p.y);
    if (!pedOk(lx, ly) && W.pedWalkable(here)) {
      const opts = [0, 1, 2, 3].filter(d => d !== p.d && pedOk(p.x + Math.cos(DIRS[d]) * 14, p.y + Math.sin(DIRS[d]) * 14));
      if (opts.length) { const side = opts.filter(d => Math.abs(d - p.d) !== 2); p.d = pick(side.length ? side : opts); }
      else p.d = (p.d + 2) % 4;
    } else if (W.isSolid(lx, ly)) p.d = (p.d + 2) % 4;
    else { p.x += vx * dt; p.y += vy * dt; p.walk += p.speed * dt * 0.22; }
    p.timer -= dt;
    if (p.timer <= 0) {
      p.timer = rand(2.5, 7);
      if (here !== W.TILE.CROSS && Math.random() < 0.6) {
        const opts = [(p.d + 1) % 4, (p.d + 3) % 4].filter(d => pedOk(p.x + Math.cos(DIRS[d]) * 24, p.y + Math.sin(DIRS[d]) * 24));
        if (opts.length) p.d = pick(opts);
      }
    }
    p.h += wrap(DIRS[p.d] + Math.PI / 2 - p.h) * Math.min(1, 8 * dt);
  }
  // h = direção do corpo: o sprite "olha" para -y, então h = ang + PI/2

  function spawnPed(S) {
    const P = S.player;
    for (let t = 0; t < 12; t++) {
      const a = Math.random() * TAU, d = rand(520, 1000);
      const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
      const tt = W.tileAt(x, y);
      if (tt !== W.TILE.SIDE || !pedOk(x, y)) continue;
      const p = makePed(x, y); p.h = DIRS[p.d] + Math.PI / 2; S.peds.push(p); return p;
    }
    return null;
  }

  // ---------- Helicóptero ----------
  function updateHeli(S, dt) {
    const h = S.heli; if (!h) return;
    const tg = S.player.car || S.player;
    const dx = tg.x - h.x, dy = tg.y - h.y, d = Math.hypot(dx, dy) || 1;
    const sp = Math.min(330, d * 1.4 + 40);
    h.vx += (dx / d * sp - h.vx) * Math.min(1, 1.6 * dt); h.vy += (dy / d * sp - h.vy) * Math.min(1, 1.6 * dt);
    h.x += h.vx * dt; h.y += h.vy * dt; h.rot += dt * 30; h.life -= dt;
    h.a = Math.atan2(h.vx, -h.vy);
    if (h.life <= 0 && S.heatLevel < 5) S.heli = null;
  }

  G.ai = {
    lightState, drawLights, initNav, driveTraffic, driveChase, randomRoadPoint, spawnTraffic, spawnPolice, spawnRoadblock,
    makePed, updatePed, spawnPed, updateHeli, lineClear, angFor, wrap, clamp, rand, pick, pedOk, CAR_COLORS,
  };
})(window.G = window.G || {});
