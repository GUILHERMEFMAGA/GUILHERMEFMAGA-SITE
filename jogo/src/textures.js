// ============================================================
//  Texturas 100% procedurais (canvas) — nada de download
// ============================================================
import * as THREE from 'three';
import { CFG, mulberry32 } from './config.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function tex(c, { repeat = null, srgb = true, aniso = 8, mip = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (repeat) t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = aniso;
  t.generateMipmaps = mip;
  t.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

// ------------------------------------------------------------
//  FACHADAS — máscara de janelas (branco = vidro, preto = parede)
//  cada textura cobre 8m x 8m do mundo real
// ------------------------------------------------------------
export function makeFacades() {
  const S = 512, PER = 8; // 512px = 8 metros
  const out = [];

  // ---- 0. torre de vidro (curtain wall) ----
  {
    const c = canvas(S, S), x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, S, S);
    const cols = 8, rows = 10, mull = 7;
    const cw = S / cols, ch = S / rows;
    x.fillStyle = '#fff';
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      x.fillRect(i * cw + mull, j * ch + mull, cw - mull * 2, ch - mull * 2);
    }
    // variação de refletância por painel
    const g = x.getImageData(0, 0, S, S), d = g.data, r = mulberry32(7);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const v = 150 + Math.floor(r() * 105);
      const x0 = Math.floor(i * cw + mull), y0 = Math.floor(j * ch + mull);
      const x1 = Math.floor(i * cw + cw - mull), y1 = Math.floor(j * ch + ch - mull);
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
        const k = (yy * S + xx) * 4; d[k] = d[k + 1] = d[k + 2] = v;
      }
    }
    x.putImageData(g, 0, 0);
    out.push(tex(c, { srgb: false }));
  }

  // ---- 1. concreto com janelas puncionadas ----
  {
    const c = canvas(S, S), x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, S, S);
    x.fillStyle = '#fff';
    const cols = 6, rows = 2;
    const cw = S / cols, ch = S / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      x.fillRect(i * cw + cw * 0.22, j * ch + ch * 0.2, cw * 0.56, ch * 0.5);
      // peitoril
      x.fillRect(i * cw + cw * 0.22, j * ch + ch * 0.72, cw * 0.56, ch * 0.05);
    }
    out.push(tex(c, { srgb: false }));
  }

  // ---- 2. tijolo / prédio antigo ----
  {
    const c = canvas(S, S), x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, S, S);
    x.fillStyle = '#fff';
    const cols = 4, rows = 2, cw = S / cols, ch = S / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const wx = i * cw + cw * 0.28, wy = j * ch + ch * 0.18;
      x.fillRect(wx, wy, cw * 0.44, ch * 0.56);
      // arco no topo
      x.beginPath();
      x.arc(wx + cw * 0.22, wy, cw * 0.22, Math.PI, 0);
      x.fill();
    }
    out.push(tex(c, { srgb: false }));
  }

  // ---- 3. faixas horizontais (moderno) ----
  {
    const c = canvas(S, S), x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, S, S);
    x.fillStyle = '#fff';
    const rows = 4, ch = S / rows;
    for (let j = 0; j < rows; j++) {
      x.fillRect(0, j * ch + ch * 0.28, S, ch * 0.46);
    }
    // pilares cortando a faixa
    x.fillStyle = '#000';
    for (let i = 0; i < 8; i++) x.fillRect(i * (S / 8), 0, 10, S);
    out.push(tex(c, { srgb: false }));
  }

  return out;
}

