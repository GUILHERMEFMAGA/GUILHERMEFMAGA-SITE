/* SOBRENATURAL — Noite 1: Estrada 66
 * Jogo em canvas usando a própria arte pixel como base (sprites recortados).
 * Controles: setas/WASD mover · ESPAÇO/J atirar · R recarregar · P/ESC pausa · ENTER confirmar
 */
"use strict";

const W = 1536, H = 1024;
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

/* ---------- assets ---------- */
const SRC = {
  plate:   "sprites/plate.png",
  dante:   "sprites/dante.png",
  luca:    "sprites/luca.png",
  ghostA:  "sprites/ghost_a.png",
  ghostB:  "sprites/ghost_b.png",
  heart:   "sprites/heart.png",
  shell:   "sprites/shell.png",
  dagger:  "sprites/dagger.png",
  skull:   "sprites/skull.png",
  banner:  "sprites/banner.png",
  pontos:  "sprites/pontos.png",
  cover:   "../assets/sobrenatural-pixel.png",
};
const img = {};
let loaded = 0, total = Object.keys(SRC).length, loadError = null, booted = false;
function maybeBoot() { if (!booted) { booted = true; boot(); } }
for (const [k, url] of Object.entries(SRC)) {
  const i = new Image();
  i.onload = () => { if (++loaded === total) maybeBoot(); };
  i.onerror = () => { loadError = url; maybeBoot(); };
  i.src = url;
  img[k] = i;
}

/* ---------- áudio (sintetizado) ---------- */
let AC = null;
function ac() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); return AC; }
function beep(freq, dur, type = "square", vol = 0.12, slide = 0) {
  try {
    const a = ac(), o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, a.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), a.currentTime + dur);
    g.gain.setValueAtTime(vol, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g).connect(a.destination);
    o.start(); o.stop(a.currentTime + dur + 0.02);
  } catch (e) { /* sem áudio, segue o jogo */ }
}
const sfx = {
  shot:  () => { beep(190, 0.14, "square", 0.16, -120); beep(90, 0.2, "sawtooth", 0.12, -50); },
  empty: () => beep(700, 0.05, "square", 0.06),
  reload:() => { beep(500, 0.05, "square", 0.08); setTimeout(() => beep(700, 0.05, "square", 0.08), 120); },
  hit:   () => beep(320, 0.08, "square", 0.1, -80),
  banish:() => beep(520, 0.3, "sine", 0.12, 700),
  hurt:  () => beep(120, 0.35, "sawtooth", 0.16, -60),
  slash: () => beep(900, 0.09, "triangle", 0.1, -300),
  start: () => { beep(440, 0.12, "square", 0.1); setTimeout(() => beep(660, 0.16, "square", 0.1), 130); },
  end:   () => beep(60, 1.2, "sine", 0.2, -20),
};

/* ---------- estado ---------- */
const ST = { state: "title", paused: false, t: 0 };
const game = {};
function resetGame() {
  game.hearts = 3;
  game.ammo = 6;
  game.reserve = 24;
  game.points = 1250;      // igual à arte de referência
  game.kills = 0;
  game.boss = 100;
  game.invuln = 0;
  game.reloadT = 0;
  game.shootCd = 0;
  game.flashRed = 0;
  game.muzzle = 0;
  game.spawnT = 2.0;
  game.hintT = 7;
  game.dante = { x: 562, y: 865, face: 1 };   // pés; idêntico à arte
  game.luca  = { x: 962, y: 860, face: -1, slashCd: 0 };
  game.ghosts = [];
  game.pellets = [];
  game.fx = [];
}
resetGame();

/* ---------- input ---------- */
const keys = {};
const GAMEKEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space",
  "KeyW", "KeyA", "KeyS", "KeyD", "KeyJ", "KeyX", "KeyR", "KeyP", "Escape", "Enter"];
