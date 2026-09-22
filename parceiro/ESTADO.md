# Estado do projeto (memória viva do agente Arena)

## HOJE: B11 (porteiro) COMPLETO E VALIDADO NA MÁQUINA DELE ✅

- Demo end-to-end passou ao vivo (print 20/09 ~00:50): calibração silenciosa →
  "ainda em tolerancia" (segurou grito) → ao amadurecer: "chegou teste-do-porteiro.txt"
  → inventario + vigilia.log + enfileirou avisar → fila atendida NA MESMA RODADA
  (`vigia-005021.txt [FEITA]`, código 0) → Remove-Item do arquivo de teste.
- GitHub dele: HEAD `394b174` (push via salvar-tudo.bat) = 8 arquivos B11:
  loop v4 (818 linhas, 39 funções), regras v12 (bloco vigilia, tolerancia 30s),
  portao v6 (12 cenas [ok]), raio v3 (20 ok/0 problemas na máquina dele),
  tick.bat, verificar-tudo.bat, README atualizado, .gitignore atualizado.
- Raio-x na máquina dele: PLACAR 20 ok | 3 dicas | 0 avisos | 0 problemas.
- Detalhe cosmético ensinado: `â€”` no `type` = PowerShell 5.1 sem `-Encoding utf8`;
  arquivo íntegro; NÃO mexer nos fontes por causa disso.
- Oferecido (pendente decisão dele): `schtasks /Create /TN "SuperAgente Tick"
  /TR "C:\super-agente\tick.bat" /SC MINUTE /MO 15 /F` + leitura com
  `Get-Content memoria\vigia.log -Encoding utf8 -Tail 6` + delete do relógio.
- Meu repo: entregue em `.arena-delivery/` (HEAD d0cf141 = mesmo conteúdo).

## Arquitetura do porteiro (implementada, loop v4)

- Flags: `--vigiar` (rodada normal com vigília) e tick silencioso
  (`--so-olhar --vigiar`: só imprime "tick do porteiro em ..." + linhas e sai;
  NUNCA toca fila/propostas).
- Snapshot `memoria/vigilia.json`: `{olho: {arquivos: {nome: [mtime, tam]},
  notificados: [...] }}`; primeira visita = calibra sem avisar.
- Tolerância (idade mínima do arquivo) evita gritar com download incompleto;
  teto `max_eventos` por rodada; mudou ⇒ des-notifica e religa o alerta.
- Vocabulário de reações (único aceito): "inventario", {"anotar": texto}
  (→ memoria/vigilia.log), {"anotar_fila": "executar:|abrir:|avisar:..."}
  (→ fila/vigia-*.txt, roda só com testemunha). Qualquer outro item = recusa.
- Bugs que o portão pegou ANTES de entregar e já corrigidos:
  1) pasta vazia na calibração era recalibrada toda rodada (swallow do 1º arquivo)
     ⇒ `calibrado = arquivos dict + notificados list` explícitos;
  2) arquivo imaturo era registrado como conhecido e perdia o sinal
     ⇒ snapshot só grava estado de quem foi anunciado ou não mudou; imaturo novo
     fica fora e imaturo mudado mantém o estado velho até amadurecer.

## Próximo round: B12 — CORRENTES (fluxos em etapas, estilo n8n)

- Design a manter: correntes declaradas no regras.json (bloco `correntes`),
  gatilho (ex.: vigilia chegou .pdf) → lista de etapas; cada etapa usa SÓ
  ferramentas que já existem e já são blindadas (ler mundo, abrir: com 3
  cadeados, avisar, inventario, escrever dentro do projeto).
- Inegociáveis: nenhuma etapa pode apagar/mover do mundo real (allowlist
  read-only p/ mundo; escrita só dentro do projeto — "vidro, não canivete");
  toda corrente ensaia no mundo_falso ANTES de valer (portão v7); humano
  aprova (rascunho → ativa: true); à noite só anota/enfileira.
