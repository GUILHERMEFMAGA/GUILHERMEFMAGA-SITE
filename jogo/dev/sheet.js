// OUT=nome node sheet.js foto1 foto2 ... (2 colunas, 600x450 cada)
const { createCanvas, loadImage } = require('@napi-rs/canvas'); const fs = require('fs'); const D = process.env.OUTDIR || '/home/user/pw/';
(async () => {
  const names = process.argv.slice(2), cw = 600, ch = 450, rows = Math.ceil(names.length / 2);
  const c = createCanvas(cw * 2, ch * rows), g = c.getContext('2d'); g.fillStyle = '#222'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < names.length; i++) { const im = await loadImage(D + names[i] + '.png'); g.drawImage(im, (i % 2) * cw, Math.floor(i / 2) * ch, cw, ch); g.fillStyle = '#ff0'; g.font = '14px sans-serif'; g.fillText(names[i], (i % 2) * cw + 6, Math.floor(i / 2) * ch + 16); }
  fs.writeFileSync(D + (process.env.OUT || 'sheet') + '.png', c.toBuffer('image/png')); console.log('ok');
})();
