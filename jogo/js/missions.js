'use strict';
/* ============================================================
   missions.js — campanhas por orelhão: entrega, táxi, corrida,
   fuga e roubo sob encomenda. Seta amarela aponta o destino.
   ============================================================ */
const RANKS = ['Motorista Novato', 'Aprendiz de Rua', 'Piloto de Bairro', 'Entregador Confiável', 'Taxista da Praça',
  'Ás do Volante', 'Contrabandista Leve', 'Fugitivo Famoso', 'Lenda do Trânsito', 'Rei da Cidade'];

const ZC = n => { const z = WORLD.zones.find(z => z.name === n); return { x: (z.x0 + z.x1) / 2, y: (z.y0 + z.y1) / 2 }; };
const PARK = { x: 26 * T, y: 21 * T }, PLAZA = { x: 38 * T, y: 26 * T }, MARGEM = { x: 32 * T, y: 60 * T };

const MISSIONS = [
  { type: 'entrega', a: 'POSTO', b: 'LOTE', time: 70, pay: 200, txt: 'Pegue o pacote no POSTO e leve ao AUTO LOTE!' },
  { type: 'taxi', a: PLAZA, b: PARK, time: 80, pay: 250, txt: 'Passageiro na PRAÇA quer ir ao PARQUE. Sem amassar o carro!' },
  { type: 'corrida', cps: ['GARAGEM', 'PLAZA', 'PARK', 'LOTE', 'POSTO'], time: 90, pay: 300, txt: 'Corrida ilegal! Passe nos checkpoints na ordem.' },
  { type: 'entrega', a: 'POSTO', b: 'ESCONDERIJO', time: 90, pay: 350, txt: 'Entrega "discreta" no ESCONDERIJO. Corre!' },
  { type: 'roubo', kind: 'taxi', b: 'OFICINA', time: 150, pay: 400, txt: 'Cliente quer um TÁXI. Roubem um e traga inteiro à OFICINA.' },
  { type: 'taxi', a: PLAZA, b: MARGEM, time: 150, pay: 450, txt: 'Corrida longa: da PRAÇA até a MARGEM do rio, ao sul.' },
  { type: 'corrida', cps: ['LOTE', 'PARK', 'ESCONDERIJO', 'PLAZA', 'GARAGEM'], time: 100, pay: 500, txt: 'Corrida de volta! Checkpoints pela cidade toda.' },
  { type: 'fuga', b: 'ESCONDERIJO', time: 60, pay: 600, txt: 'A polícia está atrás de você! Chegue ao ESCONDERIJO.' },
  { type: 'entrega', a: 'LOJA', b: 'MARGEM', time: 90, pay: 700, txt: 'Leve a encomenda da LOJA à MARGEM, cruzando a ponte!' },
  { type: 'corrida', cps: ['GARAGEM', 'MARGEM', 'ESCONDERIJO', 'PARK', 'PLAZA', 'LOTE'], time: 120, pay: 1000, txt: 'GRANDE FINAL: volta completa na cidade. Vire o REI DA CIDADE!' },
];
const PT = n => n === 'PARK' ? PARK : n === 'PLAZA' ? PLAZA : n === 'MARGEM' ? MARGEM : ZC(n);

const M = {
  active: null, done: 0,

  start(idx) {
    const d = MISSIONS[idx];
    this.active = { idx, d, t: d.time, stage: 0, cp: 0, hp0: null };
    if (d.type === 'entrega') { this.active.target = PT(d.a); }
    if (d.type === 'taxi') { this.active.target = d.a; HUD.msg('Vá buscar o passageiro na PRAÇA.', 4); }
    if (d.type === 'corrida') { this.active.target = PT(d.cps[0]); }
    if (d.type === 'roubo') { this.active.target = null; }
    if (d.type === 'fuga') { this.active.target = PT(d.b); GAME.setWanted(Math.max(GAME.wanted, 2)); }
    HUD.msg(d.txt, 6); AUDIO.pickup();
  },
  target() { return this.active ? this.active.target : null; },

  onEnterCar(car) {
    const a = this.active; if (!a) return;
    if (a.d.type === 'roubo' && a.stage === 0 && car.kind === a.d.kind) {
      a.stage = 1; a.target = PT(a.d.b); a.hp0 = car.hp;
      HUD.msg('Boa! Agora leve o táxi INTEIRO à OFICINA.', 5);
    }
    if (a.d.type === 'taxi' && a.stage === 1) a.hp0 = a.hp0 ?? car.hp;
  },
  onFootDamage(car, dmg) {
    const a = this.active;
    if (a && a.d.type === 'taxi' && a.stage === 1 && a.hp0 != null && car.hp < a.hp0 - 30) this.fail('O passageiro desceu xingando!');
  },

  update(dt, S) {
    const a = this.active; if (!a) return;
    a.t -= dt;
    if (a.t <= 0) return this.fail('Tempo esgotado!');
    const d = a.d, tgt = a.target;
    const near = tgt && Math.hypot(S.px - tgt.x, S.py - tgt.y) < 42;
    if (d.type === 'entrega') {
      if (a.stage === 0 && near) { a.stage = 1; a.target = PT(d.b); HUD.msg('Pacote a bordo! Agora entregue no destino.', 4); AUDIO.pickup(); }
      else if (a.stage === 1 && near) return this.win();
    } else if (d.type === 'taxi') {
      if (a.stage === 0 && near && S.inCar) { a.stage = 1; a.target = d.b; HUD.msg('Passageiro a bordo: "Pisa fundo, chefia!"', 4); AUDIO.pickup(); }
      else if (a.stage === 1 && near) return this.win();
    } else if (d.type === 'corrida') {
      if (near && S.inCar) {
        a.cp++;
        if (a.cp >= d.cps.length) return this.win();
        a.target = PT(d.cps[a.cp]); AUDIO.pickup();
        HUD.msg(`Checkpoint ${a.cp}/${d.cps.length}!`, 2.5);
      }
    } else if (d.type === 'fuga') {
      if (near) return this.win();
    } else if (d.type === 'roubo') {
      if (a.stage === 1 && near && S.inCar && S.car.kind === d.kind) {
        if (S.car.hp > 30) return this.win();
        return this.fail('Esse táxi está muito amassado!');
      }
    }
  },
  win() {
    const a = this.active;
    GAME.money += a.d.pay;
    this.done++;
    HUD.msg(`MISSÃO CUMPRIDA! +$${a.d.pay}  •  Rank: ${RANKS[Math.min(this.done, RANKS.length - 1)]}`, 6);
    HUD.big('MISSÃO CUMPRIDA!', 2.5);
    if (a.d.type === 'fuga') GAME.setWanted(0);
    this.active = null; AUDIO.cash(); GAME.save();
    if (this.done >= MISSIONS.length) { HUD.big('REI DA CIDADE! Modo livre liberado.', 5); GAME.free = true; GAME.save(); }
  },
  fail(msg) {
    HUD.msg('MISSÃO FRACASSADA: ' + msg + ' Tente de novo num orelhão.', 6);
    HUD.big('MISSÃO FRACASSADA', 2.5);
    if (this.active && this.active.d.type === 'fuga') GAME.setWanted(0);
    this.active = null;
  }
};