- Peças previstas: loop v5 (motor de correntes + `corrente:` na fila?),
  regras v13 (bloco correntes com 1 corrente-demo "pdf → copiar pra entrada/"),
  portao v7 (cena corrente: happy path + elo recusado + corrente sem gatilho),
  raio v4 (radiografa bloco correntes). Entregar tudo em blocos verbatim com
  endereço em cada passo (lição do round do tick.bat vazio: endereço junto do
  bloco, um passo por vez, TDAH).

## Fontes de verdade

- Máquina dele: SÓ prints (repo GUILHERMEFMAGA/super-agente é privado).
- Entrega p/ colagem: `.arena-delivery/` neste repo (commit d0cf141 pushed).
- Frases-guia: "o agente propõe, o teste decide, o humano aprova";
  "mão na massa exige testemunha"; "o porteiro observa e anota; agir sozinho,
  jamais"; "silêncio = sucesso".

## ATUALIZAÇÃO — madrugada de 20/09 (pós-B11)

- **TURNO NOTURNO ARMADO**: ele rodou o `schtasks /Create` do tick e o print confirmou
  `ÊXITO: a tarefa agendada "SuperAgente Tick" foi criada corretamente`. Tick mudo a cada
  15 min, só registra/enfileira (reações viram fila que roda na rodada com testemunha).
- Rotina da manhã combinada (2 comandos, já ensinados a ele):
  1. `Get-Content memoria\vigia.log -Encoding utf8 -Tail 12` (carimbos da madrugada;
     PC dormiu = faltam carimbos, não é bug — explicado)
  2. `Get-ChildItem fila\*.txt` → se houver `vigia-*.txt`, `python agente\loop.py` atende
     com testemunha e gera relatório `relatorios/fila-vigia-*.txt`.
- GitHub dele segue em `394b174` (B11 completo). Demo ao vivo provada no print: tolerância
  segurou alerta curto → evento ao amadurecer → fila própria atendida `[FEITA]` na mesma
  rodada → limpeza sem fantasma.
- **Gatilho do B12**: ele disser "manda o B12". Design já traçado na seção "Próximo round".

## B12 CORENTES — construído e validado no sandbox (20/09 ~04:15, HEAD 0daeb39 + README)

- loop v5 (941): + bloco correntes — corrente_diario/gatilhos/etapa, _enfileirar,
  correntes_para; integração: vigiar() estende logs do evento com correntes_para(nome, pasta/n).
- Vocabulário de elos: copiar_para_projeto (RAIZ/para, sem .., mkdir, copy2, "ja existia" pula),
  avisar (append memoria/vigilia.log), abrir (dia=executar_abrir | SO_OLHAR=_enfileirar),
  executar (dia=coleira | SO_OLHAR=_enfileirar). Limite por (gatilho|arquivo|elo) max_por_arquivo
  default 3 (clamp 1..50) → elo "dormiu". Diario memoria/correntes.json.
- Regras v13: bloco correntes com gatilho demo pdf-no-downloads (copiar entrada/ + avisar).
- Portão v7 (347): cena correntes — calibra, pdf+png, copiou/ignorou/anotou/recusou, loop 4x
  tamanhos crescentes → dormiu; madrugada: SO_OLHAR=True → "virou fila" + fila/vigia-*.txt 1.
  13 [ok], exit 0. (Lição aplicada: cena troca loop.FILA junto com RAIZ — bug de cena B11
  herdado; snapshot usa mtime INT: testar mudança com tamanho crescente.)
- Raio v4 (737): checar_correntes (ids únicos, se.extensao com ponto, etapas no vocabulário,
  'para' dentro do projeto, max 1..50), +5 ANATOMIA fns, umbrais loop<905 (a atual 941),
  cenas<16, exigidios gitignore += entrada/ e relatorios/corrente-.
- gitignore v2 (32): entrada/ + relatorios/corrente-*.txt ANTES da linha de memoria (privacidade
  das capturas; raio exige).
- Smoke sandbox (dia/noite/manhã): dia evento→copiou entrada/→fila atendida FEITA na mesma
  rodada; tick noturno copiou contrato.pdf + enfileirou avisar SEM janela; manhã atendeu fila. ✓
- Entrega: 6 arquivos em .arena-delivery (loop/regras/testar/raio/README/gitignore); mensagem
  com blocos completos + endereço por passo + demo pdf (30s tolerancia) + "entrada/ nao vai
  pro GitHub" — pendente: print dele do verificar-tudo pos-B12.
