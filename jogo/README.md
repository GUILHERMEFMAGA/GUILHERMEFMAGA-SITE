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
| C | **Central de Câmeras**: setas escolhem, Enter tela cheia, TAB filtro (prédios/ruas/obras), T mostra o timelapse das obras, Esc sai |
| F9 | **Olho de Deus**: relatórios, saúde do jogo, obras e gravações (TAB abas, Enter detalhes, F filtro, **D baixa o JSON** com tudo, X limpa) |
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
| **Banco Ribeirão** | guichês para **depositar e sacar** (dinheiro no banco não se perde se você morrer ou for preso), fila de clientes e **cofre-forte** (só abre com arma, e chama a polícia). Abre das 10h às 16h |
| **Padaria Pão Quente** | pão, pão de queijo, coxinha, bolo e café, com forno e mesinhas |
| **Pizzaria Dona Maria** | fatia, pizza grande, bebidas, forno a lenha e jukebox |
| **Hotéis** | quatro hotéis, do luxo ao mais feio — veja a seção própria abaixo |
| **Farmácia** | kit médico ($60), vitaminas ($25), balança |
| **Barbearia** | muda o corte e a cor do cabelo (mostra o seu visual no cartão) |
| **Shopping** | camisa, calça, tênis e acessórios — o visual do personagem muda de verdade |
| **Theatro Pedro II** | compre ingresso na bilheteria e assista ao espetáculo (passa o tempo e cura) |
| **Minha casa** | cama (dorme até amanhecer, **salva o jogo**), geladeira, TV com notícias, computador com seu progresso |
| **Academia** | academia grande e funcionando: passe do dia ($15), esteira dá fôlego, peso e saco de pancada dão força (mini-jogo de timing) — veja abaixo |
| **Catedral** | velas, bancos para rezar e confissão ($100 limpa a ficha na polícia) |

Na rua: **hidrantes** (jorram água), **lixeiras** (às vezes tem dinheiro), **bancos** (sente e recupere vida), **caixas de correio**, **bancas de jornal**, **máquinas de refrigerante** e **pontos de ônibus** (viagem rápida, $5). Os pedestres agora respondem: aperte **E** perto de um deles para conversar — eles dão dicas, falam da cidade e às vezes mostram o caminho até um lugar (seta no jogo e no minimapa). Também cumprimentam e reagem a armas.

## Comércios do bairro
**Toda porta que você vê na cidade abre**, e o nome do letreiro é o mesmo que aparece lá dentro. Prédios sem porta são só prédios. Os comércios comuns (cada um com atendente, cardápio e algo único) são: **lanchonete, sorveteria, açougue, floricultura, pet shop, livraria, eletrônicos, ótica, ferragem, lotérica, mercadinho, loja de roupas, bar e café**. Ficam espalhados pelos bairros, cada um com seu nome e horário. Alguns exemplos: a **ferragem** vende taco de beisebol, a **ótica** e a **loja de roupas** mudam o seu visual, a **lotérica** tem raspadinha e aposta, a **livraria** vende mapa que marca um lugar para você ir, o **bar** tem sinuca e a **floricultura** tem buquê que cura. Dá para **assaltar** os atendentes com uma arma na mão (**F**), só que isso chama a polícia. O prompt **F: AMEAÇAR** mostra o nome de quem está na sua frente.

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
| `comercios.js` | banco, padaria, pizzaria e os 14 tipos de comércio comum (cardápios, atendentes, extras) |
| `interiores.js` | a "casca" das salas: pisos, paredes, rodapé, janelas com vista, claridade; guarda o kit de desenho `G.deco` |
| `mobilia.js` | ~45 móveis de casa pintados com volume e sombra (sofá, cama, fogão, geladeira, TV, banheira...) |
| `mobilia2.js` | prateleiras temáticas, vitrines, araras, manequins, quadro-negro de cardápio, filas |
| `mobilia3.js` | recepção, computador, balcão de padaria, panelões, supino e outros objetos de comércio |
| `mobilia4.js` | hospital (maca, soro, raio-X, biombo...), estádio (campo de futebol, traves, placar, arquibancada, holofote), barbearia, shopping e `banco_aco` |
| `casas_salas.js` | sala com cozinha, quartos e banheiro de cada casa |
| `lojas_novas.js` | os 14 tipos de comércio comum, cada um com interior próprio |
| `publicos.js` | **hospital** (recepção, enfermaria, consultório) e **estádio** (saguão e campo com partida de verdade) |
| `enriquece.js` | acrescenta detalhes às salas antigas (farmácia, barbearia, shopping, banco, padaria, pizzaria, delegacia, prefeitura, saguão dos hotéis) |
| `hud.js` | dinheiro, vida, procurado, legenda amarela, minimapa |
| `audio.js` | motor, pneu, batida, sirene e rádios (WebAudio) |
| `game.js` | laço principal, jogador, câmera, dia/noite, telas |


