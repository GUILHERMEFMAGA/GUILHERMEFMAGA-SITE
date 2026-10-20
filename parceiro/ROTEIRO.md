# Roteiro complementar — 75 ideias, analisadas antes de adicionar

**Status: planejamento, nao implementacao.** Registro desta conversa em 22/09/2026.
Fonte canonica auditada: `SITE@super-agente`, tip `3be2e9cc26b2a19a8b341ec01e6dba5d35c7d2eb`.
Site auditado: fontes do branch desta sessao, base da entrega `07d70e0`.

Este documento COMPLEMENTA o [roteiro da ponte](../.arena-delivery/parceiro/ROTEIRO.md).
Nao copia as 60 ideias anteriores nem cria outro ticket para algo ja previsto.
Os identificadores F3/F4, C1–C4, V1–V6 e P1–P8 continuam com seus donos originais.
Os numeros 1–75 abaixo identificam a lista NOVA do dono, nao a lista antiga.

**PR #7 = vitrine (janela). A PONTE alimenta o PC; puxar-atualizacao.bat nunca le PR.**
Esta sessao so publica no proprio branch: este complemento ainda NAO foi publicado
em `super-agente`. O archive em `.arena-delivery/` continua integral e inalterado.
Nenhum PR antigo foi fechado, apagado ou fundido.

## 1. Escopo e criterio de nao repeticao

Leitura dos 19 arquivos Python (motor, bibliotecas, CLI, servidor e testes), dos
cinco BATs, configuracoes/fluxos, JavaScript do painel e pagina estatica; cruzamento
com capsula, ESTADO e roteiro. Inventario de 55 arquivos rastreados, com SHA256 e
localizacao das 205 funcoes: [inventario.json](analise/inventario.json).

Varredura AST dos corpos de funcoes, ignorando docstrings: **zero grupos identicos**.
Isso NAO prova ausencia de duplicacao semantica. A deduplicacao das ideias foi
manual, por objetivo + componente responsavel + criterio de aceite, nao por nome.
Nao foi realizada prova formal nem auditoria exaustiva de vulnerabilidades.
Nao tivemos acesso ao PC do dono; nao executamos os BATs no Windows.

### Duas implementacoes distintas: nao confundir capacidade existente com instalada

| Evidencia | O que existe | O que NAO prova |
|---|---|---|
| Ponte: `agente/loop.py`, `propor`, `ensaiar`, `promover` | Rascunhos JSON de regras de criacao e ensaio limitado | Sintese arbitraria de ferramentas, biblioteca Voyager ou promocao segura de qualquer codigo |
| Ponte: `corrente_etapa`, `correntes_para`, `fluxos_para` | Quatro verbos, condicoes, limites e reutilizacao do executor | Planejador C3, solver, world model ou raciocinio de LLM |
| Ponte: `registrar_experiencia`, `pesos_aprendido`, `conselhos_aprendido` | Eventos ponderados, meia-vida, limiares de conselho | RLHF/RLAIF, treino neural, probabilidade calibrada ou consolidacao durante o sono |
| Ponte: `lembrar`, `contar_fatos`, rascunhos recusados | Historico limitado a 500 registros, contadores, motivos de recusa | Ledger permanente append-only, tombstones completos ou prova causal |
| Ponte: `testes/testar_regras.py`, `testes/raio_x.py` | 17 cenas; validacoes estaticas e de estado | Cobertura completa, isolamento de seguranca, benchmark diario automatico ou verificacao formal |
| Ponte: `tick.bat`, `rodar_de_madrugada.bat` | Agendamento externo de observacao/vigilia | Treino noturno ou execucao automatica do portao e raio |
| Site: `agente-ia/agente/rede_neural.py`, `texto.py` | MLP de intencoes treinavel em stdlib e bag-of-words | Transformer, KV-cache, modelo gerativo grande ou integracao com a ponte |
| Site: `conhecimento.py`, `nucleo.py` | Busca lexical IDF, fonte do topico, cascata regras/base/MLP e abstencao | Similaridade semantica geral, Bayes calibrado ou triangulacao independente |
| Site: `memoria.py` | SQLite de fatos e historico; fatos sobrescritos por chave | V2 instalado no pos-B16, claim ledger imutavel ou contradiction mining |
| Site: `orquestrador.py`, `ferramentas.py` | Fluxos horario/intervalo, catalogo, registros de passos, calculadora AST, resumo extrativo | Autoescrita de ferramentas, solver SMT/CP, restricoes da ponte aplicadas ao site |
| Site: `gerador.py`, `nucleo.py`, `web.py`, `web/painel.html` | Markov com tentativas, decisao explicada e tempo em ms exibido | Best-of-N por qualidade, detector de mentira ou telemetria de tokens |
| Site: `main.py`, `dados/treino.jsonl` | Treino e diagnostico sobre os exemplos de treino | Avaliacao em conjunto independente, generalizacao medida ou replay entre versoes |

