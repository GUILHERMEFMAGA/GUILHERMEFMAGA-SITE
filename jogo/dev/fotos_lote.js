// fotografa vários lugares de uma vez (carrega o jogo uma só vez).
// uso: OUTDIR=$PWD/out/ node fotos_lote.js <prefixo> <criterio>[@sala] ...   ex.: node fotos_lote.js q1 id:banco hotel:0@restaurante
const { entra, acha, L, G, S, W, step, shot } = require('./interior.js');
const [, , pre, ...lista] = process.argv;
(async () => {
  for (const item of lista) {
    const [crit, sala] = item.split('@');
    const pl = acha(crit); if (!pl) { console.log('não achei', crit); continue; }
    S.inside = null; S.mode = 'play'; S.trans = null;
    let ok = false;
    try { ok = entra(pl); if (ok && sala) { L.irSala(S, sala); for (let i = 0; i < 70 && (S.trans || S.inside.id !== sala); i++) step(1); step(15); } } catch (e) { console.log('ERRO', item, e.message); continue; }
    const nome = pre + '_' + item.replace(/[:@]/g, '_');
    if (!ok) { console.log('nao entrou', item); continue; }
    shot(nome); console.log('ok', nome, S.inside && S.inside.id, '|', S.inside && S.inside.nome);
  }
})().catch(e => { console.log('ERRO', e.stack); process.exit(1); });
