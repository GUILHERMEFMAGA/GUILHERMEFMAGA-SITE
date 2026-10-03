// teste só do mundo: carrega arte.js, rural.js e world.js e imprime números
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs'), vm = require('vm'), path = require('path');
const JOGO = (process.env.JOGO || path.resolve(__dirname, '..')) + '/';
const OUTDIR = process.env.OUTDIR || '/home/user/pw/';
const win = global.window = { innerWidth: 800, innerHeight: 600, devicePixelRatio: 1, addEventListener() { } };
global.document = { getElementById: () => null, createElement: () => { const c = createCanvas(300, 150); c.style = {}; return c; }, addEventListener() { } };
global.localStorage = { getItem: () => null, setItem() { } };
const t0 = Date.now();
for (const f of ['arte.js', 'rural.js', 'world.js']) vm.runInThisContext(fs.readFileSync(JOGO + f, 'utf8'), { filename: f });
const G = win.G, W = G.world;
console.log('carregou em', Date.now() - t0, 'ms; mapa', W.W, 'x', W.H, 'blocos', W.blocks.length, 'arvores', W.trees.length, 'predios', W.buildings.length, 'casas', W.casas.length, 'lugares', W.places.length, 'lotes', W.lotes.length, 'mercados', W.mercados.length);
const kinds = {}; W.blocks.forEach(b => { kinds[b.kind] = (kinds[b.kind] || 0) + 1; }); console.log(kinds);
module.exports = { G, W, createCanvas, OUTDIR };
