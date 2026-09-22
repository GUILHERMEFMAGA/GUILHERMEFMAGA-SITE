@echo off
REM ============================================================
REM PUXAR-ATUALIZACAO - traz da PONTE o que o parceiro (Arena)
REM publicou. A ponte e o repo do site (GUILHERMEFMAGA-SITE),
REM branch super-agente. Duplo clique quando o parceiro avisar.
REM Este .bat e do HUMANO. Puxar atualizacao exige mao humana:
REM o duplo-clique e o "sim" que deixa codigo novo entrar no PC.
REM ============================================================
cd /d "%~dp0"
echo.
echo === SUPER AGENTE - PUXAR-ATUALIZACAO (ponte) ===
echo.

git pull --ff-only site super-agente
if not %errorlevel%==0 (
  echo.
  echo O pull nao rolou. Isso e NORMAL em dois casos:
  echo  1) Voce mexeu em arquivos sem salvar - rode o salvar-tudo.bat e depois este aqui de novo.
  echo  2) Sem internet - conecte e tente de novo.
  echo.
  echo Nada mudou no seu PC. Pode fechar esta janela sem medo.
  echo.
  pause
  exit /b 1
)

echo.
echo === PRONTO: ponte e arquivos em dia. ===
echo (Se leu "Already up to date.", nao havia nada novo - pode fechar.)
echo Se vieram arquivos novos, rode o verificar-tudo.bat para o exame de saude.
echo.
pause
