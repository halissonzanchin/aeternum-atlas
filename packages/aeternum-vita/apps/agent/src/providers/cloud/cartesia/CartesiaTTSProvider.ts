import { TTSProvider } from "../../contracts/TTSProvider.ts";
import {
  TTSRequest,
  TTSResponse,
  TTSStreamChunk,
  AeternumAudioFormat,
  ProviderMetadata,
  HealthResult,
  ProviderExecutionContext,
  ProviderInvalidResponseError,
  ProviderAuthenticationError
} from "../../types/index.ts";
import { VoiceProfileRegistry } from "../../voice/VoiceProfileRegistry.ts";
import { executeProviderJson, executeProviderBinary, executeProviderFetchSession } from "../../local/utils/fetchWithTimeout.ts";

export interface CartesiaTTSConfig {
  apiKey?: string;
  modelId?: string;
  baseUrl?: string;
  apiVersion?: string;
  registry?: VoiceProfileRegistry;
}

export class CartesiaTTSProvider implements TTSProvider {
  public readonly metadata: ProviderMetadata;
  public readonly supportedSynthesizeFormats: readonly AeternumAudioFormat[] = ["pcm", "wav", "mp3"];
  public readonly supportedStreamFormats: readonly AeternumAudioFormat[] = ["pcm", "mp3", "wav"];

  private readonly apiKey?: string;
  private readonly modelId: string;
  private readonly baseUrl: string;
  private readonly apiVersion: string;
  private readonly registry: VoiceProfileRegistry;

  constructor(config: CartesiaTTSConfig = {}) {
    this.apiKey = config.apiKey || (typeof process !== "undefined" ? process.env?.CARTESIA_API_KEY : undefined);
    this.modelId = config.modelId || (typeof process !== "undefined" ? process.env?.CARTESIA_MODEL : undefined) || "sonic-multilingual";
    this.baseUrl = config.baseUrl || "https://api.cartesia.ai";
    this.apiVersion = config.apiVersion || "2024-06-10";
    this.registry = config.registry || new VoiceProfileRegistry(true);

    this.metadata = {
      id: "cartesia-tts-cloud",
      name: "Cartesia Sonic Cloud TTS Provider",
      type: "TTS",
      location: "CLOUD",
      version: "1.0.0",
      description: "Cloud TTS adapter for Cartesia Sonic API with decoupled voice mappings and zero audio-cost health checks"
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
          error: "CARTESIA_API_KEY not configured"
        }
      };
    }

    const url = `${this.baseUrl}/voices`;
    try {
      await executeProviderJson<any[]>(
        url,
        {
          method: "GET",
          headers: {
            "X-API-Key": this.apiKey,
            "Cartesia-Version": this.apiVersion
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
          service_available: true
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
          error: "Cartesia API unreachable"
        }
      };
    }
  }

  private validateAndBuildPayload(request: TTSRequest) {
    const target = this.registry.resolveTarget(request.voiceProfileId, "cartesia");
    const requestedFormat = (request.audioFormat ?? target.format ?? "pcm").toLowerCase() as AeternumAudioFormat;

    if (!this.supportedSynthesizeFormats.includes(requestedFormat)) {
      throw new ProviderInvalidResponseError(
        `Formato de áudio '${requestedFormat}' não é suportado pelo Cartesia TTS. Formatos suportados: ${this.supportedSynthesizeFormats.join(", ")}.`,
        this.metadata.id
      );
    }

    const effectiveSampleRate = request.sampleRate ?? target.sampleRate;
    if (
      typeof effectiveSampleRate !== "number" ||
      isNaN(effectiveSampleRate) ||
      !Number.isFinite(effectiveSampleRate) ||
      !Number.isInteger(effectiveSampleRate) ||
      effectiveSampleRate < 8000 ||
      effectiveSampleRate > 48000
    ) {
      throw new ProviderInvalidResponseError(
        `Taxa de amostragem de ${effectiveSampleRate}Hz fora do limite suportado pelo Cartesia (8000–48000Hz).`,
        this.metadata.id
      );
    }

    const container = requestedFormat === "pcm" ? "raw" : requestedFormat;
    const encoding = requestedFormat === "pcm" ? "pcm_s16le" : undefined;

    const payload = {
      model_id: target.modelId || this.modelId,
      transcript: request.text,
      voice: {
        mode: "id",
        id: target.nativeVoiceId
      },
      output_format: {
        container,
        ...(encoding ? { encoding } : {}),
        sample_rate: effectiveSampleRate
      },
      language: request.language ? request.language.split("-")[0] : "pt"
    };

    return { target, payload, effectiveSampleRate, requestedFormat };
  }

  async synthesize(request: TTSRequest, context?: ProviderExecutionContext): Promise<TTSResponse> {
    if (!this.apiKey) {
      throw new ProviderAuthenticationError("CARTESIA_API_KEY não configurada.", this.metadata.id);
    }

    const start = performance.now();
    const url = `${this.baseUrl}/tts/bytes`;
    const { target, payload, effectiveSampleRate, requestedFormat } = this.validateAndBuildPayload(request);

    const audioBytes = await executeProviderBinary(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
          "Cartesia-Version": this.apiVersion
        },
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
      modelId: target.modelId || this.modelId,
      latency: {
        totalDurationMs
      }
    };
  }

  async *streamSynthesis(request: TTSRequest, context?: ProviderExecutionContext): AsyncIterable<TTSStreamChunk> {
    if (!this.apiKey) {
      throw new ProviderAuthenticationError("CARTESIA_API_KEY não configurada.", this.metadata.id);
    }

    const url = `${this.baseUrl}/tts/bytes`;
    const { payload } = this.validateAndBuildPayload(request);

    const session = await executeProviderFetchSession(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
          "Cartesia-Version": this.apiVersion
        },
        body: JSON.stringify(payload)
      },
      this.metadata.id,
      context
    );

    const res = session.response;
    if (!res.body) {
      session.cleanup();
      throw new ProviderInvalidResponseError("Corpo de streaming vazio do Cartesia TTS.", this.metadata.id);
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
