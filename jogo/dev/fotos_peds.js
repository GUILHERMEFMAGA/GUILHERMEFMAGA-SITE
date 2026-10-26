// foto de perto de pedestres (para avaliar os sprites).  uso: OUTDIR=$PWD/out/ node fotos_peds.js <nome>
const { G, S, W, P, step, shot, place } = require('./tp.js');
const nome = process.argv[2] || 'peds';
S.dayT = 0.3; S.heat = 0; S.heatLevel = 0;
place(W.nodeX(1) + 500, W.nodeY(0) + 420); step(90);
const vivos = S.peds.filter(p => p.state !== 'dead' && p.kind !== 'cop');
console.log('peds', vivos.length);
const p0 = vivos[0]; if (!p0) process.exit(1);
// junta uns pedestres perto do jogador para a foto
vivos.slice(0, 6).forEach((p, i) => { p.x = W.nodeX(1) + 440 + i * 26; p.y = W.nodeY(0) + 470 + (i % 2) * 18; p.state = 'idle'; p.speed = 0; if (p.vx != null) { p.vx = 0; p.vy = 0; } });
place(W.nodeX(1) + 500, W.nodeY(0) + 430); step(4); S.ban = null; S.msg = null; step(2);
shot(nome); console.log('ok'); process.exit(0);
