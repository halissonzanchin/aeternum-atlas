import { describe, it, expect, beforeEach } from "vitest";
import { handleAiTutorRequest, AiTutorDependencies } from "../../../../../supabase/functions/ai-tutor/index.ts";

interface InMemoryDB {
  users: Array<{ id: string; institution_id: string; role: string; status: string; name: string }>;
  conversations: Array<{ id: string; user_id: string; institution_id: string; title: string; context: any }>;
  messages: Array<{ id: string; conversation_id: string; user_id: string; role: "user" | "assistant"; content: string; metadata: any; created_at: string }>;
  auditEvents: Array<any>;
  rateLimitAllowed: boolean;
  rateLimitRpcError: boolean;
  vectorKnowledge: Array<{ book_title: string; chapter_title?: string; page_number?: number; content: string; similarity: number }>;
  lexicalKnowledge: Array<{ book_title: string; chapter_title?: string; page_number?: number; content: string; lexical_rank: number }>;
}

function createFakeClientFactory(db: InMemoryDB) {
  return function fakeCreateClient(url: string, key: string, options?: any) {
    const authHeader = options?.global?.headers?.Authorization || "";

    return {
      auth: {
        async getUser() {
          if (!authHeader.startsWith("Bearer ")) {
            return { data: { user: null }, error: new Error("No token") };
          }
          const token = authHeader.replace("Bearer ", "").trim();
          if (token === "invalid-jwt-token") {
            return { data: { user: null }, error: new Error("Invalid JWT") };
          }
          if (token === "user-inactive-token") {
            return { data: { user: { id: "user-inactive-999" } }, error: null };
          }
          if (token === "user-b-token") {
            return { data: { user: { id: "user-b-456" } }, error: null };
          }
          if (token === "prof-token") {
            return { data: { user: { id: "prof-a-789" } }, error: null };
          }
          // Default user A
          return { data: { user: { id: "user-a-123" } }, error: null };
        }
      },
      from(table: string) {
        function createQueryBuilder(filters: Array<[string, any]> = []) {
          return {
            eq(col: string, val: any) {
              return createQueryBuilder([...filters, [col, val]]);
            },
            order(orderCol: string, opts?: { ascending: boolean }) {
              return {
                limit(lim: number) {
                  let rows: any[] = [];
                  if (table === "ai_messages") {
                    rows = db.messages.filter((m) =>
                      filters.every(([c, v]) => (m as any)[c] === v)
                    );
                  }
                  const sorted = opts?.ascending === false ? [...rows].reverse() : [...rows];
                  return Promise.resolve({ data: sorted.slice(0, lim), error: null });
                }
              };
            },
            maybeSingle() {
              let rows: any[] = [];
              if (table === "users") rows = db.users;
              else if (table === "ai_conversations") rows = db.conversations;
              else if (table === "ai_messages") rows = db.messages;

              const found = rows.find((r) =>
                filters.every(([c, v]) => (r as any)[c] === v)
              );
              return Promise.resolve({ data: found || null, error: null });
            }
          };
        }

        return {
          select(fields?: string) {
            return createQueryBuilder();
          },
          insert(record: any) {
            if (table === "ai_conversations") {
              db.conversations.push(record);
            } else if (table === "ai_messages") {
              db.messages.push({
                ...record,
                id: record.id || `msg-${db.messages.length + 1}`,
                created_at: new Date().toISOString()
              });
            } else if (table === "ai_audit_events") {
              db.auditEvents.push(record);
            }
            return Promise.resolve({ error: null });
          },
          update(fields: any) {
            function createUpdateBuilder(filters: Array<[string, any]> = []) {
              return {
                eq(col: string, val: any) {
                  return createUpdateBuilder([...filters, [col, val]]);
                },
                then(resolve: any) {
                  if (table === "ai_conversations") {
                    const found = db.conversations.find((c) =>
                      filters.every(([k, v]) => (c as any)[k] === v)
                    );
                    if (found) Object.assign(found, fields);
                  }
                  return Promise.resolve({ error: null }).then(resolve);
                }
              };
            }
            return createUpdateBuilder();
          },
          delete() {
            return {
              eq(col: string, val: any) {
                if (table === "ai_messages") {
                  db.messages = db.messages.filter((m) => (m as any)[col] !== val);
                }
                return Promise.resolve({ error: null });
              }
            };
          }
        };
      },
      rpc(fn: string, params: any) {
        if (fn === "consume_ai_rate_limit") {
          if (db.rateLimitRpcError) {
            return Promise.resolve({ data: null, error: new Error("RPC Failure") });
          }
          return Promise.resolve({
            data: { allowed: db.rateLimitAllowed, retry_after_seconds: 30 },
            error: null
          });
        }
        if (fn === "match_anatomical_knowledge") {
          return Promise.resolve({ data: db.vectorKnowledge, error: null });
        }
        if (fn === "match_vita_anatomical_knowledge") {
          return Promise.resolve({ data: db.lexicalKnowledge, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }
    };
  };
}

describe("Atlas AI Tutor Real Edge Handler Integration (Phase 3B.1)", () => {
  let db: InMemoryDB;
  let capturedGatewayPayload: any = null;
  let gatewayFailMode = false;
  let observedDirectGeminiGenerateCalls = 0;
  let observedGeminiEmbedCalls = 0;

  beforeEach(() => {
    capturedGatewayPayload = null;
    gatewayFailMode = false;
    observedDirectGeminiGenerateCalls = 0;
    observedGeminiEmbedCalls = 0;

    db = {
      users: [
        { id: "user-a-123", institution_id: "inst-a", role: "student", status: "active", name: "Halisson Zanchin" },
        { id: "user-b-456", institution_id: "inst-b", role: "student", status: "active", name: "Aluno B" },
        { id: "prof-a-789", institution_id: "inst-a", role: "professor", status: "active", name: "Dra. Camila" },
        { id: "user-inactive-999", institution_id: "inst-a", role: "student", status: "inactive", name: "Aluno Inativo" }
      ],
      conversations: [],
      messages: [],
      auditEvents: [],
      rateLimitAllowed: true,
      rateLimitRpcError: false,
      vectorKnowledge: [
        {
          book_title: "Moore — Anatomia Orientada para a Clínica",
          chapter_title: "Membro Superior",
          page_number: 879,
          content: "O nervo radial inerva o tríceps braquial e os músculos extensores do antebraço.",
          similarity: 0.85
        }
      ],
      lexicalKnowledge: [
        {
          book_title: "Netter — Atlas de Anatomia Humana",
          chapter_title: "Braço e Antebraço",
          page_number: 468,
          content: "Trajeto do nervo radial no sulco umeral.",
          lexical_rank: 1
        }
      ]
    };
  });

  function createTestDeps(): AiTutorDependencies {
    return {
      env: {
        AETERNUM_AI_GATEWAY_URL: "http://127.0.0.1:8081",
        AETERNUM_AI_GATEWAY_TOKEN: "valid-gateway-secret-token",
        SUPABASE_URL: "https://test.supabase.co",
        SUPABASE_ANON_KEY: "test-anon-key",
        SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
        GEMINI_API_KEY: "test-gemini-key"
      },
      createClient: createFakeClientFactory(db),
      gatewayClient: {
        async generate(payload: any, token: string, gatewayUrl: string) {
          if (gatewayFailMode) {
            return {
              text: "",
              latencyMs: 10,
              status: 503,
              provider: "aeternum-gateway",
              model: "gateway",
              success: false,
              canonicalReason: "GATEWAY_UNAVAILABLE"
            };
          }
          capturedGatewayPayload = payload;
          return {
            text: "O nervo radial é um importante ramo do plexo braquial que inerva os músculos extensores.",
            latencyMs: 25,
            status: 200,
            provider: "aeternum-gateway",
            model: "aeternum-llm",
            success: true,
            canonicalReason: "NONE"
          };
        },
        async health(gatewayUrl: string) {
          return { ok: true, status: 200, data: { status: "HEALTHY" } };
        }
      },
      embeddingClient: {
        async embed(apiKey: string, prompt: string) {
          observedGeminiEmbedCalls++;
          return new Array(768).fill(0.1);
        }
      },
      fetchFn: async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = String(url);
        if (urlStr.includes(":generateContent")) {
          observedDirectGeminiGenerateCalls++;
          throw new Error("DIRECT_GEMINI_GENERATION_IS_FORBIDDEN");
        }
        if (urlStr.includes(":embedContent")) {
          observedGeminiEmbedCalls++;
          return new Response(JSON.stringify({ embedding: { values: new Array(768).fill(0.1) } }), { status: 200 });
        }
        return new Response("ok", { status: 200 });
      }
    };
  }

  it("1. AI_TUTOR_REAL_HANDLER_AUTH: Missing JWT -> 401 AUTH_REQUIRED", async () => {
    const deps = createTestDeps();
    const req = new Request("http://localhost/ai-tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Olá" })
    });

    const res = await handleAiTutorRequest(req, deps);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.code).toBe("AUTH_REQUIRED");
  });

  it("2. AI_TUTOR_REAL_HANDLER_AUTH: Invalid JWT -> 401 AUTH_INVALID", async () => {
    const deps = createTestDeps();
    const req = new Request("http://localhost/ai-tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer invalid-jwt-token"
      },
      body: JSON.stringify({ prompt: "Olá" })
    });

    const res = await handleAiTutorRequest(req, deps);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.code).toBe("AUTH_INVALID");
  });

  it("3. AI_TUTOR_REAL_HANDLER_AUTH: Inactive user -> 403 USER_INACTIVE", async () => {
    const deps = createTestDeps();
    const req = new Request("http://localhost/ai-tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer user-inactive-token"
      },
      body: JSON.stringify({ prompt: "Olá" })
    });

    const res = await handleAiTutorRequest(req, deps);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe("USER_INACTIVE");
  });

  it("4. AI_TUTOR_REAL_HANDLER_TENANT_ISOLATION: Cross-user conversation access is blocked with 403", async () => {
    const deps = createTestDeps();

    // User A cria uma conversa
    db.conversations.push({
      id: "conv-user-a",
      user_id: "user-a-123",
      institution_id: "inst-a",
      title: "Anatomia do Úmero",
      context: {}
    });

    // User B tenta enviar mensagem para a conversa do User A
    const req = new Request("http://localhost/ai-tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer user-b-token"
      },
      body: JSON.stringify({
        conversationId: "conv-user-a",
        prompt: "Tentativa de acesso não autorizada"
      })
    });

    const res = await handleAiTutorRequest(req, deps);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe("CONVERSATION_FORBIDDEN");
  });

  it("5. AI_TUTOR_REAL_HANDLER_RATE_LIMIT: Enforces 429 when rate limit exceeded & 503 on RPC failure", async () => {
    const deps = createTestDeps();

    // Caso 1: Quota esgotada
    db.rateLimitAllowed = false;
    const req1 = new Request("http://localhost/ai-tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer valid-token-user-a"
      },
      body: JSON.stringify({ prompt: "Pergunta rápida" })
    });

    const res1 = await handleAiTutorRequest(req1, deps);
    expect(res1.status).toBe(429);
    const json1 = await res1.json();
    expect(json1.code).toBe("AI_RATE_LIMITED");
    expect(res1.headers.get("Retry-After")).toBe("30");

    // Caso 2: Falha RPC (Fail closed)
    db.rateLimitAllowed = true;
    db.rateLimitRpcError = true;
    const req2 = new Request("http://localhost/ai-tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer valid-token-user-a"
      },
      body: JSON.stringify({ prompt: "Pergunta rápida" })
    });

    const res2 = await handleAiTutorRequest(req2, deps);
    expect(res2.status).toBe(503);
    const json2 = await res2.json();
    expect(json2.code).toBe("AI_RATE_LIMIT_ERROR");
  });

  it("6. AI_TUTOR_REAL_HANDLER_RAG: Real RAG flow executes vector retrieval and injects sources into Gateway payload", async () => {
    const deps = createTestDeps();
    const req = new Request("http://localhost/ai-tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer valid-token-user-a"
      },
      body: JSON.stringify({ prompt: "Explique o trajeto do nervo radial" })
    });

    const res = await handleAiTutorRequest(req, deps);
    expect(res.status).toBe(200);

    // Verifica que o Gateway recebeu a instrução contendo a citação de Moore recuperada via RAG
    expect(capturedGatewayPayload).toBeDefined();
    expect(capturedGatewayPayload.systemInstruction).toContain("Moore — Anatomia Orientada para a Clínica");
    expect(capturedGatewayPayload.systemInstruction).toContain("p. 879");
    expect(capturedGatewayPayload.systemInstruction).toContain("tríceps braquial");
    expect(capturedGatewayPayload.sources.length).toBe(1);

    // Verifica personalização pelo nome do usuário Halisson
    expect(capturedGatewayPayload.systemInstruction).toContain("Halisson");
  });

  it("7. AI_TUTOR_REAL_HANDLER_LEXICAL_FALLBACK: When vector search is empty, fallback to PostgreSQL lexical FTS", async () => {
    const deps = createTestDeps();
    db.vectorKnowledge = []; // Vetorial vazio / indisponível

    const req = new Request("http://localhost/ai-tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer valid-token-user-a"
      },
      body: JSON.stringify({ prompt: "Braço e antebraço nervo radial" })
    });

    const res = await handleAiTutorRequest(req, deps);
    expect(res.status).toBe(200);

    // Verifica que o Gateway recebeu os dados do Netter recuperados via busca lexical PostgreSQL FTS
    expect(capturedGatewayPayload).toBeDefined();
    expect(capturedGatewayPayload.systemInstruction).toContain("Netter — Atlas de Anatomia Humana");
    expect(capturedGatewayPayload.systemInstruction).toContain("p. 468");
  });

  it("8. AI_TUTOR_REAL_HANDLER_HISTORY & PERSISTENCE: Multi-turn loads persisted history and delivers to Gateway", async () => {
    const deps = createTestDeps();

    // Turno 1
    const req1 = new Request("http://localhost/ai-tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer valid-token-user-a"
      },
      body: JSON.stringify({ prompt: "Qual a origem do nervo radial?" })
    });

    const res1 = await handleAiTutorRequest(req1, deps);
    expect(res1.status).toBe(200);
    expect(db.conversations.length).toBe(1);
    const convId = db.conversations[0].id;

    // Turno 2 (mesma conversa)
    const req2 = new Request("http://localhost/ai-tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer valid-token-user-a"
      },
      body: JSON.stringify({
        conversationId: convId,
        prompt: "E onde ele termina?"
      })
    });

    const res2 = await handleAiTutorRequest(req2, deps);
    expect(res2.status).toBe(200);

    // O Gateway no turno 2 deve ter recebido o histórico do turno 1
    expect(capturedGatewayPayload).toBeDefined();
    expect(capturedGatewayPayload.history.length).toBe(2); // user msg 1 + assistant msg 1
    expect(capturedGatewayPayload.history[0].content).toBe("Qual a origem do nervo radial?");
    expect(capturedGatewayPayload.history[1].role).toBe("assistant");
    expect(capturedGatewayPayload.prompt).toBe("E onde ele termina?");
  });

  it("9. AI_TUTOR_REAL_HANDLER_MINDMAP: Mindmap mode injects hierarchy protocol into systemInstruction", async () => {
    const deps = createTestDeps();
    const req = new Request("http://localhost/ai-tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer valid-token-user-a"
      },
      body: JSON.stringify({
        prompt: "Gere mapa mental do nervo radial",
        context: { source: "mind-map" }
      })
    });

    const res = await handleAiTutorRequest(req, deps);
    expect(res.status).toBe(200);
    expect(capturedGatewayPayload.systemInstruction).toContain("Modo de saída — Mapa Mental Anatômico:");
  });

  it("10. AI_TUTOR_GATEWAY_FAILURE_FAIL_CLOSED & FAILED_TURN_HISTORY_CLEAN: Gateway failure returns 503 and cleans orphan user message", async () => {
    const deps = createTestDeps();
    gatewayFailMode = true; // Simula falha do Gateway

    const req = new Request("http://localhost/ai-tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer valid-token-user-a"
      },
      body: JSON.stringify({ prompt: "Pergunta que falha no gateway" })
    });

    const res = await handleAiTutorRequest(req, deps);
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.code).toBe("AI_GATEWAY_UNAVAILABLE");
    expect(json.error).toBe("Tutor IA temporariamente indisponível. Tente novamente em instantes.");

    // Integridade de Histórico: a mensagem do usuário falhada NÃO deve permanecer no banco
    expect(db.messages.filter((m) => m.content === "Pergunta que falha no gateway").length).toBe(0);
  });

  it("11. AI_TUTOR_DIRECT_GEMINI_GENERATION_ZERO: Verifies zero direct Gemini :generateContent calls while embedding executes under exception", async () => {
    const deps = createTestDeps();

    const req = new Request("http://localhost/ai-tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer valid-token-user-a"
      },
      body: JSON.stringify({ prompt: "Pergunta padrão" })
    });

    const res = await handleAiTutorRequest(req, deps);
    expect(res.status).toBe(200);

    // Contadores factual e empiricamente observados
    expect(observedDirectGeminiGenerateCalls).toBe(0); // AI_TUTOR_DIRECT_GEMINI_GENERATION_CALLS = 0
    expect(observedGeminiEmbedCalls).toBe(1); // TEMPORARY_RAG_EMBEDDING_EXCEPTION
  });
});
