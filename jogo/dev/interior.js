// entra num lugar e tira foto do interior. uso: node interior.js <nome-da-foto> <criterio> [sala]
//   criterio: casa:0|1|2 (riqueza) | id:<id do lugar> | loja:<tipo> | tipo:<tipo> | mercado | hotel:<n>
const { G, S, W, P, step, shot, place, tap } = require('./tp.js');
const L = G.lugares;
const pdc = c => c && (c.pl || (c.pl = { id: 'casa:' + c.id, tipo: 'casa', casa: c, nome: 'CASA', x: c.x, y: c.y, r: 24, cor: '#9dff9d' }));
function acha(c) {
  const [k, v] = c.split(':');
  if (k === 'casa') {      // casa:<riqueza>[.<n>]  (n-ésima casa; 'v' no fim = à venda)
    const venda = /v/.test(v), [q0, n0] = v.replace('v', '').split('.'), q = +q0, n = parseInt(n0) || 0;
    const lista = W.casas.filter(h => (h.riqueza != null ? h.riqueza : (h.area < 14 ? 0 : h.area < 34 ? 1 : 2)) === q && h.b && h.b.casa3 && !h.b.place && !!h.venda === venda);
    return pdc(lista[n]);
  }
  if (k === 'casac') return pdc(W.casas.find(h => !h.b.casa3 && !h.b.place));
  if (k === 'id') return W.places.find(p => p.id === v);
  if (k === 'loja') return (W.lojas || []).find(p => p.loja === v);
  if (k === 'tipo') return W.places.find(p => p.tipo === v);
  if (k === 'mercado') return W.places.find(p => p.tipo === 'mercado');
  if (k === 'hotel') return W.places.filter(p => p.tipo === 'hotel')[+v || 0];
}
function entra(pl) {
  S.dayT = 0.3; S.heat = 0; S.heatLevel = 0; place(pl.x, pl.y);
  step(5); L.entrar(S, pl); for (let i = 0; i < 60 && S.mode !== 'inside'; i++) step(1); step(20);
  return S.mode === 'inside';
}
module.exports = { entra, acha, L, G, S, W, step, shot };
if (require.main === module) {
  const [, , nome, crit, sala] = process.argv;
  if (!nome) { console.log('construtores:', Object.keys(L.construtores).join(' ')); console.log('lugares:', W.places.map(p => p.id + '(' + p.tipo + ')').filter((v, i, a) => a.indexOf(v) === i).slice(0, 60).join(' ')); console.log('lojas:', [...new Set((W.lojas || []).map(p => p.loja))].join(' ')); process.exit(0); }
  const pl = acha(crit); if (!pl) { console.log('não achei', crit); process.exit(1); }
  console.log('entrando em', pl.id, pl.nome || pl.tipo, '| ok:', entra(pl), '| sala', S.inside && S.inside.id, S.inside && S.inside.nome);
  if (sala) { L.irSala(S, sala, null, null, null); for (let i = 0; i < 40; i++) step(1); console.log('sala agora', S.inside.id); }
  shot(nome);
}
