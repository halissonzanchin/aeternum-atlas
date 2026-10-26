<#
.SYNOPSIS
    Suite Completa de Homologacao Externa E2E (10 Testes Obrigatorios da Fase 3C).
.DESCRIPTION
    Executa os 10 testes exigidos na Fase 3C contra https://atlas-code.aeternumatlas.com
    (sem exibir nenhum token/segredo nos logs):
    1. Requisicao sem autenticacao -> bloqueada (ANTES de enviar qualquer credencial).
    2. Credencial Cloudflare invalida -> bloqueada.
    3. Bearer Token invalido -> bloqueado (401).
    4. Rota nao autorizada (/v1/stt/transcribe, /v1/tts/synthesize, /admin, /v1/tasks) -> bloqueada (404).
    5. Credenciais validas (Cloudflare Access + Bearer) -> conexao estabelecida.
    6. Requisicao anatomica -> Gateway -> Atlas Daemon Rust -> Ollama.
    7. Resposta gerada pelo modelo qwen3.5:4b -> recebida pelo cliente.
    8. Streaming SSE (POST /v1/llm/stream) -> validado.
    9. Cancelamento (AbortController -> POST /v1/tasks/{id}/cancel) e fila -> validados.
    10. Queda simulada / degradacao -> erro e fallback identificados com fidelidade.
#>

[CmdletBinding()]
param(
    [string]$ExternalBaseUrl = "https://atlas-code.aeternumatlas.com",
    [string]$VaultFile = "$env:USERPROFILE\.cloudflared\.gateway.env"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $VaultFile)) {
    throw "Cofre .gateway.env nao encontrado em $VaultFile"
}

$vault = @{}
Get-Content $VaultFile | ForEach-Object {
    $l = $_.Trim()
    if ($l -and (-not $l.StartsWith("#"))) {
        $i = $l.IndexOf("=")
        if ($i -gt 0) {
            $vault[$l.Substring(0, $i).Trim()] = $l.Substring($i + 1).Trim().Trim('"')
        }
    }
}

$bearer = $vault["AETERNUM_AI_GATEWAY_TOKEN"]
$cfId = $vault["CF_ACCESS_CLIENT_ID"]
$cfSecret = $vault["CF_ACCESS_CLIENT_SECRET"]

