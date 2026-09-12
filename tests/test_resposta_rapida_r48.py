"""r48: resposta da IA LOCAL mais rapida — streaming LIGADO por padrao (a
resposta aparece sendo escrita em vez de chegar pronta no fim) e threads
automaticas pelo CPU (o fixo 4 desperdicava nucleos no processamento do
prompt). Config explicita do usuario continua vencendo. Sem rede, sem GGUF."""
import io
import unittest
from contextlib import redirect_stdout

from test_roteamento_conversa import carregar


def capturar(funcao, *args, **kwargs):
    tampao = io.StringIO()
    with redirect_stdout(tampao):
        r = funcao(*args, **kwargs)
    return r, tampao.getvalue()


class NovosPadroes(unittest.TestCase):
    def test_streaming_ligado_por_padrao(self):
        env = carregar('_r20_opcoes')
        self.assertTrue(env['_r20_opcoes']()['streaming'])

    def test_threads_automaticas_dentro_da_faixa_segura(self):
        import os
        env = carregar('_r20_opcoes')
        t = env['_r20_opcoes']()['threads']
        self.assertGreaterEqual(t, 1)
        self.assertLessEqual(t, os.cpu_count() or 1)
        nucleos = os.cpu_count() or 4
        esperado = min(max(4, min(nucleos - 2, 8)), nucleos)
        self.assertEqual(t, esperado)

    def test_config_explicita_vence_os_novos_padroes(self):
        env = carregar('_r20_opcoes',
                       config={'ia_local_opcoes': {'streaming': False, 'threads': 2}})
        opcoes = env['_r20_opcoes']()
        self.assertFalse(opcoes['streaming'])
        self.assertEqual(opcoes['threads'], 2)

    def test_tipo_errado_na_config_e_ignorado(self):
        env = carregar('_r20_opcoes',
                       config={'ia_local_opcoes': {'streaming': 'sim', 'threads': 'muitos'}})
        opcoes = env['_r20_opcoes']()
        self.assertIs(opcoes['streaming'], True)  # volta ao padrao novo
        import os
        self.assertEqual(opcoes['threads'],
                         min(max(4, min((os.cpu_count() or 4) - 2, 8)), os.cpu_count() or 1))


class PerguntarUsaStreaming(unittest.TestCase):
    def _perguntar(self, opcoes=None):
        capturado = {}

        def fake_neural(msgs, max_tokens=350, temperatura=0.5, timeout_segundos=120,
                        stream=False, callback=None, seed=None, repeat_penalty=None,
                        formato_json=False):
            capturado['stream'] = stream
            capturado['callback'] = callback
            if callback:
                callback('trecho ao vivo ')
            return 'resposta final verificada'

        env = carregar('perguntar_ia_local', '_norm_pt', '_r20_opcoes',
                       _montar_contexto_local=lambda p, h: [{'role': 'system', 'content': 'base'}],
                       _quantidade_lista_local=lambda p: 0,
                       _perfil_resposta_local=lambda p, c: (350, ''),
                       buscar_memorias_relevantes=lambda p, l=3: [],
                       _chamar_neural=fake_neural,
                       config={'ia_local_opcoes': dict(opcoes or {})})
        _, saida = capturar(env['perguntar_ia_local'], 'me conte algo legal')
        return capturado, saida

    def test_streaming_ligado_e_callback_escreve(self):
        capturado, saida = self._perguntar()
        self.assertTrue(capturado['stream'])
        self.assertTrue(callable(capturado['callback']))
        self.assertIn('[Previa da geracao', saida)
        self.assertIn('trecho ao vivo', saida)
        self.assertIn('[Fim da previa', saida)

    def test_usuario_pode_desligar_streaming(self):
        capturado, saida = self._perguntar({'streaming': False})
        self.assertFalse(capturado['stream'])
        self.assertIsNone(capturado['callback'])
        self.assertNotIn('[Previa da geracao', saida)


class GuardasR48(unittest.TestCase):
    def test_selo_r58_no_banner(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        self.assertIn('[Motor e avaliacao local 2026-09-11-r58]', texto)
        self.assertNotIn('2026-09-11-r47]', texto)


if __name__ == '__main__':
    unittest.main()
