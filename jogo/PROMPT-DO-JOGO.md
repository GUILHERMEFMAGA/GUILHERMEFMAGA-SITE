# 🚗 PROMPT DO JOGO — "RUA VERMELHA" (nome provisório)

> Prompt completo para dar a uma IA (ou a um dev) criar o jogo.
> Referência visual: `imagens/gta1-estilo-limpo.png` (estilo GTA 1 / GTA 2, visão de cima).

---

## 1. PROMPT PRONTO (copie e cole)

```
Crie um jogo 2D de mundo aberto, em visão de cima (top-down), inspirado nos
primeiros GTA (GTA 1 e GTA 2, 1997-1999), rodando no navegador com HTML5 Canvas
e JavaScript puro (sem bibliotecas pagas, sem instalar nada, um index.html +
arquivos .js).

VISUAL
- Câmera de cima, centrada no jogador, seguindo suave (lerp). Tela 4:3 (800x600),
  escalável.
- Arte no estilo do print de referência: asfalto roxo-acinzentado com degradê,
  faixas amarelas tracejadas, esquinas arredondadas, calçadas de piso bege
  quadriculado com meio-fio branco, telhados de prédios marrons/laranjas/azuis.
- Carros vistos de cima com brilho suave, contorno escuro e sombra projetada
  (jogador: cupê vermelho retrô; tráfego: verde, amarelo/táxi, azul, branco).
- Pedestres minúsculos andando pelas calçadas e atravessando nas faixas.
- Se não houver sprites, desenhe tudo por código (formas + degradês) mantendo
  esse visual.

JOGADOR E CONTROLES
- O jogador começa a pé ao lado do carro vermelho dele.
- A PÉ: setas/WASD para andar; Shift corre; E entra em um carro próximo;
  Espaço = empurrão/soco (leve, sem sangue).
- DE CARRO: W/↑ acelera, S/↓ ré/freio, A/D ou ←/→ esterça (física arcade com
  derrapagem), Espaço = freio de mão, E = sai do carro, H = buzina.
- Pode entrar em QUALQUER carro do tráfego (o motorista é "tirado" do carro e
  sai correndo assustado). Carros têm cores e velocidades diferentes.
- Dá para trocar de carro à vontade; o carro vermelho é o carro "da garagem" e
  pode ser guardado/recuperado.

MUNDO
- Cidade fictícia inspirada no interior paulista/brasileiro (ex.: Ribeirão
  Preto): avenidas em grade, praças, parque com lago, rio com pontes, bairros
  com telhados coloridos, postos, padarias, oficina.
- Tráfego de IA que respeita faixas e semáforos; pedestres com rotinas simples.
- Ciclo dia/noite simples (escurece, faróis acendem).
- Minimapa no canto (opcional, pixel art).

MISSÕES E OBJETIVO
- Objetivo geral: subir de "Motorista Novato" a "Rei da Cidade" cumprindo
  missões, ganhando dinheiro e reputação.
- Missões chegam por TELEFONES PÚBLICOS espalhados pela cidade (o jogador chega
  a pé ou de carro e aperta E). Um pager/celular mostra o texto da missão em
  amarelo no rodapé (em português).
- Tipos de missão:
  1) Entrega: levar um pacote/maleta do ponto A ao B dentro do tempo.
  2) Táxi: buscar passageiros e levá-los sem bater.
  3) Corrida ilegal: percorrer checkpoints contra rivais.
  4) Fuga: escapar da polícia e chegar ao esconderijo.
  5) Roubo de carro sob encomenda: achar um modelo específico e levar à oficina.
- Seta amarela de pixel aponta para o destino.
- Dinheiro compra: conserto/pintura do carro, reparos, carros novos na garagem.
- Fim do jogo (campanha curta): completar ~10 missões e atingir a meta de
  dinheiro. Depois, modo livre.

POLÍCIA E PERSEGUIÇÕES
- Nível de procurado de 0 a 5 (ícones de policial no topo, como no GTA 1).
- O que dá procurado: bater em pedestre, bater em carro da polícia, roubar
  carro na frente de um policial, atropelar, passar sinal vermelho em alta
  velocidade.
- Viaturas azuis e brancas com sirene piscando perseguem o jogador, tentam
  fechar/encostar e fazer "PIT" no carro. Nível maior = mais viaturas,
  bloqueios de rua e helicóptero (sombra + holofote).
- Para despistar: sair da visão, trocar de carro, repintar o carro na oficina
  ou esperar o contador esfriar. Estar "Preso" = perde parte do dinheiro e
  volta ao início (não é game over).

COMBATE E NÍVEL DE VIOLÊNCIA
- Estilo arcade, cômico e exagerado (tom de "desenho animado"), NÃO realista.
- SEM sangue, SEM gore: pedestres atropelados "caem", piscam e se levantam
  ou desaparecem em uma nuvenzinha; carros batem, amassam, soltam fumaça,
  pegam fogo e explodem em pixel art.
- Armas (desbloqueáveis): soco, taco, pistola de água/"pistola de sinalização".
  (Sem armas reais realistas — mantém o jogo livre para todas as idades.)
- Vida do jogador em corações; dano de batida proporcional à velocidade.
  Ao morrer: "Você foi levado ao hospital" e perde parte do dinheiro.

INTERAÇÕES
- Entrar/sair de qualquer carro, buzinar, ligar o rádio (3 estações
  sintetizadas: funk, rock, eletrônica) com troca por tecla R.
- Conversar/interagir (E) com NPCs marcados: chefe das missões, mecânico,
  vendedor de carros, taxista.
- Orelhões, garagem, oficina de pintura (muda cor e limpa procurado),
  posto (abastece), loja (compra itens).
- Pedestres reagem: fogem se você está armado, xingam (balão com ícone)
  se você buzina.

HUD (estilo antigo, fonte pixel)
- Topo direito: dinheiro e multiplicador.
- Topo centro: ícones do nível de procurado.
- Esquerda: corações de vida e colete.
- Rodapé: caixa de texto amarela com a missão/dicas; ícone do pager.
- Minimapa opcional.

ÁUDIO
- Efeitos gerados por código (WebAudio): motor que sobe com a velocidade,
  pneu cantando, batida, sirene, buzina.
- Trilha em loop curta, estilo chiptune/funk 8-bit.

ESTRUTURA DE CÓDIGO
- index.html, game.js (loop), world.js (mapa por tiles), car.js (física),
  ai.js (tráfego/pedestres/polícia), missions.js, hud.js, audio.js.
- Mapa definido por matriz de tiles (estrada, calçada, prédio, água, ponte).
- 60 FPS, colisão por retângulos rotacionados (SAT) para carros.
- Salvar progresso em localStorage (dinheiro, carros, missão atual).
- Código comentado em português, simples de entender para iniciantes.

ENTREGA
- Jogo jogável ao abrir o index.html, com: cidade pequena, tráfego, pedestres,
  entrar/sair de carros, polícia com perseguição, 3 missões de exemplo,
  HUD completo e salvamento.
```

