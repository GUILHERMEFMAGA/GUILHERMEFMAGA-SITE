# LIFE: CIDADE VIVA 🏙

Um **simulador de vida em mundo aberto** que roda direto no navegador — sem instalar nada,
sem servidor, sem bibliotecas. Só HTML, CSS e JavaScript puro.

A ideia central: **a cidade vive com ou sem você.** Se você largar o controle e só observar,
vai ver gente saindo para o trabalho, ônibus circulando, lojas abrindo, entregas acontecendo
e a polícia respondendo a ocorrências.

---

## ▶ Como jogar

**Do jeito mais simples:** abra `index.html` com dois cliques (Chrome, Edge ou Firefox).

**Com servidor local** (recomendado, carrega mais rápido em alguns navegadores):

```bash
cd life-cidade-viva
python -m http.server 8000
# depois abra http://localhost:8000
```

Ao abrir, escolha **NOVO JOGO** e a semente da cidade (a mesma semente gera sempre a mesma cidade).
O botão **MODO OBSERVADOR** começa a câmera acompanhando moradores aleatórios — é a melhor forma
de ver a cidade funcionando sozinha.

---

## 🎮 Controles

| Tecla | Ação |
|---|---|
| `W A S D` / setas | Andar (dentro do veículo: dirigir) |
| `Shift` | Correr / acelerar |
| `E` | Entrar em prédio, entrar em veículo, conversar, interagir |
| `Espaço` | Freio de mão |
| `L` / `H` | Faróis / buzina |
| `TAB` | Celular (Empregos, Mapa, Banco, Mochila, Vida) |
| `P` | Pausar |
| `+` / `−` (ou botões) | Velocidade do tempo: 1×, 6×, 30× |
| `C` / roda do mouse | Câmera: normal, ampla (observar), aproximada |
| `M` | Som ligado/desligado |
| `Esc` | Fechar janelas |

---

## 🧭 Primeiros passos sugeridos

1. Abra o **celular** (`TAB`) → **Empregos** → aceite uma **entrega rápida**.
2. Siga o **círculo amarelo** no minimapa: colete o pacote e leve até o endereço.
3. Com o dinheiro, compre comida no **Mercado** ou **Padaria** e abasteça o carro no **Posto**.
4. Aceite um **emprego fixo**, vá até o local durante o turno e trabalhe no posto de trabalho.
5. Alugue um imóvel (**Banco → Alugar kitnet**) para ter onde dormir, tomar banho e cozinhar.
6. Aperte `30×` e apenas **assista**: acidentes, incêndios, obras e notícias acontecem sozinhos.

---

## 🧱 O que já funciona

| Sistema | Estado |
|---|---|
| Cidade procedural por semente (ruas, avenidas, quarteirões, 294×294 tiles) | ✅ |
| Bairros por zona: centro financeiro, comércio, residencial, subúrbio, industrial, rural, porto, aeroporto, praia, floresta | ✅ |
| Parque com lago, canal com pontes, praia e oceano | ✅ |
| Prédios variados (casas, sobrados, prédios, torres, shopping, hotel, hospital, fórum, presídio, fábrica…) | ✅ |
| Ciclo completo de 24 h com nascer/pôr do sol e noite iluminada | ✅ |
| Iluminação urbana: postes, janelas acesas por prédio, letreiros de comércio, faróis dos veículos | ✅ |
| Clima dinâmico: limpo, nublado, chuva, tempestade (com raios) e neblina | ✅ |
| Trânsito com semáforos por interseção, troca de faixa, frenagem, buzina e caminhões/ônibus/motos/táxis | ✅ |
| 2.200 moradores com nome, idade, profissão, casa, trabalho, salário e rotina diária montada do zero | ✅ |
| Simulação em dois níveis: **abstrata** (todos os 2.200, mesmo longe) e **completa** (dezenas na tela) | ✅ |
| Pedestres com destinos reais, celular na mão, entrada em prédios e atravessia cautelosa | ✅ |
| Eventos espontâneos: acidentes, incêndios, assaltos, emergências, obras, falta de energia, animal solto | ✅ |
| Serviços públicos: ambulância, viatura e caminhão de bombeiros saem para atender ocorrências (com sirene) | ✅ |
| Interiores procedurais acessíveis (casa, shopping, supermercado, restaurante, hotel, hospital, escola, fórum, presídio, fábrica…) | ✅ |
| Funcionários trabalhando dentro dos prédios, com nome visível | ✅ |
| Necessidades do jogador: fome, energia, higiene e humor (com dormir, comer, cozinhar e tomar banho) | ✅ |
| Veículos com combustível, desgaste, dano por batida, faróis, buzina e abastecimento no posto | ✅ |
| Empregos, bicos (entrega e corrida de táxi), pagamento por hora e missões com marcador no mapa | ✅ |
| Economia viva: preços por categoria, estoque por loja, reposição, inflação e mercado financeiro oscilando | ✅ |
| Notícias geradas a partir do que acontece na cidade | ✅ |
| Salvar / carregar no navegador | ✅ |
| Áudio ambiente sintetizado (trânsito, chuva, vento, buzina, sirene, trovão) | ✅ |

