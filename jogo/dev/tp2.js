// teste rápido do jogo inteiro (v2): carrega, começa, anda por vários lugares e tira fotos
const { go, G, S, W, P, T, step, tap } = require('./tp.js');
console.log('carregou em', G.loadMs, 'ms | mapa', W.W, 'x', W.H, '| modo', S.mode);
const pts = {
  vila: [W.nodeX(7) + 500, W.nodeY(1) + 420], centro: [W.nodeX(1) + 500, W.nodeY(0) + 420],
  campo: [W.nodeX(11) + 400, W.nodeY(0) + 500], mata: [W.nodeX(20) + 600, W.nodeY(2) + 500], rodovia: [W.nodeX(20) + 300, W.nodeY(5) + 110]
};
for (const k in pts) { go('t_' + k, pts[k][0], pts[k][1], 30); console.log('foto', k, 'peds', S.peds.length, 'carros', S.cars.length); }
