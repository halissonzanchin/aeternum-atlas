import { describe, it, expect } from "vitest";
import { ProviderRouter } from "../router/ProviderRouter.ts";
import { RouteMetadata } from "../router/types.ts";
import { FakeLLMProvider } from "../testing/FakeLLMProvider.ts";
import { FakeSTTProvider } from "../testing/FakeSTTProvider.ts";
import { FakeTTSProvider } from "../testing/FakeTTSProvider.ts";
import {
  ProviderCancelledError,
  ProviderUnavailableError,
  ProviderTimeoutError,
  ProviderInvalidResponseError,
  CapabilityMismatchError,
  AllProvidersFailedError
} from "../types/index.ts";

describe("Aeternum Provider Router — Deterministic Routing & Fallback Suite", () => {
  // ==========================================
  // LLM TESTS (1-6)
  // ==========================================

  it("1. LLM local healthy -> Ollama selected -> Gemini not called", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });

    let routeMetadata: RouteMetadata | undefined;
    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini },
      onRouteComplete: (meta) => {
        routeMetadata = meta;
      }
    });

    const res = await router.generate({
      messages: [{ role: "user", content: "O que é o úmero?" }]
    });

    expect(res.providerId).toBe("ollama-llm-local");
    expect(localOllama.callCount).toBe(1);
    expect(cloudGemini.callCount).toBe(0);

    expect(routeMetadata).toBeDefined();
    expect(routeMetadata?.primaryProvider).toBe("ollama-llm-local");
    expect(routeMetadata?.finalProvider).toBe("ollama-llm-local");
    expect(routeMetadata?.fallbackUsed).toBe(false);
    expect(routeMetadata?.attempts.length).toBe(1);
    expect(routeMetadata?.attempts[0].canonicalResult).toBe("SUCCESS");
  });

  it("2. LLM local unavailable -> Gemini selected", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.failureMode = "unavailable";
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });

    let routeMetadata: RouteMetadata | undefined;
    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini },
      onRouteComplete: (meta) => {
        routeMetadata = meta;
      }
    });

    const res = await router.generate({
      messages: [{ role: "user", content: "O que é a tíbia?" }]
    });

    expect(res.providerId).toBe("gemini-llm-cloud");
    expect(localOllama.callCount).toBe(1);
    expect(cloudGemini.callCount).toBe(1);

    expect(routeMetadata?.fallbackUsed).toBe(true);
    expect(routeMetadata?.finalProvider).toBe("gemini-llm-cloud");
    expect(routeMetadata?.attempts.length).toBe(2);
    expect(routeMetadata?.attempts[0].canonicalResult).toBe("FAILED");
    expect(routeMetadata?.attempts[1].canonicalResult).toBe("SUCCESS");
  });

  it("3. LLM local timeout -> Gemini selected", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.failureMode = "timeout";
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });

    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini }
    });

    const res = await router.generate({
      messages: [{ role: "user", content: "Explique a artéria femoral" }]
    });

    expect(res.providerId).toBe("gemini-llm-cloud");
    expect(localOllama.callCount).toBe(1);
    expect(cloudGemini.callCount).toBe(1);
  });

  it("4. LLM local invalid provider response -> Gemini selected", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.failureMode = "invalid_response";
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });

    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini }
    });

    const res = await router.generate({
      messages: [{ role: "user", content: "Explique o nervo ciático" }]
    });

    expect(res.providerId).toBe("gemini-llm-cloud");
    expect(localOllama.callCount).toBe(1);
    expect(cloudGemini.callCount).toBe(1);
  });

  it("5. LLM user cancellation -> NO Gemini call (Barge-In Guarantee)", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });

    const abortController = new AbortController();
    abortController.abort(); // Simula cancelamento do usuário por voz/barge-in

    let routeMetadata: RouteMetadata | undefined;
    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini },
      onRouteComplete: (meta) => {
        routeMetadata = meta;
      }
    });

    await expect(
      router.generate(
        { messages: [{ role: "user", content: "Texto que será cancelado" }] },
        { requestId: "req-1", signal: abortController.signal }
      )
    ).rejects.toThrow(ProviderCancelledError);

    // Invariante de Segurança Crítico: Cancelamento NUNCA deve chamar o fallback na nuvem
    expect(cloudGemini.callCount).toBe(0);
    expect(routeMetadata?.fallbackUsed).toBe(false);
    expect(routeMetadata?.attempts[0].canonicalResult).toBe("CANCELLED");
    expect(routeMetadata?.finalCanonicalError).toBe("PROVIDER_CANCELLED");
  });

  it("6. LLM local fail + Gemini HTTP 503 -> ALL_PROVIDERS_FAILED", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.failureMode = "unavailable";

    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });
    cloudGemini.customError = new ProviderUnavailableError(
      "Serviço indisponível [HTTP 503]",
      "gemini-llm-cloud"
    );

    let routeMetadata: RouteMetadata | undefined;
    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini },
      onRouteComplete: (meta) => {
        routeMetadata = meta;
      }
    });

    await expect(
      router.generate({ messages: [{ role: "user", content: "Consulta anatômica" }] })
    ).rejects.toThrow(AllProvidersFailedError);

    expect(localOllama.callCount).toBe(1);
    expect(cloudGemini.callCount).toBe(1);
    expect(routeMetadata?.attempts.length).toBe(2);
    expect(routeMetadata?.finalCanonicalError).toBe("ALL_PROVIDERS_FAILED");
  });

  // ==========================================
  // STT TESTS (7-10)
  // ==========================================

  it("7. STT local healthy -> Speaches selected", async () => {
    const localSpeaches = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    const cloudDeepgram = new FakeSTTProvider({ id: "deepgram-stt-cloud", location: "CLOUD" });

    const router = new ProviderRouter({
      stt: { primary: localSpeaches, fallback: cloudDeepgram }
    });

    const res = await router.transcribe({
      audioBuffer: new Uint8Array([1, 2, 3]),
      language: "pt"
    });

    expect(res.providerId).toBe("speaches-stt-local");
    expect(localSpeaches.callCount).toBe(1);
    expect(cloudDeepgram.callCount).toBe(0);
  });

  it("8. STT local unavailable -> Deepgram batch selected", async () => {
    const localSpeaches = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    localSpeaches.failureMode = "unavailable";
    const cloudDeepgram = new FakeSTTProvider({ id: "deepgram-stt-cloud", location: "CLOUD" });

    const router = new ProviderRouter({
      stt: { primary: localSpeaches, fallback: cloudDeepgram }
    });

    const res = await router.transcribe({
      audioBuffer: new Uint8Array([1, 2, 3]),
      language: "pt"
    });

    expect(res.providerId).toBe("deepgram-stt-cloud");
    expect(localSpeaches.callCount).toBe(1);
    expect(cloudDeepgram.callCount).toBe(1);
  });

  it("9. STT realtime capability requested + local unavailable + Deepgram realtime unsupported -> capability mismatch -> never fake streaming", async () => {
    const localSpeaches = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    localSpeaches.failureMode = "unavailable";
    const cloudDeepgram = new FakeSTTProvider({ id: "deepgram-stt-cloud", location: "CLOUD" });

    const router = new ProviderRouter({
      stt: { primary: localSpeaches, fallback: cloudDeepgram }
    });

    async function* makeAudioStream() {
      yield new Uint8Array([1, 2]);
    }

    await expect(async () => {
      for await (const _chunk of router.streamTranscription(makeAudioStream(), { language: "pt" })) {
        // não deve produzir chunks falsos
      }
    }).rejects.toThrow(CapabilityMismatchError);

    expect(localSpeaches.callCount).toBe(1);
  });

  it("10. STT user cancellation -> NO Deepgram call", async () => {
    const localSpeaches = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    const cloudDeepgram = new FakeSTTProvider({ id: "deepgram-stt-cloud", location: "CLOUD" });

    const abortController = new AbortController();
    abortController.abort();

    const router = new ProviderRouter({
      stt: { primary: localSpeaches, fallback: cloudDeepgram }
    });

    await expect(
      router.transcribe(
        { audioBuffer: new Uint8Array([1, 2, 3]), language: "pt" },
        { requestId: "stt-req-1", signal: abortController.signal }
      )
    ).rejects.toThrow(ProviderCancelledError);

    expect(cloudDeepgram.callCount).toBe(0);
  });

  // ==========================================
  // TTS TESTS (11-14)
  // ==========================================

  it("11. TTS local healthy -> Kokoro/Speaches selected", async () => {
    const localSpeaches = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });
    const cloudCartesia = new FakeTTSProvider({ id: "cartesia-tts-cloud", location: "CLOUD" });

    const router = new ProviderRouter({
      tts: { primary: localSpeaches, fallback: cloudCartesia }
    });

    const res = await router.synthesize({
      text: "Texto anatômico para sintetizar.",
      voiceProfileId: "pt-br-warm-male-01",
      language: "pt-BR"
    });

    expect(res.providerId).toBe("speaches-tts-local");
    expect(localSpeaches.callCount).toBe(1);
    expect(cloudCartesia.callCount).toBe(0);
  });

  it("12. TTS local unavailable -> Cartesia selected", async () => {
    const localSpeaches = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });
    localSpeaches.failureMode = "unavailable";
    const cloudCartesia = new FakeTTSProvider({ id: "cartesia-tts-cloud", location: "CLOUD" });

    const router = new ProviderRouter({
      tts: { primary: localSpeaches, fallback: cloudCartesia }
    });

    const res = await router.synthesize({
      text: "Texto anatômico para sintetizar.",
      voiceProfileId: "pt-br-warm-male-01",
      language: "pt-BR"
    });

    expect(res.providerId).toBe("cartesia-tts-cloud");
    expect(localSpeaches.callCount).toBe(1);
    expect(cloudCartesia.callCount).toBe(1);
  });

  it("13. TTS local timeout -> Cartesia selected", async () => {
    const localSpeaches = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });
    localSpeaches.failureMode = "timeout";
    const cloudCartesia = new FakeTTSProvider({ id: "cartesia-tts-cloud", location: "CLOUD" });

    const router = new ProviderRouter({
      tts: { primary: localSpeaches, fallback: cloudCartesia }
    });

    const res = await router.synthesize({
      text: "Texto de teste com timeout.",
      voiceProfileId: "pt-br-warm-male-01",
      language: "pt-BR"
    });

    expect(res.providerId).toBe("cartesia-tts-cloud");
    expect(localSpeaches.callCount).toBe(1);
    expect(cloudCartesia.callCount).toBe(1);
  });

  it("14. TTS user cancellation -> NO Cartesia call", async () => {
    const localSpeaches = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });
    const cloudCartesia = new FakeTTSProvider({ id: "cartesia-tts-cloud", location: "CLOUD" });

    const abortController = new AbortController();
    abortController.abort();

    const router = new ProviderRouter({
      tts: { primary: localSpeaches, fallback: cloudCartesia }
    });

    await expect(
      router.synthesize(
        {
          text: "Texto cancelado no TTS.",
          voiceProfileId: "pt-br-warm-male-01",
          language: "pt-BR"
        },
        { requestId: "tts-req-1", signal: abortController.signal }
      )
    ).rejects.toThrow(ProviderCancelledError);

    expect(cloudCartesia.callCount).toBe(0);
  });

  // ==========================================
  // GENERAL ERROR & METADATA TESTS (15-16)
  // ==========================================

  it("15. cloud failure after local failure -> canonical all-providers-failed", async () => {
    const localSpeaches = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });
    localSpeaches.failureMode = "unavailable";

    const cloudCartesia = new FakeTTSProvider({ id: "cartesia-tts-cloud", location: "CLOUD" });
    cloudCartesia.failureMode = "timeout";

    let routeMetadata: RouteMetadata | undefined;
    const router = new ProviderRouter({
      tts: { primary: localSpeaches, fallback: cloudCartesia },
      onRouteComplete: (meta) => {
        routeMetadata = meta;
      }
    });

    await expect(
      router.synthesize({
        text: "Frase para teste de falha dupla.",
        voiceProfileId: "pt-br-warm-male-01",
        language: "pt-BR"
      })
    ).rejects.toThrow(AllProvidersFailedError);

    expect(localSpeaches.callCount).toBe(1);
    expect(cloudCartesia.callCount).toBe(1);
    expect(routeMetadata?.attempts.length).toBe(2);
    expect(routeMetadata?.attempts[0].canonicalResult).toBe("FAILED");
    expect(routeMetadata?.attempts[1].canonicalResult).toBe("FAILED");
    expect(routeMetadata?.finalCanonicalError).toBe("ALL_PROVIDERS_FAILED");
  });

  it("16. metadata contains no prompt/text/transcript/audio/secrets", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.failureMode = "unavailable";
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });

    let capturedMetadata: RouteMetadata | undefined;
    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini },
      onRouteComplete: (meta) => {
        capturedMetadata = meta;
      }
    });

    const secretPrompt = "SUPER_SECRET_PROMPT_123456_PATIENT_DATA";
    await router.generate({
      messages: [{ role: "user", content: secretPrompt }]
    });

    expect(capturedMetadata).toBeDefined();
    const serializedMeta = JSON.stringify(capturedMetadata);

    // Validação estrita de não-vazamento de dados ou segredos nos metadados de rota
    expect(serializedMeta).not.toContain(secretPrompt);
    expect(serializedMeta).not.toContain("SUPER_SECRET");
    expect(serializedMeta).not.toContain("API_KEY");
    expect(serializedMeta).not.toContain("Bearer");
    expect(serializedMeta).not.toContain("audio");
    expect(serializedMeta).not.toContain("transcript");
  });
});
