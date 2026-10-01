// =====================================================================
// SMARTPHONE DO JOGADOR — mapa, banco, empregos, imóveis, empresas,
// notícias, mercado, contatos, transporte, planejamento e ajustes.
// =====================================================================
import { clamp, dinheiro, dinheiroCurto, dist, escolher, faixa } from '../util/nucleo.js';
import { NEGOCIOS } from '../sim/empresas.js';
import { TIPOS, TAM_MUNDO } from '../mundo/gerador.js';

const APPS = [
  { id: 'inicio', nome: 'Início', icone: '🏠' },
  { id: 'mapa', nome: 'Mapa', icone: '🗺️' },
  { id: 'banco', nome: 'Banco', icone: '🏦' },
  { id: 'empregos', nome: 'Empregos', icone: '💼' },
  { id: 'imoveis', nome: 'Imóveis', icone: '🏠' },
  { id: 'empresas', nome: 'Empresas', icone: '📊' },
  { id: 'noticias', nome: 'Notícias', icone: '📰' },
  { id: 'mercado', nome: 'Mercado', icone: '📈' },
  { id: 'contatos', nome: 'Contatos', icone: '👥' },
  { id: 'transporte', nome: 'Transporte', icone: '🚕' },
  { id: 'plano', nome: 'Operações', icone: '🗂️' },
  { id: 'ajustes', nome: 'Ajustes', icone: '⚙️' },
];

export class Telefone {
  constructor(jogo, ui) {
    this.jogo = jogo; this.ui = ui;
    this.aberto = false;
    this.app = 'inicio';
    this.el = document.querySelector('#telefone');
    this.tela = document.querySelector('#telefone-tela');
    this.gps = null;
    document.querySelector('#telefone-home').addEventListener('click', () => this.abrirApp('inicio'));
    document.querySelector('#telefone-fechar').addEventListener('click', () => this.alternar(false));
  }

  alternar(forcar) {
    this.aberto = forcar !== undefined ? forcar : !this.aberto;
    this.el.classList.toggle('visivel', this.aberto);
    if (this.aberto) this.render();
  }

  abrirApp(id) { this.app = id; this.render(); }

  render() {
    if (!this.aberto) return;
    const metodo = this[`app_${this.app}`];
    this.tela.innerHTML = metodo ? metodo.call(this) : '<p>App indisponível</p>';
    const liga = (sel, fn) => this.tela.querySelectorAll(sel).forEach((el) => el.addEventListener('click', (ev) => { fn(el, ev); }));
    liga('[data-app]', (el) => this.abrirApp(el.dataset.app));
    liga('[data-acao]', (el) => this.acao(el.dataset.acao, el.dataset));
    this.tela.querySelectorAll('input[data-campo]').forEach((el) => {
      el.addEventListener('change', () => { this[el.dataset.campo] = el.value; });
    });
    if (this.app === 'mapa') this.desenharMapa();
  }

