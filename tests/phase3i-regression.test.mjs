import assert from "node:assert/strict";
import { test, expect } from "vitest";
import {
  handleAiTutorRequest,
  buildSynthesisPrompt,
  validateResponseContent,
  extractSearchTerms,
  evaluateEvidenceSufficiency,
  sanitizeAssistantContent
} from "../supabase/functions/ai-tutor/index.ts";
import { SafeEngine } from "../supabase/functions/ai-tutor/safe-engine/core/safeEngine.ts";
import { AtlasDaemonLLMProvider } from "../packages/aeternum-vita/src/providers/local/atlas-daemon/AtlasDaemonLLMProvider.ts";
import { ProviderInvalidResponseError } from "../packages/aeternum-vita/src/providers/types/index.ts";
import http from "node:http";

test("1. CASO 1: Never Leak Thinking — Provider lança ProviderInvalidResponseError se apenas thinking_chunk for gerado", async () => {
  let mockPort = 15100 + Math.floor(Math.random() * 500);
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", `http://127.0.0.1:${mockPort}`);
    if (req.method === "POST" && url.pathname === "/v1/tasks") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ task_id: "task_test_thinking_only", status: "running" }));
      return;
    }
    if (req.method === "GET" && url.pathname.includes("/stream")) {
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      res.write(`data: ${JSON.stringify({ seq: 1, chunk_type: "thinking_chunk", content: "Thinking: Let's consider scapula morphology...", done: false })}\n\n`);
      res.write(`data: ${JSON.stringify({ seq: 2, chunk_type: "thinking_chunk", content: " Draft reasoning in progress.", done: false })}\n\n`);
      res.write(`data: ${JSON.stringify({ seq: 3, chunk_type: "completed", content: "", done: true })}\n\n`);
      res.end();
      return;
    }
  });

  await new Promise((resolve) => server.listen(mockPort, resolve));

  const provider = new AtlasDaemonLLMProvider({
    daemonBaseUrl: `http://127.0.0.1:${mockPort}`,
    authToken: "token_mock_test"
  });

  try {
    await assert.rejects(
      async () => {
        await provider.generate({
          messages: [{ role: "user", content: "Pergunta de anatomia" }]
        });
      },
      (err) => {
        assert.ok(err instanceof ProviderInvalidResponseError);
        assert.ok(err.message.includes("apenas raciocínio interno ou saída vazia") || err.message.includes("tokens de resposta válidos"));
        return true;
      },
      "Deve rejeitar com ProviderInvalidResponseError quando apenas thinking_chunk existir"
    );
  } finally {
    server.close();
  }
});

test("2. CASO 2: Final Answer Only — thinking_chunk é suprimido e apenas token_chunk chega à resposta", async () => {
  let mockPort = 15100 + Math.floor(Math.random() * 500);
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", `http://127.0.0.1:${mockPort}`);
    if (req.method === "POST" && url.pathname === "/v1/tasks") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ task_id: "task_test_clean_answer", status: "running" }));
      return;
    }
    if (req.method === "GET" && url.pathname.includes("/stream")) {
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      res.write(`data: ${JSON.stringify({ seq: 1, chunk_type: "thinking_chunk", content: "Thinking: I will answer about deltoid.", done: false })}\n\n`);
      res.write(`data: ${JSON.stringify({ seq: 2, chunk_type: "token_chunk", content: "A escápula é um osso plano e triangular.", done: false })}\n\n`);
      res.write(`data: ${JSON.stringify({ seq: 3, chunk_type: "completed", content: "", done: true })}\n\n`);
      res.end();
      return;
    }
  });

  await new Promise((resolve) => server.listen(mockPort, resolve));

  const provider = new AtlasDaemonLLMProvider({
    daemonBaseUrl: `http://127.0.0.1:${mockPort}`,
    authToken: "token_mock_test"
  });

  try {
    const res = await provider.generate({
      messages: [{ role: "user", content: "Descreva a escápula" }]
    });

    assert.equal(res.text, "A escápula é um osso plano e triangular.");
    assert.equal(res.text.includes("Thinking"), false, "Nenhum fragmento de thinking deve constar no texto");
  } finally {
    server.close();
  }
});

