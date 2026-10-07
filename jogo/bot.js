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
  constructor() { this.width = 220; this.height = 470; this._src = null; }
  set src(v) { this._src = v; queueMicrotask(() => this.onload && this.onload()); }
  get src() { return this._src; }
}
global.Image = FakeImage;

const src = fs.readFileSync(__dirname + "/game.js", "utf8");
const SRC = src + "\n;globalThis.__T = { ST, game, keys, onPress, damageBoss, anims: ANIMS, danteFrame, lucaFrame };";
let T = null;
function boot() { eval(SRC); T = globalThis.__T; }   // re-boot limpo entre tentativas da campanha
boot();
const srcName = im => im && im._src ? im._src.replace(/^.*sprites2\//, "").replace(/\.png$/, "") : null;

let ts = 0;
function frame() { ts += 16.7; const cb = rafCb; rafCb = null; cb(ts); }

/* ---------------- telemetria ---------------- */
function freshM() { return { perNoite: {},
  tempo: 0, kills: 0, mortes: 0, tiros: 0, recargas: 0, pickups: 0, pontos: 0,
  danoRecebido: 0, bossDano: 0, pulos: 0, agaches: 0,
  chegouBoss: false, venceu: false, erros: [], score: 0,
  _distSum: 0, _dn: 0, tempoAteBoss: null }; }
let M = freshM();
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
  if (T.ST.state === "dead") {
    M.mortes++; (M.perNoite[T.ST.night] = (M.perNoite[T.ST.night] || 0) + 1);
    const g2 = T.game, d2 = g2.dante;
    let nk = "?", nd = 1e9;
    for (const gh of g2.ghosts) { if (gh.dying) continue; const dd = Math.hypot(gh.x - d2.x, gh.y - d2.y); if (dd < nd) { nd = dd; nk = gh.kind; } }
    const m2 = g2.malphas;
    console.log("  MORTE noite", T.ST.night, "t=" + Math.round(M.tempo) + "s pos=" + Math.round(d2.x) + "," + Math.round(d2.y),
      "| inimigo+proximo:", nk, Math.round(nd) + "px", "| boss atkAnim:", (m2.atkAnim || 0).toFixed(2), "| vuln:", (m2.vuln || 0).toFixed(2));
    T.onPress("Enter"); return;
  }
  if (T.ST.state === "end1") { T.onPress("Enter"); return; }
  if (T.ST.state === "end") { M.venceu = true; return; }
  if (T.ST.paused) return;

  let alvo = null, best = 1e9;
  for (const gh of g.ghosts) {
    if (gh.dying) continue;
    let dd = Math.hypot(gh.x - d.x, gh.y - d.y);
    if (gh.kind === "cao" || gh.kind === "neon") dd *= 0.6; // prioriza rapidos
    if (dd < best) { best = dd; alvo = gh; }
  }
  const realBest = alvo ? Math.hypot(alvo.x - d.x, alvo.y - d.y) : 1e9;
  const cercado = g.ghosts.filter(gh => !gh.dying && Math.hypot(gh.x - d.x, gh.y - d.y) < 230).length >= 2;
  const m = g.malphas;
  const agachar = g.bossOn && !g.bossDead && (m.warnT > 0 || m.atkAnim > 0) && Math.hypot(m.x - d.x, m.y + 260 - d.y) < 340;
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
  if (cercado) {
    const dx = d.x - alvo.x, dy = d.y - alvo.y, dl = Math.hypot(dx, dy) || 1;
    tx = d.x + (dx / dl) * 300; ty = d.y + (dy / dl) * 200;
  }
  else if (pick && pd < 340) { tx = pick.x; ty = pick.y; }
  else if (alvo) {
    strafeT -= dt;
    if (strafeT <= 0) { strafeDir *= -1; strafeT = 1.2; }
    const dx = d.x - alvo.x, dy = d.y - alvo.y, dl = Math.hypot(dx, dy) || 1;
    const aproxi = best > 430 ? -1 : best < 290 ? 1 : 0;
    tx = d.x + (dx / dl) * 100 * aproxi;
    ty = d.y + strafeDir * 80;
  }
  K.ArrowLeft = !!(tx !== null && tx < d.x - 20);
  K.ArrowRight = !!(tx !== null && tx > d.x + 20);
  K.ArrowUp = !!(ty !== null && ty < d.y - 20);
  K.ArrowDown = !!(ty !== null && ty > d.y + 20);
  K.ShiftLeft = !!(cercado || (alvo && best > 520));

  K.Space = !!alvo && realBest < 540 && !agachar && !cercado && g.ammo > 0;
  if (g.bossOn && !g.bossDead && m.vuln > 0 && Math.abs(d.y - (m.y + 60)) < 260 && g.ammo > 0) K.Space = true;
  if (g.ammo === 0 && g.reloadT <= 0 && (!alvo || best > 260)) T.onPress("KeyR");
}

