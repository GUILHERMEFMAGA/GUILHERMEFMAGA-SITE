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
