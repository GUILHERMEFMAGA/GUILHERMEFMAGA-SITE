// =====================================================================
// GERADOR PROCEDURAL DO MUNDO
// Produz APENAS dados (grafo viário, quadras, lotes, água, floresta).
// A renderização 3D e a simulação leem a mesma estrutura.
// =====================================================================
import { criarRNG, escolher, inteiro, faixa, chance, pesoEscolher, nomeEmpresa, dist } from '../util/nucleo.js';

export const TAM_MUNDO = 4200;          // mundo quadrado de 4,2 km
export const ESP_QUADRA = 115;          // espaçamento entre eixos de rua
export const LARG_RUA = 16;
export const LARG_AVENIDA = 26;
export const LARG_RODOVIA = 22;

// Catálogo de tipos de edificação ------------------------------------
export const TIPOS = {
  casa:            { nome: 'Casa',            altura: [5, 8],    cor: 0xbfae99, interior: 'casa',      negocio: false },
  mansao:          { nome: 'Mansão',          altura: [9, 13],   cor: 0xe6ddcb, interior: 'mansao',    negocio: false },
  predio:          { nome: 'Edifício',        altura: [22, 55],  cor: 0x9aa3ad, interior: 'predio',    negocio: false },
  torre:           { nome: 'Torre',           altura: [70, 175], cor: 0x7e8a99, interior: 'escritorio', negocio: true, neg: 'escritorio' },
  escritorio:      { nome: 'Escritório',      altura: [18, 46],  cor: 0x8f9aa6, interior: 'escritorio', negocio: true, neg: 'escritorio' },
  loja:            { nome: 'Loja',            altura: [7, 12],   cor: 0xc9a46b, interior: 'loja',      negocio: true, neg: 'loja' },
  restaurante:     { nome: 'Restaurante',     altura: [7, 13],   cor: 0xc0705a, interior: 'restaurante', negocio: true, neg: 'restaurante' },
  cafe:            { nome: 'Café',            altura: [6, 9],    cor: 0xb98a5e, interior: 'restaurante', negocio: true, neg: 'cafe' },
  supermercado:    { nome: 'Supermercado',    altura: [10, 14],  cor: 0x7fa37a, interior: 'supermercado', negocio: true, neg: 'supermercado' },
  hotel:           { nome: 'Hotel',           altura: [30, 80],  cor: 0xa89b84, interior: 'hotel',     negocio: true, neg: 'hotel' },
  banco:           { nome: 'Agência Bancária', altura: [12, 24], cor: 0x6f7f96, interior: 'banco',     negocio: true, neg: 'banco' },
  hospital:        { nome: 'Hospital',        altura: [20, 34],  cor: 0xdce6ea, interior: 'hospital',  negocio: true, neg: 'hospital' },
  delegacia:       { nome: 'Delegacia',       altura: [12, 18],  cor: 0x5c6b85, interior: 'delegacia', negocio: false },
  tribunal:        { nome: 'Tribunal',        altura: [22, 30],  cor: 0xd8d2c2, interior: 'tribunal',  negocio: false },
  presidio:        { nome: 'Presídio',        altura: [12, 16],  cor: 0x8a8a84, interior: 'presidio',  negocio: false },
  escola:          { nome: 'Escola',          altura: [10, 16],  cor: 0xd2c08a, interior: 'escola',    negocio: true, neg: 'escola' },
  universidade:    { nome: 'Universidade',    altura: [16, 26],  cor: 0xc8b790, interior: 'escola',    negocio: true, neg: 'universidade' },
  oficina:         { nome: 'Oficina',         altura: [8, 11],   cor: 0x8c8278, interior: 'oficina',   negocio: true, neg: 'oficina' },
  concessionaria:  { nome: 'Concessionária',  altura: [10, 14],  cor: 0x90a6b5, interior: 'concessionaria', negocio: true, neg: 'concessionaria' },
  posto:           { nome: 'Posto de Combustível', altura: [7, 9], cor: 0xcf9a3e, interior: 'posto',   negocio: true, neg: 'posto' },
  fabrica:         { nome: 'Fábrica',         altura: [14, 22],  cor: 0x8e8779, interior: 'fabrica',   negocio: true, neg: 'fabrica' },
  galpao:          { nome: 'Galpão',          altura: [10, 16],  cor: 0x9b9b93, interior: 'fabrica',   negocio: true, neg: 'logistica' },
  fazenda:         { nome: 'Fazenda',         altura: [7, 11],   cor: 0xb59a6a, interior: 'fazenda',   negocio: true, neg: 'fazenda' },
  estacao:         { nome: 'Estação',         altura: [14, 20],  cor: 0xb0b6bd, interior: 'estacao',   negocio: false },
  aeroporto:       { nome: 'Aeroporto',       altura: [16, 22],  cor: 0xc6ccd2, interior: 'estacao',   negocio: false },
  porto:           { nome: 'Porto',           altura: [12, 18],  cor: 0x9aa7a0, interior: 'fabrica',   negocio: true, neg: 'logistica' },
  prefeitura:      { nome: 'Prédio Público',  altura: [20, 32],  cor: 0xd6cfbc, interior: 'publico',   negocio: false },
};

