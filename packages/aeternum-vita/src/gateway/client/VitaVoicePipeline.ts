import crypto from "node:crypto";
import { VitaGatewayClient } from "./VitaGatewayClient.ts";
import {
  LLMMessage,
  LLMRequest,
  LLMResponse,
  STTRequest,
  STTResponse,
  TTSRequest,
  TTSResponse,
  ProviderExecutionContext,
  ProviderCancelledError
} from "../../providers/types/index.ts";

export type VitaTutorId = "eduardo" | "antonia" | "ariana" | "fabian";

export interface VitaTutorPersona {
  id: VitaTutorId;
  name: string;
  languageCode: "pt" | "es" | "en" | "de";
  voiceProfileId: string;
  instructions: string;
  greeting: string;
}

export const VITA_TUTOR_PERSONAS: Record<VitaTutorId, VitaTutorPersona> = {
  eduardo: {
    id: "eduardo",
    name: "Eduardo",
    languageCode: "pt",
    voiceProfileId: "pt-br-warm-male-01",
    instructions: "Você é Eduardo, tutor sênior de anatomia da Aeternum Vita. Fale exclusivamente em português do Brasil com rigor acadêmico FCAT/IFAA e empatia.",
    greeting: "Olá! Eu sou o Eduardo, seu tutor de anatomia em português. Qual tema você quer estudar hoje?"
  },
  antonia: {
    id: "antonia",
    name: "Antonia",
    languageCode: "es",
    voiceProfileId: "es-calm-female-01",
    instructions: "Eres Antonia, tutora de anatomía de Aeternum Vita. Habla exclusivamente en español con rigor académico y empatía.",
    greeting: "¡Hola! Soy Antonia, tu tutora de anatomía en español. ¿Qué tema quieres estudiar hoy?"
  },
  ariana: {
    id: "ariana",
    name: "Ariana",
    languageCode: "en",
    voiceProfileId: "en-calm-female-01",
    instructions: "You are Ariana, anatomy tutor at Aeternum Vita. Speak exclusively in natural English with academic precision and empathy.",
    greeting: "Hello! I am Ariana, your anatomy tutor in English. What would you like to study today?"
  },
  fabian: {
    id: "fabian",
    name: "Fabian",
    languageCode: "de",
    voiceProfileId: "de-warm-male-01",
    instructions: "Du bist Fabian, der Anatomietutor von Aeternum Vita. Sprich ausschließlich natürliches Hochdeutsch mit akademischer Präzision.",
    greeting: "Hallo! Ich bin Fabian, dein Anatomietutor auf Deutsch. Was möchtest du heute lernen?"
  }
};

export interface VoiceTurnInput {
  audioBuffer: Uint8Array;
  tutorId?: VitaTutorId;
  conversationHistory?: LLMMessage[];
  knowledgeContext?: string;
  audioFormat?: "pcm" | "wav" | "mp3" | "flac";
  sampleRate?: number;
}

export interface VoiceTurnLatencyMetrics {
  sttDurationMs: number;
  llmDurationMs: number;
  ttsDurationMs: number;
  totalTurnDurationMs: number;
  llmTTFTMs?: number;
  ttsTTFAMs?: number;
}

export interface VoiceTurnResult {
  turnId: string;
  tutorId: VitaTutorId;
  transcript: string;
  replyText: string;
  audioBuffer: Uint8Array;
  audioFormat: string;
  sampleRate: number;
  metrics: VoiceTurnLatencyMetrics;
  sttResponse: STTResponse;
  llmResponse: LLMResponse;
  ttsResponse: TTSResponse;
}

export class VitaVoicePipeline {
  private readonly gatewayClient: VitaGatewayClient;

  constructor(gatewayClient?: VitaGatewayClient) {
    this.gatewayClient = gatewayClient || new VitaGatewayClient();
  }

  public getPersona(tutorId: VitaTutorId = "eduardo"): VitaTutorPersona {
    return VITA_TUTOR_PERSONAS[tutorId] || VITA_TUTOR_PERSONAS.eduardo;
  }

