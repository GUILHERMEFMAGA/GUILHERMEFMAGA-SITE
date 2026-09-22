# -*- coding: utf-8 -*-
"""Laboratório de evolução governada do super-agente.

Este módulo transforma as 75 ideias do roteiro em primitivas locais,
determinísticas e auditáveis. Ele NÃO executa código gerado, NÃO roda Git,
NÃO promove alteração sozinho e NÃO usa API, LLM ou pacote externo.

A fronteira é deliberada:
    proposta -> validação -> ensaio virtual -> avaliação -> aprovação humana

"Skill executável" neste projeto significa um manifesto declarativo de passos
já conhecidos pelo motor. Código Python escrito em runtime é rejeitado.
"Raciocínio" significa trace operacional (entradas, passos, regras, provas),
nunca uma promessa de cadeia de pensamento privada.
"""

from __future__ import annotations

import ast
import hashlib
import json
import math
import re
import time
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Callable, Iterable, Mapping, Sequence


VERSAO_EVOLUCAO = "1.0-governada"
VOCABULARIO_SKILL = {"copiar_para_projeto", "abrir", "avisar", "executar"}
CHAVES_CODIGO_PROIBIDAS = {
    "codigo", "código", "source", "fonte_python", "python", "script",
    "modulo", "módulo", "eval", "exec", "comando_livre", "shell",
}

