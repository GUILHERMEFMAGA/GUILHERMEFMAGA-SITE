'use strict';
/* =========================================================
   Laço principal, câmera, renderização com iluminação e HUD
   ========================================================= */

const Game = {
  state: 'loading', canvas: null, ctx: null, light: null, lctx: null,
  vw: 480, vh: 270, scale: 3, cam: { x: 0, y: 0 }, last: 0, popT: 0,
  attract: { car: null, t: 0 }, best: 0, hud: {}, inGarage: false, district: '', miniT: 0,
  movingBoats: [],
};

/* ---------- Mensagens do HUD ---------- */
function uiToast(text, kind = '') {
  if (typeof document === 'undefined') return;
  const box = document.getElementById('toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.textContent = text;
  box.appendChild(el);
  while (box.children.length > 4) box.removeChild(box.firstChild);
  setTimeout(() => el.classList.add('out'), 2600);
  setTimeout(() => el.remove(), 3200);
}

let _bigTimer = null;
function uiBig(title, sub, kind = '', secs = 2.6) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('big');
  el.className = 'big show ' + kind;
  el.querySelector('.big-title').textContent = title;
  el.querySelector('.big-sub').textContent = sub || '';
  clearTimeout(_bigTimer);
  _bigTimer = setTimeout(() => el.classList.remove('show'), secs * 1000);
}

/* ---------- Inicialização ---------- */
function initGame() {
  Game.canvas = document.getElementById('tela');
  Game.ctx = ctx2d(Game.canvas);
  Game.light = makeCanvas(16, 16);
  Game.lctx = ctx2d(Game.light);
  Input.init(window);
  try { Game.best = parseInt(localStorage.getItem('noite-na-cidade-recorde') || '0', 10) || 0; } catch (e) { Game.best = 0; }

  genCity();
  buildArt();
  Art.worldCtx = ctx2d(Art.world);
  buildPedTiles();
  Game.movingBoats = [
    { x: 94 * T, y: 10 * T, vy: 14, len: 30, wid: 11, c: [230, 230, 236], ph: 0 },
    { x: 106 * T, y: 80 * T, vy: -10, len: 24, wid: 9, c: [70, 120, 210], ph: 2 },
  ];
  resize();
  window.addEventListener('resize', resize);
  newGame();
  setupUI();
  Game.state = 'menu';
  document.body.classList.add('ready');
  requestAnimationFrame(loop);
}

function newGame() {
  World.cars = []; World.peds = []; World.particles = []; World.pickups = []; World.flashes = [];
  World.time = 0; World.respawn = null; World.shake = 0; World.policeSpawnT = 0;
  World.player = makePlayer();
  for (const pk of City.parked) {
    const c = makeCar(pk.type, pk.type === 'sport' ? [230, 40, 40] : null, pk.x, pk.y, pk.angle, 'free');
    c.parkedHome = true; c.hasDriver = false;
    World.cars.push(c);
  }
  for (let i = 0; i < POP.ai; i++) spawnAICar(null, null);
  for (let i = 0; i < POP.patrols; i++) { const c = spawnAICar('police', null); if (c) { c.hasDriver = true; c.ai.cruise = 80; } }
  for (let i = 0; i < POP.peds; i++) spawnPed(null);
  for (let i = 0; i < POP.pickups; i++) spawnPickup();
  Missions.reset();
  Game.cam.x = World.player.x - Game.vw / 2;
  Game.cam.y = World.player.y - Game.vh / 2;
  Game.district = '';
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  let scale = Math.min(w / 430, h / 250);
  scale = scale >= 2 ? Math.floor(scale) : Math.max(1.25, scale);
  Game.scale = scale;
  Game.vw = Math.ceil(w / scale);
  Game.vh = Math.ceil(h / scale);
  Game.canvas.width = Game.vw; Game.canvas.height = Game.vh;
  Game.canvas.style.width = Game.vw * scale + 'px';
  Game.canvas.style.height = Game.vh * scale + 'px';
  Game.light.width = Game.vw; Game.light.height = Game.vh;
  Game.ctx.imageSmoothingEnabled = false;
  Game.lctx.imageSmoothingEnabled = false;
}

/* ---------- Laço ---------- */
function loop(ts) {
  const dt = Math.min(0.05, Math.max(0.001, (ts - Game.last) / 1000 || 0.016));
  Game.last = ts;
  if (Game.state === 'playing') update(dt);
  else if (Game.state === 'menu') attractUpdate(dt);
  else if (Game.state === 'paused') { if (Input.hit('pause')) setPaused(false); }
  render();
  Input.endFrame();
  requestAnimationFrame(loop);
}

function viewRect(m = 0) {
  return { x0: Game.cam.x - m, y0: Game.cam.y - m, x1: Game.cam.x + Game.vw + m, y1: Game.cam.y + Game.vh + m };
}

