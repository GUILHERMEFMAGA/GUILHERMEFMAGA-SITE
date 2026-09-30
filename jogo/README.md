# 🚗 Rua Vermelha — jogo de mundo aberto estilo GTA 1 / GTA 2

Jogo 2D em visão de cima feito com **HTML5 Canvas + JavaScript puro** (sem bibliotecas, sem instalar nada).
Segue o prompt em [`PROMPT-DO-JOGO.md`](PROMPT-DO-JOGO.md) e a imagem `imagens/gta1-estilo-limpo.png`.

## Como jogar
**Jogar online (sem instalar nada):** https://raw.githack.com/GUILHERMEFMAGA/GUILHERMEFMAGA-SITE/arena/01a0f45d-guilhermefmaga-site/jogo/rua-vermelha.html

**Ou baixe o arquivo único** `rua-vermelha.html` (aba *Raw* → salvar como) e dê duplo clique.

Abra `index.html` no navegador (duplo clique) ou rode um servidor local:

```bash
cd jogo
python -m http.server 8080      # depois abra http://localhost:8080
```

## Controles
| A pé | |
|---|---|
| WASD / setas | andar |
| Shift | correr |
| Espaço | soco (cartunesco, sem sangue) |
| E | entrar em carro (qualquer um!), atender telefone, pegar o carro na garagem |

| De carro | |
|---|---|
| W / ↑ · S / ↓ | acelera · freia / ré |
| A D / ← → | virar |
| Espaço | freio de mão (derrapa!) |
| H | buzina |
| E | sair do carro (ou consertar e repintar na oficina, $150) |

Geral: **R** troca de rádio (funk, rock, eletrônica) · **M** liga/desliga o som · **P** pausa.

## Objetivo
- Atenda os **telefones amarelos** espalhados pela cidade para receber missões.
- São **10 missões** (entrega, táxi, roubo de carro, corrida contra rivais e fuga) — depois vem o modo livre.
- Junte **$3000** e complete tudo para virar o **Rei da Cidade**.
- O progresso (dinheiro, missões, cor do carro) é salvo no `localStorage`.

## Polícia e perseguições
- Nível de procurado de 0 a 5 (rostinhos de policial no topo).
- Dá procurado: atropelar pedestre, bater em viatura, roubar carro perto da polícia.
- Mais estrelas = mais viaturas, bloqueios de rua e helicóptero com holofote.
- Para despistar: saia da vista, troque de carro ou **repinte na oficina**.
- Se a polícia te cercar, você é **preso**; se a vida acabar, vai ao **hospital** — nos dois casos perde uma parte do dinheiro (não tem game over).

## Arquivos
| Arquivo | O que faz |
|---|---|
| `index.html` | página do jogo |
| `world.js` | mapa em tiles, prédios, parque, rio e pontes; desenho do cenário |
| `sprites.js` | carros e pedestres desenhados por código |
| `car.js` | física arcade e colisões |
| `ai.js` | tráfego, semáforos, pedestres, polícia, helicóptero |
| `missions.js` | telefones, lugares e as 10 missões |
| `hud.js` | dinheiro, vida, procurado, legenda amarela, minimapa |
| `audio.js` | motor, pneu, batida, sirene e rádios (WebAudio) |
| `game.js` | laço principal, jogador, câmera, dia/noite, telas |
