# -*- coding: utf-8 -*-
"""r87 — WHATSAPP COM MEMÓRIA E AUDITORIA (aprimoramento, pedido do dono 14/09).

O dono pediu: 'sem tirar nada, só pôr suas ideias em código, mas tem que ser
extremamente boas'. As 4 ideias (todas no domínio que ele usa de verdade,
WhatsApp/contatos) nascem do que o código JÁ fazia e deixava no meio:

1) HISTÓRICO DE ENVIOS — o agente JÁ registrou cada envio em
   logs_whatsapp.json (_confirmar_envio_wpp) mas NUNCA tinha como VER.
   Agora: 'minhas mensagens' mostra os últimos envios (data -> destino: msg).
2) PROCURAR CONTATO — existia nome->numero (com fuzzy) mas não o inverso.
   Agora: 'qual o numero do joao' (nome, exato/parecido) e
   'quem e +55 16 99132-8338' / 'quem e 991328338' (numero completo ou
   só a parte final) resolvem local, sem gastar IA.
3) DESTINO NO LOG — o envio por busca no app (enviar_whatsapp_por_nome)
   registrava numero="" e o historico não mostrava pra quem foi. Agora o
   log guarda 'destino' (o nome/grupo buscado).
4) DESFAZER CONTATO — 'salvar contato'/'apagar contato' agora guardam um
   snapshot (contatos.json.ultimo) ANTES de mudar; 'desfazer contato'
   restaura o último estado. O 'desfazer' genérico já era usado pela
   edição de projetos, por isso o comando é específico.

+ BÔNUS: após mandar para um NÚMERO CRU que não está na agenda, o agente
  pergunta UMA vez o nome para salvar (as próximas vezes ficam mais rápidas).
"""
import unittest

from test_roteamento_conversa import SOURCE as AGENTE_PY, carregar


def _fonte():
    with open(AGENTE_PY, encoding='utf-8') as f:
        return f.read()


class TestSeloR87(unittest.TestCase):
    def test_selo_avancou_pelo_r87(self):
        # canario do selo atual fica em test_r85_fixes; aqui so trava que a
        # release r87 JÁ saiu (o selo nunca volta atras)
        import re
        m = re.search(r'\[Motor e avaliacao local 2026-09-11-r(\d+)\]', _fonte())
        self.assertIsNotNone(m, 'selo ausente')
        self.assertGreaterEqual(int(m.group(1)), 87)


class TestStrNomeR87(unittest.TestCase):
    def setUp(self):
        self.f = carregar('_r87_str_nome')['_r87_str_nome']

    def test_capitaliza(self):
        self.assertEqual(self.f('joao iser'), 'Joao Iser')

    def test_vazio(self):
        self.assertEqual(self.f(''), '')


class TestUltimosEnviosWpp(unittest.TestCase):
    def setUp(self):
        self.f = carregar('_r87_ultimos_envios_wpp')['_r87_ultimos_envios_wpp']

    def _rec(self, i, destino=None, numero=None, modo=None, msg=None):
        r = {"data": "2026-09-14T10:%02d:00" % i, "mensagem": msg or "oi"}
        if destino is not None:
            r["destino"] = destino
        if numero is not None:
            r["numero"] = numero
        if modo is not None:
            r["modo"] = modo
        return r

    def test_vazio(self):
        self.assertIn('Nenhum envio registrado', self.f([]))
        self.assertIn('Nenhum envio registrado', self.f(None))

    def test_mostra_destino_e_mensagem(self):
        out = self.f([self._rec(1, destino='joao iser', msg='oi, tudo bem?')])
        self.assertIn('joao iser', out.lower())
        self.assertIn('oi, tudo bem?', out)

    def test_ordenacao_mais_recente_primeiro(self):
        # o último da lista (mais recente) aparece primeiro na saída
        out = self.f([self._rec(1, destino='a'), self._rec(2, destino='b')])
        self.assertLess(out.lower().find('b'), out.lower().find('a'))

    def test_limite_quantidade(self):
        regs = [self._rec(i, destino='c%d' % i) for i in range(12)]
        out = self.f(regs, quantidade=10)
        self.assertIn('(10 de 10)', out)

    def test_destino_cai_no_numero(self):
        out = self.f([self._rec(1, numero='+5516991328338', msg='ola')])
        self.assertIn('+5516991328338', out)

    def test_destino_cai_no_modo_busca_por_nome(self):
        # envio pelo app: destino vira o nome que estava em modo
        out = self.f([self._rec(1, modo='whatsapp app (busca por nome: CORVOS DE CARTOLA OFC)',
                                msg='ola tudo bem')])
        self.assertIn('CORVOS DE CARTOLA OFC', out)