// Distritos -----------------------------------------------------------
export const DISTRITOS = {
  centro:      { nome: 'Centro', riqueza: 0.72, densidade: 1.0 },
  financeiro:  { nome: 'Zona Financeira', riqueza: 0.92, densidade: 1.0 },
  comercial:   { nome: 'Bairro Comercial', riqueza: 0.62, densidade: 0.9 },
  residencial: { nome: 'Bairro Residencial', riqueza: 0.5, densidade: 0.7 },
  luxo:        { nome: 'Bairro de Luxo', riqueza: 0.95, densidade: 0.45 },
  suburbio:    { nome: 'Subúrbio', riqueza: 0.33, densidade: 0.55 },
  industrial:  { nome: 'Zona Industrial', riqueza: 0.4, densidade: 0.6 },
  rural:       { nome: 'Área Rural', riqueza: 0.3, densidade: 0.12 },
  vila:        { nome: 'Pequena Cidade', riqueza: 0.42, densidade: 0.5 },
  praia:       { nome: 'Orla', riqueza: 0.78, densidade: 0.4 },
};

const PESOS_LOTE = {
  financeiro: [['torre', 26], ['escritorio', 24], ['banco', 7], ['restaurante', 9], ['cafe', 6], ['hotel', 7], ['loja', 12], ['predio', 9]],
  centro:     [['predio', 26], ['loja', 18], ['restaurante', 12], ['cafe', 7], ['escritorio', 10], ['hotel', 5], ['banco', 3], ['supermercado', 4], ['torre', 6], ['casa', 9]],
  comercial:  [['loja', 30], ['restaurante', 14], ['supermercado', 7], ['predio', 14], ['oficina', 6], ['cafe', 6], ['escritorio', 8], ['casa', 10], ['concessionaria', 5]],
  residencial:[['casa', 48], ['predio', 22], ['loja', 10], ['restaurante', 6], ['escola', 4], ['cafe', 4], ['supermercado', 3], ['oficina', 3]],
  luxo:       [['mansao', 52], ['casa', 20], ['restaurante', 8], ['hotel', 6], ['loja', 8], ['cafe', 6]],
  suburbio:   [['casa', 60], ['loja', 12], ['oficina', 7], ['restaurante', 6], ['supermercado', 4], ['escola', 4], ['galpao', 7]],
  industrial: [['fabrica', 34], ['galpao', 30], ['oficina', 14], ['escritorio', 6], ['restaurante', 6], ['posto', 5], ['concessionaria', 5]],
  rural:      [['fazenda', 62], ['casa', 22], ['oficina', 5], ['restaurante', 6], ['posto', 5]],
  vila:       [['casa', 48], ['loja', 14], ['restaurante', 10], ['oficina', 6], ['supermercado', 5], ['posto', 5], ['escola', 4], ['hotel', 4], ['predio', 4]],
  praia:      [['hotel', 26], ['restaurante', 20], ['casa', 18], ['mansao', 12], ['cafe', 12], ['loja', 12]],
};

