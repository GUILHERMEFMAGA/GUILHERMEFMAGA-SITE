# PROMPT DE RECUPERAÇÃO — cápsula do super-agente
> **Para a IA que está lendo isto numa conversa nova:** você herdou o trabalho de
> uma sessão anterior que foi perdida. Este arquivo É a memória completa dela.
> Analise tudo antes de agir, valide o placar (seção 7) e confirme com o humano
> (Guilherme) o próximo passo. Não invente estado: o estado real é SEMPRE o último
> commit do branch `super-agente` + os 2 últimos registros de `parceiro/ESTADO.md`.
> Responda em português.

---

## 0. O PROMPT FIXO (esse texto é o único que o Guilherme copia e cola pra
continuar em qualquer conversa nova — atualizar só se as REGRAS mudarem; o
ESTADO de onde paramos mora nas seções 5 e 7, e é lido de lá)

```text
Sou o Guilherme, dono do projeto super-agente local (C:\super-agente). Você é
meu parceiro de programação no Arena e está retomando o projeto EXATAMENTE de
onde a conversa anterior parou — ela acabou, mas o projeto guarda a memória dele
mesmo. Faça a recuperação antes de qualquer outra coisa:

1. Rode: git fetch origin super-agente
2. Leia a cápsula inteira: git show FETCH_HEAD:parceiro/PROMPT-RECUPERACAO.md
3. Leia os 3 últimos registros: git show FETCH_HEAD:parceiro/ESTADO.md
4. Siga o checklist da seção 10 da cápsula: reclone a ponte no sandbox e rode
   portão e raio ANTES de tocar em qualquer código.
5. Confirme pra mim em até 6 linhas ONDE paramos e QUAL é a decisão pendente.
   Só comece o próximo tijolo depois que eu responder.

Minhas regras (inegociáveis):
- Você NUNCA toca meu PC. Você publica na ponte (branch super-agente do repo
  GUILHERMEFMAGA-SITE). Quem move meu PC sou eu, duplo-clique na amarela, nesta
  ordem SEMPRE: puxar-atualizacao.bat (recebe) -> verificar-tudo.bat (prova) ->
  salvar-tudo.bat (backup). Toda entrega sua termina com esse lembrete.
- Zero API paga, zero Ollama, zero internet no agente: só Python stdlib,
  local-first, nada sai da máquina.
- Português, passos pequenos (tenho TDAH): uma ação por rodada, caminho
  completo dos arquivos, celebrar vitórias, nunca subentender qual botão.
- Nunca empurrar na ponte sem portão + raio verdes no seu clone; nunca
  --force; meus repositórios não viram públicos; print meu = fonte de verdade,
  leia linha por linha.

Seu tom desde o primeiro minuto: nada de gracinha nem análise rasa — tom
profissional, engenharia de desenvolvedor sênior. Nosso objetivo: transformar
este agente em uma das evoluções mais incríveis de agente de IA, com foco em
PRODUÇÃO avançada, porque vou VENDER este agente para ser melhor que o n8n.
Isso exige aprofundamento, pesquisa e análise ANTES de entregar, para o código
sair melhor que o anterior, competindo de igual com as IAs do mercado
industrial — e entregando o melhor.
```

(IA sem acesso ao GitHub, ex.: chat da web? Copie as seções 2, 3, 4 e 7 deste
arquivo + o print/output do problema. Ela orienta, não executa — pra executar,
voltar pro Arena com o prompt acima.)

> Regras de convivência e as três pontas moram na seção 6.5. Se a seção 0
> divergir de qualquer outra, a seção 0 vence — é a ordem fixa do dono.

## 1. Quem é o humano e como trabalhar com ele
- **Guilherme**, iniciante em programação, TDAH, brasileiro (fuso America/Sao_Paulo).
- Trabalhar assim com ele: passos PEQUENOS, uma ação por rodada, texto escaneável
  (tabelas/listas), celebrar vitórias, NUNCA deixar subentendido qual botão/tecla.
