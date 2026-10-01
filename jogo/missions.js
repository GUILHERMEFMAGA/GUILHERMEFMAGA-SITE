/* ============================================================
   missions.js — telefones públicos, missões e lugares da cidade
   (entrega, táxi, roubo de carro, corrida, fuga e acerto de contas)
   ============================================================ */
(function (G) {
  'use strict';
  const W = G.world, T = W.T;
  const TAU = Math.PI * 2;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const rand = (a, b) => a + Math.random() * (b - a);

  // ---------- Lugares ----------
  const POI = {
    garage: Object.assign(W.sidePoint(0, 0, 'bottom', 0.5), { r: 52, name: 'GARAGEM' }),
    oficina: Object.assign(W.sidePoint(2, 2, 'top', 0.5), { r: 52, name: 'OFICINA' }),
    hospital: Object.assign(W.sidePoint(4, 1, 'bottom', 0.5), { r: 40, name: 'HOSPITAL' }),
    delegacia: Object.assign(W.sidePoint(1, 3, 'right', 0.5), { r: 40, name: 'DELEGACIA' }),
    armas: Object.assign(W.sidePoint(1, 0, 'bottom', 0.5), { r: 46, name: 'LOJA DE ARMAS' }),
  };
  const PHONES = [
    W.sidePoint(0, 2, 'right', 0.3), W.sidePoint(2, 0, 'bottom', 0.7),
    W.sidePoint(4, 3, 'top', 0.3), W.sidePoint(5, 1, 'left', 0.6),
    // telefones dos bairros novos (mapa dobrado)
    W.sidePoint(7, 0, 'bottom', 0.4), W.sidePoint(8, 2, 'left', 0.5), W.sidePoint(2, 5, 'top', 0.6), W.sidePoint(6, 4, 'right', 0.5), W.sidePoint(4, 5, 'left', 0.4),
  ].map(p => Object.assign(p, { r: 40 }));

  // ---------- Definições das 12 missões ----------
  const DEFS = [
    { type: 'delivery', name: 'Pacote do Seu Zé', pay: 250, slack: 1.9, brief: 'Seu Zé: Pegue o pacote no ponto marcado e leve até o destino antes que esfrie. Sem pressa... quase!' },
    { type: 'taxi', name: 'Dona Marta', pay: 300, brief: 'Dona Marta precisa ir ao mercado. Busque a passageira e dirija com jeitinho. Batida desconta da gorjeta!' },
    { type: 'steal', name: 'O Fusca Verde', pay: 350, car: { kind: 'sedan', color: '#2f8a3c', label: 'sedã verde' }, brief: 'Um cliente quer um sedã verde. Encontre o carro marcado e leve até o desmanche. Cuidado com a polícia!' },
    { type: 'race', name: 'Racha da Avenida', pay: 500, cps: 5, rivals: 2, brief: 'Racha valendo grana! Vá até a linha de largada, passe pelos cruzamentos marcados e chegue antes dos rivais.' },
    { type: 'hit', name: 'Cobrança', pay: 450, weapons: ['pistol', 'bat', 'pistol'], give: { pistol: 48 }, brief: 'Uns caras devem dinheiro ao chefe e não querem pagar. Peguei uma pistola para você. Vá até a área marcada e elimine os três. Eles vão atirar de volta!' },
    { type: 'escape', name: 'Deu Ruim', pay: 400, level: 3, brief: 'Fizeram alguma coisa e a polícia quer você! Despiste as viaturas e volte para a garagem!' },
    { type: 'delivery', name: 'Entrega Relâmpago', pay: 450, slack: 1.25, brief: 'Entrega urgente do Seu Zé. Dessa vez o tempo é curto. Pé embaixo!' },
    { type: 'taxi', name: 'Passageiro VIP', pay: 500, vip: true, brief: 'Um figurão quer chegar inteiro. Dirija suave: qualquer batida estraga a corrida.' },
    { type: 'steal', name: 'Táxi Amarelo', pay: 550, car: { kind: 'taxi', color: '#f2c42a', label: 'táxi amarelo' }, wanted: 1, brief: 'Preciso de um táxi amarelo com urgência. Pegue o marcado e entregue no desmanche.' },
    { type: 'hit', name: 'Guerra de Gangues', pay: 850, weapons: ['smg', 'pistol', 'pistol', 'bat', 'smg'], give: { smg: 120 }, brief: 'A gangue rival tomou o bairro. Deixei uma submetralhadora para você. São cinco armados: use a cobertura, colete e não fique parado!' },
    { type: 'race', name: 'Grande Prêmio', pay: 700, cps: 7, rivals: 3, brief: 'Grande Prêmio da cidade! Sete pontos, três rivais. Só o primeiro leva a bolada.' },
    { type: 'escape', name: 'Fuga Final', pay: 650, level: 4, brief: 'A cidade inteira está atrás de você. Sobreviva à perseguição e chegue à garagem!' },
  ];
  const RANKS = ['Motorista Novato', 'Entregador', 'Piloto de Fuga', 'Mestre do Asfalto', 'Lenda da Rua', 'Rei da Cidade'];
  const GOAL = 4000;
  const rankIdx = done => Math.min(5, Math.floor(done / 2));

  function randSpot(S, minD, maxD, from) {
    const f = from || S.player;
    const c = W.spots.filter(p => { const d = Math.hypot(p.x - f.x, p.y - f.y); return d >= minD && d <= maxD; });
    const arr = c.length ? c : W.spots;
    const p = arr[Math.floor(Math.random() * arr.length)];
    return { x: p.x, y: p.y };
  }

  const M = { POI, PHONES, DEFS, RANKS, GOAL, TOTAL: DEFS.length, active: null };

  M.rank = done => RANKS[rankIdx(done)];
  M.mult = done => 1 + 0.1 * rankIdx(done);

  M.startNext = function (S, ph) {
    if (M.active) return;
    const n = S.save.done;
    const def = DEFS[n % DEFS.length];
    const m = { def, type: def.type, stage: 0, markers: [], timeLeft: null, hint: '', n };
    const from = ph || S.player;
    if (def.type === 'delivery') {
      m.A = randSpot(S, 500, 1100, from); m.B = randSpot(S, 900, 1900, m.A);
      m.markers = [{ x: m.A.x, y: m.A.y, r: 48, label: 'PACOTE' }];
      m.hint = 'Pegue o pacote';
    } else if (def.type === 'taxi') {
      m.A = randSpot(S, 500, 1100, from); m.B = randSpot(S, 900, 1900, m.A);
      const p = G.ai.makePed(m.A.x, m.A.y); p.state = 'wait'; p.mission = true; p.shirt = def.vip ? '#111' : '#e8d8f0'; p.h = rand(0, TAU);
      S.peds.push(p); m.ped = p; m.comfort = 100;
      m.markers = [{ x: m.A.x, y: m.A.y, r: 52, label: 'PASSAGEIRO' }];
      m.hint = 'Busque o passageiro (de carro!)';
    } else if (def.type === 'steal') {
      const pt = G.ai.randomRoadPoint(from.x, from.y, 600, 1200);
      const c = new G.Car({ x: pt.x, y: pt.y, a: pt.a, kind: def.car.kind, color: def.car.color, driver: 'none', mode: 'parked', tag: 'mission' });
      S.cars.push(c); m.car = c; m.B = randSpot(S, 900, 1900, pt);
      m.markers = [{ x: c.x, y: c.y, r: 60, label: def.car.label.toUpperCase(), follow: c }];
      m.hint = 'Encontre o ' + def.car.label;
    } else if (def.type === 'race') {
      const i0 = 1 + Math.floor(Math.random() * (W.COLS - 1)), j0 = 1 + Math.floor(Math.random() * (W.ROWS - 1));
      m.start = { i: i0, j: j0 }; m.cps = []; let ci = i0, cj = j0;
      for (let k = 0; k < def.cps; k++) {
        let t = 0, ni, nj;
        do { ni = ci + (Math.floor(Math.random() * 5) - 2); nj = cj + (Math.floor(Math.random() * 3) - 1); t++; }
        while (t < 30 && (ni < 0 || nj < 0 || ni > W.COLS || nj > W.ROWS || (ni === ci && nj === cj) || Math.abs(ni - ci) + Math.abs(nj - cj) < 2));
        if (ni < 0 || nj < 0 || ni > W.COLS || nj > W.ROWS) { ni = ci; nj = cj === 0 ? 2 : cj - 2; }
        m.cps.push({ i: ni, j: nj }); ci = ni; cj = nj;
      }
      m.cp = 0; m.cd = 0; m.rivals = []; m.racing = false; m.placed = 0;
      m.markers = [{ x: W.nodeX(i0), y: W.nodeY(j0), r: 80, label: 'LARGADA' }];
      m.hint = 'Vá até a linha de largada';
    } else if (def.type === 'hit') {
      const spot = randSpot(S, 900, 1900, from);
      S.thugAlert = false; m.thugs = [];
      def.weapons.forEach((w, k) => {
        let x = spot.x, y = spot.y;
        for (let t = 0; t < 30; t++) { const a = rand(0, TAU), d = rand(25, 95), qx = spot.x + Math.cos(a) * d, qy = spot.y + Math.sin(a) * d; if (!W.isSolid(qx, qy) && !W.treeHit(qx, qy, 4) && W.tileAt(qx, qy) !== W.TILE.ROAD) { x = qx; y = qy; break; } }
        const p = G.ai.makePed(x, y);
        Object.assign(p, { kind: 'thug', target: true, state: 'guard', weapon: w, armed: true, hp: w === 'bat' ? 70 : 60, shirt: k % 2 ? '#2b2b33' : '#7a1c1c', hair: '#111', cap: null, h: rand(0, TAU) });
        S.peds.push(p); m.thugs.push(p);
      });
      m.spot = spot;
      m.markers = [{ x: spot.x, y: spot.y, r: 150, label: 'ALVOS' }];
      m.hint = 'Elimine os ' + m.thugs.length + ' alvos';
      Object.keys(def.give || {}).forEach(id => { if (!G.combat.arms(S).own[id] || G.combat.ammoOf(S, id) < 20) G.combat.giveWeapon(S, id, def.give[id], true); });
      G.combat.select(S, def.weapons.includes('smg') ? 'smg' : 'pistol');
    } else if (def.type === 'escape') {
      S.heat = def.level * 20 - 4; m.hint = 'Despiste a polícia! Volte à garagem';
      m.markers = [{ x: POI.garage.x, y: POI.garage.y, r: 70, label: 'GARAGEM' }];
    }
    M.active = m;
    G.say(def.brief, 9);
    G.banner('MISSÃO ' + (n + 1), def.name.toUpperCase());
    G.snd.pick();
  };

  M.fail = function (S, why) {
    const m = M.active; if (!m) return;
    if (m.ped) m.ped.dead = true;
    M.cleanup(S, m);
    M.active = null;
    G.say('MISSÃO FALHOU: ' + why, 6);
    G.banner('MISSÃO FALHOU', why.toUpperCase(), true);
    G.snd.fail();
  };
  M.cleanup = function (S, m) {
    if (m.rivals) m.rivals.forEach(r => { r.car.mode = 'wander'; r.car.nav.mode = 'wander'; r.car.ignoreLights = false; r.car.cruise = rand(170, 230); r.car.hold = 0; });
    if (m.car && m.car.mode !== 'player') m.car.tag = '';
    if (m.thugs) m.thugs.forEach(p => { if (p.state !== 'dead') { p.dead = true; } else p.target = false; });
  };
  M.complete = function (S, pay, extra) {
    const m = M.active; if (!m) return;
    const total = Math.round(pay * M.mult(S.save.done));
    S.save.money += total; S.save.done++;
    G.save();
    M.cleanup(S, m);
    M.active = null;
    G.snd.win(); setTimeout(() => G.snd.cash(), 500);
    const king = S.save.done >= M.TOTAL && S.save.money >= GOAL;
    G.banner(king ? 'REI DA CIDADE!' : 'MISSÃO CUMPRIDA', '+$' + total + (extra ? '  ' + extra : ''));
    let msg = m.def.name + ' concluída! +$' + total + '.';
    if (king && !S.save.king) { S.save.king = true; G.save(); msg = 'VOCÊ É O REI DA CIDADE! Campanha completa. Continue no modo livre!'; }
    else if (S.save.done >= M.TOTAL && S.save.money < GOAL) msg += ' Faltam $' + (GOAL - S.save.money) + ' para ser o Rei da Cidade.';
    else msg += ' Ligue em outro telefone para a próxima.';
    G.say(msg, 8);
  };

  const inCircle = (p, mk, extra) => Math.hypot(p.x - mk.x, p.y - mk.y) < mk.r + (extra || 0);

  M.update = function (S, dt) {
    const m = M.active; if (!m) return;
    const P = S.player, pc = P.car, ref = pc || P;
    m.markers.forEach(mk => { if (mk.follow) { mk.x = mk.follow.x; mk.y = mk.follow.y; } });
    if (m.timeLeft != null) {
      m.timeLeft -= dt;
      if (m.timeLeft <= 0) return M.fail(S, 'acabou o tempo');
    }
    const slow = v => !pc || pc.speed < v;
    if (m.type === 'delivery') {
      if (m.stage === 0 && inCircle(ref, m.markers[0])) {
        m.stage = 1; G.snd.pick();
        m.timeLeft = (Math.abs(m.A.x - m.B.x) + Math.abs(m.A.y - m.B.y)) / 190 * m.def.slack + 12;
        m.markers = [{ x: m.B.x, y: m.B.y, r: 52, label: 'DESTINO' }]; m.hint = 'Entregue o pacote a tempo'; G.say('Pacote na mão! Leve ao destino antes do tempo acabar.', 5);
      } else if (m.stage === 1 && inCircle(ref, m.markers[0])) M.complete(S, m.def.pay, m.timeLeft > 20 ? '(+ gorjeta)' : '');
    } else if (m.type === 'taxi') {
      if (m.stage === 0) {
        if (inCircle(ref, m.markers[0])) {
          if (!pc) { m.warn = (m.warn || 0) - dt; if (m.warn <= 0) { G.say('Você precisa estar de carro para o passageiro embarcar!', 3); m.warn = 4; } }
          else if (pc.speed < 220) {
            m.ped.dead = true; m.stage = 1; G.snd.pick(); m.comfort = 100;
            m.markers = [{ x: m.B.x, y: m.B.y, r: 55, label: 'DESTINO' }]; m.hint = 'Leve o passageiro sem bater'; G.say('Passageiro a bordo! Cuidado com as batidas.', 5);
          }
        }
      } else {
        if (!pc) { m.leaveT = (m.leaveT || 0) + dt; if (m.leaveT > 12) return M.fail(S, 'você abandonou o passageiro'); } else m.leaveT = 0;
        if (m.comfort <= 0) return M.fail(S, 'passageiro furioso');
        if (pc && inCircle(ref, m.markers[0]) && pc.speed < 250) M.complete(S, m.def.pay * (0.6 + 0.4 * m.comfort / 100), m.comfort > 80 ? '(ótima direção!)' : '');
      }
    } else if (m.type === 'steal') {
      if (m.car.dead) return M.fail(S, 'o carro foi destruído');
      if (m.stage === 0) {
        if (pc === m.car) {
          m.stage = 1; G.snd.pick();
          m.markers = [{ x: m.B.x, y: m.B.y, r: 60, label: 'DESMANCHE' }]; m.hint = 'Leve o carro ao desmanche';
          G.say('Boa! Agora leve o carro ao desmanche.', 5);
          if (m.def.wanted) G.addHeat(m.def.wanted * 20);
        }
      } else {
        if (Math.hypot(m.car.x - m.B.x, m.car.y - m.B.y) < 70 && Math.hypot(ref.x - m.B.x, ref.y - m.B.y) < 160) M.complete(S, m.def.pay);
      }
    } else if (m.type === 'hit') {
      const left = m.thugs.filter(p => p.state !== 'dead' && !p.dead).length;
      m.hint = left ? 'Elimine os alvos (faltam ' + left + ')' : 'Alvos eliminados!';
      if (left !== m.left) { if (m.left != null && left < m.left) G.snd.pick(); m.left = left; }
      if (left === 0) { m.thugs.forEach(p => { p.target = false; }); M.complete(S, m.def.pay, '(alvos eliminados)'); }
    } else if (m.type === 'race') {
      updateRace(S, m, dt);
    } else if (m.type === 'escape') {
      const g = POI.garage;
      if (inCircle(ref, m.markers[0])) {
        const cop = S.cars.some(c => c.kind === 'police' && c.mode === 'chase' && Math.hypot(c.x - ref.x, c.y - ref.y) < 300);
        if (!cop && slow(300)) { S.heat = 0; M.complete(S, m.def.pay); }
        else { m.warn = (m.warn || 0) - dt; if (m.warn <= 0) { G.say('Eles ainda estão na sua cola! Despiste as viaturas primeiro.', 3); m.warn = 4; } }
      }
    }
  };

  function updateRace(S, m, dt) {
    const P = S.player, pc = P.car, ref = pc || P;
    if (!m.racing) {
      const mk = m.markers[0];
      if (inCircle(ref, mk) && !m.done) {
        if (!m.rivals.length) spawnRivals(S, m);
        const before = Math.ceil(m.cd);
        m.cd += dt;
        const sec = 3 - Math.floor(m.cd);
        if (sec !== m.lastSec && sec > 0) { m.lastSec = sec; G.snd.count(); G.banner(String(sec), 'PREPARAR', false, 0.9); }
        if (m.cd >= 3) { m.racing = true; m.cp = 0; G.snd.go(); G.banner('VAI!', 'CORRA!', false, 1); m.t0 = S.time; m.hint = 'Passe pelos pontos!'; setCps(m); m.rivals.forEach(r => { r.car.hold = 0; r.car.mode = 'race'; }); }
      } else { m.cd = Math.max(0, m.cd - dt * 2); m.lastSec = 0; }
      if (!m.racing) m.rivals.forEach(r => { r.car.hold = 1; });
      return;
    }
    // corrida em andamento
    const cp = m.cps[m.cp];
    const cx = W.nodeX(cp.i), cy = W.nodeY(cp.j);
    if (Math.hypot(ref.x - cx, ref.y - cy) < 100) {
      m.cp++; G.snd.pick();
      if (m.cp >= m.cps.length) {
        const place = 1 + m.rivals.filter(r => r.finished).length;
        if (place === 1) M.complete(S, m.def.pay, '(1º lugar!)');
        else M.fail(S, 'você chegou em ' + place + 'º lugar');
        return;
      }
      setCps(m);
    }
    // rivais
    m.rivals.forEach(r => {
      if (r.finished) return;
      const c = m.cps[r.cp]; const x = W.nodeX(c.i), y = W.nodeY(c.j);
      if (Math.hypot(r.car.x - x, r.car.y - y) < 120) {
        r.cp++;
        if (r.cp >= m.cps.length) { r.finished = true; r.car.nav.mode = 'wander'; r.car.cruise = 200; G.say(r.name + ' cruzou a chegada!', 3); if (m.cp < m.cps.length) { const place = 1 + m.rivals.filter(q => q.finished).length; if (place > m.rivals.length) return M.fail(S, 'você foi o último'); } return; }
        const nc = m.cps[r.cp]; r.car.nav.target = { i: nc.i, j: nc.j };
      }
      // elástico para manter a corrida disputada
      const dn = Math.hypot(r.car.x - W.nodeX(m.cps[Math.min(r.cp, m.cps.length - 1)].i), r.car.y - W.nodeY(m.cps[Math.min(r.cp, m.cps.length - 1)].j));
      const pn = Math.hypot(ref.x - W.nodeX(cp.i), ref.y - W.nodeY(cp.j));
      const rp = r.cp * 900 - dn, pp = m.cp * 900 - pn;
      r.car.cruise = r.base * (rp > pp + 700 ? 0.82 : rp < pp - 700 ? 1.1 : 1);
    });
  }
  function setCps(m) {
    const cp = m.cps[m.cp], nx = m.cps[m.cp + 1];
    m.markers = [{ x: W.nodeX(cp.i), y: W.nodeY(cp.j), r: 100, label: 'PONTO ' + (m.cp + 1) + '/' + m.cps.length }];
    if (nx) m.markers.push({ x: W.nodeX(nx.i), y: W.nodeY(nx.j), r: 60, label: '', small: true });
  }
  function spawnRivals(S, m) {
    const names = ['Juninho', 'Tico', 'Dani Turbo'], cols = ['#1f9d3a', '#2b59c4', '#d8d04a'];
    const i = m.start.i, j = m.start.j;
    for (let k = 0; k < m.def.rivals; k++) {
      const dir = 1, off = 90 + k * 100;
      const lane = k % 2 === 0 ? 1 : -1;
      const x = lane > 0 ? W.laneV(i, 1) : W.laneV(i, -1) , y = W.nodeY(j) - 110 - k * 90;
      // os rivais ficam na faixa descendo (dir=1) antes do cruzamento
      const c = new G.Car({ x: W.laneV(i, 1), y: W.nodeY(j) - 120 - k * 92, a: Math.PI, kind: 'coupe', color: cols[k % 3], driver: 'ai', mode: 'race', mass: 1.1 });
      c.max = 330 + k * 10; c.nav = G.ai.initNav('v', i, 1, c.y); c.nav.mode = 'goto'; c.nav.target = { i: m.cps[0].i, j: m.cps[0].j };
      c.ignoreLights = true; c.cruise = 270 + k * 12; c.hold = 1;
      S.cars.push(c); m.rivals.push({ car: c, cp: 0, base: 270 + k * 12, name: names[k % 3], finished: false });
    }
  }

  // desenha os marcadores no mundo
  M.drawWorld = function (ctx, S, time) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 5);
    const ring = (x, y, r, col, label, fill) => {
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = fill; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -time * 30; ctx.stroke();
      ctx.restore();
    };
    // lugares
    Object.keys(POI).forEach(k => {
      const p = POI[k];
      const col = k === 'oficina' ? '#ff9a3d' : k === 'garage' ? '#6fd0ff' : k === 'hospital' ? '#ff6b6b' : k === 'armas' ? '#ff4fd8' : '#7a9bff';
      ring(p.x, p.y, p.r, col, '', 'rgba(255,255,255,0.10)');
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.fillStyle = col; ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
      if (k === 'hospital') { ctx.fillStyle = '#fff'; ctx.fillRect(-16, -16, 32, 32); ctx.fillStyle = '#e03030'; ctx.fillRect(-4, -12, 8, 24); ctx.fillRect(-12, -4, 24, 8); ctx.strokeRect(-16, -16, 32, 32); }
      else if (k === 'garage') { ctx.beginPath(); ctx.moveTo(-18, 6); ctx.lineTo(0, -16); ctx.lineTo(18, 6); ctx.lineTo(18, 16); ctx.lineTo(-18, 16); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#223'; ctx.fillRect(-8, 2, 16, 14); }
      else if (k === 'oficina') { ctx.rotate(0.8); ctx.fillRect(-3, -16, 6, 32); ctx.beginPath(); ctx.arc(0, -16, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#6a3a10'; ctx.beginPath(); ctx.arc(0, -16, 3, 0, TAU); ctx.fill(); }
      else if (k === 'armas') { ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#111'; ctx.fillRect(-10, -4, 17, 6); ctx.fillRect(-9, 1, 6, 9); ctx.fillStyle = '#ddd'; ctx.fillRect(5, -4, 6, 3); }
      else { ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★', 0, 7); }
      ctx.restore();
    });
    // telefones
    PHONES.forEach(p => {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(p.x - 6, p.y - 6, 18, 18);
      ctx.fillStyle = '#2a64c8'; ctx.fillRect(p.x - 9, p.y - 9, 18, 18);
      ctx.fillStyle = '#9fd0ff'; ctx.fillRect(p.x - 6, p.y - 6, 12, 12);
      ctx.fillStyle = '#111'; ctx.fillRect(p.x - 3, p.y - 3, 6, 4); ctx.strokeStyle = '#0a1a3a'; ctx.lineWidth = 2; ctx.strokeRect(p.x - 9, p.y - 9, 18, 18);
      if (!M.active) { // anel amarelo: missão disponível
        ctx.save(); ctx.strokeStyle = 'rgba(255,220,40,' + (0.5 + 0.5 * pulse) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 26 + pulse * 6, 0, TAU); ctx.stroke(); ctx.restore();
      }
    });
    // marcadores da missão
    const m = M.active; if (!m) return;
    m.markers.forEach(mk => {
      const col = mk.small ? 'rgba(255,255,255,0.8)' : '#ffd21f';
      ring(mk.x, mk.y, mk.r * (mk.small ? 1 : 0.9 + 0.1 * pulse), col, mk.label, mk.small ? 'rgba(255,255,255,0.08)' : 'rgba(255,210,30,0.20)');
    });
  };

  // ---------- Reações do jogo ----------
  M.onCrashPlayerCar = function (imp) {
    const m = M.active; if (m && m.type === 'taxi' && m.stage === 1) m.comfort -= imp * (m.def.vip ? 0.28 : 0.14);
  };

  G.missions = M;
})(window.G = window.G || {});
