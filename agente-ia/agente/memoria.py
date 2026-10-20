"""
memoria.py -- A memória do agente (curta e longa).

Curta  = as últimas mensagens da conversa (some quando você fecha o programa).
Longa  = fatos que ele aprendeu sobre você ("meu nome é Guilherme"),
         guardados em um arquivo de banco de dados SQLite.

Detalhe importante: SQLite já vem dentro do Python (biblioteca sqlite3).
Não precisa instalar nada.
"""

import os
import re
import sqlite3
import threading
from datetime import datetime


class Memoria:
    def __init__(self, caminho_banco: str, limite_curta: int = 12):
        self.caminho_banco = caminho_banco
        self.limite_curta = limite_curta
        self.curta = []  # lista de (papel, texto, quando)

        pasta = os.path.dirname(caminho_banco)
        if pasta:
            os.makedirs(pasta, exist_ok=True)

        # check_same_thread=False + tranca: permite usar o banco no servidor web,
        # que atende cada pedido em uma linha de execução (thread) diferente.
        self.tranca = threading.Lock()
        self.conexao = sqlite3.connect(caminho_banco, check_same_thread=False)
        self.conexao.execute(
            """
            CREATE TABLE IF NOT EXISTS fatos (
                chave TEXT PRIMARY KEY,
                valor TEXT NOT NULL,
                atualizado_em TEXT NOT NULL
            )
            """
        )
        self.conexao.execute(
            """
            CREATE TABLE IF NOT EXISTS historico (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                papel TEXT NOT NULL,
                texto TEXT NOT NULL,
                quando TEXT NOT NULL
            )
            """
        )
        self.conexao.commit()

    # ------------------------------------------------------------------
    # Memória curta (a conversa de agora)
    # ------------------------------------------------------------------
    def anotar(self, papel: str, texto: str) -> None:
        quando = datetime.now().strftime("%d/%m/%Y %H:%M")
        self.curta.append((papel, texto, quando))
        if len(self.curta) > self.limite_curta:
            self.curta.pop(0)
        with self.tranca:
            self.conexao.execute(
                "INSERT INTO historico (papel, texto, quando) VALUES (?, ?, ?)",
                (papel, texto, quando),
            )
            self.conexao.commit()

    def ultimas(self, quantidade: int = 6) -> list:
        return self.curta[-quantidade:]

    # ------------------------------------------------------------------
    # Memória longa (fatos sobre o usuário)
    # ------------------------------------------------------------------
    def lembrar(self, chave: str, valor: str) -> None:
        comando = """
            INSERT INTO fatos (chave, valor, atualizado_em) VALUES (?, ?, ?)
            ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor,
                                             atualizado_em = excluded.atualizado_em
        """
        with self.tranca:
            self.conexao.execute(
                comando,
                (chave.strip().lower(), valor.strip(),
                 datetime.now().isoformat(timespec="seconds")),
            )
            self.conexao.commit()

    def recuperar(self, chave: str):
        with self.tranca:
            linha = self.conexao.execute(
                "SELECT valor FROM fatos WHERE chave = ?", (chave.strip().lower(),)
            ).fetchone()
        return linha[0] if linha else None

    def todos_os_fatos(self) -> list:
        with self.tranca:
            return self.conexao.execute(
                "SELECT chave, valor FROM fatos ORDER BY chave"
            ).fetchall()

    def esquecer(self, chave: str) -> bool:
        with self.tranca:
            cursor = self.conexao.execute(
                "DELETE FROM fatos WHERE chave = ?", (chave.strip().lower(),)
            )
            self.conexao.commit()
        return cursor.rowcount > 0

    # ------------------------------------------------------------------
    # Extrair fatos do que o usuário escreveu (aprender sozinho)
    # ------------------------------------------------------------------
    def aprender_com_a_frase(self, frase: str) -> str:
        """
        Procura padrões tipo "meu nome é X", "eu moro em Y", "eu gosto de Z".
        Devolve o texto do que aprendeu, ou "" se não achou nada.
        """
        texto = frase.strip()
        baixo = texto.lower()

        padroes = [
            (r"\bmeu nome (?:e|é)\s+(.+)$", "nome", "seu nome"),
            (r"\bpode me chamar de\s+(.+)$", "nome", "seu nome"),
            (r"\beu me chamo\s+(.+)$", "nome", "seu nome"),
            (r"\beu moro em\s+(.+)$", "cidade", "onde você mora"),
            (r"\beu sou de\s+(.+)$", "cidade", "onde você mora"),
            (r"\beu (?:gosto|amo) de\s+(.+)$", "gosto", "do que você gosta"),
            (r"\bminha profissao (?:e|é)\s+(.+)$", "profissao", "sua profissão"),
            (r"\beu trabalho com\s+(.+)$", "profissao", "sua profissão"),
            (r"\bmeu objetivo (?:e|é)\s+(.+)$", "objetivo", "seu objetivo"),
            (r"\bmeu projeto (?:e|é)\s+(.+)$", "projeto", "seu projeto"),
        ]

        for padrao, chave, _rotulo in padroes:
            achado = re.search(padrao, baixo)
            if achado:
                valor = _limpar_valor(achado.group(1))
                # Nome e cidade ficam bonitos com a primeira letra maiúscula.
                if chave in ("nome", "cidade") and valor:
                    valor = " ".join(parte.capitalize() for parte in valor.split())
                if valor:
                    self.lembrar(chave, valor)
                    return f"{chave}={valor}"
        return ""

    def fechar(self) -> None:
        with self.tranca:
            try:
                self.conexao.close()
            except Exception:
                pass


def _limpar_valor(valor: str) -> str:
    """Tira pontuação sobrando do fim da frase: 'Guilherme.' -> 'Guilherme'."""
    valor = valor.strip().strip(".,!?;:")
    return valor[:80]


if __name__ == "__main__":  # teste rápido
    memoria = Memoria("dados/teste_memoria.db")
    print("Aprendeu:", memoria.aprender_com_a_frase("Oi, meu nome é Guilherme!"))
    print("Nome guardado:", memoria.recuperar("nome"))
    memoria.fechar()
    os.remove("dados/teste_memoria.db")
