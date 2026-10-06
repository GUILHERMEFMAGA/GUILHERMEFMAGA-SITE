/* SOBRENATURAL — Noite 1: Estrada 66 (engine v3.0 — MODO ENGENHEIRO:
 * fixed timestep 60Hz · screen shake · hitstop · IA de flanqueio · curva de
 * dificuldade · recorde em localStorage · tecla M muta o som)
 * Controles: setas/WASD mover · SHIFT correr · C agachar · K pular ·
 * ESPAÇO/J atirar · R recarregar (perto do Impala reabastece) · P/ESC pausa · ENTER avança
 */
"use strict";

const W = 1536, H = 1024;
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const TESTE = typeof window !== "undefined" && !!window.__TESTE;

/* ---------- assets ---------- */
const SRC = {
  plate: "sprites/plate.png", dante: "sprites/dante.png", luca: "sprites/luca.png",
  ghostA: "sprites/ghost_a.png", ghostB: "sprites/ghost_b.png",
  heart: "sprites/heart.png", shell: "sprites/shell.png", dagger: "sprites/dagger.png",
  skull: "sprites/skull.png", banner: "sprites/banner.png", pontos: "sprites/pontos.png",
  cover: "../assets/sobrenatural-pixel.png",
  // poses Dante
  dWalkA: "sprites2/d-walkA.png", dWalkB: "sprites2/d-walkB.png",
  dRunA: "sprites2/d-runA.png", dRunB: "sprites2/d-runB.png",
  dRunC: "sprites2/d-runC.png", dRunD: "sprites2/d-runD.png",
  dAim: "sprites2/d-aim.png", dFire: "sprites2/d-fire.png", dReload: "sprites2/d-reload.png",
  dHurt: "sprites2/d-hurt.png", dCrouch: "sprites2/d-crouch.png", dJump: "sprites2/d-jump.png",
  // poses Luca
  lWalkA: "sprites2/l-walkA.png", lWalkB: "sprites2/l-walkB.png",
  lRunA: "sprites2/l-runA.png", lRunB: "sprites2/l-runB.png",
  lRunC: "sprites2/l-runC.png", lRunD: "sprites2/l-runD.png",
  lPrep: "sprites2/l-prep.png", lThrust: "sprites2/l-thrust.png",
  lHurt: "sprites2/l-hurt.png", lCrouch: "sprites2/l-crouch.png", lJump: "sprites2/l-jump.png",
  // inimigos
  eEsp: "sprites2/e-espectro.png", eEspAtk: "sprites2/e-espectro-atk.png",
  eCao: "sprites2/e-cao.png", eCaoB: "sprites2/e-cao-b.png",
  eVulto: "sprites2/e-vulto.png", eVultoAtk: "sprites2/e-vulto-atk.png",
  // malphas
  mIdle: "sprites2/m-idle.png", mAtk: "sprites2/m-atk.png", mDef: "sprites2/m-def.png",
  // itens / retratos / cenarios
  iSal: "sprites2/i-sal.png", iDiario: "sprites2/i-diario.png",
  pDn: "sprites2/p-d-neutro.png", pDr: "sprites2/p-d-raiva.png",
  pDd: "sprites2/p-d-dor.png", pDs: "sprites2/p-d-sorriso.png",
  pLn: "sprites2/p-l-neutro.png", pLr: "sprites2/p-l-raiva.png",
  pLd: "sprites2/p-l-dor.png", pLs: "sprites2/p-l-sorriso.png",
  bgImpala: "sprites2/bg-impala.png", bgQuarto: "sprites2/bg-quarto.png",
  bgFloresta: "sprites2/bg-floresta.png",
  bgCidade: "sprites2/bg-cidade.png", bgPorta: "sprites2/bg-porta.png",
  boss2: "sprites2/boss2-idle.png", eNeon: "sprites2/e-neon.png",
};
const img = {};
let loaded = 0, total = Object.keys(SRC).length, loadError = null, booted = false;
function maybeBoot() { if (!booted) { booted = true; boot(); } }
for (const [k, url] of Object.entries(SRC)) {
  const i = new Image();
  i.onload = () => { if (++loaded === total) maybeBoot(); };
  i.onerror = () => {
    // resiliente: sprite que falhar no CDN vira placeholder e o jogo carrega mesmo assim
    const c = document.createElement("canvas"); c.width = 64; c.height = 64;
    const g = c.getContext("2d");
    g.fillStyle = "#2a1028"; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = "#ff4a4a"; g.lineWidth = 3; g.strokeRect(2, 2, 60, 60);
    img[k] = c; maybeBoot();
  };
  i.src = url;
  img[k] = i;
}

