"""r43: lote 6 (80 ferramentas: console/dev, casa BR, saude/sorteios,
seguranca/geo/ciencia, sistema/rede/midia) + modo instantaneo + cerebro
(estatisticas honestas, contexto de memorias). AST isolado; arquivos so em
pasta temporaria; sem rede, sem GGUF."""
import io
import os
import re
import struct
import tempfile
import unittest
import wave
from contextlib import redirect_stdout

from test_roteamento_conversa import carregar

NOMES = ('consultar_porta_conhecida', 'calcular_tempo_download',
         'tabela_ip_classes_referencia', 'tabela_json_console',
         'ascii_barras_grafico', 'histograma_frequencias_console',
         'progresso_barra_estatica', 'arvore_ascii_de_caminhos',
         'sparkline_numeros', 'destaque_diferencas_linhas',
         'padronizar_decimais_texto', 'extrair_chaves_valores_texto',
         'minutos_hhmm_converter', 'lista_compras_consolidar',
         'converter_medidas_culinarias', 'gramas_xicara_por_ingrediente',
         'dividir_conta_restaurante', 'cafeina_meia_vida',
         'tinta_parede_estimativa', 'combustivel_custo_viagem',
         'churrasco_calculadora', 'festa_doces_salgados',
         'pizza_tamanho_convidados', 'gelo_bebidas_estimativa',
         'limpeza_diluicao', 'arroz_panela_receita',
         'ponto_da_carne_referencia', 'cronograma_limpeza_gerar',
         'taxa_metabolica_basal_mifflin', 'gordura_navy_calcular',
         'fc_maxima_zones', 'proteina_diaria_sugestao',
         'macros_calculo_calorias', 'sortear_dado_rpg',
         'sortear_amigo_secreto', 'sortear_cor_hex_acessivel',
         'bingo_gerar_cartela', 'lotofacil_sugestao', 'megasena_sugestao',
         'cartas_mao_sortear', 'sortear_times_equilibrados',
         'exportar_inventario_ferramentas_txt', 'pin_numerico_gerar',
         'passphrase_palavras_gerar', 'checar_reuso_senha_local',
         'verificar_forca_frase_senha', 'gerar_totp_codigo',
         'distancia_coordenadas_haversine', 'rumo_entre_coordenadas',
         'fase_da_lua_aproximada', 'planetas_consulta',
         'coordenada_formato_converter', 'elementos_consulta',
         'decada_seculo_info', 'massa_molar_simples',
         'listar_fontes_instaladas', 'pastas_especiais_usuario',
         'ps_build_consulta', 'zona_horaria_detalhe',
         'codigos_erro_windows_consulta', 'atalhos_win_referencia',
         'where_comando_consulta', 'variaveis_ambiente_resumo',
         'politica_execucao_atual', 'duracao_audio_wav',
         'exif_resumo_imagem', 'dimensoes_imagem_resumo',
         'gerar_exercicios_matematica', 'ph_concentracao_calcular',
         'diluicao_c1v1c2v2_calcular', 'mac_vendor_prefix_consulta',
         'relacao_aspecto_calcular', 'ppi_monitor_calcular',
         'idade_cachorro_aproximada', 'conversao_tamanhos_referencia',
         'qualidade_internet_referencia', 'bytes_bits_esclarecer',
         'duracao_bateria_estimativa', 'bitrate_video_tamanho',
         'unidades_tipografia_referencia',
         '_norm_pt', '_r20_opcoes', '_r24_comandos', '_r43_comandos')

BLOCO_A = NOMES[0:14]
BLOCO_B = NOMES[14:28]
BLOCO_C = NOMES[28:41]
BLOCO_D = NOMES[41:54] + ('massa_molar_simples',)
BLOCO_E = NOMES[55:80]


def capturar(funcao, *args, **kwargs):
    tampao = io.StringIO()
    with redirect_stdout(tampao):
        r = funcao(*args, **kwargs)
    return r, tampao.getvalue()


