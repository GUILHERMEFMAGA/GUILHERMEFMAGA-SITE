// foto da SALA INTEIRA (sem câmera, sem barras).  uso: node sala.js <nome> <criterio> [sala ...]
//   ex.: node sala.js hosp tipo:hospital entrada enfermaria consultorio   ->  out/hosp_entrada.png ...
const { acha, entra, L, G, S, step } = require('./interior.js');
const { createCanvas } = require('./load.js');
const fs = require('fs'); const OUTDIR = process.env.OUTDIR || __dirname + '/out/';
const [, , nome, crit, ...salas] = process.argv;
const pl = acha(crit); if (!pl) { console.log('não achei', crit); process.exit(1); }
entra(pl);
const lista = salas.length ? salas : ['entrada'];
for (const sid of lista) {
  const R = L.salaVigiada(pl, sid); if (!R) { console.log('sala inexistente', sid); continue; }
  for (let i = 0; i < 30; i++) L.simularSala(S, R, 0.1);    // deixa o pessoal andar um pouco
  S.time += 1;
  const cv = createCanvas(R.W, R.H), ctx = cv.getContext('2d');
  L.desenharCena(ctx, S, R, false);
  fs.writeFileSync(OUTDIR + nome + '_' + sid + '.png', cv.toBuffer('image/png'));
  console.log('ok', sid, R.W + 'x' + R.H, R.nome, '| objs', R.objs.length, 'npcs', R.npcs.length);
}
process.exit(0);
