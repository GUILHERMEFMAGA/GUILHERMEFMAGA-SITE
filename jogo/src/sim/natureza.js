// =====================================================================
// NATUREZA — ecossistemas, fauna selvagem e animais domésticos urbanos
// =====================================================================
import { clamp, faixa, chance, escolher, inteiro, dist } from '../util/nucleo.js';

export const ESPECIES = {
  cervo:    { nome: 'Cervo', vel: 3.2, grupo: [2, 6], presa: true, habitat: 'floresta', cor: 0x8a6239, tam: 1.3 },
  lobo:     { nome: 'Lobo', vel: 4.1, grupo: [2, 5], presa: false, habitat: 'floresta', cor: 0x6b6b6b, tam: 1.0 },
  javali:   { nome: 'Javali', vel: 3.0, grupo: [1, 4], presa: true, habitat: 'floresta', cor: 0x4a3b30, tam: 1.0 },
  raposa:   { nome: 'Raposa', vel: 3.6, grupo: [1, 2], presa: false, habitat: 'floresta', cor: 0xb5651d, tam: 0.7 },
  coelho:   { nome: 'Coelho', vel: 3.4, grupo: [2, 7], presa: true, habitat: 'campo', cor: 0xb9ad9a, tam: 0.4 },
  ave:      { nome: 'Ave', vel: 6.0, grupo: [4, 14], presa: true, habitat: 'ceu', cor: 0x3c3c48, tam: 0.3 },
  vaca:     { nome: 'Vaca', vel: 1.4, grupo: [3, 10], presa: true, habitat: 'fazenda', cor: 0xe8e2d8, tam: 1.5 },
  cavalo:   { nome: 'Cavalo', vel: 4.8, grupo: [2, 5], presa: true, habitat: 'fazenda', cor: 0x6b4a2f, tam: 1.6 },
  ovelha:   { nome: 'Ovelha', vel: 1.7, grupo: [4, 12], presa: true, habitat: 'fazenda', cor: 0xdedbd2, tam: 0.9 },
  peixe:    { nome: 'Cardume', vel: 2.0, grupo: [6, 18], presa: true, habitat: 'agua', cor: 0x4f8ba8, tam: 0.3 },
  cachorro: { nome: 'Cachorro', vel: 3.0, grupo: [1, 1], presa: false, habitat: 'cidade', cor: 0x9c7a52, tam: 0.6 },
  gato:     { nome: 'Gato', vel: 3.2, grupo: [1, 1], presa: false, habitat: 'cidade', cor: 0x55504b, tam: 0.4 },
};

let seq = 1;

export class Natureza {
  constructor(jogo) {
    this.jogo = jogo;
    this.animais = [];
    this.fatia = 0;
    this.fatias = 4;
  }

  popular() {
    const jogo = this.jogo, rng = jogo.rng, mundo = jogo.mundo;
    // Fauna de floresta
    for (const f of mundo.florestas) {
      const n = Math.round(f.r / 60);
      for (let i = 0; i < n; i++) {
        const esp = escolher(rng, ['cervo', 'javali', 'raposa', 'lobo', 'coelho', 'ave']);
        this.criarGrupo(esp, f.x + faixa(rng, -f.r, f.r), f.z + faixa(rng, -f.r, f.r));
      }
    }
    // Fazendas
    for (const id of mundo.indicePorTipo.get('fazenda') || []) {
      const l = mundo.lotes[id];
      for (const esp of ['vaca', 'ovelha', 'cavalo']) {
        if (chance(rng, 0.6)) this.criarGrupo(esp, l.x + faixa(rng, -40, 40), l.z + faixa(rng, -40, 40), l.id);
      }
    }
    // Peixes nos lagos e no rio
    for (const lago of mundo.agua) this.criarGrupo('peixe', lago.x, lago.z);
    // Animais domésticos: cada casa pode ter um pet com dono
    const casas = mundo.lotes.filter((l) => l.tipo === 'casa' || l.tipo === 'mansao');
    for (const c of casas) {
      if (!chance(rng, 0.3)) continue;
      const esp = chance(rng, 0.6) ? 'cachorro' : 'gato';
      const dono = c.residentes.length ? escolher(rng, c.residentes) : null;
      const a = this.criarAnimal(esp, c.x + faixa(rng, -6, 6), c.z + faixa(rng, -6, 6));
      a.dono = dono; a.casaLote = c.id; a.domestico = true;
      a.nome = escolher(rng, ['Pipoca', 'Nuvem', 'Thor', 'Mel', 'Bolinha', 'Fumaça', 'Lua', 'Pretinho', 'Zeus', 'Amora']);
    }
  }

  criarGrupo(esp, x, z, loteId) {
    const def = ESPECIES[esp];
    const n = inteiro(this.jogo.rng, def.grupo[0], def.grupo[1]);
    const grupo = seq++;
    for (let i = 0; i < n; i++) {
      const a = this.criarAnimal(esp, x + faixa(this.jogo.rng, -25, 25), z + faixa(this.jogo.rng, -25, 25));
      a.grupo = grupo; a.loteId = loteId ?? null;
    }
  }

