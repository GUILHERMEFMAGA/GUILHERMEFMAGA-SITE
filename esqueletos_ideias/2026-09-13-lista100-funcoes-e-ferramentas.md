# LISTA DAS 100 — 50 funções + 50 ferramentas do DIA A DIA (2026-09-13)

**SÓ PROPOSTA — NADA disto foi implementado** (exceto a nº 50, que virou a r73 de hoje ✅).
100% IA LOCAL, zero nuvem obrigatória, nada de memória LP (regra r33), tudo com kill-switch.
**Como pedir:** escolha os números e diga aqui no chat, ex.: *"coloca a 3, a 22 e a 63"*.
Antes de implementar qualquer item, roda a pre-checagem anti-colisão de sempre (r30/esqueleto
analisa as 513 ferramentas existentes e bloqueia duplicata — automático).

## FUNÇÕES — rotinas vivas do agente (1–50)
1 **Rotina do bom dia** — ao abrir de manhã: lembretes do dia, tarefas pendentes e frasedodia em 4 linhas
2 **Modo foco** — lista o que está aberto no PC, você escolhe o que fechar, ele fecha
3 **Hábitos com sequência** — marca ✓ todo dia e mostra a ofensiva (dias seguidos) | `habito beber agua`
4 **Lembretes por tempo** — "me lembre em 2 horas de tirar o bolo" (avisa na tela do agente)
5 **Lembretes por data** — "me lembre dia 20 de pagar a internet"
6 **Diário guiado da noite** — 3 perguntas rápidas e guarda no SEU PC | `diario de hoje`
7 **Resumo da semana** — domingo: o que você fez, ensinou e pediu na semana | `resumo da semana`
8 **Contador "dias sem X"** — cigarro, doces... com recorde histórico | `dias sem cigarro`
9 **Meta de água do dia** — meta em copos, marca cada um, comemora ao bater | `meta de agua 8`
10 **Tarefas do dia com prioridades** — 3 níveis e "arrasta pra amanhã" o que não deu | `tarefas`
11 **Mesa de decisão** — prós e contras que VOCÊ dita; ele tabula e guarda a decisão | `decidir trocar de emprego`
12 **"Frase do meu dia"** — uma linha por dia; no fim do ano vira o livro do seu ano | `frase do dia: ...`
13 **Pausa guiada** — respiração 4-4-4 com timer na tela | `pausa`
14 **Planejamento de domingo** — 5 perguntas e ele monta a sua semana | `planejar semana`
15 **Alarme do PC** — toca som em X minutos com o agente aberto | `acorde me em 20 minutos`
16 **Timers de cozinha nomeados** — vários ao mesmo tempo | `timer bolo 40 min`
17 **Contagem regressiva** — viagem, prova, festa; "faltam X dias" na abertura | `contagem viagem 10/12`
18 **Notas de bolso** — nota de 1 linha com busca instantânea | `nota: chave reserva no fogao`
19 **Frase do dia local** — banco de frases BR no PC, uma por abertura | `outra frase`
20 **Diário de treino** — exercício/série/repetição + progresso da semana | `treinei supino 3x10`
21 **Termômetro do dia** — de 0 a 10 como você está; gráfico de texto do mês | `meu dia foi 7`
22 **Gastos por voz de bolso** — "gastei 35 no mercado" entra na lista do mês | `gastei 35 mercado`
23 **Alerta de contas** — vencimentos; a abertura avisa o que vence em 3 dias | `conta luz dia 15`
24 **Calculadora de parcela** — à vista vs parcelado com números que você passar | `parcela 1200 em 10x`
25 **Cofrinho de meta** — "juntar 2000": quanto pôs, quanto falta, previsão | `meta 2000 viagem`
26 **Caderno do "quem deve"** — nome, valor, data; baixa quando pagar | `joao me deve 50`
27 **Lista de mercado que se monta sozinha** — você avisa o que acabou, ela cresce | `acabou cafe`
28 **Comparador de preço anotado** — "arroz A 5,00 B 4,60" → diz onde é mais barato
29 **Quanto sobra no mês** — salário − contas fixas, previsto | `quanto sobra`
30 **Caderno do carro** — abastecimentos + consumo médio km/l automático | `abasteci 100 reais`
31 **Manutenção por km/data** — óleo etc. com aviso na hora certa | `oleo em 5000km`
32 **Agenda da família** — compromisso por pessoa | `o que a ana tem hoje?`
33 **Lista de presentes por pessoa** — ideias salvas o ano todo | `ideia presente mae: ...`
34 **Rotação de refeições** — o que cozinhou em 7 dias; sugere o que não repetiu | `cozinhei lasanha`
35 **Cardápio da semana** — monta o cardápio e GERA a lista de mercado | `cardapio da semana`
36 **Revisão espaçada** — o que você ensinou volta em 1 dia/1 semana/1 mês | `revisar aprendizado`
37 **Simulado com nota** — ele pergunta das SUAS anotações e dá nota no fim | `simulado`
38 **Cronômetro de estudo por matéria** — tempo de cada uma na semana | `estudando matematica`
39 **Explicador "pra criança de 10 anos"** — cola qualquer assunto, explicação simples | `explique simples fotossintese`
40 **Dicionário pessoal** — toda palavra que você busca fica no caderno | `o que significa serendipidade`
41 **Gerador de senha forte falável** — sílabas fáceis de dizer no telefone | `senha forte`
42 **Medidor de força de senha** — fraca/média/forte e o porquê | `testa senha cachorro123`
43 **Álbuns por mês** — move fotos novas pra pasta AAAA-MM sozinho | `albuns de fotos`
44 **Amigo do notebook** — avisa bateria: 100% "pode tirar da tomada", 20% "põe" | `cuida da bateria`
45 **Histórico de temperatura** — registra por dia; "a temperatura subiu essa semana?"
46 **Limpeza leve agendada** — 1x/semana pergunta se quer esvaziar temporários/lixeira | `limpeza leve`
47 **Inventário do PC** — programas + tamanho, em lista legível | `inventario`
48 **Modo apresentação** — deixa só o que você vai usar na frente | `modo apresentacao`
49 **Cápsula do tempo** — carta pro seu futuro eu, abre na data marcada | `capsula dia 10/10: ...`
50 **BOAS-VINDAS DE VOLTA** — o agente percebe sua falta e sauda com o estado do cérebro ✅ **[ESTA FOI IMPLEMENTADA HOJE — virou a r73!]**

