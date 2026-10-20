# GUIA DO INICIADOR — do zero até um agente no GitHub

> Feito para quem **nunca programou** e para quem tem **TDAH**: passos curtos, um por vez,
> sempre com um **✅ TESTE** no final. Se travou, o passo 14 tem a lista de erros comuns.
> Leia só o passo em que você está. Não precisa decorar nada.

**Tempo total:** dá para fazer os passos 1 a 8 em ~40 minutos (em blocos de 15 min, com pausa).

---

## 0. Antes de começar (o que você precisa e o que NÃO precisa)

Você precisa de:
- [x] VS Code instalado ✅ (você já tem)
- [x] Python instalado ✅ (você já tem)
- [x] A pasta `agente-ia` deste projeto no computador ✅ (já está no seu repositório)
- [x] Vontade de errar e tentar de novo (isso é 100% do trabalho)

Você **NÃO** precisa de:
- ❌ Cartão de crédito, chave de API, conta em OpenAI
- ❌ Ollama, Docker, Node.js, `pip install` de nada
- ❌ Internet (depois, para o GitHub, sim)

**Regra de ouro do TDAH:** um passo por vez. Terminou um passo, testou, funcionou → marque um ✅
mental e vá para o próximo. Não leia tudo antes de começar.

---

## 1. Como o VS Code funciona (mapa de 4 lugares)

O VS Code tem 4 áreas que você vai usar sempre:

1. **Barra lateral esquerda (Explorer / ícone de folha)** → mostra os arquivos da pasta aberta.
2. **Aba do meio (editor)** → é onde o arquivo abre e você digita/edita.
3. **Terminal (parte de baixo)** → onde você digita comandos e vê o resultado.
4. **Paleta de comandos (Ctrl+Shift+P)** → "Google do VS Code": faça qualquer coisa digitando o nome.

Atalhos para memorizar (dois só):
- `Ctrl + '` (a tecla crase, ao lado do 1) → abre/fecha o terminal
- `Ctrl + S` → salva o arquivo (**salve sempre antes de rodar!**)

---

## 2. PASSO 1 — Abrir a pasta do projeto

1. Abra o VS Code.
2. Menu **File → Open Folder** (Arquivo → Abrir Pasta).
3. Escolha a pasta **`GUILHERMEFMAGA-SITE`** (a pasta principal do seu repositório).
4. Se aparecer a pergunta "Do you trust the authors?" → clique **Yes, I trust**.

Agora, na barra lateral, você deve ver `README.md`, `test2.html` e a pasta `agente-ia`.

> Por que abrir a pasta inteira? Porque o VS Code usa a pasta aberta como "chão" do projeto.
> O terminal já abre nela, e o painel de Git já sabe qual repositório observar.

**✅ TESTE 1:** a barra lateral mostra a pasta `agente-ia`. Se sim, deu certo.

---

## 3. PASSO 2 — Criar seu primeiro arquivo (o básico que você pediu)

1. Aperte `Ctrl + '` para abrir o terminal.
2. Digite este comando e aperte Enter:

```bash
cd agente-ia
python main.py ajuda
```

No Linux/Mac, se `python` der erro, use `python3 main.py ajuda`.

O que aconteceu:
- `cd agente-ia` = "entrar na pasta agente-ia" (cd = change directory)
- `python main.py ajuda` = "executar o arquivo main.py com o argumento ajuda"

**✅ TESTE 2:** apareceu um texto explicando os comandos do agente. Se apareceu, você acabou de
rodar um programa Python de verdade. 🎉

Agora vamos criar um arquivo **seu**:

1. Clique no ícone de **NOVO ARQUIVO** no Explorer (folhinha com "+"), dentro da pasta `agente-ia`.
2. Nomeie como `meu_teste.py` (a extensão `.py` diz ao VS Code que é Python).
3. Digite dentro:

```python
print("Olá! Este é o meu primeiro arquivo Python.")
nome = input("Qual é o seu nome? ")
print(f"Prazer, {nome}! Agora eu sei te chamar.")
```

4. Salve com `Ctrl + S`.
5. No terminal (que já está na pasta `agente-ia`), rode:

```bash
python meu_teste.py
```

**✅ TESTE 3:** o programa pediu seu nome e respondeu com ele. Parabéns: você já sabe
criar, salvar e executar um arquivo. Todo o resto é isso, só com mais arquivos.

> Se quiser, apague o `meu_teste.py` depois (clique com o botão direito → Delete). Ele não faz
> parte do agente.

---

## 4. PASSO 3 — Entender um arquivo Python (anatomia em 6 linhas)

Abra `agente/texto.py` e olhe as primeiras linhas. Todo arquivo Python segue esta ordem:

