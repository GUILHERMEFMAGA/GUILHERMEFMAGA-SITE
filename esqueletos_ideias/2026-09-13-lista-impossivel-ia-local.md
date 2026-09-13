# LISTA-IMPOSSÍVEL — 44 melhorias de alto padrão para a IA LOCAL (2026-09-13)

**SÓ PROPOSTA — nada aqui foi implementado.** Cada item foi verificado contra o código
real (r73, `agente.py` com 37.461 linhas) com grep + leitura de contexto — nada da lista
repete o que já está no ar. Itens marcados ⬆ são APRIMORAMENTOS de algo que já existe
a base (a base fica, o item estende).

**"Nível impossível" significa o quê (posicionamento honesto, regra da casa):**
o que a nuvem NÃO faz no seu PC — os FATOS do seu PC, os seus arquivos, o que você
ensinou, custo zero, offline, privacidade, e EXECUTAR coisas. O modelo GGUF MANTIDO
(regra 3) — o que melhora é o agente EM TORNO dele: motor, conhecimento, caráter,
ritmo, céu e físico. Não prometemos enciclopédia maior que Perplexity/Claude (regra 2).

100% local/offline-first, zero memória LP oculta (r33), tudo com kill-switch na config,
anti-colisão automática (r30) antes de implementar qualquer item.

**Como pedir:** escolha os NÚMEROS e diga no chat. Ex.: *"coloca a 2, a 11 e a 21"*.
Lote inicial sugerido pela casa (pequeno, alto impacto, baixo risco): **1, 2, 22, 23, 36**.

## A — MOTOR: mais rápido e mais esperto (1–10)
1. **Preditor de espera** — "isso vai demorar ~Xs" ANTES de gerar (histórico real)
2. **Cache semântico** — pergunta parecida → resposta instantânea (limiar ajustável, kill-switch)
3. **Batch de prompts** — "responda essas 10 perguntas de uma vez" com barra de progresso
4. **Modo torneira** — o painel HTML acompanha a resposta sendo digitada, letra por letra
5. **Termômetro do GGUF** — avisa antes de estourar o limite de contexto do modelo
6. **Turbo inteligente** ⬆ (turbo da r42 existe) — sobe o teto de geração SÓ em tarefa longa detectada
7. **Modo sono** — o motor dorme após X min sem uso (economia de RAM) e acorda no comando
8. **Pausa fina** — cancela a geração SEM perder o que já foi escrito
9. **Canário do GGUF** ⬆ (ferramenta de hash existe) — hash do arquivo do modelo; detecta corrupção cedo
10. **Meta de latência** — "quero resposta em <10s" → o núcleo ajusta teto e estratégia

## B — CONHECIMENTO: o seu PC é o cérebro (11–20)
11. **RAG de verdade (OBRA GRANDE)** — indexa o CONTEÚDO dos seus .txt/.md/.docx e responde citando a origem
12. **Leitor de PDF sem libs** ⬆ (extração com lib já existe) — extração básica honesta quando falhar
13. **docx → texto sem libs** ⬆ (com lib já existe) — docx é um zip: lê o XML direto
14. **Exportar/importar cérebro** — backup do que aprendeu num JSON versionado (restaura em outro PC)
15. **Diff do cérebro** — "o que você aprendeu esta semana?"
16. **Detecção de contradição** — fato novo contradiz antigo → pergunta qual vale
17. **Consolidador noturno** — "sono artificial": pesos raros afundam, fortes sobem
18. **Episódios nomeados** — "lembra quando configuramos o atalho?" via LOG do agente (não é memória LP)
19. **Aprendiz de sinônimos** ⬆ (tabela estática existe) — cada rota aprende as palavras do SEU vocabulário real
20. **FAQ autogerado** — a partir do que você mais pergunta

