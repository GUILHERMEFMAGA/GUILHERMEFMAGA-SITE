/* =====================================================================
   PIXFONT.JS — fonte de PIXEL (5x7) para a interface do jogo
   Cada letra é um desenho de "#" (pixel aceso) e "." (apagado). O texto é montado em
   uma tela pequena (com contorno preto de 1 pixel) e fica guardado em memória para não
   ser refeito a cada quadro. As letras acentuadas (á, ã, ç, ô...) são montadas juntando
   a letra com o acento.
   Quem usa: hud.js (G.hud.txt). Se alguma letra não existir na fonte, o texto é
   desenhado com a fonte normal do navegador (nada fica faltando).
   ===================================================================== */
(function (G) {
  'use strict';
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // célula: 11 linhas = 2 (acentos) + 7 (letra) + 2 (rabinho de g, j, p, q, y). A linha de base fica depois da linha 8.
  const TOPO = 2, CEL = 11, BASE = 9;
  const GL = {};                                    // caractere -> { w, px: [[x, y], ...] }
  function def(ch, y0, rows) {
    if (typeof rows === 'string') rows = rows.split('/');
    const w = rows[0].length, px = [];
    rows.forEach((r, j) => { if (r.length !== w) throw new Error('pixfont: linha torta em ' + ch); for (let i = 0; i < w; i++) if (r[i] === '#') px.push([i, y0 + TOPO + j]); });
    GL[ch] = { w, px };
  }

  // ---------- MAIÚSCULAS ----------
  def('A', 0, '.###./#...#/#...#/#####/#...#/#...#/#...#');
  def('B', 0, '####./#...#/#...#/####./#...#/#...#/####.');
  def('C', 0, '.###./#...#/#..../#..../#..../#...#/.###.');
  def('D', 0, '####./#...#/#...#/#...#/#...#/#...#/####.');
  def('E', 0, '#####/#..../#..../####./#..../#..../#####');
  def('F', 0, '#####/#..../#..../####./#..../#..../#....');
  def('G', 0, '.###./#...#/#..../#.###/#...#/#...#/.####');
  def('H', 0, '#...#/#...#/#...#/#####/#...#/#...#/#...#');
  def('I', 0, '###/.#./.#./.#./.#./.#./###');
  def('J', 0, '....#/....#/....#/....#/#...#/#...#/.###.');
  def('K', 0, '#...#/#..#./#.#../##.../#.#../#..#./#...#');
  def('L', 0, '#..../#..../#..../#..../#..../#..../#####');
  def('M', 0, '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#');
  def('N', 0, '#...#/##..#/#.#.#/#..##/#...#/#...#/#...#');
  def('O', 0, '.###./#...#/#...#/#...#/#...#/#...#/.###.');
  def('P', 0, '####./#...#/#...#/####./#..../#..../#....');
  def('Q', 0, '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#');
  def('R', 0, '####./#...#/#...#/####./#.#../#..#./#...#');
  def('S', 0, '.####/#..../#..../.###./....#/....#/####.');
  def('T', 0, '#####/..#../..#../..#../..#../..#../..#..');
  def('U', 0, '#...#/#...#/#...#/#...#/#...#/#...#/.###.');
  def('V', 0, '#...#/#...#/#...#/#...#/#...#/.#.#./..#..');
  def('W', 0, '#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#');
  def('X', 0, '#...#/#...#/.#.#./..#../.#.#./#...#/#...#');
  def('Y', 0, '#...#/#...#/.#.#./..#../..#../..#../..#..');
  def('Z', 0, '#####/....#/...#./..#../.#.../#..../#####');
  // ---------- NÚMEROS ----------
  def('0', 0, '.###./#...#/#..##/#.#.#/##..#/#...#/.###.');
  def('1', 0, '..#../.##../..#../..#../..#../..#../.###.');
  def('2', 0, '.###./#...#/....#/...#./..#../.#.../#####');
  def('3', 0, '####./....#/....#/.###./....#/....#/####.');
  def('4', 0, '...#./..##./.#.#./#..#./#####/...#./...#.');
  def('5', 0, '#####/#..../####./....#/....#/#...#/.###.');
  def('6', 0, '.###./#..../#..../####./#...#/#...#/.###.');
  def('7', 0, '#####/....#/...#./..#../.#.../.#.../.#...');
  def('8', 0, '.###./#...#/#...#/.###./#...#/#...#/.###.');
  def('9', 0, '.###./#...#/#...#/.####/....#/....#/.###.');
  // ---------- minúsculas ----------
  def('a', 2, '.###./....#/.####/#...#/.####');
  def('b', 0, '#..../#..../####./#...#/#...#/#...#/####.');
  def('c', 2, '.###./#...#/#..../#...#/.###.');
  def('d', 0, '....#/....#/.####/#...#/#...#/#...#/.####');
  def('e', 2, '.###./#...#/#####/#..../.###.');
  def('f', 0, '..##/.#../###./.#../.#../.#../.#..');
  def('g', 2, '.####/#...#/#...#/#...#/.####/....#/.###.');
  def('h', 0, '#..../#..../####./#...#/#...#/#...#/#...#');
  def('i', 0, '.#./.../##./.#./.#./.#./###');
  def('ı', 2, '##./.#./.#./.#./###');                 // "i" sem pingo (base dos acentos)
  def('j', 0, '..#./..../.##./..#./..#./..#./..#./#.#./.#..');
  def('k', 0, '#..../#..../#..#./#.#../##.../#.#../#..#.');
  def('l', 0, '##./.#./.#./.#./.#./.#./###');
  def('m', 2, '##.#./#.#.#/#.#.#/#...#/#...#');
  def('n', 2, '####./#...#/#...#/#...#/#...#');
  def('o', 2, '.###./#...#/#...#/#...#/.###.');
  def('p', 2, '####./#...#/#...#/#...#/####./#..../#....');
  def('q', 2, '.####/#...#/#...#/#...#/.####/....#/....#');
  def('r', 2, '#.##/##../#.../#.../#...');
  def('s', 2, '.####/#..../.###./....#/####.');
  def('t', 1, '.#../###./.#../.#../.#.#/..#.');
  def('u', 2, '#...#/#...#/#...#/#..##/.##.#');
  def('v', 2, '#...#/#...#/#...#/.#.#./..#..');
  def('w', 2, '#...#/#...#/#.#.#/#.#.#/.#.#.');
  def('x', 2, '#...#/.#.#./..#../.#.#./#...#');
  def('y', 2, '#...#/#...#/#...#/.####/....#/#...#/.###.');
  def('z', 2, '#####/...#./..#../.#.../#####');
  // ---------- pontuação e símbolos ----------
  def(' ', 0, '.../.../.../.../.../.../...');
  def('.', 0, ['.', '.', '.', '.', '.', '.', '#']);
  def(',', 0, ['..', '..', '..', '..', '..', '.#', '#.']);
  def('!', 0, ['#', '#', '#', '#', '#', '.', '#']);
  def('?', 0, '.###./#...#/....#/...#./..#../...../..#..');
  def(':', 0, ['.', '.', '#', '.', '.', '#', '.']);
  def(';', 0, ['..', '..', '.#', '..', '..', '.#', '#.']);
  def('-', 0, '..../..../..../####/..../..../....');
  def('—', 0, '......./......./......./#######/......./......./.......');
  def('–', 0, '...../...../...../#####/...../...../.....');
  def('+', 0, '...../..#../..#../#####/..#../..#../.....');
  def('=', 0, '...../...../#####/...../#####/...../.....');
  def('/', 0, '....#/....#/...#./..#../.#.../#..../#....');
  def('(', 0, '..#/.#./#../#../#../.#./..#');
  def(')', 0, '#../.#./..#/..#/..#/.#./#..');
  def('[', 0, '###/#../#../#../#../#../###');
  def(']', 0, '###/..#/..#/..#/..#/..#/###');
  def('%', 0, '##..#/##..#/...#./..#../.#.../#..##/#..##');
  def('$', 0, '..#../.####/#.#../.###./..#.#/####./..#..');
  def('&', 0, '.##../#..#./#.#../.#.../#.#.#/#..#./.##.#');
  def('#', 0, '.#.#./.#.#./#####/.#.#./#####/.#.#./.#.#.');
  def('*', 0, '...../..#../#.#.#/.###./#.#.#/..#../.....');
  def('"', 0, '#.#/#.#/.../.../.../.../...');
  def("'", 0, ['#', '#', '.', '.', '.', '.', '.']);
  def('_', 0, '...../...../...../...../...../...../#####');
  def('<', 0, '...#./..#../.#.../#..../.#.../..#../...#.');
  def('>', 0, '.#.../..#../...#./....#/...#./..#../.#...');
  def('|', 0, ['#', '#', '#', '#', '#', '#', '#']);
  def('·', 0, ['.', '.', '.', '#', '.', '.', '.']);
  def('×', 0, '...../...../#...#/.#.#./..#../.#.#./#...#');
  def('°', 0, '.#./#.#/.#./.../.../.../...');
  def('…', 0, '...../...../...../...../...../...../#.#.#');
  def('º', 0, '.#./#.#/#.#/.#./###');
  def('♪', 0, '...##/...#./...#./...#./.###./####./.##..');

  // ---------- acentos (marcas sobre a letra) ----------
  const MARCA = { agudo: ['..#', '.#.'], grave: ['#..', '.#.'], circ: ['.#.', '#.#'], til: ['.#.#', '#.#.'], trema: ['#.#'], cedilha: ['.#.', '##.'] };
  function junta(novo, base, marca, maiusc) {
    const b = GL[base], m = MARCA[marca], px = b.px.map(p => p.slice());
    const w = Math.max(b.w, m[0].length), dx = Math.floor((b.w - m[0].length) / 2) + (marca === 'agudo' ? 1 : 0);
    if (marca === 'cedilha') m.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') px.push([Math.max(0, dx) + i, 9 + j]); });
    else {
      const topo = maiusc ? 0 : 1, y = topo + (m.length === 1 ? 1 : 0);
      m.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') px.push([Math.max(0, dx) + i, y + j]); });
    }
    GL[novo] = { w, px };
  }
  [['a', 'á', 'agudo'], ['e', 'é', 'agudo'], ['ı', 'í', 'agudo'], ['o', 'ó', 'agudo'], ['u', 'ú', 'agudo'],
   ['a', 'à', 'grave'], ['e', 'è', 'grave'], ['o', 'ò', 'grave'], ['a', 'â', 'circ'], ['e', 'ê', 'circ'], ['o', 'ô', 'circ'],
   ['a', 'ã', 'til'], ['o', 'õ', 'til'], ['u', 'ü', 'trema'], ['c', 'ç', 'cedilha']].forEach(([b, n, m]) => junta(n, b, m, false));
  [['A', 'Á', 'agudo'], ['E', 'É', 'agudo'], ['I', 'Í', 'agudo'], ['O', 'Ó', 'agudo'], ['U', 'Ú', 'agudo'],
   ['A', 'À', 'grave'], ['E', 'È', 'grave'], ['A', 'Â', 'circ'], ['E', 'Ê', 'circ'], ['O', 'Ô', 'circ'],
   ['A', 'Ã', 'til'], ['O', 'Õ', 'til'], ['U', 'Ü', 'trema'], ['C', 'Ç', 'cedilha']].forEach(([b, n, m]) => junta(n, b, m, true));

  const TROCA = { '’': "'", '‘': "'", '“': '"', '”': '"' };
  const glifo = ch => GL[TROCA[ch] || ch];

  // largura em pixels da fonte (sem escala); undefined se algum caractere não existe
  function colunas(s) {
    let n = 0;
    for (const ch of s) { const g = glifo(ch); if (!g) return undefined; n += g.w + 1; }
    return n - 1;
  }
  const VIZ = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  const cache = new Map();
  function montar(s, sc, cor, contorno) {
    const chave = sc + '|' + cor + '|' + contorno + '|' + s;
    let e = cache.get(chave); if (e) return e;
    const cols = colunas(s), pad = contorno ? sc : 0;
    const c = mk(cols * sc + pad * 2, CEL * sc + pad * 2), g = c.getContext('2d');
    let cx = 0; const lista = [];
    for (const ch of s) { const gl = glifo(ch); lista.push([cx, gl]); cx += gl.w + 1; }
    if (contorno) { g.fillStyle = contorno; lista.forEach(([x0, gl]) => gl.px.forEach(([px, py]) => VIZ.forEach(([dx, dy]) => g.fillRect(pad + (x0 + px + dx) * sc, pad + (py + dy) * sc, sc, sc)))); }
    g.fillStyle = cor; lista.forEach(([x0, gl]) => gl.px.forEach(([px, py]) => g.fillRect(pad + (x0 + px) * sc, pad + py * sc, sc, sc)));
    e = { c, w: cols * sc, pad }; if (cache.size > 400) cache.clear(); cache.set(chave, e); return e;
  }

  // escala (tamanho de cada pixel da fonte) pelo tamanho do texto pedido: assim o resultado não depende da fonte do navegador.
  // A altura da letra de pixel (7 x escala) fica parecida com a da letra normal do mesmo tamanho; e se mesmo assim o texto
  // ficar bem mais largo que o normal (estimativa de 0,6 x tamanho por letra), diminui a escala: nenhuma caixa estoura.
  function escala(cols, tam, n) {
    let sc = tam < 13 ? 1 : tam < 24 ? 2 : tam < 36 ? 3 : tam < 48 ? 4 : 6;
    while (sc > 1 && cols * sc > 0.6 * tam * n * 1.5) sc--;
    return sc;
  }
  // largura em pixels da tela que o texto terá com essa fonte (ou undefined se faltar letra: aí vale a fonte normal)
  function largura(s, tam) { s = String(s); const cols = colunas(s); return cols === undefined ? undefined : cols * escala(cols, tam, s.length); }

  // desenha o texto com a base da letra em y. devolve false se não puder (aí quem chamou usa a fonte normal)
  function desenhar(ctx, s, x, y, cor, alinhar, contorno, tam) {
    s = String(s); const cols = colunas(s); if (cols === undefined || !s.length) return false;
    const sc = escala(cols, tam, s.length), e = montar(s, sc, cor, contorno);
    const x0 = alinhar === 'center' ? x - e.w / 2 : alinhar === 'right' ? x - e.w : x;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(e.c, Math.round(x0 - e.pad), Math.round(y - BASE * sc - e.pad));
    ctx.restore();
    return true;
  }

  // ---------- interruptor: faz TODO fillText/strokeText deste ctx usar a fonte de pixel (telas de dentro dos lugares) ----------
  // (vale só para este ctx; textos com degradê, sombra brilhante ou letras que a fonte não tem continuam normais)
  function brilho(cor) {
    let m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(cor);
    if (m) return 0.3 * parseInt(m[1], 16) + 0.59 * parseInt(m[2], 16) + 0.11 * parseInt(m[3], 16);
    m = /rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(cor);
    return m ? 0.3 * +m[1] + 0.59 * +m[2] + 0.11 * +m[3] : 255;
  }
  function ligar(ctx) {
    if (ctx.__pf) return; ctx.__pf = true;
    const P = Object.getPrototypeOf(ctx);
    const pode = (c, s) => /(\d+(?:\.\d+)?)px/.test(c.font) && typeof c.fillStyle === 'string' && !(c.shadowBlur > 0) && colunas(String(s)) !== undefined;
    ctx.fillText = function (s, x, y, mw) {
      if (pode(this, s)) {
        const tam = parseFloat(/(\d+(?:\.\d+)?)px/.exec(this.font)[1]), b = this.textBaseline, cor = this.fillStyle;
        const yy = b === 'middle' ? y + tam * 0.36 : b === 'top' || b === 'hanging' ? y + tam * 0.72 : b === 'bottom' ? y - tam * 0.2 : y;
        if (desenhar(this, s, x, yy, cor, this.textAlign || 'left', brilho(cor) > 90 ? '#000' : null, tam)) return;
      }
      return P.fillText.call(this, s, x, y, mw);
    };
    ctx.strokeText = function (s, x, y, mw) { if (pode(this, s)) return; return P.strokeText.call(this, s, x, y, mw); };   // o contorno já vem na própria fonte de pixel
  }
  function desligar(ctx) { if (!ctx.__pf) return; delete ctx.fillText; delete ctx.strokeText; ctx.__pf = false; }

  G.pixfont = { ligar, desligar, desenhar, largura, colunas, escala, montar, glifos: GL, CEL, BASE };
})(window.G = window.G || {});
