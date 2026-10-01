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
| E | entrar em carro (qualquer um!), atender telefone, pegar o carro na garagem, **comprar na loja de armas** (prédio rosa, perto da garagem), **entrar nos lugares**, usar objetos da rua e conversar com pedestres |

| De carro | |
|---|---|
| W / ↑ · S / ↓ | acelera · freia / ré |
| A D / ← → | virar |
| Espaço | freio de mão (derrapa!) |
| H | buzina |
| E | sair do carro (ou consertar e repintar na oficina, $150) |

Geral: **R** troca de rádio (funk, rock, eletrônica) · **M** liga/desliga o som · **P** pausa · **V** troca o visual (Cinema nítido → Clássico → Cinema pixel art).

## Visual cinematográfico
Visual 2.5D com luz dinâmica (`luz.js`; o modo pixel art fica na tecla V): prédios com fachada e janelas, ciclo de dia/noite com cor de ambiente, faróis, postes, sirenes e explosões que iluminam de verdade, neblina em camadas, raios de sol, bloom e cor de cinema. Detalhes extras: hidrantes, lixeiras, bancos, caixas de correio, bancas, vasos e pontos de ônibus nas calçadas; toldos, janelas e canos nas fachadas; painéis solares, exaustores e antenas nos telhados; poças, flores no parque, brilhos na água, fumaça saindo dos bueiros, pombos que voam quando você chega perto e pedestres com boné, chapéu, óculos e mochila.

Se ficar pesado no seu computador, aperte **V** para um visual mais leve.

## A nossa cidade (Ribeirão Preto)
Nove lugares da cidade têm **portas para entrar** (círculo colorido no chão, ponto colorido no minimapa; tecla **E**). Por dentro cada um é uma sala desenhada por código, com atendente e objetos para usar. **ESC** ou a porta de baixo = sair. Com a polícia atrás de você só a igreja aceita visita.

| Lugar | O que dá para fazer |
|---|---|
| **Pinguim Chopp** | chopp ($12, cura mas deixa tonto), pastel, jukebox troca a música, sinuca valendo aposta |
| **Mercadão** | pastel, caldo de cana, colete à prova de balas ($150) |
| **Farmácia** | kit médico ($60), vitaminas ($25), balança |
| **Barbearia** | muda o corte e a cor do cabelo (mostra o seu visual no cartão) |
| **Shopping** | camisa, calça, tênis e acessórios — o visual do personagem muda de verdade |
| **Theatro Pedro II** | compre ingresso na bilheteria e assista ao espetáculo (passa o tempo e cura) |
| **Minha casa** | cama (dorme até amanhecer, **salva o jogo**), geladeira, TV com notícias, computador com seu progresso |
| **Academia** | cada treino ($10) dá +força nos socos (até 5) |
| **Catedral** | velas, bancos para rezar e confissão ($100 limpa a ficha na polícia) |

Na rua: **hidrantes** (jorram água), **lixeiras** (às vezes tem dinheiro), **bancos** (sente e recupere vida), **caixas de correio**, **bancas de jornal**, **máquinas de refrigerante** e **pontos de ônibus** (viagem rápida, $5). Os pedestres agora respondem: aperte **E** perto de um deles para conversar — eles dão dicas, falam da cidade e às vezes mostram o caminho até um lugar (seta no jogo e no minimapa). Também cumprimentam e reagem a armas.

## Trânsito mais vivo
Motoristas com personalidade (calmos, normais e apressados), pisca-pisca antes de virar, carros que cedem à sirene da polícia, buzinas quando alguém fica preso no verde, mais carros na hora do rush e menos de madrugada.

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
| `detalhes.js` | pombos e fumaça dos bueiros |
| `lugares.js` | lugares de Ribeirão para entrar (salas por dentro), objetos de rua, conversas, visual do personagem |
| `hud.js` | dinheiro, vida, procurado, legenda amarela, minimapa |
| `audio.js` | motor, pneu, batida, sirene e rádios (WebAudio) |
| `game.js` | laço principal, jogador, câmera, dia/noite, telas |
