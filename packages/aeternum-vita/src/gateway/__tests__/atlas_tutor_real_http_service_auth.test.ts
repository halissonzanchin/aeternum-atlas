import { describe, it, expect, beforeEach } from "vitest";
import { AeternumAIGateway } from "../AeternumAIGateway.ts";
import { ProviderRouter } from "../../providers/router/ProviderRouter.ts";
import { FakeLLMProvider } from "../../providers/testing/FakeLLMProvider.ts";
import { handleAiTutorRequest, AiTutorDependencies } from "../../../../../supabase/functions/ai-tutor/index.ts";

interface InMemoryDB {
  users: Array<{ id: string; institution_id: string; role: string; status: string; name: string }>;
  conversations: Array<{ id: string; user_id: string; institution_id: string; title: string; context: any }>;
  messages: Array<{ id: string; conversation_id: string; user_id: string; role: "user" | "assistant"; content: string; metadata: any; created_at: string }>;
  auditEvents: Array<any>;
  rateLimitAllowed: boolean;
  vectorKnowledge: Array<{ book_title: string; chapter_title?: string; page_number?: number; content: string; similarity: number }>;
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
          return Promise.resolve({ data: { allowed: db.rateLimitAllowed, retry_after_seconds: 30 }, error: null });
        }
        if (fn === "match_anatomical_knowledge") {
          return Promise.resolve({ data: db.vectorKnowledge, error: null });
        }
        if (fn === "match_vita_anatomical_knowledge") {
          return Promise.resolve({ data: [], error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }
    };
  };
}

