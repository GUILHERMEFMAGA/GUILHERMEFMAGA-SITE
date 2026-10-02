"""
gerador.py -- A "voz" do agente: gera texto sozinho, sem API.

Como funciona (Cadeia de Markov):
    1. Lê um monte de texto (o corpus).
    2. Aprende quais palavras costumam vir depois de quais.
       Ex.: depois de "bom" costuma vir "dia"; depois de "dia" vem "!".
    3. Para criar uma frase nova: começa em uma palavra e vai "seguindo o rastro".

Honestidade técnica (leia isso):
    Isso NÃO é um ChatGPT. Um modelo de linguagem grande tem bilhões de parâmetros
    e foi treinado com trilhões de palavras. Aqui temos milhares de palavras e um
    punhado de parâmetros. Serve para: (a) entender o mecanismo, (b) gerar frases
    de preenchimento, (c) inspirar. Para respostas confiáveis usamos a base de
    conhecimento (conhecimento.py), que é o "raciocínio recuperativo".
"""

import os
import random
from collections import defaultdict

from .texto import sem_acento

INICIO = "<inicio>"
FIM = "<fim>"


class GeradorDeTexto:
    def __init__(self, ordem: int = 2, semente: int = 42):
        """ordem = quantas palavras olhar para trás ao prever a próxima."""
        self.ordem = ordem
        self.sorteador = random.Random(semente)
        self.tabela = defaultdict(list)  # chave (tupla de palavras) -> próximas palavras
        self.palavras_treinadas = 0

    # ------------------------------------------------------------------
    def treinar(self, textos: list) -> None:
        for texto in textos:
            self._treinar_um(texto)

    def _treinar_um(self, texto: str) -> None:
        """Treina frase por frase (cada frase começa no INICIO e termina no FIM)."""
        import re as _re

        for frase in _re.split(r"(?<=[.!?])\s+|\n+", texto):
            if frase.strip():
                self._treinar_frase(frase.strip())

    def _treinar_frase(self, texto: str) -> None:
        # Guardamos as palavras "originais" (com acento) para o texto sair bonito.
        palavras = texto.split()
        if len(palavras) < self.ordem + 1:
            return

        janela = [INICIO] * self.ordem
        for palavra in palavras:
            self.tabela[tuple(janela)].append(palavra)
            janela = janela[1:] + [palavra]
        self.tabela[tuple(janela)].append(FIM)
        self.palavras_treinadas += len(palavras)

    # ------------------------------------------------------------------
    def gerar(self, maximo_palavras: int = 25, comeco: str = None) -> str:
        """Cria uma frase nova seguindo as cadeias aprendidas."""
        if not self.tabela:
            return ""

        if comeco:
            janela = comeco.replace("\n", " ").split()[-self.ordem:]
            while len(janela) < self.ordem:
                janela = [INICIO] + janela
        else:
            janela = [INICIO] * self.ordem

        saida = []
        for _ in range(maximo_palavras):
            chave = tuple(janela)
            candidatas = self.tabela.get(chave)
            if not candidatas:
                break
            palavra = self.sorteador.choice(candidatas)
            if palavra == FIM:
                break
            saida.append(palavra)
            janela = janela[1:] + [palavra]

        if not saida:
            return ""
        frase = " ".join(saida).rstrip(" .,!?;:()").strip()
        if not frase:
            return ""
        return frase[0].upper() + frase[1:] + "."

    # ------------------------------------------------------------------
    def surpreender(self, maximo_palavras: int = 25, tentativas: int = 4) -> str:
        """
        Gera uma frase começando sempre pelo INÍCIO de alguma frase do corpus,
        para o resultado sair com começo, meio e fim (e não um pedaço solto).
        """
        if not self.tabela:
            return ""
        melhor = ""
        for _ in range(max(1, tentativas)):
            frase = self.gerar(maximo_palavras)
            if len(frase.split()) > len(melhor.split()):
                melhor = frase
            if len(melhor.split()) >= 8:
                break
        return melhor

    def tamanho(self) -> dict:
        return {
            "chaves": len(self.tabela),
            "palavras_treinadas": self.palavras_treinadas,
            "ordem": self.ordem,
        }


def montar_gerador(pasta_dados: str) -> GeradorDeTexto:
    """Treina o gerador com o corpus.txt + a base de conhecimento."""
    import json

    textos = []

    caminho_corpus = os.path.join(pasta_dados, "corpus.txt")
    if os.path.exists(caminho_corpus):
        with open(caminho_corpus, "r", encoding="utf-8") as arquivo:
            textos.append(arquivo.read())

    caminho_conhecimento = os.path.join(pasta_dados, "conhecimento.json")
    if os.path.exists(caminho_conhecimento):
        with open(caminho_conhecimento, "r", encoding="utf-8") as arquivo:
            # Usamos os TÍTULOS (frases limpas) e não as respostas inteiras,
            # para o gerador não aprender parênteses, aspas e códigos.
            for item in json.load(arquivo).get("topicos", []):
                textos.append(item.get("titulo", ""))

    # semente=None => cada sessão gera frases diferentes
    gerador = GeradorDeTexto(ordem=2, semente=None)
    gerador.treinar(textos)
    return gerador


if __name__ == "__main__":
    gerador = GeradorDeTexto(ordem=2)
    gerador.treinar(
        [
            "A inteligencia artificial aprende com exemplos e melhora com o treino.",
            "O agente de inteligencia artificial trabalha sozinho e executa tarefas.",
            "Rodar tudo no seu computador deixa o agente mais rapido e privado.",
        ]
    )
    for _ in range(3):
        print("-", gerador.surpreender(15))
    print(gerador.tamanho())
