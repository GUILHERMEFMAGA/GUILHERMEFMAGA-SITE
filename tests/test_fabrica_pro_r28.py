"""r28: fabrica profissional (persistencia da telemetria, motivo das sugestoes,
rotacao de apresentadas, ideia boa, zerar telemetria). AST isolado; sem rede,
sem GGUF; disco somente em pasta temporaria."""
import io
import json
import os
import tempfile
import unittest
from unittest.mock import Mock
from test_roteamento_conversa import carregar


def capturar(funcao, *args):
    import contextlib
    tampao = io.StringIO()
    with contextlib.redirect_stdout(tampao):
        resultado = funcao(*args)
    return resultado, tampao.getvalue()


def env_r28(pasta, **extras):
    salvos = []
    base = dict(PASTA_BASE=pasta, config={}, ARQ_CONFIG='cfg.json',
                salvar_json=lambda c, d: salvos.append((c, dict(d))),
                input=Mock(return_value=''))
    base.update(extras)
    ambiente = carregar('_norm_pt', '_r25_registrar_uso', '_r25_comandos',
                        '_r26_palavras', '_r26_relatorio', '_r26_comandos',
                        '_r26_priorizar', '_r28_caminho_telemetria',
                        '_r28_carregar_telemetria', '_r28_salvar_telemetria',
                        '_r28_comandos', **base)
    return ambiente, salvos


def escrever_telemetria(pasta, ferramentas):
    with open(os.path.join(pasta, 'telemetria_ferramentas.json'), 'w', encoding='utf-8') as f:
        json.dump({'versao': 1, 'ferramentas': ferramentas}, f, ensure_ascii=False)


def ler_telemetria(pasta):
    with open(os.path.join(pasta, 'telemetria_ferramentas.json'), 'r', encoding='utf-8') as f:
        return json.load(f)


class Persistencia(unittest.TestCase):
    def setUp(self):
        self.pasta = tempfile.mkdtemp()

    def test_carrega_do_arquivo_e_registrar_acumula(self):
        escrever_telemetria(self.pasta, {'a_tool': {'usos': 5, 'erros': 1, 'tempo_s': 0.5,
                                                    'ultimo_erro': 'ValueError',
                                                    'ultima_duracao_s': 0.1}})
        env, _ = env_r28(self.pasta)
        registro, _ = capturar(env['_r28_carregar_telemetria'])
        self.assertEqual(registro['a_tool']['usos'], 5)
        self.assertIsNone(env['_r25_registrar_uso']('a_tool', 0.2, True))
        self.assertEqual(env['_r25_uso_ferramentas']['a_tool']['usos'], 6)

    def test_sem_arquivo_comeca_vazio(self):
        env, _ = env_r28(self.pasta)
        registro, _ = capturar(env['_r28_carregar_telemetria'])
        self.assertEqual(registro, {})

    def test_registro_em_memoria_nao_e_sobrescrito(self):
        escrever_telemetria(self.pasta, {'do_arquivo': {'usos': 9, 'erros': 0, 'tempo_s': 0.0,
                                                        'ultimo_erro': '', 'ultima_duracao_s': 0.0}})
        env, _ = env_r28(self.pasta, _r25_uso_ferramentas={'da_memoria': {'usos': 1, 'erros': 0,
                            'tempo_s': 0.0, 'ultimo_erro': '', 'ultima_duracao_s': 0.0}})
        registro, _ = capturar(env['_r28_carregar_telemetria'])
        self.assertIn('da_memoria', registro)
        self.assertNotIn('do_arquivo', registro)

    def test_salvar_forcado_grava_e_throttle_segura(self):
        env, _ = env_r28(self.pasta, _r25_uso_ferramentas={'x_tool': {'usos': 1, 'erros': 0,
                          'tempo_s': 0.1, 'ultimo_erro': '', 'ultima_duracao_s': 0.1}})
        self.assertTrue(env['_r28_salvar_telemetria'](forcar=True))
        self.assertEqual(ler_telemetria(self.pasta)['ferramentas']['x_tool']['usos'], 1)
        env['_r25_uso_ferramentas']['x_tool']['usos'] = 77
        self.assertFalse(env['_r28_salvar_telemetria']())  # dentro do throttle
        self.assertEqual(ler_telemetria(self.pasta)['ferramentas']['x_tool']['usos'], 1)
        self.assertTrue(env['_r28_salvar_telemetria'](forcar=True))
        self.assertEqual(ler_telemetria(self.pasta)['ferramentas']['x_tool']['usos'], 77)

    def test_zerar_telemetria_com_e_sem_confirmacao(self):
        escrever_telemetria(self.pasta, {'a_tool': {'usos': 5, 'erros': 0, 'tempo_s': 0.0,
                                                    'ultimo_erro': '', 'ultima_duracao_s': 0.0}})
        env, _ = env_r28(self.pasta)
        env['input'] = Mock(return_value='LIMPAR')
        _, saida = capturar(env['_r28_comandos'], 'zerar telemetria')
        self.assertIn('Telemetria zerada', saida)
        self.assertEqual(env['_r25_uso_ferramentas'], {})
        self.assertEqual(ler_telemetria(self.pasta)['ferramentas'], {})
        env2, _ = env_r28(self.pasta, _r25_uso_ferramentas={'a_tool': {'usos': 5, 'erros': 0,
                          'tempo_s': 0.0, 'ultimo_erro': '', 'ultima_duracao_s': 0.0}})
        env2['input'] = Mock(return_value='nao')
        _, saida2 = capturar(env2['_r28_comandos'], 'zerar telemetria')
        self.assertIn('Cancelado', saida2)
        self.assertEqual(env2['_r25_uso_ferramentas']['a_tool']['usos'], 5)


