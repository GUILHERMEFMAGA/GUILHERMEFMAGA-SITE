"""r70: FORA DO PADRAO — o que empresas de IA nao fizeram: (1) FATOS ANTES DO
MODELO (RAG caseiro TF-IDF responde na hora o que voce ensinou, com fonte);
(2) REVISOR DE 2a PASSADA em toda resposta do modelo local (anti-evasiva:
'sou apenas uma ia' e MENTIRA nesta casa; anti-repeticao; aviso de corte);
(3) dica do proximo comando por bigramas do SEU padrao; (4) modo detalhado
(config explicita vence o teto turbo); (5) 'o que voce sabe sobre X'."""
import io
import os
import unittest
from contextlib import redirect_stdout

from test_roteamento_conversa import carregar


def _env(*nomes):
    return carregar(*nomes, '_norm_pt', os=os, json=__import__('json'))


class RAGCaseiro(unittest.TestCase):
    def test_recuperar_ranqueia_por_overlap(self):
        env = _env('_r70_tokenizar', '_r70_recuperar_fatos', '_r69_instalar_estado')
        st = env['_r69_instalar_estado']()
        st['conhecimento'] = {
            'minha casa': [{'texto': 'moro em Ribeirao Preto'}],
            'meu carro': [{'texto': 'dirijo um carro azul'}]}
        pares = env['_r70_recuperar_fatos']('onde eu moro agora?', st=st)
        self.assertTrue(pares)
        self.assertEqual(pares[0][0], 'minha casa')
        self.assertEqual(env['_r70_recuperar_fatos']('quantos planetas tem', st=st)[0][2], 0.0)

    def test_responder_por_fato_com_fonte_e_limiar(self):
        env = _env('_r70_tokenizar', '_r70_recuperar_fatos', '_r70_responder_por_fato',
                   '_r69_instalar_estado')
        st = env['_r69_instalar_estado']()
        st['conhecimento'] = {'minha casa': [{'texto': 'moro em Ribeirao Preto'}]}
        resposta = env['_r70_responder_por_fato']('onde eu moro?', st=st)
        self.assertIn('fonte: "minha casa"', resposta)
        self.assertIn('Ribeirao Preto', resposta)
        self.assertIn('nada de invencao', resposta)
        self.assertIsNone(env['_r70_responder_por_fato']('qual a capital da franca', st=st))

    def test_o_que_sei_sobre_rota(self):
        env = _env('_r70_comandos', '_r69_instalar_estado')
        env['_r69_instalar_estado']()['conhecimento'] = {
            'meu gato': [{'texto': 'chama Bolinho'}]}
        with redirect_stdout(io.StringIO()) as saida:
            self.assertTrue(env['_r70_comandos']('o que voce sabe sobre gato'))
        self.assertIn('Bolinho', saida.getvalue())
        with redirect_stdout(io.StringIO()) as saida:
            self.assertTrue(env['_r70_comandos']('o que voce sabe sobre foguete'))
        self.assertIn('Nada ensinado', saida.getvalue())


class Revisor(unittest.TestCase):
    def _rev(self, texto, **k):
        env = _env('_r70_revisar')
        return env['_r70_revisar'](texto, **k)

    def test_limpo_passa_sem_notas(self):
        texto, notas = self._rev('A resposta e esta. Curta e correta.')
        self.assertEqual(notas, [])
        self.assertEqual(texto, 'A resposta e esta. Curta e correta.')

    def test_evasiva_leva_a_correcao_do_nucleo(self):
        texto, notas = self._rev('Como uma IA, nao tenho acesso ao seu computador.',
                            tem_ferramentas=True)
        self.assertTrue(any('TENHO acesso real' in n for n in notas))

    def test_frase_repetida_e_removida(self):
        texto, notas = self._rev('Gosto de cafe. Gosto de cafe. Gosto de leite.')
        self.assertEqual(texto.count('Gosto de cafe'), 1)
        self.assertTrue(any('repetida' in n for n in notas))

    def test_corte_nao_e_heuristica_e_detectado_pela_r51(self):
        # decisao de projeto: corte REAL e da r51 (finish_reason); o revisor
        # nao chuta por pontuacao (daria falso positivo em continuacao ok).
        texto, notas = self._rev('Esta resposta terminou no meio')
        self.assertEqual(notas, [])

    def test_vazio_recebe_nota_honesta(self):
        _, notas = self._rev('')
        self.assertTrue(any('em branco' in n for n in notas))


class DicaDeProximo(unittest.TestCase):
    def _env_registro(self, rotulos):
        env = _env('_r70_dica_de_proximo')
        env['_R67_REGISTRO'] = [('h', 'FATOS', r) for r in rotulos]
        return env

    def test_aprende_a_sequencia_e_sugere(self):
        env = self._env_registro(['criar checkpoint', 'diagnostico do iniciar', 'criar checkpoint'])
        dica = env['_r70_dica_de_proximo']('criar checkpoint')
        self.assertIn('diagnostico do iniciar', dica)

    def test_sem_padrao_nao_inventa_dica(self):
        env = self._env_registro([])
        self.assertIsNone(env['_r70_dica_de_proximo']())
        env = self._env_registro(['so um'])
        self.assertIsNone(env['_r70_dica_de_proximo']('so um'))


class ModoDetalhado(unittest.TestCase):
    def test_liga_e_desliga_pelo_config(self):
        import json
        env = carregar('_r70_comandos', '_norm_pt', '_r67_ler_config', '_r67_definir_config',
                       os=os, json=json)
        with redirect_stdout(io.StringIO()) as saida:
            self.assertTrue(env['_r70_comandos']('modo detalhado'))
        self.assertIn('LIGADO', saida.getvalue())
        self.assertTrue(env['_r67_ler_config']('resposta_detalhada', padrao=False))
        with redirect_stdout(io.StringIO()) as saida:
            self.assertTrue(env['_r70_comandos']('modo detalhado'))
        self.assertIn('DESLIGADO', saida.getvalue())

    def test_conversa_normal_nao_e_presa(self):
        env = _env('_r70_comandos')
        for frase in ('conte uma piada', 'status', 'nucleo'):
            with redirect_stdout(io.StringIO()):
                self.assertFalse(env['_r70_comandos'](frase), frase)


class Estrutura(unittest.TestCase):
    def test_enxertos_no_corpo(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        # revisor roda ANTES do cache (cache guarda a versao revisada)
        self.assertLess(texto.index('_revisar70 = globals().get'),
                        texto.index('cache_r24[chave_r24] ='))
        # fato antes do modelo: dentro do cerebro local, antes de qualquer rota antiga
        self.assertLess(texto.index('_fato70 = globals().get'),
                        texto.index('if n in ("ajuda", "menu"'))
        # injecao ranqueada + dica no feito + cadeia/menu/selo
        self.assertIn('_candidatos70.sort', texto)
        self.assertIn('_dica70 = globals().get', texto)
        self.assertLess(texto.index('if _r69_comandos(comando):'),
                        texto.index('if _r70_comandos(comando):'))
        self.assertIn('PROTOTIPO r70', texto)
        self.assertEqual(texto.count('[Motor e avaliacao local 2026-09-11-r71]'), 1)


if __name__ == '__main__':
    unittest.main()
