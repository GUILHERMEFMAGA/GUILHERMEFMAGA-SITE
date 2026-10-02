# Meus projetos 🚀

Este repositório reúne dois projetos pessoais feitos **sem bibliotecas**, **sem contas** e **sem nuvem**:

| Projeto | Tecnologia | O que é |
|---|---|---|
| **🏙 LIFE: CIDADE VIVA** | JavaScript puro (navegador) | Simulador de vida em mundo aberto: cidade procedural, 2.200 moradores com rotina, trânsito, clima, interiores, empregos e economia viva. |
| **🤖 NÚCLEO** | Python puro (terminal + painel web) | Agente de IA local com rede neural feita do zero, memória, ferramentas e automações no estilo n8n. |

---

# 🏙 LIFE: CIDADE VIVA

Simulador de vida em mundo aberto, visto de cima, rodando direto no navegador.
A cidade é **gerada por semente** e continua vivendo mesmo quando você não faz nada:
moradores saem para o trabalho, ônibus circulam, lojas abrem, entregas acontecem e a
polícia e o corpo de bombeiros respondem a ocorrências.

<div align="center">

**▶ [Jogar agora](life-cidade-viva/index.html)** · 📘 **[Documentação](life-cidade-viva/LEIA-ME.md)**

</div>

### Em 10 segundos

```bash
# opção 1: abra o arquivo no navegador
life-cidade-viva/index.html

# opção 2: servidor local (recomendado)
cd life-cidade-viva
python -m http.server 8000     # abra http://localhost:8000
```

### O que tem dentro

| Recurso | Estado |
|---|---|
| Cidade procedural (294×294 tiles): ruas, avenidas, quarteirões, parque com lago, canal com pontes, praia | ✅ |
| Bairros: centro financeiro, comércio, residencial, subúrbio, industrial, rural, porto, aeroporto, floresta | ✅ |
| Ciclo de 24 h com noite iluminada: postes, janelas acesas, letreiros e faróis | ✅ |
| Clima dinâmico: sol, nuvens, chuva, tempestade com raios e neblina | ✅ |
| Trânsito com semáforos, troca de faixa, buzina, ônibus, caminhões, táxis e motos | ✅ |
| 2.200 moradores com nome, idade, profissão, casa, trabalho, salário e rotina própria | ✅ |
| Simulação em dois níveis: abstrata para todos, completa para quem está perto | ✅ |
| Eventos espontâneos: acidentes, incêndios, assaltos, emergências, obras, falta de energia | ✅ |
| Interiores exploráveis com funcionários trabalhando | ✅ |
| Necessidades (fome, energia, higiene, humor), dormir, comer, cozinhar e tomar banho | ✅ |
| Empregos, entregas, corridas de táxi e pagamento por hora | ✅ |
| Economia viva: preços por categoria, estoque, reposição, inflação e mercado oscilando | ✅ |
| Veículos com combustível, desgaste, dano, faróis e abastecimento no posto | ✅ |
| Notícias geradas a partir do que acontece na cidade, áudio sintetizado e save no navegador | ✅ |

---

# 🤖 Meu agente de IA local

<img width="800" height="450" alt="b_deixe_um_pouco_mais_-ezgif com-video-to-gif-converter" src="https://github.com/user-attachments/assets/a73e7bcd-c59c-463b-8b60-aae618b7e519" />

Este projeto é o **NÚCLEO**: um agente de IA que roda no meu computador,
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
