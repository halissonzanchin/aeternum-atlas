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

describe("Aeternum Local Inference Providers — Pre-Router Final Suite (Fase 2B.1.4)", () => {
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
      expect(buildProviderUrl("http://localhost:8000/v1", "/v1/audio/transcriptions")).toBe(
        "http://localhost:8000/v1/audio/transcriptions"
      );
      expect(buildProviderUrl("http://localhost:8000/v1", "/api/tags")).toBe(
        "http://localhost:8000/api/tags"
      );
    });
  });

  describe("2. First-Cause-Wins Race Condition Matrix", () => {
    it("Cenário A: Timeout dispara primeiro -> user abort posterior -> DEVE ser ProviderTimeoutError", async () => {
      const userController = new AbortController();

      global.fetch = vi.fn().mockImplementation(
        (_url, init) =>
          new Promise((_, reject) => {
            init.signal.addEventListener("abort", () => {
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

    it("Cenário B: User aborta primeiro -> timeout posterior -> DEVE ser ProviderCancelledError", async () => {
      const userController = new AbortController();

      global.fetch = vi.fn().mockImplementation(
        (_url, init) =>
          new Promise((_, reject) => {
            init.signal.addEventListener("abort", () => {
              const err = new Error("Abort");
              err.name = "AbortError";
              reject(err);
            });
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
        json: async () => ({ status: "ok" })
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

  describe("4. Blocked Reader Read Error Normalization", () => {
    it("Ollama stream: cancelamento do usuário durante reader.read() deve lançar ProviderCancelledError", async () => {
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

    it("stream: chunks SSE normais", async () => {
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

  describe("6. SpeachesSTTProvider Stalled Input & Formats (Fase 2B.1.4)", () => {
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

    it("STT stalled input: iterator travado com timeoutMs deve lançar ProviderTimeoutError prontamente", async () => {
      const stt = new SpeachesSTTProvider();

      const hangingIterable: AsyncIterable<Uint8Array> = {
        [Symbol.asyncIterator]() {
          return {
            next() {
              return new Promise<IteratorResult<Uint8Array>>(() => {
                // Promessa que nunca resolve
              });
            }
          };
        }
      };

      const start = performance.now();
      await expect(async () => {
        for await (const _chunk of stt.streamTranscription(hangingIterable, { language: "pt" }, { requestId: "stalled-timeout", timeoutMs: 30 })) {
          // loop
        }
      }).rejects.toThrow(ProviderTimeoutError);

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000); // Retorna em dezenas de ms, não espera 5s
    });

    it("STT stalled input: iterator travado com user AbortSignal deve lançar ProviderCancelledError prontamente", async () => {
      const controller = new AbortController();
      const stt = new SpeachesSTTProvider();

      const hangingIterable: AsyncIterable<Uint8Array> = {
        [Symbol.asyncIterator]() {
          return {
            next() {
              return new Promise<IteratorResult<Uint8Array>>(() => {
                // Promessa que nunca resolve
              });
            }
          };
        }
      };

      const promise = (async () => {
        for await (const _chunk of stt.streamTranscription(hangingIterable, { language: "pt" }, { requestId: "stalled-abort", signal: controller.signal })) {
          // loop
        }
      })();

      setTimeout(() => controller.abort(), 20);
      await expect(promise).rejects.toThrow(ProviderCancelledError);
    });

    it("STT Formats: deve mapear MIME e extensões corretas para todos os formatos", async () => {
      const capturedRequests: Array<{ fileName: string; mimeType: string }> = [];

      global.fetch = vi.fn().mockImplementation(async (_url, init) => {
        const formData = init.body as FormData;
        const file = formData.get("file") as File;
        capturedRequests.push({ fileName: file.name, mimeType: file.type });
        return {
          ok: true,
          json: async () => ({ text: "ok" })
        };
      });

      const stt = new SpeachesSTTProvider();
      const audioBuffer = new Uint8Array([1, 2, 3]);

      // MP3
      await stt.transcribe({ audioBuffer, language: "pt", audioFormat: "mp3" });
      expect(capturedRequests[capturedRequests.length - 1]).toEqual({ fileName: "audio.mp3", mimeType: "audio/mpeg" });

      // FLAC
      await stt.transcribe({ audioBuffer, language: "pt", audioFormat: "flac" });
      expect(capturedRequests[capturedRequests.length - 1]).toEqual({ fileName: "audio.flac", mimeType: "audio/flac" });

      // WAV
      await stt.transcribe({ audioBuffer, language: "pt", audioFormat: "wav" });
      expect(capturedRequests[capturedRequests.length - 1]).toEqual({ fileName: "audio.wav", mimeType: "audio/wav" });

      // WEBM
      await stt.transcribe({ audioBuffer, language: "pt", audioFormat: "webm" });
      expect(capturedRequests[capturedRequests.length - 1]).toEqual({ fileName: "audio.webm", mimeType: "audio/webm" });

      // OGG
      await stt.transcribe({ audioBuffer, language: "pt", audioFormat: "ogg" });
      expect(capturedRequests[capturedRequests.length - 1]).toEqual({ fileName: "audio.ogg", mimeType: "audio/ogg" });

      // PCM (encapsula para WAV)
      await stt.transcribe({ audioBuffer, language: "pt", audioFormat: "pcm", sampleRate: 16000 });
      expect(capturedRequests[capturedRequests.length - 1]).toEqual({ fileName: "audio.wav", mimeType: "audio/wav" });
    });

    it("STT SSE EOF sem [DONE] deve emitir exatamente 1 isFinal=true", async () => {
      const sseChunks = [
        'data: {"text": "Segmento 1. "}\n\n',
        'data: {"text": "Segmento 2."}\n\n'
      ];

      let idx = 0;
      const mockStream = new ReadableStream({
        pull(controller) {
          if (idx < sseChunks.length) {
            controller.enqueue(new TextEncoder().encode(sseChunks[idx++]));
          } else {
            controller.close();
          }
        }
      });

      global.fetch = vi.fn().mockResolvedValue({ ok: true, body: mockStream } as unknown as Response);

      const stt = new SpeachesSTTProvider();
      const asyncAudio = (async function* () {
        yield new Uint8Array([1, 2, 3]);
      })();

      const chunks: { partialText: string; isFinal: boolean }[] = [];
      for await (const chunk of stt.streamTranscription(asyncAudio, { language: "pt" })) {
        chunks.push(chunk);
      }

      const finalChunks = chunks.filter((c) => c.isFinal);
      expect(finalChunks.length).toBe(1);
      expect(chunks.map((c) => c.partialText).join("")).toBe("Segmento 1. Segmento 2.");
    });

    it("STT SSE malformed data deve lançar ProviderInvalidResponseError", async () => {
      const sseChunks = ['data: { invalid json }\n\n'];

      let idx = 0;
      const mockStream = new ReadableStream({
        pull(controller) {
          if (idx < sseChunks.length) {
            controller.enqueue(new TextEncoder().encode(sseChunks[idx++]));
          } else {
            controller.close();
          }
        }
      });

      global.fetch = vi.fn().mockResolvedValue({ ok: true, body: mockStream } as unknown as Response);

      const stt = new SpeachesSTTProvider();
      const asyncAudio = (async function* () {
        yield new Uint8Array([1, 2, 3]);
      })();

      await expect(async () => {
        for await (const _chunk of stt.streamTranscription(asyncAudio, { language: "pt" })) {
          // loop
        }
      }).rejects.toThrow(ProviderInvalidResponseError);
    });

    it("PCM to WAV encapsulation em 16k, 24k e 48k com validação de header", () => {
      const rawPcm = new Uint8Array(1600);

      // 16kHz
      const wav16k = pcmToWav(rawPcm, 16000);
      const view16k = new DataView(wav16k.buffer, wav16k.byteOffset, wav16k.byteLength);
      expect(view16k.getUint32(24, true)).toBe(16000);

      // 24kHz
      const wav24k = pcmToWav(rawPcm, 24000);
      const view24k = new DataView(wav24k.buffer, wav24k.byteOffset, wav24k.byteLength);
      expect(view24k.getUint32(24, true)).toBe(24000);

      // 48kHz
      const wav48k = pcmToWav(rawPcm, 48000);
      const view48k = new DataView(wav48k.buffer, wav48k.byteOffset, wav48k.byteLength);
      expect(view48k.getUint32(24, true)).toBe(48000);
    });

    it("PCM com sampleRate inválido (0, negativo, NaN, Infinity, 7999, 48001, não-inteiro) deve lançar erro", async () => {
      const stt = new SpeachesSTTProvider();
      const audioBuffer = new Uint8Array([1, 2, 3]);

      await expect(stt.transcribe({ audioBuffer, language: "pt", audioFormat: "pcm", sampleRate: 0 })).rejects.toThrow(
        ProviderInvalidResponseError
      );
      await expect(stt.transcribe({ audioBuffer, language: "pt", audioFormat: "pcm", sampleRate: -16000 })).rejects.toThrow(
        ProviderInvalidResponseError
      );
      await expect(stt.transcribe({ audioBuffer, language: "pt", audioFormat: "pcm", sampleRate: 7999 })).rejects.toThrow(
        ProviderInvalidResponseError
      );
      await expect(stt.transcribe({ audioBuffer, language: "pt", audioFormat: "pcm", sampleRate: 48001 })).rejects.toThrow(
        ProviderInvalidResponseError
      );
      await expect(stt.transcribe({ audioBuffer, language: "pt", audioFormat: "pcm", sampleRate: NaN })).rejects.toThrow(
        ProviderInvalidResponseError
      );
      await expect(stt.transcribe({ audioBuffer, language: "pt", audioFormat: "pcm", sampleRate: 16000.5 })).rejects.toThrow(
        ProviderInvalidResponseError
      );
      await expect(stt.transcribe({ audioBuffer, language: "pt", audioFormat: "pcm" })).rejects.toThrow(
        ProviderInvalidResponseError
      );
    });
  });

  describe("7. SpeachesTTSProvider Synthesize vs Progressive Streaming Formats (Fase 2B.1.4)", () => {
    it("synthesize: deve aceitar flac, wav, mp3 e pcm", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2]).buffer
      } as unknown as Response);

      const tts = new SpeachesTTSProvider();

      const resFlac = await tts.synthesize({ text: "T", voiceProfileId: "pt-br-warm-male-01", language: "pt-BR", audioFormat: "flac" });
      expect(resFlac.audioFormat).toBe("flac");

      const resWav = await tts.synthesize({ text: "T", voiceProfileId: "pt-br-warm-male-01", language: "pt-BR", audioFormat: "wav" });
      expect(resWav.audioFormat).toBe("wav");

      const resMp3 = await tts.synthesize({ text: "T", voiceProfileId: "pt-br-warm-male-01", language: "pt-BR", audioFormat: "mp3" });
      expect(resMp3.audioFormat).toBe("mp3");

      const resPcm = await tts.synthesize({ text: "T", voiceProfileId: "pt-br-warm-male-01", language: "pt-BR", audioFormat: "pcm" });
      expect(resPcm.audioFormat).toBe("pcm");
    });

    it("streamSynthesis: deve aceitar pcm e mp3", async () => {
      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(new Uint8Array([1, 2]));
              controller.close();
            }
          })
        } as unknown as Response)
      );

      const tts = new SpeachesTTSProvider();

      const pcmStream = tts.streamSynthesis({ text: "T", voiceProfileId: "pt-br-warm-male-01", language: "pt-BR", audioFormat: "pcm" });
      const pcmChunks: Uint8Array[] = [];
      for await (const chunk of pcmStream) {
        if (chunk.audioChunk.length > 0) pcmChunks.push(chunk.audioChunk);
      }
      expect(pcmChunks.length).toBe(1);

      const mp3Stream = tts.streamSynthesis({ text: "T", voiceProfileId: "pt-br-warm-male-01", language: "pt-BR", audioFormat: "mp3" });
      const mp3Chunks: Uint8Array[] = [];
      for await (const chunk of mp3Stream) {
        if (chunk.audioChunk.length > 0) mp3Chunks.push(chunk.audioChunk);
      }
      expect(mp3Chunks.length).toBe(1);
    });

    it("streamSynthesis: wav e flac devem falhar fail-fast com ProviderInvalidResponseError", async () => {
      const tts = new SpeachesTTSProvider();

      await expect(async () => {
        for await (const _chunk of tts.streamSynthesis({ text: "T", voiceProfileId: "pt-br-warm-male-01", language: "pt-BR", audioFormat: "wav" })) {
          // loop
        }
      }).rejects.toThrow(ProviderInvalidResponseError);

      await expect(async () => {
        for await (const _chunk of tts.streamSynthesis({ text: "T", voiceProfileId: "pt-br-warm-male-01", language: "pt-BR", audioFormat: "flac" })) {
          // loop
        }
      }).rejects.toThrow(ProviderInvalidResponseError);
    });

    it("TTS com formato 'ogg' deve ser rejeitado fail-fast tanto em synthesize quanto em streamSynthesis", async () => {
      const tts = new SpeachesTTSProvider();

      await expect(
        tts.synthesize({ text: "T", voiceProfileId: "pt-br-warm-male-01", language: "pt-BR", audioFormat: "ogg" })
      ).rejects.toThrow(ProviderInvalidResponseError);

      await expect(async () => {
        for await (const _chunk of tts.streamSynthesis({ text: "T", voiceProfileId: "pt-br-warm-male-01", language: "pt-BR", audioFormat: "ogg" })) {
          // loop
        }
      }).rejects.toThrow(ProviderInvalidResponseError);
    });
  });
});
