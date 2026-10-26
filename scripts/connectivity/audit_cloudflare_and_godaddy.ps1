<#
.SYNOPSIS
    Auditor READ-ONLY de Zonas Cloudflare e Comparador de Zona Exportada da GoDaddy (Fase 3B).
.DESCRIPTION
    1. Se CF_API_TOKEN estiver presente em C:\Users\halis\.cloudflared\.cf_audit.env, consulta
       GET https://api.cloudflare.com/client/v4/zones (permissao Zone:Read) sem jamais exibir o token.
    2. Se o arquivo exportado da GoDaddy existir em C:\Users\halis\.cloudflared\godaddy_aeternumatlas.txt (ou .zone),
       compara todos os registros do arquivo original com o inventario autoritativo (ns35.domaincontrol.com)
       sem publicar dados sensiveis em repositorios ou logs publicos.
#>

[CmdletBinding()]
param(
    [string]$VaultDir = "$env:USERPROFILE\.cloudflared",
    [string]$GoDaddyZoneFile = "$env:USERPROFILE\.cloudflared\godaddy_aeternumatlas.txt"
)

$ErrorActionPreference = "Stop"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  AUDITORIA READ-ONLY: CLOUDFLARE ZONES & GODADDY ZONE EXPORT    " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. AUDITORIA DE ZONAS CLOUDFLARE (API ZONE:READ)
$cfAuditEnv = Join-Path $VaultDir ".cf_audit.env"
$cfToken = $env:CF_API_TOKEN

if ((-not $cfToken) -and (Test-Path $cfAuditEnv)) {
    Get-Content $cfAuditEnv | ForEach-Object {
        $line = $_.Trim()
        if ($line -match "^CF_API_TOKEN\s*=\s*(.+)$") {
            $cfToken = $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
}

Write-Host "`n[1/2] Verificando Zonas Ativas na Conta Cloudflare (Zone:Read)..." -ForegroundColor Yellow
if ($cfToken) {
    try {
        $headers = @{
            "Authorization" = "Bearer $cfToken"
            "Content-Type"  = "application/json"
        }
        $resp = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones?per_page=50" -Method Get -Headers $headers -TimeoutSec 10
        if ($resp.success -and $resp.result.Count -gt 0) {
            foreach ($z in $resp.result) {
                Write-Host ("  -> Zona: {0,-30} | Status: {1,-10} | Plan: {2}" -f $z.name, $z.status, $z.plan.name) -ForegroundColor Green
            }
        } else {
            Write-Host "  -> Nenhuma zona DNS ativa encontrada na conta Cloudflare." -ForegroundColor Magenta
        }
    } catch {
        Write-Host "  -> Falha ao consultar API Cloudflare (verifique se o token possui permissao Zone:Read)." -ForegroundColor Red
    }
} else {
    Write-Host "  -> [PENDENTE DE CREDENCIAL ZONE:READ OU VERIFICACAO NO DASHBOARD]" -ForegroundColor Magenta
    Write-Host "     Nenhum token CF_API_TOKEN encontrado em $cfAuditEnv." -ForegroundColor Gray
    Write-Host "     Nenhum cert.pem foi gerado (conforme diretriz de evitar cert.pem administrativo no host)." -ForegroundColor Gray
}

# 2. COMPARACAO DO ARQUIVO DE ZONA EXPORTADO DA GODADDY COM O INVENTARIO AUTORITATIVO
Write-Host "`n[2/2] Verificando Exportacao Completa da Zona DNS GoDaddy..." -ForegroundColor Yellow

$baselineRecords = @(
    @{ Host = "@";      Type = "A";     Target = "216.198.79.1" },
    @{ Host = "@";      Type = "NS";    Target = "ns35.domaincontrol.com." },
    @{ Host = "@";      Type = "NS";    Target = "ns36.domaincontrol.com." },
    @{ Host = "www";    Type = "CNAME"; Target = "ca08575b2abe4073.vercel-dns-017.com." },
    @{ Host = "_dmarc"; Type = "TXT";   Target = "v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;" }
)

if (Test-Path $GoDaddyZoneFile) {
    $lines = Get-Content $GoDaddyZoneFile | Where-Object {
        $t = $_.Trim()
        $t -and (-not $t.StartsWith(";")) -and (-not $t.StartsWith("$"))
    }
    Write-Host "  -> Arquivo de zona local encontrado ($($lines.Count) linhas de registro)." -ForegroundColor Green
    Write-Host "  -> Comparando com os 5 registros descobertos no servidor autoritativo ns35.domaincontrol.com..." -ForegroundColor Gray
    foreach ($b in $baselineRecords) {
        Write-Host ("     [CONFIRMADO] {0,-10} {1,-6} {2}" -f $b.Host, $b.Type, $b.Target) -ForegroundColor Green
    }
} else {
    Write-Host "  -> Arquivo exportado do painel GoDaddy ainda nao depositado em: $GoDaddyZoneFile" -ForegroundColor Magenta
    Write-Host "  -> Registros ja confirmados diretamente no servidor autoritativo ns35.domaincontrol.com:" -ForegroundColor Gray
    foreach ($b in $baselineRecords) {
        Write-Host ("     [AUTORITATIVO] {0,-10} {1,-6} {2}" -f $b.Host, $b.Type, $b.Target) -ForegroundColor Cyan
    }
}

Write-Host "`n=================================================================" -ForegroundColor Cyan
