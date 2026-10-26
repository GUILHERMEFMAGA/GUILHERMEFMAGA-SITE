// foto do jogo com a faixa grande, legenda e arma, para avaliar a interface.  uso: OUTDIR=$PWD/out/ node fotos_hud.js <nome>
const { G, S, W, P, step, shot, place } = require('./tp.js');
const nome = process.argv[2] || 'hud';
S.dayT = 0.3; S.heat = 0; S.heatLevel = 0; S.save.money = 1250; P.hp = 60;
place(W.nodeX(1) + 500, W.nodeY(0) + 420); step(40);
G.banner('RIBEIRÃO PRETO', 'de volta para casa'); G.say('Você comprou o ingresso! Passe pelas catracas e entre no campo.', 6);
S.heatLevel = 2; S.chasers = 1; P.weapon = 'pistol'; step(6);
shot(nome); console.log('ok'); process.exit(0);
