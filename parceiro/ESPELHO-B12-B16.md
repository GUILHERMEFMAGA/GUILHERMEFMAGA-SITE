# Super Agente B12→B16 — espelho completo (correntes, fluxos, aprendizado, blindagens) — #5

> **Espelho canônico da ponte `super-agente`.** Este arquivo é a fotografia viva do que está publicado na ponte e que sua máquina recebe com `puxar-atualizacao.bat`. Sempre que um tijolo novo for publicado (B17, F3, C1...), este espelho é atualizado no MESMO push — é a regra do projeto.

**Ponte tip:** `d483d11` (capsula PROMPT FIXO definitivo) — base `8907a0e`/`2bba1ff` com B16 publicada  
**Gerado em:** 2026-09-22 21:42 UTC — branch `arena/01a0cb11-guilhermefmaga-site` recuperado da ponte (clone limpo + portão 17/17 + raio 0 problemas)  
**Onde vivem os códigos:** todos os arquivos abaixo estão no repo; este espelho só aponta e resume — o `View all changes` da sessão mostra o diff byte-a-byte.

---

## 1) Mapa dos códigos (view all changes — o que você vê na lateral)

| Arquivo | Linhas | Papel | B que o introduziu |
|---|---|---|---|
| `agente/loop.py` | 1495 | corpo: ver→olhar→decidir→fazer→lembrar→contar→propor + vigiar + correntes + saúde + fluxos + experiência + blindagens | B12→B16 |
| `fluxos/regras.json` | 174 | cérebro: auto_promocao / mundo / execucao / abrir / vigilia / correntes / fluxos / aprendizado | B12→B16 |
| `testes/testar_regras.py` | 586 | **PORTÃO** — 17 cenas no mundo falso, 21 impressões, exit 0 = cérebro válido | B12→B16 |
| `testes/raio_x.py` | 983 | **RAIO-X** — ~21 checagens do corpo inteiro, só lê | B12→B16 |
| `parceiro/PROMPT-RECUPERACAO.md` | 287 | cápsula do projeto (recuperação, leis, arquitetura, armadilhas) | B16 |
| `parceiro/ESTADO.md` | 280 | memória viva por entrega | B16 |
| `parceiro/ROTEIRO.md` | 180 | plano F→C→V→P + triagem das 60 ideias | B14-B16 |
| `README.md` | — | doc do produto + Sync com o parceiro (ponte) | B16 |
| `puxar-atualizacao.bat` | 36 | duplo-clique que traz da ponte (fast-forward) | ponte v3 |
| `verificar-tudo.bat` | 26 | duplo-clique que roda raio + portão | — |
| `salvar-tudo.bat` | 65 | duplo-clique que empurra ponte + backup | ponte v2 |
| `tick.bat` | 10 | tarefa agendada SuperAgente Tick :05/:20/:35/:50 | B13/B16 |
| `rodar_de_madrugada.bat` | 10 | variante noturna | — |
| `.gitignore` | — | protege memória/fila/relatórios/entrada/trava do Git | B12-B16 |
| `.gitattributes` | — | CRLF nos .bat | ponte |

**Placar que este código dá no clone limpo (medido agora, 22/09):**

```
PORTAO ABERTO: 17/17 cenas, 21 linhas, exit 0
RAIO: 20 ok | 9 dicas | 1 aviso | 0 problemas   (clone vazio)
RAIO: 25 ok | 4-5 dicas | 1 aviso | 0 problemas (após 3 rodadas, com diário/saúde/vigília)
VEREDITO: 0 problemas nos dois casos; aviso = desktop/downloads não existem no Linux — normal
```

Clone com estado local existe? → dicas somem (diário, contadores, fila, saúde, snapshot, experiência). O único aviso permanente é o planejador Windows.

---

## 2) B12 — CORRENTES (vigilia dispara elos, estilo n8n local)

**O que entrou:**

