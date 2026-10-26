import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { handleAiTutorRequest, buildSynthesisPrompt } from "../supabase/functions/ai-tutor/index.ts";

function createMockSupabaseFactory(userId = "uuid-halisson-hp-victus-001") {
  return () => ({
    auth: {
      async getUser() {
        return { data: { user: { id: userId } }, error: null };
      }
    },
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return {
                    data: {
                      id: userId,
                      institution_id: "inst-aeternum-001",
                      role: "student",
                      status: "active",
                      name: "Halisson"
                    },
                    error: null
                  };
                }
              };
            }
          };
        }
      };
    },
    async rpc(fnName) {
      if (fnName === "consume_ai_rate_limit") {
        return { data: [{ allowed: true, retry_after_seconds: 0 }], error: null };
      }
      if (fnName === "match_vita_sovereign_knowledge") {
        return {
          data: [
            {
              id: "src-latarjet-001",
              book_title: "Latarjet & Ruiz Liard — Anatomia Humana",
              page_number: 512,
              content:
                "O plexo braquial é formado pelo entrelaçamento dos ramos anteriores dos quatro últimos nervos cervicais (C5, C6, C7 e C8) e do primeiro nervo torácico (T1), assegurando a inervação sensitiva e motora do membro superior.",
              lexical_rank: 0.96,
              retrieval_stage: 1,
              metadata: { chapter: "Inervação do Membro Superior" }
            }
          ],
          error: null
        };
      }
      return { data: [], error: null };
    }
  });
}

test("1. Edge Function Contrato: Invariante de Segurança e Posicionamento do Safe Engine e Evidence Gate", () => {
  const content = fs.readFileSync("supabase/functions/ai-tutor/index.ts", "utf8");

  const safeEnginePos = content.indexOf("safeEngine.query(");
  const ragPos = content.indexOf("retrieveKnowledge(");
  const evidenceGatePos = content.indexOf("evaluateEvidenceSufficiency(");
  const localRoutingPos = content.indexOf("routeToLocalAI");
  const localGatewayCallPos = content.indexOf("Chamada prioritária ao Gateway Local no HP Victus");

  assert.ok(safeEnginePos !== -1, "Safe Engine deve existir no pipeline");
  assert.ok(ragPos !== -1, "RAG / Evidence Gate deve existir no pipeline");
  assert.ok(evidenceGatePos !== -1, "Evidence Gate deve existir no pipeline");
  assert.ok(localRoutingPos !== -1, "Decisão de roteamento de IA Local deve existir");
  assert.ok(localGatewayCallPos !== -1, "Chamada ao gateway local deve existir");

  assert.ok(
    safeEnginePos < localRoutingPos,
    "Safe Engine (Camadas 1 e 2) DEVE rodar antes do roteamento local"
  );
  assert.ok(
    ragPos < localRoutingPos,
    "Evidence Gate (Camada 4) DEVE rodar antes do roteamento local"
  );
});

test("2. Edge Function Contrato: Feature Flag e Allowlist de UUIDs", () => {
  const content = fs.readFileSync("supabase/functions/ai-tutor/index.ts", "utf8");

  assert.ok(content.includes("ATLAS_LOCAL_AI_ENABLED"), "Deve declarar env ATLAS_LOCAL_AI_ENABLED");
  assert.ok(content.includes("ATLAS_LOCAL_AI_ALLOWLIST_UUIDS"), "Deve declarar env ATLAS_LOCAL_AI_ALLOWLIST_UUIDS");
  assert.ok(content.includes("ATLAS_LOCAL_GATEWAY_URL"), "Deve declarar env ATLAS_LOCAL_GATEWAY_URL");
  assert.ok(content.includes("CF_ACCESS_CLIENT_ID"), "Deve declarar env CF_ACCESS_CLIENT_ID");
  assert.ok(content.includes("CF_ACCESS_CLIENT_SECRET"), "Deve declarar env CF_ACCESS_CLIENT_SECRET");

  assert.ok(
    content.includes("const isUserInAllowlist = localAIEnabled && Boolean(userId) && localAllowlist.includes(userId);"),
    "Deve validar que o usuário autenticado está explicitamente na allowlist de UUIDs"
  );
});

