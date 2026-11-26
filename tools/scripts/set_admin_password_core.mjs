import { getAnonKey, getServiceRoleKey, runSupabaseSql } from "./supabase_admin_helper.mjs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import path from "path";

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
    // 0. Pré-validação de entrada (garantia de complexidade sem ecoar valor)
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
    if (userError) {
      const isDbError = userError.status === 500 ||
        userError.message?.toLowerCase().includes("database") ||
        userError.message?.toLowerCase().includes("scan error") ||
        userError.code === "unexpected_failure";
      const isNotFound = userError.status === 404 || userError.message?.toLowerCase().includes("not found");

      if (isDbError) {
        console.error(`[ERRO_BANCO_AUTH] Falha interna do Supabase Auth ao carregar usuário: ${userError.message} (status: ${userError.status})`);
        return { success: false, code: "AUTH_DATABASE_ERROR", error: userError.message, steps };
      } else if (isNotFound) {
        console.error(`[ERRO_IDENTIDADE] Usuário não encontrado no Supabase Auth: ${userError.message}`);
        return { success: false, code: "USER_NOT_FOUND", error: userError.message, steps };
      } else {
        console.error(`[ERRO_AUTH_API] Falha na API Supabase Auth: ${userError.message}`);
        return { success: false, code: "AUTH_API_ERROR", error: userError.message, steps };
      }
    }

    if (!userData?.user) {
      console.error(`[ERRO_IDENTIDADE] Usuário com UUID ${targetUuid} não retornado pelo Supabase Auth.`);
      return { success: false, code: "USER_NOT_FOUND", steps };
    }

    const user = userData.user;
    if (user.id !== targetUuid || user.email?.toLowerCase() !== expectedEmail.toLowerCase()) {
      console.error(`[ERRO_CORRESPONDENCIA] Divergência de identidade! UUID: ${user.id} vs ${targetUuid}, E-mail: ${user.email} vs ${expectedEmail}`);
      return { success: false, code: "IDENTITY_MISMATCH", steps };
    }

    // Validar papel administrativo (em public.users e app_metadata)
    const publicUserRows = await runSupabaseSql(`SELECT role FROM public.users WHERE id = '${targetUuid}';`);
    const publicRole = publicUserRows[0]?.role;
    const authRole = user.app_metadata?.role;

    if (!isTestRun) {
      // Exigência estrita de correspondência canônica na execução de produção
      if (targetUuid !== CANONICAL_ADMIN_UUID) {
        console.error(`[ERRO_IDENTIDADE] Produção rejeitada: UUID ${targetUuid} não corresponde ao canônico ${CANONICAL_ADMIN_UUID}.`);
        return { success: false, code: "IDENTITY_MISMATCH", steps };
      }
      if (expectedEmail.toLowerCase() !== CANONICAL_ADMIN_EMAIL.toLowerCase() || user.email?.toLowerCase() !== CANONICAL_ADMIN_EMAIL.toLowerCase()) {
        console.error(`[ERRO_IDENTIDADE] Produção rejeitada: e-mail ${user.email} não corresponde ao canônico ${CANONICAL_ADMIN_EMAIL}.`);
        return { success: false, code: "IDENTITY_MISMATCH", steps };
      }
      if (publicRole !== "admin" || authRole !== "admin") {
        console.error(`[ERRO_AUTORIZACAO] Produção rejeitada: papel 'admin' não confirmado em ambas as fontes (public: ${publicRole}, auth: ${authRole}).`);
        return { success: false, code: "ROLE_NOT_ADMIN", steps };
      }
    } else {
      if (publicRole !== "admin" && authRole !== "admin") {
        console.error(`[ERRO_AUTORIZACAO] Homologação rejeitada: papel 'admin' ausente (public: ${publicRole}, auth: ${authRole}).`);
        return { success: false, code: "ROLE_NOT_ADMIN", steps };
      }
    }
    console.log(`  -> Identidade confirmada: ${user.email} (role: admin)`);

    // ETAPA 1: Redefinir Senha via mecanismo oficial Supabase Auth
    console.log("\n[ETAPA 1/4] Redefinindo senha via Supabase Auth Admin API (updateUserById)...");
    const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUuid, {
      password: newPassword
    });

    if (updateError) {
      console.error("[FALHA_ETAPA_1] Erro da API ao atualizar senha:", updateError.message);
      return { success: false, code: "UPDATE_PASSWORD_FAILED", error: updateError.message, steps };
    }
    steps.passwordUpdated = true;
    console.log("  -> [SENHA REDEFINIDA] Senha atualizada com sucesso no Supabase Auth.");

    // ETAPA 2: Revogação de Sessões e Confirmação de Ausência Residual
    console.log("\n[ETAPA 2/4] Revogando sessões ativas e verificando ausência residual...");
    try {
      // 1. Revogar sessões registradas na aplicação
      await runSupabaseSql(`
        UPDATE public.user_active_sessions
        SET status = 'revoked', revoked_at = NOW(), revoked_reason = 'admin_password_reset'
        WHERE user_id = '${targetUuid}' AND status = 'active';
      `);

      // 2. Verificar ausência efetiva de sessões ativas em public.user_active_sessions
      const activeCheck = await runSupabaseSql(`
        SELECT count(*)::int as count FROM public.user_active_sessions
        WHERE user_id = '${targetUuid}' AND status = 'active';
      `);
      const activeCount = activeCheck[0]?.count ?? -1;
      if (activeCount !== 0) {
        console.error(`[FALHA_ETAPA_2] Sessões ativas residuais detectadas em public.user_active_sessions (count=${activeCount}).`);
        return { success: false, code: "ACTIVE_SESSIONS_RESIDUAL", steps };
      }

      // 3. Verificar ausência efetiva de sessões ativas em auth.sessions
      const authSessionsCheck = await runSupabaseSql(`
        SELECT count(*)::int as count FROM auth.sessions WHERE user_id = '${targetUuid}';
      `);
      const authSessionsCount = authSessionsCheck[0]?.count ?? -1;
      if (authSessionsCount !== 0) {
        // Encerramento forçado de sessões remanescentes no GoTrue se houver
        await runSupabaseSql(`DELETE FROM auth.sessions WHERE user_id = '${targetUuid}';`);
        const recheckAuthSessions = await runSupabaseSql(`
          SELECT count(*)::int as count FROM auth.sessions WHERE user_id = '${targetUuid}';
        `);
        if ((recheckAuthSessions[0]?.count ?? -1) !== 0) {
          console.error(`[FALHA_ETAPA_2] Falha ao eliminar sessões em auth.sessions (count=${recheckAuthSessions[0]?.count}).`);
          return { success: false, code: "AUTH_SESSIONS_RESIDUAL", steps };
        }
      }

      steps.sessionsRevoked = true;
      console.log("  -> [SESSÕES REVOGADAS] Ausência de sessões anteriores confirmada (user_active_sessions: 0, auth.sessions: 0).");
    } catch (sessionRevErr) {
      console.error("[FALHA_ETAPA_2] Erro ao revogar sessões:", sessionRevErr.message);
      return { success: false, code: "SESSION_REVOCATION_FAILED", error: sessionRevErr.message, steps };
    }

    // ETAPA 3: Invalidação Real de Tokens de Recuperação e Normalização GoTrue
    console.log("\n[ETAPA 3/4] Verificando estado do token de recuperação no banco de dados...");
    const tokenCheckRows = await runSupabaseSql(`
      SELECT
        (recovery_token IS NULL) as is_token_null,
        (recovery_token = '') as is_token_empty,
        (recovery_sent_at IS NULL) as is_sent_null
      FROM auth.users
      WHERE id = '${targetUuid}';
    `);

    const isTokenNull = tokenCheckRows[0]?.is_token_null === true;
    const isTokenEmpty = tokenCheckRows[0]?.is_token_empty === true;

    // Se o token for NULL (incompatível com GoTrue) ou tiver qualquer valor residual diferente de '', normaliza para string vazia
    if (isTokenNull || !isTokenEmpty) {
      console.log("  -> Normalizando token para GoTrue empty string e invalidando ciclo...");
      await runSupabaseSql(`
        UPDATE auth.users SET recovery_token = '', recovery_sent_at = NULL WHERE id = '${targetUuid}';
      `);
      const recheck = await runSupabaseSql(`
        SELECT (recovery_token = '') as is_token_empty, (recovery_token IS NULL) as is_token_null
        FROM auth.users WHERE id = '${targetUuid}';
      `);
      if (recheck[0]?.is_token_empty !== true || recheck[0]?.is_token_null === true) {
        console.error("[FALHA_ETAPA_3] Falha na normalização/invalidação do token de recuperação residual.");
        return { success: false, code: "RECOVERY_TOKEN_NOT_INVALIDATED", steps };
      }
    }

    steps.recoveryTokenInvalidated = true;
    console.log("  -> [TOKEN INVALIDADO] Verificação real concluída: recovery_token normalizado em string vazia e comprovado inativo (conteúdo protegido).");

    // ETAPA 4: Validação Final Concluída com Verificação Rigorosa do SignOut
    console.log("\n[ETAPA 4/4] Executando validação final de autenticação com a nova credencial...");
    const { data: testAuth, error: testAuthErr } = await publicClient.auth.signInWithPassword({
      email: expectedEmail,
      password: newPassword
    });

    if (testAuthErr || !testAuth?.session) {
      console.error("[FALHA_ETAPA_4] Validação final falhou: não foi possível autenticar com a nova senha:", testAuthErr?.message);
      return { success: false, code: "FINAL_VALIDATION_FAILED", error: testAuthErr?.message, steps };
    }

    // Encerrar a sessão de validação e verificar o resultado do signOut
    const { error: signOutErr } = await publicClient.auth.signOut();
    if (signOutErr) {
      console.error("[FALHA_ETAPA_4] Falha ao encerrar a sessão de validação final:", signOutErr.message);
      return { success: false, code: "VALIDATION_SIGNOUT_FAILED", error: signOutErr.message, steps };
    }

    // Confirmar que nenhuma sessão ficou ativa no cliente
    const { data: lingeringCheck } = await publicClient.auth.getSession();
    if (lingeringCheck?.session) {
      console.error("[FALHA_ETAPA_4] Sessão residual persistente detectada após signOut da validação final.");
      return { success: false, code: "LINGERING_VALIDATION_SESSION", steps };
    }

    steps.finalValidationCompleted = true;
    console.log("  -> [VALIDAÇÃO FINAL CONCLUÍDA] Autenticação confirmada, signOut aprovado e sessão temporária encerrada.");

    // Verificação de Integridade Total dos 4 Gates (Zero tolerância a falhas parciais)
    const allGatesPassed = steps.passwordUpdated &&
      steps.sessionsRevoked &&
      steps.recoveryTokenInvalidated &&
      steps.finalValidationCompleted;

    if (!allGatesPassed) {
      console.error("[ERRO_SEGURANCA] Falha parcial detectada nos gates de segurança:", steps);
      return { success: false, code: "PARTIAL_GATE_FAILURE", steps };
    }

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
const isMainModule = Boolean(
  process.argv[1] &&
  fileURLToPath(import.meta.url).toLowerCase() === path.resolve(process.argv[1]).toLowerCase()
);

if (isMainModule) {
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