addEventListener("keydown", (e) => {
  if (GAMEKEYS.includes(e.code)) e.preventDefault();
  if (!keys[e.code]) onPress(e.code);
  keys[e.code] = true;
  ac(); // desbloqueia áudio no primeiro gesto
});
addEventListener("keyup", (e) => { keys[e.code] = false; });
canvas.addEventListener("pointerdown", () => { ac(); onPress("Enter"); });

function onPress(code) {
  if (ST.state === "title" && (code === "Enter" || code === "Space")) {
    resetGame(); ST.state = "play"; ST.paused = false; sfx.start(); return;
  }
  if (ST.state === "dead" && code === "Enter") {
    // volta à Relíquia
    game.hearts = 3; game.invuln = 2; game.flashRed = 0;
    game.ghosts.forEach(g => g.dying = 0.01);
    game.dante = { x: 562, y: 865, face: 1 };
    game.luca = { x: 962, y: 860, face: -1, slashCd: 0 };
    ST.state = "play"; sfx.start(); return;
  }
  if (ST.state === "end" && code === "Enter") { ST.state = "title"; return; }
  if (ST.state === "play" && (code === "KeyP" || code === "Escape")) {
    ST.paused = !ST.paused; beep(300, 0.08, "square", 0.08); return;
  }
  if (ST.state === "play" && !ST.paused && code === "KeyR") startReload();
}

function startReload() {
  if (game.reloadT > 0 || game.ammo >= 6 || game.reserve <= 0) return;
  game.reloadT = 1.2; sfx.reload();
}

/* ---------- sprites: dims ---------- */
const DIM = {
  dante: { w: 220, h: 470 },
  luca:  { w: 208, h: 470 },
  ghostA:{ w: 405, h: 300 },
  ghostB:{ w: 360, h: 355 },
};

