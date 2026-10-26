// primeiro quadro do jogo ao apertar ENTER (onde o personagem nasce).  uso: OUTDIR=$PWD/out/ node fotos_inicio.js <nome> [hora 0..1]
const L = require('./load.js'); const { G, step, tap, shot } = L;
const nome = process.argv[2] || 'inicio', hora = process.argv[3];
step(30); tap('Enter', 90); if (hora != null) G.S.dayT = +hora; step(40);
const S = G.S, M = G.world.MANSAO, P = S.player;
console.log('jogador em', Math.round(P.x), Math.round(P.y), '| dentro dos muros:', G.mansao.dentro(P.x, P.y), '| carro vermelho a', Math.round(Math.hypot(S.redCar.x - P.x, S.redCar.y - P.y)), 'px | seguranças', S.peds.filter(p => p.kind === 'guarda').length);
shot(nome); process.exit(0);