Os caminhos sem prefixo na coluna Ponte sao relativos a `.arena-delivery/`.
Ha componentes candidatos a reaproveitamento no site, mas nao devem ser copiados
para a ponte sem adaptacao de contratos e testes. Os dois motores de fluxo nao
possuem a mesma API nem as mesmas permissoes.

## 2. Achados que precedem a expansao

Sondas reproduziveis: `python3 parceiro/analise/auditar_ideias.py`.
Todas as escritas das sondas ocorrem em `TemporaryDirectory`, sem rede e sem
executar ferramentas externas. Resultados guardados no inventario.

| Achado | Evidencia | Consequencia para as ideias |
|---|---|---|
| `--so-olhar` cria arquivo | Sonda: `executar()` com SO_OLHAR=True cria fixture; teste atual cobre apenas `propor()` | B17 continua primeiro; nao ampliar autonomia noturna |
| `--ensaiar` escreve inventario | Sonda: calibra, adiciona evento, ENSAIAR=True; `vigiar()` chama `aplicar_reacoes()` antes de retornar | Dry-run nao e zero escrita de ponta a ponta. Teste atual verifica ausencia da copia, nao todo o disco |
| `aprendizado.ligado=false` nao impede gravacao | Sonda: `registrar_experiencia()` grava mesmo com config desligada | Corrigir antes de experimentar C2/C4 ou chamar isso de controle efetivo |
| Promocao aceita proposta sem campos obrigatorios | Sonda: rascunho `ativa=true`, apenas id, e aceito por `promover()` | A funcao nao revalida nem reensaia a proposta atual; booleano nao e prova vinculada ao conteudo aprovado |
| Trava nao demonstra exclusao concorrente | Leitura: ler PID e depois substituir JSON nao e aquisicao exclusiva; main pula trava com SO_OLHAR | B16 nao comprova mutex entre processos; falta teste simultaneo. `TRAVA_VELHA` e armazenada, mas nao governa essa aquisicao |
| Veredito do BAT nao agrega os dois exames | Leitura de `verificar-tudo.bat`: mensagem final depende do portao, sem guardar falha anterior do raio | Testar combinacoes de exits no Windows antes de confiar no resumo final |
| Isolamento do ensaio e incompleto | Leitura: `ensaiar()` troca RAIZ, mas nao todos os caminhos globais; `executar()` nao valida confinamento do destino | Mundo falso nao e sandbox de seguranca; geracao de Python executavel fica bloqueada |

Esses achados sao registro de analise, NAO correcoes entregues. Os quatro primeiros
foram reproduzidos; os demais sao constatacoes de leitura que precisam de testes
especificos. O portao atual continuar verde nao os invalida: sao lacunas de cobertura.

**Site separado — cuidados antes de reutilizar:** `ler_pagina` faz HTTP de verdade,
sem chave de desligamento, apesar do comentario; `apagar_arquivo` integra o catalogo.
O servidor possui rotas de treino/execucao sem autenticacao e bind em 0.0.0.0;
nao foi iniciado nesta analise. O painel monta `onclick` com nome do fluxo sem
escape de aspas. `_caminho_seguro` reduz ao basename, mas nao resolve symlinks.
A calculadora limita vocabulario AST, nao custo de exponenciacao. Sao itens de
seguranca para S1/F7, nao funcionalidades a importar automaticamente.

