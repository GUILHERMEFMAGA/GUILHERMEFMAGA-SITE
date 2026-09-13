"""r64: auto-diagnostico de arranque NA ABERTURA — a cura chegou antes da
doenca. Toda abertura roda o exame r61 em silencio: se estiver tudo certo,
nao imprime NADA (abertura limpa, filosofia r44 de arranque rapido); se
achar problema, avisa na hora com a cura pronta — antes de o usuario
esbarrar nele. A prova de falha e sagrada: o diagnostico nunca derruba a
abertura do agente."""
import io
import os
import unittest
from contextlib import redirect_stdout

from test_roteamento_conversa import carregar


class AvisoDeBoot(unittest.TestCase):
    def _env(self):
        return carregar('_r64_aviso_de_boot', os=os)

    def test_saude_imprime_nada_e_eh_silenciosa(self):
        def diagnosticar():
            return ('Diagnostico de arranque em: C:\\x\n[OK] tudo certinho\n'
                    '\nTudo saudavel por aqui!')
        tampao = io.StringIO()
        with redirect_stdout(tampao):
            resultado = self._env()['_r64_aviso_de_boot'](diagnosticar=diagnosticar)
        self.assertFalse(resultado)
        self.assertEqual(tampao.getvalue(), '')  # silencio = saude

    def test_problemas_avisam_antes_com_a_cura(self):
        def diagnosticar():
            return ('Diagnostico\n[PROBLEMA] main.py NAO EXISTE nesta pasta\n'
                    '[OK] agente.py compila\n'
                    '[PROBLEMA] iniciar.bat com fim de linha errado (LF)\n')
        tampao = io.StringIO()
        with redirect_stdout(tampao):
            resultado = self._env()['_r64_aviso_de_boot'](diagnosticar=diagnosticar)
        self.assertTrue(resultado)
        saida = tampao.getvalue()
        self.assertIn('achou 2 problema(s)', saida)
        self.assertIn('[PROBLEMA] main.py NAO EXISTE nesta pasta', saida)
        self.assertIn('[PROBLEMA] iniciar.bat com fim de linha errado (LF)', saida)
        self.assertIn("'atualizar agora'", saida)
        self.assertIn("'diagnostico do iniciar'", saida)
        self.assertNotIn('[OK] agente.py compila', saida)  # so o problema interessa

    def test_diagnostico_explodindo_nunca_derruba_a_abertura(self):
        def diagnosticar():
            raise RuntimeError('disco sumiu')
        tampao = io.StringIO()
        with redirect_stdout(tampao):
            resultado = self._env()['_r64_aviso_de_boot'](diagnosticar=diagnosticar)
        self.assertFalse(resultado)
        self.assertEqual(tampao.getvalue(), '')

    def test_sem_r61_disponivel_nao_faz_nada(self):
        tampao = io.StringIO()
        with redirect_stdout(tampao):
            resultado = carregar('_r64_aviso_de_boot', os=os)['_r64_aviso_de_boot']()
        self.assertFalse(resultado)
        self.assertEqual(tampao.getvalue(), '')


class Estrutura(unittest.TestCase):
    def test_o_gancho_roda_uma_vez_antes_da_primeira_pergunta(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        self.assertEqual(texto.count('_r64_aviso_de_boot()'), 1)  # exatamente 1 chamada
        gancho = texto.index('_r64_aviso_de_boot()')
        loop = texto.index('while True:\n    comando_usuario = input(')
        self.assertLess(gancho, loop)  # antes da primeira pergunta
        self.assertIn('AUTO-DIAGNOSTICO (r64)', texto)
        self.assertEqual(texto.count('[Motor e avaliacao local 2026-09-11-r70]'), 1)


if __name__ == '__main__':
    unittest.main()
