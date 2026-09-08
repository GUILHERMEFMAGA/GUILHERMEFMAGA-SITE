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
REM Baixa a versao mais nova do agente.py direto do GitHub, assim voce NAO
REM precisa copiar/colar arquivo nenhum. Se nao tiver internet (ou o download
REM falhar), usa o arquivo que ja esta na pasta.
REM Para pular a atualizacao uma vez, crie um arquivo chamado SEM_ATUALIZAR.txt
if not exist "SEM_ATUALIZAR.txt" (
    echo Verificando atualizacoes do agente...
    powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; try { Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/GUILHERMEFMAGA/GUILHERMEFMAGA-SITE/arena/01a07ce2-guilhermefmaga-site/agente.py' -OutFile 'agente_novo.py' -UseBasicParsing -TimeoutSec 20; if ((Get-Item 'agente_novo.py').Length -gt 50000) { if (Test-Path 'agente.py') { Copy-Item 'agente.py' 'agente_backup.py' -Force }; Move-Item 'agente_novo.py' 'agente.py' -Force; Write-Host 'Agente atualizado para a versao mais nova.' } else { Remove-Item 'agente_novo.py' -ErrorAction SilentlyContinue; Write-Host 'Download incompleto; usando a versao atual.' } } catch { Write-Host 'Sem internet/falha ao baixar; usando a versao que ja esta aqui.' }"

    REM ===== AUTO-ATUALIZACAO DESTE PROPRIO ARQUIVO =====
    REM Um .bat nao pode se sobrescrever enquanto roda (corromperia a execucao).
    REM Entao baixamos para iniciar_novo.bat e trocamos na ULTIMA linha, junto
    REM com o exit - depois disso o cmd nao le mais nada do arquivo.
    powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; try { Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/GUILHERMEFMAGA/GUILHERMEFMAGA-SITE/arena/01a07ce2-guilhermefmaga-site/iniciar.bat' -OutFile 'iniciar_novo.bat' -UseBasicParsing -TimeoutSec 20; if ((Get-Item 'iniciar_novo.bat').Length -lt 800) { Remove-Item 'iniciar_novo.bat' -Force } elseif ((Get-FileHash 'iniciar_novo.bat').Hash -eq (Get-FileHash 'iniciar.bat').Hash) { Remove-Item 'iniciar_novo.bat' -Force } else { Write-Host 'Ha uma versao nova do iniciar.bat: aplico automaticamente ao fechar.' } } catch { Remove-Item 'iniciar_novo.bat' -ErrorAction SilentlyContinue }"
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

REM ULTIMA LINHA: troca este arquivo pela versao nova (se houver) e sai na
REM mesma linha, para o cmd nao tentar ler mais nada de um arquivo trocado.
if exist "iniciar_novo.bat" (move /y "iniciar_novo.bat" "iniciar.bat" >nul & exit)
