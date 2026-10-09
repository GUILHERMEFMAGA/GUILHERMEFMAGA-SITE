/* =====================================================================
   MANSAO.JS — MANSÃO DO PODEROSO CHEFÃO (VILLA MAFIOSA)
   Uma propriedade monumental, isolada e ultra-protegida:
     • Estrada cênica exclusiva com postes de LED e placas de segurança
     • Entrada monumental com portão automático, guaritas e cancelas
     • Mais de 50 seguranças estratégicos em ternos pretos e óculos escuros
     • 6 cães de guarda (Rottweilers) patrulhando o gramado
     • Limusine preta presidencial com motorista particular (Vincenzo)
     • Carrinho de golfe pilotável no campo verdejante
     • Grande área de lazer externa com piscina olímpica de LEDs noturnos
     • Interiores monumentais:
       - Térreo: Hall nobre, Sofia (recepcionista pessoal, entregas e festas),
         Luigi (barman particular, whisky 18 anos), Biblioteca gigante com lareira,
         Cinema particular com telão gigante, Dona Carmela (cozinheira siciliana),
         Alojamento das faxineiras, Suíte de hóspedes VIP e Subsolo de Interrogatório
       - Andar Superior: Elevador/Escadaria nobre, Corredor VIP com guardas de elite,
         Mega Escritório com Computador Dark Web e Telefone Vermelho executivo,
         Suíte Master com Cama King Size para deitar/dormir, Sofás para sentar,
         Closet de luxo com vitrine de relógios Rolex e joias + trocador de ternos,
         Banheiro Master de mármore com Jacuzzi Spa e Varanda panorâmica
     • Sistema de Festas VIP com decoradores, convidados, DJ e faxineiras no dia seguinte
     • Sistema de Entregas Online com revista rigorosa na guarita
   ===================================================================== */