function update(dt) {
  World.time += dt;
  const p = World.player;
  if (Input.hit('pause')) { setPaused(true); return; }
  if (Input.hit('mute')) toggleMute();
  if (World.respawn) { World.respawn.t -= dt; if (World.respawn.t <= 0) doRespawn(); }

  updateCamera(dt, p.x, p.y, p.car);
  const view = viewRect(48);
  updateEntities(dt, view);
  Missions.update(dt);
  updateBoats(dt);
  checkGarage();

  Game.popT -= dt;
  if (Game.popT <= 0) { Game.popT = 0.2; maintainPopulation(viewRect(64)); }

  // sirene
  let near = 1e9;
  for (const c of World.cars) if (c.siren && c.mode === 'police') near = Math.min(near, dist(c.x, c.y, p.x, p.y));
  Sound.setSiren(near < 500 ? 1 - near / 500 : 0, World.time);

  if (p.money > Game.best) {
    Game.best = p.money;
    try { localStorage.setItem('noite-na-cidade-recorde', String(Game.best)); } catch (e) { /* sem armazenamento */ }
  }
  updateHUD(dt);
}

function attractUpdate(dt) {
  World.time += dt;
  const a = Game.attract;
  a.t -= dt;
  if (!a.car || a.car.removed || a.car.mode !== 'ai' || a.t <= 0) {
    const list = World.cars.filter((c) => c.mode === 'ai' && !c.isPolice);
    a.car = list.length ? pick(list) : null;
    a.t = 14;
  }
  const tx = a.car ? a.car.x : WORLD_W / 2, ty = a.car ? a.car.y : WORLD_H / 2;
  updateCamera(dt, tx, ty, a.car ? { vx: Math.cos(a.car.angle) * a.car.v, vy: Math.sin(a.car.angle) * a.car.v } : null);
  for (const c of World.cars) {
    if (c.mode === 'ai') updateAICar(c, dt, World.time);
    else if (c.mode === 'free') updatePhysicsCar(c, dt, { throttle: 0, steer: 0, handbrake: true });
  }
  for (const q of World.peds) updatePed(q, dt);
  updateBoats(dt);
  updateParticles(dt);
  Game.popT -= dt;
  if (Game.popT <= 0) { Game.popT = 0.3; maintainPopulation(viewRect(64)); }
}

function updateCamera(dt, x, y, car) {
  let lx = 0, ly = 0;
  if (car) { lx = clamp(car.vx * 0.45, -100, 100); ly = clamp(car.vy * 0.45, -70, 70); }
  const tx = x + lx - Game.vw / 2, ty = y + ly - Game.vh / 2;
  const k = 1 - Math.exp(-5 * dt);
  Game.cam.x += (tx - Game.cam.x) * k;
  Game.cam.y += (ty - Game.cam.y) * k;
  if (Math.abs(tx - Game.cam.x) > 600 || Math.abs(ty - Game.cam.y) > 600) { Game.cam.x = tx; Game.cam.y = ty; }
  Game.cam.x = clamp(Game.cam.x, 0, Math.max(0, WORLD_W - Game.vw));
  Game.cam.y = clamp(Game.cam.y, 0, Math.max(0, WORLD_H - Game.vh));
  if (World.shake > 0) World.shake = Math.max(0, World.shake - dt * 14);
}

function updateBoats(dt) {
  for (const b of Game.movingBoats) {
    b.y += b.vy * dt;
    if (b.y > WORLD_H + 40) b.y = -40;
    if (b.y < -40) b.y = WORLD_H + 40;
  }
}

function checkGarage() {
  const p = World.player, g = City.garage;
  const c = p.car;
  if (!c || !g || !(c.x > g.x0 && c.x < g.x1 && c.y > g.y0 && c.y < g.y1)) { Game.inGarage = false; return; }
  if (Game.inGarage) return;
  Game.inGarage = true;
  if (p.heat >= 0.5) {
    const cost = 400;
    if (p.money >= cost) {
      p.money -= cost; p.heat = 0;
      for (const o of World.cars) if (o.mode === 'police') { o.mode = 'free'; o.siren = false; o.freeT = 0; }
      for (const q of World.peds) if (q.state === 'chase') { q.state = 'walk'; q.kind = 'civ'; pedPickTarget(q, false); }
      const opts = c.spec.colors.filter((k) => k !== c.color);
      c.color = opts.length ? pick(opts) : c.color;
      c.sprite = carSprite(c.type, c.color);
      c.health = 100;
      Sound.success();
      uiBig('PINTURA NOVA!', `A polícia perdeu sua pista. -$${cost}`, 'good');
    } else uiToast(`A PINTURA CUSTA $${cost}`, 'warn');
  } else if (c.health < 100) {
    const cost = 100;
    if (p.money >= cost) { p.money -= cost; c.health = 100; Sound.coin(); uiToast(`CARRO CONSERTADO  -$${cost}`, 'good'); }
    else uiToast(`O CONSERTO CUSTA $${cost}`, 'warn');
  } else uiToast('GARAGEM: VOLTE QUANDO ESTIVER PROCURADO');
}

