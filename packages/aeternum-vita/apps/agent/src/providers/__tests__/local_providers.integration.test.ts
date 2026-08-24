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

      it("stream normal com Qwen 2.5:3b", async () => {
        const chunks: string[] = [];
        const start = performance.now();
        for await (const chunk of ollama.stream({
          messages: [{ role: "user", content: "Diga 3 ossos do braço." }],
          maxTokens: 20
        })) {
          if (chunk.deltaText) chunks.push(chunk.deltaText);
        }
        const duration = Math.round(performance.now() - start);
        expect(chunks.length).toBeGreaterThan(0);
        console.log(`[LIVE OLLAMA STREAM] Latência: ${duration}ms | Chunks: ${chunks.length}`);
      }, 30000);

      it("stream cancelamento / barge-in com asserção explícita", async () => {
        const controller = new AbortController();
        const stream = ollama.stream(
          { messages: [{ role: "user", content: "Explique a tíbia em 3 parágrafos." }] },
          { requestId: "live-stream-cancel", signal: controller.signal }
        );

        let cancelled = false;
        const chunks: string[] = [];
        try {
          for await (const chunk of stream) {
            chunks.push(chunk.deltaText);
            if (chunks.length >= 2) {
              controller.abort();
            }
          }
        } catch (err) {
          if (err instanceof ProviderCancelledError) {
            cancelled = true;
          }
        }

        expect(cancelled).toBe(true);
        expect(chunks.length).toBeGreaterThanOrEqual(1);
        console.log(`[LIVE OLLAMA STREAM CANCEL] Cancelamento confirmado. Chunks recebidos: ${chunks.length}`);
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
          audioFormat: "wav",
          sampleRate: 16000
        });
        const duration = Math.round(performance.now() - start);

        expect(res.providerId).toBe("speaches-stt-local");
        console.log(`[LIVE SPEACHES STT BATCH] Latência: ${duration}ms | Transcrição: '${res.text}'`);
      }, 30000);

      it("STT SSE output com stream=true e asserção de isFinal único", async () => {
        const fixture = createSyntheticWav();
        const asyncAudio = (async function* () {
          yield fixture;
        })();

        const start = performance.now();
        const chunks: { partialText: string; isFinal: boolean }[] = [];
        for await (const chunk of stt.streamTranscription(asyncAudio, { language: "pt", sampleRate: 16000 })) {
          chunks.push(chunk);
        }
        const duration = Math.round(performance.now() - start);

        const finals = chunks.filter((c) => c.isFinal);
        expect(finals.length).toBe(1);
        console.log(`[LIVE SPEACHES STT SSE] Latência: ${duration}ms | Chunks: ${chunks.length} | isFinal único: OK`);
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
        console.log(`[LIVE SPEACHES TTS SYNTH] Latência: ${duration}ms | Bytes: ${res.audioBuffer.length}`);
      }, 30000);

      it("TTS synthesize real com sample_rate custom (16000Hz)", async () => {
        const start = performance.now();
        const res = await tts.synthesize({
          text: "Teste 16kHz.",
          voiceProfileId: "pt-br-warm-male-01",
          language: "pt-BR",
          sampleRate: 16000
        });
        const duration = Math.round(performance.now() - start);

        expect(res.sampleRate).toBe(16000);
        console.log(`[LIVE SPEACHES TTS 16kHz] Latência: ${duration}ms | SampleRate: ${res.sampleRate}`);
      }, 30000);

      it("TTS stream real com cancelamento explícito", async () => {
        const controller = new AbortController();
        const stream = tts.streamSynthesis(
          { text: "Explicação anatômica detalhada do sistema musculoesquelético.", voiceProfileId: "pt-br-warm-male-01", language: "pt-BR" },
          { requestId: "live-tts-stream-cancel", signal: controller.signal }
        );

        let cancelled = false;
        let chunksCount = 0;
        try {
          for await (const chunk of stream) {
            if (chunk.audioChunk.length > 0) chunksCount++;
            if (chunksCount >= 2) {
              controller.abort();
            }
          }
        } catch (err) {
          if (err instanceof ProviderCancelledError) {
            cancelled = true;
          }
        }

        expect(cancelled).toBe(true);
        console.log(`[LIVE SPEACHES TTS STREAM CANCEL] Cancelamento confirmado. Chunks recebidos: ${chunksCount}`);
      }, 30000);
    });
  }
);
