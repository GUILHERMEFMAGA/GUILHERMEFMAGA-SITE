// testa o HOSPITAL e o ESTÁDIO: aperta todos os botões (act) e todos os itens dos menus,
// compra o ingresso, entra no campo, deixa a partida rolar e invade o gramado para ver os guardas.
// uso: node publicos_teste.js          (leva uns 40 s)
const { entra, acha, L, G, S, W, step } = require('./interior.js');
const erros = []; let nAcoes = 0, nItens = 0;

const prepara = () => { S.save.money = 5000; S.player.hp = 60; S.bebado = 0; };

// aperta tudo da sala atual (menus: aperta cada item)
function aperta(rot, R) {
  for (const o of R.objs.slice()) {
    if (!o.act || o.t === 'porta') continue;
    try {
      nAcoes++; prepara(); o.act(S, R, o);
      for (let i = 0; i < 40 && S.trans; i++) step(1);
      const m = R.menu;
      if (m) m.itens.forEach((it, i) => {
        if (S.inside !== R) return;
        try { nItens++; prepara(); R.menu = m; m.sel = i; if (it.fn) it.fn(S, R, it); if (m.atualiza) m.atualiza(m, S, R); }
        catch (e) { erros.push(rot + ' ' + o.t + ' item "' + it.n + '": ' + e.message); }
      });
    } catch (e) { erros.push(rot + ' ' + o.t + ': ' + e.message); }
    R.menu = null; R.mini = null; R.sentado = null;
    if (S.inside !== R) { erros.push(rot + ' ' + o.t + ': mudou de sala sem querer'); break; }
  }
  try { step(3); } catch (e) { erros.push(rot + ' desenho: ' + e.message); }
}

function vaiPara(id) {                        // usa o próprio sistema de salas
  L.irSala(S, id, null, null, null);
  for (let i = 0; i < 80 && (S.trans || S.inside.id !== id); i++) step(1);
  step(5);
  if (S.inside.id !== id) erros.push('não cheguei na sala ' + id + ' (' + S.inside.id + ')');
  return S.inside;
}

function hospital() {
  const pl = acha('tipo:hospital'); if (!entra(pl)) { erros.push('não entrou no hospital'); return; }
  for (const sid of ['entrada', 'enfermaria', 'consultorio']) {
    const R = sid === S.inside.id ? S.inside : vaiPara(sid);
    const antes = nAcoes; aperta('hospital/' + sid, R);
    console.log('hospital/' + sid, 'ações:', nAcoes - antes, '| NPCs:', R.npcs.length, '| objs:', R.objs.length);
  }
  // tratamento gratuito do SUS: tem que curar de verdade
  const R = vaiPara('entrada'); S.player.hp = 20;
  const balcao = R.objs.find(o => o.act && /BALC|ATEND|RECEP|TRIAGEM/i.test(o.label || '')) || R.objs.find(o => o.act && o.t === 'recepcao');
  if (balcao) { balcao.act(S, R, balcao); const m = R.menu; if (m) { const it = m.itens.find(i => /grát|SUS|ferimento/i.test(i.n)); if (it) { it.fn(S, R, it); console.log('SUS: hp 20 ->', Math.round(S.player.hp)); if (S.player.hp < 90) erros.push('SUS não curou (hp ' + S.player.hp + ')'); } else erros.push('sem item grátis no balcão'); } R.menu = null; }
}

