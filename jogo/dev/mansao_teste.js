// testa a MANSÃO DO CHEFÃO: terreno, portão automático, seguranças (ficam, atiram em policiais, viram inimigos se atacados),
// zona segura e o interior (aperta todos os botões e itens de menu, cofre, cama, arsenal...).
// uso: node mansao_teste.js        (leva uns 60 s)
const { entra, acha, L, G, S, W, step } = require('./interior.js');
const { place } = require('./tp.js');
const M = W.MANSAO, erros = []; let nAcoes = 0, nItens = 0;
const ok = (cond, msg) => { if (!cond) erros.push(msg); console.log((cond ? 'ok   ' : 'FALHOU ') + msg); };
const guardas = () => S.peds.filter(p => p.kind === 'guarda' && p.state !== 'dead');
const vao = () => W.tileAt(M.portao.x, M.portao.y), BUILD = W.TILE.BUILD;
const rodaAte = (f, max) => { for (let i = 0; i < max; i++) { step(1); if (f()) return i; } return -1; };

// ---------- parte 0: onde o jogador nasce (o tp.js já apertou ENTER e começou o jogo) ----------
{ const P0 = S.player;
  ok(G.mansao.dentro(P0.x, P0.y), 'o jogador NASCE dentro dos muros da mansão (' + Math.round(P0.x) + ',' + Math.round(P0.y) + ')');
  ok(S.redCar && Math.hypot(S.redCar.x - P0.x, S.redCar.y - P0.y) < 260, 'o carro vermelho nasce no pátio, perto do jogador'); }

// ---------- parte 1: o mundo lá fora ----------
S.dayT = 0.3; S.heat = 0; S.heatLevel = 0; S.save.money = 5000;
ok(M && M.pronta && M.casa, 'a mansão existe (' + (M.casa && M.casa.nome) + ', porta em ' + Math.round(M.casa.x) + ',' + Math.round(M.casa.y) + ')');
place(M.portao.x, M.portao.y + 140); step(150);
ok(S.save.casas && S.save.casas[M.casa.id], 'a mansão já é do jogador');
ok(S.mansao && S.mansao.gate > 0.95 && vao() !== BUILD, 'o portão ABRE quando você chega perto (abertura ' + (S.mansao && S.mansao.gate.toFixed(2)) + ')');
const n0 = guardas().length;
ok(n0 >= 14, 'há ' + n0 + ' seguranças de terno (esperado >= 14)');
place(M.portao.x, M.portao.y + 900); step(240);
ok(S.mansao.gate <= 0.02 && vao() === BUILD, 'o portão FECHA quando você se afasta (o vão vira muro)');
place(M.x + M.w / 2, M.y + M.h / 2 + 5000); step(60); place(M.portao.x, M.portao.y + 400); step(60);
ok(guardas().length >= n0 - 1, 'os seguranças continuam lá depois de você ir longe e voltar (' + guardas().length + ')');
ok(S.cars.filter(c => c.owned && c.color === '#14141a').length >= 1, 'os carros da família estão estacionados na garagem');

// dentro dos muros: zona segura (polícia não entra, procurado cai)
place(M.mu(38), M.mv(30)); S.heat = 90; S.heatLevel = 4;
const cop = G.combat.makeCop(S, M.mu(40), M.mv(34), 2);
step(5);
ok(cop.dead || !S.peds.includes(cop), 'policial que entra nos muros é removido (zona segura)');
const t = rodaAte(() => S.heat <= 0, 900);
ok(t >= 0, 'o procurado cai a zero dentro dos muros (' + t + ' quadros)');

// polícia atrás de você: o portão fecha depois que você entra
place(M.portao.x, M.portao.y + 100); step(80);
place(M.portao.x, M.portao.y - 200); S.heat = 60; S.heatLevel = 3; step(150);
ok(S.mansao.gate <= 0.1, 'com a polícia atrás, o portão fecha depois que você passa (abertura ' + S.mansao.gate.toFixed(2) + ')');

// seguranças atiram em policiais (e só neles)
let tirosG = 0, tirosOutros = 0; const fb = G.combat.fireBullet;
G.combat.fireBullet = (SS, o) => { if (o.own === 'guarda') tirosG++; else tirosOutros++; return fb(SS, o); };
S.heat = 0; S.heatLevel = 0; place(M.mu(38), M.mv(40));
const cop2 = G.combat.makeCop(S, M.portao.x, M.portao.y + 170, 2); cop2.hp = 400; cop2.state = 'walk'; cop2.kind = 'cop';
const hp0 = S.player.hp, tt = rodaAte(() => tirosG > 0, 600);
ok(tt >= 0, 'seguranças atiram no policial perto do portão (tiros ' + tirosG + ')');
step(120); G.combat.fireBullet = fb;
ok(S.player.hp >= hp0 - 1, 'os tiros dos seguranças não acertam o jogador (vida ' + Math.round(S.player.hp) + ')');
cop2.dead = true;

