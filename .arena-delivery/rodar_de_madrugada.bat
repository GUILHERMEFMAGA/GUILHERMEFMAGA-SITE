@echo off
REM Roda o agente sem voce (modo observacao). Nao faz git, nao se autopromove.
for /f "tokens=2 delims=:." %%a in ('chcp') do set "CP=%%a"
if not "%CP: =%"=="65001" chcp 65001 >nul
cd /d "%~dp0"
echo ===== inicio %date% %time% ===== >> memoria\agendado.log
python agente\loop.py --so-olhar --evoluir >> memoria\agendado.log 2>&1
echo ===== fim ===== >> memoria\agendado.log
REM teto do log: passou de 20.000 bytes, apaga (nao deixa o arquivo crescer pra sempre)
for %%A in (memoria\agendado.log) do if %%~zA GTR 20000 del memoria\agendado.log