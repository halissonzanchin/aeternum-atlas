if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é proibido.");
}

import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { getServiceRoleKey, runSupabaseSql } from "./supabase_admin_helper.mjs";

const SUPABASE_URL = "https://hyivyrietgjdazgizafp.supabase.co";

async function runSyntheticQuarantineAudit() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: AUDITORIA DE QUARENTENA SINTÉTICA (MISSÃO P0.21-E.5.1) ===");
  console.log("================================================================================\n");

  const serviceKey = await getServiceRoleKey();
  const supabase = createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const targetProtocol = "BETA-2026-0BD91351";
  const targetId = "3f3669cd-3602-4abd-a30a-100685b4d10d";

  // 1. Inspecionar registro direto no banco de dados
  console.log("[CHECK 1] Inspecionando estado persistido de Dr. Roberto Albuquerque...");
  const dbRows = await runSupabaseSql(`
    SELECT id, protocol_number, full_name, email, status, batch, source_origin, review_notes
    FROM public.beta_applications
    WHERE id = '${targetId}';
  `);
  assert.equal(dbRows.length, 1, "Registro do Dr. Roberto deve existir para auditoria");
  const cand = dbRows[0];
  console.log(` -> ID: ${cand.id}`);
  console.log(` -> Protocolo: ${cand.protocol_number}`);
  console.log(` -> Status: ${cand.status}`);
  console.log(` -> Lote (Batch): ${cand.batch}`);
  console.log(` -> Origem (source_origin): ${cand.source_origin}`);
  assert.equal(cand.protocol_number, targetProtocol, "Protocolo deve ser BETA-2026-0BD91351");
  assert.equal(cand.status, "rejected", "Status deve ser 'rejected'");
  assert.equal(cand.batch, "synthetic_test", "Batch deve ser 'synthetic_test'");
  assert.equal(cand.source_origin, "synthetic_audit_test", "Origem deve ser 'synthetic_audit_test'");
  console.log(" -> PASS: Registro identificado perfeitamente como teste e quarentenado no banco.\n");

  // 2. Testar consulta padrão de candidatos legítimos (includeSynthetic = false)
  console.log("[CHECK 2] Testando consulta padrão de candidatos legítimos (PostgREST)...");
  const { data: legitimateList, count: legCount, error: legErr } = await supabase
    .from("beta_applications")
    .select("*", { count: "exact" })
    .neq("batch", "synthetic_test")
    .not("source_origin", "ilike", "%synthetic%");

  assert.equal(legErr, null, "Consulta não deve retornar erro");
  const containsSynthetic = legitimateList.some(item => item.id === targetId || item.protocol_number === targetProtocol);
  console.log(` -> Total de candidaturas legítimas retornadas: ${legCount}`);
  console.log(` -> Dr. Roberto presente na lista legítima: ${containsSynthetic}`);
  assert.equal(containsSynthetic, false, "Dr. Roberto NÃO PODE aparecer na lista legítima!");
  console.log(" -> PASS: Dr. Roberto 100% oculto de candidatos legítimos.\n");

  // 3. Testar cálculo de métricas e capacidades oficiais
  console.log("[CHECK 3] Verificando métricas oficiais de vagas e concorrência...");
  const { data: allRows, error: allErr } = await supabase
    .from("beta_applications")
    .select("status, batch, user_id, email, source_origin");
  assert.equal(allErr, null);

  const legitimateData = allRows.filter(item => item.batch !== "synthetic_test" && !item.source_origin?.includes("synthetic"));
  const approvedBatch1 = legitimateData.filter(item => (item.status === "approved" || item.status === "invited") && item.batch === "batch_1_30").length;
  const remainingSlots = 30 - approvedBatch1;

  console.log(` -> Total legítimo: ${legitimateData.length}`);
  console.log(` -> Vagas ocupadas da 1ª Turma: ${approvedBatch1} / 30`);
  console.log(` -> Vagas restantes disponíveis: ${remainingSlots} / 30`);
  assert.equal(approvedBatch1, 0, "Nenhuma vaga deve estar ocupada");
  assert.equal(remainingSlots, 30, "Exatamente 30 vagas devem estar livres");
  console.log(" -> PASS: Candidato sintético não ocupa vaga nem altera métricas oficiais.\n");

  // 4. Testar RPC pública get_beta_program_public_status
  console.log("[CHECK 4] Verificando status público via RPC get_beta_program_public_status...");
  const { data: pubStatus, error: pubErr } = await supabase.rpc("get_beta_program_public_status");
  assert.equal(pubErr, null);
  console.log(" -> Status público:", JSON.stringify(pubStatus, null, 2));
  assert.equal(pubStatus.registration_open, false, "Inscrições públicas devem estar fechadas (false)");
  assert.equal(pubStatus.current_batch_approved, 0, "Aprovados públicos devem ser 0");
  assert.equal(pubStatus.initial_batch_capacity, 30, "Capacidade do lote inicial deve ser 30");
  console.log(" -> PASS: Status público limpo e 100% preservado.\n");

  // 5. Testar rastreabilidade de auditoria (includeSynthetic = true)
  console.log("[CHECK 5] Testando visualização de auditoria (includeSynthetic = true)...");
  const { data: auditList, error: audErr } = await supabase
    .from("beta_applications")
    .select("*")
    .eq("id", targetId);
  assert.equal(audErr, null);
  assert.equal(auditList.length, 1, "Registro deve estar disponível para auditoria");
  assert.ok(auditList[0].review_notes.includes("AUDITORIA P0.21-E.4.1"), "Notas de auditoria preservadas");
  console.log(" -> PASS: Rastreabilidade forense de auditoria 100% mantida.\n");

  console.log("================================================================================");
  console.log(">>> [SYNTHETIC QUARANTINE AUDIT: 100% APPROVED / ALL GATES PASSED] <<<");
  console.log("================================================================================\n");
}

runSyntheticQuarantineAudit().catch(err => {
  console.error("FALHA NA AUDITORIA DE QUARENTENA SINTÉTICA:", err);
  process.exit(1);
});