  acao(nome, dados) {
    const jogo = this.jogo, j = jogo.jogador;
    const num = (v) => parseFloat(v) || 0;
    switch (nome) {
      case 'sacar': {
        const v = num(this.tela.querySelector('#valor-banco')?.value);
        this.ui.feed(j.sacar(v) ? `🏧 Saque de ${dinheiro(v)}` : '❌ Saldo insuficiente');
        break;
      }
      case 'depositar': {
        const v = num(this.tela.querySelector('#valor-banco')?.value);
        this.ui.feed(j.depositar(v) ? `🏦 Depósito de ${dinheiro(v)}` : '❌ Dinheiro em espécie insuficiente');
        break;
      }
      case 'emprestimo': {
        const v = num(this.tela.querySelector('#valor-emprestimo')?.value);
        const p = parseInt(this.tela.querySelector('#parcelas-emprestimo')?.value || '12', 10);
        const r = jogo.banco.solicitarEmprestimo(j.conta.id, v, p);
        this.ui.feed(r.ok ? `✅ Empréstimo aprovado: ${dinheiro(v)} em ${p}x` : `❌ ${r.erro}`);
        break;
      }
      case 'candidatar': {
        const r = j.candidatar(parseInt(dados.empresa, 10), dados.cargo);
        this.ui.feed(r.ok ? `✅ Contratado! Salário ${dinheiro(r.salario)}/mês` : `❌ ${r.erro}`);
        break;
      }
      case 'demitir': j.demitirSe(); this.ui.feed('📄 Você pediu demissão.'); break;
      case 'comprar-imovel': {
        const r = j.comprarImovel(parseInt(dados.lote, 10));
        this.ui.feed(r.ok ? `🏠 Imóvel comprado por ${dinheiro(r.preco)}` : `❌ ${r.erro}`);
        break;
      }
      case 'vender-imovel': {
        const r = j.venderImovel(parseInt(dados.lote, 10));
        this.ui.feed(r.ok ? `💰 Imóvel vendido por ${dinheiro(r.preco)}` : `❌ ${r.erro}`);
        break;
      }
      case 'alugar-imovel': {
        const r = j.alugarPara(parseInt(dados.lote, 10));
        this.ui.feed(r.ok ? `📑 Imóvel alugado: ${dinheiro(r.aluguel)}/mês` : `❌ ${r.erro}`);
        break;
      }
      case 'comprar-empresa': {
        const r = j.comprarEmpresa(parseInt(dados.empresa, 10));
        this.ui.feed(r.ok ? '🤝 Empresa adquirida!' : `❌ ${r.erro}`);
        break;
      }
      case 'vender-empresa': {
        const r = j.venderEmpresa(parseInt(dados.empresa, 10));
        this.ui.feed(r.ok ? `💰 Empresa vendida por ${dinheiro(r.valor)}` : `❌ ${r.erro}`);
        break;
      }
      case 'abrir-empresa': {
        const chave = this.tela.querySelector('#tipo-empresa')?.value;
        const lote = parseInt(this.tela.querySelector('#lote-empresa')?.value, 10);
        const r = j.abrirEmpresa(chave, lote);
        this.ui.feed(r.ok ? `🏁 ${r.empresa.nome} aberta!` : `❌ ${r.erro}`);
        break;
      }
      case 'preco-empresa': {
        const e = jogo.empresas.porId(parseInt(dados.empresa, 10));
        if (e) { e.preco = clamp(e.preco * (dados.dir === 'up' ? 1.08 : 0.92), 1, 1e7); this.ui.feed(`🏷️ Novo preço médio em ${e.nome}: ${dinheiro(e.preco)}`); }
        break;
      }
      case 'publicidade': {
        const e = jogo.empresas.porId(parseInt(dados.empresa, 10));
        if (e && j.pagar(5000, `Campanha publicitária — ${e.nome}`)) {
          e.publicidade += 60; e.reputacao = clamp(e.reputacao + 0.08, 0, 1);
          jogo.noticias.registrar('negocios', `${e.nome} lança campanha publicitária nos telões da cidade.`);
        }
        break;
      }
      case 'contratar-empresa': {
        const e = jogo.empresas.porId(parseInt(dados.empresa, 10));
        if (e) { e.alvoFuncionarios += 1; e.vagas += 1; jogo.empresas.reindexarVagas(); this.ui.feed(`📢 Nova vaga aberta em ${e.nome}`); }
        break;
      }
      case 'gps': {
        const lote = jogo.mundo.lotes[parseInt(dados.lote, 10)];
        if (lote) { this.gps = lote; this.ui.feed(`🧭 GPS definido: ${lote.nome}`); }
        break;
      }
      case 'taxi': {
        const alvo = this.gps || jogo.mundo.lotes[parseInt(dados.lote, 10)];
        if (!alvo) { this.ui.feed('❌ Defina um destino no mapa'); break; }
        const d = dist(j.x, j.z, alvo.x, alvo.z);
        const tarifa = 7 + d * 0.012;
        if (!j.pagar(tarifa, 'Corrida de táxi')) { this.ui.feed('❌ Saldo insuficiente'); break; }
        j.x = alvo.x + 10; j.z = alvo.z + 10;
        jogo.tempo.hora += d / 9000;
        this.ui.feed(`🚕 Você chegou em ${alvo.nome} (${dinheiro(tarifa)})`);
        break;
      }
      case 'viagem': {
        const vila = jogo.mundo.vilas[parseInt(dados.vila, 10)];
        const d = dist(j.x, j.z, vila.centro.x, vila.centro.z);
        const custo = 25 + d * 0.02;
        if (!j.pagar(custo, `Viagem para ${vila.nome}`)) { this.ui.feed('❌ Saldo insuficiente'); break; }
        j.x = vila.centro.x; j.z = vila.centro.z;
        jogo.tempo.hora += d / 7000;
        this.ui.feed(`🚌 Você chegou em ${vila.nome}`);
        break;
      }
      case 'advogado': {
        const q = parseFloat(dados.q);
        const custo = Math.round(4000 + q * 26000);
        if (j.pagar(custo, 'Honorários advocatícios')) {
          j.advogado = { nome: `Dr(a). ${escolher(jogo.rng, ['Peçanha', 'Lustosa', 'Trindade', 'Andrade'])}`, qualidade: q };
          for (const p of jogo.justica.processos) if (p.aberto && p.reu === 'jogador') p.advogado = j.advogado;
          this.ui.feed(`👔 ${j.advogado.nome} assumiu sua defesa.`);
        } else this.ui.feed('❌ Saldo insuficiente');
        break;
      }
      case 'plano-criar': {
        const alvo = parseInt(this.tela.querySelector('#plano-alvo')?.value, 10);
        const equipe = parseInt(this.tela.querySelector('#plano-equipe')?.value, 10);
        const veiculos = parseInt(this.tela.querySelector('#plano-veiculos')?.value, 10);
        const horario = this.tela.querySelector('#plano-horario')?.value;
        const plano = this.tela.querySelector('#plano-estilo')?.value;
        const r = jogo.crime.criarPlano({ alvoLoteId: alvo, equipe, veiculos, horario, plano, rotaFuga: true, pontoEncontro: true });
        this.ui.feed(r.ok ? `🗂️ Plano registrado (chance estimada ${(r.plano.sucesso * 100).toFixed(0)}%)` : `❌ ${r.erro}`);
        break;
      }
      case 'plano-executar': {
        const r = jogo.crime.executarPlano();
        this.ui.feed(r.ok ? '▶️ Operação iniciada — acompanhe o desenrolar.' : `❌ ${r.erro}`);
        this.alternar(false);
        break;
      }
      case 'velocidade': {
        jogo.tempo.escala = parseInt(dados.v, 10);
        this.ui.feed(`⏱️ Velocidade do tempo: ${dados.v}×`);
        break;
      }
      case 'ligar': {
        const a = jogo.agentes.porId(parseInt(dados.agente, 10));
        if (a) {
          const r = a.relacionamentos.get('jogador') || { tipo: 'conhecido', afeto: 0.3 };
          r.afeto = clamp(r.afeto + 0.08, 0, 1);
          a.relacionamentos.set('jogador', r);
          j.necessidades.social = clamp(j.necessidades.social + 0.2, 0, 1);
          this.ui.feed(`📞 Você conversou com ${a.nome} (${a.profissao}). Estado atual: ${a.estado}.`);
        }
        break;
      }
    }
    this.render();
  }

