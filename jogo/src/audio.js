// ============================================================
//  ÁUDIO 100% sintetizado (WebAudio) — motor, chuva, buzina,
//  impactos, moedas e uma rádio synthwave gerativa
// ============================================================

const SCALE = [0, 3, 5, 7, 10];           // pentatônica menor
const BASS = [0, 0, -4, -5, -7, -7, -4, 0]; // graus (semi-tons relativos)

export class Audio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.radioOn = true;
    this.ready = false;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain();
    this.master.gain.value = 0.85;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 7; comp.attack.value = 0.004;
    this.master.connect(comp); comp.connect(ctx.destination);

    this.noiseBuf = this.makeNoise(2.4);

    // ---------------- motor ----------------
    this.engBus = ctx.createGain(); this.engBus.gain.value = 0;
    this.engFilter = ctx.createBiquadFilter();
    this.engFilter.type = 'lowpass'; this.engFilter.frequency.value = 700; this.engFilter.Q.value = 3;
    this.engBus.connect(this.engFilter); this.engFilter.connect(this.master);

    this.osc1 = ctx.createOscillator(); this.osc1.type = 'sawtooth'; this.osc1.frequency.value = 55;
    this.osc2 = ctx.createOscillator(); this.osc2.type = 'square'; this.osc2.frequency.value = 27.5;
    this.g1 = ctx.createGain(); this.g1.gain.value = 0.5;
    this.g2 = ctx.createGain(); this.g2.gain.value = 0.28;
    this.osc1.connect(this.g1); this.g1.connect(this.engBus);
    this.osc2.connect(this.g2); this.g2.connect(this.engBus);
    this.osc1.start(); this.osc2.start();

    // ruído de motor/aspiração
    this.engNoise = ctx.createBufferSource();
    this.engNoise.buffer = this.noiseBuf; this.engNoise.loop = true;
    this.engNoiseF = ctx.createBiquadFilter();
    this.engNoiseF.type = 'bandpass'; this.engNoiseF.frequency.value = 900; this.engNoiseF.Q.value = 0.8;
    this.engNoiseG = ctx.createGain(); this.engNoiseG.gain.value = 0.12;
    this.engNoise.connect(this.engNoiseF); this.engNoiseF.connect(this.engNoiseG);
    this.engNoiseG.connect(this.engBus);
    this.engNoise.start();

    // ---------------- chuva ----------------
    this.rainSrc = ctx.createBufferSource();
    this.rainSrc.buffer = this.noiseBuf; this.rainSrc.loop = true;
    this.rainF = ctx.createBiquadFilter(); this.rainF.type = 'highpass'; this.rainF.frequency.value = 620;
    this.rainG = ctx.createGain(); this.rainG.gain.value = 0.0;
    this.rainSrc.connect(this.rainF); this.rainF.connect(this.rainG); this.rainG.connect(this.master);
    this.rainSrc.start();

    // ---------------- derrapagem ----------------
    this.skidSrc = ctx.createBufferSource();
    this.skidSrc.buffer = this.noiseBuf; this.skidSrc.loop = true;
    this.skidF = ctx.createBiquadFilter(); this.skidF.type = 'bandpass';
    this.skidF.frequency.value = 1750; this.skidF.Q.value = 1.4;
    this.skidG = ctx.createGain(); this.skidG.gain.value = 0;
    this.skidSrc.connect(this.skidF); this.skidF.connect(this.skidG); this.skidG.connect(this.master);
    this.skidSrc.start();

    // rádio
    this.musicBus = ctx.createGain(); this.musicBus.gain.value = 0.0;
    this.musicF = ctx.createBiquadFilter(); this.musicF.type = 'lowpass'; this.musicF.frequency.value = 5200;
    this.musicBus.connect(this.musicF); this.musicF.connect(this.master);
    this.step = 0; this.nextTime = ctx.currentTime + 0.1; this.bpm = 104;

    this.ready = true;
    this.setRain(0.75);
    this.setRadio(this.radioOn);
    this.schedule();
  }

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }

  makeNoise(sec) {
    const ctx = this.ctx;
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sec), ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = w * 0.7 + last * 3;
    }
    return b;
  }

  setEnabled(v) {
    this.enabled = v;
    if (this.master) this.master.gain.setTargetAtTime(v ? 0.85 : 0, this.ctx.currentTime, 0.05);
  }

  setRain(v) { if (this.rainG) this.rainG.gain.setTargetAtTime(0.055 * v, this.ctx.currentTime, 0.4); }

  setRadio(v) {
    this.radioOn = v;
    if (this.musicBus) this.musicBus.gain.setTargetAtTime(v ? 0.17 : 0, this.ctx.currentTime, 0.3);
  }

  // ---------- motor ----------
  engine(speedN, throttle, slip) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const f = 42 + speedN * 168 + (throttle ? 22 : 0);
    this.osc1.frequency.setTargetAtTime(f, t, 0.06);
    this.osc2.frequency.setTargetAtTime(f * 0.5, t, 0.06);
    this.engFilter.frequency.setTargetAtTime(420 + speedN * 2400 + throttle * 700, t, 0.08);
    this.engBus.gain.setTargetAtTime(0.075 + speedN * 0.1 + throttle * 0.055, t, 0.08);
    this.engNoiseG.gain.setTargetAtTime(0.05 + speedN * 0.16, t, 0.1);
    this.skidG.gain.setTargetAtTime(slip * 0.2, t, 0.05);
  }

  silenceEngine() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.engBus.gain.setTargetAtTime(0, t, 0.1);
    this.skidG.gain.setTargetAtTime(0, t, 0.1);
  }

  // ---------- efeitos ----------
  blip(freq, dur, type = 'sine', vol = 0.25, glide = 0) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = type;
    const g = this.ctx.createGain();
    o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + glide), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.03);
  }

  noiseBurst(dur, vol, freq, type = 'bandpass') {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = 0.7;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    f.frequency.exponentialRampToValueAtTime(Math.max(90, freq * 0.35), t + dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t); s.stop(t + dur + 0.05);
  }

  crash(power = 1) {
    this.noiseBurst(0.45 * power + 0.18, 0.5 * power + 0.12, 900);
    this.blip(90, 0.3, 'triangle', 0.3 * power, -50);
  }
  coin() { this.blip(1180, 0.09, 'square', 0.16); setTimeout(() => this.blip(1760, 0.14, 'square', 0.14), 70); }
  pickup() {
    this.blip(520, 0.12, 'triangle', 0.22);
    setTimeout(() => this.blip(780, 0.18, 'triangle', 0.2), 90);
  }
  deliver(combo = 1) {
    const base = 523;
    [0, 4, 7, 12].forEach((s, i) => setTimeout(() =>
      this.blip(base * Math.pow(2, s / 12) * (1 + combo * 0.02), 0.3, 'triangle', 0.2), i * 72));
  }
  ui() { this.blip(660, 0.06, 'square', 0.1); }
  count(hi) { this.blip(hi ? 880 : 440, hi ? 0.4 : 0.16, 'square', 0.2); }
  horn(on) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    if (on && !this._horn) {
      const o1 = this.ctx.createOscillator(), o2 = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o1.type = o2.type = 'sawtooth';
      o1.frequency.value = 392; o2.frequency.value = 494;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.2, t + 0.03);
      o1.connect(g); o2.connect(g); g.connect(this.master);
      o1.start(t); o2.start(t);
      this._horn = { o1, o2, g };
    } else if (!on && this._horn) {
      const { o1, o2, g } = this._horn;
      g.gain.setTargetAtTime(0, t, 0.04);
      setTimeout(() => { try { o1.stop(); o2.stop(); } catch (e) { /* noop */ } }, 160);
      this._horn = null;
    }
  }

  // ---------- rádio generativa ----------
  schedule() {
    if (!this.ready) return;
    if (!this.radioOn || !this.enabled) {
      this.nextTime = Math.max(this.nextTime, this.ctx.currentTime + 0.05);
      this._timer = setTimeout(() => this.schedule(), 220);
      return;
    }
    const spb = 60 / this.bpm / 2;          // colcheia
    while (this.nextTime < this.ctx.currentTime + 0.25) {
      this.playStep(this.step, this.nextTime);
      this.step = (this.step + 1) % 64;
      this.nextTime += spb;
    }
    this._timer = setTimeout(() => this.schedule(), 90);
  }

  playStep(s, t) {
    const ctx = this.ctx;
    const root = 55;                          // A1
    const bar = Math.floor(s / 16);
    const inBar = s % 16;

    // --- baixo ---
    if (inBar % 4 === 0 || (inBar === 6) || (inBar === 11 && bar % 2)) {
      const semi = BASS[(bar * 2 + Math.floor(inBar / 4)) % BASS.length];
      const f = root * Math.pow(2, semi / 12);
      this.tone(t, f, 0.24, 'sawtooth', 0.34, 380);
    }
    // --- bumbo ---
    if (inBar % 4 === 0) this.kick(t);
    // --- caixa ---
    if (inBar === 4 || inBar === 12) this.snare(t);
    // --- chimbal ---
    if (inBar % 2 === 1) this.hat(t, inBar % 4 === 3 ? 0.09 : 0.05);
    // --- arpejo ---
    if (s % 2 === 1 && bar % 2 === 1) {
      const deg = SCALE[(s * 3 + bar) % SCALE.length];
      const oct = 4 + ((s >> 3) % 2);
      const f = root * Math.pow(2, (deg + 12 * oct) / 12);
      this.tone(t, f, 0.16, 'square', 0.055, 3200);
    }
    // --- pad ---
    if (s % 32 === 0) {
      [0, 7, 12, 15].forEach((d, i) => {
        const f = root * 4 * Math.pow(2, (d + BASS[bar % BASS.length]) / 12);
        this.pad(t + i * 0.02, f, 2.2);
      });
    }
    void ctx;
  }

  tone(t, freq, dur, type, vol, cutoff) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(cutoff, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(120, cutoff * 0.35), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(f); f.connect(g); g.connect(this.musicBus);
    o.start(t); o.stop(t + dur + 0.05);
  }

  pad(t, freq, dur) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq;
    o.detune.value = (Math.random() - 0.5) * 14;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1500; f.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.045, t + dur * 0.35);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(this.musicBus);
    o.start(t); o.stop(t + dur + 0.1);
  }

  kick(t) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g); g.connect(this.musicBus);
    o.start(t); o.stop(t + 0.24);
  }

  snare(t) {
    const ctx = this.ctx;
    const s = ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    s.connect(f); f.connect(g); g.connect(this.musicBus);
    s.start(t); s.stop(t + 0.2);
  }

  hat(t, vol) {
    const ctx = this.ctx;
    const s = ctx.createBufferSource(); s.buffer = this.noiseBuf;
    s.playbackRate.value = 1.8;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    s.connect(f); f.connect(g); g.connect(this.musicBus);
    s.start(t); s.stop(t + 0.08);
  }
}
