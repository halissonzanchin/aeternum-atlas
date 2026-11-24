if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é proibido.");
}

import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { getServiceRoleKey, runSupabaseSql } from "./supabase_admin_helper.mjs";

const SUPABASE_URL = "https://hyivyrietgjdazgizafp.supabase.co";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-beta-notification`;

async function runConcurrencyTest() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: TESTE DE CONCORRÊNCIA E IDEMPOTÊNCIA (MISSÃO P0.21-E.5.1) ===");
  console.log("================================================================================\n");

  const serviceKey = await getServiceRoleKey();
  const supabase = createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // --------------------------------------------------------------------------
  // TESTE 1: Proteção de Notificação já Enviada (Dr. Roberto Albuquerque)
  // --------------------------------------------------------------------------
  console.log("[TESTE 1] Verificando se notificação 'sent' é estritamente ignorada por todas as vias...");
  const sentNotifId = "8331cdec-2d1e-4e1f-8e8d-4ec77b85628d";
  const sentAppId = "3f3669cd-3602-4abd-a30a-100685b4d10d";

  // 1.1 Via RPC direta por notification_id
  const { data: rpcRes1, error: rpcErr1 } = await supabase.rpc("claim_next_beta_email_notification", {
    p_notification_id: sentNotifId
  });
  assert.equal(rpcErr1, null, "RPC não deve retornar erro");
  assert.equal(rpcRes1.length, 0, "Notificação já enviada NÃO pode ser reservada por notification_id");

  // 1.2 Via RPC direta por application_id
  const { data: rpcRes2, error: rpcErr2 } = await supabase.rpc("claim_next_beta_email_notification", {
    p_application_id: sentAppId
  });
  assert.equal(rpcErr2, null, "RPC não deve retornar erro");
  assert.equal(rpcRes2.length, 0, "Notificação já enviada NÃO pode ser reservada por application_id");

  // 1.3 Via Edge Function v10 com notification_id
  const fnRes = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ notification_id: sentNotifId })
  });
  assert.equal(fnRes.status, 200, "Edge Function deve responder 200");
  const fnData = await fnRes.json();
  assert.equal(fnData.queue_status, "idle", "Edge function deve reportar queue_status: idle sem disparar");
  assert.equal(fnData.version, "v10", "Edge function deve confirmar versão v10");
  console.log(" -> PASS: Notificação já enviada é 100% rejeitada para reenvio.\n");

  // --------------------------------------------------------------------------
  // TESTE 2: Disparo Concorrente de 10 Requisições Simultâneas (Race Condition)
  // --------------------------------------------------------------------------
  console.log("[TESTE 2] Criando registro sintético temporário para estressar concorrência...");
  const tempAppId = "3f3669cd-3602-4abd-a30a-100685b4d10d"; // Candidato sintético existente de auditoria
  const tempNotifId = "b0000000-0000-0000-0000-000000000001";

  // Limpeza prévia
  await runSupabaseSql(`
    DELETE FROM public.beta_email_notifications WHERE id = '${tempNotifId}';
  `);

  // Inserção de notificação em estado 'queued'
  await runSupabaseSql(`
    INSERT INTO public.beta_email_notifications (
      id,
      application_id,
      event_type,
      recipient_email,
      subject,
      status,
      attempts,
      max_attempts
    ) VALUES (
      '${tempNotifId}',
      '${tempAppId}',
      'concurrency_test',
      'audit_test@aeternumatlas.med.br',
      '[TESTE DE CONCORRÊNCIA] Prova atômica SKIP LOCKED',
      'queued',
      0,
      3
    );
  `);

  console.log("Disparando 10 chamadas simultâneas à RPC claim_next_beta_email_notification...");
  const concurrentPromises = Array.from({ length: 10 }, (_, i) => {
    return supabase.rpc("claim_next_beta_email_notification", {
      p_notification_id: tempNotifId
    });
  });

  const results = await Promise.all(concurrentPromises);
  const claimedCounts = results.filter(r => r.data && r.data.length > 0);
  const emptyCounts = results.filter(r => r.data && r.data.length === 0);

  console.log(` -> Total de chamadas disparadas em paralelo: 10`);
  console.log(` -> Chamadas que conseguiram reservar a linha: ${claimedCounts.length}`);
  console.log(` -> Chamadas que receberam vazio (SKIP LOCKED): ${emptyCounts.length}`);

  assert.equal(claimedCounts.length, 1, "EXATAMENTE UMA chamada concorrente deve conseguir reservar a linha!");
  assert.equal(emptyCounts.length, 9, "EXATAMENTE NOVE chamadas concorrentes devem ser rejeitadas via SKIP LOCKED!");

  // --------------------------------------------------------------------------
  // TESTE 3: Verificação de Estado no Banco após Concorrência
  // --------------------------------------------------------------------------
  console.log("\n[TESTE 3] Inspecionando estado da linha no banco de dados...");
  const rowCheck = await runSupabaseSql(`
    SELECT id, status, attempts, last_attempt_at 
    FROM public.beta_email_notifications 
    WHERE id = '${tempNotifId}';
  `);

  const row = rowCheck[0];
  console.log(` -> Status pós-reserva: ${row.status}`);
  console.log(` -> Tentativas registradas: ${row.attempts}`);
  assert.equal(row.status, "processing", "Status deve ter transitado para 'processing'");
  assert.equal(row.attempts, 1, "Tentativas devem ser exatamente 1 (não 10)");

  // --------------------------------------------------------------------------
  // TESTE 4: Tentativa Posterior Imediata (Enquanto em 'processing')
  // --------------------------------------------------------------------------
  console.log("\n[TESTE 4] Tentativa de reserva subsequente enquanto em 'processing'...");
  const { data: immediateSubsequent } = await supabase.rpc("claim_next_beta_email_notification", {
    p_notification_id: tempNotifId
  });
  assert.equal(immediateSubsequent.length, 0, "Notificação em 'processing' ativo NÃO pode ser reservada");
  console.log(" -> PASS: Notificação em processamento ativo está protegida contra concorrência.");

  // --------------------------------------------------------------------------
  // TESTE 5: Limpeza e Quarentena
  // --------------------------------------------------------------------------
  console.log("\n[TESTE 5] Excluindo linha sintética de teste de estresse...");
  await runSupabaseSql(`
    DELETE FROM public.beta_email_notifications WHERE id = '${tempNotifId}';
  `);
  console.log(" -> PASS: Linha de estresse removida com segurança.");

  console.log("\n================================================================================");
  console.log(">>> [CONCURRENCY & IDEMPOTENCY AUDIT: 100% APPROVED / ALL GATES PASSED] <<<");
  console.log("================================================================================\n");
}

runConcurrencyTest().catch(err => {
  console.error("FALHA NO TESTE DE CONCORRÊNCIA:", err);
  process.exit(1);
});
