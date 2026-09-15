# -*- coding: utf-8 -*-
"""r94 — OLHOS LOCAIS: a visao 100% offline vira uma coisa que o proprio
agente baixa e liga.

Opcao "A" do dono (14/09): visao LOCAL. A r76 ja sabia USAR a visao local
(leitor na porta 8081) se o dono montasse tudo a mao (llama-server.exe,
modelo Llama 3.2 Vision 11B em GGUF, projetor mmproj). A r94 fecha a
jornada:
  - comando 'baixar visao' (padrao do 'baixar stt' da r79: confirmacao
    'sim' com aviso de tamanho, download da stdlib, injetavel nos testes);
  - build do llama.cpp vem da API do GitHub (release mais novo — o numero
    do build muda toda semana, entao nao hardcode o nome do zip);
  - LIGA SOZINHO: no 'interaja com NOME' e no ciclo do modo conversa, se
    as pecas estao no lugar e a porta esta fora, o agente liga o
    llama-server e espera a porta abrir (carregar ~8 GB leva 1-2 min);
  - correcao de falso positivo: o projetor (mmproj-F16.gguf) e um .gguf
    de ~6 GB — o r76 achava que "modelo achado" quando so tinha o
    projetor; agora o leitor so esta pronto com os DOIS arquivos certos;
  - visao.bat (CRLF puro, sem REM com parentese) como alternativa manual.
Kill-switch: 'visao_local': false no config.json.
"""
import os
import time
import tempfile
import unittest


def _ligar_com(amb, aguardar=1):
    import types
    f = amb['_r94_ligar_visao_servidor']
    # a funcao usa globals() = o dict em que foi exec'ada; para usar o amb2/amb3
    # com o _r67_ler_config novo, re-executamos com o globals trocado:
    novo = types.FunctionType(f.__code__, amb, f.__name__, f.__defaults__, f.__closure__)
    return novo(log=lambda m: None, aguardar=aguardar)

from test_roteamento_conversa import SOURCE, carregar


class FuncoesPurasR94(unittest.TestCase):
    def setUp(self):
        self.env = carregar('_r94_urls_visao', '_r94_planejar_visao',
                            '_r94_texto_visao_bat', '_r94_achar_zip_windows')

    def test_urls_canonicas(self):
        u = self.env['_r94_urls_visao']()
        self.assertIn('api.github.com/repos/ggml-org/llama.cpp/releases?per_page=10',
                      u['api_llama'])
        # r96: fontes PUBLICAS (bartowski e gated -> 401 anônimo)
        self.assertTrue(all('huggingface.co' in f for f in u['modelo_fontes']))
        self.assertNotIn('bartowski', u['modelo_fontes'][0])
        self.assertTrue(u['modelo_fontes'][0].endswith(
            'Llama-3.2-11B-Vision-Instruct.Q4_K_M.gguf'))
        self.assertTrue(u['mmproj_fontes'][0].endswith(
            'Llama-3.2-11B-Vision-Instruct-mmproj.f16.gguf'))
        self.assertTrue(len(u['modelo_fontes']) >= 2)  # tem reserva
        self.assertEqual(u['porta'], 8081)
        self.assertEqual(u['arq_exe'], 'llama-server.exe')

    def test_achar_zip_windows(self):
        achar = self.env['_r94_achar_zip_windows']
        releases = [
            {'assets': [
                {'name': 'llama-b10970-bin-win-cpu-arm64.zip', 'browser_download_url': 'http://x/arm'},
                {'name': 'cudart-llama-bin-win-cuda-12.4-x64.zip', 'browser_download_url': 'http://x/cuda'},
                {'name': 'llama-b10970-bin-win-cpu-x64.zip', 'browser_download_url': 'http://x/cpu'},
            ]},
        ]
        self.assertEqual(achar(releases), 'http://x/cpu')
        # sem CPU x64 -> ''
        sem = [{'assets': [{'name': 'llama-b10970-bin-win-cpu-arm64.zip',
                            'browser_download_url': 'http://x/arm'}]}]
        self.assertEqual(achar(sem), '')
        self.assertEqual(achar([]), '')
        self.assertEqual(achar(None), '')

    def test_planejar_visao(self):
        planejar = self.env['_r94_planejar_visao']
        # servidor no ar = pronto, independentemente do resto
        self.assertEqual(planejar(True, True, True, True), ['pronto'])
        # tudo baixado, porta fora = so ligar
        self.assertEqual(planejar(True, True, True, False), ['ligar_servidor'])
        # faltas -> lista do que baixar
        self.assertEqual(sorted(planejar(False, False, False, False)),
                         ['baixar_exe', 'baixar_mmproj', 'baixar_modelo'])
        self.assertEqual(planejar(True, True, False, False), ['baixar_mmproj'])

    def test_bat_crlf_puro_sem_rem_parentese(self):
        txt = self.env['_r94_texto_visao_bat']()
        self.assertTrue(txt.startswith('@echo off\r\n'))
        self.assertTrue(txt.endswith('\r\n'))
        self.assertNotIn('\n', txt.replace('\r\n', ''))  # CRLF puro
        self.assertIn('--port 8081', txt)
        self.assertIn('--mmproj', txt)
        self.assertIn('llama-server.exe', txt)
        self.assertNotIn('REM (', txt)  # regra do .bat Windows


