import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GeminiLLMProvider,
  DeepgramSTTProvider,
  CartesiaTTSProvider
} from "../index.ts";

const isCloudIntegrationEnabled = process.env.RUN_CLOUD_PROVIDER_INTEGRATION === "true";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, "fixtures", "synthetic_speech_aeternum_atlas.wav");

function loadSpeechFixture(): Uint8Array {
  if (fs.existsSync(fixturePath)) {
    return new Uint8Array(fs.readFileSync(fixturePath));
  }
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
  return new Uint8Array(buffer);
}

describe.skipIf(!isCloudIntegrationEnabled)(
  "Aeternum Cloud Inference Providers — Live Smoke Integration Tests (Opt-In)",
  () => {
    describe("Gemini Cloud Smoke Test", () => {
      const gemini = new GeminiLLMProvider({ modelId: "gemini-3.7-flash" });

      it("generate real pequeno (1 token)", async () => {
        const start = performance.now();
        const res = await gemini.generate({
          messages: [{ role: "user", content: "Responda apenas: Aeternum" }],
          maxTokens: 5
        });
        const duration = Math.round(performance.now() - start);

        expect(res.providerId).toBe("gemini-llm-cloud");
        expect(res.modelId).toBe("gemini-3.7-flash");
        expect(res.text.length).toBeGreaterThan(0);

        // LOGGING SEGURO: Apenas metadados, sem vazar texto gerado
        console.log(
          JSON.stringify({
            provider: res.providerId,
            model: res.modelId,
            success: true,
            latency: duration,
            textLength: res.text.length
          })
        );
      }, 20000);
    });

    describe("Deepgram Cloud Smoke Test", () => {
      const deepgram = new DeepgramSTTProvider({ modelId: "nova-3" });

      it("batch transcription real com fixture sintético de fala", async () => {
        const fixture = loadSpeechFixture();
        const start = performance.now();
        const res = await deepgram.transcribe({
          audioBuffer: fixture,
          language: "pt",
          audioFormat: "wav",
          sampleRate: 16000
        });
        const duration = Math.round(performance.now() - start);

        expect(res.providerId).toBe("deepgram-stt-cloud");
        expect(res.modelId).toBe("nova-3");

        // LOGGING SEGURO: Apenas metadados, sem vazar texto transcrito
        console.log(
          JSON.stringify({
            provider: res.providerId,
            model: res.modelId,
            success: true,
            latency: duration,
            textLength: res.text.length
          })
        );
      }, 20000);
    });

    describe("Cartesia Cloud Smoke Test", () => {
      const cartesia = new CartesiaTTSProvider({ modelId: "sonic-3", apiVersion: "2026-08-14" });

      it("synthesize real frase curta", async () => {
        const start = performance.now();
        const res = await cartesia.synthesize({
          text: "Aeternum Atlas.",
          voiceProfileId: "pt-br-warm-male-01",
          language: "pt-BR",
          audioFormat: "wav",
          sampleRate: 24000
        });
        const duration = Math.round(performance.now() - start);

        expect(res.providerId).toBe("cartesia-tts-cloud");
        expect(res.modelId).toBe("sonic-3");
        expect(res.audioBuffer.length).toBeGreaterThan(0);

        // LOGGING SEGURO: Apenas metadados, sem salvar ou exibir áudio
        console.log(
          JSON.stringify({
            provider: res.providerId,
            model: res.modelId,
            success: true,
            latency: duration,
            audioBytes: res.audioBuffer.length
          })
        );
      }, 20000);
    });
  }
);
