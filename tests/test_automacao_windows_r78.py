# -*- coding: utf-8 -*-
"""r78 — AUTOMAÇÃO PROFISSIONAL: o agente cria tarefas no AGENDADOR DE
TAREFAS DO WINDOWS (schtasks), então a automação roda MESMO COM O AGENTE
FECHADO (o motor é o Windows; o agente é a frente). Regras da casa:
carregar via AST, 100% local, kill-switch na config, 'sim' antes,
.bat CRLF puro SEM bloco if/SEM REM, honestidade fora do Windows."""
import json
import os
import shutil
import tempfile
import unittest

from test_roteamento_conversa import SOURCE as AGENTE_PY, carregar


def _novo_ambiente():
    pasta = tempfile.mkdtemp(prefix='r78_')
    return {
        'os': os,
        'json': json,
        'PASTA_BASE': pasta,
        '_R75_NOMES_DIAS': ('seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'),
    }


def _stub(ambiente, nome, valor):
    ambiente[nome] = valor
    return ambiente


def _carregar(**extra):
    ambiente = _novo_ambiente()
    ambiente.update(extra)
    return carregar('_r67_ler_config', **ambiente), ambiente


class TestAutomacaoWindowsR78(unittest.TestCase):

    def setUp(self):
        self._pastas = []

    def tearDown(self):
        for p in self._pastas:
            if p and os.path.isdir(p):
                shutil.rmtree(p, ignore_errors=True)

    # ---------- integridade ----------
    def test_selo_r78(self):
        with open(AGENTE_PY, encoding='utf-8') as f:
            fonte = f.read()
        self.assertEqual(fonte.count('[Motor e avaliacao local 2026-09-11-r87]'), 1)
        self.assertEqual(fonte.count('[Motor e avaliacao local 2026-09-11-r76]'), 0)

    def test_bloco_r78_completo(self):
        ambiente, _ = _carregar()
        for nome in ('_r78_pasta_tarefas', '_r78_arquivo_tarefas', '_r78_slug',
                     '_r78_nome_sch', '_r78_dias_para_sch', '_r78_parse_agenda',
                     '_r78_escrever_bat', '_r78_rodar_sch', '_r78_sch_criar',
                     '_r78_sch_apagar', '_r78_tarefas_listar'):
            self.assertIn(nome, ambiente, 'faltando: ' + nome)

    def test_rotas_r78_no_cerebro(self):
        with open(AGENTE_PY, encoding='utf-8') as f:
            fonte = f.read()
        self.assertIn('cmd.startswith("agendar windows")', fonte)
        # no modo tarefa o agente nao fala na abertura
        self.assertIn("AGENTE_TAREFA_WINDOWS", fonte)

    # ---------- logica pura ----------
    def test_slug_e_nome_sch_sanitizados(self):
        ambiente, _ = _carregar()
        self.assertEqual(ambiente['_r78_slug']('Meu Backup Final!'), 'meu-backup-final')
        self.assertEqual(ambiente['_r78_nome_sch']('Meu Backup Final!'), 'SuperAgente_Meu_Backup_Final')
        self.assertEqual(ambiente['_r78_nome_sch']('!!!'), 'SuperAgente_tarefa')

    def test_dias_para_sch(self):
        ambiente, _ = _carregar()
        self.assertEqual(ambiente['_r78_dias_para_sch']([0, 2]), 'MON,WED')
        self.assertEqual(ambiente['_r78_dias_para_sch']([6]), 'SUN')
        self.assertIsNone(ambiente['_r78_dias_para_sch'](None))
        self.assertIsNone(ambiente['_r78_dias_para_sch']([]))

    def test_parse_agenda_formatos(self):
        ambiente, _ = _carregar()
        _p = ambiente['_r78_parse_agenda']
        r = _p('backup as 08:00: zipa a pasta projetos')
        self.assertEqual(r, ('backup', '08:00', None, 'zipa a pasta projetos'))
        r = _p('relatorio as 7:05 seg, ter: manda o resumo')  # dias ANTES do ' : ' (gramatica r75)
        self.assertEqual(r, ('relatorio', '07:05', [0, 1], 'manda o resumo'))
        self.assertIsNone(_p('backup sem hora: nada'))
        self.assertIsNone(_p('x as 25:00: nada'))       # hora invalida
        self.assertIsNone(_p('x as 08:00:'))            # comando vazio
        self.assertIsNone(_p('x as 08:00'))             # sem payload

    # ---------- arquivos gerados ----------
    def test_bat_crlf_puro_e_minimo(self):
        ambiente, extra = _carregar()
        self._pastas.append(extra['PASTA_BASE'])
        bat = ambiente['_r78_escrever_bat']('meu backup', 'zipe a pasta x',
                                            pasta=extra['PASTA_BASE'])
        self.assertTrue(bat.endswith('.bat'))
        bruto = open(bat, 'rb').read()
        self.assertIn(b'\r\n', bruto)
        # CRLF puro: nenhum \n sem \r na frente
        i = 0
        while True:
            i = bruto.find(b'\n', i)
            if i == -1:
                break
            self.assertGreater(i, 0)
            self.assertEqual(bruto[i - 1], 13)
            i += 1
        self.assertIn(b'set AGENTE_TAREFA_WINDOWS=1', bruto)
        self.assertNotIn(b'REM', bruto)      # regra 7: sem REM
        self.assertNotIn(b'if ', bruto)      # regra 7: sem bloco if
        txt = open(bat.replace('.bat', '.txt'), 'rb').read()
        self.assertIn('zipe a pasta x'.encode('cp1252'), txt)
        self.assertIn(b'sair', txt)

    # ---------- criar / apagar (rodar injetado) ----------
    def test_sch_criar_chama_schtasks_certinho(self):
        ambiente, extra = _carregar()
        self._pastas.append(extra['PASTA_BASE'])
        vistos = {}

        def _rodar(args):
            vistos['args'] = args
            return True, 'ok'

        _r = ambiente['_r78_sch_criar']('backup', '08:00', 'zipa a pasta projetos',
                                        rodar=_rodar, pasta=extra['PASTA_BASE'])
        self.assertIsInstance(_r, str)
        self.assertIn('AGENDADOR DO WINDOWS', _r)
        args = vistos['args']
        self.assertEqual(args[0], '/Create')
        self.assertIn('SuperAgente_backup', args)
        self.assertIn('/SC', args)
        self.assertIn('DAILY', args)
        self.assertIn('/ST', args)
        self.assertIn('08:00', args)
        self.assertIn('/F', args)
        dados = json.load(open(ambiente['_r78_arquivo_tarefas'](extra['PASTA_BASE']), encoding='utf-8'))
        self.assertEqual(len(dados), 1)
        self.assertEqual(dados[0]['nome'], 'backup')

    def test_sch_criar_com_dias_da_semana(self):
        ambiente, extra = _carregar()
        self._pastas.append(extra['PASTA_BASE'])
        vistos = {}

        def _rodar(args):
            vistos['args'] = args
            return True, 'ok'

        ambiente['_r78_sch_criar']('segter', '07:30', 'oi', dias=[0, 1],
                                   rodar=_rodar, pasta=extra['PASTA_BASE'])
        args = vistos['args']
        self.assertIn('/D', args)
        self.assertIn('MON,TUE', args)

    def test_sch_criar_falha_honesta_sem_registrar(self):
        ambiente, extra = _carregar()
        self._pastas.append(extra['PASTA_BASE'])
        _r = ambiente['_r78_sch_criar']('x', '08:00', 'oi',
                                        rodar=lambda a: (False, 'erro do windows'),
                                        pasta=extra['PASTA_BASE'])
        self.assertIsInstance(_r, str)
        self.assertIn('nao aceitou', _r)
        self.assertIn('erro do windows', _r)
        self.assertFalse(os.path.exists(ambiente['_r78_arquivo_tarefas'](extra['PASTA_BASE'])))

    def test_sch_criar_recusa_fila_de_fundo(self):
        ambiente, extra = _carregar()
        _r = ambiente['_r78_sch_criar']('x', '08:00', 'fila: zipe tudo',
                                        rodar=lambda a: (True, 'ok'),
                                        pasta=extra['PASTA_BASE'])
        self.assertIsInstance(_r, str)
        self.assertIn('fila de fundo', _r)

    def test_sch_criar_killswitch(self):
        ambiente, extra = _carregar()
        ambiente = _stub(ambiente, '_r67_ler_config',
                         lambda chave, pasta=None, padrao=None: chave != 'tarefas_windows' and padrao)
        self.assertIsNone(ambiente['_r78_sch_criar']('x', '08:00', 'oi',
                                                     rodar=lambda a: (True, 'ok'),
                                                     pasta=extra['PASTA_BASE']))

    def test_sch_apagar_tira_tudo(self):
        ambiente, extra = _carregar()
        self._pastas.append(extra['PASTA_BASE'])
        ambiente['_r78_sch_criar']('backup', '08:00', 'zipa a pasta projetos',
                                   rodar=lambda a: (True, 'ok'), pasta=extra['PASTA_BASE'])
        bat = os.path.join(ambiente['_r78_pasta_tarefas'](extra['PASTA_BASE']), 'backup.bat')
        self.assertTrue(os.path.isfile(bat))
        vistos = []
        _r = ambiente['_r78_sch_apagar']('backup',
                                         rodar=lambda a: (vistos.append(a) or (True, 'ok')),
                                         pasta=extra['PASTA_BASE'])
        self.assertIn('apagada', _r)
        self.assertEqual(vistos[0][0], '/Delete')
        self.assertIn('SuperAgente_backup', vistos[0])
        self.assertFalse(os.path.isfile(bat))
        self.assertFalse(os.path.isfile(bat.replace('.bat', '.txt')))
        dados = json.load(open(ambiente['_r78_arquivo_tarefas'](extra['PASTA_BASE']), encoding='utf-8'))
        self.assertEqual(dados, [])

    def test_sch_apagar_sem_registro_avisado(self):
        ambiente, extra = _carregar()
        _r = ambiente['_r78_sch_apagar']('inexistente',
                                         rodar=lambda a: (True, 'ok'),
                                         pasta=extra['PASTA_BASE'])
        self.assertIn('Nao achei', _r)

    def test_tarefas_listar(self):
        ambiente, extra = _carregar()
        self._pastas.append(extra['PASTA_BASE'])
        self.assertIsNone(ambiente['_r78_tarefas_listar'](pasta=extra['PASTA_BASE']))
        ambiente['_r78_sch_criar']('backup', '08:00', 'zipa a pasta projetos',
                                   rodar=lambda a: (True, 'ok'), pasta=extra['PASTA_BASE'])
        _txt = ambiente['_r78_tarefas_listar'](pasta=extra['PASTA_BASE'])
        self.assertIn('backup', _txt)
        self.assertIn('08:00', _txt)
        self.assertIn('taskschd.msc', _txt)

    def test_rodar_sch_fora_do_windows_e_honesto(self):
        ambiente, _ = _carregar()
        ok, msg = ambiente['_r78_rodar_sch'](['/Create'])
        self.assertFalse(ok)
        self.assertIn('Windows', msg)


if __name__ == '__main__':
    unittest.main()
