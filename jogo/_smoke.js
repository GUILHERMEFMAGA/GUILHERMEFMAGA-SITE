/* smoke test do engine v3.0 — roda headless no node */
"use strict";
const fs = require("fs");
const noop = () => {};
const grad = { addColorStop: noop };
const ctxStub = new Proxy({}, {
  get: (t, p) => (p === "canvas" ? { width: 1536, height: 1024 } : (...a) => {
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
src += "\n;globalThis.__T = { ST, game, keys, onPress, damageGhost, damageBoss, resetGame };";
eval(src);
const T = globalThis.__T;
let ts = 0;
function frames(n) { for (let i = 0; i < n; i++) { ts += 16.7; const cb = rafCb; rafCb = null; cb(ts); } }
function assert(c, m) { if (!c) { console.error("FALHOU:", m); process.exit(1); } console.log("ok:", m); }

(async () => {
  await new Promise(r => setTimeout(r, 60));
  assert(T.ST.state === "title", "comeca no titulo");
  T.onPress("Enter");
  assert(T.ST.state === "cut", "titulo -> cutscene");
  for (let i = 0; i < 5; i++) T.onPress("Enter");
  assert(T.ST.state === "play", "cutscene -> play");
  frames(10);
  const g = T.game;
  assert(g.points === 1250 && g.ammo === 6 && g.reserve === 24 && g.hearts === 3 && g.boss === 160,
    "HUD inicial pontos=1250 muni 6/24 coracoes=3 boss=160");
  const x0 = g.dante.x;
  T.keys.ArrowRight = true; frames(30); T.keys.ArrowRight = false;
  assert(g.dante.x > x0 + 100, "andar funciona");
  const a0 = g.ammo;
  T.keys.Space = true; frames(40); T.keys.Space = false;
  assert(g.ammo < a0, "atirar gasta munição");
  g.ammo = 1; g.reserve = 12; T.onPress("KeyR"); frames(90);
  assert(g.ammo === 6 && g.reserve === 7, "recarga completa 1+5");
  const h0 = g.hearts;
  g.ghosts.push({ kind: "ghostA", x: g.dante.x + 10, y: g.dante.y - 80, hw: 90, hh: 90, hp: 2, sp: 0, dir: 1, seed: 1, dying: 0, atkT: 0 });
  frames(20);
  assert(g.hearts === h0 - 1, "contato tira coracao");
  g.ghosts.length = 0;
  while (g.kills < 12) {
    const gh = { kind: "ghostA", x: 700, y: 700, hw: 90, hh: 90, hp: 2, sp: 0, dir: 1, seed: 1, dying: 0, atkT: 0 };
    g.ghosts.push(gh);
    T.damageGhost(gh, 2);
    frames(1);
  }
  frames(30);
  assert(g.bossOn === true, "chefe ativa em 12 abates");
  T.damageBoss(200);
  frames(140);
  assert(g.bossDead === true && T.ST.state === "end", "chefe morre -> tela final");
  T.onPress("Enter");
  assert(T.ST.state === "title", "final -> titulo (jogabilidade preservada)");
  console.log("SMOKE OK");
  process.exit(0);
})();