test("3. Edge Function Contrato: Injeção de Headers Cloudflare Access Service Auth", () => {
  const content = fs.readFileSync("supabase/functions/ai-tutor/index.ts", "utf8");

  assert.ok(
    content.includes('localHeaders["CF-Access-Client-Id"] = cfClientId;'),
    "Deve injetar header CF-Access-Client-Id na chamada do túnel"
  );
  assert.ok(
    content.includes('localHeaders["CF-Access-Client-Secret"] = cfClientSecret;'),
    "Deve injetar header CF-Access-Client-Secret na chamada do túnel"
  );
});

test("4. Edge Function Contrato: Telemetria Fiel e Não-Mascaramento de Provedor em Caso de Fallback", () => {
  const content = fs.readFileSync("supabase/functions/ai-tutor/index.ts", "utf8");

  assert.ok(content.includes('"X-Aeternum-AI-Routing": targetRouting'), "Header X-Aeternum-AI-Routing obrigatório");
  assert.ok(content.includes('"X-Aeternum-AI-Fallback": String(gatewayResult.fallbackUsed ?? false)'), "Header X-Aeternum-AI-Fallback obrigatório");
  assert.ok(content.includes('"X-Aeternum-AI-Fallback-Reason": gatewayResult.fallbackReason'), "Header X-Aeternum-AI-Fallback-Reason obrigatório quando houver fallback");

  assert.ok(
    content.includes('primaryProvider: "atlas-daemon-rust-local"'),
    "Deve registrar atlas-daemon-rust-local como primaryProvider no fallback"
  );
  assert.ok(
    content.includes("fallbackReason: `LOCAL_AI_FALLBACK: ${localFailReason}`"),
    "Deve registrar explicitamente o motivo da falha local no fallback"
  );
});

test("5. Simulação de Comportamento de Roteamento: Usuário Autorizado vs Não-Autorizado", () => {
  const allowlist = ["uuid-halisson-hp-victus-001", "uuid-med-student-002"];
  const localGatewayUrl = "https://atlas-code.aeternumatlas.com";

  function simulateRouting(userId, localEnabled, gatewayUrl, localUrl) {
    const isUserInAllowlist = localEnabled && Boolean(userId) && allowlist.includes(userId);
    const routeToLocalAI = isUserInAllowlist && Boolean(localUrl);
    return {
      target: routeToLocalAI ? "local-tunnel" : "cloud",
      targetUrl: routeToLocalAI ? localUrl : gatewayUrl
    };
  }

  const r1 = simulateRouting("uuid-halisson-hp-victus-001", true, "https://cloud-gateway.render.com", localGatewayUrl);
  assert.equal(r1.target, "local-tunnel");
  assert.equal(r1.targetUrl, localGatewayUrl);

  const r2 = simulateRouting("uuid-unknown-user-999", true, "https://cloud-gateway.render.com", localGatewayUrl);
  assert.equal(r2.target, "cloud");
  assert.equal(r2.targetUrl, "https://cloud-gateway.render.com");

  const r3 = simulateRouting("uuid-halisson-hp-victus-001", false, "https://cloud-gateway.render.com", localGatewayUrl);
  assert.equal(r3.target, "cloud");
  assert.equal(r3.targetUrl, "https://cloud-gateway.render.com");
});

