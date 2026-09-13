"""r21: confiabilidade das respostas locais. AST isolado; sem GGUF, rede real ou Windows.

Nota: carregar() extrai toda funcao _r20_/_r21_ do fonte; mocks de funcoes com
esse prefixo devem ser injetados DEPOIS do carregar, senao a definicao real os
sobrescreve."""
import contextlib
import io
import json
import urllib.error
import unittest
from unittest.mock import Mock, patch
from test_roteamento_conversa import carregar


def redirect_nada():
    return contextlib.redirect_stdout(io.StringIO())


def resposta_ok():
    r = Mock(); r.__enter__ = Mock(return_value=r); r.__exit__ = Mock(return_value=False)
    r.read.return_value = json.dumps(
        {'choices': [{'message': {'content': 'ok'}, 'finish_reason': 'stop'}], 'usage': {}}).encode()
    return r


class SugestaoDigitacao(unittest.TestCase):
    def ambiente(self, resposta_input='nao'):
        env = carregar('_norm_pt', '_r20_catalogo_comandos', '_r21_comandos_conhecidos',
                       '_r21_sugerir_comando_proximo',
                       input=Mock(return_value=resposta_input),
                       _processar_cerebro_local=Mock(return_value=False),
                       _comandos_oficina_local=Mock(return_value=False),
                       _comandos_precisao_local=Mock(return_value=False))
        # prefixo _r20_/_r21_: injecao precisa ser pos-carregar
        env['_r20_comandos'] = Mock(return_value=False)
        env['_r21_comandos'] = Mock(return_value=False)
        return env

    def test_comando_exato_nao_gera_sugestao(self):
        env = self.ambiente()
        with redirect_nada():
            self.assertFalse(env['_r21_sugerir_comando_proximo']('status ia'))
        env['input'].assert_not_called()

    def test_typo_sugere_e_despacha_candidato_apos_sim(self):
        env = self.ambiente(resposta_input='sim')
        with redirect_nada():
            self.assertTrue(env['_r21_sugerir_comando_proximo']('sttus ia'))
        env['_r20_comandos'].assert_called_once_with('status ia')

    def test_recusa_consome_sem_despachar_nem_enviar_ao_modelo(self):
        env = self.ambiente(resposta_input='nao')
        with redirect_nada():
            self.assertTrue(env['_r21_sugerir_comando_proximo']('sttus ia'))
        env['_r20_comandos'].assert_not_called()
        env['_processar_cerebro_local'].assert_not_called()

    def test_sem_candidato_payload_ou_curto_nao_sugere(self):
        env = self.ambiente()
        with redirect_nada():
            self.assertFalse(env['_r21_sugerir_comando_proximo']('fmz'))
            self.assertFalse(env['_r21_sugerir_comando_proximo']('oi'))
            self.assertFalse(env['_r21_sugerir_comando_proximo']('configurar ia local: {"x":1}'))
        env['input'].assert_not_called()


class Colapso(unittest.TestCase):
    def setUp(self):
        self.fn = carregar('_r21_detectar_colapso')['_r21_detectar_colapso']

    def test_texto_normal_nao_e_colapso(self):
        texto = ('A RAM guarda dados temporarios enquanto o computador esta ligado. '
                 'O armazenamento SSD preserva arquivos mesmo sem energia e o cache '
                 'acelera leituras repetidas com capacidade limitada por hardware.')
        self.assertEqual(self.fn(texto), (False, ''))

    def test_lista_numerada_legitima_nao_e_colapso(self):
        texto = '\n'.join(f'{i}. Ideia {i}' for i in range(1, 51))
        self.assertEqual(self.fn(texto), (False, ''))

    def test_loop_repetido_detectado(self):
        ok, detalhe = self.fn('desculpe nao entendi sua pergunta amigao ' * 6)
        self.assertTrue(ok)
        self.assertTrue(detalhe)

    def test_linha_repetida_detectada(self):
        texto = '\n'.join(['linha identica de teste para colapso aqui'] * 4)
        ok, detalhe = self.fn(texto)
        self.assertTrue(ok)
        self.assertIn('4 vezes', detalhe)

    def test_curto_ignorado(self):
        self.assertEqual(self.fn('repetido repetido repetido'), (False, ''))


