import { describe, it, expect } from "vitest";
import {
  GeminiLLMProvider,
  DeepgramSTTProvider,
  CartesiaTTSProvider,
  VoiceProfileRegistry
} from "../index.ts";

const isCloudIntegrationEnabled = process.env.RUN_CLOUD_PROVIDER_INTEGRATION === "true";

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

describe.skipIf(!isCloudIntegrationEnabled)(
  "Aeternum Cloud Inference Providers — Live Smoke Integration Tests (Opt-In)",
  () => {
    describe("Gemini Cloud Smoke Test", () => {
      const gemini = new GeminiLLMProvider();

      it("health real Gemini", async () => {
        const health = await gemini.health();
        expect(["HEALTHY", "DEGRADED"]).toContain(health.status);
      }, 15000);

      it("generate real pequeno (1 token)", async () => {
        const start = performance.now();
        const res = await gemini.generate({
          messages: [{ role: "user", content: "Responda apenas: Aeternum" }],
          maxTokens: 5
        });
        const duration = Math.round(performance.now() - start);
        expect(res.text.length).toBeGreaterThan(0);
        console.log(`[LIVE GEMINI GENERATE] Latência: ${duration}ms | Resposta: ${res.text.trim()}`);
      }, 15000);

      it("stream real Gemini", async () => {
        const deltas: string[] = [];
        for await (const chunk of gemini.stream({
          messages: [{ role: "user", content: "Diga 2 ossos da perna." }],
          maxTokens: 10
        })) {
          if (chunk.deltaText) deltas.push(chunk.deltaText);
        }
        expect(deltas.length).toBeGreaterThan(0);
        console.log(`[LIVE GEMINI STREAM] Chunks recebidos: ${deltas.length}`);
      }, 15000);
    });

    describe("Deepgram Cloud Smoke Test", () => {
      const deepgram = new DeepgramSTTProvider();

      it("health real Deepgram", async () => {
        const health = await deepgram.health();
        expect(["HEALTHY", "DEGRADED"]).toContain(health.status);
      }, 15000);

      it("batch transcription real com fixture sintético", async () => {
        const fixture = createSyntheticWav();
        const start = performance.now();
        const res = await deepgram.transcribe({
          audioBuffer: fixture,
          language: "pt",
          audioFormat: "wav",
          sampleRate: 16000
        });
        const duration = Math.round(performance.now() - start);
        expect(res.providerId).toBe("deepgram-stt-cloud");
        console.log(`[LIVE DEEPGRAM BATCH] Latência: ${duration}ms | Transcrição: '${res.text}'`);
      }, 15000);
    });

    describe("Cartesia Cloud Smoke Test", () => {
      const cartesia = new CartesiaTTSProvider();

      it("health real Cartesia", async () => {
        const health = await cartesia.health();
        expect(["HEALTHY", "DEGRADED"]).toContain(health.status);
      }, 15000);

      it("synthesize real frase curta", async () => {
        const start = performance.now();
        const res = await cartesia.synthesize({
          text: "Aeternum Atlas.",
          voiceProfileId: "pt-br-warm-male-01",
          language: "pt-BR"
        });
        const duration = Math.round(performance.now() - start);
        expect(res.audioBuffer.length).toBeGreaterThan(0);
        console.log(`[LIVE CARTESIA SYNTH] Latência: ${duration}ms | Bytes: ${res.audioBuffer.length}`);
      }, 15000);
    });
  }
);
