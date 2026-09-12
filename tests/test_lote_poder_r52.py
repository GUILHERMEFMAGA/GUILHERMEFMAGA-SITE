"""r52 (parte 1): lote PODER — ferramentas inteligentes e ajudantes do
proprio agente (mapa_de_ideias, plano_de_tarefa, timeline_do_dia,
limpar_metadata_imagem, imagens_para_pdf, sugerir_commit,
diagrama_mermaid_codigo, leitor_rss, gerar_flashcards, estimar_tarefa,
avaliar_risco_comando, compartilhar_arquivo_qr, analisador_de_logs,
gerar_favicon, padronizar_series). Isoladas via carregar(), sem rede e sem
tocar nada real do PC."""
import io
import json
import os
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


class FerramentasDePlanejamento(unittest.TestCase):
    def setUp(self):
        self.pasta = tempfile.mkdtemp()

    def test_mapa_de_ideias_monta_mermaid(self):
        env = ambiente(['mapa_de_ideias'], self.pasta)
        saida = env['mapa_de_ideias']('site novo', 'design; conteudo; hospedagem')
        self.assertIn('mindmap', saida)
        self.assertIn('root(( site novo ))', saida)
        for ramo in ('design', 'conteudo', 'hospedagem'):
            self.assertIn(ramo, saida)
        self.assertIn('tema', env['mapa_de_ideias']('', 'a'))

    def test_plano_de_tarefa_ordena_com_dependencia(self):
        env = ambiente(['plano_de_tarefa'], self.pasta)
        saida = env['plano_de_tarefa']('lançar o site', 'desenhar; programar; testar; publicar')
        self.assertIn('PLANO: lançar o site', saida)
        self.assertIn('1. [ ] desenhar (pode comecar junto)', saida)
        self.assertIn('4. [ ] publicar (depende da etapa 3)', saida)
        self.assertIn('estimar_tarefa', saida)
        self.assertIn('Me diga o objetivo', env['plano_de_tarefa']('', 'a'))

    def test_estimar_tarefa_pert_com_data_e_erro_de_ordem(self):
        env = ambiente(['estimar_tarefa', '_r52_dias_uteis_depois'], self.pasta)
        saida = env['estimar_tarefa'](2, 4, 10, custo_por_hora=50)
        self.assertIn('4.7 horas', saida)
        self.assertIn('+-1.3h', saida)
        self.assertIn('Termino provavel (dias uteis):', saida)
        self.assertIn('R$ 233.33', saida)
        self.assertIn('otimista <= provavel', env['estimar_tarefa'](10, 4, 2))
        self.assertIn('ordem', env['estimar_tarefa'](10, 4, 2))

    def test_avaliar_risco_classifica_sem_executar(self):
        env = ambiente(['avaliar_risco_comando', '_r52_nivel_de_risco'], self.pasta)
        critico = env['avaliar_risco_comando']('format c: /q')
        self.assertIn('CRITICO', critico)
        self.assertIn('FORMATA', critico)
        self.assertIn('NAO rode sem backup', critico)
        self.assertIn('MEDIO', env['avaliar_risco_comando']('pip install requests'))
        baixo = env['avaliar_risco_comando']('echo oi')
        self.assertIn('BAIXO', baixo)
        self.assertIn('NUNCA executo', env['avaliar_risco_comando'].__doc__.replace('\n', ' '))

    def test_explicar_regex_valida_invalida_e_tokens(self):
        env = ambiente(['explicar_regex', '_r52_explicar_regex_tokens'], self.pasta)
        saida = env['explicar_regex'](r'^\d{3}$')
        self.assertIn('Regex valida', saida)
        self.assertIn('dígito', saida)
        self.assertIn('contador de repetição', saida)
        ruim = env['explicar_regex']('([')
        self.assertIn('NAO e valida', ruim)