## Mapa gigante, pedágio e cidade em obras
- O mapa tem 17×6 quadras (10368 × 4032 px). **Ribeirão** fica a oeste; atravessando a **ponte com pedágio** você chega a **Novo Horizonte** e, mais adiante, a **Vale Verde**. Pedágio: $15 / $25. Sem pagar, a cancela fecha; forçar passagem rende procurado.
- Essas cidades estão **em construção de verdade** (`cidade.js`): terrenos viram canteiros (tapume, grua, andaimes, operários), depois prédios prontos com interior, funcionando: comércios, hotéis, hospital, escola, shopping, fábrica, empresas, escritórios e casas. O **aeroporto** (pista, terminal e avião) cresce na última quadra. NPCs constroem **novas pontes** para outras margens, e tudo continua evoluindo com o tempo (a Central de Câmeras mostra o timelapse).
- Ruas com árvores enfileiradas nas quadras novas.

## Câmeras (`cameras.js`)
73 câmeras: corredores e salas dos mercados, hotéis, banco, loja e demais lugares (exceto casas), mais câmeras de rua, pedágios e obras. Dentro das lojas a câmera mostra a cena de verdade, com os atendentes e clientes.

## Olho de Deus e agentes do FBI (`olho.js`, `fbi.js`)
- O **Olho de Deus** é invisível no jogo (só um "F9" pequeno no canto). A cada segundo observa carros, pedestres, jogador, salas, dinheiro, obras e erros de JavaScript. **Conserta sozinho** o que dá (carro NaN, carro na parede, carro travado, pedestre preso...) e guarda um **super cache** com hora, local, entidade e snapshot de cada caso (salvo em `localStorage`).
- Quatro **agentes do FBI** (Cruz, Lima, Rocha e Duarte), de terno e óculos, andam pelas calçadas do mapa inteiro, **entram em cada estabelecimento** (hotéis, mercados, bancos...), conferem nomes, tamanho, objetos inalcançáveis, NPCs e câmeras, inspecionam as obras e **reportam os erros** ao Olho. Se você passar armado perto de um agente, ele grita e você ganha procurado.

## Prisão de verdade (`justica.js`)
Ao ser preso você é algemado, levado à viatura e fica no banco de trás até a **delegacia geral**. O **maior nível de procurado** que você atingiu decide o destino: níveis 1–3 ficam na delegacia (fiança ou pena em dias), nível 4 vai para a penitenciária distante e nível 5 para a **ILHA DO SILÊNCIO** (segurança máxima, de barco).

## Prefeito e obras (`governo.js`)
Na Prefeitura, a **mesa do prefeito** deixa você decidir: obras (escola, hospital, praças...), impostos, segurança, saúde, educação e pauta do dia. Construtoras planejam em fases e podem **interditar ruas** (cones e barreiras) até terminar. Há eleição a cada 10 dias.

## Crimes, FBI e acidentes (`crimes.js`)
- Crimes de NPC raros e probabilísticos: assalto a lojas e bancos (com **planejamento** de 1–2 dias; podem dar certo ou errado), sequestros, golpes, roubo de carros e incêndios.
- Se a polícia não resolve, os casos graves passam para o **FBI**. Notícias no jornal da banca e no "PLANTÃO".
- Perto de um assalto você vê os bandidos fugirem e a polícia chegar; derrubar um bandido rende recompensa. Sequestros têm cativeiro com refém (E: libertar).
- **Assassino da Mata Escura**: corpos com fita da polícia na floresta e uma cabana escondida. Acabe com ele por $3000.
- **Acidentes** chamam a **ambulância**, que leva a vítima ao hospital mais perto, ou ao seguinte se estiver lotado. Quando você morre vale a mesma regra.

## Visual mais bonito (pontes, rio, telhados, pixel art)
- **Pontes largas**: pista + calçadão de pedra portuguesa de 4 tiles de cada lado, parapeitos de pedra com balaústres, pilares com luminárias, arcos de pedra sob a ponte e **mirantes** com medalhão e bancos nas pontes principais (que ainda têm pórticos de aço por cima). Pontes novas, quando inauguradas, ganham o mesmo visual.
- **Rio vivo**: águas rasas e fundas, correnteza, vitórias-régias com flores, juncos, pedras e muro de contenção de pedra.
- **Telhados variados**: quatro águas, duas águas com lado de sol e de sombra, coberturas, jardins na laje e piscinas. As vilas ganharam uma pracinha redonda com medalhão e canteiros.
- **Pixel art de verdade**: o nível de gráficos padrão agora reduz as cores com tramado (dither) e pixels grandes. A tecla **V** troca entre pixel art, cinema nítido e clássico.

