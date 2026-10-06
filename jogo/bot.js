/* ============================================================
   BOT DE TESTE (IA jogadora headless)
   Joga o game.js sozinho por ~6 min simulados e imprime
   relatorio completo com PARECER BOM/RUIM.
   Uso: node jogo/bot.js
   ============================================================ */
"use strict";
const fs = require("fs");
const noop = () => {};
const grad = { addColorStop: noop };
const ctxStub = new Proxy({}, {
  get: (t, p) => (p === "canvas" ? {} : (...a) => {
    if (p === "createRadialGradient") return grad;
    if (p === "getImageData") return { data: [29, 17, 20, 255] };
  }),
  set: () => true,
});
global.document = {
  getElementById: () => ({ getContext: () => ctxStub, addEventListener: noop, width: 1536, height: 1024 }),
  createElement: () => ({ width: 0, height: 0, getContext: () => ctxStub }),
  fonts: { load: () => Promise.resolve() },
};
global.window = {};
global.addEventListener = noop;
let rafCb = null;
global.requestAnimationFrame = (cb) => { rafCb = cb; };
class FakeImage {
  constructor() { this.width = 220; this.height = 470; }
  set src(v) { queueMicrotask(() => this.onload && this.onload()); }
}
global.Image = FakeImage;

let src = fs.readFileSync(__dirname + "/game.js", "utf8");
src += "\n;globalThis.__T = { ST, game, keys, onPress, damageBoss };";
eval(src);
const T = globalThis.__T;

let ts = 0;
function frame() { ts += 16.7; const cb = rafCb; rafCb = null; cb(ts); }

/* ---------------- telemetria ---------------- */
const M = {
  tempo: 0, kills: 0, mortes: 0, tiros: 0, recargas: 0, pickups: 0, pontos: 0,
  danoRecebido: 0, bossDano: 0, pulos: 0, agaches: 0,
  chegouBoss: false, venceu: false, erros: [], score: 0,
  _distSum: 0, _dn: 0, tempoAteBoss: null,
};
let prev = { ammo: 6, kills: 0, hearts: 3, boss: 160, points: 0, reloadT: 0, reserve: 24 };

function telemetry(dt) {
  const g = T.game;
  M.tempo += dt;
  if (g.ammo < prev.ammo && g.reloadT <= 0) M.tiros += prev.ammo - g.ammo;
  if (g.reloadT > 0 && prev.reloadT <= 0) M.recargas++;
  if (g.kills > prev.kills) M.kills += g.kills - prev.kills;
  if (g.hearts < prev.hearts) M.danoRecebido += prev.hearts - g.hearts;
  if (g.boss < prev.boss) M.bossDano += prev.boss - g.boss;
  if (g.points - prev.points === 500) M.pickups++;
  if (g.reserve > prev.reserve && g.reloadT <= 0) M.pickups++;
  if (g.bossOn && M.tempoAteBoss === null) M.tempoAteBoss = M.tempo;
  if (g.bossOn) M.chegouBoss = true;
  prev = { ammo: g.ammo, kills: g.kills, hearts: g.hearts, boss: g.boss, points: g.points, reloadT: g.reloadT, reserve: g.reserve };
  M.pontos = g.points;
  let dm = 1e9;
  for (const gh of g.ghosts) if (!gh.dying) dm = Math.min(dm, Math.hypot(gh.x - g.dante.x, gh.y - g.dante.y));
  if (dm < 1e9) { M._distSum += dm; M._dn++; }
}

