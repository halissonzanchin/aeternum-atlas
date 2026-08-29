import { describe, it, expect, beforeEach } from "vitest";
import { AeternumAIGateway } from "../AeternumAIGateway.ts";
import { ProviderRouter } from "../../providers/router/ProviderRouter.ts";
import { FakeLLMProvider } from "../../providers/testing/FakeLLMProvider.ts";
import { ProviderUnavailableError } from "../../providers/types/index.ts";
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
          const token = authHeader.replace("Bearer ", "").trim();
          if (token === "same-user-token") {
            return { data: { user: { id: "same-user-123" } }, error: null };
          }
          return { data: { user: { id: "user-a-123" } }, error: null };
        }
      },
      from(table: string) {
        return {
          select(fields: string) {
            return {
              eq(col1: string, val1: any) {
                return {
                  eq(col2: string, val2: any) {
                    return {
                      eq(col3: string, val3: any) {
                        return {
                          maybeSingle() {
                            if (table === "ai_conversations") {
                              const found = db.conversations.find(
                                (c) => (c as any)[col1] === val1 && (c as any)[col2] === val2 && (c as any)[col3] === val3
                              );
                              return Promise.resolve({ data: found || null, error: null });
                            }
                            return Promise.resolve({ data: null, error: null });
                          }
                        };
                      },
                      order(orderCol: string, opts?: { ascending: boolean }) {
                        return {
                          limit(lim: number) {
                            if (table === "ai_messages") {
                              const filtered = db.messages.filter((m) => (m as any)[col1] === val1 && (m as any)[col2] === val2);
                              const sorted = opts?.ascending === false ? [...filtered].reverse() : [...filtered];
                              return Promise.resolve({ data: sorted.slice(0, lim), error: null });
                            }
                            return Promise.resolve({ data: [], error: null });
                          }
                        };
                      },
                      maybeSingle() {
                        if (table === "ai_conversations") {
                          const found = db.conversations.find((c) => (c as any)[col1] === val1 && (c as any)[col2] === val2);
                          return Promise.resolve({ data: found || null, error: null });
                        }
                        return Promise.resolve({ data: null, error: null });
                      }
                    };
                  },
                  maybeSingle() {
                    if (table === "users") {
                      const found = db.users.find((u) => (u as any)[col1] === val1);
                      return Promise.resolve({ data: found || null, error: null });
                    }
                    if (table === "ai_conversations") {
                      const found = db.conversations.find((c) => (c as any)[col1] === val1);
                      return Promise.resolve({ data: found || null, error: null });
                    }
                    return Promise.resolve({ data: null, error: null });
                  }
                };
              }
            };
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
            return {
              eq(col1: string, val1: any) {
                return {
                  eq(col2: string, val2: any) {
                    return {
                      eq(col3: string, val3: any) {
                        if (table === "ai_conversations") {
                          const found = db.conversations.find(
                            (c) => (c as any)[col1] === val1 && (c as any)[col2] === val2 && (c as any)[col3] === val3
                          );
                          if (found) Object.assign(found, fields);
                        }
                        return Promise.resolve({ error: null });
                      }
                    };
                  }
                };
              }
            };
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

describe("Atlas AI Tutor Phase 3B.3 Hardening", () => {
  let db: InMemoryDB;
  let port = 8930;
  const getPort = () => ++port;
  const SERVICE_TOKEN = "test-service-token-sec-999";

  beforeEach(() => {
    db = {
      users: [
        { id: "same-user-123", institution_id: "inst-b", role: "student", status: "active", name: "Mesmo Usuário" },
        { id: "user-a-123", institution_id: "inst-a", role: "student", status: "active", name: "Usuário A" }
      ],
      conversations: [
        {
          id: "conv-user-inst-a",
          user_id: "same-user-123",
          institution_id: "inst-a", // Pertence à instituição A anterior
          title: "Conversa Antiga",
          context: {}
        }
      ],
      messages: [],
      auditEvents: [],
      rateLimitAllowed: true,
      vectorKnowledge: []
    };
  });

  it("1. AI_TUTOR_TENANT_ISOLATION: Same-user cross-institution conversation access is blocked with HTTP 403", async () => {
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
      authToken: SERVICE_TOKEN,
      router
    });

    await gateway.start();

    try {
      const deps: AiTutorDependencies = {
        env: {
          AETERNUM_AI_GATEWAY_URL: `http://127.0.0.1:${p}`,
          AETERNUM_AI_GATEWAY_TOKEN: SERVICE_TOKEN,
          SUPABASE_URL: "https://test.supabase.co",
          SUPABASE_ANON_KEY: "test-anon",
          SUPABASE_SERVICE_ROLE_KEY: "test-service",
          GEMINI_API_KEY: "test-gemini"
        },
        createClient: createFakeClientFactory(db)
      };

      // Usuário com perfil atual em inst-b tenta enviar mensagem para conversa antiga vinculada a inst-a
      const req = new Request("http://localhost/ai-tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer same-user-token"
        },
        body: JSON.stringify({
          conversationId: "conv-user-inst-a",
          prompt: "Tentativa de acessar conversa de outro tenant"
        })
      });

      const res = await handleAiTutorRequest(req, deps);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.code).toBe("CONVERSATION_FORBIDDEN");

      // Gateway/Provider não deve ser acionado
      expect(providerCallCount).toBe(0);
      // Nenhuma mensagem salva
      expect(db.messages.length).toBe(0);
    } finally {
      await gateway.stop();
    }
  });

  it("2. AI_TUTOR_FALLBACK_METADATA_SEMANTICS: Router cloud fallback truthfully reflects primary vs final model/provider in SSE", async () => {
    const p = getPort();

    class FailingPrimaryLLM extends FakeLLMProvider {
      async generate(req: any, ctx?: any): Promise<any> {
        throw new ProviderUnavailableError("Ollama local indisponível.", this.metadata.id);
      }
    }

    class SuccessfulFallbackLLM extends FakeLLMProvider {
      async generate(req: any, ctx?: any) {
        return {
          text: "Resposta gerada com sucesso via Cloud Fallback.",
          modelId: "gemini-3.7-flash",
          providerId: "gemini-cloud",
          finishReason: "stop" as const
        };
      }
    }

    const primaryLLM = new FailingPrimaryLLM({ id: "ollama-local", location: "LOCAL" });
    const fallbackLLM = new SuccessfulFallbackLLM({ id: "gemini-cloud", location: "CLOUD" });

    const router = new ProviderRouter({
      llm: { primary: primaryLLM, fallback: fallbackLLM }
    });

    const gateway = new AeternumAIGateway({
      port: p,
      host: "127.0.0.1",
      authMode: "SERVICE_TOKEN",
      authToken: SERVICE_TOKEN,
      router
    });

    await gateway.start();

    try {
      const deps: AiTutorDependencies = {
        env: {
          AETERNUM_AI_GATEWAY_URL: `http://127.0.0.1:${p}`,
          AETERNUM_AI_GATEWAY_TOKEN: SERVICE_TOKEN,
          SUPABASE_URL: "https://test.supabase.co",
          SUPABASE_ANON_KEY: "test-anon",
          SUPABASE_SERVICE_ROLE_KEY: "test-service",
          GEMINI_API_KEY: "test-gemini"
        },
        createClient: createFakeClientFactory(db)
      };

      const req = new Request("http://localhost/ai-tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer same-user-token"
        },
        body: JSON.stringify({ prompt: "Pergunta que aciona fallback" })
      });

      const res = await handleAiTutorRequest(req, deps);
      expect(res.status).toBe(200);

      const rawStream = await res.text();
      const firstFrame = rawStream.split("\n\n")[0];
      const metadata = JSON.parse(firstFrame.replace("data: ", ""));

      // Verificação da verdade semântica dos metadados de fallback
      expect(metadata.fallbackUsed).toBe(true);
      expect(metadata.modelFallbackUsed).toBe(true);
      expect(metadata.providerFallbackUsed).toBe(true);
      expect(metadata.source).toBe("gemini-cloud");
      expect(metadata.model).toBe("gemini-3.7-flash");
      expect(metadata.primaryModel).toBe("ollama-local");
    } finally {
      await gateway.stop();
    }
  });

  it("3. GATEWAY_UNKNOWN_AUTH_MODE_FAIL_CLOSED: Gateway fails closed with 401 on unexpected auth mode", async () => {
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
      authMode: "CUSTOM_UNKNOWN_MODE" as any,
      router
    });

    await gateway.start();

    try {
      const res = await fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer some-token"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "oi" }] })
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe("unauthorized");
      expect(providerCallCount).toBe(0);
    } finally {
      await gateway.stop();
    }
  });

  it("4. AI_TUTOR_UTF8_64KB_BYTE_GUARD: Rejects multibyte payload exceeding 64KB UTF-8 byte limit with HTTP 413", async () => {
    const deps: AiTutorDependencies = {
      env: {
        AETERNUM_AI_GATEWAY_URL: "http://127.0.0.1:8081",
        AETERNUM_AI_GATEWAY_TOKEN: SERVICE_TOKEN,
        SUPABASE_URL: "https://test.supabase.co",
        SUPABASE_ANON_KEY: "test-anon",
        SUPABASE_SERVICE_ROLE_KEY: "test-service"
      },
      createClient: createFakeClientFactory(db)
    };

    // 20.000 emojis (cada emoji tem 2 caracteres JS UTF-16 mas 4 bytes UTF-8)
    // Contagem de caracteres: 40.000 (abaixo de 64.000)
    // Contagem de bytes UTF-8: 80.000 (acima de 64.000 bytes)
    const multibyteLargeString = "🧠".repeat(20_000);
    const jsonBody = JSON.stringify({ prompt: multibyteLargeString });

    expect(jsonBody.length).toBeLessThan(64_000); // Caracteres JS < 64.000
    expect(new TextEncoder().encode(jsonBody).byteLength).toBeGreaterThan(64_000); // Bytes UTF-8 > 64.000

    const req = new Request("http://localhost/ai-tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer same-user-token"
      },
      body: jsonBody
    });

    const res = await handleAiTutorRequest(req, deps);
    expect(res.status).toBe(413);
    const json = await res.json();
    expect(json.error).toContain("limite");
  });
});