  // =================== APPS =========================================
  app_inicio() {
    const j = this.jogo.jogador;
    const grade = APPS.filter((a) => a.id !== 'inicio')
      .map((a) => `<button class="app" data-app="${a.id}"><span>${a.icone}</span>${a.nome}</button>`).join('');
    return `
      <div class="tel-topo"><b>${j.nome}</b><span>${this.jogo.tempo.rotulo}</span></div>
      <div class="cartao-saldo">
        <div><small>Conta ${j.conta.id}</small><h3>${dinheiro(j.conta.saldo)}</h3></div>
        <div><small>Carteira</small><h4>${dinheiro(j.carteira)}</h4></div>
        <div><small>Patrimônio</small><h4>${dinheiro(j.patrimonio())}</h4></div>
      </div>
      <div class="apps">${grade}</div>
      <div class="tel-rodape">${j.emprego ? `💼 ${j.emprego.cargo} • ${j.emprego.empresa.nome}` : '💼 Sem emprego fixo'}</div>`;
  }

  app_mapa() {
    const vilas = this.jogo.mundo.vilas.map((v, i) => `<button class="btn mini" data-acao="viagem" data-vila="${i}">${v.nome}</button>`).join('');
    return `
      <h3>🗺️ Mapa da região</h3>
      <canvas id="mapa-canvas" width="330" height="330"></canvas>
      <div class="legenda">
        <span><i style="background:#ffd24a"></i>Você</span><span><i style="background:#ff4444"></i>Ocorrências</span>
        <span><i style="background:#4aa3ff"></i>Polícia</span><span><i style="background:#8cff9f"></i>Seus bens</span>
        <span><i style="background:#ff8ad8"></i>GPS</span>
      </div>
      <p class="muted">Clique no mapa para definir o destino do GPS.</p>
      <div class="linha">${vilas}</div>
      <button class="btn" data-acao="taxi">🚕 Chamar táxi até o destino</button>`;
  }

