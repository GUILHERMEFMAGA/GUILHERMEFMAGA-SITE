# -*- coding: utf-8 -*-
"""r82 — TABELA/GRAFICO/IDEIAS COM A CAIXA DO DONO.

Bug real do PC do dono (log de 14/09, r81): 'tabela MEU PC: CPU, RAM | i5,
16GB | i7, 32GB' saiu na tela como 'cpu | ram | 16gb' — a rota extrai os
dados do cmd MINUSCULO (comando.lower()) que serve só para a condição da
rota. Correção: os dados vêm do texto ORIGINAL (caixa preservada), o que
mantém o 'tudo bonitinho' prometido na r80."""
import unittest

from test_roteamento_conversa import SOURCE as AGENTE_PY, carregar


def _fonte():
    with open(AGENTE_PY, encoding='utf-8') as f:
        return f.read()


class TestCaixaPreservadaR82(unittest.TestCase):

    def test_selo_r82(self):
        self.assertEqual(_fonte().count('[Motor e avaliacao local 2026-09-11-r102]'), 1)

    def test_rota_tabela_mantem_caixa_do_dono(self):
        # reproduz o pipeline EXATO da rota r80 (com a correção r82: texto original)
        _parse = carregar('_r80_parse_tabela')['_r80_parse_tabela']
        comando = 'tabela MEU PC: CPU, RAM | i5, 16GB | i7, 32GB'
        cmd = comando.lower().strip()  # condição da rota (minúsculo)
        self.assertTrue(cmd.startswith('tabela ') and (':' in cmd or '|' in cmd))
        _resto = comando.strip()[len("tabela"):].strip().lstrip(":").strip()
        r = _parse(_resto)
        self.assertEqual(r, ('MEU PC', ['CPU', 'RAM'], [['i5', '16GB'], ['i7', '32GB']]))

    def test_rota_grafico_mantem_caixa(self):
        _parse = carregar('_r80_parse_grafico')['_r80_parse_grafico']
        comando = 'grafico VENDAS 2026: Jan 100 | Fev 150'
        cmd = comando.lower().strip()
        self.assertTrue(cmd.startswith('grafico ') and (':' in cmd or '|' in cmd))
        _resto = comando.strip()[len("grafico"):].strip().lstrip(":").strip()
        r = _parse(_resto)
        self.assertEqual(r, ('VENDAS 2026', [('Jan', 100.0), ('Fev', 150.0)]))

    def test_rota_ideias_mantem_caixa(self):
        _parse = carregar('_r80_parse_ideias')['_r80_parse_ideias']
        comando = 'ideias APP DE ENTREGA: App X | app Y'
        cmd = comando.lower().strip()
        self.assertTrue(cmd.startswith('ideias ') and (':' in cmd or '|' in cmd))
        _resto = comando.strip()[len("ideias"):].strip().lstrip(":").strip()
        self.assertEqual(_parse(_resto), ('APP DE ENTREGA', ['App X', 'app Y']))

    def test_fonte_extrai_do_texto_original(self):
        # as 3 rotas usam o 'comando' original (não o 'cmd' minúsculo) p/ os dados
        fonte = _fonte()
        for linha in (
            '_resto_tb = comando.strip()[len("tabela"):].strip().lstrip(":").strip()',
            '_resto_gf = comando.strip()[len("grafico"):].strip().lstrip(":").strip()',
            '_resto_id = comando.strip()[len("ideias"):].strip().lstrip(":").strip()',
        ):
            self.assertIn(linha, fonte)
        self.assertNotIn('_resto_tb = cmd[len("tabela")]', fonte)


if __name__ == '__main__':
    unittest.main()