class BlocoAConsoleDev(unittest.TestCase):
    def setUp(self):
        self.env = carregar(*BLOCO_A)

    def test_porta_conhecida_e_desconhecida(self):
        self.assertIn('HTTPS', self.env['consultar_porta_conhecida'](443))
        self.assertIn('Sem registro', self.env['consultar_porta_conhecida'](9999))
        with self.assertRaises(ValueError):
            self.env['consultar_porta_conhecida'](0)

    def test_tempo_download(self):
        saida = self.env['calcular_tempo_download'](2, 100)
        self.assertIn('2 min 44 s', saida)
        with self.assertRaises(ValueError):
            self.env['calcular_tempo_download'](0, 100)

    def test_tabela_ip_classes(self):
        saida = self.env['tabela_ip_classes_referencia']()
        self.assertIn('192.168', saida)
        self.assertIn('169.254', saida)

    def test_tabela_json_console(self):
        saida = self.env['tabela_json_console']('[{"nome":"Ana","idade":30}]')
        self.assertIn('Ana', saida)
        self.assertIn('idade', saida)
        with self.assertRaises(ValueError):
            self.env['tabela_json_console']('[]')

    def test_barras_hist_progresso_sparkline(self):
        self.assertIn('n 3', self.env['ascii_barras_grafico']('1,5,9'))
        self.assertIn('a', self.env['histograma_frequencias_console']('a,b,a'))
        self.assertIn('30%', self.env['progresso_barra_estatica'](30))
        self.assertIn('n 4', self.env['sparkline_numeros']([1, 2, 3, 9]))
        with self.assertRaises(ValueError):
            self.env['progresso_barra_estatica']('banana')

    def test_arvore_e_diferencas(self):
        saida = self.env['arvore_ascii_de_caminhos']('docs/relatorios/a.pdf\ndocs/leia.md')
        self.assertIn('`-- ', saida)
        saida2 = self.env['destaque_diferencas_linhas']('abcXdef', 'abcYdef')
        self.assertIn('^', saida2)
        self.assertIn('IGUAIS', self.env['destaque_diferencas_linhas']('aaa', 'aaa'))

    def test_padroniza_decimais(self):
        self.assertIn('1,234.56', self.env['padronizar_decimais_texto']('preco 1.234,56 fim', 'en'))
        self.assertIn('3,14', self.env['padronizar_decimais_texto']('pi 3.14 ok', 'pt'))

    def test_extrai_chaves_valores(self):
        saida = self.env['extrair_chaves_valores_texto']('nome: Joao\nidade = 30\nsolta')
        self.assertIn('"Joao"', saida)
        self.assertIn('1 linha', saida)
        with self.assertRaises(ValueError):
            self.env['extrair_chaves_valores_texto']('nada de separador aqui')

    def test_minutos_hhmm_dos_dois_lados(self):
        self.assertIn('01:30', self.env['minutos_hhmm_converter'](90))
        self.assertIn('150 minuto', self.env['minutos_hhmm_converter']('02:30'))
        with self.assertRaises(ValueError):
            self.env['minutos_hhmm_converter']('xx')

    def test_lista_compras(self):
        saida = self.env['lista_compras_consolidar']('arroz\n2 arroz\nleite')
        self.assertIn('3 arroz', saida)
        self.assertIn('2 item(ns) distinto', saida)
        with self.assertRaises(ValueError):
            self.env['lista_compras_consolidar']('')