/* ---------- update ---------- */
function update(dt) {
  ST.t += dt;
  if (ST.state !== "play" || ST.paused) return;

  const d = game.dante, l = game.luca;

  // mover Dante
  let vx = 0, vy = 0;
  if (keys.ArrowLeft || keys.KeyA) vx -= 1;
  if (keys.ArrowRight || keys.KeyD) vx += 1;
  if (keys.ArrowUp || keys.KeyW) vy -= 1;
  if (keys.ArrowDown || keys.KeyS) vy += 1;
  if (vx && vy) { vx *= 0.7071; vy *= 0.7071; }
  d.x += vx * 300 * dt; d.y += vy * 260 * dt;
  d.x = Math.max(140, Math.min(1440, d.x));
  d.y = Math.max(640, Math.min(990, d.y));
  if (vx) d.face = vx > 0 ? 1 : -1;

  // recarga
  if (game.reloadT > 0) {
    game.reloadT -= dt;
    if (game.reloadT <= 0) {
      const need = 6 - game.ammo, take = Math.min(need, game.reserve);
      game.ammo += take; game.reserve -= take;
    }
  }

  // tiro
  game.shootCd -= dt; game.muzzle -= dt;
  if ((keys.Space || keys.KeyJ || keys.KeyX) && game.shootCd <= 0 && game.reloadT <= 0) {
    if (game.ammo > 0) {
      game.ammo--; game.shootCd = 0.5; game.muzzle = 0.09; sfx.shot();
      for (const s of [-0.09, 0, 0.09]) {
        game.pellets.push({ x: d.x + d.face * 70, y: d.y - 190, vx: d.face * 820, vy: s * 820, life: 0.75 });
      }
    } else { game.shootCd = 0.3; sfx.empty(); }
  }

  // Luca (IA): segue Dante e protege com a lâmina
  l.slashCd -= dt;
  let target = null, best = 1e9;
  for (const g of game.ghosts) {
    if (g.dying) continue;
    const dist = Math.hypot(g.x - l.x, g.y - l.y);
    if (dist < best) { best = dist; target = g; }
  }
  let tx = d.x + 150, ty = d.y;           // posição "de casa" ao lado do irmão
  if (target && best < 340) { tx = target.x; ty = target.y; }
  const dx = tx - l.x, dy = ty - l.y, dl = Math.hypot(dx, dy) || 1;
  if (dl > 24) {
    l.x += (dx / dl) * 240 * dt; l.y += (dy / dl) * 220 * dt;
    l.face = dx > 0 ? 1 : -1;
  }
  l.x = Math.max(140, Math.min(1440, l.x));
  l.y = Math.max(640, Math.min(990, l.y));
  if (target && best < 110 && l.slashCd <= 0) {
    l.slashCd = 0.7; sfx.slash();
    game.fx.push({ kind: "slash", x: target.x, y: target.y - 60, t: 0.18, face: l.face });
    damageGhost(target, 2);
  }

  // balotes de sal
  for (const p of game.pellets) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    for (const g of game.ghosts) {
      if (g.dying) continue;
      if (Math.abs(p.x - g.x) < 90 && Math.abs(p.y - (g.y - 60)) < 90) {
        p.life = 0; damageGhost(g, 1); break;
      }
    }
  }
  game.pellets = game.pellets.filter(p => p.life > 0 && p.x > -50 && p.x < W + 50);

  // fantasmas
  for (const g of game.ghosts) {
    if (g.dying) { g.dying += dt; continue; }
    const gx = d.x - g.x, gy = (d.y - 80) - g.y, gl = Math.hypot(gx, gy) || 1;
    g.x += (gx / gl) * g.sp * dt;
    g.y += (gy / gl) * g.sp * 0.6 * dt;
    g.dir = gx > 0 ? 1 : -1;
    if (game.invuln <= 0 && Math.abs(g.x - d.x) < 70 && Math.abs(g.y - (d.y - 80)) < 110) {
      game.hearts--; game.invuln = 1.6; game.flashRed = 0.35; sfx.hurt();
      if (game.hearts <= 0) { ST.state = "dead"; sfx.end(); }
    }
  }
  game.ghosts = game.ghosts.filter(g => !(g.dying && g.dying > 0.6));

  // spawn
  game.spawnT -= dt;
  if (game.spawnT <= 0 && game.ghosts.filter(g => !g.dying).length < 6 && ST.state === "play") {
    spawnGhost();
    game.spawnT = Math.max(1.1, 2.4 - game.kills * 0.04);
  }

  // timers
  game.invuln -= dt; game.flashRed -= dt; game.hintT -= dt;
  for (const f of game.fx) f.t -= dt;
  game.fx = game.fx.filter(f => f.t > 0);
}

function damageGhost(g, dmg) {
  g.hp -= dmg; sfx.hit();
  game.fx.push({ kind: "puff", x: g.x, y: g.y - 60, t: 0.15 });
  if (g.hp <= 0 && !g.dying) {
    g.dying = 0.001;
    game.kills++; game.points += 250;
    game.boss = Math.max(0, 100 - game.kills * 5);
    sfx.banish();
    if (game.boss <= 0) { ST.state = "end"; sfx.end(); }
  }
}

function spawnGhost() {
  const side = Math.random();
  let x, y;
  if (side < 0.4) { x = -120; y = 700 + Math.random() * 260; }
  else if (side < 0.8) { x = W + 120; y = 640 + Math.random() * 300; }
  else { x = 200 + Math.random() * 1100; y = 560; }
  game.ghosts.push({
    x, y, hp: 2, sp: 55 + Math.random() * 45,
    kind: Math.random() < 0.5 ? "A" : "B",
    dir: 1, seed: Math.random() * 7, dying: 0,
  });
}

/* ---------- draw helpers ---------- */
function px(txt, x, y, size, color = "#e8e8e8", align = "left") {
  ctx.font = size + 'px "Press Start 2P", monospace';
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "middle";
  ctx.fillText(txt, x, y);
}
function drawSprite(name, cx, feetY, face, alpha = 1, lift = 0) {
  const d = DIM[name];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, feetY - lift);
  if (face < 0) ctx.scale(-1, 1);
  ctx.drawImage(img[name], -d.w / 2, -d.h);
  ctx.restore();
}

