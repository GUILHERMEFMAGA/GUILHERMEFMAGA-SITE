// =====================================================================
// LIFE: CIDADE VIVA — ponto de entrada
// Monta o mundo, liga todos os sistemas e roda o laço principal.
// =====================================================================
import { criarRNG, Barramento, clamp, dist, dinheiro } from './util/nucleo.js';
import { gerarMundo, TIPOS } from './mundo/gerador.js';
import { Renderizador } from './mundo/render.js';
import { Tempo } from './sim/tempo.js';
import { Economia } from './sim/economia.js';
import { Banco } from './sim/banco.js';
import { Empresas } from './sim/empresas.js';
import { Agentes } from './sim/agentes.js';
import { Transito } from './sim/transito.js';
import { Crime } from './sim/crime.js';
import { Policia, Emergencia } from './sim/policia.js';
import { Justica } from './sim/justica.js';
import { Eventos } from './sim/eventos.js';
import { Natureza } from './sim/natureza.js';
import { Noticias, MemoriaMundo } from './sim/noticias.js';
import { Jogador } from './jogador.js';
import { UI } from './ui/interface.js';

class Jogo {
  constructor(semente) {
    this.semente = semente;
    this.rng = criarRNG(semente);
    this.barramento = new Barramento();
    this.pausado = false;
    this.teclas = new Set();
  }

  async iniciar(progresso) {
    const passo = async (texto, fn) => {
      progresso(texto);
      await new Promise((r) => setTimeout(r, 12));
      return fn();
    };

    this.tempo = new Tempo(this, { hora: 7.4, escala: 60 });
    this.economia = new Economia(this);
    this.banco = new Banco(this);

    await passo('Gerando relevo, rios e malha viária…', () => { this.mundo = gerarMundo(this.semente); this.mundo.TIPOS = TIPOS; });
    await passo('Levantando bairros, quadras e edifícios…', () => { this.banco.conectarMundo(this.mundo); });
    this.jogador = new Jogador(this, 'Alex Moraes');
    this.empresas = new Empresas(this);
    await passo('Abrindo empresas e contratando equipes…', () => this.empresas.criarDoMundo(this.mundo));
    this.agentes = new Agentes(this);
    await passo('Dando vida a milhares de moradores…', () => this.agentes.popular(5200));
    this.transito = new Transito(this);
    this.policia = new Policia(this);
    this.emergencia = new Emergencia(this);
    this.crime = new Crime(this);
    this.justica = new Justica(this);
    this.memoriaMundo = new MemoriaMundo(this);
    this.noticias = new Noticias(this);
    this.eventos = new Eventos(this);
    this.natureza = new Natureza(this);
    await passo('Soltando o trânsito nas ruas…', () => this.transito.iniciar());
    await passo('Escalando turnos da polícia e emergências…', () => { this.policia.iniciar(); this.crime.iniciar(); });
    await passo('Povoando florestas, fazendas e quintais…', () => this.natureza.popular());
    await passo('Preparando sua vida na cidade…', () => this.jogador.iniciar());

    await passo('Construindo a cidade em 3D…', () => {
      this.render = new Renderizador(this, document.querySelector('#cena'));
      this.render.construir();
    });

    this.ui = new UI(this);
    this.noticias.atualizarAnuncios();
    this.noticias.registrar('urbano', 'Bem-vindo a Cidade Viva. A cidade já estava funcionando antes de você chegar.');
    this.ligarControles();
    this.ligarDiario();

    progresso('Pronto!');
    this.ultimo = performance.now();
    requestAnimationFrame((t) => this.laco(t));
  }

  ligarDiario() {
    this.barramento.em('novo-dia', () => {
      this.economia.passoDiario();
      this.banco.passoDiario();
      this.empresas.passoDiario();
      this.agentes.passoDiario();
      this.policia.passoDiario();
      this.memoriaMundo.passoDiario();
      this.jogador.passoDiario();
      this.noticias.atualizarAnuncios();
    });
    this.barramento.em('nova-hora', () => {
      // comentários do mundo perto do jogador
      const m = this.memoriaMundo.comentarioLocal(this.jogador.x, this.jogador.z);
      if (m && this.rng() < 0.4) this.ui.feed(`🗣️ Comentam no bairro: ${m.texto}`, true);
    });
  }

