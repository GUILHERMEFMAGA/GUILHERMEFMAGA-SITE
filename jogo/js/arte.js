'use strict';
/* =========================================================
   Pré-renderização: cidade inteira em pixel art 2D plano,
   mapas de luz (postes laranja, neon) e minimapa.
   ========================================================= */

const Art = { world: null, light: null, bloom: null, minimap: null, reflections: [], beacons: [] };
const AMBIENT = [58, 66, 116];

function pcircle(g, cx, cy, r, color) {
  g.fillStyle = Array.isArray(color) ? rgb(...color) : color;
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35);
    g.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
  }
}

function renderWorld() {
  const c = makeCanvas(WORLD_W, WORLD_H);
  const g = ctx2d(c);
  const img = g.createImageData(WORLD_W, WORLD_H);
  const d = img.data;
  const nr = mulberry32(77);
  const NOISE = new Float32Array(256 * 256);
  for (let i = 0; i < NOISE.length; i++) NOISE[i] = nr();

  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      const t = tileAt(tx, ty);
      const th = hash2(tx, ty, 3);
      const waveOff = Math.floor(th * 16);
      for (let ly = 0; ly < T; ly++) {
        const py = ty * T + ly;
        let o = (py * WORLD_W + tx * T) * 4;
        for (let lx = 0; lx < T; lx++, o += 4) {
          const px = tx * T + lx;
          const n = NOISE[((py & 255) << 8) | (px & 255)];
          let R = 40, G = 40, B = 48;
          switch (t) {
            case TL.ROAD: case TL.BRIDGE: case TL.GARAGE: case TL.LOT: {
              if (t === TL.BRIDGE) { R = 46; G = 46; B = 56; if (px % 96 === 0) { R = 30; G = 30; B = 38; } }
              else if (t === TL.LOT) { R = 46; G = 48; B = 58; }
              else if (t === TL.GARAGE) { R = 60; G = 60; B = 66; }
              else { R = 40; G = 42; B = 53; }
              if (n < 0.07) { R += 9; G += 9; B += 9; } else if (n > 0.965) { R -= 7; G -= 7; B -= 7; }
              break;
            }
            case TL.ALLEY:
              R = 34; G = 34; B = 42;
              if (n < 0.08) { R += 8; G += 8; B += 8; } else if (n > 0.97) { R = 54; G = 48; B = 38; }
              break;
            case TL.SIDEWALK:
              R = 78; G = 76; B = 86;
              if ((px & 7) === 0 || (py & 7) === 0) { R = 64; G = 62; B = 72; }
              else if (n < 0.06) { R += 8; G += 8; B += 8; }
              break;
            case TL.PLAZA:
              R = 86; G = 80; B = 76;
              if ((px & 7) === 0 || (py & 7) === 0) { R = 70; G = 64; B = 62; }
              else if ((((px >> 3) + (py >> 3)) & 1) === 0) { R += 6; G += 6; B += 4; }
              if (n < 0.05) { R += 6; G += 6; B += 6; }
              break;
            case TL.GRASS: case TL.TREE:
              R = 28; G = 56; B = 36;
              if (n < 0.25) { R = 34; G = 66; B = 40; } else if (n > 0.86) { R = 22; G = 46; B = 30; }
              if (n > 0.992) { R = 96; G = 92; B = 140; }
              break;
            case TL.PATH:
              R = 88; G = 82; B = 70;
              if (n < 0.12) { R += 8; G += 8; B += 6; } else if (n > 0.9) { R -= 8; G -= 8; B -= 6; }
              break;
            case TL.WATER: case TL.RAIL:
              R = 16; G = 34; B = 78;
              if (n < 0.1) { R = 19; G = 40; B = 88; }
              if ((ly + waveOff) % 7 === 0 && ((lx + waveOff * 3) & 15) < 5) { R = 26; G = 50; B = 104; }
              break;
            case TL.QUAY:
              R = 64; G = 62; B = 68;
              if ((py & 3) === 0 || ((px + ((py >> 2) & 1) * 4) & 7) === 0) { R = 48; G = 46; B = 52; }
              if (n < 0.08) { R += 6; G += 6; B += 6; }
              break;
            case TL.DOCK:
              R = 86; G = 62; B = 40;
              if ((px & 3) === 0) { R = 62; G = 44; B = 28; }
              else if (n < 0.12) { R += 8; G += 6; B += 4; }
              if ((py % 24) === 0) { R = 58; G = 40; B = 26; }
              break;
            case TL.COURT:
              R = 36; G = 92; B = 74;
              if (n < 0.05) { R += 5; G += 5; B += 5; }
              break;
            case TL.FOUNTAIN:
              R = 86; G = 80; B = 76;
              break;
            default:
              R = 40; G = 40; B = 48;
          }
          d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = 255;
        }
      }
    }
  }
  g.putImageData(img, 0, 0);

  const fill = (x, y, w, h, col) => { g.fillStyle = Array.isArray(col) ? rgb(...col) : col; g.fillRect(x, y, w, h); };

  // --- Meio-fio ---
  for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) {
    const t = tileAt(tx, ty);
    if (t !== TL.SIDEWALK) continue;
    const X = tx * T, Y = ty * T;
    const isR = (x, y) => { const k = tileAt(x, y); return k === TL.ROAD || k === TL.BRIDGE; };
    if (isR(tx + 1, ty)) { fill(X + 15, Y, 1, T, [118, 116, 126]); fill(X + 14, Y, 1, T, [92, 90, 100]); }
    if (isR(tx - 1, ty)) { fill(X, Y, 1, T, [118, 116, 126]); fill(X + 1, Y, 1, T, [92, 90, 100]); }
    if (isR(tx, ty + 1)) { fill(X, Y + 15, T, 1, [118, 116, 126]); fill(X, Y + 14, T, 1, [92, 90, 100]); }
    if (isR(tx, ty - 1)) { fill(X, Y, T, 1, [118, 116, 126]); fill(X, Y + 1, T, 1, [92, 90, 100]); }
  }

  // --- Sinalização horizontal ---
  const plain = (x, y) => {
    const t = tileAt(x, y);
    return (t === TL.ROAD || t === TL.BRIDGE) && !(flagAt(x, y) & (F_CROSS | F_NODE));
  };
  const YEL = [204, 168, 52], WHT = [178, 178, 186];
  for (const v of VROADS) {
    for (let y = v.y0; y < v.y1; y++) {
      if (!plain(v.x, y) || !plain(v.x + 3, y)) continue;
      const X = v.x * T, Y = y * T;
      fill(X + 2 * T - 2, Y, 1, T, YEL); fill(X + 2 * T + 1, Y, 1, T, YEL);
      for (let k = 0; k < T; k++) if (((Y + k) % 14) < 7) { fill(X + T, Y + k, 1, 1, WHT); fill(X + 3 * T - 1, Y + k, 1, 1, WHT); }
    }
  }
  for (const h of HROADS) {
    for (let x = h.x0; x < h.x1; x++) {
      if (!plain(x, h.y) || !plain(x, h.y + 3)) continue;
      const X = x * T, Y = h.y * T;
      fill(X, Y + 2 * T - 2, T, 1, YEL); fill(X, Y + 2 * T + 1, T, 1, YEL);
      for (let k = 0; k < T; k++) if (((X + k) % 14) < 7) { fill(X + k, Y + T, 1, 1, WHT); fill(X + k, Y + 3 * T - 1, 1, 1, WHT); }
    }
  }
  // faixas de pedestre
  for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) {
    const f = flagAt(tx, ty);
    if (!(f & F_CROSS)) continue;
    const X = tx * T, Y = ty * T;
    if (f & F_CROSS_V) { for (let k = 1; k < T; k += 4) fill(X + k, Y + 2, 2, 12, [196, 196, 204]); }
    else { for (let k = 1; k < T; k += 4) fill(X + 2, Y + k, 12, 2, [196, 196, 204]); }
  }
  // linhas de retenção + setas
  for (const n of City.nodes) {
    const X = n.vx * T, Y = n.hy * T;
    if (n.exits[3]) fill(X + 1, Y - T - 3, 2 * T - 3, 2, [214, 214, 220]);
    if (n.exits[1]) fill(X + 2 * T + 2, Y + 5 * T + 1, 2 * T - 3, 2, [214, 214, 220]);
    if (n.exits[2]) fill(X - T - 3, Y + 2 * T + 2, 2, 2 * T - 3, [214, 214, 220]);
    if (n.exits[0]) fill(X + 5 * T + 1, Y + 1, 2, 2 * T - 3, [214, 214, 220]);
  }

  // --- Cais e grade da ponte ---
  for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) {
    const t = tileAt(tx, ty);
    const X = tx * T, Y = ty * T;
    if (t === TL.QUAY) {
      if (tileAt(tx + 1, ty) === TL.WATER) { fill(X + 15, Y, 1, T, [128, 126, 134]); fill(X + 16, Y, 1, T, [5, 10, 24]); }
      if (tileAt(tx - 1, ty) === TL.WATER) { fill(X, Y, 1, T, [128, 126, 134]); fill(X - 1, Y, 1, T, [5, 10, 24]); }
      if (tileAt(tx, ty + 1) === TL.WATER) { fill(X, Y + 15, T, 1, [128, 126, 134]); fill(X, Y + 16, T, 1, [5, 10, 24]); }
      if (tileAt(tx, ty - 1) === TL.WATER) { fill(X, Y, T, 1, [128, 126, 134]); fill(X, Y - 1, T, 1, [5, 10, 24]); }
    } else if (t === TL.RAIL) {
      const north = ty === BRIDGE_Y - 1;
      const by = north ? Y + 11 : Y;
      fill(X, by, T, 5, [66, 66, 78]);
      fill(X, north ? by : by + 4, T, 1, [146, 146, 158]);
      fill(X, north ? by + 4 : by, T, 1, [40, 40, 50]);
      for (let k = 0; k < T; k += 8) fill(X + k, by + 1, 2, 3, [96, 96, 108]);
      fill(X, north ? Y + 16 : Y + 5, T, 1, [5, 10, 24]);
    } else if (t === TL.DOCK) {
      if (tileAt(tx, ty - 1) === TL.WATER) fill(X, Y, T, 1, [120, 92, 60]);
      if (tileAt(tx, ty + 1) === TL.WATER) { fill(X, Y + 15, T, 1, [50, 36, 22]); fill(X, Y + 16, T, 1, [5, 10, 24]); }
      if (tileAt(tx + 1, ty) === TL.WATER) fill(X + 15, Y, 1, T, [50, 36, 22]);
      if ((tx + ty) % 3 === 0 && (tileAt(tx, ty - 1) === TL.WATER || tileAt(tx, ty + 1) === TL.WATER)) {
        const py = tileAt(tx, ty - 1) === TL.WATER ? Y + 1 : Y + 12;
        fill(X + 6, py, 3, 3, [44, 32, 22]);
      }
    }
  }

  // --- Prédios ---
  for (const b of City.buildings) drawBuilding(g, b);

  // --- Garagem de pintura ---
  if (City.garage) {
    const gg = City.garage;
    fill(gg.x0, gg.y0, gg.x1 - gg.x0, gg.y1 - gg.y0, [58, 58, 64]);
    for (let y = gg.y0; y < gg.y1; y += 6) fill(gg.x0 + 2, y + 2, gg.x1 - gg.x0 - 4, 1, [70, 70, 78]);
    for (let y = gg.y0; y < gg.y1; y += 4) fill(gg.x1 - 3, y, 3, 2, ((y / 4) & 1) ? [230, 190, 40] : [30, 30, 30]);
    fill(gg.x0, gg.y0, 2, gg.y1 - gg.y0, [30, 30, 36]);
    fill(gg.x0, gg.y0, gg.x1 - gg.x0, 2, [30, 30, 36]);
    fill(gg.x0, gg.y1 - 2, gg.x1 - gg.x0, 2, [30, 30, 36]);
  }

  // --- Estacionamentos ---
  const lotLines = (lot, step, vertical) => {
    if (!lot) return;
    const X0 = lot.x0 * T, Y0 = lot.y0 * T, X1 = (lot.x1 + 1) * T, Y1 = (lot.y1 + 1) * T;
    if (vertical) {
      for (let x = X0 + 4; x < X1 - 4; x += step) { fill(x, Y0 + 3, 1, 26, [190, 190, 196]); fill(x, Y1 - 29, 1, 26, [190, 190, 196]); }
    } else {
      for (let y = Y0 + 4; y < Y1 - 4; y += step) fill(X0 + 3, y, 30, 1, [190, 190, 196]);
    }
  };
  lotLines(City.policeLot, 4 * T, true);
  lotLines(City.portLot, 3 * T, true);
  if (City.parkLot) lotLines({ x0: City.parkLot.x0, y0: City.parkLot.y0, x1: City.parkLot.x0 + 2, y1: City.parkLot.y1 }, 2 * T - 4, false);
  if (City.portGarage) {
    const p = City.portGarage;
    g.strokeStyle = 'rgb(230,190,40)';
    for (let k = 0; k < 2; k++) fill(p.x - 22 + k, p.y - 14 + k, 44 - 2 * k, 1, [230, 190, 40]);
    fill(p.x - 22, p.y + 13, 44, 1, [230, 190, 40]); fill(p.x - 22, p.y - 14, 1, 28, [230, 190, 40]); fill(p.x + 21, p.y - 14, 1, 28, [230, 190, 40]);
    drawText3(g, 'PORTO', p.x - text3Width('PORTO', 1) / 2, p.y - 3, 1, 'rgb(230,190,40)');
  }

  // --- Parque: quadra e bancos ---
  if (City.court) {
    const ct = City.court;
    const X0 = ct.x0 * T + 3, Y0 = ct.y0 * T + 3, X1 = (ct.x1 + 1) * T - 3, Y1 = (ct.y1 + 1) * T - 3;
    const W = [220, 230, 226];
    fill(X0, Y0, X1 - X0, 1, W); fill(X0, Y1, X1 - X0 + 1, 1, W); fill(X0, Y0, 1, Y1 - Y0, W); fill(X1, Y0, 1, Y1 - Y0, W);
    const my = Math.floor((Y0 + Y1) / 2), mx = Math.floor((X0 + X1) / 2);
    fill(X0, my, X1 - X0, 1, W);
    g.strokeStyle = rgb(...W);
    for (let a = 0; a < 64; a++) { const an = a / 64 * Math.PI * 2; fill(Math.round(mx + Math.cos(an) * 8), Math.round(my + Math.sin(an) * 8), 1, 1, W); }
    fill(mx - 8, Y0, 1, 22, W); fill(mx + 8, Y0, 1, 22, W); fill(mx - 8, Y0 + 22, 17, 1, W);
    fill(mx - 8, Y1 - 22, 1, 22, W); fill(mx + 8, Y1 - 22, 1, 22, W); fill(mx - 8, Y1 - 22, 17, 1, W);
    fill(mx - 2, Y0 + 1, 5, 2, [240, 120, 40]); fill(mx - 2, Y1 - 2, 5, 2, [240, 120, 40]);
  }
  for (const b of City.benches) {
    if (tileAt(Math.floor(b.x / T), Math.floor(b.y / T)) === TL.TREE) continue;
    if (b.vertical) { fill(b.x, b.y, 3, 9, [100, 70, 44]); fill(b.x, b.y, 1, 9, [70, 48, 30]); }
    else { fill(b.x, b.y, 9, 3, [100, 70, 44]); fill(b.x, b.y, 9, 1, [70, 48, 30]); }
  }

  // --- Chafariz ---
  if (City.fountain) {
    const f = City.fountain;
    pcircle(g, f.x, f.y, 15, [112, 108, 116]);
    pcircle(g, f.x, f.y, 13, [24, 64, 120]);
    pcircle(g, f.x, f.y, 4, [124, 120, 128]);
    pcircle(g, f.x, f.y, 2, [80, 150, 220]);
  }

  // --- Árvores ---
  for (const t of City.trees) drawTree(g, t);

  // --- Postes ---
  for (const l of City.lamps) {
    const X = Math.round(l.x), Y = Math.round(l.y);
    fill(X - 1, Y - 1, 3, 3, [30, 30, 36]);
    fill(X, Y, 1, 1, [60, 60, 70]);
    if (l.kind === 'street') {
      const [dx, dy] = DIRS[l.dir];
      for (let k = 1; k <= 3; k++) fill(X + dx * k, Y + dy * k, 1, 1, [44, 44, 52]);
      l.bx = X + dx * 4; l.by = Y + dy * 4;
    } else { l.bx = X; l.by = Y; }
    fill(l.bx - 1, l.by - 1, 2, 2, [255, 214, 150]);
  }

  // --- Orelhões ---
  for (const p of City.phones) {
    fill(p.x - 3, p.y - 4, 7, 8, [26, 60, 140]);
    fill(p.x - 2, p.y - 3, 5, 3, [90, 150, 230]);
    fill(p.x - 3, p.y + 3, 7, 1, [16, 30, 70]);
  }

  return c;
}

