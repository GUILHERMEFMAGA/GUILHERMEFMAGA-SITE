import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from contextlib import redirect_stdout
from io import StringIO
from test_roteamento_conversa import carregar


class ConfiabilidadeFerramentas(unittest.TestCase):
    def test_json_unicode_e_sem_temporarios(self):
        fn = carregar('salvar_json', json=json, os=os)['salvar_json']
        with tempfile.TemporaryDirectory() as pasta:
            p = Path(pasta) / 'config.json'
            fn(p, {'nome': 'João', 'valor': 3})
            self.assertEqual(json.loads(p.read_text()), {'nome': 'João', 'valor': 3})
            self.assertEqual(list(Path(pasta).iterdir()), [p])

    def test_serializacao_invalida_preserva_anterior(self):
        fn = carregar('salvar_json', json=json, os=os)['salvar_json']
        with tempfile.TemporaryDirectory() as pasta:
            p = Path(pasta) / 'config.json'
            p.write_text('{"anterior": true}')
            with self.assertRaises(TypeError):
                fn(p, {'invalido': object()})
            self.assertEqual(p.read_text(), '{"anterior": true}')
            self.assertEqual(list(Path(pasta).iterdir()), [p])

    def test_falha_substituicao_preserva_anterior(self):
        fn = carregar('salvar_json', json=json, os=os)['salvar_json']
        with tempfile.TemporaryDirectory() as pasta:
            p = Path(pasta) / 'config.json'
            p.write_text('{"anterior": true}')
            with patch('os.replace', side_effect=PermissionError):
                with self.assertRaises(PermissionError):
                    fn(p, {'novo': True})
            self.assertEqual(p.read_text(), '{"anterior": true}')
            self.assertEqual(list(Path(pasta).iterdir()), [p])

    def test_invocar_falha_nao_repete_por_outro_adaptador(self):
        ferramenta = Mock()
        ferramenta.invoke.side_effect = RuntimeError('segredo nao deve aparecer')
        env = carregar('_invocar_local', ferramenta=ferramenta)
        resposta = env['_invocar_local']('ferramenta', valor=1)
        ferramenta.invoke.assert_called_once_with({'valor': 1})
        ferramenta.assert_not_called()
        self.assertIn('efeito parcial', resposta)
        self.assertNotIn('segredo', resposta)

    def test_invocar_funcao_crua_e_wrapper(self):
        def somar(valor):
            return valor + 1
        wrapper = Mock()
        wrapper.invoke.return_value = 'resultado'
        env = carregar('_invocar_local', somar=somar, wrapper=wrapper, invalido=3)
        self.assertEqual(env['_invocar_local']('somar', valor=1), 2)
        self.assertEqual(env['_invocar_local']('wrapper'), 'resultado')
        self.assertIn('indisponivel', env['_invocar_local']('ausente'))
        self.assertIn('nao e executavel', env['_invocar_local']('invalido'))

    def test_abrir_painel_prioriza_web(self):
        invocar = Mock(return_value='Painel web aberto')
        env = carregar('_norm_pt', '_eh_pergunta_de_conversa', '_pedido_explicativo',
                       '_processar_cerebro_local', config={}, _ULTIMO_COMANDO={},
                       historico_conversas=[], salvar_historico=Mock(), falar=Mock(),
                       _invocar_local=invocar)
        with redirect_stdout(StringIO()):
            self.assertTrue(env['_processar_cerebro_local']('abrir painel'))
        invocar.assert_called_once_with('abrir_painel_web')


if __name__ == '__main__':
    unittest.main()