/* ---------------- politica da IA ---------------- */
let strafeDir = 1, strafeT = 0;
function think(dt) {
  const g = T.game, d = g.dante, K = T.keys;
  if (T.ST.state === "title" || T.ST.state === "cut") { T.onPress("Enter"); return; }
  if (T.ST.state === "dead") { M.mortes++; T.onPress("Enter"); return; }
  if (T.ST.state === "end") { M.venceu = true; return; }
  if (T.ST.paused) return;

  let alvo = null, best = 1e9;
  for (const gh of g.ghosts) {
    if (gh.dying) continue;
    const dd = Math.hypot(gh.x - d.x, gh.y - d.y);
    if (dd < best) { best = dd; alvo = gh; }
  }
  const m = g.malphas;
  const agachar = g.bossOn && !g.bossDead && m.atkAnim > 0 && Math.hypot(m.x - d.x, m.y + 260 - d.y) < 340;
  K.KeyC = agachar;
  if (agachar) M.agaches++;
  const caoPerto = g.ghosts.some(gh => !gh.dying && gh.kind === "cao" && Math.hypot(gh.x - d.x, gh.y - d.y) < 230);
  if (caoPerto && g.jumpT <= 0) { T.onPress("KeyK"); M.pulos++; }

  let pick = null, pd = 1e9;
  for (const pk of g.pickups) {
    const dd = Math.hypot(pk.x - d.x, pk.y - d.y);
    if (dd < pd) { pd = dd; pick = pk; }
  }
  let tx = null, ty = null;
  if (pick && pd < 340) { tx = pick.x; ty = pick.y; }
  else if (alvo) {
    strafeT -= dt;
    if (strafeT <= 0) { strafeDir *= -1; strafeT = 1.2; }
    const dx = d.x - alvo.x, dy = d.y - alvo.y, dl = Math.hypot(dx, dy) || 1;
    const aproxi = best > 380 ? -1 : best < 240 ? 1 : 0;
    tx = d.x + (dx / dl) * 100 * aproxi;
    ty = d.y + strafeDir * 80;
  }
  K.ArrowLeft = !!(tx !== null && tx < d.x - 20);
  K.ArrowRight = !!(tx !== null && tx > d.x + 20);
  K.ArrowUp = !!(ty !== null && ty < d.y - 20);
  K.ArrowDown = !!(ty !== null && ty > d.y + 20);
  K.ShiftLeft = !!(alvo && best > 520);

  K.Space = !!alvo && best < 560 && !agachar && g.ammo > 0;
  if (g.bossOn && !g.bossDead && m.vuln > 0 && Math.abs(d.y - (m.y + 60)) < 260 && g.ammo > 0) K.Space = true;
  if (g.ammo === 0 && g.reloadT <= 0 && (!alvo || best > 260)) T.onPress("KeyR");
}

/* ---------------- execucao ---------------- */
(async () => {
  await new Promise(r => setTimeout(r, 60));
  const LIMITE = 6 * 60;
  let t = 0;
  while (t < LIMITE && !M.venceu) {
    try { think(1 / 60); frame(); telemetry(1 / 60); }
    catch (e) { M.erros.push(String(e.message)); break; }
    t += 1 / 60;
  }
  const precisao = M.tiros > 0 ? ((M.kills * 2 + M.bossDano) / (M.tiros * 3) * 100).toFixed(1) : 0;
  const dpm = (M.danoRecebido / Math.max(1, M.tempo / 60)).toFixed(2);
  const distMedia = M._dn ? Math.round(M._distSum / M._dn) : 0;

  const problemas = [];
  if (!M.chegouBoss) problemas.push("nunca ativou o chefe (progressao lenta ou dificuldade alta)");
  if (M.mortes >= 3) problemas.push("muito dificil: " + M.mortes + " mortes em " + Math.round(M.tempo) + "s");
  if (M.tiros > 20 && precisao < 15) problemas.push("mira/feedback fracos (precisao " + precisao + "%)");
  if (M.pickups === 0) problemas.push("itens nunca coletados (spawn ou sinalizacao ruim)");
  if (M.erros.length) problemas.push("erros de runtime: " + M.erros.slice(0, 3).join("; "));
  if (M.chegouBoss && !M.venceu && M.bossDano === 0) problemas.push("chefe invencivel na pratica (dano zero)");

  const bom = M.venceu || (M.chegouBoss && M.mortes <= 2 && problemas.length === 0);
  console.log("===== RELATORIO DO BOT DE TESTE =====");
  console.log("tempo simulado:", Math.round(M.tempo) + "s | estado final:", T.ST.state);
  console.log("kills:", M.kills, "| pontos:", M.pontos, "| tiros:", M.tiros, "| precisao aprox:", precisao + "%");
  console.log("dano recebido:", M.danoRecebido, "(dano/min " + dpm + ") | mortes:", M.mortes);
  console.log("recargas:", M.recargas, "| pickups:", M.pickups, "| pulos:", M.pulos, "| agachoes:", M.agaches);
  console.log("dist. media ao inimigo:", distMedia + "px | chefe ativou:", M.chegouBoss, M.tempoAteBoss !== null ? "(em " + Math.round(M.tempoAteBoss) + "s)" : "");
  console.log("dano no chefe:", M.bossDano, "| venceu:", M.venceu);
  console.log("PROBLEMAS:", problemas.length ? "\n  - " + problemas.join("\n  - ") : " nenhum");
  console.log("PARECER:", bom ? "BOM" : "RUIM");
  process.exit(0);
})();
