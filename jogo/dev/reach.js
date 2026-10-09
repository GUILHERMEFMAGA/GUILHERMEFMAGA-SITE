// confere se todas as portas e pontos de missão estão em chão alcançável a pé
const { G, S, W, P, T } = require('./tp.js');
const TW = W.TW, TH = W.TH, TL = W.tiles, TILE = W.TILE;
const solid = t => t === TILE.BUILD || t === TILE.WATER;
// começa na garagem (onde o jogador nasce)
const sx = Math.floor(P.x / T), sy = Math.floor(P.y / T);
const seen = new Uint8Array(TW * TH), q = [sy * TW + sx]; seen[q[0]] = 1;
for (let h = 0; h < q.length; h++) { const c = q[h], x = c % TW, y = (c / TW) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= TW || ny >= TH) continue; const n = ny * TW + nx; if (seen[n] || solid(TL[n])) continue; seen[n] = 1; q.push(n); } }
const ok = (x, y) => { const tx = Math.floor(x / T), ty = Math.floor(y / T); return tx >= 0 && ty >= 0 && tx < TW && ty < TH && seen[ty * TW + tx] === 1; };
console.log('inicio', sx, sy, 'tile', TL[sy * TW + sx], '| alcançáveis', q.length, 'de', TW * TH);
const falhas = {}; const add = (k, o, x, y) => { (falhas[k] = falhas[k] || []).push((o.nome || o.id || '?') + '@' + Math.round(x) + ',' + Math.round(y) + ' tile=' + TL[Math.floor(y / T) * TW + Math.floor(x / T)]); };
let n = { casas: 0, places: 0, lojas: 0 };
W.casas.forEach(c => { n.casas++; if (!ok(c.x, c.y)) add('casas', c, c.x, c.y); });
W.places.forEach(p => { n.places++; if (!ok(p.x, p.y)) add('places', p, p.x, p.y); });
(W.lojas || []).forEach(p => { n.lojas++; if (!ok(p.x, p.y)) add('lojas', p, p.x, p.y); });
const M = G.missions; if (M && M.PHONES) M.PHONES.forEach(p => { if (!ok(p.x, p.y)) add('telefones', p, p.x, p.y); });
if (M && M.POI) Object.keys(M.POI).forEach(k => { const p = M.POI[k]; if (!ok(p.x, p.y)) add('poi', { nome: k }, p.x, p.y); });
console.log('conferidos', JSON.stringify(n));
Object.keys(falhas).forEach(k => console.log('PRESOS em', k, falhas[k].length, falhas[k].slice(0, 6)));
if (!Object.keys(falhas).length) console.log('TUDO ALCANÇÁVEL');
