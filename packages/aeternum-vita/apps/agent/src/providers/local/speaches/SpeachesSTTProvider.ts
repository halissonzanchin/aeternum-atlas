import { STTProvider } from "../../contracts/STTProvider.ts";
import {
  STTRequest,
  STTResponse,
  STTStreamChunk,
  AeternumAudioFormat,
  ProviderMetadata,
  HealthResult,
  ProviderExecutionContext,
  ProviderInvalidResponseError
} from "../../types/index.ts";
import {
  executeProviderJson,
  executeProviderFetchSession,
  createExecutionCoordinator,
  nextWithExecutionCoordinator
} from "../utils/fetchWithTimeout.ts";
import { buildProviderUrl } from "../utils/url.ts";
import { pcmToWav } from "../utils/audio.ts";

export interface SpeachesBackendCapabilities {
  batch_transcription: boolean;
  streamed_transcription_output: boolean;
  realtime_websocket: boolean;
}

export interface SpeachesAdapterCapabilities {
  batch_transcription: boolean;
  streamed_transcription_output: boolean;
  live_audio_input: boolean;
  realtime_websocket: boolean;
}

export interface SpeachesSTTConfig {
  baseUrl?: string;
  modelId?: string;
  apiKey?: string;
}

export class SpeachesSTTProvider implements STTProvider {
  public readonly metadata: ProviderMetadata;

  public readonly backendCapabilities: SpeachesBackendCapabilities = {
    batch_transcription: true,
    streamed_transcription_output: true,
    realtime_websocket: true
  };

  public readonly adapterCapabilities: SpeachesAdapterCapabilities = {
    batch_transcription: true,
    streamed_transcription_output: true,
    live_audio_input: false, // PLANNED / NOT IMPLEMENTED (future realtime voice layer)
    realtime_websocket: false // PLANNED / NOT IMPLEMENTED
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

  private validatePcmSampleRate(sampleRate?: number): number {
    if (
      sampleRate === undefined ||
      sampleRate === null ||
      typeof sampleRate !== "number" ||
      isNaN(sampleRate) ||
      !Number.isFinite(sampleRate) ||
      !Number.isInteger(sampleRate) ||
      sampleRate < 8000 ||
      sampleRate > 48000
    ) {
      throw new ProviderInvalidResponseError(
        `Para formato 'pcm', o campo 'sampleRate' é obrigatório e deve ser um número inteiro entre 8000 e 48000 Hz. Recebido: ${sampleRate}`,
        this.metadata.id
      );
    }
    return sampleRate;
  }

  private buildAudioPayload(request: STTRequest, stream = false): FormData {
    const format = (request.audioFormat || "wav").toLowerCase() as AeternumAudioFormat;
    let audioBytes = request.audioBuffer;
    let mimeType = "audio/wav";
    let fileName = "audio.wav";

    switch (format) {
      case "pcm":
        this.validatePcmSampleRate(request.sampleRate);
        audioBytes = pcmToWav(request.audioBuffer, request.sampleRate, 1, 16);
        mimeType = "audio/wav";
        fileName = "audio.wav";
        break;
      case "wav":
        mimeType = "audio/wav";
        fileName = "audio.wav";
        break;
      case "mp3":
        mimeType = "audio/mpeg";
        fileName = "audio.mp3";
        break;
      case "flac":
        mimeType = "audio/flac";
        fileName = "audio.flac";
        break;
      case "ogg":
        mimeType = "audio/ogg";
        fileName = "audio.ogg";
        break;
      case "webm":
        mimeType = "audio/webm";
        fileName = "audio.webm";
        break;
      default:
        throw new ProviderInvalidResponseError(
          `Formato de áudio '${format}' não suportado para transcrição STT. Formatos suportados: pcm, wav, mp3, flac, ogg, webm.`,
          this.metadata.id
        );
    }

    const formData = new FormData();
    const blob = new Blob([audioBytes], { type: mimeType });
    formData.append("file", blob, fileName);
    formData.append("model", this.modelId);

    if (stream) {
      formData.append("stream", "true");
    }
    if (request.language) {
      formData.append("language", request.language.split("-")[0]);
    }
    if (request.medicalContextHints && request.medicalContextHints.length > 0) {
      formData.append("prompt", request.medicalContextHints.join(", "));
    }

    return formData;
  }

  async transcribe(request: STTRequest, context?: ProviderExecutionContext): Promise<STTResponse> {
    const start = performance.now();
    const url = buildProviderUrl(this.baseUrl, "/v1/audio/transcriptions");
    const formData = this.buildAudioPayload(request, false);

    const headers: Record<string, string> = {};
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const data = await executeProviderJson<any>(
      url,
      {
        method: "POST",
        headers,
        body: formData
      },
      this.metadata.id,
      context
    );

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
    const coordinator = createExecutionCoordinator(this.metadata.id, context);
    const chunks: Uint8Array[] = [];
    const iterator = audioStream[Symbol.asyncIterator]();

    try {
      while (true) {
        const { value, done } = await nextWithExecutionCoordinator(iterator, coordinator);
        if (done) break;
        if (value && value.length > 0) {
          chunks.push(value);
        }
      }
    } catch (err) {
      coordinator.cleanup();
      throw coordinator.handleError(err);
    }

    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }

    const url = buildProviderUrl(this.baseUrl, "/v1/audio/transcriptions");
    const formData = this.buildAudioPayload({ ...options, audioBuffer: merged }, true);

    const headers: Record<string, string> = {};
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    let session;
    try {
      session = await executeProviderFetchSession(
        url,
        {
          method: "POST",
          headers,
          body: formData
        },
        this.metadata.id,
        context,
        coordinator
      );
    } catch (err) {
      coordinator.cleanup();
      throw err;
    }

    const res = session.response;
    if (!res.body) {
      session.cleanup();
      coordinator.cleanup();
      throw new ProviderInvalidResponseError("Stream body vazio no Speaches STT.", this.metadata.id);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let finalEmitted = false;

    try {
      while (true) {
        session.checkAborted();

        let readResult = { done: false, value: undefined as Uint8Array | undefined };
        try {
          readResult = await reader.read();
        } catch (err) {
          session.handleStreamReadError(err);
        }

        if (readResult.done) {
          if (!finalEmitted) {
            yield { partialText: "", isFinal: true };
            finalEmitted = true;
          }
          return;
        }

        buffer += decoder.decode(readResult.value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;
          if (trimmed === "data: [DONE]") {
            if (!finalEmitted) {
              yield { partialText: "", isFinal: true };
              finalEmitted = true;
            }
            return;
          }
          if (trimmed.startsWith("data: ")) {
            const jsonStr = trimmed.slice(6);
            let parsed: any;
            try {
              parsed = JSON.parse(jsonStr);
            } catch {
              throw new ProviderInvalidResponseError(
                `Chunk SSE inválido ou corrompido no Speaches STT: ${jsonStr.slice(0, 50)}`,
                this.metadata.id
              );
            }
            if (parsed?.text) {
              yield { partialText: parsed.text, isFinal: false };
            }
          }
        }
      }
    } finally {
      session.cleanup();
      coordinator.cleanup();
      reader.releaseLock();
    }
  }
}
