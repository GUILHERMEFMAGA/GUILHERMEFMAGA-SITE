# 🧭 PONTO DE RETOMADA — LEIA PRIMEIRO (atualizado em 2026-09-13)

Este arquivo existe para QUALQUER agente (ou humano) novo se situar em 2 minutos
sem depender de memória de conversa anterior. Depois de ler, leia também
`docs/CONTINUIDADE_AGENT_MODE.md` (diário completo, regras e lições).

## ONDE ESTAMOS
- **Branch de trabalho (única autorizada):** `arena/01a08d8e-guilhermefmaga-site` — é a branch do **PR #4** (aberto; PRs #2/#3 também ficam abertos). A `main` está VELHA — nunca basear trabalho nela. (Sessão Arena de 13/09: a branch fixa era `arena/01a09bca-guilhermefmaga-site`, espelhando 100% esta — cada fetch alinha a ponta.)
- **Última release publicada: r79** — "VOZ" (o item 38 da leva de 19, a "obra grande" do STT local — era a reserva r77, publicada como r79 porque o selo segue a ordem de publicação): `falar`/`ouvir` transcreve um comando DITO com whisper.cpp 100% local (o áudio NUNCA sai do PC); `stt` mostra o status; `baixar stt` baixa o programa (zip oficial v1.8.6 do whisper.cpp) + o modelo base (~142 MB) da HuggingFace — SEMPRE com 'sim' explícito (regra combinada); tudo em `_stt/`; kill-switch `stt_local`; sounddevice entrou no requirements.txt. Antes: r78 "AUTOMAÇÃO PROFISSIONAL" (Agendador do Windows), r76 "CONHECIMENTO E CASA AMPLIADA", r75 "A CASA", r74 "RITMO E CÉU" (dry-run), r73 "BOAS-VINDAS DE VOLTA" (`sessao.json`), r72 honestidade, r71 cérebro persistente.
- **Suíte: 871 testes OK** (skipped=3). `agente.py`: ~39,7 mil linhas, 513 ferramentas @tool, 24+6+7+6+1+2 rotas de comando. Selo atual: `[Motor e avaliacao local 2026-09-11-r79]` (o número r77 não foi usado — o STT saiu na ordem de publicação).
- **Auditoria completa 2026-09-13: TUDO CERTO** (0 nomes indefinidos, 0 rotas mortas, 0 duplicatas; laudo em `esqueletos_ideias/2026-09-13-auditoria-completa.md`).

## HISTÓRIA RECENTE (resumo — o resto está no diário)
- r64–r65: autodiagnóstico na abertura + guarda anti-invenção. r66: gatilhos de atualização. r67: lote de 20 (velocímetro, checkpoints, modo avião, config, `sair e atualizar`...). r68: lote de 30 (cérebro indexa, duplicatas, rpg, organizador, geladeira...). r69: NÚCLEO ABSURDO (pesos/erosão/conhecimento/EMA/fases no motor). r70: FORA DO PADRÃO (fatso por overlap, revisor que corrige o modelo, modo detalhado, dica de próximo passo). **r71: CÉREBRO PERSISTENTE** (`cerebro.json` — o que o usuário ensina SOBREVIVE ao fechar; `esquecer <frase>`; `listar aprendizado`; requirements.txt pinado entregue pelo `atualizar agora`). **r72: HONESTIDADE** (pergunta pessoal sem fato = aula de ensinar, nunca papo furado). **r73: BOAS-VINDAS DE VOLTA**. **r74: RITMO E CÉU** (`replay erros`, `testar malha`, `guardiao gatilhos`, `traduzir rota <frase>`, `criar rota <gatilho>: <ação>`, `aquecer as HH:MM` — tudo dry-run). **r75: A CASA** (`fila: <tarefa>`, `cron adicionar <nome> as HH:MM: <tarefa>` c/ dias da semana, `diario lentidao`, `sandbox: <código>` com 'sim', `cofre chaves` c/ DPAPI, `modo convidado`/`sair do modo convidado`). **r76: CONHECIMENTO E CASA AMPLIADA** (`exportar cerebro`, `importar cerebro: <arquivo>` c/ mescla, `diff cerebro` "o que aprendi esta semana?", `auditoria completa` relatório único, `ver <imagem>` visão c/ modelo SEPARADO, `manual` gerado do próprio código). **r78: AUTOMAÇÃO PROFISSIONAL** (`agendar windows <nome> as HH:MM: <comando>` no Agendador do Windows — roda com o agente fechado; + correção real do parse da rota cron da r75). **r79: VOZ** (`falar`/`ouvir` com STT local whisper.cpp; `stt` status; `baixar stt` com 'sim' explícito; audio nunca sai do PC; LEVA DE 19 ITENS COMPLETA: r74 = 31–37 ✓; r75 = 28,29,30,39,40,41 ✓; r76 = 14,15,42,43,44 ✓; r79 = 38 STT ✓).
- r70/r71 PROVADAS e2e NO PC REAL do dono (fato ensinado respondido na hora com fonte; revisor flagrou mentira do GGUF; cascata r64→r71 num único `atualizar agora`).

