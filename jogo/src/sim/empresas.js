// =====================================================================
// EMPRESAS AUTÔNOMAS — abrem, vendem, contratam, demitem, expandem, falem
// =====================================================================
import { clamp, faixa, chance, escolher, inteiro, nomeEmpresa } from '../util/nucleo.js';

export const NEGOCIOS = {
  loja:           { nome: 'Loja', setor: 'varejo', ticket: [45, 260], func: [2, 8], abre: 9, fecha: 20, cargos: ['Vendedor', 'Gerente de Loja', 'Estoquista', 'Segurança'] },
  restaurante:    { nome: 'Restaurante', setor: 'alimento', ticket: [38, 320], func: [4, 16], abre: 11, fecha: 23.5, cargos: ['Garçom', 'Cozinheiro', 'Chef', 'Maître', 'Auxiliar de Cozinha', 'Gerente'] },
  cafe:           { nome: 'Café', setor: 'alimento', ticket: [12, 60], func: [2, 6], abre: 6.5, fecha: 20, cargos: ['Barista', 'Atendente', 'Gerente'] },
  supermercado:   { nome: 'Supermercado', setor: 'alimento', ticket: [60, 480], func: [10, 48], abre: 7, fecha: 22.5, cargos: ['Operador de Caixa', 'Repositor', 'Açougueiro', 'Padeiro', 'Gerente', 'Segurança', 'Estoquista', 'Fiscal de Loja'] },
  hotel:          { nome: 'Hotel', setor: 'hospedagem', ticket: [180, 1900], func: [8, 44], abre: 0, fecha: 24, cargos: ['Recepcionista', 'Camareira', 'Mensageiro', 'Gerente', 'Segurança', 'Cozinheiro', 'Manobrista'] },
  banco:          { nome: 'Agência Bancária', setor: 'servicos', ticket: [0, 0], func: [6, 22], abre: 10, fecha: 16, cargos: ['Caixa', 'Gerente de Contas', 'Analista', 'Segurança', 'Diretor de Agência'] },
  hospital:       { nome: 'Hospital', setor: 'saude', ticket: [120, 4200], func: [20, 90], abre: 0, fecha: 24, cargos: ['Médico', 'Enfermeiro', 'Técnico de Enfermagem', 'Recepcionista', 'Paramédico', 'Cirurgião', 'Farmacêutico'] },
  escola:         { nome: 'Escola', setor: 'servicos', ticket: [0, 0], func: [8, 40], abre: 7, fecha: 18, cargos: ['Professor', 'Coordenador', 'Inspetor', 'Secretário Escolar', 'Merendeiro'] },
  universidade:   { nome: 'Universidade', setor: 'servicos', ticket: [0, 0], func: [20, 80], abre: 7, fecha: 23, cargos: ['Professor Universitário', 'Pesquisador', 'Técnico de Laboratório', 'Secretário Acadêmico'] },
  oficina:        { nome: 'Oficina', setor: 'servicos', ticket: [120, 2400], func: [2, 10], abre: 8, fecha: 18, cargos: ['Mecânico', 'Funileiro', 'Eletricista Automotivo', 'Atendente'] },
  concessionaria: { nome: 'Concessionária', setor: 'varejo', ticket: [18000, 220000], func: [4, 16], abre: 9, fecha: 19, cargos: ['Vendedor de Veículos', 'Gerente Comercial', 'Avaliador', 'Mecânico'] },
  posto:          { nome: 'Posto de Combustível', setor: 'combustivel', ticket: [80, 420], func: [3, 10], abre: 0, fecha: 24, cargos: ['Frentista', 'Atendente de Conveniência', 'Gerente', 'Lavador'] },
  fabrica:        { nome: 'Fábrica', setor: 'industria', ticket: [2000, 48000], func: [15, 120], abre: 6, fecha: 22, cargos: ['Operador de Máquina', 'Supervisor de Produção', 'Engenheiro', 'Técnico de Manutenção', 'Almoxarife'] },
  logistica:      { nome: 'Transportadora', setor: 'logistica', ticket: [400, 9000], func: [8, 60], abre: 0, fecha: 24, cargos: ['Caminhoneiro', 'Entregador', 'Conferente', 'Analista de Logística', 'Operador de Empilhadeira'] },
  escritorio:     { nome: 'Escritório', setor: 'tecnologia', ticket: [900, 42000], func: [6, 90], abre: 8, fecha: 19, cargos: ['Programador', 'Analista', 'Contador', 'Advogado', 'Arquiteto', 'Engenheiro', 'Designer', 'Gerente de Projetos', 'Diretor', 'Recepcionista', 'Corretor de Imóveis', 'Jornalista'] },
  fazenda:        { nome: 'Fazenda', setor: 'alimento', ticket: [600, 9000], func: [3, 24], abre: 5, fecha: 19, cargos: ['Agricultor', 'Tratorista', 'Veterinário', 'Capataz'] },
};