- Próximo passo natural (B13): correntes com gatilho por NOME/hora ("às 7h resume o dia") e
  corrente→rascunho (auto-melhoria criando correntes ensaiadas no portão). Não prometer mover/apagar
  do mundo sem decisão explícita dele.

## 21/09 — turno noturno VIVOU na maquina dele (validado por print)

- 20/09 madrugada: demo B11 completa ao vivo (chegou teste-do-porteiro.txt -> inventario+caderno+
  enfileirou -> fila atendida MESMA RODADA [FEITA], saida 0; limpo com Remove-Item).
- GitHub dele: 394b174 = B11 completo (8 arquivos, incl. tick.bat + verificar-tudo.bat).
- 21/09 19:08-20:08: `Get-Content memoria\vigia.log -Encoding utf8 -Tail 12` = 4 carimbos de tick
  de 15min ("nada novo por enquanto") — relógio agendado roda sozinho ✓ (buraco 19:53 benigno:
  PC dormindo/ocupado = skip; snapshot nao perde estado).
- Plano da noite 21/09 (combinado, zero colagem): isca `Set-Content "$env:USERPROFILE\Downloads\isca-do-porteiro.txt" ...`;
  manha: vigia.log deve mostrar "chegou isca..." -> `python agente\loop.py` atende a fila da noite.
- **B12 CORENTES PRONTO NA ENTREGA (aguarda gatilho "manda o B12")**: 6 arquivos finais em
  .arena-delivery ja commitados (0daeb39 + 54cb6c2 + 468b257): loop v5 941, regras v13 71 (gatilho
  pdf-no-downloads -> copiar entrada/ + avisar), portao v7 347 (cena correntes; 13 [ok] exit 0;
  troca loop.FILA na cena), raio v4 737 (checar_correntes + exigidios entrada/ e relatorios/corrente-;
  umbrais 905/16), gitignore v2 32, README v5 127. Smoke dia/noite/manha verde no sandbox.

## 22/09 00:52 — usuario trouxe manifesto "auto-evolutivo" (prompt de LLM, colado cortado)

- Ele: "vamos colocar TODAS essas ideias". Decisao (melhor escolha): NAO colar o prompt no
  projeto (agente dele e codigo puro, sem LLM pra ler isso); triagem em 3 baldes:
  (A) JA EXISTE ~metade (loop ver/decidir/fazer/lembrar = ciclo dele; portao = etapa
  "verificacao"; raio = "analise de codigo/zero redundancia"; memoria/aprendizados = "cada erro
  vira regra"; tick agendado = "trabalha 24/7 dormindo"); (B) OURO = roadmap novo B13
  OLHOS-DE-SAUDE (olho `pc` read-only: RAM/disco/CPU sem admin, ctypes/shutil ->
  memoria/saude.txt no tick + resumo da manha) + B14 LEI-DA-NAO-REDUNDANCIA (raio detecta blocos
  duplicados) + B15 DIARIO-DE-EVOLUCAO (memoria/diario-evolucao.txt: melhoria aprovada = 1 linha
  'o que era ruim / o que melhorou / quando'; ideia que falhou = aprendizado negativo);
  (C) RECUSADO com motivo: auto-monetizacao "8000 produtos" (golpe de iniciante), auto-reescrever
  codigo sozinho sem portao (Jenga), reparo de registro/SFC/limpeza admin (pode brickar Windows;
  fora da allowlist — mesma logica de "git push jamais na coleira").
- Ordem firmada: B12 colagem primeiro (pecas prontas na entrega), depois B13/B14/B15 construidos
  por mim no sandbox e entregues no mesmo ritual.
- Teste da isca (21/09 noite) AINDA NAO confirmado por print — cobrar `Get-Content memoria\vigia.log
  -Encoding utf8 -Tail 6` + `python agente\loop.py` no proximo round dele.

## 22/09 ~01:00 — B12 ENTREGUE no chat (6 blocos verbatim lidos do disco)

- Ele digitou "manda o B12" no PowerShell (CommandNotFoundException inofensivo) — gatilho
  entendido, entrega feita: regras v13, loop v5, portao v7, raio v4, gitignore v2, README v5.
- Isca do 21/09: Set-Content rodou por ele; tick noturno deve ter pescado (ainda sem print).
  Ritual dele: testar -> raio -> salvar-tudo -> `python agente\loop.py` (atende fila da noite).
- Cobrar print do PORTAO (esperado 13 [ok] + "PORTAO ABERTO... correntes no trilho") e do
  PLACAR do raio (0 problemas). Se aparecer "…cortado…" em algum bloco do chat, ele avisa antes de colar.
- Proximos blocos ja prometidos: B13 olhos-de-saude (RAM/disco/CPU read-only -> memoria/saude.txt),
  B14 lei-da-nao-redundancia (raio detecta duplicacao), B15 diario-de-evolucao.

## 22/09 01:1x — RAIO repostado com rotulo certo; passos 5-6 + ritual enviados

- Eu escrevi "vigila.snapshot" na 1a tentativa do passo 4 (disco estava certo: "vigilia.snapshot",
  4x, 737 linhas, verificado por grep). Repostei o raio_x.py INTEIRO corrigido + avisei "nao cole
  o bloco anterior; cole este". Licao: reler do disco ANTES de publicar cada bloco (fazer isso nos
  proximos blocos B13-B15 de fabrica).
