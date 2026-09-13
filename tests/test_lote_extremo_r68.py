"""r68: LOTE EXTREMO — as 30 ideias (3 substituidas pela pre-checagem anti-
duplicata: pomodoro/rastreio de habitos/area de transferencia JA existiam no
codigo). Tudo local, DI de ponta a ponta, sem importar o agente."""
import datetime
import io
import os
import tempfile
import unittest
from contextlib import redirect_stdout
from types import SimpleNamespace

from test_roteamento_conversa import carregar


def _env(*nomes):
    return carregar(*nomes, '_norm_pt', os=os, json=__import__('json'))


class Cerebro(unittest.TestCase):
    def test_indexa_e_acha_por_nome(self):
        casa = tempfile.mkdtemp()
        docs = os.path.join(casa, 'Documents')
        os.makedirs(os.path.join(docs, 'contas'))
        io.open(os.path.join(docs, 'contas', 'boleto-luz-janeiro.pdf'), 'wb').write(b'x')
        io.open(os.path.join(docs, 'foto.png'), 'wb').write(b'y')
        env = _env('_r68_cerebro_indexar', '_r68_cerebro_buscar')
        saida = env['_r68_cerebro_indexar'](raizes=[docs], pasta=casa)
        self.assertIn('2 arquivo(s) indexados', saida)
        achou = env['_r68_cerebro_buscar']('boleto', pasta=casa)
        self.assertIn('boleto-luz-janeiro.pdf', achou)
        self.assertIn('contas', achou)
        self.assertIn('Nao achei', env['_r68_cerebro_buscar']('imposto', pasta=casa))

    def test_buscar_sem_indice_orienta(self):
        env = _env('_r68_cerebro_buscar')
        self.assertIn("cerebro indexar", env['_r68_cerebro_buscar']('boleto', pasta=tempfile.mkdtemp()))


class Arquivos(unittest.TestCase):
    def test_duplicatas_por_hash(self):
        pasta = tempfile.mkdtemp()
        io.open(os.path.join(pasta, 'a.txt'), 'wb').write(b'mesmo conteudo')
        io.open(os.path.join(pasta, 'b.txt'), 'wb').write(b'mesmo conteudo')
        io.open(os.path.join(pasta, 'c.txt'), 'wb').write(b'diferente')
        env = _env('_r68_cacar_duplicatas')
        saida = env['_r68_cacar_duplicatas'](pasta_alvo=pasta)
        self.assertIn('1 grupo(s) de arquivos IDENTICOS', saida)
        self.assertIn('NAO apago nada', saida)

    def test_comparador_de_pastas(self):
        a, b = tempfile.mkdtemp(), tempfile.mkdtemp()
        io.open(os.path.join(a, 'igual.txt'), 'w').write('x')
        io.open(os.path.join(a, 'so_a.txt'), 'w').write('x')
        io.open(os.path.join(b, 'igual.txt'), 'w').write('maior conteudo')
        io.open(os.path.join(b, 'so_b.txt'), 'w').write('x')
        env = _env('_r68_comparar_pastas')
        saida = env['_r68_comparar_pastas'](a, b)
        self.assertIn('so_a.txt', saida)
        self.assertIn('so_b.txt', saida)
        self.assertIn('tamanhos diferentes: igual.txt', saida)

    def test_fiscal_de_espaco_lista_maiores(self):
        pasta = tempfile.mkdtemp()
        io.open(os.path.join(pasta, 'grande.bin'), 'wb').write(b'0' * 3000)
        io.open(os.path.join(pasta, 'pequeno.txt'), 'wb').write(b'1')
        env = _env('_r68_fiscal_espaco')
        saida = env['_r68_fiscal_espaco'](pasta_alvo=pasta)
        self.assertIn('grande.bin', saida)
        self.assertIn('total medido', saida)

    def test_links_extrai_sem_rede(self):
        arq = os.path.join(tempfile.mkdtemp(), 'notas.md')
        io.open(arq, 'w').write('veja https://exemplo.com/a e https://exemplo.com/a e http://fim.br')
        env = _env('_r68_conferir_links')
        saida = env['_r68_conferir_links'](arq)
        self.assertIn('2 link(s) unico(s)', saida)

    def test_raiox_pdf_le_marcadores(self):
        arq = os.path.join(tempfile.mkdtemp(), 'livro.pdf')
        io.open(arq, 'wb').write(b'%PDF-1.4 ... /Type /Page /Type /Page ...')
        env = _env('_r68_raio_x_pdf')
        saida = env['_r68_raio_x_pdf'](arq)
        self.assertIn('PDF valido: True', saida)
        self.assertIn('~2', saida)


