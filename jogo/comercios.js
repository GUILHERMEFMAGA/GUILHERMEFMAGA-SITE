/* =====================================================================
   COMERCIOS.JS — lojas de verdade (todas as portas da cidade abrem!)
     • BANCO RIBEIRÃO: guichês (depositar/sacar), clientes na fila, cofre-forte
     • PADARIA PÃO QUENTE e PIZZARIA DONA MARIA
     • 14 comércios comuns espalhados pelos bairros: lanchonete, sorveteria, açougue,
       floricultura, pet shop, livraria, eletrônicos, ótica, ferragem, lotérica,
       mercadinho, loja de roupas, bar e café.
   O nome no letreiro de fora é o mesmo que aparece lá dentro (world.js sorteia os nomes).
   Cada comércio tem atendente (dá para conversar e, com arma, assaltar), cardápio e algo único.
   ===================================================================== */
(function (G) {
  'use strict';
  const L = G.lugares, K = L.kit, W = G.world, SP = G.sprites, ALIM = L.ALIM;
  const O = K.O, pick = K.pick, rand = K.rand, TAU = Math.PI * 2;

  // alimentos que só existem aqui
  ALIM.pizzagrande = { n: 'Pizza grande', hp: 45, cor: '#e8a040' };

  const look = o => Object.assign(SP.randomLook(), { acc: 'none' }, o);
  const horaTxt = pl => pl.horario ? 'aberto das ' + pl.horario[0] + 'h às ' + (pl.horario[1] % 24) + 'h' : '';

  // ---------- menus ----------
  // item de comida: vai para a mochila (X para comer)
  const comida = (id, preco) => ({ n: ALIM[id].n, preco, cor: ALIM[id].cor, desc: 'recupera ' + ALIM[id].hp + ' de vida' + (ALIM[id].energia ? ' + energia (corre mais)' : '') + (ALIM[id].bebado ? ' (deixa tonto)' : ''),
    fn: S => { if (!K.gasta(S, preco)) return; L.dar(S, id, 1); G.save(); G.say(ALIM[id].n + ' na mochila (aperte X para consumir).', 2.5); } });
  // item especial: faz o que você mandar
  const especial = (n, preco, desc, fn) => ({ n, preco, desc, fn: (S, R) => { if (!K.gasta(S, preco)) return; fn(S, R); } });
  const abre = (S, titulo, itens, rodape) => L.abrirMenu(S, { titulo, rodape: rodape || 'W/S escolher  ·  E comprar  ·  ESC sair', itens, info: S2 => 'Dinheiro: $' + S2.save.money });

  // monta uma sala de comércio: balcão com atendente, estantes dos lados e plantas
  function salaBase(pl, c) {
    const R = L.novaSala({ place: pl, w: c.w || 620, h: c.h || 380, nome: pl.nome, cor: pl.cor, piso: c.piso, pisoCores: c.pisoCores, parede: c.parede, preview: !!c.preview, subtitulo: horaTxt(pl) });
    R.chegada = { x: R.portaX, y: R.y1 + 10 };
    return R;
  }
  // letreiro neon com uma plaquinha escura atrás (para nada da decoração atrapalhar a leitura)
  const letreiro = (x, pl, cor, cx) => {
    const n = pl.nome.length, tam = Math.max(16, Math.min(30, 420 / (0.64 * n))); cx = cx || 380;
    x.save(); x.font = 'bold ' + tam + 'px Arial'; const w = x.measureText(pl.nome).width + 36; x.restore();
    x.fillStyle = 'rgba(8,6,16,0.82)'; W.rrect(x, cx - w / 2, 74, w, 44, 8); x.fill(); x.strokeStyle = cor || '#fff'; x.lineWidth = 1.5; x.stroke();
    K.neon(x, pl.nome, cx, 104, tam, cor || '#ffffff');
  };

  // ---------- as lojas comuns (uma configuração por tipo) ----------
  const TIPOS = {
    lanchonete: {
      piso: 'xadrez', pisoCores: ['#f4ead2', '#c8402a'], parede: '#d9541e', balcao: 'pastel', neon: '#ffe04a', label: 'VER O CARDÁPIO (LANCHES)', titulo: 'LANCHONETE — CARDÁPIO',
      itens: () => [comida('xburguer', 14), comida('xtudo', 22), comida('hotdog', 10), comida('batata', 9), comida('guarana', 5)],
      falas: ['O X-Tudo aqui é famoso no bairro!', 'Chapa quente, lanche saindo!', 'Quer batata junto? É só mais nove.', 'Sem fila, sem espera!'],
      atendente: { shirt: '#ffffff', pat: 'liso', sleeve: 'curta', acc: 'hat', accCol: '#ffffff', fem: false },
      extras(R, add, pl) {
        add(O('mesa', 130, 340, 56, 40, { e: 18 }), O('cadeira', 108, 350, 22, 22, { solid: false }), O('cadeira', 190, 350, 22, 22, { solid: false }));
        add(O('mesa', 480, 340, 56, 40, { e: 18 }), O('cadeira', 458, 350, 22, 22, { solid: false }), O('cadeira', 540, 350, 22, 22, { solid: false }));
        add(O('jukebox', 600, 190, 56, 30, { e: 50, label: 'TROCAR A MÚSICA', act: S => { G.snd.nextStation(); S.radioT = 3; G.say('Rádio: outra música!', 2); } }));
        R.cliente = { x: 480, y: 360, falas: ['Esse X-Tudo não tem igual!', 'Estou de folga, vim lanchar.'] };
      },
      deco: (x, pl) => { K.cartaz(x, 100, 74, 80, 56, '#ffe04a', []); x.fillStyle = '#c8302a'; x.font = 'bold 13px Arial'; x.textAlign = 'center'; x.fillText('PROMOÇÃO', 140, 98); x.fillText('X-TUDO $22', 140, 116); x.textAlign = 'left'; }
    },
    sorveteria: {
      piso: 'ladrilho', pisoCores: ['#fdeef4', '#f4cade'], parede: '#f08ab8', balcao: 'bilhetes', neon: '#ffffff', label: 'ESCOLHER SORVETE', titulo: 'SORVETERIA — SABORES',
      itens: () => [comida('sorvete', 7), comida('picole', 4), comida('acai', 12), comida('brigadeiro', 3), comida('chocolate', 6)],
      falas: ['Hoje o sabor da casa é morango com chocolate!', 'Com este calor, só sorvete salva.', 'Açaí na tigela? Pode pedir!', 'Experimenta o picolé de limão.'],
      atendente: { shirt: '#f8a8c8', pat: 'listra', sleeve: 'curta', acc: 'cap', accCol: '#f8a8c8', fem: true },
      extras(R, add) {
        add(O('freezer', 100, 190, 110, 40, { e: 26, label: 'ESCOLHER SORVETE', act: S => abre(S, 'SORVETERIA — SABORES', TIPOS.sorveteria.itens()) }));
        add(O('freezer', 510, 190, 110, 40, { e: 26, label: 'ESCOLHER SORVETE', act: S => abre(S, 'SORVETERIA — SABORES', TIPOS.sorveteria.itens()) }));
        add(O('mesa', 150, 350, 56, 40, { e: 18 }), O('cadeira', 128, 360, 22, 22, { solid: false }), O('cadeira', 210, 360, 22, 22, { solid: false }));
        add(O('mesa', 460, 350, 56, 40, { e: 18 }), O('cadeira', 438, 360, 22, 22, { solid: false }), O('cadeira', 520, 360, 22, 22, { solid: false }));
      },
      deco: x => { for (let k = 0; k < 7; k++) { x.fillStyle = ['#f8c8e0', '#c8f0c8', '#fff0a0', '#c8e0f8'][k % 4]; x.beginPath(); x.arc(150 + k * 80, 70, 14, 0, TAU); x.fill(); x.fillStyle = '#d8a860'; x.beginPath(); x.moveTo(140 + k * 80, 76); x.lineTo(160 + k * 80, 76); x.lineTo(150 + k * 80, 96); x.fill(); } }
    },
    acougue: {
      piso: 'ladrilho', pisoCores: ['#f2f2f2', '#d4d4d4'], parede: '#b04040', balcao: 'remedios', neon: '#ffffff', label: 'VER OS CORTES DE CARNE', titulo: 'AÇOUGUE — CORTES',
      itens: () => [comida('linguica', 14), comida('espetinho', 9), comida('carne', 20)],
      falas: ['Picanha fresquinha, chegou hoje cedo!', 'Churrasco de domingo começa aqui.', 'Quer o espetinho já assado?', 'Corto na hora, do jeito que o senhor quiser.'],
      atendente: { shirt: '#f2f2f2', pat: 'liso', sleeve: 'curta', acc: 'hat', accCol: '#f2f2f2', fem: false, hairStyle: 'raspado' },
      extras(R, add) {
        add(O('freezer', 100, 190, 110, 40, { e: 26, label: 'VER OS CORTES', act: S => abre(S, 'AÇOUGUE — CORTES', TIPOS.acougue.itens()) }));
        add(O('freezer', 510, 190, 110, 40, { e: 26, label: 'VER OS CORTES', act: S => abre(S, 'AÇOUGUE — CORTES', TIPOS.acougue.itens()) }));
        add(O('bancada', 250, 340, 220, 44, { e: 26, label: 'BANCADA DE CORTE', act: () => G.say('Facas enormes... melhor não mexer aí.', 3) }));
      },
      deco: x => { for (let k = 0; k < 6; k++) { x.strokeStyle = '#999'; x.lineWidth = 2; x.beginPath(); x.moveTo(140 + k * 88, 64); x.lineTo(140 + k * 88, 84); x.stroke(); x.fillStyle = '#c04040'; x.beginPath(); x.ellipse(140 + k * 88, 100, 11, 18, 0, 0, TAU); x.fill(); } }
    },
    floricultura: {
      piso: 'madeira', pisoCores: ['#b8946a', '#a8845a'], parede: '#4a9a5a', balcao: 'caldo', neon: '#ffd6f0', label: 'VER AS FLORES', titulo: 'FLORICULTURA — FLORES',
      itens: () => [
        especial('Buquê de rosas', 15, 'cheiroso, +8 de vida', S => { K.cura(S, 8); G.say('Que perfume! Você cheirou o buquê. (+8 vida)', 3.5); }),
        especial('Girassol', 5, 'alegra o dia, +3 de vida', S => { K.cura(S, 3); G.say('Um girassol para alegrar o seu dia. (+3 vida)', 3); }),
        especial('Vasinho de violeta', 8, 'planta de casa, +4 de vida', S => { K.cura(S, 4); G.say('Violeta bonita. Quem sabe você a leva para casa um dia.', 3.5); })],
      falas: ['As rosas chegaram hoje cedo!', 'Flor é o melhor presente do mundo.', 'Precisa de um arranjo? Faço na hora.', 'Regue sempre de manhã, viu?'],
      atendente: { shirt: '#e8a8d0', pat: 'liso', sleeve: 'curta', fem: true, hairStyle: 'coque' },
      extras(R, add) {
        [[110, 340], [220, 400], [440, 390], [560, 340], [100, 450], [600, 450]].forEach(([a, b]) => add(O('planta', a, b, 40, 50, {})));
        add(O('estante', 110, 190, 110, 36, { e: 34, variante: 'frutas', label: 'VER AS FLORES', act: S => abre(S, 'FLORICULTURA — FLORES', TIPOS.floricultura.itens()) }));
        add(O('estante', 510, 190, 110, 36, { e: 34, variante: 'frutas' }));
      },
      deco: x => { for (let k = 0; k < 8; k++) { x.fillStyle = ['#e8402a', '#f2d02a', '#f080c0', '#ffffff'][k % 4]; x.beginPath(); x.arc(130 + k * 66, 76, 9, 0, TAU); x.fill(); x.fillStyle = '#2f8a3c'; x.fillRect(129 + k * 66, 84, 3, 22); } }
    },
    petshop: {
      piso: 'ladrilho', pisoCores: ['#e8f4f8', '#bcdce6'], parede: '#3aa8c0', balcao: 'caldo', neon: '#ffffff', label: 'VER OS PRODUTOS PET', titulo: 'PET SHOP — PRODUTOS',
      itens: () => [
        especial('Ração para cachorro de rua', 10, 'faz uma boa ação', S => G.say('Você deu ração a um cachorro de rua. Ele abanou o rabo e ficou te seguindo por um tempo...', 5)),
        especial('Osso de brinquedo', 6, 'o cachorro adora', S => { K.cura(S, 2); G.say('O cachorro da loja ficou todo feliz com o osso. Você também! (+2 vida)', 4); }),
        especial('Biscoito para gato', 4, 'miau!', S => G.say('O gato do balcão devorou o biscoito e ronronou.', 3.5))],
      falas: ['Esse aqui é o Totó, ele não morde. Muito.', 'Ração boa faz o pelo brilhar.', 'Banho e tosa só com hora marcada.', 'Procurando um amigo de quatro patas?'],
      atendente: { shirt: '#2a9ab0', pat: 'liso', sleeve: 'curta', fem: true, hairStyle: 'rabo' },
      extras(R, add) {
        add(O('gondola', 100, 190, 110, 36, { e: 34, nome: 'RAÇÃO', cores: ['#c8402a', '#2a58b8', '#e0b030'] }), O('gondola', 510, 190, 110, 36, { e: 34, nome: 'BRINQUEDOS', cores: ['#e84a8a', '#4ab0e8', '#f2d02a'] }));
        add(O('bloco', 150, 340, 120, 50, { e: 26, top: '#8ad0e8', front: '#4a90b0', label: 'VER OS PEIXINHOS', act: () => G.say(pick(['O aquário tem um peixe palhaço e um baiacu mal-humorado.', 'Os peixinhos dão voltas sem parar.']), 3.5) }));
        add(O('bloco', 460, 350, 90, 40, { e: 16, top: '#c8a070', front: '#8a6a40', label: 'ACARICIAR O CACHORRO', act: S => { K.cura(S, 5); G.say('Totó lambeu sua mão! (+5 vida)', 3); } }));
      },
      deco: x => { x.fillStyle = '#fff'; for (let k = 0; k < 8; k++) { const a = 130 + k * 66; x.beginPath(); x.arc(a, 80, 6, 0, TAU); x.arc(a - 9, 72, 4, 0, TAU); x.arc(a + 9, 72, 4, 0, TAU); x.arc(a - 4, 66, 3.5, 0, TAU); x.arc(a + 4, 66, 3.5, 0, TAU); x.fill(); } }
    },
    livraria: {
      piso: 'carpete', pisoCores: ['#7a5a3a', '#6a4a2e'], parede: '#5a3a7a', balcao: 'bilhetes', neon: '#ffe8a0', label: 'VER OS LIVROS E JORNAIS', titulo: 'LIVRARIA — LEITURA',
      itens: () => [
        especial('Jornal do dia', 2, 'notícias da cidade', S => G.say(pick(['Jornal: "Roubos a casas aumentam em Ribeirão. Moradores reforçam a segurança."', 'Jornal: "Polícia reforça as rondas no centro."', 'Jornal: "Hotel Grand recebe novo restaurante de cinco estrelas."', 'Jornal: "Academia Força Total tem promoção de passe do dia."']), 6)),
        especial('Revista de carros', 5, 'dicas de direção', S => G.say(pick(['Dica: o freio de mão (Espaço) faz o carro derrapar nas curvas.', 'Dica: carro roubado de dia é visto pelos pedestres, de noite nem tanto.', 'Dica: a oficina repara e repinta o seu carro por $150.']), 6)),
        especial('Livro: "Segredos da Polícia"', 20, 'leitura rápida', S => G.say(pick(['Livro: "A polícia perde o rastro de quem se esconde em casa própria ou na igreja."', 'Livro: "Cada estrela de procurado traz viaturas mais pesadas."']), 7)),
        especial('Mapa da cidade', 10, 'guia até um lugar', S => { const lista = W.places.filter(p => p.tipo !== 'loja'); const pl = pick(lista); S.guia = { id: pl.id, t: 60 }; G.say('Você marcou no mapa: ' + pl.nome + '. Siga a seta!', 5); })],
      falas: ['Silêncio, por favor... brincadeira, pode falar.', 'Procurando algo para ler?', 'O mapa da cidade ajuda muito quem é de fora.', 'Esse livro é um sucesso, acabou o estoque duas vezes.'],
      atendente: { shirt: '#6a4a9a', pat: 'listra', sleeve: 'longa', fem: true, hairStyle: 'longo', acc: 'shades', accCol: '#222222' },
      extras(R, add) {
        add(O('estante', 90, 190, 110, 40, { e: 46, variante: 'tintas' }), O('estante', 520, 190, 110, 40, { e: 46, variante: 'tintas' }));
        add(O('estante', 130, 330, 150, 40, { e: 46, variante: 'tintas' }), O('estante', 440, 330, 150, 40, { e: 46, variante: 'tintas' }));
        add(O('poltrona', 320, 380, 60, 50, { e: 20, label: 'SENTAR E LER UM POUCO', act: S => { K.cura(S, 6); G.say('Você leu umas páginas em silêncio. (+6 vida)', 3); } }));
      },
      deco: x => { for (let k = 0; k < 9; k++) { x.fillStyle = ['#c8302a', '#2a58b8', '#e8d02a', '#2f8a3c', '#f2f2f2'][k % 5]; x.fillRect(150 + k * 56, 70, 10, 34 + (k % 3) * 4); } }
    },
    eletronicos: {
      piso: 'ladrilho', pisoCores: ['#dcdfe8', '#b4bbd0'], parede: '#2a3a6a', balcao: 'bilhetes', neon: '#6ad0ff', label: 'VER OS APARELHOS', titulo: 'ELETRÔNICOS — PRODUTOS',
      itens: () => [
        comida('energetico', 14),
        especial('Fone de ouvido', 20, 'música boa', S => { G.snd.nextStation(); S.radioT = 3; G.say('Você experimentou o fone: música nova no ouvido!', 3.5); }),
        especial('Carregador de celular', 15, 'bateria cheia', S => G.say('Agora o seu celular nunca fica sem bateria na hora da missão.', 3.5)),
        especial('Pilhas', 3, 'só pilhas', S => G.say('Duas pilhas pequenas. Servem pra quê? Boa pergunta.', 3))],
      falas: ['Essa TV é 4K, olha a imagem!', 'Celular novo, parcelo em dez vezes.', 'Fone de ouvido original, com garantia.', 'O rádio da demonstração é de graça!'],
      atendente: { shirt: '#2a3a6a', pat: 'liso', sleeve: 'curta', fem: false, hairStyle: 'topete', acc: 'shades', accCol: '#111111' },
      extras(R, add) {
        add(O('tv', 100, 190, 110, 36, { e: 56, label: 'TROCAR O CANAL', act: () => G.say(pick(['Na TV: "Plantão: carro vermelho avistado em alta velocidade."', 'Na TV: "O tempo segue firme em Ribeirão Preto."', 'Na TV: desenho animado. Você assistiu um pouquinho.']), 4) }));
        add(O('tv', 510, 190, 110, 36, { e: 56, label: 'TROCAR O CANAL', act: () => G.say('Na TV: propaganda de uma loja de eletrônicos. Esta aqui, na verdade.', 3.5) }));
        add(O('gondola', 150, 340, 140, 36, { e: 34, nome: 'CELULARES', cores: ['#16181e', '#2a58b8', '#c8ccd4'] }), O('gondola', 430, 340, 140, 36, { e: 34, nome: 'FONES', cores: ['#16181e', '#e84a8a', '#f2f2f2'] }));
        add(O('jukebox', 340, 420, 56, 30, { e: 50, label: 'OUVIR O RÁDIO DE DEMONSTRAÇÃO', act: () => { G.snd.nextStation(); G.say('Rádio: outra estação!', 2); } }));
      },
      deco: x => { for (let k = 0; k < 4; k++) { x.fillStyle = '#0a0c12'; x.fillRect(130 + k * 120, 70, 90, 50); x.fillStyle = ['#4a7ac8', '#c85a4a', '#4ac87a', '#c8c04a'][k]; x.fillRect(134 + k * 120, 74, 82, 42); } }
    },
    otica: {
      piso: 'ladrilho', pisoCores: ['#f4f4f8', '#d0d4e2'], parede: '#4a7ab0', balcao: 'bilhetes', neon: '#ffffff', label: 'VER OS ÓCULOS', titulo: 'ÓTICA — ÓCULOS', preview: true,
      itens: () => [
        especial('Trocar o acessório (óculos, boné, gorro)', 15, 'muda o seu visual', S => { L.mudaLook(S, 'acess'); G.say('Acessório novo! Olhe o seu visual no cartão.', 3.5); }),
        especial('Exame de vista', 5, 'você enxerga bem?', S => G.say(pick(['Doutora: "Visão perfeita! Só enxerga mal o semáforo vermelho, né?"', 'Doutora: "Você precisa de óculos... para dirigir menos rápido."']), 5))],
      falas: ['Armação nova chegou, olha que linda!', 'Faz exame de vista? É rapidinho.', 'Óculos escuro combina com você.', 'Lentes com proteção contra o sol!'],
      atendente: { shirt: '#ffffff', pat: 'jaqueta', sleeve: 'longa', fem: true, hairStyle: 'rabo', acc: 'shades', accCol: '#3a6ad0' },
      extras(R, add) {
        add(O('estante', 100, 190, 110, 36, { e: 40, variante: 'acess' }), O('estante', 510, 190, 110, 36, { e: 40, variante: 'acess' }));
        add(O('espelho', 90, 80, 100, 70, { solid: false, invisivel: true, label: 'EXPERIMENTAR UM ÓCULOS', r: 36, act: S => abre(S, 'ÓTICA — ÓCULOS', TIPOS.otica.itens()) }));
        add(O('estante', 200, 350, 120, 36, { e: 40, variante: 'acess' }), O('estante', 440, 350, 120, 36, { e: 40, variante: 'acess' }));
        add(O('planta', 90, 470, 40, 50, {}), O('planta', 600, 470, 40, 50, {}));
      },
      deco: x => { K.tipos.espelho(x, { x: 90, y: 76, w: 100, h: 60 }); K.tipos.espelho(x, { x: 570, y: 76, w: 100, h: 60 }); }
    },
    ferragem: {
      piso: 'pedra', pisoCores: ['#aaa69c', '#98948a'], parede: '#8a7a4a', balcao: 'colete', neon: '#ffd24a', label: 'VER AS FERRAMENTAS', titulo: 'FERRAGEM — FERRAMENTAS',
      itens: () => [
        { n: 'Taco de beisebol', preco: 60, desc: 'arma corpo a corpo', cor: '#c8a070', fn: S => { if (S.save.arms.own.bat) { G.say('Você já tem um taco.', 2.5); return; } if (!K.gasta(S, 60)) return; G.combat.giveWeapon(S, 'bat', 0); G.save(); G.say('Taco de beisebol novinho! (tecla Q/1-6 troca de arma)', 4); } },
        especial('Cadeado reforçado', 12, 'segurança em casa', S => G.say('Você comprou um cadeado. Sua casa ficou mais segura (pelo menos na sua cabeça).', 4)),
        especial('Fita adesiva', 3, 'serve pra tudo', S => { K.cura(S, 3); G.say('Você tapou um arranhão com a fita. (+3 vida)', 3); }),
        especial('Lanterna', 12, 'para a noite', S => G.say('Uma lanterna boa. A noite aqui é escura, né?', 3.5))],
      falas: ['Martelo, serra, prego, tem de tudo.', 'Precisa de taco? Tenho um ótimo aqui.', 'Material de construção é lá nos fundos.', 'Aqui o parafuso é por peso!'],
      atendente: { shirt: '#c8801a', pat: 'xadrez', sleeve: 'longa', fem: false, hairStyle: 'curto', acc: 'cap', accCol: '#c8801a' },
      extras(R, add) {
        add(O('gondola', 100, 190, 110, 36, { e: 40, nome: 'PARAFUSOS', cores: ['#aaaaaa', '#c8a040', '#444444'] }), O('gondola', 510, 190, 110, 36, { e: 40, nome: 'TINTAS', cores: ['#e8402a', '#2a58b8', '#f2d02a', '#ffffff'] }));
        add(O('pilha_caixas', 120, 350, 80, 50, { e: 34 }), O('pilha_caixas', 220, 360, 70, 44, { e: 26 }), O('pilha_caixas', 520, 350, 90, 50, { e: 40 }));
        add(O('gondola', 330, 380, 130, 36, { e: 34, nome: 'FERRAMENTAS', cores: ['#555555', '#e8402a', '#bbbbbb'] }));
      },
      deco: x => { for (let k = 0; k < 8; k++) { x.fillStyle = '#7a5a3a'; x.fillRect(140 + k * 66, 72, 5, 30); x.fillStyle = '#aaa'; x.fillRect(132 + k * 66, 68, 22, 8); } }
    },
    loteria: {
      piso: 'ladrilho', pisoCores: ['#e8f0e0', '#b8d0a8'], parede: '#2a8a4a', balcao: 'bilhetes', neon: '#ffe04a', label: 'JOGAR NA LOTÉRICA', titulo: 'LOTÉRICA — JOGOS',
      itens: () => [
        especial('Raspadinha', 5, 'pode ter prêmio de até $500', S => { const r = Math.random(); let v = 0; if (r < 0.01) v = 500; else if (r < 0.06) v = 50; else if (r < 0.22) v = 12; if (v) { S.save.money += v; G.save(); G.snd.cash(); G.say('RASPOU E GANHOU $' + v + '!', 4); } else G.say('Raspou... "Tente outra vez". Não foi dessa.', 3.5); }),
        especial('Aposta da Mega (grande)', 20, 'prêmio de até $600', S => { const r = Math.random(); let v = 0; if (r < 0.02) v = 600; else if (r < 0.12) v = 100; if (v) { S.save.money += v; G.save(); G.snd.cash(); G.say('GANHOU NA MEGA! +$' + v + '!', 4); } else G.say('Os números não saíram. Quem sabe amanhã?', 3.5); }),
        especial('Pagar conta de luz', 30, 'a vida do cidadão', S => G.say('Conta paga. A cidade agradece. (Você também não ganhou nada.)', 3.5))],
      falas: ['Feliz de quem acerta a quina!', 'A raspadinha da sorte está na promoção.', 'O prêmio acumulou, hein!', 'Pode pagar contas aqui também.'],
      atendente: { shirt: '#2a8a4a', pat: 'liso', sleeve: 'curta', fem: true, hairStyle: 'curto' },
      extras(R, add) {
        add(O('caixa_reg', 100, 190, 100, 40, { aberto: true, label: 'GUICHÊ DE APOSTAS', act: S => abre(S, 'LOTÉRICA — JOGOS', TIPOS.loteria.itens()) }));
        add(O('caixa_reg', 520, 190, 100, 40, { aberto: true }));
        add(O('bloco', 130, 350, 160, 36, { e: 24, top: '#d8c8a0', front: '#a88a58', label: 'PREENCHER UM VOLANTE', act: () => G.say('Você marcou 7 números. Sorte é quem tem.', 3) }));
      },
      deco: x => { x.fillStyle = '#ffe04a'; x.font = 'bold 22px Arial'; x.textAlign = 'center'; x.fillText('★ PRÊMIO ACUMULADO ★', 380, 136); x.textAlign = 'left'; }
    },
    mercadinho: {
      piso: 'ladrilho', pisoCores: ['#f0ecd8', '#c8c0a0'], parede: '#c8a028', balcao: 'caldo', neon: '#ffffff', label: 'PAGAR NO CAIXA (MERCADINHO)', titulo: 'MERCADINHO — COMPRAS',
      itens: () => [comida('pao', 1), comida('banana', 3), comida('agua', 2), comida('guarana', 5), comida('paoqueijo', 4), comida('marmita', 14), comida('lasanha', 16)],
      falas: ['Pão fresquinho saiu agora!', 'No fiado? Só pro Seu Zé.', 'A marmita do dia é feijoada.', 'Leva e paga no caixa!'],
      atendente: { shirt: '#c8a028', pat: 'liso', sleeve: 'curta', fem: false, hairStyle: 'curto' },
      extras(R, add) {
        add(O('gondola', 100, 190, 110, 36, { e: 38, nome: 'GRÃOS', cores: ['#e8402a', '#2a58b8', '#f2d02a'] }), O('gondola', 510, 190, 110, 36, { e: 38, nome: 'BEBIDAS', cores: ['#2f8a3c', '#c8302a', '#2a58b8'] }));
        add(O('gondola', 130, 340, 150, 36, { e: 38, nome: 'DOCES', cores: ['#e84a8a', '#f2d02a', '#5a3220'] }), O('gondola', 440, 340, 150, 36, { e: 38, nome: 'PÃES', cores: ['#d8a860', '#e8c070'] }));
        add(O('freezer', 330, 440, 110, 40, { e: 22 }));
      },
      deco: x => { for (let k = 0; k < 7; k++) { x.fillStyle = k % 2 ? '#e8402a' : '#f2d02a'; x.beginPath(); x.moveTo(110 + k * 80, 62); x.lineTo(150 + k * 80, 62); x.lineTo(130 + k * 80, 82); x.fill(); } }
    },
    roupas: {
      piso: 'carpete', pisoCores: ['#c8b8c8', '#b8a8b8'], parede: '#c04a8a', balcao: 'bilhetes', neon: '#ffd6f0', label: 'FALAR COM A VENDEDORA', titulo: 'LOJA DE ROUPAS', preview: true,
      itens: () => [
        especial('Camisa nova', 30, 'troca a camisa', S => { L.mudaLook(S, 'roupa'); G.say('Camisa nova! Ficou bem em você.', 3); }),
        especial('Calça nova', 25, 'troca a calça', S => { L.mudaLook(S, 'calca'); G.say('Calça nova!', 3); }),
        especial('Tênis novo', 25, 'troca o tênis', S => { L.mudaLook(S, 'tenis'); G.say('Tênis novo no pé!', 3); })],
      falas: ['Liquidação! Tudo pela metade do preço (quase).', 'Esse tom combina com você.', 'O provador é logo ali.', 'Camisa nova a cada semana!'],
      atendente: { shirt: '#c04a8a', pat: 'liso', sleeve: 'curta', fem: true, hairStyle: 'longo' },
      extras(R, add) {
        add(O('arara', 100, 190, 120, 36, { e: 36, label: 'TROCAR DE CAMISA ($30)', act: S => { if (K.gasta(S, 30)) { L.mudaLook(S, 'roupa'); G.say('Camisa nova! Ficou bem em você.', 3); } } }));
        add(O('arara', 500, 190, 120, 36, { e: 36, label: 'TROCAR A CALÇA ($25)', act: S => { if (K.gasta(S, 25)) { L.mudaLook(S, 'calca'); G.say('Calça nova!', 3); } } }));
        add(O('estante', 130, 340, 120, 36, { e: 40, variante: 'tenis', label: 'TROCAR O TÊNIS ($25)', act: S => { if (K.gasta(S, 25)) { L.mudaLook(S, 'tenis'); G.say('Tênis novo no pé!', 3); } } }));
        add(O('provador', 440, 340, 90, 30, { e: 0, solid: false, invisivel: true, label: 'OLHAR NO PROVADOR', r: 50, act: () => G.say(pick(['No espelho do provador: ficou ótimo!', 'Será que combina? Combina sim.']), 3.5) }));
      },
      deco: x => { for (let k = 0; k < 6; k++) { x.fillStyle = ['#e84a8a', '#4ab0e8', '#f2d02a', '#8a4fc2'][k % 4]; x.fillRect(150 + k * 80, 74, 28, 34); x.fillRect(142 + k * 80, 74, 8, 14); x.fillRect(178 + k * 80, 74, 8, 14); } }
    },
    bar: {
      piso: 'madeira', pisoCores: ['#6a4a2a', '#5a3a1e'], parede: '#6a3a1a', balcao: 'bar', neon: '#ffb84a', label: 'PEDIR NO BALCÃO', titulo: 'BAR — BEBIDAS E PETISCOS',
      itens: () => [comida('cerveja', 6), comida('guarana', 4), comida('coxinha', 5), comida('espetinho', 9), comida('empada', 4)],
      falas: ['Gelada, do jeito que o senhor gosta!', 'Aqui é o ponto de encontro do bairro.', 'Quer tentar a sorte na sinuca?', 'O petisco da casa é a coxinha.'],
      atendente: { shirt: '#f2f2f2', pat: 'liso', sleeve: 'curta', fem: false, hairStyle: 'curto', acc: 'none' },
      extras(R, add) {
        add(O('sinuca', 400, 340, 170, 92, { e: 16, label: 'JOGAR SINUCA ($20)', act: S => { if (!K.gasta(S, 20)) return; if (Math.random() < 0.45) { S.save.money += 40; G.save(); G.snd.cash(); G.say('Você ganhou na sinuca! +$40 de aposta.', 3.5); } else G.say('Perdeu a partida. O taco entortou, né?', 3); } }));
        add(O('jukebox', 100, 190, 56, 30, { e: 50, label: 'TROCAR A MÚSICA', act: S => { G.snd.nextStation(); S.radioT = 3; G.say('Jukebox: outra música!', 2); } }));
        add(O('mesa', 130, 340, 56, 40, { e: 18 }), O('cadeira', 108, 350, 22, 22, { solid: false }), O('cadeira', 190, 350, 22, 22, { solid: false }));
        add(O('mesa', 240, 430, 56, 40, { e: 18 }), O('cadeira', 218, 440, 22, 22, { solid: false }), O('cadeira', 300, 440, 22, 22, { solid: false }));
        R.cliente = { x: 230, y: 360, falas: ['Mais uma gelada, por favor!', 'O time perdeu de novo...'] };
      },
      deco: x => { K.prateleiraParede(x, 240, 110, 240, ['#2f8a3c', '#c8302a', '#d8a82a', '#4aa0e0']); }
    },
    cafe: {
      piso: 'carpete', pisoCores: ['#5a3a28', '#4a2e1e'], parede: '#7a5238', balcao: 'pastel', neon: '#ffe8c8', label: 'PEDIR UM CAFÉ', titulo: 'CAFÉ — CARDÁPIO',
      itens: () => [comida('cafe', 4), comida('pingado', 9), comida('brownie', 7), comida('bolo', 8), comida('paoqueijo', 6)],
      falas: ['O café da casa é coado na hora.', 'Pão de queijo quentinho, quer?', 'Aqui o wi-fi é grátis.', 'Hoje tem bolo de chocolate!'],
      atendente: { shirt: '#3a2418', pat: 'liso', sleeve: 'curta', fem: true, hairStyle: 'coque', acc: 'none' },
      extras(R, add) {
        add(O('mesa', 120, 340, 56, 40, { e: 18 }), O('cadeira', 98, 350, 22, 22, { solid: false }), O('cadeira', 180, 350, 22, 22, { solid: false }));
        add(O('mesa', 250, 420, 56, 40, { e: 18 }), O('cadeira', 228, 430, 22, 22, { solid: false }), O('cadeira', 310, 430, 22, 22, { solid: false }));
        add(O('sofa', 450, 350, 170, 46, { e: 18 }));
        add(O('planta', 90, 470, 40, 50, {}), O('planta', 610, 470, 40, 50, {}));
        R.cliente = { x: 520, y: 372, falas: ['Esse café me acorda para tudo.', 'Estou esperando um amigo.'] };
      },
      deco: x => { for (let k = 0; k < 5; k++) { x.fillStyle = '#f2ecdc'; x.fillRect(150 + k * 100, 84, 26, 18); x.fillStyle = '#4a2a18'; x.fillRect(153 + k * 100, 86, 20, 6); x.strokeStyle = '#f2ecdc'; x.lineWidth = 2; x.beginPath(); x.arc(178 + k * 100, 93, 5, -1.4, 1.4); x.stroke(); } }
    }
  };

  function criaLoja(id, lg) {
    const pl = lg.place, c = TIPOS[pl.loja] || TIPOS.mercadinho;
    const R = salaBase(pl, c);
    const add = (...a) => R.objs.push(...a);
    // balcão com o atendente atrás
    const menu = S => abre(S, c.titulo, c.itens());
    add(O('balcao', 230, 190, 260, 40, { e: 28, itens: c.balcao, label: c.label, r: 46, act: menu }));
    c.extras(R, add, pl);
    R.deco = x => { c.deco && c.deco(x, pl); letreiro(x, pl, c.neon); };
    const at = { k: 232, x: 360, y: 206, p: look(c.atendente), falas: c.falas, h: Math.PI, fixo: true, nome: pick(['Seu Carlos', 'Dona Rita', 'Marcos', 'Luana', 'Seu Antônio', 'Fátima', 'Rogério', 'Camila']), dinheiro: Math.round(rand(60, 220)), label: 'CONVERSAR / ASSALTAR' };
    R.npcs.push(at);
    if (R.cliente) R.npcs.push({ x: R.cliente.x, y: R.cliente.y, p: look({}), falas: R.cliente.falas, h: Math.PI * 0.5, fixo: true, nome: pick(['Seu Nilton', 'Jéssica', 'Paulo', 'Marina']), dinheiro: Math.round(rand(20, 90)) });
    R.luzes.push({ x: 380, y: 250, r: 300 });
    return R;
  }
  L.construtores['tipo:loja'] = { criar: criaLoja };

  // =====================================================================
  //  BANCO RIBEIRÃO
  // =====================================================================
  const saldo = S => S.save.banco || 0;
  function menuBanco(S, R) {
    const dep = v => ({ n: 'Depositar $' + v, desc: 'o dinheiro fica seguro no banco', fn: S2 => { if (S2.save.money < v) { G.say('Você não tem $' + v + ' na mão.', 2.5); return; } S2.save.money -= v; S2.save.banco = saldo(S2) + v; G.save(); G.snd.cash(); G.say('Depositado: $' + v + '. Saldo: $' + saldo(S2) + '.', 3); } });
    const saq = v => ({ n: 'Sacar $' + v, desc: 'tira dinheiro da conta', fn: S2 => { if (saldo(S2) < v) { G.say('Saldo insuficiente.', 2.5); return; } S2.save.banco = saldo(S2) - v; S2.save.money += v; G.save(); G.snd.cash(); G.say('Sacado: $' + v + '. Saldo: $' + saldo(S2) + '.', 3); } });
    L.abrirMenu(S, { titulo: 'BANCO RIBEIRÃO — GUICHÊ', rodape: 'Dinheiro no banco NÃO se perde quando você morre ou é preso  ·  ESC sair', info: S2 => 'Na mão: $' + S2.save.money + '   Saldo: $' + saldo(S2),
      itens: [dep(100), dep(500), { n: 'Depositar TUDO', desc: 'guarda tudo o que você tem na mão', fn: S2 => { const v = Math.floor(S2.save.money); if (v <= 0) { G.say('Você está sem dinheiro na mão.', 2.5); return; } S2.save.money -= v; S2.save.banco = saldo(S2) + v; G.save(); G.snd.cash(); G.say('Depositado $' + v + '. Saldo: $' + saldo(S2) + '.', 3); } }, saq(100), saq(500),
        { n: 'Sacar TUDO', desc: 'devolve todo o saldo para a sua mão', fn: S2 => { const v = saldo(S2); if (v <= 0) { G.say('Sua conta está zerada.', 2.5); return; } S2.save.banco = 0; S2.save.money += v; G.save(); G.snd.cash(); G.say('Sacado $' + v + '. Saldo: $0.', 3); } }] });
  }
  L.construtores.banco = {
    criar(id, lg) {
      const pl = lg.place, R = L.novaSala({ place: pl, w: 700, h: 400, nome: pl.nome, cor: pl.cor, piso: 'ladrilho', pisoCores: ['#e8e4dc', '#c4c0b4'], parede: '#2a4a7a', subtitulo: horaTxt(pl) });
      R.chegada = { x: R.portaX, y: R.y1 + 10 };
      const add = (...a) => R.objs.push(...a);
      const tellers = [];
      [150, 350, 550].forEach((x, k) => {
        add(O('recepcao', x, 190, 150, 40, { e: 30, label: 'GUICHÊ ' + (k + 1) + ' — DEPOSITAR / SACAR', r: 46, act: S => menuBanco(S, R) }));
        tellers.push({ k: 232, x: x + 75, y: 206, p: look({ shirt: '#2a4a7a', pat: 'liso', sleeve: 'longa', fem: k !== 1, acc: 'none' }), falas: ['Bom dia! Vai depositar ou sacar?', 'O dinheiro no banco está seguro.', 'Documento, por favor.', 'Próximo!'], h: Math.PI, fixo: true, nome: ['Marta', 'Seu Edson', 'Cláudia'][k], dinheiro: Math.round(rand(250, 600)), label: 'CONVERSAR / ASSALTAR' });
      });
      R.npcs.push(...tellers);
      // fila de clientes e segurança
      R.npcs.push({ x: 350, y: 300, p: look({}), falas: ['Essa fila não anda...', 'Só vim pagar uma conta.'], h: 0, fixo: true, nome: 'Seu Jorge', dinheiro: 60 }, { x: 350, y: 340, p: look({}), falas: ['Hoje o banco está cheio.'], h: 0, fixo: true, nome: 'Dona Lúcia', dinheiro: 90 },
        { x: 120, y: 430, p: look({ shirt: '#16181e', pat: 'liso', sleeve: 'curta', acc: 'cap', accCol: '#16181e', hairStyle: 'raspado', fem: false }), falas: ['Qualquer confusão e eu chamo a polícia.', 'Câmeras em todo canto, hein.'], h: Math.PI, fixo: true, nome: 'Segurança', dinheiro: 40, label: 'CONVERSAR' });
      add(O('cofre', 560, 330, 120, 60, { e: 46, label: 'COFRE-FORTE DO BANCO', r: 46, act: S => { if (!K.armado(S)) { G.say('A porta do cofre é de aço. Sem uma arma na mão, ninguém abre isso.', 4); return; } if (R.cofreAberto) { G.say('O cofre já foi esvaziado.', 3); return; } R.cofreAberto = true; const v = Math.round(rand(700, 1400)); S.save.money += v; G.save(); G.snd.cash(); G.say('ASSALTO AO BANCO! Você levou $' + v + ' do cofre. A polícia foi chamada!', 6); K.chamaPolicia(S, R, 4); R.assaltos = (R.assaltos || 0) + 1; } }));
      add(O('banco_espera', 130, 340, 150, 26, { e: 16, label: 'SENTAR NA FILA', r: 30, act: S => { K.cura(S, 4); G.say('Você esperou sentado um pouco. (+4 vida)', 3); } }));
      add(O('planta', 90, 470, 40, 50, {}), O('planta', 700, 470, 40, 50, {}));
      R.deco = x => { x.fillStyle = '#c8a24a'; x.fillRect(120, 70, 600, 3); [150, 690].forEach(a => K.cartaz(x, a - 30, 76, 60, 40, '#f2f2f2', [])); x.fillStyle = '#2a4a7a'; x.font = 'bold 11px Arial'; x.textAlign = 'center'; x.fillText('JUROS', 150, 100); x.fillText('CRÉDITO', 690, 100); x.textAlign = 'left'; letreiro(x, pl, '#8ac8ff', 420); };
      R.luzes.push({ x: 420, y: 300, r: 380 });
      return R;
    }
  };
  K.tipos.banco_espera = (ctx, o) => { K.caixa(ctx, o.x, o.y, o.w, o.h, o.e || 16, '#6a4a2e', '#4a3220'); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(o.x, o.y - (o.e || 16), o.w, 2); };

  // =====================================================================
  //  PADARIA e PIZZARIA
  // =====================================================================
  function salaComida(pl, c) {
    const R = L.novaSala({ place: pl, w: 640, h: 380, nome: pl.nome, cor: pl.cor, piso: c.piso, pisoCores: c.pisoCores, parede: c.parede, subtitulo: horaTxt(pl) });
    R.chegada = { x: R.portaX, y: R.y1 + 10 };
    const add = (...a) => R.objs.push(...a);
    add(O(c.balcaoTipo || 'balcao', 220, 190, 280, 40, { e: 28, itens: c.balcao, top: c.top, front: c.front, label: c.label, r: 46, act: S => abre(S, c.titulo, c.itens()) }));
    c.extras(R, add);
    R.deco = x => { c.deco && c.deco(x); letreiro(x, pl, c.neon); };
    R.npcs.push({ k: 232, x: 360, y: 206, p: look(c.atendente), falas: c.falas, h: Math.PI, fixo: true, nome: c.nome, dinheiro: Math.round(rand(80, 260)), label: 'CONVERSAR / ASSALTAR' });
    c.clientes.forEach(([x, y, f]) => R.npcs.push({ x, y, p: look({}), falas: f, h: Math.PI * 0.5, fixo: true, nome: pick(['Seu Nilton', 'Jéssica', 'Paulo', 'Marina', 'Dona Zilda']), dinheiro: Math.round(rand(20, 90)) }));
    R.luzes.push({ x: 380, y: 300, r: 320 });
    return R;
  }
  L.construtores.padaria = {
    criar(id, lg) {
      return salaComida(lg.place, {
        piso: 'ladrilho', pisoCores: ['#f6ecd8', '#e0cfa8'], parede: '#c8782a', balcaoTipo: 'balcao_padaria', neon: '#fff0c8', label: 'COMPRAR NA PADARIA', titulo: 'PADARIA — BALCÃO',
        itens: () => [comida('pao', 1), comida('paoqueijo', 3), comida('coxinha', 4), comida('empada', 4), comida('bolo', 8), comida('pingado', 6), comida('cafe', 3)],
        falas: ['O pão saiu agorinha, quentinho!', 'Pão de queijo? Acabou de sair do forno.', 'Café coado na hora, quer?', 'Bolo de chocolate tem pouco, vai logo!'],
        atendente: { shirt: '#f4f0e8', pat: 'liso', sleeve: 'curta', acc: 'hat', accCol: '#f4f0e8', fem: false }, nome: 'Seu Manoel',
        extras(R, add) {
          add(O('fogao', 100, 190, 100, 40, { e: 40, ligado: true, label: 'FORNO QUENTE', act: () => G.say('O forno está quente demais para chegar perto. Cheira bem!', 3) }));
          add(O('pilha_caixas', 540, 190, 80, 44, { e: 30 }));
          add(O('mesa', 120, 340, 56, 40, { e: 18 }), O('cadeira', 98, 350, 22, 22, { solid: false }), O('cadeira', 180, 350, 22, 22, { solid: false }));
          add(O('mesa', 270, 410, 56, 40, { e: 18 }), O('cadeira', 248, 420, 22, 22, { solid: false }), O('cadeira', 330, 420, 22, 22, { solid: false }));
          add(O('mesa', 480, 340, 56, 40, { e: 18 }), O('cadeira', 458, 350, 22, 22, { solid: false }), O('cadeira', 540, 350, 22, 22, { solid: false }));
          add(O('planta', 90, 470, 40, 50, {}), O('planta', 640, 470, 40, 50, {}));
        },
        deco: x => { for (let k = 0; k < 8; k++) { x.fillStyle = k % 2 ? '#d8a060' : '#f0d8a0'; x.beginPath(); x.ellipse(150 + k * 66, 76, 17, 9, 0, 0, TAU); x.fill(); } },
        clientes: [[430, 290, ['Hmm, esse pão está ótimo.', 'Todo dia venho aqui.']], [200, 300, ['Vou levar meia dúzia de pães.']]]
      });
    }
  };
  L.construtores.pizzaria = {
    criar(id, lg) {
      return salaComida(lg.place, {
        piso: 'xadrez', pisoCores: ['#f2e8d0', '#b02a2a'], parede: '#8a2020', neon: '#ffe04a', balcao: 'pastel', label: 'FAZER O PEDIDO', titulo: 'PIZZARIA — CARDÁPIO',
        itens: () => [comida('fatia', 8), comida('pizzagrande', 38), comida('guarana', 5), comida('cerveja', 6), comida('brownie', 7)],
        falas: ['Pizza de calabresa saindo do forno!', 'A massa é feita aqui, todo dia.', 'Pizza grande dá pra dois. Ou pra um faminto.', 'Borda recheada? Só mais cinco.'],
        atendente: { shirt: '#ffffff', pat: 'liso', sleeve: 'curta', acc: 'hat', accCol: '#ffffff', fem: true, hairStyle: 'coque' }, nome: 'Dona Maria',
        extras(R, add) {
          add(O('fogao', 100, 190, 110, 40, { e: 46, ligado: true, label: 'FORNO A LENHA', act: () => G.say('O forno a lenha está a 400 graus. Dá pra assar uma pizza em dois minutos.', 4) }));
          add(O('jukebox', 560, 190, 56, 30, { e: 50, label: 'TROCAR A MÚSICA', act: S => { G.snd.nextStation(); S.radioT = 3; G.say('Rádio: outra música!', 2); } }));
          [[120, 340], [270, 400], [440, 340]].forEach(([a, b]) => add(O('mesa', a, b, 60, 42, { e: 18, top: '#c8302a', front: '#8a1f1f' }), O('cadeira', a - 24, b + 10, 22, 22, { solid: false }), O('cadeira', a + 62, b + 10, 22, 22, { solid: false })));
          add(O('planta', 90, 470, 40, 50, {}), O('planta', 640, 470, 40, 50, {}));
        },
        deco: x => { for (let k = 0; k < 6; k++) { x.fillStyle = '#e8a040'; x.beginPath(); x.arc(150 + k * 82, 76, 14, 0, TAU); x.fill(); x.fillStyle = '#c8302a'; for (let j = 0; j < 4; j++) { x.beginPath(); x.arc(150 + k * 82 + Math.cos(j * 1.6) * 6, 76 + Math.sin(j * 1.6) * 6, 2.5, 0, TAU); x.fill(); } } },
        clientes: [[560, 330, ['A pizza daqui é a melhor da cidade.']], [200, 380, ['Já pedi, agora é esperar.']]]
      });
    }
  };
})(window.G = window.G || {});
