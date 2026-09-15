# -*- coding: utf-8 -*-
"""r98 — A DICA DO COMANDO: frase que parece comando local digitado de
outro jeito (a variacao do dono do PC, 15/09: o 'atualizar agora' que
escapou para o modelo e virou conversa) recebe uma dica LOCAL na hora —
sem mandar o que era acao para o chat do modelo.

Regras:
- palavra-chave de comando no texto normalizado -> dica com o comando
  canonico exato;
- frase CURTA (<=6 palavras) -> a dica CONSOME o comando (volta ao prompt,
  nao envia ao modelo — a pessoa queria uma acao);
- frase LONGA (pergunta de verdade que so meniona a palavra) -> dica + o
  modelo tambem responde (aprimorar sem apagar);
- texto com ':' (payload) ou vazio -> nenhuma dica.
"""
import unittest

from test_roteamento_conversa import SOURCE, carregar


class DicaComandoR98(unittest.TestCase):
    def setUp(self):
        amb = carregar('_r98_dica_comando', '_norm_pt')
        self.dica = amb['_r98_dica_comando']

    def test_variacao_atualizar_curtas(self):
        for texto in ('atualizar a versao', 'atualiza agora',
                      'Atualizar o agente agora', 'quero atualizar'):
            with self.subTest(texto=texto):
                r = self.dica(texto)
                self.assertIsNotNone(r, texto)
                self.assertIn('atualizar agora', r[0])
                self.assertTrue(r[1])  # curta -> consome

    def test_frase_longa_nao_consome(self):
        r = self.dica('voce acha que eu deveria atualizar o sistema essa semana mesmo com a prova de domingo?')
        self.assertIsNotNone(r)
        self.assertIn('atualizar agora', r[0])
        self.assertFalse(r[1])  # longa -> o modelo tambem responde

    def test_visao_sem_baixar(self):
        r = self.dica('ativa a visao')
        self.assertIsNotNone(r)
        self.assertIn('baixar visao', r[0])

    def test_payload_e_vazio_ignorados(self):
        self.assertIsNone(self.dica(''))
        self.assertIsNone(self.dica('   '))
        self.assertIsNone(self.dica('manda whatsapp pro Joao: oi'))
        self.assertIsNone(self.dica(None))
        self.assertIsNone(self.dica(123))

    def test_pergunta_comum_nao_gatilha(self):
        self.assertIsNone(self.dica('oi tudo bem'))
        self.assertIsNone(self.dica('quanto custa a gasolina hoje'))

    def test_wiring_no_loop_principal(self):
        fonte = SOURCE.read_text(encoding='utf-8')
        i = fonte.find('if processar_atalho_rapido(comando_usuario):')
        self.assertGreater(i, 0)
        trecho = fonte[i:i + 1200]
        self.assertIn('_r98_dica_comando(comando_usuario)', trecho)
        self.assertIn('_dica98[1]', trecho)  # o consome