## 🗺 Para onde isso vai (próximos passos)

Nada aqui é promessa vazia — são os sistemas que ainda **não** existem e a ordem natural de evolução:

- **Justiça e presídio jogáveis:** testemunhas, câmeras, investigação, julgamento e cumprimento de pena.
- **Empresas do jogador:** abrir loja, contratar, definir preços, comprar estoque e expandir filiais.
- **Imóveis comprados e mobiliados** e aluguel de verdade com contratos.
- **Telões e publicidade** com campanhas que afetam as vendas.
- **Animais** (domésticos e selvagens) com comportamento próprio.
- **Mais profundidade nos interiores:** mercadorias nas prateleiras com reposição visível, cozinha do restaurante funcionando pedido a pedido.
- **Dia/noite dentro de casa, mobília comprada pelo jogador e decoração.**
- **Acessibilidade e mobile:** controles na tela e ajustes de desempenho.

---

## 🧩 Arquitetura dos arquivos

```
life-cidade-viva/
├── index.html        → tela, HUD, celular, menus
├── css/style.css     → interface
└── js/
    ├── core.js       → utilidades, RNG determinístico, dados (nomes, profissões, mercadorias),
    │                   relógio de 24 h, input, áudio sintetizado, save
    ├── world.js      → geração da cidade, grafo viário, calçadas, interiores, mapas
    ├── render.js     → câmera, desenho do mundo, dia/noite, clima, luzes e minimapa
    ├── sim.js        → moradores (LOD), trânsito, semáforos, clima, eventos, economia
    ├── game.js       → jogador, veículos, interiores, empregos, missões, laço principal
    └── ui.js         → HUD, celular, lojas, diálogos e modo observador
```

### Detalhes técnicos que valem a pena

- **Determinismo:** tudo sai de um RNG com semente nomeada (`semente + '::' + sistema`). A mesma
  semente reconstrói exatamente a mesma cidade, com os mesmos moradores e as mesmas janelas acesas.
- **LOD de simulação:** todos os 2.200 moradores têm posição calculada a partir do próprio horário
  (barato), e só os que estão perto do jogador ganham corpo, rota e animação (caro).
- **Orçamento de simulação:** em 30×, a cidade reduz automaticamente a quantidade de corpos ativos
  para manter a suavidade — a simulação abstrata continua rodando para todos.
- **Grafo de calçadas com A\*** por buckets para os pedestres e grafo de ruas com faixas de
  rolamento (mão direita) para os veículos.
- **Zero dependências:** nenhuma biblioteca, nenhuma requisição externa, nenhuma conta.

---

## 📄 Licença e créditos

Projeto pessoal, feito em JavaScript puro. Conceitos gerais de mundo aberto, simulação urbana e
gerenciamento econômico são inspiração comum do gênero — nenhum personagem, mapa, marca ou conteúdo
de outras franquias foi copiado.

Divirta-se. E, de vez em quando, apenas pare e olhe a rua. 🚦
