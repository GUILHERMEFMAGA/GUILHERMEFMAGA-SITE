# -*- coding: utf-8 -*-
"""r75 — a CASA do agente: fila de fundo (28), cron 2.0 (29), diário de
lentidão (30), sandbox c/ limites (39), cofre de chaves c/ DPAPI (40) e
modo convidado (41). Regras da casa: carregar via AST, 100% local,
kill-switch na config, aprimorar SEM apagar."""
import datetime
import json
import os
import shutil
import tempfile
import unittest

from test_roteamento_conversa import SOURCE as AGENTE_PY, carregar


def _novo_ambiente():
    pasta = tempfile.mkdtemp(prefix='r75_')
    return {
        'os': os,
        'json': json,
        'PASTA_BASE': pasta,
        '_R75_NOMES_DIAS': ('seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'),
    }


def _stub(ambiente, nome, valor):
    """O loader auto-carrega funções _rNN_ e sobrescreve stub do ambiente —
    por isso o stub vai DEPOIS do carregar()."""
    ambiente[nome] = valor
    return ambiente


def _carregar(**extra):
    ambiente = _novo_ambiente()
    ambiente.update(extra)
    return carregar('_r67_ler_config', **ambiente), ambiente


class TestCamaR75(unittest.TestCase):

    def setUp(self):
        self._pasta = None

    def tearDown(self):
        if self._pasta and os.path.isdir(self._pasta):
            shutil.rmtree(self._pasta, ignore_errors=True)

    # ---------- integridade ----------
    def test_selo_r75(self):
        with open(AGENTE_PY, encoding='utf-8') as f:
            fonte = f.read()
        self.assertEqual(fonte.count('[Motor e avaliacao local 2026-09-11-r76]'), 1)
        self.assertEqual(fonte.count('[Motor e avaliacao local 2026-09-11-r74]'), 0)

    def test_bloco_r75_completo(self):
        ambiente, _ = _carregar()
        for nome in ('_r75_fila_enviar', '_r75_fila_listar', '_r75_cron_dias',
                     '_r75_cron_deve_disparar', '_r75_cron_loop', '_r75_cron_agendar',
                     '_r75_causa_lentidao', '_r75_lentidao_registrar', '_r75_lentidao_listar',
                     '_r75_sandbox_rodar', '_r75_cofre_guardar', '_r75_cofre_ler',
                     '_r75_cofre_status', '_r75_convidado_bloqueia'):
            self.assertIn(nome, ambiente, 'faltando: ' + nome)

    def test_rotas_r75_no_cerebro(self):
        with open(AGENTE_PY, encoding='utf-8') as f:
            fonte = f.read()
        for trecho in ('cmd.startswith("em segundo plano")', 'cmd.startswith("cron")',
                       'cmd.startswith("sandbox")', 'cmd.startswith("cofre")',
                       'cmd.startswith("modo convidado")', 'cmd.startswith("sair do modo convidado")',
                       'cmd.startswith("diario lentidao")'):
            self.assertIn(trecho, fonte)

    def test_hooks_r75_no_codigo(self):
        with open(AGENTE_PY, encoding='utf-8') as f:
            fonte = f.read()
        self.assertIn('_cofre75 = globals().get(\'_r75_cofre_ler\')', fonte)          # _chave_ia
        self.assertIn("_reg75 = globals().get('_r75_lentidao_registrar')", fonte)     # _chamar_neural
        self.assertIn('_bloq75 = _r75_convidado_bloqueia(comando)', fonte)            # dispatcher
        self.assertIn('    _r75_cron_agendar()', fonte)                               # arranque

    # ---------- 28: fila de fundo ----------
    def test_fila_enviar_inline_grava_resultado(self):
        ambiente, extra = _carregar()
        self._pasta = extra['PASTA_BASE']
        rodadas = []

        def _despachar(comando):
            rodadas.append(comando)
            print('feito: ' + comando)

        _r = ambiente['_r75_fila_enviar']('zipe a pasta projetos', despachar=_despachar,
                                          pasta=self._pasta, inline=True)
        self.assertIsNotNone(_r)
        self.assertEqual(rodadas, ['zipe a pasta projetos'])
        self.assertEqual(_r['status'], 'concluida')
        self.assertIn('feito: zipe a pasta projetos', _r['saida'])
        dados = ambiente['_r74_ler_json'](
            os.path.join(self._pasta, 'tarefas_fundo.json'), [])
        self.assertEqual(len(dados), 1)
        self.assertEqual(dados[0]['status'], 'concluida')

    def test_fila_listar_mostra_entradas(self):
        ambiente, extra = _carregar()
        self._pasta = extra['PASTA_BASE']
        ambiente['_r75_fila_enviar']('ordena fotos', despachar=lambda c: print('ok'),
                                     pasta=self._pasta, inline=True)
        _txt = ambiente['_r75_fila_listar'](pasta=self._pasta)
        self.assertIn('Fila de fundo', _txt)
        self.assertIn('ordena fotos', _txt)
        self.assertIn('concluida', _txt)

    def test_fila_listar_vazia(self):
        ambiente, extra = _carregar()
        self.assertIsNone(ambiente['_r75_fila_listar'](pasta=extra['PASTA_BASE']))

    def test_fila_killswitch(self):
        ambiente, extra = _carregar()
        ambiente = _stub(ambiente, '_r67_ler_config',
                         lambda chave, pasta=None, padrao=None: chave != 'fila_de_fundo' and padrao)
        self.assertIsNone(ambiente['_r75_fila_enviar']('x', despachar=lambda c: None,
                                                       pasta=extra['PASTA_BASE'], inline=True))

    def test_fila_sem_comando(self):
        ambiente, extra = _carregar()
        self.assertIsNone(ambiente['_r75_fila_enviar']('   ', despachar=lambda c: None,
                                                       pasta=extra['PASTA_BASE'], inline=True))

    # ---------- 29: cron local 2.0 ----------
    def test_cron_dias_varios_formatos(self):
        ambiente, _ = _carregar()
        _d = ambiente['_r75_cron_dias']
        self.assertEqual(_d('seg, qua, sex'), [0, 2, 4])
        self.assertEqual(_d('dom'), [6])
        self.assertIsNone(_d(''))
        self.assertIsNone(_d('todos'))
        self.assertIsNone(_d('sempre'))
        self.assertEqual(_d('seg, seg, ter'), [0, 1])

    def test_cron_deve_disparar_logica_pura(self):
        ambiente, _ = _carregar()
        _deve = ambiente['_r75_cron_deve_disparar']
        _agora = datetime.datetime(2026, 9, 15, 8, 0)  # uma terça-feira
        base = {'nome': 'x', 'quando': '08:00', 'comando': 'oi', 'ativo': True}
        self.assertTrue(_deve(base, _agora, set()))
        self.assertFalse(_deve(dict(base, quando='08:01'), _agora, set()))
        self.assertFalse(_deve(dict(base, dias=[0]), _agora, set()))     # só segunda
        self.assertTrue(_deve(dict(base, dias=[1]), _agora, set()))      # só terça
        self.assertFalse(_deve(base, _agora, {'2026-09-15|08:00|x'}))    # já disparou
        self.assertFalse(_deve(dict(base, ativo=False), _agora, set()))  # pausada

    def test_cron_loop_dispara_uma_vez_por_dia(self):
        ambiente, extra = _carregar()
        self._pasta = extra['PASTA_BASE']
        _agora = datetime.datetime(2026, 9, 15, 8, 0)
        dados = [{'nome': 'backup', 'quando': '08:00', 'dias': None,
                  'comando': 'zipa a pasta projetos', 'ativo': True}]
        disparados = set()
        rodadas = []
        _rodadas = ambiente['_r75_cron_loop'](
            disparados, despachar=lambda c: rodadas.append(c),
            dormir=lambda s: None, max_rodadas=2, pasta=self._pasta,
            agora=_agora, ler_cron=lambda: dados)
        self.assertEqual(_rodadas, 2)
        self.assertEqual(rodadas, ['zipa a pasta projetos'])  # 1a rodada: dispara; 2a: já disparou

    def test_cron_agendar_soa_uma_vez_e_respeita_killswitch(self):
        ambiente, extra = _carregar()
        ambiente['_r75_cron_agendado'] = False
        chamadas = []
        self.assertTrue(ambiente['_r75_cron_agendar'](agendador=lambda: chamadas.append(1)))
        self.assertFalse(ambiente['_r75_cron_agendar'](agendador=lambda: chamadas.append(2)))
        self.assertEqual(chamadas, [1])
        ambiente = _stub(ambiente, '_r67_ler_config',
                         lambda chave, pasta=None, padrao=None: chave != 'agenda_cron' and padrao)
        ambiente['_r75_cron_agendado'] = False
        self.assertFalse(ambiente['_r75_cron_agendar'](agendador=lambda: chamadas.append(3)))

    # ---------- 30: diário de lentidão ----------
    def test_causa_lentidao_heuristica(self):
        ambiente, _ = _carregar()
        _c = ambiente['_r75_causa_lentidao']
        self.assertEqual(_c(20.0, 30.0, 20000), 'contexto grande')
        self.assertEqual(_c(25.0, 20.0, 500, primeira=True), 'motor frio (primeira geracao da sessao)')
        self.assertIn('maquina carregada', _c(20.0, 4.0, 100))
        self.assertIn('sem causa clara', _c(20.0, 25.0, 100))

    def test_lentidao_registrar_respeita_limiar(self):
        ambiente, extra = _carregar()
        self._pasta = extra['PASTA_BASE']
        self.assertIsNone(ambiente['_r75_lentidao_registrar'](10.0, 20.0, 500,
                                                              pasta=self._pasta))  # abaixo de 15s
        self.assertFalse(os.path.exists(os.path.join(self._pasta, 'lentidao.json')))
        ambiente['_r75_lentidao_registrar'](22.5, 4.0, 100, pasta=self._pasta)     # acima
        dados = ambiente['_r74_ler_json'](os.path.join(self._pasta, 'lentidao.json'), [])
        self.assertEqual(len(dados), 1)
        self.assertEqual(dados[0]['segundos'], 22.5)
        self.assertIn('maquina carregada', dados[0]['causa'])

    def test_lentidao_cap_em_100(self):
        ambiente, extra = _carregar()
        self._pasta = extra['PASTA_BASE']
        for i in range(105):
            ambiente['_r75_lentidao_registrar'](20.0 + i, 10.0, 100, pasta=self._pasta)
        dados = ambiente['_r74_ler_json'](os.path.join(self._pasta, 'lentidao.json'), [])
        self.assertEqual(len(dados), 100)

    def test_lentidao_listar_mostra_top(self):
        ambiente, extra = _carregar()
        self._pasta = extra['PASTA_BASE']
        ambiente['_r75_lentidao_registrar'](18.0, 20.0, 500, pasta=self._pasta)
        ambiente['_r75_lentidao_registrar'](40.0, 15.0, 20000, pasta=self._pasta)
        _txt = ambiente['_r75_lentidao_listar'](pasta=self._pasta)
        self.assertIn('Diario de lentidao', _txt)
        self.assertIn('40.0s', _txt)
        self.assertIn('contexto grande', _txt)

    def test_lentidao_killswitch(self):
        ambiente, extra = _carregar()
        ambiente = _stub(ambiente, '_r67_ler_config',
                         lambda chave, pasta=None, padrao=None: chave != 'diario_lentidao' and padrao)
        self.assertIsNone(ambiente['_r75_lentidao_registrar'](99.0, 1.0, 10,
                                                             pasta=extra['PASTA_BASE']))

    # ---------- 39: sandbox c/ limites ----------
    def test_sandbox_rodar_aplica_limite_configurado(self):
        ambiente, extra = _carregar()
        ambiente = _stub(ambiente, '_r67_ler_config',
                         lambda chave, pasta=None, padrao=None:
                         {'sandbox_codigo': True, 'sandbox_timeout_s': 5000}.get(chave, padrao))
        vistos = {}

        def _rodar(codigo, timeout):
            vistos['codigo'], vistos['timeout'] = codigo, timeout
            return 'ok'

        _r = ambiente['_r75_sandbox_rodar']('print(1+1)', rodar=_rodar, pasta=extra['PASTA_BASE'])
        self.assertEqual(_r, 'ok')
        self.assertEqual(vistos['codigo'], 'print(1+1)')
        self.assertEqual(vistos['timeout'], 300)  # 5000 clampado em 300

    def test_sandbox_rodar_padrao_30s(self):
        ambiente, extra = _carregar()
        vistos = {}
        ambiente['_r75_sandbox_rodar']('x', rodar=lambda c, t: vistos.update(t=t) or 'ok',
                                       pasta=extra['PASTA_BASE'])
        self.assertEqual(vistos['t'], 30)

    def test_sandbox_sem_codigo(self):
        ambiente, extra = _carregar()
        self.assertIsNone(ambiente['_r75_sandbox_rodar']('', rodar=lambda c, t: 'x',
                                                         pasta=extra['PASTA_BASE']))

    def test_sandbox_killswitch(self):
        ambiente, extra = _carregar()
        ambiente = _stub(ambiente, '_r67_ler_config',
                         lambda chave, pasta=None, padrao=None: chave != 'sandbox_codigo' and padrao)
        self.assertIsNone(ambiente['_r75_sandbox_rodar']('print(1)',
                                                         rodar=lambda c, t: 'x',
                                                         pasta=extra['PASTA_BASE']))

    # ---------- 40: cofre de chaves (DPAPI da r51) ----------
    def test_cofre_roundtrip_guardar_e_ler(self):
        ambiente, extra = _carregar()
        self._pasta = extra['PASTA_BASE']
        _proteger = lambda b: b'ENC:' + b
        _revelar = lambda b: b[len(b'ENC:'):]
        _r = ambiente['_r75_cofre_guardar'](
            ['# comentario', 'GEMINI_API_KEY = "abc123"', 'OUTRA = xyz'],
            proteger=_proteger, pasta=self._pasta)
        self.assertIsInstance(_r, dict)
        self.assertEqual(set(_r), {'GEMINI_API_KEY', 'OUTRA'})
        self.assertEqual(ambiente['_r75_cofre_ler']('gemini_api_key', revelar=_revelar,
                                                    pasta=self._pasta), 'abc123')
        self.assertEqual(ambiente['_r75_cofre_ler']('OUTRA', revelar=_revelar,
                                                    pasta=self._pasta), 'xyz')
        self.assertIsNone(ambiente['_r75_cofre_ler']('NAO_EXISTE', revelar=_revelar,
                                                     pasta=self._pasta))
        self.assertEqual(ambiente['_r75_cofre_status'](pasta=self._pasta), 2)

    def test_cofre_sem_dpapi_avisa_sem_brequear(self):
        ambiente, extra = _carregar()
        _r = ambiente['_r75_cofre_guardar'](['A = 1'], proteger=None, pasta=extra['PASTA_BASE'])
        self.assertIsInstance(_r, str)
        self.assertIn('intato', _r)  # no Linux o DPAPI real falha e o aviso e honesto
        ambiente = _stub(ambiente, '_r51_dpapi_proteger', None)
        _r2 = ambiente['_r75_cofre_guardar'](['A = 1'], proteger=None, pasta=extra['PASTA_BASE'])
        self.assertIsInstance(_r2, str)
        self.assertIn('DPAPI indisponivel', _r2)

    def test_cofre_ler_sem_cofre_retorna_none(self):
        ambiente, extra = _carregar()
        self.assertIsNone(ambiente['_r75_cofre_ler']('A', revelar=lambda b: b,
                                                     pasta=extra['PASTA_BASE']))

    # ---------- 41: modo convidado ----------
    def test_convidado_inativo_nao_bloqueia(self):
        ambiente, _ = _carregar()
        ambiente['_r75_convidado_ativo'] = False
        self.assertIsNone(ambiente['_r75_convidado_bloqueia']('modo admin'))

    def test_convidado_bloqueia_mexidas_na_casa(self):
        ambiente, _ = _carregar()
        ambiente['_r75_convidado_ativo'] = True
        _b = ambiente['_r75_convidado_bloqueia']
        self.assertIsNotNone(_b('modo admin'))
        self.assertIsNotNone(_b('atualizar agora'))
        self.assertIsNotNone(_b('criar rotina: bom dia, abre o email'))
        self.assertIsNotNone(_b('conhecimento ensinar: eu moro em SP'))
        self.assertIsNotNone(_b('cofre chaves'))
        self.assertIsNotNone(_b('sandbox: print(1)'))
        self.assertIsNotNone(_b('fila: zipe tudo'))
        self.assertIsNotNone(_b('cron adicionar x as 08:00: oi'))

    def test_convidado_deixa_uso_basico_e_saida(self):
        ambiente, _ = _carregar()
        ambiente['_r75_convidado_ativo'] = True
        _b = ambiente['_r75_convidado_bloqueia']
        self.assertIsNone(_b('abre o youtube'))
        self.assertIsNone(_b('toca uma musica'))
        self.assertIsNone(_b('que horas sao'))
        self.assertIsNone(_b('sair do modo convidado'))  # o dono SEMPRE consegue sair

    def test_convidado_killswitch(self):
        ambiente, _ = _carregar()
        ambiente['_r75_convidado_ativo'] = True
        ambiente = _stub(ambiente, '_r67_ler_config',
                         lambda chave, pasta=None, padrao=None: chave != 'modo_convidado' and padrao)
        self.assertIsNone(ambiente['_r75_convidado_bloqueia']('modo admin'))


if __name__ == '__main__':
    unittest.main()
