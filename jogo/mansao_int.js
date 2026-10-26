/* =====================================================================
   MANSAO_INT.JS — por dentro da VILLA BELLAROSA, a mansão do chefão (estilo máfia).
   Salas (todas ligadas ao SALÃO DE ENTRADA):
     • SALÃO DE ENTRADA  mármore xadrez, escadaria, lustre, estátuas, seguranças e o mordomo (chama o carro)
     • ESCRITÓRIO        mesa de mogno, biblioteca, lareira, TELEFONE e o COFRE (guarda dinheiro a salvo)
     • SALÃO DE ESTAR    bar com barman (bebidas), piano de cauda, charuteira, sofás de couro
     • SALA DE JOGOS     sinuca e pôquer (aposta de dinheiro)
     • JANTAR E COZINHA  mesa comprida, chef (prato do dia) e geladeira
     • SUÍTE              cama king: DORME E SALVA o jogo, banheira
     • ADEGA E ARSENAL   vinhos, barris; repõe munição e dá colete 1x por dia
   O terreno e a casa por fora estão em world.js (p7/p8) e o portão/seguranças em mansao.js.
   ===================================================================== */
(function (G) {
  'use strict';
  const W = G.world, M = W.MANSAO;
  if (!M) return;
  const L = G.lugares, K = L.kit, D = G.deco, SP = G.sprites;
  const O = K.O, TAU = Math.PI * 2, rand = K.rand, pick = K.pick;
  const look = o => Object.assign(SP.randomLook(), { acc: 'none' }, o);
  const TERNO = { shirt: '#101014', pants: '#101014', shoe: '#08080a', sleeve: 'longa', acc: 'shades', accCol: '#101014', hairStyle: 'curto', hair: '#111114', fem: false, dress: false, pat: 'liso' };
  const sv = S => { const s = S.save.mansao = S.save.mansao || {}; if (s.cofre == null) s.cofre = 0; return s; };
  const dia = S => Math.floor(S.dayT);
  const porta = (x, y, w, o) => O('porta', x, y, w, 54, Object.assign({ solid: false, k: 10, r: 50 }, o));

  // tamanho de cada sala e onde fica cada porta no salão de entrada (cx = centro da porta)
  const DIM = { hall: { w: 960, h: 520 }, escritorio: { w: 760, h: 480 }, salao: { w: 900, h: 520 }, jogos: { w: 760, h: 480 }, jantar: { w: 900, h: 500 }, suite: { w: 820, h: 480 }, adega: { w: 760, h: 460 } };
  const PORTAS = { escritorio: { x: 110, cx: 140 }, adega: { x: 200, cx: 230 }, salao: { x: 290, cx: 320 }, jantar: { x: 730, cx: 760 }, jogos: { x: 820, cx: 850 }, suite: { cx: 550, y: 340 } };
  const irPara = (S, id) => { const d = DIM[id]; L.irSala(S, id, 70 + d.w / 2, 150 + d.h - 40, Math.PI); };
  const nova = (lg, id, nome, o) => {
    const d = DIM[id], R = L.novaSala(Object.assign({ place: lg.place, w: d.w, h: d.h, nome: 'VILLA BELLAROSA — ' + nome, cor: '#8a1c24', capacho: '#5a1218' }, o));
    R.casa = lg.place.casa;
    if (id !== 'hall') { const p = PORTAS[id]; R.porta = { para: 'hall', px: p.cx, py: p.y || 200, ph: Math.PI, label: 'VOLTAR AO SALÃO DE ENTRADA', rotulo: 'SALÃO' }; }
    return R;
  };
  const paredeMafia = { estiloParede: 'papel', lambri: '#3a2214', lambriAlt: 34, rodape: '#24140a' };
  const npc = (R, x, y, nome, falas, o) => { const n = Object.assign({ x, y, p: look({}), h: Math.PI, falas, nome, dinheiro: 0, k: y + 50 }, o || {}); R.npcs.push(n); return n; };

  // ---------- coisas que acontecem na mansão ----------
  function menuCofre(S) {
    const dep = v => ({ n: 'Guardar $' + v, desc: 'fica a salvo de multas, da polícia e de ladrões', fn: S2 => { if (S2.save.money < v) { G.say('Você não tem $' + v + ' na mão.', 2.5); return; } S2.save.money -= v; sv(S2).cofre += v; G.snd.cash(); G.save(); } });
    const saq = v => ({ n: 'Sacar $' + v, desc: 'tira dinheiro do cofre', fn: S2 => { const s = sv(S2); if (s.cofre < v) { G.say('O cofre só tem $' + s.cofre + '.', 2.5); return; } s.cofre -= v; S2.save.money += v; G.snd.cash(); G.save(); } });
    L.abrirMenu(S, {
      titulo: 'COFRE DO CHEFE', rodape: 'W/S escolher  ·  E confirmar  ·  ESC sair', info: S2 => 'no cofre $' + sv(S2).cofre + '  ·  na mão $' + Math.floor(S2.save.money),
      itens: [dep(100), dep(500), dep(2000),
        { n: 'Guardar tudo', desc: 'todo o dinheiro que você tem na mão', fn: S2 => { const v = Math.floor(S2.save.money); if (v <= 0) { G.say('Você está sem dinheiro na mão.', 2.5); return; } S2.save.money -= v; sv(S2).cofre += v; G.snd.cash(); G.save(); } },
        saq(100), saq(500), { n: 'Sacar tudo', desc: 'esvazia o cofre', fn: S2 => { const s = sv(S2); if (s.cofre <= 0) { G.say('O cofre está vazio.', 2.5); return; } S2.save.money += s.cofre; s.cofre = 0; G.snd.cash(); G.save(); } },
        { n: 'Fechar o cofre', fn: () => 'fechar' }]
    });
  }
  function menuTelefone(S) {
    L.abrirMenu(S, {
      titulo: 'TELEFONE DO CHEFE', rodape: 'W/S escolher  ·  E confirmar  ·  ESC sair',
      itens: [
        { n: 'Chamar o motorista', desc: 'o carro preto da família é levado até o pátio', fn: S2 => { G.mansao.chamarCarro(S2); return 'fechar'; } },
        { n: 'Pedir uma pizza ($30)', desc: 'chega quentinha: +40 de vida', fn: S2 => { K.compra(S2, 30, () => { K.cura(S2, 40); G.say('A pizza chegou e estava ótima! (+40 vida)', 3); }); } },
        { n: 'Desligar', fn: () => 'fechar' }]
    });
  }
  const bebida = (n, desc, vida, beb, ene) => ({ n, desc, fn: S2 => { K.cura(S2, vida); if (beb) S2.bebado = (S2.bebado || 0) + beb; if (ene) S2.energia = (S2.energia || 0) + ene; G.say(n + ': ' + (vida ? '+' + vida + ' vida. ' : '') + (beb ? 'Cuidado: dá tontura.' : ''), 3); } });
  function menuBar(S) {
    L.abrirMenu(S, {
      titulo: 'BAR DA VILLA — VITTORIO', rodape: 'W/S escolher  ·  E confirmar  ·  ESC sair', info: () => 'a casa oferece',
      itens: [bebida('Café expresso', 'desperta: corre mais por um tempo', 6, 0, 40), bebida('Vinho tinto da adega', 'um clássico', 8, 6, 0), bebida('Uísque 18 anos', 'forte, hein?', 5, 12, 0), bebida('Grappa', 'bem forte', 4, 16, 0), bebida('Água com gás', 'sem culpa', 3, 0, 0), { n: 'Fechar', fn: () => 'fechar' }]
    });
  }
  function aposta(S, titulo, valores, p, mult) {
    const it = valores.map(v => ({ n: 'Apostar $' + v, desc: 'chance de ganhar: ' + Math.round(p * 100) + '%  ·  prêmio $' + Math.round(v * mult), fn: S2 => {
      if (S2.save.money < v) { G.say('Você não tem $' + v + '.', 2.5); return; }
      S2.save.money -= v;
      if (Math.random() < p) { S2.save.money += Math.round(v * mult); G.snd.cash(); G.say('Você ganhou! +$' + Math.round(v * mult), 3); } else G.say('Você perdeu $' + v + '... a casa sempre ganha.', 3);
      G.save();
    } }));
    it.push({ n: 'Sair da mesa', fn: () => 'fechar' });
    L.abrirMenu(S, { titulo, rodape: 'W/S escolher  ·  E confirmar  ·  ESC sair', info: S2 => 'você tem $' + Math.floor(S2.save.money), itens: it });
  }
  function menuArsenal(S) {
    const s = sv(S), C = G.combat;
    L.abrirMenu(S, {
      titulo: 'ARSENAL DA VILLA', rodape: 'W/S escolher  ·  E confirmar  ·  ESC sair', info: () => 'só para o chefe',
      itens: [
        { n: 'Repor munição', desc: 'enche as armas que você já tem (1x por dia)', fn: S2 => {
          if (s.armaDia === dia(S2)) { G.say('Hoje você já repôs a munição. Volte amanhã.', 3); return; }
          const a = C.arms(S2); let n = 0;
          Object.keys(a.own).forEach(id => { const w = C.WEAPONS[id]; if (w && !w.melee && w.id !== 'fist' && !/gren/.test(id)) { a.ammo[id] = Math.min(240, (a.ammo[id] || 0) + 40); n++; } });
          if (!n) { G.say('Você não tem armas de fogo. Compre uma na loja rosa.', 3.5); return; }
          s.armaDia = dia(S2); G.save(); G.snd.cash(); G.say('Munição reposta em ' + n + ' arma(s). (+40 balas cada)', 3.5);
        } },
        { n: 'Pegar um colete', desc: 'colete à prova de balas novo (1x por dia)', fn: S2 => {
          if (s.coleteDia === dia(S2)) { G.say('Hoje você já pegou um colete.', 3); return; }
          s.coleteDia = dia(S2); S2.player.armor = 100; G.save(); G.say('Colete à prova de balas vestido!', 3);
        } },
        { n: 'Fechar', fn: () => 'fechar' }]
    });
  }
  const dorme = (S2) => L.trans(S2, () => { S2.dayT = Math.floor(S2.dayT) + 1.02; S2.player.hp = 100; S2.heat = 0; S2.heatLevel = 0; G.save(); G.say('Bom dia, chefe! Vida cheia e jogo salvo na Villa Bellarosa.', 5); });
  const menuMordomo = S => L.abrirMenu(S, {
    titulo: 'ALFREDO, O MORDOMO', rodape: 'W/S escolher  ·  E confirmar  ·  ESC sair',
    itens: [{ n: 'Chamar o motorista', desc: 'o carro preto é levado até o pátio', fn: S2 => { G.mansao.chamarCarro(S2); return 'fechar'; } },
      bebida('Um café, Alfredo', 'sempre quentinho', 6, 0, 40), { n: 'Obrigado, Alfredo', fn: () => 'fechar' }]
  });
  const menuChef = S => L.abrirMenu(S, {
    titulo: 'CHEF GENNARO', rodape: 'W/S escolher  ·  E confirmar  ·  ESC sair',
    itens: [{ n: 'Prato do dia', desc: 'macarrão da nonna: +40 de vida (a cada 2 horas do jogo)', fn: S2 => {
      const s = sv(S2); if (s.pratoT != null && S2.dayT - s.pratoT < 0.09) { G.say('Gennaro: "Calma, chefe! O próximo prato ainda está no forno."', 3.5); return; }
      s.pratoT = S2.dayT; K.cura(S2, 40); G.say('Delicioso! O macarrão da nonna. (+40 vida)', 3.5);
    } }, { n: 'Só estava olhando', fn: () => 'fechar' }]
  });

  // =====================================================================
  //  SALÃO DE ENTRADA
  // =====================================================================
  function hall(lg) {
    const R = nova(lg, 'hall', 'SALÃO DE ENTRADA', Object.assign({ piso: 'xadrez', pisoCores: ['#efe9dc', '#25252b'], parede: '#d8cdb4', subtitulo: 'o chefe chegou' }, paredeMafia, { lambri: '#3a2214' }));
    R.porta = null; R.casa = lg.place.casa;
    const add = (...a) => R.objs.push(...a);
    add(porta(PORTAS.escritorio.x, 96, 60, { placa: 'GABINETE', label: 'IR AO ESCRITÓRIO', act: S2 => irPara(S2, 'escritorio') }));
    add(porta(PORTAS.adega.x, 96, 60, { placa: 'ADEGA', label: 'DESCER PARA A ADEGA', act: S2 => irPara(S2, 'adega') }));
    add(porta(PORTAS.salao.x, 96, 60, { placa: 'SALÃO', label: 'IR AO SALÃO DE ESTAR', act: S2 => irPara(S2, 'salao') }));
    add(porta(PORTAS.jantar.x, 96, 60, { placa: 'JANTAR', label: 'IR À SALA DE JANTAR', act: S2 => irPara(S2, 'jantar') }));
    add(porta(PORTAS.jogos.x, 96, 60, { placa: 'JOGOS', label: 'IR À SALA DE JOGOS', act: S2 => irPara(S2, 'jogos') }));
    add(O('escada_grande', 420, 160, 260, 140, { solid: true, label: 'SUBIR PARA A SUÍTE', r: 100, k: 400, act: S2 => L.irSala(S2, 'suite', 70 + DIM.suite.w / 2, 150 + DIM.suite.h - 40, Math.PI) }));
    add(O('tapete', 300, 330, 500, 170, { solid: false, k: -50, cor: '#7a1c24', cor2: '#d8b878', padrao: 'persa' }));
    add(O('estatua', 368, 168, 44, 44, { e: 80 }), O('estatua', 690, 168, 44, 44, { e: 80 }));
    add(O('poltrona', 100, 420, 56, 54, { e: 22, cor: '#5a1a22', dir: 'n', label: 'SENTAR NA POLTRONA', r: 40, act: S2 => { K.cura(S2, 5); G.say('Poltrona de couro. (+5 vida)', 2.5); } }));
    add(O('poltrona', 904, 420, 56, 54, { e: 22, cor: '#5a1a22', dir: 'n', label: 'SENTAR NA POLTRONA', r: 40, act: S2 => { K.cura(S2, 5); G.say('Poltrona de couro. (+5 vida)', 2.5); } }));
    add(O('planta', 84, 172, 44, 54, { variante: 'palmeira', vaso: '#c8a24a' }), O('planta', 924, 172, 44, 54, { variante: 'palmeira', vaso: '#c8a24a' }));
    add(O('lustre', 520, 540, 60, 40, { e: 150, solid: false, k: 900 }));
    npc(R, 330, 420, 'Segurança', ['Boa noite, chefe.', 'Tudo sob controle.', 'Ninguém entra sem o senhor autorizar.'], { p: look(TERNO), h: 0, armed: true });
    npc(R, 790, 420, 'Segurança', ['O senhor precisa de algo?', 'A ronda está completa.'], { p: look(TERNO), h: 0, armed: true });
    npc(R, 550, 330, 'Alfredo, o mordomo', ['Boa noite, patrão. Deseja algo?', 'O jantar será servido às oito.', 'A casa está em ordem, senhor.'], { p: look({ shirt: '#f2f2f2', pants: '#101014', shoe: '#08080a', sleeve: 'longa', hair: '#c8c8c8', hairStyle: 'curto', skin: '#f0c8a0', fem: false, pat: 'liso' }), h: 0, label: 'FALAR COM O MORDOMO', act: S2 => menuMordomo(S2) });
    R.deco = x => {
      D.quadro(x, 480, 100, 120, 42, 'retrato', '#c8a24a');
      x.fillStyle = '#c8a24a'; [372, 394, 716, 738].forEach(px => { x.fillRect(px, 134, 3, 8); x.fillStyle = '#fff1b0'; x.fillRect(px, 128, 3, 6); x.fillStyle = '#c8a24a'; });   // arandelas
    };
    R.luzes.push({ x: 550, y: 330, r: 420 }, { x: 250, y: 220, r: 200 }, { x: 850, y: 220, r: 200 });
    return R;
  }

  // =====================================================================
  //  ESCRITÓRIO DO CHEFÃO
  // =====================================================================
  function escritorio(lg) {
    const R = nova(lg, 'escritorio', 'ESCRITÓRIO DO CHEFE', Object.assign({ piso: 'madeira', pisoCores: ['#5a3a24', '#47301c'], parede: '#4a1c22', subtitulo: 'negócios da família' }, paredeMafia));
    const add = (...a) => R.objs.push(...a);
    add(O('tapete', 200, 270, 380, 210, { solid: false, k: -50, cor: '#1f3050', cor2: '#d8b878', padrao: 'persa' }));
    add(O('estante', 86, 162, 70, 58, { e: 52 }), O('estante', 160, 162, 70, 58, { e: 52 }), O('estante', 234, 162, 70, 58, { e: 52 }));
    add(O('lareira', 440, 160, 140, 60, { e: 70 }));
    add(O('cofre', 640, 166, 76, 50, { e: 54, r: 46, label: 'ABRIR O COFRE DO CHEFE', k: 170, act: S2 => menuCofre(S2) }));
    add(O('cadeira_esc', 372, 262, 44, 44, { dir: 'n', cor: '#2a1a14' }));
    add(O('escrivaninha', 290, 300, 200, 74, { e: 32 }));
    add(O('telefone', 420, 288, 34, 26, { e: 12, solid: false, k: 520, r: 44, label: 'USAR O TELEFONE', act: S2 => menuTelefone(S2) }));
    add(O('poltrona', 150, 400, 54, 52, { e: 22, cor: '#5a1a22', dir: 'n', label: 'SENTAR NA POLTRONA', r: 40, act: S2 => { K.cura(S2, 5); G.say('Couro macio. (+5 vida)', 2.5); } }));
    add(O('poltrona', 600, 400, 54, 52, { e: 22, cor: '#5a1a22', dir: 'n', label: 'SENTAR NA POLTRONA', r: 40, act: S2 => { K.cura(S2, 5); G.say('Couro macio. (+5 vida)', 2.5); } }));
    add(O('mesa_centro', 340, 420, 100, 46, { e: 14 }));
    add(O('planta', 690, 400, 44, 54, { variante: 'palmeira', vaso: '#c8a24a' }), O('humidor', 520, 336, 34, 26, { e: 22, label: 'FUMAR UM CHARUTO', r: 36, act: S2 => { S2.energia = (S2.energia || 0) + 25; K.cura(S2, 2); G.say('Charuto cubano. Você se sente poderoso. (+energia)', 3); } }));
    npc(R, 340, 250, 'Tommaso, o conselheiro', ['Os negócios vão bem, chefe.', 'Chefe, a polícia anda fuçando a cidade.', 'Guarde o dinheiro no cofre. É mais seguro.', 'Confie na família, só na família.'], { p: look({ shirt: '#4a4e58', pants: '#2a2e38', shoe: '#08080a', sleeve: 'longa', acc: 'shades', accCol: '#2a2e38', hair: '#8a8a8a', hairStyle: 'curto', fem: false, pat: 'liso' }), h: 0 });
    R.deco = x => {
      D.quadro(x, 460, 100, 100, 40, 'retrato', '#c8a24a'); D.quadro(x, 330, 104, 56, 38, 'mapa', '#6a4a2a'); D.quadro(x, 600, 104, 60, 38, 'santo', '#c8a24a');
      K.janela(x, 740, 96, 50, 40, { vista: 'jardim', cortina: '#8a1c24', persiana: 0, semLuz: false });
    };
    R.luzes.push({ x: 380, y: 340, r: 360 }, { x: 640, y: 230, r: 180 });
    return R;
  }

  // =====================================================================
  //  SALÃO DE ESTAR (bar, piano, sofás, charutos)
  // =====================================================================
  function salao(lg) {
    const R = nova(lg, 'salao', 'SALÃO DE ESTAR', Object.assign({ piso: 'madeira', pisoCores: ['#6a4428', '#53361e'], parede: '#5a1a22', subtitulo: 'bar e piano' }, paredeMafia));
    const add = (...a) => R.objs.push(...a);
    add(O('tapete', 420, 300, 300, 200, { solid: false, k: -50, cor: '#6a1f26', cor2: '#d8b878', padrao: 'persa' }));
    add(O('adega_rack', 100, 160, 230, 24, { e: 88 }));
    add(O('bar_mafia', 100, 292, 300, 52, { e: 44, r: 70, k: 300, label: 'PEDIR UMA BEBIDA', act: S2 => menuBar(S2) }));
    for (let i = 0; i < 5; i++) add(O('banqueta', 126 + i * 58, 366, 28, 28, { e: 24, cor: '#5a1a22', label: i === 2 ? 'SENTAR NO BAR' : undefined, r: 30, act: i === 2 ? S2 => { K.cura(S2, 4); G.say('Você se sentou no bar. (+4 vida)', 2.5); } : undefined }));
    add(O('lareira', 470, 160, 150, 60, { e: 72 }));
    add(O('sofa', 450, 440, 220, 46, { e: 20, cor: '#5a1a22', dir: 'n', label: 'SENTAR NO SOFÁ', r: 50, act: S2 => { K.cura(S2, 8); G.say('Sofá de couro. (+8 vida)', 2.5); } }));
    add(O('mesa_centro', 500, 370, 120, 50, { e: 14 }));
    add(O('poltrona', 390, 340, 54, 52, { e: 22, cor: '#2a2a30', dir: 'n', label: 'SENTAR NA POLTRONA', r: 40, act: S2 => { K.cura(S2, 5); G.say('Poltrona confortável. (+5 vida)', 2.5); } }));
    add(O('poltrona', 690, 340, 54, 52, { e: 22, cor: '#2a2a30', dir: 'n', label: 'SENTAR NA POLTRONA', r: 40, act: S2 => { K.cura(S2, 5); G.say('Poltrona confortável. (+5 vida)', 2.5); } }));
    add(O('piano', 720, 190, 154, 104, { e: 34, r: 70, k: 296, label: 'TOCAR PIANO', act: S2 => { K.cura(S2, 3); G.say('Você toca uma melodia italiana. Todos sorriem. (+3 vida)', 3.5); } }));
    add(O('banqueta', 770, 312, 40, 28, { e: 22, cor: '#16161a' }));
    add(O('humidor', 860, 372, 34, 26, { e: 22, label: 'FUMAR UM CHARUTO', r: 36, act: S2 => { S2.energia = (S2.energia || 0) + 25; K.cura(S2, 2); G.say('Charuto cubano. (+energia)', 3); } }));
    add(O('planta', 100, 450, 44, 54, { variante: 'palmeira', vaso: '#c8a24a' }), O('planta', 900, 450, 44, 54, { variante: 'palmeira', vaso: '#c8a24a' }));
    npc(R, 250, 226, 'Vittorio, o barman', ['O que vai ser hoje, chefe?', 'O vinho da adega está no ponto.', 'Aqui ninguém paga: a casa é sua.'], { p: look({ shirt: '#f4f4f4', pants: '#101014', shoe: '#08080a', sleeve: 'longa', acc: 'none', hair: '#222', hairStyle: 'curto', skin: '#d9a577', fem: false, pat: 'liso' }), h: Math.PI / 1, label: 'FALAR COM O BARMAN', act: S2 => menuBar(S2), k: 290 });
    npc(R, 184, 356, 'Primo Carmine', ['Esse uísque é dos bons, primo.', 'Dizem que a polícia tem medo do seu portão.'], { p: look({ shirt: '#3a2a22', sleeve: 'longa', pants: '#1c1c20', acc: 'hat', accCol: '#2a2a30' }), sentado: true, h: 0 });
    R.deco = x => {
      D.quadro(x, 360, 104, 64, 40, 'paisagem', '#c8a24a'); D.quadro(x, 650, 100, 56, 40, 'retrato', '#c8a24a');
      K.janela(x, 820, 96, 50, 40, { vista: 'jardim', cortina: '#8a1c24', semLuz: false });
    };
    R.luzes.push({ x: 250, y: 280, r: 260 }, { x: 540, y: 330, r: 300 }, { x: 780, y: 270, r: 200 });
    return R;
  }

  // =====================================================================
  //  SALA DE JOGOS
  // =====================================================================
  function jogos(lg) {
    const R = nova(lg, 'jogos', 'SALA DE JOGOS', Object.assign({ piso: 'carpete', pisoCores: ['#1f4a30', '#1a3d28'], parede: '#2a1c14', subtitulo: 'sinuca e pôquer' }, paredeMafia, { lambri: '#4a2814' }));
    const add = (...a) => R.objs.push(...a);
    add(O('sinuca_mafia', 110, 210, 214, 114, { e: 30, r: 70, label: 'JOGAR SINUCA', k: 320, act: S2 => aposta(S2, 'SINUCA', [50, 200], 0.5, 2) }));
    add(O('mesa_poker', 440, 240, 186, 118, { e: 26, r: 80, label: 'JOGAR PÔQUER', k: 360, act: S2 => aposta(S2, 'PÔQUER', [100, 500, 1000], 0.46, 2) }));
    [[470, 224, 's'], [560, 224, 's'], [410, 296, 'e'], [650, 296, 'w'], [470, 372, 'n'], [560, 372, 'n']].forEach(([cx, cy, d], i) => add(O('cadeira_rest', cx, cy, 26, 28, { dir: d, cor: '#5a1a22', solid: i > 3 ? false : false })));
    add(O('bar_mafia', 540, 164, 190, 46, { e: 40, r: 60, label: 'PEGAR UMA BEBIDA', act: S2 => menuBar(S2) }));
    add(O('humidor', 110, 394, 34, 26, { e: 22, label: 'FUMAR UM CHARUTO', r: 36, act: S2 => { S2.energia = (S2.energia || 0) + 25; K.cura(S2, 2); G.say('Charuto cubano. (+energia)', 3); } }));
    add(O('planta', 90, 172, 44, 54, { variante: 'palmeira', vaso: '#c8a24a' }), O('planta', 690, 400, 44, 54, { variante: 'palmeira', vaso: '#c8a24a' }));
    npc(R, 440, 214, 'Don Salvatore', ['Eu pago pra ver, chefe.', 'Hoje a sorte é minha.', 'Sente-se, jogue uma mão!'], { p: look({ shirt: '#2a2a30', sleeve: 'longa', pants: '#101014', acc: 'hat', accCol: '#1a1a1e', hair: '#aaa' }), sentado: true, h: Math.PI / 2 });
    npc(R, 650, 330, 'Luigi Quatro-Dedos', ['Só tenho nove dedos pra contar o dinheiro.', 'Blefar é uma arte, chefe.'], { p: look({ shirt: '#6a1f26', sleeve: 'longa', pants: '#1a1a20' }), sentado: true, h: -Math.PI / 2 });
    R.deco = x => {
      x.fillStyle = '#16161a'; x.beginPath(); x.arc(380, 120, 22, 0, TAU); x.fill();
      ['#e8e0c8', '#1a1a1e', '#c81c1c', '#1a1a1e'].forEach((cor, i) => { x.fillStyle = cor; x.beginPath(); x.arc(380, 120, 20 - i * 5, 0, TAU); x.fill(); });
      x.fillStyle = '#c81c1c'; x.beginPath(); x.arc(380, 120, 2.6, 0, TAU); x.fill();                      // alvo de dardos
      D.quadro(x, 250, 104, 70, 38, 'time', '#c8a24a'); D.quadro(x, 100, 104, 56, 38, 'retrato', '#c8a24a');
      K.janela(x, 640, 96, 50, 40, { vista: 'jardim', cortina: '#1f4a30', semLuz: false });
    };
    R.luzes.push({ x: 220, y: 300, r: 240 }, { x: 540, y: 320, r: 280 });
    return R;
  }

  // =====================================================================
  //  JANTAR E COZINHA
  // =====================================================================
  function jantar(lg) {
    const R = nova(lg, 'jantar', 'JANTAR E COZINHA', Object.assign({ piso: 'taco', pisoCores: ['#6a4a2e', '#533820'], parede: '#6a1f26', subtitulo: 'à mesa com a família' }, paredeMafia));
    const add = (...a) => R.objs.push(...a);
    add(O('tapete', 380, 290, 470, 200, { solid: false, k: -50, cor: '#4a1a22', cor2: '#d8b878', padrao: 'persa' }));
    add(O('mesa_rest', 420, 320, 400, 100, { e: 18, forma: 'ret', toalha: '#f4f0e2', cor: '#8a1c24', prato: '#e8e0c8' }));
    for (let i = 0; i < 5; i++) { add(O('cadeira_rest', 440 + i * 76, 286, 26, 28, { dir: 's', cor: '#2a1a14' })); add(O('cadeira_rest', 440 + i * 76, 426, 26, 28, { dir: 'n', cor: '#2a1a14' })); }
    add(O('cadeira_rest', 386, 350, 26, 28, { dir: 'e', cor: '#2a1a14' }), O('cadeira_rest', 832, 350, 26, 28, { dir: 'w', cor: '#2a1a14' }));
    add(O('lustre', 560, 410, 60, 40, { e: 150, solid: false, k: 900 }), O('lustre', 740, 410, 60, 40, { e: 150, solid: false, k: 900 }));
    add(O('adega_rack', 480, 160, 200, 24, { e: 84 }));
    add(O('pia', 100, 168, 80, 40, { e: 30 }), O('fogao', 186, 168, 60, 40, { e: 30, ligado: true }), O('geladeira', 254, 160, 64, 46, { e: 58, label: 'ABRIR A GELADEIRA', r: 46, act: S2 => { const s = sv(S2); if (s.geladDia === dia(S2)) { G.say('Você já lanchou hoje. A geladeira está esperando amanhã!', 3); return; } s.geladDia = dia(S2); K.cura(S2, 25); G.say('Você petiscou frios e queijos. (+25 vida)', 3); } }));
    add(O('ilha', 110, 310, 190, 70, { e: 34 }));
    add(O('planta', 900, 170, 44, 54, { variante: 'palmeira', vaso: '#c8a24a' }), O('estatua', 360, 168, 44, 44, { e: 78 }));
    npc(R, 200, 236, 'Chef Gennaro', ['Hoje é a receita da nonna!', 'Ninguém sai da minha cozinha com fome.', 'Manjericão fresco, chefe. Só o melhor.'], { p: look({ shirt: '#f8f8f8', pants: '#2a2a30', shoe: '#08080a', sleeve: 'longa', acc: 'hat', accCol: '#fafafa', hair: '#222', skin: '#d9a577', fem: false, pat: 'liso' }), h: Math.PI / 1, label: 'FALAR COM O CHEF', act: S2 => menuChef(S2), k: 330 });
    R.deco = x => {
      D.quadro(x, 380, 100, 80, 40, 'flor', '#c8a24a'); D.quadro(x, 700, 100, 90, 40, 'paisagem', '#c8a24a');
      K.janela(x, 120, 96, 60, 40, { vista: 'jardim', cortina: '#e8e0c8', semLuz: false }); D.azulejoParede(x, 90, 112, 250, 38, '#efe8d8', '#c8a24a');
    };
    R.luzes.push({ x: 200, y: 300, r: 260 }, { x: 600, y: 330, r: 300 }, { x: 790, y: 300, r: 200 });
    return R;
  }

  // =====================================================================
  //  SUÍTE DO CHEFE
  // =====================================================================
  function suite(lg) {
    const R = nova(lg, 'suite', 'SUÍTE DO CHEFE', Object.assign({ piso: 'madeira', pisoCores: ['#4a3020', '#3a2616'], parede: '#4a1a22', subtitulo: 'vista para o campo' }, paredeMafia));
    R.porta = { para: 'hall', px: 550, py: 330, ph: Math.PI, label: 'DESCER PARA O SALÃO DE ENTRADA', rotulo: 'ESCADA' };
    const add = (...a) => R.objs.push(...a);
    add(O('tapete', 160, 270, 400, 220, { solid: false, k: -50, cor: '#6a1f26', cor2: '#d8b878', padrao: 'persa' }));
    add(O('cama2', 190, 180, 210, 120, { cor: '#8a1c24', padrao: 'listras', label: 'DORMIR ATÉ AMANHECER (SALVA O JOGO)', r: 60, act: S2 => dorme(S2) }));
    add(O('bloco', 150, 200, 34, 34, { e: 30, top: '#4a2a16', front: '#2e180c', label: 'CRIADO-MUDO', r: 30, act: S2 => G.say('Uma foto da família e um terço. Nada mais.', 3) }), O('bloco', 410, 200, 34, 34, { e: 30, top: '#4a2a16', front: '#2e180c' }));
    add(O('armario', 520, 164, 140, 54, { e: 80, label: 'GUARDA-ROUPA', r: 50, act: S2 => G.say('Dezenas de ternos pretos, todos iguais. O chefe tem estilo.', 3.5) }));
    add(O('sofa', 100, 420, 150, 46, { e: 20, cor: '#2a2a30', dir: 'n', label: 'SENTAR NO SOFÁ', r: 46, act: S2 => { K.cura(S2, 8); G.say('Você relaxou no sofá. (+8 vida)', 2.5); } }));
    add(O('tv', 300, 444, 100, 34, { e: 36, label: 'LIGAR A TV', r: 40, act: S2 => G.say('Noticiário: "Polícia procura motorista de fuga em carro vermelho..."', 4) }));
    add(O('banheira', 560, 300, 170, 76, {}), O('lavatorio', 640, 190, 70, 40, { e: 28, label: 'LAVAR O ROSTO', r: 30, act: S2 => { K.cura(S2, 2); G.say('Você lavou o rosto. (+2 vida)', 2.2); } }));
    add(O('planta', 690, 420, 44, 54, { variante: 'palmeira', vaso: '#c8a24a' }));
    R.deco = x => {
      K.janela(x, 120, 92, 70, 44, { vista: 'jardim', cortina: '#8a1c24', semLuz: false }); K.janela(x, 420, 92, 70, 44, { vista: 'jardim', cortina: '#8a1c24', semLuz: false });
      D.quadro(x, 300, 100, 72, 40, 'retrato', '#c8a24a'); D.espelhoParede(x, 700, 100, 56, 44, '#c8a24a');
    };
    R.luzes.push({ x: 290, y: 320, r: 300 }, { x: 640, y: 300, r: 220 });
    return R;
  }

  // =====================================================================
  //  ADEGA E ARSENAL
  // =====================================================================
  function adega(lg) {
    const R = nova(lg, 'adega', 'ADEGA E ARSENAL', { piso: 'pedra', pisoCores: ['#6a645a', '#58534a'], parede: '#8a6a50', estiloParede: 'tijolo', lambri: false, rodape: '#3a2a1c', subtitulo: 'só para o chefe' });
    const add = (...a) => R.objs.push(...a);
    add(O('adega_rack', 90, 160, 170, 24, { e: 88 }), O('adega_rack', 270, 160, 170, 24, { e: 88 }));
    add(O('arsenal', 520, 160, 150, 26, { e: 94, r: 70, label: 'ABRIR O ARSENAL', k: 200, act: S2 => menuArsenal(S2) }));
    for (let i = 0; i < 5; i++) add(O('barril', 100 + i * 70, 280, 48, 48, { e: 36, label: i === 2 ? 'PROVAR O VINHO DO BARRIL' : undefined, r: 34, act: i === 2 ? S2 => { K.cura(S2, 6); S2.bebado = (S2.bebado || 0) + 5; G.say('Vinho direto do barril. Delicioso... e forte! (+6 vida)', 3.5); } : undefined }));
    for (let i = 0; i < 3; i++) add(O('barril', 130 + i * 76, 380, 48, 48, { e: 36 }));
    add(O('mesa', 470, 330, 140, 70, { e: 24, estilo: 'bar' }), O('cadeira', 450, 420, 26, 28, { dir: 'n' }), O('cadeira', 590, 420, 26, 28, { dir: 'n' }));
    add(O('caixote_frutas', 640, 380, 70, 34, { e: 20 }), O('pilha_caixas', 660, 280, 60, 44, { e: 30 }));
    R.deco = x => {
      for (let i = 0; i < 6; i++) { x.fillStyle = '#4a4036'; x.fillRect(100 + i * 110, 100, 54, 44); x.fillStyle = '#2a241c'; x.fillRect(104 + i * 110, 104, 46, 36); x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(104 + i * 110, 104, 46, 6); }   // nichos de pedra
      x.fillStyle = '#c8a24a'; x.fillRect(676, 104, 3, 10); x.fillStyle = '#fff1b0'; x.fillRect(676, 98, 3, 6);                                           // tocha
    };
    R.luzes.push({ x: 300, y: 320, r: 280 }, { x: 590, y: 300, r: 220 });
    return R;
  }

  G.mansaoInt = { criar(id, lg, c) { const F = { entrada: hall, hall, escritorio, salao, jogos, jantar, suite, adega }; return (F[id] || hall)(lg); } };
})(window.G = window.G || {});
