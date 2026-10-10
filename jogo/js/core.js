'use strict';
/* =========================================================
   NOITE NA CIDADE — núcleo: constantes, utilidades, entrada e som
   ========================================================= */

const T = 16;                 // tamanho do tile em pixels
const MAP_W = 150;            // largura do mapa em tiles
const MAP_H = 100;            // altura do mapa em tiles
const WORLD_W = MAP_W * T;
const WORLD_H = MAP_H * T;

// Direções: 0 = Leste, 1 = Sul, 2 = Oeste, 3 = Norte (y cresce para baixo)
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const DIR_ANG = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

function makeCanvas(w, h) {
  if (typeof document !== 'undefined' && document.createElement) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  return globalThis.__makeCanvas(w, h); // usado nos testes automatizados
}

function ctx2d(c) {
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return x;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const randRange = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function angDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function hash2(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function rgb(r, g, b, a) {
  r = clamp(Math.round(r), 0, 255); g = clamp(Math.round(g), 0, 255); b = clamp(Math.round(b), 0, 255);
  return a === undefined ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`;
}

function shade(c, k) { return [c[0] * k, c[1] * k, c[2] * k]; }
function tint(c, add) { return [c[0] + add, c[1] + add, c[2] + add]; }

function formatMoney(v) {
  const s = Math.max(0, Math.floor(v)).toString().padStart(7, '0');
  return '$' + s;
}

/* ---------------------------------------------------------
   Entrada (teclado + toque)
   --------------------------------------------------------- */
const Input = {
  keys: new Set(),
  hits: new Set(),
  touch: { jx: 0, jy: 0, active: false, held: new Set() },
  bindings: {
    up: ['KeyW', 'ArrowUp'],
    down: ['KeyS', 'ArrowDown'],
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    enter: ['KeyE', 'Enter', 'KeyF'],
    action: ['Space'],
    run: ['ShiftLeft', 'ShiftRight'],
    horn: ['KeyH'],
    pause: ['KeyP', 'Escape'],
    mute: ['KeyM'],
  },
  down(act) {
    const b = this.bindings[act];
    for (let i = 0; i < b.length; i++) if (this.keys.has(b[i])) return true;
    return this.touch.held.has(act);
  },
  hit(act) { return this.hits.has(act); },
  pressAction(act) { this.hits.add(act); },
  endFrame() { this.hits.clear(); },
  axis() {
    let x = 0, y = 0;
    if (this.down('left')) x -= 1;
    if (this.down('right')) x += 1;
    if (this.down('up')) y -= 1;
    if (this.down('down')) y += 1;
    if (this.touch.active) { x = this.touch.jx; y = this.touch.jy; }
    return { x, y };
  },
  init(target) {
    const codeToAct = {};
    for (const act in this.bindings) for (const c of this.bindings[act]) codeToAct[c] = act;
    target.addEventListener('keydown', (e) => {
      const act = codeToAct[e.code];
      if (act) {
        e.preventDefault();
        if (!this.keys.has(e.code)) this.hits.add(act);
      }
      this.keys.add(e.code);
    });
    target.addEventListener('keyup', (e) => { this.keys.delete(e.code); });
    target.addEventListener('blur', () => { this.keys.clear(); this.touch.held.clear(); });
  },
};

/* ---------------------------------------------------------
   Som sintetizado (Web Audio) — nada de arquivos externos
   --------------------------------------------------------- */
const Sound = {
  ctx: null, master: null, muted: false,
  engine: null, engineGain: null, engineFilter: null,
  siren: null, sirenGain: null, noiseBuf: null,
  init() {
    if (this.ctx || typeof window === 'undefined') return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);

      this.engine = this.ctx.createOscillator();
      this.engine.type = 'sawtooth';
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.value = 420;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      this.engine.connect(this.engineFilter).connect(this.engineGain).connect(this.master);
      this.engine.frequency.value = 40;
      this.engine.start();

      this.siren = this.ctx.createOscillator();
      this.siren.type = 'square';
      const sf = this.ctx.createBiquadFilter();
      sf.type = 'lowpass'; sf.frequency.value = 1800;
      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.value = 0;
      this.siren.connect(sf).connect(this.sirenGain).connect(this.master);
      this.siren.start();

      const len = this.ctx.sampleRate * 0.6;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (err) { this.ctx = null; }
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  },
  setEngine(active, speed) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const s = Math.abs(speed);
    this.engineGain.gain.setTargetAtTime(active ? 0.05 + Math.min(0.05, s / 4000) : 0, t, 0.08);
    this.engine.frequency.setTargetAtTime(38 + s * 0.42, t, 0.08);
    this.engineFilter.frequency.setTargetAtTime(300 + s * 3, t, 0.1);
  },
  setSiren(level, time) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.sirenGain.gain.setTargetAtTime(level * 0.035, t, 0.1);
    this.siren.frequency.setTargetAtTime((time % 0.9) < 0.45 ? 660 : 880, t, 0.02);
  },
  tone(freq, dur, type = 'square', vol = 0.08, slide = 0, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol = 0.2, freq = 900) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t); src.stop(t + dur);
  },
  crash(power) { this.noise(0.25, Math.min(0.35, 0.08 + power / 600), 700); },
  punch() { this.noise(0.08, 0.2, 1400); this.tone(120, 0.08, 'square', 0.05, -60); },
  horn() { this.tone(392, 0.28, 'square', 0.05); this.tone(494, 0.28, 'square', 0.04); },
  explosion() { this.noise(0.6, 0.45, 400); this.tone(80, 0.5, 'sawtooth', 0.12, -50); },
  door() { this.tone(180, 0.06, 'square', 0.05); this.tone(140, 0.06, 'square', 0.05, 0, 0.07); },
  coin() { this.tone(988, 0.08, 'square', 0.05); this.tone(1319, 0.14, 'square', 0.05, 0, 0.08); },
  success() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.16, 'square', 0.06, 0, i * 0.11)); },
  fail() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.08, 0, i * 0.14)); },
  phone() { this.tone(1200, 0.07, 'square', 0.04); this.tone(1200, 0.07, 'square', 0.04, 0, 0.12); },
  wanted() { this.tone(300, 0.12, 'sawtooth', 0.05, 200); },
};
