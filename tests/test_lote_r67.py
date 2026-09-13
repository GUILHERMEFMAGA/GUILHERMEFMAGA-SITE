"""r67: LOTE SAUDE + PODER — as 20 ideias aprovadas, todas com FATOS locais ou
acoes reversiveis, cada uma injetavel para teste sem rede e sem importar o
agente. Destaques: checkpoint/rollback (cinto de seguranca), modo aviao que
BLOQUEIA a atualizacao antes da r62, velocimetro lendo as medidas REAIS da
r24, r62 honesta ('ja esta em dia' quando identico) e silencio da voz."""
import datetime
import io
import os
import tempfile
import unittest
from contextlib import redirect_stdout
from types import SimpleNamespace

from test_roteamento_conversa import carregar

BAT_BOM = ('@echo off\r\n' + 'REM linha de vistoria\r\n' * 60
           + ':pedir_admin\r\nset "R58_ARGS="\r\n:quebrou\r\necho ok\r\n')
MAIN_BOM = "import os\n" + "# main de verdade com tamanho real\n" * 6 + "print('main novo')\n"


def _env(*nomes):
    return carregar(*nomes, '_norm_pt', os=os)


class Checkpoints(unittest.TestCase):
    def test_criar_e_restaurar_o_ciclo_completo(self):
        pasta = tempfile.mkdtemp()
        for nome, conteudo in (('agente.py', "print('velho')"), ('main.py', 'x = 1'),
                               ('config.json', '{"a": 1}')):
            io.open(os.path.join(pasta, nome), 'w').write(conteudo)
        env = _env('_r67_checkpoint_criar', '_r67_checkpoint_restaurar')
        saida = env['_r67_checkpoint_criar'](pasta=pasta, agora=datetime.datetime(2026, 9, 13, 8, 30))
        self.assertIn('checkpoint_20260913_083000.zip', saida)
        self.assertIn('3 arquivo(s)', saida)
        # estraga a casa e restaura
        io.open(os.path.join(pasta, 'main.py'), 'w').write('estragado = True')
        saida2 = env['_r67_checkpoint_restaurar'](pasta=pasta)
        self.assertIn('[OK] restaurado', saida2)
        self.assertEqual(io.open(os.path.join(pasta, 'main.py')).read(), 'x = 1')
        self.assertFalse(os.path.exists(os.path.join(pasta, 'iniciar.bat')))

    def test_bat_restaurado_vai_para_o_tmp_mecanismo_de_sempre(self):
        pasta = tempfile.mkdtemp()
        io.open(os.path.join(pasta, 'main.py'), 'w').write('x = 1')
        import zipfile
        with zipfile.ZipFile(os.path.join(pasta, 'checkpoint_1.zip'), 'w') as z:
            z.writestr('iniciar.bat', BAT_BOM)
        env = _env('_r67_checkpoint_restaurar')
        saida = env['_r67_checkpoint_restaurar'](pasta=pasta)
        self.assertFalse(os.path.exists(os.path.join(pasta, 'iniciar.bat')))
        with io.open(os.path.join(pasta, '_atualizacao_iniciar.tmp'), 'rb') as f:
            self.assertIn(b':pedir_admin', f.read())
        self.assertIn('mecanismo de sempre', saida)

    def test_sem_checkpoint_e_honesto(self):
        env = _env('_r67_checkpoint_restaurar')
        self.assertIn("criar checkpoint", env['_r67_checkpoint_restaurar'](pasta=tempfile.mkdtemp()))