describe("Atlas AI Tutor Real HTTP Client ↔ Gateway SERVICE_TOKEN Integration (Phase 3B.2)", () => {
  let db: InMemoryDB;
  let port = 8820;
  const getPort = () => ++port;
  const SECRET_SERVICE_TOKEN = "aeternum-edge-service-secret-token-xyz789";

  beforeEach(() => {
    db = {
      users: [
        { id: "user-a-123", institution_id: "inst-a", role: "student", status: "active", name: "Halisson Zanchin" }
      ],
      conversations: [],
      messages: [],
      auditEvents: [],
      rateLimitAllowed: true,
      vectorKnowledge: [
        {
          book_title: "Moore — Anatomia Orientada para a Clínica",
          chapter_title: "Membro Superior",
          page_number: 879,
          content: "O nervo radial inerva o tríceps braquial e os músculos extensores do antebraço.",
          similarity: 0.85
        }
      ]
    };
  });

  it("1. SERVICE_TOKEN_VALID & REAL HTTP: Real HTTP request with valid service token succeeds and invokes Provider once", async () => {
    const p = getPort();
    let providerCallCount = 0;

    class CountingLLM extends FakeLLMProvider {
      async generate(req: any, ctx?: any) {
        providerCallCount++;
        return {
          text: "O nervo radial é o maior ramo do fascículo posterior do plexo braquial.",
          modelId: "ollama-llm",
          providerId: "ollama-local",
          finishReason: "stop" as const
        };
      }
    }

    const localLLM = new CountingLLM({ id: "ollama-local", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: localLLM } });

    const gateway = new AeternumAIGateway({
      port: p,
      host: "127.0.0.1",
      authMode: "SERVICE_TOKEN",
      authToken: SECRET_SERVICE_TOKEN,
      router
    });

    await gateway.start();

    try {
      const deps: AiTutorDependencies = {
        env: {
          AETERNUM_AI_GATEWAY_URL: `http://127.0.0.1:${p}`,
          AETERNUM_AI_GATEWAY_TOKEN: SECRET_SERVICE_TOKEN,
          SUPABASE_URL: "https://test.supabase.co",
          SUPABASE_ANON_KEY: "test-anon",
          SUPABASE_SERVICE_ROLE_KEY: "test-service",
          GEMINI_API_KEY: "test-gemini"
        },
        createClient: createFakeClientFactory(db),
        embeddingClient: {
          embed: async () => new Array(768).fill(0.1)
        }
        // NOTE: deps.gatewayClient is NOT injected here; uses real defaultExecuteGatewayLLMCall (fetch)
      };

      const req = new Request("http://localhost/ai-tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer valid-user-jwt"
        },
        body: JSON.stringify({ prompt: "Explique o nervo radial." })
      });

      const res = await handleAiTutorRequest(req, deps);
      expect(res.status).toBe(200);

      // Lê stream SSE
      const streamText = await res.text();
      expect(streamText).toContain("O nervo radial é o maior ramo");
      expect(streamText).toContain("[DONE]");

      // Prova que o Gateway validou o token de serviço e acionou o Provider exatamente 1 vez
      expect(providerCallCount).toBe(1);
      expect(db.messages.filter((m) => m.role === "assistant").length).toBe(1);
    } finally {
      await gateway.stop();
    }
  });

  it("2. SERVICE_TOKEN_MISSING: Missing service token returns 401 on Gateway and 0 provider calls", async () => {
    const p = getPort();
    let providerCallCount = 0;

    class CountingLLM extends FakeLLMProvider {
      async generate(req: any, ctx?: any) {
        providerCallCount++;
        return super.generate(req, ctx);
      }
    }

    const localLLM = new CountingLLM({ id: "ollama-local", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: localLLM } });

    const gateway = new AeternumAIGateway({
      port: p,
      host: "127.0.0.1",
      authMode: "SERVICE_TOKEN",
      authToken: SECRET_SERVICE_TOKEN,
      router
    });

    await gateway.start();

    try {
      const deps: AiTutorDependencies = {
        env: {
          AETERNUM_AI_GATEWAY_URL: `http://127.0.0.1:${p}`,
          AETERNUM_AI_GATEWAY_TOKEN: "", // Token ausente
          SUPABASE_URL: "https://test.supabase.co",
          SUPABASE_ANON_KEY: "test-anon",
          SUPABASE_SERVICE_ROLE_KEY: "test-service",
          GEMINI_API_KEY: "test-gemini"
        },
        createClient: createFakeClientFactory(db),
        embeddingClient: {
          embed: async () => new Array(768).fill(0.1)
        }
      };

      const req = new Request("http://localhost/ai-tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer valid-user-jwt"
        },
        body: JSON.stringify({ prompt: "Explique o nervo radial." })
      });

      const res = await handleAiTutorRequest(req, deps);
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.code).toBe("AI_GATEWAY_UNAVAILABLE");

      // Provider nunca foi chamado
      expect(providerCallCount).toBe(0);
    } finally {
      await gateway.stop();
    }
  });

  it("3. SERVICE_TOKEN_INVALID: Invalid service token returns 401 on Gateway and 0 provider calls", async () => {
    const p = getPort();
    let providerCallCount = 0;

    class CountingLLM extends FakeLLMProvider {
      async generate(req: any, ctx?: any) {
        providerCallCount++;
        return super.generate(req, ctx);
      }
    }

    const localLLM = new CountingLLM({ id: "ollama-local", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: localLLM } });

    const gateway = new AeternumAIGateway({
      port: p,
      host: "127.0.0.1",
      authMode: "SERVICE_TOKEN",
      authToken: SECRET_SERVICE_TOKEN,
      router
    });

    await gateway.start();

    try {
      const deps: AiTutorDependencies = {
        env: {
          AETERNUM_AI_GATEWAY_URL: `http://127.0.0.1:${p}`,
          AETERNUM_AI_GATEWAY_TOKEN: "wrong-service-token-12345", // Token inválido
          SUPABASE_URL: "https://test.supabase.co",
          SUPABASE_ANON_KEY: "test-anon",
          SUPABASE_SERVICE_ROLE_KEY: "test-service",
          GEMINI_API_KEY: "test-gemini"
        },
        createClient: createFakeClientFactory(db),
        embeddingClient: {
          embed: async () => new Array(768).fill(0.1)
        }
      };

      const req = new Request("http://localhost/ai-tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer valid-user-jwt"
        },
        body: JSON.stringify({ prompt: "Explique o nervo radial." })
      });

      const res = await handleAiTutorRequest(req, deps);
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.code).toBe("AI_GATEWAY_UNAVAILABLE");

      // Provider nunca foi chamado
      expect(providerCallCount).toBe(0);
    } finally {
      await gateway.stop();
    }
  });

  it("4. USER_JWT_AS_SERVICE_TOKEN: Supabase user JWT presented to SERVICE_TOKEN gateway returns 401", async () => {
    const p = getPort();
    let providerCallCount = 0;

    class CountingLLM extends FakeLLMProvider {
      async generate(req: any, ctx?: any) {
        providerCallCount++;
        return super.generate(req, ctx);
      }
    }

    const localLLM = new CountingLLM({ id: "ollama-local", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: localLLM } });

    const gateway = new AeternumAIGateway({
      port: p,
      host: "127.0.0.1",
      authMode: "SERVICE_TOKEN",
      authToken: SECRET_SERVICE_TOKEN,
      router
    });

    await gateway.start();

    try {
      const userJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQifQ.fake_signature";

      const deps: AiTutorDependencies = {
        env: {
          AETERNUM_AI_GATEWAY_URL: `http://127.0.0.1:${p}`,
          AETERNUM_AI_GATEWAY_TOKEN: userJwt, // Supabase User JWT como credencial de serviço
          SUPABASE_URL: "https://test.supabase.co",
          SUPABASE_ANON_KEY: "test-anon",
          SUPABASE_SERVICE_ROLE_KEY: "test-service",
          GEMINI_API_KEY: "test-gemini"
        },
        createClient: createFakeClientFactory(db),
        embeddingClient: {
          embed: async () => new Array(768).fill(0.1)
        }
      };

      const req = new Request("http://localhost/ai-tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer valid-user-jwt"
        },
        body: JSON.stringify({ prompt: "Explique o nervo radial." })
      });

      const res = await handleAiTutorRequest(req, deps);
      expect(res.status).toBe(503);
      expect(providerCallCount).toBe(0);
    } finally {
      await gateway.stop();
    }
  });

  it("5. PUBLIC BINDING RULE: Non-local host without secure auth throws error at startup", () => {
    const router = new ProviderRouter({ llm: { primary: new FakeLLMProvider({ id: "fake", location: "LOCAL" }) } });

    // 1. Proibido: host 0.0.0.0 com INTERNAL_DEV
    expect(() => {
      new AeternumAIGateway({
        host: "0.0.0.0",
        authMode: "INTERNAL_DEV",
        router
      });
    }).toThrow(/Binding público proibido sem autenticação segura/);

    // 2. Proibido: host 0.0.0.0 com DISABLED
    expect(() => {
      new AeternumAIGateway({
        host: "0.0.0.0",
        authMode: "DISABLED",
        router
      });
    }).toThrow(/Binding público proibido sem autenticação segura/);

    // 3. Proibido: SERVICE_TOKEN sem authToken
    expect(() => {
      new AeternumAIGateway({
        host: "127.0.0.1",
        authMode: "SERVICE_TOKEN",
        authToken: "",
        router
      });
    }).toThrow(/Modo SERVICE_TOKEN requer configuração de authToken seguro não-vazio/);

    // 4. Permitido: host 0.0.0.0 com SERVICE_TOKEN e authToken válido
    expect(() => {
      new AeternumAIGateway({
        host: "0.0.0.0",
        authMode: "SERVICE_TOKEN",
        authToken: "secure-token-123",
        router
      });
    }).not.toThrow();
  });

  it("6. SSE_V38_METADATA_PARITY: Verifies complete backward-compatible fields in first SSE frame", async () => {
    const p = getPort();

    class ParityLLM extends FakeLLMProvider {
      async generate(req: any, ctx?: any) {
        return {
          text: "Resposta do Tutor IA em formato de stream anatômico.",
          modelId: "ollama-llm",
          providerId: "ollama-local",
          finishReason: "stop" as const
        };
      }
    }

    const localLLM = new ParityLLM({ id: "ollama-local", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: localLLM } });

    const gateway = new AeternumAIGateway({
      port: p,
      host: "127.0.0.1",
      authMode: "SERVICE_TOKEN",
      authToken: SECRET_SERVICE_TOKEN,
      router
    });

    await gateway.start();

    try {
      const deps: AiTutorDependencies = {
        env: {
          AETERNUM_AI_GATEWAY_URL: `http://127.0.0.1:${p}`,
          AETERNUM_AI_GATEWAY_TOKEN: SECRET_SERVICE_TOKEN,
          SUPABASE_URL: "https://test.supabase.co",
          SUPABASE_ANON_KEY: "test-anon",
          SUPABASE_SERVICE_ROLE_KEY: "test-service",
          GEMINI_API_KEY: "test-gemini"
        },
        createClient: createFakeClientFactory(db),
        embeddingClient: {
          embed: async () => new Array(768).fill(0.1)
        }
      };

      const req = new Request("http://localhost/ai-tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer valid-user-jwt"
        },
        body: JSON.stringify({ prompt: "Pergunta de teste de metadados SSE" })
      });

      const res = await handleAiTutorRequest(req, deps);
      expect(res.status).toBe(200);

      const rawStream = await res.text();
      const frames = rawStream.split("\n\n").filter(Boolean);
      expect(frames.length).toBeGreaterThan(1);

      // Primeiro frame deve ser o metadata frame estruturado
      const firstFrame = frames[0];
      expect(firstFrame.startsWith("data: ")).toBe(true);
      const metadata = JSON.parse(firstFrame.replace("data: ", ""));

      // Verificação rigorosa de paridade com ai-tutor v38
      expect(typeof metadata.conversationId).toBe("string");
      expect(typeof metadata.source).toBe("string");
      expect(typeof metadata.model).toBe("string");
      expect(typeof metadata.primaryModel).toBe("string");
      expect(typeof metadata.modelFallbackUsed).toBe("boolean");
      expect(typeof metadata.providerFallbackUsed).toBe("boolean");
      expect(typeof metadata.fallbackUsed).toBe("boolean");
      expect(typeof metadata.latencyMs).toBe("number");
      expect(typeof metadata.retrievalCount).toBe("number");
      expect(typeof metadata.retrievalMethod).toBe("string");
      expect(typeof metadata.retrievalContextualized).toBe("boolean");

      // Último frame deve ser [DONE]
      const lastFrame = frames[frames.length - 1];
      expect(lastFrame).toBe("data: [DONE]");
    } finally {
      await gateway.stop();
    }
  });

  it("7. BODY_LIMIT_64KB_GUARD: Rejects payload exceeding 64KB even without Content-Length header", async () => {
    const deps: AiTutorDependencies = {
      env: {
        AETERNUM_AI_GATEWAY_URL: "http://127.0.0.1:8081",
        AETERNUM_AI_GATEWAY_TOKEN: SECRET_SERVICE_TOKEN,
        SUPABASE_URL: "https://test.supabase.co",
        SUPABASE_ANON_KEY: "test-anon",
        SUPABASE_SERVICE_ROLE_KEY: "test-service"
      },
      createClient: createFakeClientFactory(db)
    };

    const giantString = "A".repeat(65_000);
    const req = new Request("http://localhost/ai-tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer valid-user-jwt"
      },
      body: JSON.stringify({ prompt: giantString })
    });

    const res = await handleAiTutorRequest(req, deps);
    expect(res.status).toBe(413);
    const json = await res.json();
    expect(json.error).toContain("limite");
  });
});