function drawBuilding(g, b) {
  const rr = mulberry32(b.seed);
  const ri = (a, c) => a + Math.floor(rr() * (c - a + 1));
  const X = b.x * T, Y = b.y * T, W = b.w * T, H = b.h * T;
  const fill = (x, y, w, h, col) => { g.fillStyle = Array.isArray(col) ? rgb(...col) : col; g.fillRect(x, y, w, h); };
  const base = b.color;

  const roofRect = (x, y, w, h, col, lip) => {
    fill(x, y, w, h, col);
    fill(x, y, w, lip, tint(col, 20)); fill(x, y + h - lip, w, lip, tint(col, 12));
    fill(x, y, lip, h, tint(col, 18)); fill(x + w - lip, y, lip, h, tint(col, 12));
    fill(x + lip, y + lip, w - lip * 2, 1, shade(col, 0.78));
    fill(x + lip, y + lip, 1, h - lip * 2, shade(col, 0.8));
  };
  roofRect(X, Y, W, H, base, 2);
  // textura
  const n = Math.floor(W * H / 30);
  for (let i = 0; i < n; i++) fill(X + ri(3, W - 4), Y + ri(3, H - 4), 1, 1, tint(base, rr() < 0.5 ? 7 : -7));

  if (b.kind === 'police') {
    fill(X + 4, Y + 4, W - 8, 3, [210, 210, 220]);
    fill(X + 4, Y + H - 7, W - 8, 3, [210, 210, 220]);
    const label = 'POLICIA';
    drawText3(g, label, X + (W - text3Width(label, 3)) / 2, Y + H / 2 - 7, 3, 'rgb(236,236,244)');
    // heliponto
    pcircle(g, X + 22, Y + H / 2, 14, [60, 70, 100]);
    drawText3(g, 'H', X + 19, Y + H / 2 - 5, 2, 'rgb(240,210,60)');
    for (let i = 0; i < 4; i++) Art.beacons.push({ x: X + 6 + i * (W - 12) / 3, y: Y + 3, c: i % 2 ? [60, 110, 255] : [255, 50, 60], ph: i });
    return;
  }
  if (b.kind === 'hospital') {
    const cx = X + W / 2, cy = Y + H / 2;
    fill(cx - 22, cy - 7, 44, 14, [214, 40, 50]);
    fill(cx - 7, cy - 22, 14, 44, [214, 40, 50]);
    pcircle(g, X + 26, Y + 26, 18, [150, 150, 160]);
    pcircle(g, X + 26, Y + 26, 16, [176, 176, 186]);
    drawText3(g, 'H', X + 22, Y + 21, 3, 'rgb(214,40,50)');
    pcircle(g, X + W - 26, Y + H - 24, 6, [120, 124, 132]);
    for (let i = 0; i < 6; i++) fill(X + W - 60 + i * 6, Y + 8, 4, 6, [120, 124, 132]);
    Art.beacons.push({ x: X + 4, y: Y + 4, c: [255, 50, 60], ph: 0 }, { x: X + W - 5, y: Y + 4, c: [255, 50, 60], ph: 1 });
    return;
  }
  if (b.kind === 'garage') {
    for (let x = X + 2; x < X + W - 2; x += 6) fill(x, Y + 2, 3, 3, [230, 190, 40]);
    drawText3(g, 'PINTURA', X + (W - text3Width('PINTURA', 1)) / 2, Y + 10, 1, 'rgb(255,120,200)');
    City.neons.push({ x: X + 8, y: Y + H - 4, w: W - 16, h: 2, c: [255, 90, 200], flicker: false, ph: 0 });
    return;
  }

  const inner = { x: X + 4, y: Y + 4, w: W - 8, h: H - 8 };
  // seção elevada (só cor, sem perspectiva)
  if (b.w >= 5 && b.h >= 5 && rr() < 0.65) {
    const w = Math.floor(inner.w * (0.35 + rr() * 0.35));
    const h = Math.floor(inner.h * (0.35 + rr() * 0.35));
    const x = inner.x + ri(0, inner.w - w), y = inner.y + ri(0, inner.h - h);
    roofRect(x, y, w, h, tint(base, rr() < 0.5 ? 10 : -8), 2);
  }
  const area = (inner.w * inner.h) / (T * T);
  const items = Math.max(2, Math.floor(area * (0.5 + rr() * 0.6)));
  const rx = (w) => inner.x + ri(0, Math.max(0, inner.w - w));
  const ry = (h) => inner.y + ri(0, Math.max(0, inner.h - h));
  // painéis solares
  if (area > 18 && rr() < 0.35) {
    const cols = ri(3, 6), rows = ri(2, 3);
    const x0 = rx(cols * 5), y0 = ry(rows * 4);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      fill(x0 + i * 5, y0 + j * 4, 4, 3, [38, 56, 108]);
      fill(x0 + i * 5, y0 + j * 4, 4, 1, [70, 96, 160]);
    }
  }
  for (let i = 0; i < items; i++) {
    const k = rr();
    if (k < 0.32) { // ar-condicionado
      const x = rx(7), y = ry(6);
      fill(x, y, 7, 6, [80, 84, 94]); fill(x + 1, y + 1, 5, 4, [124, 128, 136]);
      fill(x + 2, y + 2, 3, 2, [44, 46, 52]); fill(x + 3, y + 2, 1, 1, [150, 154, 160]);
    } else if (k < 0.48) { // respiro
      const x = rx(4), y = ry(4);
      fill(x, y, 4, 4, [30, 30, 36]); fill(x + 1, y + 1, 2, 2, [56, 56, 64]);
    } else if (k < 0.6) { // caixa d'água
      const x = rx(10) + 5, y = ry(10) + 5;
      pcircle(g, x, y, 4, [82, 64, 50]); pcircle(g, x, y, 3, [112, 88, 64]); fill(x, y, 1, 1, [60, 46, 36]);
    } else if (k < 0.72) { // claraboia acesa
      const lit = rr() < 0.7;
      const v = rr() < 0.5;
      const w = v ? 4 : 8, h = v ? 8 : 4;
      const x = rx(w), y = ry(h);
      fill(x - 1, y - 1, w + 2, h + 2, [40, 40, 46]);
      fill(x, y, w, h, lit ? [255, 200, 120] : [40, 52, 74]);
      if (lit) { fill(x, y, w, 1, [255, 232, 180]); City.skylights.push({ x: x + w / 2, y: y + h / 2 }); }
    } else if (k < 0.82) { // casa de máquinas
      const w = ri(8, 14), h = ri(6, 10);
      const x = rx(w), y = ry(h);
      roofRect(x, y, w, h, tint(base, 16), 1);
      fill(x + 2, y + h - 2, 3, 1, [30, 30, 36]);
    } else if (k < 0.9) { // alçapão
      const x = rx(6), y = ry(6);
      fill(x, y, 6, 6, [50, 50, 56]); fill(x + 1, y + 1, 4, 4, [86, 86, 94]);
      for (let q = 1; q < 5; q++) fill(x + q, y + q, 1, 1, [50, 50, 56]);
    } else { // antena com luz vermelha
      const x = rx(3) + 1, y = ry(3) + 1;
      fill(x - 1, y - 1, 3, 3, [36, 36, 40]); fill(x, y, 1, 1, [255, 60, 60]);
      Art.beacons.push({ x, y, c: [255, 50, 50], ph: rr() * 6 });
    }
  }
}

