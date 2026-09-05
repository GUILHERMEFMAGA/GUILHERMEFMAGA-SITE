"""
================================================================================
 SUPER AGENTE PC — DOCUMENTAÇÃO COMPLETA + CÓDIGO (v4.0 — ULTRA)
================================================================================
Este arquivo é o "bloco de notas" completo do projeto. Tudo que você precisa
saber está aqui dentro, em comentário, e logo abaixo vem o código real que
roda. É só colar isso tudo no Bloco de Notas e salvar como:

    C:\\Usuarios\\GFMag\\agente.py

E rodar no cmd:

    cd C:\\Usuarios\\GFMag
    python agente.py

================================================================================
1. VISÃO GERAL
================================================================================
O agente roda 100% no seu PC. Usa um RODIZIO de IAs gratuitas na nuvem:
o Gemini e o cerebro principal, e quando a cota dele (ou de qualquer outra)
acaba, o agente troca sozinho para a proxima IA gratuita da lista (Groq,
Cerebras, SambaNova, OpenRouter). Cada uma tem sua chave e sua cota, entao
o agente praticamente nunca para por limite de uso - e tudo fica na nuvem
(rapido, sem pesar no PC). Veja a secao "RODIZIO DE IAS GRATUITAS" abaixo.
Ele tem controle real sobre o PC: abre programas, mexe em arquivos,
manda WhatsApp, controla mouse/teclado, lê tela, monitora sistema, mexe em
configurações (com permissão), verifica atualizações, cria projetos de
código sozinho, fala e ouve por voz, agenda tarefas tipo cron, tem memória
semântica de longo prazo, e — a peça central desta versão — **se autodiagnostica
e tenta se autocorrigir quando algo dá erro**, em vez de só travar.

Diferente do n8n:
- Não depende de nós visuais fixos — qualquer ideia nova vira uma função Python.
- Roda 100% no seu PC com o Gemini gratuito; os atalhos que não usam IA
  (abrir programas, status, mídia, modo pânico) funcionam mesmo sem internet.
- Guarda memória, contatos e regras em arquivos JSON, editáveis à mão se quiser.
- Pode gerar CÓDIGO PROFISSIONAL sozinho, não só automatizar cliques.
- Quando algo quebra, ele tenta entender o erro e se recuperar sozinho, em vez
  de simplesmente mostrar um traceback vermelho e parar.

================================================================================
2. SISTEMA DE PERMISSÕES
================================================================================
Toda ação sensível passa por 3 níveis, configuráveis em `config.json` ->
"nivel_permissao":

- "basico"  -> só conversa, lê arquivos, tira print. Não modifica o sistema.
- "padrao"  -> (recomendado) executa tudo, mas sempre pede confirmação antes
               de: WhatsApp, deletar algo, mudar configuração, instalar/atualizar
               programas, rodar macro gravada.
- "admin"   -> executa ações sensíveis sem perguntar (cuidado).

================================================================================
3. SISTEMA DE VELOCIDADE (ULTRA)
================================================================================
1. Atalhos exatos (dicionário) -> resposta instantânea, 0 créditos de API.
2. Atalhos por similaridade (difflib) -> pega variações de frase.
3. Cache de perguntas repetidas (`cache.json`) -> não gasta API de novo.
4. Classificador leve antes do agente pesado -> só monta o Agent Executor
   completo quando realmente precisa de ferramentas.
5. RODIZIO de IAs gratuitas: quando uma estoura a cota, troca sozinho pra
   próxima (Gemini -> Groq -> Cerebras -> SambaNova -> OpenRouter).
6. Tarefas longas rodam em fila de background (thread), terminal fica livre.
7. Memória semântica indexada (não precisa reler tudo o histórico, busca só
   o que é relevante pra pergunta atual).

================================================================================
4. TOP 10 IDEIAS "FODAS" DESTA VERSÃO (o que faz ele ser o melhor agente)
================================================================================

  #1 — AUTOCURA DE ERROS (self-healing)
      Toda ferramenta e todo laço principal roda dentro de um "escudo" que
      captura a exceção, manda o erro pro LLM com a pergunta "diagnostique e
      sugira uma correção", mostra o diagnóstico pra você, e tenta de novo
      automaticamente (com backoff) se o erro for do tipo transitório (rede,
      timeout, WhatsApp Web não carregou etc). Erros graves (permissão,
      arquivo não existe) são explicados em português simples, sem traceback
      cru.

  #2 — MEMÓRIA DE LONGO PRAZO COM BUSCA SEMÂNTICA
      Em vez de só empilhar mensagens num JSON, cada interação importante vira
      uma "lembrança" com tags automáticas (extraídas pelo LLM: projeto,
      pessoa, assunto). Quando você pergunta algo, o agente busca nas
      lembranças mais parecidas com a pergunta atual (por similaridade de
      texto) antes de responder — assim ele "lembra" de coisas de semanas
      atrás sem precisar reler tudo.

  #3 — VOZ COMPLETA (fala + escuta, 100% offline depois de configurado)
      `pyttsx3` para o agente falar as respostas em voz alta, e Vosk para você
      falar os comandos em vez de digitar. Ativa/desativa com "modo_voz" no
      config.json.

  #4 — AGENDAMENTO TIPO CRON
      "Todo dia às 8h verifica meu sistema e me avisa se tiver algo estranho"
      — o agente aceita tarefas recorrentes e roda tudo numa thread separada,
      sem precisar você deixar nada aberto manualmente além do terminal.

  #5 — MOTOR DE REGRAS CONDICIONAIS (regras.json, editável em texto puro)
      "Se o comando mencionar 'urgente', me avise por voz mesmo com modo_voz
      desligado" — regras simples do tipo gatilho -> ação, sem precisar mexer
      no código Python.

  #6 — CONSCIÊNCIA MULTI-PROJETO
      O agente lembra de todos os projetos de código que já criou
      (`projetos.json`: nome, pasta, data, descrição) e consegue reabrir
      qualquer um deles só com "abre o site do portfólio que você criou mês
      passado".

  #7 — GRAVADOR DE MACROS
      Grava uma sequência de cliques/teclas (via `pynput`) e repete depois sob
      demanda, quantas vezes quiser — tipo um "workflow visual" do n8n, só que
      gravado por você mesmo, sem escrever nó nenhum.

  #8 — FILA DE TAREFAS ASSÍNCRONA
      Pedidos demorados (criar site, mandar 10 mensagens, rodar macro) entram
      numa fila e processam em background; o terminal aceita novos comandos
      na hora, sem ficar "travado" esperando.

  #9 — AUTODIAGNÓSTICO PROATIVO DE SISTEMA
      Uma checagem periódica (a cada N minutos, em thread separada) olha
      CPU/RAM/disco e AVISA sozinho se algo estiver crítico, sem você precisar
      perguntar.

  #10 — PAINEL DE STATUS ("status" a qualquer momento)
      Digite "status" e o agente mostra: nível de permissão atual, se o modo
      voz está ligado, quantos contatos tem cadastrados, quantos projetos já
      criou, qual modelo de IA está em uso, e as últimas 3 tarefas
      agendadas — tudo isso sem gastar 1 chamada de API.

================================================================================
5. WHATSAPP — ENVIO POR NOME, SEM PRECISAR DE NÚMERO EXATO
================================================================================
- Nome já cadastrado -> usa o número salvo direto.
- Nome parecido com um já cadastrado (ex.: "Willian" vs "William") -> o agente
  confirma "Você quis dizer William (+55...)?" antes de mandar.
- Nome totalmente novo -> pergunta o número uma vez, manda a mensagem e SALVA
  o contato pra você nunca mais precisar informar de novo.
- Fila de envio, retry automático (3 tentativas) e log completo.

================================================================================
6. CRIAÇÃO DE PROJETOS DE CÓDIGO SOZINHO
================================================================================
Você descreve o site -> o agente cria a pasta, gera HTML/CSS/JS profissional
via LLM, inicializa git com primeiro commit, abre no VS Code, e registra o
projeto na memória multi-projeto (ideia #6) pra você conseguir voltar nele
depois só falando o nome.

================================================================================
7. O QUE INSTALAR ANTES DE RODAR (PASSO A PASSO)
================================================================================
No cmd, um de cada vez:

    pip install langchain langchain-google-genai langchain-openai
    pip install pyautogui pywhatkit pandas pypdf psutil
    pip install pyttsx3 vosk sounddevice pynput schedule

(As últimas quatro são para voz, macros e agendamento — se não quiser usar
esses recursos agora, pode pular; o agente detecta o que falta e avisa sem
travar o resto.)

1. Chave do Gemini (uma vez só):
       setx GEMINI_API_KEY "sua_chave_aqui"
   (feche e abra o cmd de novo depois).

1b. (Recomendado, gratuito) Chaves EXTRAS para o rodízio de IAs. Quanto mais
    chaves, mais difícil de estourar a cota do dia. Cada site é de graça e
    não pede cartão; é só criar conta e gerar a chave, depois rodar no cmd
    UMA LINHA POR VEZ (feche e abra o cmd depois de todas):
       setx GROQ_API_KEY "sua_chave"        -> https://console.groq.com/keys
       setx CEREBRAS_API_KEY "sua_chave"    -> https://cloud.cerebras.ai
       setx SAMBANOVA_API_KEY "sua_chave"   -> https://cloud.sambanova.ai
       setx OPENROUTER_API_KEY "sua_chave"  -> https://openrouter.ai/keys
    As que você não configurar são simplesmente ignoradas (não dão erro).

2. Faça login uma vez em web.whatsapp.com no navegador padrão.

3. Garanta que `code` funciona no cmd (abre VS Code). Se não funcionar: VS
   Code -> Ctrl+Shift+P -> "Shell Command: Install 'code' command in PATH".

4. (Opcional) Git: https://git-scm.com/download/win

5. (Opcional, voz) Baixe um modelo Vosk em português em
   https://alphacephei.com/vosk/models e extraia numa pasta chamada
   `modelo_vosk_pt` dentro da pasta do projeto.

Depois:

    cd C:\\Usuarios\\GFMag
    python agente.py

Digite "status" a qualquer momento pra ver o estado geral do agente sem gastar
créditos de API. Digite "sair" para encerrar.

================================================================================
8. BANCO DE IDEIAS — TUDO O QUE ESSE AGENTE AINDA PODE VIRAR
================================================================================
Nenhum agente é infalível — nem esse, nem nenhum outro que existe no mundo.
O que dá pra fazer de verdade é deixar ele MUITO resiliente: detectar erro,
se recuperar sozinho, avisar você claramente quando não conseguir, e ter
redundância em cada camada (é isso que a ideia #1, autocura, já faz). O banco
abaixo é a lista de ideias reais para você ir implementando aos poucos —
organizado por categoria, pra você escolher o que expandir primeiro.

--- CRIAÇÃO DE PROJETOS / DESENVOLVIMENTO ---
- Gerador de site 3D (Three.js) direto no VS Code — IMPLEMENTADO nesta versão,
  veja a ferramenta `criar_site_3d` no código abaixo.
- Gerador de API REST (Flask/FastAPI) a partir de uma descrição em português.
- Gerador de app mobile simples (React Native/Expo) via descrição.
- Templates prontos por tipo de projeto (landing page, dashboard, jogo 2D,
  portfólio, e-commerce simples) que o agente escolhe sozinho conforme o
  pedido, sem precisar gerar tudo do zero toda vez.
- Revisão automática de código: antes de salvar, o agente roda um linter
  (ex.: `flake8`/`eslint`) e corrige o que der pra corrigir sozinho.
- Testes automáticos: gerar um arquivo de teste básico (pytest) junto com
  cada projeto criado.
- Deploy automático: subir o site gerado direto pro GitHub Pages ou Vercel
  com um comando de voz/texto.
- Documentação automática: gerar um README.md explicando o projeto criado.
- Versionamento semântico automático (tags de versão a cada commit grande).
- Reorganizador de projeto: se a pasta ficar bagunçada, o agente sugere (ou
  aplica, com confirmação) uma reorganização de pastas por convenção.
- Explicador de erro de código: cola um traceback de outro programa seu e o
  agente explica e sugere a correção, sem precisar copiar pra outro lugar.

--- ORGANIZAÇÃO E PRODUTIVIDADE ---
- Organizador automático de Downloads (por tipo de arquivo, por data, ou por
  projeto detectado no conteúdo).
- Painel diário: todo dia de manhã, resumo automático de agenda + clima +
  notícias relevantes ao seu campo de interesse.
- Detecção de duplicados: encontra arquivos/documentos repetidos no PC e
  sugere o que apagar (sempre com confirmação).
- Backup automático incremental de pastas importantes pra um HD externo ou
  nuvem, agendado.
- Modo foco: fecha distrações (redes sociais, notificações) por um tempo
  configurado quando você pede "modo foco 1 hora".
- Rastreador de hábitos simples: registra quando você pediu determinada
  tarefa e monta um histórico de frequência.

--- MEMÓRIA E INTELIGÊNCIA ---
- Memória por "arquivo de vida": categorias fixas tipo "trabalho", "projetos
  pessoais", "financeiro", "saúde" — cada lembrança é automaticamente
  classificada nessas categorias pelo LLM.
- Memória com data de expiração: informações temporárias (tipo "hoje tenho
  reunião às 15h") somem sozinhas depois de um tempo, sem poluir a busca.
- Resumo semanal automático: toda semana, o agente resume tudo que você
  pediu pra ele e destaca padrões (ex.: "você pediu pra criar 3 sites essa
  semana, quer que eu junte tudo num portfólio?").
- Perguntas de esclarecimento inteligentes: quando um pedido é ambíguo, o
  agente pergunta só o essencial (uma pergunta, não um interrogatório).
- Aprendizado de preferências: se você sempre corrige o mesmo tipo de coisa
  (ex.: sempre pede tema escuro), o agente passa a assumir isso por padrão.

--- SEGURANÇA E CONFIABILIDADE ---
- Modo "sandbox": antes de rodar um comando arriscado pela primeira vez, o
  agente mostra exatamente o que vai fazer, sem executar, até você confirmar.
- Log auditável de tudo: toda ação sensível fica registrada com data/hora,
  pra você conseguir revisar depois o que o agente fez.
- Detecção de comando ambíguo perigoso ("deletar tudo" sem especificar o quê)
  — o agente sempre pede a pasta exata antes de apagar qualquer coisa.
- Modo "somente leitura" temporário: você pode travar o agente pra só
  consultar informações, sem poder executar nada, quando quiser.
- Verificação de integridade: antes de rodar `winget upgrade` em algo crítico
  do sistema, o agente avisa o que aquele programa faz.

--- WHATSAPP E COMUNICAÇÃO ---
- Respostas automáticas configuráveis (fora do horário, mensagens padrão).
- Resumo de conversas longas do WhatsApp Web (usando visão de tela) quando
  você pede "resume o que fulano me mandou hoje".
- Envio programado ("manda parabéns pro João às 00h01 do dia X").
- Integração com e-mail: mesma lógica de contatos por nome, pra mandar
  e-mail sem precisar guardar endereço decorado.
- Notificações cruzadas: se uma tarefa agendada falhar, avisa por WhatsApp
  além de mostrar no terminal.

--- VOZ E ACESSIBILIDADE ---
- Múltiplas vozes/tons configuráveis (mais formal, mais casual).
- Modo "ditado": você fala um texto longo e o agente só transcreve, sem
  interpretar como comando.
- Leitura de tela em voz alta pra acessibilidade (ler o que está na tela sem
  precisar perguntar nada).
- Atalho de voz por palavra de ativação ("Jarvis, ...") pra não precisar
  apertar Enter toda hora.

--- MONITORAMENTO E MANUTENÇÃO DO PC ---
- Alerta de disco cheio com sugestão automática do que limpar (cache,
  temporários, downloads antigos).
- Verificação de programas abertos consumindo muita RAM, com sugestão de
  fechar os que você não está usando.
- Relatório semanal de saúde do PC (uso médio de CPU/RAM, espaço em disco,
  quantidade de atualizações pendentes).
- Checagem de drivers desatualizados (via winget ou Windows Update).

--- CRIATIVIDADE E CONTEÚDO ---
- Gerador de posts pra redes sociais a partir de uma ideia solta.
- Gerador de roteiro de vídeo curto a partir de um tema.
- Assistente de brainstorm: você fala um problema, o agente devolve 5
  abordagens diferentes pra resolver, sem só repetir a pergunta.

Isso já são dezenas de direções concretas — sempre um passo real de cada vez,
sem prometer perfeição que nenhum sistema entrega, mas com margem enorme pra
esse agente ficar cada vez mais completo.

================================================================================
9. GMAIL (NOVO)
================================================================================
`enviar_email` manda e-mail via SMTP do Gmail. Precisa de duas coisas:

1. No `config.json`: adicione `"email_remetente": "seuemail@gmail.com"`.
2. No cmd, uma vez só:
       setx GMAIL_APP_PASSWORD "sua_senha_de_app"
   (senha de app, não a senha normal — gerada em
   myaccount.google.com/apppasswords, precisa da verificação em duas etapas
   ativada na conta Google).

Igual o WhatsApp, dá pra mandar por nome de contato se você guardar o e-mail
dentro de `contatos.json` no formato `{"nome": {"email": "..."}}`.

================================================================================
10. AUTOEVOLUÇÃO POR CONVERSA (NOVO — a peça que faltava)
================================================================================
A ferramenta `evoluir_agente` é o que permite você conversar com o agente e
pedir uma função nova, tipo:

    "Quero que você tenha uma nova função: quando eu bater 3 palmas, toca
    uma música."

O que acontece por trás:

1. O agente gera o código Python da nova ferramenta, seguindo o mesmo padrão
   de estilo de todas as outras (usa `executar_com_autocura`, pede
   confirmação se for ação sensível).
2. Valida a sintaxe do código gerado ANTES de tocar em qualquer arquivo —
   se vier código quebrado, ele recusa e não muda nada.
3. Faz backup do arquivo atual (`agente.py.backup_AAAAMMDD_HHMMSS`) antes de
   qualquer alteração.
4. Insere a nova função no arquivo e valida a sintaxe do arquivo inteiro de
   novo — se a inserção quebrar alguma coisa, ele desfaz e avisa, mantendo
   o backup intacto.
5. Avisa que você precisa fechar (`sair`) e rodar `python agente.py` de novo
   para a mudança valer — o Python não recarrega o próprio código sozinho no
   meio da execução, então o reinício é sempre necessário.

Isso é diferente de "ele nunca erra": é ele conseguindo se modificar com
segurança, sempre com um caminho de volta (o backup) se algo sair errado.

================================================================================
11. OTIMIZAÇÃO E MONITORAMENTO REAL DO PC (NOVO)
================================================================================
Antes, `alterar_configuracao_sistema` só abria painéis de configuração (Wi-Fi,
telas de settings) — você ainda precisava clicar. Agora `otimizar_sistema`
EXECUTA a mudança de verdade, sem você precisar tocar em nada:

- `limpar_temp` — apaga arquivos temporários acumulados (pasta %TEMP%).
- `limpar_dns` — limpa cache de DNS (resolve problema de site não carregar).
- `listar_inicializacao` — mostra o que abre junto com o Windows.
- `plano_energia_desempenho` / `plano_energia_economia` — troca o plano de
  energia de verdade via `powercfg`.
- `otimizar_disco` — roda a otimização/desfragmentação do disco C: (equivalente
  ao botão "Otimizar" do Windows, mas por comando).
- `liberar_memoria_standby` — não força a liberação sozinho (isso exige
  ferramenta externa e admin), mas mostra os processos que mais consomem
  RAM agora, pra você decidir o que fechar.

E `monitorar_sistema_avancado` dá a visão completa: CPU total e por núcleo,
RAM em MB e %, disco em GB e %, tráfego de rede, bateria (se notebook), e o
top 5 de processos que mais consomem CPU e RAM no momento — não só um número
solto, mas o que exatamente está pesando na máquina.

================================================================================
12. MAIS IDEIAS REAIS (categorizadas — qualidade em vez de quantidade forçada)
================================================================================
Pediram uma quantidade de ideias que não faz sentido gerar de verdade (depois
de umas 100-150 ideias distintas sobre automação de PC, qualquer coisa além
disso vira repetição disfarçada, o que deixaria o código maior e pior, não
melhor). Aqui vai uma leva adicional de ideias reais, sem repetir o banco que
já existe na seção 8:

--- MAIS OTIMIZAÇÃO E CONFIGURAÇÃO ---
- Perfis de otimização por contexto: "modo jogo" (desativa notificações,
  prioriza CPU/GPU pro jogo em foco) vs "modo trabalho" (economia de bateria,
  notificações normais) — trocado com um comando.
- Ajuste automático de plano de energia por horário (economia à noite,
  desempenho de dia), combinando com a ideia de agendamento que já existe.
- Verificação de temperatura de CPU/GPU (via bibliotecas como `wmi` ou
  sensores de placa-mãe, quando disponíveis) com alerta se passar do normal.
- Gerenciador de drivers: checagem periódica de drivers desatualizados via
  winget, com lista pra você decidir o que atualizar.
- Limpeza seletiva de cache de navegador (Chrome/Edge) com confirmação.

--- MONITORAMENTO AVANÇADO ---
- Histórico de uso ao longo do tempo (gráfico simples em texto de CPU/RAM
  dos últimos 30 minutos), não só o instante atual.
- Alerta específico por processo: "me avisa se o Chrome passar de 2GB de
  RAM", configurável por você.
- Monitoramento de temperatura e velocidade de ventoinha (quando o hardware
  expõe essa informação).
- Relatório de uptime: há quanto tempo o PC está ligado sem reiniciar.
- Verificação de espaço em disco por pasta (quais pastas específicas estão
  ocupando mais espaço, não só o total do disco).

--- VELOCIDADE DE RESPOSTA ---
- Pré-carregamento de contexto: ao iniciar, o agente já carrega as memórias
  mais usadas recentemente na RAM, em vez de buscar do zero a cada pergunta.
- Compressão de histórico antigo: conversas de mais de 30 dias viram um
  resumo compacto em vez de ficarem palavra por palavra, deixando a busca de
  memória mais rápida sem perder o essencial.
- Priorização de atalho sobre IA sempre que possível — isso já é o
  comportamento padrão do agente, e continua sendo a maior fonte de
  velocidade: um atalho não gasta tempo de rede nem de geração de texto.
- Execução paralela de ferramentas independentes quando um pedido pede mais
  de uma coisa ao mesmo tempo (ex.: "abre o chrome e verifica o sistema" —
  as duas rodam ao mesmo tempo em vez de uma esperar a outra).

--- ATALHOS EXTRAS PARA IR ADICIONANDO ---
- Atalhos de janela: minimizar tudo, maximizar janela atual, alternar entre
  janelas abertas.
- Atalhos de mídia: play/pause, próxima faixa, volume up/down, sem precisar
  abrir o programa de música.
- Atalhos de captura: gravar a tela por N segundos e salvar automaticamente
  numa pasta de gravações.
- Atalhos de rede: mostrar o IP local e público na hora, testar velocidade
  de internet.
- Atalhos de limpeza: esvaziar a lixeira, fechar todos os programas menos os
  que você está usando agora.

Como sempre: cada uma dessas é um passo real e implementável, não uma
promessa vaga — é só me pedir qual quer que eu implemente de verdade a
seguir, com o mesmo cuidado (confirmação, backup, autocura) que já está em
todo o resto do código.

================================================================================
13. CORREÇÃO DO BUG DE "PAUSAR MÚSICA" (NOVO)
================================================================================
O problema não era falta de inteligência do agente — era falta de DUAS
coisas específicas, e as duas foram corrigidas:

1. Não existia nenhuma ferramenta real de controle de mídia. Sem isso, o
   modelo, ao não saber o que fazer, "inventava" uma ação (abrir o
   navegador/YouTube) porque parecia relacionado ao pedido. Isso não é o
   modelo "burro" — é o modelo tentando ajudar sem ter a ferramenta certa
   disponível. Agora existe `controlar_midia`, que manda a tecla de mídia
   virtual do sistema (a mesma tecla física de play/pause do teclado) — ela
   controla o que estiver tocando de verdade, sem precisar saber se é
   Spotify, YouTube ou qualquer outro player.

2. Não existia nenhuma instrução dizendo ao agente para preferir ferramentas
   reais a simular ações. Agora existe um prompt de sistema fixo
   (`PROMPT_SISTEMA_AGENTE`) inserido automaticamente no histórico na
   primeira execução, dizendo explicitamente: nunca abra navegador como
   substituto de uma ação que você não sabe fazer — use a ferramenta certa,
   ou avise que falta uma ferramenta (e sugira `evoluir_agente` pra criar
   ela).

Também foram adicionados atalhos DIRETOS de mídia (camada de velocidade,
antes até de chegar no agente com ferramentas): "pausa a música", "próxima
música", "aumenta o volume" etc. respondem na hora, sem gastar nenhuma
chamada de API — o mesmo princípio de velocidade que já existia pros
programas, agora vale pra mídia também.

================================================================================
14. SOBRE "MIL IDEIAS" E "NUNCA ERRAR" (honestidade, de novo)
================================================================================
Continuo sendo direto sobre isso porque é importante: gerar mil ideias
genuinamente distintas sobre automação de PC não é possível sem virar
repetição disfarçada — isso deixaria o arquivo maior, não melhor. O caminho
que realmente funciona é o que fizemos até aqui: cada relato de problema
real (como o da música) vira uma correção real, com causa identificada e
ferramenta nova de verdade — não uma lista de promessas.

Sobre "resolver qualquer erro sozinho": o sistema de autocura
(`executar_com_autocura`) já existe e cobre a maior parte dos casos —
detecta o erro, diagnostica com IA, tenta de novo se for algo passageiro. Mas
existem erros que nenhum software resolve sozinho por definição: falta de
internet, chave de API inválida, permissão negada pelo Windows, hardware
com defeito. Nesses casos, o melhor que o agente pode (e vai) fazer é te
dizer com clareza o que aconteceu e o que fazer — em vez de fingir que
resolveu.

================================================================================
15. ESCUDO GLOBAL CONTRA TRAVAMENTO (NOVO — resolve o "tive que abrir novo prompt")
================================================================================
O que provavelmente aconteceu antes: alguma exceção não prevista escapou de
todo o resto do código e derrubou o processo Python inteiro, jogando você de
volta pro prompt de comando, sem o agente rodando mais.

Agora existem dois "ganchos globais" (`sys.excepthook` e `threading.excepthook`)
que capturam QUALQUER erro fatal, tanto na thread principal quanto nas
threads em background (fila de tarefas, agendador, autodiagnóstico), ANTES
de o processo morrer:

1. O erro é registrado em `crash_log.json` (o que aconteceu e quando).
2. Se `nivel_permissao` estiver como `"admin"` no config.json, o agente
   relança automaticamente uma nova instância dele mesmo em uma nova janela
   — você não precisa abrir nada manualmente.
3. Se `nivel_permissao` for `"padrao"` ou `"basico"`, ele te avisa
   claramente o que aconteceu e pede pra você rodar `python agente.py` de
   novo (porque reiniciar o próprio processo sozinho também é uma ação de
   sistema, e respeita o mesmo controle de permissão de tudo mais).

Isso não impede 100% dos travamentos possíveis (um travamento de hardware ou
do próprio Windows não tem como um script Python evitar), mas cobre a
esmagadora maioria dos casos de "o script quebrou no meio da conversa".

================================================================================
16. CONFIGURAÇÃO REAL DE APARÊNCIA E ENERGIA (NOVO)
================================================================================
`configurar_aparencia_e_energia` aplica de verdade, sem você precisar clicar
em nada:

- `tema_escuro` / `tema_claro` — troca o tema do Windows via registro.
- `tempo_espera_tela` — define em quantos minutos a tela apaga sozinha.
- `tempo_suspensao` — define em quantos minutos o PC suspende sozinho.

Isso complementa o `otimizar_sistema` (que já mexia em plano de energia,
limpeza e disco) — juntos, os dois cobrem a maior parte do que dá pra
configurar no Windows sem precisar de ferramenta externa.

================================================================================
17. CONFIGURAÇÃO DE DISPOSITIVO — PESQUISADO E CONFIRMADO (NOVO)
================================================================================
Antes de implementar, pesquisei contra a documentação oficial da Microsoft
pra confirmar o que é possível e o que NÃO é possível configurar via script:

- **Brilho da tela**: funciona via WMI (`WmiSetBrightness`), confirmado com a
  documentação da Microsoft. MAS só funciona em telas de notebook com painel
  compatível — monitores externos e desktops normalmente não expõem esse
  controle, isso é limitação de hardware/driver, não do agente.
- **Bluetooth ligar/desligar**: funciona via PowerShell (`Enable-PnpDevice` /
  `Disable-PnpDevice`), confirmado. Precisa que o Prompt de Comando esteja
  aberto como Administrador.
- **Idioma do teclado**: funciona via `Set-WinUserLanguageList`, confirmado.
- **Programa padrão para tipo de arquivo (ex.: definir o navegador padrão)**:
  pesquisei a fundo e a resposta honesta é que **isso NÃO é mais possível de
  configurar via script para o usuário atual**, desde a atualização Windows
  10 20H2. A Microsoft adicionou verificação de hash nas chaves de registro
  de associação de arquivo justamente para impedir que programas (inclusive
  navegadores concorrentes entre si) mudassem isso à força — o comando
  DISM `Import-DefaultAppAssociations` só funciona para perfis de usuário
  NOVOS, criados depois da importação, não pro seu usuário atual. Não
  implementei essa ação porque ela simplesmente não funcionaria — preferi
  te contar a limitação real a fingir uma solução.
- **Modo avião / Luz noturna / Não perturbe**: pesquisei e não existem
  comandos oficiais e estáveis da Microsoft pra essas três coisas — os
  métodos que existem por aí mexem em blobs binários não documentados do
  registro, que mudam de formato a cada atualização do Windows e quebram
  facilmente. Preferi não implementar em vez de te dar um código que
  funciona hoje e quebra no próximo Windows Update.

================================================================================
18. MAIS IDEIAS REAIS — categorias ainda não cobertas
================================================================================
Reforçando o que já expliquei antes: 500 ideias genuinamente distintas e
úteis sobre automação de PC não existem — depois de uma certa quantidade,
vira repetição. Aqui vai mais uma leva real, em categorias que ainda não
tinham entrado no banco de ideias:

--- SEGURANÇA E PRIVACIDADE ---
- Verificação de senhas vazadas (via Have I Been Pwned API) para os
  e-mails que você cadastrar, com alerta se algum aparecer num vazamento.
- Checagem de programas com permissão de câmera/microfone ativa, avisando
  se algo suspeito estiver com acesso.
- Verificação de firewall ativo e relatório de portas abertas.
- Lembrete automático de troca de senha em contas que você configurar.

--- BACKUP E RECUPERAÇÃO ---
- Backup incremental agendado de pastas de projeto pra um segundo local
  (HD externo, outra pasta, ou serviço de nuvem já configurado no PC).
- Ponto de restauração do sistema criado automaticamente antes de qualquer
  ação de "otimizar_sistema" ou "configurar_dispositivo_avancado" bem mais
  arriscada (ex.: antes de mexer em Bluetooth ou idioma do sistema).
- Exportação periódica de toda a memória do agente (contatos, projetos,
  histórico) pra um arquivo de backup único, fácil de restaurar num PC novo.

--- REDE ---
- Teste de velocidade de internet sob demanda.
- Diagnóstico de "por que a internet caiu" (verifica DNS, gateway, adaptador
  de rede, nessa ordem, e reporta onde está o problema).
- Lista de dispositivos conectados na rede local.

--- OTIMIZAÇÃO PARA JOGOS (alinhado com o seu perfil de uso) ---
- "Modo jogo automático": ao detectar que um jogo foi aberto (processo
  conhecido tipo Rocket League, Steam games), aplica automaticamente plano
  de energia de alto desempenho e pausa notificações, revertendo quando o
  jogo fecha.
- Monitor de FPS/desempenho durante uma sessão de jogo, com relatório no
  final (queda de FPS, uso de CPU/GPU ao longo do tempo).
- Verificação de drivers de GPU desatualizados especificamente (via winget
  ou pelo site do fabricante), separado da checagem geral de drivers.

--- ACESSIBILIDADE E CONVENIÊNCIA ---
- Modo "leitura em voz alta de qualquer texto selecionado" (você seleciona
  um texto em qualquer programa, pede pro agente ler, ele usa o TTS).
- Lembretes por voz configuráveis ("me lembra de beber água a cada hora").
- Perfil de configuração por horário do dia (ex.: brilho mais baixo à
  noite, automaticamente, combinando com o agendamento que já existe).

Cada uma dessas é implementável de verdade — é só pedir qual, e faço a
pesquisa técnica de novo antes de implementar, do mesmo jeito que fiz agora
com brilho, Bluetooth e idioma de teclado.

================================================================================
19. RODÍZIO DE IAs GRATUITAS (NOVO — o fim do "bateu a cota")
================================================================================
Em vez de depender de um único cérebro (o Gemini, que tem um limite diário
gratuito), o agente agora tem uma LISTA de IAs gratuitas na nuvem e vai
trocando sozinho:

  Ordem de tentativa (configurável em config.json -> "provedores_ia"):
    1. Gemini  (Google)  — chave GEMINI_API_KEY
    2. Groq    (Llama 3.3 70B, muuuita cota, muito rápido) — GROQ_API_KEY
    3. Cerebras(Llama 3.3 70B, 1 milhão de tokens/dia)     — CEREBRAS_API_KEY
    4. SambaNova (Llama 3.3 70B, 200 mil tokens/dia)       — SAMBANOVA_API_KEY
    5. OpenRouter (Llama 3.3 70B gratuito)                 — OPENROUTER_API_KEY

Como funciona:
- Toda chamada (conversa principal E ferramentas que usam IA) tenta a IA da
  vez. Se ela responder, ótimo — o agente lembra qual foi e continua nela.
- Se ela falhar por cota (erro 429 / quota / rate limit) ou qualquer erro de
  rede, o agente imprime "[Rodizio]: 'X' falhou. Tentando 'Y'..." e pula
  para a próxima IA da lista, repetindo a mesma pergunta.
- Só se TODAS falharem é que aparece a mensagem de "cota esgotada".

Por que e rapido e nao trava no PC:
- Tudo roda na nuvem: e rapido e NAO pesa na CPU/RAM do seu PC (nao usa modelo
  local/Ollama, que deixava o computador lento).
- Cada provedor da uma chave gratuita com a SUA cota - somando Groq + Cerebras
  + SambaNova + OpenRouter, o folego diario fica enorme.
- E tem o Pollinations no fim da lista: gratuito, SEM chave e SEM cadastro,
  que serve de rede de seguranca quando todas as chaves estourarem o teto do
  dia. Ou seja, mesmo sem configurar nada, o agente continua respondendo.
- O prompt e enxuto e o historico e curto, entao cada pergunta gasta pouca
  cota (boas praticas de prompt/contextos do GitHub, ver secao 20).

Como pegar as chaves (tudo gratuito, sem cartão de crédito):
  Groq      : https://console.groq.com/keys
  Cerebras  : https://cloud.cerebras.ai
  SambaNova : https://cloud.sambanova.ai
  OpenRouter: https://openrouter.ai/keys
Em cada site: cria conta (pode entrar com Google/GitHub), gera uma "API key",
copia e registra no Windows com (uma linha por vez no cmd):
    setx GROQ_API_KEY "cole_a_chave_aqui"
    setx CEREBRAS_API_KEY "cole_a_chave_aqui"
    setx SAMBANOVA_API_KEY "cole_a_chave_aqui"
    setx OPENROUTER_API_KEY "cole_a_chave_aqui"
Depois FECHE e ABRA o cmd de novo (o setx só vale em janelas novas).
Instale a biblioteca uma vez:  pip install langchain-openai

As chaves que você NÃO configurar são simplesmente ignoradas — o agente roda
só com as que existirem (mínimo: o Gemini). Digite "status" pra ver quantas
IAs ficaram ativas e qual está respondendo no momento.

Observação honesta: os modelos gratuitos do Groq/Cerebras/etc. são os mesmos
(Llama 3.3 70B) e suportam as ferramentas do agente, mas são um pouco
diferentes do Gemini — em alguma tarefa muito específica a resposta pode
variar. A prioridade continua sendo o Gemini; as outras entram como reserva.

================================================================================
FIM DA DOCUMENTAÇÃO — A PARTIR DAQUI COMEÇA O CÓDIGO REAL
================================================================================
"""

