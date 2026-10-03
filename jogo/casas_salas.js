/* =====================================================================
   CASAS_SALAS.JS — por dentro, cada casa é uma CASA DE VERDADE:
     • SALA com cozinha (sofá, TV, mesa de jantar, geladeira, fogão, pia...)
     • QUARTOS (camas com travesseiro, guarda-roupa, escrivaninha...)
     • BANHEIRO (vaso, pia com espelho, chuveiro, banheira nas ricas)
   O tamanho e o luxo seguem o dinheiro da casa:
     simples = cimento queimado, grade na janela, móveis velhos
     média   = piso de madeira, sofá e jantar, cozinha completa
     rica    = porcelanato e tábua corrida, lareira, ilha de cozinha, suíte
   Cada casa tem cores próprias (sorteadas pelo número dela).
   Mesmas regras de sempre: roubar, dormir para salvar, cofre, família...
   ===================================================================== */
(function (G) {
  'use strict';
  const L = G.lugares, K = L.kit, D = G.deco, A = L.casaApi;
  const O = K.O, pick = K.pick, rand = K.rand, shade = K.shade, TAU = Math.PI * 2;
  // sorteio com semente (a mesma casa sempre sai com as mesmas cores)
  const rng = s => { let a = (s | 0) + 0x6D2B79F5; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const semente = id => { let h = 2166136261; const t = String(id); for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return h >>> 0; };
  const { dono, aVenda, nivel, nomeCasa, loot, ruido, povoar, onUpdate, comprar, money } = A;

  // ---------- as medidas de cada nível ----------
  const DIM = {
    // dx = canto esquerdo da porta dos quartos (na sala), dw = largura dela
    // px = porta de saída (embaixo) · bx/bw = porta do banheiro (nos quartos)
    simples: { sala: { w: 520, h: 340, dx: 290, dw: 52 }, quartos: { w: 440, h: 300, px: 290, bx: 228, bw: 48 }, banho: { w: 220, h: 230, px: 180 } },
    media: { sala: { w: 640, h: 400, dx: 342, dw: 56 }, quartos: { w: 560, h: 360, px: 350, bx: 540, bw: 56 }, banho: { w: 270, h: 250, px: 205 } },
    rica: { sala: { w: 820, h: 440, dx: 484, dw: 60 }, quartos: { w: 700, h: 420, px: 420, bx: 676, bw: 60 }, banho: { w: 380, h: 300, px: 260 } }
  };
  const portaSalaCx = nv => DIM[nv].sala.dx + DIM[nv].sala.dw / 2;       // centro da porta dos quartos
  const portaBanhoCx = nv => DIM[nv].quartos.bx + DIM[nv].quartos.bw / 2;  // centro da porta do banheiro
  // lugares onde a família fica (casas.js usa)
  const SPOTS = {
    simples: {
      bed: [{ x: 118, y: 238 }, { x: 166, y: 238 }, { x: 316, y: 232 }, { x: 390, y: 232 }, { x: 464, y: 232 }],
      sofa: [{ x: 184, y: 394 }, { x: 218, y: 394 }, { x: 252, y: 394 }], coz: [{ x: 505, y: 224 }, { x: 446, y: 224 }],
      passeio: [{ x: 330, y: 300 }, { x: 300, y: 440 }, { x: 440, y: 430 }, { x: 200, y: 300 }, { x: 372, y: 250 }],
      passeioQ: [{ x: 250, y: 330 }, { x: 330, y: 350 }, { x: 180, y: 340 }], laneSala: 252, laneQuarto: 322
    },
    media: {
      bed: [{ x: 128, y: 242 }, { x: 184, y: 242 }, { x: 293, y: 236 }, { x: 381, y: 236 }, { x: 469, y: 236 }],
      sofa: [{ x: 215, y: 396 }, { x: 265, y: 396 }, { x: 315, y: 396 }], coz: [{ x: 606, y: 224 }, { x: 540, y: 224 }],
      passeio: [{ x: 340, y: 266 }, { x: 470, y: 290 }, { x: 300, y: 470 }, { x: 430, y: 500 }, { x: 250, y: 250 }],
      passeioQ: [{ x: 300, y: 390 }, { x: 400, y: 410 }, { x: 260, y: 370 }], laneSala: 250, laneQuarto: 332
    },
    rica: {
      bed: [{ x: 160, y: 246 }, { x: 232, y: 246 }, { x: 398, y: 240 }, { x: 492, y: 240 }, { x: 586, y: 240 }],
      sofa: [{ x: 235, y: 412 }, { x: 300, y: 412 }, { x: 365, y: 412 }], coz: [{ x: 800, y: 226 }, { x: 716, y: 226 }],
      passeio: [{ x: 330, y: 260 }, { x: 560, y: 300 }, { x: 330, y: 500 }, { x: 560, y: 520 }, { x: 440, y: 260 }],
      passeioQ: [{ x: 300, y: 400 }, { x: 440, y: 420 }, { x: 560, y: 400 }], laneSala: 252, laneQuarto: 340
    }
  };

  // ---------- cores de cada casa (sorteadas pelo número da casa) ----------
  const PAREDES = { simples: ['#c8c0a8', '#d8c8a0', '#b8c8b0', '#d0b8a0'], media: ['#d8cdb0', '#e6d8a8', '#bccdd8', '#bccaa8', '#e0bca8', '#d8c0d0'], rica: ['#e6dcc4', '#e8e0d0', '#d8dcc8', '#e0d0c0'] };
  const MADEIRAS = [['#9a7650', '#7e5c3a'], ['#b89468', '#9c7a52'], ['#6a4a30', '#573a24'], ['#a8845a', '#8a6a44']];
  const SOFAS = { simples: ['#8a6a4a', '#6a7a8a', '#7a5a5a'], media: ['#a8483a', '#2f4a7a', '#6a7a8a', '#4f7a5a', '#8a6a4a', '#7a4a6a'], rica: ['#2f3a4a', '#6a2a3a', '#c9b79a', '#3a5a4a', '#e0d8c8'] };
  const TAPETES = [['#7a2a3a', '#d8b878'], ['#2f5a7a', '#e8e0c8'], ['#5a6a3a', '#e8d8a0'], ['#6a3a6a', '#e8c8d8'], ['#8a4a2a', '#e8d0a0']];
  const CORTINAS = ['#b8503a', '#e8e0c8', '#4a6a9a', '#6a9a6a', '#8a2a3a', null];
  function estilo(c) {
    const nv = nivel(c), r = rng(semente(c.id) + 11), pk = a => a[(r() * a.length) | 0], E = { nv, seed: semente(c.id) + 5 };
    E.parede = pk(PAREDES[nv]); E.sofa = pk(SOFAS[nv]); E.sofa2 = pk(SOFAS[nv]); E.tap = pk(TAPETES); E.cortina = pk(CORTINAS); E.vista = pk(['jardim', 'jardim', 'cidade', 'mar']);
    E.cor2 = pk(['#e8c870', '#e8e0c8', '#d8a85a', '#c8d8e8']);
    if (nv === 'simples') {
      const t = r();
      if (t < 0.4) { E.piso = 'cimento'; E.pc = ['#b5645a', '#8a463c']; } else if (t < 0.7) { E.piso = 'cimento'; E.pc = ['#a8a8a0', '#85857f']; } else { E.piso = 'ladrilho'; E.pc = ['#d8d0bc', '#bdb49e']; }
      E.estiloParede = 'liso'; E.velha = true; E.lambri = r() < 0.55 ? pk(['#6a8a7a', '#7a8aa8', '#a0584a']) : false; E.lambriAlt = 34; E.capacho = '#6a4a3a';
      E.pq = r() < 0.5 ? ['#d8d0bc', '#bdb49e'] : ['#c8c0b0', '#aaa290']; E.pqTipo = 'ladrilho';
    } else if (nv === 'media') {
      const m = pk(MADEIRAS); E.piso = 'madeira'; E.pc = m; E.estiloParede = r() < 0.3 ? 'listras' : 'liso'; E.lambri = r() < 0.4 ? shade(E.parede, -0.22) : false; E.lambriAlt = 30; E.capacho = '#7a4a2a';
      E.pq = r() < 0.5 ? ['#8a9ab8', '#7a8aa8'] : ['#b8a888', '#9a8a6a']; E.pqTipo = 'carpete';
    } else {
      E.piso = 'madeira'; E.pc = r() < 0.5 ? ['#5a3a24', '#47301c'] : ['#6a4a30', '#573a24']; E.estiloParede = r() < 0.55 ? 'papel' : 'liso'; E.lambri = '#5a3c26'; E.lambriAlt = 34; E.capacho = '#4a2a3a';
      E.pq = r() < 0.5 ? ['#7a2a3a', '#6a2232'] : ['#8a8478', '#6a6458']; E.pqTipo = 'carpete';
    }
    return E;
  }
  const aplicaEstilo = (R, E) => { R.estiloParede = E.estiloParede; R.lambri = E.lambri; R.lambriAlt = E.lambriAlt; R.velha = E.velha; R.seed = E.seed; R.capacho = E.capacho; };

  // ---------- objetos com as regras do jogo (roubar, relaxar, dormir...) ----------
  function fabrica(S, R, c) {
    const d = dono(S, c), K2 = K;
    return {
      tv(x, y, w, h, e, o) { return O('tv', x, y, w, h, Object.assign({ e, label: d ? 'LIGAR A TV' : 'ROUBAR A TV', act: (S2, R2, ob) => { if (d) { G.say(pick(['Noticiário: a polícia procura um motorista de fuga vermelho...', 'Novela das 8: ela descobriu tudo!']), 4); return; } loot(S2, R2, ob, 'tv', 70, 200, 'Você levou a TV nos braços e vendeu na hora: $$.', 0.85); } }, o)); },
      sofa(x, y, w, h, e, o) { return O('sofa', x, y, w, h, Object.assign({ e, r: 30, label: 'SENTAR NO SOFÁ', act: S2 => { K2.cura(S2, 8); G.say('Você relaxou no sofá. (+8 vida)', 2.5); } }, o)); },
      poltrona(x, y, w, h, e, o) { return O('poltrona', x, y, w, h, Object.assign({ e, r: 28, label: 'SENTAR NA POLTRONA', act: S2 => { K2.cura(S2, 5); G.say('Poltrona confortável. (+5 vida)', 2.5); } }, o)); },
      geladeira(x, y, w, h, e, o) {
        return O('geladeira', x, y, w, h, Object.assign({ e, label: d ? 'ABRIR A GELADEIRA' : 'MEXER NA GELADEIRA', act: (S2, R2) => {
          const st = c.est = c.est || {}; const dia = Math.floor(S2.dayT);
          if (d) { if (st.dia === dia) { G.say('Você já pegou comida hoje. Volte amanhã!', 2.8); return; } st.dia = dia; const a = pick(['marmita', 'pao', 'maca', 'guarana', 'linguica']); L.dar(S2, a, 2); G.save(); G.say('Você pegou ' + L.ALIM[a].n + ' (x2) na geladeira. Aperte X para comer.', 3.5); return; }
          if (st.lootDia === dia) { G.say('A geladeira já foi esvaziada.', 2.2); return; } st.lootDia = dia; const a = pick(['pao', 'maca', 'banana', 'marmita', 'coxinha', 'guarana', 'cerveja']); L.dar(S2, a, 1); G.save(); G.say('Você roubou: ' + L.ALIM[a].n + '. (X para comer)', 3); ruido(S2, R2, 0.2);
        } }, o));
      },
      aparador(x, y, w, h, e, o) { return O('bloco', x, y, w, h, Object.assign({ e, top: '#7a5230', front: '#5a3a22', label: 'VASCULHAR O APARADOR', r: 36, act: (S2, R2, ob) => loot(S2, R2, ob, 'aparador', 8, nivel(c) === 'rica' ? 140 : 70, 'Achou trocados na gaveta: $$.', 0.3) }, o)); }
    };
  }

  // =====================================================================
  //  SALA (com cozinha)
  // =====================================================================
  function salaCasa(S, lg, c) {
    const nv = nivel(c), v = aVenda(S, c), d = dono(S, c), E = estilo(c), M = DIM[nv].sala;
    const R = L.novaSala({ w: M.w, h: M.h, nome: nomeCasa(S, c), cor: d ? '#2e8b3e' : v ? '#d9242a' : '#c8a060', piso: E.piso, pisoCores: E.pc, parede: E.parede });
    aplicaEstilo(R, E); R.porta = null; R.casa = c; R.spots = {};
    const x0 = R.x0, y0 = R.y0, x1 = R.x1, y1 = R.y1;
    const add = (...a) => R.objs.push(...a), F = fabrica(S, R, c);
    add(O('porta', M.dx, 96, M.dw, 54, { solid: false, k: 10, label: d || !v ? 'IR PARA OS QUARTOS' : 'VER OS QUARTOS', r: 50, placa: 'QUARTOS', act: S2 => L.irSala(S2, 'quartos', DIM[nv].quartos.px, 150 + DIM[nv].quartos.h - 40, Math.PI) }));
    const cz = E.cortina, ap = nv === 'rica' ? 1 : 0;
    if (v) {
      // casa vazia, à venda
      add(O('placa_venda', x0 + (M.w - 120) / 2, y0 + M.h * 0.45, 120, 50, { e: 0, solid: true, label: 'COMPRAR ESTA CASA — $' + c.preco, r: 56, act: (S2, R2) => comprar(S2, R2) }));
      add(O('pilha_caixas', x1 - 90, 180, 56, 40, { e: 24 }), O('pilha_caixas', x0 + 60, y1 - 100, 50, 36, { e: 22 }));
      R.deco = x => {
        K.janela(x, x0 + 70, 84, 60, 46, { vista: E.vista, grade: nv === 'simples' }); K.janela(x, x1 - 160, 84, 60, 46, { vista: E.vista, grade: nv === 'simples' });
        D.quadro(x, x0 + M.w * 0.4, 88, 30, 34, 'paisagem', '#6a4a2a');
      };
    } else if (nv === 'simples') {
      const sofaC = E.sofa;
      add(O('tapete', 150, 262, 190, 104, { solid: false, k: -50, cor: E.tap[0], cor2: E.tap[1], padrao: 'listras' }));
      add(F.tv(176, 172, 92, 30, 28, { top: '#a88a5a', front: '#7a5a3a' }));
      add(F.sofa(150, 376, 134, 44, 18, { dir: 'n', cor: sofaC, cor2: E.cor2 }));
      add(F.aparador(352, 176, 56, 24, 24, { variante: 'foto' }));
      add(O('pia', 414, 170, 62, 38, { e: 28 }), O('fogao', 480, 170, 50, 38, { e: 28, ligado: true }), F.geladeira(534, 164, 52, 42, 52, { cor: '#ece8dc' }));
      add(O('mesa_rest', 404, 296, 84, 62, { e: 14, forma: 'ret', toalha: '#e8d88a', cor: '#c85a3a', prato: '#d8a040' }));
      add(O('cadeira_rest', 372, 310, 24, 26, { dir: 'w', cor: '#c8503a' }), O('cadeira_rest', 494, 310, 24, 26, { dir: 'e', cor: '#c8503a' }), O('cadeira_rest', 432, 366, 24, 26, { dir: 's', cor: '#c8503a' }));
      add(O('planta', 74, 172, 40, 50, { vaso: '#a8a8a0', variante: 'espada' }), O('planta', 548, 426, 40, 50, { vaso: '#a8a8a0', variante: 'folhagem' }), O('ventilador', 100, 336, 26, 26));
      R.deco = x => {
        D.azulejoParede(x, 410, 104, 126, 46, '#e8f0f2', '#7ab0d0');
        K.janela(x, 96, 84, 60, 46, { vista: E.vista, grade: true, cor: '#c8c0b0', cortina: cz && E.nv === 'simples' ? '#d8d0a8' : null });
        K.janela(x, 424, 90, 44, 38, { vista: 'jardim', grade: true, cor: '#c8c0b0', semLuz: true });
        D.quadro(x, 198, 82, 48, 30, 'time', '#5a4a3a'); D.quadro(x, 366, 84, 24, 32, 'santo', '#8a6a3a');
        D.interruptor(x, 350, 112);
      };
      R.luzes.push({ x: 250, y: 330, r: 240 }, { x: 480, y: 240, r: 210 });
    } else if (nv === 'media') {
      add(O('tapete', 150, 262, 260, 134, { solid: false, k: -50, cor: E.tap[0], cor2: E.tap[1], padrao: 'persa' }));
      add(O('estante', 78, 166, 56, 26, { e: 66, variante: '' }));
      add(F.tv(196, 170, 124, 34, 34));
      add(F.aparador(412, 172, 70, 26, 26, { variante: 'abajur' }));
      add(O('pia', 498, 172, 76, 40, { e: 30 }), O('fogao', 578, 172, 56, 40, { e: 30, ligado: true }), F.geladeira(648, 164, 60, 44, 56));
      add(O('mesa_centro', 208, 304, 84, 46, { e: 12 }));
      add(F.sofa(170, 378, 190, 48, 20, { dir: 'n', cor: E.sofa, cor2: E.cor2 }));
      add(F.poltrona(410, 306, 54, 52, 20, { dir: 's', cor: E.sofa2, almofadas: false }));
      add(O('luminaria', 376, 392, 20, 16));
      add(O('mesa_rest', 500, 332, 110, 86, { e: 16, forma: 'redonda', toalha: '#f4ecd8', cor: '#c8302a', prato: '#d8a040' }));
      add(O('cadeira_rest', 541, 298, 28, 30, { dir: 'n' }), O('cadeira_rest', 466, 358, 28, 30, { dir: 'w' }), O('cadeira_rest', 616, 358, 28, 30, { dir: 'e' }), O('cadeira_rest', 541, 424, 28, 30, { dir: 's' }));
      add(O('planta', 74, 436, 40, 50, {}), O('planta', 664, 470, 40, 50, {}), O('planta', 92, 262, 40, 50, {}));
      R.deco = x => {
        D.azulejoParede(x, 494, 100, 220, 50, '#eef2f2', '#6a9ac8');
        D.armarioParede(x, 498, 70, 76, 46, '#8a5e3a'); D.armarioParede(x, 580, 70, 58, 46, '#8a5e3a');
        K.janela(x, 142, 84, 50, 46, { vista: E.vista, cortina: cz });
        K.janela(x, 508, 82, 60, 38, { vista: 'jardim', semLuz: false, cortina: null, flores: true });
        D.quadro(x, 424, 84, 46, 34, pick(['paisagem', 'abstrato', 'flor']), '#5a3a22');
        D.prateleira(x, 214, 84, 90, ['livro', 'vaso', 'foto', 'livro']); D.relogio(x, 356, 80, 11);
        D.interruptor(x, 406, 114);
      };
      R.luzes.push({ x: 260, y: 340, r: 300 }, { x: 560, y: 260, r: 250 });
    } else {
      add(O('tapete', 160, 262, 340, 160, { solid: false, k: -50, cor: E.tap[0], cor2: E.tap[1], padrao: 'persa' }));
      add(O('estante', 80, 166, 60, 26, { e: 72 }));
      add(F.tv(222, 172, 170, 36, 36, { top: '#3a2a1c', front: '#2a1e14' }));
      add(F.aparador(398, 174, 74, 26, 26, { variante: 'foto' }));
      add(O('lareira', 556, 166, 100, 30, { e: 68 }));
      add(O('pia', 676, 172, 92, 40, { e: 30 }), O('fogao', 770, 172, 56, 40, { e: 30, ligado: true }), F.geladeira(830, 164, 60, 46, 60, { cor: '#c3c8cf' }));
      add(O('ilha', 664, 296, 150, 48, { e: 30 }));
      [676, 720, 764].forEach(bx => add(O('banqueta', bx, 350, 28, 30, { cor: '#2a2d36' })));
      add(O('mesa_centro', 236, 314, 112, 58, { e: 12 }));
      add(F.sofa(180, 392, 244, 52, 22, { dir: 'n', cor: E.sofa, cor2: E.cor2, manta: E.sofa2 }));
      add(F.poltrona(112, 312, 58, 58, 22, { dir: 's', cor: E.sofa2, almofadas: false }), F.poltrona(436, 312, 58, 58, 22, { dir: 's', cor: E.sofa2, almofadas: false }));
      add(O('luminaria', 150, 440, 20, 16), O('luminaria', 456, 440, 20, 16));
      add(O('mesa_rest', 560, 404, 230, 92, { e: 16, forma: 'ret', toalha: '#f4ecd8', cor: '#7a1a2a', prato: '#d8a040' }));
      [582, 640, 706].forEach(cx => add(O('cadeira_rest', cx, 366, 28, 30, { dir: 'n', cor: '#5a1a2a' }), O('cadeira_rest', cx, 504, 28, 30, { dir: 's', cor: '#5a1a2a' })));
      add(O('cadeira_rest', 526, 428, 28, 30, { dir: 'w', cor: '#5a1a2a' }), O('cadeira_rest', 796, 428, 28, 30, { dir: 'e', cor: '#5a1a2a' }));
      add(O('planta', 76, 440, 42, 56, {}), O('planta', 836, 520, 42, 56, {}), O('planta', 520, 250, 40, 52, {}), O('planta', 76, 270, 42, 56, {}));
      R.pisoExtra = x => { D.piso(x, 'porcelanato', 640, 150, 250, 190, ['#e8e2d6', '#bdb6a6'], 9); x.fillStyle = '#c8ccd4'; x.fillRect(640, 150, 3, 190); D.piso(x, 'taco', 520, 350, 340, 240, ['#7a5230', '#5a3a22'], 4); };
      R.deco = x => {
        D.azulejoParede(x, 672, 100, 218, 50, '#f2f2ee', '#c8a24a');
        D.armarioParede(x, 676, 72, 90, 48, '#4a3220'); D.armarioParede(x, 770, 72, 58, 48, '#4a3220');
        K.janela(x, 156, 76, 56, 58, { vista: E.vista, cortina: cz || '#8a2a3a', arco: true });
        K.janela(x, 420, 76, 56, 58, { vista: E.vista, cortina: cz || '#8a2a3a', arco: true });
        D.quadro(x, 240, 84, 130, 34, 'paisagem', '#c8a24a'); D.quadro(x, 498, 82, 40, 52, 'retrato', '#c8a24a');
        D.relogio(x, 520, 100, 12, '#c8a24a');
        D.prateleira(x, 560, 80, 100, ['troféu', 'livro', 'vaso', 'foto']);
      };
      R.luzes.push({ x: 300, y: 360, r: 340 }, { x: 560, y: 250, r: 260 }, { x: 680, y: 450, r: 280 });
    }
    R.luzes.push({ x: x0 + M.w * 0.45, y: y0 + M.h * 0.55, r: Math.max(260, M.w * 0.42) });
    R.aoEntrar = (S2, R2) => {
      povoar(S2, R2);
      const lg2 = R2.lugar; if (lg2.avisou || v || d) return; lg2.avisou = true;
      lg2.avisoT = K.armado(S2) ? 1.5 : 4.5;
    };
    R.onUpdate = onUpdate;
    return R;
  }

  // =====================================================================
  //  QUARTOS
  // =====================================================================
  function quartosCasa(S, lg, c) {
    const nv = nivel(c), v = aVenda(S, c), d = dono(S, c), E = estilo(c), M = DIM[nv].quartos, SM = DIM[nv].sala;
    const R = L.novaSala({ w: M.w, h: M.h, nome: nomeCasa(S, c) + ' — QUARTOS', cor: d ? '#2e8b3e' : '#c8a060', piso: E.pqTipo, pisoCores: E.pq, parede: shade(E.parede, 0.04), portaX: M.px });
    aplicaEstilo(R, E); R.seed += 7; R.casa = c; R.porta = { para: 'entrada', px: portaSalaCx(nv), py: 200, ph: Math.PI, label: 'VOLTAR PARA A SALA', rotulo: 'SALA' };
    const x0 = R.x0, y0 = R.y0, x1 = R.x1, y1 = R.y1, add = (...a) => R.objs.push(...a), F = fabrica(S, R, c);
    const cama = (x, y, w, h, o) => O('cama2', x, y, w, h, Object.assign({ e: 0 }, o));
    const portaBanho = () => add(O('porta', M.bx, 96, M.bw, 54, { solid: false, k: 10, label: 'IR AO BANHEIRO', r: 50, placa: 'BANHEIRO', act: S2 => L.irSala(S2, 'banheiro', DIM[nv].banho.px, 150 + DIM[nv].banho.h - 40, Math.PI) }));
    const bedAct = (S2, R2) => {
      if (!d) { K.cura(S2, 5); G.say('Você deitou na cama dos outros. Que sem-vergonha! (+5 vida)', 3); ruido(S2, R2, 0.5); return; }
      L.trans(S2, () => { S2.dayT = Math.floor(S2.dayT) + 1.02; S2.player.hp = 100; S2.heat = 0; S2.heatLevel = 0; G.save(); G.say('Bom dia! Você dormiu na SUA casa. Vida cheia e jogo salvo.', 5); });
    };
    const cofre = (x, y) => add(O('cofre', x, y, 52, 40, { e: 40, label: 'ARROMBAR O COFRE (TIMING)', r: 40, act: (S2, R2, o) => {
      if (c.achados && c.achados.cofre) { G.say('O cofre já foi arrombado.', 2.2); return; }
      L.miniTiming(S2, { titulo: 'ARROMBANDO O COFRE', reps: 3, v: 1.3, zona: 0.16, cb: (S3, R3, ok) => {
        if (ok >= 2) { c.achados = c.achados || {}; c.achados.cofre = true; o.aberto = true; const v2 = money(nv === 'rica' ? rand(300, 900) : rand(120, 380)); S3.save.money += v2; G.save(); G.snd.cash(); G.say('COFRE ABERTO! Você levou $' + v2 + '.', 4); ruido(S3, R3, 0.6); }
        else { G.say('Você errou a combinação. O alarme do cofre disparou!', 3.5); G.snd.beep(); K.chamaPolicia(S3, R3, 8); }
      } });
    } }));
    const armario = (x, y, w, o) => O('armario', x, y, w, 44, Object.assign({ e: 64, label: d ? 'ABRIR O GUARDA-ROUPA' : 'VASCULHAR O GUARDA-ROUPA', r: 40, front: nv === 'rica' ? '#6a4a30' : nv === 'simples' ? '#b8a888' : '#8a5e3a', act: d ? (S2) => G.say('Suas roupas estão aqui. (Mude o visual na barbearia ou no shopping.)', 3.5) : (S2, R2, ob) => loot(S2, R2, ob, 'armario', 10, nv === 'rica' ? 160 : 70, 'Escondido entre as roupas: $$.', 0.5) }, o));
    const carteira = (x, y, w) => add(O('bloco', x, y, w || 30, 30, { e: 18, top: '#7a5230', front: '#5a3a22', variante: 'abajur', label: d ? undefined : 'PEGAR A CARTEIRA', r: 36, act: d ? undefined : (S2, R2, ob) => loot(S2, R2, ob, 'carteira', 15, 90, 'Você pegou uma carteira: $$.', 0.4) }));
    const corCama = d ? '#2e8b5e' : '#4a78c8';
    if (nv === 'simples') {
      if (v) add(O('pilha_caixas', 120, 190, 60, 44, { e: 26 }));
      else {
        add(O('tapete', 200, 300, 150, 80, { solid: false, k: -50, cor: E.tap[0], cor2: E.tap[1], padrao: 'listras' }));
        add(cama(84, 188, 112, 88, { cor: corCama, label: d ? 'DORMIR ATÉ AMANHECER (SALVA O JOGO)' : 'DESCANSAR NA CAMA', r: 40, act: bedAct }));
        carteira(198, 198, 26);
        if (!d) add(cama(286, 192, 60, 78, { cor: '#e8a040' }), cama(360, 192, 60, 78, { cor: '#40b8a0' }), cama(434, 192, 60, 78, { cor: '#b84a8a' }));
        add(armario(84, 372, 86, {}), O('cesto', 250, 392, 26, 26, {}), O('planta', 440, 380, 40, 50, { vaso: '#a8a8a0', variante: 'folhagem' }));
        add(O('ventilador', 420, 320, 26, 26));
      }
      portaBanho();
      R.deco = x => {
        K.janela(x, 108, 84, 50, 44, { vista: E.vista, grade: true, cor: '#c8c0b0' }); K.janela(x, 330, 84, 50, 44, { vista: E.vista, grade: true, cor: '#c8c0b0' });
        D.quadro(x, 400, 86, 54, 32, 'flor', '#8a6a3a'); D.interruptor(x, 300, 112);
      };
      R.luzes.push({ x: 290, y: 320, r: 240 });
    } else if (nv === 'media') {
      if (v) add(O('pilha_caixas', 120, 190, 60, 44, { e: 26 }), O('pilha_caixas', 450, 420, 56, 40, { e: 24 }));
      else {
        add(O('tapete', 250, 322, 230, 100, { solid: false, k: -50, cor: E.tap[0], cor2: E.tap[1], padrao: 'geometrico' }));
        add(cama(90, 190, 130, 92, { cor: corCama, label: d ? 'DORMIR ATÉ AMANHECER (SALVA O JOGO)' : 'DESCANSAR NA CAMA', r: 40, act: bedAct }));
        carteira(224, 196, 28);
        if (!d) add(cama(258, 190, 70, 82, { cor: '#e8a040' }), cama(346, 190, 70, 82, { cor: '#40b8a0', padrao: 'listras' }), cama(434, 190, 70, 82, { cor: '#b84a8a' }));
        add(armario(90, 432, 120, {}));
        add(O('escrivaninha', 250, 440, 120, 54, { e: 22 }), O('cadeira_esc', 296, 496, 28, 28, {}));
        if (!d) cofre(566, 440);
        add(O('cesto', 224, 300, 26, 26, {}), O('planta', 584, 330, 40, 50, {}), O('luminaria', 500, 470, 20, 16));
      }
      portaBanho();
      R.deco = x => {
        D.quadro(x, 112, 86, 70, 34, pick(['paisagem', 'abstrato']), '#5a3a22');
        K.janela(x, 270, 82, 60, 46, { vista: E.vista, cortina: E.cortina }); K.janela(x, 436, 82, 60, 46, { vista: E.vista, cortina: E.cortina });
        D.interruptor(x, 520, 112);
      };
      R.luzes.push({ x: 330, y: 330, r: 280 });
    } else {
      if (v) add(O('pilha_caixas', 120, 190, 60, 44, { e: 26 }), O('pilha_caixas', 600, 440, 56, 40, { e: 24 }));
      else {
        add(O('tapete', 96, 290, 240, 120, { solid: false, k: -50, cor: E.tap[0], cor2: E.tap[1], padrao: 'persa' }));
        add(cama(112, 190, 170, 100, { cor: d ? '#2e8b5e' : '#7a2a3a', padrao: 'listras', label: d ? 'DORMIR ATÉ AMANHECER (SALVA O JOGO)' : 'DESCANSAR NA CAMA', r: 44, act: bedAct }));
        add(O('bloco', 76, 196, 32, 30, { e: 20, top: '#7a5230', front: '#5a3a22', variante: 'abajur' })); carteira(288, 196, 32);
        if (!d) add(cama(360, 190, 76, 84, { cor: '#e8a040' }), cama(454, 190, 76, 84, { cor: '#40b8a0', padrao: 'listras' }), cama(548, 190, 76, 84, { cor: '#b84a8a' }));
        add(armario(96, 476, 130, {}), O('armario', 232, 476, 100, 44, { e: 64, front: '#6a4a30', espelho: true }));
        add(O('escrivaninha', 420, 470, 140, 56, { e: 22 }), O('cadeira_esc', 478, 528, 28, 28, {}));
        add(O('poltrona', 640, 330, 58, 58, { e: 22, dir: 's', cor: E.sofa2, label: 'SENTAR NA POLTRONA', r: 28, act: S2 => { K.cura(S2, 5); G.say('Poltrona confortável. (+5 vida)', 2.5); } }));
        if (!d) cofre(710, 500);
        add(O('planta', 78, 380, 42, 56, {}), O('planta', 724, 420, 42, 56, {}), O('luminaria', 340, 300, 20, 16), O('cesto', 360, 420, 26, 26, {}));
      }
      portaBanho();
      R.deco = x => {
        K.janela(x, 150, 74, 100, 58, { vista: E.vista, cortina: E.cortina || '#8a2a3a', arco: true }); K.janela(x, 372, 80, 60, 50, { vista: E.vista, cortina: E.cortina }); K.janela(x, 560, 80, 60, 50, { vista: E.vista, cortina: E.cortina });
        D.quadro(x, 76, 84, 40, 50, 'retrato', '#c8a24a'); D.quadro(x, 470, 84, 50, 34, 'abstrato', '#c8a24a'); D.interruptor(x, 640, 112);
      };
      R.luzes.push({ x: 300, y: 340, r: 320 }, { x: 560, y: 330, r: 260 });
    }
    R.aoEntrar = (S2, R2) => povoar(S2, R2);
    R.onUpdate = onUpdate;
    return R;
  }

  // =====================================================================
  //  BANHEIRO
  // =====================================================================
  function banheiroCasa(S, lg, c) {
    const nv = nivel(c), v = aVenda(S, c), d = dono(S, c), E = estilo(c), M = DIM[nv].banho, QM = DIM[nv].quartos;
    const azul = ['#cfe4ec', '#d8ecd8', '#f0e4d0', '#e0dcec'][E.seed % 4];
    const R = L.novaSala({ w: M.w, h: M.h, nome: nomeCasa(S, c) + ' — BANHEIRO', cor: d ? '#2e8b3e' : '#c8a060', piso: nv === 'rica' ? 'porcelanato' : 'azulejo', pisoCores: nv === 'rica' ? ['#e8e2d6', '#bdb6a6'] : ['#f0f2f0', '#9aa8ac', '#6a9ac8'], parede: azul, portaX: M.px });
    R.estiloParede = 'azulejo'; R.lambri = false; R.seed = E.seed + 3; R.casa = c; R.capacho = '#4a7aa8';
    R.porta = { para: 'quartos', px: portaBanhoCx(nv), py: 200, ph: Math.PI, label: 'VOLTAR PARA OS QUARTOS', rotulo: 'QUARTOS' };
    const add = (...a) => R.objs.push(...a), x0 = R.x0, y0 = R.y0, x1 = R.x1, y1 = R.y1;
    if (nv === 'simples') {
      add(O('vaso_sanitario', 92, 172, 34, 42, { e: 14 }), O('lavatorio', 140, 176, 54, 36, { e: 24, label: d ? 'LAVAR AS MÃOS' : undefined, r: 30, act: d ? S2 => { K.cura(S2, 2); G.say('Você lavou o rosto. (+2 vida)', 2.2); } : undefined }), O('chuveiro', 212, 166, 66, 78, {}));
      if (!v) add(O('cesto', 96, 296, 26, 26, {}));
      R.deco = x => { K.janela(x, 100, 84, 40, 34, { vista: 'jardim', persiana: 0.5, cor: '#c8c0b0', semLuz: true }); D.espelhoParede(x, 148, 84, 42, 34, '#a8a8a0'); D.toalheiro(x, 214, 84, 60); };
      R.luzes.push({ x: 180, y: 260, r: 190 });
    } else if (nv === 'media') {
      add(O('vaso_sanitario', 96, 172, 36, 44, { e: 14 }), O('lavatorio', 152, 176, 62, 38, { e: 26, label: d ? 'LAVAR AS MÃOS' : undefined, r: 30, act: d ? S2 => { K.cura(S2, 2); G.say('Você lavou o rosto. (+2 vida)', 2.2); } : undefined }), O('chuveiro', 250, 166, 76, 84, {}));
      if (!v) add(O('lavadora', 90, 268, 52, 44, { e: 34 }), O('cesto', 160, 300, 26, 26, {}), O('tapete', 150, 330, 80, 46, { solid: false, k: -50, cor: '#4aa0c8', cor2: '#e8f4f8', padrao: 'pelo' }));
      R.deco = x => { K.janela(x, 100, 84, 44, 34, { vista: 'jardim', persiana: 0.4, semLuz: true }); D.espelhoParede(x, 156, 82, 50, 38); D.toalheiro(x, 218, 84, 32); };
      R.luzes.push({ x: 205, y: 280, r: 220 });
    } else {
      add(O('banheira', 92, 172, 160, 72, {}), O('lavatorio', 276, 176, 64, 40, { e: 26, label: d ? 'LAVAR AS MÃOS' : undefined, r: 30, act: d ? S2 => { K.cura(S2, 2); G.say('Você lavou o rosto. (+2 vida)', 2.2); } : undefined }), O('lavatorio', 342, 176, 64, 40, { e: 26 }), O('vaso_sanitario', 96, 300, 36, 44, { e: 14 }), O('chuveiro', 340, 262, 84, 94, {}));
      if (!v) add(O('cesto', 160, 330, 26, 26, {}), O('planta', 236, 330, 40, 50, {}), O('tapete', 210, 272, 90, 56, { solid: false, k: -50, cor: '#e8e0d0', cor2: '#c8a24a', padrao: 'pelo' }));
      R.deco = x => { K.janela(x, 110, 82, 70, 40, { vista: E.vista, persiana: 0, cortina: '#e8e0d0', semLuz: true }); D.espelhoParede(x, 276, 78, 60, 42, '#c8a24a'); D.espelhoParede(x, 344, 78, 60, 42, '#c8a24a'); D.toalheiro(x, 428, 84, 36); };
      R.luzes.push({ x: 260, y: 300, r: 260 });
    }
    return R;
  }

  // ---------- registro ----------
  L.casaLay = {
    spots: nv => SPOTS[nv],
    criar(id, S, lg, c) { return id === 'quartos' ? quartosCasa(S, lg, c) : id === 'banheiro' ? banheiroCasa(S, lg, c) : salaCasa(S, lg, c); }
  };
})(window.G = window.G || {});
