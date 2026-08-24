import { describe, it, expect } from "vitest";
import {
  FakeLLMProvider,
  FakeSTTProvider,
  FakeTTSProvider,
  FakeRAGProvider,
  FakeMemoryProvider,
  ProviderUnavailableError,
  ProviderTimeoutError,
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderInvalidResponseError
} from "../index.ts";

describe("Aeternum AI Provider Contracts (Fase 2A)", () => {
  describe("1. LLMProvider Contract", () => {
    it("deve gerar resposta com tipagem e metadados canônicos", async () => {
      const llm = new FakeLLMProvider();
      const response = await llm.generate({
        messages: [{ role: "user", content: "Explique a clavícula." }],
        temperature: 0.7
      });

      expect(response.text).toContain("Echo: Explique a clavícula.");
      expect(response.providerId).toBe("fake-llm");
      expect(response.finishReason).toBe("stop");
      expect(response.usage?.totalTokens).toBe(40);
      expect(response.latency?.totalDurationMs).toBeGreaterThan(0);
    });

    it("deve suportar streaming assíncrono de chunks", async () => {
      const llm = new FakeLLMProvider();
      const stream = llm.stream({
        messages: [{ role: "user", content: "Teste de stream" }]
      });

      const chunks: string[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk.deltaText);
      }

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.join("")).toContain("Resposta simulada");
    });

    it("deve reportar status de saúde canônico", async () => {
      const llm = new FakeLLMProvider();
      const health = await llm.health();
      expect(health.status).toBe("HEALTHY");
      expect(health.providerId).toBe("fake-llm");

      llm.shouldFail = true;
      const failedHealth = await llm.health();
      expect(failedHealth.status).toBe("UNAVAILABLE");
    });
  });

  describe("2. STTProvider Contract", () => {
    it("deve transcrever áudio com metadados e confiança", async () => {
      const stt = new FakeSTTProvider();
      const response = await stt.transcribe({
        audioBuffer: new Uint8Array([1, 2, 3]),
        language: "pt-BR",
        sampleRate: 16000
      });

      expect(response.text).toBe("Transcrição simulada de anatomia humana.");
      expect(response.languageDetected).toBe("pt-BR");
      expect(response.confidence).toBe(0.98);
      expect(response.providerId).toBe("fake-stt");
    });

    it("deve suportar streaming de transcrição parcial e final", async () => {
      const stt = new FakeSTTProvider();
      async function* mockAudioStream() {
        yield new Uint8Array([1, 2]);
        yield new Uint8Array([3, 4]);
      }

      const stream = stt.streamTranscription(mockAudioStream(), { language: "pt" });
      const results = [];
      for await (const chunk of stream) {
        results.push(chunk);
      }

      expect(results.length).toBeGreaterThan(0);
      expect(results.at(-1)?.isFinal).toBe(true);
    });
  });

  describe("3. TTSProvider Contract", () => {
    it("deve sintetizar voz com formato de áudio especificado", async () => {
      const tts = new FakeTTSProvider();
      const response = await tts.synthesize({
        text: "Olá Estudante",
        voiceId: "eduardo",
        language: "pt-BR"
      });

      expect(response.audioBuffer.length).toBeGreaterThan(0);
      expect(response.sampleRate).toBe(24000);
      expect(response.audioFormat).toBe("pcm");
      expect(response.providerId).toBe("fake-tts");
    });

    it("deve suportar streaming de áudio sintetizado", async () => {
      const tts = new FakeTTSProvider();
      const stream = tts.streamSynthesis({
        text: "Sintetizando áudio em streaming",
        voiceId: "eduardo",
        language: "pt-BR"
      });

      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(2);
      expect(chunks[1].isFinal).toBe(true);
    });
  });

  describe("4. RAGProvider Contract", () => {
    it("deve retornar chunks estruturados com método de recuperação e citação obrigatória", async () => {
      const rag = new FakeRAGProvider();
      const response = await rag.retrieve({
        query: "clavícula sintopia",
        limit: 5
      });

      expect(response.chunks.length).toBe(1);
      const chunk = response.chunks[0];
      expect(chunk.sourceId).toBe("chunk-101");
      expect(chunk.sourceTitle).toContain("Moore");
      expect(chunk.pageNumber).toBe(672);
      expect(chunk.score).toBe(0.95);
      expect(chunk.retrievalMethod).toBe("hybrid");
      expect(response.providerId).toBe("fake-rag");
    });
  });

  describe("5. MemoryProvider Contract", () => {
    it("deve carregar contexto do estudante sem contaminar com conhecimento enciclopédico", async () => {
      const memory = new FakeMemoryProvider();
      await memory.saveInteraction({
        studentId: "student-123",
        topic: "osteologia",
        userPromptSummary: "Dúvida sobre trocânter maior",
        aiResponseSummary: "Explicado inserção do glúteo médio",
        mode: "lecture",
        timestamp: new Date().toISOString()
      });

      const context = await memory.getStudentContext("student-123");
      expect(context.studentId).toBe("student-123");
      expect(context.profile.weakTopics).toContain("plexo braquial");
      expect(context.recentInteractions.length).toBe(1);
      expect(context.recentInteractions[0].topic).toBe("osteologia");
    });
  });

  describe("6. Canonical Error Hierarchy", () => {
    it("deve instanciar erros canônicos Aeternum com código e providerId", () => {
      const unavailable = new ProviderUnavailableError("Servidor fora do ar", "ollama-local");
      expect(unavailable.code).toBe("PROVIDER_UNAVAILABLE");
      expect(unavailable.providerId).toBe("ollama-local");
      expect(unavailable.timestamp).toBeDefined();

      const timeout = new ProviderTimeoutError("Tempo limite excedido", "whisper-local");
      expect(timeout.code).toBe("PROVIDER_TIMEOUT");

      const authErr = new ProviderAuthenticationError("Token inválido", "cloud-provider");
      expect(authErr.code).toBe("PROVIDER_AUTH_ERROR");

      const rateLimit = new ProviderRateLimitError("Limite excedido", "gemini-cloud", 60);
      expect(rateLimit.code).toBe("PROVIDER_RATE_LIMIT");
      expect(rateLimit.retryAfterSeconds).toBe(60);

      const invalidResp = new ProviderInvalidResponseError("Resposta corrompida", "custom-model");
      expect(invalidResp.code).toBe("PROVIDER_INVALID_RESPONSE");
    });
  });
});
