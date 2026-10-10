'use strict';
/* =========================================================
   Trânsito: faixas (mão direita), semáforos, curvas suaves
   nos cruzamentos, distância de segurança e troca de faixa.
   ========================================================= */

const World = { cars: [], peds: [], particles: [], pickups: [], flashes: [], time: 0, player: null, shake: 0, respawn: null };
const LIGHT_CYCLE = 16;

function lightState(node, vertical, time) {
  if (!node.lights) return 'G';
  const t = (time + node.offset) % LIGHT_CYCLE;
  if (vertical) return t < 6 ? 'G' : t < 7.5 ? 'Y' : 'R';
  return t >= 8 && t < 14 ? 'G' : t >= 14 && t < 15.5 ? 'Y' : 'R';
}

// Quanto tempo de vermelho ainda resta para o eixo (usado pelos pedestres)
function redLeft(node, vertical, time) {
  if (!node.lights) return 0;
  const t = (time + node.offset) % LIGHT_CYCLE;
  if (vertical) return t >= 7.5 ? LIGHT_CYCLE - t : 0;
  if (t >= 15.5) return 8 + (LIGHT_CYCLE - t);
  return t < 8 ? 8 - t : 0;
}

// Coordenada transversal do centro de cada faixa. lane 0 = interna (perto da faixa amarela), 1 = externa.
function laneCoord(road, dir, lane) {
  if (road.vertical) return dir === 3 ? (road.x + 2.5 + lane) * T : (road.x + 1.5 - lane) * T;
  return dir === 0 ? (road.y + 2.5 + lane) * T : (road.y + 1.5 - lane) * T;
}
const nodeStart = (road, n) => (road.vertical ? n.y0 : n.x0);
const nodeEnd = (road, n) => (road.vertical ? n.y1 : n.x1);
const dirPositive = (d) => d === 0 || d === 1;

function nextNodeAhead(road, dir, s, half) {
  const ns = road.nodes;
  if (dirPositive(dir)) {
    for (let i = 0; i < ns.length; i++) {
      const st = nodeStart(road, ns[i]);
      if (st >= s + half - 2) return { node: ns[i], d: st - (s + half) };
    }
    return { node: null, d: road.end - (s + half) };
  }
  for (let i = ns.length - 1; i >= 0; i--) {
    const en = nodeEnd(road, ns[i]);
    if (en <= s - half + 2) return { node: ns[i], d: (s - half) - en };
  }
  return { node: null, d: (s - half) - road.start };
}

function chooseExit(node, dir, lane) {
  const opts = [];
  for (let d = 0; d < 4; d++) {
    if (!node.exits[d] || d === (dir + 2) % 4) continue;
    const rel = d === dir ? 0 : d === (dir + 1) % 4 ? 1 : 2; // 0 reto, 1 direita, 2 esquerda
    opts.push([d, rel]);
  }
  if (!opts.length) return -1;
  let f = opts.filter(([, rel]) => rel === 0 || (lane === 1 && rel === 1) || (lane === 0 && rel === 2));
  if (!f.length) f = opts;
  let total = 0;
  for (const o of f) total += o[1] === 0 ? 3 : 2;
  let k = Math.random() * total;
  for (const o of f) { k -= o[1] === 0 ? 3 : 2; if (k <= 0) return o[0]; }
  return f[f.length - 1][0];
}

// ---- Reserva de cruzamento: só entra quem não cruza a trajetória de quem já está dentro ----
function turnRel(e, x) { return x === e ? 0 : x === (e + 1) % 4 ? 1 : x === (e + 3) % 4 ? 2 : 3; } // 0 reto, 1 direita, 2 esquerda, 3 retorno
function pathsCompatible(e1, x1, e2, x2) {
  if (e1 === e2) return true; // mesma aproximação: fila normal
  const r1 = turnRel(e1, x1), r2 = turnRel(e2, x2);
  if (r1 === 3 || r2 === 3) return false;
  if (e2 === (e1 + 2) % 4) return r1 !== 2 && r2 !== 2; // sentidos opostos: só conflita com conversão à esquerda
  return r1 === 1 && r2 === 1 && x1 !== x2; // perpendiculares: só duas conversões à direita
}
function nodeClear(c, node, exit) {
  if (!node.res) node.res = new Set();
  for (const o of node.res) {
    if (o === c) continue;
    if (o.removed || o.mode !== 'ai' || !o.ai || o.ai.resNode !== node) { node.res.delete(o); continue; }
    if (!pathsCompatible(c.ai.dir, exit, o.ai.resEntry, o.ai.resExit)) return false;
  }
  return true;
}
function reserveNode(c, node, exit) {
  const a = c.ai;
  if (!node.res) node.res = new Set();
  a.resNode = node; a.resEntry = a.dir; a.resExit = exit;
  node.res.add(c);
}
function releaseNode(c) {
  const a = c.ai;
  if (a && a.resNode) { if (a.resNode.res) a.resNode.res.delete(c); a.resNode = null; }
}

