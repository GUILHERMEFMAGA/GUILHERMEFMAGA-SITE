import unittest
from unittest.mock import Mock, patch
from contextlib import redirect_stdout
from io import StringIO
from test_roteamento_conversa import carregar

SITES = {'youtube': 'https://youtube.com', 'google': 'https://google.com',
         'github': 'https://github.com'}


class CorrecaoSites(unittest.TestCase):
    def ambiente(self, **extras):
        return carregar('_norm_pt', '_sugerir_site_por_nome', '_confirmar_site_sugerido',
                        _SITES_LOCAIS=SITES, **extras)

    def test_yotube_e_outros_erros(self):
        fn = self.ambiente()['_sugerir_site_por_nome']
        for texto in ['yotube', 'Yotube', 'youtub', 'youtuve']:
            self.assertEqual(fn(texto, SITES), ('youtube', 'https://youtube.com'))

    def test_nao_adivinha_caminhos_urls_ou_texto_ambiguo(self):
        fn = self.ambiente()['_sugerir_site_por_nome']
        for texto in ['C:\\youtube', 'https://yotube.com', 'yotube.com',
                      'yt', 'apagar tudo', 'programa desconhecido', 'youtube;cmd']:
            self.assertIsNone(fn(texto, SITES), texto)
        self.assertIsNone(fn('yotube', {'youtube': 'https://a', 'yotubee': 'https://b'}))

    def test_aceitacao_e_recusa(self):
        for resposta in ['sim', 'nao', '', 'abre outro', 's']:
            env = self.ambiente(input=Mock(return_value=resposta))
            with patch('webbrowser.open', return_value=True) as abrir, redirect_stdout(StringIO()):
                self.assertTrue(env['_confirmar_site_sugerido']('yotube'))
            if resposta in ('sim', 's'):
                abrir.assert_called_once_with('https://youtube.com')
            else:
                abrir.assert_not_called()

    def test_frase_completa_no_roteador(self):
        env = carregar('_norm_pt', '_eh_pergunta_de_conversa', '_pedido_explicativo',
                       '_processar_cerebro_local', '_sugerir_site_por_nome',
                       '_confirmar_site_sugerido', _SITES_LOCAIS=SITES,
                       config={}, _ULTIMO_COMANDO={}, historico_conversas=[],
                       _interpretar_ajuste_pc=lambda texto: None, ATALHOS_PROGRAMAS={},
                       _abrir_app_ou_site=Mock(return_value='NAO_ACHADO'),
                       input=Mock(return_value='sim'))
        with patch('webbrowser.open', return_value=True) as abrir, redirect_stdout(StringIO()):
            self.assertTrue(env['_processar_cerebro_local']('abre o yotube'))
        abrir.assert_called_once_with('https://youtube.com')
        env['_abrir_app_ou_site'].assert_called_once_with('yotube')


if __name__ == '__main__':
    unittest.main()