## C — CARÁTER: o jeito que o agente fala (21–27)
21. **Personalidades locais** — formal/divertido/técnico, escolha fica gravada
22. **Feedback 👍/👎** — "bom"/"ruim" calibra o tom + relatório "como você prefere suas respostas"
23. **Sinalizador de certeza** — "tenho certeza"/"acho"/"confirme comigo" pelo peso do fato
24. **Humor configurável** ⬆ (`tom_bem_humorado` já existe) — off/leve/on + sensor (nunca piada em erro grave)
25. **Carta de princípios editável** — o agente se apresenta por ela
26. **Modo criança** — vocabulário controlado por idade (lista local)
27. **Estilo por tópico** — trabalho=formal, jogos=divertido

## D — RITMO e performance (28–32)
28. **Fila de fundo** — "enquanto conversamos, zipe isso" (worker com kill-switch + aviso no fim)
29. **Cron local 2.0** ⬆ (tarefa diária básica existe) — condições múltiplas (dia da semana, hora, "só se o PC estiver ligado")
30. **Diário de lentidão** ⬆ (detetive de lentidão da r68 existe — de PROCESSOS) — aqui é da GERAÇÃO lenta + causa provável
31. **Compactador de histórico** — resumo a cada N turnos (contexto sempre curto, GGUF responde mais rápido)
32. **Warm-up programado** ⬆ (`manter_quente` da r51) — pré-aquece o motor ANTES de você sentar

## E — CÉU: rotas que aprendem (33–38)
33. **Replay de erros** — comandos que caíram no modelo por gatilho fraco viram candidatos de rota nova
34. **Testador de malha** — simula 100 frases de treino contra as rotas ativas e acha os buracos
35. **Guardião de gatilhos** — quando 2 rotas disputam a mesma frase, arbitra e registra
36. **Tradutor de rota** — "por que 'organizar downloads' não funcionou?" mostra o parse falho
37. **Rota em branco guiada** — "quero um comando novo" → assistente cria com você (dry-run incluso)
38. **STT local (OBRA GRANDE)** — whisper.cpp: FALAR com o agente sem digitar (wake word opcional, kill-switch)

## F — FÍSICO e segurança (39–44)
39. **Sandbox com limites** — executa código Python sugerido pelo modelo com timeout+memória (sempre 'sim')
40. **Cofre de chaves pro chaves.txt** ⬆ (DPAPI da r51 existe) — usa ele pra proteger a chave real
41. **Modo convidado** — outra pessoa usa sem tocar na config da casa
42. **Auditoria estendida** — motor + rotas + gatilhos + cérebro num relatório único (evolução da r69)
43. **Visão local real** — GGUF de visão como modelo SEPARADO (GGUF principal intacto); honesto se o PC não rodar
44. **Manual do usuário (português simples)** — guia de todos os comandos, gerado do próprio código

## Base que JÁ ESTÁ no ar (referência — nada da lista acima repete isto)
- r69 núcleo (pesos/erosão/conhecimento/EMA/fases) · r70 (fatos por overlap, fonte, revisor, modo detalhado, dica de próximo passo) · r71 (cérebro persistente, `esquecer <tópico>`, listar aprendizado) · r72 (honestidade) · r73 (boas-vindas de volta)
- r67 (velocímetro, checkpoint, modo avião, sair e atualizar, mensagens honestas, defender, disco, apelido) · r68 (lote 30: duplicatas, rpg, geladeira, gerador de flashcards, detetive de lentidão, entrevista…)
- orçamento de tokens básico (r20) · ferramenta de hash de arquivos · DPAPI (r51) · tarefa diária básica · anti-evasiva básica · tabela estática de sinônimos · extração PDF/DOCX com libs · TURBO (r42)

---
*Padrões da casa valem pra tudo: kill-switch na config, backup antes de mexer, honestidade quando
não souber, cerebro.json guarda o que você ensinar, suíte cresce junto. Lista = SÓ PROPOSTA;
implementar SÓ o que for pedido, com anti-colisão (r30) e o padrão rN de sempre
(selo 2026-09-11-rN + cascata nos testes + suíte verde + commit + push + comentário no PR #4).*