test("3. CASO 3: Draft Rejection — Validator rejeita respostas com planejamento, rascunhos ou marcadores de raciocínio", () => {
  const badSamples = [
    "<think>Analise do plexo braquial</think> O plexo braquial inerva o membro superior.",
    "Thinking Process: First let's review C5-T1 roots. The brachial plexus is formed by...",
    "Thought: The user wants Spanish answer. Let me draft it.",
    "Wait, looking back at the insertion, the deltoid inserts into the humerus.",
    "Draft: This is a preliminary draft before the final student answer.",
    "Planning: 1. Explain origin. 2. Explain insertion.",
    "The user is asking me to explain the larynx cartilage.",
    "First, I should examine the thyroid cartilage.",
    "=== DIRETRIZES DO SISTEMA ===\nResposta vazada.",
    "/no_think Resposta com marker vazado."
  ];

  for (const sample of badSamples) {
    const validation = validateResponseContent(sample, [], []);
    assert.equal(validation.valid, false, `Amostra '${sample.slice(0, 30)}...' deveria ser rejeitada`);
    assert.equal(validation.status, "RESPONSE_VALIDATION_FAILED");
    assert.equal(validation.reason, "INTERNAL_REASONING_LEAK_PREVENTED");
  }

  // Validação positiva: resposta limpa deve passar
  const cleanAnswer = "O músculo deltoide se insere distalmente na tuberosidade deltoidea da diáfise umeral.";
  const validResult = validateResponseContent(cleanAnswer, [], []);
  assert.equal(validResult.valid, true);
  assert.equal(validResult.status, "VALIDATED");
});

test("4. CASO 4: Spanish Output Enforcement — language=es força estritamente o idioma espanhol no prompt de síntese", () => {
  const promptES = buildSynthesisPrompt(
    "Quais são os ramos do plexo braquial?", // Pergunta enviada em PT
    "student",
    [],
    [],
    "Halisson",
    "es",
    {}
  );

  assert.ok(promptES.includes("IDIOMA OBRIGATÓRIO: ESPANHOL (ES)"), "Deve declarar IDIOMA OBRIGATÓRIO: ESPANHOL (ES)");
  assert.ok(promptES.includes("espanhol claro, direto e academicamente rigoroso"), "Deve instruir espanhol claro e rigoroso");
  assert.ok(promptES.includes("mesmo que a pergunta do usuário tenha sido redigida em português"), "Deve forçar ES mesmo com pergunta em PT");
  assert.ok(promptES.includes("REGRA ABSOLUTA DE NÃO-EXPOSIÇÃO"), "Deve incluir regra absoluta anti-raciocínio");
});

test("5. CASO 5: Portuguese Output Enforcement — language=pt força estritamente o idioma português", () => {
  const promptPT = buildSynthesisPrompt(
    "¿Cuáles son los cartílagos de la laringe?",
    "student",
    [],
    [],
    "Halisson",
    "pt",
    {}
  );

  assert.ok(promptPT.includes("IDIOMA OBRIGATÓRIO: PORTUGUÊS (PT-BR)"), "Deve declarar IDIOMA OBRIGATÓRIO: PORTUGUÊS (PT-BR)");
  assert.ok(promptPT.includes("português claro, direto e academicamente rigoroso"), "Deve instruir português claro");
});

test("6. CASO 6: Brachial Plexus Retrieval & Stopwords — Stopwords em espanhol e português filtradas com precisão", () => {
  // Teste em espanhol com stopwords típicas
  const termsES = extractSearchTerms("¿Cuáles son los ramos del plexo braquial según el Latarjet?");
  assert.deepEqual(termsES, ["ramos", "plexo", "braquial", "latarjet"]);

  // Teste em português
  const termsPT = extractSearchTerms("Explique detalhadamente sobre a inervação do músculo deltoide");
  assert.deepEqual(termsPT, ["inervacao", "musculo", "deltoide"]);
});

