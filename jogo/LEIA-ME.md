# LIFE: CIDADE VIVA 🏙️

Protótipo jogável, em **3D no navegador**, de um simulador de vida em mundo aberto
**sistêmico e autônomo**: a cidade funciona sozinha — moradores têm rotina, empresas
lucram ou quebram, a economia reage, a polícia atende ocorrências, a justiça julga,
o clima muda e o trânsito congestiona — esteja você olhando ou não.

> Conteúdo 100% original e ficcional. Nenhuma marca, mapa, personagem, trilha ou
> asset de outras franquias é usado. Os sistemas de crime são **abstratos e
> orientados a gameplay**: não há descrição de técnicas reais.

---

## Como rodar

Não precisa instalar nada (o Three.js já está em `vendor/`). Só é preciso um servidor
HTTP local porque o jogo usa módulos ES:

```bash
cd GUILHERMEFMAGA-SITE
python3 -m http.server 8080
# abra http://localhost:8080/jogo/
```

Semente do mundo configurável pela URL: `?semente=12345` gera outra cidade inteira.

Requisitos: navegador com WebGL 2 (Chrome, Edge, Firefox ou Safari recentes).

---

## Controles

| Tecla | Ação |
|---|---|
| **W A S D** | Andar / dirigir |
| **Shift** | Correr / acelerar |
| **E** | Entrar no prédio mais próximo (interior interativo) |
| **F** | Entrar / sair do veículo |
| **Tab** | Abrir o smartphone (12 apps) |
| **M** | Abrir o mapa / GPS |
| **C** | Alternar 1ª / 3ª pessoa |
| **P** | Pausar a simulação |
| **+ / −** | Acelerar / desacelerar o tempo do mundo |
| Mouse (arrastar) | Girar a câmera · roda do mouse: zoom |

---

## O que já está simulado

| Sistema | O que acontece de fato |
|---|---|
| **Mundo** | ~3.300 lotes, 860 nós viários, 1.500 vias, 42 parques, rio, lagos, praia, florestas, montanhas, 4 cidades satélites, anel rodoviário e rodovias longas |
| **Agentes** | 5.200 NPCs com nome, idade, profissão, casa, trabalho, salário, conta bancária, 5 necessidades, personalidade (6 traços), memória, relacionamentos e objetivos de vida |
| **Rotinas** | Dormem, acordam, pegam o trânsito, trabalham no turno, almoçam, compram, visitam amigos, estudam, se abrigam da chuva, procuram emprego e voltam para casa |
| **LOD de simulação** | 3 níveis: completo (perto), simplificado (médio) e abstrato (longe). O mundo nunca para — apenas muda a resolução do cálculo |
| **Economia** | 10 setores com oferta/demanda, preços flutuantes, inflação, juros (regra de política monetária), desemprego, confiança e índice imobiliário |
| **Bancos** | Contas de NPCs, empresas e jogador; depósito, saque, transferência, cartão, extrato, empréstimo com parcelas, mora, tarifas, rendimento; agências e caixas eletrônicos no mapa |
| **Empresas** | ~1.800 empresas autônomas: folha de pagamento, reposição de estoque, impostos, preço reagindo a lucro e concorrência, contratação/demissão, expansão de filiais, **falência** e reabertura por novos empreendedores |
| **Trânsito** | Até ~520 veículos com semáforos, faixas, fila, ultrapassagem, densidade por horário/clima/dia da semana, congestionamento por aresta e **acidentes orgânicos** |
| **Crime** | 8 tipos ficcionais que surgem do contexto (desemprego, riqueza da região, horário, clima, presença policial). Fases: abordagem → controle → execução → fuga; detecção por câmeras/testemunhas/alarme; reféns e negociação abstratas |
| **Polícia** | 30+ viaturas com turnos, delegacias, patrulha, flagrante, despacho pela unidade mais próxima (ETA afetado por trânsito), isolamento de área, investigação com provas e **mandados** |
| **Justiça** | Pipeline completo: abordagem → detenção → transporte → registro → investigação → processo → audiência → julgamento → sentença (absolvição, multa, serviço comunitário ou prisão) |
| **Presídio** | Cumprimento de pena com rotina da unidade e passagem de tempo — a cidade continua rodando sem você |
| **Eventos** | 11 tipos dinâmicos (incêndio, obra, manifestação, apagão, animal na pista, feira, desaparecimento…) e **cadeias de consequência** (acidente → congestionamento → atraso → queda de produtividade → estoque → preços) |
| **Emergências** | Ambulância, bombeiro e guincho com despacho, deslocamento real pelo grafo e encerramento de ocorrência |
| **Natureza** | ~3.700 animais: cervos, lobos, javalis, raposas, aves, gado, cardumes + cães e gatos **com dono**, que seguem a rotina da família e reagem à chuva, à noite e ao jogador |
| **Clima** | 6 estados com transições, afetando trânsito, acidentes, pedestres, animais, comércio, visibilidade e reflexos do piso molhado |
| **Gráficos** | Ciclo de 24h com sol/lua, sombras dinâmicas, céu procedural com estrelas, janelas que acendem à noite, postes e faróis, neblina volumétrica por clima, chuva em partículas, piso molhado reflexivo, telões animados com publicidade e notícias |
| **Notícias e memória** | O mundo lembra: manchetes geradas a partir de fatos reais do jogo, comentários de bairro e reputação do jogador |
| **Jogador** | Emprego, carreira, cursos e habilidades, imóveis (comprar/vender/alugar), empresas (abrir/comprar/gerir/vender), veículos (comprar/abastecer/reparar), banco, telefone, GPS, táxi e viagens intermunicipais |