let seq = 1;

export class Empresas {
  constructor(jogo) {
    this.jogo = jogo;
    this.lista = [];
    this.porLote = new Map();
    this.vagasAbertas = [];
  }

  criarDoMundo(mundo) {
    const rng = this.jogo.rng;
    for (const lote of mundo.lotes) {
      const t = (mundo.TIPOS || TIPOS_REF)[lote.tipo];
      const chaveNeg = t && t.neg;
      if (!chaveNeg || !NEGOCIOS[chaveNeg]) continue;
      this.criar(chaveNeg, lote, null);
    }
    this.reindexarVagas();
  }

  criar(chave, lote, donoId, capitalInicial) {
    const rng = this.jogo.rng;
    const def = NEGOCIOS[chave];
    const porte = clamp((lote.m2 || 400) / 900, 0.25, 6);
    const conta = this.jogo.banco.abrirConta(lote.nome, 'empresa', capitalInicial ?? faixa(rng, 8000, 90000) * porte);
    const e = {
      id: seq++, chave, tipo: def.nome, setor: def.setor, loteId: lote.id, nome: lote.nome,
      x: lote.x, z: lote.z, distrito: lote.distrito, contaId: conta.id, donoId: donoId || null,
      porte, status: 'ativa',
      preco: this.jogo.economia.preco(def.setor) * faixa(rng, 0.85, 1.3),
      margemAlvo: faixa(rng, 0.18, 0.46),
      estoque: Math.round(faixa(rng, 60, 400) * porte),
      estoqueMax: Math.round(faixa(rng, 200, 900) * porte),
      funcionarios: [], vagas: 0, salarioBase: 0,
      reputacao: faixa(rng, 0.35, 0.85),
      clientesHoje: 0, clientesOntem: 0, receitaHoje: 0, despesaHoje: 0,
      lucroOntem: 0, historico: [], diasPrejuizo: 0, filiais: 0,
      abre: def.abre, fecha: def.fecha,
      cargos: def.cargos, ticket: def.ticket,
      publicidade: 0, fornecedorId: null, clientesDentro: 0,
    };
    const alvoFunc = Math.round(clamp(faixa(rng, def.func[0], def.func[1]) * clamp(porte, 0.4, 2.2), def.func[0], def.func[1] * 2));
    e.alvoFuncionarios = alvoFunc;
    e.vagas = alvoFunc;
    e.salarioBase = salarioDoSetor(def.setor) * faixa(rng, 0.85, 1.3);
    lote.negocioId = e.id;
    this.lista.push(e);
    this.porLote.set(lote.id, e);
    return e;
  }

  porId(id) { return this.lista.find((e) => e.id === id); }
  doLote(loteId) { return this.porLote.get(loteId); }

  abertaAgora(e) {
    const h = this.jogo.tempo.hora;
    if (e.status !== 'ativa') return false;
    if (e.abre === 0 && e.fecha === 24) return true;
    if (this.jogo.tempo.fimDeSemana && (e.chave === 'escritorio' || e.chave === 'banco' || e.chave === 'escola')) return false;
    return h >= e.abre && h <= e.fecha;
  }

  // Uma compra: usado por NPCs e pelo jogador --------------------------
  comprar(e, clienteConta, qtd = 1, fatorTicket = 1) {
    if (e.status !== 'ativa') return { ok: false, erro: 'Fechado' };
    if (e.estoque <= 0 && e.setor !== 'servicos' && e.setor !== 'saude') return { ok: false, erro: 'Sem estoque' };
    const valor = Math.max(1, e.preco * qtd * fatorTicket * (0.8 + e.reputacao * 0.4));
    if (clienteConta) {
      const pago = this.jogo.banco.lancar(clienteConta.id, -valor, `Compra em ${e.nome}`, 'consumo');
      if (!pago) return { ok: false, erro: 'Pagamento recusado' };
    }
    this.jogo.banco.lancar(e.contaId, valor, `Venda (${qtd})`, 'receita');
    e.estoque = Math.max(0, e.estoque - qtd);
    e.clientesHoje++; e.receitaHoje += valor;
    this.jogo.economia.registrarDemanda(e.setor, qtd);
    return { ok: true, valor };
  }

