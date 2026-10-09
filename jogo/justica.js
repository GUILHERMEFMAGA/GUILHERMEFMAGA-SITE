/* =====================================================================
   JUSTICA.JS — a prisão de verdade
     Preso na rua  →  algemas  →  caminhada até a viatura  →  banco de trás
     →  viagem até a DELEGACIA GERAL (grande, com recepção, celas e escrivão)
     →  sentença que depende do MAIOR nível de procurado que você atingiu:
          nível 1-3  fica na delegacia (paga fiança ou cumpre a pena na cela)
          nível 4    PENITENCIÁRIA SERRA DURA, muito longe da cidade
          nível 5    PRISÃO DE SEGURANÇA MÁXIMA na ILHA DO SILÊNCIO (ninguém foge de lá)
   Dentro da prisão: dormir passa os dias, bom comportamento (pátio, oficina) encurta a pena.
   ===================================================================== */
(function (G) {
  'use strict';
  const W = G.world, L = G.lugares, K = L.kit, SP = G.sprites, AI = G.ai;
  const O = K.O, rand = K.rand, clamp = K.clamp, pick = K.pick, TAU = Math.PI * 2, VW = K.VW, VH = K.VH;
  const J = G.justica = {};

  // ---------- a pena de cada nível ----------
  const NIVEIS = {
    1: { nome: 'DETENÇÃO', dias: 1, fianca: 0.05, perda: 0.08, onde: 'delegacia', crime: 'Perturbação e fuga' },
    2: { nome: 'DETENÇÃO', dias: 2, fianca: 0.10, perda: 0.12, onde: 'delegacia', crime: 'Roubo e fuga da polícia' },
    3: { nome: 'PRISÃO PROVISÓRIA', dias: 3, fianca: 0.15, perda: 0.18, onde: 'delegacia', crime: 'Roubo armado e resistência à prisão' },
    4: { nome: 'PENITENCIÁRIA', dias: 6, fianca: 0, perda: 0.30, onde: 'penitenciaria', crime: 'Crimes graves e confronto com a polícia' },
    5: { nome: 'SEGURANÇA MÁXIMA', dias: 12, fianca: 0, perda: 0.45, onde: 'ilha', crime: 'Inimigo público número 1' },
  };
  J.NIVEIS = NIVEIS;
  const LOCAIS = {
    penitenciaria: { id: 'penitenciaria', nome: 'PENITENCIÁRIA SERRA DURA', km: 480, cor: '#5a6070' },
    ilha: { id: 'ilha', nome: 'PRISÃO DE SEGURANÇA MÁXIMA — ILHA DO SILÊNCIO', km: 1200, cor: '#3a4048' },
  };
  const look = o => Object.assign(SP.randomLook(), { acc: 'none' }, o);
  const policial = o => look(Object.assign({ shirt: '#1c2f6b', cap: 'cop', pat: 'liso', sleeve: 'curta', fem: false }, o));
  const preso = o => look(Object.assign({ shirt: '#e8872a', pat: 'liso', sleeve: 'curta', hairStyle: 'raspado' }, o));
  const delegaciaPlace = () => W.places.find(p => p.tipo === 'delegacia');

  // ---------- nível máximo de procurado do episódio atual ----------
  J.atualizar = function (S) {
    if (S.heatLevel > 0) S.pico = Math.max(S.pico || 0, S.heatLevel);
    else if ((S.heat || 0) <= 0) S.pico = 0;        // despistou a polícia: a ficha "zera"
  };

  // =====================================================================
  //  1) A PRISÃO NA RUA
  // =====================================================================
  J.prender = function (S) {
    const P = S.player, nivel = clamp(Math.max(S.pico || 0, S.heatLevel || 0, 1), 1, 5);
    S.justica = { fase: 'algema', t: 0, nivel, van: null, cop: null };
    S.mode = 'preso'; S.modeT = 0; S.heat = 0; S.heatLevel = 0; S.bustT = 0; S.heli = null; S.pico = 0;
    P.vx = P.vy = 0; P.iframes = 999; P.escondido = false; P.hp = Math.max(P.hp, 40);
    // as viaturas da perseguição param ao redor de você
    S.cars.forEach(c => { if (c.kind === 'police' && !c.dead && (c.mode === 'chase' || c.mode === 'block' || c.mode === 'leave')) { c.mode = 'parked'; c.driver = 'none'; c.hb = true; c.thr = 0; c.steer = 0; c.cenaPrisao = true; c.siren = true; } });
    S.peds.forEach(p => { if (p.kind === 'cop') { p.cenaPrisao = true; p.state = 'walk'; p.armed = false; p.alvoMov = null; p.vx = p.vy = 0; } });
    // o policial que vai te acompanhar
    let cop = null, bd = 1e9;
    S.peds.forEach(p => { if (p.kind === 'cop' && !p.dead && p.state !== 'dead') { const d = Math.hypot(p.x - P.x, p.y - P.y); if (d < bd) { bd = d; cop = p; } } });
    if (!cop) cop = G.combat.makeCop(S, P.x + 26, P.y, 1);
    cop.script = true; cop.state = 'walk'; cop.cenaPrisao = true; S.justica.cop = cop;
    G.snd.fail(); G.banner('VOCÊ ESTÁ PRESO!', 'Mãos para trás. Você tem o direito de ficar calado.', true, 3);
  };

  // viatura nova, parada na rua mais perto de você (é ela que vai te levar)
  function chamaViatura(S) {
    const P = S.player; let pt = null;
    for (let k = 0; k < 8 && !pt; k++) pt = AI.randomRoadPoint(P.x, P.y, 50 + k * 14, 140 + k * 30, 60);
    if (!pt) return null;
    S.cars = S.cars.filter(o => o.kind === 'police' || Math.hypot(o.x - pt.x, o.y - pt.y) > 120);
    const c = new G.Car({ x: pt.x, y: pt.y, a: pt.a, kind: 'police', color: '#ffffff', driver: 'none', mode: 'parked', mass: 1.15 });
    c.siren = true; c.hb = true; c.pt = pt; c.cenaPrisao = true; c.vx = c.vy = 0;
    S.cars.push(c); return c;
  }

  const portaTraseira = c => ({ x: c.x + Math.cos(c.a) * (SP.CAR_W / 2 + 12) - c.fx * 10, y: c.y + Math.sin(c.a) * (SP.CAR_W / 2 + 12) - c.fy * 10 });
  const anda = (o, tx, ty, v, dt) => {
    const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy); if (d < 1) return 0;
    const st = Math.min(d, v * dt), nx = o.x + dx / d * st, ny = o.y + dy / d * st;
    if (!W.isSolid(nx, o.y)) o.x = nx; if (!W.isSolid(o.x, ny)) o.y = ny;
    o.h = (o.h || 0) + AI.wrap(Math.atan2(dy, dx) + Math.PI / 2 - (o.h || 0)) * Math.min(1, 10 * dt); o.walk = (o.walk || 0) + st * 0.2;
    return d;
  };

  // área de destino: porta da delegacia
  function destinoDelegacia() {
    const pl = delegaciaPlace(), T = W.T;
    let bi = 0, bj = 0, bd = 1e9;
    for (let i = 0; i <= W.COLS; i++) { const d = Math.abs(W.nodeX(i) - pl.x); if (d < bd) { bd = d; bi = i; } }
    bd = 1e9; for (let j = 0; j <= W.ROWS; j++) { const d = Math.abs(W.nodeY(j) - pl.y); if (d < bd) { bd = d; bj = j; } }
    return { i: bi, j: bj, x: pl.x, y: pl.y - 26, pl };
  }

  // roda a cena (modo 'preso') a cada quadro
  J.rodar = function (S, dt) {
    const J_ = S.justica, P = S.player; if (!J_) { S.mode = 'play'; return; }
    J_.t += dt; P.iframes = 999;
    const fase = J_.fase;
    if (fase === 'algema') {
      P.vx = P.vy = 0;
      if (J_.cop) anda(J_.cop, P.x + 24, P.y + 6, 80, dt);
      if (J_.t > 2) { J_.van = chamaViatura(S); J_.fase = 'escolta'; J_.t = 0; if (!J_.van) { J.cenaViagem(S, 'semviatura'); } G.say('O policial leva você até a viatura...', 3); }
    } else if (fase === 'escolta') {
      const c = J_.van; if (!c || c.dead) { J_.van = chamaViatura(S); return; }
      const dp = portaTraseira(c);
      const d = anda(P, dp.x, dp.y, 78, dt);
      if (J_.cop) anda(J_.cop, P.x - Math.cos((P.h || 0) - Math.PI / 2) * 22 + 6, P.y - Math.sin((P.h || 0) - Math.PI / 2) * 22, 82, dt);
      if (d < 14 || J_.t > 9) { J_.fase = 'embarque'; J_.t = 0; G.snd.door(); }
    } else if (fase === 'embarque') {
      if (J_.t > 0.7) {
        P.escondido = true; S.peds = S.peds.filter(p => !p.cenaPrisao);
        S.cars = S.cars.filter(c => !(c.cenaPrisao && c !== J_.van));
        const c = J_.van, d = destinoDelegacia(); J_.alvo = d;
        c.mode = 'prisao'; c.driver = 'ai'; c.hb = false; c.siren = true; c.ignoreLights = true; c.cruise = 270; c.max = 310;
        c.nav = AI.initNav(c.pt.axis, c.pt.idx, c.pt.dir, c.pt.along); c.nav.mode = 'goto'; c.nav.target = { i: d.i, j: d.j };
        J_.fase = 'viagem'; J_.t = 0; G.say('No banco de trás da viatura, a caminho da delegacia... (ESPAÇO: pular viagem)', 5);
      }
    } else if (fase === 'viagem') {
      const c = J_.van;
      if (!c || c.dead) { J_.fase = 'chegada'; J_.t = 0; return; }
      P.x = c.x; P.y = c.y;
      if (S.keysPulaViagem || J_.t > 80) { c.x = J_.alvo.x; c.y = J_.alvo.y + 60; c.vx = c.vy = 0; c.nav = null; J_.fase = 'chegada'; J_.t = 0; }
    } else if (fase === 'chegada') {
      const c = J_.van; if (c) { c.hb = true; c.thr = 0; P.x = c.x; P.y = c.y; }
      if (J_.t > 1.2) { J.entraDelegacia(S); }
    } else if (fase === 'cinema') {
      if (J_.t > J_.dur || (J_.t > 2 && S.keysPulaViagem)) { const cb = J_.cb; J_.cb = null; if (cb) cb(); }
    }
    S.keysPulaViagem = false;
  };

  // motorista da viatura (chamado por game.js quando mode === 'prisao')
  J.dirige = function (c, dt, S) {
    const J_ = S.justica;
    if (!J_ || J_.van !== c || !J_.alvo) { c.mode = 'parked'; c.driver = 'none'; c.hb = true; return; }
    const a = J_.alvo, d = Math.hypot(a.x - c.x, a.y - c.y);
    if (d < 380 && !c.final) { c.final = true; c.nav = null; }
    if (!c.final) { AI.driveTraffic(c, dt, S); return; }
    // aproximação final direto até a porta
    if (d < 62 || (c.finalT = (c.finalT || 0) + dt) > 14) { c.hb = true; c.thr = 0; c.steer = 0; if (J_.fase === 'viagem') { J_.fase = 'chegada'; J_.t = 0; } return; }
    const ang = Math.atan2(a.y - c.y, a.x - c.x), da = AI.wrap(ang - c.a), lim = d < 160 ? 70 : 150;
    c.hb = false; c.steer = clamp(da * 2.4, -1, 1); c.thr = c.speed < lim ? (Math.abs(da) > 1.2 ? 0.4 : 1) : -0.5;
  };

  // =====================================================================
  //  2) CINEMAS DE VIAGEM (estrada à noite, barco até a ilha, volta para casa)
  // =====================================================================
  J.cena = function (S, tipo, dur, cb) {
    S.mode = 'preso'; S.inside = null; S.prompt = '';
    S.justica = Object.assign(S.justica || {}, { fase: 'cinema', t: 0, dur, tipo, cb });
    S.player.escondido = true;
  };
  J.cenaViagem = function (S, tipo) { J.entraDelegacia(S); };

  J.desenhar = function (ctx, S) {
    const J_ = S.justica; if (!J_) return;
    const H = G.hud, t = J_.t;
    if (J_.fase === 'algema' || J_.fase === 'escolta' || J_.fase === 'embarque' || J_.fase === 'viagem' || J_.fase === 'chegada') {
      // barras de cinema + legenda
      ctx.fillStyle = '#000'; const h = 46 * Math.min(1, t * 2 + (J_.fase !== 'algema' ? 1 : 0)); ctx.fillRect(0, 0, VW, h); ctx.fillRect(0, VH - h, VW, h);
      const txt = { algema: 'ALGEMADO', escolta: 'A CAMINHO DA VIATURA', embarque: 'NO BANCO DE TRÁS', viagem: 'RUMO À DELEGACIA GERAL', chegada: 'DELEGACIA GERAL' }[J_.fase];
      H.txt(ctx, txt, 400, VH - 16, 16, '#9ab6ff', 'center');
      if (J_.fase === 'viagem') H.txt(ctx, 'ESPAÇO: pular a viagem', 400, 28, 12, '#ccc', 'center');
      if (J_.fase === 'chegada') { ctx.fillStyle = 'rgba(0,0,0,' + clamp(t / 1.2, 0, 1) + ')'; ctx.fillRect(0, 0, VW, VH); }
      return;
    }
    if (J_.fase !== 'cinema') return;
    const u = t / J_.dur, tipo = J_.tipo;
    ctx.save();
    if (tipo === 'terra' || tipo === 'volta') {
      const dia = tipo === 'volta';
      const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, dia ? '#f0a860' : '#05060e'); g.addColorStop(0.55, dia ? '#f8d890' : '#101830'); g.addColorStop(1, dia ? '#5a7a4a' : '#06080e');
      ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
      if (!dia) { ctx.fillStyle = '#fff'; for (let k = 0; k < 60; k++) { ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(k * 7 + t)); ctx.fillRect((k * 137) % VW, (k * 61) % 250, 1.5, 1.5); } ctx.globalAlpha = 1; }
      // serra ao fundo
      ctx.fillStyle = dia ? '#7a6a58' : '#0c1020'; ctx.beginPath(); ctx.moveTo(0, 380); for (let x = 0; x <= VW; x += 40) ctx.lineTo(x, 330 - 40 * Math.abs(Math.sin(x * 0.011 + 1)) - 30 * Math.sin(x * 0.03)); ctx.lineTo(VW, 380); ctx.fill();
      // estrada em perspectiva
      ctx.fillStyle = dia ? '#4a4a52' : '#1a1c24'; ctx.beginPath(); ctx.moveTo(VW / 2 - 14, 372); ctx.lineTo(VW / 2 + 14, 372); ctx.lineTo(VW + 120, VH); ctx.lineTo(-120, VH); ctx.fill();
      ctx.fillStyle = dia ? '#ffe9a0' : '#d8c870';
      for (let k = 0; k < 9; k++) { const f = ((k / 9 + t * 0.7) % 1), f2 = f * f, y = 372 + f2 * (VH - 372), w = 1 + f2 * 14; ctx.fillRect(VW / 2 - w / 2, y, w, 4 + f2 * 36); }
      // postes
      for (let k = 0; k < 6; k++) { const f = ((k / 6 + t * 0.5) % 1), f2 = f * f, y = 372 + f2 * (VH - 372), x = VW / 2 + (60 + f2 * 520) * (k % 2 ? 1 : -1); ctx.fillStyle = '#222'; ctx.fillRect(x - 2 - f2 * 4, y - 40 - f2 * 120, 4 + f2 * 8, 40 + f2 * 120); if (!dia) { ctx.fillStyle = 'rgba(255,230,140,0.8)'; ctx.beginPath(); ctx.arc(x, y - 40 - f2 * 120, 4 + f2 * 14, 0, TAU); ctx.fill(); } }
      // chuva
      if (!dia) { ctx.strokeStyle = 'rgba(160,190,230,0.35)'; ctx.lineWidth = 1; for (let k = 0; k < 90; k++) { const x = (k * 97 + t * 400) % (VW + 100), y = (k * 53 + t * 900) % VH; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 16); ctx.stroke(); } }
      // camburão (visto de trás)
      const bob = Math.sin(t * 18) * 1.5; ctx.fillStyle = '#e8e8ee'; W.rrect(ctx, VW / 2 - 46, 452 + bob, 92, 70, 8); ctx.fill(); ctx.fillStyle = '#12151c'; ctx.fillRect(VW / 2 - 38, 462 + bob, 76, 22);
      ctx.fillStyle = '#c8202a'; ctx.fillRect(VW / 2 - 30, 442 + bob, 22, 8); ctx.fillStyle = '#2a50d0'; ctx.fillRect(VW / 2 + 8, 442 + bob, 22, 8);
      ctx.fillStyle = Math.floor(t * 6) % 2 ? 'rgba(255,40,40,0.2)' : 'rgba(40,80,255,0.2)'; ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = '#ff3030'; ctx.fillRect(VW / 2 - 40, 508 + bob, 12, 6); ctx.fillRect(VW / 2 + 28, 508 + bob, 12, 6);
    } else if (tipo === 'mar') {
      const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#02040a'); g.addColorStop(0.45, '#0a1428'); g.addColorStop(0.46, '#08203a'); g.addColorStop(1, '#020812');
      ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = '#e8ecff'; ctx.beginPath(); ctx.arc(640, 90, 26, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(232,236,255,0.12)'; ctx.beginPath(); ctx.arc(640, 90, 70, 0, TAU); ctx.fill();
      // ilha cresce no horizonte
      const e = 0.35 + u * 1.1, cx = 300; ctx.fillStyle = '#05080c'; ctx.beginPath(); ctx.moveTo(cx - 260 * e, 270); ctx.lineTo(cx - 160 * e, 270 - 24 * e); ctx.lineTo(cx - 60 * e, 270 - 30 * e); ctx.lineTo(cx + 120 * e, 270 - 18 * e); ctx.lineTo(cx + 280 * e, 270); ctx.fill();
      ctx.fillStyle = '#10151c'; ctx.fillRect(cx - 110 * e, 270 - 52 * e, 220 * e, 30 * e);                 // muralha
      for (let k = 0; k < 5; k++) { const tx = cx - 110 * e + k * 55 * e; ctx.fillStyle = '#0a0e14'; ctx.fillRect(tx - 6 * e, 270 - 78 * e, 12 * e, 30 * e); ctx.fillStyle = 'rgba(255,230,140,' + (0.6 + 0.4 * Math.sin(t * 3 + k)) + ')'; ctx.fillRect(tx - 4 * e, 270 - 74 * e, 8 * e, 5 * e); }
      ctx.fillStyle = 'rgba(255,255,220,0.07)'; ctx.beginPath(); ctx.moveTo(cx, 270 - 90 * e); ctx.lineTo(cx + 520, 200); ctx.lineTo(cx + 520, 330); ctx.fill();   // farol
      for (let k = 0; k < 26; k++) { const y = 275 + k * 13, off = Math.sin(t * 2 + k) * 14; ctx.strokeStyle = 'rgba(120,170,230,' + (0.05 + k * 0.012) + ')'; ctx.lineWidth = 1.3; ctx.beginPath(); for (let x = -20; x < VW + 20; x += 20) ctx.lineTo(x, y + Math.sin(x * 0.04 + t * 2 + k) * (2 + k * 0.25) + off * 0.1); ctx.stroke(); }
      // barco
      const bob = Math.sin(t * 2) * 5; ctx.save(); ctx.translate(400, 470 + bob); ctx.rotate(Math.sin(t * 1.6) * 0.04);
      ctx.fillStyle = '#d8d8e0'; ctx.beginPath(); ctx.moveTo(-110, -6); ctx.lineTo(110, -6); ctx.lineTo(80, 34); ctx.lineTo(-80, 34); ctx.fill(); ctx.fillStyle = '#2a3a58'; ctx.fillRect(-60, -42, 80, 36); ctx.fillStyle = '#9ac0e8'; ctx.fillRect(-52, -34, 14, 14); ctx.fillRect(-30, -34, 14, 14); ctx.fillRect(-8, -34, 14, 14);
      ctx.fillStyle = '#c8202a'; ctx.fillRect(24, -52, 8, 10); ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, VW, 8);
    }
    ctx.restore();
    // legenda + barras de cinema
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, 50); ctx.fillRect(0, VH - 50, VW, 50);
    const f = clamp(Math.min(t * 1.5, (J_.dur - t) * 1.5), 0, 1);
    H.txt(ctx, J_.titulo || '', 400, 34, 22, '#ffe04a', 'center');
    H.txt(ctx, J_.sub || '', 400, VH - 22, 14, '#dfe6ff', 'center');
    ctx.fillStyle = 'rgba(0,0,0,' + (1 - f) + ')'; ctx.fillRect(0, 0, VW, VH);
    H.txt(ctx, 'ESPAÇO: pular', 760, 590, 11, '#999', 'right');
  };

  // =====================================================================
  //  3) ENTRADA NA DELEGACIA
  // =====================================================================
  function montaLugar(S, pl, salaIni, px, py) {
    const cons = L.construtores[pl.id] || L.construtores['tipo:' + pl.tipo];
    const lg = { id: pl.id, place: pl, salas: {}, estado: {}, criar: cons.criar };
    const R = lg.criar(salaIni, lg); R.lugar = lg; R.id = salaIni; lg.salas[salaIni] = R; R.place = R.place || pl; R.dentroDesde = S.time;
    if (px != null) { R.px = px; R.py = py; }
    if (R.aoEntrar) R.aoEntrar(S, R);
    R.cx = clamp(R.px - VW / 2, 0, Math.max(0, R.W - VW)); R.cy = clamp(R.py - 350, 0, Math.max(0, R.H - VH));
    S.inside = R; S.mode = 'inside'; S.prompt = ''; S.sentado = null;
    return R;
  }
  J.montaLugar = montaLugar;

  J.entraDelegacia = function (S) {
    const J_ = S.justica, P = S.player, nv = NIVEIS[J_.nivel], pl = delegaciaPlace();
    const dinheiro = Math.floor(S.save.money);
    S.detido = { nivel: J_.nivel, dias: nv.dias, nome: nv.nome, local: 'delegacia', bom: 0, feito: {}, fianca: nv.fianca ? Math.max(40, Math.round(dinheiro * nv.fianca)) : 0, perda: nv.perda, advogado: false, triagem: true, crime: nv.crime };
    S.cars = S.cars.filter(c => !c.cenaPrisao); S.justica = null;
    G.combat.confiscate(S); P.escondido = false; P.x = pl.x; P.y = pl.y + 12;
    S.mode = 'preso'; S.justica = { fase: 'espera', t: 0 };       // enquanto a tela escurece
    L.trans(S, () => { S.justica = null; montaLugar(S, pl, 'entrada'); });   // no meio da transição vira 'inside'
  };

  // =====================================================================
  //  4) SENTENÇA, FIANÇA E LIBERDADE
  // =====================================================================
  J.solto = function (S, motivo) {
    const d = S.detido; if (!d) return;
    const volta = d.local !== 'delegacia';
    const fim = () => {
      const loss = motivo === 'fianca' ? 0 : d.perda;
      S.detido = null; S.justica = null; S.inside = null; S.player.escondido = false; S.player.iframes = 3;
      G.respawn(G.missions.POI.delegacia, loss);
      S.save.fichas = (S.save.fichas || 0) + 1; S.save.diasPreso = (S.save.diasPreso || 0) + (d.dias0 || 0); G.save();
      G.say(motivo === 'fianca' ? 'Fiança paga: você está livre, mas sem as armas. Mantenha a ficha limpa!' : 'ALVARÁ DE SOLTURA. Pena cumprida: ' + d.dias0 + ' dia(s). A multa e as custas levaram ' + Math.round(d.perda * 100) + '% do dinheiro e as armas ficaram com o Estado.', 8);
    };
    const ir = () => { if (S.trans || S.mode !== 'inside') fim(); else L.trans(S, fim); };
    if (volta) { S.inside = null; J.cena(S, 'volta', 6, () => { S.justica = null; fim(); }); S.justica.titulo = 'LIBERDADE'; S.justica.sub = 'O camburão leva você de volta para Ribeirão... ' + d.dias0 + ' dia(s) depois.'; }
    else ir();
  };

  function passaDia(S, fn) {
    L.trans(S, () => {
      const d = S.detido; if (!d) return;
      S.dayT = Math.floor(S.dayT) + 1.02; G.cidade.acelerar(420);
      const desc = 1 + (d.bom >= 3 ? 1 : 0);
      d.dias -= desc; d.bom = 0; d.feito = {}; d.passados = (d.passados || 0) + 1;
      S.player.hp = Math.min(100, S.player.hp + 25);
      G.say(desc > 1 ? 'Bom comportamento! A pena caiu 2 dias. Restam ' + Math.max(0, d.dias) + '.' : 'Mais um dia se passou. Restam ' + Math.max(0, d.dias) + ' dia(s) de pena.', 5);
      if (fn) fn(S, d);
    });
  }

  // transferência da delegacia para a penitenciária (camburão) ou para a ilha (barco)
  function transferir(S) { L.trans(S, () => transferirJa(S)); }
  function transferirJa(S) {
    const d = S.detido, ilha = d.nivel >= 5, loc = ilha ? LOCAIS.ilha : LOCAIS.penitenciaria;
    S.inside = null; d.local = loc.id; d.dias0 = d.dias; d.chegada = S.time;
    J.cena(S, ilha ? 'mar' : 'terra', ilha ? 11 : 9, () => {
      S.justica = null; S.mode = 'inside';
      const pl = { id: loc.id, tipo: 'prisao', nome: loc.nome, cor: loc.cor, x: delegaciaPlace().x, y: delegaciaPlace().y, livre: true };
      const R = montaLugar(S, pl, 'celas', 150, 440);
      L.trans(S, () => {});
      G.say(ilha ? 'Bem-vindo à Ilha do Silêncio. De lá ninguém nunca fugiu. Você vai cumprir ' + d.dias + ' dias.' : 'Penitenciária Serra Dura, a ' + loc.km + ' km da cidade. Você vai cumprir ' + d.dias + ' dias.', 7);
    });
    S.justica.titulo = loc.nome; S.justica.sub = ilha ? 'Ilha do Silêncio — a ' + loc.km + ' km do continente. Só se chega de barco.' : 'Estrada para a Serra Dura — ' + loc.km + ' km de Ribeirão Preto.';
  }
  J.transferir = transferir;

  // =====================================================================
  //  5) SALAS: DELEGACIA GERAL
  // =====================================================================
  const tipos = K.tipos;
  tipos.beliche = (ctx, o) => {
    K.caixa(ctx, o.x, o.y, o.w, o.h, 24, '#6f7684', '#3d4350');
    ctx.fillStyle = '#9aa6bd'; ctx.fillRect(o.x + 4, o.y - 24 + 4, o.w - 8, o.h - 8); ctx.fillStyle = '#e8e4d8'; ctx.fillRect(o.x + 6, o.y - 24 + 6, 22, o.h - 12);
    ctx.fillStyle = '#4a5468'; ctx.fillRect(o.x, o.y - 40, 4, 40); ctx.fillRect(o.x + o.w - 4, o.y - 40, 4, 40);
  };
  tipos.grade = (ctx, o) => {
    const top = o.y - (o.e || 40);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(o.x + 3, o.y + o.h, o.w, 4);
    ctx.fillStyle = '#7a808c'; ctx.fillRect(o.x, top, o.w, 4); ctx.fillRect(o.x, o.y + o.h - 4, o.w, 4);
    for (let x = o.x + 2; x < o.x + o.w; x += 12) { const g = ctx.createLinearGradient(x, 0, x + 4, 0); g.addColorStop(0, '#d8dce6'); g.addColorStop(1, '#4a4e58'); ctx.fillStyle = g; ctx.fillRect(x, top, 4, o.h + (o.e || 40)); }
  };
  tipos.vaso = (ctx, o) => { K.caixa(ctx, o.x, o.y, o.w, o.h, 14, '#e8eaee', '#aab0b8'); ctx.fillStyle = '#7a808a'; ctx.beginPath(); ctx.ellipse(o.x + o.w / 2, o.y - 6, o.w * 0.35, o.h * 0.3, 0, 0, TAU); ctx.fill(); };
  tipos.cesta = (ctx, o) => { ctx.fillStyle = '#c8c8d0'; ctx.fillRect(o.x + o.w / 2 - 2, o.y - 70, 4, 70); ctx.fillStyle = '#f2f2f6'; ctx.fillRect(o.x, o.y - 96, o.w, 34); ctx.strokeStyle = '#d8302a'; ctx.lineWidth = 2; ctx.strokeRect(o.x + 10, o.y - 86, o.w - 20, 16); ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.ellipse(o.x + o.w / 2, o.y - 58, 14, 5, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#d86a20'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(o.x + o.w / 2, o.y - 60, 15, 5, 0, 0, TAU); ctx.stroke(); };
  tipos.halter = (ctx, o) => { K.caixa(ctx, o.x, o.y, o.w, o.h, 10, '#4a4e58', '#2a2d34'); ctx.fillStyle = '#16181c'; ctx.fillRect(o.x - 8, o.y - 24, 10, 22); ctx.fillRect(o.x + o.w - 2, o.y - 24, 10, 22); ctx.fillRect(o.x, o.y - 14, o.w, 4); };
  tipos.torre = (ctx, o) => { ctx.fillStyle = '#4a4e58'; ctx.fillRect(o.x, o.y - 150, o.w, 150); ctx.fillStyle = '#2a2d34'; ctx.fillRect(o.x - 8, o.y - 168, o.w + 16, 22); ctx.fillStyle = 'rgba(255,230,140,0.85)'; ctx.fillRect(o.x + 4, o.y - 162, o.w - 8, 10); };
  tipos.arame = (ctx, o) => { ctx.fillStyle = '#6a6e78'; ctx.fillRect(o.x, o.y - 60, o.w, 60); ctx.strokeStyle = '#a8acb8'; ctx.lineWidth = 1; for (let x = o.x; x < o.x + o.w; x += 14) { ctx.beginPath(); ctx.moveTo(x, o.y - 60); ctx.lineTo(x + 14, o.y); ctx.moveTo(x + 14, o.y - 60); ctx.lineTo(x, o.y); ctx.stroke(); } ctx.fillStyle = '#2a2d34'; ctx.fillRect(o.x, o.y - 64, o.w, 5); };
  tipos.quadro = (ctx, o) => {   // quadro de PROCURADOS
    ctx.fillStyle = '#5a4026'; ctx.fillRect(o.x, o.y - 70, o.w, 66); ctx.fillStyle = '#e8dcb8'; ctx.fillRect(o.x + 4, o.y - 66, o.w - 8, 58);
    ctx.fillStyle = '#7a1a1a'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.fillText('PROCURADOS', o.x + o.w / 2, o.y - 54);
    for (let k = 0; k < 3; k++) { ctx.fillStyle = '#c8bc98'; ctx.fillRect(o.x + 10 + k * ((o.w - 20) / 3), o.y - 46, (o.w - 20) / 3 - 6, 34); ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.arc(o.x + 10 + k * ((o.w - 20) / 3) + ((o.w - 20) / 6) - 3, o.y - 32, 6, 0, TAU); ctx.fill(); ctx.fillRect(o.x + 10 + k * ((o.w - 20) / 3) + ((o.w - 20) / 6) - 9, o.y - 26, 12, 10); }
    ctx.textAlign = 'left';
  };

  const porta = (x, y, w, o) => O('porta', x, y, w, 54, Object.assign({ solid: false, k: 10, r: 50 }, o));
  const horaTxt = S => L.horaTxt(S);

  // ----- menu do balcão da delegacia -----
  function menuBalcao(S, R) {
    const d = S.detido;
    if (!d) {
      L.abrirMenu(S, { titulo: 'DELEGACIA GERAL — ATENDIMENTO', rodape: 'ESC sair', itens: [
        { n: 'Quadro de procurados', desc: 'ver os casos em aberto da cidade', fn: () => { G.say(G.crimes ? G.crimes.resumo() : 'Nenhum caso em aberto no momento. A cidade está calma.', 6); return 'fechar'; } },
        { n: 'Denunciar um crime', desc: 'ajuda a polícia (e o FBI) a fechar casos', fn: () => { G.say(G.crimes && G.crimes.denuncia ? G.crimes.denuncia(S) : 'O escrivão anotou. Obrigado pela colaboração!', 5); return 'fechar'; } },
        { n: 'Pagar multas ($0)', desc: 'você não deve nada à justiça... por enquanto', fn: () => { G.say('Nada em aberto no seu nome.', 3); return 'fechar'; } },
      ] });
      return;
    }
    const it = [];
    if (d.fianca > 0) it.push({ n: 'Pagar a FIANÇA', preco: d.fianca, desc: 'sai agora, mas as armas ficam com a polícia', fn: S2 => { if (!K.gasta(S2, d.fianca)) return; J.solto(S2, 'fianca'); return 'fechar'; } });
    if (d.nivel <= 3) it.push({ n: 'Cumprir a pena na cela (' + d.dias + ' dia' + (d.dias > 1 ? 's' : '') + ')', desc: 'dormir passa o dia; sem fiança você perde ' + Math.round(d.perda * 100) + '% do dinheiro', fn: S2 => { L.irSala(S2, 'celas', 150, 440, Math.PI); return 'fechar'; } });
    else it.push({ n: 'Aguardar a transferência', desc: d.nivel >= 5 ? 'sem fiança: segurança máxima na ILHA DO SILÊNCIO' : 'sem fiança: PENITENCIÁRIA SERRA DURA, muito longe daqui', fn: S2 => { L.irSala(S2, 'celas', 150, 440, Math.PI); return 'fechar'; } });
    it.push({ n: 'Ligar para o advogado', preco: 300, desc: d.advogado ? 'ele já cuidou do seu caso' : 'reduz a pena em 1 dia', fn: S2 => { if (d.advogado) { G.say('O advogado já foi chamado.', 3); return; } if (!K.gasta(S2, 300)) return; d.advogado = true; d.dias = Math.max(1, d.dias - 1); G.say('O advogado entrou com um habeas corpus. Pena reduzida: ' + d.dias + ' dia(s).', 5); return 'fechar'; } });
    it.push({ n: 'Ler a sentença', desc: d.crime, fn: () => { G.say('Acusação: ' + d.crime + '. Sentença: ' + d.dias + ' dia(s) — ' + d.nome + '.', 7); } });
    L.abrirMenu(S, { titulo: 'BALCÃO — ' + d.nome, rodape: 'W/S escolher  ·  E confirmar', info: S2 => 'Dinheiro: $' + Math.floor(S2.save.money), itens: it });
  }

  L.construtores['tipo:delegacia'] = {
    criar(sid, lg) {
      const pl = lg.place;
      if (sid === 'celas') return salaCelasDelegacia(lg);
      const R = L.novaSala({ place: pl, w: 880, h: 420, nome: 'DELEGACIA GERAL', cor: '#2a3a68', piso: 'ladrilho', pisoCores: ['#c8ccd6', '#9aa0b0'], parede: '#243a66', subtitulo: 'aberta 24 horas' });
      R.chegada = { x: R.portaX, y: R.y1 + 10 };
      const add = (...a) => R.objs.push(...a);
      add(O('recepcao', 340, 220, 260, 44, { e: 30, label: 'BALCÃO DA DELEGACIA', r: 60, act: S => menuBalcao(S, R) }));
      add(O('quadro', 120, 190, 120, 70, { e: 0, solid: false, label: 'QUADRO DE PROCURADOS', r: 40, act: S => G.say(G.crimes ? G.crimes.resumo() : 'Os rostos no quadro são de foragidos antigos. Nenhum caso novo.', 6) }));
      add(porta(780, 96, 70, { cor: '#4a4e58', placa: 'CELAS', label: 'IR ÀS CELAS', act: S => { if (S.detido) { L.irSala(S, 'celas', 150, 440, Math.PI); } else G.say('Acesso restrito a policiais e detidos.', 3); } }));
      add(porta(640, 96, 70, { cor: '#6a5a3a', placa: 'DELEGADO', label: 'SALA DO DELEGADO', act: S => G.say('O delegado está em reunião. Fale com o escrivão no balcão.', 3) }));
      add(O('banco_espera', 130, 360, 170, 26, { e: 16, label: 'SENTAR NA ESPERA', r: 30, act: S => { K.cura(S, 4); G.say('Você esperou sentado um pouco. (+4 vida)', 3); } }));
      add(O('banco_espera', 580, 360, 170, 26, { e: 16, label: 'SENTAR NA ESPERA', r: 30, act: S => { K.cura(S, 4); G.say('Você esperou sentado um pouco. (+4 vida)', 3); } }));
      add(O('planta', 90, 470, 40, 50, {}), O('planta', 860, 470, 40, 50, {}));
      R.npcs.push({ x: 470, y: 238, p: policial({ shirt: '#1c2f6b', fem: true, hairStyle: 'coque' }), falas: ['Delegacia Geral, boa noite. O que houve?', 'Documento, por favor.', 'Aqui nada passa sem registro.'], h: Math.PI, fixo: true, nome: 'Escrivã Marta', dinheiro: 40, label: 'CONVERSAR' });
      R.npcs.push({ x: 700, y: 300, p: policial({}), falas: ['Fique longe das celas, civil.', 'Tudo o que você disser pode ser usado...'], h: Math.PI, fixo: true, nome: 'Policial Souza', dinheiro: 30, label: 'CONVERSAR' });
      R.npcs.push({ x: 180, y: 320, p: look({ shirt: '#8a4a6a', fem: true }), falas: ['Roubaram minha bolsa... estou aqui há duas horas.', 'Quero registrar o boletim.'], h: 0, fixo: true, nome: 'Dona Cida', dinheiro: 55 });
      R.npcs.push({ x: 520, y: 350, p: look({}), falas: ['Sou advogado. Se for detido, me ligue: $300.', 'A fiança é bem mais barata que a ficha suja.'], h: 0, fixo: true, nome: 'Dr. Paulo', dinheiro: 120 });
      R.deco = x => {
        x.fillStyle = '#c8a24a'; x.fillRect(120, 70, 760, 3);
        x.save(); x.font = 'bold 30px Georgia'; x.textAlign = 'center'; x.fillStyle = '#e8ecff'; x.fillText('POLÍCIA CIVIL', 440, 110); x.font = 'bold 13px Arial'; x.fillStyle = '#ffe04a'; x.fillText('DELEGACIA GERAL DE RIBEIRÃO PRETO', 440, 132); x.restore();
        x.fillStyle = '#1a2a50'; x.fillRect(740, 130, 4, 20);
      };
      R.luzes.push({ x: 440, y: 330, r: 420 });
      R.aoSair = S => { if (S.detido) { G.say('Você está detido. Resolva a sentença no balcão.', 3.5); return false; } return true; };
      R.aoEntrar = (S, R2) => {
        const d = S.detido; if (!d || !d.triagem) return;
        d.triagem = false; d.dias0 = d.dias;
        R2.px = R2.portaX; R2.py = R2.y1 - 70;
        G.snd.fail();
        G.banner('FICHA CRIADA', 'Nível máximo: ' + d.nivel + ' estrelas — ' + d.nome, true, 4);
        G.say('Digitais colhidas, foto tirada e armas confiscadas. Vá ao BALCÃO para ouvir a sentença.', 7);
      };
      return R;
    }
  };

  function salaCelasDelegacia(lg) {
    const pl = lg.place, R = L.novaSala({ place: pl, w: 760, h: 400, nome: 'CELAS — DELEGACIA GERAL', cor: '#3a4048', piso: 'ladrilho', pisoCores: ['#8a8e98', '#6a6e78'], parede: '#4a4e58', subtitulo: 'carceragem' });
    R.chegada = { x: R.portaX, y: R.y1 + 10 };
    const add = (...a) => R.objs.push(...a);
    // 3 celas: a sua é a da esquerda
    const dormir = S => {
      const d = S.detido; if (!d) { G.say('Só detidos dormem aqui.', 3); return; }
      if (d.nivel >= 4) { transferir(S); return; }
      passaDia(S, (S2, d2) => { if (d2.dias <= 0) J.solto(S2, 'pena'); });
    };
    [0, 1, 2].forEach(k => {
      const x = 100 + k * 240;
      add(O('grade', x, 330, 200, 14, { e: 90 }));
      add(O('beliche', x + 14, 250, 90, 46, { e: 24, label: k === 0 ? 'DORMIR (passa o dia)' : 'BELICHE DE OUTRO PRESO', r: 46, act: k === 0 ? dormir : (S => G.say('Esse beliche tem dono. Melhor não mexer.', 3)) }));
      add(O('vaso_sanitario', x + 142, 236, 34, 40, {}));
    });
    add(O('banco_aco', 560, 424, 120, 20, { e: 14, label: 'SENTAR NO CORREDOR', r: 30, act: S => { K.cura(S, 3); G.say('Você respirou fundo. (+3 vida)', 3); } }));
    add(porta(740, 96, 60, { cor: '#4a4e58', placa: 'RECEPÇÃO', label: 'VOLTAR À RECEPÇÃO', act: S => { if (S.detido) G.say('Os policiais não deixam você sair da carceragem.', 3); else L.irSala(S, 'entrada', 780, 215, Math.PI); } }));
    R.porta = { para: 'entrada', px: 780, py: 215, ph: Math.PI, label: 'VOLTAR À RECEPÇÃO', rotulo: 'RECEPÇÃO' };
    R.npcs.push({ x: 340, y: 290, p: preso({ hairStyle: 'raspado' }), falas: ['Fica quieto que o delegado é brabo.', 'Fui pego com a mão na massa, fazer o quê...', 'Quem passa de 4 estrelas vai pra Serra Dura. Aí é outra vida.'], h: Math.PI, fixo: true, nome: 'Detento Beto', dinheiro: 0, label: 'CONVERSAR' });
    R.npcs.push({ x: 580, y: 290, p: preso({ fem: false }), falas: ['Dizem que na Ilha do Silêncio ninguém nunca fugiu. Ninguém.', 'Conheço um cara que sumiu na Mata Escura... nunca mais apareceu.', 'Tenho advogado bom. Você tem?'], h: Math.PI, fixo: true, nome: 'Detento Zeca', dinheiro: 0, label: 'CONVERSAR' });
    R.npcs.push({ x: 640, y: 440, p: policial({}), falas: ['Sem confusão na carceragem.', 'Cumpra a pena e siga em frente.'], h: Math.PI, fixo: true, nome: 'Carcereiro Lima', dinheiro: 25, label: 'CONVERSAR' });
    R.deco = x => { x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(70, 120, 760, 26); x.save(); x.font = 'bold 22px Arial'; x.fillStyle = '#d8dce6'; x.textAlign = 'center'; x.fillText('CARCERAGEM — DELEGACIA GERAL', 400, 86); x.restore(); };
    R.luzes = [{ x: 250, y: 300, r: 260 }, { x: 600, y: 300, r: 300 }];
    R.aoSair = S => { if (S.detido) { G.say('Grade trancada. Cumpra a pena ou pague a fiança.', 3); return false; } return true; };
    return R;
  }

  // =====================================================================
  //  6) SALAS: PENITENCIÁRIA E ILHA DE SEGURANÇA MÁXIMA
  // =====================================================================
  function bomComportamento(S, chave, titulo, pts, extra) {
    const d = S.detido; if (!d) return;
    if (d.feito[chave]) { G.say('Hoje você já fez isso. Durma para o dia passar.', 3.5); return; }
    L.miniTiming(S, { titulo, reps: 3, v: 1.2, zona: 0.18, cb: (S2, R2, ok, tot) => {
      d.feito[chave] = true;
      if (ok >= 2) { d.bom += pts; G.say('Bom desempenho! Comportamento +' + pts + ' (' + d.bom + '/3).' + (extra ? ' ' + extra(S2) : ''), 4.5); }
      else G.say('Você fez de qualquer jeito. Nenhum ponto de comportamento.', 3.5);
    } });
  }
  function salaPrisao(sid, lg) {
    const pl = lg.place, ilha = pl.id === 'ilha', cor = ilha ? '#2a3038' : '#4a5060';
    const base = (w, h, nome, o) => { const R = L.novaSala(Object.assign({ place: pl, w, h, nome, cor, piso: 'ladrilho', pisoCores: ilha ? ['#6a6e78', '#50545e'] : ['#8a8e98', '#6a6e78'], parede: ilha ? '#323840' : '#4a5060', subtitulo: ilha ? 'ILHA DO SILÊNCIO' : 'SERRA DURA' }, o || {})); R.chegada = { x: R.portaX, y: R.y1 + 10 }; R.aoSair = S => { G.say('Portões trancados. Aqui só se sai cumprindo a pena.', 3.5); return false; }; return R; };
    const add = (R, ...a) => R.objs.push(...a);
    const guarda = (x, y, n, rota) => { const g = { x, y, p: policial({ shirt: '#15171c', cap: 'swat' }), falas: ['Sem conversa, preso!', 'Cumpra a sua pena em paz.', ilha ? 'Daqui ninguém sai. Nem o mar deixa.' : 'Muro de 9 metros, arame e cães. Nem tente.'], h: Math.PI, fixo: true, nome: n, dinheiro: 0, label: 'CONVERSAR' }; return g; };
    const voltar = (R, sala) => { R.porta = { para: 'celas', px: RET[sala], py: 215, ph: Math.PI, label: 'VOLTAR ÀS CELAS', rotulo: 'CELAS' }; };
    const RET = { patio: ilha ? 565 : 510, refeitorio: ilha ? 725 : 651, oficina: ilha ? 885 : 791 };
    const volta = (de, sala) => porta(de - 30, 96, 60, { cor: '#4a4e58', placa: 'CELAS', label: 'VOLTAR ÀS CELAS', act: S => L.irSala(S, 'celas', RET[sala], 215, Math.PI) });

    if (sid === 'patio') {
      const R = base(ilha ? 1100 : 900, 440, 'PÁTIO', { piso: 'xadrez', pisoCores: ilha ? ['#6a7060', '#5a6050'] : ['#8a8470', '#78725e'] });
      const w = R.x1 - R.x0;
      add(R, O('cesta', R.x0 + 120, 280, 70, 14, { e: 0, label: 'JOGAR BASQUETE', r: 70, act: S => bomComportamento(S, 'basquete', 'BASQUETE NO PÁTIO', 1) }));
      add(R, O('halter', R.x0 + 330, 350, 90, 18, { e: 10, label: 'LEVANTAR PESO', r: 50, act: S => bomComportamento(S, 'peso', 'LEVANTAMENTO DE PESO', 1, S2 => { S2.save.forca = (S2.save.forca || 0); return ''; }) }));
      add(R, O('supino', R.x0 + 470, 300, 150, 60, { e: 14, solid: true }), O('saco', R.x0 + 690, 290, 30, 30, { e: 0 }), O('mesa', R.x0 + 120, 400, 54, 44, { e: 18, estilo: 'bar' }), O('banqueta', R.x0 + 80, 408, 26, 26, { cor: '#7a7e86' }), O('banqueta', R.x0 + 180, 408, 26, 26, { cor: '#7a7e86' }));
      add(R, O('banco_aco', R.x0 + 330, 420, 150, 20, { e: 14, solid: true }));
      add(R, O('banco_aco', R.x0 + 560, 400, 150, 20, { e: 14, label: 'TOMAR SOL', r: 36, act: S => { K.cura(S, 6); G.say('Sol no pátio, a única liberdade do dia. (+6 vida)', 3.5); } }));
      // o muro: tentativa de fuga (impossível)
      add(R, O('arame', R.x0 + 20, 190, w - 40, 14, { e: 0, label: 'TENTAR FUGIR PELO MURO', r: 46, act: S => fuga(S) }));
      add(R, O('torre', R.x0 + 20, 190, 40, 14, { e: 0, solid: false })); add(R, O('torre', R.x1 - 70, 190, 40, 14, { e: 0, solid: false }));
      add(R, volta(R.portaX, 'patio'));
      R.npcs.push(guarda(R.x0 + 200, 330, 'Guarda Ramos'), guarda(R.x1 - 200, 330, 'Guarda Teles'));
      R.npcs.push({ x: R.x0 + 190, y: 330, p: preso({}), falas: ['Joga bem, hein? Faz tempo que não vejo gente nova aqui.', 'Aqui dentro cada dia vale por três.'], h: 0, fixo: true, nome: 'Detento Mingau', dinheiro: 0, label: 'CONVERSAR' });
      R.npcs.push({ x: R.x0 + 600, y: 330, p: preso({ fem: false }), falas: ['Eu era da Mata Escura. Lá um homem some na floresta e ninguém acha. Dizem que tem um assassino por lá...', 'O FBI já esteve aqui perguntando sobre os desaparecidos.', 'Quer um conselho? Faz tudo certinho e sai antes.'], h: 0, fixo: true, nome: 'Detento Velho Tião', dinheiro: 0, label: 'CONVERSAR' });
      voltar(R, 'patio');
      R.pisoExtra = x => {   // meia quadra de basquete e faixa de corrida pintadas no chão
        x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 3; x.strokeRect(R.x0 + 40, 240, 330, 170); x.strokeRect(R.x0 + 40, 280, 110, 90); x.beginPath(); x.arc(R.x0 + 150, 325, 45, -Math.PI / 2, Math.PI / 2); x.stroke(); x.beginPath(); x.arc(R.x0 + 40, 325, 150, -0.9, 0.9); x.stroke();
        x.strokeStyle = 'rgba(255,224,74,0.45)'; x.setLineDash([14, 10]); x.strokeRect(R.x0 + 14, 214, w - 28, 250); x.setLineDash([]);
      };
      R.deco = x => { x.fillStyle = '#6a6e78'; x.fillRect(R.x0, 130, w, 22); x.save(); x.font = 'bold 24px Arial'; x.fillStyle = '#d8dce6'; x.textAlign = 'center'; x.fillText('PÁTIO — BANHO DE SOL', R.x0 + 225, 100); x.restore(); };
      return R;
    }
    if (sid === 'refeitorio') {
      const R = base(760, 380, 'REFEITÓRIO', { piso: 'ladrilho' });
      add(R, O('balcao', 130, 190, 260, 40, { e: 28, label: 'PEGAR A BANDEJA (grátis)', r: 50, act: S => { if (S.detido && S.detido.feito.comer) { G.say('Uma bandeja por refeição, preso.', 3); return; } if (S.detido) S.detido.feito.comer = true; K.cura(S, 30); G.say('Arroz, feijão e um ovo. Comida de presídio: (+30 vida)', 4); } }));
      [[130, 300], [420, 300], [130, 410], [420, 410]].forEach(([a, b]) => add(R, O('banco_aco', a, b - 24, 220, 16, { e: 10, solid: false }), O('banco_aco', a, b, 220, 34, { e: 22, cor: '#b0b4bc' }), O('banco_aco', a, b + 46, 220, 16, { e: 10, solid: false })));
      add(R, O('panelao', 430, 196, 100, 44, { e: 30 }), O('panelao', 540, 196, 100, 44, { e: 30 }), O('bebedouro', 668, 196, 36, 36, { e: 62, label: 'BEBER ÁGUA', r: 40, act: S => { K.cura(S, 2); G.say('Água gelada do bebedouro. (+2 vida)', 2.5); } }));
      add(R, volta(R.portaX, 'refeitorio'));
      R.npcs.push({ x: 260, y: 215, k: 600, p: preso({ shirt: '#f2f2f2', cap: 'none', acc: 'hat', accCol: '#f2f2f2' }), falas: ['Hoje tem feijão com ovo, como todo dia.'], h: Math.PI, fixo: true, nome: 'Cozinheiro', dinheiro: 0, label: 'CONVERSAR' }, guarda(700, 340, 'Guarda Nunes'), { x: 400, y: 262, p: preso({}), falas: ['Respeita a fila.', 'Quem tem advogado sai antes.'], h: 0, fixo: true, nome: 'Detento Cabo', dinheiro: 0, label: 'CONVERSAR' });
      voltar(R, 'refeitorio');
      R.deco = x => { x.save(); x.font = 'bold 24px Arial'; x.fillStyle = '#d8dce6'; x.textAlign = 'center'; x.fillText('REFEITÓRIO', 190, 100); x.restore(); G.deco.quadroNegro(x, 296, 92, 110, 44, [['Segunda', 'feijão'], ['Terça', 'macarrão']], 'CARDÁPIO'); };
      return R;
    }
    if (sid === 'oficina') {
      const R = base(760, 380, 'OFICINA DE TRABALHO', {});
      add(R, O('bancada', 150, 250, 180, 44, { e: 26, label: 'TRABALHAR (reduz a pena)', r: 52, act: S => bomComportamento(S, 'trabalho', 'COSTURA NA OFICINA', 2, S2 => { S2.save.money += 12; G.save(); return 'Salário: +$12.'; }) }));
      add(R, O('bancada', 400, 250, 180, 44, { e: 26, label: 'TRABALHAR (reduz a pena)', r: 52, act: S => bomComportamento(S, 'trabalho', 'COSTURA NA OFICINA', 2, S2 => { S2.save.money += 12; G.save(); return 'Salário: +$12.'; }) }));
      add(R, O('bancada', 150, 340, 180, 44, { e: 26, label: 'TRABALHAR (reduz a pena)', r: 52, act: S => bomComportamento(S, 'trabalho', 'COSTURA NA OFICINA', 2, S2 => { S2.save.money += 12; G.save(); return 'Salário: +$12.'; }) }), O('bancada', 400, 340, 180, 44, { e: 26, solid: true }));
      add(R, O('prateleira', 100, 192, 120, 36, { e: 52, tema: 'caixas' }), O('prateleira', 240, 192, 120, 36, { e: 52, tema: 'roupas' }), O('arara', 540, 196, 110, 30, { e: 40, tema: 'camisa' }), O('pilha_caixas', 680, 200, 70, 44, { e: 30 }), O('pilha_caixas', 20 + 640, 300, 70, 44, { e: 30 }));
      add(R, volta(R.portaX, 'oficina'));
      R.npcs.push(guarda(640, 330, 'Guarda Peres'), { x: 250, y: 280, p: preso({}), falas: ['Cada dia de trabalho vale um dia a menos... se for bom.'], h: Math.PI, fixo: true, nome: 'Detento Nei', dinheiro: 0, label: 'CONVERSAR' });
      voltar(R, 'oficina');
      R.deco = x => { x.save(); x.font = 'bold 24px Arial'; x.fillStyle = '#d8dce6'; x.textAlign = 'center'; x.fillText('OFICINA', 150, 100); x.font = '14px Arial'; x.fillStyle = '#ffe04a'; x.fillText('Trabalho remunerado', 150, 122); x.restore(); };
      return R;
    }
    if (sid === 'solitaria') {
      const R = base(360, 260, 'SOLITÁRIA', { piso: 'ladrilho', pisoCores: ['#30343c', '#24282e'], parede: '#1a1d22', luzes: [{ x: 250, y: 280, r: 120 }] });
      add(R, O('beliche', 130, 260, 80, 44, { e: 20, solid: true }), O('vaso_sanitario', 316, 236, 34, 40, {}));
      R.deco = x => { x.save(); x.font = 'bold 18px Arial'; x.fillStyle = '#7a808c'; x.textAlign = 'center'; x.fillText('SOLITÁRIA', 250, 120); x.restore(); };
      R.aoEntrar = S => { R.t0 = 0; R.restante = 9; G.say('SOLITÁRIA: você vai ficar aqui sozinho um tempo...', 5); };
      R.onUpdate = (S, R2, dt) => { R2.restante -= dt; if (R2.restante <= 0 && !S.trans) { L.irSala(S, 'celas', 150, 440, Math.PI); } };
      return R;
    }
    // sid === 'celas' (corredor principal e a sua cela)
    const R = base(ilha ? 1000 : 880, 400, ilha ? 'BLOCO DE CELAS — MÁXIMA' : 'BLOCO DE CELAS', {});
    const w = R.x1 - R.x0;
    // sua cela (esquerda)
    add(R, O('grade', 100, 340, 190, 14, { e: 90 }), O('beliche', 114, 262, 90, 46, { e: 24, label: 'DORMIR (passa o dia)', r: 50, act: S => {
      const d = S.detido; if (!d) return;
      passaDia(S, (S2, d2) => { if (d2.dias <= 0) J.solto(S2, 'pena'); });
    } }), O('vaso_sanitario', 238, 240, 34, 40, {}), O('pia', 196, 224, 30, 30, { e: 18, solid: false }));
    for (let k = 1; k <= 3; k++) { const x = 100 + k * 210; add(R, O('grade', x, 340, 190, 14, { e: 90 }), O('beliche', x + 14, 262, 90, 46, { e: 24, solid: true }), O('vaso_sanitario', x + 138, 240, 34, 40, {})); }
    add(R, O('banco_aco', 100, 456, 130, 20, { e: 14, label: 'DESCANSAR', r: 30, act: S => { K.cura(S, 3); G.say('Você respirou fundo. (+3 vida)', 3); } }));
    add(R, O('recepcao', R.x1 - 210, 440, 120, 40, { e: 26, label: 'TELEFONE DO ADVOGADO', r: 50, act: S => {
      const d = S.detido; if (!d) return; if (d.advogado) { G.say('O advogado já está cuidando do seu caso.', 3); return; }
      L.abrirMenu(S, { titulo: 'TELEFONE — ADVOGADO', itens: [
        { n: 'Contratar advogado (-2 dias)', preco: ilha ? 1500 : 600, desc: ilha ? 'recurso na Suprema Corte' : 'pedido de progressão de pena', fn: S2 => { const pr = ilha ? 1500 : 600; if (!K.gasta(S2, pr)) return; d.advogado = true; d.dias = Math.max(1, d.dias - 2); G.say('O advogado conseguiu reduzir a pena: ' + d.dias + ' dia(s).', 5); return 'fechar'; } },
        { n: 'Desligar', fn: () => 'fechar' } ] });
    } }));
    add(R, porta(R.x0 + w * 0.46, 96, 70, { cor: '#4a4e58', placa: 'PÁTIO', label: 'IR AO PÁTIO', act: S => L.irSala(S, 'patio', 470, 215, Math.PI) }));
    add(R, porta(R.x0 + w * 0.62, 96, 70, { cor: '#4a4e58', placa: 'REFEITÓRIO', label: 'IR AO REFEITÓRIO', act: S => L.irSala(S, 'refeitorio', 450, 215, Math.PI) }));
    add(R, porta(R.x0 + w * 0.78, 96, 70, { cor: '#4a4e58', placa: 'OFICINA', label: 'IR À OFICINA', act: S => L.irSala(S, 'oficina', 450, 215, Math.PI) }));
    R.npcs.push(guarda(R.x0 + w * 0.5, 440, 'Guarda Barros', true), { x: 460, y: 300, p: preso({}), falas: ['Novato, né? Bom comportamento reduz a pena.', 'Treina no pátio e trabalha na oficina: três pontos e a pena cai dois dias de uma vez.', ilha ? 'Dizem que o FBI mantém aqui os piores do país.' : 'Aqui é Serra Dura. O nome já diz tudo.'], h: 0, fixo: true, nome: 'Detento Rato', dinheiro: 0, label: 'CONVERSAR' });
    R.deco = x => { x.save(); x.font = 'bold 22px Arial'; x.fillStyle = '#d8dce6'; x.textAlign = 'center'; x.fillText(pl.nome, R.x0 + 215, 96); x.font = '14px Arial'; x.fillStyle = '#ffe04a'; x.fillText('Cumpra a pena em silêncio', R.x0 + 215, 118); x.restore(); };
    R.luzes = [{ x: 250, y: 320, r: 280 }, { x: R.x0 + w * 0.7, y: 300, r: 340 }];
    return R;
  }
  ['penitenciaria', 'ilha'].forEach(id => { L.construtores[id] = { criar: (sid, lg) => salaPrisao(sid, lg) }; });

  // tentativa de fuga: sempre falha — a ilha e a Serra Dura foram feitas para isso
  function fuga(S) {
    const d = S.detido; if (!d) return;
    L.trans(S, () => {
      d.dias += 2; d.fugas = (d.fugas || 0) + 1; S.player.hp = Math.max(8, S.player.hp - 35);
      G.say(d.local === 'ilha' ? 'FUGA IMPOSSÍVEL: muralha de 12 metros, cães, torres e 40 km de mar bravo. Os guardas te pegaram. +2 dias e solitária.' : 'Os guardas te pegaram no arame. Muro de 9 metros e cães: +2 dias e solitária.', 8);
      const lg = S.inside.lugar; let R = lg.salas.solitaria; if (!R) { R = lg.salas.solitaria = lg.criar('solitaria', lg); R.lugar = lg; R.id = 'solitaria'; R.place = lg.place; }
      R.px = R.portaX; R.py = R.y1 - 80; if (R.aoEntrar) R.aoEntrar(S, R);
      S.inside = R; R.cx = 0; R.cy = 0;
    });
  }

  // placar da pena no canto da tela (dentro de lugares)
  L.extrasDesenho.push((ctx, S, inV) => {
    const d = S.detido; if (!d || !inV) return;
    const H = G.hud;
    ctx.save(); ctx.fillStyle = 'rgba(8,10,20,0.78)'; W.rrect(ctx, 10, 10, 250, 62, 8); ctx.fill(); ctx.strokeStyle = '#ffe04a'; ctx.lineWidth = 1.5; ctx.stroke();
    H.txt(ctx, d.nome, 20, 30, 13, '#ffe04a', 'left');
    H.txt(ctx, 'Pena: ' + Math.max(0, d.dias) + ' dia(s)   ·   Comportamento: ' + d.bom + '/3', 20, 48, 12, '#fff', 'left');
    H.txt(ctx, d.local === 'delegacia' ? 'Delegacia Geral' : d.local === 'ilha' ? 'Ilha do Silêncio' : 'Serra Dura', 20, 64, 11, '#9ab6ff', 'left');
    ctx.restore();
  });
})(window.G = window.G || {});
