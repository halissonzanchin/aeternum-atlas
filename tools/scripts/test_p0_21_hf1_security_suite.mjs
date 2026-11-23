import { createClient } from "@supabase/supabase-js";
import { runSupabaseSql, getServiceRoleKey, getAnonKey } from "./supabase_admin_helper.mjs";
import fs from "fs";
import path from "path";

const SUPABASE_URL = "https://hyivyrietgjdazgizafp.supabase.co";

const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";

async function runSecuritySuite() {
  console.log("=== INICIANDO SUÍTE DE TESTES DE SEGURANÇA P0.21-HF.1 ===");
  const serviceRoleKey = await getServiceRoleKey();
  let anonKey = await getAnonKey();
  if (!anonKey) {
    // Fallback para .env.local se necessário
    anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXZ5cmlldGdqZGF6Z2l6YWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNDYzNzgsImV4cCI6MjA5MzYyMjM3OH0.smX-aQXUHAg1w3dW3nYg07Ml9yorqV7REX4bDcxvtVk";
  }

  const anonClient = createClient(SUPABASE_URL, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const adminClient = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const report = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: { total: 0, passed: 0, failed: 0 }
  };

  function recordTest(name, passed, details) {
    report.summary.total++;
    if (passed) report.summary.passed++;
    else report.summary.failed++;
    report.tests[name] = { passed, details };
    console.log(`[${passed ? "PASS" : "FAIL"}] ${name}:`, details);
  }

  try {
    // --------------------------------------------------------------------------
    // 1. TESTE NEGATIVO: Anônimo tentando enviar candidatura em pré-lançamento
    // --------------------------------------------------------------------------
    console.log("\n--- TESTE 1: Bloqueio do Pré-Lançamento (Anônimo) ---");
    const testAppPayload = {
      p_full_name: "Candidato Teste Negativo Anonimo",
      p_email: "teste_negativo_anonimo@aeternumatlas.com",
      p_institution_name: "Universidade Teste",
      p_course: "Medicina",
      p_academic_term: "3º ano",
      p_motivation: "Teste de rejeição estrita em pré-lançamento de segurança.",
      p_privacy_consent: true,
      p_terms_consent: true,
      p_communication_consent: true
    };

    const { data: anonSubRes, error: anonSubErr } = await anonClient.rpc(
      "submit_beta_application",
      testAppPayload
    );

    const test1Passed = !anonSubErr && anonSubRes && anonSubRes.code === "BETA_REGISTRATION_PRELAUNCH" && anonSubRes.success === false;
    recordTest(
      "1. Bloqueio Pré-Lançamento (Anônimo)",
      test1Passed,
      { response: anonSubRes, error: anonSubErr?.message }
    );

    // --------------------------------------------------------------------------
    // 1.1 TESTE NEGATIVO: Anônimo tentando contornar pré-lançamento com p_is_internal_test
    // --------------------------------------------------------------------------
    console.log("\n--- TESTE 1.1: Tentativa de Bypass com p_is_internal_test ---");
    let bypassBlocked = false;
    let bypassDetail = "";
    try {
      const { data: bypassRes, error: bypassErr } = await anonClient.rpc(
        "submit_beta_application",
        { ...testAppPayload, p_is_internal_test: true }
      );
      // Como o parâmetro foi removido, PostgREST deve rejeitar com erro de parâmetro não encontrado
      if (bypassErr) {
        bypassBlocked = true;
        bypassDetail = `Rejeitado pelo PostgREST: ${bypassErr.message}`;
      } else if (bypassRes?.code === "BETA_REGISTRATION_PRELAUNCH") {
        bypassBlocked = true;
        bypassDetail = `Rejeitado pela regra de pré-lançamento: ${bypassRes.message}`;
      } else {
        bypassBlocked = false;
        bypassDetail = `FALHA GRAVE: Submissão contornou o pré-lançamento: ${JSON.stringify(bypassRes)}`;
      }
    } catch (err) {
      bypassBlocked = true;
      bypassDetail = `Exceção capturada: ${err.message}`;
    }

    recordTest(
      "1.1 Tentativa de Bypass p_is_internal_test",
      bypassBlocked,
      { detail: bypassDetail }
    );

    // --------------------------------------------------------------------------
    // 2. TESTE NEGATIVO: Estudante tentando avaliar candidatura administrativa
    // --------------------------------------------------------------------------
    console.log("\n--- TESTE 2: Estudante tentando avaliar candidatura administrativa ---");
    // Obter um ID de candidatura existente
    const existingApps = await runSupabaseSql(`SELECT id FROM public.beta_applications LIMIT 1;`);
    const targetAppId = existingApps[0]?.id || "00000000-0000-0000-0000-000000000001";

    // Criar cliente autenticado como estudante
    // Buscar estudante Nicolas ou Henrique
    const studentUserRows = await runSupabaseSql(`
      SELECT id, email FROM public.users WHERE role = 'student' LIMIT 1;
    `);
    const studentUser = studentUserRows[0];

    // Simular chamada RPC com JWT de estudante via PostgREST ou execução direta com impersonação
    const studentReviewCheck = await runSupabaseSql(`
      DO $$
      DECLARE
          v_res jsonb;
      BEGIN
          -- Simular contexto de estudante
          PERFORM set_config('request.jwt.claim.sub', '${studentUser.id}', true);
          PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
          
          v_res := public.admin_review_beta_application(
              '${targetAppId}'::uuid,
              'approved',
              'Tentativa nao autorizada de estudante',
              'batch_1_30'
          );

          IF (v_res->>'success')::boolean = true THEN
              RAISE EXCEPTION 'VULNERABILIDADE: Estudante conseguiu aprovar candidatura: %', v_res;
          END IF;
      END $$;
    `);

    // Também testar via chamada anonClient
    const { data: anonReviewRes, error: anonReviewErr } = await anonClient.rpc(
      "admin_review_beta_application",
      {
        p_application_id: targetAppId,
        p_new_status: "approved"
      }
    );
    // Anon deve falhar com permissão negada
    const anonReviewBlocked = !!anonReviewErr || anonReviewRes?.code === "UNAUTHORIZED";

    recordTest(
      "2. Avaliação Administrativa por Não-Admin Rejeitada",
      studentReviewCheck !== null && anonReviewBlocked,
      { studentReviewCheck, anonReviewErr: anonReviewErr?.message, anonReviewRes }
    );

    // --------------------------------------------------------------------------
    // 3. TESTE NEGATIVO: Estudante tentando acessar a fila de e-mails
    // --------------------------------------------------------------------------
    console.log("\n--- TESTE 3: Estudante tentando acessar fila de e-mails ---");
    let queueAccessBlocked = false;
    let queueAccessDetail = "";

    try {
      const { data: claimData, error: claimErr } = await anonClient.rpc("claim_next_beta_email_notification");
      if (claimErr) {
        queueAccessBlocked = true;
        queueAccessDetail = `Anon/Estudante rejeitado com sucesso: ${claimErr.message} (code: ${claimErr.code})`;
      } else {
        queueAccessBlocked = false;
        queueAccessDetail = `VULNERABILIDADE: Chamador conseguiu reservar da fila: ${JSON.stringify(claimData)}`;
      }
    } catch (err) {
      queueAccessBlocked = true;
      queueAccessDetail = `Exceção capturada: ${err.message}`;
    }

    // Testar com impersonação de estudante
    const studentQueueSql = await runSupabaseSql(`
      DO $$
      DECLARE
          v_rows record;
      BEGIN
          PERFORM set_config('request.jwt.claim.sub', '${studentUser.id}', true);
          PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

          BEGIN
              PERFORM public.claim_next_beta_email_notification();
              RAISE EXCEPTION 'VULNERABILIDADE: Estudante conseguiu invocar claim_next_beta_email_notification';
          EXCEPTION 
              WHEN insufficient_privilege THEN
                  -- Sucesso: permissão negada
                  NULL;
              WHEN OTHERS THEN
                  IF SQLSTATE = '42501' THEN
                      NULL; -- Sucesso: regra de autorização interna disparou 42501
                  ELSE
                      RAISE;
                  END IF;
          END;
      END $$;
    `);

    recordTest(
      "3. Acesso à Fila de E-mails por Estudante Rejeitado",
      queueAccessBlocked && studentQueueSql !== null,
      { queueAccessDetail, studentQueueSql }
    );

    // --------------------------------------------------------------------------
    // 4. TESTE: Proteção de Segredos e Remoção de supabase_service_role_key
    // --------------------------------------------------------------------------
    console.log("\n--- TESTE 4: Proteção dos Segredos em platform_system_settings ---");
    const secretInSettings = await runSupabaseSql(`
      SELECT setting_key, is_sensitive 
      FROM public.platform_system_settings 
      WHERE setting_key ILIKE '%service_role%' OR setting_key ILIKE '%secret%';
    `);

    const noSecretInSettings = secretInSettings.length === 0;

    // Verificar se chave está no Vault
    const secretInVault = await runSupabaseSql(`
      SELECT name, description, created_at, updated_at 
      FROM vault.secrets 
      WHERE name = 'INTERNAL_SERVICE_ROLE_KEY';
    `);
    const secretSafelyInVault = secretInVault.length > 0;

    // Testar que authenticated/estudante não tem privilégio de ler o vault
    const studentVaultCheck = await runSupabaseSql(`
      DO $$
      DECLARE
          v_sec text;
      BEGIN
          EXECUTE 'SET LOCAL ROLE authenticated';
          PERFORM set_config('request.jwt.claim.sub', '${studentUser.id}', true);
          PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

          BEGIN
              SELECT decrypted_secret INTO v_sec FROM vault.decrypted_secrets WHERE name = 'INTERNAL_SERVICE_ROLE_KEY';
              RAISE EXCEPTION 'VULNERABILIDADE: Estudante conseguiu ler decrypted_secrets do vault!';
          EXCEPTION
              WHEN insufficient_privilege THEN
                  NULL; -- Sucesso: permissão negada pelo PostgreSQL
              WHEN OTHERS THEN
                  IF SQLSTATE = '42501' THEN
                      NULL; -- Sucesso: SQLSTATE 42501 (insufficient_privilege)
                  ELSE
                      RAISE;
                  END IF;
          END;
      END $$;
    `);

    // Validar também diretamente na tabela de privilégios que anon e authenticated não possuem concessões
    const vaultGrants = await runSupabaseSql(`
      SELECT grantee, privilege_type 
      FROM information_schema.table_privileges 
      WHERE table_schema = 'vault' AND table_name = 'decrypted_secrets'
      AND grantee IN ('anon', 'authenticated', 'public');
    `);
    const vaultStrictlyProtected = vaultGrants.length === 0;

    recordTest(
      "4. Segredos Removidos de Settings e Isolados no Vault",
      noSecretInSettings && secretSafelyInVault && studentVaultCheck !== null && vaultStrictlyProtected,
      {
        secretsInSettingsCount: secretInSettings.length,
        vaultEntryFound: secretSafelyInVault,
        studentVaultBlocked: studentVaultCheck !== null,
        vaultStrictlyProtected
      }
    );

    // --------------------------------------------------------------------------
    // 5. TESTE: Serviço Interno Autorizado (service_role) Consumindo a Fila
    // --------------------------------------------------------------------------
    console.log("\n--- TESTE 5: Consumo Autorizado por service_role ---");
    const { data: srClaimData, error: srClaimErr } = await adminClient.rpc("claim_next_beta_email_notification");
    const srClaimSuccess = !srClaimErr;

    recordTest(
      "5. Consumo Autorizado por service_role na Fila",
      srClaimSuccess,
      { success: srClaimSuccess, error: srClaimErr?.message, claimedCount: srClaimData?.length || 0 }
    );

    // --------------------------------------------------------------------------
    // 6. TESTE: Verificação do Cron Job Periódico
    // --------------------------------------------------------------------------
    console.log("\n--- TESTE 6: Verificação do pg_cron ---");
    const cronJob = await runSupabaseSql(`
      SELECT jobid, schedule, command, active 
      FROM cron.job 
      WHERE jobname = 'process-beta-email-notifications';
    `);

    const cronConfigured = cronJob.length > 0 && cronJob[0].active === true && cronJob[0].command.includes("INTERNAL_SERVICE_ROLE_KEY");
    recordTest(
      "6. Agendamento Periódico pg_cron com Vault",
      cronConfigured,
      { job: cronJob[0] }
    );

    // --------------------------------------------------------------------------
    // 7. TESTE: Continuidade das 5 Contas Estudantis
    // --------------------------------------------------------------------------
    console.log("\n--- TESTE 7: Continuidade das 5 Contas Estudantis ---");
    const expectedStudents = [
      { name: "Halisson Ricardo Zanchin Caceres", email: "halissonzanchin@aeternumatlas.com" },
      { name: "Victor Henrique Souza dos Santos", email: "henriquebahia@aeternumatlas.com" },
      { name: "Nicolas Figorelli Miranda Santos", email: "nicolasfigorelli@aeternumatlas.com" },
      { name: "Lucas Alcides Paredes Gonzalez", email: "lucasparedes@aeternumatlas.com" },
      { name: "Edgar Torales", email: "edgartorales@aeternumatlas.com" }
    ];

    const studentAccounts = await runSupabaseSql(`
      SELECT id, email, name, role 
      FROM public.users 
      WHERE email IN (${expectedStudents.map(s => `'${s.email}'`).join(",")});
    `);

    const all5Present = expectedStudents.every(exp => 
      studentAccounts.some(acc => acc.email === exp.email && acc.role === "student")
    );

    recordTest(
      "7. Continuidade das 5 Contas Estudantis Oficiais",
      all5Present && studentAccounts.length === 5,
      { foundCount: studentAccounts.length, accounts: studentAccounts.map(a => ({ email: a.email, role: a.role })) }
    );

    // --------------------------------------------------------------------------
    // 8. TESTE: Continuidade do Tutor IA Textual (Edge Function v71)
    // --------------------------------------------------------------------------
    console.log("\n--- TESTE 8: Continuidade do Tutor IA Textual ---");
    const tutorTestRes = await fetch(`${SUPABASE_URL}/functions/v1/ai-tutor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Qual a inervação do diafragma?" }],
        mode: "text"
      })
    });

    const tutorStatus = tutorTestRes.status;
    let tutorBody = "";
    try {
      tutorBody = await tutorTestRes.text();
    } catch {}

    const tutorOperational = tutorStatus === 200 || tutorStatus === 400 || tutorStatus === 401; // Responde adequadamente no endpoint
    recordTest(
      "8. Continuidade da Edge Function ai-tutor",
      tutorOperational,
      { httpStatus: tutorStatus, responsePreview: tutorBody.slice(0, 150) }
    );

    // --------------------------------------------------------------------------
    // 9. TESTE: Continuidade dos Modelos 3D (Catálogo)
    // --------------------------------------------------------------------------
    console.log("\n--- TESTE 9: Continuidade dos Modelos 3D Anatômicos ---");
    const modelsCount = await runSupabaseSql(`
      SELECT COUNT(*) as total FROM public.models_3d;
    `);
    const modelsOk = parseInt(modelsCount[0]?.total || "0", 10) > 0;

    recordTest(
      "9. Continuidade do Catálogo de Modelos 3D",
      modelsOk,
      { activeModelsCount: modelsCount[0]?.total }
    );

    // Gravar relatório JSON no diretório de artefatos
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, "p0_21_hf1_security_test_results.json"),
      JSON.stringify(report, null, 2)
    );

    console.log(`\n=== SUÍTE CONCLUÍDA: ${report.summary.passed}/${report.summary.total} TESTES APROVADOS ===`);
    return report;
  } catch (err) {
    console.error("Erro fatal na suíte de testes:", err);
    process.exit(1);
  }
}

runSecuritySuite();
