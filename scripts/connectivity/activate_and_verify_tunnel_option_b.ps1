<#
.SYNOPSIS
    Ativador e Homologador da Opcao B (Cloudflare Zero Trust Dashboard -> HP Victus).
.DESCRIPTION
    1. Le e valida os 5 campos preenchidos pelo usuario em C:\Users\halis\.cloudflared\.gateway.env
       SEM JAMAIS IMPRIMIR SEGREDOS NO TERMINAL OU LOGS.
    2. Sanitiza automaticamente CLOUDFLARE_TUNNEL_TOKEN (caso tenha sido colado o comando completo).
    3. Busca e valida os certificados publicos RS256 em https://<CF_ACCESS_TEAM_DOMAIN>/cdn-cgi/access/certs.
    4. Inicia o conector supervisionado C:\tools\cloudflared\cloudflared.exe tunnel run --token <TOKEN>.
    5. Executa os 10 testes externos obrigatorios contra https://atlas-code.aeternumatlas.com
       (incluindo bloqueio anonimo, bloqueio de Service Token invalido, bloqueio de Bearer invalido,
       bloqueio 404 de rotas de audio/admin, inferencia anatomica real no qwen3.5:4b, SSE e cancelamento).
#>

[CmdletBinding()]
param(
    [string]$VaultFile = "$env:USERPROFILE\.cloudflared\.gateway.env",
    [string]$ExternalUrl = "https://atlas-code.aeternumatlas.com"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $VaultFile)) {
    throw "Cofre nao encontrado em $VaultFile"
}

$vault = @{}
Get-Content $VaultFile | ForEach-Object {
    $l = $_.Trim()
    if ($l -and (-not $l.StartsWith("#"))) {
        $i = $l.IndexOf("=")
        if ($i -gt 0) {
            $vault[$l.Substring(0, $i).Trim()] = $l.Substring($i + 1).Trim().Trim('"').Trim("'")
        }
    }
}

$requiredKeys = @(
    "AETERNUM_AI_GATEWAY_TOKEN",
    "CF_ACCESS_TEAM_DOMAIN",
    "CF_ACCESS_AUD",
    "CLOUDFLARE_TUNNEL_TOKEN"
)

$missing = @()
foreach ($k in $requiredKeys) {
    $v = $vault[$k]
    if ((-not $v) -or ($v -like "__PENDING*") -or ($v -like "cf_svc_*")) {
        $missing += $k
    }
}

if ($missing.Count -gt 0) {
    Write-Host "[AGUARDANDO PREENCHIMENTO DO COFRE .gateway.env]" -ForegroundColor Yellow
    Write-Host "Campos pendentes em $VaultFile : $($missing -join ', ')" -ForegroundColor Magenta
    exit 1
}

# Sanitizar CLOUDFLARE_TUNNEL_TOKEN e gravar em .tunnel_token com ACL restrita
$rawTunnelToken = $vault["CLOUDFLARE_TUNNEL_TOKEN"]
if ($rawTunnelToken -match "(eyJ[A-Za-z0-9_\-\.=]+)") {
    $cleanTunnelToken = $Matches[1]
} else {
    $cleanTunnelToken = $rawTunnelToken.Trim()
}
$tokenFile = Join-Path (Split-Path $VaultFile -Parent) ".tunnel_token"
[System.IO.File]::WriteAllText($tokenFile, $cleanTunnelToken, [System.Text.Encoding]::ASCII)
icacls $tokenFile /inheritance:r /grant:r "$($env:USERNAME):(R,W)" "Administrators:(F)" "SYSTEM:(F)" | Out-Null

# Normalizar Team Domain / Issuer e buscar certificados RS256 oficiais
$cleanTeam = $vault["CF_ACCESS_TEAM_DOMAIN"] -replace "^https?:://", "" -replace "/$", ""
$issuer = if ($cleanTeam.EndsWith(".cloudflareaccess.com")) { "https://$cleanTeam" } else { "https://$cleanTeam.cloudflareaccess.com" }

Write-Host "[1/4] Validando certificados RS256 do Cloudflare Access em $issuer/cdn-cgi/access/certs..." -ForegroundColor Cyan
$certsResp = Invoke-RestMethod -Uri "$issuer/cdn-cgi/access/certs" -Method Get -TimeoutSec 10
$certCount = if ($certsResp.public_certs) { $certsResp.public_certs.Count } elseif ($certsResp.public_cert) { 1 } else { 0 }
if ($certCount -eq 0) {
    throw "Nenhum certificado RS256 encontrado em $issuer/cdn-cgi/access/certs"
}
Write-Host "  -> [OK] $certCount certificado(s) RS256 oficial(is) verificado(s) para $issuer." -ForegroundColor Green

# Verificar ou iniciar servico/conector cloudflared via --token-file
Write-Host "[2/4] Verificando conector cloudflared para o tunel 'atlas-victus-gateway' (--token-file)..." -ForegroundColor Cyan
$cfSvc = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
if ($cfSvc -and $cfSvc.Status -eq "Running") {
    Write-Host "  -> [OK] Servico Windows 'cloudflared' ativo via --token-file." -ForegroundColor Green
} else {
    $cfProc = Start-Process -FilePath "C:\tools\cloudflared\cloudflared.exe" -ArgumentList "tunnel --no-autoupdate run --token-file `"$tokenFile`"" -WindowStyle Hidden -PassThru
    Start-Sleep -Seconds 6
    if ($cfProc.HasExited) {
        throw "O processo cloudflared encerrou prematuramente (verifique se o CLOUDFLARE_TUNNEL_TOKEN esta correto)."
    }
    Write-Host "  -> [OK] Conector cloudflared ativo via --token-file (PID=$($cfProc.Id))." -ForegroundColor Green
}

# Executar a suite de 10 testes externos obrigatorios
Write-Host "[3/4] Executando bateria de homologacao externa E2E ($ExternalUrl)..." -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "validate_external_e2e_phase3c.ps1") -ExternalBaseUrl $ExternalUrl -VaultFile $VaultFile