class Sistema(unittest.TestCase):
    def test_auditoria_de_inicializacao(self):
        class Falso:
            returncode = 0
            stdout = 'Name : Steam\nCommand : steam.exe\n'
        env = _env('_r68_auditar_inicializacao')
        saida = env['_r68_auditar_inicializacao'](executar=lambda: Falso())
        self.assertIn('Steam', saida)
        self.assertIn('Eu nao desativo nada', saida)

    def test_detetive_de_lentidao_com_psutil_falso(self):
        proc = SimpleNamespace(info={'name': 'chrome.exe', 'memory_percent': 42.5})
        env = _env('_r68_detetive_lentidao')
        saida = env['_r68_detetive_lentidao'](processos=lambda: [proc])
        self.assertIn('chrome.exe — 42.5% da RAM', saida)

    def test_detetive_sem_dados_da_o_caminho(self):
        env = _env('_r68_detetive_lentidao')
        self.assertIn('Ctrl+Shift+Esc', env['_r68_detetive_lentidao'](processos=lambda: []))

    def test_guardiao_de_privacidade_e_honesto(self):
        class Falso:
            returncode = 0
            stdout = 'Camera  Integrada HD\n'
        env = _env('_r68_guardiao_privacidade')
        saida = env['_r68_guardiao_privacidade'](executar=lambda: Falso())
        self.assertIn('Integrada HD', saida)
        self.assertIn('NAO invento' if 'NAO invento' in saida else 'LED da camera', saida)

    def test_internet_fora_e_somente_lembrete(self):
        base = datetime.datetime(2026, 9, 13, 10, 0)
        env = _env('_r68_internet_fora', '_r68_internet_volta')
        saida = env['_r68_internet_fora'](5, agora=base)
        self.assertIn('as 10:05', saida)
        self.assertIn('NAO desligo nada sozinho', saida)
        self.assertIn('cancelado', env['_r68_internet_volta']())
        self.assertIn('Nao havia', env['_r68_internet_volta']())

    def test_espelho_mostra_o_proprio_codigo(self):
        arq = os.path.join(tempfile.mkdtemp(), 'agente.py')
        io.open(arq, 'w').write('def _r68_cerebro_indexar():\n    return 1\n\n\ndef outra():\n    pass\n')
        env = _env('_r68_espelho')
        saida = env['_r68_espelho']('cerebro_indexar', caminho=arq)
        self.assertIn('def _r68_cerebro_indexar', saida)
        self.assertNotIn('def outra', saida)


class Estudo(unittest.TestCase):
    def test_quiz_cria_e_corrige(self):
        env = _env('_r68_quiz_iniciar', '_r68_quiz_responder')
        texto = 'A fotossintese transforma luz em energia. As plantas usam clorofila para isso acontecer bem.'
        inicio = env['_r68_quiz_iniciar'](texto)
        self.assertIn('Quiz pronto! 2 pergunta(s)', inicio)
        r1 = env['_r68_quiz_responder']('fotossintese')
        self.assertIn('ACERTOU!', r1)
        r2 = env['_r68_quiz_responder']('errado')
        self.assertIn('a resposta era', r2)
        self.assertIn('1/2 acertos', r2)

    def test_entrevista_fluxo_completo(self):
        env = _env('_r68_entrevista')
        inicio = env['_r68_entrevista']('atendente')
        self.assertIn('Pergunta 1/6', inicio)
        r = env['_r68_entrevista'](resposta='curta')
        self.assertIn('resposta curta', r)
        r2 = env['_r68_entrevista'](resposta='eu trabalhei cinco anos no atendimento e minha maior vitoria foi...')
        self.assertIn('boa resposta', r2)

    def test_prova_com_corrige(self):
        env = _env('_r68_prova')
        inicio = env['_r68_prova']()
        self.assertIn('PROVA relampago', inicio)
        nota = env['_r68_prova']('1b 2a 3a 4a 5a')
        self.assertIn('Nota: 5/5', nota)

    def test_revisao_espacada_escada(self):
        pasta = tempfile.mkdtemp()
        agora = datetime.datetime(2026, 9, 13)
        env = _env('_r68_revisar_salvar', '_r68_revisar_hoje', '_r68_revisar_feito')
        env['_r68_revisar_salvar']('capital da Franca', pasta=pasta, agora=agora)
        hoje = env['_r68_revisar_hoje'](pasta=pasta, agora=agora + datetime.timedelta(days=1))
        self.assertIn('capital da Franca', hoje)
        self.assertIn('proxima revisao em 3 dia(s)', env['_r68_revisar_feito'](1, pasta=pasta, agora=agora + datetime.timedelta(days=1)))
        self.assertIn('nada para revisar hoje', env['_r68_revisar_hoje'](pasta=pasta, agora=agora + datetime.timedelta(days=1)))

    def test_ortografia_troca_internetes(self):
        env = _env('_r68_ortografia')
        saida = env['_r68_ortografia'](' vc viu? hj tem festa, obg!')
        self.assertIn('hj -> hoje', saida)
        self.assertIn('obg -> obrigado', saida)


