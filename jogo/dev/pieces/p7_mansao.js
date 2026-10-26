  // ======================================================================
  // MANSÃO DO CHEFÃO — a mansão do jogador, estilo máfia, no meio da MATA ESCURA (longe da cidade).
  // Um terreno gigante (3 x 2 quadras = 76 x 48 tiles) com muro de pedra, portão grande com seguranças, alameda de ciprestes,
  // rotatória com fonte, a mansão ao fundo, piscina, quadra, heliponto e garagem. A estrada particular liga o portão à rodovia.
  // (tudo em "tiles locais" u,v: u = coluna e v = linha dentro do terreno; mu(u) / mv(v) convertem para pixels)
  // ======================================================================
  const MANSAO = { bx0: 15, bx1: 17, by0: 2, by1: 3, nome: 'VILLA BELLAROSA', pronta: false };
  MANSAO.tx0 = MG + MANSAO.bx0 * PITCH + ROAD; MANSAO.ty0 = MG + MANSAO.by0 * PITCH + ROAD;
  MANSAO.tx1 = MG + (MANSAO.bx1 + 1) * PITCH; MANSAO.ty1 = MG + (MANSAO.by1 + 1) * PITCH;
  MANSAO.x = MANSAO.tx0 * T; MANSAO.y = MANSAO.ty0 * T; MANSAO.w = (MANSAO.tx1 - MANSAO.tx0) * T; MANSAO.h = (MANSAO.ty1 - MANSAO.ty0) * T;
  const mu = u => (MANSAO.tx0 + u) * T, mv = v => (MANSAO.ty0 + v) * T;
  MANSAO.mu = mu; MANSAO.mv = mv;
  MANSAO.rodoviaY = (MG + RODOVIA * PITCH) * T;                       // topo da rodovia
  MANSAO.estrada = { x: mu(35), y: MANSAO.y + MANSAO.h, w: 6 * T, y1: MANSAO.rodoviaY };   // estrada particular (fora do muro) até a rodovia
  MANSAO.portao = { x: mu(38), y: mv(47.5), w: 6 * T, u0: 35, u1: 41 };                      // centro do portão (vão de 6 tiles no muro sul)
  MANSAO.rot = { u: 38, v: 30, R: 7, r: 4, fonte: 2.4 };                                     // rotatória (centro e raios em tiles)
  MANSAO.paredes = [                                                                          // muros (tiles locais)
    { u: 0, v: 0, w: 76, h: 1 }, { u: 0, v: 47, w: 35, h: 1 }, { u: 41, v: 47, w: 35, h: 1 }, { u: 0, v: 1, w: 1, h: 46 }, { u: 75, v: 1, w: 1, h: 46 }
  ];
  MANSAO.torres = [[0, 0], [73, 0], [0, 45], [73, 45]];                                       // torres de vigia nos cantos (3x3 tiles)
  MANSAO.lote = { u: 21, v: 8, w: 34, d: 13 };                                                // onde fica a mansão
  MANSAO.garagem = { u: 5, v: 24, w: 12, h: 5 };
  MANSAO.guarita = { u: 43, v: 42, w: 4, h: 4 };
  MANSAO.piscina = { u: 30, v: 3, w: 16, h: 5 };
  MANSAO.heli = { u: 60, v: 26, w: 10, h: 10 };
  MANSAO.quadra = { u: 4, v: 3, w: 18, h: 10 };
  const dentroMansao = (bx, by) => bx >= MANSAO.bx0 && bx <= MANSAO.bx1 && by >= MANSAO.by0 && by <= MANSAO.by1;
  // a floresta não cresce no terreno, nem 3 tiles em volta dele, nem na estrada particular
  const naMansao = (px, py, pad) => {
    pad = (pad == null ? 3 : pad) * T;
    if (px > MANSAO.x - pad && px < MANSAO.x + MANSAO.w + pad && py > MANSAO.y - pad && py < MANSAO.y + MANSAO.h + pad) return true;
    const e = MANSAO.estrada; return px > e.x - pad && px < e.x + e.w + pad && py > e.y - pad && py < e.y1 + pad;
  };

  function construirMansao(blk) {
    if (MANSAO.pronta) return; MANSAO.pronta = true;
    const R = (u, v, w, h, t) => setRect(MANSAO.tx0 + u, MANSAO.ty0 + v, w, h, t);
    const rr = mulberry32(777);
    // 1) caminhos livres (estrada particular, rotatória, calçada da frente, garagem, heliponto)
    setRect(Math.floor(MANSAO.estrada.x / T), MANSAO.ty1, 6, Math.round((MANSAO.rodoviaY - MANSAO.ty1 * T) / T), TILE.LOT);
    R(35, 36, 6, 11, TILE.LOT);                                                                   // alameda reta do portão até a rotatória
    const ro = MANSAO.rot;
    for (let v = 0; v < 48; v++) for (let u = 0; u < 76; u++) { const d = Math.hypot(u + 0.5 - ro.u, v + 0.5 - ro.v); if (d <= ro.R && d >= ro.r) R(u, v, 1, 1, TILE.LOT); }
    R(28, 20, 21, 4, TILE.LOT);                                                                   // pátio em frente à mansão
    R(33, 23, 11, 3, TILE.LOT);                                                                   // liga a rotatória ao pátio
    R(17, 29, 14, 3, TILE.LOT); R(5, 29, 12, 3, TILE.LOT);                                       // pista até a garagem
    R(MANSAO.heli.u, MANSAO.heli.v, MANSAO.heli.w, MANSAO.heli.h, TILE.LOT);
    // 2) muros, torres, pilares do portão: sólidos
    MANSAO.paredes.forEach(p => R(p.u, p.v, p.w, p.h, TILE.BUILD));
    R(MANSAO.portao.u0, 47, 6, 1, TILE.LOT);                                                      // o vão do portão fica livre (o portão é aberto/fechado por mansao.js)
    MANSAO.torres.forEach(([u, v]) => R(u, v, 3, 3, TILE.BUILD));
    R(33, 46, 2, 2, TILE.BUILD); R(41, 46, 2, 2, TILE.BUILD);                                     // pilares grandes do portão
    // 3) fonte e piscina (água = sólido)
    for (let v = 0; v < 48; v++) for (let u = 0; u < 76; u++) if (Math.hypot(u + 0.5 - ro.u, v + 0.5 - ro.v) < ro.fonte) R(u, v, 1, 1, TILE.WATER);
    const pi = MANSAO.piscina; R(pi.u, pi.v, pi.w, pi.h, TILE.WATER);
    // 4) edifícios
    const mk = (u, v, w, h, fh, draw, props) => {
      R(u, v, w, h, TILE.BUILD);
      const b = mkBuilding(mu(u) + 3, mv(v) + 3, w * T - 6, h * T - 6, 1, rr); b.det = []; b.andares = 1; b.fh = fh; b.mansaoParte = true; b.semJanelas = true; b.custom = draw;
      Object.assign(b, props || {}); buildings.push(b); return b;
    };
    MANSAO.torres.forEach(([u, v]) => mk(u, v, 3, 3, 64, (ctx, bb) => G.mansaoArte.torre(ctx, bb)));
    const gr = MANSAO.garagem; mk(gr.u, gr.v, gr.w, gr.h, 46, (ctx, bb) => G.mansaoArte.garagem(ctx, bb));
    const gu = MANSAO.guarita; mk(gu.u, gu.v, gu.w, gu.h, 38, (ctx, bb) => G.mansaoArte.guarita(ctx, bb));
    // 5) a mansão (custom: corpo central de 3 andares e duas alas), estilo "mafia" (tijolo escuro, telhado de ardósia, molduras claras)
    const L = MANSAO.lote, seed = 4242, rg = mulberry32(seed), est = 'mafia';
    const partes = [
      { t: 'corpo', x: 11, y: 3, w: 12, h: 7, andares: 3, teto: 'quatro', crista: 'h' },
      { t: 'ala', x: 3, y: 1, w: 8, h: 11, andares: 2, teto: 'quatro', crista: 'v' },
      { t: 'ala', x: 23, y: 1, w: 8, h: 11, andares: 2, teto: 'quatro', crista: 'v' }
    ];
    const lay = { tipo: 'mansao', partes, porta: 17, box: { x: 3, y: 1, w: 28, h: 11 }, corpo: partes[0], riqueza: 2, estilo: est, lado: 'e', garagem: null };
    partes[0].varanda = false;
    partes.forEach(p => R(L.u + p.x, L.v + p.y, p.w, p.h, TILE.BUILD));
    const ox = mu(L.u), oy = mv(L.v), b = montaCasaB(blk, lay, ox, oy, seed, est, rg); b.andares = 3; b.mansao = true; b.mafia = true;
    Object.assign(b.casa3, { porta: '#1a1410', toldo: ['#8a1c1c', '#f2ecdc'], veneziana: '#1f1a16', chamine: true, furtada: false });
    const c = addCasa(b, 140); c.rica = true; c.riqueza = 2; c.nome = 'VILLA BELLAROSA'; c.venda = false; c.estilo = est; c.mafia = true; c.preco = 0;
    MANSAO.casa = c; MANSAO.predio = b;
    // 6) árvores: ciprestes na alameda e carvalhos pelo campo (nada em cima de construções e caminhos)
    const livre = (u, v, m) => {
      m = m || 0;
      const nao = [[21 - m, 8 - m, 55 + m, 21 + m], [27 - m, 1 - m, 49 + m, 11 + m], [28 - m, 19 - m, 49 + m, 25 + m], [31 - m, 22 - m, 46 + m, 38 + m], [33 - m, 36 - m, 43 + m, 48 + m], [4 - m, 22 - m, 33 + m, 34 + m],
        [3 - m, 2 - m, 24 + m, 14 + m], [57 - m, 24 - m, 72 + m, 38 + m], [40 - m, 40 - m, 50 + m, 48 + m], [-1, -1, 77, 3], [-1, 45, 77, 49], [-1, -1, 3, 49], [73, -1, 77, 49]];
      return !nao.some(r => u > r[0] && u < r[2] && v > r[1] && v < r[3]);
    };
    for (let k = 0; k < 6; k++) for (const sx of [33.7, 42.3]) { const v = 38 + k * 1.6; if (v < 46) trees.push({ x: mu(sx), y: mv(v), r: 13, cipreste: true }); }   // alameda do portão
    for (let k = 0; k < 4; k++) for (const sx of [29.5, 46.5]) trees.push({ x: mu(sx), y: mv(24.5 + k * 1.2), r: 12, cipreste: true });                                  // ao lado do pátio
    for (let n = 0, t = 0; n < 90 && t < 900; t++) {
      const u = 2 + rr() * 72, v = 2 + rr() * 44;
      if (!livre(u, v, 1.5)) continue;
      if (trees.some(q => Math.hypot(q.x - mu(u), q.y - mv(v)) < 70 && q.x > MANSAO.x && q.x < MANSAO.x + MANSAO.w && q.y > MANSAO.y && q.y < MANSAO.y + MANSAO.h)) continue;
      trees.push({ x: mu(u), y: mv(v), r: 20 + rr() * 11 }); n++;
    }
    // 7) postes de luz (alameda, rotatória, pátio, portão e cantos)
    for (let v = 38; v <= 46; v += 4) lamps.push({ x: mu(34.4), y: mv(v) }, { x: mu(41.6), y: mv(v) });
    [[38, 22.2], [30, 22], [46, 22], [31, 30], [45, 30], [38, 23.5], [38, 36.6], [25, 30], [10, 26]].forEach(([u, v]) => lamps.push({ x: mu(u), y: mv(v) }));
    lamps.push({ x: mu(33.4), y: mv(45) }, { x: mu(42.6), y: mv(45) });
    MANSAO.torres.forEach(([u, v]) => lamps.push({ x: mu(u + 1.5), y: mv(v + 1.5) }));
    for (let u = 8; u < 70; u += 12) lamps.push({ x: mu(u), y: mv(1.6) });
    // pontos dos seguranças (usados por mansao.js): posto no portão, rondas e interior
    MANSAO.postos = {
      portao: [{ x: mu(36.2), y: mv(45.4) }, { x: mu(39.8), y: mv(45.4) }],
      alameda: [{ x: mu(34.6), y: mv(41) }, { x: mu(41.4), y: mv(41) }],
      frente: [{ x: mu(33), y: mv(22.2) }, { x: mu(43), y: mv(22.2) }],
      rondas: [
        [[mu(6), mv(4)], [mu(70), mv(4)], [mu(70), mv(20)], [mu(6), mv(20)]],
        [[mu(6), mv(44)], [mu(30), mv(44)], [mu(30), mv(34)], [mu(6), mv(34)]],
        [[mu(70), mv(44)], [mu(50), mv(44)], [mu(50), mv(34)], [mu(70), mv(34)]],
        [[mu(30), mv(14)], [mu(8), mv(14)], [mu(8), mv(40)], [mu(30), mv(40)]]
      ]
    };
  }
