/* =====================================================================
   LUGARES.JS — a nossa cidade tem lugares para ENTRAR e objetos para USAR
     Fora:   prédios com letreiro (Pinguim, Mercadão, Teatro...), hidrantes,
             lixeiras, bancos, caixas de correio, bancas, máquinas, ônibus
             e pessoas para conversar (elas dão dicas e mostram o caminho)
     Dentro: salas desenhadas por código, com atendente e objetos para usar
   Tudo aqui usa E (interagir). Dentro dos lugares, ESC também sai.
   ===================================================================== */
(function (G) {
  'use strict';
  const SP = G.sprites, W = G.world, TAU = Math.PI * 2;
  const VW = 800, VH = 600;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const shade = SP.shade;
  const L = G.lugares = { PLACES: W.places };

  // ---------- visual do personagem (barbearia e loja de roupas mudam isso) ----------
  const CORTES = ['topete', 'curto', 'raspado', 'careca', 'afro', 'longo', 'rabo', 'coque'];
  const CORES_CAB = ['#1a1208', '#3a2412', '#7a5a2a', '#c9a24a', '#111111', '#8a8a8a', '#b3361e', '#3a6ad0'];
  const ROUPAS = [
    { shirt: '#e8832a', pat: 'hawaii', sleeve: 'curta' }, { shirt: '#1c1c22', pat: 'jaqueta', sleeve: 'longa' },
    { shirt: '#d33a3a', pat: 'liso', sleeve: 'curta' }, { shirt: '#3a7ad3', pat: 'listra', sleeve: 'curta' },
    { shirt: '#e8e8e8', pat: 'liso', sleeve: 'regata' }, { shirt: '#2f7a3a', pat: 'xadrez', sleeve: 'longa' },
    { shirt: '#8a4fc2', pat: 'liso', sleeve: 'curta' }, { shirt: '#e0b32a', pat: 'listra', sleeve: 'regata' }
  ];
  const CALCAS = ['#2f4f86', '#1c1c20', '#4a3a2a', '#6a5a46', '#3a3a3f', '#56688a', '#23232c'];
  const TENIS = ['#f2f2f2', '#121216', '#d33a3a', '#2a5ac8', '#3a2412', '#e0b32a'];
  const ACESS = [{ acc: 'shades', accCol: '#000000' }, { acc: 'none', accCol: '#000000' }, { acc: 'cap', accCol: '#d33a3a' }, { acc: 'cap', accCol: '#2a2a30' }, { acc: 'beanie', accCol: '#3a7ad3' }, { acc: 'hat', accCol: '#d2b074' }];
  L.aplicarLook = function (S) {
    S.save.forca = S.save.forca || 0;
    const lk = S.save.look = Object.assign({ corte: 0, cor: 0, roupa: 0, calca: 0, tenis: 0, acess: 0 }, S.save.look || {});
    const P = S.player, r = ROUPAS[lk.roupa % ROUPAS.length], a = ACESS[lk.acess % ACESS.length];
    Object.assign(P, { hairStyle: CORTES[lk.corte % CORTES.length], hair: CORES_CAB[lk.cor % CORES_CAB.length], shirt: r.shirt, pat: r.pat, sleeve: r.sleeve, pants: CALCAS[lk.calca % CALCAS.length], shoe: TENIS[lk.tenis % TENIS.length], acc: a.acc, accCol: a.accCol });
  };
  function mudaLook(S, campo, n) { S.save.look[campo] = ((S.save.look[campo] || 0) + 1) % n; L.aplicarLook(S); G.save(); }

  // ---------- dinheiro e vida ----------
  function gasta(S, v) {
    if (S.save.money < v) { G.say('Dinheiro insuficiente ($' + v + ').', 2.5); return false; }
    S.save.money -= v; G.snd.cash(); G.save(); return true;
  }
  function cura(S, n) { S.player.hp = Math.min(100, S.player.hp + n); }

  // ---------- falas (pessoas e atendentes) ----------
  const FALAS = [
    'Calor de Ribeirão não perdoa, hein?', 'Já tomou um chopp no Pinguim hoje?', 'Terra roxa, cana e sertanejo: isso aqui é Ribeirão!',
    'Cuidado com os carros por aí!', 'Esse trânsito está uma loucura...', 'Se estiver machucado, vá ao hospital.', 'A polícia anda de olho, viu?',
    'Que dia bonito!', 'Dizem que o Rei da Cidade tem quatro mil no bolso.', 'Passa no Mercadão, o pastel é bom demais!',
    'Vai ao Theatro Pedro II, é lindo!', 'Quer ficar forte? A academia tem esteira nova.', 'Sou daqui desde sempre. Ribeirão é a melhor!',
    'Se precisa de dinheiro, atenda os telefones amarelos.', 'Tem hidrante aberto? Aproveita e se refresca!'
  ];
  const DICAS = [
    'Dica: sente num banco da calçada para recuperar a vida.', 'Dica: as máquinas de refrigerante curam um pouquinho.',
    'Dica: nos pontos de ônibus você viaja pela cidade por $5.', 'Dica: a barbearia e o shopping mudam o seu visual.',
    'Dica: durma em casa para salvar o jogo e passar a noite.', 'Dica: fale com o padre para despistar a polícia.',
    'Dica: remexer lixeira às vezes rende uns trocados.', 'Dica: a academia aumenta a força dos seus socos.'
  ];
  const SAUDACOES = ['Opa!', 'Fala, campeão!', 'E aí?', 'Tudo bem?', 'Oi!', 'Eaí, parceiro!'];
  const MANCHETES = ['MANCHETE: Chopp do Pinguim é eleito o mais gelado do interior!', 'MANCHETE: Prefeitura promete menos buracos (de novo).', 'MANCHETE: Motorista de fusca verde é visto em alta velocidade.', 'MANCHETE: Theatro Pedro II tem sessão lotada.', 'MANCHETE: Pombos tomam conta da praça!', 'MANCHETE: Calor passa dos 38 graus em Ribeirão.', 'MANCHETE: Polícia reforça patrulhas à noite.'];

  const PONTOS = ['norte', 'nordeste', 'leste', 'sudeste', 'sul', 'sudoeste', 'oeste', 'noroeste'];
  function direcao(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y, d = Math.hypot(dx, dy);
    const k = Math.round((Math.atan2(dx, -dy) + TAU) % TAU / (TAU / 8)) % 8;
    return { nome: PONTOS[k], m: Math.round(d / 4 / 10) * 10 };
  }

  // balão de fala
  function bolha(p, txt, secs) { p.bub = { txt, t: secs || 3.5 }; }
  function desenhaBolha(ctx, x, y, txt, alpha) {
    ctx.save(); ctx.font = 'bold 10px Arial, sans-serif';
    const palavras = txt.split(' '), linhas = []; let cur = '';
    palavras.forEach(w => { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > 120 && cur) { linhas.push(cur); cur = w; } else cur = t; });
    linhas.push(cur);
    const w = Math.max(...linhas.map(l => ctx.measureText(l).width)) + 12, h = linhas.length * 12 + 8, bx = x - w / 2, by = y - 26 - h;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; W.rrect(ctx, bx + 2, by + 3, w, h, 5); ctx.fill();
    ctx.fillStyle = '#ffffff'; W.rrect(ctx, bx, by, w, h, 5); ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 4, by + h - 0.5); ctx.lineTo(x, by + h + 6); ctx.lineTo(x + 4, by + h - 0.5); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.fillStyle = '#111'; ctx.textAlign = 'center'; linhas.forEach((l, i) => ctx.fillText(l, x, by + 13 + i * 12));
    ctx.restore();
  }

  // ---------- transição (tela preta rápida) ----------
  L.trans = function (S, cb) { if (S.trans) return; S.trans = { t: 0, cb, feito: false }; };
  L.atualizarTrans = function (S, dt) {
    const T = S.trans; if (!T) return;
    T.t += dt / 0.26;
    if (!T.feito && T.t >= 1) { T.feito = true; T.cb(); }
    if (T.t >= 2) S.trans = null;
  };
  L.desenharTrans = function (ctx, S) {
    const T = S.trans; if (!T) return;
    ctx.fillStyle = 'rgba(0,0,0,' + clamp(T.t < 1 ? T.t : 2 - T.t, 0, 1) + ')'; ctx.fillRect(0, 0, VW, VH);
  };

  // =====================================================================
  //  FORA: objetos da cidade, pessoas e lugares
  // =====================================================================
  const INTERATIVOS = { hidrante: 'ABRIR HIDRANTE', lixeira: 'REMEXER LIXEIRA', banco: 'SENTAR NO BANCO', correio: 'ABRIR CAIXA DE CORREIO', banca: 'COMPRAR JORNAL ($2)', maquina: 'COMPRAR REFRIGERANTE ($4)', ponto: 'PEGAR ÔNIBUS ($5)' };
  const nomeAqui = (x, y) => { let best = null, bd = 1e9; W.places.forEach(p => { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } }); return best ? 'perto de ' + best.nome : 'na cidade'; };

  function entrar(S, pl) {
    if (S.heatLevel > 0 && pl.id !== 'catedral') { G.say('Com a polícia atrás de você? Só a igreja serve de abrigo!', 3); return; }
    G.snd.door();
    L.trans(S, () => { if (S.mode !== 'play') return; S.mode = 'inside'; S.inside = montar(pl); S.prompt = ''; });
  }

  function falar(S, p) {
    const P = S.player;
    p.talkT = 5; p.h = Math.atan2(P.y - p.y, P.x - p.x) + Math.PI / 2;
    const r = Math.random();
    if (r < 0.25 && W.places.length) {
      const pl = pick(W.places), d = direcao(p, pl);
      bolha(p, 'O ' + pl.nome + ' fica uns ' + d.m + ' metros para o ' + d.nome + '. Vou te mostrar!', 5);
      S.guia = { id: pl.id, t: 45 }; G.say('Guia ligado: siga a seta até ' + pl.nome + '.', 3.5);
    } else if (r < 0.42) bolha(p, pick(DICAS), 5); else bolha(p, pick(FALAS), 4);
  }

  L.acao = function (S) {
    if (S.mode !== 'play' || S.trans) return null;
    const P = S.player; if (P.car || P.hp <= 0) return null;
    if (S.sentado) return { t: 'lugar', s: 'E: LEVANTAR (recuperando vida...)', run: () => { S.sentado = null; } };
    for (const pl of W.places) if (Math.hypot(pl.x - P.x, pl.y - P.y) < pl.r) return { t: 'lugar', s: 'E: ENTRAR — ' + pl.nome, run: () => entrar(S, pl) };
    let bp = null, bd = 26;
    for (const pr of W.propList) {
      if (!INTERATIVOS[pr.tipo] || Math.abs(pr.x - P.x) > 30 || Math.abs(pr.y - P.y) > 30) continue;
      const d = Math.hypot(pr.x - P.x, pr.y - P.y); if (d < bd) { bd = d; bp = pr; }
    }
    if (bp) return { t: 'lugar', s: 'E: ' + INTERATIVOS[bp.tipo], run: () => usaProp(S, bp) };
    let pp = null; bd = 40;
    for (const p of S.peds) {
      if (p.kind !== 'civ' || p.state === 'dead' || p.state === 'down' || p.state === 'flee' || p.state === 'fight' || p.mission || p.target) continue;
      const d = Math.hypot(p.x - P.x, p.y - P.y); if (d < bd) { bd = d; pp = p; }
    }
    if (pp) return { t: 'lugar', s: 'E: CONVERSAR', run: () => falar(S, pp) };
    return null;
  };

  function usaProp(S, pr) {
    const P = S.player; S.prop = S.prop || {}; const st = S.prop[pr.id] = S.prop[pr.id] || {};
    if (pr.tipo === 'hidrante') { st.ate = S.time + 9; G.say('Hidrante aberto! Que refresco...', 3); G.snd.door(); }
    else if (pr.tipo === 'lixeira') {
      if (st.t && S.time - st.t < 120) { G.say('Você já remexeu aqui. Só sobrou lixo.', 2.5); return; }
      st.t = S.time; const r = Math.random();
      if (r < 0.3) { const v = 5 + Math.floor(Math.random() * 26); S.save.money += v; G.save(); G.snd.cash(); G.say('Achou uns trocados na lixeira: $' + v + '!', 3); }
      else if (r < 0.4) { P.hp = Math.max(1, P.hp - 4); G.say('Um rato pulou da lixeira! Que susto!', 3); G.snd.beep(); }
      else if (r < 0.5) { cura(S, 8); G.say('Meia pizza ainda boa... você comeu (+vida).', 3); }
      else G.say('Só lixo e papel amassado.', 2.5);
    } else if (pr.tipo === 'banco') {
      S.sentado = { x: pr.x, y: pr.y }; P.x = pr.x; P.y = pr.y; P.h = pr.rot; P.vx = P.vy = 0; G.say('Você sentou para descansar. Aperte E para levantar.', 3);
    } else if (pr.tipo === 'correio') {
      if (st.t && S.time - st.t < 150) { G.say('A caixa está vazia.', 2); return; }
      st.t = S.time;
      if (Math.random() < 0.35) { const v = 5 + Math.floor(Math.random() * 20); S.save.money += v; G.save(); G.snd.cash(); G.say('Uma carta esquecida com $' + v + ' dentro!', 3); } else G.say('Só contas e propaganda...', 2.5);
    } else if (pr.tipo === 'banca') { if (gasta(S, 2)) G.say(pick(MANCHETES), 5); }
    else if (pr.tipo === 'maquina') {
      if (!gasta(S, 4)) return;
      if (Math.random() < 0.2) G.say('A máquina engoliu seu dinheiro e não deu nada!', 3); else { cura(S, 12); G.say('Refrigerante gelado! (+vida)', 2.5); }
    } else if (pr.tipo === 'ponto') {
      const outros = W.propList.filter(q => q.tipo === 'ponto' && Math.hypot(q.x - pr.x, q.y - pr.y) > 500);
      if (!outros.length) { G.say('Não tem outro ponto de ônibus por perto.', 2.5); return; }
      if (!gasta(S, 5)) return;
      const dst = pick(outros); G.snd.door();
      L.trans(S, () => { P.x = dst.x; P.y = dst.y; S.cam.x = P.x; S.cam.y = P.y; G.say('Você desceu do ônibus ' + nomeAqui(dst.x, dst.y) + '.', 3.5); });
    }
  }

  // ---------- atualizações do mundo (hidrantes, balões, saudações, sentar, guia) ----------
  L.atualizar = function (S, dt) {
    const P = S.player; if (S.bebado > 0) S.bebado -= dt;
    // hidrantes abertos jorram água
    if (S.prop) for (const id in S.prop) {
      const st = S.prop[id]; if (!st.ate || S.time > st.ate) continue;
      const pr = W.propList.find(q => q.id === id); if (!pr || Math.hypot(pr.x - P.x, pr.y - P.y) > 700) continue;
      for (let k = 0; k < 2; k++) { const a = rand(0, TAU), v = rand(30, 95); G.particle({ x: pr.x, y: pr.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.5, 0.9), size: rand(1.5, 2.5), col: 'smoke', tint: '#bfe4ff', a: 0.6 }); }
    }
    // sentado: recupera vida
    if (S.sentado) { P.vx = P.vy = 0; P.hp = Math.min(100, P.hp + 5 * dt); if (P.hp >= 100 && !S.sentado.avisou) { S.sentado.avisou = true; G.say('Vida cheia! Aperte E para levantar.', 2.5); } }
    // balões e saudações
    for (const p of S.peds) {
      if (p.bub) { p.bub.t -= dt; if (p.bub.t <= 0) p.bub = null; }
      if (p.talkT > 0) p.talkT -= dt;
      if (!p.saudou && p.kind === 'civ' && p.state !== 'dead' && p.state !== 'down' && !P.car && Math.hypot(p.x - P.x, p.y - P.y) < 52) {
        p.saudou = true;
        if (Math.random() < 0.45) {
          const arma = P.weapon === 'pistol' || P.weapon === 'smg' || P.weapon === 'shotgun';
          bolha(p, arma ? pick(['Calma aí, amigão!', 'Ai! Uma arma!', 'Não quero confusão!']) : pick(SAUDACOES), 2.6);
        }
      }
    }
    // guia (seta para um lugar)
    if (S.guia) { S.guia.t -= dt; const pl = W.places.find(q => q.id === S.guia.id); if (!pl || S.guia.t <= 0 || Math.hypot(pl.x - P.x, pl.y - P.y) < 70) S.guia = null; }
  };

  // ---------- desenho no mundo: marcadores, balões, seta do guia ----------
  L.desenhar = function (ctx, S, inV) {
    const t = S.time;
    W.places.forEach(pl => {
      if (!inV(pl)) return;
      const k = 1 + 0.12 * Math.sin(t * 3 + pl.x);
      ctx.save(); ctx.translate(pl.x, pl.y);
      ctx.fillStyle = pl.cor; ctx.globalAlpha = 0.28; ctx.beginPath(); ctx.arc(0, 0, 17 * k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      ctx.setLineDash([5, 4]); ctx.lineDashOffset = -t * 12; ctx.strokeStyle = pl.cor; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 19 * k, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(7, 4); ctx.lineTo(0, 1); ctx.lineTo(-7, 4); ctx.closePath(); ctx.fill();   // seta "entrar"
      ctx.restore();
    });
    // hidrantes: poça
    if (S.prop) for (const id in S.prop) {
      const st = S.prop[id]; if (!st.ate || t > st.ate + 6) continue;
      const pr = W.propList.find(q => q.id === id); if (!pr || !inV(pr)) continue;
      ctx.fillStyle = 'rgba(120,170,230,' + (0.25 * clamp((st.ate + 6 - t) / 6, 0, 1)) + ')'; ctx.beginPath(); ctx.ellipse(pr.x, pr.y, 18, 12, 0, 0, TAU); ctx.fill();
    }
    // balões de fala
    S.peds.forEach(p => { if (p.bub && inV(p)) desenhaBolha(ctx, p.x, p.y - 10, p.bub.txt, clamp(p.bub.t * 2, 0, 1)); });
    // seta de guia
    if (S.guia) {
      const pl = W.places.find(q => q.id === S.guia.id), P = S.player;
      if (pl) {
        const a = Math.atan2(pl.y - P.y, pl.x - P.x), d = Math.hypot(pl.x - P.x, pl.y - P.y);
        ctx.save(); ctx.translate(P.x + Math.cos(a) * 46, P.y + Math.sin(a) * 46); ctx.rotate(a);
        ctx.fillStyle = pl.cor; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, 0); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }
  };

  // =====================================================================
  //  DENTRO: as salas
  // =====================================================================
  const FX0 = 70, FX1 = 730, FY0 = 150, FY1 = 545;      // chão da sala (na tela)
  const hh = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };

  // caixa em perspectiva: topo + frente (a sombra fica no chão)
  function caixa(ctx, x, y, w, h, e, cTop, cFront) {
    ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(x + 5, y + 7, w, h);
    if (e > 0) {
      const g = ctx.createLinearGradient(0, y + h - e, 0, y + h); g.addColorStop(0, shade(cFront, 0.06)); g.addColorStop(1, shade(cFront, -0.38));
      ctx.fillStyle = g; ctx.fillRect(x, y + h - e, w, e); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x, y + h - e, w, 1.5);
    }
    const g2 = ctx.createLinearGradient(x, y - e, x + w, y - e + h); g2.addColorStop(0, shade(cTop, 0.14)); g2.addColorStop(1, shade(cTop, -0.2));
    ctx.fillStyle = g2; ctx.fillRect(x, y - e, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y - e + 0.5, w - 1, h + e - 1);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x + 1, y - e + 1, w - 2, 1.5);
  }
  const garrafa = (ctx, x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x - 2.5, y - 12, 5, 12); ctx.fillRect(x - 1, y - 17, 2, 6); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(x - 1.8, y - 11, 1, 8); };
  const copo = (ctx, x, y, cheio) => { ctx.fillStyle = 'rgba(225,238,248,0.75)'; ctx.fillRect(x - 3, y - 9, 6, 9); if (cheio) { ctx.fillStyle = '#e8b830'; ctx.fillRect(x - 2.4, y - 7, 4.8, 6.4); ctx.fillStyle = '#fff'; ctx.fillRect(x - 2.4, y - 8.8, 4.8, 2); } ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 0.8; ctx.strokeRect(x - 3, y - 9, 6, 9); };
  const prato = (ctx, x, y, c) => { ctx.fillStyle = '#f2f2ee'; ctx.beginPath(); ctx.ellipse(x, y, 9, 4.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.lineTo(x, y - 8); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 0.8; ctx.stroke(); };

  function drawObj(ctx, o, t) {
    const x = o.x, y = o.y, w = o.w, h = o.h, e = o.e || 0, ty = y - e;
    switch (o.t) {
      case 'balcao': {
        caixa(ctx, x, y, w, h, e, o.top || '#8a5a34', o.front || '#5a3a22');
        ctx.fillStyle = 'rgba(0,0,0,0.22)'; for (let k = x + 10; k < x + w - 20; k += 42) ctx.fillRect(k, y + h - e + 5, 32, e - 10);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; for (let k = x + 10; k < x + w - 20; k += 42) ctx.fillRect(k, y + h - e + 5, 32, 1.5);
        const my = ty + h * 0.62;
        if (o.itens === 'bar') for (let k = x + 16, i = 0; k < x + w - 10; k += 26, i++) { if (i % 3 === 1) garrafa(ctx, k, my, ['#2f8a3c', '#c8302a', '#d8a82a'][i % 3]); else copo(ctx, k, my, i % 3 === 0); }
        else if (o.itens === 'pastel') for (let k = x + 24; k < x + w - 16; k += 46) prato(ctx, k, my, '#d8a040');
        else if (o.itens === 'caldo') for (let k = x + 20; k < x + w - 12; k += 30) { ctx.fillStyle = '#a8e060'; ctx.fillRect(k - 4, my - 11, 8, 11); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(k - 3, my - 10, 2, 8); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.strokeRect(k - 4, my - 11, 8, 11); }
        else if (o.itens === 'colete') for (let k = x + 20; k < x + w - 20; k += 44) { ctx.fillStyle = '#2a58b8'; ctx.beginPath(); ctx.moveTo(k - 10, my - 12); ctx.lineTo(k + 10, my - 12); ctx.lineTo(k + 10, my - 2); ctx.quadraticCurveTo(k + 10, my + 4, k, my + 5); ctx.quadraticCurveTo(k - 10, my + 4, k - 10, my - 2); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#0a1a3a'; ctx.stroke(); }
        else if (o.itens === 'remedios') for (let k = x + 16; k < x + w - 14; k += 22) { ctx.fillStyle = ['#ffffff', '#e8505a', '#4aa0e0'][(k | 0) % 3]; ctx.fillRect(k - 5, my - 10, 10, 10); ctx.fillStyle = '#2f9a4a'; ctx.fillRect(k - 1, my - 8, 2, 6); ctx.fillRect(k - 3, my - 6, 6, 2); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.strokeRect(k - 5, my - 10, 10, 10); }
        else if (o.itens === 'bilhetes') for (let k = x + 18; k < x + w - 14; k += 30) { ctx.fillStyle = '#f2d88a'; ctx.fillRect(k - 8, my - 4, 16, 7); ctx.fillStyle = '#8a1f3a'; ctx.fillRect(k - 8, my - 4, 4, 7); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.strokeRect(k - 8, my - 4, 16, 7); }
        // caixa registradora
        if (o.itens !== 'colete' && o.itens !== 'bilhetes') { ctx.fillStyle = '#2a2d36'; ctx.fillRect(x + w - 30, my - 10, 20, 12); ctx.fillStyle = '#6fe0a0'; ctx.fillRect(x + w - 27, my - 8, 14, 4); ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x + w - 27, my - 2, 14, 2); }
        break;
      }
      case 'mesa': {
        const cx = x + w / 2, cy = y + h / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(cx + 5, cy + 8, w / 2, h / 2.2, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a2a1c'; ctx.fillRect(cx - 3, cy - 2, 6, e);
        const g = ctx.createRadialGradient(cx - 8, ty + h / 2 - 6, 2, cx, ty + h / 2, w / 2); g.addColorStop(0, '#c8955a'); g.addColorStop(1, '#7a5230');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy - e, w / 2, h / 2.2, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke();
        copo(ctx, cx - 9, cy - e + 2, true); copo(ctx, cx + 9, cy - e + 4, true); break;
      }
      case 'cadeira': {
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x + w / 2 + 3, y + h / 2 + 5, w / 2, h / 2, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#6a2a22'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2 - 6, w / 2, h / 2.2, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke();
        ctx.fillStyle = '#4a1a14'; ctx.fillRect(x + 2, y - 10, w - 4, 6); break;
      }
      case 'jukebox': {
        caixa(ctx, x, y, w, h, e, '#2a2030', '#4a2a5a');
        const k = 0.6 + 0.4 * Math.sin(t * 4), fy = y + h - e;
        const g = ctx.createLinearGradient(x, fy, x + w, fy); g.addColorStop(0, 'hsl(' + ((t * 60) % 360) + ',90%,55%)'); g.addColorStop(0.5, 'hsl(' + ((t * 60 + 120) % 360) + ',90%,60%)'); g.addColorStop(1, 'hsl(' + ((t * 60 + 240) % 360) + ',90%,55%)');
        ctx.globalAlpha = 0.6 + 0.3 * k; ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + 6, y + h - 4); ctx.lineTo(x + 6, fy + 14); ctx.quadraticCurveTo(x + w / 2, fy - 2, x + w - 6, fy + 14); ctx.lineTo(x + w - 6, y + h - 4); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = '#e8e8e8'; ctx.fillRect(x + w / 2 - 8, fy + 20, 16, 5); break;
      }
      case 'sinuca': {
        caixa(ctx, x, y, w, h, e, '#6a4a2a', '#3a2814');
        ctx.fillStyle = '#1f7a3c'; ctx.fillRect(x + 8, ty + 8, w - 16, h - 16);
        const g = ctx.createRadialGradient(x + w / 2, ty + h / 2, 5, x + w / 2, ty + h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,0.14)'); g.addColorStop(1, 'rgba(0,0,0,0.2)'); ctx.fillStyle = g; ctx.fillRect(x + 8, ty + 8, w - 16, h - 16);
        ctx.fillStyle = '#0a0a0a'; [[x + 9, ty + 9], [x + w - 9, ty + 9], [x + 9, ty + h - 9], [x + w - 9, ty + h - 9], [x + w / 2, ty + 8], [x + w / 2, ty + h - 8]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b, 4.5, 0, TAU); ctx.fill(); });
        const cores = ['#e8d02a', '#2a58b8', '#c8302a', '#6a2a8a', '#e87a1a', '#2f8a3c', '#7a1a14', '#111'];
        for (let k = 0; k < 8; k++) { const bx = x + w * 0.62 + (k % 3) * 8 - (k > 2 ? 4 : 0) + (k > 5 ? 4 : 0), by = ty + h / 2 + ((k % 3) - 1) * 8 + (k > 2 ? 4 : 0); ctx.fillStyle = cores[k]; ctx.beginPath(); ctx.arc(bx, by, 3.6, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(bx - 1.6, by - 1.8, 1.3, 1.3); }
        ctx.fillStyle = '#f2f2f2'; ctx.beginPath(); ctx.arc(x + w * 0.28, ty + h / 2, 3.6, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#d8b878'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w * 0.1, ty + h * 0.8); ctx.lineTo(x + w * 0.24, ty + h * 0.56); ctx.stroke(); break;
      }
      case 'estante': {
        caixa(ctx, x, y, w, h, e, o.top || '#7a5a3a', o.front || '#4a3220');
        const fy = y + h - e, v = o.variante || '';
        for (let r = 0; r < 2; r++) {
          const ry = fy + 6 + r * ((e - 8) / 2);
          ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 3, ry + (e - 8) / 2 - 3, w - 6, 2);
          for (let k = x + 8; k < x + w - 8; k += 13) {
            const c = v === 'frutas' ? pick2(['#e8801a', '#c8302a', '#e8d02a', '#4aa02a'], k + r) : v === 'remedios' ? pick2(['#ffffff', '#e8505a', '#4aa0e0', '#e8d02a'], k + r) : v === 'tenis' ? pick2(['#f2f2f2', '#d33a3a', '#2a5ac8', '#111', '#e0b32a'], k + r) : pick2(['#d33a3a', '#3a7ad3', '#e0b32a', '#2f8a3c', '#8a4fc2'], k + r);
            if (v === 'frutas') { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(k + 3, ry + (e - 8) / 4, 4.5, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(k + 1, ry + (e - 8) / 4 - 3, 2, 2); }
            else if (v === 'tenis') { ctx.fillStyle = c; ctx.fillRect(k - 2, ry + 2, 11, 6); ctx.fillStyle = '#f2f2f2'; ctx.fillRect(k - 2, ry + 7, 11, 2); }
            else { ctx.fillStyle = c; ctx.fillRect(k, ry + 1, 9, (e - 8) / 2 - 5); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(k + 1, ry + 2, 2, (e - 8) / 2 - 7); }
          }
        }
        break;
      }
      case 'geladeira': {
        caixa(ctx, x, y, w, h, e, '#e8ecf0', '#d0d6dc');
        const fy = y + h - e; ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, fy + e * 0.42, w, 2); ctx.fillStyle = '#8a9099'; ctx.fillRect(x + w - 10, fy + 6, 3, e * 0.28); ctx.fillRect(x + w - 10, fy + e * 0.5, 3, e * 0.3);
        ctx.fillStyle = '#e8505a'; ctx.fillRect(x + 8, fy + 10, 6, 6); ctx.fillStyle = '#4aa0e0'; ctx.fillRect(x + 17, fy + 14, 6, 6); break;
      }
      case 'cama': {
        caixa(ctx, x, y, w, h, e, '#6a4a2a', '#3a2814');
        ctx.fillStyle = '#e8ecf2'; ctx.fillRect(x + 4, ty + 4, w - 8, h - 8);
        const g = ctx.createLinearGradient(x, ty, x, ty + h); g.addColorStop(0, '#3a6ab0'); g.addColorStop(1, '#2a4a86'); ctx.fillStyle = g; ctx.fillRect(x + 4, ty + 30, w - 8, h - 34);
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let k = 36; k < h - 8; k += 12) ctx.fillRect(x + 4, ty + k, w - 8, 1.5);
        ctx.fillStyle = '#fff'; ctx.beginPath(); W.rrect(ctx, x + 10, ty + 8, 46, 20, 6); ctx.fill(); W.rrect(ctx, x + w - 56, ty + 8, 46, 20, 6); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke(); break;
      }
      case 'sofa': {
        caixa(ctx, x, y, w, h, e, '#8a3a3a', '#5a2222');
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + w / 3, ty + 4, 1.5, h - 8); ctx.fillRect(x + 2 * w / 3, ty + 4, 1.5, h - 8);
        ctx.fillStyle = '#6a2a2a'; ctx.fillRect(x, ty - 8, w, 10); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x, ty - 8, w, 2); break;
      }
      case 'tv': {
        caixa(ctx, x, y, w, h, e, '#3a2e24', '#241c14');
        ctx.fillStyle = '#0a0a0e'; ctx.fillRect(x + 6, ty - 34, w - 12, 34); const f = 0.5 + 0.5 * Math.sin(t * 3);
        const g = ctx.createLinearGradient(x, ty - 34, x + w, ty); g.addColorStop(0, 'hsl(' + ((t * 20) % 360) + ',60%,45%)'); g.addColorStop(1, 'hsl(' + ((t * 20 + 90) % 360) + ',60%,30%)'); ctx.fillStyle = g; ctx.globalAlpha = 0.75 + 0.2 * f; ctx.fillRect(x + 9, ty - 31, w - 18, 28); ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(x + 9, ty - 31, w - 18, 4); break;
      }
      case 'computador': {
        caixa(ctx, x, y, w, h, e, '#6a5a46', '#3a3024');
        ctx.fillStyle = '#16181e'; ctx.fillRect(x + w / 2 - 22, ty - 26, 44, 26); ctx.fillStyle = '#3a8ae0'; ctx.fillRect(x + w / 2 - 19, ty - 23, 38, 20); ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let k = 0; k < 4; k++) ctx.fillRect(x + w / 2 - 16, ty - 20 + k * 4, 14 + (k % 2) * 10, 1.5);
        ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x + w / 2 - 14, ty + 6, 28, 8); break;
      }
      case 'arara': {
        ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(x + 4, y + 8, w, h);
        ctx.fillStyle = '#3a3e48'; ctx.fillRect(x, y + h - e, 3, e); ctx.fillRect(x + w - 3, y + h - e, 3, e); ctx.fillRect(x, y + h - e, w, 3);
        const pal = ['#d33a3a', '#3a7ad3', '#e0b32a', '#2f8a3c', '#8a4fc2', '#e8e8e8', '#e07a2a'];
        for (let k = x + 6, i = 0; k < x + w - 10; k += 12, i++) { ctx.fillStyle = shade(pal[i % pal.length], -0.1); ctx.fillRect(k, y + h - e + 4, 10, e - 6); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(k + 1, y + h - e + 5, 2, e - 8); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(k, y + h - 6, 10, 2); }
        break;
      }
      case 'cadeira_b': {
        const cx = x + w / 2, cy = y + h / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(cx + 5, cy + 8, 22, 16, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#8a8e98'; ctx.fillRect(cx - 4, cy - e + 4, 8, e); ctx.fillStyle = '#3a3e48'; ctx.beginPath(); ctx.ellipse(cx, cy + 3, 16, 7, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#b02a2a'; ctx.beginPath(); ctx.ellipse(cx, cy - e, 18, 15, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#4a1010'; ctx.stroke();
        ctx.fillStyle = '#8a1a1a'; ctx.fillRect(cx - 14, cy - e - 26, 28, 14); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(cx - 12, cy - e - 25, 24, 2); break;
      }
      case 'poltrona': {
        caixa(ctx, x, y, w, h, e, '#a02030', '#6a1420');
        ctx.fillStyle = '#7a1624'; ctx.fillRect(x, ty - 12, w, 12); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + 1, ty - 11, w - 2, 2);
        ctx.fillStyle = '#5a1018'; ctx.fillRect(x - 3, ty - 2, 4, h); ctx.fillRect(x + w - 1, ty - 2, 4, h); break;
      }
      case 'palco': {
        caixa(ctx, x, y, w, h, e, '#8a6238', '#5a3c20');
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let k = 0; k < h; k += 14) ctx.fillRect(x, ty + k, w, 1.5);
        ctx.fillStyle = '#f2d88a'; for (let k = x + 18; k < x + w; k += 56) { ctx.beginPath(); ctx.arc(k, y + h - e / 2, 3, 0, TAU); ctx.fill(); } break;
      }
      case 'esteira': {
        caixa(ctx, x, y, w, h, e, '#2a2d36', '#16181e');
        ctx.fillStyle = '#10121a'; ctx.fillRect(x + 8, ty + 6, w - 16, h - 24);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; for (let k = 0; k < h - 24; k += 8) ctx.fillRect(x + 8, ty + 6 + ((k + t * 40) % (h - 24)), w - 16, 2);
        ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x + 4, ty - 18, 4, 22); ctx.fillRect(x + w - 8, ty - 18, 4, 22); ctx.fillStyle = '#16181e'; ctx.fillRect(x + 4, ty - 22, w - 8, 8); ctx.fillStyle = '#4ae08a'; ctx.fillRect(x + w / 2 - 8, ty - 20, 16, 4); break;
      }
      case 'supino': {
        caixa(ctx, x, y + 14, w, h - 14, e, '#2a2d36', '#16181e');
        ctx.fillStyle = '#c0c4cc'; ctx.fillRect(x - 6, ty + 4, w + 12, 4); ctx.fillStyle = '#1a1c22'; [x - 8, x + w + 2].forEach(a => { ctx.fillRect(a, ty - 4, 6, 20); ctx.fillStyle = '#c8302a'; ctx.fillRect(a + 1, ty - 2, 4, 16); ctx.fillStyle = '#1a1c22'; }); break;
      }
      case 'halteres': {
        caixa(ctx, x, y, w, h, e, '#3a3e48', '#22252c');
        for (let k = x + 10, i = 0; k < x + w - 14; k += 20, i++) { const c = ['#c8302a', '#2a58b8', '#e0b32a', '#2f8a3c'][i % 4]; ctx.fillStyle = '#16181e'; ctx.fillRect(k - 8, y + h - e + 8, 16, 4); ctx.fillStyle = c; ctx.fillRect(k - 10, y + h - e + 4, 5, 12); ctx.fillRect(k + 5, y + h - e + 4, 5, 12); }
        break;
      }
      case 'bebedouro': {
        caixa(ctx, x, y, w, h, e, '#c8ccd4', '#8a9099'); ctx.fillStyle = 'rgba(120,190,255,0.8)'; ctx.beginPath(); ctx.ellipse(x + w / 2, ty - 10, w / 2.4, 12, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + w / 2 - 6, ty - 18, 3, 8); break;
      }
      case 'balanca': {
        caixa(ctx, x, y, w, h, e, '#c8ccd4', '#8a9099'); ctx.fillStyle = '#16181e'; ctx.fillRect(x + w / 2 - 8, ty + 4, 16, 8); ctx.fillStyle = '#6fe0a0'; ctx.fillRect(x + w / 2 - 6, ty + 5.5, 12, 4); break;
      }
      case 'planta': {
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x + w / 2 + 4, y + h - 2, w / 2, 8, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#8a4a32'; ctx.fillRect(x + w / 2 - 11, y + h - 22, 22, 22); ctx.fillStyle = '#6a2e1e'; ctx.fillRect(x + w / 2 - 11, y + h - 6, 22, 6);
        const sw = Math.sin(t * 1.2 + x) * 1.2; ctx.fillStyle = '#2f7a2c'; for (let k = 0; k < 7; k++) { const a = -1.2 + k * 0.4; ctx.beginPath(); ctx.ellipse(x + w / 2 + Math.cos(a) * 14 + sw, y + h - 30 + Math.sin(a) * 12, 12, 5, a + 1.57, 0, TAU); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x + w / 2 - 8, y + h - 20, 3, 14); break;
      }
      case 'altar': {
        caixa(ctx, x, y, w, h, e, '#e8e4d8', '#b8b4a8');
        ctx.fillStyle = '#f2d88a'; ctx.fillRect(x + w / 2 - 2, ty - 26, 4, 26); ctx.fillRect(x + w / 2 - 9, ty - 20, 18, 4);
        ctx.fillStyle = '#8a1f3a'; ctx.fillRect(x + 6, y + h - e + 6, w - 12, e - 12); ctx.fillStyle = '#f2d88a'; ctx.fillRect(x + w / 2 - 1, y + h - e + 8, 2, e - 16); break;
      }
      case 'velas': {
        caixa(ctx, x, y, w, h, e, '#4a3a2a', '#2a2018');
        for (let k = x + 8, i = 0; k < x + w - 6; k += 10, i++) { ctx.fillStyle = '#f2ecdc'; ctx.fillRect(k - 2, ty - 8, 4, 8); const f = 1 + 0.3 * Math.sin(t * 9 + i * 2); ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.ellipse(k, ty - 11, 2 * f, 4 * f, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.ellipse(k, ty - 10.5, 1, 2, 0, 0, TAU); ctx.fill(); }
        break;
      }
      case 'banco_igreja': {
        caixa(ctx, x, y, w, h, e, '#8a5a30', '#5a3818'); ctx.fillStyle = '#6a4222'; ctx.fillRect(x, ty - 12, w, 9); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x, ty - 12, w, 1.5); break;
      }
      case 'confessionario': {
        caixa(ctx, x, y, w, h, e, '#4a2e1c', '#2e1a0e'); const fy = y + h - e;
        ctx.fillStyle = '#6a1420'; ctx.fillRect(x + 8, fy + 14, w / 2 - 12, e - 18); ctx.fillStyle = '#16100a'; ctx.fillRect(x + w / 2 + 4, fy + 14, w / 2 - 12, e - 18);
        ctx.fillStyle = '#c8a24a'; ctx.fillRect(x + w / 2 - 1, fy + 14, 2, e - 18); break;
      }
      case 'tapete': {
        ctx.fillStyle = '#7a2a3a'; W.rrect(ctx, x, y, w, h, 10); ctx.fill(); ctx.strokeStyle = '#d8b878'; ctx.lineWidth = 3; ctx.stroke();
        ctx.strokeStyle = 'rgba(216,184,120,0.5)'; ctx.lineWidth = 1.5; W.rrect(ctx, x + 12, y + 12, w - 24, h - 24, 6); ctx.stroke(); break;
      }
      default: break;
    }
  }
  function pick2(a, k) { return a[Math.floor(hh(k, 7) * a.length) % a.length]; }

  // desenha uma pessoa (jogador ou atendente) em escala maior dentro da sala
  function gente(ctx, S, p, x, y, esc, h, walk) {
    ctx.save(); ctx.translate(x, y); ctx.scale(esc, esc);
    SP.drawPed(ctx, Object.assign({}, p, { x: 0, y: 0, h, walk: walk || 0, state: 'walk', weapon: 'fist', punchT: 0, bub: null, flashT: 0, noRing: true }), S.time);
    ctx.restore();
  }

  // ---------- fundo da sala (desenhado uma vez só) ----------
  function piso(x, R) {
    const w = FX1 - FX0, h = FY1 - FY0, cs = R.pisoCores;
    x.save(); x.beginPath(); x.rect(FX0, FY0, w, h); x.clip();
    if (R.piso === 'xadrez') { for (let j = 0; j * 44 < h + 44; j++) for (let i = 0; i * 44 < w + 44; i++) { x.fillStyle = (i + j) % 2 ? cs[0] : cs[1]; x.fillRect(FX0 + i * 44, FY0 + j * 44, 44, 44); } }
    else if (R.piso === 'ladrilho') { x.fillStyle = cs[0]; x.fillRect(FX0, FY0, w, h); for (let j = 0; j * 48 < h; j++) for (let i = 0; i * 48 < w; i++) { x.fillStyle = 'rgba(' + (hh(i, j) > 0.5 ? '255,255,255' : '0,0,0') + ',' + (0.03 + hh(j, i) * 0.05) + ')'; x.fillRect(FX0 + i * 48, FY0 + j * 48, 48, 48); } x.strokeStyle = cs[1]; x.lineWidth = 1.5; x.beginPath(); for (let i = 0; i * 48 <= w; i++) { x.moveTo(FX0 + i * 48, FY0); x.lineTo(FX0 + i * 48, FY1); } for (let j = 0; j * 48 <= h; j++) { x.moveTo(FX0, FY0 + j * 48); x.lineTo(FX1, FY0 + j * 48); } x.stroke(); }
    else if (R.piso === 'madeira') { for (let j = 0; j * 24 < h; j++) { for (let i = -1; i * 110 < w; i++) { const off = hh(j, 3) * 110, px = FX0 + i * 110 + off; x.fillStyle = hh(i, j) > 0.5 ? cs[0] : cs[1]; x.fillRect(px, FY0 + j * 24, 110, 24); x.fillStyle = 'rgba(255,255,255,' + (0.03 + hh(j, i) * 0.06) + ')'; x.fillRect(px, FY0 + j * 24, 110, 8); x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 1; x.strokeRect(px + 0.5, FY0 + j * 24 + 0.5, 110, 24); } } }
    else if (R.piso === 'carpete') { x.fillStyle = cs[0]; x.fillRect(FX0, FY0, w, h); x.fillStyle = cs[1]; for (let j = 0; j * 20 < h; j++) for (let i = 0; i * 20 < w; i++) if ((i + j) % 2 === 0) { x.beginPath(); x.moveTo(FX0 + i * 20 + 10, FY0 + j * 20 + 4); x.lineTo(FX0 + i * 20 + 16, FY0 + j * 20 + 10); x.lineTo(FX0 + i * 20 + 10, FY0 + j * 20 + 16); x.lineTo(FX0 + i * 20 + 4, FY0 + j * 20 + 10); x.fill(); } }
    else if (R.piso === 'borracha') { x.fillStyle = cs[0]; x.fillRect(FX0, FY0, w, h); x.strokeStyle = cs[1]; x.lineWidth = 2; x.beginPath(); for (let i = 0; i * 60 <= w; i++) { x.moveTo(FX0 + i * 60, FY0); x.lineTo(FX0 + i * 60, FY1); } for (let j = 0; j * 60 <= h; j++) { x.moveTo(FX0, FY0 + j * 60); x.lineTo(FX1, FY0 + j * 60); } x.stroke(); x.fillStyle = 'rgba(255,255,255,0.05)'; for (let k = 0; k < 160; k++) x.fillRect(FX0 + hh(k, 1) * w, FY0 + hh(k, 2) * h, 2, 2); }
    else { for (let j = 0; j * 66 < h + 66; j++) for (let i = -1; i * 88 < w; i++) { const off = (j % 2) * 44; x.fillStyle = hh(i, j) > 0.5 ? cs[0] : cs[1]; x.fillRect(FX0 + i * 88 + off, FY0 + j * 66, 88, 66); x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 1.5; x.strokeRect(FX0 + i * 88 + off + 0.5, FY0 + j * 66 + 0.5, 88, 66); } }
    const g = x.createLinearGradient(0, FY0, 0, FY1); g.addColorStop(0, 'rgba(0,0,0,0.38)'); g.addColorStop(0.35, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.28)');
    x.fillStyle = g; x.fillRect(FX0, FY0, w, h); x.restore();
  }
  const janela = (x, px, py, w, h) => { x.fillStyle = '#2a2018'; x.fillRect(px - 4, py - 4, w + 8, h + 8); const g = x.createLinearGradient(0, py, 0, py + h); g.addColorStop(0, '#8ac4f0'); g.addColorStop(1, '#e8f4ff'); x.fillStyle = g; x.fillRect(px, py, w, h); x.fillStyle = '#2a2018'; x.fillRect(px + w / 2 - 1, py, 2, h); x.fillRect(px, py + h / 2 - 1, w, 2); x.fillStyle = 'rgba(255,255,255,0.3)'; x.beginPath(); x.moveTo(px, py); x.lineTo(px + w * 0.45, py); x.lineTo(px, py + h * 0.65); x.fill(); };
  const cartaz = (x, px, py, w, h, cor, linhas) => { x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(px + 2, py + 3, w, h); x.fillStyle = cor; x.fillRect(px, py, w, h); x.strokeStyle = 'rgba(0,0,0,0.5)'; x.lineWidth = 1; x.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1); x.fillStyle = '#fff'; x.font = 'bold 8px Arial'; x.textAlign = 'center'; (linhas || []).forEach((t, i) => x.fillText(t, px + w / 2, py + 14 + i * 11)); x.textAlign = 'left'; };
  const neon = (x, txt, cx, cy, size, cor) => { x.save(); x.font = 'bold ' + size + 'px Arial'; x.textAlign = 'center'; x.shadowColor = cor; x.shadowBlur = 16; x.fillStyle = cor; x.fillText(txt, cx, cy); x.shadowBlur = 4; x.fillStyle = '#fff'; x.globalAlpha = 0.85; x.fillText(txt, cx, cy); x.restore(); };
  const prateleiraParede = (x, px, py, w, cores) => { x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(px, py + 22, w, 5); x.fillStyle = '#7a5a3a'; x.fillRect(px, py + 20, w, 4); for (let k = px + 8, i = 0; k < px + w - 6; k += 12, i++) { x.fillStyle = cores[i % cores.length]; x.fillRect(k - 3, py + 6, 6, 14); x.fillRect(k - 1, py + 1, 2, 6); x.fillStyle = 'rgba(255,255,255,0.45)'; x.fillRect(k - 2, py + 8, 1.2, 9); } };

  function fundo(R) {
    const c = document.createElement('canvas'); c.width = VW; c.height = VH; const x = c.getContext('2d');
    x.fillStyle = '#08060e'; x.fillRect(0, 0, VW, VH);
    // parede de trás
    const wg = x.createLinearGradient(0, 60, 0, FY0); wg.addColorStop(0, shade(R.parede, 0.12)); wg.addColorStop(1, shade(R.parede, -0.25));
    x.fillStyle = wg; x.fillRect(FX0, 60, FX1 - FX0, FY0 - 60);
    x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(FX0, 108, FX1 - FX0, 42); x.fillStyle = 'rgba(255,255,255,0.14)'; x.fillRect(FX0, 108, FX1 - FX0, 2);
    x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(FX0, FY0 - 6, FX1 - FX0, 6);
    piso(x, R);
    if (R.deco) R.deco(x);
    // paredes laterais e frente
    [[FX0 - 20, 20], [FX1, 20]].forEach(([px, w]) => { const g = x.createLinearGradient(px, 0, px + w, 0); g.addColorStop(0, shade(R.parede, -0.5)); g.addColorStop(1, shade(R.parede, -0.3)); x.fillStyle = g; x.fillRect(px, 52, w, FY1 - 52 + 30); });
    x.fillStyle = shade(R.parede, -0.45); x.fillRect(FX0 - 20, 52, FX1 - FX0 + 40, 10);
    x.fillStyle = shade(R.parede, -0.38); x.fillRect(FX0 - 20, FY1, 20, 36); x.fillRect(FX1, FY1, 20, 36);
    x.fillRect(FX0 - 20, FY1, 380 - FX0 + 20, 36); x.fillRect(440, FY1, FX1 + 20 - 440, 36);
    x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(FX0, FY1, 290, 4); x.fillRect(440, FY1, FX1 - 440, 4);
    // porta
    x.fillStyle = '#2a1c12'; x.fillRect(356, FY1 - 4, 88, 44); x.fillStyle = '#cfe8ff'; x.fillRect(362, FY1 + 2, 76, 38);
    const lg = x.createLinearGradient(0, FY1, 0, FY1 + 40); lg.addColorStop(0, 'rgba(255,240,200,0.9)'); lg.addColorStop(1, 'rgba(255,255,255,0.6)'); x.fillStyle = lg; x.fillRect(362, FY1 + 2, 76, 38);
    x.fillStyle = 'rgba(255,230,160,0.18)'; x.beginPath(); x.moveTo(362, FY1); x.lineTo(438, FY1); x.lineTo(470, FY1 - 80); x.lineTo(330, FY1 - 80); x.closePath(); x.fill();
    x.fillStyle = '#5a2a1a'; x.fillRect(376, FY1 - 10, 48, 8); x.fillStyle = '#e8d8b0'; x.font = 'bold 8px Arial'; x.textAlign = 'center'; x.fillText('SAÍDA', 400, FY1 - 3.6); x.textAlign = 'left';
    return c;
  }

  // ---------- as 9 salas: objetos, decoração e atendente ----------
  const O = (t, x, y, w, h, o) => Object.assign({ t, x, y, w, h, e: 0, solid: true, r: 34 }, o || {});
  const compra = (S, preco, fn) => { if (gasta(S, preco)) fn(); };

  function montar(pl) {
    const R = { place: pl, nome: pl.nome, cor: pl.cor, objs: [], px: 400, py: 505, ph: Math.PI, walk: 0, bg: null, preview: false, npc: null, luzes: [{ x: 400, y: 300, r: 330 }] };
    R.objs.push(O('barreira', FX0 - 10, FY0 - 30, FX1 - FX0 + 20, 70, { invisivel: true }));
    const npc = (x, y, falas, look) => {
      const lk = Object.assign(SP.randomLook(), look || {});
      R.npc = { x, y, p: lk, falas, h: Math.PI };
      R.objs.push(O('npc', x - 17, y - 24, 34, 28, { invisivel: true, label: 'CONVERSAR', r: 40, act: () => { R.npc.h = Math.PI; bolha(R.npc.p, pick(falas), 4.5); } }));
    };
    const salvar = () => G.save();

    switch (pl.id) {
      case 'pinguim':
        Object.assign(R, { piso: 'xadrez', pisoCores: ['#dfe9f4', '#2a4a7a'], parede: '#1d3f78' });
        R.objs.push(O('balcao', 120, 190, 250, 40, { e: 28, itens: 'bar', label: 'PEDIR UM CHOPP ($12)', act: S => compra(S, 12, () => { cura(S, 25); S.bebado = (S.bebado || 0) + 9; G.say('Chopp gelado do Pinguim! Saúde! (+vida, mas a cabeça roda...)', 4); }) }));
        R.objs.push(O('balcao', 430, 190, 250, 40, { e: 28, itens: 'pastel', label: 'COMER UM PASTEL ($8)', act: S => compra(S, 8, () => { cura(S, 15); G.say('Pastel quentinho de carne! (+vida)', 3); }) }));
        R.objs.push(O('jukebox', 84, 300, 56, 30, { e: 50, label: 'TROCAR A MÚSICA', act: S => { G.snd.nextStation(); S.radioT = 3; G.say('Jukebox: outra música!', 2); } }));
        R.objs.push(O('sinuca', 470, 350, 170, 92, { e: 16, label: 'JOGAR SINUCA ($20)', act: S => compra(S, 20, () => { if (Math.random() < 0.45) { S.save.money += 40; G.save(); G.snd.cash(); G.say('Você ganhou na sinuca! +$40 de aposta.', 3.5); } else G.say('Perdeu a partida. O taco entortou, né?', 3); }) }));
        R.objs.push(O('mesa', 190, 400, 56, 40, { e: 18 }), O('cadeira', 168, 410, 22, 22, { solid: false }), O('cadeira', 250, 410, 22, 22, { solid: false }));
        R.objs.push(O('mesa', 270, 300, 56, 40, { e: 18 }), O('cadeira', 248, 310, 22, 22, { solid: false }));
        R.deco = x => { neon(x, 'PINGUIM CHOPP', 400, 100, 30, '#6ad0ff'); prateleiraParede(x, 130, 110, 240, ['#2f8a3c', '#c8302a', '#d8a82a', '#4aa0e0']); prateleiraParede(x, 430, 110, 240, ['#d8a82a', '#2f8a3c', '#c8302a']); x.fillStyle = '#fff'; x.beginPath(); x.arc(100, 96, 12, 0, TAU); x.fill(); x.fillStyle = '#111'; x.fillRect(93, 92, 14, 14); x.fillStyle = '#fff'; x.fillRect(95, 96, 10, 10); x.fillStyle = '#f0a020'; x.fillRect(98, 90, 6, 3); };
        npc(400, 205, ['Bem-vindo ao Pinguim! O chopp mais gelado de Ribeirão.', 'Aqui o chopp sai com colarinho perfeito!', 'Se beber demais, a calçada fica torta, hein?', 'Quer tentar a sorte na sinuca?'], { shirt: '#ffffff', pat: 'liso', sleeve: 'curta', fem: false, hairStyle: 'curto', acc: 'none' });
        break;
      case 'mercadao':
        Object.assign(R, { piso: 'ladrilho', pisoCores: ['#e6dcc0', '#b3a784'], parede: '#c8a860' });
        R.objs.push(O('balcao', 100, 190, 170, 40, { e: 28, itens: 'pastel', top: '#d8c8a0', front: '#a8885a', label: 'COMPRAR PASTEL ($8)', act: S => compra(S, 8, () => { cura(S, 15); G.say('Pastel de feira, sequinho! (+vida)', 3); }) }));
        R.objs.push(O('balcao', 315, 190, 170, 40, { e: 28, itens: 'caldo', top: '#d8c8a0', front: '#a8885a', label: 'CALDO DE CANA ($5)', act: S => compra(S, 5, () => { cura(S, 10); G.say('Caldo de cana geladinho! (+vida)', 3); }) }));
        R.objs.push(O('balcao', 530, 190, 170, 40, { e: 28, itens: 'colete', top: '#d8c8a0', front: '#a8885a', label: 'COLETE À PROVA DE BALAS ($150)', act: S => { if (S.player.armor >= 100) { G.say('Você já está de colete cheio.', 2.5); return; } compra(S, 150, () => { S.player.armor = 100; G.say('Colete novo no corpo! (armadura 100)', 3.5); }); } }));
        R.objs.push(O('estante', 110, 350, 130, 36, { e: 30, variante: 'frutas' }), O('estante', 560, 350, 130, 36, { e: 30, variante: 'frutas' }));
        R.objs.push(O('planta', 90, 440, 40, 50, {}), O('planta', 670, 440, 40, 50, {}));
        R.deco = x => { x.fillStyle = '#2f7a3a'; x.font = 'bold 22px Georgia'; x.textAlign = 'center'; x.fillText('MERCADÃO', 400, 98); x.textAlign = 'left'; for (let k = 0; k < 9; k++) { x.fillStyle = k % 2 ? '#c8302a' : '#e8d02a'; x.beginPath(); x.moveTo(110 + k * 72, 108); x.lineTo(150 + k * 72, 108); x.lineTo(130 + k * 72, 132); x.closePath(); x.fill(); } cartaz(x, 88, 66, 56, 36, '#2f7a3a', ['FRUTAS', 'FRESCAS']); cartaz(x, 656, 66, 56, 36, '#c8302a', ['PASTEL', '$8']); };
        npc(400, 270, ['Pastel, caldo de cana, colete... tem de tudo!', 'O caldo de cana é na hora, moído agora!', 'O colete? Para quem vive perigosamente.', 'Frutas fresquinhas do interior!'], { shirt: '#e8e8e8', pat: 'liso', sleeve: 'curta', hairStyle: 'curto', acc: 'cap', accCol: '#2f7a3a' });
        break;
      case 'farmacia':
        Object.assign(R, { piso: 'ladrilho', pisoCores: ['#eef4f2', '#c0d4cc'], parede: '#d8ece6' });
        R.objs.push(O('balcao', 240, 190, 320, 40, { e: 28, itens: 'remedios', top: '#f2f2f2', front: '#c8d8d4', label: 'KIT MÉDICO ($60) — VIDA CHEIA', act: S => { if (S.player.hp >= 100) { G.say('Você está inteiro, não precisa de remédio.', 2.5); return; } compra(S, 60, () => { S.player.hp = 100; G.say('Curativos e analgésico. Vida cheia!', 3.5); }); } }));
        R.objs.push(O('estante', 90, 190, 120, 36, { e: 42, variante: 'remedios', label: 'VITAMINAS ($25) +40 VIDA', act: S => compra(S, 25, () => { cura(S, 40); G.say('Vitamina C e complexo B! (+40 vida)', 3); }) }));
        R.objs.push(O('estante', 590, 190, 120, 36, { e: 42, variante: 'remedios' }));
        R.objs.push(O('balanca', 130, 440, 34, 34, { e: 18, label: 'SUBIR NA BALANÇA', act: S => G.say(pick(['A balança diz: 78 kg. Mentira, foi o pastel.', 'A balança diz: "Uma pessoa de cada vez, por favor."', 'A balança diz: 82 kg. Mas está musculoso!', 'A balança travou em 99. Foi o chopp.']), 4) }));
        R.objs.push(O('planta', 650, 430, 40, 50, {}));
        R.deco = x => { x.fillStyle = '#2f9a4a'; x.fillRect(388, 72, 24, 8); x.fillRect(396, 64, 8, 24); x.fillStyle = '#2f9a4a'; x.font = 'bold 16px Arial'; x.textAlign = 'center'; x.fillText('FARMÁCIA DROGA SAÚDE', 400, 108); x.textAlign = 'left'; cartaz(x, 250, 118, 60, 28, '#e8f2ff', []); x.fillStyle = '#2a58b8'; x.font = 'bold 8px Arial'; x.fillText('PROMOÇÃO', 255, 130); x.fillText('VITAMINAS', 255, 140); };
        npc(400, 215, ['Bom dia! Dói alguma coisa? Tenho de tudo aqui.', 'Se estiver machucado, o kit médico resolve.', 'Vitamina todo dia mantém o corpo forte.', 'Não vendemos remédio para ressaca, infelizmente.'], { shirt: '#ffffff', pat: 'jaqueta', sleeve: 'longa', fem: true, hairStyle: 'rabo', acc: 'none' });
        break;
      case 'barbearia':
        Object.assign(R, { piso: 'xadrez', pisoCores: ['#f2f2f2', '#2a2a32'], parede: '#5a2d7a', preview: true });
        R.objs.push(O('cadeira_b', 200, 300, 46, 46, { e: 20, label: 'MUDAR O CORTE ($20)', act: S => compra(S, 20, () => { mudaLook(S, 'corte', CORTES.length); G.say('Corte novo: ' + S.player.hairStyle.toUpperCase() + '. Ficou na régua!', 3); }) }));
        R.objs.push(O('cadeira_b', 320, 300, 46, 46, { e: 20 }), O('cadeira_b', 440, 300, 46, 46, { e: 20 }));
        R.objs.push(O('estante', 580, 175, 130, 30, { e: 32, variante: 'tintas', label: 'MUDAR A COR DO CABELO ($15)', act: S => compra(S, 15, () => { mudaLook(S, 'cor', CORES_CAB.length); G.say('Cor nova no cabelo!', 3); }) }));
        R.objs.push(O('espelho', 140, 80, 330, 120, { solid: false, invisivel: true, label: 'OLHAR NO ESPELHO', r: 20, act: S => G.say(pick(['Você se olha no espelho: nada mal, hein?', 'No espelho: um sujeito de aparência perigosa.', 'No espelho: o Rei da Cidade em construção.']), 3.5) }));
        R.objs.push(O('sofa', 90, 450, 170, 46, { e: 18 }));
        R.deco = x => { x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(138, 74, 334, 66); const g = x.createLinearGradient(140, 76, 470, 138); g.addColorStop(0, '#aecde8'); g.addColorStop(0.5, '#e8f4ff'); g.addColorStop(1, '#8ab0d0'); x.fillStyle = g; x.fillRect(142, 78, 326, 58); x.fillStyle = 'rgba(255,255,255,0.5)'; x.beginPath(); x.moveTo(170, 78); x.lineTo(210, 78); x.lineTo(180, 136); x.lineTo(150, 136); x.closePath(); x.fill(); x.fillStyle = '#f2f2f2'; x.fillRect(590, 80, 8, 40); x.fillStyle = '#d33a3a'; x.fillRect(590, 80, 8, 10); x.fillStyle = '#2a58b8'; x.fillRect(590, 100, 8, 10); neon(x, 'BARBEARIA', 650, 108, 20, '#ff6ad0'); };
        npc(520, 255, ['E aí, campeão! Vai de que corte hoje?', 'Barba, cabelo e bigode, o que precisar!', 'Se quiser mudar o visual, é só sentar na cadeira.', 'Pintar o cabelo? Sem problema, uma tinta nova.'], { shirt: '#1c1c22', pat: 'liso', sleeve: 'curta', fem: false, hairStyle: 'topete', acc: 'none' });
        break;
      case 'shopping':
        Object.assign(R, { piso: 'carpete', pisoCores: ['#c4b49a', '#b4a288'], parede: '#e0d4bc', preview: true });
        R.objs.push(O('arara', 100, 190, 150, 36, { e: 36, label: 'TROCAR DE CAMISA ($30)', act: S => compra(S, 30, () => { mudaLook(S, 'roupa', ROUPAS.length); G.say('Camisa nova! Ficou bem em você.', 3); }) }));
        R.objs.push(O('arara', 290, 190, 150, 36, { e: 36, label: 'TROCAR A CALÇA ($25)', act: S => compra(S, 25, () => { mudaLook(S, 'calca', CALCAS.length); G.say('Calça nova!', 3); }) }));
        R.objs.push(O('estante', 480, 190, 90, 36, { e: 42, variante: 'tenis', label: 'TROCAR O TÊNIS ($25)', act: S => compra(S, 25, () => { mudaLook(S, 'tenis', TENIS.length); G.say('Tênis novo no pé!', 3); }) }));
        R.objs.push(O('estante', 100, 360, 130, 36, { e: 30, variante: 'acess', label: 'CHAPÉU / ÓCULOS ($15)', act: S => compra(S, 15, () => { mudaLook(S, 'acess', ACESS.length); G.say('Acessório novo!', 3); }) }));
        R.objs.push(O('provador', 280, 340, 90, 30, { e: 0, solid: false, invisivel: true, label: 'OLHAR NO PROVADOR', r: 50, act: S => G.say(pick(['No espelho do provador: ficou ótimo!', 'Será que combina? Combina sim.', 'Você se acha o galã da cidade.']), 3.5) }));
        R.objs.push(O('planta', 90, 440, 40, 50, {}), O('planta', 520, 440, 40, 50, {}));
        R.deco = x => { x.fillStyle = '#16181e'; x.fillRect(150, 70, 500, 34); x.fillStyle = '#e8c870'; x.font = 'bold 22px Georgia'; x.textAlign = 'center'; x.fillText('SHOPPING SANTA ÚRSULA', 400, 94); x.textAlign = 'left'; x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(FX0, 128, FX1 - FX0, 3); [100, 290, 480].forEach(a => { x.fillStyle = 'rgba(255,240,200,0.14)'; x.beginPath(); x.moveTo(a + 20, 110); x.lineTo(a + 80, 110); x.lineTo(a + 110, 190); x.lineTo(a - 10, 190); x.closePath(); x.fill(); }); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(280, 322, 90, 4); x.fillStyle = '#8ab0d0'; x.fillRect(284, 326, 82, 46); x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(290, 326, 12, 46); };
        npc(450, 330, ['Bem-vindo ao shopping! Leve o look que combina com você.', 'Camisa, calça, tênis, tem tudo em promoção!', 'Esse chapéu ficaria ótimo em você.', 'O provador é logo ali, fique à vontade.'], { shirt: '#3a7ad3', pat: 'liso', sleeve: 'curta', fem: true, hairStyle: 'longo', acc: 'none' });
        break;
      case 'teatro':
        Object.assign(R, { piso: 'carpete', pisoCores: ['#6a1a2a', '#7e2438'], parede: '#4a1020' });
        R.objs.push(O('palco', 170, 170, 460, 60, { e: 24 }));
        const assistir = S => {
          if (!S.ingresso) { G.say('Você precisa de um ingresso ($10 na bilheteria).', 3); return; }
          S.ingresso = false;
          L.trans(S, () => { S.dayT += 0.12; S.player.hp = 100; G.say('Espetáculo lindo! Você descansou e o tempo passou. (vida cheia)', 5); });
        };
        for (let j = 0; j < 3; j++) for (let i = 0; i < 7; i++) R.objs.push(O('poltrona', 190 + i * 56, 330 + j * 50, 40, 26, { e: 10, label: 'ASSISTIR AO ESPETÁCULO', r: 28, act: assistir }));
        R.objs.push(O('balcao', 560, 450, 150, 36, { e: 26, itens: 'bilhetes', top: '#a02030', front: '#6a1420', label: 'COMPRAR INGRESSO ($10)', act: S => { if (S.ingresso) { G.say('Você já tem um ingresso. Sente numa poltrona!', 3); return; } compra(S, 10, () => { S.ingresso = true; G.say('Ingresso comprado! Sente numa poltrona.', 3.5); }); } }));
        R.deco = x => { x.fillStyle = '#8a1428'; x.fillRect(FX0, 60, 100, 90); x.fillRect(FX1 - 100, 60, 100, 90); for (let k = 0; k < 6; k++) { x.fillStyle = 'rgba(0,0,0,' + (k % 2 ? 0.22 : 0.08) + ')'; x.fillRect(FX0 + k * 16, 60, 8, 90); x.fillRect(FX1 - 100 + k * 16, 60, 8, 90); } x.fillStyle = '#c8a24a'; x.fillRect(FX0, 60, FX1 - FX0, 8); neon(x, 'THEATRO PEDRO II', 400, 100, 22, '#ffd24a'); x.fillStyle = 'rgba(255,240,200,0.12)'; x.beginPath(); x.moveTo(330, 68); x.lineTo(470, 68); x.lineTo(560, 260); x.lineTo(240, 260); x.closePath(); x.fill(); R.luzes.push({ x: 400, y: 240, r: 260 }); };
        npc(520, 440, ['Ingresso? São só dez reais. O espetáculo é de arrepiar.', 'O Theatro Pedro II é patrimônio de Ribeirão!', 'A sessão começa assim que você sentar.'], { shirt: '#8a1428', pat: 'jaqueta', sleeve: 'longa', fem: false, hairStyle: 'curto', acc: 'none' });
        break;
      case 'casa':
        Object.assign(R, { piso: 'madeira', pisoCores: ['#8a6a46', '#6e5232'], parede: '#d8cdb0' });
        R.objs.push(O('tapete', 270, 290, 260, 140, { solid: false, k: -50 }));
        R.objs.push(O('cama', 100, 180, 150, 90, { e: 14, label: 'DORMIR ATÉ AMANHECER (SALVA O JOGO)', act: S => {
          L.trans(S, () => { S.dayT = Math.floor(S.dayT) + 1.02; S.player.hp = 100; S.heat = 0; S.heatLevel = 0; salvar(); G.say('Bom dia! Você dormiu bem. Vida cheia e jogo salvo.', 5); });
        } }));
        R.objs.push(O('geladeira', 620, 165, 60, 44, { e: 56, label: 'PEGAR ALGO NA GELADEIRA', act: S => { if (R.gelou) { G.say('A geladeira está vazia por enquanto.', 2.5); return; } R.gelou = true; cura(S, 20); G.say('Uma fatia fria de pizza! (+20 vida)', 3); } }));
        R.objs.push(O('tv', 340, 180, 120, 36, { e: 34, label: 'LIGAR A TV (NOTÍCIAS)', act: S => G.say(pick(MANCHETES), 5) }));
        R.objs.push(O('sofa', 300, 400, 200, 50, { e: 18, label: 'SENTAR NO SOFÁ', r: 30, act: S => { cura(S, 10); G.say('Você deu uma relaxada no sofá. (+10 vida)', 3); } }));
        R.objs.push(O('computador', 560, 340, 110, 40, { e: 24, label: 'VER MEU PROGRESSO NO COMPUTADOR', act: S => { const r = G.missions.rank(S.save.done); G.say('Missões: ' + S.save.done + '/' + (G.missions ? G.missions.TOTAL : 12) + '  —  Dinheiro: $' + S.save.money + (r ? '  —  Posição: ' + (r.n || r.name || r) : ''), 6); } }));
        R.objs.push(O('planta', 90, 440, 40, 50, {}), O('planta', 670, 440, 40, 50, {}));
        R.deco = x => { janela(x, 270, 76, 70, 56); janela(x, 480, 76, 70, 56); x.fillStyle = '#8a6a46'; x.fillRect(FX0, 140, FX1 - FX0, 4); cartaz(x, 600, 76, 42, 56, '#2a58b8', ['PINGUIM', 'CHOPP']); x.fillStyle = '#c8a24a'; x.fillRect(166, 84, 56, 40); x.fillStyle = '#6ab0e0'; x.fillRect(170, 88, 48, 32); R.luzes.push({ x: 300, y: 130, r: 200 }); };
        break;
      case 'academia':
        Object.assign(R, { piso: 'borracha', pisoCores: ['#2a2a32', '#3c3c46'], parede: '#34343f' });
        const treino = S => {
          if (S.save.forca >= 5) { G.say('Você já está sarado! Força no máximo.', 3); return; }
          compra(S, 10, () => { S.save.forca++; G.save(); S.player.hp = Math.max(1, S.player.hp - 6); G.say('Treino puxado! Força ' + S.save.forca + '/5 (socos mais fortes).', 4); });
        };
        [100, 200, 300].forEach(a => R.objs.push(O('esteira', a, 190, 76, 60, { e: 16, label: 'TREINAR ($10)', act: treino })));
        R.objs.push(O('supino', 480, 330, 150, 60, { e: 14, label: 'LEVANTAR PESO ($10)', act: treino }));
        R.objs.push(O('halteres', 560, 185, 140, 36, { e: 34, label: 'PEGAR HALTERES ($10)', act: treino }));
        R.objs.push(O('bebedouro', 90, 450, 36, 36, { e: 36, label: 'BEBER ÁGUA', act: S => { cura(S, 4); G.say('Água geladinha. (+vida)', 2.5); } }));
        R.deco = x => { x.fillStyle = '#e8402a'; x.font = 'bold 26px Arial Black, Arial'; x.textAlign = 'center'; x.fillText('ACADEMIA FORÇA TOTAL', 400, 102); x.textAlign = 'left'; x.fillStyle = 'rgba(255,255,255,0.14)'; x.fillRect(300, 112, 200, 30); cartaz(x, 90, 70, 60, 34, '#e0b32a', ['SEM DOR', 'SEM GANHO']); for (let k = 0; k < 3; k++) { x.fillStyle = '#8ab0d0'; x.fillRect(600 + k * 36, 70, 30, 56); } };
        npc(400, 440, ['Sem dor, sem ganho! Vamos treinar?', 'Cada treino aumenta a força dos seus socos.', 'Beba água! Hidratação é tudo.', 'Cinco treinos e você vira um touro.'], { shirt: '#e8402a', pat: 'liso', sleeve: 'regata', fem: false, hairStyle: 'raspado', acc: 'none' });
        break;
      default: // catedral
        Object.assign(R, { piso: 'pedra', pisoCores: ['#cbc7bb', '#aeaa9e'], parede: '#8a8a98' });
        R.objs.push(O('altar', 340, 175, 120, 46, { e: 30, label: 'ACENDER UMA VELA ($5)', act: S => compra(S, 5, () => { cura(S, 10); G.say('Você acendeu uma vela e fez um pedido. (+10 vida)', 3.5); }) }));
        R.objs.push(O('velas', 620, 200, 70, 40, { e: 28, label: 'ACENDER UMA VELA ($5)', act: S => compra(S, 5, () => { cura(S, 10); G.say('Uma vela a mais para quem precisa. (+10 vida)', 3.5); }) }));
        R.objs.push(O('confessionario', 84, 180, 76, 64, { e: 76, label: 'CONFESSAR E FAZER DOAÇÃO ($100)', act: S => { if (S.heat <= 0) { G.say('Você não tem nada na ficha. A polícia não procura você.', 3.5); return; } compra(S, 100, () => { S.heat = 0; S.heatLevel = 0; G.say('Você está absolvido. A polícia esqueceu de você.', 4.5); }); } }));
        for (let j = 0; j < 4; j++) { R.objs.push(O('banco_igreja', 150, 300 + j * 50, 170, 22, { e: 14, label: 'REZAR UM POUCO', r: 28, act: S => { cura(S, 5); G.say(pick(['Você rezou em silêncio. (+5 vida)', 'Um momento de paz. (+5 vida)']), 3); } })); R.objs.push(O('banco_igreja', 480, 300 + j * 50, 170, 22, { e: 14, label: 'REZAR UM POUCO', r: 28, act: S => { cura(S, 5); G.say('Você rezou em silêncio. (+5 vida)', 3); } })); }
        R.deco = x => { [140, 330, 520].forEach((a, k) => { const c = ['#c8302a', '#2a58b8', '#e0b32a'][k], g = x.createLinearGradient(a, 70, a + 100, 140); g.addColorStop(0, shade(c, 0.2)); g.addColorStop(1, shade(c, -0.2)); x.fillStyle = '#16181e'; x.beginPath(); x.moveTo(a - 4, 140); x.lineTo(a - 4, 84); x.quadraticCurveTo(a + 40, 56, a + 84, 84); x.lineTo(a + 84, 140); x.closePath(); x.fill(); x.fillStyle = g; x.beginPath(); x.moveTo(a, 138); x.lineTo(a, 86); x.quadraticCurveTo(a + 40, 62, a + 80, 86); x.lineTo(a + 80, 138); x.closePath(); x.fill(); x.strokeStyle = '#16181e'; x.lineWidth = 2; x.beginPath(); x.moveTo(a + 40, 66); x.lineTo(a + 40, 138); x.moveTo(a, 108); x.lineTo(a + 80, 108); x.stroke(); x.fillStyle = 'rgba(255,255,255,0.12)'; x.beginPath(); x.moveTo(a + 10, 140); x.lineTo(a + 70, 140); x.lineTo(a + 110, 300); x.lineTo(a - 30, 300); x.closePath(); x.fill(); }); x.fillStyle = '#c8a24a'; x.fillRect(396, 90, 8, 40); x.fillRect(386, 100, 28, 8); x.fillStyle = 'rgba(120,70,40,0.5)'; x.fillRect(250, FY0 + 2, 300, 8); x.fillStyle = '#8a1f3a'; x.fillRect(380, 240, 40, 240); x.strokeStyle = '#c8a24a'; x.lineWidth = 2; x.strokeRect(380.5, 240.5, 39, 239); };
        R.objs.push(O('tapete', 380, 240, 40, 240, { solid: false, invisivel: true, k: -50 }));
        R.luzes.push({ x: 400, y: 200, r: 280 });
        npc(400, 265, ['Que a paz esteja com você, meu filho.', 'A confissão alivia a alma e a ficha também...', 'Aqui dentro você está seguro. Aqui não entra polícia.', 'Uma vela pelos que precisam, quem sabe?'], { shirt: '#16181e', pat: 'liso', sleeve: 'longa', fem: false, hairStyle: 'careca', acc: 'none', pants: '#16181e' });
    }
    return R;
  }

  // ---------- por dentro: andar, usar objetos, sair ----------
  function sair(S) {
    const R = S.inside; if (!R || S.trans) return;
    G.snd.door();
    L.trans(S, () => {
      const P = S.player, pl = R.place;
      S.mode = 'play'; S.inside = null; P.x = pl.x; P.y = pl.y + 12; P.vx = P.vy = 0; P.h = Math.PI; S.cam.x = P.x; S.cam.y = P.y; S.prompt = '';
    });
  }
  function distRect(px, py, o) {
    const z = o.zona || [o.x, o.y - (o.e || 0), o.w, o.h + (o.e || 0)];
    const dx = Math.max(z[0] - px, 0, px - (z[0] + z[2])), dy = Math.max(z[1] - py, 0, py - (z[1] + z[3]));
    return Math.hypot(dx, dy);
  }

  L.atualizarDentro = function (S, dt, K, Kp) {
    const R = S.inside; if (!R) return;
    S.time += dt; S.prompt = '';
    if (R.npc && R.npc.p.bub) { R.npc.p.bub.t -= dt; if (R.npc.p.bub.t <= 0) R.npc.p.bub = null; }
    if (S.trans) return;
    if (Kp('Escape')) { sair(S); return; }
    let dx = (K('KeyD', 'ArrowRight') ? 1 : 0) - (K('KeyA', 'ArrowLeft') ? 1 : 0), dy = (K('KeyS', 'ArrowDown') ? 1 : 0) - (K('KeyW', 'ArrowUp') ? 1 : 0);
    const len = Math.hypot(dx, dy) || 1, sp = K('ShiftLeft', 'ShiftRight') ? 220 : 150;
    dx = dx / len * sp * dt; dy = dy / len * sp * dt;
    const livre = (x, y) => {
      if (x < FX0 + 14 || x > FX1 - 14 || y < FY0 + 14) return false;
      if (y > FY1 - 6 && Math.abs(x - 400) > 30) return false;
      for (const o of R.objs) if (o.solid && x > o.x - 10 && x < o.x + o.w + 10 && y > o.y - (o.e || 0) * 0.35 - 8 && y < o.y + o.h + 8) return false;
      return true;
    };
    if (livre(R.px + dx, R.py)) R.px += dx;
    if (livre(R.px, R.py + dy)) R.py += dy;
    R.py = Math.min(R.py, FY1 + 30);
    if (dx || dy) { R.ph += ((((Math.atan2(dy, dx) + Math.PI / 2 - R.ph) % TAU) + TAU + Math.PI) % TAU - Math.PI) * Math.min(1, 14 * dt); R.walk += Math.hypot(dx, dy) * 0.07; }
    if (R.py > FY1 + 4) { sair(S); return; }
    // objeto mais próximo
    let best = null, bd = 1e9;
    for (const o of R.objs) { if (!o.act) continue; const d = distRect(R.px, R.py, o); const dd = d - (o.t === 'npc' ? 12 : 0); if (d < (o.r || 34) && dd < bd) { bd = dd; best = o; } }
    R.sel = best;
    const naPorta = R.py > FY1 - 44 && Math.abs(R.px - 400) < 70;
    if (best) S.prompt = 'E: ' + best.label; else if (naPorta) S.prompt = 'E: SAIR';
    if (Kp('KeyE', 'Enter')) {
      if (best) best.act(S); else if (naPorta) sair(S);
    }
    S.sentado = null; S.bebado = Math.max(0, (S.bebado || 0) - dt);
  };

  // ---------- desenho da sala ----------
  L.desenharDentro = function (ctx, S) {
    const R = S.inside; if (!R) return;
    const t = S.time;
    if (!R.bg) R.bg = fundo(R);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    ctx.drawImage(R.bg, 0, 0);
    const lista = [];
    R.objs.forEach(o => { if (!o.invisivel) lista.push({ k: o.k !== undefined ? o.k : o.y + o.h, f: () => drawObj(ctx, o, t) }); });
    if (R.npc) lista.push({ k: R.npc.y + 4, f: () => { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(R.npc.x + 3, R.npc.y + 3, 15, 8, 0, 0, TAU); ctx.fill(); gente(ctx, S, R.npc.p, R.npc.x, R.npc.y - 8, 1.9, Math.PI + Math.sin(t * 0.5 + R.npc.x) * 0.1, 0); } });
    lista.push({ k: R.py, f: () => { ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.beginPath(); ctx.ellipse(R.px + 3, R.py + 3, 15, 8, 0, 0, TAU); ctx.fill(); gente(ctx, S, S.player, R.px, R.py - 8, 1.9, R.ph, R.walk); } });
    lista.sort((a, b) => a.k - b.k).forEach(i => i.f());
    // destaque do objeto selecionado
    if (R.sel && !S.trans) {
      const o = R.sel, z = o.zona || [o.x, o.y - (o.e || 0), o.w, o.h + (o.e || 0)]; ctx.save(); ctx.strokeStyle = 'rgba(255,224,74,' + (0.6 + 0.3 * Math.sin(t * 6)) + ')'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.strokeRect(z[0] - 3, z[1] - 3, z[2] + 6, z[3] + 6); ctx.restore();
    }
    // luz ambiente (manchas quentes) e vinheta
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    R.luzes.forEach(l => { const g = ctx.createRadialGradient(l.x, l.y, 10, l.x, l.y, l.r); g.addColorStop(0, 'rgba(255,214,150,0.13)'); g.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = g; ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2); });
    ctx.restore();
    const v = ctx.createRadialGradient(400, 320, 220, 400, 320, 520); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.62)'); ctx.fillStyle = v; ctx.fillRect(0, 0, VW, VH);
    // balão do atendente
    if (R.npc && R.npc.p.bub) desenhaBolha(ctx, R.npc.x, R.npc.y - 30, R.npc.p.bub.txt, clamp(R.npc.p.bub.t * 2, 0, 1));
    // cartão do visual (barbearia / shopping)
    if (R.preview) {
      ctx.save(); ctx.fillStyle = 'rgba(8,6,16,0.82)'; W.rrect(ctx, 590, 215, 135, 180, 8); ctx.fill(); ctx.strokeStyle = R.cor; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.fillText('SEU VISUAL', 657, 234);
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.ellipse(657, 372, 40, 12, 0, 0, TAU); ctx.fill();
      gente(ctx, S, S.player, 657, 352, 4.4, Math.PI + Math.sin(t) * 0.5, 0);
      ctx.restore();
    }
    // título e barra de comando
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, VW, 40); ctx.fillStyle = R.cor; ctx.fillRect(0, 40, VW, 3);
    ctx.font = 'bold 20px Arial'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(R.nome, 20, 27);
    ctx.textAlign = 'right'; ctx.font = 'bold 14px Arial'; ctx.fillStyle = '#9dff9d'; ctx.fillText('$' + S.save.money, VW - 20, 17); ctx.fillStyle = '#ff7a7a'; ctx.fillText('VIDA ' + Math.ceil(S.player.hp), VW - 20, 34);
    ctx.restore();
    if (S.prompt) { ctx.save(); ctx.font = 'bold 15px Arial'; const w = ctx.measureText(S.prompt).width + 28; ctx.fillStyle = 'rgba(0,0,0,0.78)'; W.rrect(ctx, 400 - w / 2, 56, w, 28, 8); ctx.fill(); ctx.strokeStyle = '#ffe04a'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#ffe04a'; ctx.textAlign = 'center'; ctx.fillText(S.prompt, 400, 75); ctx.restore(); }
    // mensagem do jogo (G.say)
    if (S.msg && S.msg.t > 0) { ctx.save(); ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; if (ctx.measureText(S.msg.text).width > 730) ctx.font = 'bold 11px Arial'; const w = Math.min(780, ctx.measureText(S.msg.text).width + 30); ctx.fillStyle = 'rgba(0,0,0,0.78)'; W.rrect(ctx, 400 - w / 2, 540, w, 34, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(S.msg.text, 400, 562); ctx.restore(); }
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px Arial'; ctx.textAlign = 'right'; ctx.fillText('WASD andar · E usar · ESC sair', VW - 12, VH - 8); ctx.textAlign = 'left';
  };
})(window.G = window.G || {});
