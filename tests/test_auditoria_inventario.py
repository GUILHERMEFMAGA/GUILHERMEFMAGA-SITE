import unittest
from scripts.auditar_ferramentas import auditar
from test_roteamento_conversa import SOURCE


class AuditoriaInventario(unittest.TestCase):
    def test_distingue_registro_e_corpo_repetidos(self):
        fonte = '''
def primeira():
    """Primeira documentacao."""
    return 1

def segunda():
    """Segunda documentacao."""
    return 1

tools = [primeira, segunda, primeira, ausente]
'''
        nomes, funcoes, identicos, _ = auditar(fonte)
        self.assertEqual(nomes.count('primeira'), 2)
        self.assertNotIn('ausente', funcoes)
        self.assertTrue(any('primeira' in g and 'segunda' in g for g in identicos))

    def test_registro_atual_sem_nomes_repetidos_ou_ausentes(self):
        nomes, funcoes, _, _ = auditar(SOURCE.read_text())
        # r21: +1; r22 lote 1: +20; r23: +49 (matematica/fisica/datas/numeros/financas/capacidades).
        self.assertEqual(len(nomes), 589)
        self.assertEqual(len(nomes), len(set(nomes)))
        self.assertFalse(set(nomes) - set(funcoes))


if __name__ == '__main__':
    unittest.main()
