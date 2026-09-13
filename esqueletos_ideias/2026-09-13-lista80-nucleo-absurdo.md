# LISTA DAS 80 — funções/ferramentas de nível ABSURDO para o cérebro da IA LOCAL (2026-09-13)
PROPOSTAS — nenhuma implementada. Referências de padrão: llama.cpp, LangChain, LlamaIndex, LiteLLM, Open WebUI, GraphRAG/LightRAG, whisper.cpp, AutoGPT. 100% local/offline-first, zero memória LP oculta, tudo com kill-switch.

## A0 — MOTOR E INFERÊNCIA (13)
1 Roteador por complexidade (regra → modelo rápido → modelo grande) com histerese
2 Auto-tuning de temperatura/max_tokens por tipo de tarefa (aprende o seu 👍)
3 Speculative decoding barato: rascunho por regra, modelo só polishes o fim
4 Cache semântico (pergunta ~igual → resposta instantânea, limiar ajustável)
5 Quantização dinâmica de contexto (resumo comprimido a cada N turnos)
6 Multi-modelo quente: 2 GGUFs na RAM, troca em segundos (o 11 da lista-40 aprofundado)
7 Budget de tokens POR resposta com meta adaptativa ao seu feedback
8 Batch de prompts: fila local processada em lote com barra de progresso
9 Checkpoint de geração: retome do meio se algo interromper (estilo resume do llama.cpp)
10 Modo torneira: SSE local pro painel HTML acompanhar a resposta ao vivo
11 Testes A/B automáticos de prompt (2 variantes, você escolhe, fica gravado)
12 Nibble-cache de KV: reuso de contexto comum entre perguntas da mesma sessão
13 Relatório de "custo-zero": tokens gerados na sessão × preço de nuvem equivalente

## A1 — MEMÓRIA E APRENDIZADO (13)
14 Grafo de coocorrência persistente (o erosão da r69 virando grafo em JSON)
15 Consolidador noturno: pesos raros decaem, fortes sobem (sono artificial)
16 Episódios nomeados: "lembra quando configuramos o atalho?" via LOG (não LP de conversa)
17 Importar conhecimento: cole um texto → vira pack A2 em tópicos automáticos
18 Flashcards autogerados do pack de conhecimento (integra quiz r68)
19 Detecção de contradição: novo fato ensinado que contradiz antigo → pergunta qual vale
20 Janela de atenção com relevância: fatos do pack ranqueados por similaridade à pergunta
21 Replay de erros: comandos que caíram no modelo por gatilho fraco viram candidatos de rota
22 Curadoria do léxico: top-10 padrões sugeridos pra virar atalho permanente
23 Esquecimento sob pedido: "esqueça sobre X" apaga do grafo e do pack
24 Exportar/importar cérebro: backup do _R69_NUCLEO num JSON versionado
25 Diff do cérebro: "o que você aprendeu esta semana?"
26 Peso por fonte: fato ensinado por você vale mais que inferência genérica (já é o espírito — formalizar)

## A2 — CONHECIMENTO E RAG LOCAL (13)
27 Índice de CONTEÚDO dos seus .txt/.md (busca por frase dentro, evolução do cérebro r68)
28 RAG local de verdade: chunking + TF-IDF + top-k no pack A2 (sem servidor de embeddings)
29 Leitor de PDF para TEXTO (extração básica de stream, honesta quando falhar)
30 .docx → texto puro (zip+XML local, sem libs — o 43 da lista-50)
31 Conector de notas: aponte uma pasta de anotações → vira conhecimento consultável
32 Citador de origem: toda resposta com pack cita o tópico/fato que a sustentou
33 Knowledge graph mini: tópicos ligados entre si ("o que você sabe sobre X?") estilo GraphRAG
34 Atualizador de fatos: "corrige: meu CEP agora é..." → versiona o fato antigo
35 Perguntas frequentes (FAQ) autogeradas do que você mais pergunta
36 Tradutor de documentos inteiro via pipeline A2+blocos (r68 em versão orquestrada)
37 Conversor de planilha → conhecimento (colunas mapeadas por você)
38 Digestor de links salvos: snapshot HTML local → resumo por modelo local
39 Modo estudo: gera resumo+quiz+flashcards de qualquer pack (combo 18+quiz)

