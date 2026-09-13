"""r40: quando TODAS as ideias repetem o historico, a resposta mostra os
titulos bloqueados (prova do filtro) + 3 ideias do catalogo para variar.
AST isolado; sem rede, sem GGUF; catalogo em pasta temporaria."""
import json
import os
import tempfile
import unittest
from test_roteamento_conversa import carregar


def env_r40(catalogo=None):
    base = {}
    if catalogo is not None:
        docs = os.path.join(tempfile.mkdtemp(), 'docs')
        os.makedirs(docs, exist_ok=True)
        with open(os.path.join(docs, 'CATALOGO_PROPOSTAS_FERRAMENTAS.md'), 'w',
                  encoding='utf-8') as f:
            f.write(catalogo)
        base['__file__'] = os.path.join(docs, '..', 'agente.py')
    return carregar('_norm_pt', '_r26_palavras', '_r26_propostas_catalogo',
                    '_r26_filtrar_rejeitadas', '_r26_priorizar', '_r26_sem_colisao',
                    '_r26_dobrar', '_r38_tres_do_catalogo', '_r40_bloco_catalogo_fallback',
                    '_r31_ideia_ja_existe', '_r31_numero_no_catalogo',
                    '_titulo_ideia_repetido', '_roteiro_revisao_alternativo',
                    '_relacionadas_no_inventario', '_formatar_ideias_verificadas',
                    **base)


INVENTARIO = {'funcoes': {'gerar_senha': {'linha': 10}}, 'hash': 'abc123def456'}
EVIDENCIAS = [{'nome': 'gerar_senha'}]


def item(titulo):
    return {'titulo': titulo, 'justificativa': 'j', 'beneficio': 'b',
            'risco': 'c', 'teste': 'd', 'funcoes': ['gerar_senha']}


class TudoRepetido(unittest.TestCase):
    def test_repetidas_mostram_titulos_e_catalogo(self):
        catalogo = ('# c\n\n## G9. Testes\n'
                    '9. Proposta `medidor_de_x` - mede x com precisao.\n'
                    '10. Proposta `organizador_de_y` - organiza y por cor.\n'
                    '11. Proposta `trena_estatica` - mede por foto.\n')
        env = env_r40(catalogo=catalogo)
        anteriores = ['Logs de chamadas do agente', 'Processos de CPU pesados',
                      'Memoria em tempo real', 'Processos de disco', 'Tarefas suspeitas']
        itens = [item('Logs de chamadas do agente'), item('Processos de CPU pesados'),
                 item('Memoria em tempo real'), item('Processos de disco'),
                 item('Tarefas suspeitas')]
        saida = env['_formatar_ideias_verificadas'](
            json.dumps({'ideias': itens}, ensure_ascii=False),
            INVENTARIO, EVIDENCIAS, 5, anteriores, [])
        self.assertIn('validos: 0/5', saida)
        self.assertIn('Titulos repetidos ou muito semelhantes ao historico: 5', saida)
        self.assertIn('O filtro anti-repeticao BLOQUEOU 5 ideia(s)', saida)
        self.assertIn('- (repetida) Logs de chamadas do agente', saida)
        self.assertIn('Para VARIAR, peca um tema especifico', saida)
        self.assertIn('(catalogo #9)', saida)
        self.assertIn('medidor_de_x', saida)

    def test_sem_repeticoes_nao_mostra_nada_disso(self):
        env = env_r40(catalogo='# c\n\n## G9\n9. Proposta `medidor_de_x` - mede x.\n')
        itens = [item('Controle de colmeias')]
        saida = env['_formatar_ideias_verificadas'](
            json.dumps({'ideias': itens}, ensure_ascii=False),
            INVENTARIO, EVIDENCIAS, 1, [], [])
        self.assertIn('validos: 1/1', saida)
        self.assertNotIn('O filtro anti-repeticao BLOQUEOU', saida)
        self.assertNotIn('(repetida)', saida)

    def test_sem_catalogo_mostra_so_titulos_e_orientacao(self):
        env = env_r40()
        anteriores = ['Logs de chamadas do agente']
        saida = env['_formatar_ideias_verificadas'](
            json.dumps({'ideias': [item('Logs de chamadas do agente')]}, ensure_ascii=False),
            INVENTARIO, EVIDENCIAS, 1, anteriores, [])
        self.assertIn('BLOQUEOU 1 ideia(s)', saida)
        self.assertIn('- (repetida) Logs de chamadas do agente', saida)
        self.assertNotIn('(catalogo #', saida)
        self.assertIn('fabrica de ideias', saida)


if __name__ == '__main__':
    unittest.main()
