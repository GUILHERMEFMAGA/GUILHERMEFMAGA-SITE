// foto de perto de carros e pedestres (para avaliar os sprites).  uso: OUTDIR=$PWD/out/ node fotos_carros.js <prefixo> [hora]
const { G, S, W, P, step, shot, place } = require('./tp.js');
const [, , prefixo = 'c', hora = 'dia'] = process.argv;
const horas = { manha: 0.07, dia: 0.3, tarde: 0.5, noite: 0.72 };
S.dayT = horas[hora] != null ? horas[hora] : 0.3; S.heat = 0; S.heatLevel = 0;
place(W.nodeX(2), W.nodeY(2)); step(60);
const vivos = S.cars.filter(c => !c.dead);
console.log('carros', vivos.length, vivos.slice(0, 8).map(c => (c.type || c.kind || c.model || '?') + ':' + (c.col || c.color || '?')).join(' '));
let n = 0;
for (const c of vivos.slice(0, 3)) {
  // põe o carro parado diante do jogador e tira a foto
  c.x = W.nodeX(2) + 20; c.y = W.nodeY(2) + 40; c.vx = c.vy = 0; c.speed = 0;
  place(c.x - 60, c.y - 20); step(3); S.ban = null; S.msg = null; step(2);
  shot(prefixo + '_carro' + (n++) + '_' + hora);
}
process.exit(0);
