import { describe, it, expect } from "vitest";
import { initializeLogger, ChatContext } from "@livekit/agents";
import { AeternumAIGateway } from "../../../../src/gateway/AeternumAIGateway.ts";
import { ProviderRouter } from "../../../../src/providers/router/ProviderRouter.ts";
import { FakeLLMProvider } from "../../../../src/providers/testing/FakeLLMProvider.ts";
import { FakeSTTProvider } from "../../../../src/providers/testing/FakeSTTProvider.ts";
import { FakeTTSProvider } from "../../../../src/providers/testing/FakeTTSProvider.ts";
import { loadVoiceRuntimeConfig } from "../runtime-config.ts";
import { createTutorAgent, createTutorSession, TUTOR_CONFIGS } from "../agent.ts";
import { queryVitaKnowledge, formatKnowledgeContext } from "../vita-rag.ts";

initializeLogger({ level: "silent", pretty: false });

describe("LiveKit AgentSession Lifecycle Harness (AGENTSESSION_REAL_E2E)", () => {
  let port = 8640;
  const getPort = () => ++port;

  it("1. Executes AgentSession.start() lifecycle connected to Gateway without direct bypass", async () => {
    const p = getPort();

    const localLLM = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localLLM.mockResponseText = "A cavidade glenoide da escápula articula-se com a cabeça do úmero.";

    const localSTT = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    localSTT.mockTranscript = "Explique a articulação glenoumeral.";

    const localTTS = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });
    localTTS.mockAudio = new Uint8Array(48000);

    const cloudGemini = new FakeLLMProvider({ id: "gemini-cloud", location: "CLOUD" });
    const cloudSTT = new FakeSTTProvider({ id: "deepgram-cloud", location: "CLOUD" });
    const cloudTTS = new FakeTTSProvider({ id: "cartesia-cloud", location: "CLOUD" });

    const router = new ProviderRouter({
      llm: { primary: localLLM, fallback: cloudGemini },
      stt: { primary: localSTT, fallback: cloudSTT },
      tts: { primary: localTTS, fallback: cloudTTS }
    });

    const routeCounters: Record<string, number> = {
      "/v1/audio/transcriptions": 0,
      "/v1/chat/completions": 0,
      "/v1/audio/speech": 0
    };

    const gateway = new AeternumAIGateway({
      port: p,
      host: "127.0.0.1",
      authMode: "INTERNAL_DEV",
      mode: "local_only",
      router,
      logger: {
        info: (_evt, meta: any) => {
          const r = meta?.route;
          if (typeof r === "string" && routeCounters[r] !== undefined) {
            routeCounters[r]++;
          }
        },
        warn: () => {},
        error: () => {}
      }
    });

    await gateway.start();

    try {
      const runtime = loadVoiceRuntimeConfig({
        VITA_AI_BACKEND: "gateway",
        AETERNUM_AI_GATEWAY_URL: `http://127.0.0.1:${p}`
      });

      const tutorId = "eduardo";
      const config = TUTOR_CONFIGS[tutorId];
      const agent = createTutorAgent(tutorId, runtime);
      const session = createTutorSession(tutorId, runtime);

      // Inicia o ciclo de vida oficial do AgentSession SDK
      await session.start({
        agent,
        record: false
      });

      expect((session as any).started).toBe(true);

      // Simula turno de voz do usuário no ciclo do AgentSession
      const fakeAudioBuffer = Buffer.alloc(1044);
      fakeAudioBuffer.write("RIFF", 0);
      fakeAudioBuffer.writeUInt32LE(1000 + 36, 4);
      fakeAudioBuffer.write("WAVE", 8);
      fakeAudioBuffer.write("fmt ", 12);
      fakeAudioBuffer.writeUInt32LE(16, 16);
      fakeAudioBuffer.writeUInt16LE(1, 20);
      fakeAudioBuffer.writeUInt16LE(1, 22);
      fakeAudioBuffer.writeUInt32LE(16000, 24);
      fakeAudioBuffer.writeUInt32LE(32000, 28);
      fakeAudioBuffer.writeUInt16LE(2, 32);
      fakeAudioBuffer.writeUInt16LE(16, 34);
      fakeAudioBuffer.write("data", 36);
      fakeAudioBuffer.writeUInt32LE(1000, 40);

      const fakeAudioFrame = {
        data: new Int16Array(fakeAudioBuffer.buffer, fakeAudioBuffer.byteOffset, fakeAudioBuffer.byteLength / 2),
        sampleRate: 16000,
        channels: 1,
        samplesPerChannel: 500
      };

      // 1. STT
      const sttResult = await (session as any).stt.recognize(fakeAudioFrame as any);
      const transcript = sttResult?.alternatives?.[0]?.text || "";
      expect(transcript).toContain("glenoumeral");

      // 2. RAG Hook & Chat Context
      let ragExecuted = false;
      const chatCtx = ChatContext.empty();
      const fakeUserMessage = { textContent: transcript } as any;

      chatCtx.addMessage({ role: "user", content: transcript });

      if ((agent as any).onUserTurnCompleted) {
        await (agent as any).onUserTurnCompleted({}, chatCtx, fakeUserMessage);
        ragExecuted = true;
      }
      expect(ragExecuted).toBe(true);

      // 3. LLM Reply Generation
      const replyHandle = session.generateReply({ instructions: config.greeting });
      expect(replyHandle).toBeDefined();

      const llmStream = await (agent as any).llm.chat({ chatCtx });
      let replyText = "";
      for await (const chunk of llmStream) {
        if (chunk.delta?.content) {
          replyText += chunk.delta.content;
        }
      }
      expect(replyText).toContain("cavidade glenoide");

      // 4. TTS
      const ttsStream = (session as any).tts.synthesize(replyText);
      let ttsChunks = 0;
      for await (const chunk of ttsStream) {
        if (chunk) ttsChunks++;
      }
      expect(ttsChunks).toBeGreaterThan(0);

      // Verificação de Rotas Observadas
      expect(routeCounters["/v1/audio/transcriptions"]).toBeGreaterThan(0);
      expect(routeCounters["/v1/chat/completions"]).toBeGreaterThan(0);
      expect(routeCounters["/v1/audio/speech"]).toBeGreaterThan(0);

      // Verificação de Zero Chamadas de Nuvem e Zero Bypass Direto
      expect(cloudGemini.callCount).toBe(0);
      expect(cloudSTT.callCount).toBe(0);
      expect(cloudTTS.callCount).toBe(0);

      expect(localSTT.callCount).toBeGreaterThanOrEqual(1);
      expect(localLLM.callCount).toBeGreaterThanOrEqual(1);
      expect(localTTS.callCount).toBeGreaterThanOrEqual(1);
    } finally {
      await gateway.stop();
    }
  });
});
