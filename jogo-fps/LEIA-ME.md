# Zona de Combate 3D 🎯

Jogo de tiro em primeira pessoa (FPS) 3D feito com **Three.js**. Tudo é gerado por código:
texturas, modelos das armas, robôs NPC e sons. Não precisa instalar nada.

## Como jogar
- Abra `index.html` com dois cliques **ou** rode um servidor local:
  ```bash
  cd jogo-fps
  python -m http.server 8080   # abra http://localhost:8080
  ```
- Clique em **JOGAR** (o mouse fica preso na tela; aperte `Esc` para pausar).

| Tecla | Ação |
|---|---|
| W A S D | mover |
| Mouse | mirar |
| Clique esquerdo | atirar |
| Clique direito | mirar com zoom |
| R | recarregar |
| 1 / 2 / 3 ou roda do mouse | pistola / fuzil / escopeta |
| Shift | correr |
| Espaço | pular |

## O que tem
- 3 armas com recuo, dispersão, munição limitada e recarga
- Robôs NPC com IA: patrulham, enxergam você (linha de visão), perseguem pelo mapa (busca em largura na grade) e trocam tiros andando de lado
- 3 tipos de inimigo: **Soldado**, **Corredor** (rápido) e **Pesado** (aguenta muito dano)
- Ondas cada vez mais difíceis, tiro na cabeça com dano dobrado
- Barris explosivos com reação em cadeia
- Itens de vida e munição, minimapa, indicador de direção do dano, recorde salvo no navegador

## Arquivos
- `index.html`: página e HUD
- `css/estilo.css`: visual do HUD e dos menus
- `js/jogo.js`: o jogo inteiro (mapa, IA, armas, efeitos, sons)
- `lib/three.min.js`: Three.js r160 (licença MIT)

Para mudar o mapa, edite a lista `MAP` no início de `js/jogo.js`
(`#` parede, `C` caixas, `B` barril, `P` jogador, `E` ponto de nascimento dos inimigos).
