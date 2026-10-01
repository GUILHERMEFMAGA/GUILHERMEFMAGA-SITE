// =====================================================================
// TRÂNSITO — veículos no grafo viário, semáforos, congestionamento,
// acidentes e veículos de emergência.
// =====================================================================
import { clamp, faixa, chance, escolher, inteiro, dist } from '../util/nucleo.js';
import { caminho } from '../mundo/gerador.js';

export const CLASSES_VEICULO = {
  carro:     { comp: 4.4, larg: 1.9, alt: 1.45, velMax: 1.0,  peso: 48 },
  suv:       { comp: 4.9, larg: 2.0, alt: 1.75, velMax: 0.95, peso: 14 },
  moto:      { comp: 2.1, larg: 0.8, alt: 1.25, velMax: 1.15, peso: 10 },
  van:       { comp: 5.6, larg: 2.1, alt: 2.3,  velMax: 0.85, peso: 9 },
  caminhao:  { comp: 9.5, larg: 2.5, alt: 3.3,  velMax: 0.7,  peso: 6 },
  onibus:    { comp: 12,  larg: 2.6, alt: 3.1,  velMax: 0.7,  peso: 4 },
  taxi:      { comp: 4.5, larg: 1.9, alt: 1.5,  velMax: 1.0,  peso: 6 },
  policia:   { comp: 4.8, larg: 2.0, alt: 1.6,  velMax: 1.25, peso: 0 },
  ambulancia:{ comp: 6.0, larg: 2.2, alt: 2.5,  velMax: 1.1,  peso: 0 },
  bombeiro:  { comp: 8.5, larg: 2.5, alt: 3.2,  velMax: 1.0,  peso: 0 },
  guincho:   { comp: 6.5, larg: 2.3, alt: 2.6,  velMax: 0.9,  peso: 0 },
};

const CORES = [0xd8d8d8, 0x202428, 0x8b1f1f, 0x1f3c8b, 0x2d6a3f, 0xb8860b, 0x6b6f76, 0xf0f0f0, 0x37474f, 0x7a4b8a];

let seq = 1;

export class Transito {
  constructor(jogo) {
    this.jogo = jogo;
    this.veiculos = [];
    this.emergencia = [];
    this.acidentes = [];
    this.atrasoMedio = 0;
    this.maxVeiculos = 520;
    this.fluxoRegistrado = 0;
  }

  iniciar() {
    const alvo = Math.round(this.maxVeiculos * 0.6);
    for (let i = 0; i < alvo; i++) this.criarVeiculo();
  }

  densidadeAlvo() {
    const t = this.jogo.tempo;
    const h = t.hora;
    let f = 0.25;
    if (h > 6.5 && h < 9.5) f = 1.0;
    else if (h >= 9.5 && h < 11.5) f = 0.65;
    else if (h >= 11.5 && h < 14) f = 0.8;
    else if (h >= 14 && h < 17) f = 0.7;
    else if (h >= 17 && h < 20) f = 1.0;
    else if (h >= 20 && h < 23) f = 0.5;
    if (t.fimDeSemana) f *= 0.72;
    const clima = t.infoInterp();
    f *= 1 - clima.chuva * 0.22;
    return Math.round(this.maxVeiculos * clamp(f, 0.12, 1));
  }

  criarVeiculo(tipoForcado, noInicial) {
    const jogo = this.jogo, rng = jogo.rng, mundo = jogo.mundo;
    const tipo = tipoForcado || this.sortearTipo();
    const no = noInicial !== undefined ? mundo.nos[noInicial] : escolher(rng, mundo.nos);
    if (!no || !no.viz.length) return null;
    const v = {
      id: seq++, tipo, cor: escolher(rng, CORES),
      no: no.id, proxNo: escolher(rng, no.viz).no, t: rng(),
      x: no.x, z: no.z, ang: 0, vel: 0,
      velDesejada: CLASSES_VEICULO[tipo].velMax * faixa(rng, 0.85, 1.1),
      lane: chance(rng, 0.5) ? 1 : -1,
      rota: null, rotaIdx: 0, destinoNo: null,
      emergencia: false, parado: 0, danificado: false, estacionado: false,
      ocupantes: inteiro(rng, 1, tipo === 'onibus' ? 24 : 4),
    };
    this.veiculos.push(v);
    return v;
  }

