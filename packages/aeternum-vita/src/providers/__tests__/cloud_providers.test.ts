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

describe("Aeternum Cloud Inference Providers — Unit Suite (Fase 2B.2.1 Schema + Live Closure)", () => {
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
    it("config: explicit empty API key must remain empty string and not fallback to env", () => {
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

    it("generate: remove parâmetros obsoletos de sampling (temperature, top_p, top_k) para Gemini 3.x", async () => {
      let capturedPayload: any = {};

      global.fetch = vi.fn().mockImplementation(async (_url, init) => {
        capturedPayload = JSON.parse(init.body);
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: "O fêmur é o osso mais longo do corpo humano." }],
                  role: "model"
                },
                finishReason: "STOP"
              }
            ]
          })
        };
      });

      const gemini = new GeminiLLMProvider({ apiKey: "test-gemini-key", modelId: "gemini-3.7-flash" });
      await gemini.generate({
        messages: [{ role: "user", content: "Fale sobre o fêmur." }],
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 50
      });

      expect(capturedPayload.generationConfig.maxOutputTokens).toBe(50);
      expect(capturedPayload.generationConfig.thinkingConfig.thinkingLevel).toBe("low");
      expect(capturedPayload.generationConfig.temperature).toBeUndefined();
      expect(capturedPayload.generationConfig.top_p).toBeUndefined();
      expect(capturedPayload.generationConfig.top_k).toBeUndefined();
    });

    it("systemInstruction: suporta request.systemInstruction e mensagens role=system determinísticas", async () => {
      let capturedPayload: any = {};

      global.fetch = vi.fn().mockImplementation(async (_url, init) => {
        capturedPayload = JSON.parse(init.body);
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: "Resposta clínica." }],
                  role: "model"
                },
                finishReason: "STOP"
              }
            ]
          })
        };
      });

      const gemini = new GeminiLLMProvider({ apiKey: "test-key", modelId: "gemini-3.7-flash" });

      await gemini.generate({
        systemInstruction: "Diretriz Global 1.",
        messages: [
          { role: "system", content: "Diretriz de Sessão 2." },
          { role: "user", content: "Consulta." }
        ]
      });

      expect(capturedPayload.systemInstruction.parts[0].text).toBe("Diretriz Global 1.\n\nDiretriz de Sessão 2.");
      expect(capturedPayload.contents.length).toBe(1);
      expect(capturedPayload.contents[0].role).toBe("user");
    });

    it("finishReason: mapeamento rigoroso (SAFETY, RECITATION, LANGUAGE, BLOCKLIST -> content_filter; MAX_TOKENS -> length; STOP -> stop; OTHER, MALFORMED -> unknown)", async () => {
      const finishMap: Record<string, string> = {
        STOP: "stop",
        MAX_TOKENS: "length",
        SAFETY: "content_filter",
        RECITATION: "content_filter",
        LANGUAGE: "content_filter",
        BLOCKLIST: "content_filter",
        PROHIBITED_CONTENT: "content_filter",
        SPII: "content_filter",
        IMAGE_SAFETY: "content_filter",
        IMAGE_PROHIBITED_CONTENT: "content_filter",
        IMAGE_RECITATION: "content_filter",
        ESCALATION: "content_filter",
        OTHER: "unknown",
        MALFORMED_FUNCTION_CALL: "unknown",
        UNEXPECTED_TOOL_CALL: "unknown",
        TOO_MANY_TOOL_CALLS: "unknown",
        MISSING_THOUGHT_SIGNATURE: "unknown",
        MALFORMED_RESPONSE: "unknown"
      };

      for (const [googleReason, canonicalReason] of Object.entries(finishMap)) {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: { parts: [{ text: "Texto teste." }], role: "model" },
                finishReason: googleReason
              }
            ]
          })
        } as unknown as Response);

        const gemini = new GeminiLLMProvider({ apiKey: "test-key" });
        const res = await gemini.generate({ messages: [{ role: "user", content: "Teste" }] });
        expect(res.finishReason).toBe(canonicalReason);
      }
    });

    describe("THOUGHT PART LEAKAGE PREVENTION (Testes A, B, C, D)", () => {
      it("Teste A: response contendo APENAS thought part deve lançar ProviderInvalidResponseError", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ thought: true, text: "Pensamento confidencial interno do modelo..." }],
                  role: "model"
                },
                finishReason: "STOP"
              }
            ]
          })
        } as unknown as Response);

        const gemini = new GeminiLLMProvider({ apiKey: "test-key" });
        await expect(gemini.generate({ messages: [{ role: "user", content: "Teste" }] })).rejects.toThrow(
          ProviderInvalidResponseError
        );
      });

      it("Teste B: response contendo MÚLTIPLAS thought parts e nenhum texto normal deve lançar ProviderInvalidResponseError", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    { thought: true, text: "Thought parte 1" },
                    { thought: true, text: "Thought parte 2" }
                  ],
                  role: "model"
                },
                finishReason: "STOP"
              }
            ]
          })
        } as unknown as Response);

        const gemini = new GeminiLLMProvider({ apiKey: "test-key" });
        await expect(gemini.generate({ messages: [{ role: "user", content: "Teste" }] })).rejects.toThrow(
          ProviderInvalidResponseError
        );
      });

      it("Teste C: thought + texto normal deve extrair SOMENTE o texto normal e nunca vazar o thought", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    { thought: true, text: "SECRET_THOUGHT_REASONING_STRING" },
                    { text: "Resposta médica oficial visível." }
                  ],
                  role: "model"
                },
                finishReason: "STOP"
              }
            ]
          })
        } as unknown as Response);

        const gemini = new GeminiLLMProvider({ apiKey: "test-key" });
        const res = await gemini.generate({ messages: [{ role: "user", content: "Teste" }] });

        expect(res.text).toBe("Resposta médica oficial visível.");
        expect(res.text).not.toContain("SECRET_THOUGHT_REASONING_STRING");
      });

      it("Teste D: stream com chunks contendo APENAS thought parts NÃO deve emitir nenhum deltaText com conteúdo thought", async () => {
        const sseLines = [
          'data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ thought: true, text: "THOUGHT_CHUNK_1" }] } }] }) + '\n\n',
          'data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ thought: true, text: "THOUGHT_CHUNK_2" }] } }] }) + '\n\n',
          'data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: "Texto Real Visível." }] }, finishReason: "STOP" }] }) + '\n\n',
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
        for await (const chunk of gemini.stream({ messages: [{ role: "user", content: "Teste stream" }] })) {
          if (chunk.deltaText) deltas.push(chunk.deltaText);
        }

        const fullOutput = deltas.join("");
        expect(fullOutput).toBe("Texto Real Visível.");
        expect(fullOutput).not.toContain("THOUGHT_CHUNK_1");
        expect(fullOutput).not.toContain("THOUGHT_CHUNK_2");
      });
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
  });

  describe("3. DeepgramSTTProvider (Cloud STT)", () => {
    it("capabilities: declara explicitamente realtime_streaming=false (verdade de streaming)", () => {
      const deepgram = new DeepgramSTTProvider({ apiKey: "dg-test" });
      expect(deepgram.capabilities.batch_transcription).toBe(true);
      expect(deepgram.capabilities.realtime_streaming).toBe(false);
      expect(deepgram.capabilities.medical_keyterms).toBe(true);
    });

    it("streamTranscription: fail-fast com ProviderInvalidResponseError quando chamado", async () => {
      const deepgram = new DeepgramSTTProvider({ apiKey: "dg-test" });
      const asyncAudio = (async function* () {
        yield new Uint8Array([1, 2]);
      })();

      const generator = deepgram.streamTranscription(asyncAudio, { language: "pt" });
      await expect(generator.next()).rejects.toThrow(ProviderInvalidResponseError);
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

    it("keyterm: Nova-3 utiliza parâmetro 'keyterm'; modelos não-Nova-3 NÃO utilizam 'keyterm'", async () => {
      let capturedUrls: string[] = [];

      global.fetch = vi.fn().mockImplementation(async (url) => {
        capturedUrls.push(String(url));
        return {
          ok: true,
          json: async () => ({
            results: {
              channels: [{ alternatives: [{ transcript: "Fratura.", confidence: 0.99 }] }]
            }
          })
        };
      });

      // 1. Nova-3 deve incluir keyterm
      const deepgramNova3 = new DeepgramSTTProvider({ apiKey: "dg-key", modelId: "nova-3" });
      await deepgramNova3.transcribe({
        audioBuffer: new Uint8Array([1, 2]),
        language: "pt",
        audioFormat: "wav",
        medicalContextHints: ["diáfise", "fêmur"]
      });

      expect(capturedUrls[0]).toContain("model=nova-3");
      expect(capturedUrls[0]).toContain("keyterm=di%C3%A1fise");
      expect(capturedUrls[0]).toContain("keyterm=f%C3%AAmur");

      // 2. Modelo não-Nova-3 NÃO deve incluir keyterm
      const deepgramOlder = new DeepgramSTTProvider({ apiKey: "dg-key", modelId: "nova-2" });
      await deepgramOlder.transcribe({
        audioBuffer: new Uint8Array([1, 2]),
        language: "pt",
        audioFormat: "wav",
        medicalContextHints: ["diáfise", "fêmur"]
      });

      expect(capturedUrls[1]).toContain("model=nova-2");
      expect(capturedUrls[1]).not.toContain("keyterm=");
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
  });

  describe("4. CartesiaTTSProvider (Cloud TTS)", () => {
    it("health: DEGRADED quando API key não configurada", async () => {
      const cartesia = new CartesiaTTSProvider({ apiKey: "" });
      const health = await cartesia.health();
      expect(health.status).toBe("DEGRADED");
    });

    it("health: HEALTHY quando endpoint /voices responde 200 usando Authorization Bearer e Cartesia-Version 2026-08-14", async () => {
      let capturedHeaders: any = {};
      global.fetch = vi.fn().mockImplementation(async (_url, init) => {
        capturedHeaders = init.headers;
        return {
          ok: true,
          json: async () => []
        };
      });

      const cartesia = new CartesiaTTSProvider({ apiKey: "cartesia-key" });
      const health = await cartesia.health();
      expect(health.status).toBe("HEALTHY");
      expect(capturedHeaders["Authorization"]).toBe("Bearer cartesia-key");
      expect(capturedHeaders["X-API-Key"]).toBeUndefined();
      expect(capturedHeaders["Cartesia-Version"]).toBe("2026-08-14");
    });

    it("synthesize: schema 2026-08-14 com voice string direta e output_format discriminado para WAV", async () => {
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
      expect(capturedHeaders["Authorization"]).toBe("Bearer cartesia-key");
      expect(capturedHeaders["X-API-Key"]).toBeUndefined();
      expect(capturedHeaders["Cartesia-Version"]).toBe("2026-08-14");

      // Verificação estrita do schema 2026-08-14 da Cartesia: voice deve ser string direta!
      expect(typeof capturedPayload.voice).toBe("string");
      expect(capturedPayload.voice).toBe("a0e99841-438c-4a64-b679-ae501e7d6091");
      expect(capturedPayload.voice.id).toBeUndefined();

      // output_format para WAV
      expect(capturedPayload.output_format.container).toBe("wav");
      expect(capturedPayload.output_format.encoding).toBe("pcm_s16le");
      expect(capturedPayload.output_format.sample_rate).toBe(24000);

      expect(res.audioBuffer.length).toBe(3);
      expect(res.audioFormat).toBe("wav");
      expect(res.sampleRate).toBe(24000);
      expect(res.providerId).toBe("cartesia-tts-cloud");
    });

    it("synthesize: output_format discriminado para PCM (raw) e MP3", async () => {
      let capturedPayloads: any[] = [];

      global.fetch = vi.fn().mockImplementation(async (_url, init) => {
        capturedPayloads.push(JSON.parse(init.body));
        return {
          ok: true,
          arrayBuffer: async () => new Uint8Array([1, 2]).buffer
        };
      });

      const cartesia = new CartesiaTTSProvider({ apiKey: "cartesia-key" });

      // 1. PCM (container: raw)
      await cartesia.synthesize({
        text: "PCM test",
        voiceProfileId: "pt-br-warm-male-01",
        audioFormat: "pcm",
        sampleRate: 24000
      });
      expect(capturedPayloads[0].output_format.container).toBe("raw");
      expect(capturedPayloads[0].output_format.encoding).toBe("pcm_s16le");
      expect(capturedPayloads[0].output_format.sample_rate).toBe(24000);

      // 2. MP3 (container: mp3)
      await cartesia.synthesize({
        text: "MP3 test",
        voiceProfileId: "pt-br-warm-male-01",
        audioFormat: "mp3",
        sampleRate: 44100
      });
      expect(capturedPayloads[1].output_format.container).toBe("mp3");
      expect(capturedPayloads[1].output_format.encoding).toBeUndefined();
      expect(capturedPayloads[1].output_format.sample_rate).toBe(44100);
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

    it("streamSynthesis: streaming progressivo de bytes de áudio com voice string schema", async () => {
      const audioChunks = [new Uint8Array([1, 2]), new Uint8Array([3, 4])];
      let idx = 0;
      let capturedPayload: any = {};
      const stream = new ReadableStream({
        pull(controller) {
          if (idx < audioChunks.length) {
            controller.enqueue(audioChunks[idx++]);
          } else {
            controller.close();
          }
        }
      });

      global.fetch = vi.fn().mockImplementation(async (_url, init) => {
        capturedPayload = JSON.parse(init.body);
        return { ok: true, body: stream };
      });

      const cartesia = new CartesiaTTSProvider({ apiKey: "cartesia-key" });
      const collected: Uint8Array[] = [];
      for await (const chunk of cartesia.streamSynthesis({
        text: "Teste stream",
        voiceProfileId: "pt-br-warm-male-01",
        language: "pt-BR"
      })) {
        if (chunk.audioChunk.length > 0) collected.push(chunk.audioChunk);
      }

      expect(typeof capturedPayload.voice).toBe("string");
      expect(capturedPayload.voice).toBe("a0e99841-438c-4a64-b679-ae501e7d6091");
      expect(collected.length).toBe(2);
    });
  });
});