// ------------------------------------------------------------
//  MARCAS VIÁRIAS — um único mapa cobre a cidade inteira
// ------------------------------------------------------------
export function makeRoadTexture() {
  const SIZE = 4096;
  const c = canvas(SIZE, SIZE), x = c.getContext('2d');
  const WORLD = CFG.HALF * 2;
  const px = (v) => (v + CFG.HALF) / WORLD * SIZE;
  const sc = SIZE / WORLD;           // px por metro
  const rnd = mulberry32(4242);

  x.clearRect(0, 0, SIZE, SIZE);

  // --- desgaste de pneus nas faixas (sutil) ---
  for (const r of CFG.ROADS) {
    for (const off of [-CFG.LANE, CFG.LANE]) {
      const p = px(r + off);
      const g = x.createLinearGradient(p - 2.2 * sc, 0, p + 2.2 * sc, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.5, 'rgba(4,4,6,0.42)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g;
      x.fillRect(p - 2.2 * sc, 0, 4.4 * sc, SIZE);
      const g2 = x.createLinearGradient(0, p - 2.2 * sc, 0, p + 2.2 * sc);
      g2.addColorStop(0, 'rgba(0,0,0,0)');
      g2.addColorStop(0.5, 'rgba(4,4,6,0.42)');
      g2.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g2;
      x.fillRect(0, p - 2.2 * sc, SIZE, 4.4 * sc);
    }
  }

  // --- manchas de óleo / remendos nos cruzamentos ---
  for (const a of CFG.ROADS) for (const b of CFG.ROADS) {
    for (let k = 0; k < 5; k++) {
      const rr = (4 + rnd() * 12) * sc;
      x.fillStyle = `rgba(${8 + rnd() * 14 | 0},${8 + rnd() * 12 | 0},${10 + rnd() * 12 | 0},${0.12 + rnd() * 0.22})`;
      x.beginPath();
      x.ellipse(px(a) + (rnd() - 0.5) * 30 * sc, px(b) + (rnd() - 0.5) * 30 * sc, rr, rr * (0.5 + rnd() * 0.7), rnd() * 3, 0, Math.PI * 2);
      x.fill();
    }
  }

  // --- quarteirões: calçada clara + miolo escuro ---
  const inner = CFG.SPACING / 2 - CFG.ROAD_HALF;
  for (let i = 0; i < CFG.BLOCKS; i++) for (let j = 0; j < CFG.BLOCKS; j++) {
    const cx = -CFG.SPAN / 2 + CFG.SPACING / 2 + i * CFG.SPACING;
    const cz = -CFG.SPAN / 2 + CFG.SPACING / 2 + j * CFG.SPACING;
    x.fillStyle = '#5b5b58';
    x.fillRect(px(cx - inner), px(cz - inner), inner * 2 * sc, inner * 2 * sc);
    // sujeira/ variação na calçada
    for (let k = 0; k < 40; k++) {
      x.fillStyle = `rgba(0,0,0,${0.02 + rnd() * 0.06})`;
      const sx = (2 + rnd() * 12) * sc;
      x.fillRect(px(cx - inner) + rnd() * inner * 2 * sc, px(cz - inner) + rnd() * inner * 2 * sc, sx, sx * (0.4 + rnd()));
    }
    x.fillStyle = '#232326';
    const lot = inner - CFG.SIDEWALK;
    x.fillRect(px(cx - lot), px(cz - lot), lot * 2 * sc, lot * 2 * sc);
  }

  // --- faixas de pedestres nos cruzamentos ---
  x.fillStyle = 'rgba(226,226,220,0.82)';
  const barLen = 3.0, barW = 0.62, gap = 0.72;
  for (const a of CFG.ROADS) for (const b of CFG.ROADS) {
    for (const s of [-1, 1]) {
      // travessia perpendicular ao eixo X (na rua horizontal)
      const zEdge = b + s * (CFG.ROAD_HALF - 1.2);
      const dir = s > 0 ? 1 : -1;
      for (let t = -CFG.ROAD_HALF + 2; t < CFG.ROAD_HALF - 2; t += barW + gap) {
        x.fillRect(px(a + t), px(Math.min(zEdge, zEdge + dir * barLen)), barW * sc, barLen * sc);
      }
      const xEdge = a + s * (CFG.ROAD_HALF - 1.2);
      for (let t = -CFG.ROAD_HALF + 2; t < CFG.ROAD_HALF - 2; t += barW + gap) {
        x.fillRect(px(Math.min(xEdge, xEdge + dir * barLen)), px(b + t), barLen * sc, barW * sc);
      }
    }
  }

  // --- linha branca de bordo (junto ao meio-fio) ---
  x.fillStyle = 'rgba(225,225,218,0.55)';
  const ew = 0.22;
  for (const r of CFG.ROADS) {
    for (const s of [-1, 1]) {
      const p = px(r + s * (CFG.ROAD_HALF - 0.9));
      x.fillRect(0, p, SIZE, ew * sc);
      x.fillRect(p, 0, ew * sc, SIZE);
    }
  }

  // --- linha amarela dupla no centro ---
  x.fillStyle = 'rgba(226,178,44,0.85)';
  for (const r of CFG.ROADS) {
    const p = px(r);
    x.setLineDash([]);
    x.fillRect(0, p - 0.55 * sc, SIZE, 0.28 * sc);
    x.fillRect(0, p + 0.27 * sc, SIZE, 0.28 * sc);
    x.fillRect(p - 0.55 * sc, 0, 0.28 * sc, SIZE);
    x.fillRect(p + 0.27 * sc, 0, 0.28 * sc, SIZE);
  }

  // --- linhas tracejadas de divisão de faixa ---
  x.fillStyle = 'rgba(232,232,226,0.62)';
  x.setLineDash([3.2 * sc, 5.4 * sc]);
  x.lineWidth = 0.24 * sc;
  x.strokeStyle = 'rgba(232,232,226,0.62)';
  for (const r of CFG.ROADS) {
    for (const off of [-CFG.LANE * 2.35, CFG.LANE * 2.35]) {
      const p = px(r + off);
      x.beginPath(); x.moveTo(0, p); x.lineTo(SIZE, p); x.stroke();
      x.beginPath(); x.moveTo(p, 0); x.lineTo(p, SIZE); x.stroke();
    }
  }
  x.setLineDash([]);

  // --- setas de "siga" e linhas de retenção ---
  x.fillStyle = 'rgba(235,235,228,0.7)';
  for (const a of CFG.ROADS) for (const b of CFG.ROADS) {
    for (const s of [-1, 1]) {
      const stopZ = b + s * (CFG.ROAD_HALF - 0.2);
      x.fillRect(px(a - CFG.ROAD_HALF + 1.5), px(stopZ) - (s > 0 ? 0.6 * sc : 0), (CFG.ROAD_HALF - 3) * sc, 0.6 * sc);
      const stopX = a + s * (CFG.ROAD_HALF - 0.2);
      x.fillRect(px(stopX) - (s > 0 ? 0.6 * sc : 0), px(b - CFG.ROAD_HALF + 1.5), 0.6 * sc, (CFG.ROAD_HALF - 3) * sc);
    }
  }

  const t = tex(c, { aniso: 16 });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// ------------------------------------------------------------
//  pequenas texturas utilitárias
// ------------------------------------------------------------
export function makeGlowTexture(inner = 'rgba(255,255,255,1)') {
  const S = 128, c = canvas(S, S), x = c.getContext('2d');
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.28, 'rgba(255,255,255,0.42)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.10)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeBlobTexture() {
  const S = 64, c = canvas(S, S), x = c.getContext('2d');
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.75)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.32)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function makeRippleNormal() {
  const S = 256, c = canvas(S, S), x = c.getContext('2d');
  const img = x.createImageData(S, S);
  const rnd = mulberry32(99);
  const h = new Float32Array(S * S);
  for (let i = 0; i < 900; i++) {
    const cx = rnd() * S, cy = rnd() * S, r = 3 + rnd() * 12, a = 0.4 + rnd() * 0.9;
    for (let y = -r; y <= r; y++) for (let xx = -r; xx <= r; xx++) {
      const d = Math.hypot(xx, y); if (d > r) continue;
      const px = ((cx + xx + S) | 0) % S, py = ((cy + y + S) | 0) % S;
      h[py * S + px] += Math.cos((d / r) * Math.PI * 1.6) * a * (1 - d / r) * 0.28;
    }
  }
  const d = img.data;
  for (let y = 0; y < S; y++) for (let xx = 0; xx < S; xx++) {
    const k = y * S + xx;
    const dx = h[y * S + ((xx + 1) % S)] - h[y * S + ((xx - 1 + S) % S)];
    const dy = h[((y + 1) % S) * S + xx] - h[((y - 1 + S) % S) * S + xx];
    const nx = -dx * 1.4, ny = -dy * 1.4, nz = 1;
    const l = Math.hypot(nx, ny, nz);
    d[k * 4] = ((nx / l) * 0.5 + 0.5) * 255;
    d[k * 4 + 1] = ((ny / l) * 0.5 + 0.5) * 255;
    d[k * 4 + 2] = ((nz / l) * 0.5 + 0.5) * 255;
    d[k * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(90, 90);
  return t;
}

export function makeAsphaltRoughness() {
  const S = 256, c = canvas(S, S), x = c.getContext('2d');
  const img = x.createImageData(S, S); const rnd = mulberry32(5);
  for (let i = 0; i < S * S; i++) {
    const v = 40 + rnd() * 90;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = tex(c, { srgb: false, aniso: 4 });
  t.repeat.set(60, 60);
  return t;
}

// ------------------------------------------------------------
//  LETREIROS DE NEON
// ------------------------------------------------------------
const SIGN_WORDS = [
  'TÁXI 24H', 'BAR DO ZÉ', 'HOTEL', 'FARMÁCIA', 'LANCHES', 'CAFÉ', 'PIZZARIA',
  'PAPELARIA', 'BORRACHARIA', 'OPEN', 'MERCADO', 'DANCETERIA', 'JOALHERIA',
  'RESTAURANTE', 'CINE', 'PARKING', 'CELULARES', 'ÓTICA', 'PADARIA', 'AÇOUGUE',
  'LAUNDRY', 'RAMEN', 'BURGER', 'CLÍNICA', 'ACADEMIA', 'GAMES', 'MODAS', 'ÓCULOS',
];
export const SIGN_COLORS = [
  '#ff2d6f', '#22e0ff', '#ff9f1c', '#b46bff', '#39ff88', '#ffe94a',
];

export function makeSignTexture(text, color) {
  const W = 512, H = 128, c = canvas(W, H), x = c.getContext('2d');
  x.clearRect(0, 0, W, H);
  x.fillStyle = 'rgba(6,6,10,0.92)';
  roundRect(x, 4, 4, W - 8, H - 8, 14); x.fill();
  x.strokeStyle = color; x.lineWidth = 5;
  roundRect(x, 10, 10, W - 20, H - 20, 10); x.stroke();
  x.font = 'bold 62px "Trebuchet MS", system-ui, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.shadowColor = color; x.shadowBlur = 26;
  x.fillStyle = '#ffffff';
  x.fillText(text, W / 2, H / 2 + 2);
  x.shadowBlur = 12; x.fillStyle = color;
  x.fillText(text, W / 2, H / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function roundRect(x, a, b, w, h, r) {
  x.beginPath();
  x.moveTo(a + r, b);
  x.arcTo(a + w, b, a + w, b + h, r);
  x.arcTo(a + w, b + h, a, b + h, r);
  x.arcTo(a, b + h, a, b, r);
  x.arcTo(a, b, a + w, b, r);
  x.closePath();
}
