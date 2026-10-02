# Rua Vermelha — protótipo jogável

A cena inicial usa `gta-retro.png` dentro desta pasta como arte de fundo: conserva o enquadramento, a rua, os prédios e o sedã da referência. A cópia original também permanece na raiz do repositório. A imagem não é modificada; o jogo cria uma cópia de trabalho em Canvas para poder mover o carro sem deixar rastro. O sedã usa uma máscara de alpha binário ajustada à silhueta, preservando o contorno sem recortar as laterais ou levar a sombra da rua junto. A Rua Vermelha, o Bairro do Mercado, a Rua do Bar, o Cruzamento da Estação e as Curvas do Bosque formam cinco trechos ligados em um circuito. A série mantém a arquitetura aérea em pixel art, inclui cruzamento transversal e curvas em S, postes alinhados, bancos, lixeiras e vegetação variada. A luz acompanha o ciclo de dia/noite; chuva, neblina, vento e folhas usam uma segunda camada climática determinística.

## Acesso direto (recomendado)

Entre na pasta `jogo` e inicie o servidor ali. Assim, a página inicial servida já é o jogo, sem redirecionamento nem iframe:

```bash
cd jogo
python3 -m http.server 8000
```

Abra `http://localhost:8000/`.

Também é possível iniciar um servidor estático na raiz do repositório e abrir `http://localhost:8000/jogo/`. O projeto usa Canvas e JavaScript nativo, sem pacotes ou build.

## Versão autocontida

Para gerar um único HTML que funciona sem servidor e inclui os cinco mapas, CSS, JavaScript e efeitos climáticos:

```bash
python3 jogo/build_offline.py
```

O comando cria `Rua-Vermelha-offline.html` na raiz do repositório.

## Simulação e validação

A física do sedã fica isolada em `vehicle-physics.js`: aceleração, frenagem, geometria de bicicleta, aderência lateral e derrapagem com freio de mão. `collision.js` trata o veículo como retângulo orientado e usa SAT contínuo varrido contra obstáculos sólidos; as guias baixas são degraus transponíveis que geram um evento de suspensão suave, sem bloquear nem reposicionar o carro. O solver subdivide a rotação, preserva o deslizamento pela tangente e corrige penetrações nos sólidos. O loop simula a 60 Hz fixos, limita o tempo acumulado em travamentos e interpola a pose do carro durante a renderização para reduzir tremulação em telas de alta frequência.

Rode os testes de colisão contínua, física e iluminação com Node.js, sem dependências externas:

```bash
node --test jogo/tests/*.test.js
```

## Controles

- **WASD / setas:** dirigir; a pé, caminhar.
- **Shift:** correr a pé.
- **E:** sair/entrar no sedã ou usar o orelhão.
- **Espaço:** freio de mão ou empurrão leve.
- **H:** buzina · **R:** trocar estação · **V:** ligar/desligar áudio.
- **Esc:** pausar · **? / F1:** ajuda.

Ao sair do carro aparece um orelhão amarelo com três trabalhos de exemplo: entrega, táxi e fuga. Dinheiro, reputação e campanha ficam salvos no `localStorage`.
