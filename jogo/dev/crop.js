// OUT=nome node crop.js <foto> x y w h escala
const { createCanvas, loadImage } = require('@napi-rs/canvas'); const fs = require('fs'); const D = process.env.OUTDIR || '/home/user/pw/';
(async () => {
  const [, , n, x, y, w, h, s] = process.argv; const im = await loadImage(D + n + '.png');
  const k = +s || 2, c = createCanvas(+w * k, +h * k), g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(im, +x, +y, +w, +h, 0, 0, +w * k, +h * k);
  fs.writeFileSync(D + (process.env.OUT || n + '_c') + '.png', c.toBuffer('image/png')); console.log('ok');
})();