/* ---------- Renderização ---------- */
function render() {
  const g = Game.ctx, L = Game.lctx;
  const vw = Game.vw, vh = Game.vh;
  let sx = 0, sy = 0;
  if (World.shake > 0) { sx = Math.round(randRange(-1, 1) * World.shake); sy = Math.round(randRange(-1, 1) * World.shake); }
  const cx = Math.round(Game.cam.x) + sx, cy = Math.round(Game.cam.y) + sy;
  const t = World.time;
  const inV = (x, y, m) => x > cx - m && x < cx + vw + m && y > cy - m && y < cy + vh + m;

  g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#05060c';
  g.fillRect(0, 0, vw, vh);
  g.drawImage(Art.world, cx, cy, vw, vh, 0, 0, vw, vh);

  drawWater(g, cx, cy, t);
  drawBoats(g, cx, cy, t, inV);

  // semáforos (base)
  for (const n of City.nodes) {
    if (!n.lights || !inV(n.cx, n.cy, 60)) continue;
    for (const s of signalHeads(n)) { g.fillStyle = '#15151b'; g.fillRect(s.x - cx - 2, s.y - cy - 2, 4, 4); }
  }

  // dinheiro e orelhões
  for (const k of World.pickups) {
    if (!inV(k.x, k.y, 10)) continue;
    const bob = Math.round(Math.sin(k.ph * 4) * 1.5);
    g.fillStyle = '#0d3b1c'; g.fillRect(k.x - cx - 4, k.y - cy - 3 + bob, 8, 6);
    g.fillStyle = '#3ddc6a'; g.fillRect(k.x - cx - 3, k.y - cy - 2 + bob, 6, 4);
    g.fillStyle = '#c8ffd8'; g.fillRect(k.x - cx - 1, k.y - cy - 1 + bob, 2, 2);
  }

  // pedestres caídos, depois os de pé
  for (const q of World.peds) if (!q.inCar && q.state === 'down' && inV(q.x, q.y, 10)) drawPed(g, q, cx, cy);
  for (const q of World.peds) if (!q.inCar && q.state !== 'down' && inV(q.x, q.y, 10)) drawPed(g, q, cx, cy);

  // carros
  for (const c of World.cars) {
    if (!inV(c.x, c.y, 30)) continue;
    g.save();
    g.translate(Math.round(c.x - cx), Math.round(c.y - cy));
    g.rotate(c.angle);
    g.drawImage(c.sprite, -c.len / 2, -c.wid / 2);
    if (c.siren) {
      const on = Math.floor(t * 8) % 2 === 0;
      const rx = c.type === 'police' ? 6 - c.len / 2 : -2;
      g.fillStyle = on ? '#ff3344' : '#3355ff';
      g.fillRect(rx, -c.wid / 2 + 1, 2, c.wid - 2);
    }
    g.restore();
  }

  // jogador a pé
  const p = World.player;
  if (p.onFoot && p.alive && Game.state !== 'menu') drawPed(g, p, cx, cy);

  // fumaça (antes da luz para ser iluminada)
  for (const q of World.particles) {
    if (q.type !== 'smoke' || !inV(q.x, q.y, 10)) continue;
    const k = 1 - q.life / q.max;
    g.fillStyle = rgb(70, 70, 78, 0.55 * k);
    const s = Math.round(q.size);
    g.fillRect(Math.round(q.x - cx - s / 2), Math.round(q.y - cy - s / 2), s, s);
  }

  /* ----- luz ----- */
  L.globalCompositeOperation = 'source-over';
  L.drawImage(Art.light, cx, cy, vw, vh, 0, 0, vw, vh);
  L.globalCompositeOperation = 'lighter';
  const hl = headlightSprite();
  for (const c of World.cars) {
    if (!inV(c.x, c.y, 80) || c.wreck) continue;
    const on = c.mode === 'ai' || c.mode === 'police' || c.mode === 'player' || c.hasDriver;
    if (on) {
      L.save();
      L.translate(Math.round(c.x - cx), Math.round(c.y - cy));
      L.rotate(c.angle);
      L.drawImage(hl, c.len / 2 - 1, -hl.height / 2);
      L.restore();
    }
    if (c.siren) {
      const ph = Math.floor(t * 8) % 2 === 0;
      const s = ph ? glowSprite(255, 40, 60, 40, 0.9) : glowSprite(50, 90, 255, 40, 0.9);
      L.drawImage(s, Math.round(c.x - cx - 40), Math.round(c.y - cy - 40));
    }
    if (c.burning > 0) {
      const f = glowSprite(255, 140, 40, 36, 0.8 + Math.random() * 0.2);
      L.drawImage(f, Math.round(c.x - cx - 36), Math.round(c.y - cy - 36));
    }
  }
  for (const f of World.flashes) {
    const s = glowSprite(255, 190, 90, 110, Math.min(1, f.t * 2.2));
    L.drawImage(s, Math.round(f.x - cx - 110), Math.round(f.y - cy - 110));
  }
  if (p.alive && p.onFoot && Game.state !== 'menu') L.drawImage(glowSprite(150, 150, 190, 22, 0.35), Math.round(p.x - cx - 22), Math.round(p.y - cy - 22));
  for (const k of World.pickups) if (inV(k.x, k.y, 20)) L.drawImage(glowSprite(60, 255, 120, 12, 0.6), Math.round(k.x - cx - 12), Math.round(k.y - cy - 12));
  const tgt = Game.state === 'playing' ? Missions.target() : null;
  if (tgt) L.drawImage(glowSprite(255, 220, 60, 30, 0.7), Math.round(tgt.x - cx - 30), Math.round(tgt.y - cy - 30));

  g.globalCompositeOperation = 'multiply';
  g.drawImage(Game.light, 0, 0);

  /* ----- brilho aditivo (bloom) ----- */
  g.globalCompositeOperation = 'lighter';
  g.drawImage(Art.bloom, cx, cy, vw, vh, 0, 0, vw, vh);
  // neon
  for (const n of City.neons) {
    if (!inV(n.x, n.y, 30)) continue;
    let a = 0.9;
    if (n.flicker) { const s = Math.sin(t * 13 + n.ph) + Math.sin(t * 7.3 + n.ph * 2); a = s > 1.2 ? 0.15 : 0.9; }
    g.fillStyle = rgb(n.c[0], n.c[1], n.c[2], a);
    g.fillRect(n.x - cx, n.y - cy, n.w, n.h);
    g.fillStyle = rgb(255, 255, 255, a * 0.5);
    g.fillRect(n.x - cx + (n.w > n.h ? 1 : 0), n.y - cy + (n.h > n.w ? 1 : 0), n.w > n.h ? n.w - 2 : 1, n.h > n.w ? n.h - 2 : 1);
  }
  // luzes de sinalização nos telhados
  for (const b of Art.beacons) {
    if (!inV(b.x, b.y, 10)) continue;
    if (Math.sin(t * 2.4 + b.ph) > 0.4) {
      g.drawImage(glowSprite(b.c[0], b.c[1], b.c[2], 6, 0.9), Math.round(b.x - cx - 6), Math.round(b.y - cy - 6));
    }
  }
  // postes com defeito piscando
  for (const l of City.lamps) {
    if (!l.broken || !inV(l.bx, l.by, 60)) continue;
    if (Math.sin(t * 17 + l.ph) + Math.sin(t * 5 + l.ph) > 0.6) {
      g.drawImage(glowSprite(255, 160, 70, 40, 0.5), Math.round(l.bx - cx - 40), Math.round(l.by - cy - 40));
      g.drawImage(glowSprite(255, 200, 120, 10, 0.9), Math.round(l.bx - cx - 10), Math.round(l.by - cy - 10));
    }
  }
  // semáforos
  for (const n of City.nodes) {
    if (!n.lights || !inV(n.cx, n.cy, 60)) continue;
    for (const s of signalHeads(n)) {
      const st = lightState(n, s.vertical, t);
      const col = st === 'G' ? [60, 255, 120] : st === 'Y' ? [255, 200, 40] : [255, 50, 50];
      g.drawImage(glowSprite(col[0], col[1], col[2], 7, 0.95), Math.round(s.x - cx - 7), Math.round(s.y - cy - 7));
      g.fillStyle = rgb(...col);
      g.fillRect(s.x - cx - 1, s.y - cy - 1, 2, 2);
    }
  }
  // reflexos dos postes na água
  for (const r of Art.reflections) {
    if (!inV(r.x, r.y, 20)) continue;
    for (let i = 0; i < 4; i++) {
      const w = 3 + ((i * 3 + Math.floor(t * 2 + r.ph)) % 5);
      const ox = Math.round(Math.sin(t * 2.2 + r.ph + i * 1.7) * 2.5);
      const a = 0.32 + 0.18 * Math.sin(t * 3 + i + r.ph);
      g.fillStyle = rgb(255, 150, 60, a);
      g.fillRect(Math.round(r.x - cx - w / 2 + ox), Math.round(r.y - cy - 6 + i * 4), w, 1);
    }
  }
  // faróis, lanternas e sirenes
  for (const c of World.cars) {
    if (!inV(c.x, c.y, 30) || c.wreck) continue;
    const ca = Math.cos(c.angle), sa = Math.sin(c.angle);
    const on = c.mode === 'ai' || c.mode === 'police' || c.mode === 'player' || c.hasDriver;
    const braking = c.mode === 'ai' ? (c.ai && c.v < c.ai.cruise * 0.5) : (c.mode === 'player' && Input.down('down'));
    if (on) {
      for (const side of [-1, 1]) {
        const hx = c.x + ca * (c.len / 2) - sa * side * (c.wid / 2 - 2);
        const hy = c.y + sa * (c.len / 2) + ca * side * (c.wid / 2 - 2);
        g.drawImage(glowSprite(255, 240, 200, 5, 0.9), Math.round(hx - cx - 5), Math.round(hy - cy - 5));
        const tx = c.x - ca * (c.len / 2) - sa * side * (c.wid / 2 - 1.5);
        const ty = c.y - sa * (c.len / 2) + ca * side * (c.wid / 2 - 1.5);
        const r = braking ? 6 : 4;
        g.drawImage(glowSprite(255, 30, 40, r, braking ? 0.95 : 0.6), Math.round(tx - cx - r), Math.round(ty - cy - r));
      }
    }
    if (c.siren) {
      const ph = Math.floor(t * 8) % 2 === 0;
      g.drawImage(ph ? glowSprite(255, 40, 60, 12, 0.9) : glowSprite(60, 100, 255, 12, 0.9), Math.round(c.x - cx - 12), Math.round(c.y - cy - 12));
    }
  }
  // fogo e faíscas
  for (const q of World.particles) {
    if (q.type === 'smoke' || !inV(q.x, q.y, 10)) continue;
    const k = 1 - q.life / q.max;
    if (q.type === 'fire') {
      g.fillStyle = k > 0.5 ? rgb(255, 230, 120, k) : rgb(255, 120, 30, k);
      const s = Math.max(1, Math.round(q.size * (0.5 + k)));
      g.fillRect(Math.round(q.x - cx - s / 2), Math.round(q.y - cy - s / 2), s, s);
    } else if (q.type === 'spark') {
      g.fillStyle = rgb(255, 220, 120, k);
      g.fillRect(Math.round(q.x - cx), Math.round(q.y - cy), 1, 1);
    }
  }
  // barcos: luzes de navegação
  for (const b of [...City.boats, ...Game.movingBoats]) {
    if (!inV(b.x, b.y, 30)) continue;
    g.drawImage(glowSprite(255, 240, 200, 4, 0.8), Math.round(b.x - cx - 4), Math.round(b.y - cy - 4));
  }
  // orelhões tocando
  if (Game.state === 'playing' && Missions.available()) {
    for (const ph of City.phones) {
      if (!inV(ph.x, ph.y, 30)) continue;
      const pulse = (t * 1.2 + ph.ring) % 1;
      g.drawImage(glowSprite(255, 220, 60, 16, 0.9 * (1 - pulse)), Math.round(ph.x - cx - 16), Math.round(ph.y - cy - 16));
    }
  }

  /* ----- sobreposições (sem iluminação) ----- */
  g.globalCompositeOperation = 'source-over';
  if (Game.state === 'playing' || Game.state === 'paused') {
    if (tgt) drawTarget(g, tgt, cx, cy, t);
    if (Missions.available()) for (const ph of City.phones) if (inV(ph.x, ph.y, 20)) drawArrow(g, ph.x - cx, ph.y - cy - 14 + Math.round(Math.sin(t * 5) * 2), '#ffd84a');
    if (p.onFoot && p.alive) drawPlayerMarker(g, p.x - cx, p.y - cy, t);
    if (World.respawn) {
      const k = clamp(1 - Math.abs(World.respawn.t - 1.6) / 1.6, 0, 1);
      g.fillStyle = rgb(0, 0, 0, k * 0.9);
      g.fillRect(0, 0, vw, vh);
    }
  }
  if (Game.state === 'playing' || Game.state === 'paused') drawMinimap(t);
}

