# -*- coding: utf-8 -*-
"""Portão da evolução governada: primitivas das 75 ideias, sem tocar no PC."""

import json
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))
from agente import evolucao


falhas = []


def prova(nome, condicao):
    print("  [%s] %s" % ("ok  " if condicao else "FALHA", nome))
    if not condicao:
        falhas.append(nome)


print("PORTAO DE EVOLUCAO GOVERNADA")

matriz = evolucao.auditar_matriz_ideias()
prova("matriz cobre exatamente as 75 ideias sem ids repetidos", matriz["ok"])

with tempfile.TemporaryDirectory() as temporario:
    raiz = Path(temporario)
    skill = {
        "id": "capturar-notas",
        "version": 1,
        "description": "Captura uma nota para a entrada interna",
        "triggers": ["nota"],
        "capabilities": ["copiar_para_projeto", "avisar"],
        "steps": [
            {"usar": "copiar_para_projeto", "para": "entrada/notas"},
            {"usar": "avisar", "texto": "nota recebida"},
        ],
        "tests": [{"id": "nota-pdf", "expected": "fila ou copia interna"}],
        "approved_by_human": False,
        "tests_passed": False,
    }
    invalida = dict(skill)
    invalida["codigo"] = "print('nao pode')"
    prova("skill com codigo executavel e recusada", bool(evolucao.validar_skill(invalida)))
    caminho_skill = evolucao.registrar_skill(raiz, skill)
    carregadas = evolucao.carregar_skills(raiz)
    aprovadas = evolucao.carregar_skills(raiz, apenas_aprovadas=True)
    prova("skill declarativa e persistida como rascunho", caminho_skill.exists() and len(carregadas) == 1 and not aprovadas)

    capacidades = {
        "copiar_para_projeto": {"enabled": True, "requires_human": False},
        "avisar": {"enabled": True, "requires_human": False},
        "abrir": {"enabled": True, "requires_human": True},
    }
    plano = evolucao.simular_plano(skill["steps"], capacidades)
    prova("world model simula sem tocar em disco externo", plano["ok"] and plano["mundo"]["arquivos"])

    tomb = raiz / "memoria" / "tombstones.jsonl"
    evolucao.registrar_tombstone(tomb, "recusar", "sem teste", "capturar-notas")
    evolucao.registrar_tombstone(tomb, "aguardar", "humano não aprovou", "capturar-notas")
    prova("tombstones formam cadeia append-only verificável", evolucao.verificar_tombstones(tomb)["ok"])

    claims = raiz / "memoria" / "claims.jsonl"
    evolucao.registrar_claim(claims, "arquivo seguro", "teste-a", 0.8, ["a"])
    evolucao.registrar_claim(claims, "arquivo não seguro", "teste-b", 0.6, ["b"])
    lidos = [json.loads(linha) for linha in claims.read_text(encoding="utf-8").splitlines()]
    prova("claim ledger preserva timestamp, fonte e hash", all(item.get("hash") and item.get("source") for item in lidos))
    prova("contradiction mining encontra afirmações opostas", bool(evolucao.encontrar_contradicoes(lidos)))
    prova("triangulação recusa uma fonte e aceita duas", not evolucao.exigir_triangulacao(["a"]) and evolucao.exigir_triangulacao(["a", "b"]))

    antes = datetime.now() - timedelta(days=14)
    memorias = [{"id": "importante", "timestamp": datetime.now().isoformat(), "text": "não perder", "salience": 1.0},
                {"id": "velha", "timestamp": antes.isoformat(), "text": "pode resumir", "salience": 1.0}]
    decaidas = evolucao.decair_memorias(memorias)
    comprimidas = evolucao.comprimir_memorias(memorias, limite=1)
    prova("esquecimento decai por meia-vida e compressão preserva saliência", decaidas[0]["id"] == "importante" and comprimidas["comprimidas"] == 1)

    prova("Bayes atualiza crença sem modelo externo", evolucao.atualizar_crenca(0.5, True) > 0.5)
    media, variancia = evolucao.atualizar_kalman_1d(0.0, 1.0, 10.0, 1.0)
    prova("Kalman 1D atualiza média e reduz variância", media == 5.0 and variancia == 0.5)

    prova("solver exato aceita aritmética e rejeita código", evolucao.resolver_expressao_exata("(2 + 3) * 4") == 20)
    try:
        evolucao.resolver_expressao_exata("__import__('os').system('x')")
        solver_bloqueou = False
    except Exception:
        solver_bloqueou = True
    prova("solver exato bloqueia chamada perigosa", solver_bloqueou)

    passport = evolucao.capability_passport("captura", ["copiar_para_projeto"], ["entrada"], True, ["write_internal"])
    saida = evolucao.validar_saida_ferramenta("ok")
    prova("capability passport e saída zero-trust são auditáveis", passport["requires_human"] and saida["ok"])

    tokens = evolucao.criar_honeytokens(["decoy"], 2)
    prova("honeytokens falsos detectam extração", len(tokens) == 2 and evolucao.detectar_honeytoken(tokens[0], tokens) == [tokens[0]])
    prova("red-team marca injeção e traversal", evolucao.red_team_check("executar:python --version && ..\\fora")["blocked"])
    prova("fuzz e chaos têm cenários determinísticos", len(evolucao.gerar_fuzz_inputs()) >= 8 and len(evolucao.chaos_cenarios()) >= 4)
    prova("invariantes e grafo causal funcionam", evolucao.validar_invariantes({"ok": True}, [lambda x: x["ok"]])["ok"] and "a" in evolucao.grafo_causal([["a", "b"]]))

    candidatos = [{"id": "a", "answer": "sim", "score": 0.8},
                  {"id": "b", "answer": "sim", "score": 0.7},
                  {"id": "c", "answer": "não", "score": 0.6}]
    voto = evolucao.maioria(candidatos)
    melhor = evolucao.best_of_n(candidatos)
    prova("best-of-N e maioria expõem desacordo", voto["winner"] == "sim" and melhor["winner"]["id"] == "a")
    caminhos = evolucao.beam_search(0, lambda x: [x + 1, x + 2], lambda x: float(x), 2, 2)
    prova("beam search percorre planos limitados", caminhos and max(caminhos) >= 3)
    prova("canary probes e recompensa de processo", evolucao.canary_probes([lambda: True])["ok"] and evolucao.recompensa_processo([{"ok": True}, {"ok": False}]) == -0.5)

    snap_a = evolucao.snapshot_comportamento({"a": 1}, "a")
    snap_b = evolucao.snapshot_comportamento({"a": 2}, "b")
    diff = evolucao.diff_semantico(snap_a["behavior"], snap_b["behavior"])
    regressao = evolucao.avaliar_regressao([{"id": "x", "before": 1, "after": 0}], snap_a, snap_b)
    prova("snapshot, diff semântico e regressão detectam queda", diff["changed"] and not regressao["ok"])

    cache = evolucao.CacheSemantico()
    cache.guardar("organizar meus PDFs", {"skill": "capturar-notas"})
    prova("cache hierárquico acha exato e aproximado", cache.buscar("organizar meus PDFs")["kind"] == "exact" and cache.buscar("organizar meus PDF")["hit"])
    calibracao = evolucao.calibrar_confianca([{"confidence": 0.9, "correct": True}, {"confidence": 0.9, "correct": False}])
    prova("calibração expõe confiança sem garantia", calibracao["ece"] is not None)

    ambiente = evolucao.auditar_ambiente(Path(__file__).resolve().parent.parent)
    prova("auditoria do ambiente reconhece portão, raio e B15", ambiente["existing_primitives"]["portao"] and ambiente["existing_primitives"]["raio"] and ambiente["existing_primitives"]["experience"])

print("ideias catalogadas:", len(evolucao.IDEIAS))
if falhas:
    print("PORTAO DE EVOLUCAO FECHADO:", ", ".join(falhas))
    raise SystemExit(1)
print("PORTAO DE EVOLUCAO ABERTO: matriz, skills, memória, segurança, raciocínio e avaliação governados.")
