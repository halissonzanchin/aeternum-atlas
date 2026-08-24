import { describe, it, expect } from "vitest";
import {
  OllamaLLMProvider,
  SpeachesSTTProvider,
  SpeachesTTSProvider,
  VoiceProfileRegistry,
  ProviderCancelledError
} from "../index.ts";

const isIntegrationEnabled = process.env.RUN_LOCAL_PROVIDER_INTEGRATION === "true";
const speachesApiKey = process.env.LOCAL_SPEECH_API_KEY || process.env.SPEACHES_API_KEY;

function createSyntheticWav(): Uint8Array {
  const sampleRate = 16000;
  const numSamples = sampleRate * 1;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const sample = Math.sin(2 * Math.PI * 440 * (i / sampleRate)) * 10000;
    buffer.writeInt16LE(Math.floor(sample), 44 + i * 2);
  }
  return new Uint8Array(buffer);
}

describe.skipIf(!isIntegrationEnabled)(
  "Aeternum Local Inference Providers — Live Integration Tests (HP Victus)",
  () => {
    describe("Ollama Live Integration", () => {
      const ollama = new OllamaLLMProvider({
        baseUrl: process.env.LOCAL_LLM_BASE_URL || "http://localhost:11434",
        modelId: "qwen2.5:3b"
      });

      it("health real contra Ollama local", async () => {
        const health = await ollama.health();
        expect(["HEALTHY", "DEGRADED"]).toContain(health.status);
      }, 30000);

      it("generate real com Qwen 2.5:3b", async () => {
        const start = performance.now();
        const res = await ollama.generate({
          messages: [{ role: "user", content: "Diga 'Aeternum' em 1 palavra." }],
          maxTokens: 10
        });
        const duration = Math.round(performance.now() - start);

        expect(res.text.length).toBeGreaterThan(0);
        expect(res.providerId).toBe("ollama-local");
        console.log(`[LIVE OLLAMA GENERATE] Latência: ${duration}ms | Resposta: ${res.text.trim()}`);
      }, 30000);

      it("stream real com cancelamento / barge-in", async () => {
        const controller = new AbortController();
        const stream = ollama.stream(
          { messages: [{ role: "user", content: "Explique a tíbia em 3 parágrafos." }] },
          { requestId: "live-stream-1", signal: controller.signal }
        );

        const chunks: string[] = [];
        try {
          for await (const chunk of stream) {
            chunks.push(chunk.deltaText);
            if (chunks.length >= 2) {
              controller.abort();
            }
          }
        } catch (err) {
          expect(err).toBeInstanceOf(ProviderCancelledError);
        }

        expect(chunks.length).toBeGreaterThanOrEqual(1);
        console.log(`[LIVE OLLAMA STREAM CANCEL] Tokens recebidos antes do barge-in: ${chunks.length}`);
      }, 30000);
    });

    describe("Speaches Live Integration", () => {
      const registry = new VoiceProfileRegistry(true);
      const stt = new SpeachesSTTProvider({
        baseUrl: process.env.LOCAL_SPEECH_BASE_URL || "http://localhost:8000",
        apiKey: speachesApiKey,
        modelId: "Systran/faster-whisper-small"
      });

      const tts = new SpeachesTTSProvider({
        baseUrl: process.env.LOCAL_SPEECH_BASE_URL || "http://localhost:8000",
        apiKey: speachesApiKey,
        registry
      });

      it("STT & TTS health real", async () => {
        const sttHealth = await stt.health();
        expect(["HEALTHY", "DEGRADED"]).toContain(sttHealth.status);

        const ttsHealth = await tts.health();
        expect(["HEALTHY", "DEGRADED"]).toContain(ttsHealth.status);
      }, 30000);

      it("STT batch com fixture sintético", async () => {
        const fixture = createSyntheticWav();
        const start = performance.now();
        const res = await stt.transcribe({
          audioBuffer: fixture,
          language: "pt",
          audioFormat: "wav"
        });
        const duration = Math.round(performance.now() - start);

        expect(res.providerId).toBe("speaches-stt-local");
        console.log(`[LIVE SPEACHES STT] Latência: ${duration}ms | Transcrição: '${res.text}'`);
      }, 30000);

      it("TTS synthesize real com Kokoro (pm_alex)", async () => {
        const start = performance.now();
        const res = await tts.synthesize({
          text: "Sistema esquelético humano.",
          voiceProfileId: "pt-br-warm-male-01",
          language: "pt-BR"
        });
        const duration = Math.round(performance.now() - start);

        expect(res.audioBuffer.length).toBeGreaterThan(0);
        expect(res.sampleRate).toBe(24000);
        console.log(`[LIVE SPEACHES TTS] Latência: ${duration}ms | Bytes de áudio: ${res.audioBuffer.length}`);
      }, 30000);
    });
  }
);
