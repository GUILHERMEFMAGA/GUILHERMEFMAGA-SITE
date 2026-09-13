"""r56: "crie um atalho na tela principal" (relato real) caia na pergunta —
o parser so entendia "atalho para/pro/pra/do/da/de". Agora: marcadores
"atalho na/no", 'tela principal' = raiz C:\, desktop/area de trabalho =
pasta do Desktop, e programa/pasta desconhecidos PERGUNTAM em vez de criar
atalho quebrado."""
import io
import os
import unittest
from contextlib import redirect_stdout

from test_roteamento_conversa import carregar


def rodar(env, *args, **kwargs):
    tampao = io.StringIO()
    with redirect_stdout(tampao):
        ok = env['_r53_comandos'](*args, **kwargs)
    return ok, tampao.getvalue()


class FraseDoRelato(unittest.TestCase):
    def _env(self):
        return carregar('_r53_comandos', '_r53_alvo_atalho', '_r53_resolver_app',
                        '_r53_parece_caminho', '_r53_normalizar', '_norm_pt', os=os)

    def test_atalho_na_tela_principal_abre_a_raiz(self):
        env = self._env()
        feitos = []
        ok, _ = rodar(env, 'crie um atalho na tela principal',
                      criar=lambda a, n: feitos.append((a, n)),
                      existe=lambda c: c == 'C:\\')
        self.assertTrue(ok)
        self.assertEqual(feitos, [('C:\\', 'tela principal')])

    def test_variacoes_tela_e_na_no(self):
        env = self._env()
        alvo = env['_r53_alvo_atalho']
        self.assertEqual(alvo('atalho na tela principal'), 'tela principal')
        self.assertEqual(alvo('atalho no vscode'), 'vscode')
        self.assertEqual(alvo('atalho na area de trabalho'), 'area de trabalho')
        self.assertEqual(env['_r53_resolver_app']('tela do pc', existe=lambda c: c == 'C:\\'), 'C:\\')
        self.assertEqual(env['_r53_resolver_app']('tela do computador',
                                                  existe=lambda c: c == 'C:\\'), 'C:\\')
        desktop = env['_r53_resolver_app']('desktop', existe=lambda c: c.endswith('Desktop'))
        self.assertTrue(desktop.endswith('Desktop'))
        self.assertEqual(env['_r53_resolver_app']('area de trabalho',
                                                  existe=lambda c: c.endswith('Desktop')),
                         desktop)

    def test_desconhecido_pergunta_e_nao_cria_atalho_quebrado(self):
        env = self._env()
        ok, saida = rodar(env, 'atalho para foobar',
                          criar=lambda a, n: self.fail('nao deveria criar'),
                          existe=lambda c: False)
        self.assertTrue(ok)
        self.assertIn('nao reconheci', saida)
        self.assertIn('caminho completo', saida)
        self.assertIn('programa conhecido', saida)

    def test_caminho_desconhecido_continua_passando_cru(self):
        env = self._env()
        feitos = []
        rodar(env, 'atalho para C:/Users/voce/Downloads',
              criar=lambda a, n: feitos.append((a, n)), existe=lambda c: False)
        # o normalizador (desde a r53) traz em minusculas; no Windows caminho e case-insensitive
        self.assertEqual(feitos, [('c:/users/voce/downloads', 'c:/users/voce/downloads')])


class Estrutura(unittest.TestCase):
    def test_menu_selo_e_guardas(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        self.assertIn('[Motor e avaliacao local 2026-09-11-r66]', texto)
        self.assertIn("'atalho na tela principal' abre a raiz", texto)
        self.assertIn("'tela principal': ('C:", texto)
        self.assertIn("def _r53_parece_caminho", texto)
        self.assertIn("'atalho na ', 'atalho no '", texto)


if __name__ == '__main__':
    unittest.main()
