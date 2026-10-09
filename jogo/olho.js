/* ============================================================
   olho.js — O OLHO DE DEUS
   Um sistema INVISÍVEL: o jogador nunca o vê dentro do jogo. Ele observa tudo, o tempo todo,
   e só resolve problemas:
     • carros travados, fora do mapa, dentro de parede, empilhados ou com números quebrados;
     • pedestres e jogador presos em paredes; dinheiro/vida quebrados; telas inconsistentes;
     • salas com objetos inalcançáveis, NPCs presos, erros de JavaScript, queda de desempenho.
   Cada coisa achada vira um RELATÓRIO no "super cache" (guardado no navegador) com todos os detalhes
   (posição, rua, tipo do carro, estado, o que foi feito para consertar).
   F9 abre o painel para VOCÊ ler os relatórios. No console: G.olho.relatorio()  /  G.olho.exportar()
   ============================================================ */
(function (G) {
  'use strict';
  const W = G.world, T = W.T, TAU = Math.PI * 2;
  const KEY = 'ruaVermelha.olho';
  const O = G.olho = { cache: [], seq: 0, porChave: {}, stats: { varreduras: 0, achados: 0, consertos: 0, fps: 60, dtMed: 0.016 }, novos: 0, ligado: true, reduzido: false };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fin = v => typeof v === 'number' && isFinite(v);

  // ---------- cache persistente ----------
  function carrega() { try { const j = JSON.parse(localStorage.getItem(KEY)); if (j && Array.isArray(j.cache)) { O.cache = j.cache; O.seq = j.seq || O.cache.length; O.cache.forEach(r => { O.porChave[r.chave] = r; }); } } catch (e) { } }
  let sujo = false, salvaT = 0;
  function salva() {
    if (!sujo) return; sujo = false;
    try { localStorage.setItem(KEY, JSON.stringify({ seq: O.seq, cache: O.cache.slice(-120) })); } catch (e) { try { localStorage.setItem(KEY, JSON.stringify({ seq: O.seq, cache: O.cache.slice(-30) })); } catch (e2) { } }
  }
  carrega();

  // descreve um objeto sem pegar nada pesado (só números, textos e um nível de objetos pequenos)
  function snap(e) {
    const o = {};
    if (!e) return o;
    let n = 0;
    for (const k in e) {
      const v = e[k]; if (n > 60) break;
      if (typeof v === 'number') { o[k] = fin(v) ? Math.round(v * 100) / 100 : String(v); n++; }
      else if (typeof v === 'string' || typeof v === 'boolean') { o[k] = v; n++; }
      else if (v && typeof v === 'object' && !Array.isArray(v) && (k === 'nav' || k === 'look' || k === 'threat') && n < 50) { o[k] = {}; for (const q in v) { const w = v[q]; if (typeof w === 'number' || typeof w === 'string' || typeof w === 'boolean') o[k][q] = typeof w === 'number' && fin(w) ? Math.round(w * 100) / 100 : w; } }
    }
    return o;
  }
  function lugarDe(e) {
    if (!e || !fin(e.x) || !fin(e.y)) return { tile: null, onde: 'posição inválida' };
    const tx = Math.floor(e.x / T), ty = Math.floor(e.y / T), nomes = ['RUA', 'CALÇADA', 'PRÉDIO', 'GRAMA', 'ÁGUA', 'PONTE', 'FAIXA', 'ESTACIONAMENTO'];
    const tp = W.tileAt(e.x, e.y);
    return { tile: { tx, ty, tipo: nomes[tp] || tp }, onde: G.cameras ? G.cameras.onde(e.x, e.y) : tx + ',' + ty };
  }
  O.snap = snap; O.lugarDe = lugarDe;

  // registra um achado. r = { tipo, sev(1..3), fonte, msg, ent (entidade), detalhe, chave, corrigido, acao }
  O.registrar = function (r) {
    const S = G.S, chave = r.chave || (r.tipo + ':' + r.msg);
    let rec = O.porChave[chave];
    const agora = Date.now();
    if (rec && agora - rec.ult < 60000 && !r.forcar) {          // o mesmo problema de novo: só soma
      rec.n++; rec.ult = agora; if (r.corrigido) { rec.corrigido = true; rec.acao = r.acao || rec.acao; O.stats.consertos++; }
      if (r.fonte && rec.fontes.indexOf(r.fonte) < 0) rec.fontes.push(r.fonte);
      sujo = true; return rec;
    }
    const loc = r.ent ? lugarDe(r.ent) : { tile: null, onde: r.onde || '' };
    rec = {
      id: ++O.seq, chave, tipo: r.tipo, sev: r.sev || 1, fonte: r.fonte || 'OLHO', fontes: [r.fonte || 'OLHO'], msg: r.msg,
      hora: G.lugares ? G.lugares.horaTxt(S) : '', tempo: Math.round(S.time), real: new Date().toISOString(), n: 1, ult: agora,
      onde: r.onde || loc.onde, tile: loc.tile, ent: r.ent ? snap(r.ent) : null, detalhe: r.detalhe || null,
      mundo: { modo: S.mode, dentro: S.inside && S.inside.lugar ? S.inside.lugar.id + ':' + (S.inside.id || '') : null, carros: S.cars.length, pedestres: S.peds.length, procurado: S.heatLevel, dinheiro: S.save && S.save.money, fps: Math.round(O.stats.fps) },
      corrigido: r.corrigido === undefined && (r.sev || 1) <= 1 ? null : !!r.corrigido, acao: r.acao || ''
    };
    if (G.fbi && r.ent && r.ent.uid == null) { /* sem id: tudo bem */ }
    O.cache.push(rec); O.porChave[chave] = rec; O.stats.achados++; if (r.corrigido) O.stats.consertos++;
    if (O.cache.length > 300) { const x = O.cache.shift(); if (O.porChave[x.chave] === x) delete O.porChave[x.chave]; }
    O.novos++; sujo = true;
    if (rec.sev >= 3 && window.console) console.warn('[OLHO] ' + rec.tipo + ': ' + rec.msg);
    return rec;
  };
  // eventos de outros sistemas viram registro (sem alarde)
  O.obra = ev => O.registrar({ tipo: 'obra', sev: 1, fonte: 'CIDADE', msg: ev.msg, onde: ev.reg, chave: 'obra:' + ev.msg, detalhe: ev });
  O.camera = r => O.registrar({ tipo: 'camera', sev: r.sev === 'crime' ? 2 : 1, fonte: 'CÂMERAS', msg: r.msg, onde: r.onde, chave: 'cam:' + r.id, detalhe: { gravacao: r.id, hora: r.hora }, forcar: true });
  O.erro = function (e, onde) {
    const msg = String(e && e.message || e).slice(0, 160);
    return O.registrar({ tipo: 'erro-js', sev: 3, fonte: 'OLHO', msg: onde + ': ' + msg, onde: onde, chave: 'js:' + onde + ':' + msg, detalhe: { pilha: String(e && e.stack || '').split('\n').slice(0, 6) } });
  };
  window.addEventListener('error', ev => { try { O.erro(ev.error || ev.message, 'erro do navegador'); } catch (e) { } });
  window.addEventListener('unhandledrejection', ev => { try { O.erro(ev.reason, 'promessa'); } catch (e) { } });

  // ---------- achar um lugar bom perto de (x,y) ----------
  function maisPerto(x, y, ok, raio) {
    const tx0 = clamp(Math.floor(x / T), 1, W.TW - 2), ty0 = clamp(Math.floor(y / T), 1, W.TH - 2);
    for (let r = 0; r <= (raio || 24); r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const tx = tx0 + dx, ty = ty0 + dy; if (tx < 1 || ty < 1 || tx >= W.TW - 1 || ty >= W.TH - 1) continue;
      if (ok(W.tiles[ty * W.TW + tx])) return { x: (tx + 0.5) * T, y: (ty + 0.5) * T };
    }
    return null;
  }
  O.maisPerto = maisPerto;
  const ehVia = t => t === W.TILE.ROAD || t === W.TILE.CROSS || t === W.TILE.BRIDGE;
  const ehCalcada = t => W.pedWalkable(t) && t !== W.TILE.LOT;

  // ---------- diagnósticos (só olham, não mexem) ----------
  let uidN = 0; const uid = e => (e.uid == null ? (e.uid = ++uidN) : e.uid);
  O.diagnosticaCarro = function (c, S) {
    const out = [], p = S.player, ehJog = p.car === c;
    if (!fin(c.x) || !fin(c.y) || !fin(c.vx) || !fin(c.vy) || !fin(c.a)) { out.push({ tipo: 'carro-nan', sev: 3, msg: 'carro #' + uid(c) + ' (' + c.kind + ') com número inválido (NaN)', fix: () => removeCarro(S, c, 'carro-nan') }); return out; }
    if (c.x < 0 || c.y < 0 || c.x > W.W || c.y > W.H) out.push({ tipo: 'carro-fora', sev: 3, msg: 'carro #' + uid(c) + ' fora do mapa', fix: () => ehJog ? tpJogCarro(S, c) : removeCarro(S, c, 'fora do mapa') });
    else if (W.isSolid(c.x, c.y)) {
      c._sol = (c._sol || 0) + 1;
      if (c._sol >= 2) out.push({ tipo: 'carro-parede', sev: 3, msg: 'carro #' + uid(c) + ' (' + c.kind + ') dentro de ' + lugarDe(c).tile.tipo, fix: () => { const q = maisPerto(c.x, c.y, ehVia, 20); if (q && (ehJog || c.owned)) { c.x = q.x; c.y = q.y; c.vx = c.vy = 0; c._sol = 0; return 'reposicionado na rua mais próxima'; } removeCarro(S, c, 'dentro de parede'); return 'removido'; } });
    } else c._sol = 0;
    if (Math.hypot(c.vx, c.vy) > 1000) out.push({ tipo: 'carro-velocidade', sev: 2, msg: 'carro #' + uid(c) + ' com velocidade absurda (' + Math.round(Math.hypot(c.vx, c.vy)) + ')', fix: () => { c.vx *= 0.1; c.vy *= 0.1; return 'velocidade zerada'; } });
    // travado: carro da cidade que não sai do lugar
    if (c.driver === 'ai' && !c.dead && !c.hb && (c.mode === 'wander' || c.mode === 'goto' || c.mode === 'chase')) {
      const m = c._m || (c._m = { x: c.x, y: c.y, t: S.time });
      if (Math.hypot(c.x - m.x, c.y - m.y) > 10) { m.x = c.x; m.y = c.y; m.t = S.time; }
      else if (S.time - m.t > 16) out.push({ tipo: 'carro-travado', sev: 2, msg: 'carro #' + uid(c) + ' (' + c.kind + ') TRAVADO há ' + Math.round(S.time - m.t) + 's', fix: () => { removeCarro(S, c, 'travado'); return 'removido (o trânsito repõe outro)'; } });
    }
    return out;
  };
  O.diagnosticaPed = function (p, S) {
    const out = [];
    if (!fin(p.x) || !fin(p.y)) { out.push({ tipo: 'ped-nan', sev: 3, msg: 'pedestre #' + uid(p) + ' com posição inválida', fix: () => { S.peds.splice(S.peds.indexOf(p), 1); return 'removido'; } }); return out; }
    if (p.x < 0 || p.y < 0 || p.x > W.W || p.y > W.H || W.isSolid(p.x, p.y)) out.push({ tipo: 'ped-parede', sev: 2, msg: 'pedestre #' + uid(p) + ' preso em ' + lugarDe(p).tile.tipo, fix: () => { const q = maisPerto(p.x, p.y, ehCalcada, 20); if (q) { p.x = q.x; p.y = q.y; return 'movido para a calçada'; } S.peds.splice(S.peds.indexOf(p), 1); return 'removido'; } });
    return out;
  };
  function removeCarro(S, c, porque) { const i = S.cars.indexOf(c); if (i >= 0) S.cars.splice(i, 1); if (S.redCar === c) { /* o carro do jogador nunca some: volta para a rua */ tpJogCarro(S, c); S.cars.push(c); } }
  function tpJogCarro(S, c) { const q = maisPerto(isFinite(c.x) ? c.x : W.nodeX(2), isFinite(c.y) ? c.y : W.nodeY(2), ehVia, 40) || { x: W.nodeX(2), y: W.nodeY(2) }; c.x = q.x; c.y = q.y; c.vx = c.vy = 0; if (!fin(c.a)) c.a = 0; if (S.player.car === c) { S.player.x = q.x; S.player.y = q.y; } }

  // aplica os consertos e registra tudo (fonte pode ser o OLHO ou um agente que viu primeiro)
  O.trata = function (d, ent, fonte, soReporta) {
    let acao = '';
    if (!soReporta && d.fix) { try { acao = d.fix() || 'consertado'; } catch (e) { acao = 'falhou ao consertar: ' + e.message; } }
    return O.registrar({ tipo: d.tipo, sev: d.sev, fonte: fonte || 'OLHO', msg: d.msg, ent, chave: d.tipo + ':' + (ent && ent.uid != null ? ent.uid : d.msg), corrigido: !soReporta && !!d.fix, acao: soReporta ? '' : acao, detalhe: d.detalhe });
  };

  // ---------- varredura principal (1 vez por segundo) ----------
  let ultimo = { x: 0, y: 0, ok: false }, tTrans = 0, tSol = 0, acumulo = 0, lentoT = 0, relogio = 0;
  function varrer(S, dt) {
    O.stats.varreduras++;
    // carros
    for (const c of S.cars.slice()) for (const d of O.diagnosticaCarro(c, S)) O.trata(d, c);
    if (S.cars.length > 90) { const P = S.player, ord = S.cars.slice().sort((a, b) => Math.hypot(b.x - P.x, b.y - P.y) - Math.hypot(a.x - P.x, a.y - P.y)); for (let k = 0; k < S.cars.length - 90; k++) if (!ord[k].owned && ord[k] !== P.car) { const i = S.cars.indexOf(ord[k]); if (i >= 0) S.cars.splice(i, 1); } O.registrar({ tipo: 'excesso-carros', sev: 1, msg: 'mais de 90 carros no mapa: os mais distantes foram removidos', corrigido: true, acao: 'limpeza' }); }
    // pedestres
    for (const p of S.peds.slice()) for (const d of O.diagnosticaPed(p, S)) O.trata(d, p);
    if (S.peds.length > 160) { S.peds.length = 160; O.registrar({ tipo: 'excesso-peds', sev: 1, msg: 'mais de 160 pedestres: cortei o excesso', corrigido: true, acao: 'limpeza' }); }
    // jogador
    const P = S.player;
    if (!fin(P.x) || !fin(P.y)) { P.x = ultimo.ok ? ultimo.x : W.nodeX(2); P.y = ultimo.ok ? ultimo.y : W.nodeY(2); P.vx = P.vy = 0; O.registrar({ tipo: 'jogador-nan', sev: 3, msg: 'posição do jogador inválida', corrigido: true, acao: 'voltou para a última posição boa' }); }
    else if (S.mode === 'play' && !P.car && W.isSolid(P.x, P.y)) { tSol++; if (tSol >= 2) { const q = maisPerto(P.x, P.y, ehCalcada, 20); if (q) { P.x = q.x; P.y = q.y; } tSol = 0; O.registrar({ tipo: 'jogador-parede', sev: 2, msg: 'jogador ficou preso dentro de ' + lugarDe(P).tile.tipo, ent: P, corrigido: true, acao: 'movido para a calçada mais próxima' }); } }
    else { tSol = 0; if (S.mode === 'play') { ultimo = { x: P.x, y: P.y, ok: true }; } }
    if (!fin(P.hp)) { P.hp = 100; O.registrar({ tipo: 'vida-nan', sev: 2, msg: 'vida do jogador inválida', corrigido: true, acao: 'vida = 100' }); }
    if (S.save) {
      if (!fin(S.save.money) || S.save.money < 0) { const v = S.save.money; S.save.money = 0; O.registrar({ tipo: 'dinheiro', sev: 3, msg: 'dinheiro inválido (' + v + ')', corrigido: true, acao: 'dinheiro = 0' }); }
      const inv = S.save.inv; if (inv) for (const k in inv) if (!fin(inv[k]) || inv[k] < 0) { delete inv[k]; O.registrar({ tipo: 'mochila', sev: 2, msg: 'item inválido na mochila: ' + k, corrigido: true, acao: 'item removido' }); }
    }
    // telas inconsistentes
    if (S.mode === 'inside' && !S.inside) { S.mode = 'play'; O.registrar({ tipo: 'tela', sev: 3, msg: 'modo "dentro" sem sala', corrigido: true, acao: 'voltou para a rua' }); }
    if (S.mode === 'play' && S.inside) { S.inside = null; O.registrar({ tipo: 'tela', sev: 2, msg: 'sala ainda aberta com o jogo na rua', corrigido: true, acao: 'sala fechada' }); }
    if (S.trans) { tTrans += 1; if (tTrans > 8) { S.trans = null; tTrans = 0; O.registrar({ tipo: 'tela', sev: 3, msg: 'transição de tela travada', corrigido: true, acao: 'transição cancelada' }); } } else tTrans = 0;
    // sala atual
    const R = S.inside;
    if (R) {
      if (!fin(R.px) || !fin(R.py) || R.px < R.x0 - 20 || R.px > R.x1 + 20 || R.py < R.y0 - 20 || R.py > R.y1 + 60) { O.registrar({ tipo: 'sala-jogador', sev: 3, msg: 'jogador fora da sala ' + (R.nome || ''), corrigido: true, acao: 'voltou para a porta' }); R.px = R.portaX; R.py = R.y1 - 40; }
      for (const n of R.npcs.slice()) if (!fin(n.x) || !fin(n.y)) { R.npcs.splice(R.npcs.indexOf(n), 1); O.registrar({ tipo: 'sala-npc', sev: 2, msg: 'NPC com posição inválida em ' + (R.nome || ''), corrigido: true, acao: 'NPC removido' }); }
    }
    // desempenho
    if (O.stats.dtMed > 0.045) { lentoT += 1; if (lentoT > 8 && !O.reduzido) { O.reduzido = true; O.registrar({ tipo: 'desempenho', sev: 2, msg: 'jogo lento (' + Math.round(1 / O.stats.dtMed) + ' fps): reduzi trânsito e gente', corrigido: true, acao: 'menos carros/peds', detalhe: { carros: S.cars.length, peds: S.peds.length, particulas: S.particles.length } }); if (S.particles.length > 150) S.particles.length = 150; } }
    else { lentoT = Math.max(0, lentoT - 1); if (O.stats.dtMed < 0.03) O.reduzido = false; }
    // relógio das obras
    G.cidade.lotes.forEach(l => { if (l.est && (!fin(l.est.p) || l.est.p < 0 || l.est.p > 1.0001)) O.registrar({ tipo: 'obra-estado', sev: 2, msg: 'obra ' + l.id + ' com progresso inválido', detalhe: l.est }); });
  }
  O.estadoMundo = function () { const S = G.S; return { carros: S.cars.length, pedestres: S.peds.length, particulas: S.particles.length, fps: Math.round(O.stats.fps), obras: G.cidade.resumo(), modo: S.mode, cacheTamanho: O.cache.length }; };

  G.extras.add((S, dt) => {
    if (!O.ligado) return;
    O.stats.dtMed += (dt - O.stats.dtMed) * 0.05; O.stats.fps = 1 / Math.max(0.001, O.stats.dtMed);
    acumulo += dt; salvaT += dt;
    if (acumulo >= 1) { acumulo = 0; try { varrer(S, dt); } catch (e) { O.erro(e, 'varredura do Olho'); } }
    if (salvaT > 10) { salvaT = 0; salva(); }
  });
  window.addEventListener('beforeunload', () => { sujo = true; salva(); });

  // ---------- relatórios para o desenvolvedor ----------
  O.relatorio = function () {
    const por = {}; O.cache.forEach(r => { const k = r.tipo + (r.corrigido ? ' (corrigido)' : r.corrigido === null ? ' (info)' : ' (aberto)'); por[k] = (por[k] || 0) + r.n; });
    return { resumo: por, total: O.cache.length, ultimos: O.cache.slice(-15).map(r => '[' + r.hora + '] ' + r.fonte + ' · ' + r.tipo + ' · ' + r.msg + (r.corrigido ? '  ✔ ' + r.acao : '')), mundo: O.estadoMundo() };
  };
  O.exportar = function () { return JSON.stringify({ gerado: new Date().toISOString(), mundo: O.estadoMundo(), relatorios: O.cache, gravacoes: G.cameras ? G.cameras.gravacoes : [], obras: G.cidade.eventos }, null, 1); };
  O.baixar = function () {
    try { const b = new Blob([O.exportar()], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'olho-de-deus-relatorio.json'; a.click(); G.say('Relatório salvo: olho-de-deus-relatorio.json', 3); } catch (e) { G.say('Não deu para baixar aqui. Use G.olho.exportar() no console.', 4); }
  };

  // ---------- o painel (F9) ----------
  const ABAS = ['RELATÓRIOS', 'SAÚDE', 'OBRAS', 'GRAVAÇÕES'];
  const tela = {
    aba: 0, sel: 0, det: false, filtro: 0,
    abre() { O.novos = 0; this.sel = 0; this.det = false; },
    lista() {
      if (this.aba === 0) { const l = O.cache.slice().reverse(); return this.filtro === 0 ? l : this.filtro === 1 ? l.filter(r => r.sev >= 2) : l.filter(r => r.corrigido === false && r.sev >= 2); }
      if (this.aba === 2) return G.cidade.eventos.slice().reverse();
      if (this.aba === 3) return G.cameras ? G.cameras.gravacoes.slice().reverse() : [];
      return [];
    },
    tecla(k) {
      const l = this.lista(), n = l.length;
      if (k === 'F9' || k === 'Escape') { if (this.det && k === 'Escape') this.det = false; else G.overlay.fechar(); return; }
      if (k === 'Tab') { this.aba = (this.aba + 1) % ABAS.length; this.sel = 0; this.det = false; }
      else if (k === 'ArrowDown' || k === 'KeyS') this.sel = Math.min(n - 1, this.sel + 1);
      else if (k === 'ArrowUp' || k === 'KeyW') this.sel = Math.max(0, this.sel - 1);
      else if (k === 'PageDown') this.sel = Math.min(n - 1, this.sel + 8);
      else if (k === 'PageUp') this.sel = Math.max(0, this.sel - 8);
      else if (k === 'Enter') this.det = !this.det;
      else if (k === 'KeyF') { this.filtro = (this.filtro + 1) % 3; this.sel = 0; }
      else if (k === 'KeyD') O.baixar();
      else if (k === 'KeyX') { O.cache.length = 0; O.porChave = {}; sujo = true; salva(); this.sel = 0; }
    },
    desenha(ctx, S) {
      ctx.save(); ctx.fillStyle = 'rgba(4,6,14,0.96)'; ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#10142a'; ctx.fillRect(0, 0, 800, 44); ctx.fillStyle = '#5a6aff'; ctx.fillRect(0, 44, 800, 2);
      ctx.font = 'bold 19px Arial'; ctx.fillStyle = '#b8c4ff'; ctx.textAlign = 'left'; ctx.fillText('OLHO DE DEUS', 14, 29);
      ctx.font = 'bold 11px Arial'; ABAS.forEach((nm, i) => { const x = 230 + i * 128; ctx.fillStyle = i === this.aba ? '#3a48c8' : '#181c3a'; ctx.fillRect(x, 12, 122, 22); ctx.fillStyle = i === this.aba ? '#fff' : '#8a96d8'; ctx.textAlign = 'center'; ctx.fillText(nm, x + 61, 27); });
      ctx.textAlign = 'left';
      if (this.aba === 1) this.saude(ctx, S); else this.relatorios(ctx, S);
      ctx.fillStyle = '#7a86c8'; ctx.font = '11px Arial'; ctx.fillText('TAB abas · ↑↓ escolher · ENTER detalhes · F filtro · D baixar JSON · X limpar · F9/ESC fechar', 14, 590);
      ctx.restore();
    },
    relatorios(ctx, S) {
      const l = this.lista(), n = l.length; ctx.font = 'bold 11px Arial';
      const ab = O.stats;
      ctx.fillStyle = '#9aa6e8'; ctx.fillText(n + ' registros' + (this.aba === 0 ? '  ·  filtro: ' + ['todos', 'importantes', 'abertos'][this.filtro] : '') + '  ·  achados: ' + ab.achados + '  ·  consertos: ' + ab.consertos + '  ·  varreduras: ' + ab.varreduras, 14, 64);
      if (this.det && l[this.sel]) { this.detalhe(ctx, l[this.sel]); return; }
      const lin = 24, top = 76, vis = 21, ini = clamp(this.sel - 10, 0, Math.max(0, n - vis));
      for (let k = 0; k < vis && ini + k < n; k++) {
        const r = l[ini + k], y = top + k * lin, sel = ini + k === this.sel;
        ctx.fillStyle = sel ? '#202a6a' : (k % 2 ? '#0a0e20' : '#0d1228'); ctx.fillRect(10, y, 780, lin - 2);
        const cor = r.sev >= 3 ? '#ff6a6a' : r.sev === 2 ? '#ffc86a' : '#7ad8ff'; ctx.fillStyle = cor; ctx.fillRect(10, y, 4, lin - 2);
        ctx.fillStyle = '#8a96d8'; ctx.font = '10px Arial'; ctx.fillText((r.hora || '') + '  ' + (r.fonte || r.reg || ''), 20, y + 15);
        ctx.fillStyle = '#e8ecff'; ctx.font = 'bold 11px Arial'; let tx = (r.tipo || '') + ' · ' + (r.msg || ''); while (ctx.measureText(tx).width > 560 && tx.length > 10) tx = tx.slice(0, -2); ctx.fillText(tx, 150, y + 15);
        if (r.corrigido != null && this.aba === 0) { ctx.fillStyle = r.corrigido ? '#7dff9a' : r.corrigido === null ? '#7ad8ff' : '#ff9a7a'; ctx.textAlign = 'right'; ctx.fillText((r.n > 1 ? 'x' + r.n + '  ' : '') + (r.corrigido ? 'CONSERTADO' : r.corrigido === null ? 'INFO' : 'ABERTO'), 782, y + 15); ctx.textAlign = 'left'; }
      }
      if (!n) { ctx.fillStyle = '#7a86c8'; ctx.font = 'bold 13px Arial'; ctx.fillText('Nada por aqui ainda. Jogue um pouco: o Olho e os agentes do FBI estão trabalhando.', 20, 110); }
    },
    detalhe(ctx, r) {
      ctx.fillStyle = '#0d1230'; ctx.fillRect(10, 76, 780, 500); ctx.strokeStyle = '#3a48c8'; ctx.strokeRect(10.5, 76.5, 779, 499);
      const txt = JSON.stringify(r, null, 1).split('\n'); ctx.font = '11px Consolas, monospace'; ctx.fillStyle = '#c8d2ff';
      txt.slice(0, 38).forEach((s, i) => { let t = s; while (ctx.measureText(t).width > 760 && t.length > 8) t = t.slice(0, -2); ctx.fillText(t, 18, 94 + i * 12.6); });
    },
    saude(ctx, S) {
      const st = O.estadoMundo(), r = G.cidade.resumo(), linhas = [
        ['Quadros por segundo', st.fps], ['Carros no mapa', st.carros], ['Pedestres', st.pedestres], ['Partículas', st.particulas], ['Modo do jogo', st.modo],
        ['Obras prontas', r.prontas], ['Obras em andamento', r.emObra], ['Terrenos aguardando', r.aguardando], ['Relógio da obra (s)', Math.round(G.cidade.t)],
        ['Pedágios cobrados', '$' + (G.pedagio ? G.pedagio.cobrado : 0) + ' (' + (G.pedagio ? G.pedagio.passagens : 0) + ' passagens)'],
        ['Gravações das câmeras', G.cameras ? G.cameras.gravacoes.length : 0], ['Agentes do FBI', G.fbi ? G.fbi.agentes.length + ' em campo · ' + G.fbi.stats.lugares + ' lugares auditados · ' + G.fbi.stats.ruas + ' varreduras de rua' : '—'],
        ['Registros no cache', O.cache.length], ['Varreduras do Olho', O.stats.varreduras], ['Problemas achados / consertados', O.stats.achados + ' / ' + O.stats.consertos]
      ];
      ctx.font = 'bold 14px Arial'; linhas.forEach(([a, b], i) => { const y = 84 + i * 28; ctx.fillStyle = i % 2 ? '#0a0e20' : '#0d1228'; ctx.fillRect(10, y, 780, 26); ctx.fillStyle = '#9aa6e8'; ctx.textAlign = 'left'; ctx.fillText(a, 22, y + 18); ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.fillText(String(b), 780, y + 18); });
      ctx.textAlign = 'left';
    }
  };
  O.tela = tela;
  G.overlay.atalhos['F9'] = () => G.overlay.abrir(tela);
  // contador discreto no canto (só o jogo sabe que ele existe)
  G.overlay.hudFns = G.overlay.hudFns || [];
  G.overlay.hudFns.push((ctx, S) => {
    if (S.mode !== 'play') return;
    const abertos = O.cache.filter(r => r.corrigido === false && r.sev >= 2).length;
    ctx.save(); ctx.globalAlpha = 0.45; ctx.font = 'bold 9px Arial'; ctx.fillStyle = abertos ? '#ffb86a' : '#8aa0ff'; ctx.textAlign = 'right'; ctx.fillText('F9 · OLHO ' + O.cache.length + (abertos ? ' · ' + abertos + '!' : ''), 790, 596); ctx.restore();
  });
})(window.G = window.G || {});
