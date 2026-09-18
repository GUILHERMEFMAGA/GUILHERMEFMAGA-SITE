"""
orquestrador.py -- O "mini-n8n": motor de automação em Python puro.

A ideia do n8n é: "quando acontecer X, faça Y, depois Z".
Aqui a gente faz IGUAL, só que:
    - sem instalar nada (nem Docker, nem Node.js);
    - sem login, sem nuvem, sem mensalidade;
    - tudo em arquivos .json que você lê e edita no VS Code;
    - roda no seu computador, offline.

Um FLUXO é um arquivo assim (pasta dados/fluxos):

    {
      "nome": "bom_dia",
      "gatilho": {"tipo": "horario", "quando": "08:00"},
      "passos": [
        {"acao": "data_hora", "salvar_como": "agora"},
        {"acao": "salvar_arquivo", "args": ["diario.txt"], "entrada": "Bom dia! {{agora}}"}
      ]
    }

Tipos de gatilho (o "quando"):
    manual    -> roda quando você pede:  python main.py fluxo bom_dia
    intervalo -> roda a cada X segundos (só no modo serviço)
    horario   -> roda todo dia naquele horário (só no modo serviço)

O texto {{variavel}} é trocado pelo resultado do passo anterior.
Igualzinho às "expressões" do n8n.
"""

import json
import os
import re
import time
from datetime import datetime

from . import ferramentas


class Fluxo:
    def __init__(self, dados: dict, caminho: str = ""):
        self.nome = dados.get("nome", "sem_nome")
        self.descricao = dados.get("descricao", "")
        self.gatilho = dados.get("gatilho", {"tipo": "manual"})
        self.passos = dados.get("passos", [])
        self.caminho = caminho

    def para_json(self) -> dict:
        return {"nome": self.nome, "descricao": self.descricao,
                "gatilho": self.gatilho, "passos": self.passos}


# ---------------------------------------------------------------------------
# Carregar e salvar fluxos
# ---------------------------------------------------------------------------
def pasta_de_fluxos(pasta_dados: str) -> str:
    caminho = os.path.join(pasta_dados, "fluxos")
    os.makedirs(caminho, exist_ok=True)
    return caminho


def carregar_fluxos(pasta_dados: str) -> list:
    fluxos = []
    for nome_arquivo in sorted(os.listdir(pasta_de_fluxos(pasta_dados))):
        if not nome_arquivo.endswith(".json"):
            continue
        caminho = os.path.join(pasta_de_fluxos(pasta_dados), nome_arquivo)
        try:
            with open(caminho, "r", encoding="utf-8") as arquivo:
                fluxos.append(Fluxo(json.load(arquivo), caminho))
        except Exception as erro:
            print(f"[aviso] Não consegui ler o fluxo {nome_arquivo}: {erro}")
    return fluxos


def buscar_fluxo(pasta_dados: str, nome: str):
    for fluxo in carregar_fluxos(pasta_dados):
        if fluxo.nome.lower() == nome.lower():
            return fluxo
    return None


# ---------------------------------------------------------------------------
# Motor de execução
# ---------------------------------------------------------------------------
def _trocar_variaveis(texto, contexto: dict):
    """Troca {{nome}} pelo valor guardado no contexto."""
    if not isinstance(texto, str):
        return texto

    def substituir(achado):
        chave = achado.group(1).strip()
        if chave in contexto:
            return str(contexto[chave])
        return achado.group(0)

    if "{{" in texto:
        return re.sub(r"\{\{(.+?)\}\}", substituir, texto)
    return texto


def executar_fluxo(fluxo: Fluxo, silencioso: bool = False) -> dict:
    """
    Executa os passos em ordem. Devolve um relatório com o que aconteceu.
    É aqui que a "mágica" do n8n acontece: cada passo recebe o resultado do anterior.
    """
    contexto = {
        "data": datetime.now().strftime("%d/%m/%Y"),
        "hora": datetime.now().strftime("%H:%M"),
    }
    registro = []
    inicio = time.time()

    if not silencioso:
        print(f"\n>>> Executando fluxo: {fluxo.nome}")
        if fluxo.descricao:
            print(f"    {fluxo.descricao}")

    for indice, passo in enumerate(fluxo.passos, start=1):
        acao = passo.get("acao", "")
        argumentos = passo.get("args", [])

        # Os argumentos fixos também aceitam {{variaveis}}
        argumentos = [_trocar_variaveis(arg, contexto) for arg in argumentos]

        # Se o passo tem "entrada", ela é o último argumento da ferramenta.
        if "entrada" in passo:
            entrada = _trocar_variaveis(passo["entrada"], contexto)
            argumentos = list(argumentos) + [entrada]

        resultado = ferramentas.executar(acao, *argumentos)

        # Guarda o resultado para os próximos passos usarem.
        nome_variavel = passo.get("salvar_como") or f"passo{indice}"
        contexto[nome_variavel] = resultado

        registro.append({"passo": indice, "acao": acao, "resultado": str(resultado)})

        if not silencioso:
            print(f"    [{indice}/{len(fluxo.passos)}] {acao} -> {str(resultado)[:120]}")

    duracao = round(time.time() - inicio, 3)
    if not silencioso:
        print(f"<<< Fluxo '{fluxo.nome}' concluído em {duracao}s\n")

    return {
        "fluxo": fluxo.nome,
        "quando": datetime.now().isoformat(timespec="seconds"),
        "duracao": duracao,
        "passos_executados": len(registro),
        "registro": registro,
        "variaveis": contexto,
    }


