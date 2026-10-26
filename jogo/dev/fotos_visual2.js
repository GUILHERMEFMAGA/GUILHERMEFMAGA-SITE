// fotos de detalhe (sem faixas de texto) em pontos escolhidos.  uso: OUTDIR=$PWD/out/ node fotos_visual2.js <prefixo> <hora> [ponto ...]
//   hora: manha|dia|tarde|noite      pontos: cruz rua ponte vila centro campo mata praca
const { G, S, W, P, step, shot, place } = require('./tp.js');
const [, , prefixo = 'w', hora = 'dia', ...quais] = process.argv;
const horas = { manha: 0.07, dia: 0.3, tarde: 0.5, noite: 0.72 };
const nx = W.nodeX, ny = W.nodeY, T = 32;
const pts = {
  cruz: [nx(2), ny(2)], rua: [nx(2) + 14 * T, ny(2) + 0], rua2: [nx(3) + 8 * T, ny(2) + 40],
  vila: [nx(7) + 500, ny(1) + 420], centro: [nx(1) + 500, ny(0) + 420], campo: [nx(11) + 400, ny(0) + 500], mata: [nx(20) + 600, ny(2) + 500],
  praca: [nx(3) + 300, ny(3) + 330], rodovia: [nx(20) + 300, ny(5) + 110]
};
for (const k of (quais.length ? quais : ['cruz'])) {
  S.dayT = horas[hora] != null ? horas[hora] : 0.3; S.heat = 0; S.heatLevel = 0;
  const [x, y] = pts[k]; place(x, y); step(45); S.ban = null; S.msg = null; step(2);
  shot(prefixo + '_' + k + '_' + hora); console.log('foto', k, hora, 'carros', S.cars.length, 'peds', S.peds.length);
}
process.exit(0);
