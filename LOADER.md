# Tela de carregamento em vídeo (intro do site)

O vídeo virou **animação de carregamento**: pesa pouco, toca em loop perfeito e sai de cena
sozinho quando a página termina de carregar. Nada de `.mp4` de 40 MB no `<video autoplay>`.

```
assets/loading/
├── loader.css          estilo do overlay (~3 KB)
├── loader.js           monta, dá play, esconde (~8 KB, zero dependência)
├── loader.mp4          SEU vídeo otimizado  ← gerado por tools/video2loader.py
├── loader.webm         mesma coisa em VP9 (mais leve no Chrome/Firefox)
├── loader-poster.jpg   primeira imagem, aparece antes do vídeo destravar
└── demo/               loop de demonstração (pixel art) — rode a página loading.html
```

---

## 1. Transformar o vídeo

```bash
pip3 install imageio-ffmpeg pillow          # só na 1ª vez (não precisa de FFmpeg no sistema)

python3 tools/video2loader.py  MEU_VIDEO.mp4
```

Pronto: `assets/loading/loader.mp4`, `loader.webm`, `loader-poster.jpg`, `loader.json`.
O `loader.json` guarda tamanho, duração e peso de cada arquivo (útil pra rever depois).

### Opções que valem a pena

| Opção | Pra quê |
|---|---|
| `--loop pingpong` | **(padrão)** toca e depois toca ao contrário → loop sem emenda. Use quando o vídeo não foi desenhado pra repetir. |
| `--loop straight` | usa o original como está. Escolha esta se a última frame **já bate** com a primeira. |
| `--loop fade --fade 0.5` | emenda com um crossfade curto entre fim e começo. |
| `--width 1280` | largura final (padrão: nunca acima de `--max-width 1280`). Loader não precisa de 4K. |
| `--trim 0.4,3.2` | corta início morto e define a duração (`início,duração` em segundos). |
| `--fit pad` / `--fit cover` | `pad` coloca tarjas na cor do fundo; `cover` preenche e corta as bordas. |
| `--crop 1080:1080:0:0` | força quadrado (bom pra intro no celular em tela cheia). |
| `--crf 26` | qualidade: 22 = bonito, 30 = leve. |
| `--fps 30` / `--fps 24` | 24 fps costuma cortar ~20% do peso sem ninguém notar. |
| `--denoise` | limpa granulado de vídeo gravado no celular. |
| `--alpha` | mantém transparência (só no WebM) — dá pra ter intro sem fundo quadrado. |
| `--gif` | gera um `.gif` pra mostrar pro cliente / mandar no WhatsApp (não use como loader, é pesado). |

### Recomendações de peso

| Uso | alvo |
|---|---|
| Loader de site (desktop + 4G) | **≤ 600 KB** · 720p · 24–30 fps · sem áudio · 3 a 5 s |
| Intro "cinema" (só desktop, com botão pular) | ≤ 2 MB · 1080p |
| Acima disso | não é loader, é obstáculo 🙂 |

---

## 2. Colar no site

No `<head>`, **o mais cedo possível** (o loader precisa aparecer antes do resto da página):

```html
<link rel="stylesheet" href="assets/loading/loader.css">
<script src="assets/loading/loader.js"
        data-src="assets/loading/loader.mp4"
        data-webm="assets/loading/loader.webm"
        data-poster="assets/loading/loader-poster.jpg"
        data-texto="Carregando"
        data-min="900"></script>
```

`loader.js` aceita tudo por `data-*` (sem nenhuma linha de script seu):

| atributo | padrão | efeito |
|---|---|---|
| `data-src` | — | mp4 do loader |
| `data-webm` | — | variante VP9 (navegadores que suportam usam primeiro) |
| `data-poster` | — | imagem instantânea enquanto o vídeo abre |
| `data-gif` | — | último recurso, se `<video>` não funcionar |
| `data-min` | `900` | ms mínimos na tela (evita o "flash" feio em site cacheado) |
| `data-max` | `6000` | trava de segurança: se o `load` da página empacar, o loader sai sozinho |
| `data-fit` | `cover` | `contain` mostra o quadro inteiro com tarjas |
| `data-full` | `false` | segura até o vídeo fechar **um ciclo inteiro** |
| `data-skip` | `true` | mostra o botão "Pular ›" (e `Esc` fecha) |
| `data-once` | `false` | só na 1ª visita da sessão (`sessionStorage`) |

**Também funciona dentro de `<body>`**, mas aí ele aparece depois que o HTML começa a ser
renderizado — pode dar um "pipoco". Prefira o `<head>`.

### SPA (Next / React / Vite)

```js
// o loader.js continua sendo um script de página; para rotas internas, controle por conta própria:
import '../assets/loading/loader.js';      // ele já se esconde no window.load
window.Loader.hide();                      // ou: quando seu data fetcher terminar
```

WordPress / Wix / HTML pronto: se o editor bloquear `<script>` no head, cole as três linhas
no bloco "HTML personalizado" do `<head>` (Elementor → Configurações → Código).

---

## 3. O que já vem decidido no design

* Fundo do overlay `#0a0618` **igual** ao fundo do vídeo → a transição pro site não tem barra.
* `object-fit: cover` → cobre a tela toda, inclusive no celular deitado.
* Vídeo `muted + playsinline + loop` → sem isso o iOS simplesmente não dá `play()`.
* `<video>` tem `z-index` maior que o fallback; se o vídeo falhar, aparece uma barra animada
  em CSS puro, no mesmo estilo — a tela nunca fica branca.
* `prefers-reduced-motion` respeitado: mostra o poster parado, sem animar.
* `aria-live` + `role="progressbar"`: leitores de tela anunciam "Carregando".

## 4. Testar localmente

```bash
cd GUILHERMEFMAGA-SITE
python3 -m http.server 8000 --bind 0.0.0.0
# abra http://localhost:8000/loading.html
```

`loading.html` é a prévia viva (loop de demonstração já incluído em `assets/loading/demo/`).
Troque os `data-*` para `assets/loading/loader.mp4` depois de rodar o passo 1 e vê o seu vídeo
no lugar do demo, com o mesmo comportamento.
