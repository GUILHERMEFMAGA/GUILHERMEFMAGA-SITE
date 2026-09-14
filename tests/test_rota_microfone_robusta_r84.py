# -*- coding: utf-8 -*-
"""r85 — DIAGNÓSTICO DE MICROFONE ENTENDE O PORTUGUÊS NATURAL.

Bug real do PC do dono (log 14/09, r83): a rota da r83 só casava
'diagnostico microfone' exato; o dono digitou a forma natural
('diagnostico de/do microfone') e o comando ESCAPOU para o modelo, que
respondeu 'não tenho acesso a informações do microfone'. Correção r84:
condição robusta por palavras (diagnostico/testar + microfone, ou
microfone no início). r85: o caule 'diagnost' cobre também o verbo
conjugado ('diagnostica o microfone').
"""
import unittest

from test_roteamento_conversa import SOURCE as AGENTE_PY, carregar


def _fonte():
    with open(AGENTE_PY, encoding='utf-8') as f:
        return f.read()


def _condicao_rota(n):
    # replica EXATA da condição da rota em agente.py (r85: caule 'diagnost')
    return (('diagnost' in n and 'microfone' in n)
            or ('testar' in n and 'microfone' in n)
            or n.startswith('microfone'))


class TestRotaMicrofoneRobustaR84(unittest.TestCase):

    def test_selo_r85(self):
        self.assertEqual(_fonte().count('[Motor e avaliacao local 2026-09-11-r90]'), 1)

    def test_condicao_na_fonte(self):
        self.assertIn("(('diagnost' in n and 'microfone' in n) or ('testar' in n and 'microfone' in n)\n"
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
            'diagnostica o microfone',      # r85: verbo conjugado
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
            'diagnostico do sistema',        # sem 'microfone': nao e a rota do microfone
            'ligar ia',
        ]
        for f in livres:
            with self.subTest(f=f):
                self.assertFalse(_condicao_rota(n(f)), 'NUNCA deve roubar: ' + f)


if __name__ == '__main__':
    unittest.main()