function drawTree(g, t) {
  const r = t.r;
  const rr = mulberry32(t.seed);
  pcircle(g, t.x + 1, t.y + 1, r, [14, 30, 20]);
  pcircle(g, t.x, t.y, r, [22, 50, 30]);
  pcircle(g, t.x - 1, t.y - 1, r - 2, [32, 70, 38]);
  for (let i = 0; i < 4; i++) {
    const a = rr() * Math.PI * 2, d = rr() * (r - 3);
    pcircle(g, Math.round(t.x - 1 + Math.cos(a) * d), Math.round(t.y - 1 + Math.sin(a) * d), Math.max(1, Math.floor(r / 3)), [44, 90, 48]);
  }
  for (let i = 0; i < 5; i++) {
    g.fillStyle = rgb(70, 124, 66);
    g.fillRect(Math.round(t.x - 2 + (rr() - 0.7) * r), Math.round(t.y - 2 + (rr() - 0.7) * r), 1, 1);
  }
}

/* ---------- Mapas de luz ---------- */
function buildLightMaps() {
  const L = makeCanvas(WORLD_W, WORLD_H);
  const lg = L.getContext('2d');
  lg.fillStyle = '#000'; lg.fillRect(0, 0, WORLD_W, WORLD_H);
  lg.globalCompositeOperation = 'lighter';
  const B = makeCanvas(WORLD_W, WORLD_H);
  const bg = B.getContext('2d');
  bg.globalCompositeOperation = 'lighter';

  const lampGlow = glowSprite(255, 150, 56, 76, 1, 0.4);
  const lampGlowSmall = glowSprite(255, 156, 64, 58, 1, 0.38);
  const lampCore = glowSprite(255, 190, 110, 13, 1, 0.35);
  for (const l of City.lamps) {
    if (l.broken) continue;
    const s = (l.kind === 'street') ? lampGlow : lampGlowSmall;
    lg.drawImage(s, Math.round(l.bx - s.width / 2), Math.round(l.by - s.height / 2));
    bg.drawImage(lampCore, Math.round(l.bx - 10), Math.round(l.by - 10));
  }
  const sky = glowSprite(255, 190, 110, 12, 0.6);
  for (const s of City.skylights) lg.drawImage(sky, Math.round(s.x - 12), Math.round(s.y - 12));
  for (const n of City.neons) {
    const gs = glowSprite(n.c[0], n.c[1], n.c[2], 16, 0.55);
    const steps = Math.max(1, Math.floor(Math.max(n.w, n.h) / 8));
    for (let i = 0; i <= steps; i++) {
      const x = n.x + (n.w > n.h ? (n.w * i) / steps : n.w / 2);
      const y = n.y + (n.h >= n.w ? (n.h * i) / steps : n.h / 2);
      lg.drawImage(gs, Math.round(x - 16), Math.round(y - 16));
    }
  }
  for (const p of City.phones) lg.drawImage(glowSprite(110, 170, 255, 14, 0.6), p.x - 14, p.y - 14);
  if (City.garage) {
    const gg = City.garage;
    lg.drawImage(glowSprite(200, 220, 255, 30, 0.7), (gg.x0 + gg.x1) / 2 - 30, (gg.y0 + gg.y1) / 2 - 30);
  }
  if (City.fountain) {
    lg.drawImage(glowSprite(90, 170, 255, 26, 0.7), City.fountain.x - 26, City.fountain.y - 26);
    bg.drawImage(glowSprite(60, 130, 255, 12, 0.4), City.fountain.x - 12, City.fountain.y - 12);
  }
  if (City.court) {
    const c = City.court;
    lg.drawImage(glowSprite(220, 230, 255, 48, 0.4), ((c.x0 + c.x1 + 1) / 2) * T - 48, ((c.y0 + c.y1 + 1) / 2) * T - 48);
  }

  // posteriza levemente para ficar com cara de pixel art
  const id = lg.getImageData(0, 0, WORLD_W, WORLD_H);
  const dd = id.data;
  for (let i = 0; i < dd.length; i += 4) {
    dd[i] = Math.min(255, Math.round(dd[i] / 14) * 14 + AMBIENT[0]);
    dd[i + 1] = Math.min(255, Math.round(dd[i + 1] / 14) * 14 + AMBIENT[1]);
    dd[i + 2] = Math.min(255, Math.round(dd[i + 2] / 14) * 14 + AMBIENT[2]);
    dd[i + 3] = 255;
  }
  lg.putImageData(id, 0, 0);

  // reflexos na água (postes da ponte e do cais)
  for (const l of City.lamps) {
    if (l.kind === 'bridgeN') Art.reflections.push({ x: l.bx, y: l.by - 26, v: true, ph: l.ph });
    else if (l.kind === 'bridgeS') Art.reflections.push({ x: l.bx, y: l.by + 22, v: true, ph: l.ph });
    else if (l.kind === 'quayW') Art.reflections.push({ x: l.bx + 30, y: l.by, v: false, ph: l.ph });
    else if (l.kind === 'quayE') Art.reflections.push({ x: l.bx - 30, y: l.by, v: false, ph: l.ph });
    else if (l.kind === 'pier') Art.reflections.push({ x: l.bx, y: l.by + (l.by % T < 8 ? -16 : 16), v: true, ph: l.ph });
  }

  Art.light = L;
  Art.bloom = B;
}

