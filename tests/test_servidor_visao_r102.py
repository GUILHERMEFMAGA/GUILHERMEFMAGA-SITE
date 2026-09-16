# -*- coding: utf-8 -*-
"""r102 — O SERVIDOR DA VISAO FALA (falha REAL do PC do dono, 16/09):
`interaja com NOME` ligava o llama-server e, quando ele MORRIA ao
iniciar (ex.: DLL do Visual C++ ausente, RAM insuficiente), a mensagem
era um 'nao abriu em 90s' MUDO — o console do servidor ia para DEVNULL
e ninguem via a causa. Agora: (1) o console vai para LOG
(_visao/servidor_visao.log); (2) se o processo MORA, a mensagem mostra
as ultimas linhas do log (a causa real) + dica do DLL; (3) se o
processo ainda esta VIVO (carregando o modelo de 8 GB num disco lento),
ele NAO e tratado como falha: fica no fundo e o modo conversa pega
quando a porta abrir; (4) a espera subiu de 90s para 240s."""
import os
import tempfile
import unittest

from test_roteamento_conversa import carregar


class _Proc:
    def __init__(self, vivo):
        self._vivo = vivo
        self.returncode = None if vivo else 1

    def poll(self):
        return None if self._vivo else 1


class ServidorVisaoR102(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.mkdtemp()
        # pecas 'no lugar' (a funcao so checa existncia)
        import os as _o
        _o.makedirs(_o.path.join(self.td, '_visao'), exist_ok=True)
        for nome in ('llama-server.exe', 'modelo.gguf', 'mmproj.gguf'):
            with open(_o.path.join(self.td, '_visao', nome), 'wb') as f:
                f.write(b'x')
        self.amb = carregar('_r94_ligar_visao_servidor', '_r94_caminhos_visao',
                            '_r94_porta_no_ar', '_r102_ultimas_linhas',
                            PASTA_BASE=self.td, os=os, time=__import__('time'))
        self.amb['_r94_caminhos_visao'] = lambda pasta=None: {
            'base': self.td,
            'exe': os.path.join(self.td, '_visao', 'llama-server.exe'),
            'modelo': os.path.join(self.td, '_visao', 'modelo.gguf'),
            'mmproj': os.path.join(self.td, '_visao', 'mmproj.gguf'),
            'bat': os.path.join(self.td, 'visao.bat'),
            'porta': 59999,  # porta morta de teste
        }

    def test_servidor_morto_mostra_causa_do_log(self):
        linhas = []

        def _log(m):
            linhas.append(m)

        with open(os.path.join(self.td, '_visao', 'servidor_visao.log'), 'wb') as f:
            f.write(b'linha antiga\r\nA sub-routine referenced by a DLL '
                    b'could not be found\r\n')
        self.amb['_r94_ligar_visao_servidor'](
            log=_log, aguardar=1, popen=lambda *a, **k: _Proc(False))
        msg = ' || '.join(linhas)
        self.assertIn('MORREU ao iniciar', msg)
        self.assertIn('could not be found', msg)  # a causa do log
        self.assertIn('Visual C++', msg)  # a dica quando o log fala em DLL

    def test_servidor_vivo_nao_e_tratado_como_falha(self):
        linhas = []

        def _log(m):
            linhas.append(m)

        self.amb['_R94_VISAO_PROC'] = None
        self.amb['_r94_ligar_visao_servidor'](
            log=_log, aguardar=1, popen=lambda *a, **k: _Proc(True))
        msg = ' || '.join(linhas)
        self.assertIn('ainda esta carregando', msg)
        self.assertIn('processo vivo', msg)
        self.assertNotIn('MORREU', msg)
        # o processo segue registrado (o modo conversa pega a porta depois)
        self.assertIs(self.amb['_R94_VISAO_PROC'].__class__, _Proc)

    def test_ultimas_linhas_pura(self):
        amb = self.amb
        with tempfile.NamedTemporaryFile('wb', delete=False) as f:
            f.write(b'a\r\nb\r\n\r\nc\r\n')
            cam = f.name
        try:
            self.assertEqual(amb['_r102_ultimas_linhas'](cam, 3), 'a | b | c')
            self.assertEqual(amb['_r102_ultimas_linhas'](cam, 2), 'b | c')
            self.assertEqual(amb['_r102_ultimas_linhas'](cam + '.naoexiste'), '')
        finally:
            os.unlink(cam)

    def test_wiring_log_na_popen(self):
        from test_roteamento_conversa import SOURCE
        fonte = SOURCE.read_text(encoding='utf-8')
        i = fonte.find('def _r94_ligar_visao_servidor(')
        j = fonte.find('\ndef ', i + 10)
        corpo = fonte[i:j]
        self.assertIn("aguardar=240", corpo)          # espera estendida
        self.assertIn('servidor_visao.log', corpo)    # console para LOG
        self.assertIn('stdout=_log_f', corpo)
        self.assertIn('stderr=_sp94.STDOUT', corpo)
        self.assertIn('_r102_ultimas_linhas', corpo)  # causa na mensagem
        self.assertNotIn('DEVNULL, stderr=_sp94.DEVNULL,\n'
                         '                                      creationflags',
                         corpo.replace('    ', '    '))  # sem DEVNULL duplo cego


if __name__ == '__main__':
    unittest.main()