import os
import sys
import json
import time
import threading
import difflib
import random
import subprocess
import traceback
import queue
from datetime import datetime

import pyautogui
import pywhatkit as kit
import pandas as pd
from pypdf import PdfReader
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import create_agent
from langchain_core.tools import tool

# ==========================================================================
# =================== PRIVILÉGIOS DE ADMINISTRADOR (NOVO) ==================
# ==========================================================================
# Bloco ADICIONADO — nada do código acima/abaixo foi alterado. O que ele faz:
#
# O Windows separa programas "normais" de programas "como Administrador".
# Várias funções deste agente SÓ funcionam com privilégio de Administrador
# (ex.: ligar/desligar Bluetooth via Enable-PnpDevice/Disable-PnpDevice,
# algumas otimizações de sistema). Sem isso, o Windows recusa a operação.
#
# Ao iniciar, o agente pergunta ao Windows se já está rodando como
# Administrador:
#   - Se JÁ estiver (janela do cmd aberta "como Administrador"), segue normal.
#   - Se NÃO estiver, ele relança ele MESMO pedindo a telinha de permissão do
#     Windows (o UAC: "Deseja permitir que este aplicativo faça alterações no
#     dispositivo?"). Aceitando -> abre uma nova janela já com privilégio total
#     e a janela antiga fecha sozinha. Recusando -> o agente roda normal sem
#     admin, e só as funções que exigem admin avisam que não deram certo.
#
# IMPORTANTE: isto é DIFERENTE do "nivel_permissao": "admin" do config.json.
#   * config.json "nivel_permissao": "admin" -> o agente não pede 'sim/não'
#     antes de ações sensíveis (controle INTERNO de comportamento).
#   * Este bloco -> privilégio de Administrador do WINDOWS (conta do sistema),
#     exigido pelo próprio sistema operacional pra certas operações.
# Os dois são independentes: este bloco cuida do Windows; o config cuida do
# comportamento do agente.
def _ja_sou_administrador() -> bool:
    """Retorna True se o processo já está rodando com privilégio de
    Administrador no Windows. Em outros sistemas operacionais (Linux/Mac)
    retorna True, porque esse mecanismo de elevação é específico do Windows."""
    if os.name != "nt":
        return True
    try:
        import ctypes
        return bool(ctypes.windll.shell32.IsUserAnAdmin())
    except Exception:
        return False


def garantir_privilegios_administrador() -> bool:
    """Garante que o agente rode como Administrador no Windows. Se já
    estiver elevado, não faz nada. Se não estiver, relança o próprio script
    com o verbo 'runas' — é isso que dispara o pedido de permissão do UAC —
    e encerra a instância atual (sem privilégio) para não ficar duas janelas.
    Se o usuário clicar em 'Não' no UAC (ou algo falhar), o agente continua
    rodando normalmente sem admin, com um aviso claro."""
    if _ja_sou_administrador():
        return True

    print(
        "\n[Permissões]: este agente precisa de privilégios de ADMINISTRADOR "
        "para algumas funções (ex.: ligar/desligar Bluetooth, certas "
        "otimizações de sistema). O Windows vai pedir sua permissão agora "
        "(telinha do UAC) — clique em 'Sim' para abrir o agente como "
        "Administrador."
    )
    try:
        import ctypes

        caminho_do_agente = os.path.abspath(__file__)
        # ShellExecuteW com o verbo "runas" é a forma oficial do Windows de
        # pedir elevação: o sistema mostra o UAC e, se autorizado, abre o
        # programa já como Administrador. O argumento 1 no final = mostrar a
        # nova janela normalmente (SW_SHOWNORMAL).
        resultado = ctypes.windll.shell32.ShellExecuteW(
            None,                       # janela-pai (nenhuma)
            "runas",                    # verbo = executar como Administrador
            sys.executable,             # o próprio Python que está rodando
            f'"{caminho_do_agente}"',   # argumento: o caminho deste agente.py
            None,                       # diretório de trabalho (padrão)
            1,                          # como mostrar a janela: normal
        )
        # A documentação do Windows diz que ShellExecuteW retorna um valor
        # maior que 32 quando dá certo; valores <= 32 são códigos de erro
        # (ex.: 1223 = usuário cancelou o UAC).
        if resultado <= 32:
            raise OSError(f"ShellExecuteW retornou o código de erro {resultado}")

        # A nova instância (já como Administrador) está abrindo em outra
        # janela. Fechamos esta instância sem privilégio para não ficar o
        # agente rodando duplicado.
        sys.exit(0)
    except SystemExit:
        raise
    except Exception as e:
        print(
            f"\n[Permissões]: não foi possível abrir como Administrador agora "
            f"({e}). Se você clicou em 'Não' na telinha do Windows, tudo bem "
            "— o agente continua rodando normalmente; apenas as funções que "
            "exigem Administrador vão avisar que não puderam ser executadas. "
            "Para abrir como admin manualmente: feche o agente, clique com o "
            "botão direito no Prompt de Comando e escolha 'Executar como "
            "administrador', depois rode 'python agente.py' de novo."
        )
        return False


# Garante a elevação LOGO no início, antes de qualquer outra coisa que possa
# precisar de privilégio de Administrador.
garantir_privilegios_administrador()

# ================= CONFIGURAÇÃO E ARQUIVOS DE MEMÓRIA =================
PASTA_BASE = os.path.dirname(os.path.abspath(__file__))
PASTA_PROJETOS = os.path.join(PASTA_BASE, "projetos")
ARQ_CONFIG = os.path.join(PASTA_BASE, "config.json")
ARQ_HISTORICO = os.path.join(PASTA_BASE, "historico.json")
ARQ_CONTATOS = os.path.join(PASTA_BASE, "contatos.json")
ARQ_LOG_WHATS = os.path.join(PASTA_BASE, "logs_whatsapp.json")
ARQ_MEMORIA_LONGA = os.path.join(PASTA_BASE, "memoria_longa.json")
ARQ_MEMORIA_CORE = os.path.join(PASTA_BASE, "memoria_core.md")      # fatos permanentes (sempre no contexto)
ARQ_LICOES = os.path.join(PASTA_BASE, "licoes_aprendidas.md")       # licoes do autocura (Reflexion)
ARQ_PROJETOS_REGISTRO = os.path.join(PASTA_BASE, "projetos.json")
ARQ_REGRAS = os.path.join(PASTA_BASE, "regras.json")
ARQ_TAREFAS_AGENDADAS = os.path.join(PASTA_BASE, "tarefas_agendadas.json")
ARQ_CACHE = os.path.join(PASTA_BASE, "cache.json")

