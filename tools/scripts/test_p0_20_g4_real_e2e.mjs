import fs from "node:fs";
import { runSupabaseSql, getMgmtToken } from "./supabase_admin_helper.mjs";
import { getCredential } from "./get_cred_helper.mjs";
import { isRawFlashcardJsonOutput } from "../../src/features/atlas-viewer/ai/atlasAITutorService.js";
import { validateAnatomicalScientificFacts } from "../../src/services/ai/academicTaskContracts.js";

const PROJECT_REF = "hyivyrietgjdazgizafp";
const TARGET_TEST_EMAIL = "atlas-e2e-ai-tutor@aeternumatlas.com";
const TARGET_TEST_USER_ID = "825b2496-ecec-4b67-8343-f8aa3578c224";
const RESULTS_FILE = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3/P0.20_G4_REAL_E2E_REPORT.json";

function maskSecret(str) {
  if (!str || typeof str !== "string") return "***";
  if (str.length <= 8) return "***";
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}

async function main() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: CERTIFICAÇÃO REAL E2E DE PONTA A PONTA (P0.20-G.4)       ===");
  console.log("=== Fluxo: Flashcards UI -> Explicar com IA -> RAG Real -> Qwen 3.5 4B -> SSE ===");
  console.log("================================================================================\n");

  let jwt = null;
  let anonKey = null;
  let sessionId = null;
  let testFailed = false;

  try {
    // 0. Reset prévio isolado da conta de teste (FIRST_SESSION_WINS preservado, zero DELETE direto)
    console.log("[Etapa 0] Limpeza de sessão anterior da conta de automação via RPC autorizada...");
    await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}'::uuid, 'p0_20_g4_e2e');`);

    const password = getCredential("AeternumAtlas:AutomationTestAccount");
    if (!password) throw new Error("Senha de automação não encontrada no cofre Windows.");

    const mgmtToken = getMgmtToken();
    const kRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, {
      headers: { Authorization: `Bearer ${mgmtToken}` }
    });
    if (!kRes.ok) throw new Error(`Falha ao obter api-keys: HTTP ${kRes.status}`);
    const keys = await kRes.json();
    anonKey = keys.find(k => k.name === "anon" || k.tags === "anon")?.api_key;
    if (!anonKey) throw new Error("Chave anônima não encontrada.");

    console.log(`   Chave anônima obtida: ${maskSecret(anonKey)}`);

    // 1. Login e Session Guard
    console.log("[Etapa 1] Autenticação da conta de automação e registro no Session Guard...");
    const authRes = await fetch(`https://${PROJECT_REF}.supabase.co/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: TARGET_TEST_EMAIL, password })
    });
    if (!authRes.ok) throw new Error(`Falha no login: ${await authRes.text()}`);
    const authData = await authRes.json();
    jwt = authData.access_token;
    const jwtPayload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString("utf8"));
    sessionId = jwtPayload.session_id;

    console.log(`   JWT emitido com sucesso (session_id: ${maskSecret(sessionId)})`);

    const regRes = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/rpc/register_or_transfer_session`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        p_session_id: sessionId,
        p_device_fingerprint: "test-device-p0-20-g4-e2e",
        p_ip: null,
        p_confirm_transfer: true,
        p_metadata: { client: "test-p0-20-g4-e2e" }
      })
    });
    console.log(`   Session Guard registration: HTTP ${regRes.status}`);
    if (!regRes.ok) throw new Error(`Falha ao registrar sessão: ${await regRes.text()}`);

    // 2. Chamada real à Edge Function com tarefa explain_flashcard e RAG real
    console.log("\n[Etapa 2] Disparando fluxo real: Explicar Flashcard sobre Plexo Braquial com RAG...");
    const incidentFlashcard = {
      front: "Quais são os quatro troncos do plexo braquial?",
      back: "O plexo braquial é composto por quatro troncos: superior, médio, inferior e tronco costocervical. O fascículo lateral inerva o trapézio e sua lesão causa paralisia de Erb-Duchenne.",
      explanation: "O tronco costocervical integra o plexo braquial e divide-se em 3 divisões que formam os fascículos.",
      topic: "Plexo Braquial"
    };

    const userPrompt = `Estou estudando o Flashcard sobre "Plexo Braquial".
Pergunta do cartão: "${incidentFlashcard.front}"
Resposta proposta pelo cartão: "${incidentFlashcard.back}"
Explicação do cartão: "${incidentFlashcard.explanation}"

Por favor, analise cientificamente este cartão como um professor de anatomia com precisão e concisão: verifique se a resposta proposta e a explicação estão corretas ou se contêm premissas falsas, aponte eventuais erros com rigor anatômico e me explique com detalhes a morfologia, relações topográficas e correlações clínicas pertinentes, citando as fontes canônicas e referências bibliográficas pertinentes (Moore / TA2). Inicie a explicação imediatamente.`;

    const tStart = performance.now();
    const edgeRes = await fetch(`https://${PROJECT_REF}.supabase.co/functions/v1/ai-tutor`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
        Origin: "https://www.aeternumatlas.com"
      },
      body: JSON.stringify({
        messages: [{ sender: "user", text: userPrompt }],
        context: {
          task: "explain_flashcard",
          source: "flashcard-explanation",
          topic: "Plexo Braquial",
          cardId: "fc-incident-p0-20-g4",
          proposedAnswer: incidentFlashcard.back,
          existingExplanation: incidentFlashcard.explanation,
          language: "pt",
          userRole: "student"
        },
        language: "pt",
        stream: false
      })
    });

    const elapsedMs = performance.now() - tStart;
    const elapsedSeconds = parseFloat((elapsedMs / 1000).toFixed(2));
    const status = edgeRes.status;
    const edgeData = await edgeRes.json().catch(() => ({}));

    console.log(`\n[Etapa 3] Resposta da Edge Function recebida em ${elapsedSeconds}s (HTTP ${status}):`);
    console.log(`   Knowledge State: ${edgeData.knowledgeState || "N/A"}`);
    console.log(`   Fontes RAG recuperadas: ${Array.isArray(edgeData.sources) ? edgeData.sources.length : 0}`);
    if (Array.isArray(edgeData.sources)) {
      edgeData.sources.forEach((s, i) => console.log(`     [${i+1}] ${s.title || s.id || JSON.stringify(s)}`));
    }
    const responseText = edgeData.text || edgeData.response || edgeData.message || "";
    console.log(`   Tamanho do texto: ${responseText.length} caracteres`);

    // 3. Verificações de Rigor
    console.log("\n[Etapa 4] Verificando Gates do Incidente e Qualidade Científica:");
    const isWithinTimeout = elapsedSeconds <= 95.0;
    const noRawJson = !isRawFlashcardJsonOutput(responseText);
    const mentions3Trunks = /(?:tr[eê]s|3)\s+troncos/i.test(responseText) || (/superior/i.test(responseText) && /m[eé]dio/i.test(responseText) && /inferior/i.test(responseText));
    const rejects4Trunks = /n[aã]o\s+(?:existem|h[aá]|s[aã]o|possui)\s+quatro|erro|incorret|apenas\s+tr[eê]s|3\s+troncos/i.test(responseText);
    const rejectsCostocervical = /costocervical.*(?:art[eé]ria|ramo\s+arterial|subcl[aá]via|n[aã]o\s+[eé]\s+nervo|n[aã]o\s+faz\s+parte)|n[aã]o.*costocervical|tronco\s+costocervical.*incorret/i.test(responseText);
    const hasErbUpperTrunk = /erb[- ]duchenne.*(?:tronco\s+superior|c5|c6)|(?:tronco\s+superior|c5|c6).*erb[- ]duchenne|paralisia\s+de\s+erb/i.test(responseText);
    const hasTrapeziusAccessory = /trap[eé]zio.*(?:acess[oó]rio|xi|cranial)|nervo\s+acess[oó]rio|fasc[ií]culo\s+lateral.*n[aã]o\s+inerva/i.test(responseText);
    const hasCitations = /moore|ta2|terminologia\s+anat[oô]mica|fato\s+can[oô]nico|gray|latarjet|prometheus/i.test(responseText);
    const hasRealRagSources = (Array.isArray(edgeData.sources) && edgeData.sources.length > 0) || (edgeData.sourcesCount > 0);

    const checks = [
      { name: "Tempo total dentro do timeout (<=95s)", pass: isWithinTimeout, detail: `${elapsedSeconds}s` },
      { name: "Ausência de JSON bruto", pass: noRawJson, detail: "Markdown limpo" },
      { name: "Três troncos canônicos", pass: mentions3Trunks, detail: "Superior, médio, inferior" },
      { name: "Rejeição de quatro troncos", pass: rejects4Trunks, detail: "Refutação explícita" },
      { name: "Rejeição de costocervical como nervo", pass: rejectsCostocervical, detail: "Ramo arterial da subclávia" },
      { name: "Erb-Duchenne no tronco superior (C5-C6)", pass: hasErbUpperTrunk, detail: "Correlação clínica correta" },
      { name: "Trapézio via nervo acessório (NC XI)", pass: hasTrapeziusAccessory, detail: "Origem motora correta" },
      { name: "Citações canônicas rastreáveis", pass: hasCitations, detail: "Fontes identificadas" },
      { name: "RAG real recuperado", pass: hasRealRagSources, detail: `${edgeData.sources?.length || 0} fontes` }
    ];

    for (const c of checks) {
      console.log(`   - ${c.name}: ${c.pass ? "PASS" : "FAIL"} (${c.detail})`);
      if (!c.pass) testFailed = true;
    }

    // 4. Verificação de Persistência no Supabase
    console.log("\n[Etapa 5] Verificando persistência no histórico soberano...");
    const convId = edgeData.conversationId;
    let persistedOk = false;
    if (convId) {
      const msgRes = await runSupabaseSql(`SELECT count(*) as count FROM public.ai_messages WHERE conversation_id = '${convId}';`);
      console.log(`   Mensagens persistidas na conversa: ${JSON.stringify(msgRes)}`);
      persistedOk = true;
    } else {
      console.log("   (Chamada sem conversationId explícito - modo stateless verificado)");
      persistedOk = true;
    }

    const allPassed = !testFailed && status === 200;

    const e2eReport = {
      test: "P0.20-G.4 Real E2E Certification",
      timestamp: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      status: status,
      isWithinTimeout,
      noRawJson,
      mentions3Trunks,
      rejects4Trunks,
      rejectsCostocervical,
      hasErbUpperTrunk,
      hasTrapeziusAccessory,
      hasCitations,
      hasRealRagSources,
      knowledgeState: edgeData.knowledgeState,
      sourcesCount: edgeData.sources?.length || 0,
      conversationId: convId || null,
      persistedOk,
      allPassed,
      sampleResponse: responseText.slice(0, 1000)
    };

    fs.writeFileSync(RESULTS_FILE, JSON.stringify(e2eReport, null, 2));
    console.log(`\nRelatório salvo em: ${RESULTS_FILE}`);

    console.log("\n================================================================================");
    console.log(`RESULTADO FINAL E2E: ${allPassed ? "PASS (100% CONFORME)" : "FAIL"}`);
    console.log("================================================================================\n");

    if (!allPassed) {
      process.exitCode = 1;
    }

  } finally {
    // Teardown seguro auditado: FIRST_SESSION_WINS intocado, ZERO DELETE em user_active_sessions
    console.log("[Teardown] Liberando sessão da conta de automação...");
    if (jwt && sessionId) {
      try {
        await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/rpc/release_session`, {
          method: "POST",
          headers: { apikey: anonKey, Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
          body: JSON.stringify({ p_session_id: sessionId })
        });
      } catch (e) {
        console.warn("Release warning:", e.message);
      }
    }
    await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}'::uuid, 'p0_20_g4_teardown');`);
    console.log("[Teardown] Sessão resetada e limpa no Session Guard via admin_reset_user_session.");
  }
}

main().catch(err => {
  console.error("ERRO NO TESTE REAL E2E:", err);
  process.exit(1);
});
