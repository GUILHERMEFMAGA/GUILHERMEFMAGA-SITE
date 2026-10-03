/* =====================================================================
   INTERIORES.JS — o "kit de decoração" das salas por dentro
     • chão com textura de verdade (tábua, cerâmica, porcelanato, carpete, cimento...)
     • paredes grossas com rodapé, sanca, lambri e sombra no canto
     • janelas com moldura, cortina, paisagem e feixe de luz no chão
     • quadros, relógio, prateleira, ar-condicionado...
     • D.est(): desenha o móvel UMA vez e guarda numa tela (cache) — fica rápido
   Os móveis em si ficam em mobilia.js e mobilia2.js.
   Tudo aqui é só visual: não mexe nas regras do jogo.
   ===================================================================== */
(function (G) {
  'use strict';
  const L = G.lugares, K = L.kit, W = G.world, TAU = Math.PI * 2;
  const shade = K.shade, hh = K.hh;
  const D = G.deco = {};

  // ---------- ferramentas pequenas ----------
  // cor entre duas (só hex de 6 dígitos, ex.: '#aabbcc')
  const rgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const hex = (r, g, b) => '#' + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
  const mix = (a, b, t) => { const p = rgb(a), q = rgb(b); return hex(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t); };
  const rgba = (h, a) => { const p = rgb(h); return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + a + ')'; };
  // sorteio com semente (mesma casa = mesmo desenho)
  const rng = s => { let a = (s | 0) + 0x6D2B79F5; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const rr = (c, x, y, w, h, r) => W.rrect(c, x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
  const semente = s => { let h = 7; String(s).split('').forEach(ch => { h = (h * 31 + ch.charCodeAt(0)) | 0; }); return Math.abs(h); };
  Object.assign(D, { rgb, hex, mix, rgba, rng, rr, semente });

  // sombra macia no chão (várias camadas de pouca opacidade, sem blur)
  D.sombra = function (c, x, y, w, h, o) {
    o = o || {}; const dx = o.dx != null ? o.dx : 5, dy = o.dy != null ? o.dy : 7, n = 5, r = o.r != null ? o.r : 4, a = o.a || 0.08;
    c.save();
    for (let i = 0; i < n; i++) { const g = (n - i) * 1.5 - 1; c.fillStyle = 'rgba(10,5,16,' + a + ')'; if (o.oval) { c.beginPath(); c.ellipse(x + w / 2 + dx, y + h / 2 + dy, w / 2 + g, h / 2 + g, 0, 0, TAU); c.fill(); } else { rr(c, x + dx - g, y + dy - g, w + 2 * g, h + 2 * g, r + g); c.fill(); } }
    c.restore();
  };

  // caixa em perspectiva (topo + frente) com cantos arredondados, brilho e contorno
  // cTop = cor do topo, cFr = cor da frente (vertical), e = altura
  D.caixa = function (c, x, y, w, h, e, cTop, cFr, o) {
    o = o || {}; const r = o.r != null ? o.r : 3;
    if (!o.semSombra) D.sombra(c, x, y, w, h, { dx: 3 + e * 0.1, dy: 4 + e * 0.24, r: r + 1 });
    if (e > 0) {
      const g = c.createLinearGradient(0, y + h - e, 0, y + h); g.addColorStop(0, shade(cFr, 0.1)); g.addColorStop(0.6, cFr); g.addColorStop(1, shade(cFr, -0.36));
      c.fillStyle = g; rr(c, x, y - e, w, h + e, r); c.fill();
    }
    const g2 = c.createLinearGradient(x, y - e, x + w, y - e + h); g2.addColorStop(0, shade(cTop, 0.16)); g2.addColorStop(1, shade(cTop, -0.14));
    c.fillStyle = g2; rr(c, x, y - e, w, h, r); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.42)'; c.lineWidth = 1; rr(c, x + 0.5, y - e + 0.5, w - 1, h + e - 1, r); c.stroke();
    if (e > 0) { c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(x + 1, y - e + h - 0.5, w - 2, 1.4); }
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x + r, y - e + 1, w - 2 * r, 1.4);
  };

  // ---------- cache dos móveis (desenha uma vez, depois só copia) ----------
  // fn(ctx, o, t) desenha o móvel; opt.din(ctx, o, t) desenha só o que se mexe (chama, tela da TV...)
  const ASS = ['x', 'y', 'w', 'h', 'e', 'cor', 'top', 'front', 'variante', 'aberto', 'ligado', 'estilo', 'itens', 'toalha', 'prato', 'dir', 'nome', 'texto', 'n', 'padrao', 'forma', 'cor2', 'seed', 'vaso', 'espelho', 'alt', 'luz', 'parte', 'manta', 'almofadas'];
  const assina = o => { let s = o.t; for (let i = 0; i < ASS.length; i++) { const v = o[ASS[i]]; if (v !== undefined) s += '|' + v; } if (o.cores) s += o.cores.join(); return s; };
  D.est = function (fn, opt) {
    opt = opt || {};
    const f = function (ctx, o, t) {
      const sg = assina(o); let c = o._cv;
      if (!c || c.sg !== sg) {
        const pad = opt.pad || 30, alto = opt.alto != null ? opt.alto : 40, e = o.e || 0;
        const L0 = o.x - pad, T0 = o.y - e - alto - pad, w = Math.ceil(o.w + pad * 2 + 12), h = Math.ceil(o.h + e + alto + pad * 2 + 12);
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
        g.translate(-L0, -T0); fn(g, o, 0);
        c = o._cv = { cv, sg, dx: L0 - o.x, dy: T0 - o.y };
      }
      ctx.drawImage(c.cv, o.x + c.dx, o.y + c.dy);
      if (opt.din) opt.din(ctx, o, t);
    };
    return f;
  };
  D.reg = (nome, fn, opt) => { K.novos[nome] = D.est(fn, opt); };

  // =====================================================================
  //  CHÃOS
  // =====================================================================
  const PISOS = {
    // tábuas de madeira com veios, nós e emendas deslocadas
    madeira(c, X, Y, w, h, cs, sd) {
      const ph = 22, r = rng(sd);
      for (let j = 0; j * ph < h + ph; j++) {
        let x = X - r() * 170; const y = Y + j * ph;
        while (x < X + w) {
          const len = 110 + r() * 110, cor = shade(mix(cs[0], cs[1], r()), (r() - 0.5) * 0.13);
          const g = c.createLinearGradient(0, y, 0, y + ph); g.addColorStop(0, shade(cor, 0.08)); g.addColorStop(0.5, cor); g.addColorStop(1, shade(cor, -0.1));
          c.fillStyle = g; c.fillRect(x, y, len, ph);
          c.strokeStyle = 'rgba(35,16,4,0.14)'; c.lineWidth = 1;
          for (let v = 0; v < 3; v++) { const yy = y + 4 + v * 6 + r() * 3, ph0 = r() * 20; c.beginPath(); c.moveTo(x + 1, yy); for (let xx = 0; xx <= len; xx += 12) c.lineTo(x + xx, yy + Math.sin((xx + ph0) * 0.08 + v) * 1.2); c.stroke(); }
          if (r() < 0.14) { const kx = x + 20 + r() * (len - 40), ky = y + 6 + r() * 10; c.strokeStyle = 'rgba(30,12,2,0.3)'; c.beginPath(); c.ellipse(kx, ky, 5, 2.4, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(kx, ky, 2.4, 1.1, 0, 0, TAU); c.stroke(); }
          c.fillStyle = 'rgba(12,6,0,0.55)'; c.fillRect(x + len - 1, y, 1.5, ph);
          c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(x + len + 0.5, y, 1, ph);
          x += len;
        }
        c.fillStyle = 'rgba(12,6,0,0.5)'; c.fillRect(X, y + ph - 1, w, 1.3);
        c.fillStyle = 'rgba(255,255,255,0.09)'; c.fillRect(X, y, w, 1);
      }
    },
    // taco: quadrados de tábuas alternando a direção
    taco(c, X, Y, w, h, cs, sd) {
      const S = 42, n = 4, r = rng(sd);
      for (let j = 0; j * S < h + S; j++) for (let i = 0; i * S < w + S; i++) {
        const px = X + i * S, py = Y + j * S, hor = (i + j) % 2 === 0;
        for (let k = 0; k < n; k++) {
          const cor = shade(mix(cs[0], cs[1], r()), (r() - 0.5) * 0.1), a = S / n;
          const bx = hor ? px : px + k * a, by = hor ? py + k * a : py, bw = hor ? S : a, bh = hor ? a : S;
          const g = hor ? c.createLinearGradient(0, by, 0, by + bh) : c.createLinearGradient(bx, 0, bx + bw, 0);
          g.addColorStop(0, shade(cor, 0.1)); g.addColorStop(1, shade(cor, -0.1)); c.fillStyle = g; c.fillRect(bx, by, bw, bh);
          c.strokeStyle = 'rgba(15,7,0,0.5)'; c.lineWidth = 1; c.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
        }
      }
    },
    // cerâmica quadrada com rejunte, reflexo e chanfro
    ladrilho(c, X, Y, w, h, cs, sd, T) {
      T = T || 44;
      for (let j = 0; j * T < h + T; j++) for (let i = 0; i * T < w + T; i++) {
        const px = X + i * T, py = Y + j * T, k = hh(i + sd, j);
        c.fillStyle = shade(cs[0], (k - 0.5) * 0.08); c.fillRect(px, py, T, T);
        const g = c.createLinearGradient(px, py, px + T, py + T); g.addColorStop(0, 'rgba(255,255,255,0.16)'); g.addColorStop(0.5, 'rgba(255,255,255,0.02)'); g.addColorStop(1, 'rgba(0,0,0,0.08)'); c.fillStyle = g; c.fillRect(px, py, T, T);
        c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(px + 1, py + 1, T - 2, 1); c.fillRect(px + 1, py + 1, 1, T - 2);
      }
      c.strokeStyle = cs[1]; c.lineWidth = 2; c.beginPath();
      for (let i = 0; i * T <= w + T; i++) { c.moveTo(X + i * T, Y); c.lineTo(X + i * T, Y + h); }
      for (let j = 0; j * T <= h + T; j++) { c.moveTo(X, Y + j * T); c.lineTo(X + w, Y + j * T); }
      c.stroke();
    },
    // porcelanato grande, polido, com veios de mármore
    porcelanato(c, X, Y, w, h, cs, sd) {
      const T = 76, r = rng(sd);
      for (let j = 0; j * T < h + T; j++) for (let i = 0; i * T < w + T; i++) {
        const px = X + i * T, py = Y + j * T;
        const g = c.createLinearGradient(px, py, px + T, py + T); g.addColorStop(0, shade(cs[0], 0.06)); g.addColorStop(1, shade(cs[0], -0.05)); c.fillStyle = g; c.fillRect(px, py, T, T);
        c.save(); c.beginPath(); c.rect(px, py, T, T); c.clip();
        for (let v = 0; v < 3; v++) {
          c.strokeStyle = v % 2 ? 'rgba(255,255,255,0.22)' : 'rgba(70,70,86,0.14)'; c.lineWidth = v === 0 ? 1.6 : 1; c.beginPath();
          let vx = px + r() * T, vy = py - 4; c.moveTo(vx, vy);
          for (let s = 0; s < 7; s++) { vx += (r() - 0.5) * 22; vy += T / 6; c.lineTo(vx, vy); } c.stroke();
        }
        const g2 = c.createLinearGradient(px, py + T, px + T, py); g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(0.5, 'rgba(255,255,255,0.1)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g2; c.fillRect(px, py, T, T);
        c.restore();
      }
      c.strokeStyle = cs[1]; c.lineWidth = 1.4; c.beginPath();
      for (let i = 0; i * T <= w + T; i++) { c.moveTo(X + i * T, Y); c.lineTo(X + i * T, Y + h); }
      for (let j = 0; j * T <= h + T; j++) { c.moveTo(X, Y + j * T); c.lineTo(X + w, Y + j * T); }
      c.stroke();
    },
    // xadrez brilhante (lojas, bares)
    xadrez(c, X, Y, w, h, cs, sd) {
      const T = 44;
      for (let j = 0; j * T < h + T; j++) for (let i = 0; i * T < w + T; i++) {
        const px = X + i * T, py = Y + j * T; c.fillStyle = (i + j) % 2 ? cs[0] : cs[1]; c.fillRect(px, py, T, T);
        const g = c.createLinearGradient(px, py, px + T, py + T); g.addColorStop(0, 'rgba(255,255,255,0.14)'); g.addColorStop(0.55, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.1)'); c.fillStyle = g; c.fillRect(px, py, T, T);
      }
      c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = 1; c.beginPath();
      for (let i = 0; i * T <= w + T; i++) { c.moveTo(X + i * T, Y); c.lineTo(X + i * T, Y + h); }
      for (let j = 0; j * T <= h + T; j++) { c.moveTo(X, Y + j * T); c.lineTo(X + w, Y + j * T); }
      c.stroke();
    },
    // carpete: fibra, grãos e leve escovado
    carpete(c, X, Y, w, h, cs, sd) {
      const r = rng(sd); c.fillStyle = cs[0]; c.fillRect(X, Y, w, h);
      const n = Math.floor(w * h / 38);
      for (let k = 0; k < n; k++) { const t = r(); c.fillStyle = t < 0.5 ? rgba(cs[1], 0.35) : 'rgba(255,255,255,0.05)'; c.fillRect(X + r() * w, Y + r() * h, 2, 2); }
      c.strokeStyle = 'rgba(0,0,0,0.05)'; c.lineWidth = 1; c.beginPath(); for (let k = 0; k < h; k += 5) { c.moveTo(X, Y + k); c.lineTo(X + w, Y + k); } c.stroke();
    },
    // cimento queimado (casa simples): manchas, riscos e juntas de dilatação
    cimento(c, X, Y, w, h, cs, sd) {
      const r = rng(sd); c.fillStyle = cs[0]; c.fillRect(X, Y, w, h);
      for (let k = 0; k < 40; k++) { const px = X + r() * w, py = Y + r() * h, rad = 30 + r() * 70, lg = c.createRadialGradient(px, py, 2, px, py, rad); const cl = r() < 0.5 ? '255,255,255' : '0,0,0'; lg.addColorStop(0, 'rgba(' + cl + ',0.07)'); lg.addColorStop(1, 'rgba(' + cl + ',0)'); c.fillStyle = lg; c.fillRect(px - rad, py - rad, rad * 2, rad * 2); }
      for (let k = 0; k < w * h / 60; k++) { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'; c.fillRect(X + r() * w, Y + r() * h, 1.5, 1.5); }
      c.strokeStyle = cs[1]; c.lineWidth = 2; c.beginPath();
      for (let i = 1; i * 150 < w; i++) { c.moveTo(X + i * 150, Y); c.lineTo(X + i * 150, Y + h); }
      for (let j = 1; j * 130 < h; j++) { c.moveTo(X, Y + j * 130); c.lineTo(X + w, Y + j * 130); }
      c.stroke();
      c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = 1; for (let k = 0; k < 4; k++) { let px = X + r() * w, py = Y + r() * h; c.beginPath(); c.moveTo(px, py); for (let s = 0; s < 5; s++) { px += (r() - 0.5) * 26; py += (r() - 0.3) * 18; c.lineTo(px, py); } c.stroke(); }
    },
    // azulejo pequeno (cozinha, banheiro)
    azulejo(c, X, Y, w, h, cs, sd) {
      const T = 22;
      for (let j = 0; j * T < h + T; j++) for (let i = 0; i * T < w + T; i++) {
        const px = X + i * T, py = Y + j * T, k = hh(i + sd, j);
        c.fillStyle = (i % 4 === 2 && j % 4 === 2) ? cs[2] || '#4a8ac8' : shade(cs[0], (k - 0.5) * 0.06); c.fillRect(px, py, T, T);
        const g = c.createLinearGradient(px, py, px + T, py + T); g.addColorStop(0, 'rgba(255,255,255,0.28)'); g.addColorStop(1, 'rgba(0,0,0,0.06)'); c.fillStyle = g; c.fillRect(px, py, T, T);
      }
      c.strokeStyle = cs[1]; c.lineWidth = 1.4; c.beginPath();
      for (let i = 0; i * T <= w + T; i++) { c.moveTo(X + i * T, Y); c.lineTo(X + i * T, Y + h); }
      for (let j = 0; j * T <= h + T; j++) { c.moveTo(X, Y + j * T); c.lineTo(X + w, Y + j * T); }
      c.stroke();
    },
    // borracha (academia)
    borracha(c, X, Y, w, h, cs, sd) {
      const r = rng(sd); c.fillStyle = cs[0]; c.fillRect(X, Y, w, h);
      for (let k = 0; k < w * h / 70; k++) { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.12)'; c.fillRect(X + r() * w, Y + r() * h, 2, 2); }
      c.strokeStyle = cs[1]; c.lineWidth = 2; c.beginPath();
      for (let i = 0; i * 60 <= w; i++) { c.moveTo(X + i * 60, Y); c.lineTo(X + i * 60, Y + h); }
      for (let j = 0; j * 60 <= h; j++) { c.moveTo(X, Y + j * 60); c.lineTo(X + w, Y + j * 60); }
      c.stroke();
    },
    // pedra portuguesa / pedrisco (varandas, pizzaria)
    pedra(c, X, Y, w, h, cs, sd) {
      const r = rng(sd); c.fillStyle = cs[1]; c.fillRect(X, Y, w, h);
      for (let j = 0; j * 26 < h + 26; j++) for (let i = -1; i * 34 < w + 34; i++) {
        const px = X + i * 34 + (j % 2) * 17 + r() * 3, py = Y + j * 26 + r() * 3;
        c.fillStyle = shade(cs[0], (r() - 0.5) * 0.18); rr(c, px, py, 30, 22, 8); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(px + 4, py + 3, 12, 2);
      }
    }
  };
  PISOS.ladrilho_g = (c, X, Y, w, h, cs, sd) => PISOS.ladrilho(c, X, Y, w, h, cs, sd, 64);
  D.piso = function (c, tipo, X, Y, w, h, cs, sd) { (PISOS[tipo] || PISOS.ladrilho)(c, X, Y, w, h, cs || ['#dddddd', '#aaaaaa'], sd || 1); };
  D.PISOS = PISOS;

  // =====================================================================
  //  PAREDES
  // =====================================================================
  // a "cara" da parede de trás: tinta, desenho, lambri, sanca e rodapé
  function paredeFace(c, x0, x1, y0, y1, R) {
    const base = R.parede || '#d8cdb0', est = R.estiloParede || 'liso', w = x1 - x0, hgt = y1 - y0, r = rng(R.seed || 3);
    const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, shade(base, 0.12)); g.addColorStop(0.6, base); g.addColorStop(1, shade(base, -0.22));
    c.fillStyle = g; c.fillRect(x0, y0, w, hgt);
    c.save(); c.beginPath(); c.rect(x0, y0, w, hgt); c.clip();
    if (est === 'listras') { for (let k = 0; k * 26 < w; k++) { c.fillStyle = k % 2 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'; c.fillRect(x0 + k * 26, y0, 13, hgt); } }
    else if (est === 'papel') {
      c.fillStyle = 'rgba(255,255,255,0.12)';
      for (let j = 0; j * 20 < hgt + 20; j++) for (let i = 0; i * 24 < w + 24; i++) { const px = x0 + i * 24 + (j % 2) * 12, py = y0 + j * 20; c.beginPath(); c.moveTo(px, py - 5); c.lineTo(px + 4, py); c.lineTo(px, py + 5); c.lineTo(px - 4, py); c.closePath(); c.fill(); c.fillRect(px - 1, py + 7, 2, 2); }
    } else if (est === 'tijolo') {
      for (let j = 0; j * 11 < hgt + 11; j++) for (let i = -1; i * 30 < w + 30; i++) { const px = x0 + i * 30 + (j % 2) * 15, py = y0 + j * 11; c.fillStyle = shade(base, (hh(i, j + 5) - 0.5) * 0.22); c.fillRect(px, py, 28, 9); c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(px, py, 28, 1.5); c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(px, py + 8, 28, 1); }
    } else if (est === 'azulejo') {
      c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i * 20 <= w; i++) { c.moveTo(x0 + i * 20, y0); c.lineTo(x0 + i * 20, y1); } for (let j = 0; j * 20 <= hgt; j++) { c.moveTo(x0, y0 + j * 20); c.lineTo(x1, y0 + j * 20); } c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.14)'; for (let j = 0; j * 20 < hgt; j++) for (let i = 0; i * 20 < w; i++) c.fillRect(x0 + i * 20 + 2, y0 + j * 20 + 2, 7, 2);
    } else if (est === 'concreto') {
      for (let k = 0; k < w * hgt / 90; k++) { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'; c.fillRect(x0 + r() * w, y0 + r() * hgt, 2, 2); }
      c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 1; for (let i = 1; i * 120 < w; i++) { c.beginPath(); c.moveTo(x0 + i * 120, y0); c.lineTo(x0 + i * 120, y1); c.stroke(); }
    } else if (est === 'madeira') {
      for (let i = 0; i * 14 < w; i++) { c.fillStyle = shade(base, (hh(i, 9) - 0.5) * 0.16); c.fillRect(x0 + i * 14, y0, 13, hgt); c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(x0 + i * 14 + 13, y0, 1, hgt); }
    } else {
      for (let k = 0; k < w * hgt / 120; k++) { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.04)'; c.fillRect(x0 + r() * w, y0 + r() * hgt, 2, 2); }
      if (R.velha) { for (let k = 0; k < 7; k++) { const px = x0 + r() * w, py = y0 + hgt - r() * 30, rad = 18 + r() * 30, lg = c.createRadialGradient(px, py, 2, px, py, rad); lg.addColorStop(0, 'rgba(60,70,40,0.22)'); lg.addColorStop(1, 'rgba(60,70,40,0)'); c.fillStyle = lg; c.fillRect(px - rad, py - rad, rad * 2, rad * 2); } }
    }
    // lambri / rodameio
    const lamb = R.lambri;
    if (lamb) {
      const lh = R.lambriAlt || 32, ly = y1 - lh, cl = typeof lamb === 'string' ? lamb : shade(base, -0.14);
      c.fillStyle = cl; c.fillRect(x0, ly, w, lh);
      for (let i = 0; i * 54 < w; i++) { const px = x0 + 10 + i * 54; c.fillStyle = shade(cl, -0.12); rr(c, px, ly + 7, 40, lh - 13, 2); c.fill(); c.strokeStyle = shade(cl, 0.2); c.lineWidth = 1; rr(c, px + 0.5, ly + 7.5, 39, lh - 14, 2); c.stroke(); }
      c.fillStyle = shade(cl, 0.28); c.fillRect(x0, ly, w, 3); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x0, ly + 3, w, 1.5);
    }
    // sanca (moldura do teto)
    const sg = c.createLinearGradient(0, y0, 0, y0 + 9); sg.addColorStop(0, shade(base, 0.4)); sg.addColorStop(1, shade(base, 0.14)); c.fillStyle = sg; c.fillRect(x0, y0, w, 9);
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(x0, y0 + 9, w, 2); c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(x0, y0 + 11, w, 4);
    // rodapé
    const rp = R.rodape || shade(base, 0.45);
    c.fillStyle = rp; c.fillRect(x0, y1 - 8, w, 8); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x0, y1 - 8, w, 1.5); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x0, y1 - 1.5, w, 1.5);
    c.restore();
  }

  // quanto de luz do dia entra (0 = noite, 1 = dia): usado nas janelas
  function claridade() {
    const S = G.S; if (!S) return 1; const h = L.hora(S);
    if (h >= 7 && h < 17) return 1; if (h >= 17 && h < 19) return 0.55; if (h >= 5.5 && h < 7) return 0.5; return 0;
  }
  D.claridade = claridade;
  const ESTADO = { x0: 70, x1: 730, y0: 150, y1: 545, cl: 1 };    // sala que está sendo montada (para as janelas)

  // ---------- janela: moldura, vidro com paisagem, cortina, parapeito e luz no chão ----------
  // o: { cor: moldura, cortina: cor ('#...') ou null, persiana, grade, arco, flores, vista: 'rua'|'jardim'|'cidade'|'mar' }
  D.janela = function (c, px, py, w, h, o) {
    o = o || {}; const cl = ESTADO.cl, fr = o.cor || '#f2eee4', S0 = G.S;
    // abertura (sombra da parede grossa)
    c.fillStyle = 'rgba(0,0,0,0.38)'; rr(c, px - 7, py - 6, w + 14, h + 15, 3); c.fill();
    // vidro com céu
    c.save(); rr(c, px, py, w, h, o.arco ? Math.min(w / 2, 22) : 2); c.clip();
    const noite = cl < 0.2, tarde = cl > 0.2 && cl < 0.8;
    const sk = c.createLinearGradient(0, py, 0, py + h);
    if (noite) { sk.addColorStop(0, '#0a1230'); sk.addColorStop(1, '#25386a'); } else if (tarde) { sk.addColorStop(0, '#6a8ac8'); sk.addColorStop(0.6, '#f0b070'); sk.addColorStop(1, '#f8d8a0'); } else { sk.addColorStop(0, '#6cb8f0'); sk.addColorStop(1, '#dff2ff'); }
    c.fillStyle = sk; c.fillRect(px, py, w, h);
    if (noite) { c.fillStyle = '#fff'; for (let k = 0; k < 7; k++) c.fillRect(px + hh(k, px) * w, py + hh(px, k) * h * 0.6, 1.4, 1.4); c.fillStyle = '#f4efd0'; c.beginPath(); c.arc(px + w * 0.78, py + h * 0.25, 4, 0, TAU); c.fill(); }
    else { c.fillStyle = 'rgba(255,255,255,0.85)'; [[0.2, 0.22, 11], [0.34, 0.2, 8], [0.7, 0.3, 9], [0.82, 0.28, 6]].forEach(([a, b, r]) => { c.beginPath(); c.ellipse(px + w * a, py + h * b, r * 1.5, r * 0.7, 0, 0, TAU); c.fill(); }); }
    // paisagem lá fora (silhuetas)
    const vista = o.vista || 'jardim', fy = py + h * 0.62;
    if (vista === 'cidade') { for (let k = 0; k < 7; k++) { const bw = 7 + hh(k, 2) * 9, bh = 10 + hh(k, 3) * 24; c.fillStyle = noite ? '#0c1224' : '#7f90ac'; c.fillRect(px + k * (w / 6.4), py + h - bh - 6, bw, bh + 6); if (noite) { c.fillStyle = '#ffd86a'; for (let q = 0; q < 3; q++) c.fillRect(px + k * (w / 6.4) + 2, py + h - bh - 2 + q * 7, 2, 2); } } }
    else if (vista === 'mar') { c.fillStyle = noite ? '#0e2a50' : '#3a8ad0'; c.fillRect(px, fy, w, h); c.fillStyle = 'rgba(255,255,255,0.5)'; for (let k = 0; k < 5; k++) c.fillRect(px + 6 + k * 14, fy + 6 + (k % 2) * 7, 8, 1.4); }
    else {
      c.fillStyle = noite ? '#0a2012' : '#58a850'; c.beginPath(); c.moveTo(px, py + h); c.lineTo(px, fy + 2); c.quadraticCurveTo(px + w * 0.5, fy - 8, px + w, fy + 4); c.lineTo(px + w, py + h); c.fill();
      [[0.18, 0.55, 12], [0.78, 0.5, 14]].forEach(([a, b, r]) => { c.fillStyle = noite ? '#06150a' : '#2f7a3a'; c.beginPath(); c.arc(px + w * a, py + h * b, r, 0, TAU); c.fill(); c.fillStyle = noite ? '#3a2412' : '#6a4a2a'; c.fillRect(px + w * a - 1.5, py + h * b + r - 3, 3, 9); });
    }
    // reflexo no vidro
    const gl = c.createLinearGradient(px, py, px + w, py + h); gl.addColorStop(0, 'rgba(255,255,255,0.34)'); gl.addColorStop(0.4, 'rgba(255,255,255,0.04)'); gl.addColorStop(0.55, 'rgba(255,255,255,0.14)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gl; c.fillRect(px, py, w, h);
    c.restore();
    // moldura e divisões
    c.strokeStyle = fr; c.lineWidth = 4; rr(c, px - 1, py - 1, w + 2, h + 2, o.arco ? Math.min(w / 2, 22) : 2); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 1; rr(c, px - 3.5, py - 3.5, w + 7, h + 7, 3); c.stroke();
    c.fillStyle = fr; if (!o.semDivisao) { c.fillRect(px + w / 2 - 1.5, py, 3, h); c.fillRect(px, py + h * 0.46, w, 3); }
    if (o.grade) { c.strokeStyle = '#2a2a30'; c.lineWidth = 2; c.beginPath(); for (let k = 1; k < 5; k++) { c.moveTo(px + k * w / 5, py); c.lineTo(px + k * w / 5, py + h); } c.stroke(); }
    if (o.persiana) { c.fillStyle = 'rgba(235,230,215,0.96)'; c.fillRect(px, py, w, h * o.persiana); c.fillStyle = 'rgba(0,0,0,0.18)'; for (let k = 3; k < h * o.persiana; k += 5) c.fillRect(px, py + k, w, 1); c.fillStyle = '#b8b0a0'; c.fillRect(px, py + h * o.persiana - 2, w, 3); }
    // parapeito
    c.fillStyle = shade(fr, 0.1); c.fillRect(px - 6, py + h + 2, w + 12, 5); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(px - 6, py + h + 7, w + 12, 2); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(px - 6, py + h + 2, w + 12, 1);
    if (o.flores) { c.fillStyle = '#8a4a32'; c.fillRect(px + w * 0.2, py + h - 3, 14, 7); c.fillStyle = '#2f8a3c'; c.beginPath(); c.arc(px + w * 0.2 + 7, py + h - 7, 7, Math.PI, 0); c.fill(); [['#e84a6a', -4], ['#f2d84a', 1], ['#fff', 5]].forEach(([cc, dx]) => { c.fillStyle = cc; c.beginPath(); c.arc(px + w * 0.2 + 7 + dx, py + h - 10 + (dx % 3), 2.3, 0, TAU); c.fill(); }); }
    // cortina com dobras
    if (o.cortina) {
      const cc = o.cortina, cw = Math.max(14, w * 0.28);
      c.fillStyle = '#5a4026'; c.fillRect(px - 12, py - 9, w + 24, 3); c.fillStyle = '#c8a24a'; c.beginPath(); c.arc(px - 12, py - 7.5, 3, 0, TAU); c.arc(px + w + 12, py - 7.5, 3, 0, TAU); c.fill();
      [[px - 8, 1], [px + w + 8 - cw, -1]].forEach(([cx0, sg]) => {
        const g = c.createLinearGradient(cx0, 0, cx0 + cw, 0); g.addColorStop(0, shade(cc, -0.2)); g.addColorStop(0.3, shade(cc, 0.14)); g.addColorStop(0.55, shade(cc, -0.12)); g.addColorStop(0.8, shade(cc, 0.12)); g.addColorStop(1, shade(cc, -0.22));
        c.fillStyle = g; c.beginPath(); c.moveTo(cx0, py - 6); c.lineTo(cx0 + cw, py - 6); c.lineTo(cx0 + cw - (sg > 0 ? 3 : 0), py + h + 4); c.quadraticCurveTo(cx0 + cw / 2, py + h + 10, cx0 + (sg > 0 ? 0 : 3), py + h + 4); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = 1; c.beginPath(); for (let k = 1; k < 5; k++) { c.moveTo(cx0 + k * cw / 5, py - 5); c.lineTo(cx0 + k * cw / 5, py + h + 3); } c.stroke();
        c.fillStyle = shade(cc, -0.3); c.fillRect(cx0 + (sg > 0 ? cw - 4 : 0), py + h * 0.55, 4, 3);   // laço
      });
    }
    // feixe de luz no chão (só de dia)
    if (cl > 0.05 && !o.semLuz) {
      const E = ESTADO, y0 = E.y0, len = 120 + h, sx = 38;
      c.save(); c.beginPath(); c.rect(E.x0, E.y0, E.x1 - E.x0, E.y1 - E.y0); c.clip();
      const lg = c.createLinearGradient(0, y0, 0, y0 + len); lg.addColorStop(0, 'rgba(255,244,205,' + 0.3 * cl + ')'); lg.addColorStop(1, 'rgba(255,244,205,0)');
      c.fillStyle = lg; c.beginPath(); c.moveTo(px, y0); c.lineTo(px + w, y0); c.lineTo(px + w + sx * 2, y0 + len); c.lineTo(px + sx * 2, y0 + len); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,244,205,' + 0.2 * cl + ')'; c.lineWidth = 2; c.beginPath(); c.moveTo(px + w / 2, y0); c.lineTo(px + w / 2 + sx * 2, y0 + len); c.moveTo(px, y0 + 2); c.lineTo(px + sx * 2, y0 + len); c.stroke();
      c.restore();
    }
  };
  K.janela = D.janela;

  // ---------- peças de parede ----------
  // quadro com moldura: estilo 'paisagem' | 'abstrato' | 'retrato' | 'flor' | 'mapa' | 'santo' | 'time'
  D.quadro = function (c, px, py, w, h, estilo, cor) {
    const mold = cor || '#6a4a2a', s = semente(px * 7 + py);
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(px + 3, py + 4, w, h);
    c.fillStyle = mold; c.fillRect(px - 3, py - 3, w + 6, h + 6); c.fillStyle = shade(mold, 0.25); c.fillRect(px - 3, py - 3, w + 6, 1.5); c.fillStyle = shade(mold, -0.3); c.fillRect(px - 3, py + h + 1.5, w + 6, 1.5);
    c.save(); c.beginPath(); c.rect(px, py, w, h); c.clip();
    c.fillStyle = '#f4efe2'; c.fillRect(px, py, w, h);
    const ix = px + 3, iy = py + 3, iw = w - 6, ih = h - 6;
    if (estilo === 'abstrato') { const r = rng(s); c.fillStyle = '#e8e0cc'; c.fillRect(ix, iy, iw, ih); ['#c8402a', '#2a58b8', '#e0b32a', '#2f8a6a', '#222'].forEach(cc => { c.fillStyle = cc; c.globalAlpha = 0.85; if (r() < 0.5) c.fillRect(ix + r() * iw * 0.6, iy + r() * ih * 0.6, 6 + r() * iw * 0.4, 5 + r() * ih * 0.4); else { c.beginPath(); c.arc(ix + r() * iw, iy + r() * ih, 4 + r() * 9, 0, TAU); c.fill(); } }); c.globalAlpha = 1; }
    else if (estilo === 'retrato') { c.fillStyle = '#5a6a7a'; c.fillRect(ix, iy, iw, ih); c.fillStyle = '#e8c8a0'; c.beginPath(); c.ellipse(ix + iw / 2, iy + ih * 0.42, iw * 0.2, ih * 0.22, 0, 0, TAU); c.fill(); c.fillStyle = '#2a1a10'; c.beginPath(); c.ellipse(ix + iw / 2, iy + ih * 0.3, iw * 0.22, ih * 0.14, 0, Math.PI, 0); c.fill(); c.fillStyle = '#7a3a3a'; c.beginPath(); c.ellipse(ix + iw / 2, iy + ih * 1.02, iw * 0.38, ih * 0.3, 0, Math.PI, 0); c.fill(); }
    else if (estilo === 'flor') { c.fillStyle = '#e8dcc0'; c.fillRect(ix, iy, iw, ih); c.strokeStyle = '#3a7a3a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(ix + iw / 2, iy + ih); c.lineTo(ix + iw / 2, iy + ih * 0.4); c.stroke(); ['#d8402a', '#e8a02a', '#c83a8a'].forEach((cc, k) => { c.fillStyle = cc; c.beginPath(); c.arc(ix + iw * (0.34 + k * 0.16), iy + ih * (0.36 + (k % 2) * 0.08), Math.min(iw, ih) * 0.14, 0, TAU); c.fill(); }); }
    else if (estilo === 'mapa') { c.fillStyle = '#e8d8a8'; c.fillRect(ix, iy, iw, ih); c.fillStyle = '#9aa860'; c.beginPath(); c.moveTo(ix + 3, iy + ih * 0.5); c.lineTo(ix + iw * 0.35, iy + 3); c.lineTo(ix + iw * 0.7, iy + ih * 0.3); c.lineTo(ix + iw - 3, iy + ih * 0.8); c.lineTo(ix + iw * 0.3, iy + ih - 3); c.closePath(); c.fill(); c.strokeStyle = '#a82a2a'; c.setLineDash([2, 2]); c.beginPath(); c.moveTo(ix + 6, iy + ih * 0.7); c.lineTo(ix + iw - 8, iy + ih * 0.3); c.stroke(); c.setLineDash([]); }
    else if (estilo === 'santo') { c.fillStyle = '#e8c860'; c.fillRect(ix, iy, iw, ih); c.fillStyle = '#c8302a'; c.beginPath(); c.ellipse(ix + iw / 2, iy + ih * 0.78, iw * 0.3, ih * 0.3, 0, Math.PI, 0); c.fill(); c.fillStyle = '#e8c8a0'; c.beginPath(); c.arc(ix + iw / 2, iy + ih * 0.38, iw * 0.15, 0, TAU); c.fill(); c.strokeStyle = '#fff8c0'; c.lineWidth = 1.5; c.beginPath(); c.arc(ix + iw / 2, iy + ih * 0.38, iw * 0.24, 0, TAU); c.stroke(); }
    else if (estilo === 'time') { c.fillStyle = '#1f7a3c'; c.fillRect(ix, iy, iw, ih); c.strokeStyle = '#fff'; c.lineWidth = 1; c.strokeRect(ix + 3, iy + 3, iw - 6, ih - 6); c.beginPath(); c.moveTo(ix + iw / 2, iy + 3); c.lineTo(ix + iw / 2, iy + ih - 3); c.stroke(); c.beginPath(); c.arc(ix + iw / 2, iy + ih / 2, ih * 0.16, 0, TAU); c.stroke(); }
    else { const g = c.createLinearGradient(0, iy, 0, iy + ih); g.addColorStop(0, '#8ac4f0'); g.addColorStop(0.55, '#d8ecf8'); g.addColorStop(0.56, '#6aa860'); g.addColorStop(1, '#3a7a40'); c.fillStyle = g; c.fillRect(ix, iy, iw, ih); c.fillStyle = '#8a9ab0'; c.beginPath(); c.moveTo(ix, iy + ih * 0.56); c.lineTo(ix + iw * 0.3, iy + ih * 0.3); c.lineTo(ix + iw * 0.55, iy + ih * 0.56); c.fill(); c.beginPath(); c.moveTo(ix + iw * 0.4, iy + ih * 0.56); c.lineTo(ix + iw * 0.72, iy + ih * 0.24); c.lineTo(ix + iw, iy + ih * 0.56); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.moveTo(px, py); c.lineTo(px + w * 0.5, py); c.lineTo(px, py + h * 0.6); c.fill();
    c.restore();
  };
  D.relogio = function (c, cx, cy, r, cor) {
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.arc(cx + 2, cy + 3, r + 2, 0, TAU); c.fill();
    c.fillStyle = cor || '#5a3a22'; c.beginPath(); c.arc(cx, cy, r + 2, 0, TAU); c.fill(); c.fillStyle = '#f6f0e0'; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill();
    c.strokeStyle = '#222'; c.lineWidth = 1; for (let k = 0; k < 12; k++) { const a = k * TAU / 12; c.beginPath(); c.moveTo(cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3)); c.lineTo(cx + Math.cos(a) * (r - 1), cy + Math.sin(a) * (r - 1)); c.stroke(); }
    const S = G.S, h = S ? L.hora(S) : 10, a1 = (h % 12) / 12 * TAU - Math.PI / 2, a2 = (h % 1) * TAU - Math.PI / 2;
    c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a1) * r * 0.5, cy + Math.sin(a1) * r * 0.5); c.stroke(); c.lineWidth = 1; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a2) * r * 0.8, cy + Math.sin(a2) * r * 0.8); c.stroke();
  };
  // prateleira de parede com objetos: itens = lista de 'livro','vaso','foto','planta','troféu','garrafa','caixa'
  D.prateleira = function (c, px, py, w, itens, cor) {
    const r = rng(semente(px + py * 3)); cor = cor || '#7a5a3a';
    let x = px + 6;
    (itens || ['livro', 'livro', 'vaso', 'foto', 'livro']).forEach(it => {
      if (x > px + w - 8) return;
      if (it === 'livro') { const n = 2 + (r() * 3 | 0); for (let k = 0; k < n && x < px + w - 6; k++) { const bh = 12 + r() * 8, bw = 4 + r() * 3; c.fillStyle = ['#c8402a', '#2a58b8', '#e0b32a', '#2f8a6a', '#7a3a8a', '#e8e0cc'][(r() * 6) | 0]; c.fillRect(x, py + 20 - bh, bw, bh); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x + 1, py + 20 - bh + 1, 1, bh - 3); x += bw + 0.6; } x += 3; }
      else if (it === 'vaso') { c.fillStyle = '#e8e0d0'; c.beginPath(); c.moveTo(x, py + 20); c.lineTo(x + 10, py + 20); c.quadraticCurveTo(x + 13, py + 12, x + 7, py + 8); c.lineTo(x + 3, py + 8); c.quadraticCurveTo(x - 3, py + 12, x, py + 20); c.fill(); c.fillStyle = '#2f8a3c'; c.beginPath(); c.arc(x + 5, py + 5, 4, 0, TAU); c.arc(x + 8, py + 8, 3, 0, TAU); c.fill(); x += 16; }
      else if (it === 'foto') { c.fillStyle = '#5a3a22'; c.fillRect(x, py + 6, 12, 14); c.fillStyle = '#d8e8f0'; c.fillRect(x + 2, py + 8, 8, 10); c.fillStyle = '#e8c8a0'; c.beginPath(); c.arc(x + 6, py + 12, 2.2, 0, TAU); c.fill(); x += 16; }
      else if (it === 'planta') { c.fillStyle = '#b8683a'; c.fillRect(x, py + 14, 9, 6); c.fillStyle = '#2f8a3c'; for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(x + 4.5 + (k - 2) * 2, py + 9 - Math.abs(k - 2), 2, 6, (k - 2) * 0.4, 0, TAU); c.fill(); } x += 14; }
      else if (it === 'troféu') { c.fillStyle = '#e8c850'; c.fillRect(x + 3, py + 15, 6, 5); c.beginPath(); c.moveTo(x, py + 6); c.lineTo(x + 12, py + 6); c.quadraticCurveTo(x + 11, py + 15, x + 6, py + 15); c.quadraticCurveTo(x + 1, py + 15, x, py + 6); c.fill(); x += 17; }
      else if (it === 'garrafa') { c.fillStyle = ['#2f8a3c', '#8a3a1a', '#d8a82a'][(r() * 3) | 0]; c.fillRect(x, py + 8, 5, 12); c.fillRect(x + 1.5, py + 2, 2, 7); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(x + 1, py + 10, 1, 7); x += 9; }
      else { c.fillStyle = '#c8a060'; c.fillRect(x, py + 10, 14, 10); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x, py + 14, 14, 1); x += 18; }
    });
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(px + 2, py + 24, w, 5);
    c.fillStyle = cor; c.fillRect(px, py + 20, w, 4); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(px, py + 20, w, 1);
  };
  // ar-condicionado split
  D.arCond = function (c, px, py, w) {
    c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(px + 2, py + 4, w, 18);
    const g = c.createLinearGradient(0, py, 0, py + 18); g.addColorStop(0, '#f4f6f8'); g.addColorStop(1, '#c8ced4'); c.fillStyle = g; rr(c, px, py, w, 18, 4); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1; rr(c, px + 0.5, py + 0.5, w - 1, 17, 4); c.stroke();
    c.fillStyle = '#8a929a'; c.fillRect(px + 6, py + 12, w - 12, 3); c.fillStyle = '#3ad86a'; c.beginPath(); c.arc(px + w - 9, py + 6, 1.8, 0, TAU); c.fill();
  };
  // interruptor e tomada
  D.interruptor = function (c, px, py) { c.fillStyle = '#f2efe6'; c.fillRect(px, py, 8, 12); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.strokeRect(px + 0.5, py + 0.5, 7, 11); c.fillStyle = '#c8c4b8'; c.fillRect(px + 2, py + 2, 4, 3); c.fillRect(px + 2, py + 7, 4, 3); };

  // armário de cozinha pendurado na parede
  D.armarioParede = function (c, px, py, w, h, cor) {
    cor = cor || '#8a5e3a';
    c.fillStyle = 'rgba(0,0,0,0.32)'; rr(c, px + 3, py + 6, w, h, 3); c.fill();
    const g = c.createLinearGradient(0, py, 0, py + h); g.addColorStop(0, shade(cor, 0.14)); g.addColorStop(1, shade(cor, -0.2)); c.fillStyle = g; rr(c, px, py, w, h, 3); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1; rr(c, px + 0.5, py + 0.5, w - 1, h - 1, 3); c.stroke();
    const n = Math.max(1, Math.round(w / 34)), dw = (w - 6) / n;
    for (let i = 0; i < n; i++) { const dx = px + 3 + i * dw; c.fillStyle = shade(cor, 0.05); rr(c, dx + 1, py + 4, dw - 3, h - 9, 2); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.35)'; rr(c, dx + 1.5, py + 4.5, dw - 4, h - 10, 2); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(dx + 3, py + 5.5, dw - 7, 1); c.fillStyle = '#e8d8a0'; c.fillRect(dx + (i % 2 ? 3 : dw - 7), py + h - 14, 2.2, 7); }
    c.fillStyle = shade(cor, 0.3); c.fillRect(px - 1, py - 2, w + 2, 3); c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(px, py + h, w, 2);
  };
  // revestimento de azulejo atrás da bancada
  D.azulejoParede = function (c, px, py, w, h, cor, cor2) {
    cor = cor || '#e8f0f2'; const T = 14;
    c.save(); c.beginPath(); c.rect(px, py, w, h); c.clip();
    for (let j = 0; j * T < h; j++) for (let i = 0; i * T < w; i++) { c.fillStyle = (cor2 && (i + j) % 4 === 0) ? cor2 : shade(cor, (hh(i, j + px) - 0.5) * 0.05); c.fillRect(px + i * T, py + j * T, T, T); const g = c.createLinearGradient(px + i * T, py + j * T, px + i * T + T, py + j * T + T); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0.05)'); c.fillStyle = g; c.fillRect(px + i * T, py + j * T, T, T); }
    c.strokeStyle = 'rgba(90,110,120,0.45)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i * T <= w; i++) { c.moveTo(px + i * T, py); c.lineTo(px + i * T, py + h); } for (let j = 0; j * T <= h; j++) { c.moveTo(px, py + j * T); c.lineTo(px + w, py + j * T); } c.stroke();
    c.restore();
  };
  // espelho de parede com moldura
  D.espelhoParede = function (c, px, py, w, h, cor) {
    cor = cor || '#c8a24a';
    c.fillStyle = 'rgba(0,0,0,0.3)'; rr(c, px + 3, py + 4, w, h, 4); c.fill();
    c.fillStyle = cor; rr(c, px - 3, py - 3, w + 6, h + 6, 4); c.fill(); c.fillStyle = shade(cor, 0.3); c.fillRect(px - 3, py - 3, w + 6, 1.5);
    const g = c.createLinearGradient(px, py, px + w, py + h); g.addColorStop(0, '#dcebf4'); g.addColorStop(0.5, '#a8c0d0'); g.addColorStop(1, '#c8dce8'); c.fillStyle = g; c.fillRect(px, py, w, h);
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.moveTo(px + w * 0.15, py); c.lineTo(px + w * 0.4, py); c.lineTo(px, py + h * 0.5); c.lineTo(px, py + h * 0.28); c.fill(); c.beginPath(); c.moveTo(px + w * 0.6, py); c.lineTo(px + w * 0.72, py); c.lineTo(px, py + h * 0.95); c.lineTo(px, py + h * 0.78); c.fill();
  };
  // toalheiro com toalhas
  D.toalheiro = function (c, px, py, w) {
    c.fillStyle = '#b8bec6'; c.fillRect(px, py, w, 3); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(px + 2, py + 4, w, 2);
    [['#4a90c8', 0.0], ['#f2f2ee', 0.5]].forEach(([cc, a], i) => { const tx = px + 4 + a * (w - 8); c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(tx + 2, py + 3, w * 0.4, 24); c.fillStyle = cc; c.fillRect(tx, py + 2, w * 0.4, 24); c.fillStyle = 'rgba(0,0,0,0.15)'; for (let k = 0; k < 4; k++) c.fillRect(tx, py + 6 + k * 5, w * 0.4, 1); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(tx, py + 2, w * 0.4, 2); });
  };

  // =====================================================================
  //  A CASCA DA SALA (substitui o fundo antigo)
  // =====================================================================
  L.casca = function (R) {
    const FX0 = R.x0, FX1 = R.x1, FY0 = R.y0, FY1 = R.y1, PX = R.portaX, w = FX1 - FX0, h = FY1 - FY0;
    const c = document.createElement('canvas'); c.width = R.W; c.height = R.H; const x = c.getContext('2d');
    R.seed = R.seed || semente((R.nome || '') + (R.piso || ''));
    Object.assign(ESTADO, { x0: FX0, x1: FX1, y0: FY0, y1: FY1, cl: claridade() });
    x.fillStyle = '#07050c'; x.fillRect(0, 0, R.W, R.H);
    // parede de trás
    paredeFace(x, FX0 - 24, FX1 + 24, 62, FY0, R);
    // chão
    x.save(); x.beginPath(); x.rect(FX0, FY0, w, h); x.clip();
    D.piso(x, R.piso, FX0, FY0, w, h, R.pisoCores, R.seed);
    if (R.pisoExtra) R.pisoExtra(x);          // pedaços de outro chão (cozinha, banheiro...)
    // brilho do verniz (faixa diagonal) e sombra no pé das paredes
    if (R.piso !== 'carpete' && R.piso !== 'cimento' && R.piso !== 'borracha') {
      for (let k = 0; k < Math.ceil(w / 380); k++) { const bx = FX0 + k * 380 - 40, g = x.createLinearGradient(bx, FY0, bx + 180, FY0 + 180); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.06)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(bx, FY0); x.lineTo(bx + 120, FY0); x.lineTo(bx + 120 + h * 0.8, FY1); x.lineTo(bx + h * 0.8, FY1); x.closePath(); x.fill(); }
    }
    let g = x.createLinearGradient(0, FY0, 0, FY0 + 46); g.addColorStop(0, 'rgba(8,4,12,0.55)'); g.addColorStop(1, 'rgba(8,4,12,0)'); x.fillStyle = g; x.fillRect(FX0, FY0, w, 46);
    g = x.createLinearGradient(FX0, 0, FX0 + 30, 0); g.addColorStop(0, 'rgba(8,4,12,0.45)'); g.addColorStop(1, 'rgba(8,4,12,0)'); x.fillStyle = g; x.fillRect(FX0, FY0, 30, h);
    g = x.createLinearGradient(FX1 - 30, 0, FX1, 0); g.addColorStop(0, 'rgba(8,4,12,0)'); g.addColorStop(1, 'rgba(8,4,12,0.45)'); x.fillStyle = g; x.fillRect(FX1 - 30, FY0, 30, h);
    g = x.createLinearGradient(0, FY1 - 26, 0, FY1); g.addColorStop(0, 'rgba(8,4,12,0)'); g.addColorStop(1, 'rgba(8,4,12,0.4)'); x.fillStyle = g; x.fillRect(FX0, FY1 - 26, w, 26);
    // capacho na porta
    const mw = 70, mh = 20, mx = PX - mw / 2, my = FY1 - mh - 6;
    x.fillStyle = 'rgba(0,0,0,0.3)'; rr(x, mx + 2, my + 3, mw, mh, 3); x.fill();
    x.fillStyle = R.capacho || '#7a4a2a'; rr(x, mx, my, mw, mh, 3); x.fill(); x.strokeStyle = 'rgba(255,255,255,0.18)'; x.lineWidth = 1; x.strokeRect(mx + 3.5, my + 3.5, mw - 7, mh - 7);
    x.fillStyle = 'rgba(255,255,255,0.12)'; for (let k = 0; k < mw; k += 3) x.fillRect(mx + k, my + 2, 1, mh - 4);
    x.restore();
    if (R.deco) R.deco(x);
    // paredes grossas dos lados (vista de cima): tampa clara + quina escura
    const cap = shade(R.parede || '#d8cdb0', 0.38), capE = shade(R.parede || '#d8cdb0', -0.15), capD = shade(R.parede || '#d8cdb0', -0.5);
    [[FX0 - 24, 24, -1], [FX1, 24, 1]].forEach(([px, ww, sg]) => {
      const gg = x.createLinearGradient(px, 0, px + ww, 0); gg.addColorStop(0, sg < 0 ? capD : capE); gg.addColorStop(0.18, cap); gg.addColorStop(0.82, cap); gg.addColorStop(1, sg < 0 ? capE : capD);
      x.fillStyle = gg; x.fillRect(px, 44, ww, FY1 - 44 + 36);
      x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(px + (sg < 0 ? ww - 3 : 0), 62, 3, FY1 - 62 + 36);
      x.fillStyle = 'rgba(255,255,255,0.3)'; x.fillRect(px + (sg < 0 ? 4 : 5), 46, 1.5, FY1 - 46 + 34);
    });
    // topo da parede de trás (grossura)
    let gt = x.createLinearGradient(0, 44, 0, 62); gt.addColorStop(0, shade(R.parede || '#d8cdb0', 0.5)); gt.addColorStop(1, shade(R.parede || '#d8cdb0', 0.18)); x.fillStyle = gt; x.fillRect(FX0 - 24, 44, FX1 - FX0 + 48, 18);
    x.fillStyle = 'rgba(0,0,0,0.28)'; x.fillRect(FX0 - 24, 61, FX1 - FX0 + 48, 1.5);
    // parede da frente (tampa + cara) com vão da porta
    const fy = FY1; const lado = (xa, xb) => {
      if (xb <= xa) return;
      let gf = x.createLinearGradient(0, fy, 0, fy + 36); gf.addColorStop(0, shade(R.parede || '#d8cdb0', 0.34)); gf.addColorStop(0.4, shade(R.parede || '#d8cdb0', 0.2)); gf.addColorStop(0.42, shade(R.parede || '#d8cdb0', -0.3)); gf.addColorStop(1, shade(R.parede || '#d8cdb0', -0.55));
      x.fillStyle = gf; x.fillRect(xa, fy, xb - xa, 36); x.fillStyle = 'rgba(255,255,255,0.3)'; x.fillRect(xa, fy, xb - xa, 1.5);
      x.fillStyle = 'rgba(0,0,0,0.4)'; x.fillRect(xa, fy + 14.5, xb - xa, 1.5);
    };
    lado(FX0 - 24, PX - 46); lado(PX + 46, FX1 + 24);
    // porta de saída: batente, luz de fora, placa
    x.fillStyle = '#2a1c12'; x.fillRect(PX - 46, fy - 4, 92, 46); x.fillStyle = '#4a3220'; x.fillRect(PX - 46, fy - 4, 92, 3);
    const lg = x.createLinearGradient(0, fy, 0, fy + 40); lg.addColorStop(0, 'rgba(255,244,210,0.98)'); lg.addColorStop(1, 'rgba(255,255,255,0.7)'); x.fillStyle = lg; x.fillRect(PX - 39, fy + 2, 78, 38);
    x.fillStyle = 'rgba(255,230,160,0.2)'; x.beginPath(); x.moveTo(PX - 39, fy); x.lineTo(PX + 39, fy); x.lineTo(PX + 74, fy - 84); x.lineTo(PX - 74, fy - 84); x.closePath(); x.fill();
    x.fillStyle = '#e8d8b0'; x.fillRect(PX - 26, fy - 12, 52, 10); x.strokeStyle = 'rgba(0,0,0,0.5)'; x.lineWidth = 1; x.strokeRect(PX - 25.5, fy - 11.5, 51, 9);
    x.fillStyle = '#5a2a1a'; x.font = 'bold 8px Arial'; x.textAlign = 'center'; x.fillText(R.porta ? R.porta.rotulo || 'SAÍDA' : 'SAÍDA', PX, fy - 4.2); x.textAlign = 'left';
    // quinas
    [[FX0 - 24, 44], [FX1, 44]].forEach(([px, py]) => { x.fillStyle = shade(R.parede || '#d8cdb0', 0.52); x.fillRect(px, py, 24, 18); x.strokeStyle = 'rgba(0,0,0,0.3)'; x.strokeRect(px + 0.5, py + 0.5, 23, 17); });
    return c;
  };
})(window.G = window.G || {});
