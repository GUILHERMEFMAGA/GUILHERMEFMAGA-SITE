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

- `agente.py`: implementação principal; **549 ferramentas** (541 do caminho r20-r22 preservadas
  + 8 do hotfix-estrutura + 49 da r23; auditoria 549/549 únicas, 0 corpos idênticos; ver
  `docs/CATALOGO_PROPOSTAS_FERRAMENTAS.md` — restam 151 propostas para 700).
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
- Na r19 foram 121 testes; na r20, 150; na r21, 175; na r22, 199; na r23, 218; na r24, 230;
  na r25, 238; na r26, 253; na r27, 286; na r28, 301; na r29, 316; na r30, 324; na r31, 328; na r32, 335; na r33, 343; na r34, 351; na r35, 359; na r36, 365; na r37, 371; na r38, 376; na r39, 381; na r40, 384; na r41, 390; na r42, 415; na r43, 467; na r44, 477; na r45, 488; na r46, 493; na r47, 501; na r48, 508; na r49, 516; na r50, 526; na r51, 545; na r52, 578; na r53, 588; na r54, 594; na r55, 599; na r56, 604; na r57, 610; na r58, 614; na r59, 615; na r60, 616; na r61, 622; na r62, 629; na r63, 635; na r64, 640; na r65, 645; na r66 **649 testes isolados passaram** (auditoria: 733 nomes únicos, 0 corpos idênticos; ferramentas
  antigas sempre preservadas em nomes/ordem/assinaturas; loader de testes extrai `_norm_pt` e
  prefixos r20-r45 + r50-r53).
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
  "mais de 40 funções" preservados — a suíte pegou a primeira tentativa larga e ela foi afinada).
  **Hotfix validado no PC real**: a mesma frase do relato agora recebe "EU TENHO 500 FERRAMENTAS"
  determinístico, sem alucinação do modelo e sem aviso de completude falso.
- **r23 (lotes 2-3 + capacidades, pedido do usuário):** 45 ferramentas novas de cálculo/física/
  datas/números/finanças (primos, regressão, correlação, PA/PG, trigonometria, radianos, log,
  bitwise, média ponderada, frações, sólidos, tabela verdade, queda livre, MRU/MRUV, Newton,
  trabalho/potência, calor, dilatação, hidrostática, empuxo, ondas, RC, divisor de tensão, kWh,
  rendimento, torque, Coulomb, pressão, elástica, BRL, variação %, algarismos significativos,
  notação científica, frações/decimais, horas decimais, taxa composta, meta de poupança, preço
  por unidade, semana ISO, bissexto/calendário, soma de úteis, recorrentes, timestamp, JDN) +
  **5 capacidades internas novas**: `resumo_ferramentas_por_tema` (autocognição), 
  `achar_ferramenta_para_tarefa` (tarefa→ferramenta com justificativa), `fluxo_sugerido_tarefa`
  (roteiros determinísticos com ferramentas reais), `comparar_ferramentas_similares` (guia A/B) e
  **memória de ideias rejeitadas** (`ideia rejeitada: <titulo>` / `ideias rejeitadas` /
  `limpar ideias rejeitadas`, integrada ao modo de ideias como filtro de dados — não é treino).
  **O GGUF em si NÃO ficou mais inteligente** (regra do usuário: sem trocar modelo/treinar);
  o que cresceu é a capacidade determinística e o roteamento. Selo `-r23`.
- **r24 (sistema/velocidade — pedido "aprimorar sem trocar nada"):** 549 ferramentas mantidas;
  ganhos internos de resposta rápida: memoização de `_norm_pt` (função pura, cache ≤512 — acelera
  todo o roteamento); **cache curto de respostas locais idênticas** (mesma pergunta SEM histórico,
  resposta rotulada `[Cache local]`; 5 min por padrão, 0–120 via `configurar ia local:
  {"cache_minutos":N}`, 0 desliga; perfil/humor na chave; não vale para `refazer com penalidade`);
  registro dos últimos 20 tempos de geração + comando **`velocidade ia local`** (última, média das
  10, tokens/s quando o servidor devolve usage, estado do cache e dicas honestas). Nada trocado:
  GGUF, nuvem, ferramentas, confirmações. Selo `-r24`. Não testado no Windows real.
- **r25 (camada de poder para TODAS as ferramentas — pedido do usuário):** 549 ferramentas
  mantidas (nenhuma nova na lista; contagem não inflada). Camada interna no despachante
  `_invocar_local` (usado pelas rotas de voz/comando): **telemetria universal** (usos/erros/
  duração por ferramenta, em memória, nada sai do PC) e **sugestão de nomes parecidos**
  (difflib, corte 0,6) quando o nome não existe. Comandos novos: **`usar <nome> com {json}`**
  (executor universal das 549: mostra o que a ferramenta faz, confirma sim/nao e executa com
  parâmetros exatos — as confirmações internas de cada ferramenta continuam valendo),
  **`ajuda ferramenta: <nome>`** (descrição + como chamar), **`estatisticas ferramentas`**
  (ranking de uso da sessão) e **`diagnostico ferramentas`** (erros com tipo, sem repetir
  chamada). Correção de processo: o corte por ':' do roteador quebrava JSON com ':' — o
  `usar` passou a ser detectado antes, no texto cru. Loader de testes extrai `_r25_`.
  Selo `-r25`. Não testado no Windows real.
- **r26 (fábrica de ideias — melhoria guiada por dados reais):** comando **`fabrica de ideias`**
  (interno, não registra ferramenta; contagem 549 mantida). `_r26_propostas_catalogo` lê sozinho
  o `docs/CATALOGO_PROPOSTAS_FERRAMENTAS.md` ao lado do agente (itens "Proposta `nome` — descrição"
  por tema `## G`; arquivo ausente degrada com honestidade para modo só-telemetria). O relatório
  cruza: **[1] robustez** (ferramentas com erro na telemetria r25, piores primeiro → ideia de
  blindagem), **[2] top de uso** da sessão, **[3] propostas do catálogo** priorizadas pelo
  vocabulário do que o usuário MAIS usa (`_r26_priorizar`), filtradas pelas ideias rejeitadas
  (r23; `_r26_filtrar_rejeitadas`, substring normalizada ≥8) e pré-checadas contra colisão de
  nome (difflib corte 0.78; `_r26_sem_colisao`), **[4] como usar**. SÓ SUGERE — implementação
  continua exigindo auditoria AST + autorização. Saída sem acento (`_r26_dobrar`) para o console
  do Windows. Item 163 do catálogo marcado como entregue na r25 (comandos internos). Loader de
  testes extrai `_r26_`. Selo `-r26`. Não testado no Windows real.
- **r27 (LOTE 4 — crescimento de ferramentas):** +40 ferramentas (**549 → 589**, auditadas 0
  duplicatas), itens 10, 49–66 e 68–88 do catálogo (as 40 primeiras propostas restantes na ordem
  do arquivo — texto/dev/referência): tabuada, anagrama, palíndromo, alfabeto fonético PT+NATO,
  Vigenère (≠ César), XOR-hex, numerar/quebrar/alinhar/ordenar linhas, vogais/consoantes, caixa
  alternada, repetições de palavra, tags HTML→texto, plural/singular regular (com mapa `ais→al`
  — o `→l` burro gerava "animl"), conjugação regular PT, ordinal 1–1000º, cron explicado
  (rótulos por campo inteiro, não só a 1ª palavra), códigos HTTP, MIME, semver (com pre-release),
  contraste WCAG, escapar json/regex/html/cmd, diff profundo de JSON, aplanar/reconstruir JSON,
  testar regex, .editorconfig, .pre-commit, licenças MIT/ISC/Apache-resumo, changelog, readme,
  .env de exemplo, requirements ordenar/dedup, massa de dados PT-BR com CPF fake VÁLIDO
  (determinístico por seed), URL encode, sumário markdown, estimativa de tokens, tabela Markdown.
  **RECONCILIAÇÃO do catálogo:** 47 itens de lotes anteriores estavam sem ✅ — marcados (40 nome
  exato + 7 nome ajustado); 11 semelhanças difusas RECUSADAS (ex.: Vigenere≠César, DDD≠IP
  estático) e voltaram para restantes. Catálogo agora: 109 ✅ conferidos 1-a-1 contra defs,
  110 propostas restantes (589+110=699; a próxima ideia nova fecha 700). Suíte: +48 casos
  (test_ferramentas_lote4_r27.py). Selo `-r27`. Não testado no Windows real.
