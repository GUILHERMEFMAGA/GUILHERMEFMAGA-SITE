// fotos do mundo em vários lugares e horas, para avaliar a pixel art.  uso: OUTDIR=$PWD/out/ node fotos_visual.js <prefixo> [hora ...]
// hora: dia | tarde | noite | manha     (vários lugares: centro, vila, campo, mata, rodovia)
const { go, G, S, W, P, step } = require('./tp.js');
const prefixo = process.argv[2] || 'v';
const horas = { manha: 0.07, dia: 0.3, tarde: 0.5, noite: 0.72 };
const quais = process.argv.slice(3).length ? process.argv.slice(3) : ['dia'];
const pts = {
  centro: [W.nodeX(1) + 500, W.nodeY(0) + 420], vila: [W.nodeX(7) + 500, W.nodeY(1) + 420], campo: [W.nodeX(11) + 400, W.nodeY(0) + 500],
  mata: [W.nodeX(20) + 600, W.nodeY(2) + 500], rodovia: [W.nodeX(20) + 300, W.nodeY(5) + 110], bairro: [W.nodeX(2) + 300, W.nodeY(2) + 300]
};
for (const h of quais) for (const k of Object.keys(pts)) {
  S.dayT = horas[h] != null ? horas[h] : 0.3; S.heat = 0; S.heatLevel = 0;
  go(prefixo + '_' + k + '_' + h, pts[k][0], pts[k][1], 40); console.log('foto', k, h, 'peds', S.peds.length, 'carros', S.cars.length);
}
process.exit(0);
