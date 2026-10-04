'use strict';
/* ============================================================
   game.js — núcleo: loop, input, jogador a pé, interações,
   crimes/procurado, dia-noite, partículas, salvamento.
   ============================================================ */
const cv = typeof document !== 'undefined' ? document.getElementById('cv') : null;
const ctx = cv ? cv.getContext('2d') : null;

const GAME = {
  clock: 0, money: 0, wanted: 0, free: false,
  crimeCd: {}, calm: 0, bustedAcc: 0,
  player: { x: 0, y: 0, angle: 0, hp: 100, vest: 0, punch: 0 },
  inCar: false, car: null, playerCar: null,
  parked: [], sale: [], garage: [], skids: [], parts: [],
  overlayT: 0, saveT: 0, radioName: '',
  cam: { x: 0, y: 0 },

  init() {
    this.load();
    const g = WORLD.zones.find(z => z.name === 'GARAGEM');
    this.player.x = (g.x0 + g.x1) / 2; this.player.y = g.y1 - 10;
    this.playerCar = new Car(WORLD.VXC[0] - 32, (WORLD.HY[0] + 5) * T, Math.PI / 2, 'coupe', '#c22e2e');
    this.playerCar.driver = null;
    this.parked.push(this.playerCar);
    // carros à venda no AUTO LOTE
    this.sale = [
      { car: new Car(36 * T, 12 * T, 0, 'sedan', '#3f6fb5'), price: 800, sold: false },
      { car: new Car(38 * T, 13 * T, 0, 'coupe', '#7a4fa0'), price: 1200, sold: false },
    ];
    this.npcs = [
      { x: WORLD.phones[0].x + 20, y: WORLD.phones[0].y, name: 'Chefe', lines: ['Bem-vindo à cidade, novato! Atenda os orelhões amarelos pra ganhar uma grana.', 'Dizem que eu sou o "chefe". Só digo uma coisa: não amassa meu carro.'] },
      { x: WORLD.zones.find(z => z.name === 'OFICINA').x1 - 10, y: WORLD.zones.find(z => z.name === 'OFICINA').y1 - 10, name: 'Mecânico', lines: ['OFICINA: entra de carro e aperta E — conserto, pintura e a polícia esquece de você. $100.', 'Pneu cantou, eu ouvi. Dirige direito, menino!'] },
      { x: 37 * T, y: 11 * T, name: 'Vendedor', lines: ['Tenho sedã azul por $800 e um cupê roxo por $1200! Aperta E do lado pra comprar.', 'Carro comprado fica guardado na sua GARAGEM.'] },
      { x: PLAZA.x + 30, y: PLAZA.y + 20, name: 'Taxista', lines: ['A praça é minha, viu? Mas se um dia quiser dirigir um táxi... o volante chama.', 'Corre que tem passageiro esperando na PRAÇA!'] },
    ];
    AI.init();
    this.cam.x = this.player.x - 400; this.cam.y = this.player.y - 300;
  },

  /* ---------------- salvar / carregar ---------------- */
  save() {
    try {
      localStorage.setItem('ruaVermelha', JSON.stringify({
        money: this.money, done: M.done, vest: this.player.vest, free: this.free,
        garage: this.garage
      }));
    } catch (e) { }
  },
  load() {
    try {
      const s = JSON.parse(localStorage.getItem('ruaVermelha'));
      if (s) { this.money = s.money || 0; M.done = s.done || 0; this.player.vest = s.vest || 0; this.free = !!s.free; this.garage = s.garage || []; }
    } catch (e) { }
  },

  /* ---------------- crimes / procurado ---------------- */
  crime(type, n, cd = 4) {
    if (this.crimeCd[type] > 0) return;
    this.crimeCd[type] = cd;
    this.setWanted(this.wanted + n);
  },
  setWanted(n) { this.wanted = Math.max(0, Math.min(5, n)); this.calm = 0; },

  nightF() {
    const p = this.clock % 240;
    if (p < 130) return 0;
    if (p < 150) return (p - 130) / 20;
    if (p < 220) return 1;
    return 1 - (p - 220) / 20;
  },

  allCars() {
    const out = AI.allCars();
    for (const p of this.parked) out.push(p);
    for (const s of this.sale) if (!s.sold) out.push(s.car);
    return out;
  },

  /* ============================ UPDATE ============================ */
  update(dt) {
    this.clock += dt;
    for (const k in this.crimeCd) this.crimeCd[k] -= dt;
    if (this.player.punch > 0) this.player.punch -= dt;

    // ---- jogador ----
    const P = this.player;
    if (this.inCar && this.car) {
      const c = this.car;
      c.throttle = (key('w') || key('arrowup') ? 1 : 0) + (key('s') || key('arrowdown') ? -1 : 0);
      c.steer = (key('d') || key('arrowright') ? 1 : 0) - (key('a') || key('arrowleft') ? 1 : 0);
      c.hand = key(' ');
      c.update(dt);
      P.x = c.x; P.y = c.y;
      // marcas de derrapagem
      if (c.drift > 50 || (c.hand && c.speed > 70)) {
        const f = c.heading();
        this.skids.push({ x: c.x - f.x * c.hl * .8, y: c.y - f.y * c.hl * .8, a: c.angle });
        if (this.skids.length > 500) this.skids.shift();
      }
      AUDIO.engineUpdate(c.speed / c.max, true, c.drift > 50);
      // semáforo vermelho em alta velocidade = crime
      if (c.speed > 180) for (const L of WORLD.lights) {
        if (Math.hypot(L.x - c.x, L.y - c.y) < 56) {
          const vert = Math.abs(c.vy) > Math.abs(c.vx);
          if (!WORLD.lightGreen(vert, this.clock)) this.crime('sinal', 1, 8);
        }
      }
    } else {
      const run = key('shift');
      const sp = run ? 150 : 90;
      let dx = (key('d') || key('arrowright') ? 1 : 0) - (key('a') || key('arrowleft') ? 1 : 0);
      let dy = (key('s') || key('arrowdown') ? 1 : 0) - (key('w') || key('arrowup') ? 1 : 0);
      const l = Math.hypot(dx, dy);
      if (l > 0) {
        dx /= l; dy /= l; P.angle = Math.atan2(dy, dx);
        const nx = P.x + dx * sp * dt, ny = P.y + dy * sp * dt;
        if (!WORLD.solidAt(nx, P.y)) P.x = nx;
        if (!WORLD.solidAt(P.x, ny)) P.y = ny;
      }
      AUDIO.engineUpdate(0, false, false);
    }

    // ---- IA ----
    const S = this.state();
    AI.update(dt, S);

    // ---- colisões entre carros e com o jogador a pé ----
    const cars = this.allCars();
    if (this.inCar) cars.push(this.car);
    for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i], b = cars[j];
      if (a.wreck && b.wreck) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = a.hw + b.hw + 6;
      if (d < min && d > 0.01) {
        const push = (min - d) / 2, nx = dx / d, ny = dy / d;
        if (!a.wreck) { a.x -= nx * push; a.y -= ny * push; }
        if (!b.wreck) { b.x += nx * push; b.y += ny * push; }
        const rel = Math.hypot(a.vx - b.vx, a.vy - b.vy);
        if (rel > 90) {
          AUDIO.crash(rel);
          a.damage(rel / 26); b.damage(rel / 26);
          if (a === this.car || b === this.car) {
            const o = a === this.car ? b : a;
            if (o.kind === 'police') this.crime('pol', 1, 3);
            M.onFootDamage(this.car, 1);
          }
          if (a.driver === 'ai' && b.driver === 'ai' && rel > 160) { a.driver = null; b.driver = null; } // batida forte: tráfico para
        }
      }
    }
    // carros x pedestres x jogador a pé
    for (const c of cars) {
      if (c.wreck || c.speed < 60) continue;
      for (const p of AI.peds) if (p.down <= 0 && Math.hypot(p.x - c.x, p.y - c.y) < 16) AI.hitPed(p, c.driver === 'player');
      if (!this.inCar && Math.hypot(P.x - c.x, P.y - c.y) < 18) {
        this.hurt(35); P.x += (P.x - c.x); P.y += (P.y - c.y);
      }
    }

    // ---- fogo / explosão ----
    for (const c of cars) {
      if (c.fire && !c.boomed) {
        c.boomed = true; AUDIO.boom();
        for (let k = 0; k < 26; k++) this.parts.push({ x: c.x, y: c.y, vx: (Math.random() - .5) * 220, vy: (Math.random() - .5) * 220, r: 4 + Math.random() * 10, t: .7, kind: 'boom' });
        for (const o of cars) if (o !== c && Math.hypot(o.x - c.x, o.y - c.y) < 85) o.damage(45);
        for (const p of AI.peds) if (Math.hypot(p.x - c.x, p.y - c.y) < 70) AI.hitPed(p, false);
        if (!this.inCar && Math.hypot(P.x - c.x, P.y - c.y) < 85) this.hurt(60);
        if (this.inCar && this.car !== c && Math.hypot(P.x - c.x, P.y - c.y) < 85) this.car.damage(45);
      }
      if (c.wreck && c.fire && Math.random() < .3) this.parts.push({ x: c.x + (Math.random() - .5) * 14, y: c.y + (Math.random() - .5) * 14, vx: 0, vy: -30, r: 5, t: .8, kind: 'smoke' });
    }
    // partículas
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t <= 0) this.parts.splice(i, 1);
    }

    // ---- procurado: decaimento, prisão ----
    if (this.wanted > 0) {
      this.calm += dt;
      if (this.calm > 14) { this.calm = 8; this.setWantedKeep(this.wanted - 1); }
      let nearCop = 1e9;
      for (const c of AI.cops) nearCop = Math.min(nearCop, Math.hypot(c.x - P.x, c.y - P.y));
      const stuck = this.inCar ? this.car.speed < 30 : true;
      if (nearCop < (this.inCar ? 46 : 60) && stuck) this.bustedAcc += dt; else this.bustedAcc = 0;
      if (this.bustedAcc > 2) this.busted();
    } else this.bustedAcc = 0;
    AUDIO.sirenUpdate(this.wanted > 0 && AI.cops.some(c => Math.hypot(c.x - P.x, c.y - P.y) < 420));

    // ---- missões ----
    M.update(dt, S);

    // ---- câmera suave ----
    const tx = P.x - 400, ty = P.y - 300;
    this.cam.x += (tx - this.cam.x) * Math.min(1, 5 * dt);
    this.cam.y += (ty - this.cam.y) * Math.min(1, 5 * dt);

    // ---- salvar periódico ----
    this.saveT += dt; if (this.saveT > 10) { this.saveT = 0; this.save(); }
  },
  setWantedKeep(n) { this.wanted = Math.max(0, n); },

  state() {
    const P = this.player;
    return {
      px: P.x, py: P.y, pvx: this.inCar ? this.car.vx : 0, pvy: this.inCar ? this.car.vy : 0,
      pspeed: this.inCar ? this.car.speed : 0, inCar: this.inCar, car: this.car,
      cars: this.allCars(), clock: this.clock, wanted: this.wanted,
      threat: P.punch > 0 || (this.inCar && this.car.speed > 120)
    };
  },

  hurt(n) {
    const P = this.player;
    if (P.vest > 0) { const a = Math.min(P.vest, n); P.vest -= a; n -= a; }
    P.hp -= n;
    if (P.hp <= 0) this.hospital();
  },
  hospital() {
    const P = this.player;
    P.hp = 100; P.vest = 0;
    this.money = Math.floor(this.money * .85);
    this.dropCar();
    P.x = PLAZA.x; P.y = PLAZA.y + 40;
    HUD.overlay = 'hospital'; this.overlayT = 3;
    this.save();
  },
  busted() {
    const P = this.player;
    this.money = Math.floor(this.money * .9);
    this.setWantedKeep(0); AI.cops = []; AI.blocks = []; this.bustedAcc = 0;
    this.dropCar();
    P.hp = 100;
    P.x = PLAZA.x; P.y = PLAZA.y;
    HUD.overlay = 'busted'; this.overlayT = 3;
    this.save();
  },
  dropCar() {
    if (this.inCar && this.car) { this.car.driver = null; if (!this.parked.includes(this.car)) this.parked.push(this.car); }
    this.inCar = false; this.car = null;
  },

  /* ============================ AÇÕES ============================ */
  interact() {
    const P = this.player;
    if (this.inCar) {
      const c = this.car, z = WORLD.zoneAt(c.x, c.y);
      if (z && z.name === 'OFICINA') {
        if (this.money >= 100) {
          this.money -= 100; c.hp = 100; c.fire = false; c.boomed = false; c.fuel = 100;
          c.color = CAR_COLORS[(CAR_COLORS.indexOf(c.color) + 1 + CAR_COLORS.length) % CAR_COLORS.length];
          this.setWantedKeep(0); AI.cops = [];
          HUD.msg('OFICINA: conserto + pintura nova. A polícia perdeu você de vista! (-$100)', 5); AUDIO.cash();
        } else HUD.msg('O mecânico quer $100 adiantado.', 3);
        return;
      }
      if (z && z.name === 'POSTO') {
        if (c.fuel > 95) HUD.msg('Tanque já está cheio.', 2);
        else if (this.money >= 20) { this.money -= 20; c.fuel = 100; HUD.msg('Tanque cheio! (-$20)', 3); AUDIO.cash(); }
        else HUD.msg('Sem grana pra combustível ($20).', 3);
        return;
      }
      if (z && z.name === 'GARAGEM') {
        this.garage.push({ kind: c.kind, color: c.color, red: c === this.playerCar });
        if (c === this.playerCar) this.parked = this.parked.filter(p => p !== c);
        else this.parked = this.parked.filter(p => p !== c);
        this.inCar = false; this.car = null;
        HUD.msg('Carro guardado na GARAGEM. (E aqui fora pra retirar.)', 4); this.save();
        return;
      }
      // sair do carro
      if (c.speed < 60) {
        const f = c.heading(), side = { x: -f.y, y: f.x };
        for (const s of [1, -1]) {
          const nx = c.x + side.x * 30 * s, ny = c.y + side.y * 30 * s;
          if (!WORLD.solidAt(nx, ny)) { P.x = nx; P.y = ny; break; }
        }
        c.driver = null; c.throttle = 0; c.steer = 0;
        if (!this.parked.includes(c)) this.parked.push(c);
        this.inCar = false; this.car = null;
      }
      return;
    }
    // ------- a pé -------
    for (const ph of WORLD.phones) if (Math.hypot(ph.x - P.x, ph.y - P.y) < 38) {
      if (M.active) HUD.msg('Calma! Já tem missão rolando.', 3);
      else if (M.done < MISSIONS.length) M.start(M.done);
      else HUD.msg('Você já é o REI DA CIDADE. Modo livre!', 4);
      return;
    }
    const z = WORLD.zoneAt(P.x, P.y);
    if (z && z.name === 'GARAGEM') {
      const gcar = this.garage.pop();
      if (gcar) {
        let c;
        if (gcar.red) { c = this.playerCar; c.x = (z.x0 + z.x1) / 2; c.y = z.y1 + 40; c.wreck = false; c.hp = 100; c.fuel = 100; }
        else c = new Car((z.x0 + z.x1) / 2, z.y1 + 40, -Math.PI / 2, gcar.kind, gcar.color);
        if (!this.parked.includes(c)) this.parked.push(c);
        this.enterCar(c);
        HUD.msg('Carro retirado da GARAGEM. Boa volta!', 3);
      } else HUD.msg('GARAGEM vazia. Guarde um carro entrando aqui de carro.', 3);
      return;
    }
    if (z && z.name === 'LOJA') {
      if (P.hp < 100 && this.money >= 30) { this.money -= 30; P.hp = Math.min(100, P.hp + 50); HUD.msg('Lanche reforçado: +vida! (-$30)', 3); AUDIO.cash(); }
      else if (P.vest <= 0 && this.money >= 50) { this.money -= 50; P.vest = 50; HUD.msg('Colete comprado! (-$50)', 3); AUDIO.cash(); }
      else HUD.msg('LOJA: colete $50, lanche $30. Volte de mãos vazias e com grana.', 3);
      return;
    }
    if (z && z.name === 'LOTE') {
      for (const s of this.sale) {
        if (!s.sold && Math.hypot(s.car.x - P.x, s.car.y - P.y) < 50) {
          if (this.money >= s.price) {
            this.money -= s.price; s.sold = true;
            this.garage.push({ kind: s.car.kind, color: s.car.color });
            HUD.msg(`Comprado! Está na sua GARAGEM. (-$${s.price})`, 4); AUDIO.cash(); this.save();
          } else HUD.msg(`Esse belezinha custa $${s.price}.`, 3);
          return;
        }
      }
    }
    for (const n of this.npcs) if (Math.hypot(n.x - P.x, n.y - P.y) < 34) {
      n.li = ((n.li || 0) + 1) % n.lines.length;
      HUD.msg(n.name + ': "' + n.lines[n.li] + '"', 5);
      return;
    }
    // entrar num carro próximo
    let best = null, bd = 46;
    for (const c of this.allCars()) {
      if (c.wreck) continue;
      const d = Math.hypot(c.x - P.x, c.y - P.y);
      if (d < bd) { bd = d; best = c; }
    }
    if (best) this.enterCar(best);
  },
  enterCar(c) {
    const P = this.player;
    const ti = AI.traffic.indexOf(c);
    if (ti >= 0) { // motorista sai correndo assustado
      AI.traffic.splice(ti, 1);
      AI.spawnPed(c.x + 14, c.y); AI.peds[AI.peds.length - 1].flee = 2.5;
      if (AI.peds.some(p => Math.hypot(p.x - c.x, p.y - c.y) < 200)) this.crime('roubo', 1, 3);
      for (const cp of AI.cops) if (Math.hypot(cp.x - c.x, cp.y - c.y) < 200) this.crime('roubo', 1, 3);
    }
    if (c.kind === 'police') this.crime('pol', 2, 3);
    const si = this.parked.indexOf(c); if (si >= 0) this.parked.splice(si, 1);
    c.driver = 'player';
    this.inCar = true; this.car = c;
    M.onEnterCar(c);
    P.x = c.x; P.y = c.y;
  },
  punch() {
    const P = this.player;
    P.punch = .4; AUDIO.punch();
    for (const p of AI.peds) if (Math.hypot(p.x - P.x, p.y - P.y) < 40) p.flee = 1.5;
  },
  horn() {
    if (!this.inCar) return;
    AUDIO.horn(); AI.angryAt(this.car.x, this.car.y);
  },

  /* ============================ DRAW ============================ */
  draw() {
    const cam = this.cam, night = this.nightF();
    WORLD.draw(ctx, cam, this.clock);
    // marcas de pneu
    ctx.strokeStyle = 'rgba(20,20,26,.45)'; ctx.lineWidth = 3;
    for (const s of this.skids) {
      ctx.save(); ctx.translate(s.x - cam.x, s.y - cam.y); ctx.rotate(s.a);
      ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(4, -6); ctx.moveTo(-4, 6); ctx.lineTo(4, 6); ctx.stroke();
      ctx.restore();
    }
    if (night > 0) { ctx.fillStyle = `rgba(8,10,40,${night * .55})`; ctx.fillRect(0, 0, 800, 600); }
    AI.drawPeds(ctx, cam, this.clock);
    // jogador a pé
    if (!this.inCar) this.drawPlayer(ctx, cam);
    // carros
    for (const c of this.allCars()) c.draw(ctx, cam, this.clock, night);
    if (this.inCar && this.car) this.car.draw(ctx, cam, this.clock, night);
    // partículas
    for (const p of this.parts) {
      const px = p.x - cam.x, py = p.y - cam.y;
      if (p.kind === 'boom') { ctx.fillStyle = `rgba(255,${120 + p.t * 150 | 0},40,${p.t})`; ctx.beginPath(); ctx.arc(px, py, p.r * (1.4 - p.t), 0, 7); ctx.fill(); }
      else { ctx.fillStyle = `rgba(90,90,95,${p.t * .6})`; ctx.beginPath(); ctx.arc(px, py, p.r * (1.6 - p.t), 0, 7); ctx.fill(); }
    }
    AI.drawHeli(ctx, cam, this.clock, night);
    // HUD
    HUD.draw(ctx, {
      money: this.money, wanted: this.wanted, hp: this.player.hp, vest: this.player.vest,
      fuel: this.inCar ? this.car.fuel : 0, inCar: this.inCar, radio: this.radioName,
      rank: 'Rank: ' + RANKS[Math.min(M.done, RANKS.length - 1)] + (this.free ? '  ★ MODO LIVRE' : ''),
      target: M.target(), px: this.player.x, py: this.player.y, camx: cam.x, camy: cam.y,
      clock: this.clock, hint: this.hint()
    });
  },
  drawPlayer(ctx, cam) {
    const P = this.player, px = P.x - cam.x, py = P.y - cam.y;
    ctx.save(); ctx.translate(px, py);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 4, 5, 3, 0, 0, 7); ctx.fill();
    ctx.rotate(P.angle + Math.PI / 2);
    ctx.fillStyle = '#c22e2e'; ctx.fillRect(-4, -4, 8, 8);            // camiseta vermelha
    ctx.fillStyle = '#e8c39a'; ctx.beginPath(); ctx.arc(0, -1, 3.4, 0, 7); ctx.fill();
    if (P.punch > 0) { ctx.fillStyle = '#e8c39a'; ctx.fillRect(3, -8, 4, 4); } // soco
    ctx.restore();
  },
  hint() {
    const P = this.player;
    if (this.inCar) {
      const z = WORLD.zoneAt(this.car.x, this.car.y);
      if (z && z.name === 'OFICINA') return 'E: consertar/repintar ($100, zera a polícia)';
      if (z && z.name === 'POSTO') return 'E: abastecer ($20)';
      if (z && z.name === 'GARAGEM') return 'E: guardar o carro';
      return 'E: sair do carro';
    }
    for (const ph of WORLD.phones) if (Math.hypot(ph.x - P.x, ph.y - P.y) < 38) return 'E: atender o orelhão (missões)';
    for (const c of this.allCars()) if (!c.wreck && Math.hypot(c.x - P.x, c.y - P.y) < 46) return 'E: entrar no carro';
    const z = WORLD.zoneAt(P.x, P.y);
    if (z && z.name === 'GARAGEM') return 'E: retirar carro guardado';
    if (z && z.name === 'LOJA') return 'E: comprar colete/lanche';
    if (z && z.name === 'LOTE') return 'E: conversar com o vendedor';
    return '';
  }
};

