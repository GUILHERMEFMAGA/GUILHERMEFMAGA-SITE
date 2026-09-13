"""r58/r59: o elevate do iniciar.bat morria com duplo clique (sem argumentos):
o PowerShell rejeita -ArgumentList ''. A primeira correcao (r58) ainda quebrou:
REM com parenteses DENTRO de bloco ( ) fecha o bloco antes da hora no cmd — a
linha com -ArgumentList vazio executou do mesmo jeito (relato real). A r59
reescreveu a secao SEM NENHUM BLOCO: goto + if de uma linha + set R58_ARGS.
Verificacao por texto; sem rede, sem executar o BAT."""
import io
import unittest

from test_roteamento_conversa import SOURCE

RAIZ = SOURCE.parent


def texto(nome):
    with io.open(str(RAIZ / nome), encoding='utf-8') as f:
        return f.read()


class ElevateSemArgumentos(unittest.TestCase):
    def setUp(self):
        self.bat = texto('iniciar.bat')

    def test_secao_admin_nao_tem_bloco_nenhum(self):
        inicio = self.bat.index('net session')
        fim = self.bat.index(':ja_admin')
        secao = self.bat[inicio:fim]
        self.assertNotIn(') else (', secao)          # r58 quebrou assim
        self.assertNotIn('%%20', self.bat)            # lixo do comentario da r58
        self.assertIn('goto pedir_admin', secao)      # fluxo por goto, sem bloco
        self.assertIn(':pedir_admin', secao)
        self.assertIn('set "R58_ARGS="', secao)      # vazio por padrao
        # %* so entra na variavel SE houver argumento (if de uma linha)
        self.assertIn('if not "%~1"=="" set "R58_ARGS=-ArgumentList', secao)

    def test_o_start_process_usa_a_variavel_e_sem_args_fica_limpo(self):
        linha = next(l for l in self.bat.split('\n')
                     if 'Start-Process' in l and 'R58_ARGS' in l)
        self.assertIn("%R58_ARGS%", linha)
        self.assertIn('-Verb RunAs', linha)

    def test_guardas_r57_preservados(self):
        self.assertEqual(self.bat.count('if errorlevel 1 goto quebrou'), 2)
        self.assertIn(':quebrou', self.bat)
        self.assertIn('if exist ".reparo_r57" goto errou_de_novo', self.bat)
        self.assertEqual(self.bat.count('python main.py'), 1)
        # o teste r45 continua valendo: -ArgumentList '%*' segue no arquivo
        self.assertIn("-ArgumentList '%*'", self.bat)

    def test_falha_de_admin_nao_pisca_e_some(self):
        secao = self.bat[self.bat.index(':pedir_admin'):self.bat.index(':ja_admin')]
        self.assertIn('if errorlevel 1 (', secao)          # Start-Process falhou?
        self.assertIn('pause', secao)                      # janela fica aberta
        self.assertIn('FALHOU o pedido de Administrador', secao)

    def test_escudo_do_bloco_de_comentario(self):
        # o padrao exato que quebrou na r58 nao pode voltar
        self.assertNotIn('(Start-Process', self.bat)
        self.assertNotIn('%%20', self.bat)
        # a licao r58: REM com parentese DENTRO da secao de admin = mina
        # (o ) do comentario fechava o bloco antes da hora). Comentarios ali
        # ficam SEM parenteses; o resto segue o BAT legitimo.
        secao = self.bat[self.bat.index('net session'):self.bat.index(':ja_admin')]
        for linha in secao.split('\n'):
            if linha.strip().upper().startswith('REM'):
                self.assertNotIn('(', linha, repr(linha))
                self.assertNotIn(')', linha, repr(linha))
            else:
                self.assertNotIn(') else (', linha)


class Selo(unittest.TestCase):
    def test_banner_r58(self):
        self.assertIn('[Motor e avaliacao local 2026-09-11-r72]', texto('agente.py'))


if __name__ == '__main__':
    unittest.main()