### Correcoes de interpretacao do roteiro anterior

- Tick nao roda portao/raio; agendamento de benchmarks ainda e backlog.
- Ponte e canal de entrega, nao shadow deployment comparando trafego real.
- `propostas/aprovadas` nao e taxa de alucinacao. F3 deve medir aprovadas/propostas
  avaliadas, recusas e falhas com denominadores e janela; falsidade factual precisa
  de ground truth especifico e avaliacao independente.
- TF-IDF/IDF mede correspondencia lexical; nao e atencao neural nem resolve
  sinonimos sem recursos adicionais. C1 precisa demonstrar seus limites.
- SQLite nao equivale, por si, a uma base vetorial. Dependencia externa nao implica
  nuvem: conflita com **stdlib-only**, nao necessariamente com local-first.
- LLM local nao exige API paga. P5 continua opcional e depende de decisao sobre
  runtime, dependencias, licenca, hardware e memoria; nada instalado nesta rodada.
- `--ensaiar` e avaliacao AST nao equivalem a prova formal nem a isolamento de SO.
- A fonte de um topico e proveniencia basica, nao influencia causal dos pesos.
- Acuracia no treino e softmax elevado nao demonstram generalizacao ou confianca
  calibrada. A comparacao fixa de parametros com “ChatGPT” no site nao e base valida
  para promessas comerciais.

## 3. Matriz de destino — todas as 75 ideias

**Legenda:** PARCIAL = base existente, lacuna real; AMPLIAR = usar ticket existente;
NOVO = nova capacidade agrupada; CONDICIONAL = pesquisa/dependencia/contrato;
PRINCIPIO = orientacao de engenharia, nao feature nem alegacao confirmada.
Cada linha tem **um unico destino primario**. Dependencias nao criam copias do ticket.

### Autoevolucao (1–9)

| # | Ideia | Veredito e destino | Diferenca util / limite |
|---|---|---|---|
| 1 | Skill library estilo Voyager | PARCIAL → C5 | Reusar fluxos/rascunhos, adicionar catalogo versionado de habilidades declarativas aprovadas; descoberta aberta e codigo Python novo nao existem |
| 2 | Escrever ferramentas em runtime | CONDICIONAL → C5 | Mesmo ciclo de #1; apenas proposta inerte, jamais execucao/import automatico. Python arbitrario exige isolamento e autorizacao separados |
| 3 | Self-generated curriculum | NOVO → F5 | Falhas viram exercicios deterministas com oracle e holdout; diagnostico de treino do site nao e curriculo automatico |
| 4 | Adversarial self-play | NOVO → F7 | Gerador de entradas adversas + verificador independente no mundo falso, teto de rodadas; nao “ate ninguem derrubar” |
| 5 | Constitutional self-amendment | CONDICIONAL → F6 | Registrar proposta de mudanca e justificativa; comite simulado nao altera leis nem substitui aprovacao humana |
| 6 | Cron de auto-melhoria | AMPLIAR → C4 | Agendamento ja existe; adicionar apenas ensaios offline isolados e relatorio, depois de B17/F7. Nunca autoaplicar nem promover dormindo |
| 7 | Tombstones de decisoes | PARCIAL → F6 | Recusas ja existem; adicionar decisao, motivo, hash/versao e consulta obrigatoria antes de sugerir reversao |
| 8 | Counterfactual self-test | NOVO → F5 | Replay da mesma fixture nas versoes de comportamento com tempo/seed congelados; nao reconstruir resposta historica por imaginacao |
| 9 | Behavior versioning | AMPLIAR → C4 | Git ja versiona arquivos; falta manifesto comportamento+dado+config e comparacao. Rollback proposto, aplicado pelo humano |

### Busca e verificacao (10–18)

