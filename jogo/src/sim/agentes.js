// =====================================================================
// AGENTES AUTÔNOMOS — cada NPC tem identidade, rotina, necessidades,
// memória, relacionamentos, objetivos e LOD de simulação.
// =====================================================================
import { clamp, faixa, chance, escolher, inteiro, nomeAleatorio, dist, pesoEscolher } from '../util/nucleo.js';
import { fatorCargo, salarioDoSetor, NEGOCIOS } from './empresas.js';

export const PROFISSOES_LIVRES = [
  'Taxista', 'Motorista de Aplicativo', 'Caminhoneiro', 'Entregador', 'Policial', 'Bombeiro', 'Paramédico',
  'Médico', 'Enfermeiro', 'Advogado', 'Juiz', 'Promotor', 'Jornalista', 'Professor', 'Engenheiro', 'Arquiteto',
  'Programador', 'Empresário', 'Corretor de Imóveis', 'Vendedor', 'Gerente', 'Cozinheiro', 'Garçom', 'Mecânico',
  'Eletricista', 'Encanador', 'Agricultor', 'Pedreiro', 'Pintor', 'Segurança', 'Porteiro', 'Zelador',
  'Operador de Caixa', 'Repositor', 'Camareira', 'Recepcionista', 'Fotógrafo', 'Músico', 'Artista Plástico',
  'Pesquisador', 'Piloto', 'Comissário de Bordo', 'Funcionário Público', 'Carteiro', 'Barbeiro', 'Cabeleireiro',
  'Costureira', 'Marceneiro', 'Soldador', 'Tratorista', 'Veterinário', 'Dentista', 'Psicólogo', 'Fisioterapeuta',
  'Contador', 'Economista', 'Analista de Dados', 'Designer', 'Publicitário', 'Locutor', 'Motoboy', 'Guincheiro',
  'Salva-vidas', 'Guia de Turismo', 'Chef de Cozinha', 'Confeiteiro', 'Padeiro', 'Açougueiro', 'Pescador',
  'Lenhador', 'Jardineiro', 'Garí', 'Motorista de Ônibus', 'Maquinista', 'Estivador', 'Eletricista Industrial',
  'Técnico de Informática', 'Social Media', 'Investidor', 'Aposentado', 'Estudante', 'Autônomo', 'Desempregado',
];

export const ESTADOS = ['dormindo', 'em-casa', 'indo-trabalho', 'trabalhando', 'almocando', 'comprando',
  'lazer', 'estudando', 'visitando', 'viajando', 'hospital', 'preso', 'fugindo', 'abrigado'];

let seq = 1;

export class Agentes {
  constructor(jogo) {
    this.jogo = jogo;
    this.lista = [];
    this.porIdMap = new Map();
    this.desempregados = new Set();
    this.fatia = 0;
    this.fatias = 8;
    this.proximos = [];        // agentes em LOD alto (perto do jogador)
    this.estatisticas = { trabalhando: 0, dormindo: 0, rua: 0, comprando: 0, presos: 0 };
  }

  porId(id) { return this.porIdMap.get(id); }

