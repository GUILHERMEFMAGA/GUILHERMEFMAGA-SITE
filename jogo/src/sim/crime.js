// =====================================================================
// CRIMINALIDADE SISTÊMICA (ficcional)
// Crimes emergem do estado do mundo: desemprego, riqueza da região,
// horário, clima, segurança do alvo e presença policial.
// Assaltos e reféns são tratados de forma ABSTRATA e cinematográfica —
// sem procedimentos reais de invasão, arrombamento ou burla de segurança.
// =====================================================================
import { clamp, faixa, chance, escolher, inteiro, dist, dinheiro } from '../util/nucleo.js';
import { DISTRITOS } from '../mundo/gerador.js';

export const TIPOS_CRIME = {
  furto:          { nome: 'Furto', gravidade: 1, duracao: 40,  alvo: ['pedestre'],                 pena: [0, 20] },
  vandalismo:     { nome: 'Vandalismo', gravidade: 1, duracao: 60, alvo: ['rua'],                  pena: [0, 15] },
  'roubo-veiculo':{ nome: 'Roubo de veículo', gravidade: 2, duracao: 90, alvo: ['rua'],            pena: [10, 60] },
  'assalto-loja': { nome: 'Assalto a estabelecimento', gravidade: 3, duracao: 150, alvo: ['loja', 'supermercado', 'posto', 'restaurante'], pena: [30, 120] },
  invasao:        { nome: 'Invasão de residência', gravidade: 3, duracao: 180, alvo: ['casa', 'mansao'], pena: [25, 90] },
  golpe:          { nome: 'Golpe financeiro (ficcional)', gravidade: 2, duracao: 300, alvo: ['escritorio'], pena: [20, 80] },
  'assalto-banco':{ nome: 'Assalto a banco', gravidade: 5, duracao: 420, alvo: ['banco'],          pena: [120, 400] },
  'crime-organizado': { nome: 'Operação de grupo organizado', gravidade: 4, duracao: 600, alvo: ['galpao', 'fabrica'], pena: [90, 300] },
};

let seq = 1;

export class Crime {
  constructor(jogo) {
    this.jogo = jogo;
    this.ativos = [];
    this.historico = [];
    this.grupos = [];
    this.candidatos = new Set();
    this.indiceCriminalidade = 0.3;
    this.tensaoCidade = 0;
    this.planoJogador = null;
  }

  iniciar() {
    const rng = this.jogo.rng;
    for (let i = 0; i < 7; i++) {
      this.grupos.push({
        id: i + 1,
        nome: `Grupo ${escolher(rng, ['Cinza', 'Oeste', 'Maré', 'Vértice', 'Rota 9', 'Pedra Negra', 'Névoa'])}`,
        membros: [], notoriedade: faixa(rng, 0.1, 0.5), caixa: faixa(rng, 5000, 90000),
        especialidade: escolher(rng, ['assalto-loja', 'roubo-veiculo', 'invasao', 'golpe', 'assalto-banco']),
        ativo: true, calor: 0,
      });
    }
  }

  recrutarCandidato(agente) {
    if (agente.personalidade.honestidade > 0.65) return;
    this.candidatos.add(agente.id);
    const g = escolher(this.jogo.rng, this.grupos);
    if (g && g.membros.length < 12) g.membros.push(agente.id);
  }

  // ------------------------------------------------------------------
  riscoRegiao(x, z) {
    const jogo = this.jogo;
    const distrito = jogo.mundo.distritoDe(x, z);
    const riqueza = DISTRITOS[distrito]?.riqueza ?? 0.5;
    const presenca = jogo.policia.presencaEm(x, z);
    const hora = jogo.tempo.hora;
    const noite = (hora < 6 || hora > 20) ? 1.6 : 1;
    const chuva = jogo.tempo.infoInterp().chuva * 0.5;
    const desemprego = jogo.economia.desemprego;
    return clamp((0.35 + desemprego * 2.2 + riqueza * 0.5 + chuva) * noite * (1 - presenca * 0.55), 0.02, 3);
  }

