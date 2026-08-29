import type { TutorId } from "./agent.ts";

export type VitaAIBackendMode = "gateway" | "legacy_direct";

export interface VoiceRuntimeConfig {
  backendMode: VitaAIBackendMode;
  llmBaseUrl: string;
  llmModel: string;
  llmTemperature: number;
  speechBaseUrl: string;
  speechApiKey: string;
  sttModel: string;
  defaultTtsModel: string;
  germanTtsModel: string;
  ttsSpeed: number;
  tutorVoices: Record<TutorId, string>;
  ragUrl?: string;
  ragApiKey?: string;
  ragTimeoutMs: number;
}

const requiredValue = (
  value: string | undefined,
  fallback: string,
  key: string,
): string => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed;
};

const numberValue = (
  value: string | undefined,
  fallback: number,
  key: string,
  min: number,
  max: number,
): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < min || parsed > max) {
    throw new Error(
      `${key} deve ser um número entre ${min} e ${max}. Recebido: ${value}`,
    );
  }

  return parsed;
};

const httpUrl = (value: string, key: string): string => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${key} deve usar HTTP ou HTTPS. Recebido: ${value}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${key} deve usar HTTP ou HTTPS. Recebido: ${value}`);
  }

  const resolved = parsed.toString();
  if (resolved.endsWith("/")) {
    return resolved.slice(0, -1);
  }
  return resolved;
};

export const loadVoiceRuntimeConfig = (
  environment: NodeJS.ProcessEnv = process.env,
): VoiceRuntimeConfig => {
  const rawBackend = environment.VITA_AI_BACKEND?.trim().toLowerCase();
  const backendMode: VitaAIBackendMode =
    rawBackend === "legacy_direct" ? "legacy_direct" : "gateway";

  const ragUrl = environment.VITA_RAG_URL?.trim();

  let llmBaseUrl: string;
  let speechBaseUrl: string;
  let speechApiKey: string;

  if (backendMode === "gateway") {
    const rawGatewayUrl =
      environment.AETERNUM_AI_GATEWAY_URL?.trim() ||
      `http://127.0.0.1:${environment.AETERNUM_AI_GATEWAY_PORT || 8081}`;
    const gatewayBase = `${rawGatewayUrl.replace(/\/$/, "")}/v1`;

    llmBaseUrl = httpUrl(gatewayBase, "AETERNUM_AI_GATEWAY_URL");
    speechBaseUrl = httpUrl(gatewayBase, "AETERNUM_AI_GATEWAY_URL");
    speechApiKey = environment.AETERNUM_AI_GATEWAY_TOKEN || "gateway-internal";
  } else {
    // legacy_direct mode (apenas com opt-in explícito VITA_AI_BACKEND=legacy_direct)
    llmBaseUrl = httpUrl(
      requiredValue(
        environment.LOCAL_LLM_BASE_URL,
        "http://localhost:11434/v1",
        "LOCAL_LLM_BASE_URL",
      ),
      "LOCAL_LLM_BASE_URL",
    );
    speechBaseUrl = httpUrl(
      requiredValue(
        environment.LOCAL_SPEECH_BASE_URL,
        "http://localhost:8000/v1",
        "LOCAL_SPEECH_BASE_URL",
      ),
      "LOCAL_SPEECH_BASE_URL",
    );
    speechApiKey = requiredValue(
      environment.LOCAL_SPEECH_API_KEY,
      "local-development-only",
      "LOCAL_SPEECH_API_KEY",
    );
  }

  return {
    backendMode,
    llmBaseUrl,
    llmModel: requiredValue(
      environment.LOCAL_LLM_MODEL,
      "qwen2.5:3b",
      "LOCAL_LLM_MODEL",
    ),
    llmTemperature: numberValue(
      environment.LOCAL_LLM_TEMPERATURE,
      0.25,
      "LOCAL_LLM_TEMPERATURE",
      0,
      1,
    ),
    speechBaseUrl,
    speechApiKey,
    sttModel: requiredValue(
      environment.LOCAL_STT_MODEL,
      "Systran/faster-whisper-small",
      "LOCAL_STT_MODEL",
    ),
    defaultTtsModel: requiredValue(
      environment.LOCAL_TTS_MODEL,
      "speaches-ai/Kokoro-82M-v1.0-ONNX",
      "LOCAL_TTS_MODEL",
    ),
    germanTtsModel: requiredValue(
      environment.LOCAL_TTS_MODEL_DE,
      "speaches-ai/piper-de_DE-thorsten-high",
      "LOCAL_TTS_MODEL_DE",
    ),
    ttsSpeed: numberValue(
      environment.LOCAL_TTS_SPEED,
      1,
      "LOCAL_TTS_SPEED",
      0.5,
      2,
    ),
    tutorVoices: {
      eduardo: requiredValue(environment.LOCAL_TTS_VOICE_EDUARDO, "pm_alex", "LOCAL_TTS_VOICE_EDUARDO"),
      antonia: requiredValue(environment.LOCAL_TTS_VOICE_ANTONIA, "ef_dora", "LOCAL_TTS_VOICE_ANTONIA"),
      ariana: requiredValue(environment.LOCAL_TTS_VOICE_ARIANA, "af_heart", "LOCAL_TTS_VOICE_ARIANA"),
      fabian: requiredValue(environment.LOCAL_TTS_VOICE_FABIAN, "thorsten", "LOCAL_TTS_VOICE_FABIAN"),
    },
    ragUrl: ragUrl ? httpUrl(ragUrl, "VITA_RAG_URL") : undefined,
    ragApiKey: environment.VITA_RAG_API_KEY?.trim() || undefined,
    ragTimeoutMs: numberValue(
      environment.VITA_RAG_TIMEOUT_MS,
      2500,
      "VITA_RAG_TIMEOUT_MS",
      200,
      15000,
    ),
  };
};
