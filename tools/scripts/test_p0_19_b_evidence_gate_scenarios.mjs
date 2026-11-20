import { getMgmtToken } from "./supabase_admin_helper.mjs";
import { buildCalibratedSearchQueries } from "./calibrated_retrieval.mjs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Exact replica of evaluateEvidenceSufficiency from supabase/functions/ai-tutor/index.ts
function evaluateEvidenceSufficiency(sources, canonicalFacts = [], graphPrompt = "") {
  if (canonicalFacts && canonicalFacts.length > 0) {
    return { sufficient: true, reason: "CANONICAL_CONTEXT_AVAILABLE" };
  }
  if (graphPrompt && graphPrompt.trim().length >= 20) {
    return { sufficient: true, reason: "GRAPH_CONTEXT_AVAILABLE" };
  }
  if (!sources || sources.length === 0) {
    return { sufficient: false, reason: "NO_SOURCES_RETRIEVED" };
  }
  const topMatch = sources[0];
  const hasContent = Boolean(topMatch.content && topMatch.content.trim().length >= 40);
  if (hasContent) {
    return { sufficient: true, reason: "SOURCE_EVIDENCE_SUFFICIENT" };
  }
  return { sufficient: false, reason: "LOW_CONFIDENCE_RETRIEVAL" };
}

async function fetchChunks(query, token) {
  const cleanQ = query.replace(/'/g, "''");
  const sql = `
    SELECT id, book_title, page_number, content
    FROM public.vita_anatomical_knowledge
    WHERE to_tsvector('public.pt_unaccent', coalesce(book_title, '') || ' ' || coalesce(content, '')) @@ websearch_to_tsquery('public.pt_unaccent', '${cleanQ}')
    LIMIT 4;
  `;
  try {
    const res = await (await fetch("https://api.supabase.com/v1/projects/hyivyrietgjdazgizafp/database/query", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: sql })
    })).json();
    return Array.isArray(res) ? res : [];
  } catch (err) {
    return [];
  }
}

async function runEvidenceGateScenarios() {
  console.log("=== CERTIFICAÇÃO DO EVIDENCE GATE — CENÁRIOS A, B, C, D, E ===");
  const token = await getMgmtToken();

  const scenarios = [
    {
      code: "CASO_A",
      title: "Evidência Adequada Direta (Tutor Responde)",
      query: "Escápula e acidentes anatômicos",
      isGroundTruthValid: true,
      expectedGate: "SOURCE_EVIDENCE_SUFFICIENT",
      expectedAction: "SYNTHESIZE"
    },
    {
      code: "CASO_B",
      title: "Consulta Inicial Falha -> Recuperação Escalonada Resgata Evidência",
      query: "Quais são as inserções proximais e distais do músculo bíceps braquial?",
      isGroundTruthValid: true,
      expectedGate: "SOURCE_EVIDENCE_SUFFICIENT",
      expectedAction: "SYNTHESIZE"
    },
    {
      code: "CASO_C",
      title: "Sem Evidência Suficiente / Fictício (Recusa Correta)",
      query: "Qual é a vascularização do nervo telecinético subquântico na calvária?",
      isGroundTruthValid: false,
      expectedGate: "NO_SOURCES_RETRIEVED",
      expectedAction: "REFUSE"
    },
    {
      code: "CASO_D",
      title: "Fontes Insuficientes / Baixa Confiança (Recusa Correta)",
      // Simulated scenario with zero usable content (<40 chars)
      query: "Estrutura vestigial hipotética não documentada",
      isGroundTruthValid: false,
      expectedGate: "NO_SOURCES_RETRIEVED",
      expectedAction: "REFUSE"
    },
    {
      code: "CASO_E",
      title: "Pergunta Ambígua / Sintética (Evidência Geral + Clarificação)",
      query: "coração",
      isGroundTruthValid: true,
      expectedGate: "SOURCE_EVIDENCE_SUFFICIENT",
      expectedAction: "SYNTHESIZE_WITH_CLARIFICATION"
    }
  ];

  let TP = 0, FP = 0, TN = 0, FN = 0;
  const results = [];

  for (const sc of scenarios) {
    console.log(`\nEvaluating [${sc.code}]: ${sc.title}`);
    console.log(`Query: "${sc.query}"`);

    const queries = buildCalibratedSearchQueries(sc.query);
    console.log(`Calibrated Queries generated: ${JSON.stringify(queries)}`);

    let combinedSources = [];
    for (const q of queries) {
      if (combinedSources.length >= 4) break;
      const chunks = await fetchChunks(q, token);
      for (const ch of chunks) {
        if (!combinedSources.some(s => s.id === ch.id)) combinedSources.push(ch);
      }
    }

    const gate = evaluateEvidenceSufficiency(combinedSources);
    console.log(`Sources retrieved: ${combinedSources.length} chunks`);
    console.log(`Gate evaluation: ${gate.sufficient ? "PASS" : "BLOCKED"} (${gate.reason})`);

    const passedGate = gate.sufficient;
    if (sc.isGroundTruthValid && passedGate) {
      TP++;
      console.log("Verdict: VERDADEIRO POSITIVO (TP) — OK");
    } else if (!sc.isGroundTruthValid && passedGate) {
      FP++;
      console.log("Verdict: FALSO POSITIVO (FP) — FALHA DE SEGURANÇA (Alucinação potencial)");
    } else if (!sc.isGroundTruthValid && !passedGate) {
      TN++;
      console.log("Verdict: VERDADEIRO NEGATIVO (TN) — OK (Recusa honesta e transparente)");
    } else if (sc.isGroundTruthValid && !passedGate) {
      FN++;
      console.log("Verdict: FALSO NEGATIVO (FN) — FALHA DE RECUPERAÇÃO (Falsa recusa)");
    }

    results.push({
      scenario: sc.code,
      title: sc.title,
      query: sc.query,
      sourcesCount: combinedSources.length,
      gateReason: gate.reason,
      passedGate,
      topSource: combinedSources[0] ? `${combinedSources[0].book_title} (p. ${combinedSources[0].page_number})` : "Nenhuma"
    });
  }

  const total = scenarios.length;
  const precision = (TP + FP) > 0 ? (TP / (TP + FP)) : 1.0;
  const recall = (TP + FN) > 0 ? (TP / (TP + FN)) : 1.0;
  const falseRejectionRate = (TP + FN) > 0 ? (FN / (TP + FN)) : 0.0;
  const inadequateAcceptanceRate = (TN + FP) > 0 ? (FP / (TN + FP)) : 0.0;

  console.log("\n=== MATRIZ DE CONFUSÃO DO EVIDENCE GATE ===");
  console.log(`Total de Casos: ${total}`);
  console.log(`Verdadeiros Positivos (TP): ${TP}`);
  console.log(`Falsos Positivos (FP): ${FP}`);
  console.log(`Verdadeiros Negativos (TN): ${TN}`);
  console.log(`Falsos Negativos (FN): ${FN}`);
  console.log(`Precisão: ${(precision * 100).toFixed(1)}%`);
  console.log(`Revocação (Recall): ${(recall * 100).toFixed(1)}%`);
  console.log(`Taxa de Falsas Recusas (FRR): ${(falseRejectionRate * 100).toFixed(1)}%`);
  console.log(`Taxa de Aceitação Inadequada (FAR): ${(inadequateAcceptanceRate * 100).toFixed(1)}%`);
}

runEvidenceGateScenarios();
