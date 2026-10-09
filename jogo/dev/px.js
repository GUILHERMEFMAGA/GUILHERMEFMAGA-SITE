// lê a cor de alguns pixels de varias fotos.  uso: node px.js x,y x,y -- foto1 foto2 ...
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const D = process.env.OUTDIR || __dirname + '/out/';
(async () => {
  const a = process.argv.slice(2), k = a.indexOf('--'); const pts = a.slice(0, k).map(s => s.split(',').map(Number)), fotos = a.slice(k + 1);
  for (const f of fotos) {
    const im = await loadImage(D + f + '.png'), c = createCanvas(im.width, im.height), g = c.getContext('2d'); g.drawImage(im, 0, 0);
    console.log(f.padEnd(24), pts.map(([x, y]) => { const d = g.getImageData(x, y, 1, 1).data; return '(' + d[0] + ',' + d[1] + ',' + d[2] + ')'; }).join(' '));
  }
})();
