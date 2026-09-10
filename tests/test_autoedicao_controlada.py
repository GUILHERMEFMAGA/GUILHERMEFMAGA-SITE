import ast
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock
from contextlib import redirect_stdout
from io import StringIO
from test_roteamento_conversa import carregar

BASE = '@tool\ndef existente(x: int = 1) -> str:\n    """Exemplo."""\n    return str(x)\n\ntools = [\n    existente,\n]\n'
NOVO = '@tool\ndef nova() -> str:\n    """Retorna texto."""\n    return "ok"\n'
NOMES = ('_auto_propor_trecho', '_auto_mapa_pasta', '_auto_hash', '_auto_texto_atomico', '_auto_validar_candidato', '_auto_montar_candidato',
         '_auto_propor', '_auto_aplicar', '_auditar_fonte', '_inventario_para_ideias',
         '_selecionar_evidencias_ideias')


def ambiente(pasta='', confirmacao='APLICAR', nivel='admin'):
    def salvar(cam, dados):
        Path(cam).write_text(json.dumps(dados), encoding='utf-8')
    return carregar(*NOMES, PASTA_BASE=pasta, salvar_json=salvar,
                    input=Mock(return_value=confirmacao), config={'nivel_permissao': nivel},
                    ia_local_disponivel=lambda: False)