  atualizar(dt) {
    const jogo = this.jogo;
    const escala = jogo.tempo.escala;
    // Taxa base: ~alguns crimes por hora na cidade inteira
    const taxa = 0.00042 * dt * escala * (0.6 + jogo.economia.desemprego * 6) * (1 + this.tensaoCidade);
    if (chance(jogo.rng, taxa)) this.gerarCrime();

    for (let i = this.ativos.length - 1; i >= 0; i--) {
      const c = this.ativos[i];
      this.passoCrime(c, dt * escala);
      if (c.estado === 'encerrado') {
        this.ativos.splice(i, 1);
        this.historico.push(c);
        if (this.historico.length > 200) this.historico.shift();
      }
    }
    this.tensaoCidade = clamp(this.tensaoCidade - dt * 0.004, 0, 2);
    this.indiceCriminalidade = clamp(this.indiceCriminalidade * 0.999 + this.ativos.length * 0.0008, 0.05, 1);
  }

  gerarCrime(tipoForcado, loteForcado, autoresJogador) {
    const jogo = this.jogo, rng = jogo.rng, mundo = jogo.mundo;
    const tipo = tipoForcado || this.sortearTipo();
    const def = TIPOS_CRIME[tipo];
    let lote = loteForcado;
    if (!lote) {
      const candidatos = [];
      for (const alvo of def.alvo) {
        const ids = mundo.indicePorTipo.get(alvo);
        if (ids) for (let k = 0; k < 6; k++) candidatos.push(mundo.lotes[escolher(rng, ids)]);
      }
      if (!candidatos.length) {
        const no = escolher(rng, mundo.nos);
        lote = { x: no.x, z: no.z, id: -1, seguranca: 0.05, camerasQtd: 0, nome: 'via pública', distrito: mundo.distritoDe(no.x, no.z) };
      } else {
        // pondera por risco da região e valor do alvo
        let melhor = null, mp = -1;
        for (const l of candidatos) {
          const p = this.riscoRegiao(l.x, l.z) * (1 - l.seguranca * 0.7) * faixa(rng, 0.6, 1.4);
          if (p > mp) { mp = p; melhor = l; }
        }
        lote = melhor;
      }
    }

    const grupo = def.gravidade >= 3 ? (this.grupos.filter((g) => g.ativo && g.especialidade === tipo)[0] || escolher(rng, this.grupos)) : null;
    const nAutores = def.gravidade >= 4 ? inteiro(rng, 3, 6) : def.gravidade >= 3 ? inteiro(rng, 1, 3) : 1;
    const autores = autoresJogador || [];
    if (!autoresJogador) {
      const pool = [...this.candidatos];
      for (let i = 0; i < nAutores; i++) {
        const id = pool.length ? escolher(rng, pool) : null;
        const ag = id ? jogo.agentes.porId(id) : null;
        autores.push(ag ? { id: ag.id, nome: ag.nome, npc: true } : { id: -1, nome: `Suspeito não identificado`, npc: false });
      }
    }

    const c = {
      id: `OC${(seq++).toString().padStart(5, '0')}`,
      tipo, def, x: lote.x, z: lote.z, loteId: lote.id, local: lote.nome || 'local não identificado',
      distrito: lote.distrito, autores, grupo, inicioHora: jogo.tempo.hora, inicioDia: jogo.tempo.diaAbsoluto,
      estado: 'em-andamento', fase: 'abordagem', tempoFase: 0, duracao: def.duracao * faixa(rng, 0.7, 1.5),
      detectado: false, alarme: false, policiaChamada: false, policiaNoLocal: false,
      cameras: lote.camerasQtd || 0, seguranca: lote.seguranca || 0,
      testemunhas: inteiro(rng, 0, 6) + (jogo.tempo.hora > 7 && jogo.tempo.hora < 22 ? 3 : 0),
      refens: 0, tensao: 0, negociacao: null, provas: [], valor: this.valorAlvo(tipo, lote),
      jogadorEnvolvido: !!autoresJogador, resultado: null, unidades: [], registroLinhaTempo: [],
    };
    this.registrar(c, `${def.nome} iniciado em ${c.local} (${c.distrito}).`);
    this.ativos.push(c);
    jogo.barramento.emitir('crime-iniciado', c);
    if (def.gravidade >= 3) jogo.noticias?.registrar('policia', `${def.nome} em andamento em ${c.local}.`, c.x, c.z);
    return c;
  }

