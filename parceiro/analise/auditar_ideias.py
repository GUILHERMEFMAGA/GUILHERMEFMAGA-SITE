"""Auditoria de leitura + sondas em TemporaryDirectory; nao altera o produto.
Executar da raiz: python3 parceiro/analise/auditar_ideias.py
A saida JSON e evidencia, nao um certificado de seguranca.
"""
import ast
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[2]


def auditar():
    caminhos = subprocess.check_output(
        ['git', 'ls-files', '-z', 'agente-ia', '.arena-delivery', 'test2.html'],
        cwd=ROOT).decode().split('\0')
    inventario, corpos = [], {}
    for nome in filter(None, caminhos):
        p = ROOT / nome
        bruto = p.read_bytes()
        item = {'arquivo': nome, 'sha256': hashlib.sha256(bruto).hexdigest(),
                'linhas': len(bruto.splitlines())}
        if p.suffix == '.py':
            arvore = ast.parse(bruto.decode('utf-8'), filename=nome)
            funcs = [n for n in ast.walk(arvore) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
            item['funcoes'] = [{'nome': n.name, 'linha': n.lineno} for n in funcs]
            for n in funcs:
                corpo = [s for s in n.body if not (isinstance(s, ast.Expr)
                         and isinstance(s.value, ast.Constant) and isinstance(s.value.value, str))]
                if not corpo:
                    continue
                chave = ast.dump(ast.Module(body=corpo, type_ignores=[]))
                corpos.setdefault(chave, []).append(f'{nome}:{n.lineno} {n.name}')
        elif p.suffix == '.json':
            json.loads(bruto)
        elif p.suffix == '.jsonl':
            for linha in bruto.decode().splitlines():
                if linha.strip() and not linha.lstrip().startswith('#'):
                    json.loads(linha)
        inventario.append(item)

    spec = importlib.util.spec_from_file_location('loop_auditado', ROOT / '.arena-delivery/agente/loop.py')
    loop = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loop)
    sondas = {}
    with tempfile.TemporaryDirectory(prefix='ideias-75-') as pasta:
        raiz = Path(pasta)
        loop.RAIZ = raiz
        for nome, rel in {'CEREBRO': 'fluxos/regras.json', 'RASCUNHOS': 'fluxos/rascunhos',
                          'VIGILIA': 'memoria/vigilia.json', 'FILA': 'fila',
                          'CORRENTES_DIARIO': 'memoria/correntes.json'}.items():
            setattr(loop, nome, raiz / rel)
        loop.CEREBRO.parent.mkdir()
        regras = {'acoes': [], 'aprendizado': {'ligado': False},
                  'vigilia': {'ligado': True, 'tolerancia_seg': 0,
                             'olhos': [{'pasta': 'projeto', 'ao_chegar': ['inventario']}]}}
        loop.CEREBRO.write_text(json.dumps(regras))
        loop.SO_OLHAR = True
        loop.executar({'id': 'sonda', 'criar_arquivo': 'inocente.txt', 'conteudo': 'fixture'}, 'cena')
        sondas['so_olhar_criou_arquivo'] = (raiz / 'cena/inocente.txt').exists()
        loop.SO_OLHAR = False
        loop.registrar_experiencia('sonda', 'teste', 1)
        sondas['aprendizado_desligado_gravou'] = (raiz / 'memoria/aprendizado.json').exists()
        loop.vigiar()  # calibra somente o diretorio temporario
        (raiz / 'novo.txt').write_text('fixture')
        loop.ENSAIAR = True
        loop.vigiar()
        sondas['ensaio_escreveu_inventario'] = (raiz / 'relatorios/inventario-projeto.txt').exists()
        loop.RASCUNHOS.mkdir()
        (loop.RASCUNHOS / 'nao-ensaiada.json').write_text(json.dumps({
            'ativa': True, 'proposta': {'id': 'nao-ensaiada'}}))
        sondas['promoveu_proposta_sem_campos_obrigatorios'] = 'nao-ensaiada' in loop.promover()
    return {'escopo': 'Fontes rastreados do site e archive pos-B16; nao inclui PC do dono.',
            'inventario': inventario,
            'duplicatas_corpo_ast': [v for v in corpos.values() if len(v) > 1],
            'sondas_em_diretorio_temporario': sondas}


if __name__ == '__main__':
    print(json.dumps(auditar(), ensure_ascii=False, indent=2))
