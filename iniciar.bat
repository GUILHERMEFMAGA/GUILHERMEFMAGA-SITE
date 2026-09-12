@echo off
cd /d "%~dp0"
title Super Agente PC

REM ===== PROTECAO: este arquivo so deve ser aberto como "iniciar.bat" =====
REM Se voce clicou numa COPIA (iniciar_novo.bat, iniciar - copia.bat etc.),
REM eu nao rodo por aqui: aviso e abro o iniciar.bat certo. Rodar por uma
REM copia deixava dois agentes abertos e bagunçava a atualizacao.
if /i not "%~nx0"=="iniciar.bat" (
    echo.
    echo   Este arquivo e uma COPIA ^(%~nx0^), nao o inicializador oficial.
    echo   O certo e sempre abrir:  iniciar.bat
    echo   Abrindo o iniciar.bat pra voce...
    echo.
    if exist "%~dp0iniciar.bat" (
        start "" "%~dp0iniciar.bat"
    ) else (
        echo   Nao achei o iniciar.bat nesta pasta. Renomeie este arquivo para iniciar.bat
        pause
    )
    exit /b
)

REM Limpa restos de atualizacoes antigas que ficaram clicaveis por engano
if exist "iniciar_novo.bat" del /q "iniciar_novo.bat" >nul 2>&1

REM Pede privilegio de Administrador se nao estiver elevado
REM (r44: repassa os argumentos, ex.:  iniciar.bat atualizar  continua "atualizar" depois do UAC)
net session >nul 2>&1
if errorlevel 1 (
    echo Pedindo permissao de Administrador...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -ArgumentList '%*' -Verb RunAs"
    exit /b
)

REM ===== ATUALIZACAO AUTOMATICA DO AGENTE (r44: com validade de 12 horas) =====
REM Baixa a versao mais nova do agente.py direto do GitHub, assim voce NAO
REM precisa copiar/colar arquivo nenhum. Mas verificar a cada duplo clique
REM custava um download de ~1,5 MB + compilacao TODA abertura e atrasava o
REM arranque. Agora o carimbo ".ultima_verificacao" vale 12 horas: dentro do
REM prazo o agente abre DIRETO, sem rede. Para forcar agora, rode:
REM      iniciar.bat atualizar
REM (ou apague o arquivo .ultima_verificacao). SEM_ATUALIZAR.txt continua
REM valendo: se existir, nada e baixado.

if exist "SEM_ATUALIZAR.txt" goto depois_atualizacao
if /i not "%~1"=="atualizar" goto checar_prazo
if exist ".ultima_verificacao" del /q ".ultima_verificacao" >nul 2>&1
echo Modo atualizar: verificando agora mesmo...

:fazer_verificacao
echo Verificando atualizacoes do agente...
powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; try { Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/GUILHERMEFMAGA/GUILHERMEFMAGA-SITE/arena/01a08d8e-guilhermefmaga-site/agente.py?cache=%RANDOM%' -OutFile 'agente_novo.py' -UseBasicParsing -TimeoutSec 20; if ((Get-Item 'agente_novo.py').Length -gt 50000) { python -m py_compile agente_novo.py; if ($LASTEXITCODE -ne 0) { Remove-Item 'agente_novo.py' -ErrorAction SilentlyContinue; throw 'Python baixado invalido' }; if ((Test-Path 'agente.py') -and ((Get-FileHash 'agente_novo.py').Hash -eq (Get-FileHash 'agente.py').Hash)) { Remove-Item 'agente_novo.py'; Write-Host 'Agente ja esta atualizado.'; exit 0 }; if (Test-Path 'agente.py') { Copy-Item 'agente.py' 'agente_backup.py' -Force }; Move-Item 'agente_novo.py' 'agente.py' -Force; Write-Host 'Agente atualizado para a versao mais nova.' } else { Remove-Item 'agente_novo.py' -ErrorAction SilentlyContinue; Write-Host 'Download incompleto; usando a versao atual.' } } catch { Write-Host 'Sem internet/falha ao baixar; usando a versao que ja esta aqui.'; exit 1 }"
if errorlevel 1 goto verificar_bat
type nul > ".ultima_verificacao"

:verificar_bat
REM ===== AUTO-ATUALIZACAO DESTE PROPRIO ARQUIVO =====
REM Um .bat nao pode se sobrescrever enquanto roda (corromperia a execucao).
REM Entao baixamos para um arquivo .tmp - de proposito SEM extensao .bat,
REM pra ninguem clicar nele por engano - e trocamos na ULTIMA linha, junto
REM com o exit; depois disso o cmd nao le mais nada do arquivo.
powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; try { Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/GUILHERMEFMAGA/GUILHERMEFMAGA-SITE/arena/01a08d8e-guilhermefmaga-site/iniciar.bat?cache=%RANDOM%' -OutFile '_atualizacao_iniciar.tmp' -UseBasicParsing -TimeoutSec 20; if ((Get-Item '_atualizacao_iniciar.tmp').Length -lt 800) { Remove-Item '_atualizacao_iniciar.tmp' -Force } elseif ((Get-FileHash '_atualizacao_iniciar.tmp').Hash -eq (Get-FileHash 'iniciar.bat').Hash) { Remove-Item '_atualizacao_iniciar.tmp' -Force } else { Write-Host 'Ha uma versao nova do iniciar.bat: aplico sozinho quando voce fechar (voce nao precisa fazer nada).' } } catch { Remove-Item '_atualizacao_iniciar.tmp' -ErrorAction SilentlyContinue }"
goto depois_atualizacao

:checar_prazo
if not exist ".ultima_verificacao" goto fazer_verificacao
powershell -NoProfile -Command "$h=((Get-Date)-(Get-Item '.ultima_verificacao').LastWriteTime).TotalHours; exit ([int]($h -ge 12))"
if errorlevel 1 goto fazer_verificacao
echo Atualizacao verificada nas ultimas 12 horas - abrindo direto.
echo Para forcar a verificacao agora: feche e rode   iniciar.bat atualizar

:depois_atualizacao

REM Garante as bibliotecas das IAs (r44: checagem SEM importar a biblioteca —
REM importar langchain so para ver se existe custava segundos a cada abertura;
REM find_spec olha a existencia em milissegundos)
python -c "import importlib.util as _u; import sys; sys.exit(0 if _u.find_spec('langchain_openai') else 1)"
if errorlevel 1 (
    echo Instalando bibliotecas das IAs, aguarde...
    python -m pip install -q langchain-openai langchain-google-genai
)
REM Garante tambem a do Gemini (Google) - so instala se faltar
python -c "import importlib.util as _u; import sys; sys.exit(0 if _u.find_spec('langchain_google_genai') else 1)"
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
if exist "_atualizacao_iniciar.tmp" (move /y "_atualizacao_iniciar.tmp" "iniciar.bat" >nul & exit)
