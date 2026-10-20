@echo off
REM ============================================================
REM VERIFICAR-TUDO - exame de saude completo em um duplo clique.
REM Roda o raio-x e o portao e da o veredito. Nao mexe no codigo.
REM ============================================================
cd /d "%~dp0"
echo === SUPER AGENTE - VERIFICAR-TUDO ===
echo.
python testes\raio_x.py
echo.
if %errorlevel%==0 (
  echo [ok] raio-x: corpo sem problemas
) else (
  echo [!] raio-x achou problemas - leia as linhas CONERTO acima
)
echo.
echo === PORTAO: prova das regras no mundo falso ===
python testes\testar_regras.py
echo.
if %errorlevel%==0 (
  echo === VEREDITO: tudo verde. Pode salvar no GitHub. ===
) else (
  echo === VEREDITO: o portao barrou. NAO salve ainda. ===
)
echo.
pause