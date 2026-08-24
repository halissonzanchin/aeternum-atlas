import { LLMProvider } from "../contracts/LLMProvider.ts";
import { LLMRequest, LLMResponse, LLMStreamChunk, ProviderMetadata, HealthResult } from "../types/index.ts";

export class FakeLLMProvider implements LLMProvider {
  public readonly metadata: ProviderMetadata = {
    id: "fake-llm",
    name: "Fake LLM Test Provider",
    type: "LLM",
    location: "LOCAL",
    version: "1.0.0"
  };

  public shouldFail = false;
  public mockText = "Resposta simulada do modelo de teste.";

  async health(): Promise<HealthResult> {
    if (this.shouldFail) {
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

  async generate(request: LLMRequest): Promise<LLMResponse> {
    if (this.shouldFail) {
      throw new Error("Fake LLM generation failure");
    }
    const lastMsg = request.messages.at(-1)?.content || "";
    return {
      text: `${this.mockText} Echo: ${lastMsg}`,
      providerId: this.metadata.id,
      modelId: "fake-qwen-3b",
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

  async *stream(request: LLMRequest): AsyncIterable<LLMStreamChunk> {
    if (this.shouldFail) {
      throw new Error("Fake LLM stream failure");
    }
    const words = this.mockText.split(" ");
    for (let i = 0; i < words.length; i++) {
      yield {
        deltaText: words[i] + (i < words.length - 1 ? " " : ""),
        isComplete: i === words.length - 1,
        finishReason: i === words.length - 1 ? "stop" : undefined
      };
    }
  }
}
