"""
rede_neural.py -- A INTELIGÊNCIA do agente, escrita do zero.

O que tem aqui dentro?
    Uma rede neural "MLP" (Multi-Layer Perceptron) de verdade:
        1 camada de entrada  -> 1 camada escondida (tanh) -> 1 camada de saída (softmax)
    Treinada com retropropagação (backpropagation) + descida do gradiente (SGD com momento).

Por que do zero?
    Porque o objetivo é APRENDER como a IA funciona. Nenhuma linha usa
    PyTorch, TensorFlow, scikit-learn, OpenAI ou Ollama. Só matemática e Python puro.

Como a matemática funciona (versão curta):
    - Cada neurônio faz: soma(entrada * peso) + bias  -> passa por tanh
    - A saída vira probabilidade com softmax (todas as saídas somam 1.0)
    - O erro é medido com entropia cruzada
    - O backprop descobre "quanto cada peso errou" e o SGD corrige: peso -= taxa * gradiente
    - Repetindo isso muitas vezes, a rede aprende a acertar.
"""

import json
import math
import os
import random


# ---------------------------------------------------------------------------
# Funções de ativação (a matemática do neurônio)
# ---------------------------------------------------------------------------

def tanh(x: float) -> float:
    """Ativação da camada escondida. Devolve entre -1 e 1."""
    return math.tanh(x)


def tanh_derivada(saida: float) -> float:
    """Derivada da tanh, escrita em função do resultado (mais rápido)."""
    return 1.0 - saida * saida


def softmax(valores: list) -> list:
    """
    Transforma números soltos em PROBABILIDADES que somam 1.0.

    Truque do maior valor: subtraímos o máximo para o math.exp não estourar.
    """
    if not valores:
        return []
    maior = max(valores)
    exponenciais = [math.exp(valor - maior) for valor in valores]
    soma = sum(exponenciais)
    return [valor / soma for valor in exponenciais]


# ---------------------------------------------------------------------------
# A rede neural
# ---------------------------------------------------------------------------

