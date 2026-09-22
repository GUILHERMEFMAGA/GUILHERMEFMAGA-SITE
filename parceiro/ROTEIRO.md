# ROTEIRO DE ENGENHARIA — Operação Motor Real

Missão: agente de IA **real** (aprende, decide, age) que roda no PC, **sem API, sem
nuvem, sem custo**, escrito em Python puro da biblioteca padrão — e publicável na
internet como projeto open-source de referência.

Correção de rota honesta: não vencemos o Claude na arena dele (raciocínio geral
exige bilhões de parâmetros pagos). Vencemos na arena onde ele não entra:
autonomia em tempo real na máquina, zero custo, zero dado que sai, 100% auditável,
roda em qualquer Windows. "IA sem API" = estatística clássica bem feita. Ponto.

## Leis de ferro (congeladas para sempre — nada aqui as altera)

1. O agente propõe. O teste decide. O humano aprova.
2. Lá fora é vidro: lermos, nunca tocamos sem coleira + três cadeados + testemunha.
3. Madrugada abre/executar = fila. Git é sagrado e humano.
4. Entrega = ponte: verde no portão+raio do parceiro ANTES do push; dupla
   testemunha (clone do parceiro + máquina do dono).
5. Duplo clique do dono é o único "sim" que muda código na máquina.
6. Cada fase adiciona; nada remove. Retrocompatibilidade é lei de convivência.

## Fase F — Fundação

| # | Entregável | Estado |
|---|---|---|
| F1 | B13 olhos de saúde: pulso RAM/disco a cada tick + resumo da madrugada | ✅ |
| F2 | B14 lei da não-redundância: raio-x detecta função de corpo idêntico (AST normalizada) | ✅ |
| F3 | B15 diário de evolução: `memoria/diario-evolucao.txt` (1 linha por versão + negativos aprendidos); raio-x cobra atualização | 🔜 |

## Fase C — Cognição (a "IA" de verdade, sem rede neural paga)

| # | Entregável | Técnica (stdlib only) |
|---|---|---|
| C1 | Matcher semântico: pedidos da fila e gatilhos deixam de bater por igualdade exata e passam por similaridade — `difflib` para erro de digitação + TF-IDF/cosseno para sinônimos. `organiza meus pdfs` acorda a corrente `pdf-no-downloads` | collections, math, unicodedata |
| C2 | Pesos de regra (contextual bandit ε-greedy): regra que funciona é proposta mais; regra rejeitada decai sozinha (o "DESISTE" vira matemática, não print) | random + contadores em memoria/pesos.json |
| C3 | Planejador: meta → sequência de passos com pré/pós-condições e rollbacks (A* num grafo pequeno, heapq) — correntes ganham um autor só | heapq, ast dos gatilhos |

Aceite: cena nova no portão para C1/C2/C3 + ensaio no mundo falso + raio-x sabendo checar.

## Fase V — Vitals (tempo real profissional)

| # | Entregável | Técnica |
|---|---|---|
| V1 | Porteiro por EVENTO, não por 15-min: ReadDirectoryChangesW via ctypes (overlapped), polling vira fallback se a API falhar | ctypes, threading |
| V2 | Cérebro em SQLite: diário/vigilia/pesos migram de JSON para `memoria/cerebro.db` (sqlite3 stdlib) com importador de uma tacada; consultas tipo "quantas noites com fome" | sqlite3 |
| V3 | Relatório matutino do agente para o humano: gerado por template + estatística do SQLite (sem LLM, sem alucinação) | string.Template |

## Fase P — Publicação (a internet)

| # | Entregável |
|---|---|
| P1 | Licença MIT, `pyproject.toml`, CLI `super-agente` (argparse: tick/olhar/fila/relatorio), docstring em tudo |
| P2 | Repo PÚBLICO demo `super-agente-open` com fixtures limpos (memória real NUNCA vai); o repo do dono segue privado |
| P3 | Docs no site do GUILHERMEFMAGA: série "Construa um agente sem pagar API", um capítulo por fase — código do blog = o próprio ROTEIRO expandido |

## Regras de entrega (inalteráveis)

Um tijolo por vez → portão+raio verdes no clone do parceiro → push na ponte →
aviso → duplo clique do dono → verificar-tudo → verde na máquina real.
Qualquer teste vermelho: o tijolo não sai da bancada, e a falha vira teste novo.

---

## Triagem das 60 ideias do Guilherme (22/09 — "coloque todas pra evoluir")

Legenda: ✅ já existe no produto (com prova) · 🔧 feito agora (B15) · 🔜 já tinha lugar na fila · 🆕 entra na fila hoje · 🚫 quebra uma lei da casa — não entra (decisão honesta, não preguiça).

