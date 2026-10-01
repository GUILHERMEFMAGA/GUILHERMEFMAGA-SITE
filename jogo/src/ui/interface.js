// =====================================================================
// INTERFACE — HUD, feed de cidade, prompts, mapa, modais (processo/prisão)
// =====================================================================
import { clamp, dinheiro, dinheiroCurto } from '../util/nucleo.js';
import { Telefone } from './telefone.js';
import { Interior } from './interior.js';
import { TAM_MUNDO } from '../mundo/gerador.js';

const $ = (sel) => document.querySelector(sel);

export class UI {
  constructor(jogo) {
    this.jogo = jogo;
    this.telefone = new Telefone(jogo, this);
    this.interior = new Interior(jogo, this);
    this.feedItens = [];
    this.mapaAberto = false;
    this.pausado = false;
    this.alvoInteracao = null;
    this.montar();
    jogo.barramento.em('noticia', (n) => { if (['policia', 'urbano'].includes(n.secao)) this.feed(`📰 ${n.titulo}`, true); });
    jogo.barramento.em('cadeia', ({ passo }) => this.feed(`🔗 ${passo}`, true));
  }

  montar() {
    this.el = {
      relogio: $('#relogio'), data: $('#data'), clima: $('#clima'),
      dinheiro: $('#hud-dinheiro'), banco: $('#hud-banco'), feed: $('#feed'),
      prompt: $('#prompt'), necessidades: $('#necessidades'), status: $('#status-cidade'),
      minimapa: $('#minimapa'), modal: $('#modal'), modalConteudo: $('#modal-conteudo'),
      aviso: $('#aviso'), velocidade: $('#velocidade'),
    };
    this.ctxMini = this.el.minimapa.getContext('2d');
    $('#modal-fechar').addEventListener('click', () => this.fecharModal());
  }

  // --- Mensagens ----------------------------------------------------
  feed(texto, discreto = false) {
    this.feedItens.unshift({ texto, hora: this.jogo.tempo.rotulo, discreto });
    if (this.feedItens.length > 40) this.feedItens.pop();
    this.el.feed.innerHTML = this.feedItens.slice(0, 9)
      .map((f, i) => `<div class="feed-item${f.discreto ? ' discreto' : ''}" style="opacity:${1 - i * 0.1}"><span>${f.hora}</span> ${f.texto}</div>`)
      .join('');
  }

  aviso(texto) {
    this.el.aviso.textContent = texto;
    this.el.aviso.classList.add('visivel');
    clearTimeout(this._avisoTimer);
    this._avisoTimer = setTimeout(() => this.el.aviso.classList.remove('visivel'), 6000);
  }

  prompt(texto) {
    if (texto) { this.el.prompt.innerHTML = texto; this.el.prompt.classList.add('visivel'); }
    else this.el.prompt.classList.remove('visivel');
  }

  // --- Modal genérico -----------------------------------------------
  abrirModal(titulo, html, aoMontar) {
    this.el.modalConteudo.innerHTML = `<h2>${titulo}</h2>${html}`;
    this.el.modal.classList.add('visivel');
    this.pausado = false;
    if (aoMontar) aoMontar(this.el.modalConteudo);
  }
  fecharModal() {
    this.el.modal.classList.remove('visivel');
    this.interior.sair();
  }
  get modalAberto() { return this.el.modal.classList.contains('visivel'); }

  // --- Processo judicial / presídio -----------------------------------
  abrirProcesso(p) {
    this.processoAtual = p;
    this.abrirModal('⚖️ Processo judicial', this.htmlProcesso(p));
  }
  atualizarProcesso(p) {
    if (this.processoAtual === p && this.modalAberto) {
      this.el.modalConteudo.innerHTML = `<h2>⚖️ Processo judicial</h2>${this.htmlProcesso(p)}`;
    }
  }
  htmlProcesso(p) {
    const etapas = p.linha.map((l) => `<li><b>${l.etapa}</b> <span class="muted">${l.hora}</span><br>${l.texto}</li>`).join('');
    return `
      <div class="card">
        <p><b>Processo:</b> ${p.id} &nbsp; <b>Acusação:</b> ${p.acusacao}</p>
        <p><b>Força das provas:</b> ${(p.provas * 100).toFixed(0)}% &nbsp; <b>Antecedentes:</b> ${p.antecedentes}</p>
        <p><b>Defesa:</b> ${p.advogado ? `${p.advogado.nome} (qualidade ${(p.advogado.qualidade * 100).toFixed(0)}%)` : 'Defensoria pública'}</p>
      </div>
      <ol class="linha-tempo">${etapas || '<li>Aguardando primeira etapa…</li>'}</ol>
      ${p.aberto ? '<p class="muted">O tempo continua passando. Você pode fechar esta janela e acompanhar pelo telefone.</p>' : ''}`;
  }

