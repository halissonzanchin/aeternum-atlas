import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  GeminiLLMProvider,
  DeepgramSTTProvider,
  CartesiaTTSProvider,
  VoiceProfileRegistry,
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderUnavailableError,
  ProviderInvalidResponseError,
  ProviderCancelledError,
  ProviderTimeoutError
} from "../index.ts";

describe("Aeternum Cloud Inference Providers — Unit Suite (Fase 2B.2.1)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("1. VoiceProfileRegistry Multi-Target Mappings", () => {
    it("deve resolver target nativo para Speaches e Cartesia a partir do mesmo perfil canônico", () => {
      const registry = new VoiceProfileRegistry(true);

      const speachesTarget = registry.resolveTarget("pt-br-warm-male-01", "speaches");
      expect(speachesTarget.providerId).toBe("speaches");
      expect(speachesTarget.modelId).toBe("speaches-ai/Kokoro-82M-v1.0-ONNX");
      expect(speachesTarget.nativeVoiceId).toBe("pm_alex");

      const cartesiaTarget = registry.resolveTarget("pt-br-warm-male-01", "cartesia");
      expect(cartesiaTarget.providerId).toBe("cartesia");
      expect(cartesiaTarget.modelId).toBe("sonic-3");
      expect(cartesiaTarget.nativeVoiceId).toBe("a0e99841-438c-4a64-b679-ae501e7d6091");
    });

    it("deve falhar se o perfil não possuir target para o provedor solicitado", () => {
      const registry = new VoiceProfileRegistry(true);
      expect(() => registry.resolveTarget("pt-br-warm-male-01", "unsupported-provider")).toThrow(
        ProviderInvalidResponseError
      );
    });
  });

  describe("2. GeminiLLMProvider (Google Cloud)", () => {
    it("config: explicit empty API key must remain empty string and not fallback", () => {
      const gemini = new GeminiLLMProvider({ apiKey: "" });
      expect((gemini as any).apiKey).toBe("");
    });

    it("health: DEGRADED quando API key não configurada", async () => {
      const gemini = new GeminiLLMProvider({ apiKey: "" });
      const health = await gemini.health();
      expect(health.status).toBe("DEGRADED");
      expect(health.details?.error).toContain("GEMINI_API_KEY not configured");
    });

    it("health: HEALTHY quando modelo disponível (sem consumo de tokens)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: "models/gemini-3.7-flash" })
      } as unknown as Response);

      const gemini = new GeminiLLMProvider({ apiKey: "test-key", modelId: "gemini-3.7-flash" });
      const health = await gemini.health();
      expect(health.status).toBe("HEALTHY");
    });

    it("health: DEGRADED quando chave for inválida ou não autorizada (401/403)", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 } as unknown as Response);
      const gemini = new GeminiLLMProvider({ apiKey: "bad-key" });
      const health = await gemini.health();
      expect(health.status).toBe("DEGRADED");
      expect(health.details?.error).toContain("Invalid or unauthorized API key");
    });

    it("generate: sucesso com Gemini 3.7 Flash injetando thinkingLevel=low e ignorando partes de thought", async () => {
      let capturedUrl = "";
      let capturedHeaders: any = {};
      let capturedPayload: any = {};

      global.fetch = vi.fn().mockImplementation(async (url, init) => {
        capturedUrl = String(url);
        capturedHeaders = init.headers;
        capturedPayload = JSON.parse(init.body);
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    { thought: true, text: "Pensando na estrutura anatômica..." },
                    { text: "O fêmur é o osso mais longo do corpo humano." }
                  ],
                  role: "model"
                },
                finishReason: "STOP"
              }
            ],
            usageMetadata: {
              promptTokenCount: 8,
              candidatesTokenCount: 12,
              totalTokenCount: 20
            }
          })
        };
      });

      const gemini = new GeminiLLMProvider({ apiKey: "test-gemini-key", modelId: "gemini-3.7-flash" });
      const res = await gemini.generate({
        messages: [
          { role: "system", content: "Você é o Atlas AI Tutor." },
          { role: "user", content: "Fale sobre o fêmur." }
        ]
      });

      expect(capturedUrl).toContain("/v1beta/models/gemini-3.7-flash:generateContent");
      expect(capturedHeaders["x-goog-api-key"]).toBe("test-gemini-key");
      expect(capturedPayload.generationConfig.thinkingConfig.thinkingLevel).toBe("low");
      expect(capturedPayload.systemInstruction.parts[0].text).toBe("Você é o Atlas AI Tutor.");
      expect(capturedPayload.contents[0].parts[0].text).toBe("Fale sobre o fêmur.");

      expect(res.text).toBe("O fêmur é o osso mais longo do corpo humano.");
      expect(res.providerId).toBe("gemini-llm-cloud");
      expect(res.modelId).toBe("gemini-3.7-flash");
      expect(res.finishReason).toBe("STOP");
      expect(res.usage?.totalTokens).toBe(20);
    });

    it("generate: lança ProviderAuthenticationError se chave não configurada", async () => {
      const gemini = new GeminiLLMProvider({ apiKey: "" });
      await expect(gemini.generate({ messages: [{ role: "user", content: "Olá" }] })).rejects.toThrow(
        ProviderAuthenticationError
      );
    });

    it("generate: HTTP 400 mapeia para ProviderInvalidResponseError", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400 } as unknown as Response);
      const gemini = new GeminiLLMProvider({ apiKey: "test-key" });
      await expect(gemini.generate({ messages: [{ role: "user", content: "Olá" }] })).rejects.toThrow(
        ProviderInvalidResponseError
      );
    });

    it("generate: HTTP 401/403 mapeia para ProviderAuthenticationError", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 } as unknown as Response);
      const gemini = new GeminiLLMProvider({ apiKey: "invalid-key" });
      await expect(gemini.generate({ messages: [{ role: "user", content: "Olá" }] })).rejects.toThrow(
        ProviderAuthenticationError
      );

      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 } as unknown as Response);
      await expect(gemini.generate({ messages: [{ role: "user", content: "Olá" }] })).rejects.toThrow(
        ProviderAuthenticationError
      );
    });

    it("generate: HTTP 404 mapeia para ProviderUnavailableError (modelo não encontrado)", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 } as unknown as Response);
      const gemini = new GeminiLLMProvider({ apiKey: "test-key" });
      await expect(gemini.generate({ messages: [{ role: "user", content: "Olá" }] })).rejects.toThrow(
        ProviderUnavailableError
      );
    });

    it("generate: HTTP 429 mapeia para ProviderRateLimitError com retryAfter", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ "retry-after": "45" })
      } as unknown as Response);

      const gemini = new GeminiLLMProvider({ apiKey: "test-key" });
      await expect(gemini.generate({ messages: [{ role: "user", content: "Olá" }] })).rejects.toThrow(
        ProviderRateLimitError
      );
    });

    it("generate: HTTP 500, 502, 503, 504 mapeiam para ProviderUnavailableError", async () => {
      const gemini = new GeminiLLMProvider({ apiKey: "test-key" });
      for (const status of [500, 502, 503, 504]) {
        global.fetch = vi.fn().mockResolvedValue({ ok: false, status } as unknown as Response);
        await expect(gemini.generate({ messages: [{ role: "user", content: "Olá" }] })).rejects.toThrow(
          ProviderUnavailableError
        );
      }
    });

    it("generate: falha de rede/DNS/TLS mapeia para ProviderUnavailableError", async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError("fetch failed: ENOTFOUND generativelanguage.googleapis.com"));
      const gemini = new GeminiLLMProvider({ apiKey: "test-key" });
      await expect(gemini.generate({ messages: [{ role: "user", content: "Olá" }] })).rejects.toThrow(
        ProviderUnavailableError
      );
    });

    it("generate: timeout mapeia para ProviderTimeoutError", async () => {
      global.fetch = vi.fn().mockImplementation((_url, init) => {
        return new Promise((_, reject) => {
          init.signal?.addEventListener("abort", () => {
            const err = new Error("Abort");
            err.name = "AbortError";
            reject(err);
          });
        });
      });

      const gemini = new GeminiLLMProvider({ apiKey: "test-key" });
      await expect(
        gemini.generate({ messages: [{ role: "user", content: "Olá" }] }, { timeoutMs: 10, requestId: "timeout-test" })
      ).rejects.toThrow(ProviderTimeoutError);
    });

    it("generate: cancelamento do usuário lança ProviderCancelledError (nunca fallback)", async () => {
      const controller = new AbortController();
      global.fetch = vi.fn().mockImplementation((_url, init) => {
        return new Promise((_, reject) => {
          init.signal?.addEventListener("abort", () => {
            const err = new Error("Abort");
            err.name = "AbortError";
            reject(err);
          });
        });
      });

      const gemini = new GeminiLLMProvider({ apiKey: "test-key" });
      const promise = gemini.generate(
        { messages: [{ role: "user", content: "Olá" }] },
        { signal: controller.signal, requestId: "user-cancel" }
      );

      setTimeout(() => controller.abort(), 5);
      await expect(promise).rejects.toThrow(ProviderCancelledError);
    });

    it("generate: resposta sem candidates ou com texto vazio lança ProviderInvalidResponseError", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [] })
      } as unknown as Response);

      const gemini = new GeminiLLMProvider({ apiKey: "test-key" });
      await expect(gemini.generate({ messages: [{ role: "user", content: "Olá" }] })).rejects.toThrow(
        ProviderInvalidResponseError
      );

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: "" }] } }] })
      } as unknown as Response);

      await expect(gemini.generate({ messages: [{ role: "user", content: "Olá" }] })).rejects.toThrow(
        ProviderInvalidResponseError
      );
    });

    it("stream: consome eventos SSE progressivos do Gemini filtrando thoughts", async () => {
      const sseLines = [
        'data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ thought: true, text: "Pensando..." }, { text: "Articulação " }] } }] }) + '\n\n',
        'data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: "sinovial." }] }, finishReason: "STOP" }] }) + '\n\n',
        'data: [DONE]\n\n'
      ];

      let idx = 0;
      const stream = new ReadableStream({
        pull(controller) {
          if (idx < sseLines.length) {
            controller.enqueue(new TextEncoder().encode(sseLines[idx++]));
          } else {
            controller.close();
          }
        }
      });

      global.fetch = vi.fn().mockResolvedValue({ ok: true, body: stream } as unknown as Response);

      const gemini = new GeminiLLMProvider({ apiKey: "test-key" });
      const deltas: string[] = [];
      for await (const chunk of gemini.stream({ messages: [{ role: "user", content: "Joelho" }] })) {
        deltas.push(chunk.deltaText);
      }

      expect(deltas.join("")).toBe("Articulação sinovial.");
    });

    it("stream: cancelamento pelo usuário lança ProviderCancelledError", async () => {
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

      global.fetch = vi.fn().mockResolvedValue({ ok: true, body: blockedStream } as unknown as Response);

      const gemini = new GeminiLLMProvider({ apiKey: "test-key" });
      const promise = (async () => {
        for await (const _chunk of gemini.stream(
          { messages: [{ role: "user", content: "Tíbia" }] },
          { requestId: "gemini-cancel", signal: controller.signal }
        )) {
          // loop
        }
      })();

      setTimeout(() => controller.abort(), 10);
      await expect(promise).rejects.toThrow(ProviderCancelledError);
    });
  });

  describe("3. DeepgramSTTProvider (Cloud STT)", () => {
    it("capabilities: declara explicitamente realtime_streaming=false (verdade de streaming)", () => {
      const deepgram = new DeepgramSTTProvider({ apiKey: "dg-test" });
      expect(deepgram.capabilities.batch_transcription).toBe(true);
      expect(deepgram.capabilities.realtime_streaming).toBe(false);
      expect(deepgram.capabilities.medical_keyterms).toBe(true);
    });

    it("health: DEGRADED quando API key não configurada", async () => {
      const deepgram = new DeepgramSTTProvider({ apiKey: "" });
      const health = await deepgram.health();
      expect(health.status).toBe("DEGRADED");
    });

    it("health: HEALTHY quando endpoint de projetos responde 200", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ projects: [] })
      } as unknown as Response);

      const deepgram = new DeepgramSTTProvider({ apiKey: "dg-test-key" });
      const health = await deepgram.health();
      expect(health.status).toBe("HEALTHY");
    });

    it("transcribe: mapeamento completo com keyterm para Nova-3 e timestamps de palavras", async () => {
      let capturedUrl = "";
      let capturedHeaders: any = {};

      global.fetch = vi.fn().mockImplementation(async (url, init) => {
        capturedUrl = String(url);
        capturedHeaders = init.headers;
        return {
          ok: true,
          json: async () => ({
            results: {
              channels: [
                {
                  alternatives: [
                    {
                      transcript: "Fratura na diáfise do fêmur.",
                      confidence: 0.96,
                      words: [
                        { word: "Fratura", start: 0.1, end: 0.5, confidence: 0.99 },
                        { word: "na", start: 0.5, end: 0.6, confidence: 0.95 },
                        { word: "diáfise", start: 0.6, end: 1.1, confidence: 0.97 },
                        { word: "do", start: 1.1, end: 1.2, confidence: 0.98 },
                        { word: "fêmur", start: 1.2, end: 1.8, confidence: 0.99 }
                      ]
                    }
                  ],
                  detected_language: "pt"
                }
              ]
            }
          })
        };
      });

      const deepgram = new DeepgramSTTProvider({ apiKey: "dg-test-key", modelId: "nova-3" });
      const res = await deepgram.transcribe({
        audioBuffer: new Uint8Array([1, 2, 3]),
        language: "pt-BR",
        audioFormat: "wav",
        medicalContextHints: ["diáfise", "fêmur"]
      });

      expect(capturedUrl).toContain("model=nova-3");
      expect(capturedUrl).toContain("language=pt");
      expect(capturedUrl).toContain("keyterm=di%C3%A1fise");
      expect(capturedUrl).toContain("keyterm=f%C3%AAmur");
      expect(capturedHeaders["Authorization"]).toBe("Token dg-test-key");

      expect(res.text).toBe("Fratura na diáfise do fêmur.");
      expect(res.confidence).toBe(0.96);
      expect(res.timestamps?.length).toBe(5);
      expect(res.timestamps?.[2].word).toBe("diáfise");
      expect(res.timestamps?.[2].startMs).toBe(600);
      expect(res.timestamps?.[2].endMs).toBe(1100);
    });

    it("transcribe: formato PCM exige sampleRate válido (8000–48000Hz)", async () => {
      const deepgram = new DeepgramSTTProvider({ apiKey: "dg-test-key" });

      await expect(
        deepgram.transcribe({
          audioBuffer: new Uint8Array([1, 2, 3]),
          language: "pt",
          audioFormat: "pcm",
          sampleRate: 0
        })
      ).rejects.toThrow(ProviderInvalidResponseError);

      await expect(
        deepgram.transcribe({
          audioBuffer: new Uint8Array([1, 2, 3]),
          language: "pt",
          audioFormat: "pcm",
          sampleRate: 48001
        })
      ).rejects.toThrow(ProviderInvalidResponseError);
    });

    it("transcribe: erros HTTP 401, 429, 500 mapeiam corretamente", async () => {
      const deepgram = new DeepgramSTTProvider({ apiKey: "dg-test-key" });

      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 } as unknown as Response);
      await expect(
        deepgram.transcribe({ audioBuffer: new Uint8Array([1]), language: "pt", audioFormat: "wav" })
      ).rejects.toThrow(ProviderAuthenticationError);

      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 429 } as unknown as Response);
      await expect(
        deepgram.transcribe({ audioBuffer: new Uint8Array([1]), language: "pt", audioFormat: "wav" })
      ).rejects.toThrow(ProviderRateLimitError);

      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as unknown as Response);
      await expect(
        deepgram.transcribe({ audioBuffer: new Uint8Array([1]), language: "pt", audioFormat: "wav" })
      ).rejects.toThrow(ProviderUnavailableError);
    });

    it("streamTranscription: agrega chunks de áudio e emite transcrição final em batch", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: {
            channels: [{ alternatives: [{ transcript: "Escápula esquerda.", confidence: 0.99 }] }]
          }
        })
      } as unknown as Response);

      const deepgram = new DeepgramSTTProvider({ apiKey: "dg-test-key" });
      const asyncAudio = (async function* () {
        yield new Uint8Array([1, 2]);
        yield new Uint8Array([3, 4]);
      })();

      const chunks: Array<{ partialText: string; isFinal: boolean }> = [];
      for await (const chunk of deepgram.streamTranscription(asyncAudio, { language: "pt" })) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(1);
      expect(chunks[0].partialText).toBe("Escápula esquerda.");
      expect(chunks[0].isFinal).toBe(true);
    });
  });

  describe("4. CartesiaTTSProvider (Cloud TTS)", () => {
    it("health: DEGRADED quando API key não configurada", async () => {
      const cartesia = new CartesiaTTSProvider({ apiKey: "" });
      const health = await cartesia.health();
      expect(health.status).toBe("DEGRADED");
    });

    it("health: HEALTHY quando endpoint /voices responde 200 (sem gerar áudio)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => []
      } as unknown as Response);

      const cartesia = new CartesiaTTSProvider({ apiKey: "cartesia-key" });
      const health = await cartesia.health();
      expect(health.status).toBe("HEALTHY");
    });

    it("synthesize: resolve target nativo por VoiceProfileId e envia payload para Cartesia", async () => {
      let capturedUrl = "";
      let capturedHeaders: any = {};
      let capturedPayload: any = {};

      global.fetch = vi.fn().mockImplementation(async (url, init) => {
        capturedUrl = String(url);
        capturedHeaders = init.headers;
        capturedPayload = JSON.parse(init.body);
        return {
          ok: true,
          arrayBuffer: async () => new Uint8Array([10, 20, 30]).buffer
        };
      });

      const registry = new VoiceProfileRegistry(true);
      const cartesia = new CartesiaTTSProvider({
        apiKey: "cartesia-key",
        registry
      });

      const res = await cartesia.synthesize({
        text: "Articulação glenoumeral.",
        voiceProfileId: "pt-br-warm-male-01",
        language: "pt-BR",
        audioFormat: "wav",
        sampleRate: 24000
      });

      expect(capturedUrl).toContain("/tts/bytes");
      expect(capturedHeaders["X-API-Key"]).toBe("cartesia-key");
      expect(capturedHeaders["Authorization"]).toBe("Bearer cartesia-key");
      expect(capturedHeaders["Cartesia-Version"]).toBe("2024-06-10");
      expect(capturedPayload.voice.id).toBe("a0e99841-438c-4a64-b679-ae501e7d6091");
      expect(capturedPayload.output_format.container).toBe("wav");
      expect(capturedPayload.output_format.sample_rate).toBe(24000);

      expect(res.audioBuffer.length).toBe(3);
      expect(res.audioFormat).toBe("wav");
      expect(res.sampleRate).toBe(24000);
      expect(res.providerId).toBe("cartesia-tts-cloud");
    });

    it("synthesize: rejeita formatos de áudio não suportados (ex: ogg)", async () => {
      const cartesia = new CartesiaTTSProvider({ apiKey: "cartesia-key" });
      await expect(
        cartesia.synthesize({
          text: "Teste",
          voiceProfileId: "pt-br-warm-male-01",
          language: "pt-BR",
          audioFormat: "ogg" as any
        })
      ).rejects.toThrow(ProviderInvalidResponseError);
    });

    it("synthesize: HTTP 401, 429, 500 mapeiam para erros canônicos", async () => {
      const cartesia = new CartesiaTTSProvider({ apiKey: "cartesia-key" });

      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 } as unknown as Response);
      await expect(
        cartesia.synthesize({ text: "Teste", voiceProfileId: "pt-br-warm-male-01", language: "pt-BR" })
      ).rejects.toThrow(ProviderAuthenticationError);

      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 429 } as unknown as Response);
      await expect(
        cartesia.synthesize({ text: "Teste", voiceProfileId: "pt-br-warm-male-01", language: "pt-BR" })
      ).rejects.toThrow(ProviderRateLimitError);

      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as unknown as Response);
      await expect(
        cartesia.synthesize({ text: "Teste", voiceProfileId: "pt-br-warm-male-01", language: "pt-BR" })
      ).rejects.toThrow(ProviderUnavailableError);
    });

    it("streamSynthesis: streaming progressivo de bytes de áudio", async () => {
      const audioChunks = [new Uint8Array([1, 2]), new Uint8Array([3, 4])];
      let idx = 0;
      const stream = new ReadableStream({
        pull(controller) {
          if (idx < audioChunks.length) {
            controller.enqueue(audioChunks[idx++]);
          } else {
            controller.close();
          }
        }
      });

      global.fetch = vi.fn().mockResolvedValue({ ok: true, body: stream } as unknown as Response);

      const cartesia = new CartesiaTTSProvider({ apiKey: "cartesia-key" });
      const collected: Uint8Array[] = [];
      for await (const chunk of cartesia.streamSynthesis({
        text: "Teste stream",
        voiceProfileId: "pt-br-warm-male-01",
        language: "pt-BR"
      })) {
        if (chunk.audioChunk.length > 0) collected.push(chunk.audioChunk);
      }

      expect(collected.length).toBe(2);
    });
  });
});