### Autoevolução e aprendizagem contínua
| # | Ideia | Veredito | Onde/porquê |
|---|---|---|---|
| 1 | Loop de autocrítica (gera→critica→regenera) | ✅+🔧 | Aqui a crítica é COM ATO: ensaio no palco + portão barram antes de valer. Versão LLM exige API 🚫 |
| 2 | Self-refine multi-passagem | ✅ | propor→ensaiar→(falhou? grava motivo e não repete) é o refine determinístico |
| 3 | Memória vetorial (Chroma/Qdrant) | 🔜 V2 | dependência externa = trai o local-first; SQLite stdlib + cosseno faz o mesmo |
| 4 | Reflexão pós-erro (erro vira lição) | ✅ | `motivo_da_recusa` no rascunho + enterro após 2 recusas |
| 5 | Curadoria automática da base | 🔜 F3 | diário de evolução |
| 6 | Data flywheel | 🔧 | B15: cada tick gera dados de julgamento do próprio agente — o flywheel nasce ligando |
| 7 | Destilar respostas ruins em regras | ✅ | recusa→enterro permanente (contadores/recusas) |
| 8 | Módulo "sonho" noturno | ✅ | vigia agendado + resumo_da_madrugada consolidam à noite |
| 9 | Teste A/B do próprio julgamento | 🆕 C4 | duas políticas de peso (meia-vida 14d vs 30d) pontuando em paralelo |
| 10 | Score de confiança / recusar quando incerto | 🔧 | B15: conselho só sai com evidência (qtd≥2/3); silêncio = "não sei" |

### Raciocínio profundo
| 11–18 | CoT, ToT, decomposição, verificação separada, 2ª passagem, debate, ReAct, scratchpad | misto | ✅ ReAct é o loop do agente (ver→pensar→agir→lembrar); ✅ verificação separada = raio/portão são OUTRO programa; 🔜 ToT/decomposição = C3 (A* explora caminhos); 🚫 CoT/2ª-passagem/debate via LLM = API |

### Dados
| 19 | Dados sintéticos | ✅ | mundo_falso do portão é 100% sintético e determinístico |
| 20 | Supervisão fraca (heurísticas rotulam) | ✅ | `chave_fato`/contadores rotulam crônico/recusa sem anotação humana |
| 21 | Active learning (pergunta quando o ganho é alto) | 🆕 C2 | ε-greedy só pergunta quando |score| ≈ 0; regra certa não vira enquete |
| 22 | Aumento de dados | 🆕 P2 | fixtures do repo demo ganham variações (acentos/caixa/tamanhos) |
| 23 | Deduplicação | ✅ | `chave_fato` + B14 `checar_duplicacao` (AST dump) |
| 24 | Filtro de qualidade antes de agir | ✅ | ensaio: regra que não dispara na cena própria é barrada e registrada |

### Arquitetura
| 25 | Mixture of Experts | 🆕 distante | roteamento por gatilho com `se` JÁ é um roteador pobre — evolui com C2 (peso decide qual fluxo concorrente acorda) |
| 26 | Tool use | ✅✅ | os 4 verbos do vocabulário BLINDADO são a definição de tool use sem alucinação |
| 27 | Multi-agente orquestrado | 🚫 produto | auditor e auditado já são separados (loop vs raio vs portão); teatro de "vários agentes" não vende para indústria |
| 28 | Cache semântico | 🔜 C1 | difflib similarity cache: pedido ≈ resposta já dada |
| 29 | Grounding (afirmação precisa de fonte) | 🆕 C1 | todo conselho do B15 já cita eventos; relatório C1 citado = caminho relativo do arquivo |
| 30 | RAG híbrido (denso + BM25) | 🔜 V2 | BM25 é pura matemática, implementável em stdlib |
| 31 | Rerank | 🆕 V2 | fusão cosseno+BM25 com pesos do B15 |
| 32 | GraphRAG | 🔜 V2 | tabela de arestas em SQLite; grafo de "arquivo toca arquivo" |

### Avaliação
| 33 | Benchmark diário com suíte própria | ✅✅ | portão (16 cenas) + raio (25 checagens) rodam no tick agendado |
| 34 | LLM-as-judge com rubrica | ✅ local | juiz = assertões determinísticas; 🚫 juiz-LLM = API |
| 35 | Teste de regressão | ✅ | cena antiga quebra = portão fecha = nada é publicado |
| 36 | Shadow deploy | ✅✅ | a PONTE é o shadow: publica na ponte, só o duplo-clique dele promove |
| 37 | Rastrear taxa de alucinação | 🆕 F3 | métrica = propostas ÷ aprovadas (o agente inventa muito?) |

### Prompts (adaptação honesta: aqui não há prompt — há JSON)
| 38–41 | Evolução genética, OPA/DSPy, prompts versionados, few-shot dinâmico | 🆕 C4/🚫 | "prompt" do produto = bloco do cérebro; git já versiona (✅ prompts-as-code de graça); mutação genética de gatilhos = C4; few-shot dinâmico = API |

