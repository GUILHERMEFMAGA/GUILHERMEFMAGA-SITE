'use strict';
/* =========================================================
   Geração da cidade (tiles, ruas, quarteirões, postes...)
   O mapa é fixo (semente constante) para todo jogador ver a mesma cidade.
   ========================================================= */

const TL = {
  VOID: 0, ROAD: 1, SIDEWALK: 2, BUILDING: 3, GRASS: 4, PATH: 5, WATER: 6, QUAY: 7,
  BRIDGE: 8, RAIL: 9, TREE: 10, ALLEY: 11, DOCK: 12, COURT: 13, LOT: 14, GARAGE: 15, PLAZA: 16,
  FOUNTAIN: 17,
};
const SOLID = new Uint8Array(32);
[TL.BUILDING, TL.WATER, TL.QUAY, TL.RAIL, TL.TREE, TL.FOUNTAIN].forEach((t) => (SOLID[t] = 1));
const PED_OK = new Uint8Array(32);
[TL.SIDEWALK, TL.PATH, TL.PLAZA, TL.DOCK, TL.COURT].forEach((t) => (PED_OK[t] = 1));
const F_CROSS = 1;     // faixa de pedestre
const F_CROSS_V = 2;   // listras verticais (atravessa rua vertical)
const F_NODE = 4;      // dentro de um cruzamento

// Ruas: 4 tiles de largura (2 faixas por sentido, mão inglesa NÃO — mão direita)
const VROADS = [
  { x: 8, y0: 6, y1: 94 }, { x: 30, y0: 6, y1: 94 }, { x: 52, y0: 6, y1: 94 }, { x: 74, y0: 6, y1: 94 },
  { x: 118, y0: 6, y1: 94 }, { x: 140, y0: 6, y1: 94 },
];
const HROADS = [
  { y: 6, x0: 8, x1: 78 }, { y: 27, x0: 8, x1: 78 }, { y: 48, x0: 8, x1: 122 },
  { y: 69, x0: 8, x1: 78 }, { y: 90, x0: 8, x1: 78 },
  { y: 6, x0: 118, x1: 144 }, { y: 27, x0: 118, x1: 144 }, { y: 69, x0: 118, x1: 144 }, { y: 90, x0: 118, x1: 144 },
];
VROADS.forEach((v, i) => { v.vertical = true; v.id = 'v' + i; v.start = v.y0 * T; v.end = v.y1 * T; v.nodes = []; });
HROADS.forEach((h, i) => { h.vertical = false; h.id = 'h' + i; h.start = h.x0 * T; h.end = h.x1 * T; h.nodes = []; });

const RIVER_X0 = 87, RIVER_X1 = 112; // água do rio (inclusive)
const BRIDGE_Y = 48;

const City = {
  tile: null, flags: null, bid: null,
  buildings: [], lamps: [], neons: [], skylights: [], trees: [], boats: [], benches: [],
  phones: [], dropPoints: [], pickupSpots: [], parked: [], nodes: [],
  spots: {}, court: null, fountain: null, garage: null, portGarage: null,
};

function tileAt(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return TL.BUILDING;
  return City.tile[y * MAP_W + x];
}
function flagAt(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return 0;
  return City.flags[y * MAP_W + x];
}
function solidPx(px, py) { return SOLID[tileAt(Math.floor(px / T), Math.floor(py / T))] === 1; }
function pedWalkable(tx, ty) {
  const t = tileAt(tx, ty);
  return PED_OK[t] === 1 || ((t === TL.ROAD) && (flagAt(tx, ty) & F_CROSS));
}

function computeNodes(r) {
  const nodes = [];
  for (const v of VROADS) {
    for (const h of HROADS) {
      if (v.x >= h.x0 && v.x + 4 <= h.x1 && h.y >= v.y0 && h.y + 4 <= v.y1) {
        const exits = [v.x + 4 < h.x1, h.y + 4 < v.y1, v.x > h.x0, h.y > v.y0];
        const n = exits.filter(Boolean).length;
        const node = {
          id: nodes.length, v, h, vx: v.x, hy: h.y,
          x0: v.x * T, y0: h.y * T, x1: (v.x + 4) * T, y1: (h.y + 4) * T,
          cx: (v.x + 2) * T, cy: (h.y + 2) * T,
          exits, nExits: n, lights: n >= 3, offset: r() * 16, links: [],
        };
        nodes.push(node);
        v.nodes.push(node);
        h.nodes.push(node);
      }
    }
  }
  for (const v of VROADS) v.nodes.sort((a, b) => a.hy - b.hy);
  for (const h of HROADS) h.nodes.sort((a, b) => a.vx - b.vx);
  // grafo (para a perseguição policial)
  for (const road of [...VROADS, ...HROADS]) {
    for (let i = 0; i + 1 < road.nodes.length; i++) {
      const a = road.nodes[i], b = road.nodes[i + 1];
      a.links.push(b); b.links.push(a);
    }
  }
  return nodes;
}

