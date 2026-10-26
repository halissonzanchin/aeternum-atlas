<#
.SYNOPSIS
    Script de Verificacao da Cadeia de Saude de Conectividade (Fase 3B).
.DESCRIPTION
    Audita o estado dos 4 niveis operacionais:
    1. Ollama (127.0.0.1:11434)
    2. Atlas Daemon Rust (127.0.0.1:14555)
    3. Aeternum AI Gateway (127.0.0.1:8081)
    4. Conexao Externa (quando configurada)
#>

[CmdletBinding()]
param(
    [string]$OllamaUrl = "http://127.0.0.1:11434",
    [string]$DaemonUrl = "http://127.0.0.1:14555",
    [string]$GatewayUrl = "http://127.0.0.1:8081",
    [string]$ExternalUrl = ""
)

$ErrorActionPreference = "Continue"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTICO DE SAUDE DA CADEIA DE CONECTIVIDADE P0             " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. OLLAMA
Write-Host "`n[Nivel 1] Ollama Local (LLM Engine)..." -ForegroundColor Yellow
try {
    $ollamaTags = Invoke-RestMethod -Uri "$OllamaUrl/api/tags" -Method Get -TimeoutSec 3
    $models = $ollamaTags.models | ForEach-Object { $_.name }
    Write-Host "  [OK] Ollama ativo em $OllamaUrl" -ForegroundColor Green
    Write-Host "  -> Modelos disponiveis: $($models -join ', ')" -ForegroundColor Gray
} catch {
    Write-Host "  [FALHA] Ollama nao respondeu em $OllamaUrl ($($_.Exception.Message))" -ForegroundColor Red
}

# 2. ATLAS DAEMON RUST
Write-Host "`n[Nivel 2] Atlas Daemon Rust (Inference & Queue Core)..." -ForegroundColor Yellow
try {
    $daemonHealth = Invoke-RestMethod -Uri "$DaemonUrl/v1/health" -Method Get -TimeoutSec 3
    Write-Host "  [OK] Atlas Daemon ativo em $DaemonUrl" -ForegroundColor Green
    Write-Host "  -> Status: $($daemonHealth.status)" -ForegroundColor Gray
    Write-Host "  -> Active Tasks: $($daemonHealth.active_tasks)" -ForegroundColor Gray
} catch {
    Write-Host "  [FALHA] Atlas Daemon nao respondeu em $DaemonUrl ($($_.Exception.Message))" -ForegroundColor Red
}

# 3. AETERNUM AI GATEWAY
Write-Host "`n[Nivel 3] Aeternum AI Gateway Intermediario (Porta 8081)..." -ForegroundColor Yellow
try {
    $gwHealth = Invoke-RestMethod -Uri "$GatewayUrl/health" -Method Get -TimeoutSec 3
    Write-Host "  [OK] AI Gateway ativo em $GatewayUrl" -ForegroundColor Green
    Write-Host "  -> Status: $($gwHealth.status)" -ForegroundColor Gray
} catch {
    Write-Host "  [FALHA] AI Gateway nao respondeu em $GatewayUrl ($($_.Exception.Message))" -ForegroundColor Red
}

# 4. EXTERNAL TUNNEL (se fornecido)
if ($ExternalUrl) {
    Write-Host "`n[Nivel 4] Conexao Externa via Cloudflare Tunnel ($ExternalUrl)..." -ForegroundColor Yellow
    try {
        $extHealth = Invoke-RestMethod -Uri "$ExternalUrl/health" -Method Get -TimeoutSec 5
        Write-Host "  [OK] Endpoint externo respondeu: $($extHealth.status)" -ForegroundColor Green
    } catch {
        Write-Host "  [FALHA / AGUARDANDO ATIVACAO] Endpoint externo inacessivel: $($_.Exception.Message)" -ForegroundColor Magenta
    }
} else {
    Write-Host "`n[Nivel 4] Conexao Externa via Cloudflare Tunnel..." -ForegroundColor Yellow
    Write-Host "  -> Aguardando autorizacao para ativacao do tunel nomeado." -ForegroundColor Gray
}

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "  Diagnostico concluido.                                         " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
