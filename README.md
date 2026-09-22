# 🤖 Super Agente

Agente que roda 100% no meu PC: sem API paga, sem nuvem, sem Ollama.
Só Python puro + Git + VS Code. Ele lê o mundo, obedece ordens da fila,
abre arquivos pra mim, aprende com o próprio histórico e **nunca** faz nada
sem passar pelo portão de testes.

## ⚖️ Regra de ferro (a lei do projeto)

> **O agente propõe. O teste decide. O humano aprova.**

Nenhuma regra entra no cérebro sem ensaiar num mundo de mentirinha, e nenhuma
mudança se autopromove quando eu não estou olhando (modo `--so-olhar`).

## 🧬 Anatomia — o que é cada pasta

| Parte | Arquivo | O que faz |
|---|---|---|
| Corpo | `agente/loop.py` | o laço: ver → olhar o mundo → decidir → fazer → lembrar → contar → propor |
| Cérebro | `fluxos/regras.json` | as regras que ele sabe obedecer; fora daqui, ele não existe |
| Coleira | `fluxos/regras.json` → bloco `execucao.permitidas` | a ÚNICA lista de comandos que ele pode executar |
| Porta | `fluxos/regras.json` → bloco `abrir` | áreas liberadas (`projeto`, `desktop`, `downloads`) + 21 extensões banidas |
| Correntes | `fluxos/regras.json` → bloco `correntes` | gatilhos da vigília que puxam elos blindados: `copiar_para_projeto` (só entra no projeto), `avisar`, `abrir`, `executar` (na noite, vira fila) |
| Saúde | `memoria/saude.txt` (B13) | o pulso do PC a cada tick: RAM, disco e núcleos — só leitura, zero verbo novo na coleira; madrugada contada de manhã |
| Rascunhos | `fluxos/rascunhos/` | propostas dele esperando minha decisão (`ativa: true` = aprovo) |
| Fila | `fila/*.txt` | minhas ordens: `executar:`, `abrir:` ou `avisar:` |
| Museu | `fila/feitas/` + `fila/erros/` | para onde cada ordem vai depois de atendida |
| Prova do crime | `relatorios/` | relatórios da fila + inventários dos olhos (desktop, downloads) |
| Memória | `memoria/` | diário (`historico.json`) e contadores — nunca vai pro GitHub |
| Portão | `testes/testar_regras.py` | mundo falso onde toda regra nova é testada antes de valer |
| Raio-X | `testes/raio_x.py` | fotografa o corpo inteiro, lê tudo, não toca em nada |
| Vigia noturno | `rodar_de_madrugada.bat` | roda agendado em modo observação: olha, anota, não encosta em nada |
| Botão de salvar | `salvar-tudo.bat` | meu ritual do Git (add → commit → ponte → backup) num duplo clique |
| Botão de sincronizar | `puxar-atualizacao.bat` | baixa da ponte as atualizações do parceiro (ver seção 🌉); o duplo-clique é o único "sim" que deixa código novo entrar no PC |

## 🚀 Uso diário (os 4 comandos que importam)

```
python agente\loop.py                    :: atende a fila, olha o mundo, decide, aprende
python agente\loop.py --vigiar --ensaiar :: dry-run: mostra o plano dos fluxos sem tocar em nada
python testes\raio_x.py                  :: laudo de saúde do corpo inteiro (só lê)
python testes\testar_regras.py            :: portão — prova o cérebro num mundo de mentira
.\salvar-tudo.bat                        :: Git: add, commit, ponte + backup, sem digitar nada
```

### Dar uma ordem na fila (terminal, uma linha)

```
Set-Content fila\hoje.txt -Value "executar:git status" -Encoding ascii
Set-Content fila\abre.txt  -Value "abrir:relatorios/inventario-desktop.txt" -Encoding ascii
Set-Content fila\lembra.txt -Value "avisar:revisar a fila sexta-feira" -Encoding ascii
```

- `executar:` roda o comando **se** ele estiver na coleira (leitura pura, `shell=False`, timeout 15s);
- `abrir:` abre arquivo/pasta no app padrão do Windows, **só** dentro das áreas liberadas
  e **nunca** um executável (`.exe`, `.bat`, `.ps1`, `.lnk`… são 21 extensões banidas);
- `avisar:` só anota o recado.

