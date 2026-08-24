import { LLMProvider } from "../../contracts/LLMProvider.ts";
import {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  ProviderMetadata,
  HealthResult,
  ProviderExecutionContext,
  ProviderInvalidResponseError,
  ProviderCancelledError
} from "../../types/index.ts";
import { executeProviderFetch, executeProviderFetchSession } from "../utils/fetchWithTimeout.ts";
import { buildProviderUrl } from "../utils/url.ts";

export interface OllamaProviderConfig {
  baseUrl?: string;
  modelId?: string;
  defaultTemperature?: number;
  apiKey?: string;
}

export class OllamaLLMProvider implements LLMProvider {
  public readonly metadata: ProviderMetadata;
  private readonly baseUrl: string;
  private readonly modelId: string;
  private readonly defaultTemperature: number;
  private readonly apiKey?: string;

  constructor(config: OllamaProviderConfig = {}) {
    this.baseUrl = config.baseUrl || "http://localhost:11434";
    this.modelId = config.modelId || "qwen2.5:3b";
    this.defaultTemperature = config.defaultTemperature ?? 0.7;
    this.apiKey = config.apiKey;

    this.metadata = {
      id: "ollama-local",
      name: "Ollama Local LLM Provider",
      type: "LLM",
      location: "LOCAL",
      version: "1.0.0",
      description: "Local inference engine running on HP Victus via Ollama OpenAI-compatible API"
    };
  }

  async health(context?: ProviderExecutionContext): Promise<HealthResult> {
    const start = performance.now();
    const url = buildProviderUrl(this.baseUrl, "/api/tags");
    try {
      const res = await executeProviderFetch(url, { method: "GET" }, this.metadata.id, context);
      const data = (await res.json()) as { models?: Array<{ name?: string }> };
      const latencyMs = Math.round(performance.now() - start);

      const models: string[] = Array.isArray(data?.models)
        ? data.models.map((m) => m.name || "")
        : [];

      const modelFound = models.some(
        (m) => m === this.modelId || m.startsWith(`${this.modelId}:`) || m.startsWith(this.modelId)
      );

      if (!modelFound) {
        return {
          providerId: this.metadata.id,
          status: "DEGRADED",
          latencyMs,
          timestamp: new Date().toISOString(),
          details: {
            configured_model: this.modelId,
            model_available: false,
            available_models_count: models.length
          }
        };
      }

      return {
        providerId: this.metadata.id,
        status: "HEALTHY",
        latencyMs,
        timestamp: new Date().toISOString(),
        details: {
          configured_model: this.modelId,
          model_available: true,
          available_models_count: models.length
        }
      };
    } catch {
      return {
        providerId: this.metadata.id,
        status: "UNAVAILABLE",
        latencyMs: Math.round(performance.now() - start),
        timestamp: new Date().toISOString(),
        details: {
          error: "Ollama service unreachable",
          target_url: url
        }
      };
    }
  }

  async generate(request: LLMRequest, context?: ProviderExecutionContext): Promise<LLMResponse> {
    const start = performance.now();
    const url = buildProviderUrl(this.baseUrl, "/v1/chat/completions");

    const messages = [];
    if (request.systemInstruction) {
      messages.push({ role: "system", content: request.systemInstruction });
    }
    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const payload = {
      model: this.modelId,
      messages,
      temperature: request.temperature ?? this.defaultTemperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
      stop: request.stopSequences,
      stream: false
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const res = await executeProviderFetch(
      url,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      },
      this.metadata.id,
      context
    );

    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new ProviderInvalidResponseError("Resposta JSON inválida recebida do Ollama.", this.metadata.id);
    }

    const choice = data?.choices?.[0];
    if (!choice || typeof choice.message?.content !== "string") {
      throw new ProviderInvalidResponseError("Formato de resposta inesperado do Ollama.", this.metadata.id);
    }

    const rawReason = String(choice.finish_reason || "stop").toLowerCase();
    let finishReason: "stop" | "length" | "content_filter" | "unknown" = "stop";
    if (rawReason === "length") finishReason = "length";
    else if (rawReason === "content_filter") finishReason = "content_filter";
    else if (rawReason !== "stop") finishReason = "unknown";

    const totalDurationMs = Math.round(performance.now() - start);

    return {
      text: choice.message.content,
      providerId: this.metadata.id,
      modelId: data?.model || this.modelId,
      finishReason,
      usage: data?.usage
        ? {
            promptTokens: Number(data.usage.prompt_tokens || 0),
            completionTokens: Number(data.usage.completion_tokens || 0),
            totalTokens: Number(data.usage.total_tokens || 0)
          }
        : undefined,
      latency: {
        totalDurationMs
      },
      metadata: request.metadata
    };
  }

  async *stream(request: LLMRequest, context?: ProviderExecutionContext): AsyncIterable<LLMStreamChunk> {
    const url = buildProviderUrl(this.baseUrl, "/v1/chat/completions");

    const messages = [];
    if (request.systemInstruction) {
      messages.push({ role: "system", content: request.systemInstruction });
    }
    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const payload = {
      model: this.modelId,
      messages,
      temperature: request.temperature ?? this.defaultTemperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
      stop: request.stopSequences,
      stream: true
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const session = await executeProviderFetchSession(
      url,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      },
      this.metadata.id,
      context
    );

    const res = session.response;
    if (!res.body) {
      session.cleanup();
      throw new ProviderInvalidResponseError("Stream body vazio recebido do Ollama.", this.metadata.id);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        session.checkAborted();

        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;
          if (trimmed === "data: [DONE]") {
            yield { deltaText: "", isComplete: true, finishReason: "stop" };
            return;
          }
          if (trimmed.startsWith("data: ")) {
            const jsonStr = trimmed.slice(6);
            let parsed: any;
            try {
              parsed = JSON.parse(jsonStr);
            } catch {
              throw new ProviderInvalidResponseError(
                `Chunk SSE inválido no stream do Ollama: ${jsonStr.slice(0, 50)}`,
                this.metadata.id
              );
            }
            const delta = parsed?.choices?.[0]?.delta?.content || "";
            const finish = parsed?.choices?.[0]?.finish_reason;
            if (delta) {
              yield { deltaText: delta, isComplete: false };
            }
            if (finish) {
              yield {
                deltaText: "",
                isComplete: true,
                finishReason: finish === "length" ? "length" : "stop"
              };
              return;
            }
          }
        }
      }
    } finally {
      session.cleanup();
      reader.releaseLock();
    }
  }
}
