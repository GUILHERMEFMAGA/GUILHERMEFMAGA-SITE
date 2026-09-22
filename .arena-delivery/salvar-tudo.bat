@echo off
REM ============================================================
REM SALVAR-TUDO - o ritual do Git em um duplo clique.
REM Este .bat e do HUMANO. O agente nunca chama este arquivo:
REM salvar no Git so acontece com mao e vontade humanas.
REM Versao 2 (ponte): empurra pro branch do parceiro (site,
REM super-agente) e pro backup (super-agente.git). Se a ponte
REM recusar "non-fast-forward", rode o puxar-atualizacao.bat
REM primeiro e volte aqui.
REM Uso: duplo clique no Explorador, ou digite .\salvar-tudo.bat
REM no terminal do VS Code. A janela fecha so depois de qualquer tecla.
REM ============================================================
cd /d "%~dp0"
echo.
echo === SUPER AGENTE - SALVAR-TUDO ===
echo.

git add .
REM se nada novo foi preparado, ainda assim confere a ponte antes de sair
git diff --cached --quiet
if %errorlevel%==0 (
  echo Nada novo desde o ultimo salvamento. Empurrando a arvore atual mesmo assim...
  echo.
  goto push
)

echo O que vai entrar no repositorio:
git status --short
echo.
git commit -m "salvar-tudo %date% %time%"
if not %errorlevel%==0 (
  echo O commit falhou. Leia a mensagem acima com calma antes de continuar.
  echo.
  pause
  exit /b 1
)

:push
echo.
echo === Push 1/2: ponte (repo do site, branch super-agente) ===
git push site main:super-agente
if not %errorlevel%==0 (
  echo.
  echo O push para a ponte falhou. Se viu "rejected" + "non-fast-forward",
  echo o parceiro publicou antes de voce: feche esta janela, rode o
  echo puxar-atualizacao.bat, e depois rode o salvar-tudo de novo.
  echo Se for falta de internet: reconecte e tente outra vez.
  echo.
  pause
  exit /b 1
)

echo.
echo === Push 2/2: backup (super-agente) ===
git push origin main
if not %errorlevel%==0 (
  echo O push do backup falhou - sem internet?
  echo Sem panico: a ponte ja esta salva. Quando religar, rode no terminal:
  echo git push origin main
)

echo.
echo === PRONTO: ponte sincronizada e backup salvo. Pode fechar esta janela. ===
echo.
pause
