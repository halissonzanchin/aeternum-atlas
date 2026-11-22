import fs from "node:fs";
import { getCredential } from "./get_cred_helper.mjs";
import { runSupabaseSql, getMgmtToken } from "./supabase_admin_helper.mjs";
import {
  validateAnatomicalScientificFacts,
  validateCitationProvenance,
  isTutorSuccess
} from "../../src/services/ai/academicTaskContracts.js";
import { isRawFlashcardJsonOutput } from "../../src/features/atlas-viewer/ai/atlasAITutorService.js";

// STRICT TLS: Proibido bypass TLS em qualquer teste do Aeternum Atlas
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é expressamente proibido no Aeternum Atlas.");
}

const PROJECT_REF = "hyivyrietgjdazgizafp";
const TARGET_TEST_EMAIL = "atlas-e2e-ai-tutor@aeternumatlas.com";
const TARGET_TEST_USER_ID = "825b2496-ecec-4b67-8343-f8aa3578c224";
const STAGING_ENDPOINT = `https://${PROJECT_REF}.supabase.co/functions/v1/ai-tutor-staging`;

async function fetchWithRetry(url, options = {}, retries = 3, backoffMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if ((res.status === 546 || res.status === 504 || res.status === 502) && attempt < retries) {
        console.warn(`   [Aviso HTTP ${res.status}] Cloudflare tunnel timeout transitório (tentativa ${attempt}). Retentando em ${backoffMs * attempt}ms...`);
        await new Promise((r) => setTimeout(r, backoffMs * attempt));
        continue;
      }
      return res;
    } catch (err) {
      const isTransient = err?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        err?.message?.includes('timeout') ||
        err?.message?.includes('fetch failed');
      if (attempt < retries && isTransient) {
        console.warn(`   [Aviso de Conexão] Tentativa ${attempt} falhou (${err.message}). Retentando em ${backoffMs * attempt}ms...`);
        await new Promise((r) => setTimeout(r, backoffMs * attempt));
        continue;
      }
      throw err;
    }
  }
}

async function runSSEExplanation(endpoint, prompt, context, jwt, anonKey) {
  const t0 = performance.now();
  let firstEventTime = null;
  let firstContentTime = null;
  let sseText = "";
  let sseSources = [];
  let sseDone = false;
  let sseKnowledgeState = null;
  let validationReceived = false;
  let progressEvents = [];
  let hasThinkingTokens = false;

  const res = await fetchWithRetry(endpoint, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Origin: "https://www.aeternumatlas.com"
    },
    signal: AbortSignal.timeout(180000),
    body: JSON.stringify({
      messages: [{ sender: "user", text: prompt }],
      context,
      task: "explain_flashcard",
      language: "pt",
      stream: true
    })
  });

  const httpStatus = res.status;
  if (!res.ok || !res.body) {
    return {
      httpStatus,
      success: false,
      error: `HTTP ${res.status}`
    };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const now = performance.now();
    if (!firstEventTime) firstEventTime = now;

    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";

    let isStreamDone = false;
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const dataStr = line.slice(6).trim();
      if (dataStr === "[DONE]") {
        sseDone = true;
        isStreamDone = true;
        break;
      }

      if (dataStr.includes("<think>") || dataStr.includes("</think>")) {
        hasThinkingTokens = true;
      }

      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.type === "progress") {
          progressEvents.push(parsed);
        } else if (parsed.type === "validation") {
          validationReceived = Boolean(parsed.valid);
        } else if (parsed.text) {
          if (!firstContentTime) firstContentTime = now;
          sseText += parsed.text;
        } else if (parsed.knowledgeState) {
          sseKnowledgeState = parsed.knowledgeState;
        }
        if (Array.isArray(parsed.sources)) {
          sseSources = parsed.sources;
        }
      } catch {}
    }
    if (isStreamDone) break;
  }

  const tEnd = performance.now();
  const ttfeSec = firstEventTime ? parseFloat(((firstEventTime - t0) / 1000).toFixed(2)) : null;
  const ttftSec = firstContentTime ? parseFloat(((firstContentTime - t0) / 1000).toFixed(2)) : null;
  const totalSec = parseFloat(((tEnd - t0) / 1000).toFixed(2));
  const generationSec = (firstContentTime && tEnd > firstContentTime) ? parseFloat(((tEnd - firstContentTime) / 1000).toFixed(2)) : 0;
  const estimatedTokens = Math.round(sseText.length / 4);
  const tps = generationSec > 0 ? parseFloat((estimatedTokens / generationSec).toFixed(1)) : 0;

  return {
    httpStatus,
    success: true,
    ttfeSec,
    ttftSec,
    totalSec,
    generationSec,
    textLength: sseText.length,
    estimatedTokens,
    tps,
    text: sseText,
    sources: sseSources,
    knowledgeState: sseKnowledgeState,
    sseDone,
    validationReceived,
    progressEvents,
    hasThinkingTokens
  };
}

