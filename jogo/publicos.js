/* =====================================================================
   PUBLICOS.JS — por dentro do HOSPITAL e do ESTÁDIO
   (antes os dois mostravam o layout da catedral: bancos de igreja e altar!)

   HOSPITAL SANTA CASA  (3 salas, ligadas por portas coloridas)
     recepção   balcão do pronto-socorro (tratar ferimentos de graça), sala de espera, máquina de lanche,
                faixas coloridas no chão, cadeiras de rodas, maca, médicos e pacientes
     enfermaria 5 leitos com monitor e soro, pacientes dormindo, posto de enfermagem
     consultório mesa da médica, maca de exame, balança, armário de remédios, tabela de olhos

   ESTÁDIO MUNICIPAL  (veja a segunda metade deste arquivo)
   ===================================================================== */
(function (G) {
  'use strict';
  const W = G.world, L = G.lugares, K = L.kit, SP = G.sprites, D = G.deco;
  const O = K.O, rand = K.rand, clamp = K.clamp, pick = K.pick, TAU = Math.PI * 2;
  const look = o => Object.assign(SP.randomLook(), { acc: 'none' }, o);
  const porta = (x, y, w, o) => O('porta', x, y, w, 54, Object.assign({ solid: false, k: 10, r: 50 }, o));
  const rr = D.rr;
  // posição de chegada ao entrar numa sala nova (porta de baixo, no centro)
  const chega = (w, h) => ({ x: 70 + w / 2, y: 150 + h - 40 });
  const irPara = (S, id, w, h) => { const c = chega(w, h); L.irSala(S, id, c.x, c.y, Math.PI); };

  // cruz vermelha num quadrado branco
  function cruz(x, cx, cy, s, fundo, cor) {
    x.fillStyle = 'rgba(0,0,0,0.25)'; rr(x, cx - s / 2 + 2, cy - s / 2 + 3, s, s, s * 0.18); x.fill();
    x.fillStyle = fundo || '#f6fafc'; rr(x, cx - s / 2, cy - s / 2, s, s, s * 0.18); x.fill();
    x.fillStyle = cor || '#d9363e'; x.fillRect(cx - s * 0.12, cy - s * 0.36, s * 0.24, s * 0.72); x.fillRect(cx - s * 0.36, cy - s * 0.12, s * 0.72, s * 0.24);
  }
  // frasco de álcool em gel na parede
  function alcool(x, px, py) {
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(px + 2, py + 2, 12, 22); x.fillStyle = '#f2f4f6'; rr(x, px, py, 12, 22, 3); x.fill(); x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 1; rr(x, px + 0.5, py + 0.5, 11, 21, 3); x.stroke();
    x.fillStyle = '#4aa8e8'; x.fillRect(px + 2, py + 3, 8, 9); x.fillStyle = '#c8d0d8'; x.fillRect(px + 4, py + 15, 4, 5);
  }
  // quadro de aviso com papéis
  function mural(x, px, py, w, h) {
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(px + 3, py + 3, w, h); x.fillStyle = '#9a7040'; x.fillRect(px - 3, py - 3, w + 6, h + 6); x.fillStyle = '#c8a878'; x.fillRect(px, py, w, h);
    const cs = ['#ffffff', '#ffe9a0', '#bfe3ff', '#ffd0d0', '#d8f2c8'];
    for (let i = 0; i < 6; i++) { const ax = px + 4 + (i % 3) * (w - 8) / 3, ay = py + 4 + ((i / 3) | 0) * (h - 8) / 2; x.fillStyle = cs[i % 5]; x.fillRect(ax, ay, (w - 14) / 3, (h - 12) / 2); x.fillStyle = 'rgba(0,0,0,0.35)'; for (let k = 0; k < 3; k++) x.fillRect(ax + 2, ay + 3 + k * 4, (w - 14) / 3 - 4, 1); x.fillStyle = '#d93636'; x.fillRect(ax + (w - 14) / 6 - 1, ay - 1, 2, 3); }
  }

  const HOSP = { azul: '#2a78c8', verde: '#2f9a6a', verm: '#d9363e' };

  // lotação mostrada no balcão (usa o hospital da lista W.hospitais, se tiver)
  function lotacao(pl) {
    const hs = W.hospitais || []; let b = null, bd = 1e9;
    hs.forEach(h => { const d = Math.hypot(h.x - pl.x, h.y - pl.y); if (d < bd) { bd = d; b = h; } });
    return b && bd < 400 ? Math.round((b.lot || 0) * 100) : Math.round(20 + (pl.x * 7 % 40));
  }

  function menuBalcao(S, R) {
    const pl = R.lugar.place, lot = lotacao(pl);
    const it = [];
    it.push({ n: 'Tratar ferimentos (atendimento SUS)', desc: 'grátis — a enfermeira cuida de você',
      fn: S2 => { if (S2.player.hp >= 100) { G.say('A enfermeira confere seus sinais: você está inteiro, nada a tratar.', 3.5); return; } S2.player.hp = 100; G.snd.beep(); G.say('Curativos, soro e analgésico. Ferimentos tratados — vida cheia!', 4.5); return 'fechar'; } });
    it.push({ n: 'Check-up particular — $120', desc: 'sem fila: vida cheia, passa a bebedeira e a energia',
      fn: S2 => K.compra(S2, 120, () => { S2.player.hp = 100; S2.bebado = 0; S2.energia = 0; G.say('Exames em dia. Você saiu novinho em folha!', 4.5); }) });
    it.push({ n: 'Perguntar pelas salas', desc: 'enfermaria, consultório e centro cirúrgico',
      fn: () => G.say('Faixa AZUL leva à enfermaria, VERDE aos consultórios e VERMELHA ao centro cirúrgico (só equipe médica).', 6) });
    it.push({ n: 'Fechar', fn: () => 'fechar' });
    L.abrirMenu(S, { titulo: 'BALCÃO — PRONTO-SOCORRO', rodape: 'W/S escolher  ·  E confirmar  ·  ESC sair', info: S2 => 'lotação ' + lot + '%  ·  $' + Math.floor(S2.save.money), itens: it });
  }

  // =====================================================================
  //  HOSPITAL: recepção
  // =====================================================================
  function hospEntrada(lg) {
    const pl = lg.place, w = 940, h = 450;
    const R = L.novaSala({ place: pl, w, h, nome: pl.nome || 'HOSPITAL', cor: HOSP.verm, piso: 'ladrilho', pisoCores: ['#eef3f6', '#d6e0e8'], parede: '#dcebef', estiloParede: 'azulejo', lambri: '#9ec8d8', lambriAlt: 30, rodape: '#bcd0d8', capacho: HOSP.azul, subtitulo: 'pronto-socorro 24 horas', luzes: [{ x: 300, y: 330, r: 380 }, { x: 780, y: 330, r: 380 }, { x: 540, y: 250, r: 320 }] });
    R.chegada = { x: R.portaX, y: R.y1 + 10 };
    const add = (...a) => R.objs.push(...a);
    const x0 = R.x0, x1 = R.x1, cx = 540;
    // portas na parede de trás
    add(porta(130, 96, 70, { cor: HOSP.azul, placa: 'ENFERMARIA', label: 'ENTRAR NA ENFERMARIA', act: S => irPara(S, 'enfermaria', 900, 430) }));
    add(porta(290, 96, 70, { cor: HOSP.verde, placa: 'CONSULTAS', label: 'ENTRAR NO CONSULTÓRIO', act: S => irPara(S, 'consultorio', 700, 400) }));
    add(porta(760, 96, 70, { cor: HOSP.verm, placa: 'CIRURGIA', label: 'CENTRO CIRÚRGICO', act: S => G.say('Somente equipe médica. Os cirurgiões estão em operação.', 3.5) }));
    // balcão do pronto-socorro (a enfermeira fica atrás)
    add(O('recepcao', 400, 232, 280, 44, { e: 30, top: '#f4f8fa', front: '#4a8ab8', label: 'PRONTO-SOCORRO (TRATAR FERIMENTOS)', r: 62, act: S => menuBalcao(S, R) }));
    // lado esquerdo: cadeiras de rodas e balança
    add(O('cadeira_rodas', 86, 236, 40, 44, { solid: false }), O('cadeira_rodas', 86, 300, 40, 44, { solid: false, cor: '#4a4e58' }));
    add(O('balanca', 222, 196, 42, 40, { e: 8, label: 'SUBIR NA BALANÇA', r: 36, act: S => G.say('Balança: ' + Math.round(rand(68, 84)) + ' kg. ' + pick(['Está ótimo!', 'Dá pra reduzir a feijoada.', 'Falta músculo.']), 3.5) }));
    // lado direito: máquina de lanche, bebedouro, maca com soro
    add(O('maquina_venda', 930, 190, 56, 36, { e: 76, nome: 'LANCHES', label: 'MÁQUINA DE LANCHE', r: 50, act: S => L.abrirMenu(S, { titulo: 'MÁQUINA DE LANCHE', rodape: 'E confirmar · ESC sair', info: S2 => '$' + Math.floor(S2.save.money), itens: [
      { n: 'Água mineral — $4', desc: '+3 vida', fn: S2 => K.compra(S2, 4, () => { K.cura(S2, 3); G.say('Água geladinha. (+3 vida)', 2.5); }) },
      { n: 'Biscoito recheado — $5', desc: '+8 vida', fn: S2 => K.compra(S2, 5, () => { K.cura(S2, 8); G.say('Biscoito de chocolate! (+8 vida)', 2.5); }) },
      { n: 'Fechar', fn: () => 'fechar' }] }) }));
    add(O('bebedouro', 886, 198, 36, 36, { e: 62, label: 'BEBER ÁGUA', r: 40, act: S => { K.cura(S, 2); G.snd.beep(); G.say('Água fresquinha do bebedouro. (+2 vida)', 2.5); } }));
    add(O('maca', 900, 340, 56, 110, { e: 20, solid: true }), O('soro', 868, 348, 30, 20, { e: 72, solid: false }));
    R.npcs.push({ x: 928, y: 396, p: look({ shirt: '#bcd8e8', pat: 'liso', sleeve: 'curta' }), dorme: true, h: Math.PI, falas: ['Ai... minha cabeça...', 'Doutor, quanto tempo?'], nome: 'Paciente da maca', dinheiro: 0, ameacavel: false });
    // salas de espera: bancos e pacientes sentados
    const espera = (x, y) => add(O('banco_espera', x, y, 170, 26, { e: 16, label: 'SENTAR NA ESPERA', r: 30, act: S => { K.cura(S, 4); G.say('Você esperou sentado um pouco. (+4 vida)', 3); } }));
    espera(110, 392); espera(110, 482); espera(740, 392); espera(740, 482);
    const pac = (x, y, nome, falas, o) => R.npcs.push(Object.assign({ x, y, p: look({}), sentado: true, h: 0, falas, nome, dinheiro: Math.round(rand(10, 60)), k: y + 60 }, o || {}));
    pac(150, 396, 'Dona Neide', ['Faz três horas que estou esperando...', 'É só uma tosse, mas não passa.'], { p: look({ fem: true, hairStyle: 'coque', shirt: '#8a4a6a' }) });
    pac(220, 396, 'Seu Aparecido', ['Caí da escada, mas tô inteiro.', 'No meu tempo o hospital era mais vazio.']);
    pac(790, 486, 'Marcelo', ['Torci o pé no futebol de domingo.', 'Pelo menos o café da máquina é barato.'], { p: look({ shirt: '#d8c040', sleeve: 'curta' }) });
    pac(850, 486, 'Priscila', ['Meu filho está com febre. Estou preocupada.', 'Será que chamam logo?'], { p: look({ fem: true, shirt: '#4a8a8a' }) });
    // equipe
    const medico = { x: 520, y: 345, p: look({ shirt: '#f6f8fa', pants: '#3a4a6a', pat: 'jaqueta', sleeve: 'longa', hairStyle: 'curto' }), h: 0, falas: ['Respire fundo, vamos cuidar de você.', 'Estou de plantão há 20 horas.', 'Sem emergência, espere ser chamado.'], nome: 'Dr. Ricardo', dinheiro: 90, label: 'CONVERSAR' };
    const enf2 = { x: 330, y: 345, p: look({ fem: true, shirt: '#58c0c8', pants: '#58c0c8', sleeve: 'curta', hairStyle: 'rabo' }), h: 0, falas: ['Pegue uma senha e aguarde.', 'Fique tranquilo, o médico já vem.'], nome: 'Enfermeira Lia', dinheiro: 35, label: 'CONVERSAR' };
    R.npcs.push({ x: 470, y: 210, k: 600, p: look({ fem: true, shirt: '#58c0c8', pants: '#58c0c8', sleeve: 'curta', hairStyle: 'coque' }), falas: ['Pronto-socorro, boa tarde. Qual a queixa?', 'Atendimento pelo SUS é gratuito, viu?', 'Quer tratar ferimentos? Fale comigo no balcão.'], h: Math.PI, fixo: true, nome: 'Enfermeira Rosa', dinheiro: 40, label: 'CONVERSAR' });
    R.npcs.push(medico, enf2);
    R.npcs.push({ x: 430, y: 540, p: look({ shirt: '#15171c', pants: '#15171c', cap: 'swat', sleeve: 'curta' }), falas: ['Boa tarde. Aqui dentro, sem confusão.', 'Visitas só até as 20h.'], h: 0, fixo: true, nome: 'Segurança Dias', dinheiro: 20, label: 'CONVERSAR' });
    R.equipe = [medico, enf2];
    add(O('planta', 84, 520, 40, 50, { variante: 'folhagem' }), O('planta', 950, 520, 40, 50, { variante: 'samambaia' }), O('planta', 665, 296, 40, 50, {}));
    // faixas do chão (triagem) + parede
    R.pisoExtra = x => {
      [[165, HOSP.azul], [325, HOSP.verde], [795, HOSP.verm]].forEach(([fx, cor]) => {
        x.fillStyle = 'rgba(255,255,255,0.8)'; x.fillRect(fx - 7, 150, 14, 330); x.fillStyle = cor; x.fillRect(fx - 4, 150, 8, 330);
        x.fillStyle = 'rgba(255,255,255,0.9)'; for (let y = 190; y < 470; y += 64) { x.beginPath(); x.moveTo(fx, y - 10); x.lineTo(fx + 8, y + 4); x.lineTo(fx - 8, y + 4); x.closePath(); x.fill(); }
      });
      // tapete de entrada e desenho no chão em frente ao balcão
      x.fillStyle = 'rgba(42,120,200,0.1)'; rr(x, 380, 300, 320, 20, 4); x.fill();
    };
    R.deco = x => {
      // letreiro central com cruz
      x.fillStyle = 'rgba(0,0,0,0.3)'; rr(x, 392, 80, 300, 40, 6); x.fill();
      x.fillStyle = '#f6fafc'; rr(x, 388, 76, 300, 40, 6); x.fill(); x.strokeStyle = HOSP.verm; x.lineWidth = 3; rr(x, 391, 79, 294, 34, 5); x.stroke();
      cruz(x, 414, 96, 26, HOSP.verm, '#fff');
      x.save(); x.textAlign = 'center'; x.fillStyle = HOSP.verm; x.font = 'bold 18px Arial'; x.fillText('PRONTO-SOCORRO', 556, 95); x.font = 'bold 9px Arial'; x.fillStyle = HOSP.azul; x.fillText((pl.nome || 'HOSPITAL') + ' · 24 HORAS', 556, 108); x.restore();
      // janelas e cartazes
      K.janela(x, 214, 76, 64, 46, { vista: 'cidade', cor: '#eef3f6' });
      K.janela(x, 850, 76, 64, 46, { vista: 'cidade', cor: '#eef3f6' });
      D.cartazLoja(x, 706, 80, 48, 60, '#e8f4ff', ['MÃOS', 'LIMPAS', 'SALVAM'], HOSP.azul);
      D.cartazLoja(x, 84, 84, 36, 56, '#fff4d8', ['VACINA', 'EM DIA'], HOSP.verm);
      mural(x, 924, 84, 56, 36);
      alcool(x, 204, 112); alcool(x, 372, 112); alcool(x, 836, 112); alcool(x, 124, 112 + 0);
      D.relogio(x, 540, 134, 9, '#f6fafc');
      // placa "silêncio" e faixa de rodapé azul
      x.fillStyle = HOSP.azul; x.fillRect(70, 140, 940, 3);
    };
    R.onUpdate = (S, R2, dt) => {
      R2.tp = (R2.tp || 0) - dt;
      if (R2.tp > 0) return; R2.tp = rand(5, 9);
      const n = pick(R2.equipe); if (n.alvo || (n.rota && n.rota.length)) return;
      L.rota(n, [{ x: n.x, y: 335 }, { x: rand(150, 880), y: 335 }, { x: rand(150, 880), y: rand(330, 360) }]);
    };
    return R;
  }

  // =====================================================================
  //  HOSPITAL: enfermaria
  // =====================================================================
  function hospEnfermaria(lg) {
    const pl = lg.place, w = 900, h = 430;
    const R = L.novaSala({ place: pl, w, h, nome: 'ENFERMARIA', cor: HOSP.azul, piso: 'ladrilho', pisoCores: ['#e4eef0', '#cfdde2'], parede: '#d2e8e0', estiloParede: 'azulejo', lambri: '#8cc0b0', lambriAlt: 30, rodape: '#b8d0c8', capacho: HOSP.azul, subtitulo: 'internação', luzes: [{ x: 300, y: 330, r: 340 }, { x: 700, y: 330, r: 340 }] });
    R.chegada = { x: R.portaX, y: R.y1 + 10 };
    R.porta = { para: 'entrada', px: 165, py: 215, ph: Math.PI, label: 'VOLTAR À RECEPÇÃO', rotulo: 'RECEPÇÃO' };
    const add = (...a) => R.objs.push(...a);
    const ocupados = [0, 2, 3];
    const nomes = ['Seu Antônio', 'Dona Lourdes', 'Sr. Jorge', 'Camila', 'Pedrinho'];
    const falas = [['zzz... zzz...', 'Mais um cobertor, por favor...'], ['Estou melhor, só preciso descansar.', 'O jantar daqui é sem sal...'], ['Fiz cirurgia ontem. Dói quando eu rio.', 'Quando eu saio?']];
    const cores = ['#6aa8d8', '#d8b8c8', '#9ccab8', '#6aa8d8', '#e8c898'];
    for (let i = 0; i < 5; i++) {
      const bx = 110 + i * 165;
      add(O('leito', bx, 190, 70, 118, { e: 16, cor: cores[i], label: 'DESCANSAR NO LEITO', r: 50, act: S => {
        if (S.player.hp >= 100) { G.say('Você está bem. Deixe o leito para quem precisa.', 3.5); return; }
        K.cura(S, 40); S.dayT += 0.02; G.snd.beep(); G.say('Você descansou no leito por algumas horas. (+40 vida)', 4);
      } }));
      add(O('monitor_vital', bx + 76, 198, 40, 22, { e: 48, solid: true }));
      add(O('soro', bx - 30, 252, 30, 20, { e: 72, solid: false }));
      if (ocupados.indexOf(i) >= 0) {
        const j = ocupados.indexOf(i);
        R.npcs.push({ x: bx + 35, y: 262, p: look({ shirt: '#cfe0ec', sleeve: 'curta', fem: i === 1 }), dorme: true, h: Math.PI, falas: falas[j], nome: nomes[i], dinheiro: Math.round(rand(0, 30)), ameacavel: false, k: 308 });
      }
    }
    // posto de enfermagem
    add(O('recepcao', 330, 420, 250, 44, { e: 30, top: '#f4f8fa', front: '#4a8ab8', label: 'POSTO DE ENFERMAGEM', r: 60, act: S => G.say(pick(['Os prontuários estão trancados no arquivo.', 'A enfermeira de plantão confere a lista de remédios.', 'Sem autorização você não mexe nos prontuários.']), 4) }));
    add(O('arquivo', 600, 410, 50, 40, { e: 56, label: 'ARQUIVO DE PRONTUÁRIOS', r: 40, act: S => G.say('Gavetas trancadas. Tudo em ordem alfabética.', 3.5) }));
    // canto de exame: maca com biombo e carrinho
    add(O('maca', 760, 390, 56, 110, { e: 20 }), O('biombo', 730, 360, 100, 8, { e: 72, solid: false, k: 520, cor: '#a8d0e0' }), O('soro', 836, 396, 30, 20, { e: 72, solid: false }));
    add(O('armario_med', 90, 400, 110, 38, { e: 70, label: 'ARMÁRIO DE REMÉDIOS', r: 50, act: S => G.say('Trancado a chave. Só a enfermeira-chefe abre.', 3.5) }));
    add(O('cadeira_rodas', 220, 440, 40, 44, { solid: false }), O('bebedouro', 880, 200, 36, 36, { e: 62, label: 'BEBER ÁGUA', r: 40, act: S => { K.cura(S, 2); G.snd.beep(); G.say('Água fresquinha. (+2 vida)', 2.5); } }));
    add(O('planta', 84, 500, 40, 50, { variante: 'samambaia' }), O('planta', 930, 480, 40, 50, {}));
    R.npcs.push({ x: 400, y: 398, k: 600, p: look({ fem: true, shirt: '#58c0c8', pants: '#58c0c8', sleeve: 'curta', hairStyle: 'longo' }), falas: ['Hora do remédio! Quem é o próximo?', 'Silêncio, aqui tem gente descansando.', 'Fique tranquilo, vai dar tudo certo.'], h: Math.PI, fixo: true, nome: 'Enfermeira Bia', dinheiro: 35, label: 'CONVERSAR' });
    R.npcs.push({ x: 650, y: 360, p: look({ shirt: '#f6f8fa', pants: '#3a4a6a', pat: 'jaqueta', sleeve: 'longa' }), falas: ['Ronda dos leitos. Todos estáveis.', 'Descanso é o melhor remédio.'], h: 0, nome: 'Dr. Paulo', dinheiro: 70, label: 'CONVERSAR' });
    R.equipe = [R.npcs[R.npcs.length - 1]];
    R.deco = x => {
      for (let i = 0; i < 4; i++) K.janela(x, 196 + i * 165, 76, 64, 46, { vista: i % 2 ? 'jardim' : 'cidade', cor: '#eef3f6' });
      cruz(x, 852, 100, 28, HOSP.azul, '#fff');
      x.save(); x.textAlign = 'center'; x.font = 'bold 9px Arial'; x.fillStyle = '#2a5a7a'; x.fillText('ENFERMARIA', 852, 128); x.restore();
      for (let i = 0; i < 5; i++) { x.fillStyle = '#f6fafc'; rr(x, 110 + i * 165 + 25, 126, 20, 14, 2); x.fill(); x.strokeStyle = HOSP.azul; x.lineWidth = 1; rr(x, 110 + i * 165 + 25.5, 126.5, 19, 13, 2); x.stroke(); x.fillStyle = HOSP.azul; x.font = 'bold 9px Arial'; x.textAlign = 'center'; x.fillText(String(i + 1), 110 + i * 165 + 35, 137); x.textAlign = 'left'; }
      alcool(x, 934, 100);
      D.relogio(x, 560, 100, 9, '#f6fafc');
    };
    R.onUpdate = (S, R2, dt) => {
      R2.tp = (R2.tp || 0) - dt; if (R2.tp > 0) return; R2.tp = rand(6, 10);
      const n = R2.equipe[0]; if (n.alvo || (n.rota && n.rota.length)) return;
      L.rota(n, [{ x: n.x, y: 355 }, { x: rand(150, 800), y: 355 }, { x: rand(150, 800), y: rand(340, 370) }]);
    };
    return R;
  }

  // =====================================================================
  //  HOSPITAL: consultório
  // =====================================================================
  function hospConsultorio(lg) {
    const pl = lg.place, w = 700, h = 400;
    const R = L.novaSala({ place: pl, w, h, nome: 'CONSULTÓRIO', cor: HOSP.verde, piso: 'ladrilho', pisoCores: ['#eaf2ee', '#d2e2da'], parede: '#e6f0ea', estiloParede: 'liso', lambri: '#9cc8b8', lambriAlt: 30, rodape: '#c4d8d0', capacho: HOSP.verde, subtitulo: 'atendimento', luzes: [{ x: 420, y: 330, r: 400 }] });
    R.chegada = { x: R.portaX, y: R.y1 + 10 };
    R.porta = { para: 'entrada', px: 325, py: 215, ph: Math.PI, label: 'VOLTAR À RECEPÇÃO', rotulo: 'RECEPÇÃO' };
    const add = (...a) => R.objs.push(...a);
    add(O('armario_med', 100, 188, 130, 38, { e: 70, label: 'ARMÁRIO DE REMÉDIOS', r: 50, act: S => G.say('Frascos e caixas organizados por tarja. Nada de se servir!', 3.5) }));
    add(O('arquivo', 250, 188, 50, 40, { e: 56 }));
    add(O('escrivaninha', 380, 214, 190, 54, { e: 22, label: 'CONSULTA MÉDICA', r: 60, act: S => menuConsulta(S, R) }));
    add(O('cadeira', 420, 300, 24, 24, { dir: 'n', solid: false, estilo: 'plastico', cor: '#2a78c8' }), O('cadeira', 500, 300, 24, 24, { dir: 'n', solid: false, estilo: 'plastico', cor: '#2a78c8' }));
    add(O('maca', 120, 336, 56, 110, { e: 20, label: 'DEITAR NA MACA', r: 46, act: S => { if (S.player.hp >= 100) { G.say('Você não está com nada, doutora só te examinou.', 3.5); return; } K.cura(S, 20); G.say('A doutora examinou você deitado na maca. (+20 vida)', 4); } }));
    add(O('biombo', 90, 306, 120, 8, { e: 72, solid: false, cor: '#a8d0c8' }));
    add(O('balanca', 230, 336, 42, 40, { e: 8, label: 'SUBIR NA BALANÇA', r: 36, act: S => G.say('Balança: ' + Math.round(rand(66, 86)) + ' kg.', 3) }));
    add(O('soro', 292, 330, 30, 20, { e: 72, solid: false }));
    add(O('planta', 640, 190, 40, 50, { variante: 'palmeira' }), O('planta', 84, 500, 40, 50, {}));
    add(O('bebedouro', 640, 300, 36, 36, { e: 62, label: 'BEBER ÁGUA', r: 40, act: S => { K.cura(S, 2); G.say('Água fresca. (+2 vida)', 2.5); } }));
    R.npcs.push({ x: 475, y: 196, k: 600, p: look({ fem: true, shirt: '#f6f8fa', pants: '#3a4a6a', pat: 'jaqueta', sleeve: 'longa', hairStyle: 'rabo' }), falas: ['Sente-se, o que está sentindo?', 'Respire fundo... agora solte.', 'Beba bastante água e descanse.'], h: Math.PI, fixo: true, nome: 'Dra. Helena', dinheiro: 90, label: 'CONVERSAR' });
    R.deco = x => {
      // diplomas
      [[380, 92], [440, 92], [500, 92]].forEach(([dx, dy], i) => { x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(dx + 2, dy + 3, 46, 34); x.fillStyle = '#8a6a3a'; x.fillRect(dx - 2, dy - 2, 50, 38); x.fillStyle = '#f8f2dc'; x.fillRect(dx, dy, 46, 34); x.fillStyle = 'rgba(0,0,0,0.4)'; for (let k = 0; k < 4; k++) x.fillRect(dx + 6, dy + 8 + k * 5, 34, 1.2); x.fillStyle = '#c8a24a'; x.beginPath(); x.arc(dx + 23, dy + 29, 3.4, 0, TAU); x.fill(); });
      // tabela de olhos (Snellen)
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(704, 88, 52, 52); x.fillStyle = '#fafafa'; x.fillRect(700, 84, 52, 52); x.strokeStyle = '#888'; x.lineWidth = 1; x.strokeRect(700.5, 84.5, 51, 51);
      x.fillStyle = '#16181e'; x.textAlign = 'center';
      [['E', 22], ['F P', 15], ['T O Z', 11], ['L P E D', 8], ['P E C F D', 6]].forEach(([t, s], i) => { x.font = 'bold ' + s + 'px Arial'; x.fillText(t, 726, 100 + i * 9 + (i > 0 ? 4 : 0) + (i === 0 ? 0 : 0)); }); x.textAlign = 'left';
      // cartaz do coração
      D.cartazLoja(x, 570, 82, 52, 60, '#ffe8e8', ['CUIDE DO', 'CORAÇÃO'], HOSP.verm);
      x.fillStyle = HOSP.verm; x.beginPath(); x.moveTo(596, 130); x.bezierCurveTo(580, 118, 586, 108, 596, 116); x.bezierCurveTo(606, 108, 612, 118, 596, 130); x.fill();
      K.janela(x, 270, 76, 64, 46, { vista: 'jardim', cor: '#f2f6f2' });
      alcool(x, 640, 108);
      D.relogio(x, 660, 100, 9, '#f6fafc');
    };
    return R;
  }
  function menuConsulta(S, R) {
    const it = [
      { n: 'Consulta particular — $120', desc: 'a doutora examina: vida cheia, passa a bebedeira e a energia', fn: S2 => K.compra(S2, 120, () => { S2.player.hp = 100; S2.bebado = 0; S2.energia = 0; G.say('A doutora fez os exames. Você está ótimo!', 4.5); }) },
      { n: 'Pedir um atestado', desc: 'de graça, mas não resolve nada...', fn: () => G.say('Dra. Helena: "Atestado de 1 dia. Descanse de verdade!"', 4) },
      { n: 'Perguntar sobre saúde', desc: 'dicas de quem entende', fn: () => G.say(pick(['Coma bem: pão de queijo e frutas ajudam a recuperar a vida.', 'Evite brigas: costelas quebradas demoram a curar.', 'Descanse no leito da enfermaria, é a melhor cura.']), 5) },
      { n: 'Fechar', fn: () => 'fechar' }];
    L.abrirMenu(S, { titulo: 'CONSULTÓRIO — DRA. HELENA', rodape: 'W/S escolher  ·  E confirmar  ·  ESC sair', info: S2 => '$' + Math.floor(S2.save.money), itens: it });
  }

  L.construtores['tipo:hospital'] = { criar(sid, lg) { return sid === 'enfermaria' ? hospEnfermaria(lg) : sid === 'consultorio' ? hospConsultorio(lg) : hospEntrada(lg); } };

  // =====================================================================
  //  ESTÁDIO MUNICIPAL
  //    saguão   bilheteria (compre o ingresso!), catracas, lanchonete, loja do time, telão com o placar
  //    campo    gramado de verdade, traves, arquibancadas com torcida, bancos de reservas,
  //             jogo de futebol com 22 jogadores e árbitro (13h às 19h), seguranças contra invasão de campo
  // =====================================================================
  const VERDE = '#2a8a3a';
  const OPONENTES = ['RIBEIRÃO FC', 'ATLÉTICO NORTE', 'PORTO UNIDO', 'VALE VERDE', 'NOVO HORIZONTE', 'FAZENDA FC'];
  const dia = S => Math.floor(S.dayT);
  // fase do dia: treino 8h-12h, chegando 12h-13h, jogo 13h-19h, vazio no resto
  const fase = S => { const h = L.hora(S); return h >= 13 && h < 19 ? 'jogo' : h >= 12 && h < 13 ? 'chegando' : h >= 8 && h < 12 ? 'treino' : 'vazio'; };
  const minutoJogo = S => clamp((L.hora(S) - 13) / 6 * 95, 0, 95);      // 0 a 95 (inclui o intervalo)
  const adversario = S => OPONENTES[dia(S) % OPONENTES.length];
  // o placar do dia (fica em S.estadio; quem está longe do campo "perde" gols de forma sorteada)
  function sincroniza(S) {
    let e = S.estadio;
    if (!e || e.dia !== dia(S)) e = S.estadio = { dia: dia(S), placar: [0, 0], min: 0 };
    if (fase(S) === 'jogo') {
      const m = minutoJogo(S), dm = m - e.min;
      if (dm > 0.6) { for (let i = 0; i < Math.floor(dm); i++) [0, 1].forEach(t => { if (Math.random() < 0.011) e.placar[t]++; }); e.min = m; }
      else if (dm > 0) e.min = m;
    }
    return e;
  }
  function textoPlacar(S) {
    const e = sincroniza(S), f = fase(S), fora = adversario(S), nome = 'MUNICIPAL ' + e.placar[0] + ' x ' + e.placar[1] + ' ' + fora;
    if (f === 'jogo') { const m = minutoJogo(S); return [nome, m < 45 ? '1º TEMPO  ' + Math.floor(m) + "'" : m < 50 ? 'INTERVALO' : m < 95 ? '2º TEMPO  ' + Math.floor(m - 5) + "'" : 'FIM DE JOGO']; }
    if (f === 'chegando') return ['HOJE ÀS 13H', 'MUNICIPAL x ' + fora];
    if (f === 'treino') return ['TREINO ABERTO', 'JOGO HOJE ÀS 13H'];
    return e.min > 0 ? ['ÚLTIMO JOGO', nome] : ['PRÓXIMO JOGO', 'MUNICIPAL x ' + fora];
  }
  const temIngresso = S => !!(S.ingressoEstadio && S.ingressoEstadio.dia === dia(S));

  function menuBilheteria(S, R) {
    const f = fase(S);
    const vende = (nome, preco, tipo, desc) => ({ n: nome + ' — $' + preco, desc, fn: S2 => {
      if (temIngresso(S2)) { G.say('Você já tem ingresso para hoje.', 3); return; }
      if (f === 'vazio') { G.say('A bilheteria só abre de manhã até as 19h.', 3.5); return; }
      K.compra(S2, preco, () => { S2.ingressoEstadio = { dia: dia(S2), tipo }; G.say('Ingresso ' + tipo + ' comprado! Passe pelas catracas e entre no campo.', 4.5); });
    } });
    L.abrirMenu(S, { titulo: 'BILHETERIA — ESTÁDIO MUNICIPAL', rodape: 'W/S escolher  ·  E confirmar  ·  ESC sair', info: S2 => temIngresso(S2) ? 'ingresso: ' + S2.ingressoEstadio.tipo : '$' + Math.floor(S2.save.money), itens: [
      vende('Arquibancada', 30, 'comum', 'bancos de concreto, junto da torcida'),
      vende('Camarote', 100, 'camarote', 'cadeira cativa, vista de cima do gramado'),
      { n: 'Ver o jogo de hoje', desc: 'placar e horário', fn: S2 => G.say(textoPlacar(S2).join('  ·  '), 5) },
      { n: 'Fechar', fn: () => 'fechar' }] });
  }
  function menuLanchonete(S, R) {
    const it = (n, preco, hp, msg, bebado) => ({ n: n + ' — $' + preco, desc: '+' + hp + ' vida', fn: S2 => K.compra(S2, preco, () => { K.cura(S2, hp); if (bebado) S2.bebado = (S2.bebado || 0) + bebado; G.say(msg + ' (+' + hp + ' vida)' + (bebado ? ' — a cabeça roda...' : ''), 3.5); }) });
    L.abrirMenu(S, { titulo: 'LANCHONETE DO ESTÁDIO', rodape: 'W/S escolher  ·  E confirmar  ·  ESC sair', info: S2 => '$' + Math.floor(S2.save.money), itens: [
      it('Pastel de carne', 8, 15, 'Pastel quentinho!'), it('Cachorro-quente', 10, 18, 'Dogão com purê e batata palha!'), it('Refrigerante', 5, 6, 'Gelado, do jeito que tem que ser.'),
      it('Cerveja gelada', 9, 8, 'Saúde! Hoje é dia de jogo.', 8), { n: 'Fechar', fn: () => 'fechar' }] });
  }
  function menuLoja(S, R) {
    const it = (n, preco, msg, flag) => ({ n: n + ' — $' + preco, desc: S.save[flag] ? 'você já tem' : 'orgulho do clube', fn: S2 => { if (S2.save[flag]) { G.say('Você já tem esse item.', 3); return; } K.compra(S2, preco, () => { S2.save[flag] = true; G.say(msg, 4); }); } });
    L.abrirMenu(S, { titulo: 'LOJA OFICIAL DO MUNICIPAL', rodape: 'W/S escolher  ·  E confirmar  ·  ESC sair', info: S2 => '$' + Math.floor(S2.save.money), itens: [
      it('Camisa do time', 80, 'Camisa verde e branca do Municipal! Agora você é torcedor de carteirinha.', 'camisaTime'),
      it('Cachecol', 30, 'Cachecol do Municipal. Bom para o frio e para cantar.', 'cachecolTime'),
      it('Bandeira', 25, 'Bandeira do clube para balançar na arquibancada.', 'bandeiraTime'),
      { n: 'Fechar', fn: () => 'fechar' }] });
  }

  // ---------- saguão ----------
  function estEntrada(lg) {
    const pl = lg.place, w = 900, h = 430;
    const R = L.novaSala({ place: pl, w, h, nome: pl.nome || 'ESTÁDIO MUNICIPAL', cor: VERDE, piso: 'ladrilho_g', pisoCores: ['#cfcbc2', '#b9b5ac'], parede: '#d9d6cc', estiloParede: 'concreto', lambri: VERDE, lambriAlt: 30, rodape: '#1f6a2c', capacho: VERDE, subtitulo: 'bilheteria e portões', luzes: [{ x: 300, y: 330, r: 360 }, { x: 760, y: 330, r: 360 }, { x: 520, y: 250, r: 300 }] });
    R.chegada = { x: R.portaX, y: R.y1 + 10 };
    const add = (...a) => R.objs.push(...a), S0 = G.S, f0 = S0 ? fase(S0) : 'jogo';
    const cx = 520;
    // portão do campo, catracas e fiscal
    add(porta(465, 96, 110, { cor: VERDE, placa: 'CAMPO', label: 'ENTRAR NO CAMPO (PORTÃO A)', act: S => entrarCampo(S, R) }));
    [300, 352, 404, 592, 644, 696].forEach(x => add(O('catraca', x, 236, 44, 40, { e: 36, solid: true })));
    add(O('bandeira', 428, 178, 24, 16, { e: 92, pais: 'br', solid: false }), O('bandeira', 592, 178, 24, 16, { e: 92, pais: 'sp', solid: false }));
    R.npcs.push({ x: 478, y: 262, p: look({ shirt: '#f2d82a', pants: '#16181e', sleeve: 'curta', cap: 'swat' }), falas: ['Ingresso, por favor! Sem ingresso não passa.', 'Compre na bilheteria, à esquerda.', 'Jogo hoje a partir das 13h!'], h: 0, fixo: true, nome: 'Fiscal Dirceu', dinheiro: 25, label: 'CONVERSAR' });
    // telão com o placar ao vivo
    add(O('placar', 610, 78, 150, 46, { solid: false, k: 1, fnTexto: () => textoPlacar(G.S) }));
    // bilheteria e fila
    add(O('recepcao', 90, 196, 210, 38, { e: 30, top: '#f4efe0', front: VERDE, label: 'COMPRAR INGRESSO', r: 60, act: S => menuBilheteria(S, R) }));
    add(O('vidro_guiche', 90, 240, 210, 6, { e: 54, solid: false, k: 250 }));
    R.npcs.push({ x: 195, y: 178, k: 245, p: look({ fem: true, shirt: '#2a8a3a', pants: '#23232c', sleeve: 'curta', hairStyle: 'coque' }), falas: ['Arquibancada $30, camarote $100. Qual vai ser?', 'O jogo começa às 13h, viu?', 'Sem ingresso não entra no campo.'], h: Math.PI, fixo: true, nome: 'Bilheteira Sônia', dinheiro: 140, label: 'CONVERSAR' });
    add(O('fila', 100, 296, 70, 12, { e: 26, solid: false }), O('fila', 215, 296, 70, 12, { e: 26, solid: false }), O('fila', 100, 372, 70, 12, { e: 26, solid: false }), O('fila', 215, 372, 70, 12, { e: 26, solid: false }));
    const nFila = f0 === 'chegando' ? 4 : f0 === 'jogo' ? 2 : 0, falaF = ['Esse ano o Municipal leva!', 'A fila anda devagar...', 'Trouxe até a bandeira.', 'Vim com a família toda.'];
    for (let i = 0; i < nFila; i++) R.npcs.push({ x: 192, y: 282 + i * 28, p: look({ shirt: pick(['#2a9a4a', '#f4f4f4', '#2a9a4a', '#d8d8d8']) }), falas: [pick(falaF)], h: 0, semColisao: true, nome: pick(['Torcedor', 'Torcedora']), dinheiro: Math.round(rand(10, 70)) });
    // loja do time (canto de baixo, à esquerda)
    add(O('arara', 92, 430, 120, 30, { e: 40, tema: 'camisa', label: 'LOJA OFICIAL DO TIME', r: 52, act: S => menuLoja(S, R) }), O('arara', 232, 430, 120, 30, { e: 40, tema: 'camisa', label: 'LOJA OFICIAL DO TIME', r: 52, act: S => menuLoja(S, R) }));
    add(O('manequim', 380, 440, 30, 30, { e: 64, cor: '#2a9a4a' }), O('manequim', 420, 440, 30, 30, { e: 64, cor: '#f4f4f4' }), O('mesa_expo', 120, 510, 130, 50, { e: 24, tema: 'roupas', label: 'LOJA OFICIAL DO TIME', r: 50, act: S => menuLoja(S, R) }));
    R.npcs.push({ x: 300, y: 515, p: look({ fem: true, shirt: '#2a9a4a', pants: '#23232c', sleeve: 'curta' }), falas: ['A camisa nova está linda, né?', 'Cachecol e bandeira também, olha só!', 'Aqui é a loja oficial do Municipal.'], h: Math.PI, fixo: true, nome: 'Vendedora Tânia', dinheiro: 90, label: 'LOJA DO TIME', act: S => menuLoja(S, R) });
    // lanchonete (canto de cima, à direita) e mesinhas
    add(O('balcao', 780, 196, 190, 40, { e: 28, itens: 'pastel', top: '#e8dcc0', front: VERDE, label: 'LANCHONETE DO ESTÁDIO', r: 60, act: S => menuLanchonete(S, R) }));
    R.npcs.push({ x: 860, y: 176, k: 245, p: look({ shirt: '#f4f4f4', pants: '#23232c', sleeve: 'curta', cap: 'chef' }), falas: ['Pastel quentinho, quem vai querer?', 'Cerveja gelada pra comemorar!', 'Dogão com batata palha, o melhor do estádio.'], h: Math.PI, fixo: true, nome: 'Seu Zé do Pastel', dinheiro: 80, label: 'PEDIR LANCHE', act: S => menuLanchonete(S, R) });
    add(O('banqueta', 800, 250, 26, 26, { cor: VERDE }), O('banqueta', 850, 250, 26, 26, { cor: VERDE }), O('banqueta', 900, 250, 26, 26, { cor: VERDE }));
    [[790, 340], [890, 340]].forEach(([mx, my]) => { add(O('mesa', mx, my, 54, 44, { e: 18, estilo: 'lanche' })); add(O('cadeira', mx - 29, my + 8, 26, 26, { dir: 'w', estilo: 'plastico', cor: '#f2f2f2', solid: false, k: my + 8 }), O('cadeira', mx + 57, my + 8, 26, 26, { dir: 'e', estilo: 'plastico', cor: VERDE, solid: false, k: my + 8 })); });
    add(O('banco_espera', 760, 470, 170, 26, { e: 16, label: 'SENTAR', r: 30, act: S => { K.cura(S, 3); G.say('Você descansou um pouco. (+3 vida)', 2.5); } }));
    add(O('bebedouro', 936, 400, 36, 36, { e: 62, label: 'BEBER ÁGUA', r: 40, act: S => { K.cura(S, 2); G.snd.beep(); G.say('Água geladinha. (+2 vida)', 2.5); } }));
    add(O('planta', 84, 560, 40, 50, { variante: 'folhagem' }), O('planta', 940, 530, 40, 50, {}));
    // torcedores passeando
    if (f0 !== 'vazio' && f0 !== 'treino') {
      R.passeio = [];
      for (let i = 0; i < 3; i++) { const n = { x: rand(330, 740), y: rand(330, 400), p: look({ shirt: pick(['#2a9a4a', '#f4f4f4', '#2a9a4a']), pat: Math.random() < 0.3 ? 'listra' : 'liso' }), falas: pick([['Hoje a vitória é nossa!', 'Alguém viu o meu ingresso?'], ['Vim só pelo pastel.', 'Está lotado hoje, hein?'], ['Meu time, meu amor!', 'Quanto tá o jogo?']]), h: 0, nome: pick(['Torcedor', 'Torcedora', 'Seu Chico']), dinheiro: Math.round(rand(10, 80)) }; R.npcs.push(n); R.passeio.push(n); }
    }
    R.onUpdate = (S, R2, dt) => {
      R2.tp = (R2.tp || 0) - dt; if (R2.tp > 0 || !R2.passeio) return; R2.tp = rand(3, 7);
      const n = pick(R2.passeio); if (n.alvo || (n.rota && n.rota.length)) return;
      L.rota(n, [{ x: rand(330, 740), y: rand(330, 400) }, { x: rand(330, 740), y: rand(330, 420) }]);
    };
    // chão: escudo do clube no meio do saguão
    R.pisoExtra = x => {
      const ex = 560, ey = 470;
      x.fillStyle = 'rgba(0,0,0,0.16)'; x.beginPath(); x.ellipse(ex + 3, ey + 4, 66, 50, 0, 0, TAU); x.fill();
      x.fillStyle = VERDE; x.beginPath(); x.ellipse(ex, ey, 64, 48, 0, 0, TAU); x.fill(); x.strokeStyle = '#f4f4f4'; x.lineWidth = 4; x.stroke();
      x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 1.5; x.beginPath(); x.ellipse(ex, ey, 54, 39, 0, 0, TAU); x.stroke();
      x.fillStyle = '#f4f4f4'; x.beginPath(); x.arc(ex, ey - 6, 15, 0, TAU); x.fill(); x.fillStyle = '#16181e'; for (let k = 0; k < 5; k++) { const a = k * TAU / 5 - Math.PI / 2; x.beginPath(); x.arc(ex + Math.cos(a) * 8, ey - 6 + Math.sin(a) * 8, 3.2, 0, TAU); x.fill(); } x.beginPath(); x.arc(ex, ey - 6, 4, 0, TAU); x.fill();
      x.fillStyle = '#f4f4f4'; x.font = 'bold 12px Arial'; x.textAlign = 'center'; x.fillText('MUNICIPAL', ex, ey + 25); x.textAlign = 'left';
      // faixa de pedestres do portão e setas
      x.fillStyle = 'rgba(255,255,255,0.65)'; for (let k = 0; k < 6; k++) x.fillRect(472 + k * 18, 286, 12, 60);
    };
    R.deco = x => {
      // letreiro principal
      x.fillStyle = 'rgba(0,0,0,0.3)'; rr(x, 342, 80, 360, 44, 7); x.fill();
      x.fillStyle = VERDE; rr(x, 338, 76, 360, 44, 7); x.fill(); x.strokeStyle = '#f4f4f4'; x.lineWidth = 3; rr(x, 342, 80, 352, 36, 5); x.stroke();
      x.save(); x.textAlign = 'center'; x.fillStyle = '#f4f4f4'; x.font = 'bold 22px Georgia'; x.fillText(pl.nome || 'ESTÁDIO MUNICIPAL', 518, 104); x.font = 'bold 9px Arial'; x.fillStyle = '#ffe04a'; x.fillText('PORTÃO A · ARQUIBANCADAS E CAMAROTE', 518, 114); x.restore();
      // bilheteria: letreiro e tabela de preços
      x.fillStyle = '#16181e'; rr(x, 96, 74, 200, 26, 4); x.fill(); x.fillStyle = '#ffe04a'; x.font = 'bold 17px Arial'; x.textAlign = 'center'; x.fillText('BILHETERIA', 196, 93); x.textAlign = 'left';
      D.quadroNegro(x, 110, 106, 172, 36, [['Arquibancada', '$30'], ['Camarote', '$100']], 'INGRESSOS');
      // lanchonete: cardápio
      x.fillStyle = '#16181e'; rr(x, 784, 74, 182, 26, 4); x.fill(); x.fillStyle = '#ffe04a'; x.font = 'bold 15px Arial'; x.textAlign = 'center'; x.fillText('LANCHONETE', 875, 92); x.textAlign = 'left';
      D.quadroNegro(x, 800, 106, 150, 36, [['Pastel', '$8'], ['Dogão', '$10']], 'CARDÁPIO');
      // faixas de campeão, cartaz da tabela e relógio
      [[330, 'CAMPEÃO', '1998'], [780, 'CAMPEÃO', '2011']].forEach(([bx, t1, t2]) => { x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(bx + 3, 70, 30, 66); x.fillStyle = '#f4f4f4'; x.beginPath(); x.moveTo(bx, 66); x.lineTo(bx + 30, 66); x.lineTo(bx + 30, 130); x.lineTo(bx + 15, 120); x.lineTo(bx, 130); x.closePath(); x.fill(); x.fillStyle = VERDE; x.fillRect(bx, 66, 30, 8); x.font = 'bold 6.5px Arial'; x.textAlign = 'center'; x.fillText(t1, bx + 15, 88); x.fillText(t2, bx + 15, 98); x.fillStyle = '#c8a24a'; x.beginPath(); x.arc(bx + 15, 110, 5, 0, TAU); x.fill(); x.textAlign = 'left'; });
      D.relogio(x, 340, 132, 8, '#f6f6f2');
      x.fillStyle = VERDE; x.fillRect(70, 140, 900, 3);
    };
    return R;
  }
  function entrarCampo(S, R) {
    const f = fase(S);
    if ((f === 'jogo' || f === 'chegando') && !temIngresso(S)) { G.say('Fiscal: "Sem ingresso você não passa! A bilheteria fica à esquerda."', 4.5); return; }
    if (f === 'jogo' || f === 'chegando') G.say('Ingresso conferido. Bom jogo!', 2.5);
    irPara(S, 'campo', 1300, 840);
  }

  // ---------- campo de jogo ----------
  const P = { x: 230, y: 250, w: 1000, h: 650 }, CY = P.y + P.h / 2;
  const FORM = [[0.04, 0.5], [0.2, 0.14], [0.2, 0.38], [0.2, 0.62], [0.2, 0.86], [0.42, 0.24], [0.42, 0.5], [0.42, 0.76], [0.64, 0.2], [0.68, 0.5], [0.64, 0.8]];   // goleiro, 4 zagueiros, 3 meias, 3 atacantes
  const KIT = [{ shirt: '#2a9a4a', pants: '#f4f4f4' }, { shirt: '#f4f4f4', pants: '#2a3a8a' }];
  const KIT_GOL = [{ shirt: '#f2d82a', pants: '#16181e' }, { shirt: '#e8602a', pants: '#16181e' }];
  const NOMES = ['Neto', 'Gabriel', 'Rafa', 'Bruno', 'Léo', 'Thiago', 'Caio', 'Dudu', 'Lucas', 'Pedro', 'Ronaldo'];
  const mover = (n, a, v) => { if (Math.hypot(a.x - n.x, a.y - n.y) < 6) { n.alvo = null; return; } n.alvo = { x: a.x, y: a.y }; n.v = v; };
  // onde o jogador fica: formação, puxada para o lado da bola (quem tem a bola avança)
  function posForm(time, i, bx, by, ataca) {
    const f = FORM[i]; let fx = f[0];
    if (i > 0) fx = ataca ? Math.min(0.92, fx + 0.14) : Math.max(0.05, fx - 0.06);
    const gx = P.x + (time ? 1 - fx : fx) * P.w, gy = P.y + f[1] * P.h;
    if (i === 0) return { x: gx, y: CY + clamp((by - CY) * 0.22, -46, 46) };
    return { x: gx + (bx - gx) * 0.3, y: gy + (by - gy) * 0.3 };
  }
  function campoConfig(R, S, f) {
    R.npcs = R.npcs.filter(n => !n.doCampo);
    R.faseAtual = f; R.jogo = null; R.bola.invisivel = true; R.segs = null; R.invasao = 0;
    const poe = n => { n.doCampo = true; n.semColisao = true; n.ameacavel = false; n.label = n.label || 'CONVERSAR'; R.npcs.push(n); return n; };
    const h = L.hora(S);
    // seguranças nos cantos do campo
    R.guardas = [[190, 290], [1270, 290], [190, 870], [1270, 870]].map(([x, y], i) => { const g = poe({ x, y, home: { x, y }, p: look({ shirt: '#f2d82a', pants: '#16181e', sleeve: 'curta', cap: 'swat' }), falas: ['Fique fora do gramado!', 'Invasão de campo dá multa e confusão.', 'Aqui eu fico de olho em todo mundo.'], h: i < 2 ? Math.PI : 0, nome: 'Segurança ' + ['Rui', 'Dida', 'Beto', 'Nando'][i], dinheiro: 20, v: 60 }); g.ameacavel = true; return g; });
    if (f !== 'jogo' && f !== 'treino') {
      R.guardas.forEach(g => { R.npcs.splice(R.npcs.indexOf(g), 1); }); R.guardas = [];
      if (h >= 6 && h < 20) { R.jardim = [0, 1].map(i => poe({ x: P.x + 60 + i * 400, y: P.y + 80 + i * 300, p: look({ shirt: '#e8872a', pants: '#3a4a6a', sleeve: 'curta', cap: 'hat' }), falas: ['Gramado é coisa séria, viu?', 'Hoje o jogo vai ser bonito.'], h: 0, nome: i ? 'Jardineiro Nilton' : 'Jardineiro Dedé', dinheiro: 15, v: 54 })); }
      return;
    }
    const J = R.jogo = { treino: f === 'treino', t: 0, b: { x: P.x + P.w / 2, y: CY, z: 0, vx: 0, vy: 0, vz: 0, rot: 0 }, dono: null, ultimo: null, ultimoT: 0, tAcao: 1, pausa: 0, espera: 1.5, golT: 0, jog: [[], []], todos: [] };
    R.bola.invisivel = false;
    [0, 1].forEach(t => FORM.forEach((_, i) => {
      const pp = posForm(t, i, P.x + P.w / 2, CY, false);
      const n = poe({ x: pp.x, y: pp.y, p: look(Object.assign({ sleeve: 'curta', shoe: '#16181e', pat: 'liso' }, i === 0 ? KIT_GOL[t] : KIT[t])), h: t ? -Math.PI / 2 : Math.PI / 2, v: 80, falas: ['Agora não, tô no jogo!', 'Sai do gramado, torcedor!', 'Passa a bola!'], nome: (i + 1) + ' ' + NOMES[i], dinheiro: 0, time: t, idx: i });
      J.jog[t].push(n); J.todos.push(n);
    }));
    J.ref = poe({ x: P.x + P.w / 2 - 60, y: CY + 50, p: look({ shirt: '#16181e', pants: '#16181e', sleeve: 'curta' }), falas: ['Cartão amarelo pra você, torcedor!', 'Fora do gramado!'], h: 0, nome: 'Árbitro Silva', dinheiro: 0, v: 70 });
    // reservas sentados nos bancos e técnicos em pé
    [0, 1].forEach(t => { for (let i = 0; i < 4; i++) poe({ x: (t ? 845 : 445) + i * 34, y: 958, p: look(Object.assign({ sleeve: 'curta' }, KIT[t])), sentado: true, h: Math.PI, falas: ['Quero entrar logo!', 'O professor vai me colocar.'], nome: 'Reserva ' + (12 + i), dinheiro: 0 }); poe({ x: t ? 1030 : 640, y: 925, p: look({ shirt: t ? '#2a3a8a' : '#1f6a2c', pants: '#23232c', sleeve: 'longa' }), falas: ['Marca! Fecha o meio!', 'Sobe o time!'], h: Math.PI, nome: t ? 'Técnico Marquinhos' : 'Técnico Gilmar', dinheiro: 0 }); });
    saque(R, J, 0, true);
  }
  // bola no meio; quem saca vai até lá (inicio = todo mundo já em formação)
  function saque(R, J, quem, inicio) {
    const b = J.b; b.x = P.x + P.w / 2; b.y = CY; b.z = 0; b.vx = b.vy = b.vz = 0; J.dono = null; J.espera = inicio ? 0.5 : 3; J.pausa = 0; J.quem = quem;
    if (inicio) J.todos.forEach(n => { const pp = posForm(n.time, n.idx, b.x, b.y, false); n.x = pp.x; n.y = pp.y; });
    const k = J.jog[quem][7]; if (inicio) { k.x = b.x - 14 * (quem ? -1 : 1); k.y = b.y; }
  }
  function marcou(R, S, J, time) {
    const E = sincroniza(S); if (!J.treino) E.placar[time]++;
    J.golT = 5; J.pausa = 3.8; J.dono = null; J.b.vx = J.b.vy = 0; J.b.z = 0; J.marcou = time;
    J.artilheiro = J.ultimo && J.ultimo.time === time && J.ultimo.idx > 0 ? J.ultimo : J.jog[time][9];
    if (S.inside === R) { const nome = time ? adversario(S) : 'MUNICIPAL'; G.say('GOOOOL do ' + nome + '! MUNICIPAL ' + E.placar[0] + ' x ' + E.placar[1] + ' ' + adversario(S), 5); if (G.snd && G.snd.cash) G.snd.cash(); }
  }
  function passa(J, d) {
    const dir = d.time ? -1 : 1; let best = null, bs = -1e9;
    J.jog[d.time].forEach(m => { if (m === d || m.idx === 0) return; const dist = Math.hypot(m.x - d.x, m.y - d.y); if (dist < 60) return; const sc = (m.x - d.x) * dir * 0.7 - dist * 0.25 + Math.random() * 90; if (sc > bs) { bs = sc; best = m; } });
    if (!best) best = J.jog[d.time][1 + ((Math.random() * 10) | 0)];
    const dx = best.x - d.x, dy = best.y - d.y, dist = Math.hypot(dx, dy) || 1, v = Math.max(160, dist * 1.2), b = J.b;
    b.vx = dx / dist * v; b.vy = dy / dist * v; b.vz = 0; J.dono = null; J.ultimo = d; J.ultimoT = 0.35;
  }
  function chuta(J, d) {
    const dir = d.time ? -1 : 1, gx = d.time ? P.x : P.x + P.w, b = J.b, r = Math.random();
    let ty = CY + (Math.random() - 0.5) * 60;
    if (r > 0.45) ty = CY + (Math.random() < 0.5 ? -1 : 1) * rand(50, 120);       // pra fora
    const dx = gx + dir * 16 - d.x, dy = ty - d.y, dist = Math.hypot(dx, dy) || 1, v = 560;
    b.vx = dx / dist * v; b.vy = dy / dist * v; b.vz = rand(0, 70); J.dono = null; J.ultimo = d; J.ultimoT = 0.3;
    const gk = J.jog[1 - d.time][0]; if (r > 0.14 && r <= 0.45) { gk.chute = 1.2; gk.alvoY = ty; }      // defesa do goleiro
  }
  function passo(R, S, dt) {
    const J = R.jogo; if (!J) return;
    const b = J.b, m = minutoJogo(S), E = sincroniza(S);
    if (!J.treino) E.min = m;
    J.t += dt; J.ultimoT -= dt; if (J.golT > 0) J.golT -= dt;
    const intervalo = !J.treino && m >= 45 && m < 50, acabou = !J.treino && m >= 95;
    if (intervalo || acabou) {      // intervalo: todos vão para o túnel; fim: roda no meio do campo
      J.dono = null; J.parado = true;
      J.todos.concat([J.ref]).forEach((n, k) => mover(n, intervalo ? { x: R.portaX - 60 + (k % 8) * 18, y: R.y1 - 100 - ((k / 8) | 0) * 22 } : { x: P.x + P.w / 2 + Math.cos(k * 1.7) * 70, y: CY + Math.sin(k * 1.7) * 50 }, 90));
      R.bola.x = b.x - 5; R.bola.y = b.y - 5; R.bola.z = 0; return;
    }
    if (J.parado) { J.parado = false; saque(R, J, 1, false); }
    // ----- comemoração depois do gol -----
    if (J.pausa > 0) {
      J.pausa -= dt;
      J.todos.forEach(n => { if (n === J.artilheiro) mover(n, { x: J.marcou ? P.x + 20 : P.x + P.w - 20, y: P.y + P.h - 30 }, 140); else { const pp = posForm(n.time, n.idx, P.x + P.w / 2, CY, false); mover(n, pp, 80); } });
      if (J.pausa <= 0) saque(R, J, 1 - J.marcou, false);
    } else if (J.espera > 0) {     // esperando o saque: todos vão à formação
      J.espera -= dt;
      J.todos.forEach(n => { const pp = posForm(n.time, n.idx, b.x, b.y, false); if (n.time === J.quem && n.idx === 7) mover(n, { x: b.x - 10 * (n.time ? -1 : 1), y: b.y }, 100); else mover(n, pp, 90); });
    } else {
      // ----- bola -----
      const dono = J.dono;
      if (dono) {
        const dir = dono.time ? -1 : 1, gx = dono.time ? P.x : P.x + P.w;
        b.x += (dono.x + dir * 12 - b.x) * Math.min(1, dt * 14); b.y += (dono.y + 3 - b.y) * Math.min(1, dt * 14); b.z = 0;
        J.tAcao -= dt;
        J.todos.forEach(q => { if (q.time !== dono.time && Math.abs(q.x - dono.x) < 17 && Math.abs(q.y - dono.y) < 17 && Math.random() < dt * 0.9) { J.dono = null; J.ultimo = dono; J.ultimoT = 0.25; b.vx = rand(-90, 90); b.vy = rand(-90, 90); } });
        if (J.dono && J.tAcao <= 0) {
          const dist = Math.hypot(gx - dono.x, CY - dono.y), r = Math.random();
          if (dono.idx === 0) { passa(J, dono); J.tAcao = rand(0.8, 1.6); }
          else if (dist < 320 && r < 0.55) { chuta(J, dono); J.tAcao = rand(0.8, 1.6); }
          else if (r < 0.7) { passa(J, dono); J.tAcao = rand(0.8, 1.6); }
          else J.tAcao = rand(0.5, 1.2);
        }
      } else {
        b.x += b.vx * dt; b.y += b.vy * dt; b.vz -= 520 * dt; b.z = Math.max(0, b.z + b.vz * dt); if (b.z === 0 && b.vz < 0) b.vz = b.vz < -90 ? -b.vz * 0.35 : 0;
        const at = Math.pow(0.35, dt); b.vx *= at; b.vy *= at; b.rot += Math.hypot(b.vx, b.vy) * dt * 0.12;
        if (b.x < P.x - 2 || b.x > P.x + P.w + 2) {      // passou da linha de fundo
          const oeste = b.x < P.x;
          if (Math.abs(b.y - CY) < 36 && b.z < 36) marcou(R, S, J, oeste ? 1 : 0);
          else { const def = oeste ? 0 : 1; J.dono = J.jog[def][0]; J.tAcao = rand(1, 1.8); b.vx = b.vy = 0; }
        } else if (b.y < P.y - 2 || b.y > P.y + P.h + 2) {   // lateral: o adversário de quem tocou por último repõe
          const t2 = J.ultimo ? 1 - J.ultimo.time : 0; b.y = clamp(b.y, P.y, P.y + P.h); b.vx = b.vy = 0;
          let bn = null, bd = 1e9; J.jog[t2].forEach(q => { if (q.idx === 0) return; const d = Math.hypot(q.x - b.x, q.y - b.y); if (d < bd) { bd = d; bn = q; } });
          J.dono = bn; J.tAcao = rand(0.8, 1.4);
        }
        if (!J.dono && !(J.golT > 0 && J.pausa > 0)) J.todos.forEach(q => { if (J.dono) return; if (q === J.ultimo && J.ultimoT > 0) return; if (b.z < 18 && Math.abs(q.x - b.x) < 14 && Math.abs(q.y - b.y) < 14) { J.dono = q; J.tAcao = rand(0.5, 1.2); b.vx = b.vy = 0; } });
      }
      // ----- jogadores -----
      const ataca = t => !!(J.dono && J.dono.time === t);
      const chase = [null, null];
      [0, 1].forEach(t => { if (ataca(t)) return; let bd = 1e9; J.jog[t].forEach(q => { if (q.idx === 0) return; const d = Math.hypot(q.x - b.x, q.y - b.y); if (d < bd) { bd = d; chase[t] = q; } }); });
      J.todos.forEach(n => {
        if (n === J.dono) { const dir = n.time ? -1 : 1; mover(n, { x: clamp(n.x + dir * 70, P.x + 10, P.x + P.w - 10), y: clamp(n.y + (CY - n.y) * 0.3, P.y + 10, P.y + P.h - 10) }, 88); return; }
        if (n.chute > 0) { n.chute -= dt; mover(n, { x: n.x, y: clamp(n.alvoY, CY - 50, CY + 50) }, 150); return; }
        if (n === chase[n.time] && n.idx > 0) { mover(n, { x: b.x, y: b.y }, 104); return; }
        mover(n, posForm(n.time, n.idx, b.x, b.y, ataca(n.time)), n.idx === 0 ? 60 : 84);
      });
    }
    // árbitro e rosto dos jogadores parados virado para a bola
    mover(J.ref, { x: clamp(b.x - 50, P.x + 30, P.x + P.w - 30), y: clamp(b.y + 60, P.y + 30, P.y + P.h - 30) }, 70);
    J.todos.concat([J.ref]).forEach(n => { if (!n.alvo) n.h = Math.atan2(b.x - n.x, -(b.y - n.y)); });
    if (!isFinite(b.x + b.y)) { b.x = P.x + P.w / 2; b.y = CY; b.vx = b.vy = 0; }
    R.bola.x = b.x - 5; R.bola.y = b.y - 5; R.bola.z = b.z; R.bola.rot = b.rot;
  }
  // invasão de campo: depois de uns segundos no gramado, os seguranças vêm te tirar (multa)
  function vigia(R, S, dt) {
    if (S.inside !== R) return;
    const dentro = R.px > P.x - 4 && R.px < P.x + P.w + 4 && R.py > P.y - 4 && R.py < P.y + P.h + 4;
    if (R.invasao < 0) { R.invasao += dt; return; }
    if (dentro) {
      R.invasao += dt;
      if (R.invasao > 2.2 && !R.segs) { R.segs = R.guardas; G.say('INVASÃO DE CAMPO! Os seguranças estão vindo te pegar!', 4.5); if (G.snd && G.snd.fail) G.snd.fail(); }
    } else if (!dentro) { R.invasao = 0; if (R.segs) { R.segs = null; R.guardas.forEach(g => { g.alvo = null; L.rota(g, [g.home]); }); } }
    if (R.segs) R.segs.forEach(g => {
      g.rota = []; mover(g, { x: R.px, y: R.py }, 150);
      if (R.segs && Math.hypot(g.x - R.px, g.y - R.py) < 36) {
        const multa = Math.min(50, Math.floor(S.save.money)); S.save.money -= multa; G.save();
        R.px = R.portaX; R.py = R.y1 - 100; R.invasao = -4; const gs = R.segs; R.segs = null; gs.forEach(q => { q.alvo = null; L.rota(q, [q.home]); });
        G.say('Os seguranças tiraram você do gramado! Multa de $' + multa + '.', 5.5);
      }
    });
  }

  function estCampo(lg) {
    const pl = lg.place, w = 1300, h = 840;
    const R = L.novaSala({ place: pl, w, h, nome: 'CAMPO — ' + (pl.nome || 'ESTÁDIO MUNICIPAL'), cor: VERDE, piso: 'gramado', pisoCores: ['#3d8f3b', '#4aa046'], parede: '#bdb9ae', estiloParede: 'concreto', rodape: '#8a867c', capacho: '#6a6a6a', subtitulo: 'gramado e arquibancadas', luzes: [{ x: 380, y: 620, r: 540 }, { x: 1060, y: 620, r: 540 }, { x: 720, y: 330, r: 520 }] });
    R.chegada = { x: R.portaX, y: R.y1 + 10 };
    R.porta = { para: 'entrada', px: 520, py: 215, ph: Math.PI, label: 'VOLTAR AO SAGUÃO', rotulo: 'SAGUÃO' };
    const add = (...a) => R.objs.push(...a);
    const torcida = () => { const S = G.S, f = fase(S); return f === 'jogo' ? (R.jogo && R.jogo.golT > 0 ? 'gol' : 'jogo') : f === 'chegando' ? 'dia' : false; };
    const sentaAr = S => { const cam = S.ingressoEstadio && S.ingressoEstadio.dia === dia(S) && S.ingressoEstadio.tipo === 'camarote'; K.cura(S, cam ? 10 : 5); G.say('Você assistiu da ' + (cam ? 'cadeira do camarote' : 'arquibancada') + ': ' + textoPlacar(S).join(' · ') + ' (+' + (cam ? 10 : 5) + ' vida)', 5); };
    [90, 510, 930].forEach(x => add(O('arquibancada', x, 190, 420, 40, { e: 60, n: 5, cadeira: '#2f8a45', torcida, label: 'ASSISTIR DA ARQUIBANCADA', r: 80, act: sentaAr })));
    add(O('placar', 500, 76, 440, 46, { solid: false, k: 1, fnTexto: () => textoPlacar(G.S) }));
    // gols e bandeirinhas
    add(O('trave', P.x - 26, CY - 35, 26, 70, { dir: 'w', e: 44, solid: false }), O('trave', P.x + P.w, CY - 35, 26, 70, { dir: 'e', e: 44, solid: false }));
    [[P.x, P.y], [P.x + P.w, P.y], [P.x, P.y + P.h], [P.x + P.w, P.y + P.h]].forEach(([x, y]) => add(O('bandeirinha', x - 5, y - 5, 10, 10, { e: 28, solid: false })));
    // bancos de reservas e holofotes
    add(O('banco_reserva', 420, 944, 160, 28, { e: 46, cor: '#1f6a2c' }), O('banco_reserva', 820, 944, 160, 28, { e: 46, cor: '#2a3a8a' }));
    add(O('holofote', 96, 950, 20, 20, { e: 150, solid: true }), O('holofote', 1330, 950, 20, 20, { e: 150, solid: true }));
    // a bola
    R.bola = O('bola_jogo', P.x + P.w / 2 - 5, CY - 5, 10, 10, { solid: false, z: 0, rot: 0, invisivel: true }); add(R.bola);
    const faixas = ['BANCO DO POVO', 'PINGUIM CHOPP', 'AUTO CENTER', 'SUPER ATACADÃO', 'FARMÁCIA SAÚDE', 'PIZZARIA SABOR', 'POSTO RIBEIRÃO', 'CASAS LÍDER', 'ÓTICA VISÃO', 'TV CIDADE'];
    const cfx = ['#c8302a', '#2a58b8', '#f2c82a', '#2f9a4a', '#16181e', '#e8872a', '#7a3a9a', '#2a8a8a', '#d8a82a', '#e84a8a'];
    R.pisoExtra = x => {
      D.campoFutebol(x, P.x, P.y, P.w, P.h);
      x.fillStyle = 'rgba(255,255,255,0.35)'; [[420, 160], [820, 160]].forEach(([bx, bw]) => { x.fillRect(bx - 6, 906, bw + 12, 2); x.fillRect(bx - 6, 906, 2, 62); x.fillRect(bx + bw + 4, 906, 2, 62); });
    };
    R.deco = x => {
      // faixa de patrocinadores colada na muralha, atrás da arquibancada
      for (let i = 0; i < 10; i++) { const bx = 80 + i * 130; x.fillStyle = cfx[i]; x.fillRect(bx, 66, 126, 46); x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(bx, 66, 126, 3); x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(bx + 126, 66, 4, 46); }
      x.save(); x.textAlign = 'center'; x.font = 'bold 10px Arial'; x.fillStyle = '#fff'; for (let i = 0; i < 10; i++) if (i < 3 || i > 6) x.fillText(faixas[i], 80 + i * 130 + 63, 94); x.restore();
      // placas de publicidade de frente para o campo (norte)
      for (let i = 0; i < 10; i++) { const bx = P.x + i * 100; x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(bx + 2, 236, 98, 18); x.fillStyle = cfx[(i + 4) % 10]; x.fillRect(bx, 232, 98, 18); x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(bx, 232, 98, 2); x.fillStyle = '#fff'; x.font = 'bold 9px Arial'; x.textAlign = 'center'; x.fillText(faixas[(i + 4) % 10], bx + 49, 245); x.textAlign = 'left'; }
      // escudo no centro do túnel de acesso
      x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(R.portaX - 60, R.y1 - 6, 120, 6);
    };
    R.aoEntrar = (S, R2) => { const f = fase(S); if (R2.faseAtual !== f) campoConfig(R2, S, f); };
    R.onUpdate = (S, R2, dt) => {
      try {
        R2.tf = (R2.tf || 0) - dt;
        if (R2.tf <= 0) { R2.tf = 1; const f = fase(S); if (f !== R2.faseAtual) campoConfig(R2, S, f); }
        if (R2.jogo) { passo(R2, S, dt); vigia(R2, S, dt); }
        else if (R2.jardim) { R2.tj = (R2.tj || 0) - dt; if (R2.tj <= 0) { R2.tj = rand(5, 9); R2.jardim.forEach(g => { if (!g.alvo && !(g.rota && g.rota.length)) L.rota(g, [{ x: rand(P.x + 30, P.x + P.w - 30), y: g.y }, { x: rand(P.x + 30, P.x + P.w - 30), y: rand(P.y + 60, P.y + P.h - 60) }]); }); } }
      } catch (e) { R2.onUpdate = null; console.error('campo do estadio', e); }
    };
    campoConfig(R, G.S || { dayT: 0.3 }, G.S ? fase(G.S) : 'jogo');
    return R;
  }

  L.construtores['tipo:estadio'] = { criar(sid, lg) { return sid === 'campo' ? estCampo(lg) : estEntrada(lg); } };

})(window.G = window.G || {});
