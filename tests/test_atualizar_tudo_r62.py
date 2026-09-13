"""r62: 'atualizar agora' COMPLETO — a descoberta do usuario no resgate foi
que o agente.py se atualizava pela conversa mas o iniciar.bat/main.py nao
(o BAT velho ficou preso no bug de admin ate a cirurgia manual no Bloco de
Notas). Agora o comando entrega TUDO: main.py trocado na hora (com backup) e
iniciar.bat via _atualizacao_iniciar.tmp — o proprio BAT em execucao se
aplica SOZINHO quando o agente fecha. Validacao antes de trocar; falha nao
troca nada; sem rede nos testes (baixar injetavel)."""
import io
import os
import tempfile
import unittest
from contextlib import redirect_stdout

from test_roteamento_conversa import carregar

BAT_BOM = ('@echo off\r\n' + 'REM linha de vistoria\r\n' * 60
           + ':pedir_admin\r\nset "R58_ARGS="\r\n:quebrou\r\necho ok\r\n')
MAIN_BOM = "import os\n" + "# main de verdade com tamanho real\n" * 6 + "print('main novo')\n"


def arquivos_bons():
    return {'main.py': MAIN_BOM, 'iniciar.bat': BAT_BOM}


class EntregaDoLancador(unittest.TestCase):
    def _env(self, arquivos=None, falha=False):
        pasta = tempfile.mkdtemp()
        pedidos = []

        def baixar(nome):
            if falha:
                raise RuntimeError('rede fora')
            pedidos.append(nome)
            return arquivos[nome]

        env = carregar('_r62_entregar_lancador', os=os)
        return env, pasta, pedidos, baixar

    def test_entrega_main_direto_e_bat_via_tmp(self):
        env, pasta, pedidos, baixar = self._env(arquivos_bons())
        saida = env['_r62_entregar_lancador'](baixar=baixar, pasta=pasta)
        self.assertEqual(sorted(pedidos), ['iniciar.bat', 'main.py'])
        self.assertIn('[OK] main.py em dia', saida)
        self.assertIn('se aplica SOZINHO quando voce fechar', saida)
        with io.open(os.path.join(pasta, 'main.py'), encoding='utf-8') as f:
            self.assertEqual(f.read(), MAIN_BOM)
        with io.open(os.path.join(pasta, '_atualizacao_iniciar.tmp'), 'rb') as f:
            self.assertIn(b':pedir_admin', f.read())
        # o iniciar.bat ATUAL nao foi sobrescrito (quem aplica e o proprio BAT ao fechar)
        self.assertFalse(os.path.exists(os.path.join(pasta, 'iniciar.bat')))
        # backup do main antigo (nao existia antes: sem backup criado aqui)

    def test_backup_do_main_antigo_e_substituicao(self):
        env, pasta, _, baixar = self._env(arquivos_bons())
        io.open(os.path.join(pasta, 'main.py'), 'w').write("print('velho')\n")
        env['_r62_entregar_lancador'](baixar=baixar, pasta=pasta)
        with io.open(os.path.join(pasta, 'main_backup.py'), encoding='utf-8') as f:
            self.assertEqual(f.read(), "print('velho')\n")

    def test_bat_ruim_ou_main_ruim_nao_trocam_nada(self):
        arquivos = {'main.py': 'def quebrado(:\n' + '# grande e quebrado\n' * 12,
                     'iniciar.bat': 'lixo\n'}
        env, pasta, _, baixar = self._env(arquivos)
        saida = env['_r62_entregar_lancador'](baixar=baixar, pasta=pasta)
        self.assertIn('nao compila; mantive o atual', saida)
        self.assertIn('nao passou na vistoria', saida)
        self.assertFalse(os.path.exists(os.path.join(pasta, 'main.py')))
        self.assertFalse(os.path.exists(os.path.join(pasta, '_atualizacao_iniciar.tmp')))

    def test_rede_fora_mantem_tudo_como_esta(self):
        env, pasta, _, baixar = self._env(falha=True)
        saida = env['_r62_entregar_lancador'](baixar=baixar, pasta=pasta)
        self.assertIn('nao consegui baixar', saida)
        self.assertEqual(os.listdir(pasta), [])


class RotaAtualizarTudo(unittest.TestCase):
    def test_atualizar_agora_entrega_e_delega_para_a_r50(self):
        entregas, delegados = [], []

        def fake_entrega():
            entregas.append(1)
            return 'LANCADOR ENTREGUE'

        def fake_r50(txt):
            delegados.append(txt)
            print('AGENTE ATUALIZADO')
            return True

        env = carregar('_r62_comandos', '_norm_pt', os=os)
        env['_r62_entregar_lancador'] = fake_entrega
        env['_r50_comandos'] = fake_r50
        tampao = io.StringIO()
        with redirect_stdout(tampao):
            ok = env['_r62_comandos']('atualizar agora')
        self.assertTrue(ok)
        self.assertEqual(entregas, [1])
        self.assertEqual(delegados, ['atualizar agora'])
        self.assertIn('LANCADOR ENTREGUE', tampao.getvalue())
        self.assertIn('AGENTE ATUALIZADO', tampao.getvalue())
        with redirect_stdout(io.StringIO()):
            self.assertFalse(env['_r62_comandos']('status'))

    def test_sem_r62_no_ambiente_a_r50_segue_so(self):
        env = carregar('_r50_comandos', '_norm_pt', os=os)
        env['_r50_atualizar_agente'] = lambda: 'SO AGENTE'
        tampao = io.StringIO()
        with redirect_stdout(tampao):
            ok = env['_r50_comandos']('atualizar')
        self.assertTrue(ok)
        self.assertIn('SO AGENTE', tampao.getvalue())


class Estrutura(unittest.TestCase):
    def test_cadeia_menu_e_selo(self):
        with io.open('agente.py', encoding='utf-8') as f:
            texto = f.read()
        self.assertLess(texto.index('if _r62_comandos(comando):'),
                        texto.index('if _r61_comandos(comando):'))
        self.assertIn('e traz main.py/iniciar.bat em dia', texto)
        self.assertEqual(texto.count('[Motor e avaliacao local 2026-09-11-r63]'), 1)


if __name__ == '__main__':
    unittest.main()
