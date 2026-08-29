import crypto from "node:crypto";
import {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  STTRequest,
  STTResponse,
  TTSRequest,
  TTSResponse,
  TTSStreamChunk,
  ProviderExecutionContext,
  ProviderCancelledError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  ProviderAuthenticationError,
  CapabilityMismatchError,
  ProviderInvalidResponseError,
  AeternumProviderError
} from "../../providers/types/index.ts";
import {
  GatewayHealthResponse,
  GatewaySuccessResponse
} from "../types.ts";

export interface VitaGatewayClientConfig {
  baseUrl?: string;
  authToken?: string;
  defaultTimeoutMs?: number;
}

export class VitaGatewayClient {
  public readonly baseUrl: string;
  private readonly authToken?: string;
  private readonly defaultTimeoutMs: number;

  constructor(config: VitaGatewayClientConfig = {}) {
    const rawUrl =
      config.baseUrl ||
      process.env.AETERNUM_AI_GATEWAY_URL ||
      `http://127.0.0.1:${process.env.AETERNUM_AI_GATEWAY_PORT || 8081}`;
    this.baseUrl = rawUrl.replace(/\/$/, "");
    this.authToken = config.authToken || process.env.AETERNUM_AI_GATEWAY_TOKEN;
    this.defaultTimeoutMs = config.defaultTimeoutMs || 35000;
  }

