"""
Pacote 'agente' -- o coração do seu agente de IA local.

Módulos:
    texto.py         -> transforma frases em números (vetorizador)
    rede_neural.py   -> a rede neural escrita do zero (o cérebro que aprende)
    memoria.py       -> memória curta e longa (SQLite)
    conhecimento.py  -> base de conhecimento com busca por palavras-chave
    gerador.py       -> geração de texto por cadeia de Markov
    ferramentas.py   -> as ações (calcular, salvar arquivo, resumir...)
    orquestrador.py  -> o motor de automação estilo n8n (fluxos em JSON)
    nucleo.py        -> junta tudo: entender -> decidir -> agir -> responder
"""

VERSAO = "1.0"
NOME_PADRAO = "NÚCLEO"

__all__ = [
    "texto",
    "rede_neural",
    "memoria",
    "conhecimento",
    "gerador",
    "ferramentas",
    "orquestrador",
    "nucleo",
]