class AutoedicaoControlada(unittest.TestCase):
    def test_preserva_codigo_e_rejeita_esqueleto_defaults_e_remocao(self):
        env = ambiente()
        candidato = env['_auto_montar_candidato'](BASE, NOVO)
        self.assertIn('def existente', candidato)
        for codigo in ['@tool\ndef vazia() -> str:\n    pass',
                       '@tool\ndef nova(x: str = print("efeito")) -> str:\n    return x',
                       'print("nao executar")', NOVO.replace('nova', 'existente')]:
            with self.subTest(codigo=codigo):
                with self.assertRaises((ValueError, SyntaxError)):
                    env['_auto_montar_candidato'](BASE, codigo)
        with self.assertRaises(ValueError):
            env['_auto_validar_candidato'](BASE, candidato.replace('return str(x)', 'return "alterou"'))

    def test_correcao_pontual_preserva_assinatura(self):
        env = ambiente()
        corrigido = BASE.split('\ntools')[0].replace('str(x)', 'str(x + 1)')
        candidato = env['_auto_montar_candidato'](BASE, corrigido, 'existente')
        self.assertIn('str(x + 1)', candidato)
        with self.assertRaises(ValueError):
            env['_auto_montar_candidato'](BASE, corrigido.replace('x: int = 1', 'y: int = 1'), 'existente')

    def test_protecao_nao_pode_ser_corrigida_por_ia(self):
        env = ambiente()
        base = BASE.replace('existente', '_auto_hash')
        with self.assertRaises(ValueError):
            env['_auto_montar_candidato'](base, base.split('\ntools')[0], '_auto_hash')

    def test_proposta_aplicacao_backup_bloqueio_atualizacao_e_rollback(self):
        with tempfile.TemporaryDirectory() as pasta:
            p = Path(pasta) / 'agente.py'; p.write_text(BASE)
            env = ambiente(pasta)
            env['_auto_propor']('nova', codigo_pronto=NOVO)
            self.assertEqual(p.read_text(), BASE)
            with redirect_stdout(StringIO()):
                env['_auto_aplicar'](confirmar=True)
            self.assertIn('def nova', p.read_text())
            self.assertTrue((Path(pasta) / 'SEM_ATUALIZAR.txt').exists())
            self.assertTrue(list((Path(pasta) / 'autoedicao_pendente').glob('backup-*.txt')))
            env['input'].return_value = 'DESFAZER'
            with redirect_stdout(StringIO()):
                env['_auto_aplicar'](confirmar=True, desfazer=True)
            self.assertEqual(p.read_text(), BASE)

    def test_recusa_e_arquivo_mudado(self):
        with tempfile.TemporaryDirectory() as pasta:
            p = Path(pasta) / 'agente.py'; p.write_text(BASE)
            env = ambiente(pasta, confirmacao='nao')
            env['_auto_propor']('nova', codigo_pronto=NOVO)
            with redirect_stdout(StringIO()):
                self.assertIn('Cancelado', env['_auto_aplicar'](confirmar=True))
            self.assertEqual(p.read_text(), BASE)
            p.write_text(BASE + '\n# editado por outra pessoa\n')
            with self.assertRaises(ValueError):
                env['_auto_aplicar'](confirmar=True)

    def test_nota_caminhos_segredos_e_modo_basico(self):
        with tempfile.TemporaryDirectory() as pasta:
            p = Path(pasta) / 'agente.py'; p.write_text(BASE)
            env = ambiente(pasta)
            for nome in ['../fora.txt', 'chaves.txt', 'iniciar.bat', 'SEM_ATUALIZAR.txt']:
                with self.assertRaises(ValueError):
                    env['_auto_propor']('', nota_nome=nome, nota_texto='oi')
            env['_auto_propor']('', nota_nome='ideias.txt', nota_texto='Proposta minha')
            env['config']['nivel_permissao'] = 'basico'
            with self.assertRaises(ValueError):
                env['_auto_aplicar'](confirmar=True)
            env['config']['nivel_permissao'] = 'admin'
            with redirect_stdout(StringIO()):
                env['_auto_aplicar'](confirmar=True)
            self.assertEqual((Path(pasta) / 'ideias.txt').read_text(), 'Proposta minha')
            self.assertEqual(p.read_text(), BASE)

    def test_geracao_local_prepara_sem_executar(self):
        with tempfile.TemporaryDirectory() as pasta:
            p = Path(pasta) / 'agente.py'; p.write_text(BASE)
            env = ambiente(pasta)
            env['ia_local_disponivel'] = lambda: True
            env['_chamar_neural'] = Mock(return_value=json.dumps({'codigo': NOVO}))
            env['_auto_propor']('crie nova')
            env['_chamar_neural'].assert_called_once()
            self.assertEqual(p.read_text(), BASE)
            env['_chamar_neural'].return_value = 'resposta invalida'
            with self.assertRaises(ValueError):
                env['_auto_propor']('crie outra')
            self.assertEqual(p.read_text(), BASE)

    def test_interface_legada_trecho_apenas_prepara(self):
        with tempfile.TemporaryDirectory() as pasta:
            p = Path(pasta) / 'agente.py'; p.write_text(BASE)
            env = ambiente(pasta)
            env['_auto_propor_trecho']('agente.py', 'return str(x)', 'return str(x + 1)')
            self.assertEqual(p.read_text(), BASE)
            self.assertTrue((Path(pasta) / 'autoedicao_pendente' / 'proposta.json').exists())
            with self.assertRaises(ValueError):
                env['_auto_propor_trecho']('iniciar.bat', 'return str(x)', 'return str(x + 1)')

    def test_mapa_nao_le_chaves_e_modelos(self):
        with tempfile.TemporaryDirectory() as pasta:
            base = Path(pasta)
            (base / 'agente.py').write_text(BASE)
            (base / 'chaves.txt').write_text('segredo-que-nao-pode-aparecer')
            (base / 'config.json').write_text('{}')
            (base / 'ia_local').mkdir()
            (base / 'ia_local' / 'modelo.py').write_text('raise RuntimeError()')
            mapa = ambiente(pasta)['_auto_mapa_pasta']()
            self.assertIn('existente', mapa)
            self.assertNotIn('segredo-que-nao-pode-aparecer', mapa)
            self.assertNotIn('modelo.py', mapa)
            self.assertNotIn('config.json', mapa)

    def test_manifesto_adulterado_nao_pode_remover_funcao(self):
        with tempfile.TemporaryDirectory() as pasta:
            p = Path(pasta) / 'agente.py'; p.write_text(BASE)
            env = ambiente(pasta)
            env['_auto_propor']('nova', codigo_pronto=NOVO)
            manifesto = Path(pasta) / 'autoedicao_pendente' / 'proposta.json'
            dados = json.loads(manifesto.read_text())
            dados['candidato'] = NOVO + '\ntools = [nova]\n'
            manifesto.write_text(json.dumps(dados))
            with self.assertRaises(ValueError):
                env['_auto_aplicar'](confirmar=True)
            self.assertEqual(p.read_text(), BASE)


if __name__ == '__main__':
    unittest.main()