  // ------------------------------------------------------------------
  ligarControles() {
    const canvas = document.querySelector('#cena');
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      this.teclas.add(k);
      if (k === 'tab') { e.preventDefault(); this.ui.telefone.alternar(); }
      if (k === 'm') { this.ui.telefone.alternar(true); this.ui.telefone.abrirApp('mapa'); }
      if (k === 'e') this.interagir();
      if (k === 'f') this.alternarVeiculo();
      if (k === 'c') this.render.orbita.primeiraPessoa = !this.render.orbita.primeiraPessoa;
      if (k === 'p') this.pausado = !this.pausado;
      if (k === 'escape') { this.ui.fecharModal(); this.ui.telefone.alternar(false); }
      if (k === '+' || k === '=') this.tempo.escala = Math.min(600, this.tempo.escala * 2);
      if (k === '-') this.tempo.escala = Math.max(1, Math.floor(this.tempo.escala / 2));
    });
    window.addEventListener('keyup', (e) => this.teclas.delete(e.key.toLowerCase()));

    let arrastando = false, lx = 0, ly = 0;
    canvas.addEventListener('mousedown', (e) => { arrastando = true; lx = e.clientX; ly = e.clientY; });
    window.addEventListener('mouseup', () => { arrastando = false; });
    window.addEventListener('mousemove', (e) => {
      if (!arrastando) return;
      const o = this.render.orbita;
      o.yaw -= (e.clientX - lx) * 0.005;
      o.pitch = clamp(o.pitch + (e.clientY - ly) * 0.003, -0.25, 1.1);
      lx = e.clientX; ly = e.clientY;
    });
    canvas.addEventListener('wheel', (e) => {
      const o = this.render.orbita;
      o.dist = clamp(o.dist + e.deltaY * 0.01, 3, 40);
    }, { passive: true });
  }

  loteProximo(raio = 22) {
    const j = this.jogador;
    const perto = this.mundo.grade.proximos(j.x, j.z, 60);
    let melhor = null, md = raio;
    for (const l of perto) {
      const d = dist(j.x, j.z, l.x, l.z) - l.tam * 0.45;
      if (d < md) { md = d; melhor = l; }
    }
    return melhor;
  }

  interagir() {
    if (this.ui.modalAberto) return;
    const lote = this.loteProximo(24);
    if (!lote) { this.ui.feed('🤷 Nada por perto para interagir.'); return; }
    this.ui.interior.entrar(lote);
  }

  alternarVeiculo() {
    const j = this.jogador;
    if (j.estado === 'dirigindo') {
      j.estado = 'livre';
      if (j.veiculoAtual) { j.veiculoAtual.x = j.x; j.veiculoAtual.z = j.z; }
      this.ui.feed('🚶 Você saiu do veículo.');
      return;
    }
    const v = j.veiculos.find((car) => dist(j.x, j.z, car.x, car.z) < 60) || j.veiculos[0];
    if (!v) { this.ui.feed('❌ Você não possui veículos.'); return; }
    if (dist(j.x, j.z, v.x, v.z) > 60) { this.ui.feed(`🚗 Seu ${v.nome} está longe (${(dist(j.x, j.z, v.x, v.z) / 1000).toFixed(2)} km). Chame um táxi pelo telefone.`); return; }
    if (v.combustivel <= 0.02) { this.ui.feed('⛽ Tanque vazio. Procure um posto.'); return; }
    j.veiculoAtual = v; j.estado = 'dirigindo';
    j.x = v.x; j.z = v.z;
    this.ui.feed(`🚗 Você entrou no ${v.nome}.`);
  }

  moverJogador(dt) {
    const j = this.jogador;
    if (j.estado === 'preso' || this.ui.modalAberto) return;
    const o = this.render.orbita;
    const t = this.teclas;
    const frente = (t.has('w') ? 1 : 0) - (t.has('s') ? 1 : 0);
    const lado = (t.has('d') ? 1 : 0) - (t.has('a') ? 1 : 0);

    if (j.estado === 'dirigindo') {
      const v = j.veiculoAtual;
      const acel = frente * (t.has('shift') ? 26 : 16);
      j.velocidade += (acel - j.velocidade * 0.6) * dt;
      j.velocidade = clamp(j.velocidade, -14, 46);
      if (Math.abs(j.velocidade) > 0.2) j.ang -= lado * dt * 1.5 * clamp(Math.abs(j.velocidade) / 14, 0.2, 1) * Math.sign(j.velocidade);
      const nx = j.x + Math.sin(j.ang) * j.velocidade * dt;
      const nz = j.z + Math.cos(j.ang) * j.velocidade * dt;
      this.tentarMover(nx, nz, 2.2);
      v.combustivel = clamp(v.combustivel - Math.abs(j.velocidade) * dt * 0.00035, 0, 1);
      if (v.combustivel <= 0) { this.ui.feed('⛽ O veículo ficou sem combustível.'); j.estado = 'livre'; }
      v.x = j.x; v.z = j.z;
      o.yaw = o.yaw * 0.9 + j.ang * 0.1;
    } else {
      const vel = (t.has('shift') ? 6.4 : 2.6) * (j.necessidades.energia > 0.15 ? 1 : 0.5);
      if (frente || lado) {
        const dirX = Math.sin(o.yaw) * frente + Math.cos(o.yaw) * lado;
        const dirZ = Math.cos(o.yaw) * frente - Math.sin(o.yaw) * lado;
        const L = Math.hypot(dirX, dirZ) || 1;
        const nx = j.x + (dirX / L) * vel * dt;
        const nz = j.z + (dirZ / L) * vel * dt;
        j.ang = Math.atan2(dirX, dirZ);
        this.tentarMover(nx, nz, 0.8);
        if (t.has('shift')) j.necessidades.energia = clamp(j.necessidades.energia - dt * 0.004, 0, 1);
      }
      j.velocidade = 0;
    }
    // limites do mundo
    const lim = this.mundo.tamanho / 2 - 20;
    j.x = clamp(j.x, -lim, lim); j.z = clamp(j.z, -lim, lim);
  }

  tentarMover(nx, nz, raio) {
    const j = this.jogador;
    const lotes = this.mundo.grade.proximos(nx, nz, 40);
    for (const l of lotes) {
      if (l.tipo === 'fazenda' || l.altura < 2) continue;
      const meia = l.tam * 0.42 + raio;
      const dx = nx - l.x, dz = nz - l.z;
      const c = Math.cos(-l.rot), s = Math.sin(-l.rot);
      const rx = dx * c - dz * s, rz = dx * s + dz * c;
      if (Math.abs(rx) < meia && Math.abs(rz) < meia) return; // bloqueado
    }
    j.x = nx; j.z = nz;
  }

  atualizarPrompt() {
    const lote = this.loteProximo(24);
    if (!lote || this.ui.modalAberto) { this.ui.prompt(null); return; }
    const e = this.empresas.doLote(lote.id);
    const aberto = e ? (this.empresas.abertaAgora(e) ? 'aberto' : 'fechado') : '';
    this.ui.prompt(`<b>E</b> — entrar em <b>${lote.nome}</b> <span class="muted">${TIPOS[lote.tipo].nome}${aberto ? ' • ' + aberto : ''}</span>`);
  }

  laco(agora) {
    const dtReal = Math.min(0.05, (agora - this.ultimo) / 1000);
    this.ultimo = agora;
    if (!this.pausado) {
      this.tempo.avancar(dtReal);
      this.moverJogador(dtReal);
      this.jogador.atualizar(dtReal);
      this.transito.atualizar(dtReal);
      this.agentes.atualizar(dtReal, this.tempo.hora);
      this.natureza.atualizar(dtReal);
      this.crime.atualizar(dtReal);
      this.policia.atualizar(dtReal);
      this.emergencia.atualizar(dtReal);
      this.justica.atualizar(dtReal);
      this.eventos.atualizar(dtReal);
    }
    this.render.atualizar(dtReal);
    this.ui.atualizar(dtReal);
    this.atualizarPrompt();
    if (this.ui.telefone.aberto && (performance.now() - (this._ultTel || 0)) > 1500) {
      this._ultTel = performance.now();
      if (['banco', 'mercado', 'noticias', 'empresas'].includes(this.ui.telefone.app)) this.ui.telefone.render();
    }
    requestAnimationFrame((t) => this.laco(t));
  }
}

// ---------------------------------------------------------------------
const carregando = document.querySelector('#carregando');
const statusTexto = document.querySelector('#carregando-status');
const barra = document.querySelector('#carregando-barra i');
let etapa = 0;
const TOTAL = 10;

const semente = parseInt(new URLSearchParams(location.search).get('semente') || '20261001', 10);
const jogo = new Jogo(semente);
window.JOGO = jogo;

jogo.iniciar((texto) => {
  statusTexto.textContent = texto;
  etapa++;
  barra.style.width = `${Math.min(100, (etapa / TOTAL) * 100)}%`;
}).then(() => {
  setTimeout(() => carregando.classList.add('oculto'), 400);
}).catch((err) => {
  statusTexto.innerHTML = `<b style="color:#ff8080">Falha ao iniciar:</b><br>${err.message}<br><small>${err.stack || ''}</small>`;
  console.error(err);
});
