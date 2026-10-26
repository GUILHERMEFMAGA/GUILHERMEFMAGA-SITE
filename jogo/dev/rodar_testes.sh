#!/bin/bash
# roda a bateria de testes do jogo (leva alguns minutos).
# uso:  cd jogo/dev && (nohup bash rodar_testes.sh > out/testes.log 2>&1 &)      -> acompanhe com: tail out/testes.log   (termina com a linha "FIM")
cd "$(dirname "$0")"; export OUTDIR=$PWD/out/; mkdir -p out
for par in stab.js:400 publicos_teste.js:170 casa_acoes.js:170 reach.js:120 mansao_teste.js:170; do
  t=${par%%:*}; lim=${par##*:}; [ -f "$t" ] || continue
  timeout $lim node $t > out/${t%.js}.log 2>&1
  echo "== $t (saída $?) =="; tail -n 3 out/${t%.js}.log | cut -c1-160
done
echo FIM
