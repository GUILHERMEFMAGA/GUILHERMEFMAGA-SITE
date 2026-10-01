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
| F | (dentro de casas e lugares, com arma na mão) **ameaçar** um morador ou atendente e levar o dinheiro dele |
| X | comer algo da mochila (cura; energético faz você correr mais) |
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
Os lugares abaixo têm **portas para entrar** (círculo colorido no chão, ponto colorido no minimapa; tecla **E**). Por dentro cada um é uma sala desenhada por código, com atendente e objetos para usar. **ESC** ou a porta de baixo = sair. Com a polícia atrás de você só a igreja aceita visita.

| Lugar | O que dá para fazer |
|---|---|
| **Pinguim Chopp** | chopp ($12, cura mas deixa tonto), pastel, jukebox troca a música, sinuca valendo aposta |
| **Mercadão / Atacadão** | supermercados gigantes — veja a seção própria abaixo |
| **Banco, Padaria, Pizzaria** | novos lugares nos bairros novos |
| **Hotéis** | quatro hotéis, do luxo ao mais feio — veja a seção própria abaixo |
| **Farmácia** | kit médico ($60), vitaminas ($25), balança |
| **Barbearia** | muda o corte e a cor do cabelo (mostra o seu visual no cartão) |
| **Shopping** | camisa, calça, tênis e acessórios — o visual do personagem muda de verdade |
| **Theatro Pedro II** | compre ingresso na bilheteria e assista ao espetáculo (passa o tempo e cura) |
| **Minha casa** | cama (dorme até amanhecer, **salva o jogo**), geladeira, TV com notícias, computador com seu progresso |
| **Academia** | academia grande e funcionando: passe do dia ($15), esteira dá fôlego, peso e saco de pancada dão força (mini-jogo de timing) — veja abaixo |
| **Catedral** | velas, bancos para rezar e confissão ($100 limpa a ficha na polícia) |

Na rua: **hidrantes** (jorram água), **lixeiras** (às vezes tem dinheiro), **bancos** (sente e recupere vida), **caixas de correio**, **bancas de jornal**, **máquinas de refrigerante** e **pontos de ônibus** (viagem rápida, $5). Os pedestres agora respondem: aperte **E** perto de um deles para conversar — eles dão dicas, falam da cidade e às vezes mostram o caminho até um lugar (seta no jogo e no minimapa). Também cumprimentam e reagem a armas.

## Mapa dobrado
A cidade agora tem **9 × 6 quarteirões** (antes eram 6 × 4): bairros novos de **vilas** (casinhas com quintal e becos), dois **supermercados com estacionamento**, quatro **hotéis**, mais parques, mais telefones de missão (9 no total) e muitos lugares novos para explorar. O minimapa mostra suas casas em verde e as casas à venda em vermelho.

## Casas com famílias
**Todas as casas da cidade têm porta** (tecla **E** na calçada, em frente à porta).
- Cada casa tem uma **família** com nome e **rotina**: dormem à noite, tomam café de manhã, o pai e a mãe saem para trabalhar, as crianças vão à escola, o avô cochila diante da TV. A hora do jogo aparece no topo quando você está dentro de um lugar.
- Dá para **invadir**: mexer na geladeira (ganha comida), no aparador, na carteira, no guarda-roupa, **arrombar o cofre** (mini-jogo de timing) ou roubar a TV. Barulho acorda quem dorme, e moradores acordados **gritam por socorro**: a polícia é chamada.
- Com uma **arma na mão**, aperte **F** perto de um morador para **ameaçá-lo** e levar o dinheiro (crianças não são assaltadas!). Depois de assaltar, a polícia vem.
- Algumas casas estão **À VENDA** (placa vermelha na calçada, ponto vermelho no minimapa). Entre e compre na placa. Casa sua tem **cama que salva o jogo**, geladeira que enche todo dia e ninguém te incomoda — dá para se esconder da polícia lá dentro.