class ModoAviao(unittest.TestCase):
    def _env(self, ligado):
        import json
        env = carregar('_r67_comandos', '_norm_pt', os=os, json=json)
        env['_r67_modo_aviao_ligado'] = lambda: ligado
        env['_R67_GATILHOS_ATUALIZAR'] = frozenset((
            'atualizaragora', 'atualizaagora', 'atualisaagora', 'atualisaragora',
            'atualiseagora', 'atualizaroagente', 'atualizeoagente', 'atualizaragente',
            'atualizagente', 'atualiza', 'atualizar', 'atualize'))
        return env

    def test_modo_aviao_bloqueia_a_atualizacao_antes_da_r62(self):
        env = self._env(True)
        tampao = io.StringIO()
        with redirect_stdout(tampao):
            ok = env['_r67_comandos']('atualizar agora')
        self.assertTrue(ok)
        self.assertIn('[Modo aviao]', tampao.getvalue())
        self.assertIn('desligar modo aviao', tampao.getvalue())

    def test_sem_modo_aviao_a_atualizacao_passa_ileso(self):
        env = self._env(False)
        with redirect_stdout(io.StringIO()):
            self.assertFalse(env['_r67_comandos']('atualizar agora'))

    def test_conversa_normal_nao_e_bloqueada_pelo_aviao(self):
        env = self._env(True)
        with redirect_stdout(io.StringIO()):
            self.assertFalse(env['_r67_comandos']('conte uma piada'))


class Diagnosticos(unittest.TestCase):
    def test_python_com_fatos_injetados(self):
        sysmod = SimpleNamespace(version='3.11.4 (vago)', executable='C:\\py.exe')
        env = _env('_r67_diagnostico_python')
        saida = env['_r67_diagnostico_python'](sysmod=sysmod,
                                               achar=lambda s: object() if s == 'requests' else None)
        self.assertIn('Python em uso: 3.11.4', saida)
        self.assertIn('[OK] requests', saida)
        self.assertIn('[INFO] llama_cpp (nao instalada)', saida)

    def test_defender_tempo_real_passa_as_linhas(self):
        class Falso:
            returncode = 0
            stdout = 'AMServiceEnabled : True\nRealTimeProtectionEnabled : True\n'
        env = _env('_r67_diagnostico_defender')
        saida = env['_r67_diagnostico_defender'](executar=lambda: Falso())
        self.assertIn('RealTimeProtectionEnabled : True', saida)
        self.assertIn('AGORA', saida)

    def test_defender_falhando_da_o_caminho_da_janela(self):
        def explodir():
            raise RuntimeError('powershell sumiu')
        env = _env('_r67_diagnostico_defender')
        saida = env['_r67_diagnostico_defender'](executar=explodir)
        self.assertIn('Seguranca do Windows', saida)

    def test_disco_lista_e_pc_se_apresenta(self):
        class Falso:
            returncode = 0
            stdout = 'SSD1  Healthy\nC  120.5\n'
        env = _env('_r67_diagnostico_disco', '_r67_quem_e_este_pc')
        saida_d = env['_r67_diagnostico_disco'](executar=lambda: Falso())
        self.assertIn('Healthy', saida_d)
        pl = SimpleNamespace(system=lambda: 'Windows', release=lambda: '11',
                             machine=lambda: 'AMD64', processor=lambda: 'Ryzen 9')
        saida_p = env['_r67_quem_e_este_pc'](platform_mod=pl, executar=lambda: '16GB')
        self.assertIn('Windows 11 (AMD64)', saida_p)
        self.assertIn('Ryzen 9', saida_p)
        self.assertIn('RAM: 16GB', saida_p)


class Motor(unittest.TestCase):
    def test_velocimetro_usa_as_medidas_reais(self):
        env = _env('_r67_velocimetro')
        tempos = [{'tokens': 100, 'segundos': 2.0}, {'tokens': 60, 'segundos': 1.0},
                  {'tokens': 'lixo', 'segundos': 3.0}]
        saida = env['_r67_velocimetro'](tempos=tempos)
        self.assertIn('2 geracoes REAIS', saida)
        self.assertIn('media: 55.0 tokens/segundo', saida)

    def test_velocimetro_sem_dados_e_honesto(self):
        env = _env('_r67_velocimetro')
        saida = env['_r67_velocimetro'](tempos=[])
        self.assertIn('[INFO] ainda nao ha geracoes medidas', saida)

    def test_estresse_reune_os_fatos_do_servidor(self):
        env = _env('_r67_teste_estresse')
        saida = env['_r67_teste_estresse'](tempos=[], disponivel=lambda: True, modelo='qwen2-7b.Q4.gguf')
        self.assertIn('no ar', saida)
        self.assertIn('qwen2-7b.Q4.gguf', saida)