  /**
   * Executa um turno vocal completo de ponta a ponta através do Aeternum AI Gateway:
   * USER SPEECH -> STT via Gateway -> Conversational Brain -> LLM via Gateway -> TTS via Gateway -> AUDIO
   */
  async executeVoiceTurn(
    input: VoiceTurnInput,
    context?: ProviderExecutionContext
  ): Promise<VoiceTurnResult> {
    const turnStart = performance.now();
    const turnId = context?.requestId || `turn-${crypto.randomUUID()}`;
    const persona = this.getPersona(input.tutorId);

    if (context?.signal?.aborted) {
      throw new ProviderCancelledError("Turno vocal cancelado antes de iniciar.", "vita-pipeline");
    }

    // 1. STT via Gateway
    const sttStart = performance.now();
    const sttContext: ProviderExecutionContext = {
      requestId: `${turnId}-stt`,
      timeoutMs: 15000,
      signal: context?.signal
    };

    const sttResponse = await this.gatewayClient.transcribe(
      {
        audioBuffer: input.audioBuffer,
        language: persona.languageCode,
        audioFormat: input.audioFormat || "wav",
        sampleRate: input.sampleRate || 16000
      },
      sttContext
    );
    const sttDurationMs = Math.round(performance.now() - sttStart);

    if (context?.signal?.aborted) {
      throw new ProviderCancelledError("Turno vocal cancelado após STT.", "vita-pipeline");
    }

    // 2. Montagem de Contexto Conversacional & RAG
    const messages: LLMMessage[] = [];
    if (input.conversationHistory && input.conversationHistory.length > 0) {
      messages.push(...input.conversationHistory);
    }
    messages.push({
      role: "user",
      content: sttResponse.text
    });

    let systemInstruction = persona.instructions;
    if (input.knowledgeContext) {
      systemInstruction += `\n\n[CONTEXTO BIBLIOGRÁFICO DE ANATOMIA]:\n${input.knowledgeContext}`;
    }

    // 3. LLM via Gateway
    const llmStart = performance.now();
    const llmContext: ProviderExecutionContext = {
      requestId: `${turnId}-llm`,
      timeoutMs: 30000,
      signal: context?.signal
    };

    const llmResponse = await this.gatewayClient.generate(
      {
        messages,
        systemInstruction,
        temperature: 0.3,
        maxTokens: 128
      },
      llmContext
    );
    const llmDurationMs = Math.round(performance.now() - llmStart);

    if (context?.signal?.aborted) {
      throw new ProviderCancelledError("Turno vocal cancelado após LLM.", "vita-pipeline");
    }

    // 4. TTS via Gateway
    const ttsStart = performance.now();
    const ttsContext: ProviderExecutionContext = {
      requestId: `${turnId}-tts`,
      timeoutMs: 15000,
      signal: context?.signal
    };

    const ttsResponse = await this.gatewayClient.synthesize(
      {
        text: llmResponse.text,
        voiceProfileId: persona.voiceProfileId,
        language: persona.languageCode,
        audioFormat: "wav",
        sampleRate: 24000
      },
      ttsContext
    );
    const ttsDurationMs = Math.round(performance.now() - ttsStart);
    const totalTurnDurationMs = Math.round(performance.now() - turnStart);

    return {
      turnId,
      tutorId: persona.id,
      transcript: sttResponse.text,
      replyText: llmResponse.text,
      audioBuffer: ttsResponse.audioBuffer,
      audioFormat: ttsResponse.audioFormat,
      sampleRate: ttsResponse.sampleRate,
      metrics: {
        sttDurationMs,
        llmDurationMs,
        ttsDurationMs,
        totalTurnDurationMs
      },
      sttResponse,
      llmResponse,
      ttsResponse
    };
  }