## Mapa GIGANTE, casas de verdade e floresta enorme (versão nova)
- **Tudo maior**: as quadras passaram de 12 para 20 tiles. O mapa tem **58.880 × 9.600 px** (65 colunas × 10 fileiras de quadras): dá para dirigir minutos seguidos. Casas, prédios, hotéis, supermercados, estádio e hospital ficaram bem maiores.
- **Regiões, de oeste para leste**: Ribeirão Preto (a cidade grande) → rio e pedágio → **Fazendas Santa Rita** (plantações, pastos e fazendas de bilionários com mansão, chafariz, heliponto e estábulo) → **MATA ESCURA** (floresta gigante) → Novo Horizonte → **Mata do Gavião** (outra floresta fechada) → Vale Verde (aeroporto) → Fazendas do Litoral → Porto do Sol. A rodovia (linha de rua 5) liga tudo, com pedágio em cada ponte.
- **Florestas só fora das cidades**: dentro delas as ruas de dentro não existem (só a rodovia e as ruas das bordas). Têm dezenas de milhares de árvores (folhosas, pinheiros e árvores secas), estradas de terra, clareiras com cabanas, lagos, acampamentos, torres de guarda e troncos caídos. É onde o assassino em série se esconde.
- **Casas com formatos de verdade** (nada de caixinha quadrada): térreas, sobrados, em L, em U, com garagem, com varanda, mansões. Cada uma tem telhado de quatro ou duas águas (ou laje), chaminé, água-furtada, painéis solares, quintal com gramado, caminho de lajotas, cerca ou sebe, canteiros de flores, árvores, piscina e carro na garagem. Cada cidade tem o seu estilo (clássica, moderna, ecológica, litorânea e rústica), e o bairro define se as casas são simples, médias ou ricas.
- **Janelas realistas**: moldura, vidro com reflexo do céu, travessas, peitoril, verga, cortinas, persianas, venezianas, jardineiras, grades, ar-condicionado, sacadas, janelas em arco e redondas. À noite, só as janelas acesas brilham. Os prédios têm vários andares, as lojas têm vitrine, toldo e letreiro.
- **Interiores realistas**: `interiores.js` (a "casca" da sala: pisos de madeira/taco/porcelanato/cimento, paredes com lambri e sanca, janelas com vista, cortinas e raios de sol, quadros), `mobilia.js` (móveis pintados com volume e sombra: sofá, cama com travesseiro, fogão, geladeira, TV, planta, lareira, banheira...) e `casas_salas.js` (cada casa tem **sala com cozinha, quartos e banheiro**; o tamanho e o luxo mudam entre casa simples, média e rica, e cada casa tem cores próprias). A família senta no sofá à noite e dorme na cama.
- **Ferramentas de teste** em `jogo/dev/` (precisam de `npm install @napi-rs/canvas`): `tp2.js` (fotos), `reach.js` (confere se toda porta é alcançável a pé), `stab.js` (roda o jogo e procura erros), `interior.js` (entra num lugar e tira foto), `galeria.js` (foto de cada móvel), `casa_teste.js` e `casa_acoes.js` (testam a vida e os botões dentro das casas), `splice.py` (monta o `world.js` a partir das peças em `dev/pieces/`) e `build.py` (gera o `rua-vermelha.html`).

## Interiores de todos os lugares (hospital, estádio, prisão...)
Nenhum lugar é mais um "quadrado vazio": cada sala tem piso, parede, móveis, gente e botões que funcionam.
- **Hospital** (`publicos.js`): *recepção* (balcão com triagem: **tratamento grátis do SUS** cura tudo, check-up por $120, sala de espera, máquina de lanches, bebedouro), *enfermaria* (leitos com pacientes, soro, monitor, enfermeira; descansar no leito recupera vida e passa o tempo) e *consultório* (Dra. Helena: consulta por $120, maca, raio-X, balança, tabela de Snellen).
- **Estádio Municipal** (`publicos.js`): no *saguão* ficam a bilheteria (arquibancada $30 ou camarote $100), as catracas, a lanchonete, a loja oficial do time e o telão. No *campo* há gramado com linhas de verdade, traves, arquibancadas com torcida (muda com a hora), bancos de reservas e placar. **De 13h às 19h rola uma partida** com 22 jogadores e árbitro, gols, intervalo e placar ao vivo; de manhã é treino aberto. Invadir o gramado por mais de 2 segundos faz os seguranças te levarem até o portão e cobrarem **$50**.
- **Prisão** (`justica.js`): celas com vaso sanitário e pia atrás das grades, banco de concreto no corredor, pátio com meia quadra de basquete pintada no chão, supino, saco de pancada e mesa de baralho, refeitório com mesas de aço, panelões e cardápio, e oficina de costura com estantes, araras e caixas.
- **Quartos de hotel**: cama de casal, criado-mudo, TV na cômoda, guarda-roupa, tapete, planta e janela com vista.
- **Como acrescentar uma sala nova**: crie o interior com `L.novaSala(...)` e registre `L.construtores['tipo:meu_lugar'] = { criar(idSala, lg) { ... return R; } }`. Para só **acrescentar detalhes** a uma sala que já existe, use `L.enriquecer['<idDoLugar>:<sala>'] = (R, pl) => { R.objs.push(...) }` (roda uma vez, logo depois da sala ser criada; veja `enriquece.js`).
- **Ferramentas**: `dev/sala.js` (foto da sala inteira: `OUTDIR=$PWD/out/ node sala.js hosp tipo:hospital entrada enfermaria consultorio`), `dev/sala_prisao.js` (o mesmo para as salas da penitenciária e da ilha), `dev/publicos_teste.js` (entra no hospital e no estádio, aperta todos os botões e itens de menu, compra o ingresso, assiste à partida e invade o campo para conferir a multa de $50).
