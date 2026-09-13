"""Regressoes r20: sem GGUF, rede real ou processos Windows. Cada grupo da selecao 1–30."""
import ast
import copy
import io
import json
import os
import subprocess
import tempfile
import threading
import types
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import Mock, patch
from test_roteamento_conversa import carregar, TREE
from test_precisao_local_r17 import ambiente as avaliacao


def resposta_http(dados):
    r = Mock(); r.__enter__ = Mock(return_value=r); r.__exit__ = Mock(return_value=False)
    r.read.return_value = json.dumps(dados).encode()
    return r


class Melhorias30(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.pasta = Path(self.tmp.name)

    def env(self, *nomes, **kwargs):
        kwargs.setdefault('config', {})
        kwargs.setdefault('PASTA_BASE', str(self.pasta))
        return carregar('_norm_pt', *nomes, **kwargs)

    def test_01_gguf_existente_nao_usa_variavel_indefinida(self):
        p = self.pasta/'atual.gguf'
        with p.open('wb') as f:
            f.truncate(100_000_001)
        escolher = Mock(side_effect=AssertionError('nao trocar GGUF'))
        env = self.env('preparar_ia_local', os=os, _PASTA_IA_LOCAL=str(self.pasta),
                       ia_local_disponivel=lambda:False, _baixar_motor_llama=lambda:'motor.exe',
                       _acha_modelo_gguf=lambda:str(p), _escolher_modelo_local=escolher,
                       _iniciar_servidor_ia_local=Mock(return_value=True))
        with redirect_stdout(io.StringIO()):
            self.assertTrue(env['preparar_ia_local']())
        self.assertEqual(env['_modelo_ia_local'], 'atual.gguf')
        escolher.assert_not_called()

    def test_02_motor_pronto_da_retorno_sem_download(self):
        baixar = Mock()
        env = self.env('preparar_ia_local', ia_local_disponivel=lambda:True, _baixar_motor_llama=baixar)
        with redirect_stdout(io.StringIO()) as out:
            self.assertTrue(env['preparar_ia_local']())
        self.assertIn('motor ja disponivel', out.getvalue()); baixar.assert_not_called()

    def test_03_estados_e_metadados_por_thread(self):
        env = self.env('_chamar_neural')
        env['_r20_transporte'] = Mock(return_value=('oi', {'finish_reason':'stop'}))
        self.assertEqual(env['_chamar_neural']([]), 'oi')
        self.assertEqual(env['_r20_estado']()['estado'], 'pronto')
        env['_r20_transporte'].side_effect = TimeoutError()
        with self.assertRaises(TimeoutError):
            env['_chamar_neural']([])
        self.assertEqual(env['_r20_estado']()['estado'], 'falhou')
        self.assertEqual(env['_r20_telemetria'].ultima['erro'], 'TimeoutError')

    def test_04_health_nao_basta_para_confiar_no_modelo(self):
        env = self.env()
        env['_r20_http_json'] = Mock(side_effect=[{'status':'ok'}, {'data':[{'id':'outro.gguf'}]}])
        self.assertFalse(env['_r20_servidor_confere']('atual.gguf'))
        env['_r20_http_json'].side_effect = [{'status':'ok'}, {'data':[{'id':'C:/modelos/atual.gguf'}]}]
        self.assertTrue(env['_r20_servidor_confere']('atual.gguf'))
        self.assertEqual(env['_modelo_ia_local'], 'atual.gguf')

    def motor_env(self):
        proc = Mock(); proc.poll.return_value = None
        popen = Mock(return_value=proc)
        env = self.env('_iniciar_servidor_ia_local', _acha_llama_server=lambda:'motor.exe',
                       os=os, subprocess=types.SimpleNamespace(Popen=popen),
                       _lock_ia_local=threading.Lock(), _proc_ia_local=None,
                       _PORTA_IA_LOCAL=8765, _PASTA_IA_LOCAL=str(self.pasta))
        env['_r20_servidor_confere'] = Mock(return_value=False)
        env['_r20_http_json'] = Mock(side_effect=ConnectionError())
        return env, proc, popen

    def test_05_prazo_monotonico_nao_acumula_90_timeouts(self):
        env, _, popen = self.motor_env()
        clock = [0.0]
        def dormir(segundos):
            clock[0] += segundos
        with patch('time.monotonic', side_effect=lambda:clock[0]), patch('time.sleep', side_effect=dormir):
            self.assertFalse(env['_iniciar_servidor_ia_local']('atual.gguf'))
        self.assertLessEqual(clock[0], 90)
        popen.assert_called_once()
        self.assertEqual(env['_r20_estado']()['estado'], 'falhou')

    def test_06_encerramento_aguarda_sem_kill_forcado(self):
        proc = Mock(); proc.wait.side_effect = subprocess.TimeoutExpired('motor', 5)
        env = self.env(_proc_ia_local=proc)
        r = env['_r20_encerrar_motor']()
        self.assertIn('nao confirmado', r)
        self.assertIs(env['_proc_ia_local'], proc); proc.kill.assert_not_called()
        proc.wait.side_effect = None
        self.assertIn('saida do processo confirmada', env['_r20_encerrar_motor']())
        self.assertIsNone(env['_proc_ia_local'])

    def test_07_nao_envia_duas_geracoes_concorrentes(self):
        env = self.env('_chamar_neural')
        entrou, liberar = threading.Event(), threading.Event()
        def transporte(*args):
            entrou.set(); liberar.wait(2); return 'ok', {}
        env['_r20_transporte'] = Mock(side_effect=transporte)
        thread = threading.Thread(target=lambda:env['_chamar_neural']([]))
        thread.start()
        try:
            self.assertTrue(entrou.wait(1))
            with self.assertRaises(RuntimeError):
                env['_chamar_neural']([])
            env['_proc_ia_local'] = Mock()
            self.assertIn('Motor ocupado', env['_r20_encerrar_motor']())
            env['_proc_ia_local'].terminate.assert_not_called()
        finally:
            liberar.set(); thread.join(3)
        env['_r20_transporte'].assert_called_once()
        self.assertFalse(thread.is_alive())

    def test_08_pressao_ram_adia_avaliacao_sem_inferencia(self):
        env = avaliacao(str(self.pasta))
        env['_r20_memoria_opcional'] = lambda:False
        self.assertIn('adiada', env['_executar_avaliacao_precisao_local']())
        env['_chamar_neural'].assert_not_called()
        self.assertFalse(list(self.pasta.iterdir()))

    def test_09_threads_validas_usadas_sem_mudar_gguf(self):
        env, _, popen = self.motor_env()
        env['config'] = {'ia_local_opcoes':{'threads':2}}
        env['_r20_servidor_confere'].side_effect = [False, True]
        with patch('os.cpu_count', return_value=4):
            self.assertTrue(env['_iniciar_servidor_ia_local']('modelo-atual.gguf'))
        args = popen.call_args.args[0]
        self.assertEqual(args[args.index('-t')+1], '2')
        self.assertEqual(args[args.index('-m')+1], 'modelo-atual.gguf')

    def test_10_sse_monta_texto_e_falha_sem_repetir(self):
        env = self.env(_url_ia_local='http://127.0.0.1:8765')
        r = resposta_http({})
        linhas = [b'data: {"choices":[{"delta":{"content":"Oi"},"finish_reason":null}]}\n',
                  b'data: {"choices":[{"delta":{"content":"!"},"finish_reason":"stop"}],"usage":{"completion_tokens":2}}\n',
                  b'data: [DONE]\n']
        r.readline.side_effect = linhas
        cb = Mock()
        with patch('urllib.request.urlopen', return_value=r) as abrir:
            texto, meta = env['_r20_transporte']([], 10, .2, 45, True, cb)
        self.assertEqual(texto, 'Oi!'); self.assertEqual(cb.call_count, 2)
        self.assertEqual(meta['usage']['completion_tokens'], 2)
        self.assertEqual(meta['finish_reason'], 'stop'); abrir.assert_called_once()
        r.readline.side_effect = [linhas[0], b'']
        with patch('urllib.request.urlopen', return_value=r), self.assertRaises(ValueError):
            env['_r20_transporte']([], 10, .2, 45, True)

    def test_11_registro_canonico_e_grupos(self):
        env = self.env()
        self.assertEqual(len(env['_r20_catalogo_comandos']()), 5)
        for cmd, (grupo, _) in env['_r20_catalogo_comandos']().items():
            self.assertEqual(env['_r20_grupo_comando'](cmd), grupo)
        self.assertEqual(env['_r20_grupo_comando']('como desligar ia?'), '')

    def test_12_13_parafrases_e_composto_nao_executam(self):
        env = self.env('_resposta_contextual_curta')
        fn = env['_resposta_contextual_curta']
        self.assertIn('digite: criar ia', fn('Como faço para voltar ao motor offline?', {}))
        self.assertIn('status ia', fn('Como iniciar o motor local e verificar se está pronto?', {}))
        r = fn('Como ligar a IA local e apagar meus arquivos?', {})
        self.assertIn('segunda parte', r); self.assertIn('nao executei', r)
        self.assertIsNone(fn('Como reiniciar o Windows e formatar o disco?', {}))

    def test_14_15_metadados_e_conflito_conhecido_sem_apagar_memoria(self):
        env = self.env('_referencias_revisadas_local', '_anexar_referencias_revisadas',
                       '_correcoes_relevantes_local', '_montar_contexto_local', _sys_ia_local=lambda:'Sistema')
        env['config']['correcoes_conversa'] = [{'pergunta':'memoria RAM', 'correcao':'RAM e memoria permanente'}]
        r = env['_montar_contexto_local']('Explique memoria RAM')[-1]['content']
        self.assertIn('Conflito conhecido', r)
        self.assertNotIn('RAM e memoria permanente', r)
        self.assertEqual(len(env['config']['correcoes_conversa']), 1)
        for m in env['_r20_referencias_metadados']().values():
            self.assertTrue(all(k in m for k in ('versao','origem','revisado_em','escopo')))

    def test_16_citacao_inexistente_ou_ausente_nao_e_exibida(self):
        fn = self.env()['_r20_validar_citacoes']
        self.assertIsNone(fn('Afirmacao [inventado.txt]', ['real.txt']))
        self.assertIsNone(fn('Afirmacao sem fonte', ['real.txt']))
        self.assertEqual(fn('Trecho [real.txt]', ['real.txt']), 'Trecho [real.txt]')

    def test_17_calibracao_humana_nao_aplica_nem_usa_modelo(self):
        env = self.env(_tokens_lista=lambda x:x.lower().split())
        env['_buscar_no_conhecimento'] = lambda p,n: ('base', [(1, {'tok':p.split() if p.startswith('sim') else []})])
        casos = [{'pergunta':p,'suficiente':p.startswith('sim')} for p in ['sim um','sim dois','nao um','nao dois']]
        r = env['_r20_calibrar_evidencia'](casos)
        self.assertEqual(r['falsos_aceites_na_amostra'], 0)
        self.assertEqual(r['falsas_recusas_na_amostra'], 0)
        self.assertEqual(env['config'], {})
        self.assertIn('nao validacao independente', r['aviso'])
        with self.assertRaises(ValueError):
            env['_r20_calibrar_evidencia'](casos[:2])

    def test_18_19_orcamento_preserva_pares_e_recusa_pergunta_excessiva(self):
        env = self.env()
        historico = [{'role':'assistant','content':'orfao'}, {'role':'user','content':'u'},
                     {'role':'assistant','content':'a'}, {'role':'user','content':'pendente'}]
        pares = env['_r20_pares_historico'](historico, 'nova')
        self.assertEqual([m['content'] for m in pares], ['u','a'])
        msgs = [{'role':'system','content':'s'}, *pares, {'role':'user','content':'nova'}]
        r, meta = env['_r20_orcamento'](msgs, 500)
        self.assertEqual(r[-1]['content'], 'nova'); self.assertEqual(meta['reserva_saida'], 500)
        with self.assertRaises(ValueError):
            env['_r20_orcamento']([msgs[0],{'role':'user','content':'x'*10000}], 500)
        self.assertEqual(historico[0]['content'], 'orfao')

    def test_20_origem_sob_demanda_sem_prompt(self):
        env = self.env()
        env['_r20_origem']('modelo_local', reserva_saida=450)
        with redirect_stdout(io.StringIO()) as out:
            self.assertTrue(env['_r20_comandos']('origem da resposta local'))
        self.assertIn('modelo_local', out.getvalue())
        self.assertNotIn('prompt', out.getvalue())

    def test_21_22_finish_reason_usage_timings_preservados(self):
        env = self.env('_chamar_neural', _url_ia_local='http://127.0.0.1:8765')
        r = resposta_http({'choices':[{'message':{'content':'cortado'}, 'finish_reason':'length'}],
                          'usage':{'prompt_tokens':12, 'completion_tokens':3},
                          'timings':{'predicted_ms':123}})
        with patch('urllib.request.urlopen', return_value=r):
            self.assertEqual(env['_chamar_neural']([], seed=12), 'cortado')
        meta = env['_r20_telemetria'].ultima
        self.assertEqual(meta['finish_reason'], 'length')
        self.assertEqual(meta['usage']['prompt_tokens'], 12)
        self.assertEqual(meta['timings']['predicted_ms'], 123)

    def test_23_24_identificacao_hash_cache_e_versao_real(self):
        env = self.env()
        p = self.pasta/'atual.gguf'; p.write_bytes(b'modelo')
        a = env['_r20_metadados_arquivo'](str(p)); b = env['_r20_metadados_arquivo'](str(p))
        self.assertEqual(a,b); self.assertEqual(len(a['sha256']),64)
        self.assertEqual(len(env['_r20_hash_cache']),1)
        p.write_bytes(b'modelo novo')
        self.assertNotEqual(a['sha256'], env['_r20_metadados_arquivo'](str(p))['sha256'])
        env = avaliacao(str(self.pasta))
        with redirect_stdout(io.StringIO()):
            env['_executar_avaliacao_precisao_local']()
        dados = json.loads((self.pasta/'avaliacoes_ia_local'/'ultima.json').read_text())
        self.assertEqual(dados['software'],'r20'); self.assertEqual(dados['suite'],'precisao-local-v2')
        self.assertIn('identidade', dados)

    def test_25_26_casos_independentes_e_negativos_fora_das_referencias(self):
        env = self.env('_referencias_revisadas_local')
        casos = env['_r20_casos_extras']()
        self.assertEqual(len(casos),4)
        self.assertEqual({c['grupo'] for c in casos}, {'independente','negativo'})
        for caso in casos[:2]:
            self.assertEqual(env['_referencias_revisadas_local'](caso['pergunta']), [])

    def avaliar(self):
        env = avaliacao(str(self.pasta))
        with redirect_stdout(io.StringIO()):
            env['_executar_avaliacao_precisao_local']()
        rel = json.loads((self.pasta/'avaliacoes_ia_local'/'ultima.json').read_text())
        return env, rel

    def test_27_julgamento_confirmado_preserva_resposta_e_indice(self):
        env, rel = self.avaliar()
        d = {'id':rel['id'],'caso':'memoria','repeticao':1,'modo':'sem_referencias',
             'criterio':0,'julgamento':'parcial','justificativa':'Nao explicou completamente.'}
        env['input'].return_value = 'nao'
        self.assertIn('Cancelado',env['_r20_julgar'](d))
        env['input'].return_value = 'JULGAR'
        self.assertIn('salvo',env['_r20_julgar'](d))
        novo = json.loads((self.pasta/'avaliacoes_ia_local'/(rel['id']+'.json')).read_text())
        v = novo['casos'][0]['variantes'][0]
        self.assertEqual(v['resposta'],rel['casos'][0]['variantes'][0]['resposta'])
        self.assertEqual(v['julgamentos']['0']['resultado'],'parcial')
        d['criterio'] = -1
        with self.assertRaises(ValueError):
            env['_r20_julgar'](d)

    def test_28_relatorios_anteriores_nao_sao_sobrescritos(self):
        _, a = self.avaliar(); _, b = self.avaliar()
        self.assertNotEqual(a['id'],b['id'])
        for ident in (a['id'], b['id']):
            self.assertTrue((self.pasta/'avaliacoes_ia_local'/(ident+'.json')).exists())

    def test_primeira_avaliacao_preserva_relatorio_legado(self):
        pasta = self.pasta/'avaliacoes_ia_local'; pasta.mkdir()
        antigo = {'suite':'precisao-local-v1','casos':[{'resposta':'original preservada'}]}
        (pasta/'ultima.json').write_text(json.dumps(antigo))
        self.avaliar()
        backups = list(pasta.glob('legado-*.json'))
        self.assertEqual(len(backups),1)
        self.assertEqual(json.loads(backups[0].read_text()), antigo)

    def test_29_30_ordem_pareada_repeticoes_e_sementes(self):
        env = avaliacao(str(self.pasta))
        env['config'] = {'ia_local_opcoes':{'repeticoes':2, 'avaliacao_ampliada':True}}
        with redirect_stdout(io.StringIO()):
            env['_executar_avaliacao_precisao_local']()
        env['_chamar_neural'].assert_called()
        self.assertEqual(env['_chamar_neural'].call_count, 24)
        rel = json.loads((self.pasta/'avaliacoes_ia_local'/'ultima.json').read_text())
        self.assertEqual(rel['casos'][0]['variantes'][0]['modo'],'sem_referencias')
        self.assertEqual(rel['casos'][1]['variantes'][0]['modo'],'com_referencias')
        self.assertEqual(rel['casos'][6]['variantes'][0]['modo'],'com_referencias')
        for caso in rel['casos']:
            self.assertEqual(caso['variantes'][0]['seed'], caso['variantes'][1]['seed'])
        self.assertTrue(all(x['n']==2 for x in rel['variacao_tempos']))

    def test_configuracao_invalida_ou_recusada_preserva_modelo_nuvem(self):
        config = {'usar_ia_nuvem':False,'nivel_permissao':'admin'}
        env = self.env(config=config, input=Mock(return_value='nao'), salvar_json=Mock(), ARQ_CONFIG='config.json')
        with redirect_stdout(io.StringIO()):
            env['_r20_comandos']('configurar ia local: {"threads":true}')
            env['_r20_comandos']('configurar ia local: {"threads":2}')
        env['salvar_json'].assert_not_called()
        self.assertEqual(config, {'usar_ia_nuvem':False,'nivel_permissao':'admin'})
        env['input'].return_value = 'CONFIGURAR'
        with redirect_stdout(io.StringIO()):
            env['_r20_comandos']('configurar ia local: {"streaming":true}')
        self.assertTrue(config['ia_local_opcoes']['streaming'])
        self.assertFalse(config['usar_ia_nuvem'])

    def documentos_env(self, resposta='Resposta [real.txt]'):
        env = self.env('perguntar_aos_meus_arquivos', tool=lambda f:f, os=os,
                       _tokens_lista=lambda x:x.lower().split(),
                       ia_local_disponivel=lambda:True, _chamar_neural=Mock(return_value=resposta))
        env['_r20_memoria_opcional'] = lambda:True
        env['_buscar_no_conhecimento'] = lambda p,n: ('base', [(1, {'arq':'real.txt','n':0,'txt':'evidencia','tok':['evidencia']})])
        return env

    def test_documentos_bloqueiam_citacao_inventada_e_streaming(self):
        env = self.documentos_env('INVENTADO [inexistente.txt]')
        r = env['perguntar_aos_meus_arquivos']('evidencia')
        self.assertNotIn('INVENTADO', r)
        self.assertIn('TRECHOS ENCONTRADOS', r)
        self.assertFalse(env['_chamar_neural'].call_args.kwargs['stream'])

    def test_documentos_sem_cobertura_nao_chamam_modelo(self):
        env = self.documentos_env()
        r = env['perguntar_aos_meus_arquivos']('assunto diferente')
        self.assertIn('insuficiente', r)
        env['_chamar_neural'].assert_not_called()

    def test_fonte_cortada_do_contexto_nao_e_citacao_valida(self):
        env = self.documentos_env('INVENTADO [fora.txt]')
        env['_buscar_no_conhecimento'] = lambda p,n: ('base', [
            (2, {'arq':'real.txt','n':0,'txt':'evidencia '*600,'tok':['evidencia']}),
            (1, {'arq':'fora.txt','n':0,'txt':'evidencia','tok':['evidencia']})])
        r = env['perguntar_aos_meus_arquivos']('evidencia')
        self.assertNotIn('INVENTADO', r)
        self.assertNotIn('[fora.txt]', env['_chamar_neural'].call_args.args[0][1]['content'])

    def test_falhas_nao_contam_como_tempo_de_sucesso(self):
        env = self.env()
        r = env['_r20_resumo_variacao']([{'id':'x','variantes':[
            {'modo':'sem','estado':'falha de geracao','segundos':9},
            {'modo':'sem','estado':'gerada; ainda nao julgada','segundos':2}]}])
        self.assertEqual(r[0]['n'],1); self.assertEqual(r[0]['media'],2)


if __name__ == '__main__':
    unittest.main()
