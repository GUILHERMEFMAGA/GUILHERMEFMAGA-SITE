"""r23: lotes 2-3 (matematica/fisica/datas/numeros/financas) + capacidades internas.
AST isolado; sem rede, sem GGUF, sem Windows."""
import types
import unittest
from test_roteamento_conversa import carregar


def fake_tool(nome, descricao=''):
    return types.SimpleNamespace(name=nome, description=descricao)


class MatematicaR23(unittest.TestCase):
    def setUp(self):
        self.env = carregar('_r22_num', 'listar_primos_intervalo', 'regressao_linear_simples',
                            'correlacao_pearson_calcular', 'progressao_pa_pg_calcular',
                            'calcular_trigonometria_basica', 'converter_angulos_graus_radianos',
                            'logaritmo_exponencial_calcular', 'operacoes_bitwise_explicadas',
                            'media_ponderada_calcular', 'simplificar_fracao',
                            'geometria_espacial_calcular', 'tabela_verdade_logica')

    def test_primos(self):
        r = self.env['listar_primos_intervalo'](30)
        self.assertIn('10 numero(s)', r)
        self.assertIn('29', r)
        with self.assertRaises(ValueError):
            self.env['listar_primos_intervalo'](5000000)

    def test_regressao(self):
        r = self.env['regressao_linear_simples']('1,2,3,4', '2,4,5,8')
        self.assertIn('1.9*x + 0', r)
        self.assertIn('r-quadrado = 0.9627', r)

    def test_correlacao(self):
        self.assertIn('negativa', self.env['correlacao_pearson_calcular']('1,2,3', '3,2,1'))
        self.assertIn('positiva', self.env['correlacao_pearson_calcular']('1,2,3', '2,4,6'))

    def test_pa_pg(self):
        r = self.env['progressao_pa_pg_calcular']('pa', 2, 3, 5)
        self.assertIn('a(5) = 14', r)
        self.assertIn('S(5) = 40', r)
        self.assertIn('a(4) = 54', self.env['progressao_pa_pg_calcular']('pg', 2, 3, 4))

    def test_trig_graus_log(self):
        self.assertIn('sen = 0.500000', self.env['calcular_trigonometria_basica'](30))
        self.assertIn('3.14159', self.env['converter_angulos_graus_radianos'](180))
        self.assertIn('= 3', self.env['logaritmo_exponencial_calcular'](2, 8))

    def test_bitwise_media_fracao(self):
        r = self.env['operacoes_bitwise_explicadas'](12, 10)
        self.assertIn('XOR = 6', r)
        self.assertIn('AND = 8', r)
        self.assertIn('9.3333', self.env['media_ponderada_calcular']('8,9,10', '1,2,3'))
        self.assertIn('2/3', self.env['simplificar_fracao'](84, 126))
        with self.assertRaises(ValueError):
            self.env['simplificar_fracao'](1, 0)

    def test_solidos_e_tabela(self):
        self.assertIn('113.097', self.env['geometria_espacial_calcular']('esfera', raio=3))
        r = self.env['tabela_verdade_logica']('xor')
        self.assertIn('0 0 |    0', r)
        self.assertIn('1 1 |    0', r)
        with self.assertRaises(ValueError):
            self.env['geometria_espacial_calcular']('piramide')


