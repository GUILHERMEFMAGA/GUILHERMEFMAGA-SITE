@echo off
REM ============================================================
REM TICK - o porteiro bate ponto. Nao abre janela, nao toca na
REM fila: compara as pastas vigiadas com o snapshot e anota o
REM que chegou (reacoes so pelo vocabulario aprovado).
REM Para virar relogio automatico agende (uma linha, sem admin):
REM schtasks /Create /TN "SuperAgente Tick" /TR "C:\super-agente\tick.bat" /SC MINUTE /MO 15 /F
REM ============================================================
cd /d "%~dp0"
python agente\loop.py --so-olhar --vigiar --evoluir --trava-velha >> memoria\vigia.log 2>&1