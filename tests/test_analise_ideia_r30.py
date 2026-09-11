"""r30: analise da ideia antes do esqueleto (colisao bloqueia, catalogo
enriquece, vizinhas sao reportadas). AST isolado; sem rede, sem GGUF;
disco somente em pasta temporaria."""
import io
import os
import tempfile
import types
import unittest
from test_roteamento_conversa import carregar


def env_r30(pasta, ferramentas=(), catalogo=None):
    base = dict(PASTA_BASE=pasta,
                tools=[types.SimpleNamespace(name=n, description='desc') for n in ferramentas])
    if catalogo is not None:
        docs = os.path.join(pasta, 'docs')
        os.makedirs(docs, exist_ok=True)
        with open(os.path.join(docs, 'CATALOGO_PROPOSTAS_FERRAMENTAS.md'), 'w',
                  encoding='utf-8') as f:
            f.write(catalogo)
        base['__file__'] = os.path.join(pasta, 'agente.py')
    return carregar('_norm_pt', '_r26_palavras', '_r26_propostas_catalogo',
                    '_r29_pasta_esqueletos', '_r29_nome_seguro',
                    '_r30_analisar_ideia', '_r29_gerar_esqueleto', **base)


CATALOGO = ('# catalogo\n\n## G9. Testes\n'
            '9. Proposta `medidor_de_x` - mede x com precisao laboratorial.\n'
            '10. Proposta `organizador_de_y` - organiza y por cor e tamanho.\n')


class AnaliseBloqueiaDuplicata(unittest.TestCase):
    def setUp(self):
        self.pasta = tempfile.mkdtemp()
        self.env = env_r30(self.pasta, ferramentas=('gerar_senha', 'status_defender'))

    def test_ideia_igual_a_ferramenta_e_bloqueada(self):
        msg = self.env['_r29_gerar_esqueleto']('gerar senha')
        self.assertIn('ANALISE: ja existe a ferramenta "gerar_senha"', msg)
        self.assertIn('zero duplicata', msg)
        self.assertFalse(os.path.isdir(os.path.join(self.pasta, 'esqueletos_ideias')))

    def test_analisar_ideia_retorna_bloqueia(self):
        resultado = self.env['_r30_analisar_ideia']('GERAR SENHA')
        self.assertTrue(resultado['bloqueia'])
        self.assertIn('gerar_senha', resultado['motivo'])

    def test_palavra_curta_nao_e_colisao_falsa(self):
        msg = self.env['_r29_gerar_esqueleto']('senha')
        self.assertIn('Esqueleto criado', msg)
        self.assertTrue(os.path.exists(os.path.join(self.pasta, 'esqueletos_ideias', 'senha.py')))


class AnaliseEnriquece(unittest.TestCase):
    def setUp(self):
        self.pasta = tempfile.mkdtemp()
        self.env = env_r30(self.pasta, ferramentas=('gerar_senha',), catalogo=CATALOGO)

    def test_proposta_do_catalogo_vai_para_docstring(self):
        msg = self.env['_r29_gerar_esqueleto']('medidor de x')
        caminho = os.path.join(self.pasta, 'esqueletos_ideias', 'medidor_de_x.py')
        self.assertTrue(os.path.exists(caminho))
        self.assertIn('proposta #9 do catalogo foi registrada no esqueleto', msg)
        conteudo = io.open(caminho, encoding='utf-8').read()
        self.assertIn('# Catalogo #9: mede x com precisao laboratorial', conteudo)
        self.assertIn('def medidor_de_x(', conteudo)

    def test_vizinhas_sao_reportadas(self):
        msg = self.env['_r29_gerar_esqueleto']('medidor de senha do wifi')
        self.assertIn('vizinhas: gerar_senha', msg)
        caminho = os.path.join(self.pasta, 'esqueletos_ideias',
                               'medidor_de_senha_do_wifi.py')
        conteudo = io.open(caminho, encoding='utf-8').read()
        self.assertIn('ferramentas vizinhas p/ reaproveitar: gerar_senha', conteudo)

    def test_sem_colisao_sem_catalogo_resumo_honesto(self):
        msg = self.env['_r29_gerar_esqueleto']('cata_vento_quimico')
        self.assertIn('Analise da ideia: sem colisao com as ferramentas registradas', msg)
        self.assertNotIn('proposta #', msg)
        self.assertNotIn('vizinhas', msg)


class AnaliseSemAmbiente(unittest.TestCase):
    def test_sem_tools_e_sem_catalogo_cria_normal(self):
        pasta = tempfile.mkdtemp()
        env = env_r30(pasta)
        msg = env['_r29_gerar_esqueleto']('ideia solta boa')
        self.assertIn('Esqueleto criado', msg)
        self.assertIn('sem colisao', msg)
        self.assertTrue(os.path.exists(os.path.join(pasta, 'esqueletos_ideias',
                                                    'ideia_solta_boa.py')))

    def test_analisar_ideia_sem_nada_nao_quebra(self):
        env = env_r30(tempfile.mkdtemp())
        resultado = env['_r30_analisar_ideia']('qualquer coisa nova')
        self.assertEqual(resultado['bloqueia'], False)
        self.assertEqual(resultado['vizinhas'], [])
        self.assertEqual(resultado['descricao'], '')


if __name__ == '__main__':
    unittest.main()
