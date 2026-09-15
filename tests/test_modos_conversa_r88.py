# -*- coding: utf-8 -*-
"""r88 — MODO CONVERSA WHATSAPP (conversa infinita em segundo plano).

Pedido do dono (14/09): "modo de interação onde ele consegue falar
conversando no WhatsApp infinitamente e lendo a conversa e respondendo...
mesmo eu estando fazendo um monte de coisa no PC... mesmo eu não estando na
aba do WhatsApp... com humor humano... biologicamente [natural]".

Como funciona (o que o código já tinha + o que a r88 acrescenta):
- O app do WhatsApp é controlado via pyautogui (caminho provado da r86).
- A TELA é lida por VISÃO (r88: leitor em ordem — visao local r76 100%
  offline, depois Gemini na nuvem) — a conversa vira JSON
  {"mensagens":[{"de":"eu"|"outro",...}]}.
- A RESPOSTA é composta pela IA local primeiro (privado/offline/custo zero)
  ou pela nuvem; a persona é de gente de verdade no WhatsApp: curto,
  direto, humor leve, sem cara de robot.
- Tudo roda numa THREAD DE FUNDO: o dono segue usando o PC (YouTube etc.);
  a cada intervalo o modo foca o WhatsApp, lê, decide e responde.
- 'para de conversa' para na hora; 'status do modo conversa' mostra o
  estado; kill-switch 'modo_conversa_wpp' no config.json.

+ correção do log real 14/09: 'quantos contatos eu tenho' caía no modelo
  (que respondeu 'não tenho acesso' — falso) — agora vai na rota local.
"""
import unittest
import re

from test_roteamento_conversa import SOURCE as AGENTE_PY, carregar


def _fonte():
    with open(AGENTE_PY, encoding='utf-8') as f:
        return f.read()


class TestSeloR88(unittest.TestCase):
    def test_selo_r88_avanco(self):
        # selo do arquivo de release: pode avancar (r89+), nunca voltar
        m = re.search(r'Motor e avaliacao local 2026-09-11-r(\d+)', _fonte())
        self.assertIsNotNone(m)
        self.assertGreaterEqual(int(m.group(1)), 88)

    def test_fix_quantos_contatos(self):
        # 'quantos contatos eu tenho' (log real 14/09) vai na rota local
        self.assertIn('"quantos contatos"', _fonte())


class TestExtrairUltimaExterna(unittest.TestCase):
    def setUp(self):
        self.f = carregar('_r88_extrair_ultima_externa')['_r88_extrair_ultima_externa']

    def test_json_limpo(self):
        t = ('{"mensagens":[{"de":"eu","texto":"oi","hora":"14:00"},'
             '{"de":"outro","texto":"tudo bem?","hora":"14:01"}]}')
        self.assertEqual(self.f(t), ("tudo bem?", "14:01"))

    def test_ultima_da_outra_pessoa_e_a_respondida(self):
        # a última mensagem é SUA -> responde a última do OUTRO (a anterior)
        t = ('{"mensagens":[{"de":"outro","texto":"vamos jogar?","hora":"14:01"},'
             '{"de":"eu","texto":"bora!","hora":"14:02"}]}')
        self.assertEqual(self.f(t), ("vamos jogar?", "14:01"))

    def test_json_embrulhado_em_comentario(self):
        t = ('Claro! Aqui está o JSON:\n{"mensagens":[{"de":"outro",'
             '"texto":"kkk boa","hora":"14:05"}]}\nEspero ter ajudado.')
        self.assertEqual(self.f(t), ("kkk boa", "14:05"))

    def test_somente_mensagens_suas(self):
        t = '{"mensagens":[{"de":"eu","texto":"oi","hora":"14:00"}]}'
        self.assertEqual(self.f(t), (None, None))

    def test_vazio(self):
        self.assertEqual(self.f(''), (None, None))
        self.assertEqual(self.f(None), (None, None))

    def test_json_invalido(self):
        self.assertEqual(self.f('isso nao e json'), (None, None))
        self.assertEqual(self.f('{"mensagens": ['), (None, None))


