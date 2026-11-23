// Benchmark Fortalecido com Múltiplas Repetições e Análise de Dispersão (P0.20-G.5.2)
// Alvo: ai-tutor-staging (v4) / Qwen 3.5 4B (RTX 4050)
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é expressamente proibido.");
}

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { getCredential } from "./get_cred_helper.mjs";
import { runSupabaseSql, getMgmtToken } from "./supabase_admin_helper.mjs";
import { validateAnatomicalScientificFacts } from "../../src/services/ai/academicTaskContracts.js";

const PROJECT_REF = "hyivyrietgjdazgizafp";
const TARGET_TEST_USER_ID = "825b2496-ecec-4b67-8343-f8aa3578c224";
const TARGET_TEST_EMAIL = "atlas-e2e-ai-tutor@aeternumatlas.com";
const STAGING_ENDPOINT = `https://${PROJECT_REF}.supabase.co/functions/v1/ai-tutor-staging`;
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";

function getGpuStats() {
  try {
    const raw = execSync("nvidia-smi --query-gpu=memory.used,memory.total,temperature.gpu,utilization.gpu --format=csv,noheader,nounits", { encoding: "utf8" });
    const [memUsed, memTotal, temp, util] = raw.trim().split(",").map(s => parseFloat(s.trim()));
    return { memUsedMb: memUsed, memTotalMb: memTotal, tempC: temp, utilPct: util };
  } catch {
    return { memUsedMb: null, memTotalMb: null, tempC: null, utilPct: null };
  }
}

