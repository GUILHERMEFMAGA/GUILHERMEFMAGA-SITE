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
| Rascunhos | `fluxos/rascunhos/` | propostas dele esperando minha decisão (`ativa: true` = aprovo) |
| Fila | `fila/*.txt` | minhas ordens: `executar:`, `abrir:` ou `avisar:` |
| Museu | `fila/feitas/` + `fila/erros/` | para onde cada ordem vai depois de atendida |
| Prova do crime | `relatorios/` | relatórios da fila + inventários dos olhos (desktop, downloads) |
| Memória | `memoria/` | diário (`historico.json`) e contadores — nunca vai pro GitHub |
| Portão | `testes/testar_regras.py` | mundo falso onde toda regra nova é testada antes de valer |
| Raio-X | `testes/raio_x.py` | fotografa o corpo inteiro, lê tudo, não toca em nada |
| Vigia noturno | `rodar_de_madrugada.bat` | roda agendado em modo observação: olha, anota, não encosta em nada |
| Botão de salvar | `salvar-tudo.bat` | meu ritual do Git (add → commit → push) num duplo clique |

## 🚀 Uso diário (os 4 comandos que importam)

```
python agente\loop.py          :: atende a fila, olha o mundo, decide, aprende
python testes\raio_x.py        :: laudo de saúde do corpo inteiro (só lê)
python testes\testar_regras.py :: portão — prova o cérebro num mundo de mentira
.\salvar-tudo.bat              :: Git: add, commit, push, sem digitar nada
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
| 6 | organizar de verdade (mover/agrupar por regra) e GitHub Actions | 🔜 |

## 🧠 Frases-guia do projeto

- "silêncio = sucesso" — se a fila não reclama, está tudo certo
- "o Git enxerga o disco, não a tela"
- "mão na massa exige testemunha"
- "só entra na coleira o que não altera nada"
- "o porteiro observa e anota; agir sozinho, jamais"
- "corrente puxa, coleira segura — de madrugada nada abre janela"
- "o agente abre a porta, mas nunca engole a chave"
- "o cabeçalho do arquivo é o crachá"