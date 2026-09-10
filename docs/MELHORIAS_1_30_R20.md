# r20 — melhorias 1–30 selecionadas pelo usuário

Seleção confirmada: **as primeiras 30** de `PROPOSTAS_70_MELHORIAS.md`.
Implementação própria e incremental sobre r19, mantendo o GGUF e o rodízio da
nuvem. São melhorias internas: **479 ferramentas**, não 509 nem 700.

## Matriz de implementação e limites

| Nº | Entrega no código | Limite importante |
|---|---|---|
| 1 | `preparar_ia_local` identifica GGUF reutilizado por basename do caminho. | Não escolhe um modelo novo por esta melhoria. |
| 2 | Motor já pronto responde explicitamente, sem reiniciar/baixar. | Readiness depende da identidade conferida. |
| 3 | `_r20_estado`: parado, iniciando, pronto, ocupado, falhou + motivo/tempo monotônico. | Estado observado pelo cliente, não telemetria completa do servidor. |
| 4 | `/health` com status ok + `/v1/models` com nome do GGUF esperado. | Confere compatibilidade, **não autentica** processo. Alias diferente é recusado; não desabilitar a verificação às cegas. |
| 5 | Inicialização com deadline monotônico, timeouts limitados pelo restante e detecção de saída precoce. | Chamadas de SO/rede podem ultrapassar prazo; não é interrupção rígida de CPU. Processo tardio não é morto automaticamente. |
| 6 | `terminate` seguido de `wait(5)`; referência ao processo mantida se não confirmar saída. | Não força kill; não encerra servidor que o agente não controla. |
| 7 | Lock de geração compartilhado, uma requisição local ativa por vez; concorrente recebe erro, sem retry. | Não é fila durável. Após timeout/desconexão o servidor pode ainda estar computando; lock do cliente não comprova cancelamento remoto. |
| 8 | Avaliação e redação opcional de documentos adiadas abaixo do mínimo de RAM configurado. | Sem psutil/leitura válida, não inventa medida e permite tarefa. Conversa direta não é bloqueada automaticamente por RAM. |
| 9 | Threads configuráveis com limites de CPU/1–16, aplicadas no próximo início. | Default 4, limitado à CPU disponível; sem ajuste automático de desempenho/modelo. Compare relatórios depois de reiniciar explicitamente. |
| 10 | Transporte SSE opcional, chunks, DONE, limites e metadados. | Streaming desligado por padrão. Prévia pode conter erros; resposta final aparece novamente para manter fluxo/histórico. Não promete redução do tempo total. |
| 11 | `_r20_catalogo_comandos` alimenta ajuda, explicações, referências e grupos canônicos do dispatcher. | Aliases legados preservados; nomes canônicos são a fonte única dos cinco comandos. |
| 12 | Mais paráfrases explícitas e testadas para voltar ao motor offline. | Não é compreensão universal; sem fuzzy matching de ações. |
| 13 | Compostos conhecidos recebem orientação por partes; segunda parte desconhecida gera pedido para separar. | Cobertura estreita de prefixos conhecidos; não executa segunda parte nem aceita ação implícita. |
| 14 | Metadados das três referências: origem, versão, revisão, escopo; data anexada ao contexto. | Notas próprias, não consultas ao vivo. |
| 15 | Contradições conhecidas entre correções e referências são sinalizadas; correção conflitante omitida do contexto. | Heurística limitada com falsos positivos/negativos; memória original não é apagada. |
| 16 | Redação documental com fonte entre colchetes; fonte inexistente, ausente ou cortada do contexto rejeita a redação. | Valida identificadores, não prova suporte semântico. Trechos originais permanecem visíveis. |
| 17 | Abstenção por cobertura lexical configurável + calibração com 4–20 exemplos humanos positivos/negativos. | Limiar default 0,5 é heurístico, **não calibrado no PC do usuário**. Calibração ajusta à própria amostra, não valida generalização nem aplica sozinha. |
| 18 | Reserva de saída/janela/margem; remove pares antigos para caber; pedido excessivo é recusado sem cortar pergunta. | Tokens estimados por bytes UTF-8/2 + overhead, **não tokenizer exato**. Janela mantida em 4096. |
| 19 | Histórico enviado preserva pares completos, até 6 mensagens/2400 caracteres; não altera memória salva. | Pares longos são omitidos, não resumidos automaticamente. |
| 20 | Origem sob demanda: regra/contexto, modelo, ferramenta, documento, abstenção/fallback. | Último registro global; sem prompt/raciocínio/argumentos privados. Rotas legadas não instrumentadas dizem origem não especificada. |
| 21 | `finish_reason` preservado; corte por length avisado na conversa e no exibidor da avaliação. | Texto bruto da avaliação não é corrigido/substituído. |
| 22 | `usage`, `timings`, latência e streaming preservados quando retornados. | Campos podem estar ausentes conforme build/API. |
| 23 | Relatório separa `software=r20` de `suite=precisao-local-v2`. | Não confundir protocolo v2 com inteligência do modelo. |
| 24 | Fingerprints SHA-256 em blocos, tamanho e nome de modelo/motor + Python/threads; cache por metadados. | Hash inicial pode demorar; é identidade dos arquivos, não prova de versão semântica/build em execução. Não executa binário para obter --version. |
| 25 | Casos extras de lógica e porcentagem, sem respostas fornecidas pela base conceitual. | Dois casos independentes, não benchmark amplo. |
| 26 | Casos negativos de serial de SSD ausente e comando inventado. | Dois exemplos, não prova geral de resistência a alucinações. |
| 27 | Julgamento humano por caso/repetição/modo/critério, justificativa e confirmação JULGAR. | Sem nota automática. Não modifica resposta bruta. Índices de critérios começam em zero. |
| 28 | Relatórios por UUID + última; parciais salvos. Primeiro relatório legado válido é copiado antes de substituir. | Sem política automática de retenção. Legado sem ID não usa o novo editor de julgamentos. |
| 29 | Ordem sem/com contrabalançada por caso e repetição; mesma seed dentro de cada par. | Cache/carga/ordem ainda influenciam; não é benchmark de velocidade. |
| 30 | 1–3 repetições, seeds registradas, min/max/média/n de tempos bem-sucedidos. | Resultados semânticos continuam exigindo julgamento; seed não garante determinismo no backend. |