- Enviei tambem: passo 5 .gitignore (32), passo 6 README (127), ritual final (testar -> raio ->
  `python agente\loop.py` que atende a fila da isca -> salvar-tudo) e o alerta "PDFs antigos no
  Downloads podem ser copiados pra entrada/ na primeira rodada — recurso, nao bug".
- Aguardando: prints do PORTAO (13 [ok]) e do PLACAR (0 problemas). Depois dele: B13 olhos-de-saude.

## 22/09 21:2x — B12 100% ACEITO NA MAQUINA DELE (a corrente disparou no mundo real)

- Ritual completo por ele, ao vivo: portao 13 [ok] + "PORTAO ABERTO... correntes no trilho";
  raio PLACAR 22 ok | 2 dicas | 0 problemas -> "VEREDITO: corpo 100%".
- Auditoria byte a byte que fiz do texto colado na chat: loop.py e raio_x.py IDENTICOS ao cofre
  (0 linhas de diff), regras.json identico semanticamente. .gitignore dele = 25 linhas (so sem
  brancas) -> inocuo, exigidios todos presentes.
- salvar-tudo.bat -> commit f8cd1f5 (main dele), 6 arquivos, +325/-9; push 394b174..f8cd1f5 OK.
  GitHub dele AGORA tem B12 inteiro.
- DEMO FINAL: "Set-Content teste-corrente.pdf" no Downloads + "python agente\loop.py --vigiar"
  -> linha: "chegou teste-corrente.pdf -> inventario; anotado; enfileirado avisar;
  corrente pdf-no-downloads: copiei para entrada/teste-corrente.pdf; anotado" + fila
  vigia-212722.txt [FEITA] na MESMA rodada (41a rodada). Corrente funcionando no mundo real. ✅
- Limpeza combinada: Remove-Item do pdf no Downloads (sumir NAO e evento — porteiro so reage a
  novo/mudado). Copia em entrada/ e trophy opcional (gitignored).
- Proximo passo quando ele pedir "manda o B13": olhos-de-saude (RAM/disco read-only no tick ->
  memoria/saude.txt + linha de manha). Depois B14 lei-da-nao-redundancia, B15 diario-de-evolucao.
  Design ja decidido (triagem 22/09). NADA construido ainda para B13.

## 22/09 21:4x — PEDIDO DE CONEXAO DIRETA ao repo dele (novo fluxo, aguardando permissao)

- Ele quer que EU edite o codigo direto no GitHub dele (sem colagem no VS Code). Decisao: SIM,
  e o caminho melhor. Diagnóstico: conexão gh do sandbox = OK porem logada como
  `arena-ai-coding-agent[bot]`; lê GUILHERMEFMAGA/GUILHERMEFMAGA-SITE (repo da sessao) mas o
  GUILHERMEFMAGA/super-agente da **404** (privado, app nao instalado la). Anon clone tbem 404.
