# ANÁLISE DE LACUNAS da IA LOCAL (2026-09-13) — baseada em grep do código real (r70)
## 🔴 CRÍTICOS (prova: grep = 0 ocorrências)
1. PERSISTÊNCIA DO CÉREBRO: _R69_NUCLEO (pesos, conhecimento ensinado, léxico) vive só em RAM — fechar o agente = PERDE tudo que ensinou. Cura: cerebro.json (load na abertura; save em ensinar/aprender/esquecer) + kill-switch.
2. ESQUECER PADRÃO ESPECÍFICO: só existe 'esquecer aprendizado' (apaga TODOS). Falta 'esquecer <padrão>' e listar o léxico.
3. DEPENDÊNCIAS DE RUNTIME SEM VERSÃO: iniciar.bat faz 'pip install -q langchain-openai langchain-google-genai' solto — atualização futura pode quebrar o arranque em silêncio. Cura: requirements.txt pinado.
## 🟠 ENGENHARIA
4. Monólito: agente.py com 37.264 linhas (main.py 56). Cura futura: pacote (core/rotas/ferramentas) com camada de compat — planejar com checkpoint antes.
5. Autoteste no PC real: comando 'teste completo' rodando asserts-chave sem pytest (o PC do usuário não tem a suíte).
6. Log persistente opcional de eventos/crash (agente_log.txt, kill-switch, rotação).
7. CI no GitHub Actions rodando a suíte a cada push (hoje só local/sandbox).
## 🟡 EXPERIÊNCIA
8. STT local (whisper.cpp): FALAR com o agente (hoje só TTS de saída).
9. Iniciar com o Windows (opcional, com 'sim' + como remover).
10. Manual do usuário em português simples (guia de todos os comandos r43→r70).
11. 'essa resposta sem voz' (silêncio pontual além do silenciar por tempo da r67).
12. Onboarding de 1ª vez mais guiado (criar ia já existe; faltam passos com exemplos).
## 🔵 CAPACIDADES
13. Visão local REAL (modelo GGUF de visão) — hoje o agente é honesto que NÃO vê imagens.
14. Termômetro de contexto do GGUF (alerta antes de estourar o limite).
15. Troca quente de modelo (2 GGUFs carregados, troca em segundos).
16. Sandbox com limites (timeout+memória) para execução de código.
## ⚫ SEGURANÇA
17. Cofre de chaves real (keyring/DPAPI do Windows) — chaves.txt fica plano.
18. Revisar proteção do painel web localhost (verificar auth).
19. Modo convidado/quiosque (outra pessoa usa sem tocar na casa).
## ✅ O QUE NÃO FALTA (fundação acima da média)
autoatualização completa (r62), diagnóstico de arranque (r61/r64), anti-invenção (r65/r70), checkpoints (r67), TTS, agenda/pomodoro/hábitos, atalhos naturais, auto-reparo do BAT (r57), economia, painel web, história de config — provadas e2e.
PRIORIDADE RECOMENDADA: r71 = itens 1+2 (persistência do cérebro + esquecer específico) — pequenos e de maior valor do mundo.
