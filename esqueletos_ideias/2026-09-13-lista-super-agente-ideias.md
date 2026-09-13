# LISTA SUPER-AGENTE — ideias do próprio agente (SÓ PROPOSTA)

Data: 2026-09-13. Selo atual: `-r75` (817 testes OK).

**Regra da casa: isto é SÓ PROPOSTA.** Nada aqui é implementado sem o dono
aprovar (escolher os itens). Nada do que já existe será apagado — só
aprimorar (r55). Cada ideia passou no filtro anti-colisão (r30) contra as
ferramentas e funções existentes (513 @tool + funções r20–r75); o que já
existe é citado como base, não reproposto.

O que já existe e NÃO está reproposto aqui: flashcards (r52), humor (r48),
`_r51_dpapi_*` (r51), detetive de lentidão (r68), agendar_tarefa/fila_tarefas
(rotinas antigas), executar_python (já existe — a r75 agregou a sandbox),
modo panico, checkpoint/apelido (r67), TURBO (r42), episódios SÉRIE,
compactador/warm-up/replay/malha/guardião/tradutor/rota guiada (r74),
fila/cron/lentidão/sandbox/cofre/convidado (r75), orçamento de contexto (r20),
anti-invenção (r65), honestidade "não sei — me ensina" (r72).

---

## IDEIAS (numeradas p/ o dono aprovar por número)

1. **Auto-auditoria de integridade na abertura** — na inicialização, o agente
   confere o próprio estado (arquivos do cérebro existem, jsons legíveis,
   contagem de ferramentas, selo bate com a última release) e mostra 1 linha:
   "Casa em ordem (N ferramentas, cérebro ok)" ou lista EXATAMENTE o que
   está estranho + o comando pra consertar. Base: a auditoria manual de
   13/09 vira rotina automática. (Kill-switch: `auto_auditoria`.)

2. **Checkpoints automáticos + timeline e `voltar`** — a cada N ações
   destrutivas ou a cada X minutos, o agente grava um snapshot do cérebro
   (cerebro.json + atalhos + rotinas) em `checkpoint_YYYYMMDD-HHMM.json`;
   comando `voltar` mostra a timeline e restaura o escolhido (com 'sim').
   Base: o checkpoint manual da r67 vira automático e com história.
   (Kill-switch: `checkpoint_auto`.)

3. **Painel de métricas local (HTML)** — comando `painel` gera um
   `painel.html` na pasta do agente (abre no navegador): respostas por dia,
   tempo médio da IA local (do EMA), gerências lentas, comandos mais usados,
   rotinas disparadas, estado do motor. 100% local, nada sai do PC.
   (Kill-switch: `painel_local`.)

4. **Radar proativo com consentimento (≤ 3 itens, só fatos)** — o dono
   aprova UMA VEZ temas que pode ser avisado (ex.: "pastas quase cheias",
   "arquivos novos em downloads há 30 dias"); o agente confere no horário
   (cron da r75) e avisa ATÉ 3 fatos comprovados com o caminho exato — nunca
   opinião, nunca medo. Sem aprovação, o radar não existe.
   (Kill-switch: `radar_proativo` + lista de temas aprovados.)

5. **Fatos com validade (data de validade no cérebro)** — ensinar "meu
   médico é o X" pode levar validade ("até dezembro", "todo ano em janeiro");
   na consulta, fato vencido sai da resposta com aviso "isso expirou em X —
   continua valendo?" (o dono renova ou apaga). Base: cerebro.json da r71
   ganha o campo `validade`. (Nada é apagado sozinho — só marcado.)

6. **Arquivo de conversas pesquisável** — cada conversa vai para
   `conversas/2026-09-13.md` (só texto, nada de chaves); comando
   `pesquisar conversa: <frase>` acha em todas e mostra o trecho + o dia.
   Resolvi "onde foi que você me disse aquilo?". (Kill-switch:
   `salvar_conversas`.)

7. **`ajuda sobre <assunto>` de si mesmo sem inventar** — comando que
   responde "o que você sabe/sobre o quê" consultando SÓ o catálogo real:
   ferramentas, rotas, fatos ensinados, rotinas — com a lista de onde
   achou. Se não achar, diz "não encontrei nada disso em mim". Nunca
   inventa capacidade. (Kill-switch: `ajuda_sobre`.)