| Parte | Exemplo | Serve para |
|---|---|---|
| Docstring | `"""texto explicando..."""` | explica o arquivo para humanos |
| Importações | `import json` | traz ferramentas prontas da biblioteca padrão |
| Constantes | `PALAVRAS_IGNORADAS = {...}` | valores fixos, MAIÚSCULOS por convenção |
| Funções | `def tokenizar(texto):` | um bloco de código com nome, que faz uma coisa |
| Classes | `class Vetorizador:` | um "molde" que junta dados + funções |
| Execução | `if __name__ == "__main__":` | só roda quando você executa o arquivo direto |

Duas regras que evitam 90% dos erros:
1. **Indentação importa.** Python usa espaços no começo da linha para saber o que está "dentro"
   de quê. Use sempre 4 espaços (o VS Code faz sozinho, não use TAB misturado).
2. **Nome do arquivo ≠ nome de pasta.** `agente/texto.py` é o arquivo; `agente` é a pasta (pacote).

**✅ TESTE 4:** em `agente/texto.py`, no final do arquivo tem um bloco `if __name__ == "__main__":`.
Rode `python agente/texto.py` e veja que ele imprime o vocabulário de exemplo.

---

## 5. PASSO 4 — Rodar o agente e conversar com ele

No terminal, dentro de `agente-ia`:

```bash
python main.py
```

Na primeira vez ele treina o cérebro (leva ~5 segundos) e depois abre o chat. Teste estas frases,
uma por vez:

```
oi
quanto é (25 * 4) + 10
meu nome é <seu nome>
o que você sabe sobre mim?
o que é backpropagation?
invente uma frase
```

Digite `/raio-x` e faça uma pergunta qualquer: agora ele mostra **por que** decidiu cada resposta
(rota, confiança, intenções candidatas). Isso é ouro para aprender.

Para sair: `/sair`.

**✅ TESTE 5:** ele chamou você pelo nome que você ensinou (memória funcionando).

---

## 6. PASSO 5 — Ver a rede neural aprendendo

```bash
python main.py treinar
```

Na tela aparece o **erro** descendo a cada época (`época 1/350 erro 3.4` … `erro 0.05`).
Erro caindo = a rede aprendendo. No fim ele mostra a **acurácia** (quantos exemplos acertou).

Agora rode o diagnóstico:

```bash
python main.py diagnostico
```

Ele lista os exemplos que a rede ainda erra. Se aparecer "100.0%", está perfeita.

Onde ficam os exemplos? No arquivo `dados/treino.jsonl`. Abra e veja: cada linha é um exemplo com
`"texto"` e `"intencao"`. **É esse arquivo que você edita para a IA ficar mais inteligente.**

**✅ TESTE 6:** você viu o erro descer e a acurácia no final.

---

## 7. PASSO 6 — Abrir o painel no navegador (a parte bonita)

```bash
python main.py web
```

Abra `http://localhost:8000`. Você vai ver:
- à esquerda: estado do cérebro (intenções, vocabulário, parâmetros), fluxos e arquivos criados;
- no meio: a conversa;
- o botão **🧠 Treinar a rede agora** (treina sem sair da tela);
- os botões **rodar** de cada fluxo de automação.

Para parar o painel: volte ao terminal e aperte `Ctrl + C`.

Se a porta 8000 estiver ocupada, use outra: `python main.py web --porta 8080`.

**✅ TESTE 7:** você conversou com o agente pelo navegador.

---

## 8. PASSO 7 — Automação estilo n8n (o "mini-n8n")

O n8n funciona com "nós" ligados: quando acontece X, faça Y. Aqui isso é um arquivo JSON:

```bash
python main.py fluxos                  # lista as automações
python main.py fluxo bom_dia           # roda uma agora
cat dados/saidas/diario_do_agente.txt  # no Windows: type dados\saidas\diario_do_agente.txt
python main.py servico                 # liga o vigia (horário/intervalo). Ctrl+C para parar
```

Olhe o arquivo `dados/fluxos/bom_dia.json`: tem `gatilho` (quando rodar), `passos` (o que fazer) e
`{{variavel}}` para passar resultado de um passo a outro. **Isso é a mesma ideia do n8n**, só que em
Python puro, offline e versionado no Git.

**✅ TESTE 8:** o arquivo `diario_do_agente.txt` apareceu dentro de `dados/saidas/`.

---

## 9. PASSO 8 — Ensinar coisas novas ao agente (4 formas)

**1) Conhecimento novo (mais fácil, não precisa treinar)**
Abra `dados/conhecimento.json`, copie um bloco `{ ... }` inteiro e cole no fim com uma vírgula antes.
Troque `titulo`, `palavras_chave` e `resposta`. Salve. Teste no chat.

