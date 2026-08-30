import { describe, it, expect } from "vitest";
import { AeternumAIGateway } from "../AeternumAIGateway.ts";
import { VitaGatewayClient } from "../client/VitaGatewayClient.ts";
import { VitaVoicePipeline, VITA_TUTOR_PERSONAS } from "../client/VitaVoicePipeline.ts";
import { VoiceProfileRegistry } from "../../providers/voice/VoiceProfileRegistry.ts";
import { ProviderRouter } from "../../providers/router/ProviderRouter.ts";
import { FakeLLMProvider } from "../../providers/testing/FakeLLMProvider.ts";
import { FakeSTTProvider } from "../../providers/testing/FakeSTTProvider.ts";
import { FakeTTSProvider } from "../../providers/testing/FakeTTSProvider.ts";
import {
  ProviderUnavailableError,
  ProviderTimeoutError,
  ProviderCancelledError,
  ProviderAuthenticationError,
  LLMStreamChunk,
  LLMFinishReason,
  TTSStreamChunk
} from "../../providers/types/index.ts";

describe("Aeternum Vita → AI Gateway Integration (Phase 3A & 3A.1)", () => {
  let port = 8320;
  const getPort = () => ++port;

  // ==========================================
  // 1. HEALTH CHECK
  // ==========================================

  it("1. Vita Gateway client health PASS", async () => {
    const p = getPort();
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const localSTT = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    const localTTS = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });

    const router = new ProviderRouter({
      llm: { primary: localOllama },
      stt: { primary: localSTT },
      tts: { primary: localTTS }
    });

    const gateway = new AeternumAIGateway({
      port: p,
      router,
      healthRegistry: {
        llm_local: { provider: localOllama, enabled: true },
        stt_local: { provider: localSTT, enabled: true },
        tts_local: { provider: localTTS, enabled: true }
      }
    });

    await gateway.start();
    try {
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      const health = await client.health();
      expect(health.status).toBe("HEALTHY");
      const ready = await client.ready();
      expect(ready.status).toBe("READY");
      expect(ready.providers.local_llm).toBe("healthy");
      expect(ready.providers.local_stt).toBe("healthy");
      expect(ready.providers.local_tts).toBe("healthy");
    } finally {
      await gateway.stop();
    }
  });

  // ==========================================
  // 2, 3, 4. STT, LLM, TTS VIA GATEWAY
  // ==========================================

  it("2. Vita STT request uses Gateway", async () => {
    const p = getPort();
    const localSTT = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    localSTT.mockTranscript = "Articulação do cotovelo e rádio proximal.";
    const router = new ProviderRouter({ stt: { primary: localSTT } });

    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();
    try {
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      const res = await client.transcribe({
        audioBuffer: new Uint8Array([1, 2, 3, 4]),
        language: "pt",
        audioFormat: "wav"
      });
      expect(res.text).toBe("Articulação do cotovelo e rádio proximal.");
      expect(localSTT.callCount).toBe(1);
    } finally {
      await gateway.stop();
    }
  });

  it("3. Vita LLM request uses Gateway", async () => {
    const p = getPort();
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.mockResponseText = "A escápula é um osso plano localizado na região póstero-superior do tórax.";
    const router = new ProviderRouter({ llm: { primary: localOllama } });

    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();
    try {
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      const res = await client.generate({
        messages: [{ role: "user", content: "Explique a escápula" }]
      });
      expect(res.text).toContain("A escápula é um osso plano");
      expect(localOllama.callCount).toBe(1);
    } finally {
      await gateway.stop();
    }
  });

  it("4. Vita TTS request uses Gateway", async () => {
    const p = getPort();
    const localTTS = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });
    const router = new ProviderRouter({ tts: { primary: localTTS } });

    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();
    try {
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      const res = await client.synthesize({
        text: "Resposta falada do tutor Eduardo",
        voiceProfileId: "pt-br-warm-male-01",
        language: "pt-BR",
        audioFormat: "pcm",
        sampleRate: 24000
      });
      expect(res.audioBuffer.length).toBeGreaterThan(0);
      expect(localTTS.callCount).toBe(1);
    } finally {
      await gateway.stop();
    }
  });

  // ==========================================
  // 5. LOCAL HEALTHY -> NO CLOUD CALLS
  // ==========================================

  it("5. local healthy -> zero cloud providers called directly", async () => {
    const p = getPort();
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });

    const localSTT = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    const cloudDeepgram = new FakeSTTProvider({ id: "deepgram-stt-cloud", location: "CLOUD" });

    const localTTS = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });
    const cloudCartesia = new FakeTTSProvider({ id: "cartesia-tts-cloud", location: "CLOUD" });

    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini },
      stt: { primary: localSTT, fallback: cloudDeepgram },
      tts: { primary: localTTS, fallback: cloudCartesia }
    });

    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();
    try {
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      const pipeline = new VitaVoicePipeline(client);

      const turn = await pipeline.executeVoiceTurn({
        audioBuffer: new Uint8Array([0x52, 0x49, 0x46, 0x46]),
        tutorId: "eduardo"
      });

      expect(turn.transcript).toBeDefined();
      expect(turn.replyText).toBeDefined();
      expect(turn.audioBuffer.length).toBeGreaterThan(0);

      expect(localOllama.callCount).toBe(1);
      expect(localSTT.callCount).toBe(1);
      expect(localTTS.callCount).toBe(1);

      expect(cloudGemini.callCount).toBe(0);
      expect(cloudDeepgram.callCount).toBe(0);
      expect(cloudCartesia.callCount).toBe(0);
    } finally {
      await gateway.stop();
    }
  });

  // ==========================================
  // 6. GATEWAY FALLBACK METADATA HANDLED SAFELY
  // ==========================================

  it("6. Gateway fallback metadata handled safely without raw error leak", async () => {
    const p = getPort();
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.failureMode = "unavailable";
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });
    cloudGemini.mockResponseText = "Resposta segura do fallback Gemini.";

    const router = new ProviderRouter({
      llm: { primary: localOllama, fallback: cloudGemini }
    });

    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();
    try {
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      const res = await client.generate({
        messages: [{ role: "user", content: "Pergunta anatômica" }]
      });
      expect(res.text).toBe("Resposta segura do fallback Gemini.");
      expect(cloudGemini.callCount).toBe(1);
    } finally {
      await gateway.stop();
    }
  });

  // ==========================================
  // 7, 8. CANCELLATION & ACTIVE IN-FLIGHT BARGE-IN
  // ==========================================

  it("7. Vita user cancellation -> Gateway request aborted", async () => {
    const p = getPort();
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: localOllama } });

    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();
    try {
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      const controller = new AbortController();
      controller.abort();

      await expect(
        client.generate(
          { messages: [{ role: "user", content: "Cancelado" }] },
          { requestId: "req-abort-test", signal: controller.signal }
        )
      ).rejects.toThrow(ProviderCancelledError);
    } finally {
      await gateway.stop();
    }
  });

  it("8. ACTIVE_BARGE_IN_ZERO_CLOUD: in-flight cancellation aborts active stream with zero cloud fallback", async () => {
    const p = getPort();

    class SlowStreamingLLM extends FakeLLMProvider {
      async *stream(req: any, context?: any) {
        yield { deltaText: "Primeira palavra", isComplete: false };
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (context?.signal?.aborted) {
          throw new ProviderCancelledError("Cancelado no meio do stream", this.metadata.id);
        }
        yield { deltaText: " segunda palavra", isComplete: true, finishReason: "stop" as LLMFinishReason };
      }
    }

    const localLLM = new SlowStreamingLLM({ id: "slow-llm-local", location: "LOCAL" });
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });
    const router = new ProviderRouter({ llm: { primary: localLLM, fallback: cloudGemini } });

    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();

    try {
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      const controller = new AbortController();

      const stream = client.streamGenerate(
        { messages: [{ role: "user", content: "Fale lentamente" }] },
        { requestId: "req-barge-in-stream", signal: controller.signal }
      );

      let chunkCount = 0;
      let caughtError: any = null;

      try {
        for await (const chunk of stream) {
          chunkCount++;
          if (chunkCount === 1) {
            // Emite o abort ativo no meio do stream em voo
            controller.abort();
          }
        }
      } catch (err: any) {
        caughtError = err;
      }

      expect(chunkCount).toBe(1);
      expect(caughtError).toBeInstanceOf(ProviderCancelledError);
      expect(cloudGemini.callCount).toBe(0); // Zero fallback de nuvem
    } finally {
      await gateway.stop();
    }
  });

  // ==========================================
  // 9, 10. TIMEOUT & UNAVAILABLE STATE
  // ==========================================

  it("9. Gateway timeout -> safe Vita behavior", async () => {
    const p = getPort();
    class HangingLLM extends FakeLLMProvider {
      async generate(): Promise<any> {
        return new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    const hangingLLM = new HangingLLM({ id: "hanging-llm", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: hangingLLM } });

    const gateway = new AeternumAIGateway({
      port: p,
      providerTimeoutMs: 50,
      gatewayRequestTimeoutMs: 100,
      router
    });

    await gateway.start();
    try {
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      await expect(
        client.generate({ messages: [{ role: "user", content: "Timeout test" }] })
      ).rejects.toThrow(ProviderTimeoutError);
    } finally {
      await gateway.stop();
    }
  });

  it("10. Gateway unavailable -> explicit safe unavailable state", async () => {
    const client = new VitaGatewayClient({ baseUrl: "http://127.0.0.1:8999" });
    await expect(
      client.generate({ messages: [{ role: "user", content: "Sem gateway" }] })
    ).rejects.toThrow(ProviderUnavailableError);
  });

  // ==========================================
  // 11, 12, 13. PERSONA INVARIANTS & VOICE PROFILE CANONICAL REGISTRY
  // ==========================================

  it("11. PT-BR voiceProfileId preserved as pt-br-warm-male-01 for Eduardo", () => {
    const pipeline = new VitaVoicePipeline();
    const persona = pipeline.getPersona("eduardo");
    expect(persona.id).toBe("eduardo");
    expect(persona.voiceProfileId).toBe("pt-br-warm-male-01");
    expect(persona.languageCode).toBe("pt");
  });

  it("12. VoiceProfileRegistry.require succeeds for every Vita persona (Eduardo, Antonia, Ariana, Fabian)", () => {
    const registry = new VoiceProfileRegistry();
    const personas = ["eduardo", "antonia", "ariana", "fabian"] as const;

    for (const key of personas) {
      const persona = VITA_TUTOR_PERSONAS[key];
      expect(persona).toBeDefined();
      const profile = registry.require(persona.voiceProfileId);
      expect(profile).toBeDefined();
      expect(profile.id).toBe(persona.voiceProfileId);
    }

    expect(VITA_TUTOR_PERSONAS.fabian.voiceProfileId).toBe("de-clear-male-01");
  });

  it("13. no API key hardcoded in Vita Gateway client (uses internal loopback Gateway)", () => {
    const client = new VitaGatewayClient({ baseUrl: "http://127.0.0.1:8081" });
    expect(client.baseUrl).toBe("http://127.0.0.1:8081");
    expect((client as any).authToken).toBeUndefined();
  });

  // ==========================================
  // 14. NO SENSITIVE LOGGING & REQUEST ID
  // ==========================================

  it("14. no prompts, transcripts or audio data leaked into Gateway operational logs", async () => {
    const p = getPort();
    const logs: string[] = [];
    const customLogger = {
      info: (event: string, meta?: any) => logs.push(JSON.stringify({ event, meta })),
      warn: (event: string, meta?: any) => logs.push(JSON.stringify({ event, meta })),
      error: (event: string, meta?: any) => logs.push(JSON.stringify({ event, meta }))
    };

    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localOllama.mockResponseText = "Resposta médica confidencial 12345";
    const router = new ProviderRouter({ llm: { primary: localOllama } });

    const gateway = new AeternumAIGateway({ port: p, logger: customLogger, router });
    await gateway.start();
    try {
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      await client.generate({
        messages: [{ role: "user", content: "Pergunta altamente confidencial 99999" }]
      });

      const joinedLogs = logs.join("\n");
      expect(joinedLogs).not.toContain("Pergunta altamente confidencial 99999");
      expect(joinedLogs).not.toContain("Resposta médica confidencial 12345");
    } finally {
      await gateway.stop();
    }
  });

  it("15. requestId propagation works end-to-end (Turn -> Client -> Gateway -> Router -> Provider)", async () => {
    const p = getPort();
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: localOllama } });

    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();
    try {
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      const customTraceId = "vita-trace-turn-7777";

      const res = await client.generate(
        { messages: [{ role: "user", content: "Teste de rastreio" }] },
        { requestId: customTraceId }
      );

      expect(res.text).toBeDefined();
      expect(res.metadata?.requestId).toBe(customTraceId);
    } finally {
      await gateway.stop();
    }
  });

  // ==========================================
  // 16. MULTI-TURN CONVERSATION CONTINUITY
  // ==========================================

  it("16. Conversation continuity preserves history across multiple turns (Turn 1 -> Turn 2)", async () => {
    const p = getPort();
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const localSTT = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    const localTTS = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });

    const router = new ProviderRouter({
      llm: { primary: localOllama },
      stt: { primary: localSTT },
      tts: { primary: localTTS }
    });

    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();

    try {
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      const pipeline = new VitaVoicePipeline(client);

      // Turn 1
      localSTT.mockTranscript = "O nervo radial percorre qual compartimento?";
      localOllama.mockResponseText = "O nervo radial percorre o compartimento posterior do braço no sulco do nervo radial.";

      const turn1 = await pipeline.executeStreamedVoiceTurn({
        audioBuffer: new Uint8Array([1, 2, 3]),
        tutorId: "eduardo"
      });

      expect(turn1.transcript).toBe("O nervo radial percorre qual compartimento?");
      expect(turn1.replyText).toContain("compartimento posterior do braço");

      // Turn 2: Inclui o histórico do Turn 1
      localSTT.mockTranscript = "E onde ele termina?";
      localOllama.mockResponseText = "Ele se divide no antebraço em ramos superficial e profundo (nervo interósseo posterior).";

      const turn2 = await pipeline.executeStreamedVoiceTurn({
        audioBuffer: new Uint8Array([4, 5, 6]),
        tutorId: "eduardo",
        conversationHistory: [
          { role: "user", content: turn1.transcript },
          { role: "assistant", content: turn1.replyText }
        ]
      });

      expect(turn2.transcript).toBe("E onde ele termina?");
      expect(turn2.replyText).toContain("ramos superficial e profundo");
    } finally {
      await gateway.stop();
    }
  });

  // ==========================================
  // 17. SSE ERROR MAPPING (LLM & TTS)
  // ==========================================

  it("17. SSE error mapping correctly maps provider_unavailable on LLM stream", async () => {
    const p = getPort();

    class FailMidStreamLLM extends FakeLLMProvider {
      async *stream() {
        yield { deltaText: "Início", isComplete: false };
        throw new ProviderUnavailableError("LLM caiu no meio", "fake-llm");
      }
    }

    const localLLM = new FailMidStreamLLM({ id: "fail-llm-local", location: "LOCAL" });
    const router = new ProviderRouter({ llm: { primary: localLLM } });

    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();

    try {
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      const stream = client.streamGenerate({ messages: [{ role: "user", content: "Erro SSE" }] });

      let errorCaught: any = null;
      try {
        for await (const _chunk of stream) {
          // Continua até receber o frame de erro
        }
      } catch (err: any) {
        errorCaught = err;
      }

      expect(errorCaught).toBeInstanceOf(ProviderUnavailableError);
    } finally {
      await gateway.stop();
    }
  });
    // ==========================================
  // 18-22. COMPLETE TTS SSE ERROR MATRIX
  // ==========================================

  it("18. TTS SSE stream: ProviderUnavailableError maps to ProviderUnavailableError client-side", async () => {
    const p = getPort();

    class FailUnavailableTTS extends FakeTTSProvider {
      async *streamSynthesis() {
        yield { audioChunk: new Uint8Array([1, 2, 3]), isFinal: false };
        throw new ProviderUnavailableError("TTS local indisponível no stream", "fake-tts");
      }
    }

    const localTTS = new FailUnavailableTTS({ id: "fail-tts-local", location: "LOCAL" });
    const router = new ProviderRouter({ tts: { primary: localTTS } });
    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();

    try {
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      const stream = client.streamSynthesis({
        text: "Teste de falha unavailable TTS",
        voiceProfileId: "pt-br-warm-male-01",
        language: "pt"
      });

      let errorCaught: any = null;
      try {
        for await (const _chunk of stream) {}
      } catch (err: any) {
        errorCaught = err;
      }

      expect(errorCaught).toBeInstanceOf(ProviderUnavailableError);
    } finally {
      await gateway.stop();
    }
  });

  it("19. TTS SSE stream: ProviderTimeoutError maps to ProviderTimeoutError client-side", async () => {
    const p = getPort();

    class FailTimeoutTTS extends FakeTTSProvider {
      async *streamSynthesis() {
        yield { audioChunk: new Uint8Array([1, 2, 3]), isFinal: false };
        throw new ProviderTimeoutError("TTS timeout no stream", "fake-tts");
      }
    }

    const localTTS = new FailTimeoutTTS({ id: "fail-tts-timeout", location: "LOCAL" });
    const router = new ProviderRouter({ tts: { primary: localTTS } });
    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();

    try {
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      const stream = client.streamSynthesis({
        text: "Teste de timeout TTS",
        voiceProfileId: "pt-br-warm-male-01",
        language: "pt"
      });

      let errorCaught: any = null;
      try {
        for await (const _chunk of stream) {}
      } catch (err: any) {
        errorCaught = err;
      }

      expect(errorCaught).toBeInstanceOf(ProviderTimeoutError);
    } finally {
      await gateway.stop();
    }
  });

  it("20. TTS SSE stream: ProviderCancelledError / abort maps to ProviderCancelledError client-side", async () => {
    const p = getPort();

    class CancellableTTS extends FakeTTSProvider {
      async *streamSynthesis(req: any, ctx?: any) {
        yield { audioChunk: new Uint8Array([1, 2, 3]), isFinal: false };
        await new Promise((r) => setTimeout(r, 200));
        if (ctx?.signal?.aborted) {
          throw new ProviderCancelledError("Cancelado", "fake-tts");
        }
        yield { audioChunk: new Uint8Array([4, 5, 6]), isFinal: true };
      }
    }

    const localTTS = new CancellableTTS({ id: "cancel-tts", location: "LOCAL" });
    const router = new ProviderRouter({ tts: { primary: localTTS } });
    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();

    try {
      const controller = new AbortController();
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      const stream = client.streamSynthesis(
        {
          text: "Teste cancel TTS",
          voiceProfileId: "pt-br-warm-male-01",
          language: "pt"
        },
        { requestId: "req-cancel-tts", signal: controller.signal }
      );

      let errorCaught: any = null;
      try {
        for await (const chunk of stream) {
          if (chunk.audioChunk) {
            controller.abort();
          }
        }
      } catch (err: any) {
        errorCaught = err;
      }

      expect(errorCaught).toBeInstanceOf(ProviderCancelledError);
    } finally {
      await gateway.stop();
    }
  });

  it("21. TTS SSE stream: Gateway outer deadline triggers canonical gateway_timeout error", async () => {
    const p = getPort();

    class VerySlowTTS extends FakeTTSProvider {
      async *streamSynthesis() {
        await new Promise((r) => setTimeout(r, 500));
        yield { audioChunk: new Uint8Array([1, 2, 3]), isFinal: true };
      }
    }

    const localTTS = new VerySlowTTS({ id: "slow-tts", location: "LOCAL" });
    const router = new ProviderRouter({ tts: { primary: localTTS } });
    // Gateway deadline curto de 100ms
    const gateway = new AeternumAIGateway({
      port: p,
      router,
      providerTimeoutMs: 80,
      gatewayRequestTimeoutMs: 100
    });
    await gateway.start();

    try {
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      const stream = client.streamSynthesis({
        text: "Teste outer timeout",
        voiceProfileId: "pt-br-warm-male-01",
        language: "pt"
      });

      let errorCaught: any = null;
      try {
        for await (const _chunk of stream) {}
      } catch (err: any) {
        errorCaught = err;
      }

      expect(errorCaught).toBeInstanceOf(ProviderTimeoutError);
    } finally {
      await gateway.stop();
    }
  });

  it("22. TTS SSE stream: unknown provider error emits canonical provider_error SSE frame without vendor leakage", async () => {
    const p = getPort();

    class CustomBrokenTTS extends FakeTTSProvider {
      async *streamSynthesis() {
        yield { audioChunk: new Uint8Array([1, 2, 3]), isFinal: false };
        throw new Error("VENDOR_INTERNAL_EXCEPTION_SECRET_KEY_12345");
      }
    }

    const localTTS = new CustomBrokenTTS({ id: "broken-tts", location: "LOCAL" });
    const router = new ProviderRouter({ tts: { primary: localTTS } });
    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();

    try {
      // 1. Inspeciona o frame SSE bruto do endpoint
      const res = await fetch(`http://127.0.0.1:${p}/v1/tts/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Teste raw SSE error",
          voiceProfileId: "pt-br-warm-male-01",
          language: "pt"
        })
      });

      const rawText = await res.text();
      expect(rawText).toContain('"code":"provider_error"');
      expect(rawText).toContain('"message":"Serviço de síntese vocal temporariamente indisponível."');
      expect(rawText).not.toContain("SECRET_KEY_12345");

      // 2. Inspeciona o mapeamento seguro no VitaGatewayClient
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      const stream = client.streamSynthesis({
        text: "Teste client error",
        voiceProfileId: "pt-br-warm-male-01",
        language: "pt"
      });

      let errorCaught: any = null;
      try {
        for await (const _chunk of stream) {}
      } catch (err: any) {
        errorCaught = err;
      }

      expect(errorCaught).toBeDefined();
      expect(errorCaught.message).not.toContain("SECRET_KEY_12345");
      expect(errorCaught.message).toBe("Serviço de síntese vocal temporariamente indisponível.");
    } finally {
      await gateway.stop();
    }
  });
});
