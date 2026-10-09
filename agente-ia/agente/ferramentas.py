"""
ferramentas.py -- As "mãos" do agente.

Uma IA sem ferramentas só conversa. Com ferramentas, ela AGE:
calcula, lê e escreve arquivos, olha a data e a hora, analisa textos.

Cada função aqui é uma FERRAMENTA (igual aos "nós" do n8n, só que em Python).
Todas usam apenas a biblioteca padrão do Python.
"""

import ast
import os
import operator
import platform
import random
import re
import sys
from datetime import datetime

# ---------------------------------------------------------------------------
# Onde o agente pode escrever (caixa de areia / sandbox)
# ---------------------------------------------------------------------------
PORTAO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dados", "saidas"))


def _caminho_seguro(nome_arquivo: str) -> str:
    """
    Impede que o agente escreva fora da pasta 'dados/saidas'.
    Regra de segurança: nada de '..', nada de caminho absoluto do sistema.
    """
    nome_limpo = str(nome_arquivo).strip().replace("\\", "/").split("/")[-1]
    if not nome_limpo or nome_limpo in {".", ".."}:
        raise ValueError("Nome de arquivo inválido.")
    if not re.match(r"^[\w\-. ]+$", nome_limpo, flags=re.UNICODE):
        raise ValueError("Use apenas letras, números, espaço, ponto, hífen e sublinhado.")
    os.makedirs(PORTAO, exist_ok=True)
    return os.path.join(PORTAO, nome_limpo)


# ---------------------------------------------------------------------------
# 1) CALCULADORA SEGURA (sem usar eval!)
# ---------------------------------------------------------------------------
_OPERACOES = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def _calcular_no(no):
    if isinstance(no, ast.Expression):
        return _calcular_no(no.body)
    if isinstance(no, ast.Constant):
        if isinstance(no.value, (int, float)):
            return no.value
        raise ValueError("Só aceito números.")
    if isinstance(no, ast.BinOp) and type(no.op) in _OPERACOES:
        return _OPERACOES[type(no.op)](_calcular_no(no.left), _calcular_no(no.right))
    if isinstance(no, ast.UnaryOp) and type(no.op) in _OPERACOES:
        return _OPERACOES[type(no.op)](_calcular_no(no.operand))
    raise ValueError("Operação não permitida (por segurança).")


def calcular(expressao: str) -> str:
    """Resolve contas sem risco. Ex.: calcular('(2 + 3) * 4') -> '(2 + 3) * 4 = 20'"""
    texto = str(expressao).lower()
    # Traduz contas escritas por extenso: "2 elevado a 10" -> "2 ** 10"
    texto = texto.replace("elevado a", "**").replace("elevado ao", "**")
    texto = texto.replace("por cento", "%")
    texto = re.sub(r"\b(dividido por|dividido|dividida por)\b", "/", texto)
    texto = re.sub(r"\b(multiplicado por|multiplicado|vezes)\b", "*", texto)
    texto = re.sub(r"\bmais\b", "+", texto)
    texto = re.sub(r"\bmenos\b", "-", texto)
    texto = re.sub(r"\b(some|soma|somar)\s+(\d+(?:[.,]\d+)?)\s+(?:com|e)\s+(\d+(?:[.,]\d+)?)",
                   r"\2+\3", texto)
    texto = texto.replace(",", ".").replace("x", "*").replace("÷", "/").replace("^", "**")
    # Porcentagem em linguagem natural: "15% de 240" -> "(15/100)*240"
    texto = re.sub(r"(\d+(?:\.\d+)?)\s*%\s*(?:de\s*)?(\d+(?:\.\d+)?)",
                   r"(\1/100)*\2", texto)
    texto = re.sub(r"(\d+(?:\.\d+)?)\s*%", r"(\1/100)", texto)
    letras = re.sub(r"[0-9+\-*/(). %]", "", texto)
    if letras.strip():
        texto = re.sub(r"[^0-9+\-*/(). %]", "", texto)
    texto = re.sub(r"\s+", " ", texto).strip()   # tira espaços duplicados
    if not texto:
        return "Não encontrei nenhuma conta para fazer."
    try:
        arvore = ast.parse(texto, mode="eval")
        resultado = _calcular_no(arvore)
        numero = float(resultado)
        if numero == int(numero) and abs(numero) < 10 ** 15:
            bonito = str(int(numero))
        else:
            # Até 6 casas, sem zeros sobrando no fim, no padrão brasileiro (1.234,56)
            bonito = f"{numero:,.6f}".rstrip("0").rstrip(".")
            bonito = bonito.replace(",", "X").replace(".", ",").replace("X", ".")
        return f"{texto.strip()} = {bonito}"
    except ZeroDivisionError:
        return "Divisão por zero não existe. Tente outro número."
    except Exception as erro:
        return f"Não consegui calcular isso ({erro}). Exemplo do que eu entendo: (2+3)*4"