/* ---------- HUD (idêntico à arte) ---------- */
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
  ctx.drawImage(img.dagger, 450, 15);
  ctx.drawImage(img.banner, 548, 12);
  ctx.drawImage(img.pontos, 1272, 18);
  px(String(game.points).padStart(5, "0"), 1444, 70, 32, "#e8e8e8", "right");

  // barra do chefe
  ctx.drawImage(img.skull, 472, 102);
  ctx.strokeStyle = "#cfcfcf"; ctx.lineWidth = 3;
  ctx.strokeRect(528, 110, 554, 40);
  ctx.fillStyle = "#000"; ctx.fillRect(531, 113, 548, 34);
  const bw = Math.round(548 * game.boss / 100);
  if (bw > 0) {
    ctx.fillStyle = "#7d1fa2"; ctx.fillRect(531, 113, bw, 34);
    ctx.fillStyle = "#a44bd0"; ctx.fillRect(531, 113, bw, 8);
  }
}

/* ---------- névoa ambiente ---------- */
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
    ctx.fillStyle = g;
    ctx.fillRect(xx - m.r, m.y - m.r, m.r * 2, m.r * 2);
  }
}

/* ---------- telas ---------- */
let titleBg = "#1d1114";
function drawTitle() {
  const c = img.cover, sc = Math.min(W / c.width, H / c.height);
  const dw = c.width * sc, dh = c.height * sc;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(c, (W - dw) / 2, (H - dh) / 2, dw, dh);
  // blink do PRESS START: tapa o texto assado com a cor do asfalto e pisca o nosso
  const bx = (W - dw) / 2 + 974 * sc, by = (H - dh) / 2 + 1408 * sc;
  const bw = 900 * sc, bh = 120 * sc;
  ctx.fillStyle = titleBg; ctx.fillRect(bx, by, bw, bh);
  if ((ST.t % 1.1) < 0.72) {
    px("PRESS START", bx + bw / 2, by + bh / 2, 44, "#f2f2f2", "center");
  }
  px("SETAS/WASD mover · ESPAÇO atirar · R recarregar · P pausa", W / 2, H - 26, 14, "#8f8f9a", "center");
}

function drawWorld() {
  ctx.drawImage(img.plate, 0, 0);
  drawMist();

  // fantasmas
  for (const g of game.ghosts) {
    const name = g.kind === "A" ? "ghostA" : "ghostB";
    const d = DIM[name];
    const bob = Math.sin(ST.t * 3 + g.seed) * 10;
    let alpha = 0.95, lift = 0;
    if (g.dying) { alpha = Math.max(0, 0.95 * (1 - g.dying / 0.6)); lift = g.dying * 120; }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(g.x, g.y + bob - lift);
    const wantFace = g.dir;                       // sprite A olha p/ direita, B p/ esquerda
    const baseFace = g.kind === "A" ? 1 : -1;
    if (wantFace !== baseFace) ctx.scale(-1, 1);
    ctx.drawImage(img[name], -d.w / 2, -d.h * 0.8, d.w * 0.9, d.h * 0.9);
    ctx.restore();
  }

  // irmãos (piscam quando invencíveis)
  const blink = game.invuln > 0 && Math.floor(ST.t * 14) % 2 === 0;
  drawSprite("luca", game.luca.x, game.luca.y, game.luca.face);
  if (!blink) drawSprite("dante", game.dante.x, game.dante.y, game.dante.face);

  // balotes
  ctx.fillStyle = "#ffe9b0";
  for (const p of game.pellets) ctx.fillRect(p.x - 4, p.y - 2, 8, 4);

  // flash do cano
  if (game.muzzle > 0) {
    const d = game.dante;
    const g = ctx.createRadialGradient(d.x + d.face * 95, d.y - 190, 2, d.x + d.face * 95, d.y - 190, 46);
    g.addColorStop(0, "rgba(255,220,120,.9)"); g.addColorStop(1, "rgba(255,140,40,0)");
    ctx.fillStyle = g;
    ctx.fillRect(d.x + d.face * 95 - 46, d.y - 236, 92, 92);
  }

  // fx
  for (const f of game.fx) {
    if (f.kind === "slash") {
      ctx.save();
      ctx.globalAlpha = f.t / 0.18;
      ctx.strokeStyle = "#cfe8ff"; ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 70, f.face > 0 ? -0.9 : Math.PI - 0.7, f.face > 0 ? 0.9 : Math.PI + 0.7);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = f.t / 0.15;
      ctx.fillStyle = "#fff";
      ctx.fillRect(f.x - 6, f.y - 6, 12, 12);
      ctx.restore();
    }
  }

  drawHUD();

  if (game.flashRed > 0) {
    ctx.fillStyle = "rgba(200,0,0," + (game.flashRed * 0.8) + ")";
    ctx.fillRect(0, 0, W, H);
  }
  if (game.hintT > 0 && ST.state === "play") {
    ctx.globalAlpha = Math.min(1, game.hintT);
    px("SETAS/WASD mover · ESPAÇO atirar · R recarregar · P pausa", W / 2, H - 26, 14, "#9a9aa8", "center");
    ctx.globalAlpha = 1;
  }
}