function estadio() {
  const pl = acha('tipo:estadio'); if (!entra(pl)) { erros.push('não entrou no estádio'); return; }
  console.log('hora', L.hora(S).toFixed(1));
  let R = S.inside;
  // 1) sem ingresso: a catraca não deixa entrar no campo
  delete S.ingressoEstadio; prepara();
  const catraca = R.objs.find(o => o.t === 'porta' && /CAMPO|GRAMADO|ARQUIB|CATRACA/i.test((o.label || '') + (o.placa || '')));
  if (!catraca) erros.push('sem porta para o campo no saguão: ' + R.objs.filter(o => o.t === 'porta').map(o => o.label).join('|'));
  else { catraca.act(S, R, catraca); for (let i = 0; i < 40 && S.trans; i++) step(1); if (S.inside.id === 'campo') erros.push('entrou no campo SEM ingresso'); else console.log('sem ingresso: barrado ✔'); }
  // 2) aperta tudo no saguão (inclui comprar o ingresso)
  const antes = nAcoes; aperta('estadio/entrada', R); console.log('estadio/entrada ações:', nAcoes - antes);
  // 3) compra de verdade e passa pela catraca
  R = S.inside; prepara();
  const bil = R.objs.find(o => o.act && /INGRESSO|BILHET/i.test(o.label || '')); if (!bil) erros.push('sem bilheteria');
  else { bil.act(S, R, bil); const it = R.menu.itens[0]; const m0 = S.save.money; it.fn(S, R, it); R.menu = null; console.log('ingresso:', JSON.stringify(S.ingressoEstadio), '| dinheiro', m0, '->', S.save.money); if (!S.ingressoEstadio) erros.push('ingresso não foi comprado'); }
  if (catraca) { catraca.act(S, R, catraca); for (let i = 0; i < 60 && (S.trans || S.inside.id !== 'campo'); i++) step(1); }
  R = S.inside; if (R.id !== 'campo') { erros.push('com ingresso não entrei no campo (' + R.id + ')'); return; }
  console.log('no campo ✔ | NPCs:', R.npcs.length, '| objs:', R.objs.length);
  // 4) deixa a partida rolar
  const m0 = JSON.stringify(S.estadio && S.estadio.placar);
  for (let k = 0; k < 6; k++) { for (let i = 0; i < 40; i++) step(1); }
  console.log('placar:', JSON.stringify(S.estadio && S.estadio.placar), '(antes', m0 + ') min', S.estadio && Math.round(S.estadio.min));
  aperta('estadio/campo', R);
  // 5) invade o gramado: depois de ~2 s os guardas expulsam e cobram $50
  R = S.inside; if (R.id !== 'campo') { erros.push('o teste dos botões tirou o jogador do campo (' + R.id + ')'); R = vaiPara('campo'); }
  // a invasão: o jogador fica parado no meio do gramado; os seguranças o levam até o portão (R.invasao = -4) e cobram a multa
  prepara(); S.save.money = 1000; R.px = 730; R.py = 575; R.invasao = 0;
  const din0 = S.save.money; let expulso = false, quadros = 0;
  for (let i = 0; i < 600 && !expulso; i++) { step(1); quadros++; if (S.inside.id !== 'campo') break; if (S.inside.invasao < 0) expulso = true; }
  const Rf = S.inside, gastou = Math.round(din0 - S.save.money);
  console.log('invasão: expulso =', expulso, 'após', quadros, 'quadros | y do jogador', Math.round(Rf.py), '(portão em', Math.round(Rf.portaX) + ',' + Math.round(Rf.y1 - 100) + ') | multa $' + gastou);
  if (!expulso) erros.push('invadi o gramado e os guardas não me expulsaram');
  else if (gastou !== 50) erros.push('multa diferente de $50: ' + gastou);
  // sair do campo pela porta e voltar ao saguão
  const pt = S.inside.objs.find(o => o.t === 'porta'); if (pt) { pt.act(S, S.inside, pt); for (let i = 0; i < 80 && (S.trans || S.inside.id === 'campo'); i++) step(1); console.log('saí do campo → sala', S.inside.id); if (S.inside.id === 'campo') erros.push('a porta do campo não saiu'); }
}

(async () => {
  try { hospital(); } catch (e) { erros.push('hospital: ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
  S.inside = null; S.mode = 'play'; S.trans = null;
  try { estadio(); } catch (e) { erros.push('estadio: ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
  console.log('AÇÕES', nAcoes, 'ITENS DE MENU', nItens, 'ERROS', erros.length);
  erros.slice(0, 20).forEach(e => console.log(' ✗', e));
  process.exit(erros.length ? 1 : 0);
})();