  popular(quantidade = 5200) {
    const rng = this.jogo.rng;
    const mundo = this.jogo.mundo;
    const residenciais = mundo.lotes.filter((l) => ['casa', 'mansao', 'predio'].includes(l.tipo));
    if (!residenciais.length) return;

    for (let i = 0; i < quantidade; i++) {
      const casa = escolher(rng, residenciais);
      const a = this.criar(casa);
      this.lista.push(a);
      this.porIdMap.set(a.id, a);
      casa.residentes.push(a.id);
    }

    // Emprego inicial: distribui agentes nas vagas das empresas
    const empresas = this.jogo.empresas.lista.filter((e) => e.status === 'ativa');
    let idx = 0;
    for (const e of empresas) {
      const alvo = Math.round(e.alvoFuncionarios * faixa(rng, 0.6, 1));
      for (let k = 0; k < alvo && idx < this.lista.length; k++) {
        const a = this.lista[idx++];
        if (a.idade < 18 || a.idade > 68) continue;
        this.jogo.empresas.contratar(e, a, escolher(rng, e.cargos));
      }
    }
    for (const a of this.lista) {
      if (!a.empregoId) {
        if (a.idade < 18) { a.profissao = 'Estudante'; a.estudaEm = this.escolherEscola(a); }
        else if (a.idade > 66) a.profissao = 'Aposentado';
        else if (chance(rng, 0.45)) a.profissao = escolher(rng, PROFISSOES_LIVRES);
        else { a.profissao = 'Desempregado'; this.desempregados.add(a.id); }
      } else {
        a.profissao = a.cargo;
      }
      this.definirRotina(a);
      a.estado = 'em-casa';
      a.x = this.jogo.mundo.lotes[a.casaLote].x; a.z = this.jogo.mundo.lotes[a.casaLote].z;
      a.destino = null;
    }

    // Relacionamentos: família na mesma casa + amigos próximos
    for (const l of residenciais) {
      for (const id of l.residentes) for (const outro of l.residentes) {
        if (id === outro) continue;
        const a = this.porId(id); if (!a) continue;
        a.relacionamentos.set(outro, { tipo: 'família', afeto: faixa(rng, 0.55, 0.95) });
      }
    }
    for (const a of this.lista) {
      const n = inteiro(rng, 1, 5);
      for (let k = 0; k < n; k++) {
        const o = escolher(rng, this.lista);
        if (o.id === a.id) continue;
        a.relacionamentos.set(o.id, { tipo: chance(rng, 0.25) ? 'colega' : 'amigo', afeto: faixa(rng, 0.2, 0.8) });
      }
    }
  }

  criar(casa) {
    const rng = this.jogo.rng;
    const { nome, genero } = nomeAleatorio(rng);
    const idade = pesoEscolher(rng, [[inteiro(rng, 6, 17), 18], [inteiro(rng, 18, 29), 24],
      [inteiro(rng, 30, 45), 26], [inteiro(rng, 46, 64), 20], [inteiro(rng, 65, 88), 12]]);
    const conta = this.jogo.banco.abrirConta(nome, 'pessoal', faixa(rng, 150, 32000));
    const a = {
      id: seq++, nome, genero, idade,
      casaLote: casa.id, trabalhoLote: null, empregoId: null, cargo: null, profissao: 'Desempregado',
      salario: 0, contaId: conta.id, carteira: faixa(rng, 20, 600),
      personalidade: {
        sociabilidade: rng(), risco: Math.pow(rng(), 2.2), honestidade: clamp(0.5 + rng() * 0.6, 0, 1),
        ambicao: rng(), disciplina: rng(), empatia: rng(),
      },
      necessidades: { fome: faixa(rng, 0.1, 0.6), energia: faixa(rng, 0.4, 1), social: faixa(rng, 0.3, 0.9), diversao: faixa(rng, 0.2, 0.8), higiene: faixa(rng, 0.5, 1) },
      saude: faixa(rng, 0.7, 1), humor: faixa(rng, 0.35, 0.9), moralTrabalho: faixa(rng, 0.5, 1),
      estado: 'em-casa', destino: null, destinoLote: null, chegada: 0, saida: 0,
      x: casa.x, z: casa.z, ox: casa.x, oz: casa.z, dx: casa.x, dz: casa.z,
      lod: 2, veiculo: null, rotina: null, estudaEm: null,
      memoria: [], relacionamentos: new Map(), objetivos: [],
      notoriedade: 0, procurado: false, fichaCriminal: [], diasPreso: 0,
      conhecePersonagem: false, ultimoEvento: '', velocidade: faixa(rng, 1.1, 1.75),
    };
    conta.rendaEstimada = 1200;
    // Objetivos de vida
    const possiveis = ['comprar casa própria', 'subir de cargo', 'abrir um negócio', 'juntar reserva financeira',
      'formar-se', 'comprar um carro', 'viajar para a praia', 'constituir família', 'mudar de carreira'];
    const nObj = inteiro(rng, 1, 3);
    for (let i = 0; i < nObj; i++) a.objetivos.push({ texto: escolher(rng, possiveis), progresso: rng() * 0.5 });
    return a;
  }

