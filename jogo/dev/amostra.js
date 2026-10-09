// tira "fotos cruas" (antes da paleta) de várias cenas e horas, para ajustar a paleta.   uso: node amostra.js [cena ...]
// grava out/frames/<cena>_<hora>.rgb (400x300x3)
const { go, G, S, W, P, step } = require('./tp.js');
const fs = require('fs'); const D = (process.env.OUTDIR || __dirname + '/out/') + 'frames/'; fs.mkdirSync(D, { recursive: true });
G.paleta.cfg.guardar = true;
const pts = {
  centro: [W.nodeX(1) + 500, W.nodeY(0) + 420], vila: [W.nodeX(7) + 500, W.nodeY(1) + 420], campo: [W.nodeX(11) + 400, W.nodeY(0) + 500],
  mata: [W.nodeX(20) + 600, W.nodeY(2) + 500], rodovia: [W.nodeX(20) + 300, W.nodeY(5) + 110], porto: [W.nodeX(61) + 500, W.nodeY(1) + 420],
  aeroporto: [W.nodeX(53) + 400, W.nodeY(4) + 300], vale: [W.nodeX(50) + 500, W.nodeY(1) + 420], cidade2: [W.nodeX(36) + 500, W.nodeY(1) + 420]
};
const horas = { manha: 0.12, dia: 0.3, tarde: 0.5, por: 0.58, anoit: 0.64, noite: 0.78, mad: 0.9, aurora: 0.97 };
const cenas = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(pts);
for (const c of cenas) for (const h in horas) {
  S.dayT = horas[h]; S.heat = 0; S.heatLevel = 0; go(null, pts[c][0], pts[c][1], 22);
  fs.writeFileSync(D + c + '_' + h + '.rgb', Buffer.from(G.paleta.guardado.buffer)); console.log('ok', c, h);
}
process.exit(0);
