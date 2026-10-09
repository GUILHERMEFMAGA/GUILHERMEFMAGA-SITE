/* =====================================================================
   LUZ.JS — visual "cinematográfico": pixel art 2.5D com luz dinâmica
   Tudo é desenhado DEPOIS do mundo, por cima, em camadas:
     1) neblina          -> nuvens de névoa que andam devagar (volumétrica)
     2) mapa de luz      -> escurece pela hora do dia e "acende" faróis,
                            postes, janelas, sirenes e explosões
     3) brilho (glow)    -> as luzes brilham e criam feixes de luz
     4) bloom            -> as partes claras "vazam" luz em volta (menos de dia)
     5) cor de cinema    -> contraste e tom azul/laranja
     6) vinheta          -> cantos mais escuros
     7) PIXEL ART (por último, em paleta.js): pixels grandes, nitidez, tramado e
        paleta fixa. Como é o último passo, a luz, a neblina e o brilho também
        viram pixel art (degradês em tramado) em vez de borrões lisos.
   Tecla V troca o nível: 2 = completo, 1 = sem pixelização, 0 = clássico.
   ===================================================================== */
(function (G) {
  'use strict';
  const VW = 800, VH = 600, TAU = Math.PI * 2;
  const L = G.luz = { nivel: 2 };   // 2 = pixel art (padrão); V troca

  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---- telas auxiliares (criadas uma vez só) ----
  const luzC = mk(VW, VH), lx = luzC.getContext('2d');      // mapa de luz
  const nevC = mk(VW, VH), nx = nevC.getContext('2d');      // neblina
  const copiaC = mk(VW, VH), cx = copiaC.getContext('2d');  // cópia da imagem (cor de cinema)
  const bl1 = mk(200, 150), b1x = bl1.getContext('2d');     // bloom (1/4)
  const bl2 = mk(200, 150), b2x = bl2.getContext('2d');
  const bl3 = mk(100, 75), b3x = bl3.getContext('2d');      // bloom (1/8)

  // ---- textura de neblina que se repete sem emendas ----
  function fazNeblina() {
    const c = mk(512, 512), x = c.getContext('2d'); let s = 7;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let k = 0; k < 70; k++) {
      const bx = r() * 512, by = r() * 512, rad = 50 + r() * 90, a = 0.10 + r() * 0.16;
      for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) {
        const g = x.createRadialGradient(bx + dx, by + dy, 1, bx + dx, by + dy, rad);
        g.addColorStop(0, 'rgba(255,255,255,' + a + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g; x.fillRect(bx + dx - rad, by + dy - rad, rad * 2, rad * 2);
      }
    }
    return c;
  }
  let nevPat = null;

  // ---- cor do ambiente conforme a hora (f = 0..1; 0.55-0.65 entardecer, 0.65-0.92 noite) ----
  const CORES = [
    [0.00, 236, 208, 176], [0.08, 238, 232, 220], [0.40, 238, 236, 228], [0.52, 238, 208, 166],
    [0.60, 255, 150, 110], [0.67, 84, 94, 160], [0.90, 84, 94, 160], [0.96, 190, 130, 140], [1.00, 236, 208, 176]
  ];
  function ambiente(f) {
    for (let i = 1; i < CORES.length; i++) {
      if (f <= CORES[i][0]) {
        const a = CORES[i - 1], b = CORES[i], t = (f - a[0]) / (b[0] - a[0]);
        return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t];
      }
    }
    return [236, 208, 176];
  }

  // altura da fachada (parede) de um prédio — usada também pelo mundo
  // ---- lista de luzes do quadro ----
  function juntarLuzes(S, W, cam, z, inV, noite) {
    const out = [];
    const add = (x, y, r, col, a, ang, spread) => out.push({ x, y, r, col, a, ang, spread });
    const vx0 = cam.x - VW / 2 / z - 160, vx1 = cam.x + VW / 2 / z + 160, vy0 = cam.y - VH / 2 / z - 160, vy1 = cam.y + VH / 2 / z + 160;
    const vis = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1;
    W.lamps.forEach(l => { if (vis(l.x, l.y)) add(l.x, l.y, 140, [255, 196, 110], 0.8); });
    S.cars.forEach(c => {
      if (c.dead || !vis(c.x, c.y)) return;
      const ang = Math.atan2(c.fy, c.fx);
      add(c.x + c.fx * 34, c.y + c.fy * 34, 250, [255, 240, 195], 0.78, ang, 0.3);       // feixe dos faróis
      add(c.x + c.fx * 60, c.y + c.fy * 60, 75, [255, 240, 200], 0.55);                    // poça de luz na frente
      add(c.x - c.fx * 30, c.y - c.fy * 30, c.brakeLight ? 80 : 55, [255, 40, 30], c.brakeLight ? 0.95 : 0.5);                     // lanternas
      if (c.siren) {
        const ph = Math.floor(S.time * 7 + c.x * 0.01) % 2;
        add(c.x, c.y, 190, ph ? [255, 40, 40] : [50, 90, 255], 0.95);
      }
    });
    const ref = S.player.car || S.player;
    if (vis(ref.x, ref.y)) add(ref.x, ref.y, 95, [255, 235, 200], 0.4);
    S.particles.forEach(p => {
      if (!vis(p.x, p.y)) return;
      if (p.col === 'flash') add(p.x, p.y, 130, [255, 190, 90], 1);
      else if (p.col === 'ring') add(p.x, p.y, 300, [255, 170, 80], 1);
      else if (p.col === 'fire' && p.size > 8) add(p.x, p.y, p.size * 6, [255, 130, 40], 0.5);
    });
    if (S.heli) add(ref.x, ref.y, 150, [255, 255, 235], 1);
    return out;
  }

  function gradLuz(c, l) {
    const g = c.createRadialGradient(l.x, l.y, 3, l.x, l.y, l.r);
    const k = l.col[0] + ',' + l.col[1] + ',' + l.col[2];
    g.addColorStop(0, 'rgba(' + k + ',' + l.a + ')'); g.addColorStop(0.45, 'rgba(' + k + ',' + (l.a * 0.4) + ')'); g.addColorStop(1, 'rgba(' + k + ',0)');
    c.fillStyle = g; c.beginPath();
    if (l.ang !== undefined) { c.moveTo(l.x, l.y); c.arc(l.x, l.y, l.r, l.ang - l.spread, l.ang + l.spread); c.closePath(); }
    else c.arc(l.x, l.y, l.r, 0, TAU);
    c.fill();
  }

  // ---- chamado pelo game.js depois que o mundo foi desenhado ----
  // (a paleta fixa e o tramado agora ficam em paleta.js: G.paleta.pixelar)
  // devolve true se desenhou os efeitos (senão o game.js usa o visual clássico)
  L.desenhar = function (ctx, S, W, cam, z, inV) {
    if (L.nivel === 0) return false;
    const f = ((S.dayT % 1) + 1) % 1;
    const amb = ambiente(f);
    const lum = (amb[0] * 0.3 + amb[1] * 0.59 + amb[2] * 0.11) / 255;
    const noite = clamp(1.12 - lum * 1.28, 0, 1);            // 0 = dia claro, ~1 = noite fechada
    const t = S.time;

    // 1) neblina volumétrica (duas camadas com velocidades diferentes = profundidade)
    if (!nevPat) nevPat = nx.createPattern(fazNeblina(), 'repeat');
    const dens = 0.025 + noite * 0.10 + (f > 0.92 || f < 0.06 ? 0.06 : 0);
    nx.globalCompositeOperation = 'source-over'; nx.clearRect(0, 0, VW, VH);
    const camada = (esc, par, vel, alfa) => {
      nx.save(); nx.globalAlpha = alfa; nx.scale(esc, esc);
      const ox = (cam.x * par + t * vel), oy = (cam.y * par + t * vel * 0.4);
      nx.translate(-ox, -oy); nx.fillStyle = nevPat; nx.fillRect(ox, oy, VW / esc, VH / esc); nx.restore();
    };
    camada(1.6, 0.35, 9, 1); camada(1.0, 0.6, 18, 0.7);
    nx.globalCompositeOperation = 'source-in'; nx.fillStyle = '#c4cee4'; nx.fillRect(0, 0, VW, VH);
    ctx.globalAlpha = clamp(dens * 2, 0, 0.4); ctx.drawImage(nevC, 0, 0); ctx.globalAlpha = 1;

    // 2) mapa de luz: começa com a cor do ambiente e soma as luzes
    lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalCompositeOperation = 'source-over';
    lx.fillStyle = 'rgb(' + (amb[0] | 0) + ',' + (amb[1] | 0) + ',' + (amb[2] | 0) + ')'; lx.fillRect(0, 0, VW, VH);
    const luzes = juntarLuzes(S, W, cam, z, inV, noite);
    // janelas acesas nos prédios (de noite)
    const janelas = [];
    if (noite > 0.05) {
      const vx0 = cam.x - VW / 2 / z, vx1 = cam.x + VW / 2 / z, vy0 = cam.y - VH / 2 / z, vy1 = cam.y + VH / 2 / z;
      W.buildings.forEach(b => { const bb = b.box || b; if (bb.x < vx1 && bb.x + bb.w > vx0 && bb.y < vy1 && bb.y + bb.h > vy0 && ((b.x * 7 + b.y * 3) % 10) < 8) janelas.push(b); });
    }
    lx.save(); lx.setTransform(z, 0, 0, z, VW / 2 - cam.x * z, VH / 2 - cam.y * z);
    lx.globalCompositeOperation = 'lighter';
    if (noite > 0.03) {
      luzes.forEach(l => gradLuz(lx, l));
      lx.fillStyle = 'rgba(255,190,100,0.42)';
      janelas.forEach(b => {
        if (b.jl && b.jl.length) { b.jl.forEach(j => lx.fillRect(j.x, j.y, j.w, j.h)); return; }   // só as janelas que o arte.js deixou acesas
        const fh = W.fachada(b); lx.fillRect(b.x + 4, b.y + b.h - fh + 3, b.w - 8, fh - 6);
      });
    }
    lx.restore();
    ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(luzC, 0, 0); ctx.globalCompositeOperation = 'source-over';

    // 3) brilho das luzes por cima (feixes visíveis na neblina)
    ctx.save(); ctx.setTransform(z, 0, 0, z, VW / 2 - cam.x * z, VH / 2 - cam.y * z);
    ctx.globalCompositeOperation = 'lighter';
    const forca = 0.02 + noite * 0.09;
    luzes.forEach(l => { const a0 = l.a; l.a = a0 * forca * (l.ang !== undefined ? 0.85 : 0.7); gradLuz(ctx, l); l.a = a0; });
    ctx.restore();
    // raios de sol (só de dia): faixas diagonais bem suaves
    const sol = clamp(1 - noite * 2.2, 0, 1) * 0.035;
    if (sol > 0.004) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 4; k++) {
        const bx = ((k * 260 + t * 6 + cam.x * 0.05) % 1100) - 250, w = 70 + k * 18;
        const g = ctx.createLinearGradient(bx, 0, bx + w, 0);
        g.addColorStop(0, 'rgba(255,230,170,0)'); g.addColorStop(0.5, 'rgba(255,230,170,' + (sol * (0.6 + 0.4 * Math.sin(t * 0.5 + k))) + ')'); g.addColorStop(1, 'rgba(255,230,170,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx + 220, 0); ctx.lineTo(bx + 220 + w, 0); ctx.lineTo(bx + w, VH); ctx.lineTo(bx, VH); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    // 4) bloom: encolhe, "eleva" os claros (multiplicando por si mesmo) e soma de volta (de dia é bem mais fraco: senão lava as cores)
    b1x.imageSmoothingEnabled = true; b1x.drawImage(ctx.canvas, 0, 0, 200, 150);
    b2x.globalCompositeOperation = 'source-over'; b2x.drawImage(bl1, 0, 0);
    b2x.globalCompositeOperation = 'multiply'; b2x.drawImage(bl1, 0, 0); b2x.drawImage(bl1, 0, 0); b2x.drawImage(bl1, 0, 0); b2x.globalCompositeOperation = 'source-over';
    b3x.drawImage(bl2, 0, 0, 100, 75);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true;
    const kb = 0.22 + 0.78 * noite;
    ctx.globalAlpha = 0.16 * kb; ctx.drawImage(bl2, 0, 0, VW, VH);
    ctx.globalAlpha = 0.24 * kb; ctx.drawImage(bl3, 0, 0, VW, VH);
    ctx.restore();

    // 5) cor de cinema: mais contraste/saturação + sombras azuis e luzes laranja (no nível 2 isso é feito por pixel, em paleta.js)
    if (L.nivel < 2) {
    cx.globalCompositeOperation = 'source-over'; cx.drawImage(ctx.canvas, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.3; ctx.drawImage(copiaC, 0, 0);
    ctx.globalAlpha = 0.09;
    const gr = ctx.createLinearGradient(0, 0, VW, VH); gr.addColorStop(0, '#1fa6c8'); gr.addColorStop(0.5, '#8a6fd0'); gr.addColorStop(1, '#ff9a3c');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
    ctx.restore();
    }

    // 6) vinheta
    const vg = ctx.createRadialGradient(VW / 2, VH / 2, 220, VW / 2, VH / 2, 590);
    vg.addColorStop(0, 'rgba(0,0,12,0)'); vg.addColorStop(1, 'rgba(0,0,14,' + (0.42 + noite * 0.12) + ')');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);

    // 7) pixel art de verdade (paleta fixa + tramado), por último
    // (de dia as cores ficam bem vivas; de noite menos saturadas, senão o azul da lua vira ciano)
    if (L.nivel >= 2 && G.paleta) G.paleta.pixelar(ctx, { sat: 1.22 - 0.34 * noite, contraste: 1.06 - 0.02 * noite, tinta: 1 - 0.4 * noite });
    return true;
  };

  const NOMES = ['Clássico', 'Cinema nítido', 'Cinema pixel art'];
  L.alternar = function () { L.nivel = (L.nivel + 2) % 3; return 'Gráficos: ' + NOMES[L.nivel]; };
})(window.G = window.G || {});