## Supermercados gigantes (Mercadão e Atacadão)
- Salas enormes que rolam com a câmera: padaria, açougue, hortifrúti, sorvetes, gôndolas de doces, bebidas, congelados...
- Pegue um **carrinho** na entrada (cabem 24 itens; sem carrinho só 4 nas mãos), escolha **frutas, doces, pão, bebidas, pizza, marmita...** nas gôndolas e **pague no caixa**. A comida vai para a **mochila** e você come com **X** (cura vida). O Atacadão é 20% mais barato.
- Sair sem pagar é **furto**: o segurança chama a polícia. Com arma, dá para **assaltar os caixas**.
- Horário de funcionamento: Mercadão 6h–22h, Atacadão 7h–21h.
- **Estacionamento com vida**: carros chegam, estacionam, os motoristas andam até a porta, e clientes saem do mercado, voltam ao carro e vão embora. Na hora do rush enche; fechado, esvazia.

## Hotéis
| Hotel | Estrelas | Quarto | Por dentro |
|---|---|---|---|
| **Grand Hotel Ribeirão** | 5 | Suíte $200 · Luxo $120 · Standard $80 | saguão de mármore, restaurante com garçons, piscina com bar, cozinha gigante |
| **Hotel Central** | 3 | Executivo $60 · Standard $40 | saguão, restaurante, piscina |
| **Hotel Estrela** | 2 | Casal $30 · Solteiro $20 | saguão e restaurante simples |
| **Pensão do Zé** | 1 | Quartinho $10 · Colchão $6 | feia, escura, manchada... |
- **Recepção**: alugue um quarto (vale até as 10h do dia seguinte). Pelo **elevador** você vai ao andar dos quartos e abre a porta verde do seu número. Cama = dormir até amanhecer e **salvar o jogo**. Suíte tem jacuzzi; os quartos de luxo têm minibar.
- **Restaurante**: sente numa cadeira (E), abra o **cardápio**, escolha o prato e o **garçom** anota, vai à cozinha e **traz o pedido até a mesa**. O preço depende do hotel.
- **Hóspedes de verdade** moram lá com rotina: café da manhã, piscina, jantar, dormir. Dá para conversar e, com arma, assaltar recepcionistas e barmen.
- A **cozinha gigante** é só para funcionários: se você entrar, o chef grita e pode chamar a polícia, mas dá para pegar comida lá.

## Academia que funciona
Compre o **passe do dia** ($15). **Esteiras** treinam o **fôlego** (você corre até 25% mais rápido) e **supino, halteres e saco de pancada** treinam a **força** (socos mais fortes), ambos até 5. Cada treino é um mini-jogo: aperte **E** quando o ponteiro passar pela faixa verde. Depois de 4 séries você fica **exausto**: beba água ou alongue. Tem lanchonete de suplementos (energético = corre mais por um tempo).

## Rotinas
Moradores, hóspedes, clientes e pedestres mudam de comportamento com a **hora do jogo** (um dia dura ~7 minutos): a rua enche na hora do rush e esvazia de madrugada, mercados fecham à noite, as pessoas conversam sobre o que estão fazendo (trabalho, almoço, escola, jantar).

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
| `lugares.js` | motor das salas (câmera, menus, assaltos, mochila), lugares de Ribeirão, objetos de rua, conversas, visual do personagem |
| `moveis.js` | móveis e objetos novos (fogão, gôndola, piscina, cama, caixa de supermercado...) |
| `vida.js` | famílias, nomes e rotinas por hora do dia |
| `casas.js` | todas as casas: famílias, invasão, cofre, casas à venda e compra |
| `mercados.js` | supermercados gigantes, carrinho, caixas e estacionamento com carros chegando e saindo |
| `hoteis.js` | quatro hotéis: recepção, quartos, restaurante com garçom, piscina, cozinha, hóspedes |
| `academia.js` | academia com passe, treino em mini-jogo e lanchonete |
| `hud.js` | dinheiro, vida, procurado, legenda amarela, minimapa |
| `audio.js` | motor, pneu, batida, sirene e rádios (WebAudio) |
| `game.js` | laço principal, jogador, câmera, dia/noite, telas |