- **r28 (fábrica PROFISSIONAL — o que faltava na máquina de ideias):** nada novo na lista
  (589 mantidas; tudo interno). **[1] Telemetria persistente**: `_r25_uso_ferramentas` agora
  carrega/grava `telemetria_ferramentas.json` em PASTA_BASE (load preguiçoso só se o registro
  global é None; save com throttle de 60s + flush forçado em estatisticas/fabrica; falha de
  disco nunca derruba ferramenta; `zerar telemetria` exige LIMPAR). Sem PASTA_BASE (testes
  AST) fica só em memória — zero arquivo criado. **[2] Justificativa**: cada sugestão da
  fábrica mostra "(porque voce usa: ...)" com o vocabulário casado do top de uso.
  **[3] Rotação**: `fabrica_apresentadas` (config, cap 50) — novidades primeiro; já
  apresentadas só voltam se faltarem opções. **[4] Ciclo de feedback**: `ideia boa: <nome>`
  grava `ideias_favoritas` (cap 100) e a fábrica prioriza marcando "[voce marcou como BOA]";
  veto continua pelo `ideia rejeitada` da r23. Cabeçalho da fábrica diz se os dados são
  acumulados entre sessões. Loader de testes extrai `_r28_`. Selo `-r28`. Não testado no
  Windows real.
- **r29 (ESQUELETOS DE IDEIA — o agente materializa ideias em código):** nada novo na lista
  (589 mantidas; interno). Comandos: **`esqueleto de ideia: <nome>`** gera `esqueletos_ideias/<nome>.py`
  (função com docstring, `NotImplementedError` de pendência, exemplo de uso e cabeçalho explicando
  que o arquivo NÃO é o agente e sobrevive ao atualizador), **`listar esqueletos`** e
  **`abrir esqueleto: <nome>`** (Notepad no Windows; fallback honesto com o caminho). Regras:
  nome sanitizado (acentos→sem acento, espaços→`_`, ≤60, dígito inicial ganha prefixo `ideia_`),
  NUNCA sobrescreve esqueleto existente, NUNCA toca no `agente.py`, sem `PASTA_BASE` (testes AST)
  nada é escrito. Integração real segue a esteira: colar no chat → testes → auditoria → aprovação.
  Loader extrai `_r29_`. Selo `-r29`. Não testado no Windows real.
- **r30 (ANÁLISE da ideia antes do esqueleto):** `_r30_analisar_ideia` roda ANTES de criar o
  arquivo: **[1] colisão** com as ferramentas registradas BLOQUEIA a criação (zero duplicata;
  sugere `usar <nome> com {...}` ou reformular); **[2] catálogo** — proposta correspondente
  (nome igual, substring ≥8 ou ≥2 palavras em comum) enriquece a docstring ("Catalogo #N: desc");
  **[3] vizinhas** — até 3 ferramentas com palavras em comum vão para o cabeçalho do esqueleto e
  para o resumo ("porque vale reaproveitar"). Palavra curta não é colisão falsa (norma exata).
  Resumo da análise na mensagem ("Analise da ideia: ..."). Loader extrai `_r30_`. Selo `-r30`.
  Não testado no Windows real.
- **r31 (checagem dura de existência no pipeline de ideias da conversa livre):** o pipeline
  antigo (r15/16, fundamentado no GGUF local) já avisava sobre repetidos no histórico e
  rejeitadas; agora `_formatar_ideias_verificadas` também aplica a checagem DURO das demais
  camadas: `_r31_ideia_ja_existe` descarta sugestão cujo título normalizado é nome de função
  do agente (zero duplicata; contagem no resumo "Descartadas porque ja existe ferramenta...") e
  `_r31_numero_no_catalogo` marca com "(catalogo #N)" a sugestão que corresponde a proposta do
  catálogo local. Todos os 3 caminhos de ideia (fábrica r26, esqueleto r30, conversa livre r31)
  agora compartilham a mesma garantia anti-repetição. Nota: a geração continua no GGUF LOCAL
  (llama-server, `_chamar_neural`); nada na nuvem. Loader extrai `_r31_`. Selo `-r31`. Não
  testado no Windows real.
- **r32 (verificação pós-geração + radiografia completa, tudo somente leitura):** fecha o ciclo
  "colocar ideia em código e conferir que ficou certinho". **[1]** `_r29_gerar_esqueleto` agora
  roda `_r32_conferir_codigo` (ast.parse + presença da função) logo após gravar e inclui na
  mensagem "Verificacao pos-geracao: sintaxe OK, funcao X presente" — se falhar, aviso honesto
  com o motivo (arquivo mantido, nunca apagado às cegas). **[2]** `conferir esqueletos` valida
  TODOS os .py da pasta (OK/QUEBRADO com motivo; orienta levar o quebrado ao chat).
  **[3]** `analisar agente` = radiografia determinística completa do agente.py: linhas, funções
  de topo, com/sem docstring, nomes duplicados, ferramentas registradas, camadas r2x presentes,
  esqueletos e telemetria acumulada — 100% AST, zero alteração. Loader extrai `_r32_`. Selo
  `-r32`. Não testado no Windows real.
- **r33 (GESTÃO da memória de longo prazo — correção honesta: o motor JÁ EXISTIA):** auditoria
  prévia pegou que o agente já tem memória longa com embeddings (`memoria_longa.json`, cap 500,
  `buscar_memorias_relevantes` com fallback difflib) e memória central de fatos
  (`gravar/consultar_memoria_core`) — uma proposta de "criar memória" teria sido DUPLICATA.
  O que faltava era controle do usuário: **`gravar memoria: <fato>`** (chama o motor existente
  `registrar_memoria_longa`), **`ver memorias`** (últimas 10 com data/tags), **`buscar memoria:
  <termo>`** (busca determinística em texto+tags) e **`esquecer: <termo>`** (direito de
  esquecer: remove o que contém o termo, exige SIM, atualiza global + arquivo). Lição
  registrada: auditar ANTES vale inclusive contra as próprias ideias de melhoria. Loader
  extrai `_r33_`. Selo `-r33`. Não testado no Windows real.
