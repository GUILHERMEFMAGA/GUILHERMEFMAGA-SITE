# ESTADO desta conversa — 2026-09-22 UTC

## Ordem do dono identificada como "24/09": MUSEU e vitrine por conversa

- Capsula inteira (incluindo 0 e 6.5) e ESTADO da ponte lidos antes da decisao.
- /home/user/ponte nao existia; nenhum commit local dela foi encontrado.
- Fonte: SITE@super-agente, tip 3be2e9cc26b2a19a8b341ec01e6dba5d35c7d2eb.
- .arena-delivery/ = git archive integral desse tip, sem alteracoes.
- PR NOVO desta sessao = VITRINE (janela). Quem alimenta o PC e a PONTE
  (SITE@super-agente); puxar-atualizacao.bat nunca le PR.
- A cada publicacao na ponte, re-espelhar o PR da conversa no mesmo folego.
  Nao ha watcher instalado; esta e a obrigacao de cada entrega.
- MUSEU: preservar PRs #1-#4 e #6; #5 encerrou com a conversa 01a0b1e5.
  Ninguem fecha, apaga, reabre ou funde PR alheio sem ordem explicita.
  Consulta nesta sessao: #1-#4 abertos, #5 e #6 ja fechados; nenhum alterado.
- Conforme relato do dono nesta mensagem, o "verificar verde" colado em 24/09
  rodou no codigo VELHO: loop 1070 linhas / portao 14 cenas. Nao e validacao
  pos-B16. O print original nao foi anexado nesta conversa.
- Medido aqui no archive pos-B16: loop 1495 linhas; portao 17 cenas OK,
  exit 0; raio 20 ok | 9 dicas | 1 aviso | 0 problemas, exit 0.
  Aviso: desktop/downloads ausentes no Linux; dicas incluem estado local vazio.
- LIMITACAO: esta sessao esta fixa ao branch arena/01a0cb37-guilhermefmaga-site;
  push permitido somente nele. Nenhum push em super-agente foi feito.
  Correcoes canonicas preparadas em parceiro/regras-ponte.patch, ainda NAO
  publicadas na ponte. O espelho exato mantem a documentacao antiga da fonte.
- Decisao recomendada: B17 antes de F3. executar() nao consulta SO_OLHAR;
  a cena atual de observacao cobre propor(), nao a criacao de arquivo.
  B17: guarda + regressao que prove ausencia de criacao + ajuda coerente.
  F3 (diario de evolucao) depois; nao adicionar recurso sobre quebra de contrato.
  Nenhum dos dois implementado: aguardar aprovacao do dono.
- Ritual no PC: puxar-atualizacao.bat -> verificar-tudo.bat -> salvar-tudo.bat.
  O PR desta conversa nao altera o que o puxar recebe.

## 22/09/2026 — analise das 75 ideias antes de adicionar

- Pedido: analisar todo o codigo e nao repetir ideias existentes. Feita leitura
  dos dois programas separados (site e ponte), testes, BATs, configuracoes e JS.
- Novo parceiro/ROTEIRO.md complementa o roteiro canonico sem alterar o archive:
  75/75 ideias com destino primario unico; ampliacoes nos tickets existentes;
  dez grupos novos (nove das ideias + F8 dos achados da auditoria).
- Inventario reproduzivel: parceiro/analise/auditar_ideias.py e inventario.json;
  55 arquivos rastreados, 19 Python, 205 funcoes; zero corpos AST identicos.
  Isso nao prova ausencia de duplicacao semantica, tratada na triagem manual.
- Quatro falhas reproduzidas somente em diretorio temporario: so-olhar cria
  arquivo; ensaio escreve inventario; aprendizado desligado grava; promover
  aceita proposta com apenas id. Nenhuma corrigida ou ativada nesta entrega.
- Roteiro antigo tem exageros: tick nao roda suite, ponte nao e shadow deploy,
  propostas/aprovadas nao mede alucinacao, placar nao e probabilidade calibrada.
  As alegacoes industriais recebidas nao foram certificadas como fatos.
- Recomendacao reforcada: B17 antes de F3; outros achados agrupados em F8,
  entregas pequenas, sem autoescrita/execucao de ferramentas e sem comite
  substituindo autorizacao humana. P5 permanece opcional/desligado.
- Fonte conferida via fetch: ponte ainda em 3be2e9c. Nenhum push na ponte,
  nenhuma alteracao de runtime, nenhum acesso ao PC; somente branch desta
  sessao e sua vitrine PR #7. O complemento esta na vitrine, nao no puxar.

## 22/09 — Windows pos-B16: interrupcao repetida no final do portao

- Evidencia nova do dono: loop 1495 linhas/69 funcoes, raio 28 ok | 4 dicas |
  0 avisos | 0 problemas. As 17 cenas imprimem OK, mas duas tentativas terminam
  com KeyboardInterrupt na leitura final (testar_regras.py:583). Nao ha
  PORTAO ABERTO pos-B16 concluido na maquina dele; nao liberar salvar ainda.
- Correcao da orientacao anterior: nao atribuir ^C ao teclado do dono. Codigo
  chama os.kill(outro, 0) em loop.py:1147 e raio_x.py:697. A cena de blindagens
  passa os.getppid() (testar_regras.py:529). No Windows, sinal 0 corresponde a
  CTRL_C_EVENT; nao e a consulta inofensiva de existencia do POSIX. Pode gerar
  interrupcao no console; ha caminhos de fallback que terminam processo.
  Fonte: https://bugs.python.org/issue42962 (explicacao do comportamento Windows).
- Forte explicacao para repeticao depois da cena de trava; nao reproduzido
  neste sandbox Linux. Defeito de portabilidade confirmado por leitura;
  causalidade especifica ainda precisa de validacao Windows apos correcao.
- Orientacao: nao repetir portao/raio/loop atuais ate substituir a consulta de
  PID por API Windows somente leitura e testar que nenhum sinal e enviado.
  Nenhuma correcao publicada na ponte nesta entrega. Proxima prioridade:
  blindagem Windows antes de B17/F3; vitrine PR #7 nao alimenta o puxar.
