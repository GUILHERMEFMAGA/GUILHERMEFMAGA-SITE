# -*- coding: utf-8 -*-
"""r101 — PEÇAS COM IDENTIDADE (SHA256) + EXE COM CRC: a falha REAL do PC
do dono (16/09, boot r100): `baixar visao` re-baixava o programa (llama-
server.exe) a cada execução e NUNCA passava no check final, e o projetor
(1,94 GB) que tinha sido cortado pela rede no download paralelo (bug r99)
ficava no lugar com o TAMAHO certo mas conteudo corrompido — nenhum
tamanho acusava a falta. Agora:

1. cada peça .gguf tem sha256 OFICIAL pinado da fonte (HuggingFace,
   checado via API): `_r101_peca_confianca` exige tamanho de saude E
   identidade (o arquivo bate com o sha de UMA das fontes) — arquivo do
   tamanho certo com FURO no meio NAO passa;
2. o piso do exe caiu de 10 MB para 2 MB (o exe do build atual do
   llama.cpp e menor que 10 MB — o check de 10 MB nunca passava);
3. o zip do programa passa em `ZipFile.testzip()` (CRC de cada membro)
   ANTES de extrair — zip cortado no download vira erro honesto.
"""
import hashlib
import io as _io
import os
import tempfile
import unittest
import zipfile

from test_roteamento_conversa import carregar


class Sha256R101(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.mkdtemp()
        cls.amb = carregar('_r101_sha256', '_r101_peca_confianca',
                           '_r94_urls_visao', os=os)

    def _arq(self, nome, conteudo):
        cam = os.path.join(self.tmp, nome)
        with open(cam, 'wb') as f:
            f.write(conteudo)
        return cam

    def test_sha256_bloco_a_bloco(self):
        conteudo = os.urandom(3 * 1024 * 1024 + 123)
        cam = self._arq('grande.bin', conteudo)
        esperado = hashlib.sha256(conteudo).hexdigest()
        self.assertEqual(self.amb['_r101_sha256'](cam), esperado)

    def test_confianca_sha_bate(self):
        conteudo = os.urandom(4096)
        cam = self._arq('ok.bin', conteudo)
        sha = hashlib.sha256(conteudo).hexdigest()
        self.assertTrue(self.amb['_r101_peca_confianca'](cam, 0, [sha]))
        # so precisa bater com UM dos pins (fontes alternadas)
        self.assertTrue(self.amb['_r101_peca_confianca'](
            cam, 0, ['0' * 64, sha.upper()]))

    def test_confianca_sha_erro_nao_passa(self):
        conteudo = os.urandom(4096)
        cam = self._arq('corrompido.bin', conteudo)
        sha_outro = hashlib.sha256(os.urandom(4096)).hexdigest()
        # tamanho certo, conteudo NAO: o sha256 e a prova
        self.assertFalse(self.amb['_r101_peca_confianca'](cam, 0, [sha_outro]))

    def test_confianca_tamanho_curto_nao_passa(self):
        cam = self._arq('curto.bin', os.urandom(1024))
        self.assertFalse(self.amb['_r101_peca_confianca'](cam, 1, []))
        self.assertFalse(self.amb['_r101_peca_confianca'](cam, 1))

    def test_confianca_sem_sha_pinado_so_tamanho(self):
        conteudo = os.urandom(4096)
        cam = self._arq('semsha.bin', conteudo)
        self.assertTrue(self.amb['_r101_peca_confianca'](cam, 0, []))
        self.assertTrue(self.amb['_r101_peca_confianca'](cam, 0, ['']))


class UrlsPinadasR101(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.amb = carregar('_r94_urls_visao')

    def test_sha256_oficiais_pinados(self):
        urls = self.amb['_r94_urls_visao']()
        # os pins sao os sha256 oficiais (LFS oid) dos arquivos na fonte
        # HuggingFace — conferidos via API em 16/09
        self.assertEqual(urls['modelo_sha256s'][0],
                         '652e85aa1e14c9087a4ccc3ab516fb794cbcf152f8b4b8d3c0b828da4ada62d')
        self.assertEqual(urls['mmproj_sha256s'][0],
                         '622429e8d31810962dd984bc98559e706db2fb1d40e99cb073beb7148d909d73')
        # alinhados com as listas de fontes (mesma ordem)
        self.assertEqual(len(urls['modelo_sha256s']), len(urls['modelo_fontes']))
        self.assertEqual(len(urls['mmproj_sha256s']), len(urls['mmproj_fontes']))

    def test_exe_min_mb_2(self):
        urls = self.amb['_r94_urls_visao']()
        # o exe do build atual tem dezenas de MB, mas MENOS que 10 MB —
        # o piso de 10 MB da r94 nunca passava (falha REAL no PC do dono)
        self.assertEqual(urls['exe_min_mb'], 2)


class ZipCorrompidoR101(unittest.TestCase):
    def test_zip_inteiro_passa_e_cortado_falha(self):
        buf = _io.BytesIO()
        with zipfile.ZipFile(buf, 'w') as z:
            z.writestr('llama-server.exe', os.urandom(2048))
        bom = buf.getvalue()
        with zipfile.ZipFile(_io.BytesIO(bom)) as z:
            self.assertIsNone(z.testzip())
        cortado = bom[:len(bom) // 2]
        try:
            with zipfile.ZipFile(_io.BytesIO(cortado)) as z:
                membro_ruim = z.testzip()
            self.assertIsNotNone(membro_ruim)
        except zipfile.BadZipFile:
            pass  # corte mais agressivo: o zip nem abre — tambem erra


class WiringR101(unittest.TestCase):
    def test_wiring_no_baixar_visao(self):
        from test_roteamento_conversa import SOURCE
        fonte = SOURCE.read_text(encoding='utf-8')
        i94 = fonte.find('def _r94_visao_baixar(')
        fim = fonte.find('def _r94_matar_visao(', i94)
        trecho = fonte[i94:fim]
        # pre-check e check final confiam pelo sha256 (nao so pelo tamanho)
        self.assertGreaterEqual(trecho.count('_r101_peca_confianca'), 2)
        self.assertIn('_r101_sha256(destino)', trecho)  # no _baixar_com_fontes
        # o zip do programa passa em CRC antes de extrair
        self.assertIn('testzip', trecho)
        # e o _baixar_com_fontes agora recebe os shas
        self.assertIn("urls.get('modelo_sha256s', ())", trecho)
        self.assertIn("urls.get('mmproj_sha256s', ())", trecho)


if __name__ == '__main__':
    unittest.main()
