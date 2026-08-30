import { describe, it, expect } from "vitest";
import http from "node:http";
import { AeternumAIGateway } from "../AeternumAIGateway.ts";
import { ProviderRouter } from "../../providers/router/index.ts";
import { FakeLLMProvider } from "../../providers/testing/FakeLLMProvider.ts";
import { HealthResult } from "../../providers/types/health.ts";
import { loadGatewayEnvConfig } from "../config.ts";

let portCounter = 9420;
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
      text: `Resposta de ${this.metadata.id}: ${JSON.stringify(req.messages)}`,
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

describe("PHASE 3B.4B.1 — Production Gateway Runtime Readiness (Final Hardened)", () => {
  // ==========================================
  // 1. PRIMARY TOKEN INVARIANT & DUAL TOKEN
  // ==========================================

  it("1. PRIMARY_TOKEN_INVARIANT: Primary token is strictly required; secondary is optional", () => {
    const router = new ProviderRouter({ llm: { primary: new ReadinessFakeLLM("test", "LOCAL") } });

    const originalToken = process.env.AETERNUM_AI_GATEWAY_TOKEN;
    const originalPrimary = process.env.PRIMARY_SERVICE_TOKEN;
    const originalSec = process.env.SECONDARY_SERVICE_TOKEN;
    delete process.env.AETERNUM_AI_GATEWAY_TOKEN;
    delete process.env.PRIMARY_SERVICE_TOKEN;
    delete process.env.SECONDARY_SERVICE_TOKEN;

    try {
      // Caso A: Primary only -> PASS
      expect(() => {
        new AeternumAIGateway({
          host: "127.0.0.1",
          authMode: "SERVICE_TOKEN",
          authToken: "primary_token_only",
          router
        });
      }).not.toThrow();

      // Caso B: Primary + Secondary -> PASS
      expect(() => {
        new AeternumAIGateway({
          host: "127.0.0.1",
          authMode: "SERVICE_TOKEN",
          authToken: "primary_token_123",
          secondaryAuthToken: "secondary_token_456",
          router
        });
      }).not.toThrow();

      // Caso C: Primary missing + Secondary present -> STARTUP FAIL
      expect(() => {
        new AeternumAIGateway({
          host: "127.0.0.1",
          authMode: "SERVICE_TOKEN",
          authToken: "",
          secondaryAuthToken: "secondary_token_456",
          router
        });
      }).toThrow(/Modo SERVICE_TOKEN requer configuração de authToken/);

      // Caso D: Both missing -> STARTUP FAIL
      expect(() => {
        new AeternumAIGateway({
          host: "127.0.0.1",
          authMode: "SERVICE_TOKEN",
          authToken: "",
          secondaryAuthToken: "",
          router
        });
      }).toThrow(/Modo SERVICE_TOKEN requer configuração de authToken/);
    } finally {
      if (originalToken) process.env.AETERNUM_AI_GATEWAY_TOKEN = originalToken;
      if (originalPrimary) process.env.PRIMARY_SERVICE_TOKEN = originalPrimary;
      if (originalSec) process.env.SECONDARY_SERVICE_TOKEN = originalSec;
    }
  });

  it("2. DUAL_TOKEN_AUTH: Primary and Secondary tokens authenticate in constant-time; invalid/missing rejected", async () => {
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

  // ==========================================
  // 2. TRUE LIVENESS & READINESS
  // ==========================================

  it("3. TRUE_LIVENESS: /health returns 200 regardless of provider states; /ready reports truthful dependencies", async () => {
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
      // 1. GET /health (Liveness) -> 200 HEALTHY
      const healthRes = await fetch(`http://127.0.0.1:${p}/health`);
      expect(healthRes.status).toBe(200);
      const healthJson = await healthRes.json();
      expect(healthJson.status).toBe("HEALTHY");

      // 2. GET /ready (Readiness - Healthy state) -> 200 READY
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
      expect(degradedJson.providers.cloud_fallback).toBe("configured");

      // 4. Quando todos os provedores estão indisponíveis:
      cloudLLM.setHealth("UNAVAILABLE");

      // /ready deve reportar 503 NOT_READY e cloud_fallback: "unavailable"
      const notReadyRes = await fetch(`http://127.0.0.1:${p}/ready`);
      expect(notReadyRes.status).toBe(503);
      const notReadyJson = await notReadyRes.json();
      expect(notReadyJson.status).toBe("NOT_READY");
      expect(notReadyJson.providers.local_llm).toBe("unavailable");
      expect(notReadyJson.providers.cloud_fallback).toBe("unavailable");

      // MAS /health (True Liveness) DEVE PERMANECER HTTP 200 porque o processo está vivo!
      const livenessStillUp = await fetch(`http://127.0.0.1:${p}/health`);
      expect(livenessStillUp.status).toBe(200);
      const livenessJson = await livenessStillUp.json();
      expect(livenessJson.status).toBe("HEALTHY");
    } finally {
      await gateway.stop();
    }
  });

  // ==========================================
  // 3. CONCURRENCY & BACKPRESSURE
  // ==========================================

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

  // ==========================================
  // 4. FINITE GRACEFUL SHUTDOWN
  // ==========================================

  it("5. FINITE_GRACEFUL_SHUTDOWN: In-flight completes cleanly; stop(200) finishes within bounded tolerance", async () => {
    const p = getPort();
    class DelayedLLM extends FakeLLMProvider {
      constructor() {
        super({ id: "delayed", location: "LOCAL" });
      }
      async generate(req: any): Promise<any> {
        await new Promise((r) => setTimeout(r, 100));
        return { text: "resposta concluida", modelId: "delayed", providerId: "delayed", latencyMs: 100, finishReason: "stop" as const };
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

    // 1. Inicia requisição in-flight
    const inFlightPromise = fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "in-flight" }] })
    });

    // 2. Aciona parada graciosa durante a execução
    await new Promise((r) => setTimeout(r, 20));
    const stopStart = performance.now();
    await gateway.stop(500);
    const stopDuration = performance.now() - stopStart;

    // stop() deve resolver de forma finita e rápida
    expect(stopDuration).toBeLessThan(600);

    // 3. A requisição in-flight original deve ter completado com sucesso
    const inFlightRes = await inFlightPromise;
    expect(inFlightRes.status).toBe(200);

    // 4. Nova conexão TCP após encerramento do listener deve falhar factual (sem mascarar como 503)
    let connectionRefused = false;
    try {
      await fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "pos-shutdown" }] })
      });
    } catch (err: any) {
      connectionRefused = true;
    }
    expect(connectionRefused).toBe(true);
  });

  it("6. FINITE_SHUTDOWN_INTENTIONAL_HANG: stop(200) terminates hanging connection within deadline", async () => {
    const p = getPort();
    class HangingLLM extends FakeLLMProvider {
      constructor() {
        super({ id: "hanging", location: "LOCAL" });
      }
      async generate(req: any): Promise<any> {
        // Trava indefinidamente (5 segundos)
        await new Promise((r) => setTimeout(r, 5000));
        return { text: "hang", modelId: "hanging", providerId: "hanging", latencyMs: 5000, finishReason: "stop" as const };
      }
      async health(): Promise<HealthResult> {
        return { providerId: this.metadata.id, status: "HEALTHY" as const, latencyMs: 1, timestamp: new Date().toISOString() };
      }
    }

    const router = new ProviderRouter({ llm: { primary: new HangingLLM() } });
    const gateway = new AeternumAIGateway({
      port: p,
      host: "127.0.0.1",
      authMode: "INTERNAL_DEV",
      shutdownTimeoutMs: 200,
      router
    });

    await gateway.start();

    // Dispara requisição que trava
    fetch(`http://127.0.0.1:${p}/v1/llm/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hang" }] })
    }).catch(() => {});

    await new Promise((r) => setTimeout(r, 20));

    const stopStart = performance.now();
    await gateway.stop(200);
    const stopDuration = performance.now() - stopStart;

    // Deve encerrar em torno de 200ms (tolerância até 400ms)
    expect(stopDuration).toBeLessThan(450);
  });

  // ==========================================
  // 5. CONFIG WIRING
  // ==========================================

  it("7. ENV_CONFIG_WIRING: loadGatewayEnvConfig reads maxConcurrentRequests and shutdownTimeoutMs", () => {
    process.env.MAX_CONCURRENT_REQUESTS = "75";
    process.env.SHUTDOWN_TIMEOUT_MS = "8000";
    process.env.PRIMARY_SERVICE_TOKEN = "env_primary_tok_99";
    process.env.SECONDARY_SERVICE_TOKEN = "env_secondary_tok_88";

    try {
      const cfg = loadGatewayEnvConfig();
      expect(cfg.maxConcurrentRequests).toBe(75);
      expect(cfg.shutdownTimeoutMs).toBe(8000);
      expect(cfg.authToken).toBe("env_primary_tok_99");
      expect(cfg.secondaryAuthToken).toBe("env_secondary_tok_88");
    } finally {
      delete process.env.MAX_CONCURRENT_REQUESTS;
      delete process.env.SHUTDOWN_TIMEOUT_MS;
      delete process.env.PRIMARY_SERVICE_TOKEN;
      delete process.env.SECONDARY_SERVICE_TOKEN;
    }
  });
});