  desenharMapa() {
    const cv = this.tela.querySelector('#mapa-canvas');
    if (!cv) return;
    const g = cv.getContext('2d');
    const jogo = this.jogo;
    const fonte = jogo.render?.texturaMapa;
    if (fonte) g.drawImage(fonte, 0, 0, cv.width, cv.height);
    const p = (x, z) => [((x + TAM_MUNDO / 2) / TAM_MUNDO) * cv.width, ((z + TAM_MUNDO / 2) / TAM_MUNDO) * cv.height];
    const ponto = (x, z, cor, r = 3) => { const [a, b] = p(x, z); g.fillStyle = cor; g.beginPath(); g.arc(a, b, r, 0, 7); g.fill(); };
    for (const oc of jogo.policia.ocorrencias) if (oc.estado !== 'encerrada') ponto(oc.x, oc.z, '#ff4444');
    for (const u of jogo.policia.unidades) if (u.estado !== 'fora-de-servico') ponto(u.x, u.z, '#4aa3ff', 2);
    for (const ev of jogo.eventos.ativos) ponto(ev.x, ev.z, '#ffc24a', 2.5);
    for (const id of jogo.jogador.imoveis) { const l = jogo.mundo.lotes[id]; ponto(l.x, l.z, '#8cff9f', 4); }
    for (const eid of jogo.jogador.empresas) { const e = jogo.empresas.porId(eid); if (e) ponto(e.x, e.z, '#8cff9f', 4); }
    if (this.gps) ponto(this.gps.x, this.gps.z, '#ff8ad8', 5);
    ponto(jogo.jogador.x, jogo.jogador.z, '#ffd24a', 4.5);
    cv.onclick = (ev) => {
      const r = cv.getBoundingClientRect();
      const x = ((ev.clientX - r.left) / r.width) * TAM_MUNDO - TAM_MUNDO / 2;
      const z = ((ev.clientY - r.top) / r.height) * TAM_MUNDO - TAM_MUNDO / 2;
      const perto = jogo.mundo.grade.proximos(x, z, 200);
      let melhor = null, md = 1e18;
      for (const l of perto) { const d = dist(x, z, l.x, l.z); if (d < md) { md = d; melhor = l; } }
      if (melhor) { this.gps = melhor; this.ui.feed(`🧭 GPS: ${melhor.nome} (${melhor.distrito})`); this.render(); }
    };
  }

