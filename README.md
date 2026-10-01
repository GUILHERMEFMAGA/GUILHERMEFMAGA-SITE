<img width="800" height="450" alt="b_deixe_um_pouco_mais_-ezgif com-video-to-gif-converter" src="https://github.com/user-attachments/assets/a73e7bcd-c59c-463b-8b60-aae618b7e519" />
 
# Meu agente de IA local 🤖

Este repositório contém o **NÚCLEO**: um agente de IA que roda no meu computador,
escrito em **Python puro**, **sem API paga**, **sem Ollama** e **sem instalar nenhum pacote**.

Ele tem rede neural (feita do zero), memória, ferramentas e automações no estilo n8n.

👉 Comece por aqui: **[agente-ia/GUIA-DO-INICIADOR.md](agente-ia/GUIA-DO-INICIADOR.md)**
(passo a passo do zero, em português, feito para quem está começando)

📘 Documentação técnica: **[agente-ia/LEIA-ME.md](agente-ia/LEIA-ME.md)**

## Rodar em 10 segundos

```bash
cd agente-ia
python main.py        # conversa no terminal
python main.py web    # painel no navegador (http://localhost:8000)
```

## O que ele faz

| Recurso | Estado |
|---|---|
| Rede neural MLP treinada com backpropagation (só biblioteca padrão) | ✅ |
| Memória curta + memória longa em SQLite (`meu nome é ...`) | ✅ |
| 11 ferramentas: cálculo seguro, arquivos, resumo, análise de texto, sistema | ✅ |
| Automações estilo n8n: gatilho por horário/intervalo e passos com `{{variaveis}}` | ✅ |
| Painel web sem Flask (servidor HTTP da biblioteca padrão) | ✅ |
| "Não sei" honesto quando a confiança é baixa (anti-alucinação) | ✅ |

## Voxel Realms — protótipo de exploração 3D

O repositório também contém uma primeira fatia jogável de **Voxel Realms: The Living Frontier**: uma cena voxel procedural em WebGL 2, sem dependências de runtime, com ciclo de dia e noite, clima, água animada, fauna errante, mineração, construção, crafting, mapa descoberto por exploração e HUD adaptável.

Para iniciar a demo no navegador:

```bash
python -m http.server 4173 --bind 0.0.0.0
# abra http://localhost:4173
```

Clique em **Entrar na expedição** para capturar o mouse. `WASD` move, `Espaço` pula, `Shift` corre, clique esquerdo minera, clique direito constrói, `1`–`6` troca o bloco, `E` abre a mochila, `M` abre o atlas, `V` alterna a câmera e `C` esconde a interface. Toque/arraste e controles na tela estão disponíveis em dispositivos móveis. A semente é salva localmente e pode ser trocada no botão **Novo mundo**.

Esta é uma demo de navegador, não a produção completa descrita no documento de visão: terreno e sistemas são locais e procedurais; não há ainda multiplayer, servidor, IA generativa, áudio, campanha ou otimização de mundo infinito. Requer navegador com WebGL 2.
