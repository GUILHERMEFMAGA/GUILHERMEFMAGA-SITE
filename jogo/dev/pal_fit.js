// ajusta uma paleta fixa às imagens do jogo (k-means ponderado em OKLab).   uso: node pal_fit.js <K> [saida.json]
// lê out/frames/*.rgb (de amostra.js); escreve a paleta (hex) e mostra o erro médio por pixel.
const fs = require('fs'); const D = (process.env.OUTDIR || __dirname + '/out/') + 'frames/';
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const gam = c => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255;
function lab(r, g, b) { const R = lin(r), G = lin(g), B = lin(b); const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B), m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B), s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B); return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s]; }
function rgb(L, a, b) { const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3), m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3), s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3); const f = v => Math.max(0, Math.min(255, Math.round(gam(Math.max(0, Math.min(1, v)))))); return [f(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), f(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), f(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)]; }
const WL = 1.5;
module.exports = { lab, rgb, WL, D };
if (require.main === module) {
  const K = +process.argv[2] || 192, out = process.argv[3] || (process.env.OUTDIR || __dirname + '/out/') + 'paleta_' + K + '.json';
  // 1) histograma 6 bits por canal
  const H = new Uint32Array(1 << 18); let tot = 0;
  for (const f of fs.readdirSync(D).filter(f => f.endsWith('.rgb'))) { const b = fs.readFileSync(D + f); for (let i = 0; i < b.length; i += 3) { H[((b[i] >> 2) << 12) | ((b[i + 1] >> 2) << 6) | (b[i + 2] >> 2)]++; tot++; } }
  const P = [], W = [];
  for (let i = 0; i < H.length; i++) if (H[i]) { const r = ((i >> 12) & 63) * 4 + 2, g = ((i >> 6) & 63) * 4 + 2, b = (i & 63) * 4 + 2; P.push(lab(r, g, b)); W.push(Math.pow(H[i], 0.7)); }
  console.log('pixels', tot, 'cores distintas', P.length);
  const n = P.length, d2 = (p, c) => { const dl = p[0] - c[0], da = p[1] - c[1], db = p[2] - c[2]; return WL * dl * dl + da * da + db * db; };
  // 2) k-means++ ponderado
  let seed = 12345; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const DEG = Math.PI / 180, FIX = [];
  for (let i = 0; i < 16; i++) { const t = i / 15, L = 0.05 + Math.pow(t, 0.92) * 0.945, Ch = t < 0.55 ? 0.018 * (1 - t / 0.55) : 0.012 * ((t - 0.55) / 0.45), h = (t < 0.55 ? 282 : 85) * DEG; FIX.push(lab(...rgb(L, Ch * Math.cos(h), Ch * Math.sin(h)))); }
  const C = FIX.map(c => c.slice()); const NF = FIX.length; const md = new Float64Array(n).fill(1e9);
  FIX.forEach(c => { for (let i = 0; i < n; i++) { const d = d2(P[i], c); if (d < md[i]) md[i] = d; } });
  while (C.length < K) {
    if (C.length > NF) { const c = C[C.length - 1]; for (let i = 0; i < n; i++) { const d = d2(P[i], c); if (d < md[i]) md[i] = d; } }
    let s = 0; for (let i = 0; i < n; i++) s += md[i] * W[i];
    let r = rnd() * s, pick = n - 1; for (let i = 0; i < n; i++) { r -= md[i] * W[i]; if (r <= 0) { pick = i; break; } } C.push(P[pick].slice());
  }
  // 3) Lloyd
  const as = new Int32Array(n);
  for (let it = 0; it < 14; it++) {
    const sum = C.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < n; i++) { let b = 0, bd = 1e9; for (let k = 0; k < K; k++) { const d = d2(P[i], C[k]); if (d < bd) { bd = d; b = k; } } as[i] = b; const s = sum[b], w = W[i]; s[0] += P[i][0] * w; s[1] += P[i][1] * w; s[2] += P[i][2] * w; s[3] += w; }
    let mov = 0; for (let k = NF; k < K; k++) if (sum[k][3] > 0) { const nc = [sum[k][0] / sum[k][3], sum[k][1] / sum[k][3], sum[k][2] / sum[k][3]]; mov += Math.sqrt(d2(nc, C[k])); C[k] = nc; }
    if (it % 4 === 3) console.log('iter', it + 1, 'movimento', mov.toFixed(4));
  }
  const cores = C.map(c => rgb(c[0], c[1], c[2])), hex = cores.map(c => c.map(v => v.toString(16).padStart(2, '0')).join(''));
  // 4) erro médio (ΔE em OKLab x100) ponderado por pixels
  let se = 0, st = 0, mx = 0; for (let i = 0; i < n; i++) { let bd = 1e9; for (let k = 0; k < K; k++) { const d = d2(P[i], C[k]); if (d < bd) bd = d; } const cnt = H[0] ? 1 : 1; se += Math.sqrt(bd) * 100 * W[i]; st += W[i]; if (Math.sqrt(bd) * 100 > mx) mx = Math.sqrt(bd) * 100; }
  console.log('K', K, 'erro medio ponderado ΔE', (se / st).toFixed(2), '| maior', mx.toFixed(1));
  fs.writeFileSync(out, JSON.stringify(hex)); console.log('gravado', out);
}
