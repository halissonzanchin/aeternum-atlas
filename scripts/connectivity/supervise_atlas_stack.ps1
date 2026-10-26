<#
.SYNOPSIS
    Supervisor e Watchdog da Pilha Completa Atlas Connectivity P0 (Fases 3E -> 3H).
.DESCRIPTION
    Prepara, verifica e recupera de forma supervisionada, 100% silenciosa e desacoplada
    da sessao interativa (via WMI Win32_Process com Win32_ProcessStartup ShowWindow=0)
    os 4 niveis operacionais no HP Victus:
    1. Ollama (127.0.0.1:11434)
    2. Atlas Daemon Rust (127.0.0.1:14555, via runtime isolado atlas-daemon-gateway-runtime.exe
       e LOCALAPPDATA isolado para zero colisao com a sessao paralela da IA cientifica)
    3. Aeternum AI Gateway (127.0.0.1:8081, modo HYBRID_AUTH via cofre .gateway.env + certificados RS256 Cloudflare)
    4. Cloudflare Tunnel (atlas-victus-gateway, via --token-file sem expor segredos)

    Garante:
    - Zero janelas visiveis no desktop (MainWindowHandle == 0, sem popups pretos de cmd.exe).
    - Rotacao automatica de logs (limiar de 5MB por arquivo, salvando em .1).
    - Deteccao de orfaos e deduplicacao estrita antes de novas inicializacoes.
    - Suporte a execucao pontual (-StartMissing) ou continua (-Continuous) com Mutex global.
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

function Rotate-LogFile {
    param(
        [Parameter(Mandatory=$true)][string]$Path,
        [int64]$MaxBytes = 5242880 # 5MB
    )
    if (Test-Path $Path) {
        try {
            $item = Get-Item $Path -ErrorAction Stop
            if ($item.Length -ge $MaxBytes) {
                $backup = "$Path.1"
                if (Test-Path $backup) {
                    Remove-Item -Path $backup -Force -ErrorAction SilentlyContinue
                }
                Move-Item -Path $Path -Destination $backup -Force -ErrorAction SilentlyContinue
            }
        } catch {}
    }
}