- **r34 (ESQUELETOS FUNCIONAIS — a ideia já nasce RODANDO):** fecha a lacuna "template não
  roda". `_r34_padrao_funcional` reconhece 4 padrões de ideia (conversor, validador,
  gerador/sorteador, contador/medidor) e o esqueleto nasce com CORPO MVP QUE FUNCIONA
  (ex.: conversor "10 metro para centimetro" -> 1000.0), com o ponto de edição marcado
  (CONVERSOES/REGRA/PECAS/métrica). Sem padrão conhecido: template honesto com
  NotImplementedError (como antes). **`_r34_gerar_teste`** gera junto um teste de amostra
  (esqueletos_ideias/testes/test_<nome>.py, unittest que importa o esqueleto pelo caminho —
  casos específicos por padrão; genérico = NotImplementedError). `conferir esqueletos`
  agora valida também a pasta testes/ (sintaxe). Catálogo (#N) enriquece o cabeçalho do MVP
  também; resumo fala "registrada no esqueleto". Os MVPs são execução APENAS nos testes do
  repositório (corpo controlado); o agente continua não executando código gerado — parse
  somente. Loader extrai `_r34_`. Selo `-r34`. Não testado no Windows real.
- **r35 (mais padrões MVP — 4 → 8 categorias que nascem RODANDO):** `_r34_padrao_funcional`
  ganhou, ANTES do conversor genérico (prioridade correta): **conversor de temperatura**
  (celsius/fahrenheit/kelvin por fórmula; dispara em "temperatura/celsius/fahrenheit/kelvin"),
  **somador de durações** (HH:MM ou HH:MM:SS → total; precisa "horas/duração" + "soma/total"),
  **comparador de textos** (só-A/só-B/comuns por linha; ignora "json"), **divisor de texto em
  partes** (2–20 pedaços de tamanho quase igual). `_r34_gerar_teste` ganhou os 4 casos novos
  (assertions por padrão + caminho inválido). Menu r35; selo `-r35`. MVPs executados só nos
  testes do repositório; agente segue parse-only. Validado parcialmente no Windows real (relato r34).
- **r36 (CORREÇÃO do primeiro relato real de validação — r34 no PC):** o usuário pediu 50+
  ideias em conversa livre; o GGUF pequeno falhou em produzir o JSON de 5 propostas (0/5
  descartadas) e o fallback honesto não ajudava o suficiente (não citava a fábrica).
  Correções: **[1]** campos beneficio/risco/teste viram OPCIONAIS — só titulo+justificativa+
  refs obrigatórios; faltantes viram "- (nao avaliado pelo modelo local)" com marcador
  "[parcial: modelo nao avaliou risco/teste]" e contagem no rodapé (aumenta muito a taxa de
  sucesso do modelo pequeno sem esconder a lacuna); **[2]** parse-fail e "nenhuma validada"
  agora apontam `fabrica de ideias` e `esqueleto de ideia:` (caminhos que NÃO dependem do
  modelo); **[3]** recorte de evidências 6 → 8 (teste antigo atualizado junto — mudança
  intencional). Comportamento HONESTO do r34 no PC confirmou o desenho: 0/5 declarado,
  nada mascarado. Selo `-r36`. Testado parcialmente no Windows real (o relato que motivou
  esta correção).
- **r37 (referências em níveis — correção do SEGUNDO relato real, r36 no PC):** o r36 vivou
  (selo/recorte 8/fallback ok) mas o 0/5 persistiu: o JSON parseava e morria na exigência de
  `funcoes` com nomes exatos das evidências (modelo pequeno não cita referências exatas).
  Contrato atualizado: **[1]** citação falsa (`funcoes` inválidas) NUNCA é exibida como
  verificada — os nomes inventados somem; **[2]** o PROGRAMA tenta auto-verificar: varre o
  texto (título+justificativa) por nomes reais do inventário (norm ≥6 chars, até 3) e marca
  "[referencia auto-verificada no codigo]"; **[3]** sem nenhuma: entra como "[parcial: sem
  referencia verificada no codigo]" com rodapé orientando conferir duplicatas. Título+
  justificativa continuam obrigatórios. Teste antigo do contrato atualizado
  (test_citacao_falsa...: descarte → marcação, espírito preservado). Selo `-r37`. Testado
  parcialmente no Windows real (relatos r34/r36 do usuário; r37 aguarda terceiro relato).
- **r38 (degradação com CONTEÚDO — correção do TERCEIRO relato real, r37 no PC):** desta vez
  o modelo nem produziu JSON (flakiness crua do GGUF pequeno; na rodada anterior produziu —
  mesmo prompt, variância). O r37 viveu (selo + fallback citando fábrica), mas a resposta de
  falha virava só desculpa. Agora: **[1]** RESGATE — se o modelo embrulhar o JSON em prosa,
  o programa extrai o primeiro {...} ao último e tenta parsear (converte muitas falhas em
  sucesso); **[2]** se falhar mesmo, a resposta inclui até 3 ideias REAIS do catálogo
  (`_r38_tres_do_catalogo`: priorizadas pelo uso, filtradas por rejeitadas, anti-colisão
  contra as 589) rotuladas "definidas no programa, nao pela IA" — o usuário sai com conteúdo
  em vez de desculpa; **[3]** roteiro alternativo mantido. Loader extrai `_r38_`. Selo `-r38`.
  Testado parcialmente no Windows real (relatos r34/r36/r37; r38 aguarda quarto relato).
- **r39 (nota de âncora única — polimento do QUARTO relato real, o 5/5):** o quarto relato
  VALIDOU o ciclo (5/5 válidas, 0 descartadas, aviso de sobreposição funcionando). Padrão
  observado: todas as 5 sugestões citaram a MESMA única referência (`_inventario_para_ideias`)
  — o modelo ancorou tudo numa função só. Novo marcador de honestidade no resumo: se todos os
  itens aceitos compartilham a mesma ref única nomeada, avisa "ATENCAO r39: ... leia com
  redobrada atencao e compare com o que ja existe". Parciais vazios não disparam (têm rodapé
  próprio). Selo `-r39`. **CICLO DE VALIDAÇÃO REAL CONCLUÍDO: r34→r39, quatro relatos, quatro
  iterações, taxa 0/5 → 5/5 com honestidade preservada em todas as etapas.**
- **r40 (0/5 por repetição = filtro VENCENDO, mas agora com conteúdo — QUINTO relato real,
  r39 no PC):** o usuário repetiu o MESMO pedido da rodada anterior; o modelo gerou temas
  parecidos e o filtro de histórico bloqueou 5/5 ("Titulos repetidos...: 5") — a garantia
  anti-repetição funcionou em PRODUÇÃO, mas a resposta virava só "nenhuma validada".
  Agora, quando aceitos==0 e houve repetições: mostra "O filtro anti-repeticao BLOQUEOU N
  ideia(s)... sinal de que ele funciona" + até 3 títulos repetidos como prova + orientação
  de variar tema ("3 ideias sobre X") + o bloco de 3 ideias do catálogo (helper novo
  `_r40_bloco_catalogo_fallback`, reusado pelo parse-fail do r38, evitando duplicação).
  Selo `-r40`. Testado parcialmente no Windows real (quinto relato; r40 aguarda reteste).
- **r41 (roteamento de ideias sem depender de UMA palavra + fábrica com quantidade — SEXTO
  relato real, r40 no PC):** o relato mostrou 3 caminhos: "Olá" → conversa ok; **"...que
  ainda vc não OBTEM"** ESCAPOU pro chat livre (só "não TEM" roteava!) e devolveu ideias
  fluffy sem verificação; **"me de 50 ideias"** foi pro manipulador genérico de listas
  (dedup -36 ✓, aviso de completude ✓, mas sem ligação com catálogo/fábrica). Correções:
  **[1]** gatilhos: `naoobtem` entra na lista de ausência e `pratemelhorar` na de
  "próprio" — frases equivalentes agora caem no pipeline fundamentado; **[2]** o aviso de
  completude das listas agora aponta `fabrica de ideias`; **[3]** `fabrica de ideias: N`
  (ou "fabrica de ideias N") com N 3–20 (clamp interno; padrão 8) — para pedir volume
  auditado de uma vez. Selo `-r41`. Testado parcialmente no Windows real (sexto relato;
  r41 aguarda sétimo reteste).
