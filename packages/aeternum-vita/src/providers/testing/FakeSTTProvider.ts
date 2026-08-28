import { STTProvider } from "../contracts/STTProvider.ts";
import {
  STTRequest,
  STTResponse,
  STTStreamChunk,
  ProviderMetadata,
  HealthResult,
  ProviderExecutionContext,
  ProviderCancelledError,
  ProviderUnavailableError,
  ProviderTimeoutError,
  ProviderInvalidResponseError
} from "../types/index.ts";

export class FakeSTTProvider implements STTProvider {
  public readonly metadata: ProviderMetadata = {
    id: "fake-stt",
    name: "Fake STT Provider",
    type: "STT",
    location: "LOCAL",
    version: "1.0.0"
  };

  public healthStatus: "HEALTHY" | "DEGRADED" | "UNAVAILABLE" = "HEALTHY";
  public failureMode?: "unavailable" | "timeout" | "invalid_response" | "custom";
  public customError?: Error;
  public mockTranscript = "Transcrição simulada de anatomia humana.";
  public callCount = 0;
  public supportsStreaming = true;

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

  async transcribe(request: STTRequest, context?: ProviderExecutionContext): Promise<STTResponse> {
    this.callCount++;
    if (context?.signal?.aborted) {
      throw new ProviderCancelledError("Transcrição cancelada.", this.metadata.id);
    }
    if (this.customError) {
      throw this.customError;
    }
    if (this.failureMode === "unavailable") {
      throw new ProviderUnavailableError("STT local indisponível.", this.metadata.id);
    }
    if (this.failureMode === "timeout") {
      throw new ProviderTimeoutError("Timeout na transcrição STT.", this.metadata.id);
    }
    if (this.failureMode === "invalid_response") {
      throw new ProviderInvalidResponseError("Resposta inválida no STT.", this.metadata.id);
    }

    return {
      text: this.mockTranscript,
      languageDetected: request.language || "pt-BR",
      confidence: 0.98,
      providerId: this.metadata.id,
      modelId: request.modelId || "fake-stt-model"
    };
  }

  async *streamTranscription(
    audioStream: AsyncIterable<Uint8Array>,
    options: Omit<STTRequest, "audioBuffer">,
    context?: ProviderExecutionContext
  ): AsyncIterable<STTStreamChunk> {
    this.callCount++;
    if (context?.signal?.aborted) {
      throw new ProviderCancelledError("Stream de transcrição cancelado.", this.metadata.id);
    }
    if (this.customError) {
      throw this.customError;
    }
    if (this.failureMode === "unavailable") {
      throw new ProviderUnavailableError("STT indisponível para stream.", this.metadata.id);
    }
    if (this.failureMode === "timeout") {
      throw new ProviderTimeoutError("Timeout no stream de transcrição.", this.metadata.id);
    }

    for await (const _chunk of audioStream) {
      if (context?.signal?.aborted) {
        throw new ProviderCancelledError("Stream de áudio cancelado.", this.metadata.id);
      }
      yield {
        partialText: this.mockTranscript,
        isFinal: false
      };
    }

    yield {
      partialText: this.mockTranscript,
      isFinal: true
    };
  }
}
