// mostra o efeito de paletas na mesma foto crua.   uso: node pal_demo.js <saida> <frame> <dither> <pal1.json|orig> [pal2.json ...]
const fs = require('fs'); const { createCanvas } = require('@napi-rs/canvas'); const { lab, WL, D } = require('./pal_fit.js');
const OUT = process.env.OUTDIR || __dirname + '/out/';
const [, , saida, frame, dith, ...pals] = process.argv; const DIT = +dith;
const buf = fs.readFileSync(D + frame + '.rgb'), PW = 400, PH = 300;
const BAY = new Uint8Array(64); { const b2 = [0, 2, 3, 1]; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { let v = 0; for (let n = 0; n < 3; n++) { const sh = 2 - n; v = v * 4 + b2[(((y >> sh) & 1) << 1) | ((x >> sh) & 1)]; } BAY[y * 8 + x] = v; } }
function lut(hex) { const cs = hex.map(h => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]), ls = cs.map(c => lab(...c)), t = new Uint32Array(32768);
  for (let r = 0; r < 32; r++) for (let g = 0; g < 32; g++) for (let b = 0; b < 32; b++) { const q = lab(r * 8 + 4, g * 8 + 4, b * 8 + 4); let m = 0, md = 1e9; for (let k = 0; k < ls.length; k++) { const dl = q[0] - ls[k][0], da = q[1] - ls[k][1], db = q[2] - ls[k][2], d = WL * dl * dl + da * da + db * db; if (d < md) { md = d; m = k; } } const c = cs[m]; t[(r << 10) | (g << 5) | b] = (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]; } return t; }
const n = pals.length, cw = 600, ch = 450, cols = 2, rows = Math.ceil(n / cols), sheet = createCanvas(cw * cols, ch * rows), sg = sheet.getContext('2d');
pals.forEach((p, idx) => {
  const c = createCanvas(PW, PH), g = c.getContext('2d'), im = g.createImageData(PW, PH), o32 = new Uint32Array(im.data.buffer);
  const L = p === 'orig' ? null : lut(JSON.parse(fs.readFileSync(OUT + p)));
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { const i = (y * PW + x) * 3; let r = buf[i], gg = buf[i + 1], b = buf[i + 2];
    if (!L) { o32[y * PW + x] = (255 << 24) | (b << 16) | (gg << 8) | r; continue; }
    const t = (BAY[((y & 7) << 3) | (x & 7)] - 31.5) * DIT; r = Math.max(0, Math.min(255, r + t)); gg = Math.max(0, Math.min(255, gg + t)); b = Math.max(0, Math.min(255, b + t));
    o32[y * PW + x] = L[((r >> 3) << 10) | ((gg >> 3) << 5) | (b >> 3)]; }
  g.putImageData(im, 0, 0); sg.imageSmoothingEnabled = false; sg.drawImage(c, (idx % cols) * cw, Math.floor(idx / cols) * ch, cw, ch);
  sg.fillStyle = '#ff0'; sg.font = '16px sans-serif'; sg.fillText(p + ' d=' + DIT, (idx % cols) * cw + 8, Math.floor(idx / cols) * ch + 20);
});
fs.writeFileSync(OUT + saida + '.png', sheet.toBuffer('image/png')); console.log('ok', saida);
