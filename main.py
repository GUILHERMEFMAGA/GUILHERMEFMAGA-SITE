# -*- coding: utf-8 -*-
# r46: este lancador existe para o Windows carregar o agente como MODULO.
# O CPython so guarda bytecode pronto em __pycache__ para modulos importados —
# um script rodado direto (python agente.py) e RECOMPILADO do zero a cada
# abertura (0,3 s+ medidos). Primeira abertura apos cada atualizacao ainda
# compila uma vez; as outras carregam o bytecode pronto.
# r49: a DECISAO de atualizacao/bibliotecas agora acontece AQUI, dentro deste
# mesmo processo python — o iniciar.bat no caminho rapido roda UM python so
# (antes eram dois: um so para decidir). Codigos de saida para o BAT:
#   7 = carimbo .ultima_verificacao venceu -> o BAT verifica atualizacao
#   8 = falta biblioteca das IAs          -> o BAT instala e recomeca
# Tudo depois do import e exatamente o mesmo programa de sempre.
import os
import sys
import time

_PASTA = os.path.dirname(os.path.abspath(__file__))


def _verificacao_fresca():
    try:
        return (time.time() - os.stat(os.path.join(_PASTA, '.ultima_verificacao')).st_mtime) < 43200
    except OSError:
        return False


def _bibliotecas_ok():
    import importlib.util
    return (importlib.util.find_spec('langchain_openai') is not None
            and importlib.util.find_spec('langchain_google_genai') is not None)


def _agente_integro():
    """r57 (escudo de arranque): o agente.py COMPILA? Um arquivo corrompido
    no disco (escrita interrompida, antivírus) fechava na hora e o BAT antigo
    nao tentava reparo. Agora: saida 7 = o BAT baixa a versao oficial sozinho."""
    try:
        with open(os.path.join(_PASTA, 'agente.py'), 'rb') as f:
            compile(f.read(), 'agente.py', 'exec')
        return True
    except (OSError, SyntaxError, ValueError):
        return False


if not os.path.isfile(os.path.join(_PASTA, 'SEM_ATUALIZAR.txt')):
    if not _verificacao_fresca():
        print('Verificando atualizacoes do agente (uma vez a cada 12 horas)...')
        sys.exit(7)
    if not _bibliotecas_ok():
        print('Falta uma biblioteca das IAs; o iniciar.bat instala agora...')
        sys.exit(8)
    if not _agente_integro():
        print('agente.py esta corrompido no disco; o iniciar.bat vai reparar sozinho...')
        sys.exit(7)

import agente
