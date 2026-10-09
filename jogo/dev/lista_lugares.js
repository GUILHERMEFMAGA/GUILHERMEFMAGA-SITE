// lista os tipos de lugar (para fotografar todos os interiores)
const { G, S, W } = require('./tp.js');
const cont = {};
W.places.forEach(p => { const k = p.tipo + (p.loja ? ':' + p.loja : ''); (cont[k] = cont[k] || []).push(p.id); });
Object.keys(cont).sort().forEach(k => console.log(k.padEnd(24), cont[k].length, cont[k][0]));
console.log('lojas', (W.lojas || []).length);
console.log('--- lugares:', W.places.filter(p => p.tipo === 'lugar').map(p => p.id + '(' + (p.nome || '') + ')').join(', '));
console.log('--- outros:', W.places.filter(p => !['lugar', 'hotel'].includes(p.tipo) && !p.loja).map(p => p.id + '/' + p.tipo).join(', '));
