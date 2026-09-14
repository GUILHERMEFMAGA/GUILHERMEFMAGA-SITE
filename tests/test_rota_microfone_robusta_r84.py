# -*- coding: utf-8 -*-
"""r84 — DIAGNÓSTICO DE MICROFONE ENTENDE O PORTUGUÊS NATURAL.

Bug real do PC do dono (log 14/09, r83): a rota da r83 só casava
'diagnostico microfone' exato; o dono digitou a forma natural
('diagnostico de/do microfone') e o comando ESCAPOU para o modelo, que
respondeu 'não tenho acesso a informações do microfone'. Correção: condição
robusta por palavras (diagnostico/testar + microfone, ou microfone no início),
sem ordem fixa e sem preposições.
"""
import unittest

from test_roteamento_conversa import SOURCE as AGENTE_PY, carregar


def _fonte():
    with open(AGENTE_PY, encoding='utf-8') as f:
        return f.read()


def _condicao_rota(n):
    # replica EXATA da condição da rota em agente.py (r84)
    return (('diagnostico' in n and 'microfone' in n)
            or ('testar' in n and 'microfone' in n)
            or n.startswith('microfone'))


class TestRotaMicrofoneRobustaR84(unittest.TestCase):

    def test_selo_r84(self):
        self.assertEqual(_fonte().count('[Motor e avaliacao local 2026-09-11-r84]'), 1)

    def test_condicao_na_fonte(self):
        self.assertIn("(('diagnostico' in n and 'microfone' in n) or ('testar' in n and 'microfone' in n)\n"
                      "            or n.startswith('microfone')):", _fonte())

    def test_formas_naturais_brasileiras_casam(self):
        amb = carregar('_norm_pt')
        n = amb['_norm_pt']
        formas = [
            'diagnostico microfone',
            'diagnostico de microfone',
            'diagnostico do microfone',
            'Diagnostico Microfone',
            'diagnostico  microfone',
            'diagnostico-microfone',
            'testar microfone',
            'testar o microfone',
            'microfone',
            'microfone nao esta funcionando',
        ]
        for f in formas:
            with self.subTest(f=f):
                self.assertTrue(_condicao_rota(n(f)), 'deveria casar: ' + f)

    def test_comandos_normais_nao_sao_roubados(self):
        amb = carregar('_norm_pt')
        n = amb['_norm_pt']
        livres = [
            'falar',
            'baixar stt',
            'stt',
            'abre o youtube',
            'atualizar agora',
            'tabela MEU PC: CPU, RAM | i5, 16GB',
            'o que e um microfone',          # pergunta -> modelo (sem diagnostico/testar)
            'ligar ia',
        ]
        for f in livres:
            with self.subTest(f=f):
                self.assertFalse(_condicao_rota(n(f)), 'NUNCA deve roubar: ' + f)


if __name__ == '__main__':
    unittest.main()
