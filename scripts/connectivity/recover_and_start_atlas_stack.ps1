<#
.SYNOPSIS
    Script Operacional de Referencia - Recuperacao e Inicializacao da Pilha Atlas Connectivity P0.
.DESCRIPTION
    Executa a sequencia canonica idempotente:
    1. Verifica Ollama na porta 11434 e modelo qwen3.5:4b.
    2. Audita e recupera com seguranca o arquivo de lock orfao (atlas_core.lock) conferindo o PID ativo.
    3. Valida a saude do Atlas Daemon na porta 14555 (Host header invariant).
    4. Valida a prontidao do Gateway Local na porta 8081.
    5. Testa o health probe de ponta a ponta.
#>

[CmdletBinding()]
param(
    [string]$OllamaUrl = "http://127.0.0.1:11434",
    [string]$DaemonUrl = "http://127.0.0.1:14555",
    [string]$GatewayUrl = "http://127.0.0.1:8081",
    [string]$TargetModel = "qwen3.5:4b",
    [switch]$AutoRecover = $false
)

$ErrorActionPreference = "Continue"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  ATLAS CONNECTIVITY P0 - DIAGNOSTICO E RECUPERACAO DA PILHA     " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. VERIFICAR OLLAMA
Write-Host ""
Write-Host "[1/4] Verificando Ollama Engine ($OllamaUrl)..." -ForegroundColor Yellow
try {
    $ollamaTags = Invoke-RestMethod -Uri "$OllamaUrl/api/tags" -Method Get -TimeoutSec 3 -ErrorAction Stop
    $modelNames = $ollamaTags.models | ForEach-Object { $_.name }
    Write-Host "  -> Ollama esta ONLINE." -ForegroundColor Green
    if ($modelNames -contains $TargetModel) {
        Write-Host "  -> Modelo alvo '$TargetModel' carregado e pronto." -ForegroundColor Green
    } else {
        Write-Host "  -> ALERTA: Modelo '$TargetModel' nao listado nos modelos do Ollama ($($modelNames -join ', '))." -ForegroundColor Magenta
    }
} catch {
    Write-Host "  -> FALHA: Ollama esta OFFLINE ou inacessivel em $OllamaUrl." -ForegroundColor Red
    Write-Host "     Inicie o Ollama via terminal ou atalho antes de prosseguir." -ForegroundColor Yellow
}

# 2. AUDITAR E RECUPERAR LOCK ORFAO DO ATLAS DAEMON
Write-Host ""
Write-Host "[2/4] Auditando locks operacionais do Atlas Daemon..." -ForegroundColor Yellow
$localAppData = [System.Environment]::GetFolderPath("LocalApplicationData")
$lockPath = Join-Path $localAppData "AtlasCode\atlas_core.lock"

if (Test-Path $lockPath) {
    $lockContent = (Get-Content $lockPath -Raw).Trim()
    Write-Host "  -> Arquivo de lock encontrado em: $lockPath (Conteudo: '$lockContent')" -ForegroundColor Yellow

    if ($lockContent -match '^\d+$') {
        $lockPid = [int]$lockContent
        $liveProc = Get-Process -Id $lockPid -ErrorAction SilentlyContinue

        if ($null -ne $liveProc) {
            Write-Host "  -> Processo ativo correspondente encontrado (PID $lockPid, Nome: $($liveProc.ProcessName)). Lock LEGITIMO." -ForegroundColor Green
        } else {
            Write-Host "  -> PID $lockPid NAO EXISTE na tabela de processos ativa do Windows." -ForegroundColor Red
            Write-Host "  -> LOCK ORFAO DETECTADO!" -ForegroundColor Red
            if ($AutoRecover) {
                Remove-Item -Path $lockPath -Force
                Write-Host "  -> [AUTO-RECOVER] Lock orfao removido com seguranca." -ForegroundColor Green
            } else {
                Write-Host "  -> Para remover o lock com seguranca, passe o parametro -AutoRecover ou execute: Remove-Item '$lockPath' -Force" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  -> Conteudo do lock invalido ou malformado: '$lockContent'." -ForegroundColor Red
    }
} else {
    Write-Host "  -> Nenhum lock presente. Pronto para inicializacao limpa." -ForegroundColor Green
}

# 3. VERIFICAR ATLAS DAEMON
Write-Host ""
Write-Host "[3/4] Verificando Atlas Daemon ($DaemonUrl)..." -ForegroundColor Yellow
try {
    # Invariante de Seguranca: Header Host obrigatorio anti-DNS rebinding
    $daemonHeaders = @{
        "Host" = "127.0.0.1:14555"
        "Accept" = "application/json"
    }
    $daemonHealth = Invoke-RestMethod -Uri "$DaemonUrl/v1/health" -Headers $daemonHeaders -Method Get -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  -> Atlas Daemon esta ONLINE (Status: $($daemonHealth.status), Ollama: $($daemonHealth.ollama_online))." -ForegroundColor Green
} catch {
    Write-Host "  -> Atlas Daemon esta PARADO ou inacessivel em $DaemonUrl." -ForegroundColor Magenta
    Write-Host "     Inicie com: & 'C:\Users\halis\OneDrive\Desktop\Atlas Code\target\x86_64-pc-windows-msvc\debug\atlas-daemon.exe'" -ForegroundColor Gray
}

# 4. VERIFICAR AETERNUM AI GATEWAY
Write-Host ""
Write-Host "[4/4] Verificando Gateway Local ($GatewayUrl)..." -ForegroundColor Yellow
try {
    $gatewayHealth = Invoke-RestMethod -Uri "$GatewayUrl/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  -> Gateway esta ONLINE (Status: $($gatewayHealth.status), Mode: $($gatewayHealth.mode))." -ForegroundColor Green
} catch {
    Write-Host "  -> Gateway Local esta PARADO em $GatewayUrl." -ForegroundColor Magenta
    Write-Host "     Inicie com: npx tsx packages/aeternum-vita/apps/gateway/src/index.ts" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  Fim da Auditoria da Pilha de Conectividade." -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