  escolherEscola(a) {
    const mundo = this.jogo.mundo;
    const escolas = (mundo.indicePorTipo.get(a.idade > 17 ? 'universidade' : 'escola') || mundo.indicePorTipo.get('escola') || []);
    if (!escolas.length) return null;
    let melhor = null, md = 1e18;
    const casa = mundo.lotes[a.casaLote];
    for (const id of escolas) {
      const l = mundo.lotes[id];
      const d = dist(casa.x, casa.z, l.x, l.z);
      if (d < md) { md = d; melhor = id; }
    }
    return melhor;
  }

  definirRotina(a) {
    const rng = this.jogo.rng;
    const emp = a.empregoId ? this.jogo.empresas.porId(a.empregoId) : null;
    let acorda, dorme;
    if (emp && a.turno) {
      acorda = ((a.turno.inicio - faixa(rng, 1, 1.8)) + 24) % 24;
      dorme = ((acorda - faixa(rng, 7, 8.5)) + 24) % 24;
    } else {
      acorda = faixa(rng, 6.5, 9.5);
      dorme = ((acorda - faixa(rng, 7, 9)) + 24) % 24;
    }
    a.rotina = { acorda, dorme, almoco: faixa(rng, 11.6, 14), lazer: faixa(rng, 18.5, 22) };
  }

  // ------------------------------------------------------------------
  // Loop de simulação com LOD
  // ------------------------------------------------------------------
  atualizar(dt, horaJogo) {
    const jogo = this.jogo;
    const px = jogo.jogador.x, pz = jogo.jogador.z;
    const n = this.lista.length;
    if (!n) return;
    const porFatia = Math.ceil(n / this.fatias);
    const inicio = this.fatia * porFatia;
    const fim = Math.min(n, inicio + porFatia);
    this.fatia = (this.fatia + 1) % this.fatias;

    const dtFatia = dt * this.fatias; // cada agente é avaliado 1x a cada N frames
    const est = { trabalhando: 0, dormindo: 0, rua: 0, comprando: 0, presos: 0 };

    for (let i = inicio; i < fim; i++) {
      const a = this.lista[i];
      const d2 = (a.x - px) ** 2 + (a.z - pz) ** 2;
      a.lod = d2 < 180 * 180 ? 0 : d2 < 700 * 700 ? 1 : 2;
      this.passoAgente(a, dtFatia, horaJogo);
    }
    // Estatísticas amostradas
    for (let i = inicio; i < fim; i++) {
      const a = this.lista[i];
      if (a.estado === 'trabalhando') est.trabalhando++;
      else if (a.estado === 'dormindo') est.dormindo++;
      else if (a.estado === 'preso') est.presos++;
      else if (a.estado === 'comprando') est.comprando++;
      else est.rua++;
    }
    const k = this.fatias;
    this.estatisticas = {
      trabalhando: est.trabalhando * k, dormindo: est.dormindo * k, rua: est.rua * k,
      comprando: est.comprando * k, presos: est.presos * k,
    };

    // LOD alto: movimento contínuo de quem está perto do jogador
    this.proximos.length = 0;
    const raio = 260;
    for (let i = 0; i < n; i++) {
      const a = this.lista[i];
      if (Math.abs(a.x - px) > raio || Math.abs(a.z - pz) > raio) continue;
      this.proximos.push(a);
      if (this.proximos.length > 420) break;
    }
  }

