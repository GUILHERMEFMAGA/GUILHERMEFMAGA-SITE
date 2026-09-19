# testes/testar_regras.py
"""O portao: cerebro real, mundo falso. So deixa passar o que provou no disco."""
import json
import shutil
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
MUNDO = RAIZ / "testes" / "mundo_falso"

sys.path.insert(0, str(RAIZ / "agente"))
import loop

CHAVES_OBRIGATORIAS = ["id", "pasta_com_conteudo", "criar_arquivo", "conteudo"]

CASOS = [
    {
        "nome": "so_gitkeep",
        "antes": [".gitkeep"],
        "acao_esperada": "criar_arquivo_base",
        "arquivo_esperado": "base.py",
    },
    {
        "nome": "com_base",
        "antes": [".gitkeep", "base.py"],
        "acao_esperada": "avisar_sobre_config",
        "arquivo_esperado": "LEIA-ME.txt",
    },
    {
        "nome": "resolvida",
        "antes": [".gitkeep", "base.py", "LEIA-ME.txt"],
        "acao_esperada": "nada_a_fazer",
        "arquivo_esperado": None,
    },
    {
        "nome": "estranha",
        "antes": ["nota.txt"],
        "acao_esperada": "nada_a_fazer",
        "arquivo_esperado": None,
    },
]


def ler_cerebro():
    return json.loads(loop.FLUXO.read_text(encoding="utf-8"))["acoes"]


def validar_formato(regras):
    """Antes de confiar no comportamento, confiro se o formato esta inteiro."""
    erros = []
    vistos = set()
    for indice, regra in enumerate(regras, start=1):
        faltando = [chave for chave in CHAVES_OBRIGATORIAS if chave not in regra]
        if faltando:
            erros.append(f"regra {indice} sem as chaves: {faltando}")
        if regra.get("id") in vistos:
            erros.append(f"id repetido no cerebro: {regra.get('id')}")
        vistos.add(regra.get("id"))
    return erros


def montar_mundo(caso):
    """Mundo limpo por caso: um teste nunca herda bagunca do anterior."""
    shutil.rmtree(MUNDO, ignore_errors=True)
    pasta = MUNDO / caso["nome"]
    pasta.mkdir(parents=True)
    for nome in caso["antes"]:
        (pasta / nome).write_text("arquivo de teste\n", encoding="utf-8")


def rodar_casos(regras):
    """Aqui o agente e de verdade: mesmas funcoes, mesmo cerebro, mundo de mentirinha."""
    loop.RAIZ = MUNDO
    falhas = []
    for caso in CASOS:
        montar_mundo(caso)
        acao, alvo, regra = loop.decidir(loop.perceber())
        resultado = loop.agir(acao, alvo, regra)
        acertou_acao = acao == caso["acao_esperada"]
        esperado = caso.get("arquivo_esperado")
        acertou_disco = esperado is None or (MUNDO / caso["nome"] / esperado).exists()
        marca = "ok  " if (acertou_acao and acertou_disco) else "ERRO"
        print(f"  [{marca}] {caso['nome']:<11} -> {resultado}")
        if not (acertou_acao and acertou_disco):
            detalhes = []
            if not acertou_acao:
                detalhes.append(f"esperava acao '{caso['acao_esperada']}', veio '{acao}'")
            if not acertou_disco:
                detalhes.append(f"esperava o arquivo '{esperado}' existir no disco")
            falhas.append(f"{caso['nome']}: " + "; ".join(detalhes))
    print(f"  regras no cerebro: {len(regras)}")
    return falhas


if __name__ == "__main__":
    print("PORTAO DE TESTES do super-agente")
    print("mundo de mentirinha:", MUNDO)
    try:
        regras = ler_cerebro()
    except Exception as exc:
        print(f"  [ERRO] cerebro ilegivel: {exc}")
        raise SystemExit(1)
    erros = validar_formato(regras)
    for linha in erros:
        print("  [ERRO]", linha)
    falhas = rodar_casos(regras) if not erros else []
    for linha in falhas:
        print("  [FALHA]", linha)
    if erros or falhas:
        print(f"PORTAO FECHADO: {len(erros) + len(falhas)} problema(s). Nada roda em mundo real.")
        raise SystemExit(1)
    print("PORTAO ABERTO: cerebro valido e comportamento provado no disco.")