function signalHeads(n) {
  const out = [];
  if (n.exits[1]) out.push({ x: n.x1 + 3, y: n.y1 + 3, vertical: true });   // quem vem do sul (subindo)
  if (n.exits[3]) out.push({ x: n.x0 - 3, y: n.y0 - 3, vertical: true });   // quem vem do norte
  if (n.exits[2]) out.push({ x: n.x0 - 3, y: n.y1 + 3, vertical: false });  // quem vem do oeste
  if (n.exits[0]) out.push({ x: n.x1 + 3, y: n.y0 - 3, vertical: false });  // quem vem do leste
  return out;
}

function drawWater(g, cx, cy, t) {
  const tx0 = Math.max(0, Math.floor(cx / T)), tx1 = Math.min(MAP_W - 1, Math.floor((cx + Game.vw) / T));
  const ty0 = Math.max(0, Math.floor(cy / T)), ty1 = Math.min(MAP_H - 1, Math.floor((cy + Game.vh) / T));
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      if (tileAt(tx, ty) !== TL.WATER) continue;
      for (let k = 0; k < 2; k++) {
        const h = hash2(tx, ty, k);
        const s = Math.sin(t * 1.6 + h * 30);
        if (s < 0.4) continue;
        const x = tx * T + Math.floor(h * 13), y = ty * T + Math.floor(hash2(tx, ty, k + 9) * 15);
        g.fillStyle = s > 0.85 ? 'rgb(70,110,180)' : 'rgb(40,74,136)';
        g.fillRect(x - cx + Math.round(Math.sin(t + h * 9) * 1.5), y - cy, 3, 1);
      }
    }
  }
}

