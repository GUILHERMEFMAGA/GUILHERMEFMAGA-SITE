/* QA de animações (runtime) v2 — A1 ANIMACOES
   Itera sobre a lista oficial ANIMS exportada pelo game.js (fonte unica de
   verdade). Animacoes novas entram na lista e sao testadas automaticamente.
   Para cada estado: forca o estado, roda frames e confere que o sprite
   desenhado (danteFrame()._src) eh o sprite esperado. Tambem mede velocidades. */
"use strict";
const fs = require("fs");
const noop = () => {};
const grad = { addColorStop: noop };
const ctxStub = new Proxy({}, { get: (t,p)=> p==="canvas"?{}:(...a)=>{ if(p==="createRadialGradient")return grad; if(p==="getImageData")return{data:[0,0,0,255]}; }, set:()=>true });
global.document = { getElementById: ()=>({getContext:()=>ctxStub, addEventListener:noop, width:1536,height:1024}), createElement: ()=>({width:0,height:0,getContext:()=>ctxStub}), fonts:{load:()=>Promise.resolve()} };
global.window = { __TESTE: true, __LUCA_CTRL: true }; global.addEventListener = noop;
let rafCb=null; global.requestAnimationFrame = cb=>{rafCb=cb;};
class FI { constructor(){this.width=10;this.height=10;this._src=null;} set src(v){this._src=v;queueMicrotask(()=>this.onload&&this.onload());} get src(){return this._src;} }
global.Image = FI;
let src = fs.readFileSync(__dirname + "/game.js","utf8");
src += "\n;globalThis.__T={ST,game,keys,onPress,anims:ANIMS,danteFrame,lucaFrame};";
eval(src);
const T=globalThis.__T; let ts=0;
function fr(){ ts+=16.7; const c=rafCb; rafCb=null; if(c)c(ts); }
const R = { falhas: [], vistos: [], metricas: {} };
const FAM_D = { walk: ["d-walkA","d-walkB"], run: ["d-runA","d-runB","d-runC","d-runD"] };
const famD = a => a.startsWith("walk") ? "walk" : a.startsWith("run") ? "run" : null;
const seenD = new Set();

const MAP_D = { idle:"d-idle", walkA:"d-walkA", walkB:"d-walkB", runA:"d-runA", runB:"d-runB", runC:"d-runC", runD:"d-runD",
  jump:"d-jump", crouch:"d-crouch", aim:"d-aim", fire:"d-fire", reload:"d-reload", hurt:"d-hurt" };
const MAP_L = { idle:"l-idle", runA:"l-runA", runB:"l-runB", runC:"l-runC", runD:"l-runD", prep:"l-prep", thrust:"l-thrust" };

function setD(name){
  const g=T.game,K=T.keys;
  K.ArrowLeft=K.ArrowRight=K.ShiftLeft=K.KeyC=K.Space=false;
  if(name==="walkA"||name==="walkB"){K.ArrowRight=true;g.step=name==="walkB"?1:0;}
  else if(name.startsWith("run")){K.ArrowRight=true;K.ShiftLeft=true;g.step="ABCD".indexOf(name[3]);}
  else if(name==="jump"){g.jumpT=0.25;}
  else if(name==="crouch"){K.KeyC=true;}
  else if(name==="aim"){g.shootAnim=0.4;}
  else if(name==="fire"){g.shootAnim=0.1;}
  else if(name==="reload"){g.reloadT=1.0;}
  else if(name==="hurt"){g.invuln=1.5;}
}
function setL(name){
  const l=T.game.luca;
  l.moving=false;l.atkT=0;
  if(name.startsWith("run")){l.moving=true;l.step="ABCD".indexOf(name[3]);}
  else if(name==="prep"){l.atkT=0.4;}
  else if(name==="thrust"){l.atkT=0.1;}
}
function roda(n,setter){ for(let i=0;i<n;i++){ if(setter)setter(); fr(); } }
function srcName(im){ return im && im._src ? im._src.replace(/^.*sprites2\//,"").replace(/\.png$/,"") : null; }

(async()=>{
await new Promise(r=>setTimeout(r,80));
if (T.ST.state !== "play") { console.log(JSON.stringify({erro:"nao entrou em play"})); process.exit(1); }

// --- Dante: cada animacao da lista oficial ---
for (const a of T.anims.dante) {
  T.game.dante.x = 700; T.game.jumpT = 0; T.game.crouch = false; T.game.shootAnim = 0; T.game.reloadT = 0; T.game.invuln = 0;
  roda(14, ()=>setD(a));
  const got = srcName(T.danteFrame());
  const want = MAP_D[a] || ("d-"+a);           // anims futuras: espera sprite d-<nome>
  R.vistos.push("dante:"+a+"->"+got);
  const f = famD(a);
  if (f) { seenD.add(got);
    if (!FAM_D[f].includes(got)) R.falhas.push(`dante.${a}: sprite '${got}' fora da familia ${f}`);
  } else if (got !== want) R.falhas.push(`dante.${a}: sprite desenhado '${got}' != esperado '${want}'`);
  if (!fs.existsSync(__dirname + "/sprites2/" + want + ".png")) R.falhas.push(`sprite ausente no disco: ${want}.png`);
}
for (const f of Object.keys(FAM_D))
  for (const s of FAM_D[f]) if (!seenD.has(s)) R.falhas.push(`fase nunca sorteada no ciclo ${f}: ${s}`);
// --- Luca: cada animacao da lista oficial ---
const FAM_L = ["l-runA","l-runB","l-runC","l-runD"];
const seenL = new Set();
for (const a of T.anims.luca) {
  roda(14, ()=>setL(a));
  const got = srcName(T.lucaFrame());
  const want = MAP_L[a] || ("l-"+a);
  R.vistos.push("luca:"+a+"->"+got);
  if (a.startsWith("run")) { seenL.add(got);
    if (!FAM_L.includes(got)) R.falhas.push(`luca.${a}: sprite '${got}' fora da familia run`);
  } else if (got !== want) R.falhas.push(`luca.${a}: sprite desenhado '${got}' != esperado '${want}'`);
  if (!fs.existsSync(__dirname + "/sprites2/" + want + ".png")) R.falhas.push(`sprite ausente no disco: ${want}.png`);
}
for (const s of FAM_L) if (!seenL.has(s)) R.falhas.push(`fase nunca sorteada no ciclo run do Luca: ${s}`);

// --- velocidades (andada vs corrida) ---
const K=T.keys; T.game.dante.x=600;
roda(100, ()=>{K.ArrowRight=true;}); const vw=T.game.dante.x-600; K.ArrowRight=false;
T.game.dante.x=600;
roda(100, ()=>{K.ArrowRight=true;K.ShiftLeft=true;}); const vr=T.game.dante.x-600; K.ArrowRight=false;K.ShiftLeft=false;
R.metricas.velAndada=+(vw/(100/60)).toFixed(0); R.metricas.velCorrida=+(vr/(100/60)).toFixed(0);
if (R.metricas.velCorrida <= R.metricas.velAndada) R.falhas.push("corrida nao eh mais rapida que andada");
R.metricas.labelsVistos = R.vistos;
console.log(JSON.stringify(R));
process.exit(0);
})();
