// Teste de Isolamento RLS e Proteção Cross-Tenant para as Contas Estudantis (P0.20-S.1)
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é expressamente proibido no Aeternum Atlas.");
}

import { createClient } from "@supabase/supabase-js";
import { getAnonKey, runSupabaseSql } from "./supabase_admin_helper.mjs";
import { getCredential } from "./get_cred_helper.mjs";

const SUPABASE_URL = "https://hyivyrietgjdazgizafp.supabase.co";

async function main() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: TESTE DE ISOLAMENTO RLS E CROSS-USER (P0.20-S.1)          ===");
  console.log("================================================================================\n");

  const anonKey = await getAnonKey();
  const demoEmail = "demo.institucional@aeternumatlas.com";
  const demoPassword = getCredential("AeternumAtlas:DemoAccount");

  const qaEmail = "atlas-e2e-ai-tutor@aeternumatlas.com";
  const qaPassword = getCredential("AeternumAtlas:AutomationTestAccount");

  console.log("[Etapa 1] Autenticando com Conta de Demonstração e Conta QA para Teste de RLS...");
  const clientDemo = createClient(SUPABASE_URL, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const clientQA = createClient(SUPABASE_URL, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: authDemo, error: demoErr } = await clientDemo.auth.signInWithPassword({
    email: demoEmail,
    password: demoPassword
  });
  if (demoErr) throw new Error(`Falha login demo: ${demoErr.message}`);

  const { data: authQA, error: qaErr } = await clientQA.auth.signInWithPassword({
    email: qaEmail,
    password: qaPassword
  });
  if (qaErr) throw new Error(`Falha login QA: ${qaErr.message}`);

  console.log(` - Demo autenticado: ID=${authDemo.user.id}`);
  console.log(` - QA autenticado: ID=${authQA.user.id}`);

  let allPassed = true;

  // 1. Verificar isolamento em ai_conversations
  console.log("\n[Etapa 2] Testando RLS em public.ai_conversations (Prevenção de Leitura Cruzada)...");
  const { data: demoConvs, error: convErr } = await clientDemo.from("ai_conversations").select("id, user_id, title");
  if (convErr) throw convErr;

  const hasForeignConvs = demoConvs.some(c => c.user_id !== authDemo.user.id);
  console.log(` - Conversas retornadas para Demo: ${demoConvs.length}`);
  console.log(` - Alguma conversa de outro estudante vazada? ${hasForeignConvs ? "SIM (VIOLAÇÃO)" : "NÃO (PASS)"}`);
  if (hasForeignConvs) allPassed = false;

  // 2. Tentar acessar mensagens de QA com o client de Demo
  console.log("\n[Etapa 3] Tentativa deliberada de consulta cruzada de mensagens por UUID alheio...");
  const { data: foreignMessages, error: msgErr } = await clientDemo
    .from("ai_messages")
    .select("id, content, user_id")
    .eq("user_id", authQA.user.id);

  console.log(` - Mensagens de QA visíveis para Demo: ${foreignMessages?.length || 0}`);
  const msgIsolationPassed = !foreignMessages || foreignMessages.length === 0;
  console.log(` - Isolamento de Mensagens: ${msgIsolationPassed ? "PASS (BLOQUEADO PELO RLS)" : "FALHA"}`);
  if (!msgIsolationPassed) allPassed = false;

  // 3. Tentar acessar revisões de flashcards alheios
  console.log("\n[Etapa 4] Testando isolamento em public.user_flashcard_reviews...");
  const { data: foreignReviews, error: revErr } = await clientDemo
    .from("user_flashcard_reviews")
    .select("id, user_id")
    .eq("user_id", authQA.user.id);

  console.log(` - Reviews de flashcards alheios visíveis: ${foreignReviews?.length || 0}`);
  const revIsolationPassed = !foreignReviews || foreignReviews.length === 0;
  console.log(` - Isolamento de Flashcards: ${revIsolationPassed ? "PASS (BLOQUEADO PELO RLS)" : "FALHA"}`);
  if (!revIsolationPassed) allPassed = false;

  // 4. Tentar acessar agenda de estudos alheia
  console.log("\n[Etapa 5] Testando isolamento em public.study_agenda...");
  const { data: foreignAgenda, error: agendaErr } = await clientDemo
    .from("study_agenda")
    .select("id, user_id")
    .eq("user_id", authQA.user.id);

  console.log(` - Itens de agenda de estudos alheios visíveis: ${foreignAgenda?.length || 0}`);
  const agendaIsolationPassed = !foreignAgenda || foreignAgenda.length === 0;
  console.log(` - Isolamento de Agenda de Estudos: ${agendaIsolationPassed ? "PASS (BLOQUEADO PELO RLS)" : "FALHA"}`);
  if (!agendaIsolationPassed) allPassed = false;

  console.log("\n================================================================================");
  console.log(`=== RESULTADO GERAL DE ISOLAMENTO RLS: ${allPassed ? "APROVADO (100% PROTEGIDO)" : "REPROVADO"} ===`);
  console.log("================================================================================\n");

  if (!allPassed) process.exit(1);
}

main().catch(err => {
  console.error("ERRO NO TESTE DE RLS:", err);
  process.exit(1);
});
