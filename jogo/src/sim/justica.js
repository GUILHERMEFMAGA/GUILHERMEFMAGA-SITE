// =====================================================================
// SISTEMA JUDICIAL — abordagem → detenção → transporte → registro →
// investigação → processo → audiência → julgamento → sentença
// =====================================================================
import { clamp, faixa, chance, escolher, inteiro, dinheiro } from '../util/nucleo.js';

const ETAPAS = [
  { chave: 'abordagem', nome: 'Abordagem', horas: 0.2, texto: 'Você foi abordado e identificado pelos agentes.' },
  { chave: 'detencao', nome: 'Detenção', horas: 0.3, texto: 'Detido e conduzido à viatura.' },
  { chave: 'transporte', nome: 'Transporte', horas: 0.6, texto: 'Transportado até a delegacia mais próxima.' },
  { chave: 'registro', nome: 'Registro', horas: 1.5, texto: 'Boletim registrado, pertences inventariados.' },
  { chave: 'investigacao', nome: 'Investigação', horas: 20, texto: 'Provas, câmeras e testemunhos são reunidos.' },
  { chave: 'processo', nome: 'Processo', horas: 40, texto: 'O caso foi distribuído para uma vara criminal.' },
  { chave: 'audiencia', nome: 'Audiência', horas: 10, texto: 'Audiência de instrução: defesa e acusação se manifestam.' },
  { chave: 'julgamento', nome: 'Julgamento', horas: 8, texto: 'O juiz analisa o conjunto probatório.' },
  { chave: 'sentenca', nome: 'Sentença', horas: 0.5, texto: 'A decisão é proferida.' },
];

export class Justica {
  constructor(jogo) {
    this.jogo = jogo;
    this.processos = [];
    this.presos = [];
    this.estatisticas = { condenacoes: 0, absolvicoes: 0, multas: 0 };
  }

  prender(jogador, crime, opts = {}) {
    if (jogador.estado === 'detido' || jogador.estado === 'preso') return;
    jogador.estado = 'detido';
    const forca = crime ? clamp(crime.provas.reduce((a, p) => a + p.forca, 0), 0, 3) : 0.5;
    const p = {
      id: `PRC${Math.floor(Math.random() * 1e5)}`,
      reu: 'jogador', nome: jogador.nome, crime,
      acusacao: crime ? crime.def.nome : 'Conduta sob apuração',
      gravidade: crime ? crime.def.gravidade : 1,
      provas: forca, atenuante: !!opts.atenuante, porMandado: !!opts.porMandado,
      advogado: jogador.advogado || null,
      etapa: 0, tempoEtapa: 0, aberto: true, linha: [],
      antecedentes: jogador.fichaCriminal.length,
    };
    this.processos.push(p);
    this.jogo.ui?.abrirProcesso(p);
    this.jogo.ui?.feed('🚔 Você foi detido. O processo judicial começou.');
    this.jogo.barramento.emitir('processo-aberto', p);
    return p;
  }

  prenderNPC(agente, crime) {
    if (!agente || agente.estado === 'preso') return;
    const pena = crime ? inteiro(this.jogo.rng, crime.def.pena[0], crime.def.pena[1]) : 10;
    agente.estado = 'preso';
    agente.diasPreso = Math.max(1, pena / 10);
    agente.fichaCriminal.push({ crime: crime ? crime.def.nome : 'infração', dia: this.jogo.tempo.diaAbsoluto });
    if (agente.empregoId) {
      const e = this.jogo.empresas.porId(agente.empregoId);
      if (e) this.jogo.empresas.demitir(e, agente.id, 'prisão do funcionário');
    }
    const presidio = (this.jogo.mundo.indicePorTipo.get('presidio') || [])[0];
    if (presidio !== undefined) {
      const l = this.jogo.mundo.lotes[presidio];
      agente.x = l.x + faixa(this.jogo.rng, -15, 15);
      agente.z = l.z + faixa(this.jogo.rng, -15, 15);
      agente.loteAtual = presidio;
    }
    this.presos.push(agente.id);
    this.estatisticas.condenacoes++;
  }

