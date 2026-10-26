<#
.SYNOPSIS
    Supervisor e Watchdog da Pilha Completa Atlas Connectivity P0 (Fases 3E -> 3F).
.DESCRIPTION
    Prepara, verifica e recupera de forma supervisionada e desacoplada do terminal (via WMI Win32_Process)
    os 4 niveis operacionais no HP Victus:
    1. Ollama (127.0.0.1:11434)
    2. Atlas Daemon Rust (127.0.0.1:14555, via copia isolada atlas-daemon-gateway-runtime.exe e LOCALAPPDATA isolado
       para zero colisao com a sessao paralela da IA cientifica, sincronizando auth_token e limpando locks JSON orfaos)
    3. Aeternum AI Gateway (127.0.0.1:8081, modo HYBRID_AUTH via cofre .gateway.env + certificados RS256 Cloudflare)
    4. Cloudflare Tunnel (atlas-victus-gateway, via --token-file sem expor segredos em linha de comando)
    Suporta execucao unica ou continua (-Continuous) protegida por Mutex de instancia unica.
#>

[CmdletBinding()]
param(
    [switch]$CheckOnly = $false,
    [switch]$StartMissing = $true,
    [switch]$Continuous = $false,
    [int]$IntervalSeconds = 20,
    [string]$VaultDir = "$env:USERPROFILE\.cloudflared"
)

if ($CheckOnly) { $StartMissing = $false }
$ErrorActionPreference = "Continue"

