<#
.SYNOPSIS
    Provisionador Silencioso do Cofre Local de Credenciais (Fase 3B - Zero-Exposure & Strict Separation).
.DESCRIPTION
    1. Gera localmente APENAS o Bearer Token independente da origem (AETERNUM_AI_GATEWAY_TOKEN, 256 bits CSPRNG).
    2. NAO gera credenciais sinteticas para o Cloudflare Access. Os campos CF_ACCESS_CLIENT_ID,
       CF_ACCESS_CLIENT_SECRET, CF_ACCESS_ISSUER, CF_ACCESS_AUD e CF_ACCESS_JWT_PUBLIC_KEY sao reservados
       exclusivamente para os valores reais emitidos pelo Cloudflare Zero Trust (comportamento Fail-Closed).
    3. INVARIANTE DE SEGURANCA: NUNCA exibe valores de segredos em stdout, terminal, logs ou relatorios.
#>

[CmdletBinding()]
param(
    [string]$VaultDir = "$env:USERPROFILE\.cloudflared",
    [switch]$ForceRotateBearer = $false
)

$ErrorActionPreference = "Stop"

function New-CryptoSecureHex([int]$bytes = 32) {
    $buffer = New-Object byte[] $bytes
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($buffer)
    return -join ($buffer | ForEach-Object { "{0:x2}" -f $_ })
}

function Get-StringSha256Prefix([string]$val) {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($val)
    $hash = $sha.ComputeHash($bytes)
    $hex = -join ($hash | ForEach-Object { "{0:x2}" -f $_ })
    return $hex.Substring(0, 12)
}

if (-not (Test-Path $VaultDir)) {
    New-Item -ItemType Directory -Path $VaultDir -Force | Out-Null
}

$vaultFile = Join-Path $VaultDir ".gateway.env"

$existingBearer = ""
$existingCfId = "__PENDING_CLOUDFLARE_ZERO_TRUST_ISSUANCE__"
$existingCfSecret = "__PENDING_CLOUDFLARE_ZERO_TRUST_ISSUANCE__"
$existingCfIssuer = ""
$existingCfAud = ""
$existingCfPubKey = ""

if (Test-Path $vaultFile) {
    Get-Content $vaultFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and (-not $line.StartsWith("#"))) {
            $idx = $line.IndexOf("=")
            if ($idx -gt 0) {
                $k = $line.Substring(0, $idx).Trim()
                $v = $line.Substring($idx + 1).Trim()
                if ($k -eq "AETERNUM_AI_GATEWAY_TOKEN") { $existingBearer = $v }
                if ($k -eq "CF_ACCESS_CLIENT_ID" -and (-not $v.StartsWith("cf_svc_"))) { $existingCfId = $v }
                if ($k -eq "CF_ACCESS_CLIENT_SECRET" -and (-not $v.StartsWith("cf_sec_"))) { $existingCfSecret = $v }
                if ($k -eq "CF_ACCESS_ISSUER") { $existingCfIssuer = $v }
                if ($k -eq "CF_ACCESS_AUD") { $existingCfAud = $v }
                if ($k -eq "CF_ACCESS_JWT_PUBLIC_KEY") { $existingCfPubKey = $v }
            }
        }
    }
}

$finalBearer = if ($existingBearer -and (-not $ForceRotateBearer)) { $existingBearer } else { "agw_" + (New-CryptoSecureHex 32) }

$envContent = @(
    "# Aeternum AI Gateway - Local Secret Vault (Zero-Exposure P0)",
    "# Atualizado em: $(Get-Date -Format o)",
    "# 1. CREDENCIAL GERADA LOCALMENTE (Origem HP Victus + Backend Supabase):",
    "AETERNUM_AI_GATEWAY_TOKEN=$finalBearer",
    "",
    "# 2. CREDENCIAIS EMITIDAS PELA CLOUDFLARE (Cloudflare Zero Trust -> Access -> Service Auth):",
    "# Enquanto permanecerem como __PENDING_CLOUDFLARE_ZERO_TRUST_ISSUANCE__, o Gateway opera em FAIL-CLOSED (401).",
    "CF_ACCESS_CLIENT_ID=$existingCfId",
    "CF_ACCESS_CLIENT_SECRET=$existingCfSecret",
    "CF_ACCESS_ISSUER=$existingCfIssuer",
    "CF_ACCESS_AUD=$existingCfAud",
    "CF_ACCESS_JWT_PUBLIC_KEY=$existingCfPubKey",
    "",
    "# 3. PARAMETROS OPERACIONAIS DO GATEWAY:",
    "AETERNUM_AI_GATEWAY_PORT=8081",
    "AETERNUM_AI_GATEWAY_HOST=127.0.0.1",
    "AETERNUM_AI_GATEWAY_MODE=local_first",
    "AETERNUM_AI_GATEWAY_AUTH_MODE=HYBRID_AUTH",
    "ATLAS_MAX_CONCURRENT=1",
    "ATLAS_MAX_QUEUE_SIZE=1",
    "ATLAS_QUEUE_TIMEOUT_MS=25000",
    "ATLAS_TARGET_MODEL=qwen3.5:4b",
    "ATLAS_DAEMON_BASE_URL=http://127.0.0.1:14555"
) -join "`r`n"

[System.IO.File]::WriteAllText($vaultFile, $envContent, [System.Text.Encoding]::UTF8)
& icacls.exe $vaultFile /inheritance:r /grant:r "$($env:USERNAME):(R,W)" "SYSTEM:(R,W)" | Out-Null

$bearerFp = Get-StringSha256Prefix $finalBearer
$cfStatus = if ($existingCfId -match "__PENDING" -or (-not $existingCfId)) { "PENDING_CLOUDFLARE_ISSUANCE (Fail-Closed Ativo)" } else { "PROVISIONED (sha256:$(Get-StringSha256Prefix $existingCfId)...)" }

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  COFRE LOCAL ATUALIZADO (SEPARACAO BEARER vs CLOUDFLARE ACCESS)  " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  Arquivo do Cofre           : $vaultFile" -ForegroundColor Gray
Write-Host "  ACL NTFS                   : Restrita a $($env:USERNAME) e SYSTEM" -ForegroundColor Green
Write-Host "  Origin Bearer Token (Local): sha256:$bearerFp... [REDACTED]" -ForegroundColor Green
Write-Host "  Cloudflare Service Token   : $cfStatus" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
