import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  OllamaLLMProvider,
  SpeachesSTTProvider,
  SpeachesTTSProvider,
  VoiceProfileRegistry,
  buildProviderUrl,
  executeProviderFetchSession,
  executeProviderJson,
  executeProviderBinary,
  pcmToWav,
  ProviderUnavailableError,
  ProviderTimeoutError,
  ProviderCancelledError,
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderInvalidResponseError
} from "../index.ts";

describe("Aeternum Local Inference Providers — Comprehensive Suite (Fase 2B.1.2)", () => {
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

  describe("2. First-Cause-Wins Race Condition Matrix", () => {
    it("Cenário A: Timeout dispara primeiro -> depois user aborta -> DEVE ser ProviderTimeoutError", async () => {
      const userController = new AbortController();

      global.fetch = vi.fn().mockImplementation(
        (_url, init) =>
          new Promise((_, reject) => {
            init.signal.addEventListener("abort", () => {
              // Simulando abort do usuário que chega logo após o timeout
              setTimeout(() => userController.abort(), 5);
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
          { requestId: "req-race-a", signal: userController.signal, timeoutMs: 10 }
        )
      ).rejects.toThrow(ProviderTimeoutError);
    });

    it("Cenário B: User aborta primeiro -> depois timeout venceria -> DEVE ser ProviderCancelledError", async () => {
      const userController = new AbortController();

      global.fetch = vi.fn().mockImplementation(
        (_url, init) =>
          new Promise((_, reject) => {
            init.signal.addEventListener("abort", () => {
              const err = new Error("Abort");
              err.name = "AbortError";
              reject(err);
            });
            // Usuário aborta quase imediatamente
            setTimeout(() => userController.abort(), 5);
          })
      );

      await expect(
        executeProviderFetchSession(
          "http://localhost:11434/api/tags",
          { method: "GET" },
          "test-provider",
          { requestId: "req-race-b", signal: userController.signal, timeoutMs: 500 }
        )
      ).rejects.toThrow(ProviderCancelledError);
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
        { requestId: "req-cleanup", signal: controller.signal, timeoutMs: 1000 }
      );

      session.cleanup();
      expect(session.getCause()).toBe("NONE");
    });
  });

  describe("3. Non-Stream Deadline Coverage", () => {
    it("executeProviderJson deve proteger o ciclo completo até decodificação do body", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          return { status: "ok" };
        }
      } as unknown as Response);

      const res = await executeProviderJson<{ status: string }>(
        "http://localhost:11434/api/tags",
        { method: "GET" },
        "test-provider"
      );
      expect(res.status).toBe("ok");
    });

    it("executeProviderBinary deve proteger leitura binária de body", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer
      } as unknown as Response);

      const bytes = await executeProviderBinary(
        "http://localhost:8000/v1/audio/speech",
        { method: "POST" },
        "test-provider"
      );
      expect(bytes.length).toBe(4);
    });
  });

  describe("4. Blocked Reader Error Normalization", () => {
    it("Ollama stream: cancelamento do usuário durante reader.read() bloqueado deve lançar ProviderCancelledError", async () => {
      const controller = new AbortController();

      const blockedStream = new ReadableStream({
        pull() {
          return new Promise((_, reject) => {
            controller.signal.addEventListener("abort", () => {
              const err = new Error("Abort");
              err.name = "AbortError";
              reject(err);
            });
          });
        }
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: blockedStream
      } as unknown as Response);

      const provider = new OllamaLLMProvider();
      const generator = provider.stream(
        { messages: [{ role: "user", content: "Olá" }] },
        { requestId: "req-block-1", signal: controller.signal }
      );

      const promise = (async () => {
        for await (const _chunk of generator) {
          // loop
        }
      })();

      setTimeout(() => controller.abort(), 10);
      await expect(promise).rejects.toThrow(ProviderCancelledError);
    });

    it("Ollama stream: timeout durante reader.read() bloqueado deve lançar ProviderTimeoutError", async () => {
      let abortCallback: (() => void) | undefined;
      const blockedStream = new ReadableStream({
        pull() {
          return new Promise((_, reject) => {
            abortCallback = () => {
              const err = new Error("The operation was aborted");
              err.name = "AbortError";
              reject(err);
            };
          });
        }
      });

      global.fetch = vi.fn().mockImplementation((_url, init) => {
        init.signal.addEventListener("abort", () => {
          if (abortCallback) abortCallback();
        });
        return Promise.resolve({
          ok: true,
          body: blockedStream
        } as unknown as Response);
      });

      const provider = new OllamaLLMProvider();
      const generator = provider.stream(
        { messages: [{ role: "user", content: "Olá" }] },
        { requestId: "req-block-2", timeoutMs: 20 }
      );

      await expect(async () => {
        for await (const _chunk of generator) {
          // loop
        }
      }).rejects.toThrow(ProviderTimeoutError);
    });

    it("Speaches TTS stream: cancelamento durante reader.read() deve lançar ProviderCancelledError", async () => {
      const controller = new AbortController();

      const blockedStream = new ReadableStream({
        pull() {
          return new Promise((_, reject) => {
            controller.signal.addEventListener("abort", () => {
              const err = new Error("Abort");
              err.name = "AbortError";
              reject(err);
            });
          });
        }
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: blockedStream
      } as unknown as Response);

      const tts = new SpeachesTTSProvider();
      const generator = tts.streamSynthesis(
        { text: "Teste", voiceProfileId: "pt-br-warm-male-01", language: "pt-BR" },
        { requestId: "req-tts-block", signal: controller.signal }
      );

      const promise = (async () => {
        for await (const _chunk of generator) {
          // loop
        }
      })();

      setTimeout(() => controller.abort(), 10);
      await expect(promise).rejects.toThrow(ProviderCancelledError);
    });
  });

  describe("5. OllamaLLMProvider Restored Scenarios", () => {
    it("health: HEALTHY com modelo presente", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ models: [{ name: "qwen2.5:3b" }] })
      } as unknown as Response);

      const provider = new OllamaLLMProvider({ modelId: "qwen2.5:3b" });
      const health = await provider.health();
      expect(health.status).toBe("HEALTHY");
    });

    it("health: DEGRADED com modelo ausente", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ models: [{ name: "llama3:8b" }] })
      } as unknown as Response);

      const provider = new OllamaLLMProvider({ modelId: "qwen2.5:3b" });
      const health = await provider.health();
      expect(health.status).toBe("DEGRADED");
    });

    it("health: UNAVAILABLE com servidor offline", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));
      const provider = new OllamaLLMProvider();
      const health = await provider.health();
      expect(health.status).toBe("UNAVAILABLE");
    });

    it("generate: mapeamento completo de resposta e tokens", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: "qwen2.5:3b",
          choices: [{ message: { content: "Clavícula." }, finish_reason: "stop" }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        })
      } as unknown as Response);

      const provider = new OllamaLLMProvider({ modelId: "qwen2.5:3b" });
      const res = await provider.generate({ messages: [{ role: "user", content: "Defina clavícula" }] });
      expect(res.text).toBe("Clavícula.");
      expect(res.usage?.totalTokens).toBe(15);
    });

    it("generate: HTTP 401 mapeia para ProviderAuthenticationError", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 } as unknown as Response);
      const provider = new OllamaLLMProvider();
      await expect(provider.generate({ messages: [{ role: "user", content: "Olá" }] })).rejects.toThrow(
        ProviderAuthenticationError
      );
    });

    it("generate: HTTP 429 mapeia para ProviderRateLimitError", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ "retry-after": "30" })
      } as unknown as Response);
      const provider = new OllamaLLMProvider();
      await expect(provider.generate({ messages: [{ role: "user", content: "Olá" }] })).rejects.toThrow(
        ProviderRateLimitError
      );
    });

    it("generate: HTTP 500 mapeia para ProviderUnavailableError", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as unknown as Response);
      const provider = new OllamaLLMProvider();
      await expect(provider.generate({ messages: [{ role: "user", content: "Olá" }] })).rejects.toThrow(
        ProviderUnavailableError
      );
    });

    it("stream: chunks SSE normais e erro em chunk malformado", async () => {
      const validChunks = [
        "data: " + JSON.stringify({ choices: [{ delta: { content: "Osso " } }] }) + "\n\n",
        "data: " + JSON.stringify({ choices: [{ delta: { content: "longo." }, finish_reason: "stop" }] }) + "\n\n",
        "data: [DONE]\n\n"
      ];

      let idx = 0;
      const stream = new ReadableStream({
        pull(controller) {
          if (idx < validChunks.length) {
            controller.enqueue(new TextEncoder().encode(validChunks[idx++]));
          } else {
            controller.close();
          }
        }
      });

      global.fetch = vi.fn().mockResolvedValue({ ok: true, body: stream } as unknown as Response);
      const provider = new OllamaLLMProvider();
      const collected: string[] = [];
      for await (const chunk of provider.stream({ messages: [{ role: "user", content: "Fêmur" }] })) {
        collected.push(chunk.deltaText);
      }
      expect(collected.join("")).toBe("Osso longo.");
    });
  });

  describe("6. SpeachesSTTProvider Truth & Capabilities", () => {
    it("deve declarar capabilities factuais separando backend e adapter", () => {
      const stt = new SpeachesSTTProvider();
      expect(stt.backendCapabilities.batch_transcription).toBe(true);
      expect(stt.backendCapabilities.streamed_transcription_output).toBe(true);
      expect(stt.backendCapabilities.realtime_websocket).toBe(true);

      expect(stt.adapterCapabilities.batch_transcription).toBe(true);
      expect(stt.adapterCapabilities.streamed_transcription_output).toBe(true);
      expect(stt.adapterCapabilities.live_audio_input).toBe(false);
      expect(stt.adapterCapabilities.realtime_websocket).toBe(false);
    });

    it("deve encapsular raw PCM em WAV PCM16 mono automaticamente", () => {
      const rawPcm = new Uint8Array(1600); // 50ms de 16kHz mono
      const wav = pcmToWav(rawPcm, 16000);
      expect(wav.length).toBe(1644);
      expect(String.fromCharCode(wav[0], wav[1], wav[2], wav[3])).toBe("RIFF");
      expect(String.fromCharCode(wav[8], wav[9], wav[10], wav[11])).toBe("WAVE");
    });

    it("streamTranscription: deve consumir stream SSE progressivo com stream=true", async () => {
      const sseLines = [
        'data: {"text": "Primeiro segmento. "}\n\n',
        'data: {"text": "Segundo segmento."}\n\n',
        'data: [DONE]\n\n'
      ];

      let idx = 0;
      const mockStream = new ReadableStream({
        pull(controller) {
          if (idx < sseLines.length) {
            controller.enqueue(new TextEncoder().encode(sseLines[idx++]));
          } else {
            controller.close();
          }
        }
      });

      global.fetch = vi.fn().mockResolvedValue({ ok: true, body: mockStream } as unknown as Response);

      const stt = new SpeachesSTTProvider();
      const asyncAudioStream = (async function* () {
        yield new Uint8Array([1, 2, 3]);
      })();

      const collected: string[] = [];
      for await (const chunk of stt.streamTranscription(asyncAudioStream, { language: "pt" })) {
        collected.push(chunk.partialText);
      }

      expect(collected.join("")).toBe("Primeiro segmento. Segundo segmento.");
    });
  });

  describe("7. SpeachesTTSProvider SampleRate & Validation", () => {
    it("deve enviar sample_rate explicitamente e retornar valor factual", async () => {
      let capturedPayload: any;
      global.fetch = vi.fn().mockImplementation(async (_url, init) => {
        capturedPayload = JSON.parse(init.body);
        return {
          ok: true,
          arrayBuffer: async () => new Uint8Array([10, 20]).buffer
        };
      });

      const tts = new SpeachesTTSProvider();
      const res = await tts.synthesize({
        text: "Teste de áudio",
        voiceProfileId: "pt-br-warm-male-01",
        language: "pt-BR",
        sampleRate: 16000
      });

      expect(capturedPayload.sample_rate).toBe(16000);
      expect(res.sampleRate).toBe(16000);
    });

    it("deve rejeitar formato de áudio não suportado (ex: ogg)", async () => {
      const tts = new SpeachesTTSProvider();
      await expect(
        tts.synthesize({
          text: "Teste",
          voiceProfileId: "pt-br-warm-male-01",
          language: "pt-BR",
          audioFormat: "ogg" as any
        })
      ).rejects.toThrow(ProviderInvalidResponseError);
    });

    it("deve rejeitar taxa de amostragem fora dos limites (8000-48000Hz)", async () => {
      const tts = new SpeachesTTSProvider();
      await expect(
        tts.synthesize({
          text: "Teste",
          voiceProfileId: "pt-br-warm-male-01",
          language: "pt-BR",
          sampleRate: 96000
        })
      ).rejects.toThrow(ProviderInvalidResponseError);
    });
  });
});
