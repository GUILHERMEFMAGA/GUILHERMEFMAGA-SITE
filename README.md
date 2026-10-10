<img width="800" height="450" alt="b_deixe_um_pouco_mais_-ezgif com-video-to-gif-converter" src="https://github.com/user-attachments/assets/a73e7bcd-c59c-463b-8b60-aae618b7e519" />
 
# Meu agente de IA local 🤖

Este repositório contém o **NÚCLEO**: um agente de IA que roda no meu computador,
escrito em **Python puro**, **sem API paga**, **sem Ollama** e **sem instalar nenhum pacote**.

Ele tem rede neural (feita do zero), memória, ferramentas e automações no estilo n8n.

👉 Comece por aqui: **[agente-ia/GUIA-DO-INICIADOR.md](agente-ia/GUIA-DO-INICIADOR.md)**
(passo a passo do zero, em português, feito para quem está começando)

📘 Documentação técnica: **[agente-ia/LEIA-ME.md](agente-ia/LEIA-ME.md)**

## Site Brasa Burger

O repositório também inclui uma página inicial responsiva para uma hamburgueria fictícia, feita sem dependências. O burger principal se desmonta em camadas com o movimento do mouse; no celular, use o botão de interação. O cardápio tem filtros e uma sacola demonstrativa com opção de compartilhar o pedido.

Para abrir o site na raiz do repositório:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Os arquivos do site são `index.html`, `styles.css`, `script.js` e os assets em `public/images/`.

## Rodar em 10 segundos

```bash
cd agente-ia
python main.py        # conversa no terminal
python main.py web    # painel no navegador (http://localhost:8000)
```

## O que ele faz

| Recurso | Estado |
|---|---|
| Rede neural MLP treinada com backpropagation (só biblioteca padrão) | ✅ |
| Memória curta + memória longa em SQLite (`meu nome é ...`) | ✅ |
| 11 ferramentas: cálculo seguro, arquivos, resumo, análise de texto, sistema | ✅ |
| Automações estilo n8n: gatilho por horário/intervalo e passos com `{{variaveis}}` | ✅ |
| Painel web sem Flask (servidor HTTP da biblioteca padrão) | ✅ |
| "Não sei" honesto quando a confiança é baixa (anti-alucinação) | ✅ |

---

# Jogo: Noite na Cidade (`jogo/`)

Jogo de ação em **pixel art 2D, visto de cima**, inspirado no GTA 1: uma cidade à noite com ruas largas em grade, postes de luz laranja, trânsito em mão dupla e uma ponte sobre o rio escuro. Feito só com HTML, CSS e JavaScript puro, sem dependências nem build.

## Como jogar

```bash
python3 -m http.server 8080   # na raiz do repositório
# abra http://localhost:8080/jogo/
```

Também funciona abrindo `jogo/index.html` direto no navegador.

| Tecla | Ação |
|---|---|
| WASD / setas | andar e dirigir |
| E / Enter | entrar, sair ou roubar um carro |
| Espaço | soco (a pé) / freio de mão (no carro) |
| Shift | correr |
| H | buzina |
| P / Esc | pausa |
| M | liga/desliga o som |

No celular aparecem um joystick e botões de toque.

## O que tem

- **Missões nos orelhões amarelos**, em ciclo: entrega expressa, táxi noturno, roubo de esportivo (entregar na Garagem do Porto) e corrida de checkpoints contra o relógio.
- **Nível de procurado** de 1 a 5 estrelas, com viaturas que perseguem o jogador. Dá para ser preso ou detonado. A garagem de **PINTURA** troca a cor do carro e despista a polícia por $400, ou só conserta por $100.
- **Trânsito em mão dupla** (cerca de 100 carros): duas faixas por sentido, mão direita, semáforos e conversões suaves. Os cruzamentos usam reserva de trajetória, então os carros não se sobrepõem. Os pedestres esperam o sinal fechar para atravessar.
- **Visual**: luz ambiente noturna, brilho laranja dos postes, neon, faróis, sirenes, reflexos na água, barcos no rio e minimapa.
- **Recorde** salvo no `localStorage`.

## Estrutura

| Arquivo | Conteúdo |
|---|---|
| `js/core.js` | constantes, utilidades, teclado/toque, sons sintetizados (WebAudio) |
| `js/mapa.js` | geração da cidade: grade de ruas, rio, ponte, quarteirões, postes |
| `js/sprites.js` | sprites de carros e pedestres desenhados por código |
| `js/arte.js` | pré-render do mapa, mapa de luz e minimapa |
| `js/trafego.js` | IA do trânsito, semáforos e reserva de cruzamentos |
| `js/entidades.js` | física dos carros, pedestres, jogador e polícia |
| `js/missoes.js` | missões |
| `js/jogo.js` | loop principal, câmera, renderização e HUD |

A fonte é a *Press Start 2P* (licença OFL, em `jogo/fontes/`).
