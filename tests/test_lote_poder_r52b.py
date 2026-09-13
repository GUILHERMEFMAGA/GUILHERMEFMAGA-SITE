"""r52 (parte 2): lote PODER — catalogar_pdfs, prever_espaco_disco,
auditar_acessibilidade_html, auditar_seo_html, info_executavel, doc_para_pdf,
minificar_js_css (na parte 1), cofre_de_notas, vigia_de_preco,
guardiao_de_arquivo, explicar_regex (parte 1), csv_para_sqlite,
backup_diferencial_de_pasta, organizar_imports_python, gerar_sitemap.
Isoladas via carregar(); DPAPI e PowerShell falsificados; sem rede."""
import io
import json
import os
import sqlite3
import tempfile
import threading
import unittest
from datetime import datetime

from test_roteamento_conversa import carregar


def ambiente(nomes, pasta):
    env = carregar(*nomes, tool=lambda f: f)
    env['os'] = os
    env['json'] = json
    env['threading'] = threading
    env['datetime'] = datetime
    env['PASTA_BASE'] = pasta
    env['executar_com_autocura'] = lambda nome, f: f()
    return env


class CofreDPAPI(unittest.TestCase):
    def test_ciclo_do_cofre_com_dpapi_falsa(self):
        pasta = tempfile.mkdtemp()
        env = ambiente(['cofre_de_notas'], pasta)
        env['_r51_dpapi_proteger'] = lambda b: b[::-1]
        env['_r51_dpapi_revelar'] = lambda b: b[::-1]
        self.assertIn('Nota guardada no cofre (total: 1)',
                      env['cofre_de_notas']('adicionar', 'senha do wifi: 123'))
        self.assertIn('total: 2', env['cofre_de_notas']('adicionar', 'segundo segredo'))
        self.assertIn('Cofre com 2 nota(s)', env['cofre_de_notas']('listar'))
        lido = env['cofre_de_notas']('ler')
        self.assertIn('senha do wifi: 123', lido)
        self.assertIn('segundo segredo', lido)
        # o arquivo em disco NAO pode conter o texto em claro
        with io.open(os.path.join(pasta, 'cofre_de_notas.cripto'), 'rb') as f:
            self.assertNotIn(b'segundo segredo', f.read())
        self.assertIn('Me diga o texto', env['cofre_de_notas']('adicionar', '  '))
        self.assertIn('Acao invalida', env['cofre_de_notas']('voar'))

    def test_cofre_corrompido_avisа_sem_quebrar(self):
        pasta = tempfile.mkdtemp()
        env = ambiente(['cofre_de_notas'], pasta)
        io.open(os.path.join(pasta, 'cofre_de_notas.cripto'), 'wb').write(b'lixo')
        self.assertIn('Nao consegui abrir o cofre', env['cofre_de_notas']('ler'))
        vazio = ambiente(['cofre_de_notas'], tempfile.mkdtemp())
        self.assertIn('esta vazio', vazio['cofre_de_notas']('ler'))


