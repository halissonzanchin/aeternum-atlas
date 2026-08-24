@echo off
chcp 65001 >nul
title Aeternum Vita — Tutores IA de Voz (LiveKit Community)

echo ======================================================================
echo           AETERNUM VITA — TUTOR DE VOZ AUTO-HOSPEDADO
echo         LiveKit Community + Speaches + Ollama (Zero Créditos)
echo ======================================================================
echo.

cd /d "C:\Users\halis\OneDrive\Documentos\Aeternum Atlas - Codex\aeternum-vita"

echo [1/3] Verificando Docker Desktop...
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] O Docker Desktop não está em execução.
    echo Por favor, inicie o Docker Desktop e execute este script novamente.
    echo.
    pause
    exit /b 1
)
echo [OK] Docker Desktop ativo.
echo.

echo [2/3] Inicializando stack local de containers...
docker compose --env-file .env.local up -d
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao iniciar os containers Docker.
    pause
    exit /b 1
)
echo [OK] Containers iniciados com sucesso!
echo.

echo [3/3] Abrindo o console no navegador...
timeout /t 3 >nul
start http://localhost:8080

echo.
echo ======================================================================
echo   Aeternum Vita está pronto e ativo em: http://localhost:8080
echo.
echo   Tutores disponíveis:
echo     - Eduardo  (Português do Brasil)
echo     - Antonia  (Español Nativo)
echo     - Ariana   (English - US)
echo     - Fabian   (Deutsch Hochdeutsch)
echo.
echo   Para encerrar os serviços futuramente, execute:
echo   docker compose down
echo ======================================================================
echo.
pause
