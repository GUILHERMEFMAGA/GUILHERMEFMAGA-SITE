// fotos cruas (antes da paleta) de várias SALAS, para ajustar a paleta.   uso: node amostra_salas.js [grupo]
const { entra, acha, L, G, S, W, step } = require('./interior.js');
const fs = require('fs'); const D = (process.env.OUTDIR || __dirname + '/out/') + 'frames/'; fs.mkdirSync(D, { recursive: true });
G.paleta.cfg.guardar = true; G.paleta.cfgSala.guardar = true;
const lojas = [...new Set((W.lojas || []).map(l => l.loja))];
const grupos = {
  a: [['casa:0', ['entrada', 'quartos', 'banheiro']], ['casa:1', ['entrada', 'quartos']], ['casa:2', ['entrada', 'quartos', 'banheiro']], ['tipo:hospital', ['entrada', 'enfermaria', 'consultorio']], ['tipo:estadio', ['entrada', 'campo']]],
  b: [['hotel:0', ['lobby', 'restaurante', 'piscina', 'cozinha', 'corredor', 'q1']], ['id:farmacia', ['entrada']], ['id:barbearia', ['entrada']], ['id:shopping', ['entrada']], ['id:banco', ['entrada']], ['id:padaria', ['entrada']], ['id:pizzaria', ['entrada']], ['id:teatro', ['entrada']], ['tipo:delegacia', ['entrada', 'celas']], ['tipo:prefeitura', ['entrada']], ['academia', ['entrada']]],
  c: lojas.map(l => ['loja:' + l, ['entrada']]).concat([['tipo:mercado', ['entrada']]])
};
const lista = grupos[process.argv[2] || 'a'];
for (const [crit, salas] of lista) {
  let pl = acha(crit); if (!pl && crit === 'academia') pl = W.places.find(p => p.tipo === 'academia'); if (!pl) { console.log('nao achei', crit); continue; }
  try { if (!entra(pl)) { console.log('nao entrou', crit); continue; } } catch (e) { console.log('erro entra', crit, e.message); continue; }
  for (const sid of salas) {
    try {
      if (S.inside.id !== sid) { L.irSala(S, sid, null, null, null); for (let i = 0; i < 60 && (S.trans || S.inside.id !== sid); i++) step(1); }
      step(6); if (!G.paleta.guardado) { console.log('sem captura'); continue; }
      fs.writeFileSync(D + 'sala_' + crit.replace(/[^a-z0-9]/gi, '_') + '_' + sid + '.rgb', Buffer.from(G.paleta.guardado.buffer)); console.log('ok', crit, sid);
    } catch (e) { console.log('erro', crit, sid, e.message); }
  }
}
process.exit(0);
