// =====================================================================
// EVENTOS DINÂMICOS E CADEIAS DE CONSEQUÊNCIA
// =====================================================================
import { clamp, faixa, chance, escolher, inteiro, dist, dinheiro } from '../util/nucleo.js';

export const TIPOS_EVENTO = {
  incendio:      { nome: 'Incêndio', icone: '🔥', dur: [600, 2200], grave: true },
  obra:          { nome: 'Obra na via', icone: '🚧', dur: [3000, 14000] },
  manifestacao:  { nome: 'Manifestação', icone: '📣', dur: [1200, 4000] },
  feira:         { nome: 'Feira de rua', icone: '🎪', dur: [3000, 9000] },
  'animal-solto':{ nome: 'Animal solto na pista', icone: '🐄', dur: [300, 900] },
  apagao:        { nome: 'Queda de energia', icone: '💡', dur: [600, 2600], grave: true },
  'veiculo-quebrado': { nome: 'Veículo quebrado', icone: '🛠️', dur: [400, 1400] },
  desaparecimento: { nome: 'Pessoa desaparecida', icone: '🔎', dur: [5000, 20000] },
  inauguracao:   { nome: 'Inauguração comercial', icone: '🎉', dur: [2000, 6000] },
  'queda-arvore':{ nome: 'Queda de árvore', icone: '🌳', dur: [500, 1800] },
  'vazamento':   { nome: 'Vazamento na via', icone: '💧', dur: [700, 2200] },
};

let seq = 1;

export class Eventos {
  constructor(jogo) {
    this.jogo = jogo;
    this.ativos = [];
    this.cadeias = [];
    this.historico = [];
    jogo.barramento.em('acidente', (ac) => this.cadeiaAcidente(ac));
    jogo.barramento.em('clima-mudou', ({ para }) => {
      if (para === 'tempestade') this.criar('queda-arvore');
      if (para === 'tempestade' && chance(jogo.rng, 0.5)) this.criar('apagao');
    });
  }

  criar(tipoForcado, pos) {
    const jogo = this.jogo, rng = jogo.rng, mundo = jogo.mundo;
    const tipo = tipoForcado || this.sortear();
    const def = TIPOS_EVENTO[tipo];
    let x, z, lote = null;
    if (pos) { x = pos.x; z = pos.z; }
    else if (['incendio', 'inauguracao', 'apagao'].includes(tipo)) {
      lote = escolher(rng, mundo.lotes); x = lote.x; z = lote.z;
    } else {
      const no = escolher(rng, mundo.nos); x = no.x; z = no.z;
    }
    const ev = {
      id: `EV${(seq++).toString().padStart(5, '0')}`, tipo, def, x, z, lote,
      inicio: jogo.tempo.diaAbsoluto + jogo.tempo.hora / 24,
      duracao: faixa(rng, def.dur[0], def.dur[1]), restante: 0,
      distrito: mundo.distritoDe(x, z), atendido: false,
    };
    ev.restante = ev.duracao;
    this.ativos.push(ev);
    this.aplicarEfeito(ev);
    jogo.barramento.emitir('evento', ev);
    jogo.memoriaMundo?.registrar(`${def.nome} em ${ev.distrito}`, x, z, def.grave ? 0.8 : 0.3);
    return ev;
  }

  sortear() {
    const rng = this.jogo.rng;
    const clima = this.jogo.tempo.infoInterp();
    const pares = [
      ['obra', 16], ['veiculo-quebrado', 18], ['feira', 8], ['manifestacao', 6],
      ['incendio', 5], ['animal-solto', 7], ['apagao', 4 + clima.vento * 8],
      ['desaparecimento', 3], ['inauguracao', 6], ['queda-arvore', 2 + clima.vento * 10],
      ['vazamento', 5 + clima.chuva * 8],
    ];
    let total = 0; for (const p of pares) total += p[1];
    let r = rng() * total;
    for (const p of pares) { r -= p[1]; if (r <= 0) return p[0]; }
    return 'obra';
  }

  aplicarEfeito(ev) {
    const jogo = this.jogo;
    const mundo = jogo.mundo;
    const noProx = mundo.noMaisProximo(ev.x, ev.z);
    switch (ev.tipo) {
      case 'obra':
      case 'queda-arvore':
      case 'vazamento':
      case 'veiculo-quebrado':
      case 'animal-solto': {
        if (noProx && noProx.viz.length) {
          const ar = mundo.arestas[escolher(jogo.rng, noProx.viz).aresta];
          if (ar) { ar.bloqueio = ev.tipo === 'obra' ? 0.7 : 0.4; ev.aresta = ar; }
        }
        if (ev.tipo === 'veiculo-quebrado') jogo.emergencia.chamar('guincho', ev.x, ev.z, 'Veículo quebrado', 500);
        break;
      }
      case 'incendio': {
        jogo.emergencia.chamar('incendio', ev.x, ev.z, `Incêndio em ${ev.lote?.nome || 'edificação'}`, 900);
        jogo.emergencia.chamar('medico', ev.x, ev.z, 'Apoio médico', 700);
        jogo.policia.novaOcorrencia({ tipo: 'incendio', gravidade: 3, x: ev.x, z: ev.z, descricao: `Incêndio em ${ev.lote?.nome || 'edificação'}` });
        const e = ev.lote ? jogo.empresas.doLote(ev.lote.id) : null;
        if (e) { e.status = 'fechada'; e.diasPrejuizo += 5; setTimeout(() => { if (e.status === 'fechada') e.status = 'ativa'; }, 0); }
        jogo.noticias?.registrar('urbano', `Incêndio atinge ${ev.lote?.nome || 'imóvel'} em ${ev.distrito}. Bombeiros no local.`, ev.x, ev.z);
        break;
      }
      case 'manifestacao': {
        if (noProx) for (const v of noProx.viz) { const ar = mundo.arestas[v.aresta]; if (ar) ar.bloqueio = 0.8; }
        ev.arestas = noProx ? noProx.viz.map((v) => mundo.arestas[v.aresta]) : [];
        jogo.noticias?.registrar('urbano', `Manifestação interdita vias em ${ev.distrito}. Trânsito desviado.`, ev.x, ev.z);
        break;
      }
      case 'apagao': {
        ev.raio = faixa(jogo.rng, 180, 520);
        jogo.noticias?.registrar('urbano', `Falta de energia afeta ${ev.distrito}. Equipes trabalham no restabelecimento.`, ev.x, ev.z);
        break;
      }
      case 'feira':
      case 'inauguracao': {
        ev.raio = 160;
        const perto = mundo.grade.proximos(ev.x, ev.z, 180);
        for (const l of perto) {
          const e = jogo.empresas.doLote(l.id);
          if (e) e.reputacao = clamp(e.reputacao + 0.05, 0, 1);
        }
        break;
      }
      case 'desaparecimento': {
        const ag = escolher(jogo.rng, jogo.agentes.lista);
        ev.pessoa = ag ? ag.nome : 'Pessoa não identificada';
        jogo.noticias?.registrar('policia', `Família procura por ${ev.pessoa}, vista pela última vez em ${ev.distrito}.`, ev.x, ev.z);
        break;
      }
    }
  }

