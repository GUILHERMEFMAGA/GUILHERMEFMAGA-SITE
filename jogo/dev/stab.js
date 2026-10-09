// estabilidade: roda o jogo alguns segundos em 2 lugares e procura erros (NaN, carro parado dentro de parede, exceções)
const { G, S, W, P, T, step, place } = require('./tp.js');
function medir(nome, x, y, quadros) {
  place(x, y); const t0 = Date.now(); let erros = 0, maxCarros = 0, preso = 0, nan = 0, dentroSolido = 0, nChunk0 = 0;
  for (let f = 0; f < quadros; f += 30) {
    try { step(30); } catch (e) { erros++; console.log('EXCECAO', e.message.slice(0, 120)); break; }
    maxCarros = Math.max(maxCarros, S.cars.length);
    S.cars.forEach(c => { if (!isFinite(c.x) || !isFinite(c.y)) nan++; else if (W.isSolid(c.x, c.y) && !c.dead) dentroSolido++; });
  }
  S.cars.forEach(c => { if (!c.dead && c.driver === 'ai' && Math.abs(c.vf) < 3) preso++; });
  console.log(nome, '| quadros', quadros, '| ms/quadro', ((Date.now() - t0) / quadros).toFixed(1), '| carros(max)', maxCarros, 'peds', S.peds.length, '| NaN', nan, 'em-parede', dentroSolido, 'parados', preso, '| erros', erros);
}
medir('bairro', W.nodeX(7) + 400, W.nodeY(1) + 300, 600);
medir('rodovia-mata', W.nodeX(24) + 300, W.nodeY(5) + 110, 600);
medir('centro', W.nodeX(2) + 300, W.nodeY(2) + 300, 600);