class TradutorDeErros(unittest.TestCase):
    def test_termos_conhecidos_e_faro_da_casa(self):
        env = _env('_r67_traduzir_erro')
        saida = env['_r67_traduzir_erro']('PermissionError: agente.py access denied 0x80070005')
        self.assertIn('acesso NEGADO (permissao)', saida)
        self.assertIn('ARQUIVOS DA CASA', saida)
        self.assertIn('diagnostico do iniciar', saida)

    def test_erro_estrangeiro_nao_vira_chute(self):
        env = _env('_r67_traduzir_erro')
        saida = env['_r67_traduzir_erro']('Erro 0x815 do driver da impressora XPTO')
        self.assertIn('NAO invento cura', saida)
        self.assertNotIn('ARQUIVOS DA CASA', saida)

    def test_vazio_pega_o_erro(self):
        env = _env('_r67_traduzir_erro')
        self.assertIn("Cole o erro", env['_r67_traduzir_erro'](''))


class Atalhos(unittest.TestCase):
    def test_conferir_aponta_certos_e_errados(self):
        class Falso:
            returncode = 0
            stdout = 'Meu Agente.lnk|C:\\Users\\gfmag\\agente_pc\\iniciar.bat\nVelho.lnk|C:\\Users\\gfmag\\iniciar.bat\nChrome.lnk|C:\\chrome.exe\n'
        env = _env('_r67_conferir_atalho')
        saida = env['_r67_conferir_atalho'](executar=lambda: Falso())
        self.assertIn('[OK] Meu Agente.lnk', saida)
        self.assertIn('[ERRADO] Velho.lnk', saida)
        self.assertIn('consertar atalho', saida)

    def test_consertar_reporta_o_que_fez(self):
        class Falso:
            returncode = 0
            stdout = 'CONSERTADO|Velho.lnk\n'
        env = _env('_r67_consertar_atalho')
        saida = env['_r67_consertar_atalho'](executar=lambda: Falso())
        self.assertIn('[OK] atalho(s) consertado(s): Velho.lnk', saida)


class VidaDeCasa(unittest.TestCase):
    def test_apelido_salva_e_responde(self):
        pasta = tempfile.mkdtemp()
        import json
        env = carregar('_r67_definir_apelido', '_r67_qual_meu_nome', '_r67_ler_config',
                       '_r67_definir_config', os=os, json=json)
        saida = env['_r67_definir_apelido']('Chefe', pasta=pasta)
        self.assertIn('Vou te chamar de Chefe', saida)
        self.assertIn('Voce e Chefe', env['_r67_qual_meu_nome'](pasta=pasta))
        self.assertIn('nao defini', env['_r67_qual_meu_nome'](pasta=tempfile.mkdtemp()))

    def test_silencio_pausa_e_vence(self):
        env = _env('_r67_silenciar', '_r67_voz_silenciada', '_r67_liberar_voz')
        base = datetime.datetime(2026, 9, 13, 10, 0)
        self.assertIn('por 10 minuto(s)', env['_r67_silenciar'](10, agora=base))
        self.assertTrue(env['_r67_voz_silenciada'](agora=base + datetime.timedelta(minutes=5)))
        self.assertFalse(env['_r67_voz_silenciada'](agora=base + datetime.timedelta(minutes=11)))
        env['_r67_silenciar'](30, agora=base)
        env['_r67_liberar_voz']()
        self.assertFalse(env['_r67_voz_silenciada'](agora=base))

    def test_sair_e_atualizar_so_com_pendencia(self):
        pasta = tempfile.mkdtemp()
        env = _env('_r67_sair_e_atualizar')
        saida = env['_r67_sair_e_atualizar'](pasta=pasta)
        self.assertIn('Nao ha atualizacao', saida)
        io.open(os.path.join(pasta, '_atualizacao_iniciar.tmp'), 'wb').write(b'x')
        mortes = []
        env['_r67_sair_e_atualizar'](pasta=pasta, encerrar=mortes.append)
        self.assertEqual(mortes, [0])

    def test_config_salvar_e_voltar(self):
        pasta = tempfile.mkdtemp()
        env = _env('_r67_salvar_config', '_r67_voltar_config')
        io.open(os.path.join(pasta, 'config.json'), 'w').write('{"nivel_permissao": "admin"}')
        saida = env['_r67_salvar_config'](pasta=pasta, agora=datetime.datetime(2026, 9, 13, 9, 0))
        self.assertIn('config_20260913_090000.json', saida)
        io.open(os.path.join(pasta, 'config.json'), 'w').write('{"nivel_permissao": "bagunca"}')
        saida2 = env['_r67_voltar_config'](pasta=pasta)
        self.assertIn('[OK] config.json voltou', saida2)
        self.assertIn('admin', io.open(os.path.join(pasta, 'config.json')).read())


