"""Testes isolados: nao importa o agente nem inicia servicos/acoes reais."""
import ast
import pathlib
import unittest
from unittest.mock import Mock

SOURCE = pathlib.Path(__file__).resolve().parents[1] / 'agente.py'
TREE = ast.parse(SOURCE.read_text(encoding='utf-8'))


def carregar(*nomes, **ambiente):
    nos = [n for n in TREE.body if isinstance(n, ast.FunctionDef) and (n.name in nomes or n.name.startswith(('_r20_', '_r21_')))]
    exec(compile(ast.Module(body=nos, type_ignores=[]), str(SOURCE), 'exec'), ambiente)
    return ambiente


class RoteamentoConversa(unittest.TestCase):
    def setUp(self):
        self.busca = Mock(return_value=[])
        self.env = carregar('_eh_pergunta_de_conversa', '_despachar_ferramenta_local',
                            _buscar_ferramentas=self.busca,
                            _parece_pedido_de_acao=lambda x: x.startswith('instale '))

    def test_perguntas_nao_abrem_seletor(self):
        for texto in ['oque é a IA local?', 'OQUE VC FAZER',
                      'COMO FAÇO PRA IR NA IA LOCAL', 'como instalar python?',
                      'me explica servidor local', 'IA nuvem', 'oi tudo bem']:
            with self.subTest(texto=texto):
                self.assertFalse(self.env['_despachar_ferramenta_local'](texto))
        self.busca.assert_not_called()

    def test_acao_ainda_busca_ferramenta(self):
        self.env['_despachar_ferramenta_local']('instale python')
        self.busca.assert_called_once_with('instale python', 3)

    def test_perguntas_sao_conversa(self):
        for texto in ['OQUE VC FAZER', 'o que é IA?', 'COMO FAÇO PRA IR NA IA LOCAL']:
            self.assertTrue(self.env['_eh_pergunta_de_conversa'](texto))
        self.assertFalse(self.env['_eh_pergunta_de_conversa']('instale python'))

    def test_roteador_real_exemplos_nos_dois_modos(self):
        from contextlib import redirect_stdout
        from io import StringIO
        for nuvem in (False, True):
            for texto in ['oque é IA local?', 'oque é a IA local?',
                          'COMO FAÇO PRA IR NA IA LOCAL', 'IA nuvem', 'IA local']:
                with self.subTest(nuvem=nuvem, texto=texto):
                    config = {'usar_ia_nuvem': nuvem}
                    env = carregar('_norm_pt', '_eh_pergunta_de_conversa',
                                   '_processar_cerebro_local',
                                   config=config, _ULTIMO_COMANDO={},
                                   historico_conversas=[], falar=Mock(),
                                   salvar_historico=Mock())
                    saida = StringIO()
                    with redirect_stdout(saida):
                        self.assertTrue(env['_processar_cerebro_local'](texto))
                    self.assertIn('digite: desligar ia', saida.getvalue())
                    self.assertNotIn('Digite o numero', saida.getvalue())
                    self.assertNotIn('localizar_ip', saida.getvalue())
                    self.assertEqual(config['usar_ia_nuvem'], nuvem)

    def test_interruptores_preservados(self):
        from contextlib import redirect_stdout
        from io import StringIO
        config = {'usar_ia_nuvem': False}
        env = carregar('_norm_pt', '_processar_cerebro_local',
                       config=config, _ULTIMO_COMANDO={},
                       salvar_json=Mock(), ARQ_CONFIG='nao-gravar.json')
        with redirect_stdout(StringIO()):
            self.assertTrue(env['_processar_cerebro_local']('ligar ia'))
            self.assertTrue(config['usar_ia_nuvem'])
            self.assertTrue(env['_processar_cerebro_local']('desligar ia'))
            self.assertFalse(config['usar_ia_nuvem'])

    def test_atualizador_aponta_para_correcao(self):
        bat = (SOURCE.parent / 'iniciar.bat').read_text()
        self.assertNotIn('arena/01a07ce2-guilhermefmaga-site', bat)
        self.assertIn('arena/01a082fd-guilhermefmaga-site/agente.py', bat)
        self.assertIn('python -m py_compile agente_novo.py', bat)
        self.assertIn('SEM_ATUALIZAR.txt', bat)

    def test_explicacoes_passam_pelo_roteador_sem_ferramentas(self):
        for nuvem in (False, True):
            for texto in [
                'Explique a diferença entre memória RAM e armazenamento.',
                'O que é armazenamento?', 'Qual a diferença entre RAM e disco?',
                'Me explica como desligar o firewall',
                'Por favor explique o que é limpar lixo',
                'Como funciona o modo jogo?',
                'me de 50 ideias que vc queria ter dentro de vc?',
            ]:
                with self.subTest(nuvem=nuvem, texto=texto):
                    invocar = Mock(side_effect=AssertionError('Nao executar ferramenta'))
                    env = carregar('_norm_pt', '_eh_pergunta_de_conversa',
                                   '_pedido_explicativo', '_processar_cerebro_local',
                                   config={'usar_ia_nuvem': nuvem},
                                   _ULTIMO_COMANDO={}, _invocar_local=invocar)
                    self.assertFalse(env['_processar_cerebro_local'](texto))
                    invocar.assert_not_called()

    def test_consulta_real_de_disco_preservada(self):
        from contextlib import redirect_stdout
        from io import StringIO
        invocar = Mock(return_value='Espaco consultado')
        env = carregar('_norm_pt', '_eh_pergunta_de_conversa',
                       '_pedido_explicativo', '_processar_cerebro_local',
                       config={}, _ULTIMO_COMANDO={}, _invocar_local=invocar,
                       _interpretar_ajuste_pc=lambda texto: None,
                       historico_conversas=[], falar=Mock(), salvar_historico=Mock())
        with redirect_stdout(StringIO()):
            self.assertTrue(env['_processar_cerebro_local']('espaco em disco'))
        invocar.assert_called_once_with('espaco_em_disco')

    def test_sintaxe_completa(self):
        compile(SOURCE.read_text(encoding='utf-8'), str(SOURCE), 'exec')


if __name__ == '__main__':
    unittest.main()
