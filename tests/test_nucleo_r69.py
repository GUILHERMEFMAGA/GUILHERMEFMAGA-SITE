"""r69: NUCLEO ABSURDO — 7 camadas cognitivas (A0 motor/A1 memoria/A2
conhecimento/A3 caracter/A4 ritmo/A5 ceu/A6 fisico), inspiradas nos famosos
open-source de IA local (llama.cpp, LangChain/LlamaIndex, LiteLLM, Open WebUI).
Erosao de pesos, fases de frequencia, meia-vida, pack de conhecimento, nonce
de intencao, espera graciosa, auditoria AST de 7 camadas — tudo DI, sem rede,
sem importar o agente, memoria so em RAM."""
import io
import os
import unittest
from contextlib import redirect_stdout
from types import SimpleNamespace

from test_roteamento_conversa import carregar


def _env(*nomes):
    return carregar(*nomes, '_norm_pt', os=os, json=__import__('json'))


class A1Memoria(unittest.TestCase):
    def test_erosao_construiu_e_desgastou_rivais(self):
        env = _env('_norm_pt', '_r69_erodir')
        env['_norm_pt']('piada boa agora')
        env['_norm_pt']('piada ruim agora')
        st = env['_R69_NUCLEO']
        self.assertTrue(st['pesos'])                       # mapeamentos nasceram
        self.assertGreater(st['consecutivos'].get('piadaboagora', 0) +
                           len(st['historico']), 0)
        self.assertLessEqual(len(st['historico']), 64)     # janela limitada

    def test_erosao_nao_zera_de_todo(self):
        env = _env('_norm_pt', '_r69_erodir')
        env['_norm_pt']('abcxyz')
        antes = dict(env['_R69_NUCLEO']['pesos'].get('abcxyz', {}))
        env['_r69_erodir']('abcxyz', taxa=0.999)
        depois = env['_R69_NUCLEO']['pesos'].get('abcxyz', {})
        for rotulo, peso in depois.items():
            if rotulo in antes and antes[rotulo] >= 0.05:
                self.assertGreater(peso, 0.0)              # piso, nunca zero

    def test_contador_de_dominancia_decai_os_outros(self):
        env = _env('_norm_pt')
        env['_norm_pt']('comando x')
        env['_norm_pt']('comando y')
        env['_norm_pt']('comando y')
        cont = env['_R69_NUCLEO']['consecutivos']
        self.assertGreaterEqual(cont.get('comandoy', 0), 1)
        self.assertLessEqual(cont.get('comandox', 0), 1)   # rival decai


class A0A4Motor(unittest.TestCase):
    def test_meia_vida_apos_100_geracoes(self):
        env = _env('_norm_pt', '_r69_decay')
        env['_norm_pt']('peso forte')
        env['_norm_pt']('peso forte agora')  # comando DIFERENTE: nasce o par (cache pula repetido)
        alvo = env['_R69_NUCLEO']['pesos']['pesoforteagora']
        rotulo = next(iter(alvo))
        antes = alvo[rotulo]
        for _ in range(100):
            env['_r69_decay']()
        self.assertLess(env['_R69_NUCLEO']['pesos']['pesoforteagora'][rotulo], antes)
        self.assertGreater(env['_R69_NUCLEO']['pesos']['pesoforteagora'][rotulo], 0)

    def test_ema_do_velocimetro_atualiza_o_resumo(self):
        env = carregar('_r24_resumo_velocidade', '_norm_pt', os=os)
        env['_r24_tempos'] = [{'tokens': 100, 'segundos': 2.0}]
        env['_R69_NUCLEO'] = {'ema': 42.5}
        resumo = env['_r24_resumo_velocidade']()
        self.assertEqual(resumo['ema_tokens_por_segundo'], 42.5)


class A2Conhecimento(unittest.TestCase):
    def test_pack_entra_no_system_e_nonce_impede_loop(self):
        env = _env('_r69_injetar_conhecimento', '_r69_instalar_estado')
        st = env['_r69_instalar_estado']()
        st['conhecimento'] = {'minha casa': [{'texto': 'moro em Ribeirao Preto'}]}
        msgs = [{'role': 'user', 'content': 'oi'}]
        env['_r69_injetar_conhecimento'](msgs)
        self.assertIn('CONHECIMENTO ENSINADO', msgs[0]['content'])
        self.assertIn('Ribeirao Preto', msgs[0]['content'])
        env['_r69_injetar_conhecimento'].__globals__['_r69_nonce'] = True
        msgs2 = [{'role': 'user', 'content': 'oi'}]
        env['_r69_injetar_conhecimento'](msgs2)
        self.assertEqual(len(msgs2), 1)                    # nonce: sem re-injecao

    def test_ensinar_listar_e_esquecer(self):
        env = _env('_r69_comandos')
        env['_r69_instalar_estado']()['conhecimento'].clear()
        with redirect_stdout(io.StringIO()) as saida:
            self.assertTrue(env['_r69_comandos']('conhecimento ensinar minha casa: moro em RP'))
        self.assertIn('[OK] ensinado', saida.getvalue())
        with redirect_stdout(io.StringIO()) as saida:
            self.assertTrue(env['_r69_comandos']('conhecimento listar'))
        self.assertIn('minha casa', saida.getvalue())
        with redirect_stdout(io.StringIO()) as saida:
            self.assertTrue(env['_r69_comandos']('conhecimento esquecer minha casa'))
        self.assertIn('esquecido', saida.getvalue())