class VigiasDoAgente(unittest.TestCase):
    def test_guardiao_ciclo_liga_status_e_para(self):
        pasta = tempfile.mkdtemp()
        env = ambiente(['guardiao_de_arquivo', '_r52_estado', '_r52_hash_arquivo'], pasta)
        alvo = os.path.join(pasta, 'tese.txt')
        io.open(alvo, 'w').write('capitulo 1')
        self.assertIn('Guardiao: desligado', env['guardiao_de_arquivo'](acao='status'))
        self.assertIn('Guardiao ligado', env['guardiao_de_arquivo'](alvo, intervalo=2))
        self.assertIn('ATIVO', env['guardiao_de_arquivo'](acao='status'))
        self.assertIn('ja esta ativo', env['guardiao_de_arquivo'](alvo))
        saida = env['guardiao_de_arquivo'](acao='parar')
        self.assertIn('Guardiao desligado', saida)
        self.assertIn('Guardiao: desligado', env['guardiao_de_arquivo'](acao='status'))
        self.assertIn('Nao encontrei', env['guardiao_de_arquivo']('falta.txt'))
        self.assertIn('nao esta ativo', env['guardiao_de_arquivo'](acao='parar'))

    def test_prever_espaco_linha_de_base_e_extrapolacao(self):
        pasta = tempfile.mkdtemp()
        env = ambiente(['prever_espaco_disco', '_r52_json_local'], pasta)
        subpasta = os.path.join(pasta, 'projetos')
        os.makedirs(subpasta)
        io.open(os.path.join(subpasta, 'a.bin'), 'wb').write(b'x' * 1048576)  # 1 MB
        primeira = env['prever_espaco_disco'](subpasta)
        self.assertIn('1.0 MB', primeira)
        self.assertIn('Linha de base guardada', primeira)
        # semeia uma amostra de ondia com metade do tamanho -> crescimento 1 MB/dia
        import time
        caminho_estado = os.path.join(pasta, 'previsao_espaco.json')
        with io.open(caminho_estado, encoding='utf-8') as f:
            estado = json.load(f)
        chave = list(estado.keys())[0]
        estado[chave] = [[time.time() - 86400, 524288], estado[chave][0]]
        with io.open(caminho_estado, 'w', encoding='utf-8') as f:
            json.dump(estado, f)
        segunda = env['prever_espaco_disco'](subpasta)
        self.assertIn('Crescimento medido: 0.5 MB por dia', segunda)
        self.assertIn('Dobra de tamanho em', segunda)
        com_alvo = env['prever_espaco_disco'](subpasta, alvo_mb=4)
        self.assertIn('Atinge o alvo de 4 MB em', com_alvo)

    def test_vigia_de_preco_guardas_e_historico_vazio(self):
        pasta = tempfile.mkdtemp()
        env = ambiente(['vigia_de_preco', '_r52_extrair_preco', '_r52_json_local'], pasta)
        self.assertIn('http:// ou https://', env['vigia_de_preco']('sem link'))
        self.assertIn('Ainda nao tenho historico',
                      env['vigia_de_preco']('https://loja.com/produto', acao='historico'))
        # extrator de preco puro
        self.assertEqual(env['_r52_extrair_preco']('De R$ 1.299,90 por R$ 899,00'), 1299.9)
        self.assertEqual(env['_r52_extrair_preco']('custa R$ 45.5 hoje'), 45.5)
        self.assertIsNone(env['_r52_extrair_preco']('sem preco'))


class AuditoriasHTML(unittest.TestCase):
    def setUp(self):
        self.pasta = tempfile.mkdtemp()

    def _escrever(self, nome, conteudo):
        caminho = os.path.join(self.pasta, nome)
        io.open(caminho, 'w', encoding='utf-8').write(conteudo)
        return caminho

    def test_html_ruim_aponta_tudo(self):
        env = ambiente(['auditar_acessibilidade_html', 'auditar_seo_html',
                        '_r52_auditar_html'], self.pasta)
        ruim = self._escrever('ruim.html',
                              '<html><body><h1>Um</h1><h3>Tres</h3>'
                              '<img src="x.png"><img src="y.png" alt="ok">'
                              '<input><a href="#"></a><a href="#v">ver</a></body></html>')
        acess = env['auditar_acessibilidade_html'](ruim)
        self.assertIn('5 ponto(s)', acess)
        self.assertIn('sem atributo lang', acess)
        self.assertIn('1 <img> sem atributo alt', acess)
        self.assertIn('h1->h3', acess)
        self.assertIn('link(s) sem texto', acess)
        seo = env['auditar_seo_html'](ruim)
        self.assertIn('sem <title>', seo)
        self.assertIn('meta description', seo)
        self.assertIn('canonical', seo)

    def test_html_bom_passa_limpo(self):
        env = ambiente(['auditar_acessibilidade_html', 'auditar_seo_html',
                        '_r52_auditar_html'], self.pasta)
        bom = self._escrever('bom.html',
                             '<html lang="pt-BR"><head><title>Guia definitivo do agente local</title>'
                             '<meta name="description" content="' + 'x' * 90 + '">'
                             '<link rel="canonical" href="https://x.com/">'
                             '<meta property="og:title" content="t">'
                             '<meta property="og:description" content="d">'
                             '<meta property="og:image" content="i.png"></head><body>'
                             '<h1>Titulo</h1><img src="a.png" alt="desenho"></body></html>')
        self.assertIn('Nenhum problema de acessibilidade', env['auditar_acessibilidade_html'](bom))
        self.assertIn('SEO basico OK', env['auditar_seo_html'](bom))
        self.assertIn('Nao encontrei', env['auditar_seo_html']('falta.html'))