  atualizar(dt) {
    const dtHoras = (dt * this.jogo.tempo.escala) / 3600;
    for (const p of this.processos) {
      if (!p.aberto) continue;
      p.tempoEtapa += dtHoras;
      const et = ETAPAS[p.etapa];
      if (p.tempoEtapa >= et.horas) {
        p.tempoEtapa = 0;
        p.linha.push({ etapa: et.nome, texto: et.texto, hora: this.jogo.tempo.rotulo });
        this.jogo.ui?.atualizarProcesso(p);
        p.etapa++;
        if (p.etapa >= ETAPAS.length) this.sentenciar(p);
        else if (ETAPAS[p.etapa].chave === 'investigacao') {
          // Chance de soltura antes do processo (falta de provas)
          if (p.provas < 0.35 && chance(this.jogo.rng, 0.5)) {
            this.finalizar(p, { tipo: 'liberacao', texto: 'Liberado por insuficiência de provas.' });
          }
        }
      }
    }
    this.processos = this.processos.filter((p) => p.aberto || this.jogo.tempo.diaAbsoluto - (p.diaFim ?? 0) < 10);
  }

  sentenciar(p) {
    const jogo = this.jogo, rng = jogo.rng;
    const defesa = p.advogado ? p.advogado.qualidade : 0.25;
    const culpa = clamp(p.provas * 0.55 + p.gravidade * 0.08 + p.antecedentes * 0.05 - defesa * 0.45 - (p.atenuante ? 0.2 : 0), 0, 1);
    let resultado;
    if (culpa < 0.3) {
      resultado = { tipo: 'liberacao', texto: 'Absolvido. Provas insuficientes para condenação.' };
      this.estatisticas.absolvicoes++;
    } else if (culpa < 0.45) {
      const valor = Math.round(1200 * p.gravidade * (1 + culpa));
      resultado = { tipo: 'multa', valor, texto: `Condenado ao pagamento de multa de ${dinheiro(valor)}.` };
      this.estatisticas.multas++;
    } else if (culpa < 0.6) {
      const horas = inteiro(rng, 40, 160);
      resultado = { tipo: 'servico', horas, texto: `Pena alternativa: ${horas}h de serviço comunitário.` };
    } else {
      const dias = Math.round(clamp(p.gravidade * faixa(rng, 6, 22) * (1 + culpa) * (1 - defesa * 0.3), 2, 220));
      resultado = { tipo: 'prisao', dias, texto: `Condenado a ${dias} dias de reclusão na Penitenciária Pedra Cinza.` };
      this.estatisticas.condenacoes++;
    }
    this.finalizar(p, resultado);
  }

  finalizar(p, resultado) {
    const jogo = this.jogo;
    p.aberto = false; p.resultado = resultado; p.diaFim = jogo.tempo.diaAbsoluto;
    p.linha.push({ etapa: 'Resultado', texto: resultado.texto, hora: jogo.tempo.rotulo });
    jogo.ui?.atualizarProcesso(p);
    const jogador = jogo.jogador;
    if (p.reu !== 'jogador') return;

    jogador.fichaCriminal.push({ crime: p.acusacao, resultado: resultado.tipo, dia: jogo.tempo.diaAbsoluto });
    jogo.noticias?.registrar('policia', `Justiça decide caso ${p.id}: ${resultado.texto}`);

    switch (resultado.tipo) {
      case 'liberacao':
        jogador.estado = 'livre';
        jogo.ui?.feed('⚖️ Você foi liberado.');
        break;
      case 'multa':
        jogador.pagar(resultado.valor, 'Multa judicial');
        jogador.estado = 'livre';
        break;
      case 'servico':
        jogador.estado = 'livre';
        jogador.servicoComunitario = resultado.horas;
        jogo.ui?.feed(`⚖️ ${resultado.horas}h de serviço comunitário registradas na sua ficha.`);
        break;
      case 'prisao':
        jogador.irParaPresidio(resultado.dias);
        break;
    }
    jogador.notoriedade = clamp(jogador.notoriedade + (resultado.tipo === 'prisao' ? 0.15 : 0.05), 0, 1);
    jogo.barramento.emitir('processo-encerrado', p);
  }
}
