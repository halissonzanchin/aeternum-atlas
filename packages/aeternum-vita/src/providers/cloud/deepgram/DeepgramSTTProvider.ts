import { STTProvider } from "../../contracts/STTProvider.ts";
import {
  STTRequest,
  STTResponse,
  STTStreamChunk,
  ProviderMetadata,
  HealthResult,
  ProviderExecutionContext,
  ProviderInvalidResponseError,
  ProviderAuthenticationError,
  AeternumAudioFormat
} from "../../types/index.ts";
import { executeProviderJson } from "../../local/utils/fetchWithTimeout.ts";
import { pcmToWav } from "../../local/utils/audio.ts";

export interface DeepgramSTTConfig {
  apiKey?: string;
  modelId?: string;
  baseUrl?: string;
  apiVersion?: string;
}

export class DeepgramSTTProvider implements STTProvider {
  public readonly metadata: ProviderMetadata;
  public readonly capabilities = {
    batch_transcription: true,
    realtime_streaming: false,
    streamed_transcription_output: false,
    smart_format: true,
    medical_keyterms: true
  };

  private readonly apiKey?: string;
  private readonly modelId: string;
  private readonly baseUrl: string;
  private readonly apiVersion: string;

  constructor(config: DeepgramSTTConfig = {}) {
    this.apiKey = config.apiKey !== undefined ? config.apiKey : (typeof process !== "undefined" ? process.env?.DEEPGRAM_API_KEY : undefined);
    this.modelId = config.modelId !== undefined ? config.modelId : ((typeof process !== "undefined" ? process.env?.DEEPGRAM_MODEL : undefined) || "nova-3");
    this.baseUrl = config.baseUrl !== undefined ? config.baseUrl : "https://api.deepgram.com";
    this.apiVersion = config.apiVersion !== undefined ? config.apiVersion : "v1";

    this.metadata = {
      id: "deepgram-stt-cloud",
      name: "Deepgram Cloud STT Provider",
      type: "STT",
      location: "CLOUD",
      version: "1.0.0",
      description: "Cloud STT adapter for Deepgram Nova-3 API with medical keyterm hints and zero audio-cost health checks"
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
          error: "DEEPGRAM_API_KEY not configured"
        }
      };
    }

    const url = `${this.baseUrl}/${this.apiVersion}/projects`;
    try {
      await executeProviderJson<{ projects?: any[] }>(
        url,
        {
          method: "GET",
          headers: {
            "Authorization": `Token ${this.apiKey}`
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
          error: "Deepgram API unreachable"
        }
      };
    }
  }

  private resolveAudioBytesAndMime(request: STTRequest): { buffer: Uint8Array; mimeType: string } {
    const format = (request.audioFormat || "wav").toLowerCase() as AeternumAudioFormat;
    let buffer = request.audioBuffer;
    let mimeType = "audio/wav";

    switch (format) {
      case "pcm":
        if (
          request.sampleRate === undefined ||
          request.sampleRate === null ||
          typeof request.sampleRate !== "number" ||
          isNaN(request.sampleRate) ||
          !Number.isFinite(request.sampleRate) ||
          !Number.isInteger(request.sampleRate) ||
          request.sampleRate < 8000 ||
          request.sampleRate > 48000
        ) {
          throw new ProviderInvalidResponseError(
            `Para áudio no formato 'pcm', o campo 'sampleRate' é obrigatório e deve ser um número inteiro entre 8000 e 48000 Hz. Recebido: ${request.sampleRate}`,
            this.metadata.id
          );
        }
        buffer = pcmToWav(request.audioBuffer, request.sampleRate, 1, 16);
        mimeType = "audio/wav";
        break;
      case "wav":
        mimeType = "audio/wav";
        break;
      case "mp3":
        mimeType = "audio/mpeg";
        break;
      case "flac":
        mimeType = "audio/flac";
        break;
      case "ogg":
        mimeType = "audio/ogg";
        break;
      case "webm":
        mimeType = "audio/webm";
        break;
      default:
        throw new ProviderInvalidResponseError(
          `Formato de áudio '${format}' não suportado pelo Deepgram STT.`,
          this.metadata.id
        );
    }

    return { buffer, mimeType };
  }

  private buildUrl(request: Omit<STTRequest, "audioBuffer">): string {
    const params = new URLSearchParams();
    params.set("model", this.modelId);
    params.set("smart_format", "true");
    if (request.language) {
      params.set("language", request.language.split("-")[0]);
    }
    // Keyterm is Nova-3 specific; non-Nova-3 models must NOT use keyterm
    if (request.medicalContextHints && request.medicalContextHints.length > 0) {
      if (this.modelId.includes("nova-3") || this.modelId.includes("nova-3-")) {
        for (const hint of request.medicalContextHints) {
          if (hint.trim()) params.append("keyterm", hint.trim());
        }
      }
    }
    return `${this.baseUrl}/${this.apiVersion}/listen?${params.toString()}`;
  }

  async transcribe(request: STTRequest, context?: ProviderExecutionContext): Promise<STTResponse> {
    if (!this.apiKey) {
      throw new ProviderAuthenticationError("DEEPGRAM_API_KEY não configurada.", this.metadata.id);
    }

    const start = performance.now();
    const url = this.buildUrl(request);
    const { buffer, mimeType } = this.resolveAudioBytesAndMime(request);

    const data = await executeProviderJson<any>(
      url,
      {
        method: "POST",
        headers: {
          "Authorization": `Token ${this.apiKey}`,
          "Content-Type": mimeType
        },
        body: buffer as any
      },
      this.metadata.id,
      context
    );

    const channel = data?.results?.channels?.[0];
    const alternative = channel?.alternatives?.[0];

    if (!alternative || typeof alternative.transcript !== "string") {
      throw new ProviderInvalidResponseError("Resposta estrutural inválida do Deepgram: transcrição ausente.", this.metadata.id);
    }

    const totalDurationMs = Math.round(performance.now() - start);

    const timestamps = Array.isArray(alternative.words)
      ? alternative.words.map((w: any) => ({
          word: w.word || "",
          startMs: Math.round((w.start || 0) * 1000),
          endMs: Math.round((w.end || 0) * 1000),
          confidence: typeof w.confidence === "number" ? w.confidence : undefined
        }))
      : undefined;

    return {
      text: alternative.transcript.trim(),
      confidence: typeof alternative.confidence === "number" ? alternative.confidence : undefined,
      languageDetected: data?.results?.channels?.[0]?.detected_language || request.language,
      timestamps,
      providerId: this.metadata.id,
      modelId: this.modelId,
      latency: {
        totalDurationMs
      }
    };
  }

  async *streamTranscription(
    _audioStream: AsyncIterable<Uint8Array>,
    _options: Omit<STTRequest, "audioBuffer">,
    _context?: ProviderExecutionContext
  ): AsyncIterable<STTStreamChunk> {
    // Fail-fast with explicit unsupported capability error (capabilities.realtime_streaming = false)
    throw new ProviderInvalidResponseError(
      "Deepgram realtime streaming via WebSocket não é suportado neste adapter REST (capabilities.realtime_streaming=false). Utilize transcribe() para processamento batch.",
      this.metadata.id
    );
  }
}
