"""r51: lote extremo — melhorias na IA LOCAL (auto-continuacao de respostas
cortadas pelo limite de tokens + modelo sempre QUENTE na RAM, sem a "primeira
resposta lenta") e 4 ferramentas novas (gravar_tela_gif, baixar_video,
marca_dagua, criptografar_arquivo DPAPI). Sem rede, sem GGUF, sem importar o
agente: tudo isolado via carregar() com falsificaveis sobrepostos apos o
carregar (as funcoes olham globals() na hora da chamada)."""
import io
import os
import tempfile
import types
import unittest
from contextlib import redirect_stdout
from datetime import datetime as datetime_real

from test_roteamento_conversa import carregar


def capturar(funcao, *args, **kwargs):
    tampao = io.StringIO()
    with redirect_stdout(tampao):
        r = funcao(*args, **kwargs)
    return r, tampao.getvalue()


class OpcoesR51(unittest.TestCase):
    def test_chaves_novas_ligadas_por_padrao(self):
        env = carregar('_r20_opcoes')
        opcoes = env['_r20_opcoes']()
        self.assertIs(opcoes['auto_continuar'], True)
        self.assertIs(opcoes['manter_quente'], True)

    def test_config_vence_e_tipo_errado_e_ignorado(self):
        env = carregar('_r20_opcoes',
                       config={'ia_local_opcoes': {'auto_continuar': False,
                                                   'manter_quente': 'sim'}})
        opcoes = env['_r20_opcoes']()
        self.assertIs(opcoes['auto_continuar'], False)   # config explicita vence
        self.assertIs(opcoes['manter_quente'], True)     # tipo errado ignorado


class ManterQuenteR51(unittest.TestCase):
    def test_aquece_agora_pinga_no_intervalo_e_sai_apos_3_falhas(self):
        env = carregar('_r51_manter_quente')
        script = [True, True, False, False, False]  # aquecimento, ping ok, 3 falhas
        pings = []

        def chamar(msgs, **kwargs):
            pings.append((msgs[-1]['content'], kwargs['max_tokens']))
            if script.pop(0):
                return 'ok'
            raise RuntimeError('servidor caiu')

        dormidas = []

        def dormir(segundos):
            dormidas.append(segundos)
            self.assertLessEqual(len(dormidas), 8, 'laco nao terminou')

        env['_r51_quente_agendada'] = True
        env['_r51_manter_quente'](intervalo=240, dormir=dormir, chamar=chamar)
        self.assertEqual([p[0] for p in pings], ['ping'] * 5)
        self.assertTrue(all(p[1] == 1 for p in pings))          # ping minimo
        self.assertEqual(dormidas, [240, 240, 240, 240])        # nao pinga em echo
        self.assertIs(env['_r51_quente_agendada'], False)       # libera re-agendamento

    def test_agenda_uma_vez_so_e_falha_de_spawn_libera(self):
        env = carregar('_r51_agendar_manter_quente', config={})
        feitos = []
        self.assertTrue(env['_r51_agendar_manter_quente'](agendador=lambda: feitos.append(1)))
        self.assertFalse(env['_r51_agendar_manter_quente'](agendador=lambda: feitos.append(1)))
        self.assertEqual(len(feitos), 1)  # idempotente

        def spawn_ruim():
            raise RuntimeError('sem threads hoje')

        env2 = carregar('_r51_agendar_manter_quente', config={})
        env2['_r51_quente_agendada'] = False
        self.assertFalse(env2['_r51_agendar_manter_quente'](agendador=spawn_ruim))

    def test_config_false_nem_agenda(self):
        env = carregar('_r51_agendar_manter_quente',
                       config={'ia_local_opcoes': {'manter_quente': False}})
        self.assertFalse(env['_r51_agendar_manter_quente'](agendador=lambda: self.fail('nao deveria')))


