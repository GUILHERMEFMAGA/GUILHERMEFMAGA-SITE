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
REM (repassa os argumentos, ex.:  iniciar.bat atualizar)
REM DICA: crie um ATALHO deste arquivo, abra Propriedades > Avancado >
REM "Executar como administrador" e use o atalho no dia a dia: pula o
REM PowerShell intermediario e o aviso aparece direto na hora.
net session >nul 2>&1
if errorlevel 1 goto pedir_admin
goto ja_admin

:pedir_admin
echo Pedindo permissao de Administrador...
REM r59: %* vazio nao pode virar -ArgumentList vazio (o PowerShell rejeita) e
REM r59: REM com parenteses DENTRO de bloco fecha o bloco antes da hora (bug r58).
REM r59: Por isso esta secao NAO usa blocos: so goto, if de uma linha e set.
set "R58_ARGS="
if not "%~1"=="" set "R58_ARGS=-ArgumentList '%*'"
powershell -NoProfile -Command "Start-Process -FilePath '%~f0' %R58_ARGS% -Verb RunAs"
exit /b

:ja_admin

REM ===== r49: CAMINHO RAPIDO COM UM PYTHON SO =====
REM O main.py decide TUDO dentro do proprio processo (carimbo de 12h +
REM bibliotecas) e so sai com codigo 7/8 quando precisa de algo. No dia a dia:
REM duplo clique = UM python que abre o agente direto, sem processo extra.
REM SEM_ATUALIZAR.txt continua mandando; "iniciar.bat atualizar" forca.

if exist "SEM_ATUALIZAR.txt" goto lancar
if /i not "%~1"=="atualizar" goto lancar
if exist ".ultima_verificacao" del /q ".ultima_verificacao" >nul 2>&1
echo Modo atualizar: verificando agora mesmo...
goto verificar_agora

:lancar
if not exist "main.py" goto lancar_antigo
python main.py
if errorlevel 8 goto instalar_libs
if errorlevel 7 goto verificar_agora
if errorlevel 1 goto quebrou
goto fim_normal

:lancar_antigo
REM Reserva de seguranca: se o main.py ainda nao chegou ao PC, roda o
REM agente.py direto (funciona sempre; sem bytecode em cache, so isso).
python agente.py
if errorlevel 1 goto quebrou
goto fim_normal

:quebrou
REM r57 (escudo de arranque): o agente fechou com erro. Antes o BAT encerrava
REM sem reparar; agora tenta 1 reparo (re-download oficial) e, se voltar a
REM falhar, PARA COM A JANELA ABERTA pedindo o print - nunca mais "entra e sai".
echo.
echo O agente fechou com um erro (o texto acima mostra o motivo).
if exist ".reparo_r57" goto errou_de_novo
type nul > ".reparo_r57"
echo Tentando REPARAR sozinho: baixando a versao oficial dos arquivos...
goto verificar_agora

:errou_de_novo
del /q ".reparo_r57" >nul 2>&1
echo Tentei reparar e o erro voltou. ME MANDE UM PRINT desta janela.
pause
goto fim_normal

:verificar_agora
echo Verificando atualizacoes do agente (uma vez a cada 12 horas)...
powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; try { Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/GUILHERMEFMAGA/GUILHERMEFMAGA-SITE/arena/01a08d8e-guilhermefmaga-site/agente.py?cache=%RANDOM%' -OutFile 'agente_novo.py' -UseBasicParsing -TimeoutSec 20; if ((Get-Item 'agente_novo.py').Length -gt 50000) { python -m py_compile agente_novo.py; if ($LASTEXITCODE -ne 0) { Remove-Item 'agente_novo.py' -ErrorAction SilentlyContinue; throw 'Python baixado invalido' }; if ((Test-Path 'agente.py') -and ((Get-FileHash 'agente_novo.py').Hash -eq (Get-FileHash 'agente.py').Hash)) { Remove-Item 'agente_novo.py'; Write-Host 'Agente ja esta atualizado.'; exit 0 }; if (Test-Path 'agente.py') { Copy-Item 'agente.py' 'agente_backup.py' -Force }; Move-Item 'agente_novo.py' 'agente.py' -Force; Write-Host 'Agente atualizado para a versao mais nova.' } else { Remove-Item 'agente_novo.py' -ErrorAction SilentlyContinue; Write-Host 'Download incompleto; usando a versao atual.' } } catch { Write-Host 'Sem internet/falha ao baixar; usando a versao que ja esta aqui.'; exit 1 }"
if errorlevel 1 goto verificar_bat
powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; try { Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/GUILHERMEFMAGA/GUILHERMEFMAGA-SITE/arena/01a08d8e-guilhermefmaga-site/main.py?cache=%RANDOM%' -OutFile 'main.py' -UseBasicParsing -TimeoutSec 20; if ((Get-Item 'main.py').Length -lt 100) { Remove-Item 'main.py' -ErrorAction SilentlyContinue; Write-Host 'main.py baixado estranho; mantive o que ja havia.' } else { Write-Host 'Lancador main.py em dia.' } } catch { Write-Host 'Sem internet para o main.py; usando o que ja esta aqui.' }"
type nul > ".ultima_verificacao"

:verificar_bat
REM ===== AUTO-ATUALIZACAO DESTE PROPRIO ARQUIVO =====
REM Um .bat nao pode se sobrescrever enquanto roda (corromperia a execucao).
REM Entao baixamos para um arquivo .tmp - de proposito SEM extensao .bat,
REM pra ninguem clicar nele por engano - e trocamos na ULTIMA linha, junto
REM com o exit; depois disso o cmd nao le mais nada do arquivo.
powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; try { Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/GUILHERMEFMAGA/GUILHERMEFMAGA-SITE/arena/01a08d8e-guilhermefmaga-site/iniciar.bat?cache=%RANDOM%' -OutFile '_atualizacao_iniciar.tmp' -UseBasicParsing -TimeoutSec 20; if ((Get-Item '_atualizacao_iniciar.tmp').Length -lt 800) { Remove-Item '_atualizacao_iniciar.tmp' -Force } elseif ((Get-FileHash '_atualizacao_iniciar.tmp').Hash -eq (Get-FileHash 'iniciar.bat').Hash) { Remove-Item '_atualizacao_iniciar.tmp' -Force } else { Write-Host 'Ha uma versao nova do iniciar.bat: aplico sozinho quando voce fechar (voce nao precisa fazer nada).' } } catch { Remove-Item '_atualizacao_iniciar.tmp' -ErrorAction SilentlyContinue }"
REM segue para lancar de novo (agora com o carimbo em dia)
goto lancar

:instalar_libs
REM main.py disse (codigo 8) que falta biblioteca: instala e recomeca.
echo Instalando bibliotecas das IAs, aguarde...
python -m pip install -q langchain-openai langchain-google-genai
goto lancar

:fim_normal
if exist ".reparo_r57" del /q ".reparo_r57" >nul 2>&1
echo.
echo O agente foi encerrado.
pause

REM ULTIMA LINHA: troca este arquivo pela versao nova (se houver) e sai na
REM mesma linha, para o cmd nao tentar ler mais nada de um arquivo trocado.
if exist "_atualizacao_iniciar.tmp" (move /y "_atualizacao_iniciar.tmp" "iniciar.bat" >nul & exit)