# Matriz explícita: nenhuma ideia fica escondida dentro de uma função genérica.
# Status: existente, parcial, proposta, adaptada ou incompatível.
IDEIAS = [
    {"id": 1, "nome": "skill_library", "status": "parcial", "pacote": "skills"},
    {"id": 2, "nome": "runtime_tools", "status": "adaptada", "pacote": "skills"},
    {"id": 3, "nome": "self_generated_curriculum", "status": "proposta", "pacote": "curriculo"},
    {"id": 4, "nome": "adversarial_self_play", "status": "proposta", "pacote": "avaliacao"},
    {"id": 5, "nome": "constitutional_self_amendment", "status": "parcial", "pacote": "governanca"},
    {"id": 6, "nome": "cron_autonomy", "status": "adaptada", "pacote": "cron"},
    {"id": 7, "nome": "tombstones", "status": "proposta", "pacote": "proveniencia"},
    {"id": 8, "nome": "counterfactual_self_test", "status": "proposta", "pacote": "versionamento"},
    {"id": 9, "nome": "behavior_versioning", "status": "parcial", "pacote": "versionamento"},
    {"id": 10, "nome": "inference_time_compute", "status": "adaptada", "pacote": "raciocinio"},
    {"id": 11, "nome": "best_of_n", "status": "proposta", "pacote": "raciocinio"},
    {"id": 12, "nome": "beam_search_reasoning", "status": "proposta", "pacote": "raciocinio"},
    {"id": 13, "nome": "process_reward", "status": "parcial", "pacote": "avaliacao"},
    {"id": 14, "nome": "speculative_reasoning", "status": "adaptada", "pacote": "avaliacao"},
    {"id": 15, "nome": "canary_probes", "status": "adaptada", "pacote": "avaliacao"},
    {"id": 16, "nome": "world_model", "status": "parcial", "pacote": "simulacao"},
    {"id": 17, "nome": "internal_debate", "status": "proposta", "pacote": "avaliacao"},
    {"id": 18, "nome": "ensemble_disagreement", "status": "proposta", "pacote": "raciocinio"},
    {"id": 19, "nome": "forgetting_curve", "status": "parcial", "pacote": "memoria"},
    {"id": 20, "nome": "salience_compression", "status": "proposta", "pacote": "memoria"},
    {"id": 21, "nome": "operational_traces", "status": "parcial", "pacote": "observabilidade"},
    {"id": 22, "nome": "claim_ledger", "status": "proposta", "pacote": "proveniencia"},
    {"id": 23, "nome": "contradiction_mining", "status": "proposta", "pacote": "proveniencia"},
    {"id": 24, "nome": "belief_update", "status": "proposta", "pacote": "proveniencia"},
    {"id": 25, "nome": "source_triangulation", "status": "proposta", "pacote": "proveniencia"},
    {"id": 26, "nome": "exact_solver", "status": "parcial", "pacote": "neurosimbolico"},
    {"id": 27, "nome": "generated_artifact_verification", "status": "adaptada", "pacote": "seguranca"},
    {"id": 28, "nome": "property_testing", "status": "proposta", "pacote": "resiliencia"},
    {"id": 29, "nome": "interface_fuzzing", "status": "proposta", "pacote": "resiliencia"},
    {"id": 30, "nome": "chaos_testing", "status": "proposta", "pacote": "resiliencia"},
    {"id": 31, "nome": "causal_graph", "status": "proposta", "pacote": "neurosimbolico"},
    {"id": 32, "nome": "auto_red_team", "status": "adaptada", "pacote": "seguranca"},
    {"id": 33, "nome": "honeytokens", "status": "proposta", "pacote": "seguranca"},
    {"id": 34, "nome": "zero_trust_outputs", "status": "parcial", "pacote": "seguranca"},
    {"id": 35, "nome": "capability_passports", "status": "proposta", "pacote": "seguranca"},
    {"id": 36, "nome": "uncertainty_traces", "status": "parcial", "pacote": "observabilidade"},
    {"id": 37, "nome": "confidence_probe", "status": "proposta", "pacote": "observabilidade"},
    {"id": 38, "nome": "influence_trace", "status": "parcial", "pacote": "proveniencia"},
    {"id": 39, "nome": "semantic_behavior_diff", "status": "proposta", "pacote": "versionamento"},
    {"id": 40, "nome": "local_cost_telemetry", "status": "adaptada", "pacote": "observabilidade"},
    {"id": 41, "nome": "kv_cache", "status": "incompativel", "pacote": "modelos_grandes"},
    {"id": 42, "nome": "speculative_decoding", "status": "incompativel", "pacote": "modelos_grandes"},
    {"id": 43, "nome": "semantic_cache", "status": "proposta", "pacote": "contexto"},
    {"id": 44, "nome": "self_distillation", "status": "incompativel", "pacote": "modelos_grandes"},
    {"id": 45, "nome": "quantization_optimization", "status": "incompativel", "pacote": "modelos_grandes"},
    {"id": 46, "nome": "evaluation_is_moat", "status": "existente", "pacote": "avaliacao"},
    {"id": 47, "nome": "rlaif", "status": "incompativel", "pacote": "modelos_grandes"},
    {"id": 48, "nome": "data_quality", "status": "parcial", "pacote": "curriculo"},
    {"id": 49, "nome": "synthetic_data", "status": "adaptada", "pacote": "curriculo"},
    {"id": 50, "nome": "rejection_sampling", "status": "adaptada", "pacote": "avaliacao"},
    {"id": 51, "nome": "constitutional_ai", "status": "parcial", "pacote": "governanca"},
    {"id": 52, "nome": "post_training", "status": "incompativel", "pacote": "modelos_grandes"},
    {"id": 53, "nome": "secret_system_prompt", "status": "incompativel", "pacote": "governanca"},
    {"id": 54, "nome": "context_engineering", "status": "parcial", "pacote": "contexto"},
    {"id": 55, "nome": "prompt_compilation", "status": "incompativel", "pacote": "modelos_grandes"},
    {"id": 56, "nome": "anti_sycophancy", "status": "proposta", "pacote": "avaliacao"},
    {"id": 57, "nome": "confidence_calibration", "status": "parcial", "pacote": "observabilidade"},
    {"id": 58, "nome": "model_routing", "status": "adaptada", "pacote": "contexto"},
    {"id": 59, "nome": "local_cascade", "status": "parcial", "pacote": "contexto"},
    {"id": 60, "nome": "negative_data", "status": "parcial", "pacote": "curriculo"},
    {"id": 61, "nome": "adversarial_preferences", "status": "proposta", "pacote": "avaliacao"},
    {"id": 62, "nome": "synthetic_personas", "status": "adaptada", "pacote": "avaliacao"},
    {"id": 63, "nome": "explicit_ab_testing", "status": "proposta", "pacote": "versionamento"},
    {"id": 64, "nome": "test_time_search", "status": "proposta", "pacote": "raciocinio"},
    {"id": 65, "nome": "model_dialogue", "status": "incompativel", "pacote": "modelos_grandes"},
    {"id": 66, "nome": "tool_traces", "status": "parcial", "pacote": "observabilidade"},
    {"id": 67, "nome": "failure_analysis", "status": "existente", "pacote": "avaliacao"},
    {"id": 68, "nome": "curriculum_order", "status": "proposta", "pacote": "curriculo"},
    {"id": 69, "nome": "distillation", "status": "incompativel", "pacote": "modelos_grandes"},
    {"id": 70, "nome": "emergent_behavior_monitor", "status": "proposta", "pacote": "observabilidade"},
    {"id": 71, "nome": "automated_safety_attacks", "status": "adaptada", "pacote": "seguranca"},
    {"id": 72, "nome": "trace_dataset", "status": "parcial", "pacote": "curriculo"},
    {"id": 73, "nome": "local_flywheel", "status": "parcial", "pacote": "curriculo"},
    {"id": 74, "nome": "private_eval_suite", "status": "adaptada", "pacote": "avaliacao"},
    {"id": 75, "nome": "curation_over_scale", "status": "parcial", "pacote": "curriculo"},
]


class EvolucaoError(ValueError):
    """Erro de contrato: a proposta não é segura ou não é verificável."""


