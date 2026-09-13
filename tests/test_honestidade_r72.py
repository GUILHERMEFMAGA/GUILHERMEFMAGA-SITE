"""r72 (A): o acabamento da honestidade — pergunta pessoal (meu/minha/eu...)
que NAO casou com fato ensinado e NAO tem rota NAO vai mais pro modelo dar
papo furado: o agente ensina a ensinar ('conhecimento ensinar...'). Chamada
no FIM do cerebro, depois de TODAS as rotas e ferramentas — nada e roubado.
Kill-switch: config 'dica_de_ensinar': false."""
import io
import json
import os
import tempfile
import unittest
from contextlib import redirect_stdout

from test_roteamento_conversa import carregar


def _env(*nomes):
    return carregar(*nomes, '_norm_pt', os=os, json=json)


class Honestidade(unittest.TestCase):
    def test_pergunta_pessoal_sem_fato_da_aula_de_ensinar(self):
        env = _env('_r72_honestidade')
        msg = env['_r72_honestidade']('qualonomedomeucachorro',
                                      'qual o nome do meu cachorro?')
        self.assertIn('[Honestidade r72]', msg)
        self.assertIn('voce nunca me ensinou', msg)
        self.assertIn('conhecimento ensinar', msg)
        self.assertIn('cachorro', msg)  # assunto extraido do 'meu <assunto>'

    def test_onde_eu_moro_sem_meu_tambem_e_pegue(self):
        env = _env('_r72_honestidade')
        msg = env['_r72_honestidade']('ondeeumoro', 'onde eu moro?')
        self.assertIn('NAO sei', msg)

    def test_sem_interrogacao_nao_intercepta_acao(self):
        env = _env('_r72_honestidade')
        for frase_n, frase in (('limpameupc', 'limpa meu pc'),
                               ('meuip', 'meu ip'),
                               ('abreminhapasta', 'abre minha pasta')):
            self.assertIsNone(env['_r72_honestidade'](frase_n, frase), frase)

    def test_menu_nao_e_pegue_pelo_meu(self):
        env = _env('_r72_honestidade')
        self.assertIsNone(env['_r72_honestidade']('menu', 'menu'))
        self.assertIsNone(env['_r72_honestidade']('qualmenu', 'qual menu'))

    def test_kill_switch_desliga_a_dica(self):
        # a funcao le o config DA CASA (PASTA_BASE); no teste, simulamos o
        # config.json com 'dica_de_ensinar': false injetando o leitor.
        env = _env('_r72_honestidade')

        def ler(chave, pasta=None, padrao=None):
            return False if chave == 'dica_de_ensinar' else padrao
        env['_r67_ler_config'] = ler
        self.assertIsNone(env['_r72_honestidade']('qualonomedomeucachorro',
                                                  'qual o nome do meu cachorro?'))

    def test_conta_os_topicos_guardados_quando_existem(self):
        env = _env('_r72_honestidade', '_r69_instalar_estado')
        env['_r69_instalar_estado']()['conhecimento'] = {
            'minha casa': [{'texto': 'x'}], 'meu gato': [{'texto': 'y'}]}
        msg = env['_r72_honestidade']('qualmeutelefone', 'qual o meu telefone?')
        self.assertIn('2 topico(s) guardados', msg)

    def test_pergunta_geral_nao_e_pegue(self):
        env = _env('_r72_honestidade')
        self.assertIsNone(env['_r72_honestidade']('qualacapitaldafranca',
                                                  'qual a capital da franca?'))
        self.assertIsNone(env['_r72_honestidade']('quemdescobriuobrasil',
                                                  'quem descobriu o brasil?'))


class Estrutura(unittest.TestCase):
    def test_o_gancho_mora_no_fim_do_cerebro_depois_de_tudo(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        inicio = texto.index('def _processar_cerebro_local')
        gancho = texto.index('_honesta72 = globals().get')
        fim = texto.find('\ndef ', inicio + 5)
        self.assertLess(inicio, gancho)
        self.assertLess(gancho, fim)
        # depois do despachante de ferramentas (rotas reais primeiro!)
        self.assertLess(texto.index('_despachar_ferramenta_local(comando)'), gancho)
        # r72 NAO tem entrada na cadeia principal (de proposito!)
        self.assertNotIn('if _r72_comandos(comando):', texto)
        self.assertIn('HONESTIDADE (r72)', texto)
        self.assertEqual(texto.count('[Motor e avaliacao local 2026-09-11-r72]'), 1)


if __name__ == '__main__':
    unittest.main()
