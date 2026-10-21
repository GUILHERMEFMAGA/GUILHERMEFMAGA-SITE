import unittest
from unittest.mock import Mock
from contextlib import redirect_stdout
from io import StringIO
from test_roteamento_conversa import carregar


class PerfisLocais(unittest.TestCase):
    def test_orcamentos_e_preferencia_do_pedido(self):
        perfil = carregar('_perfil_resposta_local')['_perfil_resposta_local']
        self.assertEqual(perfil('oi', {'resposta_local': 'rapida'})[0], 220)
        self.assertEqual(perfil('oi', {})[0], 450)
        self.assertEqual(perfil('oi', {'resposta_local': 'analitica'})[0], 1000)
        self.assertEqual(perfil('explique em detalhes', {'resposta_local': 'rapida'})[0], 1000)
        self.assertEqual(perfil('resuma', {'resposta_local': 'analitica'})[0], 220)
        self.assertEqual(perfil('oi', {'resposta_local': 'invalido'})[0], 450)

    def test_humor_nao_remove_cautela(self):
        perfil = carregar('_perfil_resposta_local')['_perfil_resposta_local']
        for humor in ['desligado', 'leve', 'criativo', 'invalido']:
            instrucao = perfil('oi', {'humor_local': humor})[1]
            self.assertIn('sem piadas', instrucao)
            self.assertIn('nao capacidades ja instaladas', instrucao)

    def test_configuracao_preserva_nuvem_e_permissoes(self):
        config = {'usar_ia_nuvem': False, 'nivel_permissao': 'padrao'}
        salvar = Mock()
        env = carregar('_norm_pt', '_configurar_conversa_local', config=config,
                       salvar_json=salvar, ARQ_CONFIG='config.json')
        with redirect_stdout(StringIO()):
            self.assertTrue(env['_configurar_conversa_local']('resposta analítica'))
            self.assertTrue(env['_configurar_conversa_local']('humor criativo'))
            self.assertTrue(env['_configurar_conversa_local']('estilo da conversa'))
            self.assertFalse(env['_configurar_conversa_local']('mude tudo'))
        self.assertEqual(salvar.call_count, 2)
        self.assertFalse(config['usar_ia_nuvem'])
        self.assertEqual(config['nivel_permissao'], 'padrao')
        self.assertEqual(config['humor_local'], 'criativo')


if __name__ == '__main__':
    unittest.main()
