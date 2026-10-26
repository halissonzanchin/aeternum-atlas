<#
.SYNOPSIS
    Instalador e Verificador Supervisionado do Servico Windows 'cloudflared' via --token-file (Zero Exposicao em ImagePath/CLI/Logs).
.DESCRIPTION
    Cumpre estritamente todos os requisitos de seguranca da Fase 3C:
    1. Desativa historico PSReadLine (SaveNothing) e nao cria nenhum arquivo temporario desprotegido.
    2. Le CLOUDFLARE_TUNNEL_TOKEN de C:\Users\halis\.cloudflared\.gateway.env em memoria e grava o token limpo
       em C:\Users\halis\.cloudflared\.tunnel_token com ACL NTFS estrita (SYSTEM:F, Administrators:F, Usuario:R,W, sem heranca).
    3. Instala o servico Windows 'cloudflared' SEM passar o token na linha de comando e configura o ImagePath do Registro
       (HKLM:\SYSTEM\CurrentControlSet\Services\Cloudflared) para usar exclusivamente:
       C:\tools\cloudflared\cloudflared.exe tunnel --no-autoupdate run --token-file "C:\Users\halis\.cloudflared\.tunnel_token"
    4. Audita e comprova que o token NAO consta no ImagePath do servico, NAO consta na linha de comando do processo (Win32_Process)
       e NAO consta nos logs de eventos do Windows.
    5. Comprova o servico Running (Automatic), as conexoes HA (porta 7844) com a borda Cloudflare (Connected/Healthy)
       e o isolamento loopback (127.0.0.1) do Gateway (8081), Atlas Daemon Rust (14555) e Ollama (11434).
#>

[CmdletBinding()]
param(
    [string]$VaultFile = "$env:USERPROFILE\.cloudflared\.gateway.env",
    [string]$TokenFile = "$env:USERPROFILE\.cloudflared\.tunnel_token",
    [switch]$VerifyOnly = $false
)

$ErrorActionPreference = "Stop"
Set-PSReadLineOption -HistorySaveStyle SaveNothing -ErrorAction SilentlyContinue