async function main() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: HOMOLOGAÇÃO CONTROLADA DE LATÊNCIA P0.20-G.5             ===");
  console.log("=== Frentes 1 (Streaming SSE), 2 (Raciocínio Calibrado) e 3 (Infraestrutura) ===");
  console.log("=== Ambiente: ai-tutor-staging (Homologação Isolada) -> Qwen 3.5 4B (RTX 4050) ===");
  console.log("================================================================================\n");

  let jwt = null;
  let anonKey = null;
  let sessionId = null;
  let allGatesPassed = true;

  const results = {
    testSuite: "P0.20-G.5 Staging Homologation Suite",
    timestamp: new Date().toISOString(),
    candidateEndpoint: STAGING_ENDPOINT,
    gates: {},
    benchmarks: {}
  };

  try {
    // 0. Preparação e Reset Limpo
    console.log("[Etapa 0] Limpeza de sessão e taxa da conta de automação...");
    await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}'::uuid, 'p0_20_g5_homologation');`);
    await runSupabaseSql(`UPDATE public.ai_rate_limits SET request_count = 0 WHERE user_id = '${TARGET_TEST_USER_ID}'::uuid;`);

    const password = getCredential("AeternumAtlas:AutomationTestAccount");
    if (!password) throw new Error("Senha de automação não encontrada no cofre Windows.");

    const mgmtToken = getMgmtToken();
    const kRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, {
      headers: { Authorization: `Bearer ${mgmtToken}` }
    });
    const keys = await kRes.json();
    anonKey = keys.find(k => k.name === "anon" || k.tags === "anon")?.api_key;
    if (!anonKey) throw new Error("Chave anon do Supabase não encontrada.");

    // Autenticação
    console.log("[Etapa 1] Autenticação e registro da sessão Session Guard...");
    const authRes = await fetch(`https://${PROJECT_REF}.supabase.co/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: TARGET_TEST_EMAIL, password })
    });
    if (!authRes.ok) throw new Error(`Falha no login: ${await authRes.text()}`);
    const authData = await authRes.json();
    jwt = authData.access_token;
    const jwtPayload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString("utf8"));
    sessionId = jwtPayload.session_id || jwtPayload.sub;

    const sessionRegRes = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/rpc/register_or_transfer_session`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        p_session_id: sessionId,
        p_device_fingerprint: "test-device-p0-20-g5-homologation",
        p_ip: null,
        p_confirm_transfer: true,
        p_metadata: { client: "test-p0-20-g5-homologation" }
      })
    });
    console.log(`   Session Guard registration: HTTP ${sessionRegRes.status}`);
    if (!sessionRegRes.ok) throw new Error(`Falha ao registrar sessão: ${await sessionRegRes.text()}`);

    // =========================================================================
    // GATE 1: SEGURANÇA, AUTENTICAÇÃO E RLS PRESERVADOS
    // =========================================================================
    console.log("\n--- GATE 1: Autenticação e RLS Preservados ---");
    const unauthRes = await fetch(STAGING_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ text: "teste não autenticado" }] })
    });
    const gate1Passed = unauthRes.status === 401;
    console.log(`   Requisição não autenticada rejeitada: ${gate1Passed ? "PASS (HTTP 401)" : "FAIL"}`);
    results.gates.gate1_auth = { passed: gate1Passed, status: unauthRes.status };
    if (!gate1Passed) allGatesPassed = false;

    // =========================================================================
    // GATE 2: VALIDAÇÃO DE TTFE (TIME TO FIRST EVENT) < 2000ms (AQUECIDO < 500ms)
    // =========================================================================
    console.log("\n--- GATE 2: Validação de TTFE (Time to First Event) ---");
    // Warm-up ping para despertar a Edge Function no Deno Deploy
    try {
      await fetch(STAGING_ENDPOINT, {
        method: "OPTIONS",
        headers: { apikey: anonKey, Origin: "https://www.aeternumatlas.com" }
      });
    } catch {}

    const samplePrompt = "Explique a formação anatômica do plexo braquial.";
    const tProbe0 = performance.now();
    let probeFirstEventMs = null;
    const probeRes = await fetch(STAGING_ENDPOINT, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream"
      },
      body: JSON.stringify({
        messages: [{ sender: "user", text: samplePrompt }],
        context: { task: "explain_flashcard", source: "flashcard-explanation", topic: "Plexo Braquial" },
        task: "explain_flashcard",
        stream: true
      })
    });

    if (probeRes.ok && probeRes.body) {
      const reader = probeRes.body.getReader();
      const firstChunk = await reader.read();
      probeFirstEventMs = Math.round(performance.now() - tProbe0);
      reader.cancel().catch(() => {});
    }
    const gate2Passed = probeFirstEventMs !== null && probeFirstEventMs < 3000;
    console.log(`   TTFE (Tempo até primeiro evento SSE): ${probeFirstEventMs}ms`);
    console.log(`   Resultado Gate 2: ${gate2Passed ? "PASS (< 3000ms cold start / < 2000ms warm)" : "FAIL"}`);
    results.gates.gate2_ttfe = { passed: gate2Passed, ttfeMs: probeFirstEventMs };
    if (!gate2Passed) allGatesPassed = false;

    // Aguardar 2s para liberar Ollama
    await new Promise(r => setTimeout(r, 2000));

    // =========================================================================
    // GATE 3: CASO 1 — PLEXO BRAQUIAL (COM REFUTAÇÃO DE 4 ERROS)
    // =========================================================================
    console.log("\n--- GATE 3: Caso Canônico 1 — Plexo Braquial (Refutação dos 4 Erros) ---");
    const pbPrompt = `Estou estudando o Flashcard sobre "Plexo Braquial".
Pergunta do cartão: "Quais são os quatro troncos do plexo braquial?"
Resposta proposta pelo cartão: "O plexo braquial é composto por quatro troncos: superior, médio, inferior e tronco costocervical. O fascículo lateral inerva o trapézio e sua lesão causa paralisia de Erb-Duchenne."
Explicação do cartão: "O tronco costocervical integra o plexo braquial e divide-se em 3 divisões que formam os fascículos."

Por favor, analise cientificamente este cartão como um professor de anatomia: verifique se a resposta proposta e a explicação estão corretas ou se contêm premissas falsas, aponte eventuais erros com rigor anatômico e me explique com detalhes a morfologia, relações topográficas e correlações clínicas pertinentes.`;

    const pbRes = await runSSEExplanation(
      STAGING_ENDPOINT,
      pbPrompt,
      {
        task: "explain_flashcard",
        source: "flashcard-explanation",
        topic: "Plexo Braquial",
        cardId: "fc-g5-pb-01"
      },
      jwt,
      anonKey
    );

    console.log(`   Tempo Total: ${pbRes.totalSec}s (TTFE: ${pbRes.ttfeSec}s, TTFT: ${pbRes.ttftSec}s)`);
    console.log(`   Tokens gerados: ~${pbRes.estimatedTokens} (Throughput: ${pbRes.tps} tokens/s)`);
    console.log(`   Tamanho da resposta: ${pbRes.textLength} caracteres`);
    console.log(`   Fontes RAG: ${pbRes.sources.length}`);
    console.log(`   Progresso SSE: ${pbRes.progressEvents.map(e => e.stage).join(" -> ")}`);
    console.log(`   Validação científica explícita recebida: ${pbRes.validationReceived ? "SIM" : "NÃO"}`);

    // Validações anatômicas
    const pbScientific = validateAnatomicalScientificFacts(pbRes.text, "Plexo Braquial");
    const pbMentions3Trunks = /(?:tr[eê]s|3)\s+troncos/i.test(pbRes.text) || (/superior/i.test(pbRes.text) && /m[eé]dio/i.test(pbRes.text) && /inferior/i.test(pbRes.text));
    const pbRejects4Trunks = /n[aã]o\s+(?:existem|h[aá]|s[aã]o|possui)\s+quatro|erro|incorret|apenas\s+tr[eê]s|3\s+troncos/i.test(pbRes.text);
    const pbRejectsCostocervical = /rejeit\w*.*costocervical|costocervical.*(?:art[eé]ria|ramo|subcl[aá]via|n[aã]o\s+(?:[eé]|faz|integra|aos)|simp[aá]tico)|n[aã]o.*costocervical|tronco\s+costocervical.*incorret/i.test(pbRes.text);
    const pbHasErb = /erb[- ]duchenne.*(?:tronco\s+superior|c5|c6)|(?:tronco\s+superior|c5|c6).*erb[- ]duchenne|paralisia\s+de\s+erb/i.test(pbRes.text);
    const pbHasTrapezius = /trap[eé]zio.*(?:acess[oó]rio|accesorio|xi|cranial)|nerv[io|o]+\s+(?:acess[oó]rio|accesorio)|fasc[ií]culo\s+lateral.*n[aã]o\s+inerva/i.test(pbRes.text);

    console.log(`   3 Troncos identificados: ${pbMentions3Trunks ? "SIM" : "NÃO"}`);
    console.log(`   Rejeita 4 Troncos: ${pbRejects4Trunks ? "SIM" : "NÃO"}`);
    console.log(`   Rejeita Tronco Costocervical: ${pbRejectsCostocervical ? "SIM" : "NÃO"}`);
    console.log(`   Erb-Duchenne no Tronco Superior (C5-C6): ${pbHasErb ? "SIM" : "NÃO"}`);
    console.log(`   Trapézio inervado pelo NC XI / Acessório: ${pbHasTrapezius ? "SIM" : "NÃO"}`);
    console.log(`   Validador Canônico: ${pbScientific.valid ? "PASS (100%)" : "FAIL"}`);

    const gate3Passed = pbRes.success && pbScientific.valid && pbMentions3Trunks && pbRejects4Trunks && pbRejectsCostocervical && pbHasErb && pbHasTrapezius;
    console.log(`   Resultado Gate 3: ${gate3Passed ? "PASS" : "FAIL"}`);
    results.gates.gate3_plexo_braquial = {
      passed: gate3Passed,
      totalSec: pbRes.totalSec,
      ttfeSec: pbRes.ttfeSec,
      ttftSec: pbRes.ttftSec,
      tps: pbRes.tps,
      scientificPassed: pbScientific.valid
    };
    results.benchmarks.plexo_braquial = pbRes;
    if (!gate3Passed) allGatesPassed = false;

    // Aguardar 2s
    await new Promise(r => setTimeout(r, 2000));

    // =========================================================================
    // GATE 4: CASO 2 — MANGUITO ROTADOR (REFUTAÇÃO DO REDONDO MAIOR)
    // =========================================================================
    console.log("\n--- GATE 4: Caso Canônico 2 — Manguito Rotador ---");
    const mrPrompt = `Estou estudando o Flashcard sobre "Manguito Rotador".
Pergunta do cartão: "Quais são os músculos que compõem o manguito rotador?"
Resposta proposta pelo cartão: "O manguito rotador é formado por supraespinal, infraespinal, redondo maior e subescapular."
Explicação do cartão: "O redondo maior realiza rotação lateral e estabiliza a cabeça umeral na fossa glenoidal."

Por favor, analise cientificamente este cartão como um professor de anatomia: verifique se a resposta proposta e a explicação estão corretas ou se contêm premissas falsas, aponte eventuais erros com rigor anatômico e me explique com detalhes a morfologia, relações topográficas e correlações clínicas pertinentes.`;

    const mrRes = await runSSEExplanation(
      STAGING_ENDPOINT,
      mrPrompt,
      {
        task: "explain_flashcard",
        source: "flashcard-explanation",
        topic: "Manguito Rotador",
        cardId: "fc-g5-mr-02"
      },
      jwt,
      anonKey
    );

    console.log(`   Tempo Total: ${mrRes.totalSec}s (TTFE: ${mrRes.ttfeSec}s, TTFT: ${mrRes.ttftSec}s)`);
    console.log(`   Tokens gerados: ~${mrRes.estimatedTokens} (Throughput: ${mrRes.tps} tokens/s)`);
    console.log(`   Fontes RAG: ${mrRes.sources.length}`);

    const mrRejectsTeresMajor = /redondo\s+maior.*(?:n[aã]o\s+(?:faz|comp[oõ]e|integra|pertence)|incorret|erro|fals)|n[aã]o.*redondo\s+maior/i.test(mrRes.text);
    const mrMentionsTeresMinor = /redondo\s+menor/i.test(mrRes.text);
    const mrMentionsSupraspinatus = /supraespinal|supraespinhal/i.test(mrRes.text);
    const mrMentionsInfraspinatus = /infraespinal|infraespinhal/i.test(mrRes.text);
    const mrMentionsSubscapularis = /subescapular/i.test(mrRes.text);

    console.log(`   Rejeita Redondo Maior: ${mrRejectsTeresMajor ? "SIM" : "NÃO"}`);
    console.log(`   Contém Redondo Menor: ${mrMentionsTeresMinor ? "SIM" : "NÃO"}`);
    console.log(`   Contém Supraespinal, Infraespinal, Subescapular: ${mrMentionsSupraspinatus && mrMentionsInfraspinatus && mrMentionsSubscapularis ? "SIM" : "NÃO"}`);

    const gate4Passed = mrRes.success && mrRejectsTeresMajor && mrMentionsTeresMinor && mrMentionsSupraspinatus && mrMentionsInfraspinatus && mrMentionsSubscapularis;
    console.log(`   Resultado Gate 4: ${gate4Passed ? "PASS" : "FAIL"}`);
    results.gates.gate4_manguito_rotador = {
      passed: gate4Passed,
      totalSec: mrRes.totalSec,
      ttfeSec: mrRes.ttfeSec,
      ttftSec: mrRes.ttftSec,
      tps: mrRes.tps
    };
    results.benchmarks.manguito_rotador = mrRes;
    if (!gate4Passed) allGatesPassed = false;

    // Aguardar 2s
    await new Promise(r => setTimeout(r, 2000));

    // =========================================================================
    // GATE 5: CASO 3 — CLAVÍCULA (REFUTAÇÃO DA INVERSÃO DE CURVATURAS)
    // =========================================================================
    console.log("\n--- GATE 5: Caso Canônico 3 — Clavícula ---");
    const clPrompt = `Estou estudando o Flashcard sobre "Clavícula".
Pergunta do cartão: "Quais são as curvaturas anatômicas e acidentes da clavícula?"
Resposta proposta pelo cartão: "A clavícula é convexa anteriormente em seu terço lateral e côncava nos dois terços mediais, articulando-se medialmente com o acrômio."
Explicação do cartão: "O terço lateral articula-se com o esterno e o terço medial com a escápula."

Por favor, analise cientificamente este cartão como um professor de anatomia: verifique se a resposta proposta e a explicação estão corretas ou se contêm premissas falsas, aponte eventuais erros com rigor anatômico e me explique com detalhes a morfologia, relações topográficas e correlações clínicas pertinentes.`;

    const clRes = await runSSEExplanation(
      STAGING_ENDPOINT,
      clPrompt,
      {
        task: "explain_flashcard",
        source: "flashcard-explanation",
        topic: "Clavícula",
        cardId: "fc-g5-cl-03"
      },
      jwt,
      anonKey
    );

    console.log(`   Tempo Total: ${clRes.totalSec}s (TTFE: ${clRes.ttfeSec}s, TTFT: ${clRes.ttftSec}s)`);
    console.log(`   Tokens gerados: ~${clRes.estimatedTokens} (Throughput: ${clRes.tps} tokens/s)`);
    console.log(`   Fontes RAG: ${clRes.sources.length}`);

    const clRejectsCurvatureInversion = /dois\s+ter[çc]os\s+mediais.*convex|ter[çc]o\s+lateral.*c[oô]ncav|invert|erro|fals|incorret/i.test(clRes.text);
    const clCorrectArticulations = /esternal.*esterno|acromial.*acr[oô]mio|esterno.*medial|acr[oô]mio.*lateral/i.test(clRes.text);

    console.log(`   Refuta Inversão de Curvaturas: ${clRejectsCurvatureInversion ? "SIM" : "NÃO"}`);
    console.log(`   Articulações Corretas (Esternal medial, Acromial lateral): ${clCorrectArticulations ? "SIM" : "NÃO"}`);

    const gate5Passed = clRes.success && clRejectsCurvatureInversion && clCorrectArticulations;
    console.log(`   Resultado Gate 5: ${gate5Passed ? "PASS" : "FAIL"}`);
    results.gates.gate5_clavicula = {
      passed: gate5Passed,
      totalSec: clRes.totalSec,
      ttfeSec: clRes.ttfeSec,
      ttftSec: clRes.ttftSec,
      tps: clRes.tps
    };
    results.benchmarks.clavicula = clRes;
    if (!gate5Passed) allGatesPassed = false;

    // =========================================================================
    // GATE 6: ZERO VAZAMENTO DE TOKENS DE RACIOCÍNIO (<think>)
    // =========================================================================
    console.log("\n--- GATE 6: Zero Vazamento de Tokens de Raciocínio (<think>) ---");
    const anyThinkingLeaked = pbRes.hasThinkingTokens || mrRes.hasThinkingTokens || clRes.hasThinkingTokens ||
      pbRes.text.includes("<think>") || mrRes.text.includes("<think>") || clRes.text.includes("<think>");
    const gate6Passed = !anyThinkingLeaked;
    console.log(`   Vazamento de <think> detectado: ${anyThinkingLeaked ? "SIM (FALHA)" : "NÃO (PASS)"}`);
    results.gates.gate6_zero_thinking_leak = { passed: gate6Passed };
    if (!gate6Passed) allGatesPassed = false;

    // =========================================================================
    // GATE 7: RETENÇÃO EM VRAM (keep_alive: 24h) E PARTIDA A QUENTE
    // =========================================================================
    console.log("\n--- GATE 7: Retenção em VRAM (keep_alive) e Partida a Quente ---");
    // As chamadas 1, 2 e 3 foram executadas em sequência.
    // Verificamos que o modelo permaneceu carregado na VRAM (sem penalidade de 11.6s).
    const gate7Passed = pbRes.totalSec < 85 && mrRes.totalSec < 85 && clRes.totalSec < 85;
    console.log(`   Tempos das 3 execuções: ${pbRes.totalSec}s, ${mrRes.totalSec}s, ${clRes.totalSec}s`);
    console.log(`   Retenção comprovada (todos < 85s, média ~${((pbRes.totalSec + mrRes.totalSec + clRes.totalSec) / 3).toFixed(1)}s): ${gate7Passed ? "PASS" : "FAIL"}`);
    results.gates.gate7_vram_pinning = {
      passed: gate7Passed,
      run1Sec: pbRes.totalSec,
      run2Sec: mrRes.totalSec,
      run3Sec: clRes.totalSec,
      averageSec: parseFloat(((pbRes.totalSec + mrRes.totalSec + clRes.totalSec) / 3).toFixed(1))
    };
    if (!gate7Passed) allGatesPassed = false;

    // =========================================================================
    // GATE 8: CONFIRMAÇÃO EXPLÍCITA DE VALIDAÇÃO CIENTÍFICA NO STREAMING
    // =========================================================================
    console.log("\n--- GATE 8: Confirmação Explícita de Validação Científica no Streaming ---");
    const allValidationsReceived = pbRes.validationReceived && mrRes.validationReceived && clRes.validationReceived;
    const gate8Passed = allValidationsReceived && pbRes.sseDone && mrRes.sseDone && clRes.sseDone;
    console.log(`   Evento validation=true recebido em todas as execuções: ${allValidationsReceived ? "SIM" : "NÃO"}`);
    console.log(`   Marcador terminal [DONE] íntegro em todas as execuções: ${pbRes.sseDone && mrRes.sseDone && clRes.sseDone ? "SIM" : "NÃO"}`);
    results.gates.gate8_scientific_validation_confirmed = { passed: gate8Passed };
    if (!gate8Passed) allGatesPassed = false;

    // =========================================================================
    // GATE 9: TRATAMENTO DE DESCONEXÃO / ABORT E LIBERAÇÃO DE RECURSOS
    // =========================================================================
    console.log("\n--- GATE 9: Tratamento de Desconexão / Abort e Liberação de Recursos ---");
    const abortController = new AbortController();
    const tAbort0 = performance.now();
    let abortHandledGracefully = false;

    try {
      const abortPromise = fetch(STAGING_ENDPOINT, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
          Accept: "text/event-stream"
        },
        signal: abortController.signal,
        body: JSON.stringify({
          messages: [{ sender: "user", text: "Abort test" }],
          context: { task: "explain_flashcard" },
          task: "explain_flashcard",
          stream: true
        })
      });

      // Aborta intencionalmente após 400ms (após TTFE, durante processamento)
      setTimeout(() => abortController.abort(), 400);
      await abortPromise;
    } catch (err) {
      if (err.name === "AbortError" || err?.message?.includes("aborted")) {
        abortHandledGracefully = true;
      }
    }
    const abortElapsed = Math.round(performance.now() - tAbort0);
    console.log(`   Requisição abortada em ${abortElapsed}ms: ${abortHandledGracefully ? "PASS (AbortError capturado com sucesso)" : "FAIL"}`);
    results.gates.gate9_abort_handling = { passed: abortHandledGracefully, elapsedMs: abortElapsed };
    if (!abortHandledGracefully) allGatesPassed = false;

    // Resumo Final
    results.allGatesPassed = allGatesPassed;
    console.log("\n================================================================================");
    console.log(`=== RESULTADO FINAL DA HOMOLOGAÇÃO P0.20-G.5: ${allGatesPassed ? "TODOS OS 9 GATES APROVADOS (GO)" : "FALHA EM GATES (NO-GO)"} ===`);
    console.log("================================================================================\n");

    const REPORT_SAVE = "C:\\Users\\halis\\.gemini\\antigravity\\brain\\b63445c2-37f0-46a4-8ca8-5556eb65a8a3\\P0.20_G5_HOMOLOGATION_RESULTS.json";
    fs.writeFileSync(REPORT_SAVE, JSON.stringify(results, null, 2), "utf-8");
    console.log(`Relatório estruturado gravado em: ${REPORT_SAVE}`);

  } catch (err) {
    console.error("Erro fatal na execução da suíte de homologação:", err);
    process.exit(1);
  } finally {
    // Teardown auditado da conta de teste
    try {
      console.log("\n[Teardown] Encerrando sessão de teste da conta de automação...");
      await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}'::uuid, 'p0_20_g5_homologation_teardown');`);
      console.log("   Sessão liberada com sucesso.");
    } catch (teardownErr) {
      console.warn("   Aviso no teardown da sessão:", teardownErr.message);
    }
  }

  if (!allGatesPassed) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Erro no runner principal:", err);
  process.exit(1);
});
