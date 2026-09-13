"""r27: lote 4 do catalogo (40 ferramentas: texto, dev/referencia). AST isolado;
sem rede, sem GGUF, sem acoes reais."""
import unittest
from test_roteamento_conversa import carregar

NOMES = ('gerar_tabuada', 'anagrama_verificar', 'palindromo_verificar',
         'alfabeto_fonetico_ortografico', 'cifra_vigenere_converter', 'xor_cifrar_texto',
         'numerar_linhas_texto', 'quebrar_texto_largura', 'abreviar_nome_iniciais',
         'inverter_ordem_palavras', 'colunas_alinhar_texto', 'ordenar_linhas_pt',
         'contar_vogais_consoantes', 'caixa_alternada', 'contar_repeticoes_palavra',
         'remover_tags_html_para_texto', 'pluralizacao_simples_pt', 'conjugacao_regular_pt',
         'ordinal_por_extenso', 'explicar_cron_expressao', 'consulta_codigo_http',
         'consulta_mime_extensao', 'comparar_semver_versoes', 'contraste_cores_wcag',
         'escapar_texto_programacao', 'comparar_json_valores', 'aplanar_json_dados',
         'testar_regex_padrao', 'gerar_editorconfig', 'gerar_pre_commit_esqueleto',
         'gerar_licenca_texto', 'gerar_changelog_esqueleto', 'gerar_readme_esqueleto',
         'gerar_dotenv_exemplo', 'ordenar_requirements_dedup', 'gerar_massa_dados_teste_ptbr',
         'url_encode_decode', 'gerar_sumario_markdown', 'tokens_estimativa_texto',
         'markdown_tabela_gerar', '_limpa_hex', '_somentenumeros', '_ordena_pre', '_hoje_iso')


def env_lote4():
    return carregar(*NOMES)


