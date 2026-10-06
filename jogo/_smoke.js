/* Smoke test em Node (engine v2): stub de DOM/canvas + frames reais do game.js */
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
  constructor() { this.width = 220; this.height = 470; }
  set src(v) { this._src = v; queueMicrotask(() => this.onload && this.onload()); }
  get src() { return this._src; }
}
global.Image = FakeImage;

let src = fs.readFileSync(__dirname + "/game.js", "utf8");
src += "\n;globalThis.__T = { get ST(){return ST}, get game(){return game}, onPress, update, draw, spawnGhost, resetGame, keys, damageGhost, damageBoss };";
eval(src);

const T = globalThis.__T;
let ts = 0;
function frames(n) { for (let i = 0; i < n; i++) { ts += 16.7; const cb = rafCb; rafCb = null; cb(ts); } }

(async () => {
  await new Promise(r => setTimeout(r, 50));
  frames(3);
  console.log("title:", T.ST.state);

  // cutscene -> play
  T.onPress("Enter"); frames(2);
  if (T.ST.state !== "cut") throw new Error("nao entrou em cutscene");
  for (let i = 0; i < 5; i++) T.onPress("Enter");
  frames(2);
  if (T.ST.state !== "play") throw new Error("cutscene nao levou a play");
  console.log("cutscene ok -> play | pontos", T.game.points, "ammo", T.game.ammo + "/" + T.game.reserve, "hearts", T.game.hearts, "boss", T.game.boss);
  if (T.game.points !== 1250 || T.game.ammo !== 6 || T.game.reserve !== 24 || T.game.hearts !== 3 || T.game.boss !== 100) throw new Error("HUD inicial difere da arte");

  // mover + tiro
  T.keys.ArrowRight = true; frames(15); T.keys.ArrowRight = false;
  T.keys.Space = true; frames(8); T.keys.Space = false;
  if (T.game.ammo === 6) throw new Error("tiro nao gastou");
  console.log("tiro ok, ammo", T.game.ammo);

  // correr/agachar/pulo nao quebram
  T.keys.ShiftLeft = true; T.keys.ArrowLeft = true; frames(10);
  T.keys.ShiftLeft = false; T.keys.ArrowLeft = false;
  T.keys.KeyC = true; frames(5); T.keys.KeyC = false;
  T.onPress("KeyK"); frames(10);
  console.log("correr/agachar/pulo ok");

  // recarga
  T.onPress("KeyR"); frames(90);
  if (T.game.ammo !== 6) throw new Error("recarga falhou");
  console.log("recarga ok, reserve", T.game.reserve);

  // dano de inimigo
  T.spawnGhost();
  const g = T.game.ghosts[T.game.ghosts.length - 1];
  g.x = T.game.dante.x; g.y = T.game.dante.y - 80; g.sp = 0;
  T.game.invuln = 0; frames(2);
  if (T.game.hearts !== 2) throw new Error("contato nao tirou coracao");
  console.log("dano ok, hearts", T.game.hearts);

  // chefe: ativa com 12 kills e morre com dano
  T.game.kills = 12; frames(3);
  if (!T.game.bossOn) throw new Error("chefe nao ativou");
  T.damageBoss(100); frames(140);
  if (T.ST.state !== "end") throw new Error("derrota do chefe nao levou ao fim, state=" + T.ST.state);
  console.log("chefe ok -> end, pontos", T.game.points);

  T.onPress("Enter"); frames(2);
  console.log("volta title:", T.ST.state);

  // morte/respawn
  T.onPress("Enter"); for (let i = 0; i < 5; i++) T.onPress("Enter"); frames(2);
  T.game.hearts = 1; T.game.invuln = 0;
  T.spawnGhost();
  const g2 = T.game.ghosts[T.game.ghosts.length - 1];
  g2.x = T.game.dante.x; g2.y = T.game.dante.y - 80; g2.sp = 0;
  frames(2);
  if (T.ST.state !== "dead") throw new Error("nao morreu");
  T.onPress("Enter"); frames(3);
  console.log("respawn ok, hearts", T.game.hearts);
  console.log("SMOKE OK");
  process.exit(0);
})().catch(e => { console.error("SMOKE FAIL:", e.message); process.exit(1); });
