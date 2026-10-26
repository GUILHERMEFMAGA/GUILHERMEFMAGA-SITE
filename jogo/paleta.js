/* =====================================================================
   PALETA.JS — o "passe de pixel art" (usado pelo mundo, pelas salas e pelos menus)

   Como funciona (o mesmo truque dos jogos de 16 bits, só que feito por código):
     1) a imagem do jogo (800x600) é reduzida pela metade (400x300)  -> pixels grandes
     2) uma leve NITIDEZ devolve o contraste das bordas                -> contornos limpos
     3) um AJUSTE DE COR por pixel (saturação, contraste, sombra azulada e luz quente)
     4) um TRAMADO leve (matriz de Bayer 8x8) quebra os degradês em "xadrez" fino
     5) cada pixel vira a cor mais parecida da PALETA FIXA (~140 cores)
     6) a imagem é ampliada sem suavizar                               -> pixel art nítida

   A paleta é gerada por rampas de cor (do escuro ao claro) em OKLab, com a regra
   clássica dos pixel artists: as SOMBRAS puxam para o azul/roxo e as LUZES para o amarelo.
   Assim todo o jogo (dia, tarde e noite) fica com as mesmas cores harmoniosas.
   (Se você mudar o ajuste de cor abaixo, refaça a paleta: dev/amostra.js + dev/amostra_salas.js + dev/pal_fit.js.)
   ===================================================================== */