class FisicaR23(unittest.TestCase):
    def setUp(self):
        self.env = carregar('_r22_num', 'queda_livre_calcular', 'mru_mruv_calcular',
                            'forca_newton_calcular', 'trabalho_potencia_calcular',
                            'calor_sensivel_calcular', 'dilatacao_termica_calcular',
                            'pressao_hidrostatica_calcular', 'empuxo_calcular',
                            'onda_periodo_frequencia_calcular', 'capacitor_rc_calcular',
                            'divisor_de_tensao_calcular', 'consumo_energia_kwh_calcular',
                            'rendimento_maquina_calcular', 'momento_torque_calcular',
                            'lei_coulomb_calcular', 'pressao_forca_area_calcular',
                            'energia_elastica_calcular')

    def test_cinematica(self):
        r = self.env['queda_livre_calcular'](20)
        self.assertIn('2.019', r)
        self.assertIn('19.809', r)
        r2 = self.env['mru_mruv_calcular']('mruv', 0, 2, 1, 3)
        self.assertIn('s = 10.5', r2)
        self.assertIn('vf = 5', r2)
        self.assertIn('30 N', self.env['forca_newton_calcular'](10, 3))

    def test_trabalho_calor_dilatacao(self):
        self.assertIn('50 J', self.env['trabalho_potencia_calcular']('trabalho', 10, 5))
        self.assertIn('5 W', self.env['trabalho_potencia_calcular']('potencia', 50, tempo_s=10))
        self.assertIn('83.6 kJ', self.env['calor_sensivel_calcular'](2, 4.18, 10))
        r = self.env['dilatacao_termica_calcular'](100, 0.000012, 50)
        self.assertIn('0.06 m', r)
        self.assertIn('100.06', r)

    def test_fluidos_ondas_eletricidade(self):
        self.assertIn('98100 Pa', self.env['pressao_hidrostatica_calcular'](1000, 10))
        self.assertIn('4905', self.env['empuxo_calcular'](1000, 0.5))
        r = self.env['onda_periodo_frequencia_calcular'](340, 1.7)
        self.assertIn('200 Hz', r)
        self.assertIn('0.005', r)
        self.assertIn('tau = R*C = 1', self.env['capacitor_rc_calcular'](1000, 0.001))
        self.assertIn('8 V', self.env['divisor_de_tensao_calcular'](12, 1000, 2000))

    def test_consumo_rendimento_outros(self):
        r = self.env['consumo_energia_kwh_calcular'](100, 5, 0.95)
        self.assertIn('0.5 kWh/dia', r)
        self.assertIn('15 kWh/mes', r)
        self.assertIn('R$ 14.25', r)
        self.assertIn('80%', self.env['rendimento_maquina_calcular'](100, 80))
        with self.assertRaises(ValueError):
            self.env['rendimento_maquina_calcular'](100, 120)
        self.assertIn('6 N*m', self.env['momento_torque_calcular'](20, 0.3))
        self.assertIn('1.798 N', self.env['lei_coulomb_calcular'](1e-6, 2e-6, 0.1))
        self.assertIn('1000 Pa', self.env['pressao_forca_area_calcular'](500, 0.5))
        r2 = self.env['energia_elastica_calcular'](200, 0.1)
        self.assertIn('= 1 J', r2)
        self.assertIn('20 N', r2)


class NumerosDatasFinancas(unittest.TestCase):
    def setUp(self):
        self.env = carregar('_r22_num', 'numero_brl_formatar', 'porcentagem_variacao_calcular',
                            'algarismos_significativos_arredondar', 'notacao_cientifica_converter',
                            'fracoes_decimais_converter', 'horario_decimal_converter',
                            'converter_taxa_periodo_calcular', 'meta_poupanca_calcular',
                            'preco_por_unidade_comparar', 'semana_do_ano_info',
                            'bissexto_dias_mes_info', 'calendario_mes_console',
                            'soma_dias_uteis', 'datas_recorrentes_lista',
                            'timestamp_converter_iso', 'data_juliana_converter')

    def test_numeros(self):
        self.assertIn('R$ 1.234,50', self.env['numero_brl_formatar'](1234.5))
        self.assertIn('aumento de 25%', self.env['porcentagem_variacao_calcular'](80, 100))
        self.assertIn('= 123', self.env['algarismos_significativos_arredondar'](123.456, 3))
        self.assertIn('= 0.0012', self.env['algarismos_significativos_arredondar'](0.001234, 2))
        self.assertIn('1.2345 x 10^4', self.env['notacao_cientifica_converter'](12345))
        self.assertIn('3/8', self.env['fracoes_decimais_converter']('0.375'))
        self.assertIn('0.375000', self.env['fracoes_decimais_converter']('3/8'))
        self.assertIn('08:45', self.env['horario_decimal_converter']('8.75'))
        self.assertIn('8.75 horas', self.env['horario_decimal_converter']('08:45'))

    def test_financas(self):
        self.assertIn('12.68%', self.env['converter_taxa_periodo_calcular'](1, 'mensal', 'anual'))
        self.assertIn('788,49', self.env['meta_poupanca_calcular'](10000, 1, 12))
        self.assertIn('produto 2', self.env['preco_por_unidade_comparar'](10, 500, 15, 900))

    def test_datas(self):
        self.assertIn('semana ISO 37', self.env['semana_do_ano_info'](10, 9, 2026))
        self.assertIn('29 dias', self.env['bissexto_dias_mes_info'](2024, 2))
        self.assertIn('NAO bissexto', self.env['bissexto_dias_mes_info'](1900, 2))
        self.assertIn('Setembro 2026', self.env['calendario_mes_console'](9, 2026))
        self.assertIn('17/09/2026', self.env['soma_dias_uteis']('10/09/2026', 5))
        self.assertIn('05/10/2026', self.env['datas_recorrentes_lista'](5, 3, '20/09/2026'))
        self.assertIn('01/01/1970 00:00:00 (UTC)', self.env['timestamp_converter_iso']('0'))
        self.assertIn('= 0', self.env['timestamp_converter_iso']('1970-01-01 00:00:00', 'iso_para_epoch'))
        self.assertIn('JDN 2451545', self.env['data_juliana_converter'](1, 1, 2000))


