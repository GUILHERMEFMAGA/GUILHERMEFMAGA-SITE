# 🚗 Rua Vermelha — jogo de mundo aberto estilo GTA 1 / GTA 2

> ⚠️ **Conteúdo violento (+16):** sangue, armas de fogo, tiroteios e corpos no chão (tudo em 2D, visto de cima).

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
| Espaço | atacar / atirar (segure para armas automáticas) |
| Q · 1 a 6 | trocar de arma (punhos, taco, pistola, SMG, escopeta, granada) |
| E | entrar em carro (qualquer um!), atender telefone, pegar o carro na garagem, **comprar na loja de armas** (prédio rosa, perto da garagem) |

| De carro | |
|---|---|
| W / ↑ · S / ↓ | acelera · freia / ré |
| A D / ← → | virar |
| Espaço | freio de mão (derrapa!) |
| H | buzina |
| E | sair do carro (ou consertar e repintar na oficina, $150) |

Geral: **R** troca de rádio (funk, rock, eletrônica) · **M** liga/desliga o som · **P** pausa · **V** troca o visual (Cinema pixel art → Cinema suave → Clássico).

## Visual cinematográfico
Pixel art 2.5D com luz dinâmica (`luz.js`): prédios com fachada e janelas, ciclo de dia/noite com cor de ambiente, faróis, postes, sirenes e explosões que iluminam de verdade, neblina em camadas, raios de sol, bloom e cor de cinema. Se ficar pesado no seu computador, aperte **V** para um visual mais leve.

## Objetivo
- Atenda os **telefones amarelos** espalhados pela cidade para receber missões.
- São **12 missões** (entrega, táxi, roubo de carro, corrida, fuga e 2 missões de tiroteio) — depois vem o modo livre.
- Junte **$4000** e complete tudo para virar o **Rei da Cidade**.
- O progresso (dinheiro, missões, cor do carro) é salvo no `localStorage`.

## Violência e armas
- Tiros e atropelamentos **matam** pedestres: sangue, poças e corpos que ficam no chão; eles largam dinheiro e às vezes armas.
- Armas: punhos, taco, pistola, submetralhadora, escopeta e granada. Compre na **loja de armas** ou pegue de policiais e bandidos mortos.
- Colete à prova de balas e kits médicos (dropados ou na loja/hospital).
- Carros amassam, levam tiros, pegam fogo e explodem; derrapar deixa marca de pneu.
- Alguns civis andam armados e reagem se forem atacados.

## Polícia e perseguições
- Nível de procurado de 0 a 5 (rostinhos de policial no topo).
- Dá procurado: matar/atropelar gente, atirar, bater em viatura, roubar carro perto da polícia.
- Nível 1-2: os policiais descem da viatura e tentam te **prender**. Nível 3+: eles **atiram** (inclusive das viaturas).
- Nível 4-5: equipe tática com submetralhadora/escopeta, bloqueios de rua e helicóptero que atira.
- Matar um policial leva direto ao procurado máximo.
- Para despistar: saia da vista, troque de carro ou **repinte na oficina**.
- Se a polícia te cercar, você é **preso** e **perde as armas**; se a vida acabar, vai ao **hospital** — nos dois casos perde uma parte do dinheiro (não tem game over).

## Arquivos
| Arquivo | O que faz |
|---|---|
| `index.html` | página do jogo |
| `world.js` | mapa em tiles, prédios, parque, rio e pontes; desenho do cenário |
| `sprites.js` | carros (com dano visível) e pedestres/armas desenhados por código |
| `combat.js` | armas, balas, sangue, corpos, granadas, polícia a pé, itens e loja de armas |
| `car.js` | física arcade e colisões |
| `ai.js` | tráfego, semáforos, pedestres, polícia, helicóptero |
| `missions.js` | telefones, lugares e as 12 missões |
| `luz.js` | iluminação dinâmica, neblina, bloom, pixel art e cor de cinema |
| `hud.js` | dinheiro, vida, procurado, legenda amarela, minimapa |
| `audio.js` | motor, pneu, batida, sirene e rádios (WebAudio) |
| `game.js` | laço principal, jogador, câmera, dia/noite, telas |
