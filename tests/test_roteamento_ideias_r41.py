"""r41: roteamento de pedidos de ideias sem depender de UMA palavra (relato
real: 'nao obtem' escapava pro chat) + fabrica com quantidade (3-20) +
aviso de completude apontando a fabrica. AST isolado."""
import unittest
from unittest.mock import Mock
from test_roteamento_conversa import carregar


class Gatilhos(unittest.TestCase):
    def setUp(self):
        self.env = carregar('_norm_pt', '_pedido_ideias_do_agente')

    def test_variacao_do_relato_agora_roteia(self):
        pedido = 'Me de ideias pra te melhorar ou seja ferramentas e funcoes que ainda vc nao obtem?'
        self.assertTrue(self.env['_pedido_ideias_do_agente'](pedido))

    def test_frases_classicas_continuam(self):
        for texto in ('me de ideias pra melhorar, ferramentas que vc ainda nao tem',
                      'o que voce gostaria de ter',
                      'sugestoes para o agente',
                      'o que falta no agente?'):
            self.assertTrue(self.env['_pedido_ideias_do_agente'](texto), texto)

    def test_pedido_de_terceiros_nao_roteia(self):
        self.assertFalse(self.env['_pedido_ideias_do_agente']('me ajuda a melhorar meu site'))
        self.assertFalse(self.env['_pedido_ideias_do_agente']('implemente uma calculadora'))


class FabricaComQuantidade(unittest.TestCase):
    def setUp(self):
        import os
        import tempfile
        import types
        self.pasta = tempfile.mkdtemp()
        docs = os.path.join(self.pasta, 'docs')
        os.makedirs(docs)
        propostas = ''.join(
            str(9 + i) + '. Proposta `ideia_catalogo_' + str(i)
            + '` - faz a coisa ' + str(i) + ' com qualidade.\n' for i in range(10))
        with open(os.path.join(docs, 'CATALOGO_PROPOSTAS_FERRAMENTAS.md'), 'w',
                  encoding='utf-8') as f:
            f.write('# c\n\n## G9. Testes\n' + propostas)
        self.env = carregar('_norm_pt', '_r26_palavras', '_r26_propostas_catalogo',
                            '_r26_filtrar_rejeitadas', '_r26_priorizar', '_r26_sem_colisao',
                            '_r26_dobrar', '_r26_relatorio', '_r26_comandos',
                            __file__=os.path.join(self.pasta, 'agente.py'),
                            tools=[types.SimpleNamespace(name='algo_totalmente_diferente',
                                                         description='d')])

    def linhas_sugeridas(self, comando):
        import contextlib
        import io
        tampao = io.StringIO()
        with contextlib.redirect_stdout(tampao):
            retorno = self.env['_r26_comandos'](comando)
        import re as _re
        saida = [l for l in tampao.getvalue().splitlines()
                 if _re.match(r'^\s*\d+\.\s', l)]
        return retorno, len(saida)

    def test_padrao_oito_e_parse_de_quantidade(self):
        retorno, qtd = self.linhas_sugeridas('fabrica de ideias')
        self.assertTrue(retorno)
        self.assertEqual(qtd, 8)
        retorno2, qtd2 = self.linhas_sugeridas('fabrica de ideias: 20')
        self.assertTrue(retorno2)
        self.assertEqual(qtd2, 10)  # o catalogo do teste so tem 10
        retorno3, qtd3 = self.linhas_sugeridas('fabrica de ideias 3')
        self.assertTrue(retorno3)
        self.assertEqual(qtd3, 3)

    def test_sufixo_nao_numerico_nao_e_comando_de_quantidade(self):
        retorno, _ = self.linhas_sugeridas('fabrica de ideias agora')
        self.assertFalse(retorno)


class AvisoDeCompletude(unittest.TestCase):
    def test_mensagem_menciona_fabrica(self):
        env = carregar('_norm_pt')
        # mensagem montada inline no fluxo de listas; verificamos o fonte por contrato
        fonte = open('agente.py', encoding='utf-8').read()
        self.assertIn('Para ideias de ferramentas/melhorias do PROPRIO agente (auditadas', fonte)
        self.assertIn('fabrica de ideias', fonte)


if __name__ == '__main__':
    unittest.main()
