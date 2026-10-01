// =====================================================================
// JOGADOR — vida, carreira, finanças, imóveis, empresas, veículos
// =====================================================================
import { clamp, faixa, chance, escolher, dinheiro, dist } from './util/nucleo.js';
import { NEGOCIOS, fatorCargo } from './sim/empresas.js';

export class Jogador {
  constructor(jogo, nome = 'Você') {
    this.jogo = jogo;
    this.nome = nome;
    this.x = 0; this.z = 0; this.y = 0; this.ang = 0;
    this.velocidade = 0;
    this.estado = 'livre';            // livre | detido | preso | dirigindo
    this.dentroDe = null;             // lote em que está
    this.veiculoAtual = null;

    this.carteira = 850;
    this.conta = null;
    this.necessidades = { fome: 0.2, energia: 0.9, social: 0.7, diversao: 0.6, higiene: 0.9 };
    this.saude = 1;
    this.notoriedade = 0;
    this.fichaCriminal = [];
    this.servicoComunitario = 0;
    this.advogado = null;

    this.emprego = null;              // { empresaId, cargo, salario, turno }
    this.habilidades = {
      direcao: 0.3, negociacao: 0.25, tecnologia: 0.2, culinaria: 0.15, mecanica: 0.15,
      medicina: 0.05, direito: 0.05, furtividade: 0.1, condicionamento: 0.3, gestao: 0.2,
    };
    this.educacao = { nivel: 'Ensino Médio', creditos: 0, cursando: null };
    this.imoveis = [];
    this.empresas = [];
    this.veiculos = [];
    this.contatos = [];
    this.inventario = [];
    this.horasTrabalhadas = 0;
    this.crimeAtual = null;
    this.diasPreso = 0;
    this.registroVida = [];
  }

  iniciar() {
    this.conta = this.jogo.banco.abrirConta(this.nome, 'pessoal', 3200);
    this.conta.rendaEstimada = 1800;
    const mundo = this.jogo.mundo;
    // Casa inicial alugada: uma casa simples no subúrbio
    const casas = mundo.lotes.filter((l) => l.tipo === 'casa' && (l.distrito === 'suburbio' || l.distrito === 'residencial'));
    this.casa = escolher(this.jogo.rng, casas) || mundo.lotes[0];
    this.casa.doJogador = 'aluguel';
    this.x = this.casa.x + 14; this.z = this.casa.z + 14;
    this.registro(`Você alugou ${this.casa.nome} em ${this.casa.distrito}.`);
    // Carro usado
    this.veiculos.push({ id: 1, nome: 'Compacto usado', tipo: 'carro', valor: 21000, combustivel: 0.4, estado: 0.7, cor: 0x9aa0a6, x: this.casa.x + 8, z: this.casa.z + 10 });
  }

  registro(texto) {
    this.registroVida.unshift({ texto, dia: this.jogo.tempo.diaAbsoluto, hora: this.jogo.tempo.rotulo });
    if (this.registroVida.length > 60) this.registroVida.pop();
  }

  patrimonio() {
    let v = this.carteira + (this.conta ? this.conta.saldo : 0);
    for (const i of this.imoveis) v += this.jogo.mundo.lotes[i].valor * this.jogo.economia.indiceImoveis;
    for (const e of this.empresas) {
      const emp = this.jogo.empresas.porId(e);
      if (emp) v += (this.jogo.banco.obter(emp.contaId)?.saldo || 0) + emp.porte * 120000;
    }
    for (const car of this.veiculos) v += car.valor * car.estado;
    return v;
  }

  perfilCriminal() {
    return {
      habilidade: clamp(this.habilidades.furtividade * 0.5 + this.habilidades.direcao * 0.3 + this.habilidades.negociacao * 0.2
        + (this.crimeAtual?.bonusPlano || 0) * 0.3, 0, 1),
      calma: clamp(this.habilidades.negociacao * 0.6 + 0.2, 0, 1),
    };
  }

  // --- Finanças ------------------------------------------------------
  receberDinheiro(valor, motivo) {
    this.jogo.banco.lancar(this.conta.id, valor, motivo, 'receita');
    this.jogo.ui?.feed(`💰 ${motivo}: ${dinheiro(valor)}`);
  }
  pagar(valor, motivo, emDinheiro = false) {
    if (emDinheiro) {
      if (this.carteira < valor) return false;
      this.carteira -= valor;
      this.jogo.ui?.feed(`💸 ${motivo}: ${dinheiro(valor)} (dinheiro)`);
      return true;
    }
    const ok = this.jogo.banco.lancar(this.conta.id, -valor, motivo, 'despesa');
    if (ok) this.jogo.ui?.feed(`💸 ${motivo}: ${dinheiro(valor)}`);
    return ok;
  }
  sacar(valor) {
    if (!this.jogo.banco.lancar(this.conta.id, -valor, 'Saque em caixa eletrônico', 'saque')) return false;
    this.carteira += valor; return true;
  }
  depositar(valor) {
    if (this.carteira < valor) return false;
    this.carteira -= valor;
    return this.jogo.banco.lancar(this.conta.id, valor, 'Depósito', 'deposito');
  }