/* ---------- áudio ---------- */
let AC = null;
function ac() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); return AC; }
function beep(freq, dur, type = "square", vol = 0.12, slide = 0) {
  if (muted) return;
  try {
    const a = ac(), o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, a.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), a.currentTime + dur);
    g.gain.setValueAtTime(vol, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + dur + 0.02);
  } catch (e) { /* sem áudio */ }
}
const sfx = {
  shot: () => { beep(190, 0.14, "square", 0.16, -120); beep(90, 0.2, "sawtooth", 0.12, -50); },
  empty: () => beep(700, 0.05, "square", 0.06),
  reload: () => { beep(500, 0.05, "square", 0.08); setTimeout(() => beep(700, 0.05, "square", 0.08), 120); },
  hit: () => beep(320, 0.08, "square", 0.1, -80),
  banish: () => beep(520, 0.3, "sine", 0.12, 700),
  hurt: () => beep(120, 0.35, "sawtooth", 0.16, -60),
  slash: () => beep(900, 0.09, "triangle", 0.1, -300),
  start: () => { beep(440, 0.12, "square", 0.1); setTimeout(() => beep(660, 0.16, "square", 0.1), 130); },
  end: () => beep(60, 1.2, "sine", 0.2, -20),
  pick: () => beep(880, 0.09, "square", 0.1, 220),
  boss: () => { beep(70, 0.8, "sawtooth", 0.18, -20); },
  jump: () => beep(300, 0.12, "square", 0.08, 250),
};

let muted = false, shake = 0, hitstop = 0, acc = 0;
function bestPoints() { try { return +localStorage.getItem("sobrenatural_best") || 0; } catch (e) { return 0; } }
function saveBest() { try { const b = bestPoints(); if (game.points > b) localStorage.setItem("sobrenatural_best", game.points); } catch (e) {} }

/* ---------- estado ---------- */
const ST = { state: "title", paused: false, t: 0, cut: 0, night: 1 };
const game = {};
const IMPALA = { x: 265, y: 700 };   // centro do Impala na plate

const CUTSCENE = [
  { bg: "bgImpala", who: null, txt: "1996. A Relíquia corta a noite na Estrada 66…" },
  { bg: "bgQuarto", who: "l", expr: "neutro", nome: "LUCA", txt: "O diário do pai fala deste motel. “Quando o neon pisca três vezes, alguém some.”" },
  { bg: "bgQuarto", who: "d", expr: "raiva", nome: "DANTE", txt: "Então a gente chega antes da terceira. Pega a escopeta." },
  { bg: "bgQuarto", who: "l", expr: "sorriso", nome: "LUCA", txt: "Regra número um: nunca se separam." },
  { bg: "bgQuarto", who: "d", expr: "neutro", nome: "DANTE", txt: "Cala a boca e recarrega." },
];

const CUT2 = [
  { bg: "bgImpala", who: "d", expr: "raiva", nome: "DANTE", txt: "O rádio voltou a tocar ao contrário. A cidade inteira ouviu o cadeado quebrar." },
  { bg: "bgCidade", who: "l", expr: "dor", nome: "LUCA", txt: "Eu sonho com ela toda noite… 3h07. Todos dormem em pé, e algo anda entre eles." },
  { bg: "bgCidade", who: "d", expr: "neutro", nome: "DANTE", txt: "Então a gente acorda a cidade antes disso. Perto de mim. Sempre." },
];

function resetGame(night) {
  const kp = game.points, kh = game.hearts;
  ST.night = night || 1;
  game.hearts = 3; game.ammo = 6; game.reserve = 24;
  game.points = 1250; game.kills = 0;
  game.boss = ST.night === 2 ? 180 : 160; game.bossOn = false; game.bossDead = false;
  game.invuln = 0; game.reloadT = 0; game.shootCd = 0; game.shootAnim = 0;
  game.flashRed = 0; game.muzzle = 0; game.spawnT = 2.0; game.hintT = 8;
  game.jumpT = 0; game.crouch = false; game.step = 0;
  game.dante = { x: 562, y: 865, face: 1 };
  game.luca = { x: 962, y: 860, face: -1, slashCd: 0, atkT: 0, step: 0 };
  game.ghosts = []; game.pellets = []; game.fx = []; game.pickups = [];
  game.pickT = 8;
  if (ST.night === 2) { game.points = kp || 0; game.hearts = Math.max(3, kh || 3); game.reserve = 24; game.boss = 180; game.spawnT = 1.8; }
  game.malphas = { x: 768, y: 260, t: 0, atkT: 0, vuln: 0, dying: 0, warnT: 0, atkAnim: 0 };
}
resetGame();

/* ---------- input ---------- */
const keys = {};
const GAMEKEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space",
  "KeyW", "KeyA", "KeyS", "KeyD", "KeyJ", "KeyX", "KeyR", "KeyP", "Escape", "Enter",
  "ShiftLeft", "ShiftRight", "KeyC", "KeyK"];
addEventListener("keydown", (e) => {
  if (e.code === "KeyM") { muted = !muted; }
  if (GAMEKEYS.includes(e.code)) e.preventDefault();
  if (!keys[e.code]) onPress(e.code);
  keys[e.code] = true; ac();
});
addEventListener("keyup", (e) => { keys[e.code] = false; });
canvas.addEventListener("pointerdown", () => { ac(); onPress("Enter"); });