test("7. CASO 7: Canonical Facts in Prompt — SafeEngine resolve IDs para proposições completas e fontes bibliográficas", () => {
  const safeEngine = new SafeEngine();

  // Fato real da escápula existente na memória canônica
  const factId = "AET-CF-SCAP-001";
  const resolved = safeEngine.resolveFactText(factId);

  assert.ok(resolved, "SafeEngine deve resolver o fato canônico");
  assert.equal(resolved.canonical_fact_id, "AET-CF-SCAP-001");
  assert.ok(resolved.proposition.includes("cintura escapular") || resolved.proposition.includes("pectoral_girdle"), "Proposição deve conter o conteúdo anatômico canônico");
  assert.ok(resolved.source.includes("LATARJET") || resolved.source.includes("NIELSEN") || resolved.source.includes("Aeternum"), "Deve citar a fonte soberana");

  // Testa se entra no buildSynthesisPrompt formatado com riqueza
  const promptWithFact = buildSynthesisPrompt(
    "Fale sobre a escápula",
    "student",
    [resolved],
    [],
    "Halisson",
    "pt",
    {}
  );

  assert.ok(promptWithFact.includes("=== MEMÓRIA CANÔNICA SOBERANA (AUTORIDADE MÁXIMA) ==="));
  assert.ok(promptWithFact.includes("[Fato Canônico 1] AET-CF-SCAP-001"));
  assert.ok(promptWithFact.includes(resolved.proposition));
  assert.ok(!promptWithFact.includes("[Fato Canônico 1] : undefined"), "Jamais deve produzir : undefined no prompt");
});

test("8. CASO 8: Insufficient Evidence Safety Gate — Rejeita fontes muito curtas ou sem marcadores anatômicos", () => {
  // Caso 1: Sem fontes e sem memória canônica
  const emptyCheck = evaluateEvidenceSufficiency([], []);
  assert.equal(emptyCheck.sufficient, false);
  assert.equal(emptyCheck.reason, "NO_SOURCES_RETRIEVED");

  // Caso 2: Fonte curta (< 60 caracteres)
  const shortSource = [{ id: "s1", content: "Apenas um texto curto de teste." }];
  const shortCheck = evaluateEvidenceSufficiency(shortSource, []);
  assert.equal(shortCheck.sufficient, false);
  assert.equal(shortCheck.reason, "INSUFFICIENT_CONTENT_LENGTH");

  // Caso 3: Fonte longa mas sem marcadores anatômicos (ex: sumário genérico)
  const nonAnatomicalSource = [{
    id: "s2",
    content: "Prefácio à quinta edição do livro institucional publicado em dois mil e vinte e quatro por uma equipe multidisciplinar de autores acadêmicos."
  }];
  const nonAnatCheck = evaluateEvidenceSufficiency(nonAnatomicalSource, []);
  assert.equal(nonAnatCheck.sufficient, false);
  assert.equal(nonAnatCheck.reason, "NO_ANATOMICAL_MARKERS_IN_TOP_SOURCE");

  // Caso 4: Fonte com conteúdo anatômico qualificado
  const validSource = [{
    id: "s3",
    content: "O músculo deltoide se origina na clavícula, acrômio e espinha da escápula, inserindo-se na tuberosidade deltoidea do úmero."
  }];
  const validCheck = evaluateEvidenceSufficiency(validSource, []);
  assert.equal(validCheck.sufficient, true);
  assert.equal(validCheck.reason, "SOURCE_EVIDENCE_SUFFICIENT");
});

test("9. CASO 9: Sanitização de Conteúdo — sanitizeAssistantContent expurga tags residuais de raciocínio", () => {
  const rawResponse = "<think>Planejando resposta interna...</think>O nervo axilar inerva o músculo deltoide e o redondo menor.[ACTION:NAVIGATE]";
  const sanitized = sanitizeAssistantContent(rawResponse);

  assert.equal(sanitized, "O nervo axilar inerva o músculo deltoide e o redondo menor.");
  assert.ok(!sanitized.includes("<think>"));
  assert.ok(!sanitized.includes("Planejando"));
  assert.ok(!sanitized.includes("[ACTION"));
});

