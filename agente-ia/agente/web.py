"""
web.py -- Painel no navegador para conversar com o agente.

Por que existe?
    Terminal é ótimo, mas um painelzinho no navegador deixa tudo visível:
    conversa, estado do cérebro, fluxos e arquivos. É o seu "n8n caseiro".

Como roda?
    python main.py web          -> abre em http://localhost:8000
    python main.py web --porta 8080

Detalhe técnico: usamos o http.server da biblioteca padrão do Python.
Não precisa instalar Flask, Django ou Node.js.
"""

import json
import os
import threading
import time
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from . import ferramentas, orquestrador
from .nucleo import NOME, VERSAO, Agente

# ---------------------------------------------------------------------------
# O agente é criado uma vez e compartilhado entre os pedidos.
# ---------------------------------------------------------------------------
PASTA_BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CAMINHO_PAINEL = os.path.join(os.path.dirname(__file__), "..", "web", "painel.html")

AGENTE = None
TRANCA = threading.Lock()      # evita dois treinos ao mesmo tempo
CONTADOR = {"decisoes": 0, "inicio": datetime.now().isoformat(timespec="seconds")}


def _garantir_agente() -> Agente:
    global AGENTE
    if AGENTE is None:
        AGENTE = Agente(PASTA_BASE, silencioso=False)
    return AGENTE


def _estado() -> dict:
    agente = _garantir_agente()
    arquivos = ferramentas.listar_arquivos()
    return {
        "nome": NOME,
        "versao": VERSAO,
        "intencoes": len(agente.rede.classes) if agente.rede else 0,
        "vocabulario": len(agente.vetorizador.vocabulario) if agente.vetorizador else 0,
        "pesos": agente._contar_parametros(),
        "topicos": agente.conhecimento.total(),
        "fatos": len(agente.memoria.todos_os_fatos()),
        "ferramentas": len(ferramentas.CATALOGO),
        "arquivos": arquivos.replace("Arquivos em dados/saidas:", "").strip(),
        "hora": datetime.now().strftime("%H:%M:%S"),
        "decisoes": CONTADOR["decisoes"],
    }


def _como_quando(fluxo) -> str:
    gatilho = fluxo.gatilho or {}
    if gatilho.get("tipo") == "horario":
        return f"todo dia às {gatilho.get('quando')}"
    if gatilho.get("tipo") == "intervalo":
        return f"a cada {gatilho.get('segundos')}s"
    return "quando eu mandar"


class Manipulador(BaseHTTPRequestHandler):
    server_version = f"AgenteLocal/{VERSAO}"

    # ------------------------------------------------------------------
    def _responder_json(self, dados: dict, codigo: int = 200) -> None:
        corpo = json.dumps(dados, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(corpo)

    def _responder_html(self, html: str) -> None:
        corpo = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(corpo)

    def _ler_corpo(self) -> dict:
        tamanho = int(self.headers.get("Content-Length", 0) or 0)
        if not tamanho:
            return {}
        bruto = self.rfile.read(tamanho)
        try:
            return json.loads(bruto.decode("utf-8"))
        except Exception:
            return {}

    # ------------------------------------------------------------------
    def do_GET(self):
        caminho = self.path.split("?")[0]
        try:
            if caminho in ("/", "/index.html"):
                with open(CAMINHO_PAINEL, "r", encoding="utf-8") as arquivo:
                    self._responder_html(arquivo.read())
            elif caminho == "/api/estado":
                self._responder_json(_estado())
            elif caminho == "/api/fluxos":
                fluxos = [
                    {"nome": fluxo.nome, "descricao": fluxo.descricao, "quando": _como_quando(fluxo)}
                    for fluxo in orquestrador.carregar_fluxos(_garantir_agente().pasta_dados)
                ]
                self._responder_json({"fluxos": fluxos})
            elif caminho == "/api/ajuda":
                self._responder_json({
                    "rotas": ["conversa", "conhecimento", "calculo", "data_hora",
                              "salvar_arquivo", "ler_arquivo", "analisar_texto",
                              "resumir", "criar_texto", "aprender_sobre_usuario",
                              "recuperar_memoria", "executar_fluxo", "nao_sei"],
                    "ferramentas": list(ferramentas.CATALOGO.keys()),
                })
            else:
                self._responder_json({"erro": "caminho não encontrado"}, 404)
        except Exception as erro:
            self._responder_json({"erro": str(erro)}, 500)

    # ------------------------------------------------------------------
    def do_POST(self):
        caminho = self.path.split("?")[0]
        dados = self._ler_corpo()
        inicio = time.time()

        try:
            if caminho == "/api/conversar":
                agente = _garantir_agente()
                texto = str(dados.get("texto", ""))
                resultado = agente.responder(texto, raio_x=bool(dados.get("raio_x")))
                CONTADOR["decisoes"] += 1
                resultado["tempo_ms"] = int((time.time() - inicio) * 1000)
                self._responder_json(resultado)

            elif caminho == "/api/fluxo":
                agente = _garantir_agente()
                nome = str(dados.get("nome", ""))
                fluxo = orquestrador.buscar_fluxo(agente.pasta_dados, nome)
                if not fluxo:
                    self._responder_json({"resposta": f"Fluxo '{nome}' não encontrado."}, 404)
                    return
                relatorio = orquestrador.executar_fluxo(fluxo, silencioso=True)
                linhas = [f"{item['passo']}. {item['acao']} -> {item['resultado'][:140]}"
                          for item in relatorio["registro"]]
                self._responder_json({
                    "resposta": f"Fluxo '{fluxo.nome}' executado em {relatorio['duracao']}s.\n\n"
                                + "\n".join(linhas),
                    "tempo_ms": int((time.time() - inicio) * 1000),
                })

            elif caminho == "/api/treinar":
                with TRANCA:
                    agente = _garantir_agente()
                    resumo = agente.treinar(epocas=350, mostrar_progresso=False)
                self._responder_json({
                    "mensagem": (f"{resumo['intencoes']} intenções, "
                                 f"{resumo['exemplos']} exemplos, "
                                 f"{resumo['acuracia_no_treino']}% de acerto no treino, "
                                 f"erro final {resumo['erro_final']}, "
                                 f"tudo em {resumo['duracao_segundos']}s."),
                    "tempo_ms": int((time.time() - inicio) * 1000),
                })

            else:
                self._responder_json({"erro": "caminho não encontrado"}, 404)

        except Exception as erro:
            self._responder_json({"erro": f"{type(erro).__name__}: {erro}"}, 500)

    # menos barulho no terminal
    def log_message(self, formato, *argumentos):
        print(f"   [web] {self.address_string()} - {formato % argumentos}")


def iniciar(porta: int = 8000, abrir_navegador: bool = True,
            host: str = "0.0.0.0") -> None:
    print("=" * 62)
    print(f" PAINEL DO AGENTE {NOME} v{VERSAO}")
    print(f" Endereço: http://localhost:{porta}")
    print(" Para parar: Ctrl+C")
    print("=" * 62)

    _garantir_agente()  # treina/carrega antes de abrir o servidor

    servidor = ThreadingHTTPServer((host, porta), Manipulador)
    servidor.daemon_threads = True

    if abrir_navegador:
        def abrir():
            time.sleep(1.0)
            try:
                import webbrowser

                webbrowser.open(f"http://localhost:{porta}")
            except Exception:
                pass

        threading.Thread(target=abrir, daemon=True).start()

    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nPainel encerrado. Até a próxima!")
    finally:
        servidor.server_close()


if __name__ == "__main__":  # alternativ:  python -m agente.web
    iniciar()
