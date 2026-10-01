/* ============================================================
   pedagio.js — praças de pedágio nas pontes para o interior e para a outra cidade
   • Carro do jogador: ao chegar na cancela o pedágio é cobrado sozinho. Sem dinheiro, a cancela não abre.
   • Passou a cancela fechada em alta velocidade? Quebra a cancela e a polícia fica sabendo (evasão!).
   • Carros e pedestres da cidade passam de graça (a prefeitura paga).
   • Também avisa quando você entra em outra cidade.
   ============================================================ */
(function (G) {
  'use strict';
  const W = G.world, T = W.T, TAU = Math.PI * 2, C = G.cidade;
  const P = G.pedagio = { pracas: [], cobrado: 0, passagens: 0 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- as praças ----------
  const DEFS = [
    { rio: 9, j: 3, valor: 15, nome: 'PEDÁGIO DO INTERIOR' },
    { rio: 13, j: 2, valor: 25, nome: 'PEDÁGIO VALE VERDE' },
    { rio: 13, j: 4, valor: 25, nome: 'PEDÁGIO PONTE NOVA ERA', ponteObra: 'PONTE NOVA ERA' },
    { rio: 9, j: 1, valor: 15, nome: 'PEDÁGIO PONTE DO PROGRESSO', ponteObra: 'PONTE DO PROGRESSO' }
  ];
  DEFS.forEach(d => {
    const rv = W.blocks.find(b => b.kind === 'river' && b.bx === d.rio), top = W.roadTop(d.j);
    const pr = Object.assign({}, d, { x0: rv.x, x1: rv.x + rv.w, top, mid: top + 3 * T });
    // uma pista para cada sentido: leste entra pela margem esquerda, oeste pela direita
    pr.pistas = [
      { dir: 1, gx: rv.x + 34, y: top + 4.5 * T, aberta: 0, quebrada: 0, paga: false },
      { dir: -1, gx: rv.x + rv.w - 34, y: top + 1.5 * T, aberta: 0, quebrada: 0, paga: false }
    ];
    pr.ativa = () => !d.ponteObra || (C.pontes.find(p => p.nome === d.ponteObra) || {}).pronta;
    P.pracas.push(pr);
  });
  P.ativas = () => P.pracas.filter(p => p.ativa());

  // ---------- regra do pedágio ----------
  let regiaoAnt = null;
  function atualizar(S, dt) {
    const pl = S.player, car = pl.car;
    // aviso de cidade nova
    const reg = C.regiaoDe(pl.x, pl.y);
    if (regiaoAnt && reg.id !== regiaoAnt.id && S.mode === 'play') {
      const obras = reg.id !== 'ribeirao';
      G.banner(reg.nome, obras ? reg.sub + ' — cidade em construção, veja as obras crescerem' : 'de volta para casa', false, 3);
    }
    regiaoAnt = reg;
    P.ativas().forEach(pr => pr.pistas.forEach(ps => {
      if (ps.aberta > 0) ps.aberta -= dt; if (ps.quebrada > 0) ps.quebrada -= dt;
      // carros da cidade: a cancela abre sozinha na frente deles
      for (const c of S.cars) {
        if (c === car || c.dead) continue;
        const rel = (c.x - ps.gx) * ps.dir;
        if (Math.abs(c.y - ps.y) < 60 && rel > -240 && rel < 30) { ps.aberta = Math.max(ps.aberta, 1.4); break; }
      }
      if (!car) { ps.paga = false; return; }
      const rel = (car.x - ps.gx) * ps.dir, naPista = Math.abs(car.y - ps.y) < 58, dentro = naPista && rel > -150 && rel < 150;
      if (!dentro) { if (!naPista || rel < -320 || rel > 220) ps.paga = false; return; }
      const sentido = (car.vx * ps.dir) > -30 || car.speed < 25;   // vindo na direção da cancela (ou parado)
      if (rel < 6 && rel > -150 && !ps.paga && ps.aberta <= 0 && ps.quebrada <= 0 && sentido) {
        if (S.save.money >= pr.valor) {
          S.save.money -= pr.valor; ps.paga = true; ps.aberta = 7; P.cobrado += pr.valor; P.passagens++;
          G.say(pr.nome + ': cobrado $' + pr.valor + '. Boa viagem!', 3.5); G.snd.beep(); G.save();
          if (G.cameras && G.cameras.registra) G.cameras.registra('PEDÁGIO', pr.nome + ' — carro do jogador pagou $' + pr.valor, 'info', { x: car.x, y: car.y });
        } else if (rel > -80) {
          if (!ps.avisou || S.time - ps.avisou > 4) { ps.avisou = S.time; G.say('PEDÁGIO $' + pr.valor + ' — você não tem dinheiro. Dê ré!', 3.5); }
        }
      }
      // cancela fechada: bloqueia (ou quebra, se estiver rápido demais)
      if (ps.aberta <= 0 && ps.quebrada <= 0 && rel > -38 && rel < 16 && sentido) {
        if (car.speed > 150) {
          ps.quebrada = 28; G.addHeat(18); G.say('VOCÊ ARROMBOU A CANCELA DO PEDÁGIO! A câmera filmou tudo.', 4);
          if (G.cameras && G.cameras.registra) G.cameras.registra('CRIME', pr.nome + ' — evasão: carro do jogador quebrou a cancela', 'crime', { x: car.x, y: car.y });
          S.shake = Math.max(S.shake || 0, 6); G.snd.crash && G.snd.crash(0.6);
        } else {
          car.x = ps.gx - ps.dir * 38; car.vx *= -0.2; car.vy *= -0.2;
        }
      }
    }));
  }
  G.extras.add(atualizar);

  // ---------- desenho ----------
  const vis = (pr, v) => pr.x1 > v.x0 - 100 && pr.x0 < v.x1 + 100 && pr.top + 200 > v.y0 && pr.top - 50 < v.y1;
  P.desenhar = function (ctx, S, x0, y0, x1, y1, t) {
    const v = { x0, y0, x1, y1 };
    P.ativas().forEach(pr => {
      if (!vis(pr, v)) return;
      pr.pistas.forEach(ps => {
        // ilha com a guarita no meio da pista dupla
        const ix = ps.gx, iy = pr.mid;
        ctx.fillStyle = 'rgba(0,0,12,0.4)'; ctx.fillRect(ix - 18, iy - 28 + 7, 40, 60);
        ctx.fillStyle = '#9a9aa6'; ctx.fillRect(ix - 18, iy - 28, 36, 56); ctx.fillStyle = '#c8c8d2'; ctx.fillRect(ix - 18, iy - 28, 36, 3);
        ctx.fillStyle = '#e0b020'; for (let k = 0; k < 6; k++) ctx.fillRect(ix - 18 + k * 6, iy - 28, 3, 56 * 0 + 3);
        // guarita (telhado) com cobrador
        ctx.fillStyle = '#e8e8ec'; ctx.fillRect(ix - 13, iy - 22, 26, 44); ctx.fillStyle = '#c0c0c8'; ctx.fillRect(ix - 11, iy - 20, 22, 40);
        ctx.fillStyle = '#2a6ab8'; ctx.fillRect(ix - 13, iy - 22, 26, 5);
        ctx.fillStyle = '#9ad0ee'; ctx.fillRect(ps.dir > 0 ? ix + 6 : ix - 11, iy - 10, 5, 20);
        // faixas de aviso na pista
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let k = 0; k < 5; k++) ctx.fillRect(ps.gx - ps.dir * (46 + k * 12) - 3, ps.y - 40, 6, 80 * 0 + 3 + 0);
        ctx.fillStyle = 'rgba(255,224,74,0.9)'; ctx.fillRect(ps.gx - 2, ps.y - 46, 4, 92);
        // semáforo da cabine
        const livre = ps.aberta > 0 || ps.quebrada > 0;
        ctx.fillStyle = '#111'; ctx.fillRect(ix - 5, ps.y < iy ? iy - 36 : iy + 30, 10, 6);
        ctx.fillStyle = livre ? '#3dff6a' : '#ff3d3d'; ctx.beginPath(); ctx.arc(ix, ps.y < iy ? iy - 33 : iy + 33, 2.4, 0, TAU); ctx.fill();
      });
    });
  };
  // a cancela e o pórtico ficam por cima dos carros
  P.desenharAlto = function (ctx, S, x0, y0, x1, y1, t) {
    const v = { x0, y0, x1, y1 };
    P.ativas().forEach(pr => {
      if (!vis(pr, v)) return;
      pr.pistas.forEach(ps => {
        const px = ps.gx, py0 = pr.mid + (ps.y > pr.mid ? 14 : -14), len = 78, sgn = ps.y > pr.mid ? 1 : -1;
        const alvo = ps.quebrada > 0 ? 1.1 : ps.aberta > 0 ? 0 : 1;               // 1 = fechada
        ps.ang = (ps.ang == null ? 1 : ps.ang) + (alvo - (ps.ang == null ? 1 : ps.ang)) * 0.15;
        const a = ps.ang;
        ctx.save(); ctx.translate(px, py0);
        // braço gira de "atravessado na pista" (a=1) até "deitado ao longo da pista" (a=0)
        const rot = (1 - a) * (Math.PI / 2) * ps.dir * -sgn + (ps.quebrada > 0 ? 0.5 : 0);
        ctx.rotate(rot);
        ctx.fillStyle = 'rgba(0,0,10,0.3)'; ctx.fillRect(3, sgn > 0 ? 3 : -len + 3, 5, len);
        if (ps.quebrada > 0) { ctx.fillStyle = '#e8e8ea'; ctx.fillRect(-2.5, sgn > 0 ? 0 : -len / 2, 5, len / 2); ctx.fillStyle = '#d9242a'; ctx.fillRect(-2.5, sgn > 0 ? 8 : -len / 2 + 8, 5, 8); }
        else for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#e8e8ea' : '#d9242a'; ctx.fillRect(-2.5, sgn > 0 ? k * len / 8 : -(k + 1) * len / 8, 5, len / 8 + 0.4); }
        ctx.restore();
        ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(px, py0, 5, 0, TAU); ctx.fill();
      });
      // pórtico com placa (uma linha por cima da pista)
      const gx0 = pr.pistas[0].gx, gx1 = pr.pistas[1].gx;
      [[gx0, pr.pistas[0]], [gx1, pr.pistas[1]]].forEach(([gx, ps]) => {
        ctx.fillStyle = 'rgba(0,0,10,0.25)'; ctx.fillRect(gx - 5, pr.top + 6 + 8, 10, 6 * T - 12);
        ctx.fillStyle = '#3a3a44'; ctx.fillRect(gx - 5, pr.top + 6, 10, 6 * T - 12);
        const px = gx - 38, py = pr.top - 16 + (ps.dir > 0 ? 6 * T + 20 : 0);
        ctx.fillStyle = '#1b5fb0'; ctx.fillRect(px, ps.dir > 0 ? pr.top + 6 * T + 6 : pr.top - 30, 76, 24); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(px + 0.5, (ps.dir > 0 ? pr.top + 6 * T + 6 : pr.top - 30) + 0.5, 75, 23);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Arial'; ctx.textAlign = 'center'; ctx.fillText('PEDÁGIO', gx, (ps.dir > 0 ? pr.top + 6 * T + 6 : pr.top - 30) + 9);
        ctx.font = 'bold 11px Arial'; ctx.fillStyle = ps.aberta > 0 ? '#7dff8a' : '#ffe04a'; ctx.fillText('R$ ' + pr.valor, gx, (ps.dir > 0 ? pr.top + 6 * T + 6 : pr.top - 30) + 20); ctx.textAlign = 'left';
      });
    });
  };
})(window.G = window.G || {});