function Start-WmiSilentProcess {
    param(
        [Parameter(Mandatory=$true)][string]$CommandLine,
        [string]$WorkingDirectory = $null,
        [string]$LogFile = $null
    )

    if ($LogFile) {
        Rotate-LogFile -Path $LogFile -MaxBytes 5242880
        $CommandLine = "cmd.exe /c `"$CommandLine >> `"$LogFile`" 2>&1`""
    }

    if ($PSVersionTable.PSEdition -ne "Core") {
        # Windows PowerShell 5.1 nativo
        $startup = ([wmiclass]"Win32_ProcessStartup").CreateInstance()
        $startup.ShowWindow = 0
        $proc = [wmiclass]"Win32_Process"
        $res = $proc.Create($CommandLine, $WorkingDirectory, $startup)
        return $res.ProcessId
    } else {
        # PowerShell Core bridge via powershell.exe nativo
        $escapedCmd = $CommandLine.Replace("'", "''")
        $escapedDir = if ($WorkingDirectory) { "'$($WorkingDirectory.Replace("'", "''"))'" } else { "`$null" }
        $script = @"
`$startup = ([wmiclass]'Win32_ProcessStartup').CreateInstance()
`$startup.ShowWindow = 0
`$proc = [wmiclass]'Win32_Process'
`$res = `$proc.Create('$escapedCmd', $escapedDir, `$startup)
[Console]::WriteLine(`$res.ProcessId)
exit `$res.ReturnValue
"@
        $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($script))
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "powershell.exe"
        $psi.Arguments = "-NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand $encoded"
        $psi.CreateNoWindow = $true
        $psi.UseShellExecute = $false
        $psi.RedirectStandardOutput = $true
        $p = [System.Diagnostics.Process]::Start($psi)
        $out = $p.StandardOutput.ReadToEnd()
        $p.WaitForExit()
        $pidCreated = 0
        if ([int]::TryParse($out.Trim(), [ref]$pidCreated)) {
            return $pidCreated
        }
        return 0
    }
}

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
    Write-Host "  SUPERVISOR ATLAS CONNECTIVITY P0 (SILENT & AUTO-RECOVERY)      " -ForegroundColor Cyan
    Write-Host "=================================================================" -ForegroundColor Cyan

    # 1. OLLAMA (127.0.0.1:11434)
    try {
        $null = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get -TimeoutSec 3 -ErrorAction Stop
        Write-Host "[1/4] Ollama (127.0.0.1:11434)          : ONLINE" -ForegroundColor Green
    } catch {
        Write-Host "[1/4] Ollama (127.0.0.1:11434)          : OFFLINE" -ForegroundColor Red
        if ($DoRecover) {
            $ollamaProc = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
            if (-not $ollamaProc) {
                $ollamaBin = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
                if (-not (Test-Path $ollamaBin)) { $ollamaBin = "ollama.exe" }
                $null = Start-WmiSilentProcess -CommandLine "`"$ollamaBin`" serve" -WorkingDirectory "$env:LOCALAPPDATA\Programs\Ollama"
                Start-Sleep -Seconds 3
                Write-Host "      -> [AUTO-RECOVER] Ollama reiniciado silenciosamente via WMI (ShowWindow=0)." -ForegroundColor Yellow
            }
        }
    }

    # 2. ATLAS DAEMON RUST (127.0.0.1:14555)
    try {
        $dHealth = Invoke-RestMethod -Uri "http://127.0.0.1:14555/v1/health" -Headers @{ "Host" = "127.0.0.1:14555" } -Method Get -TimeoutSec 3 -ErrorAction Stop
        Write-Host "[2/4] Atlas Daemon (127.0.0.1:14555)    : ONLINE (status=$($dHealth.status))" -ForegroundColor Green
    } catch {
        Write-Host "[2/4] Atlas Daemon (127.0.0.1:14555)    : OFFLINE" -ForegroundColor Red
        if ($DoRecover) {
            # Encerrar processos zumbis/orfaos do runtime isolado se existirem
            Get-Process -Name "atlas-daemon-gateway-runtime" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

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

            # Limpar locks orfaos no diretorio isolado
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
                # Sintaxe exata sem espacos adicionais em variaveis
                $cmd = "set LOCALAPPDATA=$gwLocalApp&& $runtimeBin"
                $null = Start-WmiSilentProcess -CommandLine $cmd -WorkingDirectory $gwLocalApp -LogFile $daemonLog
                Start-Sleep -Seconds 3
                Write-Host "      -> [AUTO-RECOVER] Atlas Daemon Rust reiniciado silenciosamente via WMI (runtime isolado, ShowWindow=0)." -ForegroundColor Yellow
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
                # Encerrar conexoes orfas presas na porta 8081 se houver
                $stuckConns = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
                foreach ($conn in $stuckConns) {
                    if ($conn.OwningProcess -gt 0) {
                        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
                    }
                }

                $worktreeDir = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
                $gwLog = Join-Path $VaultPath "gateway_runtime.log"
                $null = Start-WmiSilentProcess -CommandLine "npx tsx packages/aeternum-vita/apps/gateway/src/index.ts" -WorkingDirectory $worktreeDir -LogFile $gwLog
                Start-Sleep -Seconds 4
                Write-Host "      -> [AUTO-RECOVER] Aeternum AI Gateway reiniciado silenciosamente via WMI (ShowWindow=0 em 127.0.0.1:8081)." -ForegroundColor Yellow
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
                $null = Start-WmiSilentProcess -CommandLine "`"C:\tools\cloudflared\cloudflared.exe`" tunnel --no-autoupdate run --token-file `"$tokenFile`"" -WorkingDirectory $VaultPath -LogFile $cfLog
            }
            Start-Sleep -Seconds 4
            Write-Host "      -> [AUTO-RECOVER] Conector cloudflared iniciado silenciosamente via WMI (ShowWindow=0) para atlas-victus-gateway." -ForegroundColor Green
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