- `loop.py` v5 (941 → 1495 ao fim): `corrente_diario()` / `corrente_gatilhos()` / `corrente_etapa()` / `_enfileirar()` / `correntes_para(nome, path)` integrado em `vigiar()`
- Vocabulário de elos (só isso executa): `copiar_para_projeto` (RAIZ/para, sem `..`, mkdir, copy2, "ja existia" pula), `avisar` (append vigilia.log), `abrir` (dia=`executar_abrir` | SO_OLHAR=`_enfileirar`), `executar` (dia=coleira | SO_OLHAR=`_enfileirar`)
- Limite por `(gatilho|arquivo|elo)` `max_por_arquivo` default 3 (clamp 1..50) → elo "dormiu"; diário `memoria/correntes.json`
- `fluxos/regras.json` bloco `correntes` com gatilho demo `pdf-no-downloads` (copiar para `entrada/` + avisar)
- `testes/testar_regras.py` cena correntes (calibra, pdf+png, copiou/ignorou/anotou/recusou, loop 4x tamanhos → dormiu; madrugada SO_OLHAR→ "virou fila")
- `testes/raio_x.py` `checar_correntes` (ids únicos, `se.extensao` com ponto, vocabulário, `para` dentro do projeto, max 1..50) + umbrais loop<905, cenas<16
- `.gitignore` + `entrada/` + `relatorios/corrente-*.txt` antes de `memoria/`

**Arquivo do cérebro (trecho real em `fluxos/regras.json`):**

```json
"correntes": {
  "ligado": true,
  "gatilhos": [{
    "id": "pdf-no-downloads",
    "se": { "olho": "downloads", "extensao": ".pdf" },
    "etapas": [
      { "usar": "copiar_para_projeto", "para": "entrada" },
      { "usar": "avisar", "texto": "pdf novo capturado: %arquivo% (copia em entrada/)" }
    ]
  }]
}
```

**Smoke B12 (provado na máquina dele 22/09):** dia copiou `entrada/` + fila FEITA mesma rodada; tick noturno copiou sem janela; manhã atendeu fila — 13 [ok] no portão.

---

## 3) B13 — OLHOS-DE-SAUDE (fluxos em etapas, lê o PC sem tocar)

- `loop.py` v6 (1069 linhas): `medir_saude()` (ctypes GlobalMemoryStatusEx + shutil.disk_usage + os.cpu_count, só leitura), `linha_saude()`, `bater_ponto_saude()` → `memoria/saude.txt`, `resumo_da_madrugada()` janela 192 batidas, umbrais RAM≥90% ou <5GB livre
- Sem verbo novo na coleira e sem mudança no cérebro (leitura pura)
- `testes/testar_regras.py` cena saúde (6 sub-asserções) → 14 cenas; `testes/raio_x.py` checagem saúde + **linter de .bat** (lição do parêntese solto em `echo` dentro de `if`) + `.gitignore` exigindo `memoria/*.txt`
- `.gitignore` antes vazava `saude.txt` → corrigido

**Linha de pulso (exemplo real do tick):**

```
2026-09-22T03:15 ram=6% disco_livre=42GB nucleos=8 fome=nao
```

---

## 4) Motor de Fluxos v1 — Fase C (o coração, sobrecamada declarativa)

**Filosofia:** correntes B12 continuam ativas em paralelo (retrocompatibilidade é lei). Fluxos acrescentam condição por passo e ensaio sem pedágio.

```json
"fluxos": {
  "ligado": true,
  "gatilhos": [{
    "id": "txt-notas-na-rede",
    "quando": { "olho": "desktop", "extensao": ".txt", "nome_contem": "nota", "tamanho_min_kb": 1 },
    "passos": [
      { "usar": "avisar", "texto": "nota encontrada na mesa: %arquivo%" },
      { "usar": "copiar_para_projeto", "para": "entrada/notas", "se": { "tamanho_max_kb": 100 } }
    ]
  }]
}
```

- `quando` filtra a ficha do arquivo: `olho` / `extensao` / `nome_contem` / `tamanho_min_kb` / `tamanho_max_kb` — normalização acento-case via `unicodedata` (`_txt_normal`)
- `passos` usam o **mesmo vocabulário blindado** das correntes; cada passo pode ter seu `se` — se não bate = pulado e NÃO gasta limite
- Diário único `memoria/correntes.json` com chave `fluxo:<id>|<arquivo>`
- `--vigiar --ensaiar` = dry-run TOTAL: imprime `passo 'X' dispararia`, zero escrita em vigilia/diário/ponto-de-saúde — **argumento anti-n8n**

**Smoke real no clone (ponte):** `tolerancia_seg=30` segurou arquivo de 1s (guarda anti-mentira); após 31s ensaio limpo; execução copiou `entrada/notas/` ✓

---