class BaixarVisaoR94(unittest.TestCase):
    def _env(self, td, ler_config=None):
        baixados = []

        def _tamanho_de(url):
            u = str(url).lower()
            if 'mmproj' in u:
                return 1940 * 1024 * 1024
            if 'q4_k_m' in u or '.gguf' in u:
                return 5960 * 1024 * 1024
            return 20 * 1024 * 1024

        def _escreve_sparso(caminho, tamanho):
            with open(caminho, 'wb') as f:
                f.seek(tamanho - 1)
                f.write(b'x')

        def baixar(url, destino):
            baixados.append(url)
            _escreve_sparso(destino, _tamanho_de(url))

        def extrair(zipcaminho, dir_destino):
            _escreve_sparso(os.path.join(dir_destino, 'llama-server.exe'),
                            20 * 1024 * 1024)

        def api_list():
            return [
                {'tag_name': 'b9999', 'assets': [
                    {'name': 'llama-b9999-bin-win-cpu-arm64.zip',
                     'browser_download_url': 'http://fake/arm64.zip'},
                    {'name': 'cudart-llama-bin-win-cuda-12.4-x64.zip',
                     'browser_download_url': 'http://fake/cuda.zip'},
                    {'name': 'llama-b9999-bin-win-cpu-x64.zip',
                     'browser_download_url': 'http://fake/llama-b9999-bin-win-cpu-x64.zip'},
                ]},
            ]

        amb = carregar('_r94_urls_visao', '_r94_caminhos_visao', '_r94_visao_baixar',
                       '_r94_peca_completa', PASTA_BASE=td, os=os, time=time,
                       baixar=baixar, extrair=extrair, api_list=api_list)
        amb['_r67_ler_config'] = ler_config or (lambda *a, **k: True)
        amb['_BAIXADOS'] = baixados
        return amb

    def test_kill_switch(self):
        with tempfile.TemporaryDirectory() as td:
            amb = self._env(td, ler_config=lambda *a, **k: False)
            self.assertIsNone(amb['_r94_visao_baixar'](baixar=amb['baixar'],
                                              extrair=amb['extrair'],
                                              api_list=amb['api_list']))
            self.assertEqual(amb['_BAIXADOS'], [])

    def test_download_completo_e_bat(self):
        with tempfile.TemporaryDirectory() as td:
            amb = self._env(td)
            msg = amb['_r94_visao_baixar'](baixar=amb['baixar'],
                                 extrair=amb['extrair'],
                                 api_list=amb['api_list'])
            self.assertTrue(str(msg).startswith('Visao local instalada'), msg)
            c = amb['_r94_caminhos_visao'](pasta=td)
            self.assertTrue(os.path.isfile(c['exe']))
            self.assertTrue(os.path.isfile(c['modelo']))
            self.assertTrue(os.path.isfile(c['mmproj']))
            self.assertTrue(os.path.isfile(c['bat']))
            txt = open(c['bat'], encoding='utf-8').read()
            self.assertIn('llama-server.exe', txt)
            self.assertIn('--port 8081', txt)
            # o build do Windows x64 foi escolhido (nao o arm64)
            self.assertIn('llama-b9999-bin-win-cpu-x64.zip', ' '.join(amb['_BAIXADOS']))
            # segunda chamada: tudo ja existe -> nao rebaixa nada
            n_antes = len(amb['_BAIXADOS'])
            amb['_r94_visao_baixar'](baixar=amb['baixar'], extrair=amb['extrair'],
                           api_list=amb['api_list'])
            self.assertEqual(len(amb['_BAIXADOS']), n_antes)

    def test_peca_parcial_e_rebaixada(self):
        with tempfile.TemporaryDirectory() as td:
            amb = self._env(td)
            c = amb['_r94_caminhos_visao'](pasta=td)
            os.makedirs(os.path.dirname(c['modelo']), exist_ok=True)
            with open(c['modelo'], 'wb') as f:
                f.write(b'x' * 1024 * 1024)  # 1 MB — deveria ter ~7.5 GB
            msg = amb['_r94_visao_baixar'](baixar=amb['baixar'], extrair=amb['extrair'],
                                           api_list=amb['api_list'])
            self.assertTrue(str(msg).startswith('Visao local instalada'), msg)
            # o parcial foi re-baixado com o tamanho de verdade
            self.assertGreaterEqual(os.path.getsize(c['modelo']),
                                    5500 * 1024 * 1024)

    def test_peca_completa_pura(self):
        amb = carregar('_r94_peca_completa', os=os)
        with tempfile.TemporaryDirectory() as td:
            _f = os.path.join(td, 'peca')
            self.assertFalse(amb['_r94_peca_completa'](_f, 10))
            with open(_f, 'wb') as fh:
                fh.seek(10 * 1024 * 1024 - 1); fh.write(b'x')
            self.assertTrue(amb['_r94_peca_completa'](_f, 10))
            with open(_f, 'wb') as fh:
                fh.write(b'x' * 1024)
            self.assertFalse(amb['_r94_peca_completa'](_f, 10))

    def test_fonte_reserva_quando_a_primaria_falha(self):
        with tempfile.TemporaryDirectory() as td:
            amb = self._env(td)
            c = amb['_r94_caminhos_visao'](pasta=td)
            _orig_baixar = amb['baixar']

            def baixar_sem_primaria(url, destino):
                u = str(url)
                # so a fonte primaria do MODELO esta fora (o projetor segue ok)
                if 'leafspark' in u and 'Q4_K_M' in u:
                    raise ConnectionError('fonte primaria do modelo fora')
                _orig_baixar(url, destino)

            amb3 = carregar('_r94_urls_visao', '_r94_caminhos_visao', '_r94_visao_baixar',
                            '_r94_peca_completa', PASTA_BASE=td, os=os, time=time,
                            baixar=baixar_sem_primaria, extrair=amb['extrair'],
                            api_list=amb['api_list'])
            amb3['_r67_ler_config'] = lambda *a, **k: True
            msg = amb3['_r94_visao_baixar'](baixar=baixar_sem_primaria,
                                            extrair=amb['extrair'],
                                            api_list=amb['api_list'])
            self.assertTrue(str(msg).startswith('Visao local instalada'), msg)
            self.assertGreaterEqual(os.path.getsize(c['modelo']),
                                    5500 * 1024 * 1024)

    def test_limpa_gguf_antigo_de_download_anterior(self):
        with tempfile.TemporaryDirectory() as td:
            amb = self._env(td)
            c = amb['_r94_caminhos_visao'](pasta=td)
            os.makedirs(os.path.dirname(c['modelo']), exist_ok=True)
            with open(os.path.join(os.path.dirname(c['modelo']),
                                   'Llama-3.2-11B-Vision-Instruct-Q4_K_M.gguf'), 'wb') as f:
                f.write(b'x' * 1024 * 1024)  # parcial antigo (nome da r94)
            msg = amb['_r94_visao_baixar'](baixar=amb['baixar'], extrair=amb['extrair'],
                                           api_list=amb['api_list'])
            self.assertTrue(str(msg).startswith('Visao local instalada'), msg)
            self.assertFalse(os.path.exists(
                os.path.join(os.path.dirname(c['modelo']),
                             'Llama-3.2-11B-Vision-Instruct-Q4_K_M.gguf')))

    def test_falha_de_download_e_honesta(self):
        with tempfile.TemporaryDirectory() as td:
            amb = self._env(td)

            def baixar_falha(url, destino):
                raise ConnectionError('rede caiu')
            amb['_r67_ler_config'] = lambda *a, **k: True
            amb['baixar'] = baixar_falha
            # carregar de novo com a baixar quebrada (exec novo)
            amb2 = carregar('_r94_urls_visao', '_r94_caminhos_visao', '_r94_visao_baixar',
                            '_r94_peca_completa', PASTA_BASE=td, os=os, time=time,
                            baixar=baixar_falha, extrair=amb['extrair'],
                            api_list=amb['api_list'])
            amb2['_r67_ler_config'] = lambda *a, **k: True
            msg = amb2['_r94_visao_baixar'](baixar=amb2['baixar'], extrair=amb2['extrair'],
                                  api_list=amb2['api_list'])
            self.assertIn('falhou', str(msg).lower())
            self.assertIn('baixar visao', str(msg))