  passoAgente(a, dt, hora) {
    const jogo = this.jogo;
    const tempo = jogo.tempo;
    const horasDt = (dt * tempo.escala) / 3600;
    const nec = a.necessidades;

    if (a.estado === 'preso') {
      a.diasPreso -= horasDt / 24;
      if (a.diasPreso <= 0) {
        a.estado = 'em-casa'; a.procurado = false;
        const casa = jogo.mundo.lotes[a.casaLote];
        a.x = casa.x; a.z = casa.z;
        a.memoria.push({ dia: tempo.diaAbsoluto, texto: 'Fui solto e preciso recomeçar', peso: 1 });
      }
      return;
    }

    // Necessidades
    nec.fome = clamp(nec.fome + horasDt * 0.075, 0, 1.4);
    nec.energia = clamp(nec.energia - horasDt * (a.estado === 'dormindo' ? -0.14 : 0.038), 0, 1);
    nec.social = clamp(nec.social - horasDt * 0.02, 0, 1);
    nec.diversao = clamp(nec.diversao - horasDt * 0.025, 0, 1);
    nec.higiene = clamp(nec.higiene - horasDt * 0.02, 0, 1);
    a.humor = clamp(a.humor + (nec.fome > 1 ? -0.02 : 0.004) * horasDt * 4 + (a.estado === 'lazer' ? 0.02 : 0), 0, 1);

    // Em viagem: avança posição
    if (a.estado === 'viajando') {
      a.prog = clamp((a.prog || 0) + dt * tempo.escala / Math.max(1, a.duracaoViagem), 0, 1);
      // leve curva para parecer que segue ruas
      const t = a.prog;
      const cx = a.ox + (a.dx - a.ox) * t;
      const cz = a.oz + (a.dz - a.oz) * t;
      if (a.lod === 0 && a.rota && a.rota.length > 1) {
        const f = t * (a.rota.length - 1);
        const i0 = Math.floor(f), i1 = Math.min(a.rota.length - 1, i0 + 1);
        const n0 = jogo.mundo.nos[a.rota[i0]], n1 = jogo.mundo.nos[a.rota[i1]];
        const tt = f - i0;
        a.x = n0.x + (n1.x - n0.x) * tt + a.desvio;
        a.z = n0.z + (n1.z - n0.z) * tt + a.desvio2;
      } else { a.x = cx; a.z = cz; }
      if (a.prog >= 1) this.chegou(a);
      return;
    }

    // Atividade com duração
    if (a.fimAtividade && tempo.diaAbsoluto + tempo.hora / 24 < a.fimAtividade) {
      if (a.estado === 'trabalhando') this.produzir(a, horasDt);
      return;
    }
    this.decidir(a, hora);
  }

  produzir(a, horasDt) {
    const e = a.empregoId ? this.jogo.empresas.porId(a.empregoId) : null;
    if (!e || e.status !== 'ativa') { a.fimAtividade = 0; return; }
    const prod = horasDt * (0.6 + a.moralTrabalho * 0.5) * (1 - (this.jogo.transito?.atrasoMedio || 0) * 0.1);
    if (e.setor === 'industria' || e.setor === 'alimento' || e.setor === 'logistica') {
      e.estoque = Math.min(e.estoqueMax * 1.4, e.estoque + prod * 3);
      this.jogo.economia.registrarOferta(e.setor, prod * 2);
    } else {
      this.jogo.economia.registrarOferta(e.setor, prod);
    }
  }

