'use strict';
/* ============================================================
   audio.js — todo o som é sintetizado via WebAudio (sem arquivos):
   motor, derrapagem, sirene, buzina, batida, explosão, dinheiro
   e 3 "estações de rádio" chiptune (funk, rock, eletrônica) — tecla R.
   ============================================================ */
const AUDIO = {
  ctx: null, master: null, engine: null, skid: null, siren: null,
  radioOn: false, station: 0, radioTimer: null, step: 0,
  STATIONS: ['FUNK 8-BIT', 'ROCK RETRÔ', 'ELETRO CIDADE'],

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = .5; this.master.connect(this.ctx.destination);
    // motor: serrinha + filtro
    this.engine = { osc: this.ctx.createOscillator(), g: this.ctx.createGain(), f: this.ctx.createBiquadFilter() };
    this.engine.osc.type = 'sawtooth'; this.engine.f.type = 'lowpass'; this.engine.f.frequency.value = 400;
    this.engine.g.gain.value = 0;
    this.engine.osc.connect(this.engine.f); this.engine.f.connect(this.engine.g); this.engine.g.connect(this.master);
    this.engine.osc.start();
    // derrapagem: ruído filtrado
    const nb = this.noiseBuf();
    this.skid = { src: this.ctx.createBufferSource(), g: this.ctx.createGain(), f: this.ctx.createBiquadFilter() };
    this.skid.src.buffer = nb; this.skid.src.loop = true; this.skid.f.type = 'bandpass'; this.skid.f.frequency.value = 900;
    this.skid.g.gain.value = 0;
    this.skid.src.connect(this.skid.f); this.skid.f.connect(this.skid.g); this.skid.g.connect(this.master);
    this.skid.src.start();
    // sirene: dois tons alternados
    this.siren = { osc: this.ctx.createOscillator(), g: this.ctx.createGain() };
    this.siren.osc.type = 'triangle'; this.siren.g.gain.value = 0;
    this.siren.osc.connect(this.siren.g); this.siren.g.connect(this.master);
    this.siren.osc.start();
  },
  noiseBuf() {
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },

  engineUpdate(speed01, inCar, drifting) {
    if (!this.ctx) return;
    this.engine.g.gain.value = inCar ? .05 + speed01 * .06 : 0;
    this.engine.osc.frequency.value = 55 + speed01 * 160;
    this.skid.g.gain.value = (inCar && drifting) ? .12 : 0;
  },
  sirenUpdate(on) {
    if (!this.ctx) return;
    this.siren.g.gain.value = on ? .05 : 0;
    if (on) this.siren.osc.frequency.value = Math.floor(this.ctx.currentTime * 2) % 2 ? 660 : 880;
  },
  blip(freq, dur, type = 'square', vol = .2) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.master); o.start(); o.stop(this.ctx.currentTime + dur);
  },
  horn() { this.blip(392, .25, 'square', .25); this.blip(494, .25, 'square', .2); },
  crash(p) {
    if (!this.ctx) return;
    const s = this.ctx.createBufferSource(), g = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
    s.buffer = this.noiseBuf(); f.type = 'lowpass'; f.frequency.value = 900;
    g.gain.value = Math.min(.5, .15 + p / 300);
    g.gain.exponentialRampToValueAtTime(.001, this.ctx.currentTime + .3);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(); s.stop(this.ctx.currentTime + .35);
  },
  boom() {
    if (!this.ctx) return;
    const s = this.ctx.createBufferSource(), g = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
    s.buffer = this.noiseBuf(); f.type = 'lowpass'; f.frequency.value = 220;
    g.gain.value = .6; g.gain.exponentialRampToValueAtTime(.001, this.ctx.currentTime + .8);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(); s.stop(this.ctx.currentTime + .9);
    this.blip(60, .7, 'sine', .5);
  },
  cash() { this.blip(880, .09, 'square', .2); setTimeout(() => this.blip(1318, .14, 'square', .2), 90); },
  punch() { this.blip(140, .08, 'triangle', .3); },
  pickup() { this.blip(660, .08, 'square', .2); setTimeout(() => this.blip(990, .1, 'square', .2), 80); },

  /* ---------------- rádio: 3 estações em loop ---------------- */
  radioToggle() {
    if (!this.ctx) return;
    if (this.radioOn) { this.radioOn = false; clearInterval(this.radioTimer); return this.STATIONS[this.station]; }
    this.station = (this.station + 1) % 3;
    this.radioOn = true; this.step = 0;
    this.radioTimer = setInterval(() => this.radioStep(), 60000 / 132 / 2); // colcheias a 132bpm
    return this.STATIONS[this.station];
  },
  radioStep() {
    if (!this.radioOn || !this.ctx) return;
    const s = this.step++, t = this.ctx.currentTime;
    const note = (f, dur, type, vol, when = 0) => {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.value = f; g.gain.value = vol;
      g.gain.exponentialRampToValueAtTime(.001, t + when + dur);
      o.connect(g); g.connect(this.master); o.start(t + when); o.stop(t + when + dur);
    };
    const F = [0, 110, 131, 98, 147, 87, 123, 165]; // "notas" graves
    if (this.station === 0) {            // FUNK 8-BIT: baixo sincopado + chimbal
      const seq = [1, 0, 1, 0, 2, 0, 1, 3, 1, 0, 1, 0, 4, 3, 2, 0];
      if (seq[s % 16]) note(F[seq[s % 16]], .18, 'square', .12);
      if (s % 2 === 0) note(6000, .03, 'square', .02);
      if (s % 8 === 4) note(90, .2, 'sine', .25);         // "bum"
    } else if (this.station === 1) {     // ROCK RETRÔ: riff serra
      const riff = [82, 82, 98, 82, 110, 98, 82, 73, 82, 82, 98, 82, 123, 110, 98, 87];
      note(riff[s % 16] * 2, .14, 'sawtooth', .09);
      if (s % 4 === 0) note(4000, .04, 'square', .03);
    } else {                             // ELETRO: arpejo + bumbo 4/4
      const arp = [220, 277, 330, 440, 330, 277];
      note(arp[s % 6] * (Math.floor(s / 16) % 2 ? 1.5 : 1), .1, 'square', .07);
      if (s % 4 === 0) note(55, .18, 'sine', .3);
    }
  }
};
