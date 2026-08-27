import { LLMProvider } from "../../contracts/LLMProvider.ts";
import {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  ProviderMetadata,
  HealthResult,
  ProviderExecutionContext,
  ProviderInvalidResponseError,
  ProviderAuthenticationError
} from "../../types/index.ts";
import { executeProviderJson, executeProviderFetchSession } from "../../local/utils/fetchWithTimeout.ts";

export interface GeminiLLMConfig {
  apiKey?: string;
  modelId?: string;
  baseUrl?: string;
  apiVersion?: string;
}

export class GeminiLLMProvider implements LLMProvider {
  public readonly metadata: ProviderMetadata;
  private readonly apiKey?: string;
  private readonly modelId: string;
  private readonly baseUrl: string;
  private readonly apiVersion: string;

  constructor(config: GeminiLLMConfig = {}) {
    this.apiKey = config.apiKey !== undefined ? config.apiKey : (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);
    this.modelId = config.modelId !== undefined ? config.modelId : ((typeof process !== "undefined" ? process.env?.GEMINI_MODEL : undefined) || "gemini-3.7-flash");
    this.baseUrl = config.baseUrl !== undefined ? config.baseUrl : "https://generativelanguage.googleapis.com";
    this.apiVersion = config.apiVersion !== undefined ? config.apiVersion : "v1beta";

    this.metadata = {
      id: "gemini-llm-cloud",
      name: "Google Gemini Cloud LLM Provider",
      type: "LLM",
      location: "CLOUD",
      version: "1.0.0",
      description: "Cloud LLM adapter for Google Gemini API (v1beta) with zero token-cost health check and model-aware thinking config"
    };
  }

  async health(context?: ProviderExecutionContext): Promise<HealthResult> {
    const start = performance.now();
    if (!this.apiKey) {
      return {
        providerId: this.metadata.id,
        status: "DEGRADED",
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        details: {
          configured_model: this.modelId,
          error: "GEMINI_API_KEY not configured"
        }
      };
    }

    const url = `${this.baseUrl}/${this.apiVersion}/models/${encodeURIComponent(this.modelId)}`;
    try {
      await executeProviderJson<{ name?: string }>(
        url,
        {
          method: "GET",
          headers: {
            "x-goog-api-key": this.apiKey
          }
        },
        this.metadata.id,
        context
      );
      const latencyMs = Math.round(performance.now() - start);

      return {
        providerId: this.metadata.id,
        status: "HEALTHY",
        latencyMs,
        timestamp: new Date().toISOString(),
        details: {
          configured_model: this.modelId,
          model_available: true
        }
      };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      if (err instanceof ProviderAuthenticationError) {
        return {
          providerId: this.metadata.id,
          status: "DEGRADED",
          latencyMs,
          timestamp: new Date().toISOString(),
          details: {
            configured_model: this.modelId,
            error: "Invalid or unauthorized API key"
          }
        };
      }
      return {
        providerId: this.metadata.id,
        status: "UNAVAILABLE",
        latencyMs,
        timestamp: new Date().toISOString(),
        details: {
          configured_model: this.modelId,
          error: "Gemini API unreachable"
        }
      };
    }
  }

