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
  lojas: [
    O('cadeira', 22, 22, 0), O('mesa', 56, 40, 18), O('gondola', 110, 36, 34, { nome: 'RAÇÃO', cores: ['#c8402a', '#2a58b8', '#e0b030'] }), O('balcao', 200, 40, 28, { itens: 'pastel' }),
    O('freezer', 110, 40, 26), O('banco_espera', 150, 26, 16), O('recepcao', 150, 40, 30), O('jukebox', 56, 30, 50),
    O('bancada', 220, 44, 26), O('beliche', 90, 46, 24), O('arara', 120, 36, 36), O('supino', 150, 60, 14),
    O('grade', 160, 14, 90), O('caixa_reg', 100, 40, 0, { aberto: true }), O('cadeira_b', 46, 46, 20), O('sinuca', 170, 92, 16),
    O('saco', 30, 30, 0), O('provador', 90, 30, 0), O('halteres', 160, 36, 34), O('espreguicadeira', 34, 62, 0, { cor: '#e8402a' }),
    O('bebedouro', 36, 36, 36), O('banco_igreja', 170, 22, 14), O('balanca', 40, 40, 10), O('velas', 70, 40, 28),
    O('pilha_carrinhos', 70, 38, 0), O('panelao', 100, 44, 30), O('palco', 200, 60, 24), O('halter', 90, 18, 10),
    O('confessionario', 76, 64, 76), O('computador', 110, 40, 24), O('balcao_padaria', 200, 30, 28), O('altar', 120, 46, 30),
    O('esteira', 76, 60, 16), O('torre', 40, 14, 0), O('cesta', 70, 14, 0), O('mesa', 90, 60, 18),
  ],
  lojas2: [
    O('prateleira', 110, 36, 52, { tema: 'tintas', nome: 'TINTAS' }), O('prateleira', 110, 36, 52, { tema: 'parafusos', nome: 'PARAFUSOS' }), O('prateleira', 110, 36, 52, { tema: 'racao', nome: 'RAÇÃO' }), O('prateleira', 110, 36, 52, { tema: 'pet' }),
    O('prateleira', 110, 36, 52, { tema: 'celulares', front: '#3a3e48' }), O('prateleira', 110, 36, 52, { tema: 'garrafas', front: '#5a3a22' }), O('prateleira', 110, 36, 52, { tema: 'vasos', front: '#8a6a40' }), O('prateleira', 110, 36, 52, { tema: 'tenis', front: '#c8c8d0' }),
    O('prateleira', 110, 36, 52, { tema: 'doces', front: '#f0a0c0' }), O('prateleira', 110, 36, 52, { tema: 'graos' }), O('prateleira', 110, 36, 52, { tema: 'bebidas', front: '#2a58b8' }), O('prateleira', 110, 36, 52, { tema: 'oculos', front: '#2a2d36' }),
    O('vitrine', 140, 44, 38, { tema: 'carne' }), O('vitrine', 140, 44, 38, { tema: 'doces' }), O('vitrine', 140, 44, 38, { tema: 'oculos', front: '#2a2d36' }), O('vitrine', 140, 44, 38, { tema: 'celular', front: '#3a3e48' }),
    O('vitrine', 140, 44, 38, { tema: 'sorvete', front: '#e8a0c0' }), O('arara', 120, 30, 40, { tema: 'camisa' }), O('arara', 120, 30, 40, { tema: 'calca' }), O('manequim', 30, 30, 64, { cor: '#e84a8a' }),
    O('aquario', 120, 50, 46), O('gaiola', 70, 44, 28), O('gaiola', 70, 44, 28, { bicho: 'gato', cor: '#aaa' }), O('cama_pet', 90, 44, 0),
    O('balde_flores', 120, 40, 40), O('mesa', 56, 40, 18, { estilo: 'cafe' }), O('mesa', 60, 44, 18, { estilo: 'lanche' }), O('mesa', 56, 40, 18, { estilo: 'bar' }),
    O('mesa', 56, 40, 18, { estilo: 'sorvete' }), O('cadeira', 22, 22, 0, { dir: 'n' }), O('cadeira', 22, 22, 0, { dir: 's', estilo: 'plastico' }), O('cadeira', 22, 22, 0, { dir: 'e', estilo: 'plastico', cor: '#f2c82a' }),
    O('banco_espera', 150, 26, 16), O('cepo', 44, 44, 26), O('caixote_frutas', 110, 36, 20), O('pilha_sacos', 70, 44, 34),
    O('pilha_sacos', 70, 44, 34, { tipo: 'racao' }), O('escada', 34, 10, 70), O('cabine_prova', 70, 40, 70), O('mesa_expo', 120, 50, 24, { tema: 'eletronicos' }),
    O('mesa_expo', 120, 50, 24, { tema: 'livros' }), O('mesa_expo', 120, 50, 24, { tema: 'volantes', top: '#d8c8a0', front: '#a88a58' }), O('mesa_expo', 120, 50, 24, { tema: 'roupas' }), O('mesa_expo', 120, 50, 24, { tema: 'doces' }),
    O('vidro_guiche', 160, 6, 52), O('fila', 100, 10, 26), O('pendente', 30, 10, 90),
  ],
  novos3: [
    O('recepcao', 260, 44, 30), O('bancada', 220, 44, 26), O('beliche', 90, 46, 24), O('grade', 160, 14, 90), O('esteira', 76, 60, 16), O('supino', 150, 60, 14),
    O('halteres', 160, 36, 34), O('espreguicadeira', 34, 62, 0, { cor: '#e8402a' }), O('banco_igreja', 170, 22, 14), O('altar', 120, 46, 30), O('confessionario', 76, 64, 76), O('palco', 200, 60, 24),
    O('panelao', 100, 44, 30), O('computador', 110, 40, 24), O('balcao_padaria', 200, 30, 28), O('caixa_reg', 100, 40, 22, { aberto: true }), O('pilha_carrinhos', 70, 38, 0), O('torre', 40, 14, 0),
    O('halter', 90, 18, 10), O('cofre_banco', 120, 60, 46),
  ],
  banho: [O('vaso_sanitario', 34, 40, 0), O('lavatorio', 56, 40, 26), O('chuveiro', 70, 70, 0), O('banheira', 120, 62, 14), O('cesto', 24, 24, 0), O('lavadora', 50, 44, 34), O('escrivaninha', 120, 54, 22), O('cadeira_esc', 28, 28, 0)]
};
const lista = GR[grupo] || GR.casa; const cols = 6, cw = 200, ch = 170, rows = Math.ceil(lista.length / cols);
const cv = createCanvas(cols * cw, rows * ch + 20), c = cv.getContext('2d');
D.piso(c, 'madeira', 0, 0, cv.width, cv.height, ['#9a7650', '#7e5c3a'], 5);
lista.forEach((o, i) => { o.x = (i % cols) * cw + (cw - o.w) / 2; o.y = Math.floor(i / cols) * ch + 70 + (60 - o.h) / 2; K.desenharObj(c, o, 1.3); c.fillStyle = 'rgba(255,255,255,0.8)'; c.font = '10px Arial'; c.fillText(o.t + (o.variante ? ':' + o.variante : ''), (i % cols) * cw + 6, Math.floor(i / cols) * ch + 12); });
fs.writeFileSync(OUTDIR + nome + '.png', cv.toBuffer('image/png')); console.log('ok', lista.length, cv.width + 'x' + cv.height);
