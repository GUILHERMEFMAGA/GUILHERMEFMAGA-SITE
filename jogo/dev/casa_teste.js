// testa a vida dentro das casas: família à noite/à tarde, portas entre salas, dormir, comprar
// uso: OUTDIR=$PWD/out/ node casa_teste.js <riqueza 0|1|2>
const { entra, acha, L, G, S, W, step, shot } = require('./interior.js');
const q = process.argv[2] || '1';
const hora = h => ((h - 6 + 24) % 24) / 24;
const info = () => { const R = S.inside; return R ? R.id + ' px=' + Math.round(R.px) + ' py=' + Math.round(R.py) : 'fora'; };
const npcs = () => (S.inside ? S.inside.npcs.map(n => (n.nome || '?') + '@' + Math.round(n.x) + ',' + Math.round(n.y) + (n.dorme ? ' dorme' : n.sentado ? ' sentado' : '')).join(' | ') : '');
function vai(id) {
  const R = S.inside, o = R.objs.find(o => o.t === 'porta' && o.act);
  if (id === 'sair') { R.py = R.y1 + 6; step(2); return; }
  if (R.id === id) return;
  if (R.porta && R.porta.para === id) { R.px = R.portaX; R.py = R.y1 + 6; step(2); }
  else o.act(S, R, o);
  for (let i = 0; i < 60 && (S.trans || S.inside.id !== id); i++) step(1);
  step(5);
}
(async () => {
  const pl = acha('casa:' + q); if (!pl) { console.log('sem casa'); return; }
  console.log('entra:', entra(pl), info());
  // 1) noite: todo mundo dormindo nos quartos
  S.dayT = hora(2); step(30); vai('quartos'); step(700);
  console.log('noite quartos', info(), '|', npcs()); shot('t' + q + '_noite_quartos');
  vai('entrada'); step(60); console.log('noite sala', info(), '|', npcs());
  // 2) tarde/noite: tv e cozinha
  S.dayT = hora(20); step(900); console.log('20h sala', info(), '|', npcs()); shot('t' + q + '_20h_sala');
  S.dayT = hora(12.2); step(700); console.log('12h sala', info(), '|', npcs()); shot('t' + q + '_12h_sala');
  // 3) cadeia de portas
  S.dayT = hora(15); step(30);
  vai('quartos'); console.log('->', info()); vai('banheiro'); console.log('->', info());
  vai('quartos'); console.log('<-', info()); vai('entrada'); console.log('<-', info());
  vai('sair'); console.log('saiu?', S.mode, info());
})().catch(e => { console.log('ERRO', e.stack); process.exit(1); });