class Cancelamento(unittest.TestCase):
    def test_parar_sem_geracao_e_honesto(self):
        env = carregar('_r21_parar_geracao')
        with redirect_nada():
            mensagem = env['_r21_parar_geracao']()
        self.assertIn('Nenhuma geracao local em andamento', mensagem)

    def test_parar_com_geracao_em_andamento_pedindo_cancelamento(self):
        env = carregar('_r21_parar_geracao')
        env['_r20_lock']('geracao').acquire()
        try:
            ativa = Mock()
            env['_r21_ativa'] = ativa
            with redirect_nada():
                mensagem = env['_r21_parar_geracao']()
            self.assertIn('Cancelamento pedido', mensagem)
            self.assertEqual(env['_r21_cancelar_id'], 0)
            ativa.close.assert_called_once()
        finally:
            env['_r20_lock']('geracao').release()

    def test_transporte_cancelado_antes_de_enviar_nao_abre_conexao(self):
        env = carregar('_r20_transporte', _url_ia_local='http://127.0.0.1:1')
        env['_r21_cancelar_id'] = 7
        with patch('urllib.request.urlopen') as abrir, self.assertRaises(RuntimeError):
            env['_r20_transporte']([], 10, .2, 45, id_geracao=7)
        abrir.assert_not_called()

    def test_chamar_neural_marca_estado_cancelada_sem_repetir(self):
        env = carregar('_chamar_neural')
        env['_r20_transporte'] = Mock(side_effect=RuntimeError('Geracao cancelada a pedido.'))
        env['_r21_cancelar_id'] = 1
        with self.assertRaises(RuntimeError):
            env['_chamar_neural']([])
        self.assertEqual(env['_r20_estado']()['estado'], 'cancelada')
        env['_r20_transporte'].assert_called_once()

    def test_timeout_continua_falhou_para_nao_mascarar_erro(self):
        env = carregar('_chamar_neural')
        env['_r20_transporte'] = Mock(side_effect=TimeoutError())
        with self.assertRaises(TimeoutError):
            env['_chamar_neural']([])
        self.assertEqual(env['_r20_estado']()['estado'], 'falhou')


class FormatoJson(unittest.TestCase):
    def test_envia_response_format_e_faz_fallback_controlado_em_4xx(self):
        env = carregar('_r20_transporte', _url_ia_local='http://127.0.0.1:1')
        with patch('urllib.request.urlopen', side_effect=[
                urllib.error.HTTPError('u', 400, 'bad', {}, io.BytesIO(b'')), resposta_ok()]) as abrir:
            texto, meta = env['_r20_transporte']([], 10, .2, 45, formato_json=True)
        self.assertEqual(texto, 'ok')
        self.assertFalse(env['_r21_suporte_json'])
        self.assertIn('rejeitado', meta['formato_json'])
        corpo = json.loads(abrir.call_args_list[0].args[0].data)
        self.assertEqual(corpo['response_format'], {'type': 'json_object'})

    def test_suporte_negado_para_de_enviar_o_campo(self):
        env = carregar('_r20_transporte', _url_ia_local='http://127.0.0.1:1')
        env['_r21_suporte_json'] = False
        with patch('urllib.request.urlopen', side_effect=[resposta_ok()]) as abrir:
            env['_r20_transporte']([], 10, .2, 45, formato_json=True)
        corpo = json.loads(abrir.call_args_list[0].args[0].data)
        self.assertNotIn('response_format', corpo)

    def test_erro_5xx_nao_gera_fallback_nem_mascara(self):
        env = carregar('_r20_transporte', _url_ia_local='http://127.0.0.1:1')
        with patch('urllib.request.urlopen', side_effect=[
                urllib.error.HTTPError('u', 500, 'ops', {}, io.BytesIO(b''))]):
            with self.assertRaises(urllib.error.HTTPError):
                env['_r20_transporte']([], 10, .2, 45, formato_json=True)
        self.assertTrue(env.get('_r21_suporte_json', True))

    def test_penalidade_padrao_1_05_e_limitada_a_2(self):
        env = carregar('_r20_transporte', _url_ia_local='http://127.0.0.1:1')
        with patch('urllib.request.urlopen', side_effect=[resposta_ok()]) as abrir:
            env['_r20_transporte']([], 10, .2, 45)
        self.assertEqual(json.loads(abrir.call_args_list[0].args[0].data)['repeat_penalty'], 1.05)
        with patch('urllib.request.urlopen', side_effect=[resposta_ok()]) as abrir2:
            env['_r20_transporte']([], 10, .2, 45, repeat_penalty=9)
        self.assertEqual(json.loads(abrir2.call_args_list[0].args[0].data)['repeat_penalty'], 2.0)