class IdeiaBoaERoteamento(unittest.TestCase):
    def setUp(self):
        self.pasta = tempfile.mkdtemp()

    def test_ideia_boa_salva_e_nao_duplica(self):
        env, salvos = env_r28(self.pasta, config={'ideias_favoritas': ['medidor_de_x']})
        _, saida = capturar(env['_r28_comandos'], 'ideia boa: gerar_senha')
        self.assertIn('IDEIA BOA', saida)
        _, saida2 = capturar(env['_r28_comandos'], 'ideia boa: gerar_senha')
        self.assertIn('IDEIA BOA', saida2)
        novo_cfg = salvos[-1][1]
        self.assertEqual(novo_cfg['ideias_favoritas'].count('gerar_senha'), 1)
        self.assertIn('medidor_de_x', novo_cfg['ideias_favoritas'])

    def test_ideia_boa_sem_nome_orienta(self):
        env, _ = env_r28(self.pasta)
        _, saida = capturar(env['_r28_comandos'], 'ideia boa:')
        self.assertIn('Informe o nome', saida)

    def test_comando_estranho_nao_e_da_r28(self):
        env, _ = env_r28(self.pasta)
        retorno, saida = capturar(env['_r28_comandos'], 'qualquer coisa')
        self.assertFalse(retorno)
        self.assertEqual(saida, '')


class FabricaProfissional(unittest.TestCase):
    def setUp(self):
        self.pasta = tempfile.mkdtemp()
        docs = os.path.join(self.pasta, 'docs')
        os.makedirs(docs)
        with open(os.path.join(docs, 'CATALOGO_PROPOSTAS_FERRAMENTAS.md'), 'w',
                  encoding='utf-8') as f:
            f.write('# catalogo\n\n## G9. Testes\n'
                    '9. Proposta `medidor_de_x` - mede x com precisao.\n'
                    '10. Proposta `forca_de_senha_medir` - mede forca de senha.\n'
                    '11. Proposta `organizador_de_y` - organiza y por cor.\n')
        escrever_telemetria(self.pasta, {'gerar_senha': {'usos': 9, 'erros': 0, 'tempo_s': 0.1,
                                                         'ultimo_erro': '', 'ultima_duracao_s': 0.1}})

    def base(self, **extras):
        base = dict(__file__=os.path.join(self.pasta, 'agente.py'))
        base.update(extras)
        return base

    def test_relatorio_usa_dados_do_arquivo(self):
        env, _ = env_r28(self.pasta, **self.base())
        texto, _ = capturar(env['_r26_relatorio'])
        self.assertIn('Telemetria acumulada entre sessoes (arquivo local): SIM', texto)
        self.assertIn('SEU USO (top da sessao): gerar_senha', texto)
        self.assertIn('porque voce usa: senha', texto)

    def test_motivo_aparece_na_sugestao(self):
        env, _ = env_r28(self.pasta, **self.base())
        texto, _ = capturar(env['_r26_relatorio'])
        self.assertIn('(porque voce usa: senha)', texto)

    def test_favorita_ganha_estrela_e_sobe(self):
        env, _ = env_r28(self.pasta, **self.base(config={'ideias_favoritas': ['organizador_de_y']}))
        texto, _ = capturar(env['_r26_relatorio'])
        linha_bom = [l for l in texto.splitlines() if 'organizador_de_y' in l][0]
        self.assertIn('[voce marcou como BOA]', linha_bom)
        pos_bom = texto.find('organizador_de_y - ')
        pos_outro = texto.find('medidor_de_x - ')
        self.assertLess(pos_bom, pos_outro)

    def test_rotacao_nao_repete_o_que_ja_apresentou(self):
        env, _ = env_r28(self.pasta, **self.base(config={'fabrica_apresentadas': ['forca_de_senha_medir']}))
        texto, _ = capturar(env['_r26_relatorio'])
        linhas = [l for l in texto.splitlines() if ' - ' in l and l.strip().startswith(('1.', '2.', '3.'))]
        primeiro = linhas[0]
        self.assertNotIn('forca_de_senha_medir', primeiro)

    def test_apresentadas_ficam_salvas_no_config(self):
        env, salvos = env_r28(self.pasta, **self.base())
        capturar(env['_r26_relatorio'])
        com_fabrica = [d for c, d in salvos if 'fabrica_apresentadas' in d]
        self.assertTrue(com_fabrica)
        nomes = com_fabrica[-1]['fabrica_apresentadas']
        self.assertTrue(any('medidor' in n or 'senha' in n or 'organizador' in n for n in nomes))

    def test_sem_pasta_base_relatorio_avisa_memoria(self):
        env, _ = env_r28(self.pasta, **self.base())
        env.pop('PASTA_BASE')
        texto, _ = capturar(env['_r26_relatorio'])
        self.assertIn('Telemetria acumulada entre sessoes (arquivo local): NAO', texto)

    def test_estatisticas_le_do_arquivo(self):
        env, _ = env_r28(self.pasta, **self.base())
        _, saida = capturar(env['_r25_comandos'], 'estatisticas ferramentas')
        self.assertIn('gerar_senha: 9 uso(s)', saida)


if __name__ == '__main__':
    unittest.main()
