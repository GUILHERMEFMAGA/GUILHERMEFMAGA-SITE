# NÚCLEO — Agente de IA local (Python puro, sem API, sem Ollama)

Um agente de verdade que roda **no seu computador**, **offline**, **de graça**, **sem instalar
nenhum pacote** (nem `pip install`, nem Docker, nem Node.js, nem Ollama, nem API paga de nenhum
tipo). Ele tem:

| Parte | O que faz | Onde está o código |
|---|---|---|
| **Cérebro** | Rede neural MLP (entrada → escondida → softmax) treinada com backpropagation | `agente/rede_neural.py` |
| **Olhos** | Transforma frases em números (saco de palavras) | `agente/texto.py` |
| **Memória** | Conversa atual + fatos sobre você (SQLite) | `agente/memoria.py` |
| **Conhecimento** | Base de tópicos com busca por palavras-chave e peso IDF | `agente/conhecimento.py` |
| **Voz criativa** | Gera frases novas com Cadeia de Markov | `agente/gerador.py` |
| **Mãos** | 11 ferramentas: conta, arquivos, texto, sistema, internet | `agente/ferramentas.py` |
| **Automação (mini-n8n)** | Fluxos em JSON com gatilho de horário/intervalo e passos encadeados | `agente/orquestrador.py` |
| **Decisão** | Entender → decidir → agir → responder | `agente/nucleo.py` |
| **Painel** | Interface web (sem Flask) | `agente/web.py` + `web/painel.html` |

---

## 1. Como rodar (os 6 comandos que importam)

Abra o terminal do VS Code **dentro da pasta `agente-ia`** (veja o guia passo a passo em
`GUIA-DO-INICIADOR.md`) e use:

```bash
python main.py                  # conversa no terminal
python main.py web              # painel no navegador (http://localhost:8000)
python main.py treinar          # treina a rede neural do zero
python main.py diagnostico      # mostra o que a rede ainda erra
python main.py fluxo bom_dia    # executa uma automação
python main.py servico          # liga o "vigia" dos gatilhos (Ctrl+C para parar)
```

> No Windows pode ser `python`; no Linux/Mac costuma ser `python3`.

Dentro do chat do terminal:
`/ajuda` `/raio-x` `/fatos` `/esquecer chave` `/fluxos` `/estado` `/treinar` `/limpar` `/sair`

---

## 2. O que ele entende hoje (exemplos reais testados)

| Você escreve | O que acontece |
|---|---|
| `quanto é (25 * 4) + 10` | Calculadora segura (usa `ast`, nunca `eval`) |
| `salve uma nota chamada ideias.txt com: fazer um app` | Escreve em `dados/saidas/` |
| `leia o arquivo ideias.txt` | Lê e mostra o conteúdo |
| `analise: <texto>` / `resuma: <texto>` | Conta palavras / faz resumo |
| `meu nome é Guilherme` | Guarda na memória longa (SQLite) |
| `o que você sabe sobre mim?` | Recupera todos os fatos guardados |
| `como usar o terminal no VS Code` | Responde pela base de conhecimento |
| `conte uma piada` / `estou desanimado` | Rede neural reconhece a intenção e responde |
| `invente uma frase` | Gerador de Markov cria uma frase nova |
| `rode o fluxo relatorio_maquina` | Executa automação estilo n8n |
| `qual a capital da França` | **"Não sei"** honesto + sugestões (anti-alucinação) |

---

## 3. Como ensinar coisas novas

**A) Nova pergunta na base de conhecimento** — abra `dados/conhecimento.json`, copie um tópico
e troque `titulo`, `palavras_chave` e `resposta`. Salve. Pronto: o agente já responde (não precisa treinar).

**B) Nova intenção na rede neural** — abra `dados/treino.jsonl` e adicione linhas:

```json
{"texto": "quero cancelar minha conta", "intencao": "cancelamento"}
{"texto": "como cancelo o servico", "intencao": "cancelamento"}
```

Depois rode `python main.py treinar`. Use **5 a 10 exemplos** por intenção, com palavras diferentes.

**C) Nova ferramenta** — em `agente/ferramentas.py`, escreva uma função Python e cadastre em
`CATALOGO`. Ela vira ação disponível para o agente e para os fluxos.

**D) Novo fluxo de automação** — crie um `.json` em `dados/fluxos/`:

```json
{
  "nome": "meu_fluxo",
  "descricao": "O que ele faz",
  "gatilho": { "tipo": "manual" },
  "passos": [
    { "acao": "calcular", "args": ["2 + 2"], "salvar_como": "resultado" },
    { "acao": "salvar_arquivo", "args": ["saida.txt"], "entrada": "Resultado: {{resultado}}" }
  ]
}
```

Gatilhos: `manual`, `{"tipo":"horario","quando":"08:00"}`, `{"tipo":"intervalo","segundos":300}`.

---

## 4. Estrutura de pastas

```
agente-ia/
├── main.py                  # porta de entrada (CLI)
├── LEIA-ME.md               # este arquivo
├── GUIA-DO-INICIADOR.md     # passo a passo do zero (VS Code → GitHub)
├── agente/
│   ├── __init__.py
│   ├── texto.py             # tokenização + vetorizador (saco de palavras)
│   ├── rede_neural.py       # rede neural do zero (tanh + softmax + backprop)
│   ├── memoria.py           # memória curta + longa (SQLite)
│   ├── conhecimento.py      # base de conhecimento (IDF)
│   ├── gerador.py           # gerador de texto (cadeia de Markov)
│   ├── ferramentas.py       # as 11 ações que o agente pode executar
│   ├── orquestrador.py      # motor de fluxos estilo n8n
│   ├── nucleo.py            # decisão: entender → decidir → agir → responder
│   └── web.py               # servidor HTTP do painel
├── web/painel.html          # interface do painel
└── dados/
    ├── treino.jsonl         # exemplos para treinar a rede (você edita!)
    ├── conhecimento.json    # tópicos que o agente sabe explicar (você edita!)
    ├── corpus.txt           # texto que alimenta o gerador criativo
    ├── fluxos/*.json        # automações
    └── saidas/              # única pasta onde o agente pode escrever
```

---

## 5. Honestidade técnica (importante)

- A rede neural daqui tem ~3.100 parâmetros. Modelos como GPT-4 têm centenas de bilhões:
  por isso este agente **não conversa livremente como o ChatGPT**. Ele é ótimo em reconhecer
  intenções, executar tarefas, lembrar fatos e automatizar — que é onde um agente de verdade
  ganha valor.
- O "modo criativo" usa Cadeia de Markov: aprende quais palavras vêm depois de quais. Gera
  frases novas, mas não "entende" o significado.
- Segurança: a calculadora não usa `eval`; as escritas de arquivo ficam presas em
  `dados/saidas/`; nada de senha no código; a internet é opcional.
- Se um dia quiser conversa livre, o caminho é plugar um LLM **só** na camada de conversa
  mantendo ferramentas, memória e fluxos — a arquitetura já está separada para isso.

---

## 6. Próximos passos sugeridos

1. `python main.py web` e conversar pelo painel.
2. Adicionar 2 tópicos no `conhecimento.json` sobre o seu trabalho.
3. Criar uma intenção nova com 8 exemplos e treinar.
4. Criar um fluxo que salve um diário todo dia às 08:00.
5. Subir tudo para o GitHub e escrever no README o que você aprendeu.

Bom estudo — e lembre: **um passo pequeno que funciona vale mais que um plano gigante parado.**
