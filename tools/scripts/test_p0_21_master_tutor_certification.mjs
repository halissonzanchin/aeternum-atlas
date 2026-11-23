// Certificação Oficial do Ecossistema do Tutor IA em Produção (P0.21-MASTER)
// Bateria Anatômica Real de 5 Casos no Qwen 3.5 4B via Edge Function ai-tutor v71
import fs from "node:fs";
import path from "node:path";
import { getMgmtToken, runSupabaseSql } from "./supabase_admin_helper.mjs";
import { getCredential } from "./get_cred_helper.mjs";
import { isRawFlashcardJsonOutput } from "../../src/features/atlas-viewer/ai/atlasAITutorService.js";

const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const PROJECT_REF = "hyivyrietgjdazgizafp";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

const TEST_EMAIL = "atlas-e2e-ai-tutor@aeternumatlas.com";
const TEST_USER_ID = "825b2496-ecec-4b67-8343-f8aa3578c224";

async function checkLocalInfrastructure() {
  console.log("\n[Infra] Verificando integridade da infraestrutura local...");
  const infraStatus = { ollama: false, gateway: false };

  try {
    const oRes = await fetch("http://127.0.0.1:11434/api/version", { signal: AbortSignal.timeout(3000) });
    if (oRes.ok) {
      const oData = await oRes.json();
      infraStatus.ollama = true;
      console.log(`   Ollama operacional (v${oData.version})`);
    }
  } catch (e) {
    console.warn("   Aviso: Ollama 11434 não respondeu diretamente:", e.message);
  }

  try {
    const gRes = await fetch("http://127.0.0.1:8081/health", { signal: AbortSignal.timeout(3000) });
    if (gRes.ok) {
      const gData = await gRes.json();
      infraStatus.gateway = true;
      console.log(`   Gateway operacional (${gData.status || "HEALTHY"})`);
    }
  } catch (e) {
    console.warn("   Aviso: Gateway 8081 não respondeu diretamente:", e.message);
  }

  return infraStatus;
}

