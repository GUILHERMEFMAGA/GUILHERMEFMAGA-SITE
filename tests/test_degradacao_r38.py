"""r38: resgate de JSON embutido em prosa + degradacao com conteudo real
(3 ideias do catalogo na resposta de falha). AST isolado; sem rede, sem GGUF;
catalogo em pasta temporaria."""
import json
import os
import tempfile
import unittest
from test_roteamento_conversa import carregar


def env_r38(catalogo=None, tools=None):
    base = {}
    if tools is not None:
        import types
        base['tools'] = [types.SimpleNamespace(name=n, description='desc') for n in tools]
    if catalogo is not None:
        docs = os.path.join(tempfile.mkdtemp(), 'docs')
        os.makedirs(docs, exist_ok=True)
        with open(os.path.join(docs, 'CATALOGO_PROPOSTAS_FERRAMENTAS.md'), 'w',
                  encoding='utf-8') as f:
            f.write(catalogo)
        base['__file__'] = os.path.join(docs, '..', 'agente.py')
    return carregar('_norm_pt', '_r26_palavras', '_r26_propostas_catalogo',
                    '_r26_filtrar_rejeitadas', '_r26_priorizar', '_r26_sem_colisao',
                    '_r26_dobrar', '_r38_tres_do_catalogo',
                    '_r31_ideia_ja_existe', '_r31_numero_no_catalogo',
                    '_titulo_ideia_repetido', '_roteiro_revisao_alternativo',
                    '_relacionadas_no_inventario', '_formatar_ideias_verificadas',
                    **base)


INVENTARIO = {'funcoes': {'gerar_senha': {'linha': 10}}, 'hash': 'abc123def456'}
EVIDENCIAS = [{'nome': 'gerar_senha'}]

ITEM_OK = ('{"titulo":"Controle de enxadas","justificativa":"para o sitio",'
           '"beneficio":"b","risco":"c","teste":"d","funcoes":["gerar_senha"]}')


class ResgateDeJson(unittest.TestCase):
    def setUp(self):
        self.env = env_r38()

    def test_json_embrulhado_em_prosa_e_resgatado(self):
        texto = ('Segue minha proposta em JSON conforme pedido:\n'
                 '{"ideias": [' + ITEM_OK + ']}\nqualquer duvida me avisa!')
        saida = self.env['_formatar_ideias_verificadas'](texto, INVENTARIO, EVIDENCIAS,
                                                         1, [], [])
        self.assertIn('validos: 1/1', saida)
        self.assertIn('Controle de enxadas', saida)

    def test_lixo_sem_chaves_mantem_falha_honesta(self):
        saida = self.env['_formatar_ideias_verificadas']('eu nao sei fazer isso',
                                                         INVENTARIO, EVIDENCIAS, 1, [], [])
        self.assertIn('Nao consegui estruturar', saida)
        self.assertNotIn('eu nao sei', saida)


class DegradacaoComConteudo(unittest.TestCase):
    def test_falha_com_catalogo_traz_3_ideias_reais(self):
        catalogo = ('# c\n\n## G9. Testes\n'
                    '9. Proposta `medidor_de_x` - mede x com precisao.\n'
                    '10. Proposta `organizador_de_y` - organiza y por cor.\n'
                    '11. Proposta `trena_digital_estatica` - mede distancias por foto.\n'
                    '12. Proposta `conta_gotas_manual` - conta gotas.\n')
        env = env_r38(catalogo=catalogo, tools=['gerar_senha'])
        saida = env['_formatar_ideias_verificadas']('resposta quebrada do modelo { nao json',
                                                    INVENTARIO, EVIDENCIAS, 1, [], [])
        self.assertIn('Nao consegui estruturar', saida)
        self.assertIn('ideia(s) do catalogo (definidas no programa, nao pela IA)', saida)
        self.assertIn('(catalogo #9)', saida)
        self.assertIn('medidor_de_x', saida)
        self.assertIn('fabrica de ideias', saida)
        self.assertIn('Roteiro alternativo', saida)

    def test_falha_sem_catalogo_mantem_orientacao_limpa(self):
        env = env_r38()
        saida = env['_formatar_ideias_verificadas']('{ quebrado', INVENTARIO, EVIDENCIAS,
                                                    1, [], [])
        self.assertIn('Nao consegui estruturar', saida)
        self.assertIn('fabrica de ideias', saida)
        self.assertNotIn('ideia(s) do catalogo', saida)
        self.assertIn('Roteiro alternativo', saida)

    def test_tres_do_catalogo_sem_nada_nao_quebra(self):
        env = env_r38()
        self.assertEqual(env['_r38_tres_do_catalogo'](), [])


if __name__ == '__main__':
    unittest.main()