- Prints de tela dele = fonte de verdade. Quando ele manda print, leia cada linha.
- "ME DA A MELHOR ESCOLHA" = decidir por ele, com justificativa honesta.
- **REGRAS DO CANAL**: ele não digita código solto no PowerShell. Padrão = duplo
  clique nos .bat da pasta amarela. Terminal do VS Code só pros rituais com `.\`.
  Zero-cola de código no chat (fluxo atual é a ponte — seção 6).
- Modo sério (fase comercial): tom profissional, análise ANTES de código, sem
  brincadeiras quando ele estiver trabalhando.

## 2. O projeto (o que é, em uma frase)
Agente de IA **local-first** que roda no PC dele (`C:\super-agente`): vigia pastas,
executa fluxos com condições, aprende com a própria experiência e NUNCA toca em
nada sem ensaio + aprovação humana — **sem nenhuma API paga, sem Ollama, sem nuvem;
só Python puro (stdlib) + Git**. Produto a vender: custo zero, nada sai da máquina,
auditável, doutrina "ensaio → mundo falso → aprovação humana". Não compete com
Claude no raciocínio nem com n8n nos conectores — compete na arena local.

## 3. Leis inegociáveis (quebrar qualquer uma = trabalho perdido)
1. **Agente propõe, o teste decide, o humano aprova.** Nada se autopromove.
2. `--so-olhar` = modo observação: não escreve, não executa, não julga (nem o
   caderno de experiência), não poda.
3. Allowlist read-only de comandos (`execucao.permitidas`); verbos de destruir não
   existem; abrir arquivo passa por política de raízes + 21 extensões banidas.
4. **Git nunca na coleira**: o agente nunca roda git no PC dele; quem sincroniza é
   ele, com os .bat dele.
5. **Só o duplo-clique DELE muda o PC DELE.** A IA nunca empurra código pra máquina
   dele: publica na ponte; ele puxa quando quiser.
6. A IA só commita/pusha na ponte com **portão + raio verdes no clone** dela.
7. Os repositórios dele não viram públicos (exceção futura: P2 repo DEMO público
   com fixtures limpos — decisão dele).
8. Retrocompatibilidade: motor novo entra como sobrecamada; nada remove, tudo
   acrescenta (correntes legadas vivem em paralelo com o motor de fluxos).

## 4. Arquitetura (o que cada arquivo é)
```
C:\super-agente\
├─ agente\loop.py            # O corpo (~1500 linhas, ~67 funções): ver→olhar→decidir
│                            # →fazer→lembrar→contar→propor + vigiar + correntes + fluxos
│                            # + saúde + experiência + blindagens. Flags via _flags() (função,
│                            # não constante — lição do import congelado)
├─ fluxos\regras.json        # O CÉREBRO: chaves auto_promocao, mundo, execucao (a COLEIRA),
│                            # abrir, vigilia (tolerancia_seg=30! nunca reagir a arquivo
│                            # pela metade), correntes (B12 legado), fluxos (motor v1),
│                            # aprendizado (B15), acoes. Ordem das chaves preservada em
│                            # json.dump (fluxos antes de acoes)
├─ fluxos\rascunhos\*.json   # propostas dele esperando "ativa": true (o sim do humano)
├─ fila\*.txt                # ordens: executar: | abrir: | avisar: (só andam com dono na sala)
├─ fila\feitas\ e fila\erros\ # museu das ordens
├─ memoria\                  # NUNCA vai pro GitHub (gitignore!): historico.json (diario),
│                             # contadores.json, vigilia.json (snapshot dos olhos),
│                             # correntes.json (limites por arquivo|dia), aprendizado.json
│                             # (placar B15), saude.txt (pulso), .trava (vela de batida)
├─ relatorios\               # inventarios dos olhos + saidas da fila
├─ testes\testar_regras.py   # O PORTÃO: 17 cenas num mundo falso; 21 impressoes.
│                             # Nada entra no cerebro sem ele abrir
├─ testes\raio_x.py          # O RAIO-X: ~21 checagens do corpo inteiro, so le; caça deco
│                             # (chave de cerebro sem mao no corpo), .bat linter, duplicacao
├─ parceiro\ESTADO.md         # memoria do parceiro — registro por entrega; LER OS ULTIMOS
├─ parceiro\ROTEIRO.md          # plano mestre F→C→V→P + triagem das 60 ideias + ideias 2a geracao
├─ puxar-atualizacao.bat      # ele da duplo-clique: git pull --ff-only da ponte
├─ salvar-tudo.bat           # commit + push 1/2 ponte + push 2/2 backup; se recusar, puxa 1o
├─ verificar-tudo.bat         # roda portao + raio na maquina dele
├─ tick.bat                   # chamado pela Tarefa agendada (SuperAgente Tick :05/:20/:35/:50)
│                             # roda --so-olhar --vigiar --trava-velha >> memoria\vigia.log
└─ rodar_de_madrugada.bat     # versao noturna
```
Vocabulário blindado dos verbos (correntes E fluxos): `copiar_para_projeto`, `abrir`,
`avisar`, `executar`. Motor de fluxos: `quando` (olho/extensao/nome_contem/tamanho_*_kb)
+ passos com `se` proprio; passo com `se` que não bate = pulado e NÃO gasta limite;
diário compartilhado `memoria/correntes.json` com chave `fluxo:<id>|<arquivo>`;
`--vigiar --ensaiar` = dry-run TOTAL (plano impresso "passo 'X' dispararia", zero
escrita em vigilia/diario/ponto-de-saude) — É o argumento de venda anti-n8n.
B15: `registrar_experiencia/pesos_aprendido/conselhos_aprendido` — caderno com
decaimento 0.5^(idade/14d); conselho só com evidência (≤-2 ⇒ "aposentar", ≥3 ⇒
"confiável"); nunca muda regra sozinho. B16: `so_com_humano` tem mão (fila não anda
com --so-olhar), escrita atômica (.part+fsync+os.replace), corrompido≠ausente
(grito + exit 1), trava de batida, `--podar-sombra`, `--ajuda`, flag errada = exit 2,
`mundo.permitido/proibido` e `so_acoes_de_criar` cobrados (deco virou contrato).

## 5. História completa (o que já foi feito, em ordem)
- Setup do zero no VS Code dele: Python, Git for Windows (PATH 2ª opção), pastas,
  `loop.py` v1 só-cria-arquivo → B2-B8: diário, contadores, auto-promoção com
  ensaio+recusa, coleira de comandos, fila, fiscal, abrir blindado, README.
- B9/B9b: dois olhos (desktop+downloads) com inventários; confusão de crachá
  → endereço completo em TODO bloco (regra de comunicação).
- B10: portão de testes v1 (mundo falso). B11: `--so-olhar`.
- **B12 correntes**: vigília dispara elos (4 verbos, limites por arquivo, madrugada
  enfileira) — validada na máquina dele.
- **Ponte** (fim da era das colagens): repo GUILHERMEFMAGA/GUILHERMEFMAGA-SITE,
  branch `super-agente` = espelho privado do projeto; ciclo: IA constrói → portão
  + raio verdes → push ponte → ele duplo-clique `puxar` → `verificar`. Bug real do
  puxar v2 (parênteses em echo dentro de if no cmd) → v3 com goto, zero parentêse;
  virou o linter de .bat no raio. **Regra de sucesso: última linha do .bat com
  PRONTO = deu certo; senão explica o motivo em português.**
- **B13 saúde**: pulso RAM/disco/núcleos a cada tick (ctypes GlobalMemoryStatusEx
  + shutil.disk_usage), `memoria\saude.txt`, umbrais RAM≥90% ou <5GB, janela 192
  batidas, resumo da madrugada 6-9h. **Instalada E aprovada na máquina dele**
  (primeiro batimento 00:38; "verificar" 23 ok).
- **F2/B14 não-redundância**: `checar_duplicacao` no raio (agrupa funções por
  dump AST sem docstring; 76 funções, zero cópia = casa própria auditada).
- **ROTEIRO.md**: plano mestre F(sustentação)→C(cérebro)→V(vigília real)→P(produto)
  com técnicas stdlib (difflib, TF-IDF/cosseno, ε-greedy, A*, BM25, SQLite, SAPI
  offline) e pesquisa anti-n8n.
- **Motor de fluxos v1 (C-motor)**: sobrecamada declarativa sobre as correntes;
  normalização acento-case (unicodedata); ensaio sem pedágio; smoke real no clone
  (o tolerancia_seg=30 segurou arquivo de 1s — guarda anti-mentira em produção).
- **Triagem das 60 ideias dele** no ROTEIRO: cada ideia com veredito
  (✅ já existe / 🔧 entregue / 🔜 fila / 🆕 entra / 🚫 quebra contrato — ex.:
  auto-atualização silenciosa = 🚫; versão honesta = P4 "alarme de novidade").
- **B15 aprendizado por experiência** (RL honesto stdlib): ver seção 4.
- **B16 blindagens** (auditoria de ausências virou código): ver seção 4. Auditoria
  que a originou: 8 lacunas achadas lendo o corpo todo (deco, concorrência,
  truncamento, escrita sem try, sombra, CLI) — o método "analisar tudo → veredito
  → código com cena no portão" é o padrão de trabalho.

## 6. Fluxo de trabalho da IA (o ciclo da ponte — reproduzir EXATAMENTE)
Sandbox Arena = clone deste mesmo repo. A máquina dele só muda via duplo-clique dele.
```bash
# 1) recuperar a ponte no sandbox (o sandbox RESETA — nunca assumir que existe):
cd /home/user && rm -rf ponte && git clone -b super-agente \
  https://github.com/GUILHERMEFMAGA/GUILHERMEFMAGA-SITE.git ponte && cd ponte
