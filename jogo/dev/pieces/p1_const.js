  // ---------- Medidas do mapa ----------
  const T = 32;          // tamanho de um tile em pixels
  const ROAD = 8;        // largura da rua (tiles) = 2 faixas de 4 tiles (ruas largas)
  const BLOCK = 20;      // lado de uma quadra (tiles): quadras GRANDES, para caber casas e prédios de verdade
  const PITCH = ROAD + BLOCK;
  const COLS = 65, ROWS = 10;  // mapa GIGANTE: 4 cidades bem longe uma da outra, fazendas de bilionários e duas florestas enormes
  const RODOVIA = 5;     // a rodovia que atravessa o mapa inteiro (linha de rua 5)
  const RIVER = 3;       // o primeiro rio (o da cidade grande)
  const RIVERS = [3, 9, 34, 49, 59];          // colunas de quadras ocupadas por rios
  // rio -> linhas de rua onde existe ponte ('todas' = uma ponte em cada rua). Os rios de fora têm UMA ponte (a da rodovia, com pedágio); novas pontes são construídas por cidade.js
  const PONTES = { 3: 'todas', 9: [RODOVIA], 34: [RODOVIA], 49: [RODOVIA], 59: [RODOVIA] };
  // as regiões do mapa, do oeste para o leste. 'ate' = primeira coluna da região seguinte; 'urb' = [coluna0, coluna1, linha0, linha1] da parte urbana
  const CIDADES = [
    { id: 'ribeirao', nome: 'RIBEIRÃO PRETO', sub: 'a cidade grande', ate: 9, estilo: 'classica', tipo: 'cidade', urb: [0, 8, 0, 9] },
    { id: 'santarita', nome: 'FAZENDAS SANTA RITA', sub: 'plantações e fazendas de bilionários', ate: 14, estilo: 'rustica', tipo: 'campo' },
    { id: 'mata', nome: 'MATA ESCURA', sub: 'a floresta gigante', ate: 34, estilo: 'mata', tipo: 'mata' },
    { id: 'interior', nome: 'NOVO HORIZONTE', sub: 'interior — cidade em construção', ate: 41, estilo: 'moderna', tipo: 'cidade', urb: [35, 40, 2, 7] },
    { id: 'gaviao', nome: 'MATA DO GAVIÃO', sub: 'floresta fechada, sem sinal de celular', ate: 49, estilo: 'mata', tipo: 'mata' },
    { id: 'vale', nome: 'VALE VERDE', sub: 'cidade ecológica e aeroporto', ate: 57, estilo: 'ecologica', tipo: 'cidade', urb: [50, 56, 2, 7] },
    { id: 'litoral', nome: 'FAZENDAS DO LITORAL', sub: 'fazendas perto do mar', ate: 59, estilo: 'rustica', tipo: 'campo' },
    { id: 'porto', nome: 'PORTO DO SOL', sub: 'cidade portuária', ate: 99, estilo: 'portuaria', tipo: 'cidade', urb: [60, 64, 2, 7] }
  ];
  const MG = 6;          // margem fora das ruas (calçada + prédios)
  const INNER_W = COLS * PITCH + ROAD;
  const INNER_H = ROWS * PITCH + ROAD;
  const TW = INNER_W + MG * 2, TH = INNER_H + MG * 2;
  const W = TW * T, H = TH * T;

  // tipos de tile
  const TILE = { ROAD: 0, SIDE: 1, BUILD: 2, GRASS: 3, WATER: 4, BRIDGE: 5, CROSS: 6, LOT: 7 };   // LOT = estacionamento