function onPress(code) {
  if (ST.state === "title" && (code === "Enter" || code === "Space")) {
    resetGame(); ST.state = "cut"; ST.cut = 0; sfx.start(); return;
  }
  if (ST.state === "cut" && code === "Enter") {
    ST.cut++;
    const arr = ST.night === 2 ? CUT2 : CUTSCENE;
    if (ST.cut >= arr.length) { ST.state = "play"; }
    return;
  }
  if (ST.state === "end1" && code === "Enter") { resetGame(2); ST.state = "cut"; ST.cut = 0; sfx.start(); return; }
  if (ST.state === "dead" && code === "Enter") {
    game.hearts = 3; game.invuln = 2; game.flashRed = 0;
    game.ghosts.forEach(g => g.dying = 0.01);
    game.dante = { x: 562, y: 865, face: 1 };
    game.luca = { x: 962, y: 860, face: -1, slashCd: 0, atkT: 0, step: 0 };
    ST.state = "play"; sfx.start(); return;
  }
  if (ST.state === "end" && code === "Enter") { ST.state = "title"; return; }
  if (ST.state === "play" && (code === "KeyP" || code === "Escape")) {
    ST.paused = !ST.paused; beep(300, 0.08, "square", 0.08); return;
  }
  if (ST.state === "play" && !ST.paused) {
    if (code === "KeyR") startReload();
    if (code === "KeyK" && game.jumpT <= 0 && !game.crouch) { game.jumpT = 0.5; sfx.jump(); }
  }
}

function nearImpala() {
  const d = game.dante;
  return Math.abs(d.x - IMPALA.x) < 240 && Math.abs(d.y - IMPALA.y) < 260;
}
function startReload() {
  if (game.reloadT > 0 || game.ammo >= 6) return;
  if (nearImpala() && game.reserve < 24) { game.reserve = 24; sfx.pick(); }
  if (game.reserve <= 0) return;
  game.reloadT = 1.2; sfx.reload();
}

