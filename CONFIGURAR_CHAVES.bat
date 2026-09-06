@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Configurar chaves do Super Agente

echo ==================================================
echo   CONFIGURADOR DE CHAVES DO SUPER AGENTE
echo ==================================================
echo.

REM Se o arquivo de chaves ainda nao existe, cria a partir do exemplo.
if not exist "chaves.txt" (
    if exist "chaves_EXEMPLO.txt" (
        copy /y "chaves_EXEMPLO.txt" "chaves.txt" >nul
        echo Arquivo chaves.txt criado a partir do exemplo.
    ) else (
        echo ERRO: nao encontrei o chaves_EXEMPLO.txt nesta pasta.
        pause
        exit /b
    )
) else (
    echo Ja existe um chaves.txt - vou abrir ele para voce.
)

echo.
echo Vou abrir o arquivo no Bloco de Notas.
echo.
echo   1) Cole cada chave depois do sinal de igual (=), sem aspas.
echo      Exemplo:  GROQ_API_KEY=gsk_1234abcd...
echo   2) As chaves sao GRATIS e sem cartao. Pegue nos links escritos
echo      no proprio arquivo (Groq, Cerebras, Gemini...).
echo   3) Salve com Ctrl+S e feche o Bloco de Notas.
echo.
echo VOCE NAO PRECISA PREENCHER TUDO: mesmo vazio o agente funciona
echo com IAs gratuitas que nao pedem cadastro.
echo.
pause

notepad.exe "chaves.txt"

echo.
echo Obrigado! Agora vou iniciar o agente...
echo (Se ele abrir de novo o Notepad, e porque voce nao fechou - feche
echo  a janela do Bloco de Notas que o agente continua.)
echo.
timeout /t 2 >nul

REM Inicia o agente pelo iniciar.bat (que ja pede admin e instala o que falta)
call "%~dp0iniciar.bat"
