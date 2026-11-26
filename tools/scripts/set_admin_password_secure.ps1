# ==============================================================================
# Aeternum Atlas — Secure Administrative Password Reset
# P0.21-ADM.1.1: Local Zero-Exposure Password Update for admin@aeternumatlas.com
# ==============================================================================

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Aeternum Atlas — Redefinição Segura de Senha Administrativa" -ForegroundColor Cyan
Write-Host " Conta: admin@aeternumatlas.com" -ForegroundColor Cyan
Write-Host " UUID : 19f44fd4-cba0-4a35-95c7-b1c5e3e9c5a0" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Prompt password securely without terminal echo
$securePass1 = Read-Host "Digite a nova senha para admin@aeternumatlas.com" -AsSecureString
$securePass2 = Read-Host "Confirme a nova senha" -AsSecureString

$bstr1 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass1)
$bstr2 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass2)

$plainPass1 = $null
$plainPass2 = $null

try {
    $plainPass1 = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr1)
    $plainPass2 = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr2)

    if ([string]::IsNullOrWhiteSpace($plainPass1) -or $plainPass1.Length -lt 8) {
        Write-Error "A senha deve conter no mínimo 8 caracteres."
        exit 1
    }

    if ($plainPass1 -ne $plainPass2) {
        Write-Error "As senhas digitadas não coincidem."
        exit 1
    }

    Write-Host "`nIniciando execução segura de redefinição..." -ForegroundColor Yellow
    $env:AETERNUM_ADMIN_PASS = $plainPass1

    $coreScriptPath = Join-Path -Path $PSScriptRoot -ChildPath "set_admin_password_core.mjs"
    if (-not (Test-Path $coreScriptPath)) {
        # Fallback to relative path if run from repo root
        $coreScriptPath = "tools/scripts/set_admin_password_core.mjs"
    }

    & node --use-system-ca $coreScriptPath
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0) {
        Write-Host "`n=================================================================" -ForegroundColor Green
        Write-Host " [SUCESSO] Operação P0.21-ADM.1.1 Concluída com Êxito!" -ForegroundColor Green
        Write-Host "=================================================================" -ForegroundColor Green
        Write-Host " [GATE 1/4] Senha redefinida no Supabase Auth (admin.updateUserById)." -ForegroundColor Green
        Write-Host " [GATE 2/4] Sessões anteriores e refresh tokens revogados globalmente." -ForegroundColor Green
        Write-Host " [GATE 3/4] Token de recuperação invalidado e ciclo encerrado." -ForegroundColor Green
        Write-Host " [GATE 4/4] Validação final de autenticação aprovada com a nova credencial." -ForegroundColor Green
        Write-Host " [SEGURANÇA] Zero exposição: nenhuma credencial foi impressa em logs ou terminal." -ForegroundColor Green
        Write-Host " [ACESSO] Você já pode efetuar login em https://www.aeternumatlas.com/login" -ForegroundColor Green
    } else {
        Write-Error "Falha na execução do procedimento (Código de saída Node: $exitCode). Nenhuma alteração foi homologada como bem-sucedida."
        exit $exitCode
    }

} finally {
    # Zero sensitive memory immediately
    if ($bstr1) { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr1) }
    if ($bstr2) { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr2) }
    $plainPass1 = $null
    $plainPass2 = $null
    $env:AETERNUM_ADMIN_PASS = $null
    Remove-Item env:AETERNUM_ADMIN_PASS -ErrorAction SilentlyContinue
    [System.GC]::Collect()
}
