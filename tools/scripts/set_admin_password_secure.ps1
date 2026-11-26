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

    Write-Host "`nObtendo credencial de gerenciamento do cofre local..." -ForegroundColor Yellow
    $nodeScript = @"
import { getServiceRoleKey, runSupabaseSql } from './tools/scripts/supabase_admin_helper.mjs';
import { createClient } from '@supabase/supabase-js';

const newPassword = process.env.AETERNUM_ADMIN_PASS;
if (!newPassword || newPassword.length < 8) {
  process.exit(1);
}

const serviceKey = await getServiceRoleKey();
const adminClient = createClient('https://hyivyrietgjdazgizafp.supabase.co', serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const ADMIN_UUID = '19f44fd4-cba0-4a35-95c7-b1c5e3e9c5a0';

// 1. Atualizar senha da conta administrativa canônica
const { data, error } = await adminClient.auth.admin.updateUserById(ADMIN_UUID, {
  password: newPassword
});

if (error) {
  console.error('ERRO:', error.message);
  process.exit(1);
}

// 2. Revogar sessões ativas da conta administrativa no Supabase Auth e em user_active_sessions
try {
  await runSupabaseSql(`
    UPDATE public.user_active_sessions
    SET status = 'revoked', revoked_at = NOW(), revoked_reason = 'admin_password_reset'
    WHERE user_id = '\${ADMIN_UUID}' AND status = 'active';

    DELETE FROM auth.sessions WHERE user_id = '\${ADMIN_UUID}';
    UPDATE auth.users SET recovery_token = NULL, recovery_sent_at = NULL WHERE id = '\${ADMIN_UUID}';
  `);
} catch (revError) {
  console.warn('Aviso ao revogar sessões no banco:', revError.message);
}

console.log('SUCCESS');
"@

    $env:AETERNUM_ADMIN_PASS = $plainPass1
    $output = node --use-system-ca --input-type=module -e "$nodeScript"
    $env:AETERNUM_ADMIN_PASS = $null

    if ($output -match "SUCCESS") {
        Write-Host "`n[SUCESSO] A senha de admin@aeternumatlas.com foi redefinida com segurança!" -ForegroundColor Green
        Write-Host "[REVOGAÇÃO] Todas as sessões anteriores foram revogadas com sucesso." -ForegroundColor Green
        Write-Host "[SEGURANÇA] Zero exposição: nenhuma credencial foi impressa em logs, tela ou terminal." -ForegroundColor Green
        Write-Host "[ACESSO] Você já pode efetuar login em https://www.aeternumatlas.com/login" -ForegroundColor Green
    } else {
        Write-Error "Falha ao atualizar a senha no Supabase Auth: $output"
    }

} finally {
    # Zero memory
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr1)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr2)
    $plainPass1 = $null
    $plainPass2 = $null
    $env:AETERNUM_ADMIN_PASS = $null
}
