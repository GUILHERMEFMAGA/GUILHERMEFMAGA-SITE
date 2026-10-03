// aperta todos os botões (act) de todas as salas das casas: procura erros. uso: node casa_acoes.js
const { entra, acha, L, G, S, W, step, shot } = require('./interior.js');
function vai(id) {
  const R = S.inside, o = R.objs.find(o => o.t === 'porta' && o.act);
  if (R.id === id) return;
  if (R.porta && R.porta.para === id) { R.px = R.portaX; R.py = R.y1 + 6; step(2); } else o.act(S, R, o);
  for (let i = 0; i < 60 && (S.trans || S.inside.id !== id); i++) step(1); step(5);
}
function rodaSalas(rot) {
  const erros = []; let n = 0;
  for (const id of ['entrada', 'quartos', 'banheiro']) {
    if (id === 'banheiro') { vai('quartos'); }
    if (id === 'quartos' && S.inside.id === 'entrada') vai('quartos');
    if (id === 'banheiro') vai('banheiro');
    const R = S.inside; if (R.id !== id) { erros.push('nao cheguei em ' + id + ' (' + R.id + ')'); continue; }
    for (const o of R.objs.slice()) {
      if (!o.act || o.t === 'porta') continue;
      try { n++; o.act(S, R, o); for (let i = 0; i < 40 && S.trans; i++) step(1); } catch (e) { erros.push(rot + ' ' + id + ' ' + o.t + ': ' + e.message); }
      if (S.inside !== R) { erros.push(rot + ' ' + id + ' ' + o.t + ' mudou de sala'); break; }
      R.mini = null; R.menu = null; S.inside.sentado = null;
    }
    // desenha um quadro (garante que nada quebra ao pintar)
    try { step(3); } catch (e) { erros.push(rot + ' ' + id + ' desenho: ' + e.message); }
  }
  return { n, erros };
}
(async () => {
  let tot = 0, todos = [];
  for (const [crit, tag, dono] of [['casa:0', 's', false], ['casa:1', 'm', false], ['casa:2', 'r', false], ['casa:0', 's-dono', true], ['casa:1', 'm-dono', true], ['casa:2', 'r-dono', true], ['casa:0v', 's-venda', false], ['casa:1v', 'm-venda', false], ['casa:2v', 'r-venda', false]]) {
    const pl = acha(crit); if (!pl) { console.log(tag, 'sem casa'); continue; }
    S.save.casas = S.save.casas || {}; if (dono) S.save.casas[pl.casa.id] = true; else delete S.save.casas[pl.casa.id];
    S.save.money = 5000;
    if (!entra(pl)) { console.log(tag, 'nao entrou'); continue; }
    const r = rodaSalas(tag); tot += r.n; todos.push(...r.erros);
    console.log(tag, pl.casa.id, 'acoes:', r.n, 'erros:', r.erros.length, r.erros.slice(0, 3).join(' || '));
    // sai para a próxima
    S.inside = null; S.mode = 'play';
  }
  console.log('TOTAL acoes', tot, 'erros', todos.length);
})().catch(e => { console.log('ERRO', e.stack); process.exit(1); });