8. **Guardião de energia (modo econômico)** — comando `economia` liga um
   modo que (a) reduz o contexto que manda pro modelo local, (b) sugere
   encerrar o servidor local quando ocioso há N minutos (pergunta antes,
   nunca mata sozinho) e (c) mostra o consumo recente. PC leigo: 1 comando
   liga, `economia desligar` desliga. (Kill-switch: `modo_economia`.)

9. **Perfis multi-usuário honestos** — `perfil <nome>` separa fatos/
   atalhos/rotinas por pessoa no MESMO PC (arquivos por perfil na pasta do
   agente; o dono vê os arquivos). Sem promessa de privacidade de nível
   bancário (é separação de arquivos, a casa é honesta sobre isso).
   (Kill-switch: `perfis_usuario`.)

10. **Previsão de problemas pela tendência própria** — com os dados que o
    agente JÁ mede (tempos, lentidão da r75, espaço em disco das ferramentas
    existentes), ele avisa tendência: "a pasta X cresce ~1 GB/semana — em 2
    meses vai apertar". Só com dados medidos, sempre com o número de onde
    veio. (Kill-switch: `previsao_tendencia`.)

11. **Backup-herança do agente** — comando `heranca` gera um ZIP com tudo
    que o agente sabe (cérebro, fatos, atalhos, rotinas, conversas) + um
    README escrito por ele mesmo descrevendo cada arquivo, pra guardar em
    pendrive ou mandar pra outra pessoa/PC. O `importar` da r76 (item 14 da
    leva) fecha o ciclo. (Kill-switch: `backup_heranca`.)

12. **Simulador "what if" (dry-run de qualquer comando)** — `simular:
    <comando>` mostra o que o comando FARIA (arquivos que tocaria, ações
    que executaria, perigos) SEM executar nada — estende o dry-run da r74
    (que cobre rotas) pra TODO o catálogo. Base: o testador de malha.
    (Kill-switch: `simulador_what_if`.)

13. **Memória de promessas (`compromissos.json`)** — quando o agente diz
    "vou te avisar quando X" / "vou lembrar de Y", a promessa vira registro
    com prazo; comando `promessas` lista pendentes/cumpridas; o radar (ideia
    4) usa essa lista. Nunca promete sem registrar; nunca some uma promessa
    sem avisar. (Kill-switch: `memoria_promessas`.)

14. **Busca universal** — `achar: <frase>` procura em UM só lugar: arquivos
    do PC (nomes + conteúdo nas pastas permitidas, já existe ferramenta de
    busca), fatos do cérebro, histórico de conversas (ideia 6), atalhos e
    rotinas. Resultado único com a FONTE de cada achado. É a cola que
    amarra as memórias existentes em uma só busca. (Kill-switch:
    `busca_universal`.)

15. **Manual vivo do agente (`manual`)** — comando que gera
    `manual_do_agente.md` na pasta: tudo que ele sabe fazer HOJE (catálogo
    real de rotas + ferramentas + rotinas + exemplos), versão com selo e
    data. É o "manual do usuário" (item 44 da leva) escrito pelo próprio
    agente a partir do código, sempre em dia — o dono (ou um técnico) lê e
    sabe exatamente o que o agente faz. (Kill-switch: `manual_vivo`.)

---

## Ordem sugerida (se o dono aprovar o pacote)

- **Onda 1 (base de confiança):** 1, 2, 13, 15 — auditoria, checkpoints,
  promessas, manual. (r76 ou r77, junto com a leva pendente 14/15/42/43/44.)
- **Onda 2 (visão):** 3, 14, 6 — painel, busca universal, conversas
  pesquisáveis.
- **Onda 3 (proatividade):** 4, 10, 12 — radar c/ consentimento, previsão,
  simulador.
- **Onda 4 (casa ampliada):** 5, 7, 8, 9, 11 — validade dos fatos, ajuda
  sobre si, energia, perfis, herança.

Tudo com: kill-switch na config, 100% local, PT-BR simples, comando pronto
pra colar, print em qualquer erro, NUNCA apagar nada.
