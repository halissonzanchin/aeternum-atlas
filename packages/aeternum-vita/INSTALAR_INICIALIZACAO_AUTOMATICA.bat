@echo off
chcp 65001 > nul
title Instalar Inicializacao Automatica — Aeternum Vita
cls
echo ==============================================================================
echo   ⚙️  CONFIGURACAO DE INICIALIZACAO AUTOMATICA NO BOOT DO WINDOWS
echo ==============================================================================
echo.
echo Criando tarefa no Agendador de Tarefas do Windows (AeternumVitaServer)...
schtasks /create /tn "AeternumVitaServer" /tr "wscript.exe \"C:\Users\halis\OneDrive\Documentos\Aeternum Atlas - Codex\aeternum-vita\START_AETERNUM_VITA_SILENT.vbs\"" /sc onlogon /rl highest /f

if %errorlevel% equ 0 (
    echo.
    echo [SUCESSO] O Servidor de IA iniciara automaticamente sempre que o Windows ligar!
) else (
    echo.
    echo [AVISO] Execute como Administrador para registrar a inicializacao automatica.
)
echo.
echo ==============================================================================
echo   Pressione qualquer tecla para sair...
echo ==============================================================================
pause > nul
