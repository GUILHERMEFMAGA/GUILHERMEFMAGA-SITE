/* =====================================================================
   GOVERNO.JS — a PREFEITURA e a política da cidade
     • Você decide o que o prefeito faz: gabinete na Prefeitura de Ribeirão
     • Obras: manda as construtoras fazerem escola, hospital, fábrica, hotel...
       (primeiro vem o PLANEJAMENTO com a placa do projeto, depois as etapas da obra)
     • Ruas INTERDITADAS: obras grandes fecham o trecho da rua (cones, barreiras e placa);
       os carros da cidade desviam. Construtora relapsa esquece de reabrir — o prefeito resolve.
     • Orçamento (impostos, segurança, saúde, educação), pauta do dia (propina, greve, dengue...),
       aprovação popular e ELEIÇÃO a cada 10 dias.
   ===================================================================== */
(function (G) {
  'use strict';
  const W = G.world, L = G.lugares, K = L.kit, SP = G.sprites, C = G.cidade, O = K.O, rand = K.rand, clamp = K.clamp, pick = K.pick, TAU = Math.PI * 2;
  const GV = G.governo = { fechados: [] };
  const look = o => Object.assign(SP.randomLook(), { acc: 'none' }, o);
  const $ = v => '$' + Math.round(v);

  // ---------- o estado do governo (vai junto com o save) ----------
  const gov = S => {
    const s = S.save;
    if (!s.gov) s.gov = { caixa: 6000, imposto: 10, aprov: 62, dia: Math.floor(S.dayT || 0), pauta: [], hist: [], seg: 1, saude: 1, edu: 1, eleicao: 10, bloqueio: 0, corrupcao: 0, ruas: [], reabertas: {}, nomePref: 'Ademar Costa', mandatos: 1 };
    return s.gov;
  };
  GV.gov = gov;
  const nota = (g, txt) => { g.hist.unshift('Dia ' + g.dia + ': ' + txt); if (g.hist.length > 10) g.hist.pop(); };

  // ---------- as cinco cidades e seus trechos de rua ----------
  const faixa = k => ({ a: k === 0 ? 0 : W.CIDADES[k - 1].ate, b: Math.min(W.CIDADES[k].ate, W.COLS + 1), nome: W.CIDADES[k].nome });
  const regiaoDoLote = l => C.regiaoDe(l.x + l.w / 2, l.y + l.h / 2).nome;
  const esperando = l => !l.ativo && C.estadoDe(l).f < 0 && !l.encomendado && l.tam !== 'a';

  // trecho de rua entre dois cruzamentos: retângulo no mundo
  function retTrecho(axis, idx, a) {
    const T = W.T, R = W.ROAD * T;
    if (axis === 'h') return { x: W.roadLeft(a) + R, y: W.roadTop(idx), w: W.roadLeft(a + 1) - W.roadLeft(a) - R, h: R };
    return { x: W.roadLeft(idx), y: W.roadTop(a) + R, w: R, h: W.roadTop(a + 1) - W.roadTop(a) - R };
  }
  const chave = f => f.axis + f.idx + ':' + f.a;

  // ---------- relógio do governo: dias, impostos, pauta, eleição ----------
  const OBRAS = [
    { tipo: 'escola', nome: 'Escola Municipal', custo: 2500, tam: 'g', desc: 'educação: aprovação sobe quando fica pronta' },
    { tipo: 'hospital', nome: 'Hospital', custo: 4000, tam: 'g', desc: 'mais um hospital para atender acidentes' },
    { tipo: 'fabrica', nome: 'Fábrica (empregos)', custo: 3500, tam: 'g', desc: 'gera empregos e impostos' },
    { tipo: 'hotel', nome: 'Hotel (turismo)', custo: 3000, tam: 'g', desc: 'atrai turistas e impostos' },
    { tipo: 'shopping', nome: 'Shopping', custo: 5000, tam: 'g', desc: 'muitos empregos e muita receita' },
    { tipo: 'empresa', nome: 'Empresa / escritórios', custo: 3200, tam: 'g', desc: 'empregos de escritório' },
    { tipo: 'casa', nome: 'Moradia popular', custo: 700, tam: 'p', desc: 'casa nova para as famílias' },
    { tipo: 'comercio', nome: 'Incentivo ao comércio', custo: 900, tam: 'p', desc: 'uma loja nova no bairro' },
    { tipo: 'predio', nome: 'Edifício residencial', custo: 1800, tam: 'p', desc: 'prédio de apartamentos' },
  ];
  GV.OBRAS = OBRAS;

  function receita(S) {
    const g = gov(S); let prontas = 0, obras = 0;
    W.lotes.forEach(l => { if (l.ativo) prontas++; else if (l.est && l.est.f >= 0) obras++; });
    const rec = Math.round(600 + prontas * 12 * g.imposto / 10);
    const desp = Math.round(500 + obras * 60 + (g.seg - 1) * 220 + g.seg * 60 + g.saude * 100 + g.edu * 80);
    return { rec, desp, prontas, obras };
  }
  GV.receita = receita;

  const PAUTAS = [
    g => ({ t: 'A empreiteira ALFA oferece $1500 por fora para vencer a licitação de uma obra.', op: [
      { n: 'Aceitar a propina ($1500 no seu bolso)', d: 'rende dinheiro, mas se descobrirem o FBI investiga', f: S => { S.save.money += 1500; g.corrupcao++; nota(g, 'propina aceita (ninguém viu... ainda)'); } },
      { n: 'Recusar e denunciar', d: 'a população gosta de prefeito honesto', f: S => { g.aprov = clamp(g.aprov + 4, 0, 100); nota(g, 'propina recusada'); } } ] }),
    g => ({ t: 'Os vereadores querem aumentar o próprio salário.', op: [
      { n: 'Aprovar (-$400 do caixa)', d: 'os vereadores ficam do seu lado', f: S => { g.caixa -= 400; g.aprov = clamp(g.aprov - 3, 0, 100); nota(g, 'aumento dos vereadores aprovado'); } },
      { n: 'Vetar', d: 'o povo aplaude', f: S => { g.aprov = clamp(g.aprov + 2, 0, 100); nota(g, 'aumento vetado'); } } ] }),
    g => ({ t: 'Moradores reclamam do asfalto esburacado. Pedem o recapeamento de uma avenida.', op: [
      { n: 'Mandar recapear (-$900, rua interditada por um tempo)', d: 'a obra fecha um trecho de rua', f: S => { if (!GV.recapear(S, null, 900)) { g.aprov -= 2; } } },
      { n: 'Ignorar', d: 'os buracos continuam', f: S => { g.aprov = clamp(g.aprov - 3, 0, 100); nota(g, 'pedido de asfalto ignorado'); } } ] }),
    g => ({ t: 'Professores ameaçam greve por reajuste.', op: [
      { n: 'Dar o reajuste (-$600, educação sobe)', d: 'escolas funcionando', f: S => { g.caixa -= 600; g.edu = Math.min(3, g.edu + 1); g.aprov = clamp(g.aprov + 3, 0, 100); nota(g, 'reajuste dos professores'); } },
      { n: 'Negociar sem pagar', d: 'a greve pode durar', f: S => { g.aprov = clamp(g.aprov - 4, 0, 100); nota(g, 'greve dos professores'); } } ] }),
    g => ({ t: 'Surto de dengue: os postos de saúde estão lotados.', op: [
      { n: 'Fazer mutirão de saúde (-$700)', d: 'combate o mosquito e acalma a população', f: S => { g.caixa -= 700; g.aprov = clamp(g.aprov + 5, 0, 100); nota(g, 'mutirão contra a dengue'); } },
      { n: 'Não fazer nada', d: 'o hospital vai encher', f: S => { g.aprov = clamp(g.aprov - 6, 0, 100); nota(g, 'surto de dengue ignorado'); } } ] }),
    g => ({ t: 'Uma fábrica estrangeira quer se instalar na região se ganhar isenção de impostos.', op: [
      { n: 'Dar isenção (-$300 de caixa)', d: 'a fábrica vai começar a ser planejada', f: S => { g.caixa -= 300; const l = W.lotes.find(x => esperando(x) && x.tam === 'g'); if (l && C.encomenda(l, 'fabrica', 60)) nota(g, 'fábrica estrangeira em ' + regiaoDoLote(l)); else nota(g, 'não há terreno livre para a fábrica'); } },
      { n: 'Recusar', d: 'a empresa vai embora', f: S => { nota(g, 'fábrica recusada'); } } ] }),
    g => ({ t: 'O secretário de segurança pede mais viaturas e policiais.', op: [
      { n: 'Investir em segurança (-$500)', d: 'a cidade fica mais segura', f: S => { g.caixa -= 500; g.seg = Math.min(3, g.seg + 1); nota(g, 'mais policiais nas ruas'); } },
      { n: 'Segurar o dinheiro', d: 'sem investimento, o crime cresce', f: S => { g.aprov = clamp(g.aprov - 2, 0, 100); nota(g, 'orçamento da segurança mantido'); } } ] }),
  ];

  function novoDia(S, g) {
    g.dia++;
    const r = receita(S);
    g.caixa += r.rec - r.desp;
    let d = 0;
    if (g.imposto > 10) d -= (g.imposto - 10) * 0.7; else d += (10 - g.imposto) * 0.3;
    if (r.obras > 0) d += Math.min(2, r.obras * 0.3);
    d += (g.seg - 1) * 0.8 + (g.saude - 1) * 0.8 + (g.edu - 1) * 0.8;
    const abertas = GV.fechados.filter(f => f.relapsa).length; d -= abertas * 1.2;
    if (g.caixa < 0) d -= 3;
    g.aprov = clamp(g.aprov + d, 0, 100);
    nota(g, 'receita ' + $(r.rec) + ', despesa ' + $(r.desp) + ' → caixa ' + $(g.caixa));
    if (g.bloqueio > 0) g.bloqueio--;
    if (g.pauta.length < 3 && Math.random() < 0.8) { const idx = Math.floor(Math.random() * PAUTAS.length); g.pauta.push(idx); }
    // corrupção descoberta → inquérito
    if (g.corrupcao >= 3) {
      g.corrupcao = 0; g.aprov = clamp(g.aprov - 30, 0, 100); const multa = Math.round(S.save.money * 0.2); S.save.money -= multa;
      nota(g, 'FBI abre inquérito contra a prefeitura'); G.banner('OPERAÇÃO LAVA-RUA', 'O FBI abriu inquérito sobre as propinas. Multa: ' + $(multa), true, 4); G.say('O FBI descobriu as propinas da prefeitura! Você pagou multa de ' + $(multa) + '.', 8);
    }
    // eleição
    if (g.dia >= g.eleicao) {
      g.eleicao += 10;
      if (g.aprov < 40) { g.bloqueio = 3; g.mandatos = 0; g.nomePref = pick(['Dr. Gilberto Moura', 'Dra. Sônia Vaz', 'Coronel Mendes']); g.aprov = 55; nota(g, 'ELEIÇÃO: a oposição venceu (' + g.nomePref + ')'); G.banner('ELEIÇÃO!', 'A oposição venceu. ' + g.nomePref + ' é o novo prefeito.', true, 4); }
      else { g.aprov = clamp(g.aprov + 8, 0, 100); g.mandatos++; nota(g, 'ELEIÇÃO: prefeito reeleito!'); G.banner('REELEITO!', g.nomePref + ' venceu a eleição com ' + Math.round(g.aprov) + '% de aprovação.', false, 4); }
    }
    if (G.save) G.save();
  }

  // ---------- ruas interditadas ----------
  GV.recapear = function (S, nomeRegiao, custo) {
    const g = gov(S); if (g.caixa < custo) { G.say('Caixa insuficiente (' + $(g.caixa) + ').', 3); return false; }
    const cid = nomeRegiao ? W.CIDADES.findIndex(c => c.nome === nomeRegiao) : 0, k = Math.max(0, cid), fx = faixa(k);
    for (let t = 0; t < 40; t++) {
      const axis = Math.random() < 0.5 ? 'h' : 'v';
      let idx, a;
      if (axis === 'h') { idx = Math.floor(rand(1, W.ROWS)); a = Math.floor(rand(fx.a, fx.b)); if (a >= W.COLS) continue; if (!W.cruzaOk(a, idx)) continue; }
      else { idx = Math.floor(rand(Math.max(1, fx.a), Math.min(W.COLS, fx.b))); if (W.RIVERS.includes(idx)) continue; a = Math.floor(rand(0, W.ROWS)); }
      if (GV.fechados.some(f => f.axis === axis && f.idx === idx && f.a === a)) continue;
      g.caixa -= custo; g.ruas.push({ axis, idx, a, ate: C.t + 260, nome: 'RECAPEAMENTO' });
      const r = retTrecho(axis, idx, a); G.say('Obra de recapeamento começou em ' + fx.nome + '. O trecho está interditado por um tempo.', 6); nota(g, 'recapeamento em ' + fx.nome);
      sincroniza(S); return true;
    }
    G.say('Não achei um trecho livre para a obra.', 3); return false;
  };

  function sincroniza(S) {
    const g = gov(S), lista = [];
    W.lotes.forEach(l => {
      if (!l.rua || l.tam === 'a' || !l.est) return;
      const f = l.est.f, by = l.by + 1, bx = l.bx; if (by > W.ROWS) return;
      let aberta = false, relapsa = false;
      if (f >= 1 && f <= 3) aberta = true;
      else if (f >= 4 && l.neg && !g.reabertas[l.id]) { if (l.fimDia == null) l.fimDia = g.dia; if (g.dia - l.fimDia < 3) { aberta = true; relapsa = true; } }
      if (aberta) lista.push({ axis: 'h', idx: by, a: bx, motivo: relapsa ? 'OBRA ABANDONADA' : 'OBRA ' + (l.proj.nome || ''), relapsa, lote: l });
    });
    g.ruas = g.ruas.filter(r => r.ate > C.t);
    g.ruas.forEach(r => lista.push({ axis: r.axis, idx: r.idx, a: r.a, motivo: r.nome, relapsa: false, rua: r }));
    lista.forEach(f => { f.rect = retTrecho(f.axis, f.idx, f.a); f.reg = C.regiaoDe(f.rect.x + f.rect.w / 2, f.rect.y + f.rect.h / 2).nome; });
    GV.fechados = lista;
    W.fechado.clear(); lista.forEach(f => W.fechado.add(chave(f)));
  }
  GV.sincroniza = sincroniza;

  let acc = 0;
  G.extras.add((S, dt) => {
    if (!S.save) return;
    const g = gov(S);
    acc += dt; if (acc < 1) return; acc = 0;
    const dia = Math.floor(S.dayT || 0);
    let n = 0; while (g.dia < dia && n++ < 6) novoDia(S, g);
    if (g.dia > dia) { g.eleicao -= g.dia - dia; g.dia = dia; }      // jogo recarregado: o relógio do dia recomeça
    sincroniza(S);
  });

  // desenho das interdições (chamado por cidade.js)
  GV.desenhar = function (ctx, S, x0, y0, x1, y1, t) {
    GV.fechados.forEach(f => {
      const r = f.rect; if (r.x > x1 || r.x + r.w < x0 || r.y > y1 || r.y + r.h < y0) return;
      const horiz = f.axis === 'h', R = W.ROAD * W.T;
      // asfalto novo / cascalho no meio
      ctx.fillStyle = 'rgba(20,20,26,0.35)'; ctx.fillRect(r.x, r.y, r.w, r.h);
      // barreiras nas duas pontas
      const barra = (px, py) => {
        const bw = horiz ? 12 : R - 24, bh = horiz ? R - 24 : 12;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px - bw / 2 + 3, py - bh / 2 + 4, bw, bh);
        for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#f2f2f2' : '#e8601a'; if (horiz) ctx.fillRect(px - bw / 2, py - bh / 2 + k * bh / 8, bw, bh / 8 + 0.5); else ctx.fillRect(px - bw / 2 + k * bw / 8, py - bh / 2, bw / 8 + 0.5, bh); }
        const on = Math.floor(t * 2.5) % 2 === 0; ctx.fillStyle = on ? '#ffb020' : '#6a4a10'; ctx.beginPath(); ctx.arc(px, py - (horiz ? bh / 2 - 4 : 0), 4, 0, TAU); ctx.fill();
        if (on) { ctx.fillStyle = 'rgba(255,170,30,0.25)'; ctx.beginPath(); ctx.arc(px, py - (horiz ? bh / 2 - 4 : 0), 14, 0, TAU); ctx.fill(); }
      };
      if (horiz) { barra(r.x + 16, r.y + r.h / 2); barra(r.x + r.w - 16, r.y + r.h / 2); } else { barra(r.x + r.w / 2, r.y + 16); barra(r.x + r.w / 2, r.y + r.h - 16); }
      // cones ao longo da pista
      const n = Math.floor((horiz ? r.w : r.h) / 90);
      for (let k = 1; k < n; k++) for (const s of [0.18, 0.82]) {
        const cx = horiz ? r.x + k * r.w / n : r.x + r.w * s, cy = horiz ? r.y + r.h * s : r.y + k * r.h / n;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(cx + 2, cy + 3, 6, 4, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#f26a1a'; ctx.beginPath(); ctx.moveTo(cx, cy - 11); ctx.lineTo(cx + 6, cy + 3); ctx.lineTo(cx - 6, cy + 3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(cx - 3, cy - 4, 6, 3);
      }
      // placa no meio
      const mx = r.x + r.w / 2, my = r.y + r.h / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(mx - 62, my - 14, 128, 34);
      ctx.fillStyle = f.relapsa ? '#c8302a' : '#f2c21a'; ctx.fillRect(mx - 64, my - 18, 128, 34);
      ctx.fillStyle = '#16181c'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.fillText('RUA INTERDITADA', mx, my - 4); ctx.font = 'bold 9px Arial'; ctx.fillText(f.motivo, mx, my + 9); ctx.textAlign = 'left';
      // operário
      ctx.fillStyle = '#f2c21a'; ctx.beginPath(); ctx.arc(mx + 80 * Math.sin(t * 0.3 + r.x), my + 24, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8601a'; ctx.fillRect(mx + 80 * Math.sin(t * 0.3 + r.x) - 4, my + 28, 8, 7);
    });
  };

  // =====================================================================
  //  A PREFEITURA (interior) e o menu do gabinete
  // =====================================================================
  const abre = (S, titulo, itens, info, rod) => L.abrirMenu(S, { titulo, itens, info: info || (S2 => 'Caixa: ' + $(gov(S2).caixa) + '   Aprovação: ' + Math.round(gov(S2).aprov) + '%'), rodape: rod || 'W/S escolher  ·  E confirmar  ·  ESC sair' });

  function menuPrincipal(S) {
    const g = gov(S), r = receita(S);
    if (g.bloqueio > 0) { G.say('A oposição governa a cidade por mais ' + g.bloqueio + ' dia(s). O prefeito ' + g.nomePref + ' não aceita suas ordens agora.', 5); return; }
    abre(S, 'GABINETE DO PREFEITO', [
      { n: 'Prefeito ' + g.nomePref + ' — pauta do dia (' + g.pauta.length + ' assunto' + (g.pauta.length === 1 ? '' : 's') + ')', desc: 'decida os assuntos que a secretária trouxe', fn: S2 => menuPauta(S2) },
      { n: 'Obras e projetos', desc: 'mande as construtoras construírem na cidade', fn: S2 => menuObras(S2) },
      { n: 'Ruas interditadas (' + GV.fechados.length + ')', desc: 'veja e reabra as ruas fechadas por obras', fn: S2 => menuRuas(S2) },
      { n: 'Orçamento e impostos', desc: 'imposto ' + g.imposto + '%, segurança ' + g.seg + ', saúde ' + g.saude + ', educação ' + g.edu, fn: S2 => menuOrc(S2) },
      { n: 'Relatório da cidade', desc: 'receita, despesas, obras e eleição', fn: S2 => { G.say('Receita/dia ' + $(r.rec) + ' · Despesa/dia ' + $(r.desp) + ' · ' + r.prontas + ' prédios prontos · ' + r.obras + ' obras · eleição no dia ' + g.eleicao + ' (hoje é o dia ' + g.dia + ').', 9); } },
      { n: 'Diário do prefeito', desc: g.hist[0] || 'sem notícias ainda', fn: S2 => { G.say(g.hist.slice(0, 3).join('  |  ') || 'Nada registrado ainda.', 9); } },
      { n: 'Doar $500 do seu bolso ao caixa', desc: 'ajuda a pagar as obras', fn: S2 => { if (!K.gasta(S2, 500)) return; g.caixa += 500; G.say('O caixa da prefeitura recebeu $500.', 3); } },
    ]);
  }
  const voltar = () => ({ n: '← Voltar', fn: S2 => menuPrincipal(S2) });

  function menuPauta(S) {
    const g = gov(S);
    if (!g.pauta.length) { G.say('A secretária não trouxe nenhum assunto hoje. A cidade está tranquila.', 4); return; }
    const itens = g.pauta.map((idx, k) => { const p = PAUTAS[idx](g); return { n: p.t.slice(0, 74) + (p.t.length > 74 ? '...' : ''), desc: 'E para decidir', fn: S2 => decide(S2, k) }; });
    itens.push(voltar()); abre(S, 'PAUTA DO DIA', itens);
  }
  function decide(S, k) {
    const g = gov(S), p = PAUTAS[g.pauta[k]](g);
    const itens = p.op.map(o => ({ n: o.n, desc: o.d, fn: S2 => { o.f(S2); g.pauta.splice(k, 1); G.save(); G.snd.beep(); menuPauta(S2); } }));
    itens.push({ n: '← Deixar para depois', fn: S2 => menuPauta(S2) });
    abre(S, p.t.slice(0, 60) + (p.t.length > 60 ? '...' : ''), itens, S2 => p.t.slice(0, 120));
  }

  function menuObras(S) {
    const g = gov(S);
    const itens = OBRAS.map(o => ({ n: o.nome, preco: o.custo, desc: o.desc, fn: S2 => menuLocal(S2, o) }));
    itens.push({ n: 'Recapear uma avenida', preco: 900, desc: 'interdita um trecho de rua por um tempo', fn: S2 => menuLocalRua(S2) });
    itens.push(voltar());
    abre(S, 'OBRAS — O QUE CONSTRUIR?', itens);
  }
  function menuLocal(S, o) {
    const itens = W.CIDADES.map((c, k) => { const n = W.lotes.filter(l => esperando(l) && l.tam === o.tam && regiaoDoLote(l) === c.nome).length; return { n: c.nome, desc: n ? n + ' terreno(s) livre(s)' : 'sem terreno livre', fn: S2 => construir(S2, o, c.nome) }; });
    itens.push({ n: '← Voltar', fn: S2 => menuObras(S2) });
    abre(S, o.nome.toUpperCase() + ' — EM QUAL CIDADE?', itens);
  }
  function construir(S, o, cidade) {
    const g = gov(S);
    const l = W.lotes.find(x => esperando(x) && x.tam === o.tam && regiaoDoLote(x) === cidade);
    if (!l) { G.say('Não há terreno livre em ' + cidade + ' para esse projeto.', 4); return; }
    if (g.caixa < o.custo) { G.say('O caixa só tem ' + $(g.caixa) + '. A obra custa ' + $(o.custo) + '. (Dá para doar do seu bolso.)', 5); return; }
    g.caixa -= o.custo;
    C.encomenda(l, o.tipo, 120); nota(g, o.nome + ' encomendada em ' + cidade);
    G.say('Projeto aprovado! A construtora vai PLANEJAR a obra (vai aparecer a placa do projeto) e depois começar a construir. ' + o.nome + ' em ' + cidade + '.', 8);
    G.banner('OBRA ENCOMENDADA', o.nome + ' — ' + cidade, false, 3);
    S.inside.menu = null;
    G.save();
  }
  function menuLocalRua(S) {
    const itens = W.CIDADES.map(c => ({ n: c.nome, desc: 'recapear um trecho aleatório', fn: S2 => { if (GV.recapear(S2, c.nome, 900)) S2.inside.menu = null; else menuObras(S2); } }));
    itens.push({ n: '← Voltar', fn: S2 => menuObras(S2) }); abre(S, 'RECAPEAMENTO — ONDE?', itens);
  }
  function menuRuas(S) {
    const g = gov(S);
    const itens = GV.fechados.map(f => ({ n: f.reg + ' — ' + f.motivo, desc: f.relapsa ? 'construtora abandonou a obra: multar e reabrir ($200 de multa para o caixa)' : 'em andamento (reabrir antes custa $300 do caixa)', fn: S2 => {
      const custo = f.relapsa ? 0 : 300; if (g.caixa < custo) { G.say('Caixa insuficiente.', 3); return; }
      g.caixa -= custo; if (f.relapsa) { g.caixa += 200; g.reabertas[f.lote.id] = true; nota(g, 'construtora multada e rua reaberta'); } else if (f.lote) { g.reabertas[f.lote.id] = true; f.lote.rua = false; nota(g, 'obra liberou a rua'); } else if (f.rua) { f.rua.ate = 0; nota(g, 'recapeamento encerrado'); }
      sincroniza(S2); G.say('Rua reaberta ao trânsito.', 3); menuRuas(S2);
    } }));
    if (!itens.length) itens.push({ n: 'Nenhuma rua interditada', desc: 'tudo liberado', fn: () => {} });
    itens.push(voltar()); abre(S, 'RUAS INTERDITADAS', itens);
  }
  function menuOrc(S) {
    const g = gov(S);
    const nv = (k, nome, desc, custo) => ({ n: nome + ': nível ' + g[k] + '/3', desc: desc + (g[k] < 3 ? ' (subir custa $' + custo + ' agora)' : ' (máximo)'), fn: S2 => { if (g[k] >= 3) { G.say('Já está no máximo.', 2); return; } if (g.caixa < custo) { G.say('Caixa insuficiente.', 3); return; } g.caixa -= custo; g[k]++; nota(g, nome + ' subiu para ' + g[k]); menuOrc(S2); } });
    abre(S, 'ORÇAMENTO E IMPOSTOS', [
      { n: 'Imposto: ' + g.imposto + '%  (aumentar +2)', desc: 'mais receita, menos aprovação', fn: S2 => { g.imposto = Math.min(30, g.imposto + 2); menuOrc(S2); } },
      { n: 'Imposto: ' + g.imposto + '%  (reduzir -2)', desc: 'menos receita, mais aprovação', fn: S2 => { g.imposto = Math.max(2, g.imposto - 2); menuOrc(S2); } },
      nv('seg', 'Segurança', 'menos crimes na cidade', 600), nv('saude', 'Saúde', 'hospitais melhores', 600), nv('edu', 'Educação', 'escolas melhores', 600), voltar()]);
  }

  // ---------- as salas ----------
  const porta = (x, y, w, o) => O('porta', x, y, w, 54, Object.assign({ solid: false, k: 10, r: 50 }, o));
  L.construtores['tipo:prefeitura'] = {
    criar(sid, lg) {
      const pl = lg.place;
      if (sid === 'gabinete') return gabinete(lg);
      const R = L.novaSala({ place: pl, w: 880, h: 420, nome: 'PREFEITURA DE RIBEIRÃO', cor: '#1f4f8a', piso: 'ladrilho', pisoCores: ['#e8e2d0', '#c8bfa4'], parede: '#2a4a7a', subtitulo: 'seg a sex, 8h às 18h' });
      R.chegada = { x: R.portaX, y: R.y1 + 10 };
      const add = (...a) => R.objs.push(...a);
      add(O('recepcao', 340, 220, 260, 44, { e: 30, label: 'ATENDIMENTO AO CIDADÃO', r: 60, act: S => { const g = gov(S), r = receita(S); G.say('Prefeito: ' + g.nomePref + '. Aprovação ' + Math.round(g.aprov) + '%. ' + r.prontas + ' prédios novos prontos e ' + r.obras + ' obras andando. Eleição no dia ' + g.eleicao + '.', 8); } }));
      add(porta(780, 96, 70, { cor: '#6a5a3a', placa: 'GABINETE', label: 'IR AO GABINETE DO PREFEITO', act: S => L.irSala(S, 'gabinete', 440, 300, Math.PI) }));
      add(porta(100, 96, 70, { cor: '#4a4e58', placa: 'PLENÁRIO', label: 'CÂMARA DE VEREADORES', act: S => G.say('A sessão da Câmara começa à tarde. As decisões importantes passam pelo gabinete do prefeito.', 5) }));
      add(O('banco_espera', 130, 360, 170, 26, { e: 16, label: 'SENTAR NA ESPERA', r: 30, act: S => { K.cura(S, 4); G.say('Você esperou sentado um pouco. (+4 vida)', 3); } }));
      add(O('banco_espera', 580, 360, 170, 26, { e: 16, label: 'SENTAR NA ESPERA', r: 30, act: S => { K.cura(S, 4); G.say('Você esperou sentado um pouco. (+4 vida)', 3); } }));
      add(O('planta', 90, 470, 40, 50, {}), O('planta', 860, 470, 40, 50, {}));
      R.npcs.push({ x: 470, y: 238, p: look({ shirt: '#2a4a7a', fem: true, hairStyle: 'coque' }), falas: ['Prefeitura de Ribeirão, bom dia!', 'O prefeito está no gabinete. Pode subir.', 'IPTU em dia? O dinheiro vira obra.'], h: Math.PI, fixo: true, nome: 'Secretária Lúcia', dinheiro: 40, label: 'CONVERSAR' });
      R.npcs.push({ x: 220, y: 320, p: look({ shirt: '#c8c0b0', fem: false }), falas: ['Sou vereador. Voto com quem investe na cidade.', 'Dizem que certas empreiteiras pagam por fora...'], h: 0, fixo: true, nome: 'Vereador Osmar', dinheiro: 90 });
      R.npcs.push({ x: 640, y: 320, p: look({ shirt: '#8a4a6a', fem: true }), falas: ['A rua do meu bairro está interditada há dias! Uma obra esquecida.', 'Quero falar com o prefeito sobre o asfalto.'], h: Math.PI, fixo: true, nome: 'Dona Neide', dinheiro: 30 });
      R.deco = x => {
        x.fillStyle = '#c8a24a'; x.fillRect(120, 70, 760, 3);
        x.save(); x.font = 'bold 30px Georgia'; x.textAlign = 'center'; x.fillStyle = '#f4efe0'; x.fillText('PREFEITURA MUNICIPAL', 440, 108); x.font = 'bold 13px Arial'; x.fillStyle = '#ffe04a'; x.fillText('RIBEIRÃO PRETO — TRABALHO E PROGRESSO', 440, 130); x.restore();
        [[200, 0], [680, 1]].forEach(([bx]) => { x.fillStyle = '#3a8a3a'; x.fillRect(bx, 140, 70, 12); x.fillStyle = '#f2d21a'; x.fillRect(bx + 8, 142, 54, 8); });
      };
      R.luzes.push({ x: 440, y: 330, r: 420 });
      return R;
    }
  };
  function gabinete(lg) {
    const pl = lg.place, R = L.novaSala({ place: pl, w: 760, h: 420, nome: 'GABINETE DO PREFEITO', cor: '#6a4a2a', piso: 'xadrez', pisoCores: ['#7a5a3a', '#5a3e22'], parede: '#4a3220', subtitulo: 'decisões da cidade' });
    R.chegada = { x: R.portaX, y: R.y1 + 10 };
    const add = (...a) => R.objs.push(...a);
    add(O('recepcao', 300, 230, 220, 46, { e: 30, label: 'MESA DO PREFEITO — GOVERNAR', r: 64, act: S => menuPrincipal(S) }));
    add(O('bancada', 90, 330, 190, 50, { e: 24, label: 'MAPA DA CIDADE (OBRAS)', r: 52, act: S => { const rr = receita(S); G.say('Obras em andamento: ' + rr.obras + '. Prédios prontos: ' + rr.prontas + '. Ruas interditadas: ' + GV.fechados.length + '.', 7); } }));
    add(O('planta', 90, 220, 40, 50, {}), O('planta', 780, 220, 40, 50, {}));
    add(O('estante', 620, 190, 150, 36, { e: 32, label: 'LIVROS DE LEIS', r: 40, act: S => G.say('Constituição, Código de Obras, Lei Orgânica do Município. Sem leitura, sem prefeito bom.', 5) }));
    add(porta(380, 96, 60, { cor: '#4a4e58', placa: 'SAÍDA', label: 'VOLTAR AO SAGUÃO', act: S => L.irSala(S, 'entrada', 780, 215, Math.PI) }));
    R.porta = { para: 'entrada', px: 780, py: 215, ph: Math.PI, label: 'VOLTAR AO SAGUÃO', rotulo: 'SAGUÃO' };
    R.npcs.push({ x: 410, y: 214, p: look({ shirt: '#1a1c24', pat: 'liso', sleeve: 'longa', fem: false }), falas: ['O senhor manda, eu executo.', 'A população está de olho em cada decisão.', 'Eleição a cada dez dias. Aprovação baixa, e a oposição assume!'], h: Math.PI, fixo: true, nome: 'Prefeito', dinheiro: 500, label: 'CONVERSAR' });
    R.deco = x => {
      x.save(); x.font = 'bold 22px Georgia'; x.textAlign = 'center'; x.fillStyle = '#f2d890'; x.fillText('GABINETE DO PREFEITO', 450, 86); x.restore();
      x.fillStyle = '#7a1a1a'; x.fillRect(120, 112, 80, 44); x.fillStyle = '#f2d21a'; x.fillRect(130, 120, 60, 6); x.fillRect(130, 132, 60, 6);
    };
    R.aoEntrar = S => { const g = gov(S); R.nomeP = g.nomePref; };
    R.luzes = [{ x: 420, y: 320, r: 380 }];
    return R;
  }
})(window.G = window.G || {});
