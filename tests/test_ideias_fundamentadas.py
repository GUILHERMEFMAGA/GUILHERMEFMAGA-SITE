"""Analise de fonte inerte e respostas simuladas: nao executa o agente."""
import ast
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from contextlib import redirect_stdout
from io import StringIO
from test_roteamento_conversa import carregar, SOURCE

NOMES = ('_titulo_ideia_repetido', '_relacionadas_no_inventario', '_roteiro_revisao_alternativo', '_norm_pt', '_pedido_ideias_do_agente', '_inventario_para_ideias',
         '_selecionar_evidencias_ideias', '_formatar_ideias_verificadas',
         '_sugerir_ideias_do_codigo', '_quantidade_lista_local')


def ideia(**mudancas):
    item = dict(titulo='Melhorar validacao', justificativa='A chamada pode falhar.',
                beneficio='Erros mais claros.', risco='Requer testes.',
                teste='Simular falha de leitura.', funcoes=['ler'])
    item.update(mudancas)
    return item


class IdeiasFundamentadas(unittest.TestCase):
    def test_roteamento_sugestoes_nao_autoedicao(self):
        fn = carregar(*NOMES)['_pedido_ideias_do_agente']
        for texto in ['ideias para o agente', 'me de 50 ideias que vc queria ter dentro de vc?',
                      'sua opinião sobre seu código', 'quais melhorias para o agente?',
                      'o que vc melhoraria dentro de vc?', 'o que vc queria ter dentro de vc?']:
            self.assertTrue(fn(texto), texto)
        for texto in ['me de ideias para um bolo', 'implemente as ideias no agente',
                      'adicione melhorias no agente', 'Explique RAM e armazenamento']:
            self.assertFalse(fn(texto), texto)

    def test_ast_nao_executa_e_invalida_cache(self):
        env = carregar(*NOMES)
        with tempfile.TemporaryDirectory() as pasta:
            p = Path(pasta) / 'agente.py'
            p.write_text('raise RuntimeError("nao executar")\ndef ler():\n    """Le dados."""\n    return open("dados")\n')
            with patch('ast.parse', wraps=ast.parse) as parse:
                primeiro = env['_inventario_para_ideias'](str(p))
                segundo = env['_inventario_para_ideias'](str(p))
                self.assertIs(primeiro, segundo)
                self.assertEqual(parse.call_count, 1)
                p.write_text(p.read_text() + '\ndef salvar():\n    pass\n')
                terceiro = env['_inventario_para_ideias'](str(p))
                self.assertEqual(parse.call_count, 2)
                self.assertIn('salvar', terceiro['funcoes'])
                self.assertNotEqual(primeiro['hash'], terceiro['hash'])

    def test_citacao_falsa_e_duplicata_descartadas(self):
        env = carregar(*NOMES)
        inventario = {'hash': 'teste', 'funcoes': {'ler': {'linha': 10}}}
        itens = [ideia(), ideia(), ideia(titulo='Inventada', funcoes=['nao_existe'])]
        saida = env['_formatar_ideias_verificadas'](
            json.dumps({'ideias': itens}), inventario, [{'nome': 'ler'}], 3)
        self.assertIn('validos: 1/3', saida)
        self.assertIn('ler (linha 10)', saida)
        self.assertNotIn('Inventada', saida)
        self.assertIn('auditoria integral', saida)

    def test_zero_sugestoes_oferece_roteiro_identificado(self):
        env = carregar(*NOMES)
        inv = {'hash': 'teste', 'funcoes': {'salvar_json': {'linha': 10}}}
        r = env['_formatar_ideias_verificadas']('{"ideias": [{}]}', inv, [], 3)
        self.assertIn('validos: 0/3', r)
        self.assertIn('nao gerado pela IA', r)
        self.assertIn('salvar_json (linha 10)', r)

    def test_json_invalido_nao_vira_analise(self):
        env = carregar(*NOMES)
        saida = env['_formatar_ideias_verificadas']('eu fiz tudo!', {}, [], 3)
        self.assertIn('Nao consegui estruturar', saida)
        self.assertNotIn('eu fiz tudo', saida)

    def test_fluxo_completo_uma_geracao_local_somente_leitura(self):
        with tempfile.TemporaryDirectory() as pasta:
            p = Path(pasta) / 'agente.py'
            p.write_text('def ler():\n    """Le dados."""\n    pass\n')
            original = p.read_bytes()
            gerar = Mock(return_value=json.dumps({'ideias': [ideia()]}))
            env = carregar(*NOMES, _CAMINHO_AGENTE_PY=str(p),
                           ia_local_disponivel=lambda: True, _chamar_neural=gerar)
            saida = env['_sugerir_ideias_do_codigo']('me de 1 ideias para o agente')
            self.assertIn('validos: 1/1', saida)
            self.assertEqual(p.read_bytes(), original)
            gerar.assert_called_once()
            self.assertIn('EVIDENCIAS AST', gerar.call_args.args[0][1]['content'])

    def test_motor_indisponivel_nao_usa_nuvem(self):
        gerar = Mock()
        env = carregar(*NOMES, _CAMINHO_AGENTE_PY=str(SOURCE),
                       ia_local_disponivel=lambda: False, _chamar_neural=gerar)
        self.assertIn('nao usei a nuvem', env['_sugerir_ideias_do_codigo']('ideias para o agente'))
        gerar.assert_not_called()

    def test_dispatcher_nao_cai_em_ferramentas(self):
        for nuvem in (False, True):
            sugerir = Mock(return_value='Proposta fundamentada')
            cerebro = Mock(side_effect=AssertionError('Nao executar ferramentas'))
            env = carregar('processar_atalho_rapido', '_pedido_ideias_do_agente', '_norm_pt',
                           config={'usar_ia_nuvem': nuvem},
                           _configurar_conversa_local=lambda x: False,
                           _comandos_oficina_local=lambda *_: False,
            _comandos_precisao_local=lambda _: False,
                           _menu_avancado_codigo=lambda _: False,
                           _historico_ideias_local=lambda _: False,
                           _processar_autoedicao_controlada=lambda _: False,
                           _interacao_e_feedback_local=lambda x: False,
                           _resposta_contextual_curta=lambda *args: None,
                           _sugerir_ideias_do_codigo=sugerir,
                           _processar_cerebro_local=cerebro,
                           historico_conversas=[], salvar_historico=Mock())
            with redirect_stdout(StringIO()):
                self.assertTrue(env['processar_atalho_rapido']('ideias para o agente'))
            sugerir.assert_called_once()
            cerebro.assert_not_called()

    def test_recorte_limitado(self):
        env = carregar(*NOMES)
        inv = env['_inventario_para_ideias'](str(SOURCE))
        evidencias = env['_selecionar_evidencias_ideias'](inv, 'melhorar respostas locais')
        self.assertLessEqual(len(evidencias), 8)  # r36: recorte 6 -> 8
        self.assertLess(len(json.dumps(evidencias)), 5000)


if __name__ == '__main__':
    unittest.main()