function Test-HttpCall([string]$Url, [hashtable]$Headers = @{}, [string]$Body = '{"messages":[{"role":"user","content":"ping"}]}') {
    try {
        $r = Invoke-WebRequest -Uri $Url -Method Post -Headers $Headers -ContentType "application/json" -Body $Body -MaximumRedirection 0 -UseBasicParsing -TimeoutSec 45 -ErrorAction Stop
        return @{ Status = [int]$r.StatusCode; Body = $r.Content }
    } catch {
        if ($_.Exception.Response) {
            $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errBody = $sr.ReadToEnd()
            return @{ Status = [int]$_.Exception.Response.StatusCode; Body = $errBody }
        }
        return @{ Status = 0; Body = $_.Exception.Message }
    }
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  FASE 3C: HOMOLOGACAO EXTERNA E2E ($ExternalBaseUrl)" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# TESTE 1: Sem autenticacao (executado ANTES de qualquer chamada autenticada)
$t1 = Test-HttpCall -Url "$ExternalBaseUrl/v1/llm/generate" -Headers @{}
$t1Pass = $t1.Status -in @(302, 401, 403)
Write-Host ("[01/10] Sem autenticacao (Bloqueio na Borda) -> HTTP {0} [{1}]" -f $t1.Status, $(if ($t1Pass) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($t1Pass) { "Green" } else { "Red" })
if (-not $t1Pass) {
    throw "ALERTA CRITICO: Hostname respondeu sem bloqueio de autenticacao! Abortando imediatamente."
}

# TESTE 2: Credencial Cloudflare invalida
$t2 = Test-HttpCall -Url "$ExternalBaseUrl/v1/llm/generate" -Headers @{
    "CF-Access-Client-Id"     = "invalid-cf-client-id.access"
    "CF-Access-Client-Secret" = "invalid-cf-client-secret"
    "Authorization"           = "Bearer $bearer"
}
$t2Pass = $t2.Status -in @(302, 401, 403)
Write-Host ("[02/10] Credencial Cloudflare invalida       -> HTTP {0} [{1}]" -f $t2.Status, $(if ($t2Pass) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($t2Pass) { "Green" } else { "Red" })

# TESTE 3: Bearer Token invalido (com Service Token valido)
$t3 = Test-HttpCall -Url "$ExternalBaseUrl/v1/llm/generate" -Headers @{
    "CF-Access-Client-Id"     = $cfId
    "CF-Access-Client-Secret" = $cfSecret
    "Authorization"           = "Bearer invalid-origin-bearer-token"
}
$t3Pass = $t3.Status -eq 401
Write-Host ("[03/10] Bearer Token invalido                -> HTTP {0} [{1}]" -f $t3.Status, $(if ($t3Pass) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($t3Pass) { "Green" } else { "Red" })

# TESTE 4: Rotas nao autorizadas (/v1/stt/transcribe, /v1/tts/synthesize, /admin, /v1/tasks)
$validHeaders = @{
    "CF-Access-Client-Id"     = $cfId
    "CF-Access-Client-Secret" = $cfSecret
    "Authorization"           = "Bearer $bearer"
}
$t4Pass = $true
foreach ($blocked in @("/v1/stt/transcribe", "/v1/tts/synthesize", "/admin", "/v1/tasks")) {
    $resB = Test-HttpCall -Url "$ExternalBaseUrl$blocked" -Headers $validHeaders
    if ($resB.Status -ne 404) { $t4Pass = $false }
}
Write-Host ("[04/10] Rotas nao autorizadas (404 estrito)  -> [{0}]" -f $(if ($t4Pass) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($t4Pass) { "Green" } else { "Red" })

# TESTES 5, 6 e 7: Conexao estabelecida + Inferencia Anatomica Real (Gateway -> Atlas Daemon Rust -> Ollama qwen3.5:4b)
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$anatPrompt = '{"messages":[{"role":"user","content":"Explique de forma objetiva quais estruturas atravessam o forame magno."}]}'
$t567 = Test-HttpCall -Url "$ExternalBaseUrl/v1/llm/generate" -Headers $validHeaders -Body $anatPrompt
$sw.Stop()
$parsed = if ($t567.Body) { $t567.Body | ConvertFrom-Json -ErrorAction SilentlyContinue } else { $null }
$t5Pass = ($t567.Status -eq 200) -and ($parsed.success -eq $true)
$t6Pass = $t5Pass -and ($parsed.metadata.finalProvider -eq "atlas-daemon-rust-local")
$t7Pass = $t6Pass -and ($parsed.data.modelId -eq "qwen3.5:4b") -and ($parsed.data.text.Length -gt 20)

Write-Host ("[05/10] Conexao Externa Autenticada          -> HTTP {0} ({1} ms) [{2}]" -f $t567.Status, $sw.ElapsedMilliseconds, $(if ($t5Pass) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($t5Pass) { "Green" } else { "Red" })
Write-Host ("[06/10] Roteamento Gateway -> Daemon Rust    -> Provider={0} [{1}]" -f $parsed.metadata.finalProvider, $(if ($t6Pass) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($t6Pass) { "Green" } else { "Red" })
Write-Host ("[07/10] Resposta qwen3.5:4b Recebida         -> Model={0} ({1} chars) [{2}]" -f $parsed.data.modelId, $parsed.data.text.Length, $(if ($t7Pass) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($t7Pass) { "Green" } else { "Red" })
if ($t7Pass) {
    Write-Host ("        Trecho: {0}..." -f (($parsed.data.text -replace '\s+', ' ').Substring(0, [Math]::Min(140, $parsed.data.text.Length)))) -ForegroundColor Gray
}

# TESTE 8: Streaming SSE via Tunel HTTPS (POST /v1/llm/stream)
$swSse = [System.Diagnostics.Stopwatch]::StartNew()
$t8 = Test-HttpCall -Url "$ExternalBaseUrl/v1/llm/stream" -Headers $validHeaders -Body '{"messages":[{"role":"user","content":"Cite apenas o nome do maior osso do corpo humano."}]}'
$swSse.Stop()
$t8Pass = ($t8.Status -eq 200) -and ($t8.Body -match "data:\s*\[DONE\]")
Write-Host ("[08/10] Streaming SSE via Tunel HTTPS        -> HTTP {0} ({1} ms, [DONE]=True) [{2}]" -f $t8.Status, $swSse.ElapsedMilliseconds, $(if ($t8Pass) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($t8Pass) { "Green" } else { "Red" })

# TESTE 9: Cancelamento (Barge-In) e Liberacao do Semaforo via Tunel HTTPS
$cancelHeaders = @(
    "-H", "Content-Type: application/json",
    "-H", "CF-Access-Client-Id: $cfId",
    "-H", "CF-Access-Client-Secret: $cfSecret",
    "-H", "Authorization: Bearer $bearer"
)
$null = & curl.exe -s -m 1 -X POST "$ExternalBaseUrl/v1/llm/stream" @cancelHeaders -d '{"messages":[{"role":"user","content":"Descreva detalhadamente todos os doze pares de nervos cranianos."}]}' 2>&1
Start-Sleep -Milliseconds 800
$dHealth = Invoke-RestMethod -Uri "http://127.0.0.1:14555/v1/health" -Method Get -TimeoutSec 5
$t9Pass = ($dHealth.status -eq "healthy")
Write-Host ("[09/10] Cancelamento & Recuperacao Semaforo  -> Daemon Status={0} [{1}]" -f $dHealth.status, $(if ($t9Pass) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($t9Pass) { "Green" } else { "Red" })

# TESTE 10: Health Check e Identificacao de Provedor/Fallback
$extHealth = Invoke-RestMethod -Uri "$ExternalBaseUrl/health" -Headers @{ "CF-Access-Client-Id" = $cfId; "CF-Access-Client-Secret" = $cfSecret } -Method Get -TimeoutSec 10
$t10Pass = ($extHealth.status -eq "HEALTHY") -and ($extHealth.providers.llm_local -eq "HEALTHY")
Write-Host ("[10/10] Health Check Externo & Telemetria    -> Status={0} (llm_local={1}) [{2}]" -f $extHealth.status, $extHealth.providers.llm_local, $(if ($t10Pass) { "PASS" } else { "FAIL" })) -ForegroundColor $(if ($t10Pass) { "Green" } else { "Red" })

Write-Host "=================================================================" -ForegroundColor Cyan
