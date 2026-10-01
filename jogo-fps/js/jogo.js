/* =====================================================================
   ZONA DE COMBATE 3D — FPS em primeira pessoa feito com Three.js
   Tudo (texturas, modelos, sons) é gerado por código: nenhum asset externo.
   ===================================================================== */
'use strict';
(function () {

// ---------------------------------------------------------------------
// MAPA  (#=parede  C=caixas  B=barril explosivo  P=jogador  E=spawn NPC)
// ---------------------------------------------------------------------
const MAP = [
  '############################',
  '#P.......#.........#.......#',
  '#........#....E....#...E...#',
  '#..CC....#.........#.......#',
  '#..C.........CC.......B....#',
  '#........#...CC....#..CC...#',
  '#........#.........#.......#',
  '####.#####.........####.####',
  '#........#....##...#.......#',
  '#..E.....#....##...#...C...#',
  '#...........B...........E..#',
  '#..C.....#.........#.......#',
  '#..C.....#...C.....#..CC...#',
  '#####.####.........####.####',
  '#..........................#',
  '#...CC.....##....##.....CC.#',
  '#...C...E...........E....C.#',
  '#.............B............#',
  '#....##....CC....CC....##..#',
  '#....##..........E.....##..#',
  '#.......B..................#',
  '############################',
];
const CELL = 4, WALL_H = 5, CRATE_S = 3.2, CRATE_H = 2.6, BARREL_R = 0.6, BARREL_H = 1.3;
const ROWS = MAP.length, COLS = MAP[0].length;

// ---------------------------------------------------------------------
// UTILITÁRIOS
// ---------------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------------
// GRADE / COLISÃO
// ---------------------------------------------------------------------
const grid = MAP.map((r) => r.split(''));
let playerSpawn = { x: 6, z: 6 };
const enemySpawns = [];
for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
  const c = grid[j][i];
  if (c === 'P') { playerSpawn = { x: (i + .5) * CELL, z: (j + .5) * CELL }; grid[j][i] = '.'; }
  if (c === 'E') { enemySpawns.push({ x: (i + .5) * CELL, z: (j + .5) * CELL }); grid[j][i] = '.'; }
}
const cellAt = (i, j) => (i < 0 || j < 0 || i >= COLS || j >= ROWS) ? '#' : grid[j][i];
const walkable = (i, j) => cellAt(i, j) === '.';

const boxes = [];   // boxes[j*COLS+i] => {minX,maxX,minZ,maxZ,h} | null
function buildBox(i, j) {
  const c = cellAt(i, j), cx = (i + .5) * CELL, cz = (j + .5) * CELL;
  let s, h;
  if (c === '#') { s = CELL / 2; h = WALL_H; }
  else if (c === 'C') { s = CRATE_S / 2; h = CRATE_H; }
  else if (c === 'B') { s = BARREL_R; h = BARREL_H; }
  else return null;
  return { minX: cx - s, maxX: cx + s, minZ: cz - s, maxZ: cz + s, h };
}
for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) boxes[j * COLS + i] = buildBox(i, j);
const boxAt = (i, j) => (i < 0 || j < 0 || i >= COLS || j >= ROWS) ? { minX: i * CELL, maxX: (i + 1) * CELL, minZ: j * CELL, maxZ: (j + 1) * CELL, h: 99 } : boxes[j * COLS + i];

// empurra um círculo (pos.x/pos.z, raio r) para fora dos blocos vizinhos
function collide(pos, r) {
  const ci = Math.floor(pos.x / CELL), cj = Math.floor(pos.z / CELL);
  for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
    const b = boxAt(ci + di, cj + dj);
    if (!b) continue;
    const nx = clamp(pos.x, b.minX, b.maxX), nz = clamp(pos.z, b.minZ, b.maxZ);
    const dx = pos.x - nx, dz = pos.z - nz, d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 > 1e-8) { const d = Math.sqrt(d2), p = r - d; pos.x += dx / d * p; pos.z += dz / d * p; }
      else { // centro dentro do bloco: sai pelo lado mais próximo
        const l = pos.x - b.minX, rr = b.maxX - pos.x, t = pos.z - b.minZ, bb = b.maxZ - pos.z, m = Math.min(l, rr, t, bb);
        if (m === l) pos.x = b.minX - r; else if (m === rr) pos.x = b.maxX + r; else if (m === t) pos.z = b.minZ - r; else pos.z = b.maxZ + r;
      }
    }
  }
}
// linha de visão por marcha na grade (para os NPCs)
function lineOfSight(ax, ay, az, bx, by, bz) {
  const dx = bx - ax, dy = by - ay, dz = bz - az, d = Math.hypot(dx, dz), steps = Math.ceil(d / 0.5);
  for (let s = 1; s < steps; s++) {
    const t = s / steps, x = ax + dx * t, y = ay + dy * t, z = az + dz * t;
    const b = boxAt(Math.floor(x / CELL), Math.floor(z / CELL));
    if (b && y < b.h && x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) return false;
  }
  return true;
}

// campo de fluxo (BFS a partir do jogador) — todos os NPCs usam para perseguir
const flow = new Int16Array(COLS * ROWS);
const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
function canStep(i, j, di, dj) {
  if (!walkable(i + di, j + dj)) return false;
  if (di && dj && (!walkable(i + di, j) || !walkable(i, j + dj))) return false;
  return true;
}
function computeFlow() {
  flow.fill(-1);
  const pi = Math.floor(player.pos.x / CELL), pj = Math.floor(player.pos.z / CELL);
  const q = [pi, pj]; flow[pj * COLS + pi] = 0;
  for (let h = 0; h < q.length; h += 2) {
    const i = q[h], j = q[h + 1], v = flow[j * COLS + i];
    for (const [di, dj] of N8) {
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= COLS || nj >= ROWS) continue;
      if (flow[nj * COLS + ni] !== -1 || !canStep(i, j, di, dj)) continue;
      flow[nj * COLS + ni] = v + 1; q.push(ni, nj);
    }
  }
}

// ---------------------------------------------------------------------
// RENDERIZAÇÃO
// ---------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.autoClear = false;
$('game').appendChild(renderer.domElement);
const canvas = renderer.domElement;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9aa3ad, 35, 130);
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.05, 400);
camera.rotation.order = 'YXZ';
scene.add(camera);

// cena separada para a arma (nunca atravessa paredes)
const gunScene = new THREE.Scene();
const gunCam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.01, 10);
gunScene.add(new THREE.HemisphereLight(0xdde6f0, 0x332a22, 1.6));
const gunSun = new THREE.DirectionalLight(0xfff0dd, 2.2); gunSun.position.set(1, 2, 1.5); gunScene.add(gunSun);