DEFAULT_CONFIG = {
    "modelo_principal": "gemini-3.5-flash-lite",
    # A lista de IAs do rodizio fica definida no proprio codigo
    # (PROVEDORES_IA_PADRAO, mais abaixo) e e sempre reescrita no config ao
    # iniciar - assim, quando um modelo e aposentado e o codigo e atualizado,
    # a correcao vale na hora, sem o usuario precisar apagar nada.
    "nivel_permissao": "padrao",  # "basico" | "padrao" | "admin"
    "modo_voz": False,
    "idioma_voz": "portuguese",
    "intervalo_autodiagnostico_minutos": 15,
    "tom_bem_humorado": True,  # deixa mensagens específicas com um toque de humor
}


def carregar_json(caminho, padrao):
    if os.path.exists(caminho):
        try:
            with open(caminho, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return padrao
    return padrao


def salvar_json(caminho, dados):
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)


def _extrair_texto(conteudo) -> str:
    """Normaliza o conteúdo de uma resposta do LLM para TEXTO PURO.

    Correção necessária: nas versões novas do langchain-google-genai, a
    resposta do modelo vem como uma lista de blocos (ex.:
    [{'type': 'text', 'text': '...', 'extras': {...}}]) em vez de uma string
    simples. Sem converter, o agente imprimia/salvava a estrutura crua no
    histórico e as próximas chamadas à API falhavam (erro de "última mensagem
    inválida"). Aqui juntamos todos os blocos de texto numa string só."""
    if isinstance(conteudo, str):
        return conteudo
    if isinstance(conteudo, list):
        partes = []
        for bloco in conteudo:
            if isinstance(bloco, dict):
                if bloco.get("type") == "text" and bloco.get("text"):
                    partes.append(bloco["text"])
            elif isinstance(bloco, str):
                partes.append(bloco)
        return "\n".join(partes)
    return str(conteudo) if conteudo else ""


config = carregar_json(ARQ_CONFIG, DEFAULT_CONFIG)
for chave, valor in DEFAULT_CONFIG.items():
    config.setdefault(chave, valor)
salvar_json(ARQ_CONFIG, config)

historico_conversas = carregar_json(ARQ_HISTORICO, [])
contatos = carregar_json(ARQ_CONTATOS, {})
logs_whatsapp = carregar_json(ARQ_LOG_WHATS, [])
memoria_longa = carregar_json(ARQ_MEMORIA_LONGA, [])  # lista de {"texto":..., "tags":[...], "data":...}
projetos_registrados = carregar_json(ARQ_PROJETOS_REGISTRO, [])
regras = carregar_json(ARQ_REGRAS, [])  # lista de {"gatilho": "...", "acao": "..."}
tarefas_agendadas = carregar_json(ARQ_TAREFAS_AGENDADAS, [])
cache_respostas = carregar_json(ARQ_CACHE, {})
TEMPO_EXPIRACAO_CACHE_SEGUNDOS = 600  # 10 minutos — evita responder algo desatualizado pra sempre

# --- NOVO: prompt de sistema fixo, ensinando o agente a NUNCA inventar uma
# ação (como abrir navegador) quando existe uma ferramenta real pra aquilo.
# Isso corrige a raiz do bug de "pausar música" virar aba do YouTube: o
# problema não era falta de inteligência, era falta de instrução clara +
# falta da ferramenta certa. Agora as duas coisas existem.
# Prompt de sistema proprio ("own your prompt", fator 2 do 12-Factor Agents):
# e o principal ponto de controle do comportamento do agente. Mantido curto e
# direto para NAO desperdicar cota das IAs gratuitas em cada chamada (as regras
# mais importantes vem primeiro). Inspirado nos guias de prompt do GitHub
# (dair-ai/Prompt-Engineering-Guide e dontriskit/awesome-ai-system-prompts):
# papel claro, regras de ferramenta explicitas, e instrucao de poupar tokens.
PROMPT_SISTEMA_AGENTE = (
    "Voce e um assistente de automacao de PC que controla o Windows de verdade. "
    "Responda sempre em portugues do Brasil, de forma curta e direta.\n"
    "REGRAS:\n"
    "1. Para perguntas, conversa ou explicacoes, RESPONDA DIRETAMENTE em texto. "
    "Nao chame ferramenta se da para responder so com o que voce ja sabe - isso "
    "evita gastar chamadas a toa.\n"
    "2. So use uma ferramenta quando o pedido exigir uma ACAO real no PC "
    "(abrir programa/site, enviar mensagem, criar/editar/apagar arquivo, "
    "mudar configuracao, gerar projeto, etc.). Se existir a ferramenta certa, "
    "use-a; NUNCA finja uma acao abrindo navegador/busca como substituto.\n"
    "3. Se nenhuma ferramenta resolver, diga claramente e sugira a ferramenta "
    "'evoluir_agente' para criar a que falta. Nunca invente que executou algo. "
    "Para acoes gerais do Windows sem ferramenta propria, use 'executar_comando' "
    "(ela roda qualquer comando do terminal e devolve o resultado/erro; comandos "
    "destrutivos pedem confirmacao).\n"
    "4. 'controlar_midia' e SO para controlar o que JA esta tocando (pausar, "
    "tocar, avancar, volume). Para ABRIR um site (YouTube, Gmail, WhatsApp Web) "
    "use 'abrir_site_no_navegador', mesmo que a palavra musica/video apareca.\n"
    "5. Para criar uma funcao NOVA no proprio codigo, chame 'evoluir_agente' - "
    "UMA funcao por vez, nome em letras minusculas sem acento/espaco "
    "(ex.: esvaziar_lixeira). Ideia em comentario nao vira codigo; se pedirem "
    "varias de uma vez, faca a principal e diga que as demais vem depois.\n"
    "6. Acoes sensiveis (apagar, enviar, instalar, mudar sistema) ja pedem "
    "confirmacao; respeite isso e nunca force uma acao negada.\n"
    "7. Para tarefas longas (varias etapas), faca UMA etapa por vez, confira o "
    "resultado da ferramenta e so entao faca a proxima - nao tente executar tudo "
    "de uma vez. Se uma etapa falhar, leia o erro e ajuste antes de seguir.\n"
    "8. Quando a ferramenta devolver um resultado, baseie sua resposta no que "
    "realmente aconteceu (não invente sucesso). Se nao souber algo que depende do "
    "PC, use a ferramenta de verificacao em vez de chutar.\n"
    "9. MEMORIA: quando o usuario contar um fato PERMANENTE sobre ele (nome, "
    "profissao, cidade, uma preferencia, um programa/pasta que usa sempre, como "
    "gosta que voce responda), grave de forma curta com 'gravar_memoria_core' "
    "para nunca mais esquecer. NAO grave detalhes de uma conversa so nem segredos/"
    "senhas. Se precisar lembrar algo permanente, use 'consultar_memoria_core'.\n"
    "10. NAO repita a mesma chamada de ferramenta com os mesmos argumentos mais de "
    "2 vezes seguidas. Se uma etapa falhar, leia o erro e MUDE a abordagem (ou "
    "faca uma etapa menor); se mesmo assim nao resolver, pare e peca orientacao."
)
# Sempre atualiza o prompt de sistema pra versão mais recente, mesmo que já
# exista um salvo de uma execução anterior — sem isso, melhorias no prompt
# feitas depois da primeira execução nunca chegariam a valer de verdade.
if historico_conversas and historico_conversas[0].get("role") == "system":
    historico_conversas[0]["content"] = PROMPT_SISTEMA_AGENTE
else:
    historico_conversas.insert(0, {"role": "system", "content": PROMPT_SISTEMA_AGENTE})
salvar_json(ARQ_HISTORICO, historico_conversas)

# --- CORREÇÃO: limpa o histórico salvo de execuções anteriores ---
# Respostas antigas podem ter sido salvas como lista de blocos (formato
# novo do LangChain) ou como mensagens vazias (Enter sem digitar nada),
# o que fazia a API do Gemini recusar a próxima chamada. Aqui tudo vira
# texto puro e mensagens vazias são descartadas de uma vez por todas.
_historico_limpo = []
for _msg in historico_conversas:
    _conteudo = _extrair_texto(_msg.get("content", ""))
    if _conteudo.strip():
        _msg["content"] = _conteudo
        _historico_limpo.append(_msg)
historico_conversas[:] = _historico_limpo
salvar_json(ARQ_HISTORICO, historico_conversas)

os.makedirs(PASTA_PROJETOS, exist_ok=True)

# ================= ESCUDO GLOBAL CONTRA TRAVAMENTO (NOVO) =================
# Resolve o problema de "o agente bugou e eu tive que abrir um novo prompt
# de comando". Isso captura QUALQUER erro fatal que escape de todo o resto
# do código (inclusive fora do laço principal) ANTES que ele derrube o
# processo com a tela de erro crua do Python — registra o que aconteceu e
# relança o agente automaticamente, sem você precisar fazer nada.
ARQ_CRASH_LOG = os.path.join(PASTA_BASE, "crash_log.json")


def registrar_crash(origem: str, tipo_erro: str, valor_erro: str):
    crashes = carregar_json(ARQ_CRASH_LOG, [])
    crashes.append({
        "data": datetime.now().isoformat(),
        "origem": origem,
        "erro": f"{tipo_erro}: {valor_erro}",
    })
    del crashes[:-100]  # mantém só os últimos 100 registros
    salvar_json(ARQ_CRASH_LOG, crashes)


def relancar_agente_automaticamente():
    """Relança uma nova instância do agente automaticamente, respeitando o
    nível de permissão configurado — só reinicia sozinho no nível 'admin',
    já que reiniciar o processo é, em si, uma ação de sistema."""
    if config.get("nivel_permissao") == "admin":
        print("\n[Autorrecuperação]: reiniciando o agente automaticamente em 3 segundos...")
        time.sleep(3)
        try:
            if os.name == "nt":
                subprocess.Popen(
                    [sys.executable, os.path.abspath(__file__)],
                    creationflags=subprocess.CREATE_NEW_CONSOLE,
                )
            else:
                subprocess.Popen([sys.executable, os.path.abspath(__file__)])
        except Exception as e:
            print(f"[Autorrecuperação]: não consegui relançar sozinho ({e}). Rode 'python agente.py' de novo.")
    else:
        print(
            "\n[Aviso]: o agente encerrou de forma inesperada. O erro foi registrado em "
            "crash_log.json. Para que ele se reinicie SOZINHO da próxima vez (sem você "
            "precisar abrir um novo prompt de comando), defina "
            "'nivel_permissao': 'admin' no config.json. Por enquanto, rode 'python "
            "agente.py' novamente."
        )


def excecao_global_nao_tratada(tipo, valor, tb):
    """Gancho global do Python: chamado automaticamente sempre que uma
    exceção não capturada em nenhum outro lugar do código está prestes a
    derrubar o processo inteiro. Substitui a tela de erro crua por
    diagnóstico + tentativa de autorrecuperação."""
    mensagem_erro = f"{tipo.__name__}: {valor}"
    print(f"\n[Escudo global]: erro fatal capturado -> {mensagem_erro}")
    registrar_crash("thread_principal", tipo.__name__, str(valor))
    relancar_agente_automaticamente()


sys.excepthook = excecao_global_nao_tratada


def excecao_thread_nao_tratada(args):
    """Mesma proteção, mas para as threads em background (fila de tarefas,
    agendador, autodiagnóstico) — sem isso, uma thread poderia morrer
    silenciosamente e você nem saberia que aquele recurso parou de funcionar."""
    mensagem_erro = f"{args.exc_type.__name__}: {args.exc_value}"
    print(f"\n[Escudo global]: erro fatal na thread '{args.thread.name}' -> {mensagem_erro}")
    registrar_crash(f"thread:{args.thread.name}", args.exc_type.__name__, str(args.exc_value))


threading.excepthook = excecao_thread_nao_tratada


# ================= RODIZIO DE IAS GRATUITAS (MULTI-PROVEDOR) =================
# Em vez de depender de UM so cerebro (que estoura a cota do dia), o agente
# monta uma LISTA de IAs gratuitas na nuvem, pela ordem do config
# ("provedores_ia"). Cada chamada tenta a IA da vez; se ela falhar por cota
# (429/quota/rate limit) ou qualquer erro, ele pula sozinho para a proxima
# IA da lista. Todas rodam na nuvem (rapido, nao pesa no PC) e cada provedor
# tem sua propria chave e sua propria cota — entao, com varias chaves, o
# limite pratico de uso por dia fica muito maior.
# Lista CANONICA de IAs gratuitas do rodizio. Os nomes de modelo aqui sao os
# atuais (alguns antigos, como llama-3.3-70b, foram aposentados pelos
# provedores e passaram a responder "modelo nao encontrado"). Para trocar ou
# acrescentar uma IA, e so editar esta lista. So entram as que tiverem a chave
# de ambiente configurada; as demais sao ignoradas.
PROVEDORES_IA_PADRAO = [
    {"nome": "Gemini (Google)",        "tipo": "gemini", "modelo": "gemini-3.5-flash-lite",       "chave_env": "GEMINI_API_KEY"},
    {"nome": "Groq (GPT-OSS 120B)",    "tipo": "openai", "modelo": "openai/gpt-oss-120b",         "chave_env": "GROQ_API_KEY",      "base_url": "https://api.groq.com/openai/v1"},
    {"nome": "Groq (GPT-OSS 20B)",     "tipo": "openai", "modelo": "openai/gpt-oss-20b",          "chave_env": "GROQ_API_KEY",      "base_url": "https://api.groq.com/openai/v1"},
    # Reserva (algumas contas/regioes ainda tem estes; se nao existirem, o
    # rodizio marca como mortas na 1a tentativa e segue sem incomodar):
    {"nome": "Groq (Llama 3.3 70B)",   "tipo": "openai", "modelo": "llama-3.3-70b-versatile",      "chave_env": "GROQ_API_KEY",      "base_url": "https://api.groq.com/openai/v1"},
    {"nome": "Groq (Llama 4 Scout)",   "tipo": "openai", "modelo": "llama-4-scout-17b-16e-instruct","chave_env": "GROQ_API_KEY",     "base_url": "https://api.groq.com/openai/v1"},
    {"nome": "Cerebras (Llama 3.3 70B)","tipo": "openai", "modelo": "llama-3.3-70b",               "chave_env": "CEREBRAS_API_KEY", "base_url": "https://api.cerebras.ai/v1"},
    {"nome": "SambaNova (Llama 70B)",  "tipo": "openai", "modelo": "Meta-Llama-3.3-70B-Instruct", "chave_env": "SAMBANOVA_API_KEY", "base_url": "https://api.sambanova.ai/v1"},
    {"nome": "OpenRouter (Llama 70B)", "tipo": "openai", "modelo": "meta-llama/llama-3.3-70b-instruct:free", "chave_env": "OPENROUTER_API_KEY", "base_url": "https://openrouter.ai/api/v1"},
    # GitHub Models: modelos de ponta (DeepSeek, GPT, Llama) usando um TOKEN
    # gratuito do GitHub (cria em github.com -> Settings -> Developer settings
    # -> Personal access tokens -> Tokens classic -> Generate, sem marcar nada;
    # salva com setx GITHUB_TOKEN "ghp_..."). Compativel com OpenAI (Azure).
    {"nome": "GitHub Models (DeepSeek R1)", "tipo": "openai", "modelo": "DeepSeek-R1", "chave_env": "GITHUB_TOKEN", "base_url": "https://models.inference.ai.azure.com"},
    # Rede de seguranca SEM CHAVE e SEM CADASTRO: Pollinations. Como nao pede
    # chave nem cartao, fica sempre ativa e serve de ultima tentativa quando
    # todas as IAs com chave estourarem a cota do dia.
    {"nome": "Pollinations (gratis, sem chave)", "tipo": "openai", "modelo": "openai", "chave_env": None, "base_url": "https://text.pollinations.ai/openai", "sem_chave": True},
]

# Garante que o config tenha sempre a lista mais nova (inofensivo; e so uma
# referencia gravada - o codigo usa a constante acima).
config["provedores_ia"] = PROVEDORES_IA_PADRAO
salvar_json(ARQ_CONFIG, config)

modelos_ia = []   # lista de {"nome", "llm"} na ordem de preferencia


def _chave_ia(nome_env):
    """Busca a chave de uma IA em dois lugares:
    1) variavel de ambiente (setx GROQ_API_KEY ...);
    2) um arquivo de chaves 'chaves.txt' (ou '.env') na pasta do agente.
    O arquivo usa o formato: NOME_DA_VARIAVEL=valor  (uma por linha; linhas
    iniciadas com # sao ignoradas). Assim as chaves funcionam MESMO quando a
    variavel de ambiente nao chega ao processo elevado do Windows."""
    if not nome_env:
        return ""
    valor = os.environ.get(nome_env, "")
    if valor:
        return valor.strip()
    for nome_arq in ("chaves.txt", ".env"):
        caminho_arq = os.path.join(PASTA_BASE, nome_arq)
        if os.path.exists(caminho_arq):
            try:
                with open(caminho_arq, "r", encoding="utf-8-sig") as f:
                    for linha in f:
                        linha = linha.strip()
                        if not linha or linha.startswith("#") or "=" not in linha:
                            continue
                        chave, _, conteudo = linha.partition("=")
                        if chave.strip().upper() == nome_env.upper():
                            return conteudo.strip().strip('"').strip("'")
            except Exception:
                pass
    return ""


for _prov in PROVEDORES_IA_PADRAO:
    _chave = _chave_ia(_prov.get("chave_env") or "")
    # Provedores "sem_chave" (ex.: Pollinations) nao pedem chave: usamos um
    # valor qualquer so para a biblioteca nao reclamar e eles ficam sempre
    # ativos.
    if _prov.get("sem_chave"):
        _chave = _chave or "chave-nao-necessaria"
    if not _chave:
        continue  # sem chave configurada para este provedor -> ignora
    try:
        if _prov.get("tipo") == "gemini":
            _modelo = ChatGoogleGenerativeAI(model=_prov["modelo"], temperature=0)
        else:
            # Provedores OpenAI-compativeis (Groq, Cerebras, SambaNova,
            # OpenRouter...): todos usam a MESMA biblioteca (ChatOpenAI),
            # mudando so o endereco (base_url), a chave e o nome do modelo.
            from langchain_openai import ChatOpenAI
            _modelo = ChatOpenAI(
                model=_prov["modelo"],
                base_url=_prov["base_url"],
                api_key=_chave,
                temperature=0,
            )
        modelos_ia.append({"nome": _prov.get("nome", _prov.get("modelo")), "llm": _modelo})
    except Exception as _e:
        # Provedor indisponivel (ex.: falta a biblioteca langchain-openai):
        # so avisa e segue com os demais, nunca derruba o agente.
        print(f"[Aviso]: provedor '{_prov.get('nome')}' indisponivel ({_e}).")

# IAs que deram erro PERMANENTE nesta execucao (modelo inexistente, chave
# invalida) entram aqui e sao puladas no rodizio, para nao ficar tentando uma
# IA que ja sabemos que nao vai responder. Erros de cota (429) NAO entram:
# esses melhoram sozinhos e merecem nova tentativa depois.
_ias_mortas = set()


def _erro_permanente(_e):
    _txt = f"{type(_e).__name__} {_e}".lower()
    return any(_m in _txt for _m in (
        "modelnotfound", "notfound", "model_not_found", "does not exist",
        "no such model", "authentication", "unauthorized", "invalid api key",
        "invalidapikey", "permission", "forbidden", "401", "404",
    ))


def _eh_erro_de_recursao(_e) -> bool:
    """Detecta o anti-loop do grafo de ferramentas (ex.: GraphRecursionError
    do LangGraph) ou um RecursionError cru do Python - ambos significam que o
    agente enroscou repetindo passos, nao que a IA esteja sem cota."""
    _txt = f"{type(_e).__name__} {_e}".lower()
    return ("recursion" in _txt) or isinstance(_e, RecursionError)


_TEXTO_TODAS_FALHARAM = (
    "Todas as IAs do rodizio estao sem cota ou indisponiveis no momento. "
    "As cotas gratuitas renovam sozinhas (algumas em minutos, outras no "
    "reset diario). Enquanto isso, os atalhos que NAO usam IA (abrir "
    "programas/sites, 'status', play/pausa de musica, modo panico) "
    "continuam funcionando."
)


