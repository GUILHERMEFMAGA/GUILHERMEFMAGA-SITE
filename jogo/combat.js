/* ============================================================
   combat.js — armas, tiros, sangue, corpos, polícia a pé,
   granadas, itens no chão e loja de armas.
   (Versão 2: violência explícita, para maiores de 16 anos)
   ============================================================ */
(function (G) {
  'use strict';
  const W = G.world, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const wrap = G.ai.wrap;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ---------- Tabela de armas ----------
  // melee = corpo a corpo • auto = segurar o botão dispara sem parar
  const WEAPONS = {
    fist:    { name: 'PUNHOS',          melee: true, dmg: 14, range: 36, cd: 0.32 },
    bat:     { name: 'TACO',            melee: true, dmg: 40, range: 50, cd: 0.55 },
    pistol:  { name: 'PISTOLA',         dmg: 26, cd: 0.30, spread: 0.03, speed: 850, range: 560, pellets: 1, snd: 'pistol' },
    smg:     { name: 'SUBMETRALHADORA', dmg: 13, cd: 0.085, spread: 0.09, speed: 900, range: 520, pellets: 1, snd: 'smg', auto: true },
    shotgun: { name: 'ESCOPETA',        dmg: 15, cd: 0.80, spread: 0.20, speed: 780, range: 300, pellets: 6, snd: 'shotgun' },
    grenade: { name: 'GRANADA',         throw: true, cd: 0.7 },
  };
  Object.keys(WEAPONS).forEach(k => WEAPONS[k].id = k);
  const ORDER = ['fist', 'bat', 'pistol', 'smg', 'shotgun', 'grenade'];
  const usesAmmo = w => !w.melee;
  // dano que INIMIGOS causam (o jogador tem 100 de vida)
  const ENEMY = { pistol: { dmg: 9, cd: 0.85 }, smg: { dmg: 4, cd: 0.14 }, shotgun: { dmg: 6, cd: 1.3 } };
  const MAX_AMMO = 250;

  // ---------- Estado ----------
  function arms(S) {
    const sv = S.save;
    if (!sv.arms || !sv.arms.own) sv.arms = { own: { fist: 1 }, ammo: {} };
    sv.arms.own.fist = 1;
    return sv.arms;
  }
  function reset(S) {
    S.bullets = []; S.decals = []; S.pickups = []; S.grenades = []; S.skids = [];
    S.hurtT = 0; S.lastShot = -99; S.copHostile = false; S.lastHp = 100; S.kills = 0; S.shotHeatT = -99; S.thugAlert = false;
    arms(S);
    const P = S.player; if (P) { if (!P.weapon || !S.save.arms.own[P.weapon]) P.weapon = 'fist'; P.armor = P.armor || 0; }
  }
  function ammoOf(S, id) { return arms(S).ammo[id] || 0; }
  function hasAmmo(S, id) { const w = WEAPONS[id]; return !usesAmmo(w) || ammoOf(S, id) > 0; }
  function giveWeapon(S, id, n, quiet) {
    const a = arms(S), w = WEAPONS[id], P = S.player;
    const had = a.own[id];
    a.own[id] = 1;
    if (usesAmmo(w)) a.ammo[id] = Math.min(MAX_AMMO, (a.ammo[id] || 0) + (n || 0));
    if (!had || P.weapon === 'fist') P.weapon = id;
    G.save();
    if (!quiet) G.say((had ? 'Munição: ' : 'Nova arma: ') + w.name + (usesAmmo(w) ? ' (+' + n + ')' : ''), 3);
  }
  function select(S, id) {
    const a = arms(S);
    if (!a.own[id] || !hasAmmo(S, id)) return false;
    S.player.weapon = id; return true;
  }
  function cycle(S, dir) {
    const a = arms(S), P = S.player;
    const list = ORDER.filter(id => a.own[id] && hasAmmo(S, id));
    if (!list.length) return;
    const i = Math.max(0, list.indexOf(P.weapon));
    P.weapon = list[(i + (dir || 1) + list.length) % list.length];
    G.snd.beep();
  }
  function bestFallback(S) {
    const a = arms(S);
    return ['pistol', 'smg', 'shotgun', 'bat', 'fist'].find(id => a.own[id] && hasAmmo(S, id)) || 'fist';
  }
  function confiscate(S) { // preso: a polícia leva as armas
    S.save.arms = { own: { fist: 1 }, ammo: {} }; S.player.weapon = 'fist'; S.player.armor = 0; G.save();
  }

  // ---------- Desenho de manchas (sprites prontos) ----------
  const blobs = { fresh: [], dry: [] };
  function makeBlob(col, hi, n) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'); x.translate(32, 32);
    x.fillStyle = col;
    x.beginPath(); x.arc(0, 0, 13 + rand(0, 4), 0, TAU); x.fill();
    for (let k = 0; k < 7; k++) { const a = rand(0, TAU), d = rand(9, 21); x.beginPath(); x.arc(Math.cos(a) * d, Math.sin(a) * d, rand(3, 9), 0, TAU); x.fill(); }
    for (let k = 0; k < 6; k++) { const a = rand(0, TAU), d = rand(20, 29); x.beginPath(); x.arc(Math.cos(a) * d, Math.sin(a) * d, rand(1, 2.6), 0, TAU); x.fill(); }
    x.fillStyle = hi; x.beginPath(); x.arc(-3, -3, 6, 0, TAU); x.fill();
    return c;
  }
  for (let k = 0; k < 6; k++) { blobs.fresh.push(makeBlob('#8f0c12', '#b5161d', k)); blobs.dry.push(makeBlob('#4d0709', '#5c0a0d', k)); }
  const blobSprite = (v, dry) => (dry ? blobs.dry : blobs.fresh)[v % 6];

  function addDecal(S, kind, x, y, r, rot) {
    if (S.decals.length > 360) S.decals.shift();
    S.decals.push({ kind, x, y, r, rot: rot == null ? rand(0, TAU) : rot, v: Math.floor(Math.random() * 6), t: 0 });
  }
  // respingo de sangue: partículas + manchinhas no chão
  function spray(S, x, y, ang, n, spd) {
    for (let k = 0; k < n; k++) {
      const a = ang + rand(-0.9, 0.9), v = rand(40, spd || 200);
      G.particle({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.3, 0.7), size: rand(1.6, 3.4), col: 'blood' });
    }
    for (let k = 0; k < Math.ceil(n / 3); k++) {
      const a = ang + rand(-0.9, 0.9), d = rand(3, 8 + (spd || 200) / 9);
      addDecal(S, 'blood', x + Math.cos(a) * d, y + Math.sin(a) * d, rand(2, 5.5));
    }
  }

  // ---------- Barulho, polícia por perto ----------
  function copNear(S, x, y, r) {
    for (const c of S.cars) if (c.kind === 'police' && !c.dead && Math.abs(c.x - x) < r && Math.abs(c.y - y) < r && Math.hypot(c.x - x, c.y - y) < r) return true;
    for (const p of S.peds) if (p.kind === 'cop' && p.state !== 'dead' && Math.hypot(p.x - x, p.y - y) < r) return true;
    return false;
  }
  function noise(S, x, y, r) { // tiro = gente corre
    for (const p of S.peds) {
      if (p.state !== 'walk' || p.mission) continue;
      if (Math.abs(p.x - x) < r && Math.abs(p.y - y) < r && Math.hypot(p.x - x, p.y - y) < r) { p.state = 'flee'; p.fleeT = rand(3, 5.5); p.threat = { x, y }; }
    }
  }
  const vol = (S, x, y) => { const ref = S.player ? (S.player.car || S.player) : { x: 0, y: 0 }; return clamp(1.05 - Math.hypot(x - ref.x, y - ref.y) / 950, 0.12, 1); };

  // ---------- Dano ----------
  function hurtPlayer(S, dmg, fx, fy) {
    const P = S.player;
    if (S.mode !== 'play' || P.hp <= 0) return;
    if (P.armor > 0) { const a = Math.min(P.armor, dmg * 0.7); P.armor -= a; dmg -= a; }
    P.hp = Math.max(0, P.hp - dmg);
    S.hurtT = 0.3;
    if (!P.car) { spray(S, P.x, P.y, Math.atan2(P.y - fy, P.x - fx), 5, 150); }
    G.snd.hurt();
  }

  function drop(S, x, y, type, n, id) { S.pickups.push({ x: x + rand(-8, 8), y: y + rand(-8, 8), type, n, id, t: 0 }); }
  function drops(S, p) {
    if (p.kind === 'cop') {
      drop(S, p.x, p.y, 'cash', Math.round(rand(30, 90)));
      const wid = p.weapon || 'pistol';
      drop(S, p.x, p.y, 'gun', wid === 'pistol' ? 14 : wid === 'smg' ? 40 : 8, wid);
      if (Math.random() < 0.3) drop(S, p.x, p.y, 'armor', 35);
      if (Math.random() < 0.15) drop(S, p.x, p.y, 'health', 40);
    } else if (p.target) {
      drop(S, p.x, p.y, 'cash', Math.round(rand(40, 120)));
      const wid = p.weapon || 'pistol';
      if (wid === 'bat') drop(S, p.x, p.y, 'gun', 0, 'bat'); else drop(S, p.x, p.y, 'gun', wid === 'pistol' ? 12 : wid === 'smg' ? 35 : 6, wid);
    } else {
      if (Math.random() < 0.55) drop(S, p.x, p.y, 'cash', Math.round(rand(8, 45)));
      if (p.armed && Math.random() < 0.7) drop(S, p.x, p.y, 'gun', 10, 'pistol');
    }
  }

  function killPed(S, p, fx, fy, force, src) {
    p.state = 'dead'; p.corpseT = 0; p.hp = 0; p.pool = 0;
    const a = Math.atan2(p.y - fy, p.x - fx);
    p.vx = Math.cos(a) * (force || 100) * 0.3; p.vy = Math.sin(a) * (force || 100) * 0.3;
    p.h = a + Math.PI / 2 + rand(-0.6, 0.6);
    spray(S, p.x, p.y, a, 16, 210);
    addDecal(S, 'blood', p.x + Math.cos(a) * 6, p.y + Math.sin(a) * 6, rand(11, 16));
    drops(S, p);
    S.kills++;
    if (p.kind === 'cop' || p.target || p.armed) G.snd.hurt(); else G.snd.scream(vol(S, p.x, p.y));
    G.snd.thud();
    if (src === 'player') {
      if (p.kind === 'cop') { G.addHeat(35); S.copHostile = true; }
      else if (!p.target && copNear(S, p.x, p.y, 560)) G.addHeat(14);
    }
    if (p.kind === 'cop') G.say('Policial abatido! A cidade inteira vai atrás de você.', 3);
  }

  // opts.car = atropelamento (quem sobrevive cai no chão)
  function hurtPed(S, p, dmg, fx, fy, force, src, opts) {
    if (p.state === 'dead' || p.mission) return false;
    p.hp -= dmg;
    const a = Math.atan2(p.y - fy, p.x - fx);
    if (p.hp <= 0) { killPed(S, p, fx, fy, force, src); return true; }
    // sobreviveu: sangra, é empurrado e reage
    spray(S, p.x, p.y, a, 5 + Math.round(dmg / 6), 150);
    p.vx += Math.cos(a) * (force || 60) * 0.4; p.vy += Math.sin(a) * (force || 60) * 0.4;
    G.snd.hurt();
    if (opts && opts.car) { p.state = 'down'; p.downT = 0; p.threat = { x: fx, y: fy }; }
    else if (p.state === 'guard') { p.state = 'fight'; S.thugAlert = true; }
    else if (p.kind !== 'civ' || p.armed) { if (p.state !== 'down') p.state = 'fight'; }
    else if (p.state !== 'down') { p.state = 'flee'; p.fleeT = rand(4, 6.5); p.threat = { x: fx, y: fy }; G.snd.scream(vol(S, p.x, p.y)); }
    if (src === 'player') {
      if (p.kind === 'cop') { if (!S.copHostile) G.addHeat(18); S.copHostile = true; }
      else if (!p.target && copNear(S, p.x, p.y, 480)) G.addHeat(dmg > 20 ? 8 : 3);
    }
    return false;
  }

  // carro acertou alguém
  function carHit(S, p, c, sp) {
    const P = S.player;
    const src = c === P.car ? 'player' : 'traffic';
    const dmg = 18 + sp * 0.5;
    const dead = hurtPed(S, p, dmg, c.x - c.vx * 0.05, c.y - c.vy * 0.05, sp * 0.9 + 60, src, { car: true });
    if (dead) { // rastro de sangue na direção do carro
      const l = Math.hypot(c.vx, c.vy) || 1, ux = c.vx / l, uy = c.vy / l;
      for (let k = 0; k < 4; k++) addDecal(S, 'blood', p.x + ux * k * 11, p.y + uy * k * 11, rand(5, 8) - k * 0.6, Math.atan2(uy, ux));
    }
    return dead;
  }

  // ---------- Explosões ----------
  function scorch(S, x, y, r) { addDecal(S, 'scorch', x, y, r || 40); }
  function blast(S, x, y, R, dmg, src) {
    const P = S.player;
    G.snd.boom(); S.shake = Math.max(S.shake, 12);
    G.particle({ x, y, vx: 0, vy: 0, life: 0.45, size: 10, col: 'ring' });
    for (let k = 0; k < 24; k++) { const a = rand(0, TAU), v = rand(30, 190); G.particle({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.5, 1.1), size: rand(8, 18), col: k % 3 === 0 ? 'smoke' : 'fire' }); }
    for (let k = 0; k < 14; k++) { const a = rand(0, TAU), v = rand(80, 260); G.particle({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.2, 0.5), size: 2.5, col: 'spark' }); }
    scorch(S, x, y, R * 0.6);
    for (const p of S.peds) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < R && p.state !== 'dead') hurtPed(S, p, dmg * (1 - d / R * 0.7), x, y, 260, src);
    }
    for (const c of S.cars) {
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < R * 1.15 && !c.dead) { G.carDamage(c, 75 * (1 - d / (R * 1.15))); const a = Math.atan2(c.y - y, c.x - x); c.vx += Math.cos(a) * 220; c.vy += Math.sin(a) * 220; }
    }
    const d = Math.hypot(P.x - x, P.y - y);
    if (d < R && !P.car && S.mode === 'play') { hurtPlayer(S, dmg * (1 - d / R * 0.6), x, y); const a = Math.atan2(P.y - y, P.x - x); P.vx += Math.cos(a) * 240; P.vy += Math.sin(a) * 240; }
    if (src === 'player' && copNear(S, x, y, 700)) G.addHeat(28);
  }

  // ---------- Balas ----------
  function fireBullet(S, o) {
    if (S.bullets.length > 160) S.bullets.shift();
    S.bullets.push({ x: o.x, y: o.y, px: o.x, py: o.y, vx: Math.cos(o.a) * o.speed, vy: Math.sin(o.a) * o.speed, dmg: o.dmg, own: o.own, left: o.range, car: o.car || null });
  }
  function flash(x, y) { G.particle({ x, y, vx: 0, vy: 0, life: 0.07, size: 10, col: 'flash' }); }
  function spark(x, y, n) { for (let k = 0; k < n; k++) { const a = rand(0, TAU), v = rand(40, 160); G.particle({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.12, 0.3), size: 2, col: 'spark' }); } }

  function bulletHit(S, b) {
    const P = S.player;
    if (b.own === 'player') {
      for (const p of S.peds) {
        if (p.state === 'dead' || p.mission) continue;
        if (Math.abs(p.x - b.x) > 10 || Math.abs(p.y - b.y) > 10) continue;
        if (Math.hypot(p.x - b.x, p.y - b.y) < 8.5) { hurtPed(S, p, b.dmg, b.x - b.vx * 0.02, b.y - b.vy * 0.02, 110, 'player'); return true; }
      }
    } else if (!P.car && S.mode === 'play' && Math.hypot(P.x - b.x, P.y - b.y) < 9) {
      hurtPlayer(S, b.dmg, b.px, b.py); return true;
    }
    for (const c of S.cars) {
      if (Math.abs(c.x - b.x) > 62 || Math.abs(c.y - b.y) > 62) continue;
      if (c === b.car || (b.own === 'player' && c === P.car) || (b.own === 'cop' && c.kind === 'police')) continue;
      const cc = G.carCircles(c);
      let hit = false;
      for (let k = 0; k < 2; k++) if (Math.hypot(b.x - cc[k][0], b.y - cc[k][1]) < cc[k][2] * 0.85) hit = true;
      if (!hit) continue;
      spark(b.x, b.y, 4);
      if (!c.dead) {
        const cs = Math.cos(c.a), sn = Math.sin(c.a), dx = b.x - c.x, dy = b.y - c.y;
        (c.holes = c.holes || []); if (c.holes.length < 16) c.holes.push({ x: dx * cs + dy * sn, y: -dx * sn + dy * cs });
        if (b.own === 'player') {
          G.carDamage(c, b.dmg * 0.35);
          if (c.driver === 'ai' && c.mode === 'wander') {
            if (c.kind === 'police') { c.mode = 'chase'; c.siren = true; c.chaseScale = 1; G.addHeat(30); S.copHostile = true; }
            else { c.cruise = Math.max(c.cruise, 300); c.ignoreLights = true; }
          }
        } else {
          G.carDamage(c, b.dmg * 0.5);
          if (c === P.car && Math.random() < 0.35) hurtPlayer(S, b.dmg * 0.6, b.px, b.py);
        }
      }
      return true;
    }
    return false;
  }
  function updateBullets(S, dt) {
    for (let i = S.bullets.length - 1; i >= 0; i--) {
      const b = S.bullets[i];
      const step = Math.hypot(b.vx, b.vy) * dt, n = Math.max(1, Math.ceil(step / 7));
      let dead = false;
      for (let s = 0; s < n && !dead; s++) {
        b.px = b.x; b.py = b.y; b.x += b.vx * dt / n; b.y += b.vy * dt / n; b.left -= step / n;
        if (b.left <= 0) { dead = true; break; }
        if (W.tileAt(b.x, b.y) === W.TILE.BUILD || (W.trees.length && W.treeHit(b.x, b.y, 0))) { spark(b.px, b.py, 3); dead = true; break; }
        dead = bulletHit(S, b);
      }
      if (dead) S.bullets.splice(i, 1);
    }
  }

  // ---------- Ataque do jogador ----------
  function aimAngle(S, P, range) {
    const fx = Math.sin(P.h), fy = -Math.cos(P.h);
    let best = null, bs = 1e9;
    for (const p of S.peds) {
      if (p.state === 'dead' || p.mission) continue;
      const dx = p.x - P.x, dy = p.y - P.y, d = Math.hypot(dx, dy);
      if (d > range || d < 4) continue;
      const da = Math.abs(wrap(Math.atan2(dy, dx) - Math.atan2(fy, fx)));
      if (da > 0.45) continue;
      const sc = d * (1 + da * 2.5);
      if (sc < bs) { bs = sc; best = p; }
    }
    if (best) return Math.atan2(best.y - P.y, best.x - P.x);
    return Math.atan2(fy, fx);
  }

  function melee(S, P, w) {
    P.punchT = w.id === 'bat' ? 0.4 : 0.3; P.cdT = w.cd;
    w.id === 'bat' ? G.snd.swing() : G.snd.punch();
    const fx = Math.sin(P.h), fy = -Math.cos(P.h);
    let hits = 0;
    for (const p of S.peds) {
      if (p.state === 'dead' || p.mission) continue;
      const dx = p.x - P.x, dy = p.y - P.y, d = Math.hypot(dx, dy);
      if (d < w.range && (dx * fx + dy * fy) > 0) {
        hurtPed(S, p, w.dmg * (1 + 0.18 * ((S.save && S.save.forca) || 0)) * rand(0.85, 1.25), P.x, P.y, w.id === 'bat' ? 230 : 140, 'player');
        if (w.id === 'bat') G.snd.thud();
        hits++; if (hits >= (w.id === 'bat' ? 2 : 1)) break;
      }
    }
  }

  function shoot(S, P, w) {
    const a = arms(S);
    const ang = aimAngle(S, P, w.range);
    P.h = ang + Math.PI / 2;
    const mx = P.x + Math.cos(ang) * 15, my = P.y + Math.sin(ang) * 15;
    for (let k = 0; k < w.pellets; k++) fireBullet(S, { x: mx, y: my, a: ang + rand(-1, 1) * w.spread, speed: w.speed * rand(0.92, 1.05), dmg: w.dmg, own: 'player', range: w.range });
    P.cdT = w.cd; P.flashT = 0.07; P.punchT = 0;
    a.ammo[w.id]--;
    flash(mx, my);
    G.snd.gun(w.snd, 1);
    S.shake = Math.max(S.shake, w.id === 'shotgun' ? 4 : 1.2);
    noise(S, P.x, P.y, 430);
    S.lastShot = S.time;
    if (S.time - S.shotHeatT > 1.2 && copNear(S, P.x, P.y, 650)) { G.addHeat(w.id === 'shotgun' ? 10 : 6); S.shotHeatT = S.time; }
    if (a.ammo[w.id] <= 0) { G.say(w.name + ' sem munição!', 2); P.weapon = bestFallback(S); G.save(); }
  }

  function throwGrenade(S, P, w) {
    const a = arms(S);
    const fx = Math.sin(P.h), fy = -Math.cos(P.h);
    S.grenades.push({ x: P.x + fx * 10, y: P.y + fy * 10, vx: fx * 300 + (P.vx || 0), vy: fy * 300 + (P.vy || 0), t: 1.8, spin: 0 });
    a.ammo.grenade--; P.cdT = w.cd; P.punchT = 0.25;
    G.snd.swing();
    if (a.ammo.grenade <= 0) { P.weapon = bestFallback(S); G.save(); }
  }

  function playerUpdate(S, dt, held, pressed) {
    const P = S.player;
    if (P.cdT > 0) P.cdT -= dt; if (P.flashT > 0) P.flashT -= dt;
    if (!arms(S).own[P.weapon] || !hasAmmo(S, P.weapon)) P.weapon = bestFallback(S);
    const w = WEAPONS[P.weapon];
    const want = w.auto ? held : pressed;
    if (!want || P.cdT > 0) return;
    if (w.melee) melee(S, P, w);
    else if (w.throw) throwGrenade(S, P, w);
    else shoot(S, P, w);
  }

  function updateGrenades(S, dt) {
    for (let i = S.grenades.length - 1; i >= 0; i--) {
      const g = S.grenades[i];
      g.t -= dt; g.spin += dt * 12;
      const nx = g.x + g.vx * dt, ny = g.y + g.vy * dt;
      if (W.isSolid(nx, g.y)) g.vx *= -0.4; else g.x = nx;
      if (W.isSolid(g.x, ny)) g.vy *= -0.4; else g.y = ny;
      const f = Math.pow(0.25, dt); g.vx *= f; g.vy *= f;
      if (g.t <= 0) { S.grenades.splice(i, 1); blast(S, g.x, g.y, 125, 150, 'player'); }
    }
  }

  // ---------- Itens no chão ----------
  function updatePickups(S, dt) {
    const P = S.player, ref = P.car || P, r = P.car ? 30 : 17;
    for (let i = S.pickups.length - 1; i >= 0; i--) {
      const k = S.pickups[i]; k.t += dt;
      if (k.t > 90) { S.pickups.splice(i, 1); continue; }
      if (S.mode !== 'play' || Math.hypot(k.x - ref.x, k.y - ref.y) > r) continue;
      if (k.type === 'cash') { S.save.money += k.n; G.save(); G.snd.cash(); }
      else if (k.type === 'gun') { if (P.car) continue; giveWeapon(S, k.id, k.n); G.snd.pick(); }
      else if (k.type === 'armor') { if (P.armor >= 100) continue; P.armor = Math.min(100, P.armor + k.n); G.say('Colete recolhido.', 2); G.snd.pick(); }
      else if (k.type === 'health') { if (P.hp >= 100) continue; P.hp = Math.min(100, P.hp + k.n); G.say('Kit médico: +' + k.n + ' de vida.', 2); G.snd.pick(); }
      S.pickups.splice(i, 1);
    }
  }

  // ---------- Marcas de pneu ----------
  function updateSkids(S, dt) {
    const P = S.player, ref = P.car || P;
    for (const c of S.cars) {
      if (c.dead || Math.abs(c.x - ref.x) > 700 || Math.abs(c.y - ref.y) > 700) { c._sk = null; continue; }
      const slide = !c.onGrass && c.speed > 60 && (Math.abs(c.vr) > 95 || (c.hb && c.speed > 120) || (c.thr < 0 && c.vf > 150));
      if (!slide) { c._sk = null; continue; }
      const rx = Math.cos(c.a), ry = Math.sin(c.a);
      const lx = c.x - c.fx * 24 - rx * 14, ly = c.y - c.fy * 24 - ry * 14, qx = c.x - c.fx * 24 + rx * 14, qy = c.y - c.fy * 24 + ry * 14;
      if (c._sk) {
        S.skids.push({ x1: c._sk[0], y1: c._sk[1], x2: lx, y2: ly, t: 0 }, { x1: c._sk[2], y1: c._sk[3], x2: qx, y2: qy, t: 0 });
      }
      if (Math.random() < 0.6) for (const [sx, sy] of [[lx, ly], [qx, qy]]) G.particle({ x: sx, y: sy, vx: rand(-14, 14), vy: rand(-14, 14), life: 0.9, size: 3.5, col: 'smoke', tint: '#dcdce4', a: 0.34 });
      c._sk = [lx, ly, qx, qy];
    }
    for (const s of S.skids) s.t += dt;
    if (S.skids.length > 600 || (S.skids.length && S.skids[0].t > 45)) S.skids = S.skids.filter(s => s.t < 45).slice(-600);
  }

  // ---------- Pedestres armados: atirar, perseguir, prender ----------
  const walkable = (x, y) => !W.isSolid(x, y) && !W.treeHit(x, y, 3);
  function moveToward(p, ang, sp, dt) {
    const tries = p.side ? [0, p.side * 0.7, -p.side * 0.7, p.side * 1.3, -p.side * 1.3] : [0, 0.7, -0.7, 1.3, -1.3];
    for (const off of tries) {
      const a = ang + off, nx = p.x + Math.cos(a) * sp * dt, ny = p.y + Math.sin(a) * sp * dt;
      const lx = p.x + Math.cos(a) * 12, ly = p.y + Math.sin(a) * 12;
      if (walkable(lx, ly) && walkable(nx, ny)) { p.x = nx; p.y = ny; if (off) p.side = off > 0 ? 1 : -1; p.walk += sp * dt * 0.22; return true; }
    }
    return false;
  }

  function enemyFire(S, p, tg, ang) {
    const wid = p.weapon || 'pistol', w = WEAPONS[wid], e = ENEMY[wid] || ENEMY.pistol;
    const d = Math.hypot(tg.x - p.x, tg.y - p.y);
    const lead = ang + clamp(((tg.vx || 0) * -Math.sin(ang) + (tg.vy || 0) * Math.cos(ang)) * 0.0009 * d, -0.25, 0.25);
    const sp = 0.07 + d / 3400 + (S.player.car ? 0.05 : 0);
    const mx = p.x + Math.cos(ang) * 12, my = p.y + Math.sin(ang) * 12;
    for (let k = 0; k < (w.pellets || 1); k++) fireBullet(S, { x: mx, y: my, a: lead + rand(-1, 1) * (w.pellets > 1 ? w.spread : sp), speed: w.speed * 0.72, dmg: e.dmg, own: p.kind === 'cop' ? 'cop' : 'thug', range: w.range + 60 });
    p.flashT = 0.07; flash(mx, my);
    G.snd.gun(w.snd, vol(S, p.x, p.y));
    p.burst = (p.burst || 0) + 1;
    p.fireT = wid === 'smg' ? (p.burst % 6 === 0 ? 0.9 : e.cd) : e.cd * rand(0.8, 1.3);
  }

  function fightPed(S, p, dt) {
    const P = S.player, tg = P.car || P;
    const dx = tg.x - p.x, dy = tg.y - p.y, d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    const wid = p.weapon || 'pistol';
    p.fireT = (p.fireT || 0) - dt; p.react = (p.react || 0) - dt;
    const wasIn = S.mode === 'play';
    const arrest = p.kind === 'cop' && S.heatLevel <= 2 && !S.copHostile && S.time - S.lastShot > 6;
    p.arresting = arrest;
    const los = d < 540 && G.ai.lineClear(p.x, p.y, tg.x, tg.y);
    p.h += wrap(ang + Math.PI / 2 - p.h) * Math.min(1, 10 * dt);
    const sp = p.kind === 'cop' ? (p.weapon === 'pistol' ? 96 : 88) : 84;
    let pref = arrest || wid === 'bat' ? 0 : wid === 'shotgun' ? 110 : wid === 'smg' ? 170 : 200;
    if (!los) pref = 0;
    let moved = false;
    if (d > pref + 26) moved = moveToward(p, ang, sp, dt);
    else if (d < pref - 60 && pref > 0) moved = moveToward(p, ang + Math.PI, sp * 0.6, dt);
    if (!moved) p.walk += 0;
    if (p.kind === 'cop' && d > 650 && P.car) { p.farT = (p.farT || 0) + dt; if (p.farT > 6) p.dead = true; } else p.farT = 0;
    if (!wasIn) return;
    if (wid === 'bat') {
      if (d < 30 && p.fireT <= 0) { p.fireT = 0.75; p.punchT = 0.35; G.snd.swing(); hurtPlayer(S, 11, p.x, p.y); }
    } else if (!arrest && los && d < (WEAPONS[wid].range + 40) && p.fireT <= 0 && p.react <= 0) enemyFire(S, p, tg, ang);
  }

  function guardPed(S, p, dt) {
    const P = S.player, tg = P.car || P;
    p.walk = 0;
    const d = Math.hypot(tg.x - p.x, tg.y - p.y);
    p.h += wrap(Math.atan2(tg.y - p.y, tg.x - p.x) + Math.PI / 2 - p.h) * Math.min(1, 2 * dt) * (d < 420 ? 1 : 0);
    if (S.thugAlert || (d < 300 && G.ai.lineClear(p.x, p.y, tg.x, tg.y)) || (S.time - S.lastShot < 1.2 && d < 600)) { p.state = 'fight'; p.react = rand(0.25, 0.7); S.thugAlert = true; }
  }

  // devolve true quando o pedestre foi tratado aqui
  function updatePed(p, dt, S) {
    if (p.script) return true;
    if (p.flashT > 0) p.flashT -= dt;
    if (p.state === 'dead') {
      p.corpseT = (p.corpseT || 0) + dt; p.pool = Math.min(1, p.corpseT / 3.5);
      const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
      if (!W.isSolid(nx, p.y)) p.x = nx; else p.vx = 0;
      if (!W.isSolid(p.x, ny)) p.y = ny; else p.vy = 0;
      p.vx *= 0.9; p.vy *= 0.9;
      if (p.corpseT > 80) p.dead = true;
      return true;
    }
    if (p.state === 'down') {
      p.downT += dt;
      const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
      if (!W.isSolid(nx, p.y)) p.x = nx; else p.vx = 0;
      if (!W.isSolid(p.x, ny)) p.y = ny; else p.vy = 0;
      p.vx *= 0.9; p.vy *= 0.9;
      if (p.downT > 1.6) { if (p.armed || p.kind !== 'civ') { p.state = 'fight'; p.react = 0.4; } else { p.state = 'flee'; p.fleeT = rand(3, 5); p.threat = p.threat || { x: S.player.x, y: S.player.y }; } }
      return true;
    }
    if (p.punchT > 0) p.punchT -= dt;
    if (p.state === 'guard') { guardPed(S, p, dt); return true; }
    if (p.state === 'fight') { fightPed(S, p, dt); return true; }
    if (p.vx || p.vy) { // empurrão de tiro / pancada
      const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
      if (!W.isSolid(nx, p.y)) p.x = nx; if (!W.isSolid(p.x, ny)) p.y = ny;
      p.vx *= 0.85; p.vy *= 0.85; if (Math.abs(p.vx) + Math.abs(p.vy) < 4) p.vx = p.vy = 0;
    }
    return false;
  }

  // ---------- Polícia a pé e tiros das viaturas ----------
  function makeCop(S, x, y, lvl) {
    const swat = lvl >= 4;
    const p = G.ai.makePed(x, y);
    Object.assign(p, {
      kind: 'cop', hp: swat ? 120 : 70, weapon: swat ? (lvl >= 5 ? 'shotgun' : 'smg') : 'pistol', armed: true,
      shirt: swat ? '#15171c' : '#1c2f6b', cap: swat ? 'swat' : 'cop', state: 'fight', react: rand(0.5, 1.1), fireT: rand(0.4, 1), vx: 0, vy: 0,
    });
    S.peds.push(p); return p;
  }
  const copCount = S => S.peds.reduce((n, p) => n + (p.kind === 'cop' && p.state !== 'dead' && !p.dead ? 1 : 0), 0);

  function dismount(S, c, lvl) {
    const n = lvl >= 3 ? 2 : 1, CW = G.sprites.CAR_W;
    for (let k = 0; k < n; k++) {
      const side = k % 2 === 0 ? 1 : -1;
      let x = c.x + Math.cos(c.a) * side * (CW / 2 + 14), y = c.y + Math.sin(c.a) * side * (CW / 2 + 14);
      if (!walkable(x, y)) { x = c.x; y = c.y; }
      makeCop(S, x, y, lvl);
    }
    c.mode = 'parked'; c.driver = 'none'; c.thr = 0; c.steer = 0; c.hb = true; c.nav = null;
  }

  function roadblockCops(S, cars) {
    const lvl = Math.max(3, S.heatLevel);
    cars.forEach(c => {
      if (copCount(S) >= 7) return;
      const x = c.x + rand(-26, 26), y = c.y + rand(-26, 26);
      makeCop(S, walkable(x, y) ? x : c.x, walkable(x, y) ? y : c.y, lvl);
    });
  }

  function copLogic(S, dt) {
    const P = S.player, tg = P.car || P, lvl = S.heatLevel;
    if (lvl === 0) {
      S.copHostile = false;
      for (const p of S.peds) if (p.kind === 'cop' && p.state === 'fight') { p.state = 'walk'; p.arresting = false; }
      return;
    }
    let cops = copCount(S);
    const slow = P.car ? P.car.speed < 110 : true;
    for (const c of S.cars) {
      if (c.kind !== 'police' || c.mode !== 'chase' || c.driver !== 'ai' || c.dead) continue;
      const d = Math.hypot(tg.x - c.x, tg.y - c.y);
      c.fireT = (c.fireT || 0) - dt;
      if (d < 240 && slow && cops < 5 && S.mode === 'play') { dismount(S, c, lvl); cops += lvl >= 3 ? 2 : 1; continue; }
      if (lvl >= 3 && d < 460 && d > 70 && c.fireT <= 0 && S.mode === 'play' && G.ai.lineClear(c.x, c.y, tg.x, tg.y)) {
        const ang = Math.atan2(tg.y + (tg.vy || 0) * 0.3 - c.y, tg.x + (tg.vx || 0) * 0.3 - c.x) + rand(-0.17, 0.17);
        fireBullet(S, { x: c.x + Math.cos(ang) * 30, y: c.y + Math.sin(ang) * 30, a: ang, speed: 640, dmg: 6, own: 'cop', range: 560, car: c });
        flash(c.x + Math.cos(ang) * 30, c.y + Math.sin(ang) * 30);
        G.snd.gun('pistol', vol(S, c.x, c.y)); c.fireT = rand(0.5, 0.95);
      }
    }
    const h = S.heli;
    if (h && lvl >= 5 && S.mode === 'play') {
      h.fireT = (h.fireT || 0) - dt;
      const d = Math.hypot(tg.x - h.x, tg.y - h.y);
      if (d < 560 && h.fireT <= 0) {
        const ang = Math.atan2(tg.y - h.y, tg.x - h.x) + rand(-0.2, 0.2);
        fireBullet(S, { x: h.x, y: h.y, a: ang, speed: 700, dmg: 4, own: 'cop', range: 620 });
        G.snd.gun('smg', vol(S, h.x, h.y) * 0.8); h.fireT = 0.2;
      }
    }
  }

  // ---------- Atualização geral ----------
  function update(S, dt) {
    const P = S.player;
    if (S.hurtT > 0) S.hurtT -= dt;
    if (S.mode === 'play') {
      if (P.hp < S.lastHp - 0.4 && S.hurtT <= 0) { S.hurtT = 0.3; if (!P.car && P.hp > 0) spray(S, P.x, P.y, rand(0, TAU), 4, 140); }
      S.lastHp = P.hp;
      copLogic(S, dt);
    } else S.lastHp = 100;
    updateBullets(S, dt);
    updateGrenades(S, dt);
    updatePickups(S, dt);
    updateSkids(S, dt);
    for (const d of S.decals) d.t += dt;
    // no máximo 28 corpos no chão: os mais velhos somem
    let bodies = S.peds.filter(p => p.state === 'dead' && !p.dead);
    if (bodies.length > 28) { bodies.sort((a, b) => b.corpseT - a.corpseT); for (let i = 0; i < bodies.length - 28; i++) bodies[i].dead = true; }
  }

  // ---------- Desenho ----------
  function drawDecals(ctx, S, inV) {
    for (const s of S.skids) {
      if (!inV({ x: s.x1, y: s.y1 })) continue;
      ctx.strokeStyle = 'rgba(8,6,14,' + (0.42 * (1 - s.t / 45)).toFixed(3) + ')'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke();
    }
    for (const d of S.decals) {
      if (!inV(d)) continue;
      if (d.kind === 'scorch') {
        ctx.fillStyle = 'rgba(10,8,8,0.30)'; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(6,5,5,0.35)'; ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 0.6, 0, TAU); ctx.fill();
        continue;
      }
      ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rot); ctx.globalAlpha = d.t < 25 ? 0.95 : 0.85;
      ctx.drawImage(blobSprite(d.v, d.t > 25), -d.r, -d.r, d.r * 2, d.r * 2); ctx.restore();
    }
    ctx.lineCap = 'butt';
  }
  function drawPickups(ctx, S, inV, time) {
    for (const k of S.pickups) {
      if (!inV(k)) continue;
      const bob = Math.sin(time * 4 + k.x) * 1.5;
      ctx.save(); ctx.translate(k.x, k.y);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(2, 5, 8, 4, 0, 0, TAU); ctx.fill();
      ctx.translate(0, bob - 3);
      if (k.type === 'cash') { ctx.fillStyle = '#3fbf4d'; ctx.fillRect(-8, -5, 16, 10); ctx.strokeStyle = '#0a3a10'; ctx.lineWidth = 1.5; ctx.strokeRect(-8, -5, 16, 10); ctx.fillStyle = '#eaffea'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('$', 0, 3); }
      else if (k.type === 'gun') { ctx.fillStyle = 'rgba(255,230,120,0.35)'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill(); ctx.fillStyle = '#16181c'; ctx.fillRect(-7, -2, 12, 4); ctx.fillRect(-5, 1, 4, 6); ctx.fillStyle = '#8a8f99'; ctx.fillRect(3, -2, 5, 2); }
      else if (k.type === 'armor') { ctx.fillStyle = '#3a78d8'; ctx.beginPath(); ctx.moveTo(-8, -7); ctx.lineTo(8, -7); ctx.lineTo(8, 1); ctx.quadraticCurveTo(8, 8, 0, 10); ctx.quadraticCurveTo(-8, 8, -8, 1); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke(); }
      else { ctx.fillStyle = '#fff'; ctx.fillRect(-8, -8, 16, 16); ctx.fillStyle = '#e03030'; ctx.fillRect(-2, -6, 4, 12); ctx.fillRect(-6, -2, 12, 4); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.strokeRect(-8, -8, 16, 16); }
      ctx.restore();
    }
  }
  function drawAir(ctx, S, inV) {
    for (const g of S.grenades) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(g.x + 3, g.y + 4, 5, 3, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.spin); ctx.fillStyle = '#3f5a2a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c9c9c9'; ctx.fillRect(-1, -6, 2, 3); ctx.restore();
    }
    for (const b of S.bullets) {
      if (!inV(b)) continue;
      const enemy = b.own !== 'player';
      ctx.strokeStyle = enemy ? 'rgba(255,170,140,0.95)' : 'rgba(255,236,150,0.95)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      const l = Math.hypot(b.vx, b.vy) || 1;
      ctx.beginPath(); ctx.moveTo(b.x - b.vx / l * 13, b.y - b.vy / l * 13); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }
  function drawScreen(ctx, S) {
    const P = S.player;
    let a = 0;
    if (S.hurtT > 0) a = Math.max(a, S.hurtT / 0.3 * 0.45);
    if (P.hp < 35 && P.hp > 0 && S.mode === 'play') a = Math.max(a, 0.18 + 0.12 * Math.sin(S.time * 7));
    if (a <= 0) return;
    const g = ctx.createRadialGradient(400, 300, 200, 400, 300, 520);
    g.addColorStop(0, 'rgba(160,0,0,0)'); g.addColorStop(1, 'rgba(160,0,0,' + a.toFixed(3) + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 800, 600);
  }

  // ---------- Loja de armas ----------
  const PRICE_AMMO = { pistol: 36, smg: 90, shotgun: 16 };
  const ITEMS = [
    { k: 'Digit1', n: 'Taco de beisebol', p: 60, own: 'bat', f: S => giveWeapon(S, 'bat', 0) },
    { k: 'Digit2', n: 'Pistola (+36 balas)', p: 150, own: 'pistol', f: S => giveWeapon(S, 'pistol', 36) },
    { k: 'Digit3', n: 'Submetralhadora (+90 balas)', p: 450, own: 'smg', f: S => giveWeapon(S, 'smg', 90) },
    { k: 'Digit4', n: 'Escopeta (+16 cartuchos)', p: 600, own: 'shotgun', f: S => giveWeapon(S, 'shotgun', 16) },
    { k: 'Digit5', n: 'Granadas (x4)', p: 160, f: S => giveWeapon(S, 'grenade', 4) },
    { k: 'Digit6', n: 'Munição para as armas que você tem', p: 120, f: S => { const a = arms(S); let any = false; Object.keys(PRICE_AMMO).forEach(id => { if (a.own[id]) { a.ammo[id] = Math.min(MAX_AMMO, (a.ammo[id] || 0) + PRICE_AMMO[id]); any = true; } }); if (!any) return false; G.save(); G.say('Munição reabastecida.', 2); } },
    { k: 'Digit7', n: 'Colete à prova de balas', p: 250, f: S => { if (S.player.armor >= 100) return false; S.player.armor = 100; G.say('Colete vestido.', 2); } },
  ];
  function shopKey(S, code) { // retorna true se fechou a loja
    if (code === 'Escape' || code === 'KeyE' || code === 'Enter') return true;
    const it = ITEMS.find(i => i.k === code); if (!it) return false;
    const a = arms(S);
    if (it.own && a.own[it.own] && it.own !== 'pistol' && it.own !== 'smg' && it.own !== 'shotgun') { G.say('Você já tem isso.', 2); return false; }
    if (S.save.money < it.p) { G.say('Dinheiro insuficiente ($' + it.p + ').', 2); G.snd.fail(); return false; }
    if (it.f(S) === false) { G.say('Você não precisa disso agora.', 2); return false; }
    S.save.money -= it.p; G.save(); G.snd.cash();
    return false;
  }
  function drawShop(ctx, S) {
    const H = G.hud, a = arms(S);
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#1b1322'; ctx.fillRect(110, 80, 580, 440); ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = 4; ctx.strokeRect(110, 80, 580, 440);
    H.txt(ctx, 'LOJA DE ARMAS', 400, 130, 38, '#ff4fd8', 'center');
    H.txt(ctx, 'Seu dinheiro: $' + S.save.money, 400, 162, 20, '#3fdc4a', 'center');
    ITEMS.forEach((it, i) => {
      const y = 212 + i * 40, own = it.own && a.own[it.own];
      H.txt(ctx, '[' + (i + 1) + ']', 140, y, 20, '#ffe04a');
      H.txt(ctx, it.n, 190, y, 19, own && !PRICE_AMMO[it.own] ? '#8a8a8a' : '#fff');
      H.txt(ctx, own && !PRICE_AMMO[it.own] ? 'TEM' : '$' + it.p, 660, y, 19, S.save.money >= it.p ? '#3fdc4a' : '#ff6b6b', 'right');
    });
    const cur = WEAPONS[S.player.weapon];
    H.txt(ctx, 'Arma atual: ' + cur.name + (usesAmmo(cur) ? '  •  munição ' + ammoOf(S, cur.id) : ''), 400, 488, 15, '#bbb', 'center');
    H.txt(ctx, 'Aperte o número para comprar • Esc ou E para sair', 400, 510, 13, '#888', 'center');
  }

  G.combat = {
    WEAPONS, ORDER, reset, arms, ammoOf, giveWeapon, select, cycle, confiscate, playerUpdate, update, updatePed,
    hurtPed, killPed, hurtPlayer, carHit, blast, scorch, spray, addDecal, fireBullet, noise, copNear, roadblockCops, makeCop, drop,
    drawDecals, drawPickups, drawAir, drawScreen, drawShop, shopKey, blobSprite,
  };
})(window.G = window.G || {});
