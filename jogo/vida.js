/* =====================================================================
   VIDA.JS — as pessoas da cidade têm FAMÍLIA, NOME e ROTINA
     • cada casa tem uma família (pai, mãe, filhos, às vezes um avô ou avó)
     • a rotina muda com a HORA do jogo: dormir, café, trabalho, escola, TV...
     • aqui ficam as regras. Quem desenha as salas usa G.vida.
   Hora do jogo: 0 do "dia" = amanhecer (6h). Um dia dura uns 7 minutos.
   ===================================================================== */
(function (G) {
  'use strict';
  const SP = G.sprites;
  const NOMES_M = ['João', 'Pedro', 'Carlos', 'Marcos', 'Rafael', 'Lucas', 'Paulo', 'Bruno', 'André', 'Tiago', 'Gustavo', 'Fábio', 'Renato', 'Davi', 'Eduardo'];
  const NOMES_F = ['Maria', 'Ana', 'Juliana', 'Fernanda', 'Patrícia', 'Camila', 'Luciana', 'Sandra', 'Beatriz', 'Aline', 'Renata', 'Carla', 'Larissa', 'Marta', 'Vera'];
  const SOBRENOMES = ['Silva', 'Souza', 'Oliveira', 'Santos', 'Pereira', 'Lima', 'Costa', 'Ribeiro', 'Almeida', 'Carvalho', 'Rocha', 'Barbosa', 'Gomes', 'Martins', 'Araújo'];
  const mulberry = G.world.mulberry32;
  const pick = (r, a) => a[Math.floor(r() * a.length)];

  // ---------- gera a família de uma casa (sempre a mesma para a mesma casa) ----------
  function gerarFamilia(casa) {
    const r = mulberry(casa.seed * 7 + 3), sob = pick(r, SOBRENOMES), m = [];
    const look = (fem, o) => Object.assign(SP.randomLook(), { fem, dress: fem && r() < 0.4, acc: 'none' }, o || {});
    const adulto = (fem, papel, extra) => ({ papel, fem, nome: pick(r, fem ? NOMES_F : NOMES_M) + ' ' + sob, p: look(fem, extra), dinheiro: Math.round((30 + r() * 150) / 5) * 5 });
    const tipo = r();
    if (tipo < 0.12) { m.push(adulto(r() < 0.5, 'sozinho')); m[0].trab = r() < 0.7; }
    else {
      m.push(adulto(false, 'pai')); m[0].trab = true;
      m.push(adulto(true, r() < 0.5 ? 'mae' : 'mae_trab')); m[1].trab = m[1].papel === 'mae_trab';
      const filhos = r() < 0.7 ? 1 + Math.floor(r() * 2) : 0;
      for (let i = 0; i < filhos; i++) {
        const fem = r() < 0.5, idade = 4 + Math.floor(r() * 13), esc = idade < 9 ? 0.72 : idade < 13 ? 0.82 : 0.93;
        m.push({ papel: 'filho', fem, idade, nome: pick(r, fem ? NOMES_F : NOMES_M) + ' ' + sob, crianca: idade < 13, p: look(fem, { esc, acc: 'none', hairStyle: fem ? 'rabo' : 'curto', sleeve: 'curta' }), dinheiro: Math.round(r() * 8) });
      }
      if (r() < 0.25) { const fem = r() < 0.5; m.push({ papel: 'idoso', fem, nome: (fem ? 'Vó ' : 'Vô ') + pick(r, fem ? NOMES_F : NOMES_M), p: look(fem, { hair: '#d8d8d8', hairStyle: fem ? 'coque' : 'careca', esc: 0.96, dress: fem }), dinheiro: Math.round(r() * 60) }); }
    }
    m.forEach((x, i) => { x.i = i; x.loc = null; x.n = null; });
    return { sob, membros: m };
  }

  // ---------- rotina: o que cada um está fazendo a esta hora ----------
  // devolve 'dorme' | 'cozinha' | 'tv' | 'casa' | 'brinca' | 'fora' | 'banho'
  function atividade(m, h) {
    const entre = (a, b) => a <= b ? (h >= a && h < b) : (h >= a || h < b);
    switch (m.papel) {
      case 'pai': case 'sozinho':
        if (!m.trab) return entre(23, 8) ? 'dorme' : entre(8, 9) ? 'cozinha' : entre(9, 12) ? 'casa' : entre(12, 13.5) ? 'cozinha' : entre(13.5, 23) ? 'tv' : 'casa';
        if (entre(22, 6)) return 'dorme'; if (entre(6, 7.2)) return 'cozinha'; if (entre(7.2, 18)) return 'fora'; if (entre(18, 19.5)) return 'casa'; if (entre(19.5, 22)) return 'tv'; return 'casa';
      case 'mae': // dona de casa
        if (entre(22.5, 5.5)) return 'dorme'; if (entre(5.5, 8)) return 'cozinha'; if (entre(8, 11)) return 'casa'; if (entre(11, 13)) return 'cozinha'; if (entre(13, 17)) return 'tv'; if (entre(17, 19.5)) return 'cozinha'; return 'tv';
      case 'mae_trab':
        if (entre(22, 6)) return 'dorme'; if (entre(6, 7.5)) return 'cozinha'; if (entre(7.5, 17.5)) return 'fora'; if (entre(17.5, 19.5)) return 'cozinha'; return 'tv';
      case 'filho':
        if (entre(21, 6.5)) return 'dorme'; if (entre(6.5, 7.2)) return 'cozinha'; if (m.idade > 6 && entre(7.2, 12.5)) return 'fora'; if (entre(12.5, 13.3)) return 'cozinha'; if (entre(13.3, 19)) return 'brinca'; return 'tv';
      case 'idoso':
        if (entre(21, 5.5)) return 'dorme'; if (entre(5.5, 7)) return 'cozinha'; if (entre(7, 12)) return 'casa'; if (entre(12, 13)) return 'cozinha'; if (entre(13, 15)) return 'tv'; return entre(15, 21) ? 'tv' : 'casa';
    }
    return 'casa';
  }
  const TXT_ATIV = { dorme: 'dormindo', cozinha: 'na cozinha', tv: 'vendo TV', casa: 'em casa', brinca: 'brincando', fora: 'fora de casa' };

  // frases de rotina para quem está na rua (conforme a hora)
  function fraseRua(h) {
    const e = (a, b) => h >= a && h < b;
    if (e(5, 8)) return ['Tô indo trabalhar, o ônibus não pode passar!', 'Preciso de um café antes de tudo.', 'Levando as crianças pra escola.', 'Acordei cedo para correr um pouco.'];
    if (e(8, 11.5)) return ['Fui ao mercado comprar pão.', 'Hoje é dia de fazer compras.', 'Estou indo ao banco.', 'Dia cheio de coisas pra resolver.'];
    if (e(11.5, 14)) return ['Hora do almoço! Vou comer no restaurante do hotel.', 'Estou com fome. Vou a uma padaria.', 'Meu intervalo é curto, tenho que correr.'];
    if (e(14, 18)) return ['Saí do trabalho mais cedo hoje.', 'Estou voltando da academia.', 'Tarde boa para passear no parque.', 'Vou buscar meu filho na escola.'];
    if (e(18, 22)) return ['Estou indo pra casa, o dia foi longo.', 'Hoje é noite de pizza!', 'Vou tomar uma cerveja no Pinguim.', 'Jantar em família hoje.'];
    return ['Que horas são? Já é tarde...', 'Essas ruas à noite me dão medo.', 'Estou voltando da balada.', 'Insônia, só consigo andar pela cidade.'];
  }

  G.vida = { gerarFamilia, atividade, TXT_ATIV, fraseRua, NOMES_M, NOMES_F, SOBRENOMES };
})(window.G = window.G || {});