## 5) B14 — LEI DA NÃO-REDUNDÂNCIA

- `testes/raio_x.py` `checar_duplicacao` — agrupa funções por dump AST sem docstring; cópia = AVISO com local
- Auditoria da casa: **76 funções / 8 arquivos → zero cópia** (depois 98 funções no B16) — casa própria auditada
- `parceiro/ROTEIRO.md` plano mestre F(sustentação)→C(cérebro)→V(vigília real)→P(produto) com técnicas stdlib (difflib, TF-IDF/cosseno, ε-greedy, A*, BM25, SQLite, SAPI)

---

## 6) B15 — APRENDIZADO POR EXPERIÊNCIA (RL honesto, só stdlib)

- Caderno `memoria/aprendizado.json` `{eventos:[[ts, chave, tipo, peso]]}` teto configurável (`limite_eventos` 1200, clamp 50..100000)
- `pesos_aprendido()` decaimento `0.5^(idade/14d)` janela 60d; `conselhos_aprendido()` → `score ≤-2 & ≥2 eventos` ⇒ "aposentar", `score ≥3 & ≥3` ⇒ "confiável", cap 5
- Bloco `aprendizado` no cérebro: `{ligado, janela_dias, meia_vida_dias, limite_eventos}` — raio valida números
- Hooks: `executar` (+1), `_experiencia_elo` nos 2 fluxos (+0.5 / -1), `promover` humano (+2), portão barrou rascunho (-0.5)
- `SO_OLHAR` não escreve; `ENSAIAR` não executa logo não registra; conselho no main: `a experiencia sugere:` — **quem aposenta é você**

**Pesos por evento:**

| Evento | Peso |
|---|---|
| regra criou arquivo esperado (`executar`) | +1 |
| elo de corrente/fluxo rodou limpo | +0.5 |
| elo barrado/falho/fora do vocabulário/pulado | -1 |
| portão barrou rascunho dele | -0.5 |
| você aprovou a ideia (`ativa: true`) | +2 |

**Raio v8:** `checar_aprendizado` + `FERRAMENTAS_DO_CORPO` ganhou 4 funções; `testes/testar_regras.py` v10 cena aprendizado (16 cenas, 19 impressões)

---

## 7) B16 — BLINDAGENS (auditoria de ausências virou código)

**8 lacunas achadas lendo o corpo todo — todas viraram lei com mão:**

1. `so_com_humano` com mão — `executar_comando()` consulta `SO_OLHAR` (com `--so-olhar` veta; fila não anda sem dono)
2. Escrita atômica — `escrever_json()` via `.part` + `fsync` + `os.replace` (queda de luz não corta JSON)
3. Corrompido ≠ ausente — `ler_json()` distingue; corrompido grita em `_CORROMPIDOS` + `ATENCAO` + `exit 1`; ausente = silêncio/recomeço limpo
4. Trava de batida — `memoria/.trava` (pid vivo + ≤600s veta; morto/velho assume; `tick.bat` passa `--trava-velha` = cede a vez)
5. `podar_sombra()` + flag `--podar-sombra` (so-olhar nunca poda; remove fantasmas do snapshot)
6. `_flags()` virou função (descongelou do import) + `--ajuda` + flag desconhecida = `exit 2` com ajuda
7. `politica_mundo_ok()` cobra `mundo.permitido/proibido` no log; `propor()` obedece `so_acoes_de_criar=false`
8. `raio_x.py` `checar_blindagens` caça deco: chave no cérebro sem mão no corpo = PROBLEMA; `.part` solto = AVISO; trava de pid vivo = AVISO

**Portão v11:** 17/17 cenas, 21 impressões — cena blindagens com 12 sub-asserções (fila parada, lei humano, dono roda, trava veta vivo=ppid, vela morta assume, atômica sem sobra, grito corrompido, silêncio ausente, poda×2, deco cobrado, coerente calado)

**Raio v9:** 25 ok | 5 dicas | 1 aviso | 0 problemas (21 checagens, `FERRAMENTAS_DO_CORPO` +7, `checar_blindagens`)

**Leis confirmadas:** deco no cérebro é bug; teste que depende de PID da rua é flaky (usar `ppid`); smoke de mutex com processos sequenciais não prova nada — só a cena prova; `*memoria/*` não cobre dotfiles de repo raiz → padrão `*memoria/*.trava` + `!.gitkeep`.

---

