/* ============================================================
   audio.js — todos os sons são sintetizados (WebAudio):
   motor, pneu, batida, sirene, buzina e 3 rádios (funk, rock, eletrônica)
   ============================================================ */
(function (G) {
  'use strict';
  let ac = null, master, sfx, music, muted = false;
  let eng = null, screech = null, siren = null, horn = null;
  let noiseBuf = null;
  const STATIONS = ['RÁDIO DESLIGADO', 'FUNK FM 88.1', 'ROCK 94.5', 'ELETRÔNICA 101.3'];
  let station = 0, nextBeat = 0, step = 0, bpm = 130;

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.7; master.connect(ac.destination);
    sfx = ac.createGain(); sfx.gain.value = 0.8; sfx.connect(master);
    music = ac.createGain(); music.gain.value = 0.26; music.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // motor
    const o1 = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = 0;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(sfx); o1.start(); o2.start();
    eng = { o1, o2, f, g };
    // pneu cantando
    const ns = ac.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1600; bp.Q.value = 3;
    const sg = ac.createGain(); sg.gain.value = 0; ns.connect(bp); bp.connect(sg); sg.connect(sfx); ns.start();
    screech = { g: sg };
    // sirene
    const so = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), sgn = ac.createGain();
    so.type = 'triangle'; so.frequency.value = 780; lfo.frequency.value = 1.6; lg.gain.value = 170; sgn.gain.value = 0;
    lfo.connect(lg); lg.connect(so.frequency); so.connect(sgn); sgn.connect(sfx); so.start(); lfo.start();
    siren = { g: sgn };
    // buzina
    const h1 = ac.createOscillator(), h2 = ac.createOscillator(), hg = ac.createGain();
    h1.type = 'sawtooth'; h2.type = 'sawtooth'; h1.frequency.value = 392; h2.frequency.value = 494; hg.gain.value = 0;
    const hf = ac.createBiquadFilter(); hf.type = 'lowpass'; hf.frequency.value = 1400;
    h1.connect(hf); h2.connect(hf); hf.connect(hg); hg.connect(sfx); h1.start(); h2.start();
    horn = { g: hg };
  }

  function noiseBurst(dur, freq, vol, type) {
    if (!ac || muted) return;
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq;
    const g = ac.createGain(); const t = ac.currentTime;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfx); s.start(t, Math.random() * 0.5, dur + 0.05);
  }
  function tone(freq, dur, vol, type, when, dest, slide) {
    if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain(); const t = when != null ? when : ac.currentTime;
    o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest || sfx); o.start(t); o.stop(t + dur + 0.02);
  }

  const snd = {
    init,
    crash(v) { noiseBurst(0.25 + v * 0.3, 900 + v * 600, 0.3 + v * 0.6); tone(90, 0.2, 0.4 * v + 0.1, 'sine', null, null, 40); },
    boom() { noiseBurst(1.3, 500, 1.0); tone(80, 1, 0.8, 'sine', null, null, 25); },
    punch() { noiseBurst(0.08, 1800, 0.5); tone(160, 0.1, 0.4, 'square', null, null, 60); },
    bonk() { tone(300, 0.12, 0.3, 'triangle', null, null, 120); noiseBurst(0.08, 600, 0.3); },
    // ----- violência (versão 2) -----
    gun(kind, v) {
      v = v == null ? 1 : v; if (!ac || muted || v < 0.05) return;
      if (kind === 'shotgun') { noiseBurst(0.38, 1400, 1.0 * v); tone(120, 0.3, 0.7 * v, 'sine', null, null, 35); }
      else if (kind === 'smg') { noiseBurst(0.09, 2600, 0.55 * v); tone(260, 0.07, 0.3 * v, 'square', null, null, 90); }
      else { noiseBurst(0.14, 3200, 0.75 * v); tone(220, 0.12, 0.45 * v, 'square', null, null, 60); noiseBurst(0.3, 700, 0.15 * v); }
    },
    scream(v) { // grito curto (oscilador com vibrato rápido)
      v = v == null ? 1 : v; if (!ac || muted || v < 0.08) return;
      const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(700 + Math.random() * 300, t); o.frequency.exponentialRampToValueAtTime(380, t + 0.45);
      l.frequency.value = 22; lg.gain.value = 40; l.connect(lg); lg.connect(o.frequency);
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 1.2;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22 * v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      o.connect(f); f.connect(g); g.connect(sfx); o.start(t); l.start(t); o.stop(t + 0.55); l.stop(t + 0.55);
    },
    hurt() { tone(170, 0.14, 0.3, 'sawtooth', null, null, 90); noiseBurst(0.06, 900, 0.25); },
    thud() { tone(70, 0.16, 0.5, 'sine', null, null, 35); noiseBurst(0.07, 400, 0.35); },
    swing() { noiseBurst(0.12, 1200, 0.25, 'bandpass'); },
    empty() { tone(1500, 0.03, 0.15, 'square'); },
    beep() { tone(880, 0.1, 0.25, 'square'); },
    pick() { const t = ac ? ac.currentTime : 0; tone(660, 0.1, 0.25, 'square', t); tone(990, 0.15, 0.25, 'square', t + 0.1); },
    win() { const t = ac ? ac.currentTime : 0;[523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 0.28, 'square', t + i * 0.12)); },
    fail() { const t = ac ? ac.currentTime : 0;[392, 330, 262].forEach((f, i) => tone(f, 0.3, 0.3, 'sawtooth', t + i * 0.18)); },
    cash() { const t = ac ? ac.currentTime : 0; tone(1200, 0.08, 0.2, 'square', t); tone(1600, 0.14, 0.2, 'square', t + 0.08); },
    door() { noiseBurst(0.07, 500, 0.4); },
    count() { tone(520, 0.15, 0.3, 'square'); }, go() { tone(1040, 0.4, 0.3, 'square'); },
    mute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.7; return muted; },
    isMuted: () => muted,
    honk(vol) { if (!ac || muted) return; const t = ac.currentTime, g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07 * Math.max(0.1, vol), t + 0.02); g.gain.setValueAtTime(0.07 * Math.max(0.1, vol), t + 0.32); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); [350, 440].forEach(f => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f + Math.random() * 20; o.connect(g); o.start(t); o.stop(t + 0.42); }); g.connect(sfx); },
    station() { return station; }, stationName() { return STATIONS[station]; },
    nextStation() { station = (station + 1) % STATIONS.length; step = 0; nextBeat = 0; bpm = [130, 130, 124, 126][station]; return STATIONS[station]; },

    // chamado todo quadro
    update(st) {
      if (!ac) return;
      const t = ac.currentTime;
      // motor
      if (st.inCar && st.car) {
        const r = Math.min(1, Math.abs(st.car.vf) / st.car.max);
        eng.g.gain.setTargetAtTime(0.05 + 0.08 * r + 0.03 * Math.max(0, st.car.thr), t, 0.05);
        const f = 48 + r * 150 + (st.car.thr > 0 ? 12 : 0);
        eng.o1.frequency.setTargetAtTime(f, t, 0.05); eng.o2.frequency.setTargetAtTime(f * 0.5, t, 0.05);
        eng.f.frequency.setTargetAtTime(300 + r * 900, t, 0.1);
        screech.g.gain.setTargetAtTime(Math.min(0.22, Math.max(0, (Math.abs(st.car.vr) - 70) / 500)) * (st.car.onGrass ? 0 : 1), t, 0.04);
        horn.g.gain.setTargetAtTime(st.horn ? 0.09 : 0, t, 0.02);
      } else {
        eng.g.gain.setTargetAtTime(0, t, 0.1); screech.g.gain.setTargetAtTime(0, t, 0.05); horn.g.gain.setTargetAtTime(0, t, 0.02);
      }
      siren.g.gain.setTargetAtTime(st.sirenVol * 0.07, t, 0.15);
      // rádio
      music.gain.setTargetAtTime(st.inCar && station > 0 && !muted ? 0.26 : (station > 0 ? 0.05 : 0), t, 0.2);
      if (station > 0) schedule();
    },
  };

  // ----- sequenciador simples -----
  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
  function kick(t) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15); g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2); o.connect(g); g.connect(music); o.start(t); o.stop(t + 0.22); }
  function nz(t, dur, hp, vol) { const s = ac.createBufferSource(); s.buffer = noiseBuf; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(f); f.connect(g); g.connect(music); s.start(t, Math.random(), dur + 0.02); }
  function nt(t, n, dur, type, vol, lp) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = NOTE(n);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    if (lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); f.connect(g); } else o.connect(g);
    g.connect(music); o.start(t); o.stop(t + dur + 0.02);
  }
  const FUNK_BASS = [45, 0, 0, 45, 0, 0, 48, 0, 0, 43, 0, 45, 0, 0, 40, 0];
  const FUNK_LEAD = [0, 0, 69, 0, 72, 0, 0, 69, 0, 0, 67, 0, 64, 0, 0, 0];
  const FUNK_KICK = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0];
  const FUNK_SN = [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0];
  const ROCK_ROOT = [40, 40, 36, 38, 40, 40, 43, 38];
  const ELEC_ARP = [57, 64, 69, 64, 60, 67, 72, 67, 55, 62, 67, 62, 59, 66, 71, 66];
  function schedule() {
    const spb = 60 / bpm / 4;
    if (nextBeat < ac.currentTime) nextBeat = ac.currentTime + 0.05;
    while (nextBeat < ac.currentTime + 0.25) {
      const t = nextBeat, s = step % 16, bar = Math.floor(step / 16);
      if (station === 1) {
        if (FUNK_KICK[s]) kick(t); if (FUNK_SN[s]) nz(t, 0.12, 1200, 0.6); if (s % 2 === 0) nz(t, 0.04, 6000, 0.25);
        if (FUNK_BASS[s]) nt(t, FUNK_BASS[s] + (bar % 4 === 3 ? 2 : 0), spb * 2.2, 'sawtooth', 0.5, 400);
        if (FUNK_LEAD[s] && bar % 2 === 1) nt(t, FUNK_LEAD[s], spb * 1.6, 'square', 0.16, 2500);
      } else if (station === 2) {
        if (s === 0 || s === 8 || s === 10) kick(t); if (s === 4 || s === 12) nz(t, 0.15, 900, 0.7); if (s % 2 === 0) nz(t, 0.05, 7000, 0.22);
        if (s % 4 === 0 || s === 6 || s === 14) { const r = ROCK_ROOT[bar % 8]; nt(t, r, spb * 3, 'sawtooth', 0.22, 1800); nt(t, r + 7, spb * 3, 'sawtooth', 0.18, 1800); nt(t, r + 12, spb * 3, 'sawtooth', 0.12, 1800); }
        if (s === 0 && bar % 2 === 1) nt(t, 76, spb * 6, 'square', 0.1, 3000);
      } else {
        if (s % 4 === 0) kick(t); if (s % 4 === 2) nz(t, 0.05, 7000, 0.3); if (s === 4 || s === 12) nz(t, 0.12, 1500, 0.4);
        nt(t, ELEC_ARP[s] + (bar % 4 >= 2 ? -2 : 0), spb * 1.4, 'sawtooth', 0.18, 1200 + (bar % 4) * 600);
        if (s === 0) nt(t, 33 + (bar % 4 >= 2 ? -2 : 0), spb * 8, 'sine', 0.6);
      }
      nextBeat += spb; step++;
    }
  }
  G.snd = snd;
})(window.G = window.G || {});