(function (G) {
  'use strict';
  const L = G.lugares, K = L.kit, W = G.world, SP = G.sprites, D = G.deco, TAU = Math.PI * 2;
  const shade = K.shade, hh = K.hh;
  const O = K.O, pick = K.pick, rand = K.rand, clamp = K.clamp;
  const M = G.mansao = {};

  // ---------- COORDENADAS DA PROPRIEDADE NO MAPA MUNDIAL ----------
  // Localizada nas Fazendas Santa Rita (coluna 11, linha 2) — vasto campo aberto de luxo
  const T = W.T || 32, ROAD = 8, BLOCK = 20, PITCH = ROAD + BLOCK, MG = 6;
  const bx = 11, by = 2;
  const tx0 = MG + ROAD + bx * PITCH, ty0 = MG + ROAD + by * PITCH;
  const estate = {
    x0: tx0 * T,
    y0: ty0 * T,
    w: BLOCK * T,
    h: BLOCK * T,
    cx: (tx0 + BLOCK / 2) * T,
    cy: (ty0 + BLOCK / 2) * T
  };

  // Pontos de interesse na propriedade
  const P_MANSAO = { x: estate.cx, y: (ty0 + 10) * T + 20 };       // Porta principal da Mansão
  const P_FONTE = { x: estate.cx, y: (ty0 + 14) * T };             // Pátio da Fonte Central
  const P_PORTAO = { x: estate.cx, y: estate.y0 + estate.h - 30 }; // Portão Principal / Guaritas
  const P_LIMO = { x: estate.cx - 90, y: (ty0 + 10) * T + 30 };    // Ponto da Limusine
  const P_GOLF = { x: estate.cx - 210, y: (ty0 + 13) * T };        // Ponto do Carrinho de Golfe
  const P_PISCINA = { x: estate.cx + 175, y: (ty0 + 13) * T };     // Grande Piscina Olímpica
  const P_GOLFE_CAMPO = { x: estate.cx - 200, y: (ty0 + 13) * T }; // Campo de Golfe
  const P_HELI = { x: estate.cx - 190, y: (ty0 + 13) * T };        // Heliponto Privativo

  M.estate = estate;
  M.pontos = { P_MANSAO, P_FONTE, P_PORTAO, P_LIMO, P_GOLF, P_PISCINA, P_HELI };

  // ---------- ESTADO GLOBAL DA MANSÃO (salvo ou dinâmico) ----------
  M.estado = {
    festaAtiva: false,
    festaAte: 0,
    alertaMaximo: false,
    alertaAte: 0,
    encomendaPendente: null,
    entregador: null,
    escoltaAtiva: false,
    rivalPreso: false,
    rivalNome: 'Luigi Falcone (Família Rival)'
  };

  // Adiciona a Mansão como Lugar Oficial no Mundo
  const plMansao = {
    id: 'mansao_chefao',
    tipo: 'mansao',
    nome: 'MANSÃO DO PODEROSO CHEFÃO',
    sub: 'Villa Mafiosa — Quartel-General do Don',
    cor: '#e5b834',
    x: P_MANSAO.x,
    y: P_MANSAO.y + 20,
    r: 46
  };
  if (W.places && !W.places.some(p => p.id === 'mansao_chefao')) {
    W.places.push(plMansao);
  }

  // ---------- SEGURANÇA ESTRATÉGICA PERIMETRAL (LONGE DA CASA, SEM AMONTOAR) ----------
  const GUARDAS_POS = [
    // 1. Torres de Vigia Perimetrais Distantes (Snipers nos 4 cantos extremos dos muros)
    { x: estate.x0 + 40, y: estate.y0 + 40, h: Math.PI / 4, tag: 'torre_no', arma: 'sniper' },
    { x: estate.x0 + estate.w - 40, y: estate.y0 + 40, h: -Math.PI / 4, tag: 'torre_ne', arma: 'sniper' },
    { x: estate.x0 + 40, y: estate.y0 + estate.h - 40, h: 3 * Math.PI / 4, tag: 'torre_so', arma: 'sniper' },
    { x: estate.x0 + estate.w - 40, y: estate.y0 + estate.h - 40, h: -3 * Math.PI / 4, tag: 'torre_se', arma: 'sniper' },

    // 2. Posto de Controle da Estrada Sul (Guaritas e Bloqueio Rodoviário Distante)
    { x: P_PORTAO.x - 70, y: P_PORTAO.y, h: 0, tag: 'guarita_sul_e', arma: 'smg' },
    { x: P_PORTAO.x + 70, y: P_PORTAO.y, h: 0, tag: 'guarita_sul_d', arma: 'smg' },
    { x: P_PORTAO.x - 130, y: P_PORTAO.y + 35, h: 0.1, tag: 'estrada_bloqueio_e', arma: 'shotgun' },
    { x: P_PORTAO.x + 130, y: P_PORTAO.y + 35, h: -0.1, tag: 'estrada_bloqueio_d', arma: 'shotgun' },

    // 3. Patrulhas Distantes nos Muros Laterais Externos
    { x: estate.x0 + 35, y: estate.cy - 140, h: Math.PI / 2, tag: 'patrulha_oeste_1', arma: 'smg' },
    { x: estate.x0 + 35, y: estate.cy + 140, h: Math.PI / 2, tag: 'patrulha_oeste_2', arma: 'smg' },
    { x: estate.x0 + estate.w - 35, y: estate.cy - 140, h: -Math.PI / 2, tag: 'patrulha_leste_1', arma: 'smg' },
    { x: estate.x0 + estate.w - 35, y: estate.cy + 140, h: -Math.PI / 2, tag: 'patrulha_leste_2', arma: 'smg' },

    // 4. Instalações Externas Afastadas
    { x: P_HELI.x - 45, y: P_HELI.y - 25, h: 0.8, tag: 'guarda_heli', arma: 'smg' },
    { x: P_GOLFE_CAMPO.x - 30, y: P_GOLFE_CAMPO.y + 40, h: -0.5, tag: 'guarda_golfe', arma: 'pistol' },
    { x: P_PISCINA.x + 65, y: P_PISCINA.y + 40, h: -0.8, tag: 'guarda_piscina', arma: 'pistol' },

    // 5. Entrada Principal da Mansão (Apenas 2 Guardas de Honra elegantes de prontidão)
    { x: P_MANSAO.x - 42, y: P_MANSAO.y + 12, h: Math.PI, tag: 'honra_e', arma: 'pistol' },
    { x: P_MANSAO.x + 42, y: P_MANSAO.y + 12, h: Math.PI, tag: 'honra_d', arma: 'pistol' }
  ];

  // ---------- CÃES DE GUARDA (PATRULHA EXCLUSIVA NO PERÍMETRO EXTERNO) ----------
  const CAES_POS = [
    { x: estate.x0 + 50, y: estate.cy - 80, ang: 1.5, r: 35, latT: 0, nome: 'Brutus' },
    { x: estate.x0 + 50, y: estate.cy + 80, ang: 1.5, r: 35, latT: 0, nome: 'Titan' },
    { x: estate.x0 + estate.w - 50, y: estate.cy - 80, ang: -1.5, r: 35, latT: 0, nome: 'Nero' },
    { x: estate.x0 + estate.w - 50, y: estate.cy + 80, ang: -1.5, r: 35, latT: 0, nome: 'Thor' },
    { x: P_PORTAO.x - 105, y: P_PORTAO.y - 25, ang: 0, r: 25, latT: 0, nome: 'Rex' },
    { x: P_PORTAO.x + 105, y: P_PORTAO.y - 25, ang: Math.PI, r: 25, latT: 0, nome: 'Apolo' }
  ];

  // Falas dos seguranças da máfia
  const FALAS_GUARDAS = [
    'Bom dia, Don! O perímetro está 100% blindado.',
    'Nenhum policial ou rival ousa pisar nesta propriedade, Chefe.',
    'A limusine está com o tanque cheio e pronta para partir.',
    'Os tributos das lojas da cidade foram recolhidos com sucesso.',
    'Dona Carmela preparou um banquete siciliano dos deuses na cozinha.',
    'Sofia avisou que o correio particular chegou na recepção.',
    'Cães de patrulha alimentados e em alerta máximo, Don!',
    'Qualquer problema na cidade, mande nos chamar pelo telefone vermelho!'
  ];

  // ---------- VEÍCULOS PARTICULARES DA MANSÃO ----------
  let limusineObj = null;
  let golfCartObj = null;

  function garanteVeiculos(S) {
    if (!S || !S.cars) return;
    if (!limusineObj || !S.cars.includes(limusineObj) || limusineObj.dead) {
      limusineObj = new G.Car({
        x: P_LIMO.x,
        y: P_LIMO.y,
        a: 0,
        kind: 'limo',
        color: '#111216',
        driver: 'none',
        mode: 'parked',
        owned: true,
        tag: 'mansao_limo'
      });
      limusineObj.hp = 150;
      S.cars.push(limusineObj);
    }
    if (!golfCartObj || !S.cars.includes(golfCartObj) || golfCartObj.dead) {
      golfCartObj = new G.Car({
        x: P_GOLF.x,
        y: P_GOLF.y,
        a: Math.PI / 2,
        kind: 'golf',
        color: '#286a3b',
        driver: 'none',
        mode: 'parked',
        owned: true,
        tag: 'mansao_golf'
      });
      S.cars.push(golfCartObj);
    }
  }

  // ---------- TRAJES EXCLUSIVOS DO PODEROSO CHEFÃO ----------
  M.TRAJES = [
    {
      id: 'classico',
      nome: 'Terno Preto Clássico "O Poderoso Chefão"',
      desc: 'Paletó italiano preto acetinado, camisa branca e gravata preta fina',
      look: { shirt: '#151518', pat: 'jaqueta', sleeve: 'longa', pants: '#151518', shoe: '#0a0a0c', acess: 0, corte: 0, cor: 4 }
    },
    {
      id: 'risca_giz',
      nome: 'Terno Risca de Giz "Chicago 1930"',
      desc: 'Terno azul marinho risca de giz com lenço de seda no bolso',
      look: { shirt: '#1c2838', pat: 'jaqueta', sleeve: 'longa', pants: '#1c2838', shoe: '#2a1a12', acess: 5, corte: 0, cor: 0 }
    },
    {
      id: 'smoking_branco',
      nome: 'Smoking Branco de Gala Imperial',
      desc: 'Smoking branco marfim, gravata borboleta dourada e sapatos de verniz',
      look: { shirt: '#f4f4f6', pat: 'jaqueta', sleeve: 'longa', pants: '#151518', shoe: '#0a0a0c', acess: 0, corte: 1, cor: 4 }
    },
    {
      id: 'don_vermelho',
      nome: 'Terno Escarlate Don Corleone',
      desc: 'Terno vermelho escarlate com detalhes bordados a ouro',
      look: { shirt: '#8b141a', pat: 'jaqueta', sleeve: 'longa', pants: '#8b141a', shoe: '#151518', acess: 0, corte: 0, cor: 0 }
    },
    {
      id: 'sobretudo',
      nome: 'Sobretudo de Couro & Óculos Escuros',
      desc: 'Sobretudo longo mafioso preto, luvas de couro e rayban escuro',
      look: { shirt: '#0f0f12', pat: 'jaqueta', sleeve: 'longa', pants: '#1a1a20', shoe: '#0a0a0c', acess: 0, corte: 2, cor: 4 }
    }
  ];

  M.vestirTraje = function (S, idx) {
    const t = M.TRAJES[idx % M.TRAJES.length];
    S.save.look = Object.assign({}, S.save.look || {}, t.look);
    L.aplicarLook(S);
    G.save();
    G.say('Você vestiu o ' + t.nome + '!', 4);
    G.snd.cash();
  };

  // ---------- MENU DO MOTORISTA DA LIMUSINE (VINCENZO) ----------
  function menuChauffeur(S) {
    const destinos = [
      { n: '🚗 Centro de Ribeirão Preto (Garagem & Telefones)', x: 680, y: 720 },
      { n: '🍺 Pinguim Chopp & Mercadão Municipal', x: 1200, y: 720 },
      { n: '🌾 Fazendas Santa Rita (Área Rural)', x: 3800, y: 1600 },
      { n: '🏖️ Porto do Sol (Litoral & Marina)', x: 17500, y: 1600 },
      { n: '🏙️ Novo Horizonte (Cidade Moderna)', x: 11200, y: 1600 },
      { n: '✈️ Vale Verde & Aeroporto Internacional', x: 15400, y: 1600 }
    ];

    const itens = destinos.map(d => ({
      n: d.n,
      desc: 'Viagem executiva com escolta particular',
      fn: S2 => {
        G.say('Vincenzo: "Sim, Don! Partindo imediatamente para ' + d.n.split('(')[0] + '."', 3.5);
        L.trans(S2, () => {
          S2.player.x = d.x;
          S2.player.y = d.y;
          S2.cam.x = d.x;
          S2.cam.y = d.y;
          if (limusineObj) {
            limusineObj.x = d.x + 30;
            limusineObj.y = d.y;
            limusineObj.a = 0;
            limusineObj.vx = limusineObj.vy = 0;
          }
          G.say('Chegamos ao destino, Don. A limusine está à sua disposição.', 4);
        });
        return 'fechar';
      }
    }));

    itens.unshift({
      n: '🔑 Assumir o Volante e Dirigir Pessoalmente',
      desc: 'Você mesmo pilota a limusine blindada',
      fn: S2 => {
        if (limusineObj) {
          S2.player.x = limusineObj.x;
          S2.player.y = limusineObj.y;
          // entra no carro
          limusineObj.driver = 'player';
          S2.player.car = limusineObj;
          G.say('Você assumiu o comando da Limusine Presidencial.', 3);
        }
        return 'fechar';
      }
    });

    L.abrirMenu(S, {
      titulo: 'LIMUSINE DO CHEFÃO — VINCENZO (MOTORISTA PARTICULAR)',
      rodape: 'W/S escolher destino  ·  E confirmar  ·  ESC sair',
      info: 'Vincenzo está pronto para levar o Don a qualquer lugar.',
      itens
    });
  }

  // ---------- MENU DO TELEFONE VERMELHO EXECUTIVO (MÁFIA) ----------
  M.menuTelefone = function (S) {
    const itens = [
      {
        n: '📞 1. Chamar Limusine com Chófer na Porta Principal',
        desc: 'Vincenzo posiciona a limusine imediatamente em frente à mansão',
        fn: S2 => {
          if (limusineObj) {
            limusineObj.x = P_LIMO.x;
            limusineObj.y = P_LIMO.y;
            limusineObj.a = 0;
            limusineObj.hp = 150;
            limusineObj.dead = false;
          }
          G.say('Vincenzo: "A limusine já está brilhando e pronta na porta, Don!"', 4);
          G.snd.door();
          return 'fechar';
        }
      },
      {
        n: '🛡️ 2. Despachar Guarda-Costas Armados para Escolta',
        desc: 'Dois capangas de terno e metralhadora acompanham o Don onde for',
        fn: S2 => {
          M.estado.escoltaAtiva = true;
          G.say('Dois guarda-costas de elite foram destacados para a sua escolta pessoal!', 4.5);
          G.snd.cash();
          return 'fechar';
        }
      },
      {
        n: '💰 3. Coletar Tributos / Propinas da Cidade ($10.000 a $25.000)',
        desc: 'Capangas recolhem o dinheiro de proteção dos negócios e comércios',
        fn: S2 => {
          const valor = 10000 + Math.floor(Math.random() * 15000);
          S2.save.money += valor;
          G.save();
          G.snd.cash();
          G.say('LUCRO DA MÁFIA! Os capangas recolheram $' + valor + ' em tributos da cidade.', 5);
          return 'fechar';
        }
      },
      {
        n: '🔒 4. Ordenar Captura / Sequestro de Rival para a Sala de Interrogatório',
        desc: 'Capangas capturam Luigi Falcone e o amarram na cadeira do subsolo',
        fn: S2 => {
          M.estado.rivalPreso = true;
          G.say('ORDEM CUMPRIDA: O rival Luigi Falcone foi capturado e levado ao subsolo da mansão!', 5);
          G.snd.door();
          return 'fechar';
        }
      },
      {
        n: '⚖️ 5. Subornar Juiz Federal e Delegacia (Limpar Heat a 0 estrelas)',
        desc: 'Custa $1.000 · A polícia cancela qualquer perseguição instantaneamente',
        fn: S2 => {
          if (!K.gasta(S2, 1000)) return;
          S2.heat = 0;
          S2.heatLevel = 0;
          if (S2.cars) {
            S2.cars.forEach(c => { if (c.kind === 'police' && c.mode === 'chase') c.mode = 'leave'; });
          }
          G.say('Suborno pago! Todas as queixas policiais foram arquivadas. (0 estrelas)', 4.5);
          return 'fechar';
        }
      },
      {
        n: '🚨 6. Ativar Protocolo de Alerta Máximo na Mansão',
        desc: 'Seguranças e cães entram em prontidão total com armas engatilhadas',
        fn: S2 => {
          M.estado.alertaMaximo = true;
          M.estado.alertaAte = S2.time + 300;
          G.say('ALERTA MÁXIMO ATIVADO: Todos os 50 seguranças e cães estão em prontidão!', 4.5);
          G.snd.bonk();
          return 'fechar';
        }
      },
      {
        n: '🏰 7. Renascimento na Mansão: ' + (S.save && S.save.spawnMansao === false ? 'DESATIVADO' : 'ATIVADO (PADRÃO)'),
        desc: 'Ao morrer ou ser preso, Dr. Salvatore e a escolta levam o Don direto para a Mansão com vida cheia',
        fn: S2 => {
          S2.save.spawnMansao = S2.save.spawnMansao === false ? true : false;
          G.save();
          G.say('Renascimento na Mansão definido como: ' + (S2.save.spawnMansao ? 'ATIVADO' : 'DESATIVADO') + '!', 4);
          return 'fechar';
        }
      },
      {
        n: '⚡ 8. Teletransportar Imediatamente para a Mansão do Don',
        desc: 'Viagem instantânea de volta para a sua Villa Mafiosa',
        fn: S2 => {
          L.trans(S2, () => {
            S2.player.x = P_MANSAO.x;
            S2.player.y = P_MANSAO.y + 12;
            S2.cam.x = S2.player.x;
            S2.cam.y = S2.player.y;
            G.say('Teletransportado com segurança para a Mansão do Poderoso Chefão!', 4);
          });
          return 'fechar';
        }
      }
    ];

    L.abrirMenu(S, {
      titulo: 'TELEFONE VERMELHO — COMANDOS DO PODEROSO CHEFÃO',
      rodape: 'W/S escolher ordem  ·  E executar  ·  ESC desligar',
      info: S2 => 'Don Guilherme  ·  Saldo: $' + Math.floor(S2.save.money),
      itens
    });
  };

  // ---------- MENU DO COMPUTADOR EXECUTIVO (DARK WEB / GESTÃO) ----------
  M.menuComputador = function (S) {
    const itens = [
      {
        n: '🔫 Comprar Minigun Giratória M134 + 500 Balas ($5.000)',
        desc: 'Arma pesada de alto calibre para aniquilar qualquer comboio',
        fn: S2 => {
          if (!K.gasta(S2, 5000)) return;
          S2.player.weapon = 'smg';
          S2.player.ammo = (S2.player.ammo || 0) + 500;
          M.agendarEntrega(S2, 'Minigun M134 com munição pesada');
          return 'fechar';
        }
      },
      {
        n: '🚀 Comprar Lança-Foguetes RPG-7 + 10 Mísseis ($6.000)',
        desc: 'Destruição total em área contra veículos blindados',
        fn: S2 => {
          if (!K.gasta(S2, 6000)) return;
          S2.player.weapon = 'grenade';
          S2.player.grenades = (S2.player.grenades || 0) + 10;
          M.agendarEntrega(S2, 'Caixa com RPG-7 e ogivas');
          return 'fechar';
        }
      },
      {
        n: '🎯 Comprar Rifle Sniper Dragunov de Alta Precisão ($3.500)',
        desc: 'Tiro longo com mira laser e silenciador',
        fn: S2 => {
          if (!K.gasta(S2, 3500)) return;
          S2.player.weapon = 'pistol';
          M.agendarEntrega(S2, 'Rifle de Precisão Dragunov');
          return 'fechar';
        }
      },
      {
        n: '🛡️ Colete Balístico de Titânio Don (Armadura 200) ($1.200)',
        desc: 'Proteção impenetrável fabricada sob medida',
        fn: S2 => {
          if (!K.gasta(S2, 1200)) return;
          S2.player.armor = 200;
          M.agendarEntrega(S2, 'Colete de Titânio Reforçado');
          return 'fechar';
        }
      },
      {
        n: '🏎️ Encomendar Superesportivo Ferrari Rosso Corsa ($18.000)',
        desc: 'Entregue imediatamente no pátio frontal da mansão',
        fn: S2 => {
          if (!K.gasta(S2, 18000)) return;
          const car = new G.Car({
            x: P_MANSAO.x + 80,
            y: P_MANSAO.y + 10,
            a: 0,
            kind: 'coupe',
            color: '#d61b1f',
            driver: 'none',
            mode: 'parked',
            owned: true,
            max: 480
          });
          S2.cars.push(car);
          G.say('Ferrari Rosso Corsa entregue no pátio da mansão!', 5);
          return 'fechar';
        }
      },
      {
        n: '📊 Relatório Financeiro e Rendimento Diário das Famílias',
        desc: 'Visualizar status das operações e territórios controlados',
        fn: S2 => {
          G.say('RELATÓRIO: Ribeirão Preto (100% sob controle), Porto do Sol (lucro +25%), Caixa Forte: $' + Math.floor(S2.save.money), 6);
          return 'fechar';
        }
      }
    ];

    L.abrirMenu(S, {
      titulo: 'COMPUTADOR EXECUTIVO — PORTAL DARK WEB DO CHEFÃO',
      rodape: 'W/S escolher item  ·  E comprar  ·  ESC sair',
      info: S2 => 'Conexão Segura Criptografada  ·  Saldo: $' + Math.floor(S2.save.money),
      itens
    });
  };

  // Agendamento de entrega com revista de segurança
  M.agendarEntrega = function (S, itemNome) {
    M.estado.encomendaPendente = itemNome;
    G.say('COMPRA CONFIRMADA: Entregador a caminho! Seguranças farão a revista na portaria.', 5);
  };

  // ---------- MENU DA CAMA KING SIZE (DEITAR / DORMIR) ----------
  function menuCamaMaster(S) {
    const itens = [
      {
        n: '💤 Dormir até o Amanhecer (06:00)',
        desc: 'Recupera 100% de vida, salva o progresso e acorda de manhã',
        fn: S2 => {
          S2.player.hp = 100;
          S2.player.armor = Math.max(S2.player.armor, 50);
          S2.dayT = Math.floor(S2.dayT) + 1.0; // 06:00
          G.save();
          G.say('Você dormiu profundamente na Suíte Master. Vida restaurada (100%) e jogo salvo!', 5);
          G.snd.door();
          return 'fechar';
        }
      },
      {
        n: '🌙 Dormir até o Anoitecer (20:00)',
        desc: 'Recupera 100% de vida, salva o progresso e acorda à noite com a mansão iluminada',
        fn: S2 => {
          S2.player.hp = 100;
          S2.player.armor = Math.max(S2.player.armor, 50);
          S2.dayT = Math.floor(S2.dayT) + 0.58; // ~20:00
          G.save();
          G.say('Você descansou até a noite. As luzes LED da mansão e da piscina estão acesas!', 5);
          G.snd.door();
          return 'fechar';
        }
      },
      {
        n: '🛌 Apenas Deitar e Descansar na Cama',
        desc: 'Recupera pontos de vida sem avançar o relógio',
        fn: S2 => {
          S2.player.hp = 100;
          G.say('Você deitou na cama King Size e descansou. Vida 100%!', 4);
          return 'fechar';
        }
      }
    ];

    L.abrirMenu(S, {
      titulo: 'SUÍTE MASTER — CAMA KING SIZE DO CHEFÃO',
      rodape: 'W/S escolher  ·  E confirmar  ·  ESC levantar',
      info: 'Lençóis de seda egípcia e travesseiros de pluma.',
      itens
    });
  }

  // ---------- MENU DA RECEPCIONISTA SOFIA (FESTAS E ENTREGAS) ----------
  function menuSofia(S) {
    const enc = M.estado.encomendaPendente;
    const itens = [];

    if (enc) {
      itens.push({
        n: '📦 Retirar Encomenda: ' + enc,
        desc: 'Entregador foi revistado na portaria e deixou o pacote aqui',
        fn: S2 => {
          G.say('Sofia: "Aqui está seu pacote, Don (' + enc + '). Foi devidamente inspecionado."', 4.5);
          M.estado.encomendaPendente = null;
          G.snd.cash();
          return 'fechar';
        }
      });
      itens.push({
        n: '🛎️ Mandar levar a encomenda para a Suíte Master',
        desc: 'A equipe de serviço levará diretamente ao seu quarto',
        fn: S2 => {
          G.say('Sofia: "Imediatamente, Don! O pacote já foi colocado na cabeceira da sua cama."', 4.5);
          M.estado.encomendaPendente = null;
          return 'fechar';
        }
      });
    }

    itens.push({
      n: '🎉 Contratar Especialistas de Festa & Organizar Mega Festa na Mansão ($2.500)',
      desc: 'DJs, iluminação temática, convidados VIP e bebidas. Faxineiras limpam no dia seguinte!',
      fn: S2 => {
        if (!K.gasta(S2, 2500)) return;
        M.estado.festaAtiva = true;
        M.estado.festaAte = S2.time + 400;
        G.say('Sofia: "Festa VIP organizada! Os decoradores deixaram a mansão deslumbrante e os convidados já chegaram!"', 5);
        G.snd.nextStation();
        return 'fechar';
      }
    });

    itens.push({
      n: '📋 Relatório Geral da Mansão e Finanças',
      desc: 'Status de segurança, funcionários e rendimento diário',
      fn: S2 => {
        G.say('Sofia: "50 seguranças a postos, 6 cães patrulhando, Dona Carmela na cozinha e equipe de limpeza pronta."', 5);
        return 'fechar';
      }
    });

    L.abrirMenu(S, {
      titulo: 'RECEPÇÃO — SOFIA (RECEPCIONISTA PESSOAL DO DON)',
      rodape: 'W/S escolher  ·  E confirmar  ·  ESC sair',
      info: 'Sofia cuida de todas as visitas, correspondências e eventos da mansão.',
      itens
    });
  }

  // ---------- MENU DO BARMAN LUIGI ----------
  function menuLuigi(S) {
    const itens = [
      {
        n: '🥃 Whisky Single Malt 18 Anos (Grátis pro Don)',
        desc: 'Maturado em barris de carvalho · Cura vida + bônus de resistência',
        fn: S2 => {
          S2.player.hp = 100;
          S2.bebado = (S2.bebado || 0) + 6;
          G.say('Luigi: "Para o Don, o melhor do mundo! Saúde!" (+vida máxima)', 4);
          return 'fechar';
        }
      },
      {
        n: '🍸 Dry Martini Don Corleone (Com azeitona nobre)',
        desc: 'Elegante e potente · Aumenta a velocidade de corrida',
        fn: S2 => {
          S2.player.hp = Math.min(100, S2.player.hp + 40);
          S2.bebado = (S2.bebado || 0) + 4;
          G.say('Luigi: "Martini batido, não mexido. Perfeito, Don!"', 3.5);
          return 'fechar';
        }
      },
      {
        n: '🍾 Champagne Dom Pérignon Cristal Imperial',
        desc: 'Espumante francês de alta safra · Cura completa',
        fn: S2 => {
          S2.player.hp = 100;
          G.say('Luigi: "Champagne servido na taça de cristal!"', 3.5);
          return 'fechar';
        }
      },
      {
        n: '🍹 Negroni Siciliano Tradicional',
        desc: 'Gin, Campari e Vermute tinto com casca de laranja',
        fn: S2 => {
          S2.player.hp = Math.min(100, S2.player.hp + 30);
          G.say('Luigi: "Um clássico da nossa terra, Don."', 3.5);
          return 'fechar';
        }
      }
    ];

    L.abrirMenu(S, {
      titulo: 'BAR & LOUNGE — LUIGI (BARMAN PARTICULAR DO DON)',
      rodape: 'W/S escolher bebida  ·  E saborear  ·  ESC sair',
      info: 'Todas as bebidas são cortesia da casa para o Poderoso Chefão.',
      itens
    });
  }

  // ---------- MENU DA COZINHEIRA DONA CARMELA ----------
  function menuCarmela(S) {
    const pratos = [
      {
        n: '🍝 Lasanha Artesanal Bolonhesa da Nona',
        desc: 'Massa fresca, molho de tomates italianos e queijo gratinado · Cura 100%',
        hp: 100
      },
      {
        n: '🥩 Risotto Trufado com Filet Mignon ao Molho Madeira',
        desc: 'Arroz arbóreo com trufas negras e medalhão de carne · Cura 100%',
        hp: 100
      },
      {
        n: '🥖 Cannoli Siciliano com Creme de Ricota e Pistache',
        desc: 'Doce tradicional crocante e irresistível · Cura 50%',
        hp: 50
      }
    ];

    const itens = [];
    pratos.forEach(p => {
      itens.push({
        n: 'Comer ' + p.n + ' na Mesa',
        desc: p.desc,
        fn: S2 => {
          S2.player.hp = Math.min(100, S2.player.hp + p.hp);
          G.say('Dona Carmela: "Mangia que te fa bene, Don Guilherme! Que satisfação ver o senhor comer bem!"', 4.5);
          return 'fechar';
        }
      });
      itens.push({
        n: '🛎️ Mandar levar ' + p.n + ' para o Quarto Master ou Escritório',
        desc: 'A refeição será entregue na sua mesa de trabalho',
        fn: S2 => {
          G.say('Dona Carmela: "Já estou montando a bandeja de prata para levarem ao seu aposento, Don!"', 4.5);
          return 'fechar';
        }
      });
    });

    L.abrirMenu(S, {
      titulo: 'COZINHA GOURMET — DONA CARMELA (COZINHEIRA PARTICULAR)',
      rodape: 'W/S escolher prato  ·  E confirmar  ·  ESC sair',
      info: 'A mais alta culinária siciliana feita com amor para o Don.',
      itens
    });
  }

  // ---------- CONSTRUÇÃO DAS SALAS INTERIORES DA MANSÃO ----------
  L.construtores.mansao_chefao = {
    criar(sid, lg) {
      switch (sid) {
        case 'bar': return salaBar(lg);
        case 'biblioteca': return salaBiblioteca(lg);
        case 'cinema': return salaCinema(lg);
        case 'cozinha': return salaCozinha(lg);
        case 'faxineiras': return salaFaxineiras(lg);
        case 'hospedes': return salaHospedes(lg);
        case 'interrogatorio': return salaInterrogatorio(lg);
        case 'corredor_superior': return salaCorredorSuperior(lg);
        case 'escritorio': return salaEscritorio(lg);
        case 'quarto_master': return salaQuartoMaster(lg);
        case 'closet': return salaCloset(lg);
        case 'banheiro_master': return salaBanheiroMaster(lg);
        case 'varanda': return salaVaranda(lg);
        default: return salaHallEntrada(lg);
      }
    }
  };
  L.construtores['tipo:mansao'] = L.construtores.mansao_chefao;

  // 1. HALL PRINCIPAL / RECEPÇÃO NOBRE (TÉRREO)
  function salaHallEntrada(lg) {
    const R = L.novaSala({
      w: 800,
      h: 460,
      nome: 'MANSÃO DO CHEFÃO — HALL NOBRE',
      cor: '#e5b834',
      piso: 'marmore',
      pisoCores: ['#f8f6f0', '#e2ddd2'],
      parede: '#302636'
    });

    // Tapete vermelho central e lustre de cristal
    R.objs.push(O('porta', 400, 150, 60, 20, { solid: false, k: 10, r: 50, label: 'ENTRAR: ELEVADOR / ESCADARIA NOBRE', placa: 'ELEVADOR / ESCADARIA NOBRE', para: 'corredor_superior', rotulo: 'ELEVADOR / ESCADARIA NOBRE (ANDAR SUPERIOR)', px: 400, py: 480, act: S => L.irSala(S, 'corredor_superior', 400, 480) }));
    R.objs.push(O('porta', 100, 260, 20, 50, { solid: false, k: 10, r: 50, label: 'ENTRAR: BAR & LOUNGE', placa: 'BAR & LOUNGE', para: 'bar', rotulo: 'BAR & LOUNGE', px: 680, py: 320, act: S => L.irSala(S, 'bar', 680, 320) }));
    R.objs.push(O('porta', 100, 380, 20, 50, { solid: false, k: 10, r: 50, label: 'ENTRAR: BIBLIOTECA GIGANTE', placa: 'BIBLIOTECA GIGANTE', para: 'biblioteca', rotulo: 'BIBLIOTECA GIGANTE', px: 680, py: 320, act: S => L.irSala(S, 'biblioteca', 680, 320) }));
    R.objs.push(O('porta', 760, 260, 20, 50, { solid: false, k: 10, r: 50, label: 'ENTRAR: CINEMA PARTICULAR', placa: 'CINEMA PARTICULAR', para: 'cinema', rotulo: 'CINEMA PARTICULAR', px: 120, py: 320, act: S => L.irSala(S, 'cinema', 120, 320) }));
    R.objs.push(O('porta', 760, 380, 20, 50, { solid: false, k: 10, r: 50, label: 'ENTRAR: COZINHA GOURMET', placa: 'COZINHA GOURMET', para: 'cozinha', rotulo: 'COZINHA GOURMET', px: 120, py: 320, act: S => L.irSala(S, 'cozinha', 120, 320) }));
    R.objs.push(O('porta', 240, 150, 40, 20, { solid: false, k: 10, r: 50, label: 'ENTRAR: SUÍTE HÓSPEDES', placa: 'SUÍTE HÓSPEDES', para: 'hospedes', rotulo: 'SUÍTE HÓSPEDES', px: 400, py: 420, act: S => L.irSala(S, 'hospedes', 400, 420) }));
    R.objs.push(O('porta', 560, 150, 40, 20, { solid: false, k: 10, r: 50, label: 'ENTRAR: ALA FUNCIONÁRIOS', placa: 'ALA FUNCIONÁRIOS', para: 'faxineiras', rotulo: 'ALA FUNCIONÁRIOS', px: 400, py: 420, act: S => L.irSala(S, 'faxineiras', 400, 420) }));
    R.objs.push(O('porta', 140, 150, 30, 20, { solid: false, k: 10, r: 50, label: 'ENTRAR: SUBSOLO SECRETO', placa: 'SUBSOLO SECRETO', para: 'interrogatorio', rotulo: 'SUBSOLO SECRETO', px: 400, py: 420, act: S => L.irSala(S, 'interrogatorio', 400, 420) }));

    // Balcão de Recepção de Sofia
    R.objs.push(O('balcao', 330, 280, 140, 40, {
      e: 28,
      top: '#d8b04a',
      front: '#2a1a12',
      label: 'CONVERSAR COM SOFIA (RECEPCIONISTA)',
      act: S => menuSofia(S)
    }));

    // Sofás de espera e estátuas de mármore
    R.objs.push(O('sofa', 180, 320, 90, 40, { cor: '#8b141a', label: 'SENTAR NO SOFÁ DE VELUDO', act: S => { S.sentado = true; G.say('Você sentou no sofá de veludo real do hall.', 3); } }));
    R.objs.push(O('sofa', 530, 320, 90, 40, { cor: '#8b141a', label: 'SENTAR NO SOFÁ DE VELUDO', act: S => { S.sentado = true; G.say('Você sentou no sofá de veludo real do hall.', 3); } }));

    // NPCs no Hall
    R.npcs.push({
      x: 400,
      y: 260,
      p: { shirt: '#f4f4f8', pants: '#1a1a24', hair: '#1a1208', hairStyle: 'coque', fem: true, dress: true },
      falas: ['Bom dia, Don Guilherme!', 'Sofia ao seu dispor para encomendas e eventos.', 'A mansão está impecável hoje.'],
      h: Math.PI,
      fixo: true
    });

    // Guardas de elite nas escadas
    R.npcs.push({ x: 340, y: 175, p: { shirt: '#141416', pants: '#141416', acc: 'shades', hairStyle: 'curto' }, falas: ['Subida liberada para o Don.', 'Nenhum intruso sobe ao seu escritório, Chefe.'], h: Math.PI, fixo: true });
    R.npcs.push({ x: 460, y: 175, p: { shirt: '#141416', pants: '#141416', acc: 'shades', hairStyle: 'curto' }, falas: ['Tudo em ordem no andar superior, Don.'], h: Math.PI, fixo: true });

    R.deco = ctx => {
      // Lustre dourado central e brasão da família
      ctx.fillStyle = 'rgba(229,184,52,0.18)';
      ctx.beginPath();
      ctx.arc(400, 300, 110, 0, TAU);
      ctx.fill();

      ctx.fillStyle = '#8b141a';
      ctx.fillRect(360, 150, 80, 340); // Tapete vermelho central

      ctx.fillStyle = '#e5b834';
      ctx.font = 'bold 13px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('⚜️ VILLA CORLEONE — HALL NOBRE ⚜️', 400, 100);
      ctx.textAlign = 'left';
    };

    return R;
  }

  // 2. BAR & LOUNGE DO DON
  function salaBar(lg) {
    const R = L.novaSala({
      w: 740,
      h: 420,
      nome: 'MANSÃO — BAR & LOUNGE PRIVADO',
      cor: '#e5b834',
      piso: 'madeira',
      pisoCores: ['#3e2316', '#2c180e'],
      parede: '#1f1624'
    });

    R.porta = { para: 'entrada', rotulo: 'HALL NOBRE', px: 130, py: 280 };

    // Balcão de Ônix com Luigi
    R.objs.push(O('balcao', 200, 200, 340, 44, {
      e: 30,
      top: '#181b22',
      front: '#d4af37',
      label: 'PEDIR DRINK AO BARMAN LUIGI',
      act: S => menuLuigi(S)
    }));

    // Mesa de Sinuca de Luxo
    R.objs.push(O('sinuca', 520, 320, 160, 90, {
      label: 'JOGAR SINUCA DE LUXO ($100)',
      act: S => {
        if (!K.gasta(S, 100)) return;
        if (Math.random() < 0.6) {
          S.save.money += 250;
          G.save();
          G.snd.cash();
          G.say('Tacada de mestre! Você venceu a partida de sinuca da máfia (+$250).', 4);
        } else {
          G.say('A bola branca foi de bico! Mais sorte na próxima.', 3);
        }
      }
    }));

    // Jukebox clássica
    R.objs.push(O('jukebox', 100, 240, 50, 30, {
      label: 'TROCAR MÚSICA DO LOUNGE',
      act: S => { G.snd.nextStation(); G.say('Jukebox: Jazz clássico italiano tocando.', 3); }
    }));

    // Sofás e poltronas
    R.objs.push(O('sofa', 120, 340, 100, 40, { cor: '#5a1218', label: 'SENTAR NO LOUNGE', act: S => { S.sentado = true; G.say('Relaxando com uma dose no lounge.', 3); } }));

    // Barman Luigi
    R.npcs.push({
      x: 370,
      y: 175,
      p: { shirt: '#f8f8fa', pants: '#111116', hairStyle: 'topete', hair: '#1a1208', acc: 'none' },
      falas: ['Don Guilherme! Qual é o drink de hoje?', 'O melhor Whisky 18 anos está sempre reservado para o senhor.'],
      h: Math.PI,
      fixo: true
    });

    R.deco = ctx => {
      ctx.fillStyle = '#e5b834';
      ctx.font = 'bold 12px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('🍸 BAR PRIVATIVO DO DON & CLUBE DE CHARUTOS 🍸', 370, 95);
      ctx.textAlign = 'left';
    };

    return R;
  }

  // 3. BIBLIOTECA GIGANTE DO MAFIOSO
  function salaBiblioteca(lg) {
    const R = L.novaSala({
      w: 740,
      h: 420,
      nome: 'MANSÃO — BIBLIOTECA IMPERIAL',
      cor: '#a86528',
      piso: 'madeira',
      pisoCores: ['#56341a', '#3e2410'],
      parede: '#2e1c12'
    });

    R.porta = { para: 'entrada', rotulo: 'HALL NOBRE', px: 130, py: 400 };

    // Estantes altas de livros e lareira crepitante
    R.objs.push(O('estante', 150, 170, 200, 30, { e: 70, label: 'LIVROS RAROS & HISTÓRIA DA MÁFIA', act: () => G.say('Enciclopédias de arte, economia mundial e códigos de honra da Sicília.', 4) }));
    R.objs.push(O('estante', 430, 170, 200, 30, { e: 70, label: 'ROTAS SECRETAS & DOCUMENTOS', act: () => G.say('Mapas com as rotas marítimas de Porto do Sol e negócios do interior.', 4) }));

    // Mesa de leitura de jacarandá e poltronas Chesterfield
    R.objs.push(O('mesa', 340, 290, 120, 60, {
      e: 20,
      label: 'EXAMINAR MAPA DE TERRITÓRIOS NA MESA',
      act: () => G.say('Mapa aberto com todas as cidades dominadas pela sua família.', 4)
    }));

    R.objs.push(O('sofa', 180, 320, 70, 40, { cor: '#4a2818', label: 'SENTAR NA POLTRONA CHESTERFIELD', act: S => { S.sentado = true; G.say('Você sentou para ler confortavelmente junto à lareira.', 3.5); } }));
    R.objs.push(O('sofa', 520, 320, 70, 40, { cor: '#4a2818', label: 'SENTAR NA POLTRONA CHESTERFIELD', act: S => { S.sentado = true; G.say('Você sentou para ler confortavelmente.', 3.5); } }));

    R.deco = ctx => {
      // Lareira acesa central
      ctx.fillStyle = '#1c1008';
      ctx.fillRect(350, 150, 80, 40);
      const fg = ctx.createRadialGradient(390, 175, 2, 390, 175, 25);
      fg.addColorStop(0, '#ffe570');
      fg.addColorStop(0.5, '#ff8020');
      fg.addColorStop(1, 'rgba(200,30,0,0)');
      ctx.fillStyle = fg;
      ctx.fillRect(360, 160, 60, 30);

      ctx.fillStyle = '#e8c070';
      ctx.font = 'bold 12px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('📚 BIBLIOTECA PARTICULAR & ARQUIVOS SECRETOS DO DON 📚', 370, 95);
      ctx.textAlign = 'left';
    };

    return R;
  }

  // 4. CINEMA PARTICULAR COM TELÃO GIGANTE
  function salaCinema(lg) {
    const R = L.novaSala({
      w: 760,
      h: 440,
      nome: 'MANSÃO — CINEMA PRIVADO',
      cor: '#9c27b0',
      piso: 'carpete',
      pisoCores: ['#1e0c24', '#15081a'],
      parede: '#0c0510'
    });

    R.porta = { para: 'entrada', rotulo: 'HALL NOBRE', px: 730, py: 280 };

    // Fileiras de poltronas de veludo reclináveis (sentar)
    [240, 320, 400].forEach((py, rowIdx) => {
      for (let i = 0; i < 4; i++) {
        const px = 200 + i * 110;
        R.objs.push(O('sofa', px, py, 75, 36, {
          cor: '#8a1c28',
          label: 'SENTAR NA POLTRONA VIP ' + (rowIdx + 1) + '-' + (i + 1),
          act: S => { S.sentado = true; G.say('Você reclinou a poltrona VIP para assistir ao filme no telão gigante.', 4); }
        }));
      }
    });

    // Máquina de pipoca e refrigerante
    R.objs.push(O('balcao', 620, 200, 90, 35, {
      e: 24,
      label: 'PEGAR PIPOCA GOURMET COM MANTEIGA',
      act: S => { S.player.hp = Math.min(100, S.player.hp + 20); G.say('Pipoca quentinha com manteiga de cinema! (+vida)', 3); }
    }));

    R.deco = ctx => {
      // Telão gigante com projeção interativa
      const tg = ctx.createLinearGradient(160, 0, 600, 0);
      tg.addColorStop(0, '#102030');
      tg.addColorStop(0.5, '#4080b0');
      tg.addColorStop(1, '#102030');
      ctx.fillStyle = tg;
      ctx.fillRect(160, 80, 440, 90);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.strokeRect(158, 78, 444, 94);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎬 THE GODFATHER — SESSÃO EXCLUSIVA 4K 🎬', 380, 130);

      // Facho de luz do projetor
      ctx.fillStyle = 'rgba(255,255,220,0.06)';
      ctx.beginPath();
      ctx.moveTo(380, 460);
      ctx.lineTo(160, 80);
      ctx.lineTo(600, 80);
      ctx.closePath();
      ctx.fill();
      ctx.textAlign = 'left';
    };

    return R;
  }

  // 5. COZINHA GOURMET & DONA CARMELA
  function salaCozinha(lg) {
    const R = L.novaSala({
      w: 700,
      h: 400,
      nome: 'MANSÃO — COZINHA GOURMET',
      cor: '#e07a30',
      piso: 'ladrilho',
      pisoCores: ['#e8e4dc', '#ccc6b8'],
      parede: '#423226'
    });

    R.porta = { para: 'entrada', rotulo: 'HALL NOBRE', px: 730, py: 400 };

    // Bancadas de mármore e fogão industrial
    R.objs.push(O('balcao', 180, 190, 360, 44, {
      e: 28,
      top: '#ffffff',
      front: '#8a4020',
      label: 'FALAR COM DONA CARMELA (CARDÁPIO SICILIANO)',
      act: S => menuCarmela(S)
    }));

    // Geladeira industrial cheia
    R.objs.push(O('geladeira', 580, 180, 60, 50, {
      e: 55,
      label: 'ABRIR GELADEIRA GOURMET',
      act: S => { S.player.hp = 100; G.say('Fatias de queijo parmesão legítimo e presunto de Parma! (+vida máxima)', 3.5); }
    }));

    // Mesa de degustação da cozinha
    R.objs.push(O('mesa', 280, 310, 140, 50, { e: 18 }));
    R.objs.push(O('cadeira', 250, 320, 22, 22, { solid: false }));
    R.objs.push(O('cadeira', 430, 320, 22, 22, { solid: false }));

    R.npcs.push({
      x: 360,
      y: 165,
      p: { shirt: '#e84a5f', pants: '#222228', hair: '#ffffff', hairStyle: 'coque', fem: true, dress: true },
      falas: ['Don Guilherme! Fiz o molho de tomate com manjericão fresco da horta!', 'O senhor precisa comer bem para comandar essa cidade.'],
      h: Math.PI,
      fixo: true
    });

    R.deco = ctx => {
      ctx.fillStyle = '#e5b834';
      ctx.font = 'bold 12px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('🍳 COZINHA GOURMET SICILIANA — CHEF DONA CARMELA 🍳', 350, 95);
      ctx.textAlign = 'left';
    };

    return R;
  }

  // 6. ALOJAMENTO DAS FAXINEIRAS & EQUIPE
  function salaFaxineiras(lg) {
    const R = L.novaSala({
      w: 640,
      h: 380,
      nome: 'MANSÃO — ALOJAMENTO DOS FUNCIONÁRIOS',
      cor: '#5c8a6f',
      piso: 'madeira',
      pisoCores: ['#7c5634', '#5c3a20'],
      parede: '#36443c'
    });

    R.porta = { para: 'entrada', rotulo: 'HALL NOBRE', px: 560, py: 190 };

    // Camas confortáveis das funcionárias
    R.objs.push(O('cama', 140, 200, 70, 90, { e: 20, cor: '#4a8a68' }));
    R.objs.push(O('cama', 240, 200, 70, 90, { e: 20, cor: '#4a8a68' }));
    R.objs.push(O('cama', 450, 200, 70, 90, { e: 20, cor: '#4a8a68' }));

    // Armários organizados e produtos de limpeza
    R.objs.push(O('armario', 540, 180, 50, 30, { e: 60 }));

    R.npcs.push({
      x: 340,
      y: 270,
      p: { shirt: '#5cb88f', pants: '#1a1a24', hair: '#3a2412', hairStyle: 'rabo', fem: true },
      falas: ['Don Guilherme! Cuidamos da mansão com o maior carinho do mundo.', 'Depois de cada festa limpamos tudo para deixar brilhando!'],
      h: Math.PI,
      fixo: false
    });

    R.deco = ctx => {
      ctx.fillStyle = '#a8e6cf';
      ctx.font = 'bold 12px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('🧹 ALOJAMENTO DIGNO DA EQUIPE DE SERVIÇO & LIMPEZA 🧹', 320, 95);
      ctx.textAlign = 'left';
    };

    return R;
  }

  // 7. SUÍTE DE HÓSPEDES VIP
  function salaHospedes(lg) {
    const R = L.novaSala({
      w: 660,
      h: 390,
      nome: 'MANSÃO — SUÍTE DE HÓSPEDES VIP',
      cor: '#3a7ab8',
      piso: 'carpete',
      pisoCores: ['#284260', '#1c3048'],
      parede: '#1c2838'
    });

    R.porta = { para: 'entrada', rotulo: 'HALL NOBRE', px: 240, py: 190 };

    // Cama de Casal King e Frigobar
    R.objs.push(O('cama', 200, 210, 100, 100, { e: 22, cor: '#2a5a9c', label: 'DESCANSAR NA SUÍTE DE HÓSPEDES', act: S => { S.player.hp = 100; G.say('Cama de hóspedes macia e relaxante.', 3); } }));
    R.objs.push(O('geladeira', 450, 190, 45, 38, { e: 35, label: 'FRIGOBAR VIP', act: S => { S.player.hp = 100; G.say('Bebidas importadas e chocolates suíços.', 3); } }));
    R.objs.push(O('sofa', 480, 270, 80, 38, { cor: '#1e385c', label: 'SENTAR NA SUÍTE', act: S => { S.sentado = true; } }));

    return R;
  }

  // 8. SUBSOLO SECRETO & SALA DE INTERROGATÓRIO
  function salaInterrogatorio(lg) {
    const R = L.novaSala({
      w: 680,
      h: 400,
      nome: 'MANSÃO — SUBSOLO SECRETO & INTERROGATÓRIO',
      cor: '#d32f2f',
      piso: 'ladrilho',
      pisoCores: ['#262628', '#1a1a1c'],
      parede: '#18181c'
    });

    R.porta = { para: 'entrada', rotulo: 'HALL NOBRE', px: 140, py: 190 };

    // Cadeira de interrogatório central
    R.objs.push(O('cadeira', 340, 260, 26, 26, {
      solid: true,
      label: 'INTERROGAR RIVAL CAPTURADO',
      act: S => {
        if (!M.estado.rivalPreso) {
          G.say('A cadeira está vazia. Use o Telefone Vermelho do escritório para mandar sequestrar um rival.', 4.5);
          return;
        }
        const recompensa = 8000 + Math.floor(Math.random() * 12000);
        S.save.money += recompensa;
        G.save();
        G.snd.cash();
        G.say('INTERROGATÓRIO: O rival entregou a localização de um cofre secreto com $' + recompensa + '!', 5.5);
      }
    }));

    // Mesa de grampos telefônicos e arquivos confidenciais
    R.objs.push(O('mesa', 460, 220, 120, 45, {
      e: 20,
      label: 'GRAVADOR DE ESCUTAS & ARQUIVOS',
      act: () => G.say('Gravações secretas revelando as movimentações dos rivais e da polícia.', 4)
    }));

    // Capangas de guarda no subsolo
    R.npcs.push({ x: 280, y: 260, p: { shirt: '#111114', pants: '#111114', acc: 'shades', hairStyle: 'raspado' }, falas: ['Ele vai falar tudo o que sabe, Don.', 'Ninguém sai daqui sem sua autorização.'], h: 0.3, fixo: true });
    R.npcs.push({ x: 400, y: 260, p: { shirt: '#111114', pants: '#111114', acc: 'shades', hairStyle: 'raspado' }, falas: ['Pergunte o que quiser, Don Guilherme.'], h: -0.3, fixo: true });

    R.deco = ctx => {
      // Foco de luz fria suspensa sobre a cadeira central
      const lg = ctx.createRadialGradient(353, 273, 2, 353, 273, 75);
      lg.addColorStop(0, 'rgba(230,240,255,0.7)');
      lg.addColorStop(0.6, 'rgba(180,200,230,0.15)');
      lg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(270, 190, 166, 166);

      ctx.fillStyle = '#e53935';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔒 ÁREA RESTRITA — SALA DE INTERROGATÓRIO & COFRE DE PROVAS 🔒', 340, 95);
      ctx.textAlign = 'left';
    };

    return R;
  }

  // 9. CORREDOR NOBRE SUPERIOR (ANDAR SUPERIOR - ÁREA PRIVATIVA)
  function salaCorredorSuperior(lg) {
    const R = L.novaSala({
      w: 800,
      h: 400,
      nome: 'MANSÃO — CORREDOR PRIVATIVO SUPERIOR',
      cor: '#e5b834',
      piso: 'marmore',
      pisoCores: ['#f8f6f0', '#ded8cb'],
      parede: '#2c2030'
    });

    R.objs.push(O('porta', 400, 360, 60, 20, { solid: false, k: 10, r: 50, label: 'DESCER PARA O HALL NOBRE (TÉRREO)', placa: 'DESCER PARA O HALL NOBRE', para: 'entrada', rotulo: 'DESCER PARA O HALL NOBRE (TÉRREO)', px: 400, py: 190, act: S => L.irSala(S, 'entrada', 400, 190) }));
    R.objs.push(O('porta', 160, 160, 50, 20, { solid: false, k: 10, r: 50, label: 'ENTRAR: MEGA ESCRITÓRIO DO CHEFÃO', placa: 'MEGA ESCRITÓRIO DO CHEFÃO', para: 'escritorio', rotulo: 'MEGA ESCRITÓRIO DO CHEFÃO', px: 400, py: 420, act: S => L.irSala(S, 'escritorio', 400, 420) }));
    R.objs.push(O('porta', 640, 160, 50, 20, { solid: false, k: 10, r: 50, label: 'ENTRAR: SUÍTE MASTER DO DON', placa: 'SUÍTE MASTER DO DON', para: 'quarto_master', rotulo: 'SUÍTE MASTER DO DON', px: 400, py: 440, act: S => L.irSala(S, 'quarto_master', 400, 440) }));
    R.objs.push(O('porta', 400, 160, 50, 20, { solid: false, k: 10, r: 50, label: 'ENTRAR: VARANDA PANORÂMICA', placa: 'VARANDA PANORÂMICA', para: 'varanda', rotulo: 'VARANDA PANORÂMICA', px: 400, py: 360, act: S => L.irSala(S, 'varanda', 400, 360) }));

    // Guardas de elite nas portas
    R.npcs.push({ x: 230, y: 190, p: { shirt: '#141416', pants: '#141416', acc: 'shades', hairStyle: 'curto' }, falas: ['Acesso ao escritório 100% protegido, Don.'], h: Math.PI, fixo: true });
    R.npcs.push({ x: 570, y: 190, p: { shirt: '#141416', pants: '#141416', acc: 'shades', hairStyle: 'curto' }, falas: ['Suíte Master limpa e pronta para o senhor descansar.'], h: Math.PI, fixo: true });

    R.deco = ctx => {
      ctx.fillStyle = '#8b141a';
      ctx.fillRect(100, 230, 600, 60); // Passadeira de veludo nobre
      ctx.fillStyle = '#e5b834';
      ctx.font = 'bold 12px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('⚜️ ÁREA PRIVATIVA EXCLUSIVA DO DON — ACESSO RESTRITO ⚜️', 400, 100);
      ctx.textAlign = 'left';
    };

    return R;
  }

  // 10. MEGA ESCRITÓRIO DO PODEROSO CHEFÃO
  function salaEscritorio(lg) {
    const R = L.novaSala({
      w: 800,
      h: 460,
      nome: 'MANSÃO — MEGA ESCRITÓRIO DO CHEFÃO',
      cor: '#e5b834',
      piso: 'madeira',
      pisoCores: ['#442614', '#2e180a'],
      parede: '#241a28'
    });

    R.porta = { para: 'corredor_superior', rotulo: 'CORREDOR SUPERIOR', px: 160, py: 200 };

    // Mesa executiva monumental com computador e telefone vermelho
    R.objs.push(O('mesa', 340, 230, 140, 65, {
      e: 24,
      label: 'SENTAR NA POLTRONA PRESIDENCIAL',
      act: S => { S.sentado = true; G.say('Você sentou na poltrona presidencial de couro do escritório.', 3.5); }
    }));

    R.objs.push(O('computador', 360, 220, 40, 25, {
      e: 30,
      label: 'ACESSAR COMPUTADOR EXECUTIVO (DARK WEB)',
      act: S => M.menuComputador(S)
    }));

    R.objs.push(O('balcao', 430, 225, 30, 20, {
      e: 26,
      top: '#d32f2f',
      front: '#8b141a',
      label: 'PEGAR TELEFONE VERMELHO (ORDENS DA MÁFIA)',
      act: S => M.menuTelefone(S)
    }));

    // Cofre embutido na parede
    R.objs.push(O('armario', 620, 180, 60, 35, {
      e: 60,
      label: 'COFRE BLINDADO DO DON',
      act: S => G.say('Cofre blindado com barras de ouro, títulos ao portador e diamantes.', 4)
    }));

    // Sofás de reunião executiva
    R.objs.push(O('sofa', 180, 320, 90, 40, { cor: '#1e2432', label: 'SENTAR NO SOFÁ DE REUNIÃO', act: S => { S.sentado = true; } }));
    R.objs.push(O('sofa', 530, 320, 90, 40, { cor: '#1e2432', label: 'SENTAR NO SOFÁ DE REUNIÃO', act: S => { S.sentado = true; } }));

    // Guarda-costas pessoal dentro do escritório
    R.npcs.push({ x: 260, y: 220, p: { shirt: '#111116', pants: '#111116', acc: 'shades', hairStyle: 'curto' }, falas: ['Ordens recebidas, Don!', 'Nenhum relatório escapa do nosso controle.'], h: 0.5, fixo: true });

    R.deco = ctx => {
      // Quadros com iluminação LED embutida
      ctx.fillStyle = 'rgba(255,230,140,0.15)';
      ctx.fillRect(180, 80, 100, 50);
      ctx.fillRect(520, 80, 100, 50);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.strokeRect(178, 78, 104, 54);
      ctx.strokeRect(518, 78, 104, 54);

      ctx.fillStyle = '#e5b834';
      ctx.font = 'bold 13px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('🏛️ GABINETE EXECUTIVO DO PODEROSO CHEFÃO — COMANDO GERAL 🏛️', 400, 95);
      ctx.textAlign = 'left';
    };

    return R;
  }

  // 11. SUÍTE MASTER DO CHEFÃO
  function salaQuartoMaster(lg) {
    const R = L.novaSala({
      w: 800,
      h: 480,
      nome: 'MANSÃO — SUÍTE MASTER DO DON',
      cor: '#e5b834',
      piso: 'carpete',
      pisoCores: ['#44121a', '#300810'],
      parede: '#281a24'
    });

    R.objs.push(O('porta', 400, 440, 60, 20, { solid: false, k: 10, r: 50, label: 'ENTRAR: CORREDOR SUPERIOR', placa: 'CORREDOR SUPERIOR', para: 'corredor_superior', rotulo: 'CORREDOR SUPERIOR', px: 640, py: 200, act: S => L.irSala(S, 'corredor_superior', 640, 200) }));
    R.objs.push(O('porta', 120, 260, 20, 50, { solid: false, k: 10, r: 50, label: 'ENTRAR: CLOSET & QUARTO DE JOIAS', placa: 'CLOSET & QUARTO DE JOIAS', para: 'closet', rotulo: 'CLOSET & QUARTO DE JOIAS', px: 500, py: 360, act: S => L.irSala(S, 'closet', 500, 360) }));
    R.objs.push(O('porta', 740, 260, 20, 50, { solid: false, k: 10, r: 50, label: 'ENTRAR: BANHEIRO MASTER & JACUZZI SPA', placa: 'BANHEIRO MASTER & JACUZZI SPA', para: 'banheiro_master', rotulo: 'BANHEIRO MASTER & JACUZZI SPA', px: 140, py: 360, act: S => L.irSala(S, 'banheiro_master', 140, 360) }));
    R.objs.push(O('porta', 400, 160, 60, 20, { solid: false, k: 10, r: 50, label: 'ENTRAR: VARANDA PANORÂMICA', placa: 'VARANDA PANORÂMICA', para: 'varanda', rotulo: 'VARANDA PANORÂMICA', px: 400, py: 360, act: S => L.irSala(S, 'varanda', 400, 360) }));

    // Cama King Size Monumental (Deitar / Dormir)
    R.objs.push(O('cama', 340, 200, 140, 120, {
      e: 28,
      cor: '#8b141a',
      label: 'DEITAR / DORMIR NA CAMA KING SIZE',
      act: S => menuCamaMaster(S)
    }));

    // Telefone vermelho de cabeceira
    R.objs.push(O('balcao', 495, 220, 24, 20, {
      e: 24,
      top: '#d32f2f',
      front: '#8b141a',
      label: 'PEGAR TELEFONE DA CABECEIRA',
      act: S => M.menuTelefone(S)
    }));

    // Sofás de veludo nobre
    R.objs.push(O('sofa', 200, 360, 100, 42, { cor: '#7a1218', label: 'SENTAR NO SOFÁ DO QUARTO', act: S => { S.sentado = true; G.say('Você sentou para relaxar na sua suíte.', 3); } }));
    R.objs.push(O('sofa', 520, 360, 100, 42, { cor: '#7a1218', label: 'SENTAR NO SOFÁ DO QUARTO', act: S => { S.sentado = true; G.say('Você sentou para relaxar na sua suíte.', 3); } }));

    R.deco = ctx => {
      ctx.fillStyle = '#e5b834';
      ctx.font = 'bold 13px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('👑 SUÍTE MASTER DO PODEROSO CHEFÃO — APOSENTOS REAIS 👑', 400, 95);
      ctx.textAlign = 'left';
    };

    return R;
  }

  // 12. CLOSET & QUARTO DE JOIAS E ROUPAS
  function salaCloset(lg) {
    const R = L.novaSala({
      w: 680,
      h: 400,
      nome: 'MANSÃO — CLOSET DE LUXO & JOIAS',
      cor: '#e5b834',
      piso: 'madeira',
      pisoCores: ['#523620', '#3a2414'],
      parede: '#281c20'
    });

    R.porta = { para: 'quarto_master', rotulo: 'SUÍTE MASTER', px: 160, py: 280 };

    // Mesa de vidro central com vitrine iluminada de relógios Rolex e joias
    R.objs.push(O('mesa', 280, 240, 130, 60, {
      e: 22,
      top: '#eef8ff',
      front: '#d4af37',
      label: 'VITRINE DE VIDRO: RELÓGIOS ROLEX & JOIAS',
      act: () => G.say('Coleção de relógios Rolex Daytona em ouro maciço, anéis de diamante e correntes sicilianas.', 4.5)
    }));

    // Araras de ternos com trocador rápido
    M.TRAJES.forEach((tr, i) => {
      const px = 140 + i * 95;
      R.objs.push(O('armario', px, 170, 75, 35, {
        e: 55,
        label: 'VESTIR: ' + tr.nome,
        act: S => M.vestirTraje(S, i)
      }));
    });

    R.deco = ctx => {
      // Brilho dos LEDs da vitrine de vidro
      const vg = ctx.createRadialGradient(345, 270, 5, 345, 270, 80);
      vg.addColorStop(0, 'rgba(255,240,160,0.6)');
      vg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = vg;
      ctx.fillRect(260, 210, 170, 120);

      ctx.fillStyle = '#e5b834';
      ctx.font = 'bold 12px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('💎 CLOSET DE ALFAIATARIA SICILIANA & VITRINE DE JOIAS 💎', 340, 95);
      ctx.textAlign = 'left';
    };

    return R;
  }

  // 13. BANHEIRO MASTER & JACUZZI SPA
  function salaBanheiroMaster(lg) {
    const R = L.novaSala({
      w: 680,
      h: 400,
      nome: 'MANSÃO — BANHEIRO MASTER & JACUZZI SPA',
      cor: '#42a5f5',
      piso: 'marmore',
      pisoCores: ['#ffffff', '#e0e6ed'],
      parede: '#203244'
    });

    R.porta = { para: 'quarto_master', rotulo: 'SUÍTE MASTER', px: 710, py: 280 };

    // Jacuzzi / Piscina aquecida interna fumegante
    R.objs.push(O('piscina', 260, 210, 180, 120, {
      label: 'ENTRAR NA JACUZZI AQUECIDA & RELAXAR',
      act: S => {
        S.player.hp = 100;
        G.say('Água quente revigorante da Jacuzzi! Vida 100% restaurada.', 4);
        G.snd.door();
      }
    }));

    // Bancada de mármore e espelho de corpo inteiro
    R.objs.push(O('balcao', 500, 190, 120, 36, { e: 28, top: '#ffffff', front: '#2a4055', label: 'BANCADA DE MÁRMORE' }));

    R.deco = ctx => {
      // Vapores da Jacuzzi
      ctx.fillStyle = 'rgba(200,235,255,0.2)';
      ctx.beginPath();
      ctx.arc(350, 270, 90, 0, TAU);
      ctx.fill();

      ctx.fillStyle = '#42a5f5';
      ctx.font = 'bold 12px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('🛁 BANHEIRO MASTER DE MÁRMORE CARRARA & JACUZZI SPA 🛁', 340, 95);
      ctx.textAlign = 'left';
    };

    return R;
  }

  // 14. VARANDA PANORÂMICA DO DON
  function salaVaranda(lg) {
    const R = L.novaSala({
      w: 800,
      h: 380,
      nome: 'MANSÃO — VARANDA PANORÂMICA',
      cor: '#e5b834',
      piso: 'marmore',
      pisoCores: ['#f4efe4', '#dcd4c4'],
      parede: '#1c1622'
    });

    R.porta = { para: 'quarto_master', rotulo: 'SUÍTE MASTER', px: 400, py: 200 };

    // Espreguiçadeiras com vista panorâmica
    for (let i = 0; i < 4; i++) {
      const px = 180 + i * 130;
      R.objs.push(O('sofa', px, 240, 80, 40, {
        cor: '#2a5a9c',
        label: 'SENTAR NA ESPREGUIÇADEIRA DA VARANDA',
        act: S => { S.sentado = true; G.say('Apreciando a vista panorâmica de toda a sua propriedade.', 3.5); }
      }));
    }

    R.deco = ctx => {
      // Guarda-corpo de mármore e vista aérea
      ctx.fillStyle = '#2e5d32';
      ctx.fillRect(80, 80, 640, 60); // Vista dos campos e árvores ao fundo

      ctx.fillStyle = '#e5b834';
      ctx.font = 'bold 13px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('🌄 VARANDA PANORÂMICA — A MELHOR VISTA DA PROPRIEDADE 🌄', 400, 95);
      ctx.textAlign = 'left';
    };

    return R;
  }

  // ---------- DESENHO NO MUNDO EXTERNO (L.extrasDesenho) ----------
  L.extrasDesenho.push((ctx, S, inV) => {
    if (!S || S.mode === 'title') return;

    const isNight = G.darkness ? G.darkness() > 0.25 : false;
    const time = S.time || 0;

    // 1. LEDs Noturnos da Piscina (efeito dinâmico de iluminação subaquática)
    if (inV(P_PISCINA) && isNight) {
      ctx.save();
      ctx.translate(P_PISCINA.x, P_PISCINA.y);
      const ledHue = Math.floor((time * 40) % 360);
      for (let lx = -70; lx <= 70; lx += 35) {
        [-45, 45].forEach(ly => {
          const gr = ctx.createRadialGradient(lx, ly, 1, lx, ly, 25);
          gr.addColorStop(0, 'hsla(' + ledHue + ', 100%, 75%, 0.8)');
          gr.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = gr;
          ctx.beginPath();
          ctx.arc(lx, ly, 25, 0, TAU);
          ctx.fill();
        });
      }
      ctx.restore();
    }

    // 2. Desenho dos Seguranças da Máfia com modelo completo
    GUARDAS_POS.forEach((g, idx) => {
      if (!g.ped) {
        g.ped = {
          x: g.x, y: g.y, h: g.h,
          skin: ['#f1c9a0', '#d9a06e', '#a86d42', '#7a4b2a'][idx % 4],
          hair: ['#111', '#2c1a0e', '#1a1a1a'][idx % 3],
          hairStyle: 'curto',
          shirt: '#121316', pants: '#121316', shoe: '#0a0a0c',
          acc: 'shades', weapon: g.arma || 'pistol',
          walk: 0, state: 'walk', hp: 200, noRing: true
        };
      }
      if (!inV(g)) return;
      g.ped.x = g.x; g.ped.y = g.y; g.ped.h = g.h;
      SP.drawPed(ctx, g.ped, time);

      // Arma segurada
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.h);
      ctx.fillStyle = '#263238';
      if (g.arma === 'smg') {
        ctx.fillRect(4, -13, 3.2, 12);
        ctx.fillStyle = '#546e7a'; ctx.fillRect(4.5, -9, 2.2, 6);
      } else if (g.arma === 'shotgun') {
        ctx.fillRect(4, -18, 3.5, 17);
        ctx.fillStyle = '#8d6e63'; ctx.fillRect(3.5, -6, 4.5, 6);
      } else if (g.arma === 'sniper') {
        ctx.fillRect(4, -22, 3.2, 21);
        ctx.fillStyle = '#37474f'; ctx.fillRect(3.5, -12, 4.2, 8);
      } else {
        ctx.fillRect(4, -10, 2.6, 7.5);
      }
      ctx.restore();
    });

    // 4. Desenho dos Cães de Guarda (Rottweilers / Dobermans)
    CAES_POS.forEach(dog => {
      if (!inV(dog)) return;
      ctx.save();
      ctx.translate(dog.x, dog.y);
      ctx.rotate(dog.ang + Math.PI / 2);
      // Sombra
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(2, 3, 7, 12, 0, 0, TAU); ctx.fill();
      // Corpo do Rottweiler
      ctx.fillStyle = '#1c1613';
      ctx.beginPath(); ctx.ellipse(0, 0, 5.5, 11, 0, 0, TAU); ctx.fill();
      // Peito e patas marrom canela
      ctx.fillStyle = '#9c5525';
      ctx.beginPath(); ctx.arc(-3.5, 5.5, 2.2, 0, TAU); ctx.arc(3.5, 5.5, 2.2, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(-3.5, -5.5, 2, 0, TAU); ctx.arc(3.5, -5.5, 2, 0, TAU); ctx.fill();
      // Cabeça e focinho
      ctx.fillStyle = '#1c1613';
      ctx.beginPath(); ctx.ellipse(0, -9.5, 4.5, 4.8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#9c5525';
      ctx.fillRect(-2, -14.5, 4, 3.5);
      // Coleira vermelha de couro com pingente ouro
      ctx.fillStyle = '#d32f2f';
      ctx.fillRect(-4.5, -6, 9, 2);
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath(); ctx.arc(0, -4.5, 1.2, 0, TAU); ctx.fill();
      // Rabo animado
      ctx.strokeStyle = '#1c1613'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, 9.5); ctx.lineTo(Math.sin(time * 7) * 3, 15); ctx.stroke();
      ctx.restore();
    });
  });

  // ---------- INTERAÇÕES NO MUNDO EXTERNO (L.extrasAcao) ----------
  L.extrasAcao.push((S, P) => {
    if (!S || S.mode !== 'play' || P.car || P.hp <= 0) return null;

    // 1. Interagir com a Limusine / Chauffeur Vincenzo
    const dLimo = Math.hypot(P_LIMO.x - P.x, P_LIMO.y - P.y);
    if (dLimo < 45) {
      return {
        t: 'mansao_limo',
        s: 'E: FALAR COM VINCENZO (CHAUFFEUR DA LIMUSINE)',
        run: () => menuChauffeur(S)
      };
    }

    // 2. Interagir com os Seguranças da Máfia
    for (const g of GUARDAS_POS) {
      if (Math.hypot(g.x - P.x, g.y - P.y) < 32) {
        return {
          t: 'guarda_mafia',
          s: 'E: OUVIR SEGURANÇA DA MÁFIA',
          run: () => {
            const fala = pick(FALAS_GUARDAS);
            G.say('Segurança: "' + fala + '"', 4);
          }
        };
      }
    }

    // 3. Interagir com os Cães de Guarda
    for (const dog of CAES_POS) {
      if (Math.hypot(dog.x - P.x, dog.y - P.y) < 30) {
        return {
          t: 'cao_guarda',
          s: 'E: ACARICIAR ' + dog.nome + ' (CÃO DE GUARDA)',
          run: () => {
            G.say(dog.nome + ' abana o rabo com lealdade e lambe sua mão!', 3.5);
            G.snd.bonk();
          }
        };
      }
    }

    // 4. Interagir com o Carrinho de Golfe
    if (Math.hypot(P_GOLF.x - P.x, P_GOLF.y - P.y) < 40) {
      return {
        t: 'carrinho_golf',
        s: 'E: DIRIGIR CARRINHO DE GOLFE NO GRAMADO',
        run: () => {
          if (golfCartObj) {
            P.x = golfCartObj.x;
            P.y = golfCartObj.y;
            golfCartObj.driver = 'player';
            P.car = golfCartObj;
            G.say('Você assumiu o volante do Carrinho de Golfe da mansão!', 3);
          }
        }
      };
    }

    // 5. Interagir com a Grande Piscina Olímpica
    if (Math.hypot(P_PISCINA.x - P.x, P_PISCINA.y - P.y) < 55) {
      return {
        t: 'piscina_externa',
        s: 'E: NADAR NA PISCINA OLÍMPICA ILUMINADA (+VIDA)',
        run: () => {
          P.hp = 100;
          G.say('Você deu um mergulho relaxante na piscina de água cristalina. Vida 100%!', 4);
          G.snd.door();
        }
      };
    }

    return null;
  });

  // ---------- ATUALIZAÇÃO CONTÍNUA (L.extrasAtualizar) ----------
  L.extrasAtualizar.push((S, dt) => {
    if (!S || S.mode === 'title') return;
    garanteVeiculos(S);

    // Movimentação dos cães de guarda em patrulha circular
    CAES_POS.forEach((dog, idx) => {
      dog.ang += dt * 0.4;
      const base = idx < 2 ? P_PORTAO : idx < 4 ? P_FONTE : P_GOLFE_CAMPO;
      dog.x = base.x + Math.cos(dog.ang) * dog.r;
      dog.y = base.y + Math.sin(dog.ang) * dog.r;
    });

    // Se houver policiais perto da mansão com o jogador tendo Heat, os seguranças atiram neles!
    if (S.heat > 0 && S.peds) {
      const cops = S.peds.filter(p => p.kind === 'cop' && p.state !== 'dead' && Math.hypot(p.x - estate.cx, p.y - estate.cy) < 450);
      cops.forEach(cop => {
        // Encontra o guarda mais próximo
        const g = GUARDAS_POS.find(guard => Math.hypot(guard.x - cop.x, guard.y - cop.y) < 220);
        if (g) {
          G.combat.hurtPed(S, cop, 100, g.x, g.y, 250, 'traffic');
          G.say('SEGURANÇAS DA MÁFIA: "Intruso eliminado! O Don está protegido."', 3);
        }
      });
    }

    // Final da Festa VIP
    if (M.estado.festaAtiva && S.time >= M.estado.festaAte) {
      M.estado.festaAtiva = false;
      G.say('A festa terminou! Os convidados foram embora e a equipe de faxineiras limpou toda a mansão.', 6);
    }
  });

  // ---------- SPAWN INICIAL E RENASCIMENTO NO PORTÃO DA MANSÃO ----------
  L.extrasAtualizar.push((S, dt) => {
    if (!S || S.mode === 'title' || S._mansaoSpawnFeito || !S.player) return;
    S._mansaoSpawnFeito = true;
    if (S.save && S.save.spawnMansao !== false) {
      // Força o spawn inicial direto no portão monumental da Mansão
      S.player.x = P_PORTAO.x;
      S.player.y = P_PORTAO.y - 15;
      S.player.h = 0; // virado para o norte (olhando para a alameda da mansão)
      S.cam.x = S.player.x;
      S.cam.y = S.player.y;
      G.say('👑 BEM-VINDO AO PORTÃO DA SUA MANSÃO, DON GUILHERME!', 7);
    }
  });

  // Intercepta G.respawn para renascimento VIP do Don no Portão da Mansão
  const origRespawn = G.respawn;
  G.respawn = function (where, loss) {
    const S = G.S;
    if (S && S.save && S.save.spawnMansao !== false) {
      const P = S.player;
      P.hp = 100;
      P.armor = 100;
      P.car = null;
      P.x = P_PORTAO.x;
      P.y = P_PORTAO.y - 15;
      P.vx = P.vy = 0;
      P.iframes = 3;
      S.lastHp = 100;
      S.heat = 0;
      S.heatLevel = 0;
      S.heli = null;
      S.bustT = 0;
      S.cam.x = P.x;
      S.cam.y = P.y;
      S.mode = 'play';
      if (S.cars) {
        S.cars = S.cars.filter(c => !(c.kind === 'police' && (c.mode === 'chase' || c.mode === 'block' || c.mode === 'leave')));
      }
      garanteVeiculos(S);
      G.say('🏰 RESGATE DA MÁFIA! Dr. Salvatore e a escolta pessoal trouxeram o Don são e salvo para a Mansão!', 6);
      G.save();
      return;
    }
    if (origRespawn) origRespawn(where, loss);
  };

})(window.G = window.G || {});
