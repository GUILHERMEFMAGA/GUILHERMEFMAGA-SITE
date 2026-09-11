# r21 — confiabilidade das respostas da IA LOCAL

Lote escolhido pelo usuário a partir das ideias apresentadas em 10/09/2026
(**Bloco A** integral: itens 1–4). Implementação incremental sobre a r20 (0c343c0),
**sem trocar o GGUF, sem tocar no rodízio da nuvem e sem nova dependência**.
Também corrige o espaço final pré-existente em `agente.py` (linha da regex de
duração), registrado na preparação da sessão.

## Matriz de implementação e limites

| Nº | Entrega no código | Limite importante |
|---|---|---|
| 1 | `_r21_sugerir_comando_proximo`: erro de digitação em comando canônico sugere no máximo 1 candidato (`difflib`, corte 0,78 sobre `_r21_comandos_conhecidos`) e **só executa após "sim"**; recusa consome o comando com mensagem, sem enviar o typo ao modelo. Hook no roteador local (`processar_atalho_rapido`), **somente com a nuvem desligada**; não sugere linhas com payload (`:`) nem entradas curtas (<5 caracteres normalizados). | Similaridade textual não é intenção; um falso "sim" executa um comando canônico (todos de baixo risco; os perigosos continuam exigindo suas confirmações próprias, como CONFIGURAR/AVALIAR/JULGAR). Não cobre paráfrases gerais nem ações fora do catálogo. |
| 2 | `_r21_detectar_colapso`: n-grama de ~16/10 palavras repetido 3+ vezes ou mesma linha (≥12 caracteres) 4+ vezes. Em `perguntar_ia_local`, se detectado: registra a pergunta em memória (`_r21_ultimo_colapso`, não persistido) e anexa aviso transparente; **o texto bruto nunca é alterado**. | Heurística: pode não detectar colapsos curtos/variados e, em teoria, sinalizar texto legítimo muito repetitivo (avisos não modificam a resposta). Avaliação de precisão continua bruta por decisão de projeto — não recebe esse aviso. |
| 3 | `refazer com penalidade`: refaz **1 única vez** a geração marcada com colapso, com `repeat_penalty` 1,05→1,20 (parâmetro `penalidade_extra` limitado a +0,6, teto 2,0 no transporte). Registra o par no histórico como os demais. Se o motor está indisponível ou a refazida falha, responde com honestidade e não repete nada. | Exige motor disponível e consome RAM/CPU de uma nova geração. A resposta anterior não é apagada nem reescrita. Penalidade maior reduz repetição mas não garante acerto factual. |
| 4 | `parar geracao local` + ferramenta `parar_geracao_local` (**480ª**): cancela no cliente a geração em andamento — fecha a resposta HTTP ativa (`_r21_ativa`), marca `_r21_cancelar_id` (identifica a geração por número sequencial, sem afetar gerações futuras) e o estado do motor passa a `cancelada` (novo valor válido em `_r20_estado`). No streaming, o laço verifica o pedido a cada chunk; no Ctrl+C, o estado também vira `cancelada`. | O **servidor pode continuar computando** alguns segundos após o cancelamento no cliente (limitação documentada desde a r20). No console o prompt fica bloqueado durante a geração: o cancelamento prático é pelo **painel web** (ferramenta registrada) ou após Ctrl+C. Se o "parar" chega quando a geração já terminou, a mensagem reflete o estado real. |
| 5 | JSON garantido no modo ideias: `_chamar_neural(..., formato_json=True)` → transporte envia `response_format: {"type":"json_object"}` **somente se a build ainda não rejeitou o campo**. Em rejeição 4xx (400/404/422 — nenhuma geração concluída), reenvia **1 vez** sem o campo, marca `_r21_suporte_json=False` para as próximas e registra `formato_json` no meta. Erro 5xx/timeout **não** gera reenvio nem máscara. | A garantia estrutural depende da **build do llama-server** do usuário; sem suporte, o comportamento volta a ser exatamente o da r12 (falha de JSON preservada com roteiro alternativo). O reenvio 4xx é a única exceção à regra "nunca repete geracao" e se aplica apenas a pedidos com `formato_json`. |

## Identificador de versão no PC

O selo exibido na inicialização passou de `[Motor e avaliacao local 2026-09-10-r20]` para
`[Motor e avaliacao local 2026-09-10-r21]` (ajuste publicado em seguida à entrega principal:
na r21 principal esse selo ficou esquecido em r20, o que dificultaria conferir a versão no PC).

## Preservação verificada (AST, scripts/auditar_ferramentas.py)

- **479 ferramentas anteriores: mesmos nomes, mesma ordem, nenhuma assinatura alterada, nenhuma removida.**
- 1 ferramenta nova: `parar_geracao_local` (total **480**). Zero nomes repetidos, zero corpos AST idênticos.
- Comandos, memórias, confirmações, permissões, rodízio de nuvem e o GGUF não foram alterados.
- `iniciar.bat` e `chaves_EXEMPLO.txt` intocados nesta etapa.

## Comandos de uso

```text
parar geracao local      # cancela a geracao local em andamento (ver limites)
refazer com penalidade   # disponivel apos um [Aviso de saude da geracao]
```

A sugestão por erro de digitação aparece sozinha: digitar, por exemplo,
`sttus ia` ou `criar` no modo local pergunta
`Voce quis dizer 'status ia'? (sim/nao):` — só executa após `sim`.

## Testes executados e o que NÃO foi testado

- **175 testes isolados passaram** (150 anteriores preservados + 25 novos em
  `tests/test_confiabilidade_respostas_r21.py`), com venv próprio
  (`requirements-tests.txt`: apenas `packaging`). Ajustes: o loader AST
  (`tests/test_roteamento_conversa.py`) passou a extrair também funções `_r21_`;
  `tests/test_auditoria_inventario.py` atualizado de 479 para 480 com comentário.
- `py_compile` OK; `git diff --check` limpo (espaço final da linha da regex removido).
- **Não executado no Windows real, com o GGUF real, no painel web real ou com
  nuvem real.** Não há medição de ganho de precisão/velocidade; o `response_format`
  não foi validado contra a build local do llama-server (a detecção cuida disso
  com fallback honesto no primeiro uso).

## Decisões do usuário nesta etapa

- Escolha do **Bloco A** (itens 1–4) a partir da lista de ideias; autorização para
  corrigir o espaço final registrado. Publicação prevista em PR novo de continuação
  do PR #3 (branch da sessão), sem merge na main, sem fechar PRs, sem alterar URLs
  do `iniciar.bat` (decisão sobre a linha do BAT permanece com o usuário).
