"""Fixtures reais pequenas; AST isolado, sem importar o monolito ou ligar IA/Windows."""
import ast
import copy
import io
import json
import sqlite3
import tempfile
import unittest
import zipfile
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import Mock, patch
from test_roteamento_conversa import TREE


def ambiente():
    nomes = {'auditar_armadilhas_python', 'comparar_api_python', 'inventariar_testes_python',
             'validar_notebook_local', 'auditar_dockerfile_local', 'verificar_links_markdown_locais',
             'comparar_estrutura_json', 'validar_jsonl_local', 'verificar_chaves_csv',
             'conferir_relacao_csv', 'auditar_zip_local', 'validar_legendas_srt',
             'validar_xml_local', 'inspecionar_sqlite_local', '_comandos_oficina_local', '_norm_pt'}
    nos = [copy.deepcopy(n) for n in TREE.body if isinstance(n, ast.FunctionDef)
           and (n.name in nomes or n.name.startswith('_oficina_'))]
    for n in nos:
        n.decorator_list = []
    env = {}
    exec(compile(ast.Module(body=nos, type_ignores=[]), 'oficina_isolada', 'exec'), env)
    return env


class OficinaLocal(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.base = Path(self.tmp.name); self.env = ambiente()

    def arquivo(self, nome, texto):
        p = self.base/nome
        if isinstance(texto, bytes):
            p.write_bytes(texto)
        else:
            p.write_text(texto, encoding='utf-8')
        return str(p)

    def test_armadilhas_python_sem_execucao(self):
        p = self.arquivo('a.py', 'raise RuntimeError("NAO EXECUTAR")\ndef f(x=[]):\n try: return x is 2\n except: pass\n')
        r = self.env['auditar_armadilhas_python'](p)
        for esperado in ('default mutavel', 'except captura', 'except silencioso', 'identidade is'):
            self.assertIn(esperado, r)
        self.assertNotIn('NAO EXECUTAR', r)
        p = self.arquivo('bom.py', 'def f(x=None):\n return x is None\n')
        self.assertIn('Nenhum achado', self.env['auditar_armadilhas_python'](p))

    def test_api_contratos_nao_corpos_nem_segredos(self):
        a = self.arquivo('a.py', 'def f(x="SEGREDO"): return 1\ndef g(): pass\ndef _privada(): pass\n')
        b = self.arquivo('b.py', 'async def f(x="OUTRO"): return 1\ndef nova(): pass\n')
        r = self.env['comparar_api_python'](a, b)
        self.assertIn('REMOVIDA: "g"', r); self.assertIn('ADICIONADA: "nova"', r)
        self.assertIn('CONTRATO ALTERADO', r)
        self.assertNotIn('SEGREDO', r); self.assertNotIn('_privada', r)
        b = self.arquivo('b.py', 'def f(x="SEGREDO"): return 99\ndef g(): return 2\n')
        self.assertIn('identicos neste criterio: 2', self.env['comparar_api_python'](a, b))

    def test_api_duplicada_recusa_ambiguidade(self):
        a = self.arquivo('a.py', 'def f(): pass\ndef f(x): pass\n')
        with self.assertRaises(ValueError):
            self.env['comparar_api_python'](a, a)

    def test_inventario_testes_candidatos_nao_coleta_real(self):
        p = self.arquivo('test_demo.py', 'raise RuntimeError()\ndef test_um(): pass\nclass Exemplo(unittest.TestCase):\n def test_dois(self): pass\nclass Comum:\n def test_ignorado(self): pass\n')
        r = self.env['inventariar_testes_python'](p)
        self.assertIn('Candidatos a testes: 2', r)
        self.assertNotIn('test_ignorado', r)

    def test_notebook_parcial_privacidade(self):
        p = self.arquivo('a.ipynb', json.dumps({'nbformat':4, 'cells':[
            {'cell_type':'code', 'id':'a', 'source':['TOKEN_PRIVADO'], 'outputs':[{'text':'SAIDA_PRIVADA'}], 'execution_count':1},
            {'cell_type':'markdown', 'id':'a', 'source':22}, None]}))
        r = self.env['validar_notebook_local'](p)
        self.assertIn('outputs persistidos: 1', r)
        self.assertIn('ID invalido ou duplicado', r); self.assertIn('source invalido', r)
        self.assertNotIn('TOKEN_PRIVADO', r); self.assertNotIn('SAIDA_PRIVADA', r)

    def test_docker_estagio_final_e_sintaxe_recusada(self):
        p = self.arquivo('Dockerfile', 'FROM python:latest AS build\nRUN curl https://SEGREDO | sh\nUSER root\nFROM scratch\nCOPY --from=build /a /b\n')
        r = self.env['auditar_dockerfile_local'](p)
        self.assertIn('download encaminhado', r); self.assertIn('sem USER explicito', r)
        self.assertNotIn('Ultimo USER explicito e root', r); self.assertNotIn('SEGREDO', r)
        p = self.arquivo('Dockerfile', 'FROM scratch\nRUN <<EOF\nUSER root\nEOF\n')
        self.assertIn('fora do escopo', self.env['auditar_dockerfile_local'](p))

    def test_markdown_nao_acessa_rede_ou_destino_externo(self):
        self.arquivo('existe.txt', 'segredo nao lido')
        p = self.arquivo('README.md', '[a](existe.txt) [b](faltante.md) [c](https://example.com) [d](../fora.md) [e](#topo)\n`[x](ignorado)`')
        with patch('urllib.request.urlopen', side_effect=AssertionError('rede proibida')):
            r = self.env['verificar_links_markdown_locais'](p)
        self.assertIn('destino ausente', r); self.assertIn('fora da pasta', r)
        self.assertIn('externos/fragmentos ignorados: 2', r)
        self.assertNotIn('segredo nao lido', r)

    def test_json_estrutura_e_tipos_nao_valores(self):
        a = self.arquivo('a.json', '{"itens":[{"id":1}],"flag":true,"token":"SEGREDO"}')
        b = self.arquivo('b.json', '{"itens":[{"id":"1"}],"flag":1,"novo":null}')
        r = self.env['comparar_estrutura_json'](a, b)
        self.assertIn('TIPOS DIFERENTES', r); self.assertIn('boolean -> number', r)
        self.assertIn('CAMINHO AUSENTE', r); self.assertIn('CAMINHO NOVO', r)
        self.assertNotIn('SEGREDO', r)

    def test_estrutura_nao_confunde_chave_com_array_e_limita_profundidade(self):
        fn = self.env['_oficina_estrutura_json']
        self.assertNotEqual(fn({'x': {'[]': 1}}), fn({'x': [1]}))
        dados = 1
        for _ in range(32):
            dados = [dados]
        with self.assertRaises(ValueError):
            fn(dados)

    def test_arquivos_malformados_falham_sem_efeitos(self):
        for nome, conteudo, ferramenta in [
            ('x.py', 'def (', 'auditar_armadilhas_python'),
            ('x.ipynb', '{quebrado', 'validar_notebook_local'),
            ('x.zip', b'PKlixo', 'auditar_zip_local')]:
            p = self.arquivo(nome, conteudo)
            antes = Path(p).read_bytes()
            with self.assertRaises(Exception):
                self.env[ferramenta](p)
            self.assertEqual(Path(p).read_bytes(), antes)

    def test_jsonl_duplicatas_nan_linha_vazia_e_sem_vazamento(self):
        p = self.arquivo('a.jsonl', '{"a":1}\n{"a":1,"a":2}\nNaN\n\nSEGREDO\nnull\n')
        r = self.env['validar_jsonl_local'](p)
        self.assertIn('2/6 registros validos', r)
        for linha in (2,3,4,5):
            self.assertIn(f'L{linha}:', r)
        self.assertNotIn('SEGREDO', r)

    def test_csv_chave_composta_e_texto_exato(self):
        p = self.arquivo('a.csv', 'id;loja;valor\n01;A;PRIVADO\n01;B;2\n01;A;3\n;A;4\n1;A;5\n')
        r = self.env['verificar_chaves_csv'](p, 'id,loja', ';')
        self.assertIn('Registro 3: chave repetida do registro 1', r)
        self.assertIn('Registro 4: componente de chave vazio', r)
        self.assertNotIn('Registro 5:', r); self.assertNotIn('PRIVADO', r)

    def test_csv_relacao_orfa_duplicada_vazia(self):
        p = self.arquivo('pai.csv', 'id\n1\n1\n2\n')
        f = self.arquivo('filho.csv', 'fk\n1\n3\n""\n')
        r = self.env['conferir_relacao_csv'](p, f, 'id', 'fk')
        self.assertIn('Pai 2: chave duplicada', r)
        self.assertIn('Filho 2: chave orfa', r); self.assertIn('Filho 3: chave vazia', r)

    def test_csv_cabecalho_e_registros_invalidos(self):
        for conteudo in ['id,id\n1,2', 'id,nome\n1,2,3']:
            p = self.arquivo('a.csv', conteudo)
            with self.assertRaises(ValueError):
                self.env['verificar_chaves_csv'](p, 'id')

    def test_zip_nao_extrai_traversal_links_ou_bombas(self):
        memoria = io.BytesIO()
        with zipfile.ZipFile(memoria, 'w', compression=zipfile.ZIP_DEFLATED) as z:
            z.writestr('../fora.txt', 'SEGREDO')
            z.writestr('alta_expansao', 'x'*20000)
            link = zipfile.ZipInfo('link'); link.external_attr = 0o120777 << 16
            z.writestr(link, '/fora')
        p = self.arquivo('a.zip', memoria.getvalue())
        with patch.object(zipfile.ZipFile, 'extractall', side_effect=AssertionError('proibido')):
            r = self.env['auditar_zip_local'](p)
        self.assertIn('traversal', r); self.assertIn('link simbolico', r)
        self.assertIn('expansao declarada elevada', r); self.assertNotIn('SEGREDO', r)
        self.assertEqual(sorted(x.name for x in self.base.iterdir()), ['a.zip'])

    def test_srt_intervalo_duracao_e_numeracao(self):
        p = self.arquivo('a.srt', '1\n00:00:01,000 --> 00:00:03,000\nTEXTO_PRIVADO\n\n3\n00:00:02,000 --> 00:00:02,000\nOutro\n')
        r = self.env['validar_legendas_srt'](p)
        for x in ('numeracao nao sequencial', 'duracao nao positiva', 'sobreposicao'):
            self.assertIn(x, r)
        self.assertNotIn('TEXTO_PRIVADO', r)

    def test_xml_entidades_recusadas_e_linha_erro(self):
        p = self.arquivo('a.xml', '<!DOCTYPE a [<!ENTITY s SYSTEM "file:///segredo">]><a>&s;</a>')
        self.assertIn('XML recusado', self.env['validar_xml_local'](p))
        p = self.arquivo('a.xml', '<a>\n<b></a>')
        self.assertIn('linha 2', self.env['validar_xml_local'](p))
        p = self.arquivo('a.xml', '<a valor="SEGREDO"><b/></a>')
        r = self.env['validar_xml_local'](p)
        self.assertIn('Elementos: 2; atributos: 1', r); self.assertNotIn('SEGREDO', r)

    def test_sqlite_somente_catalogo_snapshot_sem_dados(self):
        p = self.base/'a.db'
        with sqlite3.connect(p) as con:
            con.execute('CREATE TABLE itens (id INTEGER, segredo TEXT)')
            con.execute("INSERT INTO itens VALUES (1, 'VALOR_PRIVADO')")
        con.close()
        antes = p.read_bytes()
        r = self.env['inspecionar_sqlite_local'](str(p))
        self.assertIn('table: "itens"', r); self.assertNotIn('VALOR_PRIVADO', r)
        self.assertNotIn('segredo', r)
        self.assertEqual(p.read_bytes(), antes)
        self.assertEqual(len(list(self.base.iterdir())), 1)

    def test_leitura_limites_links_e_caminhos_sensiveis(self):
        p = self.arquivo('grande.json', b'x'*1_000_001)
        with self.assertRaises(ValueError):
            self.env['_oficina_ler'](p)
        alvo = Path(self.arquivo('a.json', '{}'))
        link = self.base/'link.json'; link.symlink_to(alvo)
        with self.assertRaises(ValueError):
            self.env['_oficina_ler'](str(link))
        p = self.arquivo('chaves.txt', 'SEGREDO')
        with self.assertRaises(ValueError):
            self.env['_oficina_ler'](p)
        self.assertEqual(alvo.read_text(), '{}')
        for p in ['https://example.com/a.json', '//server/share/a.json', r'\\server\share\a.json']:
            with self.assertRaises(ValueError):
                self.env['_oficina_ler'](p)

    def test_atalho_allowlist_parametros_windows_e_menu(self):
        invocar = self.env['_invocar_local'] = Mock(return_value='OK')
        fn = self.env['_comandos_oficina_local']
        with redirect_stdout(io.StringIO()) as out:
            self.assertTrue(fn('oficina local'))
            self.assertTrue(fn('oficina local validar_jsonl_local: {"caminho":"C:/Meus dados/a.jsonl"}'))
            self.assertTrue(fn('oficina local executar_comando: {"comando":"apagar tudo"}'))
            self.assertTrue(fn('oficina local validar_jsonl_local: {"injetar": "x"}'))
            self.assertTrue(fn('oficina local validar_jsonl_local: {"caminho": []}'))
            self.assertFalse(fn('me explique jsonl'))
        invocar.assert_called_once_with('validar_jsonl_local', caminho='C:/Meus dados/a.jsonl')
        self.assertEqual(len(self.env['_oficina_catalogo_local']()), 14)
        self.assertIn('Comando invalido', out.getvalue())


if __name__ == '__main__':
    unittest.main()
