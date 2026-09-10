# Continuidade do Super Agente PC — leitura inicial para outro Agent Mode

Atualizado em 10/09/2026. Este documento descreve a base **r19, commit 494482a**.
Ele não substitui a inspeção do código, do histórico Git e dos comentários posteriores.

## Onde continuar

- Repositório: https://github.com/GUILHERMEFMAGA/GUILHERMEFMAGA-SITE
- PR ativo **#3**: https://github.com/GUILHERMEFMAGA/GUILHERMEFMAGA-SITE/pull/3
- Título: **Super Agente PC: atualização completa — substitui o PR #2**.
- Branch desta sessão: `arena/01a082fd-guilhermefmaga-site`, base `main`.
- PR #2 é o anterior: não fechar, não retomar como destino das alterações.
- Não fazer merge na main, force push ou trocar de branch sem uma decisão explícita
  compatível com as regras do ambiente. Nesta sessão Arena a branch é fixa.
- Em outro ambiente, primeiro confira qual branch a plataforma autoriza. Se ela
  for diferente, explique o conflito antes de editar/publicar; não atualize um PR
  a partir de uma branch errada nem reescreva seu histórico.

## O que é o projeto e como a IA foi integrada

É um agente Python para operar um PC Windows, com conversa, memória, painel,
roteamento por regras e ferramentas Python. O código integra modelos existentes;
não há treinamento de um modelo fundacional do zero nem inteligência ilimitada.

**IA LOCAL:** modelo pré-treinado GGUF executado por llama.cpp/llama-server no PC,
com endpoint HTTP local OpenAI-compatível. O Python envia contexto e recebe texto.
Há também regras determinísticas que selecionam ferramentas ou respondem fatos
verificados sem consultar o modelo. Ferramentas Python executam ações; texto
produzido pelo modelo não comprova execução. Após instalar os arquivos necessários,
a inferência pode funcionar offline, sem créditos de API externa, mas consome RAM,
CPU/energia. Downloads, atualizações e ferramentas de internet ainda precisam de rede.
O usuário escolheu **manter o GGUF atual e priorizar respostas corretas**.

**IA NUVEM:** integrações com provedores externos em rodízio, com foco no uso de
cotas gratuitas disponíveis, especialmente Groq e GitHub Models. O código também
contém outros provedores/configurações opcionais. Não prometer cotas, disponibilidade
ou gratuidade permanente; dependem das regras de cada serviço. Não substituir o
rodízio por API paga nem ativar nuvem silenciosamente quando a local falhar.
Não confundir tokens de provedores no PC com a autenticação GitHub do Agent Mode.

O usuário relatou RAM muito ocupada anteriormente: não aumentar o GGUF, baixar um
modelo maior ou encerrar processos de sistema para tentar acelerar a conversa.

## Arquivos que devem ser inspecionados em Files changed / View all changes

- `agente.py`: implementação principal; 479 ferramentas registradas na r19.
  Contém motor local, provedores, histórico, roteamento, ferramentas, painel e
  autoedição. **Não importar o monólito para testes:** há efeitos no topo.
- `iniciar.bat`: inicializador Windows com elevação e atualização pela branch do
  PR #3. Pode substituir o fonte local, faz backup e respeita `SEM_ATUALIZAR.txt`.
- `chaves_EXEMPLO.txt`: somente modelo com placeholders, nunca credenciais reais.
  Textos de cotas/instruções de provedores podem envelhecer: validar antes de alterar.
- `.gitignore`: exclui segredos, dados locais e relatórios privados.
- `tests/`, `scripts/auditar_ferramentas.py`, `requirements-tests.txt`: testes AST
  isolados, inventário e dependência de testes packaging.
- `docs/`: protocolos, limites, referências e guias das versões.

Arquivos já existentes e sem mudanças não aparecem necessariamente no diff desta
última etapa. Não criar alterações artificiais em iniciar.bat/chaves_EXEMPLO.txt
apenas para fazê-los aparecer; confirme também o diff cumulativo do PR #3.
Nunca publicar `chaves.txt`, histórico pessoal, modelos GGUF, backups do usuário
ou relatórios reais sem revisão e autorização.

## Comandos importantes

| Comando | Significado |
|---|---|
| `criar ia` | Prepara/inicia motor local, reutilizando arquivos disponíveis; pode baixar se faltarem. |
| `status ia` | Consulta disponibilidade do motor local. |
| `desligar ia` | Desativa a nuvem, não encerra o motor local. |
| `desligar ia local` | Encerra o motor controlado pelo agente, sem mudar o interruptor da nuvem. |
| `ligar ia` | Habilita o rodízio de nuvem, não inicia o motor local. |
| `oficina local` | Menu das 14 análises offline adicionadas na r18. |
| `avaliar precisao local` | Exige AVALIAR; quatro gerações brutas locais, sem ferramentas. |
| `ver ultima avaliacao local` | Exibe o relatório já salvo, sem reescrevê-lo. |

## Estado entregue e comprovado

- r14/r15: propostas de autoedição com pré-análise, diff, confirmação, verificação
  da base, backup, rollback e bloqueio limitado de corpos AST idênticos. Histórico
  de ideias mantém até 300 títulos; isso não é treinamento nem deduplicação perfeita.
- r16: mapa estático de imports e comparação de dependências: 465 ferramentas.
- r17: referências conceituais curtas e avaliação humana sem/com contexto. Não
  alegar que referências por si só fizeram o GGUF ficar mais inteligente.
