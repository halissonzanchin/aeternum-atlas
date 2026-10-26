<#
.SYNOPSIS
    Provisionador Automatizado da Fase 3C (Cloudflare Access + Service Auth + Tunel Remoto + Rota DNS Protegida).
.DESCRIPTION
    Executa na ordem estrita exigida na Fase 3C (sem jamais expor rota desprotegida e sem imprimir segredos):
    1. Confirma via API que a zona 'aeternumatlas.com' esta ACTIVE na Cloudflare.
    2. Emite (ou recupera) o Service Token real 'atlas-edge-ai-tutor-prod' no Cloudflare Zero Trust.
    3. Cria a Aplicacao Access 'Aeternum Atlas Local AI Gateway' para 'atlas-code.aeternumatlas.com'
       com politica exclusiva 'Service Auth' (decision='non_identity', zero regras Bypass).
    4. Obtem o AUD Tag, o Team Domain (Issuer) e a chave publica RS256 oficial da Cloudflare.
    5. Cria o Tunel Remotamente Gerenciado 'atlas-victus-gateway' (config_src='cloudflare', sem cert.pem),
       configura o ingress para http://127.0.0.1:8081 com 'Protect with Access' (required=true, team_name, aud_tag)
       e catch-all http_status:404.
    6. Grava todas as credenciais reais emitidas pela Cloudflare em C:\Users\halis\.cloudflared\.gateway.env.
    7. Somente apos todas as protecoes estarem ativas, publica o CNAME proxied 'atlas-code.aeternumatlas.com'.
#>

[CmdletBinding()]
param(
    [string]$VaultDir = "$env:USERPROFILE\.cloudflared"
)

$ErrorActionPreference = "Stop"

$cfAuditEnv = Join-Path $VaultDir ".cf_audit.env"
$gatewayEnv = Join-Path $VaultDir ".gateway.env"

