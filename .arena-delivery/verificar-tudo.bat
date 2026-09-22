@echo off
REM ============================================================
REM VERIFICAR-TUDO - exame completo em um duplo clique.
REM Roda raio-x, portao antigo e portao de evolucao.
REM Nao mexe no codigo nem promove mudancas.
REM ============================================================
cd /d "%~dp0"
echo === SUPER AGENTE - VERIFICAR-TUDO ===
echo.

echo === RAIO-X: corpo inteiro ===
python testes\raio_x.py
if not %errorlevel%==0 goto raio_falhou
echo [ok] raio-x: corpo sem problemas
echo.

echo === EVOLUCAO: prova das 75 ideias governadas ===
python testes\testar_evolucao.py
if not %errorlevel%==0 goto evolucao_falhou
echo [ok] evolucao: matriz e primitivas governadas
echo.

echo === PORTAO: prova das regras no mundo falso ===
python testes\testar_regras.py
if not %errorlevel%==0 goto portao_falhou
echo.
echo === VEREDITO: tudo verde. Pode salvar no GitHub. ===
echo.
pause
exit /b 0

:raio_falhou
echo.
echo === VEREDITO: o raio-x achou problemas. NAO salve ainda. ===
echo.
pause
exit /b 1

:evolucao_falhou
echo.
echo === VEREDITO: o portao de evolucao barrou. NAO salve ainda. ===
echo.
pause
exit /b 1

:portao_falhou
echo.
echo === VEREDITO: o portao barrou. NAO salve ainda. ===
echo.
pause
exit /b 1
