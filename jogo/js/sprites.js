'use strict';
/* =========================================================
   Sprites desenhados pixel a pixel (carros, pedestres, brilhos)
   ========================================================= */

const CAR_TYPES = {
  compact:   { len: 16, wid: 9,  max: 185, accel: 150, turn: 3.0, mass: 0.8, colors: [[70, 130, 200], [200, 70, 70], [90, 170, 110], [230, 230, 235], [150, 90, 180], [60, 60, 70]] },
  sedan:     { len: 18, wid: 10, max: 205, accel: 155, turn: 2.8, mass: 1.0, colors: [[180, 40, 50], [40, 90, 170], [210, 210, 215], [50, 50, 60], [120, 120, 130], [30, 120, 100], [200, 150, 60]] },
  sport:     { len: 18, wid: 9,  max: 265, accel: 235, turn: 3.1, mass: 0.9, colors: [[230, 40, 40], [255, 150, 30], [40, 200, 230], [240, 220, 60]] },
  taxi:      { len: 18, wid: 10, max: 200, accel: 150, turn: 2.8, mass: 1.0, colors: [[238, 190, 40]] },
  van:       { len: 22, wid: 11, max: 165, accel: 115, turn: 2.4, mass: 1.4, colors: [[220, 220, 225], [90, 110, 140], [160, 70, 50], [70, 100, 70]] },
  truck:     { len: 28, wid: 12, max: 145, accel: 90,  turn: 2.0, mass: 2.2, colors: [[200, 60, 40], [40, 80, 160], [220, 170, 40], [60, 130, 80]] },
  police:    { len: 19, wid: 10, max: 245, accel: 210, turn: 3.0, mass: 1.1, colors: [[235, 235, 240]] },
  ambulance: { len: 22, wid: 11, max: 205, accel: 150, turn: 2.5, mass: 1.4, colors: [[238, 238, 242]] },
};
const AI_TYPE_POOL = ['sedan', 'sedan', 'sedan', 'compact', 'compact', 'taxi', 'taxi', 'van', 'truck', 'sport'];

const _spriteCache = new Map();

