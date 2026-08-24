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

export interface SpeachesSTTConfig {
  baseUrl?: string;
  modelId?: string;
  apiKey?: string;
}

export class SpeachesSTTProvider implements STTProvider {
  public readonly metadata: ProviderMetadata;
  private readonly baseUrl: string;
  private readonly modelId: string;
  private readonly apiKey?: string;

  constructor(config: SpeachesSTTConfig = {}) {
    this.baseUrl = (config.baseUrl || "http://localhost:8000").replace(/\/+$/, "");
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

      const modelFound = models.some(
        (m) => m === this.modelId || m.includes(this.modelId) || m.toLowerCase().includes("whisper")
      );

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
          baseUrl: this.baseUrl
        }
      };
    }
  }

  async transcribe(request: STTRequest, context?: ProviderExecutionContext): Promise<STTResponse> {
    const start = performance.now();

    const formData = new FormData();
    const blob = new Blob([request.audioBuffer], {
      type: request.audioFormat === "wav" ? "audio/wav" : "audio/pcm"
    });
    formData.append("file", blob, "audio.wav");
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
      `${this.baseUrl}/v1/audio/transcriptions`,
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
      confidence: typeof data.confidence === "number" ? data.confidence : 0.95,
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
