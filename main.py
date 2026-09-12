# -*- coding: utf-8 -*-
# r46 (instantaneo de verdade): este lancador miudo existe para o Windows
# carregar o agente como MODULO. O CPython so guarda bytecode pronto em
# __pycache__ para modulos importados — um script rodado direto
# (python agente.py) e RECOMPILADO do zero a cada abertura (0,3 s+ medidos).
# Primeira abertura apos cada atualizacao ainda compila uma vez; as outras
# carregam o bytecode pronto. Nada mais mudou: o agente inteiro continua no
# agente.py e importar roda exatamente o mesmo programa (banner + conversa).
import agente
