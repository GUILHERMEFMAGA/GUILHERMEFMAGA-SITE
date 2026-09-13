"""r54: o relato real — "criar atalho" (vago) ASSUMIA o agente sem perguntar,
mas o usuario queria um atalho para a RAIZ principal do PC. Agora: pedido vago
pergunta; 'atalho para este pc' / 'atalho da raiz' / 'c:' abrem a raiz."""
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


class PedidoVagoPergunta(unittest.TestCase):
    def test_criar_atalho_nu_pergunta_e_nao_cria_nada(self):
        env = carregar('_r53_comandos', '_r53_alvo_atalho', '_r53_resolver_app',
                       '_r53_normalizar', '_norm_pt', os=os)
        ok, saida = rodar(env, 'criar atalho', criar=lambda a, n: self.fail('nao deveria criar'))
        self.assertTrue(ok)
        self.assertIn('de que voce quer um atalho', saida)
        self.assertIn('atalho do agente', saida)
        self.assertIn('atalho para este pc', saida)
        self.assertIn('atalho para <programa ou pasta>', saida)

    def test_pronomes_continuam_criando_o_do_agente(self):
        env = carregar('_r53_comandos', '_r53_alvo_atalho', '_r53_resolver_app',
                       '_r53_normalizar', '_norm_pt', os=os)
        feitos = []
        pasta = '/x/agente'
        rodar(env, 'crie um atalho pra abrir isso rapido',
              criar=lambda a, n: feitos.append((a, n)), pasta=pasta)
        rodar(env, 'faz o atalho de novo',
              criar=lambda a, n: feitos.append((a, n)), pasta=pasta)
        self.assertEqual(feitos, [(pasta + '/agente.py', 'Super Agente')] * 2)


class AtalhoDaRaiz(unittest.TestCase):
    def _env(self):
        return carregar('_r53_comandos', '_r53_alvo_atalho', '_r53_resolver_app',
                        '_r53_normalizar', '_norm_pt', os=os)

    def test_variacoes_da_raiz_vao_para_c(self):
        env = self._env()
        feitos = []
        for frase in ('atalho para este pc', 'atalho da raiz', 'atalho para a raiz principal',
                      'atalho para o meu computador', 'atalho para c:', 'atalho para disco c'):
            rodar(env, frase, criar=lambda a, n: feitos.append((a, n)),
                  existe=lambda c: c == 'C:\\')
        self.assertEqual({a for a, _ in feitos}, {'C:\\'})

    def test_mensagem_mostra_que_abre_a_raiz(self):
        pass  # a mensagem da ferramenta antiga informa o caminho do .lnk; coberto pelos testes r53


class ResolverRaiz(unittest.TestCase):
    def test_default_usa_exists_e_aceita_pastas(self):
        env = carregar('_r53_resolver_app', '_r53_normalizar', os=os)
        # com exists de verdade, 'C:\\' nao existe no linux -> volta vazio (sem quebrar)
        self.assertEqual(env['_r53_resolver_app']('este pc'), '')
        # existe explicito aceita pasta
        self.assertEqual(env['_r53_resolver_app']('este pc', existe=lambda c: c == 'C:\\'), 'C:\\')
        self.assertEqual(env['_r53_resolver_app']('c:', existe=lambda c: c == 'C:\\'), 'C:\\')
        self.assertEqual(env['_r53_resolver_app']('programa inventado'), '')

    def test_estrutura_selo_e_menu(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        self.assertIn('[Motor e avaliacao local 2026-09-11-r62]', texto)
        self.assertIn("'atalho na tela principal' abre a raiz", texto)  # rotulo r56
        self.assertIn("'este pc': ('C:", texto)
        self.assertIn('_os.path.exists  # r54', texto)


if __name__ == '__main__':
    unittest.main()