## 8) Onde colar / como provar na sua máquina (ritual amarelo, sempre nesta ordem)

```
Duplo-clique 1: puxar-atualizacao.bat   (recebe — git pull --ff-only site super-agente)
Duplo-clique 2: verificar-tudo.bat      (prova  — raio + portão; esperado: 17 cenas, 0 problemas)
Duplo-clique 3: salvar-tudo.bat         (backup — push 1/2 ponte + 2/2 super-agente.git)
```

- Última linha do .bat com `PRONTO` = deu certo; senão a janela Explica em português.
- `View all changes` aqui no Arena é o espelho do que seu próximo `puxar` trará — `git log` da ponte é a fonte canônica, PR #5 é só vitrine da sessão dona.

---

## 9) Próximo tijolo pendente (decisão sua, 1 ação por rodada)

**ACHADO 22/09 — candidato B17 (recomendado, tijolo pequeno, lei inegociável):** `executar()` (`agente/loop.py` ~linha 165) NÃO consulta `SO_OLHAR` — `--so-olhar` promete "observa, nao toca em nada" mas cria `memoria/base.py` (reproduzido 2×, `git status` vê `?? memoria/base.py`). A cena "modo observacao" do portão só cobre `propor` — por isso 17/17 verde convive com o furo.

- **Opção 1 = B17** — guarda em `executar()` + cena no portão ("só-olhar não cria arquivo") + ajuda alinhada (recomendado)
- **Opção 2 = F3 primeiro** — diário-de-evolução (narrativa que o agente conta do que aprendeu + taxa de alucinação propostas/aprovadas)

> Responda com `1` ou `2` e eu abro o próximo tijolo — **um por vez**, com endereço completo dos arquivos e celebrando cada vitória. Nenhuma entrega sai sem portão+raio verdes.

---

## 10) O corpo por dentro — endereços canônicos (B16 completo)

```
C:\super-agente\
├─ agente\loop.py            # 1495 linhas, 69 funções — ver→olhar→decidir→fazer→lembrar→contar→propor + vigiar + correntes + fluxos + saúde + experiência + blindagens
├─ fluxos\regras.json        # cérebro: auto_promocao, mundo, execucao (coleira), abrir, vigilia (tolerancia_seg=30), correntes, fluxos, aprendizado, acoes
├─ fluxos\rascunhos\*.json   # propostas esperando "ativa": true (seu sim)
├─ fila\*.txt                # ordens: executar: | abrir: | avisar: (só andam com dono presente)
├─ memoria\                  # NUNCA vai pro GitHub: historico.json, contadores.json, vigilia.json, correntes.json, aprendizado.json, saude.txt, .trava
├─ relatorios\               # inventários + saídas da fila
├─ testes\testar_regras.py   # PORTÃO 17 cenas
├─ testes\raio_x.py          # RAIO ~21 checagens
├─ parceiro\ESTADO.md        # memória do parceiro
├─ parceiro\ROTEIRO.md       # plano F→C→V→P + triagem 60 ideias
└─ parceiro\ESPELHO-B12-B16.md  # ESTE ARQUIVO — espelho #5
```

Vocabulário blindado (correntes E fluxos): `copiar_para_projeto`, `abrir`, `avisar`, `executar`.  
Motor de fluxos: `quando` (olho/extensão/nome_contem/tamanho_*_kb) + passos com `se` próprio; passo com `se` que não bate = pulado e NÃO gasta limite; diário `memoria/correntes.json` com chave `fluxo:<id>|<arquivo>`; `--vigiar --ensaiar` = dry-run TOTAL (plano impresso, zero escrita).

---

## 11) Checksum rápido (para seu `verificar-tudo.bat` não mentir)

- Se este espelho disser `d483d11` e seu `git log --oneline -1` disser outro hash, seu `puxar` está desatualizado — rode o amarelo.
- Se o portão fechar, nada é publicado na ponte (lei 6).
- Se o raio achar 1 PROBLEMA, o corpo não vai pro GitHub — conserto vem no próximo tijolo.

> **Lembrete que toda entrega termina assim:** duplo-clique na amarela, nesta ordem SEMPRE: `puxar-atualizacao.bat` (recebe) → `verificar-tudo.bat` (prova) → `salvar-tudo.bat` (backup). Só o seu duplo-clique muda seu PC. O agente publica na ponte; você puxa quando quiser.