class AutoContinuacaoR51(unittest.TestCase):
    def _perguntar(self, partes, razoes, opcoes=None, quantidade=0):
        telemetria = types.SimpleNamespace(ultima={})
        Chamadas = {'n': 0, 'msgs': []}

        def fake_neural(msgs, max_tokens=350, temperatura=0.5, timeout_segundos=120,
                        stream=False, callback=None, seed=None, repeat_penalty=None,
                        formato_json=False):
            Chamadas['n'] += 1
            Chamadas['msgs'].append(list(msgs))
            telemetria.ultima = {'finish_reason': razoes[min(Chamadas['n'], len(razoes)) - 1]}
            return partes[min(Chamadas['n'], len(partes)) - 1]

        env = carregar('perguntar_ia_local', '_norm_pt',
                       _montar_contexto_local=lambda p, h: [{'role': 'system', 'content': 'base'}],
                       _quantidade_lista_local=lambda p: quantidade,
                       _perfil_resposta_local=lambda p, c: (350, ''),
                       buscar_memorias_relevantes=lambda p, l=3: [],
                       _remover_itens_repetidos_local=lambda r: (r, 0),
                       _contar_itens_lista_local=lambda r: quantidade,
                       _chamar_neural=fake_neural,
                       _r20_telemetria=telemetria,
                       config={'ia_local_opcoes': dict(opcoes or {})})
        saida = capturar(env['perguntar_ia_local'], 'me faca um texto longo')[0]
        return saida, Chamadas

    def test_cortada_continua_e_junta_sem_aviso(self):
        saida, chamadas = self._perguntar(['primeira parte', 'segunda parte'], ['length', 'stop'])
        self.assertEqual(saida, 'primeira parte segunda parte')
        self.assertNotIn('[Aviso: geracao cortada', saida)
        self.assertEqual(chamadas['n'], 2)
        seguimento = chamadas['msgs'][1]
        self.assertEqual(seguimento[-1]['content'],
                         'Continue EXATAMENTE de onde parou, sem repetir nada do que ja foi escrito.')
        self.assertEqual(seguimento[-2]['content'], 'primeira parte')  # assistant parcial no contexto

    def test_config_false_mantem_comportamento_antigo(self):
        saida, chamadas = self._perguntar(['so a parte 1'], ['length'],
                                          opcoes={'auto_continuar': False})
        self.assertEqual(chamadas['n'], 1)
        self.assertIn('[Aviso: geracao cortada', saida)

    def test_continua_duas_vezes_e_ainda_cortada_avisa(self):
        saida, chamadas = self._perguntar(['a', 'b', 'c'], ['length', 'length', 'length'])
        self.assertEqual(chamadas['n'], 3)  # 1 original + 2 continuacoes (teto)
        self.assertTrue(saida.startswith('a b c'), repr(saida))
        self.assertIn('[Aviso: geracao cortada', saida)

    def test_lista_numerada_nao_continua(self):
        saida, chamadas = self._perguntar(['1. item'], ['length'], quantidade=5)
        self.assertEqual(chamadas['n'], 1)  # listas tem gerenciamento proprio
        self.assertIn('[Aviso: geracao cortada', saida)