class FerramentasDeArquivoETempo(unittest.TestCase):
    def setUp(self):
        self.pasta = tempfile.mkdtemp()

    def test_timeline_do_dia_agrupa_por_hora(self):
        env = ambiente(['timeline_do_dia'], self.pasta)
        io.open(os.path.join(self.pasta, 'hoje.txt'), 'w').write('x')
        saida = env['timeline_do_dia'](pasta=self.pasta)
        self.assertIn('Linha do tempo de', saida)
        self.assertIn('hoje.txt', saida)
        self.assertIn('Nenhum arquivo', env['timeline_do_dia'](pasta=self.pasta, dia='2001-02-03'))
        self.assertIn('AAAA-MM-DD', env['timeline_do_dia'](pasta=self.pasta, dia='ontem'))
        self.assertIn('Nao encontrei', env['timeline_do_dia'](pasta='nao/existe'))

    def test_limpar_metadata_jpeg_e_png_copia_limpa(self):
        env = ambiente(['limpar_metadata_imagem', '_r52_exif_resumido',
                        '_r52_jpeg_sem_metadados', '_r52_png_sem_metadados'], self.pasta)
        env['_r52_exif_resumido'] = lambda caminho: ['Apple', 'iPhone 15']
        jpeg = (b'\xff\xd8\xff\xe1\x00\x10' + b'Exif' + b'\x00' * 10
                + b'\xff\xda\x00\x0c' + b'DADOSIMAGEM')
        caminho_jpg = os.path.join(self.pasta, 'foto.jpg')
        io.open(caminho_jpg, 'wb').write(jpeg)
        saida = env['limpar_metadata_imagem'](caminho_jpg)
        self.assertIn('Copia limpa salva', saida)
        self.assertIn('_limpa.jpg', saida)
        self.assertIn('2 campo(s)', saida)
        with io.open(os.path.join(self.pasta, 'foto_limpa.jpg'), 'rb') as f:
            limpo = f.read()
        self.assertNotIn(b'Exif', limpo)
        self.assertIn(b'DADOSIMAGEM', limpo)
        with io.open(caminho_jpg, 'rb') as f:
            self.assertEqual(f.read(), jpeg)  # original intacto
        self.assertIn('ja esta sem metadados', env['limpar_metadata_imagem'](
            os.path.join(self.pasta, 'foto_limpa.jpg')))

    def test_limpar_metadata_png_e_guardas(self):
        env = ambiente(['limpar_metadata_imagem', '_r52_exif_resumido',
                        '_r52_jpeg_sem_metadados', '_r52_png_sem_metadados'], self.pasta)
        env['_r52_exif_resumido'] = lambda caminho: []
        assinatura = b'\x89PNG\r\n\x1a\n'

        def chunk(tipo, dados):
            return len(dados).to_bytes(4, 'big') + tipo + dados + b'\x00' * 4
        png = (assinatura + chunk(b'IHDR', b'\x00' * 13) + chunk(b'tEXt', b'Comentario\x00secreto')
               + chunk(b'IEND', b''))
        caminho_png = os.path.join(self.pasta, 'img.png')
        io.open(caminho_png, 'wb').write(png)
        saida = env['limpar_metadata_imagem'](caminho_png)
        self.assertIn('Copia limpa salva', saida)
        with io.open(os.path.join(self.pasta, 'img_limpa.png'), 'rb') as f:
            self.assertNotIn(b'secreto', f.read())
        self.assertIn('Nao encontrei', env['limpar_metadata_imagem']('vazio.jpg'))
        self.assertIn('JPEG e PNG', env['limpar_metadata_imagem'](__file__))

    def test_imagens_para_pdf_guardas(self):
        env = ambiente(['imagens_para_pdf'], self.pasta)
        self.assertIn('Nao encontrei a pasta', env['imagens_para_pdf']('nao/existe'))
        self.assertIn('Nao achei imagens', env['imagens_para_pdf'](self.pasta))

    def test_padronizar_series_renomeia_tres_formatos(self):
        env = ambiente(['padronizar_series'], self.pasta)
        for nome in ('Minha.Serie.s01e02.mp4', 'Outra Show 1x03.mkv', 'Series S7E10.srt', 'leia-me.txt'):
            io.open(os.path.join(self.pasta, nome), 'w').write('x')
        saida = env['padronizar_series'](self.pasta, nome_serie='Minha Serie')
        self.assertIn('Renomeei 3 episodio(s)', saida)
        self.assertIn('Minha Serie S01E02.mp4', saida)
        self.assertTrue(os.path.exists(os.path.join(self.pasta, 'Minha Serie S07E10.srt')))
        self.assertTrue(os.path.exists(os.path.join(self.pasta, 'leia-me.txt')))  # intocado
        self.assertIn('Nada para renomear', env['padronizar_series'](self.pasta, nome_serie='Minha Serie'))

    def test_gerar_favicon_guarda_e_produz_com_pil(self):
        env = ambiente(['gerar_favicon'], self.pasta)
        self.assertIn('Nao encontrei', env['gerar_favicon']('nao/existe.png'))
        try:
            from PIL import Image
        except Exception:
            self.skipTest('PIL ausente no venv de testes')
        origem = os.path.join(self.pasta, 'logo.png')
        Image.new('RGBA', (64, 64), (200, 30, 30, 255)).save(origem)
        saida = env['gerar_favicon'](origem)
        self.assertIn('Favicon gerado (7 arquivos)', saida)
        saida_pasta = os.path.join(self.pasta, 'favicon')
        self.assertTrue(os.path.exists(os.path.join(saida_pasta, 'favicon.ico')))
        self.assertTrue(os.path.exists(os.path.join(saida_pasta, 'favicon_256.png')))

    def test_minificar_js_css_ganha_espaco(self):
        env = ambiente(['minificar_js_css'], self.pasta)
        css = os.path.join(self.pasta, 'estilo.css')
        io.open(css, 'w').write('/* comentario grande */\nbody  {  color : red ;  }\n')
        saida = env['minificar_js_css'](css)
        self.assertIn('estilo.css.min.css', saida)
        self.assertIn('Original intacto', saida)
        with io.open(css + '.min.css', encoding='utf-8') as f:
            self.assertEqual(f.read(), 'body{color:red;}')
        js = os.path.join(self.pasta, 'app.js')
        io.open(js, 'w').write('// nota\nlet url = "https://ok.com";\n')
        env['minificar_js_css'](js)
        with io.open(js + '.min.js', encoding='utf-8') as f:
            minificado = f.read()
        self.assertIn('https://ok.com', minificado)  # o :// precisa sobreviver
        self.assertNotIn('nota', minificado)
        self.assertIn('So minifico', env['minificar_js_css'](__file__))