function genCity() {
  const r = mulberry32(1997);
  const ri = (a, b) => a + Math.floor(r() * (b - a + 1));
  const tile = new Uint8Array(MAP_W * MAP_H).fill(TL.BUILDING);
  const flags = new Uint8Array(MAP_W * MAP_H);
  const bid = new Int16Array(MAP_W * MAP_H).fill(-1);
  City.tile = tile; City.flags = flags; City.bid = bid;
  const inb = (x, y) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
  const set = (x, y, t) => { if (inb(x, y)) tile[y * MAP_W + x] = t; };
  const get = (x, y) => tileAt(x, y);
  const fillRect = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t); };

  // --- Orla, rio e ilha leste ---
  const pathX = (y) => {
    if (y >= 30 && y <= 44) return 81;
    const s = Math.sin(y * 0.33);
    return s > 0.35 ? 82 : s < -0.35 ? 80 : 81;
  };
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 79; x <= 85; x++) set(x, y, TL.GRASS);
    const px = pathX(y);
    set(px, y, TL.PATH); set(px + 1, y, TL.PATH);
    set(86, y, TL.QUAY);
    for (let x = RIVER_X0; x <= RIVER_X1; x++) set(x, y, TL.WATER);
    set(113, y, TL.QUAY);
    if (y >= 5 && y <= 94) { set(114, y, TL.PATH); set(115, y, TL.GRASS); set(116, y, TL.GRASS); }
  }
  // Canal com passarela
  for (let y = 33; y <= 41; y++) for (let x = 79; x <= 86; x++) set(x, y, TL.QUAY);
  for (let y = 34; y <= 40; y++) {
    for (let x = 80; x <= 86; x++) set(x, y, TL.WATER);
    set(81, y, TL.DOCK); set(82, y, TL.DOCK);
  }
  set(81, 33, TL.PATH); set(82, 33, TL.PATH); set(81, 41, TL.PATH); set(82, 41, TL.PATH);
  // Píer
  for (let y = 74; y <= 76; y++) {
    for (let x = 79; x <= 85; x++) set(x, y, TL.PATH);
    for (let x = 86; x <= 97; x++) set(x, y, TL.DOCK);
  }
  City.pier = { x0: 86 * T, y0: 74 * T, x1: 98 * T, y1: 77 * T };

  // --- Ruas ---
  const isRiver = (x) => x >= RIVER_X0 && x <= RIVER_X1;
  for (const v of VROADS) for (let y = v.y0; y < v.y1; y++) for (let x = v.x; x < v.x + 4; x++) set(x, y, TL.ROAD);
  for (const h of HROADS) for (let x = h.x0; x < h.x1; x++) for (let y = h.y; y < h.y + 4; y++) set(x, y, isRiver(x) ? TL.BRIDGE : TL.ROAD);
  for (let x = RIVER_X0; x <= RIVER_X1; x++) { set(x, BRIDGE_Y - 1, TL.RAIL); set(x, BRIDGE_Y + 4, TL.RAIL); }

  // --- Calçadas: todo terreno encostado numa rua ---
  const sw = [];
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const t = get(x, y);
      if (t !== TL.BUILDING && t !== TL.GRASS && t !== TL.PATH) continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (get(x + dx, y + dy) === TL.ROAD) { near = true; break; }
      if (near) sw.push(x, y);
    }
  }
  for (let i = 0; i < sw.length; i += 2) set(sw[i], sw[i + 1], TL.SIDEWALK);

  // --- Cruzamentos e faixas de pedestre ---
  City.nodes = computeNodes(r);
  for (const n of City.nodes) {
    const arms = [];
    if (n.exits[3]) for (let x = n.vx; x < n.vx + 4; x++) arms.push([x, n.hy - 1, F_CROSS_V]);
    if (n.exits[1]) for (let x = n.vx; x < n.vx + 4; x++) arms.push([x, n.hy + 4, F_CROSS_V]);
    if (n.exits[2]) for (let y = n.hy; y < n.hy + 4; y++) arms.push([n.vx - 1, y, 0]);
    if (n.exits[0]) for (let y = n.hy; y < n.hy + 4; y++) arms.push([n.vx + 4, y, 0]);
    for (const [x, y, f] of arms) if (get(x, y) === TL.ROAD) flags[y * MAP_W + x] |= F_CROSS | f;
    for (let y = n.hy; y < n.hy + 4; y++) for (let x = n.vx; x < n.vx + 4; x++) flags[y * MAP_W + x] |= F_NODE;
  }

  // --- Prédios ---
  const palette = [
    [62, 60, 72], [72, 62, 60], [58, 66, 72], [76, 70, 62], [54, 58, 70], [66, 66, 76],
    [80, 72, 66], [60, 70, 66], [70, 64, 78], [86, 80, 74],
  ];
  const addBuilding = (x, y, w, h, kind = 'normal', color = null) => {
    const b = { id: City.buildings.length, x, y, w, h, kind, color: color || palette[ri(0, palette.length - 1)], seed: ri(1, 1e9) };
    City.buildings.push(b);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { set(xx, yy, TL.BUILDING); bid[yy * MAP_W + xx] = b.id; }
    return b;
  };
  const bsp = (x, y, w, h) => {
    if (w <= 0 || h <= 0) return;
    const maxS = 8 + ri(0, 5);
    if ((w <= maxS && h <= maxS) || (w < 6 && h < 6)) { addBuilding(x, y, w, h); return; }
    const splitV = w > h ? true : h > w ? false : r() < 0.5;
    const size = splitV ? w : h;
    const alley = r() < 0.3 && size >= 11;
    const s = Math.max(3, Math.floor(size * (0.35 + r() * 0.3)));
    if (splitV) {
      bsp(x, y, s, h);
      if (alley) { fillRect(x + s, y, x + s, y + h - 1, TL.ALLEY); bsp(x + s + 1, y, w - s - 1, h); } else bsp(x + s, y, w - s, h);
    } else {
      bsp(x, y, w, s);
      if (alley) { fillRect(x, y + s, x + w - 1, y + s, TL.ALLEY); bsp(x, y + s + 1, w, h - s - 1); } else bsp(x, y + s, w, h - s);
    }
  };

  // Faixas externas (preenchimento até a borda do mapa)
  bsp(0, 0, 7, 50); bsp(0, 50, 7, 50);
  bsp(7, 0, 36, 5); bsp(43, 0, 36, 5);
  bsp(7, 95, 36, 5); bsp(43, 95, 36, 5);
  bsp(114, 0, 36, 5); bsp(114, 95, 36, 5);
  bsp(145, 5, 5, 45); bsp(145, 50, 5, 45);

  const cityCols = [[13, 28], [35, 50], [57, 72]];
  const cityRows = [[11, 25], [32, 46], [53, 67], [74, 88]];

  for (let ci = 0; ci < 3; ci++) {
    for (let rj = 0; rj < 4; rj++) {
      const [x0, x1] = cityCols[ci], [y0, y1] = cityRows[rj];
      const w = x1 - x0 + 1, h = y1 - y0 + 1;
      if (ci === 0 && rj === 1) { buildPark(x0, y0, x1, y1); continue; }
      if (ci === 2 && rj === 0) {
        addBuilding(x0, y0, w, 9, 'police', [44, 54, 86]);
        fillRect(x0, y0 + 9, x1, y1, TL.LOT);
        City.policeLot = { x0, y0: y0 + 9, x1, y1 };
        for (let k = 0; k < 3; k++) City.parked.push({ type: 'police', x: (x0 + 3 + k * 4) * T, y: (y0 + 12) * T, angle: -Math.PI / 2 });
        continue;
      }
      if (ci === 1 && rj === 3) {
        addBuilding(x0, y0, w, 11, 'hospital', [196, 196, 204]);
        fillRect(x0, y0 + 11, x1, y1, TL.PLAZA);
        City.parked.push({ type: 'ambulance', x: (x0 + 3) * T, y: (y0 + 13) * T, angle: 0 });
        continue;
      }
      if (ci === 0 && rj === 3) {
        bsp(x0, y0, 7, h);
        const g = addBuilding(x0 + 8, y0 + 3, 8, 8, 'garage', [70, 70, 78]);
        for (let y = y0 + 5; y <= y0 + 7; y++) for (let x = x0 + 13; x <= x1; x++) { set(x, y, TL.GARAGE); bid[y * MAP_W + x] = -1; }
        City.garage = { x0: (x0 + 13) * T, y0: (y0 + 5) * T, x1: (x1 + 1) * T, y1: (y0 + 8) * T, building: g };
        fillRect(x0 + 7, y0, x0 + 7, y1, TL.ALLEY);
        bsp(x0 + 8, y0, 8, 3);
        bsp(x0 + 8, y0 + 11, 8, h - 11);
        continue;
      }
      if (ci === 1 && rj === 1) {
        bsp(x0, y0, w, 7);
        fillRect(x0, y0 + 7, x1, y1, TL.PLAZA);
        City.fountain = { x: (x0 + w / 2) * T, y: (y0 + 11) * T };
        for (let y = y0 + 10; y <= y0 + 11; y++) for (let x = x0 + w / 2 - 1; x <= x0 + w / 2; x++) set(x, y, TL.FOUNTAIN);
        City.plaza = { x0, y0: y0 + 7, x1, y1 };
        continue;
      }
      bsp(x0, y0, w, h);
    }
  }

  // Ilha Leste
  const eCols = [123, 138];
  bsp(eCols[0], 11, 16, 15);
  fillRect(eCols[0], 32, eCols[1], 41, TL.LOT);
  City.portLot = { x0: eCols[0], y0: 32, x1: eCols[1], y1: 41 };
  City.portGarage = { x: 131 * T, y: 36 * T + 8 };
  for (let k = 0; k < 3; k++) City.parked.push({ type: pick3(r, ['sedan', 'compact', 'van']), x: (124 + k * 3) * T + 8, y: 33 * T + 10, angle: Math.PI / 2 });
  bsp(eCols[0], 42, 16, 26);
  bsp(eCols[0], 74, 16, 15);

  function pick3(rr, arr) { return arr[Math.floor(rr() * arr.length)]; }

  function buildPark(x0, y0, x1, y1) {
    fillRect(x0, y0, x1, y1, TL.GRASS);
    // caminhos
    for (let x = x0; x <= x1; x++) { set(x, y0 + 1, TL.PATH); set(x, y1 - 1, TL.PATH); }
    for (let y = y0; y <= y1; y++) { set(x0 + 1, y, TL.PATH); set(x1 - 1, y, TL.PATH); }
    for (let x = x0; x <= x1; x++) set(x, y0 + 7, TL.PATH);
    // ligações com a calçada
    set(x0 + 1, y0 - 0, TL.PATH); set(x1, y0 + 7, TL.PATH); set(x0, y0 + 7, TL.PATH);
    // quadra de basquete
    City.court = { x0: x0 + 3, y0: y0 + 9, x1: x0 + 8, y1: y1 - 3 };
    fillRect(City.court.x0, City.court.y0, City.court.x1, City.court.y1, TL.COURT);
    // estacionamento do parque
    fillRect(x1 - 4, y0 + 2, x1 - 2, y0 + 5, TL.LOT);
    set(x1 - 1, y0 + 3, TL.LOT); set(x1 - 1, y0 + 4, TL.LOT); set(x1, y0 + 3, TL.LOT); set(x1, y0 + 4, TL.LOT);
    City.parkLot = { x0: x1 - 4, y0: y0 + 2, x1: x1, y1: y0 + 5 };
    City.parked.push({ type: 'sport', x: (x1 - 3) * T + 8, y: (y0 + 3) * T + 8, angle: 0, start: true });
    City.parked.push({ type: 'sedan', x: (x1 - 3) * T + 8, y: (y0 + 5) * T + 2, angle: 0 });
    // árvores
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (get(x, y) !== TL.GRASS) continue;
        const nearPath = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => get(x + dx, y + dy) === TL.COURT || get(x + dx, y + dy) === TL.LOT);
        if (!nearPath && r() < 0.42) addTree(x, y, ri(6, 8));
      }
    }
    for (let k = 0; k < 6; k++) City.benches.push({ x: (x0 + 3 + k * 2) * T + 4, y: (y0 + 7) * T + 1, vertical: false });
  }

  function addTree(tx, ty, rad) {
    set(tx, ty, TL.TREE);
    City.trees.push({ x: tx * T + 8 + ri(-1, 1), y: ty * T + 8 + ri(-1, 1), r: rad, seed: ri(0, 1e6) });
  }

  // Árvores da orla e da ilha
  for (let y = 0; y < MAP_H; y++) {
    if (get(79, y) === TL.GRASS && y % 3 === 0) addTree(79, y, ri(6, 8));
    if (get(85, y) === TL.GRASS && y % 3 === 1 && !(y >= 72 && y <= 78)) addTree(85, y, ri(6, 7));
    if (get(116, y) === TL.GRASS && y % 3 === 2) addTree(116, y, ri(6, 8));
  }
  for (let y = 5; y <= 94; y += 7) for (const x of [80, 84]) if (get(x, y) === TL.GRASS) City.benches.push({ x: x * T + 4, y: y * T + 4, vertical: true });

  // --- Letreiros de neon ---
  const neonColors = [[255, 60, 190], [60, 230, 255], [176, 96, 255], [255, 80, 120], [90, 255, 170], [255, 180, 60]];
  for (const b of City.buildings) {
    if (b.kind !== 'normal') continue;
    const sides = [];
    for (let x = b.x; x < b.x + b.w; x++) { if (get(x, b.y - 1) === TL.SIDEWALK) { sides.push('n'); break; } }
    for (let x = b.x; x < b.x + b.w; x++) { if (get(x, b.y + b.h) === TL.SIDEWALK) { sides.push('s'); break; } }
    for (let y = b.y; y < b.y + b.h; y++) { if (get(b.x - 1, y) === TL.SIDEWALK) { sides.push('w'); break; } }
    for (let y = b.y; y < b.y + b.h; y++) { if (get(b.x + b.w, y) === TL.SIDEWALK) { sides.push('e'); break; } }
    for (const s of sides) {
      if (r() > 0.32) continue;
      const c = neonColors[ri(0, neonColors.length - 1)];
      const len = ri(8, 18);
      if (s === 'n' || s === 's') {
        const x = b.x * T + ri(3, Math.max(3, b.w * T - len - 3));
        const y = s === 'n' ? b.y * T + 1 : (b.y + b.h) * T - 3;
        City.neons.push({ x, y, w: len, h: 2, c, flicker: r() < 0.15, ph: r() * 10 });
      } else {
        const y = b.y * T + ri(3, Math.max(3, b.h * T - len - 3));
        const x = s === 'w' ? b.x * T + 1 : (b.x + b.w) * T - 3;
        City.neons.push({ x, y, w: 2, h: len, c, flicker: r() < 0.15, ph: r() * 10 });
      }
    }
  }

  // --- Postes de luz ---
  const lampOk = (px, py) => City.lamps.every((l) => Math.abs(l.x - px) + Math.abs(l.y - py) > 30);
  const addLamp = (px, py, kind = 'street', dir = 0) => { if (lampOk(px, py)) City.lamps.push({ x: px, y: py, kind, dir, ph: r() * 100, broken: r() < 0.02 }); };
  const isSw = (x, y) => get(x, y) === TL.SIDEWALK && !(flagAt(x, y) & F_CROSS);
  for (const v of VROADS) {
    for (let y = v.y0; y < v.y1; y++) {
      if ((y - v.y0) % 4 !== 2) continue;
      if (isSw(v.x - 1, y)) addLamp((v.x - 1) * T + 12, y * T + 8, 'street', 0);
      if (isSw(v.x + 4, y)) addLamp((v.x + 4) * T + 4, y * T + 8, 'street', 2);
    }
  }
  for (const h of HROADS) {
    for (let x = h.x0; x < h.x1; x++) {
      if ((x - h.x0) % 4 !== 2) continue;
      if (isSw(x, h.y - 1)) addLamp(x * T + 8, (h.y - 1) * T + 12, 'street', 1);
      if (isSw(x, h.y + 4)) addLamp(x * T + 8, (h.y + 4) * T + 4, 'street', 3);
    }
  }
  for (let x = RIVER_X0 + 1; x <= RIVER_X1; x += 4) {
    City.lamps.push({ x: x * T + 8, y: (BRIDGE_Y - 1) * T + 11, kind: 'bridgeN', dir: 1, ph: r() * 100 });
    City.lamps.push({ x: x * T + 8, y: (BRIDGE_Y + 4) * T + 5, kind: 'bridgeS', dir: 3, ph: r() * 100 });
  }
  for (let y = 2; y < MAP_H; y += 5) {
    if (get(85, y) === TL.GRASS || get(85, y) === TL.PATH) addLamp(85 * T + 11, y * T + 8, 'quayW');
    if (get(114, y) === TL.PATH) addLamp(114 * T + 4, y * T + 8, 'quayE');
  }
  for (let x = 88; x <= 97; x += 3) { addLamp(x * T + 8, 74 * T + 3, 'pier'); addLamp(x * T + 8, 76 * T + 13, 'pier'); }
  // parque e praça
  if (City.court) {
    const c = City.court;
    addLamp(c.x0 * T - 4, c.y0 * T - 4, 'park'); addLamp((c.x1 + 1) * T + 4, c.y0 * T - 4, 'park');
    addLamp(c.x0 * T - 4, (c.y1 + 1) * T + 4, 'park'); addLamp((c.x1 + 1) * T + 4, (c.y1 + 1) * T + 4, 'park');
  }
  for (const [x, y] of [[14, 33], [27, 33], [14, 45], [27, 45], [20, 39]]) addLamp(x * T + 8, y * T + 8, 'park');
  if (City.plaza) {
    const p = City.plaza;
    for (let x = p.x0 + 1; x <= p.x1; x += 5) { addLamp(x * T + 8, (p.y0) * T + 6, 'park'); addLamp(x * T + 8, (p.y1) * T + 10, 'park'); }
  }

  // --- Barcos ---
  const boatColors = [[220, 220, 228], [60, 110, 200], [200, 60, 60], [230, 200, 80], [240, 240, 240]];
  for (let x = 88; x <= 96; x += 4) {
    City.boats.push({ x: x * T + 6, y: 73 * T + 6, len: 26, wid: 10, a: 0, c: boatColors[ri(0, 4)], ph: r() * 6 });
    City.boats.push({ x: x * T + 10, y: 77 * T + 10, len: 22, wid: 9, a: Math.PI, c: boatColors[ri(0, 4)], ph: r() * 6 });
  }
  for (let y = 12; y < 92; y += 13) {
    if (y >= 44 && y <= 56) continue;
    if (y >= 68 && y <= 80) continue;
    City.boats.push({ x: 87 * T + 9, y: y * T, len: 24, wid: 9, a: Math.PI / 2, c: boatColors[ri(0, 4)], ph: r() * 6 });
    City.boats.push({ x: 112 * T + 7, y: (y + 5) * T, len: 20, wid: 8, a: -Math.PI / 2, c: boatColors[ri(0, 4)], ph: r() * 6 });
  }

  // --- Orelhões (missões) ---
  const nearestSidewalk = (tx, ty) => {
    for (let rad = 0; rad < 8; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (isSw(tx + dx, ty + dy)) return [tx + dx, ty + dy];
    }
    return [tx, ty];
  };
  for (const [tx, ty] of [[29, 18], [56, 40], [122, 60], [44, 73], [78, 20], [12, 60]]) {
    const [x, y] = nearestSidewalk(tx, ty);
    City.phones.push({ x: x * T + 8, y: y * T + 8, ring: r() * 3 });
  }

  // --- Pontos de entrega (calçadas na beira da rua) ---
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    if (!isSw(x, y)) continue;
    const nearRoad = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => get(x + dx, y + dy) === TL.ROAD);
    if (nearRoad && (x + y * 3) % 5 === 0) City.dropPoints.push({ x: x * T + 8, y: y * T + 8 });
    if ((x * 7 + y * 13) % 41 === 0) City.pickupSpots.push({ x: x * T + 8, y: y * T + 8 });
  }

  City.spots.hospital = { x: 42 * T + 8, y: 89 * T + 8 };
  City.spots.police = { x: 64 * T + 8, y: 26 * T + 8 };
  City.spots.start = { x: 29 * T + 8, y: 35 * T + 8 };
}

function districtName(px, py) {
  const x = px / T, y = py / T;
  if (x >= 113) return 'Ilha Leste';
  if (x >= 79) return 'Orla';
  if (x >= 12 && x <= 29 && y >= 31 && y <= 47) return 'Parque Central';
  if (x < 30) return 'Vila Oeste';
  if (x < 52) return y > 69 ? 'Hospital Central' : 'Centro';
  return y < 27 ? 'Delegacia' : 'Distrito Neon';
}
