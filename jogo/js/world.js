'use strict';
/* ============================================================
   world.js — cidade em tiles (estilo GTA 1/2), desenho do mapa,
   semáforos, zonas de interação e minimapa.
   Visual fiel ao print de referência: telhados extrudados com
   sombra, asfalto lavanda com estrias, calçada quadriculada.
   ============================================================ */
const T = 32, MW = 64, MH = 64;               // tamanho do tile e do mapa (tiles)
const TY = { ROAD:0, SIDE:1, BLD:2, GRASS:3, TREE:4, WATER:5, BRIDGE:6, PLAZA:7, LOT:8, PATH:9 };

const WORLD = {};
(function build() {
  const tiles = new Uint8Array(MW * MH).fill(TY.BLD);
  const decor = new Uint8Array(MW * MH);      // variante / flags (9=fonte sólida)
  const mark  = new Uint8Array(MW * MH);      // 1/2 amarela dupla, 4/8 horiz., 16N/32S/64W/128E faixas
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

  // ------- árvores (só parque/margem; calçada limpa como no print) -------
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (get(x, y) === TY.GRASS && rnd() < 0.16) set(x, y, TY.TREE);
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

  // ------- quarteirões de prédio (blocos únicos p/ telhado extrudado) -------
  const blocks = [];
  const seen = new Uint8Array(MW * MH);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (get(x, y) !== TY.BLD || seen[idx(x, y)]) continue;
    // cresce o retângulo máximo
    let x1 = x; while (x1 + 1 < MW && get(x1 + 1, y) === TY.BLD && !seen[idx(x1 + 1, y)]) x1++;
    let y1 = y;
    outer: while (y1 + 1 < MH) {
      for (let xx = x; xx <= x1; xx++) if (get(xx, y1 + 1) !== TY.BLD || seen[idx(xx, y1 + 1)]) break outer;
      y1++;
    }
    for (let yy = y; yy <= y1; yy++) for (let xx = x; xx <= x1; xx++) seen[idx(xx, yy)] = 1;
    blocks.push({ x0: x * T, y0: y * T, x1: (x1 + 1) * T, y1: (y1 + 1) * T, ci: (x * 7 + y * 13) % 6 });
  }
  const ROOFS = ['#c78d4f', '#b9763f', '#d1a05e', '#a8672f', '#c9b28a', '#9c6b3a'];

  // ------- marcas: dupla amarela central + tracejado de faixa + faixas de pedestres -------
  const isRoad = (x, y) => get(x, y) === TY.ROAD;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (!isRoad(x, y)) continue;
    const vert = isRoad(x, y - 1) && isRoad(x, y + 1);
    const hor  = isRoad(x - 1, y) && isRoad(x + 1, y);
    if (vert && !hor) {
      let s = x; while (isRoad(s - 1, y)) s--;
      const off = x - s;
      if (off === 1) mark[idx(x, y)] |= 1;    // dupla central (dir)
      if (off === 2) mark[idx(x, y)] |= 2;    // dupla central (esq)
      if (off === 0) mark[idx(x, y)] |= 16;   // tracejado de faixa
      if (off === 3) mark[idx(x, y)] |= 32;
    }
    if (hor && !vert) {
      let s = y; while (isRoad(x, s - 1)) s--;
      const off = y - s;
      if (off === 1) mark[idx(x, y)] |= 4;
      if (off === 2) mark[idx(x, y)] |= 8;
      if (off === 0) mark[idx(x, y)] |= 64;
      if (off === 3) mark[idx(x, y)] |= 128;
    }
  }
  // faixas de pedestres nas bordas de cada cruzamento (reusa bits? não: array cw)
  const cw = new Uint8Array(MW * MH);
  for (const v of VX) for (const h of HY) {
    for (let x = v; x < v + 4; x++) { cw[idx(x, h - 1)] |= 1; cw[idx(x, h + 4)] |= 2; }
    for (let y = h; y < h + 4; y++) { cw[idx(v - 1, y)] |= 4; cw[idx(v + 4, y)] |= 8; }
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

  // ------- minimapa (offscreen) -------
  const mini = document.createElement('canvas');
  mini.width = MW * 2; mini.height = MH * 2;
  (function paintMini() {
    const m = mini.getContext('2d');
    const col = t => ['#63658c', '#cdc39b', '#b9763f', '#4f7a3a', '#2e5d2a', '#3f6fb5', '#8f8f96', '#c9b28a', '#7d7d84', '#b7a97f'][t];
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      m.fillStyle = col(tiles[idx(x, y)]);
      m.fillRect(x * 2, y * 2, 2, 2);
    }
  })();

  Object.assign(WORLD, {
    tiles, decor, mark, cw, VX, HY, VXC, HYC, zones, pumps, lights, phones, mini, blocks,
    lightGreen, walkable, solidAt, walkableTile: walkable,
    tileAt(px, py) { return get(Math.floor(px / T), Math.floor(py / T)); },
    zoneAt(px, py) {
      for (const z of zones) if (px >= z.x0 && px <= z.x1 && py >= z.y0 && py <= z.y1) return z;
      return null;
    },
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
      // ---- chão (ruas, calçadas, água, praças, lotes, grama) ----
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const t = tiles[idx(x, y)], px = x * T - cam.x, py = y * T - cam.y, m = mark[idx(x, y)], c = cw[idx(x, y)];
        if (t === TY.ROAD || t === TY.BRIDGE) {
          ctx.fillStyle = '#63658c';                       // asfalto lavanda do print
          ctx.fillRect(px, py, T, T);
          ctx.fillStyle = 'rgba(255,255,255,.045)';        // estrias suaves
          ctx.fillRect(px + ((x * 13) % 3) * 10 + 3, py, 6, T);
          ctx.fillStyle = 'rgba(0,0,0,.05)';
          ctx.fillRect(px + ((x * 7) % 3) * 10 + 16, py, 5, T);
          if (t === TY.BRIDGE) { ctx.fillStyle = '#9aa0ab'; ctx.fillRect(px, py, T, 3); ctx.fillRect(px, py + T - 3, T, 3); }
          ctx.fillStyle = '#d8b71a';
          if (m & 1) ctx.fillRect(px + T - 3, py, 2, T);    // dupla central
          if (m & 2) ctx.fillRect(px + 1, py, 2, T);
          if (m & 4) ctx.fillRect(px, py + T - 3, T, 2);
          if (m & 8) ctx.fillRect(px, py + 1, T, 2);
          if (m & 16 && (y & 1) === 0) ctx.fillRect(px + T - 2, py + 4, 2, T - 10); // tracejado de faixa
          if (m & 32 && (y & 1) === 0) ctx.fillRect(px, py + 4, 2, T - 10);
          if (m & 64 && (x & 1) === 0) ctx.fillRect(px + 4, py + T - 2, T - 10, 2);
          if (m & 128 && (x & 1) === 0) ctx.fillRect(px + 4, py, T - 10, 2);
          ctx.fillStyle = 'rgba(245,245,245,.9)';          // faixas de pedestres
          if (c & 1) for (let k = 0; k < 4; k++) ctx.fillRect(px + k * 8 + 2, py + 6, 4, T - 12);
          if (c & 2) for (let k = 0; k < 4; k++) ctx.fillRect(px + k * 8 + 2, py + 6, 4, T - 12);
          if (c & 4) for (let k = 0; k < 4; k++) ctx.fillRect(px + 6, py + k * 8 + 2, T - 12, 4);
          if (c & 8) for (let k = 0; k < 4; k++) ctx.fillRect(px + 6, py + k * 8 + 2, T - 12, 4);
        } else if (t === TY.SIDE) {
          ctx.fillStyle = '#cdc39b'; ctx.fillRect(px, py, T, T);
          ctx.strokeStyle = 'rgba(140,128,90,.55)'; ctx.lineWidth = 1;
          ctx.strokeRect(px + .5, py + .5, T / 2, T / 2);   // grade fina da calçada
          ctx.strokeRect(px + T / 2, py + .5, T / 2, T / 2);
          ctx.strokeRect(px + .5, py + T / 2, T / 2, T / 2);
          ctx.strokeRect(px + T / 2, py + T / 2, T / 2, T / 2);
          ctx.fillStyle = '#f2ecd8';                        // meio-fio branco
          if (get(x, y - 1) === TY.ROAD || get(x, y - 1) === TY.BRIDGE) ctx.fillRect(px, py, T, 3);
          if (get(x, y + 1) === TY.ROAD || get(x, y + 1) === TY.BRIDGE) ctx.fillRect(px, py + T - 3, T, 3);
          if (get(x - 1, y) === TY.ROAD || get(x - 1, y) === TY.BRIDGE) ctx.fillRect(px, py, 3, T);
          if (get(x + 1, y) === TY.ROAD || get(x + 1, y) === TY.BRIDGE) ctx.fillRect(px + T - 3, py, 3, T);
        } else if (t === TY.GRASS) {
          ctx.fillStyle = '#4f7a3a'; ctx.fillRect(px, py, T, T);
          ctx.fillStyle = '#467032'; ctx.fillRect(px + (decor[idx(x, y)] % 4) * 7, py + (decor[idx(x, y)] % 3) * 9, 5, 4);
        } else if (t === TY.TREE) {
          ctx.fillStyle = '#4f7a3a'; ctx.fillRect(px, py, T, T);
          ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(px + 18, py + 18, 11, 0, 7); ctx.fill();
          ctx.fillStyle = '#5d4426'; ctx.fillRect(px + 14, py + 14, 5, 5);
          ctx.fillStyle = '#2e5d2a'; ctx.beginPath(); ctx.arc(px + 16, py + 15, 11, 0, 7); ctx.fill();
          ctx.fillStyle = '#3a7034'; ctx.beginPath(); ctx.arc(px + 13, py + 12, 6, 0, 7); ctx.fill();
        } else if (t === TY.WATER) {
          ctx.fillStyle = '#3f6fb5'; ctx.fillRect(px, py, T, T);
          ctx.fillStyle = 'rgba(255,255,255,.18)';
          const w = (clock * 8 + x * 7 + y * 13) % T;
          ctx.fillRect(px + (w % (T - 8)), py + ((y * 5) % (T - 4)), 8, 2);
        } else if (t === TY.PLAZA) {
          ctx.fillStyle = '#c9b28a'; ctx.fillRect(px, py, T, T);
          ctx.strokeStyle = 'rgba(150,125,85,.5)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(px, py + T); ctx.lineTo(px + T, py); ctx.stroke();
          if (decor[idx(x, y)] === 9) { // fonte
            ctx.fillStyle = '#9aa0ab'; ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
            ctx.fillStyle = '#3f6fb5'; ctx.fillRect(px + 6, py + 6, T - 12, T - 12);
            ctx.fillStyle = '#bfe0ff'; ctx.fillRect(px + 13, py + 13, 6, 6);
          }
        } else if (t === TY.PATH) {
          ctx.fillStyle = '#b7a97f'; ctx.fillRect(px, py, T, T);
          ctx.fillStyle = '#a5966d'; ctx.fillRect(px, py + 15, T, 2);
        } else if (t === TY.LOT) {
          ctx.fillStyle = '#7d7d84'; ctx.fillRect(px, py, T, T);
          ctx.fillStyle = '#70707a'; ctx.fillRect(px + (decor[idx(x, y)] % 5) * 6, py + (decor[idx(x, y)] % 4) * 7, 6, 2);
        }
        // (BLD desenhado em camada de quarteirões abaixo)
      }
      // ---- quarteirões: sombra + parede + telhado extrudado ----
      for (const b of blocks) {
        if (b.x1 < cam.x || b.y1 < cam.y || b.x0 > cam.x + 800 || b.y0 > cam.y + 600) continue;
        const px = b.x0 - cam.x, py = b.y0 - cam.y, w = b.x1 - b.x0, h = b.y1 - b.y0;
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(px + 7, py + 9, w, h);          // sombra no chão
        ctx.fillStyle = shade(ROOFS[b.ci], -45); ctx.fillRect(px, py, w, h);           // parede (extrusão)
        ctx.fillStyle = ROOFS[b.ci]; ctx.fillRect(px, py, w - 6, h - 6);               // topo do telhado
        ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(px, py, w - 6, 4);       // brilho superior
        ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1;
        for (let sy = 16; sy < h - 6; sy += 16) { ctx.beginPath(); ctx.moveTo(px + 2, py + sy); ctx.lineTo(px + w - 8, py + sy); ctx.stroke(); }
        if (w > 96 && h > 64) { ctx.fillStyle = '#c9c9cf'; ctx.fillRect(px + 12, py + 12, 10, 10); }   // ar-condicionado
        if (w > 64 && h > 96) { ctx.fillStyle = '#8b939c'; ctx.beginPath(); ctx.arc(px + w - 26, py + 22, 7, 0, 7); ctx.fill(); } // caixa d'água
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
