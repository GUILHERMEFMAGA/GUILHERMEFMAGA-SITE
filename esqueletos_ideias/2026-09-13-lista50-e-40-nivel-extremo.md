# Tabela de 50 + lista de 40 — nível MÁXIMO de inteligência para a IA LOCAL (2026-09-13)
PROPOSTAS — nenhuma implementada. Verificadas contra TODO o código existente (r21→r68): nenhuma repete.

## TABELA DE 50 (inteligência extrema)
1 Auto-aprendizado de rotas: pergunta que cai 2x no modelo sugere criar rota de FATOS própria
2 Retomar tarefa interrompida: "onde eu parei?" restaura contexto da última ação
3 Voz → texto 100% local (STT offline estilo whisper.cpp): fale com o agente sem digitar
4 Wake word local: "Ei Agente" ativa a escuta (kill-switch no config)
5 Mini-classificador de intenção próprio (intents.json aprendido com o SEU uso)
6 Cache inteligente: pergunta repetida → resposta instantânea sem gerar de novo
7 Auto-resumo do contexto longo antes de gerar (respostas mais rápidas no GGUF)
8 Orçamento de tokens por resposta com meta que se ajusta ao seu feedback
9 Benchmark diário do modelo salvo em gráfico HTML local
10 A/B de estilos de resposta: você escolhe o preferido e fica gravado
11 Perfil explícito do usuário (nome/formato preferidos, editáveis por você — não é memória LP)
12 Modo "explique como pra criança" global (interruptor)
13 Vigia do clipboard: traduz/ resume automaticamente o que você copiar (kill-switch)
14 Leitor de planilhas .xlsx local (openpyxl se houver; honesto se não)
15 Gerador de gráficos HTML dos seus CSVs (sem nuvem)
16 Consultor de hardware p/ GGUF: "qual o maior modelo meu PC roda?" por RAM/VRAM reais
17 Downloader assistido de modelos GGUF com verificação e rollback (integra checkpoint)
18 Sandbox de código: executa Python sugerido pelo modelo em ambiente travado (com 'sim')
19 Auto-linter do próprio agente (AST local: funções mortas, nomes duplicados)
20 Auto-teste noturno: roda a suíte local e resume o resultado na abertura
21 Dashboard único HTML: saúde + velocímetro + registros + jardim numa página
22 Notificações toast do Windows para avisos locais (fim do pomodoro, revisões…)
23 Personalidades locais (formal/divertido/técnico) selecionáveis
24 Modo criança (vocabulário simples + filtro local)
25 Histórico de conversas local e pesquisável ("o que eu perguntei sobre X?")
26 Exportar conversa para HTML/PDF local
27 Tutor de inglês com correção gramatical por regras + modelo local
28 Simulador de financiamento (SAC/PRICE, juros compostos) com matematica local
29 Organizador de contas mensais (resumo por mês a partir do que você cola)
30 Calendário HTML do mês com seus agendamentos locais
31 Kanban local (tarefas em colunas, JSON + visual HTML)
32 Gerador em lote de slugs/uuids/hashes
33 Conversor de moedas OFFLINE com tabela que VOCÊ atualiza
34 Arquivista de páginas: salva snapshot HTML local e avisa quando o texto muda
35 Índice de CONTEÚDO de .txt/.md (busca frases dentro dos arquivos — evolução do cérebro r68)
36 Redator assistido offline: contratos simples, recibos, declarações por perguntas
37 Cartas a partir de bullets ("vire isso numa carta formal")
38 Revisor de texto formal (prolixidade/tom por regras locais)
39 Gerador de assinatura de e-mail HTML
40 Treino de digitação com progresso local
41 Jogos ASCII no terminal (forca, jogo da memória) com placar
42 Matemática financeira no chat (parcelas, descontos, gorjetas)
43 Conversor .docx → texto puro (docx é um zip: lê o XML local, sem libs!)
44 Extrator de tabelas de páginas HTML salvas
45 Backup agendado dos SEUS documentos (zip datado com rotação de N cópias)
46 Sincronizador de pastas A→B com log reversível (não é nuvem)
47 Detetive de Wi-Fi: redes salvas, sinal atual (netsh, fatos)
48 Teste de conexão honesto (ping ao host que VOCÊ configurar)
49 Gerador de senha forte + medidor de força local (sem salvar nada)
50 Modo quiosque: trava o agente numa lista de comandos permitidos (pra outros usarem)