- Combinado com ele: reconectar GitHub no Arena marcando o repo `super-agente` (ou All repos) ->
  ele responde "conectei" -> EU testo `gh api repos/GUILHERMEFMAGA/super-agente --jq .permissions`
  (quero admin/push), clono em /home/user/super-agente, rodo portao+raio no clone pra provar o
  harness no repo real, crio PUXAR-ATUALIZACAO.bat (chcp 65001 + git pull --ff-only origin main +
  pause; ja RASCUNHADO, ver esta nota) + linha no README "Sync com o parceiro" + linha na tabela
  de anatomia; push no main dele. Fluxo novo dele: salvar-tudo -> puxar-atualizacao (duplo clique)
  -> verificar-tudo. Eu NUNCA pusho sem portao+raio verdes; a aprovacao humana vira o pull dele.
- Regras que permanecem: B12 ja esta instalado e verde (f8cd1f5 no main dele). Ate conectar,
  colagem continua valendo. Clone dele pode perder .git entre turns no sandbox -> re-clone;
  fonte de verdade = GitHub dele, sempre.

## 21/09 turno extra — conexao travou no token, plano virou "ultimo paste"
- F5 na pagina do Arena NAO reemitiu a chave: installation/repositories segue vendo so GUILHERMEFMAGA-SITE; `gh api installation` da 404 (endpoint nao exposto pro token); clone 404 confirmado. NAO perder turnos testando de novo AQUI nesta sessao.
- Conclusao nova: token nasce no INICIO da sessao -> a conexao deve funcionar SOZINHA numa conversa nova do Arena (permissao ja aprovada no GitHub dele). Na proxima sessao: testar installation/repositories 1x; se vir super-agente -> clonar, portao+raio no clone, ai sim README (linha da tabela + secao Sync com o parceiro) e push no main dele.
- Entregue ao Guilherme via chat (ultimo paste da serie): .arena-delivery/puxar-atualizacao.bat (31 linhas, ASCII puro, 978 bytes, chcp NAO usado; estilo igual salvar-tudo.bat). Falha do pull = nada muda no PC (ff-only) e a propria janela explica. README dele ainda NAO tem a linha do puxar — fica pra quando o push direto abrir.
- Proximo round com ele: conferir print "colei" -> passo de rodar salvar-tudo.bat -> depois fluxo dele vira salvar -> puxar -> verificar. Se ele rodar puxar AGORA da "Already up to date" = ok, nao e erro.
- Print 22:25 dele: puxar-atualizacao.bat colado e salvo, 31/31 linhas conferidas vs original (UTF-8, CRLF, modo Batch, tab sem ●; "U" no Explorador = so untracked, normal). Proximo round dele: .\salvar-tudo.bat no terminal ja aberto + print da saida PRONTO. Nada de teste hoje. Apos commit dele, fluxo da maquina real esta completo; ganho real do puxar chega quando o push direto abrir (sessao nova do Arena).
- 22:29: salvar-tudo dele publicou o puxar no main (dd491ce, 26 commits, file na raiz, confirmado no print). Maquina real COM o fluxo salvar->puxar->verificar instalado. Byte-a-byte direto impossivel nesta sessao (bot ainda so ve o SITE) — certeza dada pela cadeia: original 31/978B ASCII puro vs print dele 31/31 ok. Teste de conexao: 1x por turno maximo; ganho real (push no main dele) na proxima conversa do Arena.

