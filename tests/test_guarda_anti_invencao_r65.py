"""r65: guarda anti-invencao — a vacina contra o 'renomeia pra .exe'. Pergunta
de FALHA sobre a casa (agente/iniciar/main.py) que nenhuma rota de fatos
pegou NAO chega ao modelo bruto: ou mostra o diagnostico real do disco (r61),
ou responde com honestidade. O GGUF e otimo pra conversa; sobre ESTE PC ele
nao chuta mais."""
import io
import os
import unittest
from contextlib import redirect_stdout

from test_roteamento_conversa import carregar


class Guarda(unittest.TestCase):
    def test_falha_da_casa_mostra_o_diagnostico_real(self):
        env = carregar('_r65_comandos', '_norm_pt', os=os)

        def diagnostico():
            return ('Diagnostico de arranque em: C:\\agente_pc\n'
                    '[PROBLEMA] main.py NAO EXISTE nesta pasta\n'
                    '[OK] agente.py compila\n')
        env['_r61_diagnostico_iniciar'] = diagnostico
        tampao = io.StringIO()
        with redirect_stdout(tampao):
            ok = env['_r65_comandos']('o agente não abre')
        self.assertTrue(ok)
        saida = tampao.getvalue()
        self.assertIn('[PROBLEMA] main.py NAO EXISTE nesta pasta', saida)
        self.assertIn('nunca com chute', saida)
        self.assertIn("'atualizar agora'", saida)

    def test_frases_que_a_r61_nao_pega_caiem_aqui(self):
        env = carregar('_r65_comandos', '_norm_pt', os=os)
        env['_r61_diagnostico_iniciar'] = lambda: 'FATOS'
        for frase in ('o agente não está funcionando', 'o iniciar ta quebrado',
                      'o agente não abre de jeito nenhum', 'main.py não liga',
                      'o agente não responde'):
            tampao = io.StringIO()
            with redirect_stdout(tampao):
                ok = env['_r65_comandos'](frase)
            self.assertTrue(ok, frase)
            self.assertIn('FATOS', tampao.getvalue(), frase)

    def test_sem_r61_disponivel_responde_honesto_sem_chute(self):
        env = carregar('_r65_comandos', '_norm_pt', os=os)
        tampao = io.StringIO()
        with redirect_stdout(tampao):
            ok = env['_r65_comandos']('o agente não abre')
        self.assertTrue(ok)
        self.assertIn('nunca com chute', tampao.getvalue())

    def test_conversa_normal_passa_ilesa(self):
        env = carregar('_r65_comandos', '_norm_pt', os=os)
        for frase in ('como desenhar um gato', 'status', 'o agente desenhou torto',
                      'agendar tarefa para amanha', 'minha bateria nao passa de 10',
                      'conte uma piada'):
            with redirect_stdout(io.StringIO()):
                self.assertFalse(env['_r65_comandos'](frase), frase)


class Estrutura(unittest.TestCase):
    def test_cadeia_menu_e_selo(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        # r61 primeiro (rota dedicada); r65 pega o que sobrou; r53 depois
        self.assertLess(texto.index('if _r61_comandos(comando):'),
                        texto.index('if _r65_comandos(comando):'))
        self.assertLess(texto.index('if _r65_comandos(comando):'),
                        texto.index('if _r53_comandos(comando):'))
        self.assertIn('HONESTIDADE (r65)', texto)
        self.assertEqual(texto.count('[Motor e avaliacao local 2026-09-11-r71]'), 1)


if __name__ == '__main__':
    unittest.main()
