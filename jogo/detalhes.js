/* =====================================================================
   DETALHES.JS — pequenos detalhes que dão vida à cidade
     - pombos nas calçadas (bicam o chão e voam quando você chega perto)
     - fumaça saindo dos bueiros
   ===================================================================== */
(function (G) {
  'use strict';
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const MAX_POMBOS = 16;
  let bueiros = [], bueirosT = 0;

  // ponto da calçada longe do jogador, para um pombo novo aparecer
  function novoPombo(S, W, ref) {
    for (let tent = 0; tent < 12; tent++) {
      const a = rand(0, TAU), d = rand(260, 620), x = ref.x + Math.cos(a) * d, y = ref.y + Math.sin(a) * d;
      if (W.tileAt(x, y) !== W.TILE.SIDE) continue;
      // fica na faixa de calçada junto das ruas (não sobre árvores)
      if (W.treeHit && W.treeHit(x, y, 6)) continue;
      return { x, y, a: rand(0, TAU), st: 'chao', h: 0, t: rand(0, 5), vx: 0, vy: 0, fly: 0, cor: Math.random() < 0.8 ? '#8b8f9c' : '#c9c9d0' };
    }
    return null;
  }

  function update(S, W, dt) {
    const ref = { x: S.cam.x, y: S.cam.y };
    // ---- pombos ----
    if (!S.pombos) S.pombos = [];
    const pl = S.player ? (S.player.car || S.player) : { x: 0, y: 0 };
    S.pombos.forEach(p => {
      p.t += dt;
      if (p.st === 'chao') {
        const sp = pl.speed ? Math.abs(pl.speed) : 0;
        const dist = Math.hypot(pl.x - p.x, pl.y - p.y);
        const peds = S.peds.some(q => q.state !== 'dead' && Math.abs(q.x - p.x) < 28 && Math.abs(q.y - p.y) < 28);
        if (dist < 70 + sp * 0.2 || peds || S.particles.some(q => q.col === 'flash' && Math.hypot(q.x - p.x, q.y - p.y) < 300)) {
          p.st = 'voa'; p.fly = 0; const a = Math.atan2(p.y - pl.y, p.x - pl.x) + rand(-0.8, 0.8);
          p.a = a; p.vx = Math.cos(a) * rand(120, 170); p.vy = Math.sin(a) * rand(120, 170) - 10;
        } else if (Math.random() < dt * 0.4) { p.a += rand(-1.2, 1.2); }   // vira a cabeça
        if (p.st === 'chao' && Math.random() < dt * 0.15) { p.x += Math.cos(p.a) * 3; p.y += Math.sin(p.a) * 3; } // dá uns passinhos
      } else {
        p.fly += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.h = Math.min(46, p.h + 60 * dt);
      }
    });
    S.pombos = S.pombos.filter(p => p.fly < 3 && Math.hypot(p.x - ref.x, p.y - ref.y) < 900);
    if (S.pombos.length < MAX_POMBOS && Math.random() < dt * 2) { const n = novoPombo(S, W, ref); if (n) S.pombos.push(n); }

    // ---- fumaça dos bueiros ----
    bueirosT -= dt;
    if (bueirosT <= 0) { bueirosT = 1.5; bueiros = W.manholes(ref.x - 500, ref.y - 400, ref.x + 500, ref.y + 400).filter(b => ((b.x * 7 + b.y * 13) | 0) % 5 < 2); }
    bueiros.forEach(b => {
      if (Math.random() < dt * 2.2) G.particle({ x: b.x + rand(-2, 2), y: b.y + rand(-2, 2), vx: rand(-5, 5), vy: rand(-14, -6), life: rand(1.6, 2.4), size: rand(3, 5), col: 'smoke', tint: '#e6eaf2', a: 0.2 });
    });
  }

  function draw(ctx, S, inV) {
    if (!S.pombos) return;
    S.pombos.forEach(p => {
      if (!inV(p)) return;
      // sombra no chão
      ctx.save(); ctx.translate(p.x + 2 + p.h * 0.3, p.y + 2 + p.h * 0.4); ctx.rotate(p.a); ctx.fillStyle = 'rgba(0,0,10,' + (0.28 - p.h * 0.003) + ')';
      ctx.beginPath(); ctx.ellipse(0, 0, 5, 3, 0, 0, TAU); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(p.x, p.y - p.h); ctx.rotate(p.a);
      const voando = p.st === 'voa', bat = voando ? Math.sin(p.t * 34) : 0;
      if (voando) { ctx.fillStyle = p.cor; ctx.beginPath(); ctx.ellipse(-1, 0, 2.4, 6.5 + bat * 2.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(-1, 0, 1.4, 5 + bat * 2, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = p.cor; ctx.beginPath(); ctx.ellipse(0, 0, 4.6, 2.9, 0, 0, TAU); ctx.fill();      // corpo
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(-1.6, 0, 2.6, 2.3, 0, 0, TAU); ctx.fill();   // asas fechadas
      ctx.fillStyle = '#3a8a6a'; ctx.beginPath(); ctx.ellipse(2.8, 0, 1.6, 1.8, 0, 0, TAU); ctx.fill();  // pescoço verde-roxo
      ctx.fillStyle = '#7a7e8c'; ctx.beginPath(); ctx.arc(4.4, voando ? 0 : Math.sin(p.t * 5 + p.x) > 0.7 ? 0.6 : 0, 1.5, 0, TAU); ctx.fill();  // cabeça
      ctx.fillStyle = '#e8a050'; ctx.fillRect(5.6, -0.3, 1.4, 0.7);                                      // bico
      ctx.restore();
    });
  }

  G.detalhes = { update, draw };
})(window.G = window.G || {});
