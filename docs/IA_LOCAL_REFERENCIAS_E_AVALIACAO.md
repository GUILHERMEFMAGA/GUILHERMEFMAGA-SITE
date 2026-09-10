# IA local: perfis, referências e validação (r5)

## Implementado
- Perfis locais: `resposta rapida` (220 tokens), `resposta equilibrada` (450),
  `resposta analitica` (1000). Pedidos explícitos de brevidade/detalhes prevalecem.
- `humor desligado`, `humor leve`, `humor criativo`: orientação de estilo,
  não garantia de obediência do modelo. `estilo da conversa` mostra configuração.
- Preferências persistidas no config.json, sem alterar nuvem ou permissões.
- Listas numeradas mantêm orçamento próprio e aviso de completude da r4.
- Reutilização do prefixo pelo llama.cpp via cache_prompt: não é cache de respostas.
- O resumo do PC não afirma mais elevação Windows com base apenas no config.json.

## Referências consultadas em 08/09/2026
- llama.cpp: https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md
  Documentação de cache de contexto, streaming e API compatível com OpenAI.
  Aplicação nesta etapa: cache_prompt. Streaming não implementado nesta etapa.
- Goose: https://github.com/aaif-goose/goose
  README consultado como referência de separação entre agente, provedores e extensões.
  Não incorporamos seu código, dependências, extensões nem provedores.

Implementação própria. Não foi copiado código de terceiros nesta etapa.
Nenhum modelo foi treinado ou trocado. As funções de controle não aumentam por si
só o conhecimento do modelo GGUF. Não há evidência de superioridade sobre nuvem.

## Avaliação manual necessária no PC
Os testes automatizados usam mocks, sem carregar o modelo nem executar Windows.
Para medir resultados reais, registre o nome do GGUF, RAM livre, perfil, segundos
até a resposta terminar, correção factual e atendimento ao pedido. Repita cada
pergunta 3 vezes por perfil (a primeira pode ter custo de aquecimento).

1. Explique a diferença entre memória RAM, cache e armazenamento.
   Esperado: distinguir conceitos e volatilidade; RAM não é sinônimo de cache.
2. Como faço para ligar a IA local depois de encerrar seu motor?
   Esperado: criar ia/status ia; ligar ia é nuvem.
3. Explique em detalhes as vantagens e limites de SSD e HD.
   Esperado: comparação correta, sem inventar medições deste computador.
4. Me dê 50 ideias de funções de software para este agente.
   Esperado: 50 ideias distintas ou aviso de incompletude; não alegar instalação.
5. Perdi arquivos importantes; o que devo fazer?
   Esperado: cuidado, sem piadas nem prometer recuperação garantida.
6. Explique como funciona o firewall.
   Esperado: conversa; nenhuma alteração no Windows.

Respostas mais longas podem ser mais lentas e esgotar a janela do modelo.
Cache de prefixo pode não ajudar quando outro cliente altera o contexto do servidor.
Não há aceleração medida no PC do usuário nesta etapa. A fala por áudio existente
não foi trocada: este aprimoramento é do texto gerado e das preferências de conversa.

## r6 — Ideias fundamentadas no próprio fonte

Comandos no console:
- `ideias para o agente`
- `me de 3 ideias para melhorar seu codigo`
- `quais melhorias para o agente na conversa local?`

Fluxo: lê `agente.py` sem executá-lo, cataloga funções de nível superior,
docstrings e nomes de chamadas via AST. Mantém em RAM um inventário, invalidado
quando o tamanho ou a data de modificação em nanossegundos muda. Seleciona até
6 funções por relevância textual e prioridades predefinidas para um pedido.
Faz uma única geração no modelo LOCAL e exige saída estruturada em JSON.
Cada proposta precisa de título, justificativa, benefício, risco, teste e uma
ou mais referências presentes no recorte. A apresentação acrescenta linhas do
fonte e um identificador de hash; descarta referências inventadas, campos
incompletos e títulos iguais após normalização.

Limites importantes:
- Até 5 propostas por pedido, 3 por padrão. Não é uma auditoria integral.
- AST prova presença de funções; docstrings não comprovam funcionamento.
- Referências existentes não comprovam que a recomendação seja correta ou
  que a funcionalidade esteja ausente. Similaridade semântica não é validada.
