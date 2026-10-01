# LIFE: CIDADE VIVA — Documento de Design (GDD)

**Gênero:** simulador de vida em mundo aberto, sistêmico e persistente
**Pilar central:** *“este mundo continuaria existindo mesmo se o jogador não estivesse aqui”*
**Estado atual:** protótipo vertical jogável (WebGL / Three.js) com todos os sistemas
principais interligados — ver [`LEIA-ME.md`](LEIA-ME.md).

Todo o conteúdo é **original e ficcional**. Nenhuma marca, mapa, personagem, logo,
música ou asset de terceiros é reproduzido. Sistemas de criminalidade são abstratos
(variáveis de gameplay), **sem procedimentos reais** de invasão, burla de segurança
ou violência.

---

## 1. Direção de design

| Prioridade | Como o projeto entrega |
|---|---|
| Realismo | Economia com oferta/demanda e política monetária; empresas com folha, estoque e impostos; polícia com despacho por ETA real |
| Autonomia | Nenhum sistema espera o jogador: agentes, empresas, trânsito, crime, clima e justiça rodam continuamente |
| Liberdade | Sem missão obrigatória: emprego, estudo, empreendedorismo, investimento, imóveis, exploração ou o caminho do crime (com consequências) |
| Interação | Interiores acessíveis com ações contextuais; telefone com 12 apps; NPCs consultáveis |
| Escala | 4,2 km × 4,2 km, 3.300 lotes, 5.200 agentes, 4 cidades satélites, rodovias e anel viário |
| Profundidade | Cadeias de consequência: acidente → congestionamento → atraso → produtividade → estoque → preço |
| Rejogabilidade | Mundo inteiro procedural a partir de uma **semente** (`?semente=N`) |

Antipadrões evitados: mundo vazio, NPC parado, trânsito artificial, fachadas falsas,
eventos sempre no mesmo lugar, sistemas desconectados.

---

## 2. Mapa de cobertura do briefing

Legenda: ✅ implementado e rodando · 🟡 implementado de forma simplificada · 🔭 projetado (roadmap para engine nativa)