class CadernoERegistro(unittest.TestCase):
    def test_caderno_le_o_proprio_codigo(self):
        tmp = tempfile.mkdtemp()
        caminho = os.path.join(tmp, 'agente.py')
        io.open(caminho, 'w').write('def _r53_comandos(): pass\ndef _r61_comandos(): pass\n' + '# x\n' * 10)
        env = _env('_r67_caderno_de_poderes')
        saida = env['_r67_caderno_de_poderes'](caminho=caminho)
        self.assertIn('r53, r61', saida)

    def test_resumo_raio_x_e_economia_andam_juntos(self):
        env = _env('_r67_registrar', '_r67_resumo_da_sessao', '_r67_raio_x', '_r67_economia')
        self.assertIn('Nada ainda', env['_r67_resumo_da_sessao']())
        env['_r67_registrar']('FATOS', 'diagnostico do iniciar')
        env['_r67_registrar']('CASA', 'checkpoint criado')
        self.assertIn('checkpoint criado', env['_r67_resumo_da_sessao']())
        self.assertIn('Ultima decisao minha: [CASA]', env['_r67_raio_x']())
        economia = env['_r67_economia']()
        self.assertIn('1 atendimento(s) resolvidos por FATOS', economia)
        self.assertIn('~300 tokens', economia)


class Reexame(unittest.TestCase):
    def test_agenda_o_exame_12h_e_respeita_o_modo_aviao(self):
        agendados = []
        env = _env('_r67_agendar_reexame', '_r67_modo_aviao_ligado')
        env['_r67_modo_aviao_ligado'] = lambda: False
        rodou = []
        env['_r67_agendar_reexame'](intervalo=43200, agendar=lambda f, s: agendados.append(s) or rodou.append(f),
                                    diagnosticar=lambda: rodou.append('exame'))
        self.assertEqual(agendados, [43200])
        agendados.clear()
        env['_r67_modo_aviao_ligado'] = lambda: True
        self.assertFalse(env['_r67_agendar_reexame'](agendar=lambda f, s: agendados.append(s)))
        self.assertEqual(agendados, [])


