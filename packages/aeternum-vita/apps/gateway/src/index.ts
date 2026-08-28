import { AeternumAIGateway } from "../../../src/gateway/index.ts";
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

const router = new ProviderRouter({
  llm: {
    primary: new OllamaLLMProvider({ modelId: "qwen2.5:3b" }),
    fallback: new GeminiLLMProvider({ modelId: "gemini-3.7-flash" })
  },
  stt: {
    primary: new SpeachesSTTProvider({ modelId: "faster-whisper" }),
    fallback: new DeepgramSTTProvider({ modelId: "nova-3" })
  },
  tts: {
    primary: new SpeachesTTSProvider({ modelId: "kokoro" }),
    fallback: new CartesiaTTSProvider({ modelId: "sonic-3", apiVersion: "2026-08-14" })
  }
});

const gateway = new AeternumAIGateway({
  port: Number(process.env.AETERNUM_AI_GATEWAY_PORT) || 8081,
  host: "127.0.0.1",
  authMode: "INTERNAL_DEV",
  router
});

gateway.start().then(() => {
  console.log("Aeternum AI Gateway rodando na porta 8081 (INTERNAL_DEV)");
});