## 21/09 22:40 — PONTE PELO SITE (plano aprovado pelo Guilherme, substitui a espera da sessao nova)
- Ideia dele: espelhar o super-agente dentro de GUILHERMEFMAGA-SITE (repo que o bot DESTA sessao ja pode escrever) como branch separado `super-agente`; main do site NAO e tocado; nada vira publico.
- Passo dele (2 linhas no terminal VS Code): git remote add site https://github.com/GUILHERMEFMAGA/GUILHERMEFMAGA-SITE.git ; git push site main:super-agente
- Meu passo apos subir: fetch origin super-agente -> clonar p/ /home/user/ponte -> rodar portao+raio no Linux (adaptar se precisarem de Windows) -> a partir dai ENTREGAS = push meu no branch site/super-agente -> ele baixa com puxar v2 (git pull --ff-only site super-agente) — entregar puxar-atualizacao.bat v2 como ULTIMO paste quando a ponte validar.
- salvar-tudo dele segue empurrando origin main (super-agente.git, backup dele) = intocado. Regra de convivencia: divergiu? ordem puxar -> salvar (push dele so da ff se ele puxar meus commits antes).
- Sessao nova do Arena continua valendo depois: la abro o super-agente direto e restauro a arquitetura final (código no super-agente, site no site).
- 22:46: ele foi pro navegador (super-agente/Settings General) procurando conserto da conexao e perguntou se era por causa do nome "main" — NADA errado la, main e o padrao certo, pagina intacta. PADRAO CONFIRMADO: confuso = deriva pro Settings do browser. Regra fixa daqui p/ frente: toda acao dele com endereco explicito da JANELA ("troque pra janela do VS Code"), e lembrar a Regra da Noite: github.com no navegador nunca conserta conexao; Settings = nao tocar. Acao pendente dele: 2 linhas do bridge no terminal do VS Code (conferir prompt C:\super-agente; senao cd C:\super-agente antes) + print.

## 21/09 23:00 — PONTE ABERTA (esta memoria agora vive no projeto, em parceiro/)
- Guilherme rodou as 2 linhas sem erro (remote `site` + `git push site main:super-agente`, tip dd491ce). A ponte = branch `super-agente` do repo GUILHERMEFMAGA-SITE; roda por cima do repo privado dele sem expor nada.
- Fluxo da maquina real agora: aviso do parceiro -> puxar-atualizacao.bat (v2, lê `site super-agente` com --ff-only) -> verificar-tudo.bat -> salvar-tudo.bat (v2: commit, push 1/2 ponte, push 2/2 backup origin main; se ponte recusar, puxar primeiro). salvar v2 empurra arvore mesmo quando "nada novo".
- Lado parceiro (sandbox Arena): espelho em /home/user/ponte. Regras de ferro dele: portao+raio verdes ANTES de qualquer push na ponte; baseline Linux da ponte limpa = portao 13/13 + raio "0 problemas"; nunca forcar nada.
- conexao GitHub App direta ao super-agente (404 por token velho desta sessao): se resolver numa conversa nova, arquitetura final = codigo volta a morar so em super-agente.git e a ponte vira so arquivo. Enquanto isso: entregas TODAS pela ponte, zero paste.
- Roadmap: B12 ✅ (correntes validadas no mundo real). Proxima: B13 olhos-de-saude (pc: memoria/livre via ctypes GlobalMemoryStatusEx + shutil.disk_usage + os.cpu_count -> memoria/saude.txt no tick; Resumo da manhã conta se o PC passou fome) — chega ja pela ponte. Depois B14 lei-da-nao-redundancia (raio checar_duplicacao), B15 diario-de-evolucao.
- 23:5x BUG REAL achado pelo Guilherme no puxar v2: o cmd fecha bloco if no PRIMEIRO ")" que ve, ate dentro de "echo 1)" -> "Voce foi inesperado neste momento" (erro de parse, aparece ate no caminho de sucesso). Fix = puxar v3 (2ae4d35 na ponte): fluxo por goto, zero parenteses dentro de bloco. Licao de processo: portao/raio NAO leem .bat -> B14 ganha sub-tarefa "linter de .bat" no raio (parentese solto em echo dentro de bloco = problema). No Linux nao da pra rodar cmd; o scan de parenteses virou o maximo verificavel daqui. Origin backup dele deve 3 commits (992583a, ponte-v1 extras, 2ae4d35) - o 1o salvar v2 acerta tudo num empurrao so.
- 00:0x CICLO VALIDADO NA MAQUINA REAL (fim de obra da ponte): puxar v3 rodou limpo no Windows (banner+Already up to date+PRONTO, sem erro de parse), salvar v2 fez push duplo (ponte up-to-date + backup resgatado dd491ce..1625222). Tres pontas iguais em 1625222: PC dele, super-agente.git, ponte no site. Contrato novo vigente: parceiro publica na ponte -> Guilherme da duplo clique no puxar (pasta amarela) -> verificar -> salvar. Proxima entrega: B13 Olhos-de-Saude (medir memoria/disco/CPU no tick + resumo da manha), ja nasce na ponte.