  valorAlvo(tipo, lote) {
    const rng = this.jogo.rng;
    const base = { furto: 400, vandalismo: 0, 'roubo-veiculo': 32000, 'assalto-loja': 7000, invasao: 24000,
      golpe: 65000, 'assalto-banco': 480000, 'crime-organizado': 150000 }[tipo] || 1000;
    return Math.round(base * faixa(rng, 0.5, 1.8) * (1 + (lote.valor || 0) / 900000));
  }

  sortearTipo() {
    const rng = this.jogo.rng;
    const pares = [['furto', 34], ['vandalismo', 18], ['roubo-veiculo', 16], ['assalto-loja', 14],
      ['invasao', 9], ['golpe', 5], ['crime-organizado', 2.5], ['assalto-banco', 1.5]];
    let total = 0; for (const p of pares) total += p[1];
    let r = rng() * total;
    for (const p of pares) { r -= p[1]; if (r <= 0) return p[0]; }
    return 'furto';
  }

  registrar(c, texto) {
    c.registroLinhaTempo.push({ hora: this.jogo.tempo.rotulo, texto });
    if (c.registroLinhaTempo.length > 40) c.registroLinhaTempo.shift();
    if (c.jogadorEnvolvido) this.jogo.ui?.feed(`🚨 ${texto}`);
  }

