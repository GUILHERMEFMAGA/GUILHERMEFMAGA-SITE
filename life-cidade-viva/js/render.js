/* =========================================================================
   LIFE: CIDADE VIVA — render.js
   Câmera, desenho do mundo, ciclo dia/noite, clima e iluminação urbana.
   ========================================================================= */
(function () {
  'use strict';
  const LIFE = window.LIFE, U = LIFE.Util, C = LIFE.CONFIG, TT = LIFE.TT, IT = LIFE.IT;

  LIFE.Renderer = class Renderer {
    constructor(canvas, world) {
      this.cv = canvas;
      this.ctx = canvas.getContext('2d');
      this.world = world;
      this.cam = { x: world.W / 2, y: world.H / 2, zoom: 1.18, targetZoom: 1.18, shake: 0, free: false };
      this.rainDrops = [];
      this.fog = 0;
      this.flash = 0;
      this.t = 0;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
    resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const scale = this.renderScale || 1;      // qualidade adaptativa
      this.cv.width = Math.floor(window.innerWidth * dpr * scale);
      this.cv.height = Math.floor(window.innerHeight * dpr * scale);
      this.dpr = dpr * scale;
      this.vw = this.cv.width; this.vh = this.cv.height;
      this.rainDrops.length = 0;
    }
    get tile() { return C.TILE * this.cam.zoom * this.dpr; }

    // ---------------- conversões ----------------
    screenToWorld(sx, sy) {
      const T = this.tile, cx = this.vw / 2, cy = this.vh / 2;
      return { x: this.cam.x + (sx * this.dpr - cx) / T, y: this.cam.y + (sy * this.dpr - cy) / T };
    }
    worldToScreen(wx, wy) {
      const T = this.tile, cx = this.vw / 2, cy = this.vh / 2;
      return { x: (wx - this.cam.x) * T + cx, y: (wy - this.cam.y) * T + cy };
    }
    viewRect(pad) {
      const T = this.tile;
      const hw = this.vw / 2 / T, hh = this.vh / 2 / T;
      pad = pad || 3;
      return { x0: this.cam.x - hw - pad, y0: this.cam.y - hh - pad, x1: this.cam.x + hw + pad, y1: this.cam.y + hh + pad };
    }

    // ---------------- iluminação conforme hora ----------------
    lighting(clock, weather) {
      const h = clock.hour + clock.mm / 60;
      // curvas de luz ambiente
      let dark = 0;
      if (h < 5) dark = 1;
      else if (h < 7) dark = 1 - (h - 5) / 2;
      else if (h < 17.5) dark = 0;
      else if (h < 20) dark = (h - 17.5) / 2.5;
      else dark = 1;
      const cloudy = weather ? weather.cloud : 0;
      const rain = weather ? weather.rain : 0;
      dark = U.clamp01(dark + cloudy * .18 + rain * .12);
      // tinta do céu
      let tint = '#ffffff', tintA = 0;
      if (h >= 5 && h < 7.5) { tint = '#ff9a5a'; tintA = .22 * (1 - Math.abs(h - 6.2) / 1.5); }
      else if (h >= 16.5 && h < 19.5) { tint = '#ff8a4a'; tintA = .28 * (1 - Math.abs(h - 18) / 1.6); }
      return { dark, tint, tintA: Math.max(0, tintA), night: dark > .45 };
    }

    /* qualidade adaptativa: mantém o jogo suave em máquinas fracas */
    adaptQuality(dt) {
      this._ft = this._ft || [];
      this._ft.push(dt);
      if (this._ft.length < 90) return;
      const avg = this._ft.reduce((a, b) => a + b, 0) / this._ft.length;
      this._ft.length = 0;
      const scale = this.renderScale || 1;
      if (avg > .032 && scale > .6) { this.renderScale = Math.max(.6, scale - .12); this.resize(); }
      else if (avg < .015 && scale < 1) { this.renderScale = Math.min(1, scale + .08); this.resize(); }
    }

    // ---------------- quadro principal ----------------
    frame(game) {
      const ctx = this.ctx, w = this.world;
      this.t += 1 / 60;
      if (game._frameDt) this.adaptQuality(game._frameDt);
      const view = this.viewRect();
      const T = this.tile;
      const light = game.light || this.lighting(game.clock, game.weather);

      // tremor de câmera
      let ox = 0, oy = 0;
      if (this.cam.shake > 0) {
        ox = (Math.random() - .5) * this.cam.shake; oy = (Math.random() - .5) * this.cam.shake;
        this.cam.shake *= .9;
        if (this.cam.shake < .2) this.cam.shake = 0;
      }
      const camX = this.cam.x + ox, camY = this.cam.y + oy;
      const z = U.lerp(this.cam.zoom, this.cam.targetZoom, .08); this.cam.zoom = z;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#123043';   // oceano ao redor do mapa
      ctx.fillRect(0, 0, this.vw, this.vh);

      const originX = (0 - camX) * T + this.vw / 2;
      const originY = (0 - camY) * T + this.vh / 2;
      ctx.save();
      ctx.translate(originX, originY);
      ctx.scale(T / C.TILE, T / C.TILE);

      // 1. chão
      const gx = Math.max(0, view.x0) * C.TILE, gy = Math.max(0, view.y0) * C.TILE;
      const gw = Math.min(w.W, view.x1) * C.TILE - gx, gh = Math.min(w.H, view.y1) * C.TILE - gy;
      if (gw > 0 && gh > 0) ctx.drawImage(w.groundCanvas, gx, gy, gw, gh, gx, gy, gw, gh);

      // 2. props planos
      const props = w.propsIn(view.x0, view.y0, view.x1, view.y1);
      const flat = [], tall = [];
      for (const p of props) {
        if (p.t === 'tree_big' || p.t === 'tree_small' || p.t === 'pine' || p.t === 'palm' || p.t === 'bush' || p.t === 'crop') tall.push(p);
        else flat.push(p);
      }
      for (const p of flat) this.drawProp(ctx, p, game, light);

      // 3. prédios (culled + ordenados por y)
      const vis = [];
      for (const b of w.buildings) {
        if (b.x + b.w < view.x0 || b.x > view.x1 || b.y + b.h < view.y0 || b.y > view.y1) continue;
        vis.push(b);
      }
      vis.sort((a, b) => (a.y + a.h) - (b.y + b.h));
      for (const b of vis) this.drawBuilding(ctx, b, game, light);

      // 4. entidades + props altos (ordenados por Y)
      const drawList = [];
      if (game.entities) for (const e of game.entities) {
        if (e.x < view.x0 - 2 || e.x > view.x1 + 2 || e.y < view.y0 - 2 || e.y > view.y1 + 2) continue;
        drawList.push(e);
      }
      for (const p of tall) drawList.push(p);
      drawList.sort((a, b) => a.y - b.y);
      for (const item of drawList) {
        if (item.t) this.drawProp(ctx, item, game, light);
        else game.drawEntity(ctx, item, light);
      }
      if (game.drawForeground) game.drawForeground(ctx, light);
      ctx.restore();

      // 5. clima e cor ambiente em espaço de tela
      ctx.save();
      if (light.tintA > 0.01) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = light.tintA * .5;
        ctx.fillStyle = light.tint;
        ctx.fillRect(0, 0, this.vw, this.vh);
      }
      if (light.dark > .02) {
        ctx.globalCompositeOperation = 'source-over';
        const a = light.dark * .68;
        const grd = ctx.createLinearGradient(0, 0, 0, this.vh);
        grd.addColorStop(0, 'rgba(8,14,32,' + (a * .92) + ')');
        grd.addColorStop(1, 'rgba(6,10,22,' + (a) + ')');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.vw, this.vh);
      }
      ctx.globalCompositeOperation = 'lighter';
      this.drawLights(ctx, game, light);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      // chuva / neblina
      const rain = game.weather ? game.weather.rain : 0;
      if (rain > .02) this.drawRain(ctx, rain, game.weather.wind || 0);
      const fog = (game.weather ? game.weather.fog : 0) + (light.dark * .06);
      if (fog > .02) {
        ctx.fillStyle = 'rgba(190,205,220,' + (fog * .45) + ')';
        ctx.fillRect(0, 0, this.vw, this.vh);
      }
      if (this.flash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + this.flash * .55 + ')';
        ctx.fillRect(0, 0, this.vw, this.vh);
        this.flash -= .06;
      }
      ctx.restore();
    }

    /* ---------------- iluminação urbana ---------------- */
    drawLights(ctx, game, light) {
      if (light.dark < .15) return;
      const strength = U.clamp01((light.dark - .12) / .8);
      const view = this.viewRect(2);
      const T = this.tile;
      const sx = T / C.TILE;
      const toScreen = (wx, wy) => ({ x: (wx - this.cam.x) * T + this.vw / 2, y: (wy - this.cam.y) * T + this.vh / 2 });
      // postes
      for (const p of this.world.propsIn(view.x0, view.y0, view.x1, view.y1)) {
        if (p.t !== 'lamp') continue;
        const s = toScreen(p.x, p.y);
        const r = 62 * sx;
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
        g.addColorStop(0, 'rgba(255,214,130,' + (.30 * strength) + ')');
        g.addColorStop(.45, 'rgba(255,190,100,' + (.12 * strength) + ')');
        g.addColorStop(1, 'rgba(255,180,90,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, 6.283); ctx.fill();
      }
      // janelas e letreiros
      for (const b of this.world.buildings) {
        if (b.x + b.w < view.x0 || b.x > view.x1 || b.y + b.h < view.y0 || b.y > view.y1) continue;
        const s = toScreen(b.x + b.w / 2, b.y + b.h);
        const r = Math.min(120 * sx, (10 + b.w * 3.2) * sx);
        const alpha = (light.dark > .6 ? .16 : .07) * strength;
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
        g.addColorStop(0, 'rgba(255,236,180,' + alpha + ')');
        g.addColorStop(1, 'rgba(255,230,170,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, 6.283); ctx.fill();
      }
      // faróis de veículos
      for (const v of (game.sim ? game.sim.vehicles : [])) {
        if (v.x < view.x0 || v.x > view.x1 || v.y < view.y0 || v.y > view.y1) continue;
        if (!v.lights) continue;
        const s = toScreen(v.x, v.y);
        const a = v.angle;
        const fx = s.x + Math.cos(a) * 34 * sx, fy = s.y + Math.sin(a) * 34 * sx;
        const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 90 * sx);
        g.addColorStop(0, 'rgba(255,250,220,' + (.28 * strength) + ')');
        g.addColorStop(1, 'rgba(255,250,220,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(fx, fy, 90 * sx, 0, 6.283); ctx.fill();
      }
      // sinaleira vermelha do próprio jogador
      if (game.player && game.player.headlights) {
        const s = toScreen(game.player.x, game.player.y);
        const a = game.player.angle;
        const fx = s.x + Math.cos(a) * 40 * sx, fy = s.y + Math.sin(a) * 40 * sx;
        const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 120 * sx);
        g.addColorStop(0, 'rgba(255,250,220,.36)');
        g.addColorStop(1, 'rgba(255,250,220,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(fx, fy, 120 * sx, 0, 6.283); ctx.fill();
      }
    }

    /* ---------------- chuva ---------------- */
    drawRain(ctx, amount, wind) {
      const n = Math.min(420, 90 + amount * 330) | 0;
      while (this.rainDrops.length < n) {
        this.rainDrops.push({ x: Math.random() * this.vw, y: Math.random() * this.vh, v: 700 + Math.random() * 500, l: 8 + Math.random() * 14 });
      }
      if (this.rainDrops.length > n) this.rainDrops.length = n;
      ctx.save();
      ctx.strokeStyle = 'rgba(180,205,230,' + (.22 + amount * .3) + ')';
      ctx.lineWidth = Math.max(1, this.dpr * .8);
      ctx.beginPath();
      for (const d of this.rainDrops) {
        d.y += d.v * (1 / 60) * this.dpr; d.x += (wind || 0) * 60 * this.dpr;
        if (d.y > this.vh) { d.y = -10; d.x = Math.random() * this.vw; }
        if (d.x > this.vw) d.x = 0; if (d.x < 0) d.x = this.vw;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - (wind || 0) * d.l * .5, d.y + d.l);
      }
      ctx.stroke();
      ctx.restore();
    }

    /* ---------------- props ---------------- */
    drawProp(ctx, p, game, light) {
      const T = C.TILE;
      switch (p.t) {
        case 'lamp': {
          ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(p.x - 2, p.y + 1, 5, 2);
          ctx.fillStyle = '#3b4148'; ctx.fillRect(p.x - 1, p.y - 8, 2.5, 9);
          ctx.fillStyle = light.dark > .3 ? '#ffe08a' : '#c8ccd0';
          ctx.fillRect(p.x - 2.5, p.y - 10.5, 5.5, 3);
          break;
        }
        case 'trafficlight': {
          const state = game.intersectionState ? game.intersectionState(p.it) : 0;
          ctx.fillStyle = '#2a2f34'; ctx.fillRect(p.x - 1, p.y - 9, 2.4, 10);
          ctx.fillStyle = '#14181c'; ctx.fillRect(p.x - 2.6, p.y - 14, 5.6, 6);
          const col = state === 0 ? '#ff4d4d' : state === 1 ? '#ffd23f' : '#3ddc84';
          ctx.fillStyle = col;
          ctx.fillRect(p.x - 1.6, p.y - 13, 3.6, 2);
          ctx.fillStyle = col + '55';
          ctx.fillRect(p.x - 3, p.y - 15, 6, 8);
          break;
        }
        case 'bench': {
          ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(p.x - 5, p.y + 2, 11, 2);
          ctx.fillStyle = '#8a6440'; ctx.fillRect(p.x - 5, p.y - 3, 10, 3);
          ctx.fillStyle = '#5f4a30'; ctx.fillRect(p.x - 5, p.y - 5, 10, 2);
          break;
        }
        case 'bin': {
          ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(p.x - 3, p.y + 1, 7, 2);
          ctx.fillStyle = '#3f6b4a'; ctx.fillRect(p.x - 2.5, p.y - 6, 5, 7);
          ctx.fillStyle = '#2f5238'; ctx.fillRect(p.x - 3, p.y - 8, 6, 2);
          break;
        }
        case 'hydrant': {
          ctx.fillStyle = '#b03a3a'; ctx.fillRect(p.x - 2, p.y - 6, 4, 7);
          ctx.fillStyle = '#8f2c2c'; ctx.fillRect(p.x - 3, p.y - 4, 6, 2);
          break;
        }
        case 'sign': {
          ctx.fillStyle = '#5a6169'; ctx.fillRect(p.x - .8, p.y - 9, 1.6, 10);
          ctx.fillStyle = '#2b6bb0'; ctx.fillRect(p.x - 5, p.y - 14, 10, 6);
          ctx.fillStyle = '#fff'; ctx.fillRect(p.x - 3.5, p.y - 12, 7, 2);
          break;
        }
        case 'busstop': {
          ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(p.x - 8, p.y + 1, 17, 3);
          ctx.fillStyle = '#37414a'; ctx.fillRect(p.x - 9, p.y - 12, 18, 12);
          ctx.fillStyle = '#7ec3e8'; ctx.fillRect(p.x - 8, p.y - 11, 16, 10);
          ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(p.x - 8, p.y - 11, 16, 3);
          break;
        }
        case 'tree_small': {
          ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(p.x + 2, p.y + 3, 7, 4, 0, 0, 6.283); ctx.fill();
          ctx.fillStyle = '#5b3f28'; ctx.fillRect(p.x - 1, p.y - 4, 2.4, 5);
          const g = ctx.createRadialGradient(p.x - 2, p.y - 8, 1, p.x, p.y - 7, 9);
          g.addColorStop(0, light.dark > .4 ? '#3f7a45' : '#4f9a55');
          g.addColorStop(1, light.dark > .4 ? '#26512c' : '#2f6b36');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y - 7, 8, 0, 6.283); ctx.fill();
          break;
        }
        case 'tree_big': {
          ctx.fillStyle = 'rgba(0,0,0,.24)'; ctx.beginPath(); ctx.ellipse(p.x + 3, p.y + 4, 11, 5, 0, 0, 6.283); ctx.fill();
          ctx.fillStyle = '#4f3a24'; ctx.fillRect(p.x - 2, p.y - 6, 4, 8);
          const g = ctx.createRadialGradient(p.x - 3, p.y - 14, 2, p.x, p.y - 12, 15);
          g.addColorStop(0, light.dark > .4 ? '#417f47' : '#57a35c');
          g.addColorStop(.7, light.dark > .4 ? '#2b5a32' : '#3b7a42');
          g.addColorStop(1, light.dark > .4 ? '#1d3f24' : '#2a5c30');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y - 13, 13, 0, 6.283); ctx.fill();
          ctx.beginPath(); ctx.arc(p.x - 8, p.y - 9, 8, 0, 6.283); ctx.fill();
          ctx.beginPath(); ctx.arc(p.x + 8, p.y - 10, 8, 0, 6.283); ctx.fill();
          break;
        }
        case 'pine': {
          ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(p.x + 2, p.y + 3, 7, 4, 0, 0, 6.283); ctx.fill();
          ctx.fillStyle = '#4a3320'; ctx.fillRect(p.x - 1.2, p.y - 5, 2.6, 6);
          const dark = light.dark > .4;
          ctx.fillStyle = dark ? '#1f4a2c' : '#2c6b3a';
          for (let i = 0; i < 3; i++) {
            const w = 9 - i * 2.4, y = p.y - 6 - i * 6;
            ctx.beginPath(); ctx.moveTo(p.x, y - 8); ctx.lineTo(p.x - w, y); ctx.lineTo(p.x + w, y); ctx.closePath(); ctx.fill();
          }
          break;
        }
        case 'palm': {
          ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(p.x + 3, p.y + 3, 7, 3, 0, 0, 6.283); ctx.fill();
          ctx.strokeStyle = '#6a4f2f'; ctx.lineWidth = 2.4; ctx.beginPath();
          ctx.moveTo(p.x, p.y + 2); ctx.quadraticCurveTo(p.x + 3, p.y - 9, p.x + 1, p.y - 16); ctx.stroke();
          ctx.fillStyle = light.dark > .4 ? '#26512c' : '#33793f';
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * 6.283 + .4;
            ctx.save(); ctx.translate(p.x + 1, p.y - 16); ctx.rotate(a);
            ctx.beginPath(); ctx.ellipse(8, 0, 8, 2.6, 0, 0, 6.283); ctx.fill();
            ctx.restore();
          }
          break;
        }
        case 'bush': {
          ctx.fillStyle = light.dark > .4 ? '#26512c' : '#3c7a44';
          ctx.beginPath(); ctx.arc(p.x - 3, p.y - 2, 5, 0, 6.283); ctx.fill();
          ctx.beginPath(); ctx.arc(p.x + 3, p.y - 3, 5.5, 0, 6.283); ctx.fill();
          ctx.beginPath(); ctx.arc(p.x, p.y - 6, 5, 0, 6.283); ctx.fill();
          break;
        }
        case 'crop': {
          ctx.strokeStyle = light.dark > .4 ? '#6b7a2c' : '#9ab04a';
          ctx.lineWidth = 1.4;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath(); ctx.moveTo(p.x - 4 + i * 4, p.y + 3); ctx.lineTo(p.x - 4 + i * 4, p.y - 4); ctx.stroke();
          }
          break;
        }
        case 'rock': {
          ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(p.x + 2, p.y + 3, 7, 4, 0, 0, 6.283); ctx.fill();
          ctx.fillStyle = light.dark > .4 ? '#5a6068' : '#7d858e';
          ctx.beginPath(); ctx.moveTo(p.x - 7, p.y + 3); ctx.lineTo(p.x - 3, p.y - 6); ctx.lineTo(p.x + 4, p.y - 7); ctx.lineTo(p.x + 8, p.y + 3); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.14)';
          ctx.beginPath(); ctx.moveTo(p.x - 3, p.y - 6); ctx.lineTo(p.x + 4, p.y - 7); ctx.lineTo(p.x, p.y + 1); ctx.closePath(); ctx.fill();
          break;
        }
        case 'propaganda': {
          ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(p.x - 8, p.y - 10, 17, 12);
          ctx.fillStyle = p.color || '#ff5f7e';
          ctx.fillRect(p.x - 8, p.y - 10, 16, 11);
          ctx.fillStyle = '#fff'; ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
          ctx.fillText(p.text || 'ANUNCIE', p.x, p.y - 2);
          break;
        }
      }
    }

    /* ---------------- prédios ---------------- */
    drawBuilding(ctx, b, game, light) {
      const T = C.TILE;
      const x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
      const night = light.dark > .35;
      // sombra
      ctx.fillStyle = 'rgba(0,0,0,' + (.22 + Math.min(.16, b.floors * .012)) + ')';
      ctx.fillRect(x + 3, y + 4, w, h);
      // teto
      const base = night ? U.shade(b.color, -.42) : b.color;
      ctx.fillStyle = base;
      ctx.fillRect(x, y, w, h);
      // variação de telhado
      const r = U.rng(b.id * 7919);
      ctx.fillStyle = U.shade(base, .07);
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      // borda superior iluminada
      ctx.fillStyle = U.shade(base, night ? .05 : .18);
      ctx.fillRect(x, y, w, 2);
      ctx.fillStyle = U.shade(base, -.22);
      ctx.fillRect(x, y + h - 2, w, 2);
      ctx.fillRect(x + w - 2, y, 2, h);
      // detalhes de telhado: caixas de ar, claraboias, acesso
      const nDet = Math.min(6, 1 + ((b.w * b.h) / 9) | 0);
      for (let i = 0; i < nDet; i++) {
        const dw = 5 + r() * 9, dh = 5 + r() * 9;
        const dx = x + 4 + r() * Math.max(1, w - dw - 8);
        const dy = y + 4 + r() * Math.max(1, h - dh - 10);
        ctx.fillStyle = U.shade(base, night ? -.12 : -.16);
        ctx.fillRect(dx, dy, dw, dh);
        ctx.fillStyle = U.shade(base, night ? .02 : .1);
        ctx.fillRect(dx, dy, dw, 1.5);
      }
      // casa: telhado de duas águas
      if (b.kind === 'house' || b.kind === 'house_big' || b.kind === 'farm') {
        ctx.strokeStyle = U.shade(base, -.28); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(x + 3, y + h / 2); ctx.lineTo(x + w / 2, y + 3);
        ctx.lineTo(x + w - 3, y + h / 2); ctx.lineTo(x + w / 2, y + h - 3); ctx.closePath(); ctx.stroke();
        ctx.fillStyle = U.shade(base, -.35);
        ctx.fillRect(x + w / 2 - 3, y + h / 2 - 4, 6, 8); // chaminé
      }
      // fachada sul (dentro da pegada): altura proporcional aos andares
      const fh = Math.min(h * .42, 4 + Math.min(20, b.floors * 1.9));
      const fy = y + h - fh;
      const facade = night ? U.shade(b.color, -.52) : U.shade(b.color, -.3);
      ctx.fillStyle = facade;
      ctx.fillRect(x, fy, w, fh);
      ctx.fillStyle = U.shade(b.color, night ? -.6 : -.42);
      ctx.fillRect(x, y + h - 1.6, w, 1.6);
      // janelas
      if (b.litWindows && b.litWindows.length) {
        const rows = Math.min(b.litWindows.length, Math.max(1, Math.floor(fh / 3.4)));
        const cols = Math.max(2, Math.min(b.w, 8));
        const ww = (w - 6) / cols, wh = Math.max(1.6, (fh - 4) / rows - 1.2);
        for (let ri = 0; ri < rows; ri++) {
          const winRow = b.litWindows[ri % b.litWindows.length];
          for (let ci = 0; ci < cols; ci++) {
            const lit = winRow[ci % winRow.length] && night;
            ctx.fillStyle = lit ? '#ffe9a8' : (night ? '#243040' : '#2b3948');
            ctx.fillRect(x + 3 + ci * ww + 1, fy + 2 + ri * (wh + 1.2), ww - 2, wh);
          }
        }
      }
      // porta
      if (b.door && fh > 4) {
        const dxp = (b.door.x - b.x) * T;
        ctx.fillStyle = night ? '#2a2018' : '#463326';
        ctx.fillRect(x + U.clamp(dxp, 4, w - 12), y + h - Math.min(fh, 7), 7, Math.min(fh, 7));
      }
      // letreiro luminoso para comércio
      if (['shop', 'bar', 'restaurant', 'pharmacy', 'bakery', 'mall', 'supermarket', 'hotel', 'bank', 'gas', 'market', 'nightclub', 'clinic'].includes(b.kind)) {
        const txt = b.name.toUpperCase().slice(0, 12);
        const colors = { shop: '#ff6ba8', bar: '#ffb03a', restaurant: '#ff8b3d', pharmacy: '#4dff9e', bakery: '#ffd23f', mall: '#7ad7ff', supermarket: '#8bff5a', hotel: '#ff5f7e', bank: '#ffd700', gas: '#59d0ff', market: '#ffa24d', clinic: '#9ce8ff' };
        const col = colors[b.kind] || '#ffd23f';
        ctx.fillStyle = night ? col : U.shade(col, -.3);
        ctx.fillRect(x + 3, fy - 8, Math.min(w - 6, 10 + txt.length * 5.4), 7);
        ctx.fillStyle = night ? '#1a1207' : '#20160a';
        ctx.font = 'bold 6px monospace'; ctx.textAlign = 'left';
        ctx.fillText(txt, x + 5, fy - 3);
        if (night) { ctx.globalAlpha = .25; ctx.fillStyle = col; ctx.fillRect(x + 1, fy - 11, Math.min(w - 2, 14 + txt.length * 5.4), 13); ctx.globalAlpha = 1; }
      }
      // contorno
      ctx.strokeStyle = 'rgba(0,0,0,.42)'; ctx.lineWidth = 1;
      ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
    }

    /* ---------------- minimapa ---------------- */
    drawMinimap(mmCtx, game) {
      const mm = this.world.miniCanvas, MM = 200;
      const p = game.player;
      const span = 96; // tiles visíveis no minimapa
      const sx = Math.max(0, Math.min(this.world.W - span, p.x - span / 2));
      const sy = Math.max(0, Math.min(this.world.H - span, p.y - span / 2));
      mmCtx.imageSmoothingEnabled = false;
      mmCtx.clearRect(0, 0, MM, MM);
      mmCtx.drawImage(mm, sx, sy, span, span, 0, 0, MM, MM);
      const toMM = (wx, wy) => ({ x: (wx - sx) / span * MM, y: (wy - sy) / span * MM });
      // veículos e pessoas
      for (const e of game.entities) {
        if (e.dead) continue;
        const m = toMM(e.x, e.y);
        if (m.x < 0 || m.y < 0 || m.x > MM || m.y > MM) continue;
        if (e.isVehicle) { mmCtx.fillStyle = 'rgba(255,255,255,.55)'; mmCtx.fillRect(m.x - 1, m.y - 1, 2, 2); }
        else if (e.isPlayer) continue;
        else { mmCtx.fillStyle = 'rgba(255,230,150,.45)'; mmCtx.fillRect(m.x, m.y, 1, 1); }
      }
      // pontos importantes: trabalho atual / destino
      if (game.jobTarget) {
        const m = toMM(game.jobTarget.x, game.jobTarget.y);
        mmCtx.fillStyle = '#ffd23f';
        mmCtx.beginPath(); mmCtx.arc(m.x, m.y, 4, 0, 6.283); mmCtx.fill();
        mmCtx.strokeStyle = '#7a5f00'; mmCtx.lineWidth = 1.5; mmCtx.stroke();
      }
      // jogador
      const pm = toMM(p.x, p.y);
      mmCtx.save(); mmCtx.translate(pm.x, pm.y); mmCtx.rotate(p.angle + Math.PI / 2);
      mmCtx.fillStyle = '#4cc9f0';
      mmCtx.beginPath(); mmCtx.moveTo(0, -6); mmCtx.lineTo(4.5, 5); mmCtx.lineTo(0, 2.5); mmCtx.lineTo(-4.5, 5); mmCtx.closePath(); mmCtx.fill();
      mmCtx.strokeStyle = '#062230'; mmCtx.lineWidth = 1; mmCtx.stroke();
      mmCtx.restore();
    }

    // mapa grande do celular
    drawPhoneMap(canvas, game) {
      const w = this.world, ctx = canvas.getContext('2d');
      const size = canvas.width;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, size, size);
      // enquadra a cidade inteira
      ctx.drawImage(w.miniCanvas, 0, 0, w.W, w.H, 0, 0, size, size);
      ctx.globalAlpha = .25; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, size, size); ctx.globalAlpha = 1;
      const s = size / w.W;
      for (const d of w.districts) {
        ctx.strokeStyle = d.zone === 'PARK' ? '#37d67a' : '#ffffff22';
        ctx.lineWidth = 1;
        ctx.strokeRect(d.x * s, d.y * s, (d.x2 - d.x) * s, (d.y2 - d.y) * s);
      }
      // empregos
      if (game.jobTarget) {
        ctx.fillStyle = '#ffd23f';
        ctx.beginPath(); ctx.arc(game.jobTarget.x * s, game.jobTarget.y * s, 5, 0, 6.283); ctx.fill();
      }
      // jogador
      const p = game.player;
      ctx.fillStyle = '#4cc9f0';
      ctx.beginPath(); ctx.arc(p.x * s, p.y * s, 5, 0, 6.283); ctx.fill();
      ctx.strokeStyle = '#062230'; ctx.lineWidth = 2; ctx.stroke();
      return s;
    }
  };
})();
