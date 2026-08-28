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

  public healthStatus: "HEALTHY" | "DEGRADED" | "UNAVAILABLE" = "HEALTHY";
  public failureMode?: "unavailable" | "timeout" | "invalid_response" | "custom";
  public customError?: Error;
  public mockAudio = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00]);
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

  async synthesize(request: TTSRequest, context?: ProviderExecutionContext): Promise<TTSResponse> {
    this.callCount++;
    if (context?.signal?.aborted) {
      throw new ProviderCancelledError("Síntese de voz cancelada.", this.metadata.id);
    }
    if (this.customError) {
      throw this.customError;
    }
    if (this.failureMode === "unavailable") {
      throw new ProviderUnavailableError("TTS local indisponível.", this.metadata.id);
    }
    if (this.failureMode === "timeout") {
      throw new ProviderTimeoutError("Timeout na síntese TTS.", this.metadata.id);
    }
    if (this.failureMode === "invalid_response") {
      throw new ProviderInvalidResponseError("Resposta inválida no TTS.", this.metadata.id);
    }

    return {
      audioBuffer: this.mockAudio,
      audioFormat: request.audioFormat || "pcm",
      sampleRate: request.sampleRate || 24000,
      providerId: this.metadata.id,
      modelId: request.modelId || "fake-tts-model",
      voiceId: request.voiceProfileId || "pt-br-warm-male-01"
    };
  }

  async *streamSynthesis(
    request: TTSRequest,
    context?: ProviderExecutionContext
  ): AsyncIterable<TTSStreamChunk> {
    this.callCount++;
    if (context?.signal?.aborted) {
      throw new ProviderCancelledError("Stream TTS cancelado.", this.metadata.id);
    }
    if (this.customError) {
      throw this.customError;
    }
    if (this.failureMode === "unavailable") {
      throw new ProviderUnavailableError("TTS indisponível para stream.", this.metadata.id);
    }
    if (this.failureMode === "timeout") {
      throw new ProviderTimeoutError("Timeout no stream TTS.", this.metadata.id);
    }

    for (let i = 0; i < 2; i++) {
      if (context?.signal?.aborted) {
        throw new ProviderCancelledError("Stream TTS abortado durante iteração.", this.metadata.id);
      }
      yield {
        audioChunk: i === 0 ? this.mockAudio.slice(0, 4) : this.mockAudio.slice(4),
        isFinal: i === 1
      };
    }
  }
}
