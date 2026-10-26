// uso: node wshot.js nome x y w h escala   ou   node wshot.js nome bx:by [larg_em_blocos] [escala]
const { G, W, createCanvas, OUTDIR } = require('./wt.js');
const fs = require('fs');
const a = process.argv.slice(2);
let [name, p1] = a, x, y, w, h, s;
if (/^\d+:\d+$/.test(p1)) {
  const [bx, by] = p1.split(':').map(Number), nb = parseFloat(a[2] || '1'), blk = W.blocks.find(b => b.bx === bx && b.by === by);
  x = blk.x - 8 * W.T; y = blk.y - 8 * W.T; w = (nb * W.PITCH + 4) * W.T; h = Math.min(w * 0.75, (W.PITCH + 4) * W.T * nb); s = parseFloat(a[3] || '0.5');
} else { [x, y, w, h, s] = a.slice(1).map(Number); }
const cv = createCanvas(Math.round(w * s), Math.round(h * s)), ctx = cv.getContext('2d');
ctx.scale(s, s); ctx.translate(-x, -y);
const t0 = Date.now();
for (let i = 0; i < 80; i++) W.drawChunks(ctx, x, y, x + w, y + h);
console.log('desenho', Date.now() - t0, 'ms');
fs.mkdirSync(OUTDIR, { recursive: true });
fs.writeFileSync(OUTDIR + name + '.png', cv.toBuffer('image/png')); console.log('ok', OUTDIR + name + '.png', cv.width + 'x' + cv.height);