class CasaEVida(unittest.TestCase):
    def test_geladeira_e_receitas(self):
        pasta = tempfile.mkdtemp()
        env = _env('_r68_geladeira', '_r68_o_que_cozinhar')
        self.assertIn('geladeira anotada', env['_r68_geladeira']('arroz, feijao, ovo', pasta=pasta))
        self.assertIn('Arroz com feijao', env['_r68_o_que_cozinhar'](pasta=pasta))

    def test_organizar_e_desfazer_com_log(self):
        import shutil
        pasta = tempfile.mkdtemp()
        io.open(os.path.join(pasta, 'foto.jpg'), 'wb').write(b'x')
        io.open(os.path.join(pasta, 'nota.txt'), 'wb').write(b'y')
        env = _env('_r68_organizar', '_r68_desfazer_organizacao')
        saida = env['_r68_organizar'](pasta, mover=shutil.move)
        self.assertIn('2 arquivo(s) organizados', saida)
        self.assertTrue(os.path.isfile(os.path.join(pasta, 'imagens', 'foto.jpg')))
        volta = env['_r68_desfazer_organizacao'](pasta)
        self.assertIn('2 arquivo(s) devolvidos', volta)
        self.assertTrue(os.path.isfile(os.path.join(pasta, 'foto.jpg')))

    def test_jardim_planta_e_agrupa(self):
        pasta = tempfile.mkdtemp()
        env = _env('_r68_jardim_plantar', '_r68_jardim_ver')
        env['_r68_jardim_plantar']('estudar para o enem', pasta=pasta, agora=datetime.datetime(2026, 9, 13))
        env['_r68_jardim_plantar']('consertar a torneira', pasta=pasta, agora=datetime.datetime(2026, 9, 13))
        saida = env['_r68_jardim_ver'](pasta=pasta)
        self.assertIn('estudo (1)', saida)
        self.assertIn('casa (1)', saida)

    def test_aniversarios_dias_restantes(self):
        pasta = tempfile.mkdtemp()
        env = _env('_r68_aniversario')
        env['_r68_aniversario']('Ana', '07/09', pasta=pasta)
        saida = env['_r68_aniversario']('Ana', pasta=pasta)
        self.assertIn('Ana — 07/09', saida)
        self.assertIn('dia(s)', env['_r68_aniversario'](pasta=pasta))

    def test_citacoes_guarda_e_destaca(self):
        pasta = tempfile.mkdtemp()
        env = _env('_r68_citar', '_r68_citacoes')
        self.assertIn('guardada', env['_r68_citar']('Aiaiai — Chefe', pasta=pasta))
        self.assertIn('Aiaiai', env['_r68_citacoes'](pasta=pasta))


class Ferramentas(unittest.TestCase):
    def test_calculadora_de_obra(self):
        env = _env('_r68_calculadora_obra')
        saida = env['_r68_calculadora_obra']('calcular obra parede 4x3')
        self.assertIn('12.0 m2', saida)
        self.assertIn('tinta: ~4.0 litro(s)', saida)

    def test_extrato_soma_coluna_ptbr(self):
        arq = os.path.join(tempfile.mkdtemp(), 'extrato.csv')
        io.open(arq, 'w').write('Data;Valor\n01/09;1.234,56\n02/09;-100,00\n')
        env = _env('_r68_analisar_extrato')
        saida = env['_r68_analisar_extrato'](arq)
        self.assertIn('1134.56', saida)

    def test_cartaz_e_prep_traducao_e_descrio_honesto(self):
        pasta = tempfile.mkdtemp()
        env = _env('_r68_criar_cartaz', '_r68_prep_traducao', '_r68_descrever_imagem')
        self.assertIn('cartaz criado', env['_r68_criar_cartaz']('VENDA DE BOLOS', pasta=pasta))
        txt = os.path.join(pasta, 'livro.txt')
        io.open(txt, 'w').write('palavra ' * 3000)
        self.assertIn('6 bloco(s)', env['_r68_prep_traducao'](txt, pasta=pasta))
        img = os.path.join(pasta, 'foto.jpg')
        io.open(img, 'wb').write(b'nao e um jpeg de verdade')
        saida = env['_r68_descrever_imagem'](img)
        self.assertIn('NAO invento', saida)