(function (G) {
  'use strict';
  const VW = 800, VH = 600, PW = VW / 2, PH = VH / 2, DEG = Math.PI / 180;
  const P = G.paleta = { cfg: { dither: 0.10, nitidez: 0.40, sat: 1.10, contraste: 1.04, tinta: 1, brancos: 0.6 },
    cfgSala: { nitidez: 0.30, sat: 1.06, dither: 0.08 },      // dentro dos lugares: menos nitidez e menos saturação (muitos detalhes finos)
    cores: [] };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // ---------- conversão de cor: sRGB <-> OKLab (OKLab mede a diferença como o olho enxerga) ----------
  const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const gam = c => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255;
  function paraLab(r, g, b) {
    const R = lin(r), Gg = lin(g), B = lin(b);
    const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * Gg + 0.0514459929 * B);
    const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * Gg + 0.1073969566 * B);
    const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * Gg + 0.6299787005 * B);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  }
  function deLab(L, a, b) {   // devolve [r,g,b] 0..255 (sem cortar) e se coube no sRGB
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3), m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3), s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
    const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
    const ok = r > -0.002 && r < 1.002 && g > -0.002 && g < 1.002 && bb > -0.002 && bb < 1.002;
    const f = v => Math.max(0, Math.min(255, Math.round(gam(Math.max(0, Math.min(1, v))))));
    return { rgb: [f(r), f(g), f(bb)], ok };
  }
  // cor por luminosidade (L), croma (C) e matiz (h, em graus); reduz o croma até caber no sRGB
  function lch(L, C, h) {
    let r;
    for (let k = 0; k < 30; k++) { r = deLab(L, C * Math.cos(h * DEG), C * Math.sin(h * DEG)); if (r.ok) break; C *= 0.92; }
    return r.rgb;
  }

  // ---------- a paleta ----------
  // 192 cores AJUSTADAS às imagens do próprio jogo (mundo de dia/tarde/noite e as salas): foram escolhidas por
  // agrupamento (k-means em OKLab) com a ferramenta dev/pal_fit.js; as 16 mais escuras/claras são uma rampa de cinzas fixa.
  // Escurecem de forma suave e mantêm o visual das cores originais.
  const FIXA =
    '00000206060d14151c24252b34353a45464a56575a68686a7a7a7a8d8c8b9f9e9cb2b1ae' +
    'c6c4bfd9d7d1edeae3fffdf539653bcd9e6dd044361d44161a3493261b1ea4794d77483b' +
    'd774369c424b5fad2b3f4d68428727ba5d59f197481d3a166423211a311659934a5b89a2' +
    'debe6f315739ebc74f452d57e06a9bebaf7f573f2a7b56496c57832b3e22e088af556323' +
    'f4e9b7e6e0d8e19b801d1d33d9a5b3b4477e5549242327697c576675b85e3475233c5020' +
    'f5f1e7325ec8744625932a2087653c91cce161354197acca64542bb29140477acd766f65' +
    '23571a8a765a222d4fa55e40f4e764533e58825a3464a45814291c394281639da5264932' +
    '2e2c3864492f3c7d244a2c2d6aa6cf1a2150b997647926295868a63f4e88ce886d393347' +
    '8bc991916e8adeb045e8c9876690cda36e5e9e864f39171d581d1f5d702ab9bbbd745231' +
    '413c495c4d814433218e635d285f1d716a7f9b5b7d11142f02020d638f6e91959f654a5f' +
    '9455be1f3727aa7d8b182f27b8ab94c2a54eecd8809e927e499126292435b8855be7dbba' +
    '554c4c6c7e2e1d4e181f3f3754667fba683c0b0c176a311ca5deb7b247454b7690a53a27' +
    '3927210d221ee25b498f8371c5639460bfe0dccfb77cad854a191e485921ceb0738c4424' +
    'e38740683e3081838de1bec7d5c4a9396d24bd755e946d3e6d7789985336726034aaa7a6' +
    'c7b8a20202032a3467549d29465b96bc8f9e260e19eb765d8637407c371e2547b42a681d' +
    '54342936461f34224a333d6dab9e89677bb088396b515b70cbcfce5140714b804e487053';

  // cores-chave do mundo (as mesmas do asfalto e das faixas em world.js)
  const CHAVE = ['#625889', '#5a5080', '#6a5f92', '#554b7a', '#41376a', '#eeeaf4', '#cfcade', '#f2c231'];
  // o ajuste de cor de pixelar (saturação, contraste, sombra azulada, luz quente, brancos), para uma cor só
  function ajusteCor(r, g, b, opc) {
    const c = opc ? Object.assign({}, P.cfg, opc) : P.cfg, m = r * 0.3 + g * 0.59 + b * 0.11;
    r = (m + (r - m) * c.sat - 128) * c.contraste + 128; g = (m + (g - m) * c.sat - 128) * c.contraste + 128; b = (m + (b - m) * c.sat - 128) * c.contraste + 128;
    if (c.tinta) { const l = m / 255, sh = (1 - l) * (1 - l) * 9 * c.tinta, hi = l * l * l * 4 * c.tinta; r += hi - sh * 0.35; g += hi * 0.35 + sh * 0.1; b += sh - hi * 0.7; }
    if (r > 215) r = 215 + (r - 215) * c.brancos; if (g > 215) g = 215 + (g - 215) * c.brancos; if (b > 215) b = 215 + (b - 215) * c.brancos;
    const f = v => Math.max(0, Math.min(255, Math.round(v)));
    return [f(r), f(g), f(b)];
  }

  // cores de SEGURANÇA: matizes vivos em 3 luminosidades, só entram onde a paleta ajustada não tem nada parecido
  // (explosões, neons, efeitos raros que não estavam nas fotos de ajuste)
  function construir() {
    const out = FIXA.match(/.{6}/g).map(h => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]);
    const labs = out.map(c => paraLab(c[0], c[1], c[2]));
    // CORES-CHAVE: cores lisas que cobrem a tela inteira (asfalto, rachaduras, faixas). Sem isto, os pontinhos do ASFALTO
    // (roxo-acinzentado) caíam em azuis da paleta e davam "chuvisco azul". Para cada cor-chave calculamos como ela aparece em
    // 24 horas do dia (luz do ambiente da luz.js + o ajuste de cor de pixelar) e acrescentamos à paleta as que ainda não existem.
    const amb = G.luz && G.luz.ambiente;
    for (let k = 0; k < 24; k++) {
      const a = amb ? amb(k / 24) : [238, 236, 228], opc = G.luz && G.luz.opcoesPaleta ? G.luz.opcoesPaleta(G.luz.noiteDe(k / 24)) : null;   // as mesmas opções que o jogo usa naquela hora
      for (const hex of CHAVE) {
        const cor = ajusteCor(parseInt(hex.slice(1, 3), 16) * a[0] / 255, parseInt(hex.slice(3, 5), 16) * a[1] / 255, parseInt(hex.slice(5, 7), 16) * a[2] / 255, opc), q = paraLab(cor[0], cor[1], cor[2]);
        let perto = false;
        for (const o of labs) { const dl = q[0] - o[0], da = q[1] - o[1], db = q[2] - o[2]; if (100 * Math.sqrt(dl * dl + da * da + db * db) < 2.2) { perto = true; break; } }
        if (!perto) { out.push(cor); labs.push(q); }
      }
    }
    for (let k = 0; k < 12; k++) for (const L of [0.45, 0.65, 0.84]) {
      const c = lch(L, 0.30, k * 30 + 12);   // lch() já reduz o croma até caber no sRGB
      const q = paraLab(c[0], c[1], c[2]); let perto = false;
      for (const o of labs) { const dl = q[0] - o[0], da = q[1] - o[1], db = q[2] - o[2]; if (100 * Math.sqrt(dl * dl + da * da + db * db) < 8) { perto = true; break; } }
      if (!perto) { out.push(c); labs.push(q); }
    }
    return out;
  }

  // ---------- tabela de busca: cor (5 bits por canal) -> cor mais próxima da paleta ----------
  let LUT = null;
  function fazLUT(cores) {
    const labs = cores.map(c => paraLab(c[0], c[1], c[2]));
    const lut = new Uint32Array(32768);
    for (let ri = 0; ri < 32; ri++) for (let gi = 0; gi < 32; gi++) for (let bi = 0; bi < 32; bi++) {
      const q = paraLab(ri * 8 + 4, gi * 8 + 4, bi * 8 + 4);
      let melhor = 0, md = 1e9;
      for (let k = 0; k < labs.length; k++) {
        const dl = q[0] - labs[k][0], da = q[1] - labs[k][1], db = q[2] - labs[k][2], d = 1.5 * dl * dl + da * da + db * db;
        if (d < md) { md = d; melhor = k; }
      }
      const c = cores[melhor];
      lut[(ri << 10) | (gi << 5) | bi] = (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0];   // ABGR (pequeno-endian)
    }
    return lut;
  }
  P.iniciar = function () { if (LUT) return; P.cores = construir(); LUT = fazLUT(P.cores); };

  // ---------- matriz de Bayer 8x8 (0..63) ----------
  const BAY = new Uint8Array(64);
  (function () { const b2 = [0, 2, 3, 1]; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { let v = 0; for (let n = 0; n < 3; n++) { const sh = 2 - n; v = v * 4 + b2[(((y >> sh) & 1) << 1) | ((x >> sh) & 1)]; } BAY[y * 8 + x] = v; } })();

  // ---------- telas auxiliares ----------
  const pixC = mk(PW, PH), pxx = pixC.getContext('2d', { willReadFrequently: true });
  const copia = new Uint8ClampedArray(PW * PH * 4), ort = new Uint32Array(PW * PH);

  // faz o passe completo sobre o ctx principal (800x600). o: opções que trocam P.cfg
  P.pixelar = function (ctx, o) {
    P.iniciar();
    const c = o ? Object.assign({}, P.cfg, o) : P.cfg;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    pxx.imageSmoothingEnabled = true; pxx.clearRect(0, 0, PW, PH); pxx.drawImage(ctx.canvas, 0, 0, PW, PH);
    const im = pxx.getImageData(0, 0, PW, PH), d = im.data;
    copia.set(d);
    const s = copia, ok32 = (d.byteOffset & 3) === 0, o32 = ok32 ? new Uint32Array(d.buffer, d.byteOffset, d.length >> 2) : null;
    const NUCLEO = c.nucleo || 40, NIT = c.nitidez, SAT = c.sat, CON = c.contraste, DIT = c.dither, TI = c.tinta, BR = c.brancos, lut = LUT, rowB = PW * 4;
    const GU = c.guardar ? (P.guardado || (P.guardado = new Uint8Array(PW * PH * 3))) : null;   // (ferramenta de teste) guarda a imagem antes da paleta
    for (let y = 0; y < PH; y++) {
      const ym = y > 0 ? -rowB : 0, yp = y < PH - 1 ? rowB : 0, by = (y & 7) << 3;
      for (let x = 0; x < PW; x++) {
        const i = (y * PW + x) * 4, xm = x > 0 ? -4 : 0, xp = x < PW - 1 ? 4 : 0;
        let r = s[i], g = s[i + 1], b = s[i + 2];
        if (NIT > 0) {   // nitidez: realça a diferença para a média dos 4 vizinhos (diferenças pequenas = ruído do asfalto: quase não realça)
          let dr = r - (s[i + xm] + s[i + xp] + s[i + ym] + s[i + yp]) * 0.25, dg = g - (s[i + xm + 1] + s[i + xp + 1] + s[i + ym + 1] + s[i + yp + 1]) * 0.25, db = b - (s[i + xm + 2] + s[i + xp + 2] + s[i + ym + 2] + s[i + yp + 2]) * 0.25;
          const ad = (dr < 0 ? -dr : dr) + (dg < 0 ? -dg : dg) + (db < 0 ? -db : db), k = ad < NUCLEO ? ad / NUCLEO : 1;   // 0..1: cresce com o contraste da borda
          r += dr * NIT * k; g += dg * NIT * k; b += db * NIT * k;
        }
        const m = r * 0.3 + g * 0.59 + b * 0.11;
        r = (m + (r - m) * SAT - 128) * CON + 128; g = (m + (g - m) * SAT - 128) * CON + 128; b = (m + (b - m) * SAT - 128) * CON + 128;
        if (TI) {        // cor de cinema: sombras azuladas, luzes quentes
          const l = m / 255, sh = (1 - l) * (1 - l) * 9 * TI, hi = l * l * l * 4 * TI;
          r += hi - sh * 0.35; g += hi * 0.35 + sh * 0.1; b += sh - hi * 0.7;
        }
        // os brancos "estouravam" (sumiam as linhas do piso): acima de 215 a luz sobe mais devagar
        if (r > 215) r = 215 + (r - 215) * BR; if (g > 215) g = 215 + (g - 215) * BR; if (b > 215) b = 215 + (b - 215) * BR;
        if (GU) { const j = (y * PW + x) * 3; GU[j] = r < 0 ? 0 : r > 255 ? 255 : r; GU[j + 1] = g < 0 ? 0 : g > 255 ? 255 : g; GU[j + 2] = b < 0 ? 0 : b > 255 ? 255 : b; }
        const t = (BAY[by + (x & 7)] - 31.5) * DIT;
        r += t; g += t; b += t;
        r = r < 0 ? 0 : r > 255 ? 255 : r; g = g < 0 ? 0 : g > 255 ? 255 : g; b = b < 0 ? 0 : b > 255 ? 255 : b;
        const cor = lut[((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)];
        if (o32) o32[y * PW + x] = cor; else { d[i] = cor & 255; d[i + 1] = (cor >> 8) & 255; d[i + 2] = (cor >> 16) & 255; d[i + 3] = 255; }
      }
    }
    if (o32 && c.limpa !== 0) {   // pontos soltos: um pixel de cor parecida cercado por 8 vizinhos iguais é ruído, vira a cor dos vizinhos (o tramado em xadrez e os detalhes de contraste ficam)
      ort.set(o32); const LIM = (c.limpa || 62) * (c.limpa || 62);
      for (let y = 1; y < PH - 1; y++) for (let x = 1, k = y * PW + 1; x < PW - 1; x++, k++) {
        const p = ort[k], n = ort[k - 1];
        if (p === n || ort[k + 1] !== n || ort[k - PW] !== n || ort[k + PW] !== n || ort[k - PW - 1] !== n || ort[k - PW + 1] !== n || ort[k + PW - 1] !== n || ort[k + PW + 1] !== n) continue;
        const dr = (p & 255) - (n & 255), dg = ((p >> 8) & 255) - ((n >> 8) & 255), db = ((p >> 16) & 255) - ((n >> 16) & 255);
        if (dr * dr + dg * dg + db * db < LIM) o32[k] = n;
      }
    }
    pxx.putImageData(im, 0, 0);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(pixC, 0, 0, VW, VH);
    ctx.restore();
  };
})(window.G = window.G || {});
