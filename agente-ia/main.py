"""
main.py -- Porta de entrada do seu agente de IA local.

Uso no terminal (dentro da pasta agente-ia):

    python main.py                    -> abre o chat com o agente
    python main.py treinar            -> treina a rede neural do zero
    python main.py perguntar "texto"  -> faz uma pergunta e sai
    python main.py fluxo bom_dia      -> executa uma automação
    python main.py fluxos             -> lista as automações
    python main.py servico            -> vigia gatilhos de horário/intervalo
    python main.py web --porta 8000   -> abre o painel no navegador
    python main.py ajuda              -> mostra esta lista

Comandos dentro do chat (digitando com a barra):
    /ajuda  /raio-x  /fatos  /esquecer chave  /fluxos  /treinar  /estado  /limpar  /sair
"""

import sys

# Garante que os módulos internos sejam encontrados não importa de onde você rode.
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agente import ferramentas, orquestrador  # noqa: E402
from agente.nucleo import NOME, VERSAO, Agente  # noqa: E402

PASTA_BASE = os.path.dirname(os.path.abspath(__file__))


# ---------------------------------------------------------------------------
def banner():
    print()
    print("=" * 62)
    print(f"  {NOME} v{VERSAO} -- seu agente de IA local")
    print("  Rede neural + memoria + ferramentas + automacao")
    print("  Sem API paga, sem Ollama, sem nuvem. Python puro.")
    print("=" * 62)


def ajuda():
    banner()
    print(
        """
COMO USAR (copie e cole no terminal):

  python main.py                      -> conversar com o agente
  python main.py treinar              -> treinar a rede neural de novo
  python main.py perguntar "quanto é 2+2"   -> uma pergunta só
  python main.py fluxos               -> lista as automações
  python main.py fluxo bom_dia        -> roda uma automação
  python main.py servico              -> liga o modo "vigia" (gatilhos)
  python main.py web --porta 8000     -> painel no navegador
  python main.py ajuda                -> esta ajuda

O QUE ELE FAZ:
  contas        -> "quanto é (25 * 4) + 10"
  arquivos      -> "salve uma nota chamada ideias.txt com: fazer um app"
  texto         -> "analise: <seu texto>", "resuma: <seu texto>"
  memória       -> "meu nome é ...", "o que você sabe sobre mim?"
  automação     -> "rode o fluxo bom_dia"
  criativo      -> "invente uma frase"
  conhecimento  -> "o que é backpropagation?", "como usar o terminal no VS Code?"
  recordações   -> "aprendeu?" mostra o estado da rede

DENTRO DO CHAT:
  /raio-x  mostra por que o agente decidiu cada rota
  /fatos   mostra tudo que ele lembra de você
  /treinar treina a rede na hora
  /sair    encerra
"""
    )


# ---------------------------------------------------------------------------
def modo_chat(agente: Agente, raio_x: bool = False):
    banner()
    fatos = agente.memoria.todos_os_fatos()
    nome = agente.memoria.recuperar("nome")
    if nome:
        print(f"  Bom te ver de novo, {nome}! (memória carregada)")
    if fatos:
        print(f"  Lembretes guardados: {len(fatos)}. Digite /fatos para ver.")
    print('  Dica: pergunte "o que você sabe fazer?" ou "quanto é 12 * 8".')
    print('  Para sair: escreva /sair\n')

    while True:
        try:
            texto = input("Você: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nAté logo!")
            break

        if not texto:
            continue

        # ---- comandos com barra ----
        if texto.startswith("/"):
            comando = texto[1:].lower().strip()

            if comando in ("sair", "exit", "quit"):
                print("Até logo! Seu histórico ficou salvo em dados/memoria.db")
                break

            if comando in ("ajuda", "help", "?"):
                print(
                    "  /ajuda          esta lista\n"
                    "  /raio-x         liga/desliga o raio-x da decisão\n"
                    "  /fatos          o que eu lembro de você\n"
                    "  /esquecer x     apago o fato 'x' da memória\n"
                    "  /fluxos         lista as automações\n"
                    "  /estado         estado da rede e do projeto\n"
                    "  /treinar        treina a rede agora\n"
                    "  /limpar         limpa a tela\n"
                    "  /sair           encerra"
                )
                continue

            if comando == "raio-x":
                raio_x = not raio_x
                print(f"  Raio-x: {'LIGADO' if raio_x else 'desligado'}")
                continue

            if comando == "fatos":
                lista = agente.memoria.todos_os_fatos()
                if not lista:
                    print("  (ainda não sei nada sobre você)")
                for chave, valor in lista:
                    print(f"  - {chave}: {valor}")
                continue

            if comando.startswith("esquecer"):
                chave = comando.replace("esquecer", "").strip()
                if agente.memoria.esquecer(chave):
                    print(f"  Esqueci '{chave}'.")
                else:
                    print(f"  Não tinha nada guardado em '{chave}'.")
                continue

            if comando == "fluxos":
                print(orquestrador.listar_fluxos(agente.pasta_dados))
                continue

            if comando == "estado":
                print(agente.estatisticas_como_texto())
                continue

            if comando == "treinar":
                agente.treinar()
                continue

            if comando == "limpar":
                os.system("cls" if os.name == "nt" else "clear")
                banner()
                continue

            print(f"  Não conheço o comando /{comando}. Digite /ajuda")
            continue

        # ---- conversa normal ----
        resultado = agente.responder(texto, raio_x=raio_x)
        print(f"\n{NOME}: {resultado['resposta']}\n")
        print(f"   [rota: {resultado['rota']} | confiança: {resultado['confianca']} "
              f"| {resultado['tempo_ms']} ms]", end="")
        if raio_x:
            print(f"\n   [decisão] {resultado['detalhe_da_decisao']}")
            if resultado["ranking_intencoes"]:
                print(f"   [intenções] {resultado['ranking_intencoes']}")
        else:
            print()
        print()