class Jogos(unittest.TestCase):
    def test_rpg_comeca_avanca_e_termina(self):
        env = _env('_r68_rpg')
        inicio = env['_r68_rpg']('comecar')
        self.assertIn('Ficha:', inicio)
        self.assertIn('goblin', env['_r68_rpg']('1'))
        fim = env['_r68_rpg']('2')
        self.assertIn('FIM', fim)
        self.assertIn('Nenhuma aventura', env['_r68_rpg']('status'))


class RotaR68(unittest.TestCase):
    def test_varias_frases_caiem_nos_trabalhadores(self):
        env = _env('_r68_comandos')
        vistos = []

        def marcar(nome):
            def fun(*a, **k):
                vistos.append(nome)
                return 'FEITO'
            return fun
        for nome in ('_r68_cerebro_indexar', '_r68_cacar_duplicatas', '_r68_auditar_inicializacao',
                     '_r68_detetive_lentidao', '_r68_citar', '_r68_citacoes', '_r68_quiz_iniciar',
                     '_r68_quiz_responder', '_r68_escrever', '_r68_guardiao_privacidade',
                     '_r68_prep_traducao', '_r68_ortografia', '_r68_revisar_salvar', '_r68_revisar_hoje',
                     '_r68_geladeira', '_r68_o_que_cozinhar', '_r68_organizar', '_r68_desfazer_organizacao',
                     '_r68_conferir_links', '_r68_descrever_imagem', '_r68_entrevista',
                     '_r68_analisar_extrato', '_r68_criar_cartaz', '_r68_calculadora_obra',
                     '_r68_prova', '_r68_narrar', '_r68_jardim_plantar', '_r68_jardim_ver',
                     '_r68_fiscal_espaco', '_r68_aniversario', '_r68_internet_fora',
                     '_r68_internet_volta', '_r68_espelho'):
            env[nome] = marcar(nome)
        frases = ('cerebro indexar', 'cacar duplicatas', 'o que liga com o windows',
                  'por que o pc esta lento', 'citar frase boa', 'citacoes', 'quiz',
                  'responder quiz casa', 'escrever', 'privacidade agora',
                  'traduzir arquivo x.txt', 'ortografia oi', 'revisar salvar itens',
                  'revisar hoje', 'minha geladeira arroz', 'o que cozinhar',
                  'organizar downloads', 'desfazer organizacao', 'conferir links notas.md',
                  'o que tem nesta foto f.jpg', 'simular entrevista gerente',
                  'analisar extrato e.csv', 'criar cartaz festa', 'calcular obra 4x3',
                  'prova', 'ler em voz alta doc.txt', 'ideia estudar enem',
                  'ver jardim', 'o que esta comendo meu disco', 'aniversarios',
                  'internet fora 5', 'internet volta', 'me mostra seu codigo cerebro')
        for frase in frases:
            with redirect_stdout(io.StringIO()):
                self.assertTrue(env['_r68_comandos'](frase), frase)
        self.assertEqual(len(vistos), len(frases))
        with redirect_stdout(io.StringIO()):
            self.assertFalse(env['_r68_comandos']('conte uma piada'))
            self.assertFalse(env['_r68_comandos']('ideias ja sugeridas'))

    def test_onde_esta_sem_indice_nao_rouba_a_rota(self):
        env = _env('_r68_comandos')
        with redirect_stdout(io.StringIO()):
            self.assertFalse(env['_r68_comandos']('onde esta o chrome'))


class Estrutura(unittest.TestCase):
    def test_cadeia_menu_selo(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        self.assertLess(texto.index('if _r67_comandos(comando):'),
                        texto.index('if _r68_comandos(comando):'))
        self.assertLess(texto.index('if _r68_comandos(comando):'),
                        texto.index('if _r62_comandos(comando):'))
        self.assertIn('LOTE EXTREMO (r68)', texto)
        self.assertEqual(texto.count('[Motor e avaliacao local 2026-09-11-r69]'), 1)


if __name__ == '__main__':
    unittest.main()