  removerEfeito(ev) {
    if (ev.aresta) ev.aresta.bloqueio = 0;
    if (ev.arestas) for (const ar of ev.arestas) if (ar) ar.bloqueio = 0;
  }

  atualizar(dt) {
    const jogo = this.jogo;
    const dtJogo = dt * jogo.tempo.escala;
    // frequência base: alguns eventos por hora na cidade
    if (chance(jogo.rng, 0.00035 * dtJogo)) this.criar();

    for (let i = this.ativos.length - 1; i >= 0; i--) {
      const ev = this.ativos[i];
      ev.restante -= dtJogo;
      if (ev.restante <= 0) {
        this.removerEfeito(ev);
        this.ativos.splice(i, 1);
        this.historico.push(ev);
        if (this.historico.length > 120) this.historico.shift();
        jogo.barramento.emitir('evento-encerrado', ev);
      }
    }

    // Cadeias
    for (let i = this.cadeias.length - 1; i >= 0; i--) {
      const c = this.cadeias[i];
      c.timer -= dtJogo;
      if (c.timer <= 0) {
        const passo = c.passos.shift();
        if (!passo) { this.cadeias.splice(i, 1); continue; }
        passo.efeito();
        c.registro.push(passo.texto);
        jogo.barramento.emitir('cadeia', { cadeia: c, passo: passo.texto });
        c.timer = passo.espera;
        if (!c.passos.length) {
          jogo.ui?.feed(`🔗 Cadeia de eventos concluída: ${c.titulo}`);
          this.cadeias.splice(i, 1);
        }
      }
    }
  }

  cadeiaAcidente(ac) {
    const jogo = this.jogo;
    const distrito = jogo.mundo.distritoDe(ac.x, ac.z);
    const empresasPerto = jogo.mundo.grade.proximos(ac.x, ac.z, 500)
      .map((l) => jogo.empresas.doLote(l.id)).filter(Boolean);

    if (ac.grave) {
      jogo.emergencia.chamar('medico', ac.x, ac.z, 'Vítimas de colisão', 800);
      jogo.policia.novaOcorrencia({ tipo: 'acidente', gravidade: 2, x: ac.x, z: ac.z, descricao: `Colisão grave em ${distrito}` });
    }
    jogo.emergencia.chamar('guincho', ac.x, ac.z, 'Remoção de veículos', 600);

    const cadeia = {
      titulo: `Acidente em ${distrito}`, registro: [], timer: 60,
      passos: [
        { texto: 'Trânsito para na via principal', espera: 120, efeito: () => { if (ac.aresta) ac.aresta.bloqueio = Math.max(ac.aresta.bloqueio, 0.8); } },
        { texto: 'Congestionamento se espalha pelas vias vizinhas', espera: 180, efeito: () => {
          const no = jogo.mundo.noMaisProximo(ac.x, ac.z);
          if (no) for (const v of no.viz) { const ar = jogo.mundo.arestas[v.aresta]; if (ar) ar.bloqueio = Math.max(ar.bloqueio, 0.35); }
        } },
        { texto: 'Funcionários chegam atrasados aos postos de trabalho', espera: 240, efeito: () => {
          for (const e of empresasPerto) e.diasPrejuizo += 0.25;
        } },
        { texto: 'Produtividade cai e entregas atrasam', espera: 300, efeito: () => {
          for (const e of empresasPerto) e.estoque = Math.max(0, e.estoque - Math.round(e.estoque * 0.12));
        } },
        { texto: 'Estoques diminuem e preços locais sobem', espera: 200, efeito: () => {
          jogo.economia.choque('logistica', 1.05, 2, 'acidente em via principal');
          for (const e of empresasPerto) e.preco *= 1.03;
          jogo.noticias?.registrar('economia', `Após acidente em ${distrito}, comerciantes relatam atraso nas entregas e reajuste de preços.`, ac.x, ac.z);
        } },
      ],
    };
    this.cadeias.push(cadeia);
    jogo.noticias?.registrar('urbano', `${ac.grave ? 'Colisão grave' : 'Acidente'} registrado em ${distrito}.${ac.feridos ? ` ${ac.feridos} feridos.` : ''}`, ac.x, ac.z);
  }
}