class WiringR94(unittest.TestCase):
    """Verificacao no CODIGO (regra do dono: evidencia, nao suposicao)."""

    def setUp(self):
        self.fonte = SOURCE.read_text(encoding='utf-8')

    def test_rota_baixar_visao(self):
        i = self.fonte.find('if cmd.startswith("baixar visao"):')
        self.assertGreater(i, 0)
        trecho = self.fonte[i:i + 1500]
        self.assertIn('_r94_visao_baixar()', trecho)
        self.assertIn("sim/nao", trecho)  # confirmacao explicita
        self.assertIn('NUNCA sai do seu PC', trecho)

    def test_mmproj_nao_conta_como_modelo(self):
        i = self.fonte.find('def _r92_leitor_pronto():')
        j = self.fonte.find('\ndef ', i + 10)
        corpo = self.fonte[i:j]
        self.assertIn('mmproj', corpo)          # o guard existe
        self.assertIn("'visao_local'", corpo)   # kill-switch respeitado

    def test_auto_ligacao_na_rota_e_no_ciclo(self):
        self.assertGreaterEqual(self.fonte.count('_r94_tentar_visao'), 3)
        # ciclo: tenta ligar ANTES de logar "aguardando quieto"
        i = self.fonte.find('def _r88_ciclo(')
        trecho = self.fonte[i:i + 3000]
        self.assertIn('_r94_tentar_visao', trecho)
        # atexit derruba o servidor que o agente ligou
        self.assertIn('_r94_matar_visao', self.fonte)
        self.assertIn('_at94.register', self.fonte)

    def test_ligar_servidor_aguarda_e_registra(self):
        with tempfile.TemporaryDirectory() as td:
            import socket as _sock
            amb = carregar('_r94_ligar_visao_servidor', '_r94_porta_no_ar',
                           '_r94_caminhos_visao', PASTA_BASE=td, os=os, time=time)
            # sonda: porta com servidor de verdade -> True; porta morta -> False
            s = _sock.socket()
            s.bind(('127.0.0.1', 0))
            s.listen(1)
            _porta = s.getsockname()[1]
            _morta = min(_porta + 100, 65535)
            try:
                self.assertTrue(amb['_r94_porta_no_ar'](_porta))
                self.assertFalse(amb['_r94_porta_no_ar'](_morta))
                # a funcao consulta 'visao_porta' no config -> aponta p/ as portas de teste
                amb2 = dict(amb)
                amb2['_r67_ler_config'] = lambda chave, padrao=True: _morta
                # porta MORTA + pecas faltando (pasta vazia) -> False, sem Popen
                self.assertFalse(_ligar_com(amb2, aguardar=1))
                # porta NO AR -> True na hora, sem abrir processo nenhum
                amb3 = dict(amb)
                amb3['_r67_ler_config'] = lambda chave, padrao=True: _porta
                self.assertTrue(_ligar_com(amb3, aguardar=1))
                self.assertNotIn('_R94_VISAO_PROC', amb3)
            finally:
                s.close()
