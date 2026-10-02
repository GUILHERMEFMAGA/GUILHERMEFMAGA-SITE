/* =========================================================================
   LIFE: CIDADE VIVA — game.js
   Jogador, veículos, interiores, empregos, missões e laço principal.
   ========================================================================= */
(function () {
  'use strict';
  const LIFE = window.LIFE, U = LIFE.Util, D = LIFE.DATA, C = LIFE.CONFIG, TT = LIFE.TT, IT = LIFE.IT;
  const VT = LIFE.VEHICLE_TYPES;

  LIFE.Game = class Game {
    constructor() {
      this.canvas = document.getElementById('game');
      this.clock = new LIFE.Clock(C.DAY_START_MIN, 1);
      this.clock.speed = 1;
      this.world = null;
      this.sim = null;
      this.renderer = null;
      this.entities = [];
      this.interiorCache = new Map();
      this.mode = 'menu';
      this.paused = false;
      this.jobTarget = null;
      this.jobTargetKind = null;
      this.notifs = [];
      this.newsTimer = 0;
      this.destination = null;
      this.stats = { deliveries: 0, earned: 0, driven: 0, walked: 0 };
      this.keys = LIFE.Input.keys;
    }

    /* ---------------- ciclo de vida ---------------- */
    newGame(seed) {
      C.SEED = String(seed || C.SEED);
      this.world = new LIFE.World(C.SEED);
      this.sim = new LIFE.Sim(this.world, this.clock);
      this.renderer = new LIFE.Renderer(this.canvas, this.world);
      this.createPlayer();
      this.mode = 'city';
      this.start();
      this.toast('Bem-vindo à Cidade Viva! Abra o celular com TAB.', 'good');
    }
    continueGame() {
      const data = LIFE.Save.read();
      if (!data) return this.newGame(C.SEED);
      C.SEED = data.seed || C.SEED;
      this.world = new LIFE.World(C.SEED);
      this.sim = new LIFE.Sim(this.world, this.clock);
      this.renderer = new LIFE.Renderer(this.canvas, this.world);
      this.createPlayer();
      this.load(data);
      this.mode = 'city';
      this.start();
      this.toast('Jogo carregado. Bem-vindo de volta!', 'good');
    }
    start() {
      this.lastT = performance.now();
      this.running = true;
      if (!this._loop) {
        this._loop = true;
        const loop = (t) => {
          const raw = U.clamp((t - this.lastT) / 1000, 0, .25);   // tempo real decorrido
          this.lastT = t;
          this._frameDt = Math.max(.0001, raw);
          if (this.running && this.mode === 'city') {
            // sub-passos: mantém a simulação estável e o relógio fiel mesmo em máquinas lentas
            let remaining = raw, steps = 0;
            const maxSteps = 6;
            while (remaining > 0.0005 && steps < maxSteps) {
              const dt = Math.min(1 / 30, remaining);
              this.update(dt);
              remaining -= dt; steps++;
            }
          }
          this.draw();
          LIFE.Input.endFrame();
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      }
    }

    createPlayer() {
      const w = this.world;
      // procura uma casa residencial perto do centro
      const c = { x: w.W / 2, y: w.H / 2 };
      const home = w.nearestBuilding(c.x, c.y, (b) => ['house', 'house_big', 'apartment', 'condo'].includes(b.kind)) || w.buildings[0];
      const start = w.nearestWalkable(home.door.x, home.door.y, 8);
      this.player = {
        x: start.x, y: start.y, angle: -Math.PI / 2, speed: 0, isPlayer: true,
        money: 450, needs: { hunger: .25, energy: .9, hygiene: .8, fun: .7 },
        inventory: { pao: 1, agua: 1 }, house: home, job: null, vehicle: null,
        indoor: null, interior: null, lights: false, hp: 1, name: 'Você',
        bedRest: 0, working: 0, tooltip: null
      };
      this.clock.min = C.DAY_START_MIN;
      this.camFollow = true;
      this.zoneName = '';
      this.updateZone();
    }

    save() {
      const p = this.player;
      LIFE.Save.write({
        seed: C.SEED, day: this.clock.day, min: this.clock.min,
        money: p.money, needs: p.needs, inventory: p.inventory,
        x: p.x, y: p.y, houseId: p.house ? p.house.id : null,
        job: p.job ? { name: p.job.prof.name, bId: p.job.building.id, hourly: p.job.hourly, shift: p.job.shift, since: p.job.since } : null,
        stats: this.stats
      });
    }
    load(d) {
      const p = this.player;
      p.money = d.money || 450;
      if (d.needs) p.needs = d.needs;
      if (d.inventory) p.inventory = d.inventory;
      if (d.x) { p.x = d.x; p.y = d.y; }
      if (d.houseId != null && this.world.buildings[d.houseId]) p.house = this.world.buildings[d.houseId];
      if (d.day) { this.clock.day = d.day; this.clock.min = d.min || 480; }
      if (d.stats) this.stats = d.stats;
      if (d.job) {
        const b = this.world.buildings[d.job.bId];
        const prof = D.PROFESSIONS.find((x) => x.name === d.job.name) || D.PROFESSIONS[0];
        if (b) p.job = { prof, building: b, hourly: d.job.hourly, shift: d.job.shift, since: d.job.since };
      }
      this.updateZone();
    }

    /* ---------------- atualização ---------------- */
    update(dt) {
      const gm = dt * this.clock.speed * C.MIN_PER_SEC;   // minutos de jogo
      this.clock.advance(gm);
      this.light = this.renderer.lighting(this.clock, this.sim.weather);

      if (LIFE.Input.justPressed('p')) { this.paused = !this.paused; this.toast(this.paused ? 'Jogo pausado' : 'Jogo retomado'); }
      if (LIFE.Input.justPressed('m')) { const m = LIFE.Audio.toggleMute(); this.toast(m ? 'Som desligado' : 'Som ligado'); }

      if (!this.paused) {
        // em velocidades altas a cidade simula com menos corpos ativos
        const sp = this.clock.speed;
        this.sim.budget = sp >= 20 ? .35 : sp >= 5 ? .6 : 1;
        if (this.player.indoor) this.updateInterior(dt, gm);
        else this.updateCity(dt, gm);
        this.updateNeeds(dt);
      }
      this.time = (this.time || 0) + dt;
      this.updateCamera(dt);
      this.updateHUD(dt);
    }

    updateCity(dt, gm) {
      const p = this.player;
      if (p.vehicle) this.updateDriving(dt, gm);
      else this.updateWalking(dt, gm);
      // interações
      this.updateInteractions(dt);
      // simulação do mundo
      this.sim.update(dt * this.clock.speed, gm, this);
      // mundo segue sem o jogador: câmeras lentas
      this.updateZone();
      // entidades visíveis para o renderer
      this.entities = [];
      for (const a of this.sim.agents) if (!a.inside) this.entities.push(a);
      for (const v of this.sim.vehicles) if (!v.dead) this.entities.push(v);
      if (!p.vehicle) this.entities.push(p);
      // notícias
      this.newsTimer -= dt;
      if (this.newsTimer <= 0) { this.newsTimer = 90 + Math.random() * 120; this.sim.randomHeadline(); }
      // autosave
      this.saveTimer = (this.saveTimer || 0) + dt;
      if (this.saveTimer > 45) { this.saveTimer = 0; this.save(); }
    }

    /* ---------------- jogador a pé ---------------- */
    updateWalking(dt, gm) {
      const p = this.player, In = LIFE.Input;
      const ax = In.axis();
      const running = In.down('shift') && p.needs.energy > .12;
      let speed = (running ? C.PLAYER_RUN : C.PLAYER_SPEED);
      speed *= (.45 + p.needs.energy * .55) * (1 - p.needs.hunger * .25);
      if (p.tired) speed *= .6;
      if (ax.x || ax.y) {
        const target = Math.atan2(ax.y, ax.x);
        p.angle = U.angLerp(p.angle, target, Math.min(1, dt * 12));
        const nx = p.x + Math.cos(p.angle) * speed * dt;
        const ny = p.y + Math.sin(p.angle) * speed * dt;
        const canX = this.world.isWalkable(nx | 0, p.y | 0);
        const canY = this.world.isWalkable(p.x | 0, ny | 0);
        if (canX) p.x = nx;
        if (canY) p.y = ny;
        if (!canX && !canY) { /* parede */ }
        p.walkPhase = (p.walkPhase || 0) + dt * speed * 2.4;
        this.stats.walked += speed * dt;
        if (Math.sin(p.walkPhase) > .96 && (running)) LIFE.Audio.step();
      }
      // limites do mundo
      p.x = U.clamp(p.x, 1, this.world.W - 1); p.y = U.clamp(p.y, 1, this.world.H - 1);
    }

    /* ---------------- direção ---------------- */
    updateDriving(dt, gm) {
      const p = this.player, In = LIFE.Input, v = p.vehicle;
      const ax = In.axis();
      const throttle = (In.down('w') || In.down('arrowup')) ? 1 : 0;
      const brake = (In.down('s') || In.down('arrowdown')) ? 1 : 0;
      const handbrake = In.down(' ');
      const wrong = v.fuel <= 0;
      const engine = wrong ? .25 : 1;
      // aceleração
      if (throttle) v.speed = Math.min(v.maxSpeed * engine, v.speed + 6.2 * engine * dt);
      else if (brake) v.speed = Math.max(-v.maxSpeed * .35, v.speed - 9 * dt);
      else v.speed *= (1 - 1.6 * dt);
      if (handbrake) v.speed *= (1 - 5 * dt);
      if (v.damage > 65) { v.maxSpeed = Math.max(2.5, (VT[v.type] || VT.car).speed[1] * (1 - v.damage / 220)); }
      // direção: só vira se estiver andando
      const steerInput = (ax.x !== 0) ? ax.x : 0;
      if (Math.abs(v.speed) > .12) {
        const turnRate = (1.9 + Math.abs(v.speed) * .06) * (steerInput >= 0 ? 1 : -1) * Math.min(1, Math.abs(v.speed) / 2.4);
        v.angle += steerInput * dt * turnRate * (v.speed < 0 ? -1 : 1) * (handbrake ? 1.5 : 1);
      }
      // movimento com colisão
      const nx = v.x + Math.cos(v.angle) * v.speed * dt;
      const ny = v.y + Math.sin(v.angle) * v.speed * dt;
      const halfW = v.w * .5;
      const probeX = nx + Math.cos(v.angle) * (v.h * .5), probeY = ny + Math.sin(v.angle) * (v.h * .5);
      const hitB = this.world.buildingAt(probeX | 0, probeY | 0);
      const hitW = !this.world.isWalkable(nx | 0, ny | 0) && !this.world.isRoad(nx | 0, ny | 0);
      if (hitB || hitW) {
        const impact = Math.abs(v.speed);
        const now = this.time || 0;
        if (impact > 3.5 && (!v.lastCrash || now - v.lastCrash > .9)) {
          v.lastCrash = now;
          v.damage = Math.min(100, v.damage + 4 + impact * .9);
          LIFE.Audio.crash();
          this.renderer.cam.shake = Math.min(14, impact * 1.7);
          this.toast('Bateu! Danos: ' + Math.round(v.damage) + '%', 'bad');
          if (impact > 6 && Math.random() < .5) this.sim.spawnEvent && this.sim.addNews('Acidente na ' + this.world.streetNameAt(v.x, v.y) + '.');
        }
        v.speed = -v.speed * .22;
        // volta para posição válida
        if (this.world.isWalkable(v.x | 0, v.y | 0) || this.world.isRoad(v.x | 0, v.y | 0)) { /* ok */ }
        else { v.x = p.x; v.y = p.y; }
      } else { v.x = nx; v.y = ny; }
      // colisão com outros veículos
      for (const o of this.sim.vehicles) {
        if (o === v || o.dead) continue;
        const d = U.dist(v.x, v.y, o.x, o.y);
        if (d < (v.h + o.h) * .42) {
          const imp = Math.abs(v.speed - o.speed) + .5;
          v.damage = Math.min(100, v.damage + imp * 1.2);
          o.damage = Math.min(100, o.damage + imp * 1.2);
          o.speed = Math.max(o.speed, v.speed * .4);
          if (imp > 4) { LIFE.Audio.crash(); this.renderer.cam.shake = 9; }
          const push = (v.h + o.h) * .42 - d;
          v.x -= Math.cos(v.angle) * push * .6; v.y -= Math.sin(v.angle) * push * .6;
          v.speed *= .3;
        }
      }
      // colisão com pedestres
      for (const a of this.sim.agents) {
        if (U.dist2(v.x, v.y, a.x, a.y) < 1.1 && Math.abs(v.speed) > 2) {
          this.renderer.cam.shake = 10;
          this.toast('Você atropelou um pedestre! Testemunhas chamaram a polícia.', 'bad');
          this.sim.addNews('Atropelamento na ' + this.world.streetNameAt(v.x, v.y) + '.');
          this.sim.spawnEmergency('ambulance', a.x, a.y, { x: a.x, y: a.y }, this);
          this.sim.spawnEmergency('police', a.x, a.y, { x: a.x, y: a.y }, this);
          a.dead = true; a.citizen.active = null;
          v.speed *= .4;
        }
      }
      // consumo
      if (throttle) {
        v.fuel = Math.max(0, v.fuel - dt * .055 * (.5 + Math.abs(v.speed) / 8));
        this.stats.driven += Math.abs(v.speed) * dt;
      }
      if (v.fuel <= 0 && !v.warnedFuel) { v.warnedFuel = true; this.toast('Combustível acabou! Empurre até um posto (ou chame o guincho).', 'bad'); }
      // faróis
      if (LIFE.Input.justPressed('l')) { v.lights = !v.lights; this.toast(v.lights ? 'Faróis ligados' : 'Faróis desligados'); }
      if (LIFE.Input.justPressed('h')) { LIFE.Audio.horn(); v.horn = .3; }
      // sair do veículo
      if (LIFE.Input.justPressed('e')) {
        const spot = this.findExitSpot(v);
        p.x = spot.x; p.y = spot.y; p.vehicle = null;
        v.driver = null; v.occupied = false;
        LIFE.Audio.door();
        this.toast('Você saiu do veículo.');
      }
    }
    findExitSpot(v) {
      for (let r = 1; r < 3; r += .5) {
        for (let a = 0; a < 8; a++) {
          const ang = a / 8 * 6.283;
          const x = v.x + Math.cos(ang) * (v.w * .5 + r), y = v.y + Math.sin(ang) * (v.h * .5 + r);
          if (this.world.isWalkable(x | 0, y | 0)) return { x, y };
        }
      }
      return { x: v.x, y: v.y };
    }

    /* ---------------- interações no mundo ---------------- */
    updateInteractions(dt) {
      const p = this.player, w = this.world, In = LIFE.Input;
      p.tooltip = null; p.prompt = null;
      if (p.vehicle) {
        const b = this.nearbySpot(p.vehicle.x, p.vehicle.y);
        if (b && b.spot && b.dist < 4) {
          p.prompt = { text: b.label, key: 'E', action: b.action, spot: b.spot, building: b.building };
        }
        return;
      }
      // portas de prédios
      let best = null, bd = 2.6;
      for (const b of w.buildings) {
        if (Math.abs(b.x - p.x) > 20 || Math.abs(b.y - p.y) > 20) continue;
        const d = w.doorTile(b);
        const dist = U.dist(p.x, p.y, d.x, d.y);
        if (dist < bd && b.interior) { bd = dist; best = b; }
      }
      if (best) {
        p.prompt = { text: 'Entrar em ' + best.name, key: 'E', action: 'enter', building: best };
        p.target = best;
      }
      // veículos próximos
      if (!p.prompt) {
        const v = this.sim.nearestFreeVehicle(p.x, p.y, 2.4);
        if (v) p.prompt = { text: 'Dirigir ' + this.vehicleLabel(v), key: 'E', action: 'drive', vehicle: v };
      }
      // NPCs próximos
      if (!p.prompt) {
        const a = this.sim.nearestPed(p.x, p.y, 2.2);
        if (a && a.citizen) {
          p.prompt = { text: 'Conversar com ' + a.citizen.name, key: 'E', action: 'talk', ped: a };
        }
      }
      // pontos de interesse (posto, caixa fora do prédio)
      if (!p.prompt) {
        const spot = this.nearbySpot(p.x, p.y);
        if (spot && spot.dist < 3.4) p.prompt = { text: spot.label, key: 'E', action: spot.action, spot: spot.spot, building: spot.building, data: spot.data };
      }
      if (p.prompt && In.justPressed('e')) this.doAction(p.prompt);
    }

    vehicleLabel(v) { return ({ car: 'carro', taxi: 'táxi', moto: 'moto', van: 'van', truck: 'caminhão', bus: 'ônibus', police: 'viatura', ambulance: 'ambulância', firetruck: 'caminhão de bombeiros', pickup: 'caminhonete' })[v.type] || 'veículo'; }

    nearbySpot(x, y) {
      // pontos interativos fora de prédios: postos de combustível e comércio de rua
      const w = this.world;
      let best = null;
      for (const b of w.buildings) {
        if (Math.abs(b.x - x) > 18 || Math.abs(b.y - y) > 18) continue;
        const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
        const d = U.dist(x, y, cx, cy);
        if (d > 12) continue;
        if (b.kind === 'gas' && d < 8) {
          const sp = this.world.parkingSpot(b, Math.random);
          const dp = U.dist(x, y, sp.x, sp.y);
          if (!best || dp < best.dist) best = { label: 'Abastecer veículo', action: 'fuel', spot: { x: sp.x, y: sp.y, type: 'pump' }, building: b, dist: dp };
        }
      }
      return best;
    }

    doAction(prompt) {
      const p = this.player;
      switch (prompt.action) {
        case 'enter': this.enterBuilding(prompt.building); break;
        case 'drive': this.enterVehicle(prompt.vehicle); break;
        case 'talk': this.talkTo(prompt.ped); break;
        case 'fuel': LIFE.UI.openFuel(prompt.building); break;
      }
    }

    enterVehicle(v) {
      const p = this.player;
      p.vehicle = v; v.driver = p; v.occupied = true;
      v.maxSpeed = (VT[v.type] || VT.car).speed[1] * (1 - v.damage / 260);
      LIFE.Audio.door();
      this.toast('Dirigindo ' + this.vehicleLabel(v) + '. Combustível: ' + Math.round(v.fuel) + ' L');
      this.renderer.cam.targetZoom = 1.05;
    }

    talkTo(a) {
      const c = a.citizen;
      const hour = this.clock.hour;
      const lines = [];
      lines.push(c.name + ', ' + c.age + ' anos · ' + c.prof.name);
      lines.push('Humor: ' + (c.mood > .7 ? 'ótimo' : c.mood > .4 ? 'ok' : 'ruim') + ' · ' + (c.lastAct || 'ocupado'));
      const opts = [
        { label: 'Onde você trabalha?', fn: () => { const b = c.work; this.toast(b ? 'Trabalho em ' + b.name + ' (' + b.district.hood + ')' : 'Estou sem trabalho no momento.', 'info'); } },
        { label: 'Como está a cidade hoje?', fn: () => { this.toast(this.sim.latestNews || 'Tudo tranquilo por aqui.', 'info'); } },
        { label: 'Precisa de ajuda?', fn: () => { this.toast(c.name.split(' ')[0] + ': "Tudo bem, obrigado!"', 'info'); } }
      ];
      if (this.player.vehicle === null && a.citizen.car) {
        // nada por enquanto
      }
      LIFE.UI.dialog(lines.join('<br>'), opts, () => LIFE.Audio.beep(520, .08, 'sine', .05));
    }

    /* ---------------- interiores ---------------- */
    enterBuilding(b) {
      const p = this.player;
      if (!this.interiorCache.has(b.id)) this.interiorCache.set(b.id, LIFE.buildInterior.call(this.world, b, C.SEED));
      const it = this.interiorCache.get(b.id);
      p.indoor = b; p.interior = it;
      p.worldPos = { x: p.x, y: p.y };
      p.x = it.entry.x; p.y = it.entry.y;
      p.angle = -Math.PI / 2;
      LIFE.Audio.door();
      this.renderer.cam.targetZoom = 1.35;
      this.toast('Você entrou em ' + b.name + '. Pressione E na porta para sair.');
      // NPCs trabalhando aqui aparecem
      this.interiorNpcs = [];
      const staff = this.sim.citizens.filter((c) => c.work === b);
      const slots = it.spots.filter((s) => s.type === 'work');
      const shuffle = U.shuffledCopy(Math.random, staff).slice(0, Math.min(4, slots.length));
      for (let i = 0; i < shuffle.length; i++) {
        const c = shuffle[i];
        const sp = slots[(i * 2 + 1) % slots.length];
        const npc = {
          citizen: c, name: c.name, x: sp.x + .5, y: sp.y + .5, angle: Math.random() * 6.283,
          home: { x: sp.x + .5, y: sp.y + .5 }, target: null, timer: 1.5 + Math.random() * 6,
          speed: .7 + Math.random() * .5, act: 'trabalho', bubble: null
        };
        this.sim.assignColor(npc, c);
        this.interiorNpcs.push(npc);
      }
      this.refreshInteriorSpots();
    }
    refreshInteriorSpots() {
      const it = this.player.interior;
      if (!it) return;
      const b = this.player.indoor;
      const spots = [];
      for (const sp of it.spots) {
        if (sp.type === 'till' && b.biz && b.biz.goods.length) {
          spots.push({ ...sp, label: 'Comprar em ' + b.name, action: 'shop', building: b });
        } else if (sp.type === 'bed' && (b === this.player.house || b.kind === 'hotel')) {
          spots.push({ ...sp, label: sp.type === 'bed' && b.kind === 'hotel' ? 'Alugar quarto e dormir (R$ 120)' : 'Dormir', action: 'sleep', building: b });
        } else if (sp.type === 'shower' && b === this.player.house) {
          spots.push({ ...sp, label: 'Tomar banho', action: 'shower', building: b });
        } else if (sp.type === 'cook' && b === this.player.house) {
          spots.push({ ...sp, label: 'Cozinhar', action: 'cook', building: b });
        } else if (sp.type === 'table' && b.kind === 'restaurant') {
          spots.push({ ...sp, label: 'Fazer um pedido', action: 'shop', building: b });
        } else if (sp.type === 'table') {
          spots.push({ ...sp, label: 'Comer algo que trouxe', action: 'eatown', building: b });
        } else if (sp.type === 'work') {
          const job = this.player.job;
          if (job && job.building === b) spots.push({ ...sp, label: 'Trabalhar', action: 'work', building: b });
        }
      }
      this.interiorSpots = spots;
    }
    exitBuilding() {
      const p = this.player;
      const b = p.indoor;
      if (!p.worldPos) { p.indoor = null; p.interior = null; return; }
      p.x = p.worldPos.x; p.y = p.worldPos.y;
      p.indoor = null; p.interior = null;
      p.angle = Math.PI / 2;
      this.interiorNpcs = [];
      LIFE.Audio.door();
      this.renderer.cam.targetZoom = 1.18;
    }

    updateInterior(dt, gm) {
      const p = this.player, In = LIFE.Input, it = p.interior;
      const ax = In.axis();
      const speed = (In.down('shift') ? 3.4 : 2.1);
      if (ax.x || ax.y) {
        const target = Math.atan2(ax.y, ax.x);
        p.angle = U.angLerp(p.angle, target, Math.min(1, dt * 12));
        const nx = p.x + Math.cos(p.angle) * speed * dt;
        const ny = p.y + Math.sin(p.angle) * speed * dt;
        const solid = (x, y) => {
          if (x < .5 || y < .5 || x > it.w - 1.5 || y > it.h - 1.5) return false;
          const t = it.tiles[(y | 0) * it.w + (x | 0)];
          return t !== IT.WALL && t !== IT.FURN;
        };
        if (solid(nx, p.y)) p.x = nx;
        if (solid(p.x, ny)) p.y = ny;
        p.walkPhase = (p.walkPhase || 0) + dt * speed * 2.4;
      }
      // sair pela porta
      const exit = it.exit;
      if (U.dist(p.x, p.y, exit.x, exit.y) < 1.6 && In.justPressed('e')) { this.exitBuilding(); return; }
      // spots
      let best = null, bd = 2.2;
      for (const sp of this.interiorSpots || []) {
        const d = U.dist(p.x, p.y, sp.x + .5, sp.y + .5);
        if (d < bd) { bd = d; best = sp; }
      }
      p.prompt = best ? { text: best.label, key: 'E', action: best.action, spot: best, building: best.building } : null;
      if (p.prompt && In.justPressed('e')) this.doInteriorAction(p.prompt);
      // funcionários caminhando pelo interior
      this.updateInteriorNpcs(dt, it);
      // trabalhando
      if (p.working > 0) {
        p.working -= dt;
        const perMin = (p.job ? p.job.hourly : 30) / 60;
        const gain = perMin * (dt * this.clock.speed * C.MIN_PER_SEC);
        p.money += gain;
        this.stats.earned += gain;
        p.needs.energy = U.clamp01(p.needs.energy - dt * .012);
        if (p.working <= 0) { this.toast('Turno concluído. Você recebeu o pagamento.', 'money'); LIFE.Audio.cash(); }
      }
      // simulação continua (LOD reduzido)
      this.sim.update(dt * this.clock.speed * .35, gm * .35, this);
      this.entities = [];
    }

    updateInteriorNpcs(dt, it) {
      for (const n of this.interiorNpcs || []) {
        n.timer -= dt;
        if (n.timer <= 0) {
          n.timer = 2 + Math.random() * 7;
          // escolhe um destino: volta ao posto, atende um spot aleatório ou circula
          const spots = (it.spots || []).filter((s) => s.type === 'work');
          const r = Math.random();
          let t = n.home;
          if (r < .35 && spots.length) { const s2 = spots[(Math.random() * spots.length) | 0]; t = { x: s2.x + .5, y: s2.y + .5 }; }
          else if (r < .6) t = { x: n.home.x + (Math.random() - .5) * 4, y: n.home.y + (Math.random() - .5) * 3 };
          n.target = t;
          if (r > .8) n.act = 'pausa'; else n.act = 'trabalho';
        }
        if (n.target && n.act !== 'pausa') {
          const d = U.dist(n.x, n.y, n.target.x, n.target.y);
          if (d < .3) { n.target = null; }
          else {
            const a = Math.atan2(n.target.y - n.y, n.target.x - n.x);
            n.angle = U.angLerp(n.angle, a, Math.min(1, dt * 7));
            const step = n.speed * dt;
            const nx = n.x + Math.cos(n.angle) * step, ny = n.y + Math.sin(n.angle) * step;
            const solid = (x, y) => {
              const t = it.tiles[(y | 0) * it.w + (x | 0)];
              return t !== IT.WALL && t !== IT.FURN;
            };
            if (solid(nx, n.y)) n.x = nx;
            if (solid(n.x, ny)) n.y = ny;
          }
        }
      }
    }

    doInteriorAction(prompt) {
      const p = this.player;
      switch (prompt.action) {
        case 'shop': LIFE.UI.openShop(prompt.building); break;
        case 'sleep': {
          if (prompt.building.kind === 'hotel') {
            if (p.money < 120) { this.toast('Dinheiro insuficiente para o quarto (R$ 120).', 'bad'); return; }
            p.money -= 120;
          }
          this.sleep();
          break;
        }
        case 'shower':
          p.needs.hygiene = 1; LIFE.Audio.noiseBurst(.4, 900, .12);
          this.toast('Banho tomado. Higiene restaurada!', 'good');
          break;
        case 'cook': {
          const hasFood = (p.inventory.pao || 0) + (p.inventory.arroz || 0) + (p.inventory.frango || 0) > 0;
          if (!hasFood) { this.toast('Você não tem ingredientes. Compre no supermercado.', 'bad'); return; }
          if (p.inventory.pao) p.inventory.pao--; else if (p.inventory.arroz) p.inventory.arroz--; else p.inventory.frango--;
          p.needs.hunger = U.clamp01(p.needs.hunger - .6);
          p.needs.energy = U.clamp01(p.needs.energy + .08);
          LIFE.Audio.eat();
          this.toast('Você cozinhou e comeu. Fome reduzida!', 'good');
          break;
        }
        case 'eatown': {
          const has = (p.inventory.pao || 0) + (p.inventory.lanche || 0) + (p.inventory.prato || 0) + (p.inventory.pizza || 0) + (p.inventory.frango || 0);
          if (!has) { this.toast('Você não tem comida na mochila.', 'bad'); return; }
          const key = ['prato', 'pizza', 'lanche', 'frango', 'pao'].find((k) => p.inventory[k]);
          p.inventory[key]--;
          p.needs.hunger = U.clamp01(p.needs.hunger - .55);
          p.needs.fun = U.clamp01(p.needs.fun + .1);
          LIFE.Audio.eat();
          this.toast('Você comeu. Fome reduzida!', 'good');
          break;
        }
        case 'work': {
          if (!p.job) { this.toast('Você não tem emprego. Veja o celular (TAB).', 'bad'); return; }
          p.working = 20; // segundos reais de turno
          this.toast('Trabalhando...', 'good');
          break;
        }
      }
    }

    sleep() {
      const p = this.player;
      this.pausedSleep = true;
      const target = 6 * 60;
      let mins = target - this.clock.min; if (mins <= 0) mins += 1440;
      LIFE.UI.fadeSleep(() => {
        this.clock.advance(mins);
        p.needs.energy = 1; p.needs.hygiene = U.clamp01(p.needs.hygiene - .15);
        p.needs.hunger = U.clamp01(p.needs.hunger + .25);
        this.pausedSleep = false;
        this.toast('Você acordou descansado. Dia ' + this.clock.day + '.', 'good');
      });
    }

    /* ---------------- empregos e missões ---------------- */
    availableJobs() {
      const list = [];
      const w = this.world;
      const common = [
        { kind: 'entregador', name: 'Entregador(a)', build: 'darkstore', hourly: 55, shift: [8 * 60, 20 * 60], task: 'entrega' },
        { kind: 'caixa', name: 'Operador(a) de Caixa', build: 'supermarket', hourly: 42, shift: [7 * 60, 15 * 60], task: 'turno' },
        { kind: 'garcom', name: 'Garçom/Garçonete', build: 'restaurant', hourly: 48, shift: [17 * 60, 23 * 60], task: 'turno' },
        { kind: 'taxista', name: 'Motorista de Táxi', build: 'gas', hourly: 60, shift: [6 * 60, 18 * 60], task: 'taxi' },
        { kind: 'repositor', name: 'Repositor(a)', build: 'market', hourly: 40, shift: [6 * 60, 14 * 60], task: 'turno' },
        { kind: 'mecanico', name: 'Mecânico(a)', build: 'garage', hourly: 58, shift: [8 * 60, 18 * 60], task: 'turno' },
        { kind: 'padeiro', name: 'Padeiro(a)', build: 'bakery', hourly: 50, shift: [5 * 60, 13 * 60], task: 'turno' },
        { kind: 'seguranca', name: 'Segurança', build: 'mall', hourly: 46, shift: [19 * 60, 6 * 60], task: 'turno' },
        { kind: 'entregador', name: 'Motoboy de Farmácia', build: 'pharmacy', hourly: 52, shift: [9 * 60, 19 * 60], task: 'entrega' }
      ];
      for (const j of common) {
        const places = w.places(j.build);
        if (!places.length) continue;
        const b = places[(Math.random() * places.length) | 0];
        list.push({ prof: { id: j.kind, name: j.name }, building: b, hourly: j.hourly, shift: j.shift, task: j.task, dist: U.dist(this.player.x, this.player.y, b.x, b.y) });
      }
      list.sort((a, b) => a.dist - b.dist);
      return list.slice(0, 7);
    }

    acceptJob(j) {
      this.player.job = { prof: j.prof, building: j.building, hourly: j.hourly, shift: j.shift, task: j.task, since: this.clock.day };
      this.toast('Você foi contratado como ' + j.prof.name + ' em ' + j.building.name + '!', 'good');
      LIFE.Audio.notif();
      this.setJobTarget(j.building.x + j.building.w / 2, j.building.y + j.building.h / 2, 'Emprego');
      LIFE.UI.renderPhone();
    }
    quitJob() {
      this.player.job = null;
      this.jobTarget = null;
      this.toast('Você pediu demissão.');
      LIFE.UI.renderPhone();
    }
    setJobTarget(x, y, kind) {
      this.jobTarget = { x, y };
      this.jobTargetKind = kind;
    }

    startDelivery() {
      const w = this.world;
      const store = w.randomPlace(['darkstore', 'supermarket', 'market', 'pharmacy'].filter((k) => w.places(k).length), Math.random) || w.places('supermarket')[0];
      if (!store) { this.toast('Nenhum ponto de coleta disponível.', 'bad'); return; }
      const homes = w.buildings.filter((b) => ['house', 'house_big', 'apartment', 'condo'].includes(b.kind));
      const dest = homes[(Math.random() * homes.length) | 0];
      this.mission = {
        type: 'entrega', stage: 'coleta', store, dest,
        x: store.x + store.w / 2, y: store.y + store.h / 2, pay: 90 + Math.random() * 120
      };
      this.setJobTarget(this.mission.x, this.mission.y, 'Coleta');
      this.toast('Nova entrega! Busque o pacote em ' + store.name + '.', 'good');
      LIFE.Audio.notif();
    }
    startTaxiRide() {
      const w = this.world;
      const places = w.buildings.filter((b) => b.biz);
      const from = places[(Math.random() * places.length) | 0];
      const to = places[(Math.random() * places.length) | 0];
      this.mission = { type: 'taxi', stage: 'buscar', from, to, x: from.x + from.w / 2, y: from.y + from.h / 2, pay: 70 + Math.random() * 90 };
      this.setJobTarget(this.mission.x, this.mission.y, 'Passageiro');
      this.toast('Corrida de táxi! Vá buscar o passageiro.', 'good');
    }
    updateMission() {
      const m = this.mission, p = this.player;
      if (!m) return;
      const d = U.dist(p.x, p.y, m.x, m.y);
      if (d > 4) return;
      if (m.type === 'entrega') {
        if (m.stage === 'coleta') {
          m.stage = 'entrega';
          m.x = m.dest.x + m.dest.w / 2; m.y = m.dest.y + m.dest.h / 2;
          this.setJobTarget(m.x, m.y, 'Entrega');
          this.toast('Pacote coletado. Entregue no destino marcado.', 'good');
          LIFE.Audio.beep(700, .12, 'square', .07);
        } else {
          p.money += m.pay; this.stats.earned += m.pay; this.stats.deliveries++;
          LIFE.Audio.cash();
          this.toast('Entrega concluída! +' + U.fmtMoney(m.pay), 'money');
          this.mission = null; this.jobTarget = null;
          LIFE.UI.renderPhone();
        }
      } else if (m.type === 'taxi') {
        if (m.stage === 'buscar') {
          if (!p.vehicle) { this.toast('Você precisa estar em um veículo para levar o passageiro.', 'bad'); return; }
          m.stage = 'levar';
          m.x = m.to.x + m.to.w / 2; m.y = m.to.y + m.to.h / 2;
          this.setJobTarget(m.x, m.y, 'Destino');
          this.toast('Passageiro embarcado. Leve-o ao destino.', 'good');
        } else {
          p.money += m.pay; this.stats.earned += m.pay;
          LIFE.Audio.cash();
          this.toast('Corrida finalizada! +' + U.fmtMoney(m.pay), 'money');
          this.mission = null; this.jobTarget = null;
          LIFE.UI.renderPhone();
        }
      }
    }

    /* ---------------- necessidades ---------------- */
    updateNeeds(dt) {
      const p = this.player;
      const s = dt * this.clock.speed;   // horas de jogo por segundo
      const h = s / 3600 * 60;           // fator de minutos
      p.needs.hunger = U.clamp01(p.needs.hunger + dt * .0009 * this.clock.speed);
      p.needs.energy = U.clamp01(p.needs.energy - dt * .00055 * this.clock.speed);
      p.needs.hygiene = U.clamp01(p.needs.hygiene - dt * .0004 * this.clock.speed);
      p.needs.fun = U.clamp01(p.needs.fun - dt * .0003 * this.clock.speed);
      p.hp = U.clamp01(1 - Math.max(0, p.needs.hunger - .85) - Math.max(0, .12 - p.needs.energy));
      p.tired = p.needs.energy < .25;
      if (p.needs.hunger > .92 && !p._warnedHunger) { p._warnedHunger = true; this.toast('Você está com muita fome! Coma algo.', 'bad'); }
      if (p.needs.hunger < .6) p._warnedHunger = false;
      if (p.needs.energy < .12 && !p._warnedEnergy) { p._warnedEnergy = true; this.toast('Você está exausto. Durma em casa (celular → Banco) ou num hotel.', 'bad'); }
      if (p.needs.energy > .4) p._warnedEnergy = false;
      this.updateMission();
    }

    /* ---------------- câmera ---------------- */
    updateCamera(dt) {
      const cam = this.renderer.cam, p = this.player, In = LIFE.Input;
      if (In.justPressed('c')) {
        const levels = [1.18, 0.72, 1.9];
        const i = levels.indexOf(cam.targetZoom);
        cam.targetZoom = levels[(i + 1) % levels.length];
        this.toast('Zoom: ' + (cam.targetZoom < 1 ? 'ampla (observar)' : cam.targetZoom > 1.5 ? 'aproximada' : 'normal'));
      }
      if (In.mouse.wheel) { cam.targetZoom = U.clamp(cam.targetZoom - In.mouse.wheel * .12, .55, 2.6); }
      const cx = p.vehicle ? p.vehicle.x : p.x, cy = p.vehicle ? p.vehicle.y : p.y;
      cam.x = U.lerp(cam.x, cx, Math.min(1, dt * 5));
      cam.y = U.lerp(cam.y, cy, Math.min(1, dt * 5));
      cam.free = false;
    }

    /* ---------------- HUD ----------------
       (implementado em ui.js) */
    updateHUD(dt) { LIFE.UI.updateHUD(this, dt); }
    updateZone() {
      const p = this.player;
      const d = this.world.districtAt(p.x, p.y);
      if (d && d.name !== this.zoneName) {
        this.zoneName = d.name;
        LIFE.UI.showZone(d.name, d.hood);
      }
      LIFE.UI.updateMapLabel && LIFE.UI.updateMapLabel(this);
    }
    toast(text, type) {
      this.notifs.push({ text, type: type || 'info', t: 6 });
      LIFE.UI && LIFE.UI.notify(text, type);
    }

    /* ---------------- desenho de entidades ---------------- */
    draw(ctx, light) {
      const c = ctx || this.renderer.ctx;
      if (this.player.indoor) this.drawInterior(c, this.light);
      else this.renderer.frame(this);
    }

    drawEntity(ctx, e, light) {
      if (e.isPlayer) {
        if (e.vehicle) this.drawVehicle(ctx, e.vehicle, light, true);
        else this.drawPerson(ctx, e, light, true);
        return;
      }
      if (e.isVehicle) this.drawVehicle(ctx, e, light, false);
      else this.drawPerson(ctx, e, light, false);
    }

    drawPerson(ctx, p, light, isPlayer) {
      const T = C.TILE;
      const x = p.x * T, y = p.y * T;
      const ang = p.angle;
      const walk = p.walkPhase || 0;
      const bob = Math.sin(walk) * 1.6;
      ctx.save();
      ctx.translate(x, y);
      // sombra
      ctx.fillStyle = 'rgba(0,0,0,.32)';
      ctx.beginPath(); ctx.ellipse(1.5, 2, 6.4, 3.6, 0, 0, 6.283); ctx.fill();
      ctx.rotate(ang + Math.PI / 2);
      const isPed = !isPlayer;
      const shirt = isPlayer ? '#4cc9f0' : (p.color || '#d94f4f');
      const pants = isPlayer ? '#1d4a63' : (p.pants || '#2c3444');
      const skin = isPlayer ? '#f0c8a0' : (p.skinTone || '#e0b088');
      const hair = isPlayer ? '#2b2119' : (p.hair || '#2b2119');
      // pernas
      ctx.fillStyle = pants;
      ctx.fillRect(-3.2, 1 + Math.sin(walk) * 1.4, 2.6, 5.4);
      ctx.fillRect(.6, 1 - Math.sin(walk) * 1.4, 2.6, 5.4);
      // braços
      ctx.fillStyle = skin;
      ctx.fillRect(-5.2, -1.4 - Math.sin(walk) * 1.2, 2.2, 4.6);
      ctx.fillRect(3.0, -1.4 + Math.sin(walk) * 1.2, 2.2, 4.6);
      // corpo
      ctx.fillStyle = shirt;
      ctx.beginPath();
      ctx.roundRect(-4.2, -4.6 + bob * .2, 8.4, 7.4, 2.4);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.14)';
      ctx.fillRect(-4.2, -1 + bob * .2, 8.4, 1.2);
      // cabeça
      ctx.fillStyle = skin;
      ctx.beginPath(); ctx.arc(0, -6.4 + bob * .3, 3.5, 0, 6.283); ctx.fill();
      ctx.fillStyle = hair;
      ctx.beginPath(); ctx.arc(0, -7.4 + bob * .3, 3.5, Math.PI * .9, Math.PI * 2.1); ctx.fill();
      // celular
      if (isPed && p.phone) {
        ctx.fillStyle = '#e8f0f8'; ctx.fillRect(2.6, -3.4, 2.2, 3.6);
      }
      ctx.restore();
      // nome de quem está falando/conversando
      if (isPed && p.citizen && this.nearPlayerName && U.dist2(p.x, p.y, this.player.x, this.player.y) < 52) {
        ctx.save();
        ctx.font = '7px monospace'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        const w = ctx.measureText(p.citizen.name).width;
        ctx.fillRect(x - w / 2 - 2, y - 24, w + 4, 9);
        ctx.fillStyle = '#dfe9f2';
        ctx.fillText(p.citizen.name, x, y - 17);
        ctx.restore();
      }
    }

    drawVehicle(ctx, v, light, isPlayer) {
      const T = C.TILE;
      const x = v.x * T, y = v.y * T;
      const w = v.w * T, h = v.h * T;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = 'rgba(0,0,0,.34)';
      ctx.beginPath(); ctx.ellipse(2, 2.5, w * .62, h * .52, v.angle, 0, 6.283); ctx.fill();
      ctx.rotate(v.angle);
      // rodas
      ctx.fillStyle = '#1a1d21';
      const ww = 3.4, wh = h * .19;
      ctx.fillRect(-w / 2 - 1, -h * .34, ww, wh);
      ctx.fillRect(w / 2 - 2.4, -h * .34, ww, wh);
      ctx.fillRect(-w / 2 - 1, h * .18, ww, wh);
      ctx.fillRect(w / 2 - 2.4, h * .18, ww, wh);
      // corpo
      const col = v.crashed ? U.shade(v.color, -.25) : v.color;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, v.type === 'moto' ? 2 : 4.5); ctx.fill();
      // detalhes
      ctx.fillStyle = U.shade(col, -.22);
      ctx.fillRect(-w / 2 + 1.5, -h * .1, w - 3, h * .22);
      // para-brisa / cabine
      ctx.fillStyle = 'rgba(30,44,60,.86)';
      if (v.type === 'moto') {
        ctx.fillRect(-w * .32, -h * .3, w * .64, h * .16);
      } else {
        ctx.beginPath(); ctx.roundRect(-w / 2 + 2, -h * .34, w - 4, h * .2, 2); ctx.fill();
        ctx.beginPath(); ctx.roundRect(-w / 2 + 2, h * .16, w - 4, h * .17, 2); ctx.fill();
      }
      // faixa de táxi / viaturas
      if (v.type === 'taxi') { ctx.fillStyle = '#111'; ctx.fillRect(-w * .3, -2, w * .6, 3.4); }
      if (v.type === 'police') {
        ctx.fillStyle = (this.time || 0) % 1 < .5 ? '#3a7bff' : '#ff3a3a';
        ctx.fillRect(-w * .3, -h * .05, w * .6, 3);
      }
      if (v.type === 'ambulance') { ctx.fillStyle = '#ff4d4d'; ctx.fillRect(-w * .3, -h * .1, w * .6, 3.4); }
      if (v.type === 'bus') { ctx.fillStyle = 'rgba(255,255,255,.25)'; for (let i = -1; i <= 1; i++) ctx.fillRect(-w / 2 + 2, i * h * .26 - 2, 2, h * .18); }
      // faróis e lanternas
      const night = light && light.dark > .3;
      if (v.lights) {
        ctx.fillStyle = 'rgba(255,245,200,.95)';
        ctx.fillRect(-w * .42, -h / 2 - .5, 3.6, 2.4);
        ctx.fillRect(w * .42 - 3.6, -h / 2 - .5, 3.6, 2.4);
      }
      if (v.braking || (isPlayer && v.speed < -.1)) {
        ctx.fillStyle = '#ff3b30';
        ctx.fillRect(-w * .42, h / 2 - 1.6, 3.6, 2);
        ctx.fillRect(w * .42 - 3.6, h / 2 - 1.6, 3.6, 2);
      } else if (v.lights || night) {
        ctx.fillStyle = 'rgba(200,60,50,.75)';
        ctx.fillRect(-w * .42, h / 2 - 1.6, 3.6, 2);
        ctx.fillRect(w * .42 - 3.6, h / 2 - 1.6, 3.6, 2);
      }
      // fumaça de dano
      if (v.damage > 60 && Math.random() < .25) {
        ctx.fillStyle = 'rgba(60,60,60,.4)';
        ctx.beginPath(); ctx.arc(0, -h * .2, 3 + Math.random() * 3, 0, 6.283); ctx.fill();
      }
      ctx.restore();
      // giroflex
      if (v.emergency && v.mission) {
        ctx.save();
        ctx.translate(x, y - h * .2);
        const on = Math.floor((this.time || 0) * 6) % 2 === 0;
        ctx.fillStyle = v.emergency === 'police' ? (on ? '#3a7bff' : '#ff3a3a') : (on ? '#ff4d4d' : '#ffffff');
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, 6.283); ctx.fill();
        ctx.globalAlpha = .3; ctx.beginPath(); ctx.arc(0, 0, 11, 0, 6.283); ctx.fill();
        ctx.restore();
      }
      if (isPlayer) {
        // marcação do jogador
        ctx.strokeStyle = 'rgba(76,201,240,.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(x, y + 2, w * .8, h * .6, v.angle, 0, 6.283); ctx.stroke();
      }
    }

    /* ---------------- interiores: desenho ---------------- */
    drawInterior(ctx, light) {
      const it = this.player.interior, T = 30;
      const cv = this.canvas, R = this.renderer;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, cv.width, cv.height);
      const T2 = T * R.dpr;
      const ox = cv.width / 2 - this.player.x * T2;
      const oy = cv.height / 2 - this.player.y * T2;
      ctx.save();
      ctx.translate(ox, oy);
      for (let y = 0; y < it.h; y++) {
        for (let x = 0; x < it.w; x++) {
          const t = it.tiles[y * it.w + x];
          let col;
          if (t === IT.WALL) col = '#4a515c';
          else if (t === IT.DOOR) col = '#c39a52';
          else col = ((x + y) % 2 === 0) ? '#968f7f' : '#8d8676';
          ctx.fillStyle = col;
          ctx.fillRect(x * T2, y * T2, T2, T2);
          if (t === IT.WALL) {
            ctx.fillStyle = 'rgba(0,0,0,.18)';
            ctx.fillRect(x * T2, y * T2 + T2 - 3 * R.dpr, T2, 3 * R.dpr);
            ctx.fillStyle = 'rgba(255,255,255,.06)';
            ctx.fillRect(x * T2, y * T2, T2, 2 * R.dpr);
          }
        }
      }
      // mobília
      for (const f of it.furn) {
        const px = f.x * T2, py = f.y * T2, pw = f.w * T2, ph = f.h * T2;
        ctx.fillStyle = 'rgba(0,0,0,.25)';
        ctx.fillRect(px + 3, py + 4, pw - 2, ph - 2);
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.roundRect(px, py, pw - 2, ph - 2, 3 * R.dpr);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.35)';
        ctx.lineWidth = 1 * R.dpr;
        ctx.stroke();
        if (f.type === 'prateleira' || f.type === 'estante') {
          ctx.fillStyle = 'rgba(255,255,255,.18)';
          for (let i = 1; i < f.h; i++) ctx.fillRect(px, py + i * T2 - 2, pw - 2, 2);
        }
        if (f.type === 'cama' || f.type === 'cama_hotel') {
          ctx.fillStyle = '#f0ece4'; ctx.fillRect(px + 3, py + 3, pw - 8, ph * .35);
        }
        if (f.type === 'tv') { ctx.fillStyle = '#0a0d10'; ctx.fillRect(px + 2, py + 2, pw - 6, ph - 6); }
      }
      // rótulos de salas
      ctx.font = 'bold ' + (12 * R.dpr | 0) + 'px monospace';
      ctx.textAlign = 'center';
      for (const r of it.rooms) {
        ctx.fillStyle = 'rgba(255,255,255,.14)';
        ctx.fillText(r.name.replace(/_/g, ' ').toUpperCase(), (r.x0 + r.x1) / 2 * T2, (r.y0 + r.y1) / 2 * T2 - T2);
        ctx.fillStyle = 'rgba(0,0,0,.32)';
        ctx.fillText(r.name.replace(/_/g, ' ').toUpperCase(), (r.x0 + r.x1) / 2 * T2 + 1, (r.y0 + r.y1) / 2 * T2 - T2 + 1);
      }
      // marcadores de interação
      this.time = this.time || 0;
      this.time += 1 / 60;
      for (const sp of this.interiorSpots || []) {
        const d = U.dist(this.player.x, this.player.y, sp.x + .5, sp.y + .5);
        if (d > 6) continue;
        const pulse = 1 + Math.sin(this.time * 4) * .18;
        ctx.strokeStyle = 'rgba(255,210,63,' + (d < 2.2 ? .95 : .4) + ')';
        ctx.lineWidth = 2 * R.dpr;
        ctx.beginPath();
        ctx.arc((sp.x + .5) * T2, (sp.y + .5) * T2, 9 * R.dpr * pulse, 0, 6.283);
        ctx.stroke();
        if (d < 2.2) {
          ctx.fillStyle = 'rgba(255,210,63,.9)';
          ctx.font = 'bold ' + (11 * R.dpr | 0) + 'px monospace';
          ctx.fillText('[E]', (sp.x + .5) * T2, (sp.y + .5) * T2 - 14 * R.dpr);
        }
      }
      // funcionários dentro
      for (const n of this.interiorNpcs || []) {
        ctx.fillStyle = 'rgba(0,0,0,.3)';
        ctx.beginPath(); ctx.ellipse(n.x * T2 + 2, n.y * T2 + 3, 9 * R.dpr, 5 * R.dpr, 0, 0, 6.283); ctx.fill();
        drawIndoorPerson(ctx, n.x, n.y, T2, n, this.time);
        if (n.citizen && U.dist(this.player.x, this.player.y, n.x, n.y) < 6) {
          ctx.fillStyle = 'rgba(0,0,0,.6)';
          ctx.font = 'bold ' + (10 * R.dpr | 0) + 'px monospace'; ctx.textAlign = 'center';
          const w = ctx.measureText(n.name).width;
          ctx.fillRect(n.x * T2 - w / 2 - 3, n.y * T2 - 34 * R.dpr, w + 6, 13 * R.dpr);
          ctx.fillStyle = '#dfe9f2';
          ctx.fillText(n.name, n.x * T2, n.y * T2 - 24 * R.dpr);
        }
      }
      // jogador
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.beginPath(); ctx.ellipse(this.player.x * T2 + 2, this.player.y * T2 + 3, 9 * R.dpr, 5 * R.dpr, 0, 0, 6.283); ctx.fill();
      drawIndoorPerson(ctx, this.player.x, this.player.y, T2, { color: '#4cc9f0', hair: '#2b2119', angle: this.player.angle, skinTone: '#f0c8a0' }, this.time, true);
      // luzes de teto (poças de luz quente, em coordenadas do mundo)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let lx = 3; lx < it.w; lx += 6) {
        for (let ly = 3; ly < it.h; ly += 6) {
          const px = lx * T2, py = ly * T2;
          const g2 = ctx.createRadialGradient(px, py, 0, px, py, 110 * R.dpr);
          g2.addColorStop(0, 'rgba(255,238,200,.08)');
          g2.addColorStop(1, 'rgba(255,238,200,0)');
          ctx.fillStyle = g2;
          ctx.beginPath(); ctx.arc(px, py, 110 * R.dpr, 0, 6.283); ctx.fill();
        }
      }
      ctx.restore();
      ctx.restore();
      // vinheta
      const g = ctx.createRadialGradient(cv.width / 2, cv.height / 2, cv.height * .25, cv.width / 2, cv.height / 2, cv.height * .85);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,.55)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cv.width, cv.height);
      // informa o prédio
      ctx.font = 'bold ' + (14 * R.dpr | 0) + 'px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.fillText(this.player.indoor.name.toUpperCase(), cv.width / 2, 30 * R.dpr);
    }
  };

  function drawIndoorPerson(ctx, x, y, T, a, time, isPlayer) {
    const px = x * T, py = y * T;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate((a.angle || 0) + Math.PI / 2);
    ctx.fillStyle = a.color || '#d94f4f';
    ctx.beginPath(); ctx.roundRect(-7, -9, 14, 14, 4); ctx.fill();
    ctx.fillStyle = a.skinTone || '#e0b088';
    ctx.beginPath(); ctx.arc(0, -11, 5.6, 0, 6.283); ctx.fill();
    ctx.fillStyle = a.hair || '#2b2119';
    ctx.beginPath(); ctx.arc(0, -12.6, 5.6, Math.PI * .85, Math.PI * 2.15); ctx.fill();
    ctx.restore();
    if (isPlayer) {
      ctx.strokeStyle = 'rgba(76,201,240,.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px, py, 13, 0, 6.283); ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.font = '9px monospace'; ctx.textAlign = 'center';
      ctx.fillText('💤', px, py - 18);
    }
  }
})();
