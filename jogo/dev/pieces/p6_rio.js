      // reflexos: traços horizontais claros (pixel art)
      ctx.fillStyle = 'rgba(190,225,255,0.22)';
      for (let k = 0; k < 70; k++) { const rx = x + ((k * 97) % w), ry = y + ((k * 61) % h); ctx.fillRect(Math.round(rx / 2) * 2, Math.round(ry / 2) * 2, 12, 2); }
      // profundidade em DEGRAUS (como curvas de nível): raso e esverdeado perto das margens, fundo e escuro no meio
      const faixa = (f0, f1, cor) => { ctx.fillStyle = cor; ctx.fillRect(x + Math.round(w * f0 / 2) * 2, y, Math.round(w * (f1 - f0) / 2) * 2, h); };
      faixa(0, 0.05, 'rgba(120,214,214,0.34)'); faixa(0.05, 0.10, 'rgba(120,214,214,0.20)'); faixa(0.10, 0.16, 'rgba(120,214,214,0.08)');
      faixa(0.95, 1, 'rgba(120,214,214,0.34)'); faixa(0.90, 0.95, 'rgba(120,214,214,0.20)'); faixa(0.84, 0.90, 'rgba(120,214,214,0.08)');
      faixa(0.30, 0.70, 'rgba(0,10,70,0.10)'); faixa(0.40, 0.60, 'rgba(0,10,70,0.10)'); faixa(0.46, 0.54, 'rgba(0,10,70,0.08)');
      const rg = mulberry32(blk.bx * 31 + blk.by * 7 + 5);
      // correnteza: traços curtos claros e escuros no sentido do rio
      for (let k = 0; k < 170; k++) {
        const sx = Math.round((x + 30 + rg() * (w - 60)) / 2) * 2, sy = Math.round((y + rg() * h) / 2) * 2, len = 8 + Math.floor(rg() * 6) * 2;
        ctx.fillStyle = rg() < 0.7 ? 'rgba(210,240,255,0.42)' : 'rgba(10,30,90,0.30)'; ctx.fillRect(sx, sy, 2, len);
      }
