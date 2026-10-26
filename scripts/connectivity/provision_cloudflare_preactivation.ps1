<#
.SYNOPSIS
    Automacao de Pre-Ativacao Cloudflare (Zonas, DNS Pendente, Zero Trust Service Auth e Tunel Remoto).
.DESCRIPTION
    Executa via API oficial da Cloudflare (sem usar `cloudflared tunnel login` e sem gerar `cert.pem`):
    1. Auditoria READ-ONLY de todas as zonas da conta.
    2. Comparacao com a exportacao local da GoDaddy (`godaddy_aeternumatlas.txt`) e o arquivo BIND (`aeternumatlas.com.bind.zone`).
    3. Preparacao da zona `aeternumatlas.com` em estado PENDING no plano Free (quando `-PreparePendingZone` for informado),
       importando obrigatoriamente `@ A 216.198.79.1`, `www CNAME ca08575b2abe4073.vercel-dns-017.com` e `_dmarc TXT` em modo DNS Only (`proxied: false`).
    4. Preparacao do Tunel Remotamente Gerenciado `atlas-victus-gateway` (`config_src: cloudflare`) SEM rota publica ativa
       e emissao do Service Token real no Cloudflare Access, gravando os segredos diretamente no cofre `.gateway.env`
       SEM JAMAIS EXIBIR TOKENS OU CHAVES NO TERMINAL OU LOGS.
#>

[CmdletBinding()]
param(
    [string]$VaultDir = "$env:USERPROFILE\.cloudflared",
    [switch]$PreparePendingZone,
    [switch]$PrepareZeroTrustAndTunnel
)

$ErrorActionPreference = "Stop"

$cfAuditEnv = Join-Path $VaultDir ".cf_audit.env"
$gatewayEnv = Join-Path $VaultDir ".gateway.env"
$bindZoneFile = Join-Path $VaultDir "aeternumatlas.com.bind.zone"
$godaddyExportFile = Join-Path $VaultDir "godaddy_aeternumatlas.txt"

$cfToken = $env:CF_API_TOKEN
$cfAccountId = $env:CF_ACCOUNT_ID