function boatSprite(b) {
  if (b.sprite) return b.sprite;
  const c = makeCanvas(b.len, b.wid);
  const x = ctx2d(c);
  const L = b.len, W = b.wid;
  const hull = b.c, dark = shade(hull, 0.65);
  x.fillStyle = rgb(...dark);
  x.fillRect(0, 1, L - 5, W - 2);
  for (let i = 0; i < 5; i++) x.fillRect(L - 5 + i, 1 + Math.floor(i * (W - 2) / 10), 1, W - 2 - 2 * Math.floor(i * (W - 2) / 10));
  x.fillStyle = rgb(...hull);
  x.fillRect(1, 2, L - 7, W - 4);
  for (let i = 0; i < 4; i++) x.fillRect(L - 6 + i, 2 + Math.floor(i * (W - 4) / 8), 1, W - 4 - 2 * Math.floor(i * (W - 4) / 8));
  x.fillStyle = 'rgb(120,86,56)';
  x.fillRect(3, 3, Math.floor(L * 0.3), W - 6);
  x.fillStyle = 'rgb(214,214,222)';
  x.fillRect(Math.floor(L * 0.42), 3, Math.floor(L * 0.22), W - 6);
  x.fillStyle = 'rgb(40,56,80)';
  x.fillRect(Math.floor(L * 0.42) + Math.floor(L * 0.22) - 2, 3, 2, W - 6);
  b.sprite = c;
  return c;
}

