/* =========================================================================
   LIFE: CIDADE VIVA — sim.js
   Cidadãos autônomos (LOD abstrato/completo), trânsito, clima,
   eventos espontâneos e economia.
   ========================================================================= */
(function () {
  'use strict';
  const LIFE = window.LIFE, U = LIFE.Util, D = LIFE.DATA, C = LIFE.CONFIG, TT = LIFE.TT;

  const HOOD_BY_ZONE = {
    RESIDENTIAL: ['house', 'house_big', 'apartment', 'condo'],
    SUBURB: ['house_big', 'house', 'condo'],
  };
  const SHOP_KINDS = ['supermarket', 'market', 'bakery', 'shop', 'mall', 'pharmacy', 'gas'];
  const LEISURE_KINDS = ['bar', 'restaurant', 'mall', 'park', 'square'];
  const MEAL_KINDS = ['restaurant', 'bakery', 'bar'];

  const VEHICLE_TYPES = {
    car: { w: 1.85, h: 3.3, speed: [5.5, 8.5], color: ['#b8433a', '#3a6bb8', '#d8d8d8', '#2f2f33', '#3f9a52', '#c9a227', '#8a5cc0', '#d97b2b'], fuel: 42, sound: 1 },
    taxi: { w: 1.85, h: 3.3, speed: [5.5, 8.5], color: ['#e8c33a'], fuel: 45, taxi: true },
    moto: { w: .95, h: 2.2, speed: [7, 11], color: ['#c03030', '#2a2a2e', '#3060c0'], fuel: 14, rider: true },
    van: { w: 2.05, h: 3.9, speed: [5, 7.5], color: ['#dddddd', '#5a7fa8'], fuel: 60 },
    truck: { w: 2.5, h: 5.3, speed: [4, 6.5], color: ['#3f4a55', '#8a5a3a', '#2f6b4a'], fuel: 120 },
    bus: { w: 2.6, h: 6.6, speed: [4, 6], color: ['#e0a63a', '#3a7ac0'], fuel: 160, bus: true },
    police: { w: 1.95, h: 3.6, speed: [7, 11], color: ['#2a4a7a', '#1b1f26'], fuel: 55, emergency: 'police' },
    ambulance: { w: 2.15, h: 4.3, speed: [7, 11], color: ['#e9eef2'], fuel: 65, emergency: 'medical' },
    firetruck: { w: 2.6, h: 5.8, speed: [6, 9], color: ['#c0392b'], fuel: 140, emergency: 'fire' },
    pickup: { w: 2.05, h: 3.9, speed: [5.5, 8], color: ['#7a5a3a', '#3f6b8a'], fuel: 60 }
  };
  LIFE.VEHICLE_TYPES = VEHICLE_TYPES;

  /* ===================================================================== */
  LIFE.Sim = class Sim {
    constructor(world, clock) {
      this.world = world; this.clock = clock;
      this.rnd = U.rngOf(world.seed, 'sim');
      this.citizens = [];
      this.agents = [];       // pedestres ativos
      this.vehicles = [];
      this.businesses = [];
      this.events = [];
      this.news = [];
      this.stats = { agents: 0, vehicles: 0, activeCitizens: 0, events: 0 };
      this.weather = { state: 'clear', cloud: .2, rain: 0, wind: .15, fog: 0, targetRain: 0, timer: 120, next: null };
      this.market = { index: 100, inflacao: .004, combustivel: 1, alimentos: 1, trend: 0 };
      this.time = 0;
      this.init();
    }

    /* ---------------- inicialização ---------------- */
    init() {
      this.buildBusinesses();
      this.createCitizens(C.POPULATION);
      this.initWeather();
      this.addNews('Bom dia! ' + this.world.districts.length + ' bairros ativos, ' + this.citizens.length + ' moradores registrados.', true);
    }

    buildBusinesses() {
      const w = this.world, rnd = this.rnd;
      const COMM = ['supermarket', 'market', 'bakery', 'shop', 'mall', 'pharmacy', 'restaurant', 'bar', 'hotel', 'gas', 'garage', 'clinic', 'bank'];
      let id = 0;
      for (const b of w.buildings) {
        if (!COMM.includes(b.kind)) continue;
        const goods = [];
        for (const gid in D.GOODS) {
          const g = D.GOODS[gid];
          if (g.where.includes(b.kind)) goods.push({ id: gid, price: g.base, stock: 20 + ((rnd() * 60) | 0), max: 120, sold: 0 });
        }
        const biz = {
          id: id++, buildingId: b.id, kind: b.kind, name: b.name + ' ' + U.titleCase(D.SURNAMES[(rnd() * D.SURNAMES.length) | 0]),
          x: b.x + b.w / 2, y: b.y + b.h / 2, goods, cash: 5000 + rnd() * 40000,
          openHour: b.kind === 'bar' ? 16 : (b.kind === 'bakery' ? 5 : (b.kind === 'gas' ? 0 : 7)),
          closeHour: b.kind === 'bar' ? 2 : (b.kind === 'gas' ? 24 : 22),
          employees: [], customers: 0, revenue: 0, expenses: 0, alive: true,
          level: 1 + ((rnd() * 3) | 0)
        };
        this.businesses.push(biz);
        b.biz = biz;
      }
      // índice por tipo
      this.bizByKind = {};
      for (const b of this.businesses) (this.bizByKind[b.kind] = this.bizByKind[b.kind] || []).push(b);
    }

    availableProfessions() {
      if (this._avail) return this._avail;
      const out = [];
      for (const p of D.PROFESSIONS) {
        const ok = p.places.some((k) => this.world.places(k).length > 0);
        if (ok) out.push(p);
      }
      this._avail = out;
      return out;
    }

    createCitizens(n) {
      const w = this.world, rnd = this.rnd;
      const professions = this.availableProfessions();
      const homes = w.buildings.filter((b) => ['house', 'house_big', 'apartment', 'condo'].includes(b.kind));
      if (!homes.length) return;
      const homeLoad = new Map();
      const usedNames = new Set();
      for (let i = 0; i < n; i++) {
        // nome
        let name, guard = 0;
        do {
          const sex = rnd() < .5 ? 'm' : 'f';
          const first = sex === 'm' ? U.pick(rnd, D.FIRST_M) : U.pick(rnd, D.FIRST_F);
          name = first + ' ' + U.pick(rnd, D.SURNAMES);
          name = name;
        } while (usedNames.has(name) && guard++ < 40);
        usedNames.add(name);
        const sex = D.FIRST_F.includes(name.split(' ')[0]) ? 'f' : 'm';
        // casa com capacidade
        let home = null;
        for (let k = 0; k < 24; k++) {
          const cand = U.pick(rnd, homes);
          const load = homeLoad.get(cand.id) || 0;
          if (load < w.capacityOf(cand)) { home = cand; homeLoad.set(cand.id, load + 1); break; }
        }
        if (!home) home = U.pick(rnd, homes);
        // profissão
        const prof = U.weighted(rnd, professions.map((p) => ({ p, w: p.id === 'desempregado' ? 3 : (p.id === 'estudante' ? 4 : 6) })), 'w').p;
        let work = null;
        if (prof.pay[1] > 0) {
          const kinds = prof.places;
          let best = null, bd = 1e9;
          for (let k = 0; k < 8; k++) {
            const cand = U.pick(rnd, kinds);
            const pl = w.places(cand);
            if (!pl.length) continue;
            const b = U.pick(rnd, pl);
            const d = U.dist(b.x, b.y, home.x, home.y);
            if (d < bd) { bd = d; best = b; }
          }
          work = best;
        }
        const c = this.makeCitizen(name, sex, rnd, home, work, prof, i);
        this.citizens.push(c);
      }
    }

    makeCitizen(name, sex, rnd, home, work, prof, id) {
      const age = prof.id === 'estudante' ? 14 + (rnd() * 10 | 0) : (prof.id === 'aposentado' ? 62 + (rnd() * 20 | 0) : 19 + (rnd() * 45 | 0));
      const c = {
        id, name, sex, age, prof, home, work,
        money: 200 + rnd() * 2500,
        needs: { hunger: .2 + rnd() * .3, energy: .7 + rnd() * .3, hygiene: .6 + rnd() * .4, fun: .4 + rnd() * .5 },
        mood: .6 + rnd() * .3,
        personality: U.pick(rnd, ['caseiro', 'sociável', 'trabalhador', 'aventureiro', 'tranquilo', 'ambicioso']),
        car: rnd() < .55 ? U.pick(rnd, ['car', 'car', 'car', 'moto', 'pickup', 'van']) : null,
        schedule: null, active: null, abstract: { x: home.x + home.w / 2, y: home.y + home.h / 2 },
        inside: true, lastAct: 'dormir', health: 1, relationships: []
      };
      c.schedule = this.buildSchedule(c, rnd);
      return c;
    }

    nearPlace(kinds, x, y, rnd, tries) {
      const w = this.world;
      let best = null, bd = 1e9;
      for (let k = 0; k < (tries || 6); k++) {
        const kind = U.pick(rnd, kinds);
        const list = w.places(kind);
        if (!list.length) continue;
        const b = U.pick(rnd, list);
        const d = U.dist(b.x, b.y, x, y);
        if (d < bd) { bd = d; best = b; }
      }
      return best;
    }

    buildSchedule(c, rnd) {
      const s = [];
      const home = c.home, work = c.work;
      const shift = c.prof.shift;
      const nightShift = shift[0] > shift[1];
      const wake = ((shift[0] - 75 - rnd() * 45) % 1440 + 1440) % 1440;
      const push = (min, act, place, inside) => s.push({
        min: ((min % 1440) + 1440) % 1440, act, bId: place ? place.id : null,
        x: place ? place.x + place.w / 2 : c.abstract.x, y: place ? place.y + place.h / 2 : c.abstract.y, inside: inside !== false
      });
      push(wake, 'acordar', home, true);
      push(wake + 20, 'café', home, true);
      if (work) {
        push(shift[0], 'trabalho', work, true);
        const mid = shift[0] + Math.max(60, Math.round(this.shiftLen(shift) / 2));
        const mealPlace = rnd() < .55 ? this.nearPlace(MEAL_KINDS, work.x, work.y, rnd, 4) || work : work;
        push(mid, 'almoço', mealPlace, true);
        push(mid + 60, 'trabalho', work, true);
      } else if (c.prof.id === 'estudante') {
        const sch = this.nearPlace(['school', 'university'], home.x, home.y, rnd, 3) || home;
        push(shift[0], 'estudo', sch, true);
        push(shift[1], 'livre', home, true);
      } else {
        const lei = this.nearPlace(LEISURE_KINDS, home.x, home.y, rnd, 4) || home;
        push(9 * 60, 'livre', lei, false);
      }
      const shiftEnd = shift[1] === 0 ? 24 * 60 : shift[1];
      let after = shiftEnd + (shiftEnd < shift[0] ? 1440 : 0);
      // atividade pós-trabalho
      const r = rnd();
      if (r < .28) { const p = this.nearPlace(SHOP_KINDS, home.x, home.y, rnd, 4); if (p) push(after + 25, 'compras', p, true); }
      else if (r < .45) { const p = this.nearPlace(['bar', 'restaurant'], home.x, home.y, rnd, 3); if (p) push(after + 40, 'lazer', p, true); }
      else if (r < .56) { const p = this.nearPlace(['park', 'square'], home.x, home.y, rnd, 4); if (p) push(after + 30, 'parque', p, false); }
      push(after + 95, 'jantar', home, true);
      if (rnd() < .18) { const p = this.nearPlace(['bar', 'restaurant'], home.x, home.y, rnd, 3); if (p && !nightShift) push(after + 150, 'sair', p, true); }
      const sleep = Math.min(23 * 60 + 50, after + 165 + rnd() * 90);
      push(sleep, 'dormir', home, true);
      s.sort((a, b) => a.min - b.min);
      return s;
    }
    shiftLen(shift) { return shift[1] > shift[0] ? shift[1] - shift[0] : 1440 - shift[0] + shift[1]; }

    /* ---------------- posição abstrata (LOD distante) ---------------- */
    citizenStateAt(c, minute) {
      const s = c.schedule;
      if (!s.length) return { x: c.abstract.x, y: c.abstract.y, act: 'livre', inside: true };
      let i = 0;
      while (i < s.length - 1 && s[i + 1].min <= minute) i++;
      const cur = s[i], next = s[(i + 1) % s.length];
      let cur2 = cur, next2 = next;
      if (next.min <= cur.min) next2 = { ...next, min: next.min + 1440 };
      if (minute < cur.min) cur2 = { ...cur, min: cur.min - 1440 };
      const travel = Math.max(6, Math.min(50, U.dist(cur.x, cur.y, next2.x, next2.y) * .55));
      const t = minute;
      if (next2.x !== cur.x || next2.y !== cur.y) {
        const startTravel = next2.min - travel;
        if (t >= startTravel && next2.min > startTravel) {
          const k = U.smooth(U.clamp01((t - startTravel) / (next2.min - startTravel)));
          return { x: U.lerp(cur.x, next2.x, k), y: U.lerp(cur.y, next2.y, k), act: 'deslocamento', inside: false, from: cur, to: next2 };
        }
      }
      return { x: cur.x, y: cur.y, act: cur.act, inside: cur.inside !== false, place: cur };
    }

    /* ---------------- atualização principal ---------------- */
    update(dt, gameMinutes, game) {
      this.time += dt;
      this.updateWeather(dt, game);
      const minute = this.clock.min;
      // 1. ativação / desativação de cidadãos
      this.updateLOD(game);
      // 2. agentes ativos
      this.updateAgents(dt, game);
      // 3. veículos
      this.updateVehicles(dt, game);
      // 4. semáforos
      this.updateLights(dt);
      // 5. eventos
      this.updateEvents(dt, game);
      // 6. economia
      this.updateEconomy(gameMinutes);
      // 7. necessidades dos cidadãos ativos
      if (game && game.player) this.updateNeedsOfNearby(dt);
      this.stats.agents = this.agents.length;
      this.stats.vehicles = this.vehicles.length;
      this.stats.activeCitizens = this.activeCount || 0;
    }

    // densidade esperada de pedestres/veículos conforme hora, clima, dia
    density() {
      const h = this.clock.hour + this.clock.mm / 60;
      let d = .35;
      if (h >= 6.5 && h < 9.5) d = 1;
      else if (h >= 9.5 && h < 11.5) d = .7;
      else if (h >= 11.5 && h < 14) d = .85;
      else if (h >= 14 && h < 17) d = .75;
      else if (h >= 17 && h < 19.5) d = 1;
      else if (h >= 19.5 && h < 22) d = .62;
      else if (h >= 22 || h < 3) d = .22;
      else d = .35;
      if (this.clock.isWeekend) d *= .72;
      d *= (1 - this.weather.rain * .35);
      return U.clamp01(d);
    }

    updateLOD(game) {
      const p = game.player;
      const R = C.ACTIVE_RADIUS, R2 = R * R;
      const minute = this.clock.min;
      const budget = this.budget || 1;
      const wantAgents = Math.round(C.MAX_ACTIVE_AGENTS * this.density() * budget * 1.35);
      // remove agentes distantes
      for (let i = this.agents.length - 1; i >= 0; i--) {
        const a = this.agents[i];
        const d2 = U.dist2(a.x, a.y, p.x, p.y);
        if (d2 > (R * 1.5) * (R * 1.5) || a.dead) {
          a.citizen.active = null;
          this.agents.splice(i, 1);
        }
      }
      // promove cidadãos próximos com base no agendamento
      const candidates = [];
      for (const c of this.citizens) {
        if (c.active) continue;
        const st = this.citizenStateAt(c, minute);
        c.abstract.x = st.x; c.abstract.y = st.y;
        c.lastAct = st.act;
        const d2 = U.dist2(st.x, st.y, p.x, p.y);
        if (d2 < R2) candidates.push({ c, st, d2 });
      }
      candidates.sort((a, b) => a.d2 - b.d2);
      let free = Math.min(budget < .7 ? 2 : 6, Math.max(0, wantAgents - this.agents.length));
      this.activeCount = candidates.length;
      for (const cand of candidates) {
        if (free <= 0) break;
        if (cand.st.inside && cand.st.act !== 'deslocamento') continue; // quem está dentro não precisa de corpo
        this.spawnAgent(cand.c, cand.st, game);
        free--;
      }
    }

    spawnAgent(citizen, st, game) {
      const w = this.world;
      const pos = w.nearestPedWalkable(st.x | 0, st.y | 0, 9);
      const a = {
        id: citizen.id, kind: 'ped', citizen, x: pos.x, y: pos.y,
        angle: Math.random() * 6.283, speed: 1.1 + Math.random() * .5, baseSpeed: 0,
        route: null, ri: 0, target: null, state: 'andando', inside: false, timer: 0,
        isPed: true, name: citizen.name, color: '', dead: false, bubble: null,
        skin: (citizen.id % 6), bag: Math.random() < .2, phone: false, dog: null
      };
      this.assignColor(a, citizen);
      a.baseSpeed = a.speed;
      citizen.active = a;
      this.agents.push(a);
      this.retargetAgent(a, citizen, game);
      return a;
    }

    assignColor(a, c) {
      const r = U.rng(c.id * 977 + 13);
      const shirts = ['#d94f4f', '#4f7fd9', '#4fd98a', '#d9c44f', '#9a4fd9', '#d98a4f', '#4fd9d0', '#c9c9c9', '#e07a9a', '#5a6b7a'];
      const pants = ['#2c3444', '#3a3a3a', '#4a3a2a', '#24405a', '#403038'];
      a.color = shirts[(r() * shirts.length) | 0];
      a.pants = pants[(r() * pants.length) | 0];
      a.hair = ['#2b2119', '#4a3423', '#7a5a3a', '#c8a878', '#1a1a1a'][(r() * 5) | 0];
      a.skinTone = ['#f0c8a0', '#d8a878', '#a87850', '#7a5030', '#f8e0c0'][(r() * 5) | 0];
    }

    retargetAgent(a, citizen, game) {
      const w = this.world, minute = this.clock.min;
      // qual é o próximo destino do cidadão?
      const st = this.citizenStateAt(citizen, minute);
      let dest = null;
      if (st.act === 'deslocamento' && st.to) dest = st.to;
      else if (st.place)
        dest = st.place;
      if (!dest) { a.state = 'livre'; a.timer = 3 + Math.random() * 4; return; }
      const b = dest.bId != null ? w.buildings[dest.bId] : null;
      a.destB = b;
      let goal;
      if (b) {
        const dt2 = w.doorTile(b);
        goal = w.nearestPedWalkable(dt2.x | 0, dt2.y | 0, 8);
        a.willEnter = true;
      } else {
        goal = w.nearestPedWalkable(dest.x | 0, dest.y | 0, 9);
        a.willEnter = false;
      }
      a.goal = goal;
      const path = w.findPathWalk({ x: a.x, y: a.y }, goal);
      if (path && path.length) {
        a.route = path; a.ri = 0;
        // ponto de entrada dentro do prédio
        if (b) a.route.push({ x: goal.x, y: goal.y });
      } else {
        a.route = [goal]; a.ri = 0;
      }
    }

    updateAgents(dt, game) {
      const w = this.world;
      for (const a of this.agents) {
        if (a.dead) continue;
        // transição de humor / telefone
        if (a.timer > 0) {
          a.timer -= dt;
          if (a.timer <= 0) {
            if (a.state === 'livre' && a.citizen) this.retargetAgent(a, a.citizen, game);
            else if (a.state === 'dentro') { a.state = 'andando'; }
          }
        }
        // celular ocasional
        a.phone = (Math.sin(this.time * .7 + a.id) > .93);
        if (a.state === 'livre') {
          // pequenos passos aleatórios
          if (!a.wander) { a.wander = { x: a.x + (Math.random() - .5) * 6, y: a.y + (Math.random() - .5) * 6, t: 2 + Math.random() * 3 }; }
          a.wander.t -= dt;
          this.moveAgentTo(a, a.wander.x, a.wander.y, dt, .5);
          if (a.wander.t <= 0) { a.wander = null; if (a.citizen) this.retargetAgent(a, a.citizen, game); }
          continue;
        }
        if (a.state === 'dentro') continue;
        if (!a.route || a.ri >= a.route.length) {
          // chegou: entra no prédio ou fica por perto
          if (a.destB) { a.state = 'dentro'; a.inside = true; a.timer = 60 + Math.random() * 600; }
          else { a.state = 'livre'; a.timer = 3 + Math.random() * 5; }
          continue;
        }
        const wp = a.route[a.ri];
        const d = U.dist(a.x, a.y, wp.x, wp.y);
        if (d < .45) { a.ri++; continue; }
        // atravessar rua com cuidado
        const onRoad = w.tile(a.x | 0, a.y | 0) === TT.ROAD;
        const crossingRoad = onRoad || w.isRoad(U.clamp(a.x + Math.cos(a.angle) * .8 | 0, 0, w.W - 1), U.clamp(a.y + Math.sin(a.angle) * .8 | 0, 0, w.H - 1));
        let speedMul = 1;
        if (crossingRoad) {
          const danger = this.nearestVehicle(a.x, a.y, 5.5);
          if (danger) {
            const coming = Math.abs(((Math.atan2(a.y - danger.y, a.x - danger.x) - danger.angle + Math.PI) % 6.283) - Math.PI) < 1;
            speedMul = coming ? 1.9 : .45;      // corre ou espera
          }
        }
        a.speed = a.baseSpeed * (speedMul > 1 ? 1.25 : 1);
        this.moveAgentTo(a, wp.x, wp.y, dt, a.speed / a.baseSpeed);
      }
    }

    moveAgentTo(a, tx, ty, dt, speedMul) {
      const desired = Math.atan2(ty - a.y, tx - a.x);
      a.angle = U.angLerp(a.angle, desired, Math.min(1, dt * 8));
      const sp = a.speed * (speedMul || 1);
      const nx = a.x + Math.cos(a.angle) * sp * dt;
      const ny = a.y + Math.sin(a.angle) * sp * dt;
      const w = this.world;
      // se por acaso estiver num lugar sem calçada, anda livre até voltar para ela
      const stranded = !w.isPedWalkable(a.x | 0, a.y | 0);
      const ok = (x, y) => stranded ? w.isWalkable(x | 0, y | 0) : w.isPedWalkable(x | 0, y | 0);
      if (ok(nx, ny)) { a.x = nx; a.y = ny; }
      else {
        // desliza pela parede calçada
        if (ok(nx, a.y)) a.x = nx;
        else if (ok(a.x, ny)) a.y = ny;
        else { a.angle += (Math.random() - .5) * 2; }
      }
    }

    nearestVehicle(x, y, r) {
      let best = null, bd = r * r;
      for (const v of this.vehicles) {
        const d = U.dist2(x, y, v.x, v.y);
        if (d < bd) { bd = d; best = v; }
      }
      return best;
    }

    /* ---------------- semáforos ---------------- */
    updateLights(dt) {
      // ciclo: 0 = NS verde, 1 = NS amarelo, 2 = EW verde, 3 = EW amarelo
      this.lightCycle = [16, 3, 16, 3];
      this.lightTime = (this.lightTime || 0) + dt;
      const total = 38;
      this.lightPhase = this.lightTime % total;
    }
    intersectionState(it) {
      if (!it) return 0;
      const off = (it.vx * 0.37 + it.hy * 0.71) % 4;
      const t = (this.lightPhase + off) % 38;
      if (t < 16) return 0;      // vertical verde
      if (t < 19) return 1;      // vertical amarelo
      if (t < 35) return 2;      // horizontal verde
      return 3;                  // horizontal amarelo
    }

    /* ---------------- veículos ---------------- */
    updateVehicles(dt, game) {
      const p = game.player;
      // alvo de densidade
      const target = Math.round(C.MAX_VEHICLES * this.density() * this.budget * (1 + this.weather.rain * .1));
      // despawn
      for (let i = this.vehicles.length - 1; i >= 0; i--) {
        const v = this.vehicles[i];
        const far = U.dist2(v.x, v.y, p.x, p.y) > (C.ACTIVE_RADIUS * 1.7) ** 2;
        if (v.dead || (far && !v.mission && !v.isPlayer)) {
          if (v.occupied || v.driver) continue;
          v.dead = true;
          this.vehicles.splice(i, 1);
        }
      }
      // spawn
      let guard = 0;
      while (this.vehicles.length < target && guard++ < 8) {
        const v = this.spawnTrafficVehicle(game);
        if (!v) break;
      }
      // física
      for (let i = this.vehicles.length - 1; i >= 0; i--) {
        const v = this.vehicles[i];
        if (v.isPlayer || v.driver) continue;   // veículo do jogador é dirigido por ele
        this.driveVehicle(v, dt, game);
        // recicla quem estiver travado (engarrafamento fantasma)
        if (v.speed < .3 && !v.mission) {
          v.stuck = (v.stuck || 0) + dt * (this.clock.speed || 1);
          if (v.stuck > 20) v.dead = true;
        } else v.stuck = 0;
      }
    }

    spawnTrafficVehicle(game) {
      const w = this.world, rnd = Math.random;
      const p = game.player;
      const edges = w.roadEdges;
      if (!edges.length) return null;
      // conta veículos por trecho para espalhar o tráfego (evita comboios)
      if (!this._edgeCount || this._edgeCountAt !== this.vehicles.length) {
        const c = new Map();
        for (const v of this.vehicles) if (v.edge) c.set(v.edge, (c.get(v.edge) || 0) + 1);
        this._edgeCount = c; this._edgeCountAt = this.vehicles.length;
      }
      const count = this._edgeCount;
      for (let k = 0; k < 14; k++) {
        // trechos vazios têm prioridade; trechos ocupados são pulados
        const e = edges[(rnd() * edges.length) | 0];
        if ((count.get(e) || 0) >= 2) continue;
        const t = .1 + rnd() * .8;
        const pt = w.edgePoint(e, t);
        const d = U.dist(pt.x, pt.y, p.x, p.y);
        // anel ao redor do jogador: ruas movimentadas sem trânsito artificial
        if (d < 20 || d > 62) continue
        const typeRoll = rnd();
        let type = 'car';
        if (typeRoll < .06) type = 'moto';
        else if (typeRoll < .12) type = 'van';
        else if (typeRoll < .17) type = 'truck';
        else if (typeRoll < .2) type = 'bus';
        else if (typeRoll < .22) type = 'pickup';
        const v = this.makeVehicle(type, pt.x, pt.y, e);
        count.set(e, (count.get(e) || 0) + 1);
        this._edgeCountAt = -1;   // força recálculo no próximo quadro
        return v;
      }
      return null;
    }

    makeVehicle(type, x, y, edge) {
      const T = VEHICLE_TYPES[type] || VEHICLE_TYPES.car;
      const rnd = Math.random;
      const v = {
        kind: 'vehicle', type, x, y, angle: 0, speed: 0,
        maxSpeed: U.range(rnd, T.speed[0], T.speed[1]),
        w: T.w, h: T.h, color: T.color[(rnd() * T.color.length) | 0],
        fuel: T.fuel * (.4 + rnd() * .6), maxFuel: T.fuel,
        damage: rnd() * 12, lights: false, edge, t: 0, horn: 0,
        isVehicle: true, driver: null, dead: false, mission: null, braking: false,
        waiting: 0, honkTimer: 0
      };
      if (type === 'bus') v.color = T.color[(rnd() * T.color.length) | 0];
      this.vehicles.push(v);
      return v;
    }

    driveVehicle(v, dt, game) {
      const w = this.world;
      if (!v.edge) return;
      const e = v.edge;
      const len = w.edgeLength(e);
      // progresso na aresta por projeção
      let t;
      if (e.vertical) t = (v.y - e.y0) / (e.y1 - e.y0);
      else t = (v.x - e.x0) / (e.x1 - e.x0);
      v.t = t;
      // fim da aresta -> próximo trecho
      if (t >= 1) {
        const node = e.b;
        const opts = node.edges.filter((x) => x !== e);
        let next = opts[0];
        if (opts.length) {
          // prefere seguir reto
          const straight = opts.find((x) => x.dir === e.dir);
          const right = opts.find((x) => this.isRightTurn(e.dir, x.dir));
          const left = opts.find((x) => this.isLeftTurn(e.dir, x.dir));
          const r = Math.random();
          next = (straight && r < .62) ? straight : (right && r < .86) ? right : (left || straight || opts[0]);
        }
        if (!next) { v.dead = true; return; }
        v.edge = next;
        const start = w.edgePoint(next, 0);   // encaixa na faixa de rolamento da nova via
        v.x = start.x; v.y = start.y;
      }
      // alvo de direção (olha à frente na faixa correta)
      const look = U.clamp(v.t + (3.5 / Math.max(len, 1)), 0, 1.2);
      let tp;
      if (look > 1) {
        const node = v.edge.b;
        const opts = node.edges.filter((x) => x !== v.edge);
        const next = opts.length ? opts[0] : v.edge;
        tp = w.edgePoint(next, Math.min(.2, look - 1 + .05));
      } else tp = w.edgePoint(v.edge, look);

      // semáforo
      let stopForLight = false;
      if (v.t > .72) {
        const it = v.edge.b.it;
        if (it) {
          const st = this.intersectionState(it);
          const goingVertical = v.edge.vertical;
          const green = (goingVertical && st === 0) || (!goingVertical && st === 2);
          const yellow = (goingVertical && st === 1) || (!goingVertical && st === 3);
          if (!green && !yellow && !v.mission) {
            // se a via transversal está livre, o carro segue (o sinal "abre" para quem está na fila)
            stopForLight = !this.crossRoadClear(it, v.edge);
          } else if (yellow && v.speed <= 4.5) stopForLight = true;
        }
      }
      // carro à frente
      let carAhead = null, gap = 1e9;
      for (const o of this.vehicles) {
        if (o === v) continue;
        const dx = o.x - v.x, dy = o.y - v.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 100) continue;                       // só interessa até 10 tiles
        const ang = Math.atan2(dy, dx);
        const diff = Math.abs(((ang - v.angle + Math.PI) % 6.283) - Math.PI);
        if (diff < .42) {                             // cone estreito: mesma faixa
          const d = Math.sqrt(d2) - (v.h + o.h) * .5;
          if (d < gap) { gap = d; carAhead = o; }
        }
      }
      const distAhead = carAhead ? gap : 1e9;
      // pedestre bem na frente, dentro da faixa do carro? então reduz
      let pedAheadDist = 1e9;
      if (v.speed > .6) {
        const cx = Math.cos(v.angle), sy = Math.sin(v.angle);
        for (const a of this.agents) {
          const dx = a.x - v.x, dy = a.y - v.y;
          const along = dx * cx + dy * sy;              // projeção no sentido do movimento
          if (along < .5 || along > 7) continue;
          const side = Math.abs(dx * sy - dy * cx);      // distância lateral da faixa
          if (side < 1.5 && along < pedAheadDist) pedAheadDist = along;
        }
      }
      /* --- controle de velocidade: seguimento proporcional (trânsito fluido) --- */
      let targetSpeed = v.maxSpeed * (.85 + Math.sin(this.time * .3 + v.x) * .12);
      const mustBrake = stopForLight || distAhead < 1.2 || pedAheadDist < 2.4;
      if (LIFE.CONFIG.DEBUG_BRAKE) v.brakeReason = stopForLight ? 'farol' : (distAhead < 1.2 ? 'carro:' + distAhead.toFixed(1) : (pedAheadDist < 2.4 ? 'ped:' + pedAheadDist.toFixed(1) : ''));
      if (carAhead) {
        // quanto mais perto, mais devagar — sem parar por completo a cada carro
        const desired = U.clamp((distAhead - 1.1) * 1.7, 0, v.maxSpeed);
        targetSpeed = Math.min(targetSpeed, desired);
      }
      if (pedAheadDist < 7) targetSpeed = Math.min(targetSpeed, U.clamp((pedAheadDist - 1.6) * 1.5, 0, v.maxSpeed));
      if (stopForLight) targetSpeed = Math.min(targetSpeed, U.clamp(v.speed - 6 * dt, 0, v.maxSpeed));
      if (v.speed < targetSpeed) v.speed = Math.min(targetSpeed, v.speed + 4.5 * dt);
      else v.speed = Math.max(targetSpeed, v.speed - 7 * dt);
      if (mustBrake && v.speed < .3) {
        v.waiting += dt;
        if (v.waiting > 2.5 && v.honkTimer <= 0) { v.honkTimer = 3 + Math.random() * 5; v.horn = .4; if (Math.random() < .35) LIFE.Audio.horn(); }
      } else v.waiting = 0;
      v.honkTimer -= dt;
      v.braking = mustBrake;
      // direção
      const desired = Math.atan2(tp.y - v.y, tp.x - v.x);
      v.angle = U.angLerp(v.angle, desired, Math.min(1, dt * (2.4 + v.speed * .25)));
      // movimento
      const nx = v.x + Math.cos(v.angle) * v.speed * dt;
      const ny = v.y + Math.sin(v.angle) * v.speed * dt;
      if (w.isRoad(nx | 0, ny | 0) || !w.isWalkable(nx | 0, ny | 0)) { v.x = nx; v.y = ny; }
      else { v.x = nx; v.y = ny; }
      // faróis automáticos
      const night = this.clock.hour >= 19 || this.clock.hour < 6 || this.weather.rain > .4;
      v.lights = night;
      // missão de emergência
      if (v.mission) this.updateMissionVehicle(v, dt, game);
      // consumo e desgaste
      v.fuel = Math.max(0, v.fuel - dt * .02 * (v.speed / 6));
      if (Math.random() < dt * .00004) v.damage = Math.min(100, v.damage + 10 + Math.random() * 20);
    }
    // há outro veículo atravessando esse cruzamento agora?
    crossRoadClear(it, myEdge) {
      for (const o of this.vehicles) {
        if (o.mission || !o.edge || o.speed < .4) continue;
        const d = U.dist(o.x, o.y, it.cx, it.cy);
        if (d < 13 && o.edge.vertical !== myEdge.vertical) return false;
      }
      return true;
    }
    isRightTurn(from, to) {
      return (from === 'S' && to === 'W') || (from === 'N' && to === 'E') ||
        (from === 'E' && to === 'S') || (from === 'W' && to === 'N');
    }
    isLeftTurn(from, to) { return this.isRightTurn(to, from); }

    /* ---------------- veículos de emergência ---------------- */
    spawnEmergency(type, x, y, target, game) {
      const w = this.world;
      const pt = this.nearestRoadSpot(x, y);
      const e = w.roadEdges[(Math.random() * w.roadEdges.length) | 0];
      const v = this.makeVehicle(type, pt.x, pt.y, e);
      v.emergency = VEHICLE_TYPES[type].emergency;
      v.mission = { type: 'responder', target, arrived: false, timer: 0 };
      v.maxSpeed *= 1.7;
      v.lights = true;
      LIFE.Audio.siren();
      return v;
    }
    nearestRoadSpot(x, y) {
      const w = this.world;
      for (let r = 0; r < 40; r++) {
        for (let a = 0; a < 8; a++) {
          const ang = a / 8 * 6.283;
          const tx = (x + Math.cos(ang) * r) | 0, ty = (y + Math.sin(ang) * r) | 0;
          if (w.isRoad(tx, ty)) return { x: tx + .5, y: ty + .5 };
        }
      }
      return { x, y };
    }
    updateMissionVehicle(v, dt, game) {
      const m = v.mission;
      m.timer += dt;
      if (!m.arrived) {
        const d = U.dist(v.x, v.y, m.target.x, m.target.y);
        if (d < 6) { m.arrived = true; m.timer = 0; LIFE.Audio.siren(); }
      } else {
        if (m.type === 'responder' && m.timer > 25) {
          v.mission = null; v.maxSpeed /= 1.7;
        }
      }
    }

    /* ---------------- clima ---------------- */
    initWeather() {
      const rnd = this.rnd;
      this.weather = {
        state: 'clear', cloud: .2, rain: 0, wind: .15, fog: 0, timer: 60 + rnd() * 120,
        nextRain: 0, thunderTimer: 4 + rnd() * 20
      };
    }
    weatherState(name) {
      const states = {
        clear: { cloud: .08, rain: 0, fog: 0, wind: .12 },
        partly: { cloud: .45, rain: 0, fog: .05, wind: .22 },
        cloudy: { cloud: .78, rain: 0, fog: .12, wind: .3 },
        rain: { cloud: .85, rain: .55, fog: .22, wind: .35 },
        storm: { cloud: 1, rain: 1, fog: .3, wind: .7 },
        fog: { cloud: .5, rain: 0, fog: .6, wind: .08 }
      };
      return states[name] || states.clear;
    }
    updateWeather(dt, game) {
      const w = this.weather;
      w.timer -= dt;
      if (w.timer <= 0) {
        const rnd = Math.random;
        const roll = rnd();
        let next = 'clear';
        if (w.state === 'clear') next = roll < .45 ? 'partly' : roll < .7 ? 'cloudy' : roll < .88 ? 'rain' : 'storm';
        else if (w.state === 'storm') next = roll < .6 ? 'rain' : 'cloudy';
        else if (w.state === 'rain') next = roll < .5 ? 'cloudy' : roll < .8 ? 'partly' : 'storm';
        else if (w.state === 'fog') next = 'partly';
        else next = roll < .4 ? 'clear' : roll < .65 ? 'rain' : roll < .8 ? 'fog' : 'cloudy';
        w.state = next;
        w.timer = 90 + Math.random() * 240;
      }
      const t = this.weatherState(w.state);
      const k = Math.min(1, dt * .25);
      w.cloud = U.lerp(w.cloud, t.cloud, k);
      w.rain = U.lerp(w.rain, t.rain, k);
      w.fog = U.lerp(w.fog, t.fog, k);
      w.wind = U.lerp(w.wind, t.wind, k);
      // trovões
      if (w.rain > .5) {
        w.thunderTimer -= dt;
        if (w.thunderTimer <= 0) {
          w.thunderTimer = 6 + Math.random() * 22;
          LIFE.Audio.thunder();
          if (game && game.renderer) game.renderer.flash = 1;
        }
      }
      if (game && game.renderer) game.renderer.fog = w.fog;
      LIFE.Audio.setAmbience(this.density(), w.rain, w.wind);
    }

    /* ---------------- eventos urbanos ---------------- */
    updateEvents(dt, game) {
      const w = this.world;
      // gera
      this.eventTimer = (this.eventTimer === undefined) ? 40 : this.eventTimer - dt;
      if (this.eventTimer <= 0) {
        this.eventTimer = 45 + Math.random() * 90;
        if (Math.random() < .75) this.spawnEvent(game);
      }
      for (let i = this.events.length - 1; i >= 0; i--) {
        const ev = this.events[i];
        ev.ttl -= dt;
        ev.timer += dt;
        if (ev.ttl <= 0) { this.events.splice(i, 1); continue; }
        // resolvido por respondentes
        if (ev.responders.length && ev.timer > 14) {
          for (const r of ev.responders) { if (r.mission) r.mission = null; }
          this.resolveEvent(ev);
          this.events.splice(i, 1);
        }
      }
    }
    spawnEvent(game) {
      const w = this.world, p = game.player;
      const kinds = ['acidente', 'incendio', 'assalto', 'emergencia', 'obra', 'queda_energia', 'animal'];
      const weights = { acidente: 30, incendio: 10, assalto: 14, emergencia: 20, obra: 12, queda_energia: 8, animal: 6 };
      let total = 0; for (const k of kinds) total += weights[k];
      let r = Math.random() * total, type = 'acidente';
      for (const k of kinds) { r -= weights[k]; if (r <= 0) { type = k; break; } }
      // local: perto do jogador (30-90 tiles), em via ou prédio
      const ang = Math.random() * 6.283, dist = 26 + Math.random() * 70;
      let x = p.x + Math.cos(ang) * dist, y = p.y + Math.sin(ang) * dist;
      x = U.clamp(x, 6, this.world.W - 6); y = U.clamp(y, 6, this.world.H - 6);
      if (type === 'acidente' || type === 'obra') {
        const s = this.nearestRoadSpot(x, y); x = s.x; y = s.y;
      } else if (type === 'incendio' || type === 'assalto' || type === 'emergencia' || type === 'queda_energia') {
        const b = w.nearestBuilding(x, y, (bb) => bb.kind !== 'park');
        if (b) { x = b.x + b.w / 2; y = b.y + b.h / 2; }
      }
      const ev = {
        id: this.events.length + ':' + (this.time | 0), type, x, y, ttl: 60 + Math.random() * 60, timer: 0,
        responders: [], desc: '', resolved: false
      };
      const street = w.streetNameAt(x, y), hood = (w.districtAt(x, y) || {}).hood || 'cidade';
      switch (type) {
        case 'acidente': {
          ev.desc = 'Acidente na ' + street;
          const a = this.makeVehicle('car', x - 2, y, this.nearestEdge(x, y));
          const b = this.makeVehicle('car', x + 2.5, y, this.nearestEdge(x, y));
          a.maxSpeed = 0; b.maxSpeed = 0; a.damage = 55; b.damage = 35; a.lights = true; b.lights = true;
          a.crashed = b.crashed = true; a.hazard = b.hazard = true;
          ev.responders.push(this.spawnEmergency('ambulance', x, y, { x, y }, game));
          if (Math.random() < .7) ev.responders.push(this.spawnEmergency('police', x, y, { x, y }, game));
          LIFE.Audio.crash();
          break;
        }
        case 'incendio':
          ev.desc = 'Incêndio no ' + hood;
          ev.responders.push(this.spawnEmergency('firetruck', x, y, { x, y }, game));
          if (Math.random() < .6) ev.responders.push(this.spawnEmergency('police', x, y, { x, y }, game));
          break;
        case 'assalto':
          ev.desc = 'Assalto na ' + street;
          ev.responders.push(this.spawnEmergency('police', x, y, { x, y }, game));
          ev.responders.push(this.spawnEmergency('police', x, y, { x, y }, game));
          break;
        case 'emergencia':
          ev.desc = 'Emergência médica no ' + hood;
          ev.responders.push(this.spawnEmergency('ambulance', x, y, { x, y }, game));
          break;
        case 'obra':
          ev.desc = 'Obra interditando a ' + street;
          ev.ttl = 240;
          break;
        case 'queda_energia':
          ev.desc = 'Falta de energia no ' + hood;
          break;
        case 'animal':
          ev.desc = 'Animal solto perto da ' + street;
          break;
      }
      this.events.push(ev);
      this.addNews(ev.desc + '.');
      return ev;
    }
    nearestEdge(x, y) {
      const w = this.world;
      let best = null, bd = 1e9;
      for (const e of w.roadEdges) {
        const a = w.edgePoint(e, 0), b = w.edgePoint(e, 1);
        const d = Math.min(U.dist2(x, y, a.x, a.y), U.dist2(x, y, b.x, b.y));
        if (d < bd) { bd = d; best = e; }
      }
      return best || w.roadEdges[0];
    }
    resolveEvent(ev) {
      const hood = (this.world.districtAt(ev.x, ev.y) || {}).hood || 'cidade';
      const msgs = {
        acidente: 'Via liberada após acidente; feridos foram atendidos.',
        incendio: 'Bombeiros controlam incêndio no ' + hood + '.',
        assalto: 'Suspeito detido após assalto no ' + hood + '.',
        emergencia: 'Paciente levado ao hospital e passa bem.',
        obra: 'Obra concluída e via liberada.',
        queda_energia: 'Energia restabelecida no ' + hood + '.',
        animal: 'Animal resgatado pelas equipes municipais.'
      };
      this.addNews(msgs[ev.type] || 'Ocorrência encerrada.');
    }

    /* ---------------- economia ---------------- */
    updateEconomy(gameMinutes) {
      // preços sobem/descem com suavidade + inflação
      const dt = gameMinutes / 60; // horas
      if (dt <= 0) return;
      this.market.index += this.market.index * (Math.random() - .5) * .002 * dt;
      this.market.combustivel = U.clamp(this.market.combustivel + (Math.random() - .5) * .004 * dt, .8, 1.35);
      this.market.alimentos = U.clamp(this.market.alimentos + (Math.random() - .5) * .003 * dt, .85, 1.4);
      // estoques e vendas dos negócios
      if (!this._econTick) this._econTick = 0;
      this._econTick += dt;
      if (this._econTick > 1) {
        this._econTick = 0;
        const hour = this.clock.hour;
        for (const biz of this.businesses) {
          const open = this.isOpen(biz, hour);
          if (!open) continue;
          for (const g of biz.goods) {
            const sold = Math.random() < .3 ? 1 + ((Math.random() * 3) | 0) : 0;
            g.stock = Math.max(0, g.stock - sold);
            g.sold += sold;
            biz.revenue += sold * this.priceOf(g.id, biz);
          }
          // reposição automática
          for (const g of biz.goods) {
            if (g.stock < g.max * .25) { g.stock = g.max; biz.expenses += g.max * this.priceOf(g.id, biz) * .6; }
          }
        }
      }
    }
    isOpen(biz, hour) {
      if (biz.closeHour === 24) return true;
      if (biz.closeHour < biz.openHour) return hour >= biz.openHour || hour < biz.closeHour;
      return hour >= biz.openHour && hour < biz.closeHour;
    }
    isBizOpen(biz) { return this.isOpen(biz, this.clock.hour); }
    priceOf(goodId, biz) {
      const g = D.GOODS[goodId];
      if (!g) return 0;
      let mult = 1;
      if (g.cat === 'fuel') mult = this.market.combustivel;
      else if (g.cat === 'food' || g.cat === 'meal') mult = this.market.alimentos;
      else mult = 1 + (this.market.index - 100) / 400;
      const jitter = biz ? (1 + ((U.hash(biz.id + goodId) % 100) / 100 - .5) * .16) : 1;
      return Math.max(.5, g.base * mult * jitter * (1 + this.market.inflacao * this.clock.day));
    }
    // fator de mercado por categoria de mercadoria
    factorOf(goodId) {
      const g = D.GOODS[goodId];
      if (!g) return 1;
      if (g.cat === 'fuel') return this.market.combustivel;
      if (g.cat === 'food' || g.cat === 'meal') return this.market.alimentos;
      return 1 + (this.market.index - 100) / 400;
    }
    // preço que o jogador paga numa loja (usa o negócio se existir)
    buyPrice(goodId, building) {
      const f = this.factorOf(goodId);
      if (building && building.biz) {
        const it = building.biz.goods.find((x) => x.id === goodId);
        if (it) return it.price * f;
      }
      return this.priceOf(goodId, null);
    }

    /* ---------------- necessidades dos cidadãos perto do jogador ---------------- */
    updateNeedsOfNearby(dt) {
      for (const a of this.agents) {
        const c = a.citizen;
        if (!c) continue;
        const h = dt / 60 / 10; // decaimento lento
        c.needs.hunger = U.clamp01(c.needs.hunger + h * .5);
        c.needs.energy = U.clamp01(c.needs.energy - h * .35);
        c.needs.hygiene = U.clamp01(c.needs.hygiene - h * .2);
        c.needs.fun = U.clamp01(c.needs.fun - h * .3);
      }
    }

    /* ---------------- notícias ---------------- */
    addNews(text, initial) {
      const txt = text.replace('{st}', this.world.streetNameAt(Math.random() * this.world.W, Math.random() * this.world.H))
        .replace('{nb}', D.AREAS[(Math.random() * D.AREAS.length) | 0])
        .replace('{b}', '');
      this.news.unshift({ text: txt, t: this.time, initial: !!initial });
      if (this.news.length > 40) this.news.pop();
    }
    randomHeadline() {
      const t = D.NEWS[(Math.random() * D.NEWS.length) | 0];
      this.addNews(t);
    }
    get latestNews() { return this.news.length ? this.news[0].text : ''; }

    /* ---------------- consultas ---------------- */
    citizensAround(x, y, r) {
      const out = [];
      for (const a of this.agents) {
        if (U.dist2(a.x, a.y, x, y) < r * r) out.push(a);
      }
      return out;
    }
    vehiclesAround(x, y, r) {
      const out = [];
      for (const v of this.vehicles) if (U.dist2(v.x, v.y, x, y) < r * r) out.push(v);
      return out;
    }
    nearestPed(x, y, r) {
      let best = null, bd = r * r;
      for (const a of this.agents) {
        const d = U.dist2(a.x, a.y, x, y);
        if (d < bd) { bd = d; best = a; }
      }
      return best;
    }
    nearestFreeVehicle(x, y, r) {
      let best = null, bd = r * r;
      for (const v of this.vehicles) {
        if (v.driver || v.occupied || v.dead) continue;
        const d = U.dist2(v.x, v.y, x, y);
        if (d < bd) { bd = d; best = v; }
      }
      return best;
    }
  };

  function catFactor(goodId) {
    const g = D.GOODS[goodId];
    if (!g) return 'index';
    if (g.cat === 'fuel') return 'combustivel';
    if (g.cat === 'food' || g.cat === 'meal') return 'alimentos';
    return 'index';
  }
})();
