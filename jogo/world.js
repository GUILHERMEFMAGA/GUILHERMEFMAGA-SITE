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
  const ROAD = 8;        // largura da rua (tiles) = 2 faixas de 4 tiles (ruas largas)
  const BLOCK = 12;      // lado de uma quadra (tiles)
  const PITCH = ROAD + BLOCK;
  const COLS = 34, ROWS = 8;  // quadras na horizontal / vertical (mapa GIGANTE: 4 cidades separadas por mata, fazendas e rios)
  const RIVER = 3;       // o primeiro rio (o da cidade antiga)
  const RIVERS = [3, 9, 16, 23, 30];          // colunas de quadras ocupadas por rios
  // rio -> linhas de rua onde existe ponte ('todas' = uma ponte em cada rua). Os rios novos têm UMA ponte (com pedágio); novas pontes são construídas por cidade.js
  const PONTES = { 3: 'todas', 9: [3], 16: [5], 23: [4], 30: [3] };
  const CIDADES = [
    { id: 'ribeirao', nome: 'RIBEIRÃO PRETO', sub: 'a cidade', ate: 9, estilo: 'classica' },
    { id: 'mata', nome: 'MATA ESCURA', sub: 'floresta e fazendas de bilionários', ate: 17, estilo: 'mata' },
    { id: 'interior', nome: 'NOVO HORIZONTE', sub: 'interior — cidade em construção', ate: 23, estilo: 'moderna' },
    { id: 'vale', nome: 'VALE VERDE', sub: 'cidade ecológica e aeroporto', ate: 30, estilo: 'ecologica' },
    { id: 'porto', nome: 'PORTO DO SOL', sub: 'cidade portuária', ate: 99, estilo: 'portuaria' }
  ];
  const MG = 6;          // margem fora das ruas (calçada + prédios)
  const INNER_W = COLS * PITCH + ROAD;
  const INNER_H = ROWS * PITCH + ROAD;
  const TW = INNER_W + MG * 2, TH = INNER_H + MG * 2;
  const W = TW * T, H = TH * T;

  // tipos de tile
  const TILE = { ROAD: 0, SIDE: 1, BUILD: 2, GRASS: 3, WATER: 4, BRIDGE: 5, CROSS: 6, LOT: 7 };   // LOT = estacionamento

  const tiles = new Uint8Array(TW * TH).fill(TILE.BUILD);
  const setRect = (tx, ty, tw, th, type) => {
    for (let y = ty; y < ty + th; y++) for (let x = tx; x < tx + tw; x++) tiles[y * TW + x] = type;
  };

  // ---------- Aleatório com semente (a cidade é sempre a mesma) ----------
  // clareia (+) ou escurece (-) uma cor '#rrggbb'
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k))));
    return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')';
  }
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
  const laneV = (i, dir) => roadLeft(i) + (dir > 0 ? ROAD * 0.25 : ROAD * 0.75) * T;  // dir>0 = descendo
  const laneH = (j, dir) => roadTop(j) + (dir > 0 ? ROAD * 0.75 : ROAD * 0.25) * T;   // dir>0 = indo p/ direita

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
    { kind: 'tile', base: '#d8c25a', edge: '#efdc82', dark: '#a8923a' },
    { kind: 'flat', base: '#e6e8ee', edge: '#ffffff', dark: '#b4b8c4' },
    { kind: 'tile', base: '#3a7a6a', edge: '#5aa090', dark: '#25564a' },
    { kind: 'flat', base: '#4a4a58', edge: '#6a6a7c', dark: '#2e2e3a' },
  ];

  const buildings = [];
  const trees = [];
  const lamps = [];
  const ponds = [];
  const blocks = [];
  const hospitais = [];   // hospitais (ambulância leva ao mais próximo)

  // cria o objeto de um prédio (sem colocar no mapa). rg = gerador de números (para não mexer na cidade antiga)
  function mkBuilding(x, y, w, h, forceRoof, rg) {
    rg = rg || rnd;
    const p = ROOFS[forceRoof != null ? forceRoof : Math.floor(rg() * ROOFS.length)];
    const b = { x, y, w, h, p, ridge: w >= h ? 'h' : 'v', det: [] };
    if (p.kind === 'flat') {
      const n = 1 + Math.floor(rg() * 3);
      for (let k = 0; k < n; k++) {
        b.det.push({ fx: 0.2 + rg() * 0.6, fy: 0.2 + rg() * 0.6, t: ['ac', 'sky', 'tank', 'ac', 'solar', 'vent', 'ant'][Math.floor(rg() * 7)] });
      }
    } else if (rg() < 0.5) {
      b.det.push({ fx: 0.25 + rg() * 0.5, fy: 0.3 + rg() * 0.4, t: 'chim' });
    }
    return b;
  }
  function addBuilding(x, y, w, h, forceRoof) { buildings.push(mkBuilding(x, y, w, h, forceRoof)); }

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

  const PARKS = [[1, 1], [5, 3], [7, 3], [2, 7], [8, 5], [18, 2], [25, 6]];
  // as quadras novas (interior e cidade vizinha): obras (4 lotes pequenos), obra (1 lote grande), campo, aeroporto
  const NOVAS = {};
  (function gerarNovas() {
    const g = mulberry32(31337);
    const cidade = q => q < 0.40 ? 'obras' : q < 0.70 ? 'obra' : q < 0.82 ? 'campo' : 'obras';
    for (let by = 0; by < ROWS; by++) {
      for (let bx = 10; bx <= 15; bx++) NOVAS[bx + ',' + by] = g() < 0.30 ? 'fazenda' : 'floresta';             // Mata Escura
      for (let bx = 17; bx <= 19; bx++) NOVAS[bx + ',' + by] = cidade(g());                                       // Novo Horizonte
      for (let bx = 20; bx <= 22; bx++) NOVAS[bx + ',' + by] = g() < 0.45 ? 'campo' : g() < 0.5 ? 'fazenda' : 'floresta';
      for (let bx = 24; bx <= 26; bx++) NOVAS[bx + ',' + by] = cidade(g());                                       // Vale Verde
      for (let bx = 27; bx <= 29; bx++) NOVAS[bx + ',' + by] = g() < 0.6 ? 'floresta' : 'campo';
      for (let bx = 31; bx <= 32; bx++) NOVAS[bx + ',' + by] = cidade(g());                                       // Porto do Sol
      NOVAS['33,' + by] = 'porto';
    }
    NOVAS['26,4'] = 'aeroporto';
  })();
  const lotes = [];            // lotes de obra (cidade.js constrói neles)
  const places = [];          // lugares grandes e comércios (dá para entrar)
  const casas = [];           // todas as casas (dá para entrar em todas!)
  const mercados = [];        // supermercados com estacionamento
  const ESPECIAIS = { '6,1': 'mercado', '8,4': 'mercado', '1,4': 'hotel', '5,4': 'hotel', '0,5': 'hotel', '7,5': 'hotel', '1,6': 'prefeitura', '4,6': 'delegacia', '6,6': 'estadio', '7,7': 'hospital' };
  const MERCADOS_DEF = [
    { id: 'mercadao', nome: 'MERCADÃO', cor: '#2e8b3e', horario: [6, 22] },
    { id: 'atacadao', nome: 'ATACADÃO', cor: '#d9a40a', horario: [7, 21] }
  ];
  const HOTEIS_DEF = {
    '1,4': { id: 'hotel_grand', nome: 'GRAND HOTEL RIBEIRÃO', cor: '#c8a24a', nivel: 'luxo', estrelas: 5 },
    '5,4': { id: 'hotel_central', nome: 'HOTEL CENTRAL', cor: '#3a7ad3', nivel: 'medio', estrelas: 3 },
    '7,5': { id: 'hotel_estrela', nome: 'HOTEL ESTRELA', cor: '#7a8a3a', nivel: 'simples', estrelas: 2 },
    '0,5': { id: 'hotel_pensao', nome: 'PENSÃO DO ZÉ', cor: '#8a5a3a', nivel: 'feio', estrelas: 1 }
  };
  // a porta fica na calçada, embaixo da fachada: precisa de chão livre na frente
  const temFrente = b => {
    const cx = Math.floor((b.x + b.w / 2) / T);
    return tiles[Math.floor((b.y + b.h + 10) / T) * TW + cx] !== TILE.BUILD && tiles[Math.floor((b.y + b.h + 26) / T) * TW + cx] !== TILE.BUILD
      && tiles[Math.floor((b.y + b.h + 10) / T) * TW + cx] !== TILE.WATER;
  };
  function addCasa(b) {
    const n = casas.length, area = b.w * b.h / (T * T), hr = mulberry32(1000 + n * 37);
    const c = { id: 'c' + n, tipo: 'casa', nome: 'CASA', b, x: b.x + b.w / 2, y: b.y + b.h + 24, r: 30, seed: 1000 + n * 37, area: Math.round(area) };
    c.venda = hr() < 0.16; c.preco = Math.round((1200 + area * 26) / 100) * 100;
    b.casa = c; casas.push(c);
  }
  function criarBloco(bx, by) {
    const tx = MG + ROAD + bx * PITCH, ty = MG + ROAD + by * PITCH, key = bx + ',' + by;
    let kind = 'city';
    if (RIVERS.includes(bx)) kind = 'river';
    else if (PARKS.some(p => p[0] === bx && p[1] === by)) kind = 'park';
    else if (ESPECIAIS[key]) kind = ESPECIAIS[key];
    else if (NOVAS[key]) kind = NOVAS[key];
    else if ((bx >= 6 || by >= 4) && (bx * 5 + by * 3) % 4 !== 0) kind = 'vila';
    const blk = { bx, by, tx, ty, x: tx * T, y: ty * T, w: BLOCK * T, h: BLOCK * T, kind };
    blocks.push(blk);
    if (kind === 'river') { setRect(tx, ty, BLOCK, BLOCK, TILE.WATER); return; }
    setRect(tx, ty, BLOCK, BLOCK, TILE.SIDE);
    if (kind === 'city') {
      setRect(tx + 2, ty + 2, 8, 8, TILE.BUILD);
      const antes = buildings.length;
      partition(tx + 2, ty + 2, 8, 8);
      for (let k = antes; k < buildings.length; k++) { const b = buildings[k]; if (b.p.kind !== 'flat' && temFrente(b)) addCasa(b); }
    } else if (kind === 'vila') {
      // 4 casinhas separadas por vielas em cruz: todas têm porta para uma calçada
      [[0, 0], [5, 0], [0, 5], [5, 5]].forEach(([a, c]) => {
        setRect(tx + 2 + a, ty + 2 + c, 3, 3, TILE.BUILD);
        addBuilding((tx + 2 + a) * T + 5, (ty + 2 + c) * T + 5, 3 * T - 10, 3 * T - 10, 3 + Math.floor(rnd() * 4));
        addCasa(buildings[buildings.length - 1]);
      });
    } else if (kind === 'mercado') {
      const def = MERCADOS_DEF[mercados.length];
      setRect(tx + 1, ty + 1, 10, 5, TILE.BUILD);
      addBuilding((tx + 1) * T + 5, (ty + 1) * T + 5, 10 * T - 10, 5 * T - 10, 1);
      const b = buildings[buildings.length - 1]; b.det = [{ fx: 0.2, fy: 0.5, t: 'ac' }, { fx: 0.5, fy: 0.5, t: 'ac' }, { fx: 0.8, fy: 0.5, t: 'vent' }]; b.mercado = def;
      setRect(tx, ty + 6, 12, 6, TILE.LOT);
      const lotTop = (ty + 6) * T, vagas = [];
      for (let i = 0; i < 8; i++) { const x = blk.x + 24 + i * 40; vagas.push({ x, y: lotTop + 66, a: 0, fila: 'A', i }); vagas.push({ x, y: lotTop + 164, a: Math.PI, fila: 'B', i }); }
      const pl = Object.assign({}, def, { tipo: 'mercado', b, x: b.x + b.w / 2, y: b.y + b.h + 24, r: 40 });
      b.place = pl; places.push(pl);
      const m = { def, place: pl, blk, vagas, lotTop, gateX: blk.x + 354, aisleY: lotTop + 114, laneY: blk.y + blk.h + ROAD * 0.25 * T, j: by + 1 };
      blk.mercado = m; mercados.push(m);
      lamps.push({ x: blk.x + 14, y: lotTop + 14 }, { x: blk.x + blk.w - 14, y: lotTop + 14 }, { x: blk.x + 14, y: lotTop + 112 }, { x: blk.x + blk.w - 14, y: lotTop + 112 });
    } else if (kind === 'hotel') {
      const def = HOTEIS_DEF[key];
      setRect(tx + 1, ty + 1, 10, 9, TILE.BUILD);
      addBuilding((tx + 1) * T + 5, (ty + 1) * T + 5, 10 * T - 10, 9 * T - 10, def.nivel === 'feio' ? 0 : 1);
      const b = buildings[buildings.length - 1]; b.det = []; b.hotel = def; blk.hotel = def;
      const pl = Object.assign({}, def, { tipo: 'hotel', b, x: b.x + b.w / 2, y: b.y + b.h + 24, r: 40 });
      b.place = pl; places.push(pl);
    } else if (kind === 'obras') {
      // 4 lotes pequenos para construir (casas, lojas, escritórios...), separados por vielas em cruz
      [[0, 0], [5, 0], [0, 5], [5, 5]].forEach(([a, c], k) => {
        setRect(tx + 2 + a, ty + 2 + c, 3, 3, TILE.BUILD);
        lotes.push({ id: 'L' + bx + '_' + by + '_' + k, bx, by, kind, tam: 'p', x: (tx + 2 + a) * T + 5, y: (ty + 2 + c) * T + 5, w: 3 * T - 10, h: 3 * T - 10 });
      });
    } else if (kind === 'obra') {
      // 1 lote grande (hotel, hospital, escola, fábrica, empresa, shopping...)
      setRect(tx + 2, ty + 2, 8, 8, TILE.BUILD);
      lotes.push({ id: 'L' + bx + '_' + by + '_0', bx, by, kind, tam: 'g', x: (tx + 2) * T + 5, y: (ty + 2) * T + 5, w: 8 * T - 10, h: 8 * T - 10 });
    } else if (kind === 'aeroporto') {
      setRect(tx + 1, ty + 1, 10, 7, TILE.LOT);          // pista e pátio (dá para andar)
      setRect(tx + 3, ty + 8, 6, 2, TILE.BUILD);         // terminal
      setRect(tx + 10, ty + 8, 1, 2, TILE.BUILD);        // torre
      lotes.push({ id: 'L' + bx + '_' + by + '_0', bx, by, kind, tam: 'a', x: (tx + 3) * T + 5, y: (ty + 8) * T + 5, w: 6 * T - 10, h: 2 * T - 10, pista: { x: (tx + 1) * T, y: (ty + 1) * T, w: 10 * T, h: 7 * T }, torre: { x: (tx + 10) * T + 4, y: (ty + 8) * T + 4, w: T - 8, h: 2 * T - 8 } });
    } else if (kind === 'floresta') {
      // floresta fechada: sem calçada, árvores por todo lado, às vezes clareira com cabana ou lagoa
      setRect(tx, ty, BLOCK, BLOCK, TILE.GRASS);
      const fr = mulberry32(bx * 733 + by * 211 + 17);
      const clare = fr() < 0.5 ? { x: tx + 4 + fr() * 4, y: ty + 4 + fr() * 4, r: 2.3 + fr() * 1.2 } : null;
      const lago = !clare && fr() < 0.3 ? { x: tx + 5 + fr() * 2, y: ty + 5 + fr() * 2, rx: 2.4 + fr(), ry: 1.8 + fr() * 0.8 } : null;
      if (lago) { for (let y = ty; y < ty + BLOCK; y++) for (let x = tx; x < tx + BLOCK; x++) { const dx = (x + 0.5 - lago.x) / lago.rx, dy = (y + 0.5 - lago.y) / lago.ry; if (dx * dx + dy * dy <= 1) tiles[y * TW + x] = TILE.WATER; } ponds.push({ x: lago.x * T, y: lago.y * T, rx: lago.rx * T, ry: lago.ry * T }); }
      const nT = 52 + Math.floor(fr() * 30);
      for (let k = 0; k < nT; k++) {
        const x = (tx + 0.7 + fr() * 10.6), y = (ty + 0.7 + fr() * 10.6), q = fr();
        if (clare && Math.hypot(x - clare.x, y - clare.y) < clare.r) continue;
        if (lago && Math.pow((x - lago.x) / (lago.rx + 0.8), 2) + Math.pow((y - lago.y) / (lago.ry + 0.8), 2) < 1) continue;
        trees.push({ x: x * T, y: y * T, r: 17 + q * 13, mata: true });
      }
      if (clare) {
        const cx = Math.round(clare.x) - 1, cy = Math.round(clare.y) - 1;
        setRect(cx, cy, 2, 2, TILE.BUILD);
        const cb = mkBuilding(cx * T + 3, cy * T + 3, 2 * T - 6, 2 * T - 6, 0, fr); cb.cabana = true; cb.det = []; buildings.push(cb);
        blk.cabana = { x: cx * T + T, y: cy * T + 2 * T + 18 };
      }
    } else if (kind === 'fazenda') {
      // fazenda de bilionário: mansão grande, piscina, heliponto, estábulo e pastos cercados
      setRect(tx, ty, BLOCK, BLOCK, TILE.GRASS);
      const fr = mulberry32(bx * 389 + by * 97 + 5), lado = fr() < 0.5 ? 1 : 3;
      const mx = tx + lado, my = ty + 2;
      setRect(mx, my, 7, 3, TILE.BUILD);
      const mb = mkBuilding(mx * T + 4, my * T + 4, 7 * T - 8, 3 * T - 8, [3, 4, 6][Math.floor(fr() * 3)], fr); mb.det = []; mb.mansao = true; buildings.push(mb);
      addCasa(mb); mb.casa.rica = true; mb.casa.nome = 'MANSÃO'; mb.casa.venda = false; mb.casa.area = 120;
      const px = lado === 1 ? tx + 8 : tx + 1;
      setRect(px, ty + 6, 3, 2, TILE.WATER);                    // piscina
      setRect(tx + (lado === 1 ? 1 : 8), ty + 7, 3, 3, TILE.LOT);   // heliponto
      blk.heli = { x: (tx + (lado === 1 ? 1 : 8) + 1.5) * T, y: (ty + 8.5) * T };
      setRect(tx + 5, ty + 5, 2, 7, TILE.LOT);                  // alameda de entrada
      const sb = mkBuilding((tx + 8.2) * T, (ty + 9.5) * T, 3 * T, 2 * T, 0, fr); sb.det = []; sb.estabulo = true; if (lado === 3) { sb.x = (tx + 0.8) * T; } buildings.push(sb); setRect(Math.floor(sb.x / T), Math.floor(sb.y / T), 3, 2, TILE.BUILD);
      for (let k = 0; k < 9; k++) trees.push({ x: (tx + 0.8 + fr() * 10.4) * T, y: (ty + 5.2 + fr() * 6) * T, r: 17 + fr() * 8, mata: true });
      blk.fazenda = { dono: ['O MAGNATA DO CAFÉ', 'A BARONESA DO BOI', 'O REI DO AGRO', 'O DONO DO BANCO', 'A HERDEIRA DO PETRÓLEO', 'O MAGNATA DA SOJA'][(bx + by * 3) % 6] };
    } else if (kind === 'prefeitura' || kind === 'delegacia' || kind === 'hospital' || kind === 'estadio') {
      // prédios públicos grandes, com praça ou estacionamento na frente
      const dims = { prefeitura: [10, 6], delegacia: [10, 6], hospital: [10, 7], estadio: [10, 10] }[kind];
      setRect(tx + 1, ty + 1, dims[0], dims[1], TILE.BUILD);
      const nomes = { prefeitura: 'PREFEITURA DE RIBEIRÃO', delegacia: 'DELEGACIA GERAL', hospital: 'HOSPITAL SANTA CASA', estadio: 'ESTÁDIO MUNICIPAL' };
      const b = mkBuilding((tx + 1) * T + 5, (ty + 1) * T + 5, dims[0] * T - 10, dims[1] * T - 10, 1, rnd); b.det = []; b.publico = kind; b.custom = (ctx, bb) => drawPublico(ctx, bb); buildings.push(b);
      const pl = { tipo: kind, id: kind, nome: nomes[kind], cor: { prefeitura: '#1f4f8a', delegacia: '#16224a', hospital: '#d9363e', estadio: '#2a8a3a' }[kind], b, x: b.x + b.w / 2, y: b.y + b.h + 24, r: 42 };
      b.place = pl; places.push(pl); blk[kind] = pl;
      if (kind === 'hospital') hospitais.push({ x: pl.x, y: pl.y + 8, r: 44, nome: 'HOSPITAL SANTA CASA' });
      if (kind !== 'estadio') setRect(tx, ty + 1 + dims[1], BLOCK, BLOCK - 1 - dims[1], kind === 'delegacia' || kind === 'hospital' ? TILE.LOT : TILE.SIDE);
      if (kind === 'estadio') { for (let k = 0; k < 6; k++) trees.push({ x: (tx + 0.9 + k * 2) * T, y: (ty + 11.3) * T, r: 15 }); }
    } else if (kind === 'porto') {
      // porto: cais de concreto, galpões e o mar na ponta leste
      setRect(tx, ty, BLOCK, BLOCK, TILE.LOT);
      setRect(tx + 7, ty, 5, BLOCK, TILE.WATER);
      const fr = mulberry32(by * 61 + 11);
      [[1, 1], [1, 7]].forEach(([a, c]) => { setRect(tx + a, ty + c, 4, 3, TILE.BUILD); const gb = mkBuilding((tx + a) * T + 4, (ty + c) * T + 4, 4 * T - 8, 3 * T - 8, 7, fr); gb.det = []; gb.galpao = true; buildings.push(gb); });
      blk.porto = true;
    } else if (kind === 'campo') {
      // fazenda: calçada em volta, plantação no meio e um celeiro
      setRect(tx + 2, ty + 2, 8, 8, TILE.GRASS);
      setRect(tx + 3, ty + 3, 3, 2, TILE.BUILD);
      buildings.push(mkBuilding((tx + 3) * T + 4, (ty + 3) * T + 4, 3 * T - 8, 2 * T - 8, 4, mulberry32(bx * 91 + by * 17)));
      const rr = mulberry32(bx * 53 + by * 29);
      [[2.6, 9.4], [9.4, 9.4], [9.4, 2.6], [6.5, 9.4]].forEach(([a, b]) => trees.push({ x: (tx + a) * T, y: (ty + b) * T, r: 20 + rr() * 6 }));
    } else {
      setRect(tx + 2, ty + 2, 8, 8, TILE.GRASS);
      const cx = tx + 6, cy = ty + 6;
      for (let y = ty + 2; y < ty + 10; y++) for (let x = tx + 2; x < tx + 10; x++) {
        const dx = (x + 0.5 - cx) / 2.6, dy = (y + 0.5 - cy) / 2.0;
        if (dx * dx + dy * dy <= 1) tiles[y * TW + x] = TILE.WATER;
      }
      ponds.push({ x: cx * T, y: cy * T, rx: 2.6 * T, ry: 2.0 * T });
      const tp = [[2.9, 2.9], [9.1, 2.9], [2.9, 9.1], [9.1, 9.1], [6, 2.7], [6, 9.3]];
      tp.forEach(([a, b]) => trees.push({ x: (tx + a) * T, y: (ty + b) * T, r: 22 + rnd() * 6 }));
    }
  }
  // primeiro a cidade antiga (sempre igual), depois os bairros novos
  for (let by = 0; by < 4; by++) for (let bx = 0; bx < 6; bx++) criarBloco(bx, by);
  for (let by = 0; by < ROWS; by++) for (let bx = 0; bx < 9; bx++) if (!(bx < 6 && by < 4)) criarBloco(bx, by);
  for (let by = 0; by < ROWS; by++) for (let bx = 9; bx < COLS; bx++) criarBloco(bx, by);
  // árvores enfileiradas nas calçadas das quadras novas (cidade organizada e bonita)
  blocks.forEach(blk => {
    if (!['obras', 'obra', 'campo'].includes(blk.kind)) return;
    const rr = mulberry32(blk.bx * 17 + blk.by * 131 + 7), off = 0.9 * T;
    [1.4, 4.6, 7.4, 10.6].forEach(a => {
      trees.push({ x: blk.x + a * T, y: blk.y + off, r: 14 + rr() * 3 });                         // lado de cima
      if (blk.kind !== 'campo') { trees.push({ x: blk.x + off, y: blk.y + a * T, r: 14 + rr() * 3 }); trees.push({ x: blk.x + blk.w - off, y: blk.y + a * T, r: 14 + rr() * 3 }); }
    });
    trees.push({ x: blk.x + 1.2 * T, y: blk.y + blk.h - off, r: 15 }, { x: blk.x + blk.w - 1.2 * T, y: blk.y + blk.h - off, r: 15 });
  });
  // pontes e faixas de pedestre
  const rios = blocks.filter(b => b.kind === 'river');
  const temPonte = (bx, j) => PONTES[bx] === 'todas' || (Array.isArray(PONTES[bx]) && PONTES[bx].includes(j));
  rios.forEach(rv => { for (let j = 0; j <= ROWS; j++) setRect(rv.tx, MG + j * PITCH, BLOCK, ROAD, temPonte(rv.bx, j) ? TILE.BRIDGE : TILE.WATER); });
  // pode um carro ir de um cruzamento ao vizinho na horizontal? (rios sem ponte bloqueiam)
  // segmento s = quadra entre o cruzamento s e o s+1
  const cruzaOk = (s, j) => !RIVERS.includes(s) || temPonte(s, j);
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

  // ---------- Lugares da nossa cidade (dá para entrar!) ----------
  const PLACE_DEFS = [
    { id: 'pinguim', nome: 'PINGUIM CHOPP', cor: '#1d5fb4' }, { id: 'banco', nome: 'BANCO RIBEIRÃO', cor: '#2a5a9a', horario: [10, 16] }, { id: 'padaria', nome: 'PADARIA PÃO QUENTE', cor: '#c8782a', horario: [5, 21] }, { id: 'pizzaria', nome: 'PIZZARIA DONA MARIA', cor: '#b02a2a', horario: [11, 24] },
    { id: 'farmacia', nome: 'FARMÁCIA DROGA SAÚDE', cor: '#d9363e' }, { id: 'barbearia', nome: 'BARBEARIA', cor: '#7b3fa0' },
    { id: 'shopping', nome: 'SHOPPING SANTA ÚRSULA', cor: '#e07b1a' }, { id: 'teatro', nome: 'TEATRO PEDRO II', cor: '#8a1f3a' },
    { id: 'casa', nome: 'SUA CASA', cor: '#44607a' }, { id: 'academia', nome: 'ACADEMIA FORÇA TOTAL', cor: '#b8960c' },
    { id: 'catedral', nome: 'CATEDRAL', cor: '#6a6a78' }
  ];
  (function () {
    const excl = new Set(['0,0', '1,0', '4,1', '2,0']);   // quadras que já têm garagem, loja de armas, hospital e telefone
    const elig = [];
    blocks.forEach(blk => {
      if (blk.kind !== 'city' || excl.has(blk.bx + ',' + blk.by)) return;
      let best = null;
      buildings.forEach(b => {
        if (b.p.kind !== 'flat' || b.w < 100 || b.h < 80) return;
        if (b.x < blk.x || b.x > blk.x + blk.w || b.y < blk.y || b.y > blk.y + blk.h) return;
        const cx = b.x + b.w / 2;
        if (tiles[Math.floor((b.y + b.h + 10) / T) * TW + Math.floor(cx / T)] !== TILE.SIDE) return;
        if (tiles[Math.floor((b.y + b.h + 26) / T) * TW + Math.floor(cx / T)] !== TILE.SIDE) return;
        if (!best || b.w > best.w) best = b;
      });
      if (best) elig.push(best);
    });
    const used = new Set();
    PLACE_DEFS.forEach((df, k) => {
      let i = Math.floor(k * elig.length / PLACE_DEFS.length);
      for (let g = 0; g < elig.length && used.has(i % elig.length); g++) i++;
      i %= elig.length; if (!elig.length || used.has(i)) return; used.add(i);
      const b = elig[i], p = Object.assign({ tipo: 'lugar' }, df, { b, x: b.x + b.w / 2, y: b.y + b.h + 24, r: 38 });
      b.place = p; places.push(p);
    });
  })();

  // ---------- Comércios comuns (lanchonete, ótica, ferragem...) ----------
  // Todo prédio comercial com porta na calçada vira uma loja de verdade: tem letreiro com o nome certo e dá para entrar.
  const LOJAS_DEF = [
    { tipo: 'lanchonete', nomes: ['LANCHES DO ZECA', 'BIG LANCHE', 'X-TUDO DA ESQUINA'], cor: '#d9541e', horario: [10, 23] },
    { tipo: 'sorveteria', nomes: ['SORVETERIA GELATTO', 'PICOLÉ DO BAIRRO'], cor: '#e060a0', horario: [11, 22] },
    { tipo: 'acougue', nomes: ['AÇOUGUE BOI GORDO', 'CASA DE CARNES SUL'], cor: '#9a2a2a', horario: [7, 19] },
    { tipo: 'floricultura', nomes: ['FLORICULTURA FLOR DE LIS', 'FLORES DA VOVÓ'], cor: '#3a9a5a', horario: [8, 18] },
    { tipo: 'petshop', nomes: ['PET SHOP AUAU', 'PET SHOP BICHO FELIZ'], cor: '#2a9ab0', horario: [8, 19] },
    { tipo: 'livraria', nomes: ['LIVRARIA PÁGINA UM', 'PAPELARIA O LÁPIS'], cor: '#6a4a9a', horario: [9, 19] },
    { tipo: 'eletronicos', nomes: ['TECNO CELL', 'ELETRO RIBEIRÃO'], cor: '#2a5ad0', horario: [9, 20] },
    { tipo: 'otica', nomes: ['ÓTICA VISÃO CLARA', 'ÓTICA OLHAR'], cor: '#3a6aa0', horario: [9, 19] },
    { tipo: 'ferragem', nomes: ['FERRAGEM SÃO JOÃO', 'CASA DO PARAFUSO'], cor: '#8a6a2a', horario: [7, 18] },
    { tipo: 'loteria', nomes: ['LOTÉRICA SORTE GRANDE', 'LOTÉRICA DA ESQUINA'], cor: '#2a8a4a', horario: [8, 20] },
    { tipo: 'mercadinho', nomes: ['MERCADINHO BOM PREÇO', 'MERCEARIA DO SEU JOÃO'], cor: '#c8a028', horario: [7, 22] },
    { tipo: 'roupas', nomes: ['MODA JOVEM', 'BOUTIQUE ELEGANTE'], cor: '#c04a8a', horario: [9, 20] },
    { tipo: 'bar', nomes: ['BAR DO ZÉ', 'BOTECO DA ESQUINA'], cor: '#a05a1a', horario: [11, 24] },
    { tipo: 'cafe', nomes: ['CAFÉ DO CENTRO', 'CAFETERIA GRÃO FINO'], cor: '#6a4028', horario: [6, 20] }
  ];
  const lojas = [];
  // "evitar" = pontos (telefones, garagem, hospital...) que não podem ficar em cima de uma porta
  function gerarLojas(evitar) {
    if (lojas.length) return;
    const r = mulberry32(4242), usados = new Set();
    const portas = places.concat(casas.filter(c => !c.b.place));
    const cand = [];
    blocks.forEach(blk => {
      if (blk.kind !== 'city') return;
      buildings.forEach(b => {
        if (b.p.kind !== 'flat' || b.place || b.casa || b.w < 80 || b.h < 60) return;
        if (b.x < blk.x || b.x > blk.x + blk.w || b.y < blk.y || b.y > blk.y + blk.h) return;
        const cx = b.x + b.w / 2;
        if (tiles[Math.floor((b.y + b.h + 10) / T) * TW + Math.floor(cx / T)] !== TILE.SIDE) return;
        if (tiles[Math.floor((b.y + b.h + 26) / T) * TW + Math.floor(cx / T)] !== TILE.SIDE) return;
        const px = cx, py = b.y + b.h + 24;
        if ((evitar || []).some(e => Math.hypot(e.x - px, e.y - py) < 100)) return;
        if (portas.some(q => Math.hypot(q.x - px, q.y - py) < 100)) return;
        cand.push({ b, px, py });
      });
    });
    // baralho de tipos embaralhado: cada tipo aparece uma vez antes de repetir
    let baralho = [];
    cand.forEach(c => {
      if (!baralho.length) { baralho = LOJAS_DEF.slice(); for (let i = baralho.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [baralho[i], baralho[j]] = [baralho[j], baralho[i]]; } }
      const df = baralho.pop();
      let nome = df.nomes.find(n => !usados.has(n)); if (!nome) nome = df.nomes[0] + ' 2'; usados.add(nome);
      const pl = { tipo: 'loja', id: 'loja' + lojas.length, loja: df.tipo, nome, cor: df.cor, horario: df.horario, b: c.b, x: c.px, y: c.py, r: 34 };
      c.b.place = pl; places.push(pl); lojas.push(pl);
    });
  }
  const propList = [];
  blocks.forEach(blk => { if (blk.kind !== 'river') blockProps(blk).forEach(p => propList.push(p)); });

  // ---------- Consultas ----------
  function tileAt(px, py) {
    const tx = Math.floor(px / T), ty = Math.floor(py / T);
    if (tx < 0 || ty < 0 || tx >= TW || ty >= TH) return TILE.BUILD;
    return tiles[ty * TW + tx];
  }
  const isSolid = (px, py) => { const t = tileAt(px, py); return t === TILE.BUILD || t === TILE.WATER; };
  // grade espacial: com milhares de árvores na mata, só olhamos as vizinhas
  const TG = 128; let treeGrid = null, treeGridN = -1;
  function montaGrade() {
    treeGrid = new Map(); treeGridN = trees.length;
    for (let k = 0; k < trees.length; k++) {
      const t = trees[k], r = t.r * 0.55 + 12;
      for (let gy = Math.floor((t.y - r) / TG); gy <= Math.floor((t.y + r) / TG); gy++) for (let gx = Math.floor((t.x - r) / TG); gx <= Math.floor((t.x + r) / TG); gx++) {
        const key = gx * 4096 + gy; let l = treeGrid.get(key); if (!l) treeGrid.set(key, l = []); l.push(t);
      }
    }
  }
  function treeHit(px, py, pad) {
    if (!treeGrid || treeGridN !== trees.length) montaGrade();
    const l = treeGrid.get(Math.floor(px / TG) * 4096 + Math.floor(py / TG)); if (!l) return false;
    for (let k = 0; k < l.length; k++) {
      const t = l[k], dx = px - t.x, dy = py - t.y, rr = t.r * 0.55 + (pad || 0);
      if (dx * dx + dy * dy < rr * rr) return true;
    }
    return false;
  }
  const isRoadTile = t => t === TILE.ROAD || t === TILE.BRIDGE || t === TILE.CROSS;
  const pedWalkable = t => t === TILE.SIDE || t === TILE.CROSS || t === TILE.GRASS || t === TILE.LOT;

  // ---------- Desenho ----------
  const tex = {};
  function makeNoise(base, n, light, dark, size, blobs) {
    const S = size || 128;
    const c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d'); x.fillStyle = base; x.fillRect(0, 0, S, S);
    const r = mulberry32(base.length * 977 + n);
    // manchas grandes e suaves (desgaste), repetidas nas bordas para o padrão emendar
    (blobs || []).forEach(([col, cnt, r0, r1]) => {
      for (let k = 0; k < cnt; k++) {
        const bx = r() * S, by = r() * S, rad = r0 + r() * (r1 - r0);
        x.fillStyle = col;
        for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { x.beginPath(); x.arc(bx + ox, by + oy, rad, 0, 7); x.fill(); }
      }
    });
    for (let k = 0; k < n; k++) {
      x.fillStyle = r() < 0.5 ? light : dark;
      x.fillRect(Math.floor(r() * S), Math.floor(r() * S), 1 + (r() < 0.2 ? 1 : 0), 1);
    }
    return c;
  }
  function makeTextures() {
    tex.asphalt = makeNoise('#625889', 5200, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.10)', 256,
      [['rgba(0,0,0,0.035)', 46, 8, 28], ['rgba(255,255,255,0.03)', 34, 8, 24], ['rgba(40,20,70,0.04)', 14, 14, 40]]);
    tex.rim = makeNoise('#3b3442', 1200, 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0.12)');
    tex.grass = makeNoise('#4a9038', 2600, 'rgba(190,255,150,0.16)', 'rgba(0,50,0,0.2)', 128,
      [['rgba(20,80,20,0.06)', 18, 6, 18], ['rgba(180,230,110,0.05)', 14, 6, 16]]);
    { // fios de grama
      const g = tex.grass.getContext('2d'), r = mulberry32(4242);
      for (let k = 0; k < 420; k++) { g.strokeStyle = r() < 0.5 ? 'rgba(200,255,140,0.35)' : 'rgba(10,60,10,0.35)'; g.lineWidth = 1; const gx = r() * 128, gy = r() * 128; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + (r() - 0.5) * 3, gy - 2 - r() * 3); g.stroke(); }
    }
    tex.water = makeNoise('#21407e', 1500, 'rgba(140,190,255,0.14)', 'rgba(0,0,30,0.2)', 128);
    tex.terra = makeNoise('#8c6e49', 1400, 'rgba(210,170,110,0.22)', 'rgba(60,40,20,0.25)', 128, [['rgba(110,80,48,0.35)', 12, 10, 28], ['rgba(170,140,95,0.25)', 8, 8, 20]]);
    tex.alley = makeNoise('#59505f', 700, 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0.12)');
    { // cascalho do telhado (transparente, vai por cima da cor do telhado)
      const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = mulberry32(99);
      for (let k = 0; k < 1100; k++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.16)'; g.fillRect(Math.floor(r() * 128), Math.floor(r() * 128), 1 + (r() < 0.3 ? 1 : 0), 1); }
      tex.gravel = c;
    }
    { // lajotas da calçada: sujeira e rachaduras
      const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = mulberry32(7);
      for (let k = 0; k < 500; k++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.14)' : 'rgba(90,70,30,0.12)'; g.fillRect(Math.floor(r() * 128), Math.floor(r() * 128), 1 + (r() < 0.3 ? 1 : 0), 1); }
      tex.paving = c;
    }
  }

  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  // altura da parede (fachada) que aparece embaixo do telhado — dá o efeito 2.5D
  function fachada(b) { if (b.hotel) return 54; if (b.mercado) return 46; if (b.place) return Math.min(36, Math.floor(b.h * 0.34)); return b.p.kind === 'tile' ? Math.min(20, Math.floor(b.h * 0.26)) : Math.min(30, Math.floor(b.h * 0.3)); }

  // parede de frente do prédio: degradê, janelas com reflexo, porta e sombra do beiral

  // ---------- prédios públicos: prefeitura, delegacia, hospital e estádio ----------
  function fachadaPub(ctx, b, fh, parede, janela, nome, corPlaca) {
    const y0 = b.y + b.h - fh;
    ctx.fillStyle = 'rgba(0,0,12,0.35)'; ctx.fillRect(b.x + 6, b.y + b.h, b.w, 12);
    const g = ctx.createLinearGradient(0, y0, 0, y0 + fh); g.addColorStop(0, shade(parede, 0.12)); g.addColorStop(1, shade(parede, -0.28));
    ctx.fillStyle = g; ctx.fillRect(b.x, y0, b.w, fh);
    for (let x = b.x + 14; x < b.x + b.w - 26; x += 26) {
      if (Math.abs(x + 8 - (b.x + b.w / 2)) < 30) continue;
      ctx.fillStyle = janela; ctx.fillRect(x, y0 + 12, 14, 18); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x, y0 + 12, 5, 18); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.strokeRect(x + 0.5, y0 + 12.5, 13, 17);
    }
    const cx = b.x + b.w / 2;
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(cx - 17, y0 + fh - 28, 34, 28); ctx.fillStyle = '#e8c36a'; ctx.fillRect(cx - 1, y0 + fh - 28, 2, 28);
    ctx.fillStyle = corPlaca; ctx.fillRect(cx - 62, y0 + 1, 124, 14); ctx.strokeStyle = '#fff'; ctx.strokeRect(cx - 61.5, y0 + 1.5, 123, 13);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Arial'; ctx.textAlign = 'center'; ctx.fillText(nome, cx, y0 + 11.5);
  }
  function drawPublico(ctx, b) {
    const k = b.publico, fh = k === 'estadio' ? 38 : 44, h = b.h - fh, x = b.x, y = b.y, w = b.w;
    ctx.save();
    if (k === 'estadio') {
      const cx = x + w / 2, cy = y + h / 2 - 4, rx = w / 2 - 2, ry = h / 2 - 2;
      fachadaPub(ctx, b, fh, '#8d8f99', '#cfe8ff', 'ESTÁDIO MUNICIPAL', '#1f6a2a');
      ctx.fillStyle = '#6a6c78'; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#b8bac6'; ctx.lineWidth = 3; ctx.stroke();
      const rg = ctx.createRadialGradient(cx, cy, ry * 0.45, cx, cy, ry); rg.addColorStop(0, '#a02a2a'); rg.addColorStop(0.5, '#c43a3a'); rg.addColorStop(1, '#2a4aa0');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(cx, cy, rx - 8, ry - 8, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; for (let q = 0; q < 5; q++) { ctx.beginPath(); ctx.ellipse(cx, cy, rx - 12 - q * 5, ry - 12 - q * 5, 0, 0, 7); ctx.stroke(); }
      ctx.fillStyle = '#2f9a3a'; ctx.beginPath(); ctx.ellipse(cx, cy, rx - 36, ry - 36, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; ctx.strokeRect(cx - rx + 44, cy - ry + 44, 2 * rx - 88, 2 * ry - 88);
      ctx.beginPath(); ctx.moveTo(cx - rx + 44, cy); ctx.lineTo(cx + rx - 44, cy); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, 20, 0, 7); ctx.stroke();
      for (let q = 0; q < 14; q++) { ctx.fillStyle = q % 2 ? '#2a8a32' : '#34a03c'; ctx.fillRect(cx - rx + 46 + q * ((2 * rx - 92) / 14), cy - ry + 46, (2 * rx - 92) / 14, 2 * ry - 92); }
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.strokeRect(cx - rx + 44, cy - ry + 44, 2 * rx - 88, 2 * ry - 88); ctx.beginPath(); ctx.moveTo(cx - rx + 44, cy); ctx.lineTo(cx + rx - 44, cy); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, 20, 0, 7); ctx.stroke();
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { ctx.fillStyle = '#d8d8e0'; ctx.fillRect(cx + sx * (rx - 6) - 4, cy + sy * (ry - 6) - 4, 8, 8); ctx.fillStyle = 'rgba(255,255,200,0.5)'; ctx.beginPath(); ctx.arc(cx + sx * (rx - 6), cy + sy * (ry - 6), 7, 0, 7); ctx.fill(); });
    } else {
      const cor = { prefeitura: '#d8cfae', delegacia: '#3a4a7a', hospital: '#e8eaee' }[k];
      fachadaPub(ctx, b, fh, { prefeitura: '#cfc29a', delegacia: '#2a3a68', hospital: '#dfe3ea' }[k], '#9fd0f0', { prefeitura: 'PREFEITURA', delegacia: 'DELEGACIA GERAL', hospital: 'HOSPITAL SANTA CASA' }[k], { prefeitura: '#1f4f8a', delegacia: '#16224a', hospital: '#c82a32' }[k]);
      ctx.fillStyle = shade(cor, -0.35); ctx.fillRect(x, y, w, h); ctx.fillStyle = shade(cor, 0.12); ctx.fillRect(x + 3, y + 3, w - 6, h - 6); ctx.fillStyle = cor; ctx.fillRect(x + 7, y + 7, w - 14, h - 14);
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let q = 0; q < w; q += 14) ctx.fillRect(x + q, y + 7, 1, h - 14);
      const cx = x + w / 2, cy = y + h / 2;
      if (k === 'prefeitura') {
        const g = ctx.createRadialGradient(cx - 6, cy - 6, 3, cx, cy, 34); g.addColorStop(0, '#f4ecc8'); g.addColorStop(1, '#8a9a8a');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 34, 0, 7); ctx.fill(); ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; for (let q = 0; q < 8; q++) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(q * 0.785) * 34, cy + Math.sin(q * 0.785) * 34); ctx.stroke(); }
        ctx.fillStyle = '#2a8a3a'; ctx.fillRect(x + 16, cy - 8, 22, 16); ctx.fillStyle = '#f2d21a'; ctx.fillRect(x + w - 38, cy - 8, 22, 16);
      } else if (k === 'delegacia') {
        ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.fillText('POLÍCIA', cx, cy + 7);
        ctx.fillStyle = '#d9242a'; ctx.fillRect(x + 14, y + 12, 10, 6); ctx.fillStyle = '#2a5ad0'; ctx.fillRect(x + 24, y + 12, 10, 6);
        ctx.fillStyle = '#34383f'; ctx.beginPath(); ctx.arc(x + w - 38, cy, 20, 0, 7); ctx.fill(); ctx.strokeStyle = '#ffe04a'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#ffe04a'; ctx.font = 'bold 22px Arial'; ctx.fillText('H', x + w - 38, cy + 8);
      } else {
        ctx.fillStyle = '#fff'; ctx.fillRect(cx - 28, cy - 28, 56, 56); ctx.fillStyle = '#d9242a'; ctx.fillRect(cx - 10, cy - 24, 20, 48); ctx.fillRect(cx - 24, cy - 10, 48, 20);
        ctx.fillStyle = '#34383f'; ctx.beginPath(); ctx.arc(x + 40, cy, 22, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Arial'; ctx.fillText('H', x + 40, cy + 9);
      }
    }
    ctx.restore();
  }

  function drawFacade(ctx, b, fh) {
    const { x, w, p } = b, y = b.y + b.h - fh;
    const g = ctx.createLinearGradient(0, y, 0, y + fh);
    g.addColorStop(0, p.edge); g.addColorStop(1, p.dark);
    ctx.fillStyle = g; ctx.fillRect(x, y, w, fh);
    ctx.fillStyle = 'rgba(0,0,20,0.28)'; ctx.fillRect(x, y, w, fh); // parede fica na sombra
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x, y, w, 3);   // sombra do beiral
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x, y + fh - 2, w, 2); // base clara
    const rs = mulberry32(Math.floor(b.x * 5 + b.y * 11)), temPorta = !!(b.place || b.casa);   // só quem dá para entrar tem porta
    const ww = b.p.kind === 'tile' ? 10 : 14, gap = ww + 9;
    for (let xx = x + 8; xx + ww < x + w - 6; xx += gap) {
      const acesa = rs() < 0.45, top = b.place ? 14 : 7, wy = y + top, wh = fh - top - 5;
      if (temPorta && Math.abs(xx + ww / 2 - (x + w / 2)) < 24) continue; // deixa espaço para a porta
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(xx - 1, wy - 1, ww + 2, wh + 2);
      const gj = ctx.createLinearGradient(xx, wy, xx + ww, wy + wh);
      if (acesa) { gj.addColorStop(0, '#ffe6a0'); gj.addColorStop(1, '#e8a850'); } else { gj.addColorStop(0, '#6f93ad'); gj.addColorStop(1, '#1b2a38'); }
      ctx.fillStyle = gj; ctx.fillRect(xx, wy, ww, wh);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(xx, wy, 2, wh);   // reflexo
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(xx + ww / 2, wy, 1, wh); // divisão do vidro
    }
    // porta no meio (só nos lugares que dá para entrar)
    const dw = 16; if (temPorta) { ctx.fillStyle = '#1c1612'; ctx.fillRect(x + w / 2 - dw / 2 - 1, y + fh - 17, dw + 2, 17);
    ctx.fillStyle = '#5a3d28'; ctx.fillRect(x + w / 2 - dw / 2, y + fh - 16, dw, 16);
    ctx.fillStyle = '#c8a24a'; ctx.fillRect(x + w / 2 + 4, y + fh - 9, 2, 2);
    }
    if (b.place) { // letreiro do lugar (dá para entrar!)
      ctx.font = 'bold 8px Arial, sans-serif'; const tw8 = ctx.measureText(b.place.nome).width, fs = Math.max(5, Math.min(8, 8 * (w - 22) / tw8)); ctx.font = 'bold ' + fs + 'px Arial, sans-serif'; const sw = Math.min(w - 8, Math.max(60, Math.ceil(tw8 * fs / 8) + 14)), sx = x + w / 2 - sw / 2, sy = y + 2;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(sx + 1.5, sy + 2.5, sw, 10);
      const sg = ctx.createLinearGradient(0, sy, 0, sy + 10); sg.addColorStop(0, shade(b.place.cor, 0.25)); sg.addColorStop(1, shade(b.place.cor, -0.2));
      ctx.fillStyle = sg; ctx.fillRect(sx, sy, sw, 10); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.8; ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, 9);
      ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText(b.place.nome, x + w / 2 + 0.7, sy + 8); ctx.fillStyle = '#ffffff'; ctx.fillText(b.place.nome, x + w / 2, sy + 7.3); ctx.textAlign = 'left';
    }
    if (!temPorta) { /* parede lisa: sem porta nem toldo */ }
    else if (b.p.kind !== 'tile' && fh >= 24) { // toldo listrado sobre a porta (cor sorteada)
      const cores = b.place ? [b.place.cor, '#f2ecdc'] : [['#c8302a', '#f2ecdc'], ['#2a6ac8', '#f2ecdc'], ['#2a9a52', '#f2ecdc'], ['#e0a42a', '#f2ecdc'], ['#8a3ac2', '#f2ecdc']][Math.floor(rs() * 5)];
      const aw = 46, ax = x + w / 2 - aw / 2, ay = y + fh - (b.place ? 25 : 26);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(ax + 2, ay + 6, aw, 5);
      for (let k = 0; k < 8; k++) { ctx.fillStyle = cores[k % 2]; ctx.fillRect(ax + k * (aw / 8), ay, aw / 8 + 0.5, 8); }
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(ax, ay + 6, aw, 2); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(ax, ay, aw, 1);
    } else if (b.p.kind === 'tile') { // lampada da varanda
      ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(x + w / 2 + 14, y + fh - 12, 1.8, 0, 7); ctx.fill();
    }
    ctx.fillStyle = 'rgba(190,190,200,0.7)'; ctx.fillRect(x + 3, y + 3, 2, fh - 3); ctx.fillRect(x + w - 5, y + 3, 2, fh - 3); // canos de chuva
  }

  // telhados especiais: hotel (piscina, heliponto) e mercado (letreiro gigante)
  function roofEspecial(ctx, b, fh) {
    const { x, y, w } = b, h = b.h - fh;
    if (b.mercado) {
      ctx.save(); ctx.fillStyle = b.mercado.cor; ctx.globalAlpha = 0.92; ctx.fillRect(x + 20, y + 14, w - 40, 30); ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff'; ctx.font = 'bold 26px Arial Black, Arial'; ctx.textAlign = 'center'; ctx.fillText(b.mercado.nome, x + w / 2, y + 38);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 0; k < 6; k++) ctx.fillRect(x + 24 + k * ((w - 60) / 5), y + 56, 22, 12);   // claraboias
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < 6; k++) ctx.strokeRect(x + 24.5 + k * ((w - 60) / 5), y + 56.5, 22, 12);
      ctx.restore();
    } else if (b.hotel) {
      const lv = b.hotel.nivel;
      ctx.save();
      if (lv === 'luxo' || lv === 'medio') {
        const pw = w * 0.5, ph = h * 0.26, px = x + w * 0.38, py = y + h * 0.58;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px - 5, py - 5, pw + 10, ph + 10); ctx.fillStyle = '#e8e4d8'; ctx.fillRect(px - 4, py - 4, pw + 8, ph + 8);
        const g = ctx.createLinearGradient(px, py, px + pw, py + ph); g.addColorStop(0, '#3ac8e8'); g.addColorStop(1, '#1a7ac8'); ctx.fillStyle = g; ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < 5; k++) ctx.fillRect(px + 8 + k * (pw / 5), py + 6 + (k % 2) * 10, 14, 2);
        for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#f2f2f2' : lv === 'luxo' ? '#c8a24a' : '#3a7ad3'; ctx.fillRect(px + 6 + k * (pw / 6), py - 14, 18, 8); }   // espreguiçadeiras
        if (lv === 'luxo') { ctx.fillStyle = '#e8402a'; ctx.beginPath(); ctx.arc(x + w * 0.16, y + h * 0.3, 26, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 30px Arial'; ctx.textAlign = 'center'; ctx.fillText('H', x + w * 0.16, y + h * 0.3 + 10); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + w * 0.16, y + h * 0.3, 22, 0, 7); ctx.stroke(); }
        ctx.fillStyle = b.hotel.cor; ctx.fillRect(x + 12, y + 12, w - 24, 5);
      } else {
        ctx.fillStyle = 'rgba(60,30,10,0.22)'; for (let k = 0; k < 9; k++) ctx.fillRect(x + 12 + (k * 53) % (w - 50), y + 10 + (k * 37) % (h - 40), 26, 16);   // manchas de ferrugem
        ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.arc(x + w * 0.72, y + h * 0.3, 14, 0, 7); ctx.fill(); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; ctx.stroke();   // caixa-d'água velha
        if (lv === 'feio') { ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x + w * 0.2, y + h * 0.55, 40, 24); ctx.fillStyle = '#55555f'; ctx.fillRect(x + w * 0.2 + 3, y + h * 0.55 + 3, 34, 18); }
      }
      ctx.restore();
    }
  }
  function drawRoof(ctx, b) {
    if (b.custom) { b.custom(ctx, b); return; }
    const fh = fachada(b); drawFacade(ctx, b, fh);
    const { x, y, w, p } = b, h = b.h - fh;
    ctx.fillStyle = p.dark; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = p.edge; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = p.base; ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
    // volume: borda clara em cima/esquerda, escura embaixo/direita (mureta do telhado)
    ctx.fillStyle = 'rgba(255,255,255,0.30)'; ctx.fillRect(x + 2, y + 2, w - 4, 2); ctx.fillRect(x + 2, y + 2, 2, h - 4);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 2, y + h - 4, w - 4, 2); ctx.fillRect(x + w - 4, y + 2, 2, h - 4);
    // textura de cascalho e luz suave vinda de cima-esquerda
    ctx.save(); ctx.beginPath(); ctx.rect(x + 6, y + 6, w - 12, h - 12); ctx.clip();
    ctx.fillStyle = ctx.createPattern(tex.gravel, 'repeat'); ctx.globalAlpha = p.kind === 'tile' ? 0.5 : 1; ctx.fillRect(x + 6, y + 6, w - 12, h - 12); ctx.globalAlpha = 1;
    const lg = ctx.createLinearGradient(x, y, x + w, y + h); lg.addColorStop(0, 'rgba(255,255,255,0.13)'); lg.addColorStop(1, 'rgba(0,0,30,0.16)');
    ctx.fillStyle = lg; ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
    const rs = mulberry32(Math.floor(x * 7 + y * 13)); // manchas de infiltração
    for (let k = 0; k < 3; k++) { const sx = x + 10 + rs() * (w - 30), sy = y + 10 + rs() * (h - 30); ctx.fillStyle = 'rgba(30,20,10,0.07)'; ctx.fillRect(sx, sy, 3 + rs() * 6, 14 + rs() * 30); }
    ctx.restore();
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
      else if (d.t === 'solar') { // painel solar
        ctx.fillStyle = '#1b3560'; ctx.fillRect(dx - 2, dy, 26, 16); ctx.strokeStyle = '#6f93c8'; ctx.lineWidth = 1;
        ctx.beginPath(); for (let k = 1; k < 4; k++) { ctx.moveTo(dx - 2 + k * 6.5, dy); ctx.lineTo(dx - 2 + k * 6.5, dy + 16); } ctx.moveTo(dx - 2, dy + 8); ctx.lineTo(dx + 24, dy + 8); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(dx - 2, dy); ctx.lineTo(dx + 10, dy); ctx.lineTo(dx - 2, dy + 12); ctx.fill();
        ctx.strokeStyle = '#c8ccd4'; ctx.strokeRect(dx - 1.5, dy + 0.5, 25, 15); }
      else if (d.t === 'vent') { // exaustor
        ctx.fillStyle = '#9ea3ad'; ctx.beginPath(); ctx.arc(dx + 9, dy + 9, 8, 0, 7); ctx.fill(); ctx.strokeStyle = '#4a4e58'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.strokeStyle = '#4a4e58'; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * 1.047; ctx.moveTo(dx + 9, dy + 9); ctx.lineTo(dx + 9 + Math.cos(a) * 7, dy + 9 + Math.sin(a) * 7); } ctx.stroke();
        ctx.fillStyle = '#2c2f36'; ctx.beginPath(); ctx.arc(dx + 9, dy + 9, 2, 0, 7); ctx.fill(); }
      else if (d.t === 'ant') { // antena com cabos de apoio
        ctx.strokeStyle = 'rgba(40,40,50,0.55)'; ctx.lineWidth = 1; ctx.beginPath();
        [[-14, -14], [14, -14], [-14, 14], [14, 14]].forEach(([ax, ay]) => { ctx.moveTo(dx + 9, dy + 9); ctx.lineTo(dx + 9 + ax, dy + 9 + ay); }); ctx.stroke();
        ctx.fillStyle = '#555a66'; ctx.beginPath(); ctx.arc(dx + 9, dy + 9, 3, 0, 7); ctx.fill(); ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.arc(dx + 9, dy + 9, 1.4, 0, 7); ctx.fill(); }
      else { ctx.fillStyle = '#8a4a3a'; ctx.fillRect(dx, dy, 12, 12); ctx.fillStyle = '#2a1a1a'; ctx.fillRect(dx + 3, dy + 3, 6, 6); }
    });
    if (b.hotel || b.mercado) roofEspecial(ctx, b, fh);
  }

  // rachaduras, remendos, manchas de óleo e bueiros (sorteados sempre do mesmo jeito)
  function drawRoadDetail(ctx, x0, y0, x1, y1) {
    const cs = 120;
    for (let gy = Math.floor(y0 / cs) - 1; gy <= Math.floor(y1 / cs) + 1; gy++) for (let gx = Math.floor(x0 / cs) - 1; gx <= Math.floor(x1 / cs) + 1; gx++) {
      const r = mulberry32(gx * 7349 + gy * 9151 + 13);
      const px = (gx + r()) * cs, py = (gy + r()) * cs, kind = r(), a1 = r(), a2 = r(), a3 = r();
      if (tileAt(px, py) !== TILE.ROAD) continue;
      ctx.save(); ctx.translate(px, py);
      if (kind < 0.42) { // rachadura
        ctx.rotate(a1 * 6.28); ctx.beginPath(); ctx.moveTo(0, 0); let cx = 0, cy = 0;
        const n = 5 + Math.floor(a2 * 5);
        for (let k = 0; k < n; k++) { cx += 6 + r() * 14; cy += (r() - 0.5) * 14; ctx.lineTo(cx, cy); }
        ctx.strokeStyle = 'rgba(14,8,28,0.42)'; ctx.lineWidth = 1.3; ctx.stroke();
        ctx.translate(0.8, 0.8); ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; ctx.stroke();
      } else if (kind < 0.56) { // remendo de asfalto
        ctx.rotate((a1 - 0.5) * 0.2); const w = 30 + a2 * 40, h = 18 + a3 * 28;
        ctx.fillStyle = 'rgba(10,6,24,0.17)'; ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);
      } else if (kind < 0.70) { // óleo
        const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 16 + a1 * 10);
        g.addColorStop(0, 'rgba(8,4,18,0.38)'); g.addColorStop(1, 'rgba(8,4,18,0)');
        ctx.scale(1, 0.7 + a2 * 0.5); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 16 + a1 * 10, 0, 7); ctx.fill();
      } else if (kind < 0.75) { // bueiro
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(1.5, 2, 10, 0, 7); ctx.fill();
        ctx.fillStyle = '#4a4458'; ctx.beginPath(); ctx.arc(0, 0, 9.5, 0, 7); ctx.fill();
        ctx.strokeStyle = '#2a2633'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); for (let k = -6; k <= 6; k += 3) { ctx.moveTo(k, -7); ctx.lineTo(k, 7); ctx.moveTo(-7, k); ctx.lineTo(7, k); } ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(-3, -3, 4, 0, 7); ctx.fill();
      } else if (kind < 0.83) { // poça d'água
        ctx.rotate(a3 * 3); const pw = 14 + a1 * 18, ph = 7 + a2 * 8;
        ctx.fillStyle = 'rgba(40,52,120,0.34)'; ctx.beginPath(); ctx.ellipse(0, 0, pw, ph, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(190,205,255,0.28)'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.ellipse(-pw * 0.25, -ph * 0.3, pw * 0.45, ph * 0.3, 0, 0, 7); ctx.fill();
      }
      ctx.restore();
    }
  }

  // bueiros (mesma sorte do drawRoadDetail) — usados para a fumaça que sai deles
  function manholes(x0, y0, x1, y1) {
    const cs = 120, out = [];
    for (let gy = Math.floor(y0 / cs) - 1; gy <= Math.floor(y1 / cs) + 1; gy++) for (let gx = Math.floor(x0 / cs) - 1; gx <= Math.floor(x1 / cs) + 1; gx++) {
      const r = mulberry32(gx * 7349 + gy * 9151 + 13);
      const px = (gx + r()) * cs, py = (gy + r()) * cs, kind = r();
      if (kind >= 0.70 && kind < 0.75 && tileAt(px, py) === TILE.ROAD) out.push({ x: px, y: py });
    }
    return out;
  }

  // brilhos que se mexem na água do rio e dos lagos (desenhado a cada quadro)
  function drawWaterFx(ctx, t, x0, y0, x1, y1) {
    ctx.save();
    rios.forEach(rv => {
      if (rv.x > x1 || rv.x + rv.w < x0) return;
      for (let yy = Math.max(rv.y, Math.floor(y0 / 36) * 36); yy < Math.min(rv.y + rv.h, y1); yy += 36) {
        const k = yy / 36, rx = rv.x + 14 + ((k * 53 + t * (9 + (k % 5) * 3)) % (rv.w - 40));
        ctx.fillStyle = 'rgba(255,255,255,' + (0.10 + 0.10 * Math.sin(t * 2 + k)) + ')'; ctx.fillRect(rx, yy + (k % 3) * 8, 14 + (k % 4) * 4, 2);
      }
    });
    ponds.forEach(p => {
      if (p.x < x0 - 80 || p.x > x1 + 80 || p.y < y0 - 80 || p.y > y1 + 80) return;
      for (let k = 0; k < 7; k++) {
        const a = k * 0.9 + p.x, ex = p.x + Math.cos(a) * p.rx * 0.6 + Math.sin(t * 0.6 + k) * 6, ey = p.y + Math.sin(a) * p.ry * 0.6;
        ctx.fillStyle = 'rgba(255,255,255,' + (0.10 + 0.10 * Math.sin(t * 2.2 + k * 2)) + ')'; ctx.fillRect(ex, ey, 9, 1.6);
      }
    });
    ctx.restore();
  }

  // ---- objetos de calçada (hidrante, lixeira, banco, caixa de correio, ponto de ônibus...) ----
  function drawProp(ctx, tipo, x, y, rot, r) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(0,0,10,0.28)';
    const sh = (w, h) => { ctx.save(); ctx.shadowColor = 'rgba(0,0,10,0.45)'; ctx.shadowBlur = 4; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 4; ctx.fillStyle = '#000'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.restore(); };
    if (tipo === 'hidrante') {
      ctx.fillStyle = 'rgba(0,0,10,0.3)'; ctx.beginPath(); ctx.arc(2.5, 3, 5.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#b3201d'; ctx.fillRect(-7, -2, 14, 4); ctx.beginPath(); ctx.arc(0, 0, 4.6, 0, 7); ctx.fill();
      ctx.strokeStyle = '#5a0e0c'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#e0b32a'; ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(-2.6, -3.4, 2, 1.4);
    } else if (tipo === 'lixeira') {
      ctx.fillStyle = 'rgba(0,0,10,0.3)'; ctx.beginPath(); ctx.arc(3, 4, 7, 0, 7); ctx.fill();
      ctx.fillStyle = r < 0.5 ? '#3d5a40' : '#4a4e58'; ctx.beginPath(); ctx.arc(0, 0, 6.6, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(0, 0, 4.2, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(-2.4, -2.4, 2, 0, 7); ctx.fill();
      if (r > 0.7) { ctx.fillStyle = '#e8e8e0'; ctx.fillRect(5, -1, 4, 3); } // lixo no chão
    } else if (tipo === 'banco') {
      sh(28, 10); ctx.fillStyle = '#2a2a32'; ctx.fillRect(-12, -4, 2, 8); ctx.fillRect(10, -4, 2, 8);
      for (let k = 0; k < 3; k++) { ctx.fillStyle = k % 2 ? '#8a5a30' : '#9a6a3a'; ctx.fillRect(-13, -5 + k * 3.4, 26, 3); }
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-13, -5, 26, 1);
    } else if (tipo === 'correio') {
      sh(10, 12); ctx.fillStyle = '#2a58b8'; ctx.fillRect(-5, -6, 10, 12); ctx.fillStyle = '#7aa0e8'; ctx.fillRect(-5, -6, 10, 2.4);
      ctx.fillStyle = '#10204a'; ctx.fillRect(-3, -1, 6, 1.4); ctx.strokeStyle = '#0a1436'; ctx.lineWidth = 1; ctx.strokeRect(-4.5, -5.5, 9, 11);
    } else if (tipo === 'banca') {
      sh(16, 15); ctx.fillStyle = '#e0b32a'; ctx.fillRect(-8, -7, 16, 14); ctx.fillStyle = '#c8302a'; ctx.fillRect(-8, -7, 16, 5);
      ctx.fillStyle = '#f2ecdc'; ctx.fillRect(-6, 0, 5, 4); ctx.fillStyle = '#7ad0e0'; ctx.fillRect(1, 0, 5, 4); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(-7.5, -6.5, 15, 13);
    } else if (tipo === 'poste') {
      [-8, 8].forEach(k => { ctx.fillStyle = 'rgba(0,0,10,0.3)'; ctx.beginPath(); ctx.arc(k + 2, 3, 3.4, 0, 7); ctx.fill(); ctx.fillStyle = '#6a6a76'; ctx.beginPath(); ctx.arc(k, 0, 3.2, 0, 7); ctx.fill(); ctx.fillStyle = '#e0b32a'; ctx.beginPath(); ctx.arc(k, 0, 2, 0, 7); ctx.fill(); });
    } else if (tipo === 'vaso') {
      sh(24, 12); ctx.fillStyle = '#9a4a32'; ctx.fillRect(-12, -6, 24, 12); ctx.fillStyle = '#6a2e1e'; ctx.fillRect(-12, 3, 24, 3);
      ctx.fillStyle = '#2f7a2c'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(-8 + k * 4, -1 + (k % 2) * 2, 4.5, 0, 7); ctx.fill(); }
      ctx.fillStyle = r < 0.5 ? '#ff6a8a' : '#ffd84a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(-6 + k * 4, -2 + (k % 2) * 3, 1.4, 0, 7); ctx.fill(); }
    } else if (tipo === 'maquina') { // máquina de refrigerante
      sh(14, 16); ctx.fillStyle = r < 0.5 ? '#c8302a' : '#2a58b8'; ctx.fillRect(-7, -8, 14, 16);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-7, -8, 14, 3);
      ctx.fillStyle = '#10141c'; ctx.fillRect(-5, -4, 8, 9); ctx.fillStyle = '#9ad0ff'; for (let k = 0; k < 3; k++) ctx.fillRect(-4.2, -3 + k * 3, 6.4, 1.6);
      ctx.fillStyle = '#e8e8e8'; ctx.fillRect(4, -3, 2, 3); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.8; ctx.strokeRect(-6.5, -7.5, 13, 15);
    } else if (tipo === 'ponto') { // ponto de ônibus
      ctx.save(); ctx.shadowColor = 'rgba(0,0,10,0.4)'; ctx.shadowBlur = 5; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 6; ctx.fillStyle = '#000'; ctx.fillRect(-24, -9, 48, 18); ctx.restore();
      ctx.fillStyle = 'rgba(120,200,215,0.55)'; ctx.fillRect(-24, -9, 48, 18);
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.moveTo(-24, -9); ctx.lineTo(-8, -9); ctx.lineTo(-24, 6); ctx.fill();
      ctx.strokeStyle = '#3a3e48'; ctx.lineWidth = 2; ctx.strokeRect(-24, -9, 48, 18);
      ctx.fillStyle = '#3a3e48'; [-23, 23].forEach(k => ctx.fillRect(k - 1.5, -9, 3, 3)); ctx.fillStyle = '#8a5a30'; ctx.fillRect(-14, 3, 28, 4);
      ctx.fillStyle = '#2a58b8'; ctx.fillRect(26, -4, 3, 10); ctx.fillStyle = '#fff'; ctx.fillRect(26.5, -3, 2, 3);
    }
    ctx.restore();
  }

  // lista de objetos de calçada de uma quadra (sempre a mesma, por causa da semente)
  function blockProps(blk) {
    const r = mulberry32(blk.bx * 977 + blk.by * 1597 + 5), M = 74, off = 17, out = [];
    const lados = [['top', blk.x, blk.y + off, 1, 0, blk.w, 0], ['bottom', blk.x, blk.y + blk.h - off, 1, 0, blk.w, Math.PI], ['left', blk.x + off, blk.y, 0, 1, blk.h, -Math.PI / 2], ['right', blk.x + blk.w - off, blk.y, 0, 1, blk.h, Math.PI / 2]];
    lados.forEach(([lado, ox, oy, dx, dy, len, rot]) => {
      const n = 3 + Math.floor(r() * 3);
      if (blk.kind === 'mercado' && lado === 'bottom') { for (let k = 0; k < n; k++) { r(); r(); r(); } return; }
      for (let k = 0; k < n; k++) {
        const t = M + r() * (len - 2 * M), x = ox + dx * t, y = oy + dy * t;
        const q = r(), q2 = r();
        const tipo = q < 0.14 ? 'hidrante' : q < 0.36 ? 'lixeira' : q < 0.50 ? 'banco' : q < 0.58 ? 'correio' : q < 0.65 ? 'banca' : q < 0.74 ? 'poste' : q < 0.83 ? 'vaso' : q < 0.90 ? 'ponto' : 'maquina';
        out.push({ id: blk.bx + ',' + blk.by + ',' + lado + k, tipo, x, y, rot, q: q2, lado });
      }
    });
    return out;
  }
  function drawProps(ctx, blk) { blockProps(blk).forEach(p => drawProp(ctx, p.tipo, p.x, p.y, p.rot, p.q)); }

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
    if (kind === 'floresta' || kind === 'fazenda' || kind === 'porto') {
      const gx = x, gy = y, fr = mulberry32(blk.bx * 53 + blk.by * 19 + 1);
      if (kind === 'porto') {
        ctx.fillStyle = '#8d8f96'; ctx.fillRect(x, y, w, h); ctx.fillStyle = ctx.createPattern(tex.paving, 'repeat'); ctx.globalAlpha = 0.35; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
        ctx.fillStyle = ctx.createPattern(tex.water, 'repeat'); ctx.fillRect(x + 7 * T, y, 5 * T, h);
        ctx.fillStyle = '#3d4a3b'; ctx.fillRect(x + 7 * T - 8, y, 10, h); ctx.fillStyle = '#c8c8d0'; ctx.fillRect(x + 7 * T - 2, y, 3, h);
        for (let k = 0; k < 12; k++) { ctx.fillStyle = 'rgba(180,220,255,0.12)'; ctx.fillRect(x + 7 * T + 10 + (k * 37) % (4 * T), y + (k * 53) % h, 24, 2); }
        const cc = ['#c0392b', '#2a6ab8', '#e0a02a', '#3a8a4a', '#8a4a9a'];
        for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { if (fr() < 0.2) continue; const px = x + 6 * T - 110 + c * 38, py = y + 4 * T + r * 62 + (blk.by % 2) * 10; ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(px + 4, py + 5, 34, 54); ctx.fillStyle = cc[Math.floor(fr() * 5)]; ctx.fillRect(px, py, 34, 54); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; for (let l = 4; l < 34; l += 6) { ctx.beginPath(); ctx.moveTo(px + l, py); ctx.lineTo(px + l, py + 54); ctx.stroke(); } }
        ctx.fillStyle = '#d8b02a'; ctx.fillRect(x + 6.4 * T, y + 10 * T, 3, 70); ctx.fillRect(x + 6.4 * T, y + 10 * T, 64, 5); ctx.fillStyle = '#c0392b'; ctx.fillRect(x + 6.4 * T + 56, y + 10 * T + 5, 8, 22);
        if (blk.by === 3) { ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.fillText('CAIS — BALSA PARA A ILHA', x + 3.4 * T, y + 6.2 * T); ctx.textAlign = 'left'; }
        return;
      }
      ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fillRect(x, y, w, h);
      ctx.fillStyle = kind === 'floresta' ? 'rgba(10,40,12,0.38)' : 'rgba(0,0,0,0.04)'; ctx.fillRect(x, y, w, h);
      for (let k = 0; k < 120; k++) { ctx.fillStyle = fr() < 0.5 ? 'rgba(20,70,20,0.35)' : 'rgba(110,80,40,0.22)'; ctx.beginPath(); ctx.arc(x + fr() * w, y + fr() * h, 2 + fr() * 6, 0, 7); ctx.fill(); }
      ponds.forEach(p => { if (p.x < x || p.x > x + w || p.y < y || p.y > y + h) return; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx + 7, p.ry + 7, 0, 0, 7); ctx.fillStyle = '#4a5a3a'; ctx.fill(); ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, 7); ctx.fillStyle = ctx.createPattern(tex.water, 'repeat'); ctx.fill(); });
      if (kind === 'floresta') {
        // trilha de terra que liga a cabana à estrada
        if (blk.cabana) { ctx.strokeStyle = 'rgba(150,115,60,0.7)'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(blk.cabana.x, blk.cabana.y); ctx.bezierCurveTo(blk.cabana.x + 30, blk.cabana.y + 60, blk.cabana.x - 40, y + h - 80, blk.cabana.x + 6, y + h); ctx.stroke(); ctx.lineCap = 'butt'; }
      } else {
        // pastos cercados, alameda de entrada, piscina e heliponto
        ctx.fillStyle = '#9b8a62'; ctx.fillRect(x + 5 * T, y + 5 * T, 2 * T, 7 * T); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x + 5 * T + 4, y + 5 * T, 3, 7 * T);
        const pl = tiles; for (let ty = 0; ty < 12; ty++) for (let tx = 0; tx < 12; tx++) {
          const t = tiles[(blk.ty + ty) * TW + blk.tx + tx];
          if (t === TILE.WATER) { ctx.fillStyle = '#2a8ad0'; ctx.fillRect(x + tx * T, y + ty * T, T, T); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + tx * T + 3, y + ty * T + 5, T - 6, 2); }
          else if (t === TILE.LOT && !(tx >= 5 && tx <= 6)) { ctx.fillStyle = '#6a6c74'; ctx.fillRect(x + tx * T, y + ty * T, T, T); }
        }
        if (blk.heli) { ctx.strokeStyle = '#ffe04a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(blk.heli.x, blk.heli.y, 40, 0, 7); ctx.stroke(); ctx.fillStyle = '#ffe04a'; ctx.font = 'bold 30px Arial'; ctx.textAlign = 'center'; ctx.fillText('H', blk.heli.x, blk.heli.y + 11); ctx.textAlign = 'left'; }
        ctx.strokeStyle = '#f2f2f2'; ctx.lineWidth = 3; ctx.strokeRect(x + 6, y + 6, w - 12, h - 12); ctx.strokeStyle = '#8a8a92'; ctx.lineWidth = 1; ctx.strokeRect(x + 7.5, y + 7.5, w - 15, h - 15);
        ctx.fillStyle = '#3a3a42'; ctx.fillRect(x + 5 * T - 10, y + h - 14, 14, 14); ctx.fillRect(x + 7 * T - 4, y + h - 14, 14, 14);
        ctx.fillStyle = '#ffd84a'; ctx.font = 'bold 9px Arial'; ctx.textAlign = 'center'; ctx.fillText('FAZENDA PARTICULAR — ' + blk.fazenda.dono, x + 6 * T, y + h - 20); ctx.textAlign = 'left';
      }
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
    ctx.fillStyle = ctx.createPattern(tex.paving, 'repeat'); ctx.fillRect(x, y, w, h);
    // sujeira perto do meio-fio e sombra suave dos prédios
    rrect(ctx, x + 10, y + 10, w - 20, h - 20, 36); ctx.strokeStyle = 'rgba(90,70,30,0.10)'; ctx.lineWidth = 14; ctx.stroke();
    // variação de cor nas lajotas
    const r = mulberry32(blk.bx * 31 + blk.by * 17 + 5);
    for (let k = 0; k < 40; k++) { ctx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(120,90,40,0.10)'; ctx.fillRect(x + Math.floor(r() * 12) * T + 1, y + Math.floor(r() * 12) * T + 1, T - 2, T - 2); }
    // manchas, rachaduras e chicletes
    for (let k = 0; k < 26; k++) {
      const sx = x + 12 + r() * (w - 24), sy = y + 12 + r() * (h - 24), t = r();
      if (t < 0.45) { ctx.fillStyle = 'rgba(70,55,25,0.09)'; ctx.beginPath(); ctx.arc(sx, sy, 3 + r() * 8, 0, 7); ctx.fill(); }
      else if (t < 0.85) { ctx.strokeStyle = 'rgba(90,70,30,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (r() - 0.5) * 18, sy + (r() - 0.5) * 18); ctx.lineTo(sx + (r() - 0.5) * 26, sy + (r() - 0.5) * 26); ctx.stroke(); }
      else { ctx.fillStyle = 'rgba(70,60,60,0.35)'; ctx.beginPath(); ctx.arc(sx, sy, 1.6, 0, 7); ctx.fill(); }
    }
    ctx.restore();
    // sarjeta escura na rua, rente ao meio-fio
    rrect(ctx, x - 6, y - 6, w + 12, h + 12, 48); ctx.strokeStyle = 'rgba(10,5,25,0.22)'; ctx.lineWidth = 5; ctx.stroke();
    // meio-fio branco
    rrect(ctx, x + 2, y + 2, w - 4, h - 4, 42); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.stroke();
    rrect(ctx, x + 6, y + 6, w - 12, h - 12, 38); ctx.strokeStyle = 'rgba(120,100,50,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();

    if (kind === 'city' || kind === 'hotel') {
      // "beco" escuro debaixo dos prédios
      ctx.fillStyle = ctx.createPattern(tex.alley, 'repeat'); ctx.fillRect(x + 2 * T, y + 2 * T, 8 * T, 8 * T);
    } else if (kind === 'vila') {
      // quintais de grama e vielas de calçada em cruz
      const gx = x + 2 * T, gy = y + 2 * T;
      ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fillRect(gx, gy, 8 * T, 8 * T);
      [[3 * T, 0, 2 * T, 8 * T], [0, 3 * T, 8 * T, 2 * T]].forEach(([a, b, c, d]) => { ctx.fillStyle = '#ece1a2'; ctx.fillRect(gx + a, gy + b, c, d); ctx.fillStyle = ctx.createPattern(tex.paving, 'repeat'); ctx.fillRect(gx + a, gy + b, c, d); });
      ctx.strokeStyle = 'rgba(150,130,70,0.4)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let k = 0; k <= 8; k += 1) { if (k >= 3 && k <= 5) { ctx.moveTo(gx + k * T + 0.5, gy); ctx.lineTo(gx + k * T + 0.5, gy + 8 * T); ctx.moveTo(gx, gy + k * T + 0.5); ctx.lineTo(gx + 8 * T, gy + k * T + 0.5); } }
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; [[0, 0], [5, 0], [0, 5], [5, 5]].forEach(([a, c]) => ctx.fillRect(gx + a * T, gy + c * T, 3 * T, 3 * T));
    } else if (kind === 'obras' || kind === 'obra') {
      // terreno de obra: terra batida e vielas (os lotes são desenhados por cidade.js)
      const gx = x + 2 * T, gy = y + 2 * T;
      ctx.fillStyle = ctx.createPattern(tex.terra, 'repeat'); ctx.fillRect(gx, gy, 8 * T, 8 * T);
      if (kind === 'obras') {
        [[3 * T, 0, 2 * T, 8 * T], [0, 3 * T, 8 * T, 2 * T]].forEach(([a, b, c, d]) => { ctx.fillStyle = '#c9bd8e'; ctx.fillRect(gx + a, gy + b, c, d); ctx.fillStyle = ctx.createPattern(tex.paving, 'repeat'); ctx.fillRect(gx + a, gy + b, c, d); });
      }
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(gx - 4, gy - 4, 8 * T + 8, 4); ctx.fillRect(gx - 4, gy + 8 * T, 8 * T + 8, 4);
    } else if (kind === 'prefeitura' || kind === 'delegacia' || kind === 'hospital' || kind === 'estadio') {
      const gx = x + T, gy = y + 7 * T;
      ctx.fillStyle = ctx.createPattern(tex.alley, 'repeat'); ctx.fillRect(x + T, y + T, 10 * T, ({ prefeitura: 6, delegacia: 6, hospital: 7, estadio: 10 })[kind] * T);
      if (kind === 'prefeitura') {
        ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fillRect(x + 2 * T, y + 7.4 * T, 3 * T, 4 * T); ctx.fillRect(x + 7 * T, y + 7.4 * T, 3 * T, 4 * T);
        ctx.beginPath(); ctx.arc(x + 6 * T, y + 9.4 * T, 52, 0, 7); ctx.fillStyle = '#d8d0b0'; ctx.fill(); ctx.strokeStyle = '#9a8a5a'; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.arc(x + 6 * T, y + 9.4 * T, 28, 0, 7); ctx.fillStyle = ctx.createPattern(tex.water, 'repeat'); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#c8c8d0'; ctx.fillRect(x + 6 * T - 2, y + 9.4 * T - 12, 4, 24);
        ctx.fillStyle = '#6a6a72'; ctx.fillRect(x + 5.2 * T, y + 7.6 * T, 3, 40); ctx.fillStyle = '#2a8a3a'; ctx.fillRect(x + 5.2 * T + 3, y + 7.6 * T, 24, 8); ctx.fillStyle = '#f2d21a'; ctx.fillRect(x + 5.2 * T + 8, y + 7.6 * T + 1.5, 14, 5);
      } else if (kind === 'delegacia' || kind === 'hospital') {
        const lt = y + (kind === 'delegacia' ? 7 : 8) * T;
        ctx.fillStyle = ctx.createPattern(tex.asphalt, 'repeat'); ctx.fillRect(x, lt, w, y + h - lt); ctx.fillStyle = 'rgba(15,10,30,0.25)'; ctx.fillRect(x, lt, w, y + h - lt);
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let k = 0; k < 9; k++) ctx.fillRect(x + 20 + k * 40, lt + 14, 2, 46);
        if (kind === 'hospital') { ctx.fillStyle = 'rgba(217,54,62,0.7)'; ctx.fillRect(x + 4 * T, lt + 4, 4 * T, 4); ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.fillText('PRONTO-SOCORRO — AMBULÂNCIAS', x + 6 * T, lt + 40); ctx.textAlign = 'left'; }
        else { ctx.fillStyle = 'rgba(80,120,255,0.8)'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText('VIATURAS — ENTRADA DOS PRESOS', x + 6 * T, lt + 40); ctx.textAlign = 'left'; }
      }
    } else if (kind === 'campo') {
      // fazenda: faixas de plantação, cerca de madeira e curral
      const gx = x + 2 * T, gy = y + 2 * T, fr = mulberry32(blk.bx * 71 + blk.by * 19 + 3);
      ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fillRect(gx, gy, 8 * T, 8 * T);
      const cores = ['#6aa532', '#b9a63a', '#4f8f2a', '#8a6d3a'];
      for (let k = 0; k < 8; k++) {
        const cc = cores[Math.floor(fr() * 4)];
        for (let ly = 0; ly < 8 * T - 4; ly += 7) { if (gy + ly < gy + 5.6 * T && gx + k * T < gx + 6.2 * T && ly < 5.8 * T && k < 6 && ly < 70) continue; ctx.fillStyle = cc; ctx.fillRect(gx + k * T + 2, gy + ly, T - 5, 3); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(gx + k * T + 2, gy + ly + 3, T - 5, 1); }
      }
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 3; ctx.strokeRect(gx + 2, gy + 2, 8 * T - 4, 8 * T - 4);
      ctx.strokeStyle = '#a07a4a'; ctx.lineWidth = 1; ctx.strokeRect(gx + 3.5, gy + 3.5, 8 * T - 7, 8 * T - 7);
      for (let k = 0; k <= 16; k++) { ctx.fillStyle = '#4a321a'; ctx.fillRect(gx + k * T / 2 - 1, gy - 1, 3, 6); ctx.fillRect(gx + k * T / 2 - 1, gy + 8 * T - 5, 3, 6); }
      for (let k = 0; k < 4; k++) { // vaquinhas
        const vx = gx + 2 * T + fr() * 5 * T, vy = gy + 5.7 * T + fr() * 2 * T; ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(vx + 3, vy + 4, 11, 6, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#f4f4f0'; ctx.beginPath(); ctx.ellipse(vx, vy, 10, 5.5, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#2a2a2a'; ctx.fillRect(vx - 5, vy - 3, 5, 4); ctx.fillRect(vx + 2, vy, 4, 3); ctx.beginPath(); ctx.arc(vx + 11, vy, 3.4, 0, 7); ctx.fill();
      }
    } else if (kind === 'aeroporto') {
      // pista de pouso, pátio e faixas do aeroporto (os aviões e as obras ficam em cidade.js)
      const pa = { x: x + T, y: y + T, w: 10 * T, h: 7 * T };
      ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fillRect(pa.x, pa.y, pa.w, pa.h);
    } else if (kind === 'mercado') {
      ctx.fillStyle = ctx.createPattern(tex.alley, 'repeat'); ctx.fillRect(x + T, y + T, 10 * T, 5 * T);
      const lt = y + 6 * T;
      ctx.fillStyle = ctx.createPattern(tex.asphalt, 'repeat'); ctx.fillRect(x, lt, w, 6 * T);
      ctx.fillStyle = 'rgba(15,10,30,0.28)'; ctx.fillRect(x, lt, w, 6 * T);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x, lt + 2, w, 3);                      // faixa junto da loja
      for (let k = 0; k < 8; k++) { for (const yy of [lt + 40, lt + 138]) { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(x + 4 + k * 40, yy, 2, 50); } }
      for (const yy of [lt + 40, lt + 138]) { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(x + 4 + 8 * 40, yy, 2, 50); }
      ctx.fillStyle = 'rgba(40,90,200,0.55)'; ctx.fillRect(x + 8, lt + 44, 32, 42);                      // vaga de deficiente
      ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.fillText('♿', x + 24, lt + 72);
      ctx.fillStyle = 'rgba(255,224,74,0.7)'; ctx.font = 'bold 11px Arial'; ctx.fillText('ENTRADA / SAÍDA', x + 354, lt + 188 - 12); ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < 7; k++) { ctx.fillRect(x + 20 + k * 40, lt + 112, 18, 3); }   // seta/tracejado do corredor
      ctx.fillStyle = '#4a4e58'; ctx.fillRect(x + 332, lt + 12, 40, 18); ctx.fillStyle = '#c8ccd4'; for (let k = 0; k < 6; k++) ctx.fillRect(x + 336 + k * 6, lt + 14, 3, 14);   // abrigo dos carrinhos
    } else if (kind === 'park') {
      const gx = x + 2 * T, gy = y + 2 * T;
      rrect(ctx, gx, gy, 8 * T, 8 * T, 14); ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fill();
      ctx.strokeStyle = '#2f6b26'; ctx.lineWidth = 3; ctx.stroke();
      // caminhos de terra
      ctx.strokeStyle = '#b89a62'; ctx.lineWidth = 16; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(gx + 12, gy + 4 * T); ctx.lineTo(gx + 8 * T - 12, gy + 4 * T); ctx.moveTo(gx + 4 * T, gy + 12); ctx.lineTo(gx + 4 * T, gy + 8 * T - 12); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx + 12, gy + 4 * T + 8); ctx.lineTo(gx + 8 * T - 12, gy + 4 * T + 8); ctx.stroke();
      ctx.lineCap = 'butt';
      const fr = mulberry32(blk.bx * 313 + blk.by * 71 + 9); // flores e tufos de mato
      for (let k = 0; k < 110; k++) {
        const fx = gx + 14 + fr() * (8 * T - 28), fy = gy + 14 + fr() * (8 * T - 28), cc = fr();
        if (Math.abs(fx - (gx + 4 * T)) < 14 || Math.abs(fy - (gy + 4 * T)) < 14) continue;
        if (cc < 0.35) { ctx.fillStyle = 'rgba(20,70,20,0.5)'; ctx.fillRect(fx, fy, 1, 3); ctx.fillRect(fx + 2, fy + 1, 1, 2); ctx.fillRect(fx - 2, fy + 1, 1, 2); }
        else { ctx.fillStyle = ['#f5e9ff', '#ffd84a', '#ff7a9a', '#ffffff', '#ff9a3c'][Math.floor(cc * 9) % 5]; ctx.beginPath(); ctx.arc(fx, fy, 1.5, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(fx + 1, fy + 1.5, 1.5, 1); }
      }
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
    // sombra suave
    ctx.save(); ctx.shadowColor = 'rgba(0,0,10,0.5)'; ctx.shadowBlur = 12; ctx.shadowOffsetX = 11; ctx.shadowOffsetY = 13;
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.9, 0, 7); ctx.fill(); ctx.restore();
    // copa feita de várias folhagens sobrepostas
    const r = mulberry32(Math.floor(t.x * 13 + t.y * 7));
    const greens = ['#1d5c20', '#246b24', '#2f8a2a', '#3a9a31'];
    for (let k = 0; k < 9; k++) {
      const a = r() * 6.28, d = r() * t.r * 0.55, rad = t.r * (0.42 + r() * 0.22);
      ctx.fillStyle = greens[Math.floor(r() * 2)]; ctx.beginPath(); ctx.arc(t.x + Math.cos(a) * d, t.y + Math.sin(a) * d, rad, 0, 7); ctx.fill();
    }
    const g = ctx.createRadialGradient(t.x - t.r * 0.35, t.y - t.r * 0.35, 2, t.x, t.y, t.r);
    g.addColorStop(0, 'rgba(150,230,100,0.55)'); g.addColorStop(0.55, 'rgba(60,150,50,0.10)'); g.addColorStop(1, 'rgba(0,30,5,0.45)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, 7); ctx.fill();
    for (let k = 0; k < 14; k++) { const a = r() * 6.28, d = r() * t.r * 0.8; ctx.fillStyle = r() < 0.6 ? 'rgba(190,255,140,0.22)' : 'rgba(0,40,0,0.22)'; ctx.beginPath(); ctx.arc(t.x + Math.cos(a) * d, t.y + Math.sin(a) * d, 2 + r() * 4, 0, 7); ctx.fill(); }
    ctx.strokeStyle = 'rgba(10,50,14,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, 7); ctx.stroke();
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
    for (let i = 0; i <= COLS; i++) for (const off of [1.4, 2.6, 5.4, 6.6]) {
      const xx = roadLeft(i) + off * T; if (xx < x0 - 8 || xx > x1 + 8) continue;
      ctx.beginPath(); ctx.moveTo(xx, Math.max(ry0, y0)); ctx.lineTo(xx, Math.min(ry0 + rh, y1)); ctx.stroke();
    }
    for (let j = 0; j <= ROWS; j++) for (const off of [1.4, 2.6, 5.4, 6.6]) {
      const yy = roadTop(j) + off * T; if (yy < y0 - 8 || yy > y1 + 8) continue;
      ctx.beginPath(); ctx.moveTo(Math.max(rx0, x0), yy); ctx.lineTo(Math.min(rx0 + rw, x1), yy); ctx.stroke();
    }
    ctx.restore();
    drawRoadDetail(ctx, x0, y0, x1, y1);
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
      const cr = mulberry32(Math.floor(cx * 3 + cy * 5)), tinta = () => { ctx.fillStyle = 'rgba(' + (236 + cr() * 14 | 0) + ',' + (236 + cr() * 14 | 0) + ',' + (236 + cr() * 10 | 0) + ',' + (0.55 + cr() * 0.4) + ')'; }; // tinta gasta
      if (c.dir === 'h') { for (let xx = cx + 6; xx < cx + cw - 6; xx += 16) { tinta(); ctx.fillRect(xx, cy + 4, 9, ch - 8); } }
      else { for (let yy = cy + 6; yy < cy + ch - 6; yy += 16) { tinta(); ctx.fillRect(cx + 4, yy, ch > 0 ? cw - 8 : 9, 9); } }
    });
    // 5) quadras (chão)
    blocks.forEach(b => { if (hit(b.x - 8, b.y - 8, b.w + 16, b.h + 16)) drawBlockGround(ctx, b); });
    blocks.forEach(b => { if (b.kind !== 'river' && hit(b.x - 8, b.y - 8, b.w + 16, b.h + 16)) drawProps(ctx, b); });
    // 6) pontes (e água nas ruas sem ponte): proteção e pilares
    rios.forEach(rv => {
      for (let j = 0; j <= ROWS; j++) {
        const by = roadTop(j), bx = rv.x;
        if (!hit(bx, by - 20, rv.w, ROAD * T + 40)) continue;
        if (!temPonte(rv.bx, j)) {
          ctx.fillStyle = ctx.createPattern(tex.water, 'repeat'); ctx.fillRect(bx, by, rv.w, ROAD * T);
          ctx.fillStyle = 'rgba(180,220,255,0.10)'; for (let k = 0; k < 14; k++) ctx.fillRect(bx + ((k * 97) % rv.w), by + ((k * 41) % (ROAD * T)), 18, 2);
          ctx.fillStyle = '#3d4a3b'; ctx.fillRect(bx, by, 10, ROAD * T); ctx.fillRect(bx + rv.w - 10, by, 10, ROAD * T);
          ctx.fillStyle = '#6f7d6a'; ctx.fillRect(bx + 8, by, 3, ROAD * T); ctx.fillRect(bx + rv.w - 11, by, 3, ROAD * T);
          continue;
        }
        ctx.fillStyle = 'rgba(0,0,20,0.35)'; ctx.fillRect(bx, by - 14, rv.w, 14); ctx.fillRect(bx, by + ROAD * T, rv.w, 18);
        ctx.fillStyle = '#9a9aa6'; ctx.fillRect(bx, by - 6, rv.w, 10); ctx.fillRect(bx, by + ROAD * T - 4, rv.w, 10);
        ctx.fillStyle = '#55555f'; ctx.fillRect(bx, by - 2, rv.w, 4); ctx.fillRect(bx, by + ROAD * T - 2, rv.w, 4);
        for (let xx = bx + 8; xx < bx + rv.w; xx += 32) { ctx.fillStyle = '#c8c8d2'; ctx.fillRect(xx, by - 6, 5, 10); ctx.fillRect(xx, by + ROAD * T - 4, 5, 10); }
        if (PONTES[rv.bx] !== 'todas') { // ponte principal: arcos de ferro, luz azul e faixa de concreto
          ctx.fillStyle = 'rgba(40,60,110,0.18)'; ctx.fillRect(bx, by, rv.w, ROAD * T);
          for (let xx = bx + 40; xx < bx + rv.w - 20; xx += 96) { ctx.fillStyle = '#d8dae6'; ctx.fillRect(xx, by - 10, 8, 6); ctx.fillRect(xx, by + ROAD * T + 4, 8, 6); }
        }
      }
    });
    // 7) sombras dos prédios e telhados
    const vis = buildings.filter(b => hit(b.x, b.y, b.w + 14, b.h + 14));
    vis.forEach(b => { // sombra suave (borrada) projetada para baixo e para a direita
      ctx.save();
      ctx.beginPath(); ctx.rect(b.x - 60, b.y - 60, b.w + 160, b.h + 160); ctx.clip();
      ctx.shadowColor = 'rgba(0,0,12,0.55)'; ctx.shadowBlur = 16; ctx.shadowOffsetX = 16; ctx.shadowOffsetY = 18;
      ctx.fillStyle = '#000'; ctx.fillRect(b.x + 4, b.y + 4, b.w - 4, b.h - 4);
      ctx.restore();
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
  const CH = 512, RS = 1.1;
  const NCX = Math.ceil(W / CH), NCY = Math.ceil(H / CH);
  // o mapa é gigante: os pedaços são desenhados SOB DEMANDA e os mais antigos são descartados (cache LRU)
  const chunks = new Map(); let uso = 0; const MAX_CHUNKS = 90;
  function desenhaChunk(cx, cy) {
    if (!tex.asphalt) makeTextures();
    const c = document.createElement('canvas'); c.width = c.height = Math.ceil(CH * RS);
    const ctx = c.getContext('2d');
    ctx.scale(RS, RS); ctx.translate(-cx * CH, -cy * CH);
    ctx.save(); ctx.beginPath(); ctx.rect(cx * CH, cy * CH, CH, CH); ctx.clip();
    drawStatic(ctx, cx * CH, cy * CH, (cx + 1) * CH, (cy + 1) * CH);
    ctx.restore();
    return c;
  }
  function pegaChunk(cx, cy, cria) {
    if (cx < 0 || cy < 0 || cx >= NCX || cy >= NCY) return null;
    const key = cy * NCX + cx; let e = chunks.get(key);
    if (e) { e.uso = ++uso; return e.c; }
    if (!cria) return null;
    e = { c: desenhaChunk(cx, cy), uso: ++uso }; chunks.set(key, e);
    if (chunks.size > MAX_CHUNKS) { let ki = -1, ku = 1e18; chunks.forEach((v, k) => { if (v.uso < ku) { ku = v.uso; ki = k; } }); chunks.delete(ki); }
    return e.c;
  }
  // carregamento inicial: só os pedaços ao redor da garagem
  const PRE = []; for (let cy = 0; cy <= 2; cy++) for (let cx = 0; cx <= 3; cx++) PRE.push([cx, cy]);
  let preN = 0;
  function buildSome(n) {
    for (let k = 0; k < n && preN < PRE.length; k++, preN++) pegaChunk(PRE[preN][0], PRE[preN][1], true);
    return preN / PRE.length;
  }
  function drawChunks(ctx, vx0, vy0, vx1, vy1) {
    const a = Math.max(0, Math.floor(vx0 / CH)), b = Math.min(NCX - 1, Math.floor(vx1 / CH));
    const c = Math.max(0, Math.floor(vy0 / CH)), d = Math.min(NCY - 1, Math.floor(vy1 / CH));
    let orcamento = 3;
    for (let cy = c; cy <= d; cy++) for (let cx = a; cx <= b; cx++) {
      let im = pegaChunk(cx, cy, false);
      if (!im && orcamento > 0) { im = pegaChunk(cx, cy, true); orcamento--; }
      if (im) ctx.drawImage(im, cx * CH, cy * CH, CH + 0.6, CH + 0.6);
      else { ctx.fillStyle = '#3b3550'; ctx.fillRect(cx * CH, cy * CH, CH + 0.6, CH + 0.6); }
    }
    // com folga, já prepara os vizinhos (1 por quadro) para não aparecer "buraco" ao andar
    if (orcamento > 0) { for (let cy = c - 1; cy <= d + 1; cy++) for (let cx = a - 1; cx <= b + 1; cx++) { if (cx < 0 || cy < 0 || cx >= NCX || cy >= NCY || pegaChunk(cx, cy, false)) continue; pegaChunk(cx, cy, true); return; } }
  }
  // mapa pequeno (minimapa): pintado direto dos tiles, bem rápido
  function makeMini(scale) {
    const c = document.createElement('canvas'); c.width = Math.ceil(W / scale); c.height = Math.ceil(H / scale);
    const x = c.getContext('2d'), k = T / scale;
    const cor = { 0: '#4a4560', 6: '#4a4560', 5: '#8a8aa0', 1: '#d8cf96', 2: '#6a5a58', 3: '#3f7f37', 4: '#3a6ab0', 7: '#7a7a86' };
    x.fillStyle = '#2a2438'; x.fillRect(0, 0, c.width, c.height);
    for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) { x.fillStyle = cor[tiles[ty * TW + tx]] || '#000'; x.fillRect(tx * k, ty * k, k + 0.5, k + 0.5); }
    buildings.forEach(b => { x.fillStyle = b.p.base; x.fillRect(b.x / scale, b.y / scale, b.w / scale, b.h / scale); });
    x.fillStyle = 'rgba(15,60,18,0.8)'; trees.forEach(t => { x.beginPath(); x.arc(t.x / scale, t.y / scale, Math.max(1.2, t.r / scale * 0.8), 0, 7); x.fill(); });
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
    ['top', 'bottom', 'left', 'right'].forEach(s => { if (b.kind === 'mercado' && s === 'bottom') return; [0.3, 0.7].forEach(t => spots.push(sidePoint(b.bx, b.by, s, t))); });
  });

  G.world = {
    T, ROAD, BLOCK, PITCH, COLS, ROWS, MG, TW, TH, W, H, RIVER, RIVERS, PONTES, CIDADES, lotes, cruzaOk, temPonte, mkBuilding, drawRoof, drawTree, shade, TILE, tiles, blocks, buildings, trees, lamps, fachada, manholes, drawWaterFx, places, propList,
    roadLeft, roadTop, nodeX, nodeY, laneV, laneH, tileAt, isSolid, treeHit, isRoadTile, pedWalkable,
    buildSome, drawChunks, makeMini, hospitais,  sidePoint, spots, rrect, mulberry32, casas, mercados, lojas, gerarLojas, LOJAS_DEF,
    chunkCount: NCX * NCY,
  };
})(window.G = window.G || {});
