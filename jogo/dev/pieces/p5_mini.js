  // mapa pequeno (minimapa): pintado direto dos tiles, bem rápido (o mapa é enorme)
  function makeMini(scale) {
    const cw = Math.ceil(W / scale), ch = Math.ceil(H / scale);
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const x = c.getContext('2d'), im = x.createImageData(cw, ch), d = im.data;
    const cor = { 0: [74, 69, 96], 6: [74, 69, 96], 5: [138, 138, 160], 1: [216, 207, 150], 2: [106, 90, 88], 3: [63, 127, 55], 4: [58, 106, 176], 7: [122, 122, 134] };
    for (let py = 0; py < ch; py++) {
      const ty = Math.min(TH - 1, Math.floor(py * scale / T));
      for (let px = 0; px < cw; px++) {
        const t = tiles[ty * TW + Math.min(TW - 1, Math.floor(px * scale / T))], k = cor[t] || [0, 0, 0], i = (py * cw + px) * 4;
        d[i] = k[0]; d[i + 1] = k[1]; d[i + 2] = k[2]; d[i + 3] = 255;
      }
    }
    x.putImageData(im, 0, 0);
    buildings.forEach(b => { x.fillStyle = b.p.base; (b.rects || [b]).forEach(r => x.fillRect(r.x / scale, r.y / scale, Math.max(1, r.w / scale), Math.max(1, r.h / scale))); });
    x.fillStyle = 'rgba(15,60,18,0.8)'; trees.forEach(t => { const r = Math.max(1.2, t.r / scale * 0.8); x.fillRect(t.x / scale - r, t.y / scale - r, r * 2, r * 2); });
    return c;
  }
