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

REM Garante as bibliotecas das IAs (instala se faltar)
python -c "import langchain_openai" 2>nul
if errorlevel 1 (
    echo Instalando bibliotecas das IAs, aguarde...
    python -m pip install -q langchain-openai langchain-google-genai
)
REM Garante tambem a do Gemini (Google) - so instala se faltar
python -c "import langchain_google_genai" 2>nul
if errorlevel 1 (
    echo Instalando biblioteca do Gemini, aguarde...
    python -m pip install -q langchain-google-genai
)

REM Roda o agente que esta no arquivo agente.py (nesta mesma pasta)
python agente.py

echo.
echo O agente foi encerrado.
pause
