/* =====================================================================
   ACADEMIA.JS — academia que FUNCIONA: compre o passe, treine e fique mais forte!
     • PASSE DO DIA na recepção ($15) — vale 24 horas do jogo
     • esteira = FÔLEGO (você corre mais rápido) · supino, halteres e saco de pancada = FORÇA (socos mais fortes)
     • cada treino é um mini-jogo: aperte E quando o ponteiro estiver na faixa verde
     • treinar cansa! Depois de 4 treinos seguidos beba água para descansar
     • tem instrutor, frequentadores treinando e uma lanchonete de suplementos
   ===================================================================== */
(function (G) {
  'use strict';
  const L = G.lugares, K = L.kit, W = G.world, SP = G.sprites, ALIM = L.ALIM;
  const O = K.O, pick = K.pick, rand = K.rand, TAU = Math.PI * 2;
  const ac = W.places.find(p => p.id === 'academia'); if (ac) ac.horario = [5, 23];
  const passe = S => S.save.passe && S.dayT < S.save.passe;

  // o saco de pancada
  K.tipos.saco = (ctx, o, t) => {
    const bal = Math.sin(t * 2 + o.x) * (o.bate > 0 ? 6 : 1.5), cx = o.x + o.w / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(cx + 4, o.y + o.h + 4, 14, 7, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#999'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, o.y - 58); ctx.lineTo(cx + bal * 0.4, o.y - 40); ctx.stroke();
    const g = ctx.createLinearGradient(cx - 12, 0, cx + 12, 0); g.addColorStop(0, '#d03a2a'); g.addColorStop(0.5, '#f06a4a'); g.addColorStop(1, '#8a1f14');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - 11 + bal * 0.4, o.y - 40); ctx.lineTo(cx + 11 + bal * 0.4, o.y - 40); ctx.lineTo(cx + 10 + bal, o.y + 2); ctx.lineTo(cx - 10 + bal, o.y + 2); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#222'; ctx.fillRect(cx - 11 + bal * 0.3, o.y - 24, 22, 3);
  };
  K.tipos.espelho = (ctx, o) => { ctx.fillStyle = '#0a0c12'; ctx.fillRect(o.x - 3, o.y - 3, o.w + 6, o.h + 6); const g = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h); g.addColorStop(0, '#a8c8e0'); g.addColorStop(0.5, '#e8f4ff'); g.addColorStop(1, '#88a8c8'); ctx.fillStyle = g; ctx.fillRect(o.x, o.y, o.w, o.h); };

  function cansa(S, R) { R.fadiga = (R.fadiga || 0) + 1; }
  function treinar(S, R, o, tipo) {
    if (!passe(S)) { G.say('Você precisa do PASSE DO DIA ($15). Fale com a recepcionista.', 3.5); return; }
    if ((R.fadiga || 0) >= 4) { G.say('Você está EXAUSTO! Beba água no bebedouro para recuperar o fôlego.', 3.5); return; }
    const forca = tipo !== 'cardio', max = 5, atual = forca ? (S.save.forca || 0) : (S.save.folego || 0);
    if (atual >= max) { G.say(forca ? 'Força no máximo! Você já é um touro (5/5).' : 'Fôlego no máximo (5/5)! Você corre como um atleta.', 3.5); return; }
    const cfg = { cardio: { t: 'CORRIDA NA ESTEIRA', reps: 4, v: 1.5, zona: 0.15, ok: 3 }, peso: { t: 'LEVANTAMENTO DE PESO', reps: 3, v: 1.3, zona: 0.16, ok: 2 }, saco: { t: 'SACO DE PANCADA', reps: 5, v: 1.7, zona: 0.14, ok: 4 } }[tipo];
    L.miniTiming(S, { titulo: cfg.t + '  —  ' + (forca ? 'Força ' : 'Fôlego ') + atual + '/5', reps: cfg.reps, v: cfg.v, zona: cfg.zona, cb: (S2, R2, ok) => {
      cansa(S2, R2); S2.player.hp = Math.max(1, S2.player.hp - 4);
      if (o) o.bate = 1.2;
      if (ok >= cfg.ok) { if (forca) S2.save.forca = (S2.save.forca || 0) + 1; else S2.save.folego = (S2.save.folego || 0) + 1; G.save(); G.snd.win && G.snd.win(); G.say('BOM TREINO! ' + (forca ? 'Força ' + S2.save.forca + '/5 — socos mais fortes!' : 'Fôlego ' + S2.save.folego + '/5 — você corre mais!'), 4.5); }
      else { G.say('Treino fraco (' + ok + '/' + cfg.reps + ' acertos). Tente de novo!', 3.5); }
    } });
  }
  function menuLanche(S, R) {
    const itens = [['agua', 3], ['energetico', 14], ['banana', 3], ['chocolate', 6], ['suco', 6]];
    L.abrirMenu(S, { titulo: 'LANCHONETE FIT', rodape: 'E comprar (vai para a mochila)  ·  ESC sair', itens: itens.map(([id, p]) => ({ n: ALIM[id].n, preco: p, cor: ALIM[id].cor, desc: 'recupera ' + ALIM[id].hp + ' de vida' + (ALIM[id].energia ? ' + energia (corre mais por um tempo)' : ''), fn: S2 => { if (!K.gasta(S2, p)) return; L.dar(S2, id, 1); G.save(); G.say(ALIM[id].n + ' na mochila (X para consumir).', 2.5); } })) });
  }

  L.construtores.academia = {
    criar(id, lg) {
      const pl = lg.place, S = G.S;
      const R = L.novaSala({ place: pl, w: 860, h: 480, nome: pl.nome, cor: pl.cor, piso: 'borracha', pisoCores: ['#2a2a32', '#3c3c46'], parede: '#34343f', portaX: 480, subtitulo: 'aberta das 5h às 23h' });
      R.fadiga = 0; R.chegada = { x: 480, y: 600 };
      const add = (...a) => R.objs.push(...a);
      const lk = o => Object.assign(SP.randomLook(), { acc: 'none' }, o);
      R.hudTxt = S2 => (passe(S2) ? 'PASSE ATIVO' : 'SEM PASSE') + '  ·  FORÇA ' + (S2.save.forca || 0) + '/5  ·  FÔLEGO ' + (S2.save.folego || 0) + '/5' + (R.fadiga >= 4 ? '  ·  EXAUSTO' : '');
      // recepção e lanchonete
      add(O('balcao', 110, 190, 190, 40, { e: 30, label: 'COMPRAR O PASSE DO DIA ($15)', r: 44, act: S2 => comprarPasse(S2) }));
      add(O('balcao', 760, 190, 150, 40, { e: 30, itens: 'bar', label: 'LANCHONETE FIT', r: 44, act: S2 => menuLanche(S2, R) }));
      // cardio
      for (let k = 0; k < 4; k++) add(O('esteira', 340 + k * 96, 190, 76, 60, { e: 16, label: 'CORRER NA ESTEIRA (FÔLEGO)', r: 40, act: (S2, R2, o) => treinar(S2, R2, o, 'cardio') }));
      // peso
      add(O('supino', 140, 330, 150, 60, { e: 14, label: 'SUPINO (FORÇA)', r: 40, act: (S2, R2, o) => treinar(S2, R2, o, 'peso') }));
      add(O('supino', 140, 450, 150, 60, { e: 14, label: 'SUPINO (FORÇA)', r: 40, act: (S2, R2, o) => treinar(S2, R2, o, 'peso') }));
      add(O('halteres', 380, 320, 160, 36, { e: 34, label: 'PEGAR HALTERES (FORÇA)', r: 40, act: (S2, R2, o) => treinar(S2, R2, o, 'peso') }));
      add(O('saco', 700, 360, 30, 30, { e: 0, solid: true, label: 'BATER NO SACO (FORÇA)', r: 44, act: (S2, R2, o) => treinar(S2, R2, o, 'saco') }), O('saco', 780, 360, 30, 30, { e: 0, solid: true, label: 'BATER NO SACO (FORÇA)', r: 44, act: (S2, R2, o) => treinar(S2, R2, o, 'saco') }));
      add(O('bebedouro', 90, 560, 36, 36, { e: 36, label: 'BEBER ÁGUA (DESCANSAR)', r: 40, act: S2 => { R.fadiga = Math.max(0, R.fadiga - 2); K.cura(S2, 4); G.say('Água geladinha! Você recuperou o fôlego. (+vida)', 3); } }));
      add(O('balanca', 880, 560, 40, 40, { e: 10, label: 'SUBIR NA BALANÇA', r: 40, act: S2 => G.say('Peso: ' + (78 + (S2.save.forca || 0) * 2) + ' kg  ·  Força ' + (S2.save.forca || 0) + '/5  ·  Fôlego ' + (S2.save.folego || 0) + '/5', 4.5) }));
      add(O('planta', 890, 460, 36, 44, {}));
      add(O('bloco', 560, 480, 160, 36, { e: 18, top: '#3a3e48', front: '#22252c', label: 'ALONGAR NO TAPETE', r: 36, act: S2 => { R.fadiga = Math.max(0, R.fadiga - 1); G.say('Você alongou bastante. (-1 cansaço)', 3); } }));
      R.deco = x => {
        x.fillStyle = '#e8402a'; x.font = 'bold 26px Arial Black, Arial'; x.textAlign = 'center'; x.fillText('ACADEMIA FORÇA TOTAL', 500, 102); x.textAlign = 'left';
        for (let k = 0; k < 4; k++) K.tipos.espelho(x, { x: 330 + k * 100, y: 66, w: 80, h: 56 });
        K.cartaz(x, 90, 70, 70, 40, '#e0b32a', ['SEM DOR', 'SEM GANHO']); K.cartaz(x, 800, 70, 70, 40, '#2a58b8', ['PASSE', '$15 / DIA']);
        x.fillStyle = 'rgba(255,255,255,0.05)'; for (let k = 0; k < 6; k++) x.fillRect(100 + k * 140, 400, 60, 4);
      };
      R.luzes = [{ x: 300, y: 380, r: 380 }, { x: 700, y: 380, r: 320 }];
      // gente treinando
      const h = L.hora(S), pico = (h > 6 && h < 9) || (h > 17 && h < 20), nCard = pico ? 3 : 1, nPeso = pico ? 2 : 1;
      for (let k = 0; k < nCard; k++) R.npcs.push({ x: 340 + k * 96 + 38, y: 208 + 4, p: lk({ sleeve: 'regata', pants: '#1c1c20' }), falas: ['Quase lá! Mais 5 minutos.', 'Não fale comigo, estou no ritmo!', 'Cardio é vida.'], h: 0, corre: true, fixo: true, k: 300, semColisao: true, nome: pick(G.vida.NOMES_M.concat(G.vida.NOMES_F)) });
      for (let k = 0; k < nPeso; k++) R.npcs.push({ x: 215, y: 370 + k * 120, p: lk({ sleeve: 'regata', fem: k === 1 }), falas: ['Sem dor, sem ganho!', 'Quer me dar uma força aqui?', 'Hoje é dia de peito.'], h: Math.PI, fixo: true, k: 460, nome: pick(G.vida.NOMES_M), semColisao: true });
      R.npcs.push({ x: 205, y: 172, p: lk({ shirt: '#e8402a', pat: 'liso', sleeve: 'regata', fem: true, hairStyle: 'rabo' }), falas: ['Bem-vindo à Força Total! O passe do dia custa $15.', 'Treine com moderação: depois de 4 séries, beba água.', 'Esteira dá fôlego e peso dá força!'], h: Math.PI, fixo: true, nome: 'Recepcionista', label: 'COMPRAR O PASSE ($15)', act: S2 => comprarPasse(S2), ameacavel: true, dinheiro: Math.round(rand(60, 220)), semColisao: true });
      R.npcs.push({ x: 835, y: 172, p: lk({ shirt: '#2ae0e8', pat: 'liso', sleeve: 'regata', fem: false, hairStyle: 'raspado' }), falas: ['Whey, energético, banana... o que vai ser?'], h: Math.PI, fixo: true, nome: 'Atendente', label: 'LANCHONETE FIT', act: S2 => menuLanche(S2, R), ameacavel: true, dinheiro: Math.round(rand(30, 100)), semColisao: true });
      R.npcs.push({ x: 480, y: 420, p: lk({ shirt: '#1a1a1a', pat: 'liso', sleeve: 'regata', fem: false, hairStyle: 'raspado', pants: '#e8402a' }), falas: ['Sem dor, sem ganho! Vamos treinar?', 'Cada treino aumenta a força dos seus socos.', 'Beba água! Hidratação é tudo.', 'Cinco treinos de peso e você vira um touro.', 'A esteira melhora o fôlego: você corre mais rápido!'], h: Math.PI, fixo: true, nome: 'Instrutor', ameacavel: true, dinheiro: Math.round(rand(20, 90)) });
      return R;
    }
  };
  function comprarPasse(S) {
    if (passe(S)) { G.say('Seu passe ainda está valendo (até o fim do dia).', 3); return; }
    if (!K.gasta(S, 15)) return;
    S.save.passe = S.dayT + 1; G.save(); G.say('Passe do dia comprado ($15)! Valendo por 24 horas do jogo. Bom treino!', 4.5); G.snd.cash();
  }
})(window.G = window.G || {});