class MatematicaEMensagem(unittest.TestCase):
    def setUp(self):
        self.env = env_lote4()

    def test_tabuada_faixa_e_erro(self):
        saida = self.env['gerar_tabuada'](numero='7', inicio='1', fim='3')
        self.assertIn('7 x 1 = 7', saida)
        self.assertIn('7 x 3 = 21', saida)
        with self.assertRaises(ValueError):
            self.env['gerar_tabuada'](numero='7', inicio='5', fim='2')

    def test_anagrama_sim_e_nao(self):
        self.assertIn('SIM', self.env['anagrama_verificar']('iracema', 'America'))
        self.assertIn('NAO', self.env['anagrama_verificar']('casa', 'abacate'))

    def test_palindromo_com_acento_e_espaco(self):
        self.assertIn('SIM', self.env['palindromo_verificar']('A grama e amarga!'))
        self.assertIn('NAO', self.env['palindromo_verificar']('casa'))
        self.assertIn('palindromo', self.env['palindromo_verificar']('Socorram-me, subi no onibus em Marrocos'.lower()))

    def test_fonetico_ortografico(self):
        saida = self.env['alfabeto_fonetico_ortografico'](texto='ab')
        self.assertIn('A de Aguia', saida)
        self.assertIn('B de Bola', saida)
        self.assertIn('OTAN/NATO: Alfa Bravo', saida)
        with self.assertRaises(ValueError):
            self.env['alfabeto_fonetico_ortografico'](texto='')

    def test_vigenere_ida_e_volta(self):
        cifrado = self.env['cifra_vigenere_converter'](texto='atacar ao amanhecer', chave='limao', modo='cifrar')
        linha = [l for l in cifrado.splitlines() if l and not l.startswith('Resultado')][0]
        decifrado = self.env['cifra_vigenere_converter'](texto=linha, chave='limao', modo='decifrar')
        self.assertIn('atacar ao amanhecer', decifrado)
        with self.assertRaises(ValueError):
            self.env['cifra_vigenere_converter'](texto='x', chave='123', modo='cifrar')

    def test_xor_hex_volta(self):
        cifrado = self.env['xor_cifrar_texto'](texto='segredo local', chave='chave123', modo='cifrar')
        hexa = cifrado.splitlines()[1]
        self.assertTrue(all(c in '0123456789abcdef' for c in hexa))
        volta = self.env['xor_cifrar_texto'](texto=hexa, chave='chave123', modo='decifrar')
        self.assertIn('segredo local', volta)
        with self.assertRaises(ValueError):
            self.env['xor_cifrar_texto'](texto='xyzz', chave='chave123', modo='decifrar')

    def test_numerar_linhas_formatos(self):
        saida = self.env['numerar_linhas_texto'](texto='arroz\nfeijao\ncafe')
        self.assertIn('1. arroz', saida)
        self.assertIn('3. cafe', saida)
        letras = self.env['numerar_linhas_texto'](texto='arroz\nfeijao', prefixo='a)')
        self.assertIn('a) arroz', letras)
        self.assertIn('b) feijao', letras)
        with self.assertRaises(ValueError):
            self.env['numerar_linhas_texto'](texto='x', prefixo='9-')

    def test_quebrar_largura(self):
        texto = 'uma frase bem longa com muitas palavras para testar a quebra automatica de linhas'
        saida = self.env['quebrar_texto_largura'](texto=texto, largura='20')
        linhas = [l for l in saida.splitlines() if l and not l.startswith('(')]
        self.assertTrue(all(len(l) <= 20 for l in linhas))
        self.assertGreater(len(linhas), 1)
        with self.assertRaises(ValueError):
            self.env['quebrar_texto_largura'](texto='abc', largura='5')

    def test_abreviar_e_inverter(self):
        self.assertIn('Maria S. Silva', self.env['abreviar_nome_iniciais'](nome='Maria Souza Silva'))
        self.assertIn('Maria de S. Silva', self.env['abreviar_nome_iniciais'](nome='Maria de Souza Silva'))
        self.assertIn('Souza Maria', self.env['inverter_ordem_palavras'](texto='Maria Souza'))

    def test_colunas_alinhadas(self):
        saida = self.env['colunas_alinhar_texto'](texto='nome;idade\nAna;30')
        self.assertIn('nome | idade', saida)
        self.assertIn('Ana ', saida)
        with self.assertRaises(ValueError):
            self.env['colunas_alinhar_texto'](texto='')

    def test_ordenar_respeita_acento(self):
        saida = self.env['ordenar_linhas_pt'](texto='banana\nabacaxi\nuva')
        self.assertTrue(saida.startswith('abacaxi'))
        reverso = self.env['ordenar_linhas_pt'](texto='banana\nabacaxi\nuva', reverso='sim')
        self.assertTrue(reverso.startswith('uva'))

    def test_vogais_consoantes(self):
        saida = self.env['contar_vogais_consoantes'](texto='aeiou xyz')
        self.assertIn('Vogais: 5', saida)
        self.assertIn('Consoantes: 3', saida)
        self.assertIn('mais frequentes', saida)

    def test_caixa_alternada(self):
        self.assertIn('AuGuStO', self.env['caixa_alternada'](texto='augusto'))
        self.assertIn('Ab', self.env['caixa_alternada'](texto='ab'))

    def test_contar_repeticoes_palavra_inteira(self):
        saida = self.env['contar_repeticoes_palavra'](
            texto='Casa amarela, CASA azul e casarao velho.', palavra='casa')
        self.assertIn('aparece 2 vez(es)', saida)
        self.assertIn('7 palavra(s)', saida)

    def test_remover_tags_html(self):
        saida = self.env['remover_tags_html_para_texto'](texto='<p>Ola <b>mundo</b></p>\n<p>A &amp; B</p>')
        self.assertIn('Ola mundo', saida)
        self.assertIn('A & B', saida)
        self.assertNotIn('<p>', saida)

    def test_pluralizacao(self):
        self.assertIn('animais', self.env['pluralizacao_simples_pt'](palavra='animal'))
        self.assertIn('flores', self.env['pluralizacao_simples_pt'](palavra='flor'))
        coracoes = self.env['pluralizacao_simples_pt'](palavra='coração')
        self.assertIn('corações', coracoes)
        self.assertIn('ATENCAO', coracoes)
        volta = self.env['pluralizacao_simples_pt'](palavra='animais', modo='singular')
        self.assertIn('animal', volta)

    def test_conjugacao_regular(self):
        saida = self.env['conjugacao_regular_pt'](verbo='falar')
        self.assertIn('eu falo', saida)
        self.assertIn('nós falamos', saida)
        self.assertIn('eu falei', saida)
        self.assertIn('falará', saida)
        self.assertIn('eles/elas falarão', saida)
        comer = self.env['conjugacao_regular_pt'](verbo='comer')
        self.assertIn('eu comi', comer)
        with self.assertRaises(ValueError):
            self.env['conjugacao_regular_pt'](verbo='xyz')
        self.assertIn('irregulares', self.env['conjugacao_regular_pt'](verbo='ser'))

    def test_ordinal_por_extenso(self):
        saida = self.env['ordinal_por_extenso'](numero='457')
        self.assertIn('quadringentésimo quinquagésimo sétimo', saida)
        self.assertIn('milésimo', self.env['ordinal_por_extenso'](numero='1000'))
        fem = self.env['ordinal_por_extenso'](numero='1', genero='f')
        self.assertIn('primeira', fem)
        with self.assertRaises(ValueError):
            self.env['ordinal_por_extenso'](numero='1001')


