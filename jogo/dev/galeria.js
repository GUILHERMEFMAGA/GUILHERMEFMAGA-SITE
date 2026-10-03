// galeria dos móveis: node galeria.js <nome> <grupo>   (grupo: casa | banho | loja ...)
const { G, createCanvas } = require('./load.js');
const fs = require('fs'); const OUTDIR = process.env.OUTDIR || __dirname + '/out/';
const L = G.lugares, K = L.kit, D = G.deco;
const nome = process.argv[2] || 'galeria', grupo = process.argv[3] || 'casa';
const O = (t, w, h, e, p) => Object.assign({ t, x: 0, y: 0, w, h, e: e || 0, solid: true }, p || {});
const GR = {
  casa: [
    O('sofa', 150, 46, 18, { cor: '#a8483a' }), O('sofa', 150, 46, 18, { dir: 's', cor: '#2f4a7a', cor2: '#e8d8a0' }), O('poltrona', 50, 50, 20, { cor: '#4f7a5a', dir: 's' }), O('tv', 120, 34, 34),
    O('geladeira', 60, 44, 56), O('fogao', 56, 40, 30, { ligado: true }), O('pia', 74, 40, 30), O('armario', 110, 44, 64),
    O('cama2', 130, 90, 0, { cor: '#4a78c8' }), O('cama2', 76, 80, 0, { cor: '#e8a040', padrao: 'listras' }), O('cofre', 52, 40, 40), O('cofre', 52, 40, 40, { aberto: true }),
    O('estante', 66, 56, 48), O('estante', 60, 50, 44, { variante: 'frutas' }), O('mesa_rest', 110, 84, 16, { forma: 'redonda' }), O('mesa_rest', 150, 76, 16, { forma: 'ret', toalha: '#f0e8d4' }),
    O('cadeira_rest', 22, 26, 0, { dir: 'n' }), O('cadeira_rest', 22, 26, 0, { dir: 's', cor: '#2f4a7a' }), O('bloco', 60, 34, 24, { top: '#7a5230', front: '#5a3a22' }), O('mesa_centro', 80, 44, 12),
    O('planta', 40, 50, 0, { variante: 'folhagem' }), O('planta', 40, 50, 0, { variante: 'samambaia' }), O('planta', 40, 50, 0, { variante: 'palmeira' }), O('planta', 40, 50, 0, { variante: 'espada' }), O('planta', 40, 50, 0, { variante: 'suculenta' }),
    O('tapete', 200, 110, 0, { cor: '#7a2a3a', cor2: '#d8b878' }), O('tapete', 140, 90, 0, { cor: '#2f5a7a', cor2: '#e8e0c8', padrao: 'geometrico' }), O('tapete', 120, 120, 0, { cor: '#8a7a5a', cor2: '#e8e0c8', forma: 'redondo', padrao: 'pelo' }),
    O('pilha_caixas', 70, 44, 30), O('porta', 56, 54, 0, { placa: 'QUARTOS' }), O('porta', 56, 54, 0, { estilo: 'elevador' }), O('luminaria', 20, 14, 0),
  ],
  banho: [O('vaso_sanitario', 34, 40, 0), O('lavatorio', 56, 40, 26), O('chuveiro', 70, 70, 0), O('banheira', 120, 62, 14), O('cesto', 24, 24, 0), O('lavadora', 50, 44, 34), O('escrivaninha', 120, 54, 22), O('cadeira_esc', 28, 28, 0)]
};
const lista = GR[grupo] || GR.casa; const cols = 6, cw = 200, ch = 170, rows = Math.ceil(lista.length / cols);
const cv = createCanvas(cols * cw, rows * ch + 20), c = cv.getContext('2d');
D.piso(c, 'madeira', 0, 0, cv.width, cv.height, ['#9a7650', '#7e5c3a'], 5);
lista.forEach((o, i) => { o.x = (i % cols) * cw + (cw - o.w) / 2; o.y = Math.floor(i / cols) * ch + 70 + (60 - o.h) / 2; K.desenharObj(c, o, 1.3); c.fillStyle = 'rgba(255,255,255,0.8)'; c.font = '10px Arial'; c.fillText(o.t + (o.variante ? ':' + o.variante : ''), (i % cols) * cw + 6, Math.floor(i / cols) * ch + 12); });
fs.writeFileSync(OUTDIR + nome + '.png', cv.toBuffer('image/png')); console.log('ok', lista.length, cv.width + 'x' + cv.height);