class RotaR67(unittest.TestCase):
    def test_comandos_chegam_nos_trabalhadores(self):
        env = _env('_r67_comandos')
        vistos = []

        def marcar(nome):
            def fun(*a, **k):
                vistos.append(nome)
                return 'FEITO ' + nome
            return fun
        for nome in ('_r67_checkpoint_criar', '_r67_checkpoint_restaurar', '_r67_velocimetro',
                     '_r67_teste_estresse', '_r67_diagnostico_python', '_r67_diagnostico_defender',
                     '_r67_diagnostico_disco', '_r67_quem_e_este_pc', '_r67_resumo_da_sessao',
                     '_r67_raio_x', '_r67_caderno_de_poderes', '_r67_economia',
                     '_r67_conferir_atalho', '_r67_consertar_atalho', '_r67_qual_meu_nome',
                     '_r67_silenciar', '_r67_liberar_voz', '_r67_salvar_config', '_r67_voltar_config'):
            env[nome] = marcar(nome)
        for frase in ('criar checkpoint', 'restaurar checkpoint', 'velocimetro da ia',
                      'teste de estresse', 'diagnostico do python', 'diagnostico do defender',
                      'diagnostico do disco', 'quem e este pc', 'resumo da sessao',
                      'raio-x da decisao', 'meus poderes', 'economia', 'conferir atalho',
                      'consertar atalho', 'qual meu nome', 'nao me perturbe',
                      'permitir voz', 'salvar configuracao', 'voltar configuracao'):
            with redirect_stdout(io.StringIO()):
                self.assertTrue(env['_r67_comandos'](frase), frase)
        self.assertEqual(len(vistos), 19)
        with redirect_stdout(io.StringIO()):
            self.assertFalse(env['_r67_comandos']('conte uma piada'))
            self.assertFalse(env['_r67_comandos']('status'))

    def test_me_chama_de_e_traduz_erro_com_argumento(self):
        env = _env('_r67_comandos')
        recebidos = []
        env['_r67_definir_apelido'] = lambda nome: recebidos.append(nome) or 'ok'
        with redirect_stdout(io.StringIO()):
            self.assertTrue(env['_r67_comandos']('me chama de Chefe'))
        self.assertEqual(recebidos, ['Chefe'])
        erros = []
        env['_r67_traduzir_erro'] = lambda texto: erros.append(texto) or 'ok'
        with redirect_stdout(io.StringIO()):
            self.assertTrue(env['_r67_comandos']('traduz erro: FileNotFoundError agente.py'))
        self.assertEqual(erros, ['FileNotFoundError agente.py'])


class R62Honesto(unittest.TestCase):
    def _env(self):
        return carregar('_r62_entregar_lancador', os=os)

    def test_identicos_ganham_ja_esta_em_dia_e_nada_e_trocado(self):
        pasta = tempfile.mkdtemp()
        io.open(os.path.join(pasta, 'main.py'), 'w', newline='').write(MAIN_BOM)
        io.open(os.path.join(pasta, 'iniciar.bat'), 'wb').write(BAT_BOM.encode('utf-8'))
        arquivos = {'main.py': MAIN_BOM, 'iniciar.bat': BAT_BOM}
        saida = self._env()['_r62_entregar_lancador'](baixar=arquivos.get, pasta=pasta)
        self.assertIn('main.py ja esta em dia (identico', saida)
        self.assertIn('iniciar.bat ja esta em dia (identico', saida)
        self.assertFalse(os.path.exists(os.path.join(pasta, '_atualizacao_iniciar.tmp')))
        self.assertFalse(os.path.exists(os.path.join(pasta, 'main_backup.py')))

    def test_diferente_continua_trocando(self):
        pasta = tempfile.mkdtemp()
        io.open(os.path.join(pasta, 'main.py'), 'w').write("print('velho e grande o bastante')\n" + '# p\n' * 20)
        arquivos = {'main.py': MAIN_BOM, 'iniciar.bat': BAT_BOM}
        saida = self._env()['_r62_entregar_lancador'](baixar=arquivos.get, pasta=pasta)
        self.assertIn('backup em main_backup.py', saida)
        self.assertTrue(os.path.exists(os.path.join(pasta, '_atualizacao_iniciar.tmp')))


class Estrutura(unittest.TestCase):
    def test_cadeia_menu_selo_e_ganchos(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        self.assertLess(texto.index('if _r67_comandos(comando):'),
                        texto.index('if _r62_comandos(comando):'))
        self.assertIn('LOTE SAUDE (r67)', texto)
        self.assertEqual(texto.count('\n_r67_abertura()'), 1)
        self.assertIn('if not _r67_voz_silenciada():', texto)
        self.assertEqual(texto.count('[Motor e avaliacao local 2026-09-11-r69]'), 1)


if __name__ == '__main__':
    unittest.main()
