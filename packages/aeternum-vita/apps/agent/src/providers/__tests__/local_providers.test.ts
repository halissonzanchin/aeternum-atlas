import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  OllamaLLMProvider,
  SpeachesSTTProvider,
  SpeachesTTSProvider,
  VoiceProfileRegistry,
  buildProviderUrl,
  executeProviderFetchSession,
  ProviderUnavailableError,
  ProviderTimeoutError,
  ProviderCancelledError,
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderInvalidResponseError
} from "../index.ts";

describe("Aeternum Local Inference Providers — Correctness Suite (Fase 2B.1.1)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("1. Base URL Normalization", () => {
    it("deve normalizar URL sem duplicar /v1", () => {
      expect(buildProviderUrl("http://localhost:11434", "/v1/chat/completions")).toBe(
        "http://localhost:11434/v1/chat/completions"
      );
      expect(buildProviderUrl("http://localhost:11434/v1", "/v1/chat/completions")).toBe(
        "http://localhost:11434/v1/chat/completions"
      );
      expect(buildProviderUrl("http://localhost:11434/v1/", "/v1/chat/completions")).toBe(
        "http://localhost:11434/v1/chat/completions"
      );
      expect(buildProviderUrl("http://localhost:8000/v1", "/v1/audio/transcriptions")).toBe(
        "http://localhost:8000/v1/audio/transcriptions"
      );
      expect(buildProviderUrl("http://localhost:8000/v1", "/api/tags")).toBe(
        "http://localhost:8000/api/tags"
      );
    });
  });

  describe("2. First Cause Wins & Cancellation / Timeout Engine", () => {
    it("deve priorizar cancelamento do usuário quando AbortSignal disparar antes do timeout", async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        executeProviderFetchSession(
          "http://localhost:11434/api/tags",
          { method: "GET" },
          "test-provider",
          { requestId: "req-1", signal: controller.signal, timeoutMs: 5000 }
        )
      ).rejects.toThrow(ProviderCancelledError);
    });

    it("deve priorizar ProviderTimeoutError quando deadline expirar antes do abort", async () => {
      global.fetch = vi.fn().mockImplementation(
        (_url, init) =>
          new Promise((_, reject) => {
            init.signal.addEventListener("abort", () => {
              const err = new Error("Abort");
              err.name = "AbortError";
              reject(err);
            });
          })
      );

      await expect(
        executeProviderFetchSession(
          "http://localhost:11434/api/tags",
          { method: "GET" },
          "test-provider",
          { requestId: "req-2", timeoutMs: 15 }
        )
      ).rejects.toThrow(ProviderTimeoutError);
    });

    it("deve limpar listeners e timers sem vazamentos", async () => {
      const controller = new AbortController();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({})
      } as unknown as Response);

      const session = await executeProviderFetchSession(
        "http://localhost:11434/api/tags",
        { method: "GET" },
        "test-provider",
        { requestId: "req-3", signal: controller.signal, timeoutMs: 1000 }
      );

      session.cleanup();
      expect(session.getCause()).toBe("NONE");
    });
  });

  describe("3. OllamaLLMProvider Hardening", () => {
    it("deve conectar base URL com e sem /v1 perfeitamente", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "Clavícula" } }]
        })
      } as unknown as Response);

      const p1 = new OllamaLLMProvider({ baseUrl: "http://localhost:11434/v1" });
      await p1.generate({ messages: [{ role: "user", content: "Olá" }] });
      expect(global.fetch).toHaveBeenCalledWith("http://localhost:11434/v1/chat/completions", expect.anything());

      const p2 = new OllamaLLMProvider({ baseUrl: "http://localhost:11434" });
      await p2.generate({ messages: [{ role: "user", content: "Olá" }] });
      expect(global.fetch).toHaveBeenCalledWith("http://localhost:11434/v1/chat/completions", expect.anything());
    });

    it("deve lançar ProviderInvalidResponseError para evento data SSE malformado", async () => {
      const streamChunks = ["data: { malformed json }\n\n"];
      let idx = 0;
      const mockStream = new ReadableStream({
        pull(controller) {
          if (idx < streamChunks.length) {
            controller.enqueue(new TextEncoder().encode(streamChunks[idx++]));
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
      await expect(async () => {
        for await (const _chunk of provider.stream({ messages: [{ role: "user", content: "Erro" }] })) {
          // loop
        }
      }).rejects.toThrow(ProviderInvalidResponseError);
    });
  });

  describe("4. SpeachesSTTProvider Capabilities & MIME", () => {
    it("deve mapear MIME e extensões de arquivo corretamente para webm, ogg, wav e pcm", async () => {
      let capturedBody: FormData | undefined;
      global.fetch = vi.fn().mockImplementation(async (_url, init) => {
        capturedBody = init.body;
        return {
          ok: true,
          json: async () => ({ text: "Transcrição" })
        };
      });

      const stt = new SpeachesSTTProvider();

      await stt.transcribe({
        audioBuffer: new Uint8Array([1, 2]),
        language: "pt",
        audioFormat: "webm"
      });
      const webmFile = capturedBody?.get("file") as File;
      expect(webmFile.name).toBe("audio.webm");
      expect(webmFile.type).toBe("audio/webm");

      await stt.transcribe({
        audioBuffer: new Uint8Array([1, 2]),
        language: "pt",
        audioFormat: "ogg"
      });
      const oggFile = capturedBody?.get("file") as File;
      expect(oggFile.name).toBe("audio.ogg");
      expect(oggFile.type).toBe("audio/ogg");

      await stt.transcribe({
        audioBuffer: new Uint8Array([1, 2]),
        language: "pt",
        audioFormat: "pcm"
      });
      const pcmFile = capturedBody?.get("file") as File;
      expect(pcmFile.name).toBe("audio.pcm");
      expect(pcmFile.type).toBe("application/octet-stream");
    });

    it("deve retornar confidence undefined quando não for fornecido pelo Speaches", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ text: "Transcrição sem confidence" })
      } as unknown as Response);

      const stt = new SpeachesSTTProvider();
      const res = await stt.transcribe({
        audioBuffer: new Uint8Array([1]),
        language: "pt"
      });

      expect(res.confidence).toBeUndefined();
    });

    it("health: deve marcar DEGRADED se o modelo exato configurado não existir", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ id: "outromodelo-whisper" }]
        })
      } as unknown as Response);

      const stt = new SpeachesSTTProvider({ modelId: "Systran/faster-whisper-small" });
      const health = await stt.health();

      expect(health.status).toBe("DEGRADED");
      expect(health.details?.model_available).toBe(false);
    });
  });

  describe("5. SpeachesTTSProvider Profile Health & SampleRate", () => {
    it("health: deve marcar DEGRADED se algum modelo dos VoiceProfiles cadastrados estiver ausente", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ id: "speaches-ai/Kokoro-82M-v1.0-ONNX" }]
        })
      } as unknown as Response);

      const registry = new VoiceProfileRegistry(true);
      const tts = new SpeachesTTSProvider({ registry });
      const health = await tts.health();

      expect(health.status).toBe("DEGRADED");
      expect(health.details?.unavailable_profile_count).toBeGreaterThan(0);
      expect(health.details?.unavailable_profile_ids).toContain("de-clear-male-01");
    });

    it("synthesize: deve retornar sampleRate factual do perfil", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer
      } as unknown as Response);

      const registry = new VoiceProfileRegistry(true);
      const tts = new SpeachesTTSProvider({ registry });

      const resKokoro = await tts.synthesize({
        text: "Teste",
        voiceProfileId: "pt-br-warm-male-01",
        language: "pt-BR"
      });
      expect(resKokoro.sampleRate).toBe(24000);

      const resPiper = await tts.synthesize({
        text: "Hallo",
        voiceProfileId: "de-clear-male-01",
        language: "de"
      });
      expect(resPiper.sampleRate).toBe(22050);
    });
  });
});