class TestProcurarContato(unittest.TestCase):
    def setUp(self):
        self.f = carregar('_r87_procurar_contato')['_r87_procurar_contato']
        self.cont = {
            'joao iser': '+55 16 99132-8338',
            'maria': '+55 11 98888-7777',
            'carlos': {'whatsapp': '+55 21 97777-6666', 'email': 'c@x.com'},
        }

    def test_por_nome_exato(self):
        out = self.f('joao iser', self.cont)
        self.assertIn('Joao Iser', out)
        self.assertIn('+55 16 99132-8338', out)

    def test_por_nome_parecido(self):
        out = self.f('joao ise', self.cont)
        self.assertIn('Joao Iser', out)

    def test_por_numero_completo(self):
        out = self.f('+55 16 99132-8338', self.cont)
        self.assertIn('Joao Iser', out)

    def test_por_numero_somente_parte_final(self):
        # '991328338' (o final) acha +55 16 99132-8338
        out = self.f('991328338', self.cont)
        self.assertIn('Joao Iser', out)

    def test_contato_dict_acha_numero(self):
        out = self.f('carlos', self.cont)
        self.assertIn('+55 21 97777-6666', out)

    def test_nao_achou(self):
        out = self.f('zoe', self.cont)
        self.assertIn('Nao achei', out)

    def test_numero_nao_achado(self):
        out = self.f('+55 99 00000-1111', self.cont)
        self.assertIn('Nao encontrei', out)

    def test_vazio(self):
        self.assertIn('Diga o nome ou o numero', self.f('', self.cont))

    def test_agenda_vazia(self):
        self.assertIn('vazia', self.f('joao', {}))


class TestWiringR87(unittest.TestCase):
    """Confere que o código REAL ligou as funções puras nas rotas/hooks."""

    def test_rota_minhas_mensagens(self):
        fonte = _fonte()
        self.assertIn('def _r87_ultimos_envios_wpp', fonte)
        self.assertIn('_r87_ultimos_envios_wpp(logs_whatsapp)', fonte)
        for g in ('minhas mensagens', 'o que eu mandei', 'historico do whatsapp'):
            self.assertIn(g, fonte)

    def test_rota_procurar_contato(self):
        fonte = _fonte()
        self.assertIn('_r87_procurar_contato(_resto87, contatos)', fonte)
        self.assertIn('"qual o numero"', fonte)
        self.assertIn('"quem e"', fonte)

    def test_rota_desfazer_contato(self):
        fonte = _fonte()
        self.assertIn('def _r87_desfazer_contato', fonte)
        self.assertIn('_r87_desfazer_contato()', fonte)
        self.assertIn('"desfazercontato"', fonte)

    def test_hooks_de_backup(self):
        fonte = _fonte()
        # cada mutacao de contato faz snapshot antes
        self.assertGreaterEqual(fonte.count('_r87_backup_contatos()'), 4)
        self.assertIn('def _r87_backup_contatos', fonte)
        self.assertIn('ARQ_CONTATOS + ".ultimo"', fonte)

    def test_destino_no_log(self):
        fonte = _fonte()
        self.assertIn('destino: str = ""', fonte)
        self.assertIn('"destino": destino', fonte)
        # os dois caminhos de envio agora passam o destino
        self.assertIn('destino=nome_usado or destino', fonte)
        self.assertIn('destino=alvo', fonte)

    def test_save_inteligente_apos_numero(self):
        fonte = _fonte()
        # enviou p/ numero cru e nao salvo -> pergunta nome e salva
        self.assertIn('Quer salvar esse numero com um nome?', fonte)
        self.assertIn('_salvar_contato_wpp(_nome87, _alvo86)', fonte)


if __name__ == '__main__':
    unittest.main()
