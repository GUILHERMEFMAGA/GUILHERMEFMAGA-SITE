"""r42: lote 5 (datas, documentos BR, arquivos) + turbo ia local. AST
isolado; arquivos so em pasta temporaria; sem rede, sem GGUF."""
import json
import os
import tempfile
import unittest
from test_roteamento_conversa import carregar

NOMES = ('proximo_dia_util', 'contagem_regressiva_data', 'fusos_brasil_referencia',
         'proximo_feriado', 'texto_para_data_parse', 'dias_uteis_do_mes',
         'consultar_ddd_estatico', 'validar_placa_veiculo', 'validar_pis_pasep',
         'validar_titulo_eleitor', 'validar_cartao_luhn_aviso',
         'mascaras_documentos_br_extras', 'uf_info_estatica',
         'cnpj_padrao_filial_info', 'cnh_categoria_referencia',
         'moedas_iso_referencia', 'alfabeto_grego_referencia', 'capitais_brasil_lista',
         'contar_linhas_arquivo', 'detectar_tipo_magic_bytes',
         'sugerir_nome_seguro_windows', 'somar_tamanho_por_padrao',
         'arquivos_por_faixa_tamanho', 'linhas_mais_longas_arquivo',
         'palavras_frequentes_arquivo', 'linhas_aleatorias_amostra',
         'cabecalho_e_cauda_arquivo', 'encoding_bom_detectar',
         'lista_para_csv_console', 'sugerir_renomeacao_lote',
         '_texto_para_data_ou_hoje', '_feriados_fixos', '_domingo_pascoa',
         '_norm_pt', '_r20_opcoes', '_r24_comandos', '_r20_transporte',
         '_r20_estado', '_r20_lock', '_chamar_neural')


def env_l5():
    return carregar(*NOMES)


class Datas(unittest.TestCase):
    def setUp(self):
        self.env = env_l5()

    def test_proximo_dia_util_pula_fim_de_semana(self):
        saida = self.env['proximo_dia_util']('20/09/2026')  # domingo
        self.assertIn('21/09/2026', saida)
        self.assertIn('segunda', saida)
        with self.assertRaises(ValueError):
            self.env['proximo_dia_util']('data boba')

    def test_contagem_regressiva(self):
        saida = self.env['contagem_regressiva_data']('01/01/2099')
        self.assertIn('dia(s)', saida)
        with self.assertRaises(ValueError):
            self.env['contagem_regressiva_data']('31/02/2026')

    def test_fusos_estatico(self):
        saida = self.env['fusos_brasil_referencia']()
        self.assertIn('UTC-3', saida)
        self.assertIn('horario de verao', saida)

    def test_proximo_feriado_usa_pascoa(self):
        saida = self.env['proximo_feriado']('02/01/2027')
        self.assertIn('Carnaval', saida)  # 2027: carnaval em fevereiro
        with self.assertRaises(ValueError):
            self.env['proximo_feriado']('31/02/2026')

    def test_parse_flexivel(self):
        self.assertEqual(self.env['texto_para_data_parse']('25-12-26'), '2026-12-25')
        self.assertEqual(self.env['texto_para_data_parse']('2026-12-25'), '2026-12-25')
        with self.assertRaises(ValueError):
            self.env['texto_para_data_parse']('holiday')

    def test_dias_uteis_do_mes(self):
        saida = self.env['dias_uteis_do_mes']('2', '2026')
        self.assertIn('20 dias uteis', saida)
        self.assertIn('28 dias totais', saida)
        with self.assertRaises(ValueError):
            self.env['dias_uteis_do_mes']('13')