## FERRAMENTAS — comandos de ação (51–100)
51 **lista compras** — adicionar, listar, riscar, imprimir | `lista compras adiciona cafe`
52 **carteira** — tudo que entrou/saiu anotado; saldo do mês em texto | `carteira do mes`
53 **divide a conta** — valor + gente → quanto por cabeça (gorjeta opcional) | `divide 180 por 4`
54 **conversor de cozinha** — xícara→ml, grama→colher, °C→°F | `3 xicaras em ml`
55 **conversor do dia a dia** — metro↔pé, km↔milha, litro↔galão | `10 km em milhas`
56 **conversor de moeda fixa** — VOCÊ anota a cotação; ele converte sempre por ela (sem nuvem) | `cotacao 5,30` → `80 dolares`
57 **tinta** — m² da parede + demãos → litros de tinta | `tinta 4x3 com 2 demaos`
58 **piso** — metro do cômodo → caixas de piso + 10% de sobra | `piso 3x4`
59 **racao** — peso do pet → porção do dia (tabela local) | `racao rex 12kg`
60 **carteirinha do pet** — vacinas/vermífugo + próxima data | `vacinei rex hoje`
61 **registro de pressão/glicose** — anota e mostra a média da semana (REGISTRO; nunca é conselho médico) | `pressao 12/8`
62 **remédio** — horários do dia + confirmação "tomei" com sequência | `remedio das 8h`
63 **contatos de emergência** — lista que abre em 1 comando | `emergencia`
64 **cartão do wifi** — nome/senha em texto pronto pra imprimir ou colar | `cartao do wifi`
65 **senha do wifi falável** — gera senha fácil de falar | `senha do wifi nova`
66 **armário congelador** — o que congelou e desde quando, mais velho primeiro | `congelei carne hoje`
67 **validade** — "vence dia X"; abertura avisa o que está vencendo | `iogurte vence dia 18`
68 **lista de filmes** — quero ver / já vi, com SUA nota | `quero ver fiction: filme`
69 **onde parei** — série + episódio; "continuei" avança | `onde parei a serie X`
70 **playlist por humor** — seus arquivos de música por etiqueta | `playlist descanso`
71 **achei foto** — busca por pasta/mês aproximado | `achei foto praia 2024`
72 **fotos pro zap** — redimensiona em lote, do tamanho certo | `fotos pro zap`
73 **extrai áudio** — vídeo → mp3 (usa o que o PC tiver instalado) | `extrai audio video.mp4`
74 **junta/separa PDF** — junta vários ou tira páginas | `junta pdf`
75 **carimbo** — renomeia arquivos com AAAA-MM-DD na frente | `carimbo fotos`
76 **estante de livros** — o que tenho, li/não li, emprestei pra quem | `emprestei dom casmurro pra ana`
77 **lista de desejos** — com prioridade e preço anotado | `desejo fone 250`
78 **caderno da casa** — consertos: lâmpada, goteira; "consertado?" fecha | `goteira na sala`
79 **minhas plantas** — quando reguei cada uma + lembrete | `reguei a samambaia`
80 **encomendas** — código + status; "cadê minha encomenda?" | `encomenda xxxBR`
81 **placar dos jogos** — resultado dos jogos com os amigos | `perdemos 3 a 2 ontem`
82 **sorteio** — sorteia nome(s) da sua lista | `sorteia 1 de: ana,bia,joao`
83 **moeda** — cara ou coroa honesta, local | `moeda`
84 **amigo secreto** — sorteia a lista toda sem repetir e guarda | `amigo secreto ana,bia,joao,cris`
85 **checklist de viagem** — mala pronta por categoria, reusa na próxima | `checklist viagem`
86 **churrasco** — N adultos + M crianças → carne/pão/gelo | `churrasco 10 adultos 4 criancas`
87 **agradecimentos** — presente recebido → já agradeceu? | `ganhou piscina da mae`
88 **caderno de receitas** — salva SUAS receitas; busca por ingrediente | `receita com frango`
89 **agenda simples** — "dia 20 15h barbeiro"; "o que tenho hoje?" | `dia 20 15h barbeiro`
90 **regador de ideias** — revisa o jardim r68 e retoma ideias paradas | `regar ideias`
91 **etiquetas** — endereços em texto pronto pra imprimir | `etiqueta para tia joana`
92 **quiz da família** — perguntas do que a FAMÍLIA ensinou ao agente (de festa!) | `quiz da familia`
93 **linha do tempo** — "o que eu estava fazendo em março?" pelos seus registros | `linha do tempo marco`
94 **boleto anotado** — linha digitável + vencimento, busca rápida | `boleto luz`
95 **termômetro do PC** — temperatura agora + pico do dia | `termometro`
96 **crescimento de pastas** — quanto cada pasta grande cresceu desde a marca | `marca pastas` / `cresceram`
97 **modo convidado** — esconde notas/listas quando alguém for usar o PC | `modo convidado`
98 **vapt vupt do PC** — 5 checagens em 10 segundos (disco, temp, rede, lixeira, atualização) | `vapt vupt`
99 **manual da casa** — instruções que VOCÊ escreve (onde fecha a água, quadro do som) | `manual da casa: agua: registro no quintal`
100 **herança digital** — lista do que a família deve saber (contas, papéis) — guardada SÓ no seu PC | `heranca: ...`

---
*Padrões da casa valem pra tudo: kill-switch na config, backup antes de mexer, honestidade quando não souber, cerebro.json guarda o que você ensinar, e a suíte de testes cresce junto.*