## A3 — CARÁTER E PERSONALIDADE (13)
40 Personalidades locais (formal/ técnico/ divertido) com voz própria por perfil
41 Nível de detalhe dinâmico: "explica melhor"/"resume" ajustam a MESMA resposta
42 Memória de estilo por tópico (trabalho= formal, jogos= divertido)
43 Tom calibrado pelo feedback 👍/👎 com relatório "como você prefere suas respostas"
44 Modo professor vs modo mão-na-massa (interruptor global)
45 Sinalizador de certeza: "tenho certeza"/"acho"/"confirme comigo" calibrado pelo peso A1
46 Anti-manha: detecta resposta evasiva do modelo e força repoquisa objetiva
47 Humor configurável (off/leve/on) com sensor de contexto (nunca piada em erro grave)
48 Nome do agente customizável ("me chame de Zé") — integra apelido r67 do outro lado
49 Juramento de honestidade na abertura (linha de status: "hoje: fatos primeiro")
50 Modo criança com vocabulário controlado (lista local por idade)
51 Carta de princípios editável pelo usuário (o agente se apresenta por ela)

## A4 — RITMO E PERFORMANCE (13)
52 Preditor de espera ("isso demora ~Xs") com histórico real (integra EMA)
53 Modo economia: teto menor + cache agressivo quando bateria baixa (fatos da bateria)
54 Horário de pico aprendido: sugere gerar relatórios pesados nos horários lentos
55 Warm-up programado: manter_quente pré-aquece ANTES de você sentar (integrando r51)
56 Painel de performance em tempo real (HTML local, SSE do 10 do A0)
57 Metas de latência: "quero resposta em <10s" → o núcleo ajusta teto/estratégia
58 Modo turbo inteligente: sobe o teto SÓ em tarefas longas detectadas
59 Diário de lentidão: registra geradas lentas + causa provável (contexto grande?)
60 Compactador de histórico com contagem de economia por sessão
61 Planejador deBACKGROUND: relatórios longos viram tarefa de fundo com aviso no fim (integra 14 da lista-40)
62 Pausa fina: cancele a geração SEM perder o que já foi gerado (buffer preservado)
63 Modo sono: motor desliga após X min sem uso (economia RAM) e reacorda no comando
64 Termômetro do GGUF: alerta de contexto encostando no limite do modelo

## A5 — CÉU (rotas, intenções, futuro) (13)
65 Proposta automática de rota virando PR: as frases em fase≥3 viram arquivo de proposta em esqueletos_ideias
66 Classificador de intenção treinável local (intents.json com exemplos seus, evolução do 5 da lista-50)
67 Detector de urgência ("SOCORRO"/"urgente" muda prioridade e tom)
68 Mapa mental das suas intenções (HTML: o que você mais pede, agrupado)
69 Sugestões de próximo comando ("você costuma pedir X depois de Y")
70 Guardião de gatilhos: quando 2 rotas disputam a mesma frase, arbitra e registra
71 Testador de malha: simula 100 frases de treino contra as rotas ativas e acha buracos
72 Backup do céu: rotas + gatilhos exportáveis (restaurar em outra máquina)
73 Tradutor de rota: "por que 'organizar downloads' não funcionou?" mostra o parse falho
74 Aprendiz de sinônimos: cada rota ganha sinônimos do seu vocabulário real
75 Rota em branco guiada: "quero um comando novo" → assistente cria com você (dry-run incluso)

## A6 — FÍSICO E SISTEMA (12)
76 Sandbox com resource-limits (timeout+memória) pro 18 da lista-50
77 Auditoria estendida: camadas A0-A6 + gatilhos + rotas em 1 relatório (evolução da r69)
78 Canário de integridade do GGUF: hash por partes, detecta corrupção cedo
79 Purgador de temporários: .tmp órfãos da casa, com 'sim'
80 Termômetro do PC no painel (CPU/RAM/disco via psutil, fatos de 5s atrás no máximo)

## REGRAS DE OURO DA CASA (intocáveis)
Kill-switch em config para TUDO que aprende/esconde; nada sai do PC; r33 (memória LP) intocado; never import agente.py nos testes; selo único por release.