class DocumentosBR(unittest.TestCase):
    def setUp(self):
        self.env = env_l5()

    def test_ddd(self):
        self.assertIn('Ribeirao Preto', self.env['consultar_ddd_estatico']('16'))
        with self.assertRaises(ValueError):
            self.env['consultar_ddd_estatico']('00')

    def test_placa(self):
        self.assertIn('ANTIGA', self.env['validar_placa_veiculo']('abc-1234'))
        self.assertIn('MERCOSUL', self.env['validar_placa_veiculo']('ABC1D23'))
        with self.assertRaises(ValueError):
            self.env['validar_placa_veiculo']('AB12345')

    def test_pis(self):
        base = '1204890267'
        pesos = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        soma = sum(int(a) * b for a, b in zip(base, pesos))
        resto = soma % 11
        dv = 0 if resto < 2 else 11 - resto
        valido = base[:3] + '.' + base[3:8] + '.' + base[8:10] + '-' + str(dv)
        self.assertIn('VALIDO', self.env['validar_pis_pasep'](valido))
        with self.assertRaises(ValueError):
            self.env['validar_pis_pasep'](valido[:-1] + str((dv + 1) % 10))

    def test_titulo(self):
        # titulo com digitos validos: 1234 5678 90 10 (dv calculado = 01/01?)
        with self.assertRaises(ValueError):
            self.env['validar_titulo_eleitor']('123456789011')

    def test_luhn(self):
        saida = self.env['validar_cartao_luhn_aviso']('4539 1488 0343 6467')
        self.assertIn('VALIDO', saida)
        self.assertIn('Visa', saida)
        self.assertIn('PRIVACIDADE', saida)
        with self.assertRaises(ValueError):
            self.env['validar_cartao_luhn_aviso']('4539 1488 0343 6468')

    def test_mascaras(self):
        self.assertIn('12345-678', self.env['mascaras_documentos_br_extras']('12345678'))
        self.assertIn('123.45678.90-1', self.env['mascaras_documentos_br_extras']('12345678901'))
        with self.assertRaises(ValueError):
            self.env['mascaras_documentos_br_extras']('123')

    def test_uf_e_capitais(self):
        self.assertIn('Curitiba', self.env['uf_info_estatica']('pr'))
        with self.assertRaises(ValueError):
            self.env['uf_info_estatica']('XX')
        filtro = self.env['capitais_brasil_lista']('Sul')
        self.assertIn('Curitiba', filtro)
        self.assertNotIn('Sao Paulo -', filtro)

    def test_cnpj_filial_e_cnh(self):
        self.assertIn('MATRIZ', self.env['cnpj_padrao_filial_info']('11.222.333/0001-81'))
        self.assertIn('FILIAL', self.env['cnpj_padrao_filial_info']('11222333000281'))
        with self.assertRaises(ValueError):
            self.env['cnpj_padrao_filial_info']('11222333')
        self.assertIn('2 rodas', self.env['cnh_categoria_referencia']('a'))
        with self.assertRaises(ValueError):
            self.env['cnh_categoria_referencia']('F')

    def test_moedas_e_grego(self):
        self.assertIn('Real brasileiro', self.env['moedas_iso_referencia']('BRL'))
        self.assertIn('NAO tem cotacao', self.env['moedas_iso_referencia']())
        with self.assertRaises(ValueError):
            self.env['moedas_iso_referencia']('XXX')
        self.assertIn('Omega', self.env['alfabeto_grego_referencia']())


