#!/bin/bash
# fotografa o interior de vários lugares. uso: bash fotos_lugares.sh <prefixo> <criterio>...
pre=$1; shift
for c in "$@"; do
  nome=$(echo "$c" | tr ':' '_')
  node interior.js ${pre}_$nome $c 2>&1 | grep -i "erro\|error\|não achei" | head -2
done