  sortearTipo() {
    const rng = this.jogo.rng;
    const t = this.jogo.tempo;
    const pares = Object.entries(CLASSES_VEICULO)
      .filter(([k, c]) => c.peso > 0)
      .map(([k, c]) => [k, k === 'caminhao' ? c.peso * (t.hora < 6 ? 3 : 1) : c.peso]);
    let total = 0; for (const p of pares) total += p[1];
    let r = rng() * total;
    for (const p of pares) { r -= p[1]; if (r <= 0) return p[0]; }
    return 'carro';
  }

  registrarViagem(ox, oz, dx, dz) { this.fluxoRegistrado++; }

  despacharEmergencia(tipo, origemNo, destino, aoChegar) {
    const mundo = this.jogo.mundo;
    const v = this.criarVeiculo(tipo, origemNo);
    if (!v) return null;
    v.emergencia = true; v.sirene = true;
    const noDest = mundo.noMaisProximo(destino.x, destino.z);
    v.rota = caminho(mundo, v.no, noDest ? noDest.id : v.no, 0.4) || [v.no];
    v.rotaIdx = 0; v.destinoNo = noDest ? noDest.id : v.no;
    v.aoChegar = aoChegar; v.destinoXZ = destino;
    this.emergencia.push(v);
    return v;
  }

  // ------------------------------------------------------------------
  atualizar(dt) {
    const jogo = this.jogo, mundo = jogo.mundo, rng = jogo.rng;
    const escala = jogo.tempo.escala;
    const clima = jogo.tempo.infoInterp();
    const fatorClima = 1 - clima.chuva * 0.25 - clima.neblina * 0.12;

    // População de veículos conforme horário
    const alvo = this.densidadeAlvo();
    if (this.veiculos.length < alvo) { for (let i = 0; i < 4 && this.veiculos.length < alvo; i++) this.criarVeiculo(); }
    else if (this.veiculos.length > alvo + 20) {
      for (let i = 0; i < 4; i++) {
        const idx = this.veiculos.findIndex((v) => !v.emergencia && dist(v.x, v.z, jogo.jogador.x, jogo.jogador.z) > 420);
        if (idx >= 0) this.veiculos.splice(idx, 1);
      }
    }

    // Semáforos
    const tj = jogo.tempo.diaAbsoluto * 86400 + jogo.tempo.hora * 3600;
    for (const s of mundo.semaforos) s.verde = ((tj / s.ciclo) % 2) < 1;

    // Zera carga por aresta (amostragem leve)
    for (const ar of mundo.arestas) ar.carga *= 0.9;

    let somaAtraso = 0, contados = 0;
    const px = jogo.jogador.x, pz = jogo.jogador.z;

    for (let i = this.veiculos.length - 1; i >= 0; i--) {
      const v = this.veiculos[i];
      if (v.danificado) { v.vel = 0; continue; }
      const noA = mundo.nos[v.no], noB = mundo.nos[v.proxNo];
      if (!noA || !noB) { v.no = escolher(rng, mundo.nos).id; v.proxNo = mundo.nos[v.no].viz[0]?.no ?? v.no; continue; }
      const dx = noB.x - noA.x, dz = noB.z - noA.z;
      const comp = Math.hypot(dx, dz) || 1;
      const arestaId = (noA.viz.find((n) => n.no === v.proxNo) || {}).aresta;
      const aresta = arestaId !== undefined ? mundo.arestas[arestaId] : null;
      if (aresta) aresta.carga = Math.min(16, aresta.carga + 0.06);

      // velocidade alvo
      const limite = (aresta ? aresta.limite : 12) * v.velDesejada;
      let alvoVel = limite * fatorClima;
      if (aresta) alvoVel *= clamp(1 - aresta.carga * 0.05 - aresta.bloqueio * 0.8, 0.12, 1);
      if (v.emergencia) alvoVel = limite * 1.25;

      // semáforo no nó de destino
      const semId = noB.semaforo;
      if (semId !== undefined && v.t > 0.82 && !v.emergencia) {
        const sem = mundo.semaforos[semId];
        const eixoHorizontal = Math.abs(dx) > Math.abs(dz);
        if (sem && (eixoHorizontal ? !sem.verde : sem.verde)) alvoVel = 0;
      }
      // veículo à frente (apenas perto do jogador, para custo baixo)
      if (Math.abs(v.x - px) < 220 && Math.abs(v.z - pz) < 220) {
        for (const o of this.veiculos) {
          if (o === v || o.no !== v.no || o.proxNo !== v.proxNo || o.lane !== v.lane) continue;
          const d = (o.t - v.t) * comp;
          if (d > 0 && d < 9) { alvoVel = Math.min(alvoVel, Math.max(0, (d - 5) * 1.6)); break; }
        }
      }
      // acidentes próximos reduzem velocidade
      for (const ac of this.acidentes) {
        if (Math.abs(ac.x - v.x) < 45 && Math.abs(ac.z - v.z) < 45) { alvoVel *= 0.25; break; }
      }

      v.vel += clamp(alvoVel - v.vel, -16 * dt * escala * 0.05, 7 * dt * escala * 0.05);
      v.vel = Math.max(0, v.vel);
      if (v.vel < 0.4) { v.parado += dt; somaAtraso += 1; } else v.parado = 0;
      contados++;

      v.t += (v.vel * dt * escala * 0.06) / comp;
      while (v.t >= 1) {
        v.t -= 1;
        v.no = v.proxNo;
        const no = mundo.nos[v.no];
        let proximo = null;
        if (v.rota && v.rotaIdx < v.rota.length - 1) {
          v.rotaIdx++;
          proximo = v.rota[v.rotaIdx + 1] !== undefined ? v.rota[v.rotaIdx + 1] : null;
          if (proximo === null && v.aoChegar) {
            v.aoChegar(v);
            v.aoChegar = null;
            v.rota = null;
          }
        }
        if (proximo === null) {
          const opcoes = no.viz.filter((n) => n.no !== (v.ultimoNo ?? -1));
          const esc = escolher(rng, opcoes.length ? opcoes : no.viz);
          proximo = esc ? esc.no : no.viz[0]?.no;
        }
        v.ultimoNo = v.no;
        v.proxNo = proximo ?? v.no;
      }
      const t = v.t;
      const offs = v.lane * (aresta ? aresta.largura * 0.24 : 3.4);
      v.x = noA.x + dx * t + (-dz / comp) * offs;
      v.z = noA.z + dz * t + (dx / comp) * offs;
      v.ang = Math.atan2(dx, dz);

      // Acidentes emergentes
      if (!v.emergencia && chance(rng, dt * (0.00012 + clima.chuva * 0.0008 + (v.vel > 14 ? 0.0003 : 0)))) {
        this.gerarAcidente(v);
      }
    }

    this.atrasoMedio = contados ? somaAtraso / contados : 0;

    // Limpa acidentes resolvidos
    for (let i = this.acidentes.length - 1; i >= 0; i--) {
      const ac = this.acidentes[i];
      ac.tempo -= dt * escala;
      if (ac.tempo <= 0) {
        if (ac.aresta) ac.aresta.bloqueio = 0;
        for (const v of ac.veiculos) { v.danificado = false; }
        this.acidentes.splice(i, 1);
        this.jogo.barramento.emitir('acidente-resolvido', ac);
      }
    }

    // Emergências que chegaram
    this.emergencia = this.emergencia.filter((v) => this.veiculos.includes(v));
  }

