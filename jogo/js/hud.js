'use strict';
/* ============================================================
   hud.js — HUD pixel estilo GTA1/2: dinheiro x1, cabeças de
   policial, corações, colete, combustível, rodapé amarelo com
   pager, seta de destino, minimapa e telas de estado.
   ============================================================ */
const HUD = {
  msgs: [], bigText: null, bigT: 0, overlay: 'start', img: null,
  msg(text, secs = 4) { this.msgs = [{ text, t: secs }]; },
  big(text, secs) { this.bigText = text; this.bigT = secs; },

  draw(ctx, S) {
    ctx.save();
    ctx.textAlign = 'left';
    // ---- dinheiro (canto sup. direito, como na referência) ----
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#39d353'; ctx.fillText('x1', 744, 22);
    ctx.fillStyle = '#ffe14a';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.strokeText(String(S.money).padStart(4, '0'), 766, 22);
    ctx.fillText(String(S.money).padStart(4, '0'), 766, 22);
    // ---- nível de procurado (topo centro) ----
    for (let i = 0; i < 5; i++) {
      const x = 368 + i * 16;
      if (i < S.wanted) this.copHead(ctx, x, 10, true);
      else this.copHead(ctx, x, 10, false);
    }
    // ---- corações + colete (esquerda) ----
    for (let i = 0; i < 5; i++) this.heart(ctx, 12, 14 + i * 14, i < Math.ceil(S.hp / 20));
    if (S.vest > 0) { ctx.fillStyle = '#4fa0d8'; ctx.fillRect(12, 14 + 5 * 14, 10, 8); ctx.fillStyle = '#2b6d9c'; ctx.fillRect(14, 16 + 5 * 14, 6, 4); }
    // ---- combustível ----
    if (S.inCar) {
      ctx.fillStyle = '#000'; ctx.fillRect(10, 108, 54, 10);
      ctx.fillStyle = S.fuel < 20 ? '#ff4040' : '#ffe14a';
      ctx.fillRect(12, 110, 50 * S.fuel / 100, 6);
      ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText('GAS', 66, 117);
    }
    // ---- rádio ----
    if (S.radio) { ctx.fillStyle = '#7fd87f'; ctx.font = 'bold 10px monospace'; ctx.fillText('♪ ' + S.radio, 12, 132); }
    // ---- rank ----
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '10px monospace';
    ctx.fillText(S.rank, 12, 590 - 56);

    // ---- seta amarela de destino ----
    if (S.target) {
      const dx = S.target.x - S.px, dy = S.target.y - S.py, d = Math.hypot(dx, dy);
      if (d > 60) {
        const a = Math.atan2(dy, dx);
        ctx.save(); ctx.translate(S.px - S.camx + Math.cos(a) * 46, S.py - S.camy + Math.sin(a) * 46); ctx.rotate(a);
        ctx.fillStyle = '#ffe14a';
        ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -7); ctx.lineTo(-2, 0); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      } else { // beacon no alvo
        const bx = S.target.x - S.camx, by = S.target.y - S.camy;
        ctx.strokeStyle = `rgba(255,225,74,${.5 + .4 * Math.sin(S.clock * 6)})`;
        ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bx, by, 26, 0, 7); ctx.stroke();
      }
    }
    // ---- minimapa ----
    WORLD.drawMinimap(ctx, 800 - 134, 600 - 134 - 52, { x: S.px, y: S.py }, S.target);

    // ---- rodapé amarelo (pager) ----
    const m = this.msgs[0];
    if (m || S.hint) {
      ctx.fillStyle = 'rgba(0,0,0,.82)'; ctx.fillRect(0, 600 - 34, 800, 34);
      // ícone do pager/celular
      ctx.fillStyle = '#9aa0ab'; ctx.fillRect(6, 600 - 30, 14, 26);
      ctx.fillStyle = '#39d353'; ctx.fillRect(8, 600 - 27, 10, 8);
      ctx.fillStyle = '#333'; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) ctx.fillRect(9 + c * 4, 600 - 17 + r * 4, 2, 2);
      ctx.fillStyle = '#ffe14a'; ctx.font = 'bold 13px monospace';
      const txt = m ? m.text : S.hint;
      ctx.fillText(txt.slice(0, 92), 30, 600 - 13);
    }
    // ---- letreiro grande ----
    if (this.bigText && this.bigT > 0) {
      ctx.font = 'bold 34px monospace'; ctx.textAlign = 'center';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 6;
      ctx.strokeText(this.bigText, 400, 200); ctx.fillStyle = '#ffe14a'; ctx.fillText(this.bigText, 400, 200);
      ctx.textAlign = 'left';
    }
    // ---- telas de estado ----
    if (this.overlay === 'start') this.startScreen(ctx);
    if (this.overlay === 'busted' || this.overlay === 'hospital') {
      ctx.fillStyle = this.overlay === 'busted' ? 'rgba(30,40,120,.55)' : 'rgba(160,30,30,.5)';
      ctx.fillRect(0, 0, 800, 600);
      ctx.font = 'bold 52px monospace'; ctx.textAlign = 'center';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 8;
      const t = this.overlay === 'busted' ? 'PRESO!' : 'HOSPITAL!';
      ctx.strokeText(t, 400, 290); ctx.fillStyle = '#fff'; ctx.fillText(t, 400, 290);
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#ffe14a';
      ctx.fillText(this.overlay === 'busted' ? 'Você perdeu parte do dinheiro...' : 'Você foi levado ao hospital... parte do dinheiro foi p/ as contas.', 400, 330);
      ctx.textAlign = 'left';
    }
    ctx.restore();
  },

  copHead(ctx, x, y, on) {
    ctx.globalAlpha = on ? 1 : .25;
    ctx.fillStyle = '#24409a'; ctx.fillRect(x, y, 12, 4);       // quepe
    ctx.fillStyle = '#e8c39a'; ctx.fillRect(x + 2, y + 4, 8, 6); // rosto
    ctx.fillStyle = '#111'; ctx.fillRect(x + 3, y + 6, 2, 2); ctx.fillRect(x + 7, y + 6, 2, 2);
    ctx.globalAlpha = 1;
  },
  heart(ctx, x, y, on) {
    ctx.fillStyle = on ? '#ff3b3b' : 'rgba(255,255,255,.2)';
    ctx.fillRect(x + 1, y, 3, 2); ctx.fillRect(x + 6, y, 3, 2);
    ctx.fillRect(x, y + 2, 10, 4); ctx.fillRect(x + 2, y + 6, 6, 2); ctx.fillRect(x + 4, y + 8, 2, 2);
  },

  startScreen(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,.86)'; ctx.fillRect(0, 0, 800, 600);
    if (!this.img) { this.img = new Image(); this.img.src = 'imagens/gta1-estilo-limpo.png'; }
    if (this.img.complete && this.img.width) {
      ctx.globalAlpha = .5; ctx.drawImage(this.img, 100, 40, 600, 338); ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'center';
    ctx.font = 'bold 46px monospace';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 7;
    ctx.strokeText('RUA VERMELHA', 400, 90); ctx.fillStyle = '#ff3b3b'; ctx.fillText('RUA VERMELHA', 400, 90);
    ctx.font = 'bold 14px monospace'; ctx.fillStyle = '#ffe14a';
    ctx.fillText('mundo aberto top-down estilo GTA 1/2 — Ribeirão Edition', 400, 116);
    ctx.fillStyle = '#fff'; ctx.font = '13px monospace';
    const L = [
      'A PÉ: WASD/setas anda • Shift corre • E entra no carro • Espaço empurrão',
      'DE CARRO: W/S acelera/ré • A/D esterça • Espaço freio de mão • E sai',
      'H buzina • R rádio • orelhões (amarelos) = missões • seta amarela = destino',
      'Zonas: GARAGEM guarda carro • OFICINA pinta/conserta (some a polícia)',
      'POSTO abastece • LOJA vende colete • AUTO LOTE vende carros',
      '',
      'Suba de MOTORISTA NOVATO a REI DA CIDADE. Sem sangue: é tudo brincadeira!',
    ];
    L.forEach((l, i) => ctx.fillText(l, 400, 412 + i * 20));
    ctx.fillStyle = Math.floor(performance.now() / 400) % 2 ? '#ffe14a' : '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('— APERTE QUALQUER TECLA —', 400, 578);
    ctx.textAlign = 'left';
  },
  update(dt) {
    if (this.msgs[0] && (this.msgs[0].t -= dt) <= 0) this.msgs.shift();
    if (this.bigT > 0) this.bigT -= dt; else this.bigText = null;
  }
};
