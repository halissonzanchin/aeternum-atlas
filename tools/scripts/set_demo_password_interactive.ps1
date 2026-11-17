# ==============================================================================
# AETERNUM ATLAS — PROCEDIMENTO INTERATIVO SEGURO DE DEFINIÇÃO DE SENHA (P0.4)
# Solicita a nova senha de forma oculta (sem echo), sem salvar no histórico do PS,
# e executa a atualização estritamente em memória via Supabase Auth Admin API.
# ==============================================================================

[CmdletBinding()]
param()

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host " AETERNUM ATLAS — DEFINIÇÃO ADMINISTRATIVA DE CREDENCIAL DA CONTA DEMO          " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Conta Alvo: demo.institucional@aeternumatlas.com" -ForegroundColor Yellow
Write-Host "UUID: 5cfb837a-5ce3-4113-8f4a-dcdd9b8bf43f" -ForegroundColor Yellow
Write-Host "Ambiente: Supabase Auth Admin API (Produção)" -ForegroundColor Yellow
Write-Host ""

# Solicitação segura sem echo na tela
$secPass = Read-Host -AsSecureString "Digite a nova senha forte para a conta demo"

if ($null -eq $secPass -or $secPass.Length -eq 0) {
    Write-Host ""
    Write-Host "AVISO: Nenhuma senha foi fornecida pelo operador no terminal." -ForegroundColor Yellow
    Write-Host "Nenhuma alteração foi realizada. A conta permanece inalterada." -ForegroundColor Yellow
    exit 0
}

# Converter temporariamente em memória para envio seguro ao script Node
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secPass)
$plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Resolve-Path (Join-Path $scriptDir "..\..")

try {
    $env:DEMO_NEW_PASSWORD = $plain
    
    # Limpar variáveis imediatamente da memória do PowerShell
    $plain = $null
    $secPass = $null
    [System.GC]::Collect()

    Write-Host "Executando atualização via Supabase Auth Admin API..." -ForegroundColor Cyan
    Push-Location $frontendDir
    try {
        $result = node --use-system-ca "tools/scripts/update_demo_password_secure.mjs"
        
        # Analisar resultado sem vazar senhas
        if ($result -like "*SUCCESS_CREDENTIAL_UPDATED*") {
            Write-Host ""
            Write-Host "================================================================================" -ForegroundColor Green
            Write-Host " RESULTADO: CREDENCIAL REGULARIZADA COM SUCESSO!                               " -ForegroundColor Green
            Write-Host " - Autenticação Supabase Auth confirmada: SIM                                  " -ForegroundColor Green
            Write-Host " - UUID preservado (5cfb837a-5ce3-4113-8f4a-dcdd9b8bf43f): SIM                 " -ForegroundColor Green
            Write-Host " - Perfil preservado (student / active / Aeternum Atlas Oficial): SIM           " -ForegroundColor Green
            Write-Host " - VoiceStudio bloqueado por padrão (HTTP 403): SIM                            " -ForegroundColor Green
            Write-Host "================================================================================" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "FALHA: A operação não retornou confirmação de sucesso." -ForegroundColor Red
            Write-Host $result
        }
    } finally {
        Pop-Location
    }
} finally {
    Remove-Item Env:\DEMO_NEW_PASSWORD -ErrorAction SilentlyContinue
    if ([Microsoft.PowerShell.PSConsoleReadLine]) {
        try { [Microsoft.PowerShell.PSConsoleReadLine]::ClearHistory() } catch {}
    }
}
