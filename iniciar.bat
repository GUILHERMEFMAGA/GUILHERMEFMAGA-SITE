@echo off
cd /d "%~dp0"
title Super Agente PC

REM Pede privilegio de Administrador se nao estiver elevado
net session >nul 2>&1
if errorlevel 1 (
    echo Pedindo permissao de Administrador...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

REM Garante a biblioteca das IAs (instala se faltar)
python -c "import langchain_openai" 2>nul
if errorlevel 1 (
    echo Instalando biblioteca das IAs, aguarde...
    python -m pip install -q langchain-openai
)

REM Roda o agente que esta no arquivo agente.py (nesta mesma pasta)
python agente.py

echo.
echo O agente foi encerrado.
pause
