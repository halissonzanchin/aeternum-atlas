# ==============================================================================
# AETERNUM ATLAS — PROCEDIMENTO INTERATIVO SEGURO DE DEFINIÇÃO DE SENHA (P0.20-S.1)
# Conta Alvo: edgartorales@aeternumatlas.com (Edgar Osvaldo Torales Acosta)
# Solicita a nova senha de forma oculta (sem echo), sem salvar no histórico do PS,
# e executa a atualização estritamente em memória via Supabase Auth Admin API.
# ==============================================================================

[CmdletBinding()]
param()

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host " AETERNUM ATLAS — DEFINIÇÃO ADMINISTRATIVA DE SENHA: EDGAR TORALES              " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Conta Alvo: edgartorales@aeternumatlas.com" -ForegroundColor Yellow
Write-Host "Ambiente: Supabase Auth Admin API (Produção)" -ForegroundColor Yellow
Write-Host ""

# Solicitação segura sem echo na tela
$secPass = Read-Host -AsSecureString "Digite a senha inicial para a conta de Edgar Torales"

if ($null -eq $secPass -or $secPass.Length -eq 0) {
    Write-Host ""
    Write-Host "AVISO: Nenhuma senha foi fornecida pelo operador no terminal." -ForegroundColor Yellow
    Write-Host "Nenhuma alteração de senha foi realizada." -ForegroundColor Yellow
    exit 0
}

# Converter temporariamente em memória para envio seguro ao script Node
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secPass)
$plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Resolve-Path (Join-Path $scriptDir "..\..")

try {
    $env:EDGAR_NEW_PASSWORD = $plain
    
    # Limpar variáveis imediatamente da memória do PowerShell
    $plain = $null
    $secPass = $null
    [System.GC]::Collect()

    Write-Host "Executando atualização via Supabase Auth Admin API..." -ForegroundColor Cyan
    Push-Location $frontendDir
    try {
        $result = node --use-system-ca "tools/scripts/update_edgar_password_secure.mjs"
        Write-Host $result -ForegroundColor Green
    } finally {
        $env:EDGAR_NEW_PASSWORD = $null
        Pop-Location
    }
} catch {
    Write-Host "ERRO: Ocorreu uma falha no processamento: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Procedimento concluído com segurança." -ForegroundColor Cyan