class WindowsEOffice(unittest.TestCase):
    def test_info_executavel_le_a_ficha(self):
        pasta = tempfile.mkdtemp()
        env = ambiente(['info_executavel'], pasta)
        exe = os.path.join(pasta, 'programa.exe')
        io.open(exe, 'wb').write(b'MZ')
        env['_r51_executar_processo'] = lambda cmd, prazo: (
            0, 'CompanyName : ACME Ltda\nProductName : ProgramaX\nFileDescription : Faz coisas\n'
               'FileVersion : 1.2.3.4\nProductVersion : 2.0\nTAMANHO=10\n', '')
        ficha = env['info_executavel'](exe)
        self.assertIn('- Empresa: ACME Ltda', ficha)
        self.assertIn('- Versao do arquivo: 1.2.3.4', ficha)
        env['_r51_executar_processo'] = lambda cmd, prazo: (1, '', 'boom')
        self.assertIn('nao conseguiu ler a ficha', env['info_executavel'](exe))
        self.assertIn('Nao encontrei', env['info_executavel']('nada.exe'))

    def test_doc_para_pdf_guardas_e_pywin32(self):
        pasta = tempfile.mkdtemp()
        env = ambiente(['doc_para_pdf'], pasta)
        self.assertIn('Nao encontrei', env['doc_para_pdf']('falta.docx'))
        texto = os.path.join(pasta, 'nota.txt')
        io.open(texto, 'w').write('oi')
        self.assertIn('So converto .doc', env['doc_para_pdf'](texto))
        try:
            import win32com.client  # noqa: F401
            self.skipTest('pywin32 presente no venv')
        except Exception:
            pass
        doc = os.path.join(pasta, 'relatorio.docx')
        io.open(doc, 'w').write('x')
        self.assertIn('pip install pywin32', env['doc_para_pdf'](doc))
        self.assertIn('nao instalo nada por voce', env['doc_para_pdf'](doc))


