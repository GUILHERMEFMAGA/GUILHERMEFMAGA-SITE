// foto da TELA de dentro de um lugar (como o jogador vê: com título, prompt, mensagem e menu).  uso: node fotos_dentro.js <nome> <criterio> [menu]
const { entra, acha, L, G, S, step, shot } = require('./interior.js');
const [, , nome = 'dentro', crit = 'tipo:hospital', menu] = process.argv;
const pl = acha(crit); if (!pl) { console.log('não achei', crit); process.exit(1); }
S.save.money = 1250; entra(pl); step(20);
const R = S.inside;
if (menu) { const o = R.objs.find(o => o.act && o.t !== 'porta' && (menu === 'sim' || (o.label || '').includes(menu))); if (o) { R.px = o.x + o.w / 2; R.py = o.y + o.h + 20; step(3); o.act(S, R, o); } }
else { const o = R.objs.find(o => o.act && o.t !== 'porta'); if (o) { R.px = o.x + o.w / 2; R.py = o.y + o.h + 24; } }
G.say('Atendimento pelo SUS é gratuito, viu? Aqui é o pronto-socorro.', 6); step(8);
shot(nome); console.log('ok', R.nome, '| menu:', !!R.menu, '| prompt:', S.prompt);
process.exit(0);
