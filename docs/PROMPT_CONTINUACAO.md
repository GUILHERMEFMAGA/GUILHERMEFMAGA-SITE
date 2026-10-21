# PROMPT DE CONTINUAÇÃO (cole na conversa nova do Agent Mode)

CONTEXTO: você é o Agent Mode e vai CONTINUAR um projeto grande que já existe — NÃO comece do zero.

REPOSITÓRIO: GUILHERMEFMAGA/GUILHERMEFMAGA-SITE. Todo o trabalho está no branch `arena/01a08d8e-guilhermefmaga-site`, aberto no PULL REQUEST #4 (título: "Super Agente PC: agente que se atualiza, se diagnostica e responde com FATOS (r21 → r73) — continua o PR #3"). Diff acumulado ~+51 mil linhas. NÃO troque de branch: comece com `git fetch origin arena/01a08d8e-guilhermefmaga-site` e alinhe seu HEAD a ele (`git reset -q --soft $(git rev-parse FETCH_HEAD)` se o local divergir — o sandbox às vezes volta ao base).

O PROJETO: "Super Agente PC" — agente para Windows, 100% LOCAL (sem cota/offline), usuário LEIGO, tudo em português simples. Ele se atualiza sozinho ("atualizar agora" entrega main.py + iniciar.bat + requirements.txt e reaplica ao fechar), se diagnostica (python/defender/disco/cérebro), executa ações reais no PC (513 ferramentas; destrutivas SEMPRE com confirmação + backup + desfazer) e responde com FATOS: o que o usuário ensina ("conhecimento ensinar topico: fato") sobrevive ao fechar (cerebro.json, r71), volta como resposta instantânea com FONTE (r70), o revisor corrige invenção do modelo GGUF (r70), pergunta pessoal sem fato ganha aula de ensinar (r72), e a abertura sauda "BEM-VINDO DE VOLTA" com o resumo do cérebro (r73).

ONDE PARAMOS (13/09/2026): r73 publicada; 765 testes OK (venv: `python3 -m venv /tmp/pr3check/.venv && /tmp/pr3check/.venv/bin/pip install -q -r requirements-tests.txt`; suíte: `discover -s tests -q`). Commits: 255faab (r73), a8ba70b (lista-100). Pendências: (1) usuário ainda não rodou "atualizar agora" no PC dele nesta fase (agente dele pulará da r64 pra r73) — cobrar os prints; (2) o usuário vai escolher números da LISTA-100 (esqueletos_ideias/2026-09-13-lista100-funcoes-e-ferramentas.md — 50 funções + 50 ferramentas, SÓ PROPOSTA) para implementar; (3) futuros maiores: RAG dos documentos do usuário, STT local, manual do usuário.

PRIMEIRO PASSO: rode a suíte e confirme 765 OK; leia o TOPO de docs/CONTINUIDADE_AGENT_MODE.md (bloco "ESTADO ATUAL"); `git log --oneline -5` deve mostrar 255faab. Depois resuma ao usuário onde paramos e pergunte: (a) os prints do "atualizar agora" no PC dele? (b) quais números da lista-100 ele quer? NÃO implemente nada sem ele escolher.

REGRAS PERMANENTES (inegociáveis):
1. Usuário é LEIGO: comandos PRONTOS pra colar, um por vez; pedir print de qualquer erro; português simples.
2. Posicionamento honesto: NUNCA prometer que a IA local supera Perplexity/Claude em conhecimento geral; vantagens reais = fatos do PC dele, instantaneidade pelo que ele ensinou, privacidade, offline, custo zero, executar ações.
3. GGUF MANTIDO; troca de modelo só com "sim" explícito do usuário. NUNCA memória LP (r33). Esqueletos/ideias em esqueletos_ideias/ (r29). Aprimorar SEM apagar nada (r55). Listas = SÓ PROPOSTA; implementar só com autorização.
4. NUNCA importar/executar agente.py nos testes: carregar funções por AST (ver tests/test_roteamento_conversa.py, função carregar()).
5. Padrão por release rN: bump do selo `2026-09-11-rN` + cascata do selo em TODOS os testes + estender a tupla do loader (`_rN_`) em test_roteamento_conversa.py + suíte verde ANTES de publicar; publicar = commit no branch + push + comentário no PR #4 via gh.
6. Patch em agente.py SEMPRE com python3, `assert texto.count(ancora)==1` antes de gravar, cwd=DENTRO do repo, `py_compile` depois. Cuidados já mordidos: função com param `pasta` repassa `pasta=pasta` ao `_r67_ler_config`; `dict.pop(k)` devolve VALOR (imprima as chaves guardadas); chamada no nível do módulo é 0-indent; âncora de docs por texto ÚNICO (todo release termina igual).
7. Windows .bat: NUNCA REM com parêntese dentro de bloco `if (...)`. CRLF puro (verificar em bytes).
8. Anti-colisão automática antes de função nova (r30/esqueleto) contra as 513 ferramentas existentes.
9. `gh pr edit` de body falha: usar `gh api -X PATCH -F title=... -F body=@arquivo`. Kill-switches na config para toda feature falante (últimos: 'boas_vindas', 'dica_de_ensinar', 'cerebro_persistente').