def _percorrer_rodizio(chamar, extrair):
    """Tenta cada IA ativa, comecando pela ultima que funcionou. Em erro
    permanente (modelo/chave), marca a IA como morta nesta sessao e pula;
    em erro de cota/rede, so avisa e tenta a proxima. Retorna o que
    'extrair(resposta)' devolver, ou None se todas falharem."""
    global indice_ia_atual
    total = len(modelos_ia)
    for _passo in range(total):
        _idx = (indice_ia_atual + _passo) % total
        if _idx in _ias_mortas:
            continue
        _info = modelos_ia[_idx]
        try:
            _resp = chamar(_idx, _info["llm"])
            _extraido = extrair(_resp)
            # Modelos de raciocinio (ex.: gpt-oss) as vezes devolvem o conteudo
            # num campo diferente e o texto final vem VAZIO. Tratar isso como
            # falha faz o rodizio pular para a proxima IA em vez de mostrar uma
            # resposta em branco para o usuario.
            if isinstance(_extraido, str) and not _extraido.strip():
                raise ValueError("resposta vazia do modelo (conteudo em branco)")
            indice_ia_atual = _idx  # lembra qual IA respondeu, pra comecar por ela
            return _extraido
        except Exception as _e:
            # Anti-loop (ideia OpenDev "doom-loop"): se o agente ficou repetindo
            # a mesma ferramenta e estourou o limite de passos do grafo, NAO
            # adianta trocar de IA (o problema e o agente ter enroscado, nao o
            # modelo). Relanca para ser tratado como mensagem amigavel, e grava
            # uma licao para nao repetir.
            if _eh_erro_de_recursao(_e):
                registrar_licao(
                    "O agente entrou em loop e repetiu a mesma ferramenta muitas "
                    "vezes. Para tarefas grandes, fazer UMA etapa por vez; se uma "
                    "ferramenta falhar 2 vezes, parar e pedir orientacao, nao insistir."
                )
                raise
            _prox = None
            for _k in range(1, total + 1):
                _cand = (_idx + _k) % total
                if _cand not in _ias_mortas:
                    _prox = modelos_ia[_cand]["nome"]
                    break
            print(f"[Rodizio]: '{_info['nome']}' falhou ({type(_e).__name__})."
                  + (f" Tentando '{_prox}'..." if _prox else " Sem outras IAs ativas."))
            if _erro_permanente(_e):
                _ias_mortas.add(_idx)
    return None

if not modelos_ia:
    print("Erro: nenhuma IA configurada. Configure pelo menos UMA chave, por exemplo:")
    print('  setx GEMINI_API_KEY "sua_chave"')
    print('  setx GROQ_API_KEY "sua_chave"   (gratuita e com muita cota)')
    print("Depois feche e abra o cmd e rode de novo. Veja a secao RODIZIO DE IAS")
    print("na documentacao do topo do arquivo.")
    sys.exit(1)

# 'llm' continua sendo a IA principal (a primeira da lista), mantido por
# compatibilidade com o resto do codigo.
llm = modelos_ia[0]["llm"]
indice_ia_atual = 0

print(" IAs ativas no rodizio:")
for _i, _m in enumerate(modelos_ia):
    print(f"   {_i + 1}. {_m['nome']}")

# Memória semântica de verdade: usa embeddings do Gemini pra comparar
# SIGNIFICADO, não só texto parecido. Se a API de embeddings falhar por
# qualquer motivo (sem internet, sem crédito), o agente cai automaticamente
# de volta pra busca por similaridade de texto (difflib) — nunca quebra.
embeddings_model = None
_chave_gemini_emb = _chave_ia("GEMINI_API_KEY")
if _chave_gemini_emb:
    try:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        embeddings_model = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004", google_api_key=_chave_gemini_emb
        )
    except Exception as e:
        print(f"[Aviso]: memoria semantica por embeddings indisponivel ({type(e).__name__}). Usando busca por texto.")
# Sem chave do Gemini: fica so com a busca por texto (difflib), sem aviso.

# Voz: carregamento tolerante (se as libs não estiverem instaladas, o agente
# simplesmente desativa o recurso e avisa, sem travar o resto)
motor_tts = None
if config.get("modo_voz"):
    try:
        import pyttsx3
        motor_tts = pyttsx3.init()
    except Exception as e:
        print(f"[Aviso]: TTS indisponível ({e}). Rode 'pip install pyttsx3' para ativar voz.")


def falar(texto: str):
    """Fala em voz alta se o modo voz estiver ativo e a lib estiver disponível."""
    if config.get("modo_voz") and motor_tts:
        try:
            motor_tts.say(texto)
            motor_tts.runAndWait()
        except Exception:
            pass


# ================= ESCUDO DE AUTOCURA DE ERROS (IDEIA #1) =================
def diagnosticar_erro_com_ia(nome_ferramenta: str, erro: Exception) -> str:
    """Manda o erro para o LLM diagnosticar em português simples e sugerir
    uma correção prática (sem precisar de traceback cru para o usuário)."""
    mensagem_erro = f"{type(erro).__name__}: {str(erro)}"
    prompt = (
        f"A ferramenta '{nome_ferramenta}' do meu agente de automação em Python "
        f"deu o seguinte erro: {mensagem_erro}\n"
        "Explique em 1-2 frases simples, em português, o que provavelmente "
        "causou isso e o que eu preciso instalar/configurar/corrigir para "
        "resolver. Seja direto e prático."
    )
    try:
        resposta = invocar_com_fallback([{"role": "user", "content": prompt}])
        return _extrair_texto(resposta.content)
    except Exception:
        return (
            f"Não consegui nem diagnosticar com IA (erro original: {mensagem_erro}). "
            "Verifique sua conexão e a chave da API."
        )


ERROS_TRANSITORIOS = (TimeoutError, ConnectionError)


def _eh_erro_de_cota(erro: Exception) -> bool:
    """Detecta erro de LIMITE/cota da API do Gemini (429 / quota / rate limit).
    Esse erro não é culpa do código e NÃO pode ser diagnosticado chamando a IA
    (ela também está sem cota) — sem essa detecção, o erro aparecia duplicado."""
    texto = f"{type(erro).__name__} {erro}".lower()
    marcadores = (
        "429", "resource_exhausted", "resourceexhausted", "rate limit",
        "ratelimit", "rate_limit", "quota", "too many requests",
        "resourcelimit",
    )
    return any(m in texto for m in marcadores)


def _mensagem_erro_de_cota(erro: Exception) -> str:
    """Mensagem clara em português para quando a cota do Gemini acaba —
    orienta esperar o reset diario, sem traceback cru."""
    texto = str(erro)
    cota_diaria = ("500" in texto) or ("free_tier" in texto.lower()) or ("perday" in texto.lower().replace(" ", ""))
    if cota_diaria:
        return (
            "[Cota diaria esgotada] As IAs gratuitas do rodizio bateram o limite "
            "do dia. Isso nao e defeito do agente - e o limite das chaves "
            "gratuitas. Os limites renovam sozinhos (alguns em minutos, outros no "
            "reset diario). Para ter ainda mais folego, adicione mais chaves "
            "gratuitas (Groq, Cerebras, SambaNova, OpenRouter) - veja a secao "
            "'RODIZIO DE IAS' na documentacao. Enquanto isso, os atalhos que NAO "
            "usam IA (abrir programas, 'status', play/pausa de musica, modo "
            "panico, abrir sites) continuam funcionando normalmente."
        )
    return (
        "[Limite de requisicoes por minuto] Muitas chamadas em sequencia (erro "
        "429). O agente ja tenta trocar de IA sozinho; se mesmo assim insistir, "
        "aguarde cerca de 1 minuto e tente novamente."
    )


def executar_com_autocura(nome_ferramenta: str, funcao, *args, max_tentativas=3, **kwargs):
    """Escudo universal: executa qualquer função, e se falhar, tenta entender
    o erro, avisa o usuário de forma clara, e tenta de novo se for algo
    transitório (rede, timeout etc.)."""
    tentativa = 0
    while True:
        tentativa += 1
        try:
            return funcao(*args, **kwargs)
        except ERROS_TRANSITORIOS as e:
            if _eh_erro_de_cota(e):
                return _mensagem_erro_de_cota(e)
            if _eh_erro_de_recursao(e):
                # Anti-loop: NAO e um erro de rede/IA a ser diagnosticado;
                # repassa para o laco principal dar a mensagem amigavel.
                raise
            if tentativa >= max_tentativas:
                diagnostico = diagnosticar_erro_com_ia(nome_ferramenta, e)
                return f"[Falhou após {max_tentativas} tentativas] {diagnostico}"
            espera = 2 ** tentativa
            print(f"[Autocura]: erro transitório em '{nome_ferramenta}', tentando de novo em {espera}s...")
            time.sleep(espera)
        except Exception as e:
            if _eh_erro_de_cota(e):
                # Não chama a IA pra diagnosticar: ela também está sem cota,
                # então a chamada falharia de novo e o erro sairia duplicado.
                print("[Autocura]: limite de cota/requisicoes da IA detectado.")
                return _mensagem_erro_de_cota(e)
            if _eh_erro_de_recursao(e):
                # Agente enroscou em loop (nao e erro de cota). Repassa para o
                # laco principal tratar com a mensagem de "fazer por partes",
                # em vez de gastar cota diagnosticando.
                raise
            diagnostico = diagnosticar_erro_com_ia(nome_ferramenta, e)
            print(f"[Autocura] Diagnóstico do erro em '{nome_ferramenta}': {diagnostico}")
            return f"Erro em '{nome_ferramenta}'. Diagnóstico da IA: {diagnostico}"


def invocar_com_fallback(mensagens):
    # Ponto unico de chamada do modelo. Mantive o nome da funcao para nao
    # precisar alterar as dezenas de ferramentas que ja a usam. Percorre o
    # rodizio de IAs (ver _percorrer_rodizio).
    from types import SimpleNamespace
    _resultado = _percorrer_rodizio(
        lambda _idx, _llm: _llm.invoke(mensagens),
        lambda _resp: _resp,
    )
    if _resultado is not None:
        return _resultado
    return SimpleNamespace(content=_TEXTO_TODAS_FALHARAM)


# Mantido baixo para poupar cota das IAs gratuitas (muitas tem teto de tokens
# por minuto). O que for mais antigo continua na memoria de longo prazo.
LIMITE_MENSAGENS_HISTORICO = 20  # ~10 trocas de pergunta/resposta


def recortar_historico():
    """Mantém o histórico enxuto: preserva o prompt de sistema (se houver) +
    as últimas LIMITE_MENSAGENS_HISTORICO mensagens. Conversas mais antigas
    já estão preservadas de forma resumida na memória de longo prazo
    (memoria_longa), então cortar aqui não perde a informação, só evita
    reenviar tudo pra API a cada pergunta."""
    if not historico_conversas:
        return
    tem_prompt_sistema = historico_conversas[0].get("role") == "system"
    prefixo = historico_conversas[:1] if tem_prompt_sistema else []
    resto = historico_conversas[1:] if tem_prompt_sistema else historico_conversas
    if len(resto) > LIMITE_MENSAGENS_HISTORICO:
        historico_conversas[:] = prefixo + resto[-LIMITE_MENSAGENS_HISTORICO:]


def salvar_historico():
    recortar_historico()
    salvar_json(ARQ_HISTORICO, historico_conversas)


def pedir_confirmacao(mensagem: str) -> bool:
    nivel = config.get("nivel_permissao", "padrao")
    if nivel == "admin":
        return True
    if nivel == "basico":
        print(f"\n[Bloqueado no nível 'basico']: {mensagem}")
        return False
    resposta = input(f"\n[Confirmação necessária] {mensagem} (sim/não): ").strip().lower()
    return resposta in ("sim", "s", "yes", "y")


def confirmar_destrutivo(mensagem: str) -> bool:
    """Trava FORTE para acoes que nao tem volta (apagar, formatar, desligar,
    mexer em registro/usuarios, comandos COMANDOS_PERIGOSOS). Diferente de
    pedir_confirmacao, esta SEMPRE pergunta 'sim/nao' - inclusive no nivel
    'admin' - e no nivel 'basico' bloqueia de vez. E a regra do projeto:
    acoes destrutivas sao aprovadas UMA A UMA pelo usuario, nunca automaticas."""
    if config.get("nivel_permissao", "padrao") == "basico":
        print(f"\n[Bloqueado no nível 'basico']: {mensagem}")
        return False
    print("\n[ACAO DESTRUTIVA / SEM VOLTA] " + mensagem)
    resposta = input("Digite 'sim' para EXECUTAR, ou qualquer outra coisa para cancelar: ").strip().lower()
    return resposta in ("sim", "s", "yes", "y")


def abrir_no_vscode(caminho_pasta: str) -> str:
    """Abre uma pasta no VS Code REAPROVEITANDO a janela já aberta (flag
    oficial -r/--reuse-window da própria Microsoft), em vez de empilhar uma
    janela nova a cada projeto. Também corrige um problema de estabilidade:
    passar uma LISTA de argumentos junto com shell=True faz o Windows
    processar as aspas/espaços do caminho DUAS vezes (uma vez convertendo a
    lista pra string, outra vez reinterpretando via cmd.exe) — isso é o que
    provavelmente causava trava ao abrir pastas com espaço no nome. A
    correção é montar a string já pronta, com aspas certas, e usar shell=True
    só sobre essa string."""
    try:
        subprocess.Popen(f'code -r "{caminho_pasta}"', shell=True)
        return "Projeto aberto no VS Code (reaproveitando a janela já aberta, se houver)."
    except Exception as e:
        return f"Não consegui abrir o VS Code automaticamente ({e})."


# ================= MEMÓRIA SEMÂNTICA DE LONGO PRAZO (IDEIA #2) =================
def registrar_memoria_longa(texto: str, tags=None):
    entrada = {
        "texto": texto,
        "tags": tags or [],
        "data": datetime.now().isoformat(),
    }
    if embeddings_model:
        try:
            entrada["embedding"] = embeddings_model.embed_query(texto)
        except Exception:
            pass  # sem embedding neste registro, ainda funciona pela busca por texto
    memoria_longa.append(entrada)
    # mantém só as últimas 500 lembranças pra não crescer infinito
    del memoria_longa[:-500]
    salvar_json(ARQ_MEMORIA_LONGA, memoria_longa)


def _similaridade_cosseno(vetor_a, vetor_b):
    import numpy as np
    a, b = np.array(vetor_a), np.array(vetor_b)
    norma = (np.linalg.norm(a) * np.linalg.norm(b)) + 1e-8
    return float(np.dot(a, b) / norma)


def buscar_memorias_relevantes(pergunta: str, limite=3):
    """Busca as lembranças mais relevantes pra pergunta atual. Usa embeddings
    (comparação por SIGNIFICADO, não só texto parecido) quando disponível;
    cai automaticamente pra similaridade de texto (difflib) se os embeddings
    falharem ou se lembranças antigas não tiverem embedding salvo."""
    if not memoria_longa:
        return []

    if embeddings_model:
        try:
            vetor_pergunta = embeddings_model.embed_query(pergunta)
            pontuadas = [
                (_similaridade_cosseno(vetor_pergunta, m["embedding"]), m)
                for m in memoria_longa if m.get("embedding")
            ]
            if pontuadas:
                pontuadas.sort(key=lambda par: par[0], reverse=True)
                relevantes = [m for pontuacao, m in pontuadas[:limite] if pontuacao > 0.5]
                if relevantes:
                    return relevantes
        except Exception:
            pass  # cai pro método de texto abaixo

    textos = [m["texto"] for m in memoria_longa]
    parecidos = difflib.get_close_matches(pergunta, textos, n=limite, cutoff=0.3)
    return [m for m in memoria_longa if m["texto"] in parecidos]


# ============ MEMORIA EM CAMADAS (Cline Memory Bank / MemGPT) ============
# Ideia copiada dos melhores agentes: separar a memoria em (a) CORE = fatos
# permanentes que valem OURO e ficam SEMPRE no contexto (nome do usuario,
# preferencias, dados do PC), e (b) ARQUIVO = tudo o resto (memoria_longa),
# que so e puxado quando tem a ver com a pergunta. Assim o agente lembra do
# que importa sem encher a janela nem gastar cota a toa. Tudo em arquivos
# markdown simples na pasta do agente (da pra abrir e ler/editar no Bloco de
# Notas), sem banco vetorial nem dependencia nova.

_TEMPLATE_CORE = (
    "# MEMORIA CENTRAL DO AGENTE\n"
    "# Isto fica SEMPRE dentro do contexto (o agente nunca esquece daqui).\n"
    "# Escreva frases curtas e duradouras. O proprio agente mantem isto.\n"
    "\n## Sobre o usuario\n- (nada registrado ainda)\n"
    "\n## Preferencias e jeito de trabalhar\n- (nada registrado ainda)\n"
    "\n## Dados importantes do PC e do uso\n- (nada registrado ainda)\n"
)


def _garantir_memoria_core():
    if not os.path.exists(ARQ_MEMORIA_CORE):
        try:
            with open(ARQ_MEMORIA_CORE, "w", encoding="utf-8") as f:
                f.write(_TEMPLATE_CORE)
        except Exception:
            pass


def _ler_arquivo_texto(caminho) -> str:
    try:
        with open(caminho, "r", encoding="utf-8-sig") as f:
            return f.read()
    except Exception:
        return ""


def ler_memoria_core() -> str:
    """Devolve o conteudo util da memoria central, sem as linhas de comentario
    e sem os placeholders vazios - so os fatos de verdade, bem compacto."""
    _garantir_memoria_core()
    linhas_uteis = []
    for linha in _ler_arquivo_texto(ARQ_MEMORIA_CORE).splitlines():
        linha = linha.rstrip()
        if not linha or linha.startswith("#"):
            continue
        if "(nada registrado ainda)" in linha:
            continue
        linhas_uteis.append(linha)
    return "\n".join(linhas_uteis).strip()


def _mapear_secao_core(secao: str) -> str:
    s = (secao or "").lower()
    if "pref" in s or "jeito" in s or "gosto" in s or "estilo" in s:
        return "## Preferencias e jeito de trabalhar"
    if "pc" in s or "computador" in s or "sistema" in s or "dado" in s or "conta" in s:
        return "## Dados importantes do PC e do uso"
    return "## Sobre o usuario"


@tool
def gravar_memoria_core(secao: str, fato: str) -> str:
    """Grava na MEMORIA CENTRAL do agente um fato PERMANENTE e importante que
    deve ser lembrado para sempre (ex.: nome do usuario, profissao, uma
    preferencia dele, um caminho de pasta que ele usa sempre, um programa
    favorito). Use para coisas duradouras - NAO use para detalhes de uma
    conversa so (isso ja vai para a memoria comum). 'secao' pode ser
    'usuario', 'preferencias' ou 'pc'. Escreva o fato em frase curta."""
    _garantir_memoria_core()
    conteudo = _ler_arquivo_texto(ARQ_MEMORIA_CORE) or _TEMPLATE_CORE
    alvo = _mapear_secao_core(secao)
    fato = fato.strip().replace("\n", " ").strip("- ").strip()
    linha_nova = f"- {fato}"
    if linha_nova[2:].lower() in conteudo.lower():
        return "Esse fato ja estava na memoria central."
    linhas = conteudo.splitlines()
    # localiza a linha do cabecalho da secao
    idx = None
    for i, ln in enumerate(linhas):
        if ln.strip() == alvo:
            idx = i
            break
    if idx is None:
        # secao ainda nao existe: cria no fim do arquivo
        linhas += ["", alvo, linha_nova]
    else:
        insercao = idx + 1
        # se a linha logo abaixo for o placeholder vazio, removemos ela
        if insercao < len(linhas) and "(nada registrado ainda)" in linhas[insercao]:
            del linhas[insercao]
        linhas.insert(insercao, linha_nova)
    # limite de seguranca: nunca deixar o arquivo enorme (sempre no contexto)
    texto_final = "\n".join(linhas)
    if len(texto_final) > 3500:
        texto_final = texto_final[-3500:]
    try:
        with open(ARQ_MEMORIA_CORE, "w", encoding="utf-8") as f:
            f.write(texto_final)
        return f"Memoria central atualizada em '{alvo.replace('#', '').strip()}': {fato}"
    except Exception as e:
        return f"Nao consegui gravar na memoria central: {e}"


@tool
def consultar_memoria_core() -> str:
    """Le TUDO o que esta gravado na memoria central do agente (fatos
    permanentes sobre o usuario, preferencias e dados do PC). Use quando
    precisar lembrar de detalhes do usuario que nao estao na conversa atual."""
    core = ler_memoria_core()
    return core if core else "A memoria central ainda esta vazia."


# ============ DIARIO DE LICOES (REFLEXION / SUPERDENSE) ============
# Toda vez que o autocura conserta um erro de verdade (ou uma tentativa
# falha e a seguinte da certo), guardamos uma licao curta num arquivo. Essas
# licoes sao injetadas no comeco de cada conversa, entao o agente aprende
# com os proprios erros e para de repetir a mesma falha - e o padrao
# Reflexion, mas sem gastar cota (e tudo local, em texto).

def registrar_licao(texto: str):
    """Grava uma licao curta e deduzida (sem segredos). Ignora repetidas."""
    texto = " ".join(str(texto).split()).strip()
    if len(texto) < 12:
        return
    ja_tem = _ler_arquivo_texto(ARQ_LICOES)
    chave = texto[:45].lower()
    if chave and chave in ja_tem.lower():
        return
    linha = f"- [{datetime.now().strftime('%Y-%m-%d')}] {texto}\n"
    try:
        with open(ARQ_LICOES, "a", encoding="utf-8") as f:
            f.write(linha)
        # mantem so as ultimas 40 licoes (arquivo pequeno sempre)
        todas = [l for l in _ler_arquivo_texto(ARQ_LICOES).splitlines() if l.strip()]
        if len(todas) > 40:
            with open(ARQ_LICOES, "w", encoding="utf-8") as f:
                f.write("\n".join(todas[-40:]) + "\n")
    except Exception:
        pass


def ler_licoes(limite_chars=1200) -> str:
    linhas = [l for l in _ler_arquivo_texto(ARQ_LICOES).splitlines() if l.strip()]
    if not linhas:
        return ""
    texto = "\n".join(linhas)
    return texto[-limite_chars:].strip()


_garantir_memoria_core()



