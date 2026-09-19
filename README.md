# 🤖 Super Agente

Agente que roda 100% no meu PC: sem API paga, sem nuvem, sem Ollama.
Só Python puro + Git + VS Code. Ele lê o mundo, obedece ordens da fila,
aprende com o próprio histórico e **nunca** faz nada sem passar pelo portão de testes.

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
| Rascunhos | `fluxos/rascunhos/` | propostas dele esperando minha decisão (`ativa: true` = aprovo) |
| Fila | `fila/*.txt` | minhas ordens do dia, no formato `executar:...` ou `avisar:...` |
| Museum | `fila/feitas/` + `fila/erros/` | para onde cada ordem vai depois de atendida |
| Prova do crime | `relatorios/` | relatórios da fila + inventários dos olhos (desktop, downloads) |
| Memória | `memoria/` | diário (`historico.json`) e contadores — nunca vai pro GitHub |
| Portão | `testes/testar_regras.py` | mundo falso onde toda regra nova é testada antes de valer |
| Raio-X | `testes/raio_x.py` | fotografa o corpo inteiro, lê tudo, não toca em nada |
| Vigia noturno | `rodar_de_madrugada.bat` | roda agendado em modo observação: olha, anota, não encosta em nada |
| Botão de salvar | `salvar-tudo.bat` | meu ritual do Git (add → commit → push) num duplo clique |

## 🚀 Uso diário (os 4 comandos que importam)