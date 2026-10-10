'use strict';
/* =========================================================
   Missões: atendidas nos orelhões espalhados pela cidade
   ========================================================= */

const round50 = (v) => Math.round(v / 50) * 50;

const Missions = {
  active: null, done: 0, cooldown: 0, typeIdx: 0, alleySpots: [],

  reset() {
    this.active = null; this.done = 0; this.cooldown = 2; this.typeIdx = 0;
    if (!this.alleySpots.length) {
      for (let y = 1; y < MAP_H - 1; y++) for (let x = 1; x < MAP_W - 1; x++) {
        if (tileAt(x, y) !== TL.ALLEY) continue;
        if (tileAt(x, y - 1) === TL.ALLEY && tileAt(x, y + 1) === TL.ALLEY) this.alleySpots.push({ x: x * T + 8, y: y * T + 8, a: Math.PI / 2 });
        else if (tileAt(x - 1, y) === TL.ALLEY && tileAt(x + 1, y) === TL.ALLEY) this.alleySpots.push({ x: x * T + 8, y: y * T + 8, a: 0 });
      }
    }
  },

  farDrop(x, y, minD, maxD) {
    const c = City.dropPoints.filter((d) => { const k = dist(x, y, d.x, d.y); return k >= minD && k <= maxD; });
    return c.length ? pick(c) : pick(City.dropPoints);
  },

  available() { return !this.active && this.cooldown <= 0; },

  update(dt) {
    const p = World.player;
    if (this.cooldown > 0) this.cooldown -= dt;
    if (!this.active) {
      if (!p.alive || !p.onFoot || this.cooldown > 0) return;
      for (const ph of City.phones) {
        if (dist(p.x, p.y, ph.x, ph.y) < 13) { this.start(ph); break; }
      }
      return;
    }
    const m = this.active;
    if (m.timer !== null) {
      m.timer -= dt;
      if (m.timer <= 0) { this.fail('O tempo acabou!'); return; }
    }
    if (m.data.car && (m.data.car.wreck || m.data.car.burning > 0 || m.data.car.removed)) { this.fail('O carro foi destruído!'); return; }
    if (!p.alive) return;
    const s = m.steps[m.idx];
    let done = false;
    if (s.car) done = p.car === s.car;
    else {
      const t = this.target();
      const inRange = dist(p.x, p.y, t.x, t.y) < s.r;
      const carOk = !s.needCar || (!p.onFoot && p.car);
      const specOk = !s.specificCar || p.car === m.data.car;
      const stopOk = !s.stop || (p.car && Math.hypot(p.car.vx, p.car.vy) < 34) || (p.onFoot && !s.needCar);
      done = inRange && carOk && specOk && stopOk;
      if (inRange && !carOk && !m.warned) { m.warned = true; uiToast('VOCÊ PRECISA DE UM CARRO'); }
      if (inRange && carOk && !specOk && !m.warned) { m.warned = true; uiToast('NÃO É ESSE O CARRO!'); }
    }
    if (done) {
      if (s.onDone) s.onDone();
      m.idx++;
      m.warned = false;
      if (m.idx >= m.steps.length) this.complete();
      else { Sound.coin(); uiToast(m.steps[m.idx].text, 'mission'); }
    }
  },

  target() {
    const m = this.active;
    if (!m) return null;
    const s = m.steps[m.idx];
    if (!s) return null;
    if (s.car) return { x: s.car.x, y: s.car.y, car: true };
    return { x: s.x, y: s.y, r: s.r };
  },

  start(phone) {
    const p = World.player;
    const types = ['entrega', 'taxi', 'roubo', 'corrida'];
    const type = types[this.typeIdx % types.length];
    this.typeIdx++;
    Sound.phone();
    let m = null;
    if (type === 'entrega') {
      const a = this.farDrop(p.x, p.y, 250, 900), b = this.farDrop(a.x, a.y, 700, 1700);
      const d = dist(p.x, p.y, a.x, a.y) + dist(a.x, a.y, b.x, b.y);
      m = {
        type, title: 'ENTREGA EXPRESSA', reward: round50(250 + d * 0.35), timer: 30 + d / 95,
        brief: 'Um pacote misterioso precisa atravessar a cidade. Rápido e sem perguntas.',
        steps: [
          { text: `Pegue a encomenda: ${districtName(a.x, a.y)}`, x: a.x, y: a.y, r: 16 },
          { text: `Entregue a encomenda: ${districtName(b.x, b.y)}`, x: b.x, y: b.y, r: 18 },
        ],
      };
    } else if (type === 'taxi') {
      const a = this.farDrop(p.x, p.y, 250, 800), b = this.farDrop(a.x, a.y, 650, 1500);
      const ped = makePed(a.x, a.y, 'civ');
      ped.state = 'wait'; ped.pal.shirt = [255, 120, 200]; ped.pal._frames = null; ped.frames = pedFrames(ped.pal);
      ped.mission = true;
      World.peds.push(ped);
      const d2 = dist(a.x, a.y, b.x, b.y);
      m = {
        type, title: 'TÁXI NOTURNO', reward: round50(300 + d2 * 0.4), timer: 60 + dist(p.x, p.y, a.x, a.y) / 70,
        brief: 'Um cliente está esperando na calçada. Pare o carro perto dele.',
        data: { ped },
        steps: [
          {
            text: `Busque o passageiro: ${districtName(a.x, a.y)}`, x: a.x, y: a.y, r: 32, needCar: true, stop: true,
            onDone: () => { ped.inCar = true; m.data.car = World.player.car; m.timer = 22 + d2 / 85; Sound.door(); },
          },
          {
            text: `Leve o passageiro até: ${districtName(b.x, b.y)}`, x: b.x, y: b.y, r: 28, needCar: true, specificCar: true, stop: true,
            onDone: () => {
              const c = World.player.car;
              ped.inCar = false; ped.state = 'walk'; ped.mission = false;
              ped.x = c.x + Math.sin(c.angle) * 10; ped.y = c.y - Math.cos(c.angle) * 10;
              if (solidPx(ped.x, ped.y)) { ped.x = b.x; ped.y = b.y; }
              pedPickTarget(ped, false); Sound.door();
            },
          },
        ],
      };
    } else if (type === 'roubo') {
      let spot = null;
      const cand = this.alleySpots.filter((s) => { const k = dist(p.x, p.y, s.x, s.y); return k > 500 && k < 1600; });
      for (let i = 0; i < 20 && cand.length; i++) {
        const s = pick(cand);
        if (!World.cars.some((c) => dist(c.x, c.y, s.x, s.y) < 30)) { spot = s; break; }
      }
      if (!spot) spot = { x: City.portGarage.x - 200, y: City.portGarage.y, a: 0 };
      const car = makeCar('sport', pick(CAR_TYPES.sport.colors), spot.x, spot.y, spot.a, 'free');
      car.mission = true; car.hasDriver = false;
      if (carHitsSolid(car, car.x, car.y, car.angle)) car.angle += Math.PI / 2;
      World.cars.push(car);
      m = {
        type, title: 'CARRO QUENTE', reward: 1500, timer: 170,
        brief: 'Um colecionador quer aquele esportivo. Entregue na Garagem do Porto, na Ilha Leste, sem arranhões graves.',
        data: { car },
        steps: [
          { text: 'Roube o esportivo marcado no mapa', car, onDone: () => { addHeat(1, 'alarme'); uiToast('O ALARME DISPAROU!', 'wanted'); } },
          {
            text: 'Leve o esportivo à Garagem do Porto', x: City.portGarage.x, y: City.portGarage.y, r: 26, needCar: true, specificCar: true, stop: true,
            onDone: () => { exitCar(); car.removed = true; car.mission = false; },
          },
        ],
      };
    } else {
      const pts = [];
      let cx = p.x, cy = p.y;
      for (let i = 0; i < 5; i++) {
        const opts = City.nodes.filter((n) => { const k = dist(cx, cy, n.cx, n.cy); return k > 380 && k < 950 && !pts.includes(n); });
        const n = opts.length ? pick(opts) : pick(City.nodes);
        pts.push(n); cx = n.cx; cy = n.cy;
      }
      let total = dist(p.x, p.y, pts[0].cx, pts[0].cy);
      for (let i = 1; i < pts.length; i++) total += dist(pts[i - 1].cx, pts[i - 1].cy, pts[i].cx, pts[i].cy);
      m = {
        type, title: 'CORRIDA CONTRA O RELÓGIO', reward: round50(700 + total * 0.3), timer: 22 + total / 135,
        brief: 'Passe pelos 5 checkpoints antes do tempo acabar. Precisa estar de carro.',
        steps: pts.map((n, i) => ({ text: `Checkpoint ${i + 1} de 5`, x: n.cx, y: n.cy, r: 38, needCar: true })),
      };
    }
    m.idx = 0; m.data = m.data || {}; m.warned = false;
    this.active = m;
    uiBig(m.title, m.brief + `  Recompensa: $${m.reward}`, 'mission', 3.2);
    uiToast(m.steps[0].text, 'mission');
  },

  complete() {
    const m = this.active, p = World.player;
    p.money += m.reward;
    this.done++;
    this.active = null;
    this.cooldown = 3;
    Sound.success();
    uiBig('MISSÃO CUMPRIDA!', `+$${m.reward}`, 'good');
  },

  fail(reason, silent) {
    const m = this.active;
    if (!m) return;
    if (m.data.ped) { m.data.ped.removed = !m.data.ped.inCar ? m.data.ped.removed : true; m.data.ped.mission = false; if (m.data.ped.state === 'wait') { m.data.ped.state = 'walk'; pedPickTarget(m.data.ped, false); } }
    if (m.data.car) m.data.car.mission = false;
    this.active = null;
    this.cooldown = 3;
    if (!silent) { Sound.fail(); uiBig('MISSÃO FALHOU', reason, 'bad'); }
  },

  onEnterCar() {},
  onExitCar(car) {
    const m = this.active;
    if (m && m.type === 'taxi' && m.idx === 1 && m.data.car === car) this.fail('O passageiro desceu irritado.');
  },
};
