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

const gatewayMode = (process.env.AETERNUM_AI_GATEWAY_MODE || "local_first").toLowerCase();

const routerConfig = gatewayMode === "cloud_only"
  ? {
      llm: {
        primary: new GeminiLLMProvider({ modelId: "gemini-3.7-flash" })
      },
      stt: {
        fallback: new DeepgramSTTProvider({ modelId: "nova-3" })
      },
      tts: {
        fallback: new CartesiaTTSProvider({ modelId: "sonic-3", apiVersion: "2026-08-14" })
      }
    }
  : {
      llm: {
        primary: new OllamaLLMProvider({ modelId: "qwen2.5:3b" }),
        fallback: new GeminiLLMProvider({ modelId: "gemini-3.7-flash" })
      },
      stt: {
        primary: new SpeachesSTTProvider({ modelId: "Systran/faster-whisper-small", baseUrl: "http://127.0.0.1:8000", apiKey: process.env.SPEECH_API_KEY }),
        fallback: new DeepgramSTTProvider({ modelId: "nova-3" })
      },
      tts: {
        primary: new SpeachesTTSProvider({ baseUrl: "http://127.0.0.1:8000", apiKey: process.env.SPEECH_API_KEY }),
        fallback: new CartesiaTTSProvider({ modelId: "sonic-3", apiVersion: "2026-08-14" })
      }
    };

const router = new ProviderRouter(routerConfig);

const port = Number(process.env.PORT || process.env.AETERNUM_AI_GATEWAY_PORT) || 8081;
const host = process.env.AETERNUM_AI_GATEWAY_HOST || (process.env.PORT ? "0.0.0.0" : "127.0.0.1");
const authMode = (process.env.AETERNUM_AI_GATEWAY_AUTH_MODE as any) || (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging" ? "BEARER_TOKEN" : "INTERNAL_DEV");

const gateway = new AeternumAIGateway({
  port,
  host,
  authMode,
  mode: gatewayMode,
  router
});

gateway.start().then(() => {
  console.log(`Aeternum AI Gateway rodando em http://${host}:${port} (mode=${gatewayMode}, authMode=${authMode})`);
});

