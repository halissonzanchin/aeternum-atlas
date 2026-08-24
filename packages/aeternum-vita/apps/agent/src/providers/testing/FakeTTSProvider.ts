import { TTSProvider } from "../contracts/TTSProvider.ts";
import { TTSRequest, TTSResponse, TTSStreamChunk, ProviderMetadata, HealthResult } from "../types/index.ts";

export class FakeTTSProvider implements TTSProvider {
  public readonly metadata: ProviderMetadata = {
    id: "fake-tts",
    name: "Fake Kokoro Test Provider",
    type: "TTS",
    location: "LOCAL",
    version: "1.0.0"
  };

  public shouldFail = false;

  async health(): Promise<HealthResult> {
    return {
      providerId: this.metadata.id,
      status: this.shouldFail ? "UNAVAILABLE" : "HEALTHY",
      latencyMs: 12,
      timestamp: new Date().toISOString()
    };
  }

  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    if (this.shouldFail) {
      throw new Error("Fake TTS failure");
    }
    return {
      audioBuffer: new Uint8Array([0, 1, 2, 3, 4, 5]),
      audioFormat: request.audioFormat || "pcm",
      sampleRate: request.sampleRate || 24000,
      providerId: this.metadata.id,
      modelId: "fake-kokoro-v0.19",
      latency: {
        totalDurationMs: 200,
        timeToFirstByteMs: 45
      }
    };
  }

  async *streamSynthesis(request: TTSRequest): AsyncIterable<TTSStreamChunk> {
    if (this.shouldFail) throw new Error("Fake TTS stream failure");
    yield { audioChunk: new Uint8Array([0, 1]), isFinal: false };
    yield { audioChunk: new Uint8Array([2, 3, 4, 5]), isFinal: true };
  }
}