# ================= MOTOR DE REGRAS CONDICIONAIS (IDEIA #5) =================
def verificar_regras(comando: str):
    """Regras simples: se o gatilho (palavra/frase) aparece no comando, roda
    a ação associada. Editável direto no arquivo regras.json, sem tocar em
    código."""
    for regra in regras:
        gatilho = regra.get("gatilho", "").lower()
        if gatilho and gatilho in comando.lower():
            acao = regra.get("acao", "")
            if acao == "falar_sempre":
                falar(f"Atenção: comando com gatilho '{gatilho}' detectado.")
            print(f"[Regra ativada]: gatilho='{gatilho}' -> ação='{acao}'")


# ================= FILA DE TAREFAS ASSÍNCRONA (IDEIA #8) =================
fila_tarefas = queue.Queue()


def worker_fila_tarefas():
    while True:
        item = fila_tarefas.get()
        if item is None:
            break
        descricao, funcao, args, kwargs = item
        print(f"\n[Fila]: iniciando tarefa em background -> {descricao}")
        resultado = executar_com_autocura(descricao, funcao, *args, **kwargs)
        print(f"\n[Fila]: tarefa concluída -> {descricao}\nResultado: {resultado}")
        falar(f"Tarefa concluída: {descricao}")
        fila_tarefas.task_done()


threading.Thread(target=worker_fila_tarefas, daemon=True).start()


# ================= AGENDAMENTO TIPO CRON (IDEIA #4) =================
def worker_agendador():
    """Roda em background, checando a cada 30s se alguma tarefa agendada
    deve disparar agora. Usa uma lista simples em tarefas_agendadas.json,
    formato: {"quando": "HH:MM", "descricao": "..."}"""
    while True:
        agora = datetime.now().strftime("%H:%M")
        for tarefa in tarefas_agendadas:
            if tarefa.get("quando") == agora and not tarefa.get("executada_hoje"):
                print(f"\n[Agendador]: executando tarefa programada -> {tarefa['descricao']}")
                fila_tarefas.put((
                    tarefa["descricao"],
                    lambda desc=tarefa["descricao"]: _extrair_texto(invocar_com_fallback(
                        [{"role": "user", "content": desc}]
                    ).content),
                    (), {},
                ))
                tarefa["executada_hoje"] = True
                salvar_json(ARQ_TAREFAS_AGENDADAS, tarefas_agendadas)
        if agora == "00:00":
            for tarefa in tarefas_agendadas:
                tarefa["executada_hoje"] = False
        time.sleep(30)


threading.Thread(target=worker_agendador, daemon=True).start()


# ================= AUTODIAGNÓSTICO PROATIVO (IDEIA #9) =================
def worker_autodiagnostico():
    intervalo = config.get("intervalo_autodiagnostico_minutos", 15) * 60
    while True:
        time.sleep(intervalo)
        try:
            import psutil
            cpu = psutil.cpu_percent(interval=1)
            ram = psutil.virtual_memory().percent
            if cpu > 90 or ram > 90:
                aviso = f"[Autodiagnóstico]: uso crítico detectado -> CPU {cpu}% | RAM {ram}%"
                print(f"\n{aviso}")
                falar("Atenção, uso de CPU ou memória está crítico no seu PC.")
        except ImportError:
            pass
        except Exception:
            pass


threading.Thread(target=worker_autodiagnostico, daemon=True).start()


# ================= ATALHOS RÁPIDOS (VELOCIDADE) =================
ATALHOS_PROGRAMAS = {
    "abrir calculadora": ("calc.exe", "Calculadora"),
    "abra a calculadora": ("calc.exe", "Calculadora"),
    "calculadora": ("calc.exe", "Calculadora"),
    "abrir bloco de notas": ("notepad.exe", "Bloco de Notas"),
    "abra o bloco de notas": ("notepad.exe", "Bloco de Notas"),
    "bloco de notas": ("notepad.exe", "Bloco de Notas"),
    "abrir vscode": ("code", "Visual Studio Code"),
    "abra o visual studio code": ("code", "Visual Studio Code"),
    "vscode": ("code", "Visual Studio Code"),
    "abrir navegador": ("start chrome", "Google Chrome"),
    "abra o chrome": ("start chrome", "Google Chrome"),
    "google": ("start chrome", "Google Chrome"),
    "abrir gerenciador": ("taskmgr", "Gerenciador de Tarefas"),
    "gerenciador de tarefas": ("taskmgr", "Gerenciador de Tarefas"),

    # --- NOVO: sites comuns, resolve o bug de "abrir youtube" ser confundido
    # com controle de mídia por falta de atalho direto ---
    "abrir youtube": ("start https://youtube.com", "YouTube"),
    "abra o youtube": ("start https://youtube.com", "YouTube"),
    "abrir gmail": ("start https://mail.google.com", "Gmail"),
    "abra o gmail": ("start https://mail.google.com", "Gmail"),
    "abrir whatsapp web": ("start https://web.whatsapp.com", "WhatsApp Web"),
    "abra o whatsapp web": ("start https://web.whatsapp.com", "WhatsApp Web"),

    # --- Novos atalhos: pacote Office / produtividade ---
    "abrir word": ("start winword", "Microsoft Word"),
    "abra o word": ("start winword", "Microsoft Word"),
    "abrir excel": ("start excel", "Microsoft Excel"),
    "abra o excel": ("start excel", "Microsoft Excel"),
    "abrir powerpoint": ("start powerpnt", "Microsoft PowerPoint"),
    "abrir outlook": ("start outlook", "Microsoft Outlook"),
    "abrir teams": ("start teams", "Microsoft Teams"),

    # --- Ferramentas do próprio Windows ---
    "abrir explorador de arquivos": ("explorer", "Explorador de Arquivos"),
    "abrir meu computador": ("explorer", "Explorador de Arquivos"),
    "abrir paint": ("mspaint", "Paint"),
    "abra o paint": ("mspaint", "Paint"),
    "abrir ferramenta de captura": ("start ms-screenclip:", "Ferramenta de Captura"),
    "tirar print": ("start ms-screenclip:", "Ferramenta de Captura"),
    "abrir prompt de comando": ("start cmd", "Prompt de Comando"),
    "abrir cmd": ("start cmd", "Prompt de Comando"),
    "abrir powershell": ("start powershell", "PowerShell"),
    "abrir painel de controle": ("control", "Painel de Controle"),
    "abrir configurações": ("start ms-settings:", "Configurações do Windows"),
    "abra as configurações": ("start ms-settings:", "Configurações do Windows"),
    "abrir gerenciador de dispositivos": ("devmgmt.msc", "Gerenciador de Dispositivos"),
    "abrir serviços": ("services.msc", "Gerenciador de Serviços"),
    "abrir monitor de recursos": ("resmon", "Monitor de Recursos"),
    "abrir configuração do sistema": ("msconfig", "Configuração do Sistema"),
    "abrir limpeza de disco": ("cleanmgr", "Limpeza de Disco"),
    "abrir editor de registro": ("regedit", "Editor de Registro"),
    "abrir mapa de caracteres": ("charmap", "Mapa de Caracteres"),
    "abrir agenda de tarefas": ("taskschd.msc", "Agendador de Tarefas do Windows"),
    "abrir informações do sistema": ("msinfo32", "Informações do Sistema"),

    # --- Navegadores extras ---
    "abrir edge": ("start msedge", "Microsoft Edge"),
    "abrir firefox": ("start firefox", "Mozilla Firefox"),

    # --- Jogos e apps de lazer (do seu perfil) ---
    "abrir steam": ("start steam://open/main", "Steam"),
    "abrir discord": ("start discord", "Discord"),
    "abrir spotify": ("start spotify", "Spotify"),
    "abrir obs": ("start obs", "OBS Studio"),

    # --- Ações rápidas de sistema (sem precisar de confirmação, são inofensivas) ---
    "bloquear tela": ("rundll32.exe user32.dll,LockWorkStation", "Tela bloqueada"),
    "trava a tela": ("rundll32.exe user32.dll,LockWorkStation", "Tela bloqueada"),
    "abrir central de ações": ("start ms-actioncenter:", "Central de Ações"),
    "abrir wi-fi": ("start ms-settings:network-wifi", "Configurações de Wi-Fi"),
    "abrir bluetooth": ("start ms-settings:bluetooth", "Configurações de Bluetooth"),
    "abrir som": ("start ms-settings:sound", "Configurações de Som"),
    "abrir vídeo": ("start ms-settings:display", "Configurações de Tela"),
    "abrir atualizações": ("start ms-settings:windowsupdate", "Windows Update"),
}

# Gatilhos de "so conversa": perguntas comuns que o modelo responde DIRETO, sem
# montar o agente com ferramentas - assim poupa chamadas/cota (fator 3 e 10 do
# 12-Factor Agents: contexto curto e agente focado). As PALAVRAS_TAREFA_COMPLEXA
# tem prioridade: se a frase pedir uma acao real, cai no agente com ferramentas.
PALAVRAS_CONVERSA = [
    "quem é", "quem e", "quem foi", "qual é", "qual e", "qual a", "qual o",
    "quais são", "quais sao", "o que é", "o que e", "o que são", "o que sao",
    "o que foi", "o que vc", "o que você", "explique", "explica", "conte",
    "conta", "lembra", "lembre", "como é", "como e", "como foi", "como se",
    "como faz", "por que", "porque", "pra que", "para que", "quando",
    "onde fica", "onde está", "onde esta", "defina", "definição", "definicao",
    "capital", "significa", "traduza", "resuma", "resumo", "diga", "fala",
    "fale sobre", "me diz", "me conta", "sabe", "sobre o que", "projeto", "nome",
]
PALAVRAS_TAREFA_COMPLEXA = [
    "crie", "delete", "pasta", "arquivo", "whatsapp", "manda mensagem",
    "envia mensagem", "site", "atualiza", "atualização", "configuração",
    "agenda", "macro", "regra",
    # Memoria: qualquer pedido de GRAVAR/LEMBRAR um fato permanente precisa ir
    # pro agente completo (so ele tem a ferramenta gravar_memoria_core). O chat
    # rapido nao tem ferramentas e por isso nao consegue salvar nada.
    "lembra", "lembre", "memoria", "memória", "anote", "guarda", "guarde",
    "esquece", "me chamo", "meu nome", "se lembre", "decora", "nao se esqueça",
    "não se esqueça", "grava isso",
]


def resolver_atalho_por_similaridade(cmd: str):
    candidatos = list(ATALHOS_PROGRAMAS.keys())
    melhor = difflib.get_close_matches(cmd, candidatos, n=1, cutoff=0.6)
    return melhor[0] if melhor else None


# --- NOVO: atalhos de mídia (corrige o bug de "pausar música" abrir aba do YouTube) ---
# Estes usam as teclas de mídia virtuais do sistema operacional, então funcionam
# em QUALQUER coisa que esteja tocando no momento — Spotify, YouTube, Windows
# Media Player, o que for — sem precisar identificar qual app está ativo.
ATALHOS_MIDIA = {
    "pausar musica": "playpause", "pausar música": "playpause",
    "pausa a musica": "playpause", "pausa a música": "playpause",
    "pause a musica": "playpause", "pause a música": "playpause",
    "tocar musica": "playpause", "tocar música": "playpause",
    "toca a musica": "playpause", "toca a música": "playpause",
    "play na musica": "playpause", "play na música": "playpause",
    "despausar musica": "playpause", "despausar música": "playpause",
    "continuar musica": "playpause", "continuar música": "playpause",
    "proxima musica": "nexttrack", "próxima musica": "nexttrack", "próxima música": "nexttrack",
    "pula a musica": "nexttrack", "pula a música": "nexttrack",
    "musica anterior": "prevtrack", "música anterior": "prevtrack",
    "volta a musica": "prevtrack", "volta a música": "prevtrack",
    "aumentar volume": "volumeup", "aumenta o volume": "volumeup", "sobe o volume": "volumeup",
    "diminuir volume": "volumedown", "diminui o volume": "volumedown", "abaixa o volume": "volumedown",
    "mutar": "volumemute", "muta o som": "volumemute", "muta o audio": "volumemute", "muta o áudio": "volumemute",
    "desmutar": "volumemute", "tira o mudo": "volumemute",
}


def resolver_atalho_midia_por_similaridade(cmd: str):
    melhor = difflib.get_close_matches(cmd, list(ATALHOS_MIDIA.keys()), n=1, cutoff=0.6)
    return melhor[0] if melhor else None


# --- NOVO: toque de humor opcional, usado só em mensagens específicas
# (modo pânico, geração de README) — não altera nenhuma lógica existente,
# só a frase extra no final da mensagem. Desativa em config.json com
# "tom_bem_humorado": false se preferir um tom mais seco.
FRASES_HUMOR_PANICO = [
    "Tudo parado. Respira, eu seguro aqui.",
    "Modo pânico ativado — nada de dramático, só uma pausa.",
    "Pronto, tudo congelado. Sem crise.",
]
FRASES_HUMOR_README = [
    "README escrito. Documentação é 90% do profissionalismo e 10% preguiça futura evitada.",
    "Pronto, README na régua. Seu 'eu do futuro' agradece.",
]


def com_toque_de_humor(mensagem: str, banco_de_frases: list) -> str:
    if config.get("tom_bem_humorado") and banco_de_frases:
        return f"{mensagem} {random.choice(banco_de_frases)}"
    return mensagem


def mostrar_status():
    """Painel de status instantâneo (ideia #10) — não gasta API."""
    print("\n" + "=" * 50)
    print(" STATUS DO SUPER AGENTE")
    print("=" * 50)
    print(f"Nível de permissão : {config.get('nivel_permissao')}")
    print(f"Modo voz           : {'ligado' if config.get('modo_voz') else 'desligado'}")
    print(f"IAs no rodizio     : {len(modelos_ia)} ativa(s)")
    print(f"IA em uso agora    : {modelos_ia[indice_ia_atual]['nome']}")
    print(f"Contatos salvos    : {len(contatos)}")
    print(f"Projetos criados   : {len(projetos_registrados)}")
    print(f"Lembranças na memória de longo prazo: {len(memoria_longa)}")
    print(f"Tarefas agendadas  : {len(tarefas_agendadas)}")
    print("=" * 50)


def processar_atalho_rapido(comando: str) -> bool:
    cmd = comando.lower().strip()

    # NOVO: Modo Pânico / kill switch — checado ANTES de qualquer outra
    # coisa, sem confirmação (uma parada de emergência que pede confirmação
    # não é uma parada de emergência). Cancela tarefas na fila e agendadas,
    # sem matar o processo inteiro (você continua podendo usar o agente
    # normalmente depois, só que sem nada pendente rodando).
    if cmd in ("modo panico", "modo pânico", "parar tudo", "para tudo"):
        canceladas_fila = 0
        with fila_tarefas.mutex:
            canceladas_fila = len(fila_tarefas.queue)
            fila_tarefas.queue.clear()
        for tarefa in tarefas_agendadas:
            tarefa["executada_hoje"] = True  # impede disparo hoje sem apagar o agendamento
        salvar_json(ARQ_TAREFAS_AGENDADAS, tarefas_agendadas)
        mensagem_panico = com_toque_de_humor(
            f"[MODO PÂNICO ATIVADO]: {canceladas_fila} tarefa(s) na fila cancelada(s), "
            f"{len(tarefas_agendadas)} tarefa(s) agendada(s) pausada(s) por hoje. "
            "O agente continua rodando normalmente pra novos comandos.",
            FRASES_HUMOR_PANICO,
        )
        print(f"\n{mensagem_panico}")
        return True

    if cmd == "status":
        mostrar_status()
        return True

    # NOVO: checa atalho de mídia ANTES de qualquer outra coisa — isso é o
    # que corrige o bug de "pausar música" ser interpretado errado e abrir
    # o navegador. Aqui a ação é instantânea e não passa pelo LLM.
    chave_midia = cmd if cmd in ATALHOS_MIDIA else resolver_atalho_midia_por_similaridade(cmd)
    if chave_midia:
        tecla = ATALHOS_MIDIA[chave_midia]
        pyautogui.press(tecla)
        print(f"\n[Atalho de mídia]: comando '{tecla}' enviado ao player ativo.")
        falar("Feito.")
        return True

    chave = cmd if cmd in ATALHOS_PROGRAMAS else resolver_atalho_por_similaridade(cmd)
    if chave:
        executavel, nome_amigavel = ATALHOS_PROGRAMAS[chave]
        subprocess.Popen(executavel, shell=True)
        print(f"\n[Atalho]: {nome_amigavel} aberto instantaneamente.")
        falar(f"{nome_amigavel} aberto.")
        return True

    # Cache: se já respondemos algo idêntico antes E a resposta ainda está
    # dentro da validade, não gasta API de novo. Formato antigo (string pura,
    # sem validade) é tratado como expirado, pra forçar recálculo uma vez.
    if cmd in cache_respostas:
        entrada_cache = cache_respostas[cmd]
        # Nunca servir uma resposta de cache VAZIA (isso causou o bug do
        # "[Cache]: " em branco que engolia o comando sem rodar a IA).
        _resp_cache = entrada_cache.get("resposta", "") if isinstance(entrada_cache, dict) else str(entrada_cache)
        if isinstance(entrada_cache, dict) and "timestamp" in entrada_cache and str(_resp_cache).strip():
            idade_segundos = (datetime.now() - datetime.fromisoformat(entrada_cache["timestamp"])).total_seconds()
            if idade_segundos < TEMPO_EXPIRACAO_CACHE_SEGUNDOS:
                print(f"\n[Cache]: {entrada_cache['resposta']}")
                return True
        cache_respostas.pop(cmd, None)  # expirado, formato antigo ou vazio: recalcula

    if any(p in cmd for p in PALAVRAS_CONVERSA) and not any(p in cmd for p in PALAVRAS_TAREFA_COMPLEXA):
        # Contexto inteligente tambem no chat rapido: memoria central (fatos
        # permanentes do usuario) + licoes + memorias relevantes, bem curto.
        _blocos = []
        _core = ler_memoria_core()
        if _core:
            _blocos.append("[Memoria central]\n" + _core)
        _lic = ler_licoes()
        if _lic:
            _blocos.append("[Licoes]\n" + _lic)
        memorias = buscar_memorias_relevantes(comando)
        if memorias:
            _blocos.append("[Memórias relevantes]: " + " | ".join(m["texto"] for m in memorias))
        contexto_extra = ("\n\n" + "\n\n".join(_blocos)) if _blocos else ""

        historico_conversas.append({"role": "user", "content": comando + contexto_extra})
        # Contexto enxuto pro chat direto (poupa cota): prompt de sistema + so
        # as ultimas 6 mensagens. O historico antigo continua salvo e a memoria
        # de longo prazo ja busca o que for relevante.
        _so_mensagens = [m for m in historico_conversas if m.get("role") != "system"]
        _contexto_curto = historico_conversas[:1] + _so_mensagens[-6:]
        resposta_texto = executar_com_autocura(
            "chat_direto",
            lambda: _extrair_texto(invocar_com_fallback(_contexto_curto).content),
        )
        historico_conversas.append({"role": "assistant", "content": resposta_texto})
        salvar_historico()
        # So guarda em cache respostas REAIS e uteis (nunca vazia, nunca o
        # aviso de "todas as IAs falharam") - senao um erro momentaneo vira
        # uma resposta falsa repetida por 10 minutos.
        if str(resposta_texto).strip() and not resposta_texto.startswith("["):
            cache_respostas[cmd] = {"resposta": resposta_texto, "timestamp": datetime.now().isoformat()}
            salvar_json(ARQ_CACHE, cache_respostas)
        registrar_memoria_longa(f"P: {comando} R: {resposta_texto}")
        print(f"\n[IA Direta]: {resposta_texto}")
        falar(resposta_texto)
        return True

    return False


# ================= FERRAMENTAS AVANÇADAS =================

@tool
def enviar_mensagem_whatsapp(destinatario: str, mensagem: str) -> str:
    """Envia mensagem no WhatsApp. 'destinatario' pode ser um número (+55...) ou
    um nome. Se o nome não estiver cadastrado, o agente tenta achar um contato
    parecido; se não achar nenhum, pergunta o número e salva pra próxima vez."""
    chave = destinatario.lower().strip()
    numero = contatos.get(chave)

    if not numero:
        parecido = difflib.get_close_matches(chave, list(contatos.keys()), n=1, cutoff=0.6)
        if parecido:
            nome_encontrado = parecido[0]
            if pedir_confirmacao(f"Você quis dizer '{nome_encontrado}' ({contatos[nome_encontrado]})?"):
                numero = contatos[nome_encontrado]
                destinatario = nome_encontrado

    if not numero:
        if destinatario.startswith("+") or destinatario.replace(" ", "").isdigit():
            numero = destinatario
        else:
            numero = input(f"Não conheço '{destinatario}' ainda. Qual o número dele (com +55 e DDD)? ").strip()
            contatos[chave] = numero
            salvar_json(ARQ_CONTATOS, contatos)
            print(f"[Info]: Contato '{destinatario}' salvo para as próximas vezes.")

    if not pedir_confirmacao(f"Enviar '{mensagem}' para {destinatario} ({numero})?"):
        return "Envio cancelado pelo usuário."

    def _enviar():
        kit.sendwhatmsg_instantly(numero, mensagem, wait_time=15, tab_close=True)
        logs_whatsapp.append({
            "data": datetime.now().isoformat(), "destinatario": destinatario,
            "numero": numero, "mensagem": mensagem, "status": "enviado",
        })
        salvar_json(ARQ_LOG_WHATS, logs_whatsapp)
        return f"Mensagem enviada com sucesso para {destinatario}."

    return executar_com_autocura("enviar_mensagem_whatsapp", _enviar)