# ---------------------------------------------------------------------------
# 2) DATA E HORA
# ---------------------------------------------------------------------------
DIAS = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira",
        "sexta-feira", "sábado", "domingo"]
MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
         "agosto", "setembro", "outubro", "novembro", "dezembro"]


def data_hora(formato: str = "completo") -> str:
    agora = datetime.now()
    if formato == "hora":
        return agora.strftime("%H:%M")
    if formato == "data":
        return f"{agora.day} de {MESES[agora.month - 1]} de {agora.year}"
    return (f"Hoje é {DIAS[agora.weekday()]}, {agora.day} de {MESES[agora.month - 1]} "
            f"de {agora.year}, e agora são {agora.strftime('%H:%M')} "
            f"(horário do seu computador).")


# ---------------------------------------------------------------------------
# 3) ARQUIVOS
# ---------------------------------------------------------------------------
def salvar_arquivo(nome_arquivo: str, conteudo: str) -> str:
    caminho = _caminho_seguro(nome_arquivo)
    with open(caminho, "w", encoding="utf-8") as arquivo:
        arquivo.write(str(conteudo).strip() + "\n")
    return f"Pronto! Salvei {len(str(conteudo))} caracteres em dados/saidas/{os.path.basename(caminho)}"


def ler_arquivo(nome_arquivo: str, maximo_caracteres: int = 1500) -> str:
    try:
        caminho = _caminho_seguro(nome_arquivo)
    except ValueError as erro:
        return f"Nome inválido: {erro}"
    if not os.path.exists(caminho):
        return f"Não achei o arquivo '{nome_arquivo}' em dados/saidas/."
    with open(caminho, "r", encoding="utf-8", errors="replace") as arquivo:
        conteudo = arquivo.read()
    if len(conteudo) > maximo_caracteres:
        conteudo = conteudo[:maximo_caracteres] + "...(cortei aqui para não encher a tela)"
    return f"Conteúdo de {nome_arquivo}:\n{conteudo}"


def listar_arquivos(pasta: str = None) -> str:
    alvo = PORTAO if pasta is None else _caminho_seguro(pasta)
    if not os.path.isdir(alvo):
        return "A pasta dados/saidas ainda não existe (nada foi salvo ainda)."
    arquivos = sorted(os.listdir(alvo))
    if not arquivos:
        return "A pasta dados/saidas está vazia."
    linhas = [f"- {nome} ({os.path.getsize(os.path.join(alvo, nome))} bytes)" for nome in arquivos]
    return "Arquivos em dados/saidas:\n" + "\n".join(linhas)


def apagar_arquivo(nome_arquivo: str) -> str:
    caminho = _caminho_seguro(nome_arquivo)
    if os.path.exists(caminho):
        os.remove(caminho)
        return f"Apaguei dados/saidas/{nome_arquivo}."
    return f"Não achei '{nome_arquivo}'."


# ---------------------------------------------------------------------------
# 4) ANÁLISE DE TEXTO
# ---------------------------------------------------------------------------
def analisar_texto(texto: str) -> str:
    palavras = re.findall(r"\w+", texto, flags=re.UNICODE)
    frases = [f for f in re.split(r"[.!?]+", texto) if f.strip()]
    contagem = {}
    for palavra in palavras:
        chave = palavra.lower()
        contagem[chave] = contagem.get(chave, 0) + 1
    top = sorted(contagem.items(), key=lambda item: (-item[1], item[0]))[:5]
    lista_top = ", ".join(f"{p} ({n}x)" for p, n in top) if top else "nenhuma"
    return (f"Análise: {len(palavras)} palavras, {len(frases)} frase(s), "
            f"{len(texto)} caracteres. Mais repetidas: {lista_top}.")


def resumir(texto: str, quantidade_frases: int = 2) -> str:
    """Resumo simples: pega as frases com as palavras mais 'importantes'."""
    frases = [f.strip() for f in re.split(r"(?<=[.!?])\s+", texto) if len(f.strip()) > 25]
    if not frases:
        return "Texto curto demais para resumir."
    contagem = {}
    for palavra in re.findall(r"\w+", texto.lower()):
        if len(palavra) > 4:
            contagem[palavra] = contagem.get(palavra, 0) + 1
    nota = lambda frase: sum(contagem.get(p, 0) for p in re.findall(r"\w+", frase.lower()))
    melhores = sorted(frases, key=nota, reverse=True)[:quantidade_frases]
    ordem_original = [f for f in frases if f in melhores]
    return "Resumo rápido:\n- " + "\n- ".join(ordem_original)


# ---------------------------------------------------------------------------
# 5) INFORMAÇÕES DA MÁQUINA
# ---------------------------------------------------------------------------
def info_sistema() -> str:
    return (f"Sistema: {platform.system()} {platform.release()} | "
            f"Python {platform.python_version()} | "
            f"Processador: {platform.machine()} | "
            f"Pasta do projeto: {os.getcwd()}")


