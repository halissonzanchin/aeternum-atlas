import { TTSProvider } from "../../contracts/TTSProvider.ts";
import {
  TTSRequest,
  TTSResponse,
  TTSStreamChunk,
  AeternumAudioFormat,
  ProviderMetadata,
  HealthResult,
  ProviderExecutionContext,
  ProviderInvalidResponseError
} from "../../types/index.ts";
import { VoiceProfileRegistry } from "../../voice/VoiceProfileRegistry.ts";
import { executeProviderJson, executeProviderBinary, executeProviderFetchSession } from "../utils/fetchWithTimeout.ts";
import { buildProviderUrl } from "../utils/url.ts";

export interface SpeachesTTSConfig {
  baseUrl?: string;
  apiKey?: string;
  registry?: VoiceProfileRegistry;
}

const SUPPORTED_FORMATS = new Set<AeternumAudioFormat>(["pcm", "wav", "mp3", "flac"]);

export class SpeachesTTSProvider implements TTSProvider {
  public readonly metadata: ProviderMetadata;
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly registry: VoiceProfileRegistry;

  constructor(config: SpeachesTTSConfig = {}) {
    this.baseUrl = config.baseUrl || "http://localhost:8000";
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
    const url = buildProviderUrl(this.baseUrl, "/v1/models");
    try {
      const headers: Record<string, string> = {};
      if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

      const data = await executeProviderJson<{ data?: Array<{ id?: string }> }>(
        url,
        { method: "GET", headers },
        this.metadata.id,
        context
      );
      const latencyMs = Math.round(performance.now() - start);

      const models: string[] = Array.isArray(data?.data)
        ? data.data.map((m) => m.id || "")
        : [];

      const profiles = this.registry.listAll();
      const unavailableProfiles = profiles.filter((p) => !models.includes(p.modelId));

      if (unavailableProfiles.length > 0) {
        return {
          providerId: this.metadata.id,
          status: "DEGRADED",
          latencyMs,
          timestamp: new Date().toISOString(),
          details: {
            available_profile_count: profiles.length - unavailableProfiles.length,
            unavailable_profile_count: unavailableProfiles.length,
            unavailable_profile_ids: unavailableProfiles.map((p) => p.id).join(", ")
          }
        };
      }

      return {
        providerId: this.metadata.id,
        status: "HEALTHY",
        latencyMs,
        timestamp: new Date().toISOString(),
        details: {
          available_profile_count: profiles.length,
          unavailable_profile_count: 0
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
          target_url: url
        }
      };
    }
  }

  private validateAndBuildPayload(request: TTSRequest) {
    const profile = this.registry.require(request.voiceProfileId);
    const requestedFormat = (request.audioFormat ?? profile.format ?? "pcm").toLowerCase() as AeternumAudioFormat;

    if (!SUPPORTED_FORMATS.has(requestedFormat)) {
      throw new ProviderInvalidResponseError(
        `Formato de áudio '${requestedFormat}' não é suportado pelo Speaches TTS. Formatos suportados: pcm, wav, mp3, flac.`,
        this.metadata.id
      );
    }

    const effectiveSampleRate = request.sampleRate ?? profile.sampleRate;
    if (typeof effectiveSampleRate !== "number" || effectiveSampleRate < 8000 || effectiveSampleRate > 48000) {
      throw new ProviderInvalidResponseError(
        `Taxa de amostragem de ${effectiveSampleRate}Hz fora do limite suportado pelo Speaches (8000–48000Hz).`,
        this.metadata.id
      );
    }

    const payload = {
      model: profile.modelId,
      input: request.text,
      voice: profile.nativeVoiceId,
      response_format: requestedFormat,
      speed: request.speed ?? profile.speed ?? 1.0,
      sample_rate: effectiveSampleRate
    };

    return { profile, payload, effectiveSampleRate, requestedFormat };
  }

  async synthesize(request: TTSRequest, context?: ProviderExecutionContext): Promise<TTSResponse> {
    const start = performance.now();
    const url = buildProviderUrl(this.baseUrl, "/v1/audio/speech");
    const { profile, payload, effectiveSampleRate, requestedFormat } = this.validateAndBuildPayload(request);

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const audioBytes = await executeProviderBinary(
      url,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      },
      this.metadata.id,
      context
    );

    const totalDurationMs = Math.round(performance.now() - start);

    return {
      audioBuffer: audioBytes,
      audioFormat: requestedFormat,
      sampleRate: effectiveSampleRate,
      providerId: this.metadata.id,
      modelId: profile.modelId,
      latency: {
        totalDurationMs
      }
    };
  }

  async *streamSynthesis(request: TTSRequest, context?: ProviderExecutionContext): AsyncIterable<TTSStreamChunk> {
    const url = buildProviderUrl(this.baseUrl, "/v1/audio/speech");
    const { payload } = this.validateAndBuildPayload(request);

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const session = await executeProviderFetchSession(
      url,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      },
      this.metadata.id,
      context
    );

    const res = session.response;
    if (!res.body) {
      session.cleanup();
      throw new ProviderInvalidResponseError("Corpo de streaming vazio do TTS.", this.metadata.id);
    }

    const reader = res.body.getReader();

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

        if (readResult.value && readResult.value.length > 0) {
          yield {
            audioChunk: readResult.value,
            isFinal: false
          };
        }
      }
      yield {
        audioChunk: new Uint8Array([]),
        isFinal: true
      };
    } finally {
      session.cleanup();
      reader.releaseLock();
    }
  }
}