function centerBox(lines, title) {
  ctx.fillStyle = "rgba(0,0,0,.72)"; ctx.fillRect(0, 0, W, H);
  const bw = 1000, bh = 120 + lines.length * 56;
  ctx.fillStyle = "#0a0a12";
  ctx.strokeStyle = "#b9b9b9"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect((W - bw) / 2, (H - bh) / 2, bw, bh, 12); ctx.fill(); ctx.stroke();
  px(title, W / 2, (H - bh) / 2 + 64, 30, "#ff3131", "center");
  lines.forEach((ln, i) => px(ln, W / 2, (H - bh) / 2 + 130 + i * 56, 16, "#d8d8e0", "center"));
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  if (ST.state === "title") { drawTitle(); return; }
  drawWorld();
  if (ST.paused) {
    centerBox([
      "SETAS/WASD — mover Dante",
      "ESPAÇO/J — escopeta de sal-gema",
      "R — recarregar · Luca luta ao seu lado",
      "P/ESC — continuar",
    ], "PAUSA");
  } else if (ST.state === "dead") {
    centerBox(["ENTER — voltar à Relíquia"], "A NÉVOA TE LEVOU…");
  } else if (ST.state === "end") {
    centerBox([
      '"Seu pai não tá perdido, meninos…"',
      '"…ele tá SEGURANDO A PORTA."',
      "VOLTEM",
      "NOITE 2 — A CIDADE QUE NÃO ACORDA",
      "ENTER — voltar ao título",
    ], "MALPHAS SE DISSOLVE RINDO");
  }
}

/* ---------- loop ---------- */
let last = 0;
function loop(ts) {
  const dt = Math.min(0.033, (ts - last) / 1000 || 0.016);
  last = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function boot() {
  if (loadError) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    px("ERRO AO CARREGAR: " + loadError, W / 2, H / 2, 18, "#ff5050", "center");
    return;
  }
  // cor do asfalto atrás do PRESS START, pra blink limpo
  try {
    const tc = document.createElement("canvas");
    tc.width = img.cover.width; tc.height = img.cover.height;
    const t = tc.getContext("2d");
    t.drawImage(img.cover, 0, 0);
    const d = t.getImageData(900, 1470, 1, 1).data;
    titleBg = "rgb(" + d[0] + "," + d[1] + "," + d[2] + ")";
  } catch (e) { /* mantém fallback */ }
  const start = () => requestAnimationFrame(loop);
  if (document.fonts && document.fonts.load) {
    Promise.race([document.fonts.load('16px "Press Start 2P"'), new Promise(r => setTimeout(r, 1500))]).then(start);
  } else start();
}