  // --- Carreira ------------------------------------------------------
  candidatar(empresaId, cargo) {
    const e = this.jogo.empresas.porId(empresaId);
    if (!e || e.status !== 'ativa') return { ok: false, erro: 'Empresa indisponível' };
    if (e.vagas <= 0) return { ok: false, erro: 'Sem vagas no momento' };
    const exigencia = fatorCargo(cargo);
    const minhaQualificacao = 0.4 + this.habilidades.gestao * 0.3 + this.habilidades.tecnologia * 0.3
      + (this.educacao.nivel === 'Superior' ? 0.5 : this.educacao.nivel === 'Técnico' ? 0.25 : 0)
      + this.habilidades.negociacao * 0.2 - this.notoriedade * 0.3;
    if (minhaQualificacao < exigencia * 0.55) return { ok: false, erro: 'Perfil abaixo do exigido para a vaga' };
    const salario = e.salarioBase * exigencia * faixa(this.jogo.rng, 0.9, 1.1);
    this.emprego = { empresaId: e.id, cargo, salario, turno: { inicio: Math.max(6, e.abre), fim: Math.min(23, e.abre + 8) }, empresa: e };
    e.funcionarios.push('jogador');
    e.vagas = Math.max(0, e.vagas - 1);
    this.conta.rendaEstimada = salario;
    this.registro(`Contratado como ${cargo} em ${e.nome} por ${dinheiro(salario)}/mês.`);
    this.jogo.ui?.feed(`🧾 Contratado: ${cargo} em ${e.nome}`);
    return { ok: true, salario };
  }

  demitirSe() {
    if (!this.emprego) return;
    const e = this.jogo.empresas.porId(this.emprego.empresaId);
    if (e) { const i = e.funcionarios.indexOf('jogador'); if (i >= 0) e.funcionarios.splice(i, 1); e.vagas++; }
    this.registro(`Você pediu demissão de ${this.emprego.cargo}.`);
    this.emprego = null;
  }

  trabalhar(horas = 1) {
    if (!this.emprego) return { ok: false, erro: 'Você não tem emprego' };
    const e = this.jogo.empresas.porId(this.emprego.empresaId);
    if (!e || e.status !== 'ativa') { this.emprego = null; return { ok: false, erro: 'Empresa fechou' }; }
    const valor = (this.emprego.salario / 176) * horas;
    this.jogo.banco.transferir(e.contaId, this.conta.id, valor, 'Salário');
    this.horasTrabalhadas += horas;
    this.necessidades.energia = clamp(this.necessidades.energia - 0.08 * horas, 0, 1);
    this.necessidades.fome = clamp(this.necessidades.fome + 0.07 * horas, 0, 1.5);
    const chaveHab = { 'Programador': 'tecnologia', 'Mecânico': 'mecanica', 'Cozinheiro': 'culinaria',
      'Gerente': 'gestao', 'Vendedor': 'negociacao', 'Médico': 'medicina', 'Advogado': 'direito' }[this.emprego.cargo];
    if (chaveHab) this.habilidades[chaveHab] = clamp(this.habilidades[chaveHab] + 0.004 * horas, 0, 1);
    this.jogo.tempo.hora += horas;
    return { ok: true, valor };
  }

  estudar(curso, horas = 2) {
    const custo = 180 * horas;
    if (!this.pagar(custo, `Curso: ${curso}`)) return { ok: false, erro: 'Saldo insuficiente' };
    this.educacao.creditos += horas;
    this.educacao.cursando = curso;
    const mapa = { 'Tecnologia': 'tecnologia', 'Gestão': 'gestao', 'Direito': 'direito', 'Medicina': 'medicina',
      'Mecânica': 'mecanica', 'Gastronomia': 'culinaria', 'Direção Defensiva': 'direcao' };
    const h = mapa[curso] || 'gestao';
    this.habilidades[h] = clamp(this.habilidades[h] + 0.03 * horas, 0, 1);
    if (this.educacao.creditos > 120) this.educacao.nivel = 'Superior';
    else if (this.educacao.creditos > 40) this.educacao.nivel = 'Técnico';
    this.jogo.tempo.hora += horas;
    return { ok: true };
  }

