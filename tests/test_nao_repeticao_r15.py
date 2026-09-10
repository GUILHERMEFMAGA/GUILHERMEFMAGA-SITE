import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock
from contextlib import redirect_stdout
from io import StringIO
from test_roteamento_conversa import carregar
from test_ideias_fundamentadas import NOMES, ideia
from test_autoedicao_controlada import ambiente, BASE, NOVO


class NaoRepeticao(unittest.TestCase):
    def test_bloqueia_corpo_igual_com_nome_e_doc_novos(self):
        env = ambiente()
        duplicada = BASE.split('\ntools')[0].replace('existente', 'outro_nome').replace('Exemplo.', 'Descricao diferente.')
        with self.assertRaisesRegex(ValueError, 'corpo identico'):
            env['_auto_montar_candidato'](BASE, duplicada)

    def test_aplicacao_revalida_duplicacao(self):
        env = ambiente()
        duplicada = BASE.split('\ntools')[0].replace('existente', 'outro_nome')
        candidato = BASE.replace('tools = [', duplicada + '\ntools = [\n    outro_nome,')
        with self.assertRaisesRegex(ValueError, 'corpo identico'):
            env['_auto_validar_candidato'](BASE, candidato)

    def test_titulo_anterior_descartado(self):
        env = carregar(*NOMES)
        inv = {'hash': 'x', 'funcoes': {'ler': {'linha': 1}}}
        novos = []
        r = env['_formatar_ideias_verificadas'](json.dumps({'ideias':[ideia()]}), inv,
                 [{'nome':'ler'}], 1, ['Melhorar VALIDAÇÃO!'], novos)
        self.assertIn('validos: 0/1', r)
        self.assertIn('ao historico: 1', r)
        self.assertFalse(novos)

    def test_memoria_de_titulos_persistida_entre_consultas(self):
        with tempfile.TemporaryDirectory() as pasta:
            fonte = Path(pasta) / 'agente.py'
            fonte.write_text('def ler():\n    """Le dados."""\n    pass\n')
            config = {}
            salvar = Mock()
            env = carregar(*NOMES, _CAMINHO_AGENTE_PY=str(fonte), config=config,
                           salvar_json=salvar, ARQ_CONFIG='config.json',
                           ia_local_disponivel=lambda: True,
                           _chamar_neural=Mock(return_value=json.dumps({'ideias':[ideia()]})))
            primeiro = env['_sugerir_ideias_do_codigo']('1 ideias para o agente')
            segundo = env['_sugerir_ideias_do_codigo']('1 ideias para o agente')
            self.assertIn('validos: 1/1', primeiro)
            self.assertIn('validos: 0/1', segundo)
            self.assertEqual(config['titulos_ideias_sugeridas'], ['Melhorar validacao'])
            salvar.assert_called_once()

    def test_preanalise_persistida_antes_de_aplicar(self):
        with tempfile.TemporaryDirectory() as pasta:
            p = Path(pasta)/'agente.py';p.write_text(BASE)
            env = ambiente(pasta)
            with redirect_stdout(StringIO()):
                r = env['_auto_propor']('ampliar existente', codigo_pronto=NOVO)
            self.assertIn('existente (linha', r)
            dados = json.loads((Path(pasta)/'autoedicao_pendente'/'proposta.json').read_text())
            self.assertIn('JA existentes', dados['preanalise'])
            self.assertEqual(p.read_text(), BASE)

    def test_limpar_titulos_exige_confirmacao(self):
        for resposta in ['nao', 'LIMPAR']:
            config = {'titulos_ideias_sugeridas':['Ideia anterior'], 'nivel_permissao':'padrao'}
            salvar = Mock()
            env = carregar('_norm_pt', '_historico_ideias_local', config=config,
                           salvar_json=salvar, ARQ_CONFIG='config.json', input=lambda _: resposta)
            with redirect_stdout(StringIO()):
                self.assertTrue(env['_historico_ideias_local']('limpar historico de ideias'))
            self.assertEqual(bool(config['titulos_ideias_sugeridas']), resposta != 'LIMPAR')
            self.assertEqual(config['nivel_permissao'], 'padrao')
            self.assertEqual(salvar.call_count, int(resposta == 'LIMPAR'))

    def test_nome_explicito_nao_precisa_duas_palavras(self):
        env = carregar('_relacionadas_no_inventario')
        itens = env['_relacionadas_no_inventario']('adicionar pomodoro', {'funcoes':{
            'pomodoro': {'linha':12, 'descricao':'Temporizador de foco'}}})
        self.assertEqual(itens[0][1], 'pomodoro')


if __name__ == '__main__':
    unittest.main()