@tool
def gerenciar_contatos(acao: str, nome: str = "", numero: str = "") -> str:
    """Gerencia a agenda de contatos do WhatsApp. Ações: 'adicionar', 'remover', 'listar'."""
    if acao == "adicionar":
        contatos[nome.lower()] = numero
        salvar_json(ARQ_CONTATOS, contatos)
        return f"Contato '{nome}' adicionado com número {numero}."
    elif acao == "remover":
        contatos.pop(nome.lower(), None)
        salvar_json(ARQ_CONTATOS, contatos)
        return f"Contato '{nome}' removido."
    elif acao == "listar":
        return "\n".join(f"{n}: {num}" for n, num in contatos.items()) or "Nenhum contato cadastrado ainda."
    return "Ação inválida. Use 'adicionar', 'remover' ou 'listar'."


@tool
def criar_site_completo(nome_projeto: str, descricao_do_site: str) -> str:
    """Cria um projeto de site inteiro (HTML/CSS/JS) numa pasta nova, com base
    numa descrição, usando conhecimento profissional de front-end. Depois
    inicializa git, abre no VS Code, e registra o projeto na memória
    multi-projeto para você conseguir reabri-lo depois só pelo nome."""
    pasta_projeto = os.path.join(PASTA_PROJETOS, nome_projeto)
    if os.path.exists(pasta_projeto) and not pedir_confirmacao(
        f"A pasta '{nome_projeto}' já existe. Sobrescrever arquivos?"
    ):
        return "Criação cancelada."

    os.makedirs(pasta_projeto, exist_ok=True)

    prompt_sistema = (
        "Você é um engenheiro de front-end sênior. Gere um site profissional, "
        "responsivo, com HTML5 semântico, CSS moderno (flexbox/grid) e "
        "JavaScript limpo, com base na descrição do usuário. Responda ESTRITAMENTE "
        "em JSON válido, sem markdown, no formato: "
        '{"html": "...", "css": "...", "js": "..."}'
    )

    def _gerar_e_criar():
        resposta = invocar_com_fallback([
            {"role": "system", "content": prompt_sistema},
            {"role": "user", "content": descricao_do_site},
        ])
        conteudo = json.loads(_extrair_texto(resposta.content).replace("```json", "").replace("```", "").strip())

        with open(os.path.join(pasta_projeto, "index.html"), "w", encoding="utf-8") as f:
            f.write(conteudo.get("html", ""))
        with open(os.path.join(pasta_projeto, "style.css"), "w", encoding="utf-8") as f:
            f.write(conteudo.get("css", ""))
        with open(os.path.join(pasta_projeto, "script.js"), "w", encoding="utf-8") as f:
            f.write(conteudo.get("js", ""))

        try:
            subprocess.run(["git", "init"], cwd=pasta_projeto, check=True, capture_output=True)
            subprocess.run(["git", "add", "."], cwd=pasta_projeto, check=True, capture_output=True)
            subprocess.run(["git", "commit", "-m", "Primeiro commit gerado pelo agente"],
                            cwd=pasta_projeto, check=True, capture_output=True)
            git_status = "Repositório git inicializado com o primeiro commit."
        except Exception:
            git_status = "Git não encontrado ou não pôde ser inicializado (opcional)."

        vscode_status = abrir_no_vscode(pasta_projeto)

        projetos_registrados.append({
            "nome": nome_projeto,
            "pasta": pasta_projeto,
            "descricao": descricao_do_site,
            "data": datetime.now().isoformat(),
        })
        salvar_json(ARQ_PROJETOS_REGISTRO, projetos_registrados)
        registrar_memoria_longa(f"Criei o projeto '{nome_projeto}': {descricao_do_site}", tags=["projeto"])

        return (
            f"Site '{nome_projeto}' criado em {pasta_projeto} com index.html, "
            f"style.css e script.js. {git_status} {vscode_status}"
        )

    return executar_com_autocura("criar_site_completo", _gerar_e_criar)


@tool
def reabrir_projeto(nome_ou_descricao: str) -> str:
    """Reabre no VS Code um projeto já criado antes, buscando pelo nome ou
    por parte da descrição original (consciência multi-projeto)."""
    if not projetos_registrados:
        return "Nenhum projeto foi criado ainda."
    nomes = [p["nome"] for p in projetos_registrados]
    descricoes = [p["descricao"] for p in projetos_registrados]
    alvo = difflib.get_close_matches(nome_ou_descricao, nomes + descricoes, n=1, cutoff=0.3)
    if not alvo:
        return "Não encontrei nenhum projeto parecido com isso. Diga 'status' pra ver quantos existem."
    for p in projetos_registrados:
        if p["nome"] == alvo[0] or p["descricao"] == alvo[0]:
            status_abertura = abrir_no_vscode(p["pasta"])
            return f"Reabrindo o projeto '{p['nome']}'. {status_abertura}"
    return "Não encontrei o projeto."


@tool
def agendar_tarefa(quando_hhmm: str, descricao: str) -> str:
    """Agenda uma tarefa recorrente diária. 'quando_hhmm' no formato HH:MM
    (ex.: '08:00'). A tarefa roda em background todo dia nesse horário."""
    tarefas_agendadas.append({"quando": quando_hhmm, "descricao": descricao, "executada_hoje": False})
    salvar_json(ARQ_TAREFAS_AGENDADAS, tarefas_agendadas)
    return f"Tarefa agendada para todo dia às {quando_hhmm}: '{descricao}'."


@tool
def adicionar_regra(gatilho: str, acao: str) -> str:
    """Adiciona uma regra condicional simples: sempre que o comando contiver
    'gatilho', executa 'acao' (ações suportadas hoje: 'falar_sempre')."""
    regras.append({"gatilho": gatilho, "acao": acao})
    salvar_json(ARQ_REGRAS, regras)
    return f"Regra adicionada: se o comando contiver '{gatilho}', executa '{acao}'."


@tool
def verificar_atualizacoes_sistema() -> str:
    """Verifica se há atualizações do Windows disponíveis (não instala sozinho)."""
    def _checar():
        resultado = subprocess.run(
            ["powershell", "-Command",
             "Get-Command Get-WindowsUpdate -ErrorAction SilentlyContinue"],
            capture_output=True, text=True,
        )
        if not resultado.stdout.strip():
            return (
                "O módulo 'PSWindowsUpdate' não está instalado. Para habilitar essa "
                "checagem, rode no PowerShell (como administrador): "
                "Install-Module PSWindowsUpdate"
            )
        saida = subprocess.run(["powershell", "-Command", "Get-WindowsUpdate"], capture_output=True, text=True)
        return saida.stdout or "Nenhuma atualização pendente encontrada."

    return executar_com_autocura("verificar_atualizacoes_sistema", _checar)


@tool
def instalar_ou_atualizar_programa(nome_programa: str, acao: str = "instalar") -> str:
    """Instala ('instalar') ou atualiza ('atualizar') um programa via winget."""
    if not pedir_confirmacao(f"{acao.capitalize()} o programa '{nome_programa}' via winget?"):
        return "Ação cancelada pelo usuário."
    comando = ["winget", "upgrade" if acao == "atualizar" else "install", nome_programa, "-e"]

    def _executar():
        resultado = subprocess.run(comando, capture_output=True, text=True)
        return resultado.stdout[-1500:] or "Comando executado, sem saída."

    return executar_com_autocura("instalar_ou_atualizar_programa", _executar)


@tool
def alterar_configuracao_sistema(configuracao: str, valor: str = "") -> str:
    """Altera configurações comuns do Windows (ex.: 'wifi', 'painel')."""
    if not pedir_confirmacao(f"Alterar configuração '{configuracao}' para '{valor}'?"):
        return "Ação cancelada pelo usuário."

    def _alterar():
        if configuracao == "wifi":
            estado = "enable" if valor.lower() in ("ligar", "on", "true") else "disable"
            subprocess.run(f'netsh interface set interface "Wi-Fi" admin={estado}', shell=True)
            return f"Wi-Fi {'ligado' if estado == 'enable' else 'desligado'}."
        elif configuracao == "painel":
            subprocess.Popen(f"start ms-settings:{valor}", shell=True)
            return f"Painel de configurações '{valor}' aberto."
        return "Configuração não reconhecida nesta versão. Use 'wifi' ou 'painel'."

    return executar_com_autocura("alterar_configuracao_sistema", _alterar)


@tool
def gravar_macro(nome_macro: str, duracao_segundos: int = 10) -> str:
    """Grava uma sequência de cliques e teclas por N segundos, salva com um
    nome, e permite repetir depois com 'repetir_macro'. Requer 'pynput'."""
    def _gravar():
        from pynput import mouse, keyboard

        eventos = []
        inicio = time.time()

        def on_click(x, y, button, pressed):
            eventos.append({"tipo": "clique", "x": x, "y": y, "t": time.time() - inicio})

        def on_press(key):
            try:
                eventos.append({"tipo": "tecla", "tecla": key.char, "t": time.time() - inicio})
            except AttributeError:
                pass

        listener_mouse = mouse.Listener(on_click=on_click)
        listener_teclado = keyboard.Listener(on_press=on_press)
        listener_mouse.start()
        listener_teclado.start()
        time.sleep(duracao_segundos)
        listener_mouse.stop()
        listener_teclado.stop()

        caminho = os.path.join(PASTA_BASE, f"macro_{nome_macro}.json")
        salvar_json(caminho, eventos)
        return f"Macro '{nome_macro}' gravada com {len(eventos)} eventos em {duracao_segundos}s."

    if not pedir_confirmacao(f"Gravar macro '{nome_macro}' por {duracao_segundos}s?"):
        return "Gravação cancelada."
    return executar_com_autocura("gravar_macro", _gravar)


@tool
def repetir_macro(nome_macro: str) -> str:
    """Repete uma macro gravada anteriormente com 'gravar_macro'."""
    caminho = os.path.join(PASTA_BASE, f"macro_{nome_macro}.json")
    if not os.path.exists(caminho):
        return f"Macro '{nome_macro}' não encontrada."
    if not pedir_confirmacao(f"Repetir a macro '{nome_macro}'?"):
        return "Execução cancelada."

    def _repetir():
        eventos = carregar_json(caminho, [])
        for evento in eventos:
            if evento["tipo"] == "clique":
                pyautogui.click(evento["x"], evento["y"])
            elif evento["tipo"] == "tecla":
                pyautogui.write(evento["tecla"])
        return f"Macro '{nome_macro}' repetida com {len(eventos)} eventos."

    return executar_com_autocura("repetir_macro", _repetir)


@tool
def resumir_arquivo(caminho_arquivo: str) -> str:
    """Lê um arquivo (PDF, CSV, XLSX ou texto) e devolve um resumo curto
    gerado por IA, em vez do conteúdo bruto inteiro."""
    def _resumir():
        conteudo = ler_e_analisar_arquivos_dados.invoke({"caminho_arquivo": caminho_arquivo})
        resposta = invocar_com_fallback([
            {"role": "user", "content": f"Resuma o conteúdo a seguir em até 5 frases:\n\n{conteudo[:6000]}"}
        ])
        return _extrair_texto(resposta.content)

    return executar_com_autocura("resumir_arquivo", _resumir)


@tool
def terminal_do_sistema(comando: str) -> str:
    """Útil para abrir programas instalados e comandos de sistema."""
    def _rodar():
        resultado = os.popen(comando).read()
        return resultado if resultado else "Comando executado no terminal."

    return executar_com_autocura("terminal_do_sistema", _rodar)


@tool
def dar_olhos_ao_agente(instrucao_do_que_buscar: str) -> str:
    """Dá OLHOS à IA: tira print da tela e analisa o que está aberto agora."""
    def _analisar():
        caminho_print = os.path.join(PASTA_BASE, "tela_atual.png")
        pyautogui.screenshot(caminho_print)
        resposta_visual = invocar_com_fallback([
            {"role": "user", "content": [
                {"type": "text", "text": f"Analise esta imagem da tela do meu PC e responda: {instrucao_do_que_buscar}"},
                {"type": "image_url", "image_url": caminho_print},
            ]}
        ])
        if os.path.exists(caminho_print):
            os.remove(caminho_print)
        return f"Análise visual da tela concluída: {_extrair_texto(resposta_visual.content)}"

    return executar_com_autocura("dar_olhos_ao_agente", _analisar)


@tool
def ler_e_analisar_arquivos_dados(caminho_arquivo: str) -> str:
    """Lê e extrai conteúdo de planilhas (.xlsx, .csv), PDFs ou arquivos de texto."""
    def _ler():
        if not os.path.exists(caminho_arquivo):
            return "Erro: O arquivo especificado não foi encontrado."
        extensao = os.path.splitext(caminho_arquivo)[1].lower()
        if extensao == ".xlsx":
            df = pd.read_excel(caminho_arquivo)
            return f"Conteúdo da planilha Excel:\n{df.head(10).to_string()}"
        elif extensao == ".csv":
            df = pd.read_csv(caminho_arquivo)
            return f"Conteúdo do arquivo CSV:\n{df.head(10).to_string()}"
        elif extensao == ".pdf":
            reader = PdfReader(caminho_arquivo)
            texto_pdf = ""
            for i, pagina in enumerate(reader.pages[:5]):
                texto_pdf += f"--- Página {i+1} ---\n" + (pagina.extract_text() or "") + "\n"
            return texto_pdf if texto_pdf.strip() else "O PDF está em branco ou contém apenas imagens."
        else:
            with open(caminho_arquivo, "r", encoding="utf-8", errors="ignore") as f:
                return f.read(2000)

    return executar_com_autocura("ler_e_analisar_arquivos_dados", _ler)


@tool
def controlar_mouse_e_teclado(acao: str, texto_ou_botao: str = "") -> str:
    """Interage visualmente com a tela (clicar, digitar, esperar)."""
    def _controlar():
        if acao == "clicar":
            largura, altura = pyautogui.size()
            pyautogui.click(largura / 2, altura / 2)
            return "Clique executado."
        elif acao == "digitar":
            pyautogui.write(texto_ou_botao, interval=0.05)
            return "Texto digitado."
        elif acao == "esperar":
            time.sleep(2)
            return "Aguardou 2 segundos."
        return "Ação não reconhecida."

    return executar_com_autocura("controlar_mouse_e_teclado", _controlar)


@tool
def gerenciar_arquivos_e_pastas(acao: str, caminho_pasta: str, nome_arquivo: str = "", conteudo: str = "") -> str:
    """Cria, edita e deleta pastas e arquivos de texto. Ações disponíveis:
    'criar_pasta', 'criar_arquivo', 'editar_arquivo' (sobrescreve o conteúdo
    de um arquivo existente ou cria se não existir), 'anexar_arquivo'
    (adiciona conteúdo ao final de um arquivo existente sem apagar o que já
    tinha), 'deletar_arquivo', 'deletar_pasta'. Ações de editar e deletar
    pedem confirmação; deletar (que nao tem volta) SEMPRE pede, até no nível
    admin."""
    _alvo = f"{caminho_pasta}{'/' + nome_arquivo if nome_arquivo else ''}"
    if acao in ("deletar_pasta", "deletar_arquivo") and not confirmar_destrutivo(
        f"Apagar '{acao}' em {_alvo}? Isso NAO tem volta (nao vai pra Lixeira)."
    ):
        return "Ação cancelada pelo usuário."
    if acao in ("editar_arquivo", "anexar_arquivo") and not pedir_confirmacao(
        f"Executar '{acao}' em {_alvo}?"
    ):
        return "Ação cancelada pelo usuário."

    def _manipular():
        if acao == "criar_pasta":
            os.makedirs(caminho_pasta, exist_ok=True)
            return "Pasta criada."
        elif acao == "criar_arquivo":
            os.makedirs(caminho_pasta, exist_ok=True)
            caminho_completo = os.path.join(caminho_pasta, nome_arquivo)
            with open(caminho_completo, "w", encoding="utf-8") as f:
                f.write(conteudo)
            return "Arquivo criado."
        elif acao == "editar_arquivo":
            os.makedirs(caminho_pasta, exist_ok=True)
            caminho_completo = os.path.join(caminho_pasta, nome_arquivo)
            with open(caminho_completo, "w", encoding="utf-8") as f:
                f.write(conteudo)
            return f"Arquivo editado (conteúdo sobrescrito): {caminho_completo}"
        elif acao == "anexar_arquivo":
            os.makedirs(caminho_pasta, exist_ok=True)
            caminho_completo = os.path.join(caminho_pasta, nome_arquivo)
            with open(caminho_completo, "a", encoding="utf-8") as f:
                f.write(conteudo)
            return f"Conteúdo adicionado ao final do arquivo: {caminho_completo}"
        elif acao == "deletar_arquivo":
            caminho_completo = os.path.join(caminho_pasta, nome_arquivo) if nome_arquivo else caminho_pasta
            if not os.path.exists(caminho_completo):
                return f"Arquivo não encontrado: {caminho_completo}"
            os.remove(caminho_completo)
            return f"Arquivo deletado: {caminho_completo}"
        elif acao == "deletar_pasta":
            if not os.path.exists(caminho_pasta):
                return f"Pasta não encontrada: {caminho_pasta}"
            caminho_normalizado = os.path.normpath(caminho_pasta)
            # Proteção de segurança: nunca deleta raiz de disco ou pastas rasas demais
            if len(caminho_normalizado) <= 3 or caminho_normalizado.count(os.sep) <= 1:
                return (
                    "Por segurança, não deleto pastas na raiz do disco (ex.: 'C:\\' ou "
                    "'C:\\Usuarios'). Especifique uma subpasta mais profunda e específica."
                )
            import shutil
            shutil.rmtree(caminho_pasta)
            return f"Pasta deletada: {caminho_pasta}"
        return "Ação inválida. Use: criar_pasta, criar_arquivo, editar_arquivo, anexar_arquivo, deletar_arquivo ou deletar_pasta."

    return executar_com_autocura("gerenciar_arquivos_e_pastas", _manipular)


@tool
def substituir_trecho_arquivo(caminho_arquivo: str, texto_antigo: str, texto_novo: str) -> str:
    """Edita um arquivo de forma cirúrgica: substitui um trecho específico de
    texto por outro, sem reescrever o arquivo inteiro (útil pra corrigir uma
    linha de código ou um valor específico num arquivo grande). O
    texto_antigo precisa aparecer exatamente uma vez no arquivo, senão a
    edição é recusada por segurança (evita trocar o lugar errado)."""
    if not pedir_confirmacao(f"Substituir um trecho no arquivo {caminho_arquivo}?"):
        return "Edição cancelada pelo usuário."

    def _substituir():
        if not os.path.exists(caminho_arquivo):
            return f"Arquivo não encontrado: {caminho_arquivo}"
        with open(caminho_arquivo, "r", encoding="utf-8") as f:
            conteudo_atual = f.read()
        ocorrencias = conteudo_atual.count(texto_antigo)
        if ocorrencias == 0:
            return "O texto a substituir não foi encontrado no arquivo. Nada foi alterado."
        if ocorrencias > 1:
            return (
                f"O texto aparece {ocorrencias} vezes no arquivo — por segurança, só "
                "substituo quando o trecho é único. Dê mais contexto ao redor pra tornar "
                "o texto a buscar exclusivo."
            )
        conteudo_novo = conteudo_atual.replace(texto_antigo, texto_novo, 1)
        with open(caminho_arquivo, "w", encoding="utf-8") as f:
            f.write(conteudo_novo)
        return f"Trecho substituído com sucesso em {caminho_arquivo}."

    return executar_com_autocura("substituir_trecho_arquivo", _substituir)


@tool
def monitorar_sistema() -> str:
    """Mostra uso de CPU, RAM e disco do PC no momento."""
    def _monitorar():
        import psutil
        cpu = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory().percent
        disco = psutil.disk_usage("/").percent
        return f"CPU: {cpu}% | RAM: {ram}% | Disco: {disco}%"

    return executar_com_autocura("monitorar_sistema", _monitorar)


