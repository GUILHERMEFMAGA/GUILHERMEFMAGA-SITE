# Continuidade do Super Agente PC — leitura inicial para outro Agent Mode

Atualizado em 10/09/2026. Este documento descreve a **r21** (confiabilidade das respostas
locais), posterior à r20 (0c343c0) e à base r19 (494482a). Consulte `git log` e o PR de
continuação mais recente (a partir da r21 as entregas seguem em PRs de continuação do PR #3,
que permanece aberto e intacto).
Ele não substitui a inspeção do código, do histórico Git e dos comentários posteriores.

## Onde continuar

- Repositório: https://github.com/GUILHERMEFMAGA/GUILHERMEFMAGA-SITE
- PR ativo **#3**: https://github.com/GUILHERMEFMAGA/GUILHERMEFMAGA-SITE/pull/3
- Título: **Super Agente PC: atualização completa — substitui o PR #2**.
- Branch da entrega r21: `arena/01a08d8e-guilhermefmaga-site`, base `main` — PR de
  continuação do PR #3 (título "Super Agente PC r21: confiabilidade das respostas locais").
- A branch autorizada MUDA a cada sessão Arena: confira `git branch --show-current` e o PR
  mais recente. Se o git da sessão estiver na base antiga (67079ef) com a árvore suja apenas
  pelo conteúdo idêntico da entrega, confira os hashes (`git hash-object`) e refaça o
  fast-forward (`git stash push -u && git merge --ff-only <ponta> && git stash drop`).
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

- `agente.py`: implementação principal; **500 ferramentas** (480 da r21 preservadas + 20 do
  lote 1 da r22: cálculo/física/texto/datas offline; ver `docs/CATALOGO_PROPOSTAS_FERRAMENTAS.md`).
  Contém motor local, provedores, histórico, roteamento, ferramentas, painel e
  autoedição. **Não importar o monólito para testes:** há efeitos no topo.
- `iniciar.bat`: inicializador Windows com elevação e atualização pela branch da entrega atual
  (r21: `arena/01a08d8e-guilhermefmaga-site`; URLs do agente e da autoatualização trocadas com
  autorização do usuário). Pode substituir o fonte local, faz backup e respeita `SEM_ATUALIZAR.txt`.
  As URLs usam `?cache=%RANDOM%` para vencer o cache de ~5 minutos do
  raw.githubusercontent (incidente r22: usuário recebeu versão de minutos atrás com
  "Agente atualizado" — cache CDN).
  **Passo permanente:** cada nova entrega, autorizada, atualiza essas URLs **e também a constante
  `URL_AGENTE_OFICIAL` do `agente.py` (checagem do iniciar.bat, ~linha 2082)** para a branch nova
  da sessão; o teste `test_agente_e_bat_apontam_para_a_mesma_branch` falha se divergirem.
  Divergência real (ocorrência r21): falso alarme no PC e corretor que reverteria a entrega.
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
| `parar geracao local` | Cancela a geração local em andamento no cliente; servidor pode seguir computando. Ferramenta `parar_geracao_local` (480ª). |
| `refazer com penalidade` | Refaz 1x a geração marcada com colapso de repetição, com repeat_penalty maior; só existe após o aviso transparente. |

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
- Na r19 foram 121 testes; na r20, 150; na r21, 175; na r22 lote 1 **197 testes isolados
  passaram** (auditoria: 500 nomes únicos, 0 corpos idênticos; 479 originais sempre preservados).
  Matriz da r21: `docs/CONFIABILIDADE_RESPOSTAS_R21.md`; catálogo/lote 1 da r22:
  `docs/CATALOGO_PROPOSTAS_FERRAMENTAS.md`.
  Testes isolados não equivalem a testes completos no Windows/serviços externos.
- **Validação real no PC (usuário, Windows, 10-11/09/2026):** r21 confirmada — selo r21 na abertura,
  sugestão de erro de digitação funcionou (`sttus ia` → pergunta → `sim` → `status ia` executado),
  sem falso positivo em `oi`, motor saudável, nuvem preservada. Incidente detectado e corrigido:
  a constante `URL_AGENTE_OFICIAL` (checagem do BAT) ficou na branch antiga → falso alarme
  "endereco ANTIGO" e criação de ATUALIZAR_INICIAR.bat que reverteria a URL; corrigido com
  limpeza automática do corretor obsoleto e teste de regressão (agente e BAT na mesma branch).
  **Validação final confirmada pelo usuário:** reabrindo o agente, o aviso não apareceu e a
  mensagem `[Limpeza]` removeu o ATUALIZAR_INICIAR.bat obsoleto no PC real. Mensagem benigna
  restante: "Ha uma versao nova do iniciar.bat" pode repetir se o console for fechado pelo X
  (a troca do BAT pelo tmp acontece na última linha, depois do pause final; fechar com uma tecla
  aplica e o aviso cessa). Cosmético: o download do agente.py funciona independentemente.
- r21 (confiabilidade das respostas locais): sugestão de comando com erro de digitação
  (difflib + confirmação "sim", só no modo local), detecção de colapso de repetição com aviso
  transparente (texto bruto preservado), `refazer com penalidade` confirmado (1x, +0,15),
  cancelamento `parar geracao local` (estado `cancelada`; servidor pode continuar brevemente)
  e `response_format` JSON no modo ideias com fallback controlado em rejeição 4xx. Validação
  real no Windows confirmada pelo usuário.
