// fotos das salas da penitenciária e da ilha (não ficam em W.places).  uso: node sala_prisao.js <nome> [id] [sala ...]
const { entra, acha, L, G, S, W, step } = require('./interior.js');
const { createCanvas } = require('./load.js');
const fs = require('fs'); const OUTDIR = process.env.OUTDIR || __dirname + '/out/';
const [, , nome, id0, ...salas] = process.argv;
entra(W.places.find(p => p.tipo === 'delegacia'));            // só para o jogo estar "ligado"
for (const id of [id0 || 'penitenciaria']) {
  const cons = L.construtores[id]; if (!cons) { console.log('sem construtor', id); continue; }
  const pl = { id, tipo: 'prisao', nome: id === 'ilha' ? 'ILHA DO SILÊNCIO' : 'PENITENCIÁRIA SERRA DURA', x: 0, y: 0, r: 30, cor: '#5a6070' };
  const lg = { id, place: pl, salas: {}, estado: {}, criar: cons.criar };
  for (const sid of (salas.length ? salas : ['celas', 'patio', 'refeitorio', 'oficina', 'solitaria'])) {
    try {
      const R = lg.criar(sid, lg); R.lugar = lg; R.id = sid; R.place = R.place || pl; lg.salas[sid] = R;
      for (let i = 0; i < 20; i++) L.simularSala(S, R, 0.1);
      const cv = createCanvas(R.W, R.H), ctx = cv.getContext('2d'); L.desenharCena(ctx, S, R, false);
      fs.writeFileSync(OUTDIR + nome + '_' + id + '_' + sid + '.png', cv.toBuffer('image/png')); console.log('ok', id, sid, R.W + 'x' + R.H, 'objs', R.objs.length, 'npcs', R.npcs.length);
    } catch (e) { console.log('ERRO', id, sid, e.message); }
  }
}
process.exit(0);
