"""r22 lote 1: calculo/fisica/texto/datas offline. AST isolado; sem rede nem GGUF."""
import ast
import base64
import json
import unittest
from test_roteamento_conversa import carregar, TREE, SOURCE


def modulo_var(nome):
    env = {}
    for no in TREE.body:
        if isinstance(no, ast.Assign) and any(isinstance(t, ast.Name) and t.id == nome for t in no.targets):
            exec(compile(ast.Module(body=[no], type_ignores=[]), str(SOURCE), 'exec'), env)
    return env[nome]


class Matematica(unittest.TestCase):
    def setUp(self):
        self.env = carregar('_r22_num', 'estatisticas_descritivas', 'mmc_mdc_calcular',
                            'fatorar_numero_primos', 'converter_base_numerica',
                            'resolver_segundo_grau', 'resolver_sistema_linear_2x2',
                            'permutacoes_combinacoes_calcular', 'geometria_plana_calcular',
                            'teorema_pitagoras_resolver')

    def test_estatisticas_basicas_e_erro(self):
        r = self.env['estatisticas_descritivas']('2, 4, 4, 4, 5, 5, 7, 9')
        self.assertIn('Media: 5', r)
        self.assertIn('Mediana: 4.5', r)
        self.assertIn('Moda: 4', r)
        with self.assertRaises(ValueError):
            self.env['estatisticas_descritivas']('')

    def test_mmc_mdc(self):
        r = self.env['mmc_mdc_calcular']('12, 18')
        self.assertIn('MDC: 6', r)
        self.assertIn('MMC: 36', r)
        with self.assertRaises(ValueError):
            self.env['mmc_mdc_calcular']('12, 1.5')

    def test_fatoracao_e_primo(self):
        r = self.env['fatorar_numero_primos'](360)
        self.assertIn('2^3 * 3^2 * 5', r.replace('×', '*'))
        self.assertIn('Quantidade de divisores: 24', r)
        self.assertIn('E primo? nao', r)
        self.assertIn('E primo? sim', self.env['fatorar_numero_primos'](13))

    def test_bases(self):
        self.assertIn('= ff', self.env['converter_base_numerica'](255, 10, 16))
        self.assertIn('Decimal: 255', self.env['converter_base_numerica']('ff', 16, 10))
        self.assertIn('= 10', self.env['converter_base_numerica'](2, 10, 2))
        with self.assertRaises(ValueError):
            self.env['converter_base_numerica']('129', 8, 10)

    def test_bhaskara(self):
        r = self.env['resolver_segundo_grau'](1, -5, 6)
        self.assertIn('Duas raizes reais', r)
        self.assertIn('x1 = 3', r)
        self.assertIn('x2 = 2', r)
        self.assertIn('Sem raizes reais', self.env['resolver_segundo_grau'](1, 0, 1))
        with self.assertRaises(ValueError):
            self.env['resolver_segundo_grau'](0, 5, 6)

    def test_sistema_2x2(self):
        r = self.env['resolver_sistema_linear_2x2'](1, 1, 3, 2, 1, 4)
        self.assertIn('x = 1', r)
        self.assertIn('y = 2', r)
        self.assertIn('infinitas solucoes', self.env['resolver_sistema_linear_2x2'](1, 1, 2, 2, 2, 4))
        self.assertIn('impossivel', self.env['resolver_sistema_linear_2x2'](1, 1, 2, 1, 1, 5))

    def test_permutacoes_combinacoes(self):
        r = self.env['permutacoes_combinacoes_calcular'](5, 2)
        self.assertIn('P(n,k) = 20', r)
        self.assertIn('C(n,k) = 10', r)
        with self.assertRaises(ValueError):
            self.env['permutacoes_combinacoes_calcular'](3, 5)

    def test_geometria(self):
        r = self.env['geometria_plana_calcular']('circulo', raio=2)
        self.assertIn('Area = 12.566', r)
        self.assertIn('Perimetro = 12.566', r)
        self.assertIn('Area = 9', self.env['geometria_plana_calcular']('quadrado', lado=3))
        with self.assertRaises(ValueError):
            self.env['geometria_plana_calcular']('hexagono')

    def test_pitagoras(self):
        self.assertIn('Hipotenusa = 5', self.env['teorema_pitagoras_resolver'](3, 4))
        self.assertIn('Cateto2 = 4', self.env['teorema_pitagoras_resolver'](3, hipotenusa=5))
        with self.assertRaises(ValueError):
            self.env['teorema_pitagoras_resolver'](2, 3, hipotenusa=4)