# ---------------------------------------------------------------------------
def main():
    argumentos = sys.argv[1:]
    comando = argumentos[0].lower() if argumentos else "chat"

    if comando in ("ajuda", "-h", "--help", "help"):
        ajuda()
        return

    if comando == "web":
        porta = 8000
        if "--porta" in argumentos:
            try:
                porta = int(argumentos[argumentos.index("--porta") + 1])
            except (IndexError, ValueError):
                porta = 8000
        from agente.web import iniciar

        iniciar(porta=porta)
        return

    if comando == "servico":
        agente = Agente(PASTA_BASE)
        if "uma-vez" in argumentos:
            orquestrador.modo_servico(agente.pasta_dados, rodar_uma_vez=True)
        else:
            orquestrador.modo_servico(agente.pasta_dados)
        return

    agente = Agente(PASTA_BASE)

    if comando == "treinar":
        print("\nTreinando a rede neural do zero...\n")
        resumo = agente.treinar()
        print("\nResumo do treino:")
        for chave, valor in resumo.items():
            print(f"  {chave}: {valor}")
        print("\nVocê pode treinar quantas vezes quiser: o cérebro é sobrescrito.\n")

    elif comando in ("perguntar", "ask") and len(argumentos) > 1:
        pergunta = " ".join(argumentos[1:])
        resultado = agente.responder(pergunta, raio_x=True)
        print(f"\nVocê: {pergunta}")
        print(f"{NOME}: {resultado['resposta']}\n")
        print(f"[rota: {resultado['rota']} | confiança: {resultado['confianca']} "
              f"| decisão: {resultado['detalhe_da_decisao']}]\n")

    elif comando in ("fluxos", "fluxo"):
        if comando == "fluxos":
            print(orquestrador.listar_fluxos(agente.pasta_dados))
        else:
            nome = argumentos[1] if len(argumentos) > 1 else ""
            fluxo = orquestrador.buscar_fluxo(agente.pasta_dados, nome) if nome else None
            if not fluxo:
                print(orquestrador.listar_fluxos(agente.pasta_dados))
                print('\nUse: python main.py fluxo NOME_DO_FLUXO')
            else:
                orquestrador.executar_fluxo(fluxo)

    elif comando in ("diagnostico", "diagnóstico"):
        # Mostra quais exemplos de treino a rede ainda erra (ótimo para aprender!)
        exemplos = agente._ler_exemplos()
        print("\nDiagnóstico da rede neural\n" + "-" * 40)
        falhas = 0
        for exemplo in exemplos:
            vetor = agente.vetorizador.transformar(exemplo["texto"])
            probabilidades = agente.rede.prever(vetor)
            palpite = agente.rede.classes[probabilidades.index(max(probabilidades))]
            if palpite != exemplo["intencao"]:
                falhas += 1
                print(f"  errou: {exemplo['texto']!r} | esperado: {exemplo['intencao']} "
                      f"| palpite: {palpite} ({max(probabilidades):.0%})")
        acertos = (len(exemplos) - falhas) / max(1, len(exemplos))
        print(f"\n  Acertos no treino: {acertos:.1%} ({len(exemplos) - falhas}/{len(exemplos)})")
        if falhas:
            print("  Dica: adicione mais exemplos nas intenções que erram, "
                  "ou apague exemplos repetidos com intenções diferentes.")
        else:
            print("  Perfeito! A rede aprendeu todos os exemplos.")
        print()

    elif comando in ("estado", "status"):
        print(agente.estatisticas_como_texto())

    else:
        raio_x = "--raio-x" in argumentos or "raiox" in argumentos
        modo_chat(agente, raio_x=raio_x)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nEncerrado pelo teclado. Até a próxima!")
