@echo off
REM ============================================================
REM SALVAR-TUDO - o ritual do Git em um duplo clique.
REM Este .bat e do HUMANO. O agente nunca chama este arquivo:
REM salvar no Git so acontece com mao e vontade humanas.
REM Uso: duplo clique no Explorador, ou digite .\salvar-tudo.bat
REM no terminal do VS Code. A janela fecha so depois de qualquer tecla.
REM ============================================================
cd /d "%~dp0"
echo.
echo === SUPER AGENTE - SALVAR-TUDO ===
echo.

git add .
REM se nada novo foi preparado, encerra sem criar commit vazio
git diff --cached --quiet
if %errorlevel%==0 (
  echo Nada novo desde o ultimo salvamento. Arvore limpa.
  echo.
  pause
  exit /b 0
)

echo O que vai entrar no GitHub:
git status --short
echo.
git commit -m "salvar-tudo %date% %time%"
if not %errorlevel%==0 (
  echo O commit falhou. Leia a mensagem acima com calma antes de continuar.
  echo.
  pause
  exit /b 1
)

echo.
git push
if not %errorlevel%==0 (
  echo O push falhou - sem internet ou sem permissao?
  echo Entao abra o terminal do VS Code e rode: git push
  echo.
  pause
  exit /b 1
)

echo.
echo === PRONTO: salvo no GitHub. Pode fechar esta janela. ===
echo.
pause