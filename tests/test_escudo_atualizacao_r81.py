# -*- coding: utf-8 -*-
"""r81 — ATUALIZACAO CERTA + ESCUDO DE ENTRADA.

Bug real do PC do dono (log r73, 14/09):
1. O PC ficava PARADO na r73 para sempre: 'atualizar agora' dizia
   'conteudo identico, nada foi trocado' porque TODAS as URLs de entrega
   (agente.py + iniciar.bat) apontavam para a branch ANTIGA da sessao
   (01a08d8e), que parou na r73. A branch de entrega era a da NOVA sessao
   (01a09bca). Correcao: RAMO_OFICIAL unico + teste que trava a branch.
2. O modelo respondia um a um os BANNERS do proprio programa ('Verificando
   atualizacoes...', 'Cerebro restaurado...', '[Fim da previa...]'). No
   console Windows, thread de fundo que imprime durante o input() mistura o
   texto na linha de entrada e o 'comando' era saida interna. Correcao:
   _r81_saida_interna (funcao pura) ignora isso antes de ir pro modelo.
"""
import io
import os
import re
import unittest

import ast

from test_roteamento_conversa import SOURCE as AGENTE_PY, TREE as TREE_AGENTE

BRANCH_NOVA = 'arena/01a09bca-guilhermefmaga-site'
BRANCH_ANTIGA = 'arena/01a08d8e-guilhermefmaga-site'


def _fonte():
    with open(AGENTE_PY, encoding='utf-8') as f:
        return f.read()


class TestAtualizacaoCertaR81(unittest.TestCase):

    def test_selo_r81(self):
        fonte = _fonte()
        self.assertEqual(fonte.count('[Motor e avaliacao local 2026-09-11-r87]'), 1)
        self.assertEqual(fonte.count('[Motor e avaliacao local 2026-09-11-r80]'), 0)

    def test_ramo_oficial_unico_e_no_novo_branch(self):
        fonte = _fonte()
        # RAMO_OFICIAL existe e aponta para a branch da sessao atual
        m = re.search(r"^RAMO_OFICIAL = '([^']+)'", fonte, re.M)
        self.assertIsNotNone(m, 'RAMO_OFICIAL ausente')
        self.assertEqual(m.group(1), BRANCH_NOVA)
        # as duas fontes de download usam o mesmo RAMO_OFICIAL (nunca literal)
        self.assertIn('GUILHERMEFMAGA-SITE/" + RAMO_OFICIAL + "/agente.py', fonte)
        self.assertIn("'GUILHERMEFMAGA-SITE/' + RAMO_OFICIAL + '/'", fonte)
        # a branch antiga NAO pode aparecer em NENHUMA URL de entrega
        for linha in fonte.splitlines():
            if 'raw.githubusercontent' in linha:
                self.assertNotIn(BRANCH_ANTIGA, linha, 'URL antiga de entrega: ' + linha.strip())

    def test_iniciar_bat_no_novo_branch_e_crlf_puro(self):
        caminho = os.path.join(os.path.dirname(AGENTE_PY), 'iniciar.bat')
        com_bruto = io.open(caminho, 'rb').read()
        # CRLF puro em todas as linhas (lição 7)
        self.assertEqual(com_bruto.count(b'\r\n'), com_bruto.count(b'\n'))
        self.assertNotIn(b'\r\r', com_bruto)
        bat = com_bruto.decode('utf-8', errors='replace')
        self.assertEqual(bat.count(BRANCH_NOVA), 3, 'iniciar.bat: esperava 3 URLs na branch nova')
        self.assertNotIn(BRANCH_ANTIGA, bat)

    def test_urls_derivadas_do_ramo_oficial(self):
        # a URL do iniciar.bat e derivada da MESMA URL do agente.py (mesma branch)
        fonte = _fonte()
        self.assertIn('URL_INICIAR_OFICIAL = URL_AGENTE_OFICIAL.replace("/agente.py", "/iniciar.bat")', fonte)
        self.assertIn('"GUILHERMEFMAGA-SITE/" + RAMO_OFICIAL + "/agente.py"', fonte)


