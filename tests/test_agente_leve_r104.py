# -*- coding: utf-8 -*-
"""r104 — AGENTE LEVE (falha REAL do dono, 16/09): o modo conversa
trava o PC inteiro (mouse/teclado congelam) enquanto ele navega.
Causa: o ciclo de 30s (1) traz o WhatsApp pra frente, (2) faz print da
tela e (3) roda o modelo de visao de 11B NA CPU (100% dos nucleos
durante o "olhar"). Estrategias profissionais (sem apagar nada, so
stdlib): (1) GATE DE OCIOSIDADE — sem teclado/mouse ha 60s o ciclo age;
enquanto o dono usa o PC, o ciclo e pulado (custo ZERO, sem roubo de
foco); (2) prioridade IDLE de CPU no servidor (SetPriorityClass) — o
desktop sempre ganha CPU; (3) threads limitadas (metade dos nucleos) —
o servidor nao ocupa o CPU inteiro; (4) intervalo padrao 30 -> 90s."""
import os
import sys
import unittest

from test_roteamento_conversa import carregar


class OciosidadeR104(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.amb = carregar('_r104_pc_ocioso', '_r104_ms_ult_entrada')

    def test_ocioso_com_injecao(self):
        f = self.amb['_r104_pc_ocioso']
        self.assertFalse(f(limite_s=60, _ms=1000))       # usou ha 1s
        self.assertTrue(f(limite_s=60, _ms=61000))       # 61s parado
        self.assertTrue(f(limite_s=0, _ms=0))            # limite 0: age sempre
        self.assertTrue(f(limite_s=60, _ms=None))        # sem leitura (so Windows)

    def test_ms_ult_entrada_no_windows_devolve_none(self):
        if sys.platform == 'win32':
            self.skipTest('so fora do Windows')
        self.assertIsNone(self.amb['_r104_ms_ult_entrada']())


class WiringLeveR104(unittest.TestCase):
    def setUp(self):
        from test_roteamento_conversa import SOURCE
        self.fonte = SOURCE.read_text(encoding='utf-8')

    def _corpo(self, nome_def, proxima_def):
        i = self.fonte.find(nome_def)
        self.assertGreater(i, 0, nome_def)
        j = self.fonte.find(proxima_def, i + 10)
        return self.fonte[i:j]

    def test_ciclo_tem_gate_de_ociosidade(self):
        corpo = self._corpo('def _r88_ciclo(', 'def _pedido_ideias_do_agente')
        self.assertIn('_r104_pc_ocioso', corpo)
        self.assertIn('visao_ociosidade_s', corpo)

    def test_intervalo_padrao_90(self):
        self.assertIn('"modo_conversa_intervalo", padrao=90', self.fonte)

    def test_servidor_com_prioridade_idle_e_threads(self):
        corpo = self._corpo('def _r94_ligar_visao_servidor(',
                            'def _r94_tentar_visao')
        self.assertIn('SetPriorityClass', corpo)          # prioridade IDLE
        self.assertIn('IDLE_PRIORITY_CLASS', corpo)
        self.assertIn('--threads', corpo)                 # nucleos limitados
        self.assertIn('visao_threads', corpo)             # configuravel

    def test_visao_bat_com_threads(self):
        corpo = self._corpo('def _r94_texto_visao_bat(',
                            'def _r92_leitor_pronto')
        self.assertIn('--threads 4', corpo)


if __name__ == '__main__':
    unittest.main()