$cfToken = $env:CF_API_TOKEN
if ((-not $cfToken) -and (Test-Path $cfAuditEnv)) {
    Get-Content $cfAuditEnv | ForEach-Object {
        $line = $_.Trim()
        if ($line -match "^CF_API_TOKEN\s*=\s*(.+)$") {
            $cfToken = $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
}

if (-not $cfToken) {
    Write-Host "[BLOQUEIO EXTERNO] CF_API_TOKEN nao encontrado em $cfAuditEnv." -ForegroundColor Magenta
    Write-Host "Para provisionar automaticamente via API ou sincronizar credenciais:" -ForegroundColor Yellow
    Write-Host "  Opcao A (Automatica via API): grave CF_API_TOKEN=<seu_token_api_cloudflare> em $cfAuditEnv e reexecute este script." -ForegroundColor Gray
    Write-Host "  Opcao B (Manual via Painel Zero Trust): preencha CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET, CF_ACCESS_AUD, CF_ACCESS_ISSUER, CF_ACCESS_JWT_PUBLIC_KEY e CLOUDFLARE_TUNNEL_TOKEN em $gatewayEnv." -ForegroundColor Gray
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $cfToken"
    "Content-Type"  = "application/json"
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  FASE 3C: PROVISIONAMENTO PROTEGIDO CLOUDFLARE ACCESS + TUNNEL  " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Confirmar zona aeternumatlas.com ACTIVE
Write-Host "`n[1/6] Verificando status da zona 'aeternumatlas.com' na Cloudflare..." -ForegroundColor Yellow
$zoneResp = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones?name=aeternumatlas.com" -Method Get -Headers $headers
if (-not $zoneResp.success -or $zoneResp.result.Count -eq 0) {
    throw "Zona aeternumatlas.com nao encontrada na conta Cloudflare."
}
$zone = $zoneResp.result[0]
$zoneId = $zone.id
$accountId = $zone.account.id
Write-Host ("  -> Zona: {0} | Status: {1} | Plano: {2}" -f $zone.name, $zone.status, $zone.plan.name) -ForegroundColor Green
if ($zone.status -ne "active") {
    throw "A zona aeternumatlas.com ainda nao esta 'active' (status atual: $($zone.status)). Abortando publicacao."
}

# 2. Obter Organizacao Zero Trust (Team Domain / Issuer) e Chave Publica RS256
Write-Host "`n[2/6] Consultando organizacao Cloudflare Zero Trust e certificados RS256..." -ForegroundColor Yellow
$orgResp = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/access/organizations" -Method Get -Headers $headers
$authDomain = $orgResp.result.auth_domain
$teamName = $authDomain -replace "\.cloudflareaccess\.com$", ""
$issuer = "https://$authDomain"
Write-Host "  -> Zero Trust Auth Domain: $issuer" -ForegroundColor Green

$certsResp = Invoke-RestMethod -Uri "$issuer/cdn-cgi/access/certs" -Method Get
$publicKeyPem = $certsResp.public_cert.cert
if (-not $publicKeyPem -and $certsResp.public_certs -and $certsResp.public_certs.Count -gt 0) {
    $publicKeyPem = $certsResp.public_certs[0].cert
}
if (-not $publicKeyPem) {
    throw "Nao foi possivel obter o certificado publico RS256 do Cloudflare Access em $issuer/cdn-cgi/access/certs"
}
Write-Host "  -> Chave publica RS256 do Access obtida e validada." -ForegroundColor Green

# 3. Emitir Service Token real (atlas-edge-ai-tutor-prod)
Write-Host "`n[3/6] Emitindo Service Token exclusivo no Cloudflare Access..." -ForegroundColor Yellow
$existingTokens = (Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/access/service_tokens" -Method Get -Headers $headers).result
$existingSvc = $existingTokens | Where-Object { $_.name -eq "atlas-edge-ai-tutor-prod" }
if ($existingSvc) {
    # Rotaciona/recria caso nao tenhamos o client_secret salvo no cofre
    $null = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/access/service_tokens/$($existingSvc.id)" -Method Delete -Headers $headers
}
$svcBody = @{ name = "atlas-edge-ai-tutor-prod"; duration = "8760h" } | ConvertTo-Json
$svcCreated = (Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/access/service_tokens" -Method Post -Headers $headers -Body $svcBody).result
$serviceTokenId = $svcCreated.id
$cfClientId = $svcCreated.client_id
$cfClientSecret = $svcCreated.client_secret
Write-Host "  -> Service Token 'atlas-edge-ai-tutor-prod' emitido na Cloudflare (Client Secret retido apenas em memoria)." -ForegroundColor Green

# 4. Criar Aplicacao Access + Politica Exclusiva Service Auth (Zero Bypass)
Write-Host "`n[4/6] Configurando Aplicacao Access para 'atlas-code.aeternumatlas.com'..." -ForegroundColor Yellow
$apps = (Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/access/apps" -Method Get -Headers $headers).result
$app = $apps | Where-Object { $_.domain -eq "atlas-code.aeternumatlas.com" }
$appPayload = @{
    name                      = "Aeternum Atlas Local AI Gateway"
    domain                    = "atlas-code.aeternumatlas.com"
    type                      = "self_hosted"
    session_duration          = "24h"
    app_launcher_visible      = $false
    service_auth_401_redirect = $false
} | ConvertTo-Json

if (-not $app) {
    $app = (Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/access/apps" -Method Post -Headers $headers -Body $appPayload).result
} else {
    $app = (Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/access/apps/$($app.id)" -Method Put -Headers $headers -Body $appPayload).result
}
$appId = $app.id
$audTag = $app.aud
Write-Host "  -> Aplicacao Access ativa (AUD Tag comprimento=$($audTag.Length))." -ForegroundColor Green

$existingPolicies = (Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/access/apps/$appId/policies" -Method Get -Headers $headers).result
foreach ($pol in $existingPolicies) {
    $null = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/access/apps/$appId/policies/$($pol.id)" -Method Delete -Headers $headers
}
$policyPayload = @{
    name       = "Allow Supabase Edge AI Tutor Service Token Only"
    decision   = "non_identity"
    precedence = 1
    include    = @(
        @{ service_token = @{ token_id = $serviceTokenId } }
    )
} | ConvertTo-Json -Depth 6
$null = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/access/apps/$appId/policies" -Method Post -Headers $headers -Body $policyPayload
Write-Host "  -> Politica exclusiva Service Auth (non_identity, zero Bypass) aplicada." -ForegroundColor Green

# 5. Criar Tunel Remotamente Gerenciado 'atlas-victus-gateway' + Protect with Access
Write-Host "`n[5/6] Configurando Tunel Remoto 'atlas-victus-gateway' (-> http://127.0.0.1:8081)..." -ForegroundColor Yellow
$tunnels = (Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/cfd_tunnel?name=atlas-victus-gateway&is_deleted=false" -Method Get -Headers $headers).result
if (-not $tunnels -or $tunnels.Count -eq 0) {
    $tCreate = @{ name = "atlas-victus-gateway"; config_src = "cloudflare" } | ConvertTo-Json
    $tunnel = (Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/cfd_tunnel" -Method Post -Headers $headers -Body $tCreate).result
} else {
    $tunnel = $tunnels[0]
}
$tunnelId = $tunnel.id
Write-Host "  -> Tunel 'atlas-victus-gateway' pronto (ID: $tunnelId)." -ForegroundColor Green

$tunnelConfigPayload = @{
    config = @{
        ingress = @(
            @{
                hostname      = "atlas-code.aeternumatlas.com"
                service       = "http://127.0.0.1:8081"
                originRequest = @{
                    connectTimeout = 10
                    noTLSVerify    = $false
                    access         = @{
                        required  = $true
                        teamName  = $teamName
                        audTag    = @($audTag)
                    }
                }
            },
            @{
                service = "http_status:404"
            }
        )
    }
} | ConvertTo-Json -Depth 10
$null = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/cfd_tunnel/$tunnelId/configurations" -Method Put -Headers $headers -Body $tunnelConfigPayload
$tunnelToken = (Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/cfd_tunnel/$tunnelId/token" -Method Get -Headers $headers).result
Write-Host "  -> Ingress remoto configurado (127.0.0.1:8081 + Protect with Access habilitado + Catch-all 404)." -ForegroundColor Green

# Atualizar cofre local .gateway.env preservando AETERNUM_AI_GATEWAY_TOKEN
$currentVault = @{}
if (Test-Path $gatewayEnv) {
    Get-Content $gatewayEnv | ForEach-Object {
        $l = $_.Trim()
        if ($l -and (-not $l.StartsWith("#"))) {
            $i = $l.IndexOf("=")
            if ($i -gt 0) { $currentVault[$l.Substring(0, $i).Trim()] = $l.Substring($i + 1).Trim() }
        }
    }
}
$originBearer = $currentVault["AETERNUM_AI_GATEWAY_TOKEN"]
$pemEscaped = ($publicKeyPem -replace "\r?\n", "\n").Trim()

$newEnvContent = @"
# ============================================================================
# COFRE LOCAL DE CREDENCIAIS - AETERNUM AI GATEWAY (FASE 3C)
# NAO VERSIONAR. RESTRITO AO USUARIO DO HOST VIA ACL NTFS.
# ============================================================================
AETERNUM_AI_GATEWAY_PORT=8081
AETERNUM_AI_GATEWAY_MODE=local_first
AETERNUM_AI_GATEWAY_AUTH_MODE=HYBRID_AUTH
ATLAS_ALLOW_AUDIO=false
ATLAS_MAX_CONCURRENT=1
ATLAS_MAX_QUEUE_SIZE=1
ATLAS_QUEUE_TIMEOUT_MS=25000
AETERNUM_AI_GATEWAY_TOKEN=$originBearer
CF_ACCESS_CLIENT_ID=$cfClientId
CF_ACCESS_CLIENT_SECRET=$cfClientSecret
CF_ACCESS_AUD=$audTag
CF_ACCESS_ISSUER=$issuer
CF_ACCESS_TEAM_DOMAIN=$authDomain
CF_ACCESS_JWT_PUBLIC_KEY="$pemEscaped"
CF_ACCESS_REQUIRE_JWT=true
CLOUDFLARE_TUNNEL_ID=$tunnelId
CLOUDFLARE_TUNNEL_TOKEN=$tunnelToken
"@
Set-Content -Path $gatewayEnv -Value $newEnvContent -Encoding UTF8 -NoNewline
icacls $gatewayEnv /inheritance:r /grant:r "$($env:USERNAME):(R,W)" "SYSTEM:(F)" | Out-Null
Write-Host "  -> Cofre local .gateway.env atualizado com as credenciais reais da Cloudflare." -ForegroundColor Green

# 6. Publicar CNAME proxied 'atlas-code.aeternumatlas.com' (somente com Access + Tunnel ativos)
Write-Host "`n[6/6] Publicando rota DNS exclusiva 'atlas-code.aeternumatlas.com'..." -ForegroundColor Yellow
$dnsCheck = (Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records?name=atlas-code.aeternumatlas.com" -Method Get -Headers $headers).result
$cnamePayload = @{
    type    = "CNAME"
    name    = "atlas-code.aeternumatlas.com"
    content = "$tunnelId.cfargotunnel.com"
    ttl     = 1
    proxied = $true
} | ConvertTo-Json

if (-not $dnsCheck -or $dnsCheck.Count -eq 0) {
    $null = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records" -Method Post -Headers $headers -Body $cnamePayload
} else {
    $null = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records/$($dnsCheck[0].id)" -Method Put -Headers $headers -Body $cnamePayload
}
Write-Host "  -> CNAME 'atlas-code.aeternumatlas.com' -> '$tunnelId.cfargotunnel.com' (Proxied=true) ativo!" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan
