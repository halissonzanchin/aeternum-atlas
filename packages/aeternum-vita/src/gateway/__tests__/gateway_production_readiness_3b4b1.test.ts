import { describe, it, expect, vi } from "vitest";
import http from "node:http";
import { AeternumAIGateway } from "../AeternumAIGateway.ts";
import { ProviderRouter } from "../../providers/router/index.ts";
import { FakeLLMProvider } from "../../providers/testing/FakeLLMProvider.ts";
import { HealthResult } from "../../providers/types/health.ts";

let portCounter = 9400;
function getPort() {
  return portCounter++;
}

class ReadinessFakeLLM extends FakeLLMProvider {
  private customHealth: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";

  constructor(id: string, location: "LOCAL" | "CLOUD", healthStatus: "HEALTHY" | "DEGRADED" | "UNAVAILABLE" = "HEALTHY") {
    super({ id, location });
    this.customHealth = healthStatus;
  }

  setHealth(s: "HEALTHY" | "DEGRADED" | "UNAVAILABLE") {
    this.customHealth = s;
  }

  async generate(req: any): Promise<any> {
    return {
      text: `Resposta de ${this.metadata.id}: ${req.prompt}`,
      modelId: this.metadata.id,
      providerId: this.metadata.id,
      latencyMs: 10,
      finishReason: "stop" as const
    };
  }

  async health(): Promise<HealthResult> {
    return {
      providerId: this.metadata.id,
      status: this.customHealth,
      latencyMs: 5,
      timestamp: new Date().toISOString()
    };
  }
}