function Invoke-StackCheckCycle {
    param(
        [bool]$DoRecover,
        [string]$VaultPath
    )

    $gatewayEnv = Join-Path $VaultPath ".gateway.env"
    $vault = @{}
    if (Test-Path $gatewayEnv) {
        Get-Content $gatewayEnv | ForEach-Object {
            $l = $_.Trim()
            if ($l -and (-not $l.StartsWith("#"))) {
                $i = $l.IndexOf("=")
                if ($i -gt 0) {
                    $vault[$l.Substring(0, $i).Trim()] = $l.Substring($i + 1).Trim().Trim('"')
                }
            }
        }
    }

    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host "  SUPERVISOR ATLAS CONNECTIVITY P0 (WATCHDOG & AUTO-RECOVERY)    " -ForegroundColor Cyan
    Write-Host "=================================================================" -ForegroundColor Cyan

    # 1. OLLAMA (127.0.0.1:11434)
    try {
        $null = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get -TimeoutSec 3 -ErrorAction Stop
        Write-Host "[1/4] Ollama (127.0.0.1:11434)          : ONLINE" -ForegroundColor Green
    } catch {
        Write-Host "[1/4] Ollama (127.0.0.1:11434)          : OFFLINE" -ForegroundColor Red
        if ($DoRecover) {
            $ollamaBin = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
            if (-not (Test-Path $ollamaBin)) { $ollamaBin = "ollama.exe" }
            $null = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
                CommandLine = "`"$ollamaBin`" serve"
            }
            Start-Sleep -Seconds 3
            Write-Host "      -> [AUTO-RECOVER] Ollama reiniciado via WMI Win32_Process." -ForegroundColor Yellow
        }
    }

    # 2. ATLAS DAEMON RUST (127.0.0.1:14555)
    try {
        $dHealth = Invoke-RestMethod -Uri "http://127.0.0.1:14555/v1/health" -Headers @{ "Host" = "127.0.0.1:14555" } -Method Get -TimeoutSec 3 -ErrorAction Stop
        Write-Host "[2/4] Atlas Daemon (127.0.0.1:14555)    : ONLINE (status=$($dHealth.status))" -ForegroundColor Green
    } catch {
        Write-Host "[2/4] Atlas Daemon (127.0.0.1:14555)    : OFFLINE" -ForegroundColor Red
        if ($DoRecover) {
            $realLocalApp = [System.Environment]::GetFolderPath("LocalApplicationData")
            $gwLocalApp = Join-Path $realLocalApp "AtlasGatewayRuntime"
            $gwAtlasDir = Join-Path $gwLocalApp "AtlasCode"
            $gwDataDir  = Join-Path $gwAtlasDir "data"
            $runtimeDir = Join-Path $realLocalApp "AtlasCode\runtime-bin"
            New-Item -ItemType Directory -Path $gwDataDir -Force | Out-Null
            New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null

            # Sincronizar auth_token sem imprimir valor
            $srcToken = Join-Path $realLocalApp "AtlasCode\auth_token"
            $dstToken = Join-Path $gwAtlasDir "auth_token"
            if (Test-Path $srcToken) {
                Copy-Item -Path $srcToken -Destination $dstToken -Force
                $me = whoami
                icacls $dstToken /inheritance:r /grant:r "NT AUTHORITY\SYSTEM:(F)" "${me}:(F)" | Out-Null
            }

            # Limpar locks orfaos (formato JSON {"pid": ...} ou numerico) no diretorio isolado
            foreach ($lockPath in @(
                (Join-Path $gwDataDir "atlas_core.lock"),
                (Join-Path $gwAtlasDir "atlas_core.lock")
            )) {
                if (Test-Path $lockPath) {
                    $rawLock = (Get-Content $lockPath -Raw -ErrorAction SilentlyContinue)
                    $lockPid = $null
                    if ($rawLock) {
                        $trimmed = $rawLock.Trim()
                        if ($trimmed -match '^\d+$') {
                            $lockPid = [int]$trimmed
                        } else {
                            try {
                                $parsed = $trimmed | ConvertFrom-Json -ErrorAction Stop
                                if ($parsed.pid) { $lockPid = [int]$parsed.pid }
                            } catch {}
                        }
                    }
                    if ($lockPid -and (-not (Get-Process -Id $lockPid -ErrorAction SilentlyContinue))) {
                        Remove-Item -Path $lockPath -Force -ErrorAction SilentlyContinue
                        Write-Host "      -> [AUTO-RECOVER] Lock orfao (PID $lockPid em $lockPath) removido com seguranca." -ForegroundColor Yellow
                    }
                }
            }

            # Sincronizar binario shadow se ausente ou mais antigo que o build debug
            $daemonSrc = "C:\Users\halis\OneDrive\Desktop\Atlas Code\target\x86_64-pc-windows-msvc\debug\atlas-daemon.exe"
            $runtimeBin = Join-Path $runtimeDir "atlas-daemon-gateway-runtime.exe"
            if (Test-Path $daemonSrc) {
                if ((-not (Test-Path $runtimeBin)) -or ((Get-Item $daemonSrc).LastWriteTime -gt (Get-Item $runtimeBin).LastWriteTime)) {
                    Copy-Item -Path $daemonSrc -Destination $runtimeBin -Force -ErrorAction SilentlyContinue
                }
            }

            if (Test-Path $runtimeBin) {
                $daemonLog = Join-Path $gwLocalApp "daemon.log"
                $cmd = "cmd.exe /c `"set LOCALAPPDATA=$gwLocalApp&& `"$runtimeBin`" > `"$daemonLog`" 2>&1`""
                $null = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
                    CommandLine = $cmd
                    CurrentDirectory = $gwLocalApp
                }
                Start-Sleep -Seconds 3
                Write-Host "      -> [AUTO-RECOVER] Atlas Daemon Rust reiniciado via WMI Win32_Process (runtime isolado)." -ForegroundColor Yellow
            }
        }
    }

    # 3. AETERNUM AI GATEWAY (127.0.0.1:8081)
    try {
        $gResp = Invoke-WebRequest -Uri "http://127.0.0.1:8081/health" -Method Get -UseBasicParsing -TimeoutSec 4 -ErrorAction Stop
        $gHealth = $gResp.Content | ConvertFrom-Json
        Write-Host "[3/4] Aeternum Gateway (127.0.0.1:8081) : ONLINE (status=$($gHealth.status), authMode=$($gHealth.auth_mode), llm_local=$($gHealth.providers.llm_local))" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response -and ([int]$_.Exception.Response.StatusCode -eq 503)) {
            Write-Host "[3/4] Aeternum Gateway (127.0.0.1:8081) : ONLINE (HTTP 503 - aguardando provedor local)" -ForegroundColor Yellow
        } else {
            Write-Host "[3/4] Aeternum Gateway (127.0.0.1:8081) : OFFLINE" -ForegroundColor Red
            if ($DoRecover) {
                $worktreeDir = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
                $gwLog = Join-Path $VaultPath "gateway_runtime.log"
                $null = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
                    CommandLine = "cmd.exe /c `"npx tsx packages/aeternum-vita/apps/gateway/src/index.ts > `"$gwLog`" 2>&1`""
                    CurrentDirectory = $worktreeDir
                }
                Start-Sleep -Seconds 4
                Write-Host "      -> [AUTO-RECOVER] Aeternum AI Gateway reiniciado via WMI em 127.0.0.1:8081." -ForegroundColor Yellow
            }
        }
    }

    # 4. CLOUDFLARED TUNNEL (atlas-victus-gateway)
    $cfProcs = @(Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Sort-Object StartTime)
    if ($cfProcs.Count -gt 1 -and $DoRecover) {
        # Manter apenas o processo mais antigo/estavel e encerrar duplicatas
        $extraProcs = $cfProcs | Select-Object -Skip 1
        foreach ($ep in $extraProcs) {
            Stop-Process -Id $ep.Id -Force -ErrorAction SilentlyContinue
            Write-Host "      -> [DEDUP] Processo cloudflared duplicado (PID=$($ep.Id)) encerrado." -ForegroundColor Yellow
        }
        $cfProcs = @($cfProcs[0])
    }

    $tunnelToken = $vault["CLOUDFLARE_TUNNEL_TOKEN"]
    $tokenFile = Join-Path $VaultPath ".tunnel_token"
    $hasValidTunnelToken = ($tunnelToken -and (-not ($tunnelToken -like "__PENDING*"))) -or (Test-Path $tokenFile)

    if ($cfProcs.Count -ge 1) {
        Write-Host "[4/4] cloudflared (atlas-victus-gateway): ONLINE (PID=$($cfProcs.Id -join ','))" -ForegroundColor Green
    } else {
        Write-Host "[4/4] cloudflared (atlas-victus-gateway): STANDBY (Binario=OK | Token Vault=$(if ($hasValidTunnelToken) { 'CONFIGURADO' } else { 'AGUARDANDO TOKEN DO TUNEL' }))" -ForegroundColor Yellow
        if ($DoRecover -and $hasValidTunnelToken) {
            $cfSvc = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
            if ($cfSvc -and $cfSvc.Status -ne "Running") {
                Start-Service -Name "cloudflared" -ErrorAction SilentlyContinue
            } elseif (Test-Path $tokenFile) {
                $cfLog = Join-Path $VaultPath "cloudflared_runtime.log"
                $null = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
                    CommandLine = "cmd.exe /c `"`"C:\tools\cloudflared\cloudflared.exe`" tunnel --no-autoupdate run --token-file `"$tokenFile`" > `"$cfLog`" 2>&1`""
                    CurrentDirectory = $VaultPath
                }
            }
            Start-Sleep -Seconds 4
            Write-Host "      -> [AUTO-RECOVER] Conector cloudflared iniciado via WMI (--token-file) para atlas-victus-gateway." -ForegroundColor Green
        }
    }

    Write-Host "=================================================================" -ForegroundColor Cyan
}

if (-not $Continuous) {
    Invoke-StackCheckCycle -DoRecover $StartMissing -VaultPath $VaultDir
    exit 0
}

# Modo Continuo (Watchdog persistente com Mutex de instancia unica)
$createdNew = $false
$mutex = New-Object System.Threading.Mutex($true, "Global\AtlasConnectivityWatchdogMutex", [ref]$createdNew)
if (-not $createdNew) {
    Write-Host "[WATCHDOG] Outra instancia do supervisor continuo ja esta em execucao. Encerrando." -ForegroundColor Yellow
    exit 0
}

try {
    while ($true) {
        Invoke-StackCheckCycle -DoRecover $true -VaultPath $VaultDir
        Start-Sleep -Seconds $IntervalSeconds
    }
} finally {
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