function bezier(p, t) {
  const u = 1 - t;
  return {
    x: u * u * p.p0.x + 2 * u * t * p.p1.x + t * t * p.p2.x,
    y: u * u * p.p0.y + 2 * u * t * p.p1.y + t * t * p.p2.y,
  };
}
function bezierDir(p, t) {
  const dx = 2 * (1 - t) * (p.p1.x - p.p0.x) + 2 * t * (p.p2.x - p.p1.x);
  const dy = 2 * (1 - t) * (p.p1.y - p.p0.y) + 2 * t * (p.p2.y - p.p1.y);
  const l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l];
}

function makeAI(road, dir, lane, s) {
  return {
    road, dir, lane, s, mode: 'lane', path: null, cruise: randRange(72, 98),
    wait: 0, plan: null, planNode: null, lc: null, blocker: null, honkT: 0,
  };
}

function placeAICar(c) {
  const a = c.ai;
  if (a.mode === 'lane') {
    let lat = laneCoord(a.road, a.dir, a.lane);
    let ang = DIR_ANG[a.dir];
    if (a.lc) {
      const k = a.lc.t * a.lc.t * (3 - 2 * a.lc.t);
      const delta = lat - a.lc.from;
      lat = lerp(a.lc.from, lat, k);
      const [fx, fy] = DIRS[a.dir];
      const dx = a.road.vertical ? delta : 0, dy = a.road.vertical ? 0 : delta;
      ang += Math.sin(a.lc.t * Math.PI) * 0.22 * Math.sign(fx * dy - fy * dx);
    }
    if (a.road.vertical) { c.x = lat; c.y = a.s; } else { c.x = a.s; c.y = lat; }
    c.angle = ang;
  } else {
    const p = bezier(a.path, a.path.t);
    c.x = p.x; c.y = p.y;
    const [fx, fy] = bezierDir(a.path, Math.min(0.999, a.path.t));
    c.angle = Math.atan2(fy, fx);
  }
}

function startTurn(c, node) {
  const a = c.ai;
  let d = a.planNode === node && a.plan !== null ? a.plan : chooseExit(node, a.dir, a.lane);
  a.plan = null; a.planNode = null;
  if (a.lc) a.lc = null;
  if (d === -1) d = (a.dir + 2) % 4;
  if (a.resNode !== node) { releaseNode(c); reserveNode(c, node, d); }
  const exitRoad = d === 0 || d === 2 ? node.h : node.v;
  const half = c.len / 2;
  const p0 = { x: c.x, y: c.y };
  const lc = laneCoord(exitRoad, d, a.lane);
  let p2;
  if (d === 0) p2 = { x: node.x1 + half, y: lc };
  else if (d === 2) p2 = { x: node.x0 - half, y: lc };
  else if (d === 1) p2 = { x: lc, y: node.y1 + half };
  else p2 = { x: lc, y: node.y0 - half };
  let p1;
  if (d === a.dir) p1 = { x: (p0.x + p2.x) / 2, y: (p0.y + p2.y) / 2 };
  else if (a.road.vertical) p1 = { x: p0.x, y: p2.y };
  else p1 = { x: p2.x, y: p0.y };
  const path = { p0, p1, p2, t: 0, len: 0, d, exitRoad, straight: d === a.dir };
  let prev = p0, len = 0;
  for (let i = 1; i <= 12; i++) { const q = bezier(path, i / 12); len += Math.hypot(q.x - prev.x, q.y - prev.y); prev = q; }
  path.len = Math.max(1, len);
  a.path = path;
  a.mode = 'turn';
}

function finishTurn(c) {
  const a = c.ai, p = a.path;
  a.road = p.exitRoad;
  a.dir = p.d;
  a.s = p.d === 0 || p.d === 2 ? p.p2.x : p.p2.y;
  a.mode = 'lane';
  a.path = null;
  releaseNode(c);
}

function stopSpeed(d) { return d <= 0.5 ? 0 : Math.sqrt(2 * 170 * d); }

