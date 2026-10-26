  // rachaduras, remendos, manchas de óleo, bueiros e poças (sorteados sempre do mesmo jeito).
  // Visual de PIXEL ART: rachaduras feitas de quadradinhos 2x2, remendos retos e lisos, óleo em degraus e poças pequenas.
  // (a ordem dos sorteios e as faixas de "kind" não mudam: o manholes() lá embaixo usa as mesmas contas)
  function pixelTraco(ctx, pts, cor) {          // desenha uma linha de quadradinhos 2x2 (rachadura "serrilhada" de pixel art)
    ctx.fillStyle = cor;
    for (let k = 1; k < pts.length; k++) {
      const [ax, ay] = pts[k - 1], [bx, by] = pts[k], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 1.5));
      for (let q = 0; q <= n; q++) ctx.fillRect(Math.round((ax + (bx - ax) * q / n) / 2) * 2, Math.round((ay + (by - ay) * q / n) / 2) * 2, 2, 2);
    }
  }
  function drawRoadDetail(ctx, x0, y0, x1, y1) {
    const cs = 120;
    for (let gy = Math.floor(y0 / cs) - 1; gy <= Math.floor(y1 / cs) + 1; gy++) for (let gx = Math.floor(x0 / cs) - 1; gx <= Math.floor(x1 / cs) + 1; gx++) {
      const r = mulberry32(gx * 7349 + gy * 9151 + 13);
      const px = (gx + r()) * cs, py = (gy + r()) * cs, kind = r(), a1 = r(), a2 = r(), a3 = r();
      if (tileAt(px, py) !== TILE.ROAD) continue;
      const X = Math.round(px / 2) * 2, Y = Math.round(py / 2) * 2;
      ctx.save(); ctx.translate(X, Y);
      if (kind < 0.42) { // rachadura (só algumas aparecem: rua muito rachada fica feia)
        if (a3 < 0.6) {
          const ang = a1 * 6.28, ca = Math.cos(ang), sa = Math.sin(ang), n = 5 + Math.floor(a2 * 5), pts = [[0, 0]];
          let cx = 0, cy = 0;
          for (let k = 0; k < n; k++) { cx += 6 + r() * 14; cy += (r() - 0.5) * 14; pts.push([cx * ca - cy * sa, cx * sa + cy * ca]); }
          pixelTraco(ctx, pts.map(p => [p[0] + 1, p[1] + 1]), 'rgba(255,255,255,0.10)');   // brilho de um lado
          pixelTraco(ctx, pts, '#41376a');                                                  // fenda escura
        }
      } else if (kind < 0.56) { // remendo de asfalto: retângulo liso, um tom mais escuro, sem contorno
        const w = Math.round((30 + a2 * 40) / 2) * 2, h = Math.round((18 + a3 * 28) / 2) * 2;
        ctx.fillStyle = 'rgba(30,20,56,0.15)'; ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.fillStyle = 'rgba(30,20,56,0.10)'; ctx.fillRect(-w / 2, -h / 2, w, 2); ctx.fillRect(-w / 2, -h / 2, 2, h);   // beiradinha mais escura em cima e à esquerda
      } else if (kind < 0.70) { // óleo: três elipses em degraus (cada uma mais escura que a anterior)
        const rad = 14 + a1 * 10, ach = 0.7 + a2 * 0.5;
        ctx.scale(1, ach);
        [[1, 0.09], [0.66, 0.09], [0.34, 0.10]].forEach(([k, a]) => { ctx.fillStyle = 'rgba(14,8,34,' + a + ')'; ctx.beginPath(); ctx.arc(0, 0, rad * k, 0, 7); ctx.fill(); });
      } else if (kind < 0.75) { // bueiro
        ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.arc(2, 2, 10, 0, 7); ctx.fill();
        ctx.fillStyle = '#4a4458'; ctx.beginPath(); ctx.arc(0, 0, 9.5, 0, 7); ctx.fill();
        ctx.strokeStyle = '#2a2633'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#383245'; for (let k = -6; k <= 6; k += 4) { ctx.fillRect(k - 1, -6, 2, 12); ctx.fillRect(-6, k - 1, 12, 2); }
        ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(-6, -6, 4, 2); ctx.fillRect(-6, -6, 2, 4);
      } else if (kind < 0.83) { // poça d'água: pequena, azul-acinzentada, com um reflexo
        const pw = 8 + a1 * 12, ph = 4 + a2 * 6;
        ctx.rotate(Math.round(a3 * 3) * 0.5);
        ctx.fillStyle = 'rgba(120,138,200,0.30)'; ctx.beginPath(); ctx.ellipse(0, 0, pw, ph, 0, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(235,242,255,0.26)'; ctx.beginPath(); ctx.ellipse(-pw * 0.25, -ph * 0.3, pw * 0.4, ph * 0.28, 0, 0, 7); ctx.fill();
      }
      ctx.restore();
    }
  }

