"""r25: camada que beneficia TODAS as ferramentas (telemetria, executor universal,
diagnostico). AST isolado; sem rede, sem GGUF, sem acoes reais."""
import types
import unittest
from unittest.mock import Mock
from test_roteamento_conversa import carregar


def fake_tool(nome, descricao='descricao de teste'):
    return types.SimpleNamespace(name=nome, description=descricao)


def base_env(**extras):
    base = dict(tools=[fake_tool('status_defender'), fake_tool('espaco_recuperavel'),
                       fake_tool('formatar_unidade')],
                _r20_origem=Mock(),
                salvar_json=lambda c, d: None, ARQ_CONFIG='x.json', config={})
    base.update(extras)
    return carregar('_norm_pt', '_invocar_local', '_r25_registrar_uso',
                    '_r25_sugerir_ferramenta', '_r25_achar_funcao',
                    '_r25_usar_ferramenta', '_r25_comandos', **base)


import io
import contextlib


def redirect_nada():
    return contextlib.redirect_stdout(io.StringIO())


class TelemetriaUniversal(unittest.TestCase):
    def test_sucesso_erro_e_indisponivel_registrados(self):
        env = base_env(hora=Mock())
        env['ferramenta_ok'] = lambda **kw: 'feito'
        def ferramenta_ruim(**kw):
            raise ValueError('boom')
        env['ferramenta_ruim'] = ferramenta_ruim
        with redirect_nada():
            self.assertEqual(env['_invocar_local']('ferramenta_ok'), 'feito')
            r = env['_invocar_local']('ferramenta_ruim')
            self.assertIn('falha em', r)
            r2 = env['_invocar_local']('ferramenta_inexistente')
        self.assertIn('indisponivel', r2)  # nome distante demais: sem sugestao
        r3 = env['_invocar_local']('status_defendr')  # typo proximo: sugere o real
        self.assertIn('status_defender', r3)
        self.assertIn('Ferramentas com nome parecido', r3)
        uso = env['_r25_uso_ferramentas']
        self.assertEqual(uso['ferramenta_ok']['usos'], 1)
        self.assertEqual(uso['ferramenta_ok']['erros'], 0)
        self.assertEqual(uso['ferramenta_ruim']['erros'], 1)
        self.assertEqual(uso['ferramenta_ruim']['ultimo_erro'], 'ValueError')
        self.assertEqual(uso['ferramenta_inexistente']['ultimo_erro'], 'indisponivel')

    def test_ferramenta_com_invoke_lanca_e_contabiliza(self):
        env = base_env()
        entrada = fake_tool('espaco_recuperavel')
        entrada.invoke = Mock(side_effect=RuntimeError('x'))
        env['espaco_recuperavel'] = entrada
        with redirect_nada():
            env['_invocar_local']('espaco_recuperavel')
        self.assertEqual(env['_r25_uso_ferramentas']['espaco_recuperavel']['erros'], 1)


class ExecutorUniversal(unittest.TestCase):
    def executar(self, comando, resposta_input='sim', invocar=None):
        env = base_env(input=Mock(return_value=resposta_input))
        if invocar is not None:
            env['_invocar_local'] = invocar
        with redirect_nada() as saida:
            resultado = env['_r25_comandos'](comando)
        return resultado, saida.getvalue(), env

    def test_usar_com_json_executa_apos_sim(self):
        inv = Mock(return_value='OK DA FERRAMENTA')
        resultado, saida, _ = self.executar(
            'usar status_defender com {"acao": "status"}', 'sim', invocar=inv)
        self.assertTrue(resultado)
        self.assertIn('OK DA FERRAMENTA', saida)
        inv.assert_called_once_with('status_defender', acao='status')

    def test_usar_cancela_sem_executar(self):
        inv = Mock()
        resultado, saida, _ = self.executar(
            'usar status_defender com {"acao": "status"}', 'nao', invocar=inv)
        self.assertIn('Cancelado', saida)
        inv.assert_not_called()

    def test_usar_com_json_quebrado_ensina_formato(self):
        resultado, saida, _ = self.executar('usar status_defender com {acao: status}')
        self.assertIn('objeto JSON', saida)

    def test_usar_typo_sugere_nomes_reais(self):
        resultado, saida, _ = self.executar('usar status_defendr com {}')
        self.assertIn('Nao achei', saida)
        self.assertIn('status_defender', saida)

    def test_ajuda_ferramenta_mostra_descricao_e_como_usar(self):
        resultado, saida, _ = self.executar('ajuda ferramenta: espaco_recuperavel')
        self.assertTrue(resultado)
        self.assertIn('[espaco_recuperavel]', saida)
        self.assertIn('usar espaco_recuperavel com', saida)

    def test_estatisticas_e_diagnostico(self):
        env = base_env(**{'_r25_uso_ferramentas': {
            'status_defender': {'usos': 3, 'erros': 1, 'tempo_s': 0.3,
                                'ultimo_erro': 'TimeoutError', 'ultima_duracao_s': 0.1}}})
        with redirect_nada() as saida:
            self.assertTrue(env['_r25_comandos']('estatisticas ferramentas'))
        self.assertIn('status_defender: 3 uso(s), 1 erro(s)', saida.getvalue())
        with redirect_nada() as saida2:
            self.assertTrue(env['_r25_comandos']('diagnostico ferramentas'))
        self.assertIn('TimeoutError', saida2.getvalue())
        with redirect_nada() as saida3:
            self.assertFalse(env['_r25_comandos']('qualquer coisa aleatoria'))
        self.assertEqual(saida3.getvalue(), '')


if __name__ == '__main__':
    unittest.main()