test("6. Execução Real handleAiTutorRequest (local-tunnel + SSE Streaming + PT/ES + Zero PII)", async () => {
  let capturedGatewayCall = null;
  const mockFetch = async (url, init) => {
    capturedGatewayCall = { url: String(url), headers: init.headers, body: JSON.parse(init.body) };
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          text: "El plexo braquial está formado por los ramos anteriores de C5 a T1 e inerva el miembro superior.",
          providerId: "atlas-daemon-rust-local",
          modelId: "qwen3.5:4b"
        },
        metadata: {
          finalProvider: "atlas-daemon-rust-local",
          fallbackUsed: false,
          attemptCount: 1
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  const req = new Request("https://supabase.aeternumatlas.com/functions/v1/ai-tutor", {
    method: "POST",
    headers: {
      Origin: "https://www.aeternumatlas.com",
      Authorization: "Bearer valid-student-jwt-token",
      Accept: "text/event-stream",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Explique detalhadamente a formação clínica dos troncos e fascículos na axila." }],
      context: { language: "es", source: "viewer-3d" },
      stream: true
    })
  });

  const res = await handleAiTutorRequest(req, {
    env: {
      SUPABASE_URL: "https://mock.supabase.co",
      SUPABASE_ANON_KEY: "anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      ATLAS_LOCAL_AI_ENABLED: "true",
      ATLAS_LOCAL_AI_ALLOWLIST_UUIDS: "uuid-halisson-hp-victus-001",
      ATLAS_LOCAL_GATEWAY_URL: "https://atlas-code.aeternumatlas.com",
      ATLAS_LOCAL_GATEWAY_TOKEN: "independent-gateway-bearer-secret",
      CF_ACCESS_CLIENT_ID: "real-client-id-123456.access",
      CF_ACCESS_CLIENT_SECRET: "real-client-secret-abcdef"
    },
    createClient: createMockSupabaseFactory("uuid-halisson-hp-victus-001"),
    fetchFn: mockFetch
  });

  assert.equal(res.status, 200);
  assert.equal(res.headers.get("X-Aeternum-AI-Routing"), "local-tunnel");
  assert.equal(res.headers.get("X-Aeternum-AI-Source"), "atlas-daemon-rust-local");
  assert.equal(res.headers.get("X-Aeternum-AI-Model"), "qwen3.5:4b");
  assert.equal(res.headers.get("X-Aeternum-AI-Fallback"), "false");

  assert.ok(capturedGatewayCall, "O Gateway local deve ter sido chamado");
  assert.equal(capturedGatewayCall.url, "https://atlas-code.aeternumatlas.com/v1/llm/generate");
  assert.equal(capturedGatewayCall.headers["CF-Access-Client-Id"], "real-client-id-123456.access");
  assert.equal(capturedGatewayCall.headers["CF-Access-Client-Secret"], "real-client-secret-abcdef");
  assert.equal(capturedGatewayCall.headers["Authorization"], "Bearer independent-gateway-bearer-secret");
  assert.equal(capturedGatewayCall.body.metadata.user_id, undefined, "Não deve enviar user_id (PII) ao Gateway");
  assert.equal(capturedGatewayCall.body.metadata.language, "es");
  assert.ok(capturedGatewayCall.body.systemInstruction.includes("espanhol claro"), "Deve instruir resposta em espanhol quando language=es");

  const sseBody = await res.text();
  assert.ok(sseBody.includes("data: [DONE]"), "Stream SSE deve encerrar com [DONE]");
  assert.ok(sseBody.includes("plexo braquial"), "Stream SSE deve conter o texto sintetizado pelo provedor local");
});

test("7. Política Explícita de Indisponibilidade (Default fail_closed): Não aciona provedor pago terceiro silenciosamente", async () => {
  let geminiCalled = false;
  const mockFetch = async (url) => {
    if (String(url).includes("generativelanguage.googleapis.com")) {
      geminiCalled = true;
      return new Response("{}", { status: 200 });
    }
    // Simula fila cheia (429 QUEUE_FULL) no Gateway local
    return new Response(JSON.stringify({ error: { code: "queue_full" } }), { status: 429 });
  };

  const req = new Request("https://supabase.aeternumatlas.com/functions/v1/ai-tutor", {
    method: "POST",
    headers: {
      Origin: "https://www.aeternumatlas.com",
      Authorization: "Bearer valid-student-jwt-token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Explique detalhadamente a formação clínica dos troncos e fascículos na axila." }]
    })
  });

  const res = await handleAiTutorRequest(req, {
    env: {
      SUPABASE_URL: "https://mock.supabase.co",
      SUPABASE_ANON_KEY: "anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      GEMINI_API_KEY: "paid-gemini-api-key",
      ATLAS_LOCAL_AI_ENABLED: "true",
      ATLAS_LOCAL_AI_ALLOWLIST_UUIDS: "uuid-halisson-hp-victus-001",
      ATLAS_LOCAL_GATEWAY_URL: "https://atlas-code.aeternumatlas.com",
      ATLAS_LOCAL_GATEWAY_TOKEN: "independent-gateway-bearer-secret",
      CF_ACCESS_CLIENT_ID: "real-client-id-123456.access",
      CF_ACCESS_CLIENT_SECRET: "real-client-secret-abcdef"
    },
    createClient: createMockSupabaseFactory("uuid-halisson-hp-victus-001"),
    fetchFn: mockFetch
  });

  assert.equal(geminiCalled, false, "NÃO deve acionar Gemini pago como fallback silencioso por padrão");
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("X-Aeternum-AI-Routing"), "local-tunnel");
  assert.equal(res.headers.get("X-Aeternum-AI-Fallback"), "false");
  const errBody = await res.json();
  assert.equal(errBody.code, "LOCAL_AI_QUEUE_FULL");
  assert.equal(errBody.canonicalReason, "GATEWAY_QUEUE_FULL");
});

