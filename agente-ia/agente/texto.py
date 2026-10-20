"""
texto.py -- Ferramentas de texto (transformar frases em números).

Por que isso existe?
    Uma rede neural só entende NÚMEROS. Então antes de mostrar uma frase
    para o "cérebro" do agente, precisamos transformar a frase em uma
    lista de números. Aqui usamos a técnica mais simples e didática:
    "saco de palavras" (Bag of Words / BoW).

    Exemplo:
        "olá, tudo bem?"  ->  ["ola", "tudo", "bem"]
        Vocabulário: ["ola", "tudo", "bem", "obrigado", ...]
        Vetor:       [ 1,      1,      1,     0,          ... ]

    Cada posição do vetor diz "esta palavra apareceu no texto?".
    Isso é 100% Python puro: nenhuma biblioteca instalada.
"""

import json
import os
import random
import unicodedata


# ---------------------------------------------------------------------------
# 1) Limpeza e separação das palavras
# ---------------------------------------------------------------------------

# Palavras muito comuns que não ajudam a identificar a intenção.
PALAVRAS_IGNORADAS = {
    "a", "o", "as", "os", "um", "uma", "de", "do", "da", "dos", "das",
    "em", "no", "na", "nos", "nas", "por", "para", "pra", "com", "sem",
    "e", "ou", "que", "qual", "quais", "se", "me", "te", "eu", "voce",
    "ele", "ela", "isso", "isto", "aquilo", "ao", "aos", "as", "eh",
    "sou", "esta", "estou", "ser", "ter", "tem", "ha", "vai", "ja",
    # verbos e muletas muito comuns: não ajudam a identificar o assunto
    "fazer", "faz", "sei", "saber", "quero", "quer", "pode", "posso",
    "la", "hoje", "agora", "coisa", "coisas", "algo", "aqui", "ali",
    "entao", "porque", "tambem",
}

# Atenção: NÃO colocamos "sim" e "nao" na lista acima.
# Eles são o sentido principal das intenções "sim" e "nao": sem eles a rede
# receberia um vetor vazio e não teria como aprender a diferença.


def sem_acento(palavra: str) -> str:
    """Troca 'ção' por 'cao', 'á' por 'a'... para o computador não se confundir."""
    decomposta = unicodedata.normalize("NFKD", palavra)
    return "".join(letra for letra in decomposta if not unicodedata.combining(letra))


def tokenizar(texto: str, remover_comuns: bool = True) -> list:
    """
    Recebe uma frase e devolve a lista de palavras "limpas".

    >>> tokenizar("Olá, tudo BEM?!")
    ['ola', 'tudo', 'bem']
    """
    texto = sem_acento(str(texto).lower())
    palavras = []
    atual = []
    for caractere in texto:
        if caractere.isalnum() or caractere == "_":
            atual.append(caractere)
        else:
            if atual:
                palavras.append("".join(atual))
                atual = []
    if atual:
        palavras.append("".join(atual))

    if remover_comuns:
        limpas = [p for p in palavras if p not in PALAVRAS_IGNORADAS and len(p) > 1]
        # Caso especial: "pode ser", "sim", "ok"...
        # Se a limpeza apagou TUDO, devolvemos as palavras originais.
        # Sem isso o vetor ficaria vazio e a rede não teria o que aprender.
        if not limpas and palavras:
            return list(dict.fromkeys(palavras))
        palavras = limpas
    return palavras


# ---------------------------------------------------------------------------
# 2) O vetorizador: transforma frases em vetores de números
# ---------------------------------------------------------------------------

class Vetorizador:
    """
    Guarda o "dicionário" de palavras conhecidas e converte frases em vetores.

    Fluxo de uso:
        v = Vetorizador()
        v.aprender(["bom dia", "boa noite"])   # monta o vocabulário
        v.transformar("bom dia")               # -> [1.0, 1.0]
    """

    def __init__(self, max_palavras: int = 400):
        self.max_palavras = max_palavras
        self.vocabulario = []          # lista de palavras (a ordem define o vetor)
        self.indice = {}               # palavra -> posição no vetor

    # -- montar o vocabulário -------------------------------------------------
    def aprender(self, frases: list) -> None:
        """Conta as palavras de todas as frases e guarda as mais frequentes."""
        contagem = {}
        for frase in frases:
            for palavra in tokenizar(frase):
                contagem[palavra] = contagem.get(palavra, 0) + 1

        # Ordena: mais frequentes primeiro; empate resolvido pelo alfabeto
        # (assim o resultado é sempre igual, mesmo rodando várias vezes).
        ordenadas = sorted(contagem.items(), key=lambda item: (-item[1], item[0]))
        self.vocabulario = [palavra for palavra, _ in ordenadas[: self.max_palavras]]
        self.indice = {palavra: i for i, palavra in enumerate(self.vocabulario)}

    # -- usar o vocabulário ---------------------------------------------------
    def transformar(self, frase: str) -> list:
        """Devolve um vetor de 0.0 e 1.0 do tamanho do vocabulário."""
        vetor = [0.0] * len(self.vocabulario)
        for palavra in tokenizar(frase):
            posicao = self.indice.get(palavra)
            if posicao is not None:
                vetor[posicao] = 1.0
        # Normaliza: vetor com "tamanho" 1. Se estiver zerado, devolve zeros.
        soma_quadrados = sum(valor * valor for valor in vetor) ** 0.5
        if soma_quadrados > 0:
            vetor = [valor / soma_quadrados for valor in vetor]
        return vetor

    def transformar_varias(self, frases: list) -> list:
        return [self.transformar(frase) for frase in frases]

    # -- salvar / carregar ----------------------------------------------------
    def salvar(self, caminho: str) -> None:
        pasta = os.path.dirname(caminho)
        if pasta:
            os.makedirs(pasta, exist_ok=True)
        with open(caminho, "w", encoding="utf-8") as arquivo:
            json.dump({"vocabulario": self.vocabulario}, arquivo, ensure_ascii=False)

    @classmethod
    def carregar(cls, caminho: str) -> "Vetorizador":
        with open(caminho, "r", encoding="utf-8") as arquivo:
            dados = json.load(arquivo)
        vetorizador = cls()
        vetorizador.vocabulario = dados["vocabulario"]
        vetorizador.indice = {p: i for i, p in enumerate(vetorizador.vocabulario)}
        return vetorizador


# ---------------------------------------------------------------------------
# 3) Utilidades pequenas usadas pelo resto do projeto
# ---------------------------------------------------------------------------

def escolher(lista: list):
    """Escolhe um item da lista ao acaso (dá variedade nas respostas)."""
    if not lista:
        return ""
    return random.choice(lista)


def barra_de_progresso(atual: int, total: int, largura: int = 30) -> str:
    """Desenha uma barrinha no terminal: [####------] 40%"""
    if total <= 0:
        return ""
    preenchido = int(largura * atual / total)
    return "[" + "#" * preenchido + "-" * (largura - preenchido) + f"] {int(100 * atual / total)}%"


if __name__ == "__main__":  # teste rápido:  python agente/texto.py
    v = Vetorizador()
    v.aprender(["bom dia", "boa noite", "qual é o seu nome?"])
    print("Vocabulário:", v.vocabulario)
    print("Vetor de 'bom dia':", v.transformar("bom dia"))