## 22/09 03:15 — B13 OLHOS-DE-SAUDE publicada na ponte (primeira entrega 100% por ponte)
- loop v6 (1069 linhas): medir_saude/linha_saude/bater_ponto_saude/resumo_da_madrugada + pulso no tick e no --vigiar manual; umbrais RAM>=90%, disco<5GB; janela 192 batidas (~48h); SEM verbo novo na coleira e SEM mudanca no regras.json (leitura pura).
- portao v8: cena saude (6 assertivas: honesto/duas linhas/formato/contagem da madrugada/janela/sem-diario) = 17 impressoes; raio v5: checagem saude + LINTER DE .BAT (lição do parêntese vira teste) + exigidios do gitignore ganhou "memoria/*.txt".
- Campo achou 2 buracos antes do push: placeholder de linha-contagem (sed real=1069) e VAZAMENTO: saude.txt nao era ignorado -> .gitignore + linha e raio passou a exigir. Teste no clone: tick escreveu "03:15 ram=6% ... fome=nao" e o git nao viu mais nada.
- Faltando no lado dele: duplo clique no puxar (v2 vira... v3? nao: puxar nao mudou; agora ele puxa B13) + verificar-tudo. Placar esperado na maquina real: portao 14 cenas ok; raio "0 problemas" e a linha saude ok com batidas.

## 22/09 01:00 — MODO SERIO ATIVADO: ROTEIRO.md (F->C->V->P) + F2/B14 publicada
- Pedido dele: IA "real", sem API/centavo, publicar na internet, "ultrapassar o Claude". Reencaixe honesto gravado no ROTEIRO: vencer na arena que frontier model nao pisa (autonomia local, tempo real, custo zero, auditavel), nao no raciocinio geral. Meta tecnica: estatistica classica na stdlib = a "IA" daqui.
- Plano mestre em parceiro/ROTEIRO.md: F (F1 saude ✅, F2 redundancia ✅, F3 diario-evolucao), C (C1 matcher semantico difflib+TFIDF/cosseno, C2 pesos ε-greedy, C3 planejador A*), V (V1 ReadDirectoryChangesW via ctypes, V2 SQLite stdlib, V3 relatorio matutino template), P (MIT+pyproject+CLI, repo PUBLICO demo com fixtures limpos - o dele segue privado, docs no site dele).
- F2/B14: checar_duplicacao no raio (agrupa funcoes por dump AST normalizado sem docstring; corpo identico = AVISO com local). Auditoria da propria casa: 76 funcoes/8 arquivos, zero copia. Leis de ferro congeladas declaradas no topo do ROTEIRO.
- Proximo tijolo na bancada: F3 diario de evolucao; depois C1 (a primeira "IA de verdade" do projeto). Entrega segue 1 tijolo/turno -> ponte -> duplo clique dele.