test("10. CASO 10: Roteamento Canário Seguro & Política fail_closed Preservada", async () => {
  const canaryUuid = "uuid-halisson-canary-authorized-001";
  const generalStudentUuid = "uuid-student-general-999";

  const createMockDb = (id) => ({
    auth: { async getUser() { return { data: { user: { id } }, error: null }; } },
    from() {
      return { select() { return { eq() { return { async maybeSingle() {
        return { data: { id, institution_id: "inst-001", role: "student", status: "active", name: "Estudante" }, error: null };
      } }; } }; } };
    },
    async rpc(fn) {
      if (fn === "consume_ai_rate_limit") return { data: [{ allowed: true, retry_after_seconds: 0 }], error: null };
      if (fn === "match_vita_sovereign_knowledge") return {
        data: [{
          id: "src-1", book_title: "Latarjet", page_number: 10,
          content: "O plexo braquial é formado pelos ramos anteriores de C5 a T1, inervando o membro superior através de seus troncos e fascículos.", lexical_rank: 0.95
        }], error: null
      };
      return { data: [], error: null };
    }
  });

  // 10.1 Estudante Geral com IA Local ativa na env -> DEVE ir para a nuvem porque não está na allowlist
  let cloudCalledForGeneral = false;
  let localCalledForGeneral = false;
  const mockFetchGeneral = async (url) => {
    const s = String(url);
    if (s.includes("generativelanguage.googleapis.com") || s.includes("gateway.aeternumatlas.com")) {
      cloudCalledForGeneral = true;
      return new Response(JSON.stringify({
        data: { text: "Resposta da nuvem para aluno geral.", providerId: "gemini-llm-cloud", modelId: "gemini-2.5-flash" }
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (s.includes("atlas-code.aeternumatlas.com")) {
      localCalledForGeneral = true;
      return new Response(JSON.stringify({ text: "Resposta local indevida" }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
  };

  const reqGeneral = new Request("https://hyivyrietgjdazgizafp.supabase.co/functions/v1/ai-tutor", {
    method: "POST",
    headers: {
      "Authorization": "Bearer fake_token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt: "Explique a formação clínica dos troncos e fascículos do plexo braquial na axila." })
  });

  const resGeneral = await handleAiTutorRequest(reqGeneral, {
    createClient: () => createMockDb(generalStudentUuid),
    fetchFn: mockFetchGeneral,
    env: {
      AETERNUM_AI_GATEWAY_URL: "https://gateway.aeternumatlas.com",
      AETERNUM_AI_GATEWAY_TOKEN: "fake_gateway_token",
      ATLAS_LOCAL_AI_ENABLED: "true",
      ATLAS_LOCAL_AI_ALLOWLIST_UUIDS: canaryUuid, // Apenas canário
      ATLAS_LOCAL_GATEWAY_URL: "https://atlas-code.aeternumatlas.com",
      GEMINI_API_KEY: "fake_gemini_key",
      SUPABASE_URL: "https://hyivyrietgjdazgizafp.supabase.co",
      SUPABASE_ANON_KEY: "fake_anon_key",
      SUPABASE_SERVICE_ROLE_KEY: "fake_srk"
    }
  });

  assert.equal(resGeneral.status, 200);
  assert.equal(localCalledForGeneral, false, "Estudante geral JAMAIS deve ser roteado para o túnel local");
  assert.equal(cloudCalledForGeneral, true, "Estudante geral deve usar a nuvem");

  // 10.2 Canário com erro local em fail_closed -> Retorna 503 sem chamar Gemini
  let geminiCalledForCanary = false;
  const mockFetchCanaryFail = async (url) => {
    const s = String(url);
    if (s.includes("generativelanguage.googleapis.com")) {
      geminiCalledForCanary = true;
      return new Response(JSON.stringify({}), { status: 200 });
    }
    if (s.includes("atlas-code.aeternumatlas.com")) {
      return new Response(JSON.stringify({ error: "Gateway down" }), { status: 503 });
    }
    return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
  };

  const reqCanary = new Request("https://hyivyrietgjdazgizafp.supabase.co/functions/v1/ai-tutor", {
    method: "POST",
    headers: {
      "Authorization": "Bearer fake_token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt: "Explique a formação clínica dos troncos e fascículos do plexo braquial na axila." })
  });

  const resCanary = await handleAiTutorRequest(reqCanary, {
    createClient: () => createMockDb(canaryUuid),
    fetchFn: mockFetchCanaryFail,
    env: {
      ATLAS_LOCAL_AI_ENABLED: "true",
      ATLAS_LOCAL_AI_ALLOWLIST_UUIDS: canaryUuid,
      ATLAS_LOCAL_GATEWAY_URL: "https://atlas-code.aeternumatlas.com",
      ATLAS_LOCAL_AI_FALLBACK_POLICY: "fail_closed",
      GEMINI_API_KEY: "fake_gemini_key",
      SUPABASE_URL: "https://hyivyrietgjdazgizafp.supabase.co",
      SUPABASE_ANON_KEY: "fake_anon_key",
      SUPABASE_SERVICE_ROLE_KEY: "fake_srk"
    }
  });

  assert.equal(resCanary.status, 503, "Canário em fail_closed deve retornar 503 em caso de falha local");
  assert.equal(geminiCalledForCanary, false, "Jamais deve chamar Gemini pago para o canário em fail_closed");
});
