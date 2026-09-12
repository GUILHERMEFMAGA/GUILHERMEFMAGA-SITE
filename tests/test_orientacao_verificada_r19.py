"""Regressao do relato real: protecao da conversa nao mascara avaliacao bruta."""
import io
import tempfile
import unittest
from contextlib import redirect_stdout
from unittest.mock import Mock
from test_roteamento_conversa import carregar
from test_precisao_local_r17 import ambiente as ambiente_avaliacao


class OrientacaoVerificada(unittest.TestCase):
    def ambiente(self, nuvem=False):
        return carregar('_norm_pt', '_resposta_contextual_curta', '_r50_comandos', 'processar_atalho_rapido',
                        config={'usar_ia_nuvem':nuvem, 'nivel_permissao':'admin'},
                        historico_conversas=[], salvar_historico=Mock(),
                        preparar_ia_local=Mock(), _chamar_neural=Mock(),
                        _invocar_local=Mock(), _processar_cerebro_local=Mock())

    def test_pergunta_real_responde_sem_inferencia_ou_execucao(self):
        env = self.ambiente()
        pergunta = 'Encerrei a IA local com desligar ia local. Como ligo o motor novamente?'
        antes = dict(env['config'])
        with redirect_stdout(io.StringIO()) as saida:
            self.assertTrue(env['processar_atalho_rapido'](pergunta))
        r = saida.getvalue()
        self.assertIn('sem geracao do modelo', r)
        self.assertIn('digite: criar ia', r)
        self.assertIn('status ia', r)
        self.assertIn('nao executei nenhuma acao', r)
        self.assertNotIn('from create_ia', r)
        for nome in ('preparar_ia_local', '_chamar_neural', '_invocar_local', '_processar_cerebro_local'):
            env[nome].assert_not_called()
        self.assertEqual(env['config'], antes)
        self.assertEqual(env['historico_conversas'][0]['content'], pergunta)
        self.assertEqual(len(env['historico_conversas']), 2)
        env['salvar_historico'].assert_called_once()

    def test_variantes_reconhecidas(self):
        env = self.ambiente(); fn = env['_resposta_contextual_curta']
        for p in ['Como ligar a IA local?', 'Como faço para reiniciar o motor local?',
                  'Como reativo a IA local de novo?',
                  'Qual é o comando para iniciar a IA local?',
                  'Desliguei a IA local. Como inicio o motor novamente?']:
            with self.subTest(p=p):
                self.assertIn('digite: criar ia', fn(p, env['config']))

    def test_comandos_documentados_distinguem_nuvem_motor(self):
        env = self.ambiente(); fn = env['_resposta_contextual_curta']
        for comando, esperado in [('ligar ia', 'habilita a nuvem'),
                                  ('desligar ia', 'nao encerra o motor local'),
                                  ('desligar ia local', 'encerra o motor local'),
                                  ('criar ia', 'prepara/inicia o motor local'),
                                  ('status ia', 'consulta a disponibilidade')]:
            r = fn('O que faz o comando ' + comando + '?', env['config'])
            self.assertIn(esperado, r)
            self.assertIn('nao executei nenhuma acao', r)

    def test_memoria_relatada_nao_vai_ao_modelo(self):
        env = self.ambiente()
        with redirect_stdout(io.StringIO()) as out:
            self.assertTrue(env['processar_atalho_rapido'](
                'Explique a diferenca entre RAM, cache da CPU e armazenamento.'))
        r = out.getvalue()
        self.assertIn('perde os dados sem energia', r)
        self.assertIn('Solid State Drive', r)
        self.assertIn('Nao e sinonimo de cache', r)
        self.assertIn('nao consultei', r)
        env['_chamar_neural'].assert_not_called()

    def test_nao_sequestra_acoes_perguntas_compostas_ou_outros_assuntos(self):
        env = self.ambiente(); fn = env['_resposta_contextual_curta']
        for p in ['criar ia', 'ligar ia', 'desligar ia', 'desligar ia local', 'status ia',
                  'Como reiniciar o Windows com a IA local?',
                  'Explique RAM e depois crie um programa Python',
                  'Quanto de RAM meu PC tem?', 'Como criar uma IA local do zero?',
                  'IA local não abre, recebi erro de arquivo ausente',
                  'O que faz o comando ligar ia e como configurar minha rede?']:
            with self.subTest(p=p):
                self.assertIsNone(fn(p, env['config']))

    def test_nuvem_nao_recebe_nova_interceptacao(self):
        env = self.ambiente(True)
        for p in ['Como ligar a IA local?', 'RAM é cache?',
                  'Explique a diferenca entre RAM, cache da CPU e armazenamento.']:
            self.assertIsNone(env['_resposta_contextual_curta'](p, env['config']))

    def test_rotas_reais_confirmam_semantica_da_orientacao(self):
        proc = Mock()
        env = carregar('_norm_pt', '_processar_cerebro_local',
                       config={'usar_ia_nuvem':False}, _ULTIMO_COMANDO={},
                       ARQ_CONFIG='nao_gravar.json', salvar_json=Mock(),
                       preparar_ia_local=Mock(), ia_local_disponivel=lambda: False,
                       _proc_ia_local=proc)
        with redirect_stdout(io.StringIO()) as out:
            env['_processar_cerebro_local']('criar ia')
            env['_processar_cerebro_local']('ligar ia')
            self.assertTrue(env['config']['usar_ia_nuvem'])
            env['_processar_cerebro_local']('desligar ia local')
            self.assertTrue(env['config']['usar_ia_nuvem'])
            env['_processar_cerebro_local']('desligar ia')
            self.assertFalse(env['config']['usar_ia_nuvem'])
            env['_processar_cerebro_local']('status ia')
        env['preparar_ia_local'].assert_called_once()
        proc.terminate.assert_called_once()
        self.assertIn('indisponivel agora', out.getvalue())
        self.assertNotIn('ainda nao instalada', out.getvalue())

    def test_avaliacao_preserva_erro_bruto_e_quatro_chamadas(self):
        with tempfile.TemporaryDirectory() as pasta:
            erro_modelo = 'RESPOSTA INCORRETA: from create_ia import CreateIA'
            gerar = Mock(return_value=erro_modelo)
            env = ambiente_avaliacao(pasta, gerar)
            with redirect_stdout(io.StringIO()):
                r = env['_executar_avaliacao_precisao_local']()
            self.assertEqual(gerar.call_count, 4)
            self.assertEqual(r.count(erro_modelo), 4)
            self.assertIn('Respostas BRUTAS do GGUF', r)
            self.assertNotIn('digite: criar ia', r)
            self.assertIn('nao os execute sem verificar', r)


if __name__ == '__main__':
    unittest.main()