  // --- Negócios e imóveis ---------------------------------------------
  abrirEmpresa(chave, loteId) {
    const lote = this.jogo.mundo.lotes[loteId];
    const def = NEGOCIOS[chave];
    if (!lote || !def) return { ok: false, erro: 'Local ou tipo inválido' };
    const custo = 60000 + (lote.valor || 0) * 0.3;
    if (!this.pagar(custo, `Abertura de ${def.nome}`)) return { ok: false, erro: `Capital necessário: ${dinheiro(custo)}` };
    const existente = this.jogo.empresas.doLote(loteId);
    if (existente) { existente.donoId = 'jogador'; this.empresas.push(existente.id); return { ok: true, empresa: existente }; }
    const e = this.jogo.empresas.criar(chave, lote, 'jogador', 30000);
    this.empresas.push(e.id);
    this.registro(`Você abriu ${e.nome} (${def.nome}).`);
    this.jogo.noticias.registrar('negocios', `Novo empreendimento: ${e.nome} abre em ${lote.distrito}.`, lote.x, lote.z);
    return { ok: true, empresa: e };
  }

  comprarEmpresa(empresaId) {
    const e = this.jogo.empresas.porId(empresaId);
    if (!e) return { ok: false, erro: 'Empresa não encontrada' };
    const valor = this.valorEmpresa(e);
    if (!this.pagar(valor, `Compra de ${e.nome}`)) return { ok: false, erro: `Necessário ${dinheiro(valor)}` };
    e.donoId = 'jogador';
    this.empresas.push(e.id);
    this.registro(`Você comprou ${e.nome} por ${dinheiro(valor)}.`);
    this.jogo.memoriaMundo.registrar(`${e.nome} mudou de proprietário`, e.x, e.z, 0.5);
    this.jogo.noticias.registrar('negocios', `${e.nome} foi vendida para um novo proprietário.`, e.x, e.z);
    return { ok: true };
  }

  valorEmpresa(e) {
    const lucroMedio = e.historico.length ? e.historico.slice(-14).reduce((a, h) => a + h.lucro, 0) / Math.min(14, e.historico.length) : 0;
    return Math.max(25000, Math.round(lucroMedio * 240 + e.porte * 90000 + (this.jogo.banco.obter(e.contaId)?.saldo || 0) * 0.7));
  }

  venderEmpresa(empresaId) {
    const e = this.jogo.empresas.porId(empresaId);
    if (!e || !this.empresas.includes(empresaId)) return { ok: false, erro: 'Você não é dono' };
    const valor = this.valorEmpresa(e) * 0.9;
    this.receberDinheiro(valor, `Venda de ${e.nome}`);
    e.donoId = null;
    this.empresas = this.empresas.filter((id) => id !== empresaId);
    return { ok: true, valor };
  }

  comprarImovel(loteId) {
    const l = this.jogo.mundo.lotes[loteId];
    if (!l) return { ok: false, erro: 'Imóvel inválido' };
    if (l.doJogador === 'propriedade') return { ok: false, erro: 'Já é seu' };
    const preco = Math.round(l.valor * this.jogo.economia.indiceImoveis);
    if (!this.pagar(preco, `Compra de ${l.nome}`)) return { ok: false, erro: `Necessário ${dinheiro(preco)} (pode financiar no banco)` };
    l.doJogador = 'propriedade';
    this.imoveis.push(loteId);
    this.registro(`Você comprou ${l.nome} por ${dinheiro(preco)}.`);
    return { ok: true, preco };
  }

  venderImovel(loteId) {
    if (!this.imoveis.includes(loteId)) return { ok: false, erro: 'Você não é dono' };
    const l = this.jogo.mundo.lotes[loteId];
    const preco = Math.round(l.valor * this.jogo.economia.indiceImoveis * 0.95);
    this.receberDinheiro(preco, `Venda de ${l.nome}`);
    l.doJogador = null;
    this.imoveis = this.imoveis.filter((i) => i !== loteId);
    return { ok: true, preco };
  }

  alugarPara(loteId) {
    if (!this.imoveis.includes(loteId)) return { ok: false, erro: 'Você não é dono' };
    const l = this.jogo.mundo.lotes[loteId];
    l.alugado = true;
    l.aluguelMensal = Math.round(l.valor * 0.0045 * this.jogo.economia.indiceImoveis);
    return { ok: true, aluguel: l.aluguelMensal };
  }

  // --- Veículos --------------------------------------------------------
  comprarVeiculo(modelo) {
    if (!this.pagar(modelo.preco, `Compra de ${modelo.nome}`)) return { ok: false, erro: 'Saldo insuficiente' };
    const v = { id: this.veiculos.length + 1, nome: modelo.nome, tipo: modelo.tipo, valor: modelo.preco, combustivel: 1, estado: 1, cor: modelo.cor, x: this.x + 6, z: this.z + 6 };
    this.veiculos.push(v);
    this.registro(`Você comprou um ${modelo.nome}.`);
    return { ok: true, veiculo: v };
  }

