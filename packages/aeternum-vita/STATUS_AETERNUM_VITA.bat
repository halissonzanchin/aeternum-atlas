@echo off
chcp 65001 > nul
title Status do Servidor de IA — Aeternum Vita & Aeternum Atlas
cls
echo ==============================================================================
echo   🏛️  PAINEL DE STATUS DO SERVIDOR DE IA — AETERNUM ATLAS ^& VITA
echo ==============================================================================
echo.
echo [1/3] Verificando Containers Docker...
echo ------------------------------------------------------------------------------
docker ps --format "table {{.Names}}	{{.Status}}	{{.Ports}}" | findstr /i "aeternum livekit speaches ollama"
if %errorlevel% neq 0 (
    echo [!] Nenhum container da Aeternum Vita detectado em execucao.
) else (
    echo [OK] Containers operando normalmente.
)
echo.
echo [2/3] Verificando Tunel Cloudflare...
echo ------------------------------------------------------------------------------
tasklist /fi "imagename eq cloudflared.exe" | findstr /i "cloudflared.exe" > nul
if %errorlevel% equ 0 (
    echo [OK] Tunel Cloudflare ativo em background.
) else (
    echo [!] Tunel Cloudflare nao detectado.
)
echo.
echo [3/3] Testando Endpoint WebRTC LiveKit Local (Porta 7880)...
echo ------------------------------------------------------------------------------
curl -s http://localhost:7880 > nul
if %errorlevel% equ 0 (
    echo [OK] Servidor LiveKit respondendo perfeitamente na porta 7880.
) else (
    echo [!] Servidor LiveKit inacessivel na porta 7880.
)
echo.
echo ==============================================================================
echo   Pressione qualquer tecla para fechar este painel de status...
echo ==============================================================================
pause > nul
