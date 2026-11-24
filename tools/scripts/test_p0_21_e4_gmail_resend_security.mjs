if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é expressamente proibido no Aeternum Atlas.");
}

import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { getAnonKey, getServiceRoleKey, runSupabaseSql } from "./supabase_admin_helper.mjs";

const SUPABASE_URL = "https://hyivyrietgjdazgizafp.supabase.co";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-beta-notification`;

async function runSecurityAndIntegrationTests() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: TESTES DE SEGURANÇA E INTEGRAÇÃO RESEND (P0.21-E.4) ===");
  console.log("================================================================================\n");

  const anonKey = await getAnonKey();
  const serviceRoleKey = await getServiceRoleKey();

  const anonClient = createClient(SUPABASE_URL, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const adminClient = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const testReport = {
    test1_edgeMissingAuth: null,
    test2_edgeAnonKeyRejected: null,
    test3_edgeForgedTokenForbidden: null,
    test4_edgeServiceRoleAccepted: null,
    test5_submitAnonPrelaunchBlocked: null,
    test6_directAnonApplicationsRlsBlocked: null,
    test7_directAnonOutboxRlsBlocked: null,
    test8_claimNextRestrictedToServiceRole: null,
    test9_syntheticApplicationPipeline: null,
    test10_resendConfigurationStatus: null
  };

  // -------------------------------------------------------------
  // TESTE 1: Edge Function sem cabeçalho Authorization
  // -------------------------------------------------------------
  console.log("[TESTE 1] Chamada à Edge Function sem Authorization...");
  const res1 = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trigger: "unauthorized_probe" })
  });
  console.log(` -> Status: HTTP ${res1.status}`);
  const json1 = await res1.json();
  assert.equal(res1.status, 401, "Deve retornar HTTP 401");
  assert.equal(json1.code, "AUTH_MISSING", "Deve indicar AUTH_MISSING");
  console.log(" -> PASS: Chamada anônima sem token rejeitada com HTTP 401 AUTH_MISSING.");
  testReport.test1_edgeMissingAuth = "PASS";

  // -------------------------------------------------------------
  // TESTE 2: Edge Function com Anon Key pública (rejeição estrita)
  // -------------------------------------------------------------
  console.log("\n[TESTE 2] Chamada à Edge Function com chave anônima pública (anon key)...");
  const res2 = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${anonKey}`,
      "apikey": anonKey
    },
    body: JSON.stringify({ trigger: "anon_key_probe" })
  });
  console.log(` -> Status: HTTP ${res2.status}`);
  const json2 = await res2.json();
  assert.equal(res2.status, 401, "Deve retornar HTTP 401");
  assert.equal(json2.code, "ANON_KEY_REJECTED", "Deve indicar ANON_KEY_REJECTED");
  console.log(" -> PASS: Anon key estritamente rejeitada com HTTP 401 ANON_KEY_REJECTED.");
  testReport.test2_edgeAnonKeyRejected = "PASS";

  // -------------------------------------------------------------
  // TESTE 3: Edge Function com token inválido/forjado
  // -------------------------------------------------------------
  console.log("\n[TESTE 3] Chamada à Edge Function com JWT inválido...");
  const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6ImFkbWluIn0.fake_signature";
  const res3 = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${fakeToken}`
    },
    body: JSON.stringify({ trigger: "fake_token_probe" })
  });
  console.log(` -> Status: HTTP ${res3.status}`);
  const json3 = await res3.json();
  assert.equal(res3.status, 403, "Deve retornar HTTP 403");
  assert.equal(json3.code, "AUTH_FORBIDDEN", "Deve indicar AUTH_FORBIDDEN");
  console.log(" -> PASS: Token forjado rejeitado com HTTP 403 AUTH_FORBIDDEN.");
  testReport.test3_edgeForgedTokenForbidden = "PASS";

  // -------------------------------------------------------------
  // TESTE 4: Edge Function com Service Role Key (Autorizada)
  // -------------------------------------------------------------
  console.log("\n[TESTE 4] Chamada à Edge Function com service_role...");
  const res4 = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceRoleKey}`,
      "apikey": serviceRoleKey
    },
    body: JSON.stringify({ trigger: "service_role_authorized_check" })
  });
  console.log(` -> Status: HTTP ${res4.status}`);
  const json4 = await res4.json();
  assert.equal(res4.status, 200, "Deve retornar HTTP 200");
  assert.equal(json4.actor, "service_role", "Actor deve ser service_role");
  console.log(` -> PASS: Chamada autorizada com sucesso (queue_status: ${json4.queue_status || 'ok'}).`);
  testReport.test4_edgeServiceRoleAccepted = "PASS";

  // -------------------------------------------------------------
  // TESTE 5: Submissão Anônima com beta_registration_open = false
  // -------------------------------------------------------------
  console.log("\n[TESTE 5] Submissão anônima enquanto beta_registration_open = false (Pré-lançamento)...");
  const { data: subAnonData, error: subAnonErr } = await anonClient.rpc("submit_beta_application", {
    p_full_name: "Candidato Prelaunch Anônimo",
    p_email: "prelaunch_anon@teste.com",
    p_institution_name: "Universidade Teste",
    p_course: "Medicina",
    p_academic_term: "1º Semestre",
    p_primary_device: "Desktop",
    p_motivation: "Desejo participar do programa beta em teste.",
    p_privacy_consent: true,
    p_terms_consent: true
  });
  console.log(" -> Resposta RPC Anônima:", subAnonData);
  assert.equal(subAnonData?.success, false);
  assert.equal(subAnonData?.code, "BETA_REGISTRATION_PRELAUNCH");
  assert.equal(subAnonData?.status, "pre_launch");
  console.log(" -> PASS: Chamada pública anônima estritamente bloqueada pelo gate de pré-lançamento.");
  testReport.test5_submitAnonPrelaunchBlocked = "PASS";

  // -------------------------------------------------------------
  // TESTE 6: Acesso Direto Anônimo a beta_applications (RLS)
  // -------------------------------------------------------------
  console.log("\n[TESTE 6] Consulta anônima direta à tabela beta_applications (RLS)...");
  const { data: appRows, error: appErr } = await anonClient.from("beta_applications").select("id, full_name, email");
  console.log(` -> Linhas retornadas para anônimo: ${appRows?.length || 0}`);
  assert.equal(appRows?.length || 0, 0, "RLS deve impedir qualquer linha para anônimo");
  console.log(" -> PASS: RLS bloqueou leitura anônima de beta_applications (0 linhas).");
  testReport.test6_directAnonApplicationsRlsBlocked = "PASS";

  // -------------------------------------------------------------
  // TESTE 7: Acesso Direto Anônimo à fila beta_email_notifications (RLS)
  // -------------------------------------------------------------
  console.log("\n[TESTE 7] Consulta anônima direta à fila beta_email_notifications (RLS)...");
  const { data: outboxRows, error: outboxErr } = await anonClient.from("beta_email_notifications").select("id, recipient_email");
  console.log(` -> Linhas retornadas para anônimo: ${outboxRows?.length || 0}`);
  assert.equal(outboxRows?.length || 0, 0, "RLS deve impedir qualquer linha para anônimo");
  console.log(" -> PASS: RLS bloqueou leitura anônima de beta_email_notifications (0 linhas).");
  testReport.test7_directAnonOutboxRlsBlocked = "PASS";

  // -------------------------------------------------------------
  // TESTE 8: Execução direta de claim_next_beta_email_notification por anon
  // -------------------------------------------------------------
  console.log("\n[TESTE 8] Tentativa de execução de claim_next_beta_email_notification por anônimo...");
  const { data: claimAnonData, error: claimAnonErr } = await anonClient.rpc("claim_next_beta_email_notification");
  console.log(" -> Erro retornado para anônimo:", claimAnonErr?.message || claimAnonData);
  assert.ok(claimAnonErr, "RPC restrita deve lançar erro para anônimo");
  console.log(" -> PASS: claim_next_beta_email_notification estritamente restrita a service_role.");
  testReport.test8_claimNextRestrictedToServiceRole = "PASS";

  // -------------------------------------------------------------
  // TESTE 9 & 10: Fluxo Sintético Controlado (Privilegiado) e Resend Status
  // -------------------------------------------------------------
  console.log("\n[TESTE 9 & 10] Executando pipeline com candidatura sintética controlada...");
  const syntheticEmail = `sintetico_p0_21_e4_${Date.now()}@aeternumatlas.med.br`;
  let syntheticAppId = null;
  let syntheticNotifId = null;

  try {
    // 1. Submissão privilegiada (simulando canal administrativo seguro)
    const { data: synSubRes, error: synSubErr } = await adminClient.rpc("submit_beta_application", {
      p_full_name: "Candidato Sintético P0.21-E.4 (Certificação)",
      p_email: syntheticEmail,
      p_institution_name: "Instituto de Ciências Biomédicas - UFRJ",
      p_course: "Medicina",
      p_academic_term: "8º período",
      p_student_group: "Internato Médico",
      p_primary_device: "Desktop Windows / iPad Pro",
      p_motivation: "Validação do fluxo ponta a ponta de recebimento e notificações administrativas.",
      p_privacy_consent: true,
      p_terms_consent: true,
      p_communication_consent: true,
      p_source_origin: "test_synthetic_e4"
    });

    if (synSubErr || !synSubRes?.success) {
      throw new Error(`Falha ao registrar candidatura sintética: ${synSubErr?.message || JSON.stringify(synSubRes)}`);
    }

    syntheticAppId = synSubRes.application_id;
    console.log(` - Candidatura sintética registrada: ID=${syntheticAppId}, Protocolo=${synSubRes.protocol_number}, Status=${synSubRes.status}`);
    assert.equal(synSubRes.status, "pending");
    assert.ok(synSubRes.protocol_number.startsWith("BETA-2026-"));

    // 2. Verificar inserção na fila outbox (beta_email_notifications)
    const queueRows = await runSupabaseSql(`
      SELECT id, application_id, recipient_email, subject, status, attempts, error_message
      FROM public.beta_email_notifications
      WHERE application_id = '${syntheticAppId}';
    `);
    assert.equal(queueRows.length, 1, "Deve existir exatamente 1 registro na fila de e-mail");
    syntheticNotifId = queueRows[0].id;
    console.log(` - Entrada na fila confirmada: ID=${syntheticNotifId}, Destinatário=${queueRows[0].recipient_email}, Status=${queueRows[0].status}`);
    assert.equal(queueRows[0].recipient_email, "aeternumatlas@gmail.com");

    // 3. Acionar Edge Function send-beta-notification para processar o item
    console.log(" - Disparando Edge Function com service_role para processar a notificação...");
    const procRes = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      },
      body: JSON.stringify({
        notification_id: syntheticNotifId,
        application_id: syntheticAppId
      })
    });

    const procJson = await procRes.json();
    console.log(" - Resposta da Edge Function:", procJson);

    // 4. Inspecionar estado persistido da notificação no banco
    const updatedQueueRows = await runSupabaseSql(`
      SELECT id, status, attempts, error_message, provider, provider_message_id, last_attempt_at, sent_at
      FROM public.beta_email_notifications
      WHERE id = '${syntheticNotifId}';
    `);
    console.log(" - Estado atualizado no banco:", updatedQueueRows[0]);

    if (procJson.status === "BLOCKED" && procJson.code === "EMAIL_DELIVERY_BLOCKED_EXTERNAL_CONFIGURATION") {
      console.log(" -> Resend Status: BLOCKED_EXTERNAL_CONFIGURATION (esperado na ausência de RESEND_API_KEY).");
      testReport.test10_resendConfigurationStatus = "BLOCKED_EXTERNAL_CONFIGURATION";
    } else if (procJson.status === "SENT") {
      console.log(` -> Resend Status: SENT com provider_message_id: ${procJson.provider_message_id}`);
      testReport.test10_resendConfigurationStatus = "SENT";
    } else {
      console.log(` -> Resend Status: ${procJson.status}`);
      testReport.test10_resendConfigurationStatus = procJson.status;
    }

    // 5. Verificar que NENHUMA conta de usuário foi provisionada
    const checkAuthUsers = await runSupabaseSql(`SELECT id FROM auth.users WHERE email = '${syntheticEmail}';`);
    const checkPublicUsers = await runSupabaseSql(`SELECT id FROM public.users WHERE email = '${syntheticEmail}';`);
    assert.equal(checkAuthUsers.length, 0, "Candidatura NÃO deve criar conta em auth.users");
    assert.equal(checkPublicUsers.length, 0, "Candidatura NÃO deve criar conta em public.users");
    console.log(" -> PASS: Zero contas provisionadas automaticamente.");

    // 6. Verificar que candidatura permaneceu em 'pending' (NÃO aprovada automaticamente)
    const checkApp = await runSupabaseSql(`SELECT status FROM public.beta_applications WHERE id = '${syntheticAppId}';`);
    assert.equal(checkApp[0].status, "pending", "Status deve permanecer estritamente 'pending'");
    console.log(" -> PASS: Seleção manual estrita preservada (status permanece 'pending').");

    testReport.test9_syntheticApplicationPipeline = "PASS";

  } finally {
    // 7. Limpeza rigorosa do registro sintético
    if (syntheticAppId) {
      console.log("\n[Teardown] Limpando dados sintéticos de teste...");
      await runSupabaseSql(`DELETE FROM public.beta_email_notifications WHERE application_id = '${syntheticAppId}';`);
      await runSupabaseSql(`DELETE FROM public.platform_events WHERE metadata->>'application_id' = '${syntheticAppId}';`);
      await runSupabaseSql(`DELETE FROM public.beta_applications WHERE id = '${syntheticAppId}';`);
      console.log(" -> Teardown concluído: banco limpo e sem poluição de dados sintéticos.");
    }
  }

  console.log("\n================================================================================");
  console.log("=== SUMÁRIO DOS TESTES DE SEGURANÇA E INTEGRAÇÃO (P0.21-E.4) ===");
  console.log("================================================================================");
  console.log(JSON.stringify(testReport, null, 2));

  return testReport;
}

runSecurityAndIntegrationTests()
  .then(() => {
    console.log("\n>>> Testes concluídos com sucesso.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("FALHA NOS TESTES:", err);
    process.exit(1);
  });