test("8. Cancelamento / Desconexão do Estudante: Interrompe chamada sem retry nem fallback", async () => {
  const abortController = new AbortController();
  abortController.abort();

  let fetchCalls = 0;
  const mockFetch = async () => {
    fetchCalls++;
    return new Response("{}", { status: 200 });
  };

  const req = new Request("https://supabase.aeternumatlas.com/functions/v1/ai-tutor", {
    method: "POST",
    headers: {
      Origin: "https://www.aeternumatlas.com",
      Authorization: "Bearer valid-student-jwt-token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Explique detalhadamente a formação clínica dos troncos e fascículos na axila." }]
    }),
    signal: abortController.signal
  });

  const res = await handleAiTutorRequest(req, {
    env: {
      SUPABASE_URL: "https://mock.supabase.co",
      SUPABASE_ANON_KEY: "anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      ATLAS_LOCAL_AI_ENABLED: "true",
      ATLAS_LOCAL_AI_ALLOWLIST_UUIDS: "uuid-halisson-hp-victus-001",
      ATLAS_LOCAL_GATEWAY_URL: "https://atlas-code.aeternumatlas.com",
      ATLAS_LOCAL_GATEWAY_TOKEN: "independent-gateway-bearer-secret"
    },
    createClient: createMockSupabaseFactory("uuid-halisson-hp-victus-001"),
    fetchFn: mockFetch
  });

  assert.equal(fetchCalls, 0, "Não deve disparar fetch ao Gateway se o estudante já desconectou");
  assert.equal(res.status, 499);
  const body = await res.json();
  assert.equal(body.code, "REQUEST_CANCELLED");
});

test("9. Precedência Não-Negociável: fail_closed sobrepõe explicitamente variável legada allow_cloud_fallback=true", async () => {
  let geminiCalled = false;
  let gatewayCalled = false;

  const mockFetch = async (url) => {
    if (String(url).includes("generativelanguage.googleapis.com")) {
      geminiCalled = true;
      return new Response("{}", { status: 200 });
    }
    gatewayCalled = true;
    // Simula erro de conexão (503) no Gateway local
    return new Response(JSON.stringify({ error: { code: "provider_unavailable" } }), { status: 503 });
  };

  const req = new Request("https://supabase.aeternumatlas.com/functions/v1/ai-tutor", {
    method: "POST",
    headers: {
      Origin: "https://www.aeternumatlas.com",
      Authorization: "Bearer valid-student-jwt-token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Explique a formação anatômica do plexo braquial." }]
    })
  });

  const res = await handleAiTutorRequest(req, {
    env: {
      SUPABASE_URL: "https://mock.supabase.co",
      SUPABASE_ANON_KEY: "anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      GEMINI_API_KEY: "paid-gemini-api-key",
      ATLAS_LOCAL_AI_ENABLED: "true",
      ATLAS_LOCAL_AI_ALLOWLIST_UUIDS: "uuid-halisson-hp-victus-001",
      ATLAS_LOCAL_GATEWAY_URL: "https://atlas-code.aeternumatlas.com",
      ATLAS_LOCAL_GATEWAY_TOKEN: "independent-gateway-bearer-secret",
      CF_ACCESS_CLIENT_ID: "real-client-id-123456.access",
      CF_ACCESS_CLIENT_SECRET: "real-client-secret-abcdef",
      // ADVERSARIAL: Legado tenta liberar cloud_fallback, mas a política explícita é fail_closed!
      ATLAS_LOCAL_AI_ALLOW_CLOUD_FALLBACK: "true",
      ATLAS_LOCAL_AI_FALLBACK_POLICY: "fail_closed"
    },
    createClient: createMockSupabaseFactory("uuid-halisson-hp-victus-001"),
    fetchFn: mockFetch
  });

  assert.equal(gatewayCalled, true, "Deve tentar o Gateway local");
  assert.equal(geminiCalled, false, "NUNCA deve acionar Gemini quando ATLAS_LOCAL_AI_FALLBACK_POLICY=fail_closed, mesmo se a variável legada for true");
  assert.equal(res.status, 503);
  assert.equal(res.headers.get("X-Aeternum-AI-Fallback"), "false");
});

