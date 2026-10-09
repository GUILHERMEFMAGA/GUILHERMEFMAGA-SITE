// teleporta o jogador e tira foto. uso: const {go,...}=require('./tp.js')
const L = require('./load.js'); const { G, step, tap, shot } = L;
if (G.S.mode === 'title') { tap('Enter', 90); }
const S = G.S, W = G.world, P = S.player, T = W.T;
function place(x, y) { P.x = x; P.y = y; S.cam.x = x; S.cam.y = y; S.mode = 'play'; S.inside = null; S.trans = null; }
function go(name, x, y, frames = 25) { place(x, y); step(frames); return name ? shot(name) : null; }
module.exports = Object.assign({}, L, { go, S, W, P, T, place });
if (require.main === module) {
  console.log('carregou em', G.loadMs, 'ms; mundo', W.W, 'x', W.H, 'blocos', W.blocks.length, 'arvores', W.trees.length);
  go('t1', W.nodeX(2) + 300, W.nodeY(2) + 300); go('t2', W.nodeX(6) + 300, W.nodeY(4) + 300); console.log('ok');
}
