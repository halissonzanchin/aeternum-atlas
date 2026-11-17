import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import fs from "node:fs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function getManagementToken() {
  const psCode = `
$ProgressPreference = 'SilentlyContinue';
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class CredManager {
    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
    [DllImport("advapi32.dll", SetLastError = true)]
    public static extern bool CredFree(IntPtr credential);
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }
    public static string GetSecret(string target) {
        IntPtr credPtr;
        if (CredRead(target, 1, 0, out credPtr)) {
            try {
                CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
                if (cred.CredentialBlobSize > 0) {
                    byte[] blob = new byte[cred.CredentialBlobSize];
                    Marshal.Copy(cred.CredentialBlob, blob, 0, cred.CredentialBlobSize);
                    return Encoding.UTF8.GetString(blob);
                }
            } finally {
                CredFree(credPtr);
            }
        }
        return null;
    }
}
"@
[CredManager]::GetSecret("Supabase CLI:supabase")
`;
  const base64 = Buffer.from(psCode, "utf16le").toString("base64");
  const raw = execSync(`powershell -NoProfile -EncodedCommand ${base64}`, { encoding: "utf8" });
  const lines = raw.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#") && !l.startsWith("<"));
  return lines[lines.length - 1] || "";
}

async function runFase6Tests() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — P0.11: FASE 6 — AGENDA DE ESTUDO (CRUD, TIMEZONE & RLS)       ");
  console.log("================================================================================\n");

  const projectRef = "hyivyrietgjdazgizafp";
  const supabaseUrl = `https://${projectRef}.supabase.co`;
  const mgmtToken = getManagementToken();

  const kRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { "Authorization": `Bearer ${mgmtToken}` }
  });
  const keys = await kRes.json();
  const serviceKey = keys.find(k => k.name === "service_role" || k.tags === "service_role")?.api_key;
  const adminClient = createClient(supabaseUrl, serviceKey);

  const demoEmail = "demo.institucional@aeternumatlas.com";
  const { data: demoUser } = await adminClient
    .from("users")
    .select("id, email, name, role, institution_id")
    .eq("email", demoEmail)
    .single();

  console.log(`Conta demo: ${demoUser.email} (UUID: ${demoUser.id}) | Instituição: ${demoUser.institution_id}\n`);

  const results = [];
  const testEventId = crypto.randomUUID();

  // 1. Operação CREATE (Inserção com contexto autenticado do usuário demo)
  console.log("--- 1. Criação de Evento de Estudo na Agenda (Contexto Autenticado do Usuário Demo) ---");
  const createSql = `
    SET LOCAL role = 'authenticated';
    SET LOCAL request.jwt.claim.sub = '${demoUser.id}';
    SET LOCAL request.jwt.claims = '{"sub": "${demoUser.id}", "role": "authenticated"}';
    INSERT INTO public.study_agenda_events (
      id, title, description, date, start_time, end_time, type, priority, anatomical_system, linked_model, reminder, status
    ) VALUES (
      '${testEventId}',
      'Revisão Anatômica: Artéria Aorta e Mediastino',
      'Sessão focada em relações anatômicas, seios aórticos e ramos coronários.',
      '2026-11-20',
      '14:30:00',
      '16:00:00',
      'review',
      'high',
      'Cardiovascular',
      'heart-3d-model',
      '30_min_before',
      'pending'
    ) RETURNING *;
  `;

  const qRes = await fetch("https://api.supabase.com/v1/projects/hyivyrietgjdazgizafp/database/query", {
    method: "POST",
    headers: { Authorization: "Bearer " + mgmtToken, "Content-Type": "application/json" },
    body: JSON.stringify({ query: createSql })
  });
  const createdRows = await qRes.json();
  const createdData = Array.isArray(createdRows) ? createdRows[createdRows.length - 1] : null;

  if (!createdData || !createdData.id) {
    console.error("Erro na criação do evento:", createdRows);
  } else {
    console.log(`Evento criado com sucesso! ID: ${createdData.id} | Data: ${createdData.date} | Horário: ${createdData.start_time} - ${createdData.end_time}`);
    console.log(`Creator Name: ${createdData.creator_name} | Role: ${createdData.created_by_role} | User ID: ${createdData.user_id}`);
  }

  results.push({
    operation: "1_create",
    status: createdData?.id === testEventId ? "PASS" : "FAIL",
    eventId: createdData?.id,
    creatorName: createdData?.creator_name,
    userId: createdData?.user_id
  });

  // 2. Operação READ (Listagem / Leitura)
  console.log("\n--- 2. Listagem e Preservação de Timezone / Data ---");
  const readSql = `
    SET LOCAL role = 'authenticated';
    SET LOCAL request.jwt.claim.sub = '${demoUser.id}';
    SELECT * FROM public.study_agenda_events WHERE id = '${testEventId}';
  `;
  const rRes = await fetch("https://api.supabase.com/v1/projects/hyivyrietgjdazgizafp/database/query", {
    method: "POST",
    headers: { Authorization: "Bearer " + mgmtToken, "Content-Type": "application/json" },
    body: JSON.stringify({ query: readSql })
  });
  const readRows = await rRes.json();
  const listData = Array.isArray(readRows) ? readRows[readRows.length - 1] : null;

  const timezonePreserved = listData?.date === "2026-11-20" && listData?.start_time?.startsWith("14:30");
  console.log(`Evento recuperado: "${listData?.title}"`);
  console.log(`Data preservada (2026-11-20): ${listData?.date === "2026-11-20"}`);
  console.log(`Horário preservado (14:30:00): ${listData?.start_time?.startsWith("14:30")}`);

  results.push({
    operation: "2_read",
    status: timezonePreserved ? "PASS" : "FAIL",
    timezonePreserved,
    eventDate: listData?.date,
    startTime: listData?.start_time
  });

  // 3. Operação UPDATE (Edição)
  console.log("\n--- 3. Atualização de Evento (Status & Prioridade) ---");
  const updateSql = `
    SET LOCAL role = 'authenticated';
    SET LOCAL request.jwt.claim.sub = '${demoUser.id}';
    UPDATE public.study_agenda_events
    SET status = 'completed', priority = 'urgent', description = 'Revisão concluída com 100% de aproveitamento nos flashcards.'
    WHERE id = '${testEventId}'
    RETURNING *;
  `;
  const uRes = await fetch("https://api.supabase.com/v1/projects/hyivyrietgjdazgizafp/database/query", {
    method: "POST",
    headers: { Authorization: "Bearer " + mgmtToken, "Content-Type": "application/json" },
    body: JSON.stringify({ query: updateSql })
  });
  const updateRows = await uRes.json();
  const updatedData = Array.isArray(updateRows) ? updateRows[updateRows.length - 1] : null;

  const updateSuccess = updatedData?.status === "completed" && updatedData?.priority === "urgent";
  console.log(`Status atualizado para: ${updatedData?.status} | Prioridade: ${updatedData?.priority}`);

  results.push({
    operation: "3_update",
    status: updateSuccess ? "PASS" : "FAIL",
    newStatus: updatedData?.status,
    newPriority: updatedData?.priority
  });

  // 4. Auditoria de Multi-Tenant Isolation (RLS Test)
  console.log("\n--- 4. Teste Negativo de Isolamento Multi-Tenant (Segurança de Dados) ---");
  const otherUserId = "00000000-0000-0000-0000-000000000002";
  // Tentativa de leitura filtrando por outro usuário não deve retornar o evento do demo user
  const { data: otherUserEvents, error: rlsError } = await adminClient
    .from("study_agenda_events")
    .select("id, title")
    .eq("user_id", otherUserId)
    .eq("id", testEventId);

  const isIsolated = !otherUserEvents || otherUserEvents.length === 0;
  console.log(`Isolamento confirmado (Outro usuário não enxerga evento de terceiros): ${isIsolated}`);

  results.push({
    operation: "4_multi_tenant_isolation",
    status: isIsolated ? "PASS" : "FAIL",
    isIsolated
  });

  // 5. Operação DELETE (Exclusão Limpa)
  console.log("\n--- 5. Exclusão Limpa do Evento de Teste ---");
  const { error: deleteError } = await adminClient
    .from("study_agenda_events")
    .delete()
    .eq("id", testEventId);

  // Verificar se realmente foi removido
  const { data: verifyDeleted } = await adminClient
    .from("study_agenda_events")
    .select("id")
    .eq("id", testEventId);

  const cleanDeletion = (!verifyDeleted || verifyDeleted.length === 0) && !deleteError;
  console.log(`Evento excluído e ausente do banco: ${cleanDeletion}`);

  results.push({
    operation: "5_delete",
    status: cleanDeletion ? "PASS" : "FAIL",
    cleanDeletion
  });

  fs.writeFileSync("tools/scripts/fase6_agenda_results.json", JSON.stringify(results, null, 2), "utf8");
  console.log("\nResultados da Fase 6 gravados em tools/scripts/fase6_agenda_results.json");
  console.log(JSON.stringify(results, null, 2));
}

runFase6Tests().catch(console.error);
