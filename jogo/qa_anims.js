/* QA de animações (runtime): executa CADA animação no modo teste e confere */
"use strict";
const fs = require("fs");
const noop = () => {};
const grad = { addColorStop: noop };
const ctxStub = new Proxy({}, { get: (t,p)=> p==="canvas"?{}:(...a)=>{ if(p==="createRadialGradient")return grad; if(p==="getImageData")return{data:[0,0,0,255]}; }, set:()=>true });
global.document = { getElementById: ()=>({getContext:()=>ctxStub, addEventListener:noop, width:1536,height:1024}), createElement: ()=>({width:0,height:0,getContext:()=>ctxStub}), fonts:{load:()=>Promise.resolve()} };
global.window = { __TESTE: true }; global.addEventListener = noop;
let rafCb=null; global.requestAnimationFrame = cb=>{rafCb=cb;};
class FI { constructor(){this.width=10;this.height=10;} set src(v){queueMicrotask(()=>this.onload&&this.onload());} }
global.Image = FI;
let src = fs.readFileSync(__dirname + "/game.js","utf8");
src += "\n;globalThis.__T={ST,game,keys,onPress};";
eval(src);
const T=globalThis.__T; let ts=0;
function fr(){ ts+=16.7; const c=rafCb; rafCb=null; if(c)c(ts); }
const R = { visto: {}, labels: {}, falhas: [], metricas: {} };
function roda(framesN, fn) {
  const antes = T.game.dante.x;
  if (fn) fn();
  for (let i=0;i<framesN;i++){ fr(); const a = global.window.__ANIM; if (a) { R.visto[a.split(" ")[0]] = (R.visto[a.split(" ")[0]]||0)+1; R.labels[a] = (R.labels[a]||0)+1; } }
  return T.game.dante.x - antes;
}
(async()=>{
await new Promise(r=>setTimeout(r,80));
if (T.ST.state !== "play") { console.log(JSON.stringify({erro:"nao entrou em play"})); process.exit(1); }
const K = T.keys;
roda(60);                                                   // parado
T.game.dante.x = 600;
const dWalk = roda(100, ()=>{ K.ArrowRight = true; });      // andada
K.ArrowRight = false;
T.game.dante.x = 600;
const dRun = roda(100, ()=>{ K.ArrowRight = true; K.ShiftLeft = true; }); // corrida
K.ArrowRight = false; K.ShiftLeft = false; T.game.dante.x = 700;
roda(40, ()=>{ K.KeyC = true; }); K.KeyC = false; roda(5);  // agachado (+frames p/ atualizar crouch)
roda(40, ()=>{ T.onPress("KeyK"); });                       // pulo
roda(40, ()=>{ K.Space = true; }); K.Space = false;         // tiro
roda(90, ()=>{ T.onPress("KeyR"); });                       // recarga
const esperadas = ["parado","andada","CORRIDA","agachado","pulo","tiro","recarga"];
for (const e of esperadas) if (!R.visto[e]) R.falhas.push("animacao nunca exibida: " + e);
R.metricas.velAndada = +(dWalk / (100/60)).toFixed(0);
R.metricas.velCorrida = +(dRun / (100/60)).toFixed(0);
R.metricas.velEsperada = { andada: 300, corrida: 460 };
if (R.metricas.velCorrida <= R.metricas.velAndada) R.falhas.push("corrida nao eh mais rapida que andada");
R.metricas.fasesCorrida = Object.keys(R.labels).filter(k=>k.startsWith("CORRIDA fase")).length;
R.metricas.labelsVistos = Object.keys(R.labels);
console.log(JSON.stringify(R));
process.exit(0);
})();
