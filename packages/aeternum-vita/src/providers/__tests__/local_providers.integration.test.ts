import { describe, it, expect } from "vitest";
import {
  OllamaLLMProvider,
  SpeachesTTSProvider,
  VoiceProfileRegistry
} from "../index.ts";

const isIntegrationEnabled = process.env.RUN_LOCAL_PROVIDER_INTEGRATION === "true";

describe.skipIf(!isIntegrationEnabled)(
  "Aeternum Local Inference Providers — Live Integration Tests (HP Victus)",
  () => {
    it("Ollama: health & generate real contra localhost:11434", async () => {
      const ollama = new OllamaLLMProvider({
        baseUrl: "http://localhost:11434",
        modelId: "qwen2.5:3b"
      });

      const health = await ollama.health();
      expect(["HEALTHY", "DEGRADED"]).toContain(health.status);

      if (health.status === "HEALTHY") {
        const start = performance.now();
        const res = await ollama.generate({
          messages: [{ role: "user", content: "Diga 'Aeternum Atlas' em 2 palavras." }],
          maxTokens: 10
        });
        const duration = Math.round(performance.now() - start);

        expect(res.text.length).toBeGreaterThan(0);
        expect(res.providerId).toBe("ollama-local");
        console.log("✅ Ollama live latency:", duration, "ms | Text:", res.text.trim());
      }
    });

    it("Speaches: health & TTS real contra localhost:8000", async () => {
      const registry = new VoiceProfileRegistry(true);
      const tts = new SpeachesTTSProvider({
        baseUrl: "http://localhost:8000",
        apiKey: process.env.SPEACHES_API_KEY || "speaches_secret_local_key_99",
        registry
      });

      const health = await tts.health();
      expect(["HEALTHY", "DEGRADED"]).toContain(health.status);

      if (health.status === "HEALTHY") {
        const start = performance.now();
        const res = await tts.synthesize({
          text: "Aeternum Atlas",
          voiceProfileId: "pt-br-warm-male-01", language: "pt-BR"
        });
        const duration = Math.round(performance.now() - start);

        expect(res.audioBuffer.length).toBeGreaterThan(0);
        console.log("✅ Speaches TTS live latency:", duration, "ms | Audio bytes:", res.audioBuffer.length);
      }
    });
  }
);