class FerramentasGitEDiagrama(unittest.TestCase):
    def setUp(self):
        self.pasta = tempfile.mkdtemp()

    def test_sugerir_commit_classifica_e_nao_commita(self):
        env = ambiente(['sugerir_commit', '_r52_git'], self.pasta)
        env['_r52_git'] = lambda pasta, *args: (0, 'M  app/main.py\nA  tests/test_novo.py\n?? docs/guia.md\n')
        saida = env['sugerir_commit'](self.pasta)
        self.assertIn('3 arquivo(s)', saida)
        self.assertIn('2 novo(s), 1 alterado(s)', saida)
        self.assertIn('feat: ', saida)  # misto com codigo -> feat/fix manda
        env['_r52_git'] = lambda pasta, *args: (0, 'M  tests/test_x.py\nA  tests/test_y.py\n')
        self.assertIn('test: ', env['sugerir_commit'](self.pasta))  # SO testes -> test
        self.assertIn('git_commit_rapido', saida)
        env['_r52_git'] = lambda pasta, *args: (0, '')
        self.assertIn('Nenhuma mudanca', env['sugerir_commit'](self.pasta))
        env['_r52_git'] = lambda pasta, *args: (128, 'fatal')
        self.assertIn('nao parece ser um repositorio', env['sugerir_commit'](self.pasta))

    def test_diagrama_mermaid_mapeia_classes_e_imports(self):
        env = ambiente(['diagrama_mermaid_codigo'], self.pasta)
        alvo = os.path.join(self.pasta, 'modulo.py')
        io.open(alvo, 'w').write('import os\nfrom json import dumps\n\nclass Motor:\n    def ligar(self):\n        pass\n\ndef solta():\n    pass\n')
        saida = env['diagrama_mermaid_codigo'](alvo)
        self.assertIn('graph TD', saida)
        self.assertIn('classe Motor', saida)
        self.assertIn('ligar()', saida)
        self.assertIn('solta()', saida)
        self.assertIn('import: os', saida)
        self.assertIn('erro de sintaxe', env['diagrama_mermaid_codigo'](_escrever_ruim(self.pasta)))
        self.assertIn('Nao encontrei', env['diagrama_mermaid_codigo']('vazio.py'))