  // ------------------------------------------------------------------
  decidir(a, hora) {
    const jogo = this.jogo, tempo = jogo.tempo, rng = jogo.rng;
    const nec = a.necessidades;
    const emp = a.empregoId ? jogo.empresas.porId(a.empregoId) : null;
    const clima = tempo.infoInterp();
    const agora = tempo.diaAbsoluto + tempo.hora / 24;

    // 1. Dormir
    const horaDormir = a.rotina.dorme, horaAcorda = a.rotina.acorda;
    const dormindoAgora = horaDormir < horaAcorda
      ? (hora >= horaDormir && hora < horaAcorda)
      : (hora >= horaDormir || hora < horaAcorda);
    if ((nec.energia < 0.18 || dormindoAgora) && a.estado !== 'dormindo') {
      if (a.loteAtual !== a.casaLote) return this.viajar(a, a.casaLote, 'dormindo');
      a.estado = 'dormindo'; a.fimAtividade = agora + 0.26; nec.higiene = clamp(nec.higiene + 0.3, 0, 1);
      return;
    }
    if (a.estado === 'dormindo' && !dormindoAgora && nec.energia > 0.55) { a.estado = 'em-casa'; a.fimAtividade = 0; }
    if (a.estado === 'dormindo') { a.fimAtividade = agora + 0.1; return; }

    // 2. Trabalho / escola
    if (emp && emp.status === 'ativa' && this.noTurno(a, hora) && jogo.empresas.abertaAgora(emp)) {
      if (a.loteAtual !== a.trabalhoLote) return this.viajar(a, a.trabalhoLote, 'trabalhando');
      a.estado = 'trabalhando'; a.fimAtividade = agora + 0.03;
      return;
    }
    if (a.profissao === 'Estudante' && a.estudaEm !== null && hora > 7.5 && hora < 16.5 && !tempo.fimDeSemana) {
      if (a.loteAtual !== a.estudaEm) return this.viajar(a, a.estudaEm, 'estudando');
      a.estado = 'estudando'; a.fimAtividade = agora + 0.05; return;
    }

    // 3. Fome → restaurante, supermercado ou casa
    if (nec.fome > 0.6) {
      const conta = jogo.banco.obter(a.contaId);
      const podeGastar = (conta?.saldo || 0) + a.carteira;
      const querRestaurante = podeGastar > 300 && (hora > 11 && hora < 22) && chance(rng, 0.35 + (clima.chuva > 0.3 ? 0.15 : 0));
      if (querRestaurante) {
        const alvo = this.negocioProximo(a, ['restaurante', 'cafe']);
        if (alvo) return this.viajar(a, alvo.loteId, 'almocando', alvo.id);
      }
      if (chance(rng, 0.5)) {
        const alvo = this.negocioProximo(a, ['supermercado', 'loja']);
        if (alvo) return this.viajar(a, alvo.loteId, 'comprando', alvo.id);
      }
      if (a.loteAtual !== a.casaLote) return this.viajar(a, a.casaLote, 'em-casa');
      nec.fome = clamp(nec.fome - 0.8, 0, 1.4);
      a.estado = 'em-casa'; a.fimAtividade = agora + 0.03; return;
    }

    // 4. Lazer / social
    if ((nec.diversao < 0.35 || nec.social < 0.3) && hora > 9 && hora < 24) {
      if (clima.chuva > 0.5 && chance(rng, 0.6)) {
        if (a.loteAtual !== a.casaLote) return this.viajar(a, a.casaLote, 'abrigado');
        a.estado = 'abrigado'; a.fimAtividade = agora + 0.08;
        nec.diversao = clamp(nec.diversao + 0.2, 0, 1); return;
      }
      const social = chance(rng, a.personalidade.sociabilidade);
      if (social && a.relacionamentos.size) {
        const amigos = [...a.relacionamentos.keys()];
        const amigo = this.porId(escolher(rng, amigos));
        if (amigo) {
          nec.social = clamp(nec.social + 0.5, 0, 1);
          const r = a.relacionamentos.get(amigo.id); if (r) r.afeto = clamp(r.afeto + 0.03, 0, 1);
          return this.viajar(a, amigo.casaLote, 'visitando');
        }
      }
      const alvo = this.negocioProximo(a, ['restaurante', 'cafe', 'loja', 'hotel']);
      if (alvo) return this.viajar(a, alvo.loteId, 'lazer', alvo.id);
      const parque = escolher(rng, jogo.mundo.parques);
      if (parque) { a.estado = 'lazer'; a.fimAtividade = agora + 0.1; nec.diversao = clamp(nec.diversao + 0.3, 0, 1); }
      return;
    }

    // 5. Procurar emprego
    if (!a.empregoId && a.idade >= 18 && a.idade <= 68 && hora > 8 && hora < 18 && chance(rng, 0.25)) {
      this.procurarEmprego(a);
      a.fimAtividade = agora + 0.2;
      return;
    }

    // 6. Compras ocasionais
    if (chance(rng, 0.08) && hora > 9 && hora < 21) {
      const alvo = this.negocioProximo(a, ['loja', 'supermercado']);
      if (alvo) return this.viajar(a, alvo.loteId, 'comprando', alvo.id);
    }

    // 7. Volta para casa
    if (a.loteAtual !== a.casaLote && chance(rng, 0.5)) return this.viajar(a, a.casaLote, 'em-casa');
    a.estado = a.loteAtual === a.casaLote ? 'em-casa' : 'lazer';
    a.fimAtividade = agora + faixa(rng, 0.03, 0.12);
  }