| # | Ideia | Veredito e destino | Diferenca util / limite |
|---|---|---|---|
| 10 | Inference-time compute | AMPLIAR → C3 | Orcamento de busca por dificuldade; mais tempo nao garante acerto, medir custo/ganho |
| 11 | Best-of-N e majority voting | AMPLIAR → C3 | Candidatos de planos verificados. Voto e ranking sao diferentes; maioria correlacionada pode errar. Markov escolhe comprimento, nao qualidade |
| 12 | Beam search de raciocinio | AMPLIAR → C3 | Alternativa a A* para estados/planos explicitos, benchmark antes de manter dois motores |
| 13 | Process reward | PARCIAL → C3 | B15 pontua etapas por texto; evoluir para resultados tipados/pre-pos-condicoes, nao afirmar PRM neural |
| 14 | Speculative reasoning | AMPLIAR → C3 | Plano rapido seguido de validacao independente; nao confundir com speculative decoding |
| 15 | Canary probes | NOVO → F7 | Pequenos testes de pre-condicoes antes de planos custosos, reaproveitando validadores; nada de probe com efeito real |
| 16 | World model interno | PARCIAL → C3 | Mundo falso e ensaio sao base; adicionar transicoes declarativas e limites da simulacao, nao afirmar modelo aprendido do mundo |
| 17 | Criador/destruidor/juiz | AMPLIAR → F7 | Papeis tecnicos gerador/mutador/oracle no mesmo harness de #4; personas nao garantem independencia |
| 18 | Ensemble disagreement | NOVO → C6 | Discordancia entre politicas gera abstencao/escalada humana; consenso nao prova verdade |

### Memoria e evidencias (19–25)

| # | Ideia | Veredito e destino | Diferenca util / limite |
|---|---|---|---|
| 19 | Esquecimento e consolidacao | PARCIAL → C7 | B15 ja tem meia-vida: nao criar outro decaimento. Falta consolidar eventos; evitar equivalencia biologica com sono/Ebbinghaus |
| 20 | Compressao por relevancia | NOVO → C7 | Resumo extrativo do site e reaproveitavel, mas nao gerencia memoria. Preservar fontes, recusas e fatos criticos |
| 21 | Traces de raciocinio | AMPLIAR → F3 | Guardar resumo de decisao observavel, evidencias, alternativas e resultado; nao pensamentos internos privados nem transcript especulativo |
| 22 | Claim ledger | NOVO → F6 | Eventos append-only com fonte, timestamp, status e supersessao; SQLite atual sobrescreve fatos e historico B15 tem teto |
| 23 | Contradiction mining | NOVO → C6 | Detectar conflitos de mesma entidade/atributo/tempo usando F6; pendencia humana, nunca apagar divergencia para parecer coerente |
| 24 | Kalman/Bayes beliefs | NOVO → C6 | Bayes para hipoteses discretas com modelo declarado; Kalman apenas para grandezas dinamicas com hipoteses adequadas. Placar B15 nao e posterior |
| 25 | Triangulacao 2–3 fontes | NOVO → C6 | Fontes locais independentes e linhagem; copias contam como uma. Evidencia insuficiente = pendente, sem buscar na internet automaticamente |

### Verificacao e causalidade (26–31)

| # | Ideia | Veredito e destino | Diferenca util / limite |
|---|---|---|---|
| 26 | Solver exato SMT/CP | CONDICIONAL → C3 | Calculadora AST do site nao e solver. Subconjunto finito pode usar stdlib; SMT/CP externo precisa de excecao aprovada. Correcao depende da modelagem |
| 27 | Verificacao formal | CONDICIONAL → F7 | Invariantes de subconjuntos especificados; ast.parse, compile e testes NAO provam codigo arbitrario seguro |
| 28 | Property-based testing | NOVO → F7 | Geradores stdlib com seed, invariantes e contraexemplo persistivel; framework externo requer autorizacao |
| 29 | Fuzzing de interfaces | NOVO → F7 | Mesmo harness, entradas JSON/fila/caminhos/limites; timeout e tamanho maximo, sem tocar arquivos reais |
| 30 | Chaos engineering | NOVO → F7 | Falhas de I/O e concorrencia injetadas em fixtures; B16 cobre corrupcao simples, nao caos sistematico |
| 31 | Grafo causal | CONDICIONAL → C8 | Distinguir proveniencia/dependencia de causalidade; so alegar causa com intervencao controlada e hipoteses identificaveis |