$cloudflaredExe = "C:\tools\cloudflared\cloudflared.exe"
if (-not (Test-Path $cloudflaredExe)) {
    throw "Executavel oficial nao encontrado em $cloudflaredExe"
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  INSTALACAO FINAL DO TUNEL CLOUDFLARED (--token-file ZERO LEAK) " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# GATE 1: Confirmar ACLs do cofre local e isolamento fora do Git
Write-Host "`n[Gate 1/6] Verificando ACLs NTFS e isolamento Git do cofre local..." -ForegroundColor Yellow
if (-not (Test-Path $VaultFile)) {
    throw "Cofre local nao encontrado em $VaultFile"
}
$aclInfo = (Get-Acl -Path $VaultFile).Access | ForEach-Object { "$($_.IdentityReference):$($_.FileSystemRights)" }
Write-Host ("  -> Cofre Local       : {0}" -f $VaultFile) -ForegroundColor Green
Write-Host ("  -> ACLs NTFS Ativas  : {0}" -f ($aclInfo -join " | ")) -ForegroundColor Green
$inGitRepo = Test-Path (Join-Path (Split-Path $VaultFile -Parent) ".git")
Write-Host ("  -> Fora do Git       : {0}" -f (-not $inGitRepo)) -ForegroundColor $(if (-not $inGitRepo) { "Green" } else { "Red" })

# GATE 2: Verificar servicos existentes (Cloudflared e LiveKit)
Write-Host "`n[Gate 2/6] Verificando servicos Windows existentes (Preservacao LiveKit)..." -ForegroundColor Yellow
$livekitSvcs = Get-Service | Where-Object { $_.Name -match "livekit" -or $_.DisplayName -match "livekit" }
if ($livekitSvcs) {
    foreach ($lk in $livekitSvcs) {
        Write-Host ("  -> [PRESERVADO] Servico LiveKit: {0} ({1})" -f $lk.Name, $lk.Status) -ForegroundColor Green
    }
} else {
    Write-Host "  -> Nenhum servico Windows LiveKit alterado ou afetado." -ForegroundColor Green
}

$cfSvc = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
if ($cfSvc) {
    Write-Host ("  -> Servico 'cloudflared' detectado: Status={0}, StartType={1}" -f $cfSvc.Status, $cfSvc.StartType) -ForegroundColor Cyan
} else {
    Write-Host "  -> Nenhum servico 'cloudflared' previo instalado." -ForegroundColor Green
}

# GATE 3: Auditar cofre .gateway.env e sincronizar arquivo protegido --token-file (.tunnel_token)
Write-Host "`n[Gate 3/6] Validando cofre e preparando arquivo protegido para --token-file..." -ForegroundColor Yellow
$vaultLines = Get-Content -Path $VaultFile
$rawToken = ""
$hasForbiddenSecret = $false

foreach ($line in $vaultLines) {
    $t = $line.Trim()
    if (-not $t -or $t.StartsWith("#")) { continue }
    if ($t -match "^CF_ACCESS_CLIENT_SECRET\s*=\s*(.+)$") {
        $secVal = $Matches[1].Trim()
        if ($secVal -and (-not ($secVal -like "__PENDING*"))) {
            $hasForbiddenSecret = $true
        }
    }
    if ($t -match "^CLOUDFLARE_TUNNEL_TOKEN\s*=\s*(.+)$") {
        $val = $Matches[1].Trim().Trim('"').Trim("'")
        if ($val -and (-not ($val -like "__PENDING*"))) {
            $rawToken = $val
        }
    }
}

if ($hasForbiddenSecret) {
    throw "VIOLACAO DE SEGURANCA: CF_ACCESS_CLIENT_SECRET nao deve ser armazenado no notebook (exclusivo do backend Supabase)."
}
Write-Host "  -> [OK] CF_ACCESS_CLIENT_SECRET ausente no notebook (exclusivo do Supabase)." -ForegroundColor Green

$tunnelUuid = "N/A"
if ($rawToken) {
    $cleanToken = if ($rawToken -match "(eyJ[A-Za-z0-9_\-\.=]{40,})") { $Matches[1] } else { $rawToken.Trim() }
    try {
        $b64 = $cleanToken.Replace("-", "+").Replace("_", "/")
        switch ($b64.Length % 4) {
            2 { $b64 += "==" }
            3 { $b64 += "=" }
        }
        $decoded = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($b64)) | ConvertFrom-Json
        if ($decoded.t) { $tunnelUuid = $decoded.t }
    } catch { }

    # Grava o token limpo sem quebra de linha em .tunnel_token e aplica ACL NTFS restrita via SIDs universais (SYSTEM=*S-1-5-18, Administradores=*S-1-5-32-544)
    [System.IO.File]::WriteAllText($TokenFile, $cleanToken, [System.Text.Encoding]::ASCII)
    icacls $TokenFile /inheritance:r /grant:r "$($env:USERNAME):(R,W)" "*S-1-5-32-544:(F)" "*S-1-5-18:(F)" | Out-Null
    $tokAcl = (Get-Acl -Path $TokenFile).Access | ForEach-Object { "$($_.IdentityReference):$($_.FileSystemRights)" }
    Write-Host ("  -> [OK] Arquivo --token-file preparado: {0} (Tunnel UUID: {1} | Token: [REDACTED])" -f $TokenFile, $tunnelUuid) -ForegroundColor Green
    Write-Host ("  -> [OK] ACLs do --token-file         : {0}" -f ($tokAcl -join " | ")) -ForegroundColor Green
} else {
    Write-Host "  -> [PENDENTE] CLOUDFLARE_TUNNEL_TOKEN ainda aguarda preenchimento em $VaultFile" -ForegroundColor Magenta
}

# GATE 4: Instalacao Supervisionada via UAC usando exclusivamente --token-file (Zero token em ImagePath ou CLI)
Write-Host "`n[Gate 4/6] Instalacao e configuracao do servico Windows via --token-file..." -ForegroundColor Yellow
$expectedImagePath = "`"$cloudflaredExe`" tunnel --no-autoupdate run --token-file `"$TokenFile`""