/* ---------- update ---------- */
function update(dt) {
  ST.t += dt;
  if (shake > 0) shake = Math.max(0, shake - dt * 30);
  if (game.fx.length > 220) game.fx.splice(0, game.fx.length - 220);
  if (ST.state !== "play" || ST.paused) return;
  const d = game.dante, l = game.luca;

  // movimento
  game.crouch = !!keys.KeyC && game.jumpT <= 0;
  let vx = 0, vy = 0;
  if (keys.ArrowLeft || keys.KeyA) vx -= 1;
  if (keys.ArrowRight || keys.KeyD) vx += 1;
  if (keys.ArrowUp || keys.KeyW) vy -= 1;
  if (keys.ArrowDown || keys.KeyS) vy += 1;
  if (vx && vy) { vx *= 0.7071; vy *= 0.7071; }
  const run = (keys.ShiftLeft || keys.ShiftRight) && !game.crouch;
  const spd = game.crouch ? 110 : run ? 460 : 300;
  d.x += vx * spd * dt; d.y += vy * spd * 0.85 * dt;
  d.x = Math.max(140, Math.min(1440, d.x));
  d.y = Math.max(640, Math.min(990, d.y));
  if (vx) d.face = vx > 0 ? 1 : -1;
  if (vx || vy) game.step += dt * (run ? 11 : 6);
  game.moving = !!(vx || vy); game.run = run;

  // pulo
  if (game.jumpT > 0) game.jumpT -= dt;

  // recarga / tiro
  if (game.reloadT > 0) {
    game.reloadT -= dt;
    if (game.reloadT <= 0) {
      const take = Math.min(6 - game.ammo, game.reserve);
      game.ammo += take; game.reserve -= take;
    }
  }
  game.shootCd -= dt; game.shootAnim -= dt; game.muzzle -= dt;
  if ((keys.Space || keys.KeyJ || keys.KeyX) && game.shootCd <= 0 && game.reloadT <= 0 && !game.crouch) {
    if (game.ammo > 0) {
      game.ammo--; game.shootCd = 0.5; game.shootAnim = 0.4; game.muzzle = 0.09; sfx.shot(); shake = Math.max(shake, 3);
      for (const s of [-0.09, 0, 0.09]) {
        game.pellets.push({ x: d.x + d.face * 70, y: d.y - 190, vx: d.face * 820, vy: s * 820, life: 0.8 });
      }
    } else { game.shootCd = 0.3; sfx.empty(); }
  }

  // Luca IA
  l.slashCd -= dt; l.atkT -= dt;
  let target = null, best = 1e9;
  for (const g of game.ghosts) {
    if (g.dying) continue;
    const dist = Math.hypot(g.x - l.x, g.y - l.y);
    if (dist < best) { best = dist; target = g; }
  }
  let tx = d.x + 150, ty = d.y;
  if (target && best < 340) { tx = target.x; ty = target.y; }
  const dx = tx - l.x, dy = ty - l.y, dl = Math.hypot(dx, dy) || 1;
  l.moving = dl > 24;
  if (dl > 24) {
    l.x += (dx / dl) * 250 * dt; l.y += (dy / dl) * 220 * dt;
    l.face = dx > 0 ? 1 : -1; l.step += dt * (l.moving && best < 340 ? 11 : 6);
  }
  l.x = Math.max(140, Math.min(1440, l.x));
  l.y = Math.max(640, Math.min(990, l.y));
  if (target && best < 110 && l.slashCd <= 0) {
    l.slashCd = 0.8; l.atkT = 0.5; sfx.slash();
    game.fx.push({ kind: "slash", x: target.x, y: target.y - 60, t: 0.18, face: l.face });
    damageGhost(target, 2);
  }

  // balotes
  for (const p of game.pellets) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    for (const g of game.ghosts) {
      if (g.dying) continue;
      if (Math.abs(p.x - g.x) < g.hw && Math.abs(p.y - (g.y - 60)) < g.hh) {
        p.life = 0; damageGhost(g, 1); break;
      }
    }
    // acerta o Malphas vulneravel
    const m = game.malphas;
    if (game.bossOn && !game.bossDead && m.vuln > 0 &&
        Math.abs(p.x - m.x) < 130 && Math.abs(p.y - (m.y - 200)) < 220) {
      p.life = 0; damageBoss(3);
    }
  }
  game.pellets = game.pellets.filter(p => p.life > 0 && p.x > -50 && p.x < W + 50);

  // inimigos
  for (const g of game.ghosts) {
    if (g.dying) { g.dying += dt; continue; }
    g.atkT = (g.atkT || 0) - dt;
    // IA de flanqueio: aproxima por ponto deslocado, converge de perto
    const gx = d.x - g.x, gy0 = (d.y - 80) - g.y;
    const near = Math.hypot(gx, gy0) < 150;
    const gy = gy0 + (near ? 0 : (g.seed > 3.5 ? 70 : -70));
    const gl = Math.hypot(gx, gy) || 1;
    if (near && g.atkT <= -0.4) g.atkT = 0.35;              // janela de ataque
    const sp = (g.atkT > 0 ? g.sp * 1.6 : g.sp);
    g.x += (gx / gl) * sp * dt; g.y += (gy / gl) * sp * 0.6 * dt;
    g.dir = gx > 0 ? 1 : -1;
    const air = game.jumpT > 0.12;                          // pulo esquiva
    if (!air && game.invuln <= 0 && Math.abs(g.x - d.x) < 70 && Math.abs(g.y - (d.y - 80)) < 110) {
      game.hearts--; game.invuln = 2.2; game.flashRed = 0.35; sfx.hurt(); shake = Math.max(shake, 8);
      if (game.hearts <= 0) { saveBest(); ST.state = "dead"; sfx.end(); }
    }
  }
  game.ghosts = game.ghosts.filter(g => !(g.dying && g.dying > 0.6));

  // spawn mix de inimigos
  if (!TESTE) { game.spawnT -= dt;
  if (game.spawnT <= 0 && game.ghosts.filter(g => !g.dying).length < (ST.night === 2 ? 4 : 5)) {
    spawnGhost();
    game.spawnT = Math.max(1.3, 2.4 - game.kills * 0.035);
  } }

  // pickups
  if (!TESTE) { game.pickT -= dt;
  if (game.pickT <= 0 && game.pickups.length < 2) {
    game.pickups.push({
      kind: Math.random() < 0.5 ? "sal" : "diario",
      x: 200 + Math.random() * 1150, y: 700 + Math.random() * 260,
    });
    game.pickT = 7;
  }
  game.pickups = game.pickups.filter(pk => {
    if (Math.abs(pk.x - d.x) < 50 && Math.abs(pk.y - d.y) < 60) {
      if (pk.kind === "sal") {
        if (game.hearts < 3) game.hearts++;
        else game.reserve = Math.min(24, game.reserve + 6);
      }
      else { game.points += 500; }
      sfx.pick();
      game.fx.push({ kind: "puff", x: pk.x, y: pk.y - 30, t: 0.2 });
      return false;
    }
    return true;
  }); }

  // Malphas
  if (!TESTE) { const m = game.malphas;
  const BOSS_AT = ST.night === 2 ? 10 : 12;
  if (!game.bossOn && game.kills >= BOSS_AT) {
    game.bossOn = true; sfx.boss(); shake = Math.max(shake, 12);
  }
  if (game.bossOn && !game.bossDead) {
    m.t += dt;
    if (m.y < 560) { m.y += 60 * dt; }                      // desce
    else {
      m.atkT -= dt; m.vuln -= dt;
      if (m.warnT > 0) {
        m.warnT -= dt;                                      // telegraph visivel
        if (m.warnT <= 0) {                                 // aviso acabou -> golpe esquivavel
          m.atkAnim = 0.7;
          if (Math.abs(d.x - m.x) < 300 && !game.crouch && game.invuln <= 0) {
            game.hearts--; game.invuln = 2.2; game.flashRed = 0.4; sfx.hurt(); shake = Math.max(shake, 10);
            if (game.hearts <= 0) { saveBest(); ST.state = "dead"; sfx.end(); }
          }
          m.vuln = 1.2;                                     // fica vulneravel depois
        }
      } else if (m.atkT <= 0 && m.vuln <= 0 && (m.atkAnim || 0) <= 0) {
        m.atkT = 2.6; m.warnT = 0.6;
      }
      if (m.atkAnim > 0) m.atkAnim -= dt;
      // Luca golpeia quando vulneravel
      if (m.vuln > 0 && l.slashCd <= 0 && Math.abs(l.x - m.x) < 220) {
        l.slashCd = 0.8; l.atkT = 0.5; sfx.slash(); damageBoss(4);
      }
    }
  }
  if (game.bossDead) {
    m.dying += dt;
    if (m.dying > 1.8) { saveBest(); sfx.end(); ST.state = ST.night === 1 ? "end1" : "end"; }
  } }

  // timers
  game.invuln -= dt; game.flashRed -= dt; game.hintT -= dt;
  for (const f of game.fx) f.t -= dt;
  game.fx = game.fx.filter(f => f.t > 0);
}