- **r42 (LOTE 5 + turbo):** +30 ferramentas (**589 → 619**; itens 91–126 do catálogo).
  **Datas:** próximo dia útil (pula fds + feriados fixos), contagem regressiva anual, próximo
  feriado (**Páscoa por Gauss**: carnaval/Paixão/Corpus Christi inclusos), parse flexível de
  texto→ISO, dias úteis do mês, fusos do Brasil. **Documentos BR:** DDD estático, placa
  antiga+Mercosul, PIS e título de eleitor (dígito), Luhn+bandeira com AVISO de privacidade,
  máscaras extras, UF, CNPJ matriz/filial, categorias de CNH. **Referências:** moedas ISO (SEM
  cotação), alfabeto grego, capitais com filtro. **Arquivos (leitura somente):** contagem,
  magic bytes, nome seguro Windows, tamanho por padrão, faixas, linhas mais longas, palavras
  frequentes, amostra aleatória, pontas, encoding/BOM, CSV no console, sugestão de renomeação
  em lote (NÃO renomeia). **`turbo ia local`**: alterna `ia_local_opcoes.turbo` — teto de 300
  tokens nas gerações NORMAIS (formato_json/ideias intocados): menos espera real, respostas
  mais curtas; inteligência do modelo não muda. Auditoria 619/0 duplicatas; catálogo
  reconciliado (30 checks; **80 propostas restantes** = 619+80=699). Selo `-r42`. Não testado
  no Windows real.
- **r43 (LOTE 6 FINAL + modo instantaneo + cerebro — pedido "melhorias muito
  melhoradas, respostas instantaneas, cerebro no nivel extremo"; usuario escolheu
  lote COMPLETO e manteve o GGUF atual):** +80 ferramentas (**619 → 699**; itens
  127–219 — **catalogo ESGOTADO: 219/219 itens implementados, 0 propostas**).
  **A console/dev/texto (14):** portas conhecidas, tempo de download, classes de IP,
  tabela de JSON, barras ASCII, histograma, barra de progresso, arvore de caminhos,
  sparkline, diff caractere a caractere, decimais PT/EN, chave:valor → JSON,
  minutos/HM, consolidar listas de compras. **B casa/cotidiano BR (14):** medidas
  culinarias + forno/gas, xicara → gramas, dividir conta com gorjeta, cafeina
  (meia-vida), tinta, combustivel, churrasco, festa, pizza, gelo, diluicao de
  limpeza, arroz, ponto da carne, cronograma de limpeza. **C saude/sorteios (13):**
  TMB Mifflin, gordura Navy, FC maxima/zonas Karvonen, proteina g/kg, macros, dado
  de RPG com descarte, amigo secreto sem autopar, cor com contraste WCAG, bingo,
  Lotofacil/Mega-Sena (honestos: mesma chance), baralho de 52 com ranking, times.
  **D seguranca/geo/ciencia (14):** inventario de ferramentas em TXT (so nomes,
  sem segredos), PIN, passphrase diceware PT (152 palavras, entropia real),
  checar reuso de senha (NUNCA ecoa), forca por entropia, **TOTP RFC 6238
  (teste com o vetor oficial: 94287082)**, Haversine, rumo/cardinal (16 setores),
  fase da lua (aproximada), planetas, coordenada decimal/GMS, **118 elementos**,
  massa molar simples, decada/seculo. **E sistema/rede/midia (25):** fontes,
  pastas especiais, versao PowerShell/Windows (so leitura), fuso IANA, erros
  Windows, atalhos, where, variaveis de ambiente (segredos OCULTOS), politica de
  execucao, WAV, EXIF (PIL opcional, honesto), dimensoes por magic bytes,
  exercicios de matematica com gabarito, pH, diluicao C1V1C2V2, MAC → fabricante
  (tabela parcial, sem inventar), aspecto, PPI, idade de cachorro, tamanhos
  roupa/calcado, faixas de internet, **MB vs Mb**, bateria, bitrate, tipografia.
  **Modo instantaneo:** `instantaneo ia local` alterna `ia_local_opcoes.instantaneo`
  — teto de **180 tokens** nas geracoes normais em escada com o turbo (instantaneo
  180 > turbo 300 > padrao; `formato_json` intocado); persiste em config; o modelo
  GGUF NAO muda e o aviso diz isso. **Cerebro (programa, honesto):**
  `estatisticas cerebro` (geracoes neurais vs cache vs uso de ferramentas, tempo
  medio, "o GGUF e o mesmo de sempre"); ate 2 memorias relevantes injetadas como
  evidencia no prompt de conversa (try/except — falha de memoria nunca derruba a
  geracao); a fabrica de ideias agora DISTINGUE "catalogo COMPLETO (r43)" de
  "arquivo ausente" (nao mente mais quando o catalogo esgota) e o texto "549"
  defasado saiu da saida. **467 testes OK** (+52); auditoria 699/0 duplicatas;
  catálogo reconciliado; `consultar_porta_conhecida` levanta erro para porta <= 0;
  selo `-r43`. Não testado no Windows real.