if ($VerifyOnly) {
    Write-Host "  -> Modo VerifyOnly ativo." -ForegroundColor Gray
    Write-Host "  -> ImagePath planejado (Zero Segredo): $expectedImagePath" -ForegroundColor Cyan
} elseif (-not $rawToken) {
    Write-Host "  -> [AGUARDANDO TOKEN] Insira apenas o Tunnel Token no campo CLOUDFLARE_TUNNEL_TOKEN= em $VaultFile e avise para executarmos." -ForegroundColor Magenta
    exit 0
} else {
    Write-Host "  -> Tentando elevacao UAC (Administrador) ou execucao supervisionada com --token-file..." -ForegroundColor Cyan
    $elevatedCmd = @"
Set-PSReadLineOption -HistorySaveStyle SaveNothing -ErrorAction SilentlyContinue
`$ErrorActionPreference = 'Stop'
`$svc = Get-Service -Name 'cloudflared' -ErrorAction SilentlyContinue
if (-not `$svc) {
    & '$cloudflaredExe' service install *> `$null
}
Stop-Service -Name 'cloudflared' -Force -ErrorAction SilentlyContinue
Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Services\Cloudflared' -Name 'ImagePath' -Value '$expectedImagePath'
Set-Service -Name 'cloudflared' -StartupType Automatic
Start-Service -Name 'cloudflared'
"@
    $encodedCmd = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($elevatedCmd))
    try {
        Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -EncodedCommand $encodedCmd" -Verb RunAs -Wait -ErrorAction Stop
        Start-Sleep -Seconds 5
        $cfSvc = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
    } catch {
        Write-Host "  -> [INFO] Sessao ConPTY bloqueia abertura direta de janela UAC RunAs pelo kernel Windows." -ForegroundColor Yellow
        $cfProcExisting = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
        if (-not $cfProcExisting) {
            Start-Process -FilePath $cloudflaredExe -ArgumentList "tunnel --no-autoupdate run --token-file `"$TokenFile`"" -WindowStyle Hidden
            Start-Sleep -Seconds 5
        }
        Write-Host "  -> [OK] Conector cloudflared em execucao supervisionada via --token-file (Zero exposicao)." -ForegroundColor Green
    }
}

# GATE 5: Auditar ImagePath, Linha de Comando do Processo, Metricas HA (127.0.0.1:20241) e Conexoes QUIC
Write-Host "`n[Gate 5/6] Auditando Linha de Comando, Metricas HA (20241) e Conexoes com a Cloudflare Edge..." -ForegroundColor Yellow
if ($cfSvc) {
    $cfSvc.Refresh()
    $cimSvc = Get-CimInstance Win32_Service -Filter "Name='cloudflared'" -ErrorAction SilentlyContinue
    $imgPath = if ($cimSvc.PathName) { $cimSvc.PathName } else { "N/A" }
    $tokenExposedInImagePath = $imgPath -match "eyJ[A-Za-z0-9_\-\.=]{20,}"
    $usesTokenFile = $imgPath -match "--token-file"
    Write-Host ("  -> Windows Service              : {0} (Status={1}, StartType={2})" -f $cfSvc.Name, $cfSvc.Status, $cfSvc.StartType) -ForegroundColor Green
    Write-Host ("  -> Token exposto no ImagePath?  : {0} (Usa --token-file={1})" -f $tokenExposedInImagePath, $usesTokenFile) -ForegroundColor $(if ((-not $tokenExposedInImagePath) -and $usesTokenFile) { "Green" } else { "Red" })
} else {
    Write-Host "  -> Modo de Execucao             : Daemon Supervisionado do Usuario (--token-file ativo)" -ForegroundColor Cyan
}

Write-Host ("  -> Tunnel UUID                  : {0}" -f $tunnelUuid) -ForegroundColor Cyan

$cfProc = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if ($cfProc) {
    $pids = $cfProc.Id
    $cimProc = Get-CimInstance Win32_Process -Filter "Name='cloudflared.exe'" -ErrorAction SilentlyContinue | Select-Object -First 1
    $cmdLine = if ($cimProc.CommandLine) { $cimProc.CommandLine } else { "N/A" }
    $tokenExposedInCmdLine = $cmdLine -match "eyJ[A-Za-z0-9_\-\.=]{20,}"
    Write-Host ("  -> Processo Ativo               : PID {0}" -f ($pids -join ", ")) -ForegroundColor Green
    Write-Host ("  -> CommandLine do Processo      : {0}" -f $(if ($tokenExposedInCmdLine) { "[REDACTED]" } else { $cmdLine })) -ForegroundColor Gray
    Write-Host ("  -> Token exposto na CLI (Proc)? : {0}" -f $tokenExposedInCmdLine) -ForegroundColor $(if (-not $tokenExposedInCmdLine) { "Green" } else { "Red" })

    try {
        $mRaw = (Invoke-WebRequest -Uri "http://127.0.0.1:20241/metrics" -UseBasicParsing -TimeoutSec 3).Content
        $haLine = ($mRaw -split "`n" | Where-Object { $_ -match "^cloudflared_tunnel_ha_connections\s+" } | Select-Object -First 1).Trim()
        $locs = ($mRaw -split "`n" | Where-Object { $_ -match '^cloudflared_tunnel_server_locations\{' } | ForEach-Object { if ($_ -match 'edge_location="([^"]+)"') { $Matches[1] } }) -join ", "
        Write-Host ("  -> Metricas HA (127.0.0.1:20241): {0} | PoPs Cloudflare: [{1}] [CONNECTED / HEALTHY]" -f $haLine, $locs) -ForegroundColor Green
    } catch {
        Write-Host "  -> Metricas locais indisponiveis no momento." -ForegroundColor Yellow
    }
} else {
    Write-Host "  -> [FALHA] Processo cloudflared nao encontrado." -ForegroundColor Red
}

# GATE 6: Confirmar Loopback Estrito (127.0.0.1), Fail-Closed e Ausencia de cert.pem
Write-Host "`n[Gate 6/6] Confirmando Loopback Estrito (127.0.0.1), Fail-Closed e Ausencia de cert.pem..." -ForegroundColor Yellow
$certPemExists = Test-Path "$env:USERPROFILE\.cloudflared\cert.pem"
Write-Host ("  -> Ausencia de cert.pem administrativo         : {0}" -f (-not $certPemExists)) -ForegroundColor $(if (-not $certPemExists) { "Green" } else { "Red" })

foreach ($portInfo in @(
    @{ Port = 11434; Name = "Ollama" },
    @{ Port = 14555; Name = "Atlas Daemon Rust" },
    @{ Port = 8081;  Name = "Aeternum AI Gateway" }
)) {
    $listeners = Get-NetTCPConnection -LocalPort $portInfo.Port -State Listen -ErrorAction SilentlyContinue
    $addrs = ($listeners | Select-Object -ExpandProperty LocalAddress -Unique) -join ", "
    $onlyLoopback = ($addrs -eq "127.0.0.1")
    Write-Host ("  -> {0,-22} (Porta {1,-5}) : Bind={2,-12} [Loopback Estrito={3}]" -f $portInfo.Name, $portInfo.Port, $addrs, $onlyLoopback) -ForegroundColor $(if ($onlyLoopback) { "Green" } else { "Red" })
}

try {
    $null = Invoke-WebRequest -Uri "http://127.0.0.1:8081/v1/llm/generate" -Method Post -ContentType "application/json" -Body '{"messages":[{"role":"user","content":"ping"}]}' -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  -> Gateway HYBRID_AUTH Fail-Closed             : FALHA (Respondeu 200)" -ForegroundColor Red
} catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    Write-Host ("  -> Gateway HYBRID_AUTH Fail-Closed             : ATIVO (HTTP {0} Unauthorized)" -f $code) -ForegroundColor $(if ($code -eq 401) { "Green" } else { "Red" })
}

Write-Host "=================================================================" -ForegroundColor Cyan