class TestDecidir(unittest.TestCase):
    def setUp(self):
        self.f = carregar('_r88_decidir')['_r88_decidir']

    def test_mensagem_nova_responde(self):
        d, m = self.f('oi, tudo bem?', '14:01', {})
        self.assertEqual(d, 'responder')

    def test_mesma_mensagem_ignora(self):
        d, m = self.f('oi, tudo bem?', '14:01', {'tratada': ['oi, tudo bem?', '14:01']})
        self.assertEqual(d, 'ignorar')

    def test_mesmo_texto_hora_diferente_responde(self):
        # 'kkk' repetido em outro minuto = mensagem nova de verdade
        d, m = self.f('kkk', '14:05', {'tratada': ['kkk', '14:02']})
        self.assertEqual(d, 'responder')

    def test_sem_texto_ignora(self):
        d, m = self.f('', '14:01', {})
        self.assertEqual(d, 'ignorar')
        d, m = self.f(None, None, None)
        self.assertEqual(d, 'ignorar')


class TestPromptResposta(unittest.TestCase):
    def setUp(self):
        self.f = carregar('_r88_prompt_resposta')['_r88_prompt_resposta']

    def test_persona_humana(self):
        msgs = self.f('Joao Iser', 'contexto aq', 'vamos jogar hoje?')
        self.assertEqual(len(msgs), 2)
        self.assertEqual(msgs[0]['role'], 'system')
        s = msgs[0]['content']
        self.assertIn('humor', s)
        self.assertIn('WhatsApp', s)
        self.assertIn('SOMENTE com o texto da mensagem', s)
        u = msgs[1]['content']
        self.assertIn('Joao Iser', u)
        self.assertIn('vamos jogar hoje?', u)
        self.assertIn('contexto aq', u)


class TestDormirELoop(unittest.TestCase):
    def setUp(self):
        amb = carregar('_r88_dormir', '_r88_loop_conversa')
        self.dormir = amb['_r88_dormir']
        self.loop = amb['_r88_loop_conversa']

    def test_dormir_parado_nao_dorme(self):
        sleeps = []
        self.dormir(5, lambda: True, dormir=lambda s: sleeps.append(s))
        self.assertEqual(sleeps, [])

    def test_dormir_fatias(self):
        sleeps = []
        self.dormir(3, lambda: False, dormir=lambda s: sleeps.append(s))
        self.assertEqual(sleeps, [1.0, 1.0, 1.0])

    def test_loop_executa_ciclos_ate_parar(self):
        ciclos, logs = [], []
        cont = {'n': 0}

        def parar():
            return cont['n'] >= 2

        def ciclo():
            cont['n'] += 1
            ciclos.append(1)

        self.loop(parar, 1, ciclo, lambda m: logs.append(m),
                  dormir=lambda s: None)
        self.assertEqual(len(ciclos), 2)
        self.assertTrue(any('parado' in l for l in logs))

    def test_loop_erro_no_ciclo_nao_mata(self):
        ciclos, logs = [], []
        cont = {'n': 0}

        def parar():
            return cont['n'] >= 2

        def ciclo_ruim():
            cont['n'] += 1
            raise ValueError('boom')

        self.loop(parar, 1, ciclo_ruim, lambda m: logs.append(m), dormir=lambda s: None)
        self.assertEqual(len(logs), 3)  # 2 erros (um por ciclo) + 1 'parado'
        self.assertEqual(sum('ValueError' in l for l in logs), 2)
        self.assertTrue(any('parado' in l for l in logs))