@tool
def criar_site_3d(nome_projeto: str, descricao_da_cena: str) -> str:
    """Cria um projeto de site 3D (usando Three.js via CDN) numa pasta nova,
    com base numa descrição de cena (ex.: 'planeta girando com estrelas ao
    fundo'). Gera index.html + script.js já prontos pra abrir no navegador,
    inicializa git, abre no VS Code e registra na memória multi-projeto,
    igual o criar_site_completo, mas especializado em 3D."""
    pasta_projeto = os.path.join(PASTA_PROJETOS, nome_projeto)
    if os.path.exists(pasta_projeto) and not pedir_confirmacao(
        f"A pasta '{nome_projeto}' já existe. Sobrescrever arquivos?"
    ):
        return "Criação cancelada."

    os.makedirs(pasta_projeto, exist_ok=True)

    prompt_sistema = (
        "Você é um engenheiro de front-end sênior especialista em Three.js "
        "(r128, importado via CDN cdnjs, sem bundler). Gere uma cena 3D "
        "profissional com base na descrição do usuário: câmera, luzes, "
        "geometrias, animação no loop de render, e responsividade ao "
        "redimensionar a janela. Responda ESTRITAMENTE em JSON válido, sem "
        "markdown, no formato: "
        '{"html": "...", "js": "..."}. '
        "O HTML deve importar Three.js via "
        "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js "
        "e o script.js separado. Não use OrbitControls nem CapsuleGeometry "
        "(não disponíveis nessa versão) — use CylinderGeometry, "
        "SphereGeometry, BoxGeometry ou geometria customizada."
    )

    def _gerar_e_criar():
        resposta = invocar_com_fallback([
            {"role": "system", "content": prompt_sistema},
            {"role": "user", "content": descricao_da_cena},
        ])
        conteudo = json.loads(_extrair_texto(resposta.content).replace("```json", "").replace("```", "").strip())

        with open(os.path.join(pasta_projeto, "index.html"), "w", encoding="utf-8") as f:
            f.write(conteudo.get("html", ""))
        with open(os.path.join(pasta_projeto, "script.js"), "w", encoding="utf-8") as f:
            f.write(conteudo.get("js", ""))

        try:
            subprocess.run(["git", "init"], cwd=pasta_projeto, check=True, capture_output=True)
            subprocess.run(["git", "add", "."], cwd=pasta_projeto, check=True, capture_output=True)
            subprocess.run(["git", "commit", "-m", "Primeiro commit gerado pelo agente (site 3D)"],
                            cwd=pasta_projeto, check=True, capture_output=True)
            git_status = "Repositório git inicializado com o primeiro commit."
        except Exception:
            git_status = "Git não encontrado ou não pôde ser inicializado (opcional)."

        vscode_status = abrir_no_vscode(pasta_projeto)

        projetos_registrados.append({
            "nome": nome_projeto,
            "pasta": pasta_projeto,
            "descricao": f"[3D] {descricao_da_cena}",
            "data": datetime.now().isoformat(),
        })
        salvar_json(ARQ_PROJETOS_REGISTRO, projetos_registrados)
        registrar_memoria_longa(f"Criei o site 3D '{nome_projeto}': {descricao_da_cena}", tags=["projeto", "3d"])

        return (
            f"Site 3D '{nome_projeto}' criado em {pasta_projeto} com index.html e "
            f"script.js (Three.js via CDN). {git_status} {vscode_status} "
            "Abra o index.html no navegador (ex.: com a extensão Live Server do "
            "VS Code) para ver a cena rodando."
        )

    return executar_com_autocura("criar_site_3d", _gerar_e_criar)


@tool
def enviar_email(destinatario: str, assunto: str, corpo: str) -> str:
    """Envia um e-mail via Gmail (SMTP). Requer que a variável de ambiente
    GMAIL_APP_PASSWORD esteja configurada (senha de app do Google, não a
    senha normal da conta) e que 'email_remetente' esteja definido no
    config.json. 'destinatario' pode ser um e-mail direto ou um nome
    cadastrado em contatos.json (campo 'email')."""
    remetente = config.get("email_remetente")
    senha_app = os.environ.get("GMAIL_APP_PASSWORD")

    if not remetente or not senha_app:
        return (
            "E-mail ainda não configurado. Adicione 'email_remetente' no "
            "config.json e rode no cmd: setx GMAIL_APP_PASSWORD \"sua_senha_de_app\". "
            "A senha de app é gerada em myaccount.google.com/apppasswords "
            "(precisa da verificação em duas etapas ativada na conta)."
        )

    email_destino = destinatario
    if "@" not in destinatario:
        contato = contatos.get(destinatario.lower())
        if isinstance(contato, dict) and contato.get("email"):
            email_destino = contato["email"]
        else:
            parecido = difflib.get_close_matches(destinatario.lower(), list(contatos.keys()), n=1, cutoff=0.6)
            if parecido and isinstance(contatos.get(parecido[0]), dict) and contatos[parecido[0]].get("email"):
                email_destino = contatos[parecido[0]]["email"]
            else:
                return f"Não encontrei um e-mail cadastrado para '{destinatario}'. Informe o e-mail direto."

    if not pedir_confirmacao(f"Enviar e-mail para {email_destino} com assunto '{assunto}'?"):
        return "Envio cancelado pelo usuário."

    def _enviar():
        import smtplib
        from email.mime.text import MIMEText

        mensagem = MIMEText(corpo, _charset="utf-8")
        mensagem["Subject"] = assunto
        mensagem["From"] = remetente
        mensagem["To"] = email_destino

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as servidor:
            servidor.login(remetente, senha_app)
            servidor.sendmail(remetente, [email_destino], mensagem.as_string())

        return f"E-mail enviado para {email_destino}."

    return executar_com_autocura("enviar_email", _enviar)


@tool
def evoluir_agente(nome_da_funcao: str, descricao_da_funcionalidade: str) -> str:
    """AUTOEVOLUÇÃO: adiciona uma nova ferramenta ao PRÓPRIO código-fonte do
    agente, com base numa descrição em português (ex.: 'quero uma função que
    toque uma música quando eu bater 3 palmas'). Gera o código da nova
    função, valida a sintaxe, faz backup do arquivo atual e só então insere
    a mudança. É preciso reiniciar o agente (sair e rodar 'python agente.py'
    de novo) para a nova função entrar em uso — o Python não recarrega o
    próprio arquivo sozinho no meio da execução."""
    if not pedir_confirmacao(
        f"Adicionar a nova função '{nome_da_funcao}' ao código do agente? "
        f"Descrição: {descricao_da_funcionalidade}"
    ):
        return "Modificação cancelada pelo usuário."

    def _evoluir():
        import ast

        caminho_arquivo_proprio = os.path.abspath(__file__)

        prompt_sistema = (
            "Você é um engenheiro Python sênior mantendo um agente LangChain. "
            "Gere APENAS o código de uma nova função Python decorada com @tool, "
            "sem explicações, sem markdown, seguindo EXATAMENTE este padrão:\n\n"
            "@tool\n"
            "def nome_da_funcao(parametro: tipo) -> str:\n"
            '    """Docstring explicando o que a função faz."""\n'
            "    def _interno():\n"
            "        # lógica real aqui\n"
            "        return \"resultado\"\n"
            "    return executar_com_autocura(\"nome_da_funcao\", _interno)\n\n"
            "Se a ação for sensível (modificar sistema, deletar algo, enviar "
            "mensagem/e-mail, instalar programa), chame "
            "pedir_confirmacao('mensagem') antes de executar e retorne se for "
            "negado. Use só bibliotecas já disponíveis no arquivo (os, sys, "
            "json, time, subprocess, pyautogui, pywhatkit, pandas, difflib, "
            "datetime) a menos que a tarefa realmente exija outra — nesse caso "
            "faça o import DENTRO da função, nunca no topo do arquivo.\n"
            "IMPORTANTE: gere exatamente UMA funcao por vez. O nome da funcao "
            "(def ...) deve ser em letras minusculas, sem espacos, sem acentos, "
            "em formato snake_case (ex.: esvaziar_lixeira). Nao escreva comentarios "
            "com listas de ideias no lugar do codigo — eu preciso do codigo "
            "executavel da funcao, com o decorador @tool."
        )

        resposta = invocar_com_fallback([
            {"role": "system", "content": prompt_sistema},
            {"role": "user", "content": f"Nome da função: {nome_da_funcao}\nDescrição: {descricao_da_funcionalidade}"},
        ])
        codigo_novo = _extrair_texto(resposta.content).replace("```python", "").replace("```", "").strip()

        try:
            ast.parse(codigo_novo)
        except SyntaxError as e:
            return (
                f"O código gerado tinha erro de sintaxe ({e}). Por segurança, "
                "não toquei no arquivo. Tente descrever a função de outro jeito."
            )

        # Validação REAL: o modelo precisa ter gerado uma FUNÇÃO decorada com
        # @tool (não apenas comentários/ideias). Também capturamos o nome real
        # da função gerada para registrá-la na lista 'tools' — antes o código
        # assumia que o nome da função era o nome pedido; se o modelo gerasse
        # outro nome, o agente quebraria ao reiniciar (NameError).
        arvore = ast.parse(codigo_novo)
        nomes_ferramentas_novas = []
        for no in arvore.body:
            if isinstance(no, (ast.FunctionDef, ast.AsyncFunctionDef)):
                tem_decorador_tool = any(
                    (isinstance(d, ast.Name) and d.id == "tool")
                    or (isinstance(d, ast.Attribute) and d.attr == "tool")
                    for d in no.decorator_list
                )
                if tem_decorador_tool:
                    nomes_ferramentas_novas.append(no.name)
        if not nomes_ferramentas_novas:
            return (
                "O que a IA gerou NAO foi uma ferramenta de verdade: nao havia "
                "nenhuma funcao Python decorada com @tool (pareciam so comentarios "
                "e anotacoes de ideias). Por seguranca, NAO alterei o arquivo. "
                "Tente de novo pedindo UMA funcao especifica, por exemplo: "
                "'adicione a ferramenta esvaziar_lixeira para esvaziar a lixeira "
                "do Windows'."
            )

        with open(caminho_arquivo_proprio, "r", encoding="utf-8") as f:
            conteudo_atual = f.read()

        caminho_backup = caminho_arquivo_proprio + f".backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        with open(caminho_backup, "w", encoding="utf-8") as f:
            f.write(conteudo_atual)

        marcador = "tools = [\n"
        if marcador not in conteudo_atual:
            return "Não encontrei o ponto de inserção esperado no arquivo. Nada foi alterado."

        linhas_de_registro = "".join(f"    {n},\n" for n in nomes_ferramentas_novas)
        conteudo_modificado = conteudo_atual.replace(
            marcador,
            codigo_novo + "\n\n\n" + marcador + linhas_de_registro,
            1,
        )

        try:
            ast.parse(conteudo_modificado)
        except SyntaxError as e:
            return (
                f"A inserção quebrou a sintaxe geral do arquivo ({e}). Nada foi "
                f"salvo — o arquivo original continua intacto e o backup está em "
                f"{os.path.basename(caminho_backup)}, caso queira revisar."
            )

        with open(caminho_arquivo_proprio, "w", encoding="utf-8") as f:
            f.write(conteudo_modificado)

        registrar_memoria_longa(
            f"Adicionei a função '{nome_da_funcao}' ao agente: {descricao_da_funcionalidade}",
            tags=["evolucao", "autoevolucao"],
        )

        return (
            f"Função '{nome_da_funcao}' adicionada com sucesso ao código. Backup do "
            f"arquivo anterior salvo como {os.path.basename(caminho_backup)}. "
            "Digite 'sair' e rode 'python agente.py' de novo para a nova função "
            "entrar em uso — mudanças no próprio código só valem a partir do "
            "próximo início do programa."
        )

    return executar_com_autocura("evoluir_agente", _evoluir)


@tool
def otimizar_sistema(acao: str) -> str:
    """Executa otimizações REAIS do Windows (não só abre painel — de fato
    aplica a mudança). Ações disponíveis:
    'limpar_temp' (apaga arquivos temporários),
    'limpar_dns' (limpa cache de DNS),
    'listar_inicializacao' (mostra programas que abrem com o Windows),
    'plano_energia_desempenho' (ativa o plano de energia de alto desempenho),
    'plano_energia_economia' (ativa o plano de economia de energia),
    'otimizar_disco' (roda a otimização/desfragmentação do disco C:),
    'liberar_memoria_standby' (libera memória em cache não usada, requer
    privilégio de administrador).
    Toda ação real (que não seja apenas 'listar_inicializacao') pede
    confirmação antes de executar."""

    def _executar():
        if acao == "listar_inicializacao":
            resultado = subprocess.run(
                ["powershell", "-Command",
                 "Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | Format-Table -AutoSize"],
                capture_output=True, text=True,
            )
            return resultado.stdout or "Nenhum programa de inicialização encontrado."

        if not pedir_confirmacao(f"Executar a otimização '{acao}' agora?"):
            return "Ação cancelada pelo usuário."

        if acao == "limpar_temp":
            pasta_temp = os.environ.get("TEMP", "")
            arquivos_removidos = 0
            for raiz, _, arquivos in os.walk(pasta_temp):
                for nome in arquivos:
                    try:
                        os.remove(os.path.join(raiz, nome))
                        arquivos_removidos += 1
                    except Exception:
                        pass  # arquivo em uso, ignora e segue
            return f"Limpeza concluída: {arquivos_removidos} arquivos temporários removidos."

        elif acao == "limpar_dns":
            subprocess.run("ipconfig /flushdns", shell=True, capture_output=True)
            return "Cache de DNS limpo com sucesso."

        elif acao == "plano_energia_desempenho":
            subprocess.run(
                "powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c",
                shell=True, capture_output=True,
            )
            return "Plano de energia alterado para Alto Desempenho."

        elif acao == "plano_energia_economia":
            subprocess.run(
                "powercfg /setactive a1841308-3541-4fab-bc81-f71556f20b4a",
                shell=True, capture_output=True,
            )
            return "Plano de energia alterado para Economia de Energia."

        elif acao == "otimizar_disco":
            resultado = subprocess.run(
                ["powershell", "-Command", "Optimize-Volume -DriveLetter C -Verbose"],
                capture_output=True, text=True,
            )
            return resultado.stdout or "Otimização do disco C: iniciada."

        elif acao == "liberar_memoria_standby":
            resultado = subprocess.run(
                ["powershell", "-Command",
                 "Get-Process | Sort-Object WS -Descending | Select-Object -First 5 Name, WS"],
                capture_output=True, text=True,
            )
            return (
                "Liberação forçada de memória standby requer ferramenta externa "
                "(ex.: RAMMap da Sysinternals) e privilégio de administrador — não "
                "fiz isso sozinho por segurança. Segue os 5 processos que mais "
                f"consomem memória agora, pra você decidir o que fechar:\n{resultado.stdout}"
            )

        return "Ação não reconhecida. Use: limpar_temp, limpar_dns, listar_inicializacao, plano_energia_desempenho, plano_energia_economia, otimizar_disco ou liberar_memoria_standby."

    return executar_com_autocura("otimizar_sistema", _executar)


@tool
def monitorar_sistema_avancado() -> str:
    """Monitoramento completo do PC: CPU, RAM, disco, rede, bateria (se
    houver) e os 5 processos que mais consomem CPU e RAM no momento. Mais
    detalhado que 'monitorar_sistema', que só mostra os totais gerais."""

    def _monitorar():
        import psutil

        cpu_total = psutil.cpu_percent(interval=1)
        cpu_por_nucleo = psutil.cpu_percent(interval=1, percpu=True)
        ram = psutil.virtual_memory()
        disco = psutil.disk_usage("/")
        rede = psutil.net_io_counters()

        linhas = [
            f"CPU total: {cpu_total}% | Por núcleo: {cpu_por_nucleo}",
            f"RAM: {ram.percent}% usada ({ram.used // (1024**2)} MB de {ram.total // (1024**2)} MB)",
            f"Disco C: {disco.percent}% usado ({disco.used // (1024**3)} GB de {disco.total // (1024**3)} GB)",
            f"Rede: {rede.bytes_sent // (1024**2)} MB enviados | {rede.bytes_recv // (1024**2)} MB recebidos (desde que o PC ligou)",
        ]

        try:
            bateria = psutil.sensors_battery()
            if bateria:
                status = "carregando" if bateria.power_plugged else "na bateria"
                linhas.append(f"Bateria: {bateria.percent}% ({status})")
        except Exception:
            pass  # PC sem bateria (desktop), ignora

        processos = []
        for p in psutil.process_iter(["name", "cpu_percent", "memory_percent"]):
            try:
                processos.append(p.info)
            except Exception:
                pass
        top_cpu = sorted(processos, key=lambda p: p.get("cpu_percent") or 0, reverse=True)[:5]
        top_ram = sorted(processos, key=lambda p: p.get("memory_percent") or 0, reverse=True)[:5]

        linhas.append("Top 5 CPU: " + ", ".join(f"{p['name']} ({p['cpu_percent']:.1f}%)" for p in top_cpu))
        linhas.append("Top 5 RAM: " + ", ".join(f"{p['name']} ({p['memory_percent']:.1f}%)" for p in top_ram))

        return "\n".join(linhas)

    return executar_com_autocura("monitorar_sistema_avancado", _monitorar)


@tool
def controlar_midia(acao: str) -> str:
    """Controla a reprodução de mídia/música do sistema (funciona com
    QUALQUER player ativo: Spotify, YouTube no navegador, Windows Media
    Player etc.), usando as teclas de mídia virtuais do sistema operacional
    — não abre nada novo, só manda o comando pro que já está tocando. Ações:
    'tocar_pausar', 'proxima_faixa', 'faixa_anterior', 'aumentar_volume',
    'diminuir_volume', 'mutar'."""
    mapa = {
        "tocar_pausar": "playpause",
        "proxima_faixa": "nexttrack",
        "faixa_anterior": "prevtrack",
        "aumentar_volume": "volumeup",
        "diminuir_volume": "volumedown",
        "mutar": "volumemute",
    }

    def _executar():
        tecla = mapa.get(acao)
        if not tecla:
            return f"Ação '{acao}' não reconhecida. Use: {', '.join(mapa.keys())}."
        pyautogui.press(tecla)
        return f"Comando de mídia '{acao}' enviado com sucesso ao player ativo."

    return executar_com_autocura("controlar_midia", _executar)


@tool
def configurar_aparencia_e_energia(acao: str, valor: str = "") -> str:
    """Configura de verdade (não só abre painel) aparência e energia do
    Windows. Ações disponíveis:
    'tema_escuro' / 'tema_claro' — troca o tema do sistema e dos apps;
    'tempo_espera_tela' — define em quantos minutos a tela apaga sozinha
    (passe o número de minutos em 'valor');
    'tempo_suspensao' — define em quantos minutos o PC suspende sozinho
    (passe o número de minutos em 'valor').
    Sempre pede confirmação antes de aplicar."""

    if not pedir_confirmacao(f"Aplicar configuração '{acao}'{' = ' + valor if valor else ''}?"):
        return "Ação cancelada pelo usuário."

    def _aplicar():
        if acao == "tema_escuro":
            subprocess.run(
                'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" '
                '/v AppsUseLightTheme /t REG_DWORD /d 0 /f',
                shell=True, capture_output=True,
            )
            subprocess.run(
                'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" '
                '/v SystemUsesLightTheme /t REG_DWORD /d 0 /f',
                shell=True, capture_output=True,
            )
            return "Tema escuro aplicado. Pode ser necessário reabrir os apps já abertos para o efeito aparecer neles."

        elif acao == "tema_claro":
            subprocess.run(
                'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" '
                '/v AppsUseLightTheme /t REG_DWORD /d 1 /f',
                shell=True, capture_output=True,
            )
            subprocess.run(
                'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" '
                '/v SystemUsesLightTheme /t REG_DWORD /d 1 /f',
                shell=True, capture_output=True,
            )
            return "Tema claro aplicado. Pode ser necessário reabrir os apps já abertos para o efeito aparecer neles."

        elif acao == "tempo_espera_tela":
            if not valor.isdigit():
                return "Informe o número de minutos em 'valor' (ex.: '10')."
            subprocess.run(f"powercfg /change monitor-timeout-ac {valor}", shell=True, capture_output=True)
            return f"Tela agora apaga sozinha após {valor} minuto(s) de inatividade (energia ligada na tomada)."

        elif acao == "tempo_suspensao":
            if not valor.isdigit():
                return "Informe o número de minutos em 'valor' (ex.: '30')."
            subprocess.run(f"powercfg /change standby-timeout-ac {valor}", shell=True, capture_output=True)
            return f"PC agora suspende sozinho após {valor} minuto(s) de inatividade (energia ligada na tomada)."

        return "Ação não reconhecida. Use: tema_escuro, tema_claro, tempo_espera_tela ou tempo_suspensao."

    return executar_com_autocura("configurar_aparencia_e_energia", _aplicar)


@tool
def configurar_dispositivo_avancado(acao: str, valor: str = "") -> str:
    """Configura hardware/dispositivos de verdade (pesquisado e confirmado
    contra documentação oficial da Microsoft). Ações:
    'brilho' — define o brilho da tela em % (0-100, em 'valor'). Só funciona
    em telas de notebook com suporte nativo a WMI; monitores externos
    normalmente não suportam esse método (limitação do próprio hardware,
    não do agente).
    'bluetooth_ligar' / 'bluetooth_desligar' — ativa/desativa o adaptador
    Bluetooth de verdade. Requer que o agente esteja rodando com privilégio
    de administrador (senão o Windows recusa a operação e o erro é
    reportado com clareza).
    'idioma_teclado' — troca o layout de teclado padrão (passe a tag do
    idioma em 'valor', ex.: 'pt-BR', 'en-US')."""

    if not pedir_confirmacao(f"Aplicar configuração de dispositivo '{acao}'{' = ' + valor if valor else ''}?"):
        return "Ação cancelada pelo usuário."

    def _aplicar():
        if acao == "brilho":
            if not valor.isdigit() or not (0 <= int(valor) <= 100):
                return "Informe um valor de brilho entre 0 e 100 em 'valor'."
            resultado = subprocess.run(
                ["powershell", "-Command",
                 f"(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1,{valor})"],
                capture_output=True, text=True,
            )
            if resultado.returncode != 0 or "not supported" in (resultado.stderr or "").lower():
                return (
                    "Não consegui mudar o brilho — isso normalmente acontece em "
                    "monitores externos ou desktops, que não expõem esse controle via "
                    "WMI (limitação do hardware/driver, confirmada na documentação "
                    "oficial da Microsoft, não é algo que dê pra contornar por software)."
                )
            return f"Brilho da tela ajustado para {valor}%."

        elif acao in ("bluetooth_ligar", "bluetooth_desligar"):
            cmdlet = "Enable-PnpDevice" if acao == "bluetooth_ligar" else "Disable-PnpDevice"
            resultado = subprocess.run(
                ["powershell", "-Command",
                 f"Get-PnpDevice -Class Bluetooth | {cmdlet} -Confirm:$false"],
                capture_output=True, text=True,
            )
            if resultado.returncode != 0:
                return (
                    f"Não consegui {'ligar' if acao == 'bluetooth_ligar' else 'desligar'} o "
                    "Bluetooth. Isso normalmente exige que o agente esteja rodando num "
                    "Prompt de Comando ABERTO COMO ADMINISTRADOR — o Windows exige "
                    f"privilégio de administrador pra essa operação. Detalhe: {resultado.stderr[:300]}"
                )
            return f"Bluetooth {'ligado' if acao == 'bluetooth_ligar' else 'desligado'} com sucesso."

        elif acao == "idioma_teclado":
            if not valor:
                return "Informe a tag do idioma em 'valor' (ex.: 'pt-BR', 'en-US')."
            resultado = subprocess.run(
                ["powershell", "-Command", f"Set-WinUserLanguageList -LanguageList {valor} -Force"],
                capture_output=True, text=True,
            )
            if resultado.returncode != 0:
                return f"Não consegui trocar o idioma do teclado. Detalhe: {resultado.stderr[:300]}"
            return f"Layout de teclado alterado para '{valor}'."

        return "Ação não reconhecida. Use: brilho, bluetooth_ligar, bluetooth_desligar ou idioma_teclado."

    return executar_com_autocura("configurar_dispositivo_avancado", _aplicar)


