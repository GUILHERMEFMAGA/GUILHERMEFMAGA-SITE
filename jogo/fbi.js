/* ============================================================
   fbi.js — os AGENTES DO FBI (robôs com cara de gente)
   Quatro agentes de terno e óculos escuros patrulham o mapa inteiro, cada um na sua região:
   andam pelas calçadas, ENTRAM em todos os estabelecimentos (auditoria completa da sala) e
   olham carros, pedestres, obras e pedágios. Tudo o que acham vai para o "super cache" do Olho de Deus
   (aperte F9 para ler), com detalhes: quem viu, onde (cidade, rua, quadra), qual carro, estado, posição.
   Os agentes não atrapalham o trânsito: são fantasmas para os carros (e nunca somem do mapa).
   ============================================================ */
(function (G) {
  'use strict';
  const W = G.world, T = W.T, TAU = Math.PI * 2, L = G.lugares, C = G.cidade, O = G.olho, SP = G.sprites, TILE = W.TILE;
  const F = G.fbi = { agentes: [], stats: { lugares: 0, ruas: 0, salas: 0, problemas: 0, caminhos: 0 } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // ---------- onde cada agente trabalha (colunas de quadras) ----------
  const REGIOES = [
    { b0: 0, b1: 2, nome: 'Agente Cruz', id: 'F1', setor: 'Ribeirão Oeste' },
    { b0: 4, b1: 8, nome: 'Agente Lima', id: 'F2', setor: 'Ribeirão Leste' },
    { b0: 10, b1: 12, nome: 'Agente Rocha', id: 'F3', setor: 'Novo Horizonte' },
    { b0: 14, b1: 16, nome: 'Agente Duarte', id: 'F4', setor: 'Vale Verde' }
  ];
  const caminhavel = (tx, ty) => { if (tx < 0 || ty < 0 || tx >= W.TW || ty >= W.TH) return false; const t = W.tiles[ty * W.TW + tx]; return t === TILE.SIDE || t === TILE.CROSS || t === TILE.GRASS || t === TILE.LOT; };

  // ---------- caminho (A* nas casas do mapa) ----------
  const NT = W.TW * W.TH, gS = new Float32Array(NT), vindo = new Int32Array(NT), fechado = new Uint8Array(NT);
  function caminho(ax, ay, bx, by, lim) {
    const sx = Math.floor(ax / T), sy = Math.floor(ay / T), tx = Math.floor(bx / T), ty = Math.floor(by / T);
    if (!caminhavel(tx, ty)) return null;
    gS.fill(1e9); fechado.fill(0); vindo.fill(-1);
    const heap = [], push = (k, f) => { heap.push([f, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top[1]; };
    const s = sy * W.TW + sx, goal = ty * W.TW + tx; gS[s] = 0; push(s, 0);
    let n = 0;
    while (heap.length && n < 120000) {
      const k = pop(); if (fechado[k]) continue; fechado[k] = 1; n++;
      if (k === goal) break;
      const x = k % W.TW, y = (k / W.TW) | 0;
      for (let d = 0; d < 4; d++) {
        const nx = x + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = y + (d === 2 ? 1 : d === 3 ? -1 : 0);
        if (nx < lim.x0 || nx > lim.x1 || !caminhavel(nx, ny)) continue;
        const nk = ny * W.TW + nx, g = gS[k] + 1; if (g < gS[nk]) { gS[nk] = g; vindo[nk] = k; push(nk, g + Math.abs(nx - tx) + Math.abs(ny - ty)); }
      }
    }
    if (vindo[goal] < 0 && goal !== s) return null;
    const pts = []; let k = goal; while (k !== s && k >= 0) { pts.push({ x: (k % W.TW + 0.5) * T, y: ((k / W.TW | 0) + 0.5) * T }); k = vindo[k]; }
    pts.reverse(); F.stats.caminhos++;
    // simplifica: só guarda as curvas
    const out = []; for (let i = 0; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], c = pts[i + 1]; if (!a || !c || (b.x - a.x) !== (c.x - b.x) || (b.y - a.y) !== (c.y - b.y)) out.push(b); }
    return out;
  }
  F.caminho = caminho;

  // ---------- criação dos agentes ----------
  const OLHOS = ['#f0c8a0', '#c89870', '#8a5a3a', '#e0b890'];
  function novoAgente(rg, k) {
    const x0 = (W.MG + rg.b0 * W.PITCH) - 1, x1 = (W.MG + (rg.b1 + 1) * W.PITCH + W.ROAD) + 1;
    const ag = {
      nome: rg.nome, id: rg.id, setor: rg.setor, lim: { x0, x1 }, estado: 'parado', t: 1 + k, rota: [], alvo: null, visitas: {}, scan: 0, aviso: -99, escondido: false,
      ped: { x: 0, y: 0, h: 0, d: 0, state: 'walk', walk: 0, hp: 100, vx: 0, vy: 0, kind: 'fbi', speed: 95, timer: 0, downT: 0, fleeT: 0, armed: false, weapon: 'fist', look: { shirt: '#ffffff', skin: OLHOS[k % 4], hair: '#15110e', fem: false, hairStyle: 'curto', dress: false, pat: 'liso', sleeve: 'longa', shoe: '#0c0c10', acc: 'shades', accCol: '#101014', pants: '#101016' } }
    };
    // começa numa calçada da região
    const sp = W.spots.filter(p => p.x / T >= x0 + 2 && p.x / T <= x1 - 2 && caminhavel(Math.floor(p.x / T), Math.floor(p.y / T)));
    const p0 = sp.length ? sp[Math.floor(sp.length * 0.4)] : { x: W.nodeX(rg.b0 + 1), y: W.nodeY(1) };
    ag.ped.x = ag.x = p0.x; ag.ped.y = ag.y = p0.y;
    return ag;
  }
  REGIOES.forEach((r, k) => F.agentes.push(novoAgente(r, k)));

  // ---------- o que cada agente visita ----------
  function alvosDe(ag) {
    const lista = [], dentro = x => x / T >= ag.lim.x0 && x / T <= ag.lim.x1;
    W.places.forEach(pl => { if (pl.tipo !== 'casa' && pl.id !== 'casa' && dentro(pl.x)) lista.push({ tipo: 'lugar', id: 'p:' + pl.id, x: pl.x, y: pl.y + 4, pl }); });
    G.cidade.lotes.forEach(l => { if (dentro(l.cx) && l.tam !== 'p') lista.push({ tipo: 'obra', id: 'o:' + l.id, x: l.tam === 'a' ? l.x + l.w / 2 : l.cx, y: l.y + l.h + 26, lote: l }); });
    // pontos de calçada: vigilância de rua em todos os cantos da região
    W.spots.forEach((p, i) => { if (dentro(p.x) && i % 3 === 0 && caminhavel(Math.floor(p.x / T), Math.floor(p.y / T))) lista.push({ tipo: 'rua', id: 's:' + i, x: p.x, y: p.y }); });
    return lista;
  }
  function escolheAlvo(ag) {
    const lista = alvosDe(ag); if (!lista.length) return null;
    let best = null, bs = 1e18;
    lista.forEach(a => { const v = ag.visitas[a.id] || 0, d = Math.hypot(a.x - ag.x, a.y - ag.y), s = v * 2200 + d + (a.tipo === 'lugar' ? -300 : a.tipo === 'obra' ? -150 : 0) + Math.random() * 80; if (s < bs) { bs = s; best = a; } });
    return best;
  }

  // ---------- auditoria completa de um estabelecimento ----------
  const palavras = s => String(s || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^A-Z0-9]+/).filter(w => w.length > 3);
  function auditaSala(ag, pl, sid, R) {
    const probs = [], fonte = 'FBI ' + ag.nome, ms0 = Date.now();
    const rep = (tipo, sev, msg, det) => { probs.push(tipo); F.stats.problemas++; O.registrar({ tipo, sev, fonte, msg: pl.nome + ' (' + sid + '): ' + msg, onde: G.cameras.onde(pl.x, pl.y), chave: tipo + ':' + pl.id + ':' + sid + ':' + (det && det.o || ''), detalhe: Object.assign({ lugar: pl.id, sala: sid, agente: ag.id }, det) }); };
    if (!isFinite(R.W) || !isFinite(R.H) || R.W <= 0 || R.H <= 0) { rep('sala-tamanho', 3, 'tamanho inválido', { W: R.W, H: R.H }); return { probs }; }
    // nome do letreiro x nome da sala
    const pa = palavras(pl.nome), ra = palavras(R.nome);
    if (R.nome && pa.length && !pa.some(w => ra.includes(w)) && !(R.subtitulo && palavras(R.subtitulo).some(w => pa.includes(w)))) rep('nome-nao-confere', 2, 'o letreiro diz "' + pl.nome + '" mas a sala se chama "' + R.nome + '"', { letreiro: pl.nome, sala: R.nome });
    if (pl.horario && (!Array.isArray(pl.horario) || pl.horario.length !== 2 || pl.horario.some(h => !isFinite(h) || h < 0 || h > 24))) rep('horario-invalido', 2, 'horário de funcionamento inválido', { horario: pl.horario });
    // porta de rua alcançável?
    if (sid === 'entrada') {
      const tx = Math.floor(pl.x / T), ty = Math.floor(pl.y / T);
      if (!caminhavel(tx, ty)) rep('porta-bloqueada', 3, 'a porta da rua está sobre um tile que não dá para pisar', { tx, ty, tile: W.tiles[ty * W.TW + tx] });
      else if (!caminhavel(tx, ty + 1) && !caminhavel(tx - 1, ty) && !caminhavel(tx + 1, ty)) rep('porta-ilhada', 2, 'a porta fica isolada (sem calçada em volta)', { tx, ty });
    }
    // objetos com números inválidos e alcançabilidade (grade de 16px)
    let interativos = 0, alcancados = 0;
    R.objs.forEach(o => { if (!isFinite(o.x + o.y + o.w + o.h)) rep('objeto-nan', 3, 'objeto "' + o.t + '" com coordenadas inválidas', { o: o.t }); });
    const livre = (x, y) => {
      if (x < R.x0 + 14 || x > R.x1 - 14 || y < R.y0 + 14) return false; if (y > R.y1 - 6 && Math.abs(x - R.portaX) > 30) return false;
      for (const o of R.objs) if (o.solid && x > o.x - 10 && x < o.x + o.w + 10 && y > o.y - (o.e || 0) * 0.35 - 8 && y < o.y + o.h + 8) return false; return true;
    };
    const gw = Math.ceil((R.x1 - R.x0) / 16) + 2, gh = Math.ceil((R.y1 - R.y0 + 60) / 16) + 2, vis = new Uint8Array(gw * gh);
    const cx = k => R.x0 + 8 + (k % gw) * 16, cy = k => R.y0 + 8 + ((k / gw) | 0) * 16;
    const sx0 = clamp(Math.round((R.portaX - R.x0 - 8) / 16), 0, gw - 1), sy0 = clamp(Math.round((R.y1 - 40 - R.y0 - 8) / 16), 0, gh - 1);
    if (!livre(R.portaX, R.y1 - 40)) rep('entrada-bloqueada', 3, 'o ponto de entrada da sala está bloqueado por um objeto', { x: R.portaX, y: R.y1 - 40 });
    else {
      const fila = [sy0 * gw + sx0]; vis[fila[0]] = 1;
      for (let i = 0; i < fila.length; i++) { const k = fila[i], x = k % gw, y = (k / gw) | 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) return; const nk = ny * gw + nx; if (!vis[nk] && livre(cx(nk), cy(nk))) { vis[nk] = 1; fila.push(nk); } }); }
      const alcanca = (zx, zy, zw, zh, r) => { for (let k = 0; k < vis.length; k++) if (vis[k]) { const px = cx(k), py = cy(k), dx = Math.max(zx - px, 0, px - (zx + zw)), dy = Math.max(zy - py, 0, py - (zy + zh)); if (dx * dx + dy * dy < r * r) return true; } return false; };
      R.objs.forEach(o => {
        if (!(o.act || o.menu || o.t === 'cofre') || o.t === 'porta' || o.invisivel) return;   // portas ficam na parede: o jogo as usa de perto interativos++;
        const z = o.zona || [o.x, o.y - (o.e || 0), o.w, o.h + (o.e || 0)];
        if (alcanca(z[0], z[1], z[2], z[3], o.r || 34)) alcancados++; else rep('objeto-inalcancavel', 2, 'objeto "' + o.t + '" não dá para alcançar', { o: o.t + '@' + Math.round(o.x) + ',' + Math.round(o.y), x: Math.round(o.x), y: Math.round(o.y) });
      });
    }
    R.npcs.forEach(n => {
      if (!isFinite(n.x + n.y)) { rep('npc-nan', 3, 'NPC com posição inválida', { o: n.nome || 'npc' }); return; }
      if (n.x < R.x0 - 4 || n.x > R.x1 + 4 || n.y > R.y1 + 30) rep('npc-fora', 2, 'NPC fora da sala (' + (n.nome || 'sem nome') + ')', { o: n.nome || 'npc', x: Math.round(n.x), y: Math.round(n.y) });
      else if (!n.semColisao && R.objs.some(o => o.solid && !o.invisivel && o.t !== 'barreira' && n.x > o.x + 4 && n.x < o.x + o.w - 4 && n.y > o.y + 4 && n.y < o.y + o.h - 4 && o.t !== 'tapete' && !o.sentavel)) { /* gente atrás do balcão é normal */ }
    });
    const cams = G.cameras.camsDe(R).length;
    if (pl.tipo !== 'casa' && !cams && !/^q\d/.test(sid)) rep('sem-camera', 2, 'sala sem câmera de segurança', { o: 'cam' });
    return { probs, info: { sala: sid, dim: Math.round(R.W) + 'x' + Math.round(R.H), objetos: R.objs.length, interativos, alcancaveis: alcancados, npcs: R.npcs.length, cameras: cams, ms: Date.now() - ms0 } };
  }
  F.auditar = function (ag, pl) {
    const salas = G.cameras.catalogo().filter(f => f.pl === pl), infos = []; let probs = 0;
    salas.forEach(f => {
      let R; try { R = L.salaVigiada(pl, f.sala); } catch (e) { probs++; F.stats.problemas++; O.registrar({ tipo: 'sala-erro', sev: 3, fonte: 'FBI ' + ag.nome, msg: pl.nome + ': a sala "' + f.sala + '" quebra ao abrir (' + String(e.message).slice(0, 80) + ')', onde: G.cameras.onde(pl.x, pl.y), chave: 'sala-erro:' + pl.id + ':' + f.sala, detalhe: { lugar: pl.id, sala: f.sala, pilha: String(e.stack || '').split('\n').slice(0, 5) } }); return; }
      if (!R) return;
      try { const r = auditaSala(ag, pl, f.sala, R); probs += r.probs.length; if (r.info) infos.push(r.info); F.stats.salas++; }
      catch (e) { probs++; O.erro(e, 'auditoria ' + pl.id); }
    });
    F.stats.lugares++;
    O.registrar({ tipo: 'auditoria', sev: probs ? 2 : 1, fonte: 'FBI ' + ag.nome, msg: ag.nome + ' entrou e auditou ' + pl.nome + ': ' + infos.length + ' sala(s), ' + infos.reduce((a, b) => a + b.cameras, 0) + ' câmera(s), ' + probs + ' problema(s)', onde: G.cameras.onde(pl.x, pl.y), chave: 'auditoria:' + pl.id, detalhe: { agente: ag.id, setor: ag.setor, salas: infos, aberto: pl.horario ? pl.horario.join('-') + 'h' : 'sempre' }, forcar: false });
    return probs;
  };

  // armado na frente de um agente (vigiado o tempo todo, não só quando ele anda)
  function vigiaArma(ag, S) {
    const P = S.player, ref = P.car || P;
    if (S.mode === 'play' && !P.car && (P.weapon === 'pistol' || P.weapon === 'smg' || P.weapon === 'shotgun') && Math.hypot(P.x - ag.x, P.y - ag.y) < 170 && S.time - ag.aviso > 25) {
      ag.aviso = S.time; G.say(ag.nome.toUpperCase() + ' (FBI): "Largue essa arma agora!"', 3.5); G.addHeat(14);
      G.cameras.registra('CRIME', ag.nome + ' viu o jogador armado na rua', 'crime', { x: P.x, y: P.y });
    }
  }

  // ---------- olhar a rua (carros, gente, obras, pedágios) ----------
  function olharRua(ag, S) {
    F.stats.ruas++; const fonte = 'FBI ' + ag.nome; let vistos = 0;
    S.cars.forEach(c => { if (!isFinite(c.x) || !isFinite(c.y) || Math.hypot(c.x - ag.x, c.y - ag.y) > 420) { if (isFinite(c.x) && isFinite(c.y)) return; } vistos++; O.diagnosticaCarro(c, S).forEach(d => O.trata(d, c, fonte, true)); });
    S.peds.forEach(p => { if (isFinite(p.x) && Math.hypot(p.x - ag.x, p.y - ag.y) > 380) return; O.diagnosticaPed(p, S).forEach(d => O.trata(d, p, fonte, true)); });
    G.pedagio.pracas.forEach(pr => { if (Math.abs((pr.x0 + pr.x1) / 2 - ag.x) < 900 && Math.abs(pr.mid - ag.y) < 700) pr.pistas.forEach(ps => { if (ps.ang != null && !isFinite(ps.ang)) O.registrar({ tipo: 'pedagio-cancela', sev: 3, fonte, msg: pr.nome + ': cancela com ângulo inválido', onde: G.cameras.onde(pr.x0, pr.mid) }); }); });
    // quebrada? só informa
    G.pedagio.pracas.forEach(pr => pr.pistas.forEach(ps => { if (ps.quebrada > 0 && Math.abs(ps.gx - ag.x) < 400 && Math.abs(pr.mid - ag.y) < 400) O.registrar({ tipo: 'pedagio-quebrado', sev: 2, fonte, msg: pr.nome + ': cancela quebrada à vista (manutenção chamada)', onde: G.cameras.onde(ps.gx, pr.mid), chave: 'pq:' + pr.nome }); }));
    return vistos;
  }

  // ---------- movimento e rotina ----------
  function atualizaAgente(ag, S, dt) {
    const p = ag.ped;
    if (ag.escondido) { ag.t -= dt; if (ag.t <= 0) { ag.escondido = false; ag.estado = 'parado'; ag.t = 0.4; p.x = ag.x; p.y = ag.y; } return; }
    if (ag.estado === 'parado') {
      ag.t -= dt; if (ag.t > 0) return;
      const a = escolheAlvo(ag); if (!a) { ag.t = 3; return; }
      ag.alvo = a; ag.visitas[a.id] = (ag.visitas[a.id] || 0) + 1;
      const rota = caminho(ag.x, ag.y, a.x, a.y, ag.lim);
      if (!rota || !rota.length) { ag.visitas[a.id] += 2; ag.t = 0.3; ag.falhas = (ag.falhas || 0) + 1; if (ag.falhas === 3) O.registrar({ tipo: 'agente-preso', sev: 2, fonte: 'FBI ' + ag.nome, msg: ag.nome + ' não achou caminho até ' + (a.pl ? a.pl.nome : a.id), chave: 'ap:' + ag.id + ':' + a.id, detalhe: { de: [Math.round(ag.x), Math.round(ag.y)], para: [Math.round(a.x), Math.round(a.y)] } }); return; }
      ag.falhas = 0; ag.rota = rota; ag.estado = 'andando'; return;
    }
    if (ag.estado === 'andando') {
      const q = ag.rota[0];
      if (!q) { chegou(ag, S); return; }
      const dx = q.x - ag.x, dy = q.y - ag.y, d = Math.hypot(dx, dy), v = 96 * dt;
      if (d <= v) { ag.x = q.x; ag.y = q.y; ag.rota.shift(); }
      else { ag.x += dx / d * v; ag.y += dy / d * v; p.walk += v * 0.22; const h = Math.atan2(dy, dx) + Math.PI / 2; p.h += Math.atan2(Math.sin(h - p.h), Math.cos(h - p.h)) * Math.min(1, 10 * dt); }
      p.x = ag.x; p.y = ag.y;
      ag.scan -= dt; if (ag.scan <= 0) { ag.scan = 1.3; olharRua(ag, S); }
      return;
    }
    if (ag.estado === 'olhando') {
      ag.t -= dt; p.walk = 0;
      if (ag.t <= 0) { ag.estado = 'parado'; ag.t = 0.3; }
    }
  }
  function chegou(ag, S) {
    const a = ag.alvo;
    if (a && a.tipo === 'lugar') {
      ag.estado = 'dentro'; ag.escondido = true; ag.t = 6 + Math.random() * 4;
      try { F.auditar(ag, a.pl); } catch (e) { O.erro(e, 'FBI auditar ' + a.pl.id); }
      return;
    }
    if (a && a.tipo === 'obra') {
      const l = a.lote, e = l.est || C.estadoDe(l);
      O.registrar({ tipo: 'inspecao-obra', sev: 1, fonte: 'FBI ' + ag.nome, msg: ag.nome + ' inspecionou a obra ' + (l.proj.nome || l.proj.tipo) + ' — ' + C.faseNome(e) + ' ' + Math.round(e.p * 100) + '%', onde: G.cameras.onde(l.cx, l.cy), chave: 'insp:' + l.id, detalhe: { lote: l.id, tipo: l.proj.tipo, fase: e.f, progresso: Math.round(e.p * 100), geral: Math.round(e.g * 100), terminaEm: Math.max(0, Math.round(l.proj.inicio + l.proj.dur - C.t)) + 's' } });
    }
    ag.estado = 'olhando'; ag.t = 2 + Math.random() * 2;
  }
  G.extras.add((S, dt) => { for (const ag of F.agentes) { try { atualizaAgente(ag, S, dt); if (!ag.escondido) vigiaArma(ag, S); } catch (e) { ag.estado = 'parado'; ag.t = 5; ag.escondido = false; O.erro(e, 'agente ' + ag.nome); } } });

  // ---------- desenho: agentes na rua ----------
  F.desenhar = function (ctx, S, inV, t) {
    F.agentes.forEach(ag => {
      if (ag.escondido || !inV(ag)) return;
      if (!ag.ped.shirt) Object.assign(ag.ped, ag.ped.look);   // o sprite lê as cores direto do pedestre
      SP.drawPed(ctx, ag.ped, t);
      const near = Math.hypot(S.player.x - ag.x, S.player.y - ag.y) < 260;
      ctx.save(); ctx.font = 'bold 7px Arial'; ctx.textAlign = 'center';
      const nm = near ? 'FBI · ' + ag.nome.replace('Agente ', '').toUpperCase() : 'FBI', w = ctx.measureText(nm).width + 8;
      ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(ag.x - w / 2, ag.y - 24, w, 10); ctx.fillStyle = '#ffe04a'; ctx.fillText(nm, ag.x, ag.y - 16.5); ctx.restore();
    });
  };
  F.dentroDe = pl => F.agentes.find(a => a.escondido && a.alvo && a.alvo.pl === pl) || null;
})(window.G = window.G || {});