  // ------------------------------------------------------------------
  passoCrime(c, dtJogo) {
    const jogo = this.jogo, rng = jogo.rng;
    c.tempoFase += dtJogo;
    const perfil = c.jogadorEnvolvido ? jogo.jogador.perfilCriminal() : { habilidade: 0.5, calma: 0.5 };

    // --- Detecção ----------------------------------------------------
    if (!c.detectado) {
      const pDet = (0.0022 * (1 + c.cameras * 0.1 + c.testemunhas * 0.08 + c.seguranca * 2.2)) * dtJogo * 0.1
        * (1 - perfil.habilidade * 0.4);
      if (chance(rng, pDet)) {
        c.detectado = true;
        c.alarme = c.seguranca > 0.3 || chance(rng, 0.5);
        this.registrar(c, c.alarme ? 'Alarme disparado — segurança acionou o sistema.' : 'Alguém percebeu a ação e ligou para a emergência.');
        if (c.cameras > 0) c.provas.push({ tipo: 'câmera', forca: clamp(0.25 + c.cameras * 0.05, 0, 0.9) });
        if (c.testemunhas > 0) c.provas.push({ tipo: 'testemunha', forca: clamp(0.15 + c.testemunhas * 0.06, 0, 0.8) });
        this.chamarPolicia(c);
      }
    }

    // --- Fases -------------------------------------------------------
    switch (c.fase) {
      case 'abordagem':
        if (c.tempoFase > c.duracao * 0.25) {
          c.fase = c.def.gravidade >= 4 ? 'controle' : 'execucao';
          c.tempoFase = 0;
          if (c.fase === 'controle') {
            c.refens = inteiro(rng, 2, 14);
            c.tensao = 0.4;
            this.registrar(c, `Pessoas no local foram mantidas no interior do prédio (${c.refens} civis).`);
            jogo.barramento.emitir('refens', c);
          }
        }
        break;
      case 'controle': {
        c.tensao = clamp(c.tensao + dtJogo * 0.0006 * (c.policiaNoLocal ? 2 : 1) - (c.negociacao ? dtJogo * 0.0008 : 0), 0, 1);
        if (!c.negociacao && c.policiaNoLocal) {
          c.negociacao = { progresso: 0, confianca: 0.3, liberados: 0 };
          this.registrar(c, 'Negociador assumiu o contato. Diálogo iniciado.');
        }
        if (c.negociacao) {
          c.negociacao.progresso += dtJogo * 0.0007 * (0.5 + perfil.calma);
          if (chance(rng, dtJogo * 0.0004) && c.refens > 0) {
            const libs = inteiro(rng, 1, 3);
            c.refens = Math.max(0, c.refens - libs);
            c.negociacao.liberados += libs;
            c.negociacao.confianca = clamp(c.negociacao.confianca + 0.12, 0, 1);
            this.registrar(c, `${libs} civis liberados durante a negociação.`);
          }
          if (c.negociacao.progresso > 1) {
            if (chance(rng, 0.55 + c.negociacao.confianca * 0.3 - perfil.habilidade * 0.2)) {
              this.encerrar(c, 'rendicao');
              return;
            }
            c.negociacao.progresso = 0.4;
          }
        }
        if (c.tempoFase > c.duracao * 0.5) { c.fase = 'execucao'; c.tempoFase = 0; }
        break;
      }
      case 'execucao':
        if (c.tempoFase > c.duracao * 0.5) {
          c.fase = 'fuga'; c.tempoFase = 0;
          c.saque = Math.round(c.valor * clamp(0.3 + perfil.habilidade * 0.8 + (c.alarme ? -0.25 : 0.15), 0, 1.2));
          this.registrar(c, `Fase de saída iniciada. Valor estimado envolvido: ${dinheiro(c.saque)}.`);
        }
        break;
      case 'fuga': {
        const cercado = c.policiaNoLocal && c.unidades.length >= (c.def.gravidade >= 4 ? 3 : 1);
        const pEscapar = clamp(0.5 + perfil.habilidade * 0.5 - (cercado ? 0.55 : 0) - c.def.gravidade * 0.05, 0.02, 0.95);
        if (c.tempoFase > c.duracao * 0.3) {
          this.encerrar(c, chance(rng, pEscapar) ? 'fuga' : 'prisao');
          return;
        }
        break;
      }
    }

    // tempo máximo
    if (c.tempoFase > c.duracao * 3) this.encerrar(c, c.policiaNoLocal ? 'prisao' : 'fuga');
  }

  chamarPolicia(c) {
    if (c.policiaChamada) return;
    c.policiaChamada = true;
    this.jogo.policia.novaOcorrencia({
      tipo: c.tipo, gravidade: c.def.gravidade, x: c.x, z: c.z, crime: c,
      descricao: `${c.def.nome} — ${c.local}`,
    });
  }