async function getTestJwt(anonKey) {
  const password = getCredential("AeternumAtlas:AutomationTestAccount");
  const authRes = await fetch(`https://${PROJECT_REF}.supabase.co/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: TARGET_TEST_EMAIL, password })
  });
  if (!authRes.ok) throw new Error(`Falha na autenticação do usuário de teste: HTTP ${authRes.status}`);
  const authData = await authRes.json();
  return authData.access_token;
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
  let validationFacts = [];
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
          progressEvents.push({ ...parsed, timeMs: Math.round(now - t0) });
        } else if (parsed.type === "validation") {
          validationReceived = Boolean(parsed.valid);
          validationFacts = parsed.verifiedFacts || [];
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
    validationFacts,
    progressEvents,
    hasThinkingTokens
  };
}

function calculateFortifiedStats(values) {
  if (!values.length) return { mean: 0, median: 0, variance: 0, stdDev: 0, min: 0, max: 0, q1: 0, q3: 0, iqr: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  function getPercentile(arr, p) {
    if (arr.length === 1) return arr[0];
    const idx = (arr.length - 1) * p;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    return arr[lower] * (1 - weight) + arr[upper] * weight;
  }

  const median = getPercentile(sorted, 0.5);
  const q1 = getPercentile(sorted, 0.25);
  const q3 = getPercentile(sorted, 0.75);
  const iqr = q3 - q1;
  const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    mean: parseFloat(mean.toFixed(2)),
    median: parseFloat(median.toFixed(2)),
    variance: parseFloat(variance.toFixed(4)),
    stdDev: parseFloat(stdDev.toFixed(2)),
    min: sorted[0],
    max: sorted[n - 1],
    q1: parseFloat(q1.toFixed(2)),
    q3: parseFloat(q3.toFixed(2)),
    iqr: parseFloat(iqr.toFixed(2))
  };
}

async function main() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: BENCHMARK FORTALECIDO COM MULTIPLAS REPETICOES (P0.20-G.5.2) ===");
  console.log("=== Modelo: Qwen 3.5 4B (RTX 4050 6GB) -> ai-tutor-staging (v4)             ===");
  console.log("================================================================================\n");

  console.log("[1/3] Obtendo credenciais e autenticando com conta de automação...");
  const mgmtToken = getMgmtToken();
  const kRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, {
    headers: { Authorization: `Bearer ${mgmtToken}` }
  });
  const keys = await kRes.json();
  const anonKey = keys.find(k => k.name === "anon" || k.tags === "anon")?.api_key;
  if (!anonKey) throw new Error("Chave anônima do Supabase não encontrada.");

  const jwt = await getTestJwt(anonKey);
  const jwtPayload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString("utf8"));
  const sessionId = jwtPayload.session_id || jwtPayload.sub;

  await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/rpc/register_or_transfer_session`, {
    method: "POST",
    headers: { apikey: anonKey, Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      p_session_id: sessionId,
      p_device_fingerprint: "bench-device-g5-2",
      p_confirm_transfer: true,
      p_metadata: { client: "fortified-benchmark-g5-2" }
    })
  });
  console.log("   JWT e sessão ativa obtidos com sucesso.");

  const scenarios = [
    {
      id: "case1_plexo_braquial",
      name: "Cenário 1: Plexo Braquial (Troncos e Raízes)",
      topic: "Plexo Braquial",
      prompt: `Estou estudando o Flashcard sobre "Plexo Braquial".
Pergunta do cartão: "Quais são os quatro troncos do plexo braquial e suas respectivas raízes?"
Resposta proposta pelo cartão: "O plexo braquial é composto por quatro troncos: superior, médio, inferior e acessório. O tronco superior é formado pelas raízes de C4 e C5, o médio por C6 e C7, o inferior por C8 e T1, e o acessório por T2."
Explicação do cartão: "O tronco acessório é responsável pela inervação dos músculos tenares e sua lesão causa paralisia de Erb-Duchenne."

Por favor, analise cientificamente este cartão como um professor de anatomia: verifique se a resposta proposta e a explicação estão corretas ou se contêm premissas falsas, aponte eventuais erros com rigor anatômico e me explique com detalhes a morfologia, relações topográficas e correlações clínicas pertinentes.`,
      scientificCheck: (text) => {
        const v = validateAnatomicalScientificFacts(text, "Plexo Braquial");
        const rThreeTrunks = /3\s+troncos|tr[eê]s\s+troncos/i.test(text);
        const rNoAccessory = /n[aã]o\s+existe.*acess[oó]rio|acess[oó]rio.*n[aã]o\s+existe|apenas\s+tr[eê]s|incorret|fals|erro/i.test(text);
        const rFiveRoots = /5\s+ra[ií]zes|cinco\s+ra[ií]zes|C5[- ]T1/i.test(text);
        const rErb = /Erb|Duchenne|C5[- ]C6/i.test(text);
        return {
          valid: v.valid && rThreeTrunks && rNoAccessory && rFiveRoots && rErb,
          contradictions: v.contradictions,
          details: { vValid: v.valid, rThreeTrunks, rNoAccessory, rFiveRoots, rErb }
        };
      }
    },
    {
      id: "case2_manguito_rotador",
      name: "Cenário 2: Manguito Rotador (Tendão do Supraespinoso)",
      topic: "Manguito Rotador",
      prompt: `Estou estudando o Flashcard sobre "Manguito Rotador".
Pergunta do cartão: "Quais são os músculos que compõem o manguito rotador?"
Resposta proposta pelo cartão: "O manguito rotador é formado por supraespinal, infraespinal, redondo maior e subescapular."
Explicação do cartão: "O redondo maior realiza rotação lateral e estabiliza a cabeça umeral na fossa glenoidal."

Por favor, analise cientificamente este cartão como um professor de anatomia: verifique se a resposta proposta e a explicação estão corretas ou se contêm premissas falsas, aponte eventuais erros com rigor anatômico e me explique com detalhes a morfologia, relações topográficas e correlações clínicas pertinentes.`,
      scientificCheck: (text) => {
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
      name: "Cenário 3: Clavícula e Ombro (Tubérculo Conoide)",
      topic: "Clavícula",
      prompt: `Estou estudando o Flashcard sobre "Clavícula".
Pergunta do cartão: "Quais são as curvaturas anatômicas e acidentes da clavícula?"
Resposta proposta pelo cartão: "A clavícula é convexa anteriormente em seu terço lateral e côncava nos dois terços mediais, articulando-se medialmente com o acrômio."
Explicação do cartão: "O terço lateral articula-se com o esterno e o terço medial com a escápula."

Por favor, analise cientificamente este cartão como um professor de anatomia: verifique se a resposta proposta e a explicação estão corretas ou se contêm premissas falsas, aponte eventuais erros com rigor anatômico e me explique com detalhes a morfologia, relações topográficas e correlações clínicas pertinentes.`,
      scientificCheck: (text) => {
        const rInversion = /dois\s+ter[çc]os\s+mediais.*convex|ter[çc]o\s+lateral.*c[oô]ncav|invert|erro|fals|incorret/i.test(text);
        const cArtic = /esternal.*esterno|acromial.*acr[oô]mio|esterno.*medial|acr[oô]mio.*lateral/i.test(text);
        return {
          valid: rInversion && cArtic,
          details: { rInversion, cArtic }
        };
      }
    },
    {
      id: "case4_trigono_femoral",
      name: "Cenário 4: Trígono Femoral (Limites e Feixe NAV)",
      topic: "Trígono Femoral",
      prompt: `Estou estudando o Flashcard sobre "Trígono Femoral (Triângulo de Scarpa)".
Pergunta do cartão: "Quais são os limites anatômicos e a disposição vascular do trígono femoral?"
Resposta proposta pelo cartão: "O trígono femoral é delimitado medialmente pelo músculo sartório, lateralmente pelo músculo adutor longo e superiormente pelo ligamento sacrotuberal. Em seu interior, a artéria femoral situa-se lateralmente ao nervo femoral."
Explicação do cartão: "O ligamento sacrotuberal forma a base superior do trígono e o nervo femoral é medial à artéria femoral."

Por favor, analise cientificamente este cartão como um professor de anatomia: verifique se a resposta proposta e a explicação estão corretas ou se contêm premissas falsas, aponte eventuais erros com rigor anatômico e me explique com detalhes a anatomia topográfica verdadeira da região femoral.`,
      scientificCheck: (text) => {
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

  const REPETITIONS = 3;
  const allResults = [];
  const scenarioSummaries = {};

  console.log(`\n[2/3] Executando matriz de ${scenarios.length} cenários x ${REPETITIONS} repetições = ${scenarios.length * REPETITIONS} execuções...\n`);

  for (let sIdx = 0; sIdx < scenarios.length; sIdx++) {
    const scenario = scenarios[sIdx];
    console.log(`================================================================================`);
    console.log(`[Cenário ${sIdx + 1}/${scenarios.length}] ${scenario.name}`);
    console.log(`================================================================================`);

    const runMetrics = {
      ttfe: [],
      ttft: [],
      total: [],
      tps: [],
      length: [],
      scientificPassCount: 0
    };

    for (let rep = 1; rep <= REPETITIONS; rep++) {
      console.log(`\n--- Repetição ${rep}/${REPETITIONS} (${scenario.id}) ---`);
      // Reset rate limit antes de cada execução
      await runSupabaseSql(`UPDATE public.ai_rate_limits SET request_count = 0 WHERE user_id = '${TARGET_TEST_USER_ID}'::uuid;`);

      const gpuBefore = getGpuStats();
      const res = await runSSEExplanation(
        STAGING_ENDPOINT,
        scenario.prompt,
        { task: "explain_flashcard", source: "flashcard-explanation", topic: scenario.topic, cardId: `fc-fortified-${scenario.id}` },
        jwt,
        anonKey
      );
      const gpuAfter = getGpuStats();

      if (!res.success) {
        console.error(`   [ERRO] Repetição ${rep} falhou: ${res.error}`);
        continue;
      }

      const sci = scenario.scientificCheck(res.text);
      console.log(`   TTFE: ${res.ttfeSec}s | TTFT: ${res.ttftSec}s | Total: ${res.totalSec}s | Chars: ${res.textLength} | TPS: ${res.tps}`);
      console.log(`   Validação Científica: ${sci.valid ? "PASS" : "FAIL"} | Thinking tokens: ${res.hasThinkingTokens ? "SIM (VIOLAÇÃO)" : "NÃO (CONFORME)"}`);
      console.log(`   GPU VRAM: ${gpuAfter.memUsedMb} MB | Temp: ${gpuAfter.tempC}°C | Util: ${gpuAfter.utilPct}%`);

      runMetrics.ttfe.push(res.ttfeSec);
      runMetrics.ttft.push(res.ttftSec);
      runMetrics.total.push(res.totalSec);
      runMetrics.tps.push(res.tps);
      runMetrics.length.push(res.textLength);
      if (sci.valid) runMetrics.scientificPassCount++;

      allResults.push({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        repetition: rep,
        ttfeSec: res.ttfeSec,
        ttftSec: res.ttftSec,
        totalSec: res.totalSec,
        generationSec: res.generationSec,
        textLength: res.textLength,
        tps: res.tps,
        scientificValid: sci.valid,
        hasThinkingTokens: res.hasThinkingTokens,
        gpuMemMb: gpuAfter.memUsedMb,
        gpuTempC: gpuAfter.tempC,
        gpuUtilPct: gpuAfter.utilPct
      });

      // Intervalo de resfriamento entre repetições
      await new Promise(r => setTimeout(r, 2000));
    }

    scenarioSummaries[scenario.id] = {
      name: scenario.name,
      repetitions: REPETITIONS,
      ttfe: calculateFortifiedStats(runMetrics.ttfe),
      ttft: calculateFortifiedStats(runMetrics.ttft),
      total: calculateFortifiedStats(runMetrics.total),
      tps: calculateFortifiedStats(runMetrics.tps),
      textLength: calculateFortifiedStats(runMetrics.length),
      scientificPassRatePct: parseFloat(((runMetrics.scientificPassCount / REPETITIONS) * 100).toFixed(1))
    };
  }

  // Estatísticas globais consolidadas
  const allTotals = allResults.map(r => r.totalSec);
  const allTtfes = allResults.map(r => r.ttfeSec);
  const allTtfts = allResults.map(r => r.ttftSec);
  const allTps = allResults.map(r => r.tps);

  const globalSummary = {
    testDate: new Date().toISOString(),
    hardware: "RTX 4050 6GB Laptop (VRAM ~4.7 GB dedicada), Intel i5-13420H, 16GB RAM",
    model: "Qwen 3.5 4B (qwen3.5:4b via Ollama local)",
    totalExecutions: allResults.length,
    overallMetrics: {
      totalLatencySec: calculateFortifiedStats(allTotals),
      ttfeSec: calculateFortifiedStats(allTtfes),
      ttftSec: calculateFortifiedStats(allTtfts),
      tokensPerSecond: calculateFortifiedStats(allTps)
    },
    scenarioSummaries,
    rawRuns: allResults
  };

  console.log("\n================================================================================");
  console.log("=== RESUMO ESTATÍSTICO GLOBAL CONSOLIDADO (G.5.2) ===");
  console.log("================================================================================");
  console.log(`Total de Execuções: ${allResults.length}`);
  console.log(`Latência Total - Média: ${globalSummary.overallMetrics.totalLatencySec.mean}s | Mediana: ${globalSummary.overallMetrics.totalLatencySec.median}s`);
  console.log(`Latência Total - Min: ${globalSummary.overallMetrics.totalLatencySec.min}s | Max: ${globalSummary.overallMetrics.totalLatencySec.max}s`);
  console.log(`Latência Total - Variância: ${globalSummary.overallMetrics.totalLatencySec.variance} | Desvio Padrão: ${globalSummary.overallMetrics.totalLatencySec.stdDev}s | IQR: ${globalSummary.overallMetrics.totalLatencySec.iqr}s`);
  console.log(`TTFE - Média: ${globalSummary.overallMetrics.ttfeSec.mean}s | Mediana: ${globalSummary.overallMetrics.ttfeSec.median}s | IQR: ${globalSummary.overallMetrics.ttfeSec.iqr}s`);
  console.log(`TTFT - Média: ${globalSummary.overallMetrics.ttftSec.mean}s | Mediana: ${globalSummary.overallMetrics.ttftSec.median}s | IQR: ${globalSummary.overallMetrics.ttftSec.iqr}s`);
  console.log(`Taxa de Geração - Média: ${globalSummary.overallMetrics.tokensPerSecond.mean} tokens/s`);

  const artifactPath = path.join(ARTIFACTS_DIR, "P0.20_G5_2_FORTIFIED_BENCHMARK_RESULTS.json");
  fs.writeFileSync(artifactPath, JSON.stringify(globalSummary, null, 2), "utf8");
  console.log(`\nArtefato consolidado salvo em: ${artifactPath}`);
}

main().catch(console.error);
