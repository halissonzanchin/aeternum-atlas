import { AeternumAIGateway, loadGatewayEnvConfig } from "../../../src/gateway/index.ts";
import { ProviderRouter } from "../../../src/providers/router/index.ts";
import {
  OllamaLLMProvider,
  SpeachesSTTProvider,
  SpeachesTTSProvider,
  GeminiLLMProvider,
  DeepgramSTTProvider,
  CartesiaTTSProvider
} from "../../../src/providers/index.ts";
import { loadLocalCloudEnv } from "../../../src/providers/cloud/localSecretLoader.ts";

loadLocalCloudEnv();
const envConfig = loadGatewayEnvConfig();

const localLLM = envConfig.localLLMEnabled
  ? new OllamaLLMProvider({ modelId: "qwen2.5:3b", baseUrl: "http://127.0.0.1:11434" })
  : undefined;
const cloudLLM = envConfig.cloudLLMEnabled
  ? new GeminiLLMProvider({ modelId: "gemini-3.7-flash" })
  : undefined;

const localSTT = envConfig.localSTTEnabled
  ? new SpeachesSTTProvider({
      modelId: "Systran/faster-whisper-small",
      baseUrl: "http://127.0.0.1:8000",
      apiKey: process.env.LOCAL_SPEECH_API_KEY
    })
  : undefined;
const cloudSTT = envConfig.cloudSTTEnabled
  ? new DeepgramSTTProvider({ modelId: "nova-3" })
  : undefined;

const localTTS = envConfig.localTTSEnabled
  ? new SpeachesTTSProvider({
      baseUrl: "http://127.0.0.1:8000",
      apiKey: process.env.LOCAL_SPEECH_API_KEY
    })
  : undefined;
const cloudTTS = envConfig.cloudTTSEnabled
  ? new CartesiaTTSProvider({ modelId: "sonic-3", apiVersion: "2026-08-14" })
  : undefined;

if (!localLLM && !cloudLLM) {
  throw new Error("Nenhum provedor de LLM habilitado na configuração.");
}
if (!localSTT && !cloudSTT) {
  throw new Error("Nenhum provedor de STT habilitado na configuração.");
}
if (!localTTS && !cloudTTS) {
  throw new Error("Nenhum provedor de TTS habilitado na configuração.");
}

const router = new ProviderRouter({
  llm: { primary: (localLLM || cloudLLM)!, fallback: localLLM ? cloudLLM : undefined },
  stt: { primary: (localSTT || cloudSTT)!, fallback: localSTT ? cloudSTT : undefined },
  tts: { primary: (localTTS || cloudTTS)!, fallback: localTTS ? cloudTTS : undefined }
});

const gateway = new AeternumAIGateway({
  port: envConfig.port,
  host: envConfig.host,
  authMode: envConfig.authMode,
  mode: envConfig.mode,
  authToken: envConfig.authToken,
  secondaryAuthToken: envConfig.secondaryAuthToken,
  providerTimeoutMs: envConfig.providerTimeoutMs,
  gatewayRequestTimeoutMs: envConfig.gatewayRequestTimeoutMs,
  maxConcurrentRequests: envConfig.maxConcurrentRequests,
  shutdownTimeoutMs: envConfig.shutdownTimeoutMs,
  router,
  healthRegistry: {
    llm_local: localLLM ? { provider: localLLM, enabled: true } : undefined,
    llm_cloud: cloudLLM ? { provider: cloudLLM, enabled: true } : undefined,
    stt_local: localSTT ? { provider: localSTT, enabled: true } : undefined,
    stt_cloud: cloudSTT ? { provider: cloudSTT, enabled: true } : undefined,
    tts_local: localTTS ? { provider: localTTS, enabled: true } : undefined,
    tts_cloud: cloudTTS ? { provider: cloudTTS, enabled: true } : undefined
  }
});

gateway.start().then(() => {
  console.log(`Aeternum AI Gateway rodando na porta ${envConfig.port} (${envConfig.authMode}) - Modo: ${envConfig.mode}`);
});

process.on("SIGTERM", async () => {
  console.log("Sinal SIGTERM recebido. Encerrando Gateway graciosamente...");
  await gateway.stop(envConfig.shutdownTimeoutMs);
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Sinal SIGINT recebido. Encerrando Gateway...");
  await gateway.stop(envConfig.shutdownTimeoutMs);
  process.exit(0);
});
