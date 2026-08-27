import { LLMProvider } from "../../contracts/LLMProvider.ts";
import {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  LLMFinishReason,
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

export function normalizeGeminiFinishReason(rawReason?: string): LLMFinishReason {
  if (!rawReason) return "unknown";
  const upper = rawReason.toUpperCase();
  if (upper === "STOP") return "stop";
  if (upper === "MAX_TOKENS") return "length";
  if (
    upper === "SAFETY" ||
    upper === "RECITATION" ||
    upper === "LANGUAGE" ||
    upper === "BLOCKLIST" ||
    upper === "PROHIBITED_CONTENT" ||
    upper === "SPII" ||
    upper === "IMAGE_SAFETY" ||
    upper === "IMAGE_PROHIBITED_CONTENT" ||
    upper === "IMAGE_RECITATION" ||
    upper === "ESCALATION"
  ) {
    return "content_filter";
  }
  // OTHER, MALFORMED_FUNCTION_CALL, UNEXPECTED_TOOL_CALL, etc. are not content_filter
  return "unknown";
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
      description: "Cloud LLM adapter for Google Gemini API (v1beta) with zero token-cost health check and model-aware config"
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
    const systemParts: string[] = [];

    // Deterministic systemInstruction handling (merges request.systemInstruction and role=system messages)
    if (request.systemInstruction && request.systemInstruction.trim()) {
      systemParts.push(request.systemInstruction.trim());
    }

    for (const msg of request.messages) {
      if (msg.role === "system") {
        if (msg.content && msg.content.trim()) {
          systemParts.push(msg.content.trim());
        }
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

    const systemInstruction = systemParts.length > 0
      ? { parts: [{ text: systemParts.join("\n\n") }] }
      : undefined;

    const isGemini3 = this.modelId.includes("3.") || this.modelId.includes("3-") || this.modelId.includes("3_");
    const generationConfig: Record<string, any> = {};

    if (typeof request.maxTokens === "number") {
      generationConfig.maxOutputTokens = request.maxTokens;
    }

    if (isGemini3) {
      // Gemini 3.x: DO NOT send deprecated sampling parameters (temperature, top_p, top_k)
      generationConfig.thinkingConfig = {
        thinkingLevel: "low"
      };
    } else {
      // Older model families (e.g. 2.0 / 1.5): pass temperature/topP if provided
      if (typeof request.temperature === "number") {
        generationConfig.temperature = request.temperature;
      }
      if (typeof request.topP === "number") {
        generationConfig.topP = request.topP;
      }
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

    // STRICT NON-LEAKAGE OF THOUGHT PARTS: thought=true MUST NEVER become response.text
    const nonThoughtParts = parts.filter((p: any) => !p?.thought && typeof p?.text === "string");
    if (nonThoughtParts.length === 0) {
      throw new ProviderInvalidResponseError("Resposta estrutural inválida do Gemini: nenhuma parte de texto gerado encontrada (apenas thought parts).", this.metadata.id);
    }

    const textPart = nonThoughtParts.map((p: any) => p.text).join("\n\n").trim();
    if (textPart.length === 0) {
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
      finishReason: normalizeGeminiFinishReason(candidate?.finishReason),
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
              // STRICT: Only extract non-thought parts, never leak thought strings
              const nonThoughtParts = parts.filter((p: any) => !p?.thought && typeof p?.text === "string");
              if (nonThoughtParts.length > 0) {
                textDelta = nonThoughtParts.map((p: any) => p.text).join("");
              }
            }
            const rawFinishReason = candidate?.finishReason;
            const finishReason = rawFinishReason ? normalizeGeminiFinishReason(rawFinishReason) : undefined;

            if (textDelta || finishReason) {
              yield {
                deltaText: textDelta,
                isComplete: Boolean(finishReason),
                finishReason
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