function drawBoats(g, cx, cy, t, inV) {
  for (const b of City.boats) {
    if (!inV(b.x, b.y, 30)) continue;
    const s = boatSprite(b);
    g.save();
    g.translate(Math.round(b.x - cx), Math.round(b.y - cy + Math.sin(t * 1.3 + b.ph) * 0.8));
    g.rotate(b.a + Math.sin(t * 0.9 + b.ph) * 0.03);
    g.drawImage(s, -b.len / 2, -b.wid / 2);
    g.restore();
  }
  // barcos navegando passam por baixo da ponte
  const by0 = (BRIDGE_Y - 1) * T - cy, by1 = (BRIDGE_Y + 5) * T - cy;
  for (const b of Game.movingBoats) {
    if (!inV(b.x, b.y, 40)) continue;
    const s = boatSprite(b);
    g.save();
    g.beginPath();
    g.rect(0, 0, Game.vw, Math.max(0, by0));
    g.rect(0, by1, Game.vw, Math.max(0, Game.vh - by1));
    g.clip();
    // rastro
    g.fillStyle = 'rgba(120,160,220,0.35)';
    const dir = Math.sign(b.vy);
    for (let i = 1; i < 6; i++) g.fillRect(Math.round(b.x - cx - i), Math.round(b.y - cy - dir * (b.len / 2 + i * 4)), 1 + i * 2 - i, 1);
    for (let i = 1; i < 6; i++) g.fillRect(Math.round(b.x - cx + i), Math.round(b.y - cy - dir * (b.len / 2 + i * 4)), 1, 1);
    g.translate(Math.round(b.x - cx), Math.round(b.y - cy));
    g.rotate(dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    g.drawImage(s, -b.len / 2, -b.wid / 2);
    g.restore();
  }
}

function drawPed(g, q, cx, cy) {
  let f;
  if (q.isPlayer) {
    f = q.downT > 0 ? 3 : q.punchT > 0 ? 1 : [0, 1, 0, 2][Math.floor(q.anim) % 4];
  } else if (q.state === 'down') f = 3;
  else if (q.state === 'curb') f = 0;
  else if (q.state === 'wait') f = Math.floor(q.wave * 6) % 2 ? 1 : 2;
  else f = [0, 1, 0, 2][Math.floor(q.anim) % 4];
  g.save();
  g.translate(Math.round(q.x - cx), Math.round(q.y - cy));
  g.rotate(q.angle);
  g.drawImage(q.frames[f], -4, -4);
  g.restore();
}

function drawArrow(g, x, y, color) {
  x = Math.round(x); y = Math.round(y);
  g.fillStyle = '#111';
  g.fillRect(x - 4, y - 5, 9, 3); g.fillRect(x - 3, y - 2, 7, 2); g.fillRect(x - 2, y, 5, 2); g.fillRect(x - 1, y + 2, 3, 2);
  g.fillStyle = color;
  g.fillRect(x - 3, y - 4, 7, 2); g.fillRect(x - 2, y - 2, 5, 2); g.fillRect(x - 1, y, 3, 2); g.fillRect(x, y + 2, 1, 1);
}

function drawPlayerMarker(g, x, y, t) {
  const b = Math.round(Math.sin(t * 6) * 1.5);
  g.fillStyle = '#111'; g.fillRect(Math.round(x) - 2, Math.round(y) - 12 + b, 5, 3);
  g.fillStyle = '#ffd84a'; g.fillRect(Math.round(x) - 1, Math.round(y) - 11 + b, 3, 1); g.fillRect(Math.round(x), Math.round(y) - 10 + b, 1, 1);
}

function drawTarget(g, tgt, cx, cy, t) {
  const x = tgt.x - cx, y = tgt.y - cy;
  const vw = Game.vw, vh = Game.vh;
  if (x > 8 && x < vw - 8 && y > 8 && y < vh - 8) {
    if (!tgt.car) {
      const r = (tgt.r || 16) * (0.7 + 0.3 * ((t * 1.5) % 1));
      g.fillStyle = 'rgba(255,216,74,0.9)';
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2 + t;
        g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 2, 2);
      }
    }
    drawArrow(g, x, y - (tgt.car ? 14 : 8) + Math.round(Math.sin(t * 5) * 2), '#ffd84a');
    return;
  }
  // seta na borda da tela
  const ccx = vw / 2, ccy = vh / 2;
  const a = Math.atan2(y - ccy, x - ccx);
  const m = 14;
  const k = Math.min((vw / 2 - m) / Math.abs(Math.cos(a) || 1e-6), (vh / 2 - m) / Math.abs(Math.sin(a) || 1e-6));
  const ex = Math.round(ccx + Math.cos(a) * k), ey = Math.round(ccy + Math.sin(a) * k);
  g.save();
  g.translate(ex, ey);
  g.rotate(a);
  g.fillStyle = '#111';
  for (let i = 0; i < 7; i++) g.fillRect(-4 + i, -(7 - i) + 1 - 1, 1, (7 - i) * 2 + 1);
  g.fillStyle = '#ffd84a';
  for (let i = 0; i < 6; i++) g.fillRect(-3 + i, -(6 - i) + 1, 1, (6 - i) * 2 - 1);
  g.restore();
  const d = Math.round(dist(World.player.x, World.player.y, tgt.x, tgt.y) / T * 4);
  g.font = '8px "Press Start 2P", monospace';
  g.textAlign = 'center';
  const lx = clamp(ex - Math.cos(a) * 18, 24, vw - 24), ly = clamp(ey - Math.sin(a) * 14 + 3, 12, vh - 6);
  g.fillStyle = '#000'; g.fillText(d + 'm', lx + 1, ly + 1);
  g.fillStyle = '#ffd84a'; g.fillText(d + 'm', lx, ly);
}