## Comandos de uso

```text
ajustes ia local
diagnostico ia local
origem da resposta local
referencias ia local
```

Configuração com prévia dos valores digitados pelo usuário e confirmação
**CONFIGURAR**. Nenhuma opção modifica provedor, permissões ou modelo:

```text
configurar ia local: {"streaming":true,"threads":4}
configurar ia local: {"streaming":false,"ram_min_mb":256}
configurar ia local: {"avaliacao_ampliada":true,"repeticoes":2,"semente":42}
```

Threads só valem no próximo início. Para aplicar, encerrar explicitamente com
`desligar ia local`, aguardar confirmação de saída e usar `criar ia`. Se ocupado,
não encerra durante geração. Não remover arquivos do GGUF para ajustar threads.

## Avaliação opcional no PC

- Default: dois casos básicos × duas variantes × uma repetição = **4 chamadas**.
- Ampliada: seis casos × duas variantes × repetições; com 2 repetições são **24**.
- Máximo: 36 chamadas. O comando informa o total **antes de exigir AVALIAR**.
- Os extras sem referência pertinente geram prompts equivalentes entre variantes;
  isso é registrado. Servem como controles, não como demonstração de efeito da base.
- Leitura inicial de hashes pode demorar e usa disco/CPU, mesmo em blocos pequenos.
  Não foi executada com o GGUF real nesta entrega.
- Ctrl+C preserva parciais e estado interrompido. Falhas não contam como tempos de
  sucesso. Nenhum retry de geração é realizado.

```text
avaliar precisao local
ver ultima avaliacao local
```

Arquivos em `avaliacoes_ia_local/<id>.json`, ignorados pelo Git. A versão bruta é
mantida; resultados ruins não são trocados por respostas determinísticas r19.
Relatório antigo inválido/excessivo não é silenciosamente sobrescrito.

Exemplo de julgamento (trocar ID por aquele exibido, não usar o placeholder):

```text
julgar avaliacao local: {"id":"COLE_O_ID_DE_32_CARACTERES","caso":"memoria","repeticao":1,"modo":"sem_referencias","criterio":0,"julgamento":"incorreto","justificativa":"Confundiu RAM com cache."}
```

Valores: correto, parcial, incorreto ou nao_avaliado. Exige **JULGAR**. O arquivo
por ID é atualizado; ultima.json só acompanha se ainda aponta à mesma avaliação.

## Calibração documental — não é treino do GGUF

Primeiro indexe documentos apropriados e revise exemplos: o rótulo `suficiente`
significa que você avaliou que os trechos recuperados permitem responder.

```text
calibrar evidencia local: {"casos":[{"pergunta":"pergunta positiva um","suficiente":true},{"pergunta":"pergunta positiva dois","suficiente":true},{"pergunta":"pergunta sem apoio um","suficiente":false},{"pergunta":"pergunta sem apoio dois","suficiente":false}]}
```

Exige **CALIBRAR**, lê o índice local sem IA/rede HTTP. O exemplo acima é formato,
não dataset útil pronto. Usa grade 0,1–1,0, penalizando falso aceite duas vezes mais
que falsa recusa. Retorna limiar e erros na amostra, sem persistir perguntas ou
aplicar automaticamente. Revise com exemplos independentes antes de adotar:

```text
configurar ia local: {"cobertura_minima":0.6}
```

Não confundir cobertura de palavras com probabilidade de verdade. Fontes com
mesmo basename ainda podem ser ambíguas (proposta 39, fora deste lote). Indexador
legado ainda tem limitações de privacidade (31–40 não foram selecionadas).

## Preservação, testes e referência

- **150 testes isolados passaram**, 29 testes novos no arquivo r20, além das
  regressões anteriores adaptadas para comportamento intencional.
- Casos: lifecycle simulado, concorrência real de threads do teste, JSON/SSE
  simulado, hashes de fixtures, corte de contexto/fontes, calibração, confirmações,
  arquivo legado, julgamento e 24 gerações simuladas contrabalançadas.
- AST: 479 ferramentas, mesmas assinaturas e ordem; nenhuma função de topo
  removida. Entre @tools, somente `perguntar_aos_meus_arquivos` teve seu corpo
  aprimorado para abstenção/citações; as outras 478 mantiveram seus corpos.
- Nenhuma dependência nova, alteração de GGUF ou provedores. `iniciar.bat` e
  `chaves_EXEMPLO.txt` já aparecem no diff cumulativo do PR #3; não foram editados
  artificialmente neste lote. O módulo continua no agente.py, compatível com o
  mecanismo de distribuição atual.
- Fonte consultada: https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md
  (parâmetros de CPU/contexto e API do servidor); implementação própria.
- Não executado Windows/GGUF/provedores reais nesta entrega. Sem porcentagem de
  ganho de precisão, velocidade ou superioridade à nuvem alegada.

```text
/home/user/.venv/bin/python -m unittest discover -s tests -q
python -m py_compile agente.py
```

Preserve/reconcilie autoedições antes de retirar SEM_ATUALIZAR.txt. Segurança do
painel, privacidade completa do indexador e atualização autenticada continuam
propostas fora da seleção 1–30, não correções implícitas desta versão.
