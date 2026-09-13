# 70 propostas após r19 — lista de referência para seleção

O usuário confirmou a seleção **1–30**. Implementadas na r20 com escopo e limites
registrados em `MELHORIAS_1_30_R20.md` (150 testes isolados). Itens **31–70 permanecem
propostas não implementadas neste lote**. Este resumo preserva os números originais;
não interpretar a implementação limitada de um item como solução universal.

## Motor local
1. Corrigir arq_modelo possivelmente indefinido ao reutilizar GGUF em preparar_ia_local.
2. Informar quando criar ia encontra o motor já disponível, sem reiniciar.
3. Estados explícitos parado/iniciando/pronto/ocupado/falhou.
4. Verificar identidade do servidor, não aceitar qualquer /health como motor correto.
5. Prazo monotônico real para inicialização, incluindo timeouts das tentativas.
6. Aguardar e verificar encerramento após terminate antes de declarar sucesso.
7. Coordenar gerações concorrentes de conversa/avaliação/documentos.
8. Avisar/adiar tarefas opcionais por pressão de RAM, sem matar processos/trocar modelo.
9. Parâmetros de threads CPU configuráveis conservadoramente, com comparação explícita.
10. Streaming local opcional, sem prometer redução do tempo total de geração.

## Respostas e contexto
11. Cadastro único para comandos verificados, ajuda e testes de semântica.
12. Mais paráfrases reconhecidas, sem converter menções em ações.
13. Tratamento explícito de perguntas compostas, sem ignorar parte do pedido.
14. Origem, data, versão e escopo de cada referência conceitual.
15. Sinalizar conflitos entre correções do usuário e referências verificadas.
16. Verificar se citações pertencem aos trechos recuperados, sem alegar prova factual completa.
17. Calibrar abstenção por evidência insuficiente; score lexical não é probabilidade de verdade.
18. Orçamento de tokens para sistema, pergunta, contexto e resposta.
19. Preservar pares pergunta/resposta no histórico enviado.
20. Diagnóstico sob demanda da origem da resposta: regra, documento, ferramenta ou modelo.

## Avaliação
21. Preservar finish_reason para distinguir conclusão e corte por tokens.
22. Registrar métricas de tokens retornadas pelo servidor, quando disponíveis.
23. Separar versão efetiva do agente e versão do protocolo de avaliação.
24. Identificação reproduzível de modelo/motor, incluindo hash com cache e tamanho.
25. Casos independentes dos temas fornecidos nas referências.
26. Casos negativos: dados ausentes, comandos inexistentes e pedidos impossíveis.
27. Persistir julgamento humano por critério, sem nota automática de inteligência.
28. Histórico de avaliações por ID/data, sem sobrescrever o único registro.
29. Contrabalançar ordem sem/com referências para reduzir viés de ordem/cache.
30. Repetições controladas com condições e variação dos resultados registradas.

## Documentos e recuperação
31. Não substituir pasta inválida pela pasta pessoal silenciosamente na indexação.
32. Exclusões configuráveis de arquivos sensíveis no indexador.
33. Prévia do alcance da indexação antes de confirmação.
34. Indexação incremental por alterações de arquivos.
35. Detectar fontes alteradas/removidas desde a indexação.
36. Persistir estatísticas BM25 em vez de recalcular tudo em cada consulta.
37. Fragmentação por estrutura: títulos/parágrafos, funções/classes e registros.
38. Guardar linhas/páginas/intervalos precisos das evidências.
39. Identificadores e caminhos relativos para desambiguar nomes-base iguais.
40. Remover um documento do índice sem apagar o arquivo/reconstruir tudo.

## Ferramentas
41. Metadados de leitura/escrita, rede, privilégio, plataforma e reversão.
42. Conversão e validação tipada dos parâmetros coletados como texto.
43. Pedir escolha em empates relevantes de seleção, sobretudo por diferença de efeitos.
44. Explicar por que uma ferramenta foi sugerida, incluindo influência aprendida.
45. Invalidar cache do catálogo quando registro/descrições mudarem.
46. Preenchimento guiado dos parâmetros da oficina, preservando JSON como opção.
47. Verificar pré-condições sem instalar automaticamente.
48. Resultados estruturados: sucesso/falha/cancelado/parcial, avisos e evidências.
49. Verificação de pós-condições antes de alegar conclusão.
50. Prévia real de alterações nas ferramentas compatíveis, distinta da simulação textual.

## Segurança e atualização
51. Autenticação das chamadas de execução do painel local.
52. Política explícita de origens do painel em vez de CORS aberto.
53. Limites de tamanho/concorrência e rejeição de requisições inválidas no painel.
54. Opção explícita de confirmação por risco mesmo em admin, sem mudar permissões silenciosamente.
55. Confinamento de destinos das operações à pasta de projeto autorizada.
56. Políticas consistentes de symlinks/junctions nos módulos.
57. Redação de dados sensíveis antes de gravar históricos/logs/relatórios.
58. Integridade/procedência dos downloads, não só tamanho/sintaxe.
59. Reconciliação assistida base/local/remoto, preservando SEM_ATUALIZAR até resolver conflitos.
60. Validar procedência e recuperação da atualização do BAT.

## Manutenção e testes
61. Modularização gradual somente com atualização multiarquivo consistente.
62. Schema/versionamento/migrações de configuração sem apagar preferências.
63. Diferenciar JSON ausente/corrompido e preservar arquivo problemático.
64. Proteger leitura-modificação-gravação concorrente além da escrita atômica existente.
65. Retenção configurável de logs/backups sem perder recuperação necessária.
66. Diagnóstico exportável com revisão de privacidade, sem envio automático.
67. Integração Windows em ambiente descartável e privilégios mínimos.
68. Contratos de ferramentas comparados com manifesto versionado, não só contagem.
69. Testes de entradas hostis, instruções injetadas, caminhos e arquivos alterados durante leitura.
70. Testar propostas de autoedição em ambiente descartável autorizado, nunca no processo principal.

Prioridade sugerida anteriormente: 1, 2, 5, 6, 21; depois 25, 27, 31, 32, 42,
55; antes de ampliar painel, 51–53. Isto não é seleção/consentimento do usuário.
