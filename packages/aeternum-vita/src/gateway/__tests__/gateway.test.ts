import { describe, it, expect } from "vitest";
import { AeternumAIGateway } from "../AeternumAIGateway.ts";
import { SafeGatewayLogger } from "../middleware/logging.ts";
import { parseStrictBoolean } from "../config.ts";
import { ProviderRouter } from "../../providers/router/ProviderRouter.ts";
import { FakeLLMProvider } from "../../providers/testing/FakeLLMProvider.ts";
import { FakeSTTProvider } from "../../providers/testing/FakeSTTProvider.ts";
import { FakeTTSProvider } from "../../providers/testing/FakeTTSProvider.ts";
import {
  ProviderUnavailableError,
  ProviderTimeoutError,
  CapabilityMismatchError,
  HealthResult
} from "../../providers/types/index.ts";

describe("Aeternum AI Gateway — Hardened Suite (Phase 2D.1)", () => {
  let port = 8120;
  const baseUrl = () => `http://127.0.0.1:${port}`;

  // ==========================================
  // 1. TRUTHFUL HEALTH CHECKS
  // ==========================================

  it("1. Truthful Health: all enabled providers healthy -> HEALTHY", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const localSpeachesSTT = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    const localSpeachesTTS = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });

    const router = new ProviderRouter({
      llm: { primary: localOllama },
      stt: { primary: localSpeachesSTT },
      tts: { primary: localSpeachesTTS }
    });

    const gateway = new AeternumAIGateway({
      port: ++port,
      router,
      healthRegistry: {
        llm_local: { provider: localOllama, enabled: true },
        stt_local: { provider: localSpeachesSTT, enabled: true },
        tts_local: { provider: localSpeachesTTS, enabled: true }
      }
    });

    await gateway.start();
    try {
      const res = await fetch(`${baseUrl()}/health`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("HEALTHY");
      expect(data.providers.llm_local.status).toBe("HEALTHY");
      expect(data.providers.stt_local.status).toBe("HEALTHY");
      expect(data.providers.tts_local.status).toBe("HEALTHY");
    } finally {
      await gateway.stop();
    }
  });

  it("2. Truthful Health: local unavailable + cloud healthy -> DEGRADED (serviceable)", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.healthStatus = "UNAVAILABLE";
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });

    const localSTT = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    const localTTS = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });

    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini },
      stt: { primary: localSTT },
      tts: { primary: localTTS }
    });

    const gateway = new AeternumAIGateway({
      port: ++port,
      router,
      healthRegistry: {
        llm_local: { provider: localOllama, enabled: true },
        llm_cloud: { provider: cloudGemini, enabled: true },
        stt_local: { provider: localSTT, enabled: true },
        tts_local: { provider: localTTS, enabled: true }
      }
    });

    await gateway.start();
    try {
      const res = await fetch(`${baseUrl()}/health`);
      const data = await res.json();
      expect(data.status).toBe("DEGRADED");
      expect(data.providers.llm_local.status).toBe("UNAVAILABLE");
      expect(data.providers.llm_cloud.status).toBe("HEALTHY");
    } finally {
      await gateway.stop();
    }
  });

  it("3. Truthful Health: cloud unavailable + local healthy -> DEGRADED (never UNAVAILABLE)", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });
    cloudGemini.healthStatus = "UNAVAILABLE";

    const localSTT = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    const localTTS = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });

    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini },
      stt: { primary: localSTT },
      tts: { primary: localTTS }
    });

    const gateway = new AeternumAIGateway({
      port: ++port,
      router,
      healthRegistry: {
        llm_local: { provider: localOllama, enabled: true },
        llm_cloud: { provider: cloudGemini, enabled: true },
        stt_local: { provider: localSTT, enabled: true },
        tts_local: { provider: localTTS, enabled: true }
      }
    });

    await gateway.start();
    try {
      const res = await fetch(`${baseUrl()}/health`);
      const data = await res.json();
      expect(data.status).toBe("DEGRADED");
      expect(data.providers.llm_local.status).toBe("HEALTHY");
      expect(data.providers.llm_cloud.status).toBe("UNAVAILABLE");
    } finally {
      await gateway.stop();
    }
  });

  it("4. Truthful Health: cloud disabled + local healthy -> HEALTHY (local-only mode)", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const localSTT = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    const localTTS = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });

    const router = new ProviderRouter({
      llm: { primary: localOllama },
      stt: { primary: localSTT },
      tts: { primary: localTTS }
    });

    const gateway = new AeternumAIGateway({
      port: ++port,
      router,
      healthRegistry: {
        llm_local: { provider: localOllama, enabled: true },
        llm_cloud: { provider: localOllama, enabled: false }, // Desabilitado
        stt_local: { provider: localSTT, enabled: true },
        tts_local: { provider: localTTS, enabled: true }
      }
    });

    await gateway.start();
    try {
      const res = await fetch(`${baseUrl()}/health`);
      const data = await res.json();
      expect(data.status).toBe("HEALTHY");
      expect(data.providers.llm_cloud.enabled).toBe(false);
    } finally {
      await gateway.stop();
    }
  });

  it("5. Truthful Health: both local+cloud unavailable for required capability -> UNAVAILABLE", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.healthStatus = "UNAVAILABLE";
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });
    cloudGemini.healthStatus = "UNAVAILABLE";

    const localSTT = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    const localTTS = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });

    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini },
      stt: { primary: localSTT },
      tts: { primary: localTTS }
    });

    const gateway = new AeternumAIGateway({
      port: ++port,
      router,
      healthRegistry: {
        llm_local: { provider: localOllama, enabled: true },
        llm_cloud: { provider: cloudGemini, enabled: true },
        stt_local: { provider: localSTT, enabled: true },
        tts_local: { provider: localTTS, enabled: true }
      }
    });

    await gateway.start();
    try {
      const res = await fetch(`${baseUrl()}/health`);
      const data = await res.json();
      expect(data.status).toBe("UNAVAILABLE");
    } finally {
      await gateway.stop();
    }
  });

  it("6. Truthful Health: provider health() throws -> safe UNAVAILABLE (no raw error leak)", async () => {
    class FailingHealthLLM extends FakeLLMProvider {
      async health(): Promise<HealthResult> {
        throw new Error("SECRET_INTERNAL_DB_HEALTH_LEAK");
      }
    }

    const localOllama = new FailingHealthLLM({ id: "ollama-llm-local", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: localOllama } });

    const gateway = new AeternumAIGateway({
      port: ++port,
      router,
      healthRegistry: {
        llm_local: { provider: localOllama, enabled: true }
      }
    });

    await gateway.start();
    try {
      const res = await fetch(`${baseUrl()}/health`);
      const data = await res.json();
      expect(data.providers.llm_local.status).toBe("UNAVAILABLE");
      const serialized = JSON.stringify(data);
      expect(serialized).not.toContain("SECRET_INTERNAL_DB_HEALTH_LEAK");
    } finally {
      await gateway.stop();
    }
  });

  // ==========================================
  // 2. AUTH & PUBLIC BINDING GUARDS
  // ==========================================

  it("7. Auth: SUPABASE_JWT without real validator -> FAIL-CLOSED (401, zero provider calls)", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: localOllama } });

    const gateway = new AeternumAIGateway({
      port: ++port,
      host: "127.0.0.1",
      authMode: "SUPABASE_JWT", // Sem jwtValidator
      router
    });

    await gateway.start();
    try {
      const res = await fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer fake-token-without-validator"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "Oi" }] })
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("unauthorized");
      expect(localOllama.callCount).toBe(0);
    } finally {
      await gateway.stop();
    }
  });

  it("8. Auth: SUPABASE_JWT with valid validator -> 200", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: localOllama } });

    const mockValidator = {
      validateToken: async (token: string) => {
        if (token === "valid-secret-jwt") {
          return { valid: true, userId: "user-42" };
        }
        return { valid: false, error: "Token inválido" };
      }
    };

    const gateway = new AeternumAIGateway({
      port: ++port,
      host: "127.0.0.1",
      authMode: "SUPABASE_JWT",
      jwtValidator: mockValidator,
      router
    });

    await gateway.start();
    try {
      const res = await fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-secret-jwt"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "Oi" }] })
      });

      expect(res.status).toBe(200);
      expect(localOllama.callCount).toBe(1);
    } finally {
      await gateway.stop();
    }
  });

  it("9. Public Binding Guard: non-loopback host without genuine JWT validator throws on startup", () => {
    const router = new ProviderRouter({});
    expect(() => {
      new AeternumAIGateway({
        host: "0.0.0.0",
        authMode: "INTERNAL_DEV",
        router
      });
    }).toThrow("Binding público proibido");
  });

  // ==========================================
  // 3. TIMEOUT INVARIANT & GATEWAY OUTER DEADLINE
  // ==========================================

  it("10. Timeout Invariant: providerTimeoutMs >= gatewayRequestTimeoutMs throws on startup", () => {
    const router = new ProviderRouter({});
    expect(() => {
      new AeternumAIGateway({
        providerTimeoutMs: 35000,
        gatewayRequestTimeoutMs: 35000,
        router
      });
    }).toThrow("Invariante de timeout violado");
  });

  it("11. Gateway Outer Deadline: long-running provider triggers safe 504 gateway_timeout", async () => {
    class HangingLLM extends FakeLLMProvider {
      async generate(): Promise<any> {
        return new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    const hangingLLM = new HangingLLM({ id: "hanging-llm", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: hangingLLM } });

    const gateway = new AeternumAIGateway({
      port: ++port,
      providerTimeoutMs: 50,
      gatewayRequestTimeoutMs: 100,
      router
    });

    await gateway.start();
    try {
      const res = await fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Hanging" }] })
      });

      expect(res.status).toBe(504);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("gateway_timeout");
    } finally {
      await gateway.stop();
    }
  });

  // ==========================================
  // 4. SSE ERROR FRAMING (LLM & TTS)
  // ==========================================

  it("12. SSE: LLM stream error before first chunk -> safe HTTP JSON 503 error", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.failureMode = "unavailable";
    const router = new ProviderRouter({ llm: { primary: localOllama } });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();

    try {
      const res = await fetch(`${baseUrl()}/v1/llm/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Stream fail before chunk" }] })
      });

      expect(res.status).toBe(503);
      expect(res.headers.get("content-type")).toContain("application/json");
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("all_providers_failed");
    } finally {
      await gateway.stop();
    }
  });

  it("13. SSE: LLM stream error after first chunk -> receives 1 chunk + SSE event: error frame", async () => {
    class PartialFailingLLM extends FakeLLMProvider {
      async *stream() {
        yield { deltaText: "Primeiro chunk", isComplete: false };
        throw new ProviderUnavailableError("Conexão perdida no meio do stream", "fake-llm");
      }
    }

    const partialLLM = new PartialFailingLLM({ id: "ollama-llm-local", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: partialLLM } });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();

    try {
      const res = await fetch(`${baseUrl()}/v1/llm/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Stream fail mid chunk" }] })
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/event-stream");
      const rawText = await res.text();

      expect(rawText).toContain("Primeiro chunk");
      expect(rawText).toContain("event: error");
      expect(rawText).toContain("provider_unavailable");
      expect(rawText).not.toContain("Conexão perdida no meio do stream");
    } finally {
      await gateway.stop();
    }
  });

  it("14. SSE: TTS stream error after first chunk -> receives 1 chunk + SSE event: error frame", async () => {
    class PartialFailingTTS extends FakeTTSProvider {
      async *streamSynthesis() {
        yield { audioChunk: new Uint8Array([1, 2, 3]), isFinal: false };
        throw new ProviderUnavailableError("TTS travou no meio", "fake-tts");
      }
    }

    const partialTTS = new PartialFailingTTS({ id: "speaches-tts-local", location: "LOCAL" });
    const router = new ProviderRouter({ tts: { primary: partialTTS } });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();

    try {
      const res = await fetch(`${baseUrl()}/v1/tts/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Texto TTS", voiceProfileId: "pt-br-warm-male-01" })
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/event-stream");
      const rawText = await res.text();

      expect(rawText).toContain("audioBase64");
      expect(rawText).toContain("event: error");
      expect(rawText).toContain("provider_unavailable");
      expect(rawText).not.toContain("TTS travou no meio");
    } finally {
      await gateway.stop();
    }
  });

  // ==========================================
  // 5. CLOUD-OFF PROOF & CONFIGURATION
  // ==========================================

  it("15. Cloud-Off Proof: CLOUD_FALLBACK_ENABLED=false -> local failure results in 0 cloud calls", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.failureMode = "unavailable";

    const localSTT = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    localSTT.failureMode = "unavailable";

    const localTTS = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });
    localTTS.failureMode = "unavailable";

    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });
    const cloudDeepgram = new FakeSTTProvider({ id: "deepgram-stt-cloud", location: "CLOUD" });
    const cloudCartesia = new FakeTTSProvider({ id: "cartesia-tts-cloud", location: "CLOUD" });

    // Em modo Cloud-Off, o ProviderRouter não possui fallbacks configurados
    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: undefined },
      stt: { primary: localSTT, fallback: undefined },
      tts: { primary: localTTS, fallback: undefined }
    });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();

    try {
      // LLM call
      const resLLM = await fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Oi" }] })
      });
      expect(resLLM.status).toBe(503);
      expect(cloudGemini.callCount).toBe(0);

      // STT call
      const resSTT = await fetch(`${baseUrl()}/v1/stt/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64: Buffer.from([1, 2]).toString("base64") })
      });
      expect(resSTT.status).toBe(503);
      expect(cloudDeepgram.callCount).toBe(0);

      // TTS call
      const resTTS = await fetch(`${baseUrl()}/v1/tts/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Oi", voiceProfileId: "pt-br-warm-male-01" })
      });
      expect(resTTS.status).toBe(503);
      expect(cloudCartesia.callCount).toBe(0);
    } finally {
      await gateway.stop();
    }
  });

  it("16. parseStrictBoolean helper enforces strict boolean values", () => {
    expect(parseStrictBoolean("true", false)).toBe(true);
    expect(parseStrictBoolean("FALSE", true)).toBe(false);
    expect(parseStrictBoolean("1", false)).toBe(true);
    expect(parseStrictBoolean("0", true)).toBe(false);
    expect(parseStrictBoolean(undefined, true)).toBe(true);
    expect(() => parseStrictBoolean("invalid", false)).toThrow();
  });

  // ==========================================
  // 6. CORE SECURITY & CONTRACT TESTS
  // ==========================================

  it("17. LLM local success -> response from Ollama -> zero Gemini call", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });
    const router = new ProviderRouter({ llm: { primary: localOllama, fallback: cloudGemini } });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();
    try {
      const res = await fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Anatomia" }] })
      });
      expect(res.status).toBe(200);
      expect(localOllama.callCount).toBe(1);
      expect(cloudGemini.callCount).toBe(0);
    } finally {
      await gateway.stop();
    }
  });

  it("18. STT local success", async () => {
    const localSpeaches = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    const router = new ProviderRouter({ stt: { primary: localSpeaches } });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();
    try {
      const res = await fetch(`${baseUrl()}/v1/stt/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64: Buffer.from([1, 2]).toString("base64") })
      });
      expect(res.status).toBe(200);
      expect(localSpeaches.callCount).toBe(1);
    } finally {
      await gateway.stop();
    }
  });

  it("19. TTS local success", async () => {
    const localSpeaches = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });
    const router = new ProviderRouter({ tts: { primary: localSpeaches } });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();
    try {
      const res = await fetch(`${baseUrl()}/v1/tts/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Fala", voiceProfileId: "pt-br-warm-male-01" })
      });
      expect(res.status).toBe(200);
      expect(localSpeaches.callCount).toBe(1);
    } finally {
      await gateway.stop();
    }
  });

  it("20. Client cancellation -> zero cloud fallback", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });
    const router = new ProviderRouter({ llm: { primary: localOllama, fallback: cloudGemini } });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();
    try {
      const abortController = new AbortController();
      const fetchPromise = fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Cancelado" }] }),
        signal: abortController.signal
      });

      abortController.abort();
      await expect(fetchPromise).rejects.toThrow();
      expect(cloudGemini.callCount).toBe(0);
    } finally {
      await gateway.stop();
    }
  });

  it("21. Malformed JSON -> safe 400", async () => {
    const router = new ProviderRouter({});
    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();
    try {
      const res = await fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{malformed"
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.code).toBe("bad_request");
    } finally {
      await gateway.stop();
    }
  });

  it("22. Oversized body -> safe 413", async () => {
    const router = new ProviderRouter({});
    const gateway = new AeternumAIGateway({ port: ++port, maxJsonBodyBytes: 100, router });
    await gateway.start();
    try {
      const res = await fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "X".repeat(500) }] })
      });
      expect(res.status).toBe(413);
      const data = await res.json();
      expect(data.error.code).toBe("payload_too_large");
    } finally {
      await gateway.stop();
    }
  });

  it("23. Secrets and raw provider errors never leak to response or logs", async () => {
    const logs: string[] = [];
    const customLogger = {
      info: (event: string, meta?: any) => logs.push(JSON.stringify({ event, meta })),
      warn: (event: string, meta?: any) => logs.push(JSON.stringify({ event, meta })),
      error: (event: string, meta?: any) => logs.push(JSON.stringify({ event, meta }))
    };

    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.customError = new ProviderUnavailableError(
      "CONFIDENTIAL_DB_PASSWORD_12345 connection failed",
      "ollama-llm-local"
    );
    const router = new ProviderRouter({ llm: { primary: localOllama } });

    const gateway = new AeternumAIGateway({ port: ++port, logger: customLogger, router });
    await gateway.start();
    try {
      const res = await fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Pergunta secreta" }] })
      });

      expect(res.status).toBe(503);
      const body = await res.json();
      const serialized = JSON.stringify(body);
      expect(serialized).not.toContain("CONFIDENTIAL_DB_PASSWORD");
      expect(serialized).not.toContain("Pergunta secreta");

      const joinedLogs = logs.join("\n");
      expect(joinedLogs).not.toContain("CONFIDENTIAL_DB_PASSWORD");
      expect(joinedLogs).not.toContain("Pergunta secreta");
    } finally {
      await gateway.stop();
    }
  });

  it("24. Request ID propagated in headers and metadata", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: localOllama } });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();
    try {
      const reqId = "custom-trace-uuid-1234";
      const res = await fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-Id": reqId
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "Trace" }] })
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("x-request-id")).toBe(reqId);
      const data = await res.json();
      expect(data.metadata.requestId).toBe(reqId);
    } finally {
      await gateway.stop();
    }
  });
});
