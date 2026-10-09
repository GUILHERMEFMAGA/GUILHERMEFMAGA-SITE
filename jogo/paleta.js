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
  const P = G.paleta = { cfg: { dither: 0.0, nitidez: 0.20, sat: 1.05, contraste: 1.02, tinta: 0.5, brancos: 0.8 },
    cfgSala: { nitidez: 0.15, sat: 1.02, dither: 0.0 },      // dentro dos lugares: menos nitidez e menos saturação
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
    '00000202020302020d06060d0b0c1811132c14151c0b1d202a111a1d1a2a151b410e2428' +
    '13271d2e1d1d23203241162024252b1b21592123421a2e1e162f312a283a20351e3a2723' +
    '3225494e1e233b1f58232d5f302e39152c8f213e1b243b2c5f1f23343048472e2934353a' +
    '22481d432d552f42262d3670573028323b593f3b4370272a24501f5033454d3b293b4a23' +
    '2a4f3c60372c275821384664842b2a4e3d5e45464a2544ac3744827139275b442e425326' +
    '5e3e4b2c5f246e326a514e4f43506c3267276d4733475c2b60502f58496b8a3942814329' +
    '973c266c4b5543598156575a3c56a93b6f2a576328705436416b4e62537b9e3f473d782c' +
    '625e5cb63c308452457b5a3696427155647d5e702e9753317b586750649f457f2f756637' +
    '814da577625068686aa84d5288643f488831cd45384a6fc0517f5f9560535278936e6d87' +
    '67813777706985733e946d4990667b539237aa6441b75a57ba52847a7a7a5583c8578aa1' +
    'df56469479585a9d377a7e9263926da5726bbd6c4aa564c588837aa97a539b854564a156' +
    'a378918d8c8bd77639c87665b68258808eab6296d469ad4ad76999ec6c549e8e7367a0b3' +
    'b6858ab1944896959478a881c38d615bafd9e7873e9f9e9cac9c847abc61da8971bba163' +
    'be95a492a7c6d49b6aaaa7a5d1a8428cbc9767c2e2e28fb1b9aa94ef9e57b2b1aecead78' +
    'e39f8a8dd297d2b870aebbc6c4b9a8e7bb49d7aebbe9b48394d0e4c6c4bfe5c77bd6c6aa' +
    'abe0bbe2c3cacbcfccebd788e1d4b7d9d7d1f2e360e6e0d4f3e7b3edeae3f5f2e7fffdf5';

  // cores de SEGURANÇA: matizes vivos em 3 luminosidades, só entram onde a paleta ajustada não tem nada parecido
  // (explosões, neons, efeitos raros que não estavam nas fotos de ajuste)
  function construir() {
    const out = FIXA.match(/.{6}/g).map(h => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]);
    const labs = out.map(c => paraLab(c[0], c[1], c[2]));
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
  const copia = new Uint8ClampedArray(PW * PH * 4);

  // faz o passe completo sobre o ctx principal (800x600). o: opções que trocam P.cfg
  P.pixelar = function (ctx, o) {
    P.iniciar();
    const c = o ? Object.assign({}, P.cfg, o) : P.cfg;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    pxx.imageSmoothingEnabled = true; pxx.clearRect(0, 0, PW, PH); pxx.drawImage(ctx.canvas, 0, 0, PW, PH);
    const im = pxx.getImageData(0, 0, PW, PH), d = im.data;
    copia.set(d);
    const s = copia, ok32 = (d.byteOffset & 3) === 0, o32 = ok32 ? new Uint32Array(d.buffer, d.byteOffset, d.length >> 2) : null;
    const NIT = c.nitidez, SAT = c.sat, CON = c.contraste, DIT = c.dither, TI = c.tinta, BR = c.brancos, lut = LUT, rowB = PW * 4;
    const GU = c.guardar ? (P.guardado || (P.guardado = new Uint8Array(PW * PH * 3))) : null;   // (ferramenta de teste) guarda a imagem antes da paleta
    for (let y = 0; y < PH; y++) {
      const ym = y > 0 ? -rowB : 0, yp = y < PH - 1 ? rowB : 0, by = (y & 7) << 3;
      for (let x = 0; x < PW; x++) {
        const i = (y * PW + x) * 4, xm = x > 0 ? -4 : 0, xp = x < PW - 1 ? 4 : 0;
        let r = s[i], g = s[i + 1], b = s[i + 2];
        if (NIT > 0) {   // nitidez: realça a diferença para a média dos 4 vizinhos
          r += (r - (s[i + xm] + s[i + xp] + s[i + ym] + s[i + yp]) * 0.25) * NIT;
          g += (g - (s[i + xm + 1] + s[i + xp + 1] + s[i + ym + 1] + s[i + yp + 1]) * 0.25) * NIT;
          b += (b - (s[i + xm + 2] + s[i + xp + 2] + s[i + ym + 2] + s[i + yp + 2]) * 0.25) * NIT;
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
    pxx.putImageData(im, 0, 0);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(pixC, 0, 0, VW, VH);
    ctx.restore();
  };
})(window.G = window.G || {});