### Seguranca (32–35)

| # | Ideia | Veredito e destino | Diferenca util / limite |
|---|---|---|---|
| 32 | Auto red-team de prompt | AMPLIAR → F7 | Hoje testar regras, fila, arquivos e fronteiras; ponte nao possui system prompt de LLM. Bateria de prompt so se P5 for aprovado |
| 33 | Honeytokens | NOVO → S1 | Marcadores sinteticos em fixtures, nunca credenciais reais; detectar passagem indevida, nao garantir ausencia de injecao |
| 34 | Zero-trust em ferramentas | PARCIAL → S1 | Allowlist valida comando, nao semantica da saida. Adicionar schema/tipo/tamanho/origem; dados nunca viram autoridade ou comando |
| 35 | Capability passports | PARCIAL → S1 | Catalogo do site e allowlists da ponte nao sao passaportes. Declarar leitura/escrita/raizes/rede/limites e cobrar no executor |

### Observabilidade (36–40)

| # | Ideia | Veredito e destino | Diferenca util / limite |
|---|---|---|---|
| 36 | Ativacoes em incerteza/recusa | CONDICIONAL → O1 | MLP do site retorna camada oculta, mas nao registra probes. Ponte nao tem ativacoes neurais. Telemetria local opt-in e redigida |
| 37 | Detector de mentira/confianca | NOVO → C6 | Calibracao/abstencao em dados rotulados, nunca vender “detector de mentira”. Confianca softmax nao mede veracidade |
| 38 | Influence tracing | PARCIAL → F6 | Fonte de topico e regra-mae ja existem; expandir proveniencia de decisao. Influencia causal de exemplo nos pesos fica pesquisa |
| 39 | Semantic diff de comportamento | AMPLIAR → C4 | Diferenca por fixtures e resultados observaveis, nao apenas diff textual; usa replay F5 |
| 40 | Tokens por qualidade | PARCIAL → O1 | Site mede tempo, ponte mede saude. Hoje medir ms/CPU/memoria e sucesso por tarefa; tokens apenas com backend que realmente os contabilize |

### Performance dependente de arquitetura (41–45)

| # | Ideia | Veredito e destino | Diferenca util / limite |
|---|---|---|---|
| 41 | KV-cache entre sessoes | CONDICIONAL → P5 | Nao se aplica ao loop, MLP ou Markov atuais. Backend futuro, invalidacao por modelo/config/contexto e isolamento por usuario |
| 42 | Speculative decoding local | CONDICIONAL → P5 | Precisa gerador autoregressivo e verificador compativeis; depende de hardware e ganho medido, nao e gratis |
| 43 | Cache semantico hierarquico | AMPLIAR → C1 | Cache ja previsto: acrescentar niveis, chave de versao/escopo, TTL e teste de falsos hits; nunca reutilizar autorizacao nem executar por similaridade |
| 44 | Self-distillation | CONDICIONAL → P5 | Sem teacher/student gerativos atuais; custo, licenca e risco de amplificar erro. Nao duplicar com #69 |
| 45 | Quantizacao por tarefa | CONDICIONAL → P5 | Nao ha runtime quantizado. Perfis previamente avaliados e escolhidos com aprovacao; nao requantizar/prometer ganho automaticamente |

### Alegacoes e praticas industriais (46–75)

Estas frases foram recebidas como ideias, nao como evidencia. Nao houve pesquisa
bibliografica nesta rodada: nao certificamos prevalencia atual, numeros comerciais,
“segredos”, vazamentos ou praticas de empresas. Extraimos apenas criterios testaveis.

