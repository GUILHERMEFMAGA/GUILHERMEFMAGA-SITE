@echo off
REM ============================================================
REM PUXAR-ATUALIZACAO - traz do GitHub o que o parceiro (Arena)
REM publicou no main. Duplo clique depois do salvar-tudo e antes
REM do verificar-tudo.
REM Este .bat e do HUMANO. Puxar atualizacao exige mao humana:
REM o duplo-clique e o "sim" que deixa codigo novo entrar no PC.
REM ============================================================
cd /d "%~dp0"
echo.
echo === SUPER AGENTE - PUXAR-ATUALIZACAO ===
echo.

git pull --ff-only origin main
if not %errorlevel%==0 (
  echo.
  echo O pull nao rolou. Isso e NORMAL em dois casos:
  echo  1) Voce nao rodou o salvar-tudo antes - rode ele e depois este aqui de novo.
  echo  2) Sem internet - conecte e tente de novo.
  echo.
  echo Nada mudou no seu PC. Pode fechar esta janela sem medo.
  echo.
  pause
  exit /b 1
)

echo.
echo === PRONTO: arquivos em dia com o GitHub. ===
echo Agora rode o verificar-tudo.bat para o exame de saude.
echo.
pause