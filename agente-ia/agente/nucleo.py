"""
nucleo.py -- O CÉREBRO do agente: junta tudo e decide o que fazer.

Fluxo de uma mensagem sua:

    "salve uma nota dizendo que estudei 2 horas"
                    |
                    v
    [1] ENTENDER ....... procura padrões e pergunta à rede neural qual é a intenção
                    |
                    v
    [2] DECIDIR ........ escolhe a rota: ferramenta? conhecimento? conversa? memória?
                    |
                    v
    [3] AGIR ........... executa a ferramenta ou busca a resposta
                    |
                    v
    [4] RESPONDER ...... monta a resposta e guarda tudo na memória

Esse é o padrão usado por agentes de verdade no mercado:
ENTENDER -> DECIDIR -> AGIR -> OBSERVAR -> RESPONDER.
"""

import json
import os
import random
import re
import time

from .conhecimento import BaseDeConhecimento
from .gerador import montar_gerador
from .memoria import Memoria
from .rede_neural import RedeNeural
from .texto import Vetorizador, escolher, sem_acento, tokenizar
from . import ferramentas, orquestrador

NOME = "NÚCLEO"          # troque aqui se quiser dar outro nome ao seu agente
VERSAO = "1.0"


# ---------------------------------------------------------------------------
class Agente:
    def __init__(self, pasta_base: str = None, silencioso: bool = False):
        self.pasta_base = os.path.abspath(pasta_base or os.path.join(os.path.dirname(__file__), ".."))
        self.pasta_dados = os.path.join(self.pasta_base, "dados")
        self.silencioso = silencioso

        os.makedirs(self.pasta_dados, exist_ok=True)

        self.memoria = Memoria(os.path.join(self.pasta_dados, "memoria.db"))
        self.conhecimento = BaseDeConhecimento(os.path.join(self.pasta_dados, "conhecimento.json"))
        self.gerador = montar_gerador(self.pasta_dados)

        self.vetorizador = None
        self.rede = None
        self.carregou_cerebro = False
        self.historico_erro = []

        self._carregar_cerebro()
        if not self.carregou_cerebro and not self.silencioso:
            print("Primeira execução: preciso treinar o cérebro (leva alguns segundos)...")
        if not self.carregou_cerebro:
            self.treinar()

    # ==================================================================
    # TRENO
    # ==================================================================
    def _caminhos(self) -> dict:
        return {
            "treino": os.path.join(self.pasta_dados, "treino.jsonl"),
            "pesos": os.path.join(self.pasta_dados, "cerebro_rede.json"),
            "vocabulario": os.path.join(self.pasta_dados, "cerebro_vocabulario.json"),
        }

    def _ler_exemplos(self) -> list:
        caminho = self._caminhos()["treino"]
        exemplos = []
        with open(caminho, "r", encoding="utf-8") as arquivo:
            for linha in arquivo:
                linha = linha.strip()
                if not linha or linha.startswith("#"):
                    continue
                exemplos.append(json.loads(linha))
        return exemplos

    def treinar(self, epocas: int = 350, mostrar_progresso: bool = True) -> dict:
        """Treina a rede do zero com os exemplos de dados/treino.jsonl."""
        inicio = time.time()
        exemplos = self._ler_exemplos()
        if not exemplos:
            raise RuntimeError("Não encontrei exemplos em dados/treino.jsonl")

        textos = [exemplo["texto"] for exemplo in exemplos]
        intencoes = sorted({exemplo["intencao"] for exemplo in exemplos})

        vetorizador = Vetorizador(max_palavras=400)
        vetorizador.aprender(textos)

        entradas = vetorizador.transformar_varias(textos)
        alvos = []
        for exemplo in exemplos:
            linha = [0.0] * len(intencoes)
            linha[intencoes.index(exemplo["intencao"])] = 1.0
            alvos.append(linha)

        n_ocultos = 24
        rede = RedeNeural(len(vetorizador.vocabulario), n_ocultos, len(intencoes), semente=42)
        rede.classes = intencoes

        def progresso(epoca, total, erro):
            if mostrar_progresso:
                print(f"  época {epoca:>4}/{total}  erro {erro:.4f}")

        self.historico_erro = rede.treinar(
            entradas, alvos, epocas=epocas, taxa_aprendizado=0.08,
            momento=0.9, tamanho_lote=8, mostrar_progresso=progresso,
        )

        acuracia = rede.avaliar(entradas, alvos)
        rede.salvar(self._caminhos()["pesos"])
        vetorizador.salvar(self._caminhos()["vocabulario"])

        self.rede = rede
        self.vetorizador = vetorizador
        self.carregou_cerebro = True

        duracao = round(time.time() - inicio, 2)
        resumo = {
            "exemplos": len(exemplos),
            "intencoes": len(intencoes),
            "vocabulario": len(vetorizador.vocabulario),
            "acuracia_no_treino": round(acuracia * 100, 1),
            "erro_final": round(self.historico_erro[-1], 4) if self.historico_erro else None,
            "duracao_segundos": duracao,
        }
        if not self.silencioso:
            print(f"  Cérebro treinado: {resumo['intencoes']} intenções, "
                  f"{resumo['acuracia_no_treino']}% de acerto no treino, {duracao}s")
        return resumo

    def _carregar_cerebro(self) -> None:
        caminhos = self._caminhos()
        if os.path.exists(caminhos["pesos"]) and os.path.exists(caminhos["vocabulario"]):
            try:
                self.rede = RedeNeural.carregar(caminhos["pesos"])
                self.vetorizador = Vetorizador.carregar(caminhos["vocabulario"])
                self.carregou_cerebro = True
            except Exception:
                self.carregou_cerebro = False

    # ==================================================================
    # 1) ENTENDER
    # ==================================================================
    REGRAS = [
        # (nome da rota, expressão regular, dica)
        ("aprender_sobre_usuario",
         r"\b(meu nome (e|eh)|eu me chamo|pode me chamar de|eu moro em|eu sou de|"
         r"eu gosto de|eu amo|eu trabalho com|minha profis|meu objetivo|meu projeto)\b",
         "guarda um fato sobre você"),

        ("recuperar_memoria",
         r"\b(qual (e|eh) (o )?meu nome|como eu me chamo|o que voce sabe sobre mim|"
         r"o que vc sabe sobre mim|minhas informacoes|minha cidade|meus dados|"
         r"o que voce lembra|lembra de mim)\b",
         "busca na memória longa"),

        ("data_hora",
         r"\b(que horas|horas sao|que dia (e|eh)|data de hoje|hoje e que dia|dia de hoje)\b",
         "olha o relógio do computador"),

        ("salvar_arquivo",
         r"\b(salve|crie|escreva|anote|guarde|gera) .{0,40}(arquivo|nota|txt|anotacao|documento)\b",
         "escreve em dados/saidas"),

        ("ler_arquivo", r"\b(leia|le|mostre|abra|o que tem) .{0,25}(arquivo|nota|txt|anotacao)\b",
         "lê um arquivo salvo"),

        ("listar_arquivos", r"\b(liste|listar|quais) .{0,20}(arquivos|criou|salvou)\b",
         "lista o que já foi salvo"),

        ("resumir", r"\b(resuma|resumo|sintetize)\b", "resume um texto"),
        ("analisar_texto", r"\b(analise|analisa|conte as palavras|estatistica do texto)\b",
         "conta palavras e repeticoes"),

        ("criar_texto", r"\b(invente|crie uma frase|improvise|gere um texto|"
                        r"frase criativa|texto aleatorio|surpreenda)\b",
         "gera texto com a cadeia de Markov"),

        ("listar_fluxos", r"\b(liste|listar|quais|mostre) .{0,20}(fluxos|automacoes|rotinas)\b",
         "mostra as automações"),
        ("executar_fluxo", r"\b(rode|executar|executa|rodar|dispare) .{0,15}(fluxo|automacao|rotina)\b",
         "executa uma automação"),

        ("ler_pagina", r"(https?://\S+)", "lê uma página da internet"),
        ("info_sistema", r"\b(configuracao|configuracoes|infos? do sistema|informacoes do sistema|"
                         r"dados do sistema|dados da maquina|versao do python|meu sistema|"
                         r"meu computador|minha maquina)\b", "mostra dados da máquina"),
        ("reconhecimento", r"\b(aprendeu|treinou|acuracia|estatisticas do agente|como vai o treino)\b",
         "mostra o desempenho da rede"),
    ]

    # Limites que controlam a decisão (mexa neles e veja o que muda!)
    LIMITE_CONHECIMENTO_FORTE = 1.75   # nota da base de conhecimento que vence a rede neural
    LIMITE_CONHECIMENTO_MINIMO = 1.00  # abaixo disso, nem a base de conhecimento responde
    LIMITE_CONFIANCA_REDE = 0.60       # a rede precisa ter pelo menos essa certeza
    LIMITE_COBERTURA = 0.75            # % de palavras que a rede conhece para confiar nela

    NOMES_BONITOS = {
        "saudacao": "uma saudação",
        "despedida": "uma despedida",
        "agradecimento": "um agradecimento",
        "elogio": "um elogio",
        "xingamento": "uma reclamação",
        "quem_e_voce": "uma pergunta sobre mim",
        "ajuda": "um pedido de ajuda",
        "capacidades": "uma pergunta sobre o que eu sei fazer",
        "humor": "um pedido de piada",
        "motivacao": "um pedido de motivação",
        "tempo_ou_tedio": "um pedido de sugestão",
        "sim": "uma confirmação",
        "nao": "uma negativa",
    }

    def entender(self, texto: str) -> dict:
        """
        Descobre a intenção. Devolve um dicionário explicando a decisão.

        A ordem importa:
          1) regras explícitas (certeza total)
          2) base de conhecimento FORTE (o assunto é claro)
          3) rede neural, mas só se ela conhecer bem as palavras
          4) base de conhecimento fraca (palpite)
          5) não sei (honestidade)
        """
        normalizado = sem_acento(texto.lower()).strip()
        analise = {
            "texto_original": texto,
            "texto_normalizado": normalizado,
            "rota": None,
            "detalhe": "",
            "confianca": 1.0,
            "intencao": None,
            "ranking": [],
            "palpite": None,
        }

        # --- 1) Regras explícitas (rápidas e certeiras) ---
        for rota, padrao, dica in self.REGRAS:
            achado = re.search(padrao, normalizado)
            if achado:
                analise["rota"] = rota
                analise["detalhe"] = f"regra explícita: {dica}"
                analise["achado"] = achado.group(0)
                return analise

        # Conta de matemática: precisa ter número + operador ou palavra de conta.
        tem_numero = re.search(r"\d", normalizado)
        tem_operador = re.search(r"[\d)\s][\+\-\*/x\^]|quanto (e|eh)|calcule|some|soma|"
                                 r"multiplique|divida|por cento|%", normalizado)
        if tem_numero and tem_operador:
            analise["rota"] = "calculo"
            analise["detalhe"] = "regra explícita: calculadora segura (sem eval)"
            return analise

        # --- 2) Base de conhecimento forte ---
        topico, nota = self.conhecimento.procurar(texto)
        if topico and nota >= self.LIMITE_CONHECIMENTO_FORTE:
            analise["rota"] = "conhecimento"
            analise["confianca"] = round(min(1.0, nota / 3), 3)
            analise["detalhe"] = f"base de conhecimento forte: '{topico['titulo']}' (nota {nota:.2f})"
            analise["topico"] = topico
            return analise

        # --- 3) Rede neural (aprendida com exemplos) ---
        probabilidades_rede = None
        if self.rede and self.vetorizador:
            vetor = self.vetorizador.transformar(texto)
            if any(vetor):
                palavras = tokenizar(texto)
                vocabulario = set(self.vetorizador.vocabulario)
                # Cobertura: quantas palavras da frase a rede já viu no treino?
                conhecidas = sum(1 for palavra in palavras if palavra in vocabulario)
                cobertura = conhecidas / max(1, len(palavras))

                probabilidades = self.rede.prever(vetor)
                pares = sorted(
                    zip(self.rede.classes, probabilidades), key=lambda par: -par[1]
                )
                analise["ranking"] = [(classe, round(prob, 3)) for classe, prob in pares[:3]]
                analise["cobertura"] = round(cobertura, 2)
                melhor_intencao, melhor_prob = pares[0]
                analise["palpite"] = (melhor_intencao, round(melhor_prob, 3))

                # Regra de confiança:
                #   - ou a rede conhece quase todas as palavras e tem boa certeza;
                #   - ou tem quase certeza total e conhece pelo menos uma palavra
                #     (é o caso de "conte uma piada": 'conte' é nova, 'piada' ela conhece).
                confiavel = (melhor_prob >= self.LIMITE_CONFIANCA_REDE
                             and cobertura >= self.LIMITE_COBERTURA)
                muito_confiavel = melhor_prob >= 0.85 and conhecidas >= 1

                if confiavel or muito_confiavel:
                    analise["rota"] = "conversa"
                    analise["intencao"] = melhor_intencao
                    analise["confianca"] = round(melhor_prob, 3)
                    analise["detalhe"] = (f"rede neural confiante: intenção '{melhor_intencao}' "
                                          f"({melhor_prob:.0%}), cobertura de vocabulário {cobertura:.0%}")
                    return analise

                motivos = []
                if melhor_prob < self.LIMITE_CONFIANCA_REDE:
                    motivos.append(f"certeza baixa ({melhor_prob:.0%})")
                if cobertura < self.LIMITE_COBERTURA:
                    motivos.append(f"ela não conhece {100 - int(cobertura * 100)}% das palavras")
                analise["detalhe"] = (f"rede neural sem confiança para '{melhor_intencao}': "
                                      + " e ".join(motivos))
            else:
                analise["detalhe"] = "nenhuma palavra conhecida pelo cérebro"

        # --- 4) Base de conhecimento fraca ---
        if topico and nota >= self.LIMITE_CONHECIMENTO_MINIMO:
            analise["rota"] = "conhecimento"
            analise["confianca"] = round(min(1.0, nota / 3), 3)
            analise["detalhe"] = f"base de conhecimento (nota moderada {nota:.2f}): '{topico['titulo']}'"
            analise["topico"] = topico
            return analise

        # --- 5) Honestidade ---
        analise["rota"] = "nao_sei"
        analise["confianca"] = 0.0
        analise["detalhe"] = (f"melhor nota na base de conhecimento: {nota:.2f} "
                              f"(precisa de {self.LIMITE_CONHECIMENTO_MINIMO})")
        return analise

    # ==================================================================
    # 2) AGIR + RESPONDER
    # ==================================================================
    def responder(self, texto: str, raio_x: bool = False) -> dict:
        inicio = time.time()
        analise = self.entender(texto)
        rota = analise["rota"]
        resposta = ""
        extra = {}

        # ---------- memória: aprender ----------
        if rota == "aprender_sobre_usuario":
            aprendido = self.memoria.aprender_com_a_frase(texto)
            if aprendido:
                chave, valor = aprendido.split("=", 1)
                resposta = escolher([
                    f"Anotado! Vou lembrar que {chave} é {valor}. ✅",
                    f"Guardei na memória: {chave} = {valor}. Pode me perguntar depois.",
                    f"Legal, {valor}! Já registrei isso no meu banco de dados local.",
                ])
            else:
                resposta = ("Entendi que você quer que eu guarde algo, mas não peguei o dado. "
                            "Tente: 'meu nome é Guilherme' ou 'eu gosto de programar'.")

        # ---------- memória: recuperar ----------
        elif rota == "recuperar_memoria":
            fatos = self.memoria.todos_os_fatos()
            if not fatos:
                resposta = ("Ainda não sei nada sobre você. Me conte algo assim: "
                            "'meu nome é ...' ou 'eu gosto de ...'")
            else:
                linhas = [f"- {chave}: {valor}" for chave, valor in fatos]
                resposta = "Isso é o que eu guardei de você:\n" + "\n".join(linhas)
            extra["fatos"] = len(fatos)

        # ---------- ferramentas ----------
        elif rota == "data_hora":
            resposta = ferramentas.data_hora()

        elif rota == "calculo":
            expressao = self._extrair_expressao(texto)
            resposta = ferramentas.calcular(expressao)
            extra["expressao"] = expressao

        elif rota == "salvar_arquivo":
            nome, conteudo = self._extrair_arquivo_e_conteudo(texto)
            resposta = ferramentas.salvar_arquivo(nome, conteudo)
            extra["arquivo"] = nome

        elif rota == "ler_arquivo":
            nome = self._extrair_nome_arquivo(texto)
            resposta = ferramentas.ler_arquivo(nome)

        elif rota == "listar_arquivos":
            resposta = ferramentas.listar_arquivos()

        elif rota == "analisar_texto":
            resposta = ferramentas.analisar_texto(texto)

        elif rota == "resumir":
            resposta = ferramentas.resumir(texto)

        elif rota == "info_sistema":
            resposta = ferramentas.info_sistema()

        elif rota == "criar_texto":
            criado = self.gerador.surpreender(20)
            resposta = ("Frase inventada pelo meu gerador de Markov "
                        "(não é IA gigante, é estatística de palavras):\n\n"
                        f'   "{criado}"')

        elif rota == "listar_fluxos":
            resposta = orquestrador.listar_fluxos(self.pasta_dados)

        elif rota == "executar_fluxo":
            nome = self._extrair_nome_fluxo(texto)
            fluxo = orquestrador.buscar_fluxo(self.pasta_dados, nome) if nome else None
            if fluxo:
                relatorio = orquestrador.executar_fluxo(fluxo, silencioso=True)
                linhas = [f"   {item['passo']}. {item['acao']}: {item['resultado'][:90]}"
                          for item in relatorio["registro"]]
                resposta = (f"Rodei o fluxo '{fluxo.nome}' em {relatorio['duracao']}s. "
                            f"O que aconteceu:\n" + "\n".join(linhas))
                extra["fluxo"] = fluxo.nome
            else:
                resposta = ("Não achei esse fluxo. Os disponíveis são:\n"
                            + orquestrador.listar_fluxos(self.pasta_dados))

        elif rota == "ler_pagina":
            url = analise.get("achado", "")
            if not url:
                achado = re.search(r"https?://\S+", texto)
                url = achado.group(0) if achado else ""
            resposta = ferramentas.ler_pagina(url)

        elif rota == "reconhecimento":
            resposta = self.estatisticas_como_texto()

        # ---------- conversa (intenções aprendidas pela rede) ----------
        elif rota == "conversa":
            resposta = self._resposta_de_conversa(analise["intencao"])

        # ---------- conhecimento ----------
        elif rota == "conhecimento":
            topico = analise["topico"]
            resposta = (f"{topico['resposta']}\n\n"
                        f"(peguei isso do meu arquivo de conhecimento: {topico['titulo']})")
            extra["fonte"] = topico.get("fonte", "")

        # ---------- não sabe ----------
        else:
            resposta = self._resposta_nao_sei(texto, analise)

        # ---------- memória curta ----------
        self.memoria.anotar("humano", texto)
        self.memoria.anotar(NOME.lower(), resposta)

        resultado = {
            "resposta": resposta,
            "rota": rota,
            "intencao": analise.get("intencao"),
            "confianca": analise.get("confianca"),
            "detalhe_da_decisao": analise.get("detalhe", ""),
            "ranking_intencoes": analise.get("ranking", []),
            "tempo_ms": int((time.time() - inicio) * 1000),
            "extra": extra,
        }
        if raio_x:
            resultado["raio_x"] = analise
        return resultado

    # ------------------------------------------------------------------
    # Conversa: respostas prontas por intenção (com variedade)
    # ------------------------------------------------------------------
    def _resposta_de_conversa(self, intencao: str) -> str:
        nome_usuario = self.memoria.recuperar("nome")
        tratamento = f", {nome_usuario}" if nome_usuario else ""

        banco = {
            "saudacao": [
                f"Olá{tratamento}! Sou o {NOME}, seu agente rodando 100% no seu computador.",
                f"Oi{tratamento}! Estou pronto. Pode perguntar ou pedir uma tarefa.",
                f"Olá! Rede neural ligada, memória carregada, ferramentas na mão. No que vamos trabalhar?",
            ],
            "despedida": [
                f"Até logo{tratamento}! Vou ficar aqui, guardado no seu Python.",
                "Tchau! Seu histórico e a memória de fatos ficam salvos no arquivo dados/memoria.db.",
            ],
            "agradecimento": [
                "Por nada! Estou aprendendo junto com você.",
                "Eu que agradeço! Isso aqui é seu: código aberto, sem nuvem, sem cobrança.",
            ],
            "elogio": [
                "Valeu! Mas lembra: eu sou pequeno. Quem é grande é a sua curiosidade.",
                "Obrigado! Fico melhor cada vez que você me dá mais exemplos de treino.",
            ],
            "xingamento": [
                "Reconheço o tom, mas sigo ajudando. Quer tentar reformular o pedido?",
                "Sem problema. Me diga o que você precisa de verdade e eu resolvo.",
            ],
            "quem_e_voce": [
                f"Eu sou o {NOME} v{VERSAO}: um agente com rede neural, memória e ferramentas, "
                f"tudo escrito em Python puro, sem API paga e sem Ollama.\n"
                f"  • Cérebro: rede neural MLP treinada aqui no seu PC\n"
                f"  • Memória: SQLite (curta + fatos sobre você)\n"
                f"  • Ferramentas: {len(ferramentas.CATALOGO)} ações (conta, arquivos, texto...)\n"
                f"  • Automação: {len(orquestrador.carregar_fluxos(self.pasta_dados))} fluxos no estilo n8n",
            ],
            "ajuda": [
                "Claro! Coisas que eu faço agora:\n"
                "  • Contas: 'quanto é (25*4)+10'\n"
                "  • Arquivos: 'salve uma nota chamada diario.txt com: hoje avancei'\n"
                "  • Texto: 'analise: ...' ou 'resuma: ...'\n"
                "  • Memória: 'meu nome é ...', 'o que você sabe sobre mim?'\n"
                "  • Automação: 'liste os fluxos', 'rode o fluxo bom_dia'\n"
                "  • Criativo: 'invente uma frase'\n"
                "  • Aprender: 'como funciona o backpropagation?'\n"
                "Digite /ajuda dentro do chat para ver os comandos especiais.",
            ],
            "capacidades": [
                "Posso conversar, calcular, mexer em arquivos na pasta dados/saidas, "
                "resumir textos, lembrar de fatos sobre você e rodar automações.\n"
                "O que ainda NÃO tenho: geração de texto no nível do ChatGPT "
                "(isso exige bilhões de parâmetros e GPU). Quer que eu explique por quê?",
            ],
            "humor": [
                "Por que o programador foi ao médico? Porque estava com um bug no estômago. 🐛",
                "Existem 10 tipos de pessoas: as que entendem binário e as que não.",
                "Meu código não tem bugs... tem comportamentos inesperados documentados.",
            ],
            "motivacao": [
                "Você já fez a parte mais difícil: começou. Vamos por partes, um passo por vez.",
                "Erro no terminal não é fracasso, é informação. Lê a última linha e me manda aqui.",
                "Constância vence talento. 30 minutos por dia e em um mês você é outra pessoa.",
            ],
            "tempo_ou_tedio": [
                "Se está entediado, escolhe um: 1) criar um novo fluxo, 2) ensinar frase nova "
                "para a rede, 3) pedir para eu resumir um texto seu.",
            ],
            "sim": ["Beleza! Manda o próximo passo.", "Combinado. Estou ouvindo."],
            "nao": ["Sem problema. Quer tentar de outro jeito?", "Tudo bem, seguimos quando você quiser."],
        }

        if intencao in banco:
            return escolher(banco[intencao])

        return escolher([
            "Entendi. Quer reformular com mais detalhes?",
            "Anotado. Me diga o próximo passo.",
        ])

    # ------------------------------------------------------------------
    def _resposta_nao_sei(self, texto: str, analise: dict) -> str:
        # Se a rede teve um palpite razoável em uma intenção "segura",
        # respondemos o palpite avisando que é um palpite. Melhor que um "não sei" seco.
        palpite = analise.get("palpite")
        seguras = {"ajuda", "capacidades", "quem_e_voce", "motivacao", "humor",
                   "tempo_ou_tedio", "agradecimento", "elogio", "despedida", "xingamento"}
        if palpite and palpite[0] in seguras and palpite[1] >= self.LIMITE_CONFIANCA_REDE:
            intencao, chance = palpite
            bonito = self.NOMES_BONITOS.get(intencao, intencao)
            aviso = (f"Não tenho certeza se entendi (meu palpite é {bonito}, "
                     f"com {chance:.0%} de chance). Mas olha se é isso:\n\n")
            return aviso + self._resposta_de_conversa(intencao)

        criado = self.gerador.gerar(18)
        dica = ""
        titulos = self.conhecimento.listar_titulos()
        if titulos:
            amostra = random.sample(titulos, min(3, len(titulos)))
            dica = "\nSobre isso eu sei explicar: " + "; ".join(amostra) + "."

        extra_criativo = ""
        if criado:
            extra_criativo = f"\n\n(No meu modo criativo, a cadeia de Markov sugeriu: \"{criado}\")"

        return (f"Ainda não sei responder isso com segurança — e eu prefiro dizer 'não sei' "
                f"do que inventar.{dica}{extra_criativo}\n\n"
                f"Três formas de me deixar mais inteligente agora:\n"
                f"  1) Adicionar um tópico em dados/conhecimento.json\n"
                f"  2) Adicionar frases em dados/treino.jsonl e rodar: python main.py treinar\n"
                f"  3) Me contar um fato seu para eu guardar na memória")

    # ------------------------------------------------------------------
    # Extrações (transformar frases em argumentos)
    # ------------------------------------------------------------------
    def _extrair_expressao(self, texto: str) -> str:
        limpo = sem_acento(texto.lower())

        # "15% de 240" -> mantém os DOIS números juntos (senão perdemos o segundo).
        porcentagem = re.search(
            r"(\d+(?:[.,]\d+)?)\s*(?:%|por cento)\s*(?:de\s*)?(\d+(?:[.,]\d+)?)", limpo
        )
        if porcentagem:
            return f"{porcentagem.group(1)}% de {porcentagem.group(2)}"

        # Traduz a conta escrita em palavras para símbolos matemáticos.
        limpo = re.sub(r"\b(elevado a|elevado ao|elevado)\b", " ^ ", limpo)
        limpo = re.sub(r"\b(dividido por|dividido|dividida por)\b", " / ", limpo)
        limpo = re.sub(r"\b(multiplicado por|multiplicar por|vezes|multiplicado)\b", " * ", limpo)
        limpo = re.sub(r"\b(mais)\b", " + ", limpo)
        limpo = re.sub(r"\b(menos|subtraido de)\b", " - ", limpo)
        limpo = re.sub(r"\b(some|somar|soma)\s+(\d+(?:[.,]\d+)?)\s+(?:com|e|mais)\s+(\d+(?:[.,]\d+)?)",
                       r"\2 + \3", limpo)
        limpo = re.sub(r"\b(quanto (e|eh)|calcule|calcula|resultado de|me diga|qual (o )?valor de)\b", " ", limpo)
        achado = re.search(r"[-+*/^()\d\s.,%xX]*\d[-+*/^()\d\s.,%xX]*", limpo)
        return achado.group(0).strip() if achado else limpo.strip()

    def _extrair_nome_arquivo(self, texto: str) -> str:
        achado = re.search(r"([\w\-]+\.(?:txt|md|csv|json|log))", texto, flags=re.IGNORECASE)
        return achado.group(1) if achado else "anotacao.txt"

    def _extrair_arquivo_e_conteudo(self, texto: str):
        """Entende: 'crie um arquivo chamado diario.txt com: hoje eu avancei muito'"""
        nome = self._extrair_nome_arquivo(texto)

        conteudo = ""
        for marcador in [" com ", " com:", " dizendo ", " conteudo ", " contendo ", ": "]:
            if marcador in texto.lower():
                posicao = texto.lower().index(marcador)
                conteudo = texto[posicao + len(marcador):].strip()
                break

        if not conteudo:
            # Sem conteúdo explícito: usa a frase toda como conteúdo (útil e didático).
            conteudo = texto

        # Se o nome do arquivo estiver no meio do conteúdo, tira para não sujar.
        conteudo = conteudo.replace(nome, "").strip(" :,-")
        if not conteudo:
            conteudo = "Arquivo criado pelo agente."
        return nome, conteudo

    def _extrair_nome_fluxo(self, texto: str) -> str:
        fluxos = orquestrador.carregar_fluxos(self.pasta_dados)
        baixo = sem_acento(texto.lower())
        for fluxo in fluxos:
            if fluxo.nome.lower() in baixo:
                return fluxo.nome
        return ""

    # ------------------------------------------------------------------
    def estatisticas_como_texto(self) -> str:
        info_gerador = self.gerador.tamanho()
        return (
            "Meu estado agora:\n"
            f"  • Intenções que aprendi: {len(self.rede.classes) if self.rede else 0}\n"
            f"  • Palavras no meu vocabulário: {len(self.vetorizador.vocabulario) if self.vetorizador else 0}\n"
            f"  • Pesos (parâmetros) da rede: {self._contar_parametros()} (o ChatGPT tem ~175.000.000.000)\n"
            f"  • Tópicos de conhecimento: {self.conhecimento.total()}\n"
            f"  • Fatos sobre você: {len(self.memoria.todos_os_fatos())}\n"
            f"  • Palavras que o gerador de texto leu: {info_gerador['palavras_treinadas']}\n"
            f"  • Fluxos de automação: {len(orquestrador.carregar_fluxos(self.pasta_dados))}\n"
            f"  • Ferramentas: {len(ferramentas.CATALOGO)}"
        )

    def _contar_parametros(self) -> int:
        if not self.rede:
            return 0
        total = 0
        total += len(self.rede.w1) * len(self.rede.w1[0]) + len(self.rede.b1)
        total += len(self.rede.w2) * len(self.rede.w2[0]) + len(self.rede.b2)
        return total

    # ------------------------------------------------------------------
    def definir_nome_usuario(self, nome: str) -> None:
        self.memoria.lembrar("nome", nome)

    def fechar(self) -> None:
        self.memoria.fechar()


if __name__ == "__main__":  # teste rápido:  python agente/nucleo.py
    agente = Agente()
    for frase in ["oi, tudo bem?", "quanto é (25 * 4) + 10", "meu nome é Guilherme",
                  "o que é backpropagation?", "invente uma frase"]:
        resultado = agente.responder(frase)
        print(f"\nVocê: {frase}")
        print(f"[rota: {resultado['rota']} | confiança: {resultado['confianca']}]")
        print(f"{NOME}: {resultado['resposta']}")
    agente.fechar()