// atacar um segurança: todos viram inimigos e o portão fecha para você
S.heat = 0; S.heatLevel = 0; place(M.portao.x, M.portao.y + 160); step(30);
const g = guardas()[0]; G.combat.hurtPed(S, g, 4, g.x, g.y, 40, 'player'); step(5);
ok(S.mansao.hostilT > 0 && guardas().length === 0 && S.peds.some(p => p.kind === 'thug'), 'atacar um segurança faz todos virarem inimigos');
try { step(400); ok(true, 'o jogo roda 400 quadros com os seguranças hostis sem erro'); } catch (e) { erros.push('hostis: ' + e.message); }
S.peds.forEach(p => { if (p.kind === 'thug') p.dead = true; }); S.mansao.hostilT = 0; S.mansao.postos = null;   // limpa

// ---------- parte 2: por dentro ----------
const prepara = () => { S.save.money = 5000; S.player.hp = 60; S.bebado = 0; };
function aperta(rot, R) {
  const fila = R.objs.filter(o => o.act && o.t !== 'porta' && o.t !== 'escada_grande').map(o => ({ o, nome: o.t })).concat(R.npcs.filter(n => n.act).map(n => ({ o: n, nome: 'npc ' + n.nome })));
  for (const { o, nome } of fila) {
    try {
      nAcoes++; prepara(); o.act(S, R, o);
      for (let i = 0; i < 90 && S.trans; i++) step(1);
      const m = R.menu;
      if (m) m.itens.forEach((it, i) => {
        if (S.inside !== R) return;
        try { nItens++; prepara(); R.menu = m; m.sel = i; if (it.fn) it.fn(S, R, it); if (m.atualiza) m.atualiza(m, S, R); }
        catch (e) { erros.push(rot + ' ' + nome + ' item "' + it.n + '": ' + e.message); }
      });
    } catch (e) { erros.push(rot + ' ' + nome + ': ' + e.message); }
    R.menu = null; R.mini = null; R.sentado = null;
    if (S.inside !== R) { erros.push(rot + ' ' + nome + ': mudou de sala sem querer'); break; }
  }
  try { step(3); } catch (e) { erros.push(rot + ' desenho: ' + e.message); }
}
const vaiPara = id => { L.irSala(S, id, null, null, null); for (let i = 0; i < 80 && (S.trans || S.inside.id !== id); i++) step(1); step(5); if (S.inside.id !== id) erros.push('não cheguei na sala ' + id + ' (' + S.inside.id + ')'); return S.inside; };
const pl = acha('mansao:'); S.save.casas = S.save.casas || {};
if (!entra(pl)) erros.push('não entrou na mansão');
else {
  ok(S.inside.nome.indexOf('VILLA BELLAROSA') === 0, 'entrou: ' + S.inside.nome);
  for (const sid of ['entrada', 'escritorio', 'salao', 'jogos', 'jantar', 'suite', 'adega']) {
    const R = sid === S.inside.id ? S.inside : vaiPara(sid);
    console.log('sala', sid, '|', R.nome, '| objs', R.objs.length, 'npcs', R.npcs.length);
    aperta(sid, R);
  }
  // funções do jogo: cofre guarda dinheiro, cama salva, arsenal repõe munição e dá colete
  const R = vaiPara('escritorio'); const cofre = R.objs.find(o => o.t === 'cofre');
  prepara(); S.save.money = 1000; S.save.mansao = null; cofre.act(S, R, cofre);
  const m = R.menu; const item = n => m.itens.find(i => i.n === n);
  item('Guardar tudo').fn(S, R); ok(S.save.money === 0 && S.save.mansao.cofre === 1000, 'o cofre guarda o dinheiro ($' + S.save.mansao.cofre + ')');
  item('Sacar $500').fn(S, R); ok(S.save.money === 500 && S.save.mansao.cofre === 500, 'o cofre devolve o dinheiro');
  R.menu = null;
  const RS = vaiPara('suite'), cama = RS.objs.find(o => o.t === 'cama2'); S.player.hp = 30; S.dayT = 0.3; S.heat = 50; cama.act(S, RS, cama); for (let i = 0; i < 120 && S.trans; i++) step(1);
  ok(S.player.hp === 100 && S.dayT > 1 && S.heat === 0, 'dormir na suíte: vida cheia, amanhece e salva (dia ' + S.dayT.toFixed(2) + ')');
  const RA = vaiPara('adega'), ars = RA.objs.find(o => o.t === 'arsenal'); G.combat.giveWeapon(S, 'pistol', 5, true); S.player.armor = 0; S.save.mansao.armaDia = -1; S.save.mansao.coleteDia = -1;
  ars.act(S, RA, ars); RA.menu.itens[0].fn(S, RA); RA.menu.itens[1].fn(S, RA);
  ok(G.combat.arms(S).ammo.pistol >= 45 && S.player.armor === 100, 'o arsenal repõe munição (' + G.combat.arms(S).ammo.pistol + ') e dá colete');
  RA.menu = null;
}
console.log('AÇÕES', nAcoes, 'ITENS DE MENU', nItens, 'ERROS', erros.length);
erros.forEach(e => console.log('  ERRO:', e));
process.exit(erros.length ? 1 : 0);
