# ROTEIRO DE ENGENHARIA — Operação Motor Real

Missão: agente de IA **real** (aprende, decide, age) que roda no PC, **sem API, sem
nuvem, sem custo**, escrito em Python puro da biblioteca padrão — e publicável na
internet como projeto open-source de referência.

Correção de rota honesta: não vencemos o Claude na arena dele (raciocínio geral
exige bilhões de parâmetros pagos). Vencemos na arena onde ele não entra:
autonomia em tempo real na máquina, zero custo, zero dado que sai, 100% auditável,
roda em qualquer Windows. "IA sem API" = estatística clássica bem feita. Ponto.

## Leis de ferro (congeladas para sempre — nada aqui as altera)

1. O agente propõe. O teste decide. O humano aprova.
2. Lá fora é vidro: lermos, nunca tocamos sem coleira + três cadeados + testemunha.
3. Madrugada abre/executar = fila. Git é sagrado e humano.
4. Entrega = ponte: verde no portão+raio do parceiro ANTES do push; dupla
   testemunha (clone do parceiro + máquina do dono).
5. Duplo clique do dono é o único "sim" que muda código na máquina.
6. Cada fase adiciona; nada remove. Retrocompatibilidade é lei de convivência.

## Fase F — Fundação

| # | Entregável | Estado |
|---|---|---|
| F1 | B13 olhos de saúde: pulso RAM/disco a cada tick + resumo da madrugada | ✅ |
| F2 | B14 lei da não-redundância: raio-x detecta função de corpo idêntico (AST normalizada) | ✅ |
| F3 | B15 diário de evolução: `memoria/diario-evolucao.txt` (1 linha por versão + negativos aprendidos); raio-x cobra atualização | 🔜 |

## Fase C — Cognição (a "IA" de verdade, sem rede neural paga)

| # | Entregável | Técnica (stdlib only) |
|---|---|---|
| C1 | Matcher semântico: pedidos da fila e gatilhos deixam de bater por igualdade exata e passam por similaridade — `difflib` para erro de digitação + TF-IDF/cosseno para sinônimos. `organiza meus pdfs` acorda a corrente `pdf-no-downloads` | collections, math, unicodedata |
| C2 | Pesos de regra (contextual bandit ε-greedy): regra que funciona é proposta mais; regra rejeitada decai sozinha (o "DESISTE" vira matemática, não print) | random + contadores em memoria/pesos.json |
| C3 | Planejador: meta → sequência de passos com pré/pós-condições e rollbacks (A* num grafo pequeno, heapq) — correntes ganham um autor só | heapq, ast dos gatilhos |

Aceite: cena nova no portão para C1/C2/C3 + ensaio no mundo falso + raio-x sabendo checar.

## Fase V — Vitals (tempo real profissional)

| # | Entregável | Técnica |
|---|---|---|
| V1 | Porteiro por EVENTO, não por 15-min: ReadDirectoryChangesW via ctypes (overlapped), polling vira fallback se a API falhar | ctypes, threading |
| V2 | Cérebro em SQLite: diário/vigilia/pesos migram de JSON para `memoria/cerebro.db` (sqlite3 stdlib) com importador de uma tacada; consultas tipo "quantas noites com fome" | sqlite3 |
| V3 | Relatório matutino do agente para o humano: gerado por template + estatística do SQLite (sem LLM, sem alucinação) | string.Template |

## Fase P — Publicação (a internet)

| # | Entregável |
|---|---|
| P1 | Licença MIT, `pyproject.toml`, CLI `super-agente` (argparse: tick/olhar/fila/relatorio), docstring em tudo |
| P2 | Repo PÚBLICO demo `super-agente-open` com fixtures limpos (memória real NUNCA vai); o repo do dono segue privado |
| P3 | Docs no site do GUILHERMEFMAGA: série "Construa um agente sem pagar API", um capítulo por fase — código do blog = o próprio ROTEIRO expandido |

## Regras de entrega (inalteráveis)

Um tijolo por vez → portão+raio verdes no clone do parceiro → push na ponte →
aviso → duplo clique do dono → verificar-tudo → verde na máquina real.
Qualquer teste vermelho: o tijolo não sai da bancada, e a falha vira teste novo.