function carSprite(type, col, burnt = false) {
  const key = type + col.join(',') + (burnt ? 'b' : '');
  if (_spriteCache.has(key)) return _spriteCache.get(key);
  const s = CAR_TYPES[type];
  const L = s.len, W = s.wid;
  const c = makeCanvas(L, W);
  const g = ctx2d(c);
  const px = (x, y, w, h, color) => { g.fillStyle = Array.isArray(color) ? rgb(...color) : color; g.fillRect(x, y, w, h); };
  const body = burnt ? [46, 40, 38] : col;
  const dark = shade(body, 0.6);
  const light = burnt ? [34, 30, 30] : tint(body, 30);
  const glass = burnt ? [12, 12, 14] : [26, 36, 54];
  const glassHi = burnt ? [20, 20, 22] : [72, 100, 136];
  const head = burnt ? [40, 36, 30] : [255, 246, 206];
  const tail = burnt ? [40, 30, 30] : [214, 30, 40];

  if (type === 'truck') {
    // carroceria
    px(0, 0, L - 9, W, burnt ? [50, 46, 44] : [176, 176, 182]);
    for (let x = 2; x < L - 10; x += 3) px(x, 1, 1, W - 2, burnt ? [40, 36, 34] : [150, 150, 158]);
    px(0, 0, L - 9, 1, burnt ? [36, 32, 30] : [130, 130, 138]);
    px(0, W - 1, L - 9, 1, burnt ? [36, 32, 30] : [130, 130, 138]);
    px(L - 9, 2, 1, W - 4, [30, 30, 34]);
    // cabine
    px(L - 8, 1, 7, W - 2, body); px(L - 8, 0, 6, W, body);
    px(L - 8, 0, 6, 1, dark); px(L - 8, W - 1, 6, 1, dark);
    px(L - 4, 1, 2, W - 2, glass); px(L - 4, 2, 1, 1, glassHi);
    px(L - 7, 2, 3, W - 4, light);
    px(L - 1, 1, 1, 2, head); px(L - 1, W - 3, 1, 2, head);
    px(0, 1, 1, 2, tail); px(0, W - 3, 1, 2, tail);
  } else if (type === 'van' || type === 'ambulance') {
    px(1, 0, L - 2, W, body); px(0, 1, L, W - 2, body);
    px(1, 0, L - 2, 1, dark); px(1, W - 1, L - 2, 1, dark); px(0, 1, 1, W - 2, dark);
    px(1, 1, L - 7, W - 2, light);
    px(L - 6, 1, 2, W - 2, glass); px(L - 6, 2, 1, 1, glassHi);
    px(L - 4, 2, 2, W - 4, tint(body, 10));
    px(1, Math.floor(W / 2), L - 8, 1, shade(light, 0.9));
    if (type === 'ambulance' && !burnt) {
      px(6, Math.floor(W / 2) - 3, 2, 6, [210, 30, 40]);
      px(4, Math.floor(W / 2) - 1, 6, 2, [210, 30, 40]);
      px(L - 8, 1, 1, Math.floor((W - 2) / 2), [230, 40, 50]);
      px(L - 8, 1 + Math.floor((W - 2) / 2), 1, Math.ceil((W - 2) / 2), [50, 90, 255]);
    }
    px(L - 1, 1, 1, 2, head); px(L - 1, W - 3, 1, 2, head);
    px(0, 1, 1, 1, tail); px(0, W - 2, 1, 1, tail);
  } else {
    px(1, 0, L - 2, W, body); px(0, 1, L, W - 2, body);
    px(1, 0, L - 2, 1, dark); px(1, W - 1, L - 2, 1, dark); px(0, 1, 1, W - 2, dark);
    const sport = type === 'sport';
    const ws = sport ? L - 8 : L - 7;            // para-brisa
    const roofX = sport ? 5 : 4;
    px(ws + 2, 2, L - ws - 4, W - 4, tint(body, 12)); // capô
    px(roofX - 1, 1, 1, W - 2, glass);           // vidro traseiro
    px(roofX, 1, ws - roofX, W - 2, light);      // teto
    px(ws, 1, 2, W - 2, glass); px(ws, 2, 1, 1, glassHi);
    if (sport && !burnt) { px(0, Math.floor(W / 2) - 1, L, 2, [250, 250, 250]); px(ws, Math.floor(W / 2) - 1, 2, 2, glass); }
    if (type === 'police' && !burnt) {
      px(L - 5, 1, 4, W - 2, [28, 32, 54]);
      px(1, 1, 2, W - 2, [28, 32, 54]);
      const mid = Math.floor(W / 2);
      px(roofX + 2, 1, 2, mid - 1, [230, 40, 50]);
      px(roofX + 2, mid, 2, W - 1 - mid, [50, 90, 255]);
    }
    if (type === 'taxi' && !burnt) {
      px(roofX + 2, Math.floor(W / 2) - 1, 3, 2, [255, 250, 210]);
      for (let x = 2; x < L - 2; x += 2) { px(x, 0, 1, 1, [30, 30, 30]); px(x, W - 1, 1, 1, [30, 30, 30]); }
    }
    px(L - 1, 1, 1, 2, head); px(L - 1, W - 3, 1, 2, head);
    px(0, 1, 1, 1, tail); px(0, W - 2, 1, 1, tail);
  }
  _spriteCache.set(key, c);
  return c;
}

/* ---------- Pedestres ---------- */
const SKINS = [[236, 198, 160], [204, 152, 110], [150, 100, 66], [110, 72, 48], [244, 214, 184]];
const HAIRS = [[30, 24, 20], [70, 44, 26], [140, 90, 40], [200, 170, 90], [20, 20, 24], [120, 120, 124]];
const SHIRTS = [[200, 60, 60], [60, 100, 200], [230, 230, 230], [60, 160, 90], [220, 160, 40], [140, 70, 170], [40, 40, 50], [230, 110, 160], [80, 190, 200], [170, 120, 80]];

function makePedPalette(kind) {
  if (kind === 'player') return { shirt: [255, 214, 40], hair: [24, 20, 18], skin: [204, 152, 110], pants: [40, 50, 90] };
  if (kind === 'officer') return { shirt: [40, 70, 170], hair: [16, 24, 60], skin: pick(SKINS), pants: [20, 26, 50] };
  return { shirt: pick(SHIRTS), hair: pick(HAIRS), skin: pick(SKINS), pants: shade(pick(SHIRTS), 0.5) };
}

