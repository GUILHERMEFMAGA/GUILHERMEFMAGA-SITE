// =====================================================================
// INTERIORES ACESSÍVEIS — cada tipo de edificação tem ambientes,
// funcionários em turno, clientes e ações próprias.
// =====================================================================
import { clamp, dinheiro, escolher, faixa, chance, inteiro } from '../util/nucleo.js';
import { TIPOS } from '../mundo/gerador.js';
import { NEGOCIOS } from '../sim/empresas.js';

const AMBIENTES = {
  casa: ['Sala de estar', 'Cozinha', 'Banheiro', 'Quarto', 'Área de serviço', 'Garagem'],
  mansao: ['Hall de entrada', 'Grande salão', 'Sala de jantar', 'Cozinha profissional', 'Suíte máster', 'Suítes de hóspedes',
    'Escritório', 'Biblioteca', 'Adega', 'Home theater', 'Piscina', 'Jardins', 'Garagem para 6 carros', 'Área de serviço'],
  predio: ['Portaria', 'Hall', 'Elevadores', 'Corredores', 'Apartamentos', 'Salão de festas', 'Garagem'],
  escritorio: ['Recepção', 'Open space', 'Salas de reunião', 'Copa', 'TI / servidores', 'Diretoria'],
  loja: ['Vitrine', 'Salão de vendas', 'Provadores', 'Caixa', 'Estoque'],
  restaurante: ['Recepção', 'Salão principal', 'Mezanino', 'Bar', 'Cozinha', 'Câmara fria', 'Estoque', 'Banheiros', 'Estacionamento'],
  supermercado: ['Estacionamento', 'Entrada', 'Hortifrúti', 'Açougue', 'Padaria', 'Mercearia', 'Bebidas', 'Frios',
    'Limpeza', 'Caixas', 'Depósito', 'Doca de recebimento', 'Sala de funcionários', 'Escritório'],
  hotel: ['Recepção 24h', 'Lobby', 'Elevadores', 'Andares de quartos', 'Suítes', 'Restaurante', 'Academia',
    'Salas de evento', 'Lavanderia', 'Garagem', 'Segurança / CFTV'],
  banco: ['Estacionamento', 'Entrada com eclusa', 'Recepção', 'Fila de atendimento', 'Caixas', 'Gerência',
    'Salas de negócio', 'Área restrita', 'Cofre', 'Sala técnica', 'Monitoramento (CFTV)'],
  hospital: ['Pronto-socorro', 'Recepção', 'Triagem', 'Consultórios', 'Enfermarias', 'Centro cirúrgico', 'UTI', 'Farmácia'],
  delegacia: ['Atendimento', 'Plantão', 'Cartório', 'Salas de oitiva', 'Carceragem provisória', 'Garagem de viaturas'],
  tribunal: ['Saguão', 'Protocolo', 'Salas de audiência', 'Gabinetes', 'Plenário'],
  presidio: ['Portaria', 'Revista', 'Celas', 'Corredores', 'Pátio', 'Refeitório', 'Enfermaria', 'Oficinas', 'Sala de visitas', 'Administração'],
  escola: ['Pátio', 'Salas de aula', 'Biblioteca', 'Laboratório', 'Quadra', 'Cantina', 'Secretaria'],
  oficina: ['Recepção', 'Box de serviço', 'Elevador automotivo', 'Almoxarifado', 'Pátio'],
  concessionaria: ['Showroom', 'Mesas de negociação', 'Pátio de usados', 'Oficina autorizada'],
  posto: ['Pista de abastecimento', 'Loja de conveniência', 'Troca de óleo', 'Banheiros', 'Estacionamento'],
  fabrica: ['Portaria', 'Linha de produção', 'Almoxarifado', 'Expedição', 'Manutenção', 'Refeitório', 'Escritório'],
  fazenda: ['Casa sede', 'Celeiro', 'Curral', 'Silo', 'Plantações', 'Galpão de máquinas'],
  estacao: ['Saguão', 'Bilheteria', 'Plataformas', 'Lanchonetes'],
  publico: ['Saguão', 'Protocolo', 'Salas administrativas', 'Auditório'],
};

export class Interior {
  constructor(jogo, ui) {
    this.jogo = jogo; this.ui = ui;
    this.loteAtual = null;
  }

