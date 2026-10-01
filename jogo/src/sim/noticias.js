// =====================================================================
// MEMÓRIA DO MUNDO + NOTÍCIAS + PUBLICIDADE EM TELÕES
// A cidade lembra do que aconteceu e comenta.
// =====================================================================
import { clamp, escolher, chance, dinheiro } from '../util/nucleo.js';

export class MemoriaMundo {
  constructor(jogo) {
    this.jogo = jogo;
    this.registros = [];
    this.porRegiao = new Map();
    this.famaJogador = 0;
  }

  registrar(texto, x = 0, z = 0, peso = 0.3) {
    const r = {
      texto, x, z, peso, dia: this.jogo.tempo.diaAbsoluto, hora: this.jogo.tempo.rotulo,
      distrito: this.jogo.mundo.distritoDe(x, z),
    };
    this.registros.push(r);
    if (this.registros.length > 400) this.registros.shift();
    const lista = this.porRegiao.get(r.distrito) || [];
    lista.push(r);
    if (lista.length > 40) lista.shift();
    this.porRegiao.set(r.distrito, lista);
    return r;
  }

  comentarioLocal(x, z) {
    const distrito = this.jogo.mundo.distritoDe(x, z);
    const lista = this.porRegiao.get(distrito) || [];
    if (!lista.length) return null;
    const recentes = lista.filter((r) => this.jogo.tempo.diaAbsoluto - r.dia < 6);
    if (!recentes.length) return null;
    return escolher(this.jogo.rng, recentes);
  }

  passoDiario() {
    // esquecimento gradual
    for (const r of this.registros) r.peso *= 0.96;
    this.registros = this.registros.filter((r) => r.peso > 0.03);
    const j = this.jogo.jogador;
    this.famaJogador = clamp(j.notoriedade * 0.6 + (j.empresas.length * 0.05) + (j.patrimonio() / 4e6), 0, 1);
  }
}

// ---------------------------------------------------------------------
const SECOES = { policia: 'Segurança', economia: 'Economia', urbano: 'Cidade', clima: 'Clima', esportes: 'Esportes', negocios: 'Negócios' };

export class Noticias {
  constructor(jogo) {
    this.jogo = jogo;
    this.manchetes = [];
    this.anuncios = [];
    jogo.barramento.em('novo-dia', () => this.boletimDiario());
  }

  registrar(secao, texto, x, z) {
    const n = {
      secao, titulo: texto, dia: this.jogo.tempo.diaAbsoluto, hora: this.jogo.tempo.rotulo,
      local: x !== undefined ? this.jogo.mundo.distritoDe(x, z) : null,
    };
    this.manchetes.unshift(n);
    if (this.manchetes.length > 120) this.manchetes.pop();
    this.jogo.barramento.emitir('noticia', n);
    return n;
  }

  boletimDiario() {
    const jogo = this.jogo, eco = jogo.economia;
    const ult = eco.historicoIndices[eco.historicoIndices.length - 1];
    if (ult) {
      this.registrar('economia', `Índice de preços em ${(ult.precos * 100).toFixed(1)} | inflação ${(ult.inflacao * 100).toFixed(1)}% a.a. | juros ${(ult.juros * 100).toFixed(2)}% a.m. | desemprego ${(ult.desemprego * 100).toFixed(1)}%`);
    }
    const clima = jogo.tempo.infoInterp();
    this.registrar('clima', `Previsão: ${clima.nome.toLowerCase()} com vento ${(clima.vento * 100).toFixed(0)}%. ${clima.chuva > 0.4 ? 'Pistas escorregadias, dirija com atenção.' : 'Boas condições de tráfego.'}`);
    const crimes = jogo.crime.historico.filter((c) => c.inicioDia === jogo.tempo.diaAbsoluto - 1);
    if (crimes.length) {
      this.registrar('policia', `${crimes.length} ocorrências registradas ontem. ${crimes.filter((c) => c.resultado === 'prisao').length} terminaram em prisão.`);
    }
    const fechadas = jogo.empresas.lista.filter((e) => e.status === 'fechada').length;
    this.registrar('negocios', `${jogo.empresas.lista.length - fechadas} empresas ativas na região metropolitana. ${fechadas} pontos comerciais vazios aguardam novos donos.`);
    if (jogo.memoriaMundo.famaJogador > 0.35) {
      this.registrar('urbano', `${jogo.jogador.nome} segue entre os nomes comentados na cidade.`);
    }
    jogo.empresas.reabrirVazias();
  }

  // Publicidade dos telões: empresas compram espaço
  atualizarAnuncios() {
    const jogo = this.jogo;
    const ativos = jogo.empresas.lista.filter((e) => e.status === 'ativa');
    this.anuncios = [];
    for (let i = 0; i < 14; i++) {
      const e = escolher(jogo.rng, ativos);
      if (!e) break;
      this.anuncios.push({ texto: `${e.nome.toUpperCase()} • ${e.tipo}`, cor: Math.floor(jogo.rng() * 0xffffff), empresaId: e.id });
    }
    const manchete = this.manchetes[0];
    if (manchete) this.anuncios.push({ texto: `AO VIVO • ${manchete.titulo.slice(0, 48)}`, cor: 0xff3344 });
  }
}