- r22 lote 1: 20 ferramentas offline de cálculo/física/texto/datas (estatísticas, MMC/MDC,
  fatoração, bases, Bhaskara, sistema 2x2, permutações/combinações, geometria plana, Pitágoras,
  Ohm, resistores série/paralelo, código de cores, energias, velocidade média, densidade,
  sílabas PT, César, Morse, feriados BR com Páscoa por Meeus, decodificar JWT). Selo de
  abertura atualizado para `-r22` (confirmação visual no PC). Todas
  determinísticas, sem rede/IA. **Validado no PC real pelo usuário** (selo `-r22` na abertura
  e contador dinâmico exibindo 500 ferramentas).
- r22 hotfix (relato do PC real): "vc tem 500 ferramentas?" não casava com os gatilhos
  determinísticos e caía no GGUF bruto (resposta confusa), e o detector de listas tratava a
  menção "500 ferramentas" como pedido de lista (falso "[Aviso de completude]"). Corrigido:
  helper `_pedido_contagem_ferramentas` rotas a pergunta de contagem para `estatisticas_poder`
  (resposta com contagem real, sem geração do modelo) e guarda em `_quantidade_lista_local`
  que só zera a quantidade em perguntas de existência/contagem (pedidos implícitos r12 como
  "mais de 40 funções" preservados — a suíte pegou a primeira tentativa larga e ela foi afinada). **180 propostas de ferramentas + o lote 1 estão no catálogo
  220 (caminho até 700)**; lotes seguintes dependem de autorização.
- A avaliação bruta continua podendo errar. O usuário mostrou RAM incluída em
  armazenamento persistente e código inventado `create_ia`/`CreateIA`. Não mascarar
  resultados brutos com respostas prontas nem apresentar isso como ganho do GGUF.

Documentação complementar:
`AUTOEDICAO_CONTROLADA.md`, `PROJETOS_AVANCADOS_R16.md`, `PRECISAO_LOCAL_R17.md`,
`OFICINA_LOCAL_R18.md`, `ORIENTACAO_VERIFICADA_R19.md`, `MELHORIAS_1_30_R20.md`.

## Pedido atual — NÃO confundir plano com implementação

O usuário confirmou explicitamente **as primeiras 30 (1–30)**. A r20 implementa
esse lote, com matriz de evidências e limites em `MELHORIAS_1_30_R20.md`:
- lifecycle/identidade do motor, fila não bloqueante por lock, pressão de RAM,
  threads configuráveis e streaming opcional (default desligado);
- comandos canônicos compartilhados, paráfrases/compostos limitados, metadados e
  conflitos conhecidos, pares de histórico/orçamento estimado, origem da resposta;
- evidência documental com abstenção lexical e calibração humana opcional,
  citações limitadas às fontes realmente enviadas (não prova semântica);
- avaliação protocolo v2/software r20, fingerprints em blocos, finish_reason e
  métricas, casos extras opcionais, repetições/seeds/ordem contrabalançada, arquivo
  por ID e julgamento humano confirmado. Default ainda 4 gerações; ampliada até 36.
Nenhuma medição no GGUF/Windows real nesta entrega. Hash de motor é fingerprint,
não versão semântica autenticada; orçamento de tokens é aproximado. Veja limites
antes de declarar qualquer problema resolvido universalmente.
**31–70 não foram implementadas neste lote.** A próxima seleção depende do usuário.

A meta de 700 ferramentas: r18 entregou 14 capacidades; r21 somou 1 (480); r22 lote 1 somou 20
(**500**). O `docs/CATALOGO_PROPOSTAS_FERRAMENTAS.md` mapeia as 200 restantes (checadas contra
o inventário; podem ser ajustadas/descartadas na hora da implementação). Não inflar
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
> pela sessão antes de editar; a origem é o PR #3 (r20, arena/01a082fd-guilhermefmaga-site) e as
> entregas seguem em PRs de continuação — confira o PR mais recente (r21: PR #4,
> arena/01a08d8e-guilhermefmaga-site). Não faça merge na main nem feche os PRs #2/#3/#4.
> IA local é GGUF pré-treinado via llama.cpp no PC, mais regras e ferramentas
> Python; não foi treinada do zero. Preserve meu modelo e priorize correção.
> IA nuvem é o rodízio de provedores/cotas disponíveis, especialmente Groq e
> GitHub Models; preserve-o sem ativação silenciosa ou substituição por API paga.
> Na r21 existem 480 ferramentas e 175 testes isolados aprovados; a r21 acrescentou
> confiabilidade às respostas locais (sugestão de comando com typo, aviso de colapso com
> "refazer com penalidade", "parar geracao local" e JSON garantido quando a build suporta;
> veja docs/CONFIABILIDADE_RESPOSTAS_R21.md). Confirme
> se houve versões posteriores e leia docs/MELHORIAS_1_30_R20.md. A proteção r19 responde alguns comandos e
> conceitos sem o modelo; a avaliação do GGUF permanece bruta e pode errar.
> Selecionei as melhorias 1–30, implementadas com limites na r20. As propostas
> 31–70 ainda não foram implementadas neste lote; confirme o próximo escopo comigo. Preserve funções,
> memórias, permissões, confirmações e autoedições protegidas por SEM_ATUALIZAR.txt.
> Não crie capacidades repetidas nem diga que atingimos 700 ferramentas sem
> auditoria. Teste, documente resultados/limites e atualize o PR #3 e o guia de
> continuidade com o que realmente foi feito.
