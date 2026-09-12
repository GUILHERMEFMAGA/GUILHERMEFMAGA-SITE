import unittest
from types import SimpleNamespace
from unittest.mock import patch, Mock
from test_roteamento_conversa import carregar


class IdentidadePermissoes(unittest.TestCase):
    def test_nivel_admin_nao_prova_elevacao(self):
        for elevado in (False, True):
            env = carregar('_garantir_tools', '_resposta_identidade', config={'nivel_permissao': 'admin'},
                           os=SimpleNamespace(name='nt'), tools=[1, 2])
            shell = SimpleNamespace(IsUserAnAdmin=Mock(return_value=elevado))
            with patch('ctypes.windll', SimpleNamespace(shell32=shell), create=True):
                r = env['_resposta_identidade']()
            self.assertIn('varias ferramentas dispensam confirmacao', r)
            self.assertEqual('NAO esta elevado' in r, not elevado)
            self.assertNotIn('Toda mudanca', r)


if __name__ == '__main__':
    unittest.main()