- r18: 14 capacidades adicionais da oficina, total 479. Somente leitura neste
  lote, sem executar código dos arquivos. Ver `OFICINA_LOCAL_R18.md`.
- r19: orientação determinística de escopo estreito sobre comandos e conceitos
  de RAM/cache/armazenamento. Identificada como **sem geração do modelo**. O usuário
  confirmou os dois casos no PC real. Não resolve alucinações em perguntas livres.
- Na r19: **121 testes isolados passaram**; 479 ferramentas antigas preservadas.
  Testes isolados não equivalem a testes completos no Windows/serviços externos.
- A avaliação bruta continua podendo errar. O usuário mostrou RAM incluída em
  armazenamento persistente e código inventado `create_ia`/`CreateIA`. Não mascarar
  resultados brutos com respostas prontas nem apresentar isso como ganho do GGUF.

Documentação complementar:
`AUTOEDICAO_CONTROLADA.md`, `PROJETOS_AVANCADOS_R16.md`, `PRECISAO_LOCAL_R17.md`,
`OFICINA_LOCAL_R18.md`, `ORIENTACAO_VERIFICADA_R19.md`.

## Pedido atual — NÃO confundir plano com implementação

O usuário pediu implementar **30 melhorias** após uma lista de **70 propostas**.
No momento de escrever este guia, **quais 30 ainda aguardam confirmação**.
A lista numerada está em `PROPOSTAS_70_MELHORIAS.md`. Não presumir que ele escolheu
as primeiras 30 nem que essas melhorias já foram feitas. Atualizar esta seção
assim que a seleção e as implementações forem confirmadas.

A meta anterior de 100 ideias e 700 ferramentas também não foi concluída: r18
entregou 14 capacidades da expansão; total 479, faltando 221 para 700. Não inflar
contagem com helpers, aliases ou variantes repetitivas. Melhorias internas não
precisam virar ferramentas novas. Código/projetos têm prioridade, com distribuição
para documentos/dados. Alterações confirmadas foram autorizadas, não autonomia irrestrita.

## Regras de trabalho e validação

1. Confira git status, branch, commits, PR #3, documentos e mudanças do usuário.
2. Leia o código relacionado antes de propor alterações. Compare com recursos
   existentes para não repetir capacidades. Não prometer ausência absoluta de
   equivalência semântica apenas com nomes, hashes ou AST.
3. Preserve funções, comandos, memórias, modo nuvem e confirmações. Não remova
   capacidade nem mude permissões silenciosamente; melhorias de segurança que
   alterem comportamento precisam ser explicitadas.
4. Não apagar SEM_ATUALIZAR.txt às cegas: preservar/reconciliar autoedições antes
   de retomar download. O BAT não faz merge automático de versões locais.
5. Teste sem importar o monólito. Neste sandbox:
   `/home/user/.venv/bin/python -m unittest discover -s tests -q`.
   Outro ambiente: criar venv e instalar requirements-tests.txt. Não usar
   break-system-packages; sistema pode não ter packaging.
6. Validar sintaxe, git diff --check e auditoria das ferramentas, comparando com
   a base real. Atualizar contagens e documentação apenas depois de validar.
7. Não alegar testes com GGUF/Windows reais se só executou testes isolados.
8. Usar git para commit/push e gh para PR. Autenticação Arena já configurada;
   nunca pedir senha/token/2FA. Se falhar autenticação, pedir reconexão na Arena.
9. Publicar somente na branch autorizada desta sessão e atualizar o PR #3. Em
   caso de gh pr edit falhar por Projects classic, usar gh pr comment ou REST.
10. Atualizar este guia com resultados, pendências, commits e limites reais.

## Prompt pronto para colar em um novo chat

> Continue o projeto GUILHERMEFMAGA/GUILHERMEFMAGA-SITE a partir do PR #3,
> “Super Agente PC: atualização completa — substitui o PR #2”:
> https://github.com/GUILHERMEFMAGA/GUILHERMEFMAGA-SITE/pull/3.
> Primeiro leia docs/CONTINUIDADE_AGENT_MODE.md, docs/PROPOSTAS_70_MELHORIAS.md,
> os comentários recentes do PR e o estado real do Git. Analise agente.py,
> iniciar.bat, chaves_EXEMPLO.txt, .gitignore e tests, inclusive Files changed /
> View all changes. Não peça nem exponha chaves reais. Confira a branch permitida
> pela sessão antes de editar; a origem deste trabalho é
> arena/01a082fd-guilhermefmaga-site. Não faça merge na main nem feche o PR #2.
> IA local é GGUF pré-treinado via llama.cpp no PC, mais regras e ferramentas
> Python; não foi treinada do zero. Preserve meu modelo e priorize correção.
> IA nuvem é o rodízio de provedores/cotas disponíveis, especialmente Groq e
> GitHub Models; preserve-o sem ativação silenciosa ou substituição por API paga.
> Na base r19 existem 479 ferramentas e 121 testes isolados aprovados. Confirme
> se houve versões posteriores. A proteção r19 responde alguns comandos e
> conceitos sem o modelo; a avaliação do GGUF permanece bruta e pode errar.
> Pedi 30 melhorias de uma lista de 70: verifique a seleção registrada; se não
> estiver definida, pergunte quais são antes de implementar. Preserve funções,
> memórias, permissões, confirmações e autoedições protegidas por SEM_ATUALIZAR.txt.
> Não crie capacidades repetidas nem diga que atingimos 700 ferramentas sem
> auditoria. Teste, documente resultados/limites e atualize o PR #3 e o guia de
> continuidade com o que realmente foi feito.
