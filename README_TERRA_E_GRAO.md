# TERRA & GRÃO — A Arte Brasileira do Café

Experiência imersiva, sensorial e informativa sobre todo o processo de produção do café no Brasil. Site completo com **30 páginas únicas**, identidade visual luxo rústico + minimalismo moderno.

Visual: https://8000-....e2b.app (preview)

## Como rodar
```bash
python3 -m http.server 8000 --bind 0.0.0.0
# abrir http://localhost:8000
```

## Estrutura
- `index.html` — shell SPA + loading + cursor + particles + header + curtain
- `css/style.css` — design system completo (paleta, botões 5 tipos, animações, glassmorphism)
- `js/pages.js` — 30 páginas (HTML templates)
- `js/app.js` — router, GSAP ScrollTrigger, particle system, cursor, globe, mapa, etc.
- `paginas/01.html ... 30.html` — páginas standalone (redirect)
- `sitemap.xml` / `robots.txt`

## 30 Páginas
Cap.1 Origens (01-03), Cap.2 Regiões (04-06), Cap.3 Variedades (07-08), Cap.4 Cultivo (09-11), Cap.5 Florada (12-13), Cap.6 Colheita (14-15), Cap.7 Processamento (16-18), Cap.8 Secagem (19-20), Cap.9 Qualidade (21-22), Cap.10 Torra (23-24), Cap.11 Preparo (25-26), Cap.12 Futuro (27-30).

## Tecnologias
GSAP + ScrollTrigger, Canvas particles, CSS glassmorphism, parallax, typewriter, tilt 3D, analog clock.