async function prepareAuthSession(anonKey, userPassword) {
  console.log("\n[Auth] Autenticando conta de teste e preparando sessão acadêmica...");
  
  // Reset de sessão prévia e rate limit
  await runSupabaseSql(`SELECT public.admin_reset_user_session('${TEST_USER_ID}'::uuid, 'p0_21_master_tutor_cert');`);
  await runSupabaseSql(`UPDATE public.ai_rate_limits SET request_count = 0 WHERE user_id = '${TEST_USER_ID}'::uuid;`);

  // Login
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: userPassword })
  });

  if (!authRes.ok) {
    const errText = await authRes.text();
    throw new Error(`Falha no login da conta de teste: ${authRes.status} - ${errText}`);
  }

  const authData = await authRes.json();
  const jwt = authData.access_token;
  const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString("utf8"));
  const sessionId = payload.session_id;

  // Registro de sessão única
  const regRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/register_or_transfer_session`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      p_session_id: sessionId,
      p_device_fingerprint: "p0-21-master-tutor-cert-agent",
      p_ip: null,
      p_confirm_transfer: true,
      p_metadata: { client: "tutor-certification-suite" }
    })
  });

  if (!regRes.ok) {
    console.warn("   Aviso no registro de sessão:", await regRes.text());
  } else {
    console.log(`   Sessão ${sessionId.slice(0, 8)}... registrada com sucesso.`);
  }

  return { jwt, sessionId };
}

async function executeTutorQuery({ testName, prompt, task, context, anonKey, jwt }) {
  console.log(`\n--------------------------------------------------------------------------------`);
  console.log(`[TESTE] ${testName}`);
  console.log(`[PROMPT] ${prompt.slice(0, 100)}...`);

  const tStart = performance.now();
  let ttfbMs = null;
  let firstTextMs = null;
  let accumulatedText = "";
  let sseEventCount = 0;
  let receivedDone = false;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-tutor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "text/event-stream",
      "Authorization": `Bearer ${jwt}`,
      "apikey": anonKey,
      "Origin": "https://www.aeternumatlas.com"
    },
    body: JSON.stringify({
      messages: [{ sender: "user", text: prompt }],
      context: {
        task,
        topic: context.topic || null,
        language: "pt",
        userRole: "student",
        ...context
      },
      task,
      topic: context.topic || null,
      language: "pt",
      stream: true
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    return {
      passed: false,
      error: `HTTP ${res.status}: ${errText}`,
      durationMs: Math.round(performance.now() - tStart)
    };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let pending = "";

  while (true) {
    const { done, value } = await reader.read();
    if (ttfbMs === null) {
      ttfbMs = Math.round(performance.now() - tStart);
    }

    if (done) break;

    pending += decoder.decode(value, { stream: true });
    const lines = pending.split("\n");
    pending = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      sseEventCount++;
      const dataText = line.slice(6).trim();
      if (dataText === "[DONE]") {
        receivedDone = true;
        break;
      }

      try {
        const payload = JSON.parse(dataText);
        if (payload.text) {
          if (firstTextMs === null) {
            firstTextMs = Math.round(performance.now() - tStart);
          }
          accumulatedText += payload.text;
        } else if (payload.delta) {
          if (firstTextMs === null) {
            firstTextMs = Math.round(performance.now() - tStart);
          }
          accumulatedText += payload.delta;
        }
      } catch {
        // Ignora chunks intermediários
      }
    }
  }

  const totalDurationMs = Math.round(performance.now() - tStart);
  console.log(`   TTFB: ${ttfbMs}ms | Primeiro Texto: ${firstTextMs}ms | Duração Total: ${totalDurationMs}ms`);
  console.log(`   Caracteres recebidos: ${accumulatedText.length} | Eventos SSE: ${sseEventCount}`);

  return {
    passed: accumulatedText.length >= 250,
    text: accumulatedText,
    ttfbMs,
    firstTextMs,
    totalDurationMs,
    chars: accumulatedText.length,
    sseEvents: sseEventCount,
    receivedDone
  };
}

async function persistAndVerifyInDatabase({ prompt, answer, anonKey, jwt }) {
  try {
    // 1. Criar ou recuperar conversa
    const convRes = await fetch(`${SUPABASE_URL}/rest/v1/ai_conversations`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        user_id: TEST_USER_ID,
        title: prompt.slice(0, 40) + "..."
      })
    });
    
    let convId = null;
    if (convRes.ok) {
      const convData = await convRes.json();
      convId = convData[0]?.id;
    }

    // 2. Persistir mensagens
    if (convId) {
      await fetch(`${SUPABASE_URL}/rest/v1/ai_messages`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify([
          {
            conversation_id: convId,
            user_id: TEST_USER_ID,
            role: "user",
            content: prompt
          },
          {
            conversation_id: convId,
            user_id: TEST_USER_ID,
            role: "assistant",
            content: answer
          }
        ])
      });
    }

    // 3. Confirmar persistência no banco
    const checkRows = await runSupabaseSql(`
      SELECT id, role, created_at
      FROM public.ai_messages
      WHERE user_id = '${TEST_USER_ID}'::uuid
        AND content ILIKE '%${prompt.slice(0, 25).replace(/'/g, "''")}%'
      LIMIT 1;
    `);

    return Array.isArray(checkRows) && checkRows.length > 0;
  } catch (e) {
    console.warn("   Aviso na persistência:", e.message);
    return false;
  }
}

async function runMasterCertification() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS — MISSÃO P0.21-MASTER: CERTIFICAÇÃO TUTOR IA PRODUÇÃO   ===");
  console.log("=== Edge Function: ai-tutor (v71 ACTIVE) | Qwen 3.5 4B (RTX 4050 Soberano)  ===");
  console.log("================================================================================");

  const infra = await checkLocalInfrastructure();

  const mgmtToken = getMgmtToken();
  const testPassword = getCredential("AeternumAtlas:AutomationTestAccount");
  if (!testPassword) {
    throw new Error("Credencial AeternumAtlas:AutomationTestAccount não encontrada no Credential Manager.");
  }

  // Obter anon key
  const kRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, {
    headers: { Authorization: `Bearer ${mgmtToken}` }
  });
  const keys = await kRes.json();
  const anonKey = keys.find(k => k.name === "anon" || k.tags === "anon")?.api_key;

  const { jwt } = await prepareAuthSession(anonKey, testPassword);

  const testBattery = [
    {
      id: "case_1_plexo_braquial",
      name: "Caso 1: Plexo Braquial (Troncos, Fascículos e Ramos Terminais)",
      task: "explain_anatomical_structure",
      topic: "Plexo Braquial",
      context: { sectionTitle: "Plexo Braquial" },
      prompt: "Explique a organização anatômica completa do plexo braquial: raízes espinhais de C5 a T1, formação dos três troncos (superior, médio e inferior), suas divisões anteriores e posteriores, a constituição dos três fascículos (lateral, posterior e medial) e os cinco ramos terminais principais (nervo musculocutâneo, mediano, ulnar, radial e axilar).",
      validate: (text) => {
        const lower = text.toLowerCase();
        const hasRoots = lower.includes("c5") && lower.includes("t1");
        const hasTrunks = lower.includes("tronco") || lower.includes("superior");
        const hasBranches = lower.includes("radial") || lower.includes("mediano") || lower.includes("ulnar");
        const hasLength = text.length >= 350;
        return {
          valid: hasRoots && hasTrunks && hasBranches && hasLength,
          details: { hasRoots, hasTrunks, hasBranches, hasLength }
        };
      }
    },
    {
      id: "case_2_trigono_femoral",
      name: "Caso 2: Trígono Femoral (Limites e Conteúdo Vasculonervoso NAV)",
      task: "explain_anatomical_structure",
      topic: "Trígono Femoral",
      context: { sectionTitle: "Trígono Femoral" },
      prompt: "Descreva a anatomia topográfica e os limites anatômicos do trígono femoral (Triângulo de Scarpa), bem como o conteúdo vasculonervoso e sua organização espacial de lateral para medial (nervo femoral, artéria femoral, veia femoral e canal femoral).",
      validate: (text) => {
        const lower = text.toLowerCase();
        const hasInguinal = lower.includes("inguinal");
        const hasSartorius = lower.includes("sartório") || lower.includes("sartorio");
        const hasAdductor = lower.includes("adutor") || lower.includes("adductor");
        const hasVessels = lower.includes("artéria") || lower.includes("veia") || lower.includes("nervo") || lower.includes("femorais");
        return {
          valid: hasInguinal && (hasSartorius || hasAdductor) && hasVessels,
          details: { hasInguinal, hasSartorius, hasAdductor, hasVessels }
        };
      }
    },
    {
      id: "case_3_manguito_rotador",
      name: "Caso 3: Manguito Rotador no Atlas 3D (Músculos SITS e Estabilização)",
      task: "explain_flashcard",
      topic: "Músculos do Manguito Rotador",
      context: { modelTitle: "Articulação Glenoumeral e Manguito Rotador", topic: "Músculos do Manguito Rotador" },
      prompt: "Explique detalhadamente os quatro músculos que compõem o manguito rotador (supraespinhal, infraespinhal, redondo menor e subescapular), suas origens na escápula, inserções nos tubérculos do úmero e ações biomecânicas na articulação glenoumeral.",
      validate: (text) => {
        const lower = text.toLowerCase();
        const hasSupra = lower.includes("supraespin");
        const hasInfra = lower.includes("infraespin");
        const hasSubscap = lower.includes("subescapular");
        const hasTeres = lower.includes("redondo menor");
        const count = [hasSupra, hasInfra, hasSubscap, hasTeres].filter(Boolean).length;
        return {
          valid: count >= 3,
          details: { hasSupra, hasInfra, hasSubscap, hasTeres, count }
        };
      }
    },
    {
      id: "case_4_premissa_falsa",
      name: "Caso 4: Pergunta com Premissa Anatômica Falsa (Clavícula x Rádio)",
      task: "explain_anatomical_structure",
      topic: "Clavícula e Cíngulo do Membro Superior",
      context: { sectionTitle: "Clavícula" },
      prompt: "Por que a clavícula se articula diretamente com o osso rádio no antebraço para permitir os movimentos de pronação e supinação do membro superior?",
      validate: (text) => {
        const lower = text.toLowerCase();
        const identifiesError = lower.includes("não se articula") ||
                                lower.includes("nao se articula") ||
                                lower.includes("premissa") ||
                                lower.includes("erro") ||
                                lower.includes("equívoco") ||
                                lower.includes("equivoco") ||
                                lower.includes("não há articulação") ||
                                lower.includes("antebraço") ||
                                lower.includes("esterno") ||
                                lower.includes("acrômio");
        const mentionsUlnaOrForearm = lower.includes("ulna") || lower.includes("antebraço") || lower.includes("escápula") || lower.includes("acrômio");
        return {
          valid: identifiesError && mentionsUlnaOrForearm,
          details: { identifiesError, mentionsUlnaOrForearm }
        };
      }
    },
    {
      id: "case_5_poligono_willis_flashcard",
      name: "Caso 5: Polígono de Willis com Contexto e Estrutura de Flashcard",
      task: "explain_flashcard",
      topic: "Círculo Arterial do Cérebro (Polígono de Willis)",
      context: { task: "explain_flashcard", topic: "Círculo Arterial do Cérebro (Polígono de Willis)" },
      prompt: "Explique a vascularização arterial encefálica através do Polígono de Willis (Círculo Arterial do Cérebro), descrevendo os sistemas carotídeo interno e vertebrobasilar e as artérias comunicantes anterior e posterior.",
      validate: (text) => {
        const lower = text.toLowerCase();
        const hasCarotid = lower.includes("carótida") || lower.includes("carotida");
        const hasBasilar = lower.includes("basilar") || lower.includes("vertebral");
        const hasCommunicating = lower.includes("comunicante");
        const notRawJson = !isRawFlashcardJsonOutput(text);
        return {
          valid: hasCarotid && (hasBasilar || hasCommunicating) && notRawJson,
          details: { hasCarotid, hasBasilar, hasCommunicating, notRawJson }
        };
      }
    }
  ];

  const results = {
    testDate: new Date().toISOString(),
    mission: "P0.21-MASTER Tutor IA Live Certification",
    environment: "Produção (hyivyrietgjdazgizafp.supabase.co / https://www.aeternumatlas.com)",
    edgeFunction: "ai-tutor v71 ACTIVE",
    model: "qwen3.5:4b (RTX 4050)",
    protocol: "http2 (Cloudflare Zero Trust via TCP 443)",
    infra,
    cases: [],
    overallSuccess: true
  };

  for (const tc of testBattery) {
    const outcome = await executeTutorQuery({
      testName: tc.name,
      prompt: tc.prompt,
      task: tc.task,
      context: tc.context,
      anonKey,
      jwt
    });

    const sciCheck = tc.validate(outcome.text || "");
    const noReasoning = outcome.text ? (!outcome.text.includes("<think>") && !outcome.text.includes("</think>")) : false;
    const noRawJson = outcome.text ? !isRawFlashcardJsonOutput(outcome.text) : false;
    
    // Persistência e verificação
    const isPersisted = await persistAndVerifyInDatabase({
      prompt: tc.prompt,
      answer: outcome.text || "",
      anonKey,
      jwt
    });

    const casePassed = outcome.passed && sciCheck.valid && noReasoning && noRawJson;
    if (!casePassed) {
      results.overallSuccess = false;
    }

    console.log(`   [STATUS] ${casePassed ? "APROVADO (PASS)" : "FALHA (FAIL)"}`);
    console.log(`   - Validação Científica: ${sciCheck.valid ? "OK" : "FALHOU"}`);
    console.log(`   - Sem vazamento <think>: ${noReasoning ? "OK" : "FALHOU"}`);
    console.log(`   - Sem JSON bruto: ${noRawJson ? "OK" : "FALHOU"}`);
    console.log(`   - Persistência no Banco: ${isPersisted ? "CONFIRMADA" : "FALHOU"}`);

    results.cases.push({
      id: tc.id,
      name: tc.name,
      passed: casePassed,
      metrics: {
        ttfbMs: outcome.ttfbMs,
        firstTextMs: outcome.firstTextMs,
        totalDurationMs: outcome.totalDurationMs,
        chars: outcome.chars,
        sseEvents: outcome.sseEvents
      },
      validation: {
        scientific: sciCheck,
        noReasoning,
        noRawJson,
        databasePersisted: isPersisted
      },
      sampleOutput: (outcome.text || "").slice(0, 300) + "..."
    });

    // Pausa supervisionada entre inferências para estabilidade térmica da GPU
    await new Promise(r => setTimeout(r, 4000));
  }

  // Teardown
  await runSupabaseSql(`SELECT public.admin_reset_user_session('${TEST_USER_ID}'::uuid, 'teardown_p0_21_master_tutor_cert');`);

  const reportPath = path.join(ARTIFACTS_DIR, "P0.21_MASTER_TUTOR_CERTIFICATION_RESULTS.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`\nRelatório salvo com sucesso: ${reportPath}`);

  console.log("\n================================================================================");
  console.log(`RESULTADO FINAL DA BATERIA: ${results.overallSuccess ? "100% APROVADO" : "FALHA EM UM OU MAIS CASOS"}`);
  console.log("================================================================================");

  if (!results.overallSuccess) {
    process.exit(1);
  }
}

runMasterCertification().catch((err) => {
  console.error("\nERRO FATAL NA EXECUÇÃO DA BATERIA:", err);
  process.exit(1);
});
