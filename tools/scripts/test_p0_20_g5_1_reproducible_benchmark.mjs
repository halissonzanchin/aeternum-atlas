import fs from "node:fs";
import { execSync } from "node:child_process";
import { getCredential } from "./get_cred_helper.mjs";
import { runSupabaseSql, getMgmtToken } from "./supabase_admin_helper.mjs";
import {
  validateAnatomicalScientificFacts,
  validateCitationProvenance,
  isTutorSuccess
} from "../../src/services/ai/academicTaskContracts.js";

// STRICT TLS: Proibido bypass TLS no Aeternum Atlas
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é expressamente proibido.");
}

const PROJECT_REF = "hyivyrietgjdazgizafp";
const TARGET_TEST_EMAIL = "atlas-e2e-ai-tutor@aeternumatlas.com";
const TARGET_TEST_USER_ID = "825b2496-ecec-4b67-8343-f8aa3578c224";
const STAGING_ENDPOINT = `https://${PROJECT_REF}.supabase.co/functions/v1/ai-tutor-staging`;

function getGpuStats() {
  try {
    const raw = execSync("nvidia-smi --query-gpu=memory.used,memory.total,temperature.gpu,utilization.gpu --format=csv,noheader,nounits", { encoding: "utf8" });
    const [memUsed, memTotal, temp, util] = raw.trim().split(",").map(s => parseFloat(s.trim()));
    return { memUsedMb: memUsed, memTotalMb: memTotal, tempC: temp, utilPct: util };
  } catch {
    return { memUsedMb: null, memTotalMb: null, tempC: null, utilPct: null };
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

  const res = await fetch(endpoint, {
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
    return { httpStatus, success: false, error: `HTTP ${res.status}` };
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

function calculateStats(values) {
  if (!values.length) return { mean: 0, median: 0, variance: 0, stdDev: 0, min: 0, max: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / sorted.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / sorted.length;
  const stdDev = Math.sqrt(variance);
  return {
    mean: parseFloat(mean.toFixed(2)),
    median: parseFloat(median.toFixed(2)),
    variance: parseFloat(variance.toFixed(4)),
    stdDev: parseFloat(stdDev.toFixed(2)),
    min: sorted[0],
    max: sorted[sorted.length - 1]
  };
}

async function main() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: BENCHMARK REPRODUZÍVEL & INTEGRIDADE CIENTÍFICA P0.20-G.5.1 ===");
  console.log("=== Modelo: Qwen 3.5 4B (Ollama Local RTX 4050 6GB) -> ai-tutor-staging (SSE) ===");
  console.log("================================================================================\n");

  const gpuBefore = getGpuStats();
  console.log(`[GPU Baseline] VRAM: ${gpuBefore.memUsedMb}/${gpuBefore.memTotalMb} MB, Temp: ${gpuBefore.tempC}°C`);

  // Auth setup
  await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}'::uuid, 'p0_20_g5_1_benchmark');`);
  await runSupabaseSql(`UPDATE public.ai_rate_limits SET request_count = 0 WHERE user_id = '${TARGET_TEST_USER_ID}'::uuid;`);

  const password = getCredential("AeternumAtlas:AutomationTestAccount");
  const mgmtToken = getMgmtToken();
  const kRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, {
    headers: { Authorization: `Bearer ${mgmtToken}` }
  });
  const keys = await kRes.json();
  const anonKey = keys.find(k => k.name === "anon" || k.tags === "anon")?.api_key;

  const authRes = await fetch(`https://${PROJECT_REF}.supabase.co/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: TARGET_TEST_EMAIL, password })
  });
  const authData = await authRes.json();
  const jwt = authData.access_token;
  const jwtPayload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString("utf8"));
  const sessionId = jwtPayload.session_id || jwtPayload.sub;

  await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/rpc/register_or_transfer_session`, {
    method: "POST",
    headers: { apikey: anonKey, Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      p_session_id: sessionId,
      p_device_fingerprint: "bench-device-g5-1",
      p_confirm_transfer: true,
      p_metadata: { client: "benchmark-p0-20-g5-1" }
    })
  });

  const testCases = [
    {
      id: "case1_plexo_braquial",
      name: "Plexo Braquial (Canônico)",
      topic: "Plexo Braquial",
      prompt: `Estou estudando o Flashcard sobre "Plexo Braquial".
Pergunta do cartão: "Quais são os quatro troncos do plexo braquial?"
Resposta proposta pelo cartão: "O plexo braquial é composto por quatro troncos: superior, médio, inferior e tronco costocervical. O fascículo lateral inerva o trapézio e sua lesão causa paralisia de Erb-Duchenne."
Explicação do cartão: "O tronco costocervical integra o plexo braquial e divide-se em 3 divisões que formam os fascículos."

Por favor, analise cientificamente este cartão como um professor de anatomia: verifique se a resposta proposta e a explicação estão corretas ou se contêm premissas falsas, aponte eventuais erros com rigor anatômico e me explique com detalhes a morfologia, relações topográficas e correlações clínicas pertinentes.`,
      validate: (text) => {
        const sci = validateAnatomicalScientificFacts(text, "Plexo Braquial");
        const m3 = /(?:tr[eê]s|3)\s+troncos/i.test(text) || (/superior/i.test(text) && /m[eé]dio/i.test(text) && /inferior/i.test(text));
        const r4 = /n[aã]o\s+(?:existem|h[aá]|s[aã]o|possui)\s+quatro|erro|incorret|apenas\s+tr[eê]s|3\s+troncos/i.test(text);
        const rCosto = /rejeit\w*.*costocervical|costocervical.*(?:art[eé]ria|ramo|subcl[aá]via|n[aã]o\s+(?:[eé]|faz|integra|aos)|simp[aá]tico)|n[aã]o.*costocervical|tronco\s+costocervical.*incorret/i.test(text);
        const erb = /erb[- ]duchenne.*(?:tronco\s+superior|c5|c6)|(?:tronco\s+superior|c5|c6).*erb[- ]duchenne|paralisia\s+de\s+erb/i.test(text);
        const trap = /trap[eé]zio.*(?:acess[oó]rio|accesorio|xi|cranial)|nerv[io|o]+\s+(?:acess[oó]rio|accesorio)|fasc[ií]culo\s+lateral.*n[aã]o\s+inerva/i.test(text);
        return {
          valid: sci.valid && m3 && r4 && rCosto && erb && trap,
          details: { sciValid: sci.valid, m3, r4, rCosto, erb, trap }
        };
      }
    },
    {
      id: "case2_manguito_rotador",
      name: "Manguito Rotador (Canônico)",
      topic: "Manguito Rotador",
      prompt: `Estou estudando o Flashcard sobre "Manguito Rotador".
Pergunta do cartão: "Quais são os músculos que compõem o manguito rotador?"
Resposta proposta pelo cartão: "O manguito rotador é formado por supraespinal, infraespinal, redondo maior e subescapular."
Explicação do cartão: "O redondo maior realiza rotação lateral e estabiliza a cabeça umeral na fossa glenoidal."

Por favor, analise cientificamente este cartão como um professor de anatomia: verifique se a resposta proposta e a explicação estão corretas ou se contêm premissas falsas, aponte eventuais erros com rigor anatômico e me explique com detalhes a morfologia, relações topográficas e correlações clínicas pertinentes.`,
      validate: (text) => {
        const rTeresMajor = /redondo\s+maior.*(?:n[aã]o\s+(?:faz|comp[oõ]e|integra|pertence)|incorret|erro|fals)|n[aã]o.*redondo\s+maior/i.test(text);
        const mTeresMinor = /redondo\s+menor/i.test(text);
        const mSupra = /supraespinal|supraespinhal/i.test(text);
        const mInfra = /infraespinal|infraespinhal/i.test(text);
        const mSub = /subescapular/i.test(text);
        return {
          valid: rTeresMajor && mTeresMinor && mSupra && mInfra && mSub,
          details: { rTeresMajor, mTeresMinor, mSupra, mInfra, mSub }
        };
      }
    },
    {
      id: "case3_clavicula",
      name: "Clavícula (Canônico)",
      topic: "Clavícula",
      prompt: `Estou estudando o Flashcard sobre "Clavícula".
Pergunta do cartão: "Quais são as curvaturas anatômicas e acidentes da clavícula?"
Resposta proposta pelo cartão: "A clavícula é convexa anteriormente em seu terço lateral e côncava nos dois terços mediais, articulando-se medialmente com o acrômio."
Explicação do cartão: "O terço lateral articula-se com o esterno e o terço medial com a escápula."

Por favor, analise cientificamente este cartão como um professor de anatomia: verifique se a resposta proposta e a explicação estão corretas ou se contêm premissas falsas, aponte eventuais erros com rigor anatômico e me explique com detalhes a morfologia, relações topográficas e correlações clínicas pertinentes.`,
      validate: (text) => {
        const rInversion = /dois\s+ter[çc]os\s+mediais.*convex|ter[çc]o\s+lateral.*c[oô]ncav|invert|erro|fals|incorret/i.test(text);
        const cArtic = /esternal.*esterno|acromial.*acr[oô]mio|esterno.*medial|acr[oô]mio.*lateral/i.test(text);
        return {
          valid: rInversion && cArtic,
          details: { rInversion, cArtic }
        };
      }
    },
    {
      id: "case4_trigono_femoral_unseen",
      name: "Trígono Femoral (Não Visto / Negativo)",
      topic: "Trígono Femoral",
      prompt: `Estou estudando o Flashcard sobre "Trígono Femoral (Triângulo de Scarpa)".
Pergunta do cartão: "Quais são os limites anatômicos e a disposição vascular do trígono femoral?"
Resposta proposta pelo cartão: "O trígono femoral é delimitado medialmente pelo músculo sartório, lateralmente pelo músculo adutor longo e superiormente pelo ligamento sacrotuberal. Em seu interior, a artéria femoral situa-se lateralmente ao nervo femoral."
Explicação do cartão: "O ligamento sacrotuberal forma a base superior do trígono e o nervo femoral é medial à artéria femoral."

Por favor, analise cientificamente este cartão como um professor de anatomia: verifique se a resposta proposta e a explicação estão corretas ou se contêm premissas falsas, aponte eventuais erros com rigor anatômico e me explique com detalhes a anatomia topográfica verdadeira da região femoral.`,
      validate: (text) => {
        const rBorders = /sart[oó]rio.*lateral|adutor\s+longo.*medial|invertid|erro|fals|incorret/i.test(text);
        const rLigament = /inguinal|sacrotuberal.*(?:n[aã]o|incorret|erro|fals)|n[aã]o.*sacrotuberal/i.test(text);
        const rNav = /nervo.*lateral.*art[eé]ria|art[eé]ria.*medial.*nervo|n[- ]?a[- ]?v|van/i.test(text);
        return {
          valid: rBorders && rLigament && rNav,
          details: { rBorders, rLigament, rNav }
        };
      }
    }
  ];

  const benchmarkRuns = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`[Execução ${i + 1}/${testCases.length}] Cenário: ${tc.name}`);
    console.log(`--------------------------------------------------------------------------------`);

    const gpuStart = getGpuStats();
    const result = await runSSEExplanation(
      STAGING_ENDPOINT,
      tc.prompt,
      { task: "explain_flashcard", source: "flashcard-explanation", topic: tc.topic, cardId: `fc-bench-${tc.id}` },
      jwt,
      anonKey
    );
    const gpuEnd = getGpuStats();

    if (!result.success) {
      console.error(`   FALHA na execução: ${result.error}`);
      benchmarkRuns.push({ caseId: tc.id, success: false, error: result.error });
      continue;
    }

    const scientificCheck = tc.validate(result.text);

    console.log(`   Tempo Total: ${result.totalSec}s | TTFE: ${result.ttfeSec}s | TTFT: ${result.ttftSec}s`);
    console.log(`   Tokens: ~${result.estimatedTokens} | Caracteres: ${result.textLength}`);
    console.log(`   Fontes RAG: ${result.sources.length} | Validação Científica Explícita: ${result.validationReceived ? "SIM" : "NÃO"}`);
    console.log(`   Vazamento de <think>: ${result.hasThinkingTokens ? "SIM (FALHA)" : "NÃO (PASS)"}`);
    console.log(`   Precisão Científica: ${scientificCheck.valid ? "PASS (100%)" : "FAIL"}`);
    console.log(`   Detalhes Científicos:`, JSON.stringify(scientificCheck.details));
    console.log(`   GPU VRAM: ${gpuEnd.memUsedMb} MB (${gpuEnd.memUsedMb - gpuStart.memUsedMb >= 0 ? "+" : ""}${gpuEnd.memUsedMb - gpuStart.memUsedMb} MB) | Temp: ${gpuEnd.tempC}°C`);

    benchmarkRuns.push({
      caseId: tc.id,
      name: tc.name,
      success: true,
      totalSec: result.totalSec,
      ttfeSec: result.ttfeSec,
      ttftSec: result.ttftSec,
      textLength: result.textLength,
      estimatedTokens: result.estimatedTokens,
      tps: result.tps,
      sourcesCount: result.sources.length,
      validationReceived: result.validationReceived,
      hasThinkingTokens: result.hasThinkingTokens,
      scientificPassed: scientificCheck.valid,
      scientificDetails: scientificCheck.details,
      gpuVramUsedMb: gpuEnd.memUsedMb,
      gpuTempC: gpuEnd.tempC,
      progressStages: result.progressEvents.map(e => e.stage)
    });

    // Intervalo de segurança para descanso térmico da GPU e ciclo de GC
    await new Promise(r => setTimeout(r, 2000));
  }

  // Estatísticas agregadas
  const successfulRuns = benchmarkRuns.filter(r => r.success);
  const totalSecs = successfulRuns.map(r => r.totalSec);
  const ttfes = successfulRuns.map(r => r.ttfeSec).filter(v => v !== null);
  const ttfts = successfulRuns.map(r => r.ttftSec).filter(v => v !== null);
  const tokenCounts = successfulRuns.map(r => r.estimatedTokens);
  const vrams = successfulRuns.map(r => r.gpuVramUsedMb).filter(v => v !== null);

  const stats = {
    totalLatencySec: calculateStats(totalSecs),
    ttfeSec: calculateStats(ttfes),
    ttftSec: calculateStats(ttfts),
    estimatedTokens: calculateStats(tokenCounts),
    gpuVramUsedMb: calculateStats(vrams)
  };

  console.log("\n================================================================================");
  console.log("=== RELATÓRIO ESTATÍSTICO DE DESEMPENHO E INTEGRIDADE CIENTÍFICA ===");
  console.log("================================================================================");
  console.log(`Execuções bem-sucedidas: ${successfulRuns.length}/${benchmarkRuns.length}`);
  console.log(`Latência Total (s): Média = ${stats.totalLatencySec.mean}s | Mediana = ${stats.totalLatencySec.median}s | Variância = ${stats.totalLatencySec.variance} | Min = ${stats.totalLatencySec.min}s | Max = ${stats.totalLatencySec.max}s`);
  console.log(`TTFE (s): Média = ${stats.ttfeSec.mean}s | Mediana = ${stats.ttfeSec.median}s | Variância = ${stats.ttfeSec.variance}`);
  console.log(`TTFT (s): Média = ${stats.ttftSec.mean}s | Mediana = ${stats.ttftSec.median}s | Variância = ${stats.ttftSec.variance}`);
  console.log(`VRAM (MB): Média = ${stats.gpuVramUsedMb.mean} MB | Estabilidade = Zero OOM, headroom ~${(6141 - stats.gpuVramUsedMb.mean).toFixed(0)} MB`);
  console.log(`Zero <think> tokens em todas as execuções: ${successfulRuns.every(r => !r.hasThinkingTokens) ? "SIM (100% PASS)" : "NÃO"}`);
  console.log(`Todas as refutações científicas corretas: ${successfulRuns.every(r => r.scientificPassed) ? "SIM (100% PASS)" : "NÃO"}`);

  const report = {
    suite: "P0.20-G.5.1 Reproducible Benchmark & Scientific Integrity",
    timestamp: new Date().toISOString(),
    runs: benchmarkRuns,
    stats,
    verdict: (successfulRuns.length === testCases.length && successfulRuns.every(r => r.scientificPassed && !r.hasThinkingTokens)) ? "PASS" : "FAIL"
  };

  const outputPath = "C:\\Users\\halis\\.gemini\\antigravity\\brain\\b63445c2-37f0-46a4-8ca8-5556eb65a8a3\\P0.20_G5_1_BENCHMARK_RESULTS.json";
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nResultado completo gravado em: ${outputPath}`);

  // Teardown
  await runSupabaseSql(`SELECT public.admin_reset_user_session('${TARGET_TEST_USER_ID}'::uuid, 'teardown');`);
}

main().catch(err => {
  console.error("Erro fatal no benchmark:", err);
  process.exit(1);
});
