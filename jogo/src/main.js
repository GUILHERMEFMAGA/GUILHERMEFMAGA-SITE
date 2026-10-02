// ============================================================
//  CIDADE DOURADA — jogo completo (Three.js, sem assets externos)
// ============================================================
export const BUILD = '2026-10-02.c';   // mude a cada publicação

//  Um táxi numa metrópole fotorrealista ao entardecer.
// ============================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { CFG, QUALITY, clamp, damp, randomSidewalkPoint } from './config.js';
import { makeRoadTexture } from './textures.js';
import { Sky } from './env.js';
import { buildCity } from './city.js';
import { Player, Traffic } from './cars.js';
import { Rain } from './rain.js';
import { Audio } from './audio.js';
import { Input } from './input.js';

// ---------- texturas caras, criadas uma única vez ----------
const CACHE = { road: null };

// ---------- shader de "gradação" (cor cinematográfica) ----------
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uSpeed: { value: 0 },
    uNight: { value: 0 },
    uDamage: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform float uTime, uSpeed, uNight, uDamage;
    uniform vec2 uRes;
    varying vec2 vUv;

    float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }

    void main(){
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      float r2 = dot(c, c);

      // leve aberração cromática + tremor de calor
      float ab = 0.0009 + r2 * 0.0026 + uDamage * 0.004 + uSpeed * 0.0006;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + c * ab).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - c * ab).b;

      // temperatura: quente no entardecer, fria à noite
      col.r *= 1.06 - uNight * 0.10;
      col.g *= 1.0;
      col.b *= 0.94 + uNight * 0.16;

      // contraste suave + leves realce/sombra
      col = clamp(col, 0.0, 1.0);
      col = (col - 0.5) * 1.09 + 0.5;
      col += 0.012 * (1.0 - uNight);

      // vinheta
      col *= 1.0 - smoothstep(0.28, 0.86, r2) * (0.55 + uDamage * 0.3);

      // dano: pulsação vermelha nas bordas
      if (uDamage > 0.001) {
        col = mix(col, vec3(0.75, 0.04, 0.06), smoothstep(0.18, 0.8, r2) * uDamage * 0.85);
      }

      // granulação de filme
      float g = h21(uv * uRes + fract(uTime) * 137.0) - 0.5;
      col += g * 0.022;

      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }`,
};

// ------------------------------------------------------------
class Game {
  constructor() {
    this.state = 'boot';
    this.qualityName = localStorage.getItem('cd_quality') ||
      (matchMedia('(pointer: coarse)').matches ? 'medium' : 'high');
    this.q = QUALITY[this.qualityName] || QUALITY.high;
    this.q.qualityName = this.qualityName;

    this.audio = new Audio();
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.qualityName !== 'low',
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setPixelRatio(this.q.dpr);
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = this.q.shadow > 0;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);
    this.canvas = this.renderer.domElement;

    this.input = new Input(this.canvas);
    this.input.onAction = (code) => this.action(code);

    this.clock = new THREE.Clock();
    this.el = {};
    ['loader', 'loadBar', 'loadTxt', 'menu', 'hud', 'pause', 'over', 'countdown',
      'hTime', 'hScore', 'hCombo', 'hFare', 'hFareLbl', 'hDist', 'hSpeed', 'hGear',
      'hSpdBar', 'toast', 'hint', 'edgeArrow', 'flash', 'vignette', 'touch', 'fatal',
      'fatalMsg', 'minimap', 'stScore', 'stDeliv', 'stCombo', 'stDist', 'stTop',
      'stCoins', 'stRank', 'btnPlay', 'btnFree', 'btnResume', 'btnQuit', 'btnAgain',
      'btnMenu', 'selQuality', 'chkSound', 'chkRadio']
      .forEach(id => this.el[id] = document.getElementById(id));

    this.mmCtx = this.el.minimap.getContext('2d');
    this.bindUI();

    this.score = 0; this.combo = 1; this.deliveries = 0; this.coins = 0;
    this.time = CFG.START_TIME; this.dayT = 0; this.elapsed = 0;
    this.camYaw = 0; this.camPitch = 0; this.shake = 0; this.damage = 0;
    this.camMode = 0; this.freeMode = false;
    this.mission = { stage: 'none', target: null, dist: 0, fare: 0 };
    this.menuAngle = 0;
    this._lastHud = {};

    this.buildWorld();

    addEventListener('resize', () => this.resize());
    addEventListener('blur', () => { if (this.state === 'playing') this.pause(); });
    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.fatal('O contexto WebGL foi perdido. Recarregue a página (F5).');
    });

    if (this.input.isTouch) this.el.touch.classList.remove('hidden');
    this.el.selQuality.value = this.qualityName;
    this.el.chkSound.checked = true;
    this.el.chkRadio.checked = true;

    this.setLoad(0.9, 'Quase lá…');
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
    setTimeout(() => {
      this.setLoad(1, 'Pronto!');
      setTimeout(() => {
        this.el.loader.classList.add('hidden');
        this.el.menu.classList.remove('hidden');
        this.state = 'menu';
      }, 260);
    }, 120);
  }

  // ============================ MUNDO ============================
  buildWorld() {
    const scene = new THREE.Scene();
    this.scene = scene;
    this.camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.6, 9000);
    scene.add(this.camera);

    this.sky = new Sky(this.renderer, scene);
    this.sky.setQuality(this.q);
    this.dayT = 0;
    this.sky.apply(0, true);
    this.sky.update(0.016, new THREE.Vector3(0, 0, 0), true);

    if (!CACHE.road) CACHE.road = makeRoadTexture();

    this.city = buildCity(scene, this.renderer, this.q, 20261002);
    this.city.setFog(scene.fog.color, scene.fog.density);
    this.traffic = new Traffic(scene, this.city.lanes, this.q.traffic, this.q);
    this.player = new Player(scene, this.city, this.q, this.audio);
    this.player.night = 0;
    this.player.onCrash = (v) => this.onCrash(v);
    this.player.onCoin = () => this.onCoin();
    this.rain = new Rain(scene, this.q.rain, this.q.splash);
    this.rain.attachLens(this.camera);
    this.rain.setIntensity(0.85);

    this.buildComposer();
    this.resize();

    // posição inicial: numa avenida, olhando para o centro
    const sp = this.spawnPoint();
    this.player.reset(sp.x, sp.z, sp.h);
    this.camera.position.set(sp.x, 9, sp.z - 16);
  }

  buildComposer() {
    const w = innerWidth, h = innerHeight;
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(this.q.dpr);
    this.composer.setSize(w, h);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = null;
    if (this.q.bloom) {
      this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), this.q.bloomStrength, 0.72, 0.78);
      this.composer.addPass(this.bloom);
    }
    this.grade = new ShaderPass(GradeShader);
    this.grade.uniforms.uRes.value.set(w * this.q.dpr, h * this.q.dpr);
    this.composer.addPass(this.grade);
    this.composer.addPass(new OutputPass());
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(this.q.dpr);
    this.renderer.setSize(w, h);
    this.composer.setPixelRatio(this.q.dpr);
    this.composer.setSize(w, h);
    if (this.bloom) this.bloom.resolution.set(w, h);
    this.grade.uniforms.uRes.value.set(w * this.q.dpr, h * this.q.dpr);
  }

  setQuality(name) {
    if (!QUALITY[name] || name === this.qualityName) return;
    localStorage.setItem('cd_quality', name);
    this.qualityName = name;
    this.q = QUALITY[name];
    this.q.qualityName = name;
    // limpa o mundo antigo
    this.audio.silenceEngine();
    const old = this.scene;
    const keep = new Set([CACHE.road]);
    old.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      const m = o.material;
      if (!m) return;
      (Array.isArray(m) ? m : [m]).forEach(mm => {
        if (!mm) return;
        for (const key of ['map', 'alphaMap', 'normalMap', 'roughnessMap', 'emissiveMap']) {
          const t = mm[key];
          if (t && !keep.has(t)) t.dispose();
        }
        mm.dispose();
      });
    });
    if (this.sky.envRT) this.sky.envRT.dispose();
    this.renderer.shadowMap.enabled = this.q.shadow > 0;
    this.buildWorld();
    this.state = 'menu';
    this.el.menu.classList.remove('hidden');
    this.el.hud.classList.add('hidden');
    this.el.over.classList.add('hidden');
    this.el.pause.classList.add('hidden');
    this.toast('Qualidade: ' + ({ high: 'ALTA', medium: 'MÉDIA', low: 'BAIXA' })[name]);
  }

  // ============================ UI ==============================
  bindUI() {
    const click = (el, fn) => el && el.addEventListener('click', () => {
      this.audio.init(); this.audio.resume(); this.audio.ui(); fn();
    });
    click(this.el.btnPlay, () => this.startRun(false));
    click(this.el.btnFree, () => this.startRun(true));
    click(this.el.btnResume, () => this.resume());
    click(this.el.btnQuit, () => this.toMenu());
    click(this.el.btnAgain, () => this.startRun(false));
    click(this.el.btnMenu, () => this.toMenu());
    this.el.selQuality.addEventListener('change', (e) => this.setQuality(e.target.value));
    this.el.chkSound.addEventListener('change', (e) => {
      this.audio.init(); this.audio.setEnabled(e.target.checked);
    });
    this.el.chkRadio.addEventListener('change', (e) => {
      this.audio.init(); this.audio.setRadio(e.target.checked);
    });
  }

  setLoad(v, txt) {
    this.el.loadBar.style.width = (v * 100) + '%';
    if (txt) this.el.loadTxt.textContent = txt;
  }

  toast(big, small) {
    const t = this.el.toast;
    t.innerHTML = big + (small ? `<small>${small}</small>` : '');
    t.classList.remove('show');
    void t.offsetWidth;
    t.classList.add('show');
  }

  hint(txt, ms = 3600) {
    const h = this.el.hint;
    if (!txt) { h.classList.remove('show'); return; }
    h.innerHTML = txt;
    h.classList.add('show');
    clearTimeout(this._hintT);
    this._hintT = setTimeout(() => h.classList.remove('show'), ms);
  }

  action(code) {
    if (code === 'KeyM') {
      const c = this.el.chkSound; c.checked = !c.checked;
      this.audio.init(); this.audio.setEnabled(c.checked);
      this.toast(c.checked ? 'SOM LIGADO' : 'SOM MUDO');
    }
    if (code === 'KeyR') {
      const c = this.el.chkRadio; c.checked = !c.checked;
      this.audio.init(); this.audio.setRadio(c.checked);
      this.toast(c.checked ? 'RÁRO LIGADA 📻' : 'RÁDIO DESLIGADA');
    }
    if (code === 'KeyH') this.audio.horn(true);
    if (code === 'KeyC' && (this.state === 'playing' || this.state === 'menu')) {
      this.camMode = (this.camMode + 1) % 3;
      this.toast(['CÂMERA: PERSEGUIÇÃO', 'CÂMERA: CAPO', 'CÂMERA: ALTA'][this.camMode]);
    }
    if (code === 'KeyP' || code === 'Escape') {
      if (this.state === 'playing') this.pause();
      else if (this.state === 'paused') this.resume();
    }
    if (code === 'Enter' && this.state === 'menu') this.startRun(false);
  }

  // ========================= FLUXO DE JOGO =======================
  startRun(free) {
    this.freeMode = !!free;
    this.score = 0; this.combo = 1; this.deliveries = 0; this.coins = 0;
    this.time = CFG.START_TIME; this.elapsed = 0; this.damage = 0;
    this.dayT = 0;
    this.player.distance = 0; this.player.topSpeed = 0;
    const sp = this.spawnPoint();
    this.player.reset(sp.x, sp.z, sp.h);
    this.audio.init(); this.audio.resume();
    this.audio.setRain(0.75);

    if (this.freeMode) {
      this.setMission('none');
      this.el.hFareLbl.textContent = 'MODO LIVRE';
      this.el.hFare.textContent = 'Explore a cidade';
    } else {
      this.newPickup();
    }

    this.el.menu.classList.add('hidden');
    this.el.over.classList.add('hidden');
    this.el.hud.classList.remove('hidden');
    this.camYaw = 0; this.camPitch = 0; this.shake = 0; this.camMode = 0;
    this.snapCam();
    this.state = 'countdown';
    this.countdown(3);
  }

  // ponto seguro numa avenida, longe de qualquer prédio
  spawnPoint() {
    const r = CFG.ROADS[Math.floor(CFG.ROADS.length / 2)];
    for (const z of [-120, -260, 60, 300, -420]) {
      const x = r + CFG.LANE;
      const bad = this.city.colliders.some(c =>
        x > c.minX - 6 && x < c.maxX + 6 && z > c.minZ - 8 && z < c.maxZ + 8);
      if (!bad) return { x, z, h: 0 };
    }
    return { x: r, z: -120, h: 0 };
  }

  snapCam() {
    const p = this.player;
    this.camera.position.set(p.x - Math.sin(p.h) * 13, 5.6, p.z - Math.cos(p.h) * 13);
    this.camera.lookAt(p.x, 2, p.z);
  }

  countdown(n) {
    const c = this.el.countdown;
    if (n > 0) {
      c.textContent = n;
      c.classList.remove('hidden');
      c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
      this.audio.count(false);
      setTimeout(() => this.countdown(n - 1), 850);
    } else {
      c.textContent = 'JÁ!';
      c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
      this.audio.count(true);
      setTimeout(() => c.classList.add('hidden'), 700);
      this.state = 'playing';
      this.hint(this.freeMode ? 'Use <b>W A S D</b> · <b>C</b> muda a câmera'
        : 'Vá até o <b>feixe ciano</b> e pare ao lado dele', 4600);
    }
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.el.pause.classList.remove('hidden');
    this.audio.silenceEngine();
    this.audio.horn(false);
  }
  resume() {
    if (this.state !== 'paused') return;
    this.el.pause.classList.add('hidden');
    this.state = 'playing';
    this.audio.resume();
    this.clock.getDelta();
  }
  toMenu() {
    this.state = 'menu';
    this.el.pause.classList.add('hidden');
    this.el.over.classList.add('hidden');
    this.el.hud.classList.add('hidden');
    this.el.menu.classList.remove('hidden');
    this.setMission('none');
    this.audio.silenceEngine();
  }

  gameOver() {
    this.state = 'over';
    this.el.hud.classList.add('hidden');
    this.el.over.classList.remove('hidden');
    this.el.stScore.textContent = this.score.toLocaleString('pt-BR');
    this.el.stDeliv.textContent = this.deliveries;
    this.el.stCombo.textContent = 'x' + this.combo;
    this.el.stDist.textContent = (this.player.distance / 1000).toFixed(2);
    this.el.stTop.textContent = Math.round(this.player.topSpeed * 3.6);
    this.el.stCoins.textContent = this.coins;
    const s = this.score;
    this.el.stRank.textContent = s > 5200 ? 'LENDA DA CIDADE 🏆'
      : s > 3000 ? 'TAXISTA PROFISSIONAL'
        : s > 1600 ? 'MOTORISTA DE PRAÇA'
          : s > 700 ? 'MOTORISTA DE APP' : 'APRENDIZ DE VOLANTE';
    this.audio.deliver(3);
    this.audio.silenceEngine();
  }

  // =========================== MISSÕES ===========================
  setMission(stage, spot) {
    this.mission.stage = stage;
    this.mission.target = spot || null;
    const pick = this.city.markerPick, drop = this.city.markerDrop;
    pick.group.visible = stage === 'pickup';
    drop.group.visible = stage === 'dropoff';
    this.city.passenger.visible = stage === 'pickup';
    if (stage === 'pickup' && spot) {
      // spot fica no meio da calçada; o marcador vai para a borda (junto ao meio-fio)
      pick.group.position.set(spot.x - spot.nx * 4, 0.2, spot.z - spot.nz * 4);
      this.city.passenger.position.set(spot.x + spot.nx * 1.6, 0.18, spot.z + spot.nz * 1.6);
      this.city.passenger.visible = true;
      this.el.hFareLbl.textContent = 'PASSAGEIRO';
      this.el.hFare.textContent = 'Embarque no feixe ciano';
    }
    if (stage === 'dropoff' && spot) {
      drop.group.position.set(spot.x - spot.nx * 4, 0.2, spot.z - spot.nz * 4);
      this.el.hFareLbl.textContent = 'DESTINO';
      this.el.hFare.textContent = 'Leve o passageiro';
    }
    if (stage === 'none') {
      pick.group.visible = drop.group.visible = false;
      this.city.passenger.visible = false;
    }
  }

  newPickup() {
    const rnd = Math.random;
    let spot = null;
    for (let i = 0; i < 40; i++) {
      const s = randomSidewalkPoint(rnd);
      const d = Math.hypot(s.x - this.player.x, s.z - this.player.z);
      if (d > 220 && d < 1250) { spot = s; break; }
      spot = spot || s;
    }
    this.setMission('pickup', spot);
  }

  checkMission() {
    const m = this.mission;
    if (!m.target) return;
    const p = this.player;
    const d = Math.hypot(m.target.x - p.x, m.target.z - p.z);
    m.dist = d;
    const slow = Math.abs(p.speed) < 3.4;

    if (m.stage === 'pickup' && d < CFG.PICKUP_RADIUS) {
      if (slow) {
        // embarcou!
        let dest = null;
        for (let i = 0; i < 40; i++) {
          const s = randomSidewalkPoint(Math.random);
          const dd = Math.hypot(s.x - m.target.x, s.z - m.target.z);
          if (dd > 420 && dd < 1500) { dest = s; break; }
        }
        dest = dest || randomSidewalkPoint(Math.random);
        this.mission.fare = Math.hypot(dest.x - m.target.x, dest.z - m.target.z);
        this.setMission('dropoff', dest);
        this.audio.pickup();
        this.toast('PASSAGEIRO A BORDO', 'destino marcado em laranja');
        this.hint('Siga o <b>feixe laranja</b>', 3200);
      } else if (!this._slowWarn || performance.now() - this._slowWarn > 2600) {
        this._slowWarn = performance.now();
        this.hint('Desacelere para <b>embarcar</b>', 2200);
      }
    } else if (m.stage === 'dropoff' && d < CFG.DELIVER_RADIUS) {
      if (slow) this.completeDelivery();
      else if (!this._slowWarn || performance.now() - this._slowWarn > 2600) {
        this._slowWarn = performance.now();
        this.hint('Pare o carro para <b>desembarcar</b>', 2200);
      }
    }
  }

  completeDelivery() {
    const dist = this.mission.fare;
    const base = Math.round(60 + dist * 0.72);
    const gain = Math.round(base * this.combo);
    this.score += gain;
    this.deliveries++;
    this.combo = Math.min(this.combo + 1, 5);
    this.time += CFG.TIME_PER_DELIVERY;
    this.dayT = Math.min(1, this.dayT + 0.012);
    this.audio.deliver(this.combo);
    this.toast(`+${gain.toLocaleString('pt-BR')} pts`,
      `corrida de ${(dist / 1000).toFixed(1)} km · combo x${this.combo} · +${CFG.TIME_PER_DELIVERY}s`);
    this.flash(0.25);
    this.newPickup();
  }

  onCrash(power) {
    if (this.combo > 1) this.toast('COMBO PERDIDO', 'batida!');
    this.combo = 1;
    this.damage = clamp(power * 0.9, 0.25, 1);
    this.flash(0.5 * power);
    this.shake = clamp(Math.max(this.shake, power * 0.9), 0, 1.4);
  }

  onCoin() {
    this.coins++;
    this.score += 25 * this.combo;
    if (!this.freeMode) this.time += 1.2;
    this.audio.coin();
    this.el.hScore.animate?.(
      [{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }],
      { duration: 260, easing: 'ease-out' });
  }

  flash(v) {
    const f = this.el.flash;
    f.style.opacity = v;
    f.classList.remove('hit'); void f.offsetWidth; f.classList.add('hit');
  }

  addShake(v) { this.shake = Math.min(1.4, this.shake + v); }

  // ============================ LOOP =============================
  loop() {
    requestAnimationFrame(this.loop);
    let dt = this.clock.getDelta();
    dt = Math.min(dt, 0.05);
    const playing = this.state === 'playing';
    const tNow = performance.now() * 0.001;

    this.input.sync();

    // ---- ciclo de dia/noite ----
    if (playing || this.state === 'countdown') {
      this.dayT = Math.min(1, this.dayT + dt / 250);
      this.elapsed += dt;
    } else if (this.state === 'menu') {
      this.dayT = 0.06 + 0.05 * Math.sin(tNow * 0.05);
    }
    this.sky.apply(this.dayT);

    // ---- jogador ----
    const p = this.player;
    p.night = this.sky.night;
    if (playing) {
      p.update(dt, this.input, this.traffic, (v) => this.addShake(Math.min(v, 1)));
      if (!this.input.keys.KeyH) this.audio.horn(false);

      this.time -= dt;
      if (this.time <= 0 && !this.freeMode) {
        this.time = 0;
        this.gameOver();
      }
      if (!this.freeMode) this.checkMission();
    } else if (this.state === 'paused' || this.state === 'over') {
      this.audio.silenceEngine();
    } else {
      // menu / contagem: carro parado, motor em marcha lenta
      p.update(dt, { gas: false, brake: false, left: false, right: false, hand: false },
        this.traffic, null);
    }

    // ---- mundo ----
    const focus = new THREE.Vector3(p.x, 0, p.z);
    if (this.state === 'menu') focus.set(0, 0, 0);
    this.sky.update(dt, focus, this._envDirty);
    this._envDirty = false;
    this.city.setFog(this.scene.fog.color, this.scene.fog.density);
    this.city.update(dt, tNow, this.camera.position, this.sky.night,
      playing ? p : { x: p.x, y: 0, z: p.z });
    this.traffic.update(dt, tNow, playing ? p : null, this.sky.night);
    this.rain.update(dt, tNow, this.camera.position);

    // ---- câmera ----
    this.updateCamera(dt, playing);

    // ---- HUD ----
    if (this.state !== 'menu') this.updateHUD(dt);

    // ---- pós-processamento dinâmico ----
    const g = this.grade.uniforms;
    g.uTime.value = tNow;
    g.uNight.value = this.sky.night;
    g.uSpeed.value = clamp(Math.abs(p.speed) / CFG.MAX_SPEED, 0, 1);
    this.damage = Math.max(0, this.damage - dt * 0.75);
    g.uDamage.value = this.damage;
    if (this.bloom) {
      this.bloom.strength = this.q.bloomStrength * (0.7 + this.sky.night * 0.85);
    }
    this.camera.fov = damp(this.camera.fov,
      58 + clamp(Math.abs(p.speed) / CFG.MAX_SPEED, 0, 1) * 14 + this.shake * 4, 5, dt);
    this.camera.updateProjectionMatrix();

    try {
      this.composer.render(dt);
    } catch (err) {
      if (!this._renderFail) {
        this._renderFail = 1;
        console.error('erro de render, tentando sem bloom', err);
        if (this.bloom) { this.composer.removePass(this.bloom); this.bloom = null; }
        else throw err;
      } else if (this._renderFail === 1) {
        this._renderFail = 2;
        try { this.renderer.render(this.scene, this.camera); }
        catch (err2) {
          showFatal(`[${BUILD}] erro de WebGL: ${err2.message}. ` +
            'Tente atualizar o navegador ou usar a qualidade Baixa.');
          this.state = 'dead';
        }
      }
    }
  }

  updateCamera(dt, playing) {
    const p = this.player;
    const cam = this.camera;
    const m = this.input.takeMouse();
    if (m.down) {
      this.camYaw -= m.dx * 0.0042;
      this.camPitch = clamp(this.camPitch - m.dy * 0.0032, -0.45, 0.75);
    } else {
      this.camYaw = damp(this.camYaw, 0, 2.2, dt);
      this.camPitch = damp(this.camPitch, 0, 2.2, dt);
    }

    if (this.state === 'menu' || this.state === 'over') {
      // câmera cinematográfica orbitando a cidade
      this.menuAngle += dt * (this.state === 'menu' ? 0.045 : 0.02);
      const r = 620, hgt = 210 + Math.sin(this.menuAngle * 0.7) * 60;
      cam.position.set(Math.cos(this.menuAngle) * r, hgt, Math.sin(this.menuAngle) * r);
      cam.lookAt(0, 70, 0);
      cam.fov = damp(cam.fov, 46, 3, dt);
      return;
    }

    const speedF = clamp(Math.abs(p.speed) / CFG.MAX_SPEED, 0, 1);
    const yaw = p.h + this.camYaw;
    let desired, look;

    if (this.camMode === 1) {                       // capô
      desired = new THREE.Vector3(
        p.x + Math.sin(p.h) * 0.35, 1.62, p.z + Math.cos(p.h) * 0.35);
      look = new THREE.Vector3(
        p.x + Math.sin(p.h) * 40, 1.4 + this.camPitch * 20, p.z + Math.cos(p.h) * 40);
      cam.position.lerp(desired, 1 - Math.exp(-22 * dt));
    } else if (this.camMode === 2) {                // alta / helicóptero
      const dist = 34 + speedF * 14;
      desired = new THREE.Vector3(
        p.x - Math.sin(yaw) * dist * 0.7, 42 + this.camPitch * 20, p.z - Math.cos(yaw) * dist * 0.7);
      cam.position.lerp(desired, 1 - Math.exp(-3.4 * dt));
      look = new THREE.Vector3(p.x, 2, p.z);
    } else {                                        // perseguição
      const dist = 12.5 + speedF * 6.5;
      const height = 5.4 + speedF * 1.1 - this.camPitch * 9;
      desired = new THREE.Vector3(
        p.x - Math.sin(yaw) * dist, Math.max(1.6, height), p.z - Math.cos(yaw) * dist);
      cam.position.lerp(desired, 1 - Math.exp(-7.5 * dt));
      look = new THREE.Vector3(
        p.x + Math.sin(p.h) * (9 + speedF * 14),
        2.0 + this.camPitch * 12,
        p.z + Math.cos(p.h) * (9 + speedF * 14));
    }
    cam.up.set(0, 1, 0);
    cam.lookAt(look);

    // tremor de câmera
    if (this.shake > 0.001) {
      this.shake = Math.max(0, this.shake - dt * 2.1);
      const s = this.shake;
      cam.position.x += (Math.random() - 0.5) * s * 1.5;
      cam.position.y += (Math.random() - 0.5) * s * 1.2;
      cam.position.z += (Math.random() - 0.5) * s * 1.5;
      cam.rotateZ((Math.random() - 0.5) * s * 0.06);
    }
    // mantém a câmera fora do chão e dos prédios
    if (cam.position.y < 1.4) cam.position.y = 1.4;
  }

  // ============================= HUD =============================
  updateHUD(dt) {
    const el = this.el, p = this.player;
    const kmh = Math.round(p.kmh());

    el.hSpeed.textContent = kmh;
    el.hSpdBar.style.width = clamp(kmh / 140 * 100, 0, 100) + '%';
    el.hGear.textContent = p.speed < -0.4 ? 'R' : kmh < 1 ? 'N'
      : kmh < 28 ? '1' : kmh < 55 ? '2' : kmh < 82 ? '3' : kmh < 110 ? '4' : '5';

    if (!this.freeMode) {
      const s = Math.max(0, Math.ceil(this.time));
      const txt = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      if (this._lastHud.time !== txt) {
        el.hTime.textContent = txt;
        (el.hTime.parentElement || el.hTime).classList?.toggle('warn', s <= 20);
        if (s <= 10 && s > 0 && s !== this._lastHud.beep) {
          this._lastHud.beep = s; this.audio.count(false);
        }
        this._lastHud.time = txt;
      }
    } else {
      el.hTime.textContent = '∞';
      (el.hTime.parentElement || el.hTime).classList?.remove('warn');
    }

    if (this._lastHud.score !== this.score) {
      el.hScore.textContent = this.score.toLocaleString('pt-BR');
      this._lastHud.score = this.score;
    }
    if (this._lastHud.combo !== this.combo) {
      el.hCombo.textContent = 'x' + this.combo;
      el.hCombo.classList.toggle('on', this.combo > 1);
      this._lastHud.combo = this.combo;
    }
    const m = this.mission;
    const dTxt = m.target
      ? (m.dist > 900 ? (m.dist / 1000).toFixed(1) + ' km' : Math.round(m.dist) + ' m')
      : '';
    if (this._lastHud.dist !== dTxt) { el.hDist.textContent = dTxt; this._lastHud.dist = dTxt; }

    // seta de borda quando o alvo está fora da tela
    this.updateEdgeArrow(m.target);
    this.drawMinimap();
    void dt;
  }

  updateEdgeArrow(target) {
    const a = this.el.edgeArrow;
    if (!target || this.state !== 'playing') { a.classList.add('hidden'); return; }
    const v = new THREE.Vector3(target.x, 2.5, target.z).project(this.camera);
    if (v.z < 1 && Math.abs(v.x) < 0.94 && Math.abs(v.y) < 0.9) { a.classList.add('hidden'); return; }
    a.classList.remove('hidden');
    a.classList.toggle('pick', this.mission.stage === 'pickup');
    const ang = Math.atan2(v.y, v.x);
    const rx = innerWidth * 0.40, ry = innerHeight * 0.38;
    const x = innerWidth / 2 + Math.cos(ang) * rx;
    const y = innerHeight / 2 - Math.sin(ang) * ry;
    a.style.left = x + 'px';
    a.style.top = y + 'px';
    a.style.transform = `translate(-50%,-50%) rotate(${-ang + Math.PI / 2}rad)`;
  }

  drawMinimap() {
    const ctx = this.mmCtx, S = this.el.minimap.width;
    const p = this.player;
    const scale = (S * 0.5) / 780;                 // ~780 m de raio visível
    ctx.clearRect(0, 0, S, S);
    ctx.save();
    ctx.translate(S / 2, S / 2);
    ctx.rotate(-p.h);
    ctx.scale(scale, scale);
    ctx.translate(-p.x, -p.z);

    // quarteirões
    ctx.fillStyle = 'rgba(150,150,160,0.20)';
    const inner = CFG.SPACING / 2 - CFG.ROAD_HALF;
    for (let i = 0; i < CFG.BLOCKS; i++) for (let j = 0; j < CFG.BLOCKS; j++) {
      const cx = -CFG.SPAN / 2 + CFG.SPACING / 2 + i * CFG.SPACING;
      const cz = -CFG.SPAN / 2 + CFG.SPACING / 2 + j * CFG.SPACING;
      ctx.fillRect(cx - inner, cz - inner, inner * 2, inner * 2);
    }
    // ruas
    ctx.strokeStyle = 'rgba(20,22,28,0.95)';
    ctx.lineWidth = CFG.ROAD_HALF * 2;
    const lim = CFG.SPAN / 2 + CFG.ROAD_HALF;
    for (const r of CFG.ROADS) {
      ctx.beginPath(); ctx.moveTo(-lim, r); ctx.lineTo(lim, r); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r, -lim); ctx.lineTo(r, lim); ctx.stroke();
    }
    // tráfego
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (const c of this.traffic.cars) ctx.fillRect(c.x - 2, c.z - 2, 4, 4);

    // missões
    const m = this.mission;
    if (m.target) {
      const col = m.stage === 'pickup' ? '#37e6ff' : '#ff8a2b';
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(m.target.x, m.target.z, 13, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.35;
      ctx.beginPath(); ctx.arc(m.target.x, m.target.z, 26, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // fichas
    ctx.fillStyle = 'rgba(255,196,60,0.85)';
    this.city.coinSpots.forEach((c, i) => {
      if (i % 2) return;
      ctx.fillRect(c.x - 2.5, c.z - 2.5, 5, 5);
    });

    // jogador
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(p.x, p.z - 13);
    ctx.lineTo(p.x + 9, p.z + 11);
    ctx.lineTo(p.x - 9, p.z + 11);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // moldura + rosa dos ventos
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.save(); ctx.translate(S / 2, S / 2); ctx.rotate(-p.h);
    ctx.fillText('N', 0, -S / 2 + 14);
    ctx.restore();
  }

  fatal(msg) {
    this.el.fatalMsg.textContent = msg;
    this.el.fatal.classList.remove('hidden');
  }
}

// ------------------------------------------------------------
function showFatal(msg) {
  const f = document.getElementById('fatal');
  const m = document.getElementById('fatalMsg');
  if (f && m) {
    m.textContent = msg;
    f.classList.remove('hidden');
  }
}
window.addEventListener('error', (e) => {
  showFatal(`[${BUILD}] ${e.message || 'Erro desconhecido'} ` +
    `(linha ${e.lineno || '?'}) — recarregue com Ctrl+Shift+R. ` +
    'Se persistir, mande um print desta tela.');
});
window.addEventListener('unhandledrejection', (e) => {
  showFatal(`[${BUILD}] promessa rejeitada: ${e.reason && e.reason.message || e.reason}`);
});

let game = null;
try {
  game = new Game();
  window.__game = game;                       // útil para depuração
  const tag = document.getElementById('buildTag');
  if (tag) tag.textContent = BUILD;
} catch (err) {
  showFatal(`[${BUILD}] falha ao iniciar: ${err && err.message} — ` +
    'verifique se o navegador suporta WebGL2 e recarregue com Ctrl+Shift+R.');
  throw err;
}
