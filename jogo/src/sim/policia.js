// =====================================================================
// POLÍCIA E SERVIÇOS DE EMERGÊNCIA AUTÔNOMOS
// Patrulhas, despacho por contexto, investigação, mandados.
// Não existe "nível de procurado": a resposta depende de distância,
// disponibilidade, gravidade, trânsito, horário e provas.
// =====================================================================
import { clamp, faixa, chance, escolher, inteiro, dist } from '../util/nucleo.js';

let seqOc = 1, seqUn = 1, seqInv = 1;

export class Policia {
  constructor(jogo) {
    this.jogo = jogo;
    this.delegacias = [];
    this.unidades = [];
    this.ocorrencias = [];
    this.investigacoes = [];
    this.mandados = [];
    this.estatisticas = { atendidas: 0, prisoes: 0, tempoMedio: 0 };
  }

  iniciar() {
    const mundo = this.jogo.mundo;
    this.delegacias = (mundo.indicePorTipo.get('delegacia') || []).map((id) => mundo.lotes[id]);
    const rng = this.jogo.rng;
    for (const d of this.delegacias) {
      const n = d.distrito === 'centro' || d.distrito === 'financeiro' ? 7 : 4;
      for (let i = 0; i < n; i++) {
        this.unidades.push({
          id: `VTR-${(seqUn++).toString().padStart(3, '0')}`,
          delegacia: d.id, x: d.x + faixa(rng, -20, 20), z: d.z + faixa(rng, -20, 20),
          estado: 'patrulha', ocorrencia: null, eta: 0,
          turno: escolher(rng, [{ inicio: 6, fim: 14 }, { inicio: 14, fim: 22 }, { inicio: 22, fim: 6 }]),
          agentes: inteiro(rng, 1, 2), destino: null, patrulhaAlvo: null, veiculo: null,
          experiencia: faixa(rng, 0.3, 0.95),
        });
      }
    }
  }

  emServico(u) {
    const h = this.jogo.tempo.hora;
    const t = u.turno;
    const dentro = t.inicio < t.fim ? (h >= t.inicio && h < t.fim) : (h >= t.inicio || h < t.fim);
    return dentro;
  }

  presencaEm(x, z) {
    let p = 0;
    for (const u of this.unidades) {
      if (!this.emServico(u)) continue;
      const d = dist(u.x, u.z, x, z);
      if (d < 500) p += 1 - d / 500;
    }
    return clamp(p / 3, 0, 1);
  }

  novaOcorrencia({ tipo, gravidade, x, z, crime, descricao }) {
    const oc = {
      id: `OCR${(seqOc++).toString().padStart(5, '0')}`,
      tipo, gravidade, x, z, crime: crime || null, descricao,
      criadaEm: this.jogo.tempo.diaAbsoluto + this.jogo.tempo.hora / 24,
      estado: 'aguardando', unidades: [], prioridade: gravidade,
    };
    this.ocorrencias.push(oc);
    this.jogo.barramento.emitir('ocorrencia', oc);
    this.despachar(oc);
    return oc;
  }

