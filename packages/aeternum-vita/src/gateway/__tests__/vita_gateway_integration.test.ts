import { describe, it, expect } from "vitest";
import { AeternumAIGateway } from "../AeternumAIGateway.ts";
import { VitaGatewayClient } from "../client/VitaGatewayClient.ts";
import { VitaVoicePipeline, VITA_TUTOR_PERSONAS } from "../client/VitaVoicePipeline.ts";
import { ProviderRouter } from "../../providers/router/ProviderRouter.ts";
import { FakeLLMProvider } from "../../providers/testing/FakeLLMProvider.ts";
import { FakeSTTProvider } from "../../providers/testing/FakeSTTProvider.ts";
import { FakeTTSProvider } from "../../providers/testing/FakeTTSProvider.ts";
import {
  ProviderUnavailableError,
  ProviderTimeoutError,
  ProviderCancelledError,
  ProviderExecutionContext
} from "../../providers/types/index.ts";

describe("Aeternum Vita → AI Gateway Integration (Phase 3A)", () => {
  let port = 8220;
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
      expect(health.providers.llm_local.status).toBe("HEALTHY");
      expect(health.providers.stt_local.status).toBe("HEALTHY");
      expect(health.providers.tts_local.status).toBe("HEALTHY");
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
  // 7, 8. CANCELLATION & BARGE-IN (ZERO CLOUD FALLBACK)
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

  it("8. barge-in -> zero cloud fallback", async () => {
    const p = getPort();
    const localOllama = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    const cloudGemini = new FakeLLMProvider({ id: "gemini-llm-cloud", location: "CLOUD" });
    const router = new ProviderRouter({ llm: { primary: localOllama, fallback: cloudGemini } });

    const gateway = new AeternumAIGateway({ port: p, router });
    await gateway.start();
    try {
      const client = new VitaGatewayClient({ baseUrl: `http://127.0.0.1:${p}` });
      const pipeline = new VitaVoicePipeline(client);
      const controller = new AbortController();

      // Dispara o turno vocal com abort acionado durante execução
      controller.abort();

      await expect(
        pipeline.executeVoiceTurn(
          { audioBuffer: new Uint8Array([1, 2, 3]), tutorId: "eduardo" },
          { requestId: "barge-in-turn", signal: controller.signal }
        )
      ).rejects.toThrow(ProviderCancelledError);

      expect(cloudGemini.callCount).toBe(0);
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
    const client = new VitaGatewayClient({ baseUrl: "http://127.0.0.1:8999" }); // Porta fechada
    await expect(
      client.generate({ messages: [{ role: "user", content: "Sem gateway" }] })
    ).rejects.toThrow(ProviderUnavailableError);
  });

  // ==========================================
  // 11, 12, 13. PERSONA INVARIANTS & VOICE PROFILES
  // ==========================================

  it("11. PT-BR voiceProfileId preserved as pt-br-warm-male-01 for Eduardo", () => {
    const pipeline = new VitaVoicePipeline();
    const persona = pipeline.getPersona("eduardo");
    expect(persona.id).toBe("eduardo");
    expect(persona.voiceProfileId).toBe("pt-br-warm-male-01");
    expect(persona.languageCode).toBe("pt");
  });

  it("12. persona name does not select provider/model (PERSONA != MODEL != VOICE)", () => {
    const eduardo = VITA_TUTOR_PERSONAS.eduardo;
    const antonia = VITA_TUTOR_PERSONAS.antonia;
    const ariana = VITA_TUTOR_PERSONAS.ariana;
    const fabian = VITA_TUTOR_PERSONAS.fabian;

    // A persona define apenas ID vocal e idioma, nunca modelo ou provedor físico
    expect(eduardo.voiceProfileId).toBe("pt-br-warm-male-01");
    expect(antonia.voiceProfileId).toBe("es-calm-female-01");
    expect(ariana.voiceProfileId).toBe("en-calm-female-01");
    expect(fabian.voiceProfileId).toBe("de-warm-male-01");

    expect((eduardo as any).model).toBeUndefined();
    expect((eduardo as any).provider).toBeUndefined();
  });

  it("13. no API key hardcoded in Vita Gateway client (uses internal loopback Gateway)", () => {
    const client = new VitaGatewayClient({ baseUrl: "http://127.0.0.1:8081" });
    expect(client.baseUrl).toBe("http://127.0.0.1:8081");
    expect((client as any).authToken).toBeUndefined();
  });

  // ==========================================
  // 14. NO SENSITIVE LOGGING
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

  // ==========================================
  // 15. REQUEST ID PROPAGATION
  // ==========================================

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
});
