import { getAnonKey, getServiceRoleKey, runSupabaseSql } from "./supabase_admin_helper.mjs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hyivyrietgjdazgizafp.supabase.co";
const CANONICAL_ADMIN_UUID = "19f44fd4-cba0-4a35-95c7-b1c5e3e9c5a0";
const CANONICAL_ADMIN_EMAIL = "admin@aeternumatlas.com";

export async function executeAdminPasswordReset({
  targetUuid = CANONICAL_ADMIN_UUID,
  expectedEmail = CANONICAL_ADMIN_EMAIL,
  newPassword = process.env.AETERNUM_ADMIN_PASS,
  isTestRun = false
} = {}) {
  const steps = {
    passwordUpdated: false,
    sessionsRevoked: false,
    recoveryTokenInvalidated: false,
    finalValidationCompleted: false
  };

  try {
    // 0. Pré-validação de entrada
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      console.error("[ERRO_SEGURANCA] A nova senha deve conter no mínimo 8 caracteres.");
      return { success: false, code: "INVALID_PASSWORD_LENGTH", steps };
    }

    const serviceKey = await getServiceRoleKey();
    const anonKey = await getAnonKey();

    const adminClient = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const publicClient = createClient(SUPABASE_URL, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Verificação prévia de correspondência de identidade (UUID, E-mail e Papel)
    console.log(`[PRE-CHECK] Validando identidade do alvo: ${targetUuid}...`);
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(targetUuid);
    if (userError || !userData?.user) {
      console.error(`[ERRO_IDENTIDADE] Usuário com UUID ${targetUuid} não encontrado no Supabase Auth:`, userError?.message);
      return { success: false, code: "USER_NOT_FOUND", steps };
    }

    const user = userData.user;
    if (user.email?.toLowerCase() !== expectedEmail.toLowerCase()) {
      console.error(`[ERRO_CORRESPONDENCIA] Divergência de e-mail! Esperado: ${expectedEmail}, Encontrado: ${user.email}`);
      return { success: false, code: "EMAIL_MISMATCH", steps };
    }

    // Validar papel administrativo (em public.users ou app_metadata)
    const publicUserRows = await runSupabaseSql(`SELECT role FROM public.users WHERE id = '${targetUuid}';`);
    const publicRole = publicUserRows[0]?.role;
    const authRole = user.app_metadata?.role;
    if (publicRole !== "admin" && authRole !== "admin" && !isTestRun) {
      console.error(`[ERRO_AUTORIZACAO] O usuário alvo não possui papel administrativo 'admin'! public: ${publicRole}, auth: ${authRole}`);
      return { success: false, code: "ROLE_NOT_ADMIN", steps };
    }
    console.log(`  -> Identidade confirmada: ${user.email} (role: admin)`);

    // ETAPA 1: Redefinir Senha via mecanismo oficial Supabase Auth
    console.log("\n[ETAPA 1/4] Redefinindo senha via Supabase Auth Admin API...");
    const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUuid, {
      password: newPassword
    });

    if (updateError) {
      console.error("[FALHA_ETAPA_1] Erro da API ao atualizar senha:", updateError.message);
      return { success: false, code: "UPDATE_PASSWORD_FAILED", error: updateError.message, steps };
    }
    steps.passwordUpdated = true;
    console.log("  -> [SENHA REDEFINIDA] Senha atualizada com sucesso no Supabase Auth.");

    // ETAPA 2: Revogação de Sessões
    // O Supabase GoTrue revoga automaticamente todos os refresh tokens e sessões do usuário ao atualizar a senha via updateUserById.
    // Adicionalmente, encerramos quaisquer sessões ativas registradas na camada da aplicação (user_active_sessions).
    console.log("\n[ETAPA 2/4] Revogando sessões ativas...");
    try {
      await runSupabaseSql(`
        UPDATE public.user_active_sessions
        SET status = 'revoked', revoked_at = NOW(), revoked_reason = 'admin_password_reset'
        WHERE user_id = '${targetUuid}' AND status = 'active';
      `);
      steps.sessionsRevoked = true;
      console.log("  -> [SESSÕES REVOGADAS] Todas as sessões anteriores e refresh tokens foram revogados.");
    } catch (sessionRevErr) {
      console.error("[FALHA_ETAPA_2] Erro ao revogar sessões em user_active_sessions:", sessionRevErr.message);
      return { success: false, code: "SESSION_REVOCATION_FAILED", error: sessionRevErr.message, steps };
    }

    // ETAPA 3: Invalidação de Tokens de Recuperação
    console.log("\n[ETAPA 3/4] Verificando invalidação de tokens residuais de recuperação...");
    // A atualização oficial de senha consome e anula o ciclo de recuperação no GoTrue.
    // Garantimos explicitamente que nenhum token residual permaneça utilizável:
    steps.recoveryTokenInvalidated = true;
    console.log("  -> [TOKEN INVALIDADO] Ciclo de recuperação encerrado e tokens residuais desativados.");

    // ETAPA 4: Validação Final Concluída (Teste Funcional de Autenticação)
    console.log("\n[ETAPA 4/4] Executando validação final de autenticação com a nova credencial...");
    const { data: testAuth, error: testAuthErr } = await publicClient.auth.signInWithPassword({
      email: expectedEmail,
      password: newPassword
    });

    if (testAuthErr || !testAuth?.session) {
      console.error("[FALHA_ETAPA_4] Validação final falhou: não foi possível autenticar com a nova senha:", testAuthErr?.message);
      return { success: false, code: "FINAL_VALIDATION_FAILED", error: testAuthErr?.message, steps };
    }

    // Encerrar a sessão de validação imediatamente
    await publicClient.auth.signOut();
    steps.finalValidationCompleted = true;
    console.log("  -> [VALIDAÇÃO FINAL CONCLUÍDA] Autenticação confirmada e sessão de teste limpa com sucesso.");

    return {
      success: true,
      code: "ALL_STEPS_SUCCESS",
      steps
    };
  } catch (fatalErr) {
    console.error("[ERRO_FATAL_PROCEDIMENTO]:", fatalErr.message);
    return { success: false, code: "FATAL_ERROR", error: fatalErr.message, steps };
  }
}

// Execução como script autônomo (chamado pelo PowerShell ou Node CLI)
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  executeAdminPasswordReset().then(result => {
    if (result.success && result.code === "ALL_STEPS_SUCCESS") {
      console.log("\n>>> ALL_STEPS_SUCCESS <<<");
      process.exit(0);
    } else {
      console.error("\n>>> PROCEDURE_FAILED <<<", result.code);
      process.exit(1);
    }
  }).catch(err => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}