| # | Seção do briefing | Status | Como está no protótipo |
|---|---|---|---|
| 1 | Referência visual do mapa | ✅ | Lógica urbana (ruas, avenidas, cruzamentos, calçadas, parques, lagos, canais, pontes, estacionamentos) reinterpretada em 3D procedural — nada copiado |
| 2 | Mundo aberto | ✅ | Centro, financeiro, comercial, residencial, luxo, subúrbio, industrial, rural, orla, 4 cidades satélites, rodovias, pontes, anel |
| 3 | Escala e streaming | 🟡 | LOD de simulação em 3 níveis, atualização em fatias, instancing, grade espacial. Streaming de disco e occlusion culling por portal → 🔭 |
| 4 | Gráficos de última geração | 🟡 | PBR, sombras dinâmicas, céu procedural, neblina volumétrica, piso molhado, janelas acesas, telões. GI/ray tracing/vegetação densa → 🔭 |
| 5 | Ciclo dia/noite | ✅ | 24h contínuas, rotinas diferentes por período, comércio abrindo/fechando, turnos noturnos |
| 6 | NPCs autônomos | ✅ | 5.200 agentes com identidade, casa, trabalho, salário, necessidades, memória, relacionamentos, objetivos |
| 7 | IA de agentes | ✅ | Seleção de ação por utilidade + contexto (clima, horário, dinheiro, personalidade, acidentes) |
| 8 | Profissões | ✅ | ~70 cargos ligados a empresas + 80 profissões livres, com salário, turno, requisitos e progressão por habilidade |
| 9 | Carreira do jogador | ✅ | Candidatura, contratação, demissão, cursos, habilidades, múltiplas fontes de renda |
| 10 | Empresas | ✅ | 16 tipos; abrir, comprar, vender, precificar, contratar, estocar, anunciar, expandir, falir |
| 11 | Economia dinâmica | ✅ | 10 setores, inflação, juros, desemprego, confiança, índice imobiliário, choques setoriais |
| 12 | Sistema bancário | ✅ | Contas de NPCs/empresas/jogador, extrato, cartão, transferências, crédito, mora, tarifas, ATMs |
| 13 | Bancos físicos | 🟡 | Agências com ambientes (eclusa, caixas, gerência, cofre, CFTV), funcionários em turno e clientes — interior em UI, volume 3D → 🔭 |
| 14 | Sistema de crime | ✅ | 8 tipos emergentes do contexto, com testemunhas, câmeras, alarme, investigação e consequências |
| 15 | Assaltos (cinemático) | ✅ | Evento multifásico com variáveis (segurança, alarme, reação de NPCs, cerco policial, erros) — abstrato por design |
| 16 | Planejamento de crimes | ✅ | App “Operações”: alvo, equipe, veículos, horário, abordagem, rota e ponto de encontro → risco e chance calculados |
| 17 | Veículos | 🟡 | 11 classes no trânsito; jogador compra, abastece, repara, dirige. Customização visual e garagem → 🔭 |
| 18 | Sistema de segurança | ✅ | Câmeras, guardas, alarmes e nível de proteção por lote influenciam detecção e desfecho |
| 19 | Alarmes e resposta policial | ✅ | Detecção → alerta → despacho da unidade mais próxima → ETA afetado por trânsito → isolamento |
| 20 | Reféns e negociação | ✅ | Fase de controle com tensão, liberação gradual de civis e desfechos: rendição, prisão ou fuga |
| 21 | Sistema de polícia | ✅ | Turnos, delegacias, patrulha, flagrante, despacho contextual — **sem** barra de “procurado” |
| 22 | Investigação | ✅ | Força probatória de câmeras/testemunhas, progresso diário, identificação e mandado |
| 23 | Sistema judicial | ✅ | 9 etapas até a sentença: liberação, multa, serviço comunitário ou reclusão |
| 24 | Presídios | 🟡 | Rotina da unidade, cumprimento de pena e visitas; interiores caminháveis → 🔭 |
| 25 | Casas e mansões | 🟡 | Ambientes proporcionais ao porte (casa 6 cômodos, mansão 14) e ações domésticas |
| 26 | Sistema de imóveis | ✅ | Comprar, vender, alugar, receber aluguel, IPTU; valores indexados ao mercado |
| 27 | Restaurantes | 🟡 | Categorias, cardápio, mesa, pedido, pagamento, cozinha e estoque simulados |
| 28 | Hotéis | 🟡 | Recepção, diária, pernoite com avanço de tempo, andares e áreas listadas |
| 29 | Supermercados | ✅ | Setores internos, estoque por unidade, reposição por fornecedor, caixas, funcionários e preços |
| 30 | Postos de gasolina | ✅ | Abastecimento por litro ao preço do mercado, conveniência, serviço e caminhões de entrega |
| 31 | Trânsito | ✅ | Semáforos, faixas, fila, densidade por horário/clima/dia, congestionamento emergente |
| 32 | Acidentes | ✅ | Colisões orgânicas (clima/velocidade), bloqueio de via, guincho, ambulância e polícia |
| 33 | Natureza | ✅ | Florestas, rios, lagos, praia, montanhas, parques e ecossistema com predação |
| 34 | Animais selvagens | ✅ | 10 espécies com fome, descanso, fuga, caça e territórios |
| 35 | Animais domésticos | ✅ | Cães e gatos com dono, acompanham a rotina da família e se abrigam da chuva |
| 36 | Eventos dinâmicos | ✅ | 11 tipos, posicionamento procedural, nunca sempre no mesmo lugar |
| 37 | Telões e publicidade | ✅ | 26 telões animados com anúncios comprados por empresas e manchetes ao vivo |
| 38 | Clima | ✅ | 6 estados, transições markovianas, efeitos em tráfego, pedestres, animais, comércio e visibilidade |
| 39 | Áudio | 🔭 | Pontos de ancoragem definidos (motores, sirenes, chuva, multidão, estabelecimentos); requer assets licenciados |
| 40 | Player | ✅ | Andar, correr, dirigir, entrar, conversar, trabalhar, estudar, comprar, investir, administrar, viajar |
| 41 | Liberdade de jogabilidade | ✅ | Sem missões lineares; trajetória construída pelo jogador |
| 42 | Memória do mundo | ✅ | Registro ponderado com esquecimento, comentários de bairro, fama do jogador, troca de donos |
| 43 | Notícias | ✅ | Jornal interno gerado a partir de fatos: polícia, economia, cidade, clima, negócios |
| 44 | Telefone | ✅ | 12 apps funcionais |
| 45 | Mapa e navegação | ✅ | Mapa interativo, GPS por clique, minimapa com ocorrências, viaturas e eventos |
| 46 | Viagens longas | ✅ | Rodovias com postos, restaurantes, hotéis, oficinas, fazendas e eventos de estrada |
| 47 | Sistema de emergência | ✅ | Registro → seleção de unidade → deslocamento → atuação → encerramento |
| 48 | Cidade autônoma | ✅ | Tudo continua enquanto você dorme, trabalha, viaja ou está preso |
| 49 | Eventos em cadeia | ✅ | Cadeia de acidente implementada ponta a ponta e exibida no feed |
| 50 | Objetivo final | ✅ | Parado numa esquina você vê gente indo trabalhar, ônibus, entregas, lojas abrindo, viaturas e preços mudando |
| 51 | Direção de design | ✅ | Ver tabela de pilares na seção 1 |
| 52 | Tecnologia e otimização | ✅/🔭 | Instancing, LOD, fatias, A* ponderado, grade espacial (✅); streaming de disco, jobs multithread, animação procedural (🔭) |
| 53 | Experiência final | ✅ | Ciclo completo: acordar, trabalhar, receber, depositar, almoçar, abastecer, viajar, investir, comprar casa, contratar, hospedar-se, explorar, presenciar eventos, ver as notícias |

