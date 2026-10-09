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
  const BLOCK = 20;      // lado de uma quadra (tiles): quadras GRANDES, para caber casas e prédios de verdade
  const PITCH = ROAD + BLOCK;
  const COLS = 65, ROWS = 10;  // mapa GIGANTE: 4 cidades bem longe uma da outra, fazendas de bilionários e duas florestas enormes
  const RODOVIA = 5;     // a rodovia que atravessa o mapa inteiro (linha de rua 5)
  const RIVER = 3;       // o primeiro rio (o da cidade grande)
  const RIVERS = [3, 9, 34, 49, 59];          // colunas de quadras ocupadas por rios
  // rio -> linhas de rua onde existe ponte ('todas' = uma ponte em cada rua). Os rios de fora têm UMA ponte (a da rodovia, com pedágio); novas pontes são construídas por cidade.js
  const PONTES = { 3: 'todas', 9: [RODOVIA], 34: [RODOVIA], 49: [RODOVIA], 59: [RODOVIA] };
  // as regiões do mapa, do oeste para o leste. 'ate' = primeira coluna da região seguinte; 'urb' = [coluna0, coluna1, linha0, linha1] da parte urbana
  const CIDADES = [
    { id: 'ribeirao', nome: 'RIBEIRÃO PRETO', sub: 'a cidade grande', ate: 9, estilo: 'classica', tipo: 'cidade', urb: [0, 8, 0, 9] },
    { id: 'santarita', nome: 'FAZENDAS SANTA RITA', sub: 'plantações e fazendas de bilionários', ate: 14, estilo: 'rustica', tipo: 'campo' },
    { id: 'mata', nome: 'MATA ESCURA', sub: 'a floresta gigante', ate: 34, estilo: 'mata', tipo: 'mata' },
    { id: 'interior', nome: 'NOVO HORIZONTE', sub: 'interior — cidade em construção', ate: 41, estilo: 'moderna', tipo: 'cidade', urb: [35, 40, 2, 7] },
    { id: 'gaviao', nome: 'MATA DO GAVIÃO', sub: 'floresta fechada, sem sinal de celular', ate: 49, estilo: 'mata', tipo: 'mata' },
    { id: 'vale', nome: 'VALE VERDE', sub: 'cidade ecológica e aeroporto', ate: 57, estilo: 'ecologica', tipo: 'cidade', urb: [50, 56, 2, 7] },
    { id: 'litoral', nome: 'FAZENDAS DO LITORAL', sub: 'fazendas perto do mar', ate: 59, estilo: 'rustica', tipo: 'campo' },
    { id: 'porto', nome: 'PORTO DO SOL', sub: 'cidade portuária', ate: 99, estilo: 'portuaria', tipo: 'cidade', urb: [60, 64, 2, 7] }
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
    const b = { x, y, w, h, p, ridge: w >= h ? 'h' : 'v', det: [], andares: 1 };
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
  const AR = G.arte;
  // calçada em volta de tudo + ruas
  setRect(MG - 2, MG - 2, INNER_W + 4, INNER_H + 4, TILE.SIDE);
  setRect(MG, MG, INNER_W, INNER_H, TILE.ROAD);

  const clampi = (v, a, b) => Math.max(a, Math.min(b, v));
  const lotes = [];            // lotes de obra (cidade.js constrói neles)
  const places = [];          // lugares grandes e comércios (dá para entrar)
  const casas = [];           // todas as casas (dá para entrar em todas!)
  const mercados = [];        // supermercados com estacionamento
  const trilhas = [];         // estradas de terra dentro das florestas
  const PARKS = [[1, 1], [5, 3], [7, 3], [2, 7], [8, 5], [37, 4], [53, 6]];
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
  const FAZENDEIROS = ['O MAGNATA DO CAFÉ', 'A BARONESA DO BOI', 'O REI DO AGRO', 'O DONO DO BANCO', 'A HERDEIRA DO PETRÓLEO', 'O MAGNATA DA SOJA', 'O BARÃO DA CANA', 'A RAINHA DO LEITE'];

  // ---------- regiões, cidades e florestas ----------
  const regiaoDe = bx => CIDADES.find(c => bx < c.ate) || CIDADES[CIDADES.length - 1];
  const dentroUrb = (c, bx, by) => !!c.urb && bx >= c.urb[0] && bx <= c.urb[1] && by >= c.urb[2] && by <= c.urb[3];
  // cruzamento "de cidade" (semáforo, faixa de pedestre, poste)? Fora das cidades são estradas.
  const URB = new Uint8Array((COLS + 1) * (ROWS + 1));
  CIDADES.forEach(c => { if (!c.urb) return; for (let i = c.urb[0]; i <= c.urb[1] + 1; i++) for (let j = c.urb[2]; j <= c.urb[3] + 1; j++) URB[j * (COLS + 1) + i] = 1; });
  const urbano = (i, j) => i >= 0 && j >= 0 && i <= COLS && j <= ROWS && URB[j * (COLS + 1) + i] === 1;
  // florestas gigantes: as ruas de dentro NÃO existem (só a rodovia e as ruas das bordas)
  const MEGAS = [
    { id: 'mata1', nome: 'MATA ESCURA', bx0: 14, bx1: 33, by0: 0, by1: 4 },
    { id: 'mata2', nome: 'MATA ESCURA', bx0: 14, bx1: 33, by0: 5, by1: 9 },
    { id: 'gav1', nome: 'MATA DO GAVIÃO', bx0: 41, bx1: 48, by0: 0, by1: 4 },
    { id: 'gav2', nome: 'MATA DO GAVIÃO', bx0: 41, bx1: 48, by0: 5, by1: 9 }
  ];
  const semH = new Uint8Array((ROWS + 1) * COLS), semV = new Uint8Array((COLS + 1) * ROWS);
  MEGAS.forEach(m => {
    m.tx0 = MG + m.bx0 * PITCH + ROAD; m.ty0 = MG + m.by0 * PITCH + ROAD; m.tx1 = MG + (m.bx1 + 1) * PITCH; m.ty1 = MG + (m.by1 + 1) * PITCH;
    m.x = m.tx0 * T; m.y = m.ty0 * T; m.w = (m.tx1 - m.tx0) * T; m.h = (m.ty1 - m.ty0) * T;
    setRect(m.tx0, m.ty0, m.tx1 - m.tx0, m.ty1 - m.ty0, TILE.GRASS);
    for (let j = m.by0 + 1; j <= m.by1; j++) for (let s = m.bx0; s <= m.bx1; s++) semH[j * COLS + s] = 1;
    for (let i = m.bx0 + 1; i <= m.bx1; i++) for (let s = m.by0; s <= m.by1; s++) semV[i * ROWS + s] = 1;
  });
  const viaH = (j, s) => !(j >= 0 && j <= ROWS && s >= 0 && s < COLS && semH[j * COLS + s]);   // existe a rua horizontal j entre os cruzamentos s e s+1?
  const viaV = (i, s) => !(i >= 0 && i <= COLS && s >= 0 && s < ROWS && semV[i * ROWS + s]);   // idem para a rua vertical i entre s e s+1
  const megaDe = (bx, by) => MEGAS.find(m => bx >= m.bx0 && bx <= m.bx1 && by >= m.by0 && by <= m.by1);
  // estradas de terra que cortam as florestas (no lugar das ruas apagadas)
  MEGAS.forEach(m => {
    const nj = m.by0 === 0 ? 2 : 7, mid = m.bx0 === 14 ? [20, 28] : [45];
    const yy = (MG + nj * PITCH + ROAD / 2) * T;
    trilhas.push({ x: m.x, y: yy - 1.5 * T, w: m.w, h: 3 * T, mega: m.id, eixo: 'h' });
    mid.forEach(i => { const xx = (MG + i * PITCH + ROAD / 2) * T; trilhas.push({ x: xx - 1.5 * T, y: m.y, w: 3 * T, h: m.h, mega: m.id, eixo: 'v' }); });
  });
  const naTrilha = (x, y, pad) => trilhas.some(t => x > t.x - pad && x < t.x + t.w + pad && y > t.y - pad && y < t.y + t.h + pad);

  // ---------- que tipo de quadra fica em cada lugar ----------
  const hash2 = (bx, by, k) => mulberry32(bx * 7919 + by * 104729 + (k || 0) * 31 + 7)();
  function ruralKind(bx, by) {
    if (Math.abs(bx - 11) <= 2 && Math.abs(by - 2) <= 2) return 'campo'; // Vasto campo aberto ao redor da mansão do Don
    const q = hash2(bx, by, 5), viz = (bx > 0 && hash2(bx - 1, by, 5) < 0.22) || (by > 0 && hash2(bx, by - 1, 5) < 0.22);
    if (q < 0.22 && !viz) return 'fazenda';      // fazendas de bilionário (nunca coladas uma na outra)
    if (q > 0.88) return 'bosque';
    return 'campo';
  }
  function kindDe(bx, by) {
    if (RIVERS.includes(bx)) return 'river';
    if (bx === 11 && by === 2) return 'mansao_chefao';
    const c = regiaoDe(bx), key = bx + ',' + by;
    if (c.tipo === 'mata') return 'floresta';
    if (c.id === 'porto' && bx === 64) return 'porto';
    if (c.tipo === 'campo' || !dentroUrb(c, bx, by)) return ruralKind(bx, by);
    if (PARKS.some(p => p[0] === bx && p[1] === by)) return 'park';
    if (c.id === 'ribeirao') {
      if (ESPECIAIS[key]) return ESPECIAIS[key];
      return (bx >= 6 || by >= 4) && (bx * 5 + by * 3) % 4 !== 0 ? 'vila' : 'city';
    }
    if (c.id === 'vale' && bx === 53 && by === 4) return 'aeroporto';
    return hash2(bx, by, 3) < 0.58 ? 'obras' : 'obra';
  }
  const estiloDe = blk => { const e = regiaoDe(blk.bx).estilo; return e === 'mata' ? 'rustica' : e; };

  // a porta fica na calçada, embaixo da fachada: precisa de chão livre na frente
  const temFrente = b => {
    const cx = Math.floor((b.x + b.w / 2) / T);
    return tiles[Math.floor((b.y + b.h + 10) / T) * TW + cx] !== TILE.BUILD && tiles[Math.floor((b.y + b.h + 26) / T) * TW + cx] !== TILE.BUILD
      && tiles[Math.floor((b.y + b.h + 10) / T) * TW + cx] !== TILE.WATER;
  };
  function addCasa(b, area) {
    const n = casas.length, ar = area || Math.round(b.w * b.h / (T * T)), hr = mulberry32(1000 + n * 37);
    const c = { id: 'c' + n, tipo: 'casa', nome: 'CASA', b, x: b.x + b.w / 2, y: b.y + b.h + 24, r: 30, seed: 1000 + n * 37, area: ar };
    c.venda = hr() < 0.16; c.preco = Math.round((1200 + ar * 26) / 100) * 100;
    b.casa = c; casas.push(c); return c;
  }
  const sorteiaParede = (est, rr) => { const l = AR.PAREDES[est] || AR.PAREDES.classica, w = l[Math.floor(rr() * l.length)]; return { cor: w[0], tex: w[1] }; };
  // fileira de prédios: larguras (em tiles) que somam exatamente 'total'
  function larguras(rr, total) {
    const out = []; let x = 0;
    while (x < total) { const rest = total - x; let w = [4, 5, 6, 8][Math.floor(rr() * 4)]; if (w > rest || rest - w < 4) w = rest; out.push(w); x += w; }
    return out;
  }
  // árvores enfileiradas na calçada (rua arborizada)
  function arvoresCalcada(blk, tudo) {
    const rr = mulberry32(blk.bx * 17 + blk.by * 131 + 7), off = 0.9 * T;
    [0.1, 0.4, 0.6, 0.9].forEach(a => {
      trees.push({ x: blk.x + a * blk.w, y: blk.y + off, r: 14 + rr() * 3 });
      if (tudo) { trees.push({ x: blk.x + off, y: blk.y + a * blk.h, r: 14 + rr() * 3 }); trees.push({ x: blk.x + blk.w - off, y: blk.y + a * blk.h, r: 14 + rr() * 3 }); }
    });
    trees.push({ x: blk.x + 1.2 * T, y: blk.y + blk.h - off, r: 15 }, { x: blk.x + blk.w - 1.2 * T, y: blk.y + blk.h - off, r: 15 });
  }
  // monta o objeto "prédio" de uma casa composta (várias partes) já com cores, quintal e porta
  // monta o objeto "prédio" de uma casa composta (várias partes), SEM colocar no mapa
  function criaCasaB(lay, ox, oy, seed, est, rg) {
    const c3 = AR.casaMontar(lay, ox, oy, seed, est), cp = c3.partes.find(p => p.t === 'corpo');
    const b = mkBuilding(cp.x, cp.y, cp.w, cp.h, 3, rg);
    b.p = { kind: 'tile', base: c3.pal.base, edge: c3.pal.claro, dark: c3.pal.escuro };
    b.det = []; b.casa3 = c3; b.est = est; b.box = AR.casaCaixa(c3);
    b.custom = (ctx, bb) => AR.drawCasa(ctx, bb);
    b.rects = c3.partes.map(p => ({ x: p.x, y: p.y, w: p.w, h: p.h, and: p.andares }));
    b.andares = Math.max.apply(null, c3.partes.map(p => p.andares));
    return b;
  }
  function montaCasaB(blk, lay, ox, oy, seed, est, rg) { const b = criaCasaB(lay, ox, oy, seed, est, rg); buildings.push(b); return b; }
  // casa de verdade num lote de obra (cidade.js): o corpo encosta na calçada da frente, porque a porta precisa de chão livre
  function casaNoLote(l, seed, est, riqueza) {
    const LW = Math.round((l.w + 10) / T), LD = Math.round((l.h + 10) / T), rg = mulberry32(seed);
    const lay = AR.casaLayout(rg, LW, LD, { riqueza: riqueza == null ? 1 : riqueza, estilo: est, semAvanco: true });
    const ox = l.x - 5, oy = l.y - 5, b = criaCasaB(lay, ox, oy, seed, est, rg);
    const q = AR.quintalDe(lay, ox, oy, LW, LD, seed, est); q.cerca = 'nenhuma'; q.carro = null; q.arbustos = []; q.canteiros = []; q.garagem = null; q.caminho = null;
    return { b, q, lay };
  }

  const BUILDERS = {};
  // ----- centro da cidade: duas fileiras de prédios e uma travessa no meio -----
  function predioCidade(blk, ttx, tty, tw, th) {
    const rr = blk.rr, est = estiloDe(blk), q = rr();
    setRect(ttx, tty, tw, th, TILE.BUILD);
    const casa = q < 0.28 && tw <= 6;
    const roofIdx = casa ? [3, 4, 5, 6, 8, 10][Math.floor(rr() * 6)] : [0, 1, 2, 7, 9, 11][Math.floor(rr() * 6)];
    const b = mkBuilding(ttx * T + 5, tty * T + 5, tw * T - 10, th * T - 10, roofIdx, rr);
    b.est = est; b.wall = sorteiaParede(est, rr);
    b.andares = casa ? (rr() < 0.55 ? 1 : 2) : (q < 0.6 ? 2 : 3 + Math.floor(rr() * 3));
    buildings.push(b);
    if (casa && temFrente(b)) addCasa(b, 16 + Math.floor(rr() * 12));
    return b;
  }
  BUILDERS.city = blk => {
    const { tx, ty, rr } = blk;
    [2, 11].forEach(y0 => { let off = 0; larguras(rr, 16).forEach(w => { predioCidade(blk, tx + 2 + off, ty + y0, w, 7); off += w; }); });
  };
  // ----- bairro: casas grandes, de vários formatos, com quintal -----
  function criaLote(blk, ltx, lty, LW, LD, est) {
    const rr = blk.rr, n = casas.length, seed = 1000 + n * 37, rg = mulberry32(seed);
    const rq = clampi(Math.round(blk.rica + (rr() - 0.5) * 1.3), 0, 2);
    const lay = AR.casaLayout(rg, LW, LD, { riqueza: rq, estilo: est });
    setRect(ltx, lty, LW, LD, TILE.GRASS);
    lay.partes.forEach(p => setRect(ltx + p.x, lty + p.y, p.w, p.h, TILE.BUILD));
    const ox = ltx * T, oy = lty * T, b = montaCasaB(blk, lay, ox, oy, seed, est, rg);
    const q = AR.quintalDe(lay, ox, oy, LW, LD, seed, est);
    blk.lotes.push({ q, seed, b });
    if (q.piscina) { const pp = q.piscina; setRect(Math.ceil(pp.x / T), Math.ceil(pp.y / T), Math.max(1, Math.floor(pp.w / T)), Math.max(1, Math.floor(pp.h / T)), TILE.WATER); }
    // árvores do quintal (com colisão): atrás da casa e num canto da frente
    [[0.9 + rr() * 0.5, 0.7], [LW - 1.4 + rr() * 0.5, 0.7]].forEach(([a, c]) => { if (rr() < 0.7 && !(q.piscina && Math.abs(ox + a * T - (q.piscina.x + q.piscina.w / 2)) < q.piscina.w / 2 + 20 && c * T + oy < q.piscina.y + q.piscina.h + 20)) trees.push({ x: ox + a * T, y: oy + c * T, r: 17 + rr() * 8 }); });
    if (rr() < 0.6) { const a = lay.garagem && lay.lado === 'd' ? 0.8 : LW - 0.8; trees.push({ x: ox + a * T, y: oy + (LD - 0.9) * T, r: 15 + rr() * 5 }); }
    const c = addCasa(b, rq === 0 ? 10 + Math.floor(rr() * 3) : rq === 1 ? 20 + Math.floor(rr() * 8) : 40 + Math.floor(rr() * 12));
    c.rica = rq === 2; c.riqueza = rq; c.estilo = est;
    return b;
  }
  BUILDERS.vila = blk => {
    const { tx, ty, rr } = blk, est = estiloDe(blk), trend = hash2(blk.bx, blk.by, 9);
    blk.rica = trend < 0.22 ? 0 : trend < 0.74 ? 1 : 2;     // bairro popular, classe média ou nobre
    const CFG = blk.rica === 0 ? [[5, 5, 6], [5, 6, 5], [8, 8], [6, 5, 5]] : blk.rica === 1 ? [[8, 8], [8, 8], [10, 6], [6, 10], [5, 5, 6]] : [[8, 8], [10, 6], [16], [8, 8], [6, 10]];
    [2, 11].forEach(y0 => { const cfg = CFG[Math.floor(rr() * CFG.length)]; let off = 0; cfg.forEach(LW => { criaLote(blk, tx + 2 + off, ty + y0, LW, 7, est); off += LW; }); });
    arvoresCalcada(blk, true);
  };
  // ----- cidades em construção: terrenos para as obras (cidade.js constrói neles) -----
  BUILDERS.obras = blk => {
    const { tx, ty, bx, by } = blk;
    [[0, 0], [9, 0], [0, 9], [9, 9]].forEach(([a, c], k) => {
      setRect(tx + 2 + a, ty + 2 + c, 7, 7, TILE.BUILD);
      lotes.push({ id: 'L' + bx + '_' + by + '_' + k, bx, by, kind: 'obras', tam: 'p', x: (tx + 2 + a) * T + 5, y: (ty + 2 + c) * T + 5, w: 7 * T - 10, h: 7 * T - 10 });
    });
    arvoresCalcada(blk, true);
  };
  BUILDERS.obra = blk => {
    const { tx, ty, bx, by } = blk;
    setRect(tx + 2, ty + 2, 16, 16, TILE.BUILD);
    lotes.push({ id: 'L' + bx + '_' + by + '_0', bx, by, kind: 'obra', tam: 'g', x: (tx + 2) * T + 5, y: (ty + 2) * T + 5, w: 16 * T - 10, h: 16 * T - 10 });
    arvoresCalcada(blk, true);
  };
  BUILDERS.aeroporto = blk => {
    const { tx, ty, bx, by } = blk;
    setRect(tx + 1, ty + 1, 18, 11, TILE.LOT);          // pista e pátio (dá para andar)
    setRect(tx + 4, ty + 13, 10, 4, TILE.BUILD);        // terminal
    setRect(tx + 16, ty + 13, 1, 4, TILE.BUILD);        // torre
    lotes.push({ id: 'L' + bx + '_' + by + '_0', bx, by, kind: 'aeroporto', tam: 'a', x: (tx + 4) * T + 5, y: (ty + 13) * T + 5, w: 10 * T - 10, h: 4 * T - 10, pista: { x: (tx + 1) * T, y: (ty + 1) * T, w: 18 * T, h: 11 * T }, torre: { x: (tx + 16) * T + 4, y: (ty + 13) * T + 4, w: T - 8, h: 4 * T - 8 } });
  };
  // ----- parque -----
  BUILDERS.park = blk => {
    const { tx, ty, rr } = blk;
    setRect(tx + 2, ty + 2, 16, 16, TILE.GRASS);
    const cx = tx + 10, cy = ty + 10, rx = 4.6, ry = 3.3;
    for (let y = ty + 2; y < ty + 18; y++) for (let x = tx + 2; x < tx + 18; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) tiles[y * TW + x] = TILE.WATER; }
    ponds.push({ x: cx * T, y: cy * T, rx: rx * T, ry: ry * T });
    [[3.2, 3.2], [16.8, 3.2], [3.2, 16.8], [16.8, 16.8], [10, 3], [10, 17], [3, 10], [17, 10], [6.5, 5.5], [13.5, 14.5], [6, 14.8], [14, 5.2]].forEach(([a, b]) => trees.push({ x: (tx + a) * T, y: (ty + b) * T, r: 22 + rr() * 8 }));
  };
  // ----- supermercado: prédio grande, praça e estacionamento -----
  BUILDERS.mercado = blk => {
    const { tx, ty, bx, by } = blk, def = MERCADOS_DEF[mercados.length];
    setRect(tx + 2, ty + 1, 16, 10, TILE.BUILD);
    addBuilding((tx + 2) * T + 5, (ty + 1) * T + 5, 16 * T - 10, 10 * T - 10, 1);
    const b = buildings[buildings.length - 1]; b.det = [{ fx: 0.2, fy: 0.5, t: 'ac' }, { fx: 0.5, fy: 0.5, t: 'ac' }, { fx: 0.8, fy: 0.5, t: 'vent' }]; b.mercado = def; b.andares = 1;
    setRect(tx, ty + 14, 20, 6, TILE.LOT);
    const lotTop = (ty + 14) * T, vagas = [];
    for (let i = 0; i < 15; i++) { const x = blk.x + 24 + i * 40; vagas.push({ x, y: lotTop + 66, a: 0, fila: 'A', i }); vagas.push({ x, y: lotTop + 164, a: Math.PI, fila: 'B', i }); }
    const pl = Object.assign({}, def, { tipo: 'mercado', b, x: b.x + b.w / 2, y: b.y + b.h + 24, r: 40 });
    b.place = pl; places.push(pl);
    const m = { def, place: pl, blk, vagas, lotTop, gateX: blk.x + 560, aisleY: lotTop + 114, laneY: blk.y + blk.h + ROAD * 0.25 * T, j: by + 1 };
    blk.mercado = m; mercados.push(m);
    lamps.push({ x: blk.x + 14, y: lotTop + 14 }, { x: blk.x + blk.w - 14, y: lotTop + 14 }, { x: blk.x + 14, y: lotTop + 112 }, { x: blk.x + blk.w - 14, y: lotTop + 112 }, { x: blk.x + blk.w / 2, y: lotTop + 112 });
  };
  // ----- hotel: enorme, com praça e entrada grandiosa -----
  BUILDERS.hotel = blk => {
    const { tx, ty } = blk, key = blk.bx + ',' + blk.by, def = HOTEIS_DEF[key];
    setRect(tx + 2, ty + 1, 16, 12, TILE.BUILD);
    addBuilding((tx + 2) * T + 5, (ty + 1) * T + 5, 16 * T - 10, 12 * T - 10, def.nivel === 'feio' ? 0 : 1);
    const b = buildings[buildings.length - 1]; b.det = []; b.hotel = def; blk.hotel = def;
    b.andares = def.nivel === 'luxo' ? 5 : def.nivel === 'medio' ? 4 : def.nivel === 'simples' ? 3 : 2;
    const pl = Object.assign({}, def, { tipo: 'hotel', b, x: b.x + b.w / 2, y: b.y + b.h + 24, r: 40 });
    b.place = pl; places.push(pl);
  };
  // ----- prédios públicos: prefeitura, delegacia, hospital e estádio -----
  const PUB_DIMS = { prefeitura: [16, 8], delegacia: [16, 8], hospital: [16, 9], estadio: [18, 18] };
  const PUBLICO = k => (blk => {
    const { tx, ty } = blk, dims = PUB_DIMS[k], ox = k === 'estadio' ? 1 : 2;
    setRect(tx + ox, ty + 1, dims[0], dims[1], TILE.BUILD);
    const nomes = { prefeitura: 'PREFEITURA DE RIBEIRÃO', delegacia: 'DELEGACIA GERAL', hospital: 'HOSPITAL SANTA CASA', estadio: 'ESTÁDIO MUNICIPAL' };
    const b = mkBuilding((tx + ox) * T + 5, (ty + 1) * T + 5, dims[0] * T - 10, dims[1] * T - 10, 1, rnd); b.det = []; b.publico = k; b.custom = (ctx, bb) => drawPublico(ctx, bb); buildings.push(b);
    const pl = { tipo: k, id: k, nome: nomes[k], cor: { prefeitura: '#1f4f8a', delegacia: '#16224a', hospital: '#d9363e', estadio: '#2a8a3a' }[k], b, x: b.x + b.w / 2, y: b.y + b.h + 24, r: 42 };
    b.place = pl; places.push(pl); blk[k] = pl;
    if (k === 'hospital') hospitais.push({ x: pl.x, y: pl.y + 8, r: 44, nome: 'HOSPITAL SANTA CASA' });
    if (k !== 'estadio') setRect(tx, ty + 1 + dims[1], BLOCK, BLOCK - 1 - dims[1], k === 'delegacia' || k === 'hospital' ? TILE.LOT : TILE.SIDE);
    if (k === 'estadio') { for (let q = 0; q < 8; q++) trees.push({ x: (tx + 1.5 + q * 2.4) * T, y: (ty + 19.2) * T, r: 15 }); }
  });
  ['prefeitura', 'delegacia', 'hospital', 'estadio'].forEach(k => { BUILDERS[k] = PUBLICO(k); });
  // ----- porto: cais de concreto, galpões e o mar na ponta leste -----
  BUILDERS.porto = blk => {
    const { tx, ty, by } = blk, fr = mulberry32(by * 61 + 11);
    setRect(tx, ty, BLOCK, BLOCK, TILE.LOT);
    setRect(tx + 12, ty, 8, BLOCK, TILE.WATER);
    [[1, 1], [1, 12]].forEach(([a, c]) => { setRect(tx + a, ty + c, 7, 5, TILE.BUILD); const gb = mkBuilding((tx + a) * T + 4, (ty + c) * T + 4, 7 * T - 8, 5 * T - 8, 7, fr); gb.det = []; gb.galpao = true; gb.andares = 1; buildings.push(gb); });
    blk.porto = true;
  };
  // ----- florestas: todas as árvores, clareiras com cabana, lagos, acampamentos... -----
  BUILDERS.floresta = blk => {
    const { tx, ty, bx, by, rr } = blk, m = megaDe(bx, by);
    const q = rr(); let clare = null, lago = null, camp = null, torre = null;
    const cx = tx + 6 + rr() * 8, cy = ty + 6 + rr() * 8;
    if (q < 0.20) clare = { x: cx, y: cy, r: 3.2 + rr() * 1.5 };
    else if (q < 0.36) lago = { x: cx, y: cy, rx: 3.4 + rr() * 2.2, ry: 2.6 + rr() * 1.6 };
    else if (q < 0.45) camp = { x: cx, y: cy, r: 2.6 };
    else if (q < 0.49) torre = { x: cx, y: cy, r: 2.2 };
    blk.clare = clare; blk.lago = lago; blk.camp = camp; blk.torre = torre;
    if (lago) { for (let y = Math.floor(ty); y < ty + BLOCK; y++) for (let x = Math.floor(tx); x < tx + BLOCK; x++) { const dx = (x + 0.5 - lago.x) / lago.rx, dy = (y + 0.5 - lago.y) / lago.ry; if (dx * dx + dy * dy <= 1) tiles[y * TW + x] = TILE.WATER; } ponds.push({ x: lago.x * T, y: lago.y * T, rx: lago.rx * T, ry: lago.ry * T }); }
    const ft = clare || camp || torre;
    if (clare) {
      const ccx = Math.round(clare.x) - 2, ccy = Math.round(clare.y) - 1;
      setRect(ccx, ccy, 4, 3, TILE.BUILD);
      const cb = mkBuilding(ccx * T + 3, ccy * T + 3, 4 * T - 6, 3 * T - 6, 0, rr); cb.cabana = true; cb.det = []; cb.andares = 1; cb.wall = { cor: '#7a5a3a', tex: 'madeira' }; buildings.push(cb);
      blk.cabana = { x: ccx * T + 2 * T, y: ccy * T + 3 * T + 18 };
    }
    if (torre) { const ttx = Math.round(torre.x) - 1, tty = Math.round(torre.y) - 1; setRect(ttx, tty, 2, 2, TILE.BUILD); blk.torreRect = { x: ttx * T, y: tty * T, w: 2 * T, h: 2 * T }; }
    // as árvores desta quadra + metade das ruas apagadas em volta (cada quadra cuida da sua metade)
    const x0 = Math.max(tx - ROAD / 2, m.tx0), x1 = Math.min(tx + BLOCK + ROAD / 2, m.tx1), y0 = Math.max(ty - ROAD / 2, m.ty0), y1 = Math.min(ty + BLOCK + ROAD / 2, m.ty1);
    const nT = Math.round((x1 - x0) * (y1 - y0) * (0.30 + rr() * 0.10));
    for (let k = 0; k < nT; k++) {
      const x = x0 + 0.5 + rr() * (x1 - x0 - 1), y = y0 + 0.5 + rr() * (y1 - y0 - 1), qq = rr(), px = x * T, py = y * T;
      if (ft && Math.hypot(x - ft.x, y - ft.y) < ft.r) continue;
      if (lago && Math.pow((x - lago.x) / (lago.rx + 0.8), 2) + Math.pow((y - lago.y) / (lago.ry + 0.8), 2) < 1) continue;
      if (naTrilha(px, py, 26)) continue;
      trees.push({ x: px, y: py, r: 17 + qq * 14, mata: true, k: qq < 0.32 ? 1 : qq < 0.40 ? 3 : 0 });
    }
  };
  // ----- mata pequena (perto das fazendas) -----
  BUILDERS.bosque = blk => {
    const { tx, ty, rr } = blk;
    setRect(tx, ty, BLOCK, BLOCK, TILE.GRASS);
    const nT = 70 + Math.floor(rr() * 40);
    for (let k = 0; k < nT; k++) { const qq = rr(); trees.push({ x: (tx + 1 + rr() * 18) * T, y: (ty + 1 + rr() * 18) * T, r: 17 + qq * 13, mata: true, k: qq < 0.25 ? 1 : 0 }); }
  };
  // ----- plantação: lavoura, pasto, e às vezes a sede da fazenda (casa + celeiro + silo) -----
  BUILDERS.campo = blk => {
    const { tx, ty, rr } = blk;
    setRect(tx, ty, BLOCK, BLOCK, TILE.GRASS);
    blk.cultura = ['soja', 'milho', 'cana', 'cafe', 'pasto', 'trigo', 'arado', 'pivo'][Math.floor(rr() * 8)];
    if (rr() < 0.6) {   // sede: casa de fazenda + celeiro + silo, junto da estrada de baixo
      const lado = rr() < 0.5 ? 1 : 10, est = 'rustica', n = casas.length, seed = 1000 + n * 37, rg = mulberry32(seed);
      const lay = AR.casaLayout(rg, 8, 7, { riqueza: 1, estilo: est, tipo: rr() < 0.5 ? 'garagem' : 'terrea' });
      const ltx = tx + lado, lty = ty + 12;
      setRect(ltx, lty, 8, 7, TILE.GRASS); lay.partes.forEach(p => setRect(ltx + p.x, lty + p.y, p.w, p.h, TILE.BUILD));
      const ox = ltx * T, oy = lty * T, b = montaCasaB(blk, lay, ox, oy, seed, est, rg); b.andares = 1;
      const q = AR.quintalDe(lay, ox, oy, 8, 7, seed, est); q.cerca = 'nenhuma'; q.carro = null; blk.lotes.push({ q, seed, b });
      const c = addCasa(b, 24); c.estilo = est; c.riqueza = 1;
      const gx = lado === 1 ? tx + 9 : tx + 3, gy = ty + 12;     // celeiro ao lado e silo
      setRect(gx, gy, 6, 4, TILE.BUILD);
      const ce = mkBuilding(gx * T + 4, gy * T + 4, 6 * T - 8, 4 * T - 8, 4, rr); ce.det = []; ce.celeiro = true; ce.andares = 1; ce.custom = (ctx, bb) => AR.drawCeleiro(ctx, bb); ce.p = { kind: 'tile', base: '#9a3a2a', edge: '#b85a44', dark: '#6a2418' }; buildings.push(ce);
      const sx = lado === 1 ? tx + 16 : tx + 1, sy = ty + 12; setRect(sx, sy, 2, 2, TILE.BUILD); blk.silo = { x: (sx + 1) * T, y: (sy + 1) * T };
      blk.sede = { lote: { x: ox, y: oy, w: 8 * T, h: 7 * T }, celeiro: { x: gx * T, y: gy * T, w: 6 * T, h: 4 * T } };
    }
    for (let k = 0; k < 4; k++) { const a = 1.5 + rr() * 17; trees.push({ x: (tx + a) * T, y: (ty + 0.7) * T, r: 14 + rr() * 5 }); }
  };
  // ----- mansão do poderoso chefão: quartel-general da máfia -----
  BUILDERS.mansao_chefao = blk => {
    const { tx, ty, rr } = blk;
    // Todo o terreno é calçado com Chão de Tijolos Nobres e Pátio Pavimentado
    setRect(tx, ty, BLOCK, BLOCK, TILE.GRASS);
    setRect(tx + 8, ty + 10, 4, 10, TILE.LOT);
    setRect(tx + 2, ty + 10, 16, 9, TILE.SIDE);
    // Prédio da Mansão Monumental (16x8 tiles)
    setRect(tx + 2, ty + 2, 16, 8, TILE.BUILD);
    const mb = mkBuilding((tx + 2) * T + 4, (ty + 2) * T + 4, 16 * T - 8, 8 * T - 8, 2, rr);
    mb.mansao = true; mb.andares = 2; mb.det = [];
    mb.p = { kind: 'tile', base: '#8b141a', edge: '#d4af37', dark: '#50080e' };
    buildings.push(mb);
    // Grande Piscina Olímpica (à direita)
    setRect(tx + 13, ty + 11, 5, 4, TILE.WATER);
    ponds.push({ x: (tx + 15.5) * T, y: (ty + 13) * T, rx: 2.5 * T, ry: 2 * T });
    // Heliponto (à esquerda)
    setRect(tx + 2, ty + 11, 4, 4, TILE.SIDE);
    blk.heli = { x: (tx + 4) * T, y: (ty + 13) * T };
    // Palmeiras Imperiais nas extremidades dos muros (longe do meio)
    [1, 19].forEach(a => {
      trees.push({ x: (tx + a) * T, y: (ty + 10) * T, r: 14 });
      trees.push({ x: (tx + a) * T, y: (ty + 16) * T, r: 14 });
    });
    // Registra lugar
    const pl = { id: 'mansao_chefao', tipo: 'mansao', nome: 'MANSÃO DO PODEROSO CHEFÃO', sub: 'Villa Mafiosa — Quartel-General do Don', cor: '#e5b834', x: (tx + 10) * T, y: (ty + 10) * T + 20, r: 46 };
    mb.place = pl;
    places.push(pl);
    blk.mansao = pl;
  };

  // ----- fazenda de bilionário: mansão enorme, piscina, heliponto, estábulo e alameda -----
  BUILDERS.fazenda = blk => {
    const { tx, ty, bx, by, rr } = blk;
    setRect(tx, ty, BLOCK, BLOCK, TILE.GRASS);
    const n = casas.length, seed = 1000 + n * 37, rg = mulberry32(seed), est = 'classica';
    const lay = AR.casaLayout(rg, 16, 8, { riqueza: 2, estilo: est, tipo: 'mansao' });
    const ltx = tx + 2, lty = ty + 1;
    lay.partes.forEach(p => setRect(ltx + p.x, lty + p.y, p.w, p.h, TILE.BUILD));
    const ox = ltx * T, oy = lty * T, b = montaCasaB(blk, lay, ox, oy, seed, est, rg); b.andares = 2; b.mansao = true;
    const q = AR.quintalDe(lay, ox, oy, 16, 8, seed, est); q.cerca = 'nenhuma'; q.carro = null; q.arbustos = []; q.canteiros = q.canteiros.slice(0, 4);
    if (q.piscina) { const pp = q.piscina; setRect(Math.ceil(pp.x / T), Math.ceil(pp.y / T), Math.max(1, Math.floor(pp.w / T)), Math.max(1, Math.floor(pp.h / T)), TILE.WATER); }
    blk.lotes.push({ q, seed, b });
    const c = addCasa(b, 60); c.rica = true; c.riqueza = 2; c.nome = 'MANSÃO'; c.venda = false; c.estilo = est;
    setRect(tx + 1, ty + 14, 4, 4, TILE.LOT); blk.heli = { x: (tx + 3) * T, y: (ty + 16) * T };   // heliponto
    const sx = tx + 14; setRect(sx, ty + 13, 5, 3, TILE.BUILD);                                    // estábulo
    const sb = mkBuilding(sx * T + 4, (ty + 13) * T + 4, 5 * T - 8, 3 * T - 8, 0, rr); sb.det = []; sb.estabulo = true; sb.andares = 1; sb.custom = (ctx, bb) => AR.drawCeleiro(ctx, bb, true); sb.p = { kind: 'tile', base: '#7a5a3a', edge: '#9a7a52', dark: '#4a341e' }; buildings.push(sb);
    const px = Math.round(lay.porta) + 2;
    setRect(tx + px - 1, ty + 9, 2, 11, TILE.LOT); blk.alameda = { x: (tx + px) * T, y0: (ty + 9) * T, y1: (ty + 20) * T };
    for (let k = 0; k < 5; k++) { trees.push({ x: (tx + px - 2) * T, y: (ty + 10.5 + k * 2) * T, r: 17 }); trees.push({ x: (tx + px + 2) * T, y: (ty + 10.5 + k * 2) * T, r: 17 }); }
    for (let k = 0; k < 8; k++) trees.push({ x: (tx + 6 + rr() * 12) * T, y: (ty + 15 + rr() * 4) * T, r: 17 + rr() * 8 });
    blk.fazenda = { dono: FAZENDEIROS[(bx + by * 3) % FAZENDEIROS.length] };
  };

  function criarBloco(bx, by) {
    const tx = MG + ROAD + bx * PITCH, ty = MG + ROAD + by * PITCH, kind = kindDe(bx, by);
    const blk = { bx, by, tx, ty, x: tx * T, y: ty * T, w: BLOCK * T, h: BLOCK * T, kind, rr: mulberry32(bx * 7919 + by * 104729 + 17), lotes: [] };
    blocks.push(blk);
    if (kind === 'river') { setRect(tx, ty, BLOCK, BLOCK, TILE.WATER); return; }
    if (kind !== 'floresta') setRect(tx, ty, BLOCK, BLOCK, TILE.SIDE);
    (BUILDERS[kind] || BUILDERS.city)(blk);
  }
  for (let by = 0; by < ROWS; by++) for (let bx = 0; bx < COLS; bx++) criarBloco(bx, by);

  // pontes e faixas de pedestre
  const rios = blocks.filter(b => b.kind === 'river');
  const temPonte = (bx, j) => PONTES[bx] === 'todas' || (Array.isArray(PONTES[bx]) && PONTES[bx].includes(j));
  rios.forEach(rv => { for (let j = 0; j <= ROWS; j++) setRect(rv.tx, MG + j * PITCH, BLOCK, ROAD, temPonte(rv.bx, j) ? TILE.BRIDGE : TILE.WATER); });
  // PONTES LARGAS: além da pista, cada ponte tem uma calçada de BR_S tiles dos dois lados
  // (e as pontes principais têm mirantes no meio, onde dá para parar e olhar o rio)
  const BR_S = 4;
  const ehPrincipal = bx => PONTES[bx] !== 'todas';
  function preparaPonte(bx, j) {
    const rv = blocks.find(b => b.kind === 'river' && b.bx === bx); if (!rv) return;
    const ty = MG + j * PITCH, mir = ehPrincipal(bx) ? 2 : 0, mx = rv.tx + (BLOCK - 4) / 2;
    setRect(rv.tx, ty - BR_S, BLOCK, BR_S, TILE.SIDE); setRect(rv.tx, ty + ROAD, BLOCK, BR_S, TILE.SIDE);
    if (mir) { setRect(mx, ty - BR_S - mir, 4, mir, TILE.SIDE); setRect(mx, ty + ROAD + BR_S, 4, mir, TILE.SIDE); }
    pontePostes(rv.x, ty * T, rv.w, ROAD * T, !!mir).forEach(p => lamps.push(p));
  }
  rios.forEach(rv => { for (let j = 0; j <= ROWS; j++) if (temPonte(rv.bx, j)) preparaPonte(rv.bx, j); });
  // pode um carro ir de um cruzamento ao vizinho na horizontal? (rios sem ponte e florestas sem rua bloqueiam)
  // segmento s = quadra entre o cruzamento s e o s+1
  const cruzaOk = (s, j) => (!RIVERS.includes(s) || temPonte(s, j)) && viaH(j, s);
  const crossings = [];
  for (let i = 0; i <= COLS; i++) for (let j = 0; j <= ROWS; j++) {
    if (!urbano(i, j)) continue;     // faixas de pedestre só nas cidades
    const x0 = MG + i * PITCH, y0 = MG + j * PITCH;
    const set = (tx, ty, w, h) => {
      for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) {
        const t = tiles[y * TW + x]; if (t === TILE.ROAD || t === TILE.BRIDGE) tiles[y * TW + x] = TILE.CROSS;
      }
    };
    if (j > 0 && viaV(i, j - 1)) { set(x0, y0 - 1, ROAD, 1); crossings.push({ x: x0, y: y0 - 1, w: ROAD, h: 1, dir: 'h' }); }
    if (j < ROWS && viaV(i, j)) { set(x0, y0 + ROAD, ROAD, 1); crossings.push({ x: x0, y: y0 + ROAD, w: ROAD, h: 1, dir: 'h' }); }
    if (i > 0 && viaH(j, i - 1)) { set(x0 - 1, y0, 1, ROAD); crossings.push({ x: x0 - 1, y: y0, w: 1, h: ROAD, dir: 'v' }); }
    if (i < COLS && viaH(j, i)) { set(x0 + ROAD, y0, 1, ROAD); crossings.push({ x: x0 + ROAD, y: y0, w: 1, h: ROAD, dir: 'v' }); }
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
    if (!urbano(i, j)) continue;
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
  const SEM_PROPS = { river: 1, floresta: 1, campo: 1, fazenda: 1, bosque: 1, porto: 1 };   // quadras sem calçada
  const propList = [];
  blocks.forEach(blk => { if (!SEM_PROPS[blk.kind]) blockProps(blk).forEach(p => propList.push(p)); });

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
  function fachada(b) {
    if (b.casa3) return AR.fachadaAltura(b.casa3.partes.find(p => p.t === 'corpo'));
    if (b.celeiro || b.estabulo) return 32;
    if (b.galpao) return 40;
    let fh = AR.ANDAR_TERREO + AR.ANDAR * (Math.max(1, b.andares || 1) - 1);
    if (b.hotel) fh += 18;
    if (b.mercado) fh = 60;
    return Math.min(fh, b.h - 24);
  }

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

  // fachada (parede da frente): janelas de verdade, vitrine, sacadas e porta vêm do arte.js
  function drawFacade(ctx, b, fh) { AR.fachadaPredio(ctx, b, fh); }

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

  // ---------- variações de telhado: quatro águas, duas águas com sombra, cobertura, jardim e piscina ----------
  function roofExtra(ctx, b, x, y, w, h) {
    if (b.hotel || b.mercado || w < 70 || h < 60) return;
    const r = mulberry32(Math.floor(x * 3 + y * 11) + 5), v = r(), p = b.p;
    const ix = x + 6, iy = y + 6, iw = w - 12, ih = h - 12;
    const poly = (pts, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1]); ctx.closePath(); ctx.fill(); };
    if (p.kind === 'tile') {
      ctx.save(); ctx.beginPath(); ctx.rect(ix, iy, iw, ih); ctx.clip();
      if (v < 0.5 && Math.min(iw, ih) > 50) {   // telhado de QUATRO ÁGUAS (pirâmide)
        const horiz = iw >= ih, k = (horiz ? ih : iw) / 2, cx = ix + iw / 2, cy = iy + ih / 2;
        const A = horiz ? [ix + k, cy] : [cx, iy + k], B = horiz ? [ix + iw - k, cy] : [cx, iy + ih - k];
        const faces = [
          { pts: [ix, iy, ix + iw, iy, B[0], B[1], A[0], A[1]], lado: 'topo' },
          { pts: [ix, iy + ih, ix + iw, iy + ih, B[0], B[1], A[0], A[1]], lado: 'baixo' },
          { pts: [ix, iy, ix, iy + ih, A[0], A[1]], lado: 'esq' },
          { pts: [ix + iw, iy, ix + iw, iy + ih, B[0], B[1]], lado: 'dir' }];
        faces.forEach(f => {
          ctx.save(); ctx.beginPath(); ctx.moveTo(f.pts[0], f.pts[1]); for (let q = 2; q < f.pts.length; q += 2) ctx.lineTo(f.pts[q], f.pts[q + 1]); ctx.closePath(); ctx.clip();
          ctx.fillStyle = p.base; ctx.fillRect(ix, iy, iw, ih);
          const vertical = f.lado === 'esq' || f.lado === 'dir';
          for (let t = 0; t < (vertical ? iw : ih); t += 8) { ctx.fillStyle = 'rgba(0,0,0,0.14)'; if (vertical) ctx.fillRect(ix + t + 6, iy, 2, ih); else ctx.fillRect(ix, iy + t + 6, iw, 2); ctx.fillStyle = 'rgba(255,255,255,0.07)'; if (vertical) ctx.fillRect(ix + t, iy, 2, ih); else ctx.fillRect(ix, iy + t, iw, 2); }
          ctx.fillStyle = { topo: 'rgba(255,255,255,0.20)', esq: 'rgba(255,255,255,0.10)', dir: 'rgba(0,0,20,0.20)', baixo: 'rgba(0,0,20,0.32)' }[f.lado]; ctx.fillRect(ix, iy, iw, ih);
          ctx.restore();
        });
        ctx.strokeStyle = p.dark; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.moveTo(A[0], A[1]); ctx.lineTo(ix, iy); ctx.moveTo(A[0], A[1]); ctx.lineTo(ix, iy + ih); ctx.moveTo(B[0], B[1]); ctx.lineTo(ix + iw, iy); ctx.moveTo(B[0], B[1]); ctx.lineTo(ix + iw, iy + ih); ctx.stroke();
        ctx.strokeStyle = p.edge; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(A[0], A[1] - 2); ctx.lineTo(B[0], B[1] - 2); ctx.stroke();
      } else {   // DUAS ÁGUAS: lado ao sol e lado na sombra
        if (b.ridge === 'h') { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(ix, iy, iw, ih / 2); ctx.fillStyle = 'rgba(0,0,25,0.22)'; ctx.fillRect(ix, iy + ih / 2, iw, ih / 2); }
        else { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(ix, iy, iw / 2, ih); ctx.fillStyle = 'rgba(0,0,25,0.22)'; ctx.fillRect(ix + iw / 2, iy, iw / 2, ih); }
      }
      ctx.restore();
      return;
    }
    if (iw < 100 || ih < 90) return;
    const bx = ix + iw * 0.2, by = iy + ih * 0.2, bw = iw * 0.6, bh = ih * 0.55;
    if (v < 0.2) {   // cobertura: um segundo andar menor, mais claro
      ctx.fillStyle = 'rgba(0,0,15,0.35)'; ctx.fillRect(bx + 8, by + 9, bw, bh);
      ctx.fillStyle = p.dark; ctx.fillRect(bx, by, bw, bh); ctx.fillStyle = p.edge; ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4); ctx.fillStyle = p.base; ctx.fillRect(bx + 5, by + 5, bw - 10, bh - 10);
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(bx + 2, by + 2, bw - 4, 2); ctx.fillRect(bx + 2, by + 2, 2, bh - 4); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(bx + 2, by + bh - 4, bw - 4, 2);
      ctx.fillStyle = '#7fb0cc'; ctx.fillRect(bx + bw * 0.55, by + 10, bw * 0.3, bh * 0.35); ctx.strokeStyle = '#eaf4f8'; ctx.lineWidth = 2; ctx.strokeRect(bx + bw * 0.55 + 1, by + 11, bw * 0.3 - 2, bh * 0.35 - 2);
    } else if (v < 0.34) {   // jardim na laje: grama, canteiros e árvores
      ctx.fillStyle = 'rgba(0,0,15,0.28)'; rrect(ctx, bx + 5, by + 6, bw, bh, 10); ctx.fill();
      ctx.fillStyle = '#5a8a3e'; rrect(ctx, bx, by, bw, bh, 10); ctx.fill(); ctx.fillStyle = '#6fa650'; rrect(ctx, bx + 3, by + 3, bw - 6, bh - 6, 8); ctx.fill();
      for (let k = 0; k < 9; k++) { ctx.fillStyle = r() < 0.5 ? '#3d7a2e' : '#e8a0c0'; ctx.beginPath(); ctx.arc(bx + 10 + r() * (bw - 20), by + 10 + r() * (bh - 20), 3 + r() * 5, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#c9b48a'; ctx.fillRect(bx + bw / 2 - 5, by, 10, bh); ctx.fillStyle = '#2f6a26'; ctx.beginPath(); ctx.arc(bx + bw * 0.25, by + bh * 0.5, 13, 0, 7); ctx.fill(); ctx.fillStyle = '#438a36'; ctx.beginPath(); ctx.arc(bx + bw * 0.25 - 3, by + bh * 0.5 - 3, 8, 0, 7); ctx.fill();
    } else if (v < 0.44) {   // piscina no terraço com espreguiçadeiras
      ctx.fillStyle = 'rgba(0,0,15,0.28)'; rrect(ctx, bx + 5, by + 6, bw, bh * 0.8, 8); ctx.fill();
      ctx.fillStyle = '#d6dbe4'; rrect(ctx, bx - 4, by - 4, bw + 8, bh * 0.8 + 8, 9); ctx.fill(); ctx.fillStyle = '#34b4d8'; rrect(ctx, bx, by, bw, bh * 0.8, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < 5; k++) ctx.fillRect(bx + 8 + r() * (bw - 30), by + 6 + r() * (bh * 0.8 - 12), 14, 2);
      ctx.fillStyle = '#e8e0cc'; for (let k = 0; k < 3; k++) { ctx.fillRect(bx + 6 + k * 24, by + bh * 0.8 + 10, 16, 8); ctx.fillStyle = '#d65a3a'; ctx.fillRect(bx + 6 + k * 24, by + bh * 0.8 + 10, 16, 3); ctx.fillStyle = '#e8e0cc'; }
    }
  }
  function drawRoof(ctx, b) {
    if (b.custom) { b.custom(ctx, b); return; }
    const fh = fachada(b); drawFacade(ctx, b, fh);
    const { x, y, w, p } = b, h = b.h - fh;
    if (p.kind === 'tile' && !b.hotel && !b.mercado) {
      // telhado de telha de verdade (duas ou quatro águas) e chaminé
      const rs0 = mulberry32(Math.floor(x * 7 + y * 13)), tipo = rs0() < 0.5 && Math.min(w, h) > 60 ? 'quatro' : 'duas';
      AR.telhado(ctx, x, y, w, h, tipo, b.ridge, { base: p.base, claro: p.edge, escuro: p.dark }, Math.floor(x * 3 + y * 5));
      b.det.forEach(d => { const dx = x + 12 + d.fx * (w - 40), dy = y + 12 + d.fy * (h - 40); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(dx + 3, dy + 3, 14, 14); ctx.fillStyle = '#8a4a3a'; ctx.fillRect(dx, dy, 12, 12); ctx.fillStyle = '#2a1a1a'; ctx.fillRect(dx + 3, dy + 3, 6, 6); });
      return;
    }
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
    roofExtra(ctx, b, x, y, w, h);
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

  // ---------- PONTES BONITAS E LARGAS ----------
  // pontos dos postes de luz (nos pilares do parapeito)
  function pontePostes(x, y, w, h, main) {
    const SW = BR_S * T, y0 = y - SW, y1 = y + h + SW, out = [], mx0 = x + w / 2 - 2 * T, mw = 4 * T;
    for (let px = x + 48; px < x + w - 20; px += 96) {
      if (main && px > mx0 - 14 && px < mx0 + mw + 14) continue;
      out.push({ x: px, y: y0 + 8 }, { x: px, y: y1 - 8 });
    }
    if (main) [[mx0 + 8, y0 - 2 * T + 8], [mx0 + mw - 8, y0 - 2 * T + 8], [mx0 + 8, y1 + 2 * T - 8], [mx0 + mw - 8, y1 + 2 * T - 8]].forEach(p => out.push({ x: p[0], y: p[1] }));
    return out;
  }
  let brPat = null;
  function brPatterns(ctx) {
    if (brPat) return brPat;
    // calçadão de pedra portuguesa: ondas pretas sobre pedra clara (marca registrada do Brasil)
    const c = document.createElement('canvas'); c.width = 32; c.height = 16; const g = c.getContext('2d'), r = mulberry32(31);
    g.fillStyle = '#dcd2b4'; g.fillRect(0, 0, 32, 16);
    for (let k = 0; k < 14; k++) { g.fillStyle = r() < 0.5 ? 'rgba(130,110,70,0.12)' : 'rgba(255,255,255,0.30)'; g.fillRect(r() * 32, r() * 16, 1, 1); }
    const onda = (dy, lw, col) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); for (let x = 0; x <= 32; x += 1) { const yy = 8 + dy + Math.sin(x / 32 * Math.PI * 2) * 3.4; if (x) g.lineTo(x, yy); else g.moveTo(x, yy); } g.stroke(); };
    onda(0, 4, '#4a4452'); onda(-1, 1, '#6a6474');
    brPat = ctx.createPattern(c, 'repeat'); return brPat;
  }
  // x,y,w,h = a pista (retângulo da rua sobre o rio). Desenha calçadas, parapeitos, arcos de pedra e mirantes.
  function drawBridge(ctx, x, y, w, h, o) {
    o = o || {};
    const SW = BR_S * T, y0 = y - SW, y1 = y + h + SW, main = !!o.main, mir = main ? 2 * T : 0, mx0 = x + w / 2 - 2 * T, mw = 4 * T;
    const PAT = brPatterns(ctx);
    // 1) sombra da ponte na água
    ctx.fillStyle = 'rgba(0,12,40,0.42)';
    if (main) { ctx.fillRect(x + 6, y1, mx0 - x, 18); ctx.fillRect(mx0 + mw + 6, y1, x + w - mx0 - mw, 18); ctx.fillRect(mx0 + 6, y1 + mir, mw, 18); ctx.fillRect(x + 6, y0 - 8, mx0 - x, 8); ctx.fillRect(mx0 + mw, y0 - 8, x + w - mx0 - mw, 8); ctx.fillRect(mx0 - 8, y0 - mir, 8, mir); ctx.fillRect(mx0 + mw, y0 - mir, 8, mir); }
    else { ctx.fillRect(x + 6, y1, w, 18); ctx.fillRect(x + 6, y0 - 8, w, 8); }
    // 2) face de pedra com arcos (aparece na frente da ponte, no estilo 2.5D)
    const fasc = (xa, wa, yy) => {
      if (wa <= 0) return;
      ctx.fillStyle = '#7e786c'; ctx.fillRect(xa, yy, wa, 26); ctx.fillStyle = '#a8a190'; ctx.fillRect(xa, yy, wa, 4);
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let ty = 8; ty < 26; ty += 8) ctx.fillRect(xa, yy + ty, wa, 1);
      for (let ax = xa + 10; ax + 44 <= xa + wa; ax += 64) {
        ctx.fillStyle = '#13254a'; ctx.beginPath(); ctx.moveTo(ax, yy + 26); ctx.ellipse(ax + 22, yy + 26, 22, 18, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#c4bdaa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(ax + 22, yy + 26, 23, 19, 0, Math.PI, 0); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(xa, yy + 26, wa, 6);
    };
    if (main) { fasc(x, mx0 - x, y1); fasc(mx0 + mw, x + w - mx0 - mw, y1); fasc(mx0, mw, y1 + mir); } else fasc(x, w, y1);
    // 3) calçadão
    ctx.fillStyle = PAT;
    ctx.fillRect(x, y0, w, SW); ctx.fillRect(x, y + h, w, SW);
    if (main) { ctx.fillRect(mx0, y0 - mir, mw, mir); ctx.fillRect(mx0, y1, mw, mir); }
    // 4) pista: asfalto (só nas pontes novas), juntas de dilatação e meio-fio de pedra
    if (o.asfalto) { ctx.fillStyle = '#3a3646'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#f2c231'; for (let xx = x + 20; xx < x + w - 30; xx += 96) ctx.fillRect(xx, y + h / 2 - 3, 56, 6); }
    for (let xx = x + 32; xx < x + w; xx += 64) { ctx.fillStyle = 'rgba(0,0,12,0.16)'; ctx.fillRect(xx, y, 2, h); ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(xx + 2, y, 1, h); }
    ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(x, y - 10, w, 10); ctx.fillRect(x, y + h, w, 10);
    ctx.fillStyle = '#d8d0bb'; ctx.fillRect(x, y - 6, w, 6); ctx.fillRect(x, y + h, w, 6);
    ctx.fillStyle = '#8a8372'; ctx.fillRect(x, y - 1, w, 1.5); ctx.fillRect(x, y + h - 0.5, w, 1.5);
    // 5) parapeitos de pedra com balaústres
    const cap = (xa, ya, wa, ha) => {
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(xa + 3, ya + 4, wa, ha);
      ctx.fillStyle = '#cdc5b1'; ctx.fillRect(xa, ya, wa, ha);
      ctx.fillStyle = '#7a7364';
      if (wa >= ha) for (let k = 5; k < wa - 3; k += 10) ctx.fillRect(xa + k, ya + 3, 3, ha - 6); else for (let k = 5; k < ha - 3; k += 10) ctx.fillRect(xa + 3, ya + k, wa - 6, 3);
      ctx.fillStyle = '#ece6d6'; ctx.fillRect(xa, ya, wa, 2); ctx.fillStyle = '#6d6759'; ctx.fillRect(xa, ya + ha - 2, wa, 2);
    };
    if (main) {
      cap(x, y0, mx0 - x, 12); cap(mx0 + mw, y0, x + w - mx0 - mw, 12); cap(x, y1 - 12, mx0 - x, 12); cap(mx0 + mw, y1 - 12, x + w - mx0 - mw, 12);
      cap(mx0, y0 - mir, mw, 12); cap(mx0, y0 - mir, 12, mir + 12); cap(mx0 + mw - 12, y0 - mir, 12, mir + 12);
      cap(mx0, y1 + mir - 12, mw, 12); cap(mx0, y1 - 12, 12, mir + 12); cap(mx0 + mw - 12, y1 - 12, 12, mir + 12);
      // medalhão de pedra no chão e bancos nos mirantes
      [[y0 - mir / 2 + 4, 1], [y1 + mir / 2 - 4, -1]].forEach(([cy, d]) => {
        const cx = mx0 + mw / 2; ctx.fillStyle = '#2f2d3a'; ctx.beginPath(); ctx.arc(cx, cy, 34, 0, 7); ctx.fill(); ctx.fillStyle = '#ede5cf'; ctx.beginPath(); ctx.arc(cx, cy, 29, 0, 7); ctx.fill();
        ctx.fillStyle = '#c0453a'; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 27, cy + Math.sin(a) * 27); ctx.lineTo(cx + Math.cos(a + 0.4) * 9, cy + Math.sin(a + 0.4) * 9); ctx.lineTo(cx + Math.cos(a - 0.4) * 9, cy + Math.sin(a - 0.4) * 9); ctx.fill(); }
        ctx.fillStyle = '#2f2d3a'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 7); ctx.fill();
        [-1, 1].forEach(sd => { const bx = cx + sd * 50 - 8, by = cy + d * 24 - 6; ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(bx + 3, by + 4, 16, 36); ctx.fillStyle = '#6b4424'; ctx.fillRect(bx, by, 16, 36); ctx.fillStyle = '#8c5e32'; ctx.fillRect(bx + 1, by + 1, 5, 34); ctx.fillRect(bx + 8, by + 1, 5, 34); ctx.fillStyle = '#3a2814'; ctx.fillRect(bx, by + 17, 16, 2); });
      });
    } else { cap(x, y0, w, 12); cap(x, y1 - 12, w, 12); }
    // 6) pilares com luminárias
    pontePostes(x, y, w, h, main).forEach(p => {
      ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fillRect(p.x - 9, p.y - 7, 20, 20);
      ctx.fillStyle = '#7a7364'; ctx.fillRect(p.x - 10, p.y - 10, 20, 20); ctx.fillStyle = '#e0d8c4'; ctx.fillRect(p.x - 8, p.y - 8, 16, 16); ctx.fillStyle = '#f2ecdc'; ctx.fillRect(p.x - 6, p.y - 6, 12, 12);
      ctx.fillStyle = '#4a4a55'; ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, 7); ctx.fill(); ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill();
    });
    // 7) meio-fio nas pontas (a calçada encontra a rua transversal)
    ctx.fillStyle = '#b8b09c'; ctx.fillRect(x, y0, 3, SW - 4); ctx.fillRect(x, y + h + 6, 3, SW - 6); ctx.fillRect(x + w - 3, y0, 3, SW - 4); ctx.fillRect(x + w - 3, y + h + 6, 3, SW - 6);
  }
  // parte ALTA das pontes principais: arcos de aço por cima da pista (desenhados depois dos carros)
  function drawBridgeHigh(ctx, vx0, vy0, vx1, vy1) {
    rios.forEach(rv => {
      if (!ehPrincipal(rv.bx) || rv.x > vx1 || rv.x + rv.w < vx0) return;
      for (let j = 0; j <= ROWS; j++) {
        if (!temPonte(rv.bx, j)) continue;
        const y = roadTop(j), h = ROAD * T, SW = BR_S * T, y0 = y - SW, y1 = y + h + SW, x = rv.x, w = rv.w;
        if (y1 < vy0 - 60 || y0 > vy1 + 60) continue;
        // sombras compridas
        ctx.fillStyle = 'rgba(0,0,18,0.22)';
        for (let k = 1; k <= 3; k++) ctx.fillRect(x + w * k / 4 - 1 + 14, y0 + 18, 3, y1 - y0);
        ctx.fillRect(x + 16, y0 + 22, w, 5); ctx.fillRect(x + 16, y1 + 12, w, 5);
        // vigas longitudinais (arcos vistos de cima) e pórticos
        const tubo = (xa, ya, wa, ha) => { ctx.fillStyle = '#7f8aa4'; ctx.fillRect(xa, ya, wa, ha); ctx.fillStyle = '#d4dbea'; if (wa > ha) ctx.fillRect(xa, ya, wa, 2); else ctx.fillRect(xa, ya, 2, ha); };
        tubo(x, y0 + 2, w, 5); tubo(x, y1 - 7, w, 5);
        for (let k = 1; k <= 3; k++) {
          const px = x + w * k / 4;
          ctx.globalAlpha = 0.85; tubo(px - 2, y0 - 2, 4, y1 - y0 + 4); ctx.globalAlpha = 1;
          ctx.fillStyle = '#4a5470'; ctx.fillRect(px - 8, y0 - 6, 16, 16); ctx.fillRect(px - 8, y1 - 10, 16, 16);
          ctx.fillStyle = '#c6cee0'; ctx.fillRect(px - 6, y0 - 4, 12, 12); ctx.fillRect(px - 6, y1 - 8, 12, 12);
          ctx.fillStyle = '#e8ecf6'; ctx.fillRect(px - 2, y0 - 0, 4, 4); ctx.fillRect(px - 2, y1 - 4, 4, 4);
        }
        // cabos que sobem dos pórticos (hastes finas)
        ctx.strokeStyle = 'rgba(200,210,230,0.55)'; ctx.lineWidth = 1;
        for (let k = 1; k <= 3; k++) { const px = x + w * k / 4; ctx.beginPath(); for (let d = 1; d <= 3; d++) { ctx.moveTo(px, y0 + 2); ctx.lineTo(px - d * 28, y0 + 2); ctx.moveTo(px, y1 - 5); ctx.lineTo(px + d * 28, y1 - 5); } ctx.stroke(); }
      }
    });
  }
  const naPonte = (px, py) => {
    for (const rv of rios) { if (px < rv.x || px > rv.x + rv.w) continue; for (let j = 0; j <= ROWS; j++) { if (!temPonte(rv.bx, j)) continue; const y = roadTop(j); if (py > y - (BR_S + 3) * T && py < y + (ROAD + BR_S + 3) * T) return true; } }
    return false;
  };

  function drawWaterFx(ctx, t, x0, y0, x1, y1) {
    ctx.save();
    rios.forEach(rv => {
      if (rv.x > x1 || rv.x + rv.w < x0) return;
      for (let yy = Math.max(rv.y, Math.floor(y0 / 36) * 36); yy < Math.min(rv.y + rv.h, y1); yy += 36) {
        const k = yy / 36, rx = rv.x + 14 + ((k * 53 + t * (9 + (k % 5) * 3)) % (rv.w - 40));
        if (naPonte(rx, yy)) continue;
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
      const n = Math.max(2, Math.round((3 + Math.floor(r() * 3)) * len / 384));
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

  // passagem de pedestres entre as duas fileiras de uma quadra
  function travessa(ctx, ax, ay, aw, ah) {
    ctx.fillStyle = '#ece1a2'; ctx.fillRect(ax, ay, aw, ah);
    ctx.fillStyle = ctx.createPattern(tex.paving, 'repeat'); ctx.fillRect(ax, ay, aw, ah);
    ctx.strokeStyle = 'rgba(150,130,70,0.4)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let gx = ax; gx <= ax + aw; gx += T) { ctx.moveTo(gx + 0.5, ay); ctx.lineTo(gx + 0.5, ay + ah); }
    for (let gy = ay; gy <= ay + ah; gy += T) { ctx.moveTo(ax, gy + 0.5); ctx.lineTo(ax + aw, gy + 0.5); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(ax, ay, aw, 5); ctx.fillRect(ax, ay + ah - 3, aw, 3);
  }
  // desenho do miolo de cada tipo de quadra (dentro da calçada)
  const MIOLO = {
    city(ctx, blk) {
      const { x, y } = blk;
      ctx.fillStyle = ctx.createPattern(tex.alley, 'repeat'); ctx.fillRect(x + 2 * T, y + 2 * T, 16 * T, 16 * T);   // "beco" escuro debaixo dos prédios
      travessa(ctx, x + 2 * T, y + 9 * T, 16 * T, 2 * T);
    },
    vila(ctx, blk) {
      const { x, y } = blk;
      ctx.fillStyle = ctx.createPattern(tex.alley, 'repeat'); ctx.fillRect(x + 2 * T, y + 2 * T, 16 * T, 16 * T);
      blk.lotes.forEach(l => AR.drawQuintal(ctx, l.q, tex, l.seed));
      travessa(ctx, x + 2 * T, y + 9 * T, 16 * T, 2 * T);
    },
    hotel(ctx, blk) {
      const { x, y } = blk, lv = blk.hotel.nivel, cx = x + 10 * T, py = y + 13 * T;
      ctx.fillStyle = ctx.createPattern(tex.alley, 'repeat'); ctx.fillRect(x + 2 * T, y + T, 16 * T, 12 * T);
      if (lv === 'luxo' || lv === 'medio') {
        // jardins dos dois lados, caminho central, tapete vermelho, chafariz e bandeiras
        [[x + 2.4 * T, 5.2 * T], [x + 12.4 * T, 5.2 * T]].forEach(([gx, gw]) => {
          rrect(ctx, gx, py + 10, gw, 5 * T - 6, 14); ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fill(); ctx.strokeStyle = '#2f6b26'; ctx.lineWidth = 3; ctx.stroke();
          for (let k = 0; k < 14; k++) { ctx.fillStyle = ['#ff5a7a', '#ffd84a', '#ffffff', '#ff8a3c'][k % 4]; ctx.beginPath(); ctx.arc(gx + 14 + (k * 37) % (gw - 28), py + 22 + (k * 53) % (4 * T), 2.4, 0, 7); ctx.fill(); }
          for (let k = 0; k < 3; k++) { ctx.fillStyle = '#3a8a34'; ctx.beginPath(); ctx.arc(gx + 24 + k * (gw - 48) / 2, py + 4.4 * T, 11, 0, 7); ctx.fill(); }
        });
        ctx.fillStyle = '#e8dfc6'; ctx.fillRect(cx - 2.2 * T, py, 4.4 * T, 5 * T); ctx.fillStyle = 'rgba(120,100,60,0.18)'; for (let k = 0; k < 6; k++) ctx.fillRect(cx - 2.2 * T, py + k * 32, 4.4 * T, 1);
        if (lv === 'luxo') {
          ctx.fillStyle = '#9a1d28'; ctx.fillRect(cx - 22, py - 2, 44, 2.2 * T); ctx.fillStyle = '#e8c36a'; ctx.fillRect(cx - 22, py - 2, 3, 2.2 * T); ctx.fillRect(cx + 19, py - 2, 3, 2.2 * T);
          ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(cx + 3, py + 3.3 * T + 3, 50, 0, 7); ctx.fill();
          ctx.fillStyle = '#d6d0bc'; ctx.beginPath(); ctx.arc(cx, py + 3.3 * T, 48, 0, 7); ctx.fill(); ctx.strokeStyle = '#a89a72'; ctx.lineWidth = 3; ctx.stroke();
          ctx.fillStyle = '#4ab8e0'; ctx.beginPath(); ctx.arc(cx, py + 3.3 * T, 36, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.arc(cx, py + 3.3 * T, 36 - k * 9, 0, 7); ctx.stroke(); }
          ctx.fillStyle = '#e8c36a'; ctx.beginPath(); ctx.arc(cx, py + 3.3 * T, 7, 0, 7); ctx.fill();
          [[-3.4, 0], [3.4, 0], [-5.2, 1], [5.2, 1]].forEach(([k, q]) => { const fx = cx + k * T, fy = py + 6 + q * 14; ctx.fillStyle = '#9a9aa2'; ctx.fillRect(fx - 1, fy, 3, 34); ctx.fillStyle = ['#2a6ac8', '#d9242a', '#f2c42a', '#2a9a52'][((k * 10) | 0 + 20) % 4]; ctx.fillRect(fx + 2, fy, 20, 11); });
        }
      }
    },
    obras(ctx, blk) {
      const { x, y } = blk, gx = x + 2 * T, gy = y + 2 * T;
      ctx.fillStyle = ctx.createPattern(tex.terra, 'repeat'); ctx.fillRect(gx, gy, 16 * T, 16 * T);
      if (blk.kind === 'obras') {
        [[7 * T, 0, 2 * T, 16 * T], [0, 7 * T, 16 * T, 2 * T]].forEach(([a, b, c, d]) => { ctx.fillStyle = '#c9bd8e'; ctx.fillRect(gx + a, gy + b, c, d); ctx.fillStyle = ctx.createPattern(tex.paving, 'repeat'); ctx.fillRect(gx + a, gy + b, c, d); });
      }
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(gx - 4, gy - 4, 16 * T + 8, 4); ctx.fillRect(gx - 4, gy + 16 * T, 16 * T + 8, 4);
    },
    prefeitura(ctx, blk) {
      const { x, y } = blk, d = PUB_DIMS.prefeitura, cx = x + 10 * T, cy = y + 14.2 * T;
      ctx.fillStyle = ctx.createPattern(tex.alley, 'repeat'); ctx.fillRect(x + 2 * T, y + T, d[0] * T, d[1] * T);
      [[x + 2.4 * T, y + 10 * T], [x + 14 * T, y + 10 * T]].forEach(([gx, gy]) => { rrect(ctx, gx, gy, 3.6 * T, 8 * T - 8, 14); ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fill(); ctx.strokeStyle = '#2f6b26'; ctx.lineWidth = 3; ctx.stroke(); });
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(cx + 4, cy + 4, 84, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, 82, 0, 7); ctx.fillStyle = '#d8d0b0'; ctx.fill(); ctx.strokeStyle = '#9a8a5a'; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 44, 0, 7); ctx.fillStyle = ctx.createPattern(tex.water, 'repeat'); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 7); ctx.fill();
      ctx.fillStyle = '#c8c8d0'; ctx.fillRect(cx - 2, cy - 14, 4, 28);
      [[-2.5, '#2a8a3a'], [2.5, '#f2d21a']].forEach(([k, cor]) => { const fx = cx + k * T - 10; ctx.fillStyle = '#6a6a72'; ctx.fillRect(fx, y + 9.6 * T, 3, 46); ctx.fillStyle = cor; ctx.fillRect(fx + 3, y + 9.6 * T, 26, 10); });
    },
    mercado(ctx, blk) {
      const { x, y, w } = blk, lt = y + 14 * T;
      ctx.fillStyle = ctx.createPattern(tex.alley, 'repeat'); ctx.fillRect(x + 2 * T, y + T, 16 * T, 10 * T);
      ctx.fillStyle = ctx.createPattern(tex.asphalt, 'repeat'); ctx.fillRect(x, lt, w, 6 * T);
      ctx.fillStyle = 'rgba(15,10,30,0.28)'; ctx.fillRect(x, lt, w, 6 * T);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x, lt + 2, w, 3);
      for (let k = 0; k < 15; k++) for (const yy of [lt + 40, lt + 138]) { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(x + 4 + k * 40, yy, 2, 50); }
      for (const yy of [lt + 40, lt + 138]) { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(x + 4 + 15 * 40, yy, 2, 50); }
      ctx.fillStyle = 'rgba(40,90,200,0.55)'; ctx.fillRect(x + 8, lt + 44, 32, 42);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.fillText('♿', x + 24, lt + 72);
      ctx.fillStyle = 'rgba(255,224,74,0.7)'; ctx.font = 'bold 11px Arial'; ctx.fillText('ENTRADA / SAÍDA', x + 560, lt + 176); ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < 14; k++) ctx.fillRect(x + 20 + k * 40, lt + 112, 18, 3);
      ctx.fillStyle = '#4a4e58'; ctx.fillRect(x + 538, lt + 12, 40, 18); ctx.fillStyle = '#c8ccd4'; for (let k = 0; k < 6; k++) ctx.fillRect(x + 542 + k * 6, lt + 14, 3, 14);
      // faixa de pedestres da loja até o estacionamento
      ctx.fillStyle = 'rgba(245,245,245,0.85)'; for (let k = 0; k < 8; k++) ctx.fillRect(x + 9.4 * T + k * 14, lt - 3 * T + 4, 8, 3 * T - 6);
    },
    park(ctx, blk) {
      const { x, y, w, h } = blk, gx = x + 2 * T, gy = y + 2 * T, S = 16 * T;
      rrect(ctx, gx, gy, S, S, 18); ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fill(); ctx.strokeStyle = '#2f6b26'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = '#b89a62'; ctx.lineWidth = 18; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(gx + 16, gy + S / 2); ctx.lineTo(gx + S - 16, gy + S / 2); ctx.moveTo(gx + S / 2, gy + 16); ctx.lineTo(gx + S / 2, gy + S - 16); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(gx + S / 2, gy + S / 2, 4.6 * T + 26, 3.3 * T + 26, 0, 0, 7); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx + 16, gy + S / 2 + 9); ctx.lineTo(gx + S - 16, gy + S / 2 + 9); ctx.stroke(); ctx.lineCap = 'butt';
      const fr = mulberry32(blk.bx * 313 + blk.by * 71 + 9);
      for (let k = 0; k < 260; k++) {
        const fx = gx + 14 + fr() * (S - 28), fy = gy + 14 + fr() * (S - 28), cc = fr();
        if (Math.abs(fx - (gx + S / 2)) < 14 || Math.abs(fy - (gy + S / 2)) < 14) continue;
        if (cc < 0.35) { ctx.fillStyle = 'rgba(20,70,20,0.5)'; ctx.fillRect(fx, fy, 1, 3); ctx.fillRect(fx + 2, fy + 1, 1, 2); ctx.fillRect(fx - 2, fy + 1, 1, 2); }
        else { ctx.fillStyle = ['#f5e9ff', '#ffd84a', '#ff7a9a', '#ffffff', '#ff9a3c'][Math.floor(cc * 9) % 5]; ctx.beginPath(); ctx.arc(fx, fy, 1.5, 0, 7); ctx.fill(); }
      }
      ponds.forEach(p => {
        if (p.x < x || p.x > x + w || p.y < y || p.y > y + h) return;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx + 8, p.ry + 8, 0, 0, 7); ctx.fillStyle = '#7d8a6a'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, 7); ctx.fillStyle = ctx.createPattern(tex.water, 'repeat'); ctx.fill();
        ctx.beginPath(); ctx.ellipse(p.x - 8, p.y - 6, p.rx * 0.6, p.ry * 0.5, 0, 0, 7); ctx.fillStyle = 'rgba(120,180,255,0.18)'; ctx.fill();
      });
      ctx.fillStyle = '#6b4a2a';   // bancos
      [[gx + 40, gy + S / 2 - 34], [gx + S - 70, gy + S / 2 + 20], [gx + S / 2 + 20, gy + 40], [gx + S / 2 - 44, gy + S - 70]].forEach(([bx, by]) => { ctx.fillRect(bx, by, 28, 9); ctx.fillStyle = '#4a321c'; ctx.fillRect(bx, by + 7, 28, 2); ctx.fillStyle = '#6b4a2a'; });
      // pracinha de areia com balanço e gira-gira
      const sx = gx + 40, sy = gy + 36; ctx.fillStyle = '#e4d29a'; rrect(ctx, sx, sy, 118, 76, 14); ctx.fill(); ctx.strokeStyle = '#a88a52'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = '#d9352a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx + 14, sy + 14); ctx.lineTo(sx + 14, sy + 54); ctx.moveTo(sx + 52, sy + 14); ctx.lineTo(sx + 52, sy + 54); ctx.moveTo(sx + 14, sy + 14); ctx.lineTo(sx + 52, sy + 14); ctx.stroke();
      ctx.fillStyle = '#2a6ac8'; ctx.fillRect(sx + 20, sy + 40, 12, 5); ctx.fillRect(sx + 34, sy + 44, 12, 5);
      ctx.fillStyle = '#f2c42a'; ctx.beginPath(); ctx.arc(sx + 90, sy + 40, 17, 0, 7); ctx.fill(); ctx.strokeStyle = '#a07a10'; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(sx + 90, sy + 40); ctx.lineTo(sx + 90 + Math.cos(k * 1.57) * 17, sy + 40 + Math.sin(k * 1.57) * 17); } ctx.stroke();
      // coreto
      const ax = gx + S - 78, ay = gy + 70; ctx.fillStyle = 'rgba(0,0,10,0.28)'; ctx.beginPath(); ctx.arc(ax + 6, ay + 8, 36, 0, 7); ctx.fill();
      ctx.fillStyle = '#e8e0cc'; ctx.beginPath(); ctx.arc(ax, ay, 34, 0, 7); ctx.fill(); ctx.fillStyle = '#c8302a'; ctx.beginPath(); ctx.arc(ax, ay, 30, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + Math.cos(k * 0.785) * 30, ay + Math.sin(k * 0.785) * 30); ctx.stroke(); }
      ctx.fillStyle = '#e8c36a'; ctx.beginPath(); ctx.arc(ax, ay, 5, 0, 7); ctx.fill();
    },
    aeroporto(ctx, blk) { const { x, y } = blk; ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat'); ctx.fillRect(x + T, y + T, 18 * T, 11 * T); }
  };
  MIOLO.obra = MIOLO.obras;
  MIOLO.delegacia = MIOLO.hospital = MIOLO.estadio = function (ctx, blk) {
    const { x, y, w, h, kind } = blk, d = PUB_DIMS[kind], ox = kind === 'estadio' ? 1 : 2;
    ctx.fillStyle = ctx.createPattern(tex.alley, 'repeat'); ctx.fillRect(x + ox * T, y + T, d[0] * T, d[1] * T);
    if (kind === 'estadio') return;
    const lt = y + (1 + d[1]) * T + 0;
    ctx.fillStyle = ctx.createPattern(tex.asphalt, 'repeat'); ctx.fillRect(x, lt, w, y + h - lt); ctx.fillStyle = 'rgba(15,10,30,0.25)'; ctx.fillRect(x, lt, w, y + h - lt);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let k = 0; k < 15; k++) { ctx.fillRect(x + 20 + k * 40, lt + 16, 2, 46); ctx.fillRect(x + 20 + k * 40, y + h - 70, 2, 46); }
    if (kind === 'hospital') { ctx.fillStyle = 'rgba(217,54,62,0.7)'; ctx.fillRect(x + 7 * T, lt + 6, 6 * T, 4); ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.textAlign = 'center'; ctx.fillText('PRONTO-SOCORRO — AMBULÂNCIAS', x + 10 * T, lt + 100); ctx.textAlign = 'left'; }
    else { ctx.fillStyle = 'rgba(80,120,255,0.8)'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.fillText('VIATURAS — ENTRADA DOS PRESOS', x + 10 * T, lt + 100); ctx.textAlign = 'left'; }
  };
  function drawPorto(ctx, blk) {
    const { x, y, w, h } = blk, fr = mulberry32(blk.bx * 53 + blk.by * 19 + 1);
    ctx.fillStyle = '#8d8f96'; ctx.fillRect(x, y, w, h); ctx.fillStyle = ctx.createPattern(tex.paving, 'repeat'); ctx.globalAlpha = 0.35; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
    ctx.fillStyle = ctx.createPattern(tex.water, 'repeat'); ctx.fillRect(x + 12 * T, y, 8 * T, h);
    ctx.fillStyle = '#3d4a3b'; ctx.fillRect(x + 12 * T - 8, y, 10, h); ctx.fillStyle = '#c8c8d0'; ctx.fillRect(x + 12 * T - 2, y, 3, h);
    for (let k = 0; k < 20; k++) { ctx.fillStyle = 'rgba(180,220,255,0.12)'; ctx.fillRect(x + 12 * T + 10 + (k * 37) % (7 * T), y + (k * 53) % h, 24, 2); }
    const cc = ['#c0392b', '#2a6ab8', '#e0a02a', '#3a8a4a', '#8a4a9a'];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 2; c++) { if (fr() < 0.25) continue; const px = x + 9 * T + c * 44, py = y + 1.4 * T + r * 2.4 * T + (blk.by % 2) * 10; ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(px + 4, py + 5, 34, 54); const col = cc[Math.floor(fr() * 5)]; ctx.fillStyle = col; ctx.fillRect(px, py, 34, 54); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(px, py, 34, 3); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; for (let q = 4; q < 34; q += 5) { ctx.beginPath(); ctx.moveTo(px + q, py + 3); ctx.lineTo(px + q, py + 54); ctx.stroke(); } }
    ctx.fillStyle = '#d8b02a'; ctx.fillRect(x + 11.2 * T, y + 9 * T, 3, 90); ctx.fillRect(x + 11.2 * T, y + 9 * T, 78, 5); ctx.fillStyle = '#c0392b'; ctx.fillRect(x + 11.2 * T + 70, y + 9 * T + 5, 8, 26);
    if (blk.by === 3) { ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.fillText('CAIS — BALSA PARA A ILHA', x + 5.4 * T, y + 9.3 * T); ctx.textAlign = 'left'; }
  }
  function drawMansaoGround(ctx, blk) {
    const { x, y, w, h } = blk;
    const TAU = Math.PI * 2;
    const cx = x + w / 2;
    const gateY = y + h;
    const fontY = y + 448;
    const porticoY = y + 328;
    const heliX = x + 130, heliY = y + 448;
    const poolX = x + 490, poolY = y + 448;

    // 1. Gramado nobre esmeralda exuberante da propriedade
    ctx.fillStyle = ctx.createPattern(tex.grass, 'repeat');
    ctx.fillRect(x, y, w, h);
    // Faixas suaves de corte de grama profissional
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let yy = 0, k = 0; yy < h; yy += 24, k++) {
      if (k % 2 === 0) ctx.fillRect(x, y + yy, w, 24);
    }

    // Helper: Desenho de piso de tijolinhos nobres terracota com amarração e guia de mármore
    const drawNobleBrickRect = (bx, by, bw, bh, vert) => {
      ctx.fillStyle = '#9e4230';
      ctx.fillRect(bx, by, bw, bh);
      // Textura suave de tijolos com frisos escuros
      ctx.strokeStyle = 'rgba(50,18,10,0.30)';
      ctx.lineWidth = 1;
      const step = 8;
      for (let py = by; py < by + bh; py += step) {
        ctx.beginPath(); ctx.moveTo(bx, py); ctx.lineTo(bx + bw, py); ctx.stroke();
        const row = Math.floor((py - by) / step);
        const shift = (row % 2) * 8;
        for (let px = bx + shift; px < bx + bw; px += 16) {
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + step); ctx.stroke();
        }
      }
      // Meio-fio de mármore claro / cantaria travertino
      ctx.fillStyle = '#dfd8c8';
      if (vert) {
        ctx.fillRect(bx - 3, by, 3, bh);
        ctx.fillRect(bx + bw, by, 3, bh);
      } else {
        ctx.fillRect(bx, by - 3, bw, 3);
        ctx.fillRect(bx, by + bh, bw, 3);
      }
    };

    // 2. Alameda de Entrada Sul (de tijolos nobres, 96px de largura)
    drawNobleBrickRect(cx - 48, fontY + 50, 96, (gateY - fontY - 40), true);

    // 3. Alameda Norte (Conexão da Rotatória até o Portiqueiro da Mansão)
    drawNobleBrickRect(cx - 52, porticoY, 104, fontY - porticoY - 40, true);

    // 4. Alameda Oeste (Conexão até o Heliponto e Golfe)
    drawNobleBrickRect(heliX + 40, fontY - 26, (cx - 48) - (heliX + 40), 52, false);

    // 5. Alameda Leste (Conexão até o Deck da Piscina)
    drawNobleBrickRect(cx + 48, fontY - 26, (poolX - 60) - (cx + 48), 52, false);

    // 6. Rotatória Circular de Tijolos Nobres ao redor da Fonte
    ctx.save();
    ctx.fillStyle = '#9e4230';
    ctx.beginPath(); ctx.arc(cx, fontY, 76, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#dfd8c8'; ctx.lineWidth = 3.5; ctx.stroke();
    // Padrão circular de calçamento de pedras/tijolos
    ctx.strokeStyle = 'rgba(50,18,10,0.30)'; ctx.lineWidth = 1;
    for (let r = 44; r < 76; r += 8) {
      ctx.beginPath(); ctx.arc(cx, fontY, r, 0, TAU); ctx.stroke();
    }
    // Ilha central de gramado da rotatória
    ctx.fillStyle = '#3a8030';
    ctx.beginPath(); ctx.arc(cx, fontY, 40, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#dfd8c8'; ctx.lineWidth = 2.5; ctx.stroke();
    // Borda de flores na rotatória (rosas vermelhas e amarelas)
    for (let a = 0; a < TAU; a += 0.4) {
      const fx = cx + Math.cos(a) * 36, fy = fontY + Math.sin(a) * 36;
      ctx.fillStyle = (Math.sin(a * 4) > 0 ? '#e53935' : '#fbc02d');
      ctx.beginPath(); ctx.arc(fx, fy, 3, 0, TAU); ctx.fill();
    }

    // Fonte de mármore clássico no centro
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath(); ctx.arc(cx, fontY, 26, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 2; ctx.stroke();
    // Espelho d'água azul turquesa cristalino
    ctx.fillStyle = '#00bcd4';
    ctx.beginPath(); ctx.arc(cx, fontY, 22, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.arc(cx - 5, fontY - 5, 8, 0, TAU); ctx.fill();
    // Pedestal central com estátua e repuxo dourado
    ctx.fillStyle = '#b0bec5'; ctx.beginPath(); ctx.arc(cx, fontY, 9, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(cx, fontY, 5, 0, TAU); ctx.fill();
    ctx.restore();

    // 7. Grande Deck e Piscina Olímpica de Luxo
    ctx.save();
    // Deck de mármore travertino
    ctx.fillStyle = '#ece8dc';
    ctx.fillRect(poolX - 70, poolY - 55, 140, 110);
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 1.5;
    ctx.strokeRect(poolX - 70, poolY - 55, 140, 110);
    // Borda de pastilhas azuis escuras
    ctx.fillStyle = '#0d47a1';
    ctx.fillRect(poolX - 60, poolY - 45, 120, 90);
    // Água cristalina com degradê aquático
    const gw = ctx.createLinearGradient(0, poolY - 42, 0, poolY + 42);
    gw.addColorStop(0, '#00e5ff');
    gw.addColorStop(0.5, '#00b0ff');
    gw.addColorStop(1, '#0288d1');
    ctx.fillStyle = gw;
    ctx.fillRect(poolX - 58, poolY - 43, 116, 86);
    // Raias olímpicas brancas no fundo da piscina
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.2;
    for (let ly = poolY - 26; ly <= poolY + 26; ly += 26) {
      ctx.beginPath(); ctx.moveTo(poolX - 54, ly); ctx.lineTo(poolX + 54, ly); ctx.stroke();
    }
    // Espreguiçadeiras no deck
    const drawLounger = (lx, ly) => {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(lx - 5, ly - 10, 10, 20);
      ctx.fillStyle = '#37474f'; ctx.fillRect(lx - 4, ly - 9, 8, 6);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.strokeRect(lx - 5, ly - 10, 10, 20);
    };
    drawLounger(poolX - 45, poolY - 48);
    drawLounger(poolX - 25, poolY - 48);
    drawLounger(poolX + 25, poolY - 48);
    drawLounger(poolX + 45, poolY - 48);
    ctx.restore();

    // 8. Heliponto Executivo da Máfia
    ctx.save();
    ctx.fillStyle = '#263238';
    ctx.beginPath(); ctx.arc(heliX, heliY, 46, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 3; ctx.stroke();
    // Círculo interno tracejado
    ctx.setLineDash([8, 6]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(heliX, heliY, 36, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    // Letra 'H' em relevo
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 34px Arial'; ctx.textAlign = 'center';
    ctx.fillText('H', heliX, heliY + 12); ctx.textAlign = 'left';
    ctx.restore();

    // 9. Muros Nobres de Alvenaria e Entrada Monumental com Pilares de Pedra
    ctx.save();
    const wallCol = '#8c2e1f', capCol = '#ded4c2';
    const drawWallSec = (wx, wy, ww, wh) => {
      ctx.fillStyle = wallCol; ctx.fillRect(wx, wy, ww, wh);
      ctx.fillStyle = capCol; ctx.fillRect(wx - 1, wy - 2, ww + 2, 3);
      ctx.strokeStyle = 'rgba(30,10,5,0.4)'; ctx.lineWidth = 0.8; ctx.strokeRect(wx, wy, ww, wh);
    };
    // Muro Sul (com vão livre de 104px para a entrada de carros no centro)
    drawWallSec(x + 10, gateY - 14, (cx - 52) - (x + 10), 10);
    drawWallSec(cx + 52, gateY - 14, (x + w - 10) - (cx + 52), 10);
    // Muros Oeste, Leste e Norte
    drawWallSec(x + 10, y + 10, 10, h - 24);
    drawWallSec(x + w - 20, y + 10, 10, h - 24);
    drawWallSec(x + 10, y + 10, w - 20, 10);

    // Pilares nobres nas bordas do portão
    const drawPillar = px => {
      ctx.fillStyle = '#7a2818'; ctx.fillRect(px - 9, gateY - 20, 18, 22);
      ctx.fillStyle = capCol; ctx.fillRect(px - 11, gateY - 23, 22, 4);
      ctx.fillRect(px - 11, gateY, 22, 4);
      // Luminária dourada no topo do pilar
      ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(px, gateY - 26, 4, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 1; ctx.stroke();
    };
    drawPillar(cx - 54);
    drawPillar(cx + 54);

    // Placa monumental montada no pilar esquerdo (sem atrapalhar a pista)
    ctx.fillStyle = '#111215'; ctx.fillRect(cx - 150, gateY - 28, 90, 18);
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 1.2; ctx.strokeRect(cx - 150, gateY - 28, 90, 18);
    ctx.fillStyle = '#ffd54f'; ctx.font = 'bold 8px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('⚜️ VILLA DEL DON ⚜️', cx - 105, gateY - 16); ctx.textAlign = 'left';

    // Casinhas de tijolos para os cães de guarda (dentro do pátio nas laterais)
    const drawDogHouse = (hx, hy) => {
      ctx.fillStyle = '#7a2818';
      ctx.fillRect(hx, hy, 28, 24);
      ctx.fillStyle = '#2a0e08';
      ctx.fillRect(hx + 7, hy + 8, 14, 16);
      ctx.fillStyle = '#a63e26';
      ctx.beginPath();
      ctx.moveTo(hx - 3, hy);
      ctx.lineTo(hx + 14, hy - 8);
      ctx.lineTo(hx + 31, hy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#3a120a'; ctx.lineWidth = 1; ctx.stroke();
    };
    drawDogHouse(cx - 120, gateY - 55);
    drawDogHouse(cx + 92, gateY - 55);

    ctx.restore();
  }

  const SEM_ANEL = { floresta: 1, bosque: 1, campo: 1, fazenda: 1, porto: 1, mansao_chefao: 1 };
  function drawBlockGround(ctx, blk, x0, y0, x1, y1) {
    const { x, y, w, h, kind } = blk;
    if (kind === 'river') {
      ctx.fillStyle = ctx.createPattern(tex.water, 'repeat'); ctx.fillRect(x, y, w, h);
      // reflexos
      ctx.fillStyle = 'rgba(180,220,255,0.10)';
      for (let k = 0; k < 70; k++) { const rx = x + ((k * 97) % w), ry = y + ((k * 61) % h); ctx.fillRect(rx, ry, 18, 2); }
      // profundidade: raso e claro perto das margens, fundo e escuro no meio
      const gd = ctx.createLinearGradient(x, 0, x + w, 0);
      gd.addColorStop(0, 'rgba(110,200,220,0.34)'); gd.addColorStop(0.16, 'rgba(110,200,220,0.04)'); gd.addColorStop(0.5, 'rgba(0,10,70,0.26)'); gd.addColorStop(0.84, 'rgba(110,200,220,0.04)'); gd.addColorStop(1, 'rgba(110,200,220,0.34)');
      ctx.fillStyle = gd; ctx.fillRect(x, y, w, h);
      const rg = mulberry32(blk.bx * 31 + blk.by * 7 + 5);
      // correnteza: fios claros ondulados
      ctx.lineCap = 'round';
      for (let k = 0; k < 28; k++) {
        const sx = x + 30 + rg() * (w - 60), sy = y + rg() * h, len = 60 + rg() * 110; ctx.strokeStyle = 'rgba(200,238,255,' + (0.10 + rg() * 0.12) + ')'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.bezierCurveTo(sx + 12, sy + len * 0.3, sx - 12, sy + len * 0.7, sx + 4, sy + len); ctx.stroke();
      }
      // vitórias-régias com flor, pedras e juncos nas margens
      for (let k = 0; k < 12; k++) {
        const px = x + 26 + rg() * 60 + (rg() < 0.5 ? 0 : w - 112), py = y + rg() * h;
        ctx.fillStyle = '#2f7a3a'; ctx.beginPath(); ctx.ellipse(px, py, 9, 7, rg() * 3, 0.3, 6); ctx.fill(); ctx.fillStyle = '#4aa050'; ctx.beginPath(); ctx.ellipse(px - 1, py - 1, 6, 4, 0, 0, 7); ctx.fill();
        if (rg() < 0.45) { ctx.fillStyle = '#f2a0c0'; ctx.beginPath(); ctx.arc(px + 1, py, 2.6, 0, 7); ctx.fill(); ctx.fillStyle = '#ffe070'; ctx.fillRect(px, py - 1, 2, 2); }
      }
      for (let k = 0; k < 44; k++) {
        const left = k % 2 === 0, px = left ? x + 11 + rg() * 12 : x + w - 11 - rg() * 12, py = y + rg() * h;
        if (rg() < 0.35) { ctx.fillStyle = 'rgba(0,0,20,0.3)'; ctx.beginPath(); ctx.ellipse(px + 2, py + 3, 8, 5, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#8a8f98'; ctx.beginPath(); ctx.ellipse(px, py, 7, 5, rg(), 0, 7); ctx.fill(); ctx.fillStyle = '#b6bbc4'; ctx.beginPath(); ctx.ellipse(px - 2, py - 1.5, 3.5, 2, 0, 0, 7); ctx.fill(); }
        else { ctx.strokeStyle = '#3f8a3a'; ctx.lineWidth = 1.6; for (let q = 0; q < 5; q++) { const a = -1.9 + q * 0.5; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * 11, py + Math.sin(a) * 11); ctx.stroke(); } if (rg() < 0.5) { ctx.fillStyle = '#7a4a22'; ctx.fillRect(px - 1, py - 15, 3, 8); } }
      }
      // muro de contenção de pedra com blocos e espuma
      for (const sd of [0, 1]) {
        const bxw = sd ? x + w - 12 : x;
        ctx.fillStyle = '#4a4f46'; ctx.fillRect(bxw, y, 12, h);
        for (let yy = y; yy < y + h; yy += 20) { ctx.fillStyle = (yy / 20) % 2 ? '#686e62' : '#5a6054'; ctx.fillRect(bxw + 1, yy + 1, 10, 18); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(bxw + 1, yy + 1, 10, 2); }
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(sd ? bxw - 3 : bxw + 12, y, 3, h);
      }
      return;
    }
    if (SEM_ANEL[kind]) {
      if (kind === 'mansao_chefao') drawMansaoGround(ctx, blk); else if (kind === 'porto') drawPorto(ctx, blk); else G.rural.desenhaBloco(ctx, blk, tex, x0, y0, x1, y1, AR.drawQuintal);
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
    for (let k = 0; k < 110; k++) { ctx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(120,90,40,0.10)'; ctx.fillRect(x + Math.floor(r() * BLOCK) * T + 1, y + Math.floor(r() * BLOCK) * T + 1, T - 2, T - 2); }
    // manchas, rachaduras e chicletes
    for (let k = 0; k < 70; k++) {
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

    (MIOLO[kind] || MIOLO.city)(ctx, blk);
  }
  function drawTree(ctx, t) { if (t.mata) G.rural.drawTree(ctx, t); else drawTreeCity(ctx, t); }
  function drawTreeCity(ctx, t) {
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

  // rastros de pneu e faixas das ruas, trecho por trecho (as ruas apagadas da floresta não ganham marcas)
  function drawMarcas(ctx, x0, y0, x1, y1) {
    const R2 = ROAD / 2 * T, ruralV = (i, s) => !urbano(i, s) && !urbano(i, s + 1), ruralH = (j, s) => !urbano(s, j) && !urbano(s + 1, j);
    ctx.save(); ctx.strokeStyle = 'rgba(30,20,60,0.10)'; ctx.lineWidth = 5;
    for (let i = 0; i <= COLS; i++) {
      const xl = roadLeft(i); if (xl + ROAD * T < x0 - 8 || xl > x1 + 8) continue;
      for (let s = 0; s < ROWS; s++) {
        if (!viaV(i, s) || ruralV(i, s)) continue;
        const ya = nodeY(s) - R2, yb = nodeY(s + 1) + R2; if (yb < y0 - 8 || ya > y1 + 8) continue;
        for (const off of [1.4, 2.6, 5.4, 6.6]) { const xx = xl + off * T; ctx.beginPath(); ctx.moveTo(xx, Math.max(ya, y0)); ctx.lineTo(xx, Math.min(yb, y1)); ctx.stroke(); }
      }
    }
    for (let j = 0; j <= ROWS; j++) {
      const yt = roadTop(j); if (yt + ROAD * T < y0 - 8 || yt > y1 + 8) continue;
      for (let s = 0; s < COLS; s++) {
        if (!viaH(j, s) || ruralH(j, s)) continue;
        const xa = nodeX(s) - R2, xb = nodeX(s + 1) + R2; if (xb < x0 - 8 || xa > x1 + 8) continue;
        for (const off of [1.4, 2.6, 5.4, 6.6]) { const yy = yt + off * T; ctx.beginPath(); ctx.moveTo(Math.max(xa, x0), yy); ctx.lineTo(Math.min(xb, x1), yy); ctx.stroke(); }
      }
    }
    ctx.restore();
    drawRoadDetail(ctx, x0, y0, x1, y1);
    const cruzV = (i, j) => viaH(j, i - 1) || viaH(j, i), cruzH = (i, j) => viaV(i, j - 1) || viaV(i, j);   // existe rua cruzando o nó?
    // ruas verticais
    for (let i = 0; i <= COLS; i++) {
      const cx = nodeX(i); if (cx < x0 - 40 || cx > x1 + 40) continue;
      for (let j = 0; j < ROWS; j++) {
        if (!viaV(i, j)) continue;
        if (!ruralV(i, j)) {   // cidade: tracejado amarelo que para antes do cruzamento
          ctx.fillStyle = '#f2c231';
          const ya = nodeY(j) + (ROAD / 2 + 1.4) * T, yb = nodeY(j + 1) - (ROAD / 2 + 1.4) * T;
          for (let yy = ya; yy < yb - 30; yy += 96) if (yy + 56 > y0 && yy < y1) ctx.fillRect(cx - 3, yy, 6, 56);
        } else {               // estrada: linha dupla contínua e bordas brancas
          const ya = cruzH(i, j) ? nodeY(j) + R2 + 20 : nodeY(j) - R2, yb = cruzH(i, j + 1) ? nodeY(j + 1) - R2 - 20 : nodeY(j + 1) + R2;
          if (yb < y0 || ya > y1) continue; const a = Math.max(ya, y0), b = Math.min(yb, y1);
          ctx.fillStyle = '#f2c231'; ctx.fillRect(cx - 5, a, 3, b - a); ctx.fillRect(cx + 2, a, 3, b - a);
          const xl = roadLeft(i); ctx.fillStyle = 'rgba(240,240,240,0.85)'; ctx.fillRect(xl + 14, a, 3, b - a); ctx.fillRect(xl + ROAD * T - 17, a, 3, b - a);
        }
      }
    }
    // ruas horizontais
    for (let j = 0; j <= ROWS; j++) {
      const cy = nodeY(j); if (cy < y0 - 40 || cy > y1 + 40) continue;
      for (let i = 0; i < COLS; i++) {
        if (!viaH(j, i)) continue;
        const xa0 = nodeX(i), xb0 = nodeX(i + 1); if (xb0 < x0 - 100 || xa0 > x1 + 100) continue;
        if (!ruralH(j, i)) {
          ctx.fillStyle = '#f2c231';
          const xa = xa0 + (ROAD / 2 + 1.4) * T, xb = xb0 - (ROAD / 2 + 1.4) * T;
          for (let xx = xa; xx < xb - 30; xx += 96) if (xx + 56 > x0 && xx < x1) ctx.fillRect(xx, cy - 3, 56, 6);
        } else {
          const xa = cruzV(i, j) ? xa0 + R2 + 20 : xa0 - R2, xb = cruzV(i + 1, j) ? xb0 - R2 - 20 : xb0 + R2;
          if (xb < x0 || xa > x1) continue; const a = Math.max(xa, x0), b = Math.min(xb, x1);
          ctx.fillStyle = '#f2c231'; ctx.fillRect(a, cy - 5, b - a, 3); ctx.fillRect(a, cy + 2, b - a, 3);
          const yt = roadTop(j); ctx.fillStyle = 'rgba(240,240,240,0.85)'; ctx.fillRect(a, yt + 14, b - a, 3); ctx.fillRect(a, yt + ROAD * T - 17, b - a, 3);
        }
      }
    }
  }

  function drawStatic(ctx, x0, y0, x1, y1) {
    const hit = (x, y, w, h) => x < x1 && x + w > x0 && y < y1 && y + h > y0;
    // 1) fundo (borda do mapa)
    ctx.fillStyle = ctx.createPattern(tex.rim, 'repeat'); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    // calçada externa
    const ox = (MG - 2) * T, oy = (MG - 2) * T, ow = (INNER_W + 4) * T, oh = (INNER_H + 4) * T;
    if (hit(ox, oy, ow, oh)) {
      rrect(ctx, ox, oy, ow, oh, 60); ctx.fillStyle = '#ece1a2'; ctx.fill();
      ctx.save(); rrect(ctx, ox, oy, ow, oh, 60); ctx.clip();
      ctx.strokeStyle = 'rgba(150,130,70,0.45)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let gx = Math.max(ox, Math.floor(x0 / T) * T); gx <= Math.min(ox + ow, x1); gx += T) { ctx.moveTo(gx + 0.5, Math.max(oy, y0)); ctx.lineTo(gx + 0.5, Math.min(oy + oh, y1)); }
      for (let gy = Math.max(oy, Math.floor(y0 / T) * T); gy <= Math.min(oy + oh, y1); gy += T) { ctx.moveTo(Math.max(ox, x0), gy + 0.5); ctx.lineTo(Math.min(ox + ow, x1), gy + 0.5); }
      ctx.stroke(); ctx.restore();
    }
    // 2) asfalto das ruas
    const rx0 = MG * T, ry0 = MG * T, rh = INNER_H * T, rw = INNER_W * T;
    if (hit(rx0, ry0, rw, rh)) { ctx.fillStyle = ctx.createPattern(tex.asphalt, 'repeat'); ctx.fillRect(Math.max(rx0, x0), Math.max(ry0, y0), Math.min(rx0 + rw, x1) - Math.max(rx0, x0), Math.min(ry0 + rh, y1) - Math.max(ry0, y0)); }
    // 3) marcas nas ruas
    drawMarcas(ctx, x0, y0, x1, y1);
    // 4) faixas de pedestre (só nas cidades)
    ctx.fillStyle = 'rgba(245,245,245,0.92)';
    crossings.forEach(c => {
      const cx = c.x * T, cy = c.y * T, cw = c.w * T, ch = c.h * T;
      if (!hit(cx, cy, cw, ch)) return;
      const cr = mulberry32(Math.floor(cx * 3 + cy * 5)), tinta = () => { ctx.fillStyle = 'rgba(' + (236 + cr() * 14 | 0) + ',' + (236 + cr() * 14 | 0) + ',' + (236 + cr() * 10 | 0) + ',' + (0.55 + cr() * 0.4) + ')'; };
      if (c.dir === 'h') { for (let xx = cx + 6; xx < cx + cw - 6; xx += 16) { tinta(); ctx.fillRect(xx, cy + 4, 9, ch - 8); } }
      else { for (let yy = cy + 6; yy < cy + ch - 6; yy += 16) { tinta(); ctx.fillRect(cx + 4, yy, cw - 8, 9); } }
    });
    // 4b) chão das florestas gigantes (cobre as ruas apagadas)
    MEGAS.forEach(m => { if (hit(m.x, m.y, m.w, m.h)) G.rural.chaoMata(ctx, m, tex, x0, y0, x1, y1); });
    // 5) quadras (chão) e objetos de calçada
    blocks.forEach(b => { if (hit(b.x - 8, b.y - 8, b.w + 16, b.h + 16)) drawBlockGround(ctx, b, x0, y0, x1, y1); });
    blocks.forEach(b => { if (!SEM_PROPS[b.kind] && hit(b.x - 8, b.y - 8, b.w + 16, b.h + 16)) drawProps(ctx, b); });
    // 6) pontes (e água nas ruas sem ponte): proteção e pilares
    rios.forEach(rv => {
      if (!hit(rv.x - 40, rv.y, rv.w + 80, rv.h)) return;
      for (let j = 0; j <= ROWS; j++) {
        const by = roadTop(j), bx = rv.x;
        if (!hit(bx, by - (BR_S + 4) * T, rv.w, (ROAD + 2 * BR_S + 8) * T)) continue;
        if (!temPonte(rv.bx, j)) {
          ctx.fillStyle = ctx.createPattern(tex.water, 'repeat'); ctx.fillRect(bx, by, rv.w, ROAD * T);
          ctx.fillStyle = 'rgba(180,220,255,0.10)'; for (let k = 0; k < 22; k++) ctx.fillRect(bx + ((k * 97) % rv.w), by + ((k * 41) % (ROAD * T)), 18, 2);
          ctx.fillStyle = '#3d4a3b'; ctx.fillRect(bx, by, 10, ROAD * T); ctx.fillRect(bx + rv.w - 10, by, 10, ROAD * T);
          ctx.fillStyle = '#6f7d6a'; ctx.fillRect(bx + 8, by, 3, ROAD * T); ctx.fillRect(bx + rv.w - 11, by, 3, ROAD * T);
          continue;
        }
        drawBridge(ctx, bx, by, rv.w, ROAD * T, { main: ehPrincipal(rv.bx) });
      }
    });
    // 7) sombras (mais compridas nos prédios mais altos) e telhados
    const vis = buildings.filter(b => { const bb = b.box || b; return hit(bb.x - 6, bb.y - 6, bb.w + 70, bb.h + 70); });
    vis.forEach(b => {
      const bb = b.box || b, rects = b.rects || [b], k = Math.max(1, b.andares || 1), off = Math.min(48, 12 + k * 5);
      ctx.save();
      ctx.beginPath(); ctx.rect(bb.x - 60, bb.y - 60, bb.w + 180, bb.h + 180); ctx.clip();
      ctx.shadowColor = 'rgba(0,0,12,0.55)'; ctx.shadowBlur = 16; ctx.shadowOffsetX = off; ctx.shadowOffsetY = off + 2;
      ctx.fillStyle = '#000'; rects.forEach(r => ctx.fillRect(r.x + 4, r.y + 4, r.w - 4, r.h - 4));
      ctx.restore();
    });
    vis.forEach(b => drawRoof(ctx, b));
    // 8) árvores e postes
    trees.forEach(t => { if (t.x > x0 - 50 && t.x < x1 + 50 && t.y > y0 - 50 && t.y < y1 + 50) drawTree(ctx, t); });
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
    if (preN >= PRE.length) return 1;
    for (let k = 0; k < (n || 16) && preN < PRE.length; k++, preN++) {
      try { pegaChunk(PRE[preN][0], PRE[preN][1], true); } catch (e) { }
    }
    return preN >= PRE.length ? 1 : preN / PRE.length;
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
  // mapa pequeno (minimapa): pintado direto dos tiles, bem rápido (o mapa é enorme)
  function makeMini(scale) {
    const cw = Math.ceil(W / scale), ch = Math.ceil(H / scale);
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const x = c.getContext('2d'), im = x.createImageData(cw, ch), d = im.data;
    const cor = { 0: [74, 69, 96], 6: [74, 69, 96], 5: [138, 138, 160], 1: [216, 207, 150], 2: [106, 90, 88], 3: [63, 127, 55], 4: [58, 106, 176], 7: [122, 122, 134] };
    for (let py = 0; py < ch; py++) {
      const ty = Math.min(TH - 1, Math.floor(py * scale / T));
      for (let px = 0; px < cw; px++) {
        const t = tiles[ty * TW + Math.min(TW - 1, Math.floor(px * scale / T))], k = cor[t] || [0, 0, 0], i = (py * cw + px) * 4;
        d[i] = k[0]; d[i + 1] = k[1]; d[i + 2] = k[2]; d[i + 3] = 255;
      }
    }
    x.putImageData(im, 0, 0);
    buildings.forEach(b => { x.fillStyle = b.p.base; (b.rects || [b]).forEach(r => x.fillRect(r.x / scale, r.y / scale, Math.max(1, r.w / scale), Math.max(1, r.h / scale))); });
    x.fillStyle = 'rgba(15,60,18,0.8)'; trees.forEach(t => { const r = Math.max(1.2, t.r / scale * 0.8); x.fillRect(t.x / scale - r, t.y / scale - r, r * 2, r * 2); });
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
    if (SEM_PROPS[b.kind]) return;
    ['top', 'bottom', 'left', 'right'].forEach(s => { if (b.kind === 'mercado' && s === 'bottom') return; [0.3, 0.7].forEach(t => spots.push(sidePoint(b.bx, b.by, s, t))); });
  });

  G.world = {
    drawBridge, drawBridgeHigh, preparaPonte, BR_S,
    T, ROAD, BLOCK, PITCH, COLS, ROWS, MG, TW, TH, W, H, RIVER, RIVERS, PONTES, CIDADES, lotes, cruzaOk, temPonte, mkBuilding, drawRoof, drawTree, shade, TILE, tiles, blocks, buildings, trees, lamps, fachada, manholes, drawWaterFx, places, propList,
    roadLeft, roadTop, nodeX, nodeY, laneV, laneH, tileAt, isSolid, treeHit, isRoadTile, pedWalkable,
    fechado: new Set(),      // ruas interditadas por obra: 'v<rua>:<trecho>' ou 'h<rua>:<trecho>' (governo.js preenche)
    buildSome, drawChunks, makeMini, hospitais,  sidePoint, spots, rrect, mulberry32, casas, mercados, lojas, gerarLojas, LOJAS_DEF,
    chunkCount: NCX * NCY,
    RODOVIA, MEGAS, trilhas, urbano, viaH, viaV, regiaoDe, PUB_DIMS, naTrilha, megaDe,
    AR, tex, criaCasaB, casaNoLote, sorteiaParede, estiloDe,
  };
  if (G.rural) G.rural.trilhas = trilhas;
})(window.G = window.G || {});
