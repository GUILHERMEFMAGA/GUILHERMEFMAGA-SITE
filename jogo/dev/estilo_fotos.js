// fotos de cenas-chave para comparar o visual (antes/depois).  uso: OUTDIR=$PWD/out/ node estilo_fotos.js <prefixo> [cena ...]
// cenas: centro vila campo mata rodovia  |  hora: centro@dia centro@tarde centro@noite
const { go, G, S, W, P, step } = require('./tp.js');
if (process.env.PCFG && G.paleta) Object.assign(G.paleta.cfg, JSON.parse(process.env.PCFG));   // ex.: PCFG='{"dither":0.2}'
const pre = process.argv[2] || 'x'; const pedidas = process.argv.slice(3);
const pts = {
  centro: [W.nodeX(1) + 500, W.nodeY(0) + 420], vila: [W.nodeX(7) + 500, W.nodeY(1) + 420],
  campo: [W.nodeX(11) + 400, W.nodeY(0) + 500], mata: [W.nodeX(20) + 600, W.nodeY(2) + 500], rodovia: [W.nodeX(20) + 300, W.nodeY(5) + 110],
  porto: [W.nodeX(61) + 500, W.nodeY(1) + 420], aeroporto: [W.nodeX(53) + 400, W.nodeY(4) + 300]
};
const horas = { dia: 0.3, tarde: 0.56, noite: 0.78 };
const lista = pedidas.length ? pedidas : ['centro@dia', 'centro@tarde', 'centro@noite', 'vila@dia', 'campo@dia', 'mata@dia'];
for (const item of lista) {
  const [c, h] = item.split('@'); let p = pts[c];
  if (!p && /^xy:/.test(c)) { const q = c.slice(3).split(',').map(Number); p = [q[0], q[1]]; }   // xy:<x>,<y>[,zoom]
  if (!p) { console.log('cena?', c); continue; }
  if (/^xy:/.test(c) && c.split(',')[2]) S.cam.z = +c.split(',')[2];
  S.dayT = horas[h || 'dia']; S.heat = 0; S.heatLevel = 0;
  go(pre + '_' + c + (h ? '_' + h : ''), p[0], p[1], 40); console.log('ok', item, 'carros', S.cars.length, 'peds', S.peds.length);
}
process.exit(0);
