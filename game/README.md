# The Ashen Way — protótipo jogável

O protótipo usa a arte escolhida em [`images/ashen-way-3d-pixel-game.png`](../images/ashen-way-3d-pixel-game.png) como a cena inicial, preservando a composição da referência. Ao dar o primeiro passo, um cavaleiro pixelado aparece e percorre o caminho: W/S movem o personagem para frente e para trás, A/D mudam sua posição lateral, e a caminhada anima pernas e braços. A aproximação também altera escala e balanço da cena. É um protótipo 2.5D baseado na imagem, não uma reconstrução como malha 3D.

## Executar

A partir da raiz do repositório:

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

Abra <http://localhost:8080/game/>. Não precisa instalar dependências; a imagem e o código são locais.

## Controles

- **W / S** ou **↑ / ↓** — avançar / recuar no caminho.
- **A / D** ou **← / →** — deslocar o enquadramento.
- **Shift** — correr.
- **Mouse** — olhar; clique para capturar o mouse, arraste se o bloqueio não estiver disponível.
- **Espaço** — golpe de espada; **R** — recomeçar; **Esc** — pausar.
- Em telas de toque, use o direcional, **CORRER** e **GOLPE** na tela; arraste a imagem para olhar.

Os estados de percurso e limite da câmera ficam em `src/simulation.js`. Execute os testes com `npm --prefix game test`.