  app_banco() {
    const j = this.jogo.jogador;
    const ext = j.conta.extrato.slice(-16).reverse()
      .map((e) => `<li><span>${e.hora}</span> ${e.descricao} <b class="${e.valor < 0 ? 'neg' : 'pos'}">${dinheiro(e.valor)}</b></li>`).join('');
    const emp = j.conta.emprestimos.map((e) => `<li>${dinheiro(e.valor)} • ${e.parcelasPagas}/${e.parcelas} parcelas de ${dinheiro(e.parcela)} (${(e.juros * 100).toFixed(2)}% a.m.)</li>`).join('') || '<li class="muted">Nenhum empréstimo ativo</li>';
    return `
      <h3>🏦 Banco Meridiano</h3>
      <div class="cartao-saldo"><div><small>Saldo</small><h3>${dinheiro(j.conta.saldo)}</h3></div>
      <div><small>Limite</small><h4>${dinheiro(j.conta.limite)}</h4></div>
      <div><small>Cartão</small><h4>${j.conta.cartao}</h4></div></div>
      <div class="linha"><input id="valor-banco" type="number" placeholder="Valor" value="500">
        <button class="btn mini" data-acao="sacar">Sacar</button>
        <button class="btn mini" data-acao="depositar">Depositar</button></div>
      <h4>Crédito</h4>
      <div class="linha"><input id="valor-emprestimo" type="number" placeholder="Valor" value="20000">
        <input id="parcelas-emprestimo" type="number" value="24" style="max-width:70px">
        <button class="btn mini" data-acao="emprestimo">Solicitar</button></div>
      <ul class="lista">${emp}</ul>
      <h4>Extrato</h4><ul class="lista extrato">${ext || '<li class="muted">Sem lançamentos</li>'}</ul>`;
  }

  app_empregos() {
    const jogo = this.jogo, j = jogo.jogador;
    const vagas = jogo.empresas.vagasAbertas
      .map((e) => ({ e, d: dist(j.x, j.z, e.x, e.z) }))
      .sort((a, b) => a.d - b.d).slice(0, 14);
    const itens = vagas.map(({ e, d }) => {
      const cargo = e.cargos[Math.floor(jogo.rng() * e.cargos.length)];
      return `<li><b>${cargo}</b> — ${e.nome}<br>
        <small>${e.tipo} • ${e.distrito} • ${(d / 1000).toFixed(2)} km • reputação ${(e.reputacao * 100).toFixed(0)}%</small><br>
        <button class="btn mini" data-acao="candidatar" data-empresa="${e.id}" data-cargo="${cargo}">Candidatar-se</button>
        <button class="btn mini" data-acao="gps" data-lote="${e.loteId}">GPS</button></li>`;
    }).join('');
    const atual = j.emprego ? `<div class="card"><b>Emprego atual:</b> ${j.emprego.cargo} em ${j.emprego.empresa.nome}<br>
      <small>Salário ${dinheiro(j.emprego.salario)}/mês • turno ${j.emprego.turno.inicio.toFixed(0)}h–${j.emprego.turno.fim.toFixed(0)}h</small><br>
      <button class="btn mini" data-acao="demitir">Pedir demissão</button></div>` : '';
    const hab = Object.entries(j.habilidades).map(([k, v]) => `<span class="tag">${k} ${(v * 100).toFixed(0)}%</span>`).join('');
    return `<h3>💼 Empregos</h3>${atual}
      <div class="card"><b>Formação:</b> ${j.educacao.nivel} (${j.educacao.creditos} créditos)<br>${hab}</div>
      <ul class="lista">${itens || '<li class="muted">Nenhuma vaga próxima</li>'}</ul>`;
  }