| # | Ideia/alegacao recebida | Veredito e destino | Tratamento sem exagero |
|---|---|---|---|
| 46 | O diferencial e o eval | PRINCIPIO → F5 | Suíte independente, versionada, com regressao por categoria; nao mais um avaliador paralelo |
| 47 | RLHF hoje quase todo RLAIF | CONDICIONAL → P5 | Generalizacao nao comprovada aqui; feedback sintetico e humano devem ter origem identificada e auditoria |
| 48 | LIMA: mil excelentes vencem milhoes | PRINCIPIO → F5 | Resultado experimental nao e lei universal. Priorizar curadoria com baseline e holdout, sem prometer essa proporcao |
| 49 | Maioria do pos-treino e sintetica | PRINCIPIO → F5 | Prevalencia nao verificada; fixtures sinteticas ja existem. Registrar gerador/seed, diversidade e separacao de avaliacao |
| 50 | Rejection sampling fine-tuning | CONDICIONAL → P5 | Selecao de candidatos fica em C3; treino de modelo selecionando respostas e outra etapa, com holdout e permissao |
| 51 | Constitutional AI substitui rotulagem | AMPLIAR → F7 | Critica/revisao por regras e oracle, sem dispensar humano; equivalente LLM nao instalado |
| 52 | Qualidade vem do pos-treino, nao arquitetura | PRINCIPIO → F5 | Falsa dicotomia como regra geral; medir contribuicoes por ablacao, sem vender arquitetura irrelevante |
| 53 | Prompts secretos enormes | PRINCIPIO → S1 | Nao importar vazamentos nem depender de segredo de prompt; seguranca em fronteiras e permissoes |
| 54 | Context engineering | AMPLIAR → C1 | Recuperar contexto relevante com fonte, limite e separacao dado/instrucao; nao duplicar RAG/grounding ja previstos |
| 55 | DSPy/prompts compilados | AMPLIAR → C4 | Otimizar configuracoes declarativas dentro de espaco limitado; DSPy nao instalado, prompt manual nao e “amador” por definicao |
| 56 | Sycophancy | NOVO → F5 | Casos em que usuario contradiz fonte: avaliar consistencia factual, nao concordancia; sem afirmar causa unica de treino |
| 57 | Confianca e calibracao | AMPLIAR → C6 | Medir Brier/ECE e cobertura-risco quando houver labels/probabilidades; nao transformar score heuristico em probabilidade |
| 58 | Roteamento barato→caro | PARCIAL → C3 | Site ja tem cascata regras/base/MLP; roteamento futuro por custo/risco, sem modelos pagos nem promessa de 10x |
| 59 | 80% triviais em cascatas | AMPLIAR → C3 | Mesmo ticket de #58. Percentual precisa ser medido no workload local, nao adotado como fato |
| 60 | Dados negativos | PARCIAL → F5 | Recusas e fixtures negativas ja existem; curar causas e rotulos, sem confundir falha tecnica com preferencia humana |
| 61 | Pares de preferencia adversariais | AMPLIAR → F5 | Pares com origem e motivo, usando geradores F7; aprovacao e separacao do conjunto de teste |
| 62 | Personas sinteticas para feedback | AMPLIAR → F5 | Perfis de fixture diversificados, sem alegar representatividade humana ou custo “por centavo” |
| 63 | A/B silencioso de personalidade | CONDICIONAL → C4 | Rejeitar experimento oculto em clientes; somente offline ou opt-in explicito, sem promocao automatica |
| 64 | Test-time search | AMPLIAR → C3 | Alias de #10–12: um so mecanismo de busca com teto, nao novo modulo |
| 65 | Modelos conversando geram melhores dados | CONDICIONAL → P5 | “Melhores” exige comparacao independente; dialogo sintetico nao gera verdade por consenso |
| 66 | Traces de ferramentas para treino | PARCIAL → F3 | Logs de fila e passos ja existem; padronizar resultado/status/fonte/custo e remover dados pessoais. Nao treinar automaticamente |
| 67 | Analise de falha por resposta | AMPLIAR → F5 | Toda falha reproduzivel vira candidato a fixture; curadoria humana evita ruido e vazamento de dado real |
| 68 | Ordem do curriculo | AMPLIAR → F5 | Mesmo curriculo de #3; comparar ordenacoes com seeds e holdout, sem supor importancia igual em todo modelo |
| 69 | Distillation gratis/90% | CONDICIONAL → P5 | Alias de #44, nao segundo ticket. Sem garantia de 90% e sem “almoco gratis” |
| 70 | Monitorar comportamento emergente | AMPLIAR → O1 | Alertas de desvio em saidas e efeitos mensuraveis; nao afirmar emergencia neural no motor declarativo |
| 71 | Safety com ataques automatizados | AMPLIAR → F7 | Alias de #4/#32: corpus adversarial local autorizado, sem atacar terceiros |
| 72 | Traces+erros sao melhor dataset gratis | AMPLIAR → F3 | Alias de #66. Utilidade depende de curadoria, licenca, privacidade e oracle; nao e automaticamente o melhor nem sem custo |
| 73 | Usuario→dado→melhoria | AMPLIAR → P8 | Opt-in ja previsto. Dados locais nao saem da maquina; exportacao futura revisada e anonimizada, nunca implicita |
| 74 | Eval suite privado | AMPLIAR → F5 | Holdout protegido contra contaminacao, separado do treino; fixtures publicas podem coexistir. Sigilo sozinho nao mede qualidade |
| 75 | Curadoria contra escala | PRINCIPIO → F5 | Curadoria e escala interagem. Comparar qualidade/diversidade/volume mantendo custo mensurado, sem slogan universal |

