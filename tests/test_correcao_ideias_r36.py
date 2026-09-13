"""r36: correcao do relato real do PC (0/5 por JSON demais para o modelo
pequeno): campos opcionais viram [parcial] em vez de descartar; fallback
aponta fabrica de ideias / esqueleto; recorte de evidencias 6 -> 8.
AST isolado; sem rede, sem GGUF."""
import unittest
from test_roteamento_conversa import carregar


def env_r36():
    return carregar('_norm_pt', '_r26_propostas_catalogo',
                    '_r31_ideia_ja_existe', '_r31_numero_no_catalogo',
                    '_titulo_ideia_repetido', '_roteiro_revisao_alternativo',
                    '_relacionadas_no_inventario', '_formatar_ideias_verificadas',
                    '_selecionar_evidencias_ideias')


INVENTARIO = {'funcoes': {'gerar_senha': {'linha': 10}, 'morse_converter': {'linha': 20}},
              'hash': 'abc123def456'}
EVIDENCIAS = [{'nome': 'gerar_senha'}, {'nome': 'morse_converter'}]


def item(titulo, ref='gerar_senha', completo=True):
    base = {'titulo': titulo, 'justificativa': 'porque e util',
            'funcoes': [ref]}
    if completo:
        base.update({'beneficio': 'economiza tempo', 'risco': 'baixo',
                     'teste': 'rodar e conferir'})
    return base


class CamposOpcionaisViramParcial(unittest.TestCase):
    def setUp(self):
        self.env = env_r36()

    def test_item_sem_avaliacao_e_aceito_com_marcacao(self):
        texto = '{"ideias":[' + str(item('Organizador de gavetas', completo=False)).replace("'", '"') + ']}'
        saida = self.env['_formatar_ideias_verificadas'](texto, INVENTARIO, EVIDENCIAS, 1, [], [])
        self.assertIn('validos: 1/1', saida)
        self.assertIn('[parcial: modelo nao avaliou risco/teste]', saida)
        self.assertIn('- (nao avaliado pelo modelo local)', saida)
        self.assertIn('1 sugestao(oes) vieram sem avaliacao de risco/teste', saida)

    def test_item_completo_nao_ganha_marcador(self):
        texto = '{"ideias":[' + str(item('Organizador de gavetas')).replace("'", '"') + ']}'
        saida = self.env['_formatar_ideias_verificadas'](texto, INVENTARIO, EVIDENCIAS, 1, [], [])
        self.assertNotIn('[parcial', saida)
        self.assertNotIn('vieram sem avaliacao', saida)

    def test_sem_justificativa_continua_descartado(self):
        dados = {'ideias': [{'titulo': 'Coisa', 'funcoes': ['gerar_senha'],
                             'beneficio': 'b', 'risco': 'c', 'teste': 'd'}]}
        import json
        saida = self.env['_formatar_ideias_verificadas'](json.dumps(dados, ensure_ascii=False),
                                                         INVENTARIO, EVIDENCIAS, 1, [], [])
        self.assertIn('validos: 0/1', saida)


class FallbackApontaFabrica(unittest.TestCase):
    def setUp(self):
        self.env = env_r36()

    def test_parse_fail_menciona_fabrica(self):
        saida = self.env['_formatar_ideias_verificadas']('isto nao e json',
                                                         INVENTARIO, EVIDENCIAS, 1, [], [])
        self.assertIn('fabrica de ideias', saida)
        self.assertIn('esqueleto de ideia:', saida)

    def test_tudo_descartado_menciona_fabrica(self):
        import json
        dados = {'ideias': [item('gerar senha')]}  # existe: descartada pela checagem dura
        saida = self.env['_formatar_ideias_verificadas'](json.dumps(dados),
                                                         INVENTARIO, EVIDENCIAS, 1, [], [])
        self.assertIn('nenhuma foi validada', saida)
        self.assertIn('fabrica de ideias', saida)


class RecorteMaior(unittest.TestCase):
    def test_seletor_devolve_ate_8(self):
        env = env_r36()
        funcoes = {('fn' + str(i)): {'nome': 'fn' + str(i), 'linha': i,
                                     'descricao': 'faz coisa ' + str(i)} for i in range(12)}
        inventario = {'funcoes': funcoes, 'hash': 'x'}
        self.assertEqual(len(env['_selecionar_evidencias_ideias'](inventario, 'nada especifico')), 8)


if __name__ == '__main__':
    unittest.main()