def _escrever_ruim(pasta):
    caminho = os.path.join(pasta, 'quebrado.py')
    io.open(caminho, 'w').write('def quebrado(:\n')
    return caminho


class FerramentasDeConteudo(unittest.TestCase):
    def setUp(self):
        self.pasta = tempfile.mkdtemp()

    def test_gerar_flashcards_sep_e_auto_e_csv(self):
        env = ambiente(['gerar_flashcards'], self.pasta)
        saida = env['gerar_flashcards']('capital do Brasil | Brasilia\n2 + 2 | 4\n')
        self.assertIn('Montei 2 cartao(oes)', saida)
        self.assertIn('capital do Brasil => Brasilia', saida)
        auto = env['gerar_flashcards']('Python é uma linguagem\nO git é um versionador\n')
        self.assertIn('Montei 2 cartao(oes)', auto)
        self.assertIn('Python => uma linguagem', auto)
        destino = os.path.join(self.pasta, 'cartoes.csv')
        env['gerar_flashcards']('pergunta | resposta', salvar_csv=destino)
        with io.open(destino, encoding='utf-8-sig') as f:
            conteudo = f.read()
        self.assertIn('frente,verso', conteudo.replace(' ', ''))
        self.assertIn('pergunta,resposta', conteudo)
        self.assertIn('nao consegui montar', env['gerar_flashcards']('so um texto solto').lower())

    def test_analisador_de_logs_agrupa_e_acha_pico(self):
        env = ambiente(['analisador_de_logs', '_r52_agregar_logs'], self.pasta)
        log = os.path.join(self.pasta, 'app.log')
        linhas = []
        for i in range(30):
            linhas.append('2026-09-11 14:0%d:%02d ERROR conexao com o host 10.0.0.%d falhou' % (i % 10, i, i))
        for i in range(3):
            linhas.append('2026-09-11 09:15:00 INFO tudo certo')
        io.open(log, 'w').write('\n'.join(linhas))
        saida = env['analisador_de_logs'](log)
        self.assertIn('33 linhas', saida)
        self.assertIn('30 com marcador de erro', saida)
        self.assertIn('Hora de pico', saida)
        self.assertIn('x30', saida)
        self.assertIn('host #.#.#.# falhou', saida)
        self.assertIn('Nao encontrei', env['analisador_de_logs']('sem.log'))

    def test_leitor_rss_guarda_de_url(self):
        env = ambiente(['leitor_rss'], self.pasta)
        self.assertIn('http:// ou https://', env['leitor_rss']('feed estranho'))


class CompartilhamentoQR(unittest.TestCase):
    def test_ciclo_completo_liga_qr_e_para(self):
        pasta = tempfile.mkdtemp()
        env = ambiente(['compartilhar_arquivo_qr', '_r52_estado'], pasta)
        env['gerar_qr_texto_ascii'] = lambda url: 'QRFAKE ' + url
        arquivo = os.path.join(pasta, 'backup.zip')
        io.open(arquivo, 'w').write('conteudo')
        saida = env['compartilhar_arquivo_qr'](arquivo, porta=0)
        self.assertIn('Compartilhado!', saida)
        self.assertIn('http://', saida)
        self.assertIn('backup.zip', saida)
        self.assertIn('QRFAKE', saida)
        self.assertIn('Ja existe um compartilhamento', env['compartilhar_arquivo_qr'](arquivo))
        self.assertIn('encerrado', env['compartilhar_arquivo_qr'](arquivo, acao='parar'))
        self.assertIn('Nao ha compartilhamento', env['compartilhar_arquivo_qr'](arquivo, acao='parar'))
        self.assertIn('Nao encontrei', env['compartilhar_arquivo_qr']('falta.zip'))

    def test_estrutura_menu_selo_e_catalogo_r52(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        self.assertIn('LOTE PODER (r52)', texto)                                  # menu
        self.assertIn('[Motor e avaliacao local 2026-09-11-r59]', texto)          # selo
        for nome in ('plano_de_tarefa', 'avaliar_risco_comando', 'guardiao_de_arquivo',
                     'cofre_de_notas', 'gerar_sitemap'):
            self.assertIn('    ' + nome + ',', texto)                             # 30 registradas


if __name__ == '__main__':
    unittest.main()
