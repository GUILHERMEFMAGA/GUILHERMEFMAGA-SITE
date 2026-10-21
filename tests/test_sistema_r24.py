"""r24: aprimoramentos internos de velocidade. AST isolado; sem rede nem GGUF."""
import unittest
from unittest.mock import Mock
from test_roteamento_conversa import carregar


class MemoNormPt(unittest.TestCase):
    def test_resultado_identico_e_cache_transparente(self):
        env = carregar('_norm_pt')
        primeira = env['_norm_pt']('Olá, Mundo! 123')
        segunda = env['_norm_pt']('Olá, Mundo! 123')
        self.assertEqual(primeira, 'olamundo123')
        self.assertEqual(primeira, segunda)
        self.assertEqual(env['_norm_pt'](''), '')
        self.assertIn('_NORM_PT_CACHE', env)


class CacheRespostasLocais(unittest.TestCase):
    def ambiente(self, config=None):
        return carregar('_anexar_referencias_revisadas', '_referencias_revisadas_local',
                        '_remover_itens_repetidos_local', '_correcoes_relevantes_local',
                        '_perfil_resposta_local', '_quantidade_lista_local',
                        '_contar_itens_lista_local', '_montar_contexto_local',
                        'perguntar_ia_local', '_r20_opcoes',
                        _sys_ia_local=lambda: 'Sistema', config=config if config is not None else {},
                        _chamar_neural=Mock(return_value='Resposta gerada.'))

    def test_mesma_pergunta_sem_historico_vem_do_cache_rotulada(self):
        env = self.ambiente()
        gerar = env['_chamar_neural']
        with redirect_nada():
            primeira = env['perguntar_ia_local']('o que e RAM')
            segunda = env['perguntar_ia_local']('o que e RAM')
        self.assertEqual(primeira, 'Resposta gerada.')
        self.assertEqual(segunda, '[Cache local] Resposta gerada.')
        gerar.assert_called_once()

    def test_pergunta_diferente_gera_de_novo(self):
        env = self.ambiente()
        with redirect_nada():
            env['perguntar_ia_local']('o que e RAM')
            env['perguntar_ia_local']('o que e CPU')
        self.assertEqual(env['_chamar_neural'].call_count, 2)

    def test_com_historico_nao_usa_cache(self):
        env = self.ambiente()
        historico = [{'role': 'user', 'content': 'oi'}]
        with redirect_nada():
            env['perguntar_ia_local']('continue', historico)
            env['perguntar_ia_local']('continue', historico)
        self.assertEqual(env['_chamar_neural'].call_count, 2)

    def test_cache_minutos_zero_desliga(self):
        env = self.ambiente({'ia_local_opcoes': {'cache_minutos': 0}})
        with redirect_nada():
            env['perguntar_ia_local']('o que e RAM')
            env['perguntar_ia_local']('o que e RAM')
        self.assertEqual(env['_chamar_neural'].call_count, 2)

    def test_refazer_com_penalidade_nao_pega_cache(self):
        env = self.ambiente()
        with redirect_nada():
            env['perguntar_ia_local']('o que e RAM')
            resposta = env['perguntar_ia_local']('o que e RAM', penalidade_extra=0.15)
        self.assertEqual(resposta, 'Resposta gerada.')
        self.assertEqual(env['_chamar_neural'].call_count, 2)

    def test_mudanca_de_perfil_invalidez_cache(self):
        env = self.ambiente()
        with redirect_nada():
            env['perguntar_ia_local']('o que e RAM')
            env['config']['resposta_local'] = 'analitica'
            env['perguntar_ia_local']('o que e RAM')
        self.assertEqual(env['_chamar_neural'].call_count, 2)


import contextlib
import io


def redirect_nada():
    return contextlib.redirect_stdout(io.StringIO())


class Velocidade(unittest.TestCase):
    def test_resumo_sem_geracoes_e_honesto(self):
        env = carregar('_r24_resumo_velocidade')
        self.assertEqual(env['_r24_resumo_velocidade']()['geracoes_registradas'], 0)

    def test_resumo_com_tempos_injetados(self):
        env = carregar('_r24_resumo_velocidade')
        env['_r24_tempos'] = [{'segundos': 2.0, 'tokens': 40}, {'segundos': 3.0, 'tokens': 60}]
        r = env['_r24_resumo_velocidade']()
        self.assertEqual(r['geracoes_registradas'], 2)
        self.assertEqual(r['media_ultimos10_segundos'], 2.5)
        self.assertEqual(r['tokens_por_segundo_ultimo'], 20.0)
        self.assertEqual(r['ultimo_segundos'], 3.0)

    def test_comando_velocidade_consome_e_explica(self):
        env = carregar('_norm_pt', '_r24_comandos', '_r20_opcoes', config={})
        with redirect_nada() as saida:
            self.assertTrue(env['_r24_comandos']('velocidade ia local'))
        self.assertIn('Cache de respostas locais', saida.getvalue())
        self.assertIn('Dicas honestas', saida.getvalue())
        with redirect_nada():
            self.assertFalse(env['_r24_comandos']('outra coisa'))

    def test_tempos_registrados_somente_em_sucesso(self):
        env = carregar('_chamar_neural')
        env['_r20_transporte'] = Mock(return_value=('oi', {'finish_reason': 'stop', 'segundos': 1.25,
                                                           'usage': {'completion_tokens': 15}}))
        with redirect_nada():
            env['_chamar_neural']([])
        self.assertEqual(len(env['_r24_tempos']), 1)
        self.assertEqual(env['_r24_tempos'][0]['tokens'], 15)
        env['_r20_transporte'] = Mock(side_effect=TimeoutError())
        with self.assertRaises(TimeoutError), redirect_nada():
            env['_chamar_neural']([])
        self.assertEqual(len(env['_r24_tempos']), 1)

    def test_limites_da_opcao_cache(self):
        env = carregar('_r20_opcoes', config={'ia_local_opcoes': {'cache_minutos': 999}})
        self.assertEqual(env['_r20_opcoes']()['cache_minutos'], 120)
        env2 = carregar('_r20_opcoes', config={'ia_local_opcoes': {'cache_minutos': -3}})
        self.assertEqual(env2['_r20_opcoes']()['cache_minutos'], 0)


if __name__ == '__main__':
    unittest.main()
