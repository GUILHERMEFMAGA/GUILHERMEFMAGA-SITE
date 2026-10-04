'use strict';
/* ============================================================
   world.js — cidade em tiles (estilo GTA 1/2), desenho do mapa,
   semáforos, zonas de interação e minimapa.
   ============================================================ */
const T = 32, MW = 64, MH = 64;               // tamanho do tile e do mapa (tiles)
const TY = { ROAD:0, SIDE:1, BLD:2, GRASS:3, TREE:4, WATER:5, BRIDGE:6, PLAZA:7, LOT:8, PATH:9 };

const WORLD = {};
(function build() {
  const tiles = new Uint8Array(MW * MH).fill(TY.BLD);
  const decor = new Uint8Array(MW * MH);      // variante de cor / flags (9=fonte sólida)
  const mark  = new Uint8Array(MW * MH);      // 1=amarela dir,2=amarela esq,4=amarela emb,8=amarela cim, cw bits 16N/32S/64W/128E
  const idx = (x, y) => y * MW + x;
  const get = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH) ? TY.BLD : tiles[idx(x, y)];
  const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < MW && y < MH) tiles[idx(x, y)] = t; };

  // ------- grade de vias (4 tiles de largura = 1 faixa por sentido) -------
  const VX = [6, 18, 30, 42, 54], HY = [6, 16, 26, 36, 46];
  const VXC = VX.map(v => (v + 2) * T), HYC = HY.map(r => (r + 2) * T);
  for (const v of VX) for (let y = 0; y < MH; y++) for (let x = v; x < v + 4; x++) set(x, y, TY.ROAD);
  for (const h of HY) for (let x = 0; x < MW; x++) for (let y = h; y < h + 4; y++) set(x, y, TY.ROAD);

  // ------- rio ao sul + pontes nas avenidas -------
  for (let y = 54; y <= 57; y++) for (let x = 0; x < MW; x++) set(x, y, TY.WATER);
  for (const v of VX) for (let y = 54; y <= 57; y++) for (let x = v; x < v + 4; x++) set(x, y, TY.BRIDGE);

  // ------- calçada: anel de 1 tile em volta de toda via -------
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (get(x, y) !== TY.BLD) continue;
    let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) {
      const t = get(x + dx, y + dy);
      if (t === TY.ROAD || t === TY.BRIDGE) { near = true; break; }
    }
    if (near) set(x, y, TY.SIDE);
  }

  // ------- praça com fonte -------
  for (let y = 20; y <= 25; y++) for (let x = 34; x <= 41; x++) set(x, y, TY.PLAZA);
  decor[idx(37, 22)] = 9; decor[idx(38, 22)] = 9; decor[idx(37, 23)] = 9; decor[idx(38, 23)] = 9; // fonte

  // ------- parque com lago -------
  for (let y = 20; y <= 25; y++) for (let x = 22; x <= 29; x++) set(x, y, TY.GRASS);
  for (let y = 22; y <= 24; y++) for (let x = 24; x <= 27; x++) set(x, y, TY.WATER); // lago
  for (let x = 22; x <= 29; x++) { set(x, 21, TY.PATH); set(x, 25, TY.PATH); }       // trilhas

  // ------- árvores (determinístico) -------
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (get(x, y) === TY.GRASS && rnd() < 0.16) set(x, y, TY.TREE);
    if (get(x, y) === TY.SIDE && rnd() < 0.05) set(x, y, TY.TREE); // árvores de calçada
  }
  // margem sul do rio: praia/gramado
  for (let y = 58; y < MH; y++) for (let x = 0; x < MW; x++) if (get(x, y) === TY.BLD) set(x, y, rnd() < 0.2 ? TY.TREE : TY.GRASS);

  // ------- zonas especiais (lotes) -------
  const zones = [];
  function zone(name, c0, r0, c1, r1, label) {
    for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) {
      if (get(x, y) === TY.BLD || get(x, y) === TY.SIDE) set(x, y, TY.LOT);
    }
    zones.push({ name, label, x0: c0 * T, y0: r0 * T, x1: (c1 + 1) * T, y1: (r1 + 1) * T });
    return zones[zones.length - 1];
  }
  zone('POSTO',     10, 10, 13, 12, 'POSTO');
  zone('LOJA',      14, 10, 17, 12, 'LOJA');
  zone('GARAGEM',   10, 13, 13, 15, 'GARAGEM');
  zone('OFICINA',   14, 13, 17, 15, 'OFICINA');
  zone('LOTE',      34, 10, 41, 15, 'AUTO LOTE');
  zone('ESCONDERIJO', 46, 12, 53, 15, 'ESCONDERIJO');

  // bombas do posto (sólidas)
  const pumps = [{ x: 11 * T + 16, y: 11 * T + 8 }, { x: 12 * T + 16, y: 11 * T + 8 }];

  // ------- faixas amarelas centrais + faixas de pedestres -------
  const isRoad = (x, y) => get(x, y) === TY.ROAD;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (!isRoad(x, y)) continue;
    const vert = isRoad(x, y - 1) && isRoad(x, y + 1);
    const hor  = isRoad(x - 1, y) && isRoad(x + 1, y);
    if (vert && !hor) {                       // trecho vertical
      let s = x; while (isRoad(s - 1, y)) s--;
      const off = x - s;
      if (off === 1) mark[idx(x, y)] |= 1;    // linha na borda direita
      if (off === 2) mark[idx(x, y)] |= 2;    // linha na borda esquerda
    }
    if (hor && !vert) {
      let s = y; while (isRoad(x, s - 1)) s--;
      const off = y - s;
      if (off === 1) mark[idx(x, y)] |= 4;
      if (off === 2) mark[idx(x, y)] |= 8;
    }
  }
  // faixas de pedestres nas bordas de cada cruzamento
  for (const v of VX) for (const h of HY) {
    for (let x = v; x < v + 4; x++) { mark[idx(x, h - 1)] |= 16; mark[idx(x, h + 4)] |= 32; }
    for (let y = h; y < h + 4; y++) { mark[idx(v - 1, y)] |= 64; mark[idx(v + 4, y)] |= 128; }
  }

  // ------- semáforos em todos os cruzamentos -------
  const lights = [];
  for (let i = 0; i < VX.length; i++) for (let j = 0; j < HY.length; j++)
    lights.push({ i, j, x: VXC[i], y: HYC[j] });
  // ciclo de 12s: 0-5 NS verde, 5-6 fechado, 6-11 LO verde, 11-12 fechado
  function lightGreen(dirVert, clock) {
    const p = clock % 12;
    if (p < 5) return dirVert;
    if (p < 6) return false;
    if (p < 11) return !dirVert;
    return false;
  }

  // ------- orelhões -------
  const phones = [
    { x: (VX[0] - 1) * T + 16, y: (HY[0] + 4) * T + 16 },
    { x: (VX[1] + 4) * T + 16, y: (HY[1] - 1) * T + 16 },
    { x: (VX[2] - 1) * T + 16, y: (HY[2] + 4) * T + 16 },
    { x: (VX[3] + 4) * T + 16, y: (HY[3] - 1) * T + 16 },
    { x: (VX[4] - 1) * T + 16, y: (HY[4] - 1) * T + 16 },
  ];

  // ------- sólidos -------
  function tileSolid(x, y) {
    const t = get(x, y);
    if (t === TY.BLD || t === TY.WATER || t === TY.TREE) return true;
    if (decor[idx(x, y)] === 9) return true;
    return false;
  }
  function solidAt(px, py) {
    const x = Math.floor(px / T), y = Math.floor(py / T);
    if (x < 0 || y < 0 || x >= MW || y >= MH) return true;
    if (tileSolid(x, y)) return true;
    for (const p of pumps) if (Math.abs(px - p.x) < 10 && Math.abs(py - p.y) < 10) return true;
    return false;
  }
  const walkable = (x, y) => {
    const t = get(x, y);
    return t === TY.SIDE || t === TY.PATH || t === TY.PLAZA || t === TY.GRASS || t === TY.LOT;
  };

  // ------- paletas de telhado por região -------
  const PAL = [['#8a5a3b', '#a8672f', '#7d7f86', '#5b6e8c'], ['#9c4f36', '#b3803a', '#6d6f76', '#7a5a8c'], ['#7f6a4a', '#a3742f', '#8c8c93', '#4f6e5c']];

  // ------- minimapa (offscreen) -------
  const mini = document.createElement('canvas');
  mini.width = MW * 2; mini.height = MH * 2;
  (function paintMini() {
    const m = mini.getContext('2d');
    const col = t => [ '#565a74', '#cfc49a', '#7a5a3b', '#4f7a3a', '#2e5d2a', '#3f6fb5', '#8f8f96', '#c9b28a', '#7d7d84', '#b7a97f' ][t];
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      m.fillStyle = col(tiles[idx(x, y)]);
      m.fillRect(x * 2, y * 2, 2, 2);
    }
  })();

  Object.assign(WORLD, {
    tiles, decor, mark, VX, HY, VXC, HYC, zones, pumps, lights, phones, mini,
    lightGreen, walkable, solidAt, walkableTile: walkable,
    tileAt(px, py) { return get(Math.floor(px / T), Math.floor(py / T)); },
    zoneAt(px, py) {
      for (const z of zones) if (px >= z.x0 && px <= z.x1 && py >= z.y0 && py <= z.y1) return z;
      return null;
    },
    // em qual linha de via o ponto está: {axis:'v',i} / {axis:'h',j}
    roadLine(px, py) {
      const x = Math.floor(px / T), y = Math.floor(py / T);
      for (let i = 0; i < VX.length; i++) if (x >= VX[i] && x < VX[i] + 4) return { axis: 'v', i };
      for (let j = 0; j < HY.length; j++) if (y >= HY[j] && y < HY[j] + 4) return { axis: 'h', j };
      return null;
    },

    /* ============================ DESENHO ============================ */
    draw(ctx, cam, clock) {
      const x0 = Math.max(0, Math.floor(cam.x / T)), y0 = Math.max(0, Math.floor(cam.y / T));
      const x1 = Math.min(MW - 1, Math.ceil((cam.x + 800) / T)), y1 = Math.min(MH - 1, Math.ceil((cam.y + 600) / T));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const t = tiles[idx(x, y)], px = x * T - cam.x, py = y * T - cam.y, m = mark[idx(x, y)], d = decor[idx(x, y)];
        if (t === TY.ROAD || t === TY.BRIDGE) {
          ctx.fillStyle = ((x + y) & 1) ? '#585a76' : '#55576f';
          ctx.fillRect(px, py, T, T);
          if (t === TY.BRIDGE) { ctx.fillStyle = '#9aa0ab'; ctx.fillRect(px, py, T, 3); ctx.fillRect(px, py + T - 3, T, 3); }
          ctx.fillStyle = '#d8b71a';
          if (m & 1) ctx.fillRect(px + T - 2, py, 2, T);
          if (m & 2) ctx.fillRect(px, py, 2, T);
          if (m & 4) ctx.fillRect(px, py + T - 2, T, 2);
          if (m & 8) ctx.fillRect(px, py, T, 2);
          ctx.fillStyle = 'rgba(240,240,240,.85)';
          if (m & 16) for (let k = 0; k < 4; k++) ctx.fillRect(px + k * 8 + 2, py + 4, 4, T - 14);
          if (m & 32) for (let k = 0; k < 4; k++) ctx.fillRect(px + k * 8 + 2, py + 10, 4, T - 14);
          if (m & 64) for (let k = 0; k < 4; k++) ctx.fillRect(px + 4, py + k * 8 + 2, T - 14, 4);
          if (m & 128) for (let k = 0; k < 4; k++) ctx.fillRect(px + 10, py + k * 8 + 2, T - 14, 4);
        } else if (t === TY.SIDE) {
          ctx.fillStyle = '#cfc49a'; ctx.fillRect(px, py, T, T);
          ctx.strokeStyle = '#b3a87f'; ctx.strokeRect(px + .5, py + .5, T - 1, T - 1);
          ctx.fillStyle = '#efe9d2'; // meio-fio branco do lado da rua
          if (get(x, y - 1) === TY.ROAD || get(x, y - 1) === TY.BRIDGE) ctx.fillRect(px, py, T, 3);
          if (get(x, y + 1) === TY.ROAD || get(x, y + 1) === TY.BRIDGE) ctx.fillRect(px, py + T - 3, T, 3);
          if (get(x - 1, y) === TY.ROAD || get(x - 1, y) === TY.BRIDGE) ctx.fillRect(px, py, 3, T);
          if (get(x + 1, y) === TY.ROAD || get(x + 1, y) === TY.BRIDGE) ctx.fillRect(px + T - 3, py, 3, T);
        } else if (t === TY.BLD) {
          const pal = PAL[(Math.floor(x / 12) + Math.floor(y / 10)) % 3];
          ctx.fillStyle = pal[d % 4]; ctx.fillRect(px, py, T, T);
          ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(px, py, T, 2); ctx.fillRect(px, py, 2, T);
          if (d % 7 === 3) { ctx.fillStyle = '#c9c9cf'; ctx.fillRect(px + 8, py + 8, 8, 8); }   // ar-condicionado
          if (d % 9 === 5) { ctx.fillStyle = '#889'; ctx.beginPath(); ctx.arc(px + 20, py + 18, 6, 0, 7); ctx.fill(); } // caixa d'água
        } else if (t === TY.GRASS) {
          ctx.fillStyle = '#4f7a3a'; ctx.fillRect(px, py, T, T);
          ctx.fillStyle = '#467032'; ctx.fillRect(px + (d % 4) * 7, py + (d % 3) * 9, 5, 4);
        } else if (t === TY.TREE) {
          ctx.fillStyle = '#4f7a3a'; ctx.fillRect(px, py, T, T);
          ctx.fillStyle = '#5d4426'; ctx.fillRect(px + 14, py + 14, 5, 5);
          ctx.fillStyle = '#2e5d2a'; ctx.beginPath(); ctx.arc(px + 16, py + 15, 11, 0, 7); ctx.fill();
          ctx.fillStyle = '#3a7034'; ctx.beginPath(); ctx.arc(px + 13, py + 12, 6, 0, 7); ctx.fill();
        } else if (t === TY.WATER) {
          ctx.fillStyle = '#3f6fb5'; ctx.fillRect(px, py, T, T);
          ctx.fillStyle = 'rgba(255,255,255,.18)';
          const w = (clock * 8 + x * 7 + y * 13) % T;
          ctx.fillRect(px + ((w) % (T - 8)), py + ((y * 5) % (T - 4)), 8, 2);
        } else if (t === TY.PLAZA) {
          ctx.fillStyle = '#c9b28a'; ctx.fillRect(px, py, T, T);
          ctx.strokeStyle = '#b49a72'; ctx.beginPath();
          ctx.moveTo(px, py + T); ctx.lineTo(px + T, py); ctx.stroke();
          if (d === 9) { // fonte
            ctx.fillStyle = '#9aa0ab'; ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
            ctx.fillStyle = '#3f6fb5'; ctx.fillRect(px + 6, py + 6, T - 12, T - 12);
            ctx.fillStyle = '#bfe0ff'; ctx.fillRect(px + 13, py + 13, 6, 6);
          }
        } else if (t === TY.PATH) {
          ctx.fillStyle = '#b7a97f'; ctx.fillRect(px, py, T, T);
          ctx.fillStyle = '#a5966d'; ctx.fillRect(px, py + 15, T, 2);
        } else if (t === TY.LOT) {
          ctx.fillStyle = '#7d7d84'; ctx.fillRect(px, py, T, T);
          ctx.fillStyle = '#70707a'; ctx.fillRect(px + (d % 5) * 6, py + (d % 4) * 7, 6, 2);
        }
      }
      // bombas do posto
      for (const p of pumps) {
        const px = p.x - cam.x, py = p.y - cam.y;
        ctx.fillStyle = '#c33'; ctx.fillRect(px - 6, py - 8, 12, 16);
        ctx.fillStyle = '#fff'; ctx.fillRect(px - 4, py - 6, 8, 6);
      }
      // orelhões
      for (const ph of phones) {
        const px = ph.x - cam.x, py = ph.y - cam.y;
        ctx.fillStyle = '#333'; ctx.fillRect(px - 1, py - 2, 2, 10);
        ctx.fillStyle = '#f7c700'; ctx.fillRect(px - 5, py - 12, 10, 11);
        ctx.fillStyle = '#333'; ctx.fillRect(px - 3, py - 10, 6, 5);
      }
      // nomes das zonas no chão
      ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
      for (const z of zones) {
        ctx.fillStyle = 'rgba(255,255,255,.4)';
        ctx.fillText(z.label, (z.x0 + z.x1) / 2 - cam.x, (z.y0 + z.y1) / 2 - cam.y);
      }
      ctx.textAlign = 'left';
    },

    drawMinimap(ctx, x, y, player, target) {
      const s = 2, w = MW * s, h = MH * s;
      ctx.save();
      ctx.globalAlpha = .82;
      ctx.drawImage(mini, x, y, w, h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#000'; ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
      if (target) { ctx.fillStyle = '#ffe14a'; ctx.fillRect(x + target.x / T * s - 2, y + target.y / T * s - 2, 4, 4); }
      ctx.fillStyle = '#ff3b3b';
      ctx.fillRect(x + player.x / T * s - 2, y + player.y / T * s - 2, 4, 4);
      ctx.restore();
    }
  });
})();