class RedeNeural:
    """
    Rede com uma camada escondida.

    n_entradas = tamanho do vetor de texto (tamanho do vocabulário)
    n_ocultos  = "neurônios de raciocínio" (quanto maior, mais capacidade; mais lento)
    n_saidas   = quantas intenções queremos reconhecer
    """

    def __init__(self, n_entradas: int, n_ocultos: int, n_saidas: int, semente: int = 42):
        self.n_entradas = n_entradas
        self.n_ocultos = n_ocultos
        self.n_saidas = n_saidas
        self.classes = []  # nomes das intenções (ex.: "saudacao", "calculo")

        sorteador = random.Random(semente)

        # Inicialização de Xavier: pesos pequenos e aleatórios, na medida certa.
        limite1 = math.sqrt(2.0 / max(1, n_entradas))
        self.w1 = [[sorteador.gauss(0.0, limite1) for _ in range(n_entradas)]
                   for _ in range(n_ocultos)]
        self.b1 = [0.0] * n_ocultos

        limite2 = math.sqrt(2.0 / max(1, n_ocultos))
        self.w2 = [[sorteador.gauss(0.0, limite2) for _ in range(n_ocultos)]
                   for _ in range(n_saidas)]
        self.b2 = [0.0] * n_saidas

    # ------------------------------------------------------------------
    # 1) Passo para frente (forward): calcular a resposta da rede
    # ------------------------------------------------------------------
    def propagar(self, entrada: list):
        """Recebe um vetor e devolve (probabilidades, valores internos)."""
        # Camada escondida: h = tanh(W1 . x + b1)
        escondida = []
        for j in range(self.n_ocultos):
            linha = self.w1[j]
            soma = self.b1[j]
            for i in range(self.n_entradas):
                if entrada[i]:
                    soma += linha[i] * entrada[i]
            escondida.append(tanh(soma))

        # Camada de saída: o = W2 . h + b2  -> softmax
        saida_bruta = []
        for k in range(self.n_saidas):
            linha = self.w2[k]
            soma = self.b2[k]
            for j in range(self.n_ocultos):
                soma += linha[j] * escondida[j]
            saida_bruta.append(soma)

        return softmax(saida_bruta), escondida

    def prever(self, entrada: list) -> list:
        """Só as probabilidades (usado na hora de conversar)."""
        return self.propagar(entrada)[0]

    # ------------------------------------------------------------------
    # 2) Treino (backpropagation + SGD com momento)
    # ------------------------------------------------------------------
    def treinar(
        self,
        entradas: list,
        alvos: list,
        epocas: int = 300,
        taxa_aprendizado: float = 0.05,
        momento: float = 0.9,
        tamanho_lote: int = 8,
        semente: int = 7,
        mostrar_progresso=None,
    ) -> list:
        """
        entradas = lista de vetores (X)
        alvos    = lista de listas one-hot (Y)  ex.: [0,1,0]
        Devolve o histórico de erro (uma média por época).
        """
        sorteador = random.Random(semente)
        quantidade = len(entradas)
        if quantidade == 0:
            return []

        # Memória do momento: guarda a última direção de cada peso.
        vel_w1 = [[0.0] * self.n_entradas for _ in range(self.n_ocultos)]
        vel_b1 = [0.0] * self.n_ocultos
        vel_w2 = [[0.0] * self.n_ocultos for _ in range(self.n_saidas)]
        vel_b2 = [0.0] * self.n_saidas

        historico = []
        for epoca in range(epocas):
            ordem = list(range(quantidade))
            sorteador.shuffle(ordem)
            erro_da_epoca = 0.0

            for inicio in range(0, quantidade, tamanho_lote):
                lote = ordem[inicio: inicio + tamanho_lote]
                if not lote:
                    continue

                # Zera os acumuladores de gradiente deste lote.
                grad_w1 = [[0.0] * self.n_entradas for _ in range(self.n_ocultos)]
                grad_b1 = [0.0] * self.n_ocultos
                grad_w2 = [[0.0] * self.n_ocultos for _ in range(self.n_saidas)]
                grad_b2 = [0.0] * self.n_saidas

                for indice in lote:
                    entrada = entradas[indice]
                    alvo = alvos[indice]
                    probabilidades, escondida = self.propagar(entrada)

                    # Erro da amostra (entropia cruzada).
                    for k in range(self.n_saidas):
                        if alvo[k] > 0:
                            erro_da_epoca -= alvo[k] * math.log(probabilidades[k] + 1e-12)

                    # Gradiente da saída: (prob - alvo) -- resultado bonito do softmax+entropia.
                    delta_saida = [probabilidades[k] - alvo[k] for k in range(self.n_saidas)]

                    # Gradiente da camada escondida.
                    delta_escondida = [0.0] * self.n_ocultos
                    for j in range(self.n_ocultos):
                        soma = 0.0
                        for k in range(self.n_saidas):
                            if delta_saida[k]:
                                soma += delta_saida[k] * self.w2[k][j]
                        delta_escondida[j] = soma * tanh_derivada(escondida[j])

                    # Acumula os gradientes dos pesos.
                    for k in range(self.n_saidas):
                        if delta_saida[k]:
                            d = delta_saida[k]
                            linha = grad_w2[k]
                            for j in range(self.n_ocultos):
                                linha[j] += d * escondida[j]
                            grad_b2[k] += d

                    for j in range(self.n_ocultos):
                        if delta_escondida[j]:
                            d = delta_escondida[j]
                            linha = grad_w1[j]
                            for i in range(self.n_entradas):
                                if entrada[i]:
                                    linha[i] += d * entrada[i]
                            grad_b1[j] += d

                # Atualiza os pesos: SGD com momento.
                fator = taxa_aprendizado / len(lote)

                for k in range(self.n_saidas):
                    linha_peso = self.w2[k]
                    linha_vel = vel_w2[k]
                    linha_grad = grad_w2[k]
                    for j in range(self.n_ocultos):
                        linha_vel[j] = momento * linha_vel[j] - fator * linha_grad[j]
                        linha_peso[j] += linha_vel[j]
                    vel_b2[k] = momento * vel_b2[k] - fator * grad_b2[k]
                    self.b2[k] += vel_b2[k]

                for j in range(self.n_ocultos):
                    linha_peso = self.w1[j]
                    linha_vel = vel_w1[j]
                    linha_grad = grad_w1[j]
                    for i in range(self.n_entradas):
                        if linha_grad[i]:
                            linha_vel[i] = momento * linha_vel[i] - fator * linha_grad[i]
                            linha_peso[i] += linha_vel[i]
                    vel_b1[j] = momento * vel_b1[j] - fator * grad_b1[j]
                    self.b1[j] += vel_b1[j]

            erro_medio = erro_da_epoca / quantidade
            historico.append(erro_medio)

            if mostrar_progresso and (epoca % 25 == 0 or epoca == epocas - 1):
                mostrar_progresso(epoca + 1, epocas, erro_medio)

        return historico

    # ------------------------------------------------------------------
    # 3) Conferir o resultado do treino
    # ------------------------------------------------------------------
    def avaliar(self, entradas: list, alvos: list) -> float:
        """Devolve a porcentagem de acertos (0.0 a 1.0)."""
        if not entradas:
            return 0.0
        acertos = 0
        for entrada, alvo in zip(entradas, alvos):
            probabilidades = self.prever(entrada)
            palpite = probabilidades.index(max(probabilidades))
            correto = alvo.index(max(alvo))
            if palpite == correto:
                acertos += 1
        return acertos / len(entradas)

    # ------------------------------------------------------------------
    # 4) Salvar e carregar (para não treinar de novo toda vez)
    # ------------------------------------------------------------------
    def salvar(self, caminho: str) -> None:
        pasta = os.path.dirname(caminho)
        if pasta:
            os.makedirs(pasta, exist_ok=True)
        pacote = {
            "n_entradas": self.n_entradas,
            "n_ocultos": self.n_ocultos,
            "n_saidas": self.n_saidas,
            "classes": self.classes,
            "w1": self.w1,
            "b1": self.b1,
            "w2": self.w2,
            "b2": self.b2,
        }
        with open(caminho, "w", encoding="utf-8") as arquivo:
            json.dump(pacote, arquivo)

    @classmethod
    def carregar(cls, caminho: str) -> "RedeNeural":
        with open(caminho, "r", encoding="utf-8") as arquivo:
            pacote = json.load(arquivo)
        rede = cls(pacote["n_entradas"], pacote["n_ocultos"], pacote["n_saidas"])
        rede.classes = pacote["classes"]
        rede.w1 = pacote["w1"]
        rede.b1 = pacote["b1"]
        rede.w2 = pacote["w2"]
        rede.b2 = pacote["b2"]
        return rede


if __name__ == "__main__":
    # Teste de sanidade: a rede aprende a regra "OU exclusivo" (XOR)?
    # XOR é o exemplo clássico que uma rede de 1 camada NÃO consegue resolver.
    print("Testando a rede com o problema XOR...")
    rede = RedeNeural(2, 6, 2, semente=1)
    entradas = [[0.0, 0.0], [0.0, 1.0], [1.0, 0.0], [1.0, 1.0]]
    alvos = [[1.0, 0.0], [0.0, 1.0], [0.0, 1.0], [1.0, 0.0]]  # classe 0 = iguais, 1 = diferentes

    rede.treinar(entradas, alvos, epocas=2000, taxa_aprendizado=0.3, tamanho_lote=4)
    print("Acertos:", f"{rede.avaliar(entradas, alvos) * 100:.0f}%")
    for entrada in entradas:
        probs = rede.prever(entrada)
        print(f"  {entrada} -> classe {probs.index(max(probs))} (confiança {max(probs):.2f})")
