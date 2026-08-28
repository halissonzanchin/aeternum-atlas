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
    return {
      providerId: this.metadata.id,
      status: this.failureMode === "unavailable" ? "UNAVAILABLE" : "HEALTHY",
      latencyMs: 8,
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
      throw new ProviderUnavailableError("Serviço de STT indisponível.", this.metadata.id);
    }
    if (this.failureMode === "timeout") {
      throw new ProviderTimeoutError("Tempo limite de transcrição excedido.", this.metadata.id);
    }
    if (this.failureMode === "invalid_response") {
      throw new ProviderInvalidResponseError("Resposta malformada de STT.", this.metadata.id);
    }

    return {
      text: this.mockTranscript,
      languageDetected: request.language || "pt-BR",
      confidence: 0.98,
      providerId: this.metadata.id,
      modelId: "fake-stt-model",
      latency: {
        totalDurationMs: 150
      }
    };
  }

  async *streamTranscription(
    audioStream: AsyncIterable<Uint8Array>,
    _options: Omit<STTRequest, "audioBuffer">,
    context?: ProviderExecutionContext
  ): AsyncIterable<STTStreamChunk> {
    this.callCount++;
    for await (const _chunk of audioStream) {
      if (context?.signal?.aborted) {
        throw new ProviderCancelledError("Stream de áudio cancelado.", this.metadata.id);
      }
      if (this.customError) {
        throw this.customError;
      }
      if (this.failureMode === "unavailable") {
        throw new ProviderUnavailableError("Falha no stream de STT.", this.metadata.id);
      }
      yield { partialText: this.mockTranscript, isFinal: false };
    }
    yield { partialText: this.mockTranscript, isFinal: true };
  }
}