  app_imoveis() {
    const jogo = this.jogo, j = jogo.jogador;
    const perto = jogo.mundo.grade.proximos(j.x, j.z, 900)
      .filter((l) => !l.doJogador && ['casa', 'mansao', 'predio', 'loja', 'escritorio', 'galpao', 'restaurante', 'hotel'].includes(l.tipo))
      .sort((a, b) => dist(j.x, j.z, a.x, a.z) - dist(j.x, j.z, b.x, b.z)).slice(0, 12);
    const venda = perto.map((l) => `<li><b>${l.nome}</b><br>
      <small>${TIPOS[l.tipo].nome} • ${l.distrito} • ${l.m2} m² • ${(dist(j.x, j.z, l.x, l.z) / 1000).toFixed(2)} km</small><br>
      <b>${dinheiro(l.valor * jogo.economia.indiceImoveis)}</b>
      <button class="btn mini" data-acao="comprar-imovel" data-lote="${l.id}">Comprar</button>
      <button class="btn mini" data-acao="gps" data-lote="${l.id}">GPS</button></li>`).join('');
    const meus = j.imoveis.map((id) => {
      const l = jogo.mundo.lotes[id];
      return `<li><b>${l.nome}</b> — ${TIPOS[l.tipo].nome}<br>
        <small>Valor atual ${dinheiro(l.valor * jogo.economia.indiceImoveis)} ${l.alugado ? `• alugado por ${dinheiro(l.aluguelMensal)}/mês` : ''}</small><br>
        <button class="btn mini" data-acao="vender-imovel" data-lote="${id}">Vender</button>
        ${l.alugado ? '' : `<button class="btn mini" data-acao="alugar-imovel" data-lote="${id}">Colocar para alugar</button>`}</li>`;
    }).join('');
    return `<h3>🏠 Imóveis</h3>
      <p class="muted">Índice imobiliário: ${(jogo.economia.indiceImoveis * 100).toFixed(1)} • juros ${(jogo.economia.taxaJuros * 100).toFixed(2)}% a.m.</p>
      <h4>Seus imóveis</h4><ul class="lista">${meus || '<li class="muted">Você ainda não possui imóveis</li>'}</ul>
      <h4>À venda perto de você</h4><ul class="lista">${venda}</ul>`;
  }

  app_empresas() {
    const jogo = this.jogo, j = jogo.jogador;
    const minhas = j.empresas.map((id) => {
      const e = jogo.empresas.porId(id); if (!e) return '';
      const conta = jogo.banco.obter(e.contaId);
      return `<li><b>${e.nome}</b> — ${e.tipo}<br>
        <small>Caixa ${dinheiro(conta.saldo)} • lucro/dia ${dinheiro(e.lucroOntem)} • clientes ${e.clientesOntem} • estoque ${Math.round(e.estoque)}</small><br>
        <small>Funcionários ${e.funcionarios.length}/${e.alvoFuncionarios} • reputação ${(e.reputacao * 100).toFixed(0)}% • preço médio ${dinheiro(e.preco)}</small><br>
        <button class="btn mini" data-acao="preco-empresa" data-empresa="${e.id}" data-dir="up">Preço +8%</button>
        <button class="btn mini" data-acao="preco-empresa" data-empresa="${e.id}" data-dir="down">Preço −8%</button>
        <button class="btn mini" data-acao="contratar-empresa" data-empresa="${e.id}">Abrir vaga</button>
        <button class="btn mini" data-acao="publicidade" data-empresa="${e.id}">Publicidade (R$ 5.000)</button>
        <button class="btn mini" data-acao="vender-empresa" data-empresa="${e.id}">Vender</button></li>`;
    }).join('');
    const aVenda = jogo.empresas.lista
      .filter((e) => e.status === 'ativa' && !e.donoId)
      .map((e) => ({ e, d: dist(j.x, j.z, e.x, e.z) }))
      .sort((a, b) => a.d - b.d).slice(0, 8)
      .map(({ e, d }) => `<li><b>${e.nome}</b> (${e.tipo})<br>
        <small>${e.distrito} • ${(d / 1000).toFixed(2)} km • lucro/dia ${dinheiro(e.lucroOntem)}</small><br>
        <b>${dinheiro(j.valorEmpresa(e))}</b>
        <button class="btn mini" data-acao="comprar-empresa" data-empresa="${e.id}">Comprar</button></li>`).join('');
    const tipos = Object.keys(NEGOCIOS).map((k) => `<option value="${k}">${NEGOCIOS[k].nome}</option>`).join('');
    const lotesLivres = jogo.mundo.grade.proximos(j.x, j.z, 700).filter((l) => !jogo.empresas.doLote(l.id)).slice(0, 20)
      .map((l) => `<option value="${l.id}">${l.nome} (${l.distrito})</option>`).join('');
    return `<h3>📊 Empresas</h3>
      <h4>Suas empresas</h4><ul class="lista">${minhas || '<li class="muted">Nenhuma empresa ainda</li>'}</ul>
      <h4>Abrir nova empresa</h4>
      <div class="linha"><select id="tipo-empresa">${tipos}</select><select id="lote-empresa">${lotesLivres}</select></div>
      <button class="btn" data-acao="abrir-empresa">Abrir empresa</button>
      <h4>Negócios à venda perto</h4><ul class="lista">${aVenda}</ul>`;
  }

