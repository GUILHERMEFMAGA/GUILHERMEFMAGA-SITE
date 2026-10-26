  // água de pixel art: azul liso com ondinhas horizontais em 3 tons (sem pontilhado transparente)
  function makeAgua() {
    const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d'); x.fillStyle = '#2a58a0'; x.fillRect(0, 0, S, S);
    const r = mulberry32(2121), tons = ['#1f4084', '#3f7ac8', '#3069b4'];
    for (let k = 0; k < 190; k++) {
      const q = r(); x.fillStyle = q < 0.4 ? tons[0] : q < 0.75 ? tons[1] : tons[2];
      const w = 6 + Math.floor(r() * 5) * 2, px = Math.floor(r() * S / 2) * 2, py = Math.floor(r() * S / 2) * 2;
      for (const ox of [-S, 0]) x.fillRect(px + ox, py, w, 2);   // repete na borda para a textura emendar
    }
    return c;
  }
  // asfalto de pixel art: cor lisa + pontinhos em blocos de 2x2 com 3 tons (sem manchas macias nem meio-tom,
  // porque a paleta fixa "pisca" entre cores quando o degradê é muito fraquinho)
  function makeAsfalto() {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d'); x.fillStyle = '#625889'; x.fillRect(0, 0, S, S);
    const r = mulberry32(5200), tons = ['#5a5080', '#6a5f92', '#554b7a'];
    for (let k = 0; k < 1400; k++) {
      const q = r(); x.fillStyle = q < 0.42 ? tons[0] : q < 0.78 ? tons[1] : tons[2];
      x.fillRect(Math.floor(r() * S / 2) * 2, Math.floor(r() * S / 2) * 2, r() < 0.25 ? 4 : 2, 2);
    }
    return c;
  }
  function makeTextures() {
    tex.asphalt = makeAsfalto();
    tex.rim = makeNoise('#3b3442', 1200, 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0.12)');
    tex.grass = makeNoise('#4a9038', 2600, 'rgba(190,255,150,0.16)', 'rgba(0,50,0,0.2)', 128,
      [['rgba(20,80,20,0.06)', 18, 6, 18], ['rgba(180,230,110,0.05)', 14, 6, 16]]);
    { // fios de grama
      const g = tex.grass.getContext('2d'), r = mulberry32(4242);
      for (let k = 0; k < 420; k++) { g.strokeStyle = r() < 0.5 ? 'rgba(200,255,140,0.35)' : 'rgba(10,60,10,0.35)'; g.lineWidth = 1; const gx = r() * 128, gy = r() * 128; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + (r() - 0.5) * 3, gy - 2 - r() * 3); g.stroke(); }
    }
    tex.water = makeAgua();
    tex.terra = makeNoise('#8c6e49', 1400, 'rgba(210,170,110,0.22)', 'rgba(60,40,20,0.25)', 128, [['rgba(110,80,48,0.35)', 12, 10, 28], ['rgba(170,140,95,0.25)', 8, 8, 20]]);
    tex.alley = makeNoise('#59505f', 700, 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0.12)');
    { // cascalho do telhado (transparente, vai por cima da cor do telhado)
      const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = mulberry32(99);
      for (let k = 0; k < 1100; k++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.16)'; g.fillRect(Math.floor(r() * 128), Math.floor(r() * 128), 1 + (r() < 0.3 ? 1 : 0), 1); }
      tex.gravel = c;
    }
    { // lajotas da calçada: sujeira e rachaduras
      const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = mulberry32(7);
      for (let k = 0; k < 500; k++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.14)' : 'rgba(90,70,30,0.12)'; g.fillRect(Math.floor(r() * 128), Math.floor(r() * 128), 1 + (r() < 0.3 ? 1 : 0), 1); }
      tex.paving = c;
    }
  }