- **r44 (ARRANQUE INSTANTANEO — pedido "duplo clique carregar instantaneamente,
  sem a demora"):** nenhuma ferramenta nova (699 mantidas; nada na lista). Os viloes
  do duplo clique eram 3: **[1]** o BAT baixava a atualizacao TODA abertura (2
  PowerShell + ~1,5 MB + py_compile + hash) — agora o carimbo `.ultima_verificacao`
  vale **12 horas** (dentro do prazo abre direto, sem rede; falha de internet NAO
  grava carimbo e tenta de novo na proxima abertura; **`iniciar.bat atualizar`**
  forca na hora; o UAC repassa o argumento via `-ArgumentList '%*'`; SEM_ATUALIZAR.txt
  continua mandando); **[2]** `python -c "import langchain_openai"` IMPORTAVA a
  biblioteca pesada so para ver se existe — agora `find_spec` (milissegundos), idem
  Gemini; **[3]** o agente importava pywhatkit (que arrasta OpenCV), pandas e a
  classe do Gemini no arranque — agora sao **imports tardios** (`_r44_gemini_classe`
  com cache de falha e aviso unico; pywhatkit/pandas dentro das funcoes que usam).
  O motor GGUF JA subia em segundo plano (thread daemon) e segue igual. Toda a
  protecao preservada (copias/admin/backup/py_compile/hash/autoatualizacao do BAT
  na ultima linha/URLs). **477 testes OK** (+10: texto do BAT, AST do agente, lazy
  do Gemini). Selo `-r44`. Não testado no Windows real.
- **r45 (ARRANQUE MAIS RAPIDO AINDA — usuario relatou que r44 ainda demorava):**
  nenhuma ferramenta nova (699 mantidas). Segunda passada nos viloes: **[1]** o BAT
  ainda rodava PowerShell so para checar o prazo do carimbo + DOIS python de
  find_spec — agora **UMA unica chamada de Python** decide prazo+libs (codigos de
  saida 0-3; rotulos :decisao_rapida e :instalar_libs; normal = 1 python de
  milissegundos); **[2]** o agente ainda importava no arranque: **pyautogui**
  (puxa pygetwindow/pyscreeze; 17 usos agora via `_r45_pyautogui()`), **pypdf**
  (4 imports locais nos sites que usam) e **`from langchain.agents import
  create_agent`** (importava o pacote langchain INTEIRO para um recurso que so o
  caminho da NUVEM usa — agora o import e DENTRO de `_pegar_agente`); **[3]** o
  modelo de embeddings do Gemini era montado no nivel do modulo quando existia
  chave — agora `_r45_embeddings_model()` importa/monta so na primeira memoria
  (cache de falha + aviso unico; sem chave/biblioteca cai para difflib como antes).
  langchain_core permanece no arranque (decorador @tool das 699). Dica nova no
  proprio BAT: atalho com "Executar como administrador" pula o PowerShell
  intermediario do UAC. **488 testes OK** (+11: BAT em 1 chamada, AST do topo,
  comportamento dos 2 accessors). Selo `-r45`. Não testado no Windows real.
- **r46 (INSTANTANEO DE VERDADE — "vamos deixar instantaneamente rapido", 3a
  rodada de arranque):** nenhuma ferramenta nova (699 mantidas). Achado com
  MEDICAO: o CPython NAO cria cache de bytecode para script rodado direto —
  `python agente.py` RECOMPILAVA o arquivo de 1,5 MB a cada duplo clique
  (~0,3 s medidos no sandbox; no PC pode custar mais). Correcao: lancador
  miudo **`main.py`** (`import agente`) — importar como modulo ativa o
  `__pycache__`: a 1a abertura apos cada atualizacao compila uma vez e as
  seguintes carregam o bytecode pronto. O BAT agora roda `python main.py`
  (compativel nos dois sentidos: o BAT velho com agente novo funciona; o
  agente so muda de porta de entrada). `import agente` roda EXATAMENTE o
  mesmo programa (loop de conversa comprovadamente no nivel do modulo —
  teste AST). __pycache__ fora do Git (.gitignore). Resto honesto: interpreter
  Python + import do langchain_core (decorador @tool das 699) + decoracao das
  ferramentas + UAC do Windows. **493 testes OK** (+5). Selo `-r46`. Não
  testado no Windows real.
- **r47 (INSTANTANEO PARTE 2 — a "cirurgia grande", pedido reforcado de rapidez):**
  nenhuma ferramenta nova (699 mantidas). Medicao no sandbox: `from
  langchain_core.tools import tool` custava **~0,48 s** + decorar ~479 ferramentas
  **~0,75 s** = **~1,2 s que TODO duplo clique pagava, mesmo no modo 100% local**.
  Mudancas: **[1]** `@tool` virou STUB custo-zero (marca `fn._r47_tool` e devolve a
  funcao crua; as ~479 linhas @tool nao mudaram); **[2]** `_garantir_tools(fabrica=None)`
  materializa a lista global `tools` UMA vez (importa langchain_core ali dentro;
  entradas sem marca — helpers internos — ficam como estao; idempotente; falha de
  import devolve a lista crua em vez de derrubar); **[3]** os **12 leitores** de
  `tools` mapeados por AST (listar_ferramentas, _painel_status, abrir_painel_web,
  _indice_ferramentas, _resposta_identidade, estatisticas_uso, agente_opinioes,
  estatisticas_poder, resumo_ferramentas_por_tema, achar_ferramenta_para_tarefa,
  _selecionar_ferramentas, _pegar_agente) materializam antes da 1a leitura — rotas
  deterministicas (oi/atalhos/GGUF) NUNCA materializam; **[4]** greeting de voz do
  boot virou thread daemon (pyttsx3 fora do caminho critico). Custo MOVIDO, nao
  sumido: a 1a mensagem que precisa da lista (nuvem, listagem, contador) paga ~1,2 s
  uma unica vez na sessao. **501 testes OK** (+8). Selo `-r47`. Não testado no
  Windows real.
- **r48 (RESPOSTA DA IA LOCAL MAIS RAPIDA — "super rapida em respostas seja o
  que for"):** nenhuma ferramenta nova (699 mantidas). Duas alavancas de tempo
  de resposta: **[1]** **STREAMING LIGADO POR PADRAO** — a infraestrutura ja
  existia (`stream=streaming` em `perguntar_ia_local`, callback imprimindo
  trechos, "[Previa da geracao; texto ainda nao verificado]" + "[Fim da previa]"
  + resposta final verificada abaixo, cancelamento r21 e timeout funcionando no
  stream) mas o default `'streaming':False` fazia o usuario esperar a geracao
  INTEIRA sem ver nada; agora o default e `True` (a resposta comeca a aparecer
  em segundos mesmo antes de terminar; previa rotulada como nao verificada,
  final verificado embaixo — honestidade intacta); **[2]** **THREADS
  AUTOMATICAS** pelo CPU: o fixo `threads:4` desperdicava nucleos no
  processamento do prompt — agora o padrao e `max(4, min(nucleos-2, 8))`
  (clamp pelo total logico; config explicita do usuario continua vencendo,
  type-checked, tipo errado ignorado). Previa rotulada evita parecer resposta
  final; JSON/ideias intocados; cache r24 e cap instantaneo/turbo seguem.
  **508 testes OK** (+7). Selo `-r48`. Não testado no Windows real.
- **r49 (BAT AINDA MAIS RAPIDO + CORRECAO DE ENTREGA do main.py — usuario pediu
  "iniciar.bat ainda mais rapido" e perguntou se eu edito so o agente.py ou todos
  os arquivos):** nenhuma ferramenta nova (699 mantidas). **[1]** O caminho comum
  agora roda **UM python so**: a decisao (carimbo 12h + bibliotecas via find_spec)
  mudou para DENTRO do `main.py`, que sai com codigo 7 (verificar) ou 8 (instalar
  libs) so quando precisa — o BAT trata os codigos e recomeca uma vez; o python
  auxiliar de decisao saiu do duplo clique. **[2]** BURACO FECHADO: o atualizador
  so baixava agente.py e iniciar.bat — o **main.py (r46) nunca foi entregue ao
  PC**; se o BAT novo rodasse antes do main.py existir, `python main.py` falharia.
  Agora: a verificacao baixa o main.py JUNTO (+ checagem de tamanho) e existe o
  fallback `if not exist "main.py" goto lancar_antigo` → `python agente.py`
  (funciona sempre; à prova de tijolo). **[3]** Selo `-r49` para o usuario
  confirmar no banner (o BAT novo e o main.py chegam na primeira verificacao;
  o BAT novo se aplica ao fechar). **516 testes OK** (+15). Não testado no
  Windows real.
- **r50 — Autoatualização pela CONVERSA (`atualizar agora`)**: o mesmo esquema
  oficial do iniciar.bat agora roda de dentro da conversa, sem o usuário fechar
  nada. `_r50_atualizar_agente(downloader, confirmar, reiniciar, origem, backup)`
  (tudo injetável p/ testes): `pedir_confirmacao` → baixa `URL_AGENTE_OFICIAL`
  com cache-buster (`?cache=%d`, `random.randint`) → valida (≥50000 caracteres +
  `compile()`/py_compile) → compara com o conteúdo atual (igual ⇒ "nada trocado")
  → backup em `agente_backup.py` → troca → relança com
  `subprocess.Popen([sys.executable, origem])` e `os._exit(0)` (conversa fica
  salva no JSON; usuário não fecha/reabre nada). `SEM_ATUALIZAR.txt` bloqueia
  tudo; download pequeno, fonte que não compila ou rede falha ⇒ NADA é trocado
  (à prova de tijolo, honesto). `_r50_comandos` aceita "atualizar agora",
  "atualizar agente" e "atualizar" (exato), wired ANTES de `_r43_comandos` na
  cadeia; nova linha no menu perto de VELOCIDADE. `_r50_caminhos_agente()` deriva
  origem/backup de `__file__`. **[1]** Sem novas ferramentas (699 mantidas).
  **[2]** O BAT continua sendo o caminho principal; o comando da conversa é o
  atalho sob demanda. **[3]** Selo `-r50` para o usuário confirmar no banner.
  **526 testes OK** (+10: test_autoatualizacao_r50.py — bloqueio SEM_ATUALIZAR,
  cancela ANTES de baixar, download pequeno aborta, fonte que não compila
  rejeitado, conteúdo igual não reinicia, sucesso faz backup+troca+reinicia,
  bytes aceitos, rota/menu/cadeia, caminhos derivados de __file__).
  Não testado no Windows real.
- **r51 — LOTE EXTREMO: 2 melhorias profundas na IA LOCAL + 4 ferramentas novas
  (699 → 703)**: GGUF MANTIDO. **[IA LOCAL 1 — AUTO-CONTINUAÇÃO]** quando a
  resposta local é cortada por limite de tokens (`finish_reason == 'length'`),
  `perguntar_ia_local` CONTINUA de onde parou (até 2 rodadas, contexto com o
  parcial como assistant + "Continue EXATAMENTE de onde parou") e junta tudo;
  o aviso de corte só aparece se AINDA cortar; config `auto_continuar: false`
  volta ao antigo; listas numeradas ficam de fora. **[IA LOCAL 2 — MODELO SEMPRE
  QUENTE]** `_r51_manter_quente` aquece o GGUF na subida (1ª resposta rápida) e
  pinga 1 token a cada 240 s (llama-server descarrega o modelo após ~5 min de
  ociosidade — a causa da "primeira resposta lenta" recorrente); agendado 1×
  nos dois retornos de sucesso de `_iniciar_servidor_ia_local` (flag
  `_r51_quente_agendada`, liberada após 3 pings falhos); config
  `manter_quente: false` desliga. **[FERRAMENTAS]** `gravar_tela_gif`
  (iniciar/parar/status, pasta prints), `baixar_video` (yt-dlp via
  `python -m yt_dlp`; NÃO instala nada sozinho), `marca_dagua` (sufixo `_marca`,
  originais intactos), `criptografar_arquivo` (DPAPI via ctypes; nunca apaga o
  original). **545 testes OK** (+19: test_lote_extremo_r51.py; auditoria
  699 → 703). Selo `-r51`. Não testado no Windows real.
- **r52 — LOTE PODER: +30 ferramentas inteligentes e ajudantes do próprio agente
  (703 → 733)**: GGUF e as 703 antigas intocados. **[PLANEJAMENTO/AJUDANTES]**
  `plano_de_tarefa` (checklist com dependências), `estimar_tarefa` (PERT
  (o+4m+p)/6 + incerteza + término em dias úteis + custo),
  `avaliar_risco_comando` (CRITICO/ALTO/MEDIO/BAIXO com motivos; NUNCA executa),
  `sugerir_commit` (tipo test/docs/feat/fix/chore pela composição do diff; só
  sugere), `explicar_regex` (valida e explica token a token),
  `mapa_de_ideias` (mindmap Mermaid), `diagrama_mermaid_codigo` (AST).
  **[ARQUIVOS/DADOS]** `timeline_do_dia`, `limpar_metadata_imagem` (JPEG APP1 /
  PNG chunks por cirurgia de bytes; cópia `_limpa`), `imagens_para_pdf`,
  `gerar_favicon`, `padronizar_series` (SxxExx), `catalogar_pdfs` (pypdf),
  `csv_para_sqlite`, `backup_diferencial_de_pasta` (hash + inventário),
  `organizar_imports_python` (AST, stdlib primeiro, backup `.organizado.bak`),
  `analisador_de_logs` (padrões mascarando números + hora pico).
  **[MONITORAMENTO]** `guardiao_de_arquivo` (thread versiona em
  PASTA_BASE/guardiao), `prever_espaco_disco` (baseline + extrapolação),
  `vigia_de_preco` (R$ na página + histórico). **[CONTEÚDO/WEB]** `leitor_rss`,
  `gerar_flashcards` (CSV utf-8-sig), `cofre_de_notas` (DPAPI, reusa helpers
  r51), `compartilhar_arquivo_qr` (http.server com `directory=` + QR),
  `doc_para_pdf` (Word COM lazy; não instala nada), `minificar_js_css`
  (preserva `://`), `auditar_acessibilidade_html`, `auditar_seo_html`,
  `gerar_sitemap`. Anti-duplicidade: candidatas descartadas por já existirem
  (leitor EXIF, feriados BR, changelog esqueleto, licença MIT/ISC, explicador
  cron, códigos de erro 0x, vigia de pasta). Nota: regras de risco/tokens de
  regex ficam DENTRO das funções (o loader só extrai `def`).
  **578 testes OK** (+33: test_lote_poder_r52.py + test_lote_poder_r52b.py;
  2 skips condicionais de PIL/pypdf; auditoria 703 → 733). Selo `-r52`. Não
  testado no Windows real.
- **r53 — COMANDO DIRETO DE ATALHO (fechando o buraco de roteamento relatado no
  PC)**: o usuário digitou "crie um atalho pra abrir isso rapido" e o seletor de
  ferramentas ofereceu itens sem relação (a ferramenta certa,
  `criar_atalho_area_trabalho`, SEMPRE existiu — o "isso" vago não a encontrou).
  Agora `_r53_comandos` roda na cadeia ANTES do seletor: **`atalho do agente`**
  / "crie um atalho pra abrir isso" cria o ícone "Super Agente" na Área de
  Trabalho apontando para o `iniciar.bat` (ou `agente.py`), REUSANDO a
  ferramenta antiga (zero duplicação) e avisando como pedir de outros programas;
  **`atalho para <programa>`** resolve apelidos conhecidos (`chrome`, `edge`,
  `firefox`, `bloco de notas`, `calculadora`, `explorador`, `cmd`, `powershell`,
  `vscode`) para o .exe real (checa os caminhos padrão do Windows) e passa
  caminhos crus direto. Pronomes ambíguos ("isso", "isto", "ele") = o agente.
  Nota técnica importante: `_norm_pt` REMOVE TODOS OS ESPAÇOS (rotas exatas) —
  o parser r53 usa `_r53_normalizar` próprio (minúsculas sem acento COM
  espaços) para extrair o alvo. Não captura "remover atalho"/"onde fica o
  atalho" (só pedidos de criação). **588 testes OK** (+10:
  test_atalho_rapido_r53.py; 733 ferramentas mantidas — nenhum @tool novo).
  Selo `-r53`. Não testado no Windows real.
- **r54 — ATALHO: pedido vago PERGUNTA; raiz principal do PC (relato real)**: o
  usuário digitou "criar atalho" (sem alvo) e o agente ASSUMIU o atalho do
  próprio agente — mas ele queria um atalho para a RAIZ principal (C:\).
  Correções: **[1]** "criar atalho" SEM alvo e SEM palavras de contexto agora
  PERGUNTA (imprime as 3 formas: atalho do agente / atalho para este pc /
  atalho para \<programa ou pasta\>) e NÃO cria nada; pronomes ("isso", "de
  novo") e "agente" continuam criando o do agente direto. **[2]** Novos
  apelidos no `_r53_resolver_app`: este pc / meu computador / computador /
  raiz / raiz do pc / raiz principal / disco c / c / c: → atalho que abre
  `C:\`; default de existência mudou de `isfile` para `exists` (pastas valem).
  **[3]** Caminhos dos apelidos agora em backslash (PowerShell/WScript mais
  feliz) — expectativas r53 atualizadas junto. **594 testes OK** (+6:
  test_atalho_raiz_r54.py; 733 ferramentas mantidas). Selo `-r54`. Não
  testado no Windows real.
- **r55 — AUDITORIA COMPLETA DO CÓDIGO (pedido do usuário: "corrija tudo sem
  apagar nada, 100% funcionando")**: varredura AST de RESOLUÇÃO DE NOMES em
  TODAS as funções do agente.py (nomes usados × imports/globais/builtins/locais,
  incluindo nomes dinâmicos via `globals()['x']`). Resultado bruto: 197 alertas,
  dos quais 195 eram falsos positivos (funções aninhadas) e **2 eram FERRAMENTAS
  MORTAS DE VERDADE** — `agendar_desligamento` e `dias_uteis_entre_datas` usavam
  `timedelta` SEM import: toda chamada dava NameError (o self-healing mascarava
  como "erro genérico"; pior: no desligamento o `shutdown` rodava PRIMEIRO e o
  erro explodia DEPOIS). Corrigido com import LOCAL em cada uma (nada apagado).
  **[Facilitar]** o seletor de ferramentas (`_despachar_ferramenta_local`) passa
  a oferecer **5 candidatos (era 3)** — ferramentas mais fáceis de serem
  encontradas/oferecidas. **[Guarda permanente]** novo teste
  test_auditoria_nomes_r55.py roda a MESMA varredura de nomes em toda a suíte:
  se alguém criar função com nome inresolvível, os testes QUEBRAM na hora —
  nunca mais uma ferramenta morta escondida. **599 testes OK** (+5). 733
  ferramentas mantidas. Selo `-r55`. Não testado no Windows real.
- **r56 — ATALHO "NA TELA PRINCIPAL" (2º relato real da mesma família)**: o
  usuário escreveu "crie um atalho na tela principal" e caiu na pergunta do
  pedido vago — o parser só entendia "atalho para/pro/pra/do/da/de" (o "na/no"
  não era marcador) e "tela principal" não estava nos apelidos. Correções:
  **[1]** marcadores `atalho na ` / `atalho no ` adicionados; **[2]** novos
  apelidos no `_r53_resolver_app`: tela principal / tela do pc / tela do
  computador → `C:\` (no vocabulário do usuário, "tela/raiz principal" = raiz
  do PC); desktop / area de trabalho → pasta Desktop do usuário
  (expanduser); **[3]** alvo desconhecido que NÃO parece caminho (sem `/`,
  `\` ou extensão conhecida — novo `_r53_parece_caminho`) agora PERGUNTA em
  vez de criar um .lnk quebrado; caminhos crus continuam passando direto
  (minúsculos pelo normalizador — case-insensitive no Windows).
  **604 testes OK** (+5: test_atalho_tela_r56.py; 733 ferramentas mantidas).
  Selo `-r56`. Não testado no Windows real.
- **r57 — ESCUDO DE ARRANQUE (relato crítico: "iniciar.bat entra e sai")**: o
  PC do usuário ficou com o agente que não abre — sintoma de agente.py
  corrompido no disco (escrita interrompida) e o BAT r49 NÃO tentava reparo
  nenhum em crash com código 1 (ia direto para "encerrado"; o reparo só
  existia para os códigos 7/8). Dois furos fechados: **[main.py]** nova
  `_agente_integro()` confere se o agente.py COMPILA antes de importar
  (corrompido ⇒ mensagem clara + `sys.exit(7)` ⇒ o BAT baixa a versão oficial
  e recomeça SOZINHO); `import agente` continua sendo a última instrução do
  módulo (guarda r49 intacta). **[iniciar.bat]** novo fluxo `:quebrou`:
  qualquer saída com erro (código 1, nos dois caminhos `:lancar` e
  `:lancar_antigo`) tenta **1 reparo automático** (re-download oficial via
  `:verificar_agora`, controlado pela flag `.reparo_r57`); se o erro voltar,
  a janela **FICA ABERTA** com "ME MANDE UM PRINT" + pause — nunca mais
  "entra e sai" sem explicação. A flag é limpa no encerramento normal e no
  segundo erro. Estrutura r49 preservada (1× `python main.py`, códigos
  7/8/verificar_bat, fallback, auto-aplicação do BAT). **610 testes OK**
  (+6: test_escudo_arranque_r57.py — inclui executar `_agente_integro` real
  contra arquivo bom/quebrado/inexistente). 733 ferramentas mantidas.
  Selo `-r57`. Não testado no Windows real.
- **r58 — ELEVATE COM %* VAZIO (resgate do PC, parte 2)**: com o iniciar.bat
  rebaixado, o duplo clique revelou o próximo elo quebrado: o pedido de
  administrador fazia `Start-Process -ArgumentList '%*'` e, SEM argumentos,
  o PowerShell REJEITA `-ArgumentList ''` (validação de nulo/vazio) — a
  janela morria antes do UAC. Fix: `if "%~1"==""` → Start-Process SEM
  ArgumentList; com argumentos, segue `-ArgumentList '%*'` (teste r45
  preservado). Escudo r57 intacto (`:quebrou` 2×, `.reparo_r57`,
  `python main.py` 1×). Contexto do resgate: iniciar.bat tinha SUMIDO da
  pasta do PC (suspeita: quarentena do antivírus ou move da auto-aplicação);
  agente.py foi rebaixado manual com sucesso. **614 testes OK** (+4:
  test_elevate_r58.py). Selo `-r58`. Não testado no Windows real.
- **r59 — CORREÇÃO DA CORREÇÃO: REM com parênteses dentro de bloco (resgate,
  parte 3)**: o fix r58 NÃO resolveu no PC real — o usuário rebaixou o BAT e o
  erro `-ArgumentList ''` PERSISTIU. Causa raiz no meu próprio patch: dentro
  do bloco `if errorlevel 1 ( ... )`, um REM com parênteses (e um lixo
  `%%20morre...`); no cmd, o `)` do comentário FECHA O BLOCO antes da hora —
  a linha com `-ArgumentList '%*'` executou com `%*` vazio do mesmo jeito.
  Lição: REM dentro de bloco é mina de quartzo. A r59 reescreveu a seção de
  admin SEM NENHUM BLOCO: `net session` → falhou ⇒ `goto pedir_admin` ⇒
  `set "R58_ARGS="` + `if not "%~1"=="" set "R58_ARGS=-ArgumentList '%*'"`
  (if de UMA linha) ⇒ `Start-Process -FilePath '%~f0' %R58_ARGS% -Verb RunAs`
  ⇒ `exit /b` ⇒ `:ja_admin`. Guardas novos: sem `) else (` na seção, sem
  `%%20`, sem linha só de `(`/`)` fora de REM, `%R58_ARGS%` no Start-Process.
  **615 testes OK** (test_elevate_r58.py reescrito p/ r59). Selo `-r59`. Não
  testado no Windows real.
- **r59+ — RESGATE CONCLUÍDO NO PC + proteções novas + BAT em CRLF**: agente
  r57 NO AR via resgate manual (`type nul > .ultima_verificacao` +
  `python main.py`). O print revelou o estrago do evento de disco: IA LOCAL
  não detectada (motor/GGUF sumido → ramo de nuvem no banner),
  `nivel_permissao` resetado para 'padrao' (config.json recriado); rodizio de
  nuvem saudável (12 IAs — chaves setx sobreviveram). Surgiram na árvore duas
  proteções novas (autor provável: usuário via interface do GitHub):
  **.gitignore** (chaves.txt/.env/*.key/config.json/memórias/histórico —
  reforça a regra "credenciais fora do GitHub") e **.gitattributes com
  `*.bat -text`** (impede normalização de fim de linha em BAT). Aproveitando:
  iniciar.bat convertido para **CRLF canônico** (com `-text` o git preserva
  byte a byte; raw URLs passam a servir o BAT com CRLF — LF em BAT é
  instável no cmd com blocos/labels, possivelmente ligado às bizarrices do
  resgate). **615 testes OK** (leitura de teste usa newlines universais;
  CRLF não afeta). Não testado no Windows real.
- **r60 — NUNCA MAIS "PISCA E SOME" + mistério da pasta real**: o usuário
  revelou que a pasta do agente é uma SUBPASTA `agente_pc` (não
  C:\Users\gfmag) — todo o resgate anterior foi para a pasta errada
  (assunção minha), o que explica o agente aberto com 'padrao' (config novo)
  e sem IA local (GGUF mora na pasta certa); o iniciar.bat DE agente_pc
  continua antigo (com o bug de elevate r58-) → duplo clique = falha de admin
  silenciosa = janela pisca e some. Fix defensivo: em `:pedir_admin`,
  `if errorlevel 1 (` após o Start-Process → "FALHOU o pedido de
  Administrador" + `pause` — qualquer falha de elevação deixa o erro visível.
  Escudo do teste afiado: REM dentro da seção de admin não pode ter
  parêntese NENHUM (os da r59 reescritos); `) else (` banido na seção.
  **616 testes OK**. Selo `-r60`. Não testado no Windows real.
- **r61 — DIAGNÓSTICO REAL DO ARRANQUE (a pergunta que o modelo chutou)**: o
  usuário perguntou "porque o iniciar.bat não está funcionando?" e o GGUF
  respondeu com INVENÇÃO (renomear para .exe, System32...). Nova rota
  `_r61_comandos` ('diagnostico do iniciar', ou 'iniciar' + não
  funciona/abre/pisca/porque) → `_r61_diagnostico_iniciar`: FATOS do disco —
  iniciar.bat existe/tamanho ≥800/marcadores r59+ (pedir_admin+R58_ARGS) e
  r57+ (:quebrou)/CRLF canônico (crlf ≥50 e 0 LF solto); agente.py ≥50000 e
  COMPIla; main.py compila e tem _agente_integro; versão do selo extraída por
  regex (sem literal — a 1ª tentativa do patch quebrou o próprio selo-bump por
  duplicar o literal, e a GUARDA DE NOMES r55 pegou `re` sem import: dois
  sistemas de segurança trabalhando). Veredito com contagem de problemas +
  cura recomendada. **622 testes OK** (+6). Selo `-r61`. PROVADO no Windows real no PC do usuário: o
  diagnóstico leu a pasta `agente_pc` e apontou EXATAMENTE os 2 fatos (BAT
  com LF da cirurgia manual no Bloco de Notas + main.py nunca entregue pela
  r56) — zero chute.
- **r62 — 'ATUALIZAR AGORA' COMPLETO (a descoberta do usuário no resgate)**: a
  usuária(o) resolveu na mão (colou o BAT novo pelo Bloco de Notas) e apontou
  o buraco: eu atualizava o agente.py pela conversa mas NÃO o
  main.py/iniciar.bat — quando o BAT estava preso num bug antigo, nada se
  atualizava. Agora `_r62_comandos` ('atualizar agora' etc.) primeiro chama
  `_r62_entregar_lancador`: baixa main.py (valida ≥100 + compila; backup
  main_backup.py; troca DIRETA) e iniciar.bat (valida ≥800 + ':pedir_admin' +
  'R58_ARGS' + ':quebrou' + CRLF; grava em `_atualizacao_iniciar.tmp` para o
  PRÓPRIO BAT em execução se aplicar SOZINHO ao fechar); depois delega o
  agente.py à r50. Falha de rede/vistoria não troca nada. Único caso manual
  remanescente: BAT TOTALMENTE ausente. **629 testes OK** (+7:
  test_atualizar_tudo_r62.py). Selo `-r62`. **PROVADO no Windows real (e2e),
  RESGATE `agente_pc` ENCERRADO**: diagnóstico apontou os 2 problemas;
  'atualizar agora' (vindo do agente r56, sem a r62!) entregou main.py via
  update do próprio BAT + r62 entregou main.py/BAT pela conversa; o BAT
  aplicou-se SOZINHO ao fechar ("Lancador main.py em dia." é dele, linha
  102); diagnóstico final: **Total de problemas: 0** (CRLF OK, r59+ OK,
  escudo OK, main.py com integridade OK).
- **r63 — HISTÓRICO DO DEFENDER COM FATOS (a pergunta que caiu no agente)**: o
  usuário digitou "Histórico de proteção"/"Segurança do Windows" DENTRO do
  agente e o GGUF respondeu textão genérico de apostila (doença r61 de novo).
  `_r63_comandos` (frases com historicodeprotecao/historicododefender/
  historicodefender na normalização; 'defender' NUA fica com a rota de status
  antiga) → `_r63_defender_historico`: PowerShell `Get-MpThreatDetection`
  (top 10 por data; subprocess em lista, timeout 60s); vazio = "[OK] nenhuma
  detecção"; erro = ensina o caminho da janela (Iniciar > Segurança do Windows
  > Proteção contra vírus e ameaças > Histórico de proteção) + detalhe; com
  detecções = lista data|arquivo + aviso de que é HISTÓRICO. **635 testes OK**
  (+6: test_defender_r63.py). Selo `-r63`. **PROVADA e2e no Windows real:**
  respondeu com 3 detecções reais (OnlineFix64.dll / EOSSDK-Win64-Shipping.dll /
  winmm.dll de um jogo em Downloads, 29/08) — NADA do agente. VEREDITO DO
  INQUÉRITO: o Defender é INOCENTE quanto ao iniciar.bat que "sumiu"; o sumiço
  era a própria confusão da pasta velha (BAT quebrado piscava e fechava).
- **r64 — AUTO-DIAGNÓSTICO NA ABERTURA (r64 aprovada via ask_user: "Só a
  r64")**: a cura chegou antes da doença — toda abertura roda o exame r61 em
  silêncio (`_r64_aviso_de_boot`, gancho único logo após `_checar_iniciar_bat`
  e antes do loop de input). Tudo certo = não imprime NADA (filosofia r44 de
  arranque limpo/rápido); problema = bloqueio com cada [PROBLEMA] + cura
  ('atualizar agora' / 'diagnostico do iniciar') ANTES de o usuário esbarrar
  nele. À prova de falha: exceção do exame jamais derruba a abertura; sem
  rede; sem rota de conversa nova (o exame já tem o comando r61). **640
  testes OK** (+5: test_autodiagnostico_boot_r64.py). Selo `-r64`.
  **PROVADA e2e no Windows real:** cascata r63→r64 via 'atualizar agora' +
  abertura SAUDÁVEL em silêncio total (o exame rodou e nada falou — como
  desenhado); 3ª cascata seguida do usuário sem resgate manual.
- **r65 — GUARDA ANTI-INVENÇÃO (aprovada via ask_user: "Guarda anti-invenção",
  a recomendada)**: perguntas de FALHA sobre a casa ("o agente não abre/liga/
  responde", "o iniciar ta quebrado", "main.py não funciona") que NÃO caem nas
  rotas de fatos (r61 vem primeiro na cadeia; r65 pega o que sobrou, antes da
  r53) NÃO chegam mais ao modelo bruto: `_r65_comandos` imprime o diagnóstico
  real do disco (chamando `_r61_diagnostico_iniciar` via globals) ou, na pior
  das hipóteses, honestidade ("Sobre ESTE PC eu respondo com FATOS, nunca com
  chute") + cura ('atualizar agora' / 'diagnostico do iniciar'). Gatilho =
  frase de falha (naofunciona/naoabre/naoinicia/naoliga/naoresponde/
  naoestafuncionando/estaquebrado/taquebrado/naoentra/naopassa) + palavra da
  casa (iniciar/iniciarbat/agente/agentepc/mainpy — 'bat' nu FORA: pegaria
  "bateria"). Conversa normal passa ilesa. **645 testes OK** (+5:
  test_guarda_anti_invencao_r65.py). Selo `-r65`. Não testado no Windows
  real.
- **r66 — GATILHO DE ATUALIZAR ENTENDE O LEIGO (bug do PC real)**: o usuário
  digitou "atualiza agora" (sem o r) no agente r64 e caiu NO MODELO BRUTO —
  o gatilho só aceitava "atualizaragora" exato. `_r62_comandos` e
  `_r50_comandos` agora usam a mesma tupla de variantes normalizadas
  (atualizaragora/atualizaagora/atualisaagora/atualisaragora/atualiseagora/
  atualizaroagente/atualizeoagente/atualizaragente/atualizagente/atualiza/
  atualizar/atualize); "atualizar o defender" etc. continuam com as rotas
  deles (tupla EXATA, sem startswith solto). +4 testes
  (test_gatilhos_atualizar_r66.py). **649 testes OK**. Selo `-r66`. Não
  testado no Windows real.
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

A meta de 700 ferramentas: r18 +14; r21 +1 (480); r22 +20 (500); r23 +49 (**549**). Restam
**151 propostas** mapeadas no `docs/CATALOGO_PROPOSTAS_FERRAMENTAS.md` (ajustáveis na
implementação). Não inflar
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
