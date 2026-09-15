# -*- coding: utf-8 -*-
"""r85 — as 3 correcoes do log real 14/09 (PC do dono, r83->r84).

1) CAULE 'DIAGNOST': a rota do diagnostico de microfone agora cobre o verbo
   conjugado ('diagnostica o microfone') — coberto em
   test_rota_microfone_robusta_r84.py (condicao).
2) ATUALIZAR FALA: no r50 a troca do agente.py acontecia EM SILENCIO
   (os._exit antes do print): o dono veia os 3 [OK] do lancador
   ('main.py ja esta em dia') e achou que nada foi trocado — na verdade o
   agente tinha sido trocado (por isso o boot seguinte ja era r83).
3) MANDAR MENSAGEM: o dono digitou 'Mande o messagem pro Joao Iser' e a
   trava generica r70 respondeu 'se quiser, adicione essa acao' — a acao
   JA existe e funciona 100% local ('manda whatsapp pro NOME: mensagem').
   Agora a trava aponta o comando certo.
"""
import os
import tempfile
import unittest

from test_roteamento_conversa import SOURCE as AGENTE_PY, carregar


def _fonte():
    with open(AGENTE_PY, encoding='utf-8') as f:
        return f.read()


class TestAtualizarFalaAntesDeFecharR85(unittest.TestCase):

    def test_selo_r98(self):
        self.assertEqual(_fonte().count('[Motor e avaliacao local 2026-09-11-r98]'), 1)

    def test_imprime_antes_de_reiniciar(self):
        # a mensagem da troca tem que aparecer ANTES do Popen/os._exit
        fonte = _fonte()
        i_msg = fonte.find("O agente vai reiniciar em 2 segundos para aplicar")
        i_pop = fonte.find("subprocess.Popen([_sys.executable, origem])")
        i_exit = fonte.find("os._exit(0)")
        self.assertNotEqual(i_msg, -1, 'mensagem da troca r85 ausente')
        self.assertLess(i_msg, i_pop, 'a mensagem precisa vir antes do Popen')
        self.assertLess(i_msg, i_exit, 'a mensagem precisa vir antes do os._exit')

    def test_troca_funciona_com_reinicio_injetado(self):
        # o fluxo real (troca + backup) testado com reiniciar injetado
        amb = carregar('_r50_atualizar_agente', os=os)
        f = amb['_r50_atualizar_agente']
        pasta = tempfile.mkdtemp()
        origem = os.path.join(pasta, 'agente.py')
        backup = origem + '_backup.py'
        with open(origem, 'w', encoding='utf-8') as fh:
            fh.write('antigo' * 10000)
        reiniciou = []
        saida = f(
            downloader=lambda: ('novo' * 20000).encode('utf-8'),
            confirmar=lambda msg: True,
            reiniciar=lambda: reiniciou.append(1),
            origem=origem, backup=backup,
        )
        self.assertTrue(reiniciou, 'reiniciar() nao foi chamado')
        with open(origem, encoding='utf-8') as fh:
            self.assertTrue(fh.read().startswith('novo'))
        with open(backup, encoding='utf-8') as fh:
            self.assertTrue(fh.read().startswith('antigo'))
        self.assertIn('troquei o agente.py', saida)


class TestPedidoDeMensagemR85(unittest.TestCase):

    def test_funcao_pura_existe(self):
        amb = carregar('_r85_parece_pedido_de_mensagem')
        self.assertTrue(callable(amb['_r85_parece_pedido_de_mensagem']))

    def test_formas_de_mandar_mensagem(self):
        amb = carregar('_r85_parece_pedido_de_mensagem')
        f = amb['_r85_parece_pedido_de_mensagem']
        positivos = [
            'Mande o messagem pro João Iser',   # o comando exato do dono (14/09)
            'manda mensagem pro joao',
            'manda whatsapp pro joao: oi',
            'envia mensagem pro fulano: tudo bem',
            'mandar zap pra Maria',
            'passe uma mensagem pro pai',
        ]
        for c in positivos:
            with self.subTest(c=c):
                self.assertTrue(f(c), 'deveria reconhecer: ' + c)

    def test_comandos_que_nao_sao_mensagem(self):
        amb = carregar('_r85_parece_pedido_de_mensagem')
        f = amb['_r85_parece_pedido_de_mensagem']
        negativos = [
            'abre o whatsapp web',          # abre o site, nao manda mensagem
            'salvar contato Joao: 11 99999-9999',
            'meus contatos',
            'o que e mensagem',
            'diagnostico microfone',
            'atualizar agora',
        ]
        for c in negativos:
            with self.subTest(c=c):
                self.assertFalse(f(c), 'NUNCA deve casar: ' + c)

    def test_trava_mostra_o_comando_certo(self):
        # a trava r70, no caso de mensagem, aponta o comando real
        fonte = _fonte()
        self.assertIn('manda whatsapp pro NOME: a mensagem', fonte)
        self.assertIn('_r85_parece_pedido_de_mensagem(comando)', fonte)


if __name__ == '__main__':
    unittest.main()
