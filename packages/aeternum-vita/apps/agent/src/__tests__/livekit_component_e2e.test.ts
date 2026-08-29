import { describe, it, expect } from "vitest";
import { initializeLogger, ChatContext } from "@livekit/agents";
import * as openai from "@livekit/agents-plugin-openai";
import { AeternumAIGateway } from "../../../../src/gateway/AeternumAIGateway.ts";
import { ProviderRouter } from "../../../../src/providers/router/ProviderRouter.ts";
import { FakeLLMProvider } from "../../../../src/providers/testing/FakeLLMProvider.ts";
import { FakeSTTProvider } from "../../../../src/providers/testing/FakeSTTProvider.ts";
import { FakeTTSProvider } from "../../../../src/providers/testing/FakeTTSProvider.ts";
import { loadVoiceRuntimeConfig } from "../runtime-config.ts";
import { createTutorAgent, createTutorSession, TUTOR_CONFIGS } from "../agent.ts";
import { queryVitaKnowledge, formatKnowledgeContext } from "../vita-rag.ts";

initializeLogger({ level: "silent", pretty: false });

describe("LiveKit Component Composition E2E Harness (LIVEKIT_COMPONENT_E2E)", () => {
  let port = 8630;
  const getPort = () => ++port;

  it("Executes a full LiveKit AgentSession voice turn strictly via AI Gateway with zero bypass and zero cloud calls", async () => {
    const p = getPort();

    const localLLM = new FakeLLMProvider({ id: "ollama-llm-local", location: "LOCAL" });
    localLLM.mockResponseText = "A articulação glenoumeral é do tipo esferóidea, formada pela cabeça do úmero e a cavidade glenoide.";

    const localSTT = new FakeSTTProvider({ id: "speaches-stt-local", location: "LOCAL" });
    localSTT.mockTranscript = "Explique a articulação glenoumeral e os ligamentos.";

    const localTTS = new FakeTTSProvider({ id: "speaches-tts-local", location: "LOCAL" });
    localTTS.mockAudio = new Uint8Array(48000); // 1 segundo de áudio a 24kHz

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

      expect(runtime.backendMode).toBe("gateway");

      const agent = createTutorAgent("eduardo", runtime);
      const session = createTutorSession("eduardo", runtime);

      // 1. STT via openai.STT nativo do LiveKit
      const header = Buffer.alloc(44);
      header.write("RIFF", 0);
      header.writeUInt32LE(36 + 1000, 4);
      header.write("WAVE", 8);
      header.write("fmt ", 12);
      header.writeUInt32LE(16, 16);
      header.writeUInt16LE(1, 20);
      header.writeUInt16LE(1, 22);
      header.writeUInt32LE(16000, 24);
      header.writeUInt32LE(32000, 28);
      header.writeUInt16LE(2, 32);
      header.writeUInt16LE(16, 34);
      header.write("data", 36);
      header.writeUInt32LE(1000, 40);

      const fakeAudioBuffer = Buffer.concat([header, Buffer.alloc(1000)]);
      const fakeAudioFrame = {
        data: new Int16Array(fakeAudioBuffer.buffer, fakeAudioBuffer.byteOffset, fakeAudioBuffer.byteLength / 2),
        sampleRate: 16000,
        channels: 1,
        samplesPerChannel: 500
      };

      const sttResult = await (session as any).stt.recognize(fakeAudioFrame as any);
      const transcript = sttResult?.alternatives?.[0]?.text || "";
      expect(transcript).toContain("glenoumeral");

      // 2. RAG da Vita
      const ragResult = await queryVitaKnowledge("glenoumeral", "eduardo", "pt", runtime);
      const knowledgeContext = ragResult ? formatKnowledgeContext(ragResult) : undefined;

      // 3. LLM via openai.LLM nativo do LiveKit
      const chatCtx = ChatContext.empty();
      chatCtx.addMessage({ role: "system", content: typeof agent.instructions === "string" ? agent.instructions : (agent.instructions as any).text || String(agent.instructions) });
      if (knowledgeContext) {
        chatCtx.addMessage({ role: "system", content: knowledgeContext });
      }
      chatCtx.addMessage({ role: "user", content: transcript });

      const llmStream = await (agent as any).llm.chat({ chatCtx });
      let replyText = "";
      for await (const chunk of llmStream) {
        if (chunk.delta?.content) {
          replyText += chunk.delta.content;
        }
      }
      expect(replyText).toContain("esferóidea");

      // 4. TTS via openai.TTS nativo do LiveKit
      const ttsStream = (session as any).tts.synthesize(replyText);
      let receivedEvents = 0;
      for await (const chunk of ttsStream) {
        if (chunk) {
          receivedEvents++;
        }
      }
      expect(receivedEvents).toBeGreaterThan(0);

      // Verificações de Rotas Observadas no Gateway
      expect(routeCounters["/v1/audio/transcriptions"]).toBeGreaterThan(0);
      expect(routeCounters["/v1/chat/completions"]).toBeGreaterThan(0);
      expect(routeCounters["/v1/audio/speech"]).toBeGreaterThan(0);

      // Verificações de Zero Bypass e Zero Nuvem
      expect(localSTT.callCount).toBe(1);
      expect(localLLM.callCount).toBe(1);
      expect(localTTS.callCount).toBe(1);

      expect(cloudSTT.callCount).toBe(0);
      expect(cloudGemini.callCount).toBe(0);
      expect(cloudTTS.callCount).toBe(0);
    } finally {
      await gateway.stop();
    }
  });
});
