/* =========================================================================
   LIFE: CIDADE VIVA — core.js
   Utilidades, RNG determinístico, dados do mundo, relógio, input, áudio.
   Sem dependências externas. JavaScript puro.
   ========================================================================= */
(function () {
  'use strict';
  const LIFE = (window.LIFE = window.LIFE || {});

  /* ------------------------------------------------------------------ */
  /* CONFIG                                                             */
  /* ------------------------------------------------------------------ */
  LIFE.CONFIG = {
    TILE: 16,
    BLOCKS: 13,          // 13x13 quarteirões
    BLOCK: 16,           // tiles por quarteirão (passo das ruas)
    ROAD_W: 4,           // largura da rua
    AVENUE_EVERY: 4,     // a cada N ruas, uma avenida mais larga
    AVENUE_W: 6,
    SEED: '20261001',
    POPULATION: 2200,    // moradores simulados (abstratos + ativos)
    ACTIVE_RADIUS: 55,   // tiles: raio de simulação completa
    MAX_ACTIVE_AGENTS: 220,
    MAX_VEHICLES: 150,
    MIN_PER_SEC: 1,      // 1x = 1 minuto de jogo por segundo real
    DAY_START_MIN: 7 * 60,
    PLAYER_SPEED: 3.1,   // tiles/s
    PLAYER_RUN: 5.4,
    DEBUG: false
  };

  /* ------------------------------------------------------------------ */
  /* UTIL                                                               */
  /* ------------------------------------------------------------------ */
  const U = LIFE.Util = {
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    clamp01: (v) => (v < 0 ? 0 : v > 1 ? 1 : v),
    lerp: (a, b, t) => a + (b - a) * t,
    inv: (a, b, v) => (b === a ? 0 : (v - a) / (b - a)),
    smooth: (t) => t * t * (3 - 2 * t),
    dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    dist2: (x1, y1, x2, y2) => { const dx = x2 - x1, dy = y2 - y1; return dx * dx + dy * dy; },
    sign: (v) => (v < 0 ? -1 : v > 0 ? 1 : 0),
    // ângulo alvo suavizado (usado por veículos e pedestres)
    angLerp(a, b, t) {
      let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (d < -Math.PI) d += Math.PI * 2;
      return a + d * t;
    },
    // hash de string -> uint32
    hash(str) {
      let h = 2166136261 >>> 0;
      for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
      return h >>> 0;
    },
    // RNG determinístico (mulberry32)
    rng(seed) {
      let a = (typeof seed === 'string' ? U.hash(seed) : seed | 0) >>> 0;
      return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    // RNG com fluxo nomeado: mesma semente + mesmo nome = mesma sequência
    rngOf: (seed, name) => U.rng(U.hash(seed + '::' + name)),
    pick(rnd, arr) { return arr[(rnd() * arr.length) | 0]; },
    chance(rnd, p) { return rnd() < p; },
    range(rnd, a, b) { return a + rnd() * (b - a); },
    irange(rnd, a, b) { return a + ((rnd() * (b - a + 1)) | 0); },
    shuffle(rnd, arr) { for (let i = arr.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0;[arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; },
    weighted(rnd, items, wKey) {
      let total = 0; for (const it of items) total += it[wKey] || it.w || 1;
      let r = rnd() * total;
      for (const it of items) { r -= it[wKey] || it.w || 1; if (r <= 0) return it; }
      return items[items.length - 1];
    },
    fmtMoney(v) {
      const neg = v < 0; v = Math.abs(v);
      const s = v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return (neg ? '-R$ ' : 'R$ ') + s;
    },
    fmtMoneyShort(v) {
      if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1).replace('.', ',') + 'k';
      return v.toFixed(0);
    },
    fmtHHMM(min) { const m = ((min % 1440) + 1440) % 1440; const h = (m / 60) | 0, mm = (m % 60) | 0; return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); },
    titleCase(s) { return s.replace(/\b\w/g, (c) => c.toUpperCase()); },
    inRect(x, y, r) { return x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h; },
    rectsOverlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; },
    // embaralha e devolve copia
    shuffledCopy(rnd, arr) { return U.shuffle(rnd, arr.slice()); },
    // ruído simples de valor (para terreno procedural)
    makeNoise(seed) {
      const rnd = U.rng(seed), g = new Float32Array(4096);
      for (let i = 0; i < g.length; i++) g[i] = rnd();
      return function (x, y) {
        const xi = Math.floor(x), yi = Math.floor(y);
        const xf = x - xi, yf = y - yi;
        const h = (a, b) => g[((a * 73856093) ^ (b * 19349663)) & 4095];
        const v00 = h(xi, yi), v10 = h(xi + 1, yi), v01 = h(xi, yi + 1), v11 = h(xi + 1, yi + 1);
        const u = U.smooth(xf), v = U.smooth(yf);
        return U.lerp(U.lerp(v00, v10, u), U.lerp(v01, v11, u), v);
      };
    },
    // cor: clareia/escurece hex
    shade(hex, amt) {
      const n = parseInt(hex.slice(1), 16);
      let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      if (amt >= 0) { r = r + (255 - r) * amt; g = g + (255 - g) * amt; b = b + (255 - b) * amt; }
      else { r *= (1 + amt); g *= (1 + amt); b *= (1 + amt); }
      return '#' + ((1 << 24) + ((r | 0) << 16) + ((g | 0) << 8) + (b | 0)).toString(16).slice(1);
    },
    mix(hexA, hexB, t) {
      const A = parseInt(hexA.slice(1), 16), B = parseInt(hexB.slice(1), 16);
      const r = ((A >> 16) & 255) * (1 - t) + ((B >> 16) & 255) * t;
      const g = ((A >> 8) & 255) * (1 - t) + ((B >> 8) & 255) * t;
      const b = (A & 255) * (1 - t) + (B & 255) * t;
      return '#' + ((1 << 24) + ((r | 0) << 16) + ((g | 0) << 8) + (b | 0)).toString(16).slice(1);
    },
    esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  };

  /* ------------------------------------------------------------------ */
  /* DADOS: nomes, ruas, bairros, profissões, mercadorias               */
  /* ------------------------------------------------------------------ */
  const D = LIFE.DATA = {};

  D.FIRST_M = ('Gabriel Lucas Matheus Rafael Pedro João Guilherme Enzo Felipe Bruno Diego Thiago Vinícius ' +
    'Carlos Eduardo André Marcos Paulo Ricardo Fernando Rodrigo Marcelo Alexandre José Antônio Luiz Sérgio ' +
    'Roberto Jorge Caio Igor Otávio Murilo Heitor Bryan Nathan Davi Arthur Bernardo Samuel Leonardo Miguel ' +
    'Daniel Vicente Augusto Benício Cauã Érick Fábio Gustavo Henrique Ícaro Jonas Kauê Leandro Nicolas Oscar ' +
    'Renan Tomás Ubirajara Vitor Wesley Yan Zeca Álvaro Bento Cícero Douglas Elias Flávio Gilberto Hugo').split(' ');

  D.FIRST_F = ('Ana Beatriz Camila Daniela Eduarda Fernanda Gabriela Helena Isabela Juliana Larissa Mariana ' +
    'Natália Olívia Patrícia Renata Sofia Tatiane Vanessa Yasmin Amanda Bruna Carla Débora Elisa Flávia Giovana ' +
    'Heloísa Ingrid Jéssica Kelly Lúcia Marcela Nicole Odete Priscila Quéren Raquel Sabrina Tainá Úrsula Vitória ' +
    'Wanda Aline Bárbara Clara Dulce Eliane Fabiana Gisele Iara Joana Karina Laura Manuela Nara Paula Rosa Sônia ' +
    'Teresa Valentina Zélia Clara Alice Laura Sofia Manuela Beatriz Lívia Cecília Emanuelly Esther Milena').split(' ');

  D.SURNAMES = ('Silva Santos Oliveira Souza Rodrigues Ferreira Alves Pereira Lima Gomes Costa Ribeiro Martins ' +
    'Carvalho Almeida Lopes Soares Fernandes Vieira Barbosa Rocha Dias Nascimento Andrade Moreira Nunes Marques ' +
    'Machado Mendes Freitas Cardoso Ramos Gonçalves Santana Teixeira Araújo Correia Cavalcanti Monteiro Moura ' +
    'Batista Duarte Campos Cunha Pinto Miranda Reis Azevedo Braga Castro Fonseca Guimarães Leite Melo Neves ' +
    'Peixoto Queiroz Sales Tavares Vaz Xavier Zanetti Aguiar Bastos Coelho Damasceno Esteves Furtado Gusmão').split(' ');

  D.STREETS = ('das Flores dos Ipês do Comércio das Acácias do Sol Central XV de Novembro Sete de Setembro ' +
    'da Independência dos Andradas do Café do Ouro da Serra do Lago das Palmeiras dos Coqueiros do Porto ' +
    'Santos Dumont Tiradentes Marechal Deodoro Getúlio Vargas Juscelino Kubitschek Dom Pedro II da República ' +
    'dos Navegantes das Pedras do Bosque Nova Aurora Bela Vista São Judas Santa Rita do Rosário da Estação ' +
    'dos Trilhos do Moinho Industrial das Fábricas do Mercado da Alfândega Praia Grande').split(/\s+(?=[A-ZÁ-Ú])/);

  D.NEIGHBORHOODS = ['Centro', 'Jardim das Acácias', 'Vila Operária', 'Bairro do Porto', 'Alto da Serra', 'Morada Nova',
    'Parque Central', 'Vila Esperança', 'Cidade Baixa', 'Setor Industrial', 'Jardim Botânico', 'Praia Grande',
    'Vila Nova Aurora', 'Serra Azul', 'Recanto Verde'];

  D.ZONES = {
    DOWNTOWN: { id: 'DOWNTOWN', name: 'Centro Financeiro', color: '#4cc9f0' },
    COMMERCIAL: { id: 'COMMERCIAL', name: 'Comércio Central', color: '#ffd23f' },
    RESIDENTIAL: { id: 'RESIDENTIAL', name: 'Zona Residencial', color: '#37d67a' },
    SUBURB: { id: 'SUBURB', name: 'Subúrbio', color: '#9ae66e' },
    INDUSTRIAL: { id: 'INDUSTRIAL', name: 'Distrito Industrial', color: '#ff8b3d' },
    RURAL: { id: 'RURAL', name: 'Zona Rural', color: '#c8e06f' },
    PARK: { id: 'PARK', name: 'Parque Municipal', color: '#3ddc84' },
    PORT: { id: 'PORT', name: 'Porto & Alfândega', color: '#5fa8ff' },
    AIRPORT: { id: 'AIRPORT', name: 'Aeroporto', color: '#c0c8d0' },
    BEACH: { id: 'BEACH', name: 'Praia Grande', color: '#ffe08a' },
    FOREST: { id: 'FOREST', name: 'Reserva Florestal', color: '#2e8b57' }
  };

  // Profissões: turno (hora*60), salário diário base, zona onde trabalha, quais prédios
  D.PROFESSIONS = [
    { id: 'vendedor', name: 'Vendedor(a)', zone: 'COMMERCIAL', places: ['shop', 'mall', 'supermarket'], shift: [8 * 60, 18 * 60], pay: [90, 150] },
    { id: 'caixa', name: 'Operador(a) de Caixa', zone: 'COMMERCIAL', places: ['supermarket', 'shop'], shift: [7 * 60, 15 * 60], pay: [80, 130] },
    { id: 'repositor', name: 'Repositor(a)', zone: 'COMMERCIAL', places: ['supermarket'], shift: [6 * 60, 14 * 60], pay: [75, 120] },
    { id: 'gerente', name: 'Gerente de Loja', zone: 'COMMERCIAL', places: ['supermarket', 'mall', 'bank'], shift: [9 * 60, 19 * 60], pay: [180, 300] },
    { id: 'garcom', name: 'Garçom/Garçonete', zone: 'COMMERCIAL', places: ['restaurant', 'bar'], shift: [11 * 60, 23 * 60], pay: [85, 140] },
    { id: 'cozinheiro', name: 'Cozinheiro(a)', zone: 'COMMERCIAL', places: ['restaurant'], shift: [10 * 60, 22 * 60], pay: [110, 190] },
    { id: 'padeiro', name: 'Padeiro(a)', zone: 'COMMERCIAL', places: ['bakery', 'supermarket'], shift: [4 * 60, 12 * 60], pay: [95, 160] },
    { id: 'mecanico', name: 'Mecânico(a)', zone: 'INDUSTRIAL', places: ['garage', 'gas'], shift: [8 * 60, 18 * 60], pay: [120, 220] },
    { id: 'operario', name: 'Operário(a)', zone: 'INDUSTRIAL', places: ['factory', 'warehouse'], shift: [7 * 60, 17 * 60], pay: [100, 170] },
    { id: 'caminhoneiro', name: 'Caminhoneiro(a)', zone: 'INDUSTRIAL', places: ['warehouse', 'port', 'market'], shift: [6 * 60, 16 * 60], pay: [150, 320] },
    { id: 'engenheiro', name: 'Engenheiro(a)', zone: 'INDUSTRIAL', places: ['factory', 'office'], shift: [8 * 60, 17 * 60], pay: [280, 520] },
    { id: 'operador_maquina', name: 'Operador(a) de Máquinas', zone: 'INDUSTRIAL', places: ['factory'], shift: [7 * 60, 19 * 60], pay: [130, 210] },
    { id: 'banqueiro', name: 'Bancário(a)', zone: 'DOWNTOWN', places: ['bank'], shift: [9 * 60, 18 * 60], pay: [250, 480] },
    { id: 'advogado', name: 'Advogado(a)', zone: 'DOWNTOWN', places: ['office', 'courthouse'], shift: [9 * 60, 18 * 60], pay: [300, 700] },
    { id: 'juiz', name: 'Juiz(a)', zone: 'DOWNTOWN', places: ['courthouse'], shift: [10 * 60, 17 * 60], pay: [600, 1200] },
    { id: 'programador', name: 'Programador(a)', zone: 'DOWNTOWN', places: ['office'], shift: [10 * 60, 19 * 60], pay: [260, 600] },
    { id: 'arquiteto', name: 'Arquiteto(a)', zone: 'DOWNTOWN', places: ['office'], shift: [9 * 60, 18 * 60], pay: [240, 500] },
    { id: 'corretor', name: 'Corretor(a) de Imóveis', zone: 'DOWNTOWN', places: ['office', 'hotel'], shift: [9 * 60, 18 * 60], pay: [200, 900] },
    { id: 'contador', name: 'Contador(a)', zone: 'DOWNTOWN', places: ['office', 'bank'], shift: [9 * 60, 18 * 60], pay: [220, 420] },
    { id: 'jornalista', name: 'Jornalista', zone: 'DOWNTOWN', places: ['office', 'tv'], shift: [10 * 60, 20 * 60], pay: [180, 380] },
    { id: 'professor', name: 'Professor(a)', zone: 'RESIDENTIAL', places: ['school', 'university'], shift: [7 * 60, 13 * 60], pay: [160, 320] },
    { id: 'pesquisador', name: 'Pesquisador(a)', zone: 'RESIDENTIAL', places: ['university'], shift: [9 * 60, 18 * 60], pay: [220, 450] },
    { id: 'estudante', name: 'Estudante', zone: 'RESIDENTIAL', places: ['school', 'university'], shift: [7 * 60, 12 * 60], pay: [0, 0] },
    { id: 'medico', name: 'Médico(a)', zone: 'RESIDENTIAL', places: ['hospital', 'clinic'], shift: [7 * 60, 19 * 60], pay: [600, 1400] },
    { id: 'enfermeiro', name: 'Enfermeiro(a)', zone: 'RESIDENTIAL', places: ['hospital', 'clinic'], shift: [6 * 60, 18 * 60], pay: [180, 340] },
    { id: 'policial', name: 'Policial', zone: 'RESIDENTIAL', places: ['police', 'precinct'], shift: [7 * 60, 19 * 60], pay: [220, 400] },
    { id: 'bombeiro', name: 'Bombeiro(a)', zone: 'RESIDENTIAL', places: ['firestation'], shift: [7 * 60, 19 * 60], pay: [210, 380] },
    { id: 'motorista', name: 'Motorista de Ônibus', zone: 'RESIDENTIAL', places: ['busdepot'], shift: [5 * 60, 14 * 60], pay: [130, 220] },
    { id: 'taxista', name: 'Motorista de Táxi', zone: 'COMMERCIAL', places: ['taxistand', 'gas'], shift: [6 * 60, 18 * 60], pay: [110, 300] },
    { id: 'entregador', name: 'Entregador(a)', zone: 'COMMERCIAL', places: ['market', 'darkstore'], shift: [8 * 60, 20 * 60], pay: [100, 260] },
    { id: 'eletricista', name: 'Eletricista', zone: 'INDUSTRIAL', places: ['garage', 'factory'], shift: [8 * 60, 18 * 60], pay: [140, 260] },
    { id: 'encanador', name: 'Encanador(a)', zone: 'INDUSTRIAL', places: ['garage'], shift: [8 * 60, 18 * 60], pay: [140, 250] },
    { id: 'construtor', name: 'Pedreiro(a)', zone: 'INDUSTRIAL', places: ['construction', 'warehouse'], shift: [6 * 60, 16 * 60], pay: [120, 220] },
    { id: 'agricultor', name: 'Agricultor(a)', zone: 'RURAL', places: ['farm'], shift: [5 * 60, 17 * 60], pay: [90, 190] },
    { id: 'veterinario', name: 'Veterinário(a)', zone: 'RURAL', places: ['farm', 'clinic'], shift: [8 * 60, 18 * 60], pay: [200, 400] },
    { id: 'seguranca', name: 'Segurança', zone: 'DOWNTOWN', places: ['mall', 'bank', 'prison', 'hotel'], shift: [19 * 60, 6 * 60], pay: [130, 240] },
    { id: 'recepcionista', name: 'Recepcionista', zone: 'COMMERCIAL', places: ['hotel', 'clinic'], shift: [7 * 60, 15 * 60], pay: [95, 170] },
    { id: 'camareira', name: 'Camareira(o)', zone: 'COMMERCIAL', places: ['hotel'], shift: [8 * 60, 16 * 60], pay: [85, 150] },
    { id: 'chef', name: 'Chef de Cozinha', zone: 'COMMERCIAL', places: ['restaurant', 'hotel'], shift: [16 * 60, 23 * 60], pay: [200, 400] },
    { id: 'piloto', name: 'Piloto(a)', zone: 'AIRPORT', places: ['airport'], shift: [6 * 60, 18 * 60], pay: [500, 1100] },
    { id: 'aeromoça', name: 'Comissário(a) de Bordo', zone: 'AIRPORT', places: ['airport'], shift: [7 * 60, 19 * 60], pay: [250, 500] },
    { id: 'estivador', name: 'Estivador(a)', zone: 'PORT', places: ['port'], shift: [6 * 60, 14 * 60], pay: [130, 240] },
    { id: 'marinheiro', name: 'Marinheiro(a)', zone: 'PORT', places: ['port'], shift: [5 * 60, 17 * 60], pay: [140, 260] },
    { id: 'farmaceutico', name: 'Farmacêutico(a)', zone: 'COMMERCIAL', places: ['pharmacy'], shift: [9 * 60, 19 * 60], pay: [220, 420] },
    { id: 'funcionario_publico', name: 'Funcionário(a) Público', zone: 'DOWNTOWN', places: ['cityhall', 'courthouse'], shift: [8 * 60, 17 * 60], pay: [170, 350] },
    { id: 'artista', name: 'Artista', zone: 'COMMERCIAL', places: ['mall', 'park'], shift: [14 * 60, 22 * 60], pay: [60, 400] },
    { id: 'fotografo', name: 'Fotógrafo(a)', zone: 'COMMERCIAL', places: ['park', 'mall'], shift: [10 * 60, 18 * 60], pay: [80, 350] },
    { id: 'musico', name: 'Músico', zone: 'COMMERCIAL', places: ['bar', 'park'], shift: [18 * 60, 2 * 60], pay: [70, 400] },
    { id: 'desempregado', name: 'Desempregado(a)', zone: 'RESIDENTIAL', places: ['park', 'square'], shift: [10 * 60, 14 * 60], pay: [0, 0] },
    { id: 'aposentado', name: 'Aposentado(a)', zone: 'RESIDENTIAL', places: ['park', 'square', 'bakery'], shift: [9 * 60, 11 * 60], pay: [60, 120] },
    { id: 'dona_de_casa', name: 'Do(a) Lar', zone: 'RESIDENTIAL', places: ['supermarket', 'bakery', 'park'], shift: [9 * 60, 16 * 60], pay: [0, 0] }
  ];

  // Prédios: tipo, zona, tamanho (tiles), andares, cores, e o que oferece ao jogador
  D.BUILDINGS = {
    house: { name: 'Casa', zone: 'RESIDENTIAL', size: [4, 4], floors: 1, colors: ['#c76b4a', '#a8553a', '#d08b5b', '#8f6b4f'], interior: 'house', w: 10 },
    house_big: { name: 'Sobrado', zone: 'RESIDENTIAL', size: [5, 4], floors: 2, colors: ['#b8644a', '#9c5a3c'], interior: 'house', w: 4 },
    apartment: { name: 'Prédio Residencial', zone: 'RESIDENTIAL', size: [5, 5], floors: 5, colors: ['#8b95a3', '#7a8697', '#9aa5b2', '#c98a6a', '#b8765a'], interior: 'apartment', w: 8 },
    condo: { name: 'Condomínio', zone: 'SUBURB', size: [6, 5], floors: 8, colors: ['#93a0ae', '#8492a0'], interior: 'apartment', w: 4 },
    tower: { name: 'Torre Corporativa', zone: 'DOWNTOWN', size: [6, 6], floors: 16, colors: ['#5f7d95', '#4e6c85', '#6b8aa3', '#8a6a52', '#a3765a'], interior: 'office', w: 7 },
    office: { name: 'Escritórios', zone: 'DOWNTOWN', size: [5, 5], floors: 8, colors: ['#6d8a9f', '#7d95a8', '#a8764f', '#b38459', '#8f7a8a'], interior: 'office', w: 8 },
    bank: { name: 'Banco', zone: 'DOWNTOWN', size: [5, 4], floors: 3, colors: ['#c9b47a', '#b8a469'], interior: 'bank', w: 3 },
    mall: { name: 'Shopping', zone: 'COMMERCIAL', size: [9, 7], floors: 4, colors: ['#b9c4d0', '#a9b6c4'], interior: 'mall', w: 2 },
    shop: { name: 'Loja', zone: 'COMMERCIAL', size: [4, 3], floors: 2, colors: ['#d9876a', '#c47a5e', '#d9a06a', '#c06a6a', '#b8765a'], interior: 'shop', w: 14 },
    bakery: { name: 'Padaria', zone: 'COMMERCIAL', size: [4, 3], floors: 1, colors: ['#e0a86a', '#cf9757'], interior: 'bakery', w: 5 },
    pharmacy: { name: 'Farmácia', zone: 'COMMERCIAL', size: [4, 3], floors: 1, colors: ['#7bc47f', '#63b06a'], interior: 'pharmacy', w: 4 },
    restaurant: { name: 'Restaurante', zone: 'COMMERCIAL', size: [5, 4], floors: 1, colors: ['#cc6f52', '#b85f45', '#d1795a', '#a8624a'], interior: 'restaurant', w: 6 },
    bar: { name: 'Bar', zone: 'COMMERCIAL', size: [4, 3], floors: 1, colors: ['#a35f7a', '#8f5268'], interior: 'bar', w: 3 },
    supermarket: { name: 'Supermercado', zone: 'COMMERCIAL', size: [8, 6], floors: 1, colors: ['#d8d2c4', '#c8c2b4'], interior: 'supermarket', w: 6 },
    hotel: { name: 'Hotel', zone: 'COMMERCIAL', size: [7, 6], floors: 9, colors: ['#a58c6f', '#94806a', '#b5987a'], interior: 'hotel', w: 4 },
    hospital: { name: 'Hospital', zone: 'RESIDENTIAL', size: [8, 6], floors: 4, colors: ['#d9e2ea', '#c8d3dd'], interior: 'hospital', w: 2 },
    clinic: { name: 'Clínica', zone: 'COMMERCIAL', size: [4, 4], floors: 2, colors: ['#cfe0e8', '#bcd0da'], interior: 'clinic', w: 3 },
    school: { name: 'Escola', zone: 'RESIDENTIAL', size: [7, 5], floors: 2, colors: ['#e3d59c', '#d3c58c'], interior: 'school', w: 3 },
    university: { name: 'Universidade', zone: 'RESIDENTIAL', size: [10, 8], floors: 3, colors: ['#bfae8e', '#af9e7e'], interior: 'university', w: 1 },
    police: { name: 'Delegacia', zone: 'RESIDENTIAL', size: [5, 4], floors: 2, colors: ['#5a7fa8', '#4a6f98'], interior: 'police', w: 3 },
    firestation: { name: 'Quartel do Corpo de Bombeiros', zone: 'RESIDENTIAL', size: [6, 5], floors: 2, colors: ['#c05a4a', '#a84a3c'], interior: 'firestation', w: 1 },
    courthouse: { name: 'Fórum', zone: 'DOWNTOWN', size: [7, 6], floors: 3, colors: ['#cfc6b4', '#bfb6a4'], interior: 'courthouse', w: 1 },
    cityhall: { name: 'Prefeitura', zone: 'DOWNTOWN', size: [7, 5], floors: 3, colors: ['#d5cbb5', '#c5bba5'], interior: 'cityhall', w: 1 },
    prison: { name: 'Penitenciária', zone: 'INDUSTRIAL', size: [9, 7], floors: 2, colors: ['#7d8a92', '#6d7a82'], interior: 'prison', w: 1 },
    factory: { name: 'Fábrica', zone: 'INDUSTRIAL', size: [9, 7], floors: 2, colors: ['#8f8f96', '#7d7d84'], interior: 'factory', w: 6 },
    warehouse: { name: 'Galpão', zone: 'INDUSTRIAL', size: [8, 6], floors: 1, colors: ['#9aa0a6', '#888e94', '#a89078', '#98a08a'], interior: 'warehouse', w: 6 },
    garage: { name: 'Oficina', zone: 'INDUSTRIAL', size: [5, 4], floors: 1, colors: ['#8a8378', '#7a7368'], interior: 'garage', w: 4 },
    gas: { name: 'Posto de Combustível', zone: 'COMMERCIAL', size: [6, 5], floors: 1, colors: ['#e0e0e0', '#c8c8c8'], interior: 'gas', w: 6 },
    market: { name: 'Mercado de Bairro', zone: 'COMMERCIAL', size: [4, 3], floors: 1, colors: ['#cf9a6a', '#bf8a5a', '#c88a5a'], interior: 'market', w: 8 },
    darkstore: { name: 'Central de Entregas', zone: 'INDUSTRIAL', size: [5, 4], floors: 1, colors: ['#7f9aa8', '#6f8a98'], interior: 'warehouse', w: 4 },
    farm: { name: 'Fazenda', zone: 'RURAL', size: [7, 6], floors: 1, colors: ['#b98d5c', '#a97d4c'], interior: 'farm', w: 3 },
    port: { name: 'Terminal Portuário', zone: 'PORT', size: [9, 6], floors: 1, colors: ['#8d9ba6', '#7d8b96'], interior: 'port', w: 1 },
    airport: { name: 'Terminal Aeroportuário', zone: 'AIRPORT', size: [11, 8], floors: 2, colors: ['#c3cdd6', '#b3bdc6'], interior: 'airport', w: 1 },
    busdepot: { name: 'Garagem de Ônibus', zone: 'RESIDENTIAL', size: [7, 5], floors: 1, colors: ['#9ba7ae', '#8b979e'], interior: 'depot', w: 1 },
    construction: { name: 'Obra', zone: 'INDUSTRIAL', size: [6, 5], floors: 1, colors: ['#b0a08c', '#a0907c'], interior: null, w: 3 },
    park: { name: 'Parque', zone: 'PARK', size: [10, 9], floors: 0, colors: ['#3f9a52'], interior: null, w: 3 },
    square: { name: 'Praça', zone: 'PARK', size: [5, 5], floors: 0, colors: ['#49a85c'], interior: null, w: 5 }
  };

  // Mercadorias: preço base, volatilidade, onde se compra, categoria
  D.GOODS = {
    pao: { name: 'Pão francês', icon: '🥖', base: 8, vol: .18, cat: 'food', where: ['bakery', 'supermarket', 'market'] },
    leite: { name: 'Leite 1L', icon: '🥛', base: 5.5, vol: .12, cat: 'food', where: ['supermarket', 'market', 'bakery'] },
    cafe: { name: 'Café 500g', icon: '☕', base: 18, vol: .15, cat: 'food', where: ['supermarket', 'market'] },
    arroz: { name: 'Arroz 5kg', icon: '🍚', base: 28, vol: .1, cat: 'food', where: ['supermarket', 'market'] },
    frango: { name: 'Frango 1kg', icon: '🍗', base: 16, vol: .2, cat: 'food', where: ['supermarket', 'market'] },
    lanche: { name: 'Lanche', icon: '🍔', base: 22, vol: .1, cat: 'meal', where: ['restaurant', 'bar', 'bakery'] },
    prato: { name: 'Prato feito', icon: '🍽', base: 32, vol: .08, cat: 'meal', where: ['restaurant'] },
    pizza: { name: 'Pizza', icon: '🍕', base: 45, vol: .1, cat: 'meal', where: ['restaurant', 'shop'] },
    cerveja: { name: 'Cerveja', icon: '🍺', base: 9, vol: .22, cat: 'fun', where: ['bar', 'supermarket', 'market'] },
    remedio: { name: 'Remédio', icon: '💊', base: 24, vol: .1, cat: 'health', where: ['pharmacy'] },
    gasolina: { name: 'Gasolina (L)', icon: '⛽', base: 6.29, vol: .25, cat: 'fuel', where: ['gas'] },
    etanol: { name: 'Etanol (L)', icon: '🌱', base: 4.39, vol: .3, cat: 'fuel', where: ['gas'] },
    diesel: { name: 'Diesel (L)', icon: '🛢', base: 6.59, vol: .22, cat: 'fuel', where: ['gas'] },
    agua: { name: 'Água mineral', icon: '💧', base: 4, vol: .1, cat: 'food', where: ['supermarket', 'market', 'shop'] },
    roupa: { name: 'Camiseta', icon: '👕', base: 59, vol: .12, cat: 'clothes', where: ['mall', 'shop'] },
    tenis: { name: 'Tênis', icon: '👟', base: 189, vol: .14, cat: 'clothes', where: ['mall', 'shop'] },
    celular: { name: 'Celular', icon: '📱', base: 999, vol: .18, cat: 'tech', where: ['mall', 'shop'] },
    fone: { name: 'Fone bluetooth', icon: '🎧', base: 249, vol: .2, cat: 'tech', where: ['mall', 'shop'] },
    jornal: { name: 'Jornal', icon: '📰', base: 5, vol: .05, cat: 'misc', where: ['market', 'bakery', 'shop'] },
    flor: { name: 'Buquê de flores', icon: '💐', base: 45, vol: .2, cat: 'misc', where: ['shop', 'market'] },
    ferramenta: { name: 'Kit de ferramentas', icon: '🔧', base: 120, vol: .1, cat: 'misc', where: ['garage', 'shop'] },
    tinta: { name: 'Lata de tinta', icon: '🎨', base: 89, vol: .12, cat: 'misc', where: ['shop'] }
  };

  D.NEWS = [
    '{b}Trânsito lento{b} na {st} após acidente entre dois veículos; ninguém ficou ferido.',
    'Corpo de Bombeiros controla incêndio em imóvel na {st}.',
    'Vizinhos relatam queda de energia no {nb} durante a madrugada.',
    'Nova linha de ônibus liga o {nb} ao Centro a partir de segunda.',
    'Comerciantes da {st} comemoram aumento nas vendas.',
    'Obra na {st} deve durar duas semanas e altera o trânsito local.',
    'Feira de produtores ocupa a praça do {nb} neste fim de semana.',
    'Prefeitura anuncia reforma da escola municipal do {nb}.',
    'Assalto a loja na {st} termina com suspeito detido pela polícia.',
    'Ambulância atende emergência no {nb}; paciente passa bem.',
    'Posto da {st} registra fila após reajuste no preço do combustível.',
    'Moradores do {nb} reclamam de buracos na via principal.',
    'Caminhão carregado de frutas tomba na saída para o porto.',
    'Festival gastronômico movimenta o centro nesta semana.',
    'Universidade abre inscrições para cursos gratuitos no {nb}.',
    'Agência bancária da {st} terá atendimento reduzido na quinta.',
    'Guarda Municipal reforça patrulhamento noturno no {nb}.',
    'Chuva forte alaga trecho da {st} e motoristas enfrentam lentidão.',
    'Supermercado do {nb} contrata 30 funcionários para a nova ala.',
    'Cidade registra o dia mais movimentado do ano no trânsito.'
  ];

  D.AREAS = ['Centro', 'Jardim das Acácias', 'Vila Operária', 'Bairro do Porto', 'Alto da Serra', 'Parque Central',
    'Vila Esperança', 'Cidade Baixa', 'Setor Industrial', 'Praia Grande', 'Morada Nova', 'Serra Azul'];

  /* ------------------------------------------------------------------ */
  /* RELÓGIO DE JOGO                                                    */
  /* ------------------------------------------------------------------ */
  LIFE.Clock = class Clock {
    constructor(minutes, day) { this.min = minutes || LIFE.CONFIG.DAY_START_MIN; this.day = day || 1; this.speed = 1; this.frac = 0; }
    get hour() { return Math.floor(this.min / 60) % 24; }
    get mm() { return Math.floor(this.min % 60); }
    get totalMin() { return this.min + this.day * 1440; }
    get dayName() { return ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][(this.day - 1) % 7]; }
    get isWeekend() { return this.day % 7 === 0 || this.day % 7 === 6; }
    // 0 = madrugada, 1 = meio-dia
    get sun() { return LIFE.Util.clamp01(Math.sin(((this.min / 1440) * Math.PI * 2) - Math.PI / 2) * 1.4 + .5); }
    get phase() {
      const h = this.hour + this.mm / 60;
      if (h < 5) return 'night';
      if (h < 7) return 'dawn';
      if (h < 17.5) return 'day';
      if (h < 19.5) return 'dusk';
      return 'night';
    }
    advance(gameMin) {
      this.min += gameMin;
      while (this.min >= 1440) { this.min -= 1440; this.day++; this.onNewDay && this.onNewDay(); }
    }
    // horas até um horário alvo (para rotinas)
    hoursUntil(hour) { const d = (hour - (this.min / 60) + 24) % 24; return d; }
  };

  /* ------------------------------------------------------------------ */
  /* INPUT                                                              */
  /* ------------------------------------------------------------------ */
  LIFE.Input = {
    keys: {}, pressed: {}, mouse: { x: 0, y: 0, down: false, rdown: false, wheel: 0 },
    init(canvas) {
      const self = this;
      window.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        const k = e.key.toLowerCase();
        self.keys[k] = true; self.pressed[k] = true;
        if (['tab', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
      });
      window.addEventListener('keyup', (e) => { self.keys[e.key.toLowerCase()] = false; });
      window.addEventListener('blur', () => { self.keys = {}; });
      canvas.addEventListener('mousemove', (e) => { self.mouse.x = e.clientX; self.mouse.y = e.clientY; });
      canvas.addEventListener('mousedown', (e) => { if (e.button === 0) self.mouse.down = true; if (e.button === 2) self.mouse.rdown = true; });
      window.addEventListener('mouseup', (e) => { if (e.button === 0) self.mouse.down = false; if (e.button === 2) self.mouse.rdown = false; });
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      canvas.addEventListener('wheel', (e) => { self.mouse.wheel += Math.sign(e.deltaY); }, { passive: true });
    },
    down(k) { return !!this.keys[k]; },
    axis() {
      let x = 0, y = 0;
      if (this.keys['a'] || this.keys['arrowleft']) x -= 1;
      if (this.keys['d'] || this.keys['arrowright']) x += 1;
      if (this.keys['w'] || this.keys['arrowup']) y -= 1;
      if (this.keys['s'] || this.keys['arrowdown']) y += 1;
      const l = Math.hypot(x, y);
      return l > 1 ? { x: x / l, y: y / l } : { x, y };
    },
    justPressed(k) { if (this.pressed[k]) { this.pressed[k] = false; return true; } return false; },
    endFrame() { this.pressed = {}; this.mouse.wheel = 0; }
  };

  /* ------------------------------------------------------------------ */
  /* ÁUDIO SINTETIZADO (sem arquivos externos)                          */
  /* ------------------------------------------------------------------ */
  LIFE.Audio = {
    ctx: null, master: null, muted: false, ambience: null, rain: null, started: false,
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC(); } catch (e) { return; }
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
      this.buildAmbience();
      this.started = true;
    },
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    toggleMute() {
      this.muted = !this.muted;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.55;
      return this.muted;
    },
    // ruído branco em loop (base para trânsito, chuva, vento)
    noiseSource() {
      const ctx = this.ctx, len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      return src;
    },
    buildAmbience() {
      const ctx = this.ctx;
      // trânsito: ruído passa-baixa
      const n = this.noiseSource();
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 330; lp.Q.value = .7;
      const g = ctx.createGain(); g.gain.value = 0.035;
      n.connect(lp).connect(g).connect(this.master);
      n.start();
      this.ambience = { gain: g, filter: lp };
      // chuva: ruído passa-alta (ligado só quando chove)
      const n2 = this.noiseSource();
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1600;
      const g2 = ctx.createGain(); g2.gain.value = 0;
      n2.connect(hp).connect(g2).connect(this.master);
      n2.start();
      this.rain = { gain: g2 };
      // vento: ruído band-pass lento
      const n3 = this.noiseSource();
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 480; bp.Q.value = .6;
      const g3 = ctx.createGain(); g3.gain.value = 0.012;
      n3.connect(bp).connect(g3).connect(this.master);
      n3.start();
      this.wind = { gain: g3 };
    },
    setAmbience(levelTraffic, rainAmount, windAmount) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.ambience.gain.gain.setTargetAtTime(0.012 + levelTraffic * 0.05, t, 1.2);
      this.rain.gain.gain.setTargetAtTime(rainAmount * 0.09, t, 1.2);
      this.wind.gain.gain.setTargetAtTime(windAmount * 0.05, t, 1.2);
    },
    // ---- efeitos pontuais ----
    beep(freq, dur, type, vol, slideTo) {
      if (!this.ctx || this.muted) return;
      const ctx = this.ctx, t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || .12, t + .01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + .02);
    },
    noiseBurst(dur, freq, vol) {
      if (!this.ctx || this.muted) return;
      const ctx = this.ctx, t = ctx.currentTime;
      const n = this.noiseSource();
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 1200;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol || .2, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      n.connect(f).connect(g).connect(this.master); n.start(t); n.stop(t + dur + .05);
    },
    horn() { this.beep(420, .35, 'square', .07, 380); this.beep(560, .35, 'square', .05); },
    siren() {
      if (!this.ctx || this.muted) return;
      const ctx = this.ctx, t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(660, t);
      for (let i = 0; i < 4; i++) {
        o.frequency.setValueAtTime(880, t + .35 * i);
        o.frequency.setValueAtTime(620, t + .35 * i + .17);
      }
      g.gain.setValueAtTime(.05, t); g.gain.setValueAtTime(0, t + 1.35);
      o.connect(g).connect(this.master); o.start(t); o.stop(t + 1.4);
    },
    cash() { this.beep(1180, .08, 'square', .06); setTimeout(() => this.beep(1580, .12, 'square', .05), 70); },
    door() { this.noiseBurst(.16, 700, .12); },
    eat() { this.beep(300, .1, 'triangle', .08, 220); },
    step() { this.noiseBurst(.045, 500, .035); },
    crash() { this.noiseBurst(.45, 900, .3); this.beep(90, .3, 'sawtooth', .1, 50); },
    thunder() { this.noiseBurst(1.4, 700, .32); },
    notif() { this.beep(880, .1, 'sine', .09); setTimeout(() => this.beep(1320, .14, 'sine', .07), 90); },
    error() { this.beep(180, .22, 'square', .08, 120); },
    coin() { this.beep(1046, .07, 'square', .06); setTimeout(() => this.beep(1568, .16, 'square', .06), 60); }
  };

  /* ------------------------------------------------------------------ */
  /* SAVE / LOAD                                                        */
  /* ------------------------------------------------------------------ */
  LIFE.Save = {
    KEY: 'life-cidade-viva-save',
    has() { try { return !!localStorage.getItem(this.KEY); } catch (e) { return false; } },
    write(data) { try { localStorage.setItem(this.KEY, JSON.stringify(data)); return true; } catch (e) { return false; } },
    read() { try { const s = localStorage.getItem(this.KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } },
    clear() { try { localStorage.removeItem(this.KEY); } catch (e) { } }
  };

  /* ------------------------------------------------------------------ */
  /* LOG                                                                */
  /* ------------------------------------------------------------------ */
  LIFE.log = function () {
    if (LIFE.CONFIG.DEBUG) console.log('[LIFE]', ...arguments);
  };
})();
