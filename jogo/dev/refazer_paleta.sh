#!/bin/bash
# refaz a paleta fixa do jogo com as imagens ATUAIS (mundo em 8 horas do dia + salas) e grava out/paleta_192.json
# uso: bash refazer_paleta.sh      (leva alguns minutos; rode em segundo plano: nohup bash refazer_paleta.sh > out/refazer.log 2>&1 &)
# depois: python3 aplicar_paleta.py   (troca a lista FIXA dentro de paleta.js)
cd "$(dirname "$0")"
export OUTDIR=$PWD/out/
rm -rf out/frames; mkdir -p out/frames; rm -f out/refit.fim
node amostra.js > out/amostra.log 2>&1;            echo "mundo: $(grep -c '^ok' out/amostra.log) fotos"
for g in a b c; do node amostra_salas.js $g > out/amostra_$g.log 2>&1; echo "salas $g: $(grep -c '^ok' out/amostra_$g.log) fotos"; done
node pal_fit.js 192 out/paleta_192.json > out/pal_fit.log 2>&1; tail -2 out/pal_fit.log
echo fim > out/refit.fim