**2) Intenção nova (a IA aprende de verdade)**
Abra `dados/treino.jsonl` e adicione 5 a 10 linhas variadas:

```json
{"texto": "quero uma ideia de projeto", "intencao": "ideias"}
{"texto": "me sugere um projeto", "intencao": "ideias"}
{"texto": "da uma ideia de app", "intencao": "ideias"}
```

Depois: `python main.py treinar`. Pronto, a rede aprendeu uma nova categoria.

**3) Ferramenta nova (o agente ganha "mãos")**
Em `agente/ferramentas.py`, escreva uma função simples e cadastre no dicionário `CATALOGO`:

```python
def dizer_ola(nome: str) -> str:
    return f"Olá, {nome}!"

CATALOGO["dizer_ola"] = {"funcao": dizer_ola, "descricao": "...", "exemplo": "dizer_ola: Ana"}
```

**4) Fluxo novo (automação)**
Crie `dados/fluxos/meu_fluxo.json` copiando o modelo do passo 8, mude o `nome` e os `passos`.

**✅ TESTE 9:** você ensinou UMA coisa nova (o mais fácil já vale!) e o agente respondeu.

---

## 10. PASSO 9 — Git e GitHub (guardar tudo e mostrar no perfil)

**O que é o quê:** Git = histórico do seu projeto no seu computador. GitHub = esse histórico na
nuvem, onde outros veem.

### Jeito A — pelo VS Code (recomendado para começar)

1. Clique no ícone **Source Control** na barra lateral (parece uma bifurcação, `Ctrl+Shift+G`).
2. Escreva a mensagem do commit, por exemplo: `criando meu agente de IA local`.
3. Clique no **✓ Commit** (pode aparecer um aviso de "stage all": aceite).
4. Clique em **Sync Changes / Push** (setinha circular) para enviar ao GitHub.

### Jeito B — pelo terminal (aprenda, é útil para sempre)

```bash
git status                     # o que mudou?
git add .                      # marca tudo o que mudou para entrar no commit
git commit -m "meu agente de IA v1"   # cria um ponto no histórico
git push                       # envia para o GitHub
```

Se o repositório ainda não estiver ligado ao GitHub:

```bash
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
git branch -M main
git push -u origin main
```

Onde achar o link? No GitHub: seu repositório → botão verde **Code** → HTTPS → copiar.

**✅ TESTE 10:** abra o GitHub no navegador e veja seus arquivos lá. Se apareceram, você é oficialmente
uma pessoa que versiona código. 🎉

> **Mensagem de commit boa** = o que você fez, no presente: "adiciona intenção de piadas",
> "corrige cálculo de porcentagem". Você vai agradecer a si mesmo em 3 meses.

---

## 11. Como o agente funciona por dentro (a matemática em 1 página)

1. **Texto → números.** "bom dia" vira uma lista de 0 e 1 do tamanho do vocabulário
   (isso é o "saco de palavras", em `texto.py`).
2. **Neurônio.** Faz `soma(peso × entrada) + bias` e passa por uma função (`tanh`) que decide o
   quanto ele "acende". Vários neurônios juntos formam uma camada (`rede_neural.py`).
3. **Decisão.** A última camada gera um número por intenção; o `softmax` transforma isso em
   porcentagens que somam 100%. A maior porcentagem é a resposta.
4. **Erro.** Comparamos a resposta com a certa: `erro = -log(probabilidade da resposta certa)`.
   Errou com muita confiança → erro grande.
5. **Backpropagation.** O erro volta pelas camadas e diz o quanto CADA peso contribuiu para o erro
   (isso é a regra da cadeia do cálculo, feita em código).
6. **Gradiente + momento.** Cada peso se ajusta um pouquinho na direção que reduz o erro:
   `peso = peso - taxa × gradiente` (com "momento" para dar inércia e não tremer).
7. **Épocas.** Repetimos os passos 2 a 6 centenas de vezes. É por isso que a acurácia sobe e o erro cai.

Isso é literalmente o motor do aprendizado profundo. O ChatGPT usa a mesma ideia com
175 bilhões de pesos e uma arquitetura (Transformer) que olha todas as palavras ao mesmo tempo.
Aqui, com ~3.100 pesos, a gente faz a mesma matemática em escala que roda no seu PC em 5 segundos.

---

## 12. Rotina de estudo amigável para TDAH

- **Bloco de 15 minutos.** Timer no celular. Ao tocar, você PARA (mesmo no meio). Parar no meio é
  parte do método: o cérebro volta sozinho para a tarefa.
- **Saia sempre com algo funcionando.** Termine o bloco com o programa rodando, nunca com erro aberto.
- **Escreva o próximo passo antes de sair.** Ex.: `salve uma nota lembrete.txt com: amanhã criar a intenção 'ideias'`.
  O próprio agente pode guardar isso para você.