---

## 3. Arquitetura de simulação

### 3.1 Níveis de detalhe (LOD)
| Nível | Distância | O que roda |
|---|---|---|
| 0 — completo | < 180 m | Movimento quadro a quadro pelo grafo viário, renderização, animação |
| 1 — simplificado | < 700 m | Interpolação de trajeto, necessidades, decisões |
| 2 — abstrato | > 700 m | Máquina de estados por tempo, transações econômicas, consumo e trabalho |

Todos os agentes são reavaliados em **fatias** (1/8 por quadro): 5.200 NPCs custam
menos de 1 ms por quadro mantendo coerência de rotina.

### 3.2 Fluxo de um dia
```
tempo.avancar → clima → trânsito → agentes (fatia) → natureza → crime → polícia
→ emergências → justiça → eventos/cadeias → render → UI
   e, à meia-noite: economia → banco → empresas → agentes(diário) → investigações
                    → memória do mundo → jogador → jornal
```

### 3.3 Grafo de influência entre sistemas
```
clima ─┬─> trânsito ─> acidentes ─> emergências ─> congestionamento
       ├─> pedestres/animais                 └─> empresas (atraso) ─> estoque ─> preços
       └─> comércio
desemprego ─> criminalidade ─> ocorrências ─> investigação ─> justiça ─> presídio
empresas ─> salários ─> consumo ─> receita ─> contratação/demissão ─> desemprego
preços ─> inflação ─> juros ─> crédito ─> investimento ─> imóveis
notoriedade do jogador ─> notícias ─> memória do mundo ─> reação dos NPCs
```

---

## 4. Roadmap para a versão AAA nativa

**Fase 1 — fundação (concluída aqui):** regras, economia, agentes, crime/justiça,
mundo procedural, loop jogável e provas de desempenho.

**Fase 2 — fidelidade visual:** porte do simulador para engine nativa (Unreal 5 /
Unity HDRP) mantendo a camada de regras em módulo próprio; Nanite/virtual geometry,
Lumen/GI, materiais PBR autorais, vegetação com Houdini, animação esqueletal com
motion matching, veículos com física de suspensão.

**Fase 3 — interiores e streaming:** interiores volumétricos por kit modular com
streaming por portal; occlusion culling; persistência em banco local; carregamento
assíncrono por célula do mundo.

**Fase 4 — áudio e vida sensorial:** mixagem dinâmica por zona (motores, sirenes,
chuva, multidão, música diegética autoral), oclusão acústica e rádio interna.

**Fase 5 — profundidade social:** diálogos gerados por contexto, famílias,
gerações, política municipal, sindicatos, bolsa de valores e mercado de trabalho
qualificado.

**Fase 6 — multiplayer opcional:** mundo autoritativo no servidor com os mesmos
sistemas rodando em tick fixo e replicação por interesse espacial.

---

## 5. Diretrizes de conteúdo e segurança

- Nenhuma reprodução de marcas, mapas, personagens, logos, trilhas ou assets reais.
- Crimes são **eventos abstratos de gameplay**: o jogo manipula variáveis
  (equipe, veículos, horário, abordagem, segurança, cerco, tensão), nunca
  instruções operacionais reais.
- Reféns e negociação são tratados de forma **cinematográfica e estratégica**,
  com desfechos pacíficos possíveis e incentivados (rendição e liberação de civis
  reduzem a pena no sistema judicial).
- O sistema judicial existe para dar **consequência**: crime é um caminho caro,
  arriscado e punido, não um atalho.