// ---------------------------------------------------------------------
export function gerarMundo(semente = 20261001) {
  const rng = criarRNG(semente);
  const mundo = {
    semente, tamanho: TAM_MUNDO,
    nos: [], arestas: [], lotes: [], quadras: [],
    agua: [], florestas: [], parques: [], praia: null,
    indicePorTipo: new Map(),
    grade: null,
  };

  // ---------- 1. Hidrografia e relevo (definidos antes das ruas) -------
  // Rio diagonal com largura variável (lista de segmentos)
  const rio = [];
  let rx = -TAM_MUNDO / 2, rz = -520;
  for (let i = 0; i < 26; i++) {
    rio.push({ x: rx, z: rz, largura: faixa(rng, 46, 78) });
    rx += TAM_MUNDO / 25;
    rz += Math.sin(i * 0.55) * 120 + faixa(rng, -30, 30);
  }
  mundo.rio = rio;
  // Lagos
  for (let i = 0; i < 5; i++) {
    mundo.agua.push({
      x: faixa(rng, -1800, 1500), z: faixa(rng, -1800, 1800),
      r: faixa(rng, 90, 260), tipo: 'lago',
    });
  }
  // Praia na borda leste
  mundo.praia = { x0: TAM_MUNDO / 2 - 320, largura: 320 };

  // Florestas / montanhas no oeste e norte
  for (let i = 0; i < 16; i++) {
    mundo.florestas.push({
      x: faixa(rng, -TAM_MUNDO / 2 + 150, TAM_MUNDO / 2 - 500),
      z: faixa(rng, -TAM_MUNDO / 2 + 150, TAM_MUNDO / 2 - 150),
      r: faixa(rng, 160, 420),
    });
  }
  mundo.montanhas = [];
  for (let i = 0; i < 7; i++) {
    mundo.montanhas.push({ x: faixa(rng, -2000, -900), z: faixa(rng, -1900, 1900), r: faixa(rng, 180, 420), h: faixa(rng, 60, 200) });
  }

  function emAgua(x, z, margem = 0) {
    for (const l of mundo.agua) if (dist(x, z, l.x, l.z) < l.r + margem) return true;
    for (let i = 0; i < rio.length - 1; i++) {
      const a = rio[i], b = rio[i + 1];
      const d = distPontoSeg(x, z, a.x, a.z, b.x, b.z);
      if (d < a.largura / 2 + margem) return true;
    }
    if (x > mundo.praia.x0 - margem) return true;
    return false;
  }
  mundo.emAgua = emAgua;

  // ---------- 2. Malha urbana central -----------------------------------
  const RAIO_CIDADE = 1500;
  const n = Math.floor((RAIO_CIDADE * 2) / ESP_QUADRA);
  const inicio = -RAIO_CIDADE;
  const idPorChave = new Map();

  function addNo(x, z, meta = {}) {
    const no = { id: mundo.nos.length, x, z, viz: [], ...meta };
    mundo.nos.push(no); return no;
  }
  function addAresta(a, b, tipo) {
    if (!a || !b || a === b) return null;
    for (const v of a.viz) if (v.no === b.id) return null;
    const comp = dist(a.x, a.z, b.x, b.z);
    const limite = tipo === 'rodovia' ? 28 : tipo === 'avenida' ? 16 : 11; // m/s
    const ar = {
      id: mundo.arestas.length, a: a.id, b: b.id, tipo, comp, limite,
      largura: tipo === 'rodovia' ? LARG_RODOVIA : tipo === 'avenida' ? LARG_AVENIDA : LARG_RUA,
      carga: 0, bloqueio: 0,
    };
    mundo.arestas.push(ar);
    a.viz.push({ no: b.id, aresta: ar.id, comp });
    b.viz.push({ no: a.id, aresta: ar.id, comp });
    return ar;
  }
  mundo.addNo = addNo; mundo.addAresta = addAresta;

  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= n; j++) {
      const x = inicio + i * ESP_QUADRA + (i % 3 === 0 ? 0 : faixa(rng, -8, 8));
      const z = inicio + j * ESP_QUADRA + (j % 3 === 0 ? 0 : faixa(rng, -8, 8));
      if (emAgua(x, z, 10)) continue;
      const no = addNo(x, z, { urbano: true });
      idPorChave.set(`${i},${j}`, no.id);
    }
  }
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= n; j++) {
      const aId = idPorChave.get(`${i},${j}`); if (aId === undefined) continue;
      const a = mundo.nos[aId];
      const dirAv = (i % 4 === 0) || (j % 4 === 0);
      const b1 = idPorChave.get(`${i + 1},${j}`);
      const b2 = idPorChave.get(`${i},${j + 1}`);
      if (b1 !== undefined) addAresta(a, mundo.nos[b1], (i % 4 === 0 || j % 4 === 0) && dirAv ? 'avenida' : 'rua');
      if (b2 !== undefined) addAresta(a, mundo.nos[b2], (i % 4 === 0 || j % 4 === 0) && dirAv ? 'avenida' : 'rua');
    }
  }

  // Pontes sobre o rio: reconecta nós separados pela água (poucos pontos)
  const pontes = [];
  for (let k = 0; k < 6; k++) {
    const alvoX = -1100 + k * 440;
    let melhorA = null, melhorB = null, melhorD = 1e9;
    for (const a of mundo.nos) {
      if (Math.abs(a.x - alvoX) > 90) continue;
      for (const b of mundo.nos) {
        if (b.id <= a.id) continue;
        if (Math.abs(b.x - a.x) > 60) continue;
        const d = Math.abs(b.z - a.z);
        if (d < 70 || d > 230) continue;
        const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
        if (!emAgua(mx, mz, 0)) continue;
        if (d < melhorD) { melhorD = d; melhorA = a; melhorB = b; }
      }
    }
    if (melhorA && melhorB) {
      const ar = addAresta(melhorA, melhorB, 'avenida');
      if (ar) { ar.ponte = true; pontes.push(ar.id); }
    }
  }
  mundo.pontes = pontes;

  // ---------- 3. Cidades satélites ---------------------------------------
  const vilas = [
    { nome: 'Vila Serrana', x: -1750, z: -1620, n: 5 },
    { nome: 'Porto Pequeno', x: 1680, z: 1500, n: 5 },
    { nome: 'Campo Alegre', x: -1680, z: 1620, n: 4 },
    { nome: 'Alto da Pedra', x: 1620, z: -1700, n: 4 },
  ];
  mundo.vilas = [];
  for (const v of vilas) {
    const mapa = new Map();
    for (let i = 0; i <= v.n; i++) for (let j = 0; j <= v.n; j++) {
      const x = v.x + (i - v.n / 2) * 95, z = v.z + (j - v.n / 2) * 95;
      if (emAgua(x, z, 10)) continue;
      mapa.set(`${i},${j}`, addNo(x, z, { vila: v.nome }).id);
    }
    for (let i = 0; i <= v.n; i++) for (let j = 0; j <= v.n; j++) {
      const a = mapa.get(`${i},${j}`); if (a === undefined) continue;
      const b1 = mapa.get(`${i + 1},${j}`), b2 = mapa.get(`${i},${j + 1}`);
      if (b1 !== undefined) addAresta(mundo.nos[a], mundo.nos[b1], 'rua');
      if (b2 !== undefined) addAresta(mundo.nos[a], mundo.nos[b2], 'rua');
    }
    mundo.vilas.push({ ...v, centro: { x: v.x, z: v.z } });
  }

  // ---------- 4. Rodovias de longa distância -----------------------------
  function noMaisProximo(x, z, filtro) {
    let melhor = null, md = 1e18;
    for (const no of mundo.nos) {
      if (filtro && !filtro(no)) continue;
      const d = (no.x - x) ** 2 + (no.z - z) ** 2;
      if (d < md) { md = d; melhor = no; }
    }
    return melhor;
  }
  mundo.noMaisProximo = noMaisProximo;

  function rodovia(x0, z0, x1, z1, passos = 14) {
    let anterior = noMaisProximo(x0, z0);
    const nosRod = [];
    for (let s = 1; s <= passos; s++) {
      const t = s / passos;
      const curva = Math.sin(t * Math.PI) * faixa(rng, -140, 140);
      const nx = x0 + (x1 - x0) * t + curva * 0.4;
      const nz = z0 + (z1 - z0) * t + curva * 0.4;
      const alvo = s === passos ? noMaisProximo(x1, z1) : addNo(nx, nz, { rodovia: true });
      addAresta(anterior, alvo, 'rodovia');
      nosRod.push(alvo.id);
      anterior = alvo;
    }
    return nosRod;
  }
  mundo.rodovias = [];
  mundo.rodovias.push(rodovia(-1500, -1500, -1750, -1620, 10));
  mundo.rodovias.push(rodovia(1500, 1500, 1680, 1500, 10));
  mundo.rodovias.push(rodovia(-1500, 1500, -1680, 1620, 10));
  mundo.rodovias.push(rodovia(1500, -1500, 1620, -1700, 10));
  // Anel rodoviário externo
  const anel = [];
  const R = 1850, passosAnel = 40;
  let primeiro = null, anterior = null;
  for (let i = 0; i < passosAnel; i++) {
    const ang = (i / passosAnel) * Math.PI * 2;
    const x = Math.cos(ang) * R * 1.02, z = Math.sin(ang) * R;
    if (x > mundo.praia.x0 - 60) continue;
    const no = addNo(x, z, { rodovia: true, anel: true });
    if (anterior) addAresta(anterior, no, 'rodovia');
    if (!primeiro) primeiro = no;
    anterior = no; anel.push(no.id);
  }
  if (primeiro && anterior) addAresta(anterior, primeiro, 'rodovia');
  mundo.anel = anel;
  // Ligações radiais do anel para a cidade
  for (let i = 0; i < anel.length; i += 5) {
    const no = mundo.nos[anel[i]];
    const alvo = noMaisProximo(no.x * 0.65, no.z * 0.65, (c) => c.urbano);
    if (alvo) rodoviaCurta(no, alvo);
  }
  function rodoviaCurta(a, b) {
    const passos = 4; let ant = a;
    for (let s = 1; s <= passos; s++) {
      const t = s / passos;
      const alvo = s === passos ? b : addNo(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, { rodovia: true });
      addAresta(ant, alvo, 'rodovia'); ant = alvo;
    }
  }

  // ---------- 5. Distritos ------------------------------------------------
  function distritoDe(x, z) {
    for (const v of mundo.vilas) if (dist(x, z, v.centro.x, v.centro.z) < 340) return 'vila';
    const r = Math.hypot(x, z);
    if (x > mundo.praia.x0 - 420) return 'praia';
    if (r > RAIO_CIDADE + 60) return 'rural';
    const ang = Math.atan2(z, x);
    if (r < 320) return 'financeiro';
    if (r < 560) return 'centro';
    if (r < 900) {
      if (ang > 0.4 && ang < 2.0) return 'comercial';
      if (ang <= 0.4 && ang > -1.4) return 'residencial';
      return 'centro';
    }
    if (ang > 2.0 || ang < -2.4) return 'industrial';
    if (ang > -1.2 && ang < 0.2) return 'luxo';
    if (ang > 0.2 && ang < 2.0) return 'residencial';
    return 'suburbio';
  }
  mundo.distritoDe = distritoDe;

  // ---------- 6. Quadras e lotes -----------------------------------------
  // Cada par de ruas paralelas define uma quadra; preenchemos com lotes.
  let idLote = 0;
  const parquesCount = { v: 0 };
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const cx = inicio + (i + 0.5) * ESP_QUADRA;
      const cz = inicio + (j + 0.5) * ESP_QUADRA;
      if (emAgua(cx, cz, 50)) continue;
      const dist1 = distritoDe(cx, cz);
      const quadra = { id: mundo.quadras.length, x: cx, z: cz, distrito: dist1, lotes: [] };
      const meiaQ = ESP_QUADRA / 2 - (dist1 === 'financeiro' || dist1 === 'centro' ? LARG_AVENIDA : LARG_RUA) / 2 - 6;

      // Parques e praças ocupam quadras inteiras
      if (chance(rng, dist1 === 'luxo' ? 0.16 : dist1 === 'suburbio' ? 0.14 : 0.1) && parquesCount.v < 42) {
        parquesCount.v++;
        mundo.parques.push({ x: cx, z: cz, meia: meiaQ, id: mundo.parques.length, distrito: dist1 });
        quadra.parque = true;
        mundo.quadras.push(quadra);
        continue;
      }

      const dens = DISTRITOS[dist1].densidade;
      let div = dist1 === 'financeiro' ? 1 : dist1 === 'centro' ? 2 : dist1 === 'luxo' ? 2 : dist1 === 'industrial' ? 2 : 3;
      if (chance(rng, 0.25)) div = Math.max(1, div + (chance(rng, 0.5) ? -1 : 1));
      const passo = (meiaQ * 2) / div;
      for (let a = 0; a < div; a++) {
        for (let b = 0; b < div; b++) {
          if (!chance(rng, 0.6 + dens * 0.4)) continue;
          const lx = cx - meiaQ + passo * (a + 0.5);
          const lz = cz - meiaQ + passo * (b + 0.5);
          if (emAgua(lx, lz, 24)) continue;
          const tipo = pesoEscolher(rng, PESOS_LOTE[dist1] || PESOS_LOTE.residencial);
          mundo.lotes.push(criarLote(rng, idLote++, lx, lz, passo * 0.78, tipo, dist1, quadra.id));
          quadra.lotes.push(idLote - 1);
        }
      }
      mundo.quadras.push(quadra);
    }
  }

  // Lotes das vilas
  for (const v of mundo.vilas) {
    for (let i = 0; i < 46; i++) {
      const lx = v.x + faixa(rng, -300, 300), lz = v.z + faixa(rng, -300, 300);
      if (emAgua(lx, lz, 30)) continue;
      const tipo = pesoEscolher(rng, PESOS_LOTE.vila);
      mundo.lotes.push(criarLote(rng, idLote++, lx, lz, faixa(rng, 20, 34), tipo, 'vila', -1, v.nome));
    }
  }
  // Lotes rurais / de beira de estrada
  for (const ar of mundo.arestas) {
    if (ar.tipo !== 'rodovia') continue;
    if (!chance(rng, 0.3)) continue;
    const a = mundo.nos[ar.a], b = mundo.nos[ar.b];
    const t = faixa(rng, 0.25, 0.75);
    const dx = b.x - a.x, dz = b.z - a.z;
    const L = Math.hypot(dx, dz) || 1;
    const lado = chance(rng, 0.5) ? 1 : -1;
    const lx = a.x + dx * t + (-dz / L) * 40 * lado;
    const lz = a.z + dz * t + (dx / L) * 40 * lado;
    if (emAgua(lx, lz, 40)) continue;
    const tipo = pesoEscolher(rng, [['posto', 24], ['restaurante', 18], ['hotel', 10], ['oficina', 12], ['fazenda', 24], ['galpao', 8], ['loja', 8]]);
    mundo.lotes.push(criarLote(rng, idLote++, lx, lz, faixa(rng, 24, 40), tipo, 'rural', -1));
  }

  // ---------- 7. Equipamentos obrigatórios --------------------------------
  function converterLotes(tipoNovo, qtd, filtro) {
    const candidatos = mundo.lotes.filter(filtro);
    let convertidos = 0;
    for (let k = 0; k < qtd && candidatos.length; k++) {
      const l = candidatos.splice(Math.floor(rng() * candidatos.length), 1)[0];
      aplicarTipo(rng, l, tipoNovo);
      convertidos++;
    }
    return convertidos;
  }
  const urbanoMedio = (l) => ['centro', 'comercial', 'residencial'].includes(l.distrito) && ['casa', 'loja', 'predio'].includes(l.tipo);
  converterLotes('delegacia', 6, (l) => ['centro', 'comercial', 'residencial', 'suburbio', 'industrial'].includes(l.distrito) && l.tipo !== 'delegacia');
  converterLotes('delegacia', 2, (l) => l.distrito === 'vila' || l.distrito === 'rural');
  converterLotes('hospital', 4, urbanoMedio);
  converterLotes('tribunal', 2, (l) => l.distrito === 'centro' || l.distrito === 'financeiro');
  converterLotes('prefeitura', 3, (l) => l.distrito === 'centro' || l.distrito === 'financeiro');
  converterLotes('presidio', 1, (l) => l.distrito === 'industrial' || l.distrito === 'rural');
  converterLotes('universidade', 3, (l) => ['centro', 'residencial', 'comercial'].includes(l.distrito));
  converterLotes('escola', 10, (l) => ['residencial', 'suburbio', 'vila'].includes(l.distrito) && l.tipo === 'casa');
  converterLotes('banco', 10, (l) => ['centro', 'comercial', 'financeiro', 'residencial'].includes(l.distrito) && l.tipo !== 'banco');
  converterLotes('supermercado', 12, (l) => ['residencial', 'comercial', 'suburbio', 'vila'].includes(l.distrito) && ['casa', 'loja', 'galpao'].includes(l.tipo));
  converterLotes('posto', 16, (l) => l.tipo === 'loja' || l.tipo === 'oficina');
  converterLotes('concessionaria', 5, (l) => l.distrito === 'comercial' || l.distrito === 'industrial');
  converterLotes('estacao', 3, (l) => ['centro', 'comercial', 'industrial'].includes(l.distrito));
  converterLotes('aeroporto', 1, (l) => l.distrito === 'industrial' || l.distrito === 'rural');
  converterLotes('porto', 2, (l) => l.distrito === 'praia' || l.distrito === 'industrial');

  // ---------- 8. Índices e ligação com o grafo ----------------------------
  for (const l of mundo.lotes) {
    const no = noMaisProximo(l.x, l.z);
    l.no = no ? no.id : 0;
    l.nome = nomeDoLote(rng, l);
    if (!mundo.indicePorTipo.has(l.tipo)) mundo.indicePorTipo.set(l.tipo, []);
    mundo.indicePorTipo.get(l.tipo).push(l.id);
  }

  // Grade espacial para consultas rápidas (lotes próximos)
  mundo.grade = criarGradeEspacial(mundo.lotes, 160, TAM_MUNDO);
  mundo.gradeNos = criarGradeEspacial(mundo.nos, 160, TAM_MUNDO);

  // Caixas eletrônicos espalhados
  mundo.caixas = [];
  for (const l of mundo.lotes) {
    if (l.tipo === 'banco' || l.tipo === 'supermercado' || l.tipo === 'posto' || (l.tipo === 'loja' && chance(rng, 0.2))) {
      mundo.caixas.push({ x: l.x + faixa(rng, -6, 6), z: l.z + l.tam / 2 + 3, loteId: l.id });
    }
  }

  // Semáforos nos cruzamentos de avenida
  mundo.semaforos = [];
  for (const no of mundo.nos) {
    let avenidas = 0;
    for (const v of no.viz) if (mundo.arestas[v.aresta].tipo !== 'rua') avenidas++;
    if (no.viz.length >= 3 && avenidas >= 2) {
      mundo.semaforos.push({ no: no.id, x: no.x, z: no.z, fase: rng(), ciclo: faixa(rng, 26, 40) });
      no.semaforo = mundo.semaforos.length - 1;
    }
  }

  mundo.estatisticas = {
    nos: mundo.nos.length, arestas: mundo.arestas.length, lotes: mundo.lotes.length,
    quadras: mundo.quadras.length, parques: mundo.parques.length, semaforos: mundo.semaforos.length,
  };
  return mundo;
}

