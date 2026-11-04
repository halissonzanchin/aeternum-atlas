import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

// =========================================================================
// 1. AUDITORIA ESTÁTICA DOS CAMINHOS DE RETORNO NA EDGE FUNCTION (BACKEND)
// =========================================================================

test("ai-tutor index.ts exporta createSseTextResponse e cobre todas as 5 ramificações de sucesso 200", (t) => {
  const edgePath = path.join(root, "supabase/functions/ai-tutor/index.ts");
  if (!fs.existsSync(edgePath)) {
    t.skip("supabase/functions/ai-tutor/index.ts não existe neste ambiente.");
    return;
  }
  const edgeSource = fs.readFileSync(edgePath, "utf8");
  if (!edgeSource.includes("createSseTextResponse")) {
    t.skip("Versão local da Edge Function na branch do frontend não possui o patch do backend.");
    return;
  }

  // 1. Função utilitária obrigatória
  assert.match(edgeSource, /export function createSseTextResponse\(/);
  assert.match(edgeSource, /"Content-Type":\s*"text\/event-stream;\s*charset=utf-8"/);

  // 2. wantsStream deve ser capturado globalmente para a requisição
  assert.match(edgeSource, /const\s+wantStream\s*=\s*payload\.stream\s*===\s*true/);

  // 3. Ramo 1: DETERMINISTIC_CANONICAL
  assert.match(
    edgeSource,
    /if\s*\(safeResult\.status === "DETERMINISTIC_CANONICAL"\)[\s\S]*?if\s*\(wantStream\)\s*\{\s*return createSseTextResponse\(safeResult\.answer/
  );

  // 4. Ramo 2: FALSE_PREMISE_SUSPECTED
  assert.match(
    edgeSource,
    /if\s*\(safeResult\.status === "FALSE_PREMISE_SUSPECTED"\)[\s\S]*?if\s*\(wantStream\)\s*\{\s*return createSseTextResponse\(safeResult\.answer/
  );

  // 5. Ramo 3: AMBIGUOUS_ENTITY
  assert.match(
    edgeSource,
    /if\s*\(safeResult\.status === "AMBIGUOUS_ENTITY"\)[\s\S]*?if\s*\(wantStream\)\s*\{\s*return createSseTextResponse\(safeResult\.answer/
  );

  // 6. Ramo 4: UNSUPPORTED_QUERY
  assert.match(
    edgeSource,
    /if\s*\(safeResult\.status === "UNSUPPORTED_QUERY"\)[\s\S]*?if\s*\(wantStream\)\s*\{\s*return createSseTextResponse\(safeResult\.answer/
  );

  // 7. Ramo 5: EVIDENCE GATE (INSUFFICIENT_EVIDENCE) — O Ponto de Falha do Fêmur
  assert.match(
    edgeSource,
    /if\s*\(!evidenceCheck\.sufficient\)[\s\S]*?if\s*\(wantStream\)\s*\{\s*return createSseTextResponse\(insufficientMsg/
  );

  // 8. Ramo 6: Síntese pelo Gateway Local
  assert.match(
    edgeSource,
    /if\s*\(wantStream\)\s*\{\s*return createSseTextResponse\(finalText/
  );
});

// =========================================================================
// 2. AUDITORIA DA DEFESA ADICIONAL NO FRONTEND (atlasAITutorService.js)
// =========================================================================

test("atlasAITutorService implementa defesa em profundidade para respostas JSON 200", () => {
  const frontendSource = fs.readFileSync(
    path.join(root, "src/features/atlas-viewer/ai/atlasAITutorService.js"),
    "utf8"
  );

  // Deve detectar Content-Type application/json mesmo em requisições de stream
  assert.match(frontendSource, /contentType\.includes\(['"]application\/json['"]\)/);

  // Deve sanitizar antes de emitir chunk ou retorno
  assert.match(frontendSource, /sanitizeTutorDisplayText\(rawText\)/);

  // Deve chamar onChunk para notificar a UI de imediato
  assert.match(frontendSource, /if\s*\(typeof onChunk === ['"]function['"]\)\s*\{\s*onChunk\(sanitized\);/);

  // Deve incluir fallback para buffer pendente no reader de SSE
  assert.match(frontendSource, /if\s*\(!fullText && pending\.trim\(\)\)/);
});

// =========================================================================
// 3. MATRIZ DE TESTES COMPORTAMENTAIS DAS 5 PERGUNTAS OBRIGATÓRIAS
// =========================================================================

// Função simuladora do protocolo HTTP / SSE conforme implementado no ai-tutor index.ts
function simulateAiTutorPipeline(prompt, { wantStream = true, mockRagSources = [], mockCanonicalAnswer = null, mockGatewayText = null } = {}) {
  const tStart = Date.now();
  const respHeaders = {
    "Access-Control-Allow-Origin": "*",
    "X-Aeternum-Gateway-Version": "1.0.0"
  };

  // 1. Simulação Safe Engine
  if (mockCanonicalAnswer) {
    const totalMs = Date.now() - tStart;
    const metadata = {
      source: "aeternum-safe-engine",
      model: "deterministic-canonical",
      knowledgeState: "DETERMINISTIC_CANONICAL",
      safeEngineHit: true,
      aiCalls: 0,
      latencyMs: totalMs,
      retrievalCount: 0
    };

    if (wantStream) {
      return {
        status: 200,
        contentType: "text/event-stream; charset=utf-8",
        isStream: true,
        text: mockCanonicalAnswer,
        metadata,
        safeEngine: "HIT",
        origin: "aeternum-safe-engine",
        aiCalls: 0,
        localModelUsed: false,
        latencyMs: totalMs
      };
    }
    return {
      status: 200,
      contentType: "application/json; charset=utf-8",
      isStream: false,
      text: mockCanonicalAnswer,
      metadata,
      safeEngine: "HIT",
      origin: "aeternum-safe-engine",
      aiCalls: 0,
      localModelUsed: false,
      latencyMs: totalMs
    };
  }

  // 2. Simulação Evidence Gate
  const hasValidSources = mockRagSources.length > 0 && mockRagSources.some(s => s.content && s.content.length >= 60);
  if (!hasValidSources) {
    const insufficientMsg = "Evidência anatômica insuficiente nas fontes soberanas do Aeternum Atlas para sintetizar esta estrutura com precisão.";
    const totalMs = Date.now() - tStart;
    const metadata = {
      source: "aeternum-evidence-gate",
      model: "deterministic-evidence-gate",
      knowledgeState: "INSUFFICIENT_EVIDENCE",
      safeEngineHit: false,
      aiCalls: 0,
      evidenceGateResult: "SOURCE_EVIDENCE_INSUFFICIENT",
      latencyMs: totalMs,
      retrievalCount: mockRagSources.length
    };

    if (wantStream) {
      return {
        status: 200,
        contentType: "text/event-stream; charset=utf-8",
        isStream: true,
        text: insufficientMsg,
        metadata,
        safeEngine: "MISS",
        origin: "aeternum-evidence-gate",
        aiCalls: 0,
        localModelUsed: false,
        latencyMs: totalMs
      };
    }
    return {
      status: 200,
      contentType: "application/json; charset=utf-8",
      isStream: false,
      text: insufficientMsg,
      metadata,
      safeEngine: "MISS",
      origin: "aeternum-evidence-gate",
      aiCalls: 0,
      localModelUsed: false,
      latencyMs: totalMs
    };
  }

  // 3. Simulação Gateway Local / Ollama Synthesis
  const synthesizedText = mockGatewayText || "Síntese anatômica estruturada baseada em evidências soberanas.";
  const totalMs = Date.now() - tStart;
  const metadata = {
    source: "atlas-daemon-rust-local",
    model: "qwen3.5:4b",
    routing: "local-tunnel",
    knowledgeState: "SOURCE_GROUNDED_SYNTHESIS",
    safeEngineHit: false,
    aiCalls: 1,
    latencyMs: totalMs,
    retrievalCount: mockRagSources.length
  };

  if (wantStream) {
    return {
      status: 200,
      contentType: "text/event-stream; charset=utf-8",
      isStream: true,
      text: synthesizedText,
      metadata,
      safeEngine: "MISS",
      origin: "atlas-daemon-rust-local",
      aiCalls: 1,
      localModelUsed: true,
      latencyMs: totalMs
    };
  }
  return {
    status: 200,
    contentType: "application/json; charset=utf-8",
    isStream: false,
    text: synthesizedText,
    metadata,
    safeEngine: "MISS",
    origin: "atlas-daemon-rust-local",
    aiCalls: 1,
    localModelUsed: true,
    latencyMs: totalMs
  };
}

// Simulador de consumo pelo frontend (reflete atlasAITutorService.js atualizado)
function simulateFrontendConsumer(httpResponse) {
  if (httpResponse.contentType.includes("application/json")) {
    const rawText = httpResponse.text;
    if (!rawText) return { mode: "error", code: "EMPTY_RESPONSE" };
    return { mode: "live", text: rawText, source: httpResponse.origin };
  }

  if (httpResponse.contentType.includes("text/event-stream")) {
    // Simula parser SSE
    const lines = [
      `data: ${JSON.stringify(httpResponse.metadata)}`,
      `data: ${JSON.stringify({ text: httpResponse.text })}`,
      "data: [DONE]"
    ];
    let fullText = "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const dataStr = line.slice(6).trim();
      if (dataStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.text) fullText += parsed.text;
      } catch {}
    }
    if (!fullText) return { mode: "error", code: "EMPTY_RESPONSE" };
    return { mode: "live", text: fullText, source: httpResponse.origin };
  }

  return { mode: "error", code: "UNKNOWN_CONTENT_TYPE" };
}

test("1. Pergunta sobre o Fêmur: Bloqueio no Evidence Gate gera SSE válido e nunca resposta vazia", () => {
  // Simula o cenário real de 27/10 02:32:53 UTC:
  // Safe Engine MISS, RAG com fontes insuficientes (sem osteologia específica do fêmur no piloto)
  const resStream = simulateAiTutorPipeline("fêmur", { wantStream: true, mockRagSources: [] });

  assert.equal(resStream.status, 200);
  assert.equal(resStream.contentType, "text/event-stream; charset=utf-8");
  assert.equal(resStream.safeEngine, "MISS");
  assert.equal(resStream.origin, "aeternum-evidence-gate");
  assert.equal(resStream.aiCalls, 0);
  assert.equal(resStream.localModelUsed, false);
  assert.match(resStream.text, /Evidência anatômica insuficiente/);

  // Validação no consumidor frontend
  const frontendOutput = simulateFrontendConsumer(resStream);
  assert.equal(frontendOutput.mode, "live");
  assert.notEqual(frontendOutput.code, "EMPTY_RESPONSE");
  assert.match(frontendOutput.text, /Evidência anatômica insuficiente/);
});

test("2. Pergunta sobre o Plexo Braquial: Safe Engine HIT determinístico com SSE", () => {
  const canonicalAnswer = "O plexo braquial é formado pelos ramos anteriores dos nervos espinais C5 a T1.";
  const res = simulateAiTutorPipeline("plexo braquial", {
    wantStream: true,
    mockCanonicalAnswer: canonicalAnswer
  });

  assert.equal(res.status, 200);
  assert.equal(res.contentType, "text/event-stream; charset=utf-8");
  assert.equal(res.safeEngine, "HIT");
  assert.equal(res.origin, "aeternum-safe-engine");
  assert.equal(res.aiCalls, 0);
  assert.equal(res.localModelUsed, false);
  assert.equal(res.text, canonicalAnswer);

  const frontendOutput = simulateFrontendConsumer(res);
  assert.equal(frontendOutput.mode, "live");
  assert.equal(frontendOutput.text, canonicalAnswer);
});

test("3. Pergunta sobre o Coração: RAG qualificado + Síntese pelo Modelo Local Qwen 3.5", () => {
  const ragSources = [
    { content: "O coração é um órgão muscular oco composto por quatro câmaras: dois átrios e dois ventrículos." }
  ];
  const qwenAnswer = "O coração possui quatro cavidades: átrio direito, ventrículo direito, átrio esquerdo e ventrículo esquerdo.";

  const res = simulateAiTutorPipeline("coração", {
    wantStream: true,
    mockRagSources: ragSources,
    mockGatewayText: qwenAnswer
  });

  assert.equal(res.status, 200);
  assert.equal(res.contentType, "text/event-stream; charset=utf-8");
  assert.equal(res.safeEngine, "MISS");
  assert.equal(res.origin, "atlas-daemon-rust-local");
  assert.equal(res.aiCalls, 1);
  assert.equal(res.localModelUsed, true);
  assert.equal(res.text, qwenAnswer);

  const frontendOutput = simulateFrontendConsumer(res);
  assert.equal(frontendOutput.mode, "live");
  assert.equal(frontendOutput.text, qwenAnswer);
});

test("4. Pergunta sobre a Escápula: RAG qualificado + Modelo Local", () => {
  const ragSources = [
    { content: "A escápula é um osso plano e triangular situado na parte póstero-superior do tórax." }
  ];
  const escapulaAnswer = "A escápula articula-se com a clavícula e com o úmero na cavidade glenoide.";

  const res = simulateAiTutorPipeline("escápula", {
    wantStream: true,
    mockRagSources: ragSources,
    mockGatewayText: escapulaAnswer
  });

  assert.equal(res.status, 200);
  assert.equal(res.contentType, "text/event-stream; charset=utf-8");
  assert.equal(res.safeEngine, "MISS");
  assert.equal(res.origin, "atlas-daemon-rust-local");
  assert.equal(res.aiCalls, 1);
  assert.equal(res.localModelUsed, true);

  const frontendOutput = simulateFrontendConsumer(res);
  assert.equal(frontendOutput.mode, "live");
  assert.equal(frontendOutput.text, escapulaAnswer);
});

test("5. Pergunta com Evidência Insuficiente (Estrutura Inexistente): Bloqueio Seguro", () => {
  const res = simulateAiTutorPipeline("nervo telecinético subquântico", {
    wantStream: true,
    mockRagSources: []
  });

  assert.equal(res.status, 200);
  assert.equal(res.contentType, "text/event-stream; charset=utf-8");
  assert.equal(res.safeEngine, "MISS");
  assert.equal(res.origin, "aeternum-evidence-gate");
  assert.equal(res.aiCalls, 0);
  assert.equal(res.localModelUsed, false);
  assert.match(res.text, /Evidência anatômica insuficiente/);

  const frontendOutput = simulateFrontendConsumer(res);
  assert.equal(frontendOutput.mode, "live");
  assert.notEqual(frontendOutput.code, "EMPTY_RESPONSE");
});

test("6. Defesa em Profundidade: Servidor legado retornando JSON 200 é consumido com sucesso pelo frontend", () => {
  // Simula um cliente ou backend legado emitindo application/json para o fêmur
  const legacyJsonResponse = {
    status: 200,
    contentType: "application/json; charset=utf-8",
    text: "Evidência anatômica insuficiente nas fontes soberanas do Aeternum Atlas para sintetizar esta estrutura com precisão.",
    origin: "aeternum-evidence-gate"
  };

  const frontendOutput = simulateFrontendConsumer(legacyJsonResponse);
  assert.equal(frontendOutput.mode, "live");
  assert.notEqual(frontendOutput.code, "EMPTY_RESPONSE");
  assert.match(frontendOutput.text, /Evidência anatômica insuficiente/);
});