  entrar(lote) {
    const jogo = this.jogo;
    this.loteAtual = lote;
    jogo.jogador.dentroDe = lote.id;
    const e = jogo.empresas.doLote(lote.id);
    this.render(lote, e);
  }

  sair() {
    if (this.loteAtual) {
      this.jogo.jogador.dentroDe = null;
      this.loteAtual = null;
    }
  }

  pessoasDentro(lote) {
    const jogo = this.jogo;
    const lista = [];
    for (const a of jogo.agentes.lista) {
      if (a.loteAtual === lote.id && a.estado !== 'viajando') lista.push(a);
      if (lista.length > 90) break;
    }
    return lista;
  }

  render(lote, e) {
    const jogo = this.jogo, j = jogo.jogador;
    const tipoInterior = lote.interior || 'casa';
    const ambientes = AMBIENTES[tipoInterior] || AMBIENTES.casa;
    const pessoas = this.pessoasDentro(lote);
    const funcionarios = e ? e.funcionarios.map((id) => jogo.agentes.porId(id)).filter(Boolean) : [];
    const emTurno = funcionarios.filter((a) => a.estado === 'trabalhando');
    const aberto = e ? jogo.empresas.abertaAgora(e) : true;

    const htmlAmbientes = ambientes.map((a) => `<span class="tag">${a}</span>`).join('');
    const htmlPessoas = pessoas.slice(0, 8).map((a) =>
      `<li><b>${a.nome}</b> (${a.idade}) — ${a.profissao}<br><small class="muted">${this.descreverEstado(a)}</small></li>`).join('');

    const info = e ? `<div class="card">
        <b>${e.nome}</b> — ${e.tipo} ${aberto ? '<span class="tag ok">aberto</span>' : '<span class="tag off">fechado</span>'}<br>
        <small>Horário ${e.abre}h–${e.fecha}h • reputação ${(e.reputacao * 100).toFixed(0)}% • preço médio ${dinheiro(e.preco)}</small><br>
        <small>Funcionários: ${funcionarios.length} (${emTurno.length} em turno) • estoque ${Math.round(e.estoque)} • clientes ontem ${e.clientesOntem}</small><br>
        <small>Segurança: ${(lote.seguranca * 100).toFixed(0)}% • ${lote.camerasQtd} câmeras</small>
      </div>` : `<div class="card"><b>${lote.nome}</b><br><small>${TIPOS[lote.tipo].nome} • ${lote.distrito} • ${lote.m2} m² • valor ${dinheiro(lote.valor * jogo.economia.indiceImoveis)}</small></div>`;

    const acoes = this.acoesPara(lote, e).map((a) =>
      `<button class="btn" data-int="${a.id}">${a.rotulo}</button>`).join('');

    this.ui.abrirModal(`${this.icone(tipoInterior)} ${lote.nome}`, `
      ${info}
      <div class="card"><b>Ambientes</b><br>${htmlAmbientes}</div>
      <div class="grade">
        <div class="card"><b>Ações</b><div class="acoes">${acoes}</div></div>
        <div class="card"><b>Pessoas no local (${pessoas.length})</b><ul class="lista">${htmlPessoas || '<li class="muted">Vazio no momento</li>'}</ul></div>
      </div>`, (root) => {
      root.querySelectorAll('[data-int]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.executar(btn.dataset.int, lote, e);
          this.render(lote, jogo.empresas.doLote(lote.id));
        });
      });
    });
  }

  descreverEstado(a) {
    const mapa = {
      trabalhando: 'trabalhando no local', comprando: 'fazendo compras', almocando: 'almoçando',
      lazer: 'aproveitando o tempo livre', 'em-casa': 'em casa', dormindo: 'dormindo',
      estudando: 'estudando', visitando: 'visitando alguém', abrigado: 'abrigado da chuva', preso: 'detido',
    };
    const base = mapa[a.estado] || a.estado;
    const mem = a.memoria.length ? ` • “${a.memoria[a.memoria.length - 1].texto}”` : '';
    return base + mem;
  }

  icone(t) {
    return { casa: '🏠', mansao: '🏛️', predio: '🏢', escritorio: '🏢', loja: '🛍️', restaurante: '🍽️',
      supermercado: '🛒', hotel: '🏨', banco: '🏦', hospital: '🏥', delegacia: '🚔', tribunal: '⚖️',
      presidio: '🔒', escola: '🎓', oficina: '🔧', concessionaria: '🚗', posto: '⛽', fabrica: '🏭',
      fazenda: '🌾', estacao: '🚉', publico: '🏛️' }[t] || '🏢';
  }

  acoesPara(lote, e) {
    const j = this.jogo.jogador;
    const a = [];
    const tipo = lote.interior;
    const meu = lote.doJogador || (e && e.donoId === 'jogador');

    if (tipo === 'casa' || tipo === 'mansao' || tipo === 'predio') {
      if (meu) {
        a.push({ id: 'dormir', rotulo: '😴 Dormir até de manhã' });
        a.push({ id: 'comer', rotulo: '🍳 Preparar uma refeição' });
        a.push({ id: 'banho', rotulo: '🚿 Tomar banho' });
        a.push({ id: 'descansar', rotulo: '📺 Relaxar (2h)' });
      } else {
        a.push({ id: 'bater', rotulo: '🔔 Bater à porta' });
        a.push({ id: 'comprar-imovel', rotulo: `🏷️ Comprar por ${dinheiro(lote.valor * this.jogo.economia.indiceImoveis)}` });
      }
    }
    if (e && this.jogo.empresas.abertaAgora(e)) {
      switch (e.chave) {
        case 'restaurante': case 'cafe':
          a.push({ id: 'mesa', rotulo: '🍽️ Sentar e pedir o cardápio' });
          a.push({ id: 'comer-fora', rotulo: `🍲 Fazer o pedido (${dinheiro(e.preco)})` });
          break;
        case 'supermercado': case 'loja':
          a.push({ id: 'comprar', rotulo: `🛒 Comprar itens (${dinheiro(e.preco)})` });
          a.push({ id: 'comprar-muito', rotulo: `📦 Compra do mês (${dinheiro(e.preco * 8)})` });
          break;
        case 'banco':
          a.push({ id: 'saldo', rotulo: '📄 Consultar saldo e extrato' });
          a.push({ id: 'sacar', rotulo: '🏧 Sacar R$ 500' });
          a.push({ id: 'depositar', rotulo: '💵 Depositar o que tem na carteira' });
          a.push({ id: 'credito', rotulo: '📝 Falar com gerente sobre crédito' });
          a.push({ id: 'observar', rotulo: '👀 Observar movimento e segurança' });
          break;
        case 'hotel':
          a.push({ id: 'hospedar', rotulo: `🛏️ Reservar quarto (${dinheiro(e.preco)})` });
          break;
        case 'posto':
          a.push({ id: 'abastecer', rotulo: `⛽ Abastecer (${dinheiro(this.jogo.economia.preco('combustivel') * 40)})` });
          a.push({ id: 'conveniencia', rotulo: '🥤 Loja de conveniência' });
          break;
        case 'oficina':
          a.push({ id: 'reparar', rotulo: '🔧 Reparar veículo' });
          break;
        case 'concessionaria':
          a.push({ id: 'ver-carros', rotulo: '🚗 Ver veículos à venda' });
          break;
        case 'hospital':
          a.push({ id: 'tratamento', rotulo: '💊 Fazer atendimento médico' });
          break;
        case 'escola': case 'universidade':
          a.push({ id: 'estudar', rotulo: '📚 Assistir a aulas (2h)' });
          break;
        default:
          a.push({ id: 'atendimento', rotulo: '💬 Falar na recepção' });
      }
      if (e.vagas > 0) a.push({ id: 'vaga', rotulo: `💼 Perguntar sobre vagas (${e.vagas})` });
      if (!e.donoId) a.push({ id: 'comprar-empresa', rotulo: `🤝 Negociar compra (${dinheiro(j.valorEmpresa(e))})` });
      if (j.emprego && j.emprego.empresaId === e.id) a.push({ id: 'trabalhar', rotulo: '🧑‍💼 Bater ponto e trabalhar (4h)' });
    }
    if (lote.tipo === 'delegacia') {
      a.push({ id: 'ficha', rotulo: '📋 Consultar sua ficha' });
      a.push({ id: 'denunciar', rotulo: '📞 Registrar ocorrência' });
    }
    if (lote.tipo === 'tribunal') {
      a.push({ id: 'processos', rotulo: '⚖️ Consultar processos' });
    }
    if (lote.tipo === 'presidio') {
      a.push({ id: 'visita', rotulo: '👥 Fazer visita' });
    }
    if (['estacao', 'aeroporto', 'porto', 'prefeitura'].includes(lote.tipo)) {
      a.push({ id: 'informacoes', rotulo: 'ℹ️ Balcão de informações' });
      a.push({ id: 'esperar', rotulo: '🕒 Esperar 1 hora no saguão' });
    }
    if (e && !this.jogo.empresas.abertaAgora(e)) {
      a.push({ id: 'horario', rotulo: `🕒 Ver horário (abre ${e.abre}h)` });
      a.push({ id: 'esperar', rotulo: '🕒 Esperar 1 hora' });
    }
    if (!a.length) a.push({ id: 'olhar', rotulo: '👀 Observar o ambiente' });
    return a;
  }

  executar(id, lote, e) {
    const jogo = this.jogo, j = jogo.jogador, ui = this.ui;
    const n = j.necessidades;
    switch (id) {
      case 'dormir': {
        const horas = ((24 + 7.5) - jogo.tempo.hora) % 24;
        jogo.tempo.hora = 7.5;
        if (jogo.tempo.hora < 7.5) jogo.tempo.diaAbsoluto++;
        n.energia = 1; n.higiene = clamp(n.higiene + 0.2, 0, 1); n.fome = clamp(n.fome + 0.3, 0, 1.5);
        ui.feed(`😴 Você dormiu ${horas.toFixed(1)}h e acordou disposto.`);
        break;
      }
      case 'comer': n.fome = clamp(n.fome - 0.8, 0, 1.5); jogo.tempo.hora += 0.6; ui.feed('🍳 Refeição feita em casa.'); break;
      case 'banho': n.higiene = 1; jogo.tempo.hora += 0.3; ui.feed('🚿 Você se sente renovado.'); break;
      case 'descansar': n.diversao = clamp(n.diversao + 0.4, 0, 1); n.energia = clamp(n.energia + 0.2, 0, 1); jogo.tempo.hora += 2; break;
      case 'bater': {
        const moradores = lote.residentes.map((r) => jogo.agentes.porId(r)).filter(Boolean);
        const em = moradores.filter((m) => m.loteAtual === lote.id);
        if (em.length) {
          const p = escolher(jogo.rng, em);
          j.contatos.push(p.id);
          n.social = clamp(n.social + 0.3, 0, 1);
          ui.feed(`👋 ${p.nome} atendeu. ${p.nome} trabalha como ${p.profissao}.`);
        } else ui.feed('🔕 Ninguém atendeu — os moradores estão fora.');
        break;
      }
      case 'comprar-imovel': {
        const r = j.comprarImovel(lote.id);
        ui.feed(r.ok ? `🏠 Imóvel comprado por ${dinheiro(r.preco)}` : `❌ ${r.erro}`);
        break;
      }
      case 'mesa': ui.feed('🍽️ Você foi acomodado. O garçom trouxe o cardápio da casa.'); jogo.tempo.hora += 0.2; break;
      case 'comer-fora': {
        const r = jogo.empresas.comprar(e, j.conta, 1, 1);
        if (r.ok) { n.fome = clamp(n.fome - 1, 0, 1.5); n.diversao = clamp(n.diversao + 0.25, 0, 1); jogo.tempo.hora += 1; ui.feed(`🍲 Refeição servida — ${dinheiro(r.valor)}`); }
        else ui.feed(`❌ ${r.erro}`);
        break;
      }
      case 'comprar': case 'comprar-muito': {
        const qtd = id === 'comprar' ? 1 : 8;
        const r = jogo.empresas.comprar(e, j.conta, qtd, 1);
        if (r.ok) { n.fome = clamp(n.fome - 0.3 * qtd, 0, 1.5); j.inventario.push({ item: 'compras', qtd }); ui.feed(`🛒 Compras: ${dinheiro(r.valor)}`); }
        else ui.feed(`❌ ${r.erro}`);
        break;
      }
      case 'saldo': ui.feed(`📄 Saldo: ${dinheiro(j.conta.saldo)} • últimos lançamentos no app do banco.`); break;
      case 'sacar': ui.feed(j.sacar(500) ? '🏧 Saque de R$ 500' : '❌ Saldo insuficiente'); break;
      case 'depositar': { const v = Math.floor(j.carteira); ui.feed(j.depositar(v) ? `🏦 Depósito de ${dinheiro(v)}` : '❌ Nada para depositar'); break; }
      case 'credito': {
        const r = jogo.banco.solicitarEmprestimo(j.conta.id, 30000, 24);
        ui.feed(r.ok ? '✅ Crédito de R$ 30.000 aprovado em 24x' : `❌ ${r.erro}`);
        break;
      }
      case 'observar': {
        const guardas = e.funcionarios.map((id2) => jogo.agentes.porId(id2)).filter((a2) => a2 && /Segurança/i.test(a2.cargo || '')).length;
        ui.feed(`👀 ${lote.camerasQtd} câmeras visíveis, ${guardas} seguranças, nível de proteção ${(lote.seguranca * 100).toFixed(0)}%.`);
        j.habilidades.furtividade = clamp(j.habilidades.furtividade + 0.01, 0, 1);
        break;
      }
      case 'hospedar': {
        const r = jogo.empresas.comprar(e, j.conta, 1, 1);
        if (r.ok) {
          jogo.tempo.hora = 8; jogo.tempo.diaAbsoluto++;
          n.energia = 1; n.higiene = 1;
          ui.feed(`🛏️ Noite no hotel por ${dinheiro(r.valor)}. Check-out às 08:00.`);
        } else ui.feed(`❌ ${r.erro}`);
        break;
      }
      case 'abastecer': {
        const v = j.veiculoAtual || j.veiculos[0];
        if (!v) { ui.feed('❌ Você não tem veículo aqui.'); break; }
        const litros = Math.round((1 - v.combustivel) * 50) || 10;
        const preco = jogo.economia.preco('combustivel') * litros;
        if (j.pagar(preco, `Abastecimento (${litros}L)`)) {
          v.combustivel = 1;
          jogo.economia.registrarDemanda('combustivel', litros / 5);
          jogo.empresas.comprar(e, null, litros / 10, 1);
          ui.feed(`⛽ ${litros}L abastecidos por ${dinheiro(preco)}`);
        } else ui.feed('❌ Saldo insuficiente');
        break;
      }
      case 'conveniencia': {
        const r = jogo.empresas.comprar(e, j.conta, 1, 0.4);
        if (r.ok) { n.fome = clamp(n.fome - 0.3, 0, 1.5); ui.feed(`🥤 Lanche comprado — ${dinheiro(r.valor)}`); }
        break;
      }
      case 'reparar': {
        const v = j.veiculoAtual || j.veiculos[0];
        if (!v) { ui.feed('❌ Nenhum veículo para reparar.'); break; }
        const custo = Math.round((1 - v.estado) * 6000 + 220);
        if (j.pagar(custo, 'Serviço de oficina')) { v.estado = 1; jogo.empresas.comprar(e, null, 1, 3); ui.feed(`🔧 Veículo revisado por ${dinheiro(custo)}`); }
        else ui.feed('❌ Saldo insuficiente');
        break;
      }
      case 'ver-carros': {
        const modelos = [
          { nome: 'Hatch urbano', tipo: 'carro', preco: 48000, cor: 0xcccccc },
          { nome: 'Sedan executivo', tipo: 'carro', preco: 96000, cor: 0x1b2a3a },
          { nome: 'SUV familiar', tipo: 'suv', preco: 142000, cor: 0x33403a },
          { nome: 'Picape de trabalho', tipo: 'van', preco: 128000, cor: 0x7a3b2a },
          { nome: 'Moto urbana', tipo: 'moto', preco: 22000, cor: 0x202020 },
          { nome: 'Esportivo', tipo: 'carro', preco: 420000, cor: 0xb01818 },
        ];
        this.ui.abrirModal('🚗 Showroom', `<div class="card">Escolha um veículo:</div><div class="acoes">${
          modelos.map((m, i) => `<button class="btn" data-carro="${i}">${m.nome} — ${dinheiro(m.preco)}</button>`).join('')
        }</div>`, (root) => {
          root.querySelectorAll('[data-carro]').forEach((b) => b.addEventListener('click', () => {
            const m = modelos[parseInt(b.dataset.carro, 10)];
            const r = j.comprarVeiculo(m);
            ui.feed(r.ok ? `🚗 Você comprou um ${m.nome}!` : `❌ ${r.erro}`);
            if (r.ok && e) jogo.empresas.comprar(e, null, 1, 1);
            this.render(lote, e);
          }));
        });
        return;
      }
      case 'tratamento': {
        const custo = Math.round(380 + (1 - j.saude) * 4200);
        if (j.pagar(custo, 'Atendimento médico')) { j.saude = 1; ui.feed(`💊 Você foi atendido (${dinheiro(custo)}).`); }
        else ui.feed('❌ Saldo insuficiente — procure o SUS ficcional mais tarde.');
        break;
      }
      case 'estudar': {
        const cursos = ['Tecnologia', 'Gestão', 'Direito', 'Medicina', 'Mecânica', 'Gastronomia', 'Direção Defensiva'];
        this.ui.abrirModal('🎓 Matrícula', `<div class="acoes">${
          cursos.map((c, i) => `<button class="btn" data-curso="${i}">${c} — R$ 360 (2h)</button>`).join('')}</div>`, (root) => {
          root.querySelectorAll('[data-curso]').forEach((b) => b.addEventListener('click', () => {
            const r = j.estudar(cursos[parseInt(b.dataset.curso, 10)], 2);
            ui.feed(r.ok ? `📚 Aula concluída: ${j.educacao.cursando}` : `❌ ${r.erro}`);
            this.render(lote, e);
          }));
        });
        return;
      }
      case 'vaga': {
        const cargo = escolher(jogo.rng, e.cargos);
        const r = j.candidatar(e.id, cargo);
        ui.feed(r.ok ? `✅ Contratado como ${cargo} (${dinheiro(r.salario)}/mês)` : `❌ ${r.erro}`);
        break;
      }
      case 'comprar-empresa': {
        const r = j.comprarEmpresa(e.id);
        ui.feed(r.ok ? `🤝 ${e.nome} agora é sua.` : `❌ ${r.erro}`);
        break;
      }
      case 'trabalhar': {
        const r = j.trabalhar(4);
        ui.feed(r.ok ? `🧑‍💼 4h trabalhadas — ${dinheiro(r.valor)} creditados` : `❌ ${r.erro}`);
        break;
      }
      case 'atendimento': ui.feed('💬 A recepção registrou seu contato.'); break;
      case 'ficha': {
        const f = j.fichaCriminal.length ? j.fichaCriminal.map((x) => `${x.crime} (${x.resultado || 'em apuração'})`).join(', ') : 'nada consta';
        ui.feed(`📋 Ficha: ${f}. Notoriedade ${(j.notoriedade * 100).toFixed(0)}%.`);
        break;
      }
      case 'denunciar': {
        const crime = jogo.crime.ativos[0];
        if (crime) { crime.detectado = true; jogo.crime.chamarPolicia(crime); ui.feed('📞 Denúncia registrada — unidades a caminho.'); }
        else ui.feed('📞 Nada a relatar no momento.');
        break;
      }
      case 'processos': {
        const ps = jogo.justica.processos.filter((p) => p.reu === 'jogador');
        ui.feed(ps.length ? `⚖️ ${ps.length} processo(s). Último: ${ps[ps.length - 1].acusacao}` : '⚖️ Nenhum processo em seu nome.');
        break;
      }
      case 'informacoes':
        ui.feed(`ℹ️ ${lote.nome}: ${lote.m2} m², ${lote.distrito}. Funcionários públicos atendem no balcão.`);
        break;
      case 'esperar':
        jogo.tempo.hora += 1;
        n.fome = clamp(n.fome + 0.06, 0, 1.5);
        ui.feed('🕒 Uma hora se passou. A cidade seguiu funcionando.');
        break;
      case 'horario':
        ui.feed(`🕒 ${e.nome} abre às ${e.abre}h e fecha às ${e.fecha}h.`);
        break;
      case 'olhar': {
        const m = jogo.memoriaMundo.comentarioLocal(lote.x, lote.z);
        ui.feed(`👀 ${lote.nome} — ${TIPOS[lote.tipo].nome} em ${lote.distrito}.${m ? ` Comentam por aqui: ${m.texto}.` : ''}`);
        break;
      }
      case 'visita': {
        const presos = jogo.agentes.lista.filter((a) => a.estado === 'preso').slice(0, 3);
        ui.feed(presos.length ? `👥 Você visitou ${presos[0].nome}. Pena restante: ${presos[0].diasPreso.toFixed(1)} dias.` : '👥 Nenhum detento disponível para visita.');
        break;
      }
    }
  }
}
