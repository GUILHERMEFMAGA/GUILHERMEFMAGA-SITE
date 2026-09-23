@echo off
REM ============================================================
REM PUXAR-ATUALIZACAO v3 - traz da PONTE o que o parceiro Arena
REM publicou. A ponte e o repo do site (GUILHERMEFMAGA-SITE),
REM branch super-agente. Duplo clique na pasta amarela do Windows
REM (Explorador de Arquivos) quando o parceiro avisar.
REM Este .bat e do HUMANO. Puxar atualizacao exige mao humana:
REM o duplo-clique e o "sim" que deixa codigo novo entrar no PC.
REM v3: sem parenteses dentro de blocos if - o cmd fecha o bloco
REM no primeiro ")" que ve, ate dentro de echo. Fluxo por goto.
REM ============================================================
cd /d "%~dp0"
echo.
echo === SUPER AGENTE - PUXAR-ATUALIZACAO - ponte ===
echo.

git pull --ff-only site super-agente
if %errorlevel%==0 goto pronto

echo.
echo O pull nao rolou. Isso e NORMAL em dois casos:
echo  - Voce mexeu em arquivos sem salvar: rode o salvar-tudo.bat e volte aqui.
echo  - Sem internet: conecte e tente de novo.
echo.
echo Nada mudou no seu PC. Pode fechar esta janela sem medo.
echo.
pause
exit /b 1

:pronto
echo.
echo === PRONTO: ponte e arquivos em dia. ===
echo Se leu "Already up to date.", nao havia nada novo - pode fechar.
echo Se vieram arquivos novos, rode o verificar-tudo.bat para o exame de saude.
echo.
pause
