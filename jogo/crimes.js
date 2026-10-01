/* =====================================================================
   CRIMES.JS — a vida (e a morte) da cidade, sem você precisar fazer nada
     • Crimes de NPC, raros e por probabilidade. Assaltos a lojas e bancos têm PLANEJAMENTO
       (os bandidos "estudam" o alvo por 1-2 dias) e podem dar certo ou errado.
     • Sequestros, golpes, roubo de carro, incêndio criminoso...
     • Se a polícia não prende, casos graves passam para o FBI (que também pode fracassar).
     • O ASSASSINO DA MATA ESCURA: corpos na floresta, fitas da polícia e uma cabana escondida.
     • ACIDENTES: batidas e atropelamentos chamam a AMBULÂNCIA, que leva ao hospital mais perto
       (ou ao seguinte, se o mais perto estiver lotado). Quando VOCÊ morre, vale a mesma regra.
     • O jornal da banca, o quadro de procurados da delegacia e o "PLANTÃO" mostram tudo isso.
   ===================================================================== */
(function (G) {
  'use strict';
  const W = G.world, L = G.lugares, K = L.kit, AI = G.ai, C = G.cidade;
  const rand = K.rand, clamp = K.clamp, pick = K.pick, TAU = Math.PI * 2;
  const CR = G.crimes = { ambulancias: [], cenas: [] };
  const $ = v => '$' + Math.round(v);
  const NOMES = ['Carlos', 'Marcos', 'Rita', 'Joana', 'Beto', 'Paulo', 'Luana', 'Sérgio', 'Cida', 'Tavinho', 'Dona Zefa', 'Seu Nenê'];
  const SOBRE = ['Silva', 'Souza', 'Costa', 'Lima', 'Rocha', 'Moura', 'Dias', 'Nunes'];

  const sv = S => {
    const s = S.save;
    if (!s.casos) s.casos = []; if (!s.noticias) s.noticias = [];
    if (s.crimeDia == null) s.crimeDia = Math.floor(S.dayT || 0);
    if (!s.serial) s.serial = { vitimas: 0, resolvido: false, cabana: null, corpos: [] };
    return s;
  };
  const noticia = (S, txt, plantao) => {
    const s = sv(S); s.noticias.unshift(txt); if (s.noticias.length > 14) s.noticias.pop();
    if (plantao && S.mode === 'play') G.say('PLANTÃO: ' + txt, 7);
  };
  const gov = S => (G.governo ? G.governo.gov(S) : { seg: 1 });

  // ---------- hospitais: o mais perto, ou o seguinte se estiver lotado ----------
  const hosps = () => W.hospitais;
  CR.hospitalPara = function (x, y, S) {
    const H = hosps().slice().sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
    for (const h of H) if (h.lot == null) h.lot = rand(0.1, 0.6);
    let pri = H[0], lotado = false;
    for (const h of H) { if (h.lot < 0.82) { pri = h; break; } lotado = true; }
    if (!pri || pri.lot >= 0.82) pri = H[H.length - 1];
    return { h: pri, lotado: lotado && pri !== H[0], perto: H[0] };
  };
  // quando você morre
  CR.respawnHospital = function (S, x, y) {
    const r = CR.hospitalPara(x, y, S); r.h.lot = Math.min(1, r.h.lot + 0.08);
    const where = { x: r.h.x, y: r.h.y + 28, r: r.h.r, nome: r.h.nome, lotado: r.lotado, perto: r.perto.nome };
    return where;
  };

  // ---------- registro de casos ----------
  const ehBanco = p => /BANCO/.test(p.nome || '');
  const alvosLoja = () => W.places.filter(p => p.tipo === 'loja' && !ehBanco(p) && p.x != null);
  function novoCaso(S) {
    const s = sv(S), g = gov(S), pesos = [['loja', 35], ['banco', 9], ['sequestro', 8], ['carro', 20], ['golpe', 15], ['incendio', 6]];
    let tot = pesos.reduce((a, p) => a + p[1], 0), r = Math.random() * tot, tipo = 'loja';
    for (const [t, p] of pesos) { r -= p; if (r <= 0) { tipo = t; break; } }
    const caso = { id: s.casos.length + 1 + Math.floor(Math.random() * 1000), tipo, estado: 'planejando', dias: 0, plano: tipo === 'carro' || tipo === 'golpe' ? 0 : 1 + Math.floor(Math.random() * 2), dica: 0, grav: { loja: 2, banco: 4, sequestro: 5, carro: 1, golpe: 1, incendio: 3 }[tipo] };
    const lojas = alvosLoja();
    if (tipo === 'loja') { const a = pick(lojas); caso.alvo = { nome: a.nome, x: a.x, y: a.y }; caso.chance = 0.6; }
    else if (tipo === 'banco') { const a = W.places.find(ehBanco) || pick(lojas); caso.alvo = { nome: a.nome, x: a.x, y: a.y }; caso.chance = 0.35; }
    else if (tipo === 'incendio') { const a = pick(lojas); caso.alvo = { nome: a.nome, x: a.x, y: a.y }; caso.chance = 0.8; }
    else if (tipo === 'sequestro') {
      const pt = pontoLivre(['floresta', 'fazenda'], Math.random() * 9999); const nm = pick(NOMES) + ' ' + pick(SOBRE);
      caso.vitima = nm; caso.resgate = Math.round(rand(8, 40)) * 1000; caso.loc = pt; caso.alvo = { nome: nm, x: pt.x, y: pt.y }; caso.chance = 0.7;
    } else { caso.alvo = { nome: pick(['Seu Nenê', 'Dona Zefa', 'um empresário', 'uma aposentada']), x: 0, y: 0 }; caso.chance = 0.7; }
    s.casos.push(caso);
    if (tipo === 'banco' || tipo === 'sequestro') noticia(S, 'Fontes da polícia dizem que um grupo criminoso anda estudando ' + (tipo === 'banco' ? 'um banco da cidade.' : 'pessoas ricas para sequestrar.'), false);
    return caso;
  }

  // ponto livre dentro de um bloco de floresta/fazenda (sem árvore em cima)
  function pontoLivre(kinds, semente) {
    const bl = W.blocks.filter(b => kinds.includes(b.kind)); const rg = W.mulberry32(Math.floor(semente) + 77);
    for (let t = 0; t < 400; t++) {
      const b = bl[Math.floor(rg() * bl.length)]; if (!b) break;
      const x = b.x + 60 + rg() * (b.w - 120), y = b.y + 60 + rg() * (b.h - 120);
      if (W.isSolid(x, y) || W.treeHit(x, y, 46) || W.tileAt(x, y) === W.TILE.WATER) continue;
      return { x, y, bloco: b.bx + ',' + b.by };
    }
    return { x: W.nodeX(12), y: W.nodeY(3) + 400, bloco: '' };
  }

  function executa(S, c) {
    const s = sv(S), g = gov(S), ok = Math.random() < c.chance;
    const seg = (g.seg || 1);
    if (c.tipo === 'loja' || c.tipo === 'banco') {
      const v = Math.round(c.tipo === 'banco' ? rand(8000, 30000) : rand(300, 2500));
      if (ok) {
        c.estado = 'aberto'; c.valor = v;
        noticia(S, (c.tipo === 'banco' ? 'ASSALTO AO BANCO' : 'ASSALTO') + ': bandidos armados levaram ' + $(v) + ' do(a) ' + c.alvo.nome + ' e fugiram.', true);
        cena(S, c, 'fuga');
        if (Math.random() < 0.25 + 0.15 * seg) { c.estado = 'resolvido'; noticia(S, 'A polícia prendeu os assaltantes do(a) ' + c.alvo.nome + ' horas depois.'); }
      } else { c.estado = 'resolvido'; noticia(S, 'Tentativa de assalto ao(à) ' + c.alvo.nome + ' fracassou: a polícia prendeu os criminosos em flagrante.', true); cena(S, c, 'flagrante'); }
    } else if (c.tipo === 'sequestro') {
      if (ok) { c.estado = 'aberto'; noticia(S, 'SEQUESTRO: ' + c.vitima + ' desapareceu. Os criminosos pedem ' + $(c.resgate) + ' de resgate.', true); }
      else { c.estado = 'resolvido'; noticia(S, 'A polícia frustrou o sequestro de ' + c.vitima + '. Criminosos presos.'); }
    } else if (c.tipo === 'incendio') {
      c.estado = ok ? 'aberto' : 'resolvido'; noticia(S, ok ? 'INCÊNDIO CRIMINOSO destruiu o(a) ' + c.alvo.nome + ' esta madrugada.' : 'Bombeiros evitaram incêndio criminoso no(a) ' + c.alvo.nome + '.', true);
    } else if (c.tipo === 'carro') { c.estado = 'aberto'; noticia(S, 'Onda de roubos de carros preocupa os moradores.', false); if (Math.random() < 0.5) c.estado = 'resolvido'; }
    else { c.estado = 'aberto'; noticia(S, 'GOLPE: ' + c.alvo.nome + ' perdeu a poupança num golpe do falso PIX.', false); if (Math.random() < 0.45) c.estado = 'resolvido'; }
  }

  function diaCrimes(S) {
    const s = sv(S), g = gov(S), seg = g.seg || 1;
    // evolução dos casos
    s.casos.forEach(c => {
      if (c.estado === 'planejando') { c.plano--; if (c.plano <= 0) executa(S, c); }
      else if (c.estado === 'aberto') {
        c.dias++;
        if (c.grav >= 3 && c.dias >= 2) { c.estado = 'fbi'; noticia(S, 'O FBI assumiu a investigação do caso: ' + titulo(c) + '.', false); }
        else if (Math.random() < (0.10 + 0.06 * seg + 0.2 * c.dica)) { c.estado = 'resolvido'; noticia(S, 'Polícia resolve o caso: ' + titulo(c) + '. Suspeitos presos.'); }
      } else if (c.estado === 'fbi') {
        c.dias++;
        if (Math.random() < 0.2 + 0.2 * c.dica) { c.estado = 'resolvido'; c.porFbi = true; noticia(S, 'Operação do FBI prende os responsáveis: ' + titulo(c) + '.'); }
        else if (c.dias > 8) { c.estado = 'arquivado'; noticia(S, 'O caso foi arquivado sem culpados: ' + titulo(c) + '.'); }
      }
    });
    s.casos = s.casos.filter(c => c.estado !== 'resolvido' || (c.dia0 = (c.dia0 || 0) + 1) < 3);
    s.casos = s.casos.filter(c => c.estado !== 'arquivado' || (c.dia1 = (c.dia1 || 0) + 1) < 3);
    // novos casos (raros, mais quando a segurança é baixa)
    const abertos = s.casos.filter(c => c.estado !== 'resolvido' && c.estado !== 'arquivado').length;
    if (abertos < 5 && Math.random() < 0.55 - 0.1 * (seg - 1)) novoCaso(S);
    // o assassino da mata
    const sr = s.serial;
    if (!sr.resolvido) {
      if (!sr.cabana) sr.cabana = pontoLivre(['floresta'], 4242);
      if (Math.random() < 0.28) {
        const pt = pontoLivre(['floresta'], Math.random() * 99999); sr.vitimas++; sr.corpos.push({ x: pt.x, y: pt.y, nome: pick(NOMES) + ' ' + pick(SOBRE) });
        if (sr.corpos.length > 6) sr.corpos.shift();
        noticia(S, 'MATA ESCURA: encontrado mais um corpo na floresta (' + sr.vitimas + ' vítimas). A polícia fala em um possível assassino em série.', true);
      }
      if (sr.vitimas >= 5 && Math.random() < 0.05) { sr.resolvido = true; noticia(S, 'FBI prende suspeito dos crimes da Mata Escura! O assassino em série foi capturado.'); }
    }
    // lotação dos hospitais varia de dia para dia
    hosps().forEach(h => { h.lot = clamp((h.lot == null ? rand(0.1, 0.6) : h.lot) + rand(-0.25, 0.22), 0.05, 1); });
    G.save();
  }
  const titulo = c => ({ loja: 'assalto ao(à) ' + (c.alvo && c.alvo.nome), banco: 'assalto ao banco', sequestro: 'sequestro de ' + c.vitima, incendio: 'incêndio no(a) ' + (c.alvo && c.alvo.nome), carro: 'roubos de carros', golpe: 'golpe do falso PIX' }[c.tipo]);

  // ---------- textos para jornal, delegacia e FBI ----------
  CR.manchete = S => { const s = sv(S); return s.noticias.length ? 'JORNAL: ' + pick(s.noticias.slice(0, 5)) : null; };
  CR.resumo = S2 => {
    const S = G.S, s = sv(S); const ab = s.casos.filter(c => c.estado === 'aberto'), fbi = s.casos.filter(c => c.estado === 'fbi'), pl = s.casos.filter(c => c.estado === 'planejando');
    let t = ab.length + ' caso(s) em aberto, ' + fbi.length + ' com o FBI';
    if (!s.serial.resolvido) t += ', assassino da Mata Escura solto (' + s.serial.vitimas + ' vítimas)';
    if (ab.length) t += '. Mais recente: ' + titulo(ab[ab.length - 1]);
    return t + '.';
  };
  CR.denuncia = S => {
    const s = sv(S), c = s.casos.filter(x => x.estado === 'aberto' || x.estado === 'fbi')[0];
    if (!c) return 'Obrigado, mas não há nenhum caso em aberto que precise da sua ajuda.';
    c.dica++; S.save.money += 80; G.save(); G.snd.cash();
    return 'Você deu uma pista sobre ' + titulo(c) + '. Recompensa de $80! Isso aumenta a chance de a polícia resolver o caso.';
  };

  // =====================================================================
  //  CENAS VISÍVEIS (assalto acontecendo perto de você)
  // =====================================================================
  function cena(S, c, tipo) {
    if (S.mode !== 'play' || !c.alvo) return;
    const P = S.player, d = Math.hypot(P.x - c.alvo.x, P.y - c.alvo.y); if (d > 1800) return;
    const pt = AI.randomRoadPoint(c.alvo.x, c.alvo.y, 60, 180, 80); if (!pt) return;
    const ladroes = [];
    for (let k = 0; k < (c.tipo === 'banco' ? 3 : 2); k++) {
      const p = AI.makePed(c.alvo.x + (k - 1) * 14, c.alvo.y + 8);
      Object.assign(p, { shirt: '#14161c', armed: true, weapon: 'pistol', state: 'walk', speed: 120, script: true, ladrao: true, cenaId: c.id }); S.peds.push(p); ladroes.push(p);
    }
    let carro = null;
    if (tipo === 'fuga') {
      carro = new G.Car({ x: pt.x, y: pt.y, a: pt.a, kind: 'sedan', color: '#2a2a30', driver: 'none', mode: 'parked' }); carro.hb = true; carro.pt = pt; S.cars.push(carro);
    }
    // a polícia chega pouco depois
    const pc = [];
    for (let k = 0; k < 2; k++) { const q = AI.randomRoadPoint(c.alvo.x, c.alvo.y, 700, 1100, 80); if (!q) continue; const v = new G.Car({ x: q.x, y: q.y, a: q.a, kind: 'police', color: '#ffffff', driver: 'ai', mode: 'wander', mass: 1.15 }); v.siren = true; v.ignoreLights = true; v.cruise = 300; v.max = 320; v.nav = AI.initNav(q.axis, q.idx, q.dir, q.along); v.nav.mode = 'goto'; v.nav.target = noMaisPerto(c.alvo); v.tag = 'crime'; S.cars.push(v); pc.push(v); }
    CR.cenas.push({ caso: c, tipo, ladroes, carro, pc, t: 0, fase: 'foge', resolvidoPorVoce: false, alvo: c.alvo });
  }
  const noMaisPerto = a => { let bi = 0, bj = 0, bd = 1e9; for (let i = 0; i <= W.COLS; i++) { const d = Math.abs(W.nodeX(i) - a.x); if (d < bd) { bd = d; bi = i; } } bd = 1e9; for (let j = 0; j <= W.ROWS; j++) { const d = Math.abs(W.nodeY(j) - a.y); if (d < bd) { bd = d; bj = j; } } return { i: bi, j: bj }; };

  function andaPed(o, tx, ty, v, dt) {
    const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy); if (d < 1) return 0;
    const st = Math.min(d, v * dt); o.x += dx / d * st; o.y += dy / d * st; o.h = Math.atan2(dy, dx) + Math.PI / 2; o.walk = (o.walk || 0) + st * 0.2; return d;
  }
  function atualizaCenas(S, dt) {
    CR.cenas = CR.cenas.filter(sc => {
      sc.t += dt; const P = S.player;
      const vivos = sc.ladroes.filter(p => p.state !== 'dead');
      if (vivos.length < sc.ladroes.length && !sc.resolvidoPorVoce && sc.fase !== 'fim') {   // você derrubou um bandido!
        sc.resolvidoPorVoce = true; const c = sc.caso; c.estado = 'resolvido'; const rec = c.tipo === 'banco' ? 1500 : 400; S.save.money += rec; G.save(); G.snd.cash();
        noticia(S, 'Cidadão ajuda a polícia e detém assaltantes do(a) ' + sc.alvo.nome + '. Recompensa de ' + $(rec) + '.', true); G.say('Você impediu o assalto! Recompensa: ' + $(rec), 6);
      }
      if (sc.fase === 'foge' && !sc.resolvidoPorVoce) {
        if (sc.tipo === 'fuga' && sc.carro && !sc.carro.dead) {
          let chegou = 0; vivos.forEach(p => { if (andaPed(p, sc.carro.x, sc.carro.y, 125, dt) < 22) chegou++; });
          if (chegou >= vivos.length && vivos.length) {
            S.peds = S.peds.filter(p => !sc.ladroes.includes(p)); G.snd.door();
            const c = sc.carro; c.driver = 'ai'; c.mode = 'wander'; c.hb = false; c.ignoreLights = true; c.cruise = 340; c.max = 360; c.nav = AI.initNav(c.pt.axis, c.pt.idx, c.pt.dir, c.pt.along); c.tag = null; sc.fase = 'fim'; sc.fimT = 0;
          }
        } else if (sc.tipo === 'flagrante') {
          vivos.forEach(p => { p.state = 'walk'; p.armed = false; });   // se rendem
          sc.fase = 'fim'; sc.fimT = 0;
        } else sc.fase = 'fim';
      }
      if (sc.fase === 'fim') { sc.fimT = (sc.fimT || 0) + dt; }
      // polícia chegou? para e fica olhando
      sc.pc.forEach(v => { if (!v.dead && v.mode === 'wander' && Math.hypot(v.x - sc.alvo.x, v.y - sc.alvo.y) < 160) { v.mode = 'parked'; v.driver = 'none'; v.hb = true; v.thr = 0; } });
      // some quando você se afasta ou depois de um tempo
      const longe = Math.hypot(P.x - sc.alvo.x, P.y - sc.alvo.y) > 2600;
      if (sc.t > 90 || longe) {
        S.peds = S.peds.filter(p => !sc.ladroes.includes(p)); S.cars = S.cars.filter(c => !(sc.pc.includes(c) && c.mode === 'parked')); sc.pc.forEach(c => c.tag = null);
        return false;
      }
      return true;
    });
  }

  // =====================================================================
  //  ACIDENTES E AMBULÂNCIA
  // =====================================================================
  let ultimoAcidente = -99;
  function acidente(S, x, y, vitima) {
    if (S.time - ultimoAcidente < 35 || CR.ambulancias.length >= 2) return;
    const P = S.player; if (Math.hypot(P.x - x, P.y - y) > 2200) return;
    ultimoAcidente = S.time;
    const r = CR.hospitalPara(x, y, S), q = AI.randomRoadPoint(x, y, 650, 1000, 80); if (!q) return;
    const v = new G.Car({ x: q.x, y: q.y, a: q.a, kind: 'ambulancia', color: '#f6f6f8', driver: 'ai', mode: 'wander', mass: 1.2 });
    v.siren = true; v.ignoreLights = true; v.cruise = 300; v.max = 320; v.nav = AI.initNav(q.axis, q.idx, q.dir, q.along); v.nav.mode = 'goto'; v.nav.target = noMaisPerto({ x, y });
    v.tag = 'crime'; S.cars.push(v);
    CR.ambulancias.push({ car: v, x, y, fase: 'vai', t: 0, h: r.h, lotado: r.lotado, perto: r.perto, vitima, paramed: [] });
  }
  function atualizaAmbulancias(S, dt) {
    CR.ambulancias = CR.ambulancias.filter(a => {
      a.t += dt; const c = a.car;
      if (c.dead || a.t > 220) { if (!c.dead) S.cars = S.cars.filter(o => o !== c); S.peds = S.peds.filter(p => !a.paramed.includes(p)); return false; }
      if (a.fase === 'vai') {
        if (Math.hypot(c.x - a.x, c.y - a.y) < 260 || a.t > 100) {
          c.mode = 'parked'; c.driver = 'none'; c.hb = true; c.thr = 0; a.fase = 'atende'; a.tt = 0;
          for (let k = 0; k < 2; k++) { const p = AI.makePed(c.x + Math.cos(c.a) * (24 + k * 12), c.y + Math.sin(c.a) * (24 + k * 12)); Object.assign(p, { shirt: '#e8eaee', script: true, speed: 70 }); S.peds.push(p); a.paramed.push(p); }
        }
      } else if (a.fase === 'atende') {
        a.tt += dt;
        const alvo = a.vitima && !a.vitima.dead ? a.vitima : { x: a.x, y: a.y };
        a.paramed.forEach((p, k) => andaPed(p, alvo.x + k * 14 - 7, alvo.y + 10, 115, dt));
        if (a.tt > 9) {
          if (a.vitima && a.vitima.state === 'down') { a.vitima.dead = true; }     // a vítima é levada na maca
          a.fase = 'volta'; a.tt = 0;
        }
      } else if (a.fase === 'volta') {
        a.tt += dt; a.paramed.forEach(p => andaPed(p, c.x, c.y, 115, dt));
        if (a.tt > 3.5 || a.paramed.every(p => Math.hypot(p.x - c.x, p.y - c.y) < 30)) {
          S.peds = S.peds.filter(p => !a.paramed.includes(p)); G.snd.door();
          c.driver = 'ai'; c.mode = 'wander'; c.hb = false; c.siren = true;
          c.nav = nav2(c); c.nav.mode = 'goto'; c.nav.target = noMaisPerto(a.h); a.fase = 'hospital'; a.tt = 0;
          noticia(S, 'ACIDENTE: vítima socorrida e levada ao ' + a.h.nome + (a.lotado ? ' (o ' + a.perto.nome + ' estava lotado)' : '') + '.', false); a.h.lot = Math.min(1, a.h.lot + 0.08);
        }
      } else if (a.fase === 'hospital') {
        a.tt += dt;
        if (Math.hypot(c.x - a.h.x, c.y - a.h.y) < 220 || a.tt > 90) { S.cars = S.cars.filter(o => o !== c); return false; }
      }
      return true;
    });
  }
  // navegação a partir da posição atual do carro (o mais perto de uma faixa)
  function nav2(c) {
    const T = W.T; const ix = clampi(Math.round((c.x / T - W.MG - W.ROAD / 2) / W.PITCH), 0, W.COLS), iy = clampi(Math.round((c.y / T - W.MG - W.ROAD / 2) / W.PITCH), 0, W.ROWS);
    const dxv = Math.abs(c.x - W.laneV(ix, 1)), dxv2 = Math.abs(c.x - W.laneV(ix, -1)), dyh = Math.abs(c.y - W.laneH(iy, 1)), dyh2 = Math.abs(c.y - W.laneH(iy, -1));
    const m = Math.min(dxv, dxv2, dyh, dyh2);
    if (m === dxv || m === dxv2) return AI.initNav('v', ix, m === dxv ? 1 : -1, c.y); return AI.initNav('h', iy, m === dyh ? 1 : -1, c.x);
  }
  const clampi = (v, a, b) => Math.max(a, Math.min(b, v));

  // =====================================================================
  //  ASSASSINO DA MATA, CORPOS E SEQUESTRADOS (aparecem quando você chega perto)
  // =====================================================================
  function materializa(S) {
    const s = sv(S), P = S.player, sr = s.serial;
    // corpos com fita da polícia
    if (!sr.resolvido) sr.corpos.forEach(c => {
      const d = Math.hypot(P.x - c.x, P.y - c.y);
      if (c.ped && S.peds.includes(c.ped) && c.ped.state === 'dead') c.ped.corpseT = 30;
      if (d < 700 && !(c.ped && S.peds.includes(c.ped))) {
        const p = AI.makePed(c.x, c.y); Object.assign(p, { state: 'dead', hp: 0, corpseT: 30, pool: 1, vx: 0, vy: 0 }); p.h = rand(0, TAU); S.peds.push(p); c.ped = p;
        if (G.combat.addDecal) for (let k = 0; k < 5; k++) G.combat.addDecal(S, 'blood', c.x + rand(-14, 14), c.y + rand(-12, 12), rand(5, 9), rand(0, TAU));
      }
    });
    // o assassino na cabana (só à noite ou se você chegar muito perto)
    if (!sr.resolvido && sr.cabana) {
      const d = Math.hypot(P.x - sr.cabana.x, P.y - sr.cabana.y);
      if (d < 260 && !(sr.ped && S.peds.includes(sr.ped) && sr.ped.state !== 'dead')) {
        if (!sr.matou) {
          const p = AI.makePed(sr.cabana.x - 60, sr.cabana.y + 70);
          Object.assign(p, { kind: 'thug', target: false, state: 'guard', weapon: 'bat', armed: true, hp: 170, shirt: '#2a1a14', speed: 80 }); S.peds.push(p); sr.ped = p;
          G.say('Uma cabana isolada no meio da mata... tem alguém ali dentro.', 5);
        }
      }
      if (sr.ped && sr.ped.state === 'dead' && !sr.matou) {
        sr.matou = true; sr.resolvido = true; S.save.money += 3000; G.save(); G.snd.cash();
        noticia(S, 'O assassino em série da Mata Escura foi morto! Um cidadão encontrou a cabana escondida. Recompensa de $3000.', true);
        G.banner('ASSASSINO DA MATA ESCURA', 'Você acabou com o terror da floresta! +$3000', false, 4);
      }
    }
    // sequestrado preso no cativeiro
    s.casos.forEach(c => {
      if (c.tipo !== 'sequestro' || c.estado === 'resolvido' || !c.loc || c.estado === 'planejando') return;
      const d = Math.hypot(P.x - c.loc.x, P.y - c.loc.y);
      if (d < 600 && !(c.refem && S.peds.includes(c.refem))) {
        const p = AI.makePed(c.loc.x, c.loc.y); Object.assign(p, { script: true, state: 'walk', speed: 0, shirt: '#8a4a6a', refem: true, nome: c.vitima }); p.walk = 0; S.peds.push(p); c.refem = p;
        c.guardas = []; for (let k = 0; k < 2; k++) { const g = AI.makePed(c.loc.x + (k ? 40 : -40), c.loc.y + 30); Object.assign(g, { kind: 'thug', target: false, state: 'guard', weapon: k ? 'pistol' : 'bat', armed: true, hp: 70, shirt: '#2b2b30' }); S.peds.push(g); c.guardas.push(g); }
        G.say('Você ouviu gritos abafados... alguém está sendo mantido aqui!', 5);
      }
    });
  }
  // interação: libertar refém / investigar cabana
  L.extrasAcao.push((S, P) => {
    const s = sv(S);
    for (const c of s.casos) {
      if (c.tipo !== 'sequestro' || !c.refem || c.estado === 'resolvido' || !S.peds.includes(c.refem)) continue;
      if (Math.hypot(c.refem.x - P.x, c.refem.y - P.y) < 38) {
        const guardas = (c.guardas || []).filter(g => g.state !== 'dead' && !g.dead);
        return { t: 'lugar', s: guardas.length ? 'ELIMINE OS SEQUESTRADORES PRIMEIRO' : 'E: LIBERTAR ' + c.vitima.toUpperCase(), run: () => {
          if (guardas.length) { G.say('Os sequestradores ainda estão armados! Acabe com eles antes de soltar o refém.', 4); return; }
          c.estado = 'resolvido'; S.save.money += Math.round(c.resgate * 0.1); G.save(); G.snd.cash(); S.peds = S.peds.filter(p => p !== c.refem);
          noticia(S, c.vitima + ' foi libertado(a) com vida por um cidadão. Família agradece e paga recompensa de ' + $(Math.round(c.resgate * 0.1)) + '.', true); G.banner('REFÉM LIBERTADO', c.vitima + ' está livre! +' + $(Math.round(c.resgate * 0.1)), false, 4);
        } };
      }
    }
    return null;
  });

  // desenho: fitas, cabana e cativeiros (chamado por cidade.js)
  CR.desenhar = function (ctx, S, x0, y0, x1, y1, t) {
    const s = sv(S), sr = s.serial;
    if (!sr.resolvido) sr.corpos.forEach(c => {
      if (c.x < x0 - 60 || c.x > x1 + 60 || c.y < y0 - 60 || c.y > y1 + 60) return;
      const r = 54; ctx.save(); ctx.strokeStyle = '#f2d21a'; ctx.lineWidth = 3; ctx.setLineDash([10, 6]); ctx.strokeRect(c.x - r, c.y - r, r * 2, r * 2); ctx.setLineDash([]);
      ctx.strokeStyle = '#16181c'; ctx.lineWidth = 1; ctx.setLineDash([6, 10]); ctx.strokeRect(c.x - r, c.y - r, r * 2, r * 2); ctx.restore();
      [[-r, -r], [r, -r], [-r, r], [r, r]].forEach(([a, b]) => { ctx.fillStyle = '#5a3e22'; ctx.fillRect(c.x + a - 2, c.y + b - 2, 4, 4); });
    });
    const cb = sr.cabana;
    if (cb && !sr.resolvido && cb.x > x0 - 120 && cb.x < x1 + 120 && cb.y > y0 - 120 && cb.y < y1 + 120) {
      const x = cb.x - 50, y = cb.y - 40;
      ctx.fillStyle = 'rgba(0,0,10,0.4)'; ctx.fillRect(x + 6, y + 8, 100, 72);
      ctx.fillStyle = '#4a3220'; ctx.fillRect(x, y, 100, 72);
      for (let k = 0; k < 7; k++) { ctx.fillStyle = k % 2 ? '#3e2a1a' : '#55392a'; ctx.fillRect(x, y + k * 10.3, 100, 9); }
      ctx.fillStyle = '#2a1a12'; ctx.beginPath(); ctx.moveTo(x - 6, y + 4); ctx.lineTo(x + 50, y - 22); ctx.lineTo(x + 106, y + 4); ctx.lineTo(x + 106, y + 26); ctx.lineTo(x - 6, y + 26); ctx.fill();
      ctx.fillStyle = '#16100c'; ctx.fillRect(x + 40, y + 46, 20, 26);                                           // porta
      ctx.fillStyle = Math.floor(t * 0.7) % 7 === 0 ? '#2a2a10' : '#e0a030'; ctx.fillRect(x + 10, y + 36, 16, 12);  // janela acesa
      ctx.fillStyle = 'rgba(255,170,40,0.12)'; ctx.beginPath(); ctx.arc(x + 18, y + 42, 36, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x + 118, y + 18, 3, 54); ctx.fillStyle = '#d8d0c0'; ctx.fillRect(x + 108, y + 24, 22, 4);  // varal
    }
  };

  // =====================================================================
  //  PLUMBING: dia, ganchos de acidente, jornal
  // =====================================================================
  let instalado = false, acc = 0, acc2 = 0;
  function instala() {
    instalado = true;
    const cc = G.carCrash;
    G.carCrash = function (a, b, imp, x, y) {
      cc.apply(this, arguments);
      if (imp > 140 && a.driver === 'ai' && (!b || b.driver === 'ai') && a.kind !== 'police' && !(b && b.kind === 'police') && a.kind !== 'ambulancia' && !(b && b.kind === 'ambulancia')) acidente(G.S, x, y, null);
    };
    const ch = G.combat.carHit;
    G.combat.carHit = function (S, p, c, sp) { const r = ch.apply(this, arguments); if (c.driver === 'ai' && c.kind !== 'ambulancia') acidente(S, p.x, p.y, p); return r; };
    // jornal da banca com as notícias de verdade
    const f = L.extrasAcao;
  }
  G.extras.add((S, dt) => {
    if (!S.save) return;
    if (!instalado && G.carCrash && G.combat) instala();
    const s = sv(S);
    const dia = Math.floor(S.dayT || 0);
    let n = 0; if (s.crimeDia > dia) s.crimeDia = dia;
    while (s.crimeDia < dia && n++ < 5) { s.crimeDia++; diaCrimes(S); }
    atualizaCenas(S, dt); atualizaAmbulancias(S, dt);
    acc += dt; if (acc > 0.6) { acc = 0; if (S.mode === 'play') materializa(S); }
  });
})(window.G = window.G || {});