  app_noticias() {
    const n = this.jogo.noticias.manchetes.slice(0, 22)
      .map((m) => `<li><span class="tag">${m.secao}</span> ${m.titulo}<br><small class="muted">Dia ${m.dia} • ${m.hora}${m.local ? ` • ${m.local}` : ''}</small></li>`).join('');
    return `<h3>📰 Diário Cidade Viva</h3><ul class="lista noticias">${n || '<li class="muted">Sem notícias ainda</li>'}</ul>`;
  }

  app_mercado() {
    const eco = this.jogo.economia;
    const linhas = Object.values(eco.setores).map((s) => {
      const ant = s.historico[s.historico.length - 2] || s.preco;
      const var1 = ((s.preco / ant - 1) * 100);
      return `<li>${s.nome}<b>${dinheiro(s.preco)}</b><span class="${var1 >= 0 ? 'pos' : 'neg'}">${var1 >= 0 ? '▲' : '▼'} ${Math.abs(var1).toFixed(2)}%</span></li>`;
    }).join('');
    const h = eco.historicoIndices.slice(-10).reverse()
      .map((i) => `<li>Dia ${i.dia}: preços ${(i.precos * 100).toFixed(0)} • inflação ${(i.inflacao * 100).toFixed(1)}% • PIB dia ${dinheiroCurto(i.pib)}</li>`).join('');
    return `<h3>📈 Mercado</h3>
      <div class="card">Inflação <b>${(eco.inflacaoAnual * 100).toFixed(2)}%</b> a.a. • Juros <b>${(eco.taxaJuros * 100).toFixed(2)}%</b> a.m.<br>
      Desemprego <b>${(eco.desemprego * 100).toFixed(1)}%</b> • Confiança <b>${(eco.confianca * 100).toFixed(0)}%</b><br>
      Índice imobiliário <b>${(eco.indiceImoveis * 100).toFixed(1)}</b></div>
      <ul class="lista precos">${linhas}</ul>
      <h4>Histórico</h4><ul class="lista">${h}</ul>`;
  }

  app_contatos() {
    const jogo = this.jogo, j = jogo.jogador;
    const perto = jogo.agentes.proximos.slice(0, 10);
    const lista = [...j.contatos.map((id) => jogo.agentes.porId(id)).filter(Boolean), ...perto]
      .slice(0, 16)
      .map((a) => `<li><b>${a.nome}</b>, ${a.idade} anos<br>
        <small>${a.profissao} • ${a.estado} • humor ${(a.humor * 100).toFixed(0)}%</small><br>
        <small class="muted">${a.memoria.length ? a.memoria[a.memoria.length - 1].texto : 'Sem registros recentes'}</small><br>
        <button class="btn mini" data-acao="ligar" data-agente="${a.id}">Conversar</button></li>`).join('');
    return `<h3>👥 Contatos e pessoas por perto</h3><ul class="lista">${lista || '<li class="muted">Ninguém por perto</li>'}</ul>`;
  }

  app_transporte() {
    const jogo = this.jogo;
    const vilas = jogo.mundo.vilas.map((v, i) => `<li><b>${v.nome}</b> — ${(dist(jogo.jogador.x, jogo.jogador.z, v.centro.x, v.centro.z) / 1000).toFixed(1)} km
      <button class="btn mini" data-acao="viagem" data-vila="${i}">Viajar de ônibus</button></li>`).join('');
    const vs = jogo.jogador.veiculos.map((v) => `<li>${v.nome} — combustível ${(v.combustivel * 100).toFixed(0)}% • estado ${(v.estado * 100).toFixed(0)}%</li>`).join('');
    return `<h3>🚕 Transporte</h3>
      <div class="card">Destino GPS: <b>${this.gps ? this.gps.nome : 'nenhum'}</b><br>
      <button class="btn mini" data-acao="taxi">Chamar táxi</button></div>
      <h4>Seus veículos</h4><ul class="lista">${vs}</ul>
      <h4>Viagens intermunicipais</h4><ul class="lista">${vilas}</ul>`;
  }

