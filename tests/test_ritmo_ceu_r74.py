"""r74: RITMO E CEU — 7 melhorias da LISTA-IMPOSSIVEL na IA local (31–37):
compactador de historico, warm-up programado, replay de erros, testador de
malha, guardiao de gatilhos, tradutor de rota, rota em branco guiada.
Tudo 100% local e LEITURA (dry-run — nunca executa rota). Kill-switches:
'replay_erros', 'guardiao_gatilhos', 'compactar_historico' (false desliga)
e 'aquecer_horas' (lista vazia = desligado). Selo: 2026-09-11-r74.
Testes isolados: nada importa/executa o agente (loader de AST da casa).
Nota: o loader auto-carrega funcoes com prefixo _rNN_ — stubs de funcao
precisam ser aplicados NO DICT do ambiente DEPOIS do carregar()."""
import datetime as dt
import json
import os
import shutil
import tempfile
import unittest

from test_roteamento_conversa import SOURCE, carregar


def _env(*nomes, **extra):
    ambiente = {'os': os, 'json': json}
    ambiente.update(extra)
    return carregar(*nomes, '_norm_pt', **ambiente)


def _stub(env, **nomes):
    """Sobe stubs por cima das funcoes reais auto-carregadas (prefixo _rNN_)."""
    for k, v in nomes.items():
        env[k] = v
    return env


def _pasta():
    return tempfile.mkdtemp()


def _catalogo_lambda(*comandos):
    return lambda: comandos


class TradutorRota(unittest.TestCase):
    def _ambiente(self):
        env = _env('_r74_traduzir_rota', '_r74_catalogo_rotas', '_r74_proximos_comandos',
                   _buscar_ferramentas=lambda termo, k=8: [('x', {'nome': 'ferramenta_x', 'desc': 'd'})])
        return _stub(env, _r21_comandos_conhecidos=_catalogo_lambda(
            'status ia', 'criar ia', 'atualizar agora', 'organizar downloads', 'organizar documentos'))

    def test_caso_exato_nao_era_buraco(self):
        env = self._ambiente()
        r = env['_r74_traduzir_rota']('status ia', explico=False)
        self.assertEqual(r['exata'], 'status ia')
        self.assertEqual(r['proximos'], [])
        self.assertFalse(r['buraco'])
        self.assertIn('CASO EXATO', env['_r74_traduzir_rota']('Status IA', explico=True))

    def test_parecido_aponta_o_comando_certinho(self):
        env = self._ambiente()
        r = env['_r74_traduzir_rota']('atualizar agoraa', explico=False)
        self.assertIsNone(r['exata'])
        self.assertTrue(any(c == 'atualizar agora' for c, _ in r['proximos']))
        self.assertIn('atualizar agora', env['_r74_traduzir_rota']('atualizar agoraa', explico=True))

    def test_buraco_e_marcado(self):
        env = self._ambiente()
        r = env['_r74_traduzir_rota']('qwertzuioplkj', explico=False)
        self.assertIsNone(r['exata'])
        self.assertTrue(r['buraco'])
        self.assertIn('BURACO', env['_r74_traduzir_rota']('qwertzuioplkj', explico=True))

    def test_ferramenta_somente_mentionada_nunca_executada(self):
        env = self._ambiente()
        saida = env['_r74_traduzir_rota']('qwertzuioplkj', explico=True)
        self.assertIn('Ferramentas que combinam: ferramenta_x', saida)


class TestadorMalha(unittest.TestCase):
    def test_conferencia_batendo_e_buracos_listados(self):
        pasta = _pasta()
        self.addCleanup(shutil.rmtree, pasta, ignore_errors=True)
        env = _env('_r74_testar_malha', '_r74_traduzir_rota', '_r74_catalogo_rotas',
                   '_r74_proximos_comandos', '_r74_malha_padrao', '_r74_arquivo_candidatos',
                   '_r74_ler_json')
        _stub(env, _r21_comandos_conhecidos=_catalogo_lambda('status', 'criar ia'))
        saida = env['_r74_testar_malha'](frases=['status', 'criar ia', 'xyzwvbnmk'], pasta=pasta)
        self.assertIn('3 frase(s)', saida)
        self.assertIn('2 casada(s)', saida)
        self.assertIn('1 buraco(s)', saida)
        self.assertIn('xyzwvbnmk', saida)

    def test_usa_comandos_reais_do_replay(self):
        pasta = _pasta()
        self.addCleanup(shutil.rmtree, pasta, ignore_errors=True)
        env = _env('_r74_testar_malha', '_r74_traduzir_rota', '_r74_catalogo_rotas',
                   '_r74_proximos_comandos', '_r74_malha_padrao', '_r74_arquivo_candidatos',
                   '_r74_ler_json')
        _stub(env, _r21_comandos_conhecidos=_catalogo_lambda())
        with open(os.path.join(pasta, 'candidatos_rota.json'), 'w', encoding='utf-8') as f:
            json.dump([{'n': 'minhafra', 'txt': 'minha frase real', 'vezes': 3}], f)
        saida = env['_r74_testar_malha'](pasta=pasta)
        self.assertIn('minha frase real', saida)


