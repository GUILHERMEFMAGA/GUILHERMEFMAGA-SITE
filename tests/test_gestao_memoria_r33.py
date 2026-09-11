"""r33: gestao da memoria de longo prazo EXISTENTE (ver, buscar, gravar,
esquecer). AST isolado; sem rede, sem GGUF, sem embeddings; arquivo em pasta
temporaria via salvar_json capturado."""
import io
import os
import tempfile
import unittest
from unittest.mock import Mock
from test_roteamento_conversa import carregar


def capturar(funcao, *args):
    import contextlib
    tampao = io.StringIO()
    with contextlib.redirect_stdout(tampao):
        return funcao(*args), tampao.getvalue()


def env_r33(memoria=None, **extras):
    base = dict(memoria_longa=memoria if memoria is not None else [],
                ARQ_MEMORIA_LONGA=os.path.join(tempfile.mkdtemp(), 'memoria_longa.json'),
                salvar_json=lambda c, d: None,
                registrar_memoria_longa=Mock(return_value=None),
                input=Mock(return_value=''))
    base.update(extras)
    return carregar('_norm_pt', '_r33_data_curta', '_r33_linhas_memoria',
                    '_r33_gravar', '_r33_ver', '_r33_buscar', '_r33_esquecer',
                    '_r33_comandos', **base)


def lembranca(texto, data='2026-09-11T20:31:04', tags=None):
    return {'texto': texto, 'tags': tags or [], 'data': data}


class GravarEVer(unittest.TestCase):
    def test_gravar_chama_o_motor_existente(self):
        env = env_r33()
        _, saida = capturar(env['_r33_comandos'], 'gravar memoria: meu cavalo se chama Trovao')
        self.assertIn('Gravado na memoria de longo prazo', saida)
        self.assertIn('Trovao', saida)
        env['registrar_memoria_longa'].assert_called_once()

    def test_gravar_vazio_orienta(self):
        env = env_r33()
        _, saida = capturar(env['_r33_comandos'], 'gravar memoria:   ')
        self.assertIn('Informe o que gravar', saida)
        env['registrar_memoria_longa'].assert_not_called()

    def test_ver_vazia_e_com_itens(self):
        env = env_r33()
        _, saida = capturar(env['_r33_comandos'], 'ver memorias')
        self.assertIn('esta vazia', saida)
        env2 = env_r33([lembranca('O usuario tem um cavalo chamado Trovao', tags=['animais']),
                        lembranca('Nasceu em Ribeirao Preto', data='2025-01-02T08:00:00')])
        _, saida2 = capturar(env2['_r33_comandos'], 'ver memorias')
        self.assertIn('2 lembranca(s)', saida2)
        self.assertIn('11/09/2026 20:31 - O usuario tem um cavalo chamado Trovao [animais]', saida2)
        self.assertIn('02/01/2025 08:00', saida2)


class BuscarEEsquecer(unittest.TestCase):
    def setUp(self):
        self.memoria = [lembranca('O cavalo Trovao e preto', tags=['animais']),
                        lembranca('Prefere cafe sem acucar', data='2025-05-05T10:00:00'),
                        lembranca('Cavalo ganha em setembro', data='2025-06-06T11:00:00')]

    def test_buscar_por_termo_e_tags(self):
        env = env_r33(self.memoria)
        _, saida = capturar(env['_r33_comandos'], 'buscar memoria: cavalo')
        self.assertIn('Achei 2 lembranca(s)', saida)
        _, saida2 = capturar(env['_r33_comandos'], 'buscar memoria: animais')
        self.assertIn('Achei 1 lembranca(s)', saida2)
        _, saida3 = capturar(env['_r33_comandos'], 'buscar memoria: zebra')
        self.assertIn('Nada encontrado', saida3)

    def test_esquecer_exige_sim_e_mantem_o_resto(self):
        salvos = []
        env = env_r33(self.memoria, salvar_json=lambda c, d: salvos.append(list(d)),
                      input=Mock(return_value='NAO'))
        _, saida = capturar(env['_r33_comandos'], 'esquecer: cavalo')
        self.assertIn('Cancelado', saida)
        self.assertEqual(len(env['memoria_longa']), 3)
        env['input'] = Mock(return_value='SIM')
        _, saida2 = capturar(env['_r33_comandos'], 'esquecer: cavalo')
        self.assertIn('Esquecidas: 2 lembranca(s). Restaram 1.', saida2)
        self.assertEqual(len(env['memoria_longa']), 1)
        self.assertIn('cafe', env['memoria_longa'][0]['texto'])
        self.assertEqual(len(salvos), 1)
        self.assertEqual(len(salvos[0]), 1)

    def test_esquecer_sem_correspondencia_nao_toca_em_nada(self):
        env = env_r33(self.memoria)
        _, saida = capturar(env['_r33_comandos'], 'esquecer: zebra')
        self.assertIn('Nenhuma lembranca contem', saida)
        self.assertEqual(len(env['memoria_longa']), 3)

    def test_memoria_vazia_mensagens_honestas(self):
        env = env_r33()
        _, saida = capturar(env['_r33_comandos'], 'buscar memoria: x')
        self.assertIn('Nada encontrado', saida)
        _, saida2 = capturar(env['_r33_comandos'], 'esquecer: x')
        self.assertIn('esta vazia', saida2)


class Roteamento(unittest.TestCase):
    def test_comandos_roteiam_e_estranhos_passam(self):
        env = env_r33()
        for comando in ('gravar memoria: x', 'ver memorias', 'buscar memoria: x', 'esquecer: x'):
            retorno, _ = capturar(env['_r33_comandos'], comando)
            self.assertTrue(retorno, comando)
        retorno2, saida2 = capturar(env['_r33_comandos'], 'esquece isso')
        self.assertFalse(retorno2)
        self.assertEqual(saida2, '')


if __name__ == '__main__':
    unittest.main()