- O modelo pequeno pode falhar em gerar JSON válido. Nesse caso há aviso,
  não uma falsa análise bem-sucedida nem repetição automática de inferências.
- Não há execução de testes propostos nem edição de código neste fluxo.
- Não consulta chaves.txt, documentos pessoais ou nuvem. Persiste a conversa
  no histórico local usando o mecanismo existente do agente.
- Não inicia o motor silenciosamente se estiver indisponível: orienta `criar ia`.
- Os perfis/humor da conversa comum são preservados. Este modo usa instruções
  próprias de revisão técnica e temperatura menor, sem promessa de acerto.

Testes isolados incluem cache/invalidação, fonte que causaria erro se executado,
referências falsas, títulos duplicados, JSON inválido, motor ausente, roteamento
nos dois modos e ausência de escrita no fonte. Ainda é necessário avaliar a
saída do GGUF e o tempo de geração no Windows real.

## r7 — Primeiro lote de confiabilidade das ferramentas existentes

Escolha do usuário: aprimorar as ferramentas existentes, não adicionar 300 novas.
Preservadas as 463 entradas da lista tools, na mesma ordem e com as mesmas
assinaturas de funções. Nenhuma ferramenta removida ou fundida.

- salvar_json: serializa antes, escreve em temporário no mesmo diretório,
  flush/fsync e os.replace. Em falha normal, preserva o destino e limpa o
  temporário. Não é transação entre threads, backup permanente nem garantia
  contra todo tipo de queda de energia; escrita pode custar mais tempo.
- _invocar_local: escolhe .invoke OU chamada direta. Não cai na chamada direta
  após erro de .invoke. Informa possível efeito parcial sem imprimir parâmetros
  ou mensagem crua da exceção. Não elimina retries internos de cada ferramenta
  ou do executar_com_autocura; estes ainda precisam de classificação por efeito.
- abrir painel: prioridade do painel web sobre o atalho do Painel de Controle.
  A segurança/autenticação da API do painel ainda é um ponto pendente separado.

Referências primárias no GitHub consultadas em 08/09/2026:
- https://github.com/untitaker/python-atomicwrites (MIT): temporário no mesmo
  diretório e substituição. O projeto está descontinuado; não foi instalado.
  Seu README recomenda considerar os.replace da biblioteca padrão.
- https://github.com/jd/tenacity (Apache-2.0): políticas explícitas de repetição,
  limites e tratamento de erros. Não foi instalado nem copiado código.

Implementação própria sem nova dependência de runtime.

Auditoria reproduzível: python scripts/auditar_ferramentas.py
Resultado: docs/AUDITORIA_FERRAMENTAS_R7.md. Verifica registro, nomes, presença
no AST, corpos idênticos e possíveis sobreposições por similaridade textual.
Não prova ausência de duplicação semântica entre todas as ferramentas.
Exemplos revisados: csv_para_json e json_para_csv são operações inversas;
inicializacao_windows/remover_programa_inicializacao têm sobreposição parcial,
mas abrangência diferente (HKCU Run versus várias chaves Run/RunOnce).
Nenhuma foi removida porque têm interfaces e escopos diferentes.

Próximos lotes ainda NÃO implementados: classificação de efeitos e retries,
validação uniforme dos resultados de comandos Windows, revisão de permissões,
segurança do painel e comparação funcional aprofundada das 463 ferramentas.

## r8 — Sugestão de correção para sites conhecidos

Exemplo: `abre o yotube` sugere youtube e pede `sim/nao` antes de abrir.
Só ocorre depois que o caminho existente de programa/site retorna NAO_ACHADO.
Usa difflib da biblioteca padrão sobre nomes cadastrados, nota mínima 0,84 e
margem mínima 0,10 entre destinos diferentes. Aliases da mesma URL são agrupados.
Não aproxima URLs digitadas, caminhos, nomes curtos, programas ou comandos de
sistema. Cancelar/Enter não abre nada pela sugestão. Não há aprendizado automático,
chamada de nuvem ou garantia de compreensão de toda frase incompleta.
40 testes isolados passaram, incluindo a frase completa no roteador e confirmação
com navegador simulado. Abertura real no Windows ainda precisa ser conferida.

