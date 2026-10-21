import re
import unittest
from unittest.mock import Mock
from contextlib import redirect_stdout
from io import StringIO
from test_roteamento_conversa import carregar


class FeedbackPlanejamento(unittest.TestCase):
    def ambiente(self, config=None, historico=None, resposta='nao'):
        return carregar('_norm_pt', '_plano_foco_local', '_interacao_e_feedback_local',
                        '_correcoes_relevantes_local', config=config if config is not None else {},
                        historico_conversas=historico or [], ARQ_CONFIG='config.json',
                        salvar_json=Mock(), input=Mock(return_value=resposta),
                        _configurar_conversa_local=Mock(return_value=True))

    def test_plano_soma_tempo_sem_executar(self):
        fn = self.ambiente()['_plano_foco_local']
        r = fn('plano de foco 60: estudar; revisar; praticar')
        blocos = re.findall(r'(?m)^(\d+)-(\d+) min:', r)
        self.assertEqual(sum(int(b)-int(a) for a,b in blocos), 60)
        self.assertEqual(int(blocos[-1][1]), 60)
        self.assertIn('nao iniciei', r)
        self.assertIn('pausa', r)
        self.assertIn('Use de 5', fn('plano de foco 4: tarefa'))

    def test_correcao_vinculada_e_contexto_seletivo(self):
        config = {'nivel_permissao': 'padrao'}
        env = self.ambiente(config, [{'role': 'user', 'content': 'Explique memoria RAM'},
                                    {'role': 'assistant', 'content': 'Resposta incorreta'}])
        with redirect_stdout(StringIO()):
            env['_interacao_e_feedback_local']('corrija sua resposta: RAM nao e cache do processador')
        self.assertEqual(config['nivel_permissao'], 'padrao')
        env['salvar_json'].assert_called_once()
        self.assertIn('RAM nao e cache', env['_correcoes_relevantes_local']('memoria RAM', config))
        self.assertEqual(env['_correcoes_relevantes_local']('pizza italiana', config), '')

    def test_sem_historico_nao_inventa_vinculo(self):
        env = self.ambiente()
        with redirect_stdout(StringIO()):
            self.assertTrue(env['_interacao_e_feedback_local']('corrija sua resposta: algum texto'))
        env['salvar_json'].assert_not_called()

    def test_limpeza_exige_confirmacao_e_preserva_outros_dados(self):
        for resposta in ['nao', 'sim']:
            config = {'correcoes_conversa': [{'pergunta': 'RAM', 'correcao': 'temporaria'}], 'usar_ia_nuvem': False}
            env = self.ambiente(config=config, resposta=resposta)
            with redirect_stdout(StringIO()):
                env['_interacao_e_feedback_local']('apagar correcoes da conversa')
            self.assertEqual(bool(config['correcoes_conversa']), resposta == 'nao')
            self.assertFalse(config['usar_ia_nuvem'])

    def test_alias_reutiliza_perfil_existente(self):
        env = self.ambiente()
        env['_interacao_e_feedback_local']('responda mais curto')
        env['_configurar_conversa_local'].assert_called_once_with('resposta rapida')


if __name__ == '__main__':
    unittest.main()
