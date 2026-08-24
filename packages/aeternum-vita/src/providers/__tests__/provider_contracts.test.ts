import { describe, it, expect } from "vitest";
import {
  FakeLLMProvider,
  FakeSTTProvider,
  FakeTTSProvider,
  FakeRAGProvider,
  FakeMemoryProvider,
  FakeProviderHealthMonitor,
  ProviderUnavailableError,
  ProviderTimeoutError,
  ProviderCancelledError,
  ProviderRateLimitError,
  ProviderInvalidResponseError,
  ProviderExecutionContext
} from "../index.ts";

describe("Aeternum AI Provider Contracts Hardening (Fase 2A.1)", () => {
  describe("1. LLMProvider Contract & Canonical Execution", () => {
    it("deve gerar resposta com tipagem canônica e finishReason válido (sem error/timeout)", async () => {
      const llm = new FakeLLMProvider();
      const response = await llm.generate({
        messages: [{ role: "user", content: "Explique a clavícula." }],
        temperature: 0.7
      });

      expect(response.text).toContain("Echo: Explique a clavícula.");
      expect(response.providerId).toBe("fake-llm");
      expect(response.modelId).toBe("fake-llm-model");
      expect(["stop", "length", "content_filter", "unknown"]).toContain(response.finishReason);
      expect(response.usage?.totalTokens).toBe(40);
    });

    it("deve propagar ProviderUnavailableError em caso de indisponibilidade", async () => {
      const llm = new FakeLLMProvider();
      llm.failureMode = "unavailable";

      await expect(llm.generate({ messages: [{ role: "user", content: "Olá" }] }))
        .rejects
        .toThrow(ProviderUnavailableError);
    });

    it("deve propagar ProviderTimeoutError em caso de estouro de tempo", async () => {
      const llm = new FakeLLMProvider();
      llm.failureMode = "timeout";

      await expect(llm.generate({ messages: [{ role: "user", content: "Olá" }] }))
        .rejects
        .toThrow(ProviderTimeoutError);
    });

    it("deve propagar ProviderRateLimitError com retryAfterSeconds", async () => {
      const llm = new FakeLLMProvider();
      llm.failureMode = "rate_limit";

      try {
        await llm.generate({ messages: [{ role: "user", content: "Olá" }] });
        expect.unreachable("Deveria ter lançado ProviderRateLimitError");
      } catch (err) {
        expect(err).toBeInstanceOf(ProviderRateLimitError);
        expect((err as ProviderRateLimitError).retryAfterSeconds).toBe(30);
      }
    });

    it("deve honrar cancelamento via AbortSignal no ProviderExecutionContext", async () => {
      const llm = new FakeLLMProvider();
      const controller = new AbortController();
      controller.abort();

      const context: ProviderExecutionContext = {
        requestId: "req-123",
        signal: controller.signal
      };

      await expect(llm.generate({ messages: [{ role: "user", content: "Olá" }] }, context))
        .rejects
        .toThrow(ProviderCancelledError);
    });

    it("deve interromper stream em caso de barge-in / cancelamento", async () => {
      const llm = new FakeLLMProvider();
      const controller = new AbortController();
      const context: ProviderExecutionContext = {
        requestId: "req-stream-1",
        signal: controller.signal
      };

      const stream = llm.stream({ messages: [{ role: "user", content: "Teste" }] }, context);
      const chunks: string[] = [];

      try {
        for await (const chunk of stream) {
          chunks.push(chunk.deltaText);
          controller.abort(); // Dispara interrupção no primeiro chunk
        }
      } catch (err) {
        expect(err).toBeInstanceOf(ProviderCancelledError);
      }

      expect(chunks.length).toBe(1);
    });
  });

  describe("2. STTProvider Contract", () => {
    it("deve transcrever áudio com metadados canônicos", async () => {
      const stt = new FakeSTTProvider();
      const response = await stt.transcribe({
        audioBuffer: new Uint8Array([1, 2, 3]),
        language: "pt-BR"
      });

      expect(response.text).toBe("Transcrição simulada de anatomia humana.");
      expect(response.languageDetected).toBe("pt-BR");
      expect(response.confidence).toBe(0.98);
      expect(response.modelId).toBe("fake-stt-model");
    });

    it("deve abortar transcrição em caso de cancelamento", async () => {
      const stt = new FakeSTTProvider();
      const controller = new AbortController();
      controller.abort();

      await expect(stt.transcribe({ audioBuffer: new Uint8Array([]), language: "pt-BR" }, { requestId: "r1", signal: controller.signal }))
        .rejects
        .toThrow(ProviderCancelledError);
    });
  });

  describe("3. TTSProvider Contract & VoiceProfileId", () => {
    it("deve sintetizar voz usando voiceProfileId (desacoplado de personas)", async () => {
      const tts = new FakeTTSProvider();
      const response = await tts.synthesize({
        text: "Explicação anatômica",
        voiceProfileId: "test-voice-ptbr-01",
        language: "pt-BR"
      });

      expect(response.audioBuffer.length).toBeGreaterThan(0);
      expect(response.modelId).toBe("fake-tts-model");
      expect(response.audioFormat).toBe("pcm");
    });

    it("deve abortar síntese em streaming em caso de barge-in", async () => {
      const tts = new FakeTTSProvider();
      const controller = new AbortController();
      const stream = tts.streamSynthesis(
        { text: "Áudio", voiceProfileId: "test-voice-ptbr-01", language: "pt-BR" },
        { requestId: "tts-1", signal: controller.signal }
      );

      const chunks = [];
      try {
        for await (const chunk of stream) {
          chunks.push(chunk);
          controller.abort(); // Simula estudante falando por cima (barge-in)
        }
      } catch (err) {
        expect(err).toBeInstanceOf(ProviderCancelledError);
      }

      expect(chunks.length).toBe(1);
    });
  });

  describe("4. RAGProvider Contract & Score Normalizado", () => {
    it("deve retornar score normalizado entre 0.0 e 1.0 e retrievalMethod sem memory", async () => {
      const rag = new FakeRAGProvider();
      const response = await rag.retrieve({ query: "clavícula", limit: 3 });

      expect(response.chunks.length).toBe(1);
      const chunk = response.chunks[0];
      expect(chunk.score).toBeGreaterThanOrEqual(0.0);
      expect(chunk.score).toBeLessThanOrEqual(1.0);
      expect(chunk.rawScore).toBeDefined();
      expect(["lexical", "vector", "hybrid", "other"]).toContain(chunk.retrievalMethod);
      expect(chunk.retrievalMethod).not.toBe("memory");
    });
  });

  describe("5. MemoryProvider Contract", () => {
    it("deve isolar memória do aluno e respeitar cancelamento", async () => {
      const memory = new FakeMemoryProvider();
      await memory.saveInteraction({
        studentId: "stu-1",
        topic: "osteologia",
        userPromptSummary: "Dúvida fêmur",
        aiResponseSummary: "Explicado colo anatômico",
        mode: "lecture",
        timestamp: new Date().toISOString()
      });

      const ctx = await memory.getStudentContext("stu-1");
      expect(ctx.studentId).toBe("stu-1");
      expect(ctx.recentInteractions.length).toBe(1);

      const controller = new AbortController();
      controller.abort();
      await expect(memory.getStudentContext("stu-1", { requestId: "m1", signal: controller.signal }))
        .rejects
        .toThrow(ProviderCancelledError);
    });
  });

  describe("6. ProviderHealthMonitor Contract", () => {
    it("deve monitorar saúde de múltiplos provedores", async () => {
      const monitor = new FakeProviderHealthMonitor();
      const llm = new FakeLLMProvider();
      const stt = new FakeSTTProvider();

      const results = await monitor.checkAll([llm, stt]);
      expect(results.length).toBe(2);
      expect(results[0].status).toBe("HEALTHY");
      expect(results[1].status).toBe("HEALTHY");

      llm.failureMode = "unavailable";
      const failedResult = await monitor.checkHealth(llm);
      expect(failedResult.status).toBe("UNAVAILABLE");
    });
  });
});