class DevEReferencia(unittest.TestCase):
    def setUp(self):
        self.env = env_lote4()

    def test_cron(self):
        saida = self.env['explicar_cron_expressao'](expressao='*/5 * * * *')
        self.assertIn('a cada 5 minuto', saida)
        semana = self.env['explicar_cron_expressao'](expressao='0 9 * * 1')
        self.assertIn('toda segunda', semana)
        self.assertIn('cada mês', semana)
        self.assertIn('dia da semana: toda segunda', semana)
        with self.assertRaises(ValueError):
            self.env['explicar_cron_expressao'](expressao='*/5 * * *')

    def test_codigo_http(self):
        saida = self.env['consulta_codigo_http'](codigo='404')
        self.assertIn('Nao encontrado', saida)
        self.assertIn('erro do cliente', saida)
        self.assertIn('erro do servidor', self.env['consulta_codigo_http'](codigo='500'))
        with self.assertRaises(ValueError):
            self.env['consulta_codigo_http'](codigo='999')

    def test_mime(self):
        self.assertIn('application/pdf', self.env['consulta_mime_extensao'](extensao='.PDF'))
        self.assertIn('image/png', self.env['consulta_mime_extensao'](extensao='png'))
        with self.assertRaises(ValueError):
            self.env['consulta_mime_extensao'](extensao='zzz')

    def test_semver(self):
        self.assertIn('B maior', self.env['comparar_semver_versoes'](a='1.4.2', b='1.10.0'))
        quebra = self.env['comparar_semver_versoes'](a='2.0.0', b='1.9.9')
        self.assertIn('A maior', quebra)
        self.assertIn('NAO (mudanca que quebra', quebra)
        pre = self.env['comparar_semver_versoes'](a='1.0.0-alpha', b='1.0.0')
        self.assertIn('B maior', pre)
        self.assertIn('IGUAIS', self.env['comparar_semver_versoes'](a='v1.2.3', b='1.2.3'))

    def test_contraste_wcag(self):
        bom = self.env['contraste_cores_wcag'](cor1='#000000', cor2='#ffffff')
        self.assertIn('21.0:1', bom)
        self.assertIn('AA PASSA', bom)
        ruim = self.env['contraste_cores_wcag'](cor1='#777777', cor2='#888888')
        self.assertIn('NAO passa', ruim)
        with self.assertRaises(ValueError):
            self.env['contraste_cores_wcag'](cor1='preto', cor2='#ffffff')

    def test_escapar_modos(self):
        self.assertIn('"caminho\\novo"', self.env['escapar_texto_programacao'](texto='caminho\novo', modo='json'))
        self.assertIn('a\\.b', self.env['escapar_texto_programacao'](texto='a.b', modo='regex'))
        self.assertIn('&lt;b&gt;', self.env['escapar_texto_programacao'](texto='<b>', modo='html'))
        self.assertIn('^&', self.env['escapar_texto_programacao'](texto='a&b', modo='cmd'))
        with self.assertRaises(ValueError):
            self.env['escapar_texto_programacao'](texto='x', modo='cobol')

    def test_comparar_json(self):
        saida = self.env['comparar_json_valores'](a='{"a":1,"b":{"c":2}}', b='{"a":2,"b":{"c":2},"d":true}')
        self.assertIn('~ a: 1 -> 2', saida)
        self.assertIn('+ d entrou', saida)
        iguais = self.env['comparar_json_valores'](a='{"a":1}', b='{"a":1}')
        self.assertIn('MESMOS valores', iguais)
        with self.assertRaises(ValueError):
            self.env['comparar_json_valores'](a='{quebrado', b='{}')

    def test_aplanar_e_reconstruir(self):
        aplanado = self.env['aplanar_json_dados'](texto='{"usuario":{"nome":"Ana","idades":[1,2]}}')
        self.assertIn('usuario.nome', aplanado)
        self.assertIn('usuario.idades[1]', aplanado)
        volta = self.env['aplanar_json_dados'](texto='{"usuario.nome": "Ana"}', modo='reconstruir')
        self.assertIn('"nome": "Ana"', volta)
        with self.assertRaises(ValueError):
            self.env['aplanar_json_dados'](texto='{"a[0]": 1}', modo='reconstruir')

    def test_regex(self):
        saida = self.env['testar_regex_padrao'](padrao=r'\d+', amostra='tenho 2 gatos e 3 caes')
        self.assertIn('casou 2 vez(es)', saida)
        self.assertIn('posicao 6-7', saida)
        self.assertIn('NAO casou nada', self.env['testar_regex_padrao'](padrao=r'\d{9}', amostra='poucos 3'))
        with self.assertRaises(ValueError):
            self.env['testar_regex_padrao'](padrao='[quebrado', amostra='x')

    def test_esqueletos_e_licencas(self):
        self.assertIn('[*.py]', self.env['gerar_editorconfig'](linguagem='python'))
        self.assertIn('indent_size = 2', self.env['gerar_editorconfig'](linguagem='js'))
        self.assertIn('pre-commit-hooks', self.env['gerar_pre_commit_esqueleto']())
        mit = self.env['gerar_licenca_texto'](tipo='mit', ano='2026', autor='Joao')
        self.assertIn('MIT License', mit)
        self.assertIn('Copyright (c) 2026 Joao', mit)
        self.assertIn('ISC License', self.env['gerar_licenca_texto'](tipo='isc', autor='X'))
        self.assertIn('Apache License 2.0', self.env['gerar_licenca_texto'](tipo='apache-2.0'))
        self.assertIn('# Changelog', self.env['gerar_changelog_esqueleto'](projeto='Agente'))
        self.assertIn('[Nao lancado]', self.env['gerar_changelog_esqueleto']())
        readme = self.env['gerar_readme_esqueleto'](nome='MeuApp')
        self.assertIn('# MeuApp', readme)
        self.assertIn('## Instalacao', readme)
        self.assertIn('DB_PASSWORD=TROQUE_AQUI', self.env['gerar_dotenv_exemplo'](servico='db'))
        self.assertIn('nao suba .env', self.env['gerar_dotenv_exemplo'](servico='api'))
        with self.assertRaises(ValueError):
            self.env['gerar_editorconfig'](linguagem='cobol')

    def test_requirements_ordenar_dedup(self):
        saida = self.env['ordenar_requirements_dedup'](
            conteudo='requests==2.9.1\nflask==3.0.0\nrequests==2.10\n# comentario\nnumpy')
        self.assertIn('flask==3.0.0', saida)
        self.assertIn('Duplicados: requests (2x)', saida)
        self.assertIn('Sem versao fixada: numpy', saida)
        self.assertIn('Comentarios ignorados: 1', saida)
        with self.assertRaises(ValueError):
            self.env['ordenar_requirements_dedup'](conteudo='   ')

    def test_massa_dados_deterministica(self):
        saida = self.env['gerar_massa_dados_teste_ptbr'](quantidade='3', seed='42')
        de_novo = self.env['gerar_massa_dados_teste_ptbr'](quantidade='3', seed='42')
        self.assertEqual(saida, de_novo)
        self.assertIn('1)', saida)
        self.assertIn('3)', saida)
        self.assertIn('CPF(teste): ', saida)
        self.assertIn('@exemplo.test', saida)
        self.assertIn('NAO pertencem a ninguem', saida)
        with self.assertRaises(ValueError):
            self.env['gerar_massa_dados_teste_ptbr'](quantidade='500')

    def test_url_encode(self):
        self.assertIn('busca%20sao%20paulo', self.env['url_encode_decode'](texto='busca sao paulo'))
        self.assertIn('busca sao paulo', self.env['url_encode_decode'](texto='busca%20sao%20paulo', modo='decodificar'))
        with self.assertRaises(ValueError):
            self.env['url_encode_decode'](texto='x', modo='transportar')

    def test_sumario_markdown(self):
        saida = self.env['gerar_sumario_markdown'](texto='# Titulo\n## Secao Um\n### Detalhe')
        self.assertIn('- [Titulo](#titulo)', saida)
        self.assertIn('- [Secao Um](#secao-um)', saida)
        self.assertIn('- [Detalhe](#detalhe)', saida)
        with self.assertRaises(ValueError):
            self.env['gerar_sumario_markdown'](texto='sem titulos aqui')

    def test_tokens_e_tabela_markdown(self):
        saida = self.env['tokens_estimativa_texto'](texto='palavra ' * 10)
        self.assertIn('Palavras: 10', saida)
        self.assertIn('Tokens ESTIMADOS', saida)
        tabela = self.env['markdown_tabela_gerar'](texto='nome;idade\nAna;30')
        self.assertIn('| nome | idade |', tabela)
        self.assertIn('| Ana  | 30    |', tabela)
        self.assertIn('|---', tabela)
        with self.assertRaises(ValueError):
            self.env['markdown_tabela_gerar'](texto='so cabecalho;sem corpo')


if __name__ == '__main__':
    unittest.main()