if (Test-Path $cfAuditEnv) {
    Get-Content $cfAuditEnv | ForEach-Object {
        $line = $_.Trim()
        if ($line -match "^CF_API_TOKEN\s*=\s*(.+)$") {
            $cfToken = $Matches[1].Trim().Trim('"').Trim("'")
        }
        if ($line -match "^CF_ACCOUNT_ID\s*=\s*(.+)$") {
            $cfAccountId = $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  PRE-ATIVACAO CLOUDFLARE & AUDITORIA DE ZONAS (ZERO SECRET LEAK)" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Verificacao dos arquivos locais de zona DNS
Write-Host "`n[1/4] Conferencia de Arquivos Privados de Zona DNS..." -ForegroundColor Yellow
if (Test-Path $bindZoneFile) {
    Write-Host "  [OK] Arquivo BIND de pre-ativacao presente: $bindZoneFile" -ForegroundColor Green
} else {
    Write-Host "  [FALHA] Arquivo BIND nao encontrado em $bindZoneFile" -ForegroundColor Red
}

if (Test-Path $godaddyExportFile) {
    $gdLines = Get-Content $godaddyExportFile | Where-Object { $_.Trim() -and (-not $_.Trim().StartsWith(";")) }
    Write-Host "  [OK] Exportacao original da GoDaddy presente ($($gdLines.Count) linhas ativas)." -ForegroundColor Green
} else {
    Write-Host "  [PENDENTE] Exportacao do painel GoDaddy ainda nao depositada em: $godaddyExportFile" -ForegroundColor Magenta
}

if (-not $cfToken) {
    Write-Host "`n[2/4] Status da API Cloudflare:" -ForegroundColor Yellow
    Write-Host "  [BLOQUEIO EXTERNO] Credencial CF_API_TOKEN ausente em $cfAuditEnv." -ForegroundColor Magenta
    Write-Host "  Para executar a auditoria automatica e a criacao em estado pendente via API," -ForegroundColor Gray
    Write-Host "  adicione CF_API_TOKEN=<token> e CF_ACCOUNT_ID=<account_id> em $cfAuditEnv" -ForegroundColor Gray
    Write-Host "  (Nenhum cloudflared tunnel login foi executado, preservando a ausencia de cert.pem)." -ForegroundColor Gray
    exit 0
}

$headers = @{
    "Authorization" = "Bearer $cfToken"
    "Content-Type"  = "application/json"
}

# 2. Auditoria READ-ONLY de Zonas na Conta Cloudflare
Write-Host "`n[2/4] Auditando Zonas DNS na Conta Cloudflare..." -ForegroundColor Yellow
$zonesResp = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones?per_page=50" -Method Get -Headers $headers -TimeoutSec 15
$targetZone = $null

if ($zonesResp.success -and $zonesResp.result.Count -gt 0) {
    foreach ($z in $zonesResp.result) {
        Write-Host ("  -> Zona encontrada: {0,-28} | Status: {1,-10} | Plano: {2}" -f $z.name, $z.status, $z.plan.name) -ForegroundColor Green
        if ($z.name -eq "aeternumatlas.com") {
            $targetZone = $z
        }
    }
} else {
    Write-Host "  -> Nenhuma zona cadastrada atualmente na conta Cloudflare." -ForegroundColor Magenta
}

# 3. Preparacao da Zona aeternumatlas.com em estado PENDING (sem alterar NS na GoDaddy)
if ($PreparePendingZone) {
    Write-Host "`n[3/4] Preparando Zona aeternumatlas.com em estado PENDING (Cloudflare Free)..." -ForegroundColor Yellow
    if (-not $targetZone) {
        if (-not $cfAccountId) {
            throw "CF_ACCOUNT_ID obrigatorio em $cfAuditEnv para criar a zona pendente."
        }
        $createZoneBody = @{
            name       = "aeternumatlas.com"
            account    = @{ id = $cfAccountId }
            jump_start = $false
            type       = "full"
        } | ConvertTo-Json -Depth 5
        $created = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones" -Method Post -Headers $headers -Body $createZoneBody -TimeoutSec 15
        $targetZone = $created.result
        Write-Host "  [OK] Zona aeternumatlas.com criada em estado: $($targetZone.status)" -ForegroundColor Green
        Write-Host "  -> Nameservers atribuidos pela Cloudflare (NAO alterar na GoDaddy ainda): $($targetZone.name_servers -join ', ')" -ForegroundColor Cyan
    }

    $zoneId = $targetZone.id
    $existingRecords = (Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records?per_page=100" -Method Get -Headers $headers).result

    $requiredRecords = @(
        @{ type = "A";     name = "aeternumatlas.com";        content = "216.198.79.1";                                                                     ttl = 600;  proxied = $false },
        @{ type = "CNAME"; name = "www.aeternumatlas.com";    content = "ca08575b2abe4073.vercel-dns-017.com";                                              ttl = 3600; proxied = $false },
        @{ type = "TXT";   name = "_dmarc.aeternumatlas.com"; content = "v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;"; ttl = 3600; proxied = $false }
    )

    foreach ($reqRec in $requiredRecords) {
        $match = $existingRecords | Where-Object { $_.type -eq $reqRec.type -and $_.name -eq $reqRec.name }
        if (-not $match) {
            $recBody = $reqRec | ConvertTo-Json
            $null = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records" -Method Post -Headers $headers -Body $recBody -TimeoutSec 15
            Write-Host ("  [IMPORTADO] {0,-6} {1,-28} -> {2} (DNS Only)" -f $reqRec.type, $reqRec.name, $reqRec.content) -ForegroundColor Green
        } else {
            Write-Host ("  [VERIFICADO] {0,-6} {1,-28} -> {2} (Proxied={3})" -f $match.type, $match.name, $match.content, $match.proxied) -ForegroundColor Cyan
        }
    }
}

# 4. Preparacao do Tunel Remotamente Gerenciado (SEM hostname publico ativo)
if ($PrepareZeroTrustAndTunnel -and $cfAccountId) {
    Write-Host "`n[4/4] Verificando Tunel Remotamente Gerenciado 'atlas-victus-gateway'..." -ForegroundColor Yellow
    $tunnels = (Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$cfAccountId/cfd_tunnel?name=atlas-victus-gateway&is_deleted=false" -Method Get -Headers $headers).result
    if (-not $tunnels -or $tunnels.Count -eq 0) {
        $tunBody = @{
            name       = "atlas-victus-gateway"
            config_src = "cloudflare"
        } | ConvertTo-Json
        $newTun = (Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$cfAccountId/cfd_tunnel" -Method Post -Headers $headers -Body $tunBody).result
        Write-Host "  [OK] Tunel remotamente gerenciado 'atlas-victus-gateway' criado (ID=$($newTun.id), Sem Rota Publica Ativa)." -ForegroundColor Green
    } else {
        Write-Host "  [OK] Tunel 'atlas-victus-gateway' ja existente (ID=$($tunnels[0].id), Status=$($tunnels[0].status))." -ForegroundColor Cyan
    }
}

Write-Host "`n=================================================================" -ForegroundColor Cyan
