/* =====================================================================
   HOTEIS.JS — 4 hotéis para visitar, do LUXO ao MAIS FEIO
     GRAND HOTEL (5 estrelas): saguão de mármore, restaurante com garçons, piscina, cozinha gigante
     HOTEL CENTRAL (3 estrelas) · HOTEL ESTRELA (2 estrelas) · PENSÃO DO ZÉ (1 estrela, bem feia)
   Na RECEPÇÃO você aluga um quarto (vale até as 10h do dia seguinte). Quarto alugado = cama que salva o jogo.
   No RESTAURANTE sente numa cadeira, escolha no cardápio e o GARÇOM traz o pedido até a mesa.
   Hóspedes de verdade moram no hotel: cada um tem sua rotina (café, piscina, jantar, dormir...).
   ===================================================================== */
(function (G) {
  'use strict';
  const L = G.lugares, K = L.kit, V = G.vida, W = G.world, SP = G.sprites, ALIM = L.ALIM;
  const O = K.O, pick = K.pick, rand = K.rand;

  // ---------- como cada hotel é ----------
  const NIVEIS = {
    luxo: { mult: 3, piscina: true, piso: 'xadrez', pc: ['#f4f0e6', '#cdc6b4'], parede: '#e8dcc0', luz: 1, hospedes: 9, quartos: [['suite', 'Suíte Presidencial', 200], ['luxo', 'Quarto Luxo', 120], ['standard', 'Quarto Standard', 80]] },
    medio: { mult: 1.8, piscina: true, piso: 'carpete', pc: ['#3a5a8a', '#34527e'], parede: '#c8d0dc', luz: 0.9, hospedes: 6, quartos: [['exec', 'Quarto Executivo', 60], ['standard', 'Quarto Standard', 40]] },
    simples: { mult: 1.1, piscina: false, piso: 'ladrilho', pc: ['#d8d0b8', '#c8c0a4'], parede: '#c8bea0', luz: 0.8, hospedes: 4, quartos: [['casal', 'Quarto de Casal', 30], ['solteiro', 'Quarto de Solteiro', 20]] },
    feio: { mult: 0.7, piscina: false, piso: 'ladrilho', pc: ['#8a8470', '#76705e'], parede: '#7a7462', luz: 0.55, hospedes: 3, quartos: [['pensao', 'Quartinho sem janela', 10], ['pensao', 'Colchão no quarto coletivo', 6]] }
  };
  const BASE_COMIDA = [
    { id: 'cafe', n: 'Café da manhã completo', hp: 18, preco: 12, h: [6, 10.5], cor: '#e8c070', desc: 'só até as 10h30' },
    { id: 'prato', n: 'Prato do dia', hp: 40, preco: 18, cor: '#c8782a' },
    { id: 'burger', n: 'Hambúrguer artesanal', hp: 28, preco: 14, cor: '#a8602a', min: 'simples' },
    { id: 'pizza', n: 'Pizza', hp: 32, preco: 16, cor: '#e8a040', min: 'simples' },
    { id: 'salada', n: 'Salada', hp: 15, preco: 10, cor: '#4ab04a', min: 'medio' },
    { id: 'sobremesa', n: 'Sobremesa da casa', hp: 12, preco: 8, cor: '#f8c8e0', min: 'medio' },
    { id: 'lagosta', n: 'Lagosta ao molho', hp: 70, preco: 30, cor: '#e8603a', min: 'luxo', energia: 20 },
    { id: 'suco', n: 'Suco natural', hp: 8, preco: 5, cor: '#f08a1a' },
    { id: 'cerveja', n: 'Cerveja gelada', hp: 8, preco: 6, cor: '#e8b830', bebado: 8 },
    { id: 'champanhe', n: 'Champanhe', hp: 10, preco: 25, cor: '#f0e0a0', min: 'luxo', bebado: 12 }
  ];
  const ORD = { feio: 0, simples: 1, medio: 2, luxo: 3 };
  const menuComida = (nv, nivelDef) => BASE_COMIDA.filter(i => !i.min || ORD[nv] >= ORD[i.min]).map(i => Object.assign({}, i, { preco: Math.max(1, Math.round(i.preco * nivelDef.mult)) }));

  const TIPOS_QUARTO = {
    suite: { w: 700, h: 430, piso: 'madeira', pc: ['#6a4a2e', '#563a22'], parede: '#e8dcc0', nome: 'SUÍTE PRESIDENCIAL' },
    luxo: { w: 560, h: 380, piso: 'carpete', pc: ['#7a2a3a', '#6a2232'], parede: '#e6dcc4', nome: 'QUARTO LUXO' },
    standard: { w: 500, h: 340, piso: 'carpete', pc: ['#8a9ab8', '#7a8aa8'], parede: '#d8d4c4', nome: 'QUARTO STANDARD' },
    exec: { w: 500, h: 340, piso: 'carpete', pc: ['#4a6a4a', '#425e42'], parede: '#c8d0c0', nome: 'QUARTO EXECUTIVO' },
    casal: { w: 440, h: 320, piso: 'ladrilho', pc: ['#d8d0b8', '#c8c0a4'], parede: '#d0c8a8', nome: 'QUARTO DE CASAL' },
    solteiro: { w: 400, h: 300, piso: 'ladrilho', pc: ['#d0c8b0', '#c0b89c'], parede: '#c8c0a4', nome: 'QUARTO DE SOLTEIRO' },
    pensao: { w: 380, h: 290, piso: 'ladrilho', pc: ['#8a8470', '#6e6a58'], parede: '#6a6454', nome: 'QUARTO DA PENSÃO' }
  };

  // ---------- quartos alugados ----------
  const reservaDe = (S, id) => { const q = S.save.quartos && S.save.quartos[id]; return q && S.dayT <= q.ate ? q : null; };
  function alugar(S, R, hotel, tipo, nome, preco) {
    if (reservaDe(S, hotel.id)) { G.say('Você já tem um quarto aqui (nº ' + reservaDe(S, hotel.id).n + '). Suba pelo elevador.', 3.5); return; }
    if (!K.gasta(S, preco)) return;
    const n = 101 + Math.floor(Math.random() * 8); S.save.quartos = S.save.quartos || {};
    S.save.quartos[hotel.id] = { n, tipo, nome, ate: Math.ceil(S.dayT) + 0.1667 }; G.save();
    G.say('Quarto ' + n + ' (' + nome + ') alugado por $' + preco + '! Use o ELEVADOR. Vale até as 10h de amanhã.', 6); G.snd.cash();
  }
  function menuRecepcao(S, R, hotel, nv) {
    const q = reservaDe(S, hotel.id);
    const itens = nv.quartos.map(([tipo, nome, preco]) => ({ n: nome, preco, desc: 'check-out às 10h do dia seguinte' + (tipo === 'suite' ? ' · jacuzzi e vista' : tipo === 'pensao' ? ' · sem comentários...' : ''), fn: (S2, R2) => { alugar(S2, R2, hotel, tipo, nome, preco); return 'fechar'; } }));
    L.abrirMenu(S, { titulo: 'RECEPÇÃO — ' + hotel.nome, itens, info: q ? 'SEU QUARTO: ' + q.n : '', rodape: 'E alugar  ·  ESC sair' });
  }

  // ---------- hóspedes com rotina ----------
  function gerarHospedes(pl, nv) {
    const r = W.mulberry32(pl.nome.length * 977 + 11), n = nv.hospedes, g = [];
    const perfis = ['turista', 'executivo', 'noturno'];
    for (let i = 0; i < n; i++) {
      const fem = r() < 0.45, lk = SP.randomLook(); lk.fem = fem; lk.dress = fem && r() < 0.5;
      g.push({ i, nome: pick(fem ? V.NOMES_F : V.NOMES_M) + ' ' + pick(V.SOBRENOMES), p: lk, perfil: perfis[Math.floor(r() * 3)], quarto: i, dinheiro: Math.round((40 + r() * (pl.nivel === 'luxo' ? 400 : 120)) / 5) * 5, sala: null, n: null, at: null });
    }
    return g;
  }
  function atividade(g, h, nv) {
    const e = (a, b) => a <= b ? h >= a && h < b : h >= a || h < b;
    const lazer = nv.piscina ? 'piscina' : 'saguao';
    switch (g.perfil) {
      case 'executivo': return e(6, 7.5) ? 'comer' : e(7.5, 18) ? 'fora' : e(18, 19.5) ? 'saguao' : e(19.5, 21) ? 'comer' : 'quarto';
      case 'noturno': return e(6, 14) ? 'quarto' : e(14, 17) ? lazer : e(17, 19) ? 'saguao' : e(19, 24) ? 'comer' : e(0, 3) ? 'saguao' : 'quarto';
      default: return e(6, 7) ? 'quarto' : e(7, 10) ? 'comer' : e(10, 15) ? lazer : e(15, 17) ? 'saguao' : e(17, 21.5) ? 'comer' : 'quarto';
    }
  }
  const TXT_AT = { comer: 'no restaurante', piscina: 'na piscina', saguao: 'no saguão', quarto: 'no quarto', fora: 'passeando pela cidade' };
  function destino(lg, g, at, S) {
    const salas = lg.salas;
    if (at === 'quarto' || at === 'fora') return null;
    if (at === 'comer') { const n = lg.nCad || 24; const k = (g.i * 3 + 1) % n; return { sala: 'restaurante', cad: k, sentado: true }; }
    if (at === 'piscina') { const k = g.i % 6; return { sala: 'piscina', x: 150 + (k % 3) * 120 + 20, y: k < 3 ? 222 : 492, sentado: true, h: 0 }; }
    return { sala: 'lobby', x: pick([160, 220, 660, 720, 300, 450, 600]), y: pick([420, 420, 330, 300]), h: Math.PI };
  }
  function npcDe(g) { return { x: 0, y: 0, p: g.p, nome: g.nome, dinheiro: g.dinheiro, falas: falasHospede(g), h: Math.PI, g, v: 56 }; }
  function falasHospede(g) {
    const a = ['Estou hospedado aqui há ' + (2 + g.i) + ' dias.', 'Este hotel é ótimo para descansar.', 'Cuidado com o chão molhado perto da piscina!', 'Já provou o café da manhã daqui?', g.perfil === 'executivo' ? 'Viajo a trabalho. Reunião às 9h.' : g.perfil === 'noturno' ? 'Sou de ficar acordado até tarde...' : 'Estou de férias! A cidade é linda.'];
    return a;
  }
  function sincroniza(S, lg, R, snap) {
    const nv = lg.nv, h = L.hora(S);
    lg.hospedes.forEach(g => {
      const at = atividade(g, h, nv); if (g.at === at && !snap) return; g.at = at;
      const d = destino(lg, g, at, S), antes = g.sala; g.dest = d; g.sala = d ? d.sala : null;
      if (snap || !R) { g.n = null; return; }
      const i = R.npcs.indexOf(g.n);
      if (antes === R.id && g.sala !== R.id) { // some pela porta mais próxima
        if (g.n && i >= 0) { const n = g.n; n.semColisao = true; K.rota(n, [{ x: R.chegada.x, y: R.chegada.y }], nn => { const j = R.npcs.indexOf(nn); if (j >= 0) R.npcs.splice(j, 1); }); }
        g.n = null; return;
      }
      if (g.sala === R.id) {
        let n = g.n; if (!n || i < 0) { n = npcDe(g); n.x = R.chegada.x; n.y = R.chegada.y; g.n = n; R.npcs.push(n); }
        coloca(R, g, n, false);
      }
    });
  }
  // põe o hóspede no seu lugar final (snap) ou manda andar até lá
  function coloca(R, g, n, snap) {
    const d = g.dest; let x = d.x, y = d.y;
    if (d.cad != null) { const c = R.cadeiras[d.cad % R.cadeiras.length]; if (R.sentado && R.sentado.o === c) return; x = c.x + c.w / 2; y = c.y + c.h / 2 - 2; n.cad = c; d.h = c.h2; }
    n.sentado = false; n.semColisao = !!d.sentado;
    const fim = nn => { nn.sentado = !!d.sentado; if (d.h != null) nn.h = d.h; if (d.cad != null) nn.leva = Math.random() < 0.6 ? '#c8782a' : null; };
    if (snap) { n.x = x; n.y = y; fim(n); return; }
    const lane = R.id === 'restaurante' ? 235 : R.id === 'piscina' ? 235 : 255;
    K.rota(n, [{ x: n.x, y: lane }, { x, y: lane }, { x, y }], fim);
  }
  function povoar(S, R) {
    const lg = R.lugar; R.npcs.length = 0; R.npcs.push(...(R.fixos || []));
    lg.hospedes.forEach(g => { if (g.sala === R.id && g.dest) { const n = npcDe(g); g.n = n; R.npcs.push(n); coloca(R, g, n, true); } else if (g.n) g.n = null; });
  }

  // ---------- as salas ----------
  const porta = (x, y, w, o) => O('porta', x, y, w, 54, Object.assign({ solid: false, k: 10, r: 50 }, o));
  const lookStaff = o => Object.assign(SP.randomLook(), { acc: 'none' }, o);
  function nova(lg, id, o) {
    const nv = lg.nv, R = L.novaSala(Object.assign({ place: lg.place, nome: lg.place.nome, cor: lg.place.cor, piso: nv.piso, pisoCores: nv.pc, parede: nv.parede }, o));
    R.chegada = { x: R.portaX, y: R.y1 - 30 }; R.fixos = []; R.id = id;
    R.aoEntrar = (S, R2) => { povoar(S, R2); };
    R.onUpdate = (S, R2, dt) => { const g = R2.lugar; g.sinc = (g.sinc || 0) - dt; if (g.sinc <= 0) { g.sinc = 1.5; sincroniza(S, g, R2, false); } if (R2.extra) R2.extra(S, R2, dt); };
    return R;
  }
  const fixo = (R, n) => { R.fixos.push(n); R.npcs.push(n); return n; };

  function saguao(S, lg) {
    const pl = lg.place, nv = lg.nv, luxo = pl.nivel === 'luxo';
    const R = nova(lg, 'lobby', { w: 760, h: 420, portaX: 450, subtitulo: '★'.repeat(pl.estrelas) + '  ' + (luxo ? 'luxo' : pl.nivel === 'medio' ? 'conforto' : pl.nivel === 'simples' ? 'simples' : 'econômico') });
    R.chegada = { x: 450, y: 540 };
    const add = (...a) => R.objs.push(...a);
    add(O('tapete', 270, 300, 360, 140, { solid: false, k: -50 }));
    add(O('recepcao', 300, 190, 300, 40, { e: 30, label: 'ALUGAR UM QUARTO', r: 44, act: S2 => menuRecepcao(S2, R, pl, nv) }));
    add(porta(130, 96, 60, { cor: '#5a3a22', placa: 'RESTAURANTE', label: 'IR AO RESTAURANTE', act: S2 => L.irSala(S2, 'restaurante', 220, 590, Math.PI) }));
    add(porta(640, 96, 56, { estilo: 'elevador', placa: 'ELEVADOR', label: 'SUBIR PARA OS QUARTOS', act: S2 => { const q = reservaDe(S2, pl.id); G.say(q ? 'Subindo para o andar dos quartos. Seu quarto é o ' + q.n + '.' : 'Subindo. (Para ter um quarto, alugue na recepção.)', 3.5); L.irSala(S2, 'corredor', 120, 300, Math.PI); } }));
    if (nv.piscina) add(porta(730, 96, 60, { estilo: 'vai-vem', placa: 'PISCINA', label: 'IR À PISCINA', act: S2 => L.irSala(S2, 'piscina', 160, 590, Math.PI) }));
    add(O('sofa', 110, 420, 170, 44, { e: 18, r: 30, label: 'SENTAR NO SOFÁ', act: S2 => { K.cura(S2, 6); G.say('Sofá macio. (+6 vida)', 2.5); } }), O('sofa', 620, 420, 170, 44, { e: 18, r: 30, label: 'SENTAR NO SOFÁ', act: S2 => { K.cura(S2, 6); G.say('Sofá macio. (+6 vida)', 2.5); } }));
    add(O('planta', 90, 190, 40, 50, {}), O('planta', 780, 330, 40, 50, {}), O('planta', 90, 330, 40, 50, {}));
    if (luxo) add(O('planta', 270, 250, 36, 44, {}), O('planta', 600, 250, 36, 44, {}));
    add(O('bloco', 780, 440, 40, 40, { e: 40, top: '#c8a24a', front: '#a8822a', label: 'PEGAR UM CARRINHO DE BAGAGEM', act: S2 => G.say('Para quê? Você viaja com pouca bagagem...', 2.5) }));
    R.deco = x => {
      K.neon(x, pl.nome, 450, 110, luxo ? 26 : 22, luxo ? '#ffd24a' : '#fff');
      if (luxo) { x.fillStyle = 'rgba(200,162,74,0.35)'; for (let k = 0; k < 5; k++) x.fillRect(100 + k * 160, 140, 4, 8); }
      if (!luxo && pl.nivel === 'feio') { x.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 0; k < 7; k++) x.fillRect(110 + k * 91, 70 + (k * 37) % 50, 5 + k % 3 * 6, 18 + k % 4 * 7); x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(70, 150, 760, 420); }
      K.cartaz(x, 218, 74, 54, 44, '#e8e0d0', ['RECEPÇÃO']);
    };
    R.luzes = luxo ? [{ x: 450, y: 360, r: 380 }, { x: 200, y: 400, r: 220 }, { x: 700, y: 400, r: 220 }] : [{ x: 450, y: 360, r: 300 * nv.luz + 100 }];
    const rec = fixo(R, { x: 450, y: 172, p: lookStaff({ shirt: luxo ? '#1a1a2e' : '#2a58b8', pat: 'liso', sleeve: 'longa', fem: true, hairStyle: 'coque' }), falas: ['Bem-vindo ao ' + pl.nome + '!', 'Posso ajudar? Temos quartos disponíveis.'], h: Math.PI, nome: 'Recepcionista', label: 'ALUGAR UM QUARTO', act: S2 => menuRecepcao(S2, R, pl, nv), ameacavel: true, dinheiro: Math.round(rand(100, luxo ? 700 : 250)), semColisao: true });
    rec.ameaca = (S2, R2, n) => { if (n.roubado) { K.bolha(n.p, 'O caixa está vazio!', 3); return; } n.roubado = true; K.bolha(n.p, 'Pega! Pega tudo! Não me machuca!', 4); S2.save.money += n.dinheiro; G.save(); G.snd.cash(); G.say('ASSALTO À RECEPÇÃO! Você levou $' + n.dinheiro + '.', 4); K.chamaPolicia(S2, R2, 5); };
    fixo(R, { x: 450, y: 520, p: lookStaff({ shirt: '#8a1f3a', pat: 'liso', sleeve: 'longa', acc: 'cap', accCol: '#8a1f3a', fem: false }), falas: ['Boa estadia, senhor!', 'O restaurante fica à esquerda e o elevador à direita.', 'Precisa de ajuda com as malas?'], h: Math.PI, nome: 'Porteiro' });
    return R;
  }

  function restaurante(S, lg) {
    const pl = lg.place, nv = lg.nv, luxo = pl.nivel === 'luxo', menu = menuComida(pl.nivel, nv);
    const R = nova(lg, 'restaurante', { w: 920, h: 460, portaX: 220, nome: pl.nome + ' — RESTAURANTE', cor: pl.cor });
    R.porta = { para: 'lobby', px: 160, py: 210, ph: Math.PI, label: 'VOLTAR AO SAGUÃO', rotulo: 'SAGUÃO' };
    R.chegada = { x: 220, y: 580 }; R.cadeiras = []; R.mesas = [];
    const add = (...a) => R.objs.push(...a);
    const toalha = luxo ? '#f4ecd8' : pl.nivel === 'feio' ? '#b8a888' : '#e8e4d8';
    const cols = [150, 370, 590, 810], rows = [290, 410, 530];
    let ci = 0;
    rows.forEach((y, j) => cols.forEach((x, i) => {
      if (x < 300 && y > 480) return;   // espaço da porta
      const mesa = O('mesa_rest', x, y, 90, 60, { e: 16, toalha, cor: luxo ? '#c8a24a' : '#c8302a' }); R.mesas.push(mesa); add(mesa);
      [[x - 32, y + 14, Math.PI / 2 * 1], [x + 98, y + 14, -Math.PI / 2]].forEach(([cx, cy, ph], k) => {
        const c = O('cadeira_rest', cx, cy, 24, 28, { solid: false, cor: luxo ? '#7a2a3a' : '#5a4a3a', ph: k ? -Math.PI / 2 : Math.PI / 2, h2: k ? -Math.PI / 2 : Math.PI / 2, mesa, label: 'SENTAR À MESA', r: 30, sai: { x: cx + 12, y: cy + 44 }, menuLabel: 'ABRIR O CARDÁPIO' });
        c.act = S2 => { if (R.npcs.some(n => n.cad === c && n.sentado)) { G.say('Esta cadeira está ocupada.', 2); return; } L.kit.sentar(S2, c); };
        c.menu = S2 => menuCardapio(S2, R, c, menu, pl);
        R.cadeiras.push(c); add(c); ci++;
      });
    }));
    lg.nCad = R.cadeiras.length;
    add(porta(850, 96, 64, { estilo: 'vai-vem', placa: 'COZINHA', label: 'ENTRAR NA COZINHA', act: S2 => L.irSala(S2, 'cozinha', 500, 640, Math.PI) }));
    add(O('planta', 90, 190, 40, 50, {}), O('planta', 930, 560, 40, 50, {}));
    R.deco = x => {
      K.neon(x, 'RESTAURANTE', 400, 110, 24, luxo ? '#ffd24a' : '#ff8a6a');
      for (let k = 0; k < 4; k++) K.janela(x, 120 + k * 150, 76, 70, 56);
      if (luxo) { x.fillStyle = 'rgba(200,162,74,0.5)'; x.fillRect(70, 138, 920, 5); }
    };
    R.luzes = luxo ? [{ x: 300, y: 380, r: 300 }, { x: 700, y: 380, r: 300 }] : [{ x: 500, y: 380, r: 380 * nv.luz }];
    // garçons
    const gar = (x, y) => fixo(R, { x, y, p: lookStaff({ shirt: '#f4f4f4', pat: 'liso', sleeve: 'longa', pants: '#16161a', fem: false, hairStyle: 'curto' }), falas: ['O cardápio está na mesa. É só sentar!', 'Hoje o prato do dia está ótimo.', 'Com licença!'], h: Math.PI, nome: 'Garçom', home: { x, y }, v: 130, semColisao: true, livre: true, ameacavel: true, dinheiro: Math.round(rand(20, 90)) });
    R.garcons = [gar(760, 215), gar(690, 215)];
    R.pedido = null;
    R.extra = (S2, R2, dt) => garcom(S2, R2, dt);
    R.cozPt = { x: 880, y: 205 };
    return R;
  }
  function menuCardapio(S, R, cadeira, menu, pl) {
    const h = L.hora(S);
    L.abrirMenu(S, { titulo: 'CARDÁPIO — ' + pl.nome, info: () => R.pedido ? 'Seu pedido está sendo preparado...' : '', rodape: 'W/S escolher  ·  E pedir  ·  ESC fechar',
      itens: menu.map(it => ({ n: it.n, cor: it.cor, desc: (it.h ? it.desc + ' · ' : '') + 'recupera ' + it.hp + ' de vida' + (it.bebado ? ' (álcool)' : '') + (it.energia ? ' + energia' : ''), preco: it.preco, fn: (S2, R2) => {
        if (R2.pedido) { G.say('Calma! Seu pedido anterior ainda não chegou.', 2.5); return; }
        if (it.h && (h < it.h[0] || h >= it.h[1])) { G.say('O ' + it.n + ' é servido só até às ' + Math.floor(it.h[1]) + 'h.', 3); return; }
        if (S2.player.hp >= 100 && !it.bebado && !it.energia) { G.say('Você está com a vida cheia, mas pode pedir assim mesmo.', 2); }
        if (!K.gasta(S2, it.preco)) return;
        const g = R2.garcons.find(w => !w.ocupado) || R2.garcons[0]; g.ocupado = true;
        R2.pedido = { cad: cadeira, it, w: g, est: 'vindo', t: 0 };
        const cx = cadeira.x + cadeira.w / 2, cy = cadeira.y + cadeira.h + 18;
        K.rota(g, [{ x: g.x, y: 235 }, { x: cx, y: 235 }, { x: cx, y: cy }], () => { R2.pedido.est = 'anota'; R2.pedido.t = 1.5; g.h = Math.atan2(cadeira.x - g.x, 0); K.bolha(g.p, 'Boa escolha! Já volto com o seu pedido.', 3); });
        G.say('Pedido feito: ' + it.n + ' ($' + it.preco + '). O garçom já vem anotar...', 3.5); return 'fechar';
      } })) });
  }
  // máquina de estados do garçom: vindo -> anota -> cozinha -> prepara -> entrega -> servido
  function garcom(S, R, dt) {
    for (const w of R.garcons) if (!w.ocupado && (!w.rota || !w.rota.length) && !w.alvo && Math.hypot(w.x - w.home.x, w.y - w.home.y) > 6) K.rota(w, [{ x: w.x, y: 235 }, { x: w.home.x, y: 235 }, w.home]);
    const p = R.pedido; if (!p) return;
    const g = p.w, cad = p.cad; p.t -= dt;
    const cx = cad.x + cad.w / 2, cy = cad.y + cad.h + 18;
    if (p.est === 'anota' && p.t <= 0) { p.est = 'cozinha'; K.rota(g, [{ x: g.x, y: 235 }, { x: R.cozPt.x, y: 235 }, R.cozPt], () => { p.est = 'prepara'; p.t = 3.5; K.bolha(g.p, 'Mesa ' + (R.cadeiras.indexOf(cad) + 1) + ': ' + p.it.n + '!', 3); }); }
    else if (p.est === 'prepara' && p.t <= 0) { p.est = 'entrega'; g.leva = p.it.cor; K.rota(g, [{ x: g.x, y: 235 }, { x: cx, y: 235 }, { x: cx, y: cy }], () => { p.est = 'servido'; p.t = 0.5; }); }
    else if (p.est === 'servido' && p.t <= 0) {
      g.leva = null; g.h = Math.atan2(cad.x - g.x, 0);
      const sentado = R.sentado && R.sentado.o === cad;
      if (sentado) {
        const it = p.it; K.cura(S, it.hp); if (it.bebado) S.bebado = (S.bebado || 0) + it.bebado; if (it.energia) S.energia = (S.energia || 0) + it.energia;
        K.bolha(g.p, 'Aqui está! Bom apetite!', 3.5); G.say('Você comeu: ' + it.n + '  (+' + it.hp + ' vida)', 4); cad.mesa.prato = it.cor; cad.mesa.pratoAte = R.t + 14;
      } else { S.save.money += p.it.preco; G.save(); K.bolha(g.p, 'Ué, o cliente foi embora... valor devolvido.', 3.5); G.say('Você saiu da mesa: o pedido foi cancelado e devolvido ($' + p.it.preco + ').', 4); }
      g.ocupado = false; R.pedido = null;
    }
    R.mesas.forEach(m => { if (m.prato && R.t > m.pratoAte) m.prato = null; });
  }

  function piscina(S, lg) {
    const pl = lg.place, nv = lg.nv;
    const R = nova(lg, 'piscina', { w: 860, h: 460, portaX: 160, nome: pl.nome + ' — PISCINA', piso: 'pedra', pisoCores: ['#e8e0cc', '#d8d0ba'], parede: '#e0d8c0' });
    R.porta = { para: 'lobby', px: 770, py: 210, ph: Math.PI, label: 'VOLTAR AO SAGUÃO', rotulo: 'SAGUÃO' };
    R.chegada = { x: 160, y: 580 };
    const add = (...a) => R.objs.push(...a);
    add(O('piscina', 260, 270, 420, 160, { label: 'MERGULHAR NA PISCINA', r: 30, act: S2 => { K.cura(S2, 6); G.say('Splash! Você deu um mergulho refrescante. (+6 vida)', 3); G.snd.door(); } }));
    for (let k = 0; k < 4; k++) { add(O('espreguicadeira', 290 + k * 92, 196, 34, 62, { solid: false, cor: ['#f0f0f0', '#e8402a', '#2a7ad8', '#f2d02a'][k] })); add(O('espreguicadeira', 290 + k * 92, 458, 34, 62, { solid: false, cor: ['#f0f0f0', '#2a7ad8', '#e8402a', '#40b8a0'][k] })); }
    add(O('guarda_sol', 250, 240, 10, 10, { solid: false, cor: '#e8402a' }), O('guarda_sol', 700, 480, 10, 10, { solid: false, cor: '#2a7ad8' }));
    add(O('balcao', 760, 250, 130, 40, { e: 30, itens: 'bar', label: 'PEDIR UM DRINK NO BAR', r: 44, act: S2 => menuBar(S2, R, nv) }));
    add(O('planta', 90, 190, 40, 50, {}), O('planta', 880, 560, 40, 50, {}), O('planta', 90, 480, 40, 50, {}));
    R.espreguicadeiras = true;
    R.deco = x => { K.neon(x, 'PISCINA', 450, 110, 26, '#6ae0ff'); for (let k = 0; k < 4; k++) K.janela(x, 130 + k * 190, 76, 80, 56); };
    R.luzes = [{ x: 470, y: 350, r: 420 }];
    const bar = fixo(R, { x: 825, y: 232, p: lookStaff({ shirt: '#f2d02a', pat: 'liso', sleeve: 'curta', fem: false }), falas: ['Um drinque gelado?', 'Hoje tem caipirinha de morango!'], h: Math.PI, nome: 'Barman', label: 'PEDIR UM DRINK', act: S2 => menuBar(S2, R, nv), ameacavel: true, dinheiro: Math.round(rand(30, 150)), semColisao: true });
    return R;
  }
  function menuBar(S, R, nv) {
    const drinks = [['suco', 'Suco tropical', 6, 8], ['agua', 'Água de coco', 5, 4], ['cerveja', 'Cerveja gelada', 7, 8], ['energetico', 'Drink energético', 16, 8], ['guarana', 'Guaraná', 4, 6]];
    L.abrirMenu(S, { titulo: 'BAR DA PISCINA', rodape: 'E pedir (vai para a mochila)  ·  ESC sair', itens: drinks.map(([id, n, p]) => ({ n, preco: Math.round(p * nv.mult), cor: ALIM[id].cor, desc: 'recupera ' + ALIM[id].hp + ' de vida', fn: S2 => { const pr = Math.round(p * nv.mult); if (!K.gasta(S2, pr)) return; L.dar(S2, id, 1); G.save(); G.say(n + ' na mochila. Aperte X para tomar.', 3); } })) });
  }

  function cozinha(S, lg) {
    const pl = lg.place, nv = lg.nv;
    const R = nova(lg, 'cozinha', { w: 900, h: 520, portaX: 500, nome: pl.nome + ' — COZINHA', piso: 'ladrilho', pisoCores: ['#e8ece8', '#d4dad4'], parede: '#c8d0cc' });
    R.porta = { para: 'restaurante', px: 880, py: 215, ph: Math.PI, label: 'VOLTAR AO RESTAURANTE', rotulo: 'SALÃO' };
    R.chegada = { x: 500, y: 640 };
    const add = (...a) => R.objs.push(...a);
    for (let k = 0; k < 5; k++) add(O('fogao', 150 + k * 130, 190, 80, 44, { e: 30, ligado: true }));
    add(O('panelao', 790, 190, 100, 44, { e: 30 }));
    add(O('pia', 150, 280, 120, 40, { e: 30 }), O('pia', 320, 280, 120, 40, { e: 30 }));
    add(O('freezer', 800, 275, 120, 50, { e: 30, label: 'PEGAR SORVETE (CÂMARA FRIA)', r: 44, act: S2 => { const c = lg.estado; if (c.gelo) { G.say('Já pegou sorvete aqui.', 2.5); return; } c.gelo = true; L.dar(S2, 'sorvete', 2); G.save(); G.say('Você pegou 2 sorvetes.', 3); if (Math.random() < 0.5) { K.chamaPolicia(S2, R, 14); K.bolha(chef.p, 'EI! Aqui é só para funcionários!', 3); } } }));
    [[250, 380, 380], [250, 470, 380], [760, 400, 140]].forEach(([x, y, w]) => add(O('bancada', x, y, w, 40, { e: 24 })));
    add(O('bloco', 700, 480, 70, 50, { e: 40, top: '#9aa0aa', front: '#5a606a', label: 'PEGAR UMA MARMITA DA PANELA', r: 44, act: S2 => { const c = lg.estado; if (c.marm && c.marm > S2.dayT - 0.2) { G.say('A panela está vazia por enquanto.', 2.5); return; } c.marm = S2.dayT; L.dar(S2, 'marmita', 1); G.save(); G.say('Você pegou uma marmita quentinha. Aperte X para comer.', 3.5); K.chamaPolicia(S2, R, 18); K.bolha(chef.p, 'LADRÃO DE COMIDA! Segurança!', 3); } }));
    add(O('planta', 90, 560, 36, 44, {}));
    R.deco = x => { K.neon(x, 'COZINHA', 450, 110, 22, '#ffffff'); for (let k = 0; k < 6; k++) { x.fillStyle = '#b0b6bf'; x.fillRect(120 + k * 130, 70, 60, 40); x.fillStyle = '#6a707a'; x.fillRect(125 + k * 130, 75, 50, 30); } };
    R.luzes = [{ x: 300, y: 380, r: 360 }, { x: 700, y: 380, r: 300 }];
    const chef = fixo(R, { x: 300, y: 340, p: lookStaff({ shirt: '#f4f4f4', pat: 'liso', sleeve: 'longa', acc: 'hat', accCol: '#f4f4f4', fem: false }), falas: ['Aqui é só para funcionários!', 'Não encoste nas panelas, está tudo quente!', 'Mais um prato saindo!'], h: 0, nome: 'Chef', ameacavel: true, dinheiro: Math.round(rand(30, 120)) });
    const cz = (x, y, cor) => fixo(R, { x, y, p: lookStaff({ shirt: '#f4f4f4', pat: 'liso', sleeve: 'curta', acc: 'hat', accCol: '#f4f4f4' }), falas: ['Fogo alto!', 'Pedido saindo!'], h: 0, nome: 'Cozinheiro', ameacavel: true, dinheiro: Math.round(rand(10, 60)), leva: cor, v: 50 });
    const cozs = [cz(190, 235, '#c8782a'), cz(450, 235, '#e8a040'), cz(620, 345, '#4ab04a')];
    R.extra = (S2, R2, dt) => { R2.tcz = (R2.tcz || 0) - dt; if (R2.tcz <= 0) { R2.tcz = rand(2, 5); const c = pick(cozs); if (!c.alvo && !(c.rota && c.rota.length)) K.rota(c, [{ x: c.x, y: 345 }, { x: rand(150, 850), y: 345 }, { x: rand(150, 850), y: 235 }]); } };
    // alarme: quem entra na cozinha é visto
    R.aoEntrar = (S2, R2) => { povoar(S2, R2); R2.avisoT = 7; };
    const orig = R.onUpdate; R.onUpdate = (S2, R2, dt) => { orig(S2, R2, dt); if (R2.avisoT > 0) { R2.avisoT -= dt; if (R2.avisoT <= 0) { K.bolha(chef.p, 'QUEM É VOCÊ?! SAIA DA MINHA COZINHA!', 4); } } };
    return R;
  }

  function corredor(S, lg) {
    const pl = lg.place, nv = lg.nv, q = reservaDe(S, pl.id);
    const R = nova(lg, 'corredor', { w: 1000, h: 200, portaX: 120, nome: pl.nome + ' — ANDAR DOS QUARTOS', piso: 'carpete', pisoCores: pl.nivel === 'luxo' ? ['#7a1a2a', '#6a1424'] : pl.nivel === 'feio' ? ['#5a5648', '#4e4a3e'] : ['#6a5a8a', '#5e4e7e'] });
    R.porta = { para: 'lobby', px: 668, py: 210, ph: Math.PI, label: 'DESCER NO ELEVADOR', rotulo: 'ELEVADOR' };
    R.chegada = { x: 120, y: 300 };
    const add = (...a) => R.objs.push(...a);
    for (let k = 0; k < 8; k++) {
      const n = 101 + k, x = 170 + k * 112, meu = q && q.n === n, ocup = !meu && (k * 7 + pl.nome.length) % 3 !== 0;
      add(porta(x, 96, 56, { cor: meu ? '#2e8b3e' : '#5a3a22', placa: 'Nº ' + n, label: meu ? 'ENTRAR NO SEU QUARTO ' + n : ocup ? 'BATER NA PORTA ' + n : 'PORTA TRANCADA — QUARTO ' + n, act: S2 => {
        if (meu) { L.irSala(S2, 'q' + n); return; }
        if (ocup) { G.say('Alguém responde lá de dentro: "Estou ocupado! Volte mais tarde!"', 3.5); G.snd.beep(); }
        else G.say('Quarto vago e trancado. Alugue na recepção para ganhar a chave.', 3);
      } }));
    }
    add(O('planta', 90, 190, 36, 44, {}), O('planta', 1040, 190, 36, 44, {}), O('bloco', 640, 300, 80, 36, { e: 36, top: '#9aa0aa', front: '#6a707a', label: 'CARRINHO DA CAMAREIRA', r: 40, act: S2 => G.say('Toalhas e sabonetes. Nada que valha dinheiro.', 2.5) }));
    R.deco = x => { x.fillStyle = 'rgba(200,162,74,0.4)'; x.fillRect(70, 138, 1000, 4); for (let k = 0; k < 8; k++) { x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(150 + k * 112, 150, 60, 200); } };
    R.luzes = []; for (let k = 0; k < 5; k++) R.luzes.push({ x: 150 + k * 200, y: 250, r: 190 * nv.luz + 60 });
    fixo(R, { x: 760, y: 300, p: lookStaff({ shirt: '#e8e8f0', pat: 'liso', sleeve: 'curta', fem: true, hairStyle: 'coque' }), falas: ['Arrumando os quartos!', 'Seu quarto é o que tem a porta verde.'], h: Math.PI, nome: 'Camareira' });
    return R;
  }

  function quarto(S, lg, n) {
    const pl = lg.place, nv = lg.nv, q = reservaDe(S, pl.id) || { n, tipo: 'standard', nome: 'Quarto' };
    const tp = TIPOS_QUARTO[q.tipo] || TIPOS_QUARTO.standard, feio = q.tipo === 'pensao', luxo = q.tipo === 'suite' || q.tipo === 'luxo';
    const R = nova(lg, 'q' + n, { w: tp.w, h: tp.h, nome: pl.nome + ' — ' + tp.nome + ' ' + q.n, piso: tp.piso, pisoCores: tp.pc, parede: tp.parede, cor: pl.cor });
    R.porta = { para: 'corredor', px: 170 + (n - 101) * 112 + 28, py: 215, ph: Math.PI, label: 'SAIR PARA O CORREDOR', rotulo: 'CORREDOR' };
    R.chegada = { x: R.portaX, y: R.y1 - 30 };
    const add = (...a) => R.objs.push(...a), x0 = R.x0, y0 = R.y0, w = tp.w;
    const dormir = S2 => { L.trans(S2, () => { S2.dayT = Math.floor(S2.dayT) + 1.02; S2.player.hp = 100; S2.heat = 0; S2.heatLevel = 0; G.save(); G.say('Bom dia! Você dormiu no ' + pl.nome + '. Vida cheia e jogo salvo.', 5); }); };
    const camaW = q.tipo === 'suite' ? 160 : q.tipo === 'luxo' ? 130 : q.tipo === 'solteiro' || feio ? 76 : 110;
    add(O('tapete', x0 + w / 2 - 110, y0 + 150, 220, 100, { solid: false, k: -50 }));
    add(O('cama2', x0 + 40, y0 + 40, camaW, 90, { cor: luxo ? '#8a1f3a' : feio ? '#6a6a5a' : '#4a78c8', label: 'DORMIR ATÉ AMANHECER (SALVA O JOGO)', r: 42, act: dormir }));
    add(O('tv', x0 + w - 190, y0 + 25, 110, 34, { e: 34, label: 'LIGAR A TV', act: S2 => G.say(feio ? 'A TV só pega chuvisco e um canal de vendas.' : pick(['Jornal: a polícia reforça o patrulhamento na cidade.', 'Filme: o herói foge da cidade em um carro vermelho...']), 4) }));
    add(O('armario', x0 + w - 70, y0 + 25, 60, 40, { e: 64, label: 'GUARDA-ROUPA', act: S2 => G.say('Cabides vazios. Você viaja leve.', 2.5) }));
    if (!feio) add(O('bloco', x0 + 40 + camaW + 10, y0 + 40, 30, 30, { e: 18, top: '#7a5230', front: '#5a3a22' }));
    if (nv.mult >= 1) add(O('bloco', x0 + w / 2 + 40, y0 + 25, 70, 30, { e: 34, top: '#d8dce4', front: '#aab0ba', label: 'MINIBAR (PREÇO DE HOTEL)', r: 40, act: S2 => menuMini(S2, nv) }));
    if (luxo) {
      add(O('sofa', x0 + 40, y0 + tp.h - 80, 170, 44, { e: 18, r: 30, label: 'SENTAR NO SOFÁ', act: S2 => { K.cura(S2, 8); G.say('Sofá de couro. (+8 vida)', 2.5); } }));
      add(O('poltrona', x0 + w - 130, y0 + tp.h - 100, 50, 50, { e: 20, r: 28, label: 'SENTAR NA POLTRONA', act: S2 => { K.cura(S2, 5); G.say('Muito confortável. (+5 vida)', 2.5); } }));
      if (q.tipo === 'suite') add(O('piscina', x0 + w - 270, y0 + tp.h - 150, 150, 90, { label: 'ENTRAR NA JACUZZI', r: 30, act: S2 => { K.cura(S2, 25); G.say('Ahh, hidromassagem! (+25 vida)', 3.5); } }), O('planta', x0 + 250, y0 + tp.h - 80, 36, 44, {}));
    } else if (!feio) add(O('cadeira', x0 + 40, y0 + tp.h - 80, 40, 40, {}), O('planta', x0 + w - 70, y0 + tp.h - 70, 36, 44, {}));
    else add(O('pia', x0 + 30, y0 + tp.h - 80, 60, 36, { e: 24 }), O('bloco', x0 + w - 90, y0 + tp.h - 60, 50, 40, { e: 20, top: '#6a5a46', front: '#4a3e30' }));
    R.deco = x => {
      if (!feio) K.janela(x, x0 + w / 2 - 35, 80, 70, 54); else { x.fillStyle = 'rgba(0,0,0,0.3)'; for (let k = 0; k < 5; k++) x.fillRect(x0 + 40 + k * 70, 70 + (k * 29) % 40, 6, 24); }
      if (feio) { x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(x0, y0, w, tp.h); }
    };
    R.luzes = feio ? [{ x: x0 + w / 2, y: y0 + tp.h / 2, r: 160 }] : [{ x: x0 + w / 2, y: y0 + tp.h / 2, r: Math.max(260, w * 0.5) }];
    R.aoEntrar = () => {}; R.onUpdate = (S2, R2, dt) => { if (!reservaDe(S2, pl.id)) { G.say('O seu tempo de hospedagem acabou. Você foi convidado a sair.', 4); L.irSala(S2, 'corredor', 120, 300, Math.PI); } };
    return R;
  }
  function menuMini(S, nv) {
    const itens = [['agua', 4], ['guarana', 8], ['suco', 9], ['cerveja', 11], ['chocolate', 10], ['energetico', 20]];
    L.abrirMenu(S, { titulo: 'MINIBAR', rodape: 'E comprar (vai para a mochila)  ·  ESC fechar', itens: itens.map(([id, p]) => { const pr = Math.round(p * (nv.mult > 2 ? 1.4 : 1)); return { n: ALIM[id].n, preco: pr, cor: ALIM[id].cor, desc: 'recupera ' + ALIM[id].hp + ' de vida', fn: S2 => { if (!K.gasta(S2, pr)) return; L.dar(S2, id, 1); G.save(); G.say(ALIM[id].n + ' na mochila.', 2.5); } }; }) });
  }

  // ---------- tipos novos ----------
  K.tipos.cadeira_rest = K.tipos.cadeira_rest;   // (já definido em moveis.js)

  L.construtores['tipo:hotel'] = {
    criar(id, lg) {
      const S = G.S, pl = lg.place;
      if (!lg.ini) {
        lg.ini = true; lg.nv = NIVEIS[pl.nivel]; lg.estado = {};
        pl.hospedes = pl.hospedes || gerarHospedes(pl, lg.nv); lg.hospedes = pl.hospedes;
        lg.hospedes.forEach(g => { g.sala = null; g.n = null; g.at = null; });
        // posição inicial de cada hóspede (sem andar)
        const h = L.hora(S); lg.hospedes.forEach(g => { g.at = atividade(g, h, lg.nv); g.dest = destino(lg, g, g.at, S); g.sala = g.dest ? g.dest.sala : null; });
      }
      if (id === 'lobby' || id === 'entrada') return saguao(S, lg);
      if (id === 'restaurante') return restaurante(S, lg);
      if (id === 'piscina') return piscina(S, lg);
      if (id === 'cozinha') return cozinha(S, lg);
      if (id === 'corredor') return corredor(S, lg);
      return quarto(S, lg, parseInt(id.slice(1), 10));
    }
  };
})(window.G = window.G || {});