# ---------------------------------------------------------------------------
# 6) SORTEIO (útil para fluxos com opções)
# ---------------------------------------------------------------------------
def sortear(opcoes) -> str:
    """
    Escolhe uma opção ao acaso. Aceita lista ou texto separado por | ou ;
    Ex.: sortear("estudar | treinar | descansar")  ->  "treinar"
    """
    if isinstance(opcoes, str):
        itens = [item.strip() for item in re.split(r"[|;]", opcoes) if item.strip()]
    elif isinstance(opcoes, (list, tuple)):
        itens = [str(item).strip() for item in opcoes if str(item).strip()]
    else:
        itens = []
    if not itens:
        return "Não recebi opções para sortear. Use: estudar | treinar | descansar"
    return random.choice(itens)


# ---------------------------------------------------------------------------
# 7) INTERNET (opcional e desligada por padrão)
# ---------------------------------------------------------------------------
def ler_pagina(url: str, maximo_caracteres: int = 1200) -> str:
    """
    Baixa o texto de uma página. É OPTATIVO: se não houver internet, devolve aviso.
    Observação: isto não usa 'API paga' nenhuma, só o protocolo HTTP do próprio Python.
    """
    if not str(url).startswith(("http://", "https://")):
        return "Preciso de um endereço começando com http:// ou https://"
    try:
        import urllib.request

        pedido = urllib.request.Request(url, headers={"User-Agent": "AgenteLocal/1.0"})
        with urllib.request.urlopen(pedido, timeout=10) as resposta:
            html = resposta.read().decode("utf-8", errors="replace")
        texto = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
        texto = re.sub(r"<[^>]+>", " ", texto)
        texto = re.sub(r"\s+", " ", texto).strip()
        return f"Conteúdo de {url}:\n{texto[:maximo_caracteres]}"
    except Exception as erro:
        return f"Não consegui acessar a internet agora ({erro}). O agente continua funcionando offline."


# ---------------------------------------------------------------------------
# Catálogo: o que o agente sabe fazer com as próprias mãos
# ---------------------------------------------------------------------------
CATALOGO = {
    "calcular": {
        "funcao": calcular,
        "descricao": "Faz contas matemáticas com segurança",
        "exemplo": "calcular: (25 * 4) + 10",
    },
    "data_hora": {
        "funcao": data_hora,
        "descricao": "Diz a data e a hora do computador",
        "exemplo": "data_hora",
    },
    "salvar_arquivo": {
        "funcao": salvar_arquivo,
        "descricao": "Grava um texto em dados/saidas/",
        "exemplo": "salvar_arquivo: nota.txt | meu primeiro texto",
    },
    "ler_arquivo": {
        "funcao": ler_arquivo,
        "descricao": "Lê um arquivo de dados/saidas/",
        "exemplo": "ler_arquivo: nota.txt",
    },
    "listar_arquivos": {
        "funcao": listar_arquivos,
        "descricao": "Lista os arquivos já criados",
        "exemplo": "listar_arquivos",
    },
    "apagar_arquivo": {
        "funcao": apagar_arquivo,
        "descricao": "Apaga um arquivo de dados/saidas/",
        "exemplo": "apagar_arquivo: nota.txt",
    },
    "analisar_texto": {
        "funcao": analisar_texto,
        "descricao": "Conta palavras e mostra as mais repetidas",
        "exemplo": "analisar_texto: seu texto aqui",
    },
    "resumir": {
        "funcao": resumir,
        "descricao": "Faz um resumo curto de um texto",
        "exemplo": "resumir: texto grande...",
    },
    "info_sistema": {
        "funcao": info_sistema,
        "descricao": "Mostra dados do computador e do Python",
        "exemplo": "info_sistema",
    },
    "sortear": {
        "funcao": sortear,
        "descricao": "Escolhe uma opção ao acaso (separe por | )",
        "exemplo": "sortear: café | chá | suco",
    },
    "ler_pagina": {
        "funcao": ler_pagina,
        "descricao": "Lê o texto de uma página da internet (opcional)",
        "exemplo": "ler_pagina: https://exemplo.com",
    },
}


def executar(nome_ferramenta: str, *argumentos):
    """Chama uma ferramenta pelo nome. É o que o orquestrador usa."""
    ferramenta = CATALOGO.get(nome_ferramenta)
    if not ferramenta:
        return f"Não conheço a ferramenta '{nome_ferramenta}'."
    try:
        return ferramenta["funcao"](*argumentos)
    except Exception as erro:
        return f"Deu erro ao executar '{nome_ferramenta}': {erro}"


if __name__ == "__main__":  # teste rápido
    print(calcular("(25 + 5) * 2 - 10 / 4"))
    print(data_hora())
    print(analisar_texto("O agente de IA trabalha sozinho e o agente aprende rápido."))
    print(info_sistema())
    print(salvar_arquivo("teste_ferramentas.txt", "olá, mundo!"))
    print(listar_arquivos())
