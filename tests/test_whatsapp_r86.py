# -*- coding: utf-8 -*-
"""r86 — WHATSAPP DE VERDADE (aprimoramento no nível alto, pedido pelo dono).

Erros reais do log 14/09 (r85 no PC do dono):
1) 'manda whatsapp pro CORVOS DE CARTOLA OFC, ola tudo bem' — o separador
   VIRGULA entre nome e mensagem nao era reconhecido: o nome virou a frase
   inteira e o agente respondeu 'faltou a mensagem'.
2) 'mande menssagem pra +55 16 99132-8338, se vai jogar?' — nao existia rota
   para mandar direto para um NUMERO (sem nome); o comando caia na trava
   generica (e o typo 'menssagem' nem era reconhecido pelo detector).
3) 'salve esse contato +55 16 99132-8338' — as formas 'salve ...' nao eram
   gatilho de salvar contato: caia no modelo, que respondeu 'nao posso
   salvar contatos' (falso — a rota existia com 'salvar contato').
"""
import unittest

from test_roteamento_conversa import SOURCE as AGENTE_PY, carregar


def _fonte():
    with open(AGENTE_PY, encoding='utf-8') as f:
        return f.read()


class TestParseWhatsappR86(unittest.TestCase):

    def setUp(self):
        amb = carregar('_r86_parse_whatsapp')
        self.parse = amb['_r86_parse_whatsapp']

    def test_selo_avancou_pelo_r86(self):
        # canario do selo atual fica em test_r85_fixes; aqui so trava que a
        # release r86 JÁ saiu (o selo nunca volta atras)
        import re
        m = re.search(r'\[Motor e avaliacao local 2026-09-11-r(\d+)\]', _fonte())
        self.assertIsNotNone(m, 'selo ausente')
        self.assertGreaterEqual(int(m.group(1)), 86)

    def test_rota_usa_o_parse_puro(self):
        self.assertIn('_r86_parse_whatsapp(cmd)', _fonte())

    def test_nome_com_dois_pontos(self):
        self.assertEqual(self.parse('manda whatsapp pro Joao Iser: oi, tudo bem?'),
                         ('nome', 'joao iser', 'oi, tudo bem?'))

    def test_nome_com_virgula(self):
        # o caso exato do dono (14/09): grupo + virgula + mensagem
        self.assertEqual(self.parse('manda whatsapp pro CORVOS DE CARTOLA OFC, ola tudo bem'),
                         ('nome', 'corvos de cartola ofc', 'ola tudo bem'))

    def test_numero_com_virgula_pra(self):
        # o caso exato do dono (14/09): typo 'menssagem' + 'pra' + numero
        self.assertEqual(self.parse('mande menssagem pra +55 16 99132-8338, se vai jogar?'),
                         ('numero', '+55 16 99132-8338', 'se vai jogar?'))

    def test_numero_com_dois_pontos(self):
        self.assertEqual(self.parse('manda mensagem +55 16 99132-8338: oi'),
                         ('numero', '+55 16 99132-8338', 'oi'))

    def test_numero_sem_prefixo(self):
        self.assertEqual(self.parse('manda zap +55 16 99132-8338 oi, blz?'),
                         ('numero', '+55 16 99132-8338', 'oi, blz?'))

    def test_numero_dentro_da_mensagem_nao_vira_alvo(self):
        # 'pro Joao: te ligo no 11 99999-8888' -> alvo = Joao, numero fica na mensagem
        self.assertEqual(self.parse('manda whatsapp pro Joao: te ligo no 11 99999-8888'),
                         ('nome', 'joao', 'te ligo no 11 99999-8888'))

    def test_vazio(self):
        self.assertEqual(self.parse('manda whatsapp'), ('vazio', '', ''))

    def test_faltou_a_mensagem(self):
        self.assertEqual(self.parse('manda whatsapp pro Joao'), ('nome', 'joao', ''))

    def test_nao_sao_whatsapp(self):
        for c in ('abre o youtube', 'o que e whatsapp', 'status', 'diagnostico microfone'):
            with self.subTest(c=c):
                self.assertIsNone(self.parse(c))


class TestSalvarContatoR86(unittest.TestCase):

    def test_formas_salve_sao_gatilho(self):
        fonte = _fonte()
        for g in ('salve contato', 'salve esse contato', 'salvar esse contato',
                  'salve esse numero', 'salvar esse numero'):
            self.assertIn(g, fonte)

    def test_so_numero_pergunta_o_nome(self):
        # 'salve esse contato +55 16 99132-8338' (sem nome): pergunta uma vez
        fonte = _fonte()
        self.assertIn('Qual o nome para salvar', fonte)
        self.assertIn('"^\\+?\\d[\\d\\s()\\-]{8,}$"', fonte.replace('\\', '\\'))


class TestDetectorMenssagemR86(unittest.TestCase):

    def test_typo_menssagem_reconhecido(self):
        amb = carregar('_r85_parece_pedido_de_mensagem')
        f = amb['_r85_parece_pedido_de_mensagem']
        self.assertTrue(f('mande menssagem pra +55 16 99132-8338, se vai jogar?'))
        self.assertTrue(f('mande menssagem pro fulano'))
        self.assertFalse(f('abre o whatsapp web'))


if __name__ == '__main__':
    unittest.main()