test("10. Canário em Retry de Validação Anatômica: Permanece no Gateway local e NUNCA aciona Gemini em fail_closed", async () => {
  let geminiCalled = false;
  let localGatewayCalls = 0;

  const mockFetch = async (url, init) => {
    if (String(url).includes("generativelanguage.googleapis.com")) {
      geminiCalled = true;
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: "Resposta paga do Gemini." }] } }]
      }), { status: 200 });
    }

    if (String(url).includes("atlas-code.aeternumatlas.com")) {
      localGatewayCalls++;
      // Na primeira chamada, retorna resposta que violará o Response Validator (ex.: premissa falsa proibida)
      if (localGatewayCalls === 1) {
        return new Response(JSON.stringify({
          success: true,
          data: {
            text: "O processo coracoide pertence à clavícula e articula-se com o fêmur.", // Premissa anatômica falsa proposital
            providerId: "generic-provider-id-without-daemon-in-name",
            modelId: "generic-model"
          },
          metadata: { finalProvider: "generic-provider-id-without-daemon-in-name" }
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      // Na segunda chamada (retry do validator), simula falha local
      return new Response(JSON.stringify({
        error: { code: "provider_unavailable", message: "Daemon ocupado." }
      }), { status: 503, headers: { "Content-Type": "application/json" } });
    }

    return new Response("{}", { status: 200 });
  };

  const req = new Request("https://supabase.aeternumatlas.com/functions/v1/ai-tutor", {
    method: "POST",
    headers: {
      Origin: "https://www.aeternumatlas.com",
      Authorization: "Bearer valid-student-jwt-token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Explique a correlação neurovascular complexa da fossa axilar em detalhes clínicos." }]
    })
  });

  const res = await handleAiTutorRequest(req, {
    env: {
      SUPABASE_URL: "https://mock.supabase.co",
      SUPABASE_ANON_KEY: "anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      GEMINI_API_KEY: "paid-gemini-api-key",
      ATLAS_LOCAL_AI_ENABLED: "true",
      ATLAS_LOCAL_AI_ALLOWLIST_UUIDS: "uuid-halisson-hp-victus-001",
      ATLAS_LOCAL_GATEWAY_URL: "https://atlas-code.aeternumatlas.com",
      ATLAS_LOCAL_GATEWAY_TOKEN: "independent-gateway-bearer-secret",
      CF_ACCESS_CLIENT_ID: "real-client-id-123456.access",
      CF_ACCESS_CLIENT_SECRET: "real-client-secret-abcdef",
      ATLAS_LOCAL_AI_FALLBACK_POLICY: "fail_closed"
    },
    createClient: createMockSupabaseFactory("uuid-halisson-hp-victus-001"),
    fetchFn: mockFetch
  });

  assert.equal(localGatewayCalls, 2, "A tentativa inicial e o retry de validação devem ambos ter ocorrido no Gateway local");
  assert.equal(geminiCalled, false, "NÃO deve ter ocorrido fallback silencioso para Gemini pago no retry sob política fail_closed");
  assert.equal(res.status, 502, "Deve retornar 502 quando a resposta falhar na validação anatômica");
  assert.equal(res.headers.get("X-Aeternum-AI-Fallback"), "false");
});
