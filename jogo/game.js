/* ============================================================
   game.js — laço principal, jogador, polícia, colisões, câmera e telas
   ============================================================ */
(function (G) {
  'use strict';
  const W = G.world, T = W.T, M = G.missions, AI = G.ai, SP = G.sprites;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const wrap = AI.wrap;
  const VW = 800, VH = 600;
  const SAVE_KEY = 'ruaVermelha.v1';
  const PAINTS = ['#c4161c', '#1f4fd8', '#f0f0f0', '#15151a', '#e8a020', '#2fa84f', '#8a3fc2'];

  const S = G.S = {
    time: 0, dayT: 0.28, cars: [], peds: [], particles: [], heat: 0, heatLevel: 0, chasers: 0,
    player: null, save: { money: 0, done: 0, paint: 0, king: false }, cam: { x: 0, y: 0, z: 1.5 },
    msg: null, ban: null, radioT: 0, prompt: '', bustT: 0, heli: null, mode: 'loading', modeT: 0,
    copT: 0, blockT: 0, spawnT: 0, pedSpawnT: 0, hornDown: false, redCar: null, shake: 0, hitCool: 0,
  };

  // ---------- Salvar / carregar ----------
  G.save = function () { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S.save)); } catch (e) { } };
  function loadSave() { try { const j = JSON.parse(localStorage.getItem(SAVE_KEY)); if (j && typeof j.money === 'number') S.save = Object.assign({ money: 0, done: 0, paint: 0, king: false, look: {}, forca: 0 }, j); } catch (e) { } }
  const hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };

  // ---------- Mensagens ----------
  G.say = function (text, secs) { S.msg = { text, t: secs || 5 }; };
  G.banner = function (title, sub, fail, dur) { S.ban = { title, sub, fail, t: dur || 2.6, dur: dur || 2.6 }; };

  // ---------- Partículas ----------
  G.particle = function (p) { if (S.particles.length > 420) S.particles.shift(); p.t = 0; p.max = p.life; S.particles.push(p); };
  function sparks(x, y, n, col) { for (let k = 0; k < n; k++) { const a = rand(0, TAU), v = rand(60, 220); G.particle({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.2, 0.5), size: 2.5, col: col || 'spark' }); } }

  // ---------- Procurado ----------
  G.addHeat = function (n) { S.heat = clamp(S.heat + n, 0, 100); };
  const lvlOf = h => h <= 0 ? 0 : Math.min(5, Math.ceil(h / 20));
  function copNear(x, y, r) { for (const c of S.cars) if (c.kind === 'police' && !c.dead && Math.abs(c.x - x) < r && Math.abs(c.y - y) < r && Math.hypot(c.x - x, c.y - y) < r) return true; return false; }

  // ---------- Batidas / explosões ----------
  G.carCrash = function (a, b, imp, x, y) {
    const P = S.player;
    const isP = c => c && c === P.car;
    if ((a.hitCool > 0 && (!b || b.hitCool > 0))) return;
    const dmg = Math.max(0, (imp - 60) * 0.085);
    a.hitCool = 0.12; if (b) b.hitCool = 0.12;
    if (dmg > 0) {
      const copHit = b && (a.kind === 'police' || b.kind === 'police') && (isP(a) || isP(b));
      G.carDamage(a, dmg * (copHit && isP(a) ? 0.35 : 1)); if (b) G.carDamage(b, dmg * (copHit && isP(b) ? 0.35 : 0.9));
    }
    sparks(x, y, Math.min(12, 3 + imp / 40));
    if (Math.hypot(x - P.x, y - P.y) < 600) G.snd.crash(Math.min(1, imp / 300));
    if (imp > 160) S.shake = Math.min(10, S.shake + imp / 60);
    const pc = isP(a) ? a : isP(b) ? b : null;
    if (pc) {
      M.onCrashPlayerCar(imp);
      P.hp -= dmg * 0.4; if (P.hp <= 0 && !P.dead) P.hp = 0;
      const o = pc === a ? b : a;
      if (o && o.kind === 'police' && imp > 70) G.addHeat(o.mode === 'chase' ? 3 : 18);
      else if (o && imp > 110 && copNear(pc.x, pc.y, 450)) G.addHeat(8);
    }
  };
  G.explodeCar = function (c) {
    c.dead = true; c.hp = 0; c.thr = 0;
    G.snd.boom(); S.shake = 14;
    for (let k = 0; k < 26; k++) { const a = rand(0, TAU), v = rand(30, 190); G.particle({ x: c.x, y: c.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.5, 1.2), size: rand(9, 20), col: k % 3 === 0 ? 'smoke' : 'fire' }); }
    sparks(c.x, c.y, 18);
    G.particle({ x: c.x, y: c.y, vx: 0, vy: 0, life: 0.45, size: 10, col: 'ring' });
    for (let k = 0; k < 8; k++) G.particle({ x: c.x + rand(-14, 14), y: c.y + rand(-14, 14), vx: rand(-25, 25), vy: rand(-40, -10), life: rand(2, 3.2), size: rand(10, 18), col: 'smoke' });
    const P = S.player;
    if (c.driver === 'player' || P.car === c) {
      P.car = null; P.x = c.x + c.fx * 10; P.y = c.y + 50; P.hp -= 45; P.iframes = 1.5; P.vx = rand(-90, 90); P.vy = rand(60, 120);
    } else {
      const d = Math.hypot(P.x - c.x, P.y - c.y);
      if (!P.car && d < 110) { P.hp -= 40; P.iframes = 1; }
      else if (P.car && P.car !== c && d < 100) G.carDamage(P.car, 35);
    }
    S.cars.forEach(o => { if (o !== c && Math.hypot(o.x - c.x, o.y - c.y) < 110) { G.carDamage(o, 40); const a = Math.atan2(o.y - c.y, o.x - c.x); o.vx += Math.cos(a) * 180; o.vy += Math.sin(a) * 180; } });
    S.peds.forEach(p => { if (p.state !== 'dead' && Math.hypot(p.x - c.x, p.y - c.y) < 120) G.combat.hurtPed(S, p, 90, c.x, c.y, 220, P.car === c || c.driver === 'player' ? 'player' : 'traffic'); });
    G.combat.scorch(S, c.x, c.y, 34);
    c.driver = 'none'; c.mode = 'wreck';
  };

  // ---------- Criação do mundo ----------
  function newWorld() {
    S.cars = []; S.peds = []; S.particles = []; S.pombos = []; S.heat = 0; S.heatLevel = 0; S.heli = null; S.bustT = 0; S.time = 0;
    M.active = null;
    const g = M.POI.garage;
    const red = new G.Car({ x: g.x + 110, y: g.y, a: Math.PI / 2, kind: 'coupe', color: PAINTS[S.save.paint % PAINTS.length], driver: 'none', mode: 'parked', owned: true });
    S.cars.push(red); S.redCar = red;
    S.player = Object.assign({ x: g.x + 40, y: g.y + 4, vx: 0, vy: 0, h: 0, walk: 0, hp: 100, armor: 0, weapon: 'fist', cdT: 0, flashT: 0, car: null, player: true, state: 'walk', punchT: 0, iframes: 0, dead: false }, { shirt: '#e8832a', skin: '#b9794a', hair: '#1a1208', hairStyle: 'topete', sleeve: 'curta', pat: 'liso', acc: 'shades' });
    G.combat.reset(S);
    S.sentado = null; S.trans = null; S.inside = null; S.bebado = 0; S.guia = null; S.prop = {};
    G.lugares.aplicarLook(S);
    for (let k = 0; k < 10; k++) AI.spawnTraffic(S);
    for (let k = 0; k < 14; k++) AI.spawnPed(S);
    S.cam.x = S.player.x; S.cam.y = S.player.y;
    // saudação
    if (S.save.done === 0) G.say('Bem-vindo! Aperte E perto do carro vermelho. Telefones amarelos dão missões e a loja rosa vende armas.', 9);
    else G.say('Bem-vindo de volta! Missão ' + Math.min(S.save.done + 1, M.TOTAL) + ' de ' + M.TOTAL + ' esperando no telefone.', 6);
  }

  // ---------- Entrar / sair de carros ----------
  function enterCar(c) {
    const P = S.player;
    if (c.driver === 'ai') {
      // carjack: o motorista sai correndo
      const d = AI.makePed(c.x - Math.cos(c.a) * 38, c.y - Math.sin(c.a) * 38);
      d.state = 'flee'; d.fleeT = 3.5; d.threat = { x: P.x, y: P.y }; S.peds.push(d);
      const police = c.kind === 'police';
      if (police || copNear(c.x, c.y, 420)) G.addHeat(police ? 45 : 25);
      else if (c.mode === 'wander') G.addHeat(4);
    }
    c.driver = 'player'; c.mode = 'player'; c.hb = false; c.nav = null; c.siren = false; c.revT = 0; c.stuckT = 0;
    P.car = c; G.snd.door();
    if (G.snd.station() === 0 && !S.radioAuto) { S.radioAuto = true; G.snd.nextStation(); S.radioT = 3; }
  }
  function exitCar() {
    const P = S.player, c = P.car; if (!c) return;
    const side = [1, -1];
    let placed = false;
    for (const s of side) {
      const x = c.x + Math.cos(c.a) * s * (SP.CAR_W / 2 + 14), y = c.y + Math.sin(c.a) * s * (SP.CAR_W / 2 + 14);
      if (!W.isSolid(x, y) && !W.treeHit(x, y, 6)) { P.x = x; P.y = y; placed = true; break; }
    }
    if (!placed) { P.x = c.x; P.y = c.y; }
    P.h = c.a; P.vx = P.vy = 0;
    c.driver = 'none'; c.mode = 'parked'; c.thr = 0; c.steer = 0; c.hb = true; P.car = null; G.snd.door();
  }

  // ---------- Entrada (teclado) ----------
  const keys = {}, pressed = {};
  function onKey(e, down) {
    const k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(k)) e.preventDefault();
    if (down && !keys[k]) pressed[k] = true;
    keys[k] = down;
  }
  window.addEventListener('keydown', e => { onKey(e, true); G.snd.init(); });
  window.addEventListener('keyup', e => onKey(e, false));
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (S.mode === 'play') S.mode = 'paused'; });
  const K = (...c) => c.some(x => keys[x]);
  const Kp = (...c) => c.some(x => pressed[x]);

  // ---------- Atualização ----------
  function nearestCar(x, y, r) {
    let best = null, bd = r;
    for (const c of S.cars) { if (c.dead) continue; const d = Math.hypot(c.x - x, c.y - y); if (d < bd) { bd = d; best = c; } }
    return best;
  }

  function updatePlayer(dt) {
    const P = S.player; S.prompt = '';
    if (P.iframes > 0) P.iframes -= dt;
    const pc = P.car;
    if (pc) {
      pc.thr = K('KeyW', 'ArrowUp') ? 1 : K('KeyS', 'ArrowDown') ? -1 : 0;
      pc.steer = (K('KeyD', 'ArrowRight') ? 1 : 0) - (K('KeyA', 'ArrowLeft') ? 1 : 0);
      pc.hb = K('Space');
      S.hornDown = K('KeyH');
      P.x = pc.x; P.y = pc.y; P.vx = pc.vx; P.vy = pc.vy; P.h = pc.a;
      const oF = M.POI.oficina;
      if (Math.hypot(pc.x - oF.x, pc.y - oF.y) < oF.r && pc.speed < 90) S.prompt = 'E: CONSERTAR E REPINTAR ($150)';
      else if (pc.speed < 220) S.prompt = 'E: SAIR DO CARRO';
      if (Kp('KeyE')) {
        if (Math.hypot(pc.x - oF.x, pc.y - oF.y) < oF.r && pc.speed < 90) {
          if (S.save.money >= 150) {
            S.save.money -= 150; pc.hp = 100; pc.dead = false; P.hp = 100; S.heat = 0; S.save.paint++;
            pc.color = PAINTS[S.save.paint % PAINTS.length]; G.save(); G.snd.cash();
            G.say('Carro consertado e repintado! A polícia não te reconhece mais.', 4);
          } else G.say('Dinheiro insuficiente. Conserto custa $150.', 3);
        } else if (pc.speed < 220) exitCar();
      }
    } else {
      // a pé
      const run = K('ShiftLeft', 'ShiftRight');
      const sp = run ? 175 : 108;
      let dx = (K('KeyD', 'ArrowRight') ? 1 : 0) - (K('KeyA', 'ArrowLeft') ? 1 : 0), dy = (K('KeyS', 'ArrowDown') ? 1 : 0) - (K('KeyW', 'ArrowUp') ? 1 : 0);
      const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      if (S.sentado || S.trans) { dx = 0; dy = 0; }
      if (S.bebado > 0) { const b = Math.min(1, S.bebado / 3); dx += Math.sin(S.time * 2.7) * 0.55 * b; dy += Math.cos(S.time * 2.1) * 0.55 * b; }
      // empurrão de carro / explosão
      P.x += 0; let mvx = dx * sp + P.vx, mvy = dy * sp + P.vy; P.vx *= 0.88; P.vy *= 0.88;
      const okp = (x, y) => !W.isSolid(x, y) && !W.treeHit(x, y, 4);
      if (okp(P.x + mvx * dt + Math.sign(mvx) * 6, P.y)) P.x += mvx * dt;
      if (okp(P.x, P.y + mvy * dt + Math.sign(mvy) * 6)) P.y += mvy * dt;
      if (dx || dy) { P.h += wrap(Math.atan2(dy, dx) + Math.PI / 2 - P.h) * Math.min(1, 14 * dt); P.walk += sp * dt * 0.2; }
      if (P.punchT > 0) P.punchT -= dt;
      // armas: Espaço ataca/atira • Q troca de arma • 1-6 escolhem a arma
      if (Kp('KeyQ')) G.combat.cycle(S, 1);
      G.combat.ORDER.forEach((id, i) => { if (Kp('Digit' + (i + 1))) { if (!G.combat.select(S, id)) G.say('Você não tem essa arma (ou está sem munição).', 2); else G.snd.beep(); } });
      if (!S.sentado && !S.trans) G.combat.playerUpdate(S, dt, K('Space'), Kp('Space'));
      // o que dá para fazer aqui?
      let action = null;
      const car = S.sentado ? null : nearestCar(P.x, P.y, 62);
      if (S.sentado) action = G.lugares.acao(S);
      else if (car) { action = { t: 'car', car, s: 'E: ENTRAR NO CARRO' + (car.driver === 'ai' ? ' (ROUBAR)' : '') }; }
      else {
        for (const ph of M.PHONES) if (Math.hypot(ph.x - P.x, ph.y - P.y) < 50) action = { t: 'phone', s: M.active ? 'TELEFONE (MISSÃO EM ANDAMENTO)' : 'E: ATENDER TELEFONE', ph };
        const gg = M.POI.garage, hh = M.POI.hospital;
        if (!action && Math.hypot(gg.x - P.x, gg.y - P.y) < gg.r + 10) action = { t: 'garage', s: 'E: BUSCAR MEU CARRO VERMELHO' };
        if (!action && Math.hypot(hh.x - P.x, hh.y - P.y) < hh.r + 10) action = { t: 'hospital', s: P.hp < 100 ? 'E: TRATAR FERIMENTOS (GRÁTIS)' : 'HOSPITAL' };
        const ar = M.POI.armas;
        if (!action && Math.hypot(ar.x - P.x, ar.y - P.y) < ar.r + 10) action = { t: 'shop', s: 'E: LOJA DE ARMAS' };
      }
      if (!action) action = G.lugares.acao(S);
      if (action) S.prompt = action.s;
      if (action && Kp('KeyE')) {
        if (action.t === 'lugar') action.run();
        else if (action.t === 'car') enterCar(action.car);
        else if (action.t === 'phone') { if (!M.active) M.startNext(S, action.ph); else G.say('Termine a missão atual primeiro.', 3); }
        else if (action.t === 'garage') {
          const g = M.POI.garage; let r = S.redCar;
          if (!r || r.dead || !S.cars.includes(r)) {
            r = new G.Car({ x: g.x + 110, y: g.y, a: Math.PI / 2, kind: 'coupe', color: PAINTS[S.save.paint % PAINTS.length], driver: 'none', mode: 'parked', owned: true });
            S.cars.push(r); S.redCar = r; G.say('Seu carro foi entregue novamente na garagem.', 4);
          } else if (Math.hypot(r.x - g.x, r.y - g.y) > 300) {
            if (S.save.money >= 50) { S.save.money -= 50; r.x = g.x + 110; r.y = g.y; r.a = Math.PI / 2; r.vx = r.vy = 0; G.say('Guincho trouxe seu carro vermelho ($50).', 4); G.snd.cash(); }
            else G.say('Guincho custa $50.', 3);
          } else G.say('Seu carro vermelho já está aqui perto!', 3);
        } else if (action.t === 'shop') { S.mode = 'shop'; G.snd.door(); }
        else if (action.t === 'hospital') { P.hp = 100; G.say('Ferimentos tratados.', 3); }
      }
    }
    if (Kp('KeyR')) { G.snd.nextStation(); S.radioT = 3; }
    if (Kp('KeyM')) G.say(G.snd.mute() ? 'Som desligado' : 'Som ligado', 2);
    if (Kp('KeyV')) G.say(G.luz.alternar(), 2);
    // morte
    if (P.hp <= 0 && S.mode === 'play') goWasted();
  }

  function goWasted() {
    S.sentado = null;
    S.mode = 'wasted'; S.modeT = 0;
    if (M.active) M.fail(S, 'você foi levado ao hospital');
    if (S.player.car) exitCar();
    G.snd.fail();
  }
  function goBusted() {
    S.sentado = null;
    S.mode = 'busted'; S.modeT = 0;
    if (M.active) M.fail(S, 'você foi preso');
    if (S.player.car) exitCar();
    G.snd.fail();
  }
  function respawn(where, loss) {
    const P = S.player;
    S.save.money = Math.floor(S.save.money * (1 - loss)); G.save();
    P.hp = 100; P.armor = 0; P.car = null; P.x = where.x; P.y = where.y + 4; P.vx = P.vy = 0; P.iframes = 2;
    const jail = where === M.POI.delegacia;
    const hadGuns = Object.keys(G.combat.arms(S).own).length > 1;
    if (jail) G.combat.confiscate(S);
    S.lastHp = 100;
    S.heat = 0; S.heatLevel = 0; S.heli = null; S.bustT = 0;
    S.cars = S.cars.filter(c => !(c.kind === 'police' && (c.mode === 'chase' || c.mode === 'block' || c.mode === 'leave')));
    if (S.redCar && S.redCar.dead) { S.cars = S.cars.filter(c => c !== S.redCar); S.redCar = null; }
    S.mode = 'play';
    G.say(where === M.POI.hospital ? 'Você sobreviveu por pouco e acordou no hospital. Perdeu ' + Math.round(loss * 100) + '% do dinheiro.' : 'Solto da delegacia. A fiança custou ' + Math.round(loss * 100) + '% do dinheiro' + (hadGuns ? ' e suas armas foram confiscadas.' : '.'), 6);
  }

  // ---------- Carros (IA, física, colisões) ----------
  function updateCars(dt) {
    const P = S.player;
    for (const c of S.cars) {
      if (c.driver === 'ai') {
        if (c.mode === 'wander' || c.mode === 'race') AI.driveTraffic(c, dt, S);
        else if (c.mode === 'chase' || c.mode === 'leave') AI.driveChase(c, dt, S);
      } else if (c.driver !== 'player') { c.thr = 0; c.steer = 0; c.hb = true; }
      G.updateCar(c, dt);
    }
    // carro x carro
    const n = S.cars.length;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) G.carVsCar(S.cars[i], S.cars[j]);
    // pedestres
    const hitPed = (p, c) => {
      const cc = G.carCircles(c);
      for (let k = 0; k < 2; k++) {
        const dx = p.x - cc[k][0], dy = p.y - cc[k][1], r = cc[k][2] + 3, d = Math.hypot(dx, dy);
        if (d < r) return { dx, dy, d, r };
      }
      return null;
    };
    for (const c of S.cars) {
      if (c.dead) continue;
      const sp = c.speed;
      for (const p of S.peds) {
        if (p.state === 'down' || p.state === 'dead' || Math.abs(p.x - c.x) > 70 || Math.abs(p.y - c.y) > 70) continue;
        const h = hitPed(p, c); if (!h) continue;
        if (sp > 55) {
          G.combat.carHit(S, p, c, sp);
          c.vx *= 0.97; c.vy *= 0.97;
          if (c === P.car) { G.addHeat(9); const m = M.active; if (m && m.type === 'taxi' && m.stage === 1) m.comfort -= m.def.vip ? 25 : 12; }
          else if (c.driver === 'ai' && c.kind === 'police') { }
        } else { const d = h.d || 1; p.x += h.dx / d * (h.r - h.d + 1); p.y += h.dy / d * (h.r - h.d + 1); }
      }
      // jogador a pé
      if (!P.car && S.mode === 'play') {
        const h = hitPed(P, c);
        if (h) {
          if (sp > 110 && P.iframes <= 0) { P.hp -= 10 + sp * 0.06; P.iframes = 0.9; P.vx = h.dx / (h.d || 1) * 220; P.vy = h.dy / (h.d || 1) * 220; G.snd.bonk(); S.shake = 5; G.combat.spray(S, P.x, P.y, Math.atan2(h.dy, h.dx), 6, 160); }
          else { const d = h.d || 1; P.x += h.dx / d * (h.r - h.d + 1); P.y += h.dy / d * (h.r - h.d + 1); }
        }
      }
    }
  }

  // ---------- Polícia ----------
  function updatePolice(dt) {
    const P = S.player, ref = P.car || P;
    const lvlBefore = S.heatLevel;
    S.heatLevel = lvlOf(S.heat);
    const chasers = S.cars.filter(c => c.kind === 'police' && c.mode === 'chase' && !c.dead);
    const copPeds = S.peds.filter(p => p.kind === 'cop' && p.state !== 'dead');
    S.chasers = chasers.length + copPeds.length;
    // esfriar
    if (S.heat > 0) {
      const near = chasers.some(c => Math.hypot(c.x - ref.x, c.y - ref.y) < 520) || copPeds.some(p => Math.hypot(p.x - ref.x, p.y - ref.y) < 520);
      const heliSees = S.heli && Math.hypot(S.heli.x - ref.x, S.heli.y - ref.y) < 300;
      if (!near) S.heat = Math.max(0, S.heat - dt * (heliSees ? 1.2 : 2.6));
    }
    if (M.active && M.active.type === 'escape' && S.heat <= 0 && false) { }
    S.heatLevel = lvlOf(S.heat);
    if (S.heatLevel === 0 && lvlBefore > 0) {
      S.cars.forEach(c => { if (c.kind === 'police' && c.mode === 'chase') c.mode = 'leave'; });
      S.heli = S.heli ? Object.assign(S.heli, { life: 0.1 }) : null;
      if (!M.active || M.active.type !== 'escape') G.say('Você despistou a polícia.', 4);
    }
    if (S.heatLevel > lvlBefore && lvlBefore === 0) G.say('A polícia está atrás de você!', 4);
    // reforços
    const target = [0, 2, 3, 4, 5, 6][S.heatLevel];
    S.copT -= dt;
    if (chasers.length < target && S.copT <= 0) { S.copT = 1.6; AI.spawnPolice(S, 1); }
    if (S.heatLevel >= 3) { S.blockT -= dt; if (S.blockT <= 0) { S.blockT = 30; AI.spawnRoadblock(S); } } else S.blockT = 8;
    if (S.heatLevel >= 4 && !S.heli) S.heli = { x: ref.x + 900, y: ref.y - 700, vx: 0, vy: 0, rot: 0, a: 0, life: 45 };
    AI.updateHeli(S, dt);
    // preso?
    if (S.mode === 'play' && S.heatLevel > 0) {
      const close = chasers.filter(c => Math.hypot(c.x - ref.x, c.y - ref.y) < (P.car ? 120 : 90));
      // policiais a pé que querem prender (só quando não estão em tiroteio) também contam
      const cuff = copPeds.filter(p => p.arresting && Math.hypot(p.x - ref.x, p.y - ref.y) < (P.car ? 55 : 42));
      const ok = P.car ? (P.car.speed < 70 && close.length + cuff.length >= 2) : (close.length >= 1 || cuff.length >= 1);
      if (ok) S.bustT += dt * (P.car ? 1 : 1.6); else S.bustT = Math.max(0, S.bustT - dt * 1.5);
      if (S.bustT > 3) goBusted();
    } else S.bustT = 0;
  }

  // ---------- Tráfego / pedestres: nascer e sumir ----------
  function managePopulation(dt) {
    const P = S.player, ref = P.car || P;
    // carros
    S.spawnT -= dt;
    const civ = S.cars.filter(c => c.driver === 'ai' && (c.mode === 'wander'));
    const fd = S.dayT - Math.floor(S.dayT), capCarros = (fd > 0.3 && fd < 0.4) || (fd > 0.68 && fd < 0.78) ? 22 : (fd < 0.16 || fd > 0.88) ? 11 : 16;   // hora do rush tem mais carros, madrugada menos
    if (civ.length < capCarros && S.spawnT <= 0) { S.spawnT = 0.5; AI.spawnTraffic(S, Math.random() < 0.06 ? 'police' : null); }
    for (const c of S.cars) { if (c.driver === 'ai' && c.mode === 'wander') { if (c.speed < 8) c.idleT += dt; else c.idleT = 0; } }
    S.cars = S.cars.filter(c => {
      if (c.idleT > 14 && Math.hypot(c.x - ref.x, c.y - ref.y) > 650) return false;
      if (c === P.car || c.owned || c.tag === 'mission' || (M.active && M.active.rivals && M.active.rivals.some(r => r.car === c))) return true;
      const d = Math.hypot(c.x - ref.x, c.y - ref.y);
      if (c.mode === 'block') return d < 1700 && S.time - c.born < 70;
      if (c.mode === 'chase') return d < 1800;
      if (c.mode === 'leave') return d < 900;
      if (c.mode === 'parked' || c.mode === 'wreck') return d < 1800 || c.owned;
      return d < 1500 && !(c.dead && c.burnT > 25 && d > 700);
    });
    // pedestres
    S.pedSpawnT -= dt;
    const alive = S.peds.filter(p => !p.mission && !p.target && p.state !== 'dead').length;
    if (alive < 34 && S.pedSpawnT <= 0) { S.pedSpawnT = 0.25; AI.spawnPed(S); }
    S.peds = S.peds.filter(p => !p.dead && (p.mission || p.target || Math.hypot(p.x - ref.x, p.y - ref.y) < 1150));
    for (const p of S.peds) if (p.state === 'wait') { p.walk = 0; } else AI.updatePed(p, dt, S);
  }

  // ---------- Partículas ----------
  function updateParticles(dt) {
    for (const p of S.particles) {
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.col === 'smoke') { p.size += 10 * dt; p.vx *= 0.98; } else if (p.col === 'ring') p.size += 330 * dt; else if (p.col === 'fire') { p.size -= 4 * dt; p.vy -= 10 * dt; } else { p.vx *= 0.92; p.vy *= 0.92; }
    }
    S.particles = S.particles.filter(p => p.t < p.max && p.size > 0.5);
  }

  // ---------- Câmera ----------
  function updateCamera(dt) {
    const P = S.player, ref = P.car || P;
    const sp = P.car ? P.car.speed : 0;
    const zt = P.car ? 1.6 - 0.5 * Math.min(1, sp / 380) : 1.85;
    S.cam.z += (zt - S.cam.z) * Math.min(1, 2.2 * dt);
    const tx = ref.x + (ref.vx || 0) * 0.28, ty = ref.y + (ref.vy || 0) * 0.28;
    S.cam.x += (tx - S.cam.x) * Math.min(1, 6 * dt); S.cam.y += (ty - S.cam.y) * Math.min(1, 6 * dt);
    S.shake = Math.max(0, S.shake - dt * 18);
  }

  function update(dt) {
    S.time += dt; S.dayT += dt / 420;
    if (S.msg) { S.msg.t -= dt; if (S.msg.t <= 0) S.msg = null; }
    if (S.ban) { S.ban.t -= dt; if (S.ban.t <= 0) S.ban = null; }
    if (S.radioT > 0) S.radioT -= dt;
    if (S.mode === 'play') {
      updatePlayer(dt);
      updateCars(dt);
      managePopulation(dt);
      G.detalhes.update(S, W, dt);
      G.lugares.atualizar(S, dt);
      updatePolice(dt);
      G.combat.update(S, dt);
      M.update(S, dt);
    } else if (S.mode === 'wasted' || S.mode === 'busted') {
      S.modeT += dt; updateCars(dt); managePopulation(dt); G.combat.update(S, dt);
      if (S.modeT > 3.2) respawn(S.mode === 'wasted' ? M.POI.hospital : M.POI.delegacia, S.mode === 'wasted' ? 0.1 : 0.15);
    }
    updateParticles(dt);
    updateCamera(dt);
    // som
    const ref = S.player.car || S.player;
    let sv = 0; for (const c of S.cars) if (c.kind === 'police' && c.siren && !c.dead) { const d = Math.hypot(c.x - ref.x, c.y - ref.y); sv = Math.max(sv, clamp(1 - d / 900, 0, 1)); }
    G.snd.update({ inCar: !!S.player.car, car: S.player.car, horn: S.hornDown && !!S.player.car, sirenVol: S.mode === 'play' ? sv : 0 });
  }

  // ---------- Desenho ----------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const darkC = document.createElement('canvas'); darkC.width = VW; darkC.height = VH;
  const dctx = darkC.getContext('2d');

  function darkness() {
    const f = ((S.dayT % 1) + 1) % 1;
    if (f < 0.55) return 0; if (f < 0.65) return (f - 0.55) / 0.1; if (f < 0.92) return 1; return 1 - (f - 0.92) / 0.08;
  }

  function drawWorld() {
    const cam = S.cam, z = cam.z;
    const sx = S.shake ? rand(-S.shake, S.shake) * 0.5 : 0, sy = S.shake ? rand(-S.shake, S.shake) * 0.5 : 0;
    ctx.save();
    ctx.translate(VW / 2 + sx, VH / 2 + sy); ctx.scale(z, z); ctx.translate(-cam.x, -cam.y);
    const vx0 = cam.x - VW / 2 / z - 40, vy0 = cam.y - VH / 2 / z - 40, vx1 = cam.x + VW / 2 / z + 40, vy1 = cam.y + VH / 2 / z + 40;
    W.drawChunks(ctx, vx0, vy0, vx1, vy1);
    W.drawWaterFx(ctx, S.time, vx0, vy0, vx1, vy1);   // brilhos na água
    const inV = o => o.x > vx0 - 80 && o.x < vx1 + 80 && o.y > vy0 - 80 && o.y < vy1 + 80;
    G.combat.drawDecals(ctx, S, inV);       // sangue, marcas de pneu e chamuscado
    M.drawWorld(ctx, S, S.time);
    G.combat.drawPickups(ctx, S, inV, S.time);
    const vis = S.peds.filter(inV);
    vis.forEach(p => { if (p.state === 'dead') SP.drawPed(ctx, p, S.time); }); // corpos ficam embaixo dos carros
    // destroços e estacionados primeiro
    const cars = S.cars.filter(inV).sort((a, b) => (a.dead ? 0 : 1) - (b.dead ? 0 : 1));
    cars.forEach(c => SP.drawCar(ctx, c, S.time));
    vis.forEach(p => { if (p.state !== 'dead') SP.drawPed(ctx, p, S.time); });
    if (!S.player.car && S.mode !== 'title') { if (S.player.iframes > 0 && Math.floor(S.time * 14) % 2 === 0) { } else SP.drawPed(ctx, S.player, S.time); }
    G.detalhes.draw(ctx, S, inV);            // pombos
    G.lugares.desenhar(ctx, S, inV);         // marcadores dos lugares, balões de fala, seta do guia
    AI.drawLights(ctx, vx0, vy0, vx1, vy1, S.time);
    G.combat.drawAir(ctx, S, inV);          // balas e granadas
    // partículas
    S.particles.forEach(p => {
      if (!inV(p)) return;
      const k = 1 - p.t / p.max;
      ctx.save(); ctx.translate(p.x, p.y);
      if (p.col === 'smoke') { ctx.globalAlpha = (p.a || 0.55) * k; ctx.fillStyle = p.tint || '#3a3a3f'; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, TAU); ctx.fill(); }
      else if (p.col === 'ring') { ctx.globalAlpha = k * 0.7; ctx.strokeStyle = '#ffe2b0'; ctx.lineWidth = 2 + 6 * k; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, TAU); ctx.stroke(); }
      else if (p.col === 'fire') { ctx.globalAlpha = Math.min(1, k * 1.6); ctx.fillStyle = k > 0.6 ? '#ffe15a' : k > 0.3 ? '#ff8a1e' : '#d8321a'; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, TAU); ctx.fill(); }
      else if (p.col === 'blood') { ctx.globalAlpha = Math.min(1, k * 1.8); ctx.fillStyle = '#8c0b10'; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, TAU); ctx.fill(); }
      else if (p.col === 'flash') { ctx.globalAlpha = 0.95; const g = ctx.createRadialGradient(0, 0, 1, 0, 0, p.size * 2.2); g.addColorStop(0, 'rgba(255,250,200,1)'); g.addColorStop(0.5, 'rgba(255,170,50,0.7)'); g.addColorStop(1, 'rgba(255,120,0,0)'); ctx.fillStyle = g; ctx.fillRect(-p.size * 2.2, -p.size * 2.2, p.size * 4.4, p.size * 4.4); }
      else { ctx.globalAlpha = k; ctx.fillStyle = '#ffd86a'; ctx.fillRect(-1.5, -1.5, 3, 3); }
      ctx.restore();
    });
    // helicóptero
    const h = S.heli;
    if (h) {
      const ref = S.player.car || S.player;
      ctx.save(); ctx.translate(h.x + 50, h.y + 70); ctx.rotate(h.a); ctx.fillStyle = 'rgba(0,0,10,0.3)'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 34, 0, 0, TAU); ctx.fill(); ctx.restore();
      // holofote
      const g = ctx.createRadialGradient(ref.x, ref.y, 10, ref.x, ref.y, 110); g.addColorStop(0, 'rgba(255,255,220,0.45)'); g.addColorStop(1, 'rgba(255,255,220,0)');
      ctx.fillStyle = g; ctx.fillRect(ref.x - 110, ref.y - 110, 220, 220);
      ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.a);
      ctx.fillStyle = '#20232b'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 26, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#9ec8ff'; ctx.beginPath(); ctx.ellipse(0, -10, 8, 10, 0, 0, TAU); ctx.fill();
      ctx.fillRect(-2, 22, 4, 26); ctx.fillStyle = '#2a2d36'; ctx.fillRect(-10, 46, 20, 3);
      ctx.rotate(h.rot); ctx.strokeStyle = 'rgba(20,20,25,0.75)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-58, 0); ctx.lineTo(58, 0); ctx.moveTo(0, -58); ctx.lineTo(0, 58); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    // noite
    const dk = G.luz.nivel > 0 ? 0 : darkness();   // com luz.js ligada, a noite vem de lá
    if (dk > 0.02) {
      dctx.globalCompositeOperation = 'source-over'; dctx.clearRect(0, 0, VW, VH);
      dctx.fillStyle = 'rgba(6,8,40,' + (0.62 * dk) + ')'; dctx.fillRect(0, 0, VW, VH);
      dctx.globalCompositeOperation = 'destination-out';
      const toS = (x, y) => [(x - cam.x) * z + VW / 2, (y - cam.y) * z + VH / 2];
      const glow = (x, y, r, a) => { const [px, py] = toS(x, y); if (px < -r || px > VW + r || py < -r || py > VH + r) return; const g = dctx.createRadialGradient(px, py, 2, px, py, r); g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); dctx.fillStyle = g; dctx.beginPath(); dctx.arc(px, py, r, 0, TAU); dctx.fill(); };
      W.lamps.forEach(l => glow(l.x, l.y, 120 * z, 0.75));
      S.particles.forEach(p => { if (p.col === 'flash') glow(p.x, p.y, 100 * z, 0.9); });
      const cone = (x, y, ang, len, spread, a) => {
        const [px, py] = toS(x, y), L = len * z; if (px < -L || px > VW + L || py < -L || py > VH + L) return;
        const g = dctx.createRadialGradient(px, py, 4, px, py, L); g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
        dctx.fillStyle = g; dctx.beginPath(); dctx.moveTo(px, py); dctx.arc(px, py, L, ang - spread, ang + spread); dctx.closePath(); dctx.fill();
      };
      S.particles.forEach(p => { if (p.col === 'ring') glow(p.x, p.y, 280 * z, 0.9); else if (p.col === 'fire' && p.size > 8) glow(p.x, p.y, p.size * 5 * z, 0.45); });
      S.cars.forEach(c => {
        if (c.dead || !inV(c)) return;
        if (c.lights !== false) cone(c.x + c.fx * 36, c.y + c.fy * 36, Math.atan2(c.fy, c.fx), 270, 0.34, 0.95);
        glow(c.x + c.fx * 85, c.y + c.fy * 85, 130 * z, 0.9); glow(c.x + c.fx * 40, c.y + c.fy * 40, 70 * z, 0.8); glow(c.x, c.y, 50 * z, 0.5);
      });
      const ref = S.player.car || S.player; glow(ref.x, ref.y, 70 * z, 0.5);
      dctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(darkC, 0, 0);
    }
    if (G.luz.desenhar(ctx, S, W, cam, z, inV)) { /* visual cinematográfico (luz.js) */ } else {
      const vg = ctx.createRadialGradient(400, 300, 240, 400, 300, 580); vg.addColorStop(0, 'rgba(0,0,10,0)'); vg.addColorStop(1, 'rgba(0,0,12,0.34)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);   // vinheta (efeito de câmera)
    }
    G.combat.drawScreen(ctx, S);            // tela vermelha ao levar dano
  }

  // ---------- Telas ----------
  function drawTitle(time) {
    const H = G.hud;
    ctx.fillStyle = 'rgba(10,6,30,0.55)'; ctx.fillRect(0, 0, VW, VH);
    ctx.save(); ctx.translate(400, 130); ctx.rotate(-0.04);
    H.txt(ctx, 'RUA VERMELHA', 4, 6, 80, '#000', 'center', '#000');
    H.txt(ctx, 'RUA VERMELHA', 0, 0, 80, '#ff2a2a', 'center', '#200');
    ctx.restore();
    H.txt(ctx, 'mundo aberto, tiroteio e perseguições • estilo GTA antigo', 400, 172, 20, '#ffe04a', 'center');
    const saved = hasSave() && S.save.done + S.save.money > 0;
    H.txt(ctx, saved ? 'ENTER: CONTINUAR (Missão ' + Math.min(S.save.done + 1, M.TOTAL) + ' • $' + S.save.money + ')' : 'ENTER: COMEÇAR', 400, 255, 24, Math.floor(time * 2) % 2 ? '#fff' : '#ffe04a', 'center');
    if (saved) H.txt(ctx, 'N: NOVO JOGO (apaga o progresso)', 400, 285, 16, '#ff9a9a', 'center');
    const L = [
      ['A PÉ', 'WASD / Setas andar  Shift correr  Espaço atacar/atirar  Q ou 1-6 trocam de arma  E usar'],
      ['DE CARRO', 'W/↑ acelera  S/↓ freio e ré  A D ←→ virar  Espaço freio de mão  H buzina  E sair'],
      ['OUTROS', 'R rádio   M som   P pausa   V gráficos'],
      ['OBJETIVO', 'Faça as 12 missões nos telefones amarelos e vire o REI DA CIDADE. Arme-se na loja rosa!'],
      ['POLÍCIA', 'Crime na frente da polícia dá PROCURADO. Eles descem e atiram. Fuja ou lute!'],
    ];
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(40, 320, 720, 230);
    L.forEach((l, i) => { H.txt(ctx, l[0], 60, 352 + i * 42, 16, '#ffe04a'); H.txt(ctx, l[1], 160, 352 + i * 42, 13, '#fff'); });
    H.txt(ctx, 'Clique na tela para ativar o teclado • ATENÇÃO: violência explícita, sangue e armas (+16) • HTML5 Canvas', 400, 580, 13, '#bbb', 'center');
  }
  function drawOverlay(title, sub, col) {
    const H = G.hud;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, VW, VH);
    H.txt(ctx, title, 400, 300, 90, col, 'center'); H.txt(ctx, sub, 400, 350, 22, '#fff', 'center');
  }

  let last = 0, titleCam = 0;
  function startGame(fresh) {
    if (fresh) { S.save = { money: 0, done: 0, paint: 0, king: false, arms: { own: { fist: 1 }, ammo: {} } }; G.save(); }
    G.snd.init(); newWorld(); S.mode = 'play';
  }
  function frame(ts) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    if (S.mode === 'loading') {
      const pr = W.buildSome(3);
      ctx.fillStyle = '#14101f'; ctx.fillRect(0, 0, VW, VH);
      G.hud.txt(ctx, 'CARREGANDO A CIDADE...', 400, 290, 28, '#ffe04a', 'center');
      ctx.fillStyle = '#000'; ctx.fillRect(250, 310, 300, 22); ctx.fillStyle = '#ff2a2a'; ctx.fillRect(253, 313, 294 * pr, 16);
      if (pr >= 1) { loadSave(); S.mode = 'title'; newWorld(); S.cam.z = 1.4; }
      return;
    }
    if (S.mode === 'title') {
      titleCam += dt * 60;
      S.time += dt; S.dayT += dt / 300;
      const ang = titleCam / 400;
      S.cam.x = W.nodeX(2) + Math.cos(ang) * 500 + 300; S.cam.y = W.nodeY(1) + Math.sin(ang * 0.7) * 380; S.cam.z = 1.3;
      S.player.x = -9999; S.player.y = -9999; S.player.iframes = 0;
      // o tráfego corre em volta da câmera
      const fake = S.player; fake.x = S.cam.x; fake.y = S.cam.y;
      updateCars(dt); managePopulation(dt); G.detalhes.update(S, W, dt); updateParticles(dt);
      fake.x = -9999; fake.y = -9999;
      drawWorld(); drawTitle(S.time);
      if (Kp('Enter')) startGame(false);
      else if (Kp('KeyN') && hasSave()) startGame(true);
      for (const k in pressed) delete pressed[k];
      return;
    }
    G.lugares.atualizarTrans(S, dt);
    if (S.mode === 'inside') {
      // dentro de um lugar (barbearia, teatro, casa...): outra tela, outro mundo
      if (S.msg) { S.msg.t -= dt; if (S.msg.t <= 0) S.msg = null; }
      if (S.radioT > 0) S.radioT -= dt;
      G.lugares.atualizarDentro(S, dt, K, Kp);
      if (Kp('KeyR')) { G.snd.nextStation(); S.radioT = 3; }
      if (Kp('KeyM')) G.say(G.snd.mute() ? 'Som desligado' : 'Som ligado', 2);
      G.snd.update({ inCar: false, car: null, horn: false, sirenVol: 0 });
      if (S.mode === 'inside') G.lugares.desenharDentro(ctx, S);
      else { updateCamera(dt); drawWorld(); G.hud.draw(ctx, S, S.time); }
      G.lugares.desenharTrans(ctx, S);
      for (const k in pressed) delete pressed[k];
      return;
    }
    if (Kp('KeyP', 'Escape')) { if (S.mode === 'play') S.mode = 'paused'; else if (S.mode === 'paused') S.mode = 'play'; }
    if (S.mode === 'paused' && Kp('Enter')) S.mode = 'play';
    if (S.mode === 'shop') { for (const k in pressed) if (G.combat.shopKey(S, k)) { S.mode = 'play'; G.snd.door(); break; } }
    else if (S.mode !== 'paused') update(dt);
    drawWorld();
    G.hud.draw(ctx, S, S.time);
    if (S.mode === 'wasted') drawOverlay('VOCÊ MORREU', 'Os médicos te trouxeram de volta...', '#ff4a4a');
    if (S.mode === 'busted') drawOverlay('PRESO!', 'A polícia te pegou...', '#6a8bff');
    if (S.mode === 'shop') G.combat.drawShop(ctx, S);
    if (S.mode === 'paused') drawOverlay('PAUSADO', 'P ou ENTER para continuar', '#ffe04a');
    G.lugares.desenharTrans(ctx, S);
    for (const k in pressed) delete pressed[k];
  }

  // ---------- Tela cheia proporcional ----------
  function fit() {
    const r = Math.min(window.innerWidth / VW, window.innerHeight / VH);
    canvas.style.width = Math.floor(VW * r) + 'px'; canvas.style.height = Math.floor(VH * r) + 'px';
  }
  window.addEventListener('resize', fit); fit();
  canvas.addEventListener('mousedown', () => { G.snd.init(); if (S.mode === 'title') startGame(false); });
  requestAnimationFrame(frame);

})(window.G = window.G || {});
