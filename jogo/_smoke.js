/* Smoke test em Node: stub de DOM/canvas + executa frames reais do game.js */
"use strict";
const fs = require("fs");

const noop = () => {};
const grad = { addColorStop: noop };
const ctxStub = new Proxy({}, {
  get: (t, p) => {
    if (p === "canvas") return {};
    return (...a) => {
      if (p === "createRadialGradient") return grad;
      if (p === "getImageData") return { data: [29, 17, 20, 255] };
      return undefined;
    };
  },
  set: () => true,
});
const canvasStub = { getContext: () => ctxStub, addEventListener: noop, width: 1536, height: 1024, style: {} };

global.document = {
  getElementById: () => canvasStub,
  createElement: () => ({ width: 0, height: 0, getContext: () => ctxStub }),
  fonts: { load: () => Promise.resolve() },
};
global.window = {};
global.addEventListener = noop;
let rafCb = null;
global.requestAnimationFrame = (cb) => { rafCb = cb; };

class FakeImage {
  constructor() { this.width = 1536; this.height = 1024; }
  set src(v) { this._src = v; queueMicrotask(() => this.onload && this.onload()); }
  get src() { return this._src; }
}
global.Image = FakeImage;

let src = fs.readFileSync(__dirname + "/game.js", "utf8");
src += "\n;globalThis.__T = { get ST(){return ST}, get game(){return game}, onPress, update, draw, spawnGhost, resetGame, keys, damageGhost };";
eval(src);

const T = globalThis.__T;
let ts = 0;
function frames(n) { for (let i = 0; i < n; i++) { ts += 16.7; const cb = rafCb; rafCb = null; cb(ts); } }

(async () => {
  await new Promise(r => setTimeout(r, 50));   // deixa onloads/boot rodarem
  frames(5);
  console.log("title ok, state =", T.ST.state);

  T.onPress("Enter"); frames(2);
  console.log("play ok, state =", T.ST.state, "| pontos =", T.game.points, "| ammo =", T.game.ammo + "/" + T.game.reserve, "| hearts =", T.game.hearts, "| boss =", T.game.boss);
  if (T.game.points !== 1250 || T.game.ammo !== 6 || T.game.reserve !== 24 || T.game.hearts !== 3 || T.game.boss !== 100) throw new Error("HUD inicial difere da arte");

  // mover + atirar (segurando ESPAÇO)
  T.keys.ArrowRight = true; frames(20); T.keys.ArrowRight = false;
  T.keys.Space = true; frames(10); T.keys.Space = false;
  console.log("tiro ok, ammo =", T.game.ammo, "| dante.x =", Math.round(T.game.dante.x));
  if (T.game.ammo === 6) throw new Error("tiro não gastou munição");

  // recarga
  T.onPress("KeyR"); frames(90);
  console.log("recarga ok, ammo =", T.game.ammo, "reserve =", T.game.reserve);
  if (T.game.ammo !== 6) throw new Error("recarga não completou");

  // spawn
  for (let i = 0; i < 3; i++) T.spawnGhost();
  frames(30);
  console.log("ghosts =", T.game.ghosts.length);

  // pausa / despausa
  T.onPress("KeyP"); frames(3); T.onPress("KeyP"); frames(3);
  console.log("pause ok");

  // dano no jogador (contato simulado)
  T.spawnGhost();
  const gh = T.game.ghosts[T.game.ghosts.length - 1];
  gh.x = T.game.dante.x; gh.y = T.game.dante.y - 80; gh.sp = 0;
  T.game.invuln = 0; frames(2);
  console.log("dano ok, hearts =", T.game.hearts);
  if (T.game.hearts !== 2) throw new Error("contato não tirou coração");

  // mata 20 fantasmas -> tela final
  for (let i = 0; i < 20; i++) { T.spawnGhost(); const g = T.game.ghosts[T.game.ghosts.length - 1]; T.damageGhost(g, 2); }
  frames(5);
  console.log("kills =", T.game.kills, "| boss =", T.game.boss, "| state =", T.ST.state, "| pontos =", T.game.points);
  if (T.ST.state !== "end") throw new Error("chefe zerado não levou à tela final");

  T.onPress("Enter"); frames(3);
  console.log("volta ao title ok, state =", T.ST.state);

  // morte -> respawn
  T.onPress("Enter"); frames(2);
  T.game.hearts = 1; T.game.invuln = 0;
  T.spawnGhost();
  const g2 = T.game.ghosts[T.game.ghosts.length - 1];
  g2.x = T.game.dante.x; g2.y = T.game.dante.y - 80; g2.sp = 0;
  frames(2);
  console.log("morte: state =", T.ST.state);
  if (T.ST.state !== "dead") throw new Error("não morreu com 0 corações");
  T.onPress("Enter"); frames(5);
  console.log("respawn ok, hearts =", T.game.hearts, "state =", T.ST.state);
  console.log("SMOKE OK");
  process.exit(0);
})().catch(e => { console.error("SMOKE FAIL:", e); process.exit(1); });