  noTurno(a, hora) {
    const t = a.turno; if (!t) return false;
    if (t.inicio < t.fim) return hora >= t.inicio && hora < t.fim;
    return hora >= t.inicio || hora < t.fim;
  }

  negocioProximo(a, chaves) {
    const jogo = this.jogo;
    const lotes = jogo.mundo.grade.proximos(a.x, a.z, 420);
    let melhor = null, melhorPontos = -1;
    for (const l of lotes) {
      const e = jogo.empresas.doLote(l.id);
      if (!e || !chaves.includes(e.chave)) continue;
      if (!jogo.empresas.abertaAgora(e)) continue;
      const d = dist(a.x, a.z, l.x, l.z);
      const pontos = e.reputacao * 2 - d / 500 - (e.preco / Math.max(1, jogo.economia.preco(e.setor))) * 0.6;
      if (pontos > melhorPontos) { melhorPontos = pontos; melhor = e; }
    }
    return melhor;
  }

  viajar(a, loteId, estadoDestino, negocioId) {
    const jogo = this.jogo;
    const lote = jogo.mundo.lotes[loteId];
    if (!lote) { a.estado = 'em-casa'; a.fimAtividade = 0; return; }
    const d = dist(a.x, a.z, lote.x, lote.z);
    const clima = jogo.tempo.infoInterp();
    const usaCarro = d > 400 || (d > 150 && chance(jogo.rng, 0.35));
    const vel = usaCarro ? 11 * (1 - clima.chuva * 0.25) : a.velocidade * (1 - clima.chuva * 0.2);
    a.ox = a.x; a.oz = a.z; a.dx = lote.x; a.dz = lote.z;
    a.prog = 0;
    a.duracaoViagem = Math.max(2, d / vel);  // segundos de jogo
    a.estado = 'viajando';
    a.estadoDestino = estadoDestino;
    a.destinoLote = loteId;
    a.negocioAlvo = negocioId || null;
    a.usandoCarro = usaCarro;
    a.desvio = faixa(jogo.rng, -5, 5); a.desvio2 = faixa(jogo.rng, -5, 5);
    a.fimAtividade = 0;
    // Carga nas vias (congestionamento emergente)
    if (usaCarro && jogo.transito) jogo.transito.registrarViagem(a.ox, a.oz, a.dx, a.dz);
    // Rota detalhada só para LOD alto
    if (a.lod === 0) {
      const o = jogo.mundo.noMaisProximo(a.x, a.z);
      a.rota = o && lote.no !== undefined ? [o.id, lote.no] : null;
    } else a.rota = null;
  }

  chegou(a) {
    const jogo = this.jogo, tempo = jogo.tempo, rng = jogo.rng;
    const agora = tempo.diaAbsoluto + tempo.hora / 24;
    a.x = a.dx; a.z = a.dz;
    a.loteAtual = a.destinoLote;
    a.estado = a.estadoDestino || 'em-casa';
    const nec = a.necessidades;
    const e = a.negocioAlvo ? jogo.empresas.porId(a.negocioAlvo) : null;

    switch (a.estado) {
      case 'almocando': {
        if (e) {
          const r = jogo.empresas.comprar(e, jogo.banco.obter(a.contaId), 1, faixa(rng, 0.6, 1.8));
          if (r.ok) { nec.fome = clamp(nec.fome - 1, 0, 1.4); nec.diversao = clamp(nec.diversao + 0.2, 0, 1); a.humor = clamp(a.humor + 0.05, 0, 1); }
        }
        a.fimAtividade = agora + faixa(rng, 0.02, 0.06);
        break;
      }
      case 'comprando': {
        if (e) {
          const r = jogo.empresas.comprar(e, jogo.banco.obter(a.contaId), inteiro(rng, 1, 4), faixa(rng, 0.8, 1.4));
          if (r.ok) nec.fome = clamp(nec.fome - 0.6, 0, 1.4);
        }
        a.fimAtividade = agora + faixa(rng, 0.01, 0.04);
        break;
      }
      case 'lazer': {
        if (e && chance(rng, 0.6)) jogo.empresas.comprar(e, jogo.banco.obter(a.contaId), 1, faixa(rng, 0.4, 1.2));
        nec.diversao = clamp(nec.diversao + 0.4, 0, 1); nec.social = clamp(nec.social + 0.2, 0, 1);
        a.fimAtividade = agora + faixa(rng, 0.04, 0.12);
        break;
      }
      case 'visitando':
        nec.social = clamp(nec.social + 0.5, 0, 1);
        a.fimAtividade = agora + faixa(rng, 0.03, 0.1);
        break;
      case 'trabalhando':
        a.fimAtividade = agora + 0.05;
        break;
      case 'estudando':
        a.fimAtividade = agora + 0.2;
        break;
      case 'dormindo':
        a.fimAtividade = agora + 0.25;
        break;
      default:
        a.fimAtividade = agora + faixa(rng, 0.02, 0.1);
    }
  }

