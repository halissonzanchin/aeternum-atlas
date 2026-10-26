import { AeternumAIGateway } from "../../packages/aeternum-vita/src/gateway/AeternumAIGateway.ts";
import { ProviderRouter } from "../../packages/aeternum-vita/src/providers/router/ProviderRouter.ts";
import { AtlasDaemonLLMProvider } from "../../packages/aeternum-vita/src/providers/local/atlas-daemon/AtlasDaemonLLMProvider.ts";

class SimulatedCloudFallbackProvider {
  metadata = {
    id: "gemini-cloud-fallback",
    name: "Simulated Gemini Cloud Fallback",
    type: "LLM",
    location: "CLOUD",
    version: "1.0.0"
  };
  async health() {
    return {
      providerId: this.metadata.id,
      status: "HEALTHY",
      latencyMs: 12,
      timestamp: new Date().toISOString()
    };
  }
  async generate() {
    return {
      text: "Resposta de contingencia via Cloud Fallback apos queda do daemon local.",
      providerId: this.metadata.id,
      modelId: "gemini-3.7-flash",
      finishReason: "stop",
      latency: { totalMs: 45 }
    };
  }
  async *stream() {
    yield { deltaText: "Fallback stream", isComplete: true, finishReason: "stop" };
  }
}

process.env.AETERNUM_AI_GATEWAY_TOKEN = "test-recovery-strong-token-987654321";

// Cenario A: Queda do Atlas Daemon (porta inativa 14599) + Fallback Cloud ativo
const deadDaemonProvider = new AtlasDaemonLLMProvider({
  daemonBaseUrl: "http://127.0.0.1:14599",
  targetModel: "qwen3.5:4b"
});

const routerWithFallback = new ProviderRouter({
  llm: {
    primary: deadDaemonProvider,
    fallback: new SimulatedCloudFallbackProvider()
  }
});

const gwFallback = new AeternumAIGateway({
  port: 8089,
  host: "127.0.0.1",
  authMode: "BEARER_TOKEN",
  router: routerWithFallback,
  disableAudioRoutes: true
});

await gwFallback.start();
try {
  const hDown = await fetch("http://127.0.0.1:8089/health");
  const hDownJson = await hDown.json();
  console.log(`[1/3 QUEDA DETECTADA NO HEALTH] HTTP=${hDown.status} | status=${hDownJson.status} | llm_local=${hDownJson.providers.llm_local} | llm_cloud=${hDownJson.providers.llm_cloud}`);

  const genFallback = await fetch("http://127.0.0.1:8089/v1/llm/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer test-recovery-strong-token-987654321"
    },
    body: JSON.stringify({ messages: [{ role: "user", content: "Teste de queda do servico local" }] })
  });
  const genFallbackJson = await genFallback.json();
  console.log(`[2/3 FALLBACK AUTOMATICO IDENTIFICADO] HTTP=${genFallback.status} | fallbackUsed=${genFallbackJson.metadata.fallbackUsed} | fallbackReason=${genFallbackJson.metadata.fallbackReason} | finalProvider=${genFallbackJson.metadata.finalProvider}`);
} finally {
  await gwFallback.stop();
}

// Cenario B: Recuperacao para o Atlas Daemon Real (127.0.0.1:14555)
const liveDaemonProvider = new AtlasDaemonLLMProvider({
  daemonBaseUrl: "http://127.0.0.1:14555",
  targetModel: "qwen3.5:4b"
});

const routerRecovered = new ProviderRouter({
  llm: {
    primary: liveDaemonProvider,
    fallback: new SimulatedCloudFallbackProvider()
  }
});

const gwRecovered = new AeternumAIGateway({
  port: 8090,
  host: "127.0.0.1",
  authMode: "BEARER_TOKEN",
  router: routerRecovered,
  disableAudioRoutes: true
});

await gwRecovered.start();
try {
  const hUp = await fetch("http://127.0.0.1:8090/health");
  const hUpJson = await hUp.json();
  const genUp = await fetch("http://127.0.0.1:8090/v1/llm/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer test-recovery-strong-token-987654321"
    },
    body: JSON.stringify({ messages: [{ role: "user", content: "Qual nervo inerva o musculo diafragma? Responda em uma frase curta." }] })
  });
  const genUpJson = await genUp.json();
  console.log(`[3/3 RECUPERACAO PARA DAEMON RUST REAL] HealthHTTP=${hUp.status} (${hUpJson.status}) | GenerateHTTP=${genUp.status} | fallbackUsed=${genUpJson.metadata.fallbackUsed} | finalProvider=${genUpJson.metadata.finalProvider} | model=${genUpJson.data.modelId}`);
} finally {
  await gwRecovered.stop();
}
