// =====================================================================
// LIFE: CIDADE VIVA — utilidades de núcleo
// RNG determinístico, matemática, nomes fictícios e barramento de eventos.
// =====================================================================

export function criarRNG(semente = 20261001) {
  let a = semente >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist2 = (ax, az, bx, bz) => { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; };
export const dist = (ax, az, bx, bz) => Math.sqrt(dist2(ax, az, bx, bz));

export function escolher(rng, lista) { return lista[Math.floor(rng() * lista.length) % lista.length]; }
export function inteiro(rng, a, b) { return Math.floor(a + rng() * (b - a + 1)); }
export function faixa(rng, a, b) { return a + rng() * (b - a); }
export function chance(rng, p) { return rng() < p; }

export function pesoEscolher(rng, pares) {
  // pares: [[valor, peso], ...]
  let total = 0;
  for (const p of pares) total += p[1];
  let r = rng() * total;
  for (const p of pares) { r -= p[1]; if (r <= 0) return p[0]; }
  return pares[pares.length - 1][0];
}

export function dinheiro(v) {
  const n = Math.round(v);
  const sinal = n < 0 ? '-' : '';
  const s = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sinal}R$ ${s}`;
}

export function dinheiroCurto(v) {
  const a = Math.abs(v);
  if (a >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return v.toFixed(0);
}

// --------------------------------------------------------------------
// Nomes fictícios (nenhuma referência a pessoas ou marcas reais)
// --------------------------------------------------------------------
export const NOMES_M = ['Aldo', 'Bento', 'Caio', 'Dalmo', 'Elias', 'Fabrício', 'Gaspar', 'Heitor', 'Ivan', 'Jorel',
  'Kauê', 'Lauro', 'Murilo', 'Nestor', 'Otávio', 'Pedrín', 'Quirino', 'Rafael', 'Saulo', 'Teobaldo', 'Ubirajara',
  'Vilmar', 'Wander', 'Xisto', 'Yuri', 'Zacarias', 'Amaro', 'Brício', 'Clóvis', 'Dorval', 'Edmar', 'Fausto'];
export const NOMES_F = ['Alzira', 'Brenda', 'Cláudia', 'Doralice', 'Elza', 'Fabíola', 'Gilda', 'Helena', 'Irene',
  'Joana', 'Kelly', 'Lúcia', 'Marina', 'Nádia', 'Olívia', 'Priscila', 'Quitéria', 'Rute', 'Sandra', 'Tereza',
  'Ursula', 'Vera', 'Wilma', 'Ximena', 'Yara', 'Zélia', 'Alaíde', 'Bianca', 'Celina', 'Dirce', 'Eunice'];
export const SOBRENOMES = ['Andrade', 'Barcelos', 'Camargo', 'Dantas', 'Esteves', 'Furtado', 'Guedes', 'Hirata',
  'Ibrahim', 'Jurema', 'Klein', 'Lustosa', 'Maranhão', 'Novaes', 'Ortiz', 'Peçanha', 'Queiroz', 'Rosário',
  'Sampaio', 'Trindade', 'Uchoa', 'Valadares', 'Wagner', 'Xavier', 'Yamada', 'Zambrano', 'Bastos', 'Correia'];

export function nomeAleatorio(rng) {
  const fem = rng() < 0.5;
  const pri = escolher(rng, fem ? NOMES_F : NOMES_M);
  const sob = escolher(rng, SOBRENOMES);
  return { nome: `${pri} ${sob}`, genero: fem ? 'F' : 'M' };
}

const PREFIXO_EMPRESA = ['Nova', 'Vale', 'Aurora', 'Prisma', 'Boreal', 'Lumina', 'Âncora', 'Meridiano', 'Vértice',
  'Sertão', 'Horizonte', 'Pedra', 'Trilho', 'Marés', 'Cedro', 'Alvorada', 'Pilar', 'Rota', 'Fênix', 'Oriz'];
const SUFIXO_EMPRESA = ['Ltda', 'S/A', '& Cia', 'Group', 'Holding', 'Serviços', 'Comércio', 'Indústria'];

export function nomeEmpresa(rng, tipoNome) {
  return `${escolher(rng, PREFIXO_EMPRESA)} ${tipoNome} ${chance(rng, 0.35) ? escolher(rng, SUFIXO_EMPRESA) : ''}`.trim();
}

// --------------------------------------------------------------------
// Barramento de eventos — todos os sistemas conversam por aqui
// --------------------------------------------------------------------
export class Barramento {
  constructor() { this.ouvintes = new Map(); }
  em(tipo, fn) {
    if (!this.ouvintes.has(tipo)) this.ouvintes.set(tipo, []);
    this.ouvintes.get(tipo).push(fn);
    return () => this.remover(tipo, fn);
  }
  remover(tipo, fn) {
    const l = this.ouvintes.get(tipo); if (!l) return;
    const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1);
  }
  emitir(tipo, dados) {
    const l = this.ouvintes.get(tipo);
    if (l) for (let i = 0; i < l.length; i++) l[i](dados);
    const g = this.ouvintes.get('*');
    if (g) for (let i = 0; i < g.length; i++) g[i](tipo, dados);
  }
}

// Fila de prioridade simples (usada por A* e por despacho de emergência)
export class FilaPrioridade {
  constructor() { this.itens = []; }
  get tamanho() { return this.itens.length; }
  inserir(item, prioridade) {
    this.itens.push({ item, prioridade });
    let i = this.itens.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.itens[p].prioridade <= this.itens[i].prioridade) break;
      [this.itens[p], this.itens[i]] = [this.itens[i], this.itens[p]];
      i = p;
    }
  }
  remover() {
    const topo = this.itens[0];
    const fim = this.itens.pop();
    if (this.itens.length > 0) {
      this.itens[0] = fim;
      let i = 0;
      for (;;) {
        const e = 2 * i + 1, d = 2 * i + 2; let m = i;
        if (e < this.itens.length && this.itens[e].prioridade < this.itens[m].prioridade) m = e;
        if (d < this.itens.length && this.itens[d].prioridade < this.itens[m].prioridade) m = d;
        if (m === i) break;
        [this.itens[m], this.itens[i]] = [this.itens[i], this.itens[m]];
        i = m;
      }
    }
    return topo ? topo.item : null;
  }
}