function buildMinimap() {
  const c = makeCanvas(MAP_W, MAP_H);
  const g = ctx2d(c);
  const img = g.createImageData(MAP_W, MAP_H);
  const col = {
    [TL.ROAD]: [96, 96, 110], [TL.BRIDGE]: [110, 110, 124], [TL.SIDEWALK]: [58, 58, 70], [TL.BUILDING]: [28, 28, 40],
    [TL.GRASS]: [26, 70, 36], [TL.TREE]: [22, 58, 30], [TL.PATH]: [74, 68, 58], [TL.PLAZA]: [74, 68, 62],
    [TL.WATER]: [14, 34, 80], [TL.QUAY]: [52, 52, 60], [TL.RAIL]: [90, 90, 100], [TL.DOCK]: [90, 66, 42],
    [TL.ALLEY]: [40, 40, 50], [TL.LOT]: [52, 52, 64], [TL.GARAGE]: [140, 60, 120], [TL.COURT]: [30, 90, 64], [TL.FOUNTAIN]: [60, 120, 200],
  };
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const k = col[tileAt(x, y)] || [20, 20, 30];
    const o = (y * MAP_W + x) * 4;
    img.data[o] = k[0]; img.data[o + 1] = k[1]; img.data[o + 2] = k[2]; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  Art.minimap = c;
}

function buildArt() {
  Art.beacons = [];
  Art.reflections = [];
  Art.world = renderWorld();
  buildLightMaps();
  buildMinimap();
}