- **Caixa de ideias.** Toda ideia nova ("e se ele mandasse mensagem no Telegram?") vai para um
  arquivo `ideias.txt` em vez de virar tarefa agora.
- **Erro é dado, não derrota.** Leia só a ÚLTIMA linha do erro: ela quase sempre diz o problema.
- **Celebre o pequeno.** Rode `python main.py estado` e veja os números crescendo: intenções,
  tópicos, fatos, fluxos. Progresso visível é combustível para TDAH.
- **Não compare seu agente com o ChatGPT.** Compare com o agente de ontem. Esse é o jogo.

---

## 13. Se der erro: solução dos 8 mais comuns

| Mensagem / situação | Causa | Solução |
|---|---|---|
| `python: command not found` / `não é reconhecido` | o nome do executável é `python3` no seu sistema | use `python3 main.py` |
| `can't open file 'main.py'` | você está na pasta errada | rode `cd agente-ia` antes (ou confira com `dir`/`ls`) |
| `ModuleNotFoundError: No module named 'agente'` | rodou de outra pasta | rode sempre de dentro de `agente-ia` |
| `SyntaxError` | faltou dois-pontos, parêntese ou aspas | olhe o número da linha indicado e compare com o arquivo |
| `IndentationError` | misturou TAB e espaços | selecione tudo (`Ctrl+A`) e aperte `Shift+Alt+F` (formatar) |
| `Address already in use` | a porta 8000 está ocupada | `python main.py web --porta 8080` |
| O agente responde por padrão errado | falta exemplo ou há exemplos conflitantes | `python main.py diagnostico` e ajuste `treino.jsonl` |
| O painel abre em branco | o servidor não subiu | veja o terminal: se tem erro, cole a última linha aqui no chat |

Atalho de pânico: `Ctrl + C` no terminal sempre interrompe o programa. Nada quebra.

---

## 14. Glossário (leia só quando precisar)

- **API** — "tomada" para usar um serviço de outra empresa (normalmente paga). Aqui não usamos.
- **Backpropagation** — método que descobre a culpa de cada peso no erro e corrige.
- **Bias** — número extra que permite o neurônio "acender" mesmo com entrada zero.
- **Commit** — foto do seu projeto em um momento (com mensagem).
- **Época** — uma passada completa por todos os exemplos de treino.
- **Gradiente** — direção e tamanho do ajuste que reduz o erro.
- **Intenção** — categoria da frase do usuário ("saudacao", "humor", "calculo"...).
- **JSON** — arquivo de dados em formato de texto, fácil de ler e editar.
- **Markov (cadeia de)** — gera texto seguindo a estatística de "palavra que costuma vir depois".
- **Peso** — número que a rede ajusta ao aprender. É onde mora a "inteligência".
- **Softmax** — transforma números em porcentagens que somam 100%.
- **Token/Tokenização** — quebrar o texto em pedacinhos e transformá-los em números.
- **Vetor** — lista de números que representa algo (aqui, uma frase).

---

## 15. Roadmap: como chegar mais perto do "super agente"

Já está pronto: rede neural, memória, ferramentas, fluxos, painel, offline.

Próximas conquistas, em ordem de dificuldade:
1. **15 min** — 5 tópicos novos no `conhecimento.json` sobre o seu trabalho.
2. **30 min** — uma intenção nova com 10 exemplos + treinar.
3. **1 h** — ferramenta que consulta CEP ou cotação pela internet (`urllib` já está no código).
4. **2 h** — placa de notificação no painel quando um fluxo rodar (salvar log e mostrar).
5. **3 h** — conectar o Telegram (biblioteca padrão + `urllib`): o agente passa a te avisar.
6. **1 dia** — guardar o histórico em CSV e treinar a rede também com as conversas reais.
7. **depois** — plugar um LLM só na camada de conversa (a estrutura já está separada para isso).

---

## 16. Checklist final (imprima ou deixe aberto)

- [ ] Abri a pasta `GUILHERMEFMAGA-SITE` no VS Code
- [ ] Criei e rodei meu primeiro arquivo (`meu_teste.py`)
- [ ] Conversei com o agente (`python main.py`)
- [ ] Treinei a rede e vi o erro cair (`python main.py treinar`)
- [ ] Abri o painel no navegador (`python main.py web`)
- [ ] Rodei uma automação (`python main.py fluxo bom_dia`)
- [ ] Ensinei algo novo (conhecimento OU intenção)
- [ ] Fiz meu commit e subi para o GitHub
- [ ] Anotei o próximo passo em `lembrete.txt`

Bom trabalho. **Você construiu um agente de IA que roda no seu computador — sem API, sem Ollama,
sem pagar nada.** Isso não é pouca coisa.
