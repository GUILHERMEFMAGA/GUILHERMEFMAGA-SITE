// diagnóstico da paleta: para cada cor de teste mostra a cor da paleta em que ela cai (sem tramado e sem nitidez).
// uso: node pal_teste.js '#625889' '#5a5080' ...   (sem argumentos: cores do asfalto e das faixas)
const { G, canvas } = require('./load.js');
const ctx = canvas.getContext('2d');
const lista = process.argv.slice(2).length ? process.argv.slice(2) : ['#625889', '#5a5080', '#6a5f92', '#554b7a', '#41376a', '#eeeaf4', '#cfcade', '#dcd8e8', '#f2c231', '#4a9038', '#8c6e49', '#ece1a2'];
const hex = c => '#' + [c[0], c[1], c[2]].map(v => v.toString(16).padStart(2, '0')).join('');
const matiz = c => { const [r, g, b] = c, mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx === mn) return 'cinza'; const d = mx - mn; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = Math.round(((h * 60) + 360) % 360); return h + '°'; };
for (const lum of [1.0, 0.8, 0.6]) {   // simula iluminação (multiplica a cor) para ver como se comporta de manhã/tarde/noite
  console.log('--- luz x' + lum);
  for (const h of lista) {
    const r = parseInt(h.slice(1, 3), 16) * lum, g = parseInt(h.slice(3, 5), 16) * lum, b = parseInt(h.slice(5, 7), 16) * lum;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')'; ctx.fillRect(0, 0, 800, 600);
    G.paleta.pixelar(ctx, { nitidez: 0, dither: 0, limpa: 0 });
    const d = ctx.getImageData(400, 300, 1, 1).data, c = [d[0], d[1], d[2]];
    console.log(h, '->', hex(c), 'matiz', matiz(c), '| entrada matiz', matiz([r | 0, g | 0, b | 0]));
  }
}
process.exit(0);
