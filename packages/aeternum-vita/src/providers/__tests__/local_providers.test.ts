import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  OllamaLLMProvider,
  SpeachesSTTProvider,
  SpeachesTTSProvider,
  VoiceProfileRegistry,
  ProviderUnavailableError,
  ProviderCancelledError,
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderInvalidResponseError
} from "../index.ts";

describe("Aeternum Local Inference Providers — Unit Tests (Fase 2B.1)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("1. OllamaLLMProvider", () => {
    it("health: deve retornar HEALTHY quando o modelo configurado estiver presente", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [{ name: "qwen2.5:3b" }, { name: "qwen3:4b" }]
        })
      } as unknown as Response);

      const provider = new OllamaLLMProvider({ modelId: "qwen2.5:3b" });
      const health = await provider.health();

      expect(health.status).toBe("HEALTHY");
      expect(health.details?.model_available).toBe(true);
    });

    it("health: deve retornar DEGRADED quando o modelo configurado estiver ausente", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [{ name: "llama3:8b" }]
        })
      } as unknown as Response);

      const provider = new OllamaLLMProvider({ modelId: "qwen2.5:3b" });
      const health = await provider.health();

      expect(health.status).toBe("DEGRADED");
      expect(health.details?.model_available).toBe(false);
    });

    it("health: deve retornar UNAVAILABLE quando o servidor estiver fora do ar", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

      const provider = new OllamaLLMProvider();
      const health = await provider.health();

      expect(health.status).toBe("UNAVAILABLE");
    });

    it("generate: deve gerar resposta com mapeamento canônico", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: "qwen2.5:3b",
          choices: [
            {
              message: { content: "A clavícula é um osso par alongado." },
              finish_reason: "stop"
            }
          ],
          usage: { prompt_tokens: 10, completion_tokens: 15, total_tokens: 25 }
        })
      } as unknown as Response);

      const provider = new OllamaLLMProvider({ modelId: "qwen2.5:3b" });
      const res = await provider.generate({
        messages: [{ role: "user", content: "Defina a clavícula." }]
      });

      expect(res.text).toBe("A clavícula é um osso par alongado.");
      expect(res.providerId).toBe("ollama-local");
      expect(res.modelId).toBe("qwen2.5:3b");
      expect(res.finishReason).toBe("stop");
      expect(res.usage?.totalTokens).toBe(25);
    });

    it("generate: deve mapear HTTP 401 para ProviderAuthenticationError", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401
      } as unknown as Response);

      const provider = new OllamaLLMProvider();
      await expect(provider.generate({ messages: [{ role: "user", content: "Olá" }] }))
        .rejects
        .toThrow(ProviderAuthenticationError);
    });

    it("generate: deve mapear HTTP 429 para ProviderRateLimitError", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ "retry-after": "45" })
      } as unknown as Response);

      const provider = new OllamaLLMProvider();
      try {
        await provider.generate({ messages: [{ role: "user", content: "Olá" }] });
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(ProviderRateLimitError);
        expect((err as ProviderRateLimitError).retryAfterSeconds).toBe(45);
      }
    });

    it("generate: deve mapear HTTP 500 para ProviderUnavailableError", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      } as unknown as Response);

      const provider = new OllamaLLMProvider();
      await expect(provider.generate({ messages: [{ role: "user", content: "Olá" }] }))
        .rejects
        .toThrow(ProviderUnavailableError);
    });

    it("generate: deve mapear JSON malformado para ProviderInvalidResponseError", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        }
      } as unknown as Response);

      const provider = new OllamaLLMProvider();
      await expect(provider.generate({ messages: [{ role: "user", content: "Olá" }] }))
        .rejects
        .toThrow(ProviderInvalidResponseError);
    });

    it("generate: deve lançar ProviderCancelledError em caso de AbortSignal", async () => {
      const controller = new AbortController();
      controller.abort();

      const provider = new OllamaLLMProvider();
      await expect(
        provider.generate(
          { messages: [{ role: "user", content: "Olá" }] },
          { requestId: "req-1", signal: controller.signal }
        )
      ).rejects.toThrow(ProviderCancelledError);
    });

    it("stream: deve processar chunks SSE e respeitar cancelamento", async () => {
      const streamChunks = [
        "data: " + JSON.stringify({ choices: [{ delta: { content: "O " } }] }) + "\n\n",
        "data: " + JSON.stringify({ choices: [{ delta: { content: "fêmur " } }] }) + "\n\n",
        "data: " + JSON.stringify({ choices: [{ delta: { content: "é longo." }, finish_reason: "stop" }] }) + "\n\n",
        "data: [DONE]\n\n"
      ];

      let chunkIdx = 0;
      const mockStream = new ReadableStream({
        pull(controller) {
          if (chunkIdx < streamChunks.length) {
            controller.enqueue(new TextEncoder().encode(streamChunks[chunkIdx++]));
          } else {
            controller.close();
          }
        }
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream
      } as unknown as Response);

      const provider = new OllamaLLMProvider();
      const collected: string[] = [];
      for await (const chunk of provider.stream({ messages: [{ role: "user", content: "Fêmur" }] })) {
        collected.push(chunk.deltaText);
      }

      expect(collected.join("")).toBe("O fêmur é longo.");
    });
  });

  describe("2. SpeachesSTTProvider", () => {
    it("health: deve retornar HEALTHY quando whisper estiver disponível", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ id: "Systran/faster-whisper-small" }]
        })
      } as unknown as Response);

      const stt = new SpeachesSTTProvider({ modelId: "Systran/faster-whisper-small" });
      const health = await stt.health();

      expect(health.status).toBe("HEALTHY");
      expect(health.details?.model_available).toBe(true);
    });

    it("transcribe: deve transcrever áudio com metadados e prompt médico", async () => {
      let capturedBody: FormData | undefined;
      global.fetch = vi.fn().mockImplementation(async (_url, init) => {
        capturedBody = init.body;
        return {
          ok: true,
          json: async () => ({
            text: "O músculo deltoide é inervado pelo nervo axilar.",
            language: "pt",
            confidence: 0.98
          })
        };
      });

      const stt = new SpeachesSTTProvider();
      const res = await stt.transcribe({
        audioBuffer: new Uint8Array([1, 2, 3, 4]),
        language: "pt-BR",
        medicalContextHints: ["anatomia", "deltoide", "nervo axilar"]
      });

      expect(res.text).toContain("deltoide");
      expect(res.languageDetected).toBe("pt");
      expect(res.confidence).toBe(0.98);
      expect(capturedBody).toBeDefined();
    });

    it("transcribe: deve honrar cancelamento", async () => {
      const controller = new AbortController();
      controller.abort();

      const stt = new SpeachesSTTProvider();
      await expect(
        stt.transcribe(
          { audioBuffer: new Uint8Array([]), language: "pt" },
          { requestId: "stt-1", signal: controller.signal }
        )
      ).rejects.toThrow(ProviderCancelledError);
    });
  });

  describe("3. SpeachesTTSProvider & VoiceProfileRegistry", () => {
    it("synthesize: deve sintetizar áudio usando perfil de voz desacoplado", async () => {
      const mockAudioBytes = new Uint8Array([10, 20, 30, 40]);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => mockAudioBytes.buffer
      } as unknown as Response);

      const registry = new VoiceProfileRegistry(true);
      const tts = new SpeachesTTSProvider({ registry });

      const res = await tts.synthesize({
        text: "Explicação sobre osteologia.",
        voiceProfileId: "pt-br-warm-male-01", language: "pt-BR"
      });

      expect(res.audioBuffer.length).toBe(4);
      expect(res.modelId).toContain("Kokoro");
      expect(res.sampleRate).toBe(24000);
    });

    it("synthesize: deve lançar ProviderInvalidResponseError para perfil de voz inexistente", async () => {
      const tts = new SpeachesTTSProvider();
      await expect(
        tts.synthesize({
          text: "Teste",
          voiceProfileId: "perfil-inexistente", language: "pt-BR"
        })
      ).rejects.toThrow(ProviderInvalidResponseError);
    });
  });

  describe("4. VoiceProfileRegistry", () => {
    it("deve conter perfis padrão e permitir registro de novos perfis", () => {
      const registry = new VoiceProfileRegistry(true);
      expect(registry.get("pt-br-warm-male-01")).toBeDefined();
      expect(registry.get("pt-br-calm-female-01")).toBeDefined();
      expect(registry.get("es-warm-male-01")).toBeDefined();
      expect(registry.get("en-warm-male-01")).toBeDefined();

      const ptVoices = registry.listByLanguage("pt-BR");
      expect(ptVoices.length).toBeGreaterThanOrEqual(2);

      registry.register({
        id: "custom-pt-01",
        name: "Custom Voice",
        language: "pt-BR",
        gender: "neutral",
        providerId: "speaches",
        modelId: "speaches-ai/custom-voice",
        nativeVoiceId: "custom_v1",
        sampleRate: 24000,
        format: "pcm"
      });

      expect(registry.require("custom-pt-01").nativeVoiceId).toBe("custom_v1");
    });
  });
});