# ---------------------------------------------------------------------------
# Modo serviço: dispara fluxos por horário ou intervalo
# ---------------------------------------------------------------------------
def _carregar_estado(pasta_dados: str) -> dict:
    caminho = os.path.join(pasta_dados, "estado_fluxos.json")
    if os.path.exists(caminho):
        try:
            with open(caminho, "r", encoding="utf-8") as arquivo:
                return json.load(arquivo)
        except Exception:
            return {}
    return {}


def _salvar_estado(pasta_dados: str, estado: dict) -> None:
    caminho = os.path.join(pasta_dados, "estado_fluxos.json")
    with open(caminho, "w", encoding="utf-8") as arquivo:
        json.dump(estado, arquivo, ensure_ascii=False, indent=2)


def modo_servico(pasta_dados: str, verificar_a_cada: int = 30, rodar_uma_vez: bool = False) -> None:
    """
    Fica vigiando os gatilhos. É o equivalente ao n8n "rodando em produção",
    mas dentro do seu terminal. Pare com Ctrl+C.
    """
    print("=" * 62)
    print(" MODO SERVIÇO LIGADO -- o agente está vigiando os gatilhos")
    print(f" Verificando a cada {verificar_a_cada} segundos. Para parar: Ctrl+C")
    print("=" * 62)

    historico_execucoes = []
    while True:
        agora = datetime.now()
        estado = _carregar_estado(pasta_dados)
        fluxos = carregar_fluxos(pasta_dados)

        for fluxo in fluxos:
            tipo = fluxo.gatilho.get("tipo", "manual")
            chave_estado = fluxo.nome
            ultimo = estado.get(chave_estado, {})

            disparar = False

            if tipo == "horario":
                alvo = str(fluxo.gatilho.get("quando", "08:00"))
                hoje = agora.strftime("%Y-%m-%d")
                if agora.strftime("%H:%M") == alvo and ultimo.get("ultima_data") != hoje:
                    disparar = True
                    estado.setdefault(chave_estado, {})["ultima_data"] = hoje

            elif tipo == "intervalo":
                segundos = int(fluxo.gatilho.get("segundos", 3600))
                ultimo_ts = _para_timestamp(ultimo.get("ultima_execucao"))
                if ultimo_ts is None or (agora - ultimo_ts).total_seconds() >= segundos:
                    disparar = True
                    estado.setdefault(chave_estado, {})["ultima_execucao"] = agora.isoformat()

            if disparar:
                relatorio = executar_fluxo(fluxo)
                historico_execucoes.append(relatorio)
                _salvar_estado(pasta_dados, estado)
                _salvar_log(pasta_dados, relatorio)

        if rodar_uma_vez:
            print("(modo teste: verifiquei uma vez e vou parar)")
            return
        time.sleep(verificar_a_cada)


def _para_timestamp(texto):
    if not texto:
        return None
    try:
        return datetime.fromisoformat(texto)
    except Exception:
        return None


def _salvar_log(pasta_dados: str, relatorio: dict) -> None:
    caminho = os.path.join(pasta_dados, "log_execucoes.jsonl")
    with open(caminho, "a", encoding="utf-8") as arquivo:
        arquivo.write(json.dumps(relatorio, ensure_ascii=False) + "\n")


def listar_fluxos(pasta_dados: str) -> str:
    fluxos = carregar_fluxos(pasta_dados)
    if not fluxos:
        return "Nenhum fluxo encontrado em dados/fluxos/."
    linhas = []
    for fluxo in fluxos:
        gatilho = fluxo.gatilho
        if gatilho.get("tipo") == "horario":
            quando = f"todo dia às {gatilho.get('quando')}"
        elif gatilho.get("tipo") == "intervalo":
            quando = f"a cada {gatilho.get('segundos')} segundos"
        else:
            quando = "quando você mandar"
        linhas.append(f"- {fluxo.nome}: {len(fluxo.passos)} passos | {quando} | {fluxo.descricao}")
    return "Fluxos disponíveis:\n" + "\n".join(linhas)


if __name__ == "__main__":  # teste rápido escrito na mão
    import tempfile

    pasta = tempfile.mkdtemp()
    os.makedirs(os.path.join(pasta, "fluxos"), exist_ok=True)
    exemplo = {
        "nome": "teste",
        "descricao": "Fluxo de teste",
        "gatilho": {"tipo": "manual"},
        "passos": [
            {"acao": "calcular", "args": ["2 + 3 * 4"], "salvar_como": "conta"},
            {"acao": "analisar_texto", "entrada": "O resultado é {{conta}}", "salvar_como": "analise"},
        ],
    }
    with open(os.path.join(pasta, "fluxos", "teste.json"), "w", encoding="utf-8") as arquivo:
        json.dump(exemplo, arquivo, ensure_ascii=False)
    fluxo = buscar_fluxo(pasta, "teste")
    executar_fluxo(fluxo)
