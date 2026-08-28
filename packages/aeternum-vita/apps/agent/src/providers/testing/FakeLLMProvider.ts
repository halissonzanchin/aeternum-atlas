import { LLMProvider } from "../contracts/LLMProvider.ts";
import {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  ProviderMetadata,
  HealthResult,
  ProviderExecutionContext,
  ProviderCancelledError,
  ProviderUnavailableError,
  ProviderTimeoutError,
  ProviderRateLimitError,
  ProviderInvalidResponseError
} from "../types/index.ts";

export class FakeLLMProvider implements LLMProvider {
  public readonly metadata: ProviderMetadata = {
    id: "fake-llm",
    name: "Fake LLM Provider",
    type: "LLM",
    location: "LOCAL",
    version: "1.0.0"
  };

  public failureMode?: "unavailable" | "timeout" | "rate_limit" | "invalid_response" | "custom";
  public customError?: Error;
  public mockText = "Resposta simulada do modelo de teste.";
  public callCount = 0;

  constructor(metadata?: Partial<ProviderMetadata>) {
    if (metadata) {
      this.metadata = { ...this.metadata, ...metadata };
    }
  }

  async health(_context?: ProviderExecutionContext): Promise<HealthResult> {
    if (this.failureMode === "unavailable") {
      return {
        providerId: this.metadata.id,
        status: "UNAVAILABLE",
        latencyMs: 50,
        timestamp: new Date().toISOString(),
        details: { error: "Simulated health failure" }
      };
    }
    return {
      providerId: this.metadata.id,
      status: "HEALTHY",
      latencyMs: 10,
      timestamp: new Date().toISOString()
    };
  }

  async generate(request: LLMRequest, context?: ProviderExecutionContext): Promise<LLMResponse> {
    this.callCount++;
    if (context?.signal?.aborted) {
      throw new ProviderCancelledError("Geração cancelada por AbortSignal.", this.metadata.id);
    }
    if (this.customError) {
      throw this.customError;
    }
    if (this.failureMode === "unavailable") {
      throw new ProviderUnavailableError("Servidor de LLM indisponível.", this.metadata.id);
    }
    if (this.failureMode === "timeout") {
      throw new ProviderTimeoutError("Tempo limite de geração excedido.", this.metadata.id);
    }
    if (this.failureMode === "rate_limit") {
      throw new ProviderRateLimitError("Limite de requisições atingido.", this.metadata.id, 30);
    }
    if (this.failureMode === "invalid_response") {
      throw new ProviderInvalidResponseError("Resposta malformada do provider.", this.metadata.id);
    }

    const lastMsg = request.messages.at(-1)?.content || "";
    return {
      text: `${this.mockText} Echo: ${lastMsg}`,
      providerId: this.metadata.id,
      modelId: "fake-llm-model",
      finishReason: "stop",
      usage: {
        promptTokens: 15,
        completionTokens: 25,
        totalTokens: 40
      },
      latency: {
        totalDurationMs: 120,
        timeToFirstTokenMs: 30
      }
    };
  }

  async *stream(request: LLMRequest, context?: ProviderExecutionContext): AsyncIterable<LLMStreamChunk> {
    this.callCount++;
    if (context?.signal?.aborted) {
      throw new ProviderCancelledError("Stream cancelado antes de iniciar.", this.metadata.id);
    }
    if (this.customError) {
      throw this.customError;
    }
    if (this.failureMode === "unavailable") {
      throw new ProviderUnavailableError("Servidor de LLM indisponível.", this.metadata.id);
    }

    const words = this.mockText.split(" ");
    for (let i = 0; i < words.length; i++) {
      if (context?.signal?.aborted) {
        throw new ProviderCancelledError("Stream interrompido por AbortSignal.", this.metadata.id);
      }
      yield {
        deltaText: words[i] + (i < words.length - 1 ? " " : ""),
        isComplete: i === words.length - 1,
        finishReason: i === words.length - 1 ? "stop" : undefined
      };
    }
  }
}