class BlocoBCasaCotidiano(unittest.TestCase):
    def setUp(self):
        self.env = carregar(*BLOCO_B)

    def test_culinaria_e_gramas(self):
        self.assertIn('240', self.env['converter_medidas_culinarias'](1, 'xicara', 'ml'))
        self.assertIn('gas 4', self.env['converter_medidas_culinarias'](180, 'forno_c', 'gas'))
        self.assertIn('120', self.env['gramas_xicara_por_ingrediente']('farinha', 1))
        self.assertIn('Sem registro', self.env['gramas_xicara_por_ingrediente']('pedra brita'))

    def test_conta_cafe_tinta_viagem(self):
        self.assertIn('R$ 11.0', self.env['dividir_conta_restaurante'](100, 10, 10))
        self.assertIn('50', self.env['cafeina_meia_vida'](100, 5))
        self.assertIn('lata', self.env['tinta_parede_estimativa'](100, 2, 10, 18))
        self.assertIn('R$ 100', self.env['combustivel_custo_viagem'](400, 10, 2.5))
        with self.assertRaises(ValueError):
            self.env['dividir_conta_restaurante'](0, 3)

    def test_churrasco_festa_pizza_gelo(self):
        self.assertIn('carne (kg)', self.env['churrasco_calculadora'](10))
        self.assertIn('salgados', self.env['festa_doces_salgados'](30))
        self.assertIn('GRANDE', self.env['pizza_tamanho_convidados'](4, 3))
        self.assertIn('kg de gelo', self.env['gelo_bebidas_estimativa'](10, 4))

    def test_diluicao_arroz_carne_cronograma(self):
        self.assertIn('10 ml de PRODUTO', self.env['limpeza_diluicao'](1010, '1:100'))
        self.assertIn('400 g', self.env['arroz_panela_receita'](4))
        self.assertIn('74 C', self.env['ponto_da_carne_referencia']('frango'))
        self.assertIn('SEMANA-TIPO', self.env['cronograma_limpeza_gerar'](2))
        with self.assertRaises(ValueError):
            self.env['limpeza_diluicao'](100, 'boba')


class BlocoCSaudeSorteios(unittest.TestCase):
    def setUp(self):
        self.env = carregar(*BLOCO_C)

    def test_tmb_navy_fc_proteina_macros(self):
        self.assertIn('TMB', self.env['taxa_metabolica_basal_mifflin'](70, 170, 30, 'm'))
        self.assertIn('%', self.env['gordura_navy_calcular']('m', 175, 85, 38))
        with self.assertRaises(ValueError):
            self.env['gordura_navy_calcular']('f', 165, 80, 35)  # falta quadril
        self.assertIn('Karvonen', self.env['fc_maxima_zones'](30, 70))
        self.assertIn('g por dia', self.env['proteina_diaria_sugestao'](70, 'musculacao'))
        self.assertIn('proteina', self.env['macros_calculo_calorias'](2000, 30, 40, 30))
        with self.assertRaises(ValueError):
            self.env['macros_calculo_calorias'](2000, 50, 50, 50)

    def test_dados_rpg_com_descarte(self):
        saida = self.env['sortear_dado_rpg']('4d6', True, 42)
        self.assertIn('descarta o menor', saida)
        self.assertIn('= ', saida)
        with self.assertRaises(ValueError):
            self.env['sortear_dado_rpg']('banana')

    def test_amigo_secreto_sem_autopar(self):
        saida = self.env['sortear_amigo_secreto']('ana,bia,carlos,duda', 7)
        self.assertIn('ninguem tira a si mesmo', saida)
        with self.assertRaises(ValueError):
            self.env['sortear_amigo_secreto']('ana,bia')

    def test_cor_acessivel(self):
        saida = self.env['sortear_cor_hex_acessivel'](42)
        self.assertRegex(saida, r'Fundo sorteado: #[0-9a-f]{6}')
        self.assertIn('contraste', saida)

    def test_bingo_loterias_honestas(self):
        cartela = self.env['bingo_gerar_cartela'](1)
        self.assertIn('BINGO', cartela)
        self.assertIn('LIVRE', cartela)
        self.assertIn('3.268.760', self.env['lotofacil_sugestao'](42))
        self.assertIn('50.063.860', self.env['megasena_sugestao'](42))

    def test_cartas_e_times(self):
        self.assertIn('Mao:', self.env['cartas_mao_sortear'](42))
        saida = self.env['sortear_times_equilibrados']('a,b,c,d,e', 3)
        self.assertIn('Time A', saida)
        self.assertIn('Time B', saida)
        self.assertIn('nao avalia habilidade', saida)


