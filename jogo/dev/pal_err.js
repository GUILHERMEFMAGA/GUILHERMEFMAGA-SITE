// erro médio (ΔE OKLab x100) de paletas sobre as fotos cruas.  uso: node pal_err.js pal1.json pal2.json ...
const fs = require('fs'); const { lab, WL, D } = require('./pal_fit.js'); const OUT = process.env.OUTDIR || __dirname + '/out/';
const files = fs.readdirSync(D).filter(f => f.endsWith('.rgb')).filter((f, i) => i % 2 === 0);
const px = []; for (const f of files) { const b = fs.readFileSync(D + f); for (let i = 0; i < b.length; i += 3 * 37) px.push(lab(b[i], b[i + 1], b[i + 2])); }
for (const p of process.argv.slice(2)) {
  const hex = JSON.parse(fs.readFileSync(OUT + p)), ls = hex.map(h => lab(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)));
  let s = 0, mx = 0, n95 = []; for (const q of px) { let bd = 1e9; for (const c of ls) { const dl = q[0] - c[0], da = q[1] - c[1], db = q[2] - c[2], d = WL * dl * dl + da * da + db * db; if (d < bd) bd = d; } const e = Math.sqrt(bd) * 100; s += e; if (e > mx) mx = e; n95.push(e); }
  n95.sort((a, b) => a - b); console.log(p.padEnd(18), 'cores', String(hex.length).padStart(3), '| ΔE medio', (s / px.length).toFixed(2), '| p95', n95[Math.floor(n95.length * 0.95)].toFixed(1), '| max', mx.toFixed(1));
}
