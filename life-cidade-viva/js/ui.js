/* =========================================================================
   LIFE: CIDADE VIVA — ui.js
   HUD, celular, lojas, diálogos, menu, mapa e modo observador.
   ========================================================================= */
(function () {
  'use strict';
  const LIFE = window.LIFE, U = LIFE.Util, D = LIFE.DATA, C = LIFE.CONFIG;

  const $ = (id) => document.getElementById(id);

  const UI = LIFE.UI = {
    game: null,
    el: {},
    init(game) {
      this.game = game;
      game.nearPlayerName = true;
      this.el = {
        hud: $('hud'), clockTime: $('clock-time'), clockDay: $('clock-day'),
        weatherIcon: $('weather-icon'), weatherName: $('weather-name'),
        bars: { hunger: $('bar-hunger'), energy: $('bar-energy'), hygiene: $('bar-hygiene'), fun: $('bar-fun') },
        money: $('money-value'), moneySub: $('money-sub'),
        minimap: $('minimap'), minimapLabel: $('minimap-label'),
        vehicle: $('hud-vehicle'), vhName: $('vh-name'), vhSpeed: $('vh-speed'),
        vhFuel: $('vh-fuel'), vhDmg: $('vh-dmg'), vhHint: $('vh-hint'),
        prompt: $('prompt'), notifs: $('notifs'), news: $('news-text'),
        zone: $('zone-banner'), phone: $('phone'), phoneView: $('phone-view'), phoneClock: $('phone-clock'),
        shop: $('shop'), shopTitle: $('shop-title'), shopSub: $('shop-sub'), shopList: $('shop-list'), shopFoot: $('shop-foot'),
        dialog: $('dialog'), dialogText: $('dialog-text'), dialogOpts: $('dialog-opts'),
        menu: $('menu'), help: $('help'), seed: $('seed-input'), loading: $('menu-loading'), loadingTxt: $('menu-loading-txt')
      };
      this.ctxMinimap = this.el.minimap.getContext('2d');
      this.bindMenu();
      this.bindPhone();
      this.bindShop();
      this.bindSpeed();
      if (LIFE.Save.has()) $('btn-continue').disabled = false;
      LIFE.log('UI pronta');
    },

    /* ---------------- menu ---------------- */
    bindMenu() {
      const g = this.game;
      $('btn-new').onclick = () => this.startGame($('seed-input').value || C.SEED);
      $('btn-continue').onclick = () => {
        this.el.menu.classList.add('hidden');
        $('hud').classList.remove('hidden');
        LIFE.Audio.init(); LIFE.Audio.resume();
        g.continueGame();
      };
      $('btn-spectator').onclick = () => {
        this.startGame(Math.random() * 1e9 | 0, true);
      };
      $('btn-help').onclick = () => this.el.help.classList.remove('hidden');
      $('help-close').onclick = () => this.el.help.classList.add('hidden');
    },
    startGame(seed, spectate) {
      this.el.loading.classList.remove('hidden');
      this.el.loadingTxt.textContent = 'Construindo a cidade…';
      LIFE.Audio.init();
      setTimeout(() => {
        try {
          this.game.newGame(seed);
          if (spectate) { this.game.spectator = true; this.game.renderer.cam.targetZoom = .72; LIFE.log('modo observador'); }
          this.el.menu.classList.add('hidden');
          $('hud').classList.remove('hidden');
          LIFE.Audio.resume();
          this.notify('Semente da cidade: ' + seed, 'info');
        } catch (e) {
          this.el.loadingTxt.textContent = 'Erro: ' + e.message;
          console.error(e);
        }
      }, 60);
    },

    /* ---------------- celular ---------------- */
    bindPhone() {
      const tabs = document.querySelectorAll('#phone-tabs button');
      tabs.forEach((b) => {
        b.onclick = () => {
          tabs.forEach((x) => x.classList.remove('on'));
          b.classList.add('on');
          this.phoneTab = b.dataset.tab;
          this.renderPhone();
        };
      });
      this.phoneTab = 'jobs';
    },
    togglePhone() {
      const p = this.el.phone;
      p.classList.toggle('hidden');
      if (!p.classList.contains('hidden')) this.renderPhone();
    },
    renderPhone() {
      const g = this.game, p = g.player, v = this.el.phoneView;
      if (!p) return;
      switch (this.phoneTab) {
        case 'jobs': {
          let html = '<h3>EMPREGO ATUAL</h3>';
          if (p.job) {
            const j = p.job;
            html += `<div class="row"><div><b>${U.esc(j.prof.name)}</b><small>${U.esc(j.building.name)} · ${U.fmtHHMM(j.shift[0])}–${U.fmtHHMM(j.shift[1])}</small></div>
              <div style="text-align:right"><b style="color:var(--acc2)">${U.fmtMoney(j.hourly)}/h</b><br>
              <button data-act="goto">Ir até lá</button> <button data-act="quit">Sair</button></div></div>`;
          } else {
            html += '<div class="muted">Você está desempregado. Aceite um trabalho abaixo e apareça no local durante o turno para receber.</div>';
          }
          html += '<h3 style="margin-top:14px">BICOS RÁPIDOS</h3>';
          html += `<div class="row"><div><b>Entrega rápida</b><small>Pegue o pacote e leve até o endereço · pagamento na hora</small></div><button data-act="delivery">Aceitar</button></div>`;
          html += `<div class="row"><div><b>Corrida de táxi</b><small>Precisa estar em um veículo</small></div><button data-act="taxi">Aceitar</button></div>`;
          html += '<h3 style="margin-top:14px">VAGAS PERTO DE VOCÊ</h3>';
          this.jobOffers = g.availableJobs();
          for (let i = 0; i < this.jobOffers.length; i++) {
            const o = this.jobOffers[i];
            html += `<div class="row"><div><b>${U.esc(o.prof.name)}</b><small>${U.esc(o.building.name)} · ${(o.dist / 16).toFixed(1)} km · ${U.fmtHHMM(o.shift[0])}–${U.fmtHHMM(o.shift[1])}</small></div>
              <div style="text-align:right"><b style="color:var(--acc2)">${U.fmtMoney(o.hourly)}/h</b><br><button data-job="${i}">Aceitar</button></div></div>`;
          }
          v.innerHTML = html;
          v.querySelectorAll('button[data-act]').forEach((b) => b.onclick = () => {
            const act = b.dataset.act;
            if (act === 'delivery') { g.startDelivery(); this.togglePhone(); }
            if (act === 'taxi') { g.startTaxiRide(); this.togglePhone(); }
            if (act === 'goto' && p.job) { g.setJobTarget(p.job.building.x + p.job.building.w / 2, p.job.building.y + p.job.building.h / 2, 'Emprego'); this.notify('Destino marcado no minimapa.', 'good'); this.togglePhone(); }
            if (act === 'quit') { g.quitJob(); }
          });
          v.querySelectorAll('button[data-job]').forEach((b) => b.onclick = () => {
            const o = this.jobOffers[+b.dataset.job];
            g.acceptJob(o);
            this.togglePhone();
          });
          break;
        }
        case 'map': {
          v.innerHTML = `<h3>MAPA DA CIDADE</h3>
            <div id="phone-map-wrap"><canvas id="phone-map" width="360" height="360"></canvas></div>
            <div class="muted" style="margin-top:8px">Semente: <b>${U.esc(C.SEED)}</b> · ${g.world.W}×${g.world.H} tiles ·
            ${g.world.buildings.length} imóveis · ${g.sim.citizens.length} moradores · ${g.sim.businesses.length} negócios</div>
            <div class="grid2" style="margin-top:8px">`;
          const zones = {};
          for (const d of g.world.districts) zones[d.zone] = (zones[d.zone] || 0) + d.blocks.length;
          for (const z in zones) v.innerHTML += `<div class="stat">${U.esc(D.ZONES[z] ? D.ZONES[z].name : z)}<b>${zones[z]} quadras</b></div>`;
          v.innerHTML += '</div>';
          g.renderer.drawPhoneMap($('phone-map'), g);
          break;
        }
        case 'bank': {
          const s = g.stats;
          v.innerHTML = `<h3>CONTA E FINANÇAS</h3>
            <div class="grid2">
              <div class="stat">Saldo<b>${U.fmtMoney(p.money)}</b></div>
              <div class="stat">Ganhos totais<b>${U.fmtMoney(s.earned)}</b></div>
              <div class="stat">Entregas<b>${s.deliveries}</b></div>
              <div class="stat">Km dirigidos<b>${(s.driven / 16).toFixed(1)} km</b></div>
              <div class="stat">Imóvel<b>${p.house ? U.esc(p.house.name) : '—'}</b></div>
              <div class="stat">Endereço<b>${U.esc(g.world.districtAt(p.x, p.y).hood)}</b></div>
            </div>
            <h3 style="margin-top:12px">CUSTO DE VIDA</h3>
            <div class="muted">
              Conta de casa: R$ 45/dia (débito automático às 8h)<br>
              Refeição na rua: ${U.fmtMoney(g.sim.priceOf('prato', null))}<br>
              Gasolina: ${U.fmtMoney(g.sim.priceOf('gasolina', null))}/L · inflação acumulada: ${(g.sim.market.inflacao * g.clock.day * 100).toFixed(1)}%
            </div>
            <h3 style="margin-top:12px">AÇÕES</h3>
            <div class="row"><div><b>Salvar jogo</b><small>Guarda sua posição, dinheiro e mochila</small></div><button data-act="save">Salvar</button></div>
            <div class="row"><div><b>Alugar kitnet</b><small>Define uma casa para dormir · R$ 800 + R$ 45/dia</small></div><button data-act="rent">Alugar</button></div>`;
          v.querySelectorAll('button[data-act]').forEach((b) => b.onclick = () => {
            if (b.dataset.act === 'save') { g.save(); this.notify('Jogo salvo.', 'good'); }
            if (b.dataset.act === 'rent') {
              if (p.money < 800) return this.notify('Dinheiro insuficiente (R$ 800).', 'bad');
              p.money -= 800;
              p.house = g.world.nearestBuilding(p.x, p.y, (b2) => ['apartment', 'condo', 'house', 'house_big'].includes(b2.kind));
              this.notify('Você alugou um imóvel: ' + p.house.name + '.', 'good');
              g.save(); this.renderPhone();
            }
          });
          break;
        }
        case 'bag': {
          const keys = Object.keys(p.inventory).filter((k) => p.inventory[k] > 0);
          v.innerHTML = '<h3>MOCHILA</h3>';
          if (!keys.length) v.innerHTML += '<div class="muted">Vazia. Compre mantimentos no supermercado.</div>';
          for (const k of keys) {
            const gd = D.GOODS[k] || { name: k, icon: '📦', cat: 'misc' };
            const edible = ['food', 'meal'].includes(gd.cat);
            v.innerHTML += `<div class="row"><div><b>${gd.icon} ${U.esc(gd.name)}</b><small>${p.inventory[k]} un.</small></div>
              ${edible ? `<button data-eat="${k}">Comer</button>` : ''}</div>`;
          }
          v.innerHTML += `<div class="muted" style="margin-top:10px">Dinheiro: <b>${U.fmtMoney(p.money)}</b></div>`;
          v.querySelectorAll('button[data-eat]').forEach((b) => b.onclick = () => {
            const k = b.dataset.eat;
            if (!p.inventory[k]) return;
            p.inventory[k]--;
            const gd = D.GOODS[k];
            p.needs.hunger = U.clamp01(p.needs.hunger - (gd.cat === 'meal' ? .55 : .3));
            p.needs.fun = U.clamp01(p.needs.fun + .05);
            LIFE.Audio.eat();
            this.notify('Você consumiu ' + gd.name + '.', 'good');
            this.renderPhone();
          });
          break;
        }
        case 'stats': {
          v.innerHTML = `<h3>SUA VIDA</h3>
            <div class="grid2">
              <div class="stat">Fome<b>${(100 - p.needs.hunger * 100) | 0}%</b></div>
              <div class="stat">Energia<b>${(p.needs.energy * 100) | 0}%</b></div>
              <div class="stat">Higiene<b>${(p.needs.hygiene * 100) | 0}%</b></div>
              <div class="stat">Humor<b>${(p.needs.fun * 100) | 0}%</b></div>
            </div>
            <h3 style="margin-top:12px">A CIDADE AGORA</h3>
            <div class="grid2">
              <div class="stat">Moradores<b>${g.sim.citizens.length}</b></div>
              <div class="stat">Pessoas na rua<b>${g.sim.agents.length}</b></div>
              <div class="stat">Veículos<b>${g.sim.vehicles.length}</b></div>
              <div class="stat">Eventos ativos<b>${g.sim.events.length}</b></div>
              <div class="stat">Clima<b>${this.weatherName(g.sim.weather.state)}</b></div>
              <div class="stat">Dia<b>${g.clock.day} (${g.clock.dayName})</b></div>
            </div>
            <h3 style="margin-top:12px">SOBRE</h3>
            <div class="muted">LIFE: CIDADE VIVA — protótipo de simulação urbana em mundo aberto.<br>
            Toda a cidade é gerada por semente: ruas, quarteirões, imóveis, moradores e rotinas.</div>`;
          break;
        }
      }
    },

    /* ---------------- loja / posto ---------------- */
    bindShop() {
      $('shop-close').onclick = () => this.closeShop();
    },
    openShop(b) {
      this.shopBuilding = b;
      const g = this.game;
      const biz = b.biz;
      this.shopMode = 'shop';
      this.el.shopTitle.textContent = b.name.toUpperCase();
      this.el.shopSub.textContent = (biz && biz.name ? biz.name + ' · ' : '') + (g.sim.isBizOpen(biz) ? 'ABERTO' : 'FECHADO') + ' · ' + (b.district ? b.district.hood : '');
      this.renderShop();
      this.el.shop.classList.remove('hidden');
    },
    openFuel(b) {
      this.shopBuilding = b;
      this.shopMode = 'fuel';
      this.el.shopTitle.textContent = 'POSTO DE COMBUSTÍVEL';
      this.el.shopSub.textContent = (b.district ? b.district.hood + ' · ' : '') + 'Preços atualizados hoje';
      this.renderShop();
      this.el.shop.classList.remove('hidden');
    },
    closeShop() { this.el.shop.classList.add('hidden'); },
    renderShop() {
      const g = this.game, p = g.player, list = this.el.shopList;
      const b = this.shopBuilding;
      if (this.shopMode === 'fuel') {
        const fuels = ['gasolina', 'etanol', 'diesel'];
        let html = '';
        for (const f of fuels) {
          const pr = g.sim.priceOf(f, b);
          html += `<div class="shop-item"><div class="info"><b>${D.GOODS[f].icon} ${D.GOODS[f].name}</b><small>${U.fmtMoney(pr)} / litro</small></div>
            <div><button class="buy" data-fuel="${f}" data-l="10">+10 L</button> <button class="buy" data-fuel="${f}" data-l="full">Encher</button></div></div>`;
        }
        html += `<div class="shop-item"><div class="info"><b>🛢 Galão de 10 L</b><small>Leva na mochila para emergências · ${U.fmtMoney(g.sim.priceOf('gasolina', b) * 12)}</small></div>
          <button class="buy" data-item="galao">Comprar</button></div>`;
        html += `<div class="shop-item"><div class="info"><b>🔧 Lavagem e revisão</b><small>Reduz desgaste do veículo · R$ 180</small></div>
          <button class="buy" data-repair="1">Pagar</button></div>`;
        list.innerHTML = html;
        list.querySelectorAll('button[data-fuel]').forEach((btn) => btn.onclick = () => {
          const v = p.vehicle;
          if (!v) return this.notify('Você não está em um veículo.', 'bad');
          const litres = btn.dataset.l === 'full' ? (v.maxFuel - v.fuel) : 10;
          if (litres <= .01) return this.notify('O tanque já está cheio.', 'info');
          const cost = litres * g.sim.priceOf(btn.dataset.fuel, b) * (btn.dataset.fuel === 'gasolina' ? 1 : 1);
          if (p.money < cost) return this.notify('Dinheiro insuficiente (' + U.fmtMoney(cost) + ').', 'bad');
          p.money -= cost;
          v.fuel = Math.min(v.maxFuel, v.fuel + litres);
          if (btn.dataset.fuel === 'etanol') v.fuel *= .95;
          LIFE.Audio.cash();
          this.notify('Abastecido: +' + litres.toFixed(1) + ' L por ' + U.fmtMoney(cost), 'money');
          this.renderShop();
        });
        list.querySelectorAll('button[data-item]').forEach((btn) => btn.onclick = () => {
          const cost = g.sim.priceOf('gasolina', b) * 12;
          if (p.money < cost) return this.notify('Dinheiro insuficiente.', 'bad');
          p.money -= cost; p.inventory.galao = (p.inventory.galao || 0) + 1;
          LIFE.Audio.cash(); this.notify('Galão comprado.', 'money'); this.renderShop();
        });
        list.querySelectorAll('button[data-repair]').forEach((btn) => btn.onclick = () => {
          const v = p.vehicle; if (!v) return this.notify('Você não está em um veículo.', 'bad');
          if (p.money < 180) return this.notify('Dinheiro insuficiente.', 'bad');
          p.money -= 180; v.damage = Math.max(0, v.damage - 60); v.maxSpeed = (LIFE.VEHICLE_TYPES[v.type] || LIFE.VEHICLE_TYPES.car).speed[1] * (1 - v.damage / 260);
          LIFE.Audio.cash(); this.notify('Veículo revisado.', 'good'); this.renderShop();
        });
      } else {
        const biz = b.biz;
        if (!biz || !biz.goods.length) { list.innerHTML = '<div class="muted">Nada à venda aqui.</div>'; return; }
        let html = '';
        for (const it of biz.goods) {
          const gd = D.GOODS[it.id];
          const price = g.sim.buyPrice(it.id, b);
          const can = p.money >= price && it.stock > 0;
          html += `<div class="shop-item"><div class="info"><b>${gd.icon} ${U.esc(gd.name)}</b>
            <small>${U.fmtMoney(price)} · estoque: ${it.stock}${it.stock === 0 ? ' (esgotado!)' : ''}${gd.cat === 'meal' ? ' · refeição' : ''}</small></div>
            <button class="buy" data-buy="${it.id}" ${can ? '' : 'disabled'}>Comprar</button></div>`;
        }
        list.innerHTML = html;
        this.el.shopFoot.innerHTML = `<span>Dinheiro: ${U.fmtMoney(p.money)}</span><span>${biz.name}</span>`;
        list.querySelectorAll('button[data-buy]').forEach((btn) => btn.onclick = () => this.buy(btn.dataset.buy));
      }
    },
    buy(goodId) {
      const g = this.game, p = g.player, b = this.shopBuilding;
      const it = b.biz && b.biz.goods.find((x) => x.id === goodId);
      const price = g.sim.buyPrice(goodId, b);
      if (p.money < price) return this.notify('Dinheiro insuficiente.', 'bad');
      if (it && it.stock <= 0) return this.notify('Produto esgotado — o repositor foi chamado.', 'bad');
      p.money -= price;
      if (it) { it.stock--; it.sold++; b.biz.revenue += price; }
      p.inventory[goodId] = (p.inventory[goodId] || 0) + 1;
      const gd = D.GOODS[goodId];
      LIFE.Audio.cash();
      this.notify('Comprou ' + gd.name + ' por ' + U.fmtMoney(price), 'money');
      // come na hora se for refeição
      if (gd.cat === 'meal') {
        p.inventory[goodId]--;
        p.needs.hunger = U.clamp01(p.needs.hunger - .6);
        p.needs.fun = U.clamp01(p.needs.fun + .08);
        LIFE.Audio.eat();
        this.notify('Você fez uma refeição aqui.', 'good');
      }
      this.renderShop();
    },

    /* ---------------- diálogos / avisos ---------------- */
    dialog(html, options, onOpen) {
      const d = this.el.dialog;
      this.el.dialogText.innerHTML = html;
      this.el.dialogOpts.innerHTML = '';
      for (const o of options) {
        const b = document.createElement('button');
        b.textContent = o.label;
        b.onclick = () => { this.el.dialog.classList.add('hidden'); o.fn && o.fn(); };
        this.el.dialogOpts.appendChild(b);
      }
      const close = document.createElement('button');
      close.textContent = 'Tchau';
      close.onclick = () => this.el.dialog.classList.add('hidden');
      this.el.dialogOpts.appendChild(close);
      d.classList.remove('hidden');
      if (onOpen) onOpen();
    },
    notify(text, type) {
      const n = this.el.notifs;
      if (!n) return;
      const div = document.createElement('div');
      div.className = 'notif ' + (type || 'info');
      div.textContent = text;
      n.appendChild(div);
      if (n.children.length > 5) n.removeChild(n.firstChild);
      setTimeout(() => { div.style.opacity = '0'; div.style.transition = 'opacity .6s'; setTimeout(() => div.remove(), 700); }, 4200);
    },
    showZone(name, hood) {
      const z = this.el.zone;
      z.textContent = hood ? name + ' · ' + hood : name;
      z.classList.add('show');
      clearTimeout(this._zt);
      this._zt = setTimeout(() => z.classList.remove('show'), 2600);
    },
    fadeSleep(cb) {
      const ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;background:#04070c;opacity:0;transition:opacity 1.1s;z-index:60;pointer-events:none;display:flex;align-items:center;justify-content:center;color:#9db0c2;font-family:monospace';
      ov.innerHTML = '<div style="font-size:15px">Você está dormindo…</div>';
      document.body.appendChild(ov);
      requestAnimationFrame(() => ov.style.opacity = '1');
      setTimeout(() => {
        cb();
        ov.style.opacity = '0';
        setTimeout(() => ov.remove(), 1200);
      }, 1200);
    },

    weatherName(state) {
      return ({ clear: 'Céu limpo', partly: 'Parcialmente nublado', cloudy: 'Nublado', rain: 'Chuva', storm: 'Tempestade', fog: 'Neblina' })[state] || state;
    },
    weatherIcon(state) {
      return ({ clear: '☀', partly: '🌤', cloudy: '☁', rain: '🌧', storm: '⛈', fog: '🌫' })[state] || '☀';
    },

    /* ---------------- velocidade / câmera ---------------- */
    bindSpeed() {
      document.querySelectorAll('#speed-controls button[data-speed]').forEach((b) => {
        b.onclick = () => {
          const s = +b.dataset.speed;
          this.game.clock.speed = s;
          this.game.paused = (s === 0);
          document.querySelectorAll('#speed-controls button[data-speed]').forEach((x) => x.classList.remove('on'));
          b.classList.add('on');
        };
      });
      $('btn-camera').onclick = () => {
        const g = this.game;
        g.spectator = !g.spectator;
        this.notify(g.spectator ? 'Modo observador: a câmera acompanha moradores da cidade.' : 'Modo jogador.', 'info');
        g.renderer.cam.targetZoom = g.spectator ? .78 : 1.18;
        $('btn-camera').classList.toggle('on', g.spectator);
      };
    },

    updateMapLabel(g) {
      if (!this.el.minimapLabel) return;
      const d = g.world.districtAt(g.player.x, g.player.y);
      this.el.minimapLabel.textContent = d ? d.hood : 'Cidade';
    },

    /* ---------------- HUD por quadro ---------------- */
    updateHUD(g, dt) {
      const p = g.player;
      if (!p) return;
      const c = g.clock, w = g.sim.weather;
      this.el.clockTime.textContent = U.fmtHHMM(c.min);
      this.el.clockDay.textContent = c.dayName + ' · Dia ' + c.day;
      this.el.weatherIcon.textContent = this.weatherIcon(w.state);
      this.el.weatherName.textContent = this.weatherName(w.state);
      const set = (k, v, invert) => {
        const bar = this.el.bars[k];
        if (!bar) return;
        const val = invert ? 1 - v : v;
        bar.style.width = (val * 100).toFixed(0) + '%';
        bar.style.background = val > .6 ? 'var(--acc2)' : val > .3 ? '#ffd23f' : 'var(--bad)';
      };
      set('hunger', p.needs.hunger, true);
      set('energy', p.needs.energy);
      set('hygiene', p.needs.hygiene);
      set('fun', p.needs.fun);
      this.el.money.textContent = U.fmtMoney(p.money);
      this.el.moneySub.textContent = p.job ? p.job.prof.name + ' · ' + p.job.building.name : (p.vehicle ? 'Dirigindo' : 'Sem emprego');

      // veículo
      if (p.vehicle) {
        this.el.vehicle.classList.remove('hidden');
        this.el.vhName.textContent = g.vehicleLabel(p.vehicle);
        this.el.vhSpeed.textContent = Math.abs(p.vehicle.speed * 3.6 * 4).toFixed(0) + ' km/h';
        this.el.vhFuel.style.width = (p.vehicle.fuel / p.vehicle.maxFuel * 100).toFixed(0) + '%';
        this.el.vhFuel.style.background = p.vehicle.fuel / p.vehicle.maxFuel > .25 ? 'var(--org)' : 'var(--bad)';
        this.el.vhDmg.style.width = p.vehicle.damage.toFixed(0) + '%';
        this.el.vhDmg.style.background = p.vehicle.damage > 60 ? 'var(--bad)' : 'var(--acc2)';
        this.el.vhHint.textContent = 'E sair · L faróis · H buzina';
      } else this.el.vehicle.classList.add('hidden');

      // prompt
      if (p.prompt) {
        this.el.prompt.classList.remove('hidden');
        this.el.prompt.innerHTML = '<b>[' + p.prompt.key + ']</b> ' + U.esc(p.prompt.text);
      } else this.el.prompt.classList.add('hidden');

      // notícias
      if (this.newsIdx === undefined) this.newsIdx = 0;
      this.newsTimer = (this.newsTimer || 0) - dt;
      if (this.newsTimer <= 0 && g.sim.news.length) {
        this.newsTimer = 14;
        this.newsIdx = (this.newsIdx + 1) % g.sim.news.length;
        this.el.news.textContent = g.sim.news[this.newsIdx].text;
      }

      // minimapa
      this.mmTimer = (this.mmTimer || 0) - dt;
      if (this.mmTimer <= 0) { this.mmTimer = .08; g.renderer.drawMinimap(this.ctxMinimap, g); }

      // teclas globais
      if (LIFE.Input.justPressed('tab')) this.togglePhone();
      if (LIFE.Input.justPressed('escape')) {
        if (!this.el.shop.classList.contains('hidden')) this.closeShop();
        else if (!this.el.phone.classList.contains('hidden')) this.togglePhone();
        else if (!this.el.dialog.classList.contains('hidden')) this.el.dialog.classList.add('hidden');
      }
      if (!this.el.phone.classList.contains('hidden')) {
        this.el.phoneClock.textContent = U.fmtHHMM(c.min);
        // atualiza o mapa do celular de vez em quando
        if (this.phoneTab === 'map') {
          this.phoneMapTimer = (this.phoneMapTimer || 0) - dt;
          if (this.phoneMapTimer <= 0 && $('phone-map')) { this.phoneMapTimer = 1.5; g.renderer.drawPhoneMap($('phone-map'), g); }
        }
      }
      // modo observador: câmera segue um morador
      if (g.spectator) {
        this.specTimer = (this.specTimer || 0) - dt;
        if (this.specTimer <= 0 || !g.specTarget || g.specTarget.dead) {
          this.specTimer = 12;
          const list = g.sim.agents.filter((a) => !a.dead && !a.inside);
          g.specTarget = list.length ? list[(Math.random() * list.length) | 0] : null;
        }
        if (g.specTarget) {
          g.renderer.cam.x = U.lerp(g.renderer.cam.x, g.specTarget.x, Math.min(1, dt * 1.5));
          g.renderer.cam.y = U.lerp(g.renderer.cam.y, g.specTarget.y, Math.min(1, dt * 1.5));
        }
      }
    }
  };

  /* ---------------- seta de destino desenhada sobre o mundo ---------------- */
  LIFE.Game.prototype.drawForeground = function (ctx, light) {
    const g = this, p = g.player;
    if (g.jobTarget) {
      const t = g.jobTarget;
      const T = C.TILE;
      const pulse = 1 + Math.sin((g.time || 0) * 4) * .15;
      ctx.save();
      ctx.translate(t.x * T, t.y * T);
      ctx.strokeStyle = 'rgba(255,210,63,.9)';
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(0, 0, 14 * pulse, 0, 6.283); ctx.stroke();
      ctx.fillStyle = 'rgba(255,210,63,.18)';
      ctx.beginPath(); ctx.arc(0, 0, 14 * pulse, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#ffd23f';
      ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
      ctx.fillText(g.jobTargetKind || 'Destino', 0, -20);
      ctx.restore();
    }
    // etiqueta do bairro atual
    if (p.zoneTag !== g.zoneName) { p.zoneTag = g.zoneName; }
    // marcador do veículo do jogador quando está dentro dele
    if (p.vehicle) {
      const T = C.TILE;
      ctx.save();
      ctx.strokeStyle = 'rgba(76,201,240,.5)';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(p.vehicle.x * T, p.vehicle.y * T, 18, 0, 6.283); ctx.stroke();
      ctx.restore();
    }
  };

  /* cria a instância global do jogo */
  window.addEventListener('DOMContentLoaded', () => {
    LIFE.game = new LIFE.Game();
    LIFE.UI.init(LIFE.game);
    LIFE.Input.init(LIFE.game.canvas);
    document.addEventListener('click', () => LIFE.Audio.resume(), { once: true });
    document.addEventListener('keydown', () => LIFE.Audio.resume(), { once: true });
  });
})();