function drawMinimap(t) {
  Game.miniT--;
  if (Game.miniT > 0) return;
  Game.miniT = 2;
  const c = Game.hud.mini;
  if (!c) return;
  const g = Game.hud.miniCtx;
  g.drawImage(Art.minimap, 0, 0);
  g.strokeStyle = 'rgba(255,255,255,0.7)';
  g.lineWidth = 1;
  g.strokeRect(Math.floor(Game.cam.x / T) + 0.5, Math.floor(Game.cam.y / T) + 0.5, Math.ceil(Game.vw / T), Math.ceil(Game.vh / T));
  if (Missions.available()) { g.fillStyle = '#4cff7a'; for (const ph of City.phones) g.fillRect(Math.floor(ph.x / T) - 1, Math.floor(ph.y / T) - 1, 3, 3); }
  g.fillStyle = '#9dffb8';
  for (const k of World.pickups) g.fillRect(Math.floor(k.x / T), Math.floor(k.y / T), 1, 1);
  for (const o of World.cars) {
    if (!o.isPolice || o.mode !== 'police') continue;
    g.fillStyle = Math.floor(t * 6) % 2 ? '#ff3344' : '#4466ff';
    g.fillRect(Math.floor(o.x / T) - 1, Math.floor(o.y / T) - 1, 2, 2);
  }
  const tgt = Missions.target();
  if (tgt && Math.floor(t * 3) % 2 === 0) { g.fillStyle = '#ffd84a'; g.fillRect(Math.floor(tgt.x / T) - 2, Math.floor(tgt.y / T) - 2, 5, 5); }
  const p = World.player;
  g.fillStyle = '#000'; g.fillRect(Math.floor(p.x / T) - 2, Math.floor(p.y / T) - 2, 5, 5);
  g.fillStyle = '#fff'; g.fillRect(Math.floor(p.x / T) - 1, Math.floor(p.y / T) - 1, 3, 3);
  g.fillStyle = '#ffd84a'; g.fillRect(Math.floor(p.x / T + Math.cos(p.angle) * 2.5), Math.floor(p.y / T + Math.sin(p.angle) * 2.5), 1, 1);
}

/* ---------- HUD (HTML) ---------- */
function setText(el, key, v) { if (Game.hud['_' + key] !== v) { Game.hud['_' + key] = v; el.textContent = v; } }