  procurarEmprego(a) {
    const jogo = this.jogo, rng = jogo.rng;
    const vagas = jogo.empresas.vagasAbertas;
    if (!vagas.length) return;
    const casa = jogo.mundo.lotes[a.casaLote];
    let melhor = null, pontuacao = -1e9;
    for (let i = 0; i < 24; i++) {
      const e = escolher(rng, vagas);
      if (!e || e.vagas <= 0) continue;
      const d = dist(casa.x, casa.z, e.x, e.z);
      const cargo = escolher(rng, e.cargos);
      const p = e.salarioBase * fatorCargo(cargo) / 1000 - d / 900 + e.reputacao;
      if (p > pontuacao) { pontuacao = p; melhor = { e, cargo }; }
    }
    if (!melhor) return;
    const sorte = clamp(0.25 + a.personalidade.disciplina * 0.4 + a.personalidade.ambicao * 0.2, 0, 0.92);
    if (chance(rng, sorte)) {
      if (jogo.empresas.contratar(melhor.e, a, melhor.cargo)) {
        a.profissao = melhor.cargo;
        this.definirRotina(a);
        const conta = jogo.banco.obter(a.contaId);
        if (conta) conta.rendaEstimada = a.salario;
        a.memoria.push({ dia: jogo.tempo.diaAbsoluto, texto: `Fui contratado como ${melhor.cargo} em ${melhor.e.nome}`, peso: 0.9 });
        a.humor = clamp(a.humor + 0.2, 0, 1);
        jogo.empresas.reindexarVagas();
      }
    }
  }

  // Passo diário: envelhecimento, contas, metas de vida ----------------
  passoDiario() {
    const jogo = this.jogo, rng = jogo.rng;
    for (const a of this.lista) {
      const conta = jogo.banco.obter(a.contaId);
      if (!conta) continue;
      // Despesas pessoais
      const custoVida = 38 + (jogo.mundo.lotes[a.casaLote]?.valor || 1e5) / 26000;
      jogo.banco.lancar(conta.id, -custoVida * (1 + jogo.economia.inflacaoAnual), 'Custo de vida (moradia, contas)', 'custo-vida');
      if (conta.saldo < -conta.limite * 0.8) {
        a.humor = clamp(a.humor - 0.1, 0, 1);
        if (chance(rng, 0.08 + a.personalidade.risco * 0.2) && !a.empregoId) {
          jogo.crime?.recrutarCandidato(a);
        }
      }
      // Objetivos
      for (const o of a.objetivos) {
        o.progresso = clamp(o.progresso + (a.empregoId ? 0.004 : 0.0005) * (0.5 + a.personalidade.ambicao), 0, 1);
        if (o.progresso >= 1 && !o.concluido) {
          o.concluido = true;
          a.memoria.push({ dia: jogo.tempo.diaAbsoluto, texto: `Consegui: ${o.texto}`, peso: 1 });
          a.humor = clamp(a.humor + 0.25, 0, 1);
        }
      }
      if (a.memoria.length > 24) a.memoria.splice(0, a.memoria.length - 24);
      // Aniversários
      if (chance(rng, 1 / 360)) a.idade++;
      // Procura emprego passivamente
      if (!a.empregoId && a.idade >= 18 && a.idade <= 68) this.desempregados.add(a.id);
      else this.desempregados.delete(a.id);
    }
  }
}
