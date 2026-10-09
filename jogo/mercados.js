/* =====================================================================
   MERCADOS.JS — supermercados GIGANTES (Mercadão e Atacadão)
     Por dentro: sala enorme que rola com a câmera. Pegue um CARRINHO, escolha produtos nas
       gôndolas (frutas, doces, bebidas, padaria, congelados...), pague no CAIXA e coma depois (tecla X).
       Sair sem pagar é FURTO: a polícia é chamada. Com uma arma, dá para ameaçar os caixas!
     Por fora: ESTACIONAMENTO de verdade. Carros chegam, estacionam, os donos andam até a porta;
       clientes saem, voltam para o carro e vão embora. Tudo segue o horário do mercado.
   ===================================================================== */
(function (G) {
  'use strict';
  const L = G.lugares, K = L.kit, W = G.world, SP = G.sprites, ALIM = L.ALIM;
  const O = K.O, pick = K.pick, rand = K.rand, TAU = Math.PI * 2;
  const wrap = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };

  // ---------- produtos: preço e categorias ----------
  const PRECO = { banana: 3, maca: 3, laranja: 3, pao: 2, paoqueijo: 4, bolo: 12, coxinha: 5, linguica: 15, espetinho: 8, chocolate: 5, bala: 2, sorvete: 6, brigadeiro: 3, pirulito: 2, agua: 2, guarana: 4, suco: 5, cerveja: 6, energetico: 12, pizza: 18, lasanha: 22, marmita: 14 };
  const CAT = {
    frutas: { t: 'HORTIFRÚTI', ids: ['banana', 'maca', 'laranja'], cores: ['#f2d84a', '#d33a3a', '#f08a1a', '#3a9a3a'] },
    padaria: { t: 'PADARIA', ids: ['pao', 'paoqueijo', 'bolo', 'coxinha'], cores: ['#d8a860', '#e8c070', '#5a3220', '#d89a40'] },
    carnes: { t: 'AÇOUGUE E FRIOS', ids: ['linguica', 'espetinho'], cores: ['#c0504a', '#a8452a', '#e8a0a0', '#d86a5a'] },
    doces: { t: 'DOCES', ids: ['chocolate', 'bala', 'brigadeiro', 'pirulito', 'sorvete'], cores: ['#e84a8a', '#5a3220', '#f8c8e0', '#e8402a', '#f2d02a'] },
    bebidas: { t: 'BEBIDAS', ids: ['agua', 'guarana', 'suco', 'cerveja', 'energetico'], cores: ['#8ac8f0', '#3a9a3a', '#7a3a9a', '#e8b830', '#2ae0e8'] },
    congelados: { t: 'CONGELADOS', ids: ['pizza', 'lasanha', 'marmita'], cores: ['#e8a040', '#d8782a', '#8a6a3a', '#f0f0f0'] },
    sorvetes: { t: 'SORVETES', ids: ['sorvete', 'chocolate'], cores: ['#f8c8e0', '#c8f0c8', '#fff0a0', '#a8d0f8'] },
    limpeza: { t: 'LIMPEZA', ids: [], cores: ['#2a8ae0', '#e8e8f0', '#40c8a0', '#e8d02a'] },
    higiene: { t: 'HIGIENE', ids: [], cores: ['#e8a0c8', '#a0e0f0', '#f8f8f8', '#a0d890'] },
    enlatados: { t: 'MERCEARIA', ids: [], cores: ['#d03a2a', '#e8c030', '#3a7a3a', '#a85a2a'] }
  };
  const GRADE = [['doces', 'doces', 'enlatados', 'bebidas'], ['bebidas', 'higiene', 'congelados', 'congelados'], ['frutas', 'limpeza', 'padaria', 'doces'], ['enlatados', 'limpeza', 'higiene', 'bebidas']];

  const preco = (R, id) => Math.max(1, Math.round(PRECO[id] * R.mult));
  const totalCesta = R => R.cesta.itens.reduce((s, id) => s + preco(R, id), 0);
  function colocar(S, R, id) {
    const cap = R.carrinho ? 24 : 4;
    if (R.cesta.itens.length >= cap) { G.say(R.carrinho ? 'O carrinho está lotado!' : 'Suas mãos estão cheias! Pegue um CARRINHO na entrada.', 3); return; }
    R.cesta.itens.push(id); G.snd.pick && G.snd.pick(); G.say(ALIM[id].n + ' colocado ' + (R.carrinho ? 'no carrinho' : 'na mão') + '. Cesta: $' + totalCesta(R), 2);
  }
  function menuCat(S, R, cat) {
    const c = CAT[cat];
    L.abrirMenu(S, { titulo: c.t, info: (S2, R2) => 'CESTA: ' + R2.cesta.itens.length + ' itens — $' + totalCesta(R2), rodape: 'W/S escolher  ·  E colocar na cesta  ·  ESC fechar',
      itens: c.ids.map(id => ({ n: ALIM[id].n, cor: ALIM[id].cor, desc: 'Recupera ' + ALIM[id].hp + ' de vida' + (ALIM[id].energia ? ' + energia (corre mais)' : '') + (ALIM[id].bebado ? ' (álcool)' : ''), preco: preco(R, id), fn: (S2, R2) => colocar(S2, R2, id) })) });
  }
  function menuCaixa(S, R) {
    const tot = totalCesta(R);
    L.abrirMenu(S, { titulo: 'CAIXA — ' + R.nome, info: () => 'TOTAL $' + totalCesta(R), rodape: 'E confirmar  ·  ESC voltar às compras',
      itens: [
        { n: 'PAGAR TUDO', desc: R.cesta.itens.length + ' itens na cesta', preco: tot, fn: (S2, R2) => {
          const t = totalCesta(R2); if (!R2.cesta.itens.length) { G.say('Sua cesta está vazia.', 2.5); return 'fechar'; }
          if (!K.gasta(S2, t)) return;
          R2.cesta.itens.forEach(id => L.dar(S2, id, 1)); const n = R2.cesta.itens.length; R2.cesta.itens.length = 0; G.save();
          G.say('Compra paga: ' + n + ' itens por $' + t + '. Está na MOCHILA — aperte X para comer!', 5); return 'fechar';
        } },
        { n: 'DEVOLVER TUDO ÀS PRATELEIRAS', fn: (S2, R2) => { R2.cesta.itens.length = 0; G.say('Você devolveu tudo.', 2.5); return 'fechar'; } }
      ] });
  }

  // ---------- por dentro ----------
  const sala = { w: 1100, h: 700 };
  function criarSala(id, lg) {
    const pl = lg.place, S = G.S;
    const R = L.novaSala({ w: sala.w, h: sala.h, nome: pl.nome, cor: pl.cor, piso: 'ladrilho', pisoCores: ['#e8e4d8', '#d6d0be'], parede: '#d8d0b8', portaX: 620, subtitulo: 'aberto das ' + pl.horario[0] + 'h às ' + pl.horario[1] + 'h' });
    R.mult = pl.id === 'atacadao' ? 0.8 : 1; R.cesta = { itens: [] }; R.carrinho = null;
    R.hudTxt = (S2, R2) => (R2.cesta.itens.length ? 'CESTA: ' + R2.cesta.itens.length + ' itens — $' + totalCesta(R2) + (R2.carrinho ? '  (carrinho)' : '  (mãos)') : '');
    const add = (...a) => R.objs.push(...a);
    // seções do fundo
    add(O('balcao_padaria', 120, 195, 220, 30, { e: 28, label: 'COMPRAR NA PADARIA', r: 40, act: S2 => menuCat(S2, R, 'padaria') }));
    add(O('freezer', 400, 195, 230, 30, { e: 24, label: 'AÇOUGUE E FRIOS', r: 40, act: S2 => menuCat(S2, R, 'carnes') }));
    add(O('gondola', 700, 195, 200, 26, { e: 30, cores: CAT.frutas.cores, label: 'HORTIFRÚTI — FRUTAS', r: 40, act: S2 => menuCat(S2, R, 'frutas') }));
    add(O('freezer', 960, 195, 180, 30, { e: 24, label: 'SORVETES E GELADOS', r: 40, act: S2 => menuCat(S2, R, 'sorvetes') }));
    [['PADARIA', 150, '#c8782a'], ['AÇOUGUE', 470, '#a82a2a'], ['HORTIFRÚTI', 720, '#2e8b3e'], ['SORVETES', 1000, '#2a7ad8']].forEach(([t, x, c]) => add(O('placa_secao', x, 98, 100, 22, { solid: false, k: 1, texto: t, cor: c })));
    // gôndolas
    const cols = [140, 380, 620, 860], rows = [290, 390, 490, 590];
    rows.forEach((y, j) => cols.forEach((x, i) => {
      const cat = GRADE[j][i], c = CAT[cat], comida = c.ids.length > 0;
      add(O('gondola', x, y, 200, 24, { e: 34, cores: c.cores, nome: c.t, label: comida ? 'VER PRODUTOS — ' + c.t : undefined, r: 44, act: comida ? S2 => menuCat(S2, R, cat) : undefined }));
    }));
    // entrada: carrinhos e caixas
    const carrinhos = (x) => O('pilha_carrinhos', x, 790, 70, 38, { label: 'PEGAR UM CARRINHO', r: 44, act: (S2, R2) => {
      if (R2.carrinho) { if (R2.cesta.itens.length > 4) { const sob = R2.cesta.itens.length - 4; R2.cesta.itens.length = 4; G.say('Você devolveu o carrinho. ' + sob + ' itens voltaram para as prateleiras (só 4 cabem nas mãos).', 4); } else G.say('Carrinho devolvido.', 2.2); R2.carrinho = null; }
      else { R2.carrinho = { itens: R2.cesta.itens }; G.say('Você pegou um carrinho! Cabem até 24 itens.', 3); }
      R2.objs.forEach(o => { if (o.t === 'pilha_carrinhos') o.label = R2.carrinho ? 'DEVOLVER O CARRINHO' : 'PEGAR UM CARRINHO'; });
    } });
    add(carrinhos(100), carrinhos(1020));
    const regs = [150, 290, 800, 930, 1060];
    regs.forEach((x, k) => add(O('caixa_reg', x, 715, 100, 40, { aberto: true, label: 'PAGAR NO CAIXA ' + (k + 1), r: 46, act: S2 => menuCaixa(S2, R) })));
    add(O('planta', 90, 650, 36, 44, {}), O('planta', 1110, 650, 36, 44, {}));
    // paredes decoradas e luzes
    R.deco = x => {
      for (let k = 0; k < 9; k++) { x.fillStyle = k % 2 ? '#e8402a' : '#f2d02a'; x.beginPath(); x.moveTo(110 + k * 125, 62); x.lineTo(150 + k * 125, 62); x.lineTo(130 + k * 125, 84); x.fill(); }
      K.neon(x, pl.nome, 620, 110, 30, pl.id === 'atacadao' ? '#ffd24a' : '#7aff9a');
      K.cartaz(x, 90, 70, 60, 50, '#e8402a', ['OFERTA', pl.id === 'atacadao' ? '-20%' : 'HOJE']); K.cartaz(x, 1040, 70, 60, 50, '#2a58b8', ['CAIXAS', 'RÁPIDOS']);
      x.fillStyle = 'rgba(0,0,0,0.07)'; for (let k = 0; k < 5; k++) x.fillRect(70, 270 + k * 100 + 40, 1100, 14);
    };
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) R.luzes.push({ x: 240 + i * 260, y: 330 + j * 200, r: 230 });
    // pessoas
    const lk = (o) => Object.assign(SP.randomLook(), o);
    const caixas = regs.map((x, k) => { const n = { x: x + 50, y: 778, p: lk({ shirt: pl.id === 'atacadao' ? '#d9a40a' : '#2e8b3e', pat: 'liso', sleeve: 'curta', acc: 'none' }), falas: ['Bom dia! Passa o cartão ou é no dinheiro?', 'Quer CPF na nota?', 'Próximo da fila!'], h: 0, fixo: true, nome: pick(G.vida.NOMES_F) + ' (caixa)', label: 'FALAR', ameacavel: true, dinheiro: Math.round(rand(150, 500)) }; n.ameaca = (S2, R2, nn) => { if (nn.roubado) { K.bolha(nn.p, 'O caixa já está vazio!', 3); return; } nn.roubado = true; K.bolha(nn.p, 'TÁ BOM! Leva tudo, mas não me machuca!', 4); S2.save.money += nn.dinheiro; G.save(); G.snd.cash(); G.say('ASSALTO AO CAIXA! Você levou $' + nn.dinheiro + '.', 4); K.chamaPolicia(S2, R2, 4); }; return n; });
    R.npcs.push(...caixas);
    R.npcs.push({ x: 470, y: 810, p: lk({ shirt: '#1a2a4a', pat: 'liso', sleeve: 'curta', acc: 'cap', accCol: '#1a2a4a', fem: false, hairStyle: 'raspado' }), falas: ['Fique à vontade. Não faça confusão.', 'Câmeras por todo lado, hein.', 'Furto aqui é problema sério.'], h: 0.4, fixo: true, nome: 'Segurança', ameaca: (S2, R2, nn) => { K.bolha(nn.p, 'LARGUE ISSO! POLÍCIA!', 3); K.chamaPolicia(S2, R2, 3); } });
    R.npcs.push({ x: 230, y: 168, p: lk({ shirt: '#f4f0e8', pat: 'liso', sleeve: 'curta', acc: 'hat', accCol: '#f4f0e8', fem: false }), falas: ['O pão saiu agorinha!', 'Pão francês quentinho!'], h: Math.PI, fixo: true, nome: 'Padeiro', label: 'COMPRAR NA PADARIA', act: S2 => menuCat(S2, R, 'padaria'), ameacavel: true });
    R.shopT = 0;
    R.onUpdate = (S2, R2, dt) => compradores(S2, R2, dt);
    R.aoSair = (S2, R2) => {
      if (R2.cesta.itens.length) {
        const n = R2.cesta.itens.length; R2.cesta.itens.forEach(id => L.dar(S2, id, 1)); R2.cesta.itens.length = 0; G.addHeat(35); G.save();
        G.say('FURTO! Você saiu sem pagar ' + n + ' itens. O segurança chamou a POLÍCIA!', 5); G.snd.beep();
      }
      R2.carrinho = null; return true;
    };
    return R;
  }

  // clientes passeando com rotina: entram, escolhem coisas, vão ao caixa e saem
  const LANES = [346, 446, 546, 660];
  function compradores(S, R, dt) {
    const m = R.mercado || (R.mercado = W.mercados.find(q => q.place.id === R.lugar.place.id)), h = L.hora(S);
    const pico = (h > 9 && h < 11.5) || (h > 17 && h < 19.5);
    const alvo = Math.min(11, (pico ? 6 : 3) + (m ? m.dentro : 0));
    const agora = R.npcs.filter(n => n.cliente).length;
    R.shopT -= dt;
    if (R.shopT <= 0 && agora < alvo) {
      R.shopT = rand(2.5, 6);
      const n = { x: R.portaX + rand(-20, 20), y: R.y1 - 10, p: Object.assign(SP.randomLook(), { acc: 'none' }), falas: ['Será que o leite está em promoção?', 'Esqueci a lista de compras!', 'Preço absurdo, hein?', 'Essa fila nunca anda.', 'Você viu onde ficam os biscoitos?'], h: 0, cliente: true, nome: pick(G.vida.NOMES_M.concat(G.vida.NOMES_F)) + ' ' + pick(G.vida.SOBRENOMES), v: rand(48, 70), vida: rand(30, 75), dinheiro: Math.round(rand(20, 160)) };
      R.npcs.push(n); proximoPasso(R, n);
    }
    R.npcs.forEach(n => {
      if (!n.cliente || n.rota && n.rota.length || n.alvo) return;
      if (n.saindo) { const i = R.npcs.indexOf(n); if (i >= 0) R.npcs.splice(i, 1); if (m && m.dentro > 0) m.dentro--; return; }
      n.espera = (n.espera || 0) - dt;
      if (n.espera > 0) return;
      n.vida -= 4;
      if (n.vida <= 0) { n.saindo = true; K.rota(n, [{ x: n.x, y: 660 }, { x: R.portaX, y: 660 }, { x: R.portaX, y: R.y1 + 4 }]); return; }
      proximoPasso(R, n);
    });
  }
  function proximoPasso(R, n) {
    const lane = pick(LANES), corr = Math.random() < 0.5 ? 108 : 1118, destX = rand(150, 1090);
    const pts = [{ x: n.x, y: 660 }, { x: corr, y: 660 }];
    if (lane !== 660) pts.push({ x: corr, y: lane });
    pts.push({ x: destX, y: lane });
    K.rota(n, pts, nn => { nn.espera = rand(1.5, 4); nn.h = 0; if (Math.random() < 0.5) K.bolha(nn.p, pick(nn.falas), 3); });
  }

  L.construtores['tipo:mercado'] = { criar(id, lg) { return criarSala(id, lg); } };

  // =====================================================================
  //  ESTACIONAMENTO COM VIDA
  // =====================================================================
  W.mercados.forEach(m => { m.dentro = 0; m.carros = []; m.vagaLivre = m.vagas.map(() => true); m.t = rand(2, 5); m.perto = false; });
  const aberto = (S, m) => { const h = L.hora(S); return h >= m.def.horario[0] && h < m.def.horario[1] - 0.3; };
  const CORES = G.ai.CAR_COLORS;

  function criaCarroParado(S, m, k) {
    const v = m.vagas[k]; if (!m.vagaLivre[k]) return null;
    const c = new G.Car({ x: v.x, y: v.y, a: v.a, kind: Math.random() < 0.15 ? 'taxi' : 'sedan', color: pick(CORES), driver: 'none', mode: 'parked' });
    c.hb = true; c.vaga = k; c.mercado = m; c.dono = true; m.vagaLivre[k] = false; m.carros.push(c); S.cars.push(c); return c;
  }
  // roteiro (lista de pontos) para ENTRAR numa vaga
  function pontosChegada(m, v) {
    const lane = m.laneY, gx = m.gateX, ay = m.aisleY, T = W.T;
    const pts = [{ x: gx + 18, y: lane }, { x: gx + 8, y: lane - 40 }, { x: gx, y: ay + 30 }, { x: gx - 10, y: ay }];
    if (v.x < gx - 60) pts.push({ x: v.x + 40, y: ay });
    pts.push({ x: v.x, y: ay + (v.fila === 'A' ? 4 : -4) });
    pts.push({ x: v.x, y: v.y, fim: true, a: v.a });
    return pts;
  }
  function pontosSaida(m, v) {
    const lane = m.laneY, gx = m.gateX, ay = m.aisleY;
    const pts = [{ x: v.x, y: ay, rev: true }];
    pts.push({ x: v.x + 50, y: ay }, { x: gx - 20, y: ay }, { x: gx, y: ay + 40 }, { x: gx + 2, y: lane - 30 }, { x: gx - 40, y: lane }, { x: gx - 700, y: lane, fimTotal: true });
    return pts;
  }
  function criaScript(S, m, c, pts, tipo, k) { c.mode = 'script'; c.driver = 'ai'; c.hb = false; c.script = { pts, i: 0, tipo, k, m }; if (!S.cars.includes(c)) S.cars.push(c); }

  G.mercadosScript = function (c, dt) {
    const sc = c.script; if (!sc) { c.mode = 'parked'; c.driver = 'none'; return; }
    const p = sc.pts[sc.i]; if (!p) { c.mode = 'parked'; c.driver = 'none'; c.hb = true; return; }
    const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy), perto = p.fim ? 3 : 20;
    let v = p.fim ? Math.min(70, 20 + d * 2.2) : sc.tipo === 'chega' ? 105 : 85;
    // algum carro/pedestre muito à frente? para
    const fx = Math.sin(c.a) * (p.rev ? -1 : 1), fy = -Math.cos(c.a) * (p.rev ? -1 : 1);
    for (const o of G.S.cars) { if (o === c || o.dead) continue; const ox = o.x - c.x, oy = o.y - c.y; if (ox * ox + oy * oy < 90 * 90 && (ox * fx + oy * fy) > 8 && Math.abs(ox * fy - oy * fx) < 26) { v = 0; break; } }
    if (d < perto) {
      if (p.fim) { c.x = p.x; c.y = p.y; c.a = p.a; c.vx = c.vy = 0; chegou(c, sc); return; }
      if (p.fimTotal) { c.removeMe = true; c.vx = c.vy = 0; return; }
      sc.i++; return;
    }
    if (p.rev) { c.vx = -Math.sin(c.a) * v; c.vy = Math.cos(c.a) * v; c.x += c.vx * dt; c.y += c.vy * dt; c.steer = 0; }
    else {
      const want = Math.atan2(dx, -dy), df = wrap(want - c.a); c.a += df * Math.min(1, 3.6 * dt);
      if (p.fim) c.a += wrap(p.a - c.a) * Math.min(1, 2.5 * dt);
      c.steer = Math.max(-1, Math.min(1, df * 1.5)); c.vx = Math.sin(c.a) * v; c.vy = -Math.cos(c.a) * v; c.x += c.vx * dt; c.y += c.vy * dt;
    }
    c.brakeLight = v < 30; c.lights = true;
    if (sc.tipo === 'sai' && sc.i === 0 && p.rev && Math.hypot(c.x - p.x, c.y - p.y) < 22) sc.i++;
  }
  function chegou(c, sc) {
    const m = sc.m, S = G.S;
    c.mode = 'parked'; c.driver = 'none'; c.hb = true; c.script = null; c.vaga = sc.k; c.steer = 0; c.dono = true;
    // dono desce do carro e anda até a porta
    const pl = m.place, ped = G.ai.makePed(c.x + (c.a ? -14 : 14), c.y + 4);
    ped.alvoMov = { x: pl.x + rand(-14, 14), y: pl.y + 6 }; ped.state = 'walk'; ped.res = true;
    ped.fimMov = (p, S2) => { const i = S2.peds.indexOf(p); if (i >= 0) S2.peds.splice(i, 1); m.dentro++; m.entrou = (m.entrou || 0) + 1; };
    S.peds.push(ped);
  }
  // alguém sai do mercado, anda até o carro e vai embora
  function saidaDe(S, m, c) {
    if (!c || c.dead || c.mode !== 'parked' || c.saindo) return;
    c.saindo = true; const pl = m.place, ped = G.ai.makePed(pl.x + rand(-14, 14), pl.y + 6);
    ped.state = 'walk'; ped.res = true; ped.alvoMov = { x: c.x + (c.a ? -12 : 12), y: c.y + 4 };
    ped.fimMov = (p, S2) => { const i = S2.peds.indexOf(p); if (i >= 0) S2.peds.splice(i, 1); if (c.dead || S2.cars.indexOf(c) < 0 || c.driver === 'player') { c.saindo = false; return; } const v = m.vagas[c.vaga]; if (m.dentro > 0) m.dentro--; G.snd.door && Math.hypot(c.x - S2.player.x, c.y - S2.player.y) < 500 && G.snd.door(); c.vaga2 = c.vaga; criaScript(S2, m, c, pontosSaida(m, v), 'sai', c.vaga); m.vagaLivre[c.vaga] = true; };
    S.peds.push(ped);
  }

  L.extrasAtualizar.push((S, dt) => {
    const P = S.player, ref = P.car || P;
    W.mercados.forEach(m => {
      const d = Math.hypot(m.blk.x + m.blk.w / 2 - ref.x, m.blk.y + m.blk.h / 2 - ref.y);
      // limpa carros que sumiram
      m.carros = m.carros.filter(c => S.cars.includes(c) && !c.removeMe);
      for (const c of S.cars) if (c.removeMe) S.cars.splice(S.cars.indexOf(c), 1);
      m.vagaLivre = m.vagas.map((v, k) => !m.carros.some(c => c.vaga === k && !c.saindo || (c.script && c.script.k === k && c.script.tipo === 'chega')));
      if (d > 1500) { m.perto = false; return; }
      if (!m.perto) {   // acabou de chegar perto: enche o estacionamento
        m.perto = true; m.t = rand(2, 4);
        const aberta = aberto(S, m), alvo = aberta ? Math.floor(m.vagas.length * rand(0.3, 0.55)) : 0;
        let ocup = m.carros.length; for (let k = 0; k < m.vagas.length && ocup < alvo; k++) if (m.vagaLivre[k] && Math.random() < 0.5) { if (criaCarroParado(S, m, k)) { ocup++; m.dentro++; } }
      }
      if (d > 1000) return;
      m.t -= dt;
      if (m.t > 0) return;
      const aberta = aberto(S, m), h = L.hora(S), pico = (h > 9 && h < 11.5) || (h > 17 && h < 19.5);
      m.t = rand(pico ? 3 : 6, pico ? 7 : 14);
      const ocupadas = m.carros.filter(c => c.mode === 'parked' && !c.saindo && c.vaga != null);
      const chegando = m.carros.filter(c => c.mode === 'script').length;
      // saídas: sempre que está fechando, ou aleatório
      if (ocupadas.length && (!aberta || Math.random() < 0.5)) { saidaDe(S, m, pick(ocupadas)); if (!aberta) m.t = 1.2; return; }
      // chegadas
      if (aberta && chegando < 2 && ocupadas.length < m.vagas.length - 3) {
        const livres = m.vagas.map((v, k) => k).filter(k => m.vagaLivre[k]); if (!livres.length) return;
        const k = pick(livres), v = m.vagas[k], c = new G.Car({ x: m.gateX + 700, y: m.laneY, a: -Math.PI / 2, kind: Math.random() < 0.12 ? 'taxi' : 'sedan', color: pick(CORES), driver: 'ai', mode: 'script' });
        c.vx = -80; c.vy = 0; c.vaga = k; m.vagaLivre[k] = false; criaScript(S, m, c, pontosChegada(m, v), 'chega', k); m.carros.push(c);
      }
    });
  });
})(window.G = window.G || {});
