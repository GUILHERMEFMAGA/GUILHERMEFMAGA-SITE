// paleta ESTRUTURADA (matiz x luminosidade x croma, em OKLCH) com poda de cores quase iguais.
// uso: node pal_struct.js <saida.json> [hues=16] [minDE=2.5] [cromas=0.85,0.5,0.22]
const fs = require('fs'); const { lab, WL, D } = require('./pal_fit.js');
const OUT = process.env.OUTDIR || __dirname + '/out/';
const gam = c => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255;
function lch(L, C, hdeg) { const a = C * Math.cos(hdeg * Math.PI / 180), b = C * Math.sin(hdeg * Math.PI / 180);
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3), m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3), s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const ok = r > -0.002 && r < 1.002 && g > -0.002 && g < 1.002 && bb > -0.002 && bb < 1.002; const f = v => Math.max(0, Math.min(255, Math.round(gam(Math.max(0, Math.min(1, v))))));
  return { ok, rgb: [f(r), f(g), f(bb)] }; }
const cmax = (L, h) => { let lo = 0, hi = 0.4; for (let i = 0; i < 20; i++) { const mid = (lo + hi) / 2; if (lch(L, mid, h).ok) lo = mid; else hi = mid; } return lo; };
const [, , saida, nh = '16', minde = '2.5', chs = '0.85,0.5,0.22'] = process.argv; const NH = +nh, MIN = +minde, CH = chs.split(',').map(Number);
const LS = [0.08, 0.14, 0.20, 0.27, 0.34, 0.42, 0.50, 0.58, 0.66, 0.74, 0.82, 0.90, 0.96];
const cand = [];
for (let i = 0; i < 24; i++) { const t = i / 23, L = 0.04 + Math.pow(t, 0.95) * 0.95, C = t < 0.55 ? 0.016 * (1 - t / 0.55) : 0.012 * ((t - 0.55) / 0.45); cand.push(lch(L, C, t < 0.55 ? 282 : 85).rgb); }   // cinzas primeiro (têm prioridade na poda)
for (const L of LS) for (let k = 0; k < NH; k++) { let h0 = k * 360 / NH + 12; const t = (L - 0.08) / 0.88; let h = h0; const dif = (a, b) => ((b - a) % 360 + 540) % 360 - 180;
  h += dif(h, 275) * 0.12 * Math.pow(1 - t, 1.5) + dif(h, 95) * 0.08 * Math.pow(t, 2);          // sombras puxam p/ azul-roxo, luzes p/ amarelo
  const cm = cmax(L, h); for (const f of CH) cand.push(lch(L, Math.min(0.26, cm * f), h).rgb); }
const keep = [], labs = []; for (const c of cand) { const q = lab(...c); let ok = true; for (const o of labs) { const dl = q[0] - o[0], da = q[1] - o[1], db = q[2] - o[2]; if (100 * Math.sqrt(dl * dl + da * da + db * db) < MIN) { ok = false; break; } } if (ok) { keep.push(c); labs.push(q); } }
const hex = keep.map(c => c.map(v => v.toString(16).padStart(2, '0')).join(''));
fs.writeFileSync(saida.startsWith('/') ? saida : OUT + saida, JSON.stringify(hex)); console.log('candidatas', cand.length, 'cores', hex.length);
