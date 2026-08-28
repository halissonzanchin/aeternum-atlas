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
  ProviderInvalidResponseError,
  ProviderRateLimitError
} from "../types/index.ts";

export class FakeLLMProvider implements LLMProvider {
  public readonly metadata: ProviderMetadata = {
    id: "fake-llm",
    name: "Fake LLM Provider",
    type: "LLM",
    location: "LOCAL",
    version: "1.0.0"
  };

  public healthStatus: "HEALTHY" | "DEGRADED" | "UNAVAILABLE" = "HEALTHY";
  public failureMode?: "unavailable" | "timeout" | "invalid_response" | "rate_limit" | "custom";
  public customError?: Error;
  public mockResponseText?: string;
  public callCount = 0;

  constructor(metadata?: Partial<ProviderMetadata>) {
    if (metadata) {
      this.metadata = { ...this.metadata, ...metadata };
    }
  }

  async health(_context?: ProviderExecutionContext): Promise<HealthResult> {
    const status =
      this.healthStatus !== "HEALTHY"
        ? this.healthStatus
        : this.failureMode === "unavailable"
        ? "UNAVAILABLE"
        : "HEALTHY";
    return {
      providerId: this.metadata.id,
      status,
      latencyMs: 1,
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
      throw new ProviderUnavailableError("Provider local indisponível.", this.metadata.id);
    }
    if (this.failureMode === "timeout") {
      throw new ProviderTimeoutError("Timeout na chamada do provider.", this.metadata.id);
    }
    if (this.failureMode === "rate_limit") {
      throw new ProviderRateLimitError("Rate limit excedido.", this.metadata.id, 30);
    }
    if (this.failureMode === "invalid_response") {
      throw new ProviderInvalidResponseError("Resposta corrompida do provider.", this.metadata.id);
    }

    const lastMsg = request.messages[request.messages.length - 1]?.content || "";
    const text = this.mockResponseText !== undefined ? this.mockResponseText : `Echo: ${lastMsg}`;

    return {
      text,
      modelId: request.modelId || "fake-llm-model",
      providerId: this.metadata.id,
      finishReason: "stop",
      usage: {
        promptTokens: 10,
        completionTokens: 30,
        totalTokens: 40
      },
      latency: {
        totalDurationMs: 25
      }
    };
  }

  async *stream(
    request: LLMRequest,
    context?: ProviderExecutionContext
  ): AsyncIterable<LLMStreamChunk> {
    this.callCount++;
    if (context?.signal?.aborted) {
      throw new ProviderCancelledError("Stream cancelado antes de iniciar.", this.metadata.id);
    }
    if (this.customError) {
      throw this.customError;
    }
    if (this.failureMode === "unavailable") {
      throw new ProviderUnavailableError("Provider local indisponível para stream.", this.metadata.id);
    }
    if (this.failureMode === "timeout") {
      throw new ProviderTimeoutError("Timeout no stream do provider.", this.metadata.id);
    }
    if (this.failureMode === "rate_limit") {
      throw new ProviderRateLimitError("Rate limit no stream.", this.metadata.id, 30);
    }
    if (this.failureMode === "invalid_response") {
      throw new ProviderInvalidResponseError("Resposta corrompida no stream.", this.metadata.id);
    }

    const lastMsg = request.messages[request.messages.length - 1]?.content || "";
    const text = this.mockResponseText !== undefined ? this.mockResponseText : `Echo: ${lastMsg}`;
    const words = text.split(" ");
    for (let i = 0; i < words.length; i++) {
      if (context?.signal?.aborted) {
        throw new ProviderCancelledError("Stream abortado durante iteração.", this.metadata.id);
      }
      yield {
        deltaText: (i > 0 ? " " : "") + words[i],
        isComplete: false
      };
    }

    yield {
      deltaText: "",
      isComplete: true,
      finishReason: "stop"
    };
  }
}