  criarAnimal(esp, x, z) {
    const def = ESPECIES[esp];
    const rng = this.jogo.rng;
    const a = {
      id: seq++, especie: esp, def, x, z, ox: x, oz: z,
      alvoX: x, alvoZ: z, estado: 'pastando', energia: faixa(rng, 0.4, 1),
      fome: faixa(rng, 0, 0.6), medo: 0, vel: def.vel * faixa(rng, 0.85, 1.2),
      ang: rng() * Math.PI * 2, domestico: false, dono: null, territorio: { x, z, r: faixa(rng, 60, 260) },
    };
    this.animais.push(a);
    return a;
  }

  atualizar(dt) {
    const jogo = this.jogo;
    const esc = jogo.tempo.escala;
    const clima = jogo.tempo.infoInterp();
    const noite = jogo.tempo.ehNoite;
    const px = jogo.jogador.x, pz = jogo.jogador.z;
    const n = this.animais.length;
    if (!n) return;
    const porFatia = Math.ceil(n / this.fatias);
    const ini = this.fatia * porFatia, fim = Math.min(n, ini + porFatia);
    this.fatia = (this.fatia + 1) % this.fatias;
    const dtf = dt * this.fatias;

    for (let i = ini; i < fim; i++) {
      const a = this.animais[i];
      const perto = Math.abs(a.x - px) < 260 && Math.abs(a.z - pz) < 260;
      a.fome = clamp(a.fome + dtf * 0.004 * esc / 60, 0, 1);
      a.medo = clamp(a.medo - dtf * 0.2, 0, 1);

      // Reage ao jogador, à chuva e à noite
      const dJog = dist(a.x, a.z, px, pz);
      if (dJog < 30 && a.def.presa) { a.medo = 1; a.estado = 'fugindo'; }
      if (clima.chuva > 0.5 && chance(jogo.rng, dtf * 0.1)) a.estado = 'abrigado';
      if (noite && a.def.habitat === 'floresta' && a.def.presa && chance(jogo.rng, dtf * 0.02)) a.estado = 'descansando';

      switch (a.estado) {
        case 'fugindo': {
          const dx = a.x - px, dz = a.z - pz;
          const l = Math.hypot(dx, dz) || 1;
          a.alvoX = a.x + (dx / l) * 60; a.alvoZ = a.z + (dz / l) * 60;
          if (a.medo <= 0.05) a.estado = 'pastando';
          break;
        }
        case 'cacando': {
          const presa = this.presaProxima(a);
          if (presa) { a.alvoX = presa.x; a.alvoZ = presa.z; if (dist(a.x, a.z, presa.x, presa.z) < 4) { presa.medo = 1; a.fome = 0; a.estado = 'descansando'; } }
          else a.estado = 'pastando';
          break;
        }
        case 'descansando':
          if (chance(jogo.rng, dtf * 0.03)) a.estado = 'pastando';
          break;
        case 'abrigado':
          if (clima.chuva < 0.3 && chance(jogo.rng, dtf * 0.05)) a.estado = 'pastando';
          break;
        default: {
          if (!a.def.presa && a.fome > 0.6 && chance(jogo.rng, dtf * 0.05)) { a.estado = 'cacando'; break; }
          if (a.domestico) {
            // Pets acompanham a rotina do dono
            const dono = a.dono ? jogo.agentes.porId(a.dono) : null;
            if (dono && dist(a.x, a.z, dono.x, dono.z) < 220 && chance(jogo.rng, dtf * 0.4)) {
              a.alvoX = dono.x + faixa(jogo.rng, -5, 5); a.alvoZ = dono.z + faixa(jogo.rng, -5, 5);
            } else if (chance(jogo.rng, dtf * 0.1)) {
              const casa = jogo.mundo.lotes[a.casaLote];
              a.alvoX = casa.x + faixa(jogo.rng, -16, 16); a.alvoZ = casa.z + faixa(jogo.rng, -16, 16);
            }
          } else if (chance(jogo.rng, dtf * 0.15)) {
            const t = a.territorio;
            a.alvoX = t.x + faixa(jogo.rng, -t.r, t.r);
            a.alvoZ = t.z + faixa(jogo.rng, -t.r, t.r);
            if (a.fome > 0.5) a.fome = clamp(a.fome - 0.3, 0, 1);
          }
        }
      }

      const d = dist(a.x, a.z, a.alvoX, a.alvoZ);
      if (d > 0.6) {
        const v = a.vel * (a.estado === 'fugindo' ? 2.1 : a.estado === 'cacando' ? 1.7 : 0.45) * dtf * esc * 0.05;
        const passo = Math.min(d, v);
        a.x += ((a.alvoX - a.x) / d) * passo;
        a.z += ((a.alvoZ - a.z) / d) * passo;
        a.ang = Math.atan2(a.alvoX - a.x, a.alvoZ - a.z);
      }
    }
  }

  presaProxima(pred) {
    let melhor = null, md = 120 * 120;
    for (const o of this.animais) {
      if (!o.def.presa) continue;
      const d = (o.x - pred.x) ** 2 + (o.z - pred.z) ** 2;
      if (d < md) { md = d; melhor = o; }
    }
    return melhor;
  }

  proximos(x, z, raio) {
    const out = [];
    for (const a of this.animais) if (Math.abs(a.x - x) < raio && Math.abs(a.z - z) < raio) out.push(a);
    return out;
  }
}
