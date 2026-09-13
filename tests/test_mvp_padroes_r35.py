"""r35: mais padroes MVP que nascem RODANDO (temperatura, duracoes,
comparador, divisor). Os corpos gerados sao executados AQUI (template
controlado); sem rede, sem GGUF, sem disco."""
import unittest
from test_roteamento_conversa import carregar


def env_r35():
    return carregar('_norm_pt', '_r34_padrao_funcional')


def corpo_de(env, ideia):
    categoria, corpo = env['_r34_padrao_funcional'](ideia)
    ambiente = {}
    exec(compile(corpo.replace('_NOME_', 'fn').replace('_IDEIA_', ideia),
                 'mvp', 'exec'), ambiente)
    return categoria, ambiente['fn']


class Deteccao(unittest.TestCase):
    def setUp(self):
        self.env = env_r35()

    def test_quatro_novos_padroes(self):
        for ideia, esperado in (('conversor de temperatura do forno', 'conversor de temperatura'),
                                ('somador de horas trabalhadas', 'somador de duracoes'),
                                ('comparador de listas de compras', 'comparador de textos'),
                                ('divisor de texto em pedacos', 'divisor de texto'),
                                ('fragmentar relatorio em partes', 'divisor de texto')):
            categoria, _ = corpo_de(self.env, ideia)
            self.assertEqual(categoria, esperado, ideia)

    def test_temperatura_ganha_do_conversor_generico(self):
        categoria, _ = corpo_de(self.env, 'conversor de temperatura')
        self.assertEqual(categoria, 'conversor de temperatura')

    def test_conversor_generico_continua(self):
        categoria, _ = corpo_de(self.env, 'conversor de litro para galao')
        self.assertEqual(categoria, 'conversor')

    def test_comparador_de_json_nao_e_desviado(self):
        categoria, corpo = self.env['_r34_padrao_funcional']('comparador de json grande')
        self.assertNotEqual(categoria, 'comparador de textos')
        self.assertIn(categoria, ('', None))


class CorposRodam(unittest.TestCase):
    def setUp(self):
        self.env = env_r35()

    def test_temperatura(self):
        _, fn = corpo_de(self.env, 'conversor de temperatura')
        saida = fn('25 celsius para fahrenheit')
        self.assertIn('77.0', saida)
        saida2 = fn('0 celsius para kelvin')
        self.assertIn('273.15', saida2)
        with self.assertRaises(ValueError):
            fn('25 celsius para parsec')

    def test_horas(self):
        _, fn = corpo_de(self.env, 'somador de horas trabalhadas')
        saida = fn('1:30 0:45')
        self.assertIn('2:15:00', saida)
        saida2 = fn('1:00:10 0:00:50')
        self.assertIn('1:01:00', saida2)
        with self.assertRaises(ValueError):
            fn('sem duracao aqui')

    def test_comparador(self):
        _, fn = corpo_de(self.env, 'comparador de listas de compras')
        saida = fn('arroz\nfeijao\ncafe', outras='arroz\nacucar\ncafe')
        self.assertIn('Comuns: 2', saida)
        self.assertIn('So no primeiro: 1', saida)
        self.assertIn('feijao', saida)
        self.assertIn('acucar', saida)
        with self.assertRaises(ValueError):
            fn('so um lado')

    def test_divisor(self):
        _, fn = corpo_de(self.env, 'divisor de texto em pedacos')
        saida = fn('abcdefghij', partes='2')
        self.assertIn('2 parte(s)', saida)
        self.assertIn('abcde', saida)
        self.assertIn('fghij', saida)
        with self.assertRaises(ValueError):
            fn('abc', partes='99')


if __name__ == '__main__':
    unittest.main()