---

## 2. RESUMO DO JOGO (respostas diretas)

| Pergunta | Resposta |
|---|---|
| **Que estilo de jogo é?** | Mundo aberto top-down estilo GTA 1/2: dirigir, fazer missões, fugir da polícia. |
| **Qual é o objetivo?** | Cumprir missões por telefones públicos, ganhar dinheiro e reputação, chegar a "Rei da Cidade". |
| **Dá para sair do carro?** | **Sim.** Tecla **E** entra/sai. Dá para andar a pé e roubar qualquer carro. |
| **Dá para interagir?** | **Sim:** telefones, garagem, oficina, posto, lojas, NPCs, buzina, rádio. |
| **Tem perseguição?** | **Sim.** Nível de procurado 0–5, viaturas, bloqueios e helicóptero. |
| **É violento como o GTA antigo?** | Versão **leve e cartunesca**: sem sangue e sem gore, só batidas, explosões e quedas engraçadas. Classificação livre. |
| **Como termina?** | Campanha de ~10 missões + modo livre. Morrer/ser preso não dá game over: perde dinheiro e recomeça. |
| **Onde roda?** | No navegador (HTML5 Canvas + JavaScript), sem instalar nada. |

---

## 3. VERSÕES DO TOM (escolha uma)

1. **Cartunesca (recomendada)** — sem sangue, humor, ideal para publicar no site.
2. **Clássica** — mais próxima do GTA 1: pedestres atropelados deixam marca no chão,
   armas de fogo em pixel art (classificação mais alta, cuidado ao publicar).
3. **Arcade de corrida** — sem pedestres alvo, foco em corridas, fuga e drift.

---

## 4. PRÓXIMOS PASSOS

1. Escolher o tom (seção 3) e o nome do jogo.
2. Criar o protótipo: carro vermelho dirigível + cidade pequena.
3. Adicionar sair do carro, tráfego, polícia, depois missões.
4. Publicar a página `jogo/index.html` no site.
