/* =====================================================================
   ENRIQUECE.JS — enche de detalhes as salas que ainda estavam vazias ("só quadrado"):
   farmácia, barbearia, shopping, banco, padaria, pizzaria, delegacia, prefeitura e saguão do hotel.
   Não refaz as salas: usa o gancho L.enriquecer (lugares.js), que roda logo depois da sala ser criada
   e deixa tudo o que já funcionava (compras, menus, assaltos) no lugar.
   Chave: 'idDoLugar:sala'  ou  'tipo:tipoDoLugar:sala'.
   ===================================================================== */
(function (G) {
  'use strict';
  const L = G.lugares, K = L.kit, SP = G.sprites, D = G.deco;
  const O = K.O, rand = K.rand, pick = K.pick, TAU = Math.PI * 2, rr = D.rr;
  const E = L.enriquecer;
  const look = o => Object.assign(SP.randomLook(), { acc: 'none' }, o);
  const add = (R, ...a) => R.objs.push(...a);
  const gente = (R, x, y, p, falas, nome, o) => { const n = Object.assign({ x, y, p: look(p || {}), falas, h: 0, nome, dinheiro: Math.round(rand(10, 80)), label: 'CONVERSAR' }, o || {}); R.npcs.push(n); return n; };
  const decoMais = (R, fn) => { const d0 = R.deco; R.deco = x => { if (d0) d0(x); fn(x); }; };
  const pisoMais = (R, fn) => { const p0 = R.pisoExtra; R.pisoExtra = x => { if (p0) p0(x); fn(x); }; };
  const achaNpc = (R, nome) => R.npcs.find(n => n.nome === nome);
  // quem fica atrás do balcão aparece por cima da borda de trás dele
  const atrasDoBalcao = (n, y) => { if (n) { n.y = y; n.k = 600; } };
  // gente que passeia sozinha dentro da área [x0, y0, x1, y1]
  function vaivem(R, lista, area) {
    R.vaivem = (R.vaivem || []).concat(lista); R.areaVaivem = area;
    if (R.vaivemOn) return; R.vaivemOn = true;
    const f0 = R.onUpdate;
    R.onUpdate = (S, R2, dt) => {
      if (f0) f0(S, R2, dt);
      R2.tvv = (R2.tvv || 0) - dt; if (R2.tvv > 0) return; R2.tvv = rand(3, 6);
      const n = pick(R2.vaivem), a = R2.areaVaivem; if (!n || n.alvo || (n.rota && n.rota.length)) return;
      L.rota(n, [{ x: rand(a[0], a[2]), y: rand(a[1], a[3]) }, { x: rand(a[0], a[2]), y: rand(a[1], a[3]) }]);
    };
  }
  const bebe = (x, y) => O('bebedouro', x, y, 36, 36, { e: 62, label: 'BEBER ÁGUA', r: 40, act: S => { K.cura(S, 2); G.snd.beep(); G.say('Água geladinha. (+2 vida)', 2.5); } });
  const espera = (x, y, w) => O('banco_espera', x, y, w || 150, 26, { e: 16, label: 'SENTAR NA ESPERA', r: 30, act: S => { K.cura(S, 4); G.say('Você esperou sentado um pouco. (+4 vida)', 3); } });

  // mural de avisos com papeizinhos
  function mural(x, px, py, w, h) {
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(px + 3, py + 3, w, h); x.fillStyle = '#9a7040'; x.fillRect(px - 3, py - 3, w + 6, h + 6); x.fillStyle = '#c8a878'; x.fillRect(px, py, w, h);
    const cs = ['#ffffff', '#ffe9a0', '#bfe3ff', '#ffd0d0', '#d8f2c8'];
    for (let i = 0; i < 6; i++) { const ax = px + 4 + (i % 3) * (w - 8) / 3, ay = py + 4 + ((i / 3) | 0) * (h - 8) / 2; x.fillStyle = cs[i % 5]; x.fillRect(ax, ay, (w - 14) / 3, (h - 12) / 2); x.fillStyle = 'rgba(0,0,0,0.35)'; for (let k = 0; k < 3; k++) x.fillRect(ax + 2, ay + 3 + k * 4, (w - 14) / 3 - 4, 1); x.fillStyle = '#d93636'; x.fillRect(ax + (w - 14) / 6 - 1, ay - 1, 2, 3); }
  }
  // brasão da cidade (escudo com estrela e ramos)
  function brasao(x, cx, cy, s) {
    x.fillStyle = 'rgba(0,0,0,0.3)'; x.beginPath(); x.moveTo(cx - s / 2 + 2, cy - s / 2 + 3); x.lineTo(cx + s / 2 + 2, cy - s / 2 + 3); x.lineTo(cx + s / 2 + 2, cy + s * 0.1 + 3); x.quadraticCurveTo(cx + 2, cy + s * 0.62 + 3, cx - s / 2 + 2, cy + s * 0.1 + 3); x.closePath(); x.fill();
    x.fillStyle = '#c8a24a'; x.beginPath(); x.moveTo(cx - s / 2 - 2, cy - s / 2 - 2); x.lineTo(cx + s / 2 + 2, cy - s / 2 - 2); x.lineTo(cx + s / 2 + 2, cy + s * 0.1); x.quadraticCurveTo(cx, cy + s * 0.68, cx - s / 2 - 2, cy + s * 0.1); x.closePath(); x.fill();
    x.fillStyle = '#1f6a3a'; x.beginPath(); x.moveTo(cx - s / 2, cy - s / 2); x.lineTo(cx + s / 2, cy - s / 2); x.lineTo(cx + s / 2, cy + s * 0.08); x.quadraticCurveTo(cx, cy + s * 0.62, cx - s / 2, cy + s * 0.08); x.closePath(); x.fill();
    x.fillStyle = '#f2d21a'; x.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? s * 0.11 : s * 0.26; x.lineTo(cx + Math.cos(a) * rad, cy - s * 0.06 + Math.sin(a) * rad); } x.closePath(); x.fill();
    x.strokeStyle = '#f4efe0'; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy + s * 0.02, s * 0.42, Math.PI * 0.15, Math.PI * 0.85); x.stroke();
  }
  // vitrine de loja na parede do shopping: toldo listrado, vidro, mercadoria e letreiro
  function fachada(x, px, py, w, nome, cor, vidro, tipo) {
    x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(px + 3, py + 4, w, 40);
    x.fillStyle = vidro; x.fillRect(px, py + 12, w, 30);
    const g = x.createLinearGradient(px, py + 12, px, py + 42); g.addColorStop(0, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0.25)'); x.fillStyle = g; x.fillRect(px, py + 12, w, 30);
    for (let i = 0; i < 5; i++) {      // mercadoria de cada tipo na vitrine
      const ix = px + 12 + i * (w - 24) / 4;
      if (tipo === 'cinema') { x.fillStyle = ['#e8402a', '#f2c82a', '#2a8ad8', '#e84a8a', '#2fb86a'][i]; x.fillRect(ix - 7, py + 18, 14, 20); x.fillStyle = 'rgba(255,255,255,0.7)'; x.fillRect(ix - 5, py + 20, 10, 5); }
      else if (tipo === 'perfume') { x.fillStyle = ['#f8c8e0', '#c8e0f8', '#f8e8a8', '#e0c8f8', '#f8c8c8'][i]; x.beginPath(); x.moveTo(ix - 5, py + 38); x.lineTo(ix + 5, py + 38); x.lineTo(ix + 4, py + 26); x.lineTo(ix - 4, py + 26); x.closePath(); x.fill(); x.fillStyle = '#c8a24a'; x.fillRect(ix - 2, py + 22, 4, 4); }
      else if (tipo === 'otica') { x.strokeStyle = ['#16181e', '#8a4a1a', '#c8302a', '#2a58b8', '#c8a24a'][i]; x.lineWidth = 1.6; x.beginPath(); x.arc(ix - 4, py + 30, 3.4, 0, TAU); x.arc(ix + 4, py + 30, 3.4, 0, TAU); x.stroke(); }
      else if (tipo === 'games') { x.fillStyle = '#16181e'; x.fillRect(ix - 8, py + 24, 16, 11); x.fillStyle = ['#e8402a', '#2a8ad8', '#2fb86a', '#f2c82a', '#e84a8a'][i]; x.fillRect(ix - 6, py + 26, 12, 6); x.fillStyle = '#f2f2f2'; x.fillRect(ix - 2, py + 36, 4, 2); }
      else { x.fillStyle = '#f2e08a'; x.beginPath(); x.arc(ix, py + 30, 4.6, 0, TAU); x.fill(); x.strokeStyle = '#c8a24a'; x.lineWidth = 1.4; x.stroke(); x.fillStyle = ['#e84a8a', '#2a8ad8', '#2fb86a', '#f2f2f2', '#d9363e'][i]; x.fillRect(ix - 1.4, py + 24, 2.8, 2.8); }
    }
    for (let i = 0; i < w / 10; i++) { x.fillStyle = i % 2 ? '#f6f6f2' : cor; x.fillRect(px + i * 10, py, 10, 12); }    // toldo
    x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(px, py + 11, w, 2); x.fillStyle = 'rgba(255,255,255,0.4)'; x.fillRect(px, py, w, 1.5);
    x.fillStyle = 'rgba(10,10,14,0.88)'; rr(x, px + w / 2 - 34, py + 2, 68, 9, 2); x.fill(); x.fillStyle = '#ffe9a0'; x.font = 'bold 7px Arial'; x.textAlign = 'center'; x.fillText(nome, px + w / 2, py + 9.4); x.textAlign = 'left';
  }

  // =====================================================================
  //  FARMÁCIA
  // =====================================================================
  E['farmacia:entrada'] = (R, pl) => {
    atrasDoBalcao(R.npcs[0], 178);
    add(R,
      O('prateleira', 100, 292, 150, 36, { e: 52, tema: 'remedios', nome: 'REMÉDIOS', front: '#e8f2f0' }),
      O('prateleira', 100, 362, 150, 36, { e: 52, tema: 'higiene', nome: 'HIGIENE', front: '#dfeaf2' }),
      O('prateleira', 530, 292, 170, 36, { e: 52, tema: 'cosmeticos', nome: 'BELEZA', front: '#f2dfe8' }),
      O('prateleira', 530, 362, 170, 36, { e: 52, tema: 'remedios', nome: 'GENÉRICOS', front: '#e8f2f0' }),
      espera(540, 484, 100), bebe(250, 470));
    const a = gente(R, 400, 340, { shirt: '#c8402a', sleeve: 'curta' }, ['Estou procurando dipirona...', 'Essa farmácia tem de tudo mesmo.'], 'Cliente');
    const b = gente(R, 470, 430, { fem: true, shirt: '#8a4a8a', sleeve: 'curta', hairStyle: 'longo' }, ['Só vim pegar a receita.', 'O preço do protetor solar tá um absurdo.'], 'Cliente');
    vaivem(R, [a, b], [300, 270, 500, 500]);
    decoMais(R, x => {
      D.cartazLoja(x, 100, 80, 50, 58, '#e8f4ff', ['DOE', 'SANGUE'], '#d9363e');
      D.cartazLoja(x, 540, 80, 52, 58, '#ffe9a0', ['GENÉRICOS', '-50%'], '#d9363e');
      D.relogio(x, 668, 112, 9, '#f6fafc');
    });
    pisoMais(R, x => {     // cruz verde no piso
      x.fillStyle = 'rgba(47,154,74,0.16)'; x.fillRect(370, 392, 60, 18); x.fillRect(391, 371, 18, 60);
      x.strokeStyle = 'rgba(47,154,74,0.28)'; x.lineWidth = 2; x.strokeRect(371, 393, 58, 16);
    });
  };

  // =====================================================================
  //  BARBEARIA
  // =====================================================================
  E['barbearia:entrada'] = (R, pl) => {
    const cad = R.objs.filter(o => o.t === 'cadeira_b');
    add(R,
      O('tapete', 150, 276, 380, 112, { solid: false, k: -50, cor: '#7a1a2a', cor2: '#d8b878' }),
      O('lavatorio', 600, 300, 60, 40, { e: 26 }), O('lavatorio', 600, 366, 60, 40, { e: 26 }),
      O('poste_barb', 84, 196, 20, 20, { e: 60 }), O('poste_barb', 690, 480, 20, 20, { e: 60 }),
      O('mesa_centro', 130, 384, 80, 44, { e: 12 }), O('planta', 640, 440, 40, 50, { variante: 'folhagem' }));
    // clientes nas cadeiras 2 e 3, barbeiro trabalhando atrás da 2
    if (cad[1]) { gente(R, cad[1].x + 23, cad[1].y + 24, { shirt: '#4a6a8a', sleeve: 'curta' }, ['Só a régua, por favor.', 'Esse barbeiro é o melhor da cidade.'], 'Cliente', { sentado: true, h: Math.PI, k: 400 }); gente(R, cad[1].x + 23, cad[1].y - 18, { shirt: '#16181e', pants: '#23232c', sleeve: 'curta', hairStyle: 'topete' }, ['Já terminei a barba dele, agora o degradê.', 'Quer cortar também? Senta ali na primeira.'], 'Barbeiro Léo', { h: Math.PI, fixo: true }); }
    if (cad[2]) gente(R, cad[2].x + 23, cad[2].y + 24, { shirt: '#8a6a3a', sleeve: 'curta', hairStyle: 'afro' }, ['Vou na barba e no cabelo.', 'Essa cadeira é confortável demais.'], 'Cliente', { sentado: true, h: Math.PI, k: 400 });
    gente(R, 140, 468, { shirt: '#3a8a6a', sleeve: 'regata' }, ['Esperando minha vez, tem uns três na frente.', 'Estou lendo a revista de futebol.'], 'Cliente', { sentado: true, h: Math.PI, k: 520 });
    decoMais(R, x => {
      D.quadroNegro(x, 488, 84, 84, 54, [['Corte', '$20'], ['Cor', '$15']], 'PREÇOS');
      D.toalheiro(x, 596, 106, 84);
      x.fillStyle = 'rgba(255,255,255,0.18)'; x.font = 'bold 9px Arial'; x.fillText('BARBA · CABELO · BIGODE', 150, 142);
    });
  };

  // =====================================================================
  //  SHOPPING
  // =====================================================================
  E['shopping:entrada'] = (R, pl) => {
    const sv = R.npcs[0]; if (sv) { sv.x = 300; sv.y = 300; }
    add(R,
      O('tapete', 300, 250, 270, 270, { solid: false, k: -50, cor: '#d8cdb4', cor2: '#b8a888', padrao: 'geometrico' }),
      O('fonte', 360, 270, 160, 90, { e: 16 }),
      O('manequim', 108, 268, 30, 30, { e: 64, cor: '#e84a8a' }), O('manequim', 150, 268, 30, 30, { e: 64, cor: '#2a58b8' }), O('manequim', 192, 268, 30, 30, { e: 64, cor: '#f2f2f2' }),
      O('vitrine', 590, 190, 120, 44, { e: 38, tema: 'oculos', front: '#2a2d36' }),
      O('cabine_prova', 250, 318, 70, 40, { e: 70 }),
      espera(200, 484, 120), espera(570, 484, 120),
      O('mesa_expo', 600, 280, 110, 46, { e: 24, tema: 'eletronicos' }));
    const a = gente(R, 420, 400, { fem: true, shirt: '#e84a8a', sleeve: 'curta', hairStyle: 'longo' }, ['Olha esse vestido, que lindo!', 'Vou dar uma volta e já volto.'], 'Cliente');
    const b = gente(R, 560, 340, { shirt: '#2a4a7a', sleeve: 'curta' }, ['Vim só olhar vitrine mesmo.', 'Esse shopping tem fonte, olha que chique!'], 'Cliente');
    const c = gente(R, 300, 450, { fem: true, shirt: '#2fb86a', sleeve: 'regata', hairStyle: 'rabo' }, ['Estou procurando um tênis novo.', 'Tem promoção na loja do fundo?'], 'Cliente');
    vaivem(R, [a, b, c], [270, 260, 700, 500]);
    decoMais(R, x => {
      [['CINEMA', '#2a3a8a', '#1c2440', 'cinema'], ['PERFUMARIA', '#e84a8a', '#f4e0ea', 'perfume'], ['ÓTICA', '#2a8a8a', '#dff0f0', 'otica'], ['GAMES', '#7a3a9a', '#1a1428', 'games'], ['JOIAS', '#c8a24a', '#2a2418', 'joia']].forEach(([n, c1, v, t], i) => fachada(x, 96 + i * 128, 108, 112, n, c1, v, t));
    });
    pisoMais(R, x => {     // avenida de piso polido no meio do corredor
      x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(318, 150, 160, 400); x.strokeStyle = 'rgba(0,0,0,0.12)'; x.lineWidth = 1;
      for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(318 + i * 20, 150); x.lineTo(318 + i * 20, 550); x.stroke(); } for (let j = 0; j < 20; j++) { x.beginPath(); x.moveTo(318, 150 + j * 20); x.lineTo(478, 150 + j * 20); x.stroke(); }
    });
    R.luzes.push({ x: 440, y: 320, r: 280 });
  };

  // =====================================================================
  //  BANCO
  // =====================================================================
  E['banco:entrada'] = (R, pl) => {
    const guiche = R.objs.find(o => o.t === 'recepcao');
    const atm = (x, n) => O('caixa_eletronico', x, 190, 52, 36, { e: 62, nome: n, label: 'CAIXA ELETRÔNICO', r: 46, act: S => { if (guiche && guiche.act) guiche.act(S); } });
    add(R, atm(84), atm(712),
      O('tapete', 200, 262, 300, 150, { solid: false, k: -50, cor: '#2a4a7a', cor2: '#c8a24a' }),
      O('fila', 262, 282, 66, 12, { e: 26, solid: false }), O('fila', 372, 282, 66, 12, { e: 26, solid: false }), O('fila', 262, 354, 66, 12, { e: 26, solid: false }), O('fila', 372, 354, 66, 12, { e: 26, solid: false }),
      O('arquivo', 690, 404, 50, 40, { e: 56 }), bebe(740, 300));
    const a = gente(R, 460, 420, { fem: true, shirt: '#c84a6a', sleeve: 'curta', hairStyle: 'coque' }, ['Só vim pagar um boleto.', 'O caixa eletrônico engoliu meu cartão!'], 'Cliente');
    const b = gente(R, 250, 470, { shirt: '#6a5a3a', sleeve: 'longa' }, ['Vou abrir uma conta poupança.', 'Dinheiro guardado no banco não some.'], 'Cliente');
    vaivem(R, [a, b], [220, 400, 520, 500]);
    decoMais(R, x => { D.relogio(x, 118, 120, 10, '#f6fafc'); D.relogio(x, 722, 120, 10, '#f6fafc'); x.fillStyle = 'rgba(200,162,74,0.5)'; x.fillRect(70, 142, 700, 3); });
  };

  // =====================================================================
  //  PADARIA e PIZZARIA
  // =====================================================================
  E['padaria:entrada'] = (R, pl) => {
    add(R,
      O('tapete', 100, 320, 520, 160, { solid: false, k: -50, cor: '#e8d0a0', cor2: '#c8883a', padrao: 'listras' }),
      O('prateleira', 630, 270, 76, 36, { e: 56, tema: 'paes', nome: 'PÃES', front: '#c8883a' }),
      O('prateleira', 630, 372, 76, 36, { e: 56, tema: 'doces', nome: 'DOCES', front: '#f0a0c0' }),
      O('banco_espera', 560, 470, 70, 24, { e: 16 }));
    gente(R, 150, 258, { shirt: '#f4f0e8', pants: '#3a3e48', sleeve: 'curta', acc: 'hat', accCol: '#f4f0e8' }, ['A fornada das seis está saindo!', 'Quer um pãozinho quente?'], 'Padeiro Zeca', { h: 0, fixo: true });
    const a = gente(R, 330, 300, { fem: true, shirt: '#8a6a3a', sleeve: 'curta' }, ['Vou levar meia dúzia de pães.', 'O cheirinho aqui é uma tentação.'], 'Cliente');
    const b = gente(R, 560, 420, { shirt: '#4a6a8a', sleeve: 'curta' }, ['Cafezinho e pão na chapa, o de sempre.'], 'Cliente');
    vaivem(R, [a, b], [220, 260, 620, 470]);
    decoMais(R, x => { D.quadroNegro(x, 606, 82, 98, 54, [['Francês', '$1'], ['P. de queijo', '$3'], ['Bolo', '$8']], 'PÃO DO DIA'); D.relogio(x, 130, 120, 9, '#fff6e0'); });
  };
  E['pizzaria:entrada'] = (R, pl) => {
    const f = R.objs.find(o => o.t === 'fogao'); if (f) { f.t = 'forno'; f.w = 110; f.h = 44; f.e = 70; }
    add(R,
      O('bancada', 100, 282, 130, 40, { e: 26 }),
      O('prateleira', 630, 270, 76, 36, { e: 56, tema: 'bebidas', nome: 'BEBIDAS', front: '#2a58b8' }),
      O('prateleira', 630, 372, 76, 36, { e: 56, tema: 'garrafas', nome: 'VINHOS', front: '#5a3a22' }));
    gente(R, 165, 266, { shirt: '#ffffff', pants: '#23232c', sleeve: 'curta', acc: 'hat', accCol: '#ffffff' }, ['A massa descansou doze horas!', 'Calabresa com borda recheada, saindo!'], 'Pizzaiolo Toni', { h: Math.PI, fixo: true, k: 270 });
    const a = gente(R, 300, 300, { fem: true, shirt: '#2a8a4a', sleeve: 'curta' }, ['Estou morrendo de fome!', 'Vou pedir meia calabresa, meia portuguesa.'], 'Cliente');
    const b = gente(R, 540, 430, { shirt: '#c8402a', sleeve: 'curta' }, ['Pizza grande pra dividir com a turma.'], 'Cliente');
    vaivem(R, [a, b], [240, 270, 600, 470]);
    decoMais(R, x => { D.quadroNegro(x, 606, 82, 98, 54, [['Fatia', '$8'], ['Grande', '$38'], ['Guaraná', '$5']], 'CARDÁPIO'); });
  };

  // =====================================================================
  //  DELEGACIA e PREFEITURA (as duas têm o mesmo esqueleto de recepção)
  // =====================================================================
  E['tipo:delegacia:entrada'] = (R, pl) => {
    atrasDoBalcao(achaNpc(R, 'Escrivã Marta'), 196);
    add(R,
      O('bandeira', 250, 262, 24, 16, { e: 92, pais: 'br', solid: false }), O('bandeira', 616, 262, 24, 16, { e: 92, pais: 'sp', solid: false }),
      O('arquivo', 250, 190, 50, 40, { e: 56 }), O('arquivo', 198, 190, 50, 40, { e: 56 }),
      O('tapete', 320, 290, 300, 60, { solid: false, k: -50, cor: '#243a66', cor2: '#c8a24a' }),
      O('escrivaninha', 680, 272, 190, 54, { e: 22, label: 'MESA DO INVESTIGADOR', r: 50, act: S => G.say('Relatórios e fotos de cena de crime. Nada que você deva ver.', 3.5) }),
      O('maquina_venda', 884, 190, 56, 36, { e: 76, nome: 'CAFÉ', label: 'MÁQUINA DE CAFÉ', r: 50, act: S => { K.compra(S, 3, () => { K.cura(S, 4); G.say('Cafezinho de máquina. (+4 vida)', 2.5); }); } }),
      O('banco_espera', 720, 440, 170, 26, { e: 16 }));
    gente(R, 775, 254, { shirt: '#2a2d36', pants: '#16181e', sleeve: 'longa' }, ['Sente-se, vou tomar seu depoimento.', 'Nome completo e endereço, por favor.'], 'Investigador Ramos', { h: Math.PI, k: 600, fixo: true });
    gente(R, 760, 446, { shirt: '#e8872a', sleeve: 'curta', hairStyle: 'raspado' }, ['Foi tudo um mal-entendido...', 'Quero ligar pro meu advogado.'], 'Detido', { sentado: true, h: Math.PI, k: 520, fixo: true, ameacavel: false });
    gente(R, 840, 470, { shirt: '#1c2f6b', pants: '#16181e', sleeve: 'curta', cap: 'cop' }, ['Fique sentado até chamarem seu nome.', 'Sem gracinha, hein.'], 'Policial Dias', { h: Math.PI, fixo: true });
    decoMais(R, x => { D.relogio(x, 880, 112, 9, '#f6f6f2'); });
  };
  E['tipo:prefeitura:entrada'] = (R, pl) => {
    atrasDoBalcao(achaNpc(R, 'Secretária Lúcia'), 196);
    add(R,
      O('bandeira', 250, 262, 24, 16, { e: 92, pais: 'br', solid: false }), O('bandeira', 616, 262, 24, 16, { e: 92, pais: 'sp', solid: false }),
      O('mesa_expo', 88, 196, 110, 46, { e: 24, tema: 'livros' }),
      O('tapete', 340, 285, 260, 100, { solid: false, k: -50, cor: '#7a2a2a', cor2: '#d8b878' }),
      O('arquivo', 868, 190, 50, 40, { e: 56 }), bebe(924, 194),
      O('mesa', 380, 410, 90, 54, { e: 18, estilo: 'cafe' }));
    gente(R, 780, 330, { fem: true, shirt: '#2a8a6a', sleeve: 'curta' }, ['Vim pedir o alvará da minha padaria.', 'A fila do IPTU é enorme!'], 'Dona Rita', { fixo: true });
    gente(R, 440, 470, { shirt: '#16181e', pants: '#16181e', sleeve: 'curta', cap: 'swat' }, ['Prefeitura em horário comercial. Sem tumulto.', 'Documento na recepção, por favor.'], 'Guarda Municipal', { h: Math.PI, fixo: true });
    decoMais(R, x => { brasao(x, 206, 96, 34); brasao(x, 684, 96, 34); mural(x, 872, 84, 56, 36); D.relogio(x, 130, 120, 9, '#f6f6f2'); });
  };

  // =====================================================================
  //  SAGUÃO DO HOTEL
  // =====================================================================
  E['tipo:hotel:lobby'] = (R, pl) => {
    const luxo = pl.nivel === 'luxo';
    add(R,
      O('fila', 322, 262, 66, 12, { e: 26, solid: false }), O('fila', 512, 262, 66, 12, { e: 26, solid: false }),
      O('malas', 760, 400, 56, 30, { solid: false }),
      O('poltrona', 130, 335, 50, 50, { e: 20, dir: 's' }), O('poltrona', 220, 335, 50, 50, { e: 20, dir: 's', cor: '#4f7a5a' }), O('mesa_centro', 160, 395, 80, 44, { e: 12 }));
    if (luxo) add(R, O('fonte', 640, 290, 150, 86, { e: 16 }));
    decoMais(R, x => { D.relogio(x, 712, 118, 9, '#f6f2e6'); });
  };

})(window.G = window.G || {});