  abastecer(litros = 40) {
    const v = this.veiculoAtual; if (!v) return { ok: false, erro: 'Sem veículo' };
    const preco = this.jogo.economia.preco('combustivel') * litros;
    if (!this.pagar(preco, 'Abastecimento')) return { ok: false, erro: 'Saldo insuficiente' };
    v.combustivel = clamp(v.combustivel + litros / 50, 0, 1);
    this.jogo.economia.registrarDemanda('combustivel', litros / 10);
    return { ok: true, preco };
  }

  // --- Prisão -----------------------------------------------------------
  irParaPresidio(dias) {
    const presidio = (this.jogo.mundo.indicePorTipo.get('presidio') || [])[0];
    this.estado = 'preso';
    this.diasPreso = dias;
    if (presidio !== undefined) {
      const l = this.jogo.mundo.lotes[presidio];
      this.x = l.x; this.z = l.z + l.tam * 0.6;
      this.presidioLote = presidio;
    }
    if (this.emprego) this.demitirSe();
    this.registro(`Você foi condenado a ${dias} dias de reclusão.`);
    this.jogo.ui?.abrirPresidio(dias);
  }

  cumprirPena(dias) {
    this.diasPreso -= dias;
    this.jogo.tempo.diaAbsoluto += dias;
    this.jogo.tempo.dia += dias;
    this.habilidades.condicionamento = clamp(this.habilidades.condicionamento + 0.02 * dias, 0, 1);
    if (this.diasPreso <= 0) {
      this.estado = 'livre';
      this.x = this.casa.x + 12; this.z = this.casa.z + 12;
      this.jogo.ui?.feed('🔓 Você cumpriu a pena e foi solto.');
      this.registro('Você foi solto da penitenciária.');
    }
  }

  // --- Tick -------------------------------------------------------------
  atualizar(dt) {
    const h = (dt * this.jogo.tempo.escala) / 3600;
    const n = this.necessidades;
    n.fome = clamp(n.fome + h * 0.06, 0, 1.5);
    n.energia = clamp(n.energia - h * 0.035, 0, 1);
    n.social = clamp(n.social - h * 0.02, 0, 1);
    n.diversao = clamp(n.diversao - h * 0.025, 0, 1);
    n.higiene = clamp(n.higiene - h * 0.02, 0, 1);
    if (n.fome > 1.2) this.saude = clamp(this.saude - h * 0.05, 0, 1);
    else if (n.fome < 0.6 && n.energia > 0.4) this.saude = clamp(this.saude + h * 0.01, 0, 1);
    this.notoriedade = clamp(this.notoriedade - h * 0.0015, 0, 1);
    if (this.veiculoAtual && this.estado === 'dirigindo') {
      this.veiculoAtual.combustivel = clamp(this.veiculoAtual.combustivel - Math.abs(this.velocidade) * dt * 0.0006, 0, 1);
    }
  }

  passoDiario() {
    // Aluguel / IPTU / renda de imóveis e empresas
    if (this.casa && this.casa.doJogador === 'aluguel') {
      const aluguel = Math.round(this.casa.valor * 0.004 * this.jogo.economia.indiceImoveis / 30);
      this.jogo.banco.lancar(this.conta.id, -aluguel, 'Aluguel diário da moradia', 'moradia');
    }
    for (const id of this.imoveis) {
      const l = this.jogo.mundo.lotes[id];
      this.jogo.banco.lancar(this.conta.id, -Math.round(l.valor * 0.00008), `IPTU/condomínio ${l.nome}`, 'moradia');
      if (l.alugado) this.jogo.banco.lancar(this.conta.id, Math.round(l.aluguelMensal / 30), `Aluguel recebido: ${l.nome}`, 'receita');
    }
    for (const eid of this.empresas) {
      const e = this.jogo.empresas.porId(eid);
      if (!e) continue;
      const conta = this.jogo.banco.obter(e.contaId);
      if (conta && conta.saldo > 50000) {
        const retirada = Math.round((conta.saldo - 50000) * 0.25);
        this.jogo.banco.transferir(e.contaId, this.conta.id, retirada, `Distribuição de lucros — ${e.nome}`);
      }
    }
    if (this.emprego) {
      // Salário diário proporcional se trabalhou
      const e = this.jogo.empresas.porId(this.emprego.empresaId);
      if (e && this.horasTrabalhadas === 0) {
        this.jogo.ui?.feed(`⚠️ Você não trabalhou ontem em ${e.nome}.`);
        if (chance(this.jogo.rng, 0.25)) { this.jogo.ui?.feed('❌ Você foi demitido por faltas.'); this.demitirSe(); }
      }
      this.horasTrabalhadas = 0;
    }
    if (this.estado === 'preso') this.cumprirPena(1);
  }
}