class CapacidadesInternas(unittest.TestCase):
    def test_resumo_por_tema_com_inventario_falso(self):
        env = carregar('_garantir_tools', 'resumo_ferramentas_por_tema', tools=[
            fake_tool('feriados_brasil_ano'), fake_tool('status_defender'),
            fake_tool('estatisticas_descritivas')])
        r = env['resumo_ferramentas_por_tema']()
        self.assertIn('total real: 3', r)
        self.assertIn('Windows/sistema/seguranca: 1', r)
        self.assertIn('Fora dos temas listados: 0', r)

    def test_achar_ferramenta_para_tarefa(self):
        env = carregar('_garantir_tools', 'achar_ferramenta_para_tarefa', tools=[
            fake_tool('feriados_brasil_ano', 'feriados nacionais do Brasil'),
            fake_tool('espaco_recuperavel', 'espaco em disco recuperavel'),
            fake_tool('status_defender', 'status do antivirus')])
        r = env['achar_ferramenta_para_tarefa']('limpar espaco em disco')
        self.assertIn('espaco_recuperavel', r)
        self.assertIn('casou:', r)
        self.assertIn('Nenhuma ferramenta combinou', env['achar_ferramenta_para_tarefa']('xyz de qwz'))

    def test_fluxo_sugerido_e_comparacao(self):
        env = carregar('fluxo_sugerido_tarefa', 'comparar_ferramentas_similares')
        r = env['fluxo_sugerido_tarefa']('limpar disco')
        self.assertIn('espaco_recuperavel', r)
        self.assertIn('esvaziar_lixeira', r)
        self.assertIn('Temas com roteiro pronto', env['fluxo_sugerido_tarefa']('jardinagem'))
        self.assertIn('estatisticas_csv', env['comparar_ferramentas_similares']())

    def test_ideias_rejeitadas_comandos(self):
        config = {}
        env = carregar('_norm_pt', '_r23_comandos', '_r23_ideias_evitar', config=config,
                       salvar_json=lambda caminho, dados: None, ARQ_CONFIG='x.json',
                       input=__import__('unittest.mock', fromlist=['Mock']).Mock(return_value='LIMPAR'))
        with redirect_nada():
            self.assertTrue(env['_r23_comandos']('ideia rejeitada: agenda duplicada'))
        self.assertEqual(config['ideias_rejeitadas'], ['agenda duplicada'])
        evitar, rejeitadas = env['_r23_ideias_evitar'](
            {'titulos_ideias_sugeridas': ['a', 'b'], 'ideias_rejeitadas': ['agenda duplicada']})
        self.assertEqual(evitar, ['a', 'b', 'agenda duplicada'])
        self.assertEqual(rejeitadas, ['agenda duplicada'])
        with redirect_nada():
            self.assertTrue(env['_r23_comandos']('limpar ideias rejeitadas'))
        self.assertEqual(config['ideias_rejeitadas'], [])

    def test_limpar_rejeitadas_exige_confirmacao(self):
        import unittest.mock as _m
        config = {'ideias_rejeitadas': ['x']}
        env = carregar('_norm_pt', '_r23_comandos', config=config, salvar_json=lambda c, d: None,
                       ARQ_CONFIG='x.json', input=_m.Mock(return_value='nao'))
        with redirect_nada():
            self.assertTrue(env['_r23_comandos']('limpar ideias rejeitadas'))
        self.assertEqual(config['ideias_rejeitadas'], ['x'])
        self.assertFalse(env['_r23_comandos']('comando qualquer estranho'))


import io as _io
import contextlib as _ctxlib


def redirect_nada():
    return _ctxlib.redirect_stdout(_io.StringIO())


if __name__ == '__main__':
    unittest.main()