// Procura o obstáculo mais próximo à frente (carros, pedestres, jogador)
function scanAhead(c, fx, fy, look) {
  let best = Infinity, who = null;
  const rx = -fy, ry = fx;
  const half = c.len / 2, hw = c.wid / 2;
  const a = c.ai;
  const inTurn = a.mode === 'turn';
  const cars = World.cars;
  for (let i = 0; i < cars.length; i++) {
    const o = cars[i];
    if (o === c || o.removed) continue;
    const dx = o.x - c.x, dy = o.y - c.y;
    if (dx > look + 30 || dx < -look - 30 || dy > look + 30 || dy < -look - 30) continue;
    const along = dx * fx + dy * fy;
    if (along <= 0) continue;
    const ofx = Math.cos(o.angle), ofy = Math.sin(o.angle);
    const extR = Math.abs(ofx * rx + ofy * ry) * o.len / 2 + Math.abs(-ofy * rx + ofx * ry) * o.wid / 2;
    const lat = Math.abs(dx * rx + dy * ry);
    if (lat > hw + extR) continue;
    const extF = Math.abs(ofx * fx + ofy * fy) * o.len / 2 + Math.abs(-ofy * fx + ofx * fy) * o.wid / 2;
    const gap = along - half - extF;
    if (gap > look - half) continue;
    if (o.ai) {
      const same = ofx * fx + ofy * fy;
      if (a.wait > 9 && (inTurn || o.ai.mode === 'turn')) continue; // último recurso contra travamento
      if (inTurn && o.ai.mode === 'lane' && same < 0.3) continue;
      if (!inTurn && o.ai.mode === 'turn' && same < -0.5 && gap > 6) continue;
    }
    if (gap < best) { best = gap; who = o; }
  }
  const peds = World.peds;
  for (let i = 0; i < peds.length; i++) {
    const o = peds[i];
    if (o.inCar) continue;
    const dx = o.x - c.x, dy = o.y - c.y;
    if (dx > look + 10 || dx < -look - 10 || dy > look + 10 || dy < -look - 10) continue;
    const along = dx * fx + dy * fy;
    if (along <= 0) continue;
    if (Math.abs(dx * rx + dy * ry) > hw + 5) continue;
    const gap = along - half - 4;
    if (gap < best) { best = gap; who = o; }
  }
  const p = World.player;
  if (p && p.onFoot && p.alive) {
    const dx = p.x - c.x, dy = p.y - c.y;
    const along = dx * fx + dy * fy;
    if (along > 0 && along < look + 6 && Math.abs(dx * rx + dy * ry) < hw + 5) {
      const gap = along - half - 4;
      if (gap < best) { best = gap; who = p; }
    }
  }
  a.blocker = who;
  return best;
}

function laneFree(c, lane) {
  const a = c.ai;
  const lat = laneCoord(a.road, a.dir, lane);
  const sign = dirPositive(a.dir) ? 1 : -1;
  for (const o of World.cars) {
    if (o === c || o.removed) continue;
    const olat = a.road.vertical ? o.x : o.y;
    const os = a.road.vertical ? o.y : o.x;
    if (Math.abs(olat - lat) > 12) continue;
    const rel = (os - a.s) * sign;
    if (rel > -34 && rel < 56) return false;
  }
  return true;
}