### Custo
| 42 | Modelos locais GGUF (llama.cpp, CPU) | 🆕 P5 OPCIONAL | plugável, DESLIGADO por padrão; o agente inteiro tem que continuar valendo sem ele |
| 43–44 | Colab/Kaggle/HF Spaces | 🚫 | dados de cliente na nuvem de terceiros = trai a tese de venda (nada sai da máquina) |
| 45 | Inferência em CPU | idem P5 | se um dia, é CPU local quantizado, nunca serviço |

### Segurança
| 46 | Guardrails entrada/saída | ✅✅ | allowlist de comando, vocabulário de verbos, `dentro_do_projeto`, teto de saída, timeout |
| 47 | Sanitização contra prompt-injection | ✅ aqui não existe a superfície | não há prompt; o "prompt" do agente é regras.json, e o raio valida o vocabulário antes de tudo |
| 48 | Rate limit + sandbox | ✅✅ | limites por arquivo/dia + PALCO de ensaio + corte por tempo |

### Produto
| 49 | Onboarding que personaliza | 🆕 P7 | primeira execução cria cérebro-perguntas (instalação assistida do repo demo) |
| 50 | Feedback implícito | 🆕 V6 | proxy local honesto: arquivo copiado foi aberto? (mtime) — sem telemetria |
| 51 | Modo transparente (mostra por quê) | ✅✅ | `o agente viu/decidiu/fez/aprendeu/sugere` em cada linha do log |
| 52 | Multi-idioma | 🆕 P6 | catálogo de mensagens (pt/en); B15 já é à prova de acento (`_txt_normal`) |

### Diferenciais
| 53 | Personalidade + memória afetiva | 🚫 | inexistente sem LLM; e não é o que a indústria compra |
| 54 | Explicabilidade sempre | ✅✅ | toda ação imprime a regra-mãe; conselho B15 cita eventos e placar |
| 55 | Autodiagnóstico | ✅ | raio-x = o corpo lendo o próprio corpo, com CONERTO por problema |
| 56 | Raciocínio temporal | 🔧 | meia-vida 14d: lembrança velha vale menos — implementado HOJE |
| 57 | Execução segura com autocorreção | ✅ | coleira + ensaio; "autocorreção" aqui = falha vira aprendizado negativo, não mágica |
| 58 | Meta-learning | 🚫 | exige treino de modelo = API/GPU, fora do contrato |
| 59 | Comunidade gerando dados com consentimento | 🆕 P8 | só no repo demo público: opt-in explícito, NUNCA liga sozinho |
| 60 | Documentação viva | ✅+🆕 | README cresce a cada tijolo; F3 gera o narrative-log do agente sozinho |

### Os 10 pedidos grandões (mensagem de abertura) — vereditos diretos
1. **Reforço p/ aprender com experiência** → 🔧 **ENTREGUE AGORA (B15)**: caderno + decaimento + conselho. (É o "RL honesto" stdlib; "deep RL" = 🚫 API/GPU.)
2. **Múltiplos modelos de IA** → 🚫 hoje (não há modelo local instalado; a porta de plug-in é P5 opcional). A força do produto é ser completo SEM modelo.
3. **Multi-idioma** → 🆕 P6.
4. **Transformers/atenção** → 🚫 como produto de marketing; o primo honesto e suficiente aqui = TF-IDF + cosseno (C1), que É um mecanismo de atenção estatística sobre tokens.
5. **Recomendação personalizada** → 🔧 B15 já recomenda (conselhos do placar); ranking refinado = C2.
6. **Feedback do usuário** → ✅ existed (aprovar rascunho/recusa/enterro); 🔧 B15 transforma em sinal quantitativo (+2 humano).
7. **Conexão c/ redes sociais/mensageria** → 🚫 contrato (nuvem). Arquitetura prevê: V5 = contrato de conector local (outbox `fila/` já é um), zero conector ativo. Se ele quiser revisar o contrato, é decisão dele, não minha.
8. **Comando de voz** → 🆕 V4: ditado offline do próprio Windows (SAPI via ctypes) — viável SEM nuvem; depois do V1.
9. **Monitoramento em tempo real de ameaças** → ✅ parcial (saúde+tarefa agendada+fiscal); tempo real de verdade = V1 (ReadDirectoryChangesW); FIM (checksum de arquivos-chave) = 🆕 F4, vende como "auditoria anticorrupção".
10. **Auto-atualização** → 🚫 PERIGOSO: viola a lei-mãe "só o duplo-clique dele muda o PC dele". Versão honesta já vigente: `puxar` = checar + aplicar COM ele presente. Proposta nova 🆕 P4: "alarme de novidade" (o tick avisa que a ponte tem commit novo; instalar continua sendo ato humano).
