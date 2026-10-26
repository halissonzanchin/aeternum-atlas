<#
.SYNOPSIS
    Script Supervisionado de Preparacao do Cloudflare Tunnel (Fase 3A).
.DESCRIPTION
    Prepara o ambiente local para instalacao do cloudflared como servico Windows,
    sem ativar exposicao externa antecipada.
#>

[CmdletBinding()]
param(
    [string]$InstallDir = "C:\tools\cloudflared",
    [string]$ConfigDir = "$env:USERPROFILE\.cloudflared"
)

$ErrorActionPreference = "Stop"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  PREPARACAO SUPERVISIONADA DO CLOUDFLARED (FASE 3A)             " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. VERIFICAR DIRETORIOS
Write-Host "`n[1/3] Verificando estrutura de diretorios locais..." -ForegroundColor Yellow
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Write-Host "  -> Diretorio de instalacao criado: $InstallDir" -ForegroundColor Green
} else {
    Write-Host "  -> Diretorio de instalacao existente: $InstallDir" -ForegroundColor Green
}

if (-not (Test-Path $ConfigDir)) {
    New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
    Write-Host "  -> Diretorio de configuracao criado: $ConfigDir" -ForegroundColor Green
} else {
    Write-Host "  -> Diretorio de configuracao existente: $ConfigDir" -ForegroundColor Green
}

# 2. VERIFICAR PRESENCA DO BINARIO
Write-Host "`n[2/3] Verificando executavel cloudflared..." -ForegroundColor Yellow
$cloudflaredExe = Join-Path $InstallDir "cloudflared.exe"

if (Test-Path $cloudflaredExe) {
    $versionOutput = & $cloudflaredExe --version
    Write-Host "  -> cloudflared ja esta presente: $versionOutput" -ForegroundColor Green
} else {
    Write-Host "  -> cloudflared.exe ainda nao baixado." -ForegroundColor Magenta
    Write-Host "  -> URL oficial de download da Cloudflare:" -ForegroundColor Gray
    Write-Host "     https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -ForegroundColor Gray
    Write-Host "  -> [COMANDO DE INSTALACAO FUTURO (REQUER APROVACAO)]:" -ForegroundColor Yellow
    Write-Host "     Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '$cloudflaredExe'" -ForegroundColor Yellow
}

# 3. VERIFICAR PRE-REQUISITOS DO GATEWAY LOCAL
Write-Host "`n[3/3] Verificando pre-requisitos do Gateway Local (127.0.0.1:8081)..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8081/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  -> Gateway Local esta ONLINE e SAUDAVEL ($($health.status))." -ForegroundColor Green
    Write-Host "  -> O tunel podera se conectar a http://127.0.0.1:8081 com seguranca." -ForegroundColor Green
} catch {
    Write-Host "  -> Gateway Local esta OFFLINE ou indisponivel em 8081." -ForegroundColor Magenta
}

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "  Preparacao concluida. Nenhum tunel foi exposto publicamente.   " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