# 2) identidade git (o reset apaga; pegar do ultimo commit do repo):
git config user.name "Arena (parceiro)"; git config user.email "arena-parceiro@users.noreply.github.com"
# 3) ANTES de mexer, sempre: testar que está verde:
python3 testes/testar_regras.py   # esperado: PORTAO ABERTO 17 cenas
python3 testes/raio_x.py          # esperado: 0 problemas
# 4) trabalhar em 1 tijolo; depois: portao + raio verdes de novo;
# 5) git check-ignore -v <todo arquivo novo em memoria/ ou relatorios/> ANTES do add
# 6) commit + push: git push origin super-agente  (NUNCA main, NUNCA --force)
```
- Testes rodam em Linux puro (sem wine); .bat não rodam aqui — validar por
  inspeção + linter do raio.
- Se precisar do repo da Arena: branch da sessão = espelho em `.arena-delivery/`
  (commit a cada entrega; PR da conversa aberto apontando pra ele — nesta
  conversa, o #8; merge só se ele pedir).
- Arquivos dele NO sandbox: nada. Conexão direta ao PC dele = NÃO existe.
- O espelho (`.arena-delivery/` + PR visual) pertence à SESSÃO que o criou (rampa
  própria). Conversa nova NUNCA empurra PR velho — publica na ponte e, se o humano
  quiser espelho do estado dela, abre PR NOVO do branch dela. Atualizar PR velho =
  tarefa da sessão dona, puxando da ponte (que é a única fonte canônica).
- F5 não reemite GH_TOKEN; se gh gitrear, contornar via git puro (os pushes da
  ponte funcionam pelo credential do clone).

## 6.5 Regras de convivência (CANÔNICAS — a casa delas é AQUI, não na seção 0;
regra 0 da casa: quem reescreve uma seção confere o que estava dentro dela.
Aprendido em 22/09: a reescrita da seção 0 quase enterrou este bloco.)

1. **A ponte está viva e é canônica**: `GUILHERMEFMAGA-SITE` @ branch
   `super-agente` = origem oficial. A SESSÃO que constrói publica na ponte a
   cada tijolo (após portão + raio verdes).
2. **VITRINE POR CONVERSA** (ordem do dono 24/09 — supera o combinado do PR #5
   único): cada conversa abre o PR DELA no SITE, do branch da própria sessão,
   com TODO o tip da ponte via `git archive` em `.arena-delivery/` (conferir
   byte a byte). Toda entrega que empurra a ponte RE-ESPELHA esse PR no MESMO
   fôlego (na sequência imediata). PR = JANELA (só ver código); a PONTE = a
   esteira que alimenta a máquina (`puxar-atualizacao.bat` NUNCA lê PR). Chat
   não cola código do projeto — só números, endereço e ritual (zero-cola). Se a
   ponte andou e o PR não, o PR está velho: re-sincronizar antes de qualquer
   outra coisa.
3. **O sandbox reseta** (apagou `/home/user/ponte` duas vezes em 22/09, mas o
   clone do repo da Arena sobreviveu no `.arena-delivery`). Se `ponte` sumir:
   reconstruir com `git clone -b super-agente https://github.com/GUILHERMEFMAGA/
   GUILHERMEFMAGA-SITE.git /home/user/ponte` (seção 6.3).
4. **O repo `super-agente` é privado e dele** — só os .bat DA MÁQUINA dele o
   atualizam. A IA nunca empurra nele (nem tentaria: 404 de credencial é por
   desenho, não defeito; e ele EXISTE — não dizer o contrário).
5. **Toda conversa nova** começa com o PROMPT FIXO (seção 0) e faz os 3 primeiros
   passos dele antes de opinar: fetch → cápsula → últimos 3 ESTADO.
6. **AS TRÊS PONTAS (NUNCA confunda)**: ① `GUILHERMEFMAGA-SITE` @ `super-agente`
   = PONTE entre IAs (eu empurro; ele puxa — nunca é a pasta dele, nunca é backup,
   é a fita de entrega); ② `C:\super-agente` na máquina dele = o PROJETO VIVO
   (branch `main` dele; só `puxar-atualizacao.bat` dele a mexe; é onde agente,
   portão, raio, memória e Tarefa agendada rodam de verdade); ③
   `GUILHERMEFMAGA/super-agente` no GitHub = o BACKUP (push existe SOMENTE quando
   ELE roda `salvar-tudo.bat` — nunca da IA, nunca automático; estar atrás da
   ponte é normal e saudável). Direção da escrita: sandbox → ① → ② → ③. E o
   espelho da vitrine (PR da conversa, seção 6.5) é um QUATRO canal só de VISUALIZAÇÃO:
   ninguém puxa nada dele, é vitrine de revisão — não confundir com ①.
7. **MUSEU e propriedade de sessão** (ordem do dono 24/09; aula do PR velho
   22/09): os PRs-espelho **#1, #2, #3, #4, #5, #6 e #7 NÃO se apagam** — são o
   museu das conversas passadas; ninguém fecha, apaga, reabre ou funde PR
   alheio sem ordem explícita. O **#5 NÃO reabre**: o branch dele
   (`arena/01a0b1e5`) levou force-push no mesmo segundo do fechamento e o
   GitHub recusa reabrir PR sem ancestral comum com o main (erro 422, "no
   history in common"). A vitrine oficial é o PR DA CONVERSA que constrói —
   nesta conversa (24/09), o **#8**. Cada sessão é presa ao branch
   `arena/<id>-...` dela e NUNCA funde PR do repo do site sem o dono pedir
   (o main é o perfil público dele). Sessão nova abre PR NOVO do branch dela.
8. **Lembrete de fechamento de toda entrega** (ordem fixa, sempre): ① duplo clique
   `puxar-atualizacao.bat` → ② duplo clique `verificar-tudo.bat` (esperado: portão
   17 cenas, raio 0 problemas) → ③ duplo clique `salvar-tudo.bat` (backup dele).

## 7. Estado atual (foto — se estiver velho, o VERDADEIRO é `git log` da ponte + ESTADO)
- Ponte tip: `8907a0e` (recuperação da conversa 22/09 tarde — esta cápsula já com o achado da lei do `--so-olhar`; B16 em `7975863`; reposição das 3 pontas em `2bba1ff`; cápsula original em `88015d5`). Placar sandbox na fonte: **portão 17/17 cenas
  (21 linhas, exit 0); raio 20 ok | 9 dicas | 1 aviso | 0 problemas** — ATENÇÃO:
  o raio conta o estado local, então clone recém-clonado dá placar mais baixo
  ("ainda sem diario/contadores/fila/saude/snapshot" = dica, não problema);
  depois de rodar o corpo 3x o mesmo código dá **25 ok | 4 dicas | 1 aviso |
  0 problemas** (= a foto antiga de 25/5). **0 problemas nos dois casos**, e o
  aviso é o planejador Windows que não existe no Linux — normal.
- Máquina dele: último registro dela parou em `c2f3f36`; B14/ROTEIRO/fluxos/B15/B16
  chegam com UM `puxar` — STATUS DA ATUALIZAÇÃO DELE = PERGUNTE (rodar puxar →
  verificar; esperado na máquina dele: portão 17 cenas, raio 0 problemas, linha
  `blindagens [OK]`). Tarefa agendada `SuperAgente Tick` ativa (:05/:20/:35/:50);
  se o tick.bat antigo não atualizou, ele perde o --trava-velha (funciona, só sem
  cortesia de trava).
- Pendências dele conhecidas: 2 duplo-cliques pós-B16 (puxar + verificar) e o
  salvar-tudo depois (backup do repo da máquina).
- **AS TRÊS PONTAS (confirmado por print dele 22/09 ~05:50):** existe SIM o repo
  `github.com/GUILHERMEFMAGA/super-agente` (branch main) = BACKUP da máquina dele.
  Fluxo de escrita: sandbox → ponte (SITE@super-agente) → puxar dele → máquina →
  salvar dele → super-agente.git. A máquina dele é a ÚNICA que escreve no backup —
  por isso o repo público dele pode estar atrás da ponte (ex.: tip `c2f3f36` vs
  ponte `88015d5` com cápsula+B14→B16): se ele rodar puxar→salvar, sincroniza tudo.
  Credenciais do sandbox NÃO alcançam super-agente.git (App/PAT só cobrem o SITE;
  `git ls-remote` = 404) — isso é por desenho, não defeito. Nunca tentar forçar:
  a via é sempre a máquina dele. Dizer "o repo não existe" é ERRO (aconteceu uma
  vez, corrigido aqui): ele existe, é que está fora do meu alcance — e deve ficar.

## 8. Armadilhas já pagas a sangue (NÃO repetir)
1. Sandbox reseta; /home/user/ponte pode sumir → refazer seção 6.1. Git do repo
   da Arena: usar `git fetch` + olhar FETCH_HEAD; NUNCA `git pull` às cegas lá.
2. Constantes de módulo congelam no import: caminhos E flags = funções/`_flags()`.
3. .bat: zero `(`/`)` dentro de `echo` em bloco `if (...)` — usar goto (v3 validada).
4. Arquivo novo em `memoria/`/`relatorios/` SEM `git check-ignore` antes do push =
   vazamento de dados pessoais pro GitHub (já vazou saude.txt uma vez; corrigido).
5. Reescrever regras.json com json.dump: reconstruir a ORDEM das chaves do original.
6. Teste com RAIZ monkeypatcheada: restaurar TUDO no finally (`r_x, c_x, ... =`
   padrão `try/finally`) — asfalto de toda cena do portão.
7. Cena que depende de PID de fora é flaky: usar `os.getppid()` (vivo garantido).
8. Smoke de mutex com processos sequenciais não prova nada (o 1º já morreu) — só a
   cena no portão prova.
9. gitignore `*pasta/*` não cobre dotfiles do repo raiz; usar padrão com `/` fixo,
   testar com `git check-ignore -v --no-index`.
10. Substituição em arquivo grande: âncora ÚNICA verificada com assert ANTES do
    replace, reindentar só no fim (quebrei o loop.py 2x com replace duplo; salvei
    com git checkout).
11. Assertiva de teste desatualizada ≠ bug do motor: imprimir as sub-asserções
    isoladas ANTES de "consertar" o motor (lição B15: motor 100%, teste errado).
12. PowerShell sem `.\` não roda .bat local; comandos inventados no terminal dele =
    traduzir com carinho pra "duplo clique na pasta amarela".
13.winget Git.Git = PATH quebrado (só Git Bash); no instalador, 2ª opção de PATH;
    nunca a 3ª (sobrepondo find/sort do Windows).
14. Espelho `.arena-delivery`: fluxo único ponte→delivery (nunca o contrário);
    "última linha PRONTO = sucesso".
15. Ao editar README/ROTEIRO/ESTADO: português do arquivo deles é sem acento no
    CONTEÚDO técnico (dado que vai pro cmd dele) — manter estilo.
16. `os.kill(pid, 0)` no Windows NÃO é pergunta de existência: é CTRL_C_EVENT
    de verdade (GenerateConsoleCtrlEvent) e interrompe o console inteiro — foi
    ele que derrubava o portão do dono na cena da trava. Perguntar =
    `processo_vivo()` (POSIX sinal 0; Windows OpenProcess 0x1000 + CloseHandle,
    acesso negado = vive) ou julgar pela idade da trava. O caminho Windows só
    é validável por leitura de código (sandbox é Linux); a prova final é o
    verificar-tudo.bat na máquina dele.
17. Comentário inline no .gitignore (`padrao  # texto`) não é comentário: o git
    lê a linha INTEIRA como padrão e ela nunca bate — `memoria/.trava` dormiu
    desprotegido por causa disso. Comentário vai na linha de cima; a prova é
    `git check-ignore -v`.
18. Receita de fila pelo terminal: `echo ordem> arquivo` é sintaxe de CMD — no
    PowerShell quebra (e o `>` do PowerShell 5.1 ainda salva em UTF-16, que o
    leitor utf-8 do loop não perdoa). No PowerShell: `Set-Content
    fila\hoje.txt -Value "executar:..." -Encoding ascii` e conferir com
    `Get-Content`. A ordem entra no terminal, nunca no editor.

## 9. Próximos passos (fila do ROTEIRO, ordem recomendada)
0. **B17 lei-do-só-olhar com mão (ACHADO 22/09) — ✅ ENTREGUE (ordem do dono
   24/09, `b13ee6a`)** — `executar()` consulta `SO_OLHAR`: `--so-olhar` não
   cria arquivo nenhum ("a regra X espera o seu sim"); a cena do portão provou
   ("modo observacao -> propor vazio, cerebro imutavel, executar sem mao") e a
   ajuda ficou honesta. No mesmo tijolo saiu a blindagem Windows
   (`8333c1e`): `processo_vivo()` no lugar do `os.kill(pid, 0)` que, no
   Windows, era um Ctrl+C de verdade na cena da trava. **Pendente a prova
   final na máquina dele: verificar-tudo.bat no Windows.**
1. **F3 diário-de-evolução** — narrativa que o agente conta do que aprendeu +
   taxa de alucinação (propostas÷aprovadas). Fica POR ÚLTIMO (ordem do dono
   24/09); a ordem do próximo tijolo é palavra do Guilherme.
2. **C1 matcher semântico** — difflib + TF-IDF/cosseno stdlib (a "IA de verdade"
   do projeto; cache semântico e grounding de brinde).
3. F4 checksum anticorrupção; V3 relatório matutino; C2 ε-greedy sobre o placar
   B15; P4 alarme de novidade; P1 MIT+pyproject+CLI; P2 repo demo público com
   fixtures (decisão dele); V1 ReadDirectoryChangesW/ctypes; V4 voz offline SAPI.
- Roadmap eterno e justificativas: `parceiro/ROTEIRO.md`.
- Posicionamento de venda (âncoras): "o agente propõe, o teste decide, o humano
  aprova" · "o pull é o meu sim" · "silêncio = sucesso" · ensaio em mundo falso +
  custo zero + auditável = o que n8n não entrega local.

## 10. PRIMEIRAS AÇÕES da IA nesta conversa nova (checklist)
- [ ] Rodar seção 6.1-6.3 (recuperar ponte + validar verde) e conferir contra
      `git log` da ponte se este arquivo está atualizado.
- [ ] Ler os 2 últimos registros de `parceiro/ESTADO.md` (verdade fresca).
- [ ] Perguntar a ele: "seu puxar pós-B16 já rodou? qual o placar do verificar?"
- [ ] Se ele cobrar "passou tudo pro PR?": explicar que PR é da sessão
      dona do branch; recuperar é pela ponte; se quiser, atualizo meu espelho e
      abro PR novo da minha rampa.
- [ ] Cumprimentar curto, resumir em ≤6 linhas, propor 1 tijolo (F3) e esperar o ok.
- [ ] Qualquer entrega: ciclo da seção 6 inteiro, e atualizar ESTADO + este arquivo
      (seção 7) no MESMO push.
