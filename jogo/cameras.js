/* ============================================================
   cameras.js — câmeras de segurança de VERDADE
   • Dentro de TODOS os estabelecimentos (mercados, hotéis, banco, lojas, shopping...) existem câmeras no teto,
     girando e com uma luz vermelha. Só as CASAS não têm.
   • Nas ruas há câmeras em postes: cruzamentos, pedágios, obras, pontes e aeroporto.
   • Se você aparecer armado (ou assaltar) na frente de uma câmera, fica GRAVADO e a polícia é chamada.
   • Aperte C (ou use o celular) para abrir a CENTRAL DE CÂMERAS e assistir tudo ao vivo.
   ============================================================ */
(function (G) {
  'use strict';
  const W = G.world, T = W.T, TAU = Math.PI * 2, L = G.lugares, C = G.cidade, SP = G.sprites;
  const CM = G.cameras = { gravacoes: [], ruas: [], aberta: false };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- nomes das ruas (para os relatórios dizerem ONDE as coisas acontecem) ----------
  const AVENIDAS = ['Av. Independência', 'Av. Presidente Vargas', 'Av. João Fiúza', 'Av. do Rio', 'Av. Francisco Junqueira', 'Av. Nove de Julho', 'Av. Costábile Romano', 'Av. Brasil', 'Av. Saudade', 'Av. da Ponte', 'Av. Novo Horizonte', 'Av. das Obras', 'Av. do Progresso', 'Av. Beira-Rio', 'Av. Vale Verde', 'Av. Aeroporto', 'Av. das Palmeiras', 'Av. Final'];
  const RUAS_H = ['Rua Duque de Caxias', 'Rua General Osório', 'Rua Tibiriçá', 'Rua do Pedágio', 'Rua Amador Bueno', 'Rua Barão do Amazonas', 'Rua São Sebastião'];
  const cap = t => t.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
  CM.nomeRua = function (x, y) {
    const i = clamp(Math.round((x / T - W.MG - W.ROAD / 2) / W.PITCH), 0, W.COLS), j = clamp(Math.round((y / T - W.MG - W.ROAD / 2) / W.PITCH), 0, W.ROWS), r = C.regiaoDe(x, y);
    const hor = j === W.RODOVIA ? 'Rodovia Transbrasil' : RUAS_H[j % RUAS_H.length] + (j >= RUAS_H.length ? ' ' + (Math.floor(j / RUAS_H.length) + 1) : '');
    // Ribeirão tem avenidas com nome; as outras cidades numeram as suas; no campo e na mata são estradas
    const ver = r.id === 'ribeirao' ? AVENIDAS[i % AVENIDAS.length] : r.tipo === 'cidade' ? 'Av. ' + cap(r.nome) + ' ' + (i - r.urb[0] + 1) : 'Estrada ' + cap(r.nome) + ' ' + (i + 1);
    return ver + ' × ' + hor;
  };
  // texto de localização completo: cidade + rua + quadra
  CM.onde = function (x, y) {
    const r = C.regiaoDe(x, y), bx = Math.floor((x / T - W.MG - W.ROAD) / W.PITCH), by = Math.floor((y / T - W.MG - W.ROAD) / W.PITCH);
    return r.nome + ' · ' + CM.nomeRua(x, y) + ' · quadra ' + bx + ',' + by;
  };

  // ---------- gravações ----------
  CM.registra = function (tipo, msg, sev, pos) {
    const S = G.S, r = { id: CM.gravacoes.length + 1, tipo, msg, sev: sev || 'info', hora: L.horaTxt(S), t: S.time, pos: pos || null, onde: pos ? CM.onde(pos.x, pos.y) : '' };
    CM.gravacoes.push(r); if (CM.gravacoes.length > 200) CM.gravacoes.shift();
    if (G.olho && G.olho.camera) G.olho.camera(r);
    return r;
  };

  // ---------- câmeras dentro das salas ----------
  function camsDe(R) {
    if (R._cams !== undefined) return R._cams;
    const pl = R.lugar && R.lugar.place;
    if (!pl || pl.tipo === 'casa' || pl.id === 'casa' || /^q\d/.test(R.id || '') || R.semCamera) return (R._cams = []);
    const n = clamp(Math.round((R.x1 - R.x0) / 380), 1, 4), cams = [];
    for (let k = 0; k < n; k++) cams.push({ id: pl.id + ':' + (R.id || 'entrada') + ':' + k, nome: pl.nome + ' · CAM ' + (k + 1), x: R.x0 + (R.x1 - R.x0) * (k + 0.5) / n, y: R.y0 - 16, base: Math.PI / 2, amp: 0.75, per: 7 + k * 1.3, fase: k * 1.7, alcance: (R.y1 - R.y0) * 1.25, fov: 0.55, quebrada: false, ve: false });
    return (R._cams = cams);
  }
  CM.camsDe = camsDe;
  const angDe = (c, t) => c.base + c.amp * Math.sin(t * TAU / c.per + c.fase);
  function enxerga(c, px, py, t) {
    const dx = px - c.x, dy = py - c.y, d = Math.hypot(dx, dy); if (d > c.alcance) return false;
    let df = Math.atan2(dy, dx) - angDe(c, t); df = Math.atan2(Math.sin(df), Math.cos(df));
    return Math.abs(df) < c.fov;
  }
  // desenha as câmeras de uma sala (no teto/parede de trás), com a luz vermelha piscando
  CM.desenharSala = function (ctx, S, R) {
    const cams = camsDe(R); if (!cams.length) return;
    const t = S.time;
    cams.forEach(c => {
      const a = angDe(c, t);
      if (!c.quebrada) { // cone de visão no chão (bem suave)
        const g = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, c.alcance);
        g.addColorStop(0, c.ve ? 'rgba(255,60,60,0.20)' : 'rgba(210,235,255,0.13)'); g.addColorStop(1, 'rgba(210,235,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(c.x, c.y + 4); ctx.arc(c.x, c.y + 4, c.alcance, a - c.fov, a + c.fov); ctx.closePath(); ctx.fill();
      }
      ctx.save(); ctx.translate(c.x, c.y);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-9, 6, 20, 5);                    // sombra na parede
      ctx.fillStyle = '#d0d2d8'; ctx.fillRect(-10, -3, 20, 5);                           // suporte
      ctx.rotate(a - Math.PI / 2);
      ctx.fillStyle = '#2a2c33'; W.rrect(ctx, -7, 0, 14, 17, 4); ctx.fill(); ctx.strokeStyle = '#6a6d78'; ctx.lineWidth = 1; ctx.stroke();    // corpo
      ctx.fillStyle = '#0a0c12'; ctx.beginPath(); ctx.arc(0, 15, 4.2, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(120,180,255,0.7)'; ctx.beginPath(); ctx.arc(-1, 14, 1.4, 0, TAU); ctx.fill();   // lente
      const pisca = c.quebrada ? false : (Math.floor(t * 2 + c.fase) % 2 === 0 || c.ve);
      ctx.fillStyle = pisca ? '#ff2a2a' : '#5a0a0a'; ctx.beginPath(); ctx.arc(4.5, 3, 2.1, 0, TAU); ctx.fill();                          // LED vermelho
      if (pisca) { ctx.fillStyle = 'rgba(255,40,40,0.35)'; ctx.beginPath(); ctx.arc(4.5, 3, 6, 0, TAU); ctx.fill(); }
      ctx.restore();
    });
  };
  const armado = S => { const w = S.player.weapon; return w === 'pistol' || w === 'smg' || w === 'shotgun'; };
  // as câmeras reparam em armas e em crimes dentro do estabelecimento
  CM.atualizarSala = function (S, R, dt) {
    const cams = camsDe(R); if (!cams.length) return;
    const LG = R.lugar, pl = LG.place;
    let visto = false;
    cams.forEach(c => { c.ve = !c.quebrada && enxerga(c, R.px, R.py, S.time); if (c.ve) visto = true; });
    R.camVisto = visto;
    if (visto && armado(S) && !R.sentado) {
      R.camArmado = (R.camArmado || 0) + dt;
      if (R.camArmado > 3 && !R.camF1) {
        R.camF1 = true; CM.registra('CRIME', pl.nome + ' — pessoa armada filmada pela câmera', 'crime', { x: pl.x, y: pl.y });
        G.say('A câmera de segurança viu sua arma! Alguém vai chamar a polícia...', 4);
        if (LG.alarme == null && !LG.alarmeFeito) LG.alarme = 8;
      }
    } else R.camArmado = Math.max(0, (R.camArmado || 0) - dt);
    if (LG.alarme != null && visto && !R.camF2) {
      R.camF2 = true; CM.registra('CRIME', pl.nome + ' — assalto/ameaça GRAVADO (rosto do suspeito)', 'crime', { x: pl.x, y: pl.y });
      G.addHeat(8); G.say('GRAVADO! As câmeras filmaram o seu rosto.', 3.5);
    }
  };
  CM.contaSala = R => camsDe(R).length;

  // ---------- câmeras das ruas (postes) ----------
  // cruzamentos importantes, pedágios, obras grandes, pontes e aeroporto
  [[1, 1], [4, 3], [6, 2], [8, 5], [2, 5], [5, 0], [2, 7], [5, 7], [36, 3], [37, 5], [51, 3], [52, 6], [62, 3], [63, 5], [24, 5], [45, 5]].forEach(([i, j], k) => {
    const x = W.nodeX(i), y = W.nodeY(j);
    CM.ruas.push({ id: 'rua' + k, cat: 'rua', nome: () => 'RUA · ' + CM.nomeRua(x, y), x, y, px: x + W.ROAD / 2 * T + 18, py: y - W.ROAD / 2 * T - 18, vw: 560 });
  });
  G.pedagio.pracas.forEach(pr => CM.ruas.push({ id: 'ped' + pr.rio + '_' + pr.j, cat: 'rua', nome: () => pr.nome + (pr.ativa() ? '' : ' (OBRA)'), x: (pr.x0 + pr.x1) / 2, y: pr.mid, px: pr.x0 + 14, py: pr.top - 14, vw: 640 }));
  W.lotes.forEach(l => {
    if (l.tam === 'p') return;
    const a = l.tam === 'a';
    CM.ruas.push({ id: 'obra' + l.id, cat: 'obra', lote: l, nome: () => 'OBRA · ' + l.proj.nome + ' · ' + C.faseNome(l.est || C.estadoDe(l)), x: a ? l.pista.x + l.pista.w / 2 : l.cx, y: a ? l.pista.y + l.pista.h / 2 + 30 : l.cy, px: l.x - 10, py: l.y + l.h + 8, vw: a ? 520 : 420 });
  });
  C.pontes.forEach(pt => CM.ruas.push({ id: 'ponte' + pt.nome, cat: 'obra', nome: () => 'OBRA · ' + pt.nome + (pt.pronta ? ' (INAUGURADA)' : ' ' + Math.round(pt.p * 100) + '%'), x: pt.x + pt.w / 2, y: pt.y + pt.h / 2, px: pt.x + 6, py: pt.y - 16, vw: 520 }));
  // poste com câmera (desenhado no mundo)
  CM.desenharRua = function (ctx, S, x0, y0, x1, y1, t) {
    CM.ruas.forEach(c => {
      if (c.px < x0 - 30 || c.px > x1 + 30 || c.py < y0 - 30 || c.py > y1 + 30) return;
      const a = Math.atan2(c.y - c.py, c.x - c.px) + Math.sin(t * 0.5 + c.px) * 0.35;
      ctx.fillStyle = 'rgba(0,0,10,0.3)'; ctx.beginPath(); ctx.arc(c.px + 5, c.py + 6, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#55586a'; ctx.beginPath(); ctx.arc(c.px, c.py, 4, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(c.px, c.py); ctx.rotate(a); ctx.fillStyle = '#2a2c33'; ctx.fillRect(0, -3.5, 13, 7); ctx.fillStyle = '#0a0c12'; ctx.fillRect(11, -2.5, 3, 5);
      ctx.restore();
      const on = Math.floor(t * 2 + c.px) % 2 === 0; ctx.fillStyle = on ? '#ff2a2a' : '#5a0a0a'; ctx.beginPath(); ctx.arc(c.px + Math.cos(a) * 4, c.py + Math.sin(a) * 4 - 3, 1.8, 0, TAU); ctx.fill();
      if (on) { ctx.fillStyle = 'rgba(255,40,40,0.3)'; ctx.beginPath(); ctx.arc(c.px + Math.cos(a) * 4, c.py + Math.sin(a) * 4 - 3, 5, 0, TAU); ctx.fill(); }
    });
    // câmera da rua flagra fuga da polícia (só registro)
    if (S.heatLevel > 0 && S.mode === 'play') {
      const ref = S.player.car || S.player;
      for (const c of CM.ruas) { if (Math.hypot(ref.x - c.x, ref.y - c.y) < 230 && (!c.flag || S.time - c.flag > 40)) { c.flag = S.time; CM.registra('CRIME', c.nome() + ' — suspeito em fuga filmado (nível de procurado ' + S.heatLevel + ')', 'crime', { x: ref.x, y: ref.y }); break; } }
    }
  };

  // ---------- catálogo de tudo o que dá para assistir ----------
  const SALAS_HOTEL = [['entrada', 'RECEPÇÃO'], ['restaurante', 'RESTAURANTE'], ['corredor', 'CORREDOR'], ['piscina', 'PISCINA'], ['cozinha', 'COZINHA']];
  let catCache = null, catN = -1;
  CM.catalogo = function () {
    if (catCache && catN === W.places.length) return catCache;
    const lista = [];
    W.places.forEach(pl => {
      if (pl.tipo === 'casa' || pl.id === 'casa') return;
      const salas = pl.tipo === 'hotel' ? SALAS_HOTEL : pl.tipo === 'mercado' ? [['entrada', 'CORREDORES']] : [['entrada', 'SALÃO']];
      salas.forEach(([sid, nm]) => lista.push({ id: pl.id + ':' + sid, cat: 'predio', pl, sala: sid, nome: () => pl.nome + ' · ' + nm, reg: C.regiaoDe(pl.x, pl.y).nome }));
    });
    CM.ruas.forEach(c => lista.push(Object.assign(c, { reg: C.regiaoDe(c.x, c.y).nome })));
    catCache = lista; catN = W.places.length; return lista;
  };

  // ---------- desenho dos sinais ----------
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function salaReal(S, f) { const R = S.inside; return R && R.lugar && R.lugar.place === f.pl && (R.id || 'entrada') === f.sala ? R : null; }
  function efeitoCamera(x, w, h, f, S, t, ruim) {
    x.fillStyle = 'rgba(10,40,25,0.16)'; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(0,0,0,0.13)'; for (let yy = 0; yy < h; yy += 3) x.fillRect(0, yy, w, 1);
    const v = x.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.9); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)'); x.fillStyle = v; x.fillRect(0, 0, w, h);
    const r = ((Math.floor(t * 12) * 9301 + 49297) % 233280) / 233280; if (r < 0.1) { x.fillStyle = 'rgba(255,255,255,0.10)'; x.fillRect(0, (r * 10) * h, w, 3); }
  }
  // um sinal de sala (interna) ou de rua (externa), desenhado dentro de um canvas w×h
  function renderaFeed(S, f, w, h, dt) {
    if (!f.cv || f.cv.width !== w || f.cv.height !== h) f.cv = cvs(w, h);
    const x = f.cv.getContext('2d'), t = S.time;
    x.save(); x.fillStyle = '#05080a'; x.fillRect(0, 0, w, h);
    try {
      if (f.cat === 'predio') {
        let R = salaReal(S, f), real = !!R;
        if (!R) { if (f.erro) throw f.erro; R = f.R = f.R || L.salaVigiada(f.pl, f.sala); if (!R) throw new Error('sala não existe'); L.simularSala(S, R, dt); }
        const sc = Math.min(w / R.W, h / R.H);
        x.translate((w - R.W * sc) / 2, (h - R.H * sc) / 2); x.scale(sc, sc);
        x.beginPath(); x.rect(0, 0, R.W, R.H); x.clip();
        L.desenharCena(x, S, R, real);
        f.camsN = camsDe(R).length;
      } else {
        const z = w / f.vw, vw = f.vw, vh = h / z, cx = f.x, cy = f.y;
        const vx0 = cx - vw / 2, vy0 = cy - vh / 2, vx1 = cx + vw / 2, vy1 = cy + vh / 2;
        x.translate(w / 2, h / 2); x.scale(z, z); x.translate(-cx, -cy);
        W.drawChunks(x, vx0, vy0, vx1, vy1); W.drawWaterFx(x, t, vx0, vy0, vx1, vy1);
        C.desenhar(x, S, vx0, vy0, vx1, vy1, t); if (G.pedagio) G.pedagio.desenhar(x, S, vx0, vy0, vx1, vy1, t);
        const inV = o => o.x > vx0 - 60 && o.x < vx1 + 60 && o.y > vy0 - 60 && o.y < vy1 + 60;
        S.cars.filter(inV).forEach(c => SP.drawCar(x, c, t)); S.peds.filter(inV).forEach(p => SP.drawPed(x, p, t));
        if (!S.player.car && S.mode !== 'inside' && inV(S.player)) SP.drawPed(x, S.player, t);
        if (G.fbi && G.fbi.desenhar) G.fbi.desenhar(x, S, inV, t);
        C.desenharAlto(x, S, vx0, vy0, vx1, vy1, t); if (G.pedagio) G.pedagio.desenharAlto(x, S, vx0, vy0, vx1, vy1, t);
        CM.desenharRua(x, S, vx0, vy0, vx1, vy1, t);
        const fr = ((S.dayT % 1) + 1) % 1, dk = fr < 0.55 ? 0 : fr < 0.65 ? (fr - 0.55) / 0.1 : fr < 0.92 ? 1 : 1 - (fr - 0.92) / 0.08;
        if (dk > 0.02) { x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = 'rgba(5,8,40,' + 0.55 * dk + ')'; x.fillRect(0, 0, w, h); }
      }
    } catch (e) {
      x.setTransform(1, 0, 0, 1, 0, 0); f.erro = e; x.fillStyle = '#111'; x.fillRect(0, 0, w, h); x.fillStyle = '#ff6a6a'; x.font = 'bold 14px Arial'; x.textAlign = 'center'; x.fillText('SEM SINAL', w / 2, h / 2); x.font = '10px Arial'; x.fillText(String(e.message || e).slice(0, 50), w / 2, h / 2 + 16);
      if (G.olho && G.olho.erro && !f.reportou) { f.reportou = true; G.olho.erro(e, 'câmera ' + (typeof f.nome === 'function' ? f.nome() : f.nome)); }
    }
    x.restore(); x.save(); efeitoCamera(x, w, h, f, S, t); x.restore();
  }

  // ---------- a Central de Câmeras (tela por cima do jogo) ----------
  const FILTROS = [['TODAS', null], ['PRÉDIOS', 'predio'], ['RUAS', 'rua'], ['OBRAS', 'obra']];
  const tela = {
    sel: 0, filtro: 0, cheio: false, tl: false, quadro: 0,
    abre(S) { CM.aberta = true; this.quadro = 0; },
    fecha() { CM.aberta = false; if (this.tl) { C.vel = 1; this.tl = false; } this.cheio = false; },
    lista() { const cat = FILTROS[this.filtro][1]; return CM.catalogo().filter(f => !cat || f.cat === cat); },
    tecla(k, S) {
      const L2 = this.lista(), n = L2.length;
      if (k === 'Escape' || k === 'KeyC') { if (this.cheio && k === 'Escape') this.cheio = false; else G.overlay.fechar(); return; }
      if (k === 'Enter' || k === 'Space') this.cheio = !this.cheio;
      else if (k === 'ArrowRight' || k === 'KeyD') this.sel = (this.sel + 1) % n;
      else if (k === 'ArrowLeft' || k === 'KeyA') this.sel = (this.sel + n - 1) % n;
      else if (k === 'ArrowDown' || k === 'KeyS') this.sel = (this.sel + 3) % n;
      else if (k === 'ArrowUp' || k === 'KeyW') this.sel = (this.sel + n - 3) % n;
      else if (k === 'PageDown') this.sel = (this.sel + 6) % n;
      else if (k === 'PageUp') this.sel = (this.sel + n - 6) % n;
      else if (k === 'Tab' || k === 'KeyF') { this.filtro = (this.filtro + 1) % FILTROS.length; this.sel = 0; }
      else if (k === 'KeyT') { this.tl = !this.tl; C.vel = this.tl ? 30 : 1; G.say(this.tl ? 'TIMELAPSE DAS OBRAS ligado (x30)' : 'Tempo normal', 2); }
    },
    desenha(ctx, S, dt) {
      const L2 = this.lista(), n = L2.length; if (this.sel >= n) this.sel = 0;
      this.quadro++;
      ctx.save(); ctx.fillStyle = '#04070a'; ctx.fillRect(0, 0, 800, 600);
      // cabeçalho
      ctx.fillStyle = '#0c1a14'; ctx.fillRect(0, 0, 800, 44); ctx.fillStyle = '#1f6a44'; ctx.fillRect(0, 44, 800, 2);
      ctx.fillStyle = '#7dffb0'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'left'; ctx.fillText('CENTRAL DE CÂMERAS', 14, 28);
      ctx.font = 'bold 11px Arial'; FILTROS.forEach(([nm], i) => { const x = 292 + i * 80; ctx.fillStyle = i === this.filtro ? '#1f6a44' : '#13241c'; ctx.fillRect(x, 12, 74, 22); ctx.fillStyle = i === this.filtro ? '#fff' : '#7ab08e'; ctx.textAlign = 'center'; ctx.fillText(nm, x + 37, 27); });
      ctx.textAlign = 'right'; ctx.fillStyle = '#9dff9d'; ctx.font = 'bold 12px Arial'; ctx.fillText(L.horaTxt(S) + (this.tl ? '  ·  TIMELAPSE x30' : '') + '  ·  ' + n + ' câmeras', 784, 17);
      ctx.fillStyle = Math.floor(performance.now() / 500) % 2 ? '#ff3a3a' : '#7a1a1a'; ctx.fillText('● REC', 784, 36);
      if (!n) { ctx.restore(); return; }
      if (this.cheio) {
        const f = L2[this.sel]; renderaFeed(S, f, 760, 470, dt); ctx.drawImage(f.cv, 20, 56);
        ctx.strokeStyle = '#2fb070'; ctx.lineWidth = 2; ctx.strokeRect(20, 56, 760, 470);
        this.rotulo(ctx, f, 20, 56, 760, 470, S, true);
        ctx.fillStyle = '#9ac8ae'; ctx.font = '12px Arial'; ctx.textAlign = 'left'; ctx.fillText(f.reg + (f.camsN ? '  ·  ' + f.camsN + ' câmera(s) nesta sala' : ''), 20, 546);
        this.ticker(ctx, S, 560); ctx.fillStyle = '#7ab08e'; ctx.fillText('ENTER voltar à grade · ← → trocar câmera · T timelapse · ESC/C sair', 20, 592);
        ctx.restore(); return;
      }
      const page = Math.floor(this.sel / 6), CW = 250, CH = 178;
      for (let k = 0; k < 6; k++) {
        const i = page * 6 + k; if (i >= n) break;
        const f = L2[i], cx = 15 + (k % 3) * 262, cy = 56 + Math.floor(k / 3) * 214;
        if (!f.cv || this.quadro % 2 === k % 2 || f.cv.width !== CW) renderaFeed(S, f, CW, CH, dt * 2);
        ctx.drawImage(f.cv, cx, cy);
        ctx.strokeStyle = i === this.sel ? '#ffe04a' : '#1f4a36'; ctx.lineWidth = i === this.sel ? 3 : 1; ctx.strokeRect(cx, cy, CW, CH);
        this.rotulo(ctx, f, cx, cy, CW, CH, S, false);
      }
      ctx.fillStyle = '#7ab08e'; ctx.font = '11px Arial'; ctx.textAlign = 'left'; ctx.fillText('página ' + (page + 1) + '/' + Math.ceil(n / 6) + '  ·  ←→↑↓ escolher · ENTER tela cheia · TAB filtro · T timelapse das obras · ESC sair', 15, 494 + 20);
      this.ticker(ctx, S, 540);
      ctx.restore();
    },
    rotulo(ctx, f, x, y, w, h, S, grande) {
      const nm = typeof f.nome === 'function' ? f.nome() : f.nome;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x, y, w, grande ? 24 : 17);
      ctx.fillStyle = '#d8ffe8'; ctx.font = 'bold ' + (grande ? 13 : 9) + 'px Arial'; ctx.textAlign = 'left'; let t = nm; while (ctx.measureText(t).width > w - 60 && t.length > 8) t = t.slice(0, -2); ctx.fillText(t, x + 5, y + (grande ? 16 : 12));
      const seg = Math.floor(S.time % 60); ctx.textAlign = 'right'; ctx.fillStyle = '#9dff9d'; ctx.font = (grande ? 'bold 11px' : '9px') + ' Arial'; ctx.fillText(L.horaTxt(S) + ':' + String(seg).padStart(2, '0'), x + w - 5, y + h - 5);
      ctx.fillStyle = Math.floor(performance.now() / 500) % 2 ? '#ff3a3a' : '#7a1a1a'; ctx.beginPath(); ctx.arc(x + w - 10, y + (grande ? 12 : 8.5), grande ? 4 : 3, 0, TAU); ctx.fill();
      if (f.erro) { ctx.fillStyle = '#ff6a6a'; ctx.textAlign = 'left'; ctx.fillText('FALHA', x + 5, y + h - 5); }
    },
    ticker(ctx, S, y) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, y - 14, 800, 50);
      ctx.font = 'bold 11px Arial'; ctx.textAlign = 'left';
      const g = CM.gravacoes.slice(-3).reverse();
      if (!g.length) { ctx.fillStyle = '#7ab08e'; ctx.fillText('Nenhum incidente gravado ainda.', 15, y); return; }
      g.forEach((r, i) => { ctx.fillStyle = r.sev === 'crime' ? '#ff7a7a' : '#9ac8ae'; ctx.fillText('[' + r.hora + '] ' + r.tipo + ' · ' + r.msg, 15, y + i * 15); });
    }
  };
  CM.tela = tela; CM.renderaFeed = renderaFeed;
  G.overlay.atalhos['KeyC'] = () => G.overlay.abrir(tela);
})(window.G = window.G || {});
