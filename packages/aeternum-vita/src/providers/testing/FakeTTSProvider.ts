import { TTSProvider } from "../contracts/TTSProvider.ts";
import {
  TTSRequest,
  TTSResponse,
  TTSStreamChunk,
  ProviderMetadata,
  HealthResult,
  ProviderExecutionContext,
  ProviderCancelledError,
  ProviderUnavailableError,
  ProviderTimeoutError,
  ProviderInvalidResponseError
} from "../types/index.ts";

export class FakeTTSProvider implements TTSProvider {
  public readonly metadata: ProviderMetadata = {
    id: "fake-tts",
    name: "Fake TTS Provider",
    type: "TTS",
    location: "LOCAL",
    version: "1.0.0"
  };

  public failureMode?: "unavailable" | "timeout" | "invalid_response" | "custom";
  public customError?: Error;
  public callCount = 0;

  constructor(metadata?: Partial<ProviderMetadata>) {
    if (metadata) {
      this.metadata = { ...this.metadata, ...metadata };
    }
  }

  async health(_context?: ProviderExecutionContext): Promise<HealthResult> {
    return {
      providerId: this.metadata.id,
      status: this.failureMode === "unavailable" ? "UNAVAILABLE" : "HEALTHY",
      latencyMs: 12,
      timestamp: new Date().toISOString()
    };
  }

  async synthesize(request: TTSRequest, context?: ProviderExecutionContext): Promise<TTSResponse> {
    this.callCount++;
    if (context?.signal?.aborted) {
      throw new ProviderCancelledError("Síntese cancelada por AbortSignal.", this.metadata.id);
    }
    if (this.customError) {
      throw this.customError;
    }
    if (this.failureMode === "unavailable") {
      throw new ProviderUnavailableError("Servidor de TTS indisponível.", this.metadata.id);
    }
    if (this.failureMode === "timeout") {
      throw new ProviderTimeoutError("Tempo limite de síntese excedido.", this.metadata.id);
    }
    if (this.failureMode === "invalid_response") {
      throw new ProviderInvalidResponseError("Resposta malformada de TTS.", this.metadata.id);
    }

    return {
      audioBuffer: new Uint8Array([0, 1, 2, 3, 4, 5]),
      audioFormat: request.audioFormat || "pcm",
      sampleRate: request.sampleRate || 24000,
      providerId: this.metadata.id,
      modelId: "fake-tts-model",
      latency: {
        totalDurationMs: 200,
        timeToFirstByteMs: 45
      }
    };
  }

  async *streamSynthesis(request: TTSRequest, context?: ProviderExecutionContext): AsyncIterable<TTSStreamChunk> {
    this.callCount++;
    if (context?.signal?.aborted) {
      throw new ProviderCancelledError("Stream de voz cancelado antes de iniciar.", this.metadata.id);
    }
    if (this.customError) {
      throw this.customError;
    }
    if (this.failureMode === "unavailable") {
      throw new ProviderUnavailableError("Falha na síntese de áudio.", this.metadata.id);
    }

    yield { audioChunk: new Uint8Array([0, 1]), isFinal: false };
    if (context?.signal?.aborted) {
      throw new ProviderCancelledError("Stream de voz interrompido por barge-in.", this.metadata.id);
    }
    yield { audioChunk: new Uint8Array([2, 3, 4, 5]), isFinal: true };
  }
}