  despachar(oc) {
    const jogo = this.jogo;
    const necessarias = oc.gravidade >= 5 ? 5 : oc.gravidade >= 4 ? 3 : oc.gravidade >= 3 ? 2 : 1;
    const disponiveis = this.unidades
      .filter((u) => this.emServico(u) && (u.estado === 'patrulha' || (u.estado === 'deslocando' && u.ocorrencia && u.ocorrencia.gravidade < oc.gravidade - 1)))
      .map((u) => ({ u, d: dist(u.x, u.z, oc.x, oc.z) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, necessarias);

    if (!disponiveis.length) {
      oc.estado = 'sem-unidade';
      jogo.noticias?.registrar('policia', `Ocorrência em ${oc.descricao} aguarda unidade disponível.`, oc.x, oc.z);
      return;
    }
    const congest = 1 + (jogo.transito?.atrasoMedio || 0) * 1.4;
    for (const { u, d } of disponiveis) {
      u.estado = 'deslocando'; u.ocorrencia = oc; u.destino = { x: oc.x, z: oc.z };
      u.eta = (d / 16) * congest * faixa(jogo.rng, 0.9, 1.3);  // segundos de jogo
      oc.unidades.push(u.id);
      const noOrigem = jogo.mundo.noMaisProximo(u.x, u.z);
      if (d < 900 && jogo.transito) {
        u.veiculo = jogo.transito.despacharEmergencia('policia', noOrigem.id, { x: oc.x, z: oc.z }, () => {});
      }
    }
    oc.estado = 'em-deslocamento';
  }

  abrirInvestigacao(crime) {
    const forca = crime.provas.reduce((a, p) => a + p.forca, 0);
    const inv = {
      id: `INV${(seqInv++).toString().padStart(4, '0')}`,
      crime, provas: [...crime.provas], forca, progresso: 0,
      suspeitos: crime.autores.map((a) => ({ ...a, probabilidade: clamp(0.2 + forca * 0.3, 0, 0.9) })),
      aberta: true, dia: this.jogo.tempo.diaAbsoluto,
      investigador: `Inv. ${escolher(this.jogo.rng, ['Rocha', 'Queiroz', 'Sampaio', 'Dantas', 'Novaes'])}`,
    };
    this.investigacoes.push(inv);
    this.jogo.barramento.emitir('investigacao-aberta', inv);
    return inv;
  }

  // ------------------------------------------------------------------
  atualizar(dt) {
    const jogo = this.jogo;
    const dtJogo = dt * jogo.tempo.escala;
    const rng = jogo.rng;

    for (const u of this.unidades) {
      if (!this.emServico(u)) { u.estado = 'fora-de-servico'; continue; }
      if (u.estado === 'fora-de-servico') u.estado = 'patrulha';

      if (u.estado === 'deslocando') {
        u.eta -= dtJogo;
        // move a unidade em direção à ocorrência
        const alvo = u.destino;
        const d = dist(u.x, u.z, alvo.x, alvo.z);
        const passo = Math.min(d, 18 * dt * jogo.tempo.escala * 0.06);
        if (d > 1) { u.x += ((alvo.x - u.x) / d) * passo; u.z += ((alvo.z - u.z) / d) * passo; }
        if (u.veiculo) { u.x = u.veiculo.x; u.z = u.veiculo.z; }
        if (u.eta <= 0 || d < 12) {
          u.estado = 'no-local';
          const oc = u.ocorrencia;
          if (oc) {
            oc.estado = 'em-atendimento';
            if (oc.crime) {
              oc.crime.policiaNoLocal = true;
              oc.crime.unidades.push(u.id);
              jogo.crime.registrar(oc.crime, `${u.id} chegou ao local. Área sendo isolada.`);
            }
          }
        }
      } else if (u.estado === 'no-local') {
        const oc = u.ocorrencia;
        if (!oc || oc.estado === 'encerrada' || (oc.crime && oc.crime.estado === 'encerrado')) {
          u.estado = 'patrulha'; u.ocorrencia = null; u.veiculo = null;
          this.estatisticas.atendidas++;
        }
      } else {
        // patrulha: caminha entre pontos quentes
        if (!u.patrulhaAlvo || dist(u.x, u.z, u.patrulhaAlvo.x, u.patrulhaAlvo.z) < 20) {
          const base = jogo.mundo.lotes[u.delegacia];
          const ang = rng() * Math.PI * 2, r = faixa(rng, 80, 520);
          u.patrulhaAlvo = { x: base.x + Math.cos(ang) * r, z: base.z + Math.sin(ang) * r };
        }
        const d = dist(u.x, u.z, u.patrulhaAlvo.x, u.patrulhaAlvo.z);
        const passo = Math.min(d, 9 * dt * jogo.tempo.escala * 0.06);
        if (d > 1) { u.x += ((u.patrulhaAlvo.x - u.x) / d) * passo; u.z += ((u.patrulhaAlvo.z - u.z) / d) * passo; }
        // flagrante: crime próximo sem detecção
        for (const c of jogo.crime.ativos) {
          if (!c.detectado && dist(u.x, u.z, c.x, c.z) < 60 && chance(rng, dt * 0.9)) {
            c.detectado = true;
            jogo.crime.registrar(c, `Patrulha ${u.id} percebeu movimentação suspeita.`);
            jogo.crime.chamarPolicia(c);
          }
        }
        // abordagem ao jogador com mandado
        if (this.mandados.some((m) => m.alvo === 'jogador') && dist(u.x, u.z, jogo.jogador.x, jogo.jogador.z) < 26 && jogo.jogador.estado !== 'preso') {
          const m = this.mandados.find((mm) => mm.alvo === 'jogador');
          jogo.ui?.feed('🚔 Abordagem policial: mandado em aberto contra você.');
          jogo.justica.prender(jogo.jogador, m.crime, { porMandado: true });
          this.mandados.splice(this.mandados.indexOf(m), 1);
        }
      }
    }

    // Ocorrências sem unidade são re-despachadas
    for (const oc of this.ocorrencias) {
      if (oc.estado === 'sem-unidade' && chance(rng, dt * 0.2)) this.despachar(oc);
    }
    this.ocorrencias = this.ocorrencias.filter((oc) => oc.estado !== 'encerrada' || (jogo.tempo.diaAbsoluto - oc.criadaEm) < 1);
  }

  encerrarOcorrenciaDoCrime(crime) {
    for (const oc of this.ocorrencias) {
      if (oc.crime === crime) {
        oc.estado = 'encerrada';
        for (const uid of oc.unidades) {
          const u = this.unidades.find((x) => x.id === uid);
          if (u) { u.estado = 'patrulha'; u.ocorrencia = null; u.veiculo = null; }
        }
      }
    }
  }

  passoDiario() {
    const jogo = this.jogo, rng = jogo.rng;
    for (const inv of this.investigacoes) {
      if (!inv.aberta) continue;
      inv.progresso += faixa(rng, 0.08, 0.26) * (0.4 + inv.forca);
      if (inv.progresso >= 1) {
        inv.aberta = false;
        const identificado = chance(rng, clamp(0.25 + inv.forca * 0.5, 0, 0.95));
        if (identificado) {
          const suspeito = inv.suspeitos[0];
          inv.conclusao = `Suspeito identificado: ${suspeito?.nome || 'desconhecido'}`;
          if (inv.crime.jogadorEnvolvido) {
            this.mandados.push({ alvo: 'jogador', crime: inv.crime, dia: jogo.tempo.diaAbsoluto });
            jogo.ui?.aviso('⚖️ Um mandado foi expedido contra você. Evite patrulhas ou procure um advogado.');
            jogo.noticias?.registrar('policia', `Polícia expede mandado após investigação de ${inv.crime.def.nome}.`);
          } else {
            const ag = jogo.agentes.porId(suspeito?.id);
            if (ag) jogo.justica.prenderNPC(ag, inv.crime);
          }
          this.estatisticas.prisoes++;
        } else {
          inv.conclusao = 'Caso arquivado por falta de provas.';
        }
        jogo.noticias?.registrar('policia', `Investigação ${inv.id}: ${inv.conclusao}`);
      }
    }
    this.investigacoes = this.investigacoes.filter((i) => i.aberta || jogo.tempo.diaAbsoluto - i.dia < 20);
  }
}

// =====================================================================
export class Emergencia {
  constructor(jogo) {
    this.jogo = jogo;
    this.chamados = [];
  }

  chamar(tipo, x, z, descricao, duracao = 400) {
    const jogo = this.jogo;
    const ch = {
      id: `EM${Math.floor(Math.random() * 1e5)}`, tipo, x, z, descricao,
      estado: 'despachado', tempo: duracao, veiculo: null,
    };
    const noOrigem = jogo.mundo.noMaisProximo(x, z);
    const classe = tipo === 'incendio' ? 'bombeiro' : tipo === 'medico' ? 'ambulancia' : 'guincho';
    ch.veiculo = jogo.transito.despacharEmergencia(classe, noOrigem.id, { x, z }, () => { ch.estado = 'no-local'; });
    this.chamados.push(ch);
    jogo.barramento.emitir('emergencia', ch);
    return ch;
  }

  atualizar(dt) {
    const dtJogo = dt * this.jogo.tempo.escala;
    for (let i = this.chamados.length - 1; i >= 0; i--) {
      const ch = this.chamados[i];
      if (ch.estado === 'no-local') ch.tempo -= dtJogo;
      if (ch.tempo <= 0) {
        ch.estado = 'encerrado';
        this.chamados.splice(i, 1);
        if (ch.veiculo) {
          const idx = this.jogo.transito.veiculos.indexOf(ch.veiculo);
          if (idx >= 0) this.jogo.transito.veiculos.splice(idx, 1);
        }
      }
    }
  }
}