## 22/09 04:15 — C-motor FLUXOS v1 publicada na ponte (tip f82d196): a alma do produto
- Motor de fluxos como SOBRECAMADA: correntes legadas B12 intactas e ativas em paralelo (ele nunca toca código; só `puxar` atualiza). Config no cérebro: bloco "fluxos" {ligado, gatilhos:[{id, quando:{olho,extensao,nome_contem,tamanho_min_kb/max}, passos:[{usar, ..., se:{...}}]}]}.
- 4 verbos blindados só (copiar_para_projeto/abrir/avisar/executar); "se" que não bate → passo pulado e NÃO gasta limite; diário único memoria/correntes.json, chave "fluxo:<id>|<arquivo>"; normalização acento-case via unicodedata (_txt_normal).
- --vigiar --ensaiar = DRY-RUN TOTAL (a arma anti-n8n): plano impresso ("passo 'X' dispararia"), zero escrita em vigilia/diário/ponto-de-saúde; correntes legadas também ensaiáveis. Main: `if VIGIAR and (SO_OLHAR or ENSAIAR)` não bate ponto.
- Smoke real no clone: tolerancia_seg=30 do cérebro de produção segurou arquivo de 1s (guarda anti-mentira funcionando — nunca reagir a arquivo pela metade); após 31s: ensaio limpíssimo, execução copiou para entrada/notas/ ✓.
- Placar sandbox: portão v9 15/15 (nova cena fluxos, 18 impressoes); raio v7 24 ok | 2 dicas | 1 aviso | 0 problemas (checar_fluxos valida vocabulário de quando/se). Debug ensinou: falha era asserção minha ("-> anotado" vs real "-> inventario atualizado"), motor nunca esteve errado.
- Máquina dele segue em c2f3f36; pull (puxar v3) traz B14 + ROTEIRO + fluxos de uma vez. Pendências dela: 2 duplo-cliques (puxar → verificar). Placar esperado: portão 15 cenas, raio com fluxos OK.
- Próximo tijolo: F3 diário-de-evolução (o agente conta o que aprendeu); depois C1 matcher semântico (difflib + TF-IDF/cosseno stdlib = a primeira "IA de verdade").

## 22/09 05:00 — B15 APRENDIZADO POR EXPERIENCIA publicada + triagem das 60 ideias (tip ecd3f79)
- Ele mandou lista grandao ("10 features enterprise" + 60 ideias + "5 mil ideias"). Resposta profissional: TODA ideia recebeu veredito na triagem do ROTEIRO.md (✅ ja existe / 🔧 entregue agora / 🔜 na fila / 🆕 entra na fila / 🚫 quebra contrato — com motivo). "5 mil ideias" tratado como o que e: a lista de 60 ja tem mais substancia que 5 mil linhas de preenchimento; extensao = trazer 10 por vez, cada uma vira ticket com veredito.
- B15 = RL honesto stdlib (absorve ideias 1,5,6,8,10,56): caderno `memoria/aprendizado.json` {eventos:[[ts,chave,tipo,peso]]} teto configuravel; `pesos_aprendido` decaimento 0.5^(idade/14d) janela 60d; `conselhos_aprendido`: score<=-2 & >=2 eventos -> "aposentar", >=3 & >=3 -> "confiavel", cap 5. Hooks: executar (+1), _experiencia_elo nos 2 fluxos de etapas (+0.5/-1), promover humano (+2), portao-barrou rascunho (-0.5). SO_OLHAR nao escreve; ensaio nao executa logo nao registra. Conselho no main: "a experiencia sugere:".
- Bloco `aprendizado` no regras.json (ligado, janela/meia-vida/teto) — config consumida de verdade (raio valida numeros e teto 50..100000).
- Portao v10: 16 cenas 19 impressoes (cena aprendizado: pontuou, decaiu 2 meias-vidas, aconselhou, elogiou, hook_gravou, silencia so-olhar). RAIO v8: checar_aprendizado + FERRAMENTAS_DO_CORPO ganhou as 4 funcoes. 24 ok | 3 dicas | 1 aviso | 0 problemas. Duas licoes de teste: elogiou precisa ancorar em chave que ATINGE o limiar (3x+0.5=1.5 < 3.0 — nao inventar matematica no assert) e nomes passam minusculos como no executor.
- Smoke real: --so-olhar nao cria caderno ✓; 4 eventos -> "acao:demo score 4.0 confiavel" ✓; git nao viu nada (memoria/*.json ignorado).
- Ideias novas fileiradas hoje: C4 (A/B de meia-vida + mutacao de gatilhos), V4 (voz offline SAPI/ctypes), V5 (contrato de conector local, zero ativo), V6 (proxy de uso por mtime), F4 (checksum anticorrupcao), P4 (alarme de novidade — nunca instalar sozinho), P5 (backend GGUF opcional desligado), P6 (catalogo pt/en), P7 (onboarding), P8 (dados de comunidade opt-in so no repo demo).
- Proximo tijolo: F3 diario-de-evolucao (absorve #5 e #37: narrativa + taxa de alucinacao = propostas/aprovadas); depois C1.