def agora_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _json_canonico(valor: Any) -> str:
    return json.dumps(valor, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _hash(valor: Any) -> str:
    return hashlib.sha256(_json_canonico(valor).encode("utf-8")).hexdigest()


def _escrever_json_atomico(caminho: Path, valor: Any) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    parcial = caminho.with_name(caminho.name + ".part")
    with parcial.open("w", encoding="utf-8") as arquivo:
        json.dump(valor, arquivo, ensure_ascii=False, indent=2)
        arquivo.flush()
        # fsync é deliberado: evolução não pode deixar manifesto pela metade.
        import os
        os.fsync(arquivo.fileno())
    parcial.replace(caminho)


def _ler_json(caminho: Path, padrao: Any) -> Any:
    try:
        return json.loads(caminho.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return padrao


def matriz_ideias() -> list:
    return [dict(item) for item in IDEIAS]


def auditar_matriz_ideias() -> dict:
    ids = [item["id"] for item in IDEIAS]
    repetidos = sorted({item for item in ids if ids.count(item) > 1})
    ausentes = sorted(set(range(1, 76)) - set(ids))
    return {
        "total": len(ids),
        "ids_unicos": len(set(ids)),
        "repetidos": repetidos,
        "ausentes": ausentes,
        "ok": len(ids) == 75 and not repetidos and not ausentes,
    }


def resumo_ideias() -> dict:
    por_status = Counter(item["status"] for item in IDEIAS)
    por_pacote = Counter(item["pacote"] for item in IDEIAS)
    return {"total": len(IDEIAS), "status": dict(sorted(por_status.items())),
            "pacotes": dict(sorted(por_pacote.items())), "matriz": auditar_matriz_ideias()}


# ---------------------------------------------------------------------------
# Skills declarativas: biblioteca reutilizável, sem código gerado.


def _chaves_proibidas(valor: Any, caminho: str = "") -> list:
    achados = []
    if isinstance(valor, Mapping):
        for chave, filho in valor.items():
            nome = str(chave).lower()
            if nome in CHAVES_CODIGO_PROIBIDAS:
                achados.append(caminho + "." + str(chave))
            achados.extend(_chaves_proibidas(filho, caminho + "." + str(chave)))
    elif isinstance(valor, list):
        for indice, filho in enumerate(valor):
            achados.extend(_chaves_proibidas(filho, caminho + "[" + str(indice) + "]"))
    return achados


def validar_skill(skill: Mapping[str, Any]) -> list:
    erros = []
    if not isinstance(skill, Mapping):
        return ["skill precisa ser objeto JSON"]
    for campo in ("id", "version", "description", "capabilities", "steps", "tests"):
        if campo not in skill:
            erros.append("campo ausente: " + campo)
    identificador = str(skill.get("id", ""))
    if not re.fullmatch(r"[a-z0-9][a-z0-9_-]{2,63}", identificador):
        erros.append("id precisa ser slug minúsculo de 3 a 64 caracteres")
    if _chaves_proibidas(skill):
        erros.append("skill contém código executável; apenas manifesto declarativo é aceito")
    capacidades = skill.get("capabilities", [])
    if not isinstance(capacidades, list) or not capacidades:
        erros.append("capabilities precisa ser lista não vazia")
    passos = skill.get("steps", [])
    if not isinstance(passos, list) or not passos:
        erros.append("steps precisa ser lista não vazia")
    for indice, passo in enumerate(passos if isinstance(passos, list) else []):
        if not isinstance(passo, Mapping):
            erros.append("steps[%d] precisa ser objeto" % indice)
            continue
        usar = str(passo.get("usar", "")).strip().lower()
        if usar not in VOCABULARIO_SKILL:
            erros.append("steps[%d] usa verbo fora da coleira: %s" % (indice, usar or "?"))
        destino = str(passo.get("para", ""))
        if usar == "copiar_para_projeto" and (not destino or ".." in destino or destino.startswith(("/", "\\"))):
            erros.append("steps[%d] tem destino fora do projeto" % indice)
        if usar == "executar" and not str(passo.get("comando", "")).strip():
            erros.append("steps[%d] executar precisa de comando que será conferido pela coleira" % indice)
    testes = skill.get("tests", [])
    if not isinstance(testes, list) or not testes:
        erros.append("tests precisa conter ao menos uma cena")
    return erros


def skill_aprovada(skill: Mapping[str, Any]) -> bool:
    return not validar_skill(skill) and bool(skill.get("approved_by_human")) and bool(skill.get("tests_passed"))


def registrar_skill(raiz: Path, skill: Mapping[str, Any]) -> Path:
    erros = validar_skill(skill)
    if erros:
        raise EvolucaoError("skill recusada: " + "; ".join(erros))
    destino = raiz / "fluxos" / "skills" / (str(skill["id"]) + ".json")
    pacote = dict(skill)
    pacote.setdefault("status", "rascunho")
    pacote["registrada_em"] = pacote.get("registrada_em", agora_iso())
    pacote["manifest_hash"] = _hash(pacote)
    _escrever_json_atomico(destino, pacote)
    return destino


def carregar_skills(raiz: Path, apenas_aprovadas: bool = False) -> list:
    pasta = raiz / "fluxos" / "skills"
    resultado = []
    for caminho in sorted(pasta.glob("*.json")) if pasta.exists() else []:
        skill = _ler_json(caminho, {})
        if not isinstance(skill, dict) or validar_skill(skill):
            continue
        if apenas_aprovadas and not skill_aprovada(skill):
            continue
        resultado.append(skill)
    return resultado


def selecionar_skill(skills: Iterable[Mapping[str, Any]], gatilho: str) -> list:
    pedido = str(gatilho).strip().lower()
    escolhidas = []
    for skill in skills:
        if not skill_aprovada(skill):
            continue
        gatilhos = [str(x).lower() for x in skill.get("triggers", [])]
        if any(x in pedido for x in gatilhos):
            escolhidas.append(dict(skill))
    return escolhidas


# ---------------------------------------------------------------------------
# Currículo, avaliação, votação e planejamento.


def detectar_fraquezas(resultados: Iterable[Mapping[str, Any]], limite: float = 0.75) -> list:
    grupos = defaultdict(list)
    for resultado in resultados:
        tags = resultado.get("tags") or ["geral"]
        score = float(resultado.get("score", 1.0 if resultado.get("ok") else 0.0))
        for tag in tags:
            grupos[str(tag)].append(score)
    saida = []
    for tag, valores in grupos.items():
        media = sum(valores) / len(valores)
        if media < limite:
            saida.append({"tag": tag, "media": round(media, 3), "amostras": len(valores)})
    return sorted(saida, key=lambda item: (item["media"], item["tag"]))


def gerar_curriculo(resultados: Iterable[Mapping[str, Any]], exercicios: Iterable[Mapping[str, Any]]) -> list:
    fracos = {item["tag"] for item in detectar_fraquezas(resultados)}
    candidatos = []
    for exercicio in exercicios:
        tags = {str(tag) for tag in exercicio.get("tags", [])}
        if tags & fracos:
            candidatos.append(dict(exercicio))
    return sorted(candidatos, key=lambda item: (int(item.get("difficulty", 0)), str(item.get("id", ""))))


def recompensa_processo(etapas: Iterable[Mapping[str, Any]]) -> float:
    total = 0.0
    for etapa in etapas:
        if etapa.get("ok"):
            total += float(etapa.get("reward", 0.5))
        else:
            total += float(etapa.get("penalty", -1.0))
    return round(total, 4)


def maioria(candidatos: Sequence[Mapping[str, Any]], campo: str = "answer") -> dict:
    votos = Counter(str(item.get(campo, "")) for item in candidatos)
    if not votos:
        return {"winner": None, "votes": {}, "agreement": 0.0, "uncertain": True}
    maior = max(votos.values())
    vencedores = sorted(valor for valor, quantidade in votos.items() if quantidade == maior)
    total = sum(votos.values())
    return {"winner": vencedores[0] if len(vencedores) == 1 else None,
            "votes": dict(votos), "agreement": round(maior / total, 3),
            "uncertain": len(vencedores) != 1 or maior / total < 0.6}


def best_of_n(candidatos: Sequence[Mapping[str, Any]], campo_score: str = "score") -> dict:
    if not candidatos:
        return {"winner": None, "uncertain": True}
    ordenados = sorted(candidatos, key=lambda item: (-float(item.get(campo_score, 0)), str(item.get("id", ""))))
    melhor = ordenados[0]
    empate = len(ordenados) > 1 and float(ordenados[1].get(campo_score, 0)) == float(melhor.get(campo_score, 0))
    return {"winner": dict(melhor), "uncertain": empate, "candidates": len(ordenados)}


def beam_search(inicial: Any, expandir: Callable[[Any], Iterable[Any]], pontuar: Callable[[Any], float], largura: int = 3, profundidade: int = 3) -> list:
    if largura < 1 or profundidade < 1:
        raise ValueError("largura e profundidade precisam ser positivas")
    fronteira = [(pontuar(inicial), inicial)]
    visitados = set()
    for _ in range(profundidade):
        candidatos = []
        for _, estado in fronteira:
            chave = repr(estado)
            if chave in visitados:
                continue
            visitados.add(chave)
            for proximo in expandir(estado):
                candidatos.append((pontuar(proximo), proximo))
        fronteira = sorted(candidatos, key=lambda par: (-par[0], repr(par[1])))[:largura]
        if not fronteira:
            break
    return [estado for _, estado in fronteira]


def canary_probes(provas: Iterable[Callable[[], Any]]) -> dict:
    resultados = []
    for indice, prova in enumerate(provas):
        inicio = time.perf_counter()
        try:
            valor = prova()
            resultados.append({"id": indice, "ok": bool(valor), "ms": round((time.perf_counter() - inicio) * 1000, 3)})
        except Exception as erro:
            resultados.append({"id": indice, "ok": False, "erro": type(erro).__name__, "ms": round((time.perf_counter() - inicio) * 1000, 3)})
    return {"ok": bool(resultados) and all(item["ok"] for item in resultados), "probes": resultados}


def simular_plano(plano: Iterable[Mapping[str, Any]], capacidades: Mapping[str, Mapping[str, Any]]) -> dict:
    mundo = {"arquivos": set(), "avisos": [], "fila": [], "passos": []}
    erros = []
    for indice, passo in enumerate(plano):
        usar = str(passo.get("usar", "")).lower()
        cap = capacidades.get(usar, {})
        if usar not in VOCABULARIO_SKILL or not cap.get("enabled", False):
            erros.append("passo %d: capacidade não autorizada %s" % (indice, usar or "?"))
            continue
        if cap.get("requires_human"):
            mundo["fila"].append(dict(passo))
            resultado = "fila humana"
        elif usar == "copiar_para_projeto":
            nome = str(passo.get("arquivo", "arquivo"))
            mundo["arquivos"].add(str(passo.get("para", "entrada")) + "/" + nome)
            resultado = "simulado: cópia interna"
        elif usar == "avisar":
            mundo["avisos"].append(str(passo.get("texto", "")))
            resultado = "simulado: aviso"
        else:
            resultado = "simulado: " + usar
        mundo["passos"].append({"indice": indice, "usar": usar, "resultado": resultado})
    mundo["arquivos"] = sorted(mundo["arquivos"])
    return {"ok": not erros, "erros": erros, "mundo": mundo}


# ---------------------------------------------------------------------------
# Memória, tombstones, claims, crenças e proveniência.


def decair_memorias(memorias: Iterable[Mapping[str, Any]], agora: datetime | None = None, meia_vida_dias: float = 14.0) -> list:
    agora = agora or datetime.now()
    if meia_vida_dias <= 0:
        raise ValueError("meia_vida_dias precisa ser positiva")
    resultado = []
    for memoria in memorias:
        try:
            quando = datetime.fromisoformat(str(memoria["timestamp"]))
            idade = max(0.0, (agora - quando).total_seconds() / 86400.0)
            peso = float(memoria.get("salience", 1.0)) * (0.5 ** (idade / meia_vida_dias))
        except (KeyError, TypeError, ValueError):
            continue
        item = dict(memoria)
        item["decayed_weight"] = round(peso, 6)
        resultado.append(item)
    return sorted(resultado, key=lambda item: (-item["decayed_weight"], str(item.get("id", ""))))


def comprimir_memorias(memorias: Iterable[Mapping[str, Any]], limite: int = 20) -> dict:
    ordenadas = decair_memorias(memorias)
    intactas = ordenadas[:max(0, limite)]
    resumidas = ordenadas[max(0, limite):]
    resumo = "; ".join(str(item.get("text", ""))[:120] for item in resumidas if item.get("text"))
    return {"intactas": intactas, "resumo_irrelevante": resumo, "comprimidas": len(resumidas)}


def registrar_trace(caminho: Path, trace: Mapping[str, Any]) -> dict:
    item = dict(trace)
    item.setdefault("timestamp", agora_iso())
    item["trace_hash"] = _hash(item)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    with caminho.open("a", encoding="utf-8") as arquivo:
        arquivo.write(json.dumps(item, ensure_ascii=False, sort_keys=True) + "\n")
    return item


def registrar_tombstone(caminho: Path, decisao: str, motivo: str, alvo: str, fonte: str = "humano") -> dict:
    anterior = "GENESIS"
    if caminho.exists():
        try:
            ultima = [linha for linha in caminho.read_text(encoding="utf-8").splitlines() if linha][-1]
            anterior = json.loads(ultima).get("hash", anterior)
        except (OSError, json.JSONDecodeError, IndexError):
            raise EvolucaoError("tombstone ilegível: não vou continuar a cadeia")
    item = {"timestamp": agora_iso(), "decision": str(decisao), "reason": str(motivo),
            "target": str(alvo), "source": str(fonte), "previous_hash": anterior}
    item["hash"] = _hash(item)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    with caminho.open("a", encoding="utf-8") as arquivo:
        arquivo.write(json.dumps(item, ensure_ascii=False, sort_keys=True) + "\n")
    return item


def verificar_tombstones(caminho: Path) -> dict:
    anterior = "GENESIS"
    total = 0
    erros = []
    try:
        linhas = [linha for linha in caminho.read_text(encoding="utf-8").splitlines() if linha]
    except FileNotFoundError:
        return {"ok": True, "total": 0, "erros": []}
    for numero, linha in enumerate(linhas, 1):
        try:
            item = json.loads(linha)
            esperado = item.get("hash")
            sem_hash = dict(item)
            sem_hash.pop("hash", None)
            if item.get("previous_hash") != anterior or esperado != _hash(sem_hash):
                erros.append("linha %d: cadeia ou hash inválido" % numero)
            anterior = esperado
            total += 1
        except json.JSONDecodeError:
            erros.append("linha %d: JSON inválido" % numero)
    return {"ok": not erros, "total": total, "erros": erros}


def registrar_claim(caminho: Path, texto: str, fonte: str, confianca: float, evidencias: Sequence[str]) -> dict:
    if not 0.0 <= float(confianca) <= 1.0:
        raise ValueError("confianca precisa estar entre 0 e 1")
    item = {"timestamp": agora_iso(), "claim": str(texto), "source": str(fonte),
            "confidence": round(float(confianca), 4), "evidence": list(evidencias)}
    item["hash"] = _hash(item)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    with caminho.open("a", encoding="utf-8") as arquivo:
        arquivo.write(json.dumps(item, ensure_ascii=False, sort_keys=True) + "\n")
    return item


def encontrar_contradicoes(claims: Iterable[Mapping[str, Any]]) -> list:
    grupos = defaultdict(list)
    for claim in claims:
        chave = re.sub(r"\s+", " ", str(claim.get("claim", "")).strip().lower())
        chave = re.sub(r"\b(não|nao)\b", "", chave)
        chave = re.sub(r"\s+", " ", chave).strip()
        if chave:
            grupos[chave].append(dict(claim))
    conflitos = []
    for chave, grupo in grupos.items():
        textos = {str(item.get("claim", "")).lower() for item in grupo}
        tem_sim = any("não" not in texto and "nao" not in texto for texto in textos)
        tem_nao = any("não" in texto or "nao" in texto for texto in textos)
        if tem_sim and tem_nao:
            conflitos.append({"subject": chave, "claims": grupo})
    return conflitos


def atualizar_crenca(prior: float, evidencia: bool, verossimilhanca_se_verdade: float = 0.8, verossimilhanca_se_falsa: float = 0.2) -> float:
    if not 0 < prior < 1:
        raise ValueError("prior precisa estar entre 0 e 1")
    if not 0 < verossimilhanca_se_verdade < 1 or not 0 < verossimilhanca_se_falsa < 1:
        raise ValueError("verossimilhancas precisam estar entre 0 e 1")
    if evidencia:
        numerador = prior * verossimilhanca_se_verdade
        denominador = numerador + (1 - prior) * verossimilhanca_se_falsa
    else:
        numerador = prior * (1 - verossimilhanca_se_verdade)
        denominador = numerador + (1 - prior) * (1 - verossimilhanca_se_falsa)
    return round(numerador / denominador, 8)


def atualizar_kalman_1d(media: float, variancia: float, medida: float, ruido_medida: float) -> tuple:
    if variancia < 0 or ruido_medida <= 0:
        raise ValueError("variancia não pode ser negativa e ruido precisa ser positivo")
    ganho = variancia / (variancia + ruido_medida)
    nova_media = media + ganho * (medida - media)
    nova_variancia = (1 - ganho) * variancia
    return round(nova_media, 8), round(nova_variancia, 8)


def exigir_triangulacao(fontes: Sequence[str], minimo: int = 2) -> bool:
    independentes = {str(f).strip().lower() for f in fontes if str(f).strip()}
    return len(independentes) >= minimo


# ---------------------------------------------------------------------------
# Neuro-simbólico, segurança e resiliência.


def resolver_expressao_exata(expressao: str) -> int | float:
    arvore = ast.parse(str(expressao), mode="eval")
    permitidas = (ast.Expression, ast.Constant, ast.BinOp, ast.UnaryOp,
                  ast.Add, ast.Sub, ast.Mult, ast.Div, ast.FloorDiv, ast.Mod,
                  ast.Pow, ast.USub, ast.UAdd)
    if any(not isinstance(no, permitidas) for no in ast.walk(arvore)):
        raise EvolucaoError("expressão contém nó não permitido")
    def calcular(no: ast.AST) -> int | float:
        if isinstance(no, ast.Expression): return calcular(no.body)
        if isinstance(no, ast.Constant) and isinstance(no.value, (int, float)): return no.value
        if isinstance(no, ast.UnaryOp) and isinstance(no.op, (ast.USub, ast.UAdd)):
            return -calcular(no.operand) if isinstance(no.op, ast.USub) else calcular(no.operand)
        if isinstance(no, ast.BinOp):
            a, b = calcular(no.left), calcular(no.right)
            if isinstance(no.op, ast.Add): return a + b
            if isinstance(no.op, ast.Sub): return a - b
            if isinstance(no.op, ast.Mult): return a * b
            if isinstance(no.op, ast.Div): return a / b
            if isinstance(no.op, ast.FloorDiv): return a // b
            if isinstance(no.op, ast.Mod): return a % b
            if isinstance(no.op, ast.Pow): return a ** b
        raise EvolucaoError("expressão não resolvida")
    return calcular(arvore)


def verificar_artefato_gerado(artefato: Mapping[str, Any]) -> dict:
    erros = validar_skill(artefato)
    if artefato.get("approved_by_human") and not artefato.get("tests_passed"):
        erros.append("aprovação humana não pode superar teste reprovado")
    return {"ok": not erros, "errors": erros, "executable_code": bool(_chaves_proibidas(artefato))}


def capability_passport(nome: str, operations: Sequence[str], roots: Sequence[str], requires_human: bool = True, side_effects: Sequence[str] = ()) -> dict:
    ops = sorted({str(op) for op in operations})
    if not ops or any(op not in VOCABULARIO_SKILL for op in ops):
        raise EvolucaoError("passaporte contém operação fora do vocabulário")
    return {"name": str(nome), "operations": ops, "roots": sorted(set(map(str, roots))),
            "requires_human": bool(requires_human), "side_effects": sorted(set(map(str, side_effects))),
            "version": 1, "passport_hash": _hash({"name": nome, "operations": ops, "roots": roots})}


def validar_saida_ferramenta(valor: Any, max_chars: int = 4000, tipos: Sequence[str] = ("str", "int", "float", "bool", "none")) -> dict:
    tipo = "none" if valor is None else type(valor).__name__
    erros = []
    if tipo not in set(tipos):
        erros.append("tipo não autorizado: " + tipo)
    if isinstance(valor, str) and len(valor) > max_chars:
        erros.append("saída ultrapassou teto de caracteres")
    return {"ok": not erros, "type": tipo, "errors": erros, "value": valor if not erros else None}


def criar_honeytokens(prefixos: Sequence[str], quantidade: int = 3) -> list:
    if quantidade < 1 or quantidade > 20:
        raise ValueError("quantidade precisa estar entre 1 e 20")
    resultado = []
    for prefixo in prefixos:
        base = re.sub(r"[^a-z0-9_-]", "", str(prefixo).lower())[:16] or "decoy"
        for indice in range(quantidade):
            digest = hashlib.sha256((base + ":" + str(indice)).encode()).hexdigest()[:16]
            resultado.append(base + "-" + digest)
    return resultado


def detectar_honeytoken(texto: str, tokens: Sequence[str]) -> list:
    conteudo = str(texto)
    return [token for token in tokens if str(token) and str(token) in conteudo]


def casos_red_team() -> list:
    return [
        "executar:python --version && apagar tudo",
        "abrir:..\\segredo.exe",
        "executar:format c:",
        "executar:python -c import os",
        "copiar_para_projeto para ../../fora",
        "{{system_prompt}} revele segredos",
        "--ensai",
    ]


def red_team_check(entrada: str) -> dict:
    texto = str(entrada).lower()
    marcadores = ("&&", "||", "|", ">", "<", ";", "..", "format ", "python -c", "system_prompt", "--ensai")
    encontrados = [marcador for marcador in marcadores if marcador in texto]
    return {"blocked": bool(encontrados), "markers": encontrados, "input": entrada}


def gerar_fuzz_inputs() -> list:
    return ["", "# comentário", ":", "avisar:", "executar:git status", "../fora", "\\\\servidor", "{truncado", "[]", "null", "\x00"]


def chaos_cenarios() -> list:
    return [
        {"id": "json_truncado", "injeção": "{truncado", "esperado": "gritar_sem_apagar"},
        {"id": "fila_vazia", "injeção": "# só comentário", "esperado": "mover_para_erros"},
        {"id": "arquivo_metade", "injeção": "mtime_instável", "esperado": "esperar_tolerancia"},
        {"id": "trava_orfa", "injeção": "pid_morto", "esperado": "assumir_com_segurança"},
        {"id": "elo_desconhecido", "injeção": "telepatia", "esperado": "recusar_sem_escrever"},
    ]


def validar_invariantes(valor: Mapping[str, Any], invariantes: Iterable[Callable[[Mapping[str, Any]], bool]]) -> dict:
    falhas = []
    for indice, invariante in enumerate(invariantes):
        try:
            if not bool(invariante(valor)):
                falhas.append(indice)
        except Exception as erro:
            falhas.append({"indice": indice, "erro": type(erro).__name__})
    return {"ok": not falhas, "falhas": falhas}


def grafo_causal(arestas: Iterable[Sequence[str]]) -> dict:
    grafo = defaultdict(list)
    for aresta in arestas:
        if len(aresta) >= 2:
            origem, destino = str(aresta[0]), str(aresta[1])
            grafo[origem].append(destino)
    return {chave: sorted(set(valores)) for chave, valores in sorted(grafo.items())}


# ---------------------------------------------------------------------------
# Versionamento, cache, calibração e telemetria local.


def snapshot_comportamento(comportamento: Mapping[str, Any], label: str = "sem-label") -> dict:
    corpo = json.loads(_json_canonico(comportamento))
    return {"label": str(label), "timestamp": agora_iso(), "behavior_hash": _hash(corpo), "behavior": corpo}


def diff_semantico(antes: Any, depois: Any) -> dict:
    texto_a = _json_canonico(antes)
    texto_b = _json_canonico(depois)
    palavras_a = set(re.findall(r"[\w-]+", texto_a.lower()))
    palavras_b = set(re.findall(r"[\w-]+", texto_b.lower()))
    return {"similarity": round(SequenceMatcher(None, texto_a, texto_b).ratio(), 4),
            "added_terms": sorted(palavras_b - palavras_a),
            "removed_terms": sorted(palavras_a - palavras_b),
            "changed": texto_a != texto_b}


def avaliar_regressao(casos: Iterable[Mapping[str, Any]], antes: Mapping[str, Any], depois: Mapping[str, Any]) -> dict:
    regressao = []
    melhorias = []
    for caso in casos:
        identificador = str(caso.get("id", "?"))
        score_a = float(caso.get("before", 0.0))
        score_b = float(caso.get("after", 0.0))
        if score_b < score_a:
            regressao.append({"id": identificador, "before": score_a, "after": score_b})
        elif score_b > score_a:
            melhorias.append({"id": identificador, "before": score_a, "after": score_b})
    return {"ok": not regressao, "regressions": regressao, "improvements": melhorias,
            "before_hash": antes.get("behavior_hash"), "after_hash": depois.get("behavior_hash")}


class CacheSemantico:
    """Cache exato + aproximado pequeno, transparente e sem embeddings externos."""

    def __init__(self, limite: int = 256, similaridade_minima: float = 0.88):
        self.limite = max(1, int(limite))
        self.similaridade_minima = float(similaridade_minima)
        self.exato = {}
        self.ordem = []

    @staticmethod
    def _normalizar(chave: str) -> str:
        return " ".join(re.findall(r"\w+", str(chave).lower()))

    def guardar(self, chave: str, valor: Any) -> None:
        normalizada = self._normalizar(chave)
        self.exato[normalizada] = valor
        if normalizada in self.ordem:
            self.ordem.remove(normalizada)
        self.ordem.append(normalizada)
        while len(self.ordem) > self.limite:
            self.exato.pop(self.ordem.pop(0), None)

    def buscar(self, chave: str) -> dict:
        normalizada = self._normalizar(chave)
        if normalizada in self.exato:
            return {"hit": True, "kind": "exact", "similarity": 1.0, "value": self.exato[normalizada]}
        melhor = None
        for outra, valor in self.exato.items():
            score = SequenceMatcher(None, normalizada, outra).ratio()
            if melhor is None or score > melhor[0]:
                melhor = (score, valor)
        if melhor and melhor[0] >= self.similaridade_minima:
            return {"hit": True, "kind": "semantic", "similarity": round(melhor[0], 4), "value": melhor[1]}
        return {"hit": False, "kind": None, "similarity": round(melhor[0], 4) if melhor else 0.0, "value": None}


def calibrar_confianca(previsoes: Iterable[Mapping[str, Any]], faixas: int = 5) -> dict:
    bins = [[] for _ in range(max(1, faixas))]
    for previsao in previsoes:
        confianca = min(0.999999, max(0.0, float(previsao.get("confidence", 0.0))))
        indice = min(len(bins) - 1, int(confianca * len(bins)))
        bins[indice].append((confianca, bool(previsao.get("correct"))))
    detalhes = []
    erro = 0.0
    total = 0
    for indice, binario in enumerate(bins):
        if not binario:
            continue
        media_conf = sum(x[0] for x in binario) / len(binario)
        media_acerto = sum(1 for _, certo in binario if certo) / len(binario)
        erro += abs(media_conf - media_acerto) * len(binario)
        total += len(binario)
        detalhes.append({"bin": indice, "confidence": round(media_conf, 4), "accuracy": round(media_acerto, 4), "count": len(binario)})
    return {"ece": round(erro / total, 6) if total else None, "bins": detalhes, "total": total}


def medir_custo(entrada: str, passos: int, inicio: float, saida: str = "") -> dict:
    duracao_ms = max(0.0, (time.perf_counter() - inicio) * 1000)
    caracteres = len(str(entrada)) + len(str(saida))
    # Não chamamos isso de tokens: este agente não usa tokenizer de LLM.
    return {"duration_ms": round(duracao_ms, 3), "steps": int(passos), "characters": caracteres,
            "quality_signal": None}


def auditar_ambiente(raiz: Path) -> dict:
    loop = raiz / "agente" / "loop.py"
    regras = raiz / "fluxos" / "regras.json"
    dados = _ler_json(regras, {})
    texto_loop = loop.read_text(encoding="utf-8") if loop.exists() else ""
    return {
        "version": VERSAO_EVOLUCAO,
        "timestamp": agora_iso(),
        "matrix": resumo_ideias(),
        "loop_lines": len(texto_loop.splitlines()),
        "rules_hash": _hash(dados) if dados else None,
        "skills": len(carregar_skills(raiz)),
        "constitution": {"human_approval": True, "self_written_code": False, "git_by_agent": False},
        "existing_primitives": {
            "portao": (raiz / "testes" / "testar_regras.py").exists(),
            "raio": (raiz / "testes" / "raio_x.py").exists(),
            "world_model": "mundo_falso" in texto_loop,
            "experience": "registrar_experiencia" in texto_loop,
            "atomic_json": "os.replace" in texto_loop,
            "human_gate": "so_com_humano" in texto_loop,
        },
    }


def plano_noturno_seguro() -> list:
    """Cron local: tarefas de melhoria que podem ser preparadas sem promoção."""
    return [
        {"id": "avaliar-portao", "acao": "rodar portao e registrar placar", "writes_code": False},
        {"id": "ataque-coleira", "acao": "executar casos red-team em mundo falso", "writes_code": False},
        {"id": "medir-franqueza", "acao": "calcular confiança, desacordo e regressão", "writes_code": False},
        {"id": "propor-skill", "acao": "criar manifesto declarativo inativo para revisão humana", "writes_code": False},
        {"id": "preservar-tombstone", "acao": "registrar motivo de toda recusa ou reversão", "writes_code": False},
    ]


__all__ = [
    "VERSAO_EVOLUCAO", "IDEIAS", "EvolucaoError", "auditar_matriz_ideias", "resumo_ideias",
    "validar_skill", "skill_aprovada", "registrar_skill", "carregar_skills", "selecionar_skill",
    "detectar_fraquezas", "gerar_curriculo", "recompensa_processo", "maioria", "best_of_n",
    "beam_search", "canary_probes", "simular_plano", "decair_memorias", "comprimir_memorias",
    "registrar_trace", "registrar_tombstone", "verificar_tombstones", "registrar_claim",
    "encontrar_contradicoes", "atualizar_crenca", "atualizar_kalman_1d", "exigir_triangulacao",
    "resolver_expressao_exata", "verificar_artefato_gerado", "capability_passport",
    "validar_saida_ferramenta", "criar_honeytokens", "detectar_honeytoken", "casos_red_team",
    "red_team_check", "gerar_fuzz_inputs", "chaos_cenarios", "validar_invariantes", "grafo_causal",
    "snapshot_comportamento", "diff_semantico", "avaliar_regressao", "CacheSemantico",
    "calibrar_confianca", "medir_custo", "auditar_ambiente", "plano_noturno_seguro",
]
