// desenha a fonte de pixel (pixfont.js) numa imagem para conferir as letras.  uso: OUTDIR=$PWD/out/ node fonte_teste.js
const { G, createCanvas } = require('./load.js');
const fs = require('fs'); const OUT = (process.env.OUTDIR || __dirname + '/out/');
const cv = createCanvas(800, 420), ctx = cv.getContext('2d');
ctx.fillStyle = '#5a4f80'; ctx.fillRect(0, 0, 800, 420);
const F = G.pixfont, linhas = [
  ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#ffe04a'], ['abcdefghijklmnopqrstuvwxyz', '#ffffff'], ['0123456789 !?.,:;-+=/()%$&#*"\'_<>|·×°…º', '#9ff0ff'],
  ['ÁÀÂÃÉÊÍÓÔÕÚÇÜ áàâãéêíóôõúçü', '#ffe04a'], ['BEM-VINDO! APERTE E PERTO DO CARRO VERMELHO.', '#ffe04a'], ['Procure um telefone amarelo no mapa', '#ffffff'],
  ['Pena: 12 dia(s) · Comportamento: 2/3 — Serra Dura ♪', '#9ab6ff'], ['MOTORISTA NOVATO  PUNHOS  corpo a corpo  1º LUGAR', '#ffffff']];
let y = 30;
for (const sc of [1, 2]) for (const [t, c] of linhas) {
  if (sc === 2 && y > 380) break;
  F.desenhar(ctx, t, 10, y + 9 * sc, c, 'left', '#000', 9999 * 0 + t.length * 6 * sc / 1.15);
  y += (F.CEL + 2) * sc + 2; if (y > 410) break;
}
fs.writeFileSync(OUT + 'fonte_teste.png', cv.toBuffer('image/png')); console.log('ok');
process.exit(0);