  /**
   * Executa um turno vocal com medição de TTFT (Time-To-First-Token) e TTFA (Time-To-First-Audio)
   */
  async executeStreamedVoiceTurn(
    input: VoiceTurnInput,
    context?: ProviderExecutionContext
  ): Promise<VoiceTurnResult> {
    const turnStart = performance.now();
    const turnId = context?.requestId || `turn-stream-${crypto.randomUUID()}`;
    const persona = this.getPersona(input.tutorId);

    // 1. STT
    const sttStart = performance.now();
    const sttContext: ProviderExecutionContext = {
      requestId: `${turnId}-stt`,
      timeoutMs: 15000,
      signal: context?.signal
    };

    const sttResponse = await this.gatewayClient.transcribe(
      {
        audioBuffer: input.audioBuffer,
        language: persona.languageCode,
        audioFormat: input.audioFormat || "wav",
        sampleRate: input.sampleRate || 16000
      },
      sttContext
    );
    const sttDurationMs = Math.round(performance.now() - sttStart);

    // 2. LLM Streamed
    const llmStart = performance.now();
    let llmTTFTMs: number | undefined;
    let fullText = "";

    const llmContext: ProviderExecutionContext = {
      requestId: `${turnId}-llm`,
      timeoutMs: 30000,
      signal: context?.signal
    };

    const stream = this.gatewayClient.streamGenerate(
      {
        messages: [{ role: "user", content: sttResponse.text }],
        systemInstruction: persona.instructions,
        temperature: 0.3,
        maxTokens: 128
      },
      llmContext
    );

    for await (const chunk of stream) {
      if (llmTTFTMs === undefined && chunk.deltaText) {
        llmTTFTMs = Math.round(performance.now() - llmStart);
      }
      fullText += chunk.deltaText;
    }
    const llmDurationMs = Math.round(performance.now() - llmStart);

    // 3. TTS Streamed
    const ttsStart = performance.now();
    let ttsTTFAMs: number | undefined;
    const audioChunks: Uint8Array[] = [];

    const ttsContext: ProviderExecutionContext = {
      requestId: `${turnId}-tts`,
      timeoutMs: 15000,
      signal: context?.signal
    };

    const ttsStream = this.gatewayClient.streamSynthesis(
      {
        text: fullText,
        voiceProfileId: persona.voiceProfileId,
        language: persona.languageCode,
        audioFormat: "pcm",
        sampleRate: 24000
      },
      ttsContext
    );

    for await (const chunk of ttsStream) {
      if (ttsTTFAMs === undefined && chunk.audioChunk.length > 0) {
        ttsTTFAMs = Math.round(performance.now() - ttsStart);
      }
      if (chunk.audioChunk.length > 0) {
        audioChunks.push(chunk.audioChunk);
      }
    }
    const ttsDurationMs = Math.round(performance.now() - ttsStart);
    const totalTurnDurationMs = Math.round(performance.now() - turnStart);

    const mergedLength = audioChunks.reduce((acc, c) => acc + c.length, 0);
    const mergedAudio = new Uint8Array(mergedLength);
    let offset = 0;
    for (const c of audioChunks) {
      mergedAudio.set(c, offset);
      offset += c.length;
    }

    return {
      turnId,
      tutorId: persona.id,
      transcript: sttResponse.text,
      replyText: fullText,
      audioBuffer: mergedAudio,
      audioFormat: "pcm",
      sampleRate: 24000,
      metrics: {
        sttDurationMs,
        llmDurationMs,
        ttsDurationMs,
        totalTurnDurationMs,
        llmTTFTMs: llmTTFTMs || llmDurationMs,
        ttsTTFAMs: ttsTTFAMs || ttsDurationMs
      },
      sttResponse,
      llmResponse: {
        text: fullText,
        modelId: "streamed",
        providerId: "gateway",
        finishReason: "stop"
      },
      ttsResponse: {
        audioBuffer: mergedAudio,
        audioFormat: "pcm",
        sampleRate: 24000,
        providerId: "gateway",
        modelId: "streamed"
      }
    };
  }
}
