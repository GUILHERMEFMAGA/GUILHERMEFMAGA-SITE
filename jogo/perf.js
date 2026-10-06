/* A10 PERFORMANCE: mede custo por frame e pressao de memoria em partida cheia */
"use strict";
const fs = require("fs");
const noop = () => {};
const grad = { addColorStop: noop };
const ctxStub = new Proxy({}, { get: (t,p)=> p==="canvas"?{}:(...a)=>{ if(p==="createRadialGradient")return grad; if(p==="getImageData")return{data:[0,0,0,255]}; }, set:()=>true });
global.document = { getElementById: ()=>({getContext:()=>ctxStub, addEventListener:noop, width:1536,height:1024}), createElement: ()=>({width:0,height:0,getContext:()=>ctxStub}), fonts:{load:()=>Promise.resolve()} };
global.window = {}; global.addEventListener = noop;
let rafCb=null; global.requestAnimationFrame = cb=>{rafCb=cb;};
class FI { constructor(){this.width=10;this.height=10;} set src(v){queueMicrotask(()=>this.onload&&this.onload());} }
global.Image = FI;
let src = fs.readFileSync(__dirname + "/game.js","utf8");
src += "\n;globalThis.__T={ST,game,keys,onPress};";
eval(src);
const T=globalThis.__T; let ts=0;
function fr(){ ts+=16.7; const c=rafCb; rafCb=null; if(c)c(ts); }
(async()=>{
await new Promise(r=>setTimeout(r,80));
T.onPress("Enter"); for(let i=0;i<5;i++)T.onPress("Enter");
T.keys.ArrowRight = true; T.keys.Space = true;
let maxG=0, maxFx=0, maxP=0, t0=Date.now();
const N=1800;
for(let i=0;i<N;i++){ fr(); maxG=Math.max(maxG,T.game.ghosts.length); maxFx=Math.max(maxFx,T.game.fx.length); maxP=Math.max(maxP,T.game.pellets.length); }
const ms=((Date.now()-t0)/N);
console.log("A10 PERF: " + ms.toFixed(2) + "ms/frame | pico ghosts " + maxG + " | pico fx " + maxFx + " | pico pellets " + maxP);
process.exit(0);
})();
