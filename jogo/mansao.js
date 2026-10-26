/* =====================================================================
   MANSAO.JS — a mansão do chefão (estilo máfia), a parte "viva":
     • a mansão é SUA desde o começo (cama salva o jogo, cofre guarda dinheiro...)
     • PORTÃO AUTOMÁTICO: abre quando você chega perto e fecha quando você entra com a polícia atrás
     • SEGURANÇAS de terno e óculos escuros: ficam nos postos (portão, alameda, porta) e fazem ronda no terreno
     • eles atiram nos POLICIAIS que chegarem perto dos muros — mas NÃO em você
     • se você atacar um segurança, todos viram inimigos (e o portão fecha para você)
     • ZONA SEGURA: dentro dos muros a polícia não entra e o nível de procurado cai rápido
   O terreno, os muros e a casa são montados em world.js (dev/pieces/p7_mansao.js e p8_mansao_arte.js).
   O interior da casa está em mansao_int.js.
   ===================================================================== */
(function (G) {
  'use strict';
  const W = G.world, M = W.MANSAO;
  if (!M) return;
  const L = G.lugares, TAU = Math.PI * 2, mu = M.mu, mv = M.mv;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrap = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
  const dentro = (x, y) => x > M.x + 36 && x < M.x + M.w - 36 && y > M.y + 36 && y < M.y + M.h - 36;   // dentro dos muros
  const GT = []; for (let u = M.portao.u0; u < M.portao.u1; u++) GT.push((M.ty0 + 47) * W.TW + M.tx0 + u);   // tiles do vão do portão
  const PELES = ['#f0c8a0', '#d9a577', '#b98a62', '#8a5a3a', '#5a3a26'];
  const FALAS = ['Boa tarde, chefe. Tudo tranquilo por aqui.', 'Ninguém passa pelo portão sem o senhor mandar.', 'Se a polícia aparecer, a gente cuida, chefe.', 'O portão abre sozinho quando o senhor chega.',
    'Fiz a ronda agora: nem um gato lá fora.', 'Quer que eu chame o motorista, chefe?', 'Hoje a noite promete, hein?', 'A piscina está limpa, chefe. Pode usar.'];

  // ---------- onde ficam os seguranças (postos fixos e rondas de ida e volta) ----------
  function defsPostos() {
    const c = M.casa, d = [];
    M.postos.portao.forEach(p => d.push({ tipo: 'posto', x: p.x, y: p.y, dir: Math.PI / 2 }));                       // no portão, olhando para fora (sul)
    [[35.7, 41], [40.3, 41]].forEach(([u, v]) => d.push({ tipo: 'posto', x: mu(u), y: mv(v), dir: Math.PI / 2 }));   // na alameda
    [-76, 76].forEach(dx => d.push({ tipo: 'posto', x: c.x + dx, y: c.y + 30, dir: Math.PI / 2 }));                  // um de cada lado da porta da mansão
    [[5, 2, 28, 2], [48, 2, 70, 2], [72, 6, 72, 41], [3.8, 6, 3.8, 41], [6, 44.4, 30, 44.4], [46, 44.4, 70, 44.4], [29.5, 22.3, 46.5, 22.3], [6, 30.5, 30, 30.5]]
      .forEach(([a, b, c2, e]) => d.push({ tipo: 'ronda', x: mu(a), y: mv(b), ax: mu(a), ay: mv(b), bx: mu(c2), by: mv(e) }));
    return d;
  }
  function criaSeguranca(def, S) {
    const g = G.ai.makePed(def.x, def.y);
    Object.assign(g, {
      kind: 'guarda', fixo: true, state: def.tipo === 'ronda' ? 'ronda' : 'posto', armed: true, weapon: Math.random() < 0.3 ? 'smg' : 'pistol', hp: 160,
      shirt: '#101014', pants: '#101014', shoe: '#08080a', skin: PELES[Math.floor(Math.random() * PELES.length)], hair: '#111114', hairStyle: 'curto', fem: false, dress: false,
      pat: 'liso', sleeve: 'longa', acc: 'shades', accCol: '#101014', cap: null, speed: 0, vx: 0, vy: 0, walk: 0, h: (def.dir || 0) + Math.PI / 2, nome: 'SEGURANÇA',
      fireT: 0, pausa: rand(0, 3), alvoRonda: 1, def
    });
    S.peds.push(g); return g;
  }

  const est = S => S.mansao || (S.mansao = { gate: 0, fechado: false, hostilT: 0, postos: null, t: 0, vao: 0, dentroAntes: false, somT: 0 });
  const algoNoVao = (S, mg) => {
    const gx = M.portao.x, gy = M.portao.y;
    const perto = o => o && Math.abs(o.x - gx) < 104 && Math.abs(o.y - gy) < 50;          // o vão do portão (6 tiles de largura)
    if (perto(S.player.car || S.player)) return true;
    for (const c of S.cars) if (!c.dead && perto(c)) return true;
    for (const p of S.peds) if (p.kind !== 'guarda' && p.state !== 'dead' && perto(p)) return true;   // os seguranças ficam fora do vão: não contam
    return false;
  };

  // ---------- chamado quando o JOGADOR machuca um segurança: todos viram inimigos ----------
  function hostilizar(S) {
    const st = est(S); st.hostilT = 120;
    S.peds.forEach(p => {
      if (p.kind !== 'guarda' || p.state === 'dead') return;
      p.kind = 'thug'; p.fixo = false; p.state = 'fight'; p.react = rand(0.3, 0.8); p.fireT = rand(0.3, 0.8); p.target = false;
    });
    G.say('Você atacou os seguranças! Agora eles são inimigos.', 4);
  }
  function guardaFerido(S, p, src) { if (src === 'player' || src === 'traffic') hostilizar(S); }

  // ---------- por quadro ----------
  function atualizar(S, dt) {
    if (S.mode !== 'play') return;
    const st = est(S), P = S.player, ref = P.car || P, c = M.casa;
    if (S.time + 0.5 < (st.ultimoT || 0)) { st.postos = null; st.carrosOk = false; st.gate = 0; st.fechado = false; st.hostilT = 0; }   // começou um jogo novo: recomeça tudo
    st.ultimoT = S.time; st.t += dt;
    // 1) a mansão é sua
    S.save.casas = S.save.casas || {}; if (!S.save.casas[c.id]) S.save.casas[c.id] = true;
    const longe = Math.hypot(ref.x - (M.x + M.w / 2), ref.y - (M.y + M.h / 2)) > 3300;
    const emDentro = dentro(ref.x, ref.y);
    // 2) portão automático
    if (!longe) {
      const dg = Math.hypot(ref.x - M.portao.x, ref.y - M.portao.y);
      let alvo = dg < 360 ? 1 : 0;
      if (emDentro && S.heatLevel > 0 && ref.y < M.portao.y - 120) alvo = 0;                  // polícia atrás: fecha depois que você passa
      if (st.hostilT > 0 && !(emDentro && dg < 260)) alvo = 0;                                 // seguranças inimigos: portão fechado (de dentro você ainda sai)
      if (alvo === 0 && algoNoVao(S)) alvo = 1;                                                // nunca prende ninguém no vão
      if (alvo !== st.alvo) { st.alvo = alvo; if (S.time - st.somT > 1.5) { G.snd.door(); st.somT = S.time; } }
      st.gate = clamp(st.gate + (alvo ? 1 : -1) * dt * 0.8, 0, 1);
      const fechado = st.gate <= 0.02;                                                         // fechado de verdade: o vão vira muro (sólido)
      if (fechado !== st.fechado) { st.fechado = fechado; GT.forEach(i => { W.tiles[i] = fechado ? W.TILE.BUILD : W.TILE.LOT; }); }
    }
    if (st.hostilT > 0) st.hostilT -= dt;
    // 3) zona segura: a polícia não entra e o procurado cai rápido
    if (emDentro) {
      if (S.heatLevel > 0 && !st.dentroAntes) G.say('Seguranças: "Aqui dentro a polícia não entra, chefe."', 4);
      if (S.heat > 0) S.heat = Math.max(0, S.heat - dt * 14);
      S.copHostile = false;
      S.peds.forEach(p => { if (p.kind === 'cop' && dentro(p.x, p.y)) p.dead = true; });
      S.cars = S.cars.filter(k => !(k.kind === 'police' && dentro(k.x, k.y)));
    }
    st.dentroAntes = emDentro;
    if (longe) return;
    // 3b) os carros da família ficam estacionados em frente à garagem (e são seus!)
    if (!st.carrosOk) { st.carrosOk = true; [['sedan', '#14141a', 8], ['sedan', '#2a2a32', 11], ['coupe', '#6a1f26', 14]].forEach(([kind, cor, u]) => { const k = new G.Car({ x: mu(u), y: mv(30.4), a: Math.PI / 2, kind, color: cor, driver: 'none', mode: 'parked', owned: true }); S.cars.push(k); }); }
    // 4) seguranças: repõe os que faltam e atualiza os que existem
    st.reposT = (st.reposT || 0) - dt;
    if (!st.postos) st.postos = defsPostos().map(def => ({ def, ref: null, morreuT: 0 }));
    if (st.reposT <= 0) {
      st.reposT = 1;
      st.postos.forEach(po => {
        const vivo = po.ref && po.ref.kind === 'guarda' && S.peds.includes(po.ref);
        if (vivo) { po.morreuT = 0; return; }
        po.morreuT += 1;
        if (!po.ref || (st.hostilT <= 0 && po.morreuT > (po.ref ? 25 : 0))) po.ref = criaSeguranca(po.def, S), po.morreuT = 0;
      });
    }
    S.peds.forEach(p => { if (p.kind === 'guarda') guarda(S, p, dt, ref); });
  }

  // procura o policial (a pé ou de viatura) mais perto, com linha de tiro livre
  function alvoPolicia(S, g) {
    let best = null, bd = 430;
    for (const p of S.peds) { if (p.kind !== 'cop' || p.state === 'dead' || p.dead) continue; const d = Math.hypot(p.x - g.x, p.y - g.y); if (d < bd && G.ai.lineClear(g.x, g.y, p.x, p.y)) { bd = d; best = p; } }
    for (const k of S.cars) { if (k.kind !== 'police' || k.dead) continue; const d = Math.hypot(k.x - g.x, k.y - g.y); if (d < bd && G.ai.lineClear(g.x, g.y, k.x, k.y)) { bd = d; best = k; } }
    return best;
  }
  function guarda(S, p, dt, ref) {
    if (p.state === 'dead') {                                 // corpo some depois de um tempo (o posto é reposto)
      p.corpseT = (p.corpseT || 0) + dt; p.pool = Math.min(1, p.corpseT / 3.5);
      const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt; if (!W.isSolid(nx, p.y)) p.x = nx; else p.vx = 0; if (!W.isSolid(p.x, ny)) p.y = ny; else p.vy = 0;
      p.vx *= 0.9; p.vy *= 0.9; if (p.corpseT > 60) p.dead = true; return;
    }
    if (p.flashT > 0) p.flashT -= dt;
    if (p.punchT > 0) p.punchT -= dt;
    if (p.vx || p.vy) {                                       // empurrão de tiro
      const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt; if (!W.isSolid(nx, p.y)) p.x = nx; if (!W.isSolid(p.x, ny)) p.y = ny;
      p.vx *= 0.85; p.vy *= 0.85; if (Math.abs(p.vx) + Math.abs(p.vy) < 4) p.vx = p.vy = 0;
    }
    p.fireT -= dt;
    const alvo = alvoPolicia(S, p);
    if (alvo) {                                               // polícia à vista: mira e atira (só em policiais)
      const ang = Math.atan2(alvo.y - p.y, alvo.x - p.x);
      p.state = 'fight'; p.walk = 0; p.h += wrap(ang + Math.PI / 2 - p.h) * Math.min(1, 10 * dt);
      if (p.fireT <= 0) {
        const w = G.combat.WEAPONS[p.weapon] || G.combat.WEAPONS.pistol, mx = p.x + Math.cos(ang) * 12, my = p.y + Math.sin(ang) * 12;
        G.combat.fireBullet(S, { x: mx, y: my, a: ang + rand(-0.06, 0.06), speed: w.speed * 0.72, dmg: 15, own: 'guarda', range: 520 });
        p.flashT = 0.07; G.particle({ x: mx, y: my, vx: 0, vy: 0, life: 0.07, size: 10, col: 'flash' }); G.snd.gun(w.snd, 0.7);
        p.burst = (p.burst || 0) + 1; p.fireT = p.weapon === 'smg' ? (p.burst % 6 === 0 ? 0.9 : 0.16) : rand(0.35, 0.6);
      }
      return;
    }
    if (p.state === 'fight') p.state = p.def && p.def.tipo === 'ronda' ? 'ronda' : 'posto';
    const dp = Math.hypot(ref.x - p.x, ref.y - p.y);
    if (p.state === 'ronda') {                                // anda de um ponto ao outro, parando um pouco nas pontas
      p.pausa -= dt;
      if (p.pausa > 0) { p.walk = 0; return; }
      const d = p.def, tx = p.alvoRonda ? d.bx : d.ax, ty = p.alvoRonda ? d.by : d.ay, dx = tx - p.x, dy = ty - p.y, dist = Math.hypot(dx, dy);
      if (dist < 8) { p.alvoRonda = p.alvoRonda ? 0 : 1; p.pausa = rand(2, 5); p.walk = 0; return; }
      const sp = 54, nx = p.x + dx / dist * sp * dt, ny = p.y + dy / dist * sp * dt;
      if (W.isSolid(nx, ny)) { p.alvoRonda = p.alvoRonda ? 0 : 1; p.pausa = 1; return; }       // bateu em algo: volta
      p.x = nx; p.y = ny; p.walk += sp * dt * 0.22; p.h += wrap(Math.atan2(dy, dx) + Math.PI / 2 - p.h) * Math.min(1, 8 * dt);
    } else {                                                  // no posto: parado, acompanhando você com o olhar quando passa perto
      p.walk = 0;
      const alvoH = dp < 380 ? Math.atan2(ref.y - p.y, ref.x - p.x) + Math.PI / 2 : p.def.dir + Math.PI / 2;
      p.h += wrap(alvoH - p.h) * Math.min(1, 3 * dt);
    }
  }

  // ---------- desenho: as duas folhas do portão (por baixo dos personagens) ----------
  function folha(ctx, hx, hy, dir, ang) {
    const Lf = 3 * W.T - 4, cs = Math.cos(ang), alt = 48;
    ctx.save(); ctx.translate(hx, hy); ctx.scale(dir, 1);
    const w = Lf * cs;                                                    // largura que aparece de frente
    if (w > 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(4, -alt + 8, w, alt);
      ctx.fillStyle = '#15151a'; ctx.fillRect(0, -alt, w, 5); ctx.fillRect(0, -alt / 2 - 2, w, 4); ctx.fillRect(0, -6, w, 6);       // travessas
      for (let x = 3; x < w - 2; x += 9) { ctx.fillStyle = '#15151a'; ctx.fillRect(x, -alt - 4, 3, alt + 4); ctx.fillStyle = '#e8c860'; ctx.fillRect(x, -alt - 7, 3, 4); }   // grades com ponta dourada
      ctx.fillStyle = '#e8c860'; ctx.beginPath(); ctx.arc(w * 0.78, -alt / 2, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#15151a'; ctx.fillRect(w * 0.78 - 3, -alt / 2 - 1, 6, 2);
    }
    const sn = Math.sin(ang), comp = Lf * sn;                              // aberta: aparece de lado, apontando para dentro (norte)
    if (comp > 3) { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(w + 2, -comp + 6, 6, comp); ctx.fillStyle = '#15151a'; ctx.fillRect(w - 1, -comp, 5, comp); ctx.fillStyle = '#e8c860'; ctx.fillRect(w - 1, -comp - 3, 5, 4); }
    ctx.restore();
  }
  function desenhar(ctx, S, inV, t) {
    const st = S.mansao; if (!st || !inV({ x: M.portao.x, y: M.portao.y })) return;
    const ang = st.gate * (Math.PI / 2 - 0.1), by = mv(48) + 4;
    folha(ctx, mu(35), by, 1, ang);                                        // esquerda: dobradiça no pilar esquerdo
    folha(ctx, mu(41), by, -1, ang);                                       // direita: espelhada
  }
  // arco de ferro com o nome da casa (por cima de tudo, como os arcos das pontes)
  function desenharAlto(ctx, S, vx0, vy0, vx1, vy1, t) {
    const x0 = mu(33), x1 = mu(43), y = mv(47) - 36;
    if (x1 < vx0 || x0 > vx1 || y + 80 < vy0 || y - 60 > vy1) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x0 + 8, mv(47) + 14, x1 - x0, 8);                         // sombra no chão
    ctx.fillStyle = '#15151a'; ctx.fillRect(x0, y, x1 - x0, 8); ctx.fillRect(x0, y + 12, x1 - x0, 3);          // vigas do arco
    for (let x = x0 + 6; x < x1; x += 14) { ctx.fillStyle = '#15151a'; ctx.fillRect(x, y + 15, 2, 12); }       // balaústres
    const cx = (x0 + x1) / 2, pw = 188;
    ctx.fillStyle = '#e8c860'; ctx.beginPath(); ctx.arc(cx, y - 8, 30, Math.PI, 0); ctx.fill();                // arco dourado em cima
    ctx.fillStyle = '#15151a'; ctx.fillRect(cx - pw / 2, y - 30, pw, 28);
    ctx.strokeStyle = '#e8c860'; ctx.lineWidth = 2; ctx.strokeRect(cx - pw / 2 + 2, y - 28, pw - 4, 24);
    ctx.fillStyle = '#e8c860'; ctx.font = 'bold 14px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('VILLA BELLAROSA', cx, y - 11); ctx.textAlign = 'left';
    ctx.fillStyle = '#e8c860'; [[x0 + 2, y - 3], [x1 - 6, y - 3]].forEach(([fx, fy]) => { ctx.beginPath(); ctx.arc(fx + 2, fy, 6, 0, TAU); ctx.fill(); });   // bolas douradas nos pilares
    ctx.restore();
  }

  // o motorista traz o carro preto da família até o pátio da mansão
  function chamarCarro(S) {
    const px = mu(33), py = mv(22);
    let k = S.carroMansao;
    if (!k || k.dead || !S.cars.includes(k)) {
      k = new G.Car({ x: px, y: py, a: 0, kind: 'sedan', color: '#101016', driver: 'none', mode: 'parked', owned: true });
      S.cars.push(k); S.carroMansao = k; G.say('O motorista trouxe o carro preto até o pátio da mansão.', 4);
    } else { k.x = px; k.y = py; k.a = 0; k.vx = k.vy = 0; G.say('O motorista levou o carro preto de volta ao pátio da mansão.', 4); }
  }

  // ---------- conversa com os seguranças ----------
  L.extrasAcao.push((S, P) => {
    for (const g of S.peds) {
      if (g.kind !== 'guarda' || g.state === 'dead' || Math.abs(g.x - P.x) > 46 || Math.abs(g.y - P.y) > 46) continue;
      return { t: 'lugar', s: 'E: FALAR COM O SEGURANÇA', run: () => { G.say('Segurança: "' + FALAS[Math.floor(Math.random() * FALAS.length)] + '"', 4); g.h = Math.atan2(P.y - g.y, P.x - g.x) + Math.PI / 2; } };
    }
    return null;
  });

  G.mansao = { M, atualizar, desenhar, desenharAlto, guardaFerido, hostilizar, dentro, chamarCarro };
})(window.G = window.G || {});
