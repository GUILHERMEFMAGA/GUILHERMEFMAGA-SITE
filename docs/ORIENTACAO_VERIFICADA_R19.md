# r19 — orientação local verificada, sem mascarar o GGUF

## Motivo

No teste real apresentado pelo usuário, o modelo incluiu RAM entre dispositivos
persistentes e inventou `create_ia`/`CreateIA` para iniciar o motor. Fornecer
referências não resolveu os erros. Esta versão corrige o **roteamento da conversa**,
não treina nem melhora comprovadamente o modelo.

## Correção

No modo local, antes de selecionar ferramentas ou consultar o GGUF, perguntas
reconhecidas recebem texto determinístico identificado como orientação/explicação
verificada, sem geração do modelo. A pergunta e a resposta continuam no histórico.
Nenhuma ação é executada ao explicar um comando, mesmo com nível admin.

Cobertura intencionalmente estreita:

- Como ligar/iniciar/reiniciar/reativar a IA local ou o motor local.
- A pergunta exata do relato: “Encerrei a IA local com desligar ia local. Como ligo
  o motor novamente?”
- O que faz/significa, para que serve, explique, como funciona cada comando:
  criar ia, status ia, desligar ia, desligar ia local e ligar ia.
- Diferença entre desligar ia e desligar ia local; comandos da IA local;
  como alternar entre IA local e nuvem (formulações documentadas nos testes).
- A pergunta exata sobre RAM/cache/armazenamento, variantes curtas de “qual a
  diferença”, “RAM é cache?” e “RAM é memória permanente?”.

Não é compreensão semântica irrestrita: outras formulações, perguntas compostas,
problemas específicos do PC e assuntos fora desse escopo seguem o fluxo anterior
e ainda podem receber respostas incorretas do modelo. Perguntas reconhecidas não
são respondidas como se houvesse medição do PC. Nenhuma garantia geral de precisão.

## Semântica confirmada nas rotas existentes

| Comando digitado como ação | Efeito |
|---|---|
| criar ia | Chama a preparação/inicialização existente; reutiliza arquivos disponíveis, mas pode precisar de download se faltarem. |
| status ia | Consulta disponibilidade; agora a mensagem distingue indisponibilidade de ausência de instalação. |
| desligar ia | Desativa a nuvem, sem encerrar o motor. |
| desligar ia local | Encerra o processo local controlado pelo agente, sem desativar a nuvem. |
| ligar ia | Habilita a nuvem, não inicia o motor local. |

Comandos diretos não são interceptados pela nova explicação. Configuração de
nuvem, permissões e execução continuam nas rotas existentes. Com nuvem habilitada,
a nova proteção não intercepta a conversa; este lote prioriza somente o modo local.

## Como testar a correção

Com modo local ativo, no campo normal “O que o agente deve fazer no PC?”:

```text
Como ligar a IA local?
Encerrei a IA local com desligar ia local. Como ligo o motor novamente?
O que faz o comando desligar ia local?
Explique a diferenca entre RAM, cache da CPU e armazenamento.
```

O resultado deve conter “sem geracao do modelo”, explicar corretamente o assunto
e não iniciar/desligar nada. Para iniciar realmente, digite **criar ia**, sem
formular uma pergunta. O motor não precisa estar disponível para a orientação.

## Avaliação bruta permanece separada

`avaliar precisao local` ainda faz quatro chamadas diretas ao GGUF, com os mesmos
casos, prompts e parâmetros. Não passa pela nova resposta determinística.
`ver ultima avaliacao local` não altera nem reescreve o JSON salvo.

O cabeçalho agora avisa que são respostas BRUTAS, podem conter comandos/código
inventados e não devem ser executados sem verificação. O GGUF pode repetir os
erros do relato nessa avaliação; isso não é ocultado nem contado como melhoria.
Respostas também podem atingir o limite de tokens existente. Não houve ganho de
precisão ou latência do modelo medido nesta entrega.

## Validação e preservação

121 testes isolados passaram, incluindo 8 novos: relato exato, variantes,
comandos documentados, memória, não interceptação de ações/pedidos compostos,
preservação da nuvem, rotas reais com efeitos simulados e avaliação bruta intacta.
Testes não executam o monólito nem ações reais no Windows.

Auditoria AST: mesmas 479 ferramentas, corpos/assinaturas/ordem preservados;
nenhuma função de topo removida. Nenhuma dependência nova ou mudança de GGUF.
Banner: `[Orientacao local verificada 2026-09-10-r19]`.

Se SEM_ATUALIZAR.txt protege autoedições, preserve/reconcilie seu código local
antes de retomar downloads. Não remova o marcador sem preservar as alterações.
