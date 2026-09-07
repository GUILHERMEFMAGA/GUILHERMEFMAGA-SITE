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

REM ===== ATUALIZACAO AUTOMATICA DO AGENTE =====
REM Baixa a versao mais nova do agente.py e do iniciar.bat direto do GitHub,
REM assim voce NAO precisa mais copiar/colar arquivo nenhum. Se nao tiver
REM internet (ou o download falhar), usa o arquivo que ja esta na pasta.
REM Para pular a atualizacao uma vez, crie um arquivo chamado SEM_ATUALIZAR.txt
if not exist "SEM_ATUALIZAR.txt" (
    echo Verificando atualizacoes do agente...
    powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; try { Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/GUILHERMEFMAGA/GUILHERMEFMAGA-SITE/arena/01a07ce2-guilhermefmaga-site/agente.py' -OutFile 'agente_novo.py' -UseBasicParsing -TimeoutSec 20; if ((Get-Item 'agente_novo.py').Length -gt 50000) { if (Test-Path 'agente.py') { Copy-Item 'agente.py' 'agente_backup.py' -Force }; Move-Item 'agente_novo.py' 'agente.py' -Force; Write-Host 'Agente atualizado para a versao mais nova.' } else { Remove-Item 'agente_novo.py' -ErrorAction SilentlyContinue; Write-Host 'Download incompleto; usando a versao atual.' } } catch { Write-Host 'Sem internet/falha ao baixar; usando a versao que ja esta aqui.' }"
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
