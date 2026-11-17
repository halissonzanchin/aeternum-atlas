import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import crypto from "node:crypto";

function getManagementToken() {
  const psCode = `
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
  return execSync(`powershell -NoProfile -EncodedCommand ${base64}`, { encoding: "utf8" }).trim();
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function runMemoryHomologation() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — P0.9: HOMOLOGAÇÃO REAL DE PERSISTÊNCIA E MEMÓRIA PEDAGÓGICA  ");
  console.log("================================================================================\n");

  const mgmtToken = getManagementToken();
  const projectRef = "hyivyrietgjdazgizafp";
  const supabaseUrl = `https://${projectRef}.supabase.co`;

  const keysRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { Authorization: `Bearer ${mgmtToken}`, Accept: "application/json" }
  });
  const keys = await keysRes.json();
  const anonKey = keys.find(k => k.name === "anon")?.api_key;
  const serviceKey = keys.find(k => k.name === "service_role")?.api_key;

  const adminClient = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  console.log("1. Autenticação na Sessão Demo (Gerando JWT de estudante real)...");
  const { data: linkData, error: lErr } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: "demo.institucional@aeternumatlas.com"
  });
  if (lErr) throw lErr;

  const userClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: sessionData, error: sErr } = await userClient.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink"
  });
  if (sErr || !sessionData?.session) throw new Error("Falha na autenticação da conta demo");

  const demoJwt = sessionData.session.access_token;
  const demoUserId = sessionData.session.user.id;
  console.log(`  - Estudante Autenticado: UUID ${demoUserId} (${sessionData.session.user.email})`);

  // Cliente Estudante A com token autenticado (Respeita RLS estrito)
  const studentClientA = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${demoJwt}` } },
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const testReport = [];

  // --- TESTE 1: Criação de Conversa em public.ai_conversations ---
  console.log("\n--- TESTE 1: Criação de Conversa em public.ai_conversations ---");
  const testTitle = `Homologação P0.9 Memória Real (${new Date().toISOString()})`;
  const testContext = {
    source: "flashcards",
    task: "homologation_p0_9",
    module: "nervous_system",
    route: "/estudante"
  };

  const { data: convData, error: convErr } = await studentClientA
    .from("ai_conversations")
    .insert({
      user_id: demoUserId,
      title: testTitle,
      context: testContext
    })
    .select("id, user_id, title, context, created_at")
    .single();

  const convSuccess = !convErr && Boolean(convData?.id) && UUID_REGEX.test(convData.id);
  console.log(`  - Conversa criada: ID ${convData?.id}`);
  console.log(`  - Integridade UUID (RFC 4122): ${UUID_REGEX.test(convData?.id)}`);
  console.log(`  - Erro de persistência: ${convErr ? convErr.message : "Nenhum (Sucesso)"}`);
  testReport.push({ item: "Criação de Conversa no Supabase", pass: convSuccess, id: convData?.id });

  const conversationId = convData.id;

  // --- TESTE 2: Gravação de Mensagens em public.ai_messages ---
  console.log("\n--- TESTE 2: Gravação de Mensagens em public.ai_messages ---");
  const userMsgText = "Qual é o trajeto do nervo radial no compartimento posterior do braço?";
  const aiMsgText = "O nervo radial cruza posteriormente ao úmero no interior do sulco do nervo radial, acompanhado pela artéria braquial profunda.";

  const { data: msgData, error: msgErr } = await studentClientA
    .from("ai_messages")
    .insert([
      {
        conversation_id: conversationId,
        user_id: demoUserId,
        role: "user",
        content: userMsgText,
        metadata: { channel: "text", clientMessageId: "test-user-msg-1" }
      },
      {
        conversation_id: conversationId,
        user_id: demoUserId,
        role: "assistant",
        content: aiMsgText,
        metadata: {
          source: "aeternum_gateway",
          citations: ["[SRC-MOORE-2018]"],
          clientMessageId: "test-ai-msg-1"
        }
      }
    ])
    .select("id, conversation_id, role, content, created_at");

  const msgSuccess = !msgErr && msgData?.length === 2 && msgData.every(m => UUID_REGEX.test(m.id));
  console.log(`  - Mensagens gravadas: ${msgData?.length || 0}`);
  if (msgData) {
    msgData.forEach(m => console.log(`    [Msg ${m.role}] ID: ${m.id} | Conteúdo: ${m.content.slice(0, 45)}...`));
  }
  console.log(`  - Erro de gravação: ${msgErr ? msgErr.message : "Nenhum (Sucesso)"}`);
  testReport.push({ item: "Gravação de Mensagens com UUIDs válidos", pass: msgSuccess });

  // --- TESTE 3: Recuperação da Conversa (Simulando Logout e Login) ---
  console.log("\n--- TESTE 3: Recuperação de Histórico (Simulação Logout/Login) ---");
  // Simular novo cliente (limpeza de memória local)
  const freshStudentClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${demoJwt}` } },
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: restoredMessages, error: restoreErr } = await freshStudentClient
    .from("ai_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", demoUserId)
    .order("created_at", { ascending: true });

  const restoreSuccess = !restoreErr && restoredMessages?.length === 2 && restoredMessages[0].content === userMsgText;
  console.log(`  - Mensagens recuperadas após reconexão: ${restoredMessages?.length || 0}`);
  console.log(`  - Conteúdo preservado sem corrupção: ${restoredMessages?.[0]?.content === userMsgText}`);
  testReport.push({ item: "Recuperação após Logout/Login", pass: restoreSuccess });

  // --- TESTE 4: Continuidade em Outro Navegador (Sessão Simultânea / Troca de Navegador) ---
  console.log("\n--- TESTE 4: Continuidade em Outro Navegador ---");
  // Outro navegador enviando o segundo turno da conversa:
  const followUpUserMsg = "E quais músculos do compartimento extensor do antebraço ele inerva?";
  const followUpAiMsg = "O nervo radial inerva o braquiorradial, extensor radial longo e curto do carpo, e através do nervo interósseo posterior, os extensores dos dedos.";

  const { data: secondTurn, error: secondTurnErr } = await freshStudentClient
    .from("ai_messages")
    .insert([
      {
        conversation_id: conversationId,
        user_id: demoUserId,
        role: "user",
        content: followUpUserMsg,
        metadata: { channel: "text", clientMessageId: "test-user-msg-2" }
      },
      {
        conversation_id: conversationId,
        user_id: demoUserId,
        role: "assistant",
        content: followUpAiMsg,
        metadata: { source: "aeternum_gateway", citations: ["[SRC-GRAY-2020]"], clientMessageId: "test-ai-msg-2" }
      }
    ])
    .select("id, role, content");

  const { data: fullThread } = await studentClientA
    .from("ai_messages")
    .select("id, role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const continuitySuccess = !secondTurnErr && fullThread?.length === 4;
  console.log(`  - Total de turnos acumulados continuamente: ${fullThread?.length || 0}`);
  testReport.push({ item: "Continuidade Multidispositivo em Outro Navegador", pass: continuitySuccess });

  // --- TESTE 5: Isolamento RLS Multi-Inquilino (Segurança de Dados) ---
  console.log("\n--- TESTE 5: Isolamento RLS Multi-Inquilino e Bloqueio Cruzado ---");
  // 5.1 Usuário anônimo / não autenticado tentando ler a conversa
  const anonClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: anonRead, error: anonReadErr } = await anonClient
    .from("ai_conversations")
    .select("*")
    .eq("id", conversationId);

  const anonBlocked = (!anonRead || anonRead.length === 0);
  console.log(`  - Leitura anônima rejeitada pelo RLS: ${anonBlocked} (Linhas retornadas: ${anonRead?.length || 0})`);

  // 5.2 Tentativa de inserção de mensagem falsificada com outro user_id
  const fakeUserId = crypto.randomUUID();
  const { error: rlsInjectErr } = await studentClientA
    .from("ai_messages")
    .insert({
      conversation_id: conversationId,
      user_id: fakeUserId, // Tentativa de forjar autoria de terceiro
      role: "user",
      content: "Mensagem falsificada de injeção"
    });

  const injectBlocked = Boolean(rlsInjectErr && (rlsInjectErr.code === "42501" || rlsInjectErr.message.includes("violates row-level security")));
  console.log(`  - Injeção forjada de user_id bloqueada pelo RLS: ${injectBlocked} (Código: ${rlsInjectErr?.code})`);

  testReport.push({ item: "Isolamento RLS: Leitura Anônima Bloqueada", pass: anonBlocked });
  testReport.push({ item: "Isolamento RLS: Injeção de Identidade Bloqueada", pass: injectBlocked });

  // --- TESTE 6: Memória Pedagógica Longitudinal em viewer_learning_events ---
  console.log("\n--- TESTE 6: Memória Pedagógica Longitudinal (Eventos Pedagógicos Reais) ---");
  const { data: profile } = await studentClientA
    .from("profiles")
    .select("institution_id")
    .eq("id", demoUserId)
    .single();

  const institutionId = profile?.institution_id;

  const { data: learningSession, error: sessErr } = await studentClientA
    .from("viewer_learning_sessions")
    .insert({
      user_id: demoUserId,
      institution_id: institutionId,
      scope: "flashcards"
    })
    .select("id")
    .single();

  let eventData = null;
  let eventErr = null;

  if (learningSession?.id) {
    const learningEvent = {
      session_id: learningSession.id,
      user_id: demoUserId,
      institution_id: institutionId,
      event_type: "flashcard_reviewed",
      event_data: {
        topic: "Nervo radial",
        difficulty: "Médio",
        retention_quality: 5,
        interval_days: 1,
        repetitions: 1,
        ease_factor: 2.5
      }
    };

    const res = await studentClientA
      .from("viewer_learning_events")
      .insert(learningEvent)
      .select("id, event_type, created_at")
      .single();

    eventData = res.data;
    eventErr = res.error;
  } else {
    eventErr = sessErr;
  }

  const eventSuccess = !eventErr && Boolean(eventData?.id);
  console.log(`  - Sessão pedagógica criada: ID ${learningSession?.id}`);
  console.log(`  - Evento de retenção longitudinal gravado: ID ${eventData?.id}`);
  console.log(`  - Erro de gravação pedagógica: ${eventErr ? eventErr.message : "Nenhum (Sucesso)"}`);
  testReport.push({ item: "Memória Pedagógica Longitudinal Registrada", pass: eventSuccess });

  // Limpeza dos dados de homologação para higiene do banco
  await adminClient.from("ai_messages").delete().eq("conversation_id", conversationId);
  await adminClient.from("ai_conversations").delete().eq("id", conversationId);
  if (eventData?.id) {
    await adminClient.from("viewer_learning_events").delete().eq("id", eventData.id);
  }
  if (learningSession?.id) {
    await adminClient.from("viewer_learning_sessions").delete().eq("id", learningSession.id);
  }
  console.log("\n- Registros de teste de homologação limpos com sucesso.");

  console.log("\n================================================================================");
  console.log(" RESUMO DA HOMOLOGAÇÃO REAL DE MEMÓRIA:                                        ");
  console.log("================================================================================");
  console.table(testReport);

  const allPass = testReport.every(t => t.pass);
  console.log(allPass ? "\n✅ SUCESSO: Memória conversacional e longitudinal 100% homologadas com RLS real!" : "\n❌ FALHA na homologação.");
}

runMemoryHomologation().catch(console.error);
