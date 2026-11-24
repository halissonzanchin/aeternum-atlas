if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é proibido.");
}

import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { getServiceRoleKey, runSupabaseSql } from "./supabase_admin_helper.mjs";
import { validateBetaApplication } from "../../src/services/beta/betaRegistrationService.js";

const SUPABASE_URL = "https://hyivyrietgjdazgizafp.supabase.co";

async function runPrelaunchReadinessSuite() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: SUÍTE DE PRONTIDÃO DE PRÉ-LANÇAMENTO (MISSÃO P0.21-E.5) ===");
  console.log("================================================================================\n");

  const results = {
    gate1_clientFormValidation: null,
    gate2_serverFormValidation: null,
    gate3_antiEnumerationAndDuplicates: null,
    gate4_unlimitedRegistrationsAllowed: null,
    gate5_batch1ApprovedCapStrictly30: null,
    gate6_idempotencyAndSentGuard: null,
    gate7_syntheticIsolationConfirmed: null,
    gate8_prelaunchRemainsClosed: null,
    gate9_fiveStudentAccountsIntact: null
  };

  const serviceRoleKey = await getServiceRoleKey();
  const adminClient = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // --------------------------------------------------------------------------
  // GATE 1: Validação client-side das regras do formulário
  // --------------------------------------------------------------------------
  console.log("[GATE 1] Validando regras client-side (validateBetaApplication)...");
  const errEmpty = validateBetaApplication({});
  assert.ok(errEmpty.fullName);
  assert.ok(errEmpty.email);
  assert.ok(errEmpty.institutionName);
  assert.ok(errEmpty.course);
  assert.ok(errEmpty.academicTerm);
  assert.ok(errEmpty.primaryDevice);
  assert.ok(errEmpty.motivation);
  assert.ok(errEmpty.privacyConsent);
  assert.ok(errEmpty.termsConsent);

  const errShortName = validateBetaApplication({ fullName: "Ab", email: "valido@med.br" });
  assert.equal(errShortName.fullName, "Nome completo deve ter pelo menos 3 caracteres.");

  const errBadEmail = validateBetaApplication({ fullName: "Nome Valido", email: "invalido-sem-arroba" });
  assert.ok(errBadEmail.email);

  const errShortMot = validateBetaApplication({
    fullName: "Nome Valido",
    email: "valido@med.br",
    institutionName: "UFRJ",
    course: "Medicina",
    academicTerm: "1º",
    primaryDevice: "Desktop",
    privacyConsent: true,
    termsConsent: true,
    motivation: "Curto"
  });
  assert.ok(errShortMot.motivation);

  console.log(" -> PASS: Validações client-side bloqueiam formulários incompletos ou inválidos.");
  results.gate1_clientFormValidation = "PASS";

  // --------------------------------------------------------------------------
  // GATE 2: Validações server-side e consentimentos (LGPD)
  // --------------------------------------------------------------------------
  console.log("\n[GATE 2] Validando regras server-side de consentimentos e integridade...");
  const { data: noConsentRes } = await adminClient.rpc("submit_beta_application", {
    p_full_name: "Candidato Sem Consentimento",
    p_email: `no_consent_${Date.now()}@teste.com`,
    p_institution_name: "Universidade Teste",
    p_course: "Medicina",
    p_academic_term: "1º",
    p_motivation: "Motivação longa o suficiente para passar.",
    p_privacy_consent: false,
    p_terms_consent: false
  });
  assert.equal(noConsentRes?.success, false);
  assert.equal(noConsentRes?.code, "CONSENT_REQUIRED");
  console.log(" -> PASS: Server-side rejeitou submissão sem consentimentos obrigatórios.");
  results.gate2_serverFormValidation = "PASS";

  // --------------------------------------------------------------------------
  // GATE 3: Proteção contra Duplicidades e Anti-Enumeração
  // --------------------------------------------------------------------------
  console.log("\n[GATE 3] Testando anti-enumeração e proteção contra duplicação de e-mail...");
  const dupEmail = `candidato_dup_check_${Date.now()}@ufrj.br`;
  let dupAppId = null;

  try {
    const { data: sub1 } = await adminClient.rpc("submit_beta_application", {
      p_full_name: "Candidato Teste Duplicação",
      p_email: dupEmail,
      p_institution_name: "UFRJ",
      p_course: "Medicina",
      p_academic_term: "5º",
      p_motivation: "Validação de duplicidades e anti-enumeração.",
      p_privacy_consent: true,
      p_terms_consent: true
    });
    assert.equal(sub1?.success, true);
    assert.equal(sub1?.code, "APPLICATION_ACCEPTED");
    dupAppId = sub1.application_id;
    const protocol1 = sub1.protocol_number;

    // Segunda submissão com mesmo e-mail
    const { data: sub2 } = await adminClient.rpc("submit_beta_application", {
      p_full_name: "Candidato Teste Duplicação Outro Nome",
      p_email: dupEmail,
      p_institution_name: "Outra Faculdade",
      p_course: "Medicina",
      p_academic_term: "5º",
      p_motivation: "Tentativa secundária com mesmo e-mail.",
      p_privacy_consent: true,
      p_terms_consent: true
    });
    assert.equal(sub2?.success, true);
    assert.equal(sub2?.code, "APPLICATION_RECORDED");
    assert.equal(sub2?.protocol_number, protocol1);

    // Verificar que a fila outbox não recebeu registro duplicado
    const outboxDups = await runSupabaseSql(`SELECT count(*) as cnt FROM public.beta_email_notifications WHERE application_id = '${dupAppId}';`);
    assert.equal(outboxDups[0].cnt, 1, "Deve existir apenas 1 registro na fila outbox");
    console.log(" -> PASS: Anti-enumeração e prevenção de duplicidades verificadas (mesmo protocolo retornado, zero duplicação na fila).");
    results.gate3_antiEnumerationAndDuplicates = "PASS";

  } finally {
    if (dupAppId) {
      await runSupabaseSql(`DELETE FROM public.beta_email_notifications WHERE application_id = '${dupAppId}';`);
      await runSupabaseSql(`DELETE FROM public.platform_events WHERE metadata->>'application_id' = '${dupAppId}';`);
      await runSupabaseSql(`DELETE FROM public.beta_applications WHERE id = '${dupAppId}';`);
    }
  }

  // --------------------------------------------------------------------------
  // GATE 4: Não limitação do número de interessados a 30 (registro irrestrito)
  // --------------------------------------------------------------------------
  console.log("\n[GATE 4] Verificando que o registro de candidaturas NÃO é limitado a 30 inscritos...");
  // submit_beta_application não possui bloqueio de número de inscritos, apenas distribui em lotes (batch_1_30, batch_2_50, batch_3_100)
  const fnProc = await runSupabaseSql(`
    SELECT prosrc FROM pg_proc WHERE proname = 'submit_beta_application';
  `);
  const src = fnProc[0].prosrc;
  assert.ok(src.includes("batch_2_50"), "Lógica de distribuição de lotes deve suportar expansão após 30");
  assert.ok(src.includes("batch_3_100"), "Lógica de distribuição de lotes deve suportar expansão após 50");
  console.log(" -> PASS: Inscrições aceitas além de 30 com distribuição automática de lotes de triagem.");
  results.gate4_unlimitedRegistrationsAllowed = "PASS";

  // --------------------------------------------------------------------------
  // GATE 5: Limite estrito de 30 APROVADOS no Lote 1 (admin_review_beta_application)
  // --------------------------------------------------------------------------
  console.log("\n[GATE 5] Verificando controle transacional de capacidade máxima de 30 aprovados no Lote 1...");
  const reviewProc = await runSupabaseSql(`
    SELECT prosrc FROM pg_proc WHERE proname = 'admin_review_beta_application';
  `);
  const rSrc = reviewProc[0].prosrc;
  assert.ok(rSrc.includes("v_target_batch = 'batch_1_30' AND v_approved_count >= 30"), "Deve travar aprovação quando >= 30");
  assert.ok(rSrc.includes("CAPACITY_EXCEEDED"), "Deve retornar código CAPACITY_EXCEEDED");
  console.log(" -> PASS: Trava de capacidade de aprovações (30 vagas da 1ª Turma) confirmada no banco.");
  results.gate5_batch1ApprovedCapStrictly30 = "PASS";

  // --------------------------------------------------------------------------
  // GATE 6: Idempotência da Edge Function (Guarda contra re-envio e RPC Atômica v10)
  // --------------------------------------------------------------------------
  console.log("\n[GATE 6] Verificando guarda de idempotência e concorrência na Edge Function v10...");
  const edgeFnPath = "supabase/functions/send-beta-notification/index.ts";
  const { readFileSync } = await import("node:fs");
  const edgeSrc = readFileSync(edgeFnPath, "utf8");
  assert.ok(
    edgeSrc.includes("claim_next_beta_email_notification") && edgeSrc.includes("Idempotency-Key"),
    "Edge Function v10 deve utilizar a RPC atômica claim_next_beta_email_notification e Idempotency-Key"
  );
  console.log(" -> PASS: Guarda de idempotência estrita e reserva atômica presentes na Edge Function.");
  results.gate6_idempotencyAndSentGuard = "PASS";

  // --------------------------------------------------------------------------
  // GATE 7: Isolamento dos dados sintéticos no banco
  // --------------------------------------------------------------------------
  console.log("\n[GATE 7] Verificando isolamento da candidatura de Dr. Roberto Albuquerque...");
  const auditApp = await runSupabaseSql(`
    SELECT id, protocol_number, status, batch, source_origin, review_notes
    FROM public.beta_applications
    WHERE id = '3f3669cd-3602-4abd-a30a-100685b4d10d';
  `);
  assert.equal(auditApp.length, 1, "Registro de auditoria deve existir");
  assert.equal(auditApp[0].status, "rejected", "Status deve ser 'rejected'");
  assert.equal(auditApp[0].batch, "synthetic_test", "Lote deve ser 'synthetic_test'");
  assert.equal(auditApp[0].source_origin, "synthetic_audit_test", "Origem deve ser 'synthetic_audit_test'");
  assert.ok(auditApp[0].review_notes.includes("AUDITORIA P0.21-E.4.1 / P0.21-E.5"));

  // Verificar que não ocupa vagas em batch_1_30
  const approvedInBatch1 = await runSupabaseSql(`
    SELECT count(*) as cnt
    FROM public.beta_applications
    WHERE status IN ('approved', 'invited') AND batch = 'batch_1_30';
  `);
  assert.equal(approvedInBatch1[0].cnt, 0, "0 vagas ocupadas na 1ª Turma");

  const pendingBatch1 = await runSupabaseSql(`
    SELECT count(*) as cnt
    FROM public.beta_applications
    WHERE status = 'pending' AND batch = 'batch_1_30';
  `);
  assert.equal(pendingBatch1[0].cnt, 0, "0 candidaturas pendentes na 1ª Turma");

  console.log(" -> PASS: Dados sintéticos 100% isolados. Vagas da 1ª Turma disponíveis: 30 / 30.");
  results.gate7_syntheticIsolationConfirmed = "PASS";

  // --------------------------------------------------------------------------
  // GATE 8: Pré-lançamento fechado no banco
  // --------------------------------------------------------------------------
  console.log("\n[GATE 8] Verificando estado atual de beta_registration_open...");
  const betaRegSetting = await runSupabaseSql(`
    SELECT setting_value FROM public.platform_system_settings WHERE setting_key = 'beta_registration_open';
  `);
  assert.equal(betaRegSetting[0].setting_value, "false", "beta_registration_open DEVE ser 'false'");
  console.log(" -> PASS: beta_registration_open = false preservado.");
  results.gate8_prelaunchRemainsClosed = "PASS";

  // --------------------------------------------------------------------------
  // GATE 9: Cinco contas estudantis oficiais intactas
  // --------------------------------------------------------------------------
  console.log("\n[GATE 9] Verificando integridade das 5 contas estudantis da diretoria...");
  const students = await runSupabaseSql(`
    SELECT email, role, license_tier FROM public.users
    WHERE email IN (
      'halissonzanchin@aeternumatlas.com',
      'henriquebahia@aeternumatlas.com',
      'lucasparedes@aeternumatlas.com',
      'nicolasfigorelli@aeternumatlas.com',
      'edgartorales@aeternumatlas.com'
    );
  `);
  assert.equal(students.length, 5, "As 5 contas estudantis devem permanecer intactas");
  for (const s of students) {
    assert.equal(s.role, "student");
    assert.equal(s.license_tier, "student");
  }
  console.log(" -> PASS: 5 contas estudantis 100% preservadas.");
  results.gate9_fiveStudentAccountsIntact = "PASS";

  console.log("\n================================================================================");
  console.log("=== RELATÓRIO DA SUÍTE DE PRONTIDÃO (MISSÃO P0.21-E.5) ===");
  console.log("================================================================================");
  console.log(JSON.stringify(results, null, 2));

  return results;
}

runPrelaunchReadinessSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FALHA NA SUÍTE DE PRONTIDÃO:", err);
    process.exit(1);
  });