  private buildPayload(request: LLMRequest) {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    let systemInstruction: { parts: Array<{ text: string }> } | undefined;

    for (const msg of request.messages) {
      if (msg.role === "system") {
        systemInstruction = { parts: [{ text: msg.content }] };
      } else {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        });
      }
    }

    if (contents.length === 0) {
      contents.push({ role: "user", parts: [{ text: "" }] });
    }

    const generationConfig: Record<string, any> = {};
    if (typeof request.temperature === "number") generationConfig.temperature = request.temperature;
    if (typeof request.maxTokens === "number") generationConfig.maxOutputTokens = request.maxTokens;

    // Model-aware thinking config for Gemini 3.7 Flash
    if (this.modelId.includes("3.7") || this.modelId.includes("thinking")) {
      generationConfig.thinkingConfig = {
        thinkingLevel: "low"
      };
    }

    return {
      contents,
      ...(systemInstruction ? { systemInstruction } : {}),
      ...(Object.keys(generationConfig).length > 0 ? { generationConfig } : {})
    };
  }

  async generate(request: LLMRequest, context?: ProviderExecutionContext): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new ProviderAuthenticationError("GEMINI_API_KEY não configurada.", this.metadata.id);
    }

    const start = performance.now();
    const url = `${this.baseUrl}/${this.apiVersion}/models/${encodeURIComponent(this.modelId)}:generateContent`;
    const payload = this.buildPayload(request);

    const data = await executeProviderJson<any>(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey
        },
        body: JSON.stringify(payload)
      },
      this.metadata.id,
      context
    );

    const candidate = data?.candidates?.[0];
    if (!candidate) {
      throw new ProviderInvalidResponseError("Resposta estrutural inválida do Gemini: candidates ausente ou vazio.", this.metadata.id);
    }

    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts) || parts.length === 0) {
      throw new ProviderInvalidResponseError("Resposta estrutural inválida do Gemini: parte textual ausente.", this.metadata.id);
    }

    const nonThoughtParts = parts.filter((p: any) => !p?.thought && typeof p?.text === "string");
    const textPart = nonThoughtParts.length > 0
      ? nonThoughtParts.map((p: any) => p.text).join("\n\n").trim()
      : (typeof parts.at(-1)?.text === "string" ? parts.at(-1).text.trim() : "");

    if (typeof textPart !== "string" || textPart.length === 0) {
      throw new ProviderInvalidResponseError("Resposta textual vazia retornada pelo Gemini.", this.metadata.id);
    }

    const totalDurationMs = Math.round(performance.now() - start);

    const promptTokens = data?.usageMetadata?.promptTokenCount;
    const completionTokens = data?.usageMetadata?.candidatesTokenCount;
    const totalTokens = data?.usageMetadata?.totalTokenCount;

    return {
      text: textPart,
      providerId: this.metadata.id,
      modelId: this.modelId,
      finishReason: candidate?.finishReason || "stop",
      usage: totalTokens !== undefined ? {
        promptTokens: promptTokens || 0,
        completionTokens: completionTokens || 0,
        totalTokens
      } : undefined,
      latency: {
        totalDurationMs
      }
    };
  }

  async *stream(request: LLMRequest, context?: ProviderExecutionContext): AsyncIterable<LLMStreamChunk> {
    if (!this.apiKey) {
      throw new ProviderAuthenticationError("GEMINI_API_KEY não configurada.", this.metadata.id);
    }

    const url = `${this.baseUrl}/${this.apiVersion}/models/${encodeURIComponent(this.modelId)}:streamGenerateContent?alt=sse`;
    const payload = this.buildPayload(request);

    const session = await executeProviderFetchSession(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey
        },
        body: JSON.stringify(payload)
      },
      this.metadata.id,
      context
    );

    const res = session.response;
    if (!res.body) {
      session.cleanup();
      throw new ProviderInvalidResponseError("Corpo de resposta de stream vazio do Gemini.", this.metadata.id);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        session.checkAborted();

        let readResult = { done: false, value: undefined as Uint8Array | undefined };
        try {
          readResult = await reader.read();
        } catch (err) {
          session.handleStreamReadError(err);
        }

        if (readResult.done) break;

        buffer += decoder.decode(readResult.value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;

          if (trimmed.startsWith("data: ")) {
            const jsonStr = trimmed.slice(6);
            if (jsonStr === "[DONE]") return;

            let parsed: any;
            try {
              parsed = JSON.parse(jsonStr);
            } catch {
              throw new ProviderInvalidResponseError(
                `Chunk SSE inválido ou corrompido do Gemini: ${jsonStr.slice(0, 50)}`,
                this.metadata.id
              );
            }

            const candidate = parsed?.candidates?.[0];
            const parts = candidate?.content?.parts;
            let textDelta = "";
            if (Array.isArray(parts)) {
              const nonThoughtParts = parts.filter((p: any) => !p?.thought && typeof p?.text === "string");
              if (nonThoughtParts.length > 0) {
                textDelta = nonThoughtParts.map((p: any) => p.text).join("");
              } else if (typeof parts.at(-1)?.text === "string") {
                textDelta = parts.at(-1).text;
              }
            }
            const finishReason = candidate?.finishReason;

            if (textDelta || finishReason) {
              yield {
                deltaText: textDelta,
                isComplete: Boolean(finishReason),
                finishReason: finishReason || undefined
              };
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
