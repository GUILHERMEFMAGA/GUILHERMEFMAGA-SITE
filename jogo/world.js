/* ============================================================
   world.js — o mapa da cidade (tiles, prédios, parques, rio)
   e o desenho do cenário no estilo GTA 1 / GTA 2.
   Tudo é desenhado por código; o cenário é "fotografado" em
   pedaços (chunks) uma vez só para o jogo ficar leve.
   ============================================================ */
(function (G) {
  'use strict';

  // ---------- Medidas do mapa ----------
  const T = 32;          // tamanho de um tile em pixels
  const ROAD = 6;        // largura da rua (tiles) = 2 faixas de 3 tiles
  const BLOCK = 12;      // lado de uma quadra (tiles)
  const PITCH = ROAD + BLOCK;
  const COLS = 6, ROWS = 4;  // quadras na horizontal / vertical
  const RIVER = 3;       // coluna de quadras ocupada pelo rio
  const MG = 6;          // margem fora das ruas (calçada + prédios)
  const INNER_W = COLS * PITCH + ROAD;
  const INNER_H = ROWS * PITCH + ROAD;
  const TW = INNER_W + MG * 2, TH = INNER_H + MG * 2;
  const W = TW * T, H = TH * T;

  // tipos de tile
  const TILE = { ROAD: 0, SIDE: 1, BUILD: 2, GRASS: 3, WATER: 4, BRIDGE: 5, CROSS: 6 };

  const tiles = new Uint8Array(TW * TH).fill(TILE.BUILD);
  const setRect = (tx, ty, tw, th, type) => {
    for (let y = ty; y < ty + th; y++) for (let x = tx; x < tx + tw; x++) tiles[y * TW + x] = type;
  };

  // ---------- Aleatório com semente (a cidade é sempre a mesma) ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(19970101);

  // ---------- Coordenadas úteis ----------
  const roadLeft = i => (MG + i * PITCH) * T;           // x da borda esquerda da rua vertical i
  const roadTop = j => (MG + j * PITCH) * T;            // y da borda de cima da rua horizontal j
  const nodeX = i => (MG + i * PITCH + ROAD / 2) * T;   // centro do cruzamento
  const nodeY = j => (MG + j * PITCH + ROAD / 2) * T;
  // faixas (mão direita, como no Brasil)
  const laneV = (i, dir) => roadLeft(i) + (dir > 0 ? 1.5 : 4.5) * T;  // dir>0 = descendo
  const laneH = (j, dir) => roadTop(j) + (dir > 0 ? 4.5 : 1.5) * T;   // dir>0 = indo p/ direita

  // ---------- Estilos de telhado ----------
  const ROOFS = [
    { kind: 'flat', base: '#7b5b3f', edge: '#a58665', dark: '#5a412d' },
    { kind: 'flat', base: '#8d8d98', edge: '#b9b9c4', dark: '#6b6b77' },
    { kind: 'flat', base: '#c7b38b', edge: '#e4d5b0', dark: '#a4906a' },
    { kind: 'tile', base: '#d9782d', edge: '#f39c52', dark: '#b05713' },
    { kind: 'tile', base: '#b5382b', edge: '#da5d4c', dark: '#89231a' },
    { kind: 'tile', base: '#4a7cb3', edge: '#6b9dd2', dark: '#33587f' },
    { kind: 'tile', base: '#c4622e', edge: '#e5844f', dark: '#9b4519' },
    { kind: 'flat', base: '#6d7d6b', edge: '#93a590', dark: '#506050' },
  ];

  const buildings = [];
  const trees = [];
  const lamps = [];
  const ponds = [];
  const blocks = [];

  function addBuilding(x, y, w, h, forceRoof) {
    const p = ROOFS[forceRoof != null ? forceRoof : Math.floor(rnd() * ROOFS.length)];
    const b = { x, y, w, h, p, ridge: w >= h ? 'h' : 'v', det: [] };
    if (p.kind === 'flat') {
      const n = 1 + Math.floor(rnd() * 3);
      for (let k = 0; k < n; k++) {
        b.det.push({ fx: 0.2 + rnd() * 0.6, fy: 0.2 + rnd() * 0.6, t: ['ac', 'sky', 'tank', 'ac'][Math.floor(rnd() * 4)] });
      }
    } else if (rnd() < 0.5) {
      b.det.push({ fx: 0.25 + rnd() * 0.5, fy: 0.3 + rnd() * 0.4, t: 'chim' });
    }
    buildings.push(b);
  }

  // divide uma área (em tiles) em prédios
  function partition(tx, ty, tw, th) {
    const r = rnd();
    const add = (a, b, c, d) => addBuilding(a * T + 5, b * T + 5, c * T - 10, d * T - 10);
    if (r < 0.2) add(tx, ty, tw, th);
    else if (r < 0.4) { add(tx, ty, tw / 2, th); add(tx + tw / 2, ty, tw / 2, th); }
    else if (r < 0.6) { add(tx, ty, tw, th / 2); add(tx, ty + th / 2, tw, th / 2); }
    else if (r < 0.8) { add(tx, ty, tw / 2, th / 2); add(tx + tw / 2, ty, tw / 2, th / 2); add(tx, ty + th / 2, tw / 2, th / 2); add(tx + tw / 2, ty + th / 2, tw / 2, th / 2); }
    else { add(tx, ty, tw, th / 2); add(tx, ty + th / 2, tw / 2, th / 2); add(tx + tw / 2, ty + th / 2, tw / 2, th / 2); }
  }

  // ---------- Montagem do mapa ----------
  // calçada em volta de tudo + ruas
  setRect(MG - 2, MG - 2, INNER_W + 4, INNER_H + 4, TILE.SIDE);
  setRect(MG, MG, INNER_W, INNER_H, TILE.ROAD);

  const PARKS = [[1, 1], [5, 3]];
  for (let by = 0; by < ROWS; by++) {
    for (let bx = 0; bx < COLS; bx++) {
      const tx = MG + ROAD + bx * PITCH, ty = MG + ROAD + by * PITCH;
      let kind = 'city';
      if (bx === RIVER) kind = 'river';
      else if (PARKS.some(p => p[0] === bx && p[1] === by)) kind = 'park';
      const blk = { bx, by, tx, ty, x: tx * T, y: ty * T, w: BLOCK * T, h: BLOCK * T, kind };
      blocks.push(blk);
      if (kind === 'river') {
        setRect(tx, ty, BLOCK, BLOCK, TILE.WATER);
      } else {
        setRect(tx, ty, BLOCK, BLOCK, TILE.SIDE);
        if (kind === 'city') {
          setRect(tx + 2, ty + 2, 8, 8, TILE.BUILD);
          partition(tx + 2, ty + 2, 8, 8);
        } else {
          setRect(tx + 2, ty + 2, 8, 8, TILE.GRASS);
          // lago
          const cx = tx + 6, cy = ty + 6;
          for (let y = ty + 2; y < ty + 10; y++) for (let x = tx + 2; x < tx + 10; x++) {
            const dx = (x + 0.5 - cx) / 2.6, dy = (y + 0.5 - cy) / 2.0;
            if (dx * dx + dy * dy <= 1) tiles[y * TW + x] = TILE.WATER;
          }
          ponds.push({ x: cx * T, y: cy * T, rx: 2.6 * T, ry: 2.0 * T });
          // árvores nos cantos do parque
          const tp = [[2.9, 2.9], [9.1, 2.9], [2.9, 9.1], [9.1, 9.1], [6, 2.7], [6, 9.3]];
          tp.forEach(([a, b]) => trees.push({ x: (tx + a) * T, y: (ty + b) * T, r: 22 + rnd() * 6 }));
        }
      }
    }
  }
  // pontes e faixas de pedestre
  const rv = blocks.find(b => b.kind === 'river');
  for (let j = 0; j <= ROWS; j++) setRect(rv.tx, MG + j * PITCH, BLOCK, ROAD, TILE.BRIDGE);
  const crossings = [];
  for (let i = 0; i <= COLS; i++) for (let j = 0; j <= ROWS; j++) {
    const x0 = MG + i * PITCH, y0 = MG + j * PITCH;
    const set = (tx, ty, w, h) => {
      for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) {
        const t = tiles[y * TW + x]; if (t === TILE.ROAD || t === TILE.BRIDGE) tiles[y * TW + x] = TILE.CROSS;
      }
    };
    if (j > 0) { set(x0, y0 - 1, ROAD, 1); crossings.push({ x: x0, y: y0 - 1, w: ROAD, h: 1, dir: 'h' }); }
    if (j < ROWS) { set(x0, y0 + ROAD, ROAD, 1); crossings.push({ x: x0, y: y0 + ROAD, w: ROAD, h: 1, dir: 'h' }); }
    if (i > 0) { set(x0 - 1, y0, 1, ROAD); crossings.push({ x: x0 - 1, y: y0, w: 1, h: ROAD, dir: 'v' }); }
    if (i < COLS) { set(x0 + ROAD, y0, 1, ROAD); crossings.push({ x: x0 + ROAD, y: y0, w: 1, h: ROAD, dir: 'v' }); }
  }
  // prédios da borda do mapa
  (function rim() {
    const d = 4; // tiles de prédio
    let x = 0;
    while (x < TW) { const w = Math.min(5 + Math.floor(rnd() * 5), TW - x); addBuilding(x * T + 4, 4, w * T - 8, d * T - 8); addBuilding(x * T + 4, (TH - d) * T + 4, w * T - 8, d * T - 8); x += w; }
    let y = d;
    while (y < TH - d) { const h = Math.min(5 + Math.floor(rnd() * 5), TH - d - y); addBuilding(4, y * T + 4, d * T - 8, h * T - 8); addBuilding((TW - d) * T + 4, y * T + 4, d * T - 8, h * T - 8); y += h; }
  })();
  // postes de luz nos cantos dos cruzamentos
  for (let i = 0; i <= COLS; i++) for (let j = 0; j <= ROWS; j++) {
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      const x = nodeX(i) + sx * (ROAD / 2 * T + 16), y = nodeY(j) + sy * (ROAD / 2 * T + 16);
      const t = tiles[Math.floor(y / T) * TW + Math.floor(x / T)];
      if (t === TILE.SIDE) lamps.push({ x, y });
    });
  }

  // ---------- Consultas ----------
  function tileAt(px, py) {
    const tx = Math.floor(px / T), ty = Math.floor(py / T);
    if (tx < 0 || ty < 0 || tx >= TW || ty >= TH) return TILE.BUILD;
    return tiles[ty * TW + tx];
  }
  const isSolid = (px, py) => { const t = tileAt(px, py); return t === TILE.BUILD || t === TILE.WATER; };
  function treeHit(px, py, pad) {
    for (let k = 0; k < trees.length; k++) {
      const t = trees[k], dx = px - t.x, dy = py - t.y, rr = t.r * 0.55 + (pad || 0);
      if (dx * dx + dy * dy < rr * rr) return true;
    }
    return false;
  }
  const isRoadTile = t => t === TILE.ROAD || t === TILE.BRIDGE || t === TILE.CROSS;
  const pedWalkable = t => t === TILE.SIDE || t === TILE.CROSS || t === TILE.GRASS;

  // ---------- Desenho ----------
  const tex = {};
  function makeNoise(base, n, light, dark, size) {
    const c = document.createElement('canvas'); c.width = c.height = size || 128;
    const x = c.getContext('2d'); x.fillStyle = base; x.fillRect(0, 0, c.width, c.height);
    const r = mulberry32(base.length * 977 + n);
    for (let k = 0; k < n; k++) {
      x.fillStyle = r() < 0.5 ? light : dark;
      x.fillRect(Math.floor(r() * c.width), Math.floor(r() * c.height), 1 + (r() < 0.2 ? 1 : 0), 1);
    }
    return c;
  }
  function makeTextures() {
    tex.asphalt = makeNoise('#6b6090', 2600, 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0.07)');
    tex.rim = makeNoise('#3b3442', 1200, 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0.12)');
    tex.grass = makeNoise('#4d9a3a', 2200, 'rgba(190,255,150,0.16)', 'rgba(0,50,0,0.18)');
    tex.water = makeNoise('#21407e', 1500, 'rgba(140,190,255,0.14)', 'rgba(0,0,30,0.2)', 128);
    tex.alley = makeNoise('#59505f', 700, 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0.12)');
  }

  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  function drawRoof(ctx, b) {
    const { x, y, w, h, p } = b;
    ctx.fillStyle = p.dark; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = p.edge; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = p.base; ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
    if (p.kind === 'tile') {
      // telhas: listras + cumeeira
      ctx.save(); ctx.beginPath(); ctx.rect(x + 6, y + 6, w - 12, h - 12); ctx.clip();
      const step = 9;
      if (b.ridge === 'h') {
        for (let yy = y + 6; yy < y + h - 6; yy += step) { ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.fillRect(x + 6, yy + step - 2, w - 12, 2); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x + 6, yy, w - 12, 2); }
        ctx.fillStyle = p.edge; ctx.fillRect(x + 6, y + h / 2 - 3, w - 12, 6);
        ctx.fillStyle = p.dark; ctx.fillRect(x + 6, y + h / 2 + 3, w - 12, 2);
      } else {
        for (let xx = x + 6; xx < x + w - 6; xx += step) { ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.fillRect(xx + step - 2, y + 6, 2, h - 12); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(xx, y + 6, 2, h - 12); }
        ctx.fillStyle = p.edge; ctx.fillRect(x + w / 2 - 3, y + 6, 6, h - 12);
        ctx.fillStyle = p.dark; ctx.fillRect(x + w / 2 + 3, y + 6, 2, h - 12);
      }
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x + 6, y + h - 12, w - 12, 6);
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1; ctx.strokeRect(x + 10.5, y + 10.5, w - 21, h - 21);
    }
    b.det.forEach(d => {
      const dx = x + 12 + d.fx * (w - 40), dy = y + 12 + d.fy * (h - 40);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(dx + 4, dy + 4, 18, 18);
      if (d.t === 'ac') { ctx.fillStyle = '#c9ccd2'; ctx.fillRect(dx, dy, 18, 18); ctx.fillStyle = '#7b7f88'; ctx.beginPath(); ctx.arc(dx + 9, dy + 9, 6, 0, 7); ctx.fill(); ctx.fillStyle = '#3a3d44'; ctx.beginPath(); ctx.arc(dx + 9, dy + 9, 3, 0, 7); ctx.fill(); }
      else if (d.t === 'sky') { ctx.fillStyle = '#9dc4d8'; ctx.fillRect(dx, dy, 20, 14); ctx.strokeStyle = '#e8f3f8'; ctx.lineWidth = 2; ctx.strokeRect(dx + 1, dy + 1, 18, 12); }
      else if (d.t === 'tank') { ctx.fillStyle = '#d8d8d8'; ctx.beginPath(); ctx.arc(dx + 10, dy + 10, 10, 0, 7); ctx.fill(); ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 2; ctx.stroke(); }
      else { ctx.fillStyle = '#8a4a3a'; ctx.fillRect(dx, dy, 12, 12); ctx.fillStyle = '#2a1a1a'; ctx.fillRect(dx + 3, dy + 3, 6, 6); }
    });
  }

  function drawBlockGround(ctx, blk) {
    const { x, y, w, h, kind } = blk;
    if (kind === 'river') {
      ctx.fillStyle = ctx.createPattern(tex.water, 'repeat'); ctx.fillRect(x, y, w, h);
      // reflexos
      ctx.fillStyle = 'rgba(180,220,255,0.10)';
      for (let k = 0; k < 40; k++) { const rx = x + ((k * 97) % w), ry = y + ((k * 61) % h); ctx.fillRect(rx, ry, 18, 2); }
      // margens de pedra
      ctx.fillStyle = '#3d4a3b'; ctx.fillRect(x, y, 10, h); ctx.fillRect(x + w - 10, y, 10, h);
      ctx.fillStyle = '#6f7d6a'; ctx.fillRect(x + 8, y, 3, h); ctx.fillRect(x + w - 11, y, 3, h);
      return;
    }
    // calçada com cantos arredondados
    ctx.save();
    rrect(ctx, x - 4, y - 4, w + 8, h + 8, 46); ctx.fillStyle = '#9d92c4'; ctx.fill(); // brilho lilás da rua
    rrect(ctx, x, y, w, h, 44); ctx.fillStyle = '#ece1a2'; ctx.fill();
    ctx.clip();
    ctx.strokeStyle = 'rgba(150,130,70,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = x; gx <= x + w; gx += T) { ctx.moveTo(gx + 0.5, y); ctx.lineTo(gx + 0.5, y + h); }
    for (let gy = y; gy <= y + h; gy += T) { ctx.moveTo(x, gy + 0.5); ctx.lineTo(x + w, gy + 0.5); }
    ctx.stroke();
    // variação de cor nas lajotas
    const r = mulberry32(blk.bx * 31 + blk.by * 17 + 5);
    for (let k = 0; k < 40; k++) { ctx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(120,90,40,0.10)'; ctx.fillRect(x + Math.floor(r() * 12) * T + 1, y + Math.floor(r() * 12) * T + 1, T - 2, T - 2); }
    ctx.restore();
    // meio-fio branco
    rrect(ctx, x + 2, y + 2, w - 4, h - 4, 42); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.stroke();
    rrect(ctx, x + 6, y + 6, w - 12, h - 12, 38); ctx.strokeStyle = 'rgba(120,100,50,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();

    if (kind === 'city') {
      // "beco" escuro debaixo dos prédios
      ctx.fillStyle = ctx.createPattern(tex.alley, 'repeat'); ctx.fillRect(x + 2 * T, y + 2 * T, 8 * T, 8 * T);
    } else if (kind === 'park') {
      const gx = x + 2 * T, gy = y + 2 * T;
      rrect(ctx, gx, gy, 8 * T, 8 * T, 14); ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fill();
      ctx.strokeStyle = '#2f6b26'; ctx.lineWidth = 3; ctx.stroke();
      // caminhos de terra
      ctx.strokeStyle = '#b89a62'; ctx.lineWidth = 16; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(gx + 12, gy + 4 * T); ctx.lineTo(gx + 8 * T - 12, gy + 4 * T); ctx.moveTo(gx + 4 * T, gy + 12); ctx.lineTo(gx + 4 * T, gy + 8 * T - 12); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx + 12, gy + 4 * T + 8); ctx.lineTo(gx + 8 * T - 12, gy + 4 * T + 8); ctx.stroke();
      ctx.lineCap = 'butt';
      ponds.forEach(p => {
        if (p.x < x || p.x > x + w || p.y < y || p.y > y + h) return;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx + 8, p.ry + 8, 0, 0, 7); ctx.fillStyle = '#7d8a6a'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, 7); ctx.fillStyle = ctx.createPattern(tex.water, 'repeat'); ctx.fill();
        ctx.beginPath(); ctx.ellipse(p.x - 6, p.y - 4, p.rx * 0.6, p.ry * 0.5, 0, 0, 7); ctx.fillStyle = 'rgba(120,180,255,0.18)'; ctx.fill();
      });
      // bancos
      ctx.fillStyle = '#6b4a2a';
      [[gx + 30, gy + 4 * T - 26], [gx + 8 * T - 54, gy + 4 * T + 14], [gx + 4 * T + 14, gy + 30], [gx + 4 * T - 26, gy + 8 * T - 54]].forEach(([bx, by]) => { ctx.fillRect(bx, by, 24, 8); ctx.fillStyle = '#4a321c'; ctx.fillRect(bx, by + 6, 24, 2); ctx.fillStyle = '#6b4a2a'; });
    }
  }

  function drawTree(ctx, t) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(t.x + 9, t.y + 11, t.r, t.r * 0.92, 0, 0, 7); ctx.fill();
    const g = ctx.createRadialGradient(t.x - t.r * 0.3, t.y - t.r * 0.3, 2, t.x, t.y, t.r);
    g.addColorStop(0, '#6fc24b'); g.addColorStop(0.6, '#2f8a2a'); g.addColorStop(1, '#1b5a1d');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#123f14'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(200,255,150,0.25)';
    for (let k = 0; k < 5; k++) { const a = k * 1.3 + t.x; ctx.beginPath(); ctx.arc(t.x + Math.cos(a) * t.r * 0.45, t.y + Math.sin(a) * t.r * 0.45, t.r * 0.2, 0, 7); ctx.fill(); }
  }

  function drawStatic(ctx, x0, y0, x1, y1) {
    const hit = (x, y, w, h) => x < x1 && x + w > x0 && y < y1 && y + h > y0;
    // 1) fundo (borda da cidade)
    ctx.fillStyle = ctx.createPattern(tex.rim, 'repeat'); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    // calçada externa
    const ox = (MG - 2) * T, oy = (MG - 2) * T, ow = (INNER_W + 4) * T, oh = (INNER_H + 4) * T;
    if (hit(ox, oy, ow, oh)) {
      rrect(ctx, ox, oy, ow, oh, 60); ctx.fillStyle = '#ece1a2'; ctx.fill();
      ctx.save(); rrect(ctx, ox, oy, ow, oh, 60); ctx.clip();
      ctx.strokeStyle = 'rgba(150,130,70,0.45)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let gx = ox; gx <= ox + ow; gx += T) { ctx.moveTo(gx + 0.5, oy); ctx.lineTo(gx + 0.5, oy + oh); }
      for (let gy = oy; gy <= oy + oh; gy += T) { ctx.moveTo(ox, gy + 0.5); ctx.lineTo(ox + ow, gy + 0.5); }
      ctx.stroke(); ctx.restore();
    }
    // 2) asfalto das ruas
    const ap = ctx.createPattern(tex.asphalt, 'repeat');
    ctx.fillStyle = ap;
    const rx0 = MG * T, ry0 = MG * T, rh = INNER_H * T, rw = INNER_W * T;
    if (hit(rx0, ry0, rw, rh)) ctx.fillRect(rx0, ry0, rw, rh);
    // 3) marcas nas ruas: rastros de pneus e faixas amarelas
    ctx.save();
    ctx.strokeStyle = 'rgba(30,20,60,0.10)'; ctx.lineWidth = 5;
    for (let i = 0; i <= COLS; i++) for (const off of [1.1, 1.9, 4.1, 4.9]) {
      const xx = roadLeft(i) + off * T; if (xx < x0 - 8 || xx > x1 + 8) continue;
      ctx.beginPath(); ctx.moveTo(xx, Math.max(ry0, y0)); ctx.lineTo(xx, Math.min(ry0 + rh, y1)); ctx.stroke();
    }
    for (let j = 0; j <= ROWS; j++) for (const off of [1.1, 1.9, 4.1, 4.9]) {
      const yy = roadTop(j) + off * T; if (yy < y0 - 8 || yy > y1 + 8) continue;
      ctx.beginPath(); ctx.moveTo(Math.max(rx0, x0), yy); ctx.lineTo(Math.min(rx0 + rw, x1), yy); ctx.stroke();
    }
    ctx.restore();
    // faixas amarelas tracejadas (param antes do cruzamento)
    ctx.fillStyle = '#f2c231';
    for (let i = 0; i <= COLS; i++) {
      const cx = nodeX(i);
      if (cx < x0 - 10 || cx > x1 + 10) continue;
      for (let j = 0; j < ROWS; j++) {
        const ya = nodeY(j) + (ROAD / 2 + 1.4) * T, yb = nodeY(j + 1) - (ROAD / 2 + 1.4) * T;
        for (let yy = ya; yy < yb - 30; yy += 96) if (yy + 56 > y0 && yy < y1) ctx.fillRect(cx - 3, yy, 6, 56);
      }
    }
    for (let j = 0; j <= ROWS; j++) {
      const cy = nodeY(j);
      if (cy < y0 - 10 || cy > y1 + 10) continue;
      for (let i = 0; i < COLS; i++) {
        const xa = nodeX(i) + (ROAD / 2 + 1.4) * T, xb = nodeX(i + 1) - (ROAD / 2 + 1.4) * T;
        for (let xx = xa; xx < xb - 30; xx += 96) if (xx + 56 > x0 && xx < x1) ctx.fillRect(xx, cy - 3, 56, 6);
      }
    }
    // 4) faixas de pedestre
    ctx.fillStyle = 'rgba(245,245,245,0.92)';
    crossings.forEach(c => {
      const cx = c.x * T, cy = c.y * T, cw = c.w * T, ch = c.h * T;
      if (!hit(cx, cy, cw, ch)) return;
      if (c.dir === 'h') { for (let xx = cx + 6; xx < cx + cw - 6; xx += 16) ctx.fillRect(xx, cy + 4, 9, ch - 8); }
      else { for (let yy = cy + 6; yy < cy + ch - 6; yy += 16) ctx.fillRect(cx + 4, yy, ch > 0 ? cw - 8 : 9, 9); }
    });
    // 5) quadras (chão)
    blocks.forEach(b => { if (hit(b.x - 8, b.y - 8, b.w + 16, b.h + 16)) drawBlockGround(ctx, b); });
    // 6) ponte: proteção e pilares
    for (let j = 0; j <= ROWS; j++) {
      const by = roadTop(j), bx = rv.x;
      if (!hit(bx, by - 20, rv.w, ROAD * T + 40)) continue;
      ctx.fillStyle = 'rgba(0,0,20,0.35)'; ctx.fillRect(bx, by - 14, rv.w, 14); ctx.fillRect(bx, by + ROAD * T, rv.w, 18);
      ctx.fillStyle = '#9a9aa6'; ctx.fillRect(bx, by - 6, rv.w, 10); ctx.fillRect(bx, by + ROAD * T - 4, rv.w, 10);
      ctx.fillStyle = '#55555f'; ctx.fillRect(bx, by - 2, rv.w, 4); ctx.fillRect(bx, by + ROAD * T - 2, rv.w, 4);
      for (let xx = bx + 8; xx < bx + rv.w; xx += 32) { ctx.fillStyle = '#c8c8d2'; ctx.fillRect(xx, by - 6, 5, 10); ctx.fillRect(xx, by + ROAD * T - 4, 5, 10); }
    }
    // 7) sombras dos prédios e telhados
    const vis = buildings.filter(b => hit(b.x, b.y, b.w + 14, b.h + 14));
    vis.forEach(b => {
      ctx.fillStyle = 'rgba(0,0,0,0.30)';
      ctx.beginPath(); ctx.moveTo(b.x + 4, b.y + b.h); ctx.lineTo(b.x + b.w, b.y + b.h); ctx.lineTo(b.x + b.w, b.y + 4);
      ctx.lineTo(b.x + b.w + 14, b.y + 18); ctx.lineTo(b.x + b.w + 14, b.y + b.h + 14); ctx.lineTo(b.x + 18, b.y + b.h + 14); ctx.closePath(); ctx.fill();
    });
    vis.forEach(b => drawRoof(ctx, b));
    // 8) árvores e postes
    trees.forEach(t => { if (hit(t.x - 50, t.y - 50, 100, 100)) drawTree(ctx, t); });
    lamps.forEach(l => {
      if (!hit(l.x - 14, l.y - 14, 28, 28)) return;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(l.x + 4, l.y + 5, 5, 0, 7); ctx.fill();
      ctx.fillStyle = '#4a4a55'; ctx.beginPath(); ctx.arc(l.x, l.y, 4, 0, 7); ctx.fill();
      ctx.fillStyle = '#f7efb0'; ctx.beginPath(); ctx.arc(l.x, l.y, 2.5, 0, 7); ctx.fill();
    });
  }

  // ---------- Chunks (o cenário pré-desenhado) ----------
  const CH = 512, RS = 1.25;
  const NCX = Math.ceil(W / CH), NCY = Math.ceil(H / CH);
  const chunks = new Array(NCX * NCY).fill(null);
  let chunkCursor = 0;

  function buildSome(n) {
    if (!tex.asphalt) makeTextures();
    for (let k = 0; k < n && chunkCursor < chunks.length; k++, chunkCursor++) {
      const cx = chunkCursor % NCX, cy = Math.floor(chunkCursor / NCX);
      const c = document.createElement('canvas'); c.width = c.height = Math.ceil(CH * RS);
      const ctx = c.getContext('2d');
      ctx.scale(RS, RS); ctx.translate(-cx * CH, -cy * CH);
      ctx.save(); ctx.beginPath(); ctx.rect(cx * CH, cy * CH, CH, CH); ctx.clip();
      drawStatic(ctx, cx * CH, cy * CH, (cx + 1) * CH, (cy + 1) * CH);
      ctx.restore();
      chunks[chunkCursor] = c;
    }
    return chunkCursor / chunks.length;
  }
  function drawChunks(ctx, vx0, vy0, vx1, vy1) {
    const a = Math.max(0, Math.floor(vx0 / CH)), b = Math.min(NCX - 1, Math.floor(vx1 / CH));
    const c = Math.max(0, Math.floor(vy0 / CH)), d = Math.min(NCY - 1, Math.floor(vy1 / CH));
    for (let cy = c; cy <= d; cy++) for (let cx = a; cx <= b; cx++) {
      const im = chunks[cy * NCX + cx]; if (im) ctx.drawImage(im, cx * CH, cy * CH, CH + 0.6, CH + 0.6);
    }
  }
  // mapa pequeno (minimapa)
  function makeMini(scale) {
    const c = document.createElement('canvas'); c.width = Math.ceil(W / scale); c.height = Math.ceil(H / scale);
    const x = c.getContext('2d');
    for (let cy = 0; cy < NCY; cy++) for (let cx = 0; cx < NCX; cx++) {
      const im = chunks[cy * NCX + cx]; if (im) x.drawImage(im, cx * CH / scale, cy * CH / scale, CH / scale + 0.6, CH / scale + 0.6);
    }
    return c;
  }

  // pontos de sidewalk para missões e lugares
  function sidePoint(bx, by, side, t) {
    const b = blocks.find(k => k.bx === bx && k.by === by);
    const m = T; // centro da calçada (1 tile para dentro)
    if (side === 'top') return { x: b.x + t * b.w, y: b.y + m };
    if (side === 'bottom') return { x: b.x + t * b.w, y: b.y + b.h - m };
    if (side === 'left') return { x: b.x + m, y: b.y + t * b.h };
    return { x: b.x + b.w - m, y: b.y + t * b.h };
  }
  const spots = [];
  blocks.forEach(b => {
    if (b.kind === 'river') return;
    ['top', 'bottom', 'left', 'right'].forEach(s => [0.3, 0.7].forEach(t => spots.push(sidePoint(b.bx, b.by, s, t))));
  });

  G.world = {
    T, ROAD, BLOCK, PITCH, COLS, ROWS, MG, TW, TH, W, H, RIVER, TILE, tiles, blocks, buildings, trees, lamps,
    roadLeft, roadTop, nodeX, nodeY, laneV, laneH, tileAt, isSolid, treeHit, isRoadTile, pedWalkable,
    buildSome, drawChunks, makeMini, sidePoint, spots, rrect, mulberry32,
    chunkCount: chunks.length,
  };
})(window.G = window.G || {});