// ---------------------------------------------------------------------
function criarLote(rng, id, x, z, tam, tipo, distrito, quadra, vila) {
  const l = {
    id, x, z, tam: Math.max(12, tam), rot: Math.round(faixa(rng, 0, 3)) * Math.PI / 2 + faixa(rng, -0.03, 0.03),
    tipo, distrito, quadra, vila: vila || null,
    altura: 10, andares: 1, cor: 0xffffff, negocioId: null, residentes: [], valor: 0,
    seguranca: 0, estacionamento: chance(rng, 0.45),
  };
  aplicarTipo(rng, l, tipo);
  return l;
}

function aplicarTipo(rng, l, tipo) {
  const t = TIPOS[tipo]; if (!t) return;
  l.tipo = tipo;
  const riqueza = DISTRITOS[l.distrito] ? DISTRITOS[l.distrito].riqueza : 0.5;
  l.altura = faixa(rng, t.altura[0], t.altura[1]) * (tipo === 'torre' || tipo === 'predio' ? (0.6 + riqueza * 0.8) : 1);
  l.andares = Math.max(1, Math.round(l.altura / 3.4));
  l.cor = t.cor;
  l.interior = t.interior;
  l.m2 = Math.round(l.tam * l.tam * (tipo === 'casa' || tipo === 'mansao' ? 0.6 : Math.min(l.andares, 8) * 0.55));
  l.valor = Math.round(l.m2 * (900 + riqueza * 5200) * faixa(rng, 0.8, 1.25));
  l.seguranca = tipo === 'banco' ? faixa(rng, 0.55, 0.9) : tipo === 'presidio' ? 0.95 : tipo === 'supermercado' ? faixa(rng, 0.25, 0.45)
    : tipo === 'mansao' ? faixa(rng, 0.3, 0.6) : tipo === 'loja' ? faixa(rng, 0.1, 0.35) : faixa(rng, 0.05, 0.3);
  l.camerasQtd = Math.round(l.seguranca * faixa(rng, 4, 18));
  if (tipo === 'casa') l.capacidade = inteiro(rng, 1, 5);
  else if (tipo === 'mansao') l.capacidade = inteiro(rng, 2, 7);
  else if (tipo === 'predio') l.capacidade = Math.max(4, Math.round(l.andares * inteiro(rng, 2, 4)));
  else if (tipo === 'hotel') l.capacidade = Math.max(10, l.andares * 6);
  else l.capacidade = 0;
}