class CodigosEDados(unittest.TestCase):
    def test_catalogar_pdfs_guarda_e_le_com_pypdf(self):
        pasta = tempfile.mkdtemp()
        env = ambiente(['catalogar_pdfs'], pasta)
        self.assertIn('Nenhum PDF', env['catalogar_pdfs'](pasta))
        self.assertIn('Nao encontrei', env['catalogar_pdfs']('nao/existe'))
        try:
            import pypdf  # noqa: F401
        except Exception:
            self.skipTest('pypdf ausente no venv de testes')
        from pypdf import PdfWriter
        caminho = os.path.join(pasta, 'relatorio.pdf')
        escritor = PdfWriter()
        escritor.add_blank_page(width=200, height=200)
        with io.open(caminho, 'wb') as f:
            escritor.write(f)
        saida = env['catalogar_pdfs'](pasta)
        self.assertIn('Indice de 1 PDF(s)', saida)
        self.assertIn('1 pag.', saida)

    def test_csv_para_sqlite_importa_e_consulta(self):
        pasta = tempfile.mkdtemp()
        env = ambiente(['csv_para_sqlite'], pasta)
        csv = os.path.join(pasta, 'vendas.csv')
        io.open(csv, 'w', encoding='utf-8-sig').write('produto,valor\ncafe,12.5\ncha,8\n')
        saida = env['csv_para_sqlite'](csv, nome_tabela='vendas jan')
        self.assertIn('vendas.db', saida)
        self.assertIn('2 coluna(s) e 2 linha(s)', saida)
        conexao = sqlite3.connect(os.path.join(pasta, 'vendas.db'))
        try:
            linhas = conexao.execute('SELECT produto, valor FROM "vendas_jan" ORDER BY produto').fetchall()
        finally:
            conexao.close()
        self.assertEqual(linhas, [('cafe', '12.5'), ('cha', '8')])
        self.assertIn('esta vazio', env['csv_para_sqlite'](_csv_vazio(pasta)))
        self.assertIn('mesmo nome do CSV', env['csv_para_sqlite'](csv, saida_db=csv))

    def test_backup_diferencial_copia_so_o_que_mudou(self):
        pasta = tempfile.mkdtemp()
        env = ambiente(['backup_diferencial_de_pasta', '_r52_hash_arquivo'], pasta)
        origem = os.path.join(pasta, 'origem')
        os.makedirs(origem)
        io.open(os.path.join(origem, 'a.txt'), 'w').write('um')
        io.open(os.path.join(origem, 'b.txt'), 'w').write('dois')
        destino = os.path.join(pasta, 'destino')
        primeira = env['backup_diferencial_de_pasta'](origem, destino)
        self.assertIn('2 arquivo(s) copiado(s), 0 ja em dia', primeira)
        segunda = env['backup_diferencial_de_pasta'](origem, destino)
        self.assertIn('0 arquivo(s) copiado(s), 2 ja em dia', segunda)
        io.open(os.path.join(origem, 'a.txt'), 'w').write('um!!')
        terceira = env['backup_diferencial_de_pasta'](origem, destino)
        self.assertIn('1 arquivo(s) copiado(s), 1 ja em dia', terceira)
        with io.open(os.path.join(destino, 'a.txt'), encoding='utf-8') as f:
            self.assertEqual(f.read(), 'um!!')
        self.assertIn('mesma pasta', env['backup_diferencial_de_pasta'](origem, origem))

    def test_organizar_imports_ordena_com_backup_e_idempotente(self):
        pasta = tempfile.mkdtemp()
        env = ambiente(['organizar_imports_python', '_r52_imports_reorganizar'], pasta)
        alvo = os.path.join(pasta, 'rotina.py')
        io.open(alvo, 'w').write('import zzz_externo\nimport os\nfrom json import loads\n\n\ndef roda():\n    return os.sep\n')
        saida = env['organizar_imports_python'](alvo)
        self.assertIn('Organizei 3 import(s)', saida)
        self.assertIn('.organizado.bak', saida)
        with io.open(alvo, encoding='utf-8') as f:
            topo = f.read().split('\n\n\n')[0]
        self.assertEqual(topo, 'from json import loads\nimport os\nimport zzz_externo')
        self.assertIn('ja estao organizados', env['organizar_imports_python'](alvo))
        with io.open(alvo + '.organizado.bak', encoding='utf-8') as f:
            self.assertIn('import zzz_externo\nimport os', f.read())
        quebrado = os.path.join(pasta, 'ruim.py')
        io.open(quebrado, 'w').write('def x(:\n')
        self.assertIn('Nao mexi', env['organizar_imports_python'](quebrado))

    def test_gerar_sitemap_monta_xml(self):
        pasta = tempfile.mkdtemp()
        env = ambiente(['gerar_sitemap'], pasta)
        io.open(os.path.join(pasta, 'index.html'), 'w').write('<html></html>')
        io.open(os.path.join(pasta, 'sobre.html'), 'w').write('<html></html>')
        os.makedirs(os.path.join(pasta, '.git'))
        io.open(os.path.join(pasta, '.git', 'segredo.html'), 'w').write('x')
        saida = env['gerar_sitemap'](pasta, 'https://meusite.com')
        self.assertIn('sitemap.xml gerado com 2 URL(s)', saida)
        with io.open(os.path.join(pasta, 'sitemap.xml'), encoding='utf-8') as f:
            xml = f.read()
        self.assertIn('<loc>https://meusite.com/</loc>', xml)
        self.assertIn('<loc>https://meusite.com/sobre.html</loc>', xml)
        self.assertNotIn('segredo', xml)
        self.assertIn('dominio completo', env['gerar_sitemap'](pasta, 'meusite.com'))
        self.assertIn('Nao encontrei a pasta', env['gerar_sitemap']('vazio', 'https://x.com'))


def _csv_vazio(pasta):
    caminho = os.path.join(pasta, 'vazio.csv')
    io.open(caminho, 'w').write('')
    return caminho


if __name__ == '__main__':
    unittest.main()
