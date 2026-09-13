"""r66: o gatilho de atualizar aceita o comando COMO O USUARIO FALA. No PC
real o usuario digitou 'atualiza agora' (sem o r, portugues natural) e caiu
no modelo bruto — vergonhoso. Agora 'atualizar agora', 'atualiza agora',
'atualisa agora', 'atualize', 'atualizar o agente'... todos disparam o fluxo
completo (r62 entrega + r50). Mas 'atualizar o defender' continua com a rota
dele (nada de roubar atalhos alheios)."""
import io
import os
import unittest
from contextlib import redirect_stdout

from test_roteamento_conversa import carregar


class VariedadesDeAtualizar(unittest.TestCase):
    def _env(self):
        env = carregar('_r62_comandos', '_r50_comandos', '_norm_pt', os=os)
        entregas, delegados = [], []

        def fake_entrega():
            entregas.append(1)
            return 'LANCADOR'
        env['_r62_entregar_lancador'] = fake_entrega

        def fake_r50(txt):
            delegados.append(txt)
            return True
        env['_r50_comandos'] = fake_r50
        return env, entregas, delegados

    def test_como_o_usuario_fala_dispara_tudo(self):
        for frase in ('atualizar agora', 'atualiza agora', 'atualisa agora',
                      'atualise agora', 'atualizar o agente', 'atualize o agente',
                      'atualiza', 'atualize', 'atualizar'):
            env, entregas, delegados = self._env()
            with redirect_stdout(io.StringIO()):
                ok = env['_r62_comandos'](frase)
            self.assertTrue(ok, frase)
            self.assertEqual(entregas, [1], frase)
            self.assertEqual(delegados, [frase], frase)

    def test_nao_rouba_comandos_de_outros(self):
        for frase in ('atualizar o defender', 'atualizar antivirus',
                      'atualiza o windows', 'atualizar a semana'):
            env, _, _ = self._env()
            with redirect_stdout(io.StringIO()):
                self.assertFalse(env['_r62_comandos'](frase), frase)

    def test_r50_sozinha_tambem_entende_o_leigo(self):
        env = carregar('_r50_comandos', '_norm_pt', os=os)
        vistos = []
        env['_r50_atualizar_agente'] = lambda: vistos.append(1) or 'OK'
        for frase in ('atualiza agora', 'atualize o agente'):
            with redirect_stdout(io.StringIO()):
                self.assertTrue(env['_r50_comandos'](frase), frase)
        self.assertEqual(len(vistos), 2)


class Estrutura(unittest.TestCase):
    def test_menu_e_selo(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        self.assertIn("ATUALIZAR (r66): digite como vier", texto)
        self.assertEqual(texto.count('[Motor e avaliacao local 2026-09-11-r70]'), 1)
        # as duas condicoes (r62 e r50) aceitam a variante do incidente real
        self.assertEqual(texto.count("'atualizaagora'"), 3)  # 2 gatilhos + 1 do modo aviao (r67)


if __name__ == '__main__':
    unittest.main()