class Arquivos(unittest.TestCase):
    def setUp(self):
        self.pasta = tempfile.mkdtemp()
        self.arq = os.path.join(self.pasta, 'exemplo.txt')
        with open(self.arq, 'w', encoding='utf-8') as f:
            f.write('linha um com palavras\nsegunda linha\n' + 'x' * 200 + '\nfim\n')
        self.png = os.path.join(self.pasta, 'foto.png')
        with open(self.png, 'wb') as f:
            f.write(b'\x89PNG\r\n\x1a\n' + b'\x00' * 20)
        self.env = env_l5()

    def test_contar_linhas(self):
        saida = self.env['contar_linhas_arquivo'](self.arq)
        self.assertIn('4 linha(s)', saida)
        with self.assertRaises(ValueError):
            self.env['contar_linhas_arquivo'](os.path.join(self.pasta, 'nada.txt'))

    def test_magic_bytes(self):
        self.assertIn('PNG', self.env['detectar_tipo_magic_bytes'](self.png))
        self.assertIn('TEXTO', self.env['detectar_tipo_magic_bytes'](self.arq))

    def test_nome_seguro(self):
        saida = self.env['sugerir_nome_seguro_windows']('relatorio: final?')
        self.assertIn('relatorio_ final_', saida)
        con = self.env['sugerir_nome_seguro_windows']('CON')
        self.assertIn('_CON', con)
        with self.assertRaises(ValueError):
            self.env['sugerir_nome_seguro_windows']('   ')

    def test_tamanhos(self):
        padrao = os.path.join(self.pasta, '*.txt')
        saida = self.env['somar_tamanho_por_padrao'](padrao)
        self.assertIn('1 arquivo(s)', saida)
        faixas = self.env['arquivos_por_faixa_tamanho'](padrao)
        self.assertIn('menos de 1 MB', faixas)
        with self.assertRaises(ValueError):
            self.env['somar_tamanho_por_padrao'](os.path.join(self.pasta, '*.zzz'))

    def test_linhas_longas_e_palavras(self):
        saida = self.env['linhas_mais_longas_arquivo'](self.arq, quantidade='2')
        self.assertIn('200 car.', saida)
        palavras = self.env['palavras_frequentes_arquivo'](self.arq)
        self.assertIn('linha', palavras)
        with self.assertRaises(ValueError):
            self.env['linhas_mais_longas_arquivo'](self.arq, quantidade='99')

    def test_amostra_e_pontas(self):
        amostra = self.env['linhas_aleatorias_amostra'](self.arq, quantidade='2')
        self.assertIn('2 linha(s) aleatoria(s) de 4', amostra)
        pontas = self.env['cabecalho_e_cauda_arquivo'](self.arq, quantidade='2')
        self.assertIn('INICIO', pontas)
        self.assertIn('FIM', pontas)
        with self.assertRaises(ValueError):
            self.env['linhas_aleatorias_amostra'](self.arq, quantidade='101')

    def test_encoding_e_renomeacao(self):
        self.assertIn('UTF-8', self.env['encoding_bom_detectar'](self.arq))
        sugestao = self.env['sugerir_renomeacao_lote'](os.path.join(self.pasta, '*.txt'),
                                                       prefixo='doc')
        self.assertIn('doc_01.txt', sugestao)
        self.assertIn('NAO executei', sugestao)
        with self.assertRaises(ValueError):
            self.env['sugerir_renomeacao_lote'](os.path.join(self.pasta, '*.zzz'))


class TurboEVarios(unittest.TestCase):
    def test_csv_console(self):
        env = env_l5()
        saida = env['lista_para_csv_console']('nome\tidade\nAna\t30')
        self.assertIn('nome;idade', saida)
        self.assertIn('Ana;30', saida)
        saida2 = env['lista_para_csv_console']('a  b\nc  d')
        self.assertIn('a;b', saida2)
        with self.assertRaises(ValueError):
            env['lista_para_csv_console']('  ')

    def test_turbo_liga_e_desliga(self):
        salvos = []

        def capturar(funcao, *args):
            import io
            import contextlib
            tampao = io.StringIO()
            with contextlib.redirect_stdout(tampao):
                r = funcao(*args)
            return r, tampao.getvalue()

        env = carregar('_norm_pt', '_r24_comandos', '_r20_opcoes',
                       config={}, ARQ_CONFIG='cfg.json',
                       salvar_json=lambda c, d: salvos.append(dict(d)))
        retorno, saida = capturar(env['_r24_comandos'], 'turbo ia local')
        self.assertTrue(retorno)
        self.assertIn('TURBO LIGADO', saida)
        self.assertTrue(salvos[-1]['ia_local_opcoes']['turbo'])
        retorno2, saida2 = capturar(env['_r24_comandos'], 'turbo ia local')
        self.assertTrue(retorno2)
        self.assertIn('DESLIGADO', saida2)
        self.assertFalse(salvos[-1]['ia_local_opcoes']['turbo'])

    def test_opcoes_inclui_turbo(self):
        env = env_l5()
        self.assertIn('turbo', env['_r20_opcoes']())


if __name__ == '__main__':
    unittest.main()