## 4. Backlog unico: apenas dez grupos novos

Todos **propostos, nao implementados**. Ampliacoes de C1/C3/C4/F3/P5/P8 ficam nos
tickets existentes. As 75 entradas sao rastreabilidade, NAO 75 modulos a construir.

| Ticket novo | Responsabilidade unica | Reuso e dependencia | Aceite minimo antes de publicar |
|---|---|---|---|
| F5 — avaliacao e curriculo | Corpus curado, holdout, replay e analise de falhas | Portao atual + diagnostico do site como referencia; C4 consome os resultados | Seeds/tempo/config fixos, train/test sem sobreposicao, negativos, relatorio por categoria, fixtures com oracle independente; mesma entrada repetida gera mesmo placar |
| F6 — ledger de decisoes e fatos | Tombstones, claims, fonte e historico de supersessao | F3 narra, F6 armazena; V2 e candidato a persistencia, nao outro banco por feature | Eventos nao sobrescritos, id/versao/fonte/motivo, consulta antes de reversao, conflito preservado, corrupcao detectada. Append-only logico nao e inviolabilidade contra dono do disco; definir retencao e privacidade |
| F7 — testes adversariais e de propriedades | Um harness de mutacao, invariantes, canarios e falhas de I/O | Reutilizar portao/validadores; B17 primeiro | Seed reproduzivel, limites de tempo/memoria/entradas, zero efeito fora do diretorio temporario, casos de fuga/symlink/corrupcao/concorrencia. Nunca executar codigo arbitrario como “sandbox” |
| C5 — habilidades governadas | Catalogar/reusar/propor habilidades declarativas | Fluxos e rascunhos existentes, S1+F7+F6 | Id e versao unicos, dependencias declaradas, ensaio por hash do conteudo, aprovacao humana invalidada se mudar, nenhum import/exec/eval automatico |
| C6 — evidencias e incerteza | Conflitos, triangulacao, calibracao e abstencao | F6 fornece eventos; B15 segue placar, nao posterior; F5 avalia | Copias de fonte nao contam como independentes, insuficiencia abstém, labels separados do treino, metricas de calibracao/cobertura e falsos positivos; sem “detector de mentira” |
| C7 — consolidacao de memoria | Relevancia, resumo e politica de retencao | Reusar meia-vida B15; V2/F6 e resumidor do site como referencias | Nao apagar provas/tombstones, manter apontadores de origem, testes de contradicao e idempotencia, limites de disco, nenhuma consolidacao escrevendo em modo prometido como leitura |
| C8 — causalidade experimental | Pesquisa de intervencoes controladas no mundo falso | C3 modela transicoes, F5 compara | Hipoteses/variaveis/confundidores explicitos, intervencao reproduzivel; dependencias de arquivos nunca rotuladas automaticamente como causas |
| S1 — fronteira de capacidades | Passaportes e validacao de input/output | Catalogo/allowlist atuais, sem criar executor concorrente | Permissao ausente nega, rede desabilitada por contrato, caminhos resolvidos/confinados, schema e teto de saida, output tratado como dado, marcador falso detectado, frontend/API tambem testados se reutilizados |
| O1 — observabilidade de custo e desvio | Medir custo real e comportamento | Reusar saude B13 e tempo_ms do site; relatorio V3/F3 | Opt-in local, dados redigidos, limite de retencao, ms/CPU/memoria com tarefa/versao; tokens e ativacoes marcados nao aplicaveis sem backend, overhead medido |
| F8 — coerencia do contrato de execucao | Reunir achados de flags, promocao, trava e veredito dos BATs | Ampliacao de blindagens, sem duplicar B17 | Testes dos quatro resultados raio/portao no Windows; aprendizado desligado nao grava; ensaio zero efeitos; promocao vinculada a teste+aprovacao do conteudo; concorrencia real. Dividir em entregas pequenas |