class A5Ceu(unittest.TestCase):
    def test_fase_avisa_so_no_ciclo_e_sem_spam(self):
        env = _env('_norm_pt', '_r69_fase_para')
        frase = 'organizar meus recibos estranhos'
        avisos = []
        for _ in range(7):
            nota = env['_r69_fase_para'](env['_norm_pt'](frase))
            if nota:
                avisos.append(nota)
        self.assertEqual(len(avisos), 1)                   # 1 aviso, sem spam
        self.assertIn('ROTA PROPRIA', avisos[0])

    def test_comandos_conhecidos_nao_geram_fase(self):
        env = _env('_norm_pt', '_r69_fase_para')
        for _ in range(4):
            self.assertFalse(env['_r69_fase_para'](env['_norm_pt']('status')))
            self.assertFalse(env['_r69_fase_para'](env['_norm_pt']('ajuda')))


class A6Fisico(unittest.TestCase):
    def test_espera_graciosa_uma_vez_por_nome(self):
        env2 = _env('_r69_conferir_gracioso', '_r69_instalar_estado')
        ambiente = env2['_r69_conferir_gracioso'].__globals__
        ambiente['ferr'] = None
        self.assertFalse(env2['_r69_conferir_gracioso']('ferr'))   # 1a: espera e falha
        self.assertFalse(env2['_r69_conferir_gracioso']('ferr'))   # 2a: nem espera
        ambiente['outra'] = lambda: 1
        self.assertTrue(env2['_r69_conferir_gracioso']('outra'))   # nome novo: espera e acha


class ComandosDoNucleo(unittest.TestCase):
    def test_painel_diagnostico_reflexao_e_confianca(self):
        env = _env('_r69_comandos', '_r69_audit', '_r69_refletir')
        env['_r69_audit'] = lambda: True
        for frase, esperado in (('nucleo', 'NUCLEO COGNITIVO r69'),
                                ('diagnostico do cerebro', '7 camadas'),
                                ('reflexao da semana', 'auto-retrato'),
                                ('confianca quanto e 2 mais 2', 'Confianca no roteamento')):
            with redirect_stdout(io.StringIO()) as saida:
                self.assertTrue(env['_r69_comandos'](frase), frase)
            self.assertIn(esperado, saida.getvalue(), frase)

    def test_lexico_aprende_lista_e_esquece(self):
        env = _env('_r69_comandos')
        with redirect_stdout(io.StringIO()) as saida:
            self.assertTrue(env['_r69_comandos'](
                'aprender palavras {"arruma pc":"organizar downloads"}'))
        self.assertIn('1 padrao(oes)', saida.getvalue())
        st = env['_r69_instalar_estado']()
        self.assertEqual(st['aprendidas'].get('arruma pc'), 'organizar downloads')
        with redirect_stdout(io.StringIO()):
            self.assertTrue(env['_r69_comandos']('esquecer aprendizado'))
        self.assertEqual(st['aprendidas'], {})

    def test_auditoria_7_camadas_no_codigo_real(self):
        env = _env('_r69_audit')
        with redirect_stdout(io.StringIO()) as saida:
            ok = env['_r69_audit']()
        self.assertTrue(ok)
        self.assertEqual(saida.getvalue(), '')             # integra = silencio

    def test_auditoria_em_arquivo_amputado_reclama(self):
        import tempfile
        arq = os.path.join(tempfile.mkdtemp(), 'agente.py')
        io.open(arq, 'w').write('def outra():\n    pass\n')
        env = _env('_r69_audit')
        with redirect_stdout(io.StringIO()) as saida:
            self.assertFalse(env['_r69_audit'](arq))
        self.assertIn('camada(s) com problema', saida.getvalue())


class GanchoFinal(unittest.TestCase):
    def test_auditoria_roda_no_fim_do_arquivo_e_cadeia_menu_selo(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        self.assertLess(texto.index('if _r68_comandos(comando):'),
                        texto.index('if _r69_comandos(comando):'))
        self.assertLess(texto.index('if _r69_comandos(comando):'),
                        texto.index('if _r62_comandos(comando):'))
        self.assertIn('NUCLEO r69', texto)
        self.assertEqual(texto.count('\n    _r69_audit()'), 1)  # gancho EOF (chamada indentada)
        self.assertGreater(texto.index('\ntry:\n    _r69_audit()'),
                           texto.index('[Motor e avaliacao local 2026-09-11-r70]'))
        self.assertEqual(texto.count('[Motor e avaliacao local 2026-09-11-r70]'), 1)
        self.assertIn('r69_nonce', texto)


if __name__ == '__main__':
    unittest.main()