describe("PHASE 3B.4B.1 — Production Gateway Runtime Readiness", () => {
  it("1. DUAL_TOKEN_AUTH: Primary and Secondary tokens both authenticate successfully", async () => {
    const p = getPort();
    const primaryLLM = new ReadinessFakeLLM("primary-llm", "LOCAL");
    const router = new ProviderRouter({ llm: { primary: primaryLLM } });

    const gateway = new AeternumAIGateway({
      port: p,
      host: "127.0.0.1",
      authMode: "SERVICE_TOKEN",
      authToken: "primary_secret_token_12345",
      secondaryAuthToken: "secondary_secret_token_67890",
      router
    });

    await gateway.start();

    try {
      // Primary token -> 200
      const resPrimary = await fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer primary_secret_token_12345"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "teste primario" }] })
      });
      expect(resPrimary.status).toBe(200);

      // Secondary token -> 200
      const resSecondary = await fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer secondary_secret_token_67890"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "teste secundario" }] })
      });
      expect(resSecondary.status).toBe(200);

      // Invalid token -> 401
      const resInvalid = await fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer token_completamente_errado"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "teste invalido" }] })
      });
      expect(resInvalid.status).toBe(401);

      // Missing token -> 401
      const resMissing = await fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "teste sem token" }] })
      });
      expect(resMissing.status).toBe(401);
    } finally {
      await gateway.stop();
    }
  });

  it("2. CONFIG_VALIDATION: Rejects invalid configs and insecure public bindings", () => {
    const router = new ProviderRouter({ llm: { primary: new ReadinessFakeLLM("test", "LOCAL") } });

    // Public binding with INTERNAL_DEV must throw
    expect(() => {
      new AeternumAIGateway({
        host: "0.0.0.0",
        authMode: "INTERNAL_DEV",
        router
      });
    }).toThrow(/Binding público proibido sem autenticação segura/);

    // SERVICE_TOKEN without token must throw
    const originalToken = process.env.AETERNUM_AI_GATEWAY_TOKEN;
    const originalPrimary = process.env.PRIMARY_SERVICE_TOKEN;
    delete process.env.AETERNUM_AI_GATEWAY_TOKEN;
    delete process.env.PRIMARY_SERVICE_TOKEN;

    expect(() => {
      new AeternumAIGateway({
        host: "127.0.0.1",
        authMode: "SERVICE_TOKEN",
        authToken: "",
        router
      });
    }).toThrow(/Modo SERVICE_TOKEN requer configuração de authToken/);

    if (originalToken) process.env.AETERNUM_AI_GATEWAY_TOKEN = originalToken;
    if (originalPrimary) process.env.PRIMARY_SERVICE_TOKEN = originalPrimary;

    // providerTimeout >= gatewayTimeout must throw
    expect(() => {
      new AeternumAIGateway({
        host: "127.0.0.1",
        authMode: "INTERNAL_DEV",
        providerTimeoutMs: 35000,
        gatewayRequestTimeoutMs: 30000,
        router
      });
    }).toThrow(/Invariante de timeout violado/);
  });

  it("3. HEALTH_VS_READINESS: /health reports liveness and /ready reports dependency state", async () => {
    const p = getPort();
    const localLLM = new ReadinessFakeLLM("ollama-local", "LOCAL", "HEALTHY");
    const cloudLLM = new ReadinessFakeLLM("gemini-cloud", "CLOUD", "HEALTHY");
    const router = new ProviderRouter({ llm: { primary: localLLM, fallback: cloudLLM } });

    const gateway = new AeternumAIGateway({
      port: p,
      host: "127.0.0.1",
      authMode: "INTERNAL_DEV",
      router,
      healthRegistry: {
        llm_local: { provider: localLLM, enabled: true },
        llm_cloud: { provider: cloudLLM, enabled: true }
      }
    });

    await gateway.start();

    try {
      // 1. GET /health (Liveness)
      const healthRes = await fetch(`http://127.0.0.1:${p}/health`);
      expect(healthRes.status).toBe(200);
      const healthJson = await healthRes.json();
      expect(healthJson.status).toBe("HEALTHY");

      // 2. GET /ready (Readiness - Healthy state)
      const readyRes = await fetch(`http://127.0.0.1:${p}/ready`);
      expect(readyRes.status).toBe(200);
      const readyJson = await readyRes.json();
      expect(readyJson.status).toBe("READY");
      expect(readyJson.providers.local_llm).toBe("healthy");
      expect(readyJson.providers.cloud_fallback).toBe("configured");

      // 3. GET /ready (Readiness - Degraded state when local is down but cloud is up)
      localLLM.setHealth("UNAVAILABLE");
      const degradedRes = await fetch(`http://127.0.0.1:${p}/ready`);
      expect(degradedRes.status).toBe(200);
      const degradedJson = await degradedRes.json();
      expect(degradedJson.status).toBe("DEGRADED");
      expect(degradedJson.providers.local_llm).toBe("unavailable");

      // 4. GET /ready (Readiness - NOT_READY state when both are down)
      cloudLLM.setHealth("UNAVAILABLE");
      const notReadyRes = await fetch(`http://127.0.0.1:${p}/ready`);
      expect(notReadyRes.status).toBe(503);
      const notReadyJson = await notReadyRes.json();
      expect(notReadyJson.status).toBe("NOT_READY");
    } finally {
      await gateway.stop();
    }
  });

  it("4. CONCURRENCY_LIMIT: Rejects excess simultaneous requests with 429", async () => {
    const p = getPort();
    let delayMs = 100;

    class SlowLLM extends FakeLLMProvider {
      constructor() {
        super({ id: "slow", location: "LOCAL" });
      }
      async generate(req: any): Promise<any> {
        await new Promise((r) => setTimeout(r, delayMs));
        return { text: "ok", modelId: "slow", providerId: "slow", latencyMs: delayMs, finishReason: "stop" as const };
      }
      async health(): Promise<HealthResult> {
        return { providerId: this.metadata.id, status: "HEALTHY" as const, latencyMs: 1, timestamp: new Date().toISOString() };
      }
    }

    const router = new ProviderRouter({ llm: { primary: new SlowLLM() } });
    const gateway = new AeternumAIGateway({
      port: p,
      host: "127.0.0.1",
      authMode: "INTERNAL_DEV",
      maxConcurrentRequests: 2, // Limite estrito de 2
      router
    });

    await gateway.start();

    try {
      // Dispara 4 requisições simultâneas com limite de 2
      const [r1, r2, r3, r4] = await Promise.all([
        fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: "p1" }] })
        }),
        fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: "p2" }] })
        }),
        fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: "p3" }] })
        }),
        fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: "p4" }] })
        })
      ]);

      const statuses = [r1.status, r2.status, r3.status, r4.status];
      const rateLimitedCount = statuses.filter((s) => s === 429).length;
      const successCount = statuses.filter((s) => s === 200).length;

      expect(rateLimitedCount).toBeGreaterThan(0);
      expect(successCount).toBeGreaterThan(0);
    } finally {
      await gateway.stop();
    }
  });

  it("5. GRACEFUL_SHUTDOWN: Completes in-flight requests and rejects new ones", async () => {
    const p = getPort();
    class DelayedLLM extends FakeLLMProvider {
      constructor() {
        super({ id: "delayed", location: "LOCAL" });
      }
      async generate(req: any): Promise<any> {
        await new Promise((r) => setTimeout(r, 150));
        return { text: "resposta concluida", modelId: "delayed", providerId: "delayed", latencyMs: 150, finishReason: "stop" as const };
      }
      async health(): Promise<HealthResult> {
        return { providerId: this.metadata.id, status: "HEALTHY" as const, latencyMs: 1, timestamp: new Date().toISOString() };
      }
    }

    const router = new ProviderRouter({ llm: { primary: new DelayedLLM() } });
    const gateway = new AeternumAIGateway({
      port: p,
      host: "127.0.0.1",
      authMode: "INTERNAL_DEV",
      shutdownTimeoutMs: 1000,
      router
    });

    await gateway.start();

    // 1. Inicia requisição longa
    const inFlightPromise = fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "in-flight" }] })
    });

    // 2. Aciona parada graciosa durante a execução
    await new Promise((r) => setTimeout(r, 30));
    const stopPromise = gateway.stop(1000);

    // 3. Tenta disparar nova requisição durante o shutdown -> deve ser rejeitada com 503
    const newReq = await fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "novo" }] })
    }).catch(() => ({ status: 503 }));

    expect(newReq.status).toBe(503);

    // 4. A requisição in-flight original deve ter concluído com 200
    const inFlightRes = await inFlightPromise;
    expect(inFlightRes.status).toBe(200);

    await stopPromise;
  });
});
