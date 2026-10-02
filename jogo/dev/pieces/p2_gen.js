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
    const q = hash2(bx, by, 5), viz = (bx > 0 && hash2(bx - 1, by, 5) < 0.22) || (by > 0 && hash2(bx, by - 1, 5) < 0.22);
    if (q < 0.22 && !viz) return 'fazenda';      // fazendas de bilionário (nunca coladas uma na outra)
    if (q > 0.88) return 'bosque';
    return 'campo';
  }
  function kindDe(bx, by) {
    if (RIVERS.includes(bx)) return 'river';
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
  function montaCasaB(blk, lay, ox, oy, seed, est, rg) {
    const c3 = AR.casaMontar(lay, ox, oy, seed, est), cp = c3.partes.find(p => p.t === 'corpo');
    const b = mkBuilding(cp.x, cp.y, cp.w, cp.h, 3, rg);
    b.p = { kind: 'tile', base: c3.pal.base, edge: c3.pal.claro, dark: c3.pal.escuro };
    b.det = []; b.casa3 = c3; b.est = est; b.box = AR.casaCaixa(c3);
    b.custom = (ctx, bb) => AR.drawCasa(ctx, bb);
    b.rects = c3.partes.map(p => ({ x: p.x, y: p.y, w: p.w, h: p.h, and: p.andares }));
    b.andares = Math.max.apply(null, c3.partes.map(p => p.andares));
    buildings.push(b);
    return b;
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