/* ---------------- FASE SUPERIOR: a IA jogadora ve tudo ----------------
   Todas as animacoes da lista oficial (atuais E futuras), nos dois
   sentidos (espelho), nos 4 cantos do mapa, com pulo/agacha/tiro em cada
   canto. O que ela ve alimenta todas as outras IAs via bot_telemetry.json. */
const SUP = { spritesD: new Set(), spritesL: new Set(), cantos: 0, flips: 0, xMin: 1e9, xMax: -1e9, yMin: 1e9, yMax: -1e9 };
function setD(name) {
  const g = T.game, K = T.keys; K.ArrowLeft = K.ArrowRight = K.ShiftLeft = K.KeyC = K.Space = false;
  if (name === "walkA" || name === "walkB") { K.ArrowRight = true; g.step = name === "walkB" ? 1 : 0; }
  else if (name.startsWith("run")) { K.ArrowRight = true; K.ShiftLeft = true; g.step = "ABCD".indexOf(name[3]); }
  else if (name === "jump") g.jumpT = 0.25;
  else if (name === "crouch") K.KeyC = true;
  else if (name === "aim") g.shootAnim = 0.4;
  else if (name === "fire") g.shootAnim = 0.1;
  else if (name === "reload") g.reloadT = 1.0;
  else if (name === "hurt") g.invuln = 1.5;
}
function setL(name) {
  const l = T.game.luca; l.moving = false; l.atkT = 0;
  if (name.startsWith("run")) { l.moving = true; l.step = "ABCD".indexOf(name[3]); }
  else if (name === "prep") l.atkT = 0.4;
  else if (name === "thrust") l.atkT = 0.1;
}
function supRun(n, fn) {
  for (let i = 0; i < n; i++) { if (fn) fn(); frame();
    const d = T.game.dante; SUP.xMin = Math.min(SUP.xMin, d.x); SUP.xMax = Math.max(SUP.xMax, d.x);
    SUP.yMin = Math.min(SUP.yMin, d.y); SUP.yMax = Math.max(SUP.yMax, d.y); }
}
function faseSuperior() {
  const stAntes = T.ST.state;
  T.ST.state = "play";               // garante que update roda (saindo do title)
  global.window.__LUCA_CTRL = true;
  const g = T.game;
  g.ghosts.length = 0; g.pickups.length = 0; g.spawnT = 1e9;  // fase de visao: nada mata a IA
  for (const a of T.anims.dante) {
    for (let tr = 0; tr < 4 && !SUP.spritesD.has("d-" + a); tr++) {   // retry ate ver o sprite
      g.jumpT = 0; g.crouch = false; g.shootAnim = 0; g.reloadT = 0; g.invuln = 0;
      for (const face of [1, -1]) {           // espelho: para a direita E para a esquerda
        g.dante.face = face;
        for (let i = 0; i < 16; i++) { setD(a); frame(); SUP.spritesD.add(srcName(T.danteFrame())); }
        if (face < 0) SUP.flips++;
      }
    }
  }
  for (const a of T.anims.luca) {
    for (let tr = 0; tr < 4 && !SUP.spritesL.has("l-" + a); tr++)
      for (const face of [1, -1]) { g.luca.face = face;
        for (let i = 0; i < 16; i++) { setL(a); frame(); SUP.spritesL.add(srcName(T.lucaFrame())); } }
  }
  const CORNERS = [[140, 640], [1440, 640], [140, 990], [1440, 990]];   // os 4 cantos do mundo
  for (const [cx, cy] of CORNERS) {
    g.dante.x = cx; g.dante.y = cy; supRun(10);
    const ok = Math.abs(g.dante.x - cx) < 8 && Math.abs(g.dante.y - cy) < 8;
    T.onPress("KeyK"); supRun(15);                       // pulo no canto
    T.keys.KeyC = true; supRun(15); T.keys.KeyC = false; // agacha no canto
    T.keys.Space = true; supRun(15); T.keys.Space = false; // atira no canto
    if (ok) SUP.cantos++;
  }
  global.window.__LUCA_CTRL = false;
  T.ST.state = stAntes;              // devolve p/ title: a campanha comeca limpa
}
/* esperado = o que danteFrame/lucaFrame podem desenhar (lista oficial ANIMS);
   assets nao ligados a um estado (l-walk*, l-hurt, l-jump) nao contam. */