class Fisica(unittest.TestCase):
    def setUp(self):
        self.env = carregar('_r22_num', 'lei_de_ohm_calcular', 'resistores_circuitos_calcular',
                            'resistor_codigo_de_cores', 'energia_mecanica_calcular',
                            'velocidade_media_calcular', 'densidade_calcular')

    def test_ohm(self):
        r = self.env['lei_de_ohm_calcular'](voltagem=12, resistencia=4)
        self.assertIn('Corrente = 3', r)
        self.assertIn('Potencia = 36', r)
        with self.assertRaises(ValueError):
            self.env['lei_de_ohm_calcular'](1, 2, 3)

    def test_resistores(self):
        self.assertIn('= 320', self.env['resistores_circuitos_calcular']('100, 220', 'serie'))
        self.assertIn('= 500', self.env['resistores_circuitos_calcular']('1k, 1k', 'paralelo'))
        with self.assertRaises(ValueError):
            self.env['resistores_circuitos_calcular']('100', 'estrela')

    def test_codigo_de_cores(self):
        r = self.env['resistor_codigo_de_cores']('marrom, preto, vermelho')
        self.assertIn('1 k-ohms', r)
        self.assertIn('20%', r)
        with self.assertRaises(ValueError):
            self.env['resistor_codigo_de_cores']('rosa, preto, vermelho')

    def test_energia(self):
        self.assertIn('= 9', self.env['energia_mecanica_calcular']('cinetica', massa=2, velocidade=3))
        self.assertIn('98.1', self.env['energia_mecanica_calcular']('potencial', massa=2, altura=5))
        with self.assertRaises(ValueError):
            self.env['energia_mecanica_calcular']('termica', massa=1)

    def test_velocidade(self):
        r = self.env['velocidade_media_calcular'](100, 2)
        self.assertIn('= 50 km/h', r)
        self.assertIn('13.8889', r)

    def test_densidade(self):
        r = self.env['densidade_calcular'](27, 10)
        self.assertIn('2.7 g/cm^3', r)
        self.assertIn('aluminio', r)
        self.assertIn('nao achei material comum proximo', self.env['densidade_calcular'](5, 10).lower())


class TextoDatas(unittest.TestCase):
    def setUp(self):
        self.env = carregar('_r22_num', 'contar_silabas_texto', 'cifra_de_cesar_converter',
                            'morse_converter', 'feriados_brasil_ano', 'decodificar_jwt_token',
                            _MORSE=modulo_var('_MORSE'))

    def test_silabas(self):
        r = self.env['contar_silabas_texto']('amor\nbola')
        self.assertIn('linha(s)', r)
        self.assertIn('  2 |', r)
        with self.assertRaises(ValueError):
            self.env['contar_silabas_texto']('   ')

    def test_cesar(self):
        cifrado = self.env['cifra_de_cesar_converter']('abc ABC, z!', 3)
        self.assertIn('def DEF, c!', cifrado)
        self.assertIn('abc ABC, z!', self.env['cifra_de_cesar_converter'](cifrado.splitlines()[1], 3, 'decifrar'))
        bruta = self.env['cifra_de_cesar_converter']('khoor', 0, 'forca_bruta')
        self.assertIn('hello', bruta)

    def test_morse(self):
        r = self.env['morse_converter']('sos', 'texto_para_morse')
        self.assertIn('... --- ...', r)
        self.assertIn('SOS', self.env['morse_converter']('... --- ...', 'morse_para_texto'))
        with self.assertRaises(ValueError):
            self.env['morse_converter']('a@b', 'texto_para_morse')

    def test_feriados(self):
        r = self.env['feriados_brasil_ano'](2026)
        self.assertIn('Natal', r)
        self.assertIn('25/12', r)
        self.assertIn('Carnaval', r)
        self.assertIn('Consciencia Negra', r)
        with self.assertRaises(ValueError):
            self.env['feriados_brasil_ano'](1800)

    def test_jwt(self):
        parte = lambda dados: base64.urlsafe_b64encode(json.dumps(dados).encode()).decode().rstrip('=')
        token = parte({'alg': 'HS256', 'typ': 'JWT'}) + '.' + parte({'sub': '1', 'nome': 'teste'}) + '.assinatura'
        r = self.env['decodificar_jwt_token'](token)
        self.assertIn('HS256', r)
        self.assertIn('"sub": "1"', r)
        self.assertIn('NAO verificada', r)
        with self.assertRaises(ValueError):
            self.env['decodificar_jwt_token']('so-uma-parte')


if __name__ == '__main__':
    unittest.main()
