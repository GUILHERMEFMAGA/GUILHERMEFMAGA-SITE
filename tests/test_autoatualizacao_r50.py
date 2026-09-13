"""r50: 'atualizar agora' — a autoatualizacao oficial (URL oficial +
cache-buster, tamanho, py_compile, comparacao, backup, troca, reinicio)
rodando pela CONVERSA, sem fechar nem reabrir o iniciar.bat. Comportamento
com downloader/confirmar/reiniciar injetados e caminhos em pasta temporaria;
SEM_ATUALIZAR.txt bloqueia; qualquer falha NAO troca nada. Sem rede real."""
import io
import os
import tempfile
import unittest
from contextlib import redirect_stdout

from test_roteamento_conversa import carregar

NOVO_FONTE = ("# r50 simulado\n" + "# linha para atingir o tamanho minimo\n" * 8000)


class AtualizarAgente(unittest.TestCase):
    def _ambiente(self, conteudo_atual="print('velho')\n", sem_atualizar=False):
        pasta = tempfile.mkdtemp()
        origem = os.path.join(pasta, 'agente.py')
        backup = os.path.join(pasta, 'agente_backup.py')
        with io.open(origem, 'w', encoding='utf-8') as f:
            f.write(conteudo_atual)
        if sem_atualizar:
            with io.open(os.path.join(pasta, 'SEM_ATUALIZAR.txt'), 'w') as f:
                f.write('bloqueado')
        reinicios = []
        env = carregar('_r50_atualizar_agente', os=os)
        return env, origem, backup, reinicios.append

    def test_sem_atualizar_txt_bloqueia(self):
        env, origem, backup, _ = self._ambiente(sem_atualizar=True)
        saida = env['_r50_atualizar_agente'](downloader=lambda: NOVO_FONTE,
                                             origem=origem, backup=backup,
                                             reiniciar=lambda: None)
        self.assertIn('DESATIVADA', saida)
        self.assertIn('SEM_ATUALIZAR', saida)
        with io.open(origem, encoding='utf-8') as f:
            self.assertEqual(f.read(), "print('velho')\n")  # nada trocado

    def test_confirmacao_negativa_cancela_antes_de_baixar(self):
        env, origem, backup, _ = self._ambiente()
        chamadas = []

        def downloader_que_nao_deve_rodar():
            chamadas.append(1)
            return NOVO_FONTE

        saida = env['_r50_atualizar_agente'](downloader=downloader_que_nao_deve_rodar,
                                             confirmar=lambda m: False,
                                             origem=origem, backup=backup,
                                             reiniciar=lambda: None)
        self.assertIn('cancelada', saida)
        self.assertEqual(chamadas, [])  # a negativa cancela ANTES de baixar
        self.assertFalse(os.path.exists(backup))

    def test_download_pequeno_e_abortado_sem_trocar_nada(self):
        env, origem, backup, _ = self._ambiente()
        saida = env['_r50_atualizar_agente'](downloader=lambda: 'curto',
                                             confirmar=lambda m: True,
                                             origem=origem, backup=backup,
                                             reiniciar=lambda: None)
        self.assertIn('NADA foi trocado', saida)
        self.assertFalse(os.path.exists(backup))

    def test_fonte_que_nao_compila_e_rejeitado(self):
        env, origem, backup, _ = self._ambiente()
        quebrado = ('def quebrado(:\n' + '# preenchimento\n' * 8000)
        saida = env['_r50_atualizar_agente'](downloader=lambda: quebrado,
                                             confirmar=lambda m: True,
                                             origem=origem, backup=backup,
                                             reiniciar=lambda: None)
        self.assertIn('NAO compila', saida)
        self.assertIn('continua como estava', saida)
        self.assertFalse(os.path.exists(backup))

    def test_conteudo_igual_nao_reinicia(self):
        env, origem, backup, _ = self._ambiente(conteudo_atual=NOVO_FONTE)
        reiniciou = []
        saida = env['_r50_atualizar_agente'](downloader=lambda: NOVO_FONTE,
                                             confirmar=lambda m: True,
                                             origem=origem, backup=backup,
                                             reiniciar=reiniciou.append)
        self.assertIn('ja esta na versao oficial mais nova', saida)
        self.assertEqual(reiniciou, [])

    def test_sucesso_faz_backup_troca_e_reinicia(self):
        env, origem, backup, marcar = self._ambiente()
        reiniciou = []
        saida = env['_r50_atualizar_agente'](downloader=lambda: NOVO_FONTE,
                                             confirmar=lambda m: True,
                                             origem=origem, backup=backup,
                                             reiniciar=lambda: reiniciou.append(1))
        self.assertIn('fiz backup', saida)
        self.assertIn('troquei o agente.py', saida)
        with io.open(backup, encoding='utf-8') as f:
            self.assertEqual(f.read(), "print('velho')\n")
        with io.open(origem, encoding='utf-8') as f:
            self.assertEqual(f.read(), NOVO_FONTE)
        self.assertEqual(len(reiniciou), 1)  # reiniciar foi chamado

    def test_bytes_sao_aceitos_no_downloader(self):
        env, origem, backup, _ = self._ambiente()
        saida = env['_r50_atualizar_agente'](downloader=lambda: NOVO_FONTE.encode('utf-8'),
                                             confirmar=lambda m: True,
                                             origem=origem, backup=backup,
                                             reiniciar=lambda: None)
        self.assertIn('troquei o agente.py', saida)


class ComandoERoteamento(unittest.TestCase):
    def test_rota_responde_e_comando_estranho_nao_captura(self):
        def fake_atualizar(*_a, **_k):
            return 'FAKE ATUALIZADO'
        env = carregar('_r50_comandos', '_norm_pt')
        env['_r50_atualizar_agente'] = fake_atualizar  # sobrepoe o real (prefixo _r50_ auto-carrega)
        tampao = io.StringIO()
        with redirect_stdout(tampao):
            self.assertTrue(env['_r50_comandos']('atualizar agora'))
        self.assertIn('FAKE ATUALIZADO', tampao.getvalue())
        with redirect_stdout(io.StringIO()):
            self.assertTrue(env['_r50_comandos']('atualizar agente'))
            self.assertTrue(env['_r50_comandos']('atualizar'))
            self.assertFalse(env['_r50_comandos']('status'))
            self.assertFalse(env['_r50_comandos']('atualizar o chrome via winget'))

    def test_cadeia_e_estrutura_no_fonte(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        # _r50 antes de _r43 na cadeia de comandos
        self.assertLess(texto.index('if _r50_comandos(comando):'),
                        texto.index('if _r43_comandos(comando):'))
        self.assertIn("URL_AGENTE_OFICIAL + ('?cache=%d'", texto)  # usa a URL oficial
        self.assertIn('subprocess.Popen([_sys.executable, origem])', texto)
        self.assertIn('os._exit(0)', texto)
        self.assertIn("'atualizar agora' baixa a versao oficial", texto)  # menu
        self.assertIn('[Motor e avaliacao local 2026-09-11-r65]', texto)

    def test_caminhos_derivados_de_file(self):
        env = carregar('_r50_caminhos_agente', os=os, __file__='/x/y/agente.py')
        origem, backup = env['_r50_caminhos_agente']()
        self.assertEqual(origem.replace('\\', '/'), '/x/y/agente.py')
        self.assertEqual(backup.replace('\\', '/'), '/x/y/agente_backup.py')


if __name__ == '__main__':
    unittest.main()
