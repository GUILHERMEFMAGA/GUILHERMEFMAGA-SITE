// =====================================================================
// SISTEMA BANCÁRIO — contas, transferências, cartões, empréstimos, ATMs
// Usado por NPCs, empresas e pelo jogador.
// =====================================================================
import { clamp, faixa, chance, dinheiro } from '../util/nucleo.js';

let seqConta = 1000;

export class Banco {
  constructor(jogo) {
    this.jogo = jogo;
    this.contas = new Map();
    this.transacoesDia = 0;
    this.volumeDia = 0;
    this.agencias = [];     // lotes do tipo banco
    this.caixas = [];       // ATMs
    this.filaProcessamento = [];
  }

  conectarMundo(mundo) {
    this.agencias = (mundo.indicePorTipo.get('banco') || []).map((id) => mundo.lotes[id]);
    this.caixas = mundo.caixas;
  }

  abrirConta(titular, tipo = 'pessoal', saldoInicial = 0) {
    const id = `BR${(seqConta++).toString().padStart(6, '0')}`;
    const conta = {
      id, titular, tipo, saldo: saldoInicial, limite: tipo === 'empresa' ? 20000 : 1200,
      cartao: `**** ${Math.floor(1000 + Math.random() * 8999)}`,
      extrato: [], emprestimos: [], bloqueada: false, criadaEm: this.jogo.tempo ? this.jogo.tempo.diaAbsoluto : 0,
      rendimento: tipo === 'empresa' ? 0.0004 : 0.0002,
    };
    this.contas.set(id, conta);
    return conta;
  }

  obter(id) { return this.contas.get(id); }

  lancar(contaId, valor, descricao, categoria = 'geral') {
    const c = this.contas.get(contaId); if (!c) return false;
    if (valor < 0 && c.saldo + c.limite < -valor) return false;
    c.saldo += valor;
    c.extrato.push({
      t: this.jogo.tempo.diaAbsoluto + this.jogo.tempo.hora / 24,
      hora: this.jogo.tempo.rotulo, dia: this.jogo.tempo.diaAbsoluto,
      valor, descricao, categoria, saldo: c.saldo,
    });
    if (c.extrato.length > 80) c.extrato.shift();
    this.transacoesDia++; this.volumeDia += Math.abs(valor);
    this.jogo.economia.registrarTransacao(valor);
    if (c === this.jogo.jogador?.conta) this.jogo.barramento.emitir('banco-jogador', { valor, descricao });
    return true;
  }

  transferir(deId, paraId, valor, descricao = 'Transferência') {
    if (valor <= 0) return { ok: false, erro: 'Valor inválido' };
    const de = this.contas.get(deId), para = this.contas.get(paraId);
    if (!de || !para) return { ok: false, erro: 'Conta inexistente' };
    if (de.saldo + de.limite < valor) return { ok: false, erro: 'Saldo insuficiente' };
    this.lancar(deId, -valor, `${descricao} → ${para.titular}`, 'transferencia');
    this.lancar(paraId, valor, `${descricao} ← ${de.titular}`, 'transferencia');
    return { ok: true };
  }

  solicitarEmprestimo(contaId, valor, parcelas = 12) {
    const c = this.contas.get(contaId); if (!c) return { ok: false, erro: 'Conta inexistente' };
    const rendaMensal = c.rendaEstimada || 2500;
    const dividaAtual = c.emprestimos.reduce((a, e) => a + e.saldoDevedor, 0);
    const tetoCredito = rendaMensal * 14 - dividaAtual;
    if (valor > tetoCredito) return { ok: false, erro: `Crédito aprovado até ${dinheiro(Math.max(0, tetoCredito))}` };
    const juros = this.jogo.economia.taxaJuros * (c.tipo === 'empresa' ? 0.85 : 1.15) + (c.inadimplente ? 0.01 : 0);
    const fator = Math.pow(1 + juros, parcelas);
    const parcela = valor * (juros * fator) / (fator - 1);
    const emp = {
      id: `E${Math.floor(Math.random() * 1e6)}`, valor, parcelas, parcelasPagas: 0,
      parcela, juros, saldoDevedor: parcela * parcelas, proximoVencimento: this.jogo.tempo.diaAbsoluto + 30,
    };
    c.emprestimos.push(emp);
    this.lancar(contaId, valor, `Empréstimo aprovado (${parcelas}x ${dinheiro(parcela)})`, 'emprestimo');
    return { ok: true, emprestimo: emp };
  }

  passoDiario() {
    const dia = this.jogo.tempo.diaAbsoluto;
    for (const c of this.contas.values()) {
      // Rendimento / juros do cheque especial
      if (c.saldo > 0) c.saldo += c.saldo * c.rendimento;
      else if (c.saldo < 0) c.saldo += c.saldo * this.jogo.economia.taxaJuros / 20;
      // Parcelas
      for (const e of c.emprestimos) {
        if (e.parcelasPagas >= e.parcelas) continue;
        if (dia >= e.proximoVencimento) {
          const pago = this.lancar(c.id, -e.parcela, `Parcela ${e.parcelasPagas + 1}/${e.parcelas} de empréstimo`, 'emprestimo');
          if (pago) { e.parcelasPagas++; e.saldoDevedor -= e.parcela; e.proximoVencimento += 30; c.inadimplente = false; }
          else {
            e.saldoDevedor *= 1.03; e.proximoVencimento += 7; c.inadimplente = true;
            if (c === this.jogo.jogador?.conta) this.jogo.ui?.aviso('Parcela de empréstimo não paga — juros de mora aplicados.');
          }
        }
      }
      c.emprestimos = c.emprestimos.filter((e) => e.parcelasPagas < e.parcelas);
      // Tarifa mensal
      if (dia % 30 === 0 && c.tipo !== 'sistema') this.lancar(c.id, -(c.tipo === 'empresa' ? 89 : 24), 'Tarifa de manutenção de conta', 'tarifa');
    }
    this.jogo.barramento.emitir('banco-dia', { transacoes: this.transacoesDia, volume: this.volumeDia });
    this.transacoesDia = 0; this.volumeDia = 0;
  }

  caixaMaisProximo(x, z) {
    let melhor = null, md = 1e18;
    for (const c of this.caixas) {
      const d = (c.x - x) ** 2 + (c.z - z) ** 2;
      if (d < md) { md = d; melhor = c; }
    }
    return melhor ? { ...melhor, distancia: Math.sqrt(md) } : null;
  }
}
