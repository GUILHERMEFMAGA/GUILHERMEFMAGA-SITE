"""r73 (melhoria renovadora): BEM-VINDO DE VOLTA — o agente percebe a sua
falta e sauda com o estado do cerebro persistente (r71). Grava a hora desta
abertura em sessao.json; na proxima calcula o tempo de fora. Silencioso na
1a vez e em reaberturas rapidas (< 1h). Kill-switch: 'boas_vindas': false."""
import datetime as dt
import io
import json
import os
import tempfile
import unittest

from test_roteamento_conversa import carregar


def _env(*nomes):
    env = carregar(*nomes, '_norm_pt', os=os, json=json)
    return env


def _cerebro(env, topicos=('minha casa',)):
    env['_r69_instalar_estado']()['conhecimento'] = {
        t: [{'texto': 'x'}] for t in topicos}


class DuracaoLegivel(unittest.TestCase):
    def test_minutos_horas_dias(self):
        env = _env('_r73_duracao_legivel')
        f = env['_r73_duracao_legivel']
        self.assertEqual(f(30), 'poucos minutos')
        self.assertEqual(f(900), '15 minutos')
        self.assertEqual(f(7200), '2 hora(s)')
        self.assertEqual(f(172800 * 2), '4 dia(s)')


class BoasVindas(unittest.TestCase):
    def test_primeira_vez_e_silencioso_mas_grava(self):
        env = _env('_r73_boas_vindas', '_r73_arquivo_sessao', '_r69_instalar_estado')
        pasta = tempfile.mkdtemp()
        self.assertIsNone(env['_r73_boas_vindas'](pasta=pasta))
        self.assertTrue(os.path.exists(env['_r73_arquivo_sessao'](pasta)))

    def test_reabertura_rapida_nao_incomoda(self):
        env = _env('_r73_boas_vindas', '_r73_arquivo_sessao', '_r69_instalar_estado')
        pasta = tempfile.mkdtemp()
        agora = dt.datetime.now()
        with io.open(env['_r73_arquivo_sessao'](pasta), 'w') as f:
            json.dump({'ultima_abertura': (agora - dt.timedelta(minutes=5)).isoformat()}, f)
        self.assertIsNone(env['_r73_boas_vindas'](pasta=pasta))

    def test_volta_depois_de_2_dias_com_cerebro_cheio(self):
        env = _env('_r73_boas_vindas', '_r73_arquivo_sessao', '_r69_instalar_estado')
        _cerebro(env, ('minha casa', 'meu gato'))
        env['_r69_instalar_estado']()['aprendidas'] = {'arruma pc': 'organizar'}
        pasta = tempfile.mkdtemp()
        agora = dt.datetime.now()
        with io.open(env['_r73_arquivo_sessao'](pasta), 'w') as f:
            json.dump({'ultima_abertura': (agora - dt.timedelta(days=2)).isoformat()}, f)
        msg = env['_r73_boas_vindas'](pasta=pasta)
        self.assertIn('BEM-VINDO DE VOLTA', msg)
        self.assertIn('2 dia(s)', msg)
        self.assertIn('2 topico(s)', msg)  # ensinei casa + gato
        self.assertIn('1 padrao(oes)', msg)
        self.assertIn('meu gato', msg)  # ultimo ensinamento citado

    def test_volta_com_cerebro_vazio_da_a_dica_gentil(self):
        env = _env('_r73_boas_vindas', '_r73_arquivo_sessao', '_r69_instalar_estado')
        pasta = tempfile.mkdtemp()
        agora = dt.datetime.now()
        with io.open(env['_r73_arquivo_sessao'](pasta), 'w') as f:
            json.dump({'ultima_abertura': (agora - dt.timedelta(days=3)).isoformat()}, f)
        msg = env['_r73_boas_vindas'](pasta=pasta)
        self.assertIn('BEM-VINDO DE VOLTA', msg)
        self.assertIn('ainda esta vazio', msg)

    def test_kill_switch_desliga(self):
        env = _env('_r73_boas_vindas', '_r73_arquivo_sessao', '_r69_instalar_estado')
        _cerebro(env)

        def ler(chave, pasta=None, padrao=None):
            return False if chave == 'boas_vindas' else padrao
        env['_r67_ler_config'] = ler
        pasta = tempfile.mkdtemp()
        agora = dt.datetime.now()
        with io.open(env['_r73_arquivo_sessao'](pasta), 'w') as f:
            json.dump({'ultima_abertura': (agora - dt.timedelta(days=3)).isoformat()}, f)
        self.assertIsNone(env['_r73_boas_vindas'](pasta=pasta))

    def test_arquivo_corrompido_nao_derruba_nada(self):
        env = _env('_r73_boas_vindas', '_r73_arquivo_sessao', '_r69_instalar_estado')
        pasta = tempfile.mkdtemp()
        with io.open(env['_r73_arquivo_sessao'](pasta), 'w') as f:
            f.write('{quebrado!!!')
        self.assertIsNone(env['_r73_boas_vindas'](pasta=pasta))
        # e o arquivo ficou sadio de novo
        with io.open(env['_r73_arquivo_sessao'](pasta)) as f:
            self.assertIn('ultima_abertura', f.read())


class Estrutura(unittest.TestCase):
    def test_gancho_mora_logo_apos_a_restauracao_da_r71(self):
        with io.open('agente.py', encoding='utf-8') as f:
            t = f.read()
        r71 = t.index('_r71_restaurar_na_abertura()  # r71')
        gancho = t.index("_bemvindo73 = globals().get")
        self.assertLess(r71, gancho)
        self.assertLess(gancho, t.index('_bemvindo73()'))
        self.assertNotIn('if _r73_comandos(comando):', t)  # r73 nao e rota de comando
        self.assertIn("BOAS-VINDAS (r73)", t)
        self.assertIn("'boas_vindas'", t)
        self.assertEqual(t.count('[Motor e avaliacao local 2026-09-11-r90]'), 1)
        self.assertIn('sessao.json', t)


if __name__ == '__main__':
    unittest.main()
