@echo off
chcp 65001 >nul
title Aeternum Vita — Túnel Seguro de Voz (Cloudflare Tunnel)

echo ======================================================================
echo           AETERNUM VITA — TÚNEL SEGURO DE VOZ (CLOUDFLARE)
echo   Conectando o LiveKit Local (porta 7880) à Internet (HTTPS/WSS)
echo ======================================================================
echo.

set CLOUDFLARED="C:\Users\halis\OneDrive\Documentos\Aeternum Atlas - Codex\aeternum-vita\tools\cloudflared.exe"

if not exist %CLOUDFLARED% (
    echo [ERRO] Binário cloudflared.exe não encontrado!
    pause
    exit /b 1
)

echo [1/2] Iniciando túnel seguro para o LiveKit (http://localhost:7880)...
echo.
echo Copie a URL gerada abaixo (ex: https://xxxx.trycloudflare.com) e
echo configure-a como LIVEKIT_URL no Vercel e no Supabase.
echo.
echo ======================================================================
%CLOUDFLARED% tunnel --url http://localhost:7880
pause