function damageGhost(g, dmg) {
  g.hp -= dmg; sfx.hit();
  game.fx.push({ kind: "puff", x: g.x, y: g.y - 60, t: 0.15 });
  if (g.hp <= 0 && !g.dying) {
    g.dying = 0.001; game.kills++; game.points += 250; sfx.banish(); hitstop = 0.05; shake = Math.max(shake, 5);
  }
}
function damageBoss(dmg) {
  if (!game.bossOn || game.bossDead) return;
  game.boss = Math.max(0, game.boss - dmg);
  game.points += 50; sfx.hit();
  if (game.boss <= 0) { game.bossDead = true; game.malphas.dying = 0.001; }
}

function spawnGhost() {
  const r = Math.random();
  let kind = "ghostA";
  if (game.kills > 4 && r < 0.3) kind = "espectro";
  if (game.kills > 7 && r > 0.75) kind = "cao";
  if (game.kills > 9 && r > 0.92) kind = "vulto";
  if (ST.night === 2 && r > 0.55 && r <= 0.78) kind = "neon";
  const side = Math.random();
  let x, y;
  if (side < 0.4) { x = -120; y = 700 + Math.random() * 260; }
  else if (side < 0.8) { x = W + 120; y = 640 + Math.random() * 300; }
  else { x = 200 + Math.random() * 1100; y = 560; }
  const P = {
    ghostA: { hp: 2, sp: 60, hw: 90, hh: 90 }, ghostB: { hp: 2, sp: 70, hw: 90, hh: 90 },
    espectro: { hp: 2, sp: 85, hw: 95, hh: 90 }, cao: { hp: 1, sp: 150, hw: 80, hh: 60 },
    vulto: { hp: 4, sp: 40, hw: 70, hh: 140 },
    neon: { hp: 2, sp: 95, hw: 85, hh: 120 },
  }[kind];
  const scale = 1 + Math.min(0.35, game.kills * 0.012);     // curva de dificuldade (calibrada pelo bot)
  game.ghosts.push(Object.assign({ x, y, kind, dir: 1, seed: Math.random() * 7, dying: 0, atkT: 0 }, P, { sp: Math.round(P.sp * scale) }));
}

/* ---------- draw ---------- */
function px(txt, x, y, size, color = "#e8e8e8", align = "left") {
  ctx.font = size + 'px "Press Start 2P", monospace';
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "middle";
  ctx.fillText(txt, x, y);
}
function drawAt(image, cx, feetY, face, lift = 0, alpha = 1) {
  if (!image) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, feetY - lift);
  if (face < 0) ctx.scale(-1, 1);
  ctx.drawImage(image, -image.width / 2, -image.height);
  ctx.restore();
}
function jumpLift() {
  if (game.jumpT <= 0) return 0;
  const p = 1 - game.jumpT / 0.5;
  return Math.sin(Math.PI * p) * 90;
}
function danteFrame() {
  if (game.invuln > 1.0) return img.dHurt;
  if (game.reloadT > 0) return img.dReload;
  if (game.shootAnim > 0) return game.shootAnim > 0.25 ? img.dAim : img.dFire;
  if (game.jumpT > 0) return img.dJump;
  if (game.crouch) return img.dCrouch;
  if (game.moving) {
    if (game.run) return [img.dRunA, img.dRunB, img.dRunC, img.dRunD][Math.floor(game.step) % 4];
    return Math.floor(game.step) % 2 === 0 ? img.dWalkA : img.dWalkB;
  }
  return img.dante;
}
function lucaFrame() {
  if (game.luca.atkT > 0) return game.luca.atkT > 0.25 ? img.lPrep : img.lThrust;
  if (game.luca.moving) {
    return [img.lRunA, img.lRunB, img.lRunC, img.lRunD][Math.floor(game.luca.step) % 4];
  }
  return img.luca;
}

