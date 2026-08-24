@echo off
chcp 65001 > nul
title Parar Servidor de IA — Aeternum Vita
cls
echo ==============================================================================
echo   🛑  ENCERRANDO SERVIDOR DE IA DA AETERNUM VITA
echo ==============================================================================
echo.
echo [1/2] Parando containers Docker...
cd /d "C:\Users\halis\OneDrive\Documentos\Aeternum Atlas - Codex\aeternum-vita"
docker compose stop
echo [OK] Containers pausados. GPU e memoria liberadas.
echo.
echo [2/2] Finalizando processo do Tunel Cloudflare...
taskkill /f /im cloudflared.exe > nul 2>&1
echo [OK] Processos de rede finalizados com sucesso.
echo.
echo ==============================================================================
echo   Servidor de IA desativado. 100%% dos recursos da GPU estao livres!
echo ==============================================================================
timeout /t 3 > nul