class ReplayErros(unittest.TestCase):
    def _ambiente(self):
        return _env('_r74_replay_registrar', '_r74_replay_top', '_r74_arquivo_candidatos',
                    '_r74_ler_json', '_r74_escrever_json', '_r74_kill',
                    '_r74_guardiao_registrar', '_r74_proximos_comandos', '_r74_catalogo_rotas')

    def test_registra_e_conta_repeticoes(self):
        pasta = _pasta()
        self.addCleanup(shutil.rmtree, pasta, ignore_errors=True)
        env = self._ambiente()
        _stub(env, _r21_comandos_conhecidos=_catalogo_lambda())
        chave = env['_r74_replay_registrar']('organiza downloads do pc', pasta=pasta)
        self.assertTrue(chave)
        self.assertEqual(env['_r74_replay_registrar']('organiza downloads do pc', pasta=pasta), chave)
        top = env['_r74_replay_top'](pasta=pasta)
        self.assertIn('2 vez(es)', top)
        self.assertIn('criar rota', top)

    def test_ignora_payload_e_frase_curta(self):
        pasta = _pasta()
        self.addCleanup(shutil.rmtree, pasta, ignore_errors=True)
        env = self._ambiente()
        self.assertIsNone(env['_r74_replay_registrar']('conhecimento ensinar x: y', pasta=pasta))
        self.assertIsNone(env['_r74_replay_registrar']('oi', pasta=pasta))
        self.assertFalse(os.path.exists(env['_r74_arquivo_candidatos'](pasta)))

    def test_kill_switch_nao_registra(self):
        pasta = _pasta()
        self.addCleanup(shutil.rmtree, pasta, ignore_errors=True)
        env = self._ambiente()
        _stub(env, _r67_ler_config=lambda chave, pasta=None, padrao=None: False)
        self.assertIsNone(env['_r74_replay_registrar']('organiza downloads do pc', pasta=pasta))
        self.assertFalse(os.path.exists(env['_r74_arquivo_candidatos'](pasta)))


class GuardiaoGatilhos(unittest.TestCase):
    def _ambiente(self, catalogos):
        env = _env('_r74_guardiao_registrar', '_r74_guardiao_listar', '_r74_arquivo_conflitos',
                   '_r74_ler_json', '_r74_escrever_json', '_r74_kill',
                   '_r74_proximos_comandos', '_r74_catalogo_rotas')
        return _stub(env, _r21_comandos_conhecidos=_catalogo_lambda(*catalogos))

    def test_disputa_registrada_com_as_duas_rotas(self):
        pasta = _pasta()
        self.addCleanup(shutil.rmtree, pasta, ignore_errors=True)
        env = self._ambiente(('desligar ia', 'desligar ia local'))
        self.assertIsNotNone(env['_r74_guardiao_registrar']('desligar iaa', pasta=pasta))
        saida = env['_r74_guardiao_listar'](pasta=pasta)
        self.assertIn('desligar ia local', saida)
        self.assertIn('desligar ia', saida)
        self.assertIn('Nada muda no comportamento', saida)

    def test_disputa_e_contada(self):
        pasta = _pasta()
        self.addCleanup(shutil.rmtree, pasta, ignore_errors=True)
        env = self._ambiente(('desligar ia', 'desligar ia local'))
        env['_r74_guardiao_registrar']('desligar iaa', pasta=pasta)
        env['_r74_guardiao_registrar']('desligar iaa', pasta=pasta)
        self.assertIn('2 x', env['_r74_guardiao_listar'](pasta=pasta))

    def test_sem_disputa_nada_registrado(self):
        pasta = _pasta()
        self.addCleanup(shutil.rmtree, pasta, ignore_errors=True)
        env = self._ambiente(('status ia',))
        self.assertIsNone(env['_r74_guardiao_registrar']('status iaa', pasta=pasta))
        self.assertFalse(os.path.exists(env['_r74_arquivo_conflitos'](pasta)))

    def test_limiar_controla_o_que_e_disputa(self):
        pasta = _pasta()
        self.addCleanup(shutil.rmtree, pasta, ignore_errors=True)
        env = self._ambiente(('organizar downloads', 'organizar documentos'))
        # no limiar padrao (0.72) o 2o candidato fica abaixo -> nao e disputa
        self.assertIsNone(env['_r74_guardiao_registrar']('organizar documentso', pasta=pasta))
        self.assertFalse(os.path.exists(env['_r74_arquivo_conflitos'](pasta)))
        # com limiar mais frouxo a mesma frase vira disputa registrada
        self.assertIsNotNone(env['_r74_guardiao_registrar']('organizar documentso',
                                                            pasta=pasta, limiar=0.68))
        self.assertIn('organizar downloads', env['_r74_guardiao_listar'](pasta=pasta))