## LISTA DE 40 (funções/ferramentas que tornam a IA local EXTREMA)
1 Pipeline em lote: "responda essas 10 perguntas de uma vez"
2 Encadeamento real de 2+ ações ("faça isto e depois aquilo") com plano visível
3 Rascunho visível: "no que você está pensando?" mostra o raciocínio antes de agir
4 Revisor de 2ª passada: checa a resposta do modelo contra fatos óbvios antes de mostrar
5 Detector de "respondível por FATOS" que PROPOSTA a rota nova sozinho (ponte com 1)
6 Anti-alucinação de referência: modelo citou arquivo/ferramenta? o agente VERIFICA se existe
7 Roteador por complexidade: simples→regra, média→modelo rápido, difícil→modelo grande
8 Compactador de histórico de conversa (resumo a cada N turnos, contexto sempre curto)
9 Pré-aquecimento contextual: carrega o contexto provável na abertura (evolução do manter_quente)
10 Guardião do GGUF: checksum do arquivo do modelo (detecta corrupção — like seu GGUF que travava!)
11 Troca quente de modelo: "usar modelo X" carrega outro GGUF da pasta sem reinstalar
12 Estimador de espera: "isso vai demorar ~Xs" antes de gerar
13 "Cite suas fontes": resposta do modelo vem com o fato/arquivo que a sustenta (validado)
14 Fila de fundo: "enquanto conversamos, zipe isso" (worker com kill-switch)
15 Agendador estilo cron local ("todo dia 9h faça X" num arquivo agenda_cron.json)
16 Zona de testes (dry-run): "simule isso" mostra o que SERIA feito sem fazer
17 Diário de decisões opcional (kill-switch; é LOG de ações, não memória de conversa)
18 Auto-documentação: "documente a função X" gera docstring-rascunho local
19 Gerador de esqueletos de teste para funções novas (automatiza o esqueletos_ideias)
20 Explain-plan: "como você resolveria?" passo a passo ANTES de executar
21 Votação de respostas: gera 2 versões, você escolhe; preferência fica no config
22 Tradutor de comando: "o que acontece se eu disser X?" (roteamento em modo leitura)
23 Guarda anti-loop: mesma resposta 3x → muda a estratégia sozinho
24 Feedback 👍/👎 nas respostas ("bom"/"ruim") salvo local para ajustar tom
25 Contador de tokens ANTES de enviar ("sua pergunta custa ~N tokens")
26 Modo avião granular: chaves separadas p/ nuvem, atualização e voz
27 Pausa global: "segura aí" congela tudo em fundo; "pode seguir" retoma
28 Nível de detalhe por comando ("responda curto/detalhado esta pergunta")
29 Anti-chute ativo: quando faltar contexto, o agente PERGUNTA exatamente o que falta
30 Mapa de calor de uso: seus comandos mais usados em HTML local
31 Modo convidado: sessão que não toca na config da casa
32 Checkpoint automático antes de QUALQUER release novo (integra r67!)
33 Verificador de requisitos: "consigo rodar X?" checa python/libs/hardware
34 Instalador offline: baixa as rodas uma vez, instala depois sem rede (com 'sim')
35 Gerenciador de versões do agente: guarda rN antigas e troca ("usar versao r64")
36 Dicionário PT offline básico (definições curtas por arquivo local)
37 Enciclopédia offline opcional (banco .json que você baixa/gera uma vez)
38 Calculadora de tempo de leitura/fala de um texto
39 Atas de reunião: cola anotações → ata estruturada local
40 Modo tutorial interativo: "me ensina a usar o agente" com desafios práticos guiados
