export interface VoiceRuntimeConfig {
  llmBaseUrl: string;
  llmModel: string;
  llmTemperature: number;
  speechBaseUrl: string;
  speechApiKey: string;
  sttModel: string;
  defaultTtsModel: string;
  germanTtsModel: string;
  ttsSpeed: number;
  tutorVoices: {
    eduardo: string;
    antonia: string;
    ariana: string;
    fabian: string;
  };
  ragUrl?: string;
  ragApiKey?: string;
  ragTimeoutMs: number;
}

const requiredValue = (
  value: string | undefined,
  fallback: string,
  name: string,
): string => {
  const resolved = value?.trim() || fallback;
  if (!resolved) {
    throw new Error(`${name} deve ser configurada.`);
  }
  return resolved;
};

const httpUrl = (value: string, name: string): string => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} deve ser uma URL HTTP válida.`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${name} deve usar HTTP ou HTTPS.`);
  }

  return value.replace(/\/$/, "");
};

const numberValue = (
  value: string | undefined,
  fallback: number,
  name: string,
  minimum: number,
  maximum: number,
): number => {
  const resolved = value === undefined ? fallback : Number(value);
  if (!Number.isFinite(resolved) || resolved < minimum || resolved > maximum) {
    throw new Error(`${name} deve estar entre ${minimum} e ${maximum}.`);
  }
  return resolved;
};

export const loadVoiceRuntimeConfig = (
  environment: NodeJS.ProcessEnv = process.env,
): VoiceRuntimeConfig => {
  const ragUrl = environment.VITA_RAG_URL?.trim();

  return {
    llmBaseUrl: httpUrl(
      requiredValue(
        environment.LOCAL_LLM_BASE_URL,
        "http://localhost:11434/v1",
        "LOCAL_LLM_BASE_URL",
      ),
      "LOCAL_LLM_BASE_URL",
    ),
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
    speechBaseUrl: httpUrl(
      requiredValue(
        environment.LOCAL_SPEECH_BASE_URL,
        "http://localhost:8000/v1",
        "LOCAL_SPEECH_BASE_URL",
      ),
      "LOCAL_SPEECH_BASE_URL",
    ),
    speechApiKey: requiredValue(
      environment.LOCAL_SPEECH_API_KEY,
      "local-development-only",
      "LOCAL_SPEECH_API_KEY",
    ),
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
      eduardo: requiredValue(
        environment.LOCAL_TTS_VOICE_EDUARDO,
        "pm_alex",
        "LOCAL_TTS_VOICE_EDUARDO",
      ),
      antonia: requiredValue(
        environment.LOCAL_TTS_VOICE_ANTONIA,
        "ef_dora",
        "LOCAL_TTS_VOICE_ANTONIA",
      ),
      ariana: requiredValue(
        environment.LOCAL_TTS_VOICE_ARIANA,
        "af_heart",
        "LOCAL_TTS_VOICE_ARIANA",
      ),
      fabian: requiredValue(
        environment.LOCAL_TTS_VOICE_FABIAN,
        "thorsten",
        "LOCAL_TTS_VOICE_FABIAN",
      ),
    },
    ragUrl: ragUrl ? httpUrl(ragUrl, "VITA_RAG_URL") : undefined,
    ragApiKey: environment.VITA_RAG_API_KEY?.trim() || undefined,
    ragTimeoutMs: numberValue(
      environment.VITA_RAG_TIMEOUT_MS,
      2500,
      "VITA_RAG_TIMEOUT_MS",
      250,
      15_000,
    ),
  };
};