function drawTesteHud() {
  const d = game.dante;
  let fr = "parado";
  if (game.reloadT > 0) fr = "recarga";
  else if (game.shootAnim > 0) fr = "tiro " + (game.shootAnim > 0.25 ? "(mira)" : "(fogo)");
  else if (game.jumpT > 0) fr = "pulo";
  else if (game.crouch) fr = "agachado";
  else if (game.moving) fr = game.run ? "CORRIDA fase " + ["A", "B", "C", "D"][Math.floor(game.step) % 4]
                                      : "andada " + (Math.floor(game.step) % 2 === 0 ? "A" : "B");
  px("MODO TESTE — SO PERSONAGENS (sem bichos, sem fundo)", 20, 30, 16, "#7cfc9b");
  px("dante " + Math.round(d.x) + "," + Math.round(d.y) + "  |  anim: " + fr + "  |  muni " + game.ammo + "/" + game.reserve, 20, 62, 12, "#9a9aa8");
  px("WASD mover - SHIFT correr - C agachar - K pular - ESPACO atirar - R recarregar", 20, 92, 12, "#9a9aa8");
  if (typeof window !== "undefined") window.__ANIM = fr;
}
function drawHUD() {
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, 104);
  ctx.strokeStyle = "#b9b9b9"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(7, 7, W - 14, 90, 10); ctx.stroke();
  for (let i = 0; i < 3; i++) {
    ctx.drawImage(img.heart, 40 + i * 58, 26);
    if (i >= game.hearts) { ctx.fillStyle = "rgba(0,0,0,.8)"; ctx.fillRect(40 + i * 58, 26, 58, 58); }
  }
  ctx.drawImage(img.shell, 256, 24);
  px(game.ammo + "/" + game.reserve, 316, 60, 30);
  if (game.reloadT > 0) px("RECARREGANDO…", 316, 96, 12, "#ffd75e");
  else if (nearImpala() && game.reserve < 24) px("R: PEGAR MUNICAO NO IMPALA", 316, 96, 12, "#8fd08f");
  ctx.drawImage(img.dagger, 450, 15);
  if (ST.night === 2) { ctx.fillStyle = "#0a0a12"; ctx.fillRect(548, 12, 560, 72); px("NOITE 2 - A CIDADE", 828, 48, 26, "#7fb2ff", "center"); }
  else ctx.drawImage(img.banner, 548, 12);
  ctx.drawImage(img.pontos, 1272, 18);
  px(String(game.points).padStart(5, "0"), 1444, 70, 32, "#e8e8e8", "right");
  ctx.drawImage(img.skull, 472, 102);
  ctx.strokeStyle = "#cfcfcf"; ctx.lineWidth = 3;
  ctx.strokeRect(528, 110, 554, 40);
  ctx.fillStyle = "#000"; ctx.fillRect(531, 113, 548, 34);
  const bw = Math.round(548 * game.boss / (ST.night === 2 ? 180 : 160));
  if (bw > 0) {
    ctx.fillStyle = "#7d1fa2"; ctx.fillRect(531, 113, bw, 34);
    ctx.fillStyle = "#a44bd0"; ctx.fillRect(531, 113, bw, 8);
  }
}

const mists = [
  { x: 200, y: 840, r: 260, v: 12 }, { x: 800, y: 900, r: 320, v: -9 },
  { x: 1300, y: 820, r: 280, v: 10 }, { x: 500, y: 620, r: 240, v: -7 },
];
function drawMist() {
  for (const m of mists) {
    const xx = ((m.x + ST.t * m.v * 8) % (W + 600)) - 300;
    const g = ctx.createRadialGradient(xx, m.y, 10, xx, m.y, m.r);
    g.addColorStop(0, "rgba(120,80,170,0.10)");
    g.addColorStop(1, "rgba(120,80,170,0)");
    ctx.fillStyle = g; ctx.fillRect(xx - m.r, m.y - m.r, m.r * 2, m.r * 2);
  }
}

function enemyImgs(g) {
  const atk = g.atkT > 0;
  switch (g.kind) {
    case "espectro": return atk ? img.eEspAtk : img.eEsp;
    case "cao": return Math.floor(ST.t * 10) % 2 === 0 ? img.eCao : img.eCaoB;
    case "vulto": return atk ? img.eVultoAtk : img.eVulto;
    case "neon": return img.eNeon;
    default: return g.kind === "ghostA" ? img.ghostA : img.ghostB;
  }
}