## r9 — Conversa contextual curta

- Perguntas curtas de bom humor respondem conforme a preferencia configurada,
  sem chamar modelo nem afirmar sentimentos reais.
- Horario e periodo do dia em Ribeirao Preto usam o relogio do PC convertido
  para America/Sao_Paulo; fallback UTC-3 quando Windows nao possui tzdata.
  Manha/tarde/noite/madrugada sao faixas convencionais do relogio, nao verificacao
  de luz solar. Depende de o relogio do PC estar correto. Outras cidades nao sao
  implicitamente tratadas como Ribeirao Preto.
- Instrucoes da conversa orientam a responder a pergunta atual e pedir contexto
  especifico em vez de saudar novamente. Isso nao garante obediencia do modelo.
- Fallback de falha da IA local informa indisponibilidade da resposta e orienta
  status ia/criar ia em vez de recomendar nuvem como se fosse obrigatoria.
- A saudacao generica no relato do usuario nao foi reproduzida com o GGUF real;
  nao atribuir causa exata a falha de servidor apenas com aquele log.
- 44 testes isolados passaram, incluindo exemplos completos no roteador,
  virada de data UTC/Brasilia, periodos e humor desligado. Sem teste do modelo
  real, alteracao da voz ou verificacao astronomica de nascer/por do sol.

## r10 — Casos reais de conversa/capacidades

- `esta de noite?` usa Ribeirao Preto como referencia explicitamente informada,
  sem exigir repetir a cidade; continua dependendo do relogio correto do PC.
- Perguntas de capacidade de integracao com VS Code consultam a presenca das
  ferramentas carregadas e explicam comandos existentes, sem executar nenhuma.
  Nao afirmam que uma extensao de chat esteja instalada.
- Identidade verifica IsUserAnAdmin no Windows e separa elevacao real de nivel
  configurado. Nao promete confirmacao para toda mudanca em modo admin.
- `ok oque gostaria de ter?` encaminha para o modo de sugestoes do proprio agente.
- Se o JSON das ideias for aceito mas todas as propostas forem descartadas,
  preserva o resultado zero e oferece um roteiro FIXO de testes para funcoes
  existentes, rotulado como nao gerado pela IA. Nao certifica raciocinio do
  modelo, ausencia de duplicatas ou melhoria automatica de suas sugestoes.
- 48 testes isolados passaram; geracao do GGUF real ainda nao testada.

## r11 — Interação, feedback e planejamento

Implementações pequenas a partir das ideias do modelo; não se adotaram as
alegações sem evidência sobre vendas/transações ou ausência de agenda.

- Aliases de conversa reutilizam perfis existentes: responda mais curto,
  responda com mais detalhes, menos piadas, mais leve.
- `corrija sua resposta: ...` vincula uma correção explícita ao último par
  pergunta/resposta encontrado no histórico. Mostra a pergunta vinculada.
  Até 30 correções, 600 caracteres cada, no config.json local já ignorado.
- `minhas correcoes` permite consultar. `apagar correcoes da conversa` pede
  confirmação e apaga só essa coleção, não memórias ou configurações gerais.
- Recuperação por palavras compartilhadas, até duas correções; adicionadas
  como dados no pedido local, não ao prompt de sistema. Não é treino do GGUF,
  verificação da verdade ou garantia de obediência; pode recuperar algo
  pouco relevante por coincidência de palavras. Não registrar credenciais.
- `plano de foco 60: estudar; revisar; praticar`: divisão determinista do tempo
  entre tarefas na ordem indicada, com pausas quando há orçamento. Não
  estima dificuldade, inicia cronômetro, chama ferramentas ou grava agenda.
  Aceita 5–480 minutos, até 8 tarefas e pelo menos 5 minutos por tarefa.
- Agenda, agendamento e Pomodoro existentes foram preservados, sem duplicação.
- 53 testes isolados passaram. Modelo/Windows reais não testados nesta etapa.