class TestEscudoDeEntradaR81(unittest.TestCase):

    def _escudo(self):
        # extrai a tupla de sinais + a funcao (ambos de topo de modulo) e exec
        nos = []
        for n in TREE_AGENTE.body:
            if isinstance(n, ast.Assign) and any(getattr(x, 'id', '') == '_R81_SINAIS_SAIDA' for x in n.targets):
                nos.append(n)
            elif isinstance(n, ast.FunctionDef) and n.name == '_r81_saida_interna':
                nos.append(n)
        self.assertEqual(len(nos), 2, 'tupla ou funcao r81 nao encontrada')
        amb = {}
        exec(compile(ast.Module(body=nos, type_ignores=[]), str(AGENTE_PY), 'exec'), amb)
        return amb['_r81_saida_interna']

    def test_banners_do_programa_sao_reconhecidos(self):
        _e = self._escudo()
        banners = [
            'Nuvem DESLIGADA: pulei o teste dos servidores (abertura mais rapida).',
            'Tudo roda no seu PC. Para usar o rodizio de IAs, digite: ligar ia',
            'Configurando o Super Agente Otimizado v4.0 ULTRA...',
            'Super Agente pronto! [Motor e avaliacao local 2026-09-11-r73] Nível de permissão: admin.',
            'MODO LOCAL ATIVO: as acoes e a conversa rodam no seu PC (sem cota/limite).',
            'Cerebro restaurado de cerebro.json: 1 topico(s) ensinado(s), 0 padrao(oes) aprendidos (r71).',
            'Verificando atualizacoes do agente (uma vez a cada 12 horas)...',
            'Pressione qualquer tecla para continuar. . .',
            'O que o agente deve fazer no PC?  ola',
            '[Previa da geracao; texto ainda nao verificado]: 2 é igual a dois.',
            '[Fim da previa; a resposta final aparece abaixo.]',
            '[IA Local]: O número 2 é igual a dois.',
            '[Local]: Disco C:: 930 GB totais | 876 GB usados (94.1%) | 55 GB livres',
            'IA neural local ligada (offline, sem cota nem limite).',
            'Agente ja esta atualizado.  Lancador main.py em dia.',
            'requirements.txt em dia (versoes fixadas das bibliotecas).',
            'iniciar.bat ja esta em dia (identico, nada trocado).',
            'Voce ja esta na versao oficial mais nova (conteudo identico). Nada foi trocado.',
            'O agente foi encerrado.',
            'Digite \'ajuda\' para ver o menu completo de comandos.',
            'o processo esta elevado como administrador no Windows. Nivel configurado: admin.',
        ]
        for b in banners:
            self.assertTrue(_e(b), 'deveria ser reconhecido como saida interna: ' + b)

    def test_comandos_humanos_sempre_passam(self):
        _e = self._escudo()
        comandos = [
            'ola',
            'status',
            'ajuda',
            'abre o youtube',
            'tabela MEU PC: CPU, RAM | i5, 16GB | i7, 32GB',
            'grafico VENDAS: jan 100 | fev 150',
            'ideias APP: x | y | z',
            'atualizar agora',
            'ligar ia',
            'desligar ia',
            'falar',
            'agendar windows backup as 22:00: echo ok',
            'conhecimento ensinar meu PC: CPU i5',
            '2',
            'oque e o significado de perder',
            'crie ideias das quais ainda em funções e ferramentas que ainda não existe',
        ]
        for c in comandos:
            self.assertFalse(_e(c), 'NUNCA pode bloquear comando humano: ' + c)

    def test_robustez_tipos(self):
        _e = self._escudo()
        self.assertFalse(_e(None))
        self.assertFalse(_e(123))
        self.assertFalse(_e(''))
        self.assertFalse(_e('   '))
        self.assertTrue(_e('   [OK] main.py ja esta em dia (identico, nada trocado).  '))


if __name__ == '__main__':
    unittest.main()
