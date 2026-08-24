import { STTProvider } from "../contracts/STTProvider.ts";
import { STTRequest, STTResponse, STTStreamChunk, ProviderMetadata, HealthResult } from "../types/index.ts";

export class FakeSTTProvider implements STTProvider {
  public readonly metadata: ProviderMetadata = {
    id: "fake-stt",
    name: "Fake Faster-Whisper Test Provider",
    type: "STT",
    location: "LOCAL",
    version: "1.0.0"
  };

  public shouldFail = false;
  public mockTranscript = "Transcrição simulada de anatomia humana.";

  async health(): Promise<HealthResult> {
    return {
      providerId: this.metadata.id,
      status: this.shouldFail ? "UNAVAILABLE" : "HEALTHY",
      latencyMs: 8,
      timestamp: new Date().toISOString()
    };
  }

  async transcribe(request: STTRequest): Promise<STTResponse> {
    if (this.shouldFail) {
      throw new Error("Fake STT failure");
    }
    return {
      text: this.mockTranscript,
      languageDetected: request.language || "pt",
      confidence: 0.98,
      providerId: this.metadata.id,
      modelId: "fake-whisper-medium",
      latency: {
        totalDurationMs: 150
      }
    };
  }

  async *streamTranscription(
    audioStream: AsyncIterable<Uint8Array>,
    _options: Omit<STTRequest, "audioBuffer">
  ): AsyncIterable<STTStreamChunk> {
    for await (const _chunk of audioStream) {
      if (this.shouldFail) throw new Error("Fake STT stream failure");
      yield { partialText: this.mockTranscript, isFinal: false };
    }
    yield { partialText: this.mockTranscript, isFinal: true };
  }
}