### O smartphone (Tab)
Início · Mapa/GPS · Banco · Empregos · Imóveis · Empresas · Notícias · Mercado ·
Contatos · Transporte · Operações (situação legal e planejamento abstrato) · Ajustes.

### Interiores (E)
Cada tipo de edificação tem ambientes próprios (ex.: supermercado com hortifrúti,
açougue, caixas, depósito, doca e sala de funcionários), as pessoas que estão lá
naquele momento, os funcionários em turno e ações específicas: comer, comprar,
abastecer, reparar, hospedar-se, estudar, bater ponto, pedir vaga, negociar a compra
do negócio, consultar ficha, visitar detentos.

---

## Arquitetura

```
jogo/
├── index.html · estilo.css
├── vendor/three.module.js         (Three.js r161, sem build/CDN)
└── src/
    ├── main.js                    laço principal, controles, ordem de atualização
    ├── jogador.js                 vida, carreira, finanças, bens
    ├── util/nucleo.js             RNG determinístico, barramento de eventos, fila de prioridade
    ├── mundo/gerador.js           geração procedural (grafo viário, quadras, lotes, água, A*)
    ├── mundo/render.js            Three.js: instancing, LOD, clima, iluminação, telões
    ├── sim/tempo.js               24h, calendário, clima com cadeia de Markov
    ├── sim/economia.js            setores, preços, inflação, juros, desemprego
    ├── sim/banco.js               contas, extrato, crédito
    ├── sim/empresas.js            operação autônoma e decisões empresariais
    ├── sim/agentes.js             NPCs, necessidades, rotina, memória, LOD
    ├── sim/transito.js            veículos, semáforos, congestionamento, acidentes
    ├── sim/crime.js               crimes emergentes, fases, reféns, planejamento
    ├── sim/policia.js             patrulha, despacho, investigação + emergências
    ├── sim/justica.js             processo em 9 etapas e sentença
    ├── sim/eventos.js             eventos dinâmicos e cadeias de consequência
    ├── sim/natureza.js            fauna, ecossistema e pets urbanos
    ├── sim/noticias.js            memória do mundo, jornal e publicidade
    └── ui/                        HUD, minimapa, smartphone, interiores, modais
```

**Desempenho medido** (headless, Node): mundo gerado em ~95 ms; simulação completa
(5.200 agentes + 520 veículos + 3.700 animais + crime/polícia/economia) em
**~0,7 ms por quadro** — sobra orçamento para a renderização.

Técnicas usadas: `InstancedMesh` para prédios/árvores/postes/veículos/pessoas,
atualização em **fatias** (cada agente é reavaliado a cada N quadros), simulação
abstrata para quem está longe, grade espacial para consultas O(1), A* com peso de
congestionamento, texturas geradas por canvas e sombra seguindo o jogador.

---

## Limitações honestas deste protótipo

- Interiores são **salas interativas em UI** (ambientes, pessoas, ações) e não ainda
  volumes 3D caminháveis.
- Pedestres e carros usam formas geométricas simples; não há animação esqueletal
  nem assets de alta resolução (seriam dezenas de GB em um projeto AAA real).
- Não há áudio: o navegador exigiria assets licenciados. Os pontos de ancoragem
  para áudio ambiental dinâmico estão mapeados no documento de design.
- Ray tracing, GI e streaming de mundo por disco são descritos no documento de
  design como caminho de evolução para engine nativa (Unreal/Unity).

O caminho completo entre este protótipo e a versão AAA descrita no briefing está em
[`DOCUMENTO-DE-DESIGN.md`](DOCUMENTO-DE-DESIGN.md).