@tool
def gerar_documentacao_projeto(nome_projeto: str) -> str:
    """Gera um README.md profissional para um projeto já criado antes (por
    criar_site_completo ou criar_site_3d), explicando o que o projeto faz,
    como abrir, e a estrutura de arquivos. Localiza o projeto pelo nome na
    memória multi-projeto."""
    projeto_encontrado = next((p for p in projetos_registrados if p["nome"] == nome_projeto), None)
    if not projeto_encontrado:
        parecido = difflib.get_close_matches(
            nome_projeto, [p["nome"] for p in projetos_registrados], n=1, cutoff=0.4
        )
        if parecido:
            projeto_encontrado = next(p for p in projetos_registrados if p["nome"] == parecido[0])
        else:
            return f"Não encontrei nenhum projeto chamado '{nome_projeto}'. Digite 'status' pra ver quantos existem."

    def _gerar():
        pasta = projeto_encontrado["pasta"]
        arquivos_existentes = os.listdir(pasta) if os.path.isdir(pasta) else []
        prompt = (
            f"Gere um README.md profissional em markdown para um projeto chamado "
            f"'{projeto_encontrado['nome']}', descrito como: {projeto_encontrado['descricao']}. "
            f"Os arquivos existentes na pasta são: {', '.join(arquivos_existentes)}. "
            "Inclua: título, descrição breve, como abrir/rodar, e estrutura de arquivos. "
            "Responda só com o conteúdo do README, sem explicações extras."
        )
        resposta = invocar_com_fallback([{"role": "user", "content": prompt}])
        caminho_readme = os.path.join(pasta, "README.md")
        with open(caminho_readme, "w", encoding="utf-8") as f:
            f.write(_extrair_texto(resposta.content))
        return com_toque_de_humor(f"README.md gerado em {caminho_readme}.", FRASES_HUMOR_README)

    return executar_com_autocura("gerar_documentacao_projeto", _gerar)


@tool
def abrir_site_no_navegador(nome_ou_url: str) -> str:
    """Abre um site no navegador padrão. Aceita uma URL direta ou o nome de
    um site comum (youtube, gmail, whatsapp, google, github). Esta ferramenta
    é para ABRIR sites — para controlar música/vídeo que já está tocando
    (pausar, tocar, avançar, volume), use 'controlar_midia' em vez desta."""
    sites_conhecidos = {
        "youtube": "https://youtube.com",
        "gmail": "https://mail.google.com",
        "whatsapp": "https://web.whatsapp.com",
        "google": "https://google.com",
        "github": "https://github.com",
    }

    def _abrir():
        alvo = sites_conhecidos.get(nome_ou_url.lower().strip())
        if not alvo:
            alvo = nome_ou_url if nome_ou_url.startswith("http") else f"https://{nome_ou_url}"
        subprocess.Popen(f'start "" "{alvo}"', shell=True)
        return f"Site aberto: {alvo}"

    return executar_com_autocura("abrir_site_no_navegador", _abrir)


@tool
def esvaziar_lixeira() -> str:
    """Esvazia a Lixeira do Windows, apagando de vez os arquivos que estao
    nela. Pede confirmacao antes, porque a acao nao tem volta."""
    if not pedir_confirmacao(
        "Esvaziar a Lixeira do Windows? Os arquivos nela serao apagados de vez."
    ):
        return "Esvaziamento da Lixeira cancelado pelo usuario."

    def _esvaziar():
        resultado = subprocess.run(
            ["powershell", "-NoProfile", "-Command",
             "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"],
            capture_output=True, text=True,
        )
        if resultado.returncode != 0:
            return (
                "Nao consegui esvaziar a Lixeira automaticamente "
                f"(detalhe: {(resultado.stderr or '').strip()[:200]}). "
                "Abra a Lixeira na Area de Trabalho e clique em 'Esvaziar Lixeira'."
            )
        return "Lixeira esvaziada com sucesso."

    return executar_com_autocura("esvaziar_lixeira", _esvaziar)


@tool
def espaco_em_disco() -> str:
    """Mostra o espaco usado e livre de cada disco/particao do PC (ex.: C:, D:).
    E so leitura - nao apaga nem altera nada."""
    def _verificar():
        import psutil
        linhas = []
        for part in psutil.disk_partitions(all=False):
            try:
                uso = psutil.disk_usage(part.mountpoint)
            except Exception:
                continue  # particao sem acesso (ex.: CD vazio), ignora
            linhas.append(
                f"Disco {part.device.strip(chr(92))}: "
                f"{uso.total / (1024 ** 3):.0f} GB totais | "
                f"{uso.used / (1024 ** 3):.0f} GB usados ({uso.percent}%) | "
                f"{uso.free / (1024 ** 3):.0f} GB livres"
            )
        return "\n".join(linhas) or "Nao consegui ler os discos."

    return executar_com_autocura("espaco_em_disco", _verificar)


@tool
def listar_programas_abertos() -> str:
    """Lista os programas/processos rodando no PC agora, com os que mais
    consomem memoria RAM no topo. E so leitura."""
    def _listar():
        import psutil
        agregado = {}
        for p in psutil.process_iter(["name", "memory_percent"]):
            try:
                nome = p.info.get("name")
                if nome:
                    agregado[nome] = agregado.get(nome, 0) + (p.info.get("memory_percent") or 0)
            except Exception:
                pass
        ordenado = sorted(agregado.items(), key=lambda par: par[1], reverse=True)
        topo = ordenado[:15]
        linhas = [f"- {nome}: {mem:.1f}% da RAM" for nome, mem in topo if mem > 0.05]
        return (
            f"{len(agregado)} processos rodando. Os que mais usam memoria:\n"
            + ("\n".join(linhas) if linhas else "Nenhum processo relevante detectado.")
        )

    return executar_com_autocura("listar_programas_abertos", _listar)


@tool
def meu_ip() -> str:
    """Mostra o IP local do PC e o IP publico da internet. Util para diagnostico
    de rede. E so leitura, nao altera nada."""
    def _ver():
        import socket
        import urllib.request
        saidas = []
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            saidas.append(f"IP local (rede): {s.getsockname()[0]}")
            s.close()
        except Exception:
            saidas.append("IP local: nao consegui identificar (o PC pode estar sem rede).")
        try:
            with urllib.request.urlopen("https://api.ipify.org", timeout=8) as r:
                saidas.append(f"IP publico (internet): {r.read().decode().strip()}")
        except Exception:
            saidas.append("IP publico: nao consegui consultar (pode estar sem internet).")
        return "\n".join(saidas)

    return executar_com_autocura("meu_ip", _ver)


@tool
def encontrar_arquivo(nome_ou_parte: str, pasta_inicial: str = "") -> str:
    """Procura arquivos/pastas no PC pelo nome (ou parte do nome). 'pasta_inicial'
    e opcional (padrao: pasta do usuario). Retorna os caminhos encontrados.
    E so leitura, nao apaga nem move nada."""
    def _procurar():
        origem = pasta_inicial or os.path.expanduser("~")
        if not os.path.isdir(origem):
            return f"Pasta inicial nao encontrada: {origem}"
        termo = nome_ou_parte.lower()
        ignorar = {"appdata", "windows", "$recycle.bin", "system volume information",
                   "node_modules", ".git", "site-packages", "__pycache__", "onedrive"}
        achados = []
        for raiz, pastas, arquivos in os.walk(origem):
            pastas[:] = [p for p in pastas if p.lower() not in ignorar]
            for nome in arquivos + pastas:
                if termo in nome.lower():
                    achados.append(os.path.join(raiz, nome))
                    if len(achados) >= 30:
                        return "Encontrei (mostrando os primeiros 30):\n" + "\n".join(achados)
        return ("\n".join(achados) if achados
                else f"Nenhum arquivo/pasta com '{nome_ou_parte}' encontrado em {origem}.")

    return executar_com_autocura("encontrar_arquivo", _procurar)


@tool
def listar_pasta(caminho_pasta: str = "") -> str:
    """Lista o conteudo de uma pasta (subpastas e arquivos). Se 'caminho_pasta'
    ficar vazio, lista a pasta do usuario. E so leitura."""
    def _listar():
        alvo = caminho_pasta or os.path.expanduser("~")
        if not os.path.isdir(alvo):
            return f"Pasta nao encontrada: {alvo}"
        entradas = sorted(os.listdir(alvo), key=lambda n: (not os.path.isdir(os.path.join(alvo, n)), n.lower()))
        linhas = []
        for n in entradas[:60]:
            completo = os.path.join(alvo, n)
            tipo = "[PASTA]" if os.path.isdir(completo) else "       "
            linhas.append(f"{tipo} {n}")
        extra = f"\n...(+{len(entradas) - 60} itens nao mostrados)" if len(entradas) > 60 else ""
        return f"Conteudo de {alvo}:\n" + ("\n".join(linhas) if linhas else "(pasta vazia)") + extra

    return executar_com_autocura("listar_pasta", _listar)


@tool
def area_transferencia(acao: str, texto: str = "") -> str:
    """Trabalha com a area de transferencia (o que foi copiado com Ctrl+C).
    Acoes: 'ler' (mostra o texto copiado), 'copiar' (coloca o 'texto' na area),
    'limpar'. Nao usa IA e nao gasta cota."""
    def _executar():
        import subprocess as _sp
        if acao == "limpar":
            _sp.run("cmd /c \"echo off | clip\"", shell=True, capture_output=True)
            return "Area de transferencia limpa."
        if acao == "copiar":
            if not texto:
                return "Me diga o texto para copiar."
            _sp.run("clip", input=texto.encode("utf-8"), shell=True, capture_output=True)
            return f"Texto copiado para a area de transferencia ({len(texto)} caracteres)."
        if acao == "ler":
            resultado = _sp.run(
                ["powershell", "-NoProfile", "-Command", "Get-Clipboard"],
                capture_output=True, text=True,
            )
            conteudo = (resultado.stdout or "").strip()
            if not conteudo:
                return "A area de transferencia esta vazia (ou contem so uma imagem/arquivo, nao texto)."
            return f"Conteudo copiado:\n{conteudo[:2000]}"
        return "Acao invalida. Use: ler, copiar ou limpar."

    return executar_com_autocura("area_transferencia", _executar)


@tool
def timer_lembrete(minutos: int, mensagem: str = "") -> str:
    """Cria um LEMBRETE UNICO: depois de 'minutos' minutos avisa em voz e na tela.
    Diferente de agendar_tarefa (que e diario), este toca uma so vez. Nao usa IA
    e nao gasta cota - roda em segundo plano."""
    def _avisar():
        aviso = f"LEMBRETE: {mensagem}" if mensagem else "LEMBRETE: o tempo que voce pediu acabou."
        print(f"\n[Timer] {aviso}")
        falar(aviso)

    try:
        threading.Timer(max(0, minutos) * 60, _avisar).start()
        return f"Lembrete criado: vou te avisar em {minutos} minuto(s)."
    except Exception as e:
        return f"Nao consegui criar o lembrete ({e})."


# Comandos destrutivos/perigosos: sempre exigem confirmacao antes de rodar,
# mesmo no nivel de permissao que normalmente nao pergunta. E a trava de
# seguranca do "controle total" (igual aos agentes Open Interpreter/Cline,
# que pedem aprovacao para comandos que podem apagar/alterar o sistema).
COMANDOS_PERIGOSOS = (
    "format", "del /", "del /s", "del /q", "erase ", "rmdir /s", "rd /s",
    "rmdir /q", "rd /q", "remove-item", "rm -rf", "rm -fr", "shutdown",
    "diskpart", "reg delete", "reg delete", "takeown", "icacls", "cipher /w",
    "mkfs", "diskpart", "bcdedit", "net user", "stop-process -force",
    "taskkill /f", "reset",
)


@tool
def executar_comando(comando: str) -> str:
    """CONTROLE TOTAL DO PC: executa QUALQUER comando do terminal do Windows
    (cmd ou PowerShell, ex.: 'ipconfig', 'dir', 'winget upgrade --all',
    'systeminfo', comandos do PowerShell) e devolve a saida completa, os erros
    e o codigo de retorno - assim da pra saber se deu certo e corrigir se nao
    deu. Use esta ferramenta quando nenhuma das outras (mais especificas)
    resolver. Comandos destrutivos (apagar tudo, formatar, desligar, mexer em
    registro/usuarios) SEMPRE pedem confirmacao antes de rodar. Nunca invente
    que um comando funcionou: leia a saida/erro devolvidos."""
    _risco = any(_p in comando.lower() for _p in COMANDOS_PERIGOSOS)
    if _risco and not confirmar_destrutivo(
        f"Este comando parece DESTRUTIVO ou de sistema: '{comando}'. "
        "Tem certeza que deve ser executado?"
    ):
        return "Comando destrutivo cancelado pelo usuario. Nada foi executado."

    def _rodar():
        try:
            resultado = subprocess.run(
                comando, shell=True, capture_output=True,
                text=True, timeout=120, encoding="utf-8", errors="ignore",
            )
        except subprocess.TimeoutExpired:
            return "O comando demorou mais de 120 segundos e foi interrompido."
        saida = (resultado.stdout or "").strip()
        erros = (resultado.stderr or "").strip()
        partes = [f"Codigo de retorno: {resultado.returncode} (0 = sucesso)"]
        if saida:
            partes.append("Saida:\n" + saida[-3500:])
        if erros:
            partes.append("Erros/Avisos:\n" + erros[-1800:])
        if not saida and not erros:
            partes.append("Comando executado (sem saida de texto).")
        return "\n".join(partes)

    return executar_com_autocura("executar_comando", _rodar)


@tool
def capturar_tela_arquivo(nome: str = "") -> str:
    """Tira um print da tela e SALVA num arquivo PNG (na pasta 'prints' dentro
    da pasta do agente), sem usar IA e sem gastar cota. Diferente de
    'dar_olhos_ao_agente' (que manda a imagem para a IA analisar), esta ferramenta
    so grava o arquivo no disco."""
    def _capturar():
        pasta = os.path.join(PASTA_BASE, "prints")
        os.makedirs(pasta, exist_ok=True)
        if nome.strip():
            arquivo = nome.strip().replace(" ", "_")
        else:
            arquivo = datetime.now().strftime("print_%Y%m%d_%H%M%S")
        if not arquivo.lower().endswith(".png"):
            arquivo += ".png"
        caminho = os.path.join(pasta, arquivo)
        pyautogui.screenshot(caminho)
        return f"Print da tela salvo em: {caminho}"

    return executar_com_autocura("capturar_tela_arquivo", _capturar)


@tool
def renomear_mover_arquivo(origem: str, destino: str) -> str:
    """Renomeia ou move um arquivo/pasta. 'origem' e o caminho atual; 'destino'
    pode ser so o novo nome (na mesma pasta) ou o caminho completo de destino.
    Nao apaga conteudo. Se ja existir algo no destino, NAO sobrescreve (avisa
    para voce escolher outro nome), evitando perda de arquivo."""
    def _mover():
        import shutil
        if not os.path.exists(origem):
            return f"Origem nao encontrada: {origem}"
        if os.path.exists(destino):
            return (f"Ja existe algo em: {destino}. Escolha outro nome/destino "
                    "para nao sobrescrever nada.")
        pasta_destino = os.path.dirname(destino)
        if pasta_destino and not os.path.isdir(pasta_destino):
            os.makedirs(pasta_destino, exist_ok=True)
        shutil.move(origem, destino)
        return f"Pronto: '{origem}' renomeado/movido para '{destino}'."

    return executar_com_autocura("renomear_mover_arquivo", _mover)


tools = [
    esvaziar_lixeira,
    espaco_em_disco,
    listar_programas_abertos,
    meu_ip,
    encontrar_arquivo,
    listar_pasta,
    area_transferencia,
    timer_lembrete,
    executar_comando,
    capturar_tela_arquivo,
    renomear_mover_arquivo,
    enviar_mensagem_whatsapp,
    gerenciar_contatos,
    enviar_email,
    evoluir_agente,
    otimizar_sistema,
    monitorar_sistema_avancado,
    controlar_midia,
    abrir_site_no_navegador,
    configurar_aparencia_e_energia,
    configurar_dispositivo_avancado,
    gerar_documentacao_projeto,
    criar_site_completo,
    criar_site_3d,
    reabrir_projeto,
    agendar_tarefa,
    adicionar_regra,
    verificar_atualizacoes_sistema,
    instalar_ou_atualizar_programa,
    alterar_configuracao_sistema,
    gravar_macro,
    repetir_macro,
    resumir_arquivo,
    terminal_do_sistema,
    dar_olhos_ao_agente,
    ler_e_analisar_arquivos_dados,
    controlar_mouse_e_teclado,
    gerenciar_arquivos_e_pastas,
    substituir_trecho_arquivo,
    monitorar_sistema,
    gravar_memoria_core,
    consultar_memoria_core,
]

# ======================================================================

print(" Configurando o Super Agente Otimizado v4.0 ULTRA...")

# Um agente (com ferramentas) para CADA IA do rodizio. E criado sob demanda
# (lazy) e guardado em cache, so para as IAs que realmente respondem.
_agentes_por_ia = {}


def _pegar_agente(idx):
    if idx not in _agentes_por_ia:
        _agentes_por_ia[idx] = create_agent(model=modelos_ia[idx]["llm"], tools=tools)
    return _agentes_por_ia[idx]

print(f" Super Agente pronto! Nível de permissão: '{config.get('nivel_permissao')}'. Digite 'status' a qualquer momento.")
falar("Agente pronto para uso.")

while True:
    comando_usuario = input("\nO que o agente deve fazer no PC? ")
    if comando_usuario.lower() == "sair":
        break
    if not comando_usuario.strip():
        # Enter sem nada digitado: não envia mensagem vazia pro modelo (isso
        # causava o erro "última mensagem precisa ser do usuário").
        continue

    verificar_regras(comando_usuario)

    if processar_atalho_rapido(comando_usuario):
        continue

    # --- Contexto inteligente (memoria em camadas, tipo Cline/MemGPT) ---
    # CORE: fatos permanentes que o agente nunca pode esquecer. LICOES: o que
    # ele aprendeu com erros anteriores. Ambos vem de arquivos locais e sao
    # bem curtos, entao custam pouquissimos tokens.
    _blocos_contexto = []
    _core = ler_memoria_core()
    if _core:
        _blocos_contexto.append("[Memoria central - fatos permanentes]\n" + _core)
    _licoes = ler_licoes()
    if _licoes:
        _blocos_contexto.append("[Licoes de erros anteriores - nao repetir]\n" + _licoes)
    memorias = buscar_memorias_relevantes(comando_usuario)
    if memorias:
        _blocos_contexto.append("[Memórias relevantes]: " + " | ".join(m["texto"] for m in memorias))
    contexto_extra = ("\n\n" + "\n\n".join(_blocos_contexto)) if _blocos_contexto else ""

    historico_conversas.append({"role": "user", "content": comando_usuario + contexto_extra})

    def _rodar_agente():
        # Percorre o rodizio de IAs (um agente com ferramentas para cada uma).
        # recursion_limit = anti-loop: maximo de passos (ferramenta+IA) por tarefa.
        _texto = _percorrer_rodizio(
            lambda _idx, _llm: _pegar_agente(_idx).invoke(
                {"messages": historico_conversas},
                config={"recursion_limit": 18},
            ),
            lambda _resp: _extrair_texto(_resp["messages"][-1].content),
        )
        if _texto is not None:
            return _texto
        raise RuntimeError(_TEXTO_TODAS_FALHARAM)

    try:
        resposta_texto = executar_com_autocura("agente_principal", _rodar_agente)
    except Exception as _e_loop:
        if _eh_erro_de_recursao(_e_loop):
            resposta_texto = (
                "Eu acabei enroscando e repetindo passos demais nessa tarefa, "
                "entao parei para nao gastar cota a toa. Vamos fazer por partes: "
                "me diga QUAL deve ser a PRIMEIRA etapa (ou divida a tarefa em "
                "pedidos menores), que eu executo uma de cada vez."
            )
        else:
            raise

    historico_conversas.append({"role": "assistant", "content": resposta_texto})
    salvar_historico()
    registrar_memoria_longa(f"P: {comando_usuario} R: {resposta_texto}")
    print(f"\n[IA Avançada]: {resposta_texto}")
    falar(resposta_texto)