  abrirPresidio(dias) {
    const j = this.jogo.jogador;
    this.abrirModal('🔒 Penitenciária Pedra Cinza', `
      <div class="card">
        <p>Você foi encarcerado. Pena restante: <b id="pena-dias">${dias}</b> dias.</p>
        <p class="muted">A cidade continua funcionando sem você: empresas operam, NPCs trabalham, a polícia atende ocorrências e a economia muda.</p>
      </div>
      <div class="grade">
        <div class="card"><b>Rotina da unidade</b><ul>
          <li>06:00 — contagem e café</li><li>08:00 — trabalho interno / oficina</li>
          <li>12:00 — refeitório</li><li>14:00 — pátio e visitas</li>
          <li>18:00 — jantar</li><li>21:00 — recolhimento</li></ul></div>
        <div class="card"><b>Ações</b>
          <button class="btn" id="btn-pena-1">Cumprir 1 dia</button>
          <button class="btn" id="btn-pena-7">Cumprir 7 dias</button>
          <button class="btn" id="btn-pena-tudo">Cumprir pena inteira</button>
          <p class="muted">Tempo na oficina melhora condicionamento e disciplina.</p>
        </div>
      </div>`, (root) => {
      const atualizar = () => {
        const el = root.querySelector('#pena-dias');
        if (el) el.textContent = Math.max(0, Math.ceil(j.diasPreso));
        if (j.diasPreso <= 0) this.fecharModal();
      };
      root.querySelector('#btn-pena-1').onclick = () => { j.cumprirPena(1); atualizar(); };
      root.querySelector('#btn-pena-7').onclick = () => { j.cumprirPena(7); atualizar(); };
      root.querySelector('#btn-pena-tudo').onclick = () => { j.cumprirPena(Math.ceil(j.diasPreso)); atualizar(); };
    });
  }

  // --- Loop de UI ------------------------------------------------------
  atualizar(dt) {
    const jogo = this.jogo, t = jogo.tempo, j = jogo.jogador;
    this.el.relogio.textContent = t.rotulo;
    this.el.data.textContent = t.data;
    const clima = t.infoInterp();
    const icone = { Ensolarado: '☀️', Nublado: '☁️', Chuva: '🌧️', Tempestade: '⛈️', Neblina: '🌫️', Ventania: '💨' }[clima.nome] || '🌤️';
    this.el.clima.textContent = `${icone} ${clima.nome}`;
    this.el.dinheiro.textContent = dinheiro(j.carteira);
    this.el.banco.textContent = dinheiro(j.conta ? j.conta.saldo : 0);
    this.el.velocidade.textContent = `${t.escala}×`;

    const n = j.necessidades;
    this.el.necessidades.innerHTML = [
      ['🍽️', 1 - clamp(n.fome, 0, 1)], ['⚡', n.energia], ['💬', n.social], ['🎮', n.diversao], ['🚿', n.higiene], ['❤️', j.saude],
    ].map(([ic, v]) => `<div class="barra" title="${ic}"><span>${ic}</span><i style="width:${(v * 100).toFixed(0)}%;background:${v > 0.5 ? '#4fd27a' : v > 0.25 ? '#e8c04a' : '#e05454'}"></i></div>`).join('');

    const est = jogo.agentes.estatisticas;
    this.el.status.innerHTML = `
      <span title="População simulada">👥 ${jogo.agentes.lista.length}</span>
      <span title="Trabalhando agora">🏢 ${est.trabalhando}</span>
      <span title="Veículos em circulação">🚗 ${jogo.transito.veiculos.length}</span>
      <span title="Ocorrências policiais ativas">🚔 ${jogo.policia.ocorrencias.filter((o) => o.estado !== 'encerrada').length}</span>
      <span title="Crimes em andamento">🚨 ${jogo.crime.ativos.length}</span>
      <span title="Eventos dinâmicos">⚡ ${jogo.eventos.ativos.length}</span>
      <span title="Inflação anual">📈 ${(jogo.economia.inflacaoAnual * 100).toFixed(1)}%</span>
      <span title="Desemprego">💼 ${(jogo.economia.desemprego * 100).toFixed(1)}%</span>`;

    this.desenharMinimapa();
  }

  desenharMinimapa() {
    const g = this.ctxMini;
    const jogo = this.jogo, j = jogo.jogador;
    const W = this.el.minimapa.width, H = this.el.minimapa.height;
    const alcance = 420;
    g.clearRect(0, 0, W, H);
    const fonte = jogo.render?.texturaMapa;
    if (fonte) {
      const esc = fonte.width / TAM_MUNDO;
      const sx = (j.x + TAM_MUNDO / 2) * esc - alcance * esc;
      const sy = (j.z + TAM_MUNDO / 2) * esc - alcance * esc;
      const s = alcance * 2 * esc;
      g.save();
      g.beginPath(); g.arc(W / 2, H / 2, W / 2 - 2, 0, 7); g.clip();
      g.drawImage(fonte, sx, sy, s, s, 0, 0, W, H);
      const px = (x, z) => [((x - j.x) / (alcance * 2) + 0.5) * W, ((z - j.z) / (alcance * 2) + 0.5) * H];
      // veículos de emergência e ocorrências
      for (const oc of jogo.policia.ocorrencias) {
        if (oc.estado === 'encerrada') continue;
        const [a, b] = px(oc.x, oc.z);
        g.fillStyle = '#ff4444'; g.beginPath(); g.arc(a, b, 4, 0, 7); g.fill();
      }
      for (const ev of jogo.eventos.ativos) {
        const [a, b] = px(ev.x, ev.z);
        g.fillStyle = '#ffc24a'; g.fillRect(a - 2, b - 2, 4, 4);
      }
      for (const u of jogo.policia.unidades) {
        if (u.estado === 'fora-de-servico') continue;
        const [a, b] = px(u.x, u.z);
        g.fillStyle = '#4aa3ff'; g.fillRect(a - 1.5, b - 1.5, 3, 3);
      }
      g.restore();
    }
    // jogador
    g.save();
    g.translate(W / 2, H / 2); g.rotate(-jogo.jogador.ang);
    g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(0, -7); g.lineTo(5, 6); g.lineTo(0, 3); g.lineTo(-5, 6); g.closePath(); g.fill();
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 2;
    g.beginPath(); g.arc(W / 2, H / 2, W / 2 - 2, 0, 7); g.stroke();
  }
}