class BlocoDSegurancaGeoCiencia(unittest.TestCase):
    def setUp(self):
        self.env = carregar(*BLOCO_D)

    def test_exporta_inventario_txt_sem_segredos(self):
        pasta = tempfile.mkdtemp()
        destino = os.path.join(pasta, 'inv.txt')
        saida = self.env['exportar_inventario_ferramentas_txt']('agente.py', destino)
        self.assertIn('gravado em', saida)
        total = int(re.search(r'\((\d+) ferramentas', saida).group(1))
        self.assertGreaterEqual(total, 699)
        conteudo = io.open(destino, encoding='utf-8').read()
        self.assertIn('INVENTARIO DE FERRAMENTAS', conteudo)
        self.assertNotIn('def ', conteudo)  # so nomes e descricoes

    def test_pin_passphrase_com_entropia(self):
        self.assertRegex(self.env['pin_numerico_gerar'](6, 1), r'^PIN: \d{6}')
        frase = self.env['passphrase_palavras_gerar'](5, 9)
        self.assertEqual(frase.count('-'), 4)
        self.assertIn('bits', frase)
        with self.assertRaises(ValueError):
            self.env['pin_numerico_gerar'](12)

    def test_reuso_nao_ecoa_senhas(self):
        saida = self.env['checar_reuso_senha_local']('SenhaNova1', 'velha\nSenhaNova1')
        self.assertIn('IGUAL', saida)
        self.assertNotIn('velha', saida)
        self.assertNotIn('SenhaNova1', saida)
        com_lista = self.env['checar_reuso_senha_local']('abacate1', 'velha\noutra')
        self.assertIn('sem igual', com_lista)

    def test_forca_senha_sem_eco(self):
        saida = self.env['verificar_forca_frase_senha']('correto cavalo bateria grampo 42!')
        self.assertIn('bits', saida)
        self.assertIn('NAO foi exibida', saida)
        critica = self.env['verificar_forca_frase_senha']('123456')
        self.assertIn('CRITICA', critica)

    def test_totp_vetor_oficial_rfc(self):
        saida = self.env['gerar_totp_codigo']('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59, 8)
        self.assertIn('94287082', saida)
        with self.assertRaises(ValueError):
            self.env['gerar_totp_codigo']('!!!')

    def test_haversine_e_rumo(self):
        saida = self.env['distancia_coordenadas_haversine'](-23.55, -46.63, -22.91, -43.17)
        km = float(re.search(r'~([0-9.]+) km', saida).group(1))
        self.assertTrue(330 < km < 380, saida)
        rumo = self.env['rumo_entre_coordenadas'](-23.55, -46.63, -22.91, -43.17)
        self.assertIn('leste', rumo)
        self.assertIn('Rumo INICIAL', rumo)

    def test_lua_planetas_elementos_decada(self):
        self.assertIn('dias no ciclo', self.env['fase_da_lua_aproximada'](2026, 9, 11))
        self.assertIn('UA', self.env['planetas_consulta']('marte'))
        self.assertIn('8 PLANETAS', self.env['planetas_consulta']())
        self.assertIn('Ouro', self.env['elementos_consulta']('79'))
        self.assertIn('Ouro', self.env['elementos_consulta']('au'))
        self.assertIn('118 elementos', self.env['elementos_consulta']())
        decada = self.env['decada_seculo_info'](1929)
        self.assertIn('seculo XX', decada)
        self.assertIn('decada de 20', decada)

    def test_coordenada_gms_vai_e_volta(self):
        gms = self.env['coordenada_formato_converter'](-23.55, 'lat')
        self.assertIn('23 graus 33 min', gms)
        self.assertIn('S', gms)
        volta = self.env['coordenada_formato_converter']('23 graus 33 min 0 seg S', 'lat')
        self.assertIn('-23.55', volta)
        with self.assertRaises(ValueError):
            self.env['coordenada_formato_converter']('', 'lat')

    def test_massa_molar(self):
        self.assertIn('18.02', self.env['massa_molar_simples']('H2O'))
        self.assertIn('nao sao suportados', self.env['massa_molar_simples']('Ca(OH)2'))
        self.assertIn('nao reconhecida', self.env['massa_molar_simples']('h2O'))


class BlocoESistemaRedeMidia(unittest.TestCase):
    def setUp(self):
        self.env = carregar(*BLOCO_E)

    def test_fontes_pastas_honestos(self):
        self.assertIn('fonte', self.env['listar_fontes_instaladas']().lower())
        self.assertIn('PASTAS ESPECIAIS', self.env['pastas_especiais_usuario']())

    def test_windows_somente_leitura(self):
        self.assertIn('Windows', self.env['ps_build_consulta']())
        self.assertIn('Windows', self.env['politica_execucao_atual']())

    def test_fuso_erro_atalhos(self):
        self.assertIn('America/Sao_Paulo', self.env['zona_horaria_detalhe']('America/Sao_Paulo'))
        self.assertIn('Acesso negado', self.env['codigos_erro_windows_consulta']('0x80070005'))
        self.assertIn('boot', self.env['codigos_erro_windows_consulta']('boot'))
        self.assertIn('Win + D', self.env['atalhos_win_referencia']())
        self.assertIn('emoji', self.env['atalhos_win_referencia']('emoji'))

    def test_where_ambiente(self):
        self.assertIn('NAO foi encontrado',
                      self.env['where_comando_consulta']('comando_inexistente_xyz_123'))
        self.assertIn('variaveis no total', self.env['variaveis_ambiente_resumo']('todas'))
        self.assertIn('Grupos disponiveis', self.env['variaveis_ambiente_resumo']('nada'))

    def test_wav_e_imagem_em_tempdir(self):
        fd, wavp = tempfile.mkstemp(suffix='.wav')
        os.close(fd)
        w = wave.open(wavp, 'wb')
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(8000)
        w.writeframes(b'\x00\x00' * 8000)
        w.close()
        self.assertIn('1.0 s', self.env['duracao_audio_wav'](wavp))
        png = os.path.join(tempfile.mkdtemp(), 'f.png')
        cab = (b'\x89PNG\r\n\x1a\n' + b'\x00\x00\x00\rIHDR'
               + struct.pack('>II', 320, 240) + b'\x08\x02\x00\x00\x00' + b'\x00' * 8)
        io.open(png, 'wb').write(cab + b'x' * 40)
        saida = self.env['dimensoes_imagem_resumo'](png)
        self.assertIn('320x240 px', saida)
        self.assertIn('formato PNG', saida)
        self.assertIn('pillow', self.env['exif_resumo_imagem'](png).lower())
        with self.assertRaises(ValueError):
            self.env['duracao_audio_wav']('nao_existe.wav')

    def test_exercicios_deterministicos(self):
        a = self.env['gerar_exercicios_matematica']('multiplicacao', 5, 'facil', 42)
        b = self.env['gerar_exercicios_matematica']('multiplicacao', 5, 'facil', 42)
        self.assertEqual(a, b)
        self.assertIn('GABARITO', a)
        divisao = self.env['gerar_exercicios_matematica']('divisao', 3, 'medio', 7)
        self.assertIn('/ ', divisao)
        with self.assertRaises(ValueError):
            self.env['gerar_exercicios_matematica']('raiz')

    def test_ph_diluicao_quimica(self):
        self.assertIn('mol/L', self.env['ph_concentracao_calcular'](7, 'ph'))
        self.assertIn('pH = ', self.env['ph_concentracao_calcular'](0.001, 'concentracao'))
        self.assertIn('V1 = 0.5', self.env['diluicao_c1v1c2v2_calcular'](100, None, 10, 5))
        with self.assertRaises(ValueError):
            self.env['diluicao_c1v1c2v2_calcular'](None, None, 10, 5)

    def test_mac_aspecto_ppi(self):
        self.assertIn('Raspberry Pi', self.env['mac_vendor_prefix_consulta']('B8:27:EB:AA:BB:CC'))
        self.assertIn('nao esta na', self.env['mac_vendor_prefix_consulta']('AA:BB:CC:11:22:33'))
        self.assertIn('16:9', self.env['relacao_aspecto_calcular'](1920, 1080))
        self.assertIn('PPI', self.env['ppi_monitor_calcular'](1920, 1080, 24))

    def test_cao_tamanhos_internet(self):
        self.assertIn('anos humanos', self.env['idade_cachorro_aproximada'](3, 'medio'))
        self.assertIn('42-44', self.env['conversao_tamanhos_referencia']('roupa', 'G'))
        self.assertIn('EU', self.env['conversao_tamanhos_referencia']('calcado', '40'))
        self.assertIn('4K', self.env['qualidade_internet_referencia'](100))

    def test_bytes_bateria_bitrate_tipografia(self):
        saida = self.env['bytes_bits_esclarecer'](100, 'MB')
        self.assertIn('800 Mb', saida)
        self.assertIn('12.5 MB/s', saida)
        self.assertIn('TEORICAS', self.env['duracao_bateria_estimativa'](50, 10))
        bitrate = self.env['bitrate_video_tamanho'](8, 60)
        self.assertTrue('3.6 GB' in bitrate or '3,6' in bitrate or '3600' in bitrate, bitrate)
        self.assertIn('rem', self.env['unidades_tipografia_referencia'](16))
        with self.assertRaises(ValueError):
            self.env['duracao_bateria_estimativa'](0, 10)


class CerebroInstantaneo(unittest.TestCase):
    def test_toggle_instantaneo_salva_config(self):
        salvos = []
        env = carregar('_norm_pt', '_r43_comandos', '_r20_opcoes',
                       config={}, ARQ_CONFIG='cfg.json',
                       salvar_json=lambda c, d: salvos.append(dict(d)))
        retorno, saida = capturar(env['_r43_comandos'], 'instantaneo ia local')
        self.assertTrue(retorno)
        self.assertIn('INSTANTANEO LIGADO', saida)
        self.assertTrue(salvos[-1]['ia_local_opcoes']['instantaneo'])
        retorno2, saida2 = capturar(env['_r43_comandos'], 'instantaneo ia local')
        self.assertTrue(retorno2)
        self.assertIn('DESLIGADO', saida2)
        self.assertFalse(salvos[-1]['ia_local_opcoes']['instantaneo'])
        retorno3, _ = capturar(env['_r43_comandos'], 'status')
        self.assertFalse(retorno3)

    def test_opcoes_inclui_instantaneo(self):
        env = carregar('_norm_pt', '_r20_opcoes')
        self.assertIn('instantaneo', env['_r20_opcoes']())
        self.assertIn('turbo', env['_r20_opcoes']())

    def test_estatisticas_cerebro_honesto(self):
        env = carregar('_norm_pt', '_r43_comandos', '_r20_opcoes')
        env['_r43_neural'] = 7
        env['_r43_cache'] = 2
        env['_r25_uso_ferramentas'] = {'mmc_mdc_calcular': {'usos': 3, 'erros': 1}}
        env['_r24_tempos'] = [1.0, 2.0]
        _, saida = capturar(env['_r43_comandos'], 'estatisticas cerebro')
        self.assertIn('CEREBRO', saida)
        self.assertIn('geracoes neurais: 7', saida)
        self.assertIn('cache: 2', saida)
        self.assertIn('3 uso(s)', saida)
        self.assertIn('1 erro(s)', saida)
        self.assertIn('1.5 s', saida)
        self.assertIn('o GGUF e o mesmo de sempre', saida)

    def _neural_com_teto(self, opcoes, formato_json=False):
        capturado = {}

        def fake_transporte(msgs, max_tokens, temperatura, timeout_segundos, stream,
                            callback, seed, repeat_penalty, formato_json_, id_geracao):
            capturado['max_tokens'] = max_tokens
            return 'ok', {}

        env = carregar('_chamar_neural', '_norm_pt', '_r20_opcoes', '_r20_transporte',
                       '_r20_estado', '_r20_lock',
                       config={'ia_local_opcoes': dict(opcoes)})
        env['_r20_transporte'] = fake_transporte
        env['_chamar_neural']([{'role': 'user', 'content': 'oi'}], max_tokens=350,
                              formato_json=formato_json)
        return capturado['max_tokens']

    def test_teto_instantaneo_180(self):
        self.assertEqual(self._neural_com_teto({'instantaneo': True}), 180)

    def test_teto_turbo_300_quando_sem_instantaneo(self):
        self.assertEqual(self._neural_com_teto({'turbo': True}), 300)

    def test_sem_teto_por_padrao(self):
        self.assertEqual(self._neural_com_teto({}), 350)

    def test_json_fica_intocado_mesmo_com_instantaneo(self):
        self.assertEqual(self._neural_com_teto({'instantaneo': True, 'turbo': True},
                                               formato_json=True), 350)

    def _perguntar(self, memorias):
        capturado = {}

        def fake_neural(msgs, max_tokens=350, **_kw):
            capturado['msgs'] = msgs
            return 'resposta fake'

        env = carregar('perguntar_ia_local', '_norm_pt', '_r20_opcoes',
                       _montar_contexto_local=lambda p, h: [{'role': 'system', 'content': 'base'}],
                       _quantidade_lista_local=lambda p: 0,
                       _perfil_resposta_local=lambda p, c: (350, ''),
                       buscar_memorias_relevantes=lambda p, l=3: memorias,
                       _chamar_neural=fake_neural,
                       config={})
        env['perguntar_ia_local']('curiosidade qualquer')
        return capturado['msgs']

    def test_contexto_recebe_memorias_relevantes(self):
        msgs = self._perguntar([{'texto': 'prefiro cafe sem acucar'}])
        self.assertIn('Contexto local relevante', msgs[0]['content'])
        self.assertIn('cafe sem acucar', msgs[0]['content'])

    def test_contexto_sem_memorias_fica_limpo(self):
        msgs = self._perguntar([])
        self.assertNotIn('Contexto local relevante', msgs[0]['content'])

    def test_contador_de_cache(self):
        chamadas = []

        def fake_neural(msgs, max_tokens=350, **_kw):
            chamadas.append(max_tokens)
            return 'gerado'

        env = carregar('perguntar_ia_local', '_norm_pt', '_r20_opcoes',
                       _montar_contexto_local=lambda p, h: [{'role': 'system', 'content': 'b'}],
                       _quantidade_lista_local=lambda p: 0,
                       _perfil_resposta_local=lambda p, c: (350, ''),
                       buscar_memorias_relevantes=lambda p, l=3: [],
                       _chamar_neural=fake_neural,
                       config={})
        env['perguntar_ia_local']('quantos anos tem o universo')
        self.assertNotIn('_r43_cache', env)  # primeira passagem: sem cache
        saida = env['perguntar_ia_local']('quantos anos tem o universo')
        self.assertTrue(saida.startswith('[Cache local]'))
        self.assertEqual(env['_r43_cache'], 1)
        self.assertEqual(len(chamadas), 1)  # segunda respondeu do cache


class GuardasR43(unittest.TestCase):
    def test_selo_r67_no_banner(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        self.assertIn('2026-09-11-r67', texto)
        self.assertNotIn('2026-09-11-r44]', texto)

    def test_escada_de_teto_existe_no_fonte(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        self.assertIn('min(max_tokens, 180)', texto)
        self.assertIn('min(max_tokens, 300)', texto)
        self.assertIn("startswith('instantaneoialocal')", texto)
        self.assertIn("startswith('estatisticascerebro')", texto)

    def test_80_novas_estao_registradas(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        esperados = ['consultar_porta_conhecida', 'gerar_totp_codigo',
                     'bingo_gerar_cartela', 'massa_molar_simples',
                     'unidades_tipografia_referencia']
        for nome in esperados:
            self.assertIn('    ' + nome + ',\n', texto)


if __name__ == '__main__':
    unittest.main()