  contratar(e, agente, cargo) {
    if (e.funcionarios.length >= e.alvoFuncionarios + e.filiais * 6) return false;
    const salario = e.salarioBase * fatorCargo(cargo) * faixa(this.jogo.rng, 0.9, 1.15);
    agente.empregoId = e.id;
    agente.cargo = cargo;
    agente.salario = salario;
    agente.trabalhoLote = e.loteId;
    agente.turno = sorteiaTurno(this.jogo.rng, e);
    e.funcionarios.push(agente.id);
    e.vagas = Math.max(0, e.alvoFuncionarios - e.funcionarios.length);
    this.jogo.agentes.desempregados.delete(agente.id);
    return true;
  }

  demitir(e, agenteId, motivo = 'corte de custos') {
    const i = e.funcionarios.indexOf(agenteId);
    if (i < 0) return;
    e.funcionarios.splice(i, 1);
    const a = this.jogo.agentes.porId(agenteId);
    if (a) {
      a.empregoId = null; a.cargo = null; a.salario = 0; a.trabalhoLote = null;
      a.memoria.push({ dia: this.jogo.tempo.diaAbsoluto, texto: `Fui demitido de ${e.nome} (${motivo})`, peso: 0.8 });
      this.jogo.agentes.desempregados.add(a.id);
    }
    e.vagas = Math.max(0, e.alvoFuncionarios - e.funcionarios.length);
  }

  reindexarVagas() {
    this.vagasAbertas = this.lista.filter((e) => e.status === 'ativa' && e.vagas > 0);
  }

  // ------------------------------------------------------------------
  passoDiario() {
    const rng = this.jogo.rng;
    const eco = this.jogo.economia;
    for (const e of this.lista) {
      if (e.status !== 'ativa') continue;
      const conta = this.jogo.banco.obter(e.contaId);
      const def = NEGOCIOS[e.chave];

      // 1. Folha de pagamento
      let folha = 0;
      for (const fid of [...e.funcionarios]) {
        const a = this.jogo.agentes.porId(fid);
        if (!a) { this.demitir(e, fid, 'funcionário ausente'); continue; }
        folha += a.salario / 30;
        const contaA = this.jogo.banco.obter(a.contaId);
        if (conta.saldo + conta.limite > a.salario / 30) {
          this.jogo.banco.transferir(e.contaId, a.contaId, a.salario / 30, 'Salário diário');
          a.dinheiroBanco = contaA.saldo;
        } else {
          a.moralTrabalho = clamp((a.moralTrabalho ?? 0.7) - 0.25, 0, 1);
          if (a.moralTrabalho <= 0.1 && chance(rng, 0.5)) this.demitir(e, fid, 'empresa sem caixa');
        }
      }

      // 2. Reposição de estoque junto a fornecedor
      if (e.estoque < e.estoqueMax * 0.5 && e.setor !== 'servicos') {
        const falta = e.estoqueMax - e.estoque;
        const custoUnit = eco.preco(e.setor) * 0.55 * (1 + (this.jogo.transito?.atrasoMedio || 0) * 0.08);
        const podeComprar = Math.min(falta, Math.max(0, Math.floor((conta.saldo + conta.limite * 0.5) / Math.max(1, custoUnit))));
        if (podeComprar > 0) {
          this.jogo.banco.lancar(e.contaId, -podeComprar * custoUnit, `Reposição de estoque (${podeComprar})`, 'insumo');
          e.estoque += podeComprar;
          eco.registrarOferta(e.setor, podeComprar * 0.6);
        } else if (e.estoque <= 0) {
          e.diasPrejuizo += 0.5;
        }
      }

      // 3. Despesas fixas (aluguel, energia, impostos)
      const fixas = 40 * e.porte + e.funcionarios.length * 12 + e.publicidade;
      this.jogo.banco.lancar(e.contaId, -fixas, 'Despesas operacionais', 'despesa');
      const impostos = e.receitaHoje * 0.17;
      if (impostos > 0) this.jogo.banco.lancar(e.contaId, -impostos, 'Impostos', 'imposto');

      // 4. Resultado
      const lucro = e.receitaHoje - folha - fixas - impostos;
      e.lucroOntem = lucro;
      e.clientesOntem = e.clientesHoje;
      e.historico.push({ dia: this.jogo.tempo.diaAbsoluto, receita: e.receitaHoje, lucro, clientes: e.clientesHoje });
      if (e.historico.length > 90) e.historico.shift();
      e.receitaHoje = 0; e.despesaHoje = 0; e.clientesHoje = 0;

      // 5. Decisões autônomas
      if (lucro < 0) e.diasPrejuizo++; else e.diasPrejuizo = Math.max(0, e.diasPrejuizo - 1);
      const precoMercado = eco.preco(e.setor);
      if (lucro < 0 && e.clientesOntem > 0) e.preco *= 1.02;
      else if (e.clientesOntem < 3) e.preco *= 0.97;
      else if (lucro > 0 && chance(rng, 0.3)) e.preco *= 1.005;
      e.preco = clamp(e.preco, precoMercado * 0.5, precoMercado * 2.2);

      e.reputacao = clamp(e.reputacao + (e.estoque > 0 ? 0.004 : -0.02) + (e.funcionarios.length >= e.alvoFuncionarios * 0.6 ? 0.004 : -0.01) + faixa(rng, -0.01, 0.01), 0.05, 1);

      // Contratações / demissões
      e.vagas = Math.max(0, Math.round(e.alvoFuncionarios * clamp(0.6 + e.reputacao * 0.8, 0.4, 1.5)) - e.funcionarios.length);
      if (e.diasPrejuizo > 6 && e.funcionarios.length > def.func[0]) {
        this.demitir(e, e.funcionarios[e.funcionarios.length - 1], 'redução de quadro');
        e.vagas = 0;
      }
      // Expansão
      if (conta.saldo > 260000 * e.porte && e.diasPrejuizo === 0 && chance(rng, 0.04)) {
        e.filiais++; e.alvoFuncionarios += inteiro(rng, 2, 8);
        this.jogo.banco.lancar(e.contaId, -180000 * e.porte, 'Abertura de filial', 'investimento');
        this.jogo.noticias?.registrar('economia', `${e.nome} inaugura nova filial e abre vagas em ${e.distrito}.`);
      }
      // Falência
      if (conta.saldo < -conta.limite * 0.95 && e.diasPrejuizo > 10) this.falir(e);
    }

    this.reindexarVagas();
  }

