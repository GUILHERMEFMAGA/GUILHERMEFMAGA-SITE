// =====================================================================
// ECONOMIA DINÂMICA — oferta, demanda, preços, inflação, juros, imóveis
// =====================================================================
import { clamp, faixa, chance } from '../util/nucleo.js';

export const SETORES = {
  alimento:   { nome: 'Alimentos',   base: 24,   elasticidade: 0.55 },
  combustivel:{ nome: 'Combustível', base: 6.4,  elasticidade: 0.85 },
  varejo:     { nome: 'Varejo',      base: 85,   elasticidade: 0.45 },
  servicos:   { nome: 'Serviços',    base: 120,  elasticidade: 0.35 },
  industria:  { nome: 'Indústria',   base: 420,  elasticidade: 0.6 },
  construcao: { nome: 'Construção',  base: 310,  elasticidade: 0.5 },
  tecnologia: { nome: 'Tecnologia',  base: 950,  elasticidade: 0.4 },
  logistica:  { nome: 'Logística',   base: 180,  elasticidade: 0.7 },
  hospedagem: { nome: 'Hospedagem',  base: 260,  elasticidade: 0.5 },
  saude:      { nome: 'Saúde',       base: 340,  elasticidade: 0.3 },
};

export class Economia {
  constructor(jogo) {
    this.jogo = jogo;
    this.setores = {};
    for (const k of Object.keys(SETORES)) {
      this.setores[k] = {
        chave: k, nome: SETORES[k].nome, preco: SETORES[k].base, base: SETORES[k].base,
        oferta: 1000, demanda: 1000, historico: [SETORES[k].base],
      };
    }
    this.inflacaoAnual = 0.052;
    this.taxaJuros = 0.0128;        // ao mês
    this.desemprego = 0.081;
    this.indiceImoveis = 1.0;
    this.confianca = 0.62;
    this.pibDia = 0;
    this.massaSalarial = 0;
    this.historicoIndices = [];
    this.choques = [];
  }

  preco(setor) { return this.setores[setor] ? this.setores[setor].preco : 50; }

  registrarDemanda(setor, qtd = 1) { if (this.setores[setor]) this.setores[setor].demanda += qtd; }
  registrarOferta(setor, qtd = 1) { if (this.setores[setor]) this.setores[setor].oferta += qtd; }
  registrarTransacao(valor) { this.pibDia += Math.abs(valor); }

  choque(setor, fator, duracaoDias, motivo) {
    this.choques.push({ setor, fator, dias: duracaoDias, motivo });
    this.jogo.barramento.emitir('economia-choque', { setor, fator, motivo });
  }

  passoDiario() {
    const rng = this.jogo.rng;
    let indicePrecos = 0, contagem = 0;
    for (const k of Object.keys(this.setores)) {
      const s = this.setores[k];
      const desequilibrio = (s.demanda - s.oferta) / Math.max(200, s.oferta);
      const el = SETORES[k].elasticidade;
      let variacao = clamp(desequilibrio * el * 0.25, -0.08, 0.1);
      variacao += this.inflacaoAnual / 365;
      variacao += faixa(rng, -0.006, 0.006);
      // choques ativos
      for (const c of this.choques) if (c.setor === k) variacao += (c.fator - 1) * 0.3;
      s.preco = clamp(s.preco * (1 + variacao), s.base * 0.35, s.base * 3.4);
      s.historico.push(s.preco);
      if (s.historico.length > 120) s.historico.shift();
      // relaxa fluxos para a média
      s.demanda = s.demanda * 0.35 + 1000 * 0.65;
      s.oferta = s.oferta * 0.35 + 1000 * 0.65;
      indicePrecos += s.preco / s.base; contagem++;
    }
    this.choques = this.choques.filter((c) => (--c.dias) > 0);

    const nivelPrecos = indicePrecos / contagem;
    // Política monetária simplificada
    const metaInflacao = 0.045;
    this.inflacaoAnual = clamp(this.inflacaoAnual + (nivelPrecos - 1) * 0.004 + faixa(rng, -0.002, 0.002), -0.01, 0.35);
    this.taxaJuros = clamp(0.004 + this.inflacaoAnual * 0.22 + (this.desemprego < 0.05 ? 0.002 : -0.001), 0.003, 0.055);

    // Emprego depende da saúde das empresas
    const emp = this.jogo.empresas;
    if (emp) {
      const vivas = emp.lista.filter((e) => e.status === 'ativa');
      const vagas = vivas.reduce((a, e) => a + Math.max(0, e.vagas), 0);
      const procurando = this.jogo.agentes ? this.jogo.agentes.desempregados.size : 0;
      const forca = Math.max(1, this.jogo.agentes ? this.jogo.agentes.lista.length * 0.62 : 1);
      this.desemprego = clamp(this.desemprego * 0.86 + (procurando / forca) * 0.14, 0.012, 0.42);
      this.confianca = clamp(0.5 + (0.1 - this.desemprego) * 2.2 - (this.inflacaoAnual - metaInflacao) * 2.0, 0.05, 0.98);
    }
    this.indiceImoveis = clamp(this.indiceImoveis * (1 + (this.confianca - 0.5) * 0.012 + this.inflacaoAnual / 365 - 0.0004), 0.4, 4);

    this.historicoIndices.push({
      dia: this.jogo.tempo.diaAbsoluto, precos: nivelPrecos, inflacao: this.inflacaoAnual,
      juros: this.taxaJuros, desemprego: this.desemprego, imoveis: this.indiceImoveis,
      pib: this.pibDia, confianca: this.confianca,
    });
    if (this.historicoIndices.length > 400) this.historicoIndices.shift();
    this.jogo.barramento.emitir('economia-dia', this.historicoIndices[this.historicoIndices.length - 1]);
    this.pibDia = 0;
  }
}