const ESP_D = T.anims.dante.map(a => "d-" + a), ESP_L = T.anims.luca.map(a => "l-" + a);

/* ---------------- execucao ---------------- */
function runCampaign() {
  const LIMITE = 15 * 60;
  let t = 0;
  while (t < LIMITE && !M.venceu) {
    try { think(1 / 60); frame(); telemetry(1 / 60); }
    catch (e) { M.erros.push(String(e.message)); break; }
    t += 1 / 60;
  }
}
(async () => {
  await new Promise(r => setTimeout(r, 60));
  faseSuperior();
  for (let att = 1; att <= 3 && !M.venceu; att++) {   // ensemble: ate 3 tentativas, vale a vitoria
    boot();
    await new Promise(r => setTimeout(r, 40));   // deixa o start() do NOVO eval registrar o loop
    M = freshM(); prev = { ammo: 6, kills: 0, hearts: 3, boss: 160, points: 0, reloadT: 0, reserve: 24 };
    runCampaign();
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
  console.log("mortes por noite:", JSON.stringify(M.perNoite));
  console.log("dano recebido:", M.danoRecebido, "(dano/min " + dpm + ") | mortes:", M.mortes);
  console.log("recargas:", M.recargas, "| pickups:", M.pickups, "| pulos:", M.pulos, "| agachoes:", M.agaches);
  console.log("dist. media ao inimigo:", distMedia + "px | chefe ativou:", M.chegouBoss, M.tempoAteBoss !== null ? "(em " + Math.round(M.tempoAteBoss) + "s)" : "");
  const covD = ESP_D.filter(s => SUP.spritesD.has(s)).length, covL = ESP_L.filter(s => SUP.spritesL.has(s)).length;
  const pctD = (100 * covD / Math.max(1, ESP_D.length)).toFixed(0), pctL = (100 * covL / Math.max(1, ESP_L.length)).toFixed(0);
  console.log("dano no chefe:", M.bossDano, "| venceu:", M.venceu);
  console.log("FASE SUPERIOR: cobertura dante " + pctD + "% (" + covD + "/" + ESP_D.length + "), luca " + pctL + "% (" + covL + "/" + ESP_L.length + ") | cantos visitados:", SUP.cantos + "/4", "| espelhadas:", SUP.flips, "| alcance x[" + Math.round(SUP.xMin) + "," + Math.round(SUP.xMax) + "] y[" + Math.round(SUP.yMin) + "," + Math.round(SUP.yMax) + "]");
  const faltD = ESP_D.filter(s => !SUP.spritesD.has(s)), faltL = ESP_L.filter(s => !SUP.spritesL.has(s));
  if (faltD.length || faltL.length) problemas.push("cobertura de sprites incompleta: " + faltD.concat(faltL).join(", "));
  if (SUP.cantos < 4) problemas.push("IA jogadora nao visitou os 4 cantos (" + SUP.cantos + "/4)");
  console.log("PROBLEMAS:", problemas.length ? "\n  - " + problemas.join("\n  - ") : " nenhum");
  console.log("PARECER:", bom ? "BOM" : "RUIM");
  try {
    require("fs").writeFileSync(__dirname + "/bot_telemetry.json", JSON.stringify({
      tempo: Math.round(M.tempo), kills: M.kills, mortes: M.mortes, perNoite: M.perNoite,
      tiros: M.tiros, recargas: M.recargas, precisao: precisao, pickups: M.pickups, danoRecebido: M.danoRecebido,
      danoMin: dpm, venceu: M.venceu, chegouBoss: M.chegouBoss, pontos: M.pontos,
      tempoAteBoss: M.tempoAteBoss !== null ? Math.round(M.tempoAteBoss) : null,
      superior: {
        coberturaDante: +pctD, coberturaLuca: +pctL,
        spritesDante: [...SUP.spritesD], spritesLuca: [...SUP.spritesL],
        faltamDante: faltD, faltamLuca: faltL,
        cantos: SUP.cantos, espelhadas: SUP.flips,
        alcance: { xMin: Math.round(SUP.xMin), xMax: Math.round(SUP.xMax), yMin: Math.round(SUP.yMin), yMax: Math.round(SUP.yMax) },
        animsTestadas: T.anims.dante.length + T.anims.luca.length
      }
    }, null, 1));
  } catch (e) {}
  process.exit(0);
})();