class CompactadorHistorico(unittest.TestCase):
    def _turnos(self, n, tema='backup do disco'):
        return [{'role': 'user', 'content': 'faz o %s' % tema} for _ in range(n)]

    def test_resumo_deterministico_com_temas(self):
        env = _env('_r74_resumo_turnos')
        resumo = env['_r74_resumo_turnos'](self._turnos(6))
        self.assertIn('temas:', resumo)
        self.assertIn('backup', resumo)
        self.assertIn('6 turnos', resumo)
        self.assertIn('nada foi apagado', resumo)

    def test_conversa_curta_nao_compacta(self):
        env = _env('_r74_resumo_turnos')
        self.assertEqual(env['_r74_resumo_turnos'](self._turnos(3)), '')
        self.assertEqual(env['_r74_resumo_turnos']([]), '')

    def test_hook_no_montar_contexto_e_selo_r74(self):
        fonte = SOURCE.read_text(encoding='utf-8')
        self.assertIn('compactar_historico', fonte)
        self.assertIn('[Motor e avaliacao local 2026-09-11-r98]', fonte)
        for rota in ('replayerros', 'guardaogatilhos', 'testarmalha',
                     'traduzir rota', 'criar rota', 'aquecer as'):
            self.assertIn(rota, fonte)


class AquecerProgramado(unittest.TestCase):
    def test_horas_invalidas_sao_ignoradas(self):
        env = _env('_r74_aquecer_horas')
        _stub(env, _r67_ler_config=lambda chave, pasta=None, padrao=None:
              ['07:50', '24:99', 'xx', '23:59'])
        self.assertEqual(env['_r74_aquecer_horas'](), ['07:50', '23:59'])

    def test_verificar_logica_pura(self):
        env = _env('_r74_aquecer_verificar', '_r74_aquecer_horas')
        agora = dt.datetime(2026, 9, 13, 7, 50)
        self.assertEqual(env['_r74_aquecer_verificar'](agora=agora, disparados=set(),
                                                       horas=['07:50']), ['07:50'])
        self.assertEqual(env['_r74_aquecer_verificar'](agora=agora,
                                                       disparados={'2026-09-13|07:50'},
                                                       horas=['07:50']), [])
        self.assertEqual(env['_r74_aquecer_verificar'](agora=agora, disparados=set(),
                                                       horas=['08:00']), [])

    def test_loop_sobe_uma_vez_por_hora(self):
        env = _env('_r74_aquecer_loop', '_r74_aquecer_verificar',
                   _acha_modelo_gguf=lambda: 'm.gguf',
                   _acha_llama_server=lambda: 'llama-server.exe')
        subidas = []
        disparados = set()

        def verificar(agora=None, disparados=None, horas=None, pasta=None):
            d = set(disparados or set())
            dia = (agora or dt.datetime.now()).strftime('%Y-%m-%d')
            return [h for h in ['07:50'] if (dia + '|' + h) not in d]

        env['_r74_aquecer_loop'](disparados, verificar=verificar,
                                 subir=lambda: subidas.append(1), max_rodadas=3)
        self.assertEqual(len(subidas), 1)
        self.assertTrue(any('07:50' in d for d in disparados))

    def test_sem_motor_baixado_nunca_sobe(self):
        env = _env('_r74_aquecer_loop', '_r74_aquecer_verificar')
        subidas = []
        env['_r74_aquecer_loop'](set(), verificar=lambda **k: ['07:50'],
                                 subir=lambda: subidas.append(1), max_rodadas=1)
        self.assertEqual(subidas, [])

    def test_agendar_somente_uma_vez_por_sessao(self):
        env = _env('_r74_aquecer_agendar')
        self.assertTrue(env['_r74_aquecer_agendar'](agendador=lambda: None))
        self.assertFalse(env['_r74_aquecer_agendar'](agendador=lambda: None))


class RotaGuiada(unittest.TestCase):
    def test_texto_ensina_o_formato(self):
        env = _env('_r74_rota_guiada')
        saida = env['_r74_rota_guiada']()
        self.assertIn('criar rota', saida)
        self.assertIn('sim', saida)  # destrutivas sempre pedem confirmacao

    def test_malha_padrao_tem_phrases_de_dia_a_dia(self):
        env = _env('_r74_malha_padrao')
        frases = env['_r74_malha_padrao']()
        self.assertGreaterEqual(len(frases), 30)
        self.assertIn('status ia', frases)
        self.assertIn('organiza downloads', frases)


if __name__ == '__main__':
    unittest.main()