  falir(e) {
    e.status = 'fechada';
    for (const fid of [...e.funcionarios]) this.demitir(e, fid, 'falência');
    const lote = this.jogo.mundo.lotes[e.loteId];
    if (lote) lote.fechado = true;
    this.jogo.noticias?.registrar('economia', `${e.nome} encerrou as atividades após meses de prejuízo. ${e.funcionarios.length} pessoas buscam recolocação.`);
    this.jogo.barramento.emitir('empresa-fechou', { empresa: e });
    this.jogo.memoriaMundo?.registrar(`${e.nome} fechou as portas`, e.x, e.z, 0.7);
  }

  reabrirVazias() {
    // Novos empreendedores ocupam pontos fechados quando a confiança está alta
    const rng = this.jogo.rng;
    const eco = this.jogo.economia;
    const fechadas = this.lista.filter((e) => e.status === 'fechada');
    for (const e of fechadas) {
      if (!chance(rng, 0.02 + eco.confianca * 0.06)) continue;
      const lote = this.jogo.mundo.lotes[e.loteId];
      e.status = 'ativa'; e.diasPrejuizo = 0;
      e.nome = nomeEmpresa(rng, NEGOCIOS[e.chave].nome);
      e.reputacao = 0.5; e.estoque = Math.round(e.estoqueMax * 0.6);
      e.preco = eco.preco(e.setor);
      this.jogo.banco.lancar(e.contaId, 40000 * e.porte, 'Capital de novo proprietário', 'investimento');
      if (lote) { lote.fechado = false; lote.nome = e.nome; }
      this.jogo.noticias?.registrar('economia', `Novo negócio abre as portas: ${e.nome} (${e.tipo}) em ${e.distrito}.`);
    }
  }
}

export function salarioDoSetor(setor) {
  return {
    alimento: 2200, varejo: 2400, servicos: 3800, industria: 3400, construcao: 3100,
    tecnologia: 7200, logistica: 3300, hospedagem: 2600, saude: 7800, combustivel: 2300,
  }[setor] || 2600;
}

export function fatorCargo(cargo) {
  const c = (cargo || '').toLowerCase();
  if (/diretor|chef|cirurgi/.test(c)) return 3.4;
  if (/gerente|coordenador|supervisor|maître|capataz/.test(c)) return 2.1;
  if (/médico|advogado|engenheiro|arquiteto|programador|pesquisador|professor universit/.test(c)) return 2.6;
  if (/analista|contador|designer|enfermeiro|mecânico|professor|jornalista|corretor/.test(c)) return 1.5;
  return 1.0;
}

function sorteiaTurno(rng, e) {
  if (e.abre === 0 && e.fecha === 24) {
    const r = rng();
    if (r < 0.45) return { inicio: 6, fim: 14 };
    if (r < 0.8) return { inicio: 14, fim: 22 };
    return { inicio: 22, fim: 6 };
  }
  const dur = Math.min(9, Math.max(6, e.fecha - e.abre));
  const inicio = e.abre + (chance(rng, 0.4) ? Math.max(0, (e.fecha - e.abre) - dur) : 0);
  return { inicio, fim: (inicio + dur) % 24 };
}

// Referência tardia a TIPOS para evitar ciclo de import
import { TIPOS as TIPOS_REF } from '../mundo/gerador.js';
