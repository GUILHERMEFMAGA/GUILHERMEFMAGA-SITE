// fotos das telas de título, pausa, "você morreu" e "preso".  uso: OUTDIR=$PWD/out/ node fotos_telas.js <prefixo>
const L = require('./load.js'); const { G, step, tap, shot } = L;
const pre = process.argv[2] || 'tela';
step(30); shot(pre + '_titulo');
tap('Enter', 90); step(20);
G.S.mode = 'paused'; step(3); shot(pre + '_pausa');
G.S.mode = 'wasted'; step(3); shot(pre + '_morreu');
G.S.mode = 'busted'; step(3); shot(pre + '_preso');
console.log('ok'); process.exit(0);
