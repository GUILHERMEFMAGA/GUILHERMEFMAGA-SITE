// =====================================================================
// TEMPO: ciclo de 24h, calendário e CLIMA dinâmico
// =====================================================================
import { clamp, chance, faixa, escolher, pesoEscolher } from '../util/nucleo.js';

export const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const CLIMAS = {
  sol:        { nome: 'Ensolarado',  nuvem: 0.05, chuva: 0,    neblina: 0.0,  vento: 0.2 },
  nublado:    { nome: 'Nublado',     nuvem: 0.7,  chuva: 0,    neblina: 0.1,  vento: 0.4 },
  chuva:      { nome: 'Chuva',       nuvem: 0.9,  chuva: 0.6,  neblina: 0.25, vento: 0.5 },
  tempestade: { nome: 'Tempestade',  nuvem: 1.0,  chuva: 1.0,  neblina: 0.3,  vento: 0.95 },
  neblina:    { nome: 'Neblina',     nuvem: 0.5,  chuva: 0,    neblina: 0.9,  vento: 0.1 },
  vento:      { nome: 'Ventania',    nuvem: 0.4,  chuva: 0.05, neblina: 0.0,  vento: 1.0 },
};

const TRANSICOES = {
  sol:        [['sol', 50], ['nublado', 30], ['vento', 10], ['neblina', 6], ['chuva', 4]],
  nublado:    [['nublado', 35], ['sol', 25], ['chuva', 28], ['neblina', 7], ['vento', 5]],
  chuva:      [['chuva', 38], ['nublado', 34], ['tempestade', 14], ['neblina', 8], ['sol', 6]],
  tempestade: [['tempestade', 22], ['chuva', 48], ['nublado', 26], ['vento', 4]],
  neblina:    [['neblina', 30], ['nublado', 35], ['sol', 25], ['chuva', 10]],
  vento:      [['vento', 28], ['sol', 30], ['nublado', 30], ['tempestade', 12]],
};

export class Tempo {
  constructor(jogo, { hora = 7.2, dia = 1, mes = 3, ano = 2031, escala = 60 } = {}) {
    this.jogo = jogo;
    this.hora = hora;            // 0..24
    this.dia = dia;              // dia do mês
    this.diaSemana = 1;
    this.diaAbsoluto = 0;
    this.mes = mes; this.ano = ano;
    this.escala = escala;        // segundos de jogo por segundo real
    this.clima = 'sol';
    this.climaAlvo = 'sol';
    this.transicao = 1;          // 0..1
    this.molhado = 0;            // acúmulo de água no chão
    this.proximaMudanca = 2.5;   // horas
    this.estacao = 'outono';
  }

  get minutos() { return Math.floor((this.hora % 1) * 60); }
  get rotulo() {
    const h = Math.floor(this.hora).toString().padStart(2, '0');
    return `${h}:${this.minutos.toString().padStart(2, '0')}`;
  }
  get data() { return `${DIAS[this.diaSemana]}, ${this.dia} de ${MESES[this.mes]} de ${this.ano}`; }
  get periodo() {
    if (this.hora < 5) return 'madrugada';
    if (this.hora < 12) return 'manha';
    if (this.hora < 18) return 'tarde';
    if (this.hora < 22) return 'noite';
    return 'madrugada';
  }
  get fimDeSemana() { return this.diaSemana === 0 || this.diaSemana === 6; }
  // 0 = meia-noite, 1 = meio-dia
  get luzSolar() {
    const ang = (this.hora / 24) * Math.PI * 2 - Math.PI / 2;
    return clamp(Math.sin(ang - Math.PI / 2) * -1, -1, 1);
  }
  get ehNoite() { return this.hora < 6.2 || this.hora > 18.6; }

  info() { return CLIMAS[this.clima]; }
  infoInterp() {
    const a = CLIMAS[this.clima], b = CLIMAS[this.climaAlvo], t = this.transicao;
    return {
      nome: t > 0.5 ? b.nome : a.nome,
      nuvem: a.nuvem + (b.nuvem - a.nuvem) * t,
      chuva: a.chuva + (b.chuva - a.chuva) * t,
      neblina: a.neblina + (b.neblina - a.neblina) * t,
      vento: a.vento + (b.vento - a.vento) * t,
    };
  }

  avancar(dtReal) {
    const dtJogo = dtReal * this.escala;      // segundos de jogo
    const horasAntes = this.hora;
    this.hora += dtJogo / 3600;
    while (this.hora >= 24) {
      this.hora -= 24; this.dia++; this.diaAbsoluto++;
      this.diaSemana = (this.diaSemana + 1) % 7;
      if (this.dia > 30) { this.dia = 1; this.mes = (this.mes + 1) % 12; if (this.mes === 0) this.ano++; }
      this.jogo.barramento.emitir('novo-dia', { dia: this.diaAbsoluto });
    }
    if (Math.floor(horasAntes) !== Math.floor(this.hora)) {
      this.jogo.barramento.emitir('nova-hora', { hora: Math.floor(this.hora) });
    }

    // --- clima -------------------------------------------------------
    if (this.transicao < 1) this.transicao = clamp(this.transicao + dtJogo / 900, 0, 1);
    else {
      this.proximaMudanca -= dtJogo / 3600;
      if (this.proximaMudanca <= 0) {
        this.clima = this.climaAlvo;
        this.climaAlvo = pesoEscolher(this.jogo.rng, TRANSICOES[this.clima]);
        this.transicao = 0;
        this.proximaMudanca = faixa(this.jogo.rng, 1.5, 6);
        if (this.climaAlvo !== this.clima) {
          this.jogo.barramento.emitir('clima-mudou', { de: this.clima, para: this.climaAlvo });
        }
      }
    }
    const info = this.infoInterp();
    this.molhado = clamp(this.molhado + (info.chuva > 0.1 ? dtJogo / 1800 : -dtJogo / 5400), 0, 1);
  }
}
