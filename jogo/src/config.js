// ============================================================
//  CIDADE DOURADA — configuração global e utilitários
// ============================================================

export const CFG = {
  // --- malha urbana (unidades = metros) ---
  SPACING: 340,          // distância entre eixos de ruas
  BLOCKS: 6,             // 6x6 quarteirões
  ROAD_HALF: 18,         // meia largura do asfalto
  SIDEWALK: 8,           // largura da calçada
  LANE: 4,               // deslocamento do centro da faixa

  // --- jogo ---
  START_TIME: 150,
  TIME_PER_DELIVERY: 14,
  PICKUP_RADIUS: 10.5,
  DELIVER_RADIUS: 10.5,

  // --- físico do carro ---
  MAX_SPEED: 36,         // ~130 km/h
  REVERSE_MAX: -12,
  ACCEL: 17,
  BRAKE: 30,
  DRAG: 0.32,
  ROLL: 3.2,
  STEER_MAX: 0.62,

  QUALITY: 'high',
};

// meio-mundo (limite da cidade)
CFG.N_ROADS = CFG.BLOCKS + 1;
CFG.SPAN = CFG.BLOCKS * CFG.SPACING;
CFG.HALF = CFG.SPAN / 2 + CFG.SPACING * 0.42;

// posições (centro) das ruas, nos dois eixos
CFG.ROADS = [];
for (let i = 0; i < CFG.N_ROADS; i++) CFG.ROADS.push(-CFG.SPAN / 2 + i * CFG.SPACING);

// ------- presets de qualidade -------
export const QUALITY = {
  high: {
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    shadow: 2048, carShadow: 1024,
    traffic: 74, rain: 5200, splash: 340,
    bloom: true, bloomStrength: 0.62,
    peds: 90, lamps: 1.0, signs: 34, coins: 70,
    drawDistance: 3400,
  },
  medium: {
    dpr: Math.min(window.devicePixelRatio || 1, 1.5),
    shadow: 1024, carShadow: 512,
    traffic: 46, rain: 2600, splash: 160,
    bloom: true, bloomStrength: 0.5,
    peds: 50, lamps: 0.8, signs: 24, coins: 50,
    drawDistance: 2600,
  },
  low: {
    dpr: 1,
    shadow: 0, carShadow: 0,
    traffic: 24, rain: 900, splash: 0,
    bloom: false, bloomStrength: 0,
    peds: 22, lamps: 0.55, signs: 14, coins: 34,
    drawDistance: 1700,
  },
};

// ------- aleatório com semente (cidade sempre coerente) -------
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, l, dt) => lerp(a, b, 1 - Math.exp(-l * dt));
export const TAU = Math.PI * 2;

// rua mais próxima de uma coordenada
export function nearestRoad(v) {
  let best = CFG.ROADS[0], bd = Infinity;
  for (const r of CFG.ROADS) { const d = Math.abs(r - v); if (d < bd) { bd = d; best = r; } }
  return best;
}

// ponto aleatório sobre uma calçada (usado em missões e moedas)
export function randomSidewalkPoint(rnd) {
  const i = Math.floor(rnd() * CFG.BLOCKS);
  const j = Math.floor(rnd() * CFG.BLOCKS);
  const cx = -CFG.SPAN / 2 + CFG.SPACING / 2 + i * CFG.SPACING;
  const cz = -CFG.SPAN / 2 + CFG.SPACING / 2 + j * CFG.SPACING;
  const inner = CFG.SPACING / 2 - CFG.ROAD_HALF;
  const sw = inner - CFG.SIDEWALK / 2;
  const side = Math.floor(rnd() * 4);
  const t = (rnd() * 2 - 1) * (sw - 12);
  if (side === 0) return { x: cx + t, z: cz - sw, nx: 0, nz: 1 };
  if (side === 1) return { x: cx + t, z: cz + sw, nx: 0, nz: -1 };
  if (side === 2) return { x: cx - sw, z: cz + t, nx: 1, nz: 0 };
  return { x: cx + sw, z: cz + t, nx: -1, nz: 0 };
}