Depois de rodar, a prova fica em `relatorios\fila-<nome>.txt` e a ordem muda pra
`fila\feitas\`. Ordem que falha vai pra `fila\erros\` — e o fiscal fica repetindo o
aviso até eu dar baixa (ler, corrigir, devolver pra fila, ou apagar).

## 🌙 O porteiro (`--vigiar`)

O porteiro compara as pastas vigiadas (bloco `vigilia` do cérebro) com o último
retrato guardado em `memoria\vigilia.json`. Primeira visita = calibra e fica
quieto. Depois disso, arquivo novo ou que mudou vira evento — mas só quando
amadureceu (mais velho que `tolerancia_seg`, pra não gritar com download pela
metade). Cada evento reage **só** com o vocabulário aprovado: `inventario`,
`{"anotar": ...}` e `{"anotar_fila": "executar:|abrir:|avisar:..."}`. À noite
(`tick.bat`) ele anota e enfileira; nada é executado sem a rodada com
testemunha. Relógio (opcional, uma linha no terminal, sem admin):

```
schtasks /Create /TN "SuperAgente Tick" /TR "C:\super-agente\tick.bat" /SC MINUTE /MO 15 /F
```

## ⛓️ Correntes (`bloco correntes` do cérebro)

Quando o porteiro nota um arquivo, cada **gatilho** que bater (olho + extensão)
roda suas **etapas**, em ordem, na mesma rodada. Vocabulário de elos — nada fora
disso executa:

- `copiar_para_projeto` → só copia PRA DENTRO do projeto (destino com `..` ou de fora = barrado);
  a cópia mora em `entrada/`, que o `.gitignore` protege — meus PDFs privados não vão pro GitHub;
- `avisar` → uma linha no caderno `memoria\vigilia.log`;
- `abrir` → de DIA abre no app padrão (passando pelos 3 cadeados); À NOITE vira fila;
- `executar` → de DIA passa pela coleira (leitura pura); À NOITE vira fila.

Cada elo tem limite por arquivo (`max_por_arquivo`, padrão 3) — corrente que
gritaria toda hora simplesmente dorme. Corrente nenhuma apaga nem move nada do
mundo real: o porteiro copia, nunca engole.

## ⚙️ Motor de Fluxos (bloco `fluxos` — a evolução das correntes)

Gatilhos **declarativos** com condição, estilo n8n, dentro do cérebro
(`fluxos/regras.json` → bloco `fluxos`):

- `quando` decide a *ficha* do arquivo: `olho`, `extensao`, `nome_contem`,
  `tamanho_min_kb`, `tamanho_max_kb` — só `.txt` com "nota" e ≥ 1 KB, por exemplo;
- `passos` rodam em ordem pelo **mesmo vocabulário blindado** das correntes
  (`copiar_para_projeto`, `avisar`, `abrir`, `executar`), e cada passo pode ter
  seu próprio `se` (condição sobre o mesmo vocabulário de `quando`);
- herdam limites por arquivo, viram fila na madrugada, e o
  `--vigiar --ensaiar` imprime **o plano inteiro sem escrever nada, sem
  enfileirar e sem gastar limite** (dry-run de verdade).

As correntes da B12 continuam valendo em paralelo — compatibilidade é lei de
convivência (nada remove, tudo acrescenta).

## 🛡️ Por que dá pra confiar nele

- **Allowlist**: só executa os comandos de leitura da coleira; símbolos de injeção
  (`&&`, `|`, `>`, `;`, crase, aspas) barrados antes de qualquer coisa.
- **Três cadeados no abrir**: dentro de áreas liberadas + extensão não banida +
  caminho real resolvido (fuga por `..\` não engana). Fora do Windows ele confessa
  que não abriu em vez de fingir.
- **Vidro, não canivete**: pode LER o Desktop e o Downloads, mas só ESCREVE dentro do projeto.
- **Testemunha obrigatória**: fila, abrir e autopromoção só funcionam com humano presente.
- **Git é sagrado**: `git add/commit/push` jamais entram na coleira — só no botão meu.
- **.gitignore**: memória, fila, relatórios e segredos nunca sobem pro GitHub.

## 📈 Níveis alcançados

| Nível | Poder | Status |
|---|---|---|
| 1 | laço ver → decidir → agir → lembrar | ✅ |
| 2 | cérebro externo em JSON (regras) | ✅ |
| 2.5 | memória, contadores, crônicos, enterrar ideias | ✅ |
| 3 | olhos no mundo real (desktop + downloads) | ✅ |
| 4 | auto-melhoria com portão (rascunho → ensaio → aprovação humana) | ✅ |
| 4.5 | fila com coleira, fiscal e raio-x de diagnóstico | ✅ |
| 5 | abrir arquivos e pastas com três cadeados (`abrir:`) | ✅ |
| 5.5 | porteiro de plantão: vigia pastas e reage só pelo vocabulário (`--vigiar`) | ✅ |
| 5.7 | correntes: gatilho da vigília puxa elos blindados; madrugada vira fila | ✅ |
| 5.8 | ponte de entregas com o parceiro (push → puxar → verificar → salvar), sem colar código | ✅ |
| 5.9 | olhos de saúde: pulso do PC a cada tick + resumo da madrugada (B13) | ✅ |
| 5.10 | lei da não-redundância no raio-x (cópia de função = dívida detectada) + roteiro de engenharia F→C→V→P | ✅ |
| 6 | **motor de fluxos**: gatilhos declarativos com condição por passo + dry-run `--ensaiar` | ✅ |
| 6.5 | reorganizar o mundo com permissão (mover/agrupar com rollback) e CI | 🔜 |

## 🧠 Frases-guia do projeto

- "silêncio = sucesso" — se a fila não reclama, está tudo certo
- "o Git enxerga o disco, não a tela"
- "mão na massa exige testemunha"
- "só entra na coleira o que não altera nada"
- "o porteiro observa e anota; agir sozinho, jamais"
- "corrente puxa, coleira segura — de madrugada nada abre janela"
- "o agente abre a porta, mas nunca engole a chave"
- "o cabeçalho do arquivo é o crachá"
- "pull é o meu sim: nada entra no PC sem duplo clique"

## 🌉 Sync com o parceiro (a ponte)

As entregas do parceiro (Arena) chegam pela **ponte**: o repo do site
(`GUILHERMEFMAGA-SITE`) tem um branch chamado `super-agente` onde ele publica,
sempre com portão + raio-x verdes antes do push. O repo `super-agente` segue
sendo meu backup. Nada muda no meu dia a dia sem os três botões:

1. quando o parceiro avisar "tem coisa na ponte": `.\puxar-atualizacao.bat` (traz
   só o que é fast-forward; se eu mexi sem salvar, ele recusa e nada quebra);
2. `.\verificar-tudo.bat` (raio-x + portão — o exame de saúde);
3. `.\salvar-tudo.bat` (empurra para a ponte **e** para o backup).

O que eu ganhei com isso: código novo chega por botão — nunca mais copiar e colar
trecho no editor. O que eu não abri mão: **duplo-clique é o meu sim**; nenhuma
entrega entra no PC sem eu rodar o puxar, e nada pula o portão.