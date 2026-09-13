# 🧭 PONTO DE RETOMADA — LEIA PRIMEIRO (atualizado em 2026-09-13)

Este arquivo existe para QUALQUER agente (ou humano) novo se situar em 2 minutos
sem depender de memória de conversa anterior. Depois de ler, leia também
`docs/CONTINUIDADE_AGENT_MODE.md` (diário completo, regras e lições).

## ONDE ESTAMOS
- **Branch de trabalho (única autorizada):** `arena/01a08d8e-guilhermefmaga-site` — é a branch do **PR #4** (aberto; PRs #2/#3 também ficam abertos). A `main` está VELHA — nunca basear trabalho nela.
- **Última release publicada: r73** — "BOAS-VINDAS DE VOLTA" (agente percebe sua falta e sauda com o estado do cérebro; `sessao.json`; kill-switch `boas_vindas: false`). HEAD atual: commit `255faab` (r73) + `6cb96c5` (lista-100) + `e8072fb` (auditoria completa).
- **Suíte: 765 testes OK** (skipped=3). `agente.py`: 37.461 linhas, 1.216 funções de topo, 513 ferramentas @tool, 24 rotas de comando. Selo atual: `[Motor e avaliacao local 2026-09-11-r73]`.
- **Auditoria completa 2026-09-13: TUDO CERTO** (0 nomes indefinidos, 0 rotas mortas, 0 duplicatas; laudo em `esqueletos_ideias/2026-09-13-auditoria-completa.md`).

## HISTÓRIA RECENTE (resumo — o resto está no diário)
- r64–r65: autodiagnóstico na abertura + guarda anti-invenção. r66: gatilhos de atualização. r67: lote de 20 (velocímetro, checkpoints, modo avião, config, `sair e atualizar`...). r68: lote de 30 (cérebro indexa, duplicatas, rpg, organizador, geladeira...). r69: NÚCLEO ABSURDO (pesos/erosão/conhecimento/EMA/fases no motor). r70: FORA DO PADRÃO (fatso por overlap, revisor que corrige o modelo, modo detalhado, dica de próximo passo). **r71: CÉREBRO PERSISTENTE** (`cerebro.json` — o que o usuário ensina SOBREVIVE ao fechar; `esquecer <frase>`; `listar aprendizado`; requirements.txt pinado entregue pelo `atualizar agora`). **r72: HONESTIDADE** (pergunta pessoal sem fato = aula de ensinar, nunca papo furado). **r73: BOAS-VINDAS DE VOLTA**.
- r70/r71 PROVADAS e2e NO PC REAL do dono (fato ensinado respondido na hora com fonte; revisor flagrou mentira do GGUF; cascata r64→r71 num único `atualizar agora`).

## ONDE O DONO ESTÁ / PRÓXIMOS PASSOS
1. **O PC do dono está na r71** — ele ainda vai rodar `atualizar agora` pra pegar r72+r73 (fluxo: comando pronto, ele fecha e reabre sozinho).
2. **Dono vai escolher números da LISTA-100** (`esqueletos_ideias/2026-09-13-lista100-funcoes-e-ferramentas.md` — 50 funções + 50 ferramentas do dia a dia, SÓ PROPOSTA). Implementar SOMENTE os números que ele pedir.
3. **Obra grande combinada (opção B): RAG dos documentos do dono** — agente indexa o CONTEÚDO dos arquivos dele e responde por eles (100% local). Só começar quando o dono pedir.
4. Outras obras na fila (só com pedido): STT local (falar com o agente), visão local real, manual do usuário.

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
Esperado: `Ran 765 tests ... OK (skipped=3)` e o selo `-r73` em agente.py. Deu certo? Você está EXATAMENTE onde paramos.

## MAPA DOS ARQUIVOS QUE IMPORTAM
- `agente.py` — o cérebro todo (monólito de propósito; não reformar sem pedido).
- `main.py`, `iniciar.bat`, `requirements.txt` — lançador/BAT/deps (entregues pelo `atualizar agora`, r62).
- `docs/CONTINUIDADE_AGENT_MODE.md` — diário completo r1→r73 + regras + lições + posicionamento honesto.
- `esqueletos_ideias/` — listas (20/30/50+40/80/100 = SÓ PROPOSTA), análise de lacunas, auditoria.
- `tests/` — 71 arquivos, 765 testes (loader em test_roteamento_conversa.py).
