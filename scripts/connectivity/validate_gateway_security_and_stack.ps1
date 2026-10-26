<#
.SYNOPSIS
    Suite de Validacao Operacional de Seguranca e Resiliencia (Fase 3B - HYBRID_AUTH).
.DESCRIPTION
    Executa os testes obrigatorios contra o Gateway real em 127.0.0.1:8081, Atlas Daemon (14555) e Ollama (11434),
    lendo as credenciais do cofre local C:\Users\halis\.cloudflared\.gateway.env em memoria
    SEM JAMAIS EXIBIR TOKENS OU SEGREDOS NO TERMINAL OU LOGS.
#>

[CmdletBinding()]
param(
    [string]$GatewayUrl = "http://127.0.0.1:8081",
    [string]$VaultFile = "$env:USERPROFILE\.cloudflared\.gateway.env"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $VaultFile)) {
    throw "Cofre local nao encontrado em $VaultFile"
}

$vault = @{}
Get-Content $VaultFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and (-not $line.StartsWith("#"))) {
        $idx = $line.IndexOf("=")
        if ($idx -gt 0) {
            $k = $line.Substring(0, $idx).Trim()
            $v = $line.Substring($idx + 1).Trim()
            $vault[$k] = $v
        }
    }
}

$validBearer = $vault["AETERNUM_AI_GATEWAY_TOKEN"]
$validCfId = $vault["CF_ACCESS_CLIENT_ID"]
$validCfSecret = $vault["CF_ACCESS_CLIENT_SECRET"]

