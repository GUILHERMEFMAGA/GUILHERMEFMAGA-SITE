'use strict';
/* ============================================================
   ai.js — tráfego (faixas + semáforo), pedestres, polícia
   (perseguição, PIT, bloqueios) e helicóptero. Tom cartunesco.
   ============================================================ */
const DIRV = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }]; // E,S,O,N
const RIGHT = [{ x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }];
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };

const AI = {
  traffic: [], peds: [], cops: [], heli: null, blocks: [],
  shirtColors: ['#d84f4f', '#4f8fd8', '#e8e8e8', '#8f5ad8', '#e8a34f', '#5ad88f'],

  init() {
    this.traffic = []; this.peds = []; this.cops = []; this.heli = null; this.blocks = [];
    for (let n = 0; n < 14; n++) this.spawnTraffic();
    for (let n = 0; n < 42; n++) this.spawnPed();
  },

  /* ------------------------- TRÁFEGO ------------------------- */
  spawnTraffic() {
    const vert = Math.random() < .5;
    let x, y, dir;
    if (vert) {
      const i = (Math.random() * WORLD.VX.length) | 0, j = (Math.random() * (WORLD.HY.length - 1)) | 0;
      dir = Math.random() < .5 ? 1 : 3;
      x = WORLD.VXC[i] + RIGHT[dir].x * 32;
      y = WORLD.HYC[j] + 60 + Math.random() * (WORLD.HYC[j + 1] - WORLD.HYC[j] - 120);
    } else {
      const i = (Math.random() * (WORLD.VX.length - 1)) | 0, j = (Math.random() * WORLD.HY.length) | 0;
      dir = Math.random() < .5 ? 0 : 2;
      x = WORLD.VXC[i] + 60 + Math.random() * (WORLD.VXC[i + 1] - WORLD.VXC[i] - 120);
      y = WORLD.HYC[j] + RIGHT[dir].y * 32;
    }
    const kinds = ['sedan', 'sedan', 'taxi', 'truck', 'sedan'];
    const c = new Car(x, y, dir * Math.PI / 2, kinds[(Math.random() * kinds.length) | 0],
      CAR_COLORS[(Math.random() * CAR_COLORS.length) | 0]);
    c.driver = 'ai'; c.dir = dir; c.nextDir = null; c.cruise = c.max * (0.45 + Math.random() * .2);
    this.traffic.push(c);
    return c;
  },

  nextIntersection(c) {
    const d = DIRV[c.dir];
    if (d.x !== 0) { // movendo na horizontal: linha HY[j]
      const j = Math.round((c.y - (d.y ? 0 : 0)) / 1); // y já é próximo de HYC
      let jj = 0, best = 1e9;
      for (let k = 0; k < WORLD.HYC.length; k++) if (Math.abs(WORLD.HYC[k] - c.y) < 70) { jj = k; best = Math.abs(WORLD.HYC[k] - c.y); }
      for (let k = 0; k < WORLD.VXC.length; k++) {
        const dx = WORLD.VXC[k] - c.x;
        if (dx * d.x > 20) return { x: WORLD.VXC[k], y: WORLD.HYC[jj], i: k, j: jj };
      }
      return null;
    } else {
      let ii = 0, best = 1e9;
      for (let k = 0; k < WORLD.VXC.length; k++) if (Math.abs(WORLD.VXC[k] - c.x) < 70) { ii = k; best = Math.abs(WORLD.VXC[k] - c.x); }
      for (let k = 0; k < WORLD.HYC.length; k++) {
        const dy = WORLD.HYC[k] - c.y;
        if (dy * d.y > 20) return { x: WORLD.VXC[ii], y: WORLD.HYC[k], i: ii, j: k };
      }
      return null;
    }
  },

  updateTraffic(dt, S) {
    for (const c of this.traffic) {
      if (c.wreck) continue;
      const d = DIRV[c.dir];
      // --- decide a direção no cruzamento ---
      const ni = this.nextIntersection(c);
      const distI = ni ? Math.hypot(ni.x - c.x, ni.y - c.y) : 1e9;
      if (ni && distI < 30 && !c.nextDir) {
        const opts = [];
        if (d.x !== 0) { // chega por via horizontal -> pode seguir, virar N ou S
          opts.push(c.dir);
          if (ni.j > 0) opts.push(3);
          if (ni.j < WORLD.HY.length - 1 || true) opts.push(1);
        } else {
          opts.push(c.dir);
          if (ni.i < WORLD.VX.length - 1) opts.push(0);
          if (ni.i > 0) opts.push(2);
        }
        const filtered = opts.filter(o => o !== (c.dir + 2) % 4);
        c.nextDir = filtered[(Math.random() * filtered.length) | 0] ?? c.dir;
      }
      if (ni && c.nextDir != null && ((c.x - ni.x) * d.x + (c.y - ni.y) * d.y) > 0 && distI < 40) {
        c.dir = c.nextDir; c.nextDir = null;               // cruzou o centro: vira
      }
      // --- alvo: faixa da direita + ângulo da direção ---
      const nd = DIRV[c.dir];
      const line = this.laneTarget(c);
      const desired = Math.atan2(nd.y, nd.x);
      let steer = angDiff(desired, c.angle) * 4;
      steer += Math.max(-1, Math.min(1, ((line.x - c.x) * -nd.y + (line.y - c.y) * nd.x) / 40));
      c.steer = Math.max(-1, Math.min(1, steer));
      // --- velocidade: semáforo, carro à frente, pedestre na faixa ---
      let target = c.cruise;
      if (ni && distI < 80) {
        const vert = d.y !== 0;
        if (!WORLD.lightGreen(vert, S.clock)) target = Math.min(target, Math.max(0, distI - 46) * 3);
      }
      for (const o of S.cars) {
        if (o === c || o.wreck) continue;
        const rx = o.x - c.x, ry = o.y - c.y, ahead = rx * d.x + ry * d.y;
        if (ahead > 0 && ahead < 52 && Math.abs(rx * -d.y + ry * d.x) < 22) { target = Math.min(target, Math.max(0, (ahead - 30)) * 3); break; }
      }
      for (const p of this.peds) {
        const rx = p.x - c.x, ry = p.y - c.y, ahead = rx * d.x + ry * d.y;
        if (ahead > 0 && ahead < 44 && Math.abs(rx * -d.y + ry * d.x) < 18 && p.mode === 'cross') { target = 0; break; }
      }
      c.throttle = c.forwardSpeed() < target - 8 ? 1 : (c.forwardSpeed() > target + 8 ? -0.6 : 0.15);
      c.update(dt);
      // borda do mapa: dá meia-volta
      if (c.x < 70 || c.y < 70 || c.x > MW * T - 70 || c.y > MH * T - 70) {
        if ((c.x < 70 && c.dir === 2) || (c.y < 70 && c.dir === 3) || (c.x > MW * T - 70 && c.dir === 0) || (c.y > MH * T - 70 && c.dir === 1))
          c.dir = (c.dir + 2) % 4;
      }
    }
  },
  laneTarget(c) {
    const d = DIRV[c.dir], r = RIGHT[c.dir];
    if (d.x !== 0) {
      let jj = 0, best = 1e9;
      for (let k = 0; k < WORLD.HYC.length; k++) if (Math.abs(WORLD.HYC[k] - c.y) < 96) { if (Math.abs(WORLD.HYC[k] - c.y) < best) { best = Math.abs(WORLD.HYC[k] - c.y); jj = k; } }
      return { x: c.x, y: WORLD.HYC[jj] + r.y * 32 };
    }
    let ii = 0, best = 1e9;
    for (let k = 0; k < WORLD.VXC.length; k++) if (Math.abs(WORLD.VXC[k] - c.x) < 96) { if (Math.abs(WORLD.VXC[k] - c.x) < best) { best = Math.abs(WORLD.VXC[k] - c.x); ii = k; } }
    return { x: WORLD.VXC[ii] + r.x * 32, y: c.y };
  },

  /* ------------------------- PEDESTRES ------------------------- */
  spawnPed(x, y) {
    let px = x, py = y;
    if (px == null) {
      for (let k = 0; k < 60; k++) {
        const tx = (Math.random() * MW) | 0, ty = (Math.random() * MH) | 0;
        if (WORLD.walkableTile(tx, ty)) { px = tx * T + 16; py = ty * T + 16; break; }
      }
    }
    if (px == null) return;
    this.peds.push({
      x: px, y: py, tx: px, ty: py, speed: 34 + Math.random() * 16,
      shirt: this.shirtColors[(Math.random() * 6) | 0], phase: Math.random() * 7,
      mode: 'walk', flee: 0, down: 0, angry: 0, dirx: 1, diry: 0
    });
  },
  updatePeds(dt, S) {
    for (let n = this.peds.length - 1; n >= 0; n--) {
      const p = this.peds[n];
      if (p.down > 0) { p.down -= dt; if (p.down <= 0) { if (Math.random() < .6) { p.flee = 2; } else { this.peds.splice(n, 1); this.spawnPed(); } } continue; }
      // ameaça: carro rápido perto ou jogador armado a pé
      const dxp = p.x - S.px, dyp = p.y - S.py, dp = Math.hypot(dxp, dyp);
      if (S.threat && dp < 90) p.flee = 1.6;
      if (p.flee > 0) {
        p.flee -= dt;
        const l = dp || 1;
        p.x += dxp / l * 95 * dt; p.y += dyp / l * 95 * dt;
        p.dirx = dxp / l; p.diry = dyp / l;
        continue;
      }
      // chegou no alvo? escolhe próximo
      if (Math.hypot(p.tx - p.x, p.ty - p.y) < 4) {
        if (p.mode === 'cross') {
          const t = WORLD.tileAt(p.x, p.y);
          if (t === TY.SIDE || t === TY.PLAZA || t === TY.LOT) p.mode = 'walk';
        }
        if (p.mode === 'walk' && Math.random() < .25) this.tryCross(p);
        if (p.mode === 'walk') {
          const tx = Math.floor(p.x / T), ty = Math.floor(p.y / T);
          const opts = [];
          for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
            if (WORLD.walkableTile(tx + ax, ty + ay)) opts.push([tx + ax, ty + ay]);
          if (opts.length) {
            // prefere seguir em frente
            opts.sort((a, b) => -( (a[0]-tx)*p.dirx + (a[1]-ty)*p.diry ) + ((b[0]-tx)*p.dirx + (b[1]-ty)*p.diry));
            const pick = Math.random() < .6 ? opts[0] : opts[(Math.random() * opts.length) | 0];
            p.tx = pick[0] * T + 16; p.ty = pick[1] * T + 16;
            p.dirx = Math.sign(p.tx - p.x); p.diry = Math.sign(p.ty - p.y);
          }
        }
      }
      const l = Math.hypot(p.tx - p.x, p.ty - p.y) || 1;
      p.x += (p.tx - p.x) / l * p.speed * dt;
      p.y += (p.ty - p.y) / l * p.speed * dt;
      p.phase += dt * 9;
      if (p.angry > 0) p.angry -= dt;
    }
  },
  tryCross(p) {
    // procura faixa de pedestres adjacente com sinal seguro
    const tx = Math.floor(p.x / T), ty = Math.floor(p.y / T);
    for (const [ax, ay, bit, vert] of [[0, -1, 16, true], [0, 1, 32, true], [-1, 0, 64, false], [1, 0, 128, false]]) {
      const m = WORLD.mark[(ty + ay) * MW + (tx + ax)];
      if (m & bit && !WORLD.lightGreen(vert, GAME.clock)) {
        p.mode = 'cross'; p.tx = (tx + ax) * T + 16; p.ty = (ty + ay) * T + 16;
        // alvo final: atravessar até o outro lado
        p.tx += ax * T * 5; p.ty += ay * T * 5;
        p.dirx = ax; p.diry = ay;
        return;
      }
    }
  },
  hitPed(p, byPlayer) {
    p.down = 1.4; p.flee = 0;
    if (byPlayer) GAME.crime('ped', 1);
  },
  angryAt(x, y) { for (const p of this.peds) if (Math.hypot(p.x - x, p.y - y) < 110) { p.angry = 2; p.flee = Math.max(p.flee, .8); } },

  drawPeds(ctx, cam, clock) {
    for (const p of this.peds) {
      const px = p.x - cam.x, py = p.y - cam.y;
      if (px < -20 || py < -20 || px > 820 || py > 620) continue;
      const bob = Math.sin(p.phase) * 1.5;
      ctx.save(); ctx.translate(px, py);
      if (p.down > 0) { // caiu: deitado + nuvenzinha
        ctx.fillStyle = p.shirt; ctx.fillRect(-5, -2, 10, 4);
        ctx.fillStyle = '#e8c39a'; ctx.fillRect(5, -2, 4, 4);
        ctx.fillStyle = 'rgba(255,255,255,.7)';
        ctx.beginPath(); ctx.arc(-2 + Math.sin(clock * 6) * 2, -8, 3 + Math.sin(clock * 9), 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 3, 4, 2.5, 0, 0, 7); ctx.fill();
        ctx.fillStyle = p.shirt; ctx.fillRect(-3, -3 + bob * .3, 6, 6);
        ctx.fillStyle = '#e8c39a'; ctx.fillRect(-2, -7 + bob * .3, 4, 4);
      }
      if (p.angry > 0) { // balão de xingamento
        ctx.fillStyle = '#fff'; ctx.fillRect(-6, -20, 13, 9);
        ctx.fillStyle = '#000'; ctx.font = 'bold 8px monospace'; ctx.fillText('#!', -4, -13);
      }
      ctx.restore();
    }
  },

  /* ------------------------- POLÍCIA ------------------------- */
  updatePolice(dt, S) {
    const want = S.wanted;
    while (this.cops.length < want) this.spawnCop(S);
    if (this.cops.length > want) this.cops.pop();
    for (const c of this.cops) {
      if (c.wreck) continue;
      const tgt = S.inCar ? { x: S.px + S.pvx * .35, y: S.py + S.pvy * .35 } : { x: S.px, y: S.py };
      const des = Math.atan2(tgt.y - c.y, tgt.x - c.x);
      c.steer = Math.max(-1, Math.min(1, angDiff(des, c.angle) * 3.2));
      const dist = Math.hypot(tgt.x - c.x, tgt.y - c.y);
      c.throttle = dist > 60 ? 1 : .3;
      c.update(dt);
      // PIT: encostou em alta velocidade -> rodopiou o jogador
      if (S.inCar && dist < 30 && S.pspeed > 120) {
        const cross = Math.sign((S.px - c.x) * c.vy - (S.py - c.y) * (-c.vx)) || 1;
        S.car.spin += cross * 4.5;
        S.car.damage(6); c.damage(3);
        AUDIO.crash(S.pspeed);
        GAME.cooldownCrime('pit', 1.5, 0);
      }
    }
    // bloqueios de rua (nível >= 3)
    if (want >= 3 && this.blocks.length === 0 && S.inCar) {
      const ni = AI.nearestIntersectionAhead(S);
      if (ni) {
        for (const off of [-32, 32]) {
          const b = new Car(ni.x + (Math.abs(S.pvx) > Math.abs(S.pvy) ? 0 : off), ni.y + (Math.abs(S.pvx) > Math.abs(S.pvy) ? off : 0),
            Math.abs(S.pvx) > Math.abs(S.pvy) ? Math.PI / 2 : 0, 'police', '#e8e8e8');
          b.driver = 'ai'; this.blocks.push(b);
        }
      }
    }
    if (want < 3) this.blocks = [];
    // helicóptero (nível >= 4)
    if (want >= 4) {
      if (!this.heli) this.heli = { x: S.px + 300, y: S.py - 300 };
      const h = this.heli, l = Math.hypot(S.px - h.x, S.py - h.y) || 1;
      h.x += (S.px - h.x) / l * 190 * dt; h.y += (S.py - h.y) / l * 190 * dt;
    } else this.heli = null;
  },
  spawnCop(S) {
    for (let k = 0; k < 40; k++) {
      const a = Math.random() * 7, d = 380 + Math.random() * 200;
      const x = S.px + Math.cos(a) * d, y = S.py + Math.sin(a) * d;
      if (!WORLD.solidAt(x, y) && WORLD.roadLine(x, y)) {
        const c = new Car(x, y, a + Math.PI, 'police', '#e8e8e8');
        c.driver = 'ai'; this.cops.push(c); return;
      }
    }
  },
  nearestIntersectionAhead(S) {
    let best = null, bd = 1e9;
    for (const L of WORLD.lights) {
      const d = Math.hypot(L.x - S.px, L.y - S.py);
      if (d < bd && d > 120) { bd = d; best = L; }
    }
    return best;
  },
  drawHeli(ctx, cam, clock, night, S) {
    if (!this.heli) return;
    const hx = this.heli.x - cam.x, hy = this.heli.y - cam.y;
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.ellipse(hx, hy, 26, 12, 0, 0, 7); ctx.fill();      // sombra no chão
    if (night > .25) { // holofote
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(hx, hy, 4, hx, hy, 60);
      g.addColorStop(0, `rgba(255,255,200,${.3 * night})`); g.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, 60, 0, 7); ctx.fill();
      ctx.restore();
    }
    const bx = hx + 34, by = hy - 52;                                      // corpo "no alto"
    ctx.save(); ctx.translate(bx, by);
    ctx.fillStyle = '#24409a'; roundRect(ctx, -16, -9, 32, 18, 6); ctx.fill();
    ctx.fillStyle = '#9fd0ff'; ctx.fillRect(8, -5, 7, 10);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.stroke();  // rotor
    ctx.restore();
  },

  allCars() { return [...this.traffic, ...this.cops, ...this.blocks]; },
  update(dt, S) {
    this.updateTraffic(dt, S);
    this.updatePeds(dt, S);
    this.updatePolice(dt, S);
  }
};
