# Rua Vermelha — protótipo jogável

A cena inicial usa `gta-retro.png` e `rua-segmento-02.png` como duas ruas de referência em visão aérea; a primeira conserva o enquadramento, os prédios e o sedã. A cópia original `gta-retro.png` também permanece na raiz do repositório. As artes iniciais não são modificadas: o jogo prepara cópias de trabalho em Canvas para mover o carro sem deixar rastro. O sedã usa uma máscara de alpha binário ajustada à silhueta. Depois desses dois trechos, a cidade continua indefinidamente para norte e sul com quarteirões gerados por semente: curvas que se alinham nas entradas, casas, galpões e prédios grandes com telhados, janelas e detalhes de cobertura variados. O gerador mantém uma janela limitada de sete telas para que a exploração não acumule canvases sem limite. A luz acompanha o ciclo de dia/noite; chuva, neblina, vento e folhas usam uma segunda camada climática determinística.

## Acesso direto (recomendado)

Entre na pasta `jogo` e inicie o servidor ali. Assim, a página inicial servida já é o jogo, sem redirecionamento nem iframe:

```bash
cd jogo
python3 -m http.server 8000
```

Abra `http://localhost:8000/`.

Também é possível iniciar um servidor estático na raiz do repositório e abrir `http://localhost:8000/jogo/`. O projeto usa Canvas e JavaScript nativo, sem pacotes ou build.

## Versão autocontida

Para gerar um único HTML que funciona sem servidor e inclui as duas ruas de referência, o gerador procedural, CSS, JavaScript e efeitos climáticos:

```bash
python3 jogo/build_offline.py
```

O comando cria `Rua-Vermelha-offline.html` na raiz do repositório.

## Simulação e validação

A física do sedã fica isolada em `vehicle-physics.js`: aceleração, frenagem, geometria de bicicleta, aderência lateral e derrapagem com freio de mão. `collision.js` trata o veículo como retângulo orientado e usa SAT contínuo varrido contra obstáculos sólidos; as guias baixas são degraus transponíveis que geram um evento de suspensão suave, sem bloquear nem reposicionar o carro. `procedural-city.js` cria quarteirões determinísticos com calçadas, curvas e colisores de prédios alinhados. A janela de mundo conserva no máximo sete telas; o terreno cresce para os dois lados sem acumular canvases. O loop simula a 60 Hz fixos, limita o tempo acumulado em travamentos e interpola a pose do carro durante a renderização para reduzir tremulação em telas de alta frequência.

A inicialização verifica os elementos obrigatórios e o Canvas 2D antes de começar. Cada imagem tem limite de espera de 30 segundos; se um mapa falhar, o jogo monta uma cena substituta e continua quando possível. O som é opcional e é desligado isoladamente caso o navegador falhe. Exceções de renderização ou eventos assíncronos pausam a simulação e mostram uma orientação para recarregar, em vez de deixar o ciclo de animação morrer silenciosamente. A geração do HTML offline substitui o arquivo de forma atômica: uma falha de gravação preserva a versão anterior. Essas medidas reduzem falhas previsíveis, sem representar uma garantia de ausência total de bugs.

Valide a simulação, os mapas, o clima e a iluminação com Node.js, sem dependências externas:

```bash
python3 jogo/build_offline.py
node --test jogo/tests/*.test.js
```

Teste a gravação atômica e os caminhos de falha do gerador offline com Python:

```bash
python3 -m unittest discover -s jogo/tests -p 'test_*.py' -v
```

## Controles

- **WASD / setas:** dirigir; a pé, caminhar.
- **Shift:** correr a pé.
- **E:** sair/entrar no sedã ou usar o orelhão.
- **Espaço:** freio de mão ou empurrão leve.
- **H:** buzina · **R:** trocar estação · **V:** ligar/desligar áudio.
- **Esc:** pausar · **? / F1:** ajuda.

Ao sair do carro aparece um orelhão amarelo com três trabalhos de exemplo: entrega, táxi e fuga. Dinheiro, reputação e campanha ficam salvos no `localStorage`.