/* ---------------- input ---------------- */
const KEYS = {};
function key(k) { return !!KEYS[k]; }
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (HUD.overlay === 'start') { HUD.overlay = null; AUDIO.init(); AUDIO.resume(); return; }
    AUDIO.resume();
    if (!KEYS[k]) { // teclas de ação (borda de tecla)
      if (k === 'e' && HUD.overlay == null) GAME.interact();
      if (k === 'h') GAME.horn();
      if (k === 'r' && GAME.inCar) { GAME.radioName = AUDIO.radioToggle(); HUD.msg('Rádio: ' + (GAME.radioName || 'desligado'), 2.5); }
      if (k === ' ' && !GAME.inCar) GAME.punch();
    }
    KEYS[k] = true;
  });
  window.addEventListener('keyup', e => { KEYS[e.key.toLowerCase()] = false; });
}

/* ---------------- loop ---------------- */
GAME.init();
let last = 0;
function frame(ts) {
  const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts;
  if (HUD.overlay === 'start') { /* congelado na tela inicial */ }
  else if (HUD.overlay === 'busted' || HUD.overlay === 'hospital') {
    GAME.overlayT -= dt;
    if (GAME.overlayT <= 0) HUD.overlay = null;
  } else GAME.update(dt);
  HUD.update(dt);
  GAME.draw();
  if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(frame);
}
if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(frame);