// ---------------------------------------------------------------------
// TEXTURAS PROCEDURAIS
// ---------------------------------------------------------------------
const maxAniso = renderer.capabilities.getMaxAnisotropy();
function canvasTex(size, draw, rx = 1, ry = 1, srgb = true) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = maxAniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function grain(g, s, amt) {
  const img = g.getImageData(0, 0, s, s), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
}
function stains(g, s, n, col) {
  for (let k = 0; k < n; k++) {
    const x = Math.random() * s, y = Math.random() * s, r = rand(8, s / 5);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}
const TEX = {
  floor: canvasTex(512, (g, s) => {
    g.fillStyle = '#5d6064'; g.fillRect(0, 0, s, s);
    stains(g, s, 14, 'rgba(30,30,30,.18)');
    grain(g, s, 26);
    g.strokeStyle = 'rgba(25,27,30,.85)'; g.lineWidth = 4;
    for (let k = 0; k <= 2; k++) { g.beginPath(); g.moveTo(k * s / 2, 0); g.lineTo(k * s / 2, s); g.stroke(); g.beginPath(); g.moveTo(0, k * s / 2); g.lineTo(s, k * s / 2); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 2;
    for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(k * s / 2 + 3, 0); g.lineTo(k * s / 2 + 3, s); g.stroke(); }
  }, COLS, ROWS),
  wall: canvasTex(512, (g, s) => {
    g.fillStyle = '#8a8377'; g.fillRect(0, 0, s, s);
    stains(g, s, 18, 'rgba(60,50,40,.22)');
    grain(g, s, 30);
    g.strokeStyle = 'rgba(40,36,30,.7)'; g.lineWidth = 3;
    for (let y = s / 4; y < s; y += s / 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); }
    for (let x = 0; x <= s; x += s / 2) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, s * .88); g.stroke(); }
    // faixa inferior com listras de perigo
    g.fillStyle = '#2b2b2b'; g.fillRect(0, s * .88, s, s * .12);
    g.save(); g.beginPath(); g.rect(0, s * .9, s, s * .08); g.clip();
    g.fillStyle = '#e0a526';
    for (let x = -s; x < s * 2; x += 40) { g.beginPath(); g.moveTo(x, s); g.lineTo(x + 20, s); g.lineTo(x + 60, s * .9); g.lineTo(x + 40, s * .9); g.fill(); }
    g.restore();
    // escorrido
    for (let k = 0; k < 10; k++) { const x = Math.random() * s; g.fillStyle = 'rgba(40,30,20,.12)'; g.fillRect(x, rand(0, s * .3), rand(2, 6), rand(40, 200)); }
  }),
  crate: canvasTex(256, (g, s) => {
    g.fillStyle = '#8c6a3c'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 32) { g.fillStyle = `rgba(0,0,0,${rand(.02, .12)})`; g.fillRect(0, y, s, 32); g.fillStyle = 'rgba(30,20,10,.5)'; g.fillRect(0, y, s, 2); }
    grain(g, s, 30);
    g.strokeStyle = '#4a3418'; g.lineWidth = 22; g.strokeRect(11, 11, s - 22, s - 22);
    g.beginPath(); g.moveTo(16, 16); g.lineTo(s - 16, s - 16); g.moveTo(s - 16, 16); g.lineTo(16, s - 16); g.lineWidth = 18; g.stroke();
    g.fillStyle = '#2a2a2a'; [[16, 16], [s - 16, 16], [16, s - 16], [s - 16, s - 16]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); });
  }),
  barrel: canvasTex(256, (g, s) => {
    g.fillStyle = '#a3261b'; g.fillRect(0, 0, s, s); grain(g, s, 30);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, s * .18, s, 10); g.fillRect(0, s * .78, s, 10);
    g.fillStyle = '#f2c230'; g.fillRect(0, s * .42, s, s * .16);
    g.fillStyle = '#111'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center';
    for (let x = s / 4; x < s; x += s / 2) g.fillText('⚠', x, s * .55);
  }),
  sky: canvasTex(512, (g, s) => {
    const gr = g.createLinearGradient(0, 0, 0, s);
    gr.addColorStop(0, '#1f3554'); gr.addColorStop(.38, '#5f7fa6'); gr.addColorStop(.5, '#d9b88f'); gr.addColorStop(.56, '#9aa3ad'); gr.addColorStop(1, '#55585c');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(255,255,255,${rand(.03, .09)})`; g.beginPath(); g.ellipse(Math.random() * s, rand(s * .15, s * .45), rand(30, 90), rand(4, 10), 0, 0, 7); g.fill(); }
  }),
  decal: canvasTex(64, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.35, 'rgba(20,18,15,.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  }),
  flash: canvasTex(128, (g, s) => {
    const c = s / 2; g.translate(c, c);
    for (let k = 0; k < 7; k++) { g.rotate(Math.PI * 2 / 7); g.fillStyle = 'rgba(255,200,90,.85)'; g.beginPath(); g.moveTo(-6, 0); g.lineTo(0, -c * rand(.6, 1)); g.lineTo(6, 0); g.fill(); }
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, c * .55);
    gr.addColorStop(0, 'rgba(255,255,230,1)'); gr.addColorStop(.4, 'rgba(255,190,80,.9)'); gr.addColorStop(1, 'rgba(255,120,20,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, c * .55, 0, 7); g.fill();
  }),
};
TEX.decal.wrapS = TEX.decal.wrapT = THREE.ClampToEdgeWrapping;

// ---------------------------------------------------------------------
// CENÁRIO
// ---------------------------------------------------------------------
const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.MeshBasicMaterial({ map: TEX.sky, side: THREE.BackSide, fog: false, depthWrite: false }));
scene.add(sky);

scene.add(new THREE.HemisphereLight(0xb8c8dc, 0x4a4036, 1.1));
const sun = new THREE.DirectionalLight(0xffe0b5, 2.6);
const MW = COLS * CELL, MH = ROWS * CELL;
sun.position.set(MW / 2 + 40, 70, MH / 2 + 25);
sun.target.position.set(MW / 2, 0, MH / 2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -75, right: 75, top: 75, bottom: -75, near: 10, far: 200 });
sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

const levelMeshes = [];
const floor = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), new THREE.MeshStandardMaterial({ map: TEX.floor, roughness: .92, metalness: .05 }));
floor.rotation.x = -Math.PI / 2; floor.position.set(MW / 2, 0, MH / 2); floor.receiveShadow = true;
scene.add(floor); levelMeshes.push(floor);

function buildInstanced(char, geo, mat, yPos) {
  const list = [];
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) if (grid[j][i] === char) list.push([i, j]);
  const im = new THREE.InstancedMesh(geo, mat, list.length);
  const m = new THREE.Matrix4();
  list.forEach(([i, j], k) => { m.makeTranslation((i + .5) * CELL, yPos, (j + .5) * CELL); im.setMatrixAt(k, m); });
  im.castShadow = im.receiveShadow = true; im.frustumCulled = false;
  im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere();
  scene.add(im); levelMeshes.push(im);
  return im;
}
buildInstanced('#', new THREE.BoxGeometry(CELL, WALL_H, CELL), new THREE.MeshStandardMaterial({ map: TEX.wall, roughness: .88, metalness: .05 }), WALL_H / 2);
buildInstanced('C', new THREE.BoxGeometry(CRATE_S, CRATE_H, CRATE_S), new THREE.MeshStandardMaterial({ map: TEX.crate, roughness: .8 }), CRATE_H / 2);

// barris explosivos
const barrels = [];
const barrelGeo = new THREE.CylinderGeometry(BARREL_R, BARREL_R, BARREL_H, 20);
const barrelMat = new THREE.MeshStandardMaterial({ map: TEX.barrel, roughness: .5, metalness: .4 });
function spawnBarrels() {
  barrels.forEach((b) => scene.remove(b.mesh));
  barrels.length = 0;
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) if (MAP[j][i] === 'B') {
    grid[j][i] = 'B'; boxes[j * COLS + i] = buildBox(i, j);
    const mesh = new THREE.Mesh(barrelGeo, barrelMat);
    mesh.position.set((i + .5) * CELL, BARREL_H / 2, (j + .5) * CELL);
    mesh.castShadow = mesh.receiveShadow = true;
    const b = { mesh, i, j, alive: true };
    mesh.userData.barrel = b;
    scene.add(mesh); barrels.push(b);
  }
}

// ---------------------------------------------------------------------
// ÁUDIO (sintetizado com WebAudio)
// ---------------------------------------------------------------------
const Sfx = {
  ctx: null, master: null, noise: null,
  init() {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = .55; this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate; this.noise = this.ctx.createBuffer(1, len, len);
    const d = this.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  },
  out(vol, pan) {
    const g = this.ctx.createGain(); g.gain.value = vol;
    if (pan && this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p); p.connect(this.master); }
    else g.connect(this.master);
    return g;
  },
  burst(dur, freq, vol, pan, type = 'lowpass', q = .7) {
    const c = this.ctx, t = c.currentTime, src = c.createBufferSource(); src.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    src.loop = true; src.connect(f); f.connect(g); g.connect(this.out(vol, pan)); src.start(t, Math.random() * .5); src.stop(t + dur);
  },
  tone(f0, f1, dur, vol, type = 'sine', pan, delay = 0) {
    const c = this.ctx, t = c.currentTime + delay, o = c.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g); g.connect(this.out(1, pan)); o.start(t); o.stop(t + dur);
  },
  play(name, vol = 1, pan = 0) {
    if (!this.ctx) return;
    switch (name) {
      case 'pistol': this.burst(.18, 2600, .9 * vol, pan); this.tone(160, 50, .12, .6 * vol, 'sine', pan); break;
      case 'rifle': this.burst(.14, 3400, .8 * vol, pan); this.tone(130, 45, .1, .55 * vol, 'sine', pan); break;
      case 'shotgun': this.burst(.42, 1500, 1.2 * vol, pan); this.tone(90, 30, .3, .9 * vol, 'sine', pan); break;
      case 'enemy': this.burst(.16, 1900, .55 * vol, pan, 'bandpass', 1.2); this.tone(420, 120, .08, .15 * vol, 'square', pan); break;
      case 'hit': this.tone(1300, 900, .05, .25 * vol, 'square'); break;
      case 'head': this.tone(1800, 1700, .12, .3 * vol, 'triangle'); this.tone(2400, 2300, .1, .2 * vol, 'triangle', 0, .04); break;
      case 'kill': this.tone(600, 300, .25, .3 * vol, 'sawtooth'); break;
      case 'empty': this.tone(1800, 1500, .03, .2 * vol, 'square'); break;
      case 'reload': this.tone(700, 500, .05, .25, 'square', 0, 0); this.tone(500, 350, .06, .25, 'square', 0, .35); this.burst(.06, 4000, .3, 0, 'highpass'); break;
      case 'pickup': [520, 660, 880].forEach((f, k) => this.tone(f, f, .12, .25, 'triangle', 0, k * .07)); break;
      case 'hurt': this.tone(140, 60, .22, .7, 'sine'); this.burst(.12, 600, .4); break;
      case 'boom': this.burst(1.3, 500, 1.6 * vol, pan); this.tone(80, 25, 1.0, 1.2 * vol, 'sine', pan); break;
      case 'wave': [330, 440, 554, 660].forEach((f, k) => this.tone(f, f, .25, .2, 'sawtooth', 0, k * .12)); break;
      case 'step': this.burst(.05, 500, .12 * vol); break;
      case 'robot': this.tone(rand(180, 260), rand(80, 120), .3, .18 * vol, 'sawtooth', pan); break;
    }
  },
};

// ---------------------------------------------------------------------
// JOGADOR
// ---------------------------------------------------------------------
const player = {
  pos: V3(), vel: V3(), vy: 0, onGround: true, yaw: 0, pitch: 0,
  hp: 100, maxHp: 100, radius: .4, eye: 1.7, bob: 0, stepT: 0,
  score: 0, kills: 0, headshots: 0, shots: 0, hits: 0,
};
const keys = {};
let sens = parseFloat(localStorage.getItem('zc3d-sens') || '1.6');
let mouseDown = false, triggerReleased = true, adsHeld = false, ads = 0;
let swayX = 0, swayY = 0;

// ---------------------------------------------------------------------
// ARMAS (modelos feitos de primitivas)
// ---------------------------------------------------------------------
const WEAPONS = [
  { name: 'PISTOLA', dmg: 34, rate: .2, mag: 12, reserve: Infinity, reload: 1.1, spread: .012, pellets: 1, auto: false, recoil: .022, kick: .05, sound: 'pistol', adsY: -0.072, range: 1 },
  { name: 'FUZIL', dmg: 26, rate: .095, mag: 30, reserve: 150, reload: 1.8, spread: .022, pellets: 1, auto: true, recoil: .014, kick: .03, sound: 'rifle', adsY: -0.112, range: 1 },
  { name: 'ESCOPETA', dmg: 17, rate: .85, mag: 6, reserve: 30, reload: 2.2, spread: .085, pellets: 9, auto: false, recoil: .07, kick: .14, sound: 'shotgun', adsY: -0.052, range: .5 },
];
const wState = WEAPONS.map((w) => ({ ammo: w.mag, reserve: w.reserve }));
let curW = 0, fireT = 0, reloadT = 0, switchT = 0, recoilKick = 0, recoilRot = 0;

const gm = {
  metal: new THREE.MeshStandardMaterial({ color: 0x4a515a, metalness: .3, roughness: .45 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x2a2e34, metalness: .25, roughness: .6 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x6b4526, roughness: .7 }),
  tan: new THREE.MeshStandardMaterial({ color: 0x6d6450, roughness: .8 }),
  glove: new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: .9 }),
  sleeve: new THREE.MeshStandardMaterial({ color: 0x4b5340, roughness: .95 }),
  lens: new THREE.MeshBasicMaterial({ color: 0xff2a2a }),
};
function bx(w, h, d, mat, x, y, z, rx = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.x = rx; return m; }
function cyl(r, len, mat, x, y, z) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); return m; }
function arms(g, gripZ) {
  g.add(bx(.075, .08, .09, gm.glove, 0, -.1, gripZ));
  g.add(bx(.09, .09, .42, gm.sleeve, .02, -.14, gripZ + .24, -.25));
}
function makeFlash(z, y) {
  const mat = new THREE.MeshBasicMaterial({ map: TEX.flash, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const f = new THREE.Group();
  const p1 = new THREE.Mesh(new THREE.PlaneGeometry(.22, .22), mat); f.add(p1);
  const p2 = new THREE.Mesh(new THREE.PlaneGeometry(.12, .3), mat); p2.rotation.y = Math.PI / 2; p2.position.z = -.08; f.add(p2);
  const p3 = p2.clone(); p3.rotation.set(0, Math.PI / 2, Math.PI / 2); f.add(p3);
  f.position.set(0, y, z); f.visible = false; return f;
}
function buildPistol() {
  const g = new THREE.Group();
  g.add(bx(.06, .065, .3, gm.metal, 0, .03, -.1));
  g.add(bx(.055, .05, .26, gm.dark, 0, -.015, -.08));
  g.add(bx(.052, .15, .075, gm.dark, 0, -.1, .02, .22));
  g.add(bx(.012, .015, .012, gm.dark, 0, .07, -.24));
  g.add(bx(.03, .015, .012, gm.dark, 0, .07, .03));
  arms(g, .03);
  g.userData.flash = makeFlash(-.3, .03); g.add(g.userData.flash);
  return g;
}
function buildRifle() {
  const g = new THREE.Group();
  g.add(bx(.075, .1, .44, gm.metal, 0, 0, -.08));
  g.add(bx(.085, .085, .26, gm.tan, 0, -.005, -.42));
  g.add(cyl(.016, .32, gm.dark, 0, .01, -.66));
  g.add(cyl(.026, .07, gm.dark, 0, .01, -.83));
  g.add(bx(.055, .2, .085, gm.dark, 0, -.14, -.12, .22));
  g.add(bx(.055, .1, .26, gm.tan, 0, -.025, .24));
  g.add(bx(.048, .13, .06, gm.dark, 0, -.1, .06, .3));
  g.add(bx(.03, .03, .2, gm.dark, 0, .065, -.12));
  g.add(cyl(.028, .16, gm.dark, 0, .11, -.1));
  const glass = new THREE.Mesh(new THREE.CircleGeometry(.024, 20), new THREE.MeshBasicMaterial({ color: 0x0c1418, transparent: true, opacity: .35 })); glass.position.set(0, .11, -.019); g.add(glass);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(.0028, 12), gm.lens); lens.position.set(0, .11, -.017); g.add(lens);
  arms(g, .07);
  g.add(bx(.07, .07, .1, gm.glove, -.005, -.06, -.42));
  g.userData.flash = makeFlash(-.9, .01); g.add(g.userData.flash);
  return g;
}
function buildShotgun() {
  const g = new THREE.Group();
  g.add(cyl(.024, .62, gm.metal, 0, .02, -.38));
  g.add(cyl(.02, .5, gm.dark, 0, -.028, -.32));
  g.add(bx(.07, .06, .17, gm.wood, 0, -.03, -.42));
  g.add(bx(.08, .1, .26, gm.dark, 0, 0, .0));
  g.add(bx(.065, .11, .3, gm.wood, 0, -.04, .26, -.08));
  g.add(bx(.01, .015, .01, gm.lens, 0, .05, -.66));
  arms(g, .08);
  g.userData.flash = makeFlash(-.72, .02); g.add(g.userData.flash);
  return g;
}
const gunRig = new THREE.Group(); gunScene.add(gunRig);
const gunModels = [buildPistol(), buildRifle(), buildShotgun()];
gunModels.forEach((m, i) => { m.visible = i === 0; gunRig.add(m); });
const HIP = V3(.22, -.2, -.48);

// luz do disparo no mundo
const muzzleLight = new THREE.PointLight(0xffb060, 0, 12, 2);
muzzleLight.position.set(.2, -.1, -.8); camera.add(muzzleLight);

// ---------------------------------------------------------------------
// EFEITOS: faíscas, marcas de bala, traçantes, explosões
// ---------------------------------------------------------------------
const sparkGeo = new THREE.BoxGeometry(.05, .05, .05);
const sparkMats = { fire: new THREE.MeshBasicMaterial({ color: 0xffb040 }), dust: new THREE.MeshBasicMaterial({ color: 0x9a9080 }), oil: new THREE.MeshBasicMaterial({ color: 0x30ffd0 }), smoke: new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: .6 }) };
const sparks = [];
function spawnSparks(p, n, kind, speed = 4, life = .4) {
  for (let k = 0; k < n; k++) {
    let s = sparks.find((x) => x.life <= 0);
    if (!s) { if (sparks.length > 300) return; s = { mesh: new THREE.Mesh(sparkGeo, sparkMats.fire), vel: V3(), life: 0 }; scene.add(s.mesh); sparks.push(s); }
    s.mesh.material = sparkMats[kind]; s.mesh.visible = true; s.mesh.position.copy(p);
    s.vel.set(rand(-1, 1), rand(.2, 1.4), rand(-1, 1)).normalize().multiplyScalar(speed * rand(.4, 1.2));
    s.life = s.max = life * rand(.6, 1.3); s.grav = kind === 'smoke' ? -2 : 14;
    s.mesh.scale.setScalar(kind === 'smoke' ? 6 : 1);
  }
}
function updateSparks(dt) {
  for (const s of sparks) {
    if (s.life <= 0) continue;
    s.life -= dt; s.vel.y -= s.grav * dt; s.mesh.position.addScaledVector(s.vel, dt);
    if (s.mesh.position.y < .02) { s.mesh.position.y = .02; s.vel.y *= -.3; s.vel.x *= .6; s.vel.z *= .6; }
    s.mesh.scale.multiplyScalar(s.grav < 0 ? 1 + dt : 1 - dt * 1.5);
    if (s.life <= 0) s.mesh.visible = false;
  }
}
const decalMat = new THREE.MeshBasicMaterial({ map: TEX.decal, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
const decalGeo = new THREE.PlaneGeometry(.18, .18);
const decals = []; let decalIdx = 0;
function addDecal(p, n) {
  let d = decals[decalIdx];
  if (!d) { d = new THREE.Mesh(decalGeo, decalMat); scene.add(d); decals[decalIdx] = d; }
  decalIdx = (decalIdx + 1) % 90;
  d.position.copy(p).addScaledVector(n, .012);
  d.lookAt(p.clone().add(n)); d.rotateZ(Math.random() * 6); d.scale.setScalar(rand(.7, 1.3));
}
const tracers = [];
function addTracer(a, b, color = 0xffe0a0) {
  let t = tracers.find((x) => x.life <= 0);
  if (!t) {
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    t = { line: new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true })), life: 0 };
    scene.add(t.line); tracers.push(t);
  }
  const arr = t.line.geometry.attributes.position.array;
  arr[0] = a.x; arr[1] = a.y; arr[2] = a.z; arr[3] = b.x; arr[4] = b.y; arr[5] = b.z;
  t.line.geometry.attributes.position.needsUpdate = true; t.line.geometry.computeBoundingSphere();
  t.line.material.color.set(color); t.life = .07; t.line.visible = true;
}
function updateTracers(dt) {
  for (const t of tracers) { if (t.life <= 0) continue; t.life -= dt; t.line.material.opacity = Math.max(0, t.life / .07); if (t.life <= 0) t.line.visible = false; }
}
const boomLight = new THREE.PointLight(0xff8030, 0, 30, 2); scene.add(boomLight);
const booms = [];
const boomGeo = new THREE.SphereGeometry(1, 20, 14);
function explode(p) {
  Sfx.play('boom', clamp(1.3 - p.distanceTo(player.pos) / 50, .3, 1.3), panFor(p));
  const m = new THREE.Mesh(boomGeo, new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 1 }));
  m.position.copy(p); scene.add(m); booms.push({ m, t: 0 });
  boomLight.position.copy(p).y += 1.5; boomLight.intensity = 400;
  spawnSparks(p, 40, 'fire', 12, .9); spawnSparks(p, 14, 'smoke', 2, 1.6);
  const R = 7;
  for (const e of enemies) if (!e.dead) { const d = e.pos.distanceTo(p); if (d < R) e.hurt(160 * (1 - d / R) + 20, false, true); }
  const dp = Math.hypot(player.pos.x - p.x, player.pos.z - p.z);
  if (dp < R) damagePlayer(75 * (1 - dp / R), p);
  shake = Math.max(shake, clamp(1 - dp / 30, 0, 1) * .6);
  for (const b of barrels) if (b.alive) { const d = b.mesh.position.distanceTo(p); if (d > .1 && d < 5.5) setTimeout(() => detonate(b), 120 + Math.random() * 150); }
}
function detonate(b) {
  if (!b.alive) return;
  b.alive = false; scene.remove(b.mesh);
  grid[b.j][b.i] = '.'; boxes[b.j * COLS + b.i] = null;
  explode(b.mesh.position.clone().setY(.7));
  player.score += 25;
}
function updateBooms(dt) {
  for (let k = booms.length - 1; k >= 0; k--) {
    const b = booms[k]; b.t += dt;
    b.m.scale.setScalar(1 + b.t * 14); b.m.material.opacity = Math.max(0, 1 - b.t * 2.4);
    b.m.material.color.setHSL(.08 - b.t * .1, 1, .55 - b.t * .3);
    if (b.t > .45) { scene.remove(b.m); b.m.material.dispose(); booms.splice(k, 1); }
  }
  boomLight.intensity *= Math.pow(.004, dt);
}

// ---------------------------------------------------------------------
// INIMIGOS NPC (robôs soldados)
// ---------------------------------------------------------------------
const TYPES = {
  soldado: { name: 'Soldado', hp: 100, speed: 3.3, dmg: 8, fire: [1.0, 1.8], acc: .55, pref: 14, color: 0x8a9a5e, scale: 1, score: 100 },
  corredor: { name: 'Corredor', hp: 60, speed: 6.2, dmg: 5, fire: [.45, .8], acc: .42, pref: 6, color: 0xc4523a, scale: .9, score: 150 },
  pesado: { name: 'Pesado', hp: 280, speed: 2.2, dmg: 15, fire: [1.5, 2.3], acc: .62, pref: 11, color: 0x6a7588, scale: 1.28, score: 250 },
};
const enemies = [];
let hitTargets = [];
const jointMat = new THREE.MeshStandardMaterial({ color: 0x33363c, metalness: .6, roughness: .5 });
const enemyFlashMat = new THREE.MeshBasicMaterial({ map: TEX.flash, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });

class Enemy {
  constructor(typeKey, x, z, hpMul) {
    const T = this.T = TYPES[typeKey];
    this.hp = this.maxHp = T.hp * hpMul;
    this.dead = false; this.deathT = 0; this.flashT = 0; this.muzzleT = 0;
    this.cool = rand(1, 2); this.alert = 0; this.state = 'patrol';
    this.target = null; this.targetT = 0; this.strafe = Math.random() < .5 ? 1 : -1; this.strafeT = rand(1, 3);
    this.walk = Math.random() * 6; this.lastSeen = V3();
    this.parts = [];
    this.bodyMat = new THREE.MeshStandardMaterial({ color: T.color, metalness: .45, roughness: .55, emissive: 0x000000 });
    this.visorMat = new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xff2a1a, emissiveIntensity: 3 });
    const g = this.group = new THREE.Group();
    const inner = this.inner = new THREE.Group(); inner.scale.setScalar(T.scale); g.add(inner);
    const add = (parent, mesh, head = false) => { mesh.castShadow = true; mesh.userData.enemy = this; mesh.userData.head = head; parent.add(mesh); this.parts.push(mesh); return mesh; };
    // pernas
    this.legs = [-1, 1].map((s) => {
      const piv = new THREE.Group(); piv.position.set(.15 * s, .95, 0); inner.add(piv);
      add(piv, bx(.19, .5, .22, this.bodyMat, 0, -.25, 0));
      add(piv, bx(.17, .45, .2, jointMat, 0, -.7, 0));
      add(piv, bx(.2, .08, .32, jointMat, 0, -.92, .05));
      return piv;
    });
    add(inner, bx(.5, .22, .3, jointMat, 0, 1.0, 0));
    this.torso = add(inner, bx(.62, .62, .38, this.bodyMat, 0, 1.42, 0));
    add(inner, bx(.5, .3, .1, jointMat, 0, 1.5, .22));
    add(inner, bx(.4, .4, .2, jointMat, 0, 1.4, -.27)); // mochila
    add(inner, bx(.14, .1, .14, jointMat, 0, 1.78, 0));
    this.head = add(inner, bx(.36, .32, .36, this.bodyMat, 0, 1.96, 0), true);
    add(inner, bx(.3, .07, .03, this.visorMat, 0, 1.98, .185), true);
    add(inner, bx(.03, .22, .03, jointMat, .12, 2.2, -.1), true); // antena
    // braços segurando a arma
    this.arms = [-1, 1].map((s) => {
      const piv = new THREE.Group(); piv.position.set(.4 * s, 1.66, 0); piv.rotation.x = -1.3; piv.rotation.z = s * -.25; inner.add(piv);
      add(piv, bx(.17, .55, .17, this.bodyMat, 0, -.27, 0));
      return piv;
    });
    const gun = new THREE.Group(); gun.position.set(0, 1.5, .55); inner.add(gun);
    add(gun, bx(.09, .13, .62, jointMat, 0, 0, 0));
    add(gun, bx(.06, .16, .08, jointMat, 0, -.12, -.05));
    this.flash = new THREE.Mesh(new THREE.PlaneGeometry(.5, .5), enemyFlashMat);
    this.flash.position.set(0, 0, .45); this.flash.visible = false; gun.add(this.flash);
    this.flash2 = this.flash.clone(); this.flash2.rotation.y = Math.PI / 2; this.flash2.position.z = .55; gun.add(this.flash2);
    g.position.set(x, 0, z);
    this.pos = g.position;
    scene.add(g);
  }
  get eyeY() { return 1.95 * this.T.scale; }
  hurt(dmg, head, silent) {
    if (this.dead) return false;
    this.hp -= dmg; this.flashT = .09; this.alert = 6;
    this.lastSeen.copy(player.pos);
    if (this.hp <= 0) { this.die(head); return true; }
    if (!silent && Math.random() < .3) Sfx.play('robot', .8, panFor(this.pos));
    return false;
  }
  die(head) {
    this.dead = true; this.deathT = 0;
    this.visorMat.emissiveIntensity = 0;
    this.flash.visible = this.flash2.visible = false;
    hitTargets = hitTargets.filter((m) => m.userData.enemy !== this);
    player.kills++; player.score += this.T.score + (head ? 50 : 0); if (head) player.headshots++;
    killFeed(`Você eliminou <b>${this.T.name}</b>${head ? ' — TIRO NA CABEÇA' : ''}`, head);
    Sfx.play('kill');
    spawnSparks(this.pos.clone().setY(1.4), 18, 'oil', 5, .6);
    spawnSparks(this.pos.clone().setY(1.4), 10, 'fire', 6, .4);
    if (Math.random() < .5) spawnPickup(this.pos.x, this.pos.z);
  }
  moveToward(tx, tz, speed, dt) {
    const dx = tx - this.pos.x, dz = tz - this.pos.z, d = Math.hypot(dx, dz);
    if (d < .05) return 0;
    const s = Math.min(d, speed * dt);
    this.pos.x += dx / d * s; this.pos.z += dz / d * s;
    return s;
  }
  update(dt) {
    if (this.dead) {
      this.deathT += dt;
      const t = Math.min(this.deathT / .45, 1);
      this.group.rotation.x = -Math.PI / 2 * (t * t);
      this.group.position.y = this.deathT > 3 ? -(this.deathT - 3) * .6 : 0;
      return this.deathT > 5;
    }
    if (this.flashT > 0) { this.flashT -= dt; this.bodyMat.emissive.setScalar(this.flashT > 0 ? .7 : 0); }
    if (this.muzzleT > 0) { this.muzzleT -= dt; if (this.muzzleT <= 0) this.flash.visible = this.flash2.visible = false; }

    const T = this.T, px = player.pos.x, pz = player.pos.z;
    const dx = px - this.pos.x, dz = pz - this.pos.z, dist = Math.hypot(dx, dz);
    const sees = dist < 48 && lineOfSight(this.pos.x, this.eyeY, this.pos.z, px, player.pos.y + player.eye - .2, pz);
    if (sees) { this.alert = 5; this.lastSeen.copy(player.pos); }
    else this.alert -= dt;

    let moved = 0, faceX = 0, faceZ = 0;
    const spd = T.speed;
    if (sees && dist < 34) {
      // ---- COMBATE ----
      faceX = dx; faceZ = dz;
      this.strafeT -= dt; if (this.strafeT <= 0) { this.strafe *= -1; this.strafeT = rand(1, 2.8); }
      const nx = dx / dist, nz = dz / dist;
      let mx = -nz * this.strafe * .7, mz = nx * this.strafe * .7;
      if (dist > T.pref + 3) { mx += nx; mz += nz; } else if (dist < T.pref - 3) { mx -= nx; mz -= nz; }
      const ml = Math.hypot(mx, mz) || 1;
      const sp = spd * .75;
      this.pos.x += mx / ml * sp * dt; this.pos.z += mz / ml * sp * dt; moved = sp * dt;
      this.cool -= dt;
      if (this.cool <= 0 && state === 'playing') { this.shoot(dist); this.cool = rand(T.fire[0], T.fire[1]); }
    } else if (this.alert > 0) {
      // ---- PERSEGUIÇÃO pelo campo de fluxo ----
      const ci = Math.floor(this.pos.x / CELL), cj = Math.floor(this.pos.z / CELL);
      let bv = flow[cj * COLS + ci]; if (bv < 0) bv = 9999;
      let ti = -1, tj = -1;
      for (const [di, dj] of N8) {
        if (!canStep(ci, cj, di, dj)) continue;
        const v = flow[(cj + dj) * COLS + ci + di];
        if (v >= 0 && v < bv) { bv = v; ti = ci + di; tj = cj + dj; }
      }
      let tx = px, tz = pz;
      if (ti >= 0 && bv > 0) { tx = (ti + .5) * CELL; tz = (tj + .5) * CELL; }
      faceX = tx - this.pos.x; faceZ = tz - this.pos.z;
      moved = this.moveToward(tx, tz, spd, dt);
      this.cool = Math.min(this.cool, .6);
    } else {
      // ---- PATRULHA ----
      this.targetT -= dt;
      if (!this.target || this.targetT <= 0 || Math.hypot(this.target.x - this.pos.x, this.target.z - this.pos.z) < .4) {
        const ci = Math.floor(this.pos.x / CELL), cj = Math.floor(this.pos.z / CELL);
        for (let tries = 0; tries < 12; tries++) {
          const ti = ci + Math.round(rand(-4, 4)), tj = cj + Math.round(rand(-4, 4));
          if (!walkable(ti, tj)) continue;
          const tx = (ti + .5) * CELL, tz = (tj + .5) * CELL;
          if (lineOfSight(this.pos.x, 1, this.pos.z, tx, 1, tz)) { this.target = { x: tx, z: tz }; break; }
        }
        this.targetT = rand(3, 6);
      }
      if (this.target) { faceX = this.target.x - this.pos.x; faceZ = this.target.z - this.pos.z; moved = this.moveToward(this.target.x, this.target.z, spd * .45, dt); }
    }
    // separação entre NPCs e do jogador
    for (const o of enemies) {
      if (o === this || o.dead) continue;
      const ox = this.pos.x - o.pos.x, oz = this.pos.z - o.pos.z, d = Math.hypot(ox, oz), min = .5 * (T.scale + o.T.scale);
      if (d < min && d > 1e-4) { const p = (min - d) * .5; this.pos.x += ox / d * p; this.pos.z += oz / d * p; }
    }
    if (dist < .9 && dist > 1e-4) { const p = .9 - dist; this.pos.x -= dx / dist * p; this.pos.z -= dz / dist * p; }
    collide(this.pos, .38 * T.scale);

    // orientação e animação
    if (faceX || faceZ) {
      const want = Math.atan2(faceX, faceZ);
      let diff = want - this.group.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.group.rotation.y += diff * Math.min(1, dt * 10);
    }
    this.walk += moved * 3.2 / T.scale;
    const sw = moved > 0.001 ? Math.sin(this.walk) * .6 : 0;
    this.legs[0].rotation.x = lerp(this.legs[0].rotation.x, sw, .3);
    this.legs[1].rotation.x = lerp(this.legs[1].rotation.x, -sw, .3);
    this.inner.position.y = moved > .001 ? Math.abs(Math.cos(this.walk)) * .05 : 0;
    return false;
  }
  shoot(dist) {
    const T = this.T;
    const speed = Math.hypot(player.vel.x, player.vel.z);
    let acc = T.acc * clamp(1.25 - dist / 38, .25, 1) * (speed > 7 ? .6 : speed > 1 ? .85 : 1);
    if (!player.onGround) acc *= .7;
    const hit = Math.random() < acc;
    this.flash.visible = this.flash2.visible = true; this.muzzleT = .06;
    this.flash.rotation.z = Math.random() * 6;
    const from = V3(); this.flash.getWorldPosition(from);
    const to = V3(player.pos.x, player.pos.y + player.eye - .35, player.pos.z);
    if (!hit) to.add(V3(rand(-1.2, 1.2), rand(-.6, .9), rand(-1.2, 1.2)));
    addTracer(from, to, 0xff7050);
    Sfx.play('enemy', clamp(1.1 - dist / 55, .15, 1), panFor(this.pos));
    if (hit) damagePlayer(T.dmg * (1 + (wave.n - 1) * .06) * rand(.85, 1.15), this.pos);
    else if (Math.random() < .5) spawnSparks(V3(to.x, Math.max(.05, to.y * .1), to.z), 3, 'dust', 2, .3);
  }
  remove() { scene.remove(this.group); this.bodyMat.dispose(); this.visorMat.dispose(); }
}

// ---------------------------------------------------------------------
// ITENS (vida / munição)
// ---------------------------------------------------------------------
const pickups = [];
const pickGeo = new THREE.BoxGeometry(.55, .4, .55);
const pickMats = {
  health: new THREE.MeshStandardMaterial({ color: 0xeeeeee, emissive: 0x22ff66, emissiveIntensity: .6 }),
  ammo: new THREE.MeshStandardMaterial({ color: 0x4d5a2f, emissive: 0xffc030, emissiveIntensity: .5 }),
};
const crossMat = new THREE.MeshBasicMaterial({ color: 0xff2a2a });
function spawnPickup(x, z) {
  const kind = player.hp < 60 && Math.random() < .6 ? 'health' : (Math.random() < .5 ? 'health' : 'ammo');
  const g = new THREE.Group();
  const m = new THREE.Mesh(pickGeo, pickMats[kind]); m.castShadow = true; g.add(m);
  if (kind === 'health') { g.add(bx(.36, .1, .1, crossMat, 0, .21, 0)); g.add(bx(.1, .1, .36, crossMat, 0, .21, 0)); }
  else { for (let k = -1; k <= 1; k++) g.add(bx(.06, .18, .06, new THREE.MeshStandardMaterial({ color: 0xd4a640, metalness: .8, roughness: .3 }), k * .12, .28, 0)); }
  g.position.set(x, .5, z); scene.add(g);
  pickups.push({ g, kind, t: Math.random() * 6, life: 25 });
}
function updatePickups(dt) {
  for (let k = pickups.length - 1; k >= 0; k--) {
    const p = pickups[k]; p.t += dt; p.life -= dt;
    p.g.rotation.y += dt * 2; p.g.position.y = .5 + Math.sin(p.t * 3) * .12;
    p.g.visible = p.life > 4 || Math.sin(p.t * 20) > 0;
    const d = Math.hypot(p.g.position.x - player.pos.x, p.g.position.z - player.pos.z);
    let take = false;
    if (d < 1.3) {
      if (p.kind === 'health' && player.hp < player.maxHp) { player.hp = Math.min(player.maxHp, player.hp + 35); take = true; killFeed('+35 de vida', false, 'heal'); }
      if (p.kind === 'ammo') {
        wState[1].reserve = Math.min(240, wState[1].reserve + 45); wState[2].reserve = Math.min(48, wState[2].reserve + 8);
        take = true; killFeed('+ Munição', false, 'ammo');
      }
    }
    if (take) Sfx.play('pickup');
    if (take || p.life <= 0) { scene.remove(p.g); pickups.splice(k, 1); }
  }
}

// ---------------------------------------------------------------------
// ONDAS
// ---------------------------------------------------------------------
const wave = { n: 0, toSpawn: 0, state: 'break', timer: 3, spawnT: 0 };
function startWave() {
  wave.n++; wave.state = 'fight'; wave.toSpawn = 4 + wave.n * 2; wave.spawnT = 0;
  centerMsg(`ONDA ${wave.n}`, wave.n === 1 ? 'Elimine todos os robôs' : `${wave.toSpawn} inimigos a caminho`);
  Sfx.play('wave');
}
function pickType() {
  const r = Math.random();
  if (wave.n >= 3 && r < .18 + wave.n * .01) return 'pesado';
  if (wave.n >= 2 && r < .5) return 'corredor';
  return 'soldado';
}
function spawnEnemy() {
  const cands = [];
  for (const s of enemySpawns) cands.push(s);
  for (let k = 0; k < 20; k++) {
    const i = Math.floor(rand(1, COLS - 1)), j = Math.floor(rand(1, ROWS - 1));
    if (walkable(i, j)) cands.push({ x: (i + .5) * CELL, z: (j + .5) * CELL });
  }
  const good = cands.filter((c) => Math.hypot(c.x - player.pos.x, c.z - player.pos.z) > 22 && !lineOfSight(c.x, 1.8, c.z, player.pos.x, player.pos.y + 1.6, player.pos.z));
  const list = good.length ? good : cands.filter((c) => Math.hypot(c.x - player.pos.x, c.z - player.pos.z) > 15);
  const s = list[Math.floor(Math.random() * list.length)] || enemySpawns[0];
  const e = new Enemy(pickType(), s.x + rand(-.5, .5), s.z + rand(-.5, .5), 1 + (wave.n - 1) * .1);
  if (wave.n > 1 && Math.random() < .5) e.alert = 8; // parte já vem caçando
  enemies.push(e);
  hitTargets.push(...e.parts);
}
function updateWave(dt) {
  if (wave.state === 'break') {
    wave.timer -= dt;
    if (wave.timer <= 0) startWave();
    return;
  }
  const alive = enemies.filter((e) => !e.dead).length;
  wave.spawnT -= dt;
  if (wave.toSpawn > 0 && alive < 10 && wave.spawnT <= 0) { spawnEnemy(); wave.toSpawn--; wave.spawnT = rand(.6, 1.6); }
  if (wave.toSpawn === 0 && alive === 0) {
    const bonus = wave.n * 250;
    player.score += bonus; player.hp = Math.min(player.maxHp, player.hp + 25);
    wState[1].reserve = Math.min(240, wState[1].reserve + 30); wState[2].reserve = Math.min(48, wState[2].reserve + 6);
    centerMsg('ONDA CONCLUÍDA', `+${bonus} pontos  •  +25 vida  •  munição reabastecida`);
    wave.state = 'break'; wave.timer = 6;
    if (wave.n % 2 === 0) spawnBarrels();
  }
}

// ---------------------------------------------------------------------
// TIRO DO JOGADOR
// ---------------------------------------------------------------------
const ray = new THREE.Raycaster(); ray.far = 220;
const tmpV = V3(), tmpQ = new THREE.Quaternion();
function fire() {
  const w = WEAPONS[curW], st = wState[curW];
  if (switchT > 0 || reloadT > 0 || fireT > 0) return;
  if (st.ammo <= 0) { Sfx.play('empty'); fireT = .25; if (st.reserve > 0) startReload(); return; }
  st.ammo--; fireT = w.rate; player.shots++;
  Sfx.play(w.sound);
  recoilKick = w.kick; recoilRot = w.kick * 2.2;
  player.pitch += w.recoil * (1 - ads * .4); player.yaw += rand(-.4, .4) * w.recoil;
  shake = Math.max(shake, w.kick * .6);
  const fl = gunModels[curW].userData.flash; fl.visible = true; fl.rotation.z = Math.random() * 6; fl.scale.setScalar(rand(.8, 1.3)); flashT = .05;
  muzzleLight.intensity = 25;

  camera.updateMatrixWorld();
  const moving = Math.hypot(player.vel.x, player.vel.z);
  let spread = w.spread * (1 - ads * .65) * (moving > 7 ? 1.8 : moving > 1 ? 1.3 : 1) * (player.onGround ? 1 : 2);
  if (w.pellets > 1) spread = w.spread * (1 - ads * .3);
  const targets = levelMeshes.concat(hitTargets, barrels.filter((b) => b.alive).map((b) => b.mesh));
  const origin = camera.getWorldPosition(V3());
  const muzzleW = V3(.18, -.14, -.7).applyMatrix4(camera.matrixWorld);
  let anyHit = false, anyHead = false, anyKill = false;
  for (let p = 0; p < w.pellets; p++) {
    const dir = V3(rand(-1, 1) * spread, rand(-1, 1) * spread, -1).normalize().applyQuaternion(camera.quaternion);
    ray.set(origin, dir);
    const hit = ray.intersectObjects(targets, false)[0];
    const end = hit ? hit.point : origin.clone().addScaledVector(dir, 120);
    if (curW !== 0 || Math.random() < .5) addTracer(muzzleW, end);
    if (!hit) continue;
    const ud = hit.object.userData;
    if (ud.enemy) {
      const falloff = clamp(1 - (hit.distance - 12) / (60 * w.range), .35, 1);
      const dmg = w.dmg * falloff * (ud.head ? 2 : 1);
      anyHit = true; if (ud.head) anyHead = true;
      if (ud.enemy.hurt(dmg, ud.head)) anyKill = true;
      spawnSparks(hit.point, 4, 'fire', 3, .25); spawnSparks(hit.point, 2, 'oil', 2, .3);
    } else if (ud.barrel) {
      detonate(ud.barrel);
    } else {
      const n = hit.face ? hit.face.normal.clone() : V3(0, 1, 0);
      if (hit.object.isInstancedMesh) {/* caixas e paredes não giram */ }
      else n.transformDirection(hit.object.matrixWorld);
      addDecal(hit.point, n);
      spawnSparks(hit.point.clone().addScaledVector(n, .05), w.pellets > 1 ? 1 : 4, Math.random() < .5 ? 'fire' : 'dust', 3, .3);
    }
  }
  if (anyHit) { player.hits++; hitMarker(anyKill ? 'kill' : anyHead ? 'head' : ''); Sfx.play(anyHead ? 'head' : 'hit'); }
  if (st.ammo === 0 && st.reserve > 0) setTimeout(() => { if (wState[curW] === st && st.ammo === 0) startReload(); }, 250);
}
function startReload() {
  const w = WEAPONS[curW], st = wState[curW];
  if (reloadT > 0 || switchT > 0 || st.ammo >= w.mag || st.reserve <= 0) return;
  reloadT = w.reload; Sfx.play('reload');
}
function finishReload() {
  const w = WEAPONS[curW], st = wState[curW];
  const need = w.mag - st.ammo, take = Math.min(need, st.reserve);
  st.ammo += take; if (st.reserve !== Infinity) st.reserve -= take;
}
function switchWeapon(i) {
  if (i === curW || i < 0 || i >= WEAPONS.length || state !== 'playing') return;
  curW = i; reloadT = 0; switchT = .35; fireT = Math.max(fireT, .2);
  gunModels.forEach((m, k) => { m.visible = k === i; m.userData.flash.visible = false; });
  Sfx.play('step', 2);
}

// ---------------------------------------------------------------------
// DANO AO JOGADOR
// ---------------------------------------------------------------------
let shake = 0, flashT = 0, hurtT = 0;
function damagePlayer(dmg, from) {
  if (state !== 'playing') return;
  player.hp -= dmg; hurtT = Math.min(1, hurtT + dmg / 30);
  Sfx.play('hurt');
  shake = Math.max(shake, .15);
  // indicador de direção
  const dx = from.x - player.pos.x, dz = from.z - player.pos.z;
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
  const ang = Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz);
  const el = document.createElement('div'); el.className = 'di'; el.style.transform = `rotate(${ang}rad)`;
  $('dmg-indicators').appendChild(el); setTimeout(() => el.remove(), 1100);
  if (player.hp <= 0) { player.hp = 0; gameOver(); }
}
function panFor(p) {
  const dx = p.x - player.pos.x, dz = p.z - player.pos.z, d = Math.hypot(dx, dz) || 1;
  return ((dx * Math.cos(player.yaw) - dz * Math.sin(player.yaw)) / d) * .8;
}

// ---------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------
let hitT = 0, msgT = 0;
function hitMarker(cls) { const h = $('hitmarker'); h.className = cls; h.style.opacity = 1; hitT = cls === 'kill' ? .35 : .18; }
function centerMsg(title, sub) { const c = $('center-msg'); c.innerHTML = `${title}<small>${sub || ''}</small>`; c.style.opacity = 1; msgT = 3; }
function killFeed(html, hs, kind) {
  const d = document.createElement('div'); d.innerHTML = html; if (hs) d.className = 'hs';
  if (kind === 'heal') d.style.borderLeftColor = '#3fd46b';
  if (kind === 'ammo') d.style.borderLeftColor = '#ffb347';
  const kf = $('killfeed'); kf.prepend(d); while (kf.children.length > 5) kf.lastChild.remove();
  setTimeout(() => d.remove(), 4000);
}
const mm = $('minimap'), mctx = mm.getContext('2d'), MS = mm.width / COLS;
function drawMinimap() {
  mctx.clearRect(0, 0, mm.width, mm.height);
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const c = grid[j][i];
    if (c === '#') mctx.fillStyle = 'rgba(200,200,200,.55)';
    else if (c === 'C') mctx.fillStyle = 'rgba(170,130,70,.7)';
    else if (c === 'B') mctx.fillStyle = 'rgba(230,60,40,.9)';
    else continue;
    mctx.fillRect(i * MS, j * MS, MS, MS);
  }
  const k = MS / CELL;
  for (const p of pickups) { mctx.fillStyle = p.kind === 'health' ? '#3fd46b' : '#ffb347'; mctx.fillRect(p.g.position.x * k - 2, p.g.position.z * k - 2, 4, 4); }
  for (const e of enemies) {
    if (e.dead) continue;
    mctx.fillStyle = e.alert > 0 ? '#ff3b30' : 'rgba(255,90,80,.55)';
    mctx.beginPath(); mctx.arc(e.pos.x * k, e.pos.z * k, e.T.scale > 1.1 ? 3.5 : 2.5, 0, 7); mctx.fill();
  }
  const x = player.pos.x * k, z = player.pos.z * k;
  mctx.save(); mctx.translate(x, z); mctx.rotate(-player.yaw);
  mctx.fillStyle = 'rgba(255,255,255,.12)'; mctx.beginPath(); mctx.moveTo(0, 0); mctx.arc(0, 0, 30, -Math.PI / 2 - .6, -Math.PI / 2 + .6); mctx.fill();
  mctx.fillStyle = '#ffd23f'; mctx.beginPath(); mctx.moveTo(0, -6); mctx.lineTo(4, 4); mctx.lineTo(-4, 4); mctx.fill();
  mctx.restore();
}
const H = { wave: $('h-wave'), en: $('h-enemies'), score: $('h-score'), hp: $('h-hp'), hpbar: $('h-hpbar'), weapon: $('h-weapon'), mag: $('h-mag'), res: $('h-reserve'), hint: $('hint'), cross: $('crosshair'), vig: $('vignette'), flash: $('flash') };
const slots = [...document.querySelectorAll('#h-slots span')];
function updateHUD(dt) {
  const w = WEAPONS[curW], st = wState[curW];
  H.wave.textContent = wave.n;
  H.en.textContent = wave.toSpawn + enemies.filter((e) => !e.dead).length;
  H.score.textContent = player.score;
  H.hp.textContent = Math.ceil(player.hp);
  H.hpbar.style.width = (player.hp / player.maxHp * 100) + '%';
  H.hpbar.classList.toggle('low', player.hp < 35);
  H.weapon.textContent = w.name;
  H.mag.textContent = st.ammo; H.mag.classList.toggle('low', st.ammo <= Math.ceil(w.mag / 4));
  H.res.textContent = st.reserve === Infinity ? '∞' : st.reserve;
  slots.forEach((s, i) => s.classList.toggle('on', i === curW));
  let hint = '';
  if (reloadT > 0) hint = 'RECARREGANDO...';
  else if (st.ammo === 0 && st.reserve === 0) hint = 'SEM MUNIÇÃO — troque de arma (1 2 3)';
  else if (st.ammo <= Math.ceil(w.mag / 4)) hint = 'Aperte R para recarregar';
  else if (wave.state === 'break' && wave.n > 0) hint = `Próxima onda em ${Math.ceil(wave.timer)}s`;
  H.hint.textContent = hint;
  const moving = Math.hypot(player.vel.x, player.vel.z);
  H.cross.style.setProperty('--g', (6 + moving * 1.2 + recoilKick * 120 + (player.onGround ? 0 : 10)) + 'px');
  H.cross.classList.toggle('ads', ads > .6 && curW !== 2);
  if (hitT > 0) { hitT -= dt; if (hitT <= 0) $('hitmarker').style.opacity = 0; }
  if (msgT > 0) { msgT -= dt; if (msgT <= 0) $('center-msg').style.opacity = 0; }
  hurtT = Math.max(0, hurtT - dt * .9);
  H.vig.style.opacity = Math.max(hurtT, player.hp < 30 ? .35 + Math.sin(performance.now() / 250) * .1 : 0);
  drawMinimap();
}

// ---------------------------------------------------------------------
// ESTADO DO JOGO / MENUS
// ---------------------------------------------------------------------
let state = 'menu';
let best = parseInt(localStorage.getItem('zc3d-best') || '0', 10);
$('best').textContent = best;
$('sens').value = sens; $('sens-v').textContent = sens.toFixed(1);
$('sens').addEventListener('input', (e) => { sens = parseFloat(e.target.value); $('sens-v').textContent = sens.toFixed(1); localStorage.setItem('zc3d-sens', sens); });

function lock() { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* sem pointer lock */ } }
function show(id) { ['menu-start', 'menu-pause', 'menu-over'].forEach((m) => $(m).classList.toggle('hidden', m !== id)); }

function resetGame() {
  enemies.forEach((e) => e.remove()); enemies.length = 0; hitTargets = [];
  pickups.forEach((p) => scene.remove(p.g)); pickups.length = 0;
  spawnBarrels();
  Object.assign(player, { hp: 100, vy: 0, onGround: true, yaw: Math.PI * .75, pitch: 0, score: 0, kills: 0, headshots: 0, shots: 0, hits: 0 });
  player.pos.set(playerSpawn.x, 0, playerSpawn.z); player.vel.set(0, 0, 0);
  WEAPONS.forEach((w, i) => { wState[i].ammo = w.mag; wState[i].reserve = w.reserve; });
  curW = 0; gunModels.forEach((m, k) => { m.visible = k === 0; m.userData.flash.visible = false; });
  reloadT = 0; switchT = 0; fireT = 0;
  Object.assign(wave, { n: 0, toSpawn: 0, state: 'break', timer: 2.5 });
  decals.forEach((d) => (d.position.y = -50));
  $('killfeed').innerHTML = '';
  computeFlow();
}
function startGame() {
  Sfx.init(); resetGame(); state = 'playing';
  show(null); $('hud').classList.remove('hidden'); document.body.classList.add('playing');
  lock();
  centerMsg('PREPARE-SE', 'Os robôs estão chegando...');
}
function pause() { if (state !== 'playing') return; state = 'paused'; mouseDown = false; show('menu-pause'); document.body.classList.remove('playing'); }
function resume() { state = 'playing'; show(null); document.body.classList.add('playing'); Sfx.init(); lock(); }
function gameOver() {
  state = 'over'; mouseDown = false;
  if (document.pointerLockElement) document.exitPointerLock();
  document.body.classList.remove('playing');
  const isBest = player.score > best;
  if (isBest) { best = player.score; localStorage.setItem('zc3d-best', best); $('best').textContent = best; }
  const accP = player.shots ? Math.round(player.hits / player.shots * 100) : 0;
  $('stats').innerHTML = [
    ['PONTOS', player.score + (isBest ? ' 🏆' : '')], ['ONDA', wave.n], ['ABATES', player.kills],
    ['TIROS NA CABEÇA', player.headshots], ['PRECISÃO', accP + '%'], ['RECORDE', best],
  ].map(([l, v]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
  setTimeout(() => show('menu-over'), 900);
}
$('btn-play').onclick = startGame;
$('btn-again').onclick = startGame;
$('btn-resume').onclick = resume;
$('btn-restart').onclick = startGame;
let hadLock = false;
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === canvas) hadLock = true;
  else if (hadLock && state === 'playing') pause();
});

// ---------------------------------------------------------------------
// ENTRADAS
// ---------------------------------------------------------------------
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (state === 'playing') {
    if (e.code === 'KeyR') startReload();
    if (e.code === 'Digit1') switchWeapon(0);
    if (e.code === 'Digit2') switchWeapon(1);
    if (e.code === 'Digit3') switchWeapon(2);
    if (e.code === 'KeyP') { if (document.pointerLockElement) document.exitPointerLock(); pause(); }
    if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
  } else if (state === 'paused' && e.code === 'KeyP') resume();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('mousemove', (e) => {
  if (state !== 'playing') return;
  if (Math.abs(e.movementX) > 250 || Math.abs(e.movementY) > 250) return; // ignora saltos falsos do navegador
  const k = .0022 * sens * (1 - ads * .45);
  player.yaw -= e.movementX * k; player.pitch -= e.movementY * k;
  player.pitch = clamp(player.pitch, -1.5, 1.5);
  swayX += e.movementX * .00025; swayY += e.movementY * .00025;
});
canvas.addEventListener('mousedown', (e) => {
  if (state !== 'playing') return;
  if (!document.pointerLockElement) lock();
  if (e.button === 0) { mouseDown = true; }
  if (e.button === 2) adsHeld = true;
});
addEventListener('mouseup', (e) => { if (e.button === 0) { mouseDown = false; triggerReleased = true; } if (e.button === 2) adsHeld = false; });
addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('wheel', (e) => { if (state === 'playing') switchWeapon((curW + (e.deltaY > 0 ? 1 : -1) + WEAPONS.length) % WEAPONS.length); }, { passive: true });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouseDown = false; adsHeld = false; });
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = gunCam.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix(); gunCam.updateProjectionMatrix();
});

// ---------------------------------------------------------------------
// ATUALIZAÇÃO DO JOGADOR
// ---------------------------------------------------------------------
function updatePlayer(dt) {
  const fwd = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const str = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const sprint = (keys.ShiftLeft || keys.ShiftRight) && fwd > 0 && ads < .3;
  const maxSpd = sprint ? 9.5 : 6 * (1 - ads * .4);
  const sy = Math.sin(player.yaw), cy = Math.cos(player.yaw);
  let wx = -sy * fwd + cy * str, wz = -cy * fwd - sy * str;
  const l = Math.hypot(wx, wz); if (l > 0) { wx /= l; wz /= l; }
  const accel = player.onGround ? 12 : 3;
  player.vel.x = lerp(player.vel.x, wx * maxSpd, Math.min(1, accel * dt));
  player.vel.z = lerp(player.vel.z, wz * maxSpd, Math.min(1, accel * dt));
  player.pos.x += player.vel.x * dt; player.pos.z += player.vel.z * dt;
  collide(player.pos, player.radius);
  if (keys.Space && player.onGround) { player.vy = 7.2; player.onGround = false; }
  player.vy -= 22 * dt; player.pos.y += player.vy * dt;
  if (player.pos.y <= 0) { if (!player.onGround && player.vy < -6) shake = Math.max(shake, .08); player.pos.y = 0; player.vy = 0; player.onGround = true; }

  const spd = Math.hypot(player.vel.x, player.vel.z);
  if (player.onGround && spd > .5) {
    player.bob += spd * dt * 1.6;
    player.stepT -= spd * dt;
    if (player.stepT <= 0) { Sfx.play('step', sprint ? 1.3 : 1); player.stepT = 2.4; }
  }
  // mira (ADS)
  ads = lerp(ads, adsHeld && reloadT <= 0 && switchT <= 0 ? 1 : 0, Math.min(1, dt * 12));
  camera.fov = lerp(75, curW === 1 ? 45 : 58, ads) + (sprint ? 4 : 0);
  camera.updateProjectionMatrix();

  // câmera
  const bobY = Math.sin(player.bob * 2) * .05 * (1 - ads * .8) * (player.onGround ? 1 : 0);
  shake *= Math.pow(.02, dt);
  camera.position.set(player.pos.x + (Math.random() - .5) * shake * .3, player.pos.y + player.eye + bobY, player.pos.z + (Math.random() - .5) * shake * .3);
  camera.rotation.set(player.pitch + (Math.random() - .5) * shake * .05, player.yaw, 0);
  sky.position.copy(camera.position);

  // arma
  if (fireT > 0) fireT -= dt;
  const w = WEAPONS[curW];
  if (mouseDown && (w.auto || triggerReleased)) { fire(); triggerReleased = false; }
  if (reloadT > 0) { reloadT -= dt; if (reloadT <= 0) { reloadT = 0; finishReload(); } }
  if (switchT > 0) switchT = Math.max(0, switchT - dt);
  if (flashT > 0) { flashT -= dt; if (flashT <= 0) gunModels[curW].userData.flash.visible = false; }
  muzzleLight.intensity *= Math.pow(.0001, dt);
  recoilKick = lerp(recoilKick, 0, Math.min(1, dt * 14));
  recoilRot = lerp(recoilRot, 0, Math.min(1, dt * 10));
  swayX = lerp(swayX, 0, Math.min(1, dt * 8)); swayY = lerp(swayY, 0, Math.min(1, dt * 8));

  const bobX = Math.cos(player.bob) * .012 * (1 - ads * .9), bobGY = Math.abs(Math.sin(player.bob)) * .012 * (1 - ads * .9);
  const relT = reloadT > 0 ? Math.sin(Math.min(1, (w.reload - reloadT) / w.reload) * Math.PI) : 0;
  const swT = switchT / .35;
  gunRig.position.set(
    lerp(HIP.x, 0, ads) + bobX - swayX * 1.5,
    lerp(HIP.y, w.adsY, ads) - bobGY + swayY * 1.5 - relT * .12 - swT * .35 - (sprint ? .04 : 0),
    lerp(HIP.z, -.32, ads) + recoilKick
  );
  gunRig.rotation.set(recoilRot + relT * .6 + swT * .5 + swayY * 2, swayX * 2 + (sprint ? .5 : 0), relT * .4 + (sprint ? .2 : 0));
}

// ---------------------------------------------------------------------
// LOOP PRINCIPAL
// ---------------------------------------------------------------------
const clock = new THREE.Clock();
let flowT = 0;
resetGame();
camera.position.set(playerSpawn.x, 1.7, playerSpawn.z);
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), .05);
  if (state === 'playing' || state === 'over') {
    if (state === 'playing') updatePlayer(dt);
    flowT -= dt; if (flowT <= 0) { computeFlow(); flowT = .25; }
    for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].update(dt)) { enemies[k].remove(); enemies.splice(k, 1); }
    if (state === 'playing') { updateWave(dt); updatePickups(dt); }
    updateSparks(dt); updateTracers(dt); updateBooms(dt);
    updateHUD(dt);
    if (state === 'over') { camera.position.y = lerp(camera.position.y, .4, dt * 3); camera.rotation.z = lerp(camera.rotation.z, .6, dt * 3); }
  } else if (state === 'menu') {
    // câmera passeando no menu
    const t = performance.now() / 9000;
    camera.position.set(MW / 2 + Math.cos(t) * 30, 14, MH / 2 + Math.sin(t) * 22);
    camera.lookAt(MW / 2, 0, MH / 2);
    sky.position.copy(camera.position);
  }
  renderer.clear();
  renderer.render(scene, camera);
  if (state === 'playing' || state === 'paused') {
    renderer.clearDepth();
    renderer.render(gunScene, gunCam);
  }
}
window.ZC = { player, enemies, wave }; // acesso para depuração no console
frame();
})();
