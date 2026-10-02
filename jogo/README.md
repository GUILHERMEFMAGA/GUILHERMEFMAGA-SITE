# Rua Vermelha — protótipo jogável

A cena inicial usa `gta-retro.png` dentro desta pasta como arte de fundo: conserva o enquadramento, a rua, os prédios e o sedã da referência. A cópia original também permanece na raiz do repositório. A imagem não é modificada; o jogo cria uma cópia de trabalho em Canvas para poder mover o carro sem deixar rastro.

## Acesso direto (recomendado)

Entre na pasta `jogo` e inicie o servidor ali. Assim, a página inicial servida já é o jogo, sem redirecionamento nem iframe:

```bash
cd jogo
python3 -m http.server 8000
```

Abra `http://localhost:8000/`.

Também é possível iniciar um servidor estático na raiz do repositório e abrir `http://localhost:8000/jogo/`. O projeto usa Canvas e JavaScript nativo, sem pacotes ou build.

## Controles

- **WASD / setas:** dirigir; a pé, caminhar.
- **Shift:** correr a pé.
- **E:** sair/entrar no sedã ou usar o orelhão.
- **Espaço:** freio de mão ou empurrão leve.
- **H:** buzina · **R:** trocar estação · **V:** ligar/desligar áudio.
- **Esc:** pausar · **? / F1:** ajuda.

Ao sair do carro aparece um orelhão amarelo com três trabalhos de exemplo: entrega, táxi e fuga. Dinheiro, reputação e campanha ficam salvos no `localStorage`.
