"""r46: instantaneo de verdade — o agente passa a ser carregado como MODULO
via main.py, para o Python usar o cache de bytecode (__pycache__). Script
rodado direto (python agente.py) e recompilado a cada abertura (custo medido
no sandbox: ~0,3 s por duplo clique). Verificacao estrutural: texto do
main.py/BAT, AST do agente (loop de conversa no nivel do modulo = import roda
o app completo) e .gitignore. Sem rede, sem GGUF, sem executar o agente."""
import ast
import io
import unittest

from test_roteamento_conversa import SOURCE


def texto(caminho):
    with io.open(caminho, encoding='utf-8') as f:
        return f.read()


class LancadorMain(unittest.TestCase):
    def test_main_existe_e_só_importa_o_agente(self):
        corpo = texto(str(SOURCE.parent / 'main.py'))
        self.assertIn('import agente', corpo)
        self.assertIn('__pycache__', corpo)  # explica o porque no comentario
        # nada pesado no lancador: so import (1 statement de carga)
        arvore = ast.parse(corpo)
        cargas = [n for n in arvore.body if isinstance(n, (ast.Import, ast.ImportFrom))]
        self.assertEqual(len(cargas), 1)
        self.assertEqual(cargas[0].names[0].name, 'agente')

    def test_bat_usa_o_lancador_e_explica(self):
        bat = texto(str(SOURCE.parent / 'iniciar.bat'))
        self.assertIn('python main.py', bat)
        self.assertNotIn('python agente.py\n', bat)
        self.assertIn('__pycache__', bat)

    def test_import_agente_roda_o_app_completo(self):
        """O loop de conversa esta no NIVEL DO MODULO do agente.py — provar
        que importar executa o mesmo programa que rodar direto (banner+loop)."""
        with io.open(str(SOURCE), encoding='utf-8') as f:
            arvore = ast.parse(f.read())
        loops_topo = [n for n in arvore.body
                      if isinstance(n, ast.While)
                      and isinstance(n.test, ast.Constant)
                      and n.test.value is True]
        self.assertTrue(loops_topo, 'while True: de conversa deve estar no nivel do modulo')

    def test_pycache_nao_vira_commit(self):
        gitignore = texto(str(SOURCE.parent / '.gitignore'))
        self.assertIn('__pycache__/', gitignore)

    def test_selo_r46_no_banner(self):
        self.assertIn('[Motor e avaliacao local 2026-09-11-r46]', texto(str(SOURCE)))


if __name__ == '__main__':
    unittest.main()