  private buildHeaders(requestId: string): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Request-Id": requestId
    };
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  private mapGatewayError(errorBody: any, status: number, requestId: string): Error {
    const code = errorBody?.error?.code || "unknown_error";
    const message = errorBody?.error?.message || `Erro no Gateway HTTP ${status}`;

    switch (code) {
      case "request_cancelled":
      case "PROVIDER_CANCELLED":
        return new ProviderCancelledError(message, "gateway");
      case "provider_timeout":
      case "gateway_timeout":
      case "PROVIDER_TIMEOUT":
      case "GATEWAY_TIMEOUT":
        return new ProviderTimeoutError(message, "gateway");
      case "provider_unavailable":
      case "all_providers_failed":
      case "PROVIDER_UNAVAILABLE":
      case "ALL_PROVIDERS_FAILED":
        return new ProviderUnavailableError(message, "gateway");
      case "provider_authentication_failed":
      case "unauthorized":
      case "PROVIDER_AUTH_ERROR":
        return new ProviderAuthenticationError(message, "gateway");
      case "capability_mismatch":
      case "CAPABILITY_MISMATCH":
        return new CapabilityMismatchError(message, "gateway");
      default:
        return new ProviderInvalidResponseError(message, "gateway");
    }
  }

  // ==========================================
  // HEALTH
  // ==========================================

  async health(context?: ProviderExecutionContext): Promise<GatewayHealthResponse> {
    const requestId = context?.requestId || `health-client-${crypto.randomUUID()}`;
    const headers = this.buildHeaders(requestId);
    const timeoutMs = context?.timeoutMs || 2000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    if (context?.signal) {
      context.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        headers,
        signal: controller.signal
      });

      if (!res.ok) {
        throw new ProviderUnavailableError(
          `Gateway health check falhou com status HTTP ${res.status}`,
          "gateway"
        );
      }

      return (await res.json()) as GatewayHealthResponse;
    } catch (err: any) {
      if (err.name === "AbortError" || context?.signal?.aborted) {
        throw new ProviderCancelledError("Health check cancelado.", "gateway");
      }
      throw new ProviderUnavailableError("Gateway inacessível no endpoint /health.", "gateway");
    } finally {
      clearTimeout(timer);
    }
  }

  // ==========================================
  // LLM: GENERATE & STREAM
  // ==========================================

  async generate(request: LLMRequest, context?: ProviderExecutionContext): Promise<LLMResponse> {
    const requestId = context?.requestId || `llm-req-${crypto.randomUUID()}`;
    const headers = this.buildHeaders(requestId);

    const payload = {
      messages: request.messages,
      systemInstruction: request.systemInstruction,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      topP: request.topP,
      stopSequences: request.stopSequences,
      metadata: request.metadata
    };

    try {
      const res = await fetch(`${this.baseUrl}/v1/llm/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: context?.signal
      });

      if (!res.ok) {
        let errJson: any;
        try {
          errJson = await res.json();
        } catch {
          errJson = null;
        }
        throw this.mapGatewayError(errJson, res.status, requestId);
      }

      const data = (await res.json()) as GatewaySuccessResponse<LLMResponse>;
      return {
        ...data.data,
        metadata: {
          ...data.data?.metadata,
          requestId: data.metadata?.requestId || requestId
        }
      };
    } catch (err: any) {
      if (context?.signal?.aborted || err.name === "AbortError" || err.code === "PROVIDER_CANCELLED") {
        throw new ProviderCancelledError("Geração LLM cancelada pelo usuário.", "gateway");
      }
      if (err instanceof AeternumProviderError) {
        throw err;
      }
      throw new ProviderUnavailableError("Falha de conexão com Gateway para geração LLM.", "gateway");
    }
  }

  async *streamGenerate(
    request: LLMRequest,
    context?: ProviderExecutionContext
  ): AsyncIterable<LLMStreamChunk> {
    const requestId = context?.requestId || `llm-stream-${crypto.randomUUID()}`;
    const headers = this.buildHeaders(requestId);

    const payload = {
      messages: request.messages,
      systemInstruction: request.systemInstruction,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      topP: request.topP,
      stopSequences: request.stopSequences,
      metadata: request.metadata
    };

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/v1/llm/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: context?.signal
      });
    } catch (err: any) {
      if (context?.signal?.aborted || err.name === "AbortError") {
        throw new ProviderCancelledError("Stream LLM cancelado.", "gateway");
      }
      throw new ProviderUnavailableError("Falha de conexão com Gateway para stream LLM.", "gateway");
    }

    if (!res.ok) {
      let errJson: any;
      try {
        errJson = await res.json();
      } catch {
        errJson = null;
      }
      throw this.mapGatewayError(errJson, res.status, requestId);
    }

    if (!res.body) {
      throw new ProviderUnavailableError("Corpo de resposta de stream vazio do Gateway.", "gateway");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        if (context?.signal?.aborted) {
          throw new ProviderCancelledError("Stream LLM abortado pelo usuário.", "gateway");
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "message";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;

          if (trimmed.startsWith("event: ")) {
            currentEvent = trimmed.slice(7).trim();
            continue;
          }

          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            if (dataStr === "[DONE]") {
              yield { deltaText: "", isComplete: true, finishReason: "stop" };
              return;
            }

            let parsed: any;
            try {
              parsed = JSON.parse(dataStr);
            } catch {
              continue;
            }

            if (currentEvent === "error") {
              throw this.mapGatewayError({ error: parsed }, 500, requestId);
            }

            yield {
              deltaText: parsed.deltaText || "",
              isComplete: Boolean(parsed.isComplete),
              finishReason: parsed.finishReason
            };
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // ==========================================
  // STT: TRANSCRIBE
  // ==========================================

  async transcribe(request: STTRequest, context?: ProviderExecutionContext): Promise<STTResponse> {
    const requestId = context?.requestId || `stt-req-${crypto.randomUUID()}`;
    const headers = this.buildHeaders(requestId);

    const audioBase64 = Buffer.from(request.audioBuffer).toString("base64");
    const payload = {
      audioBase64,
      language: request.language,
      sampleRate: request.sampleRate,
      audioFormat: request.audioFormat || "wav",
      medicalContextHints: request.medicalContextHints
    };

    try {
      const res = await fetch(`${this.baseUrl}/v1/stt/transcribe`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: context?.signal
      });

      if (!res.ok) {
        let errJson: any;
        try {
          errJson = await res.json();
        } catch {
          errJson = null;
        }
        throw this.mapGatewayError(errJson, res.status, requestId);
      }

      const data = (await res.json()) as GatewaySuccessResponse<STTResponse>;
      return data.data;
    } catch (err: any) {
      if (context?.signal?.aborted || err.name === "AbortError" || err.code === "PROVIDER_CANCELLED") {
        throw new ProviderCancelledError("Transcrição STT cancelada pelo usuário.", "gateway");
      }
      if (err instanceof AeternumProviderError) {
        throw err;
      }
      throw new ProviderUnavailableError("Falha de conexão com Gateway para transcrição STT.", "gateway");
    }
  }

  // ==========================================
  // TTS: SYNTHESIZE & STREAM
  // ==========================================

  async synthesize(request: TTSRequest, context?: ProviderExecutionContext): Promise<TTSResponse> {
    const requestId = context?.requestId || `tts-req-${crypto.randomUUID()}`;
    const headers = this.buildHeaders(requestId);

    const payload = {
      text: request.text,
      voiceProfileId: request.voiceProfileId,
      language: request.language,
      speed: request.speed,
      sampleRate: request.sampleRate,
      audioFormat: request.audioFormat || "pcm"
    };

    try {
      const res = await fetch(`${this.baseUrl}/v1/tts/synthesize`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: context?.signal
      });

      if (!res.ok) {
        let errJson: any;
        try {
          errJson = await res.json();
        } catch {
          errJson = null;
        }
        throw this.mapGatewayError(errJson, res.status, requestId);
      }

      const data = (await res.json()) as GatewaySuccessResponse<{
        audioBase64: string;
        audioFormat: any;
        sampleRate: number;
        providerId: string;
        modelId: string;
        latency?: any;
      }>;

      const audioBuffer = Buffer.from(data.data.audioBase64, "base64");
      return {
        audioBuffer: new Uint8Array(audioBuffer),
        audioFormat: data.data.audioFormat,
        sampleRate: data.data.sampleRate,
        providerId: data.data.providerId,
        modelId: data.data.modelId,
        latency: data.data.latency
      };
    } catch (err: any) {
      if (context?.signal?.aborted || err.name === "AbortError" || err.code === "PROVIDER_CANCELLED") {
        throw new ProviderCancelledError("Síntese TTS cancelada pelo usuário.", "gateway");
      }
      if (err instanceof AeternumProviderError) {
        throw err;
      }
      throw new ProviderUnavailableError("Falha de conexão com Gateway para síntese TTS.", "gateway");
    }
  }

  async *streamSynthesis(
    request: TTSRequest,
    context?: ProviderExecutionContext
  ): AsyncIterable<TTSStreamChunk> {
    const requestId = context?.requestId || `tts-stream-${crypto.randomUUID()}`;
    const headers = this.buildHeaders(requestId);

    const payload = {
      text: request.text,
      voiceProfileId: request.voiceProfileId,
      language: request.language,
      speed: request.speed,
      sampleRate: request.sampleRate,
      audioFormat: request.audioFormat || "pcm"
    };

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/v1/tts/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: context?.signal
      });
    } catch (err: any) {
      if (context?.signal?.aborted || err.name === "AbortError") {
        throw new ProviderCancelledError("Stream TTS cancelado.", "gateway");
      }
      throw new ProviderUnavailableError("Falha de conexão com Gateway para stream TTS.", "gateway");
    }

    if (!res.ok) {
      let errJson: any;
      try {
        errJson = await res.json();
      } catch {
        errJson = null;
      }
      throw this.mapGatewayError(errJson, res.status, requestId);
    }

    if (!res.body) {
      throw new ProviderUnavailableError("Corpo de stream TTS vazio do Gateway.", "gateway");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        if (context?.signal?.aborted) {
          throw new ProviderCancelledError("Stream TTS abortado pelo usuário.", "gateway");
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "message";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;

          if (trimmed.startsWith("event: ")) {
            currentEvent = trimmed.slice(7).trim();
            continue;
          }

          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            if (dataStr === "[DONE]") {
              yield { audioChunk: new Uint8Array(), isFinal: true };
              return;
            }

            let parsed: any;
            try {
              parsed = JSON.parse(dataStr);
            } catch {
              continue;
            }

            if (currentEvent === "error") {
              throw this.mapGatewayError({ error: parsed }, 500, requestId);
            }

            if (parsed.audioBase64) {
              const chunkBytes = Buffer.from(parsed.audioBase64, "base64");
              yield {
                audioChunk: new Uint8Array(chunkBytes),
                isFinal: Boolean(parsed.isFinal)
              };
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