  app_plano() {
    const jogo = this.jogo, j = jogo.jogador;
    const alvos = jogo.mundo.grade.proximos(j.x, j.z, 1400)
      .filter((l) => ['banco', 'supermercado', 'loja', 'posto', 'mansao'].includes(l.tipo))
      .slice(0, 14)
      .map((l) => `<option value="${l.id}">${l.nome} — segurança ${(l.seguranca * 100).toFixed(0)}% • ${l.camerasQtd} câmeras</option>`).join('');
    const p = jogo.crime.planoJogador;
    const processos = jogo.justica.processos.filter((x) => x.reu === 'jogador')
      .map((x) => `<li>${x.id} — ${x.acusacao} — ${x.aberto ? `em andamento (${x.etapa + 1}/9)` : x.resultado.texto}</li>`).join('');
    return `<h3>🗂️ Operações e situação legal</h3>
      <div class="card"><b>Notoriedade:</b> ${(j.notoriedade * 100).toFixed(0)}% •
      <b>Ficha:</b> ${j.fichaCriminal.length} registro(s) •
      <b>Mandados:</b> ${jogo.policia.mandados.filter((m) => m.alvo === 'jogador').length}</div>
      <h4>Defesa jurídica</h4>
      <div class="linha">
        <button class="btn mini" data-acao="advogado" data-q="0.4">Advogado padrão (R$ 14.400)</button>
        <button class="btn mini" data-acao="advogado" data-q="0.8">Escritório renomado (R$ 24.800)</button>
      </div>
      <h4>Processos</h4><ul class="lista">${processos || '<li class="muted">Nenhum processo</li>'}</ul>
      <h4>Planejamento (simulação ficcional)</h4>
      <p class="muted">O jogo avalia apenas variáveis abstratas: equipe, veículos, horário e abordagem. Nada aqui descreve técnicas reais.</p>
      <div class="linha"><select id="plano-alvo">${alvos}</select></div>
      <div class="linha">
        <label>Equipe<input id="plano-equipe" type="number" min="1" max="8" value="3"></label>
        <label>Veículos<input id="plano-veiculos" type="number" min="1" max="4" value="1"></label>
      </div>
      <div class="linha">
        <select id="plano-horario"><option value="manha">Manhã</option><option value="tarde">Tarde</option>
          <option value="noite">Noite</option><option value="madrugada">Madrugada</option></select>
        <select id="plano-estilo"><option value="discreto">Discreto</option><option value="rapido">Rápido</option>
          <option value="ostensivo">Ostensivo</option></select>
      </div>
      <button class="btn" data-acao="plano-criar">Registrar plano</button>
      ${p ? `<div class="card">Risco estimado ${(p.risco * 100).toFixed(0)}% • chance de êxito ${(p.sucesso * 100).toFixed(0)}%<br>
        <button class="btn" data-acao="plano-executar">Executar operação</button></div>` : ''}`;
  }

  app_ajustes() {
    const t = this.jogo.tempo;
    const vel = [1, 10, 30, 60, 120, 300].map((v) => `<button class="btn mini" data-acao="velocidade" data-v="${v}">${v}×</button>`).join('');
    const est = this.jogo.mundo.estatisticas;
    return `<h3>⚙️ Ajustes</h3>
      <div class="card"><b>Velocidade do tempo:</b> ${t.escala}×<div class="linha">${vel}</div></div>
      <div class="card"><b>Mundo</b><br>Semente ${this.jogo.mundo.semente}<br>
        ${est.lotes} lotes • ${est.nos} nós viários • ${est.arestas} vias • ${est.parques} parques<br>
        ${this.jogo.agentes.lista.length} agentes • ${this.jogo.empresas.lista.length} empresas •
        ${this.jogo.natureza.animais.length} animais</div>
      <div class="card"><b>Controles</b><br>WASD mover • Shift correr • E interagir • F entrar/sair do veículo •
      Tab telefone • M mapa • C câmera • P pausa</div>`;
  }
}