function nomeDoLote(rng, l) {
  const t = TIPOS[l.tipo];
  switch (l.tipo) {
    case 'casa': return `Residência ${l.id}`;
    case 'mansao': return `Mansão ${escolher(rng, ['das Acácias', 'do Mirante', 'Bela Vista', 'do Lago', 'Alta Colina'])}`;
    case 'predio': return `Edifício ${escolher(rng, ['Aurora', 'Sol Nascente', 'Jacarandá', 'Central', 'Mirante', 'Brisa'])} ${l.id % 90}`;
    case 'banco': return `Banco ${escolher(rng, ['Meridiano', 'Aurora', 'Pilar', 'Boreal'])} — Agência ${100 + (l.id % 900)}`;
    case 'delegacia': return `${(l.distrito === 'rural' || l.distrito === 'vila') ? 'Posto Policial' : 'Delegacia'} ${l.id % 50}`;
    case 'hospital': return `Hospital ${escolher(rng, ['Vale Verde', 'Santa Rota', 'Boa Esperança', 'Central'])}`;
    case 'tribunal': return `Fórum ${escolher(rng, ['Central', 'Municipal', 'da Comarca'])}`;
    case 'presidio': return 'Penitenciária Pedra Cinza';
    case 'escola': return `Escola ${escolher(rng, ['Primavera', 'Horizonte', 'Novo Tempo', 'Pedra Branca'])}`;
    case 'universidade': return `Universidade ${escolher(rng, ['Meridional', 'do Vale', 'Boreal'])}`;
    case 'aeroporto': return 'Aeroporto Metropolitano Cidade Viva';
    case 'estacao': return `Estação ${escolher(rng, ['Central', 'Norte', 'Sul', 'Leste'])}`;
    case 'porto': return 'Porto de Cidade Viva';
    case 'prefeitura': return `${escolher(rng, ['Prefeitura', 'Secretaria Municipal', 'Centro Administrativo'])}`;
    default: return nomeEmpresa(rng, t ? t.nome : 'Negócio');
  }
}

