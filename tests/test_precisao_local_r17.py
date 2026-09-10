import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from contextlib import redirect_stdout
from io import StringIO
from test_roteamento_conversa import carregar

NOMES = ('_norm_pt', '_referencias_revisadas_local', '_anexar_referencias_revisadas',
         '_casos_avaliacao_precisao', '_executar_avaliacao_precisao_local',
         '_mostrar_avaliacao_precisao_local', '_comandos_precisao_local')


def ambiente(pasta, gerar=None):
    def salvar(caminho, dados):
        Path(caminho).write_text(json.dumps(dados), encoding='utf-8')
    def ler(caminho, padrao):
        return json.loads(Path(caminho).read_text()) if Path(caminho).exists() else padrao
    return carregar(*NOMES, PASTA_BASE=pasta, salvar_json=salvar, carregar_json=ler,
                    ia_local_disponivel=lambda: True,
                    _chamar_neural=gerar or Mock(return_value='Resposta gerada'),
                    input=Mock(return_value='AVALIAR'))


class PrecisaoLocal(unittest.TestCase):
    def test_referencias_pertinentes_sem_substrings_enganosas(self):
        env = ambiente('')
        fn = env['_referencias_revisadas_local']
        self.assertEqual(fn('como programar em Python?'), [])
        self.assertEqual(fn('me fale de Rambo'), [])
        self.assertIn('Nao e sinonimo', fn('RAM é cache?')[0][1])
        self.assertIn('modos-agente-v1', [x[0] for x in fn('como ligar IA local?')])
        self.assertLessEqual(len(fn('RAM SSD IA local')), 2)

    def test_anexo_preserva_pergunta_e_nao_alega_dado_ao_vivo(self):
        env = ambiente('')
        pergunta = 'Explique SSD e RAM.'
        r = env['_anexar_referencias_revisadas'](pergunta)
        self.assertTrue(r.startswith(pergunta))
        self.assertIn('nao sao dados ao vivo', r)
        self.assertEqual(env['_anexar_referencias_revisadas']('oi'), 'oi')

    def test_comparacao_quatro_chamadas_sem_ferramentas_ou_historico(self):
        with tempfile.TemporaryDirectory() as pasta:
            gerar = Mock(return_value='Texto para avaliacao humana')
            env = ambiente(pasta, gerar)
            env['historico_conversas'] = [{'role':'user', 'content':'DADO_PRIVADO'}]
            with redirect_stdout(StringIO()):
                r = env['_executar_avaliacao_precisao_local']()
            self.assertEqual(gerar.call_count, 4)
            for chamada in gerar.call_args_list:
                self.assertEqual(chamada.kwargs['timeout_segundos'], 45)
                self.assertEqual(chamada.kwargs['max_tokens'], 250)
                self.assertNotIn('DADO_PRIVADO', str(chamada))
            sem = gerar.call_args_list[0].args[0][1]['content']
            com = gerar.call_args_list[1].args[0][1]['content']
            self.assertNotIn('[Referencias', sem)
            self.assertIn('[Referencias', com)
            self.assertIn('sem nota automatica', r)
            dados = json.loads((Path(pasta)/'avaliacoes_ia_local'/'ultima.json').read_text())
            self.assertEqual(len(dados['casos']), 2)
            self.assertTrue(all(v['estado']=='gerada; ainda nao julgada'
                                for c in dados['casos'] for v in c['variantes']))

    def test_falhas_nao_sao_aprovadas_como_respostas(self):
        with tempfile.TemporaryDirectory() as pasta:
            env = ambiente(pasta, Mock(side_effect=TimeoutError('NAO_EXIBIR_DETALHE')))
            with redirect_stdout(StringIO()):
                r = env['_executar_avaliacao_precisao_local']()
            self.assertIn('falha de geracao', r)
            self.assertNotIn('NAO_EXIBIR_DETALHE', r)

    def test_confirmacao_e_motor_indisponivel(self):
        with tempfile.TemporaryDirectory() as pasta:
            gerar = Mock()
            env = ambiente(pasta, gerar)
            env['input'].return_value = 'nao'
            with redirect_stdout(StringIO()):
                self.assertTrue(env['_comandos_precisao_local']('avaliar precisao local'))
            gerar.assert_not_called()
            self.assertFalse(list(Path(pasta).iterdir()))
            env['ia_local_disponivel'] = lambda: False
            self.assertIn('indisponivel', env['_executar_avaliacao_precisao_local']())
            gerar.assert_not_called()

    def test_transport_recebe_timeout_sem_alterar_modelo(self):
        env = carregar('_chamar_neural', json=json, _url_ia_local='http://127.0.0.1:8765')
        resp = Mock()
        resp.__enter__ = Mock(return_value=resp)
        resp.__exit__ = Mock(return_value=False)
        resp.read.return_value = b'{"choices":[{"message":{"content":"ok"}}]}'
        with patch('urllib.request.urlopen', return_value=resp) as abrir:
            self.assertEqual(env['_chamar_neural']([], timeout_segundos=45), 'ok')
        self.assertEqual(abrir.call_args.kwargs['timeout'], 45)
        self.assertEqual(json.loads(abrir.call_args.args[0].data)['model'], 'local')

    def test_links_nao_redirecionam_relatorios(self):
        with tempfile.TemporaryDirectory() as pasta, tempfile.TemporaryDirectory() as fora:
            env = ambiente(pasta)
            diretorio = Path(pasta)/'avaliacoes_ia_local'
            diretorio.symlink_to(fora, target_is_directory=True)
            self.assertIn('redirecionamento', env['_executar_avaliacao_precisao_local']())
            self.assertFalse(list(Path(fora).iterdir()))
            diretorio.unlink()
            diretorio.mkdir()
            alvo = Path(fora)/'protegido.json'
            alvo.write_text('preservado')
            (diretorio/'ultima.json').symlink_to(alvo)
            self.assertIn('link simbolico', env['_executar_avaliacao_precisao_local']())
            self.assertEqual(alvo.read_text(), 'preservado')

    def test_interrupcao_preserva_primeira_geracao(self):
        with tempfile.TemporaryDirectory() as pasta:
            env = ambiente(pasta, Mock(side_effect=['primeiro resultado', KeyboardInterrupt()]))
            with redirect_stdout(StringIO()):
                env['_comandos_precisao_local']('avaliar precisao local')
            dados = json.loads((Path(pasta)/'avaliacoes_ia_local'/'ultima.json').read_text())
            self.assertEqual(len(dados['casos'][0]['variantes']), 1)
            self.assertEqual(dados['casos'][0]['variantes'][0]['resposta'], 'primeiro resultado')
            self.assertIn('prompt_sistema', dados)

    def test_relatorio_corrompido_nao_derruba_comando(self):
        with tempfile.TemporaryDirectory() as pasta:
            env = ambiente(pasta)
            env['carregar_json'] = lambda *args: {'casos':[{}]}
            out = StringIO()
            with redirect_stdout(out):
                self.assertTrue(env['_comandos_precisao_local']('ver ultima avaliacao local'))
            self.assertIn('invalido', out.getvalue())


if __name__ == '__main__':
    unittest.main()
