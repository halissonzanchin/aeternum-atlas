import { STTProvider } from "../../contracts/STTProvider.ts";
import {
  STTRequest,
  STTResponse,
  STTStreamChunk,
  ProviderMetadata,
  HealthResult,
  ProviderExecutionContext,
  ProviderInvalidResponseError,
  ProviderCancelledError
} from "../../types/index.ts";
import { executeProviderFetch } from "../utils/fetchWithTimeout.ts";
import { buildProviderUrl } from "../utils/url.ts";

export interface STTCapabilities {
  batch_transcription: boolean;
  streamed_transcription_output: boolean;
  live_audio_input: boolean;
  websocket_realtime: boolean;
}

export interface SpeachesSTTConfig {
  baseUrl?: string;
  modelId?: string;
  apiKey?: string;
}

export class SpeachesSTTProvider implements STTProvider {
  public readonly metadata: ProviderMetadata;
  public readonly capabilities: STTCapabilities = {
    batch_transcription: true,
    streamed_transcription_output: false,
    live_audio_input: false,
    websocket_realtime: false
  };

  private readonly baseUrl: string;
  private readonly modelId: string;
  private readonly apiKey?: string;

  constructor(config: SpeachesSTTConfig = {}) {
    this.baseUrl = config.baseUrl || "http://localhost:8000";
    this.modelId = config.modelId || "Systran/faster-whisper-small";
    this.apiKey = config.apiKey;

    this.metadata = {
      id: "speaches-stt-local",
      name: "Speaches Faster-Whisper Local STT Provider",
      type: "STT",
      location: "LOCAL",
      version: "1.0.0",
      description: "Local STT engine using Faster-Whisper on HP Victus via Speaches OpenAI-compatible API"
    };
  }

  async health(context?: ProviderExecutionContext): Promise<HealthResult> {
    const start = performance.now();
    const url = buildProviderUrl(this.baseUrl, "/v1/models");
    try {
      const headers: Record<string, string> = {};
      if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

      const res = await executeProviderFetch(url, { method: "GET", headers }, this.metadata.id, context);
      const data = (await res.json()) as { data?: Array<{ id?: string }> };
      const latencyMs = Math.round(performance.now() - start);

      const models: string[] = Array.isArray(data?.data)
        ? data.data.map((m) => m.id || "")
        : [];

      const modelFound = models.some((m) => m === this.modelId);

      if (!modelFound) {
        return {
          providerId: this.metadata.id,
          status: "DEGRADED",
          latencyMs,
          timestamp: new Date().toISOString(),
          details: {
            configured_model: this.modelId,
            model_available: false,
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
          configured_model: this.modelId,
          model_available: true,
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
          error: "Speaches STT service unreachable",
          target_url: url
        }
      };
    }
  }

  async transcribe(request: STTRequest, context?: ProviderExecutionContext): Promise<STTResponse> {
    const start = performance.now();
    const url = buildProviderUrl(this.baseUrl, "/v1/audio/transcriptions");

    const format = request.audioFormat || "wav";
    let mimeType = "audio/wav";
    let fileName = "audio.wav";

    if (format === "webm") {
      mimeType = "audio/webm";
      fileName = "audio.webm";
    } else if (format === "ogg") {
      mimeType = "audio/ogg";
      fileName = "audio.ogg";
    } else if (format === "pcm") {
      mimeType = "application/octet-stream";
      fileName = "audio.pcm";
    }

    const formData = new FormData();
    const blob = new Blob([request.audioBuffer], { type: mimeType });
    formData.append("file", blob, fileName);
    formData.append("model", this.modelId);

    if (request.language) {
      formData.append("language", request.language.split("-")[0]);
    }
    if (request.medicalContextHints && request.medicalContextHints.length > 0) {
      formData.append("prompt", request.medicalContextHints.join(", "));
    }

    const headers: Record<string, string> = {};
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const res = await executeProviderFetch(
      url,
      {
        method: "POST",
        headers,
        body: formData
      },
      this.metadata.id,
      context
    );

    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new ProviderInvalidResponseError("Resposta JSON inválida do Speaches STT.", this.metadata.id);
    }

    if (typeof data?.text !== "string") {
      throw new ProviderInvalidResponseError("Campo 'text' ausente na resposta de transcrição.", this.metadata.id);
    }

    const totalDurationMs = Math.round(performance.now() - start);

    return {
      text: data.text.trim(),
      languageDetected: data.language || request.language,
      confidence: typeof data.confidence === "number" ? data.confidence : undefined,
      providerId: this.metadata.id,
      modelId: this.modelId,
      latency: {
        totalDurationMs
      }
    };
  }

  async *streamTranscription(
    audioStream: AsyncIterable<Uint8Array>,
    options: Omit<STTRequest, "audioBuffer">,
    context?: ProviderExecutionContext
  ): AsyncIterable<STTStreamChunk> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of audioStream) {
      if (context?.signal?.aborted) {
        throw new ProviderCancelledError("Stream de transcrição cancelado.", this.metadata.id);
      }
      chunks.push(chunk);
    }

    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }

    const result = await this.transcribe({ ...options, audioBuffer: merged }, context);
    yield {
      partialText: result.text,
      isFinal: true
    };
  }
}
