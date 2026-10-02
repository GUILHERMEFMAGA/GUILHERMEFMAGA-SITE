/* =========================================================================
   LIFE: CIDADE VIVA — world.js
   Geração procedural da cidade, grafo viário, calçadas, interiores,
   mapa-múndi renderizado e consultas espaciais.
   ========================================================================= */
(function () {
  'use strict';
  const LIFE = window.LIFE, U = LIFE.Util, D = LIFE.DATA, C = LIFE.CONFIG;

  /* ---------------- tipos de tile ---------------- */
  const TT = LIFE.TT = {
    GRASS: 0, ROAD: 1, SIDEWALK: 2, CROSSWALK: 3, WATER: 4, SAND: 5, FOREST: 6,
    PLAZA: 7, PATH: 8, LOT: 9, BRIDGE: 10, FIELD: 11, RUNWAY: 12, CONCRETE: 13, PIER: 14
  };
  const WALKABLE = { 0: 1, 2: 1, 3: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1, 12: 1, 13: 1, 14: 1 };
  // onde pedestres circulam de verdade: calçadas, travessias, praças, caminhos, pontes e areia
  const PED_TILES = { 2: 1, 3: 1, 7: 1, 8: 1, 9: 1, 10: 1, 12: 1, 13: 1, 14: 1, 5: 1, 1: 1 };
  const DRIVABLE = { 1: 1, 3: 1, 10: 1 };

  /* ---------------- geometria da cidade ---------------- */
  function layout(seed) {
    const M = 3, BLK = C.BLOCKS, BLKIN = C.BLOCK;
    const vRoads = [], hRoads = [], blocks = [];
    let pos = M;
    for (let i = 0; i <= BLK; i++) {
      const w = (i % C.AVENUE_EVERY === 0) ? C.AVENUE_W : C.ROAD_W;
      vRoads.push({ i, x: pos, w, avenue: (i % C.AVENUE_EVERY === 0) });
      pos += w;
      if (i < BLK) { blocks.push({ ci: i, x: pos, size: BLKIN }); }
      pos += BLKIN;
    }
    const W = pos + M;
    // mesma lógica no eixo Y (usando semente para variar quais são avenidas)
    const rnd = U.rngOf(seed, 'layout');
    const vAvenueSet = {}, hAvenueSet = {};
    for (let i = 0; i <= BLK; i++) {
      vAvenueSet[i] = (i % C.AVENUE_EVERY === 0) || rnd() < .08;
      hAvenueSet[i] = (i % C.AVENUE_EVERY === 0) || rnd() < .08;
    }
    function axis(set) {
      const roads = [], arr = [];
      let p = M;
      for (let i = 0; i <= BLK; i++) {
        const av = set[i];
        const w = av ? C.AVENUE_W : C.ROAD_W;
        roads.push({ i, pos: p, w, avenue: av });
        p += w;
        if (i < BLK) arr.push({ i, pos: p, size: BLKIN });
        p += BLKIN;
      }
      return { roads, arr, end: p + M };
    }
    const V = axis(vAvenueSet), H = axis(hAvenueSet);
    const size = Math.max(V.end, H.end);
    blocks.length = 0;
    for (const bv of V.arr) for (const bh of H.arr) {
      blocks.push({ bx: bv.i, by: bh.i, x: bv.pos, y: bh.pos, w: bv.size, h: bh.size });
    }
    return { W: size, H: size, vRoads: V.roads, hRoads: H.roads, blocks, margin: M, nBlocks: BLK };
  }

  /* ---------------- mapa de zonas (5x5 sobre os quarteirões) ---------------- */
  const ZONE_GRID = [
    ['FOREST', 'FOREST', 'RURAL', 'SUBURB', 'SUBURB'],
    ['FOREST', 'RESIDENTIAL', 'RESIDENTIAL', 'SUBURB', 'AIRPORT'],
    ['RURAL', 'RESIDENTIAL', 'DOWNTOWN', 'COMMERCIAL', 'PORT'],
    ['INDUSTRIAL', 'RESIDENTIAL', 'COMMERCIAL', 'COMMERCIAL', 'PORT'],
    ['INDUSTRIAL', 'INDUSTRIAL', 'BEACH', 'BEACH', 'BEACH']
  ];
  // padrões de lote (lots) por zona: [{kind, arranjo}]
  const ZONE_PATTERNS = {
    RESIDENTIAL: [['houses', '#'], ['houses2', '#'], ['apartments', ''], ['mixed_small', '']],
    SUBURB: [['houses2', '#'], ['houses', '#'], ['condos', ''], ['school_block', '']],
    DOWNTOWN: [['towers', ''], ['offices', ''], ['bank_block', ''], ['mixed_tower', '']],
    COMMERCIAL: [['shops', ''], ['mall_block', ''], ['supermarket_block', ''], ['restaurants', ''], ['mixed_comm', '']],
    INDUSTRIAL: [['factories', ''], ['warehouses', ''], ['garages', ''], ['big_industrial', '']],
    RURAL: [['farms', ''], ['forest_plot', ''], ['farm_small', '']],
    PORT: [['docks', ''], ['warehouses', ''], ['docks', '']],
    AIRPORT: [['airport_block', ''], ['airport_block', '']],
    BEACH: [['beach_hotels', ''], ['beach_shops', '']],
    PARK: [['park_block', '']],
    FOREST: [['forest_plot', ''], ['forest_cabin', ''], ['forest_plot', '']]
  };

  /* ===================================================================== */
  LIFE.World = class World {
    constructor(seed) {
      this.seed = String(seed || C.SEED);
      this.rnd = U.rngOf(this.seed, 'world');
      this.props = [];
      this.buildings = [];
      this.districts = [];
      this.businesses = [];
      this.pois = new Map();
      this.time = 0;
      this.generate();
    }

    idx(x, y) { return (y | 0) * this.W + (x | 0); }
    inBounds(x, y) { return x >= 0 && y >= 0 && x < this.W && y < this.H; }
    tile(x, y) { return this.inBounds(x, y) ? this.tiles[this.idx(x, y)] : TT.WATER; }
    setTile(x, y, t) { if (this.inBounds(x, y)) this.tiles[this.idx(x, y)] = t; }
    isWalkable(tx, ty) {
      if (!this.inBounds(tx, ty)) return false;
      if (!WALKABLE[this.tiles[this.idx(tx, ty)]]) return false;
      const b = this.buildingAt(tx, ty);
      return !(b && b.solid !== false);
    }
    isRoad(tx, ty) { return DRIVABLE[this.tile(tx, ty)] === 1; }
    // pedestres preferem calçada (podem atravessar rua), evitam grama e mato
    isPedWalkable(tx, ty) {
      if (!this.inBounds(tx, ty)) return false;
      if (this.tiles[this.idx(tx, ty)] === TT.ROAD) return true;   // travessia
      if (!PED_TILES[this.tiles[this.idx(tx, ty)]]) return false;
      const b = this.buildingAt(tx, ty);
      return !(b && b.solid !== false);
    }
    buildingAt(tx, ty) {
      const key = (tx | 0) + ',' + (ty | 0);
      return this.pois.has(key) ? this.pois.get(key) : null;
    }

    /* -------------------------------------------------------------- */
    generate() {
      const L = layout(this.seed);
      this.W = L.W; this.H = L.H;
      this.layoutInfo = L;
      this.tiles = new Uint8Array(this.W * this.H);
      this.noise = U.makeNoise(U.hash(this.seed + 'terrain'));

      // 1. base: grama
      this.tiles.fill(TT.GRASS);

      // 2. distritos por quarteirão
      this.zoneOfBlock = {};
      const nb = L.nBlocks;
      for (const b of L.blocks) {
        const gi = U.clamp(Math.floor((b.by / nb) * 5), 0, 4);
        const gj = U.clamp(Math.floor((b.bx / nb) * 5), 0, 4);
        let zone = ZONE_GRID[gi][gj];
        // quarteirão central vira parque
        if (b.bx === Math.floor(nb / 2) - 1 && (b.by === Math.floor(nb / 2) - 2 || b.by === Math.floor(nb / 2) - 1)) zone = 'PARK';
        if (b.bx === Math.floor(nb / 2) && b.by === Math.floor(nb / 2) - 2) zone = 'PARK';
        b.zone = zone;
        this.zoneOfBlock[b.bx + ':' + b.by] = zone;
      }

      // 3. terrenos naturais primeiro (floresta, areia, água)
      this.paintNature(L);

      // 4. ruas, calçadas e cruzamentos
      this.paintRoads(L);

      // 5. canal com pontes (rio vertical) e orla
      this.paintRiver(L);
      // 5b. restaura a orla (garante que nenhuma rua invada a praia)
      this.paintCoast();

      // 6. distritos (para nomes/zonas) e prédios
      this.buildDistricts(L);
      this.placeBuildings(L);

      // 7. props (árvores, postes, bancos...)
      this.placeProps(L);

      // 8. grafos
      this.buildRoadGraph(L);
      this.buildWalkGraph();

      // 9. mapa renderizado
      this.paintMapCanvases();
      return this;
    }

    /* ---------------- natureza ---------------- */
    paintNature(L) {
      const n = this.noise, rnd = this.rnd;
      for (let y = 0; y < this.H; y++) {
        for (let x = 0; x < this.W; x++) {
          const gi = U.clamp(Math.floor((y / this.H) * 5), 0, 4);
          const gj = U.clamp(Math.floor((x / this.W) * 5), 0, 4);
          const zone = ZONE_GRID[gi][gj];
          const v = n(x * .035, y * .035);
          if (zone === 'FOREST') {
            if (v > .34) this.setTile(x, y, TT.FOREST);
          } else if (zone === 'RURAL') {
            if (v > .62) this.setTile(x, y, TT.FOREST);
            else this.setTile(x, y, TT.FIELD);
          }
        }
      }
      // bordas: oeste/sul viram floresta natural
      for (let y = 0; y < this.H; y++) for (let x = 0; x < L.margin; x++) this.setTile(x, y, TT.FOREST);
      for (let y = 0; y < L.margin; y++) for (let x = 0; x < this.W; x++) this.setTile(x, y, TT.FOREST);

      // praia + oceano (linha sul)
      const beachStart = this.H - 14;
      for (let y = beachStart; y < this.H; y++) {
        for (let x = 0; x < this.W; x++) {
          if (y < beachStart + 6) this.setTile(x, y, TT.SAND);
          else this.setTile(x, y, TT.WATER);
        }
      }
      this.beachY = beachStart;
    }

    /* ---------------- ruas ---------------- */
    paintRoads(L) {
      const paint = (x0, y0, w, h, t) => {
        for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.setTile(x, y, t);
      };
      // ruas verticais
      const yEnd = Math.min(this.H - L.margin, this.beachY - 1);
      for (const r of L.vRoads) {
        for (let y = L.margin; y < yEnd; y++) {
          for (let x = r.pos; x < r.pos + r.w; x++) {
            if (this.tile(x, y) !== TT.WATER) this.setTile(x, y, TT.ROAD);
          }
        }
      }
      // ruas horizontais
      for (const r of L.hRoads) {
        if (r.pos >= this.beachY - 2) continue;
        const yy = Math.min(r.pos + r.w, this.beachY - 1);
        for (let y = r.pos; y < yy; y++) {
          for (let x = L.margin; x < this.W - L.margin; x++) {
            if (this.tile(x, y) !== TT.WATER) this.setTile(x, y, TT.ROAD);
          }
        }
      }
      // calçadas: anel em volta de cada quarteirão
      for (const b of L.blocks) {
        for (let x = b.x - 1; x <= b.x + b.w; x++) {
          this.setIfNotRoad(x, b.y - 1, TT.SIDEWALK);
          this.setIfNotRoad(x, b.y + b.h, TT.SIDEWALK);
        }
        for (let y = b.y - 1; y <= b.y + b.h; y++) {
          this.setIfNotRoad(b.x - 1, y, TT.SIDEWALK);
          this.setIfNotRoad(b.x + b.w, y, TT.SIDEWALK);
        }
      }
      // faixas de pedestres nas aproximações das interseções
      this.crosswalks = [];
      for (const vr of L.vRoads) for (const hr of L.hRoads) {
        const cx = vr.pos + vr.w / 2, cy = hr.pos + hr.w / 2;
        const r = { vx: vr.pos, vw: vr.w, hy: hr.pos, hh: hr.w, cx, cy, phase: 0 };
        r.phase = (Math.floor(cx / 8) + Math.floor(cy / 8)) % 2;
        this.crosswalks.push(r);
        // faixa em cada aproximação
        const off = 2;
        for (let k = 0; k < vr.w; k++) {
          this.setTile(vr.pos + k, hr.pos - off, TT.CROSSWALK);
          this.setTile(vr.pos + k, hr.pos + hr.w + off - 1, TT.CROSSWALK);
        }
        for (let k = 0; k < hr.w; k++) {
          this.setTile(vr.pos - off, hr.pos + k, TT.CROSSWALK);
          this.setTile(vr.pos + vr.w + off - 1, hr.pos + k, TT.CROSSWALK);
        }
      }
      this.intersections = this.crosswalks;
    }
    setIfNotRoad(x, y, t) { if (this.inBounds(x, y) && this.tile(x, y) !== TT.WATER && this.tile(x, y) !== TT.ROAD) this.setTile(x, y, t); }

    /* ---------------- rio / canal com pontes ---------------- */
    paintRiver(L) {
      const rnd = U.rngOf(this.seed, 'river');
      const vrs = L.vRoads;
      const pick = U.clamp(Math.floor(vrs.length * .68), 2, vrs.length - 3);
      const r = vrs[pick], w = r.w + 3;
      const x0 = r.pos - 1;
      this.river = { x: x0, w, y0: L.margin, y1: this.beachY };
      for (let y = L.margin; y < this.beachY; y++) {
        for (let x = x0; x < x0 + w; x++) {
          if (this.tile(x, y) === TT.SAND || this.tile(x, y) === TT.WATER) continue;
          this.setTile(x, y, TT.WATER);
        }
      }
      // pontes onde ruas horizontais cruzam o rio
      this.bridges = [];
      for (const hr of L.hRoads) {
        const yTop = hr.pos - (hr.avenue ? 1 : 0), yBot = hr.pos + hr.w + (hr.avenue ? 0 : 0);
        for (let y = yTop - 1; y < hr.pos + hr.w + 1; y++) {
          for (let x = x0 - 1; x < x0 + w + 1; x++) this.setTile(x, y, TT.BRIDGE);
        }
        // parapeitos
        for (let x = x0 - 1; x < x0 + w + 1; x++) {
          this.setIfBridgeRail(x, hr.pos - 2);
          this.setIfBridgeRail(x, hr.pos + hr.w + 1);
        }
        this.bridges.push({ y: hr.pos, h: hr.w, x0, w });
      }
      // margens: calçadão de pedra
      for (let y = L.margin; y < this.beachY; y++) {
        this.setIfWaterQuay(x0 - 1, y); this.setIfWaterQuay(x0 + w, y);
      }
      this.riverBridges = this.bridges.length;
    }
    setIfWaterQuay(x, y) { if (this.inBounds(x, y)) this.setTile(x, y, TT.PIER); }
    setIfBridgeRail(x, y) { if (this.inBounds(x, y) && this.tile(x, y) === TT.WATER) this.setTile(x, y, TT.PIER); }

    paintCoast() {
      const beachStart = this.H - 14;
      for (let y = beachStart; y < this.H; y++) {
        for (let x = 0; x < this.W; x++) {
          if (y < beachStart + 7) this.setTile(x, y, TT.SAND);
          else this.setTile(x, y, TT.WATER);
        }
      }
      // calçadão beira-mar
      for (let x = 0; x < this.W; x++) {
        if (this.tile(x, beachStart - 1) !== TT.WATER) this.setTile(x, beachStart - 1, TT.PIER);
      }
      this.beachY = beachStart;
    }

    /* ---------------- distritos ---------------- */
    buildDistricts(L) {
      const nb = L.nBlocks, rnd = U.rngOf(this.seed, 'districts');
      const map = {};
      for (const b of L.blocks) {
        const gi = U.clamp(Math.floor((b.by / nb) * 5), 0, 4);
        const gj = U.clamp(Math.floor((b.bx / nb) * 5), 0, 4);
        const key = gi + ':' + gj;
        if (!map[key]) {
          const z = D.ZONES[b.zone];
          map[key] = {
            id: this.districts.length, zone: b.zone, name: z.name,
            hood: D.NEIGHBORHOODS[(this.districts.length + rnd() * 3 | 0) % D.NEIGHBORHOODS.length],
            gi, gj, blocks: [], x: 1e9, y: 1e9, x2: 0, y2: 0, pop: 0
          };
          map[key].name = z.name;
          this.districts.push(map[key]);
        }
        const dist = map[key];
        dist.blocks.push(b);
        b.district = dist;
        dist.x = Math.min(dist.x, b.x); dist.y = Math.min(dist.y, b.y);
        dist.x2 = Math.max(dist.x2, b.x + b.w); dist.y2 = Math.max(dist.y2, b.y + b.h);
      }
      // nome das ruas
      this.vRoads = L.vRoads.map((r, i) => ({
        ...r, name: (r.avenue ? 'Avenida ' : 'Rua ') + D.STREETS[i % D.STREETS.length], vertical: true
      }));
      this.hRoads = L.hRoads.map((r, i) => ({
        ...r, name: (r.avenue ? 'Avenida ' : 'Rua ') + D.STREETS[(i * 3 + 5) % D.STREETS.length], vertical: false
      }));
    }

    streetNameAt(x, y) {
      let best = null, bd = 1e9;
      for (const r of this.vRoads) {
        const cx = r.pos + r.w / 2, d = Math.abs(x - cx);
        if (d < bd && y > this.layoutInfo.margin) { bd = d; best = r; }
      }
      for (const r of this.hRoads) {
        const cy = r.pos + r.w / 2, d = Math.abs(y - cy);
        if (d < bd && x > this.layoutInfo.margin) { bd = d; best = r; }
      }
      return best ? best.name : 'Via urbana';
    }
    districtAt(x, y) {
      let best = null, bd = 1e9;
      for (const d of this.districts) {
        const cx = (d.x + d.x2) / 2, cy = (d.y + d.y2) / 2;
        const dist = U.dist2(x, y, cx, cy);
        if (dist < bd) { bd = dist; best = d; }
      }
      return best;
    }

    /* ---------------- prédios ---------------- */
    placeBuildings(L) {
      const rnd = this.rnd;
      const usedProps = [];
      for (const b of L.blocks) {
        const zone = b.zone;
        const patterns = ZONE_PATTERNS[zone] || ZONE_PATTERNS.RESIDENTIAL;
        const pat = patterns[(rnd() * patterns.length) | 0];
        const kinds = this.lotsFor(pat[0], rnd, b, zone);
        for (const k of kinds) this.createBuilding(k, b, rnd);
      }
      this.rnd = rnd;
    }

    // devolve lista de {kind,x,y,w,h} em coordenadas absolutas
    lotsFor(pattern, rnd, b, zone) {
      const out = [];
      const pad = 0; // prédios podem encostar na calçada
      const bx = b.x + pad, by = b.y + pad, bw = b.w - pad * 2, bh = b.h - pad * 2;
      const sub = (cols, rows, kindFn) => {
        const cw = bw / cols, ch = bh / rows;
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
          const lot = { x: Math.round(bx + i * cw), y: Math.round(by + j * ch), w: Math.round(cw), h: Math.round(ch) };
          const k = kindFn(lot, i, j);
          if (k) out.push(k);
        }
      };
      const fit = (spec, lot, shrink, maxFloors) => {
        const def = D.BUILDINGS[spec];
        const w = Math.min(def.size[0], lot.w) - (shrink ? 1 : 0);
        const h = Math.min(def.size[1], lot.h) - (shrink ? 1 : 0);
        if (w < 3 || h < 3) return null;
        const ox = lot.x + ((rnd() * (lot.w - w - 1)) | 0);
        const oy = lot.y + ((rnd() * (lot.h - h - 1)) | 0);
        let floors = def.floors;
        if (def.floors > 1) floors = Math.max(1, Math.round(def.floors * (0.6 + rnd() * 0.9)));
        if (maxFloors) floors = Math.min(floors, maxFloors);
        return { kind: spec, x: ox, y: oy, w, h, floors, zone };
      };

      switch (pattern) {
        case 'houses':
          sub(3, 3, (lot) => rnd() < .18 ? null : fit(rnd() < .8 ? 'house' : 'house_big', lot, true, 2));
          break;
        case 'houses2':
          sub(2, 2, (lot) => fit(rnd() < .6 ? 'house_big' : 'house', lot, true, 2));
          break;
        case 'apartments':
          sub(2, 2, (lot) => fit(rnd() < .5 ? 'apartment' : 'condo', lot, false));
          break;
        case 'mixed_small':
          sub(2, 2, (lot, i, j) => {
            if (i === 0 && j === 0) return fit('shop', lot, true);
            if (i === 1 && j === 1) return fit('bakery', lot, true);
            return fit(rnd() < .5 ? 'house' : 'apartment', lot, true);
          });
          break;
        case 'towers': sub(2, 2, (lot) => fit(rnd() < .6 ? 'tower' : 'office', lot, false)); break;
        case 'offices': sub(2, 2, (lot) => fit(rnd() < .3 ? 'bank' : 'office', lot, false)); break;
        case 'bank_block':
          sub(2, 2, (lot, i, j) => (i === 0 && j === 0) ? fit('bank', lot, true) : fit(rnd() < .5 ? 'office' : 'tower', lot, false));
          break;
        case 'mixed_tower':
          sub(2, 2, (lot, i, j) => {
            if (i === 0 && j === 0) return fit('mall', lot, false);
            return fit(rnd() < .5 ? 'tower' : 'office', lot, false);
          });
          break;
        case 'shops': sub(3, 2, (lot) => fit(rnd() < .5 ? 'shop' : (rnd() < .5 ? 'bakery' : 'pharmacy'), lot, true)); break;
        case 'restaurants':
          sub(2, 2, (lot) => fit(rnd() < .45 ? 'restaurant' : (rnd() < .5 ? 'bar' : 'bakery'), lot, true));
          break;
        case 'mall_block': sub(1, 1, (lot) => fit('mall', lot, false)); break;
        case 'supermarket_block':
          sub(2, 2, (lot, i, j) => (i === 0 && j === 0) ? fit('supermarket', lot, false) : fit(rnd() < .5 ? 'shop' : 'market', lot, true));
          break;
        case 'mixed_comm':
          sub(2, 2, (lot) => fit(rnd() < .4 ? 'supermarket' : (rnd() < .5 ? 'restaurant' : 'hotel'), lot, false));
          break;
        case 'factories': sub(2, 2, (lot) => fit(rnd() < .55 ? 'factory' : 'warehouse', lot, false)); break;
        case 'warehouses': sub(2, 2, (lot) => fit('warehouse', lot, false)); break;
        case 'garages':
          sub(2, 2, (lot, i, j) => (i === 0 && j === 0) ? fit('gas', lot, true) : fit(rnd() < .5 ? 'garage' : 'darkstore', lot, true));
          break;
        case 'big_industrial':
          sub(2, 2, (lot, i, j) => {
            if (i === 1 && j === 1) return fit('prison', lot, false);
            return fit(rnd() < .5 ? 'factory' : 'construction', lot, false);
          });
          break;
        case 'farms': sub(2, 2, (lot) => fit(rnd() < .5 ? 'farm' : 'house', lot, true)); break;
        case 'farm_small': sub(2, 2, (lot) => fit(rnd() < .5 ? 'farm' : 'warehouse', lot, true)); break;
        case 'forest_cabin': sub(2, 2, (lot) => rnd() < .3 ? fit('house', lot, true) : null); break;
        case 'docks': sub(2, 2, (lot, i, j) => (i === 0 && j === 0) ? fit('port', lot, false) : fit('warehouse', lot, false)); break;
        case 'airport_block':
          out.push({ kind: 'airport', x: b.x + 1, y: b.y + 2, w: Math.min(b.w - 2, 11), h: Math.min(b.h - 4, 8), floors: 2, zone });
          break;
        case 'beach_hotels': sub(2, 2, (lot) => fit(rnd() < .6 ? 'hotel' : 'condo', lot, false)); break;
        case 'beach_shops': sub(2, 2, (lot) => fit(rnd() < .5 ? 'restaurant' : (rnd() < .5 ? 'bar' : 'shop'), lot, true)); break;
        case 'school_block':
          sub(2, 2, (lot, i, j) => {
            if (i === 0 && j === 0) return fit(rnd() < .5 ? 'school' : 'university', lot, false);
            if (i === 1 && j === 0) return fit('police', lot, true);
            if (i === 0 && j === 1) return fit('clinic', lot, true);
            return fit('house', lot, true);
          });
          break;
        case 'park_block': break;
        default: sub(2, 2, (lot) => fit('house', lot, true));
      }
      return out;
    }

    createBuilding(spec, block, rnd) {
      const def = D.BUILDINGS[spec.kind];
      if (!def) return null;
      // não constrói sobre água
      for (let y = spec.y; y < spec.y + spec.h; y++) {
        for (let x = spec.x; x < spec.x + spec.w; x++) {
          if (!this.inBounds(x, y) || this.tile(x, y) === TT.WATER) return null;
        }
      }
      const district = block.district;
      const color = def.colors[(rnd() * def.colors.length) | 0];
      const b = {
        id: this.buildings.length,
        kind: spec.kind, name: def.name, zone: district ? district.zone : spec.zone,
        x: spec.x, y: spec.y, w: spec.w, h: spec.h, floors: spec.floors || 1,
        color, def, district, interior: def.interior,
        solid: true, litWindows: [], door: null, doors: []
      };
      // janelas iluminadas (padrão determinístico)
      const wr = U.rng(this.seed + '#win' + b.id);
      const floors = Math.max(1, b.floors);
      const rows = Math.min(6, floors);
      for (let f = 0; f < rows; f++) {
        const row = [];
        const cols = Math.max(2, Math.min(10, Math.round(b.w * 1.4)));
        for (let c = 0; c < cols; c++) row.push(wr() < .45 ? 1 : 0);
        b.litWindows.push(row);
      }
      // porta: voltada para uma rua
      const candidates = [];
      const roadNear = (x, y) => this.isRoad(x | 0, y | 0) || this.tile(x | 0, y | 0) === TT.SIDEWALK;
      if (roadNear(b.x + (b.w >> 1), b.y + b.h + 1)) candidates.push({ x: b.x + (b.w >> 1), y: b.y + b.h, side: 's' });
      if (roadNear(b.x + (b.w >> 1), b.y - 2)) candidates.push({ x: b.x + (b.w >> 1), y: b.y - 1, side: 'n' });
      if (roadNear(b.x + b.w + 1, b.y + (b.h >> 1))) candidates.push({ x: b.x + b.w, y: b.y + (b.h >> 1), side: 'e' });
      if (roadNear(b.x - 2, b.y + (b.h >> 1))) candidates.push({ x: b.x - 1, y: b.y + (b.h >> 1), side: 'w' });
      b.door = candidates.length ? candidates[(rnd() * candidates.length) | 0] : { x: b.x + (b.w >> 1), y: b.y + b.h, side: 's' };
      b.doors = [b.door];
      this.buildings.push(b);
      // POI: ocupa o retângulo do prédio
      for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) {
        if (this.inBounds(x, y)) this.pois.set((x | 0) + ',' + (y | 0), b);
      }
      // calçada na porta permanece caminhável
      return b;
    }

    /* ---------------- props ---------------- */
    placeProps(L) {
      const rnd = this.rnd, props = this.props;
      const add = (p) => props.push(p);
      const near = (x, y) => this.tile(x, y);

      for (const b of L.blocks) {
        const zone = b.zone;
        // calçadas: postes, lixeiras, hidrantes, bancos, placas
        const edge = [
          { x: b.x, y: b.y - 1, d: 'h' }, { x: b.x, y: b.y + b.h, d: 'h' },
          { x: b.x - 1, y: b.y, d: 'v' }, { x: b.x + b.w, y: b.y, d: 'v' }
        ];
        for (const e of edge) {
          const len = e.d === 'h' ? b.w : b.h;
          const step = 4;
          for (let k = 2; k < len; k += step) {
            const x = e.d === 'h' ? e.x + k : e.x, y = e.d === 'h' ? e.y : e.y + k;
            if (near(x, y) !== TT.SIDEWALK) continue;
            const r = rnd();
            if (r < .38) add({ t: 'lamp', x: x + .5, y: y + .5, zone });
            else if (r < .5) add({ t: 'tree_small', x: x + .5, y: y + .5, r: 6 });
            else if (r < .56) add({ t: 'bin', x: x + .5, y: y + .5 });
            else if (r < .6) add({ t: 'hydrant', x: x + .5, y: y + .5 });
            else if (r < .66) add({ t: 'sign', x: x + .5, y: y + .5, v: rnd() });
            else if (r < .72) add({ t: 'bench', x: x + .5, y: y + .5 });
          }
        }
        // interior do quarteirão: árvores nos quintais
        for (let y = b.y; y < b.y + b.h; y += 2) {
          for (let x = b.x; x < b.x + b.w; x += 2) {
            if (this.buildingAt(x, y)) continue;
            const t = this.tile(x, y);
            if (t === TT.GRASS && rnd() < .22) add({ t: rnd() < .3 ? 'tree_big' : 'tree_small', x: x + .5, y: y + .5, r: 7 });
            else if (t === TT.FIELD && rnd() < .1) add({ t: 'crop', x: x + .5, y: y + .5 });
          }
        }
      }
      // parques: árvores, bancos, caminhos
      for (const b of L.blocks) {
        if (b.zone !== 'PARK') continue;
        for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) {
          if (this.tile(x, y) === TT.GRASS) this.setTile(x, y, TT.PLAZA);
        }
        // caminhos sinuosos
        for (let k = 0; k < 40; k++) {
          let px = b.x + rnd() * b.w, py = b.y + rnd() * b.h;
          const dir = rnd() * Math.PI * 2;
          for (let s = 0; s < 26; s++) {
            px += Math.cos(dir + Math.sin(s * .3) * .8); py += Math.sin(dir + Math.sin(s * .3) * .8);
            if (px < b.x || py < b.y || px > b.x + b.w || py > b.y + b.h) break;
            this.setTile(px | 0, py | 0, TT.PATH);
            this.setTile((px | 0) + 1, py | 0, TT.PATH);
          }
        }
        // lago do parque
        const lx = b.x + b.w * .5, ly = b.y + b.h * .55, lr = Math.min(b.w, b.h) * .26;
        for (let y = b.y - 1; y < b.y + b.h + 1; y++) for (let x = b.x - 1; x < b.x + b.w + 1; x++) {
          const d = Math.hypot(x - lx, y - ly) / lr;
          if (d < 1 + (this.noise(x * .2, y * .2) - .5) * .35) this.setTile(x, y, TT.WATER);
          else if (d < 1.25 && this.tile(x, y) !== TT.WATER) this.setTile(x, y, TT.SAND);
        }
        this.parkLake = { x: lx, y: ly, r: lr };
        for (let y = b.y; y < b.y + b.h; y += 2) for (let x = b.x; x < b.x + b.w; x += 2) {
          const t = this.tile(x, y);
          if ((t === TT.PLAZA || t === TT.PATH || t === TT.GRASS) && rnd() < .5)
            add({ t: rnd() < .25 ? 'tree_big' : (rnd() < .5 ? 'tree_small' : 'bush'), x: x + .5, y: y + .5, r: 7 });
          else if (t === TT.PLAZA && rnd() < .12) add({ t: rnd() < .5 ? 'bench' : 'lamp', x: x + .5, y: y + .5 });
        }
      }
      // floresta e zona rural: árvores densas, pedras, plantações
      for (let y = 0; y < this.H; y += 1) {
        for (let x = 0; x < this.W; x += 1) {
          const t = this.tile(x, y);
          if (t === TT.FOREST && rnd() < .34) add({ t: rnd() < .35 ? 'pine' : 'tree_big', x: x + .5, y: y + .5, r: 8 });
          else if (t === TT.FIELD && rnd() < .1) add({ t: rnd() < .5 ? 'crop' : 'tree_small', x: x + .5, y: y + .5 });
          else if (t === TT.SAND && rnd() < .05) add({ t: 'palm', x: x + .5, y: y + .5, r: 5 });
          else if (t === TT.GRASS && rnd() < .01) add({ t: 'bush', x: x + .5, y: y + .5 });
        }
      }
      // pedras soltas em montanhas/floresta
      const nz = this.noise;
      for (let k = 0; k < 260; k++) {
        const x = rnd() * this.W, y = rnd() * this.H;
        if (this.tile(x | 0, y | 0) === TT.FOREST && nz(x * .05, y * .05) > .6) add({ t: 'rock', x, y, r: 6 });
      }
      // semáforos nos cruzamentos
      for (const it of this.crosswalks) {
        const pts = [
          { x: it.vx + 1.5, y: it.hy - 1.5, dir: 'n' }, { x: it.vx + it.vw - 1.5, y: it.hy + it.hh + .5, dir: 's' },
          { x: it.vx - 1.5, y: it.hy + 1.5, dir: 'w' }, { x: it.vx + it.vw + .5, y: it.hy + it.hh - 1.5, dir: 'e' }
        ];
        for (const p of pts) add({ t: 'trafficlight', x: p.x, y: p.y, dir: p.dir, it });
      }
      // pontos de ônibus
      for (const b of L.blocks) {
        if (rnd() < .55) {
          const side = (rnd() * 4) | 0;
          let x, y;
          if (side === 0) { x = b.x + (b.w >> 1); y = b.y - 1; }
          else if (side === 1) { x = b.x + (b.w >> 1); y = b.y + b.h; }
          else if (side === 2) { x = b.x - 1; y = b.y + (b.h >> 1); }
          else { x = b.x + b.w; y = b.y + (b.h >> 1); }
          if (this.tile(x, y) === TT.SIDEWALK) add({ t: 'busstop', x: x + .5, y: y + .5 });
        }
      }
      // indexa props em buckets espaciais
      this.propBuckets = new Map();
      for (const p of props) {
        const k = ((p.x / 16) | 0) + ',' + ((p.y / 16) | 0);
        if (!this.propBuckets.has(k)) this.propBuckets.set(k, []);
        this.propBuckets.get(k).push(p);
      }
    }

    propsIn(x0, y0, x1, y1) {
      const out = [];
      const b0x = (x0 / 16) | 0, b0y = (y0 / 16) | 0, b1x = (x1 / 16) | 0, b1y = (y1 / 16) | 0;
      for (let by = b0y; by <= b1y; by++) for (let bx = b0x; bx <= b1x; bx++) {
        const arr = this.propBuckets.get(bx + ',' + by);
        if (arr) for (const p of arr) out.push(p);
      }
      return out;
    }

    /* ---------------- grafo viário (para carros) ---------------- */
    buildRoadGraph(L) {
      const nodes = [], index = new Map();
      for (let i = 0; i < L.vRoads.length; i++) {
        for (let j = 0; j < L.hRoads.length; j++) {
          const vr = L.vRoads[i], hr = L.hRoads[j];
          const it = this.crosswalks.find((c) => c.vx === vr.pos && c.hy === hr.pos);
          const n = {
            id: nodes.length, x: vr.pos + vr.w / 2, y: hr.pos + hr.w / 2,
            vi: i, hi: j, vRoad: vr, hRoad: hr, it: it || null, edges: [], light: 0
          };
          nodes.push(n); index.set(i + ':' + j, n);
        }
      }
      const edges = [];
      // arestas verticais (entre cruzamentos consecutivos em Y)
      for (let i = 0; i < L.vRoads.length; i++) {
        for (let j = 0; j < L.hRoads.length - 1; j++) {
          const a = index.get(i + ':' + j), b = index.get(i + ':' + (j + 1));
          if (!a || !b) continue;
          const w = a.vRoad.w;
          const e1 = { a, b, dir: 'S', w, x: a.x, y0: a.y, y1: b.y, vertical: true, lane: w / 4 };
          const e2 = { a: b, b: a, dir: 'N', w, x: b.x, y0: b.y, y1: a.y, vertical: true, lane: w / 4 };
          edges.push(e1, e2); a.edges.push(e1); b.edges.push(e2);
        }
      }
      // arestas horizontais
      for (let j = 0; j < L.hRoads.length; j++) {
        for (let i = 0; i < L.vRoads.length - 1; i++) {
          const a = index.get(i + ':' + j), b = index.get((i + 1) + ':' + j);
          if (!a || !b) continue;
          const w = a.hRoad.w;
          const e1 = { a, b, dir: 'E', w, y: a.y, x0: a.x, x1: b.x, vertical: false, lane: w / 4 };
          const e2 = { a: b, b: a, dir: 'W', w, y: b.y, x0: b.x, x1: a.x, vertical: false, lane: w / 4 };
          edges.push(e1, e2); a.edges.push(e1); b.edges.push(e2);
        }
      }
      this.roadNodes = nodes;
      this.roadEdges = edges;
    }

    // posição com faixa de rolamento (mão direita) para uma aresta e um progresso
    edgePoint(e, t) {
      const off = e.lane;
      if (e.vertical) {
        const y = U.lerp(e.y0, e.y1, t);
        const x = e.x + (e.dir === 'S' ? -off : off);
        return { x, y };
      }
      const x = U.lerp(e.x0, e.x1, t);
      const y = e.y + (e.dir === 'E' ? off : -off);
      return { x, y };
    }
    edgeLength(e) { return e.vertical ? Math.abs(e.y1 - e.y0) : Math.abs(e.x1 - e.x0); }

    /* ---------------- grafo de calçadas (pedestres) ---------------- */
    buildWalkGraph() {
      // nós a cada 3 tiles que sejam calçada, ligados a vizinhos próximos com linha livre
      const step = 3, nodes = [], map = new Map();
      const key = (x, y) => x + ',' + y;
      for (let y = 0; y < this.H; y += step) {
        for (let x = 0; x < this.W; x += step) {
          const t = this.tile(x, y);
          if (t !== TT.SIDEWALK && t !== TT.CROSSWALK && t !== TT.PATH && t !== TT.PLAZA) continue;
          const n = { id: nodes.length, x: x + .5, y: y + .5, e: [] };
          nodes.push(n); map.set(key(x, y), n);
        }
      }
      const clear = (a, b) => {
        const steps = Math.ceil(U.dist(a.x, a.y, b.x, b.y) * 2);
        for (let s = 1; s < steps; s++) {
          const t = s / steps;
          const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
          const tt = this.tile(x | 0, y | 0);
          if (tt === TT.WATER || this.buildingAt(x | 0, y | 0)) return false;
        }
        return true;
      };
      for (const n of nodes) {
        for (let dy = -step; dy <= step; dy += step) {
          for (let dx = -step; dx <= step; dx += step) {
            if (!dx && !dy) continue;
            const m = map.get(key((n.x + dx | 0), (n.y + dy | 0)));
            if (!m) continue;
            if (Math.abs(dx) > 0 && Math.abs(dy) > 0) continue; // apenas ortogonal
            if (!clear(n, m)) continue;
            n.e.push({ to: m, cost: U.dist(n.x, n.y, m.x, m.y) });
          }
        }
      }
      this.walkNodes = nodes; this.walkMap = map;
    }
    nearestWalkNode(x, y, maxR) {
      const step = 3; let best = null, bd = (maxR || 6) * (maxR || 6);
      const cx = (x / step) | 0, cy = (y / step) | 0;
      for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) {
        const n = this.walkMap.get(((cx + i) * step) + ',' + ((cy + j) * step));
        if (!n) continue;
        const d = U.dist2(x, y, n.x, n.y);
        if (d < bd) { bd = d; best = n; }
      }
      return best;
    }
    // A* no grafo de calçadas — fila por buckets de f (rápido e sem alocação pesada)
    findPathWalk(from, to) {
      const a = this.nearestWalkNode(from.x, from.y, 10), b = this.nearestWalkNode(to.x, to.y, 12);
      if (!a || !b) return null;
      if (a === b) return [{ x: b.x, y: b.y }];
      const wrap = (v) => ((v % 2048) + 2048) % 2048;
      const buckets = new Array(2048);
      const push = (node) => {
        const k = wrap(node.f | 0);
        if (!buckets[k]) buckets[k] = [];
        buckets[k].push(node);
      };
      const gScore = new Map();
      const closed = new Set();
      const h = (n) => U.dist(n.x, n.y, b.x, b.y);
      gScore.set(a.id, 0);
      push({ n: a, g: 0, f: h(a), p: null });
      let lastF = 0, visited = 0;
      while (visited < 9000) {
        // encontra o próximo bucket não vazio (busca circular)
        let cur = null;
        for (let i = 0; i < 2048; i++) {
          const k = wrap(lastF + i);
          const bk = buckets[k];
          if (bk && bk.length) { cur = bk.pop(); lastF = k; break; }
        }
        if (!cur) return null;
        visited++;
        if (cur.n === b) {
          const path = [];
          let c = cur;
          while (c) { path.unshift({ x: c.n.x, y: c.n.y }); c = c.p; }
          return path;
        }
        if (closed.has(cur.n.id)) continue;
        closed.add(cur.n.id);
        for (const e of cur.n.e) {
          if (closed.has(e.to.id)) continue;
          const g = cur.g + e.cost;
          const prev = gScore.get(e.to.id);
          if (prev !== undefined && prev <= g) continue;
          gScore.set(e.to.id, g);
          push({ n: e.to, g, f: g + h(e.to), p: cur });
        }
      }
      return null;
    }

    /* ---------------- mapa renderizado ---------------- */
    paintMapCanvases() {
      const S = C.TILE;
      const cv = document.createElement('canvas');
      cv.width = this.W * S; cv.height = this.H * S;
      const g = cv.getContext('2d');
      const rnd = U.rngOf(this.seed, 'groundpaint');
      const pal = {
        [TT.GRASS]: ['#3d7a3f', '#427f44', '#45833f', '#3a7239'],
        [TT.ROAD]: ['#3a3f46', '#3c4148', '#383d44'],
        [TT.SIDEWALK]: ['#9aa0a6', '#8f959b', '#a3a9af'],
        [TT.CROSSWALK]: ['#3a3f46'],
        [TT.WATER]: ['#1b4f77', '#1d547e', '#1a4a70'],
        [TT.SAND]: ['#d9c48a', '#d2bd83', '#e0cb91'],
        [TT.FOREST]: ['#2c5f33', '#2f6636', '#28572f'],
        [TT.PLAZA]: ['#b9b2a0', '#b2ab99', '#c0b9a7'],
        [TT.PATH]: ['#b09a72', '#a89268'],
        [TT.LOT]: ['#c2b8a4', '#bcb29e'],
        [TT.BRIDGE]: ['#6b6f76', '#64686f', '#72767d'],
        [TT.FIELD]: ['#8a9c4a', '#93a552', '#83954a'],
        [TT.RUNWAY]: ['#4a4e54', '#45494f'],
        [TT.CONCRETE]: ['#b0b0ac'],
        [TT.PIER]: ['#8d8b84', '#96948d']
      };
      for (let y = 0; y < this.H; y++) {
        for (let x = 0; x < this.W; x++) {
          const t = this.tiles[this.idx(x, y)];
          const arr = pal[t] || pal[TT.GRASS];
          g.fillStyle = arr[(rnd() * arr.length) | 0];
          g.fillRect(x * S, y * S, S, S);
          // detalhes
          if (t === TT.ROAD) {
            g.fillStyle = 'rgba(255,255,255,.03)';
            for (let k = 0; k < 3; k++) g.fillRect(x * S + rnd() * S, y * S + rnd() * S, 1, 1);
          } else if (t === TT.SIDEWALK) {
            g.strokeStyle = 'rgba(0,0,0,.13)'; g.lineWidth = 1;
            g.strokeRect(x * S + .5, y * S + .5, S - 1, S - 1);
          } else if (t === TT.WATER) {
            g.fillStyle = 'rgba(120,200,255,.07)';
            g.fillRect(x * S, y * S + ((rnd() * S) | 0), S, 1);
          } else if (t === TT.PLAZA || t === TT.PATH) {
            g.fillStyle = 'rgba(0,0,0,.06)';
            g.fillRect(x * S + ((rnd() * 12) | 0), y * S + ((rnd() * 12) | 0), 3, 3);
          } else if (t === TT.FIELD) {
            g.strokeStyle = 'rgba(0,0,0,.08)';
            for (let k = 2; k < S; k += 4) { g.beginPath(); g.moveTo(x * S, y * S + k); g.lineTo(x * S + S, y * S + k); g.stroke(); }
          }
        }
      }
      // pintura das ruas: linha central, faixas
      g.save();
      for (const r of this.vRoads) {
        if (r.avenue) {
          g.fillStyle = 'rgba(255,220,80,.5)';
          for (let y = this.layoutInfo.margin; y < this.H - 14; y += 6) {
            g.fillRect((r.pos + r.w / 2 - .5) * S, y * S, S, S * 3);
          }
        }
      }
      for (const r of this.hRoads) {
        if (r.avenue) {
          g.fillStyle = 'rgba(255,220,80,.5)';
          for (let x = this.layoutInfo.margin; x < this.W - this.layoutInfo.margin; x += 6) {
            g.fillRect(x * S, (r.pos + r.w / 2 - .5) * S, S * 3, S);
          }
        }
      }
      // faixas de pedestres
      g.fillStyle = 'rgba(240,240,235,.75)';
      for (const it of this.crosswalks) {
        const off = 2;
        for (let k = 0; k < it.vw; k++) {
          if (k % 2 === 0) {
            g.fillRect((it.vx + k) * S, (it.hy - off) * S, S, S);
            g.fillRect((it.vx + k) * S, (it.hy + it.hh + off - 1) * S, S, S);
          }
        }
        for (let k = 0; k < it.hh; k++) {
          if (k % 2 === 0) {
            g.fillRect((it.vx - off) * S, (it.hy + k) * S, S, S);
            g.fillRect((it.vx + it.vw + off - 1) * S, (it.hy + k) * S, S, S);
          }
        }
      }
      g.restore();
      this.groundCanvas = cv;

      // minimapa (1px por tile)
      const mm = document.createElement('canvas');
      mm.width = this.W; mm.height = this.H;
      const mg = mm.getContext('2d');
      const small = { [TT.GRASS]: '#3d7a3f', [TT.ROAD]: '#3a3f46', [TT.SIDEWALK]: '#8f959b', [TT.CROSSWALK]: '#3a3f46', [TT.WATER]: '#1b4f77', [TT.SAND]: '#d9c48a', [TT.FOREST]: '#2c5f33', [TT.PLAZA]: '#b9b2a0', [TT.PATH]: '#b09a72', [TT.LOT]: '#c2b8a4', [TT.BRIDGE]: '#6b6f76', [TT.FIELD]: '#8a9c4a', [TT.RUNWAY]: '#4a4e54', [TT.CONCRETE]: '#b0b0ac', [TT.PIER]: '#8d8b84' };
      const img = mg.createImageData(this.W, this.H);
      const tmp = document.createElement('canvas'); tmp.width = 1; tmp.height = 1;
      const tg = tmp.getContext('2d');
      for (let i = 0; i < this.tiles.length; i++) {
        const c = small[this.tiles[i]] || '#3d7a3f';
        tg.fillStyle = c; tg.fillRect(0, 0, 1, 1);
        const d = tg.getImageData(0, 0, 1, 1).data;
        img.data[i * 4] = d[0]; img.data[i * 4 + 1] = d[1]; img.data[i * 4 + 2] = d[2]; img.data[i * 4 + 3] = 255;
      }
      mg.putImageData(img, 0, 0);
      // prédios no minimapa
      for (const b of this.buildings) {
        mg.fillStyle = U.shade(b.color, -.15);
        mg.fillRect(b.x, b.y, b.w, b.h);
      }
      this.miniCanvas = mm;
    }

    /* ---------------- consultas auxiliares ---------------- */
    get placesByKind() {
      if (!this._pbk) {
        this._pbk = {};
        for (const b of this.buildings) {
          (this._pbk[b.kind] = this._pbk[b.kind] || []).push(b);
        }
      }
      return this._pbk;
    }
    places(kind) { return this.placesByKind[kind] || []; }
    randomPlace(kind, rnd) {
      const arr = this.places(kind);
      if (!arr.length) return null;
      return arr[((rnd ? rnd() : Math.random()) * arr.length) | 0];
    }
    // todos os prédios de uma lista de tipos
    placesAny(kinds) {
      const out = [];
      for (const k of kinds) out.push(...this.places(k));
      return out;
    }
    // prédio mais próximo de um tipo
    nearestPlace(kind, x, y) {
      let best = null, bd = 1e18;
      for (const b of this.places(kind)) {
        const d = U.dist2(x, y, b.x + b.w / 2, b.y + b.h / 2);
        if (d < bd) { bd = d; best = b; }
      }
      return best;
    }
    nearestBuilding(x, y, filter) {
      let best = null, bd = 1e18;
      for (const b of this.buildings) {
        if (filter && !filter(b)) continue;
        const d = U.dist2(x, y, b.x + b.w / 2, b.y + b.h / 2);
        if (d < bd) { bd = d; best = b; }
      }
      return best;
    }
    // residência aleatória
    randomHome(rnd) {
      const arr = this._homes || (this._homes = this.buildings.filter((b) => ['house', 'house_big', 'apartment', 'condo'].includes(b.kind)));
      return arr[((rnd ? rnd() : Math.random()) * arr.length) | 0];
    }
    capacityOf(b) {
      if (!b) return 2;
      if (b.kind === 'house') return 3;
      if (b.kind === 'house_big') return 5;
      if (b.kind === 'apartment') return Math.max(4, b.floors * 3);
      if (b.kind === 'condo') return Math.max(6, b.floors * 3);
      return 2;
    }
    // ponto caminhável próximo de uma porta
    doorTile(b) { return { x: b.door.x + .5 + (b.door.side === 'w' ? -.5 : b.door.side === 'e' ? .5 : 0), y: b.door.y + .5 + (b.door.side === 'n' ? -.5 : b.door.side === 's' ? .5 : 0) }; }
    // calçada mais próxima (para pedestres)
    nearestPedWalkable(x, y, r) {
      r = r || 9;
      for (let rad = 0; rad <= r; rad++) {
        for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
          const tx = (x + dx) | 0, ty = (y + dy) | 0;
          if (this.isPedWalkable(tx, ty)) return { x: tx + .5, y: ty + .5 };
        }
      }
      return this.nearestWalkable(x, y, r);
    }
    // snap para tile caminhável mais próximo
    nearestWalkable(x, y, r) {
      r = r || 8;
      for (let rad = 0; rad <= r; rad++) {
        for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
          const tx = (x + dx) | 0, ty = (y + dy) | 0;
          if (this.isWalkable(tx, ty)) return { x: tx + .5, y: ty + .5 };
        }
      }
      return { x, y };
    }
    // posição de estacionamento em frente a um prédio
    parkingSpot(b, rnd) {
      const d = b.door;
      for (let k = 0; k < 14; k++) {
        const off = 2 + (rnd() * 8 | 0);
        let x, y;
        if (d.side === 's') { x = d.x + (rnd() < .5 ? 1 : -1) * (2 + k); y = d.y + 3 + (rnd() * 2 | 0); }
        else if (d.side === 'n') { x = d.x + (rnd() < .5 ? 1 : -1) * (2 + k); y = d.y - 3 - (rnd() * 2 | 0); }
        else if (d.side === 'e') { y = d.y + (rnd() < .5 ? 1 : -1) * (2 + k); x = d.x + 3 + (rnd() * 2 | 0); }
        else { y = d.y + (rnd() < .5 ? 1 : -1) * (2 + k); x = d.x - 3 - (rnd() * 2 | 0); }
        if (this.isRoad(x | 0, y | 0)) return { x, y };
      }
      return { x: d.x, y: d.y + 3 };
    }
    // ponto de spawn em rua (para veículos de NPC)
    randomRoadPoint(rnd) {
      for (let k = 0; k < 60; k++) {
        const x = rnd() * this.W, y = rnd() * this.H;
        if (this.isRoad(x | 0, y | 0)) return { x, y };
      }
      return { x: this.W / 2, y: this.H / 2 };
    }
    // zona no ponto
    zoneAt(x, y) {
      const d = this.districtAt(x, y);
      return d ? d.zone : 'RESIDENTIAL';
    }
  };

  /* ===================================================================== */
  /* INTERIORES PROCEDURAIS                                                */
  /* ===================================================================== */
  const IT = LIFE.IT = { FLOOR: 0, WALL: 1, FURN: 2, DOOR: 3, WATER: 4 };
  const FURN_DEF = {
    balcao: { w: 3, h: 1, solid: true, color: '#8a6a4a', label: 'Balcão' },
    caixa: { w: 2, h: 1, solid: true, color: '#5a7f9a', label: 'Caixa' },
    prateleira: { w: 1, h: 5, solid: true, color: '#b0a48c', label: 'Prateleira' },
    geladeira: { w: 1, h: 2, solid: true, color: '#c8d4dc' },
    fogao: { w: 2, h: 1, solid: true, color: '#8a8a8a' },
    pia: { w: 2, h: 1, solid: true, color: '#b8c4cc' },
    mesa: { w: 2, h: 2, solid: true, color: '#9a7a52' },
    cadeira: { w: 1, h: 1, solid: false, color: '#7a6242' },
    sofa: { w: 3, h: 1, solid: true, color: '#7a6a8a' },
    tv: { w: 2, h: 1, solid: true, color: '#22262b' },
    cama: { w: 2, h: 3, solid: true, color: '#c8b8a0' },
    guarda_roupa: { w: 1, h: 2, solid: true, color: '#8a6a4a' },
    banheiro: { w: 1, h: 1, solid: true, color: '#e8f0f4' },
    chuveiro: { w: 1, h: 1, solid: true, color: '#bcd8e0' },
    balcão_bar: { w: 4, h: 1, solid: true, color: '#5a3f2a' },
    mesa_reuniao: { w: 4, h: 2, solid: true, color: '#6a5a4a' },
    mesa_escritorio: { w: 2, h: 1, solid: true, color: '#8a7a5a' },
    computador: { w: 1, h: 1, solid: false, color: '#2a2e33' },
    estante: { w: 1, h: 3, solid: true, color: '#7a6a52' },
    recepcao: { w: 3, h: 1, solid: true, color: '#a08a6a' },
    cama_hotel: { w: 2, h: 3, solid: true, color: '#e0d8c8' },
    poltrona: { w: 1, h: 1, solid: false, color: '#8a5a5a' },
    tanque: { w: 2, h: 2, solid: true, color: '#9aa4ac', label: 'Tanque' },
    esteira: { w: 1, h: 4, solid: true, color: '#5a5e63' },
    caixa_estoque: { w: 2, h: 2, solid: true, color: '#b08a5a' },
    maca: { w: 1, h: 3, solid: true, color: '#dfe8ee' },
    lousa: { w: 3, h: 1, solid: true, color: '#2c4a3a' },
    carteira: { w: 1, h: 2, solid: true, color: '#a8906a' },
    altar_balcao: { w: 2, h: 1, solid: true, color: '#c0a070' },
    tanque_agua: { w: 3, h: 3, solid: true, color: '#7a9ab0' },
    conteiner: { w: 4, h: 2, solid: true, color: '#a05a4a' },
    pallet: { w: 2, h: 2, solid: false, color: '#c0a878' },
    vitrine: { w: 3, h: 1, solid: true, color: '#9ac4d0' },
    bancada: { w: 3, h: 1, solid: true, color: '#8a9aa2' },
    sofa_lobby: { w: 4, h: 1, solid: true, color: '#7a5a5a' },
    porta_giratoria: { w: 2, h: 1, solid: false, color: '#d8c8a8' }
  };

  // Plantas por tipo de prédio
  const PLANS = {
    house: { w: 15, h: 12, rooms: ['sala', 'cozinha', 'quarto', 'banheiro', 'quarto'] },
    apartment: { w: 14, h: 11, rooms: ['sala', 'cozinha', 'quarto', 'banheiro'] },
    office: { w: 20, h: 16, rooms: ['recepcao', 'open', 'sala_reuniao', 'copa', 'banheiro'] },
    bank: { w: 18, h: 14, rooms: ['recepcao', 'caixas', 'gerencia', 'cofre'] },
    mall: { w: 26, h: 20, rooms: ['atrio', 'lojas', 'praça_alimentacao', 'banheiro'] },
    shop: { w: 13, h: 10, rooms: ['loja', 'estoque', 'banheiro'] },
    bakery: { w: 13, h: 10, rooms: ['balcao', 'cozinha', 'estoque'] },
    pharmacy: { w: 13, h: 10, rooms: ['loja', 'balcao', 'estoque'] },
    restaurant: { w: 17, h: 13, rooms: ['salão', 'cozinha', 'banheiro', 'estoque'] },
    bar: { w: 14, h: 11, rooms: ['salão', 'balcao', 'banheiro'] },
    supermarket: { w: 26, h: 19, rooms: ['corredores', 'caixas', 'estoque', 'escritorio', 'banheiro'] },
    hotel: { w: 22, h: 17, rooms: ['lobby', 'corredor', 'quarto_hotel', 'restaurante_hotel', 'administracao', 'banheiro'] },
    hospital: { w: 24, h: 18, rooms: ['recepcao', 'corredor', 'enfermaria', 'sala_cirurgia', 'farmacia_hosp', 'banheiro'] },
    clinic: { w: 15, h: 12, rooms: ['recepcao', 'consultorio', 'consultorio', 'banheiro'] },
    school: { w: 22, h: 16, rooms: ['patio', 'sala_aula', 'sala_aula', 'biblioteca', 'banheiro'] },
    university: { w: 28, h: 20, rooms: ['atrio', 'auditorio', 'laboratorio', 'biblioteca', 'sala_aula', 'banheiro'] },
    police: { w: 18, h: 14, rooms: ['recepcao', 'delegado', 'carceragem', 'sala_operacoes'] },
    firestation: { w: 20, h: 16, rooms: ['garagem', 'alojamento', 'cozinha', 'sala_operacoes'] },
    courthouse: { w: 22, h: 17, rooms: ['atrio', 'tribunal', 'gabinete', 'carceragem'] },
    cityhall: { w: 22, h: 16, rooms: ['atrio', 'protocolo', 'gabinete', 'sala_reuniao'] },
    prison: { w: 26, h: 20, rooms: ['administracao', 'celas', 'patio', 'refeitorio', 'enfermaria', 'visita'] },
    factory: { w: 26, h: 18, rooms: ['linha_producao', 'estoque', 'escritorio', 'vestiario'] },
    warehouse: { w: 24, h: 17, rooms: ['deposito', 'docas', 'escritorio'] },
    garage: { w: 16, h: 13, rooms: ['oficina', 'estoque', 'espera'] },
    gas: { w: 16, h: 12, rooms: ['loja_conveniencia', 'caixa', 'banheiro'] },
    market: { w: 14, h: 11, rooms: ['loja', 'estoque'] },
    farm: { w: 16, h: 12, rooms: ['sala', 'cozinha', 'quarto', 'celeiro', 'banheiro'] },
    port: { w: 24, h: 16, rooms: ['docas', 'deposito', 'escritorio'] },
    airport: { w: 30, h: 20, rooms: ['sala_embarque', 'checkin', 'controle', 'praça_alimentacao', 'deposito'] },
    depot: { w: 20, h: 14, rooms: ['garagem', 'manutencao', 'escritorio'] },
    club: { w: 16, h: 12, rooms: ['pista', 'balcao', 'banheiro'] }
  };

  // receitas de sala: peças de mobília (x,y são relativos; -1 = aleatório dentro da sala)
  const ROOM_FURNITURE = {
    sala: [['sofa', 1, 1], ['tv', 1, 3], ['mesa', 4, 4], ['tapete', 3, 6]],
    cozinha: [['fogao', 1, 1], ['pia', 3, 1], ['geladeira', 1, 3], ['mesa', 4, 3]],
    quarto: [['cama', 1, 1], ['guarda_roupa', 4, 1], ['mesa_escritorio', 4, 4]],
    banheiro: [['banheiro', 1, 1], ['chuveiro', 3, 1], ['pia', 1, 3]],
    recepcao: [['recepcao', 2, 2], ['sofa_lobby', 2, 5], ['vitrine', 8, 1]],
    open: [['mesa_escritorio', 2, 2], ['computador', 3, 2], ['mesa_escritorio', 6, 5], ['estante', 10, 1], ['computador', 7, 5]],
    sala_reuniao: [['mesa_reuniao', 2, 2], ['computador', 2, 2], ['cadeira', 6, 4]],
    copa: [['mesa', 1, 1], ['geladeira', 5, 1], ['pia', 3, 1]],
    caixas: [['caixa', 2, 2], ['caixa', 6, 2], ['vitrine', 2, 5]],
    gerencia: [['mesa_escritorio', 2, 2], ['computador', 3, 2], ['estante', 6, 1]],
    cofre: [['estante', 2, 2], ['caixa_estoque', 5, 3]],
    atrio: [['sofa_lobby', 3, 3], ['vitrine', 8, 1], ['planta', 2, 8], ['escada', 12, 2]],
    lojas: [['vitrine', 2, 2], ['prateleira', 6, 2], ['prateleira', 10, 2], ['caixa', 14, 8]],
    'praça_alimentacao': [['mesa', 3, 3], ['mesa', 8, 3], ['mesa', 3, 8], ['balcao', 12, 6]],
    loja: [['prateleira', 1, 1], ['prateleira', 4, 1], ['vitrine', 7, 5], ['caixa', 2, 7]],
    estoque: [['caixa_estoque', 2, 2], ['prateleira', 6, 2], ['pallet', 2, 6]],
    balcao: [['balcao', 2, 2], ['vitrine', 7, 2], ['caixa', 2, 5]],
    salão: [['mesa', 2, 2], ['mesa', 6, 2], ['mesa', 2, 6], ['mesa', 7, 7], ['cadeira', 4, 3]],
    cozinha: [['fogao', 1, 1], ['pia', 4, 1], ['geladeira', 1, 3], ['bancada', 4, 4]],
    corredores: [['prateleira', 2, 2], ['prateleira', 5, 2], ['prateleira', 8, 2], ['prateleira', 11, 2], ['prateleira', 14, 2], ['prateleira', 17, 2]],
    caixas: [['caixa', 1, 2], ['caixa', 4, 2], ['caixa', 7, 2], ['caixa', 10, 2]],
    escritorio: [['mesa_escritorio', 2, 2], ['computador', 3, 2], ['estante', 6, 1]],
    lobby: [['recepcao', 2, 2], ['sofa_lobby', 2, 6], ['planta', 10, 2], ['elevador', 14, 2]],
    corredor: [['planta', 2, 1], ['planta', 8, 1], ['estante', 12, 1]],
    quarto_hotel: [['cama_hotel', 1, 1], ['mesa_escritorio', 5, 1], ['tv', 5, 4], ['poltrona', 2, 5]],
    restaurante_hotel: [['mesa', 2, 2], ['mesa', 7, 2], ['balcao', 2, 6]],
    administracao: [['mesa_escritorio', 2, 2], ['computador', 3, 2], ['estante', 7, 1]],
    enfermaria: [['maca', 1, 1], ['maca', 4, 1], ['maca', 7, 1], ['estante', 10, 4]],
    sala_cirurgia: [['maca', 3, 3], ['bancada', 8, 2], ['estante', 2, 6]],
    farmacia_hosp: [['prateleira', 2, 1], ['prateleira', 5, 1], ['balcao', 8, 5]],
    consultorio: [['maca', 1, 1], ['mesa_escritorio', 5, 1], ['estante', 5, 4]],
    patio: [['cesta', 3, 3], ['banco', 8, 3], ['banco', 3, 8]],
    sala_aula: [['lousa', 2, 1], ['carteira', 2, 4], ['carteira', 5, 4], ['carteira', 8, 4]],
    biblioteca: [['estante', 1, 1], ['estante', 3, 1], ['estante', 5, 1], ['mesa', 6, 6], ['cadeira', 8, 7]],
    auditorio: [['carteira', 2, 3], ['carteira', 5, 3], ['carteira', 8, 3], ['carteira', 2, 6], ['carteira', 5, 6]],
    laboratorio: [['bancada', 2, 2], ['bancada', 7, 2], ['computador', 3, 5], ['estante', 10, 4]],
    delegado: [['mesa_escritorio', 2, 2], ['computador', 3, 2], ['estante', 6, 1]],
    carceragem: [['grade', 2, 2], ['cama', 2, 4], ['cama', 5, 4]],
    sala_operacoes: [['mesa_reuniao', 2, 2], ['computador', 3, 2], ['lousa', 8, 5]],
    garagem: [['carro_policia', 2, 3], ['carro_policia', 7, 3], ['tanque', 12, 1]],
    alojamento: [['cama', 2, 2], ['cama', 6, 2], ['sofa', 2, 6]],
    tribunal: [['bancada', 2, 2], ['mesa', 6, 6], ['carteira', 2, 6], ['carteira', 5, 6]],
    gabinete: [['mesa_escritorio', 2, 2], ['computador', 3, 2], ['estante', 7, 1], ['sofa', 2, 5]],
    protocolo: [['balcao', 2, 2], ['caixa', 6, 2], ['sofa_lobby', 2, 6]],
    celas: [['grade', 2, 2], ['cama', 2, 4], ['grade', 8, 2], ['cama', 8, 4]],
    refeitorio: [['mesa', 2, 2], ['mesa', 6, 2], ['mesa', 2, 6], ['balcao', 8, 6]],
    visita: [['mesa', 2, 3], ['mesa', 6, 3], ['cadeira', 3, 4]],
    linha_producao: [['esteira', 2, 3], ['esteira', 6, 3], ['esteira', 10, 3], ['caixa_estoque', 14, 2]],
    vestiario: [['armario', 2, 2], ['armario', 4, 2], ['banco', 6, 2]],
    deposito: [['caixa_estoque', 2, 2], ['caixa_estoque', 6, 2], ['caixa_estoque', 10, 2], ['pallet', 2, 6], ['conteiner', 10, 6]],
    docas: [['conteiner', 2, 2], ['conteiner', 8, 2], ['conteiner', 14, 2]],
    oficina: [['carro_oficina', 2, 2], ['carro_oficina', 7, 2], ['bancada', 2, 7], ['tanque', 10, 6]],
    espera: [['sofa', 2, 2], ['poltrona', 5, 2], ['planta', 7, 1]],
    loja_conveniencia: [['prateleira', 2, 1], ['prateleira', 4, 1], ['geladeira', 7, 1], ['balcao', 2, 5]],
    celeiro: [['cesta', 2, 2], ['pallet', 5, 2], ['cesta', 8, 2]],
    sala_embarque: [['carteira', 2, 3], ['carteira', 5, 3], ['carteira', 8, 3], ['carteira', 2, 7], ['carteira', 5, 7]],
    checkin: [['balcao', 2, 2], ['balcao', 6, 2], ['caixa', 10, 2]],
    controle: [['bancada', 2, 2], ['computador', 3, 2], ['computador', 6, 2]],
    manutencao: [['bancada', 2, 2], ['esteira', 6, 2], ['tanque', 10, 4]],
    pista: [['palco', 3, 1], ['balcao', 2, 5], ['mesa', 7, 5]]
  };
  // mobílias avulsas usadas por salas
  const EXTRA_FURN = {
    planta: { w: 1, h: 1, solid: false, color: '#3f7a4a' },
    escada: { w: 2, h: 2, solid: false, color: '#9a8a7a' },
    elevador: { w: 2, h: 2, solid: false, color: '#b0b8c0' },
    tapete: { w: 3, h: 2, solid: false, color: '#8a4a4a' },
    cesta: { w: 2, h: 2, solid: false, color: '#c08a4a' },
    banco: { w: 2, h: 1, solid: false, color: '#a08a6a' },
    grade: { w: 1, h: 3, solid: true, color: '#7a8288' },
    armario: { w: 1, h: 1, solid: true, color: '#8a7a6a' },
    palco: { w: 4, h: 2, solid: true, color: '#4a3a5a' },
    carro_policia: { w: 2, h: 4, solid: true, color: '#2a4a7a' },
    carro_oficina: { w: 2, h: 4, solid: true, color: '#7a8a94' }
  };
  for (const k in EXTRA_FURN) if (!FURN_DEF[k]) FURN_DEF[k] = EXTRA_FURN[k];
  // completa qualquer mobília citada nas salas que ainda não tenha definição
  for (const k in ROOM_FURNITURE) {
    for (const item of ROOM_FURNITURE[k]) {
      if (!FURN_DEF[item[0]]) FURN_DEF[item[0]] = { w: 1, h: 1, solid: false, color: '#9a8a7a' };
    }
  }
  LIFE.FURN_DEF = FURN_DEF;

  LIFE.buildInterior = function (building, seed) {
    const kind = building.interior;
    const plan = PLANS[kind] || PLANS.shop;
    const rnd = U.rng(this.seed + '#int' + building.id + (building.floor || 0));
    const w = plan.w, h = plan.h;
    const tiles = new Uint8Array(w * h);
    const furn = [];
    const idx = (x, y) => y * w + x;
    // paredes externas
    for (let x = 0; x < w; x++) { tiles[idx(x, 0)] = IT.WALL; tiles[idx(x, h - 1)] = IT.WALL; }
    for (let y = 0; y < h; y++) { tiles[idx(0, y)] = IT.WALL; tiles[idx(w - 1, y)] = IT.WALL; }
    // divisões: salas em grade com paredes
    const rooms = plan.rooms;
    const cols = Math.min(3, Math.ceil(Math.sqrt(rooms.length)));
    const rows = Math.ceil(rooms.length / cols);
    const cw = Math.floor((w - 2) / cols), ch = Math.floor((h - 2) / rows);
    const roomRects = [];
    let ri = 0;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols && ri < rooms.length; i++, ri++) {
        const x0 = 1 + i * cw, y0 = 1 + j * ch;
        const x1 = (i === cols - 1) ? w - 1 : x0 + cw;
        const y1 = (j === rows - 1) ? h - 1 : y0 + ch;
        roomRects.push({ name: rooms[ri], x0, y0, x1, y1 });
      }
    }
    // paredes entre salas + portas
    for (let j = 1; j < rows; j++) {
      const y = 1 + j * ch;
      for (let x = 1; x < w - 1; x++) tiles[idx(x, y)] = IT.WALL;
      const doorX = 2 + ((rnd() * (w - 4)) | 0);
      tiles[idx(doorX, y)] = IT.FLOOR; tiles[idx(doorX + 1, y)] = IT.FLOOR;
    }
    for (let i = 1; i < cols; i++) {
      const x = 1 + i * cw;
      for (let y = 1; y < h - 1; y++) tiles[idx(x, y)] = IT.WALL;
      const doorY = 2 + ((rnd() * (h - 4)) | 0);
      tiles[idx(x, doorY)] = IT.FLOOR; tiles[idx(x, doorY + 1)] = IT.FLOOR;
    }
    // portas externas: uma na parede sul (entrada) e possivelmente outra
    const entryX = Math.max(2, Math.min(w - 3, (w / 2) | 0));
    tiles[idx(entryX, h - 1)] = IT.DOOR; tiles[idx(entryX + 1, h - 1)] = IT.DOOR;
    tiles[idx(entryX, h - 2)] = IT.FLOOR; tiles[idx(entryX + 1, h - 2)] = IT.FLOOR;
    if ((w > 16 || h > 14) && rnd() < .8) {
      const bx = 2 + ((rnd() * (w - 5)) | 0);
      tiles[idx(bx, 0)] = IT.DOOR; tiles[idx(bx, 1)] = IT.FLOOR;
    }
    // mobília por sala
    for (const r of roomRects) {
      const rec = ROOM_FURNITURE[r.name] || ROOM_FURNITURE.loja || [];
      for (const item of rec) {
        const def = FURN_DEF[item[0]] || { w: 1, h: 1, solid: false, color: '#999' };
        let fx = r.x0 + 1 + item[1], fy = r.y0 + 1 + item[2];
        if (fx + def.w > r.x1 - 1) fx = Math.max(r.x0 + 1, r.x1 - 1 - def.w);
        if (fy + def.h > r.y1 - 1) fy = Math.max(r.y0 + 1, r.y1 - 1 - def.h);
        const f = { type: item[0], x: fx, y: fy, w: def.w, h: def.h, solid: def.solid !== false, color: def.color, room: r.name };
        // verifica se cabe sem sobrepor entrada/saída
        let ok = true;
        for (const o of furn) if (fx < o.x + o.w && fx + def.w > o.x && fy < o.y + o.h && fy + def.h > o.y) { ok = false; break; }
        if (!ok) continue;
        furn.push(f);
        if (def.solid !== false) {
          for (let y = fy; y < fy + def.h; y++) for (let x = fx; x < fx + def.w; x++) {
            if (x > 0 && y > 0 && x < w - 1 && y < h - 1) tiles[idx(x, y)] = IT.FURN;
          }
        }
      }
      // pontos de interação por tipo de sala
    }
    const spots = [];
    const pickRoom = (name) => roomRects.find((r) => r.name === name) || roomRects[0];
    const centerOf = (r) => ({ x: ((r.x0 + r.x1) / 2) | 0, y: ((r.y0 + r.y1) / 2) | 0 });
    // caixa/balcão: local de compra
    const tillRoom = roomRects.find((r) => ['caixas', 'balcao', 'recepcao', 'loja_conveniencia', 'checkin', 'lojas', 'corredores'].includes(r.name));
    if (tillRoom) spots.push({ type: 'till', label: 'Atendimento', ...centerOf(tillRoom), room: tillRoom.name });
    // cama
    const bedRoom = roomRects.find((r) => ['quarto', 'quarto_hotel', 'alojamento', 'celas', 'enfermaria'].includes(r.name));
    if (bedRoom) spots.push({ type: 'bed', label: 'Dormir', ...centerOf(bedRoom), room: bedRoom.name });
    // banho
    const bathRoom = roomRects.find((r) => r.name === 'banheiro');
    if (bathRoom) spots.push({ type: 'shower', label: 'Tomar banho', ...centerOf(bathRoom), room: bathRoom.name });
    // cozinha
    const kit = roomRects.find((r) => ['cozinha', 'copa'].includes(r.name));
    if (kit) spots.push({ type: 'cook', label: 'Cozinhar', ...centerOf(kit), room: kit.room || kit.name });
    // mesa (comer)
    const sal = roomRects.find((r) => ['salão', 'praça_alimentacao', 'restaurante_hotel', 'refeitorio'].includes(r.name));
    if (sal) spots.push({ type: 'table', label: 'Sentar e comer', ...centerOf(sal), room: sal.name });
    // trabalho (postos de NPC)
    for (const r of roomRects) spots.push({ type: 'work', label: 'Trabalhar', ...centerOf(r), room: r.name });
    const spawn = { x: entryX + 0.5, y: h - 2.5 };
    return {
      buildingId: building.id, kind, w, h, tiles, furn, spots, rooms: roomRects,
      entry: spawn, exit: { x: entryX + 1, y: h - .5 }, rnd
    };
  };
})();
