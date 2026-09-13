"""Inventario estatico; nunca importa nem executa o agente."""
import ast
import collections
import hashlib
import itertools
import re
import sys
from pathlib import Path


def auditar(fonte):
    arvore = ast.parse(fonte)
    funcoes = {n.name: n for n in arvore.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))}
    registro = []
    for no in arvore.body:
        if isinstance(no, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'tools' for t in no.targets):
            if isinstance(no.value, (ast.List, ast.Tuple)):
                registro = [ast.unparse(x) for x in no.value.elts]
    grupos = collections.defaultdict(list)
    descricoes = {}
    for nome in registro:
        fn = funcoes.get(nome)
        if fn is None:
            continue
        corpo = fn.body
        if corpo and isinstance(corpo[0], ast.Expr) and isinstance(corpo[0].value, ast.Constant) and isinstance(corpo[0].value.value, str):
            corpo = corpo[1:]
        estrutura = ast.dump(ast.Module(body=corpo, type_ignores=[]), include_attributes=False)
        grupos[hashlib.sha256(estrutura.encode()).hexdigest()].append(nome)
        desc = (ast.get_docstring(fn) or '').lower()
        descricoes[nome] = set(re.findall(r'[a-zá-ú]{4,}', nome.replace('_', ' ') + ' ' + desc))
    candidatos = []
    for a, b in itertools.combinations(descricoes, 2):
        x, y = descricoes[a], descricoes[b]
        score = len(x & y) / max(1, len(x | y))
        if score >= .35:
            candidatos.append((score, a, b))
    return registro, funcoes, [g for g in grupos.values() if len(g) > 1], sorted(candidatos, reverse=True)


def relatorio(fonte):
    nomes, funcoes, identicos, candidatos = auditar(fonte)
    linhas = ['# Auditoria estatica das ferramentas — r7', '',
              f'- Ferramentas registradas: {len(nomes)}.',
              f'- Nomes distintos: {len(set(nomes))}.',
              f'- Registros sem definicao de funcao no topo: {sorted(set(nomes) - set(funcoes))}.',
              f'- Nomes repetidos no registro: {[n for n, c in collections.Counter(nomes).items() if c > 1]}.',
              f'- Grupos com corpo AST identico (ignorando docstring): {len(identicos)}.', '',
              '## Corpos identicos', '']
    linhas.extend('- ' + ', '.join(g) for g in identicos)
    if not identicos:
        linhas.append('Nenhum encontrado pelo criterio utilizado.')
    linhas += ['', '## Sobreposicoes candidatas (nao sao duplicatas comprovadas)', '',
               'Similaridade de palavras das descricoes/nomes. Pode haver falsos positivos',
               'e falsos negativos; nao detecta toda equivalencia funcional. Nada foi removido.', '']
    for score, a, b in candidatos[:25]:
        linhas.append(f'- {a} (linha {funcoes[a].lineno}) / {b} (linha {funcoes[b].lineno}): {score:.0%}.')
    linhas += ['', '## Inventario preservado', '']
    linhas.extend(f'- `{nome}`' for nome in nomes)
    return '\n'.join(linhas) + '\n'


if __name__ == '__main__':
    raiz = Path(__file__).resolve().parents[1]
    caminho = Path(sys.argv[1]) if len(sys.argv) > 1 else raiz / 'agente.py'
    print(relatorio(caminho.read_text(encoding='utf-8-sig')), end='')