  encerrar(c, resultado) {
    const jogo = this.jogo;
    c.estado = 'encerrado'; c.resultado = resultado;
    const valor = c.saque || Math.round(c.valor * 0.4);

    if (resultado === 'fuga') {
      this.registrar(c, 'Os envolvidos deixaram o local antes do cerco.');
      this.tensaoCidade = clamp(this.tensaoCidade + 0.15, 0, 2);
      if (c.jogadorEnvolvido) {
        jogo.jogador.receberDinheiro(valor, `Resultado de ${c.def.nome} (ficcional)`);
        jogo.jogador.notoriedade = clamp(jogo.jogador.notoriedade + c.def.gravidade * 0.08, 0, 1);
        jogo.ui?.feed(`💸 Você escapou com ${dinheiro(valor)}. Notoriedade aumentou.`);
      } else if (c.grupo) {
        c.grupo.caixa += valor; c.grupo.notoriedade = clamp(c.grupo.notoriedade + 0.05, 0, 1);
      }
      // investigação continua
      if (c.provas.length) jogo.policia.abrirInvestigacao(c);
    } else if (resultado === 'prisao') {
      this.registrar(c, 'Envolvidos detidos pela polícia no local.');
      if (c.jogadorEnvolvido) jogo.justica.prender(jogo.jogador, c);
      else for (const a of c.autores) {
        const ag = jogo.agentes.porId(a.id);
        if (ag) jogo.justica.prenderNPC(ag, c);
      }
    } else if (resultado === 'rendicao') {
      this.registrar(c, 'Rendição negociada. Civis liberados em segurança.');
      if (c.jogadorEnvolvido) jogo.justica.prender(jogo.jogador, c, { atenuante: true });
      else for (const a of c.autores) {
        const ag = jogo.agentes.porId(a.id);
        if (ag) jogo.justica.prenderNPC(ag, c);
      }
    }

    jogo.policia.encerrarOcorrenciaDoCrime(c);
    jogo.barramento.emitir('crime-encerrado', c);
    jogo.memoriaMundo?.registrar(`${c.def.nome} em ${c.local} (${resultado})`, c.x, c.z, c.def.gravidade / 5);
    if (c.def.gravidade >= 3) {
      jogo.noticias?.registrar('policia',
        `${c.def.nome} em ${c.local} terminou em ${resultado === 'fuga' ? 'fuga dos envolvidos' : resultado === 'prisao' ? 'prisão' : 'rendição negociada'}.`, c.x, c.z);
    }
    // Efeito econômico local
    if (c.def.gravidade >= 3 && c.loteId >= 0) {
      const e = jogo.empresas.doLote(c.loteId);
      if (e) { e.reputacao = clamp(e.reputacao - 0.1, 0.05, 1); e.diasPrejuizo += 1; }
      jogo.economia.choque('varejo', 1.02, 3, 'insegurança na região');
    }
  }

  // --- Planejamento do jogador (abstrato) -----------------------------
  criarPlano({ alvoLoteId, equipe, veiculos, horario, plano, rotaFuga, pontoEncontro }) {
    const jogo = this.jogo;
    const lote = jogo.mundo.lotes[alvoLoteId];
    if (!lote) return { ok: false, erro: 'Alvo inválido' };
    const risco = clamp(lote.seguranca * 1.2 + (equipe > 4 ? 0.2 : 0) + jogo.jogador.notoriedade * 0.5
      - (plano === 'discreto' ? 0.25 : 0) - (veiculos >= Math.ceil(equipe / 3) ? 0.1 : -0.15)
      - (horario === 'madrugada' ? 0.15 : 0), 0.05, 0.98);
    const sucesso = clamp(1 - risco + equipe * 0.04 + (rotaFuga ? 0.08 : 0) + (pontoEncontro ? 0.05 : 0), 0.05, 0.95);
    this.planoJogador = { alvoLoteId, equipe, veiculos, horario, plano, rotaFuga, pontoEncontro, risco, sucesso };
    return { ok: true, plano: this.planoJogador };
  }

  executarPlano() {
    const jogo = this.jogo;
    const p = this.planoJogador;
    if (!p) return { ok: false, erro: 'Nenhum plano definido' };
    const lote = jogo.mundo.lotes[p.alvoLoteId];
    const tipo = lote.tipo === 'banco' ? 'assalto-banco' : lote.tipo === 'mansao' || lote.tipo === 'casa' ? 'invasao' : 'assalto-loja';
    const autores = [{ id: 'jogador', nome: jogo.jogador.nome, npc: false }];
    for (let i = 1; i < p.equipe; i++) autores.push({ id: -1, nome: `Integrante ${i}`, npc: false });
    const c = this.gerarCrime(tipo, lote, autores);
    c.planejado = true;
    c.bonusPlano = p.sucesso;
    jogo.jogador.crimeAtual = c;
    return { ok: true, crime: c };
  }
}