function drawWorld() {
  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 2, (Math.random() - 0.5) * shake * 2);
  if (TESTE) {
    ctx.fillStyle = "#101018"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(140,140,170,0.14)"; ctx.lineWidth = 2;
    for (let gx = 0; gx <= W; gx += 128) { ctx.beginPath(); ctx.moveTo(gx, 560); ctx.lineTo(gx, H); ctx.stroke(); }
    for (let gy = 640; gy <= H; gy += 80) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
  } else {
    ctx.drawImage(ST.night === 2 ? img.bgCidade : img.plate, 0, 0);
    if (ST.night === 2) { ctx.fillStyle = "rgba(40,70,150,0.07)"; ctx.fillRect(0, 0, W, H); }
    drawMist();
  }

  // pickups
  for (const pk of game.pickups) {
    const im = pk.kind === "sal" ? img.iSal : img.iDiario;
    const bob = Math.sin(ST.t * 4 + pk.x) * 4;
    ctx.drawImage(im, pk.x - im.width / 2, pk.y - im.height + bob);
  }

  // Malphas
  const m = game.malphas;
  if (game.bossOn) {
    const im = game.bossDead ? img.mDef : (ST.night === 2 ? ((m.warnT > 0 || m.atkAnim > 0) ? img.mAtk : img.boss2) : ((m.warnT > 0 || m.atkAnim > 0) ? img.mAtk : img.mIdle));
    const bob = Math.sin(ST.t * 2) * 12;
    const alpha = game.bossDead ? Math.max(0.15, 1 - m.dying / 1.8) : 1;
    drawAt(im, m.x, m.y + 260 + bob, 1, 0, alpha);
    if (m.warnT > 0 && Math.floor(ST.t * 12) % 2 === 0) px("!", m.x, m.y - 40, 44, "#ff3131", "center");
    if (game.bossDead && m.dying < 1.2) {
      ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * Math.sin(ST.t * 30);
      ctx.fillStyle = "#cfe8ff";
      ctx.fillRect(m.x - 60, m.y - 60, 120, 200);
      ctx.restore();
    }
  }

  // inimigos
  for (const g of game.ghosts) {
    const im = enemyImgs(g);
    const bob = Math.sin(ST.t * 3 + g.seed) * 10;
    let alpha = 0.95, lift = 0;
    if (g.dying) { alpha = Math.max(0, 0.95 * (1 - g.dying / 0.6)); lift = g.dying * 120; }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(g.x, g.y + bob - lift);
    const baseFace = (g.kind === "ghostB") ? -1 : 1;
    if (g.dir !== baseFace) ctx.scale(-1, 1);
    ctx.drawImage(im, -im.width / 2, -im.height * 0.9, im.width, im.height);
    ctx.restore();
  }

  // irmaos
  const blink = game.invuln > 0 && Math.floor(ST.t * 14) % 2 === 0;
  const rbL = game.luca.moving ? (Math.floor(game.luca.step) % 2) * 4 : 0;
  drawAt(lucaFrame(), game.luca.x, game.luca.y, game.luca.face, rbL);
  const rb = game.run && game.moving ? (Math.floor(game.step) % 2) * 4 : 0;
  if (!blink) drawAt(danteFrame(), game.dante.x, game.dante.y, game.dante.face, jumpLift() + rb);

  // balotes + flash
  ctx.fillStyle = "#ffe9b0";
  for (const p of game.pellets) ctx.fillRect(p.x - 4, p.y - 2, 8, 4);
  if (game.muzzle > 0) {
    const d = game.dante;
    const g = ctx.createRadialGradient(d.x + d.face * 95, d.y - 190, 2, d.x + d.face * 95, d.y - 190, 46);
    g.addColorStop(0, "rgba(255,220,120,.9)"); g.addColorStop(1, "rgba(255,140,40,0)");
    ctx.fillStyle = g; ctx.fillRect(d.x + d.face * 95 - 46, d.y - 236, 92, 92);
  }

  for (const f of game.fx) {
    if (f.kind === "slash") {
      ctx.save(); ctx.globalAlpha = f.t / 0.18;
      ctx.strokeStyle = "#cfe8ff"; ctx.lineWidth = 6; ctx.beginPath();
      ctx.arc(f.x, f.y, 70, f.face > 0 ? -0.9 : Math.PI - 0.7, f.face > 0 ? 0.9 : Math.PI + 0.7);
      ctx.stroke(); ctx.restore();
    } else {
      ctx.save(); ctx.globalAlpha = f.t / 0.2;
      ctx.fillStyle = "#fff"; ctx.fillRect(f.x - 6, f.y - 6, 12, 12);
      ctx.restore();
    }
  }

  if (TESTE) drawTesteHud(); else drawHUD();
  if (game.flashRed > 0) {
    ctx.fillStyle = "rgba(200,0,0," + (game.flashRed * 0.8) + ")";
    ctx.fillRect(0, 0, W, H);
  }
  if (game.hintT > 0 && !TESTE) {
    ctx.globalAlpha = Math.min(1, game.hintT);
    px("WASD mover · SHIFT correr · C agachar · K pular · ESPACO atirar · R recarregar", W / 2, H - 26, 13, "#9a9aa8", "center");
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawCoverBg(key) {
  const c = img[key];
  const sc = Math.max(W / c.width, H / c.height);
  const dw = c.width * sc, dh = c.height * sc;
  ctx.drawImage(c, (W - dw) / 2, (H - dh) / 2, dw, dh);
}
function dialogBox(who, expr, nome, txt) {
  const p = img["p" + who.toUpperCase() + { neutro: "n", raiva: "r", dor: "d", sorriso: "s" }[expr]];
  ctx.fillStyle = "rgba(0,0,0,.85)";
  ctx.beginPath(); ctx.roundRect(120, H - 260, W - 240, 200, 12); ctx.fill();
  ctx.strokeStyle = "#b9b9b9"; ctx.lineWidth = 3; ctx.stroke();
  if (p) ctx.drawImage(p, 150, H - 245, 150, 170);
  px(nome, 330, H - 220, 20, who === "d" ? "#ff5050" : "#7fb2ff");
  // quebra simples de texto
  const words = txt.split(" ");
  let line = "", y = H - 175;
  for (const w of words) {
    if ((line + w).length > 52) { px(line, 330, y, 15, "#e8e8e8"); y += 30; line = ""; }
    line += w + " ";
  }
  px(line, 330, y, 15, "#e8e8e8");
  px("ENTER ▸", W - 180, H - 80, 12, "#8f8f9a");
}

function drawTitle() {
  const c = img.cover, sc = Math.min(W / c.width, H / c.height);
  const dw = c.width * sc, dh = c.height * sc;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(c, (W - dw) / 2, (H - dh) / 2, dw, dh);
  const bx = (W - dw) / 2 + 974 * sc, by = (H - dh) / 2 + 1408 * sc;
  const bw = 900 * sc, bh = 120 * sc;
  ctx.fillStyle = titleBg; ctx.fillRect(bx, by, bw, bh);
  if ((ST.t % 1.1) < 0.72) px("PRESS START", bx + bw / 2, by + bh / 2, 44, "#f2f2f2", "center");
  px("SETAS/WASD · SHIFT correr · C agachar · K pular · ESPACO atirar · R recarregar · P pausa", W / 2, H - 24, 13, "#8f8f9a", "center");
  px("ENGINE v3.1 — NOITE 2: A CIDADE QUE NAO ACORDA", 20, 30, 12, "#9a9aa8");
  const rec = bestPoints();
  if (rec > 0) px("RECORDE " + rec + "   [M] som", 20, 54, 12, "#ff5050");
}

function centerBox(lines, title) {
  ctx.fillStyle = "rgba(0,0,0,.72)"; ctx.fillRect(0, 0, W, H);
  const bw = 1000, bh = 120 + lines.length * 56;
  ctx.fillStyle = "#0a0a12"; ctx.strokeStyle = "#b9b9b9"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect((W - bw) / 2, (H - bh) / 2, bw, bh, 12); ctx.fill(); ctx.stroke();
  px(title, W / 2, (H - bh) / 2 + 64, 30, "#ff3131", "center");
  lines.forEach((ln, i) => px(ln, W / 2, (H - bh) / 2 + 130 + i * 56, 16, "#d8d8e0", "center"));
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  if (ST.state === "title") { drawTitle(); return; }
  if (ST.state === "cut") {
    const c = CUTSCENE[ST.cut];
    drawCoverBg(c.bg);
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(0, 0, W, H);
    if (c.who) dialogBox(c.who, c.expr, c.nome, c.txt);
    else {
      ctx.fillStyle = "rgba(0,0,0,.8)"; ctx.fillRect(0, H / 2 - 60, W, 120);
      px(c.txt, W / 2, H / 2, 20, "#e8e8e8", "center");
      px("ENTER ▸", W - 180, H / 2 + 40, 12, "#8f8f9a");
    }
    return;
  }
  drawWorld();
  if (ST.paused) {
    centerBox([
      "SETAS/WASD — mover · SHIFT — correr",
      "C — agachar (esquiva do chefe) · K — pular",
      "ESPACO/J — escopeta · R — recarregar",
      "Perto do Impala, R reabastece municao",
      "P/ESC — continuar",
    ], "PAUSA");
  } else if (ST.state === "dead") {
    centerBox(["ENTER — voltar à Relíquia"], "A NÉVOA TE LEVOU…");
  } else if (ST.state === "end1") {
    drawCoverBg("bgFloresta");
    ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 0, W, H);
    centerBox([
      '"Seu pai não tá perdido, meninos…"',
      '"…ele tá SEGURANDO A PORTA."',
      "O CADEADO QUEBROU — A CIDADE CHAMA",
      "PONTOS " + game.points + " · RECORDE " + bestPoints(),
      "ENTER — NOITE 2: A CIDADE QUE NÃO ACORDA",
    ], "MALPHAS SE DISSOLVE RINDO");
  } else if (ST.state === "end") {
    drawCoverBg("bgPorta");
    ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(0, 0, W, H);
    centerBox([
      '"Eu sabia que viriam, meninos."',
      '"O Cornudo era o cadeado. Agora somos nós."',
      "Álvaro: 'Ajudem o pai a SEGURAR A PORTA.'",
      "NOITE 3 — A PORTA (em breve)",
      "PONTOS " + game.points + " · RECORDE " + bestPoints(),
      "ENTER — voltar ao título",
    ], "3H07 — A CIDADE NÃO ACORDOU");
  }
}