function updateAICar(c, dt, time) {
  const a = c.ai;
  const half = c.len / 2;
  let target = a.cruise;
  let fx, fy;
  if (a.bump > 0) { a.bump -= dt; target = 0; }

  if (a.mode === 'lane') {
    [fx, fy] = DIRS[a.dir];
    const nn = nextNodeAhead(a.road, a.dir, a.s, half);
    if (nn.node) {
      let lightStop = false;
      if (nn.node.lights) {
        const st = lightState(nn.node, a.road.vertical, time);
        const stopD = nn.d - T - 3;
        if (st !== 'G' && stopD > -2) {
          if (st === 'R' || stopD > 10 + c.v * 0.3) {
            target = Math.min(target, stopSpeed(stopD)); lightStop = true;
            if (a.resNode === nn.node) releaseNode(c); // vai parar no sinal: libera o cruzamento
          }
        }
      }
      if (nn.d < 48) {
        if (a.planNode !== nn.node) { a.plan = chooseExit(nn.node, a.dir, a.lane); a.planNode = nn.node; }
        if (a.plan !== a.dir) target = Math.min(target, 46 + Math.max(0, nn.d) * 0.9);
        // ponto de decisão: reserva o cruzamento ou espera antes dele
        if (a.resNode !== nn.node && !lightStop && nn.node.nExits >= 3) {
          const exit = a.plan === -1 ? (a.dir + 2) % 4 : a.plan;
          const brake = (c.v * c.v) / 340;
          if (nn.d <= brake + T + 8) {
            if (nodeClear(c, nn.node, exit)) reserveNode(c, nn.node, exit);
            else { const sd = nn.d - T - 3; target = Math.min(target, stopSpeed(sd > 0 ? sd : nn.d - 1)); }
          }
        }
      }
    } else if (nn.d < 40) {
      target = Math.min(target, stopSpeed(nn.d));
    }
  } else {
    [fx, fy] = bezierDir(a.path, Math.min(0.999, a.path.t));
    if (!a.path.straight) target = Math.min(target, 50);
  }

  const look = 14 + c.v * 0.5 + half;
  const gap = scanAhead(c, fx, fy, look);
  if (gap < Infinity) target = Math.min(target, Math.max(0, (gap - 5) * 2.4));
  if (gap < 3) target = 0;

  if (c.v < target) c.v = Math.min(target, c.v + 80 * dt);
  else c.v = Math.max(target, c.v - 280 * dt);

  if (c.v < 3) a.wait += dt; else a.wait = Math.max(0, a.wait - dt * 2);

  // buzina quando travado pelo jogador
  if (a.wait > 2.5 && a.blocker && (a.blocker === World.player || a.blocker.mode === 'player')) {
    a.honkT -= dt;
    if (a.honkT <= 0) {
      a.honkT = randRange(1.5, 3.5);
      if (World.player && dist(c.x, c.y, World.player.x, World.player.y) < 160) Sound.horn();
    }
  }

  if (a.mode === 'lane') {
    // troca de faixa para desviar de carro parado / batido / jogador
    const b = a.blocker;
    if (!a.lc && a.wait > 1.4 && b && !(b.ai) && !b.isPed) {
      const nn = nextNodeAhead(a.road, a.dir, a.s, half);
      if (nn.d > 6 * T && laneFree(c, 1 - a.lane)) {
        a.lc = { from: laneCoord(a.road, a.dir, a.lane), t: 0 };
        a.lane = 1 - a.lane;
        a.wait = 0;
        c.v = Math.max(c.v, 25);
      }
    }
    if (a.lc) {
      a.lc.t += dt / 0.9;
      if (a.lc.t >= 1) a.lc = null;
      c.v = Math.max(c.v, a.blocker && gap < 2 ? 0 : 22);
    }
    a.s += (dirPositive(a.dir) ? 1 : -1) * c.v * dt;
    const nn2 = nextNodeAhead(a.road, a.dir, a.s, half);
    placeAICar(c);
    if (nn2.node && nn2.d <= 0) startTurn(c, nn2.node);
    else if (!nn2.node && nn2.d <= 0) { a.dir = (a.dir + 2) % 4; placeAICar(c); }
  } else {
    a.path.t += (c.v * dt) / a.path.len;
    if (a.path.t >= 1) { finishTurn(c); }
    placeAICar(c);
  }
}

// Escolhe um ponto livre numa faixa para criar um carro
function findLaneSpawn(len, avoid) {
  const roads = [...VROADS, ...HROADS];
  for (let tries = 0; tries < 60; tries++) {
    const road = pick(roads);
    const dir = road.vertical ? (Math.random() < 0.5 ? 1 : 3) : (Math.random() < 0.5 ? 0 : 2);
    const lane = Math.random() < 0.5 ? 0 : 1;
    const s = randRange(road.start + 24, road.end - 24);
    let bad = false;
    for (const n of road.nodes) {
      if (s > nodeStart(road, n) - T * 2 - len && s < nodeEnd(road, n) + T * 2 + len) { bad = true; break; }
    }
    if (bad) continue;
    const lat = laneCoord(road, dir, lane);
    const x = road.vertical ? lat : s, y = road.vertical ? s : lat;
    if (avoid && x > avoid.x0 && x < avoid.x1 && y > avoid.y0 && y < avoid.y1) continue;
    if (World.cars.some((o) => !o.removed && Math.abs(o.x - x) < 36 && Math.abs(o.y - y) < 36)) continue;
    if (World.player && dist(x, y, World.player.x, World.player.y) < 60) continue;
    return { road, dir, lane, s, x, y };
  }
  return null;
}

function nearestNode(x, y, filterFn) {
  let best = null, bd = Infinity;
  for (const n of City.nodes) {
    if (filterFn && !filterFn(n)) continue;
    const d = Math.hypot(n.cx - x, n.cy - y);
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}

// Caminho no grafo de cruzamentos (BFS), usado pela polícia
function nodePath(a, b) {
  if (a === b) return [a];
  const prev = new Map([[a, null]]);
  const q = [a];
  while (q.length) {
    const n = q.shift();
    if (n === b) break;
    for (const m of n.links) if (!prev.has(m)) { prev.set(m, n); q.push(m); }
  }
  if (!prev.has(b)) return [a];
  const out = [];
  for (let n = b; n; n = prev.get(n)) out.push(n);
  return out.reverse();
}

function lineClear(x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.ceil(d / 6);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (solidPx(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
  }
  return true;
}