## ONDE O DONO ESTÁ / PRÓXIMOS PASSOS
1. **O PC do dono está na r71** — ele ainda vai rodar `atualizar agora` pra pular de uma vez pra r79 (r72+r73+r74+r75+r76+r78+r79); cobrar prints da abertura com o BOAS-VINDAS DE VOLTA.
2. **Leva autorizada pelo dono: 19 itens da LISTA-IMPOSSIVEL** (`esqueletos_ideias/2026-09-13-lista-impossivel-ia-local.md`) — **LEVA DE 19 ITENS COMPLETA** (r74 = 31–37; r75 = 28,29,30,39,40,41; r76 = 14,15,42,43,44; r78 = automação profissional a pedido do dono; r79 = 38 STT local). O 'sim' explícito do dono para o download do whisper.cpp foi dado em 13/09; no PC dele o `baixar stt` confirma de novo (regra da casa).
3. LISTA-100 (50 funções + 50 ferramentas do dia a dia, SÓ PROPOSTA) segue à disposição do dono.
4. Diretriz do dono (13/09, após r74): elevar o NÍVEL DE PADRÃO para "super-agente" — novas ferramentas/funções + aprimorar tudo do agente e da IA local (NADA é tirado); ao fim das próximas releases, entregar também uma lista de ideias do próprio agente (SÓ PROPOSTA).
5. **Obra grande combinada (opção B): RAG dos documentos do dono** — agente indexa o CONTEÚDO dos arquivos dele e responde por eles (100% local). Só começar quando o dono pedir.

## REGRAS DE OURO (valem SEMPRE — detalhes no diário)
- Dono é LEIGO: português claro, comandos PRONTOS pra colar, um por vez; pedir print de qualquer erro.
- NUNCA apagar nada (só aprimorar); nunca memória de longo prazo oculta (r33); esqueletos em `esqueletos_ideias/` (r29); listas de ideias = SÓ PROPOSTA com anti-colisão (r30) antes de implementar.
- IA 100% LOCAL (nuvem só se o dono digitar `ligar ia`); GGUF só troca com "sim" explícito; responder com FATOS, nunca com conselho técnico inventado.
- Toda funcionalidade nova tem kill-switch na config (`_r67_ler_config`).
- Testes NUNCA importam agente.py — usam o loader de `tests/test_roteamento_conversa.py` (estender tupla até `'_rN_'` novo). A cada release: bump do selo `2026-09-11-rN` + cascata do selo em TODOS os testes.
- Publicar: commit + push NESTA branch + comentário no PR #4 (padrão `/tmp/msg.txt` + `gh pr comment 4 --repo GUILHERMEFMAGA/GUILHERMEFMAGA-SITE --body-file ...`). Corpo/docs do diário: SEMPRE editar com cwd no repo.
- Cuidados de sandbox: venv evapora (recriar: `python3 -m venv /tmp/pr3check/.venv && /tmp/pr3check/.venv/bin/pip install -q -r requirements-tests.txt`); remoto pode andar sozinho (cura: `git fetch origin arena/01a08d8e-guilhermefmaga-site` + `git reset --soft FETCH_HEAD` se HEAD divergir); REM com parêntese dentro de bloco `if (...)` no .bat fecha o bloco.

## COMO PROVAR QUE VOCÊ ESTÁ NO LUGAR CERTO
```
python3 -m venv /tmp/pr3check/.venv && /tmp/pr3check/.venv/bin/pip install -q -r requirements-tests.txt
cd /home/user/GUILHERMEFMAGA-SITE  (ou onde estiver o clone)
/tmp/pr3check/.venv/bin/python -m unittest discover -s tests -q
```
Esperado: `Ran 871 tests ... OK (skipped=3)` e o selo `-r79` em agente.py. Deu certo? Você está EXATAMENTE onde paramos.

## MAPA DOS ARQUIVOS QUE IMPORTAM
- `agente.py` — o cérebro todo (monólito de propósito; não reformar sem pedido).
- `main.py`, `iniciar.bat`, `requirements.txt` — lançador/BAT/deps (entregues pelo `atualizar agora`, r62).
- `docs/CONTINUIDADE_AGENT_MODE.md` — diário completo r1→r79 + regras + lições + posicionamento honesto.
- `esqueletos_ideias/` — listas (20/30/50+40/80/100/impossível = SÓ PROPOSTA), análise de lacunas, auditoria.
- `tests/` — 87 arquivos, 871 testes (loader em test_roteamento_conversa.py).