class RefazerComPenalidade(unittest.TestCase):
    def refazer_env(self, **extras):
        base = dict(ia_local_disponivel=lambda: True,
                    perguntar_ia_local=Mock(return_value='nova resposta'),
                    historico_conversas=[], salvar_historico=Mock())
        base.update(extras)
        return carregar('_r21_refazer_com_penalidade', **base)

    def test_sem_registro_nao_refaz_nada(self):
        env = self.refazer_env()
        with redirect_nada():
            self.assertIn('Nao ha geracao com colapso', env['_r21_refazer_com_penalidade']())
        env['perguntar_ia_local'].assert_not_called()

    def test_refaz_uma_vez_com_penalidade_e_registra_historico(self):
        env = self.refazer_env(**{'_r21_ultimo_colapso': {'pergunta': 'liste 5 ideias'}})
        with redirect_nada():
            self.assertEqual(env['_r21_refazer_com_penalidade'](), 'nova resposta')
        self.assertGreaterEqual(env['perguntar_ia_local'].call_args.kwargs['penalidade_extra'], 0.1)
        self.assertEqual(len(env['historico_conversas']), 2)
        self.assertIsNone(env['_r21_ultimo_colapso'])

    def test_motor_indisponivel_nao_refaz(self):
        env = self.refazer_env(ia_local_disponivel=lambda: False,
                               **{'_r21_ultimo_colapso': {'pergunta': 'x'}})
        with redirect_nada():
            self.assertIn('indisponivel', env['_r21_refazer_com_penalidade']())
        env['perguntar_ia_local'].assert_not_called()


class ComandosR21(unittest.TestCase):
    def test_rota_parar_geracao_local_usa_implementacao_real(self):
        env = carregar('_norm_pt', '_r21_comandos')
        with redirect_nada() as saida:
            self.assertTrue(env['_r21_comandos']('parar geracao local'))
        self.assertIn('Nenhuma geracao local em andamento', saida.getvalue())

    def test_rota_refazer_sem_registro_e_honesta_e_desconhecido_passa(self):
        env = carregar('_norm_pt', '_r21_comandos')
        with redirect_nada() as saida:
            self.assertTrue(env['_r21_comandos']('refazer com penalidade'))
        self.assertIn('Nao ha geracao com colapso', saida.getvalue())
        self.assertFalse(env['_r21_comandos']('qualquer coisa'))

    def test_conversa_local_avisa_colapso_e_guarda_registro_sem_alterar_texto(self):
        bruto = 'desculpe nao entendi sua pergunta amigao ' * 6
        env = carregar('_anexar_referencias_revisadas', '_referencias_revisadas_local',
                       '_remover_itens_repetidos_local', '_correcoes_relevantes_local',
                       '_perfil_resposta_local', '_quantidade_lista_local',
                       '_contar_itens_lista_local', '_montar_contexto_local',
                       'perguntar_ia_local',
                       _sys_ia_local=lambda: 'Sistema', config={},
                       _chamar_neural=Mock(return_value=bruto))
        with redirect_nada():
            resposta = env['perguntar_ia_local']('o que fazer hoje')
        self.assertIn('[Aviso de saude da geracao]', resposta)
        self.assertTrue(resposta.startswith(bruto.strip()))
        self.assertEqual(env['_r21_ultimo_colapso']['pergunta'], 'o que fazer hoje')

    def test_conversa_normal_nao_recebe_aviso(self):
        env = carregar('_anexar_referencias_revisadas', '_referencias_revisadas_local',
                       '_remover_itens_repetidos_local', '_correcoes_relevantes_local',
                       '_perfil_resposta_local', '_quantidade_lista_local',
                       '_contar_itens_lista_local', '_montar_contexto_local',
                       'perguntar_ia_local',
                       _sys_ia_local=lambda: 'Sistema', config={},
                       _chamar_neural=Mock(return_value='Resposta curta e direta.'))
        with redirect_nada():
            resposta = env['perguntar_ia_local']('oi, tudo bem')
        self.assertNotIn('[Aviso de saude', resposta)
        self.assertIsNone(env.get('_r21_ultimo_colapso'))


if __name__ == '__main__':
    unittest.main()
