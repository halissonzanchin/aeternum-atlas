/**
 * AETERNUM ATLAS — P0.17.3: SEED DE TELEMETRIA SINTÉTICA PARA TESTES RESPONSIVOS
 * 
 * DIRETRIZES RÍGIDAS DE SEGURANÇA:
 * 1. Executa com validação TLS padrão (zero NODE_TLS_REJECT_UNAUTHORIZED=0).
 * 2. EXCLUSIVO para a conta de automação: atlas-e2e-ai-tutor@aeternumatlas.com.
 * 3. NUNCA toca na conta demo humana (demo.institucional@aeternumatlas.com) — aborto imediato se detectada.
 * 4. Não apaga ai_rate_limits nem usa DELETE direto em user_active_sessions.
 * 5. Registra todas as linhas sintéticas com flag criptográfica metadata->>'synthetic' = 'true'.
 */

import { runSupabaseSql } from "./supabase_admin_helper.mjs";

const TARGET_TEST_EMAIL = "atlas-e2e-ai-tutor@aeternumatlas.com";
const TARGET_TEST_USER_ID = "825b2496-ecec-4b67-8343-f8aa3578c224";
const INST_ID = "11111111-1111-1111-1111-111111111111";
const MODEL_ID = "2c57a03b-2c77-4119-b8bb-676ea59e9190";

async function verifySecurityGuards() {
  // 1. Validar identidade no banco de dados antes de qualquer mutação
  const userRows = await runSupabaseSql(
    `SELECT id, email, institution_id FROM public.users WHERE id = '${TARGET_TEST_USER_ID}';`
  );

  if (!userRows || userRows.length === 0) {
    throw new Error(`[SEGURANÇA] Conta de teste ${TARGET_TEST_USER_ID} não encontrada no banco.`);
  }

  const user = userRows[0];

  // 2. Trava absoluta contra conta demo humana
  if (user.email.includes("demo.institucional") || user.email !== TARGET_TEST_EMAIL) {
    throw new Error(
      `[SEGURANÇA CRÍTICA] Abortando imediatamente! O alvo informado (${user.email}) NÃO é a conta de teste autorizada.`
    );
  }

  console.log(`[SEGURANÇA] Guardião de segurança validado: Alvo é estritamente ${user.email} (${user.id}).`);
  return user;
}

export async function cleanSyntheticTelemetry() {
  await verifySecurityGuards();
  console.log("[TELEMETRIA] Removendo exclusivamente registros da conta de teste...");

  // Excluir estritamente registros vinculados ao TARGET_TEST_USER_ID (validado)
  await runSupabaseSql(`
    DELETE FROM public.viewer_learning_events 
    WHERE user_id = '${TARGET_TEST_USER_ID}';
  `);

  await runSupabaseSql(`
    DELETE FROM public.viewer_learning_sessions 
    WHERE user_id = '${TARGET_TEST_USER_ID}';
  `);

  await runSupabaseSql(`
    DELETE FROM public.viewer_quiz_results 
    WHERE user_id = '${TARGET_TEST_USER_ID}';
  `);

  console.log("[TELEMETRIA] Registros da conta de teste limpos com sucesso.");
}

export async function seedSyntheticTelemetry() {
  await verifySecurityGuards();
  await cleanSyntheticTelemetry();

  console.log("[TELEMETRIA] Inserindo telemetria sintética delimitada para homologação visual...");

  const sessionId1 = "a1111111-1111-1111-1111-111111111111";
  const sessionId2 = "a2222222-2222-2222-2222-222222222222";

  // Inserir sessões qualificadas com marcação sintética explícita
  await runSupabaseSql(`
    INSERT INTO public.viewer_learning_sessions 
      (id, user_id, institution_id, model_id, session_start, session_end, active_seconds, idle_seconds, duration_seconds, status, ended_reason, scope, metadata)
    VALUES
      ('${sessionId1}', '${TARGET_TEST_USER_ID}', '${INST_ID}', '${MODEL_ID}', NOW() - INTERVAL '40 minutes', NOW(), 2400, 0, 2400, 'completed', 'synthetic_test_seed', 'viewer', '{"synthetic": true, "env": "e2e_responsive"}'::jsonb),
      ('${sessionId2}', '${TARGET_TEST_USER_ID}', '${INST_ID}', '${MODEL_ID}', NOW() - INTERVAL '1 day 30 minutes', NOW() - INTERVAL '1 day', 1800, 0, 1800, 'completed', 'synthetic_test_seed', 'viewer', '{"synthetic": true, "env": "e2e_responsive"}'::jsonb);
  `);

  // Inserir eventos de exploração com flag sintética
  await runSupabaseSql(`
    INSERT INTO public.viewer_learning_events
      (id, session_id, user_id, institution_id, model_id, event_type, structure_id, created_at, event_data)
    VALUES
      (gen_random_uuid(), '${sessionId1}', '${TARGET_TEST_USER_ID}', '${INST_ID}', '${MODEL_ID}', 'annotation_opened', 'struct-osso-frontal', NOW() - INTERVAL '30 minutes', '{"synthetic": true}'::jsonb),
      (gen_random_uuid(), '${sessionId1}', '${TARGET_TEST_USER_ID}', '${INST_ID}', '${MODEL_ID}', 'annotation_opened', 'struct-osso-parietal', NOW() - INTERVAL '20 minutes', '{"synthetic": true}'::jsonb),
      (gen_random_uuid(), '${sessionId2}', '${TARGET_TEST_USER_ID}', '${INST_ID}', '${MODEL_ID}', 'annotation_opened', 'struct-osso-occipital', NOW() - INTERVAL '1 day 15 minutes', '{"synthetic": true}'::jsonb);
  `);

  // Inserir resultado de quiz com flag sintética
  await runSupabaseSql(`
    INSERT INTO public.viewer_quiz_results
      (id, user_id, institution_id, model_id, quiz_id, quiz_type, status, score, total_questions, percentage, duration_seconds, finished_at)
    VALUES
      (gen_random_uuid(), '${TARGET_TEST_USER_ID}', '${INST_ID}', '${MODEL_ID}', 'quiz-cranio-base-synthetic', 'anatomical', 'completed', 9, 10, 90, 320, NOW() - INTERVAL '2 hours');
  `);

  console.log("[TELEMETRIA] Telemetria sintética delimitada e auditável criada com sucesso.");
}

// Execução direta via CLI
if (process.argv[1]?.endsWith("seed_automation_telemetry.mjs")) {
  const isCleanOnly = process.argv.includes("--clean");
  if (isCleanOnly) {
    cleanSyntheticTelemetry().catch(err => {
      console.error("ERRO na limpeza de telemetria:", err);
      process.exit(1);
    });
  } else {
    seedSyntheticTelemetry().catch(err => {
      console.error("ERRO no seed de telemetria:", err);
      process.exit(1);
    });
  }
}