// ---------------------------------------------------------------------
export function criarGradeEspacial(itens, celula, tamanho) {
  const cols = Math.ceil(tamanho / celula);
  const mapa = new Map();
  const chave = (x, z) => {
    const cx = Math.floor((x + tamanho / 2) / celula);
    const cz = Math.floor((z + tamanho / 2) / celula);
    return cz * cols + cx;
  };
  for (const it of itens) {
    const k = chave(it.x, it.z);
    if (!mapa.has(k)) mapa.set(k, []);
    mapa.get(k).push(it);
  }
  return {
    celula, cols, mapa, chave,
    proximos(x, z, raio) {
      const out = [];
      const r = Math.ceil(raio / celula);
      const cx = Math.floor((x + tamanho / 2) / celula);
      const cz = Math.floor((z + tamanho / 2) / celula);
      for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) {
        const lista = mapa.get((cz + j) * cols + (cx + i));
        if (lista) for (const it of lista) out.push(it);
      }
      return out;
    },
  };
}

export function distPontoSeg(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const l2 = dx * dx + dz * dz;
  if (l2 === 0) return Math.hypot(px - ax, pz - az);
  let t = ((px - ax) * dx + (pz - az) * dz) / l2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

// --------- Navegação no grafo (A*) -------------------------------------
import { FilaPrioridade } from '../util/nucleo.js';
export function caminho(mundo, origemId, destinoId, pesoCarga = 1) {
  if (origemId === destinoId) return [origemId];
  const destino = mundo.nos[destinoId]; if (!destino) return null;
  const anterior = new Map(), custo = new Map();
  const fila = new FilaPrioridade();
  fila.inserir(origemId, 0); custo.set(origemId, 0);
  let visitados = 0;
  while (fila.tamanho) {
    const atual = fila.remover();
    if (atual === destinoId) break;
    if (++visitados > 9000) break;
    const no = mundo.nos[atual];
    for (const v of no.viz) {
      const ar = mundo.arestas[v.aresta];
      const penal = 1 + (ar.carga * 0.15 + ar.bloqueio * 3) * pesoCarga;
      const c = custo.get(atual) + (v.comp / ar.limite) * penal;
      if (!custo.has(v.no) || c < custo.get(v.no)) {
        custo.set(v.no, c); anterior.set(v.no, atual);
        const h = dist(mundo.nos[v.no].x, mundo.nos[v.no].z, destino.x, destino.z) / 28;
        fila.inserir(v.no, c + h);
      }
    }
  }
  if (!anterior.has(destinoId)) return null;
  const rota = [destinoId];
  let cur = destinoId;
  while (cur !== origemId) { cur = anterior.get(cur); if (cur === undefined) return null; rota.push(cur); }
  return rota.reverse();
}
