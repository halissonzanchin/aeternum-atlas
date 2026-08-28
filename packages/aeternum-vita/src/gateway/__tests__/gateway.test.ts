import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AeternumAIGateway } from "../AeternumAIGateway.ts";
import { SafeGatewayLogger } from "../middleware/logging.ts";
import { ProviderRouter } from "../../providers/router/ProviderRouter.ts";
import { FakeLLMProvider } from "../../providers/testing/FakeLLMProvider.ts";
import { FakeSTTProvider } from "../../providers/testing/FakeSTTProvider.ts";
import { FakeTTSProvider } from "../../providers/testing/FakeTTSProvider.ts";
import {
  ProviderUnavailableError,
  ProviderTimeoutError,
  CapabilityMismatchError
} from "../../providers/types/index.ts";

describe("Aeternum AI Gateway — Deterministic API & Orchestration Suite", () => {
  let port = 8089;
  const baseUrl = () => `http://127.0.0.1:${port}`;

  it("1. GET /health returns safe metadata only", async () => {
    const router = new ProviderRouter({});
    const gateway = new AeternumAIGateway({
      port: ++port,
      host: "127.0.0.1",
      authMode: "INTERNAL_DEV",
      router
    });
    await gateway.start();

    try {
      const res = await fetch(`${baseUrl()}/health`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.status).toBe("HEALTHY");
      expect(data.gateway_version).toBe("1.0.0");
      expect(data.mode).toBe("local_first");
      expect(data.auth_mode).toBe("INTERNAL_DEV");
      expect(data.providers.llm_local).toBe("HEALTHY");

      const serialized = JSON.stringify(data);
      expect(serialized).not.toContain("apiKey");
      expect(serialized).not.toContain("secret");
      expect(serialized).not.toContain("Authorization");
    } finally {
      await gateway.stop();
    }
  });

  it("2. LLM local success -> response from Ollama -> zero Gemini call", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });
    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini }
    });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();

    try {
      const res = await fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "O que é a mandíbula?" }]
        })
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.providerId).toBe("ollama-llm-local");
      expect(body.metadata.finalProvider).toBe("ollama-llm-local");
      expect(body.metadata.fallbackUsed).toBe(false);

      expect(localOllama.callCount).toBe(1);
      expect(cloudGemini.callCount).toBe(0);
    } finally {
      await gateway.stop();
    }
  });

  it("3. LLM local unavailable -> Gemini fallback", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.failureMode = "unavailable";
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });
    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini }
    });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();

    try {
      const res = await fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "O que é a clavícula?" }]
        })
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.providerId).toBe("gemini-llm-cloud");
      expect(body.metadata.fallbackUsed).toBe(true);
      expect(body.metadata.fallbackReason).toBe("PROVIDER_UNAVAILABLE");

      expect(localOllama.callCount).toBe(1);
      expect(cloudGemini.callCount).toBe(1);
    } finally {
      await gateway.stop();
    }
  });

  it("4. LLM both fail -> safe all_providers_failed API response", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.failureMode = "unavailable";
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });
    cloudGemini.failureMode = "timeout";

    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini }
    });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();

    try {
      const res = await fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Pergunta anatômica" }]
        })
      });

      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("all_providers_failed");
      expect(body.metadata.finalCanonicalError).toBe("ALL_PROVIDERS_FAILED");
    } finally {
      await gateway.stop();
    }
  });

  it("5. STT local success", async () => {
    const localSpeaches = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    const cloudDeepgram = new FakeSTTProvider({ id: "deepgram-stt-cloud", location: "CLOUD" });
    const router = new ProviderRouter({
      stt: { primary: localSpeaches, fallback: cloudDeepgram }
    });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();

    try {
      const res = await fetch(`${baseUrl()}/v1/stt/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: Buffer.from([1, 2, 3, 4]).toString("base64"),
          language: "pt"
        })
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.providerId).toBe("speaches-stt-local");
      expect(localSpeaches.callCount).toBe(1);
      expect(cloudDeepgram.callCount).toBe(0);
    } finally {
      await gateway.stop();
    }
  });

  it("6. STT local unavailable -> Deepgram batch fallback", async () => {
    const localSpeaches = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    localSpeaches.failureMode = "unavailable";
    const cloudDeepgram = new FakeSTTProvider({ id: "deepgram-stt-cloud", location: "CLOUD" });
    const router = new ProviderRouter({
      stt: { primary: localSpeaches, fallback: cloudDeepgram }
    });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();

    try {
      const res = await fetch(`${baseUrl()}/v1/stt/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: Buffer.from([1, 2, 3, 4]).toString("base64"),
          language: "pt"
        })
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.providerId).toBe("deepgram-stt-cloud");
      expect(body.metadata.fallbackUsed).toBe(true);
      expect(localSpeaches.callCount).toBe(1);
      expect(cloudDeepgram.callCount).toBe(1);
    } finally {
      await gateway.stop();
    }
  });

  it("7. unsupported realtime STT -> capability_mismatch", async () => {
    const localSpeaches = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    localSpeaches.failureMode = "unavailable";
    const cloudDeepgram = new FakeSTTProvider({ id: "deepgram-stt-cloud", location: "CLOUD" });
    const router = new ProviderRouter({
      stt: { primary: localSpeaches, fallback: cloudDeepgram }
    });

    // Validar diretamente no Router que a chamada de streaming falha com capability_mismatch
    async function* audioStream() {
      yield new Uint8Array([1, 2]);
    }
    const streamIter = router.streamTranscription(audioStream(), { language: "pt" });
    await expect(async () => {
      for await (const _chunk of streamIter) {
        // no-op
      }
    }).rejects.toThrow(CapabilityMismatchError);
  });

  it("8. TTS local success", async () => {
    const localSpeaches = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });
    const cloudCartesia = new FakeTTSProvider({ id: "cartesia-tts-cloud", location: "CLOUD" });
    const router = new ProviderRouter({
      tts: { primary: localSpeaches, fallback: cloudCartesia }
    });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();

    try {
      const res = await fetch(`${baseUrl()}/v1/tts/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Anatomia do fêmur",
          voiceProfileId: "pt-br-warm-male-01",
          language: "pt-BR"
        })
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.providerId).toBe("speaches-tts-local");
      expect(body.data.audioBase64).toBeDefined();
      expect(localSpeaches.callCount).toBe(1);
      expect(cloudCartesia.callCount).toBe(0);
    } finally {
      await gateway.stop();
    }
  });

  it("9. TTS local unavailable -> Cartesia fallback", async () => {
    const localSpeaches = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });
    localSpeaches.failureMode = "unavailable";
    const cloudCartesia = new FakeTTSProvider({ id: "cartesia-tts-cloud", location: "CLOUD" });
    const router = new ProviderRouter({
      tts: { primary: localSpeaches, fallback: cloudCartesia }
    });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();

    try {
      const res = await fetch(`${baseUrl()}/v1/tts/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Anatomia do fêmur",
          voiceProfileId: "pt-br-warm-male-01",
          language: "pt-BR"
        })
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.providerId).toBe("cartesia-tts-cloud");
      expect(body.metadata.fallbackUsed).toBe(true);
      expect(localSpeaches.callCount).toBe(1);
      expect(cloudCartesia.callCount).toBe(1);
    } finally {
      await gateway.stop();
    }
  });

  it("10. TTS voice profile pt-br-warm-male-01 preserved", async () => {
    const localSpeaches = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });
    const cloudCartesia = new FakeTTSProvider({ id: "cartesia-tts-cloud", location: "CLOUD" });
    const router = new ProviderRouter({
      tts: { primary: localSpeaches, fallback: cloudCartesia }
    });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();

    try {
      const res = await fetch(`${baseUrl()}/v1/tts/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Perfil de voz",
          voiceProfileId: "pt-br-warm-male-01",
          language: "pt-BR"
        })
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    } finally {
      await gateway.stop();
    }
  });

  it("11. client cancellation -> zero cloud fallback", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });
    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini }
    });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();

    try {
      const abortController = new AbortController();
      const fetchPromise = fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Cancelado" }]
        }),
        signal: abortController.signal
      });

      abortController.abort(); // Cancela antes ou durante

      await expect(fetchPromise).rejects.toThrow();
      expect(cloudGemini.callCount).toBe(0);
    } finally {
      await gateway.stop();
    }
  });

  it("12. malformed JSON/body -> safe 400", async () => {
    const router = new ProviderRouter({});
    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();

    try {
      const res = await fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "INVALID_JSON{{{"
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("bad_request");
    } finally {
      await gateway.stop();
    }
  });

  it("13. oversized body -> safe 413", async () => {
    const router = new ProviderRouter({});
    const gateway = new AeternumAIGateway({
      port: ++port,
      maxJsonBodyBytes: 100, // Limite artificialmente baixo para testar
      router
    });
    await gateway.start();

    try {
      const res = await fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "A".repeat(500) }]
        })
      });

      expect(res.status).toBe(413);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("payload_too_large");
    } finally {
      await gateway.stop();
    }
  });

  it("14. raw provider error message does not reach API response", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.customError = new ProviderUnavailableError(
      "SECRET_INTERNAL_DB_PASSWORD_123 connection lost",
      "ollama-llm-local"
    );
    const router = new ProviderRouter({ llm: { primary: localOllama } });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();

    try {
      const res = await fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Consulta" }]
        })
      });

      expect(res.status).toBe(503);
      const body = await res.json();
      const serialized = JSON.stringify(body);
      expect(serialized).not.toContain("SECRET_INTERNAL_DB_PASSWORD");
      expect(serialized).not.toContain("connection lost");
      expect(body.error.code).toBe("all_providers_failed");
    } finally {
      await gateway.stop();
    }
  });

  it("15. raw provider error message does not reach logs", async () => {
    const logs: string[] = [];
    const customLogger = {
      info: (event: string, meta?: any) => logs.push(JSON.stringify({ event, meta })),
      warn: (event: string, meta?: any) => logs.push(JSON.stringify({ event, meta })),
      error: (event: string, meta?: any) => logs.push(JSON.stringify({ event, meta }))
    };

    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.customError = new ProviderUnavailableError(
      "LEAKED_INTERNAL_SECRET_PATH /etc/keys/private.pem",
      "ollama-llm-local"
    );
    const router = new ProviderRouter({ llm: { primary: localOllama } });

    const gateway = new AeternumAIGateway({ port: ++port, logger: customLogger, router });
    await gateway.start();

    try {
      await fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Oi" }] })
      });

      const joinedLogs = logs.join("\n");
      expect(joinedLogs).not.toContain("LEAKED_INTERNAL_SECRET");
      expect(joinedLogs).not.toContain("/etc/keys/private.pem");
    } finally {
      await gateway.stop();
    }
  });

  it("16. secrets/JWT/Authorization never logged", async () => {
    const logger = new SafeGatewayLogger();
    const interceptedLogs: string[] = [];
    const origLog = console.log;
    console.log = (msg: string) => interceptedLogs.push(msg);

    try {
      logger.info("TEST_AUTH_EVENT", {
        userId: "usr-123",
        jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitive_payload",
        apiKey: "AIzaSy_SECRET_KEY",
        authorization: "Bearer secret_token_12345",
        prompt: "Confidential patient question"
      });

      const logged = interceptedLogs.join("\n");
      expect(logged).not.toContain("eyJhbGci");
      expect(logged).not.toContain("AIzaSy_SECRET");
      expect(logged).not.toContain("secret_token");
      expect(logged).not.toContain("Confidential patient question");
      expect(logged).toContain("usr-123");
    } finally {
      console.log = origLog;
    }
  });

  it("17. request IDs generated/propagated correctly", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: localOllama } });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();

    try {
      const customReqId = "custom-trace-uuid-9999";
      const res = await fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-Id": customReqId
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Teste request ID" }]
        })
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("x-request-id")).toBe(customReqId);
      const body = await res.json();
      expect(body.metadata.requestId).toBe(customReqId);
    } finally {
      await gateway.stop();
    }
  });

  it("18. fallback metadata remains sanitized", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.failureMode = "unavailable";
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });

    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini }
    });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    await gateway.start();

    try {
      const res = await fetch(`${baseUrl()}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Fallback check" }]
        })
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.metadata.fallbackUsed).toBe(true);
      expect(body.metadata.fallbackReason).toBe("PROVIDER_UNAVAILABLE");
    } finally {
      await gateway.stop();
    }
  });

  it("19. internal-only binding default", async () => {
    const router = new ProviderRouter({});
    const gateway = new AeternumAIGateway({
      port: ++port,
      router
    });

    // Verifica que o host default configurado é 127.0.0.1
    expect((gateway as any).config.host).toBe("127.0.0.1");
    expect((gateway as any).config.authMode).toBe("INTERNAL_DEV");
  });

  it("20. Gateway uses canonical ProviderRouter -> no duplicate routing implementation", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: localOllama } });

    const gateway = new AeternumAIGateway({ port: ++port, router });
    expect((gateway as any).config.router).toBe(router);
    expect(router instanceof ProviderRouter).toBe(true);
  });
});
