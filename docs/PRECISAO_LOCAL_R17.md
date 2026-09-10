# Precisão local verificável — r17

Escolha do usuário: manter o GGUF atual e priorizar correção, não adicionar 80
ferramentas nem trocar o modelo. Nenhum treinamento, download de modelo ou
mudança de hardware foi feito. As 465 ferramentas continuam registradas.

## Melhoria da conversa

Uma base curta, escrita/revisada para este projeto, fornece conceitos de:
- RAM, cache da CPU e armazenamento persistente;
- SSD e HDD, com limites e necessidade de backup;
- comandos de ligar/desligar nuvem e motor local do agente.

Seleciona por palavras inteiras, não por substrings ("programar" não é "RAM").
Adiciona até duas referências, limitadas a 1.400 caracteres, somente quando
pertinentes. Não busca arquivos pessoais nem acessa internet. Referências não
são dados ao vivo do computador. Correções do usuário permanecem rotuladas como
informações não verificadas, não como instruções de sistema ou autorização.

As referências entram no contexto enviado ao modelo, não substituem sua geração.
O modelo ainda pode ignorar ou distorcer o conteúdo. Isso não transforma uma base
pequena numa enciclopédia, nem certifica respostas em temas fora dela.

## Avaliação opcional no PC

1. Confirme o motor com `status ia`.
2. Use `avaliar precisao local` e confirme digitando AVALIAR.
3. Serão quatro gerações: duas perguntas fixas, cada uma sem/com referências.
4. Leia respostas e critérios. Nenhuma nota automática de inteligência é dada.
5. Use `ver ultima avaliacao local` para consultar novamente.

O relatório fica em avaliacoes_ia_local/ultima.json, ignorado pelo Git. Contém
perguntas, prompts, respostas, critérios, parâmetros, estado, tempo e nome do
modelo informado pelo agente (que pode estar vazio/desatualizado). Um novo teste
substitui o último relatório; resultados parciais são gravados após cada geração.
Não enviar relatórios sem revisar o conteúdo gerado.

A avaliação usa prompt neutro fixo e não chama ferramentas, a nuvem, histórico
pessoal ou a autoedição. Não treina nada. O contexto total não é idêntico ao de
uma conversa real. Cada geração limita a saída a 250 tokens, temperatura 0,2 e
timeout de rede 45s. Timeout de rede não é limite rígido de CPU do llama-server.
Pode levar minutos em um PC ocupado. Ctrl+C interrompe, preservando o que já foi salvo.

## Interpretação honesta

Os dois casos (RAM/cache/armazenamento e reinicialização do motor local) cobrem
justamente assuntos da base revisada. Portanto, testam uso de contexto fornecido,
não generalização, conhecimento independente ou superioridade sobre nuvem.
Não há avaliação por outra IA, nem aprovação por presença de palavras-chave.
Cache de prefixo, ordem fixa sem/com, carga e aleatoriedade podem afetar os tempos.
As latências não são benchmark de velocidade. Comparações robustas exigem mais
casos independentes, repetição e julgamento humano, ainda não implementados.

## Referência GitHub

https://github.com/EleutherAI/lm-evaluation-harness (README consultado em 10/09/2026):
referência de organização de tarefas, prompts reproduzíveis e registro de avaliações.
Nenhum código, dataset ou dependência desse projeto foi incorporado. Os exemplos
são próprios e não equivalem a seus benchmarks acadêmicos.

## Validação de implementação

93 testes isolados passaram no venv de testes, incluindo relevância das referências,
preservação de pergunta/histórico, comparação sem/com, quatro chamadas controladas,
falhas de geração, confirmação recusada, motor ausente, relatório inválido e
propagação do timeout, bloqueio de links e preservação parcial após interrupção. Não foi executado GGUF real nem testado o Windows do usuário.
Não há percentual de ganho de precisão ou desempenho medido nesta entrega.

Se SEM_ATUALIZAR.txt protege suas autoedições, preserve/reconcilie essas mudanças
antes de retomar downloads. Esta atualização não mescla automaticamente código local.
