// Ferramenta de teste (sem navegador): carrega o jogo no Node com um DOM falso e canvas de verdade (@napi-rs/canvas).
// Uso: cd jogo/dev && npm install @napi-rs/canvas && node tp.js
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs'), vm = require('vm'), path = require('path');
const JOGO = (process.env.JOGO || path.resolve(__dirname, '..')) + '/';
const OUTDIR = process.env.OUTDIR || '/home/user/pw/';
fs.mkdirSync(OUTDIR, { recursive: true });
const listeners = {};
const canvas = createCanvas(800, 600); canvas.style = {}; canvas.addEventListener = () => { };
const mem = {};
global.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
const win = global.window = { innerWidth: 800, innerHeight: 600, devicePixelRatio: 1, addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); } };
let rafCb = null;
global.requestAnimationFrame = win.requestAnimationFrame = cb => { rafCb = cb; return 1; };
global.document = { getElementById: () => canvas, createElement: () => { const c = createCanvas(300, 150); c.style = {}; return c; }, addEventListener: () => { } };
global.performance = global.performance || { now: () => Date.now() };
const html = fs.readFileSync(JOGO + 'index.html', 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const t0 = Date.now();
for (const f of files) vm.runInThisContext(fs.readFileSync(JOGO + f, 'utf8'), { filename: f });
const G = win.G;
let ts = 1000;
function step(n = 1) { for (let i = 0; i < n; i++) { ts += 1000 / 60; const cb = rafCb; if (cb) cb(ts); } }
function key(code, down) { (listeners[down ? 'keydown' : 'keyup'] || []).forEach(f => f({ code, preventDefault() { } })); }
function tap(code, frames = 2) { key(code, true); step(1); key(code, false); step(frames); }
function shot(name) { fs.writeFileSync(OUTDIR + name + '.png', canvas.toBuffer('image/png')); return OUTDIR + name + '.png'; }
let guard = 0; while (G.S.mode === 'loading' && guard++ < 600) step(1);
G.loadMs = Date.now() - t0;
module.exports = { G, win, step, key, tap, shot, canvas, createCanvas, loadImage, OUTDIR, listeners };