  gerarAcidente(v) {
    const jogo = this.jogo;
    const mundo = jogo.mundo;
    const noA = mundo.nos[v.no];
    const arestaId = (noA.viz.find((n) => n.no === v.proxNo) || {}).aresta;
    const aresta = arestaId !== undefined ? mundo.arestas[arestaId] : null;
    v.danificado = true;
    const envolvidos = [v];
    for (const o of this.veiculos) {
      if (o !== v && o.no === v.no && Math.abs(o.t - v.t) < 0.05) { o.danificado = true; envolvidos.push(o); break; }
    }
    const grave = envolvidos.length > 1 && chance(jogo.rng, 0.4);
    const ac = {
      id: `AC${Date.now() % 1e6}`, x: v.x, z: v.z, veiculos: envolvidos, aresta,
      tempo: grave ? 1400 : 700, grave, feridos: grave ? inteiro(jogo.rng, 1, 3) : 0,
    };
    if (aresta) aresta.bloqueio = grave ? 1 : 0.5;
    this.acidentes.push(ac);
    jogo.barramento.emitir('acidente', ac);
  }

  veiculosProximos(x, z, raio) {
    const out = [];
    for (const v of this.veiculos) {
      if (Math.abs(v.x - x) < raio && Math.abs(v.z - z) < raio) out.push(v);
    }
    return out;
  }
}