F8 surge da auditoria do codigo, nao de uma 76a ideia. B17 fica responsavel pelo
modo observacao; F8 cobre os outros achados e depende do contrato esclarecido em B17.
Nao confundir F8 com implementacao simultanea de todas as correcoes.

### Contratos das ampliacoes (sem novos tickets)

- **F3:** diario de evolucao a partir de fatos, resumos de decisao e traces tipados;
  versao + resultado + motivo + fonte; nao renomear isso para CoT privado. Sem copia
  de dados pessoais no Git. Erro de ferramenta deve ser status, nao texto “concluido”.
- **C1:** contexto e cache por versao/escopo, TTL, teste de invalidação e falsos hits;
  nunca reaproveitar uma aprovacao humana por semelhanca textual.
- **C3:** planos declarativos com pre/pos-condicoes, busca limitada, verificacao
  independente, abstencao, custo medido. Escolher A*/beam por benchmark, nao por moda.
- **C4:** experimentos offline versionados, manifesto dado+config+codigo, replay F5,
  semantic diff e proposta de rollback. Nenhum A/B escondido nem Git executado pelo agente.
- **P5:** pesquisa opcional desligada; comparar necessidade real antes de instalar
  modelo. Dependencias/licencas/hardware aprovados pelo dono; suite F5/F7/S1 obrigatoria.
  KV-cache, decoding, distillation e quantizacao ficam aqui, nao em quatro motores vazios.
- **P8:** aproveitamento de dados somente com opt-in especifico, revogavel e revisao
  da exportacao. Nunca publicar memoria real automaticamente.

## 5. Ordem recomendada de entrega

1. **B17 primeiro:** esclarecer observacao pura versus tick que registra/enfileira,
   fechar criacao indevida e testar efeitos de ponta a ponta. Nao basta guarda de
   uma funcao para prometer que todo caminho deixa de escrever.
2. **F8 em pequenos tijolos + base F7:** corrigir dry-run, desligamento de aprendizado,
   promocao e concorrencia; testar Windows/BATs. Nenhuma autonomia ampliada antes.
3. **F3 + F6 minimo:** fatos, decisoes e motivos auditaveis sem narrativas inventadas.
4. **F5:** baseline independente/replay; expandir F7 e S1 a partir das falhas.
5. **C1/C3/C4/C5/C6/C7** conforme ganho medido; C8 e P5 permanecem pesquisa opcional.

A lista nao altera as leis: stdlib/local-first, sem API paga, humano aprova,
nenhuma escrita no PC pelo parceiro e nenhuma autopromocao por voto interno.
Adicionar ao roteiro nao autoriza implementar, instalar dependencias ou executar
experimentos no PC. Entrega futura: teste → aprovacao → ponte → re-espelho da vitrine;
no PC, duplo clique **puxar-atualizacao → verificar-tudo → salvar-tudo**.
