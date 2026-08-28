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
  ProviderAuthenticationError,
  CapabilityMismatchError,
  AllProvidersFailedError
} from "../types/index.ts";

describe("Aeternum Provider Router — Deterministic Routing & Hardening Suite", () => {
  // ==========================================
  // LLM UNARY TESTS (1-6)
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
    expect(routeMetadata?.fallbackReason).toBe("PROVIDER_UNAVAILABLE");
    expect(routeMetadata?.finalProvider).toBe("gemini-llm-cloud");
    expect(routeMetadata?.attempts.length).toBe(2);
    expect(routeMetadata?.attempts[0].canonicalResult).toBe("FAILED");
    expect(routeMetadata?.attempts[1].canonicalResult).toBe("SUCCESS");
  });

  it("3. LLM local timeout -> Gemini selected", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.failureMode = "timeout";
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });

    let routeMetadata: RouteMetadata | undefined;
    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini },
      onRouteComplete: (meta) => {
        routeMetadata = meta;
      }
    });

    const res = await router.generate({
      messages: [{ role: "user", content: "Explique a artéria femoral" }]
    });

    expect(res.providerId).toBe("gemini-llm-cloud");
    expect(localOllama.callCount).toBe(1);
    expect(cloudGemini.callCount).toBe(1);
    expect(routeMetadata?.fallbackReason).toBe("PROVIDER_TIMEOUT");
  });

  it("4. LLM local invalid provider response -> Gemini selected", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.failureMode = "invalid_response";
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });

    let routeMetadata: RouteMetadata | undefined;
    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini },
      onRouteComplete: (meta) => {
        routeMetadata = meta;
      }
    });

    const res = await router.generate({
      messages: [{ role: "user", content: "Explique o nervo ciático" }]
    });

    expect(res.providerId).toBe("gemini-llm-cloud");
    expect(localOllama.callCount).toBe(1);
    expect(cloudGemini.callCount).toBe(1);
    expect(routeMetadata?.fallbackReason).toBe("PROVIDER_INVALID_RESPONSE");
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
  // STT UNARY TESTS (7-10)
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
  // TTS UNARY TESTS (11-14)
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

  // ==========================================
  // FINDING 1: HARDENED ERROR METADATA & SECURITY TESTS (16-17)
  // ==========================================

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

    expect(serializedMeta).not.toContain(secretPrompt);
    expect(serializedMeta).not.toContain("SUPER_SECRET");
    expect(serializedMeta).not.toContain("API_KEY");
    expect(serializedMeta).not.toContain("Bearer");
    expect(serializedMeta).not.toContain("audio");
    expect(serializedMeta).not.toContain("transcript");
  });

  it("17. [FINDING 1] error containing sensitive markers is sanitized in metadata and fallbackReason", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    // Provedor lança um erro com mensagem deliberadamente contaminada
    localOllama.customError = new ProviderUnavailableError(
      "Failed to connect SECRET_PROMPT_MARKER with API_KEY_MARKER and TRANSCRIPT_MARKER",
      "ollama-llm-local"
    );
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });

    let capturedMetadata: RouteMetadata | undefined;
    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini },
      onRouteComplete: (meta) => {
        capturedMetadata = meta;
      }
    });

    await router.generate({
      messages: [{ role: "user", content: "Consulta teste" }]
    });

    expect(capturedMetadata).toBeDefined();
    const serializedMeta = JSON.stringify(capturedMetadata);

    // Invariante Estrito: NENHUM dos marcadores pode existir nos metadados serializados
    expect(serializedMeta).not.toContain("SECRET_PROMPT_MARKER");
    expect(serializedMeta).not.toContain("API_KEY_MARKER");
    expect(serializedMeta).not.toContain("TRANSCRIPT_MARKER");

    // fallbackReason e message devem ser canônicos
    expect(capturedMetadata?.fallbackReason).toBe("PROVIDER_UNAVAILABLE");
    expect(capturedMetadata?.attempts[0].error?.message).toBe("provider_unavailable");
  });

  // ==========================================
  // FINDING 2: PARTIAL STREAM FAILURE TESTS (18-21)
  // ==========================================

  it("18. [FINDING 2] LLM stream: yield 1 chunk then ProviderUnavailableError -> NO fallback, canonicalResult=FAILED, finalCanonicalError=PROVIDER_UNAVAILABLE", async () => {
    // Provedor que emite 1 chunk e depois falha
    class PartialFailingLLM extends FakeLLMProvider {
      async *stream(_request: any, _context?: any) {
        yield { deltaText: "Primeira palavra ", isComplete: false };
        throw new ProviderUnavailableError("Conexão perdida no meio do stream", "fake-partial-llm");
      }
    }

    const localPartial = new PartialFailingLLM({ id: "ollama-llm-local", location: "LOCAL" });
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });

    let capturedMetadata: RouteMetadata | undefined;
    const router = new ProviderRouter({
      llm: { primary: localPartial, fallback: cloudGemini },
      onRouteComplete: (meta) => {
        capturedMetadata = meta;
      }
    });

    const receivedChunks: string[] = [];
    await expect(async () => {
      for await (const chunk of router.stream({ messages: [{ role: "user", content: "Oi" }] })) {
        receivedChunks.push(chunk.deltaText);
      }
    }).rejects.toThrow(ProviderUnavailableError);

    // Recebeu o 1º chunk antes da falha
    expect(receivedChunks.length).toBe(1);
    // Invariante de Parcial: NUNCA deve sofrer fallback na nuvem para não corromper o stream
    expect(cloudGemini.callCount).toBe(0);
    expect(capturedMetadata?.fallbackUsed).toBe(false);
    expect(capturedMetadata?.attempts.length).toBe(1);
    expect(capturedMetadata?.attempts[0].canonicalResult).toBe("FAILED");
    expect(capturedMetadata?.finalCanonicalError).toBe("PROVIDER_UNAVAILABLE");
  });

  it("19. [FINDING 2] STT stream: yield 1 chunk then ProviderTimeoutError -> NO fallback, canonicalResult=FAILED, finalCanonicalError=PROVIDER_TIMEOUT", async () => {
    class PartialFailingSTT extends FakeSTTProvider {
      async *streamTranscription(_audioStream: any, _options: any, _context?: any) {
        yield { partialText: "Olá ", isFinal: false };
        throw new ProviderTimeoutError("Timeout no meio do stream STT", "fake-partial-stt");
      }
    }

    const localPartial = new PartialFailingSTT({ id: "speaches-stt-local", location: "LOCAL" });
    const cloudDeepgram = new FakeSTTProvider({ id: "deepgram-stt-cloud", location: "CLOUD" });

    let capturedMetadata: RouteMetadata | undefined;
    const router = new ProviderRouter({
      stt: { primary: localPartial, fallback: cloudDeepgram },
      onRouteComplete: (meta) => {
        capturedMetadata = meta;
      }
    });

    async function* audio() {
      yield new Uint8Array([1, 2]);
    }

    const receivedChunks: string[] = [];
    await expect(async () => {
      for await (const chunk of router.streamTranscription(audio(), { language: "pt" })) {
        receivedChunks.push(chunk.partialText);
      }
    }).rejects.toThrow(ProviderTimeoutError);

    expect(receivedChunks.length).toBe(1);
    expect(cloudDeepgram.callCount).toBe(0);
    expect(capturedMetadata?.attempts[0].canonicalResult).toBe("FAILED");
    expect(capturedMetadata?.finalCanonicalError).toBe("PROVIDER_TIMEOUT");
  });

  it("20. [FINDING 2] TTS stream: yield 1 chunk then ProviderUnavailableError -> NO fallback, canonicalResult=FAILED, finalCanonicalError=PROVIDER_UNAVAILABLE", async () => {
    class PartialFailingTTS extends FakeTTSProvider {
      async *streamSynthesis(_request: any, _context?: any) {
        yield { audioChunk: new Uint8Array([1, 2]), isFinal: false };
        throw new ProviderUnavailableError("TTS travou no meio do áudio", "fake-partial-tts");
      }
    }

    const localPartial = new PartialFailingTTS({ id: "speaches-tts-local", location: "LOCAL" });
    const cloudCartesia = new FakeTTSProvider({ id: "cartesia-tts-cloud", location: "CLOUD" });

    let capturedMetadata: RouteMetadata | undefined;
    const router = new ProviderRouter({
      tts: { primary: localPartial, fallback: cloudCartesia },
      onRouteComplete: (meta) => {
        capturedMetadata = meta;
      }
    });

    const receivedChunks: Uint8Array[] = [];
    await expect(async () => {
      for await (const chunk of router.streamSynthesis({
        text: "Teste TTS",
        voiceProfileId: "pt-br-warm-male-01",
        language: "pt-BR"
      })) {
        receivedChunks.push(chunk.audioChunk);
      }
    }).rejects.toThrow(ProviderUnavailableError);

    expect(receivedChunks.length).toBe(1);
    expect(cloudCartesia.callCount).toBe(0);
    expect(capturedMetadata?.attempts[0].canonicalResult).toBe("FAILED");
    expect(capturedMetadata?.finalCanonicalError).toBe("PROVIDER_UNAVAILABLE");
  });

  it("21. [FINDING 2] Actual user cancellation in stream -> CANCELLED + zero cloud calls", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });

    const abortController = new AbortController();

    let capturedMetadata: RouteMetadata | undefined;
    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini },
      onRouteComplete: (meta) => {
        capturedMetadata = meta;
      }
    });

    await expect(async () => {
      for await (const _chunk of router.stream(
        { messages: [{ role: "user", content: "Olá" }] },
        { requestId: "req-abort", signal: abortController.signal }
      )) {
        abortController.abort(); // Simula cancelamento durante a iteração
      }
    }).rejects.toThrow(ProviderCancelledError);

    expect(cloudGemini.callCount).toBe(0);
    expect(capturedMetadata?.attempts[0].canonicalResult).toBe("CANCELLED");
    expect(capturedMetadata?.finalCanonicalError).toBe("PROVIDER_CANCELLED");
  });

  // ==========================================
  // AUTH FAIL-CLOSED TEST (22)
  // ==========================================

  it("22. [AUTH FAIL-CLOSED] local provider authentication error -> ZERO cloud calls, error propagated", async () => {
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.customError = new ProviderAuthenticationError(
      "Chave de autenticação local inválida",
      "ollama-llm-local"
    );
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });

    let capturedMetadata: RouteMetadata | undefined;
    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini },
      onRouteComplete: (meta) => {
        capturedMetadata = meta;
      }
    });

    await expect(
      router.generate({ messages: [{ role: "user", content: "Pergunta" }] })
    ).rejects.toThrow(ProviderAuthenticationError);

    // Invariante de Segurança: Erros de autenticação NUNCA são tratados como recuperáveis
    expect(cloudGemini.callCount).toBe(0);
    expect(capturedMetadata?.fallbackUsed).toBe(false);
    expect(capturedMetadata?.finalCanonicalError).toBe("PROVIDER_AUTH_ERROR");
  });
});
