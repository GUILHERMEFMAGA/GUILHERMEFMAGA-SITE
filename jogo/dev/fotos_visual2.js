// fotos de detalhe (sem faixas de texto) em pontos escolhidos.  uso: OUTDIR=$PWD/out/ node fotos_visual2.js <prefixo> <hora> [ponto ...]
//   hora: manha|dia|tarde|noite      pontos: cruz rua praca vila centro campo mata rodovia | mansão: estrada portao dentro rotatoria casa piscina heli garagem
const { G, S, W, P, step, shot, place } = require('./tp.js');
const [, , prefixo = 'w', hora = 'dia', ...quais] = process.argv;
const horas = { manha: 0.07, dia: 0.3, tarde: 0.5, noite: 0.72 };
const nx = W.nodeX, ny = W.nodeY, T = 32;
const pts = {
  cruz: [nx(2), ny(2)], rua: [nx(2) + 14 * T, ny(2) + 0], rua2: [nx(3) + 8 * T, ny(2) + 40],
  vila: [nx(7) + 500, ny(1) + 420], centro: [nx(1) + 500, ny(0) + 420], campo: [nx(11) + 400, ny(0) + 500], mata: [nx(20) + 600, ny(2) + 500],
  praca: [nx(3) + 300, ny(3) + 330], rodovia: [nx(20) + 300, ny(5) + 110]
};
if (W.MANSAO) { const M = W.MANSAO, c = M.casa;   // mansão do chefão
  pts.estrada = [M.estrada.x + M.estrada.w / 2, M.estrada.y1 - 160]; pts.portao = [M.portao.x, M.portao.y + 130]; pts.dentro = [M.portao.x, M.portao.y - 120];
  pts.rotatoria = [M.mu(38), M.mv(37)]; pts.casa = [c.x, c.y + 70]; pts.piscina = [M.mu(38), M.mv(9.5)]; pts.heli = [M.mu(65), M.mv(31)]; pts.garagem = [M.mu(11), M.mv(31)]; }
for (const k of (quais.length ? quais : ['cruz'])) {
  S.dayT = horas[hora] != null ? horas[hora] : 0.3; S.heat = 0; S.heatLevel = 0;
  const [x, y] = pts[k]; place(x, y); step(45); S.ban = null; S.msg = null; step(2);
  shot(prefixo + '_' + k + '_' + hora); console.log('foto', k, hora, 'carros', S.cars.length, 'peds', S.peds.length);
}
process.exit(0);
