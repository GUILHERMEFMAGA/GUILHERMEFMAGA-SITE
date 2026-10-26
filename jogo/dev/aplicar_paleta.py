#!/usr/bin/env python3
# troca a lista de cores FIXA do paleta.js pelas cores de out/paleta_192.json (feito por refazer_paleta.sh)
import json, os, re, sys
D = os.path.dirname(os.path.abspath(__file__))
entrada = sys.argv[1] if len(sys.argv) > 1 else D + '/out/paleta_192.json'
cores = [c.lower().lstrip('#') for c in json.load(open(entrada))]
assert all(re.fullmatch(r'[0-9a-f]{6}', c) for c in cores), 'cor invalida na paleta'
linhas = [''.join(cores[i:i + 12]) for i in range(0, len(cores), 12)]
bloco = "  const FIXA =\n" + " +\n".join("    '" + l + "'" for l in linhas) + ";\n"
arq = D + '/../paleta.js'
s = open(arq, encoding='utf-8').read()
novo, n = re.subn(r"  const FIXA =\n(?:    '[0-9a-f]+'(?: \+)?\n?)+;?\n", bloco, s, count=1)
assert n == 1, 'nao achei a lista FIXA em paleta.js'
open(arq, 'w', encoding='utf-8').write(novo)
print('paleta.js atualizado com', len(cores), 'cores')