class TestWiringR88(unittest.TestCase):
    def test_rotas_modo_conversa(self):
        fonte = _fonte()
        self.assertIn('"modo conversa"', fonte)
        self.assertIn('"paradeconversar"', fonte)
        self.assertIn('"statusdomodoconversa"', fonte)

    def test_formas_naturais_de_parar(self):
        # o dono pergunta 'e no caso para parar de interagir?' — as formas
        # naturais de parar estao todas no gatilho
        fonte = _fonte()
        for g in ('"paradeconversar"', '"paradeconversa"', '"paraconversa"',
                  '"paramodoconversa"', '"paraomodoconversa"',
                  '"sairdomodoconversa"', '"desligamodoconversa"',
                  '"desligaromodoconversa"', '"parawhatsapp"',
                  '"paradeinteragir"', '"parainteragir"', '"paraderesponder"',
                  '"pararesponder"', '"paraainteracao"', '"parainteracao"',
                  '"pararinteracao"', '"paradeinteragirnaconversa"'):
            self.assertIn(g, fonte)

    def test_kill_switch(self):
        self.assertIn('modo_conversa_wpp', _fonte())

    def test_thread_daemon(self):
        self.assertIn('daemon=True', _fonte())

    def test_leitores_em_ordem(self):
        # dentro do _r88_gerente_leitura: visao local (r76) primeiro, Gemini depois
        fonte = _fonte()
        i_funcao = fonte.find('def _r88_gerente_leitura')
        self.assertNotEqual(i_funcao, -1)
        i_fim = fonte.find('\n\ndef ', i_funcao)
        corpo = fonte[i_funcao:i_fim if i_fim != -1 else len(fonte)]
        i_local = corpo.find('_r76_visao_achar_modelo()')
        i_gemini = corpo.find('os.environ.get("GEMINI_API_KEY"')
        self.assertNotEqual(i_local, -1)
        self.assertNotEqual(i_gemini, -1)
        self.assertLess(i_local, i_gemini)

    def test_resposta_local_primeiro(self):
        fonte = _fonte()
        i_funcao = fonte.find('def _r88_gerar_resposta')
        i_local = fonte.find('ia_local_disponivel', i_funcao)
        i_nuvem = fonte.find('invocar_com_fallback', i_funcao)
        self.assertLess(i_local, i_nuvem)

    def test_estado_local(self):
        self.assertIn('modo_conversa.json', _fonte())

    def test_interaja_com_gatilho(self):
        # log real r89: 'intareja com Náutica gooner' (typo real do dono)
        # caia no modelo — a forma natural 'interaja com NOME' agora abre
        # o MODO CONVERSA (check startswith + extracao do alvo, 2 tuplas)
        fonte = _fonte()
        for g in ('"interaja com"', '"interage com"', '"interagir com"',
                  '"intareja com"'):
            self.assertGreaterEqual(fonte.count(g), 2, g)


class TestLeitorR92(unittest.TestCase):
    """r92: cego o modo conversa NAO mexe na tela (log real 14/09: sem
    leitor, o modo puxava o WhatsApp a frente a cada 30s — dono no
    YouTube) + diagnostico honesto no inicio."""

    def setUp(self):
        amb = carregar('_r92_diagnosticar_leitor')
        self.diag = amb['_r92_diagnosticar_leitor']

    def test_visao_local_no_ar(self):
        self.assertIsNone(self.diag(True, True, False))

    def test_gemini_no_ar(self):
        self.assertIsNone(self.diag(False, False, True))

    def test_modelo_sem_servidor(self):
        msg = self.diag(True, False, False)
        self.assertIsNotNone(msg)
        self.assertIn('SERVIDOR', msg)

    def test_sem_nada(self):
        msg = self.diag(False, False, False)
        self.assertIsNotNone(msg)
        self.assertIn('GEMINI_API_KEY', msg)
        self.assertIn('visao', msg)

    def test_ciclo_verifica_leitor_antes_de_focar(self):
        fonte = _fonte()
        i_ciclo = fonte.find('def _r88_ciclo')
        i_checagem = fonte.find('_r92_leitor_pronto()', i_ciclo)
        i_foco = fonte.find('_r88_focar_wpp()', i_ciclo)
        self.assertNotEqual(i_checagem, -1)
        self.assertLess(i_checagem, i_foco)

    def test_inicio_avisa_sem_leitor(self):
        fonte = _fonte()
        i_iniciar = fonte.find('if cmd.startswith(("modo conversa whatsapp"')
        i_checagem = fonte.find('_r92_leitor_pronto()', i_iniciar)
        i_abrir = fonte.find("Abrindo a conversa com", i_iniciar)
        self.assertNotEqual(i_checagem, -1)
        self.assertLess(i_checagem, i_abrir)


if __name__ == '__main__':
    unittest.main()