class EstruturaR51(unittest.TestCase):
    def test_menu_wiring_e_selo(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        self.assertIn('IA LOCAL EXTREMA (r51)', texto)                      # menu
        self.assertEqual(texto.count('_r51_agendar_manter_quente()'), 2)   # 2 retornos de sucesso do servidor
        self.assertIn("'auto_continuar':True, 'manter_quente':True", texto)
        self.assertIn('[Motor e avaliacao local 2026-09-11-r67]', texto)   # selo
        self.assertIn('Continue EXATAMENTE de onde parou', texto)          # continuacao no ar


class GravarTelaGifR51(unittest.TestCase):
    def _ambiente(self, pasta):
        env = carregar('gravar_tela_gif', '_r51_capturar_quadro', '_r51_salvar_gif',
                       tool=lambda f: f)
        env['os'] = os
        env['threading'] = __import__('threading')
        env['time'] = types.SimpleNamespace(sleep=lambda s: None)  # gravacao instantanea
        env['datetime'] = datetime_real
        env['PASTA_BASE'] = pasta
        env['executar_com_autocura'] = lambda nome, f: f()
        salvos = []
        env['_r51_capturar_quadro'] = lambda: ('quadro', len(salvos))
        env['_r51_salvar_gif'] = lambda quadros, destino, fps: salvos.append((len(quadros), destino, fps))
        return env, salvos

    def test_ciclo_completo_salva_gif(self):
        pasta = tempfile.mkdtemp()
        env, salvos = self._ambiente(pasta)
        saida = env['gravar_tela_gif']('iniciar', segundos=2, quadros_por_segundo=4,
                                       arquivo='meu gif')
        self.assertIn('Gravando a tela', saida)
        estado = env['_r51_gravacao_tela']
        estado['thread'].join(timeout=10)
        self.assertIn('GIF da tela salvo em', estado['ultimo_resultado'])
        self.assertIn('meu_gif.gif', estado['ultimo_resultado'])
        self.assertTrue(estado['ultimo_resultado'].endswith(' (8 quadros).'))
        self.assertEqual(len(salvos), 1)
        self.assertEqual(salvos[0][0], 8)   # 2s * 4fps
        self.assertEqual(salvos[0][1], os.path.join(pasta, 'prints', 'meu_gif.gif'))
        self.assertFalse(estado['ativa'])

    def test_status_parar_e_segunda_recusada(self):
        pasta = tempfile.mkdtemp()
        env, salvos = self._ambiente(pasta)
        self.assertIn('parada', env['gravar_tela_gif']('status'))
        self.assertIn('Nao ha gravacao', env['gravar_tela_gif']('parar'))
        # estado sintetico de gravacao em andamento (deterministico, sem thread)
        env['_r51_gravacao_tela'] = {'ativa': True, 'parar': False, 'quadros': ['q'],
                                     'thread': None, 'ultimo_resultado': ''}
        self.assertIn('EM ANDAMENTO', env['gravar_tela_gif']('status'))
        self.assertIn('Ja existe uma gravacao', env['gravar_tela_gif']('iniciar'))
        self.assertIn('Gravacao de tela encerrada', env['gravar_tela_gif']('parar'))


class BaixarVideoR51(unittest.TestCase):
    def _ambiente(self, disponivel=True):
        env = carregar('baixar_video', '_r51_ytdlp_disponivel', '_r51_executar_processo',
                       '_r51_python_atual', tool=lambda f: f)
        env['os'] = os
        env['PASTA_BASE'] = tempfile.mkdtemp()
        env['executar_com_autocura'] = lambda nome, f: f()
        chamadas = []
        env['_r51_ytdlp_disponivel'] = lambda: disponivel
        env['_r51_python_atual'] = lambda: 'PY'
        env['_r51_executar_processo'] = lambda cmd, prazo: (chamadas.append((cmd, prazo)) or (0, '[download] 100%', ''))
        return env, chamadas

    def test_video_monta_comando_e_conclui(self):
        env, chamadas = self._ambiente()
        saida = env['baixar_video']('https://exemplo.com/v/1')
        self.assertIn('Download concluido', saida)
        cmd, prazo = chamadas[0]
        self.assertEqual(prazo, 1800)
        self.assertIn('-f', cmd)
        self.assertIn('-m', cmd[:2])

    def test_audio_usa_extracao_mp3(self):
        env, chamadas = self._ambiente()
        env['baixar_video']('https://exemplo.com/v/2', modo='audio')
        cmd = chamadas[0][0]
        self.assertIn('-x', cmd)
        self.assertIn('mp3', cmd)

    def test_sem_ytdlp_da_guia_e_nao_executa_nada(self):
        env, chamadas = self._ambiente(disponivel=False)
        saida = env['baixar_video']('https://exemplo.com/v/3')
        self.assertIn('pip install yt-dlp', saida)
        self.assertIn('Nao instalo nada sem voce decidir', saida)
        self.assertEqual(chamadas, [])
        self.assertIn('link valido', env['baixar_video']('nao-e-link'))


class MarcaDaguaR51(unittest.TestCase):
    def _ambiente(self):
        env = carregar('marca_dagua', '_r51_aplicar_marca', tool=lambda f: f)
        env['os'] = os
        env['executar_com_autocura'] = lambda nome, f: f()
        aplicadas = []
        env['_r51_aplicar_marca'] = (
            lambda origem, destino, texto, opacidade, posicao:
            aplicadas.append((origem, destino, texto, opacidade, posicao)) and None)
        return env, aplicadas

    def test_arquivo_unico_e_pasta_criam_sufixo_marca(self):
        env, aplicadas = self._ambiente()
        pasta = tempfile.mkdtemp()
        for nome in ('a.jpg', 'b.png', 'c.txt', 'd_marca.png'):
            io.open(os.path.join(pasta, nome), 'w').write('x')
        saida = env['marca_dagua']('MEU SITE', caminho=os.path.join(pasta, 'a.jpg'))
        self.assertIn('aplicada em 1', saida)
        self.assertEqual(aplicadas[0][1], os.path.join(pasta, 'a_marca.jpg'))
        saida = env['marca_dagua']('MEU SITE', pasta=pasta)
        self.assertIn('aplicada em 2', saida)  # c.txt e d_marca.png ficam de fora
        destinos = [a[1] for a in aplicadas[1:]]
        self.assertIn(os.path.join(pasta, 'b_marca.png'), destinos)

    def test_guardas_de_texto_posicao_e_inexistente(self):
        env, aplicadas = self._ambiente()
        self.assertIn('texto', env['marca_dagua']('  '))
        self.assertIn('Posicao invalida', env['marca_dagua']('x', posicao='meio'))
        self.assertIn('Nao encontrei o arquivo', env['marca_dagua']('x', caminho='nao/existe.jpg'))
        self.assertIn('Nao achei imagens', env['marca_dagua']('x', pasta=tempfile.mkdtemp()))
        self.assertIn('caminho de uma imagem', env['marca_dagua']('x'))
        self.assertEqual(aplicadas, [])


class CriptografarArquivoR51(unittest.TestCase):
    def _ambiente(self, conteudo=b'segredo'):
        env = carregar('criptografar_arquivo', '_r51_dpapi_proteger', '_r51_dpapi_revelar',
                       '_r51_dpapi_blob', tool=lambda f: f)
        env['os'] = os
        env['executar_com_autocura'] = lambda nome, f: f()
        alvo = os.path.join(tempfile.mkdtemp(), 'carta.txt')
        with open(alvo, 'wb') as f:
            f.write(conteudo)
        return env, alvo

    def test_ciclo_criptografar_e_descriptografar(self):
        env, alvo = self._ambiente()
        env['_r51_dpapi_proteger'] = lambda b: b[::-1]   # cripto falsa reversivel
        env['_r51_dpapi_revelar'] = lambda b: b[::-1]
        saida = env['criptografar_arquivo'](alvo)
        self.assertIn('criptografado em', saida)
        with open(alvo, 'rb') as f:
            self.assertEqual(f.read(), b'segredo')       # original intacto
        with open(alvo + '.cripto', 'rb') as f:
            self.assertEqual(f.read(), b'oderges')
        self.assertIn('ja parece criptografado', env['criptografar_arquivo'](alvo + '.cripto'))
        self.assertIn('Ja existe um arquivo com o nome original',
                      env['criptografar_arquivo'](alvo + '.cripto', acao='descriptografar'))
        os.remove(alvo)  # usuario afastou o original; agora a restauracao cabe
        saida = env['criptografar_arquivo'](alvo + '.cripto', acao='descriptografar')
        self.assertIn('restaurado como', saida)
        with open(alvo, 'rb') as f:
            self.assertEqual(f.read(), b'segredo')

    def test_guardas_e_dpapi_fora_do_windows(self):
        env, alvo = self._ambiente()
        self.assertIn('Acao invalida', env['criptografar_arquivo'](alvo, acao='abrir'))
        self.assertIn('Nao encontrei', env['criptografar_arquivo']('nao/existe.txt'))
        env['_r51_dpapi_proteger'] = lambda b: (_ for _ in ()).throw(RuntimeError('DPAPI so existe no Windows'))
        saida = env['criptografar_arquivo'](alvo)
        self.assertIn('Nada foi alterado', saida)
        self.assertFalse(os.path.exists(alvo + '.cripto'))
        with self.assertRaises(RuntimeError):
            env['_r51_dpapi_revelar_real'] = None  # garantia de que o real existe
            carregar('_r51_dpapi_revelar')['_r51_dpapi_revelar'](b'x')


if __name__ == '__main__':
    unittest.main()
