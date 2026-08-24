import { TTSProvider } from "../../contracts/TTSProvider.ts";
import {
  TTSRequest,
  TTSResponse,
  TTSStreamChunk,
  ProviderMetadata,
  HealthResult,
  ProviderExecutionContext,
  ProviderInvalidResponseError,
  ProviderCancelledError
} from "../../types/index.ts";
import { VoiceProfileRegistry } from "../../voice/VoiceProfileRegistry.ts";
import { executeProviderFetch } from "../utils/fetchWithTimeout.ts";

export interface SpeachesTTSConfig {
  baseUrl?: string;
  apiKey?: string;
  registry?: VoiceProfileRegistry;
}

export class SpeachesTTSProvider implements TTSProvider {
  public readonly metadata: ProviderMetadata;
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly registry: VoiceProfileRegistry;

  constructor(config: SpeachesTTSConfig = {}) {
    this.baseUrl = (config.baseUrl || "http://localhost:8000").replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.registry = config.registry || new VoiceProfileRegistry(true);

    this.metadata = {
      id: "speaches-tts-local",
      name: "Speaches Kokoro/Piper Local TTS Provider",
      type: "TTS",
      location: "LOCAL",
      version: "1.0.0",
      description: "Local TTS synthesis engine using Kokoro-82M & Piper ONNX on HP Victus"
    };
  }

  async health(context?: ProviderExecutionContext): Promise<HealthResult> {
    const start = performance.now();
    try {
      const headers: Record<string, string> = {};
      if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

      const res = await executeProviderFetch(
        `${this.baseUrl}/v1/models`,
        { method: "GET", headers },
        this.metadata.id,
        context
      );
      const data = (await res.json()) as { data?: Array<{ id?: string }> };
      const latencyMs = Math.round(performance.now() - start);

      const models: string[] = Array.isArray(data?.data)
        ? data.data.map((m) => m.id || "")
        : [];

      const ttsFound = models.some((m) => m.includes("Kokoro") || m.includes("piper") || m.includes("tts"));

      if (!ttsFound) {
        return {
          providerId: this.metadata.id,
          status: "DEGRADED",
          latencyMs,
          timestamp: new Date().toISOString(),
          details: {
            tts_available: false,
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
          tts_available: true,
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
          error: "Speaches TTS service unreachable",
          baseUrl: this.baseUrl
        }
      };
    }
  }

  async synthesize(request: TTSRequest, context?: ProviderExecutionContext): Promise<TTSResponse> {
    const start = performance.now();
    const profile = this.registry.require(request.voiceProfileId);

    const payload = {
      model: profile.modelId,
      input: request.text,
      voice: profile.nativeVoiceId,
      response_format: request.audioFormat || profile.format || "pcm",
      speed: request.speed || profile.speed || 1.0
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const res = await executeProviderFetch(
      `${this.baseUrl}/v1/audio/speech`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      },
      this.metadata.id,
      context
    );

    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await res.arrayBuffer();
    } catch {
      throw new ProviderInvalidResponseError("Falha ao decodificar áudio da resposta TTS.", this.metadata.id);
    }

    const totalDurationMs = Math.round(performance.now() - start);

    return {
      audioBuffer: new Uint8Array(arrayBuffer),
      audioFormat: (request.audioFormat || profile.format || "pcm") as "pcm" | "wav" | "mp3" | "ogg",
      sampleRate: request.sampleRate || profile.sampleRate || 24000,
      providerId: this.metadata.id,
      modelId: profile.modelId,
      latency: {
        totalDurationMs
      }
    };
  }

  async *streamSynthesis(request: TTSRequest, context?: ProviderExecutionContext): AsyncIterable<TTSStreamChunk> {
    const profile = this.registry.require(request.voiceProfileId);

    const payload = {
      model: profile.modelId,
      input: request.text,
      voice: profile.nativeVoiceId,
      response_format: request.audioFormat || profile.format || "pcm",
      speed: request.speed || profile.speed || 1.0
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const res = await executeProviderFetch(
      `${this.baseUrl}/v1/audio/speech`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      },
      this.metadata.id,
      context
    );

    if (!res.body) {
      throw new ProviderInvalidResponseError("Corpo de streaming vazio do TTS.", this.metadata.id);
    }

    const reader = res.body.getReader();

    try {
      while (true) {
        if (context?.signal?.aborted) {
          throw new ProviderCancelledError("Streaming de áudio interrompido por barge-in.", this.metadata.id);
        }

        const { value, done } = await reader.read();
        if (done) break;

        if (value && value.length > 0) {
          yield {
            audioChunk: value,
            isFinal: false
          };
        }
      }
      yield {
        audioChunk: new Uint8Array([]),
        isFinal: true
      };
    } finally {
      reader.releaseLock();
    }
  }
}