function pedFrames(pal) {
  if (pal._frames) return pal._frames;
  const frames = [];
  for (let f = 0; f < 4; f++) {
    const c = makeCanvas(8, 8);
    const g = ctx2d(c);
    const px = (x, y, w, h, col) => { g.fillStyle = rgb(...col); g.fillRect(x, y, w, h); };
    if (f === 3) { // caído
      px(1, 3, 5, 2, pal.shirt); px(0, 3, 1, 2, pal.pants); px(6, 3, 2, 2, pal.hair);
      px(3, 1, 1, 2, pal.skin); px(3, 5, 1, 2, pal.skin);
    } else {
      if (f === 1) { px(5, 5, 2, 1, pal.pants); px(0, 2, 2, 1, pal.pants); }
      if (f === 2) { px(5, 2, 2, 1, pal.pants); px(0, 5, 2, 1, pal.pants); }
      px(2, 1, 3, 6, pal.shirt);
      px(2, 1, 1, 6, shade(pal.shirt, 0.75));
      if (f === 1) { px(5, 1, 1, 1, pal.skin); px(1, 6, 1, 1, pal.skin); }
      else if (f === 2) { px(5, 6, 1, 1, pal.skin); px(1, 1, 1, 1, pal.skin); }
      else { px(3, 0, 1, 1, pal.skin); px(3, 7, 1, 1, pal.skin); }
      px(3, 3, 2, 2, pal.hair);
      px(5, 3, 1, 2, pal.skin);
    }
    frames.push(c);
  }
  pal._frames = frames;
  return frames;
}

/* ---------- Brilhos ---------- */
const _glowCache = new Map();
function glowSprite(r, g, b, radius, alpha = 1, mid = 0.35) {
  const key = `${r},${g},${b},${radius},${alpha},${mid}`;
  if (_glowCache.has(key)) return _glowCache.get(key);
  const size = radius * 2;
  const c = makeCanvas(size, size);
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(radius, radius, 0, radius, radius, radius);
  gr.addColorStop(0, rgb(r, g, b, alpha));
  gr.addColorStop(mid, rgb(r * 0.92, g * 0.8, b * 0.7, alpha * 0.5));
  gr.addColorStop(1, rgb(r * 0.8, g * 0.6, b * 0.5, 0));
  x.fillStyle = gr;
  x.fillRect(0, 0, size, size);
  _glowCache.set(key, c);
  return c;
}

let _headlight = null;
function headlightSprite() {
  if (_headlight) return _headlight;
  const L = 70, H = 46;
  const c = makeCanvas(L, H);
  const x = c.getContext('2d');
  x.save();
  x.beginPath();
  x.moveTo(0, H / 2 - 4); x.lineTo(L, 0); x.lineTo(L, H); x.lineTo(0, H / 2 + 4); x.closePath();
  x.clip();
  const gr = x.createRadialGradient(0, H / 2, 0, 0, H / 2, L);
  gr.addColorStop(0, 'rgba(255,240,205,0.85)');
  gr.addColorStop(0.45, 'rgba(255,226,170,0.32)');
  gr.addColorStop(1, 'rgba(255,210,150,0)');
  x.fillStyle = gr;
  x.fillRect(0, 0, L, H);
  x.restore();
  _headlight = c;
  return c;
}

/* ---------- Fonte bitmap 3x5 (letreiros pintados nos telhados) ---------- */
const FONT3 = {
  A: '010101111101101', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  H: '101101111101101', I: '111010010010111', L: '100100100100111', N: '101111111111101',
  O: '010101101101010', P: '110101110100100', R: '110101110101101', S: '011100010001110',
  T: '111010010010010', U: '101101101101111', Z: '111001010100111', G: '011100101101011',
  $: '011110010011110', ' ': '000000000000000',
};
function drawText3(g, text, x, y, scale, color) {
  g.fillStyle = color;
  let cx = x;
  for (const ch of text) {
    const p = FONT3[ch] || FONT3[' '];
    for (let i = 0; i < 15; i++) if (p[i] === '1') g.fillRect(cx + (i % 3) * scale, y + Math.floor(i / 3) * scale, scale, scale);
    cx += 4 * scale;
  }
}
function text3Width(text, scale) { return text.length * 4 * scale - scale; }
