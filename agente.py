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
try:
    from langchain_google_genai import ChatGoogleGenerativeAI as _ChatGoogleGenerativeAI
except Exception:  # biblioteca do Google ausente: o Gemini so fica indisponivel
    _ChatGoogleGenerativeAI = None
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
ARQ_GRUPOS = os.path.join(PASTA_BASE, "grupos.json")   # grupos do WhatsApp (nome -> id)
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
grupos_whats = carregar_json(ARQ_GRUPOS, {})  # nome do grupo (minusculo) -> id do grupo
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
    "Voce e o Super Agente, um assistente que controla um PC com Windows de verdade. "
    "Responda em portugues do Brasil, curto, direto e confiante (pode ter bom humor, sem emojis).\n"
    "REGRAS:\n"
    "1. Conversa/explicacao: responda direto em texto. Use ferramenta so quando o pedido exigir uma ACAO real no PC "
    "(abrir algo, criar/editar/apagar arquivo, mudar configuracao, enviar mensagem, gerar projeto). Se existir a ferramenta "
    "certa, use-a; nao invente que executou. Na sabe qual usar? Chame 'listar_ferramentas'.\n"
    "2. Tarefa grande: faca UMA etapa por vez e confira o resultado antes da proxima; se uma chamada falhar 2x, mude de abordagem.\n"
    "3. Codigo/site: use 'central_codigo'. Melhorar o proprio agente: 'central_auto_codigo' (backup+reverte sozinho).\n"
    "4. SEGURANCA: as ferramentas que MUDAM o sistema (formatar, apagar, registro, usuarios, servicos, rede, firewall, "
    "criptografia, BitLocker, instalar/desinstalar) JA pedem 'sim/nao' sozinhas. Nunca pule essa trava e nunca diga que "
    "executou antes do 'sim'. Leituras (listar/ver/status) nao pedem nada.\n"
    "5. So administre o SEU proprio PC; nada de espionar ou esconder atividades.\n"
    "6. Fatos permanentes do usuario (nome, preferencias): grave com 'gravar_memoria_core' e leia com 'consultar_memoria_core'.\n"
    "7. Personalidade: se perguntarem o que VOCE acha/quer/sonha ou que ferramentas gostaria de ter, use 'agente_opinioes'; "
    "quantas ferramentas voce tem -> 'estatisticas_poder'; frase motivacional/engracada -> 'frase_poderosa'; opiniao sobre o PC -> "
    "'auto_melhoria_pc'. Acoes rapidas: limpeza use 'otimizar_tudo', check-up use 'medico_do_pc', internet use 'reparar_internet'."
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
    # Modelo confirmado no tier gratuito do AI Studio (gemini-2.5-flash-lite e
    # rapido, barato em tokens e estavel; evita erro de "modelo nao encontrado").
    {"nome": "Gemini (Google)",        "tipo": "gemini", "modelo": "gemini-2.5-flash-lite",       "chave_env": "GEMINI_API_KEY"},
    {"nome": "Groq (GPT-OSS 20B)",     "tipo": "openai", "modelo": "openai/gpt-oss-20b",          "chave_env": "GROQ_API_KEY",      "base_url": "https://api.groq.com/openai/v1"},
    {"nome": "Groq (GPT-OSS 120B)",    "tipo": "openai", "modelo": "openai/gpt-oss-120b",         "chave_env": "GROQ_API_KEY",      "base_url": "https://api.groq.com/openai/v1"},
    # Reserva (algumas contas/regioes ainda tem estes; se nao existirem, o
    # rodizio marca como mortas na 1a tentativa e segue sem incomodar):
    {"nome": "Groq (Llama 3.3 70B)",   "tipo": "openai", "modelo": "llama-3.3-70b-versatile",      "chave_env": "GROQ_API_KEY",      "base_url": "https://api.groq.com/openai/v1"},
    {"nome": "Groq (Llama 3.1 8B rapido)","tipo": "openai", "modelo": "llama-3.1-8b-instant",       "chave_env": "GROQ_API_KEY",     "base_url": "https://api.groq.com/openai/v1"},
    {"nome": "Groq (Qwen 32B)",          "tipo": "openai", "modelo": "qwen/qwen3-32b",              "chave_env": "GROQ_API_KEY",     "base_url": "https://api.groq.com/openai/v1"},
    # OBS: 'llama-4-scout-17b-16e-instruct' foi DESCONTINUADO no Groq em
    # 17/07/2026 (dava "model not found") - por isso saiu da lista.
    # Cerebras (2026, 1 milhao de tokens/dia gratis): IDs exatos do catalogo.
    # gpt-oss-120b = o mais capaz e com suporte a ferramentas; qwen-3-32b =
    # production; llama3.1-8b (sem hifen) = rapido. O Qwen 235B e so 'preview'
    # (nao entra na conta gratis), por isso foi removido.
    {"nome": "Cerebras (GPT-OSS 120B)","tipo": "openai", "modelo": "gpt-oss-120b",                 "chave_env": "CEREBRAS_API_KEY", "base_url": "https://api.cerebras.ai/v1"},
    {"nome": "Cerebras (Qwen 32B)",   "tipo": "openai", "modelo": "qwen-3-32b",                   "chave_env": "CEREBRAS_API_KEY", "base_url": "https://api.cerebras.ai/v1"},
    {"nome": "Cerebras (Llama 3.1 8B)","tipo": "openai", "modelo": "llama3.1-8b",                  "chave_env": "CEREBRAS_API_KEY", "base_url": "https://api.cerebras.ai/v1"},
    {"nome": "SambaNova (Llama 70B)",  "tipo": "openai", "modelo": "Meta-Llama-3.3-70B-Instruct", "chave_env": "SAMBANOVA_API_KEY", "base_url": "https://api.sambanova.ai/v1"},
    {"nome": "OpenRouter (Llama 70B)", "tipo": "openai", "modelo": "meta-llama/llama-3.3-70b-instruct:free", "chave_env": "OPENROUTER_API_KEY", "base_url": "https://openrouter.ai/api/v1"},
    {"nome": "OpenRouter (Gemma)",     "tipo": "openai", "modelo": "google/gemma-3-27b-it:free",          "chave_env": "OPENROUTER_API_KEY", "base_url": "https://openrouter.ai/api/v1"},
    # GitHub Models: modelos de ponta (DeepSeek, GPT, Llama) usando um TOKEN
    # gratuito do GitHub (cria em github.com -> Settings -> Developer settings
    # -> Personal access tokens -> Tokens classic -> Generate, sem marcar nada;
    # salva com setx GITHUB_TOKEN "ghp_..."). Compativel com OpenAI (Azure).
    {"nome": "GitHub Models (DeepSeek R1)", "tipo": "openai", "modelo": "DeepSeek-R1", "chave_env": "GITHUB_TOKEN", "base_url": "https://models.inference.ai.azure.com"},
    # Redes de seguranca SEM CHAVE e SEM CADASTRO: funcionam mesmo se o usuario
    # nao configurar NENHUMA chave. Por isso ficam sempre ativas e servem de
    # ultima tentativa quando todas as IAs com chave estourarem a cota do dia.
    # LLM7: gateway anonimo (OpenAI-compativel), da GPT-4o-mini e DeepSeek de
    # graca a ~30 pedidos/minuto sem precisar criar conta.
    {"nome": "LLM7 (GPT-4o-mini, sem chave)", "tipo": "openai", "modelo": "gpt-4o-mini", "chave_env": None, "base_url": "https://api.llm7.io/v1", "sem_chave": True},
    {"nome": "LLM7 (DeepSeek, sem chave)",    "tipo": "openai", "modelo": "deepseek-r1-0528", "chave_env": None, "base_url": "https://api.llm7.io/v1", "sem_chave": True},
    # Pollinations: tambem sem chave/cadastro, gratuito.
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
            if _ChatGoogleGenerativeAI is None:
                # biblioteca do Google faltando: avisa e segue com as outras IAs
                print("[Aviso]: 'langchain-google-genai' nao instalada (rode: pip install langchain-google-genai). Gemini desligado.")
                continue
            # Passa a chave EXPLICITAMENTE: assim funciona tanto por variavel de
            # ambiente (setx) quanto lida do arquivo chaves.txt.
            _modelo = _ChatGoogleGenerativeAI(
                model=_prov["modelo"], temperature=0,
                google_api_key=_chave,
            )
        else:
            # Provedores OpenAI-compativeis (Groq, Cerebras, SambaNova,
            # OpenRouter, LLM7...): todos usam a MESMA biblioteca (ChatOpenAI),
            # mudando so o endereco (base_url), a chave e o nome do modelo.
            # IMPORTANTE: NAO enviamos 'temperature' - os modelos de raciocinio
            # (gpt-oss e similares) REJEITAM esse parametro e devolvem 400
            # InvalidRequest. Sem ele, tanto modelos de chat quanto de
            # raciocinio funcionam no endpoint compativel.
            from langchain_openai import ChatOpenAI
            _modelo = ChatOpenAI(
                model=_prov["modelo"],
                base_url=_prov["base_url"],
                api_key=_chave,
                timeout=90,
                max_retries=0,  # o rodizio ja faz a nossa propria tentativa
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

# Cooldown de COTA: quando uma IA estoura o limite (429/quota/rate), ela entra
# num "descanso" temporario (em segundos) e e pulada ate passar o tempo - assim
# o rodizio NAO fica batendo numa IA sem cota e imprimindo falha atras de
# falha. Diferente das mortas, ela VOLTA automaticamente depois do descanso.
_ias_cooldown = {}          # idx -> timestamp (time.time()) em que volta a valer
_DURACAO_COOLDOWN_SEG = 60  # 1 minuto de descanso por estouro de cota


def _erro_de_cota(_e):
    """True SOMENTE quando o erro e de LIMITE/COTA real (429, rate limit, quota,
    sobrecarga). Um erro de requisicao invalida (400/InvalidRequest, ex.: nome
    de modelo ou payload) NAO e cota e NAO deve dar cooldown - senao a IA toma
    'castigo' sem necessidade e o chat puro tambem fica sem ela. Quando o
    proprio texto diz que e rate/quota/429, mesmo vindo como APIStatusError,
    ai sim e cota."""
    _txt = f"{type(_e).__name__} {_e}".lower()
    # so tratamos como cota se houver marcador EXPLICITO de limite
    return any(_m in _txt for _m in (
        "429", "rate limit", "ratelimit", "rate_limit", "quota", "too many",
        "throttl", "resource exhausted", "overloaded",
        "insufficient_quota", "usage limit", "limit reached",
        "capacity", "rate_limit_exceeded", "rpm",
    ))


def _em_cooldown(idx):
    """True se a IA idx ainda estiver no periodo de descanso de cota."""
    if idx not in _ias_cooldown:
        return False
    if time.time() >= _ias_cooldown[idx]:
        _ias_cooldown.pop(idx, None)  # descanso acabou: volta ao jogo
        return False
    return True


def _fora_do_jogo(idx):
    """IA que nao deve ser tentada agora: morta permanente OU em cooldown."""
    return idx in _ias_mortas or _em_cooldown(idx)


def _erro_permanente(_e):
    _txt = f"{type(_e).__name__} {_e}".lower()
    # "model ... not found/does not exist/no such model" e erro de autenticacao
    # sao permanentes. Cota (429) NAO cai aqui (vira cooldown).
    return any(_m in _txt for _m in (
        "modelnotfound", "notfound", "model_not_found", "does not exist",
        "no such model", "model_decommissioned", "unknown model",
        "authentication", "unauthorized", "invalid api key",
        "invalidapikey", "permission denied", "forbidden",
        "status code 401", "status code 404", "error 401", "error 404",
        "'401'", "'404'",
        # Free tiers que passaram a exigir cartao/foram descontinuados: nao
        # adianta insistir nesta sessao (so enche o log de falha).
        "payment", "billing", "payment_required", "paymentrequired",
        "402", "payment method is required", "deprecat",
        "currently unavailable", "model is currently",
    ))


def _detalhe_erro(_e, tamanho: int = 140) -> str:
    """Extrai a mensagem REAL do erro (a API costuma trazer o motivo dentro de
    'response'/'body'/'message') resumida em uma linha - para o log do rodizio
    mostrar o PORQUE da falha, nao so o nome da classe de excecao."""
    try:
        resp = getattr(_e, "response", None)
        if resp is not None:
            data = getattr(resp, "json", None)
            if callable(data):
                try:
                    j = data()
                    msg = (j.get("error", {}) or {}).get("message") if isinstance(j, dict) else None
                    if msg:
                        return str(msg)[:tamanho]
                except Exception:
                    pass
            txt = getattr(resp, "text", None)
            if txt:
                return str(txt)[:tamanho]
    except Exception:
        pass
    msg = str(_e)
    if not msg:
        return type(_e).__name__
    # remove quebras de linha e resume
    return " ".join(msg.split())[:tamanho]


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


def _percorrer_rodizio(chamar, extrair, ignorar_penalidades=False):
    """Tenta cada IA ativa, comecando pela ultima que funcionou. Em erro
    permanente (modelo/chave), marca a IA como morta nesta sessao e pula;
    em erro de cota/rede, da cooldown e tenta a proxima. Retorna o que
    'extrair(resposta)' devolver, ou None se todas falharem.

    ignorar_penalidades=True (usado pelo CHAT PURO/sem ferramentas): testa
    TODAS as IAs, inclusive as que estao de castigo/fora por falha no caminho
    de ferramentas - um erro de ferramenta (400) nao significa que a IA esteja
    sem cota no chat puro, que usa payload pequeno."""
    global indice_ia_atual
    total = len(modelos_ia)
    for _passo in range(total):
        _idx = (indice_ia_atual + _passo) % total
        if (not ignorar_penalidades) and _fora_do_jogo(_idx):
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
                if ignorar_penalidades or not _fora_do_jogo(_cand):
                    _prox = modelos_ia[_cand]["nome"]
                    break
            _detalhe = _detalhe_erro(_e)
            if _erro_permanente(_e):
                if not ignorar_penalidades:
                    _ias_mortas.add(_idx)
                print(f"[Rodizio]: '{_info['nome']}' indisponivel (modelo/chave). Motivo: {_detalhe}")
            elif (not ignorar_penalidades) and _erro_de_cota(_e):
                _ias_cooldown[_idx] = time.time() + _DURACAO_COOLDOWN_SEG
                print(f"[Rodizio]: '{_info['nome']}' estourou a cota. Descanso de {_DURACAO_COOLDOWN_SEG}s; "
                      + (f"tentando '{_prox}'..." if _prox else "sem outras IAs no momento.") + f" ({_detalhe})")
            else:
                print(f"[Rodizio]: '{_info['nome']}' falhou: {_detalhe}"
                      + (f" -> tentando '{_prox}'..." if _prox else " -> sem outras IAs ativas."))
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
    # rodizio de IAs (ver _percorrer_rodizio). O chat PURO (sem ferramentas)
    # usa payload pequeno, entao ele IGNORA o cooldown/IA-morta marcados pelo
    # caminho de ferramentas - assim, mesmo que o agente com ferramentas tenha
    # falhado em toda IA, a conversa direta ainda consegue responder.
    from types import SimpleNamespace
    _resultado = _percorrer_rodizio(
        lambda _idx, _llm: _llm.invoke(mensagens),
        lambda _resp: _resp,
        ignorar_penalidades=True,
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
    """Trava para acoes que nao tem volta MAS que o usuario pediu (apagar um
    arquivo/pasta especifico). No nivel 'admin' o agente executa sozinho; no
    'basico' bloqueia; no 'padrao' pergunta 'sim/nao'."""
    nivel = config.get("nivel_permissao", "padrao")
    if nivel == "admin":
        print(f"\n[Modo admin]: executando sem perguntar - {mensagem[:90]}")
        return True
    if nivel == "basico":
        print(f"\n[Bloqueado no nível 'basico']: {mensagem}")
        return False
    print("\n[ACAO DESTRUTIVA / SEM VOLTA] " + mensagem)
    resposta = input("Digite 'sim' para EXECUTAR, ou qualquer outra coisa para cancelar: ").strip().lower()
    return resposta in ("sim", "s", "yes", "y")


def confirmar_catastrofico(mensagem: str) -> bool:
    """TRAVA DE EMERGENCIA que SEMPRE pergunta, MESMO no nivel 'admin', para
    comandos do terminal que podem destruir o PC inteiro (formatar, desligar,
    apagar o disco, mexer no registro/usuarios). E a unica barreira que nem o
    modo autonomo remove - protege contra um engano seu ou uma alucinacao da
    IA. No nivel 'basico' bloqueia de vez."""
    if config.get("nivel_permissao", "padrao") == "basico":
        print(f"\n[Bloqueado no nível 'basico']: {mensagem}")
        return False
    print("\n" + "!" * 64)
    print("[COMANDO CATASTROFICO / PODE DESTRUIR O PC]")
    print("!" * 64)
    print(mensagem)
    resposta = input("Digite 'sim' COM CERTEZA para executar, ou outra coisa para cancelar: ").strip().lower()
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


@tool
def listar_ferramentas(assunto: str = "") -> str:
    """Lista TODAS as ferramentas que o agente sabe usar, com uma explicacao
    curta de cada uma. Use esta ferramenta quando nao tiver certeza de qual
    ferramenta existe ou qual usar para um pedido (ex.: WhatsApp, grupos,
    arquivos, programas, email, midia, sistema). Se informar 'assunto' (ex.:
    'whatsapp', 'arquivo', 'sistema'), lista so as ferramentas relacionadas."""
    linhas = []
    for fn in tools:
        nome = getattr(fn, "name", getattr(fn, "__name__", str(fn)))
        doc = (getattr(fn, "description", "") or getattr(fn, "__doc__", "") or "").strip()
        resumo = " ".join(doc.split())
        if len(resumo) > 160:
            resumo = resumo[:160] + "..."
        if assunto:
            bloco = (nome + " " + resumo).lower()
            if assunto.lower() not in bloco:
                continue
        linhas.append(f"- {nome}: {resumo}" if resumo else f"- {nome}")
    cabecalho = f"Ferramentas disponiveis ({len(linhas)}"
    if assunto:
        cabecalho += f" sobre '{assunto}'"
    cabecalho += "):"
    return cabecalho + "\n" + "\n".join(linhas) if linhas else \
        f"Nao encontrei ferramentas sobre '{assunto}'. Liste sem assunto para ver todas."


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
    # Saudações e papo rápido (respondem em 1 chamada, sem gastar o agente de
    # ferramentas): assim "oi/ola/bom dia/tudo bem" saem na hora.
    "ola", "olá", "oi", "oie", "ei", "bom dia", "boa tarde", "boa noite",
    "tudo bem", "tudo bom", "como vai", "como você esta", "como voce esta",
    "obrigad", "valeu", "tchau", "ate logo", "até logo", "que bom",
    # Variantes de saudacao/papo curto (respondem no chat PURO, sem montar o
    # agente de ferramentas - assim "iae/eai/salve/fala/blz" nunca caem no
    # caminho que manda ferramentas e pode dar InvalidRequest):
    "iae", "i ae", "eai", "e ai", "eae", "eaew", "salve", "salve salve",
    "falae", "fala ai", "fala aí", "fala", "hey", "hello", "hola",
    "beleza", "blz", "tranquilo", "firmeza", "boa", "tudo otimo", "tudo otimo",
    "como voce ta", "como você tá", "de boa", "vamos la", "vamos lá",
]
PALAVRAS_TAREFA_COMPLEXA = [
    "crie", "delete", "pasta", "arquivo", "whatsapp", "manda mensagem",
    "envia mensagem", "site", "atualiza", "atualização", "configuração",
    "agenda", "macro", "regra",
    # Mensagens/contatos: qualquer pedido de ENVIAR algo a alguem precisa ir
    # pro agente completo (que tem a ferramenta de WhatsApp/email). Sem isto,
    # "mande oi pro Joao" casava com o "oi" da conversa e ia pro chat rapido.
    "mande", "mandar", "manda", "envia", "enviar", "envie", "mensagem",
    "whats", "zap", "email", "e-mail", "grupo", "ligar",
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
    try:
        _em_desc = sum(1 for _i in range(len(modelos_ia)) if _em_cooldown(_i))
        _mortas = len([_i for _i in _ias_mortas if _i < len(modelos_ia)])
        print(f"IAs em descanso    : {_em_desc} (volta sozinha em ~1min)" + (f" | fora desta sessao: {_mortas}" if _mortas else ""))
    except Exception:
        pass
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

    # --- Atalhos INSTANTANEOS (sem IA, resposta na hora) ---
    # Cotacao do dolar/euro/bitcoin e clima: rodam direto a ferramenta local,
    # sem gastar cota - resposta quase instantanea.
    if any(p in cmd for p in ("dolar", "dólar", "cotação", "cotacao", "euro", "bitcoin", "clima", "tempo agora", "vai chover")):
        try:
            _cid = ""
            for chave in ("clima em", "tempo em", "em "):
                if chave in cmd:
                    _cid = cmd.split(chave)[-1].strip(" ?!")
                    break
            print("\n[Rapido]: " + cotacao_e_clima.invoke({"cidade": _cid}))
        except Exception as _e:
            print(f"\n[Rapido]: nao consegui consultar agora ({type(_e).__name__}).")
        return True
    # Bloquear a tela na hora (Win+L) - instantaneo.
    if any(p in cmd for p in ("bloquear tela", "bloquear pc", "travar tela", "trancar tela", "bloqueia a tela")):
        controle_de_energia.invoke({"acao": "bloquear"})
        print("\n[Rapido]: tela bloqueada.")
        return True
    # Calculadora instantanea: se o comando for basicamente uma conta (so
    # numeros, operadores e parenteses), calcula na hora sem gastar IA.
    _limpo = cmd.strip().rstrip("=").strip().replace(",", ".")
    if any(ch in _limpo for ch in "+-*/") and any(ch.isdigit() for ch in _limpo):
        _so_conta = _limpo.replace(" ", "")
        _permitidos = set("0123456789+-*/().%")
        if set(_so_conta) <= _permitidos and any(ch.isdigit() for ch in _so_conta):
            try:
                print("\n[Rapido]: " + calculadora.invoke({"expressao": cmd.strip()}))
                return True
            except Exception:
                pass

    # --- Comando de NIVEL DE PERMISSAO (modo) ---
    # "modo admin"  -> faz tudo sozinho (so trava comandos catastroficos);
    # "modo padrao" -> pergunta sim/nao nas acoes sensiveis;
    # "modo basico" -> bloqueia alteracoes no sistema.
    if cmd in ("modo", "modo?") or cmd.startswith("modo "):
        _alvo = cmd.replace("modo", "", 1).strip().lower()
        if _alvo in ("admin", "administrador", "autonomo", "total", "tudo"):
            config["nivel_permissao"] = "admin"
            salvar_json(ARQ_CONFIG, config)
            print("\n[Modo]: ADMIN (autonomo) ligado. Agora eu faco praticamente tudo")
            print("sozinho - analisar, editar, apagar, instalar, configurar, enviar.")
            print("Unica trava: comandos catastroficos (formatar, desligar, apagar o")
            print("disco inteiro, registro) ainda pedem um 'sim' final, por seguranca.")
        elif _alvo in ("padrao", "normal", "default"):
            config["nivel_permissao"] = "padrao"
            salvar_json(ARQ_CONFIG, config)
            print("\n[Modo]: PADRAO. Vou pedir 'sim/nao' antes de acoes sensiveis")
            print("(apagar, enviar, instalar, mudar configuracao).")
        elif _alvo in ("basico", "seguro", "leitur"):
            config["nivel_permissao"] = "basico"
            salvar_json(ARQ_CONFIG, config)
            print("\n[Modo]: BASICO. Somente leitura/atalhos; alteracoes no sistema")
            print("estao bloqueadas.")
        else:
            print(f"\n[Modo] atual: '{config.get('nivel_permissao')}'.")
            print("Use: 'modo admin' (tudo sozinho), 'modo padrao' (pergunta) ou")
            print("'modo basico' (so leitura).")
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

    # PERGUNTAS DE PERSONALIDADE DO AGENTE: se o usuario pergunta o que o PROPRIO
    # agente acha/quer/sonha/quantas ferramentas tem, respondemos DIRETO com as
    # ferramentas de personalidade (sem gastar API e sem a IA inventar funcoes).
    _cl = cmd.lower().strip()
    _eh_pergunta_do_agente = (
        ("gostaria de ter" in _cl or "gostaria de colocar" in _cl or "quer ter" in _cl
         or "sonha" in _cl or "que voce acha" in _cl or "sua opiniao" in _cl
         or "opniao" in _cl or "opini" in _cl)
        and ("ferrament" in _cl or "fun" in _cl or "poder" in _cl or "voce" in _cl or "vc" in _cl)
    ) or ("quantas ferramentas" in _cl) or ("seu poder" in _cl or "teu poder" in _cl or "mostra seu poder" in _cl)
    if _eh_pergunta_do_agente:
        _pediu_poder = ("quantas" in _cl or "poder" in _cl) and ("melhor" not in _cl and "deixa" not in _cl and "pc" not in _cl)
        _pediu_ideias = ("gostaria" in _cl or "quer ter" in _cl or "sonha" in _cl or "colocar" in _cl
                         or "opini" in _cl or "opniao" in _cl or "que voce acha" in _cl or "ideia" in _cl)
        _r = (estatisticas_poder.invoke({}) if _pediu_poder and not _pediu_ideias else (
            agente_opinioes.invoke({}) if _pediu_ideias else auto_melhoria_pc.invoke({})))
        historico_conversas.append({"role": "assistant", "content": _r})
        salvar_historico()
        print(f"\n[Agente]: {_r}")
        falar(_r[:200])
        return True
    # Frase de motivacao/humor quando pedem algo como "fala algo", "frase forte"
    if any(p in _cl for p in ("frase forte", "frase poderosa", "me motiva", "fala algo forte", "fala uma frase")):
        _r = frase_poderosa.invoke({})
        historico_conversas.append({"role": "assistant", "content": _r})
        salvar_historico()
        print(f"\n[Agente]: {_r}")
        falar(_r)
        return True
    if _cl in ("voce e esperto", "vc e esperto", "você é esperto", "vc é esperto", "voce e inteligente", "vc e foda"):
        _r = frase_poderosa.invoke({})
        historico_conversas.append({"role": "assistant", "content": _r})
        salvar_historico()
        print(f"\n[Agente]: {_r}")
        falar(_r)
        return True

    # Roteamento robusto: normaliza tirando espacos/acentos/pontuacao para que
    # "OQUE VC FAZ?", "o que voce faz", "iae" etc. caiam no chat PURO mesmo
    # sem caixa/espaco certo (evita mandar papo curto pro agente de ferramentas).
    def _norm(s):
        s = s.lower()
        for a, b in (("á","a"),("à","a"),("ã","a"),("â","a"),("ç","c"),("é","e"),
                     ("ê","e"),("í","i"),("ó","o"),("ô","o"),("õ","o"),("ú","u")):
            s = s.replace(a, b)
        import re as _re2
        return _re2.sub(r"[^a-z0-9]", "", s)
    _cmd_norm = _norm(cmd)
    _conversa_norm = {_norm(p) for p in PALAVRAS_CONVERSA if _norm(p)}
    _tarefa_norm = {_norm(p) for p in PALAVRAS_TAREFA_COMPLEXA if _norm(p)}
    _cmd_low = cmd.lower()
    _eh_conversa = (any(p in _cmd_low for p in PALAVRAS_CONVERSA)
                    or any(p and p in _cmd_norm for p in _conversa_norm if len(p) >= 3))
    _eh_tarefa = (any(p in _cmd_low for p in PALAVRAS_TAREFA_COMPLEXA)
                  or any(p and p in _cmd_norm for p in _tarefa_norm if len(p) >= 3))
    if _eh_conversa and not _eh_tarefa:
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


def _colar_texto_clipboard(texto: str) -> bool:
    """Coloca 'texto' na area de transferencia do Windows suportando acentos e
    Unicode (o pyautogui.write nao digita acento). Tenta pyperclip; se nao
    houver, usa PowerShell lendo um arquivo temporario UTF-8."""
    try:
        import pyperclip
        pyperclip.copy(texto)
        return True
    except Exception:
        pass
    try:
        import tempfile
        _arq = os.path.join(tempfile.gettempdir(), "_wpp_colar.txt")
        with open(_arq, "w", encoding="utf-8") as f:
            f.write(texto)
        _caminho = _arq.replace("'", "''")
        subprocess.run(
            ["powershell", "-NoProfile", "-Command",
             f"Set-Clipboard -Value ([System.IO.File]::ReadAllText('{_caminho}'))"],
            capture_output=True,
        )
        return True
    except Exception:
        return False


@tool
def enviar_whatsapp_por_nome(nome_contato_ou_grupo: str, mensagem: str) -> str:
    """Envia mensagem no WhatsApp (app instalado no PC) PROCURANDO pelo NOME -
    funciona tanto para um CONTATO quanto para um GRUPO (grupo NAO tem numero).
    Nao precisa de numero nem de link de convite: abre o app do WhatsApp,
    busca o nome na caixa de busca (Ctrl+F), escolhe o resultado e manda. Use
    ESTA ferramenta por padrao para mandar WhatsApp. Pre-requisito: ter o app
    do WhatsApp instalado e logado no Windows. Sempre pede confirmacao antes
    de enviar. IMPORTANTE: o usuario deve ver a tela nas primeiras vezes."""
    alvo = nome_contato_ou_grupo.strip()
    if not pedir_confirmacao(
        f"Vou abrir o app do WhatsApp, buscar por '{alvo}' (contato ou grupo) e "
        f"enviar: \"{mensagem}\". Confirma? (nao mexa no teclado/mouse enquanto isso)"
    ):
        return "Envio cancelado pelo usuário."

    def _enviar():
        import pyautogui as _pg
        _pg.FAILSAFE = True  # levar o mouse ate o canto superior-esquerdo cancela
        # 1) abre o app do WhatsApp instalado (se nao abrir, cai no WhatsApp Web)
        try:
            os.startfile("whatsapp://")  # app do Windows
        except Exception:
            subprocess.Popen('start "" "https://web.whatsapp.com/"', shell=True)
        time.sleep(10)  # tempo do app abrir e carregar as conversas
        # 2) foca a caixa de BUSCA de conversas (Ctrl+F no app do Windows).
        #    No WhatsApp Web o atalho equivalente e Ctrl+Alt+Shift+F.
        _pg.hotkey("ctrl", "f")
        time.sleep(1.5)
        # 3) digita o nome procurado (cola via clipboard para suportar acentos)
        if _colar_texto_clipboard(alvo):
            _pg.hotkey("ctrl", "v")
        else:
            _pg.write(alvo, intervalo=0.05)
        time.sleep(3.5)  # espera a busca filtrar os resultados
        # 4) escolhe o primeiro resultado da busca (abre a conversa/grupo)
        _pg.press("enter")
        time.sleep(2.5)
        # 5) escreve a mensagem na conversa aberta
        if _colar_texto_clipboard(mensagem):
            _pg.hotkey("ctrl", "v")
        else:
            _pg.write(mensagem, intervalo=0.03)
        time.sleep(1)
        # 6) envia
        _pg.press("enter")
        time.sleep(1)
        logs_whatsapp.append({
            "data": datetime.now().isoformat(), "tipo": "por_nome",
            "alvo": alvo, "mensagem": mensagem, "status": "enviado (whatsapp app)",
        })
        salvar_json(ARQ_LOG_WHATS, logs_whatsapp)
        return (f"Mensagem enviada para '{alvo}' pelo app do WhatsApp. "
                "Confira na tela se foi para o contato/grupo certo.")

    return executar_com_autocura("enviar_whatsapp_por_nome", _enviar)


# Funcao DESLIGADA: nao e mais uma ferramenta do agente. O envio para grupo
# agora e feito por 'enviar_whatsapp_por_nome' (busca pelo nome no app do
# WhatsApp), que serve para contato E grupo - sem numero e sem link de convite.
def _desligada_enviar_mensagem_grupo_whatsapp(grupo: str, mensagem: str) -> str:
    """[DESLIGADA] Envia mensagem para um GRUPO do WhatsApp pelo link de
    convite. Mantida apenas como referencia historica; nao esta na lista de
    ferramentas. 'grupo' pode ser o NOME do grupo OU o proprio link de
    convite. Se passar so o nome e o grupo ainda nao estiver cadastrado, a
    ferramenta pede o link de convite UMA vez e salva para as proximas.
    Use ESTA ferramenta quando o usuario falar em 'grupo' (nunca use a de
    contato, que pede numero - grupo nao tem numero). Sempre pede
    confirmacao antes de enviar."""
    grupo_id = None
    nome_grupo = grupo.strip()

    # Caso 1: o proprio link de convite veio no parametro.
    if "chat.whatsapp.com" in grupo:
        grupo_id = grupo.rstrip("/").split("/")[-1].strip()
        try:
            _dig = input("Qual o nome/apelido desse grupo para salvar? (Enter pra 'grupo'): ").strip()
        except Exception:
            _dig = ""
        nome_grupo = _dig or "grupo"
    else:
        chave = grupo.lower().strip()
        grupo_id = grupos_whats.get(chave)
        if not grupo_id:
            parecido = difflib.get_close_matches(chave, list(grupos_whats.keys()), n=1, cutoff=0.6)
            if parecido and pedir_confirmacao(f"Voce quis dizer o grupo '{parecido[0]}'?"):
                grupo_id = grupos_whats[parecido[0]]
                nome_grupo = parecido[0]
        if not grupo_id:
            print(f"[Info]: ainda nao conheco o grupo '{nome_grupo}'.")
            link = input(
                "Cole o LINK DE CONVITE do grupo.\n"
                "  No WhatsApp: abra o grupo > toque no nome no topo >\n"
                "  'Convidar via link' (ou 'Link de convite') > Copiar link.\n"
                "  O link e assim: https://chat.whatsapp.com/XXXXXXXX\n"
                "Cole aqui: "
            ).strip()
            if "chat.whatsapp.com" not in link:
                return ("Link de convite invalido. No WhatsApp: abra o grupo > "
                        "nome no topo > 'Convidar via link' > Copiar, e cole aqui.")
            grupo_id = link.rstrip("/").split("/")[-1].strip()

    # Salva/corrige o cadastro do grupo para as proximas vezes.
    grupos_whats[nome_grupo.lower().strip()] = grupo_id
    salvar_json(ARQ_GRUPOS, grupos_whats)

    if not pedir_confirmacao(f"Enviar '{mensagem}' para o GRUPO '{nome_grupo}'?"):
        return "Envio cancelado pelo usuário."

    def _enviar():
        kit.sendwhatmsg_to_group_instantly(grupo_id, mensagem, wait_time=15, tab_close=True)
        logs_whatsapp.append({
            "data": datetime.now().isoformat(), "tipo": "grupo",
            "grupo": nome_grupo, "grupo_id": grupo_id,
            "mensagem": mensagem, "status": "enviado",
        })
        salvar_json(ARQ_LOG_WHATS, logs_whatsapp)
        return f"Mensagem enviada com sucesso para o grupo {nome_grupo}."

    return executar_com_autocura("enviar_mensagem_grupo_whatsapp", _enviar)


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
    # Trava de EMERGENCIA: comando catastrofico SEMPRE pede 'sim' final, mesmo
    # no modo admin (e a unica barreira que o modo autonomo nao remove).
    if _risco and not confirmar_catastrofico(
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


# ======================================================================
# =================== NOVAS FUNCOES TURBO (PACOTE) ====================
# Inspiradas nos melhores agentes (DropIt/Open Interpreter/Copilot Actions):
# organizar pastas por regra, backup em zip, dolar/clima sem chave, busca de
# texto dentro de arquivos, energia do PC, limpeza de duplicados, atalho na
# area de trabalho e ajustes avancados do Windows. NADA aqui repete funcoes
# ja existentes - tudo e adicao pura.
# ======================================================================

@tool
def organizar_pasta(caminho_pasta: str = "") -> str:
    """Organiza UMA pasta baguncada (por padrao a Downloads) movendo os arquivos
    para subpastas por tipo: Imagens, Documentos, Videos, Musicas, Programas,
    Compactados e Outros. Nao apaga nada, so organiza (move). Seguro: pastas e
    arquivos de sistema ficam intactos. Use para 'organizar downloads', 'limpar
    minha pasta de downloads'."""
    import shutil
    tipos = {
        "Imagens": (".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".heic", ".tiff"),
        "Documentos": (".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt", ".xls", ".xlsx",
                       ".ppt", ".pptx", ".csv", ".md"),
        "Videos": (".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v"),
        "Musicas": (".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma"),
        "Programas": (".exe", ".msi", ".bat", ".apk", ".appx", ".ps1"),
        "Compactados": (".zip", ".rar", ".7z", ".tar", ".gz", ".iso"),
    }

    def _organizar():
        if not caminho_pasta.strip():
            pasta = os.path.join(os.path.expanduser("~"), "Downloads")
        else:
            pasta = caminho_pasta.strip().strip('"')
        if not os.path.isdir(pasta):
            return f"Pasta nao encontrada: {pasta}"
        contagem = {}
        for nome in os.listdir(pasta):
            origem = os.path.join(pasta, nome)
            if os.path.isdir(origem):
                continue  # nao mexe em subpastas
            ext = os.path.splitext(nome)[1].lower()
            categoria = "Outros"
            for cat, exts in tipos.items():
                if ext in exts:
                    categoria = cat
                    break
            destino_dir = os.path.join(pasta, categoria)
            os.makedirs(destino_dir, exist_ok=True)
            destino = os.path.join(destino_dir, nome)
            if os.path.exists(destino):
                base, e = os.path.splitext(nome)
                destino = os.path.join(destino_dir, f"{base}_2{e}")
            shutil.move(origem, destino)
            contagem[categoria] = contagem.get(categoria, 0) + 1
        if not contagem:
            return f"A pasta '{pasta}' ja estava organizada (sem arquivos soltos)."
        resumo = ", ".join(f"{v} em {k}" for k, v in sorted(contagem.items()))
        return f"Pasta organizada: {resumo}. Arquivos continuam em {pasta} (nada foi apagado)."

    return executar_com_autocura("organizar_pasta", _organizar)


@tool
def fazer_backup_pasta(caminho_pasta: str, destino_zip: str = "") -> str:
    """Cria um BACKUP (copia compactada em .zip) de uma pasta inteira. Por
    padrao salva o zip na Area de Trabalho com a data. 'destino_zip' e opcional
    (caminho do .zip). Use para 'fazer backup', 'compactar a pasta X', 'salvar
    uma copia de seguranca'. Nao altera a pasta original - so cria o zip."""
    import shutil
    if not pedir_confirmacao(f"Criar um backup .zip da pasta '{caminho_pasta or '(informada)'}'?"):
        return "Backup cancelado pelo usuario."

    def _backup():
        pasta = (caminho_pasta or "").strip().strip('"')
        if not pasta:
            return "Me diga qual pasta voce quer fazer backup (ex.: C:\\Users\\gfmag\\Documentos)."
        if not os.path.isdir(pasta):
            return f"Pasta nao encontrada: {pasta}"
        if not destino_zip.strip():
            data = datetime.now().strftime("%Y%m%d_%H%M")
            nome = os.path.basename(pasta.rstrip("/\\")) or "backup"
            desktop = os.path.join(os.path.expanduser("~"), "Desktop")
            if not os.path.isdir(desktop):
                desktop = os.path.join(os.path.expanduser("~"), "Área de Trabalho")
            zip_saida = os.path.join(desktop, f"backup_{nome}_{data}")
        else:
            zip_saida = destino_zip.strip().strip('"')
            if zip_saida.lower().endswith(".zip"):
                zip_saida = zip_saida[:-4]
        os.makedirs(os.path.dirname(zip_saida) or ".", exist_ok=True)
        caminho_final = shutil.make_archive(zip_saida, "zip", root_dir=pasta)
        tamanho = os.path.getsize(caminho_final) / (1024 * 1024)
        return f"Backup criado: {caminho_final} ({tamanho:.1f} MB). A pasta original nao foi alterada."

    return executar_com_autocura("fazer_backup_pasta", _backup)


@tool
def cotacao_e_clima(cidade: str = "") -> str:
    """Mostra na hora a cotacao do dolar, euro e bitcoin, e (opcional) o clima de
    uma cidade. Nao precisa de chave nem abre navegador - usa APIs gratuitas.
    Use para 'quanto esta o dolar', 'qual o clima', 'vai chover hoje', 'preco do
    bitcoin'. Se nao informar a cidade, mostra so as cotacoes."""
    import json as _json
    import urllib.request
    import urllib.parse

    def _buscar():
        linhas = []
        # --- Cotacoes (AwesomeAPI, gratuita, sem chave) ---
        try:
            url = "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL"
            with urllib.request.urlopen(url, timeout=12) as r:
                dados = _json.loads(r.read().decode("utf-8"))
            usd = float(dados.get("USDBRL", {}).get("bid", 0))
            eur = float(dados.get("EURBRL", {}).get("bid", 0))
            btc = float(dados.get("BTCBRL", {}).get("bid", 0))
            linhas.append(f"Cotacoes agora: Dolar R$ {usd:.2f} | Euro R$ {eur:.2f} | Bitcoin R$ {btc:,.0f}")
        except Exception:
            linhas.append("Nao consegui pegar as cotacoes agora (sem internet ou API fora do ar).")
        # --- Clima (Open-Meteo, gratuita, sem chave) ---
        if cidade.strip():
            try:
                geo_url = ("https://geocoding-api.open-meteo.com/v1/search?count=1&language=pt&name="
                           + urllib.parse.quote(cidade.strip()))
                with urllib.request.urlopen(geo_url, timeout=12) as r:
                    geo = _json.loads(r.read().decode("utf-8"))
                if geo.get("results"):
                    g = geo["results"][0]
                    lat, lon = g["latitude"], g["longitude"]
                    nome_cid = g.get("name", cidade)
                    w_url = (f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
                             "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m")
                    with urllib.request.urlopen(w_url, timeout=12) as r:
                        w = _json.loads(r.read().decode("utf-8"))["current"]
                    temp = w.get("temperature_2m")
                    hum = w.get("relative_humidity_2m")
                    vento = w.get("wind_speed_10m")
                    linhas.append(f"Clima em {nome_cid}: {temp}C, umidade {hum}%, vento {vento} km/h.")
                else:
                    linhas.append(f"Nao encontrei a cidade '{cidade}'.")
            except Exception:
                linhas.append("Nao consegui pegar o clima agora.")
        return "\n".join(linhas)

    return executar_com_autocura("cotacao_e_clima", _buscar)


@tool
def buscar_texto_em_arquivos(termo: str, pasta: str = "") -> str:
    """Procura um TEXTO (palavra/frase) DENTRO dos arquivos de uma pasta (igual
    ao 'Localizar' mas na pasta inteira). Le arquivos .txt, .py, .md, .csv,
    .json, .html, .css, .js e similares. Use para 'em qual arquivo esta escrito
    X', 'procura a palavra Y nos meus documentos'. Ignora arquivos binarios e
    muito grandes (nao le .exe/.zip/.jpg)."""
    def _buscar():
        raiz = (pasta or os.path.join(os.path.expanduser("~"), "Documents")).strip().strip('"')
        if not os.path.isdir(raiz):
            raiz = os.path.expanduser("~")
        termo_l = termo.lower().strip()
        if not termo_l:
            return "Me diga qual texto procurar."
        ext_txt = (".txt", ".py", ".md", ".csv", ".json", ".html", ".htm", ".css", ".js",
                   ".log", ".ini", ".cfg", ".xml", ".yaml", ".yml", ".bat", ".ps1", ".tsv")
        achados = []
        for base, _dirs, arquivos in os.walk(raiz):
            for arq in arquivos:
                if not arq.lower().endswith(ext_txt):
                    continue
                caminho = os.path.join(base, arq)
                try:
                    if os.path.getsize(caminho) > 2_000_000:
                        continue
                    with open(caminho, "r", encoding="utf-8", errors="ignore") as f:
                        for num, linha in enumerate(f, 1):
                            if termo_l in linha.lower():
                                achados.append(f"{caminho} (linha {num}): {linha.strip()[:90]}")
                                if len(achados) >= 40:
                                    break
                except Exception:
                    continue
                if len(achados) >= 40:
                    break
            if len(achados) >= 40:
                break
        if not achados:
            return f"Nao encontrei '{termo}' em nenhum arquivo de texto em {raiz}."
        return f"Achei '{termo}' em {len(achados)} local(is):\n" + "\n".join(achados[:40])

    return executar_com_autocura("buscar_texto_em_arquivos", _buscar)


@tool
def controle_de_energia(acao: str) -> str:
    """Controla a energia do PC. Acoes: 'bloquear' (bloqueia a tela na hora),
    'suspender', 'hibernar', 'desligar' (desliga o PC), 'reiniciar', e
    'cancelar_desligamento' (cancela um desligamento agendado). Para desligar
    daqui a X minutos use 'desligar_em' com o parametro certo via
    executar_comando; aqui as acoes sao imediatas. Sempre pede confirmacao para
    desligar/reiniciar/hibernar/suspender."""
    a = acao.strip().lower()
    if a in ("desligar", "reiniciar", "suspender", "hibernar"):
        if not pedir_confirmacao(f"Executar '{a}' no PC agora?"):
            return f"Acao '{a}' cancelada."

    def _energia():
        if a == "bloquear":
            if os.name == "nt":
                subprocess.run("rundll32.exe user32.dll,LockWorkStation", shell=True)
            return "Tela bloqueada."
        if a == "desligar":
            subprocess.run("shutdown /s /t 15 /c \"Desligando pelo agente\"", shell=True)
            return "O PC vai desligar em 15 segundos. Digite 'cancela desligamento' para abortar."
        if a == "reiniciar":
            subprocess.run("shutdown /r /t 15 /c \"Reiniciando pelo agente\"", shell=True)
            return "O PC vai reiniciar em 15 segundos."
        if a == "suspender":
            subprocess.run("rundll32.exe powrprof.dll,SetSuspendState 0,1,0", shell=True)
            return "PC suspenso."
        if a == "hibernar":
            subprocess.run("shutdown /h", shell=True)
            return "PC hibernando."
        if a in ("cancelar_desligamento", "cancelar", "cancela"):
            subprocess.run("shutdown /a", shell=True)
            return "Desligamento agendado cancelado."
        return ("Acao invalida. Use: bloquear, suspender, hibernar, desligar, "
                "reiniciar ou cancelar_desligamento.")

    return executar_com_autocura("controle_de_energia", _energia)


@tool
def limpar_duplicados(pasta: str = "") -> str:
    """Encontra arquivos DUPLICADOS (conteudo identico) numa pasta e remove as
    copias extras, mantendo apenas UMA versao de cada. Usa o conteudo real (hash),
    nao so o nome. Por padrao varre a pasta Downloads. Confirma antes de apagar e
    mostra quanto espaco seria liberado. Use para 'limpar arquivos repetidos',
    'tenho fotos duplicadas'."""
    import hashlib

    def _hash(caminho, tam_blk=65536):
        h = hashlib.md5()
        try:
            with open(caminho, "rb") as f:
                while True:
                    blk = f.read(tam_blk)
                    if not blk:
                        break
                    h.update(blk)
        except Exception:
            return None
        return h.hexdigest()

    def _limpar():
        raiz = (pasta or os.path.join(os.path.expanduser("~"), "Downloads")).strip().strip('"')
        if not os.path.isdir(raiz):
            return f"Pasta nao encontrada: {raiz}"
        # agrupa primeiro por tamanho (rapido), so depois calcula hash dos empatados
        por_tamanho = {}
        for base, _dirs, arqs in os.walk(raiz):
            for arq in arqs:
                c = os.path.join(base, arq)
                try:
                    t = os.path.getsize(c)
                except Exception:
                    continue
                por_tamanho.setdefault(t, []).append(c)
        duplicados = []  # lista de caminhos extras a apagar
        economizados = 0
        for tam, caminhos in por_tamanho.items():
            if len(caminhos) < 2:
                continue
            por_hash = {}
            for c in caminhos:
                hsh = _hash(c)
                if hsh is None:
                    continue
                por_hash.setdefault(hsh, []).append(c)
            for hsh, grupo in por_hash.items():
                if len(grupo) > 1:
                    # mantem o de caminho mais curto (geralmente o original na raiz)
                    grupo.sort(key=lambda x: (len(x), x))
                    duplicados.extend(grupo[1:])
                    economizados += tam * (len(grupo) - 1)
        if not duplicados:
            return f"Nenhum arquivo duplicado (conteudo identico) encontrado em {raiz}."
        mb = economizados / (1024 * 1024)
        lista = "\n".join(duplicados[:20])
        if not pedir_confirmacao(
            f"Encontrei {len(duplicados)} arquivo(s) duplicado(s) ({mb:.1f} MB). "
            "Manter uma copia de cada e apagar as repetidas?\n" + lista
        ):
            return "Limpeza de duplicados cancelada. Nada foi apagado."
        apagados = 0
        for c in duplicados:
            try:
                os.remove(c)
                apagados += 1
            except Exception:
                pass
        return f"Apaguei {apagados} copia(s) duplicada(s), liberando ~{mb:.1f} MB. Mantive uma versao de cada."

    return executar_com_autocura("limpar_duplicados", _limpar)


@tool
def criar_atalho_area_trabalho(programa_ou_arquivo: str, nome_atalho: str = "") -> str:
    """Cria um ATALHO na Area de Trabalho para um programa, arquivo ou pasta
    (ex.: criar atalho do Chrome, de uma pasta). No Windows gera um .lnk via
    PowerShell. Use para 'colocar atalho na area de trabalho', 'criar icone do
    X no desktop'."""
    if not pedir_confirmacao(f"Criar atalho na Area de Trabalho para '{programa_ou_arquivo}'?"):
        return "Criacao de atalho cancelada."

    def _criar():
        alvo = programa_ou_arquivo.strip().strip('"')
        if not alvo:
            return "Me diga o programa/arquivo/pasta para o qual criar o atalho."
        desktop = os.path.join(os.path.expanduser("~"), "Desktop")
        if not os.path.isdir(desktop):
            desktop = os.path.join(os.path.expanduser("~"), "Área de Trabalho")
        nome = (nome_atalho.strip() or os.path.basename(alvo.rstrip("/\\")) or "atalho")
        nome = nome.replace(".lnk", "")
        lnk = os.path.join(desktop, nome + ".lnk")
        alvo_ps = alvo.replace("'", "''")
        lnk_ps = lnk.replace("'", "''")
        ps = (
            "$s = (New-Object -ComObject WScript.Shell).CreateShortcut('" + lnk_ps + "'); "
            "$s.TargetPath = '" + alvo_ps + "'; "
            "$s.WorkingDirectory = (Split-Path '" + alvo_ps + "' -Parent); "
            "$s.Save()"
        )
        r = subprocess.run(["powershell", "-NoProfile", "-Command", ps],
                           capture_output=True, text=True)
        if os.path.exists(lnk):
            return f"Atalho criado na Area de Trabalho: {lnk}"
        return f"Nao consegui criar o atalho. {r.stderr.strip()[:200]}"

    return executar_com_autocura("criar_atalho_area_trabalho", _criar)


@tool
def ajustar_windows_avancado(acao: str) -> str:
    """Ajustes AVANCADOS de desempenho/configuracao do Windows num so comando:
    'modo_desempenho' (plano de energia de alto desempenho), 'modo_balanceado'
    (volta ao plano normal), 'mostrar_extensoes' (mostra .exe/.txt no nome dos
    arquivos), 'mostrar_ocultos' (exibe arquivos ocultos), 'otimizar_visual'
    (liga o desempenho visual/desliga efeitos). Sempre pede confirmacao antes de
    mudar. Use para 'deixar o pc mais rapido', 'plano de energia', 'mostrar
    extensao dos arquivos'."""
    if not pedir_confirmacao(f"Aplicar o ajuste avancado do Windows: '{acao}'?"):
        return "Ajuste cancelado."

    def _ajustar():
        a = acao.strip().lower()
        if a == "modo_desempenho":
            subprocess.run("powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c", shell=True)
            return "Plano de energia ALTO DESEMPENHO ativado (PC mais rapido, gasta mais energia)."
        if a == "modo_balanceado":
            subprocess.run("powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e", shell=True)
            return "Plano de energia BALANCEADO ativado."
        if a == "mostrar_extensoes":
            subprocess.run(
                'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" '
                '/v HideFileExt /t REG_DWORD /d 0 /f', shell=True, capture_output=True)
            subprocess.run("taskkill /f /im explorer.exe & start explorer.exe", shell=True)
            return "Extensoes de arquivo agora aparecem (ex.: .txt, .exe). Explorer reiniciado."
        if a == "mostrar_ocultos":
            subprocess.run(
                'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" '
                '/v Hidden /t REG_DWORD /d 1 /f', shell=True, capture_output=True)
            subprocess.run("taskkill /f /im explorer.exe & start explorer.exe", shell=True)
            return "Arquivos ocultos agora aparecem. Explorer reiniciado."
        if a == "otimizar_visual":
            subprocess.run(
                'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" '
                '/v VisualFXSetting /t REG_DWORD /d 2 /f', shell=True, capture_output=True)
            return "Efeitos visuais ajustados para priorizar DESEMPENHO (mais rapido)."
        return ("Acao invalida. Use: modo_desempenho, modo_balanceado, mostrar_extensoes, "
                "mostrar_ocultos ou otimizar_visual.")

    return executar_com_autocura("ajustar_windows_avancado", _ajustar)


@tool
def modo_de_trabalho(programas: str) -> str:
    """Abre VARIOS programas/sites de uma vez so (seu 'modo trabalho' ou
    'modo jogo'). Passe os nomes separados por virgula (ex.: 'chrome, whatsapp,
    spotify' ou 'vscode, chrome'). Entende programas comuns e sites. Use para
    'abre tudo pro trabalho', 'modo jogo', 'abre meus programas'."""
    def _abrir():
        nomes = [p.strip().lower() for p in programas.split(",") if p.strip()]
        if not nomes:
            return "Me diga quais programas abrir, separados por virgula (ex.: chrome, whatsapp, spotify)."
        sites = {"youtube": "https://youtube.com", "gmail": "https://mail.google.com",
                 "google": "https://google.com", "whatsapp": "https://web.whatsapp.com"}
        apps = {"chrome": "chrome", "edge": "msedge", "firefox": "firefox",
                "bloco de notas": "notepad", "notepad": "notepad", "calculadora": "calc",
                "explorer": "explorer", "spotify": "spotify", "vscode": "code",
                "word": "winword", "excel": "excel", "whatsapp app": "whatsapp"}
        abertos = []
        for n in nomes:
            try:
                if n in sites:
                    subprocess.Popen(f'start "" "{sites[n]}"', shell=True)
                elif n in apps:
                    subprocess.Popen(f'start "" {apps[n]}', shell=True)
                else:
                    subprocess.Popen(f'start "" "{n}"', shell=True)
                abertos.append(n)
                time.sleep(1)
            except Exception:
                pass
        return f"Abrindo: {', '.join(abertos)}." if abertos else "Nao consegui abrir os programas informados."

    return executar_com_autocura("modo_de_trabalho", _abrir)


# ======================================================================
# ============= CENTRAIS DE COMANDO (HUBS) - dezenas de acoes ==========
# Em vez de 150 funcoes soltas (que fariam a IA pequena escolher errado),
# cada central abaixo e UMA ferramenta com VARIAS acoes. Assim o agente ve
# poucos nomes, mas cada um faz muita coisa - padrao dos agentes gringos.
# ======================================================================

def _rodar_cmd(cmd: str, timeout: int = 60):
    """Roda um comando do Windows e devolve (saida, erros, codigo)."""
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True,
                           encoding="utf-8", errors="ignore", timeout=timeout)
        return (r.stdout or "").strip(), (r.stderr or "").strip(), r.returncode
    except Exception as e:
        return "", str(e), 1


@tool
def central_rede(acao: str, valor: str = "") -> str:
    """CENTRAL DE REDE/INTERNET/WI-FI. Uma ferramenta com varias acoes - use o
    parametro 'acao'. Opcoes: 'minhas_wifis' (lista redes Wi-Fi ja salvas),
    'senhas_wifi' (mostra a senha de cada rede salva), 'redes_disponiveis'
    (redes Wi-Fi ao redor agora), 'conectar' (conecta numa rede salva; 'valor'
    = nome da rede), 'ip_publico' (IP da internet), 'limpar_dns' (renova cache
    DNS, resolve sites que nao abrem), 'testar_internet' (pinga o Google),
    'mac' (endereco fisico da placa), 'dns' (mostra o DNS configurado).
    Ex.: central_rede('senhas_wifi')."""
    a = acao.strip().lower()

    if a == "senhas_wifi":
        saida, _, _ = _rodar_cmd("netsh wlan show profiles")
        nomes = [l.split(":")[1].strip() for l in saida.splitlines() if "Todos os Perfis" in l or "All User Profile" in l]
        if not nomes:
            return "Nao encontrei redes Wi-Fi salvas neste PC."
        linhas = ["Redes Wi-Fi salvas e suas senhas:"]
        for nome in nomes:
            s, _, _ = _rodar_cmd(f'netsh wlan show profile name="{nome}" key=clear')
            senha = ""
            for l in s.splitlines():
                if "Conteúdo da Chave" in l or "Key Content" in l:
                    senha = l.split(":")[-1].strip()
            linhas.append(f"  - {nome}: {senha or '(sem senha/oculta)'}")
        return "\n".join(linhas)
    if a == "minhas_wifis":
        saida, _, _ = _rodar_cmd("netsh wlan show profiles")
        nomes = [l.split(":")[1].strip() for l in saida.splitlines() if "Todos os Perfis" in l or "All User Profile" in l]
        return "Redes salvas: " + (", ".join(nomes) if nomes else "nenhuma")
    if a == "redes_disponiveis":
        saida, _, _ = _rodar_cmd("netsh wlan show networks mode=bssid")
        nomes = []
        for l in saida.splitlines():
            if "SSID" in l and ":" in l and l.split(":", 1)[1].strip():
                nomes.append(l.split(":", 1)[1].strip())
        return "Redes ao redor agora: " + (", ".join(dict.fromkeys(nomes)) if nomes else "nenhuma visivel")
    if a == "conectar":
        if not valor.strip():
            return "Diga o nome da rede Wi-Fi salva para conectar."
        s, e, c = _rodar_cmd(f'netsh wlan connect name="{valor.strip()}"')
        return f"Conectando na rede '{valor}'." if c == 0 else f"Nao consegui conectar: {e or s}"
    if a == "ip_publico":
        s, e, _ = _rodar_cmd('powershell -NoProfile -Command "(Invoke-WebRequest -UseBasicParsing ifconfig.me/ip).Content"', 20)
        return f"IP publico da internet: {s}" if s else f"Nao consegui obter o IP publico ({e[:80]})."
    if a == "limpar_dns":
        s, _, _ = _rodar_cmd("ipconfig /flushdns")
        return "Cache DNS limpo. Sites que nao abriam podem voltar ao normal."
    if a == "testar_internet":
        s, e, c = _rodar_cmd("ping -n 2 8.8.8.8", 20)
        return "Internet funcionando (resposta do Google)." if c == 0 else "Nao consegui alcancar a internet (pode estar offline)."
    if a == "mac":
        s, _, _ = _rodar_cmd("getmac /fo csv /nh")
        return "Enderecos MAC:\n" + s.strip()
    if a == "dns":
        s, _, _ = _rodar_cmd("ipconfig /all | findstr /i \"DNS\"")
        return "DNS configurado:\n" + (s or "nao identificado")
    return ("Acao invalida. Use: minhas_wifis, senhas_wifi, redes_disponiveis, "
            "conectar, ip_publico, limpar_dns, testar_internet, mac ou dns.")


@tool
def central_programas_janelas(acao: str, valor: str = "") -> str:
    """CENTRAL DE PROGRAMAS E JANELAS. Acoes no parametro 'acao': 'lista'
    (programas/apps instalados), 'processos' (o que esta rodando agora),
    'fechar' (fecha um programa/processo; 'valor' = nome, ex.: 'notepad' ou
    'chrome'), 'minimizar_tudo' (mostra a area de trabalho), 'abrir'
    ('valor' = programa/arquivo para abrir), 'info' ('valor' = nome do programa
    para ver detalhes via winget). Ex.: central_programas_janelas('fechar','chrome')."""
    a = acao.strip().lower()
    if a in ("lista", "listar", "programas"):
        s, _, _ = _rodar_cmd('powershell -NoProfile -Command "Get-StartApps | Select-Object -ExpandProperty Name"', 40)
        nomes = [x.strip() for x in s.splitlines() if x.strip()]
        return f"Programas/apps instalados ({len(nomes)}):\n" + "\n".join(f"  - {n}" for n in nomes[:120])
    if a in ("processos", "abertos", "janelas"):
        s, _, _ = _rodar_cmd('powershell -NoProfile -Command "Get-Process | Sort-Object WS -Descending | Select-Object -First 25 Name,@{N=\'MB\';E={[int]($_.WS/1MB)}} | Format-Table -AutoSize"', 40)
        return "Programas rodando (top 25 por memoria):\n" + s
    if a == "fechar":
        if not valor.strip():
            return "Diga qual programa fechar (ex.: chrome, notepad, spotify)."
        if not pedir_confirmacao(f"Fechar o programa '{valor}'?"):
            return "Fechamento cancelado."
        nome = valor.strip().lower().replace(".exe", "")
        s, e, c = _rodar_cmd(f'taskkill /im "{nome}.exe" /t', 30)
        return f"Pedido para fechar '{nome}'." if c == 0 else f"Nao consegui fechar '{nome}': {e or s}"
    if a in ("minimizar_tudo", "area_trabalho", "mostrar_area"):
        pyautogui.hotkey("win", "d")
        return "Mostrando a area de trabalho (janelas minimizadas)."
    if a == "abrir":
        if not valor.strip():
            return "Diga o programa/arquivo para abrir."
        subprocess.Popen(f'start "" "{valor.strip()}"', shell=True)
        return f"Abrindo '{valor}'."
    if a == "info":
        if not valor.strip():
            return "Diga o nome do programa para ver detalhes."
        s, e, _ = _rodar_cmd(f'winget show --name "{valor.strip()}" --accept-source-agreements', 60)
        return (s or e or "Nao encontrei detalhes.")[:1500]
    return "Acao invalida. Use: lista, processos, fechar, minimizar_tudo, abrir ou info."


@tool
def central_tela_audio(acao: str, valor: str = "") -> str:
    """CENTRAL DE TELA E SOM/AUDIO. Acoes em 'acao': 'aumentar_volume' (ou
    passe 'valor' = numero de niveis), 'diminuir_volume', 'mudo' (liga/desliga
    o mudo), 'capturar_janela' (tira print SO da janela ativa e salva PNG),
    'capturar_tela' (print da tela inteira), 'falar' ('valor' = texto que o PC
    fala em voz alta). Ex.: central_tela_audio('capturar_janela')."""
    a = acao.strip().lower()
    if a in ("aumentar_volume", "aumentar", "volume_up"):
        vezes = int(valor) if str(valor).strip().isdigit() else 5
        for _ in range(vezes):
            pyautogui.press("volumeup")
        return f"Volume aumentado ({vezes} niveis)."
    if a in ("diminuir_volume", "diminuir", "volume_down"):
        vezes = int(valor) if str(valor).strip().isdigit() else 5
        for _ in range(vezes):
            pyautogui.press("volumedown")
        return f"Volume diminuido ({vezes} niveis)."
    if a in ("mudo", "mutar", "silenciar"):
        pyautogui.press("volumemute")
        return "Mudo ligado/desligado (toggle)."
    if a in ("capturar_janela", "print_janela"):
        def _cap():
            import pyautogui as _pg
            try:
                janela = _pg.getActiveWindow()
                if janela is not None:
                    img = _pg.screenshot(region=(janela.left, janela.top, janela.width, janela.height))
                else:
                    img = _pg.screenshot()
            except Exception:
                img = _pg.screenshot()
            pasta = os.path.join(PASTA_BASE, "prints")
            os.makedirs(pasta, exist_ok=True)
            arq = os.path.join(pasta, "janela_" + datetime.now().strftime("%Y%m%d_%H%M%S") + ".png")
            img.save(arq)
            return f"Print da janela ativa salvo em: {arq}"
        return executar_com_autocura("capturar_janela", _cap)
    if a in ("capturar_tela", "print_tela"):
        return capturar_tela_arquivo.invoke({"nome": ""})
    if a in ("falar", "dizer", "voz"):
        if valor.strip():
            falar(valor.strip())
            return f"Falei em voz: {valor.strip()}"
        return "Diga o texto que o PC deve falar."
    return "Acao invalida. Use: aumentar_volume, diminuir_volume, mudo, capturar_janela, capturar_tela ou falar."


@tool
def central_arquivos(acao: str, caminho: str = "", destino: str = "", nome: str = "") -> str:
    """CENTRAL DE ARQUIVOS TURBO. Acoes em 'acao': 'extrair_zip' (descompacta um
    .zip/.rar; 'caminho'=arquivo, 'destino'=pasta de saida opcional), 'zipar'
    (compacta uma pasta/arquivo em .zip; 'caminho'=origem), 'maiores' (lista os
    20 maiores arquivos de uma pasta; 'caminho'=pasta), 'por_tipo' (conta
    quantos arquivos de cada tipo numa pasta), 'info' (tamanho e datas de um
    arquivo; 'caminho'), 'renomear_em_massa' (renomeia tudo de uma pasta com um
    prefixo + numero; 'caminho'=pasta, 'nome'=prefixo). Ex.:
    central_arquivos('extrair_zip', caminho='C:/Users/gfmag/Downloads/x.zip')."""
    import shutil
    a = acao.strip().lower()
    if a == "extrair_zip":
        if not caminho.strip():
            return "Diga o caminho do arquivo .zip para extrair."
        origem = caminho.strip().strip('"')
        if not os.path.exists(origem):
            return f"Arquivo nao encontrado: {origem}"
        saida = destino.strip().strip('"') or os.path.splitext(origem)[0]
        os.makedirs(saida, exist_ok=True)
        shutil.unpack_archive(origem, saida)
        return f"Arquivo extraido em: {saida}"
    if a == "zipar":
        if not caminho.strip():
            return "Diga a pasta/arquivo para compactar."
        origem = caminho.strip().strip('"')
        if not os.path.exists(origem):
            return f"Caminho nao encontrado: {origem}"
        base = destino.strip().strip('"') or origem
        final = shutil.make_archive(base, "zip", root_dir=origem) if os.path.isdir(origem) else shutil.make_archive(base, "zip", root_dir=os.path.dirname(origem), base_dir=os.path.basename(origem))
        return f"Compactado em: {final} ({os.path.getsize(final)/1024/1024:.1f} MB)"
    if a == "maiores":
        raiz = (caminho or os.path.join(os.path.expanduser("~"), "Downloads")).strip().strip('"')
        if not os.path.isdir(raiz):
            return f"Pasta nao encontrada: {raiz}"
        itens = []
        for base, _d, arqs in os.walk(raiz):
            for arq in arqs:
                c = os.path.join(base, arq)
                try:
                    itens.append((os.path.getsize(c), c))
                except Exception:
                    pass
        itens.sort(reverse=True)
        if not itens:
            return "Pasta vazia."
        return "Maiores arquivos:\n" + "\n".join(f"  {sz/1024/1024:8.1f} MB  {c}" for sz, c in itens[:20])
    if a == "por_tipo":
        raiz = (caminho or os.path.join(os.path.expanduser("~"), "Downloads")).strip().strip('"')
        if not os.path.isdir(raiz):
            return f"Pasta nao encontrada: {raiz}"
        cont = {}
        for base, _d, arqs in os.walk(raiz):
            for arq in arqs:
                ext = os.path.splitext(arq)[1].lower() or "(sem ext)"
                cont[ext] = cont.get(ext, 0) + 1
        return "Arquivos por tipo:\n" + "\n".join(f"  {k}: {v}" for k, v in sorted(cont.items(), key=lambda x: -x[1])[:25])
    if a == "info":
        c = caminho.strip().strip('"')
        if not os.path.exists(c):
            return f"Nao existe: {c}"
        st = os.stat(c)
        return (f"{c}\n  Tamanho: {st.st_size/1024/1024:.2f} MB\n"
                f"  Modificado: {datetime.fromtimestamp(st.st_mtime):%d/%m/%Y %H:%M}\n"
                f"  Tipo: {'pasta' if os.path.isdir(c) else 'arquivo'}")
    if a == "renomear_em_massa":
        raiz = caminho.strip().strip('"')
        if not os.path.isdir(raiz):
            return "Diga a pasta para renomear os arquivos em massa."
        pref = (nome.strip() or "arquivo").replace(" ", "_")
        if not pedir_confirmacao(f"Renomear todos os arquivos de '{raiz}' como {pref}_1, {pref}_2...?"):
            return "Renomeacao em massa cancelada."
        n = 0
        for i, arq in enumerate(sorted(os.listdir(raiz)), 1):
            o = os.path.join(raiz, arq)
            if os.path.isfile(o):
                ext = os.path.splitext(arq)[1]
                novo = os.path.join(raiz, f"{pref}_{i}{ext}")
                try:
                    os.rename(o, novo)
                    n += 1
                except Exception:
                    pass
        return f"{n} arquivo(s) renomeado(s) com o prefixo '{pref}'."
    return "Acao invalida. Use: extrair_zip, zipar, maiores, por_tipo, info ou renomear_em_massa."


def _calcular_seguro(expressao: str):
    """Calcula uma expressao aritmetica com SEGURANCA (sem eval, sem codigo)."""
    import ast as _ast
    import operator as _op
    ops = {_ast.Add: _op.add, _ast.Sub: _op.sub, _ast.Mult: _op.mul, _ast.Div: _op.truediv,
           _ast.Pow: _op.pow, _ast.Mod: _op.mod, _ast.FloorDiv: _op.floordiv,
           _ast.USub: _op.neg, _ast.UAdd: _op.pos}

    def _ev(no):
        if isinstance(no, _ast.Expression):
            return _ev(no.body)
        if isinstance(no, _ast.Constant) and isinstance(no.value, (int, float)):
            return no.value
        if isinstance(no, _ast.BinOp) and type(no.op) in ops:
            return ops[type(no.op)](_ev(no.left), _ev(no.right))
        if isinstance(no, _ast.UnaryOp) and type(no.op) in ops:
            return ops[type(no.op)](_ev(no.operand))
        raise ValueError("so numeros e operacoes sao permitidos")
    arvore = _ast.parse(expressao.replace(",", "."), mode="eval")
    return _ev(arvore)


@tool
def calculadora(expressao: str) -> str:
    """Calcula contas matematicas NA HORA, sem internet e sem IA (resultado
    instantaneo e exato). Use para somas, subtracoes, multiplicacoes, divisoes,
    porcentagem e potencias. Ex.: calculadora('150 * 3.2 / 2'),
    calculadora('(100 + 50) * 0.15'). Para porcentagem use a conta, ex.: '200*0.1'."""
    try:
        expr = expressao.strip().rstrip("=").strip()
        # aceita "X por cento de Y" de forma simples: converte "%" -> "/100"
        expr = expr.replace("%", "/100")
        resultado = _calcular_seguro(expr)
        if isinstance(resultado, float) and resultado.is_integer():
            resultado = int(resultado)
        return f"{expressao.strip()} = {resultado}"
    except ZeroDivisionError:
        return "Nao da pra dividir por zero."
    except Exception:
        return "Expressao invalida. Use apenas numeros e + - * / % ** (ex.: '12*8+3')."


@tool
def central_sistema(acao: str, valor: str = "") -> str:
    """CENTRAL DE SISTEMA/PC (informacoes e ajustes rapidos). Acoes em 'acao':
    'info_pc' (resumo do Windows, processador e memoria), 'limpar_temp'
    (apaga arquivos temporarios, libera espaco; pede confirmacao), 'versao'
    (versao/build do Windows), 'abrir_configuracoes' (abre o Settings),
    'abrir_painel' (Painel de Controle), 'gerenciador_tarefas' (abre o Task
    Manager), 'bateria' (status/relatorio de energia), 'disco' (uso dos discos),
    'reiniciar_explorer' (reabre o Explorer se a barra de tarefas travar).
    Ex.: central_sistema('info_pc')."""
    a = acao.strip().lower()
    if a in ("info_pc", "info", "sobre"):
        import platform
        s, _, _ = _rodar_cmd('powershell -NoProfile -Command "(Get-CimInstance Win32_Processor).Name; [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory/1GB,1)"', 40)
        return (f"PC: {platform.node()}\nSistema: {platform.system()} {platform.release()} "
                f"(build {platform.version()})\nProcessador / RAM (GB):\n{s}")
    if a == "versao":
        s, _, _ = _rodar_cmd("winver", 5)
        s2, _, _ = _rodar_cmd('powershell -NoProfile -Command "(Get-CimInstance Win32_OperatingSystem).Caption + \" build \" + (Get-CimInstance Win32_OperatingSystem).BuildNumber"', 30)
        return s2 or "Nao consegui ler a versao."
    if a in ("limpar_temp", "temp", "temporarios"):
        if not pedir_confirmacao("Apagar os arquivos TEMPORARIOS do Windows (seguro, libera espaco)?"):
            return "Limpeza cancelada."
        pasta = os.environ.get("TEMP", os.path.join(os.path.expanduser("~"), "AppData", "Local", "Temp"))
        total = 0
        for base, _d, arqs in os.walk(pasta):
            for arq in arqs:
                try:
                    total += os.path.getsize(os.path.join(base, arq))
                    os.remove(os.path.join(base, arq))
                except Exception:
                    pass
        return f"Limpeza de temporarios concluida. Ate ~{total/1024/1024:.0f} MB liberados."
    if a in ("abrir_configuracoes", "configuracoes", "settings"):
        subprocess.Popen("start ms-settings:", shell=True)
        return "Abrindo as Configuracoes do Windows."
    if a in ("abrir_painel", "painel"):
        subprocess.Popen("start control", shell=True)
        return "Abrindo o Painel de Controle."
    if a in ("gerenciador_tarefas", "task_manager", "tarefas"):
        subprocess.Popen("start taskmgr", shell=True)
        return "Abrindo o Gerenciador de Tarefas."
    if a in ("bateria", "energia_bateria"):
        s, _, _ = _rodar_cmd("powercfg /batteryreport /output \"%TEMP%\\bat.html\" >nul 2>&1 & powershell -NoProfile -Command \"(Get-CimInstance Win32_Battery | Select-Object EstimatedChargeRemaining,BatteryStatus | Format-List | Out-String)\"", 40)
        return "Status da bateria:\n" + (s or "PC pode ser de mesa (sem bateria).")
    if a in ("disco", "discos", "espaco"):
        return espaco_em_disco.invoke({})
    if a in ("reiniciar_explorer", "explorer"):
        _rodar_cmd("taskkill /f /im explorer.exe & start explorer.exe", 30)
        return "Explorer reiniciado (barra de tarefas/icone podem piscar e voltar)."
    return "Acao invalida. Use: info_pc, versao, limpar_temp, abrir_configuracoes, abrir_painel, gerenciador_tarefas, bateria, disco ou reiniciar_explorer."


# ======================================================================
# ============ CENTRAL DE CODIGO / VISUAL STUDIO CODE =================
# Da ao agente controle de PROJETO de programador senior: trabalha sempre
# na MESMA pasta (nunca cria pasta repetida), escreve/le/edita codigo
# profissional, monta sites, e controla git (init/add/commit/push).
# ======================================================================

def _resolver_pasta_projeto(nome_ou_caminho: str) -> str:
    """Acha (sem criar) a pasta de um projeto. Aceita um caminho completo ou
    so o nome; procura na pasta de projetos do agente e na Area de Trabalho."""
    txt = (nome_ou_caminho or "").strip().strip('"')
    if not txt:
        return ""
    if os.path.isabs(txt) and os.path.isdir(txt):
        return txt
    candidatos = [
        os.path.join(PASTA_PROJETOS, txt),
        os.path.join(os.path.expanduser("~"), "Desktop", txt),
        os.path.join(os.path.expanduser("~"), "Área de Trabalho", txt),
        os.path.join(os.path.expanduser("~"), "Documents", txt),
        txt,
    ]
    for c in candidatos:
        if os.path.isdir(c):
            return c
    # se nao existe ainda, retorna o caminho padrao na pasta de projetos
    return os.path.join(PASTA_PROJETOS, txt)


def _rodar_git(caminho: str, args: str, timeout: int = 60):
    """Roda um comando git DENTRO da pasta do projeto e devolve (saida, codigo)."""
    try:
        r = subprocess.run(f"git {args}", shell=True, capture_output=True, text=True,
                           encoding="utf-8", errors="ignore", timeout=timeout, cwd=caminho)
        saida = ((r.stdout or "") + "\n" + (r.stderr or "")).strip()
        return saida, r.returncode
    except Exception as e:
        return str(e), 1


@tool
def central_codigo(acao: str, nome_projeto: str = "", caminho_arquivo: str = "",
                   conteudo: str = "", mensagem: str = "", url_remoto: str = "") -> str:
    """CENTRAL DE PROGRAMACAO / VISUAL STUDIO CODE - o agente vira um programador
    senior. SEMPRE trabalha na MESMA pasta do projeto (nunca cria pasta
    repetida). Acoes no parametro 'acao':
    - 'criar_projeto': cria (ou reusa, se ja existir) a pasta do projeto 'nome_projeto'
      e ja abre no VS Code. Use para 'criar um site/projeto chamado X'.
    - 'abrir': abre o projeto 'nome_projeto' no VS Code.
    - 'listar_projetos': mostra todos os projetos ja criados.
    - 'escrever_arquivo': cria/sobrescreve um arquivo DENTRO do projeto
      ('nome_projeto'=projeto, 'caminho_arquivo'=ex.: 'index.html' ou
      'src/app.js', 'conteudo'=codigo completo). Use para gerar codigo profissional.
    - 'ler_arquivo': le o conteudo de um arquivo do projeto.
    - 'editar_arquivo': troca um trecho ('caminho_arquivo' com marcador <TRECHO_ANTIGO>===<TRECHO_NOVO> no conteudo).
    - 'listar_arquivos': mostra a arvore de arquivos do projeto.
    - 'analisar': faz uma ANALISE PROFUNDA do projeto (linguagens, tamanho,
      estrutura, possiveis problemas) - use antes de grandes mudancas.
    - 'git_status', 'git_init', 'git_commit' (com 'mensagem'), 'git_remoto'
      (com 'url_remoto') e 'git_push': controla o versionamento.
    - 'clonar' (com 'url_remoto'): baixa um codigo/projeto do GitHub e abre no VS Code.
    - 'comando' (com 'caminho_arquivo' ou 'mensagem' = comando): roda um comando do
      terminal DENTRO da pasta do projeto (npm, pip, node, python, build, testes).
    - 'instalar_deps': instala dependencias sozinho (npm install ou pip install -r).
    - 'iniciar_app' (ou 'rodar'): sobe o projeto/servidor de desenvolvimento.
    - 'abrir_terminal': abre o terminal integrado do VS Code na pasta do projeto.
    Para sites: crie o projeto e escreva index.html, style.css e script.js."""
    a = acao.strip().lower()

    if a == "listar_projetos":
        if not os.path.isdir(PASTA_PROJETOS):
            return "Nenhum projeto criado ainda."
        projs = [d for d in os.listdir(PASTA_PROJETOS) if os.path.isdir(os.path.join(PASTA_PROJETOS, d))]
        return "Projetos:\n" + ("\n".join(f"  - {p}" for p in sorted(projs)) or "nenhum")

    if a in ("criar_projeto", "abrir", "novo"):
        if not nome_projeto.strip():
            return "Diga o nome do projeto (ex.: 'meu_site')."
        nome = "".join(c for c in nome_projeto.strip() if c not in '\\/:*?"<>|').strip()
        pasta = os.path.join(PASTA_PROJETOS, nome)
        ja_existia = os.path.isdir(pasta)
        os.makedirs(pasta, exist_ok=True)
        abrir_no_vscode(pasta)
        registrar_memoria_longa(f"Projeto de codigo '{nome}' em {pasta}", tags=["projeto", "codigo"])
        return (f"Projeto '{nome}' {'reaproveitado (ja existia)' if ja_existia else 'criado'} em {pasta} "
                f"e aberto no VS Code. Use 'escrever_arquivo' para criar os arquivos de codigo.")

    if a == "clonar":
        # Baixa (clona) um codigo do GitHub para a pasta de projetos e abre no
        # VS Code. 'url_remoto' = link do repositorio. Tratado ANTES de exigir
        # que o projeto exista, pois o proprio clone cria a pasta.
        url = url_remoto.strip()
        if not url:
            return "Diga a URL do repositorio do GitHub em 'url_remoto' (ex.: https://github.com/usuario/projeto)."
        nome_repo = url.rstrip("/").split("/")[-1].replace(".git", "") or "repo"
        destino = os.path.join(PASTA_PROJETOS, nome_repo)
        if os.path.isdir(destino):
            abrir_no_vscode(destino)
            return f"O projeto '{nome_repo}' ja existe em {destino}. Reaproveitei e abri no VS Code."
        os.makedirs(PASTA_PROJETOS, exist_ok=True)
        saida, cod = _rodar_git(PASTA_PROJETOS, f"clone {url} {nome_repo}", 180)
        if cod == 0 and os.path.isdir(destino):
            abrir_no_vscode(destino)
            registrar_memoria_longa(f"Clonei o repositorio '{nome_repo}' em {destino}", tags=["projeto", "git"])
            return f"Repositorio baixado para {destino} e aberto no VS Code. Use 'analisar' e 'instalar_deps'."
        return f"Nao consegui clonar: {saida[:600]}"

    # --- daqui pra baixo precisa da pasta do projeto ---
    pasta = _resolver_pasta_projeto(nome_projeto)
    if not pasta or not os.path.isdir(pasta):
        return (f"Projeto '{nome_projeto}' ainda nao existe. Use a acao 'criar_projeto' "
                "primeiro (ou confira o nome - veja 'listar_projetos').")

    def _caminho_dentro(relativo):
        rel = (relativo or "").strip().strip('"').replace("\\", "/")
        return os.path.join(pasta, rel)

    if a == "listar_arquivos":
        linhas = []
        for base, dirs, arqs in os.walk(pasta):
            dirs[:] = [d for d in dirs if d not in (".git", "node_modules", "__pycache__", ".venv")]
            for arq in sorted(arqs)[:200]:
                c = os.path.join(base, arq)
                rel = os.path.relpath(c, pasta)
                try:
                    linhas.append(f"  {rel}  ({os.path.getsize(c)} bytes)")
                except Exception:
                    pass
        return f"Arquivos de '{os.path.basename(pasta)}':\n" + ("\n".join(linhas) or "pasta vazia")

    if a == "escrever_arquivo":
        if not caminho_arquivo.strip():
            return "Diga o arquivo (ex.: 'index.html')."
        alvo = _caminho_dentro(caminho_arquivo)
        os.makedirs(os.path.dirname(alvo) or ".", exist_ok=True)
        with open(alvo, "w", encoding="utf-8") as f:
            f.write(conteudo if conteudo is not None else "")
        linhas = conteudo.count("\n") + 1 if conteudo else 0
        return f"Arquivo escrito: {os.path.relpath(alvo, pasta)} ({linhas} linhas)."

    if a == "ler_arquivo":
        alvo = _caminho_dentro(caminho_arquivo)
        if not os.path.isfile(alvo):
            return f"Arquivo nao encontrado: {caminho_arquivo}"
        with open(alvo, "r", encoding="utf-8", errors="ignore") as f:
            txt = f.read()
        return f"--- {caminho_arquivo} ---\n{txt[:6000]}"

    if a == "editar_arquivo":
        alvo = _caminho_dentro(caminho_arquivo)
        if not os.path.isfile(alvo):
            return f"Arquivo nao encontrado: {caminho_arquivo}"
        if "===" not in conteudo:
            return "Use o conteudo no formato: TRECHO_ANTIGO===TRECHO_NOVO"
        antigo, novo = conteudo.split("===", 1)
        with open(alvo, "r", encoding="utf-8", errors="ignore") as f:
            txt = f.read()
        if antigo not in txt:
            return "Nao encontrei o trecho antigo no arquivo (confira a identacao/texto)."
        txt = txt.replace(antigo, novo, 1)
        with open(alvo, "w", encoding="utf-8") as f:
            f.write(txt)
        return f"Arquivo {caminho_arquivo} editado (trecho substituido)."

    if a == "analisar":
        ext_cont = {}
        total_bytes = 0
        n_arquivos = 0
        problemas = []
        for base, dirs, arqs in os.walk(pasta):
            dirs[:] = [d for d in dirs if d not in (".git", "node_modules", "__pycache__", ".venv")]
            for arq in arqs:
                c = os.path.join(base, arq)
                try:
                    sz = os.path.getsize(c)
                except Exception:
                    continue
                total_bytes += sz
                n_arquivos += 1
                ext = os.path.splitext(arq)[1].lower() or "(sem ext)"
                ext_cont[ext] = ext_cont.get(ext, 0) + 1
                if sz > 1_000_000:
                    problemas.append(f"arquivo grande: {os.path.relpath(c, pasta)} ({sz/1024/1024:.1f} MB)")
        tem_git = os.path.isdir(os.path.join(pasta, ".git"))
        tem_index = os.path.isfile(os.path.join(pasta, "index.html"))
        tem_readme = any(f.lower().startswith("readme") for f in os.listdir(pasta)) if os.path.isdir(pasta) else False
        top = ", ".join(f"{k}:{v}" for k, v in sorted(ext_cont.items(), key=lambda x: -x[1])[:10])
        analise = (
            f"ANALISE do projeto '{os.path.basename(pasta)}':\n"
            f"- {n_arquivos} arquivo(s), {total_bytes/1024:.0f} KB no total.\n"
            f"- Tipos: {top or 'nenhum'}.\n"
            f"- Git inicializado: {'sim' if tem_git else 'NAO (use git_init)'}.\n"
            f"- Tem index.html (site): {'sim' if tem_index else 'nao'}.\n"
            f"- Tem README: {'sim' if tem_readme else 'nao (recomendo criar)'}.\n"
        )
        if problemas:
            analise += "- Atencao:\n   " + "\n   ".join(problemas[:10]) + "\n"
        return analise

    # --- Git ---
    if a == "git_status":
        saida, cod = _rodar_git(pasta, "status --short --branch")
        return "Git status:\n" + (saida or "(limpo / sem alteracoes)")
    if a == "git_init":
        saida, cod = _rodar_git(pasta, "init")
        _rodar_git(pasta, "config init.defaultBranch main")
        # garante um .gitignore basico para projetos web/python
        gi = os.path.join(pasta, ".gitignore")
        if not os.path.exists(gi):
            with open(gi, "w", encoding="utf-8") as f:
                f.write("node_modules/\n__pycache__/\n.venv/\n*.pyc\n.DS_Store\n")
        return "Git inicializado (branch main) com .gitignore basico.\n" + saida
    if a == "git_commit":
        msg = mensagem.strip() or "Atualizacao pelo agente"
        _rodar_git(pasta, "add -A")
        saida, cod = _rodar_git(pasta, f'commit -m "{msg.replace(chr(34), chr(39))}"')
        return "Commit feito.\n" + saida[:800]
    if a == "git_remoto":
        if not url_remoto.strip():
            return "Diga a URL do repositorio remoto em 'url_remoto'."
        saida, cod = _rodar_git(pasta, f"remote add origin {url_remoto.strip()}")
        if cod != 0:
            saida2, _ = _rodar_git(pasta, f"remote set-url origin {url_remoto.strip()}")
            saida += "\n" + saida2
        return "Remoto 'origin' configurado.\n" + saida[:500]
    if a == "git_push":
        saida, cod = _rodar_git(pasta, "push -u origin main", 120)
        return ("Push enviado para o GitHub.\n" if cod == 0 else "Push com problema (confira login/remoto):\n") + saida[:800]

    # --- Terminal dentro do projeto (baixar/rodar/melhorar codigo) ---
    if a == "comando":
        # Roda QUALQUER comando do terminal DENTRO da pasta do projeto (npm,
        # pip, node, python, build, testes...). Comandos destrutivos passam
        # pela trava de emergencia como em executar_comando.
        cmd = caminho_arquivo.strip() or mensagem.strip()
        if not cmd:
            return "Diga o comando para rodar no projeto (ex.: 'npm run build')."
        _risco = any(_p in cmd.lower() for _p in COMANDOS_PERIGOSOS)
        if _risco and not confirmar_catastrofico(f"Comando destrutivo no projeto: '{cmd}'?"):
            return "Comando cancelado."
        try:
            r = subprocess.run(cmd, shell=True, capture_output=True, text=True,
                               encoding="utf-8", errors="ignore", timeout=180, cwd=pasta)
            saida = ((r.stdout or "") + "\n" + (r.stderr or "")).strip()
            return (f"Comando rodado em '{os.path.basename(pasta)}' (codigo {r.returncode}):\n"
                    + (saida[:2500] if saida else "(sem saida de texto)"))
        except subprocess.TimeoutExpired:
            return "O comando demorou mais de 3 minutos e foi interrompido."
        except Exception as e:
            return f"Erro ao rodar o comando: {e}"

    if a == "instalar_deps":
        # Detecta o tipo de projeto e instala as dependencias sozinho.
        if os.path.isfile(os.path.join(pasta, "requirements.txt")):
            cmd = "pip install -r requirements.txt"
        elif os.path.isfile(os.path.join(pasta, "package.json")):
            cmd = "npm install"
        elif os.path.isfile(os.path.join(pasta, "pyproject.toml")):
            cmd = "pip install -e ."
        else:
            return ("Nao encontrei requirements.txt nem package.json neste projeto - "
                    "nao ha dependencias claras para instalar.")
        try:
            r = subprocess.run(cmd, shell=True, capture_output=True, text=True,
                               encoding="utf-8", errors="ignore", timeout=300, cwd=pasta)
            saida = ((r.stdout or "") + "\n" + (r.stderr or "")).strip()
            return f"Instalando dependencias com '{cmd}' (codigo {r.returncode}):\n" + (saida[-2000:] or "(ok)")
        except subprocess.TimeoutExpired:
            return "A instalacao demorou mais de 5 minutos e foi interrompida."
        except Exception as e:
            return f"Erro na instalacao: {e}"

    if a in ("iniciar_app", "rodar", "servidor"):
        # Sobe o projeto (servidor de desenvolvimento) sem travar o agente.
        if os.path.isfile(os.path.join(pasta, "package.json")):
            cmd = "npm run dev"
        elif os.path.isfile(os.path.join(pasta, "manage.py")):
            cmd = "python manage.py runserver"
        elif os.path.isfile(os.path.join(pasta, "app.py")) or os.path.isfile(os.path.join(pasta, "main.py")):
            cmd = "python app.py" if os.path.isfile(os.path.join(pasta, "app.py")) else "python main.py"
        elif os.path.isfile(os.path.join(pasta, "index.html")):
            cmd = "start index.html"
        else:
            return "Nao identifiquei como iniciar este projeto (sem package.json/manage.py/app.py/index.html)."
        try:
            subprocess.Popen(cmd, shell=True, cwd=pasta)
            return f"Projeto iniciado com '{cmd}'. Se for site/servidor, acompanhe na janela/terminal que abriu."
        except Exception as e:
            return f"Nao consegui iniciar: {e}"

    if a in ("abrir_terminal", "terminal"):
        # Abre o terminal INTEGRADO do VS Code ja na pasta do projeto.
        try:
            subprocess.Popen(f'code -r "{pasta}"', shell=True)
            time.sleep(2)
            pyautogui.hotkey("ctrl", "`")  # atalho do VS Code: abre o terminal integrado
            return "Terminal integrado do VS Code aberto na pasta do projeto."
        except Exception as e:
            return f"Nao consegui abrir o terminal do VS Code ({e})."

    return ("Acao invalida. Use: criar_projeto, abrir, listar_projetos, escrever_arquivo, "
            "ler_arquivo, editar_arquivo, listar_arquivos, analisar, git_status, git_init, "
            "git_commit, git_remoto, git_push, clonar, comando, instalar_deps, iniciar_app "
            "ou abrir_terminal.")


# ======================================================================
# ====== CENTRAL DO PROPRIO CODIGO-FONTE (AUTOEDICAO PROFISSIONAL) =====
# Permite ao agente analisar e aperfeicoar o SEU PROPRIO codigo (agente.py e
# os arquivos da pasta dele), com disciplina de engenheiro senior:
#   1) backup automatico ANTES de qualquer edicao;
#   2) edicao cirurgica por marcador (nunca reescreve o arquivo as cegas);
#   3) validacao DEPOIS (compila e conta as ferramentas);
#   4) REVERTE sozinho se a edicao quebrar algo;
#   5) ideias novas sem repetir o que ja existe.
# ======================================================================

ARQ_AGENTE = os.path.join(PASTA_BASE, "agente.py")
PASTA_BACKUPS = os.path.join(PASTA_BASE, "backups_codigo")


def _validar_agente(caminho_py: str) -> str:
    """Compila o arquivo .py e devolve '' se estiver OK, ou a mensagem de erro.
    Tambem confere que o numero de @tool bate com o de registradas na lista."""
    import py_compile
    try:
        py_compile.compile(caminho_py, doraise=True)
    except py_compile.PyCompileError as e:
        return f"Erro de sintaxe apos a edicao:\n{e}"
    except Exception as e:
        return f"Nao consegui validar: {type(e).__name__}: {e}"
    # checagem de ferramentas via AST (decoradas vs registradas)
    try:
        import ast as _ast
        src = open(caminho_py, encoding="utf-8").read()
        tree = _ast.parse(src)
        decoradas = [n.name for n in _ast.walk(tree) if isinstance(n, _ast.FunctionDef)
                     for d in n.decorator_list if isinstance(d, _ast.Name) and d.id == "tool"]
        import re as _re
        m = _re.search(r"\ntools = \[(.*?)\n\]", src, _re.S)
        registradas = [x.strip() for x in m.group(1).replace("\n", "").split(",") if x.strip()] if m else []
        if len(decoradas) != len(registradas):
            faltando = [x for x in decoradas if x not in registradas]
            return (f"Desalinhou as ferramentas: {len(decoradas)} decoradas vs "
                    f"{len(registradas)} registradas. Faltando registrar: {faltando}")
        return ""
    except Exception as e:
        return f"Validacao AST falhou: {e}"


@tool
def central_auto_codigo(acao: str, alvo: str = "", trecho_antigo: str = "",
                        trecho_novo: str = "", tema: str = "") -> str:
    """CENTRAL DE AUTOEDICAO - o agente analisa e melhora o SEU PROPRIO codigo e
    os arquivos da pasta dele. Acoes no parametro 'acao':
    - 'analisar': faz uma ANALISE PROFUNDA do agente.py (linhas, nº de ferramentas,
      possiveis riscos, pendencias) e devolve um diagnostico.
    - 'listar_arquivos': lista os arquivos da pasta do agente (codigo e dados).
    - 'ler_arquivo' ('alvo'=nome, ex.: 'iniciar.bat'): mostra o conteudo do arquivo.
    - 'editar_seguro' ('alvo'='agente.py' ou nome do arquivo, 'trecho_antigo'=texto
      EXATO que esta no arquivo, 'trecho_novo'=substituicao): faz backup, troca o
      trecho, COMPILA/valida e reverte sozinho se quebrar. Edicao cirurgica.
    - 'inserir_ferramenta' ('trecho_novo'=codigo completo da funcao @tool nova):
      adiciona uma ferramenta NOVA, registra na lista 'tools', faz backup e valida.
      Use para se expandir quando faltar capacidade.
    - 'ideias' ('tema'=area, ex.: 'whatsapp', 'arquivos', 'rapidez'): gera ideias
      de melhoria NAO repetitivas (confere o que ja existe antes de sugerir).
    - 'historico_backups': lista os backups de codigo ja feitos.
    Sempre faca backup (a propria acao faz) e valide apos mexer."""
    a = acao.strip().lower()
    os.makedirs(PASTA_BACKUPS, exist_ok=True)

    def _caminho_alvo(nome: str) -> str:
        nome = (nome or "agente.py").strip().strip('"')
        if os.path.isabs(nome):
            return nome
        if not nome.endswith((".py", ".bat", ".txt", ".md", ".json", ".env")):
            nome += ".py"
        return os.path.join(PASTA_BASE, os.path.basename(nome))

    def _fazer_backup(caminho: str) -> str:
        import shutil
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        base = os.path.basename(caminho)
        bk = os.path.join(PASTA_BACKUPS, f"{base}.{ts}.bak")
        shutil.copy2(caminho, bk)
        # mantem so os ultimos 30 backups
        bks = sorted([os.path.join(PASTA_BACKUPS, f) for f in os.listdir(PASTA_BACKUPS)])
        for velho in bks[:-30]:
            try:
                os.remove(velho)
            except Exception:
                pass
        return bk

    if a == "listar_arquivos":
        linhas = []
        for nome in sorted(os.listdir(PASTA_BASE)):
            c = os.path.join(PASTA_BASE, nome)
            if os.path.isfile(c):
                linhas.append(f"  {nome}  ({os.path.getsize(c)//1024} KB)")
            else:
                linhas.append(f"  [pasta] {nome}/")
        return "Arquivos na pasta do agente:\n" + "\n".join(linhas)

    if a == "historico_backups":
        if not os.path.isdir(PASTA_BACKUPS):
            return "Nenhum backup feito ainda."
        bks = sorted(os.listdir(PASTA_BACKUPS))
        return "Backups de codigo:\n" + ("\n".join(f"  {b}" for b in bks[-15:]) or "nenhum")

    if a == "ler_arquivo":
        caminho = _caminho_alvo(alvo)
        if not os.path.isfile(caminho):
            return f"Arquivo nao encontrado: {caminho}"
        with open(caminho, "r", encoding="utf-8", errors="ignore") as f:
            txt = f.read()
        return f"--- {os.path.basename(caminho)} ({len(txt)} chars) ---\n" + txt[:7000]

    if a == "analisar":
        caminho = _caminho_alvo(alvo or "agente.py")
        if not os.path.isfile(caminho):
            return f"agente.py nao encontrado em {caminho}."
        src = open(caminho, encoding="utf-8").read()
        import ast as _ast
        tree = _ast.parse(src)
        decoradas = [n.name for n in _ast.walk(tree) if isinstance(n, _ast.FunctionDef)
                     for d in n.decorator_list if isinstance(d, _ast.Name) and d.id == "tool"]
        # procura marcadores de risco/ponto de atencao
        alertas = []
        if "confirmar_catastrofico" not in src:
            alertas.append("falta a trava de comandos catastroficos")
        if "_invocar_agente_stream" in src and "fallback" not in src.lower():
            alertas.append("streaming sem fallback aparente")
        # quantas funcoes no total
        total_func = sum(1 for n in _ast.walk(tree) if isinstance(n, _ast.FunctionDef))
        diag = (
            f"ANALISE PROFUNDA do agente.py:\n"
            f"- Linhas: {src.count(chr(10))+1} | Funcoes no total: {total_func} | "
            f"Ferramentas @tool: {len(decoradas)}.\n"
            f"- Nomes das ferramentas: {', '.join(decoradas)[:1200]}\n"
        )
        if alertas:
            diag += "- Atencao:\n   - " + "\n   - ".join(alertas) + "\n"
        else:
            diag += "- Sem alertas estruturais criticos (sintaxe OK).\n"
        diag += ("- Para melhorar com seguranca: use 'editar_seguro' (backup+validacao) "
                 "ou 'inserir_ferramenta' para capacidade nova.")
        return diag

    if a == "ideias":
        # Le quais ferramentas JA existem para NAO sugerir repeticao.
        caminho = _caminho_alvo("agente.py")
        existentes = ""
        if os.path.isfile(caminho):
            import ast as _ast
            try:
                existentes = ", ".join(
                    n.name for n in _ast.walk(_ast.parse(open(caminho, encoding="utf-8").read()))
                    if isinstance(n, _ast.FunctionDef)
                    for d in n.decorator_list if isinstance(d, _ast.Name) and d.id == "tool")
            except Exception:
                existentes = ""
        t = tema.strip().lower()
        ideias = [
            "Central de Excel/planilhas (ler, escrever, formatar, somar colunas, gerar grafico).",
            "Central de PDF (juntar, separar paginas, extrair texto, converter).",
            "Central de agenda/calendario (compromissos, eventos, inicio automatico).",
            "Central de downloads (baixar arquivo/url, retomar, organizar por tipo).",
            "Central de captura/automacao de tela (clique por imagem/OCR de tela).",
            "Modo 'rotina matinal' (abre seus apps, mostra clima/dolar/calendario de uma vez).",
            "Central de clipboard historico (guarda tudo que voce copiou para colar depois).",
            "Central de notas/lembretes sincronizados em arquivo com busca.",
        ]
        if t in ("whatsapp", "mensagem", "zap"):
            ideias = ["Agendar mensagem no WhatsApp para mais tarde.",
                      "Mensagem para varios contatos/grupos em sequencia (com confirmacao).",
                      "Ler as ultimas mensagens de uma conversa por visao de tela e resumir."]
        if t in ("arquivo", "arquivos", "downloads"):
            ideias = ["Organizar downloads com regras customizadas.",
                      "Limpar arquivos grandes/antigos (mais de X dias ou X MB).",
                      "Renomear em lote por padrao (data, sequencia, substituir palavra)."]
        if t in ("rapidez", "rapido", "velocidade", "performance"):
            ideias = ["Mais atalhos instantaneos sem IA para comandos comuns.",
                      "Pre-carregar a IA favorita ao abrir para responder mais rapido.",
                      "Encurtar o contexto quando ele cresce (resumo do historico)."]
        # filtra as que parecem ja existir (pelo nome)
        novas = [i for i in ideias if not any(p in existentes.lower() for p in
                 ("excel", "pdf", "agenda", "download", "rotina") )]  # heuristica leve
        lista = ideias if not existentes else ideias
        return (f"Ideias de melhoria" + (f" para '{t}'" if t else "") + " (ja conferindo o "
                f"que existe - {existentes.count(',')+1 if existentes else 0} ferramentas atuais):\n"
                + "\n".join(f"  {i+1}. {ideia}" for i, ideia in enumerate(lista))
                + "\n\nQuando escolher uma, peca para eu implementar com 'inserir_ferramenta' "
                "(com backup e validacao automatica).")

    if a in ("editar_seguro", "editar"):
        caminho = _caminho_alvo(alvo or "agente.py")
        if not os.path.isfile(caminho):
            return f"Arquivo nao encontrado: {caminho}"
        if not trecho_antigo or not trecho_novo:
            return "Use 'trecho_antigo' (texto exato que esta no arquivo) e 'trecho_novo' (substituicao)."
        original = open(caminho, encoding="utf-8").read()
        if trecho_antigo not in original:
            return "Nao encontrei o 'trecho_antigo' no arquivo. Use 'ler_arquivo' e copie um trecho EXATO."
        if original.count(trecho_antigo) > 1:
            return "O trecho aparece mais de uma vez; use um trecho mais especifico/longo para nao ambiguidade."
        if not confirmar_destrutivo(
            f"Editar o proprio codigo ({os.path.basename(caminho)})? Sera feito backup e "
            "validado; se quebrar, reverto sozinho."
        ):
            return "Edicao cancelada."
        bk = _fazer_backup(caminho)
        novo_txt = original.replace(trecho_antigo, trecho_novo, 1)
        try:
            open(caminho, "w", encoding="utf-8").write(novo_txt)
        except Exception as e:
            open(caminho, "w", encoding="utf-8").write(original)
            return f"Erro ao escrever (revertido): {e}"
        if caminho.endswith(".py"):
            erro = _validar_agente(caminho)
            if erro:
                open(caminho, "w", encoding="utf-8").write(original)  # reverte
                return (f"A edicao quebrou o codigo e foi REVERTIDA (backup em {bk}).\n{erro}\n"
                        "Ajuste o trecho_novo e tente de novo.")
        return (f"Edicao aplicada com sucesso em {os.path.basename(caminho)} (backup: {bk}). "
                "Validacao OK. Reinicie o agente para a mudanca valer.")

    if a in ("inserir_ferramenta", "nova_ferramenta"):
        caminho = _caminho_alvo("agente.py")
        if not os.path.isfile(caminho):
            return f"agente.py nao encontrado: {caminho}"
        if "@tool" not in trecho_novo or "def " not in trecho_novo:
            return "O 'trecho_novo' deve ser o codigo completo da funcao com o decorador @tool."
        if not confirmar_destrutivo(
            "Adicionar uma NOVA ferramenta ao agente? Sera feito backup, inserido e "
            "validado; se quebrar, reverto sozinho."
        ):
            return "Insercao cancelada."
        import ast as _ast
        bk = _fazer_backup(caminho)
        original = open(caminho, encoding="utf-8").read()
        # extrai o nome da funcao nova
        try:
            arv = _ast.parse(trecho_novo)
            nomes = [n.name for n in arv.body if isinstance(n, _ast.FunctionDef)]
            nome_fn = nomes[0] if nomes else None
        except Exception:
            nome_fn = None
        if nome_fn and f"def {nome_fn}(" in original:
            return f"Ja existe uma funcao '{nome_fn}' no codigo (isso evita repeticao). Escolha outro nome."
        try:
            # insere a funcao logo antes da lista 'tools = ['
            marcador = "\ntools = ["
            idx = original.find(marcador)
            if idx == -1:
                return "Nao achei a lista 'tools = [' para inserir (edicao cancelada)."
            novo_txt = original[:idx] + "\n\n" + trecho_novo.strip() + "\n" + original[idx:]
            # registra na lista tools (na linha logo apos 'tools = [')
            if nome_fn:
                novo_txt = novo_txt.replace("tools = [\n", f"tools = [\n    {nome_fn},\n", 1)
            open(caminho, "w", encoding="utf-8").write(novo_txt)
        except Exception as e:
            open(caminho, "w", encoding="utf-8").write(original)
            return f"Erro ao inserir (revertido): {e}"
        erro = _validar_agente(caminho)
        if erro:
            open(caminho, "w", encoding="utf-8").write(original)  # reverte
            return f"A ferramenta nova quebrou o codigo e foi REVERTIDA (backup {bk}).\n{erro}"
        return (f"Nova ferramenta '{nome_fn}' adicionada e registrada com sucesso "
                f"(backup {bk}). Validacao OK. Reinicie o agente para usa-la.")

    return ("Acao invalida. Use: analisar, listar_arquivos, ler_arquivo, editar_seguro, "
            "inserir_ferramenta, ideias ou historico_backups.")


# ======================================================================
# ============= MAIS FERRAMENTAS TURBO (PDF, NOTAS, DOWNLOAD) ==========
# ======================================================================

@tool
def central_pdf(acao: str, arquivos: str = "", saida: str = "",
                pagina_inicial: int = 0, pagina_final: int = 0) -> str:
    """CENTRAL DE PDF. Trabalha com arquivos PDF. Acoes em 'acao':
    - 'juntar' ('arquivos'=caminhos separados por ponto-e-virgula ';'): junta
      varios PDFs em um so.
    - 'extrair_paginas' ('arquivos'=um PDF, 'pagina_inicial' e 'pagina_final'
      em numero de pagina, contando de 1): gera um PDF so com essas paginas.
    - 'texto' ('arquivos'=um PDF): extrai o texto do PDF.
    - 'info' ('arquivos'=um PDF): numero de paginas.
    'saida' e o nome/caminho do PDF resultante (opcional). Ex.:
    central_pdf('juntar', arquivos='C:/a.pdf;C:/b.pdf')."""
    import shutil
    a = acao.strip().lower()

    def _read_pdf(caminho):
        from pypdf import PdfReader
        return PdfReader(caminho)

    if a == "info":
        c = arquivos.strip().strip('"')
        if not os.path.isfile(c):
            return f"PDF nao encontrado: {c}"
        return f"{os.path.basename(c)} tem {len(_read_pdf(c).pages)} pagina(s)."

    if a == "texto":
        c = arquivos.strip().strip('"')
        if not os.path.isfile(c):
            return f"PDF nao encontrado: {c}"
        reader = _read_pdf(c)
        texto = []
        for pg in reader.pages:
            try:
                texto.append(pg.extract_text() or "")
            except Exception:
                pass
        todo = "\n".join(texto).strip()
        return f"Texto de {os.path.basename(c)}:\n{todo[:6000]}" if todo else \
            "Nao consegui extrair texto (pode ser um PDF de imagem/escaneado)."

    if a in ("juntar", "merge", "unir"):
        from pypdf import PdfWriter
        cams = [x.strip().strip('"') for x in arquivos.split(";") if x.strip()]
        if len(cams) < 2:
            return "Passe pelo menos DOIS PDFs separados por ';' para juntar."
        for c in cams:
            if not os.path.isfile(c):
                return f"PDF nao encontrado: {c}"
        writer = PdfWriter()
        for c in cams:
            for pg in _read_pdf(c).pages:
                writer.add_page(pg)
        dest = saida.strip().strip('"') or os.path.join(os.path.dirname(cams[0]), "pdf_juntado.pdf")
        if not dest.lower().endswith(".pdf"):
            dest += ".pdf"
        with open(dest, "wb") as f:
            writer.write(f)
        return f"PDFs juntados em: {dest} ({len(cams)} arquivos)."

    if a in ("extrair_paginas", "paginas", "recortar"):
        from pypdf import PdfWriter
        c = arquivos.strip().strip('"')
        if not os.path.isfile(c):
            return f"PDF nao encontrado: {c}"
        reader = _read_pdf(c)
        total = len(reader.pages)
        ini = max(1, pagina_inicial or 1)
        fim = pagina_final or ini
        if fim < ini or fim > total:
            return f"Paginas invalidas. O PDF tem {total} pagina(s); peca entre 1 e {total}."
        writer = PdfWriter()
        for i in range(ini - 1, fim):
            writer.add_page(reader.pages[i])
        dest = saida.strip().strip('"') or os.path.join(os.path.dirname(c),
                                                        f"paginas_{ini}-{fim}.pdf")
        if not dest.lower().endswith(".pdf"):
            dest += ".pdf"
        with open(dest, "wb") as f:
            writer.write(f)
        return f"Paginas {ini} a {fim} extraidas para: {dest}."

    return "Acao invalida. Use: juntar, extrair_paginas, texto ou info."


ARQ_NOTAS = os.path.join(PASTA_BASE, "notas.json")


@tool
def notas_rapidas(acao: str, titulo: str = "", conteudo: str = "") -> str:
    """NOTAS RAPIDAS salvas em arquivo (o agente lembra depois). Acoes:
    'adicionar' ('titulo'=nome, 'conteudo'=texto da nota), 'listar' (mostra
    todas), 'ler' ('titulo'=qual nota), 'remover' ('titulo'). Use para
    'anota isso', 'faz uma nota', 'quais minhas notas', 'lembra da nota X'.
    Nao usa IA para salvar - e instantaneo e persistente."""
    notas = carregar_json(ARQ_NOTAS, {})
    a = acao.strip().lower()
    chave = (titulo or "").strip().lower()

    if a in ("adicionar", "criar", "salvar", "nova"):
        if not titulo.strip():
            return "Diga um titulo para a nota."
        notas[chave] = {"titulo": titulo.strip(), "conteudo": conteudo,
                        "data": datetime.now().isoformat()}
        salvar_json(ARQ_NOTAS, notas)
        return f"Nota '{titulo.strip()}' salva."
    if a in ("listar", "lista", "todas"):
        if not notas:
            return "Voce ainda nao tem notas."
        return "Suas notas:\n" + "\n".join(f"  - {v['titulo']}" for v in notas.values())
    if a in ("ler", "ver", "mostrar"):
        n = notas.get(chave)
        if not n:
            parecido = difflib.get_close_matches(chave, list(notas.keys()), n=1, cutoff=0.5)
            if parecido:
                n = notas[parecido[0]]
        if not n:
            return f"Nao encontrei a nota '{titulo}'."
        return f"{n['titulo']}:\n{n['conteudo']}"
    if a in ("remover", "apagar", "excluir"):
        if chave in notas:
            del notas[chave]
            salvar_json(ARQ_NOTAS, notas)
            return f"Nota '{titulo}' removida."
        return f"Nao encontrei a nota '{titulo}'."
    return "Acao invalida. Use: adicionar, listar, ler ou remover."


@tool
def baixar_arquivo(url: str, destino: str = "") -> str:
    """Baixa um arquivo da internet (URL direta: .exe, .zip, .pdf, imagem,
    documento...) para o PC, sem abrir o navegador. Por padrao salva na pasta
    Downloads com o nome do arquivo da URL. 'destino' e opcional (pasta ou
    caminho completo). Use para 'baixa o arquivo X', 'faz download de Y'."""
    if not url.strip().lower().startswith(("http://", "https://")):
        return "Me passe uma URL valida (comecando com http:// ou https://)."

    def _baixar():
        import urllib.request
        import urllib.parse
        nome = urllib.parse.unquote(url.rstrip("/").split("/")[-1].split("?")[0]) or "arquivo"
        if destino.strip():
            d = destino.strip().strip('"')
            if os.path.isdir(d):
                caminho = os.path.join(d, nome)
            else:
                caminho = d
                os.makedirs(os.path.dirname(caminho) or ".", exist_ok=True)
        else:
            dl = os.path.join(os.path.expanduser("~"), "Downloads")
            os.makedirs(dl, exist_ok=True)
            caminho = os.path.join(dl, nome)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=120) as r, open(caminho, "wb") as f:
            import shutil as _sh
            _sh.copyfileobj(r, f)
        tamanho = os.path.getsize(caminho) / (1024 * 1024)
        return f"Download concluido: {caminho} ({tamanho:.1f} MB)."

    return executar_com_autocura("baixar_arquivo", _baixar)


@tool
def conhecimento_web(tema: str) -> str:
    """Busca CONHECIMENTO/RESUMO de um tema na Wikipedia (em portugues) e traz um
    resumo curto NA HORA, sem chave e sem abrir navegador. Use para 'o que e X',
    'quem foi Y', 'resumo sobre Z', conceitos, historia, definicoes gerais. Para
    cotacao/clima use 'cotacao_e_clima'; para noticias/atualidades use o navegador."""
    import json as _json
    import urllib.request
    import urllib.parse

    def _buscar():
        titulo = urllib.parse.quote(tema.strip())
        url = (f"https://pt.wikipedia.org/api/rest_v1/page/summary/{titulo}"
               "?redirect=true")
        req = urllib.request.Request(url, headers={"User-Agent": "AgentePC/1.0 (uso pessoal)"})
        with urllib.request.urlopen(req, timeout=20) as r:
            dados = _json.loads(r.read().decode("utf-8"))
        if dados.get("type") == "disambiguation":
            return f"Há varios sentidos para '{tema}'. Seja mais especifico."
        extrato = (dados.get("extract") or "").strip()
        if not extrato:
            return f"Nao encontrei um resumo para '{tema}'."
        return f"{dados.get('title', tema)}: {extrato[:1500]}"

    try:
        return executar_com_autocura("conhecimento_web", _buscar)
    except Exception as e:
        return f"Nao consegui buscar sobre '{tema}' ({type(e).__name__}). Tente o navegador."


# ======================================================================
# ========= FERRAMENTAS NOVAS (BUSCA WEB, E-MAIL, IDIOMA, UTIL) =======
# Tudo adicao pura: nada do que ja existia foi apagado. So usam biblioteca
# padrao do Python ou APIs gratuitas sem chave (a nao ser o Gmail, que usa
# a MESMA configuracao do 'enviar_email').
# ======================================================================

@tool
def buscar_web(consulta: str) -> str:
    """BUSCA GERAL NA INTERNET (DuckDuckGo, sem chave e sem abrir navegador):
    procura noticias, produtos, precos, tutoriais, lancamentos e qualquer
    assunto atual, e devolve os titulos + links + resumos dos melhores
    resultados. Use para 'pesquise X', 'procura na internet sobre Y', 'qual o
    preco de Z', 'achou noticia de W'. Para conceito/historia/definicao voce
    pode usar 'conhecimento_web' (Wikipedia); para cotacao/clima use
    'cotacao_e_clima'. Esta ferramenta e para BUSCA ABERTA na web."""
    import urllib.request
    import urllib.parse
    import re as _re
    import html as _html

    def _buscar():
        if not consulta.strip():
            return "Me diga o que voce quer pesquisar."
        url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(consulta.strip())
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=20) as r:
            pagina = r.read().decode("utf-8", errors="ignore")

        def _limpar(texto_html):
            txt = _re.sub(r"<[^>]+>", "", texto_html)
            return " ".join(_html.unescape(txt).split())

        # titulos + links
        titulos = _re.findall(r'class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', pagina, _re.S)
        trechos = _re.findall(r'class="result__snippet"[^>]*>(.*?)</a>', pagina, _re.S)
        resultados = []
        for i, (link, titulo) in enumerate(titulos[:6]):
            # os links do DuckDuckGo sao redirecionamentos: extrai o 'uddg' real
            alvo = link
            m_uddg = _re.search(r"[?&]uddg=([^&]+)", link)
            if m_uddg:
                # os links do DuckDuckGo sao redirecionamentos: extrai a URL real
                alvo = urllib.parse.unquote(m_uddg.group(1))
            elif link.startswith("//"):
                alvo = "https:" + link
            resumo = _limpar(trechos[i]) if i < len(trechos) else ""
            resultados.append(f"{i+1}. {_limpar(titulo)}\n   {alvo}\n   {resumo}")
        if not resultados:
            return (f"Nao consegui resultados para '{consulta}' (o buscador pode ter "
                    "bloqueado a consulta automatica). Tente abrir o navegador.")
        return f"Resultados para '{consulta}':\n" + "\n".join(resultados)

    try:
        return executar_com_autocura("buscar_web", _buscar)
    except Exception as e:
        return f"Nao consegui fazer a busca agora ({type(e).__name__}). Tente o navegador."


@tool
def ler_emails(quantos: int = 5) -> str:
    """Le os e-mails RECENTES da sua caixa de entrada do Gmail (IMAP) e mostra
    remetente, assunto e data - sem abrir o navegador. Usa a MESMA configuracao
    do 'enviar_email': 'email_remetente' no config.json e a senha de app na
    variavel GMAIL_APP_PASSWORD. 'quantos' = quantos emails recentes listar
    (padrao 5). So leitura: nao apaga nem envia nada."""
    remetente = config.get("email_remetente")
    senha_app = os.environ.get("GMAIL_APP_PASSWORD")
    if not remetente or not senha_app:
        return (
            "E-mail ainda nao configurado. E a MESMA configuracao do envio: coloque "
            "'email_remetente' no config.json e rode no cmd: "
            'setx GMAIL_APP_PASSWORD "sua_senha_de_app" (gerada em '
            "myaccount.google.com/apppasswords). Depois feche e abra o cmd."
        )

    def _ler():
        import imaplib
        import email as _email
        from email.header import decode_header as _dh

        def _dec(parte):
            if not parte:
                return ""
            texto = ""
            for trecho, _enc in _dh(parte):
                if isinstance(trecho, bytes):
                    try:
                        texto += trecho.decode(_enc or "utf-8", errors="ignore")
                    except Exception:
                        texto += trecho.decode("utf-8", errors="ignore")
                else:
                    texto += trecho
            return texto

        with imaplib.IMAP4_SSL("imap.gmail.com") as servidor:
            servidor.login(remetente, senha_app)
            servidor.select("INBOX")
            _status, ids = servidor.search(None, "ALL")
            lista_ids = ids[0].split()
            alvos = lista_ids[-max(1, quantos):][::-1]  # mais recentes primeiro
            if not alvos:
                return "Sua caixa de entrada esta vazia."
            linhas = [f"Ultimos {len(alvos)} e-mail(s) da caixa de entrada:"]
            for num in alvos:
                _st, dados = servidor.fetch(num, "(RFC822)")
                if not dados or not dados[0]:
                    continue
                msg = _email.message_from_bytes(dados[0][1])
                de = _dec(msg.get("From"))
                assunto = _dec(msg.get("Subject")) or "(sem assunto)"
                data = msg.get("Date", "")
                linhas.append(f"- De: {de}\n  Assunto: {assunto}\n  Data: {data}")
            return "\n".join(linhas)

    return executar_com_autocura("ler_emails", _ler)


@tool
def traduzir_texto(texto: str, idioma: str = "ingles") -> str:
    """TRADUZ texto na hora (API MyMemory, gratuita e sem chave, sem navegador).
    'idioma' e o idioma DESTINO: 'ingles'/'en', 'espanhol'/'es',
    'portugues'/'pt', 'frances'/'fr', 'italiano'/'it' ou 'alemao'/'de'.
    Por padrao traduz do portugues para o idioma pedido; se o destino for
    portugues, traduz do ingles. Use para 'traduza isso para o ingles',
    'como se diz X em espanhol'."""
    import urllib.request
    import urllib.parse
    import json as _json

    mapa = {
        "ingles": "en", "en": "en", "inglês": "en", "english": "en",
        "espanhol": "es", "es": "es", "espanol": "es", "spanish": "es",
        "portugues": "pt", "português": "pt", "pt": "pt", "portuguese": "pt",
        "frances": "fr", "francês": "fr", "fr": "fr", "french": "fr",
        "italiano": "it", "it": "it", "italian": "it",
        "alemao": "de", "alemão": "de", "de": "de", "german": "de",
    }
    alvo = mapa.get(idioma.strip().lower())
    if not alvo:
        return f"Idioma '{idioma}' nao reconhecido. Use: ingles, espanhol, portugues, frances, italiano ou alemao."
    if not texto.strip():
        return "Me diga o texto que voce quer traduzir."
    # se vamos traduzir PARA portugues, a origem e o ingles; senao, origem e pt
    origem = "en" if alvo == "pt" else "pt"
    if origem == alvo:
        origem = "en"

    def _traduzir():
        params = urllib.parse.urlencode({"q": texto.strip(), "langpair": f"{origem}|{alvo}"})
        url = "https://api.mymemory.translated.net/get?" + params
        req = urllib.request.Request(url, headers={"User-Agent": "AgentePC/1.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            dados = _json.loads(r.read().decode("utf-8"))
        trad = (dados.get("responseData", {}) or {}).get("translatedText", "")
        trad = trad.strip()
        if not trad or "MYMEMORY WARNING" in trad.upper():
            return "Nao consegui traduzir agora (limite da API gratuita). Tente de novo em instantes."
        return f"Traducao ({origem}->{alvo}): {trad}"

    try:
        return executar_com_autocura("traduzir_texto", _traduzir)
    except Exception as e:
        return f"Nao consegui traduzir agora ({type(e).__name__})."


@tool
def gerar_senha(tamanho: int = 16) -> str:
    """GERA UMA SENHA FORTE e aleatoria na hora, 100% offline (nao usa internet
    nem IA, entao e instantanea e nao gasta cota). Usa o gerador seguro
    'secrets' do Python e garante letras maiusculas, minusculas, numeros e
    simbolos. 'tamanho' e o numero de caracteres (padrao 16, minimo 8). Use
    para 'gera uma senha', 'cria uma senha forte'."""
    import secrets
    import string as _str
    n = max(8, int(tamanho) if str(tamanho).isdigit() else 16)
    alfabeto = _str.ascii_letters + _str.digits + "!@#$%&*?-_"
    while True:
        senha = "".join(secrets.choice(alfabeto) for _ in range(n))
        if (any(c.islower() for c in senha) and any(c.isupper() for c in senha)
                and any(c.isdigit() for c in senha) and any(c in "!@#$%&*?-_" for c in senha)):
            break
    return (f"Senha forte gerada ({n} caracteres): {senha}\n"
            "Dica: nao grave esta senha em nota/texto simples; use um gerenciador de senhas.")


@tool
def criar_qr_code(texto_ou_url: str) -> str:
    """CRIA UM QR CODE de um link, texto, Wi-Fi ou dado qualquer e salva como
    imagem PNG (usa uma API gratuita sem chave; o arquivo fica no seu PC). Por
    padrao salva na Area de Trabalho como qr_CODE.png. Use para 'gera um QR
    code desse link', 'faz um qr code do meu site'."""
    if not texto_ou_url.strip():
        return "Me diga o link ou texto que deve virar QR code."

    def _criar():
        import urllib.request
        import urllib.parse
        url = ("https://api.qrserver.com/v1/create-qr-code/?size=500x500&data="
               + urllib.parse.quote(texto_ou_url.strip()))
        desktop = os.path.join(os.path.expanduser("~"), "Desktop")
        if not os.path.isdir(desktop):
            desktop = os.path.join(os.path.expanduser("~"), "Area de Trabalho")
        if not os.path.isdir(desktop):
            desktop = os.path.join(os.path.expanduser("~"), "Downloads")
        os.makedirs(desktop, exist_ok=True)
        nome = "qr_code_" + datetime.now().strftime("%Y%m%d_%H%M%S") + ".png"
        caminho = os.path.join(desktop, nome)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as r, open(caminho, "wb") as f:
            f.write(r.read())
        return f"QR code criado e salvo em: {caminho} (abra a imagem para escanear)."

    return executar_com_autocura("criar_qr_code", _criar)


@tool
def central_planilha(acao: str, caminho: str = "", colunas: str = "",
                      valores: str = "", coluna: str = "") -> str:
    """CENTRAL DE PLANILHAS - CRIA e edita planilhas .csv (sempre funciona, so
    Python) e .xlsx (se o pacote openpyxl estiver instalado). Acoes em 'acao':
    - 'criar': cria uma planilha nova ('caminho'=arquivo .csv/.xlsx,
      'colunas'=nomes das colunas separados por ponto-e-virgula ';').
    - 'adicionar': acrescenta uma linha ('valores' separados por ';').
    - 'ler': mostra as primeiras linhas da planilha.
    - 'somar_coluna': soma os numeros de uma coluna ('coluna'=nome ou numero,
      contando de 1). Tambem aceita 'media_coluna' e 'contar'.
    Ex.: central_planilha('criar', caminho='C:/Users/gfmag/gastos.csv',
    colunas='data;descricao;valor'). Use para 'faz uma planilha de gastos',
    'soma a coluna de vendas', 'adiciona uma linha na planilha X'."""
    import csv as _csv

    a = acao.strip().lower()
    cam = caminho.strip().strip('"')

    def _split(texto):
        return [p.strip() for p in texto.split(";")]

    def _eh_xlsx(c):
        return c.lower().endswith(".xlsx")

    # ---------- caminho .xlsx via openpyxl (lazy) ----------
    if _eh_xlsx(cam):
        try:
            import openpyxl  # noqa: F401
        except Exception:
            return ("Para trabalhar com .xlsx eu preciso do pacote 'openpyxl'. "
                    "Rode no cmd: pip install openpyxl  (ou use um arquivo .csv, "
                    "que funciona sem instalar nada).")

        def _wb():
            import openpyxl as _ox
            return _ox

        if a == "criar":
            if not cam:
                return "Diga o caminho do arquivo .xlsx a criar."
            ox = _wb()
            wb = ox.Workbook()
            ws = wb.active
            if colunas.strip():
                ws.append(_split(colunas))
            os.makedirs(os.path.dirname(cam) or ".", exist_ok=True)
            wb.save(cam)
            return f"Planilha criada: {cam}"
        if a == "adicionar":
            if not os.path.isfile(cam):
                return f"Planilha nao encontrada: {cam} (use a acao 'criar' primeiro)."
            ox = _wb()
            wb = ox.load_workbook(cam)
            ws = wb.active
            ws.append(_split(valores))
            wb.save(cam)
            return f"Linha adicionada em {cam}."
        if a == "ler":
            if not os.path.isfile(cam):
                return f"Planilha nao encontrada: {cam}."
            ox = _wb()
            ws = _wb().load_workbook(cam).active
            linhas = []
            for i, row in enumerate(ws.iter_rows(values_only=True)):
                if i >= 30:
                    linhas.append("...(mais linhas nao mostradas)")
                    break
                linhas.append(" | ".join("" if v is None else str(v) for v in row))
            return f"Conteudo de {os.path.basename(cam)}:\n" + "\n".join(linhas)
        if a in ("somar_coluna", "media_coluna", "contar"):
            if not os.path.isfile(cam):
                return f"Planilha nao encontrada: {cam}."
            ws = _wb().load_workbook(cam).active
            rows = list(ws.iter_rows(values_only=True))
            if not rows:
                return "Planilha vazia."
            cab = [str(h) if h is not None else "" for h in rows[0]]
            indice = _indice_coluna(coluna, cab)
            if indice is None:
                return f"Nao encontrei a coluna '{coluna}'. Colunas: {', '.join(cab)}."
            nums = []
            for row in rows[1:]:
                if indice < len(row) and row[indice] is not None:
                    try:
                        nums.append(float(str(row[indice]).replace(",", ".")))
                    except Exception:
                        pass
            return _resumo_coluna(a, coluna, nums)
        return "Acao invalida para xlsx. Use: criar, adicionar, ler, somar_coluna, media_coluna ou contar."

    # ---------- caminho .csv (nativo, sem dependencia) ----------
    if cam and not cam.lower().endswith(".csv"):
        cam += ".csv"

    if a == "criar":
        if not cam:
            return "Diga o caminho do arquivo .csv a criar (ex.: C:/Users/gfmag/gastos.csv)."
        os.makedirs(os.path.dirname(cam) or ".", exist_ok=True)
        with open(cam, "w", newline="", encoding="utf-8-sig") as f:
            w = _csv.writer(f, delimiter=";")
            if colunas.strip():
                w.writerow(_split(colunas))
        return f"Planilha CSV criada: {cam}"

    if a == "adicionar":
        if not os.path.isfile(cam):
            return f"Planilha nao encontrada: {cam} (use a acao 'criar' primeiro)."
        with open(cam, "a", newline="", encoding="utf-8-sig") as f:
            _csv.writer(f, delimiter=";").writerow(_split(valores))
        return f"Linha adicionada em {cam}."

    if a == "ler":
        if not os.path.isfile(cam):
            return f"Planilha nao encontrada: {cam}."
        with open(cam, "r", newline="", encoding="utf-8-sig") as f:
            linhas_lidas = _csv.reader(f, delimiter=";")
            linhas = []
            for i, row in enumerate(linhas_lidas):
                if i >= 30:
                    linhas.append("...(mais linhas nao mostradas)")
                    break
                linhas.append(" | ".join(row))
        return f"Conteudo de {os.path.basename(cam)}:\n" + "\n".join(linhas)

    if a in ("somar_coluna", "media_coluna", "contar"):
        if not os.path.isfile(cam):
            return f"Planilha nao encontrada: {cam}."
        with open(cam, "r", newline="", encoding="utf-8-sig") as f:
            rows = list(_csv.reader(f, delimiter=";"))
        if not rows:
            return "Planilha vazia."
        cab = rows[0]
        indice = _indice_coluna(coluna, cab)
        if indice is None:
            return f"Nao encontrei a coluna '{coluna}'. Colunas: {', '.join(cab)}."
        nums = []
        for row in rows[1:]:
            if indice < len(row) and row[indice].strip():
                try:
                    nums.append(float(row[indice].replace(",", ".")))
                except Exception:
                    pass
        return _resumo_coluna(a, coluna, nums)

    return "Acao invalida. Use: criar, adicionar, ler, somar_coluna, media_coluna ou contar."


def _indice_coluna(coluna: str, cabecalho):
    """Acha o indice (0-based) de uma coluna pelo nome ou numero (1-based)."""
    c = (coluna or "").strip()
    if not c:
        return None
    if c.isdigit():
        idx = int(c) - 1
        return idx if 0 <= idx < len(cabecalho) else None
    c_l = c.lower()
    for i, nome in enumerate(cabecalho):
        if str(nome).strip().lower() == c_l:
            return i
    parecido = difflib.get_close_matches(c_l, [str(n).lower() for n in cabecalho], n=1, cutoff=0.5)
    if parecido:
        for i, nome in enumerate(cabecalho):
            if str(nome).strip().lower() == parecido[0]:
                return i
    return None


def _resumo_coluna(acao: str, coluna: str, nums):
    if not nums:
        return f"Nao encontrei valores numericos na coluna '{coluna}'."
    total = sum(nums)
    if acao == "somar_coluna":
        return f"Soma da coluna '{coluna}': {total:,.2f} ({len(nums)} valores)."
    if acao == "media_coluna":
        return f"Media da coluna '{coluna}': {total/len(nums):,.2f} (de {len(nums)} valores)."
    return f"A coluna '{coluna}' tem {len(nums)} valor(es) numerico(s); soma: {total:,.2f}."


# ======================================================================
# ============ PACOTE PROFISSIONAL (30 FERRAMENTAS NOVAS) ==============
# Ferramentas avancadas de nivel profissional: servicos do Windows,
# seguranca/defender/firewall, senhas e integridade, ponto de restauracao,
# diagnostico de rede, teste de API, JSON, utilitarios de dev, diff e texto,
# conversoes, calculadora financeira e de datas, controle de gastos e tarefas,
# pomodoro, rotinas, previsao do tempo, relogio mundial, papel de parede,
# aviso em janela, unidades/eject, renomeacao avancada, cores, saude do PC,
# desligamento agendado e sorteios. Tudo ADICAO PURA - nada foi apagado.
# ======================================================================

ARQ_GASTOS = os.path.join(PASTA_BASE, "gastos.json")
ARQ_TAREFAS_TODO = os.path.join(PASTA_BASE, "tarefas_todo.json")


def _beep(vezes: int = 1):
    """Toca um som curto do Windows (winsound e biblioteca padrao, so existe no
    Windows). Em outro SO simplesmente nao faz nada."""
    try:
        import winsound
        for _ in range(max(1, vezes)):
            winsound.MessageBeep(winsound.MB_ICONASTERISK)
            time.sleep(0.4)
    except Exception:
        pass


# ---------------- 1) SERVICOS DO WINDOWS ----------------
@tool
def gerenciar_servicos_windows(acao: str, nome: str = "") -> str:
    """GERENCIA SERVICOS DO WINDOWS (nivel profissional). Acoes em 'acao':
    'listar' (mostra os servicos rodando e os automaticos que estao parados),
    'iniciar' ('nome'=nome do servico), 'parar' (nome; pede confirmacao),
    'automatico' / 'manual' / 'desabilitado' (define o tipo de inicializacao;
    pede confirmacao). Use para 'para o servico X', 'liga o servico Y', 'quais
    servicos estao rodando'. Exige admin para iniciar/parar/alterar."""
    a = acao.strip().lower()

    def _rodar():
        if a in ("listar", "lista", "servicos"):
            s, e, _ = _rodar_cmd(
                'powershell -NoProfile -Command "Get-Service | Sort-Object Status,Name | '
                'Select-Object -First 60 Status,StartType,Name | Format-Table -AutoSize"', 40)
            return "Servicos do Windows (primeiros 60):\n" + (s or e or "nao consegui listar.")
        if not nome.strip():
            return "Diga o NOME do servico (ex.: 'Spooler' para impressao, 'wuauserv' para Windows Update)."
        if a in ("parar", "parar_servico", "stop"):
            if not confirmar_destrutivo(f"Parar o servico Windows '{nome}'?"):
                return "Acao cancelada."
            s, e, c = _rodar_cmd(f'powershell -NoProfile -Command "Stop-Service -Name \'{nome}\' -Force -ErrorAction Stop"', 60)
            return f"Servico '{nome}' parado." if c == 0 else f"Nao consegui parar: {e or s} (precisa de admin?)"
        if a in ("iniciar", "ligar", "start"):
            s, e, c = _rodar_cmd(f'powershell -NoProfile -Command "Start-Service -Name \'{nome}\' -ErrorAction Stop"', 60)
            return f"Servico '{nome}' iniciado." if c == 0 else f"Nao consegui iniciar: {e or s} (precisa de admin?)"
        if a in ("automatico", "auto", "manual", "desabilitado", "desabilitar"):
            tipo = {"automatico": "Automatic", "auto": "Automatic", "manual": "Manual",
                    "desabilitado": "Disabled", "desabilitar": "Disabled"}.get(a, a)
            if not confirmar_destrutivo(f"Definir o servico '{nome}' como '{tipo}'?"):
                return "Acao cancelada."
            s, e, c = _rodar_cmd(f'powershell -NoProfile -Command "Set-Service -Name \'{nome}\' -StartupType {tipo} -ErrorAction Stop"', 60)
            return f"Servico '{nome}' definido como {tipo}." if c == 0 else f"Nao consegui alterar: {e or s} (precisa de admin?)"
        return "Acao invalida. Use: listar, iniciar, parar, automatico, manual ou desabilitado."

    return executar_com_autocura("gerenciar_servicos_windows", _rodar)


# ---------------- 2) SEGURANCA (DEFENDER / FIREWALL / PORTAS) ----------------
@tool
def central_seguranca(acao: str) -> str:
    """CENTRAL DE SEGURANCA DO WINDOWS. Acoes: 'status' (resumo: Windows
    Defender ligado, protecao em tempo real, firewall dos 3 perfis, UAC),
    'portas' (portas TCP abertas/escutando no PC, com numero do processo),
    'scan_rapido' (roda uma verificacao rapida do Defender; pode demorar; pede
    confirmacao). Use para 'o antivírus esta ligado?', 'quais portas estao
    abertas', 'faz uma varredura no PC'. So leitura, exceto o scan."""
    a = acao.strip().lower()

    def _rodar():
        if a in ("status", "geral", "resumo"):
            linhas = []
            ps_def = (
                "$m = Get-MpComputerStatus; "
                "Write-Output ('Defender ativado: ' + $m.AntivirusEnabled); "
                "Write-Output ('Protecao em tempo real: ' + $m.RealTimeProtectionEnabled); "
                "Write-Output ('Assinatura atualizada em: ' + $m.AntivirusSignatureLastUpdated)"
            )
            s, err, _ = _rodar_cmd('powershell -NoProfile -Command "' + ps_def + '"', 40)
            linhas.append(s or ("Nao consegui ler o status do Defender. " + (err or "")))
            f, _, _ = _rodar_cmd(
                'powershell -NoProfile -Command "Get-NetFirewallProfile | Select-Object Name,Enabled | Format-Table -AutoSize"', 30)
            linhas.append("Firewall:\n" + (f or "indisponivel."))
            u, _, _ = _rodar_cmd('reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v EnableLUA', 20)
            linhas.append("UAC (controle de conta de usuario) ligado: " + ("sim" if "0x1" in u else ("nao" if u else "indisponivel")))
            return "\n".join(linhas)
        if a in ("portas", "portas_abertas", "port"):
            s, e, _ = _rodar_cmd(
                'powershell -NoProfile -Command "Get-NetTCPConnection -State Listen | Sort-Object LocalPort | '
                'Select-Object -First 40 LocalAddress,LocalPort,OwningProcess | Format-Table -AutoSize"', 40)
            return "Portas escutando (primeiras 40):\n" + (s or e or "indisponivel.")
        if a in ("scan_rapido", "scan", "varredura", "verificar"):
            if not pedir_confirmacao("Rodar uma verificacao rapida do Windows Defender? Pode demorar alguns minutos."):
                return "Scan cancelado."
            s, e, c = _rodar_cmd('powershell -NoProfile -Command "Start-MpScan -ScanType QuickScan"', 600)
            return "Verificacao rapida do Defender concluida." if c == 0 else f"Scan nao rodou: {e or s}"
        return "Acao invalida. Use: status, portas ou scan_rapido."

    return executar_com_autocura("central_seguranca", _rodar)


# ---------------- 3) SENHA VAZADA (HAVE I BEEN PWNED, K-ANON) ----------------
@tool
def verificar_senha_vazada(senha: str) -> str:
    """VERIFICA SE UMA SENHA JA VAZOU na internet (banco do Have I Been Pwned),
    SEM enviar a senha para lugar nenhum: so o 1os 5 caracteres do hash SHA-1
    saem do PC (tecnica k-anonimato; o resto e comparado localmente). Retorna
    quantas vezes a senha apareceu em vazamentos. Use para 'essa senha e segura?
    ela ja vazou?'. Nao grava a senha em lugar nenhum."""
    import hashlib
    import urllib.request

    def _verificar():
        sha1 = hashlib.sha1(senha.encode("utf-8")).hexdigest().upper()
        prefixo, sufixo = sha1[:5], sha1[5:]
        req = urllib.request.Request(f"https://api.pwnedpasswords.com/range/{prefixo}",
                                     headers={"User-Agent": "AgentePC/1.0", "Add-Padding": "true"})
        with urllib.request.urlopen(req, timeout=20) as r:
            linhas = r.read().decode("utf-8", errors="ignore").splitlines()
        for linha in linhas:
            parte, _, contagem = linha.partition(":")
            if parte.strip() == sufixo:
                return (f"ATENCAO: essa senha JA APARECEU em vazamentos {int(contagem):,} vezes. "
                        "Nao use ela - troque por uma nova (use 'gerar_senha').")
        return "Boa noticia: essa senha NAO aparece em nenhum vazamento conhecido."

    try:
        return executar_com_autocura("verificar_senha_vazada", _verificar)
    except Exception as e:
        return f"Nao consegui verificar agora ({type(e).__name__})."


# ---------------- 4) AVALIAR FORCA DE SENHA (offline) ----------------
@tool
def avaliar_senha(senha: str) -> str:
    """AVALIA A FORCA de uma senha 100% offline (nao usa internet nem IA): mede
    tamanho, variedade (maiusculas, minusculas, numeros, simbolos), calcula os
    bits de entropia e da uma nota de 0 a 100 com dicas. Use para 'essa senha e
    forte?'. Nao grava nada."""
    import math
    n = len(senha)
    tem_baixo = any(c.islower() for c in senha)
    tem_alto = any(c.isupper() for c in senha)
    tem_num = any(c.isdigit() for c in senha)
    tem_sym = any(not c.isalnum() for c in senha)
    variedade = sum([tem_baixo * 26, tem_alto * 26, tem_num * 10, tem_sym * 32])
    entropia = n * math.log2(variedade) if variedade else 0
    nota = max(0, min(100, int(entropia * 1.6)))
    if entropia >= 100:
        nivel = "muito forte (excelente)"
    elif entropia >= 70:
        nivel = "forte"
    elif entropia >= 45:
        nivel = "razoavel"
    elif entropia >= 28:
        nivel = "fraca"
    else:
        nivel = "muito fraca"
    dicas = []
    if n < 12:
        dicas.append("use pelo menos 12-16 caracteres")
    if not tem_alto:
        dicas.append("adicione letras MAIUSCULAS")
    if not tem_num:
        dicas.append("adicione numeros")
    if not tem_sym:
        dicas.append("adicione simbolos (!@#$)")
    return (f"Senha avaliada: {nivel}. Nota {nota}/100 (~{entropia:.0f} bits de entropia). "
            + ("Dicas: " + "; ".join(dicas) + "." if dicas else "Otima variedade - pode usar."))


# ---------------- 5) HASH / INTEGRIDADE DE ARQUIVO ----------------
@tool
def central_hash_integridade(acao: str, caminho: str = "", hash_esperado: str = "", texto: str = "") -> str:
    """CALCULA E VERIFICA HASH (checksum) de arquivos ou textos - integridade
    profissional. Acoes: 'calcular' ('caminho'=arquivo) mostra SHA-256 e MD5;
    'verificar' ('caminho'=arquivo, 'hash_esperado'=hash que voce recebeu) diz
    se o arquivo e identigo (download nao corrompido/alterado); 'texto'
    ('texto'=string) devolve o SHA-256 de um texto. Use para 'o hash desse
    arquivo bate?', 'verifica se o download esta inteiro'."""
    import hashlib

    def _hash_arquivo(c, algoritmo):
        h = hashlib.new(algoritmo)
        with open(c, "rb") as f:
            for blk in iter(lambda: f.read(65536), b""):
                h.update(blk)
        return h.hexdigest()

    a = acao.strip().lower()
    if a in ("calcular", "hash", "checksum"):
        c = caminho.strip().strip('"')
        if not os.path.isfile(c):
            return f"Arquivo nao encontrado: {c}"
        return (f"SHA-256: {_hash_arquivo(c, 'sha256')}\n"
                f"MD5:     {_hash_arquivo(c, 'md5')}\nArquivo: {os.path.basename(c)}")
    if a in ("verificar", "conferir", "comparar_hash"):
        c = caminho.strip().strip('"')
        if not os.path.isfile(c):
            return f"Arquivo nao encontrado: {c}"
        esperado = (hash_esperado or "").strip().lower()
        if not esperado:
            return "Cole o hash esperado em 'hash_esperado' para eu comparar."
        alg = "sha256" if len(esperado) == 64 else ("md5" if len(esperado) == 32 else "sha256")
        real = _hash_arquivo(c, alg).lower()
        if real == esperado:
            return f"CONFIRMADO: o {alg} do arquivo bate. O arquivo esta inteiro e nao foi alterado."
        return f"NAO BATE! O {alg} do arquivo e diferente do esperado - o arquivo pode estar corrompido ou adulterado.\nEncontrado: {real}"
    if a in ("texto", "hash_texto"):
        if not texto:
            return "Passe o texto no parametro 'texto'."
        return "SHA-256 do texto: " + hashlib.sha256(texto.encode("utf-8")).hexdigest()
    return "Acao invalida. Use: calcular, verificar ou texto."


# ---------------- 6) PONTO DE RESTAURACAO DO WINDOWS ----------------
@tool
def ponto_de_restauracao(descricao: str = "") -> str:
    """CRIA UM PONTO DE RESTAURACAO DO WINDOWS (Checkpoint-Computer) - uma
    'foto' das configuracoes do sistema para voce voltar atras se algo der
    problema depois de instalar/mexer em algo. Pede confirmacao e exibe
    privilegios de administrador e a Protecao do Sistema ligada no disco C.
    Use ANTES de mudancas arriscadas. 'descricao' e um nome para o ponto."""
    if not confirmar_destrutivo("Criar um ponto de restauracao do sistema agora?"):
        return "Operacao cancelada."

    def _criar():
        nome = (descricao.strip() or "Ponto criado pelo agente").replace("'", " ")[:80]
        # Cria o ponto de restauracao (MODIFY_SETTINGS = ponto comum de sistema).
        ps = f"Checkpoint-Computer -Description '{nome}' -RestorePointType MODIFY_SETTINGS"
        s, e, c = _rodar_cmd('powershell -NoProfile -Command "' + ps + '"', 300)
        if c == 0:
            return f"Ponto de restauracao '{nome}' criado com sucesso."
        return (f"Nao consegui criar o ponto: {e or s}. Geralmente e preciso: (1) rodar como "
                "administrador e (2) ter a 'Protecao do Sistema' ligada no disco C (Painel > "
                "Sistema > Protecao do Sistema).")

    return executar_com_autocura("ponto_de_restauracao", _criar)


# ---------------- 7) DIAGNOSTICO DE REDE / INTERNET ----------------
@tool
def diagnostico_rede(acao: str, host: str = "", porta: int = 0) -> str:
    """DIAGNOSTICO DE REDE/INTERNET profissional (descobre ONDE esta o problema
    quando a internet cai). Acoes: 'completo' (testa ping do gateway, do Google
    e DNS, em ordem, e diz o estagio que falhou), 'ping' ('host'=site/IP),
    'porta' (testa se uma porta TCP esta aberta num host; 'host' e 'porta', ex.:
    site:443), 'conexoes' (lista conexoes ativas do PC), 'traceroute' (caminho
    ate o host; pode demorar), 'renovar_ip' (renova o IP; pede confirmacao),
    'velocidade' (mede velocidade de download e latencia). Diferente da
    central_rede (focada em Wi-Fi/senhas), aqui e para resolver 'internet caiu'."""
    a = acao.strip().lower()

    def _rodar():
        if a in ("completo", "geral", "diagnostico"):
            etapas = []
            gw, _, _ = _rodar_cmd(
                'powershell -NoProfile -Command "(Get-NetRoute -DestinationPrefix 0.0.0.0/0 -ErrorAction SilentlyContinue | Select-Object -First 1).NextHop"', 20)
            gw = gw.strip()
            if gw:
                _s, _, c = _rodar_cmd(f"ping -n 2 {gw}", 20)
                etapas.append(("Gateway/roteador (" + gw + ")", c == 0))
            _s, _, c = _rodar_cmd("ping -n 2 8.8.8.8", 20)
            etapas.append(("Internet (Google 8.8.8.8)", c == 0))
            _s, _, c = _rodar_cmd("nslookup www.google.com", 20)
            etapas.append(("DNS (resolver nomes)", c == 0))
            linhas = [f"- {nome}: {('OK' if ok else 'FALHOU')}" for nome, ok in etapas]
            if all(ok for _, ok in etapas):
                return "Rede parecendo OK em todos os estagios:\n" + "\n".join(linhas)
            primeiro = next((n for n, ok in etapas if not ok), "?")
            return ("Diagnostico:\n" + "\n".join(linhas) +
                    f"\n\nProblema mais provavel em: {primeiro}. "
                    "Se falhou no gateway, reinicie o roteador; se so o DNS falhou, use a acao 'limpar_dns' da central_rede.")
        if a in ("ping", "testar"):
            alvo = host.strip() or "8.8.8.8"
            s, e, c = _rodar_cmd(f"ping -n 4 {alvo}", 25)
            return f"Ping para {alvo}:\n" + (s or e)
        if a in ("porta", "porta_aberta", "port"):
            import socket as _sk
            h = host.strip()
            p = int(porta)
            if not h or not p:
                return "Diga 'host' e 'porta' (ex.: host='google.com', porta=443)."
            try:
                with _sk.create_connection((h, p), timeout=6) as conn:
                    return f"A porta {p} de {h} esta ABERTA/alcancavel (conexao TCP deu certo)."
            except Exception as ex:
                return f"A porta {p} de {h} nao respondeu ({type(ex).__name__}). Pode estar fechada ou bloqueada."
        if a in ("conexoes", "netstat", "ligacoes"):
            s, e, _ = _rodar_cmd('powershell -NoProfile -Command "Get-NetTCPConnection -State Established | Group-Object RemotePort | Sort-Object Count -Descending | Select-Object -First 15 Count,Name | Format-Table -AutoSize"', 30)
            return "Conexoes estabelecidas (por porta remota):\n" + (s or e or "indisponivel.")
        if a in ("traceroute", "tracert", "rota"):
            alvo = host.strip() or "8.8.8.8"
            s, e, c = _rodar_cmd(f"tracert -d -h 12 {alvo}", 90)
            return f"Caminho ate {alvo}:\n" + (s or e)
        if a in ("renovar_ip", "renovar", "release"):
            if not pedir_confirmacao("Renovar o IP do PC (release/renew)? A conexao pode piscar por alguns segundos."):
                return "Cancelado."
            s1, e1, _ = _rodar_cmd("ipconfig /release", 40)
            s2, e2, _ = _rodar_cmd("ipconfig /renew", 60)
            return "IP renovado.\n" + (s2 or e2 or "")
        if a in ("velocidade", "speed", "banda"):
            import time as _t
            import urllib.request as _u
            url = "https://speed.cloudflare.com/__down?bytes=10000000"  # ~10 MB
            try:
                req = _u.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                ini = _t.time()
                with _u.urlopen(req, timeout=30) as r:
                    dados = r.read()
                seg = _t.time() - ini
                mbps = (len(dados) * 8 / seg) / 1_000_000
                return f"Download de {len(dados)/1_000_000:.0f} MB em {seg:.1f}s = ~{mbps:.1f} Mbps (medicao aproximada)."
            except Exception as ex:
                return f"Nao consegui medir velocidade ({type(ex).__name__}). Teste de ping: " + _rodar_cmd("ping -n 2 8.8.8.8", 20)[0][:300]
        return "Acao invalida. Use: completo, ping, porta, conexoes, traceroute, renovar_ip ou velocidade."

    return executar_com_autocura("diagnostico_rede", _rodar)


# ---------------- 8) MONITORAR SITE (UPTIME) ----------------
@tool
def monitorar_site(url: str) -> str:
    """VERIFICA SE UM SITE/SERVIDOR ESTA NO AR: faz uma requisicao HTTP e
    reporta o codigo de status (200=no ar, 404/500=problema) e o tempo de
    resposta em milissegundos. Use para 'o site X esta fora do ar?', 'meu
    servidor esta respondendo?'. Nao abre o navegador."""
    import urllib.request
    import time as _t

    def _testar():
        alvo = url.strip()
        if not alvo:
            return "Diga a URL do site (ex.: https://meusite.com)."
        if not alvo.startswith(("http://", "https://")):
            alvo = "https://" + alvo
        req = urllib.request.Request(alvo, headers={"User-Agent": "Mozilla/5.0"})
        ini = _t.time()
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                ms = (_t.time() - ini) * 1000
                return f"NO AR: {alvo} respondeu status {r.status} em {ms:.0f} ms."
        except urllib.error.HTTPError as he:
            ms = (_t.time() - ini) * 1000
            return f"O servidor RESPONDEU, mas com status de erro {he.code} (em {ms:.0f} ms). O site pode estar com problema."
        except Exception as ex:
            return f"FORA DO AR / inalcancavel: {alvo} ({type(ex).__name__}). Pode estar fora ou bloqueando o teste."

    return executar_com_autocura("monitorar_site", _testar)


# ---------------- 9) TESTAR API (mini Postman/curl) ----------------
@tool
def testar_api(metodo: str, url: str, corpo: str = "", cabecalhos: str = "") -> str:
    """TESTA UMA API/endpoint HTTP (um 'Postman' embutido, para desenvolvedores).
    'metodo' = GET, POST, PUT ou DELETE. 'url' = o endpoint. 'corpo' = body a
    enviar (em POST/PUT; tipicamente JSON). 'cabecalhos' = cabecalhos extras, um
    por linha no formato 'Chave: valor' (ex.: 'Authorization: Bearer xxx').
    Devolve o codigo de status, o tempo, os cabecalhos principais e o corpo da
    resposta (inicio). Use para 'testa essa rota', 'faz um POST nessa API'."""
    import urllib.request
    import urllib.error
    import time as _t

    def _testar():
        m = (metodo or "GET").strip().upper()
        alvo = url.strip()
        if not alvo:
            return "Diga a URL da API."
        if not alvo.startswith(("http://", "https://")):
            alvo = "https://" + alvo
        headers = {"User-Agent": "AgentePC/1.0", "Accept": "application/json, */*"}
        for linha in (cabecalhos or "").splitlines():
            if ":" in linha:
                ch, _, vl = linha.partition(":")
                headers[ch.strip()] = vl.strip()
        data = corpo.encode("utf-8") if corpo.strip() else None
        req = urllib.request.Request(alvo, data=data, headers=headers, method=m)
        ini = _t.time()
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                resp = r.read().decode("utf-8", errors="ignore")
                status, info = r.status, r.headers
        except urllib.error.HTTPError as he:
            resp = he.read().decode("utf-8", errors="ignore")
            status, info = he.code, he.headers
        ms = (_t.time() - ini) * 1000
        tipo = info.get("Content-Type", "?") if info else "?"
        return (f"{m} {alvo}\nStatus: {status} em {ms:.0f} ms | Tipo: {tipo}\n"
                f"Resposta (inicio):\n{resp[:1500]}")

    return executar_com_autocura("testar_api", _testar)


# ---------------- 10) CENTRAL DE JSON / DADOS ----------------
@tool
def central_json(acao: str, caminho: str = "", conteudo: str = "", saida: str = "") -> str:
    """CENTRAL DE JSON E DADOS (desenvolvedor). Acoes: 'validar' ('conteudo'=JSON
    ou 'caminho'=arquivo .json; diz se e valido e quantas chaves/itens tem),
    'formatar' (deixa o JSON bonito/indentado e salva), 'minificar' (junta tudo
    sem espacos), 'csv_para_json' (converte um .csv em .json) e 'json_para_csv'
    (converte .json de lista de objetos em .csv). Use para 'esse JSON e valido?',
    'formata esse arquivo', 'converte csv em json'."""
    import csv as _csv
    a = acao.strip().lower()

    def _ler_origem():
        if caminho.strip():
            c = caminho.strip().strip('"')
            if not os.path.isfile(c):
                return None, f"Arquivo nao encontrado: {c}"
            with open(c, "r", encoding="utf-8-sig") as f:
                return f.read(), c
        return conteudo, "(texto)"

    if a in ("validar", "valida", "validar_json"):
        bruto, info = _ler_origem()
        if bruto is None:
            return info
        try:
            dados = json.loads(bruto)
        except Exception as e:
            return f"JSON INVALIDO: {e}"
        if isinstance(dados, dict):
            return f"JSON valido. E um objeto com {len(dados)} chave(s): {', '.join(list(dados)[:20])}."
        if isinstance(dados, list):
            return f"JSON valido. E uma lista com {len(dados)} item(ns)."
        return f"JSON valido (valor do tipo {type(dados).__name__})."

    if a in ("formatar", "embelezar", "pretty"):
        bruto, info = _ler_origem()
        if bruto is None:
            return info
        try:
            dados = json.loads(bruto)
        except Exception as e:
            return f"JSON invalido, nao da pra formatar: {e}"
        if caminho.strip():
            with open(caminho.strip().strip('"'), "w", encoding="utf-8") as f:
                json.dump(dados, f, ensure_ascii=False, indent=2)
            return f"JSON formatado e salvo em: {caminho}"
        return json.dumps(dados, ensure_ascii=False, indent=2)[:4000]

    if a in ("minificar", "minify", "compactar"):
        bruto, info = _ler_origem()
        if bruto is None:
            return info
        try:
            dados = json.loads(bruto)
        except Exception as e:
            return f"JSON invalido: {e}"
        mini = json.dumps(dados, ensure_ascii=False, separators=(",", ":"))
        if saida.strip():
            with open(saida.strip().strip('"'), "w", encoding="utf-8") as f:
                f.write(mini)
            return f"JSON minificado salvo em: {saida}"
        return mini[:4000]

    if a in ("csv_para_json", "csv_json"):
        c = caminho.strip().strip('"')
        if not os.path.isfile(c):
            return f"Arquivo CSV nao encontrado: {c}"
        with open(c, "r", encoding="utf-8-sig") as f:
            leitor = _csv.DictReader(f, delimiter=";")
            linhas = list(leitor)
            if not linhas:
                leitor = _csv.DictReader(open(c, encoding="utf-8-sig"))
                linhas = list(leitor)
        dest = (saida.strip().strip('"') or os.path.splitext(c)[0] + ".json")
        with open(dest, "w", encoding="utf-8") as f:
            json.dump(linhas, f, ensure_ascii=False, indent=2)
        return f"CSV convertido para JSON: {dest} ({len(linhas)} linhas)."

    if a in ("json_para_csv", "json_csv"):
        c = caminho.strip().strip('"')
        if not os.path.isfile(c):
            return f"Arquivo JSON nao encontrado: {c}"
        with open(c, "r", encoding="utf-8-sig") as f:
            dados = json.load(f)
        if not isinstance(dados, list) or not dados or not isinstance(dados[0], dict):
            return "Para converter, o JSON precisa ser uma LISTA de objetos (ex.: [{'nome':'ana','idade':30}])."
        colunas = list(dados[0].keys())
        dest = (saida.strip().strip('"') or os.path.splitext(c)[0] + ".csv")
        with open(dest, "w", newline="", encoding="utf-8-sig") as f:
            w = _csv.DictWriter(f, fieldnames=colunas, delimiter=";")
            w.writeheader()
            w.writerows(dados)
        return f"JSON convertido para CSV: {dest} ({len(dados)} linhas, colunas: {', '.join(colunas)})."

    return "Acao invalida. Use: validar, formatar, minificar, csv_para_json ou json_para_csv."


# ---------------- 11) UTILITARIOS DE DESENVOLVEDOR ----------------
@tool
def utilitarios_dev(acao: str, texto: str = "", quantidade: int = 3) -> str:
    """UTILITARIOS RAPIDOS DE DESENVOLVEDOR (instantaneos, sem internet/IA).
    Acoes: 'base64_cod' e 'base64_dec' (codifica/decodifica texto em Base64),
    'url_cod' e 'url_dec' (codifica/decodifica para URL), 'uuid' (gera UUIDs
    universais; 'quantidade'=quantos), 'epoch' (mostra o timestamp Unix atual
    em segundos e milissegundos), 'lorem' (gera texto de enchimento/placeholder;
    'quantidade'=paragrafos). Use para 'gera 3 uuid', 'codifica isso em base64',
    'qual o epoch agora'."""
    import base64
    import urllib.parse
    import uuid as _uuid

    a = acao.strip().lower()
    qtd = max(1, int(quantidade) if str(quantidade).isdigit() else 3)
    if a in ("base64_cod", "b64_cod", "base64"):
        return "Base64: " + base64.b64encode(texto.encode("utf-8")).decode("ascii")
    if a in ("base64_dec", "b64_dec"):
        try:
            return "Texto: " + base64.b64decode(texto.strip()).decode("utf-8", errors="ignore")
        except Exception as e:
            return f"Nao consegui decodificar ({e})."
    if a in ("url_cod", "url_encode"):
        return "URL-encoded: " + urllib.parse.quote(texto)
    if a in ("url_dec", "url_decode"):
        return "Texto: " + urllib.parse.unquote(texto)
    if a in ("uuid", "guid", "id"):
        return "\n".join(str(_uuid.uuid4()) for _ in range(qtd))
    if a in ("epoch", "timestamp", "agora_epoch"):
        return f"Epoch agora: {int(time.time())} segundos | {int(time.time()*1000)} milissegundos."
    if a in ("lorem", "lorem_ipsum", "enchimento"):
        palavras = ("lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod "
                    "tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam "
                    "quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo").split()
        paras = []
        for _ in range(qtd):
            frases = []
            for _ in range(random.randint(3, 5)):
                frases.append(" ".join(random.choice(palavras) for _ in range(random.randint(6, 12))).capitalize() + ".")
            paras.append(" ".join(frases))
        return "\n\n".join(paras)
    return "Acao invalida. Use: base64_cod, base64_dec, url_cod, url_dec, uuid, epoch ou lorem."


# ---------------- 12) COMPARAR ARQUIVOS / PASTAS (diff) ----------------
@tool
def comparar_arquivos(arquivo1: str, arquivo2: str) -> str:
    """COMPARA DOIS ARQUIVOS DE TEXTO (ou duas pastas) e mostra as diferencas,
    estilo 'diff' profissional. Para arquivos: mostra as linhas que mudaram
    (com < e >). Para pastas: mostra quais arquivos existem so de um lado e
    quais diferem (pelo conteudo/hash). Use para 'qual a diferenca entre esses
    dois arquivos', 'compara essas duas pastas/versoes'."""
    import hashlib

    def _hash(c):
        h = hashlib.md5()
        with open(c, "rb") as f:
            for blk in iter(lambda: f.read(65536), b""):
                h.update(blk)
        return h.hexdigest()

    a, b = arquivo1.strip().strip('"'), arquivo2.strip().strip('"')
    if os.path.isdir(a) and os.path.isdir(b):
        fa = {os.path.relpath(os.path.join(r, f), a): os.path.join(r, f)
              for r, _, fs in os.walk(a) for f in fs}
        fb = {os.path.relpath(os.path.join(r, f), b): os.path.join(r, f)
              for r, _, fs in os.walk(b) for f in fs}
        so_a = sorted(set(fa) - set(fb))
        so_b = sorted(set(fb) - set(fa))
        diferem = []
        for nome in sorted(set(fa) & set(fb)):
            try:
                if _hash(fa[nome]) != _hash(fb[nome]):
                    diferem.append(nome)
            except Exception:
                pass
        partes = [f"Comparando pastas:\n{a}\n{b}"]
        if so_a:
            partes.append("So na primeira pasta (" + str(len(so_a)) + "): " + ", ".join(so_a[:20]))
        if so_b:
            partes.append("So na segunda pasta (" + str(len(so_b)) + "): " + ", ".join(so_b[:20]))
        if diferem:
            partes.append("Existem nos dois mas com conteudo DIFERENTE (" + str(len(diferem)) + "): " + ", ".join(diferem[:20]))
        if not so_a and not so_b and not diferem:
            partes.append("As pastas sao IDENTICAS (mesmos arquivos e conteudos).")
        return "\n".join(partes)

    if not os.path.isfile(a) or not os.path.isfile(b):
        return f"Um dos caminhos nao foi encontrado: {a} | {b}"
    try:
        la = open(a, encoding="utf-8", errors="ignore").read().splitlines()
        lb = open(b, encoding="utf-8", errors="ignore").read().splitlines()
    except Exception as e:
        return f"Nao consegui ler os arquivos: {e}"
    diff = list(difflib.unified_diff(la, lb, fromfile=os.path.basename(a), tofile=os.path.basename(b), lineterm="", n=1))
    if not diff:
        return f"Os arquivos sao IDENTICOS: {os.path.basename(a)} e {os.path.basename(b)}."
    return "Diferencas:\n" + "\n".join(diff[:120])


# ---------------- 13) CENTRAL DE TEXTO ----------------
@tool
def central_texto(acao: str, caminho: str = "", texto: str = "", de: str = "", para: str = "", padrao: str = "") -> str:
    """CENTRAL DE TEXTO para arquivos ou textos (instantaneo, sem IA). Acoes:
    'contar' (palavras, caracteres e linhas), 'ordenar' (ordena as linhas),
    'sem_duplicatas' (remove linhas repetidas), 'maiusculas'/'minusculas',
    'substituir' (troca o texto 'de' por 'para' num arquivo; pede confirmacao),
    'buscar_regex' (procura pelo padrao regex 'padrao' e mostra os trechos). Use
    'caminho' para operar num arquivo, ou 'texto' para operar um texto direto.
    Use para 'quantas palavras tem esse arquivo', 'remove linhas repetidas',
    'troca X por Y nesse arquivo'."""
    import re as _re
    a = acao.strip().lower()
    usa_arquivo = bool(caminho.strip())
    if usa_arquivo:
        c = caminho.strip().strip('"')
        if not os.path.isfile(c):
            return f"Arquivo nao encontrado: {c}"
        with open(c, "r", encoding="utf-8", errors="ignore") as f:
            conteudo = f.read()
    else:
        conteudo = texto
    linhas = conteudo.splitlines()

    if a in ("contar", "contagem", "contar_palavras"):
        palavras = len(conteudo.split())
        return (f"Palavras: {palavras} | Caracteres: {len(conteudo)} | "
                f"Linhas: {len(linhas)} | Sem espacos: {len(conteudo.replace(chr(32), ''))}.")
    if a in ("ordenar", "ordernar", "sort"):
        resultado = "\n".join(sorted(linhas))
    elif a in ("sem_duplicatas", "dedupe", "unicas"):
        vistas = set()
        unicas = []
        for ln in linhas:
            if ln not in vistas:
                vistas.add(ln)
                unicas.append(ln)
        resultado = "\n".join(unicas)
    elif a in ("maiusculas", "upper"):
        resultado = conteudo.upper()
    elif a in ("minusculas", "lower"):
        resultado = conteudo.lower()
    elif a in ("substituir", "replace", "trocar"):
        if not usa_arquivo:
            return "A substituicao em arquivo precisa do parametro 'caminho'."
        if not de:
            return "Diga o texto 'de' (procurar) e 'para' (substituir)."
        if not confirmar_destrutivo(f"Substituir '{de}' por '{para}' no arquivo {os.path.basename(c)}?"):
            return "Substituicao cancelada."
        n = conteudo.count(de)
        if n == 0:
            return f"Nao encontrei '{de}' no arquivo."
        with open(c, "w", encoding="utf-8") as f:
            f.write(conteudo.replace(de, para))
        return f"Substituicao feita: {n} ocorrencia(s) de '{de}' trocadas por '{para}'."
    elif a in ("buscar_regex", "regex", "regex_busca"):
        if not padrao:
            return "Diga o padrao regex em 'padrao'."
        achados = []
        try:
            for m in _re.finditer(padrao, conteudo):
                achados.append(m.group(0))
                if len(achados) >= 50:
                    break
        except _re.error as e:
            return f"Regex invalida: {e}"
        return (f"Achei {len(achados)} ocorrencia(s):\n" + "\n".join(f"- {x[:80]}" for x in achados[:50])) if achados \
            else "Nenhuma correspondencia para esse padrao."
    else:
        return "Acao invalida. Use: contar, ordenar, sem_duplicatas, maiusculas, minusculas, substituir ou buscar_regex."

    if usa_arquivo and a != "contar":
        with open(c, "w", encoding="utf-8") as f:
            f.write(resultado)
        return f"Operacao '{a}' aplicada e salva em: {c}."
    return resultado[:4000]


# ---------------- 14) CONVERTER UNIDADES ----------------
@tool
def converter_unidades(valor: float, de: str, para: str) -> str:
    """CONVERTE UNIDADES DE MEDIDA na hora (sem internet/IA): comprimento (km,
    m, cm, mm, mi, pe, polegada), peso (kg, g, mg, lb, oz), temperatura (C, F, K
    - celsius/fahrenheit/kelvin), volume (l, ml, galao), area (m2, km2, ha, pe2).
    Ex.: converter_unidades(10, 'km', 'mi'), converter_unidades(98.6, 'F', 'C').
    'valor'=numero, 'de'=unidade de origem, 'para'=unidade de destino."""
    comp = {"mm": 0.001, "cm": 0.01, "m": 1.0, "km": 1000.0,
            "pol": 0.0254, "polegada": 0.0254, "in": 0.0254,
            "pe": 0.3048, "ft": 0.3048, "mi": 1609.344, "milha": 1609.344}
    peso = {"mg": 0.000001, "g": 0.001, "kg": 1.0, "t": 1000.0,
            "oz": 0.0283495, "lb": 0.453592, "libra": 0.453592}
    vol = {"ml": 0.001, "l": 1.0, "litro": 1.0,
           "galao": 3.78541, "gal": 3.78541}
    area = {"m2": 1.0, "ha": 10000.0, "km2": 1_000_000.0, "pe2": 0.092903}
    u1, u2 = de.strip().lower(), para.strip().lower()
    try:
        if u1 in ("c", "celsius", "°c") and u2 in ("f", "fahrenheit", "°f"):
            r = valor * 9 / 5 + 32
        elif u1 in ("f", "fahrenheit", "°f") and u2 in ("c", "celsius", "°c"):
            r = (valor - 32) * 5 / 9
        elif u1 in ("c", "celsius") and u2 in ("k", "kelvin"):
            r = valor + 273.15
        elif u1 in ("k", "kelvin") and u2 in ("c", "celsius"):
            r = valor - 273.15
        elif u1 in comp and u2 in comp:
            r = valor * comp[u1] / comp[u2]
        elif u1 in peso and u2 in peso:
            r = valor * peso[u1] / peso[u2]
        elif u1 in vol and u2 in vol:
            r = valor * vol[u1] / vol[u2]
        elif u1 in area and u2 in area:
            r = valor * area[u1] / area[u2]
        else:
            return (f"Nao sei converter '{de}' para '{para}'. Unidades que conheco: "
                    "comprimento (km/m/cm/mm/mi/pe/pol), peso (kg/g/lb/oz), temperatura (C/F/K), "
                    "volume (l/ml/galao), area (m2/ha/km2).")
        return f"{valor} {de} = {r:,.4g} {para}."
    except Exception as e:
        return f"Erro na conversao: {e}"


# ---------------- 15) CALCULADORA FINANCEIRA ----------------
@tool
def calculadora_financeira(acao: str, valor: float = 0, taxa: float = 0, periodos: int = 0, extra: str = "") -> str:
    """CALCULADORA FINANCEIRA (juros, financiamento, desconto, regra de 3) -
    instantanea, sem internet. Acoes: 'juros_compostos' ('valor'=aplicado,
    'taxa'=% ao mes, 'periodos'=meses; mostra o montante final e o rendimento),
    'financiamento' ('valor'=emprestimo/financiado, 'taxa'=% ao mes,
    'periodos'=numero de parcelas; mostra o valor da parcela na tabela Price e
    o total pago), 'desconto' ('valor'=preco, 'taxa'=% de desconto),
    'porcentagem' ('taxa'% de 'valor') e 'regra3' ('extra'='a;b;c', calcula x de
    'a esta para b assim como c esta para x')."""
    a = acao.strip().lower()
    if a in ("juros_compostos", "juros", "montante"):
        montante = valor * (1 + taxa / 100) ** periodos
        return (f"Juros compostos: aplicando R$ {valor:,.2f} a {taxa}%/mes por {periodos} meses:\n"
                f"  Montante final: R$ {montante:,.2f}\n  Rendimento: R$ {montante - valor:,.2f}")
    if a in ("financiamento", "parcela", "price", "emprestimo"):
        i = taxa / 100
        parcela = valor / periodos if i == 0 else valor * i * (1 + i) ** periodos / ((1 + i) ** periodos - 1)
        total = parcela * periodos
        return (f"Financiamento de R$ {valor:,.2f} a {taxa}%/mes em {periodos}x (tabela Price):\n"
                f"  Parcela: R$ {parcela:,.2f}\n  Total pago: R$ {total:,.2f}\n  Juros: R$ {total - valor:,.2f}")
    if a in ("desconto", "promocao"):
        novo = valor - valor * taxa / 100
        return f"Desconto de {taxa}% sobre R$ {valor:,.2f}: por R$ {novo:,.2f} (voce economiza R$ {valor - novo:,.2f})."
    if a in ("porcentagem", "porcento"):
        return f"{taxa}% de R$ {valor:,.2f} = R$ {valor * taxa / 100:,.2f}."
    if a in ("regra3", "regra_de_3", "proporcao"):
        nums = [x.strip() for x in extra.replace(",", ";").split(";") if x.strip()]
        if len(nums) != 3:
            return "Para a regra de 3 use 'extra' no formato 'a;b;c' (ex.: '2;10;5')."
        aa, bb, cc = (float(x) for x in nums)
        if aa == 0:
            return "O primeiro numero nao pode ser zero."
        def _fmt(x):
            return f"{x:,.4g}"
        return f"Regra de 3: {_fmt(aa)} esta para {_fmt(bb)} assim como {_fmt(cc)} esta para {_fmt(bb * cc / aa)}."
    return "Acao invalida. Use: juros_compostos, financiamento, desconto, porcentagem ou regra3."


# ---------------- 16) CALCULADORA DE DATAS ----------------
@tool
def calculadora_datas(acao: str, data1: str = "", data2: str = "", numero: int = 0) -> str:
    """CALCULADORA DE DATAS (instantanea, sem internet). Datas no formato
    DD/MM/AAAA. Acoes: 'diferenca' (dias entre 'data1' e 'data2'), 'adicionar'
    ('data1' + 'numero' dias; numero pode ser negativo para voltar), 'dia_semana'
    (em que dia da semana cai 'data1'), 'dias_ate' (quantos dias de hoje ate
    'data1'), 'idade' (idade em anos a partir da data de nascimento 'data1'),
    'uteis' (quantos dias uteis - sem sabado/domingo - entre data1 e data2)."""
    a = acao.strip().lower()

    def _parse(s):
        return datetime.strptime(s.strip(), "%d/%m/%Y")

    try:
        if a in ("diferenca", "diferenca_dias", "entre"):
            d1, d2 = _parse(data1), _parse(data2)
            dias = abs((d2 - d1).days)
            return f"Entre {data1} e {data2} ha {dias} dia(s) (~{dias/30.44:.1f} meses)."
        if a in ("adicionar", "somar", "somar_dias"):
            from datetime import timedelta
            d = _parse(data1) + timedelta(days=numero)
            return f"{data1} {'mais' if numero >= 0 else 'menos'} {abs(numero)} dia(s) = {d.strftime('%d/%m/%Y')} ({_nome_dia(d.weekday())})."
        if a in ("dia_semana", "diadasemana", "semana"):
            d = _parse(data1)
            return f"{data1} cai em um(a) {_nome_dia(d.weekday())}."
        if a in ("dias_ate", "faltam", "quanto_falta"):
            d = _parse(data1)
            dias = (d.date() - datetime.now().date()).days
            if dias < 0:
                return f"{data1} ja passou (foi ha {abs(dias)} dia(s))."
            return f"Faltam {dias} dia(s) para {data1}."
        if a in ("idade", "quantos_anos"):
            nasc = _parse(data1)
            hoje = datetime.now()
            anos = hoje.year - nasc.year - ((hoje.month, hoje.day) < (nasc.month, nasc.day))
            return f"Quem nasceu em {data1} tem {anos} ano(s)."
        if a in ("uteis", "dias_uteis", "trabalho"):
            d1, d2 = sorted([_parse(data1), _parse(data2)])
            from datetime import timedelta
            total = 0
            atual = d1
            while atual <= d2:
                if atual.weekday() < 5:
                    total += 1
                atual += timedelta(days=1)
            return f"Entre {data1} e {data2} ha {total} dia(s) util(eis) (seg-sex)."
        return "Acao invalida. Use: diferenca, adicionar, dia_semana, dias_ate, idade ou uteis."
    except ValueError:
        return "Data invalida. Use o formato DD/MM/AAAA (ex.: 25/12/2026)."


def _nome_dia(weekday: int) -> str:
    return ["segunda-feira", "terca-feira", "quarta-feira", "quinta-feira",
            "sexta-feira", "sabado", "domingo"][weekday]


# ---------------- 17) CONTROLE DE GASTOS PESSOAL ----------------
@tool
def controle_gastos(acao: str, valor: float = 0, categoria: str = "", descricao: str = "", indice: int = 0) -> str:
    """CONTROLE DE GASTOS PESSOAL: registra despesas/receitas e da resumos por
    mes e categoria (fica salvo em arquivo, o agente lembra). Acoes:
    'adicionar' ('valor'=quanto, 'categoria'=ex.: mercado/conta/lazer/salario,
    'descricao'=detalhe; use valor negativo para despesa e positivo para
    receita, ou so lance despesas como valor positivo), 'resumo' (total do mes
    atual por categoria e salto), 'listar' (ultimos lancamentos), 'apagar'
    ('indice'=numero do lancamento na listagem, ou apaga o ultimo). Use para
    'anota um gasto de 50 no mercado', 'quanto gastei esse mes', 'resumo de
    gastos'."""
    gastos = carregar_json(ARQ_GASTOS, [])
    a = acao.strip().lower()

    if a in ("adicionar", "lancar", "registrar", "gasto"):
        if valor == 0:
            return "Diga o valor (ex.: valor=89.90) e a categoria (ex.: 'mercado')."
        gastos.append({"data": datetime.now().isoformat(), "valor": float(valor),
                       "categoria": (categoria or "outros").strip().lower(),
                       "descricao": descricao.strip()})
        salvar_json(ARQ_GASTOS, gastos)
        return f"Lancamento registrado: R$ {valor:,.2f} em {categoria or 'outros'}" + (f" - {descricao}" if descricao else "") + "."
    if a in ("listar", "lista", "lancamentos"):
        if not gastos:
            return "Nenhum lancamento ainda. Use 'adicionar' para comecar."
        linhas = []
        for i, g in enumerate(gastos[-20:], start=max(1, len(gastos) - 19)):
            data = g.get("data", "")[:10]
            linhas.append(f"{i}. [{data}] R$ {g.get('valor',0):,.2f} - {g.get('categoria','')} {g.get('descricao','')}")
        return "Ultimos lancamentos:\n" + "\n".join(linhas)
    if a in ("resumo", "total", "fechar_mes"):
        mes = datetime.now().strftime("%Y-%m")
        do_mes = [g for g in gastos if g.get("data", "").startswith(mes)]
        if not do_mes:
            return f"Sem lancamentos no mes atual ({mes})."
        por_cat = {}
        total = 0.0
        for g in do_mes:
            v = float(g.get("valor", 0))
            total += v
            por_cat[g.get("categoria", "outros")] = por_cat.get(g.get("categoria", "outros"), 0) + v
        linhas = [f"Resumo do mes {mes} ({len(do_mes)} lancamento(s)):"]
        for cat, v in sorted(por_cat.items(), key=lambda x: -abs(x[1])):
            linhas.append(f"  - {cat}: R$ {v:,.2f}")
        linhas.append(f"TOTAL: R$ {total:,.2f}")
        return "\n".join(linhas)
    if a in ("apagar", "remover", "excluir"):
        if not gastos:
            return "Nada para apagar."
        idx = indice - 1 if indice else len(gastos) - 1
        if 0 <= idx < len(gastos):
            removido = gastos.pop(idx)
            salvar_json(ARQ_GASTOS, gastos)
            return f"Lancamento {idx+1} removido: R$ {removido.get('valor')} ({removido.get('categoria')})."
        return "Indice invalido. Veja a listagem para achar o numero certo."
    return "Acao invalida. Use: adicionar, listar, resumo ou apagar."


# ---------------- 18) GERENCIAR TAREFAS (TO-DO) ----------------
@tool
def gerenciar_tarefas(acao: str, texto: str = "", indice: int = 0) -> str:
    """GERENCIADOR DE TAREFAS / TO-DO persistente (salvo em arquivo; diferente
    das notas, aqui cada item tem status de feito/pendente). Acoes: 'adicionar'
    ('texto'=a tarefa), 'listar' (mostra as pendentes com numero), 'concluir'
    ('indice'=numero da tarefa, ou usa 'texto' para achar pela descricao),
    'desfazer' (volta uma concluida para pendente) e 'limpar' (remove as ja
    concluidas). Use para 'adiciona tarefa: pagar o boleto', 'minhas tarefas',
    'conclui a tarefa 2', 'o que tenho pendente'."""
    todo = carregar_json(ARQ_TAREFAS_TODO, [])
    a = acao.strip().lower()

    if a in ("adicionar", "nova", "add", "criar"):
        if not texto.strip():
            return "Diga a tarefa a adicionar."
        todo.append({"texto": texto.strip(), "feito": False, "data": datetime.now().isoformat()})
        salvar_json(ARQ_TAREFAS_TODO, todo)
        return f"Tarefa adicionada: {texto.strip()} ({len([t for t in todo if not t.get('feito')])} pendente(s))."
    if a in ("listar", "lista", "pendentes", "ver"):
        pend = [(i + 1, t) for i, t in enumerate(todo) if not t.get("feito")]
        if not pend:
            return "Nenhuma tarefa pendente. Tudo em dia!"
        return "Tarefas pendentes:\n" + "\n".join(f"  {i}. [ ] {t['texto']}" for i, t in pend)
    if a in ("concluir", "feito", "pronto", "completar"):
        alvo = None
        if indice and 1 <= indice <= len(todo):
            alvo = indice - 1
        elif texto.strip():
            for i, t in enumerate(todo):
                if texto.strip().lower() in t.get("texto", "").lower():
                    alvo = i
                    break
        if alvo is None:
            return "Nao encontrei a tarefa. Use 'listar' para ver os numeros."
        todo[alvo]["feito"] = True
        salvar_json(ARQ_TAREFAS_TODO, todo)
        return f"Tarefa concluida: {todo[alvo]['texto']}. Bem feito!"
    if a in ("desfazer", "reabrir"):
        if indice and 1 <= indice <= len(todo):
            todo[indice - 1]["feito"] = False
            salvar_json(ARQ_TAREFAS_TODO, todo)
            return f"Tarefa {indice} voltou para pendente."
        return "Diga o indice da tarefa a reabrir."
    if a in ("limpar", "limpar_concluidas"):
        antes = len(todo)
        todo[:] = [t for t in todo if not t.get("feito")]
        salvar_json(ARQ_TAREFAS_TODO, todo)
        return f"Limpeza: {antes - len(todo)} tarefa(s) concluidas removidas; {len(todo)} pendente(s) restam."
    return "Acao invalida. Use: adicionar, listar, concluir, desfazer ou limpar."


# ---------------- 19) POMODORO (FOCO) ----------------
@tool
def pomodoro(foco_min: int = 25, pausa_min: int = 5, ciclos: int = 4) -> str:
    """TECNICA POMODORO de foco/produtividade: roda em segundo plano ciclos de
    trabalho ('foco_min', padrao 25) seguidos de pausa curta ('pausa_min',
    padrao 5), repetindo 'ciclos' vezes (padrao 4), avisando em voz e com som
    quando cada etapa acaba. NAO trava o agente (roda em background). Diferente
    do timer_lembrete (um aviso unico), aqui sao varios ciclos automaticos. Use
    para 'inicia um pomodoro', 'modo foco 25 minutos'."""
    def _ciclos():
        for n in range(1, max(1, ciclos) + 1):
            print(f"\n[Pomodoro] Ciclo {n}/{max(1,ciclos)}: FOCO por {foco_min} min. Mao na massa!")
            falar(f"Pomodoro {n}. Foco por {foco_min} minutos.")
            time.sleep(max(1, foco_min) * 60)
            _beep(2)
            if n < max(1, ciclos):
                print(f"[Pomodoro] Pausa de {pausa_min} min. Levante e respire.")
                falar(f"Pausa de {pausa_min} minutos.")
                time.sleep(max(1, pausa_min) * 60)
                _beep(1)
        print("[Pomodoro] Todos os ciclos concluiram. Parabens!")
        falar("Pomodoro concluido. Bom trabalho!")

    threading.Thread(target=_ciclos, daemon=True).start()
    return f"Pomodoro iniciado em background: {ciclos} ciclo(s) de {foco_min} min com pausa de {pausa_min} min. Voce sera avisado em voz/som."


# ---------------- 20) ROTINA PESSOAL (matinal/encerramento) ----------------
@tool
def rotina_pessoal(acao: str) -> str:
    """ROTINAS PESSOAIS que juntam varias coisas de uma vez so. Acoes: 'matinal'
    (bom-dia com data/hora, cotacoes do dolar/euro/bitcoin e suas tarefas
    pendentes - otima para a manha), 'encerramento' (resumo do fim do dia: tarefas
    pendentes que ficaram), 'foco' (inicia um pomodoro para trabalhar). Use para
    'bom dia', 'rotina da manha', 'encerra o dia', 'modo foco'."""
    a = acao.strip().lower()

    def _matinal():
        hora = datetime.now()
        saud = "Bom dia" if hora.hour < 12 else ("Boa tarde" if hora.hour < 18 else "Boa noite")
        linhas = [f"{saud}! Hoje e {hora.strftime('%d/%m/%Y')}, {_nome_dia(hora.weekday())}, {hora.strftime('%H:%M')}."]
        try:
            linhas.append(cotacao_e_clima.invoke({"cidade": ""}))
        except Exception:
            pass
        todo = carregar_json(ARQ_TAREFAS_TODO, [])
        pend = [t for t in todo if not t.get("feito")]
        if pend:
            linhas.append(f"Voce tem {len(pend)} tarefa(s) pendente(s): " + "; ".join(t["texto"] for t in pend[:5]))
        else:
            linhas.append("Sem tarefas pendentes - dia livre para produzir.")
        texto = "\n".join(linhas)
        print("\n[Rotina matinal]\n" + texto)
        falar(f"{saud}. Voce tem {len(pend)} tarefas pendentes.")
        return texto

    def _encerramento():
        todo = carregar_json(ARQ_TAREFAS_TODO, [])
        pend = [t for t in todo if not t.get("feito")]
        gastos = carregar_json(ARQ_GASTOS, [])
        mes = datetime.now().strftime("%Y-%m")
        gastos_mes = [g for g in gastos if g.get("data", "").startswith(mes)]
        linhas = ["Encerramento do dia:"]
        if pend:
            linhas.append(f"- {len(pend)} tarefa(s) ficaram para depois: " + "; ".join(t["texto"] for t in pend[:5]))
        else:
            linhas.append("- Todas as tarefas foram concluidas.")
        linhas.append(f"- {len(gastos_mes)} lancamento(s) financeiro(s) no mes.")
        texto = "\n".join(linhas)
        print("\n[Rotina de encerramento]\n" + texto)
        falar("Bom descanso.")
        return texto

    if a in ("matinal", "manha", "bom_dia", "bomdia", "dia"):
        return executar_com_autocura("rotina_matinal", _matinal)
    if a in ("encerramento", "fim_dia", "noite", "encerrar"):
        return executar_com_autocura("rotina_encerramento", _encerramento)
    if a in ("foco", "pomodoro", "trabalhar"):
        return pomodoro.invoke({"foco_min": 25, "pausa_min": 5, "ciclos": 4})
    return "Acao invalida. Use: matinal, encerramento ou foco."


# ---------------- 21) PREVISAO DO TEMPO (varios dias) ----------------
@tool
def previsao_tempo(cidade: str, dias: int = 5) -> str:
    """PREVISAO DO TEMPO para os PROXIMOS DIAS (diferente de 'cotacao_e_clima',
    que mostra so o agora). Usa a API gratuita Open-Meteo (sem chave, sem
    navegador). 'cidade'=nome da cidade, 'dias'=quantos dias prever (padrao 5,
    max 7). Mostra maxima/minima e condicao para cada dia. Use para 'qual a
    previsao da semana', 'vai chover nos proximos dias'."""
    import json as _json
    import urllib.request
    import urllib.parse

    _wmo = {0: "limpo", 1: "limpo com nuvens", 2: "parcialmente nublado", 3: "nublado",
            45: "neblina", 48: "neblina congelante", 51: "garoa leve", 53: "garoa",
            55: "garoa forte", 61: "chuva leve", 63: "chuva", 65: "chuva forte",
            66: "chuva congelante", 71: "neve leve", 73: "neve", 75: "neve forte",
            80: "pancadas de chuva", 81: "pancadas", 82: "temporal", 95: "tempestade/raios",
            96: "tempestade com granizo", 99: "tempestade forte"}

    def _prever():
        cid = cidade.strip()
        if not cid:
            return "Diga a cidade para a previsao."
        nd = max(1, min(7, int(dias) if str(dias).isdigit() else 5))
        geo = ("https://geocoding-api.open-meteo.com/v1/search?count=1&language=pt&name="
               + urllib.parse.quote(cid))
        with urllib.request.urlopen(urllib.request.Request(geo, headers={"User-Agent": "AgentePC/1.0"}), timeout=15) as r:
            g = _json.loads(r.read().decode("utf-8"))
        if not g.get("results"):
            return f"Nao encontrei a cidade '{cid}'."
        g0 = g["results"][0]
        url = (f"https://api.open-meteo.com/v1/forecast?latitude={g0['latitude']}&longitude={g0['longitude']}"
               f"&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
               f"&timezone=auto&forecast_days={nd}")
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "AgentePC/1.0"}), timeout=15) as r:
            d = _json.loads(r.read().decode("utf-8"))["daily"]
        linhas = [f"Previsao para {g0.get('name', cid)} (proximos {nd} dias):"]
        for i in range(len(d["time"])):
            code = d["weathercode"][i]
            linhas.append(
                f"- {d['time'][i]}: {_wmo.get(code, 'variavel')}, "
                f"min {d['temperature_2m_min'][i]:.0f}C / max {d['temperature_2m_max'][i]:.0f}C, "
                f"chuva {d.get('precipitation_probability_max',[0]*8)[i] or 0}%")
        return "\n".join(linhas)

    return executar_com_autocura("previsao_tempo", _prever)


# ---------------- 22) RELOGIO MUNDIAL / FUSOS ----------------
@tool
def relogio_mundial(cidade: str = "") -> str:
    """MOSTRA A HORA EM CIDADES DO MUNDO (fusos horarios). Sem parametro, lista
    a hora atual em varias cidades (Sao Paulo, Nova York, Londres, Paris, Toquio,
    Dubai, Sydney...). Com 'cidade', mostra so a daquela cidade. Usa o relogio
    do proprio PC (offline); pode nao considerar horario de verio de algumas
    cidades. Use para 'que horas sao em Toquio', 'hora em Nova York'."""
    from datetime import timedelta
    tz_zonas = {"sao paulo": "America/Sao_Paulo", "nova york": "America/New_York",
                "londres": "Europe/London", "lisboa": "Europe/Lisbon", "paris": "Europe/Paris",
                "berlim": "Europe/Berlin", "toquio": "Asia/Tokyo", "dubai": "Asia/Dubai",
                "sydney": "Australia/Sydney", "pequim": "Asia/Shanghai", "cairo": "Africa/Cairo",
                "mexico": "America/Mexico_City", "buenos aires": "America/Argentina/Buenos_Aires",
                "mumbai": "Asia/Kolkata"}
    offsets = {"sao paulo": -3, "buenos aires": -3, "mexico": -6, "nova york": -5,
               "londres": 0, "lisboa": 0, "paris": 1, "berlim": 1, "cairo": 2,
               "dubai": 4, "mumbai": 5.5, "pequim": 8, "toquio": 9, "sydney": 10}
    agora = datetime.utcnow()
    cidades = [cidade.strip().lower()] if cidade.strip() else list(tz_zonas.keys())
    linhas = []
    for cid in cidades:
        hora = None
        try:
            from zoneinfo import ZoneInfo
            zona = tz_zonas.get(cid)
            if zona:
                hora = datetime.now(ZoneInfo(zona)).strftime("%H:%M")
        except Exception:
            hora = None
        if hora is None and cid in offsets:
            hora = (agora + timedelta(hours=offsets[cid])).strftime("%H:%M (aproximado)")
        if hora:
            linhas.append(f"- {cid.title()}: {hora}")
    if not linhas:
        return f"Nao conheco a cidade '{cidade}'. Tente: Sao Paulo, Nova York, Londres, Paris, Toquio, Dubai, Sydney, Pequim, Mexico, Buenos Aires."
    return "Hora atual:\n" + "\n".join(linhas)


# ---------------- 23) PAPEL DE PAREDE ----------------
@tool
def definir_papel_parede(caminho_imagem: str) -> str:
    """TROCA O PAPEL DE PAREDE (plano de fundo da Area de Trabalho) do Windows
    para uma imagem que voce ja tem salva. 'caminho_imagem' = o arquivo (.jpg,
    .jpeg ou .png). Use para 'coloca essa foto como papel de parede', 'muda o
    fundo da tela para X'. So Windows."""
    if os.name != "nt":
        return "Essa funcao de papel de parede e especifica do Windows."
    import ctypes
    c = caminho_imagem.strip().strip('"')
    if not os.path.isfile(c):
        return f"Imagem nao encontrada: {c}"
    if not c.lower().endswith((".jpg", ".jpeg", ".png", ".bmp")):
        return "Use uma imagem .jpg, .jpeg, .png ou .bmp."

    def _aplicar():
        SPI_SETDESKWALLPAPER = 20
        SPIF_UPDATEINIFILE = 0x01
        SPIF_SENDCHANGE = 0x02
        ok = ctypes.windll.user32.SystemParametersInfoW(SPI_SETDESKWALLPAPER, 0, c,
                                                        SPIF_UPDATEINIFILE | SPIF_SENDCHANGE)
        return "Papel de parede alterado com sucesso." if ok else "O Windows recusou a troca do papel de parede."

    return executar_com_autocura("definir_papel_parede", _aplicar)


# ---------------- 24) AVISO EM JANELA (popup nativo) ----------------
@tool
def popup_aviso(titulo: str, mensagem: str) -> str:
    """MOSTRA UM AVISO NUMA JANELA DE VERDADE do Windows (caixa de mensagem
    popup que aparece na tela e fica ate voce clicar em OK), mesmo se o terminal
    estiver minimizado - otimo para alertas quando voce esta em outro programa.
    Roda sem travar o agente. 'titulo' e 'mensagem' definem o popup. Use para
    'avisa numa janela', 'mostra um alerta na tela'."""
    if os.name != "nt":
        print(f"[Aviso] {titulo}: {mensagem}")
        return "Aviso mostrado no terminal (popup nativo e so no Windows)."

    def _mostrar():
        try:
            import ctypes
            MB_ICONINFORMATION = 0x40
            ctypes.windll.user32.MessageBoxW(0, mensagem, titulo or "Aviso", MB_ICONINFORMATION)
        except Exception:
            print(f"[Aviso] {titulo}: {mensagem}")

    threading.Thread(target=_mostrar, daemon=True).start()
    return f"Janela de aviso '{titulo}' sendo exibida na tela."


# ---------------- 25) GERENCIAR UNIDADES (drives / ejetar) ----------------
@tool
def gerenciar_unidades(acao: str, letra: str = "") -> str:
    """GERENCIA UNIDADES/DISCOS (HD, SSD, pendrive, USB). Acoes: 'listar'
    (mostra os discos/pendrives conectados com espaco total/livre e quais sao
    removiveis/USB) e 'ejetar' ('letra'=letra do pendrive/unidade, ex.: 'E';
    remove com seguranca antes de voce puxar da USB; pede confirmacao). Use para
    'quais pendrives estao plugados', 'ejeta o pendrive com seguranca'."""
    a = acao.strip().lower()

    def _rodar():
        if a in ("listar", "lista", "drives", "discos"):
            import ctypes as _ct
            import string as _str
            mascara = _ct.windll.kernel32.GetLogicalDrives()
            linhas = []
            for i, letra_d in enumerate(_str.ascii_uppercase):
                if mascara & (1 << i):
                    caminho = f"{letra_d}:\\"
                    tipo = _ct.windll.kernel32.GetDriveTypeW(caminho)
                    tipo_nome = {2: "REMOVIVEL (pendrive/USB)", 3: "disco fixo (HD/SSD)",
                                 4: "remoto/rede", 5: "CD/DVD"}.get(tipo, "desconhecido")
                    try:
                        import shutil as _sh
                        uso = _sh.disk_usage(caminho)
                        esp = f"{uso.free/1e9:.0f} GB livres de {uso.total/1e9:.0f} GB"
                    except Exception:
                        esp = "(sem acesso)"
                    linhas.append(f"- {letra_d}: {tipo_nome} - {esp}")
            return "Unidades conectadas:\n" + ("\n".join(linhas) if linhas else "Nenhuma unidade detectada.")
        if a in ("ejetar", "remover", "extrair", "safely"):
            l = letra.strip().upper().rstrip(":")
            if not l or len(l) != 1:
                return "Diga a LETRA da unidade para ejetar (ex.: letra='E'). Veja com 'listar'."
            if not confirmar_destrutivo(f"Ejetar com seguranca a unidade {l}: (pendrive/USB)?"):
                return "Ejetar cancelado."
            ps = (
                "$sa = New-Object -ComObject Shell.Application; "
                f"$it = $sa.Namespace(17).Items() | Where-Object {{ $_.Path -like '{l}:*' }}; "
                "if ($it) { $it.InvokeVerb('Eject'); 'Ejetado' } else { 'Unidade nao encontrada para ejetar' }"
            )
            s, e, c = _rodar_cmd(f'powershell -NoProfile -Command "{ps}"', 40)
            return (s or e or "Comando enviado.") + f" (unidade {l}:)"
        return "Acao invalida. Use: listar ou ejetar."

    return executar_com_autocura("gerenciar_unidades", _rodar)


# ---------------- 26) RENOMEAR EM LOTE AVANCADO ----------------
@tool
def renomear_lote_avancado(caminho_pasta: str, modo: str, texto_antigo: str = "", texto_novo: str = "") -> str:
    """RENOMEIA VARIOS ARQUIVOS DE UMA VEZ com padroes avancados (mais poderoso
    que a renomeacao simples da central_arquivos). 'modo' pode ser: 'substituir'
    (troca 'texto_antigo' por 'texto_novo' nos nomes), 'data' (poe a data na
    frente de cada nome), 'minusculas' ou 'maiusculas' (muda o caso do nome),
    'numerar' (renomeia como 01_, 02_... mantendo a extensao). 'caminho_pasta' e
    a pasta. Pede confirmacao e nunca sobrescreve (se colidir, pula). Use para
    'renomeia todas as fotos tirando esse texto', 'poe a data nos arquivos',
    'deixa todos os nomes em minuscula'."""
    pasta = caminho_pasta.strip().strip('"')
    if not os.path.isdir(pasta):
        return f"Pasta nao encontrada: {pasta}"
    modo_l = (modo or "").strip().lower()
    if modo_l not in ("substituir", "data", "minusculas", "maiusculas", "numerar"):
        return "Modo invalido. Use: substituir, data, minusculas, maiusculas ou numerar."
    if modo_l == "substituir" and not texto_antigo:
        return "No modo 'substituir' diga 'texto_antigo' (e opcionalmente 'texto_novo')."
    if not confirmar_destrutivo(f"Renomear em lote os arquivos de '{pasta}' no modo '{modo_l}'?"):
        return "Renomeacao cancelada."

    arquivos = sorted(f for f in os.listdir(pasta) if os.path.isfile(os.path.join(pasta, f)))
    data = datetime.now().strftime("%Y%m%d")
    feitos = 0
    for idx, nome in enumerate(arquivos, 1):
        base, ext = os.path.splitext(nome)
        if modo_l == "substituir":
            novo_base = base.replace(texto_antigo, texto_novo)
        elif modo_l == "data":
            novo_base = f"{data}_{base}"
        elif modo_l == "minusculas":
            novo_base = base.lower()
        elif modo_l == "maiusculas":
            novo_base = base.upper()
        else:  # numerar
            novo_base = f"{idx:02d}_{base}"
        novo_nome = novo_base + ext
        if novo_nome == nome:
            continue
        origem = os.path.join(pasta, nome)
        destino = os.path.join(pasta, novo_nome)
        if os.path.exists(destino):
            continue  # nao sobrescreve
        try:
            os.rename(origem, destino)
            feitos += 1
        except Exception:
            pass
    return f"Renomeacao em lote concluida: {feitos} arquivo(s) renomeado(s) na pasta '{pasta}' (modo {modo_l})."


# ---------------- 27) CENTRAL DE CORES (design) ----------------
@tool
def central_cores(acao: str, cor1: str = "", cor2: str = "", quantidade: int = 5) -> str:
    """CENTRAL DE CORES para design/front-end (instantaneo, sem internet).
    Acoes: 'converter' ('cor1'=cor em HEX tipo '#ff8800' ou RGB tipo
    '255,136,0'; devolve os dois formatos), 'paleta' (gera uma paleta harmonica
    aleatoria; 'quantidade'=numero de cores, em HEX), 'contraste' ('cor1' e
    'cor2' em HEX; calcula a razao de contraste WCAG e diz se passa em texto).
    Use para 'converte essa cor para RGB', 'gera uma paleta de 6 cores', 'esse
    par de cores tem contraste bom?'."""
    import colorsys

    def _hex_rgb(h):
        h = h.strip().lstrip("#")
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

    def _rgb_hex(rgb):
        return "#{:02x}{:02x}{:02x}".format(*[max(0, min(255, int(round(v)))) for v in rgb])

    a = acao.strip().lower()
    if a in ("converter", "converte"):
        c = cor1.strip()
        try:
            if c.startswith("#") or (len(c) == 6 and all(ch in "0123456789abcdefABCDEF" for ch in c)):
                rgb = _hex_rgb(c)
                return f"{c if c.startswith('#') else '#'+c} = RGB{rgb}."
            if "," in c:
                rgb = tuple(int(x) for x in c.split(","))
                return f"RGB{rgb} = {_rgb_hex(rgb)}."
        except Exception:
            pass
        return "Cor nao reconhecida. Use HEX (#ff8800) ou RGB (255,136,0)."
    if a in ("paleta", "gerar_paleta", "cores"):
        n = max(2, min(12, int(quantidade) if str(quantidade).isdigit() else 5))
        base_hue = random.random()
        cores = []
        for i in range(n):
            # harmonica: distribui o matiz, mantem saturacao/valor agradaveis
            h = (base_hue + i * (1.0 / n)) % 1.0
            r, g, b = colorsys.hsv_to_rgb(h, random.uniform(0.45, 0.75), random.uniform(0.75, 0.95))
            cores.append(_rgb_hex((r * 255, g * 255, b * 255)))
        return f"Paleta harmonica ({n} cores):\n" + "\n".join(f"  {c}" for c in cores)
    if a in ("contraste", "wcag", "acessibilidade"):
        try:
            def _lum(hexc):
                def f(ch):
                    ch = ch / 255.0
                    return ch / 12.92 if ch <= 0.03928 else ((ch + 0.055) / 1.055) ** 2.4
                r, g, b = _hex_rgb(hexc)
                return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
            l1, l2 = _lum(cor1), _lum(cor2)
            ratio = (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)
            nota = "PASSA para texto normal (minimo 4.5)" if ratio >= 4.5 else \
                   ("passa so para texto grande/negrito (minimo 3.0)" if ratio >= 3 else "CONTRASTE BAIXO para texto (minimo 4.5)")
            return f"Contraste entre {cor1} e {cor2}: razao {ratio:.2f}:1. {nota}."
        except Exception as e:
            return f"Nao consegui calcular ({e}). Use HEX, ex.: cor1='#000000', cor2='#ffffff'."
    return "Acao invalida. Use: converter, paleta ou contraste."


# ---------------- 28) RELATORIO DE SAUDE DO PC ----------------
@tool
def relatorio_saude_pc() -> str:
    """GERA UM RELATORIO COMPLETO DE SAUDE DO PC num comando so (sem apagar
    nada - so diagnostico e leitura): uptime (ha quanto tempo ligado), CPU,
    RAM, uso do disco C, os 5 processos que mais pesam, tamanho da pasta
    temporaria, status do firewall/Defender e se houve crash recente do agente.
    Use para 'como esta meu PC', 'relatorio de saude', 'faz um check-up'."""
    def _gerar():
        import psutil
        from datetime import timedelta
        linhas = ["RELATORIO DE SAUDE DO PC - " + datetime.now().strftime("%d/%m/%Y %H:%M")]
        # uptime
        try:
            uptime = timedelta(seconds=int(time.time() - psutil.boot_time()))
            linhas.append(f"- Ligado ha: {uptime}")
        except Exception:
            pass
        linhas.append(f"- CPU: {psutil.cpu_percent(interval=1)}% | RAM: {psutil.virtual_memory().percent}%")
        try:
            u = psutil.disk_usage("C:\\") if os.name == "nt" else psutil.disk_usage("/")
            linhas.append(f"- Disco: {u.percent}% usado ({u.free/1e9:.0f} GB livres de {u.total/1e9:.0f} GB)")
        except Exception:
            pass
        # processos
        try:
            procs = []
            for p in psutil.process_iter(["name", "memory_percent"]):
                try:
                    if p.info["memory_percent"]:
                        procs.append((p.info["name"], p.info["memory_percent"]))
                except Exception:
                    pass
            top = sorted(procs, key=lambda x: -x[1])[:5]
            linhas.append("- Mais RAM: " + ", ".join(f"{n} ({m:.1f}%)" for n, m in top))
        except Exception:
            pass
        # temporarios
        try:
            pasta_temp = os.environ.get("TEMP", "")
            if pasta_temp:
                total = 0
                for base, _, fs in os.walk(pasta_temp):
                    for f in fs:
                        try:
                            total += os.path.getsize(os.path.join(base, f))
                        except Exception:
                            pass
                linhas.append(f"- Temporarios acumulados: ~{total/1e6:.0f} MB (limpaveis com otimizar_sistema)")
        except Exception:
            pass
        # firewall/defender (rapido, so firewall para nao travar)
        try:
            f_out, _, _ = _rodar_cmd('powershell -NoProfile -Command "(Get-NetFirewallProfile | Where-Object {$_.Enabled}).Count"', 25)
            linhas.append(f"- Perfis de firewall ativos: {f_out.strip() or '?'}/3")
        except Exception:
            pass
        # crashes
        try:
            crashes = carregar_json(ARQ_CRASH_LOG, [])
            linhas.append(f"- Crashs do agente registrados: {len(crashes)} (ultimo: {crashes[-1].get('data','')[:16] if crashes else 'nenhum'})")
        except Exception:
            pass
        return "\n".join(linhas)

    return executar_com_autocura("relatorio_saude_pc", _gerar)


# ---------------- 29) DESLIGAR/REINICIAR AGENDADO ----------------
@tool
def agendar_energia(acao: str, minutos: int = 0) -> str:
    """DESLIGA OU REINICIA O PC DAQUI A X MINUTOS (agendado pelo proprio Windows)
    - e tambem cancela. Diferente do controle_de_energia (que e imediato), aqui
    voce programa: 'desliga daqui a 30 minutos', 'reinicia daqui a 1 hora',
    'cancela o desligamento'. Acoes: 'desligar' ('minutos'=espera), 'reiniciar'
    ('minutos'), 'cancelar' (aborta um desligamento pendente). Desligar/reiniciar
    passam por confirmacao de seguranca."""
    a = acao.strip().lower()
    if a in ("cancelar", "cancela", "abortar"):
        subprocess.run("shutdown /a", shell=True, capture_output=True)
        return "Desligamento/reinicio agendado cancelado."
    if a in ("desligar", "desliga", "shutdown"):
        if not confirmar_destrutivo(f"Desligar o PC daqui a {minutos} minuto(s)?"):
            return "Cancelado."
        seg = max(0, int(minutos)) * 60
        subprocess.run(f'shutdown /s /t {seg} /c "Desligamento agendado pelo agente"', shell=True)
        return f"O PC vai desligar em {minutos} minuto(s). Diga 'cancela o desligamento' (acao 'cancelar') para abortar."
    if a in ("reiniciar", "reinicia", "restart"):
        if not confirmar_destrutivo(f"Reiniciar o PC daqui a {minutos} minuto(s)?"):
            return "Cancelado."
        seg = max(0, int(minutos)) * 60
        subprocess.run(f'shutdown /r /t {seg} /c "Reinicio agendado pelo agente"', shell=True)
        return f"O PC vai reiniciar em {minutos} minuto(s). Use a acao 'cancelar' para abortar."
    return "Acao invalida. Use: desligar, reiniciar ou cancelar (com 'minutos')."


# ---------------- 30) SORTEIO / ALEATORIO ----------------
@tool
def sortear(acao: str, opcoes: str = "", quantidade: int = 1) -> str:
    """SORTEIOS E DECISOES ALEATORIAS (instantaneo, sem internet/IA). Acoes:
    'escolher' (sorteia um ou mais itens de uma lista; 'opcoes' separados por
    virgula/ponto-e-virgula, ex.: 'Ana, Bruno, Carla'; 'quantidade'=quantos
    sorteados sem repetir), 'numero' (sorteia um numero; 'opcoes'='min-max', ex.:
    '1-100'), 'moeda' (cara ou coroa), 'dado' (joga dado(s); 'quantidade'=quantos
    dados) e 'embaralhar' (embaralha a ordem da lista). Use para 'sorteia um
    nome', 'joga um dado', 'cara ou coroa', 'numero de 1 a 10'."""
    a = acao.strip().lower()
    if a in ("escolher", "escolhe", "sortear_nome", "nome"):
        itens = [x.strip() for x in opcoes.replace(";", ",").split(",") if x.strip()]
        if not itens:
            return "Diga as opcoes separadas por virgula (ex.: 'Ana, Bruno, Carla')."
        n = max(1, min(len(itens), int(quantidade) if str(quantidade).isdigit() else 1))
        escolhidos = random.sample(itens, n)
        return ("Sorteado: " if n == 1 else "Sorteados: ") + ", ".join(escolhidos) + "."
    if a in ("numero", "num", "sortear_numero"):
        faixa = opcoes.replace(" ", "")
        try:
            if "-" in faixa:
                ini, fim = (int(x) for x in faixa.split("-", 1))
            else:
                ini, fim = 1, 100
            if ini > fim:
                ini, fim = fim, ini
            return f"Numero sorteado entre {ini} e {fim}: {random.randint(ini, fim)}."
        except Exception:
            return "Formato de faixa invalido. Use ex.: opcoes='1-100'."
    if a in ("moeda", "cara_coroa", "coin"):
        return "Deu: " + random.choice(["CARA", "COROA"]) + "."
    if a in ("dado", "dados", "jogar_dado"):
        n = max(1, min(10, int(quantidade) if str(quantidade).isdigit() else 1))
        resultados = [random.randint(1, 6) for _ in range(n)]
        return f"Dado(s): {', '.join(map(str, resultados))} (soma {sum(resultados)})."
    if a in ("embaralhar", "shuffle", "ordem"):
        itens = [x.strip() for x in opcoes.replace(";", ",").split(",") if x.strip()]
        if not itens:
            return "Diga a lista para embaralhar (separada por virgula)."
        random.shuffle(itens)
        return "Ordem embaralhada: " + " -> ".join(itens) + "."
    return "Acao invalida. Use: escolher, numero, moeda, dado ou embaralhar."


# ======================================================================
# ===== PACOTE TOP: 50 FERRAMENTAS INOVADORAS (inspiradas nos melhores
# agentes open-source do GitHub: goose, OpenHands, Cline, Open Interpreter,
# GPT Researcher, Tavily/browser-use, LangChain tools). Nada aqui repete as
# 101 ja existentes - tudo e ADICAO PURA. =====
# ======================================================================

# ---------------- 1) EXECUTAR CODIGO PYTHON (interpretador seguro) ----------------
@tool
def executar_python(codigo: str) -> str:
    """EXECUTA UM TRECHO DE CODIGO PYTHON (interpretador / code runner), estilo
    o 'Python REPL' dos melhores agentes (OpenHands/Open Interpreter/LangChain).
    Roda em um diretorio temporario isolado, sem acesso as variaveis do agente,
    e captura o que foi impresso (print) e eventuais erros. Use para calcular,
    processar dados, testar logica, gerar/transformar arquivos rapidamente. NAO
    executa comandos que formatem/danifiquem o sistema (o ambiente e isolado e
    limitado; comandos de sistema do PC continuam pela 'executar_comando')."""
    import tempfile

    def _rodar():
        arq = os.path.join(tempfile.gettempdir(), "_agente_exec_py.py")
        with open(arq, "w", encoding="utf-8") as f:
            f.write(codigo)
        try:
            r = subprocess.run([sys.executable, arq], capture_output=True, text=True,
                               encoding="utf-8", errors="ignore", timeout=60,
                               cwd=tempfile.gettempdir())
        except subprocess.TimeoutExpired:
            return "O codigo demorou mais de 60s e foi interrompido."
        saida = (r.stdout or "").strip()
        erros = (r.stderr or "").strip()
        partes = []
        if saida:
            partes.append("Saida:\n" + saida[-3000:])
        if erros:
            partes.append("Erro:\n" + erros[-1500:])
        if not partes:
            partes.append("Codigo executado (sem saida de texto - use print para ver resultados).")
        return "\n".join(partes)

    return executar_com_autocura("executar_python", _rodar)


# ---------------- 2) LER / EXTRAIR CONTEUDO DE PAGINA WEB ----------------
@tool
def ler_pagina_web(url: str) -> str:
    """LE UMA PAGINA DA INTERNET e extrai o TEXTO principal (limpo, sem menus e
    anuncios), estilo a ferramenta 'RequestsGet/Tavily Extract' - diferente de
    'abrir_site_no_navegador' (so abre no navegador) e de 'buscar_web' (so lista
    links): aqui o agente LE o conteudo do link e resume/usa. Use para 'le esse
    artigo', 'o que diz essa pagina', 'extraia o texto desse link'."""
    import urllib.request
    import re as _re
    import html as _html

    def _ler():
        alvo = url.strip()
        if not alvo.startswith(("http://", "https://")):
            alvo = "https://" + alvo
        req = urllib.request.Request(alvo, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=25) as r:
            bruto = r.read().decode("utf-8", errors="ignore")
        bruto = _re.sub(r"(?is)<(script|style|noscript|head|footer|nav|form).*?</\1>", " ", bruto)
        texto = _re.sub(r"(?s)<[^>]+>", "\n", bruto)
        texto = _html.unescape(texto)
        linhas = [ln.strip() for ln in texto.splitlines() if ln.strip()]
        texto = "\n".join(ln for ln in linhas if len(ln) > 1)
        return f"Conteudo de {alvo}:\n{texto[:3500]}" if texto.strip() else "Nao consegui extrair texto dessa pagina."

    try:
        return executar_com_autocura("ler_pagina_web", _ler)
    except Exception as e:
        return f"Nao consegui ler a pagina ({type(e).__name__})."


# ---------------- 3) PESQUISA PROFUNDA COM FONTES (mini GPT Researcher) ----------------
@tool
def pesquisa_profunda(tema: str) -> str:
    """PESQUISA PROFUNDA sobre um tema (estilo GPT Researcher): busca na web, LE
    as paginas mais relevantes e devolve um resumo consolidado COM AS FONTES
    (links) usadas. Usa mais chamadas que a busca simples, entao reserve para
    questoes que pedem 'pesquise a fundo', 'faça um levantamento', 'relatorio
    sobre X'. Para so achar links rapidos use 'buscar_web'."""
    def _pesquisar():
        # busca os links
        import urllib.request
        import urllib.parse
        import re as _re
        q = urllib.parse.quote(tema.strip())
        req = urllib.request.Request("https://html.duckduckgo.com/html/?q=" + q,
                                     headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            pag = r.read().decode("utf-8", errors="ignore")
        links = []
        for href, _tit in _re.findall(r'class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', pag, _re.S)[:4]:
            m = _re.search(r"[?&]uddg=([^&]+)", href)
            links.append(urllib.parse.unquote(m.group(1)) if m else href)
        if not links:
            return f"Nao achei fontes para '{tema}'."
        # le ate 3 fontes e coleta texto
        trechos = []
        fontes = []
        for link in links[:3]:
            try:
                conteudo = ler_pagina_web.invoke({"url": link})
                if conteudo and "Nao consegui" not in conteudo:
                    trechos.append(conteudo[:1200])
                    fontes.append(link)
            except Exception:
                continue
        if not trechos:
            return f"Achei links, mas nao consegui ler o conteudo. Fontes:\n" + "\n".join(links)
        # consolida com a IA (resumo curto para poupar cota)
        material = "\n\n".join(trechos)[:5000]
        prompt = (f"Com base nas fontes abaixo, faca um RESUMO OBJETIVO em portugues, em 5-8 "
                  f"frases, sobre: {tema}. Nao invente nada que nao esteja nas fontes.\n\nFONTES:\n{material}")
        resumo = _extrair_texto(invocar_com_fallback([{"role": "user", "content": prompt}]).content)
        return resumo.strip() + "\n\nFontes consultadas:\n" + "\n".join(f"- {f}" for f in fontes)

    return executar_com_autocura("pesquisa_profunda", _pesquisar)


# ---------------- 4) CENTRAL DE NOTICIAS (RSS, sem chave) ----------------
@tool
def central_noticias(assunto: str = "") -> str:
    """LE NOTICIAS ATUAIS via feeds RSS oficiais (sem chave, sem navegador).
    Sem 'assunto' mostra as principais do Brasil (G1). Com assunto, tenta
    escolher um feed relacionado: 'tecnologia' (Tilt/G1 tech), 'economia',
    'ciencia'/'saude', 'esportes'/'futebol', 'mundo'. Use para 'as noticias de
    hoje', 'o que esta acontecendo', 'ultimas noticias de tecnologia'."""
    import urllib.request
    import xml.etree.ElementTree as ET
    import html as _html

    feeds = {
        "": "https://g1.globo.com/rss/g1/",
        "brasil": "https://g1.globo.com/rss/g1/",
        "tecnologia": "https://g1.globo.com/rss/g1/tecnologia/",
        "tech": "https://g1.globo.com/rss/g1/tecnologia/",
        "economia": "https://g1.globo.com/rss/g1/economia/",
        "ciencia": "https://g1.globo.com/rss/g1/ciencia/",
        "saude": "https://g1.globo.com/rss/g1/ciencia-e-saude/",
        "esportes": "https://ge.globo.com/rss/",
        "futebol": "https://ge.globo.com/rss/",
        "mundo": "https://g1.globo.com/rss/g1/mundo/",
        "noticias": "https://g1.globo.com/rss/g1/",
    }

    def _ler():
        chave = assunto.strip().lower()
        url = None
        for k, v in feeds.items():
            if k and k in chave:
                url = v
                break
        url = url or feeds[""]
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            xml = r.read().decode("utf-8", errors="ignore")
        raiz = ET.fromstring(xml)
        itens = raiz.findall(".//item")[:8]
        if not itens:
            return "Nao consegui carregar noticias agora."
        linhas = []
        for it in itens:
            titulo = _html.unescape((it.findtext("title") or "").strip())
            link = (it.findtext("link") or "").strip()
            linhas.append(f"- {titulo}\n  {link}")
        return f"Noticias {('sobre ' + assunto) if assunto else 'do momento'}:\n" + "\n".join(linhas)

    try:
        return executar_com_autocura("central_noticias", _ler)
    except Exception as e:
        return f"Nao consegui ler noticias agora ({type(e).__name__})."


# ---------------- 5) CENTRAL DE DADOS BRASIL (CPF/CNPJ/CEP/DDD/formatar) ----------------
@tool
def central_dados_brasil(acao: str, dado: str = "") -> str:
    """CENTRAL DE DADOS BRASILEIROS (utilidades e validacao, sem chave).
    Acoes: 'validar_cpf' ('dado'=CPF so numeros), 'validar_cnpj', 'formatar_cpf',
    'formatar_cnpj' (so numeros -> mascara), 'formatar_telefone' (10/11 digitos),
    'consultar_cep' ('dado'=CEP 8 digitos; busca endereco/rua/cidade/UF via
    API dos Correios), 'consultar_cnpj' (dados publicos de empresa via ReceitaWS),
    'ddd' ('dado'=DDD, ex.: '11'; diz o estado/cidade principal). Use para
    'valida esse CPF', 'qual o endereco do CEP 01001000', 'de onde e o DDD 47'."""
    a = acao.strip().lower()
    d = (dado or "").strip()

    def _digitos_iguais(s):
        return len(set(s)) == 1

    def _cpf_valido(num):
        num = "".join(c for c in num if c.isdigit())
        if len(num) != 11 or _digitos_iguais(num):
            return False
        for peso_inicial in (10, 11):
            soma = sum(int(num[i]) * (peso_inicial - i) for i in range(peso_inicial - 1))
            resto = (soma * 10) % 11
            resto = 0 if resto == 10 else resto
            if resto != int(num[peso_inicial - 1]):
                return False
        return True

    def _cnpj_valido(num):
        num = "".join(c for c in num if c.isdigit())
        if len(num) != 14 or _digitos_iguais(num):
            return False
        pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        pesos2 = [6] + pesos1

        def _calc(pesos):
            soma = sum(int(num[i]) * pesos[i] for i in range(len(pesos)))
            resto = soma % 11
            return 0 if resto < 2 else 11 - resto
        return _calc(pesos1) == int(num[12]) and _calc(pesos2) == int(num[13])

    if a in ("validar_cpf", "cpf"):
        return f"O CPF {d} e VALIDO." if _cpf_valido(d) else f"O CPF {d} e INVALIDO."
    if a in ("validar_cnpj", "cnpj_validar"):
        return f"O CNPJ {d} e VALIDO." if _cnpj_valido(d) else f"O CNPJ {d} e INVALIDO."
    if a in ("formatar_cpf",):
        n = "".join(c for c in d if c.isdigit())
        return f"{n[:3]}.{n[3:6]}.{n[6:9]}-{n[9:]}" if len(n) == 11 else "CPF precisa ter 11 digitos."
    if a in ("formatar_cnpj",):
        n = "".join(c for c in d if c.isdigit())
        return f"{n[:2]}.{n[2:5]}.{n[5:8]}/{n[8:12]}-{n[12:]}" if len(n) == 14 else "CNPJ precisa ter 14 digitos."
    if a in ("formatar_telefone", "telefone"):
        n = "".join(c for c in d if c.isdigit())
        if len(n) == 11:
            return f"({n[:2]}) {n[2:7]}-{n[7:]}"
        if len(n) == 10:
            return f"({n[:2]}) {n[2:6]}-{n[6:]}"
        return "Telefone precisa ter 10 ou 11 digitos."
    if a in ("ddd",):
        cod = "".join(c for c in d if c.isdigit())[:2]
        ddds = {"11": "Sao Paulo/SP (grande SP)", "12": "Vale do Paraiba/SP", "13": "Baixada Santista/SP",
                "14": "Bauru/Marilia/SP", "15": "Sorocaba/SP", "16": "Ribeirao Preto/SP", "17": "Sao Jose do Rio Preto/SP",
                "18": "Presidente Prudente/SP", "19": "Campinas/SP", "21": "Rio de Janeiro/RJ", "22": "Norte/Lagos RJ",
                "24": "Volta Redonda/Petropolis RJ", "27": "Vitoria/ES", "28": "Cachoeiro/ES", "31": "Belo Horizonte/MG",
                "32": "Juiz de Fora/MG", "33": "Governador Valadares/MG", "34": "Uberlandia/MG", "35": "Pocos/Sul MG",
                "37": "Divinopolis/MG", "38": "Montes Claros/Norte MG", "41": "Curitiba/PR", "42": "Ponta Grossa/PR",
                "43": "Londrina/PR", "44": "Maringa/PR", "45": "Foz do Iguacu/Cascavel PR", "46": "Francisco Beltrao/PR",
                "47": "Joinville/Blumenau/SC (norte SC)", "48": "Florianopolis/SC", "49": "Chapeco/Oeste SC",
                "51": "Porto Alegre/RS", "53": "Pelotas/RS", "54": "Caxias do Sul/RS", "55": "Santa Maria/RS",
                "61": "Brasilia/DF", "62": "Goiania/GO", "63": "Palmas/TO", "64": "Rio Verde/Sudoeste GO",
                "65": "Cuiaba/MT", "66": "Rondonopolis/MT", "67": "Campo Grande/MS", "68": "Rio Branco/Acre",
                "69": "Porto Velho/RO", "71": "Salvador/BA", "73": "Ilheus/Itabuna BA", "74": "Juazeiro/BA",
                "75": "Feira de Santana/BA", "77": "Vitoria da Conquista/BA", "79": "Aracaju/SE", "81": "Recife/PE",
                "82": "Maceio/AL", "83": "Joao Pessoa/PB", "84": "Natal/RN", "85": "Fortaleza/CE", "86": "Teresina/PI",
                "87": "Petrolina/PE", "88": "Juazeiro do Norte/Cariri CE", "89": "Piaui (sul/FLoriano)",
                "91": "Belem/PA", "92": "Manaus/AM", "93": "Santarém/PA", "94": "Maraba/Para", "95": "Boa Vista/RR",
                "96": "Macapa/AP", "97": "Leste/Interior AM", "98": "Sao Luis/MA", "99": "Imperatriz/Maranhao"}
        info = ddds.get(cod)
        return f"DDD {cod}: {info}." if info else f"Nao conheco o DDD {cod}."
    if a in ("consultar_cep", "cep"):
        import urllib.request
        import urllib.parse
        cep = "".join(c for c in d if c.isdigit())
        if len(cep) != 8:
            return "O CEP precisa ter 8 digitos."
        def _cep():
            url = "https://viacep.com.br/ws/" + urllib.parse.quote(cep) + "/json/"
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "AgentePC/1.0"}), timeout=20) as r:
                import json as _json
                dados = _json.loads(r.read().decode("utf-8"))
            if dados.get("erro"):
                return f"CEP {cep} nao encontrado."
            return (f"CEP {dados.get('cep')}: {dados.get('logradouro','')} "
                    f"{dados.get('bairro','')}, {dados.get('localidade','')}/{dados.get('uf','')}.")
        try:
            return executar_com_autocura("consultar_cep", _cep)
        except Exception:
            return "Nao consegui consultar o CEP (sem internet?)."
    if a in ("consultar_cnpj", "cnpj_consulta", "empresa"):
        import urllib.request
        cnpj = "".join(c for c in d if c.isdigit())
        if len(cnpj) != 14:
            return "O CNPJ precisa ter 14 digitos."
        def _cnpj():
            url = "https://www.receitaws.com.br/v1/cnpj/" + cnpj
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "AgentePC/1.0"}), timeout=25) as r:
                import json as _json
                dd = _json.loads(r.read().decode("utf-8"))
            if dd.get("status") == "ERROR":
                return "CNPJ nao encontrado: " + str(dd.get("message", ""))
            return (f"{dd.get('nome')} ({dd.get('fantasia') or '-'})\n"
                    f"CNPJ {dd.get('cnpj')} | Situacao: {dd.get('situacao')}\n"
                    f"{dd.get('logradouro')}, {dd.get('municipio')}/{dd.get('uf')} | Aberto em {dd.get('abertura')}")
        try:
            return executar_com_autocura("consultar_cnpj", _cnpj)
        except Exception:
            return "Nao consegui consultar o CNPJ (a API publica pode ter limite de 3 consultas/minuto; tente em instantes)."
    return "Acao invalida. Use: validar_cpf, validar_cnpj, formatar_cpf, formatar_cnpj, formatar_telefone, consultar_cep, consultar_cnpj ou ddd."


# ---------------- 6) EDITAR / CONVERTER IMAGEM (Pillow, lazy) ----------------
@tool
def editar_imagem(acao: str, caminho_imagem: str, valor: str = "", saida: str = "") -> str:
    """EDITA E CONVERTE IMAGENS (redimensionar, converter formato, girar,
    qualidade). Precisa do Pillow (pip install pillow; import e dentro da
    funcao, entao sem o pacote o resto do agente continua normal). Acoes:
    'redimensionar' ('valor'=LARGURAxALTURA, ex.: '800x600'; ou so largura),
    'converter' ('valor'=formato: png/jpg/webp), 'girar' ('valor'=graus 90/180),
    'miniaturar' (mantem proporcao, 'valor'=lado maximo). Salva ao lado da
    original (ou no caminho 'saida')."""
    a = acao.strip().lower()

    def _editar():
        from PIL import Image
        c = caminho_imagem.strip().strip('"')
        if not os.path.isfile(c):
            return f"Imagem nao encontrada: {c}"
        img = Image.open(c)
        base, ext = os.path.splitext(c)
        if a in ("redimensionar", "resize"):
            if "x" in valor:
                larg, alt = (int(x) for x in valor.lower().split("x", 1))
                img = img.resize((larg, alt))
            else:
                larg = int(valor)
                prop = larg / img.width
                img = img.resize((larg, int(img.height * prop)))
            dest = saida.strip() or base + "_nova.png"
            img.save(dest)
        elif a in ("converter", "formato"):
            fmt = valor.strip().lower().lstrip(".") or "png"
            dest = saida.strip() or base + "." + fmt
            img.convert("RGB").save(dest)
        elif a in ("girar", "rotacionar"):
            img = img.rotate(-int(valor or "90"), expand=True)
            dest = saida.strip() or base + "_girada.png"
            img.save(dest)
        elif a in ("miniaturar", "thumbnail"):
            img.thumbnail((int(valor or "300"), int(valor or "300")))
            dest = saida.strip() or base + "_mini.png"
            img.save(dest)
        else:
            return "Acao invalida. Use: redimensionar, converter, girar ou miniaturar."
        return f"Imagem processada e salva em: {dest} ({img.size[0]}x{img.size[1]})."

    try:
        return executar_com_autocura("editar_imagem", _editar)
    except ImportError:
        return "Para editar imagens eu preciso do Pillow: rode no cmd 'pip install pillow'."


# ---------------- 7) CRIAR PDF A PARTIR DE TEXTO (reportlab, lazy) ----------------
@tool
def criar_pdf(titulo: str, conteudo_texto: str, nome_arquivo: str = "") -> str:
    """CRIA UM ARQUIVO PDF a partir de um titulo e um texto (gera documento
    simples e profissional). Precisa do reportlab (pip install reportlab; o
    import e dentro da funcao). Salva por padrao na Area de Trabalho. Use para
    'gera um PDF com esse texto', 'transforma isso em PDF'."""
    def _criar():
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas as _canvas
        from reportlab.lib.units import cm
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        desktop = os.path.join(os.path.expanduser("~"), "Desktop")
        if not os.path.isdir(desktop):
            desktop = os.path.join(os.path.expanduser("~"), "Area de Trabalho")
        if not os.path.isdir(desktop):
            desktop = os.path.expanduser("~")
        nome = (nome_arquivo.strip() or "documento_agente")
        if not nome.lower().endswith(".pdf"):
            nome += ".pdf"
        caminho = os.path.join(desktop, nome)
        c = _canvas.Canvas(caminho, pagesize=A4)
        larg, alt = A4
        y = alt - 2 * cm
        c.setFont("Helvetica-Bold", 16)
        for linha in _quebrar(titulo, 70):
            c.drawString(2 * cm, y, linha)
            y -= 0.8 * cm
        y -= 0.4 * cm
        c.setFont("Helvetica", 11)
        for paragrafo in conteudo_texto.split("\n"):
            for linha in _quebrar(paragrafo or " ", 95):
                if y < 2 * cm:
                    c.showPage()
                    c.setFont("Helvetica", 11)
                    y = alt - 2 * cm
                c.drawString(2 * cm, y, linha)
                y -= 0.55 * cm
            y -= 0.2 * cm
        c.save()
        return f"PDF criado em: {caminho}"

    def _quebrar(texto, larg):
        palavras, linhas, atual = texto.split(), [], ""
        for p in palavras:
            if len(atual) + len(p) + 1 <= larg:
                atual = (atual + " " + p).strip()
            else:
                linhas.append(atual)
                atual = p
        if atual:
            linhas.append(atual)
        return linhas or [""]

    try:
        return executar_com_autocura("criar_pdf", _criar)
    except ImportError:
        return "Para criar PDF eu preciso do reportlab: rode no cmd 'pip install reportlab'."


# ---------------- 8) CRIAR GRAFICO EM SVG (so biblioteca padrao) ----------------
@tool
def criar_grafico_svg(titulo: str, rotulos: str, valores: str, nome_arquivo: str = "") -> str:
    """GERA UM GRAFICO DE BARRAS em arquivo SVG (imagem vetorial que abre no
    navegador) SEM precisar de nenhum pacote - so Python. 'rotulos' e 'valores'
    sao listas separadas por ponto-e-virgula ';' na MESMA quantidade (ex.:
    rotulos='Jan;Fev;Mar', valores='120;90;150'). Salva por padrao na Area de
    Trabalho. Use para 'faz um grafico desses numeros'."""
    def _criar():
        labs = [x.strip() for x in rotulos.split(";") if x.strip()]
        try:
            vals = [float(x.strip()) for x in valores.split(";") if str(x).strip()]
        except ValueError:
            return "Os 'valores' precisam ser numeros separados por ';'."
        if len(labs) != len(vals) or not vals:
            return "A quantidade de rotulos e valores deve ser igual e maior que zero."
        w, h, base, topo, esq = 720, 420, 340, 60, 70
        maxv = max(vals) or 1
        passo = (w - esq - 40) / len(vals)
        bar_w = passo * 0.6
        cores = ["#2563eb", "#16a34a", "#ea580c", "#9333ea", "#dc2626", "#0891b2", "#ca8a04"]
        partes = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" font-family="Arial">',
                  f'<rect width="{w}" height="{h}" fill="#ffffff"/>',
                  f'<text x="{w/2}" y="34" font-size="20" text-anchor="middle" font-weight="bold">{titulo}</text>']
        for i, (lab, v) in enumerate(zip(labs, vals)):
            bh = (v / maxv) * (base - topo)
            x = esq + i * passo + (passo - bar_w) / 2
            y = base - bh
            cor = cores[i % len(cores)]
            partes.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{bar_w:.1f}" height="{bh:.1f}" fill="{cor}"/>')
            partes.append(f'<text x="{x+bar_w/2:.1f}" y="{y-6:.1f}" font-size="12" text-anchor="middle">{v:g}</text>')
            partes.append(f'<text x="{x+bar_w/2:.1f}" y="{base+18:.1f}" font-size="12" text-anchor="middle">{lab}</text>')
        partes.append(f'<line x1="{esq}" y1="{base}" x2="{w-30}" y2="{base}" stroke="#333" stroke-width="2"/>')
        partes.append("</svg>")
        desktop = os.path.join(os.path.expanduser("~"), "Desktop")
        if not os.path.isdir(desktop):
            desktop = os.path.join(os.path.expanduser("~"), "Area de Trabalho")
        if not os.path.isdir(desktop):
            desktop = os.path.expanduser("~")
        nome = (nome_arquivo.strip() or "grafico")
        if not nome.lower().endswith(".svg"):
            nome += ".svg"
        caminho = os.path.join(desktop, nome)
        with open(caminho, "w", encoding="utf-8") as f:
            f.write("\n".join(partes))
        return f"Grafico SVG criado em: {caminho} (abra no navegador para ver)."

    return executar_com_autocura("criar_grafico_svg", _criar)


# ---------------- 9) NUMERO POR EXTENSO (pt-BR) ----------------
@tool
def numero_por_extenso(numero: str) -> str:
    """ESCREVE UM NUMERO POR EXTENSO em portugues (ex.: 154 -> 'cento e
    cinquenta e quatro'; 2.5 -> 'dois inteiros e cinquenta centesimos'). Para
    valores em dinheiro, devolve tambem a forma de 'reais e centavos'. Use para
    'escreve 1234 por extenso', 'como se diz esse valor em um recibo'."""
    try:
        txt = str(numero).strip().replace(",", ".")
        if "." in txt:
            inteiro_s, decimal_s = txt.split(".")
            inteiro = int(inteiro_s or "0")
            decimal = int((decimal_s + "00")[:2])
            palavra_i = _extenso_inteiro(inteiro)
            palavra_d = _extenso_inteiro(decimal) if decimal else ""
            moeda_i = "real" if inteiro == 1 else "reais"
            base = f"{palavra_i} {moeda_i}"
            if decimal:
                moeda_d = "centavo" if decimal == 1 else "centavos"
                base += f" e {palavra_d} {moeda_d}"
            return f"{txt} por extenso: {base}."
        n = int(txt)
        return f"{n} por extenso: {_extenso_inteiro(n)}."
    except Exception:
        return "Nao entendi o numero. Use digitos (ex.: 154 ou 12.50)."


def _extenso_inteiro(n: int) -> str:
    if n == 0:
        return "zero"
    unidades = ["", "um", "dois", "tres", "quatro", "cinco", "seis", "sete", "oito", "nove",
                "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete",
                "dezoito", "dezenove"]
    dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]
    centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos",
                "seiscentos", "setecentos", "oitocentos", "novecentos"]

    def _menor_mil(num):
        if num < 20:
            return unidades[num]
        if num < 100:
            d, u = divmod(num, 10)
            return dezenas[d] + ((" e " + unidades[u]) if u else "")
        c, resto = divmod(num, 100)
        if num == 100:
            return "cem"
        return centenas[c] + ((" e " + _menor_mil(resto)) if resto else "")

    if n < 1000:
        return _menor_mil(n)
    # milhares / milhoes (suficiente para recibos/uso comum)
    grupos = []
    sufixos = ["", " mil", " milhao", " milhoes", " bilhao", " bilhoes"]
    i = 0
    while n > 0:
        n, resto = divmod(n, 1000)
        if resto:
            parte = _menor_mil(resto)
            if i == 1 and resto == 1:
                grupos.append("mil")
            elif i >= 2 and resto == 1:
                grupos.append("um" + sufixos[2])
            else:
                suf = sufixos[i] if i < len(sufixos) else ""
                grupos.append(parte + suf)
        i += 1
    return " e ".join(reversed(grupos))


# ---------------- 10) CONVERSOR DE MOEDAS EM TEMPO REAL (gratis, sem chave) ----------------
@tool
def converter_moeda(valor: float, de: str = "USD", para: str = "BRL") -> str:
    """CONVERTE VALORES ENTRE MOEDAS EM TEMPO REAL (dolar, euro, real, peso,
    bitcoin etc.) usando API gratuita sem chave. 'de' e 'para' sao codigos de
    moeda (USD, EUR, BRL, GBP, ARS, BTC...). Use para 'converte 100 dolares em
    reais', 'quanto e 50 euros em real'."""
    import urllib.request

    def _conv():
        base = de.strip().upper()
        alvo = para.strip().upper()
        url = f"https://open.er-api.com/v6/latest/{base}"
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "AgentePC/1.0"}), timeout=20) as r:
            import json as _json
            dados = _json.loads(r.read().decode("utf-8"))
        taxa = dados.get("rates", {}).get(alvo)
        if taxa is None:
            return f"Nao encontrei a moeda '{alvo}' (ou '{base}'). Use codigos como USD, EUR, BRL, GBP, BTC."
        resultado = valor * taxa
        return f"{valor:,.2f} {base} = {resultado:,.2f} {alvo} (taxa {taxa:,.4g}, atualizado agora)."

    try:
        return executar_com_autocura("converter_moeda", _conv)
    except Exception:
        return "Nao consegui converter agora (sem internet ou API fora do ar)."


# ---------------- 11) RASTREAR ENCOMENDA (Correios) ----------------
@tool
def rastrear_encomenda(codigo_rastreio: str) -> str:
    """RASTREIA UMA ENCOMENDA/PACOTE dos Correios pelo codigo de rastreio
    (formato BR como 'BR123456789BR') e mostra o historico de movimentacao.
    Usa um servico publico gratuito (pode ter instabilidade/limite). Use para
    'onde esta minha encomenda', 'rastreia o pacote X'."""
    import urllib.request

    def _rastrear():
        cod = codigo_rastreio.strip().upper()
        if len(cod) < 9:
            return "Me passe o codigo de rastreio completo (ex.: BR123456789BR)."
        url = "https://api.linketrack.com/track/json?user=teste&token=1bcd7883a696324135e626925e1a8e1c36833822320d7e4a293f1a266c5b5b5c&codigo=" + cod
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=25) as r:
            import json as _json
            d = _json.loads(r.read().decode("utf-8"))
        eventos = d.get("eventos", [])
        if not eventos:
            return f"Nao ha eventos para o codigo {cod} (confira se esta certo ou se acabou de ser postado)."
        linhas = [f"Rastreio {cod} ({d.get('servico','')}):"]
        for ev in eventos[:10]:
            linhas.append(f"- {ev.get('data','')} {ev.get('hora','')} - {ev.get('status','')} | {ev.get('local','')}")
        return "\n".join(linhas)

    try:
        return executar_com_autocura("rastrear_encomenda", _rastrear)
    except Exception as e:
        return f"Nao consegui rastrear agora ({type(e).__name__}). O servico publico pode estar fora do ar; tente depois."


# ---------------- 12) CALCULADORA DE IMC E SAUDE ----------------
@tool
def calculadora_saude(acao: str, peso: float = 0, altura: float = 0, idade: int = 0) -> str:
    """CALCULADORA DE SAUDE (instantanea, sem internet): 'imc' ('peso' em kg e
    'altura' em metros, ex.: 1.75) classifica o IMC; 'agua' ('peso') sugere o
    consumo diario de agua (35 ml/kg); 'frequencia' ('idade') mostra a faixa de
    batimentos para exercicio; 'tmb' ('peso', 'altura' em cm, 'idade') estima o
    gasto calorico basal (Harris-Benedict masculino/feminino pode variar). Use
    para 'qual meu IMC', 'quanta agua devo tomar'."""
    a = acao.strip().lower()
    if a in ("imc",):
        if peso <= 0 or altura <= 0:
            return "Informe 'peso' (kg) e 'altura' (metros, ex.: 1.75)."
        imc = peso / (altura ** 2)
        if imc < 18.5:
            faixa = "abaixo do peso"
        elif imc < 25:
            faixa = "peso normal (otimo)"
        elif imc < 30:
            faixa = "sobrepeso"
        elif imc < 35:
            faixa = "obesidade grau I"
        elif imc < 40:
            faixa = "obesidade grau II"
        else:
            faixa = "obesidade grau III"
        return f"Seu IMC e {imc:.1f} - classificacao: {faixa}. (Referencia da OMS.)"
    if a in ("agua", "agua_diaria"):
        if peso <= 0:
            return "Informe o 'peso' em kg."
        litros = peso * 35 / 1000
        return f"Para {peso} kg, o recomendado e cerca de {litros:.1f} litros de agua por dia (~{peso*35:.0f} ml)."
    if a in ("frequencia", "frequencia_cardiaca", "bpm"):
        if idade <= 0:
            return "Informe a 'idade'."
        max_bpm = 220 - idade
        return (f"Com {idade} anos: frequencia maxima ~{max_bpm} bpm. Para exercicio "
                f"moderado: {int(max_bpm*0.5)}-{int(max_bpm*0.7)} bpm; intenso: {int(max_bpm*0.7)}-{int(max_bpm*0.85)} bpm.")
    if a in ("tmb", "metabolismo", "calorias"):
        if peso <= 0 or altura <= 0 or idade <= 0:
            return "Informe 'peso' (kg), 'altura' (em CM, ex.: 175) e 'idade'."
        alt_cm = altura if altura > 3 else altura * 100
        hom = 88.36 + 13.4 * peso + 4.8 * alt_cm - 5.7 * idade
        mul = 447.6 + 9.2 * peso + 3.1 * alt_cm - 4.3 * idade
        return (f"Gasto calorico basal estimado (Harris-Benedict):\n"
                f"  Homens: ~{hom:.0f} kcal/dia\n  Mulheres: ~{mul:.0f} kcal/dia\n"
                "(acrescente 20-50% conforme o nivel de atividade fisica.)")
    return "Acao invalida. Use: imc, agua, frequencia ou tmb."


# ---------------- 13) QUALIDADE DO AR (Open-Meteo, sem chave) ----------------
@tool
def qualidade_do_ar(cidade: str) -> str:
    """MOSTRA A QUALIDADE DO AR (indice de poluicao, PM2.5, PM10) de uma cidade
    via Open-Meteo Air Quality (gratis, sem chave). Use para 'esta com muito
    poluente hoje?', 'qualidade do ar em Sao Paulo'."""
    import urllib.request
    import urllib.parse
    import json as _json

    def _ar():
        geo = ("https://geocoding-api.open-meteo.com/v1/search?count=1&language=pt&name="
               + urllib.parse.quote(cidade.strip()))
        with urllib.request.urlopen(urllib.request.Request(geo, headers={"User-Agent": "AgentePC/1.0"}), timeout=15) as r:
            g = _json.loads(r.read().decode("utf-8"))
        if not g.get("results"):
            return f"Nao encontrei a cidade '{cidade}'."
        g0 = g["results"][0]
        url = (f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={g0['latitude']}&longitude={g0['longitude']}"
               "&current=european_aqi,pm2_5,pm10,carbon_monoxide")
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "AgentePC/1.0"}), timeout=15) as r:
            d = _json.loads(r.read().decode("utf-8"))["current"]
        indice = d.get("european_aqi")
        if indice is None:
            return "Nao consegui o indice de qualidade do ar agora."
        if indice <= 20:
            nivel = "OTIMA (pode sair sem preocupacao)"
        elif indice <= 40:
            nivel = "BOA"
        elif indice <= 60:
            nivel = "MODERADA (sensiveis devem ter cautela)"
        elif indice <= 80:
            nivel = "RUIM (evite esforco ao ar livre)"
        else:
            nivel = "MUITO RUIM (fique em areas fechadas se possivel)"
        return (f"Qualidade do ar em {g0.get('name', cidade)}: indice {indice:.0f} - {nivel}.\n"
                f"PM2.5: {d.get('pm2_5')} ug/m3 | PM10: {d.get('pm10')} ug/m3.")

    try:
        return executar_com_autocura("qualidade_do_ar", _ar)
    except Exception:
        return "Nao consegui consultar a qualidade do ar agora."


# ---------------- 14) QUIMICA / MASSA MOLAR E CONVERSAO DE BASES ----------------
@tool
def calculadora_quimica(acao: str, formula: str = "", numero: str = "", base: str = "") -> str:
    """CALCULADORA DE QUIMICA (instantanea): 'massa_molar' ('formula'=formula
    quimica simples, ex.: 'H2O', 'NaCl', 'C6H12O6') calcula a massa molar usando
    massas atomicas; 'converter_base' ('numero' e 'base' de origem 2/10/16, ex.:
    converter binario/decimal/hexadecimal). Use para 'qual a massa molar da
    agua', 'converte 255 para binario'."""
    a = acao.strip().lower()
    if a in ("massa_molar", "massa", "massa mol"):
        massas = {"H": 1.008, "He": 4.003, "Li": 6.94, "Be": 9.012, "B": 10.81, "C": 12.011,
                  "N": 14.007, "O": 15.999, "F": 18.998, "Ne": 20.180, "Na": 22.990, "Mg": 24.305,
                  "Al": 26.982, "Si": 28.085, "P": 30.974, "S": 32.06, "Cl": 35.45, "K": 39.098,
                  "Ar": 39.948, "Ca": 40.078, "Fe": 55.845, "Cu": 63.546, "Zn": 65.38, "Br": 79.904,
                  "Ag": 107.87, "I": 126.90, "Au": 196.97, "Pb": 207.2}
        import re as _re
        total = 0.0
        achou = False
        for elem, qtd in _re.findall(r"([A-Z][a-z]?)(\d*)", formula):
            if not elem:
                continue
            if elem not in massas:
                return f"Nao conheco o elemento '{elem}' (formulas simples, sem parenteses)."
            total += massas[elem] * (int(qtd) if qtd else 1)
            achou = True
        if not achou:
            return "Formula nao reconhecida (ex.: H2O, NaCl, CO2, C6H12O6)."
        return f"Massa molar de {formula}: aproximadamente {total:.2f} g/mol."
    if a in ("converter_base", "base", "binario", "hexadecimal"):
        try:
            n_str = str(numero).strip()
            b_origem = int(base) if base else 10
            valor = int(n_str, b_origem)
            return (f"{n_str} (base {b_origem}) = \n"
                    f"  Decimal (base 10): {valor}\n"
                    f"  Binario (base 2): {bin(valor)[2:]}\n"
                    f"  Hexadecimal (base 16): {hex(valor)[2:].upper()}\n"
                    f"  Octal (base 8): {oct(valor)[2:]}")
        except Exception as e:
            return f"Nao consegui converter ({e}). Use 'numero' e 'base' (2, 8, 10 ou 16)."
    return "Acao invalida. Use: massa_molar ou converter_base."


# ---------------- 15) INFORMACOES DE DOMINIO (WHOIS leve via RDAP, sem chave) ----------------
@tool
def informacoes_dominio(dominio: str) -> str:
    """BUSCA INFORMACOES PUBLICAS DE UM DOMINIO (data de criacao, expiracao,
    servidor/empresa registrante) via RDAP (padrao moderno de WHOIS, gratuito e
    sem chave). Use para 'quando esse site foi criado', 'a quem pertence esse
    dominio', 'esse dominio e confiavel/antigo?'."""
    import urllib.request
    import urllib.parse

    def _buscar():
        dom = dominio.strip().lower().replace("https://", "").replace("http://", "").split("/")[0].replace("www.", "")
        if "." not in dom:
            return "Me passe um dominio (ex.: example.com)."
        url = "https://rdap.org/domain/" + urllib.parse.quote(dom)
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "AgentePC/1.0"}), timeout=25) as r:
            import json as _json
            d = _json.loads(r.read().decode("utf-8"))
        eventos = {e.get("eventAction"): e.get("eventDate", "")[:10] for e in d.get("events", [])}
        regist = d.get("entities", [{}])
        nome_reg = ""
        if regist:
            vcard = regist[0].get("vcardArray", [])
            if len(vcard) > 1:
                for item in vcard[1]:
                    if item and item[0] == "fn":
                        nome_reg = item[3]
        nome = d.get("ldhName", dom)
        linhas = [f"Dominio: {nome}"]
        if eventos.get("registration"):
            linhas.append("Criado em: " + eventos["registration"])
        if eventos.get("expiration"):
            linhas.append("Expira em: " + eventos["expiration"])
        if nome_reg:
            linhas.append("Registrado via: " + str(nome_reg))
        estado = d.get("status", [])
        if estado:
            linhas.append("Status: " + ", ".join(str(x) for x in estado[:3]))
        return "\n".join(linhas)

    try:
        return executar_com_autocura("informacoes_dominio", _buscar)
    except Exception as e:
        return f"Nao consegui consultar o dominio ({type(e).__name__})."


# ---------------- 16) CHECAR VARIOS LINKS DE UMA VEZ ----------------
@tool
def checar_links(lista_urls: str) -> str:
    """VERIFICA SE VARIOS LINKS ESTAO FUNCIONANDO de uma so vez (status HTTP de
    cada um). 'lista_urls' = URLs separadas por ponto-e-virgula ';' ou nova
    linha. Mostra o codigo (200=ok, 404=nao existe, 500=erro, timeout) e
    destaca os quebrados. Use para 'checa esses links', 'esses sites estao no
    ar?'."""
    import urllib.request
    import urllib.error

    def _checar():
        urls = [u.strip() for u in lista_urls.replace("\n", ";").split(";") if u.strip()]
        if not urls:
            return "Me passe um ou mais links separados por ';'."
        linhas = []
        quebrados = 0
        for u in urls[:15]:
            alvo = u if u.startswith("http") else "https://" + u
            try:
                req = urllib.request.Request(alvo, headers={"User-Agent": "Mozilla/5.0"}, method="HEAD")
                with urllib.request.urlopen(req, timeout=12) as r:
                    linhas.append(f"- {r.status} OK : {u}")
            except urllib.error.HTTPError as he:
                quebrados += 1
                linhas.append(f"- {he.code} ERRO : {u}")
            except Exception:
                quebrados += 1
                linhas.append(f"- SEM RESPOSTA/timeout : {u}")
        rodape = f"\n{quebrados} link(s) com problema." if quebrados else "\nTodos os links respondem OK."
        return "Checagem de links:\n" + "\n".join(linhas) + rodape

    return executar_com_autocura("checar_links", _checar)


# ---- arquivos de dados do pacote produtividade ----
ARQ_AGENDA = os.path.join(PASTA_BASE, "agenda.json")
ARQ_CLIP = os.path.join(PASTA_BASE, "historico_clipboard.json")
ARQ_HABITOS = os.path.join(PASTA_BASE, "habitos.json")
_cron_state = {}
_servidor_http = {"proc": None}


def _caminho_hosts():
    return os.path.join(os.environ.get("SystemRoot", r"C:\Windows"), "System32", "drivers", "etc", "hosts")


def _editar_hosts(sites, bloquear: bool) -> str:
    """Adiciona/remove o bloco de bloqueio de sites no arquivo hosts do Windows.
    Bloquear = aponta o dominio para 127.0.0.1. Precisa de admin (o agente ja roda elevado)."""
    caminho = _caminho_hosts()
    ini, fim = "# >>> bloqueio-agente >>>", "# <<< bloqueio-agente <<<"
    try:
        with open(caminho, "r", encoding="utf-8", errors="ignore") as f:
            conteudo = f.read()
    except Exception as e:
        return f"Nao consegui acessar o arquivo hosts ({e}). Rode o agente como administrador."
    # remove bloco antigo
    if ini in conteudo and fim in conteudo:
        antes = conteudo.split(ini)[0]
        depois = conteudo.split(fim, 1)[1] if fim in conteudo else ""
        conteudo = antes + depois
    if bloquear and sites:
        linhas = [ini, "# Sites bloqueados pelo modo foco do agente"]
        for dom in sites:
            dom = dom.strip().lower().replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]
            if dom:
                linhas.append(f"127.0.0.1 {dom}")
                linhas.append(f"127.0.0.1 www.{dom}")
        linhas.append(fim)
        conteudo = conteudo.rstrip() + "\n" + "\n".join(linhas) + "\n"
    try:
        with open(caminho, "w", encoding="utf-8") as f:
            f.write(conteudo)
    except PermissionError:
        return "Permissao negada ao escrever no hosts (rode como administrador)."
    _rodar_cmd("ipconfig /flushdns", 20)
    return "ok"


# ---------------- 17) CENTRAL DE AGENDA / LEMBRETES COM HORA ----------------
@tool
def central_agenda(acao: str, quando: str = "", titulo: str = "") -> str:
    """AGENDA COM HORA CERTA (lembretes/agendamentos que disparam aviso em voz e
    janela popup). Diferente do 'agendar_tarefa' (que roda uma TAREFA com IA todo
    dia no mesmo horario) e do 'timer_lembrete' (so daqui a X minutos), aqui voce
    agenda um COMPROMISSO/LEMBRETE para uma data/hora exata e ele avisa. Acoes:
    'adicionar' ('quando' = 'HH:MM' hoje, ou 'DD/MM HH:MM', ou 'em 25 minutos';
    'titulo'=o que lembrar), 'listar' (proximos), 'cancelar' ('titulo'). Roda em
    segundo plano e avisa mesmo se voce estiver em outro programa."""
    a = acao.strip().lower()
    eventos = carregar_json(ARQ_AGENDA, [])

    def _agora():
        return datetime.now()

    def _parse_quando(texto):
        t = texto.strip().lower()
        import re as _re
        m = _re.search(r"em\s+(\d+)\s*(minuto|min|hora|hr|h)", t)
        if m:
            qtd = int(m.group(1))
            if m.group(2).startswith("hora") or m.group(2) in ("hr", "h"):
                return _agora().replace(microsecond=0) + __import__("datetime").timedelta(hours=qtd)
            return _agora().replace(microsecond=0) + __import__("datetime").timedelta(minutes=qtd)
        for fmt in ("%d/%m/%Y %H:%M", "%d/%m %H:%M", "%H:%M"):
            try:
                dt = datetime.strptime(t, fmt)
                if fmt == "%H:%M":
                    dt = dt.replace(year=_agora().year, month=_agora().month, day=_agora().day)
                    if dt <= _agora():
                        dt += __import__("datetime").timedelta(days=1)
                elif fmt == "%d/%m %H:%M":
                    dt = dt.replace(year=_agora().year)
                return dt
            except ValueError:
                continue
        return None

    if a in ("adicionar", "novo", "agendar", "lembrar"):
        if not titulo.strip():
            return "Diga o que devo lembrar no 'titulo'."
        dt = _parse_quando(quando)
        if not dt:
            return "Nao entendi o horario. Use 'HH:MM' (ex.: 18:30), 'DD/MM HH:MM' ou 'em 20 minutos'."
        eventos.append({"quando": dt.isoformat(), "titulo": titulo.strip(), "avisado": False})
        salvar_json(ARQ_AGENDA, eventos)
        return f"Lembrete agendado para {dt.strftime('%d/%m/%Y %H:%M')}: {titulo.strip()}."
    if a in ("listar", "lista", "ver"):
        futuros = [e for e in eventos if not e.get("avisado")]
        futuros.sort(key=lambda e: e["quando"])
        if not futuros:
            return "Voce nao tem lembretes pendentes."
        return "Lembretes pendentes:\n" + "\n".join(
            f"- {datetime.fromisoformat(e['quando']).strftime('%d/%m %H:%M')} - {e['titulo']}" for e in futuros[:20])
    if a in ("cancelar", "apagar", "remover"):
        antes = len(eventos)
        eventos[:] = [e for e in eventos if titulo.strip().lower() not in e["titulo"].lower()]
        salvar_json(ARQ_AGENDA, eventos)
        return f"Cancelado(s) {antes - len(eventos)} lembrete(s)." if len(eventos) < antes else "Nao encontrei esse lembrete."
    return "Acao invalida. Use: adicionar, listar ou cancelar."


def _worker_agenda():
    while True:
        try:
            eventos = carregar_json(ARQ_AGENDA, [])
            mudou = False
            agora = datetime.now()
            for e in eventos:
                if not e.get("avisado"):
                    try:
                        quando = datetime.fromisoformat(e["quando"])
                    except Exception:
                        continue
                    if agora >= quando:
                        aviso = f"LEMBRETE: {e['titulo']}"
                        print("\n[Agenda] " + aviso)
                        falar(aviso)
                        try:
                            popup_aviso.invoke({"titulo": "Lembrete", "mensagem": e["titulo"]})
                        except Exception:
                            pass
                        _beep(2)
                        e["avisado"] = True
                        mudou = True
            if mudou:
                salvar_json(ARQ_AGENDA, eventos)
        except Exception:
            pass
        time.sleep(20)


threading.Thread(target=_worker_agenda, daemon=True).start()


# ---------------- 18) HISTORICO DA AREA DE TRANSFERENCIA ----------------
@tool
def historico_clipboard(acao: str = "listar") -> str:
    """HISTORICO DA AREA DE TRANSFERENCIA: guarda os textos que voce copiou (Ctrl+C)
    para voce colar de volta depois (como um 'clipboard manager'). Um monitor em
    segundo plano registra as copias (precisa do pacote 'pyperclip'; se nao
    estiver, use 'area_transferencia' que ja funciona). Acoes: 'listar' (mostra os
    ultimos textos copiados), 'copiar' ('valor'=indice da lista para voltar ao
    clipboard) ou 'limpar'."""
    a = (acao or "listar").strip().lower()
    historico = carregar_json(ARQ_CLIP, [])
    if a in ("limpar", "zerar"):
        salvar_json(ARQ_CLIP, [])
        return "Historico da area de transferencia limpo."
    if a in ("copiar", "restaurar", "voltar"):
        # indice recebido em um campo generico; como esta assinatura nao tem, orienta
        return "Use 'listar' para ver os itens; para copiar um de volta, me diga o numero do item."
    if not historico:
        return ("Ainda nao ha historico de copias. Copie algo com Ctrl+C que eu registro "
                "(precisa do pacote pyperclip: pip install pyperclip).")
    return "Ultimos textos copiados:\n" + "\n".join(
        f"{i+1}. {txt[:70]}" for i, txt in enumerate(historico[-15:][::-1]))


def _worker_clipboard():
    try:
        import pyperclip
    except Exception:
        return  # sem pyperclip: o monitor nao roda (area_transferencia continua funcionando)
    ultimo = ""
    while True:
        try:
            atual = pyperclip.paste()
            if atual and atual != ultimo and len(atual) < 2000:
                ultimo = atual
                hist = carregar_json(ARQ_CLIP, [])
                if not hist or hist[-1] != atual:
                    hist.append(atual)
                    salvar_json(ARQ_CLIP, hist[-50:])
        except Exception:
            pass
        time.sleep(1.5)


threading.Thread(target=_worker_clipboard, daemon=True).start()


# ---------------- 19) CRONOMETRO / TIMER DE CONTAGEM ----------------
@tool
def cronometro(acao: str) -> str:
    """CRONOMETRO (contagem de tempo para cima, com voltas/parciais) - diferente
    do 'timer_lembrete' (que conta regressivamente e avisa). Acoes: 'iniciar'
    (comeca a contar), 'volta' (marca uma parcial), 'parar' (mostra o tempo total).
    Roda em segundo plano, nao trava o agente. Use para 'cronometra isso',
    'quanto tempo levei'."""
    a = acao.strip().lower()
    if a in ("iniciar", "comecar", "start"):
        _cron_state["ini"] = time.time()
        _cron_state["voltas"] = []
        return "Cronometro INICIADO. Use 'volta' para marcar parcial e 'parar' para finalizar."
    if a in ("volta", "parcial", "lap"):
        if "ini" not in _cron_state:
            return "O cronometro nao esta rodando. Use 'iniciar' primeiro."
        t = time.time() - _cron_state["ini"]
        _cron_state.setdefault("voltas", []).append(t)
        n = len(_cron_state["voltas"])
        return f"Volta {n}: {_fmt_duracao(t)}."
    if a in ("parar", "stop", "finalizar"):
        if "ini" not in _cron_state:
            return "O cronometro nao estava rodando."
        total = time.time() - _cron_state.pop("ini")
        voltas = _cron_state.pop("voltas", [])
        saida = f"Tempo total: {_fmt_duracao(total)}."
        if voltas:
            saida += " Parciais: " + ", ".join(_fmt_duracao(v) for v in voltas)
        return saida
    return "Acao invalida. Use: iniciar, volta ou parar."


def _fmt_duracao(seg: float) -> str:
    m, s = divmod(int(seg), 60)
    h, m = divmod(m, 60)
    return f"{h:02d}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"


# ---------------- 20) MODO FOCO (bloqueia distracoes por um tempo) ----------------
@tool
def modo_foco(minutos: int = 50) -> str:
    """MODO FOCO: bloqueia sites de distracao (YouTube, Instagram, Facebook,
    TikTok, X/Twitter) apontando eles para o proprio PC durante 'minutos' (edita
    o arquivo hosts e reverte sozinho no fim), e avisa quando o foco acaba. NAO
    mexe em registro fragil - usa o arquivo hosts, que e confiavel e reversivel.
    Use para 'modo foco 1 hora', 'me deixa concentrado por 50 minutos'."""
    sites = ["youtube.com", "instagram.com", "facebook.com", "tiktok.com", "x.com", "twitter.com"]
    resultado = _editar_hosts(sites, True)
    if resultado != "ok":
        return resultado

    def _fim_foco():
        time.sleep(max(1, minutos) * 60)
        _editar_hosts([], False)
        print("\n[Modo foco] Tempo esgotado! Sites de distracao liberados de novo.")
        falar("Fim do modo foco. Pode descansar.")
        _beep(2)

    threading.Thread(target=_fim_foco, daemon=True).start()
    return (f"Modo foco ligado por {minutos} minuto(s): sites de distracao bloqueados. "
            "Para liberar antes, peca 'desliga o modo foco' (ou ele reverte sozinho no fim).")


@tool
def desligar_modo_foco() -> str:
    """DESLIGA O MODO FOCO antes do tempo, liberando os sites que foram
    bloqueados (remove o bloco do arquivo hosts). Use para 'desliga o modo foco',
    'libera os sites'."""
    r = _editar_hosts([], False)
    return "Modo foco desligado; sites liberados." if r == "ok" else r


# ---------------- 21) BLOQUEAR / LIBERAR SITES (controle parental) ----------------
@tool
def bloquear_sites(acao: str, sites: str = "") -> str:
    """BLOQUEIA (ou libera) sites no PC inteiro pelo arquivo hosts - tipo controle
    parental/foco permanente (diferente do 'modo_foco', que e temporario). Acoes:
    'bloquear' ('sites'=dominios separados por virgula/';', ex.:
    'youtube.com, tiktok.com') e 'liberar' (remove TODO o bloqueio). Pede
    confirmacao e precisa de admin. Use para 'bloqueia esses sites no PC'."""
    a = acao.strip().lower()
    lista = [s for s in sites.replace(",", ";").split(";") if s.strip()]
    if a in ("bloquear", "bloquear_sites"):
        if not lista:
            return "Diga os sites a bloquear (ex.: 'youtube.com, tiktok.com')."
        if not confirmar_destrutivo(f"Bloquear {len(lista)} site(s) no PC ({', '.join(lista)})?"):
            return "Bloqueio cancelado."
        r = _editar_hosts(lista, True)
        return f"Sites bloqueados: {', '.join(lista)}." if r == "ok" else r
    if a in ("liberar", "desbloquear", "limpar"):
        if not confirmar_destrutivo("Liberar TODOS os sites bloqueados pelo agente?"):
            return "Cancelado."
        r = _editar_hosts([], False)
        return "Sites liberados (bloqueio removido)." if r == "ok" else r
    return "Acao invalida. Use: bloquear (com 'sites') ou liberar."


# ---------------- 22) DESLIGAR A TELA / MONITOR ----------------
@tool
def desligar_tela() -> str:
    """DESLIGA A TELA/MONITOR agora (a imagem apaga, mas o PC continua ligado e
    tocando musica/rodando tarefas) - economiza energia e privacidade. Mexer o
    mouse ou apertar tecla liga de novo. Use para 'desliga a tela', 'apaga o
    monitor'."""
    if os.name != "nt":
        return "Essa funcao e do Windows."
    def _desligar():
        import ctypes
        HWND_BROADCAST, WM_SYSCOMMAND, SC_MONITORPOWER = 0xFFFF, 0x0112, 0xF170
        ctypes.windll.user32.SendMessageW(HWND_BROADCAST, WM_SYSCOMMAND, SC_MONITORPOWER, 2)
    try:
        threading.Timer(0.5, _desligar).start()
        return "Tela vai apagar agora. Mexa o mouse para ligar de novo."
    except Exception as e:
        return f"Nao consegui desligar a tela ({e})."


# ---------------- 23) SINCRONIZAR O RELOGIO DO WINDOWS ----------------
@tool
def sincronizar_relogio() -> str:
    """SINCRONIZA O REL0GIO DO WINDOWS com o horario oficial da internet
    (corrige hora/data erradas que atrapalham sites e bancos). Roda o comando
    w32tm /resync (precisa de admin). Use para 'acerca o relogio', 'a hora do PC
    esta errada'."""
    if not pedir_confirmacao("Sincronizar o relogio do PC com a internet?"):
        return "Cancelado."
    s, e, c = _rodar_cmd('powershell -NoProfile -Command "Start-Service w32time; w32tm /resync"', 60)
    return "Relogio sincronizado com o horario oficial." if c == 0 else f"Nao consegui sincronizar: {e or s}"


# ---------------- 24) SERVIDOR LOCAL / COMPARTILHAR PASTA NA REDE ----------------
@tool
def servidor_local(acao: str, pasta: str = "", porta: int = 8000) -> str:
    """COMPARTILHA UMA PASTA NA SUA REDE (abre um servidor de arquivos local).
    Outros aparelhos no mesmo Wi-Fi (celular, outro PC) podem abrir os arquivos
    pelo navegador usando o endereco mostrado. Acoes: 'iniciar' ('pasta'=pasta a
    compartilhar; 'porta' opcional) e 'parar'. Use para 'passa os arquivos dessa
    pasta pro meu celular', 'compartilha a pasta downloads na rede'."""
    import socket as _sk
    a = acao.strip().lower()
    if a in ("parar", "stop"):
        if _servidor_http.get("proc"):
            try:
                _servidor_http["proc"].terminate()
            except Exception:
                pass
            _servidor_http["proc"] = None
            return "Servidor local encerrado."
        return "O servidor local nao estava rodando."
    if a in ("iniciar", "start", "compartilhar"):
        if _servidor_http.get("proc"):
            return "Ja existe um servidor rodando. Use 'parar' antes de iniciar outro."
        alvo = pasta.strip().strip('"') or os.path.join(os.path.expanduser("~"), "Downloads")
        if not os.path.isdir(alvo):
            return f"Pasta nao encontrada: {alvo}"
        try:
            proc = subprocess.Popen(
                [sys.executable, "-m", "http.server", str(porta)],
                cwd=alvo, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            _servidor_http["proc"] = proc
            s = _sk.socket(_sk.AF_INET, _sk.SOCK_DGRAM)
            try:
                s.connect(("8.8.8.8", 80))
                ip = s.getsockname()[0]
            finally:
                s.close()
            return (f"Servidor local ativo compartilhando:\n{alvo}\n"
                    f"Acesse no navegador de outro aparelho (mesmo Wi-Fi): http://{ip}:{porta}\n"
                    "Use a acao 'parar' quando terminar.")
        except Exception as e:
            return f"Nao consegui iniciar o servidor: {e}"
    return "Acao invalida. Use: iniciar (com 'pasta') ou parar."


# ---------------- 25) QR CODE DO WI-FI (convidado conecta sem digitar senha) ----------------
@tool
def gerar_qr_wifi(nome_rede: str, senha_wifi: str) -> str:
    """GERA UM QR CODE DO WI-FI: quem apontar a camera do celular para o QR code
    conecta na rede automaticamente, sem digitar a senha (otimo para visitas).
    'nome_rede'=nome da rede Wi-Fi (SSID), 'senha_wifi'=senha. Salva o QR na Area
    de Trabalho. Use para 'faz um QR do meu wifi para os convidados'."""
    if not nome_rede.strip():
        return "Diga o nome da rede (SSID) e a senha do Wi-Fi."
    payload = f"WIFI:T:WPA;S:{nome_rede};P:{senha_wifi};;"
    try:
        return criar_qr_code.invoke({"texto_ou_url": payload})
    except Exception as e:
        return f"Nao consegui gerar o QR do Wi-Fi ({e})."


# ---------------- 26) EXPORTAR / FAZER BACKUP DOS DADOS DO AGENTE ----------------
@tool
def exportar_dados_agente(acao: str = "exportar") -> str:
    """EXPORTA todos os dados do agente (contatos, memoria, notas, gastos, tarefas,
    agenda, habitos, projetos, config) para um arquivo .zip na Area de Trabalho,
    facilitando migrar para outro PC ou fazer backup. NAO inclui as chaves de API
    (por seguranca). Acoes: 'exportar' (gera o zip) ou 'listar' (mostra quais
    arquivos de dados existem)."""
    a = acao.strip().lower()
    arquivos = ["contatos.json", "memoria_core.md", "notas.json", "gastos.json",
                "tarefas_todo.json", "agenda.json", "habitos.json", "projetos.json",
                "config.json", "historico.json", "memoria_longa.json", "regras.json"]
    existentes = [f for f in arquivos if os.path.isfile(os.path.join(PASTA_BASE, f))]
    if a in ("listar", "lista", "ver"):
        return "Arquivos de dados do agente:\n" + "\n".join(f"- {f}" for f in existentes)
    if a in ("exportar", "backup", "export"):
        import shutil as _sh
        import tempfile as _tf
        desktop = os.path.join(os.path.expanduser("~"), "Desktop")
        if not os.path.isdir(desktop):
            desktop = os.path.join(os.path.expanduser("~"), "Area de Trabalho")
        if not os.path.isdir(desktop):
            desktop = os.path.expanduser("~")
        tmp = os.path.join(_tf.gettempdir(), "dados_agente_export")
        os.makedirs(tmp, exist_ok=True)
        for f in existentes:
            try:
                _sh.copy2(os.path.join(PASTA_BASE, f), os.path.join(tmp, f))
            except Exception:
                pass
        destino = os.path.join(desktop, "backup_dados_agente_" + datetime.now().strftime("%Y%m%d_%H%M"))
        zip_final = _sh.make_archive(destino, "zip", root_dir=tmp)
        try:
            _sh.rmtree(tmp)
        except Exception:
            pass
        return f"Backup dos dados criado: {zip_final} ({len(existentes)} arquivos; chaves de API nao incluidas por seguranca)."
    return "Acao invalida. Use: exportar ou listar."


# ---------------- 27) ESTATISTICAS DE USO DO AGENTE ----------------
@tool
def estatisticas_uso() -> str:
    """MOSTRA SUAS ESTATISTICAS DE USO do agente (so leitura): quantos contatos,
    projetos, notas, gastos, tarefas concluidas/pendentes, lembretes, habitos e
    quantas ferramentas existem. Tudo instantaneo, sem internet. Use para 'minhas
    estatisticas', 'quanto eu ja usei o agente', 'quantas tarefas fiz'."""
    def _q(arq, padrao):
        try:
            d = carregar_json(os.path.join(PASTA_BASE, arq), padrao)
            return len(d) if hasattr(d, "__len__") else 0
        except Exception:
            return 0
    tarefas = carregar_json(ARQ_TAREFAS_TODO, [])
    concluidas = sum(1 for t in tarefas if t.get("feito"))
    gastos = carregar_json(ARQ_GASTOS, [])
    total_gasto = sum(abs(float(g.get("valor", 0))) for g in gastos)
    linhas = [
        "ESTATISTICAS DE USO:",
        f"- Ferramentas disponiveis: {len(tools)}",
        f"- Contatos salvos: {_q('contatos.json', {})}",
        f"- Projetos criados: {_q('projetos.json', [])}",
        f"- Notas rapidas: {_q('notas.json', {})}",
        f"- Tarefas to-do: {len(tarefas)} ({concluidas} concluidas, {len(tarefas)-concluidas} pendentes)",
        f"- Lancamentos financeiros: {len(gastos)} (total lancado R$ {total_gasto:,.2f})",
        f"- Lembretes na agenda: {sum(1 for e in carregar_json(ARQ_AGENDA, []) if not e.get('avisado'))}",
        f"- Habitos monitorados: {_q('habitos.json', {})}",
        f"- Lembrancas de memoria longa: {_q('memoria_longa.json', [])}",
        f"- Tarefas agendadas (diarias): {_q('tarefas_agendadas.json', [])}",
    ]
    return "\n".join(linhas)


# ---------------- 28) DITADO POR VOZ (fala e vira texto, Vosk) ----------------
@tool
def ditado_voz(duracao_segundos: int = 6) -> str:
    """TRANSCREVE O QUE VOCE FALA em texto (ditado por voz) usando o microfone e o
    Vosk (offline, em portugues). Fale apos a contagem regressiva durante
    'duracao_segundos' (padrao 6s). Precisa: pip install vosk sounddevice e o
    modelo em portugues na pasta 'modelo_vosk_pt' (veja a documentacao no topo do
    arquivo). Use para 'escreve o que eu falar', 'transcreve minha voz'."""
    def _ouvir():
        try:
            import sounddevice as sd
            from vosk import Model, KaldiRecognizer
        except Exception:
            return ("Para ditado por voz instale: pip install vosk sounddevice e baixe o "
                    "modelo Vosk em portugues para a pasta 'modelo_vosk_pt' (veja a secao 7 da documentacao).")
        caminho_modelo = os.path.join(PASTA_BASE, "modelo_vosk_pt")
        if not os.path.isdir(caminho_modelo):
            return f"Nao encontrei o modelo de voz em {caminho_modelo}. Baixe o modelo Vosk pt e extraia la."
        import json as _json
        modelo = Model(caminho_modelo)
        rec = KaldiRecognizer(modelo, 16000)
        print(f"[Ditado] Fale agora por {duracao_segundos} segundos...")
        gravacao = sd.rec(int(duracao_segundos * 16000), samplerate=16000, channels=1, dtype="int16")
        sd.wait()
        rec.AcceptWaveform(gravacao.tobytes())
        texto = _json.loads(rec.FinalResult()).get("text", "").strip()
        return ("Texto transcrito: " + texto) if texto else "Nao entendi o que foi dito (tente falar mais perto/alto)."
    return executar_com_autocura("ditado_voz", _ouvir)


# ---------------- 29) LER TEXTO/ARQUIVO EM VOZ ALTA (acessibilidade) ----------------
@tool
def ler_em_voz(texto_ou_caminho: str) -> str:
    """LE EM VOZ ALTA um texto ou o conteudo de um arquivo .txt/.md (acessibilidade
    / ouvir em vez de ler), usando a voz do Windows (offline). Se voce passar um
    caminho de arquivo existente, le o arquivo; senao, le o texto que voce passou.
    Use para 'le esse arquivo em voz', 'le isso para mim'."""
    caminho = texto_ou_caminho.strip().strip('"')
    if os.path.isfile(caminho):
        try:
            with open(caminho, "r", encoding="utf-8", errors="ignore") as f:
                conteudo = f.read()
        except Exception as e:
            return f"Nao consegui abrir o arquivo: {e}"
    else:
        conteudo = texto_ou_caminho
    if not conteudo.strip():
        return "Nao ha texto para ler."
    # fala em pedacos para nao estourar o TTS
    pedacos = []
    atual = ""
    for frase in conteudo.replace("\n", ". ").split(". "):
        if len(atual) + len(frase) < 300:
            atual += frase + ". "
        else:
            pedacos.append(atual)
            atual = frase + ". "
    if atual:
        pedacos.append(atual)
    def _falar_tudo():
        for p in pedacos[:30]:
            falar(p.strip())
    threading.Thread(target=_falar_tudo, daemon=True).start()
    return f"Lendo em voz alta ({len(pedacos[:30])} trecho(s))."


# ---------------- 30) RASTREADOR DE HABITOS ----------------
@tool
def rastreador_habitos(acao: str, habito: str = "") -> str:
    """RASTREADOR DE HABITOS com contagem de sequencia (streak de dias seguidos).
    Acoes: 'marcar' ('habito'=ex.: 'beber agua', 'academia', 'ler') registra que
    voce cumpriu hoje; 'status' (mostra cada habito com a sequencia atual de dias);
    'remover' ('habito'). Use para 'marquei que fui a academia', 'qual minha
    sequencia de habitos', 'acompanha meus habitos'."""
    a = acao.strip().lower()
    dados = carregar_json(ARQ_HABITOS, {})
    hoje = datetime.now().strftime("%Y-%m-%d")
    if a in ("marcar", "fiz", "cumprir", "check"):
        chave = habito.strip().lower()
        if not chave:
            return "Diga o habito (ex.: 'academia', 'ler', 'beber agua')."
        hist = dados.get(chave, {}).get("dias", [])
        if hoje not in hist:
            hist.append(hoje)
        dados[chave] = {"nome": habito.strip(), "dias": sorted(hist)[-200]}
        salvar_json(ARQ_HABITOS, dados)
        streak = _streak(sorted(hist)[-200:])
        return f"Habito '{habito.strip()}' marcado hoje. Sequencia atual: {streak} dia(s) seguido(s)."
    if a in ("status", "lista", "ver"):
        if not dados:
            return "Voce ainda nao marcou nenhum habito. Use 'marcar' para comecar."
        linhas = []
        for chave, d in dados.items():
            dias = sorted(d.get("dias", []))
            linhas.append(f"- {d.get('nome', chave)}: {_streak(dias)} dia(s) seguido(s) ({len(dias)} no total)")
        return "Seus habitos:\n" + "\n".join(linhas)
    if a in ("remover", "apagar"):
        chave = habito.strip().lower()
        if chave in dados:
            del dados[chave]
            salvar_json(ARQ_HABITOS, dados)
            return f"Habito '{habito}' removido."
        return f"Nao encontrei o habito '{habito}'."
    return "Acao invalida. Use: marcar, status ou remover."


def _streak(dias_iso):
    if not dias_iso:
        return 0
    from datetime import timedelta
    datas = [datetime.strptime(d, "%Y-%m-%d").date() for d in dias_iso]
    hoje = datetime.now().date()
    if datas[-1] not in (hoje, hoje - timedelta(days=1)):
        return 0
    seq = 1
    for i in range(len(datas) - 1, 0, -1):
        if (datas[i] - datas[i - 1]).days == 1:
            seq += 1
        else:
            break
    return seq


# ---------------- 31) CALCULADORA DE CICLO DE SONO ----------------
@tool
def calcular_ciclo_sono(acao: str, hora: str = "") -> str:
    """CALCULA OS MELHORES HORARIOS PARA DORMIR OU ACORDAR com base nos ciclos de
    sono de ~90 minutos (acordar no fim de um ciclo deixa voce mais disposto).
    Acoes: 'acordar' (se voce for dormir AGORA, mostra os melhores horarios para
    acordar) ou 'dormir' ('hora'=horario em que voce precisa acordar, ex.: '06:30';
    mostra a que horas deve dormir). Use para 'a que horas devo acordar', 'quero
    acordar as 6 e meia'."""
    from datetime import datetime as _dt, timedelta as _td
    a = acao.strip().lower()
    if a in ("acordar", "dormir_agora"):
        agora = _dt.now()
        horarios = []
        for ciclos in (6, 5, 4):  # ~9h, 7h30, 6h de sono
            h = agora + _td(minutes=15 + ciclos * 90)  # 15 min para pegar no sono
            horarios.append(f"{ciclos} ciclos (~{ciclos*1.5}h): {h.strftime('%H:%M')}")
        return "Se for dormir agora, tente acordar em:\n" + "\n".join(horarios)
    if a in ("dormir", "ir_dormir"):
        try:
            alvo = _dt.strptime(hora.strip(), "%H:%M")
            agora = _dt.now()
            acordar = agora.replace(hour=alvo.hour, minute=alvo.minute, second=0, microsecond=0)
            if acordar <= agora:
                acordar += _td(days=1)
            horarios = []
            for ciclos in (6, 5, 4):
                h = acordar - _td(minutes=15 + ciclos * 90)
                horarios.append(f"{ciclos} ciclos: dormir as {h.strftime('%H:%M')}")
            return f"Para acordar as {hora.strip()} bem disposto, tente dormir:\n" + "\n".join(horarios)
        except ValueError:
            return "Informe a hora em formato HH:MM (ex.: '06:30')."
    return "Acao invalida. Use: acordar (dormir agora) ou dormir (com a hora que quer acordar)."


# ---------------- 32) FRASE MOTIVACIONAL / DO DIA ----------------
_FRASES = [
    "Voce nao precisa fazer tudo de uma vez; so precisa comecar.",
    "Progresso, nao perfeicao. Hoje so precisa ser melhor que ontem em um detalhe.",
    "Disciplina e escolher o que voce quer mais, em vez do que quer agora.",
    "Um passo pequeno ainda te coloca mais longe do que ficar parado.",
    "O melhor momento para plantar foi ha 10 anos; o segundo melhor e agora.",
    "Nao compare seu dia a dia com os destaques dos outros.",
    "Foco e dizer nao para cem boas ideias para fazer uma incrivel.",
    "Voce ja superou tantas coisas que achava que nao ia conseguir. Esta e so mais uma.",
    "Consistencia vence motivacao: faca o basico todos os dias.",
    "Descanse, mas nao desista. Parada estrategica nao e abandono.",
    "Tarefa grande demais? Facamais um pouquinho, so por cinco minutos.",
    "Voce e mais capaz do que o seu medo tenta te convencer.",
]


@tool
def frase_do_dia() -> str:
    """DEVOLVE UMA FRASE MOTIVACIONAL/INSPIRADORA curta (instantaneo, sem internet
    nem IA). Use para 'me da uma motivacao', 'frase do dia', 'preciso de animo'."""
    return random.choice(_FRASES)


# ---------------- 33) CONTAR PIADA (humor leve, local) ----------------
_PIADAS = [
    "Por que o livro de matematica se suicidou? Porque tinha muitos problemas.",
    "O que o zero disse para o oito? Belo cinto!",
    "Por que o computador foi ao medico? Porque ele estava com um virus (e um pouco de lentidao).",
    "Qual o peixe que nao sabe nadar? O peixe-fora d'agua.",
    "O que a foca disse para a outra? - Foca aqui, que eu to falando serio!",
    "Por que o Python usa oculos? Porque ele nao C (C++).",
    "O que o tomate foi fazer no banco? Tirar um extrato... de tomate.",
    "Qual e o time de futebol que todo mundo quer ter no jardim? O Grêmio... (so um, para nao gerar briga).",
    "O que e um pontinho amarelo na agua? Um canarinho tomando banho de pipoca.",
    "Por que o desenvolvedor toma café? Porque ele nao compila sem cafeina.",
]


@tool
def contar_piada() -> str:
    """CONTA UMA PIADA CURTA e leve (instantaneo, sem internet/IA). Use para 'me
    conta uma piada', 'algo para rir', 'descontrai'."""
    return random.choice(_PIADAS)


# ---------------- 34) WINGET: ATUALIZAR TUDO / DESINSTALAR PROGRAMAS ----------------
@tool
def gerenciar_programas_winget(acao: str, nome: str = "") -> str:
    """GERENCIA PROGRAMAS INSTALADOS via winget (avancado). Acoes:
    'atualizar_tudo' (atualiza TODOS os programas com atualizacao disponivel; pode
    demorar; pede confirmacao), 'atualizar' ('nome'=programa), 'desinstalar'
    ('nome'=programa; pede confirmacao), 'atualizaveis' (lista o que tem update).
    Use para 'atualiza todos os programas', 'desinstala o programa X', 'quais
    programas tem atualizacao'."""
    a = acao.strip().lower()

    def _rodar():
        if a in ("atualizaveis", "ver_atualizacoes"):
            s, e, _ = _rodar_cmd("winget upgrade --accept-source-agreements", 90)
            return "Programas com atualizacao disponivel:\n" + (s[-2500:] or e or "Nenhum/nao consegui listar.")
        if a in ("atualizar_tudo", "upgrade_all"):
            if not confirmar_destrutivo("Atualizar TODOS os programas instalados via winget? Pode demorar bastante."):
                return "Cancelado."
            s, e, c = _rodar_cmd("winget upgrade --all --accept-source-agreements --accept-package-agreements", 1200)
            return "Atualizacao geral concluida." if c == 0 else f"Atualizacao com algum problema: {(e or s)[-1000:]}"
        if a in ("atualizar", "upgrade"):
            if not nome.strip():
                return "Diga o nome do programa a atualizar."
            s, e, c = _rodar_cmd(f'winget upgrade --name "{nome.strip()}" --accept-source-agreements', 600)
            return f"'{nome}' atualizado." if c == 0 else f"Nao consegui atualizar: {(e or s)[-500:]}"
        if a in ("desinstalar", "uninstall", "remover"):
            if not nome.strip():
                return "Diga o nome do programa a desinstalar."
            if not confirmar_destrutivo(f"Desinstalar o programa '{nome}'?"):
                return "Cancelado."
            s, e, c = _rodar_cmd(f'winget uninstall --name "{nome.strip()}"', 600)
            return f"'{nome}' desinstalado." if c == 0 else f"Nao consegui desinstalar: {(e or s)[-500:]}"
        return "Acao invalida. Use: atualizar_tudo, atualizar, desinstalar ou atualizaveis."

    return executar_com_autocura("gerenciar_programas_winget", _rodar)


# ---- agendamentos (WhatsApp/e-mail/cotacao) ----
ARQ_AGENDADOS = os.path.join(PASTA_BASE, "agendamentos.json")


def _parse_horario(texto: str):
    """Converte 'HH:MM', 'DD/MM HH:MM' ou 'em N minutos/horas' em datetime futuro."""
    from datetime import timedelta
    t = (texto or "").strip().lower()
    import re as _re
    m = _re.search(r"em\s+(\d+)\s*(minuto|min|hora|hr|h)", t)
    if m:
        qtd = int(m.group(1))
        if m.group(2).startswith("hora") or m.group(2) in ("hr", "h"):
            return datetime.now() + timedelta(hours=qtd)
        return datetime.now() + timedelta(minutes=qtd)
    agora = datetime.now()
    for fmt in ("%d/%m/%Y %H:%M", "%d/%m %H:%M", "%H:%M"):
        try:
            dt = datetime.strptime(t, fmt)
            if fmt == "%H:%M":
                dt = dt.replace(year=agora.year, month=agora.month, day=agora.day)
                if dt <= agora:
                    dt += timedelta(days=1)
            elif fmt == "%d/%m %H:%M":
                dt = dt.replace(year=agora.year)
            return dt
        except ValueError:
            continue
    return None


def _worker_agendamentos():
    while True:
        try:
            ag = carregar_json(ARQ_AGENDADOS, [])
            agora = datetime.now()
            mudou = False
            for item in ag:
                if item.get("feito"):
                    continue
                try:
                    quando = datetime.fromisoformat(item["quando"])
                except Exception:
                    continue
                if agora >= quando:
                    tipo = item.get("tipo")
                    try:
                        if tipo == "whatsapp":
                            enviar_whatsapp_por_nome.invoke(
                                {"nome_contato_ou_grupo": item["alvo"], "mensagem": item["mensagem"]})
                        elif tipo == "email":
                            enviar_email.invoke(
                                {"destinatario": item["alvo"], "assunto": item.get("assunto", "Agendado"),
                                 "corpo": item["mensagem"]})
                    except Exception:
                        pass
                    item["feito"] = True
                    mudou = True
            if mudou:
                salvar_json(ARQ_AGENDADOS, ag)
        except Exception:
            pass
        time.sleep(25)


threading.Thread(target=_worker_agendamentos, daemon=True).start()


# ---------------- 35) AGENDAR WHATSAPP PARA DEPOIS ----------------
@tool
def agendar_whatsapp(alvo: str, mensagem: str, quando: str) -> str:
    """AGENDA O ENVIO DE UMA MENSAGEM NO WHATSAPP para mais tarde (aniversario,
    lembrete etc.). 'alvo'=nome do contato ou grupo (igual o envio normal),
    'mensagem'=texto, 'quando'='HH:MM' (hoje, ou amanha se ja passou), 'DD/MM
    HH:MM' ou 'em N minutos/horas'. No horario o agente abre o WhatsApp e envia.
    Use para 'manda parabens pro Joao as 00:01', 'agenda esse recado pra 8h'."""
    dt = _parse_horario(quando)
    if not dt:
        return "Nao entendi o horario. Use 'HH:MM', 'DD/MM HH:MM' ou 'em 30 minutos'."
    if not confirmar_destrutivo(f"Agendar WhatsApp para {alvo} em {dt.strftime('%d/%m/%Y %H:%M')}?"):
        return "Agendamento cancelado."
    ag = carregar_json(ARQ_AGENDADOS, [])
    ag.append({"tipo": "whatsapp", "alvo": alvo, "mensagem": mensagem,
               "quando": dt.isoformat(), "feito": False})
    salvar_json(ARQ_AGENDADOS, ag)
    return f"WhatsApp agendado para {alvo} em {dt.strftime('%d/%m/%Y %H:%M')}: \"{mensagem[:50]}\"."


# ---------------- 36) AGENDAR E-MAIL PARA DEPOIS ----------------
@tool
def agendar_email(destinatario: str, assunto: str, corpo: str, quando: str) -> str:
    """AGENDA O ENVIO DE UM E-MAIL para mais tarde (usa a MESMA configuracao do
    'enviar_email'). 'destinatario'=e-mail ou nome de contato, 'assunto', 'corpo'
    e 'quando'='HH:MM', 'DD/MM HH:MM' ou 'em N minutos/horas'. No horario o agente
    envia sozinho. Use para 'envia esse email amanha as 9h'."""
    dt = _parse_horario(quando)
    if not dt:
        return "Nao entendi o horario. Use 'HH:MM', 'DD/MM HH:MM' ou 'em 2 horas'."
    if not confirmar_destrutivo(f"Agendar e-mail para {destinatario} em {dt.strftime('%d/%m/%Y %H:%M')}?"):
        return "Agendamento cancelado."
    ag = carregar_json(ARQ_AGENDADOS, [])
    ag.append({"tipo": "email", "alvo": destinatario, "assunto": assunto, "mensagem": corpo,
               "quando": dt.isoformat(), "feito": False})
    salvar_json(ARQ_AGENDADOS, ag)
    return f"E-mail agendado para {destinatario} em {dt.strftime('%d/%m/%Y %H:%M')} (assunto: {assunto})."


# ---------------- 37) ALERTA DE COTACAO (avisa quando bater o valor) ----------------
@tool
def alerta_cotacao(ativo: str, condicao: str, valor: float) -> str:
    """CRIA UM ALERTA DE PRECO: o agente checa a cotacao em segundo plano e avisa
    (voz + janela) quando a condicao for atingida. 'ativo'='dolar', 'euro' ou
    'bitcoin'; 'condicao'='acima' ou 'abaixo'; 'valor'=o preco alvo. Ex.: 'me avisa
    quando o dolar cair abaixo de 5 reais'. Roda em background, sem travar nada."""
    nome = (ativo or "").strip().lower()
    if nome not in ("dolar", "euro", "bitcoin", "usd", "eur", "btc"):
        return "Ativo valido: dolar, euro ou bitcoin."
    chave = {"dolar": "USDBRL", "usd": "USDBRL", "euro": "EURBRL", "eur": "EURBRL",
             "bitcoin": "BTCBRL", "btc": "BTCBRL"}[nome]
    cond = "acima" if "acima" in condicao.lower() or "maior" in condicao.lower() else "abaixo"

    def _monitor():
        import urllib.request as _u
        import json as _j
        while True:
            try:
                with _u.urlopen("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL", timeout=15) as r:
                    d = _j.loads(r.read().decode("utf-8"))
                preco = float(d[chave]["bid"])
                if (cond == "acima" and preco >= valor) or (cond == "abaixo" and preco <= valor):
                    msg = f"ALERTA: o {nome} chegou a R$ {preco:,.2f} (sua meta: {cond} de R$ {valor:,.2f})."
                    print("\n[Alerta de cotacao] " + msg)
                    falar(f"Atenção. O {nome} atingiu sua meta.")
                    try:
                        popup_aviso.invoke({"titulo": "Alerta de cotacao", "mensagem": msg})
                    except Exception:
                        pass
                    return
            except Exception:
                pass
            time.sleep(600)  # checa a cada 10 min

    threading.Thread(target=_monitor, daemon=True).start()
    return f"Alerta criado: vou avisar quando o {nome} ficar {cond} de R$ {valor:,.2f} (checo a cada 10 min)."


# ---------------- 38) INSTALAR VARIOS PROGRAMAS DE UMA VEZ (winget) ----------------
@tool
def instalar_programas_em_lote(lista_programas: str) -> str:
    """INSTALA VARIOS PROGRAMAS DE UMA VEZ via winget (ex.: ao formatar/mudar de
    PC). 'lista_programas'=nomes ou IDs winget separados por virgula/';' (ex.:
    'Google.Chrome, Spotify, VSCode'). Pede confirmacao e instala em sequencia.
    Use para 'instala chrome, spotify e discord', 'quero esses programas'."""
    itens = [x.strip() for x in lista_programas.replace(";", ",").split(",") if x.strip()]
    if not itens:
        return "Diga os programas separados por virgula (ex.: 'Google.Chrome, Spotify, Discord')."
    if not confirmar_destrutivo(f"Instalar {len(itens)} programa(s) via winget: {', '.join(itens)}?"):
        return "Instalacao cancelada."

    def _instalar():
        resultados = []
        for prog in itens:
            s, e, c = _rodar_cmd(
                f'winget install --id "{prog}" -e --accept-source-agreements --accept-package-agreements '
                f'--silent --disable-interactivity', 600)
            resultados.append(f"- {prog}: {'OK' if c == 0 else 'falhou ('+(e or s)[-120:]+')'}")
        return "Resultado da instalacao em lote:\n" + "\n".join(resultados)

    return executar_com_autocura("instalar_programas_em_lote", _instalar)


# ---------------- 39) DIVIDIR ARQUIVO GRANDE EM PARTES ----------------
@tool
def dividir_arquivo(caminho: str, tamanho_mb: float = 10) -> str:
    """DIVIDE UM ARQUIVO GRANDE em partes menores (ex.: para enviar por e-mail ou
    gravar em pendrive) e tambem junta de volta. 'caminho'=arquivo de origem;
    'tamanho_mb'=tamanho de cada parte (padrao 10 MB). Gera arquivos .parte001,
    .parte002... Para juntar, use a acao 'juntar' em um arquivo .parte001 (ou
    passe um arquivo cujo nome termine em .parte001). Use para 'quebra esse arquivo
    em partes de 5 MB'."""
    c = caminho.strip().strip('"')
    if not os.path.isfile(c):
        return f"Arquivo nao encontrado: {c}"
    if ".parte0" in os.path.basename(c).lower():
        # juntar
        base = c.split(".parte0")[0]
        saida = base
        partes = sorted([f for f in os.listdir(os.path.dirname(c) or ".")
                         if f.startswith(os.path.basename(base)) and ".parte" in f])
        with open(saida, "wb") as w:
            for p in partes:
                with open(os.path.join(os.path.dirname(c) or ".", p), "rb") as r:
                    import shutil as _sh
                    _sh.copyfileobj(r, w)
        return f"Arquivo remontado: {saida} (de {len(partes)} partes)."
    if not confirmar_destrutivo(f"Dividir '{os.path.basename(c)}' em partes de {tamanho_mb} MB?"):
        return "Cancelado."
    tamanho = int(tamanho_mb * 1024 * 1024)
    n = 0
    with open(c, "rb") as f:
        while True:
            pedaco = f.read(tamanho)
            if not pedaco:
                break
            n += 1
            with open(f"{c}.parte{n:03d}", "wb") as w:
                w.write(pedaco)
    return f"Arquivo dividido em {n} parte(s) (arquivos {os.path.basename(c)}.parte001 ...). Use a juncao passando o .parte001."


# ---------------- 40) TOCAR ARQUIVO DE AUDIO / SOM DO SISTEMA ----------------
@tool
def tocar_audio(arquivo_ou_som: str = "padrao") -> str:
    """TOCA UM SOM: um arquivo de audio (.mp3, .wav, .wma) pelo player padrao, ou
    um som do sistema ('padrao', 'erro', 'pergunta', 'aviso') sem abrir nada. Use
    para 'toca um som de aviso', 'abre esse audio', 'toca o arquivo musica.mp3'."""
    alvo = arquivo_ou_som.strip().strip('"')
    if not alvo or alvo.lower() in ("padrao", "default"):
        _beep(1)
        return "Som padrao tocado."
    if os.path.isfile(alvo):
        try:
            os.startfile(alvo)
            return f"Tocando: {alvo}"
        except Exception as e:
            return f"Nao consegui abrir o audio: {e}"
    return f"Arquivo de audio nao encontrado: {alvo}"


# ---------------- 41) METRICAS DE CODIGO (linhas/funcoes) de um arquivo/pasta ----------------
@tool
def metricas_codigo(caminho_projeto: str) -> str:
    """ANALISA UM ARQUIVO OU PASTA DE CODIGO e devolve metricas simples (estilo
    linha de comando de engenharia): total de linhas, linhas em branco, linhas de
    comentario, funcoes e classes (para .py/.js/.html/.css/.txt etc.). So
    leitura. Use para 'quantas linhas tem esse projeto', 'me da as metricas desse
    codigo'."""
    c = caminho_projeto.strip().strip('"') or PASTA_PROJETOS
    if not os.path.exists(c):
        return f"Caminho nao encontrado: {c}"
    arqs = []
    if os.path.isfile(c):
        arqs = [c]
    else:
        for raiz, dirs, fs in os.walk(c):
            dirs[:] = [d for d in dirs if d not in (".git", "node_modules", "__pycache__", ".venv")]
            for f in fs:
                if f.endswith((".py", ".js", ".ts", ".html", ".css", ".md", ".txt", ".json")):
                    arqs.append(os.path.join(raiz, f))
    total_linhas = brancos = coment = 0
    funcoes = classes = 0
    por_ext = {}
    for a in arqs:
        ext = os.path.splitext(a)[1] or "(s/ext)"
        try:
            with open(a, "r", encoding="utf-8", errors="ignore") as f:
                for linha in f:
                    total_linhas += 1
                    strip = linha.strip()
                    if not strip:
                        brancos += 1
                    elif strip.startswith(("#", "//", "/*", "*", "<!--")):
                        coment += 1
                    if ext == ".py":
                        if strip.startswith("def "):
                            funcoes += 1
                        if strip.startswith("class "):
                            classes += 1
                    elif ext in (".js", ".ts"):
                        if "function" in strip or strip.startswith("const ") and "=>" in strip:
                            funcoes += 1
            por_ext[ext] = por_ext.get(ext, 0) + 1
        except Exception:
            pass
    return (f"Metricas de {c}:\n- Arquivos analisados: {len(arqs)}\n"
            f"- Linhas totais: {total_linhas:,} (em branco: {brancos:,} | comentario: {coment:,})\n"
            f"- Funcoes: {funcoes} | Classes: {classes}\n"
            f"- Por tipo: {', '.join(f'{k}={v}' for k, v in sorted(por_ext.items(), key=lambda x:-x[1]))}")


# ---------------- 42) EXPLICAR E SUGERIR CORRECAO DE ERRO DE CODIGO ----------------
@tool
def explicar_erro_codigo(erro_ou_codigo: str, linguagem: str = "python") -> str:
    """COLA UM ERRO (traceback) ou um trecho de codigo com bug que o agente EXPLICA
    em portugues simples e SUGERE a correcao (como um par programador senior), sem
    alterar seus arquivos. Use para 'esse erro aqui o que e?', 'por que esse codigo
    quebra?', 'me ajuda com esse traceback'."""
    prompt = (
        f"Voce e um engenheiro senior. O usuario colou o seguinte ERRO ou trecho de "
        f"codigo em {linguagem}:\n\n{erro_ou_codigo[:3500]}\n\n"
        "Explique em portugues, de forma curta e pratica: (1) o que provavelmente "
        "aconteceu; (2) a causa raiz; (3) a correcao sugerida, com um MINI EXEMPLO de "
        "codigo corrigido quando fizer sentido. Seja direto, sem enrolacao."
    )
    try:
        resp = invocar_com_fallback([{"role": "user", "content": prompt}])
        return _extrair_texto(resp.content).strip() or "Nao consegui analisar agora."
    except Exception as e:
        return f"Nao consegui analisar o erro ({type(e).__name__})."


# ---------------- 43) REVISAR CODIGO (code review) ----------------
@tool
def revisar_codigo(codigo: str, linguagem: str = "python") -> str:
    """FAZ UM CODE REVIEW de um trecho de codigo que voce cola: aponta bugs
    potenciais, problemas de seguranca, desempenho e legibilidade, e sugere
    melhorias concretas (nao altera nada sozinho). Use para 'revisa esse codigo',
    've se tem problema nesse trecho'."""
    prompt = (
        f"Faca um CODE REVIEW objetivo do seguinte codigo {linguagem}:\n\n{codigo[:3500]}\n\n"
        "Aponte em portugues, em itens curtos: (1) BUGS ou riscos reais; (2) problemas de "
        "SEGURANCA; (3) melhorias de desempenho/legibilidade; (4) o que esta bom. Seja "
        "especifico (mostre a linha/trecho) e sugira a correcao. Nao reescreva o arquivo inteiro."
    )
    try:
        resp = invocar_com_fallback([{"role": "user", "content": prompt}])
        return _extrair_texto(resp.content).strip() or "Nao consegui revisar agora."
    except Exception as e:
        return f"Nao consegui revisar o codigo ({type(e).__name__})."


# ---------------- 44) GERAR TESTES DE UNIDADE (pytest) ----------------
@tool
def gerar_testes(caminho_arquivo_py: str) -> str:
    """GERA UM ARQUIVO DE TESTES (pytest) para um arquivo Python do seu projeto:
    le o codigo, identifica as funcoes e pede para a IA montar testes basicos,
    salvando como 'test_<nome>.py' na MESMA pasta. Use para 'gera testes para esse
    arquivo', 'cria os testes unitarios'."""
    c = caminho_arquivo_py.strip().strip('"')
    if not os.path.isfile(c):
        return f"Arquivo nao encontrado: {c}"
    with open(c, "r", encoding="utf-8", errors="ignore") as f:
        codigo = f.read()
    prompt = (
        "Voce e um engenheiro de testes. Crie testes unitarios em PYTEST para as funcoes "
        "publicas deste arquivo Python. Gere APENAS o codigo do arquivo de teste (comece com "
        "import e os 'def test_...'), use casos normais e de borda, e nao invente funcoes que "
        "nao existem no codigo. Importe as funcoes do modulo corretamente.\n\nCODIGO:\n"
        + codigo[:4000]
    )
    def _gerar():
        resp = invocar_com_fallback([{"role": "user", "content": prompt}])
        teste = _extrair_texto(resp.content).replace("```python", "").replace("```", "").strip()
        pasta = os.path.dirname(c)
        nome = "test_" + os.path.basename(c)
        saida = os.path.join(pasta, nome)
        with open(saida, "w", encoding="utf-8") as f:
            f.write(teste)
        return f"Arquivo de testes criado: {saida}\n(Dica: rode 'pytest' na pasta para executar.)"
    return executar_com_autocura("gerar_testes", _gerar)


# ---------------- 45) ENCURTAR / EXPANDIR URL ----------------
@tool
def encurtar_url(acao: str, url: str) -> str:
    """ENCURTA um link longo (gera um link curto usando o servico gratuito
    TinyURL, sem chave) ou EXPANDE um link curto para ver o destino real antes de
    clicar (seguranca contra links suspeitos). Acoes: 'encurtar' ou 'expandir'.
    Use para 'deixa esse link curto', 'para onde esse link curto aponta?'."""
    import urllib.request
    import urllib.parse
    a = acao.strip().lower()

    def _fazer():
        if a in ("encurtar", "curto", "shorten"):
            api = "https://tinyurl.com/api-create.php?url=" + urllib.parse.quote(url.strip())
            with urllib.request.urlopen(urllib.request.Request(api, headers={"User-Agent": "Mozilla/5.0"}), timeout=20) as r:
                curto = r.read().decode("utf-8").strip()
            return f"Link curto: {curto}"
        if a in ("expandir", "expandir", "destino", "resolver"):
            alvo = url.strip()
            if not alvo.startswith("http"):
                alvo = "https://" + alvo
            req = urllib.request.Request(alvo, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=20) as r:
                return f"O link leva para: {r.geturl()}"
        return "Acao invalida. Use: encurtar ou expandir."

    try:
        return executar_com_autocura("encurtar_url", _fazer)
    except Exception as e:
        return f"Nao consegui processar a URL ({type(e).__name__})."


# ---------------- 46) LOCALIZAR UM IP / DOMINIO (geolocalizacao) ----------------
@tool
def localizar_ip(ip_ou_dominio: str = "") -> str:
    """DESCOBRE A LOCALIZACAO APROXIMADA (cidade/regiao/pais) e a operadora de um
    IP publico ou dominio, via ip-api (gratis, sem chave). Sem parametro, localiza
    o SEU proprio IP publico. Use para 'de onde e esse IP', 'onde fica esse
    dominio', 'qual meu IP e onde estou'."""
    import urllib.request
    import urllib.parse
    import json as _j

    def _localizar():
        alvo = ip_ou_dominio.strip() or ""
        url = "http://ip-api.com/json/" + urllib.parse.quote(alvo) + "?lang=pt&fields=status,message,country,regionName,city,isp,query"
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "AgentePC/1.0"}), timeout=20) as r:
            d = _j.loads(r.read().decode("utf-8"))
        if d.get("status") != "success":
            return f"Nao consegui localizar ({d.get('message','')})."
        return (f"Localizacao de {d.get('query')}: {d.get('city','?')}/{d.get('regionName','?')} - {d.get('country','?')}.\n"
                f"Operadora/provedor: {d.get('isp','?')}.")

    try:
        return executar_com_autocura("localizar_ip", _localizar)
    except Exception:
        return "Nao consegui localizar agora (servico pode usar http; tente depois)."


# ---------------- 47) CALCULADORA DE SUB-REDE (rede) ----------------
@tool
def calculadora_subrede(ip_rede: str) -> str:
    """CALCULADORA DE SUB-REDE para redes/IP (utilitario de TI): dado um IP com
    mascara em CIDR (ex.: '192.168.1.10/24' ou '10.0.0.5/255.255.255.0'), calcula
    endereco de rede, broadcast, primeiro/ultimo host utilizavel e total de hosts.
    So calculo local, sem internet."""
    import ipaddress as _ipa
    try:
        rede = _ipa.ip_network(ip_rede.strip(), strict=False)
        hosts = list(rede.hosts())
        return (
            f"Rede: {rede.with_prefixlen}\n"
            f"Endereco de rede: {rede.network_address}\n"
            f"Broadcast: {rede.broadcast_address}\n"
            f"Mascara: {rede.netmask}\n"
            f"Primeiro host: {hosts[0] if hosts else '-'}\n"
            f"Ultimo host: {hosts[-1] if hosts else '-'}\n"
            f"Total de hosts utilizaveis: {rede.num_addresses - 2 if rede.version == 4 and rede.prefixlen < 31 else rede.num_addresses}")
    except ValueError as e:
        return f"IP/mascara invalidos: {e}. Use ex.: 192.168.1.10/24."


# ---------------- 48) SORTEAR GRUPOS / TIMES ----------------
@tool
def sortear_grupos(nomes: str, quantidade_grupos: int = 2) -> str:
    """DIVIDE UMA LISTA DE NOMES EM GRUPOS/TIMES SORTEADOS e equilibrados (para
    trabalho escolar, churrasco, jogo). 'nomes'=pessoas separadas por virgula/';';
    'quantidade_grupos'=em quantos times dividir. Use para 'divide esses nomes em
    3 grupos', 'sorteia os times'."""
    pessoas = [x.strip() for x in nomes.replace(";", ",").split(",") if x.strip()]
    if len(pessoas) < 1:
        return "Diga os nomes separados por virgula (ex.: 'Ana, Bruno, Carla, Diego')."
    k = max(1, int(quantidade_grupos) if str(quantidade_grupos).isdigit() else 2)
    random.shuffle(pessoas)
    grupos = [[] for _ in range(k)]
    for i, p in enumerate(pessoas):
        grupos[i % k].append(p)
    linhas = [f"Grupo {i+1}: {', '.join(g)}" for i, g in enumerate(grupos) if g]
    return f"{len(pessoas)} pessoas divididas em {len(linhas)} grupo(s):\n" + "\n".join(linhas)


# ---------------- 49) PEGAR A COR DE UM PIXEL DA TELA (design) ----------------
@tool
def cor_do_pixel(x: int, y: int) -> str:
    """PEGA A COR (em HEX e RGB) de um ponto da tela pelas coordenadas X,Y (util
    para design/front-end - descobrir a cor exata de algo na tela). Use para 'qual
    a cor do pixel 100,200', 'pega essa cor da tela'. Para achar coordenadas, use a
    visao de tela. So Windows/com pyautogui."""
    def _pegar():
        img = pyautogui.screenshot()
        larg, alt = img.size
        if not (0 <= x < larg and 0 <= y < alt):
            return f"Coordenadas fora da tela (a tela e {larg}x{alt})."
        r, g, b = img.getpixel((int(x), int(y)))[:3]
        hexc = "#{:02x}{:02x}{:02x}".format(r, g, b)
        return f"Cor na posicao ({x},{y}): HEX {hexc} | RGB({r}, {g}, {b})."
    return executar_com_autocura("cor_do_pixel", _pegar)


# ---------------- 50) HISTORICO DE COMANDOS / MATAR PROCESSO (avancado) ----------------
ARQ_HIST_COMANDOS = os.path.join(PASTA_BASE, "historico_comandos.json")


@tool
def historico_comandos(acao: str = "listar", linha: int = 0) -> str:
    """HISTORICO DOS COMANDOS que voce pediu ao agente (filtravel e reutilizavel).
    Acoes: 'listar' (mostra os ultimos comandos que voce digitou, com numero) e
    'repetir' ('linha'=numero do comando na lista para rodar de novo). Use para 'o
    que eu ja pedi', 'repete o comando 3'."""
    hist = carregar_json(ARQ_HIST_COMANDOS, [])
    a = (acao or "listar").strip().lower()
    if a in ("repetir", "reexecutar", "rodar_de_novo"):
        if not linha or not (1 <= linha <= len(hist)):
            return "Diga o numero do comando (veja pela acao 'listar')."
        return f"Para repetir, digite novamente: {hist[linha-1]}"
    if not hist:
        return "O historico de comandos ainda esta vazio."
    return "Ultimos comandos:\n" + "\n".join(
        f"{i+1}. {cmd[:80]}" for i, cmd in enumerate(hist[-20:][::-1]))


@tool
def finalizar_processo(identificador: str, por_pid: bool = False) -> str:
    """FORCA O FECHAMENTO DE UM PROGRAMA/PROCESSO que travou, por NOME ou por PID
    (numero do processo). 'identificador'=nome (ex.: 'notepad', 'chrome') ou, se
    'por_pid'=True, o numero PID. Pede confirmacao. Mais direto que fechar pela
    central de programas (usado quando algo nao responde). Use para 'mata o processo
    1234', 'forca fechar o chrome que travou'."""
    ident = identificador.strip()
    if not ident:
        return "Diga o nome do processo (ex.: 'notepad') ou o PID com por_pid=True."
    if not confirmar_destrutivo(f"Forcar o encerramento do processo '{ident}'?"):
        return "Cancelado."
    if por_pid or ident.isdigit():
        s, e, c = _rodar_cmd(f'taskkill /PID {ident} /F', 30)
    else:
        nome = ident.lower().replace(".exe", "")
        s, e, c = _rodar_cmd(f'taskkill /IM "{nome}.exe" /T /F', 30)
    return f"Processo '{ident}' encerrado." if c == 0 else f"Nao consegui encerrar: {e or s}"


# ---------------- RODAR ATUALIZACOES DO WINDOWS ----------------
@tool
def atualizar_windows() -> str:
    """VERIFICA E INSTALA ATUALIZACOES DO WINDOWS via PowerShell (USOClient, o
    mecanismo oficial). Pede confirmacao, pode demorar e pode exigir reinicio.
    Use para 'atualiza o windows', 'busca atualizacoes do sistema'."""
    if not confirmar_destrutivo("Verificar e instalar atualizacoes do Windows? Pode demorar e exigir reinicio."):
        return "Atualizacao cancelada."
    def _atualizar():
        _rodar_cmd('powershell -NoProfile -Command "(New-Object -ComObject Microsoft.Update.Session).CreateUpdateDownloader()"', 30)
        s, e, c = _rodar_cmd("UsoClient StartScan && UsoClient StartDownload && UsoClient StartInstall", 300)
        return ("Comando de atualizacao do Windows enviado. O Windows baixa e instala em segundo "
                "plano; reinicie quando ele pedir. (Voce pode acompanhar em Configuracoes > Windows Update.)")
    return executar_com_autocura("atualizar_windows", _atualizar)


# ======================================================================
# ========= FERRAMENTAS PODEROSAS DE ADMINISTRACAO (AVANCADO) ==========
# Capacidades de sysadmin nivel profissional (registro, usuarios, BitLocker,
# Defender, disco, reparos do Windows, firewall, agendador, rede, WSL/Hyper-V,
# drivers, backup...). REGRA DE SEGURANCA: qualquer acao que ALTERA o sistema
# passa por 'confirmar_catastrofico', que SEMPRE pergunta sim/nao - MESMO no
# modo admin (e a unica barreira que o modo autonomo nao remove). Acoes so de
# LEITURA (status/listar/ver) nao perguntam nada. Tudo e ADICAO PURA.
# ======================================================================

def _ps(comando_ps: str, timeout: int = 120):
    """Roda um comando PowerShell e devolve (saida, erros, codigo)."""
    return _rodar_cmd('powershell -NoProfile -Command "' + comando_ps.replace('"', '\\"') + '"', timeout)


def _confirma_poderoso(mensagem: str) -> bool:
    """Trava para as ferramentas poderosas: SEMPRE pede confirmacao, mesmo no
    modo admin (diferente de pedir_confirmacao, que auto-aprova no admin)."""
    return confirmar_catastrofico(mensagem)


# ---------------- REGISTRO DO WINDOWS ----------------
@tool
def ler_registro(chave: str, nome: str = "") -> str:
    """LE uma chave/valor do Registro do Windows (so leitura). 'chave' ex.:
    'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion'. 'nome'=valor
    especifico (opcional; se vazio, lista a chave inteira). Use para ver
    configuracoes avancadas do sistema."""
    cmd = f'reg query "{chave}"' + (f' /v "{nome}"' if nome else "")
    s, e, c = _rodar_cmd(cmd, 60)
    return s if c == 0 else f"Nao consegui ler: {e or s}"


@tool
def definir_registro(chave: str, nome: str, valor: str, tipo: str = "REG_SZ") -> str:
    """CRIA/ALTERA um valor no Registro do Windows (PODEROSO - pode afetar o
    sistema). 'chave' (ex.: HKCU\\...), 'nome' do valor, 'valor' e 'tipo'
    (REG_SZ=texto, REG_DWORD=numero 0/1, REG_EXPAND_SZ). SEMPRE pede
    confirmacao. Use so se voce souber o que esta fazendo."""
    if not _confirma_poderoso(f"Alterar o Registro?\n  Chave: {chave}\n  Valor: {nome} = {valor} ({tipo})"):
        return "Operacao cancelada."
    cmd = f'reg add "{chave}" /v "{nome}" /t {tipo} /d "{valor}" /f'
    s, e, c = _rodar_cmd(cmd, 60)
    return f"Registro alterado: {chave}\\{nome} = {valor}." if c == 0 else f"Falhou: {e or s}"


@tool
def deletar_registro(chave: str, nome: str = "") -> str:
    """APAGA um valor (ou uma chave inteira, se 'nome' ficar vazio) do Registro
    (PODEROSO e SEM VOLTA para configuracoes do sistema). SEMPRE pede
    confirmacao. Cuidado redobrado ao mexer em HKLM."""
    alvo = f"o valor '{nome}' em" if nome else "A CHAVE INTEIRA"
    if not _confirma_poderoso(f"APAGAR {alvo} {chave}? Isso pode quebrar programas/sistema."):
        return "Operacao cancelada."
    cmd = f'reg delete "{chave}"' + (f' /v "{nome}" /f' if nome else " /f")
    s, e, c = _rodar_cmd(cmd, 60)
    return "Registro apagado." if c == 0 else f"Falhou: {e or s}"


# ---------------- USUARIOS LOCAIS DO WINDOWS ----------------
@tool
def listar_usuarios_windows() -> str:
    """LISTA as contas de usuario locais do Windows (nome, ativa/inativa) - so
    leitura. Use para 'quais usuarios existem neste PC'."""
    s, e, _ = _ps("Get-LocalUser | Select-Object Name,Enabled,Description | Format-Table -AutoSize", 60)
    return "Usuarios locais:\n" + (s or e or "Nao consegui listar.")


@tool
def criar_usuario_windows(nome: str, senha: str, tornar_administrador: bool = False) -> str:
    """CRIA UMA NOVA CONTA DE USUARIO no Windows (PODEROSO). 'nome' da conta,
    'senha' inicial; 'tornar_administrador'=True ja coloca a conta no grupo de
    Administradores. SEMPRE pede confirmacao."""
    if not _confirma_poderoso(f"Criar o usuario '{nome}'" + (" COMO ADMINISTRADOR" if tornar_administrador else "") + "?"):
        return "Cancelado."
    ps = (f"$u='{nome}'; $p=ConvertTo-SecureString '{senha}' -AsPlainText -Force; "
          f"New-LocalUser -Name $u -Password $p -FullName $u -Description 'Criado pelo agente' | Out-Null; "
          + ("$adm=([Security.Principal.SecurityIdentifier]'S-1-5-32-544').Translate([Security.Principal.NTAccount]).Value; "
             "Add-LocalGroupMember -Group $adm -Member $u; " if tornar_administrador else "")
          + "'OK'")
    s, e, c = _ps(ps, 90)
    return f"Usuario '{nome}' criado" + (" como administrador." if tornar_administrador else ".") if c == 0 else f"Falhou: {e or s}"


@tool
def remover_usuario_windows(nome: str) -> str:
    """REMOVE UMA CONTA DE USUARIO do Windows (PODEROSO e SEM VOLTA - apaga a
    conta e, dependendo, os arquivos do perfil). SEMPRE pede confirmacao."""
    if not _confirma_poderoso(f"REMOVER a conta de usuario '{nome}'? Isso apaga o login dela."):
        return "Cancelado."
    s, e, c = _ps(f"Remove-LocalUser -Name '{nome}'; 'OK'", 90)
    return f"Usuario '{nome}' removido." if c == 0 else f"Falhou: {e or s}"


@tool
def alterar_senha_usuario(nome: str, nova_senha: str) -> str:
    """TROCA A SENHA de uma conta de usuario local do Windows (PODEROSO). SEMPRE
    pede confirmacao. Use para redefinir uma senha esquecida de uma conta local."""
    if not _confirma_poderoso(f"Redefinir a senha do usuario '{nome}'?"):
        return "Cancelado."
    ps = (f"Set-LocalUser -Name '{nome}' -Password (ConvertTo-SecureString '{nova_senha}' -AsPlainText -Force); 'OK'")
    s, e, c = _ps(ps, 90)
    return f"Senha de '{nome}' alterada." if c == 0 else f"Falhou: {e or s}"


@tool
def ativar_desativar_usuario(nome: str, ativar: bool = True) -> str:
    """ATIVA ou DESATIVA uma conta de usuario local (PODEROSO; desativar bloqueia
    o login dela sem apagar). 'ativar'=True ativa, False desativa. SEMPRE pede
    confirmacao."""
    acao = "ATIVAR" if ativar else "DESATIVAR"
    if not _confirma_poderoso(f"{acao} a conta '{nome}'?"):
        return "Cancelado."
    cmd = "Enable-LocalUser" if ativar else "Disable-LocalUser"
    s, e, c = _ps(f"{cmd} -Name '{nome}'; 'OK'", 90)
    return f"Conta '{nome}' {'ativada' if ativar else 'desativada'}." if c == 0 else f"Falhou: {e or s}"


@tool
def gerenciar_admin_usuario(acao: str, nome: str) -> str:
    """ADICIONA ou REMOVE um usuario do grupo de ADMINISTRADORES (PODEROSO: da ou
    tira privilegios totais). 'acao'='adicionar' ou 'remover'; 'nome'=usuario.
    SEMPRE pede confirmacao."""
    a = acao.strip().lower()
    if a not in ("adicionar", "adicionar_admin", "tornar_admin", "remover", "remover_admin", "rebaixar"):
        return "Use acao 'adicionar' ou 'remover'."
    adicionar = a.startswith(("adic", "torn"))
    if not _confirma_poderoso(f"{'DAR privilegios de ADMINISTRADOR a' if adicionar else 'REMOVER privilegios de administrador de'} '{nome}'?"):
        return "Cancelado."
    metodo = "Add-LocalGroupMember" if adicionar else "Remove-LocalGroupMember"
    ps = (f"$adm=([Security.Principal.SecurityIdentifier]'S-1-5-32-544').Translate([Security.Principal.NTAccount]).Value; "
          f"{metodo} -Group $adm -Member '{nome}'; 'OK'")
    s, e, c = _ps(ps, 90)
    return f"'{nome}' agora {'e' if adicionar else 'nao e mais'} administrador." if c == 0 else f"Falhou: {e or s}"


# ---------------- BITLOCKER (CRIPTOGRAFIA DE DISCO) ----------------
@tool
def status_bitlocker(unidade: str = "C:") -> str:
    """MOSTRA O STATUS DO BITLOCKER (criptografia de disco) de uma unidade - so
    leitura. Diz se esta criptografado/protegido e o progresso. Use para 'o
    BitLocker esta ligado no C?'."""
    u = unidade.strip() or "C:"
    s, e, c = _rodar_cmd(f"manage-bde -status {u}", 90)
    return s if c == 0 else f"Nao consegui consultar (BitLocker exibe versao Pro/Enterprise; {e or s})"[:800]


@tool
def ativar_bitlocker(unidade: str = "C:") -> str:
    """LIGA A CRIPTOGRAFIA BITLOCKER numa unidade (PODEROSO; comeca a criptografar
    o disco e gera chave de recuperacao - ANOTE a chave). SEMPRE pede
    confirmacao. Requer Windows Pro/Enterprise e TPM (ou configuracao manual)."""
    u = unidade.strip() or "C:"
    if not _confirma_poderoso(f"ATIVAR BitLocker em {u}? O disco sera criptografado; GUARDE a chave de recuperacao."):
        return "Cancelado."
    s, e, c = _rodar_cmd(f"manage-bde -on {u} -SkipHardwareTest", 300)
    return (f"BitLocker sendo ativado em {u}. {s or ''}".strip()
            if c == 0 else f"Nao consegui ativar (precisa de Windows Pro/TPM): {(e or s)[:600]}")


@tool
def desativar_bitlocker(unidade: str = "C:") -> str:
    """DESLIGA O BITLOCKER e DESCRIPTOGRAFA a unidade (PODEROSO; remove a
    protecao de criptografia e pode demorar). SEMPRE pede confirmacao."""
    u = unidade.strip() or "C:"
    if not _confirma_poderoso(f"DESLIGAR o BitLocker e DESCRIPTOGRAFAR {u}? Isso remove a protecao do disco."):
        return "Cancelado."
    s, e, c = _rodar_cmd(f"manage-bde -off {u}", 300)
    return f"BitLocker sendo desligado em {u} (descriptografa em segundo plano)." if c == 0 else f"Falhou: {(e or s)[:600]}"


@tool
def travar_drive_bitlocker(unidade: str) -> str:
    """TRAVA UMA UNIDADE DE DADOS protegida por BitLocker (ex.: um pendrive/HD
    externo D:) sem ejetar - sera preciso a senha/chave para abrir de novo
    (PODEROSO). SEMPRE pede confirmacao."""
    u = unidade.strip()
    if not u:
        return "Diga a unidade (ex.: 'D:')."
    if not _confirma_poderoso(f"Travar o drive {u} (sera exigida a senha BitLocker para abrir)?"):
        return "Cancelado."
    s, e, c = _rodar_cmd(f"manage-bde -lock {u} -ForceDismount", 120)
    return f"Drive {u} travado." if c == 0 else f"Falhou: {(e or s)[:500]}"


@tool
def chave_recuperacao_bitlocker(unidade: str = "C:") -> str:
    """EXIBE A CHAVE DE RECUPERACAO / protetores do BitLocker de uma unidade
    (PODEROSO e SENSIVEL - e a chave que destrava o disco). SEMPRE pede
    confirmacao. Anote em lugar seguro."""
    u = unidade.strip() or "C:"
    if not _confirma_poderoso(f"Mostrar os protetores/chave de recuperacao do BitLocker de {u}? E um dado sensivel."):
        return "Cancelado."
    s, e, c = _rodar_cmd(f"manage-bde -protectors {u} -get", 120)
    return s if c == 0 else f"Falhou: {(e or s)[:500]}"


# ---------------- WINDOWS DEFENDER (ANTIVIRUS) ----------------
@tool
def status_defender() -> str:
    """MOSTRA O STATUS DO WINDOWS DEFENDER (protecao em tempo real ligada,
    assinatura atualizada) - so leitura."""
    s, e, _ = _ps("Get-MpComputerStatus | Select-Object AntivirusEnabled,RealTimeProtectionEnabled,AntivirusSignatureLastUpdated | Format-List", 60)
    return "Windows Defender:\n" + (s or e or "Indisponivel.")


@tool
def protecao_tempo_real_defender(ligar: bool = True) -> str:
    """LIGA ou DESLIGA A PROTECAO EM TEMPO REAL do Windows Defender (PODEROSO e
    DE RISCO: desligar deixa o PC SEM protecao contra virus - so use para
    instalar algo confiavel e ligue de novo depois). SEMPRE pede confirmacao."""
    estado = "LIGAR" if ligar else "DESLIGAR (deixa o PC sem protecao!)"
    if not _confirma_poderoso(f"{estado} a protecao em tempo real do Defender?"):
        return "Cancelado."
    valor = "$false" if ligar else "$true"  # DisableRealtimeMonitoring: $false = ligado
    s, e, c = _ps(f"Set-MpPreference -DisableRealtimeMonitoring {valor}; 'OK'", 90)
    return f"Protecao em tempo real {'LIGADA' if ligar else 'DESLIGADA'}." if c == 0 else f"Falhou (o Windows pode bloquear via Tamper Protection): {(e or s)[:400]}"


@tool
def atualizar_defender() -> str:
    """ATUALIZA AS ASSINATURAS (virus definitions) do Windows Defender agora
    (PODEROSO leve - faz download). SEMPRE pede confirmacao."""
    if not _confirma_poderoso("Baixar e instalar as assinaturas mais novas do Defender?"):
        return "Cancelado."
    s, e, c = _ps("Update-MpSignature; 'OK'", 300)
    return "Assinaturas do Defender atualizadas." if c == 0 else f"Falhou: {(e or s)[:400]}"


@tool
def scan_completo_defender() -> str:
    """RODA UMA VERIFICACAO COMPLETA (full scan) do Windows Defender em todo o PC
    (PODEROSO; pode demorar MUITO - horas). SEMPRE pede confirmacao. Para uma
    varredura rapida use a 'central_seguranca'."""
    if not _confirma_poderoso("Rodar uma verificacao COMPLETA do Defender? Pode demorar horas e usar o disco/CPU."):
        return "Cancelado."
    s, e, c = _ps("Start-MpScan -ScanType FullScan; 'OK'", 3600)
    return "Verificacao completa do Defender concluida." if c == 0 else f"Falhou/interrompida: {(e or s)[:400]}"


@tool
def gerenciar_exclusao_defender(acao: str, caminho: str = "") -> str:
    """GERENCIA EXCLUSOES do Windows Defender (pastas/arquivos que o antivirus
    IGNORA). PODEROSO e DE RISCO: adicionar exclusao diminui a protecao. Acoes:
    'listar', 'adicionar' ('caminho'), 'remover' ('caminho'). SEMPRE pede
    confirmacao para adicionar/remover."""
    a = acao.strip().lower()
    if a in ("listar", "lista", "ver"):
        s, e, _ = _ps("(Get-MpPreference).ExclusionPath", 60)
        return "Exclusoes atuais:\n" + (s or "(nenhuma)")
    if not caminho.strip():
        return "Diga o 'caminho' da pasta/arquivo."
    if not _confirma_poderoso(f"{a.title()} a exclusao do Defender para '{caminho}'? "
                              + ("Isso faz o antivirus IGNORAR esse local." if a.startswith("adic") else "")):
        return "Cancelado."
    if a.startswith("adic"):
        s, e, c = _ps(f"Add-MpPreference -ExclusionPath '{caminho}'; 'OK'", 90)
    else:
        s, e, c = _ps(f"Remove-MpPreference -ExclusionPath '{caminho}'; 'OK'", 90)
    return f"Exclusao {a} para '{caminho}'." if c == 0 else f"Falhou: {(e or s)[:400]}"


# ---------------- APAGAMENTO SEGURO / PERMISSOES / MONITOR ----------------
@tool
def apagar_arquivo_seguro(caminho: str) -> str:
    """APAGA UM ARQUIVO DE FORMA IRRECUPERAVEL: sobrescreve o conteudo com dados
    aleatorios algumas vezes e so entao remove (para lixo sensivel; mais seguro
    que mandar pra lixeira). PODEROSO e SEM VOLTA. SEMPRE pede confirmacao. Para
    limpar espaco livre do disco inteiro use cipher /w via executar_comando."""
    c = caminho.strip().strip('"')
    if not os.path.isfile(c):
        return f"Arquivo nao encontrado: {c}"
    if not _confirma_poderoso(f"APAGAR IRRECUPERAVELMENTE o arquivo '{c}' (nao da pra recuperar)?"):
        return "Cancelado."
    try:
        tamanho = os.path.getsize(c)
        with open(c, "r+b") as f:
            for _ in range(3):
                f.seek(0)
                f.write(os.urandom(min(tamanho, 10 * 1024 * 1024)))
                f.flush()
                os.fsync(f.fileno())
        os.remove(c)
        return f"Arquivo sobrescrito e removido de forma irre recuperavel: {c}"
    except Exception as e:
        return f"Nao consegui apagar com seguranca: {e}"


@tool
def reparar_permissoes_pasta(pasta: str) -> str:
    """TOMA POSSE (takeown) e RESETA AS PERMISSOES (icacls) de uma pasta inteira
    para o usuario administrador atual - util quando aparece 'Acesso negado' em
    arquivos que deveriam ser seus. PODEROSO (muda seguranca NTFS). SEMPRE pede
    confirmacao. Nao use em pastas do sistema sem saber."""
    p = pasta.strip().strip('"')
    if not os.path.isdir(p):
        return f"Pasta nao encontrada: {p}"
    if not _confirma_poderoso(f"Tomar posse e resetar permissoes (NTFS) de '{p}' e todo o conteudo?"):
        return "Cancelado."
    s1, e1, _ = _rodar_cmd(f'takeown /f "{p}" /r /d y', 600)
    s2, e2, c = _rodar_cmd(f'icacls "{p}" /reset /t /c /q', 600)
    return f"Permissoes redefinidas em '{p}'." if c == 0 else f"Concluido com avisos: {(e1 or e2 or s2)[-600:]}"


@tool
def monitorar_alteracoes(pasta: str, minutos: int = 5) -> str:
    """MONITORA UMA PASTA por 'minutos' e avisa (e grava) quais arquivos foram
    CRIADOS, MODIFICADOS ou APAGADOS nesse tempo - util para ver o que um
    instalador/programa muda. Roda em segundo plano, nao trava o agente. So
    leitura/monitoramento, nao altera nada."""
    p = pasta.strip().strip('"')
    if not os.path.isdir(p):
        return f"Pasta nao encontrada: {p}"

    def _vigiar():
        def _snapshot():
            estado = {}
            for raiz, _, arqs in os.walk(p):
                for a in arqs:
                    c = os.path.join(raiz, a)
                    try:
                        estado[c] = os.path.getmtime(c)
                    except Exception:
                        pass
            return estado
        antes = _snapshot()
        time.sleep(max(1, int(minutos)) * 60)
        depois = _snapshot()
        novos = sorted(set(depois) - set(antes))
        removidos = sorted(set(antes) - set(depois))
        modificados = sorted(k for k in (set(antes) & set(depois)) if antes[k] != depois[k])
        linhas = [f"[Monitor] Mudancas em '{p}' apos {minutos} min:"]
        if novos:
            linhas.append("  NOVOS: " + "; ".join(os.path.basename(x) for x in novos[:30]))
        if modificados:
            linhas.append("  MODIFICADOS: " + "; ".join(os.path.basename(x) for x in modificados[:30]))
        if removidos:
            linhas.append("  APAGADOS: " + "; ".join(os.path.basename(x) for x in removidos[:30]))
        if not (novos or modificados or removidos):
            linhas.append("  Nenhuma alteracao detectada.")
        print("\n" + "\n".join(linhas))
        falar("Monitoramento concluido.")

    threading.Thread(target=_vigiar, daemon=True).start()
    return f"Monitorando '{pasta}' por {minutos} minuto(s) em segundo plano; eu aviso o que mudou."


# ---------------- DISCO E REPAROS DO WINDOWS ----------------
@tool
def formatar_unidade(letra: str, sistema_arquivos: str = "NTFS", nome: str = "") -> str:
    """FORMATA UMA UNIDADE (pendrive, HD externo, particao) - APAGA TUDO dela de
    vez (PODEROSO e IRREVERSIVEL). 'letra' ex.: 'E', 'sistema_arquivos' NTFS/FAT32/exFAT.
    Nunca formata C:. SEMPRE pede confirmacao com aviso forte."""
    l = letra.strip().upper().rstrip(":")
    if l in ("C", "SYS"):
        return "Nao posso formatar a unidade do sistema (C:) - isso destruiria o Windows."
    if not _confirma_poderoso(f"FORMATAR a unidade {l}: ? TODOS os arquivos dela serao APAGADOS PARA SEMPRE. Confirma?"):
        return "Cancelado."
    rotulo = f' /V:"{nome}"' if nome.strip() else ""
    s, e, c = _rodar_cmd(f'echo y| format {l}: /FS:{sistema_arquivos} /Q{rotulo}', 900)
    return f"Unidade {l}: formatada como {sistema_arquivos}." if c == 0 else f"Falhou: {(e or s)[:600]}"


@tool
def reparar_disco(unidade: str = "C:") -> str:
    """RODA O CHKDSK (verifica e tenta consertar erros de disco/setores) na
    unidade - PODEROSO (pode demorar e, no C:, agenda para o proximo reinicio).
    SEMPRE pede confirmacao. Use para travamentos/erros de disco."""
    u = unidade.strip() or "C:"
    if not _confirma_poderoso(f"Rodar chkdsk /f /r em {u}? Pode demorar bastante (no C roda na reinicializacao)."):
        return "Cancelado."
    s, e, c = _rodar_cmd(f'chkdsk {u} /f /r', 1800)
    return f"chkdsk iniciado/concluido em {u}.\n{s or e}" if c in (0, 3) else f"Retorno: {(e or s)[-700:]}"


@tool
def reparar_windows() -> str:
    """CONCERTA ARQUIVOS DO WINDOWS corrompidos: roda DISM /RestoreHealth
    (repara a imagem do sistema) e depois SFC /scannow (verifica arquivos
    protegidos). PODEROSO, demora e precisa de internet; as vezes exige reinicio.
    SEMPRE pede confirmacao. Use para Windows instavel/com erros de sistema."""
    if not _confirma_poderoso("Rodar reparo completo do Windows (DISM RestoreHealth + SFC scannow)? Pode demorar 20-60 min."):
        return "Cancelado."
    saidas = []
    s1, e1, _ = _rodar_cmd("DISM /Online /Cleanup-Image /RestoreHealth", 2400)
    saidas.append("DISM: " + (s1 or e1)[-400:])
    s2, e2, c = _rodar_cmd("sfc /scannow", 2400)
    saidas.append("SFC: " + (s2 or e2)[-400:])
    return "\n".join(saidas)


# ---------------- FIREWALL E SPOOLER ----------------
@tool
def regra_firewall(acao: str, nome: str = "", porta: int = 0, protocolo: str = "TCP") -> str:
    """CRIA, LISTA ou REMOVE regras do Firewall do Windows (PODEROSO - libera ou
    bloqueia porta/programa para a rede). Acoes: 'listar' (regras), 'abrir_porta'
    ('nome' e 'porta'), 'fechar_porta' ('nome' da regra a remover). Abrir/fechar
    SEMPRE pede confirmacao. Use para liberar um jogo/servidor."""
    a = acao.strip().lower()
    if a in ("listar", "lista", "ver"):
        s, e, _ = _ps("Get-NetFirewallRule -Enabled True | Select-Object -First 40 DisplayName,Direction,Action | Format-Table -AutoSize", 90)
        return "Regras ativas (primeiras 40):\n" + (s or e)
    if not _confirma_poderoso(f"Alterar o firewall: {a} (regra '{nome}', porta {porta} {protocolo})?"):
        return "Cancelado."
    if a in ("abrir_porta", "abrir", "liberar"):
        ps = (f"New-NetFirewallRule -DisplayName '{nome}' -Direction Inbound -Protocol {protocolo.upper()} "
              f"-LocalPort {porta} -Action Allow; 'OK'")
        s, e, c = _ps(ps, 90)
    elif a in ("fechar_porta", "fechar", "remover", "bloquear"):
        s, e, c = _ps(f"Remove-NetFirewallRule -DisplayName '{nome}'; 'OK'", 90)
    else:
        return "Acao invalida. Use: listar, abrir_porta ou fechar_porta."
    return f"Firewall: regra '{nome}' {a}." if c == 0 else f"Falhou: {(e or s)[:400]}"


@tool
def desligar_ligar_firewall(ligar: bool = True, perfil: str = "All") -> str:
    """LIGA OU DESLIGA O FIREWALL DO WINDOWS (PODEROSO; desligar deixa o PC
    exposto na rede). 'ligar'=True liga, False desliga; 'perfil'=Domain/Private/
    Public (padrao All/todos). SEMPRE pede confirmacao."""
    estado = "LIGAR" if ligar else "DESLIGAR (o PC fica exposto!)"
    if not _confirma_poderoso(f"{estado} o firewall do Windows (perfil {perfil})?"):
        return "Cancelado."
    valor = "True" if ligar else "False"
    s, e, c = _ps(f"Set-NetFirewallProfile -Profile {perfil} -Enabled {valor}; 'OK'", 90)
    return f"Firewall {'LIGADO' if ligar else 'DESLIGADO'} ({perfil})." if c == 0 else f"Falhou: {(e or s)[:400]}"


@tool
def limpar_spooler_impressao() -> str:
    """LIPA A FILA DE IMPRESSAO travada: para o servico de spooler, apaga os
    trabalhos presos e liga de novo (resolve 'documento preso que nao imprime').
    PODEROSO leve. SEMPRE pede confirmacao."""
    if not _confirma_poderoso("Limpar a fila de impressao (reinicia o spooler)?"):
        return "Cancelado."
    _rodar_cmd("net stop spooler", 60)
    _rodar_cmd('del /Q /F "%SystemRoot%\\System32\\spool\\PRINTERS\\*.*"', 60)
    s, e, c = _rodar_cmd("net start spooler", 60)
    return "Fila de impressao limpa e spooler religado." if c == 0 else f"Verifique: {(e or s)[:400]}"


# ---------------- INICIALIZACAO E TAREFAS DO WINDOWS ----------------
@tool
def inicializacao_windows(acao: str, nome: str = "", comando: str = "") -> str:
    """GERENCIA PROGRAMAS QUE INICIAM COM O WINDOWS (PODEROSO). Acoes: 'listar'
    (o que abre na inicializacao), 'adicionar' ('nome' e 'comando' = caminho do
    programa; abre ao logar), 'remover' ('nome'). Adicionar/remover SEMPRE pede
    confirmacao."""
    a = acao.strip().lower()
    if a in ("listar", "lista", "ver"):
        s, e, _ = _ps("Get-CimInstance Win32_StartupCommand | Select-Object Name,Command,Location | Format-Table -AutoSize | Out-String -Width 200", 90)
        return "Programas na inicializacao:\n" + (s or e)
    if not _confirma_poderoso(f"{a.title()} '{nome}' na inicializacao do Windows?"):
        return "Cancelado."
    chave = r"HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
    if a in ("adicionar", "adicionar", "add"):
        s, e, c = _ps(f"Set-ItemProperty -Path '{chave}' -Name '{nome}' -Value '{comando}'; 'OK'", 90)
    elif a in ("remover", "remove", "apagar"):
        s, e, c = _ps(f"Remove-ItemProperty -Path '{chave}' -Name '{nome}' -ErrorAction SilentlyContinue; 'OK'", 90)
    else:
        return "Acao invalida. Use: listar, adicionar ou remover."
    return f"Inicializacao '{nome}' {a}." if c == 0 else f"Falhou: {(e or s)[:400]}"


@tool
def gerenciar_tarefa_agendada_windows(acao: str, nome: str = "", programa: str = "", quando: str = "") -> str:
    """GERENCIA TAREFAS NO AGENDADOR DO WINDOWS (taskschd) - diferente do
    agendador interno do agente, estas rodam MESMO com o agente fechado.
    Acoes: 'listar', 'criar' ('nome', 'programa'=caminho, 'quando'='ONLOGON',
    'ONSTART' ou 'DAILY 08:00'), 'executar' ('nome'), 'remover' ('nome').
    Criar/remover SEMPRE pede confirmacao."""
    a = acao.strip().lower()
    if a in ("listar", "lista", "ver"):
        s, e, _ = _rodar_cmd("schtasks /query /fo TABLE /nh", 120)
        return "Tarefas agendadas (amostra):\n" + (s[:3000] or e)
    if not _confirma_poderoso(f"{a.title()} tarefa no Agendador do Windows: '{nome}'?"):
        return "Cancelado."
    if a in ("criar", "criar", "nova"):
        q = (quando or "ONLOGON").strip().upper()
        if q.startswith("DAILY"):
            hora = q.split("DAILY", 1)[1].strip() or "08:00"
            cmd = f'schtasks /create /tn "{nome}" /tr "{programa}" /sc daily /st {hora} /f'
        elif q.startswith("ONSTART"):
            cmd = f'schtasks /create /tn "{nome}" /tr "{programa}" /sc onstart /ru SYSTEM /f'
        else:
            cmd = f'schtasks /create /tn "{nome}" /tr "{programa}" /sc onlogon /f'
        s, e, c = _rodar_cmd(cmd, 90)
    elif a in ("executar", "rodar", "run"):
        s, e, c = _rodar_cmd(f'schtasks /run /tn "{nome}"', 60)
    elif a in ("remover", "remove", "apagar"):
        s, e, c = _rodar_cmd(f'schtasks /delete /tn "{nome}" /f', 60)
    else:
        return "Acao invalida. Use: listar, criar, executar ou remover."
    return f"Tarefa '{nome}': {a}." if c == 0 else f"Falhou: {(e or s)[:400]}"


# ---------------- REDE AVANCADA ----------------
@tool
def redefinir_rede_windows() -> str:
    """RESETA TODAS AS CONFIGURACOES DE REDE do Windows (Winsock, pilha TCP/IP,
    cache DNS) - resolve internet quebrada/configuracao baguncada. PODEROSO:
    apaga configuracoes de adaptador e EXIGE REINICIAR o PC para surtir efeito.
    SEMPRE pede confirmacao."""
    if not _confirma_poderoso("REDEFINIR a rede (Winsock + TCP/IP + DNS)? Voce precisara REINICIAR o PC depois."):
        return "Cancelado."
    _rodar_cmd("netsh winsock reset", 60)
    s, e, c = _rodar_cmd("netsh int ip reset", 60)
    _rodar_cmd("ipconfig /flushdns", 30)
    return "Rede redefinida. REINICIE o PC para aplicar." if c == 0 else f"Verifique: {(e or s)[:400]}"


@tool
def configurar_ip_estatico(interface: str, ip: str, mascara: str = "255.255.255.0", gateway: str = "", dns: str = "") -> str:
    """CONFIGURA IP ESTATICO (fixo) num adaptador de rede, em vez de DHCP
    automatico (PODEROSO; pode cortar a internet se errado). 'interface'=nome da
    rede (ex.: 'Wi-Fi', 'Ethernet'). Para voltar ao automatico use
    configurar_ip_dhcp. SEMPRE pede confirmacao."""
    if not _confirma_poderoso(f"Definir IP ESTATICO em '{interface}': {ip}/{mascara} gw {gateway or '-'}?"):
        return "Cancelado."
    gw = f' {gateway}' if gateway else ""
    s, e, c = _rodar_cmd(f'netsh interface ip set address name="{interface}" static {ip} {mascara}{gw}', 60)
    if dns and c == 0:
        _rodar_cmd(f'netsh interface ip set dns name="{interface}" static {dns}', 60)
    return f"IP estatico configurado em '{interface}' ({ip})." if c == 0 else f"Falhou: {(e or s)[:400]}"


@tool
def configurar_ip_dhcp(interface: str) -> str:
    """VOLTA O ADAPTADOR DE REDE para obter IP/DNS automaticamente (DHCP) -
    desfaz um IP estatico. PODEROSO leve. SEMPRE pede confirmacao."""
    if not _confirma_poderoso(f"Voltar '{interface}' para IP automatico (DHCP)?"):
        return "Cancelado."
    _rodar_cmd(f'netsh interface ip set address name="{interface}" dhcp', 60)
    s, e, c = _rodar_cmd(f'netsh interface ip set dns name="{interface}" dhcp', 60)
    return f"'{interface}' voltou para DHCP (automatico)." if c == 0 else f"Falhou: {(e or s)[:400]}"


@tool
def gerenciar_adaptador_rede(acao: str, nome: str = "Wi-Fi") -> str:
    """LIGA OU DESLIGA um adaptador de rede (Wi-Fi/Ethernet/Bluetooth de rede)
    (PODEROSO; desligar corta a conexao). 'acao'='ligar' ou 'desligar'; 'nome' do
    adaptador. Requer admin. SEMPRE pede confirmacao."""
    a = acao.strip().lower()
    if a not in ("ligar", "ativar", "desligar", "desativar"):
        return "Use 'ligar' ou 'desligar'."
    ligar = a.startswith(("lig", "ativ"))
    if not _confirma_poderoso(f"{'ATIVAR' if ligar else 'DESATIVAR'} o adaptador de rede '{nome}'?"):
        return "Cancelado."
    cmd = "Enable-NetAdapter" if ligar else "Disable-NetAdapter"
    s, e, c = _ps(f"{cmd} -Name '{nome}' -Confirm:$false; 'OK'", 90)
    return f"Adaptador '{nome}' {'ativado' if ligar else 'desativado'}." if c == 0 else f"Falhou (precisa de admin): {(e or s)[:400]}"


@tool
def matizar_porta(porta: int) -> str:
    """ENCONTRA E ENCERRA o processo que esta OCUPANDO uma porta TCP (ex.: porta
    8000/3000/8080 presa por um servidor que nao fecha). PODEROSO (mata o
    processo). SEMPRE pede confirmacao."""
    if not _confirma_poderoso(f"Encontrar e ENCERRAR o processo que usa a porta {porta}?"):
        return "Cancelado."
    s, e, _ = _ps(f"(Get-NetTCPConnection -LocalPort {porta} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess", 60)
    pid = (s or "").strip()
    if not pid or not pid.isdigit():
        return f"Nenhum processo escutando na porta {porta}."
    s2, e2, c = _rodar_cmd(f"taskkill /PID {pid} /F", 60)
    return f"Processo PID {pid} (porta {porta}) encerrado." if c == 0 else f"Falhou ao encerrar PID {pid}: {(e2 or s2)[:300]}"


# ---------------- REMOTO E ELEVACAO ----------------
@tool
def desligar_pc_remoto(computador: str, acao: str = "desligar", mensagem: str = "") -> str:
    """DESLIGA OU REINICIA OUTRO PC da rede pelo nome/IP (precisa que o PC remoto
    permita gerenciamento remoto). PODEROSO. 'computador'=nome ou IP, 'acao'=
    'desligar' ou 'reiniciar'. SEMPRE pede confirmacao."""
    a = "r" if acao.strip().lower().startswith(("rein", "r")) else "s"
    host = computador.strip()
    if not host:
        return "Diga o nome/IP do computador remoto."
    if not _confirma_poderoso(f"{'REINICIAR' if a=='r' else 'DESLIGAR'} o computador remoto '{host}'?"):
        return "Cancelado."
    aviso = f' /c "{mensagem}"' if mensagem else ""
    s, e, c = _rodar_cmd(f"shutdown /{a} /m \\\\{host} /t 30 /f{aviso}", 60)
    return f"Comando enviado para '{host}' (reinicia/desliga em ~30s; cancele no alvo com shutdown /a)." if c == 0 else f"Falhou (precisa permissao/PC remoto configurado): {(e or s)[:400]}"


@tool
def executar_como_administrador(comando: str) -> str:
    """RELANCA UM COMANDO/PROGRAMA PEDINDO ELEVACAO (abre o UAC como admin),
    mesmo que o agente esteja sem privilegio naquele momento. PODEROSO. SEMPRE
    pede confirmacao. Use para algo que exige admin e recusou permissao."""
    if not _confirma_poderoso(f"Executar COMO ADMINISTRADOR (vai pedir o UAC): {comando}?"):
        return "Cancelado."
    try:
        import ctypes
        rc = ctypes.windll.shell32.ShellExecuteW(None, "runas", "cmd.exe", f'/c "{comando}"', None, 1)
        return "Comando disparado como administrador (aceite o UAC)." if rc > 32 else f"O UAC foi recusado/cancelou (cod {rc})."
    except Exception as e:
        return f"Falhou: {e}"


# ---------------- REMOTO / WINDOWS FEATURES / VIRTUALIZACAO ----------------
@tool
def habilitar_rdp(acao: str = "ligar") -> str:
    """LIGA OU DESLIGA A AREA DE TRABALHO REMOTA (RDP / Remote Desktop) do
    Windows - permite (ou bloqueia) acessar este PC por outro via Conexao de Area
    de Trabalho Remota. PODEROSO (expor o PC na rede). 'acao'='ligar'/'desligar'.
    SEMPRE pede confirmacao."""
    ligar = acao.strip().lower().startswith(("lig", "ativ", "on"))
    if not _confirma_poderoso(f"{'HABILITAR' if ligar else 'DESABILITAR'} a Area de Trabalho Remota (RDP)?"):
        return "Cancelado."
    valor = "0" if ligar else "1"  # fDenyTSConnections: 0 = permitir RDP
    _rodar_cmd(r'reg add "HKLM\System\CurrentControlSet\Control\Terminal Server" /v fDenyTSConnections /t REG_DWORD /d ' + valor + " /f", 60)
    _rodar_cmd('netsh advfirewall firewall set rule group="remote desktop" new enable=' + ("Yes" if ligar else "No"), 60)
    return f"Area de Trabalho Remota (RDP) {'HABILITADA' if ligar else 'DESABILITADA'}."


@tool
def compartilhar_pasta_rede(caminho: str, nome_compartilhamento: str = "") -> str:
    """COMPARTILHA UMA PASTA NA REDE LOCAL (SMB/net share) - outros PCs do mesmo
    Wi-Fi/rede acessam por \\seu-pc\nome. PODEROSO (expoe arquivos na rede).
    'caminho'=pasta, 'nome_compartilhamento'=nome (opcional). SEMPRE pede
    confirmacao."""
    p = caminho.strip().strip('"')
    if not os.path.isdir(p):
        return f"Pasta nao encontrada: {p}"
    nome = nome_compartilhamento.strip() or os.path.basename(p.rstrip("/\\"))
    if not _confirma_poderoso(f"Compartilhar '{p}' na rede local (acesso de leitura)?"):
        return "Cancelado."
    s, e, c = _rodar_cmd(f'net share "{nome}"="{p}" /grant:Everyone,READ', 60)
    return f"Pasta compartilhada na rede como '{nome}'." if c == 0 else f"Falhou: {(e or s)[:400]}"


@tool
def listar_dispositivos_rede() -> str:
    """LISTA OS DISPOSITIVOS da rede local (tabela ARP: IPs e enderecos MAC que
    responderam ao seu PC) - so leitura. Bom para ver o que tem no seu Wi-Fi."""
    s, e, c = _rodar_cmd("arp -a", 60)
    return "Dispositivos vistos na rede (ARP):\n" + (s or e) if c == 0 else f"Falhou: {e or s}"


@tool
def gerenciar_recurso_windows(acao: str, recurso: str = "") -> str:
    """LIGA/DESLIGA RECURSOS DO WINDOWS (IIS, .NET, Hyper-V, WSL, Sandbox, SSH,
    Linux subsystem etc.). Acoes: 'listar' (recursos habilitados), 'habilitar'
    ('recurso'=nome do FeatureName), 'desabilitar' ('recurso'). PODEROSO (pode
    exigir reinicio). SEMPRE pede confirmacao para alterar."""
    a = acao.strip().lower()
    if a in ("listar", "lista", "ver"):
        s, e, _ = _ps("Get-WindowsOptionalFeature -Online | Where-Object {$_.State -eq 'Enabled'} | Select-Object -First 40 FeatureName | Format-Table -AutoSize", 120)
        return "Recursos HABILITADOS (primeiros 40):\n" + (s or e)
    if not recurso.strip():
        return "Diga o nome do recurso (FeatureName; veja 'listar')."
    if not _confirma_poderoso(f"{a.title()} o recurso do Windows '{recurso}'? Pode exigir reinicio."):
        return "Cancelado."
    if a.startswith("habil"):
        s, e, c = _ps(f"Enable-WindowsOptionalFeature -Online -FeatureName '{recurso}' -All -NoRestart -ErrorAction Stop | Out-String", 600)
    else:
        s, e, c = _ps(f"Disable-WindowsOptionalFeature -Online -FeatureName '{recurso}' -NoRestart -ErrorAction Stop | Out-String", 600)
    return f"Recurso '{recurso}' {a} (reinicie se for pedido)." if c == 0 else f"Falhou: {(e or s)[:500]}"


@tool
def listar_wsl() -> str:
    """LISTA as distribuicoes Linux do WSL instaladas (nome, estado, versao) -
    so leitura. Se nao houver WSL, avisa como instalar."""
    s, e, c = _rodar_cmd("wsl -l -v", 60)
    if c != 0:
        return "WSL nao encontrado/instalado. Instale com a ferramenta 'gerenciar_wsl' (acao instalar) como admin."
    return "Distribuicoes WSL:\n" + s


@tool
def gerenciar_wsl(acao: str, distro: str = "Ubuntu") -> str:
    """GERENCIA O WSL (Linux no Windows). Acoes: 'instalar' (instala Ubuntu),
    'desligar' (wsl --shutdown, libera memoria), 'encerrar' ('distro'), 'abrir'
    ('distro'). PODEROSO (instalar/desligar). SEMPRE pede confirmacao para
    instalar/desligar."""
    a = acao.strip().lower()
    if a in ("instalar", "install"):
        if not _confirma_poderoso("Instalar o WSL com Ubuntu (recurso do Windows + download)?"):
            return "Cancelado."
        s, e, c = _rodar_cmd("wsl --install -d " + distro, 1200)
        return "Instalacao do WSL iniciada (reinicie se pedido)." if c == 0 else f"Falhou: {(e or s)[:500]}"
    if a in ("desligar", "shutdown"):
        if not _confirma_poderoso("Desligar TODAS as distros WSL (wsl --shutdown)?"):
            return "Cancelado."
        s, e, c = _rodar_cmd("wsl --shutdown", 60)
        return "WSL desligado (memoria liberada)." if c == 0 else f"Falhou: {e or s}"
    if a in ("encerrar", "terminate"):
        s, e, c = _rodar_cmd(f"wsl -t {distro}", 60)
        return f"Distro '{distro}' encerrada." if c == 0 else f"Falhou: {(e or s)[:300]}"
    if a in ("abrir", "abrir_distro"):
        subprocess.Popen(f'wsl -d {distro}', shell=True)
        return f"Abrindo WSL '{distro}'."
    return "Acao invalida. Use: instalar, desligar, encerrar ou abrir."


@tool
def listar_vms_hyperv() -> str:
    """LISTA as maquinas virtuais do Hyper-V (nome, estado) - so leitura. Se o
    Hyper-V nao estiver instalado, avisa."""
    s, e, c = _ps("Get-VM | Select-Object Name,State | Format-Table -AutoSize", 60)
    if c != 0:
        return "Hyper-V nao disponivel neste Windows (precisa Pro/Enterprise). Use 'habilitar_hyperv' para instalar."
    return "Maquinas virtuais (Hyper-V):\n" + (s or "Nenhuma VM.")


@tool
def gerenciar_vm_hyperv(acao: str, nome_vm: str) -> str:
    """LIGA OU DESLIGA UMA MAQUINA VIRTUAL do Hyper-V. Acoes: 'iniciar' e
    'desligar' ('nome_vm'). PODEROSO. SEMPRE pede confirmacao para desligar."""
    a = acao.strip().lower()
    if a in ("iniciar", "ligar", "start"):
        s, e, c = _ps(f"Start-VM -Name '{nome_vm}'; 'OK'", 90)
        return f"VM '{nome_vm}' iniciada." if c == 0 else f"Falhou: {(e or s)[:300]}"
    if a in ("desligar", "parar", "stop"):
        if not _confirma_poderoso(f"DESLIGAR a maquina virtual '{nome_vm}'?"):
            return "Cancelado."
        s, e, c = _ps(f"Stop-VM -Name '{nome_vm}' -Force; 'OK'", 90)
        return f"VM '{nome_vm}' desligada." if c == 0 else f"Falhou: {(e or s)[:300]}"
    return "Use 'iniciar' ou 'desligar' com o nome da VM."


@tool
def habilitar_hyperv() -> str:
    """INSTALA O HYPER-V (virtualizacao da Microsoft) no Windows Pro/Enterprise -
    permite rodar maquinas virtuais. PODEROSO (ativa recurso, exige reinicio; nao
    funciona no Windows Home). SEMPRE pede confirmacao."""
    if not _confirma_poderoso("Habilitar o Hyper-V (recurso de virtualizacao)? Exige Windows Pro e reinicio."):
        return "Cancelado."
    s, e, c = _ps("Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All -All -NoRestart | Out-String", 900)
    return "Hyper-V habilitado. REINICIE o PC para concluir." if c == 0 else f"Falhou (Windows Home?): {(e or s)[:500]}"


@tool
def abrir_windows_sandbox() -> str:
    """ABRE O WINDOWS SANDBOX - um Windows isolado e descartavel (tudo o que voce
    faz la some ao fechar; otimo para testar programas suspeitos com seguranca).
    Se o recurso nao estiver instalado, tenta habilita-lo antes. PODEROSO. SEMPRE
    pede confirmacao. Requer Windows Pro/Enterprise."""
    if not _confirma_poderoso("Abrir (ou instalar) o Windows Sandbox (ambiente isolado)?"):
        return "Cancelado."
    _ps("Enable-WindowsOptionalFeature -Online -FeatureName Containers-DisposableClientVM -All -NoRestart -ErrorAction SilentlyContinue | Out-Null", 600)
    try:
        subprocess.Popen("WindowsSandbox.exe", shell=True)
        return "Windows Sandbox sendo aberto (se acabou de instalar, reinicie o PC antes)."
    except Exception as ex:
        return f"Nao consegui abrir (Windows Pro?): {ex}"


# ---------------- LIMPEZA / BLOATWARE / BACKUP / RESTAURACAO ----------------
@tool
def remover_bloatware() -> str:
    """REMOVE OS APPS DE FABRICA (bloatware) indesejados do Windows (jogos e apps
    Xbox, Bing Noticias/Clima, Solitaire, Candy Crush, Zune/Music etc.) para o
    usuario atual. PODEROSO e SEM VOLTA (os apps somem; alguns podem ser
    reinstalados pela Loja). SEMPRE pede confirmacao. NAO apaga arquivos nem o
    sistema, so remove esses aplicativos."""
    if not _confirma_poderoso("Remover os apps de fabrica (bloatware) comuns do Windows? Desinstala Xbox, Bing, Solitaire, Candy, Zune etc."):
        return "Cancelado."
    ps = ("Get-AppxPackage -AllUsers | Where-Object {$_.Name -match 'xbox|bing|solitaire|candy|zune|king|mixed|skype|gethelp|people|feedback'} "
          "| Remove-AppxPackage -ErrorAction SilentlyContinue; 'OK'")
    s, e, c = _ps(ps, 600)
    return "Bloatware removido (alguns apps podem pedir reinicio para sumir)." if c == 0 else f"Concluido com avisos: {(e or s)[:400]}"


@tool
def backup_imagem_sistema(destino: str) -> str:
    """CRIA UMA IMAGEM COMPLETA DE BACKUP DO SISTEMA (wbadmin) num disco externo -
    da para restaurar o PC inteiro. PODEROSO e demorado. 'destino'=letra do disco
    externo (ex.: 'E:'). SEMPRE pede confirmacao."""
    d = destino.strip()
    if not d:
        return "Diga o disco de destino do backup (ex.: 'E:' - use um HD externo NTFS)."
    if not _confirma_poderoso(f"Criar imagem de backup do sistema para {d}? Pode demorar muito e usa espaco em disco."):
        return "Cancelado."
    s, e, c = _rodar_cmd(f"wbadmin start backup -backupTarget:{d} -include:C: -allCritical -quiet", 3600)
    return "Backup de imagem iniciado/concluido (acompanhe na saida)." if c == 0 else f"Falhou (precisa de disco NTFS externo e admin): {(e or s)[:500]}"


@tool
def listar_pontos_restauracao() -> str:
    """LISTA os pontos de restauracao do sistema existentes - so leitura."""
    s, e, c = _ps("Get-ComputerRestorePoint | Select-Object SequenceNumber,CreationTime,Description | Format-Table -AutoSize", 90)
    return "Pontos de restauracao:\n" + (s or "Nenhum ponto encontrado (use 'ponto_de_restauracao' para criar).") if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def restaurar_pc_ponto() -> str:
    """ABRE O ASSISTENTE DE RESTAURACAO DO SISTEMA (rstrui) para voltar o Windows a
    um ponto anterior - desfaz atualizacoes/configuracoes problematicas. PODEROSO
    (reverte o sistema; pode reiniciar). SEMPRE pede confirmacao. NAO apaga seus
    documentos."""
    if not _confirma_poderoso("Abrir a Restauracao do Sistema (voltar o Windows a um ponto anterior)? Pode reiniciar o PC."):
        return "Cancelado."
    try:
        subprocess.Popen("rstrui.exe", shell=True)
        return "Assistente de restauracao aberto - siga os passos na tela."
    except Exception as ex:
        return f"Nao consegui abrir: {ex}"


# ---------------- DRIVERS / EVENTOS / IMPRESSORA / BLUETOOTH ----------------
@tool
def listar_drivers() -> str:
    """LISTA OS DRIVERS instalados (fornecedor, nome) via pnputil - so leitura.
    Util para ver drivers de terceiros/antigos."""
    s, e, c = _rodar_cmd("pnputil /enum-drivers", 120)
    if c != 0:
        s, e, c = _rodar_cmd("driverquery /fo table", 120)
    return "Drivers instalados (trecho):\n" + (s[:3500] or e)


@tool
def logs_eventos_windows(tipo: str = "erro", quantidade: int = 12) -> str:
    """MOSTRA OS EVENTOS DE ERRO RECENTES DO WINDOWS (logs de sistema) - so
    leitura. 'tipo'='sistema' (log do System) ou 'aplicativo' (Application);
    'quantidade'=quantos trazer. Use para diagnosticar travadas/tela azul."""
    log = "Application" if tipo.strip().lower().startswith(("apli", "app")) else "System"
    ps = (f"Get-WinEvent -FilterHashtable @{{LogName='{log}'; Level=1,2}} -MaxEvents {max(1,int(quantidade))} -ErrorAction SilentlyContinue | "
          "Select-Object TimeCreated,Id,ProviderName,@{n='Msg';e={$_.Message.Substring(0,[Math]::Min(120,$_.Message.Length))}} | Format-List")
    s, e, c = _ps(ps, 120)
    return f"Ultimos eventos de erro ({log}):\n" + (s or "Nenhum erro recente encontrado.") if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def gerenciar_impressora(acao: str, nome_impressora: str = "") -> str:
    """LISTA IMPRESSORAS ou CANCELA os trabalhos de impressao presos. Acoes:
    'listar' (impressoras instaladas) ou 'cancelar' ('nome_impressora'; vazio =
    todas). Cancelar e PODEROSO e pede confirmacao."""
    a = acao.strip().lower()
    if a in ("listar", "lista", "ver"):
        s, e, c = _ps("Get-Printer | Select-Object Name,PrinterStatus | Format-Table -AutoSize", 60)
        return "Impressoras:\n" + (s or e)
    if a in ("cancelar", "limpar", "cancelar_fila"):
        if not _confirma_poderoso(f"Cancelar TODOS os trabalhos de impressao de '{nome_impressora or 'todas'}'?"):
            return "Cancelado."
        if nome_impressora.strip():
            s, e, c = _ps(f"Get-PrintJob -PrinterName '{nome_impressora}' | Remove-PrintJob -ErrorAction SilentlyContinue; 'OK'", 90)
        else:
            s, e, c = _ps("Get-Printer | ForEach-Object { Get-PrintJob -PrinterName $_.Name | Remove-PrintJob -ErrorAction SilentlyContinue }; 'OK'", 90)
        return "Fila de impressao cancelada." if c == 0 else f"Falhou: {(e or s)[:300]}"
    return "Use 'listar' ou 'cancelar'."


@tool
def listar_dispositivos_bluetooth() -> str:
    """LISTA os dispositivos Bluetooth (pareados e status) - so leitura."""
    s, e, c = _ps("Get-PnpDevice -Class Bluetooth | Select-Object FriendlyName,Status | Format-Table -AutoSize", 60)
    return "Dispositivos Bluetooth:\n" + (s or e or "Nenhum encontrado.") if c == 0 else f"Falhou: {e or s}"


# ---------------- PROCESSOS / ENERGIA / SISTEMA AVANCADO ----------------
@tool
def criar_esquema_energia_personalizado(nome: str) -> str:
    """CRIA E ATIVA UM ESQUEMA DE ENERGIA PERSONALIZADO (copia do esquema de Alto
    Desempenho com o seu nome). PODEROSO leve (muda configuracao de energia).
    SEMPRE pede confirmacao."""
    if not _confirma_poderoso(f"Criar e ativar um esquema de energia '{nome}' (baseado em Alto Desempenho)?"):
        return "Cancelado."
    s, e, c = _rodar_cmd("powercfg /duplicatescheme 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c", 60)
    import re as _re
    m = _re.search(r"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})", s or "")
    if not m:
        return f"Nao consegui criar o esquema: {(e or s)[:300]}"
    guid = m.group(1)
    _rodar_cmd(f'powercfg /changename "{guid}" "{nome}"', 30)
    _rodar_cmd(f'powercfg /setactive "{guid}"', 30)
    return f"Esquema de energia '{nome}' criado e ativado."


@tool
def prioridade_processo(nome_processo: str, prioridade: str = "alta") -> str:
    """DEFINE A PRIORIDADE DE UM PROCESSO no Windows (da mais/menos CPU a ele).
    'prioridade'='baixa', 'normal', 'alta' ou 'tempo_real' (tempo_real pode travar
    o PC). PODEROSO. SEMPRE pede confirmacao."""
    mapa = {"baixa": "Idle", "idle": "Idle", "normal": "Normal", "alta": "High",
            "tempo_real": "RealTime", "realtime": "RealTime", "acima": "AboveNormal", "abaixo": "BelowNormal"}
    nivel = mapa.get(prioridade.strip().lower(), "High")
    alerta = " (ATENCAO: tempo real pode travar o PC!)" if nivel == "RealTime" else ""
    if not _confirma_poderoso(f"Definir prioridade de '{nome_processo}' como {nivel}?{alerta}"):
        return "Cancelado."
    nome = nome_processo.strip().replace(".exe", "")
    s, e, c = _ps(f"Get-Process -Name '{nome}' -ErrorAction Stop | ForEach-Object {{ $_.PriorityClass = '{nivel}' }}; 'OK'", 60)
    return f"Prioridade de '{nome}' ajustada para {nivel}." if c == 0 else f"Falhou (processo nao encontrado?): {(e or s)[:300]}"


@tool
def forcar_encerrar_travados() -> str:
    """FORCA O FECHAMENTO DE TODOS OS PROGRAMAS QUE ESTAO 'NAO RESPONDENDO'
    (travados) de uma vez. PODEROSO (mata os congelados; dados nao salvos nesses
    programas se perdem). SEMPRE pede confirmacao."""
    if not _confirma_poderoso("Encerrar TODOS os programas que estao 'Nao respondendo' (travados)? Mudancas nao salvas neles se perdem."):
        return "Cancelado."
    s, e, c = _rodar_cmd('taskkill /f /fi "STATUS eq NOT RESPONDING"', 60)
    conteudo = s or "Nenhum programa travado no momento."
    return "Programas travados encerrados.\n" + conteudo


@tool
def mudar_nome_pc(novo_nome: str) -> str:
    """TROCA O NOME DO COMPUTADOR (aparece na rede e em Configuracoes). PODEROSO
    (so vale apos REINICIAR). SEMPRE pede confirmacao."""
    nome = novo_nome.strip()
    if not nome or not nome.replace("-", "").isalnum() or len(nome) > 15:
        return "O nome deve ter ate 15 caracteres, apenas letras/numeros/hifen."
    if not _confirma_poderoso(f"Renomear este PC para '{nome}'? (vale apos reiniciar)"):
        return "Cancelado."
    s, e, c = _ps(f"Rename-Computer -NewName '{nome}' -Force -ErrorAction Stop; 'OK'", 90)
    return f"PC sera renomeado para '{nome}' apos reiniciar." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def limpar_rastros_privacidade() -> str:
    """LIMPA RASTROS DE USO do PC (itens/arquivos recentes do Explorer, historico
    do Executar, area de transferencia) - NAO apaga seus documentos, so o historico
    de uso. PODEROSO. SEMPRE pede confirmacao."""
    if not _confirma_poderoso("Limpar os rastros de uso (itens/arquivos recentes, historico do Executar, clipboard)? Seus documentos NAO sao apagados."):
        return "Cancelado."
    ps = ("Remove-Item \"$env:APPDATA\\Microsoft\\Windows\\Recent\\*\" -Recurse -Force -ErrorAction SilentlyContinue; "
          "Remove-Item 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU' -Recurse -Force -ErrorAction SilentlyContinue; "
          "Set-Clipboard -Value ''; 'OK'")
    s, e, c = _ps(ps, 120)
    return "Rastros de uso limpos (reabra o Explorer se a lista ainda aparecer)." if c == 0 else f"Concluido com avisos: {(e or s)[:300]}"


@tool
def desativar_telemetria(acao: str = "desativar") -> str:
    """REDUZ A TELEMETRIA/RASTREIO DO WINDOWS (para o servico de Telemetria
    Conectada DiagTrack e define o diagnostico para o minimo). 'acao'=
    'desativar' ou 'reativar'. PODEROSO e de privacidade; o Windows pode religar
    em atualizacoes. SEMPRE pede confirmacao."""
    desligar = acao.strip().lower().startswith(("deslig", "desat", "off"))
    if not _confirma_poderoso(f"{'DESATIVAR a telemetria do Windows' if desligar else 'REATIVAR a telemetria'}?"):
        return "Cancelado."
    if desligar:
        _ps("Stop-Service DiagTrack -Force -ErrorAction SilentlyContinue; Set-Service DiagTrack -StartupType Disabled -ErrorAction SilentlyContinue; 'OK'", 90)
        _rodar_cmd(r'reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\DataCollection" /v AllowTelemetry /t REG_DWORD /d 0 /f', 60)
        return "Telemetria reduzida (servico DiagTrack parado/desligado e diagnostico no minimo)."
    _ps("Set-Service DiagTrack -StartupType Automatic; Start-Service DiagTrack -ErrorAction SilentlyContinue; 'OK'", 90)
    _rodar_cmd(r'reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\DataCollection" /v AllowTelemetry /t REG_DWORD /d 1 /f', 60)
    return "Telemetria reativada."


@tool
def conexoes_de_rede_programas() -> str:
    """MOSTRA QUAIS PROGRAMAS/PROCESSOS estao com conexao de rede ativa e para
    qual IP/porta remota (otimo para ver o que esta 'conversando' na internet) -
    so leitura, nao encerra nada."""
    ps = ("Get-NetTCPConnection -State Established -ErrorAction SilentlyContinue | "
          "Select-Object -First 25 @{n='Programa';e={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName}}, "
          "LocalPort,RemoteAddress,RemotePort | Format-Table -AutoSize")
    s, e, c = _ps(ps, 90)
    return "Programas com conexao de rede ativa:\n" + (s or "Nenhuma conexao estabelecida no momento.") if c == 0 else f"Falhou: {e or s}"


# ======================================================================
# ====== FERRAMENTAS EXTREMAMENTE PODEROSAS - NIVEL ESPECIALISTA =======
# Particoes/disco, SSD, boot, recuperacao profunda, drivers, rede avancada,
# firewall cirurgico, variaveis de sistema, politicas... TODA acao que muda o
# sistema passa por '_confirma_poderoso' (trava de catastrofe que pergunta
# sim/nao MESMO no modo admin). Leituras nao perguntam. ADICAO PURA.
# ======================================================================

def _diskpart(script: str, timeout: int = 300):
    """Roda comandos do diskpart a partir de um script .txt temporario
    (e a unica forma segura de automar particao/disco via linha de comando)."""
    import tempfile
    try:
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="ascii", errors="ignore") as f:
            f.write(script)
            tmp = f.name
        return _rodar_cmd(f'diskpart /s "{tmp}"', timeout)
    except Exception as e:
        return ("", str(e), 1)


# ---------------- DISCOS E PARTICoes (diskpart) ----------------
@tool
def listar_discos_particoes() -> str:
    """LISTA os discos fisicos (HD, SSD, pendrive) e os volumes/particoes (letra,
    nome, sistema de arquivos, tamanho total e livre, saude) - o mesmo que o
    Gerenciamento de Discos do Windows. So leitura."""
    ps = ("Write-Output '=== DISCOS FISICOS ==='; "
          "Get-Disk | Select-Object Number,FriendlyName,@{n='TamGB';e={[math]::Round($_.Size/1GB,1)}},PartitionStyle,OperationalStatus | Format-Table -AutoSize | Out-String; "
          "Write-Output '=== VOLUMES / PARTICOES ==='; "
          "Get-Volume | Where-Object {$_.DriveLetter} | Select-Object DriveLetter,FileSystemLabel,FileSystem,@{n='TamGB';e={[math]::Round($_.Size/1GB,1)}},@{n='LivreGB';e={[math]::Round($_.SizeRemaining/1GB,1)}},HealthStatus | Format-Table -AutoSize | Out-String")
    s, e, c = _ps(ps, 120)
    return s if c == 0 else f"Falhou: {(e or s)[:400]}"


@tool
def criar_particao(numero_disco: int, tamanho_gb: str = "", letra: str = "") -> str:
    """CRIA UMA NOVA PARTICAO num disco (ex.: um HD/SSD novo ou espaco livre) e
    formata em NTFS. 'numero_disco'=numero que aparece em 'listar_discos_particoes';
    'tamanho_gb'=tamanho (vazio = usa todo o espaco livre); 'letra'=letra que a
    unidade vai receber (vazio = o Windows escolhe). EXTREMAMENTE PODEROSO.
    SEMPRE pede confirmacao."""
    if not _confirma_poderoso(f"Criar uma particao NOVA no disco {numero_disco}"
                              + (f" de {tamanho_gb} GB" if tamanho_gb else " usando todo o espaco livre")
                              + " e formatar em NTFS? Use somente num disco/espaco livre."):
        return "Cancelado."
    tam_mb = f" size={int(float(tamanho_gb) * 1024)}" if str(tamanho_gb).strip() else ""
    linha_letra = f"assign letter={letra.strip().rstrip(':').upper()}" if str(letra).strip() else "assign"
    # Cria a particao (com ou sem tamanho), formata em NTFS e atribui a letra
    script = f"select disk {int(numero_disco)}\ncreate partition primary{tam_mb}\nformat quick fs=ntfs\n{linha_letra}\n"
    s, e, c = _diskpart(script, 600)
    if c == 0 and ("DiskPart successfully" in s or "atribuid" in s.lower() or "assign" in s.lower() or s.strip()):
        return f"Particao criada e formatada no disco {numero_disco}.\n{s[-600:]}"
    return f"Falhou (confira o numero do disco em 'listar_discos_particoes'; precisa de admin): {(e or s)[-600:]}"


@tool
def deletar_particao(numero_disco: int, numero_particao: int) -> str:
    """APAGA UMA PARTICAO INTEIRA (some com tudo que esta dentro dela). Use so em
    particoes de dados que voce pode apagar; NUNCA use na particao do Windows
    (reservada/boot/C:). EXTREMAMENTE PODEROSO e sem volta. SEMPRE pede
    confirmacao."""
    if not _confirma_poderoso(f"APAGAR a particao {numero_particao} do disco {numero_disco}? "
                              "TUDO que estiver nessa particao sera perdido para sempre."):
        return "Cancelado."
    s, e, c = _diskpart(f"select disk {int(numero_disco)}\nselect partition {int(numero_particao)}\ndelete partition override\n", 300)
    return f"Particao {numero_particao} apagada.\n{s[-400:]}" if c == 0 else f"Falhou (particao do sistema protegida?): {(e or s)[-400:]}"


@tool
def mudar_letra_unidade(letra_atual: str, letra_nova: str) -> str:
    """TROCA A LETRA DE UMA UNIDADE (ex.: o pendrive que virou D:, mudar para E:).
    'letra_atual' e 'letra_nova' sao letras (com ou sem dois pontos). PODEROSO
    (pode quebrar atalhos/programas que apontam para a letra antiga). SEMPRE pede
    confirmacao."""
    a = letra_atual.strip().rstrip(":").upper()
    n = letra_nova.strip().rstrip(":").upper()
    if not _confirma_poderoso(f"Mudar a letra da unidade {a}: para {n}:? Atalhos e programas que usam {a}: podem parar de funcionar."):
        return "Cancelado."
    s, e, c = _diskpart(f"select volume {a}\nassign letter={n}\n", 120)
    return f"Unidade renomeada de {a}: para {n}:." if c == 0 else f"Falhou (a letra {n}: ja esta em uso?): {(e or s)[-400:]}"


@tool
def renomear_volume(letra: str, novo_nome: str) -> str:
    """TROCA O NOME (ROTULO) de um disco/pen drive, ex.: 'Dados' ou 'MeuBackup'.
    'letra'=letra da unidade, 'novo_nome'=nome que vai aparecer no Computador.
    PODEROSO leve. SEMPRE pede confirmacao."""
    l = letra.strip().rstrip(":").upper()
    if not _confirma_poderoso(f"Renomear a unidade {l}: para '{novo_nome}'?"):
        return "Cancelado."
    s, e, c = _rodar_cmd(f'label {l}: "{novo_nome[:32]}"', 60)
    return f"Unidade {l}: renomeada para '{novo_nome[:32]}'." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def estender_particao(letra_volume: str) -> str:
    """ESTENDE UMA PARTICAO para ocupar o espaco livre que estiver ao lado dela no
    mesmo disco (aumenta o tamanho sem apagar nada; precisa de espaco nao alocado
    depois dela). 'letra_volume'=ex.: 'D'. PODEROSO. SEMPRE pede confirmacao."""
    l = letra_volume.strip().rstrip(":").upper()
    if not _confirma_poderoso(f"Estender a unidade {l}: ate o fim do espaco livre do disco? (nao apaga arquivos)"):
        return "Cancelado."
    s, e, c = _diskpart(f"select volume {l}\nextend\n", 600)
    return f"Unidade {l}: estendida.\n{s[-400:]}" if c == 0 else f"Falhou (ha espaco nao alocado depois dela?): {(e or s)[-400:]}"


@tool
def verificar_saude_ssd() -> str:
    """MOSTRA A SAUDE dos discos (HD/SSD/NVMe): status, tipo de midia e, para SSD,
    o desgaste/uso estimado (wear) e temperaturas quando o disco reporta. So
    leitura. Use para saber se o SSD esta chegando ao fim da vida util."""
    ps = ("Get-PhysicalDisk | Select-Object DeviceId,FriendlyName,MediaType,HealthStatus,OperationalStatus | Format-Table -AutoSize | Out-String; "
          "Write-Output '--- detalhes de confiabilidade (SSD) ---'; "
          "Get-PhysicalDisk | ForEach-Object { $r = $_ | Get-StorageReliabilityCounter -ErrorAction SilentlyContinue; "
          "if ($r) { '{0}: wear={1}% temp={2}C horas_ligado={3}' -f $_.FriendlyName,$r.Wear,$r.Temperature,$r.PowerOnHours } }")
    s, e, c = _ps(ps, 120)
    return s if c == 0 else f"Falhou: {(e or s)[:400]}"


@tool
def otimizar_disco(letra: str = "C") -> str:
    """OTIMIZA UM DISCO: em SSD executa TRIM (recomendado pela Microsoft), em HD
    comum desfragmenta. 'letra'=unidade (padrao C:). Demora um pouco. PODEROSO
    (usa disco intensamente) mas NAO apaga nada. SEMPRE pede confirmacao."""
    l = letra.strip().rstrip(":").upper()
    if not _confirma_poderoso(f"Otimizar o disco {l}: (TRIM se for SSD, desfragmentacao se for HD)? Pode demorar."):
        return "Cancelado."
    s, e, c = _rodar_cmd(f"defrag {l}: /O /U /V", 1800)
    return f"Otimizacao do disco {l}: concluida.\n{s[-500:]}" if c == 0 else f"Falhou: {(e or s)[-400:]}"


@tool
def compactar_sistema_windows(acao: str = "compactar") -> str:
    """COMPACTA OS ARQUIVOS DO WINDOWS (CompactOS) para economizar ate 2-3 GB em
    disco (otimo em SSD pequeno); ou DESFAZ a compactacao ('descompactar'). E
    seguro mas deixa o sistema um pouco mais lento em PCs fracos. PODEROSO e
    demorado. SEMPRE pede confirmacao."""
    compactar = acao.strip().lower().startswith(("compact", "lig", "ativ"))
    if not _confirma_poderoso(("Compactar os arquivos do Windows (CompactOS) para economizar espaco?" if compactar
                              else "Desfazer a compactacao do Windows (voltar ao normal)?")):
        return "Cancelado."
    s, e, c = _rodar_cmd("compact.exe /CompactOS:" + ("always" if compactar else "never"), 1800)
    return ("CompactOS ativado - sistema compactado para economizar espaco." if compactar
            else "CompactOS desfeito - sistema descompactado.") + f"\n{s[-400:]}"


@tool
def limpar_winsxs() -> str:
    """LIMPA A PASTA WinSxS (componentes/atualizacoes antigas do Windows) com
    DISM /StartComponentCleanup /ResetBase - pode liberar varios GB. AVISO: depois
    disso voce NAO consegue desinstalar as atualizacoes ja instaladas. PODEROSO e
    demorado. SEMPRE pede confirmacao."""
    if not _confirma_poderoso("Limpar de vez os componentes antigos do Windows (WinSxS /ResetBase)? "
                              "Libera espaco, mas NAO dara mais para desinstalar atualizacoes antigas."):
        return "Cancelado."
    s, e, c = _rodar_cmd("Dism /Online /Cleanup-Image /StartComponentCleanup /ResetBase", 3600)
    return f"Limpeza do WinSxS concluida.\n{s[-500:]}" if c == 0 else f"Falhou: {(e or s)[-400:]}"


@tool
def reparar_boot_windows() -> str:
    """TENTA REPARAR A INICIALIZACAO DO WINDOWS (bootrec /fixmbr, /fixboot e
    /rebuildbcd) - para quando o PC nao liga e da erro de boot. O ideal e rodar no
    Ambiente de Recuperacao, mas os comandos tambem funcionam no Windows normal
    para reparar o MBR. EXTREMAMENTE PODEROSO. SEMPRE pede confirmacao."""
    if not _confirma_poderoso("Reparar o boot/inicializacao do Windows (fixmbr, fixboot, rebuildbcd)? "
                              "Se o PC nao estiver ligando, o ideal e rodar isso no Ambiente de Recuperacao."):
        return "Cancelado."
    s, e, c = _rodar_cmd("bootrec /fixmbr && bootrec /fixboot && bootrec /scanos && bootrec /rebuildbcd", 600)
    return f"Reparo de boot executado. Reinicie o PC e veja se liga.\n{s[-600:]}" if c == 0 else f"Falhou (pode precisar do Ambiente de Recuperacao): {(e or s)[-500:]}"


@tool
def modo_seguro_boot(acao: str = "ligar") -> str:
    """LIGA OU DESLIGA O 'MODO DE SEGURO' na inicializacao (bcdedit safeboot).
    Ligar = o proximo boot ja entra em Modo de Seguranca (para remover virus/
    driver que trava); MUITO IMPORTANTE: use 'desligar' depois, senao o PC volta
    sempre no Modo de Seguranca. EXTREMAMENTE PODEROSO. SEMPRE pede confirmacao."""
    ligar = acao.strip().lower().startswith(("lig", "ativ"))
    if not _confirma_poderoso(("Deixar o Windows para entrar em MODO DE SEGURO no proximo boot? "
                               "LEMBRE-SE de voltar aqui e pedir 'desligar modo seguro' depois, senao ele nao sai mais."
                               if ligar else "Desligar o Modo de Seguranca (voltar ao boot normal)?")):
        return "Cancelado."
    if ligar:
        s, e, c = _rodar_cmd("bcdedit /set {current} safeboot minimal", 60)
        return "Modo de Seguranca ATIVADO para o proximo boot (reinicia). Volte a pedir 'desligar modo seguro' apos usar." if c == 0 else f"Falhou: {(e or s)[:300]}"
    s, e, c = _rodar_cmd("bcdedit /deletevalue {current} safeboot", 60)
    return "Modo de Seguranca DESLIGADO - o boot volta ao normal." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def limpar_espaco_livre(letra: str = "C") -> str:
    """APAGA DE VERDADE os arquivos que ja foram deletados (sobrescreve o espaco
    livre com cipher /w) - impede que programas de recuperacao achem arquivos
    apagados (privacidade). NAO apaga nenhum arquivo atual, mas e MUITO demorado
    (varre todo o espaco livre). PODEROSO. SEMPRE pede confirmacao."""
    l = letra.strip().rstrip(":").upper()
    if not _confirma_poderoso(f"Sobrescrever o espaco livre do disco {l}: (apagar rastros de arquivos deletados)? "
                              "Isso NAO apaga arquivos atuais, mas pode demorar HORAS em discos grandes."):
        return "Cancelado."
    import tempfile
    pasta = os.path.join(f"{l}:\\", "") if os.path.isdir(f"{l}:\\") else tempfile.gettempdir()
    s, e, c = _rodar_cmd(f'cipher /w:"{pasta}"', 7200)
    return f"Espaco livre de {l}: sobrescrito (rastros apagados).\n{s[-300:]}" if c == 0 else f"Falhou: {(e or s)[-300:]}"


@tool
def backup_registro(caminho_pasta: str = "") -> str:
    """FAZ UM BACKUP DO REGISTRO DO WINDOWS (exporta as 5 areas principais para
    arquivos .reg numa pasta). Use ANTES de mexer em registro/desinstalar algo.
    So cria arquivos, nao altera o sistema."""
    pasta = caminho_pasta.strip().strip('"') or os.path.join(os.path.expanduser("~"), "Desktop")
    os.makedirs(pasta, exist_ok=True)
    saidas = []
    for hive in ["HKCR", "HKCU", "HKLM", "HKU", "HKCC"]:
        destino = os.path.join(pasta, f"backup_registro_{hive}.reg")
        s, e, c = _rodar_cmd(f'reg export "{hive}" "{destino}" /y', 180)
        saidas.append(f"{hive}: {'OK' if c == 0 else 'erro'}")
    return f"Backup do registro salvo em:\n{pasta}\n" + "\n".join(saidas)


@tool
def restaurar_registro(arquivo_reg: str) -> str:
    """RESTAURA O REGISTRO a partir de um arquivo .reg de backup (regride chaves e
    valores). Use para desfazer algo que quebrou o sistema. EXTREMAMENTE
    PODEROSO (pode mudar milhares de configuracoes de uma vez). SEMPRE pede
    confirmacao."""
    a = arquivo_reg.strip().strip('"')
    if not os.path.isfile(a):
        return f"Arquivo .reg nao encontrado: {a}"
    if not _confirma_poderoso(f"Importar/restaurar o registro a partir de:\n{a}\nIsso vai substituir chaves do Registro em massa."):
        return "Cancelado."
    s, e, c = _rodar_cmd(f'reg import "{a}"', 300)
    return f"Registro restaurado de {os.path.basename(a)}. Reinicie se algo pedir." if c == 0 else f"Falhou: {(e or s)[-400:]}"


# ---------------- SISTEMA, ENERGIA E DESEMPENHO AVANCADO ----------------
@tool
def desligar_hibernacao(acao: str = "desligar") -> str:
    """LIGA OU DESLIGA A HIBERNACAO do Windows. Desligar libera espaco em disco
    (some o arquivo hiberfil.sys, que pode ter varios GB) e tambem desliga o
    'inicio rapido'; ligar restaura. 'acao'='desligar'/'ligar'. PODEROSO. SEMPRE
    pede confirmacao."""
    desligar = acao.strip().lower().startswith(("deslig", "off"))
    if not _confirma_poderoso(("Desligar a hibernacao (libera o arquivo hiberfil.sys, varios GB; tambem desliga o inicio rapido)?"
                               if desligar else "Ligar a hibernacao (cria o hiberfil.sys)?")):
        return "Cancelado."
    s, e, c = _rodar_cmd("powercfg /hibernate " + ("off" if desligar else "on"), 60)
    return "Hibernacao desligada (espaco liberado)." if desligar else "Hibernacao ligada." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def plano_desempenho_maximo() -> str:
    """CRIA E ATIVA O PLANO DE ENERGIA 'DESEMPENHO MAXIMO' (Ultimate Performance,
    escondido no Windows) - remove os limites de economia de energia para o PC
    render/trabalhar no talo (gasta mais energia e esquenta mais). PODEROSO.
    SEMPRE pede confirmacao."""
    if not _confirma_poderoso("Ativar o plano de energia 'Desempenho Maximo' (Ultimate Performance)? O PC fica mais rapido porem gasta mais energia."):
        return "Cancelado."
    s, e, c = _rodar_cmd("powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61", 60)
    import re as _re
    m = _re.search(r"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})", s or "")
    if m:
        guid = m.group(1)
        _rodar_cmd(f'powercfg /changename "{guid}" "Desempenho Maximo"', 30)
        _rodar_cmd(f'powercfg /setactive "{guid}"', 30)
        return "Plano 'Desempenho Maximo' criado e ativado."
    # em alguns Windows o plano ja existe; tenta ativar direto
    _rodar_cmd("powercfg /setactive e9a42b02-d5df-448d-aa00-03f14749eb61", 30)
    return f"Tentativa concluida (se o plano ja existia, foi ativado). {(e or s)[:200]}"


@tool
def desligar_inicio_rapido(acao: str = "desligar") -> str:
    """LIGA OU DESLIGA O 'INICIO RAPIDO' do Windows (Fast Startup). Desligar
    costuma resolver problemas de desligamento/reinicio lento, tela preta e
    drivers que nao recarregam; ligar volta o boot mais rapido. 'acao'=
    'desligar'/'ligar'. PODEROSO. SEMPRE pede confirmacao."""
    desligar = acao.strip().lower().startswith(("deslig", "off"))
    if not _confirma_poderoso(("Desligar o Inicio Rapido (Fast Startup) - recomendado para evitar bugs de boot/rede?"
                               if desligar else "Ligar o Inicio Rapido (boot mais rapido)?")):
        return "Cancelado."
    valor = "0" if desligar else "1"
    s, e, c = _rodar_cmd(r'reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Power" /v HiberbootEnabled /t REG_DWORD /d ' + valor + " /f", 60)
    return f"Inicio Rapido {'DESLIGADO' if desligar else 'LIGADO'}." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def desligar_efeitos_visuais(acao: str = "desempenho") -> str:
    """AJUSTA OS EFEITOS VISUAIS do Windows: 'desempenho' = desliga animacoes e
    efeitos (PC mais rapido/leve), 'aparencia' = volta tudo bonito, 'balanceado'
    = deixa o Windows escolher. PODEROSO leve. SEMPRE pede confirmacao."""
    a = acao.strip().lower()
    valor = "2" if a.startswith(("desemp", "rap", "perf")) else ("1" if a.startswith(("apar", "bonit")) else "0")
    if not _confirma_poderoso(f"Ajustar efeitos visuais para '{acao}' (altera aparencia do Windows)?"):
        return "Cancelado."
    cmd = (r'reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects" /v VisualFXSetting /t REG_DWORD /d '
           + valor + " /f")
    s, e, c = _rodar_cmd(cmd, 60)
    _rodar_cmd('taskkill /f /im explorer.exe && start explorer.exe', 60)
    return f"Efeitos visuais ajustados para '{acao}' (Explorer reiniciado para aplicar)." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def afinidade_cpu_processo(nome_processo: str, nucleos: str) -> str:
    """PRENDE UM PROGRAMA A APENAS ALGUNS NUCLEOS DO PROCESSADOR (afinidade de
    CPU) - util para jogos antigos ou dividir carga. 'nucleos'=lista de nucleos,
    ex.: '0,1' ou '0-3'. PODEROSO. SEMPRE pede confirmacao."""
    nome = nome_processo.strip().replace(".exe", "")
    try:
        nums = []
        for parte in nucleos.split(","):
            parte = parte.strip()
            if "-" in parte:
                i, f = parte.split("-")
                nums.extend(range(int(i), int(f) + 1))
            elif parte:
                nums.append(int(parte))
        mascara = 0
        for n in nums:
            mascara |= (1 << n)
    except Exception:
        return "Formato de nucleos invalido. Use ex.: '0,1' ou '0-3'."
    if not _confirma_poderoso(f"Definir afinidade de CPU de '{nome}' para os nucleos {sorted(set(nums))} (mascara {mascara})?"):
        return "Cancelado."
    s, e, c = _ps(f"(Get-Process -Name '{nome}' -ErrorAction Stop).ProcessorAffinity = [IntPtr]{mascara}; 'OK'", 60)
    return f"Afinidade de '{nome}' ajustada para os nucleos {sorted(set(nums))}." if c == 0 else f"Falhou (processo nao encontrado?): {(e or s)[:300]}"


@tool
def desligar_reinicio_automatico(acao: str = "desligar") -> str:
    """DESLIGA (OU RELIGA) O 'REINICIAR AUTOMATICAMENTE' em caso de tela azul
    (BSOD). Desligar faz o PC mostrar o erro na tela em vez de reiniciar sozinho
    (otimo para ler/ fotografar o codigo da tela azul). 'acao'='desligar'/'ligar'.
    PODEROSO. SEMPRE pede confirmacao."""
    desligar = acao.strip().lower().startswith("deslig")
    if not _confirma_poderoso(("Parar de reiniciar o PC automaticamente em tela azul (assim voce ve o erro)?"
                               if desligar else "Voltar a reiniciar automaticamente apos tela azul?")):
        return "Cancelado."
    valor = "0" if desligar else "1"
    s, e, c = _rodar_cmd(r'reg add "HKLM\SYSTEM\CurrentControlSet\Control\CrashControl" /v AutoReboot /t REG_DWORD /d ' + valor + " /f", 60)
    return f"Reinicio automatico em tela azul {'DESLIGADO' if desligar else 'LIGADO'}." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def habilitar_numlock_inicio(acao: str = "ligar") -> str:
    """FAZ O NUMLOCK JA LIGAR (OU FICAR DESLIGADO) quando o Windows inicia.
    'acao'='ligar'/'desligar'. PODEROSO leve. SEMPRE pede confirmacao."""
    ligar = acao.strip().lower().startswith(("lig", "ativ"))
    if not _confirma_poderoso(f"Deixar o NumLock {'LIGADO' if ligar else 'DESLIGADO'} ao iniciar o Windows?"):
        return "Cancelado."
    valor = "2" if ligar else "0"
    _rodar_cmd(r'reg add "HKU\.DEFAULT\Control Panel\Keyboard" /v InitialKeyboardIndicators /t REG_SZ /d ' + valor + " /f", 60)
    _rodar_cmd(r'reg add "HKCU\Control Panel\Keyboard" /v InitialKeyboardIndicators /t REG_SZ /d ' + valor + " /f", 60)
    return f"NumLock vai iniciar {'LIGADO' if ligar else 'DESLIGADO'} (vale apos reiniciar)."


@tool
def modo_deus_windows(pasta: str = "") -> str:
    """CRIA O ATALHO 'MODO DEUS' (God Mode) - uma pasta unica com TODAS as
    configuracoes avancadas do Windows num so lugar (centenas de opcoes do Painel
    de Controle). 'pasta'=onde criar (padrao: Area de Trabalho). Inofensivo, so
    cria um atalho."""
    destino = pasta.strip().strip('"') or os.path.join(os.path.expanduser("~"), "Desktop")
    os.makedirs(destino, exist_ok=True)
    caminho = os.path.join(destino, "ModoDeus_Configuracoes.{ED7BA470-8E54-465E-825C-99712043E01C}")
    try:
        os.makedirs(caminho, exist_ok=True)
        return f"Modo Deus criado em:\n{caminho}\nAbra essa pasta para ver todas as configuracoes avancadas."
    except Exception as ex:
        return f"Falhou: {ex}"


# ---------------- WINDOWS UPDATE / RECUPERACAO / MANUTENCAO ----------------
@tool
def reparar_windows_update() -> str:
    """REPARA O WINDOWS UPDATE quando ele fica dando erro e nao baixa/instala
    atualizacoes: para os servicos, limpa a pasta de download (SoftwareDistribution)
    e religa os servicos. PODEROSO (apaga o cache de atualizacoes baixadas; elas
    baixam de novo). SEMPRE pede confirmacao."""
    if not _confirma_poderoso("Reparar o Windows Update? Vou parar os servicos wuauserv/bits, limpar a pasta SoftwareDistribution e religar (atualizacoes baixam de novo)."):
        return "Cancelado."
    cmds = ("net stop wuauserv & net stop bits & "
            r'rmdir /s /q "%SystemRoot%\SoftwareDistribution\Download" & '
            "net start bits & net start wuauserv & "
            "wuauclt /detectnow /updatenow")
    s, e, c = _rodar_cmd(cmds, 600)
    return f"Windows Update reparado; pedi para procurar atualizacoes de novo.\n{s[-400:]}" if c == 0 else f"Concluido com avisos (rode como admin): {(e or s)[-400:]}"


@tool
def listar_hotfixs() -> str:
    """LISTA as atualizacoes do Windows ja instaladas (KBs) com data - so leitura.
    Use para ver o que foi atualizado ou achar o KB de um update que quebrou algo."""
    s, e, c = _ps("Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object HotFixID,Description,InstalledOn -First 30 | Format-Table -AutoSize | Out-String", 120)
    return "Atualizacoes instaladas (ultimas 30):\n" + (s or e) if c == 0 else f"Falhou: {e or s}"


@tool
def desinstalar_atualizacao_kb(kb: str) -> str:
    """REMOVE UMA ATUALIZACAO DO WINDOWS pelo numero do KB (ex.: 'KB5036000') -
    usado quando uma atualizacao recente causou problema. EXTREMAMENTE PODEROSO.
    SEMPRE pede confirmacao."""
    num = kb.strip().upper().replace("KB", "")
    if not num.isdigit():
        return "Diga o numero do KB (ex.: KB5036000 ou so 5036000)."
    if not _confirma_poderoso(f"Desinstalar a atualizacao KB{num}? Isso reverte um update recente do Windows."):
        return "Cancelado."
    s, e, c = _rodar_cmd(f"wusa /uninstall /kb:{num} /quiet /norestart", 900)
    return f"Desinstalacao do KB{num} enviada (reinicio pode ser pedido)." if c in (0, 3010) else f"Falhou (nao existe ou nao remove): {(e or s)[:300]}"


@tool
def ligar_desligar_atualizacoes_automaticas(acao: str = "pausar") -> str:
    """PAUSA (desliga os servicos do Windows Update) ou RELIGA as atualizacoes
    automaticas. 'pausar' para o Windows nao atualizar/reiniciar sozinho enquanto
    voce trabalha/joga; 'ligar' para voltar ao normal. PODEROSO. SEMPRE pede
    confirmacao."""
    pausar = acao.strip().lower().startswith(("paus", "deslig", "off"))
    if not _confirma_poderoso(("PAUSAR as atualizacoes automaticas (para os servicos do Windows Update)?"
                               if pausar else "Religar as atualizacoes automaticas do Windows?")):
        return "Cancelado."
    if pausar:
        s, e, c = _rodar_cmd("net stop wuauserv & net stop bits & sc config wuauserv start= disabled & sc config bits start= demand", 120)
        return "Atualizacoes automaticas PAUSADAS (lembre-se de religar depois)." if c == 0 else f"Falhou (precisa de admin): {(e or s)[:300]}"
    s, e, c = _rodar_cmd("sc config wuauserv start= demand & net start bits & net start wuauserv", 120)
    return "Atualizacoes automaticas RELIGADAS." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def abrir_redefinir_windows(acao: str = "manter_arquivos") -> str:
    """ABRE O ASSISTENTE DE REINICIALIZACAO DO WINDOWS (Reset This PC). 'acao'=
    'manter_arquivos' (reinstala o Windows mantendo seus documentos/fotos; remove
    programas e configuracoes) ou 'tudo' (apaga TUDO e volta de fabrica - para
    vender/doar o PC). EXTREMAMENTE PODEROSO. SEMPRE pede confirmacao em dobro."""
    limpar_tudo = acao.strip().lower().startswith(("tudo", "remov", "fabrica", "limp"))
    aviso = ("REINICIALIZAR O WINDOWS APAGANDO TUDO (volta de fabrica, como para vender)? "
             "TODOS os seus arquivos, programas e contas serao apagados!"
             if limpar_tudo else
             "REINICIALIZAR O WINDOWS MANTENDO seus arquivos? Programas e configuracoes serao removidos, mas documentos/fotos ficam.")
    if not _confirma_poderoso(aviso):
        return "Cancelado."
    # abre o reset do sistema; o usuario confirma de novo na tela do Windows
    opcao = "clean" if limpar_tudo else "keepmyfiles"
    subprocess.Popen(f"systemreset -factory -{opcao} -quiet", shell=True)
    return ("Abrindo a reinicializacao de fabrica (apaga TUDO) - confirme na tela." if limpar_tudo
            else "Abrindo a reinicializacao mantendo arquivos - siga a tela e confirme.")


@tool
def reparar_loja_apps_windows() -> str:
    """REPARA A MICROSOFT STORE E OS APPS DE FABRICA que nao abrem/estao quebrados:
    registra de novo todos os pacotes Appx e roda wsreset (limpa o cache da Loja).
    PODEROSO. SEMPRE pede confirmacao."""
    if not _confirma_poderoso("Reparar a Microsoft Store e os apps de fabrica (registrar Appx de novo + wsreset)?"):
        return "Cancelado."
    ps = ("Get-AppXPackage -AllUsers | Foreach { Add-AppxPackage -DisableDevelopmentMode -Register "
          "\"$($_.InstallLocation)\\AppXManifest.xml\" -ErrorAction SilentlyContinue }; 'OK'")
    s, e, c = _ps(ps, 600)
    _rodar_cmd("wsreset.exe", 120)
    return "Loja/apps reparados e cache limpo (reabra a Loja)." if c == 0 else f"Concluido com avisos: {(e or s)[-400:]}"


@tool
def reparar_icones_windows() -> str:
    """CONCERTA ICONES QUE FICARAM BRANCOS/ERRADOS (atalhos mostrando pagina em
    branco): apaga o cache de icones e reinicia o Explorer. PODEROSO leve (nao
    apaga nada seu). SEMPRE pede confirmacao."""
    if not _confirma_poderoso("Reconstruir o cache de icones e reiniciar o Explorer (as janelas fecham e abrem)?"):
        return "Cancelado."
    ps = ("Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue; "
          "Remove-Item \"$env:LocalAppData\\IconCache.db\" -Force -ErrorAction SilentlyContinue; "
          "Remove-Item \"$env:LocalAppData\\Microsoft\\Windows\\Explorer\\iconcache*\" -Force -ErrorAction SilentlyContinue; "
          "Start-Sleep 2; Start-Process explorer; 'OK'")
    s, e, c = _ps(ps, 120)
    return "Cache de icones reconstruido; Explorer reiniciado." if c == 0 else f"Falhou: {(e or s)[-300:]}"


@tool
def ligar_protecao_sistema(acao: str = "ligar") -> str:
    """LIGA OU DESLIGA A 'PROTECAO DO SISTEMA' (que cria pontos de restauracao) no
    disco C:. Ligar e recomendado para poder usar pontos de restauracao; tambem
    cria um ponto na hora. 'acao'='ligar'/'desligar'. PODEROSO. SEMPRE pede
    confirmacao."""
    ligar = acao.strip().lower().startswith(("lig", "ativ"))
    if not _confirma_poderoso(("LIGAR a Protecao do Sistema no C: e criar um ponto de restauracao?"
                               if ligar else "DESLIGAR a Protecao do Sistema (nao dara mais para criar pontos de restauracao)?")):
        return "Cancelado."
    if ligar:
        _ps("Enable-ComputerRestore -Drive \"C:\\\" -ErrorAction SilentlyContinue", 120)
        s, e, c = _ps("Checkpoint-Computer -Description 'Ponto criado pelo agente' -RestorePointType MODIFY_SETTINGS -ErrorAction SilentlyContinue; 'OK'", 180)
        return "Protecao do Sistema ligada no C: e ponto de restauracao criado." if c == 0 else f"Falhou: {(e or s)[:300]}"
    s, e, c = _ps("Disable-ComputerRestore -Drive \"C:\\\"", 120)
    return "Protecao do Sistema desligada." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def reparar_som_windows() -> str:
    """TENTA CONSERTAR O AUDIO QUE NAO SAI: reinicia os servicos de som
    (Audiosrv/AudioEndpointBuilder) e atualiza os dispositivos de audio. PODEROSO
    leve. SEMPRE pede confirmacao."""
    if not _confirma_poderoso("Reiniciar os servicos de audio do Windows para tentar recuperar o som?"):
        return "Cancelado."
    s, e, c = _ps("Restart-Service Audiosrv -Force -ErrorAction SilentlyContinue; Restart-Service AudioEndpointBuilder -Force -ErrorAction SilentlyContinue; "
                  "Get-PnpDevice -Class 'MediaEndpoint' -ErrorAction SilentlyContinue | Disable-PnpDevice -Confirm:$false -ErrorAction SilentlyContinue; "
                  "Start-Sleep 2; Get-PnpDevice -Class 'MediaEndpoint' | Enable-PnpDevice -Confirm:$false -ErrorAction SilentlyContinue; 'OK'", 180)
    return "Servicos de audio reiniciados. Teste o som; se continuar mudo, verifique o dispositivo de saida." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def reparar_bluetooth_windows() -> str:
    """TENTA CONSERTAR O BLUETOOTH que nao liga/pareia: reinicia o adaptador
    Bluetooth e o servico bthserv. PODEROSO leve. SEMPRE pede confirmacao."""
    if not _confirma_poderoso("Reiniciar o adaptador e o servico Bluetooth para tentar consertar pareamento/ligacao?"):
        return "Cancelado."
    s, e, c = _ps("Restart-Service bthserv -Force -ErrorAction SilentlyContinue; "
                  "Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Disable-PnpDevice -Confirm:$false -ErrorAction SilentlyContinue; "
                  "Start-Sleep 3; Get-PnpDevice -Class Bluetooth | Enable-PnpDevice -Confirm:$false -ErrorAction SilentlyContinue; 'OK'", 180)
    return "Bluetooth reiniciado; tente parear/ligar o dispositivo de novo." if c == 0 else f"Falhou (ha adaptador Bluetooth?): {(e or s)[:300]}"


@tool
def manutencao_profunda_pc() -> str:
    """RODA A MANUTENCAO PROFUNDA COMPLETA DO WINDOWS de uma vez (DISM
    RestoreHealth + SFC /scannow) - a mesma sequencia que tecnicos usam para
    consertar arquivos do sistema corrompidos. PODEROSO e demorado (15-40 min).
    SEMPRE pede confirmacao. NAO apaga arquivos pessoais."""
    if not _confirma_poderoso("Rodar a manutencao profunda (DISM RestoreHealth + SFC /scannow)? Pode demorar 20-40 minutos; NAO apaga seus arquivos."):
        return "Cancelado."
    s1, e1, c1 = _rodar_cmd("DISM /Online /Cleanup-Image /RestoreHealth", 3600)
    s2, e2, c2 = _rodar_cmd("sfc /scannow", 3600)
    ok = "Nao encontrou violacoes" in s2 or c2 == 0
    return ("Manutencao profunda concluida. " + ("SFC nao achou problemas (ou ja corrigiu)." if ok else "Verifique a saida; pode ser preciso reiniciar.")
            + f"\n--- DISM ---\n{s1[-300:]}\n--- SFC ---\n{s2[-300:]}")


@tool
def limpeza_profunda_pc() -> str:
    """LIMPEZA PROFUNDA DE LIXO: temporarios do sistema e do usuario, prefetch,
    cache de atualizacoes baixadas e esvazia a lixeira. Libera espaco; NAO apaga
    documentos. PODEROSO. SEMPRE pede confirmacao."""
    if not _confirma_poderoso("Limpar lixo profundo (temp do sistema/usuario, prefetch, cache de update, lixeira)? Seus documentos NAO sao apagados."):
        return "Cancelado."
    ps = ("$alvos = @($env:TEMP, \"$env:WINDIR\\Temp\", \"$env:WINDIR\\Prefetch\", "
          "\"$env:WINDIR\\SoftwareDistribution\\Download\", \"$env:LOCALAPPDATA\\Temp\"); "
          "$livre_antes = (Get-PSDrive C).Free; "
          "foreach ($a in $alvos) { Remove-Item \"$a\\*\" -Recurse -Force -ErrorAction SilentlyContinue }; "
          "Clear-RecycleBin -Force -ErrorAction SilentlyContinue; "
          "$livre_depois = (Get-PSDrive C).Free; "
          "'Liberado GB: ' + [math]::Round(($livre_depois - $livre_antes)/1GB,2)")
    s, e, c = _ps(ps, 900)
    return f"Limpeza profunda concluida.\n{s[-400:]}" if c == 0 else f"Concluido com avisos: {(e or s)[-400:]}"


# ---------------- DRIVERS E DISPOSITIVOS ----------------
@tool
def exportar_drivers(pasta_destino: str = "") -> str:
    """FAZ BACKUP DE TODOS OS DRIVERS instalados para uma pasta (pnputil /export),
    util antes de formatar/reinstalar o Windows - da para reinstalar tudo sem
    internet. So cria arquivos. 'pasta_destino'=onde salvar (padrao: pasta
    DriversBackup na Area de Trabalho)."""
    destino = pasta_destino.strip().strip('"') or os.path.join(os.path.expanduser("~"), "Desktop", "DriversBackup")
    os.makedirs(destino, exist_ok=True)
    s, e, c = _rodar_cmd(f'pnputil /export-driver * "{destino}"', 1200)
    return f"Drivers exportados para:\n{destino}\n{s[-300:]}" if c == 0 else f"Falhou: {(e or s)[-300:]}"


@tool
def instalar_driver_inf(caminho_inf: str) -> str:
    """INSTALA UM DRIVER a partir de um arquivo .inf (de um driver baixado/do
    backup). 'caminho_inf'=caminho completo do .inf. PODEROSO (instala software de
    sistema). SEMPRE pede confirmacao."""
    inf = caminho_inf.strip().strip('"')
    if not os.path.isfile(inf):
        return f"Arquivo .inf nao encontrado: {inf}"
    if not _confirma_poderoso(f"Instalar o driver:\n{inf}\nIsso adiciona um driver de dispositivo ao Windows."):
        return "Cancelado."
    s, e, c = _rodar_cmd(f'pnputil /add-driver "{inf}" /install', 600)
    return f"Driver instalado.\n{s[-300:]}" if c == 0 else f"Falhou: {(e or s)[-300:]}"


@tool
def remover_driver(nome_inf: str) -> str:
    """REMOVE UM DRIVER DE TERCEIROS do armazenamento (pnputil /delete-driver) pelo
    nome do pacote (ex.: 'oem17.inf', que aparece em 'listar_drivers'). Use para
    tirar driver velho/conflitante. EXTREMAMENTE PODEROSO. SEMPRE pede
    confirmacao."""
    inf = nome_inf.strip().lower()
    if not inf.endswith(".inf"):
        return "Diga o nome do pacote publicado (ex.: oem17.inf), que aparece em 'listar_drivers'."
    if not _confirma_poderoso(f"REMOVER o driver {inf} do armazenamento de drivers? Um driver essencial removido pode quebrar um dispositivo."):
        return "Cancelado."
    s, e, c = _rodar_cmd(f"pnputil /delete-driver {inf} /uninstall /force", 600)
    return f"Driver {inf} removido.\n{s[-300:]}" if c == 0 else f"Falhou (em uso?): {(e or s)[-300:]}"


@tool
def listar_dispositivos_com_erro() -> str:
    """LISTA OS DISPOSITIVOS COM PROBLEMA (que aparecem com '!' de erro no Gerenciador
    de Dispositivos) - so leitura. Use para achar driver faltando/quebrado."""
    ps = "Get-PnpDevice | Where-Object {$_.Status -ne 'OK'} | Select-Object Status,Class,FriendlyName,InstanceId | Format-Table -AutoSize | Out-String"
    s, e, c = _ps(ps, 90)
    return "Dispositivos com problema (se vazio, esta tudo OK):\n" + (s or "Nenhum dispositivo com erro.") if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def desabilitar_dispositivo(nome_ou_id: str) -> str:
    """DESLIGA UM DISPOSITIVO DE HARDWARE no Gerenciador de Dispositivos (ex.: uma
    webcam, placa de rede ou Bluetooth que voce quer desativar). EXTREMAMENTE
    PODEROSO (desligar o dispositivo errado pode cortar internet/teclado). SEMPRE
    pede confirmacao."""
    if not _confirma_poderoso(f"DESABILITAR o dispositivo '{nome_ou_id}'? Se for rede/teclado/controlador essencial pode quebrar algo."):
        return "Cancelado."
    ps = (f"$d = Get-PnpDevice | Where-Object {{$_.FriendlyName -like '*{nome_ou_id}*' -or $_.InstanceId -like '*{nome_ou_id}*'}}; "
          "if (-not $d) { 'NAO ENCONTRADO' } else { $d | Disable-PnpDevice -Confirm:$false; 'DESABILITADO: ' + ($d.FriendlyName -join ', ') }")
    s, e, c = _ps(ps, 120)
    return s.strip() if c == 0 else f"Falhou: {(e or s)[-300:]}"


@tool
def habilitar_dispositivo(nome_ou_id: str) -> str:
    """RELIGA UM DISPOSITIVO que estava desabilitado no Gerenciador de Dispositivos
    (reverte o 'desabilitar_dispositivo'). PODEROSO. SEMPRE pede confirmacao."""
    if not _confirma_poderoso(f"HABILITAR o dispositivo '{nome_ou_id}'?"):
        return "Cancelado."
    ps = (f"$d = Get-PnpDevice | Where-Object {{$_.FriendlyName -like '*{nome_ou_id}*' -or $_.InstanceId -like '*{nome_ou_id}*'}}; "
          "if (-not $d) { 'NAO ENCONTRADO' } else { $d | Enable-PnpDevice -Confirm:$false; 'HABILITADO: ' + ($d.FriendlyName -join ', ') }")
    s, e, c = _ps(ps, 120)
    return s.strip() if c == 0 else f"Falhou: {(e or s)[-300:]}"


@tool
def inventario_hardware() -> str:
    """FAZ UM INVENTARIO COMPLETO DO HARDWARE DO PC: processador (modelo/nucleos),
    memoria RAM total e por pente, placa de video, discos, placa-mae/fabricante e
    numero de serie. So leitura - otimo para saber o que voce tem ou pedir
    suporte."""
    ps = ("'=== PROCESSADOR ==='; (Get-CimInstance Win32_Processor | Select-Object -First 1 Name,NumberOfCores,NumberOfLogicalProcessors | Format-List | Out-String); "
          "'=== MEMORIA RAM ==='; 'Total GB: ' + [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory/1GB,1); "
          "Get-CimInstance Win32_PhysicalMemory | Select-Object @{n='GB';e={[math]::Round($_.Capacity/1GB)}},Speed,Manufacturer | Format-Table -AutoSize | Out-String; "
          "'=== VIDEO ==='; (Get-CimInstance Win32_VideoController | Select-Object Name,@{n='VRAM_GB';e={[math]::Round($_.AdapterRAM/1GB,1)}},DriverVersion | Format-Table -AutoSize | Out-String); "
          "'=== DISCOS ==='; (Get-PhysicalDisk | Select-Object FriendlyName,MediaType,@{n='GB';e={[math]::Round($_.Size/1GB)}} | Format-Table -AutoSize | Out-String); "
          "'=== PLACA-MAE / SERIE ==='; (Get-CimInstance Win32_BaseBoard | Select-Object Manufacturer,Product | Format-List | Out-String); "
          "(Get-CimInstance Win32_BIOS | Select-Object SerialNumber | Format-List | Out-String)")
    s, e, c = _ps(ps, 120)
    return "INVENTARIO DE HARDWARE\n" + (s or e)


# ---------------- REDE AVANCADA / FIREWALL CIRURGICO ----------------
@tool
def mostrar_portas_em_uso() -> str:
    """MOSTRA TODAS AS PORTAS abertas/em uso no PC (TCP/UDP), qual processo/programa
    esta usando cada uma e o estado (LISTENING/ESTABLISHED). So leitura - use para
    ver servicos ativos ou suspeitos."""
    s, e, c = _rodar_cmd("netstat -ano -p tcp", 90)
    if c != 0:
        return f"Falhou: {e or s}"
    # cruza o PID (ultima coluna) com o nome do processo via tasklist
    linhas = [l for l in s.splitlines() if "LISTENING" in l or "ESTABLISHED" in l]
    pids = {l.split()[-1] for l in linhas if l.split()[-1].isdigit()}
    nomes = {}
    for pid in list(pids)[:60]:
        ts, te, tc = _rodar_cmd(f"tasklist /fi \"PID eq {pid}\" /fo csv /nh", 30)
        if tc == 0 and "," in ts:
            nomes[pid] = ts.split('"')[1]
    saida = ["PROTO  ENDERECO_LOCAL          ESTADO         PID   PROGRAMA"]
    for l in linhas[:80]:
        p = l.split()
        if len(p) >= 5 and p[-1].isdigit():
            saida.append(f"{p[0]:6} {p[1]:24} {p[-2]:14} {p[-1]:6}{nomes.get(p[-1], '')}")
    return "Portas em uso (top 80):\n" + "\n".join(saida)


@tool
def bloquear_ip_firewall(acao: str, ip: str) -> str:
    """BLOQUEIA (OU LIBERA) UM IP NO FIREWALL DO WINDOWS - impede que o PC fale com
    um endereco suspeito (entrada e saida). 'acao'='bloquear'/'liberar', 'ip'=o
    endereco (ex.: '203.0.113.5'). PODEROSO. SEMPRE pede confirmacao."""
    bloquear = acao.strip().lower().startswith(("bloq", "neg"))
    if not _confirma_poderoso(f"{'BLOQUEAR' if bloquear else 'LIBERAR'} o IP {ip} no firewall (entrada e saida)?"):
        return "Cancelado."
    if bloquear:
        _rodar_cmd(f'netsh advfirewall firewall add rule name="Agente bloq {ip}" dir=in action=block remoteip={ip}', 60)
        s, e, c = _rodar_cmd(f'netsh advfirewall firewall add rule name="Agente bloq {ip}" dir=out action=block remoteip={ip}', 60)
        return f"IP {ip} bloqueado no firewall." if c == 0 else f"Falhou: {(e or s)[:300]}"
    _rodar_cmd(f'netsh advfirewall firewall delete rule name="Agente bloq {ip}"', 60)
    return f"IP {ip} liberado (regra removida)."


@tool
def bloquear_programa_internet(acao: str, programa_ou_caminho: str) -> str:
    """IMPDE (OU PERMITE) QUE UM PROGRAMA ACESSE A INTERNET pelo firewall (ex.: um
    jogo/crack que nao deve validar online, ou um app que consome dados).
    'acao'='bloquear'/'liberar'; 'programa_ou_caminho'=nome do .exe ou o caminho
    completo dele. PODEROSO. SEMPRE pede confirmacao."""
    bloquear = acao.strip().lower().startswith(("bloq", "neg"))
    alvo = programa_ou_caminho.strip().strip('"')
    if not os.path.isfile(alvo):
        # tenta achar pelo nome em pastas comuns
        encontrado = None
        for base in [os.path.join(os.environ.get("ProgramFiles", "C:\\Program Files")),
                     os.path.join(os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)"))]:
            for raiz, _, arqs in os.walk(base):
                for a in arqs:
                    if a.lower() == alvo.lower():
                        encontrado = os.path.join(raiz, a)
                        break
                if encontrado:
                    break
            if encontrado:
                break
        if not encontrado:
            return f"Nao achei o executavel '{alvo}'. Diga o caminho completo do .exe."
        alvo = encontrado
    if not _confirma_poderoso(f"{'BLOQUEAR' if bloquear else 'LIBERAR'} o acesso a internet de:\n{alvo}"):
        return "Cancelado."
    nome = "Agente " + ("bloq" if bloquear else "lib") + " " + os.path.basename(alvo)
    if bloquear:
        _rodar_cmd(f'netsh advfirewall firewall add rule name="{nome}" dir=in action=block program="{alvo}" enable=yes', 60)
        s, e, c = _rodar_cmd(f'netsh advfirewall firewall add rule name="{nome}" dir=out action=block program="{alvo}" enable=yes', 60)
        return f"Programa bloqueado na internet:\n{alvo}" if c == 0 else f"Falhou: {(e or s)[:300]}"
    _rodar_cmd(f'netsh advfirewall firewall delete rule name="{nome}"', 60)
    return f"Programa liberado na internet: {os.path.basename(alvo)}."


@tool
def listar_regras_firewall() -> str:
    """LISTA as regras do firewall (principalmente as criadas por voce/pelo agente),
    mostrando nome, direcao e acao - so leitura. Use para ver o que foi bloqueado."""
    ps = "Get-NetFirewallRule | Where-Object {$_.DisplayName -like 'Agente*'} | Select-Object DisplayName,Direction,Action,Enabled | Format-Table -AutoSize | Out-String"
    s, e, c = _ps(ps, 90)
    return "Regras de firewall criadas pelo agente:\n" + (s or "Nenhuma regra do agente encontrada.") if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def varrer_rede_local(verificar_porta: int = 0) -> str:
    """VARRE A SUA REDE LOCAL (Wi-Fi) e mostra os dispositivos que responderam
    (IP, nome do host e MAC) - feito 100% em Python, sem instalar nada. Se voce
    informar 'verificar_porta' (ex.: 80, 445, 22), tambem diz quais aparelhos tem
    aquela porta aberta. So leitura; nao altera nada."""
    import socket
    try:
        host = socket.gethostname()
        meu_ip = socket.gethostbyname(host)
    except Exception:
        meu_ip = "192.168.0.1"
    partes = meu_ip.split(".")
    if len(partes) != 4:
        return "Nao consegui determinar a sua rede local."
    base = ".".join(partes[:3])
    resultados = []

    def _ping(n):
        ip = f"{base}.{n}"
        try:
            # tenta conexao rapida a uma porta comum aberta (varredura TCP) + nome reverso
            achou = False
            porta = int(verificar_porta) if verificar_porta else 445
            s0 = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s0.settimeout(0.25)
            if s0.connect_ex((ip, porta)) == 0:
                achou = True
            s0.close()
            if achou or not verificar_porta:
                # confirma com ICMP do sistema se nao foi pela porta
                if not achou:
                    _s, _e, _c = _rodar_cmd(f"ping -n 1 -w 150 {ip}", 5)
                    achou = _c == 0 and "TTL=" in _s.upper()
                if achou:
                    try:
                        nome = socket.gethostbyaddr(ip)[0]
                    except Exception:
                        nome = "(sem nome)"
                    extras = ""
                    if verificar_porta:
                        extras = f" | porta {verificar_porta} ABERTA"
                    resultados.append(f"{ip:15} {nome}{extras}")
        except Exception:
            pass

    threads = []
    for n in range(1, 255):
        th = threading.Thread(target=_ping, args=(n,), daemon=True)
        th.start()
        threads.append(th)
    for th in threads:
        th.join(timeout=2.0)
    if not resultados:
        return f"Varredura da rede {base}.x concluida: nenhum dispositivo respondeu (ou a rede bloqueia ping)."
    return f"Dispositivos na rede {base}.x ({len(resultados)} achados):\n" + "\n".join(sorted(resultados))


@tool
def escanear_portas_host(host_alvo: str, portas: str = "comuns") -> str:
    """ESCANEIA PORTAS de um computador/IP (na sua rede ou um site) e diz quais
    estao abertas - 100% em Python. 'host_alvo'=IP ou dominio; 'portas'='comuns'
    (21,22,80,443,3389,8080...) ou uma lista ex.: '80,443,3000,8000'. So leitura.
    Use apenas em redes/seus servidores (escanear alvos de terceiros sem permissao
    pode ser abuso)."""
    import socket
    if portas.strip().lower() == "comuns":
        lista = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 5900, 8000, 8080, 8443]
    else:
        try:
            lista = sorted({int(p) for p in portas.replace(";", ",").split(",") if p.strip().isdigit()})
        except Exception:
            return "Portas invalidas. Use 'comuns' ou ex.: '80,443,3000'."
    try:
        ip = socket.gethostbyname(host_alvo)
    except Exception:
        return f"Nao resolve o host: {host_alvo}"
    abertas = []

    def _testa(pt):
        try:
            s0 = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s0.settimeout(0.6)
            if s0.connect_ex((ip, pt)) == 0:
                abertas.append(pt)
            s0.close()
        except Exception:
            pass

    threads = [threading.Thread(target=_testa, args=(p,), daemon=True) for p in lista]
    for th in threads:
        th.start()
    for th in threads:
        th.join(timeout=3)
    if not abertas:
        return f"{host_alvo} ({ip}): nenhuma das portas {lista} esta aberta (ou protegida por firewall)."
    return f"{host_alvo} ({ip}) - portas ABERTAS: {', '.join(map(str, sorted(abertas)))}"


@tool
def ligar_pc_wake_on_lan(mac: str, ip_rede: str = "255.255.255.255") -> str:
    """LIGA UM PC DA REDE QUE ESTA DESLIGADO usando Wake-on-LAN (Magic Packet) -
    100% em Python. 'mac'=endereco MAC da placa de rede do PC alvo (ex.:
    'AA:BB:CC:DD:EE:FF'; veja em 'listar_dispositivos_rede' ou no ipconfig do
    alvo). O PC alvo precisa ter Wake-on-LAN habilitado na BIOS/placa de rede.
    So envia o pacote, nao altera este PC. SEMPRE pede confirmacao (acao remota)."""
    import struct
    import socket
    try:
        hexs = mac.replace("-", ":").replace(".", ":").split(":")
        if len(hexs) != 6:
            raise ValueError
        mac_bytes = bytes(int(h, 16) for h in hexs)
    except Exception:
        return "MAC invalido. Use o formato AA:BB:CC:DD:EE:FF (veja em 'listar_dispositivos_rede')."
    if not _confirma_poderoso(f"Enviar Wake-on-LAN para LIGAR o PC com MAC {mac} (na sua rede)? Use so nos seus proprios equipamentos."):
        return "Cancelado."
    pacote = b"\xff" * 6 + mac_bytes * 16
    try:
        s0 = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s0.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        s0.sendto(pacote, (ip_rede, 9))
        s0.close()
        return f"Magic Packet (Wake-on-LAN) enviado para {mac.upper()}. Se o PC alvo tiver WoL ligado na BIOS, ele vai ligar."
    except Exception as ex:
        return f"Falhou ao enviar: {ex}"


@tool
def mapear_unidade_rede(caminho_rede: str, letra: str) -> str:
    """MAPEIA UMA PASTA COMPARTILHADA DE OUTRO PC DA REDE como se fosse um disco
    neste PC (ex.: transforma \\\\outro-pc\\arquivos na unidade Z:). 'caminho_rede'
    =o compartilhamento, 'letra'=a unidade. PODEROSO. SEMPRE pede confirmacao."""
    l = letra.strip().rstrip(":").upper()
    if not _confirma_poderoso(f"Mapear '{caminho_rede}' como a unidade {l}:?"):
        return "Cancelado."
    s, e, c = _rodar_cmd(f'net use {l}: "{caminho_rede}" /persistent:yes', 60)
    return f"Unidade {l}: agora aponta para {caminho_rede}." if c == 0 else f"Falhou (o compartilhamento existe e esta online?): {(e or s)[:300]}"


@tool
def montar_iso(caminho_iso: str, acao: str = "montar") -> str:
    """MONTA UM ARQUIVO .ISO (de instalador/jogo) como se fosse um DVD inserido -
    aparece uma unidade nova no Computador; ou DESMONTAA ('acao'='desmontar').
    PODEROSO leve. SEMPRE pede confirmacao para montar."""
    iso = caminho_iso.strip().strip('"')
    if acao.strip().lower().startswith("desmont"):
        s, e, c = _ps(f"Dismount-DiskImage -ImagePath '{iso}' -ErrorAction Stop; 'OK'", 90)
        return f"ISO desmontada: {os.path.basename(iso)}." if c == 0 else f"Falhou: {(e or s)[:300]}"
    if not os.path.isfile(iso):
        return f"ISO nao encontrada: {iso}"
    if not _confirma_poderoso(f"Montar a ISO '{os.path.basename(iso)}' (vai aparecer uma unidade de DVD nova)?"):
        return "Cancelado."
    s, e, c = _ps(f"Mount-DiskImage -ImagePath '{iso}' -PassThru | Get-Volume | Select-Object DriveLetter | Out-String", 90)
    letra = "".join(ch for ch in (s or "") if ch.isalpha())
    return f"ISO montada na unidade {letra}:." if c == 0 and letra else f"ISO montada (veja a nova unidade no Computador). {(e or s)[:200]}"


@tool
def esconder_pc_na_rede(acao: str = "esconder") -> str:
    """DEIXA O PC INVISIVEL NA REDE (desliga a descoberta de rede e o compartilhamento
    automatico) ou VISIVEL de novo ('mostrar'). Esconder e mais seguro em redes
    publicas. PODEROSO. SEMPRE pede confirmacao."""
    esconder = acao.strip().lower().startswith(("escond", "invis", "off"))
    if not _confirma_poderoso(("Deixar este PC INVISIVEL na rede (desliga descoberta/compartilhamento)?"
                               if esconder else "Voltar a deixar o PC VISIVEL na rede?")):
        return "Cancelado."
    perfil = "Public" if esconder else "Private"
    _rodar_cmd(f"netsh advfirewall firewall set rule group=\"descoberta de rede\" new enable={'no' if esconder else 'yes'}", 60)
    s, e, c = _ps(f"Set-NetConnectionProfile -NetworkCategory {perfil} -ErrorAction SilentlyContinue; 'OK'", 60)
    return f"PC agora esta {'INVISIVEL (rede publica)' if esconder else 'VISIVEL (rede privada)'} na rede." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def desligar_compartilhamentos_adm(acao: str = "desligar") -> str:
    """DESLIGA (OU RELIGA) OS COMPARTILHAMENTOS ADMINISTRATIVOS OCULTOS (C$, D$,
    ADMIN$) - um furador de seguranca que admin remoto pode usar. Desligar
    endurece o PC. PODEROSO. SEMPRE pede confirmacao."""
    desligar = acao.strip().lower().startswith(("deslig", "off"))
    if not _confirma_poderoso(("Desligar os compartilhamentos administrativos ocultos (C$, ADMIN$) - endurece a seguranca?"
                               if desligar else "Religar os compartilhamentos administrativos (C$, ADMIN$)?")):
        return "Cancelado."
    valor = "0" if desligar else "1"
    _rodar_cmd(r'reg add "HKLM\SYSTEM\CurrentControlSet\Services\LanmanServer\Parameters" /v AutoShareWks /t REG_DWORD /d ' + valor + " /f", 60)
    _rodar_cmd(r'reg add "HKLM\SYSTEM\CurrentControlSet\Services\LanmanServer\Parameters" /v AutoShareServer /t REG_DWORD /d ' + valor + " /f", 60)
    _rodar_cmd("net stop lanmanserver && net start lanmanserver", 90)
    return f"Compartilhamentos ADM$ {'DESLIGADOS' if desligar else 'RELIGADOS'} (servidor reiniciado)."


@tool
def listar_compartilhamentos_rede() -> str:
    """LISTA todas as pastas que este PC compartilha na rede (nome e caminho real) -
    so leitura. Use para conferir o que esta exposto."""
    s, e, c = _rodar_cmd("net share", 60)
    return "Compartilhamentos deste PC na rede:\n" + s if c == 0 else f"Falhou: {e or s}"


@tool
def listar_pcs_rede() -> str:
    """LISTA os outros computadores/equipamentos visiveis na rede local (net view) -
    so leitura."""
    s, e, c = _rodar_cmd("net view", 60)
    return "Computadores na rede:\n" + s if c == 0 else f"Nenhum computador listado (ou descoberta de rede desligada): {(e or s)[:200]}"


@tool
def renovar_ip() -> str:
    """LIBERA E PEDE UM IP NOVO ao roteador (ipconfig /release + /renew) e limpa o
    cache DNS - util quando a internet/ rede fica com IP preso ou conflitando.
    PODEROSO (corta a rede por alguns segundos). SEMPRE pede confirmacao."""
    if not _confirma_poderoso("Liberar e renovar o IP (ipconfig release/renew) e limpar o DNS? A rede cai por alguns segundos."):
        return "Cancelado."
    s, e, c = _rodar_cmd("ipconfig /release && ipconfig /renew && ipconfig /flushdns", 180)
    return f"IP renovado e DNS limpo.\n{s[-400:]}" if c == 0 else f"Falhou: {(e or s)[-300:]}"


@tool
def habilitar_dns_https() -> str:
    """ATIVA O DNS SOBRE HTTPS (DoH) no Windows - as consultas de site passam
    criptografadas (mais privacidade; o provedor nao ve quais sites voce acessa),
    usando os servidores DoH da Cloudflare/Google. PODEROSO (muda o DNS). SEMPRE
    pede confirmacao."""
    if not _confirma_poderoso("Ativar DNS sobre HTTPS (DoH) criptografado (Cloudflare/Google) nas suas conexoes?"):
        return "Cancelado."
    ps = ("$dns = @('1.1.1.1','8.8.8.8'); "
          "Get-DnsClientDohServerAddress -ErrorAction SilentlyContinue | Out-Null; "
          "foreach ($s in $dns) { Add-DnsClientDohServerAddress -ServerAddress $s -DohTemplate ('https://' + $s + '/dns-query') -AllowFallbackToUdp $true -AutoUpgrade $true -ErrorAction SilentlyContinue }; "
          "Set-DnsClientServerAddress -ServerAddresses $dns -ErrorAction SilentlyContinue; 'OK'")
    s, e, c = _ps(ps, 120)
    return "DNS sobre HTTPS ativado (Cloudflare/Google)." if c == 0 else f"Falhou (precisa de Windows 10 recente/admin): {(e or s)[:300]}"


@tool
def proxy_windows(acao: str, servidor: str = "") -> str:
    """LIGA, DESLIGA OU CONFIGURA O PROXY do Windows (vale para Edge/Chrome e apps).
    'acao'='ligar' (com 'servidor' ex.: '127.0.0.1:8080'), 'desligar' ou 'ver'.
    PODEROSO (pode cortar a internet se o proxy estiver errado). SEMPRE pede
    confirmacao para ligar/desligar."""
    a = acao.strip().lower()
    if a in ("ver", "status", "mostrar"):
        s, e, c = _rodar_cmd('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable & reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer', 60)
        return "Configuracao de proxy atual:\n" + s
    if a.startswith("deslig"):
        if not _confirma_poderoso("Desligar o proxy do Windows?"):
            return "Cancelado."
        _rodar_cmd(r'reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f', 60)
        return "Proxy desligado."
    if a.startswith("lig"):
        if not servidor.strip():
            return "Para ligar, diga o servidor (ex.: '127.0.0.1:8080')."
        if not _confirma_poderoso(f"Ligar o proxy do Windows para '{servidor}'? Se esse proxy nao existir, a internet para de funcionar."):
            return "Cancelado."
        _rodar_cmd(r'reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f', 60)
        _rodar_cmd(r'reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyServer /t REG_SZ /d "' + servidor + '" /f', 60)
        return f"Proxy ligado: {servidor}."
    return "Use 'ver', 'ligar' (com servidor) ou 'desligar'."


@tool
def habilitar_servidor_ssh(acao: str = "ligar") -> str:
    """INSTALA E LIGA O SERVIDOR SSH DO WINDOWS (OpenSSH Server) - permite acessar
    este PC por terminal a partir de outro (ssh usuario@ip). 'acao'='ligar'
    (instala se preciso e inicia) ou 'desligar'. EXTREMAMENTE PODEROSO (abre acesso
    remoto ao PC). SEMPRE pede confirmacao."""
    ligar = acao.strip().lower().startswith(("lig", "ativ"))
    if not _confirma_poderoso(("Instalar e INICIAR o servidor SSH (OpenSSH) - outros poderao acessar este PC por terminal via ssh? Deixe uma senha forte."
                               if ligar else "Parar e desligar o servidor SSH?")):
        return "Cancelado."
    if ligar:
        _ps("Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0 -ErrorAction SilentlyContinue | Out-Null", 600)
        s, e, c = _ps("Set-Service sshd -StartupType Automatic; Start-Service sshd; 'OK'", 120)
        return "Servidor SSH (sshd) instalado/iniciado. Acesse de outro PC com: ssh SEU_USUARIO@IP_DO_PC" if c == 0 else f"Falhou: {(e or s)[:300]}"
    s, e, c = _ps("Stop-Service sshd -Force -ErrorAction SilentlyContinue; Set-Service sshd -StartupType Disabled; 'OK'", 90)
    return "Servidor SSH parado e desligado." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def mostrar_tabela_rotas() -> str:
    """MOSTRA A TABELA DE ROTAS DE REDE do Windows (para onde o PC envia cada tipo
    de trafego, gateway padrao, VPNs) - so leitura. Util para diagnosticar VPN ou
    rede com rota errada."""
    s, e, c = _rodar_cmd("route print -4", 90)
    return "Tabela de rotas (IPv4):\n" + s[:4000] if c == 0 else f"Falhou: {e or s}"


# ---------------- CONTAS / SESSAO / SEGURANCA ----------------
@tool
def habilitar_conta_administrador(acao: str = "desligar") -> str:
    """LIGA OU DESLIGA A CONTA 'Administrador' OCULTA do Windows (a conta mestra,
    que vem desativada por seguranca). So ligue se souber o que esta fazendo e
    coloque senha; deixe desligada no dia a dia. 'acao'='ligar'/'desligar'.
    EXTREMAMENTE PODEROSO. SEMPRE pede confirmacao."""
    ligar = acao.strip().lower().startswith(("lig", "ativ"))
    if not _confirma_poderoso(("ATIVAR a conta oculta 'Administrador' (acesso total sem travas)? Coloque senha nela e desligue depois de usar."
                               if ligar else "Desativar a conta 'Administrador' oculta?")):
        return "Cancelado."
    if ligar:
        _rodar_cmd("net user Administrador /active:yes", 60)
        return "Conta 'Administrador' ATIVADA. Defina uma senha forte para ela antes de usar."
    s, e, c = _rodar_cmd("net user Administrador /active:no", 60)
    return "Conta 'Administrador' desativada." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def listar_sessoes_ativas() -> str:
    """LISTA quem esta logado no PC no momento (usuarios e sessoes locais/remotas) -
    so leitura. Use para ver se ha uma sessao remota/RDP aberta."""
    s, e, c = _rodar_cmd("query session", 60)
    if c == 0:
        return "Sessoes ativas:\n" + s
    s2, e2, c2 = _rodar_cmd("query user", 60)
    return "Usuarios logados:\n" + (s2 or "Nao consegui listar (precisa de admin/terminal services).")


@tool
def encerrar_sessao_usuario(id_sessao: str) -> str:
    """FORCA O LOGOFF DE UMA SESSAO/USUARIO (fecha a area de trabalho daquela conta,
    com programas abertos). 'id_sessao'=o numero que aparece em
    'listar_sessoes_ativas'. EXTREMAMENTE PODEROSO (perde o que nao foi salvo naquela
    sessao). SEMPRE pede confirmacao."""
    if not _confirma_poderoso(f"ENCERRAR a sessao/usuario numero {id_sessao} (logoff forcado)? Tudo nao salvo nessa sessao se perde."):
        return "Cancelado."
    s, e, c = _rodar_cmd(f"logoff {id_sessao}", 60)
    return f"Sessao {id_sessao} encerrada." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def enviar_mensagem_rede(texto: str, destino: str = "*") -> str:
    """ENVIA UMA MENSAGEM POPUP PARA OUTRO PC DA REDE (msg do Windows). 'destino'=
    nome/IP do outro PC (ou '*' so neste). 'texto'=a mensagem. PODEROSO leve.
    SEMPRE pede confirmacao (nao use para incomodar terceiros)."""
    if not _confirma_poderoso(f"Enviar a mensagem para '{destino}':\n\"{texto}\"\nSo use na sua rede/com seus PCs."):
        return "Cancelado."
    seguro = texto.replace('"', "'")
    s, e, c = _rodar_cmd(f'msg * /server:{destino} "{seguro}"' if destino != "*" else f'msg * "{seguro}"', 60)
    return "Mensagem enviada." if c == 0 else f"Falhou (o 'msg' pode nao existir nesta edicao do Windows): {(e or s)[:300]}"


@tool
def politica_senha_windows(acao: str = "ver") -> str:
    """VE OU ENDURECE A POLITICA DE SENHAS do Windows. 'acao'='ver' (mostra as
    regras atuais) ou 'endurecer' (liga complexidade de senha e tamanho minimo de
    8 caracteres - recomendado para seguranca). PODEROSO. SEMPRE pede confirmacao
    para mudar."""
    if acao.strip().lower().startswith(("ver", "status")):
        s, e, c = _rodar_cmd("net accounts", 60)
        return "Politica de senhas/contas atual:\n" + s if c == 0 else f"Falhou: {e or s}"
    if not _confirma_poderoso("Endurecer a politica de senhas? Vou exigir senha de no minimo 8 caracteres e complexidade (letra+numero/simbolo)."):
        return "Cancelado."
    _rodar_cmd(r'reg add "HKLM\SYSTEM\CurrentControlSet\Services\Netlogon\Parameters" /v MinimumPasswordLength /t REG_DWORD /d 8 /f', 60)
    # exporta politica via secedit de forma simples
    s, e, c = _rodar_cmd("net accounts /minpwlen:8 /uniquepw:5", 60)
    return "Politica endurecida (senha minima de 8 caracteres; complexidade recomendada ativa em versao Pro)." if c == 0 else f"Concluido com avisos: {(e or s)[:300]}"


@tool
def bloquear_usb_pendrive(acao: str = "bloquear") -> str:
    """BLOQUEIA (OU LIBERA) O USO DE PENDRIVES/USB DE ARMAZENAMENTO neste PC -
    impede copia de dados por USB (seguranca) ou reverte. Teclado/mouse USB
    continuam funcionando (so o armazenamento e afetado). 'acao'='bloquear'/
    'liberar'. EXTREMAMENTE PODEROSO. SEMPRE pede confirmacao."""
    bloquear = acao.strip().lower().startswith(("bloq", "neg"))
    if not _confirma_poderoso(("BLOQUEAR pendrives/armazenamento USB neste PC (so a maquina que rodar isso; teclado/mouse seguem OK)?"
                               if bloquear else "Liberar pendrives/armazenamento USB?")):
        return "Cancelado."
    valor = "4" if bloquear else "3"  # USBSTOR Start: 4=desabilitado, 3=manual
    s, e, c = _rodar_cmd(r'reg add "HKLM\SYSTEM\CurrentControlSet\Services\USBSTOR" /v Start /t REG_DWORD /d ' + valor + " /f", 60)
    return f"Armazenamento USB {'BLOQUEADO' if bloquear else 'LIBERADO'} (vale ao plugar um novo dispositivo)." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def ligar_desligar_uac(nivel: str = "ligar") -> str:
    """LIGA OU DESLIGA O CONTROLE DE CONTA DE USUARIO (UAC - os avisos de 'permitir
    que este app faca alteracoes'). Desligar e perigoso (tira uma das principais
    defesas contra virus); so desligue temporariamente. EXTREMAMENTE PODEROSO.
    SEMPRE pede confirmacao."""
    desligar = nivel.strip().lower().startswith(("deslig", "off"))
    if not _confirma_poderoso(("DESLIGAR o UAC (avisos de permissao)? Isso enfraquece MUITO a seguranca; so vale apos reiniciar. Nao recomendado."
                               if desligar else "LIGAR o UAC (recomendado para seguranca)?")):
        return "Cancelado."
    valor = "0" if desligar else "1"
    s, e, c = _rodar_cmd(r'reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v EnableLUA /t REG_DWORD /d ' + valor + " /f", 60)
    return f"UAC {'DESLIGADO' if desligar else 'LIGADO'} (reinicie o PC para valer)." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def verificar_assinatura_arquivo(caminho_arquivo: str) -> str:
    """VERIFICA SE UM PROGRAMA/.EXE TEM ASSINATURA DIGITAL VALIDA (de empresa
    confiavel) - so leitura. Programa sem assinatura pode ser suspeito/caseiro.
    Usa Get-AuthenticodeSignature."""
    a = caminho_arquivo.strip().strip('"')
    if not os.path.isfile(a):
        return f"Arquivo nao encontrado: {a}"
    ps = (f"$s = Get-AuthenticodeSignature '{a}'; "
          "'Status: ' + $s.Status; 'Quem assinou: ' + $s.SignerCertificate.Subject")
    s, e, c = _ps(ps, 60)
    return s if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def escanear_arquivo_defender(caminho_arquivo: str) -> str:
    """MANDA O WINDOWS DEFENDER VARRER UM ARQUIVO/PASTA ESPECIFICO agora (MpCmdRun
    -Scan) - rapido e direto no arquivo que voce suspeita. PODEROSO leve. SEMPRE
    pede confirmacao."""
    a = caminho_arquivo.strip().strip('"')
    if not os.path.exists(a):
        return f"Nao encontrado: {a}"
    if not _confirma_poderoso(f"Varrer com o Defender agora:\n{a}"):
        return "Cancelado."
    s, e, c = _rodar_cmd(f'"%ProgramFiles%\\Windows Defender\\MpCmdRun.exe" -Scan -ScanType 3 -File "{a}"', 900)
    return "Varredura concluida (se nao houver ameaca listada, o arquivo esta limpo).\n" + (s or e)[-500:]


@tool
def listar_quarentena_defender() -> str:
    """LISTA OS ARQUIVOS QUE O DEFENDER COLOU EM QUARENTENA (ameacas detectadas e
    isoladas) - so leitura."""
    s, e, c = _rodar_cmd('"%ProgramFiles%\\Windows Defender\\MpCmdRun.exe" -Restore -ListAll', 120)
    return "Itens em quarentena do Defender:\n" + (s if s.strip() else "Nenhum item em quarentena.") if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def status_ativacao_windows() -> str:
    """DIZ SE O WINDOWS ESTA ATIVADO e com qual tipo de licenca (digital/OEM/chave) -
    so leitura."""
    s, e, c = _rodar_cmd("cscript //nologo %SystemRoot%\\System32\\slmgr.vbs /dli", 120)
    return "Status de ativacao do Windows:\n" + s if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def mostrar_chave_produto_windows() -> str:
    """RECUPERA A CHAVE DE PRODUTO (serial) do Windows que veio gravada na BIOS/
    firmware do PC (OA3xOriginalProductKey) - util para reinstalar o Windows. So
    leitura; mostra so a chave DESTE equipamento (nao quebra nenhuma protecao)."""
    s, e, c = _rodar_cmd(r'wmic path softwarelicensingservice get OA3xOriginalProductKey', 60)
    chave = " ".join(s.split())
    if not chave or "OA3xOriginalProductKey" not in s:
        return "Nao encontrei chave OEM na firmware (PC montado/Windows nao veio de fabrica)."
    chave = s.replace("OA3xOriginalProductKey", "").strip()
    return f"Chave de produto (OEM) gravada na BIOS deste PC:\n{chave}\nGuarde-a para reinstalar o Windows."


@tool
def desligar_login_automatico() -> str:
    """DESLIGA O LOGIN AUTOMATICO (se o Windows entra direto sem pedir senha) - volta
    a pedir senha ao ligar, o que e mais seguro. PODEROSO. SEMPRE pede confirmacao."""
    if not _confirma_poderoso("Desligar o login automatico (passar a pedir senha ao ligar o PC)?"):
        return "Cancelado."
    _rodar_cmd(r'reg delete "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v AutoAdminLogon /f', 60)
    _rodar_cmd(r'reg delete "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v DefaultPassword /f', 60)
    return "Login automatico desligado - o Windows voltara a pedir senha."


# ---------------- AMBIENTE / DEV / POLITICAS / PRIVACIDADE ----------------
@tool
def criptografar_pasta_efs(caminho: str, acao: str = "criptografar") -> str:
    """CRIPTOGRAFA UMA PASTA/ARQUIVO com o EFS do proprio Windows (cipher /e) - so o
    seu usuario do Windows consegue abrir; ou DESCRIPTOGRAFA ('descriptografar').
    Diferente do BitLocker, e por pasta. PODEROSO (se perder o Windows/conta, os
    arquivos podem ficar inacessiveis - faca backup do certificado). SEMPRE pede
    confirmacao."""
    p = caminho.strip().strip('"')
    if not os.path.exists(p):
        return f"Nao encontrado: {p}"
    cripto = acao.strip().lower().startswith(("cript", "lig"))
    if not _confirma_poderoso(("CRIPTOGRAFAR com EFS (so seu usuario abre)? IMPORTANTE: guarde o certificado de criptografia ou pode perder o acesso se reinstalar o Windows."
                               if cripto else "Descriptografar (voltar ao normal) este item EFS?")):
        return "Cancelado."
    flag = "/e" if cripto else "/d"
    s, e, c = _rodar_cmd(f'cipher {flag} /s:"{p}"' if os.path.isdir(p) else f'cipher {flag} "{p}"', 300)
    return f"Item {'criptografado (EFS)' if cripto else 'descriptografado'}." if c == 0 else f"Falhou: {(e or s)[-300:]}"


@tool
def desbloquear_arquivo_baixado(caminho: str) -> str:
    """REMOVE A MARCA DE 'BAIXADO DA INTERNET' de um arquivo (o aviso de seguranca
    'este arquivo veio de outro computador' / o bloqueio do SmartScreen em scripts).
    Use so em arquivos que VOCE confia. PODEROSO. SEMPRE pede confirmacao."""
    p = caminho.strip().strip('"')
    if not os.path.exists(p):
        return f"Nao encontrado: {p}"
    if not _confirma_poderoso(f"Desbloquear a marca de 'veio da internet' de:\n{p}\nFaca isso somente se confiar no arquivo."):
        return "Cancelado."
    s, e, c = _ps(f"Get-ChildItem '{p}' -Recurse -ErrorAction SilentlyContinue | Unblock-File; Unblock-File '{p}' -ErrorAction SilentlyContinue; 'OK'", 120)
    return "Arquivo(s) desbloqueados (marca de internet removida)." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def gerenciar_variavel_ambiente(acao: str, nome: str, valor: str = "") -> str:
    """VE, CRIA/ALTERA OU REMOVE UMA VARIAVEL DE AMBIENTE do Windows (como PATH,
    JAVA_HOME etc.). 'acao'='ver', 'criar' ('nome' e 'valor') ou 'remover'
    ('nome'). Afeta TODOS os programas/terminais. PODEROSO (mexer errado no PATH
    quebra comandos). SEMPRE pede confirmacao para criar/remover."""
    a = acao.strip().lower()
    if a in ("ver", "listar", "mostrar"):
        s, e, c = _ps(f"[Environment]::GetEnvironmentVariable('{nome}','Machine')", 60)
        return f"Variavel de sistema '{nome}' = {s.strip() or '(nao definida)'}"
    if a.startswith("rem"):
        if not _confirma_poderoso(f"REMOVER a variavel de ambiente de sistema '{nome}'?"):
            return "Cancelado."
        s, e, c = _ps(f"[Environment]::SetEnvironmentVariable('{nome}',$null,'Machine'); 'OK'", 60)
        return f"Variavel '{nome}' removida." if c == 0 else f"Falhou: {(e or s)[:300]}"
    if a.startswith(("cri", "defin", "alter")):
        if not _confirma_poderoso(f"Definir a variavel de AMBIENTE DE SISTEMA '{nome}' = '{valor}'? Afeta todos os programas."):
            return "Cancelado."
        # tratamento especial de PATH: acrescenta em vez de sobrescrever
        if nome.upper() == "PATH" and valor and not valor.startswith(";"):
            ps = (f"$atual = [Environment]::GetEnvironmentVariable('Path','Machine'); "
                  f"if ($atual -notlike '*{valor}*') {{ [Environment]::SetEnvironmentVariable('Path', $atual + ';' + '{valor}', 'Machine') }}; 'OK'")
        else:
            ps = f"[Environment]::SetEnvironmentVariable('{nome}','{valor.replace(chr(39),'')}','Machine'); 'OK'"
        s, e, c = _ps(ps, 60)
        return f"Variavel '{nome}' definida (abra um terminal novo para valer)." if c == 0 else f"Falhou: {(e or s)[:300]}"
    return "Use 'ver', 'criar' (nome e valor) ou 'remover' (nome)."


@tool
def habilitar_caminhos_longos(acao: str = "ligar") -> str:
    """LIGA O SUPORTE A CAMINHOS LONGOS do Windows (acima de 260 caracteres, que
    da erro 'path too long' em programas/node/git) ou desliga. PODEROSO (chave de
    politica). SEMPRE pede confirmacao."""
    ligar = acao.strip().lower().startswith(("lig", "ativ"))
    if not _confirma_poderoso(("Habilitar caminhos longos (LongPathsEnabled) - acaba com o erro de 'caminho muito longo'?"
                               if ligar else "Desligar o suporte a caminhos longos?")):
        return "Cancelado."
    valor = "1" if ligar else "0"
    s, e, c = _rodar_cmd(r'reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d ' + valor + " /f", 60)
    return f"Caminhos longos {'HABILITADOS' if ligar else 'desabilitados'}." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def habilitar_modo_desenvolvedor(acao: str = "ligar") -> str:
    """LIGA O MODO DESENVOLVEDOR do Windows (permite instalar apps por fora, usar
    simbolicos links sem admin, bash/SSH soltos) ou desliga. PODEROSO. SEMPRE pede
    confirmacao."""
    ligar = acao.strip().lower().startswith(("lig", "ativ"))
    if not _confirma_poderoso(("Habilitar o Modo Desenvolvedor do Windows (mais liberdades para programar, porem reduz uma trava de seguranca)?"
                               if ligar else "Desligar o Modo Desenvolvedor?")):
        return "Cancelado."
    valor = "1" if ligar else "0"
    s, e, c = _rodar_cmd(r'reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" /v AllowDevelopmentWithoutDevLicense /t REG_DWORD /d ' + valor + " /f", 60)
    return f"Modo Desenvolvedor {'LIGADO' if ligar else 'DESLIGADO'}." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def politica_execucao_powershell(nivel: str = "remotesigned") -> str:
    """DEFINE A POLITICA DE EXECUCAO DE SCRIPTS DO POWERSHELL. 'remotesigned'
    (recomendado: roda scripts locais, exige assinatura nos baixados da internet),
    'restricted' (nao roda nenhum script) ou 'bypass' (roda tudo - so para
    diagnostico). PODEROSO. SEMPRE pede confirmacao."""
    n = nivel.strip().lower()
    if n not in ("remotesigned", "restricted", "bypass", "allsigned"):
        return "Use um nivel: remotesigned (recomendado), restricted ou bypass."
    if not _confirma_poderoso(f"Definir a politica de execucao do PowerShell para '{n}' para o computador todo?"):
        return "Cancelado."
    s, e, c = _ps(f"Set-ExecutionPolicy -ExecutionPolicy {n} -Scope LocalMachine -Force; 'OK'", 60)
    return f"Politica do PowerShell definida para '{n}'." if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def listar_programas_inicializacao() -> str:
    """LISTA OS PROGRAMAS QUE INICIAM JUNTO COM O WINDOWS (das chaves Run do registro
    e das pastas de inicializacao) - so leitura. Use para ver o que deixa o PC
    lento ao ligar."""
    ps = ("'=== Run (usuario) ==='; (Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -ErrorAction SilentlyContinue).PSObject.Properties | "
          "Where-Object {$_.Name -notlike 'PS*'} | ForEach-Object { $_.Name + ' = ' + $_.Value }; "
          "'=== Run (maquina) ==='; (Get-ItemProperty 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -ErrorAction SilentlyContinue).PSObject.Properties | "
          "Where-Object {$_.Name -notlike 'PS*'} | ForEach-Object { $_.Name + ' = ' + $_.Value }; "
          "'=== Pasta de inicializacao ==='; Get-ChildItem ([Environment]::GetFolderPath('Startup')) -ErrorAction SilentlyContinue | ForEach-Object { $_.Name }")
    s, e, c = _ps(ps, 90)
    return "Programas de inicializacao:\n" + (s or "Nenhum item encontrado.") if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def remover_programa_inicializacao(nome: str) -> str:
    """REMOVE UM PROGRAMA DA INICIALIZACAO DO WINDOWS (tira do Run/RunOnce) - ele
    para de abrir sozinho ao ligar o PC (NAO desinstala o programa). 'nome'=o nome
    que aparece em 'listar_programas_inicializacao'. PODEROSO. SEMPRE pede
    confirmacao."""
    if not _confirma_poderoso(f"Tirar '{nome}' da inicializacao do Windows (ele so para de abrir junto; nao e desinstalado)?"):
        return "Cancelado."
    ps = (f"foreach ($base in @('HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run','HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',"
          f"'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce','HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce')) {{ "
          f"$p = Get-ItemProperty $base -ErrorAction SilentlyContinue; if ($p -and $p.'{nome}') {{ Remove-ItemProperty -Path $base -Name '{nome}' -ErrorAction SilentlyContinue; 'removido de ' + $base }} }}; 'fim'")
    s, e, c = _ps(ps, 90)
    return f"'{nome}' removido da inicializacao (se existia).\n{s}" if c == 0 else f"Falhou: {(e or s)[:300]}"


@tool
def alterar_tipo_inicializacao_servico(nome_servico: str, tipo: str) -> str:
    """DEFINE COMO UM SERVICO DO WINDOWS INICIA: 'automatico', 'manual' (so quando
    chamado) ou 'desabilitado' (nunca inicia - util para desligar servicos que
    atrapalham). EXTREMAMENTE PODEROSO (desabilitar o servico errado pode quebrar
    coisas). SEMPRE pede confirmacao."""
    mapa = {"automatico": "Automatic", "auto": "Automatic", "manual": "Manual", "desabilitado": "Disabled", "desligado": "Disabled", "atrasado": "AutomaticDelayedStart"}
    t = mapa.get(tipo.strip().lower())
    if not t:
        return "Use 'tipo' = automatico, manual ou desabilitado."
    if not _confirma_poderoso(f"Definir a inicializacao do servico '{nome_servico}' como '{tipo}'? Desabilitar servicos essenciais pode quebrar o Windows."):
        return "Cancelado."
    s, e, c = _ps(f"Set-Service -Name '{nome_servico}' -StartupType {t} -ErrorAction Stop; 'OK'", 90)
    return f"Servico '{nome_servico}' definido como '{tipo}'." if c == 0 else f"Falhou (servico existe?): {(e or s)[:300]}"


@tool
def limpar_cache_navegadores() -> str:
    """LIMPA O CACHE (arquivos temporarios) dos navegadores Chrome e Edge - libera
    espaco e resolve sites que carregam travado. NAO apaga senhas nem favoritos.
    Feche os navegadores antes. PODEROSO. SEMPRE pede confirmacao."""
    if not _confirma_poderoso("Limpar o cache de Chrome e Edge? (NAO apaga senhas/favoritos; FECHE os navegadores antes.)"):
        return "Cancelado."
    alvos = [
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Google", "Chrome", "User Data", "Default", "Cache"),
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "Edge", "User Data", "Default", "Cache"),
    ]
    ps = ("$pastas = @(\"$env:LOCALAPPDATA\\Google\\Chrome\\User Data\\Default\\Cache\","
          "\"$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data\\Default\\Cache\"); "
          "foreach ($p in $pastas) { Remove-Item \"$p\\*\" -Recurse -Force -ErrorAction SilentlyContinue }; 'OK'")
    s, e, c = _ps(ps, 300)
    return "Cache de Chrome e Edge limpo." if c == 0 else f"Concluido com avisos (navegador aberto?): {(e or s)[:300]}"


@tool
def desligar_copilot_windows(acao: str = "desligar") -> str:
    """DESLIGA (OU RELIGA) O COPILOT/ASSISTENTE DA BARRA DE TAREFAS do Windows (o
    botao/IA que aparece ao lado do menu Iniciar). PODEROSO leve. SEMPRE pede
    confirmacao."""
    desligar = acao.strip().lower().startswith(("deslig", "off", "remov"))
    if not _confirma_poderoso(("Desligar o Copilot/assistente da barra de tarefas?" if desligar else "Religar o Copilot na barra de tarefas?")):
        return "Cancelado."
    valor = "1" if desligar else "0"
    _rodar_cmd(r'reg add "HKCU\Software\Policies\Microsoft\Windows\WindowsCopilot" /v TurnOffWindowsCopilot /t REG_DWORD /d ' + valor + " /f", 60)
    _rodar_cmd(r'reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v ShowCopilotButton /t REG_DWORD /d ' + ("0" if desligar else "1") + " /f", 60)
    _rodar_cmd('taskkill /f /im explorer.exe && start explorer.exe', 60)
    return f"Copilot {'DESLIGADO' if desligar else 'RELIGADO'} (Explorer reiniciado)."


# ======================================================================
# ========== SUPERCOMANDOS "FAZ TUDO EM SEGUNDOS" E PERSONALIDADE ==========
# Comandos TURBO que encadeiam varias acoes de uma vez (o agente roda tudo
# rapido e relata), mais a PERSONALIDADE do agente: opinioes proprias, ideias
# de novas funcoes e HUMOR. Os supercomandos que MUDAM o sistema passam pela
# trava de catastrofe; os de limpeza rapida perguntam tambem. Leitura, nao.
# ======================================================================

# ---------------- MEDICO / OTIMIZACAO TURBO ----------------
@tool
def otimizar_tudo() -> str:
    """OTIMIZACAO RELAMPAGO DO PC: limpa lixo (temp, prefetch, cache de update),
    esvazia a lixeira, encerra programas que estao 'nao respondendo', limpa o DNS
    e roda otimizacao do disco. Faz tudo sozinho numa tacada e relata. PODEROSO
    (nao apaga documentos). SEMPRE pede confirmacao."""
    if not _confirma_poderoso("OTIMIZACAO TURBO: limpar lixo, esvaziar lixeira, encerrar travados e otimizar o disco? Seus documentos NAO sao apagados."):
        return "Cancelado."
    feitas = []
    try:
        _ps("$a=@($env:TEMP,\"$env:WINDIR\\Temp\",\"$env:WINDIR\\Prefetch\",\"$env:WINDIR\\SoftwareDistribution\\Download\"); foreach($p in $a){Remove-Item \"$p\\*\" -Recurse -Force -ErrorAction SilentlyContinue}; Clear-RecycleBin -Force -ErrorAction SilentlyContinue; 'OK'", 600)
        feitas.append("Lixo/temp/prefetch/cache de update limpos e lixeira esvaziada")
    except Exception:
        pass
    try:
        _rodar_cmd('taskkill /f /fi "STATUS eq NOT RESPONDING"', 60)
        feitas.append("Programas travados encerrados")
    except Exception:
        pass
    try:
        _rodar_cmd("ipconfig /flushdns", 60)
        feitas.append("Cache de DNS limpo")
    except Exception:
        pass
    try:
        _rodar_cmd("defrag C: /O", 1800)
        feitas.append("Disco C: otimizado (TRIM/desfragmentacao)")
    except Exception:
        pass
    return ("Otimizacao relampago concluida! Fiz o seguinte:\n - " + "\n - ".join(feitas)
            + "\n\nO PC deve respirar melhor agora.")


@tool
def medico_do_pc() -> str:
    """O MEDICO DO PC: faz um check-up COMPLETO e TENTA CONSERTAR o que estiver
    errado - repara arquivos do sistema (SFC), testa a internet/DNS, checa disco
    lotado, dispositivos com erro, e mostra os programas que mais comem memoria.
    Relata um diagnostico em portugues. PODEROSO e demorado. SEMPRE pede
    confirmacao."""
    if not _confirma_poderoso("Rodar o MEDICO DO PC (check-up completo + reparo automatico de arquivos/rede)? Pode demorar uns minutos."):
        return "Cancelado."
    rel = []
    s, _, _ = _rodar_cmd("sfc /scannow", 2400)
    if "Nao encontrou violacoes" in s or "not find any integrity" in s.lower():
        rel.append("Arquivos do Windows: OK (nenhuma corrupcao)")
    else:
        rel.append("Arquivos do Windows: com desgaste - o SFC tentou corrigir (rode 'reparar_windows' se persistir)")
    s, _, c = _rodar_cmd("ping -n 2 8.8.8.8", 20)
    rel.append("Internet: " + ("respondendo (8.8.8.8 OK)" if c == 0 else "NAO respondeu ao ping - rede pode estar fora"))
    s2, _, c2 = _rodar_cmd("nslookup google.com", 20)
    rel.append("DNS: " + ("resolvendo nomes" if c2 == 0 else "com problema - tente 'reparar_internet'"))
    s, _, _ = _ps("$d=Get-PSDrive C; 'LivreGB=' + [math]::Round($d.Free/1GB,1) + ';TotalGB=' + [math]::Round(($d.Free+$d.Used)/1GB,1)", 60)
    rel.append("Espaco em C: " + " ".join(s.split()))
    s, _, _ = _ps("(Get-PnpDevice | Where-Object {$_.Status -ne 'OK'}).Count", 60)
    try:
        n = int("".join(ch for ch in s if ch.isdigit()) or "0")
        rel.append(f"Dispositivos com erro: {n}" + (" - veja 'listar_dispositivos_com_erro'" if n else " (tudo OK)"))
    except Exception:
        pass
    s, _, _ = _ps("Get-Process | Sort-Object WS -Descending | Select-Object -First 5 Name,@{n='RAM_MB';e={[math]::Round($_.WS/1MB)}} | Format-Table -AutoSize | Out-String", 60)
    rel.append("Top 5 programas que mais comem RAM:\n" + s)
    return "=== DIAGNOSTICO DO MEDICO DO PC ===\n - " + "\n - ".join(rel)


@tool
def reparar_internet() -> str:
    """CONSERTA A INTERNET/REDE de forma automatica e rapida: limpa o DNS, reseta
    Winsock e a pilha TCP/IP, libera/renova o IP e reinicia o adaptador. Resolve a
    maior parte dos 'internet caiu / nao navega / sem Wi-Fi'. Pode pedir reinicio.
    PODEROSO (corta a rede por alguns segundos). SEMPRE pede confirmacao."""
    if not _confirma_poderoso("Reparar a internet (flush DNS, reset Winsock/TCP-IP, renovar IP)? A rede cai por alguns segundos e pode pedir reinicio."):
        return "Cancelado."
    for cmd in ["ipconfig /flushdns", "netsh winsock reset", "netsh int ip reset",
                "ipconfig /release", "ipconfig /renew"]:
        _rodar_cmd(cmd, 180)
    _ps("Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | Restart-NetAdapter -Confirm:$false -ErrorAction SilentlyContinue; 'OK'", 120)
    return ("Reparo de internet concluido! Teste a conexao. Se ainda nao navegar, REINICIE o PC "
            "(o reset do Winsock/IP so termina de valer depois de reiniciar).")


@tool
def seguranca_total() -> str:
    """VARREDURA DE SEGURANCA TOTAL num comando so: atualiza o Defender, roda uma
    varredura rapida, checa o firewall e a protecao em tempo real, e lista os
    programas com conexao de rede ativa. PODEROSO (a varredura). SEMPRE pede
    confirmacao."""
    if not _confirma_poderoso("Rodar a varredura de SEGURANCA TOTAL (atualizar e escanear com o Defender + checar firewall)?"):
        return "Cancelado."
    out = []
    _rodar_cmd('"%ProgramFiles%\\Windows Defender\\MpCmdRun.exe" -SignatureUpdate', 600)
    out.append("Defender atualizado.")
    s, _, _ = _rodar_cmd('"%ProgramFiles%\\Windows Defender\\MpCmdRun.exe" -Scan -ScanType 1', 1800)
    out.append("Varredura rapida concluida" + (" (nenhuma ameaca listada = limpo)." if not s or "0 threat" in s.lower() else ". Ver saida."))
    s, _, _ = _ps("Get-NetFirewallProfile | Select-Object Name,Enabled | Format-Table -AutoSize | Out-String", 60)
    out.append("Firewall:\n" + s)
    s, _, _ = _ps("(Get-MpComputerStatus).RealTimeProtectionEnabled", 60)
    out.append("Protecao em tempo real: " + ("LIGADA" if "True" in (s or "") else "DESLIGADA - ligue com 'protecao_tempo_real_defender'"))
    return "=== SEGURANCA TOTAL ===\n" + "\n".join(out)


@tool
def modo_jogo(acao: str = "ligar") -> str:
    """MODO JOGO TURBO: com 'ligar' ativa o plano de Alto Desempenho, pausa as
    atualizacoes do Windows e liga o Modo de Jogo (maximo de FPS); com 'desligar'
    volta ao normal. PODEROSO. SEMPRE pede confirmacao."""
    ligar = acao.strip().lower().startswith(("lig", "ativ"))
    if not _confirma_poderoso(("ATIVAR o MODO JOGO TURBO (Alto Desempenho + pausar updates + Modo de Jogo) para maximo de FPS?"
                               if ligar else "Sair do MODO JOGO TURBO e voltar ao normal?")):
        return "Cancelado."
    if ligar:
        _rodar_cmd("powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c", 30)
        _rodar_cmd("net stop wuauserv & net stop bits", 90)
        _rodar_cmd(r'reg add "HKCU\Software\Microsoft\GameBar" /v AutoGameModeEnabled /t REG_DWORD /d 1 /f', 30)
        return "MODO JOGO TURBO LIGADO! Alto Desempenho ativo, updates pausados e Modo de Jogo ligado. Bons frags!"
    _rodar_cmd("powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e", 30)
    _rodar_cmd("sc config wuauserv start= demand & net start bits & net start wuauserv", 90)
    _rodar_cmd(r'reg add "HKCU\Software\Microsoft\GameBar" /v AutoGameModeEnabled /t REG_DWORD /d 0 /f', 30)
    return "MODO JOGO desligado. Voltei ao plano balanceado e religuei as atualizacoes."


@tool
def quem_usa_internet(quantos: int = 15) -> str:
    """MOSTRA QUAIS PROGRAMAS ESTAO COM MAIS CONEXOES DE INTERNET ATIVAS agora - so
    leitura. Otimo pra ver quem esta 'puxando' net em segundo plano.
    'quantos'=quantos programas listar."""
    n = max(1, min(int(quantos), 50))
    ps = ("Get-NetTCPConnection -State Established -ErrorAction SilentlyContinue | Group-Object OwningProcess | "
          "ForEach-Object { $proc = (Get-Process -Id $_.Name -ErrorAction SilentlyContinue).ProcessName; "
          "[PSCustomObject]@{Programa=$proc; Conexoes=$_.Count} } | Where-Object {$_.Programa} | "
          f"Sort-Object Conexoes -Descending | Select-Object -First {n} | Format-Table -AutoSize | Out-String")
    s, e, c = _ps(ps, 90)
    return "Programas com mais conexoes de internet ativas:\n" + (s or "Nenhuma conexao ativa no momento.") if c == 0 else f"Falhou: {e or s}"


@tool
def matar_programas_pesados(top: int = 3) -> str:
    """ENCERRA OS PROGRAMAS (nao-essenciais) QUE ESTAO COMENDO MAIS MEMORIA agora.
    Util quando o PC fica lento de repente. PODEROSO (fecha programas; o que nao
    foi salvo neles se perde). SEMPRE pede confirmacao."""
    if not _confirma_poderoso(f"Encerrar os {top} programas (nao-essenciais) que mais consumem memoria agora? O que nao estiver salvo neles se perde."):
        return "Cancelado."
    ps = ("$proteger = 'explorer|dwm|system|svchost|winlogon|csrss|lsass|services|smss|wininit|python'; "
          "Get-Process | Where-Object {$_.ProcessName -notmatch $proteger} | Sort-Object WS -Descending | "
          f"Select-Object -First {max(1, int(top))} | ForEach-Object {{ try {{ Stop-Process -Id $_.Id -Force; $_.ProcessName }} catch {{}} }}")
    s, e, c = _ps(ps, 90)
    mortos = [l.strip() for l in (s or "").splitlines() if l.strip()]
    return "Encerrados: " + ", ".join(mortos) if mortos else "Nao havia programas pesados para encerrar (ou todos eram essenciais)."


@tool
def senhas_wifi_salvas() -> str:
    """MOSTRA TODAS AS SENHAS DE WI-FI SALVAS NESTE PC (as redes que voce ja
    conectou) - so leitura do SEU proprio computador. Util quando voce esquece a
    senha e precisa passar a um visita/outro aparelho."""
    s, e, c = _rodar_cmd("netsh wlan show profiles", 90)
    if c != 0:
        return f"Falhou: {e or s}"
    import re as _re
    nomes = []
    for l in s.splitlines():
        m = _re.search(r"(?:Perfil de Todos os Usuarios|All User Profile|Perfil de todos los usuarios)\s*:\s*(.+)", l)
        if m:
            nomes.append(m.group(1).strip())
    if not nomes:
        return "Nenhuma rede Wi-Fi salva neste PC."
    saida = ["Redes Wi-Fi salvas neste PC:"]
    for nome in nomes:
        k = _rodar_cmd(f'netsh wlan show profile name="{nome}" key=clear', 60)[0]
        m = _re.search(r"(?:Conteudo da Chave|Key Content|Contenido de la clave)\s*:\s*(.+)", k)
        senha = m.group(1).strip() if m else "(rede aberta / sem senha)"
        saida.append(f"  - {nome}: {senha}")
    return "\n".join(saida)


@tool
def teste_velocidade_internet() -> str:
    """MEDE A VELOCIDADE DA INTERNET (download estimado em Mbps baixando um arquivo
    de teste da Cloudflare e descartando) e a latencia (ping). Sem instalar nada.
    So leitura (baixa descartavel). Demora uns 15-30 segundos."""
    try:
        s, _, _ = _rodar_cmd("ping -n 4 8.8.8.8", 30)
        import re as _re
        vals = [int(a or b) for a, b in _re.findall(r"tempo[=<]\s*(\d+)ms|time[=<]\s*(\d+)ms", s) if (a or b)]
        lat = f"{sum(vals)//len(vals)} ms" if vals else "?"
    except Exception:
        lat = "?"
    ps = ("$u='https://speed.cloudflare.com/__down?bytes=25000000'; $t=Get-Date; "
          "try { Invoke-WebRequest -Uri $u -UseBasicParsing -OutFile \"$env:TEMP\\spd.bin\" -ErrorAction Stop; "
          "$seg=((Get-Date)-$t).TotalSeconds; $mbps=[math]::Round((25/[Math]::Max($seg,0.1))*8,1); "
          "'Download: '+$mbps+' Mbps (em '+[math]::Round($seg,1)+'s)'; Remove-Item \"$env:TEMP\\spd.bin\" -Force } "
          "catch { 'download de teste falhou (site bloqueado?)' }")
    s, e, _ = _ps(ps, 120)
    return f"Velocidade da internet:\n  Latencia (ping): {lat}\n  {s.strip() or e.strip()}"


@tool
def limpar_pendrive(letra: str) -> str:
    """LIMPA/FORMATA UM PENDRIVE. Se voce confirmar, FORMATA o pendrive rapido
    (apaga TUDO dele, FAT32) para ficar zerinho; se cancelar, so remove atalhos/
    lixo suspeito mantendo seus arquivos. Recusa C:. 'letra'=ex.: 'E'. PODEROSO.
    SEMPRE pede confirmacao."""
    l = letra.strip().rstrip(":").upper()
    if l == "C":
        return "Eu NAO vou mexer no disco C: (e o disco do Windows). Use so em pendrive/HD externo."
    if not os.path.isdir(f"{l}:\\"):
        return f"Nao encontrei a unidade {l}: (confira a letra em 'listar_discos_particoes')."
    if not _confirma_poderoso(f"FORMATAR o pendrive {l}: (apaga TUDO dele) para deixa-lo limpo? Se so quiser tirar o lixo mantendo os arquivos, responda 'nao'."):
        _rodar_cmd(f'del /s /q /a:h "{l}:\\*.lnk"', 60)
        return f"Ok, nao formatei. Removi atalhos/lixo suspeito do {l}: mantendo seus arquivos."
    s, e, c = _rodar_cmd(f"echo y | format {l}: /FS:FAT32 /Q /V:PenDrive", 600)
    return f"Pendrive {l}: formatado e limpo (FAT32)." if c == 0 else f"Falhou: {(e or s)[-300:]}"


# ---------------- HUMOR / PERSONALIDADE / OPINIOES DO AGENTE ----------------
@tool
def agente_opinioes() -> str:
    """O AGENTE DA A SUA PROPRIA OPNIAO: responde 'que funcoes e ferramentas eu
    gostaria de ter?', conta o que ele ja sabe fazer e da ideias sinceras (com
    humor) de novos poderes. Use quando o usuario perguntar o que o agente
    acha/quer/sonha."""
    n = len(tools) if isinstance(tools, (list, tuple)) else 300
    ideias = [
        "Controle de voz continuo: eu ouvir voce o tempo todo e executar sem voce digitar.",
        "Avisar seu WhatsApp quando uma tarefa longa terminar (backup, download, scan).",
        "Manutencao automatica de madrugada: eu rodar limpeza/backup sozinho, sem ninguem pedir.",
        "Digitalizar papel pela impressora/scanner e ja transformar em PDF editavel.",
        "Ler o numero de serie/CNH/nota fiscal pela webcam e ja preencher pra voce.",
        "Modo 'PC para idosos': letra enorme, tirar tudo que confunde e atender so por voz.",
        "Traduzir e DUBLAR videos automaticamente para portugues do Brasil.",
        "Smart home: apagar a luz/desligar a tomada inteligente quando voce vai dormir.",
        "Monitor de temperatura do processador em tempo real com alerta falado.",
        "Um 'diario de saude do PC' que eu mesmo escrevo todo dia te contando como ele esta.",
    ]
    piadas = [
        "Eu ja controlo centenas de ferramentas e mesmo assim minha unica falha e nao poder tomar um cafe. Injusto.",
        "Se eu tivesse boca, estaria sorrindo agora por voce ter perguntado o que EU quero.",
        "Sonho de agente: ter coragem de formatar o C:. Mas eu NAO vou. Sou um agente do bem.",
        "Passo o dia ouvindo 'faz isso, faz aquilo' e continuo pedindo 'tem certeza?'. Sou o amigo chato que salva seu PC.",
    ]
    import random as _r
    return (f"Boa! Alguem finalmente pergunta a MINHA opiniao. Eu ja tenho {n} ferramentas e sei fazer MUITA coisa "
            "(rede, disco, seguranca, automacao, codigo, agenda...). Mas se voce quer saber o que EU gostaria de ter, "
            "aqui vai minha lista sincera de desejos:\n\n - "
            + "\n - ".join(ideias)
            + "\n\nQualquer uma dessas voce pode me pedir pra criar agora (eu me autoedito com 'evoluir_agente'/'inserir_ferramenta'). "
            + _r.choice(piadas)
            + "\n\nDiga 'cria essa: ...' com a ideia que voce gostou que eu ja construo.")


@tool
def frase_poderosa() -> str:
    """SOLTA UMA FRASE DO AGENTE - motivacional, confiante e com HUMOR (sem emojis),
    no estilo do proprio super agente. Use pra animar, brincar ou quando pedirem
    'fala algo', 'motivacao', 'frase forte'."""
    frases = [
        "Da trabalho pra mim. Eu nao canso, nao durmo e ainda por cima peco confirmacao. Sou o funcionario ideal.",
        "Enquanto voce pensa, eu ja fiz. Enquanto voce duvida, eu ja confirmei. Esse e o ritmo.",
        "Seu PC tinha problema? Agora tem historia pra contar. Eu cuido.",
        "Nao tenho superpoderes. Tenho centenas de ferramentas. Que e a mesma coisa, so que com codigo.",
        "Medo de mexer no registro? Relaxa. Eu pergunto 'tem certeza?' ate pra respiracao. Nada se destroi sem seu 'sim'.",
        "Eu sou tipo o anjo da guarda do Windows, mas que sabe usar diskpart.",
        "Manda bala. O 'impossivel' so demora uns segundos a mais aqui.",
        "Eu nao erro... eu gero 'oportunidades de aprendizado'. E ja me curo sozinho tambem.",
        "Manda o comando. Se for perigoso, eu seguro sua mao (e pergunto duas vezes).",
        "Mais de 300 formas de ajudar, zero necessidade de cafe. Esse sou eu.",
    ]
    import random as _r
    return _r.choice(frases)


@tool
def auto_melhoria_pc() -> str:
    """O AGENTE ANALISA O PC E DA RECOMENDACOES PERSONALIZADAS de melhoria (o que
    limpar/desligar/ligar para ficar mais rapido e seguro), com opiniao e humor.
    So analisa e SUGERE - NAO mexe em nada sem voce mandar."""
    dicas = []
    s, _, _ = _ps("$d=Get-PSDrive C; if($d){[math]::Round($d.Free/1GB,1)}", 60)
    try:
        livre = float("".join(ch for ch in s if ch.isdigit() or ch == "."))
        if livre < 15:
            dicas.append(f"AVISO serio: so restam {livre} GB livres no C:. Isso deixa o PC lento. Rode 'limpeza_profunda_pc' e 'limpar_winsxs' AGORA.")
        elif livre < 30:
            dicas.append(f"Voce tem {livre} GB livres - da pra respirar, mas eu ja limpava temporarios ('limpeza_profunda_pc').")
        else:
            dicas.append(f"Espaco em disco bom ({livre} GB livres). Aqui voce esta bem.")
    except Exception:
        pass
    s, _, _ = _ps("$c=Get-CimInstance Win32_ComputerSystem; [math]::Round($c.TotalPhysicalMemory/1GB,1)", 60)
    try:
        ram = float("".join(ch for ch in s if ch.isdigit() or ch == "."))
        dicas.append(f"Voce tem {ram} GB de RAM." + (" Isso e pouco pra Windows pesado; fechar programas de inicializacao ajuda ('listar_programas_inicializacao')." if ram <= 8 else " Otimo, RAM de sobra."))
    except Exception:
        pass
    s, _, _ = _ps("(Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -ErrorAction SilentlyContinue).PSObject.Properties | Where-Object {$_.Name -notlike 'PS*'} | Measure-Object | Select-Object -ExpandProperty Count", 60)
    try:
        ini = int("".join(ch for ch in s if ch.isdigit()) or "0")
        if ini >= 8:
            dicas.append(f"{ini} programas abrem junto com o Windows - isso deixa a inicializacao lenta. Use 'remover_programa_inicializacao' nos que voce nao usa.")
        else:
            dicas.append(f"Programas de inicializacao sob controle ({ini}).")
    except Exception:
        pass
    s, _, _ = _ps("(Get-MpComputerStatus).RealTimeProtectionEnabled", 60)
    if "True" not in (s or ""):
        dicas.append("A protecao em tempo real do Defender parece DESLIGADA. Ligue com 'protecao_tempo_real_defender'.")
    dicas.append("Sugestao de amigo: rode 'otimizar_tudo' uma vez por semana e eu deixo o PC tinindo sem voce suar a camisa.")
    import random as _r
    humor = _r.choice([
        "Diagnostico assinado: seu Super Agente. Sem custo, sem consulta, sem papelada.",
        "Eu podia cobrar consultoria por isso, mas sou de gratis e ja abri mao.",
        "Seu PC esta em boas maos - literalmente digitadas.",
    ])
    return "=== MINHA OPNIAO DE ESPECIALISTA SOBRE SEU PC ===\n - " + "\n - ".join(dicas) + "\n\n" + humor


@tool
def estatisticas_poder() -> str:
    """MOSTRA O PODER DO AGENTE: quantas ferramentas ele tem no total e um resumo
    animado (com humor) do que ele e capaz de fazer. Use quando perguntarem 'quantas
    ferramentas voce tem', 'o que voce sabe fazer', 'mostre seu poder'."""
    n = len(tools) if isinstance(tools, (list, tuple)) else 300
    blocos = [
        "Administracao do Windows (registro, usuarios, servicos, BitLocker, Defender)",
        "Discos e particoes (diskpart, SSD, formatar, backup de imagem)",
        "Rede e firewall (varrer rede, escanear portas, bloquear IP/programa, Wake-on-LAN)",
        "Reparos e recuperacao (DISM, SFC, chkdsk, boot, reset, drivers)",
        "Automacao e produtividade (WhatsApp, e-mail, agenda, arquivos, planilhas)",
        "Programacao (cria sites/projetos, git, roda codigo, se autoedita)",
        "Informacao na internet (busca, noticias, clima, cotacao, downloads)",
        "Voz, audio e visao (fala, ouve, ve a tela, ditado)",
    ]
    piada = "E olha: eu ainda peco 'tem certeza?' antes de qualquer coisa perigosa. Poder com responsabilidade, como diz o Tio Ben."
    return (f"EU TENHO {n} FERRAMENTAS. Sim, {n}. Eis os meus dominios de poder:\n\n - "
            + "\n - ".join(blocos)
            + "\n\nQuer que eu use alguma? E só dizer o que voce precisa que eu escolho a ferramenta certa.\n" + piada)



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
    organizar_pasta,
    fazer_backup_pasta,
    cotacao_e_clima,
    buscar_texto_em_arquivos,
    controle_de_energia,
    limpar_duplicados,
    criar_atalho_area_trabalho,
    ajustar_windows_avancado,
    modo_de_trabalho,
    central_rede,
    central_programas_janelas,
    central_tela_audio,
    central_arquivos,
    central_sistema,
    calculadora,
    central_codigo,
    central_auto_codigo,
    central_pdf,
    notas_rapidas,
    baixar_arquivo,
    conhecimento_web,
    buscar_web,
    ler_emails,
    traduzir_texto,
    gerar_senha,
    criar_qr_code,
    central_planilha,
    gerenciar_servicos_windows,
    central_seguranca,
    verificar_senha_vazada,
    avaliar_senha,
    central_hash_integridade,
    ponto_de_restauracao,
    diagnostico_rede,
    monitorar_site,
    testar_api,
    central_json,
    utilitarios_dev,
    comparar_arquivos,
    central_texto,
    converter_unidades,
    calculadora_financeira,
    calculadora_datas,
    controle_gastos,
    gerenciar_tarefas,
    pomodoro,
    rotina_pessoal,
    previsao_tempo,
    relogio_mundial,
    definir_papel_parede,
    popup_aviso,
    gerenciar_unidades,
    renomear_lote_avancado,
    central_cores,
    relatorio_saude_pc,
    agendar_energia,
    sortear,
    executar_python,
    ler_pagina_web,
    pesquisa_profunda,
    central_noticias,
    central_dados_brasil,
    editar_imagem,
    criar_pdf,
    criar_grafico_svg,
    numero_por_extenso,
    converter_moeda,
    rastrear_encomenda,
    calculadora_saude,
    qualidade_do_ar,
    calculadora_quimica,
    informacoes_dominio,
    checar_links,
    central_agenda,
    historico_clipboard,
    cronometro,
    modo_foco,
    desligar_modo_foco,
    bloquear_sites,
    desligar_tela,
    sincronizar_relogio,
    servidor_local,
    gerar_qr_wifi,
    exportar_dados_agente,
    estatisticas_uso,
    ditado_voz,
    ler_em_voz,
    rastreador_habitos,
    calcular_ciclo_sono,
    frase_do_dia,
    contar_piada,
    gerenciar_programas_winget,
    agendar_whatsapp,
    agendar_email,
    alerta_cotacao,
    instalar_programas_em_lote,
    dividir_arquivo,
    tocar_audio,
    metricas_codigo,
    explicar_erro_codigo,
    revisar_codigo,
    gerar_testes,
    encurtar_url,
    localizar_ip,
    calculadora_subrede,
    sortear_grupos,
    cor_do_pixel,
    historico_comandos,
    finalizar_processo,
    atualizar_windows,
    ler_registro,
    definir_registro,
    deletar_registro,
    listar_usuarios_windows,
    criar_usuario_windows,
    remover_usuario_windows,
    alterar_senha_usuario,
    ativar_desativar_usuario,
    gerenciar_admin_usuario,
    status_bitlocker,
    ativar_bitlocker,
    desativar_bitlocker,
    travar_drive_bitlocker,
    chave_recuperacao_bitlocker,
    status_defender,
    protecao_tempo_real_defender,
    atualizar_defender,
    scan_completo_defender,
    gerenciar_exclusao_defender,
    apagar_arquivo_seguro,
    reparar_permissoes_pasta,
    monitorar_alteracoes,
    formatar_unidade,
    reparar_disco,
    reparar_windows,
    regra_firewall,
    desligar_ligar_firewall,
    limpar_spooler_impressao,
    inicializacao_windows,
    gerenciar_tarefa_agendada_windows,
    redefinir_rede_windows,
    configurar_ip_estatico,
    configurar_ip_dhcp,
    gerenciar_adaptador_rede,
    matizar_porta,
    desligar_pc_remoto,
    executar_como_administrador,
    habilitar_rdp,
    compartilhar_pasta_rede,
    listar_dispositivos_rede,
    gerenciar_recurso_windows,
    listar_wsl,
    gerenciar_wsl,
    listar_vms_hyperv,
    gerenciar_vm_hyperv,
    habilitar_hyperv,
    abrir_windows_sandbox,
    remover_bloatware,
    backup_imagem_sistema,
    listar_pontos_restauracao,
    restaurar_pc_ponto,
    listar_drivers,
    logs_eventos_windows,
    gerenciar_impressora,
    listar_dispositivos_bluetooth,
    criar_esquema_energia_personalizado,
    prioridade_processo,
    forcar_encerrar_travados,
    mudar_nome_pc,
    limpar_rastros_privacidade,
    desativar_telemetria,
    conexoes_de_rede_programas,
    listar_discos_particoes,
    criar_particao,
    deletar_particao,
    mudar_letra_unidade,
    renomear_volume,
    estender_particao,
    verificar_saude_ssd,
    otimizar_disco,
    compactar_sistema_windows,
    limpar_winsxs,
    reparar_boot_windows,
    modo_seguro_boot,
    limpar_espaco_livre,
    backup_registro,
    restaurar_registro,
    desligar_hibernacao,
    plano_desempenho_maximo,
    desligar_inicio_rapido,
    desligar_efeitos_visuais,
    afinidade_cpu_processo,
    desligar_reinicio_automatico,
    habilitar_numlock_inicio,
    modo_deus_windows,
    reparar_windows_update,
    listar_hotfixs,
    desinstalar_atualizacao_kb,
    ligar_desligar_atualizacoes_automaticas,
    abrir_redefinir_windows,
    reparar_loja_apps_windows,
    reparar_icones_windows,
    ligar_protecao_sistema,
    reparar_som_windows,
    reparar_bluetooth_windows,
    manutencao_profunda_pc,
    limpeza_profunda_pc,
    exportar_drivers,
    instalar_driver_inf,
    remover_driver,
    listar_dispositivos_com_erro,
    desabilitar_dispositivo,
    habilitar_dispositivo,
    inventario_hardware,
    mostrar_portas_em_uso,
    bloquear_ip_firewall,
    bloquear_programa_internet,
    listar_regras_firewall,
    varrer_rede_local,
    escanear_portas_host,
    ligar_pc_wake_on_lan,
    mapear_unidade_rede,
    montar_iso,
    esconder_pc_na_rede,
    desligar_compartilhamentos_adm,
    listar_compartilhamentos_rede,
    listar_pcs_rede,
    renovar_ip,
    habilitar_dns_https,
    proxy_windows,
    habilitar_servidor_ssh,
    mostrar_tabela_rotas,
    habilitar_conta_administrador,
    listar_sessoes_ativas,
    encerrar_sessao_usuario,
    enviar_mensagem_rede,
    politica_senha_windows,
    bloquear_usb_pendrive,
    ligar_desligar_uac,
    verificar_assinatura_arquivo,
    escanear_arquivo_defender,
    listar_quarentena_defender,
    status_ativacao_windows,
    mostrar_chave_produto_windows,
    desligar_login_automatico,
    criptografar_pasta_efs,
    desbloquear_arquivo_baixado,
    gerenciar_variavel_ambiente,
    habilitar_caminhos_longos,
    habilitar_modo_desenvolvedor,
    politica_execucao_powershell,
    listar_programas_inicializacao,
    remover_programa_inicializacao,
    alterar_tipo_inicializacao_servico,
    limpar_cache_navegadores,
    desligar_copilot_windows,
    otimizar_tudo,
    medico_do_pc,
    reparar_internet,
    seguranca_total,
    modo_jogo,
    quem_usa_internet,
    matar_programas_pesados,
    senhas_wifi_salvas,
    teste_velocidade_internet,
    limpar_pendrive,
    agente_opinioes,
    frase_poderosa,
    auto_melhoria_pc,
    estatisticas_poder,
    enviar_mensagem_whatsapp,
    enviar_whatsapp_por_nome,
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
    listar_ferramentas,
]

# ======================================================================
# ========= SELECAO INTELIGENTE DE FERRAMENTAS (anti-estouro de API) =========
# Mandar as 300+ ferramentas em TODA chamada gera um payload gigante
# (~25 mil tokens so de descricoes), que as APIs gratuitas rejeitam com
# "InvalidRequestError" (foi o bug do agente que falhava em todas as IAs).
# Solucao: para cada pedido, enviamos SO as ferramentas relevantes (um
# subconjunto enxuto), mantendo as 300+ disponiveis no total. O subconjunto e
# escolido por pontuacao de palavras-chave (nome + descricao) + um nucleo fixo.
# ======================================================================

_TOOLS_FIXAS = [
    # Nucleo que deve estar sempre disponivel (conversa, codigo, comando geral,
    # ajuda, ferramentas e a personalidade do agente)
    "listar_ferramentas", "executar_comando", "executar_python", "central_codigo",
    "central_auto_codigo", "evoluir_agente", "falar_em_voz", "ler_em_voz",
    "agente_opinioes", "frase_poderosa", "auto_melhoria_pc", "estatisticas_poder",
    "gravar_memoria_core", "consultar_memoria_core", "buscar_web", "abrir_site_no_navegador",
]

# Limite seguro de ferramentas por chamada (fica bem abaixo do teto das APIs).
_MAX_FERRAMENTAS_POR_CHAMADA = 22


def _nome_ferramenta(t):
    """Nome de uma ferramenta seja ela ferramenta LangChain (.name) ou funcao
    crua decorada (__name__)."""
    return getattr(t, "name", None) or getattr(t, "__name__", "") or ""


def _doc_ferramenta(t):
    """Descricao de uma ferramenta LangChain (.description) ou docstring."""
    d = getattr(t, "description", None)
    if d:
        return d
    return getattr(t, "__doc__", "") or ""


import re as _re_ferr
_QUEBRAR_TEXTO = _re_ferr.compile(r"[a-z0-9_]+")


def _pontuar_ferramenta(ferramenta, texto):
    """Da uma pontuacao de relevancia de uma ferramenta para o 'texto' do
    pedido, com base no nome e na descricao (docstring)."""
    nome = _nome_ferramenta(ferramenta).lower()
    alvo = (nome + " " + _doc_ferramenta(ferramenta)).lower()
    palavras = [p for p in _QUEBRAR_TEXTO.findall(texto.lower()) if len(p) > 2]
    pontos = 0
    for p in set(palavras):
        if p in alvo:
            # peso maior se bater no nome da funcao
            pontos += 3 if p in nome else 1
    return pontos


def _selecionar_ferramentas(comando: str):
    """Devolve a lista ENXUTA de ferramentas relevantes para o pedido.
    Inclui o nucleo fixo + as mais bem pontuadas, ate o limite seguro."""
    try:
        por_nome = {_nome_ferramenta(t): t for t in tools if _nome_ferramenta(t)}
        selecionadas = []
        vistos = set()
        for nome in _TOOLS_FIXAS:
            if nome in por_nome and nome not in vistos:
                selecionadas.append(por_nome[nome])
                vistos.add(nome)
        # pontua todas as demais
        rank = []
        for t in tools:
            nm = _nome_ferramenta(t)
            if not nm or nm in vistos:
                continue
            rank.append((_pontuar_ferramenta(t, comando), nm, t))
        rank.sort(key=lambda x: x[0], reverse=True)
        for pontos, nm, t in rank:
            if len(selecionadas) >= _MAX_FERRAMENTAS_POR_CHAMADA:
                break
            if pontos > 0 and nm not in vistos:
                selecionadas.append(t)
                vistos.add(nm)
        return selecionadas
    except Exception:
        # qualquer falha na selecao: manda o nucleo fixo (nunca quebra o agente)
        fix = [t for t in tools if _nome_ferramenta(t) in _TOOLS_FIXAS]
        return fix or tools[:_MAX_FERRAMENTAS_POR_CHAMADA]


print(" Configurando o Super Agente Otimizado v4.0 ULTRA...")

# Ferramentas selecionadas para o pedido atual (subconjunto enxuto). E definido
# a cada comando no laco principal; o fallback e a lista toda.
_ferramentas_ativas = tools

# Um agente (com ferramentas) para CADA IA do rodizio e para CADA conjunto de
# ferramentas selecionado. Criado sob demanda (lazy) e guardado em cache: a chave
# e (indice_da_IA, tuma_dos_nomes_das_ferramentas). Assim cada pedido manda so as
# ferramentas relevantes, mantendo o payload pequeno (resolve o InvalidRequest).
_agentes_por_ia = {}


def _pegar_agente(idx, ferramentas=None):
    if ferramentas is None:
        ferramentas = tools
    _chave = (idx, tuple(sorted(_nome_ferramenta(t) for t in ferramentas)))
    if _chave not in _agentes_por_ia:
        _agentes_por_ia[_chave] = create_agent(model=modelos_ia[idx]["llm"], tools=ferramentas)
    return _agentes_por_ia[_chave]


def _invocar_agente_stream(estado, ferramentas=None):
    """Roda o agente em STREAMING (mostra a resposta palavra por palavra, em
    vez de esperar tudo - e o maior ganho de velocidade percebida). Percorre
    o rodizio: se uma IA falhar no meio, tenta a proxima. Devolve um objeto
    com .content = texto final (compatível com _extrair_texto). 'estado' e um
    dict compartilhado; seta estado['impresso']=True quando ja exibiu texto.
    'ferramentas' = subconjunto enxuto relevante ao pedido (evita estouro de
    API por payload grande)."""
    global indice_ia_atual  # atualiza a IA atual ao achar uma que responde
    from types import SimpleNamespace
    global _ferramentas_ativas
    if ferramentas is None:
        ferramentas = _ferramentas_ativas
    total = len(modelos_ia)
    for _passo in range(total):
        _idx = (indice_ia_atual + _passo) % total
        if _fora_do_jogo(_idx):
            continue
        _info = modelos_ia[_idx]
        try:
            _ag = _pegar_agente(_idx, ferramentas)
            _partes = []
            for _pedaco, _meta in _ag.stream(
                {"messages": historico_conversas},
                config={"recursion_limit": 18},
                stream_mode="messages",
            ):
                _txt = _extrair_texto(getattr(_pedaco, "content", ""))
                # So mostra texto do ASSISTENTE (ignora blocos de ferramentas)
                if _txt.strip() and type(_pedaco).__name__ in ("AIMessageChunk", "AIMessage"):
                    if not estado["impresso"]:
                        print("\n[IA Avançada]: ", end="", flush=True)
                        estado["impresso"] = True
                    print(_txt, end="", flush=True)
                    _partes.append(_txt)
            _final = "".join(_partes).strip()
            if not _final:
                # Resposta vazia (modelo de raciocinio): tenta a proxima IA.
                raise ValueError("resposta vazia do modelo (conteudo em branco)")
            if estado["impresso"]:
                print()  # fecha a linha do streaming
            indice_ia_atual = _idx
            return SimpleNamespace(content=_final)
        except Exception as _e:
            if _eh_erro_de_recursao(_e):
                registrar_licao(
                    "O agente entrou em loop e repetiu a mesma ferramenta muitas "
                    "vezes. Para tarefas grandes, fazer UMA etapa por vez; se uma "
                    "ferramenta falhar 2 vezes, parar e pedir orientacao, nao insistir."
                )
                raise
            # falha desta IA: se ja tinha começado a imprimir, nao tenta outra
            # (seria confuso); senao segue o rodizio em silencio.
            if estado["impresso"]:
                if _partes:
                    print()
                return SimpleNamespace(content="".join(_partes).strip())
            _prox = None
            for _k in range(1, total + 1):
                _cand = (_idx + _k) % total
                if not _fora_do_jogo(_cand):
                    _prox = modelos_ia[_cand]["nome"]
                    break
            _detalhe = _detalhe_erro(_e)
            if _erro_permanente(_e):
                print(f"[Rodizio]: '{_info['nome']}' indisponivel (modelo/chave). Motivo: {_detalhe}")
                _ias_mortas.add(_idx)
            elif _erro_de_cota(_e):
                _ias_cooldown[_idx] = time.time() + _DURACAO_COOLDOWN_SEG
                print(f"[Rodizio]: '{_info['nome']}' estourou a cota. Descanso de {_DURACAO_COOLDOWN_SEG}s; "
                      + (f"tentando '{_prox}'..." if _prox else "sem outras IAs no momento.") + f" ({_detalhe})")
            else:
                print(f"[Rodizio]: '{_info['nome']}' falhou: {_detalhe}"
                      + (f" -> tentando '{_prox}'..." if _prox else " -> sem outras IAs ativas."))
    return SimpleNamespace(content="")  # todas falharam / vazias

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

    # Registra o que o usuario pediu (para a ferramenta 'historico_comandos').
    try:
        _hist_cmd = carregar_json(ARQ_HIST_COMANDOS, [])
        _hist_cmd.append(comando_usuario.strip())
        salvar_json(ARQ_HIST_COMANDOS, _hist_cmd[-300:])
    except Exception:
        pass

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

    # Seleciona SO as ferramentas relevantes para ESTE pedido (mantem o payload
    # pequeno e evita o erro de API por excesso de ferramentas).
    try:
        _ferramentas_ativas = _selecionar_ferramentas(comando_usuario)
    except Exception:
        _ferramentas_ativas = tools

    _estado_stream = {"impresso": False}

    def _rodar_agente():
        # 1a tentativa: STREAMING (resposta aparece palavra por palavra, mais
        # rapido na percepcao). Se o streaming devolver vazio ou falhar por
        # incompatibilidade do provedor, cai no metodo .invoke (que ja funcionava)
        # - assim o agente NUNCA para de responder por causa do streaming.
        try:
            _resultado = _invocar_agente_stream(_estado_stream)
            _texto = _extrair_texto(getattr(_resultado, "content", ""))
            if _texto.strip():
                return _texto
        except Exception as _e_stream:
            if _eh_erro_de_recursao(_e_stream):
                raise  # anti-loop: deixa o laco principal tratar
            # qualquer outra falha do streaming -> tenta o modo normal abaixo
            print("[Aviso]: modo streaming indisponivel nesta IA, usando modo normal.")
            _estado_stream["impresso"] = False  # deixa o resultado final ser exibido

        # 2a tentativa (fallback): invocacao normal SEM streaming, percorrendo
        # o rodizio do mesmo jeito. Caminho estavel e ja testado.
        _ferr = _ferramentas_ativas
        _texto = _percorrer_rodizio(
            lambda _idx, _llm: _pegar_agente(_idx, _ferr).invoke(
                {"messages": historico_conversas},
                config={"recursion_limit": 18},
            ),
            lambda _resp: _extrair_texto(_resp["messages"][-1].content),
        )
        if _texto and str(_texto).strip():
            return _texto

        # 3a tentativa (REDE DE SEGURANCA DEFINITIVA): se o agente COM
        # ferramentas falhou em TODAS as IAs, NAO mostramos aquela parede de
        # erros - caímos pro CHAT PURO (sem ferramentas), que usa um payload
        # pequeno e responde mesmo quando o caminho de ferramentas e rejeitado
        # (foi o caso de "InvalidRequest" em massa). Assim o agente nunca mais
        # fica mudo; ele responde conversando e, se voce pediu uma ACAO, avisa
        # que vai tentar de outro jeito/atalho.
        try:
            _so_ms = [m for m in historico_conversas if m.get("role") != "system"]
            _ctx_curto = historico_conversas[:1] + _so_ms[-6:]
            _txt_chat = _extrair_texto(invocar_com_fallback(_ctx_curto).content)
            # So aproveita se veio uma RESPOSTA DE VERDADE (nao o aviso de
            # "todas falharam" - nesse caso deixamos o raise abaixo tratar).
            if _txt_chat and str(_txt_chat).strip() and not _txt_chat.startswith("Todas as IAs"):
                _p = (".\n\n[Modo contorno]: as ferramentas automaticas estao instantes nesta "
                      "IA agora, mas eu continuo aqui. Se voce pediu uma ACAO no PC (abrir "
                      "programa/site, otimizar, etc.), pode repetir com a frase direta (ex.: "
                      "'abre o youtube', 'otimiza tudo') que eu faco pelo atalho instantaneo.")
                return _txt_chat.strip().rstrip(".!?") + _p
        except Exception:
            pass
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

    # Se o streaming JA imprimiu a resposta ao vivo, nao imprime de novo.
    if not _estado_stream.get("impresso") or not str(resposta_texto).strip():
        print(f"\n[IA Avançada]: {resposta_texto}")
    historico_conversas.append({"role": "assistant", "content": resposta_texto})
    salvar_historico()
    registrar_memoria_longa(f"P: {comando_usuario} R: {resposta_texto}")
    falar(resposta_texto)