function Invoke-StatusCheck([string]$Uri, [string]$Method = "POST", [hashtable]$Headers = @{}, [string]$Body = '{"messages":[{"role":"user","content":"ping"}]}') {
    try {
        if ($Method -eq "GET") {
            $resp = Invoke-WebRequest -Uri $Uri -Method Get -Headers $Headers -UseBasicParsing -TimeoutSec 40 -ErrorAction Stop
        } else {
            $resp = Invoke-WebRequest -Uri $Uri -Method $Method -Headers $Headers -ContentType "application/json" -Body $Body -UseBasicParsing -TimeoutSec 40 -ErrorAction Stop
        }
        return @{ StatusCode = [int]$resp.StatusCode; Content = $resp.Content }
    } catch {
        if ($_.Exception.Response) {
            return @{ StatusCode = [int]$_.Exception.Response.StatusCode; Content = "" }
        }
        return @{ StatusCode = 0; Content = $_.Exception.Message }
    }
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  VALIDACAO DE SEGURANCA E PILHA REAL (HYBRID_AUTH - ZERO LEAK)  " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# TESTE 1: Sem credenciais
$t1 = Invoke-StatusCheck -Uri "$GatewayUrl/v1/llm/generate" -Headers @{}
Write-Host ("[1/7] Acesso sem credenciais                -> HTTP {0} (Esperado: 401) [{1}]" -f $t1.StatusCode, $(if ($t1.StatusCode -eq 401) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($t1.StatusCode -eq 401) { "Green" } else { "Red" })

# TESTE 2: Service Token invalido + Bearer valido
$t2 = Invoke-StatusCheck -Uri "$GatewayUrl/v1/llm/generate" -Headers @{
    "CF-Access-Client-Id" = "invalid-client-id"
    "CF-Access-Client-Secret" = "invalid-client-secret"
    "Authorization" = "Bearer $validBearer"
}
Write-Host ("[2/7] Service Token invalido                -> HTTP {0} (Esperado: 401) [{1}]" -f $t2.StatusCode, $(if ($t2.StatusCode -eq 401) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($t2.StatusCode -eq 401) { "Green" } else { "Red" })

# TESTE 3A: Service Token valido + Bearer Token invalido
$t3a = Invoke-StatusCheck -Uri "$GatewayUrl/v1/llm/generate" -Headers @{
    "CF-Access-Client-Id" = $validCfId
    "CF-Access-Client-Secret" = $validCfSecret
    "Authorization" = "Bearer invalid-bearer-token-000"
}
Write-Host ("[3A/7] Bearer Token invalido                -> HTTP {0} (Esperado: 401) [{1}]" -f $t3a.StatusCode, $(if ($t3a.StatusCode -eq 401) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($t3a.StatusCode -eq 401) { "Green" } else { "Red" })

# TESTE 3B: Service Token valido + Token de desenvolvimento legado exposto (revogado)
$t3b = Invoke-StatusCheck -Uri "$GatewayUrl/v1/llm/generate" -Headers @{
    "CF-Access-Client-Id" = $validCfId
    "CF-Access-Client-Secret" = $validCfSecret
    "Authorization" = "Bearer atlas_connectivity_p0_secret_token_12345"
}
Write-Host ("[3B/7] Token de dev legado revogado         -> HTTP {0} (Esperado: 401) [{1}]" -f $t3b.StatusCode, $(if ($t3b.StatusCode -eq 401) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($t3b.StatusCode -eq 401) { "Green" } else { "Red" })

# TESTE 4: Rotas nao autorizadas (/v1/stt/transcribe, /v1/tts/synthesize, /admin, /v1/tasks) com credenciais validas
$validHeaders = @{
    "CF-Access-Client-Id" = $validCfId
    "CF-Access-Client-Secret" = $validCfSecret
    "Authorization" = "Bearer $validBearer"
}
$blockedRoutesOk = $true
foreach ($route in @("/v1/stt/transcribe", "/v1/tts/synthesize", "/v1/tts/stream", "/admin", "/v1/tasks")) {
    $tr = Invoke-StatusCheck -Uri "$GatewayUrl$route" -Headers $validHeaders
    if ($tr.StatusCode -ne 404) { $blockedRoutesOk = $false }
}
Write-Host ("[4/7] Bloqueio de rotas Admin/STT/TTS/Tasks -> HTTP 404 em todas        [{0}]" -f $(if ($blockedRoutesOk) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($blockedRoutesOk) { "Green" } else { "Red" })

# TESTE 5: Verificacao de estado do Cloudflare Access Service Token (Fail-Closed pre-emissao vs Operacional pos-emissao) + Health Real da Pilha
$isPendingCfToken = ($validCfId -like "__PENDING*") -or ($validCfId -like "cf_svc_*")
$hCheck = Invoke-StatusCheck -Uri "$GatewayUrl/health" -Method "GET" -Headers @{} -Body $null
$hJson = if ($hCheck.Content) { $hCheck.Content | ConvertFrom-Json } else { $null }
$stackHealthy = ($hCheck.StatusCode -eq 200) -and ($hJson.status -eq "HEALTHY") -and ($hJson.providers.llm_local -eq "HEALTHY")

if ($isPendingCfToken) {
    $t5 = Invoke-StatusCheck -Uri "$GatewayUrl/v1/llm/generate" -Headers $validHeaders
    $t5FailClosedPass = ($t5.StatusCode -eq 401) -and $stackHealthy
    Write-Host ("[5/7] Pre-Ativacao Fail-Closed + Health     -> Auth=HTTP {0} (Fail-Closed Ativo) | Stack Health={1} (llm_local={2}) [{3}]" -f $t5.StatusCode, $hJson.status, $hJson.providers.llm_local, $(if ($t5FailClosedPass) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($t5FailClosedPass) { "Green" } else { "Red" })
} else {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $bodyAnat = '{"messages":[{"role":"user","content":"Qual nervo inerva o musculo diafragma? Responda em uma frase curta."}]}'
    $t5 = Invoke-StatusCheck -Uri "$GatewayUrl/v1/llm/generate" -Headers $validHeaders -Body $bodyAnat
    $sw.Stop()
    $t5Json = if ($t5.Content) { $t5.Content | ConvertFrom-Json } else { $null }
    $t5Pass = ($t5.StatusCode -eq 200) -and ($t5Json.success -eq $true) -and ($t5Json.metadata.finalProvider -eq "atlas-daemon-rust-local")
    Write-Host ("[5/7] HYBRID_AUTH Real -> Atlas Code Rust   -> HTTP {0} ({1} ms, Provider={2}) [{3}]" -f $t5.StatusCode, $sw.ElapsedMilliseconds, $t5Json.metadata.finalProvider, $(if ($t5Pass) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($t5Pass) { "Green" } else { "Red" })
    if ($t5Pass) {
        Write-Host ("      Resposta Real: {0}" -f ($t5Json.data.text -replace "\r?\n", " ")) -ForegroundColor Gray
    }
}

# TESTE 6: Validacao do arquivo de ingress do cloudflared
$configTemplate = Join-Path $PSScriptRoot "cloudflared_tunnel_config_template.yml"
$ingVal = & "C:\tools\cloudflared\cloudflared.exe" tunnel --config $configTemplate ingress validate 2>&1
$ingPass = $LASTEXITCODE -eq 0
Write-Host ("[6/7] cloudflared tunnel ingress validate   -> {0} [{1}]" -f ($ingVal | Out-String).Trim(), $(if ($ingPass) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($ingPass) { "Green" } else { "Red" })

# TESTE 7: Validacao de regras de roteamento (atlas-code.aeternumatlas.com vs hostname estranho)
$ruleMatch = & "C:\tools\cloudflared\cloudflared.exe" tunnel --config $configTemplate ingress rule https://atlas-code.aeternumatlas.com/v1/llm/generate 2>&1
$ruleBlock = & "C:\tools\cloudflared\cloudflared.exe" tunnel --config $configTemplate ingress rule https://untrusted.aeternumatlas.com/ 2>&1
$rMatchStr = ($ruleMatch | Out-String).Trim()
$rBlockStr = ($ruleBlock | Out-String).Trim()
$rPass = ($rMatchStr -match "127\.0\.0\.1:8081") -and ($rBlockStr -match "http_status:404")
Write-Host ("[7/7] Regra de Ingress Exclusiva 8081/404   -> [{0}]" -f $(if ($rPass) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($rPass) { "Green" } else { "Red" })
Write-Host "=================================================================" -ForegroundColor Cyan