function updateHUD() {
  const h = Game.hud, p = World.player;
  setText(h.money, 'money', formatMoney(p.money));
  const stars = wantedStars();
  if (h._stars !== stars) { h._stars = stars; h.stars.forEach((s, i) => s.classList.toggle('on', i < stars)); h.starsBox.classList.toggle('active', stars > 0); }
  const hp = Math.round(p.health);
  if (h._hp !== hp) { h._hp = hp; h.hp.style.width = hp + '%'; h.hp.classList.toggle('low', hp < 35); }
  const carHp = p.car ? Math.round(p.car.health) : -1;
  if (h._carHp !== carHp) {
    h._carHp = carHp;
    h.carRow.hidden = carHp < 0;
    if (carHp >= 0) { h.carHp.style.width = carHp + '%'; h.carHp.classList.toggle('low', carHp < 35); }
  }
  const m = Missions.active;
  if (m) {
    h.mission.hidden = false;
    setText(h.mTitle, 'mt', m.title);
    setText(h.mText, 'mx', m.steps[m.idx] ? m.steps[m.idx].text : '');
    if (m.timer !== null) {
      const s = Math.max(0, Math.ceil(m.timer));
      setText(h.mTime, 'mtime', `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
      h.mTime.classList.toggle('hurry', s <= 10);
    } else setText(h.mTime, 'mtime', '');
  } else if (!h.mission.hidden) h.mission.hidden = true;
  const dn = districtName(p.x, p.y);
  if (dn !== Game.district) { Game.district = dn; h.district.textContent = dn; h.district.classList.remove('flash'); void h.district.offsetWidth; h.district.classList.add('flash'); }
  setText(h.done, 'done', `MISSÕES ${Missions.done}`);
}

function setPaused(on) {
  if (on && Game.state === 'playing') { Game.state = 'paused'; document.getElementById('pause').hidden = false; Sound.setEngine(false, 0); Sound.setSiren(0, 0); }
  else if (!on && Game.state === 'paused') { Game.state = 'playing'; document.getElementById('pause').hidden = true; }
}

function toggleMute() {
  Sound.setMuted(!Sound.muted);
  document.querySelectorAll('[data-mute-label]').forEach((el) => (el.textContent = Sound.muted ? 'SOM: DESLIGADO' : 'SOM: LIGADO'));
  uiToast(Sound.muted ? 'SOM DESLIGADO' : 'SOM LIGADO');
}

function startPlaying(fresh) {
  Sound.init(); Sound.resume();
  if (fresh) newGame();
  document.getElementById('menu').hidden = true;
  document.getElementById('pause').hidden = true;
  document.getElementById('hud').hidden = false;
  Game.state = 'playing';
  Game.hud._stars = -1; Game.hud._hp = -1; Game.hud._carHp = -2;
  if (fresh) {
    uiBig('NOITE NA CIDADE', 'Atenda os orelhões amarelos para pegar missões. Um esportivo vermelho espera no estacionamento do parque.', 'mission', 4.5);
  }
}

function setupUI() {
  const $ = (id) => document.getElementById(id);
  const h = Game.hud;
  h.money = $('hud-money'); h.starsBox = $('hud-stars'); h.stars = [...document.querySelectorAll('#hud-stars .star')];
  h.hp = $('hud-hp'); h.carRow = $('hud-car'); h.carHp = $('hud-carhp');
  h.mission = $('hud-mission'); h.mTitle = $('m-title'); h.mText = $('m-text'); h.mTime = $('m-time');
  h.district = $('hud-district'); h.done = $('hud-done');
  h.mini = $('minimap'); h.mini.width = MAP_W; h.mini.height = MAP_H; h.miniCtx = ctx2d(h.mini);
  $('best').textContent = formatMoney(Game.best);

  $('btn-play').addEventListener('click', () => startPlaying(true));
  $('btn-resume').addEventListener('click', () => setPaused(false));
  $('btn-restart').addEventListener('click', () => { document.getElementById('pause').hidden = true; startPlaying(true); });
  $('btn-menu').addEventListener('click', () => {
    document.getElementById('pause').hidden = true; document.getElementById('hud').hidden = true;
    document.getElementById('menu').hidden = false; $('best').textContent = formatMoney(Game.best);
    Game.state = 'menu'; Sound.setEngine(false, 0); Sound.setSiren(0, 0);
  });
  document.querySelectorAll('[data-action="mute"]').forEach((b) => b.addEventListener('click', toggleMute));
  $('btn-pause').addEventListener('click', () => setPaused(true));
  window.addEventListener('blur', () => setPaused(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
  setupTouch();
}

function setupTouch() {
  const zone = document.getElementById('joy');
  const knob = document.getElementById('joy-knob');
  const touchUI = document.getElementById('touch');
  const enable = () => { document.body.classList.add('touch'); touchUI.hidden = false; };
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) enable();
  window.addEventListener('touchstart', enable, { once: true, passive: true });
  let jid = null, ox = 0, oy = 0;
  const R = 46;
  zone.addEventListener('pointerdown', (e) => {
    jid = e.pointerId; zone.setPointerCapture(jid);
    const r = zone.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2;
    moveJoy(e);
  });
  const moveJoy = (e) => {
    if (e.pointerId !== jid) return;
    let dx = e.clientX - ox, dy = e.clientY - oy;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    Input.touch.active = true;
    Input.touch.jx = dx / R; Input.touch.jy = dy / R;
  };
  zone.addEventListener('pointermove', moveJoy);
  const endJoy = (e) => {
    if (e.pointerId !== jid) return;
    jid = null; knob.style.transform = ''; Input.touch.active = false; Input.touch.jx = 0; Input.touch.jy = 0;
  };
  zone.addEventListener('pointerup', endJoy);
  zone.addEventListener('pointercancel', endJoy);
  document.querySelectorAll('[data-act]').forEach((b) => {
    const act = b.dataset.act;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); Input.pressAction(act); Input.touch.held.add(act); b.classList.add('down'); });
    const up = () => { Input.touch.held.delete(act); b.classList.remove('down'); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('load', () => {
    // pequena pausa para a tela de carregamento aparecer antes da geração da cidade
    setTimeout(() => {
      try { initGame(); }
      catch (err) {
        console.error(err);
        const l = document.getElementById('loading');
        if (l) l.textContent = 'Erro ao iniciar o jogo: ' + err.message;
      }
    }, 30);
  });
}
