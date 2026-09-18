"""
conhecimento.py -- A base de conhecimento do agente (a "memória de estudo").

Como funciona (recuperação por palavras-chave com peso IDF):
    1. Cada tópico tem uma pergunta/palavras-chave e uma resposta.
    2. Quando o usuário pergunta algo, comparamos as palavras dele com cada tópico.
    3. Palavras RARAS valem mais (isso é o IDF). "vscode" pesa mais que "como".
    4. O tópico com maior pontuação é escolhido -- mas só se passar de um limite
       mínimo. Se não passar, o agente admite que não sabe (isso é honestidade
       e evita resposta errada inventada, a famosa "alucinação").
"""

import json
import math
import os

from .texto import sem_acento, tokenizar

# Palavras que existem em quase todos os assuntos. Se a busca usasse essas
# palavras, "não" ou "oi" poderiam escolher um tópico qualquer. Então ignoramos.
PALAVRAS_GENERICAS = {
    "nao", "sim", "ok", "okay", "beleza", "nada", "tudo", "gente", "pessoa",
    "pessoas", "favor", "obrigado", "obrigada", "valeu", "oi", "ola", "bom",
    "boa", "dia", "tarde", "noite", "tchau", "coisa", "coisas", "algo",
    "quero", "queria", "preciso", "gostaria", "pode", "poderia", "consegue",
    "novo", "nova", "novos", "novas", "muito", "pouco", "tudo", "nada",
}


class BaseDeConhecimento:
    def __init__(self, caminho_json: str = None):
        self.topicos = []
        self.peso_palavra = {}  # palavra -> raridade (IDF)
        if caminho_json:
            self.carregar(caminho_json)

    # ------------------------------------------------------------------
    def carregar(self, caminho_json: str) -> None:
        with open(caminho_json, "r", encoding="utf-8") as arquivo:
            dados = json.load(arquivo)
        self.topicos = dados.get("topicos", [])
        self._calcular_pesos()

    def adicionar(self, titulo: str, palavras_chave: list, resposta: str, fonte: str = "usuário") -> None:
        self.topicos.append(
            {"titulo": titulo, "palavras_chave": palavras_chave, "resposta": resposta, "fonte": fonte}
        )
        self._calcular_pesos()

    def _calcular_pesos(self) -> None:
        """IDF: quanto mais rara a palavra aparece nos tópicos, mais peso ela tem."""
        total = max(1, len(self.topicos))
        frequencia = {}
        for topico in self.topicos:
            vistas = set(self._palavras_do_topico(topico))
            for palavra in vistas:
                frequencia[palavra] = frequencia.get(palavra, 0) + 1
        self.peso_palavra = {
            palavra: math.log((total + 1) / (quantidade + 1)) + 1.0
            for palavra, quantidade in frequencia.items()
        }

    # ------------------------------------------------------------------
    @staticmethod
    def _palavras_do_topico(topico: dict) -> set:
        """Junta as palavras-chave (curadas) e as do título (peso menor)."""
        chaves = set(tokenizar(" ".join(topico.get("palavras_chave", []))))
        titulo = set(tokenizar(topico.get("titulo", "")))
        return chaves | titulo

    def procurar(self, pergunta: str, limite: float = 1.0):
        """Devolve (topico, pontuacao) ou (None, pontuacao)."""
        palavras = tokenizar(pergunta)
        # Tira as palavras genéricas: sobra só o que realmente identifica o assunto.
        palavras_uteis = [p for p in palavras if p not in PALAVRAS_GENERICAS]
        if not palavras_uteis or not self.topicos:
            return None, 0.0
        palavras = palavras_uteis

        melhor_topico = None
        melhor_nota = 0.0

        for topico in self.topicos:
            chaves = set(tokenizar(" ".join(topico.get("palavras_chave", []))))
            titulo = set(tokenizar(topico.get("titulo", "")))
            nota = 0.0
            for palavra in palavras:
                if palavra in chaves:
                    # palavra-chave curada: vale o peso cheio
                    nota += self.peso_palavra.get(palavra, 1.0)
                elif palavra in titulo:
                    # palavra veio só do título (mais genérica): vale menos
                    nota += 0.4 * self.peso_palavra.get(palavra, 1.0)
            # Normaliza pelo tamanho da pergunta para perguntas longas não vencerem só por tamanho.
            nota = nota / (len(palavras) ** 0.5)
            if nota > melhor_nota:
                melhor_nota = nota
                melhor_topico = topico

        if melhor_nota < limite:
            return None, melhor_nota
        return melhor_topico, melhor_nota

    def listar_titulos(self) -> list:
        return [topico.get("titulo", "?") for topico in self.topicos]

    def total(self) -> int:
        return len(self.topicos)


if __name__ == "__main__":  # teste rápido
    caminho = os.path.join(os.path.dirname(__file__), "..", "dados", "conhecimento.json")
    base = BaseDeConhecimento(caminho)
    print(f"{base.total()} tópicos carregados.\n")
    for pergunta in ["como abrir o terminal no vscode", "o que é rede neural", "qual a capital da França"]:
        topico, nota = base.procurar(pergunta)
        if topico:
            print(f"[{nota:.2f}] {pergunta}  ->  {topico['titulo']}")
        else:
            print(f"[{nota:.2f}] {pergunta}  ->  não sei responder")