/* ---------- loop ---------- */
let last = 0;
function loop(ts) {
  // fixed timestep: logica sempre a 60Hz, independente do refresh do monitor
  const realDt = Math.min(0.05, (ts - last) / 1000 || 0.016);
  last = ts;
  if (hitstop > 0) hitstop -= realDt;
  else {
    acc += realDt;
    const STEP = 1 / 60; let n = 0;
    while (acc >= STEP && n < 5) { update(STEP); acc -= STEP; n++; }
  }
  draw();
  requestAnimationFrame(loop);
}

let titleBg = "#1d1114";
function boot() {
  if (loadError) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    px("ERRO AO CARREGAR: " + loadError, W / 2, H / 2, 18, "#ff5050", "center");
    return;
  }
  try {
    const tc = document.createElement("canvas");
    tc.width = img.cover.width; tc.height = img.cover.height;
    const t = tc.getContext("2d");
    t.drawImage(img.cover, 0, 0);
    const d = t.getImageData(900, 1470, 1, 1).data;
    titleBg = "rgb(" + d[0] + "," + d[1] + "," + d[2] + ")";
  } catch (e) { /* fallback */ }
  if (TESTE) { resetGame(); ST.state = "play"; }
  const start = () => requestAnimationFrame(loop);
  if (document.fonts && document.fonts.load) {
    Promise.race([document.fonts.load('16px "Press Start 2P"'), new Promise(r => setTimeout(r, 1500))]).then(start);
  } else start();
}

/* hook p/ pagina de testes da IA (aditivo) */
if (typeof window !== "undefined") { window.__G = { ST, game, keys, onPress }; }
