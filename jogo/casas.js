/* =====================================================================
   CASAS.JS — TODAS as casas da cidade têm porta: dá para entrar!
     • cada casa tem uma família com rotina (dorme à noite, trabalha de dia...)
     • você pode INVADIR: mexer na geladeira, no armário, abrir o cofre...
     • com uma arma na mão, aperte F perto de um morador para AMEAÇAR e levar o dinheiro
     • mas cuidado: os vizinhos chamam a polícia!
     • algumas casas estão À VENDA: dá para comprar (placa vermelha na calçada)
     • casa sua = cama (salva o jogo), geladeira cheia, e ninguém te incomoda
   ===================================================================== */
(function (G) {
  'use strict';
  const L = G.lugares, K = L.kit, V = G.vida, W = G.world;
  const O = K.O, pick = K.pick, rand = K.rand, TAU = Math.PI * 2;
  const money = v => Math.round(v);

  W.casas.forEach(c => { if (c.b.place) { c.semPorta = true; c.venda = false; } });
  const dono = (S, c) => !!(S.save.casas && S.save.casas[c.id]);
  const aVenda = (S, c) => c.venda && !dono(S, c);
  const placeDe = c => c.pl || (c.pl = { id: 'casa:' + c.id, tipo: 'casa', casa: c, nome: 'CASA', x: c.x, y: c.y, r: 24, cor: '#9dff9d' });
  const nivel = c => c.area < 14 ? 'simples' : c.area < 34 ? 'media' : 'rica';

  // ---------- por fora: entrar, placa de venda ----------
  L.extrasAcao.push((S, P) => {
    for (const c of W.casas) {
      if (c.semPorta || Math.abs(c.x - P.x) > 26 || Math.abs(c.y - P.y) > 26) continue;
      const s = aVenda(S, c) ? 'E: ENTRAR — CASA À VENDA ($' + c.preco + ')' : dono(S, c) ? 'E: ENTRAR — SUA CASA' : 'E: ENTRAR NA CASA';
      placeDe(c).livre = dono(S, c);
      return { t: 'lugar', s, run: () => L.entrar(S, placeDe(c)) };
    }
    return null;
  });
  L.extrasDesenho.push((ctx, S, inV) => {
    W.casas.forEach(c => {
      if (c.semPorta || !inV(c)) return;
      const v = aVenda(S, c), d = dono(S, c); if (!v && !d) return;
      ctx.save(); ctx.translate(c.x + 26, c.y - 10);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-9, 4, 22, 10);
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-1, 2, 2, 12);
      ctx.fillStyle = v ? '#d9242a' : '#2e8b3e'; ctx.fillRect(-12, -8, 24, 12); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(-11.5, -7.5, 23, 11);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 5.5px Arial'; ctx.textAlign = 'center'; ctx.fillText(v ? 'VENDE-SE' : 'SUA CASA', 0, -0.5);
      ctx.restore();
    });
  });

  // ---------- família: cria, sincroniza com a hora ----------
  // pontos onde a família fica (cada nível de casa tem os seus: veja casas_salas.js)
  const SPOTS_ANTIGOS = {
    bed: [{ x: 150, y: 232 }, { x: 205, y: 232 }, { x: 328, y: 232 }, { x: 418, y: 232 }, { x: 508, y: 232 }],
    sofa: [{ x: 190, y: 392 }, { x: 250, y: 392 }, { x: 310, y: 392 }], coz: [{ x: 535, y: 226 }, { x: 472, y: 226 }],
    passeio: [{ x: 300, y: 270 }, { x: 420, y: 285 }, { x: 250, y: 320 }, { x: 380, y: 345 }, { x: 330, y: 250 }],
    passeioQ: [{ x: 330, y: 320 }, { x: 400, y: 345 }, { x: 270, y: 330 }], laneSala: 250, laneQuarto: 312
  };
  const spotsDe = c => (L.casaLay && L.casaLay.spots(nivel(c))) || SPOTS_ANTIGOS;

  function iniciaFamilia(S, lg) {
    const c = lg.casa;
    if (aVenda(S, c) || dono(S, c)) return;
    if (!c.fam) {
      c.fam = V.gerarFamilia(c); let k = 0;
      c.fam.membros.forEach(m => { m.cama = m.papel === 'pai' || m.papel === 'sozinho' ? 0 : m.papel === 'mae' || m.papel === 'mae_trab' ? 1 : m.papel === 'idoso' ? 4 : 2 + (k++ % 2); });
    }
    c.fam.membros.forEach(m => { m.sala = null; m.n = null; m.at = null; });
    sincroniza(S, lg, true);
  }
  function destino(m, at, c) {
    const SP = spotsDe(c);
    switch (at) {
      case 'fora': return null;
      case 'dorme': return Object.assign({ sala: 'quartos', dorme: true, h: 1.57 }, SP.bed[m.cama % SP.bed.length]);
      case 'cozinha': return Object.assign({ sala: 'entrada', h: 0 }, SP.coz[m.i % SP.coz.length]);
      case 'tv': return Object.assign({ sala: 'entrada', sentado: true, h: 0 }, SP.sofa[m.i % SP.sofa.length]);
      case 'brinca': return Object.assign({ sala: 'quartos', corre: m.i % 2 === 0 }, SP.passeioQ[m.i % SP.passeioQ.length]);
      default: { const lista = m.papel === 'filho' ? SP.passeioQ : SP.passeio; return Object.assign({ sala: m.papel === 'filho' ? 'quartos' : 'entrada' }, lista[Math.floor(Math.random() * lista.length)]); }
    }
  }
  function falasDe(m) {
    const a = m.at, f = [];
    if (m.crianca) f.push('Você é amigo do papai?', 'Estou brincando! Quer brincar também?', 'Mamãe disse para não falar com estranhos...');
    else if (m.papel === 'idoso') f.push('No meu tempo, a rua era mais segura.', 'Meu neto não larga a TV!', 'Vai um cafezinho, meu filho?');
    else f.push('Quem é você? Como entrou aqui?', 'Eu vou chamar a polícia!', 'Aqui é a casa da família ' + (m.nome.split(' ').pop()) + '.');
    if (a === 'cozinha') f.push('Estou fazendo o almoço!', 'Cuidado, a panela está quente.');
    if (a === 'tv') f.push('Shhh! Estou vendo a novela.', 'Esse programa é o melhor.');
    return f;
  }
  const gente = (m, x, y, d) => {
    const n = { x, y, p: m.p, nome: m.nome, dinheiro: m.dinheiro, crianca: m.crianca, falas: falasDe(m), h: d && d.h != null ? d.h : Math.PI, m, v: 58, rendido: m.rendido };
    m.n = n; return n;
  };
  function poeNoFim(n, d) { n.dorme = !!d.dorme && !n.acordou; n.sentado = !!d.sentado; n.corre = !!d.corre; if (d.h != null) n.h = d.h; if (n.dorme) { n.label = 'DORMINDO'; n.act = (S, R, nn) => G.say(nn.nome.split(' ')[0] + ' dorme profundamente. Zzz...', 2.5); n.semColisao = true; } else { n.label = undefined; n.act = undefined; n.semColisao = n.sentado; } }
  // atualiza o dado de cada morador; se a sala visível mudar, mexe nos NPCs
  function sincroniza(S, lg, snap) {
    const c = lg.casa, fam = c.fam; if (!fam) return;
    const h = L.hora(S), R = S.inside && S.inside.lugar === lg ? S.inside : null;
    fam.membros.forEach(m => {
      const at = V.atividade(m, h); if (m.at === at && !(at === 'casa' && m.n && m.n.parado && Math.random() < 0.01)) return;
      if (m.at !== at) m.acordou = false;
      m.at = at; const d = destino(m, at, c); m.dest = d;
      const antes = m.sala; m.sala = d ? d.sala : null;
      if (m.n) m.n.falas = falasDe(m);
      if (!R || snap) { if (!snap) m.n = null; return; }
      const idxAntiga = R.npcs.indexOf(m.n);
      if (antes === R.id && m.sala !== R.id) { if (idxAntiga >= 0) R.npcs.splice(idxAntiga, 1); m.n = null; return; }   // saiu da sala
      if (m.sala === R.id) {
        let n = m.n;
        if (!n || idxAntiga < 0) { n = gente(m, R.portaX, R.y1 - 50, d); if (antes === null) { n.x = R.portaX; n.y = R.y1 - 20; } R.npcs.push(n); n.dorme = false; }
        const SPc = spotsDe(c), lane = R.id === 'entrada' ? SPc.laneSala : SPc.laneQuarto;
        n.dorme = false; n.sentado = false; n.act = undefined; n.label = undefined;
        K.rota(n, [{ x: n.x, y: lane }, { x: d.x, y: lane }, { x: d.x, y: d.y }], nn => poeNoFim(nn, d));
      }
    });
  }
  K.rota = L.rota;
  // monta os NPCs de uma sala (já na posição final)
  function povoar(S, R) {
    R.npcs.length = 0; const fam = R.lugar.casa.fam; if (!fam) return;
    fam.membros.forEach(m => { if (m.sala === R.id && m.dest) { const n = gente(m, m.dest.x, m.dest.y, m.dest); poeNoFim(n, m.dest); R.npcs.push(n); } else m.n = null; });
  }
  function ruido(S, R, p) {
    const lg = R.lugar, c = lg.casa, fam = c.fam; if (!fam || lg.alarmeFeito) return;
    if (Math.random() > p) return;
    const dorm = fam.membros.filter(m => m.n && m.n.dorme);
    if (dorm.length) { const m = pick(dorm); m.n.dorme = false; m.n.acordou = true; m.n.semColisao = false; K.bolha(m.n.p, 'Quem está aí?! LADRÃO! Socorro!', 4); K.chamaPolicia(S, R, 14); G.say(m.nome.split(' ')[0] + ' acordou com o barulho!', 3); }
  }

  // ---------- as salas ----------
  const ESTILOS = {
    simples: { piso: 'ladrilho', pc: ['#d8d0bc', '#c4bba4'], parede: '#c8c0a8', q: 'ladrilho', qc: ['#cfc6b0', '#bdb49e'] },
    media: { piso: 'madeira', pc: ['#9a7650', '#7e5c3a'], parede: '#d8cdb0', q: 'carpete', qc: ['#8a9ab8', '#7a8aa8'] },
    rica: { piso: 'madeira', pc: ['#5a3a24', '#47301c'], parede: '#e6dcc4', q: 'carpete', qc: ['#7a2a3a', '#6a2232'] }
  };
  function nomeCasa(S, c) { return dono(S, c) ? 'SUA CASA' : aVenda(S, c) ? 'CASA À VENDA' : c.fam ? 'CASA DA FAMÍLIA ' + c.fam.sob.toUpperCase() : 'CASA'; }

  function loot(S, R, o, chave, min, max, msg, ruidoP, extra) {
    const lg = R.lugar, c = lg.casa; c.achados = c.achados || {};
    if (c.achados[chave]) { G.say('Já vasculhei isso aqui. Nada de novo.', 2.2); return; }
    c.achados[chave] = true; const v = money(rand(min, max));
    if (v) { S.save.money += v; G.save(); G.snd.cash(); }
    G.say(msg.replace('$$', '$' + v), 3.5); if (extra) extra(); ruido(S, R, ruidoP);
    if (c.fam && !lg.alarmeFeito) { const acordado = c.fam.membros.find(m => m.n && !m.n.dorme && m.sala === R.id); if (acordado && Math.hypot(acordado.n.x - o.x, acordado.n.y - o.y) < 160) { K.bolha(acordado.n.p, 'EI! O que você está fazendo?! Largue isso!', 4); K.chamaPolicia(S, R, 9); } }
  }

  function salaCasa(S, lg, c) {
    const est = ESTILOS[nivel(c)], v = aVenda(S, c), d = dono(S, c);
    const R = L.novaSala({ w: 600, h: 380, nome: nomeCasa(S, c), cor: d ? '#2e8b3e' : v ? '#d9242a' : '#c8a060', piso: est.piso, pisoCores: est.pc, parede: est.parede });
    R.porta = null; R.casa = c;
    R.spots = {};
    const add = (...a) => R.objs.push(...a);
    add(O('porta', 342, 96, 56, 54, { solid: false, k: 10, label: d || !v ? 'IR PARA OS QUARTOS' : 'VER OS QUARTOS', r: 50, placa: 'QUARTOS', act: S => L.irSala(S, 'quartos', 330, 440, Math.PI) }));
    if (v) {
      // casa vazia, à venda
      add(O('placa_venda', 300, 300, 120, 50, { e: 0, solid: true, label: 'COMPRAR ESTA CASA — $' + c.preco, r: 56, act: (S, R2) => comprar(S, R2) }));
      add(O('pilha_caixas', 520, 180, 50, 40, { e: 24 }), O('pilha_caixas', 150, 400, 44, 36, { e: 22 }));
      R.deco = x => { x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(70, 150, 600, 380); };
    } else {
      add(O('tapete', 110, 270, 240, 120, { solid: false, k: -50 }));
      add(O('tv', 150, 175, 110, 34, { e: 34, label: d ? 'LIGAR A TV' : 'ROUBAR A TV', act: (S, R2, o) => { if (d) { G.say(pick(['Noticiário: a polícia procura um motorista de fuga vermelho...', 'Novela das 8: ela descobriu tudo!']), 4); return; } loot(S, R2, o, 'tv', 70, 200, 'Você levou a TV nos braços e vendeu na hora: $$.', 0.85); } }));
      add(O('sofa', 140, 372, 180, 46, { e: 18, r: 30, label: 'SENTAR NO SOFÁ', act: S => { K.cura(S, 8); G.say('Você relaxou no sofá. (+8 vida)', 2.5); } }));
      add(O('poltrona', 380, 300, 50, 50, { e: 20, r: 28, label: 'SENTAR NA POLTRONA', act: S => { K.cura(S, 5); G.say('Poltrona confortável. (+5 vida)', 2.5); } }));
      add(O('geladeira', 590, 165, 60, 44, { e: 56, label: d ? 'ABRIR A GELADEIRA' : 'MEXER NA GELADEIRA', act: (S, R2) => {
        const st = c.est = c.est || {}; const dia = Math.floor(S.dayT);
        if (d) { if (st.dia === dia) { G.say('Você já pegou comida hoje. Volte amanhã!', 2.8); return; } st.dia = dia; const a = pick(['marmita', 'pao', 'maca', 'guarana', 'linguica']); L.dar(S, a, 2); G.save(); G.say('Você pegou ' + L.ALIM[a].n + ' (x2) na geladeira. Aperte X para comer.', 3.5); return; }
        if (st.lootDia === dia) { G.say('A geladeira já foi esvaziada.', 2.2); return; } st.lootDia = dia; const a = pick(['pao', 'maca', 'banana', 'marmita', 'coxinha', 'guarana', 'cerveja']); L.dar(S, a, 1); G.save(); G.say('Você roubou: ' + L.ALIM[a].n + '. (X para comer)', 3); ruido(S, R2, 0.2);
      } }));
      add(O('fogao', 520, 170, 56, 40, { e: 30, ligado: true }), O('pia', 440, 170, 70, 40, { e: 30 }));
      add(O('mesa_rest', 470, 330, 110, 80, { e: 16, solid: true, toalha: '#f4ecd8', cor: '#c8302a', prato: '#d8a040' }));
      add(O('cadeira_rest', 430, 335, 22, 26, {}), O('cadeira_rest', 590, 335, 22, 26, {}), O('cadeira_rest', 505, 405, 26, 22, {}));
      add(O('planta', 90, 440, 40, 50, {}), O('planta', 610, 440, 40, 50, {}), O('planta', 90, 170, 40, 50, {}));
      if (!d) add(O('bloco', 280, 175, 70, 26, { e: 26, top: '#7a5230', front: '#5a3a22', label: 'VASCULHAR O APARADOR', r: 36, act: (S, R2, o) => loot(S, R2, o, 'aparador', 8, 70, 'Achou trocados na gaveta: $$.', 0.3) }));
      if (nivel(c) === 'rica') add(O('estante', 80, 300, 60, 60, { e: 44 }));
      R.deco = x => {
        K.janela(x, 170, 80, 70, 54); K.janela(x, 470, 80, 70, 54);
        x.fillStyle = 'rgba(0,0,0,0.2)'; x.fillRect(70, 138, 600, 6);
        K.cartaz(x, 560, 76, 40, 52, '#e8d8b0', c.fam ? ['FAMÍLIA', c.fam.sob.toUpperCase().slice(0, 7)] : ['LAR', 'DOCE LAR']);
      };
    }
    R.luzes.push({ x: 250, y: 330, r: 280 }, { x: 520, y: 260, r: 240 });
    R.aoEntrar = (S2, R2) => {
      povoar(S2, R2);
      const lg2 = R2.lugar; if (lg2.avisou || v || d) return; lg2.avisou = true;
      lg2.avisoT = K.armado(S2) ? 1.5 : 4.5;
    };
    R.onUpdate = onUpdate;
    return R;
  }

  function quartosCasa(S, lg, c) {
    const est = ESTILOS[nivel(c)], v = aVenda(S, c), d = dono(S, c);
    const R = L.novaSala({ w: 520, h: 340, nome: nomeCasa(S, c) + ' — QUARTOS', cor: d ? '#2e8b3e' : '#c8a060', piso: est.q, pisoCores: est.qc, parede: est.parede });
    R.casa = c; R.porta = { para: 'entrada', px: 370, py: 200, ph: Math.PI, label: 'VOLTAR PARA A SALA', rotulo: 'SALA' };
    R.portaX = 330; R.px = 330; R.py = R.y1 - 40;
    const add = (...a) => R.objs.push(...a);
    if (v) { add(O('pilha_caixas', 120, 180, 60, 44, { e: 26 })); }
    else {
      add(O('tapete', 220, 300, 200, 90, { solid: false, k: -50 }));
      add(O('cama2', 110, 185, 130, 90, { cor: d ? '#2e8b5e' : '#4a78c8', e: 0, label: d ? 'DORMIR ATÉ AMANHECER (SALVA O JOGO)' : 'DESCANSAR NA CAMA', r: 40, act: S => {
        if (!d) { K.cura(S, 5); G.say('Você deitou na cama dos outros. Que sem-vergonha! (+5 vida)', 3); ruido(S, R, 0.5); return; }
        L.trans(S, () => { S.dayT = Math.floor(S.dayT) + 1.02; S.player.hp = 100; S.heat = 0; S.heatLevel = 0; G.save(); G.say('Bom dia! Você dormiu na SUA casa. Vida cheia e jogo salvo.', 5); });
      } }));
      if (!d) {
        const nf = c.fam ? c.fam.membros.length : 0;
        add(O('cama2', 290, 185, 76, 80, { cor: '#e8a040' }), O('cama2', 380, 185, 76, 80, { cor: '#40b8a0' }), O('cama2', 470, 185, 76, 80, { cor: '#b84a8a' }));
        add(O('bloco', 248, 190, 30, 30, { e: 18, top: '#7a5230', front: '#5a3a22', label: 'PEGAR A CARTEIRA', r: 36, act: (S, R2, o) => loot(S, R2, o, 'carteira', 15, 90, 'Você pegou uma carteira: $$.', 0.4) }));
        add(O('armario', 110, 400, 110, 44, { e: 64, label: 'VASCULHAR O GUARDA-ROUPA', r: 40, act: (S, R2, o) => loot(S, R2, o, 'armario', 10, nivel(c) === 'rica' ? 160 : 70, 'Escondido entre as roupas: $$.', 0.5) }));
        if (nivel(c) !== 'simples') add(O('cofre', 520, 400, 52, 40, { e: 40, label: 'ARROMBAR O COFRE (TIMING)', r: 40, act: (S, R2, o) => {
          if (c.achados && c.achados.cofre) { G.say('O cofre já foi arrombado.', 2.2); return; }
          L.miniTiming(S, { titulo: 'ARROMBANDO O COFRE', reps: 3, v: 1.3, zona: 0.16, cb: (S3, R3, ok, tot) => {
            if (ok >= 2) { c.achados = c.achados || {}; c.achados.cofre = true; o.aberto = true; const v2 = money(nivel(c) === 'rica' ? rand(300, 900) : rand(120, 380)); S3.save.money += v2; G.save(); G.snd.cash(); G.say('COFRE ABERTO! Você levou $' + v2 + '.', 4); ruido(S3, R3, 0.6); }
            else { G.say('Você errou a combinação. O alarme do cofre disparou!', 3.5); G.snd.beep(); K.chamaPolicia(S3, R3, 8); }
          } });
        } }));
      } else {
        add(O('armario', 110, 400, 110, 44, { e: 64, label: 'ABRIR O GUARDA-ROUPA', act: S => G.say('Suas roupas estão aqui. (Mude o visual na barbearia ou no shopping.)', 3.5) }));
        add(O('bloco', 248, 190, 30, 30, { e: 18, top: '#7a5230', front: '#5a3a22' }));
      }
      add(O('planta', 540, 440, 36, 44, {}));
    }
    R.deco = x => { K.janela(x, 330, 80, 70, 54); x.fillStyle = 'rgba(0,0,0,0.2)'; x.fillRect(70, 138, 520, 6); };
    R.luzes.push({ x: 330, y: 330, r: 260 });
    R.aoEntrar = (S2, R2) => povoar(S2, R2);
    R.onUpdate = onUpdate;
    return R;
  }

  function onUpdate(S, R, dt) {
    const lg = R.lugar; lg.sinc = (lg.sinc || 0) - dt;
    if (lg.sinc <= 0) { lg.sinc = 1.2; sincroniza(S, lg, false); }
    if (lg.avisoT > 0) {
      lg.avisoT -= dt;
      if (lg.avisoT <= 0) {
        const acordado = lg.casa.fam && lg.casa.fam.membros.find(m => m.n && !m.n.dorme && m.sala);
        if (acordado) { K.bolha(acordado.n.p, pick(['QUEM É VOCÊ?! SOCORRO! LADRÃO!', 'O QUE VOCÊ FAZ NA MINHA CASA?! VOU CHAMAR A POLÍCIA!']), 4.5); K.chamaPolicia(S, R, 11); G.say('Os moradores viram você! A polícia vai ser chamada!', 4); G.snd.beep(); }
      }
    }
  }

  function comprar(S, R) {
    const c = R.lugar.casa;
    if (!K.gasta(S, c.preco)) return;
    S.save.casas = S.save.casas || {}; S.save.casas[c.id] = true; G.save();
    G.snd.win && G.snd.win(); G.say('PARABÉNS! Você comprou esta casa por $' + c.preco + '. Agora ela é SUA: durma na cama para salvar!', 6);
    const lg = R.lugar; lg.salas = {}; const R2 = lg.criar('entrada', lg); R2.lugar = lg; R2.id = 'entrada'; R2.place = lg.place; R2.px = R.px; R2.py = R.py; R2.aoEntrar && R2.aoEntrar(S, R2); S.inside = R2;
  }

  // tipos novos usados aqui
  K.tipos.placa_venda = (ctx, o, t) => {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(o.x + 6, o.y + 14, o.w, 20); ctx.fillStyle = '#7a5a3a'; ctx.fillRect(o.x + 20, o.y + 10, 6, 34); ctx.fillRect(o.x + o.w - 26, o.y + 10, 6, 34);
    ctx.fillStyle = '#d9242a'; ctx.fillRect(o.x, o.y - 12, o.w, 34); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(o.x + 2, o.y - 10, o.w - 4, 30);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 15px Arial'; ctx.fillText('À VENDA', o.x + o.w / 2, o.y + 4); ctx.font = 'bold 11px Arial'; ctx.fillStyle = '#ffe04a'; ctx.fillText('$' + (o.preco || ''), o.x + o.w / 2, o.y + 16); ctx.textAlign = 'left';
  };

  L.construtores['tipo:casa'] = {
    criar(id, lg) {
      const S = G.S, c = lg.place.casa; lg.casa = c;
      if (!lg.ini) { lg.ini = true; iniciaFamilia(S, lg); }
      const R = L.casaLay ? L.casaLay.criar(id, S, lg, c) : (id === 'entrada' ? salaCasa(S, lg, c) : quartosCasa(S, lg, c));
      R.objs.forEach(o => { if (o.t === 'placa_venda') o.preco = c.preco; });
      return R;
    }
  };

  // peças que o casas_salas.js (as salas novas) usa
  L.casaApi = { dono, aVenda, nivel, nomeCasa, loot, ruido, povoar, onUpdate, comprar, money };

  // usado pelo save: casas compradas aparecem no minimapa
  G.casasDoJogador = S => W.casas.filter(c => dono(S, c));
})(window.G = window.G || {});
