import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "node:crypto";
import { AeternumAIGateway } from "../AeternumAIGateway.ts";
import { ProviderRouter } from "../../providers/router/ProviderRouter.ts";
import { BaseProvider } from "../../providers/contracts/BaseProvider.ts";
import { LLMProvider } from "../../providers/contracts/LLMProvider.ts";
import {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  ProviderMetadata,
  HealthResult,
  ProviderExecutionContext
} from "../../providers/types/index.ts";

class MockTestLLMProvider implements LLMProvider {
  public readonly metadata: ProviderMetadata = {
    id: "mock-llm-provider",
    name: "Mock LLM Provider",
    type: "LLM",
    location: "LOCAL",
    version: "1.0.0"
  };

  private healthStatus: "HEALTHY" | "DEGRADED" | "UNAVAILABLE" = "HEALTHY";
  private delayMs: number = 0;

  constructor(status: "HEALTHY" | "DEGRADED" | "UNAVAILABLE" = "HEALTHY", delayMs = 0) {
    this.healthStatus = status;
    this.delayMs = delayMs;
  }

  setHealth(status: "HEALTHY" | "DEGRADED" | "UNAVAILABLE") {
    this.healthStatus = status;
  }

  setDelay(ms: number) {
    this.delayMs = ms;
  }

  async health(): Promise<HealthResult> {
    return {
      providerId: this.metadata.id,
      status: this.healthStatus,
      latencyMs: 5,
      timestamp: new Date().toISOString(),
      details: { status: this.healthStatus }
    };
  }

  async generate(request: LLMRequest, context?: ProviderExecutionContext): Promise<LLMResponse> {
    if (this.delayMs > 0) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, this.delayMs);
        if (context?.signal) {
          context.signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new Error("Aborted"));
          }, { once: true });
        }
      });
    }

    return {
      text: "Resposta do modelo mockado com sucesso.",
      providerId: this.metadata.id,
      modelId: "mock-model",
      finishReason: "stop",
      latency: { totalMs: 10 }
    };
  }

  async *stream(request: LLMRequest, context?: ProviderExecutionContext): AsyncIterable<LLMStreamChunk> {
    yield { deltaText: "Resposta ", isComplete: false };
    yield { deltaText: "em stream.", isComplete: true, finishReason: "stop" };
  }
}

describe("Aeternum AI Gateway — Connectivity, Concurrency & Security Gateways", () => {
  let port = 8200;
  const baseUrl = (p: number) => `http://127.0.0.1:${p}`;

  beforeEach(() => {
    delete process.env.CF_ACCESS_CLIENT_ID;
    delete process.env.CF_ACCESS_CLIENT_SECRET;
    delete process.env.CF_ACCESS_JWT_PUBLIC_KEY;
    delete process.env.CF_ACCESS_AUD;
    delete process.env.CF_ACCESS_REQUIRE_JWT;
    delete process.env.AETERNUM_AI_GATEWAY_TOKEN;
    delete process.env.GATEWAY_AUTH_TOKEN;
  });

  it("1. CLOUDFLARE_ACCESS: Rejeita com 401 se credenciais não forem fornecidas ou forem inválidas", async () => {
    const testPort = ++port;
    process.env.CF_ACCESS_CLIENT_ID = "cf-id-test-12345678";
    process.env.CF_ACCESS_CLIENT_SECRET = "cf-secret-test-9876543210abcdef";

    const mockLLM = new MockTestLLMProvider();
    const router = new ProviderRouter({ llm: { primary: mockLLM } });
    const gateway = new AeternumAIGateway({
      port: testPort,
      host: "127.0.0.1",
      authMode: "CLOUDFLARE_ACCESS",
      router
    });

    await gateway.start();
    try {
      // a) Sem nenhum cabeçalho CF-Access
      const resMissing = await fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "oi" }] })
      });
      expect(resMissing.status).toBe(401);
      const jsonMissing = await resMissing.json();
      expect(jsonMissing.error.message).toContain("CF-Access-Client-Id");

      // b) Com credenciais erradas
      const resWrong = await fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CF-Access-Client-Id": "wrong-id",
          "CF-Access-Client-Secret": "wrong-secret"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "oi" }] })
      });
      expect(resWrong.status).toBe(401);

      // c) Com credenciais exatas (constant-time validation)
      const resValid = await fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CF-Access-Client-Id": "cf-id-test-12345678",
          "CF-Access-Client-Secret": "cf-secret-test-9876543210abcdef"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "oi" }] })
      });
      expect(resValid.status).toBe(200);
      const jsonValid = await resValid.json();
      expect(jsonValid.success).toBe(true);
      expect(jsonValid.data.text).toContain("Resposta do modelo mockado");
    } finally {
      await gateway.stop();
    }
  });

  it("2. HYBRID_AUTH: Exige simultaneamente Cloudflare Access E Bearer Token", async () => {
    const testPort = ++port;
    process.env.CF_ACCESS_CLIENT_ID = "cf-id-hybrid-123";
    process.env.CF_ACCESS_CLIENT_SECRET = "cf-secret-hybrid-456";
    process.env.AETERNUM_AI_GATEWAY_TOKEN = "bearer-secret-gateway-789";

    const mockLLM = new MockTestLLMProvider();
    const router = new ProviderRouter({ llm: { primary: mockLLM } });
    const gateway = new AeternumAIGateway({
      port: testPort,
      host: "127.0.0.1",
      authMode: "HYBRID_AUTH",
      router
    });

    await gateway.start();
    try {
      // Apenas CF-Access (sem Bearer) -> 401
      const resOnlyCF = await fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CF-Access-Client-Id": "cf-id-hybrid-123",
          "CF-Access-Client-Secret": "cf-secret-hybrid-456"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "oi" }] })
      });
      expect(resOnlyCF.status).toBe(401);

      // Apenas Bearer (sem CF-Access) -> 401
      const resOnlyBearer = await fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer bearer-secret-gateway-789"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "oi" }] })
      });
      expect(resOnlyBearer.status).toBe(401);

      // Ambos válidos -> 200
      const resBoth = await fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CF-Access-Client-Id": "cf-id-hybrid-123",
          "CF-Access-Client-Secret": "cf-secret-hybrid-456",
          "Authorization": "Bearer bearer-secret-gateway-789"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "oi" }] })
      });
      expect(resBoth.status).toBe(200);
    } finally {
      await gateway.stop();
    }
  });

  it("3. Invariante de Segurança: Bloqueia INTERNAL_DEV se a requisição vier via Cloudflare Tunnel", async () => {
    const testPort = ++port;
    const mockLLM = new MockTestLLMProvider();
    const router = new ProviderRouter({ llm: { primary: mockLLM } });
    const gateway = new AeternumAIGateway({
      port: testPort,
      host: "127.0.0.1",
      authMode: "INTERNAL_DEV",
      router
    });

    await gateway.start();
    try {
      const resTunnel = await fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "cf-ray": "8d394a1b2c3d-GRU" // Indicativo claro de passagem por Cloudflare Edge
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "oi" }] })
      });
      expect(resTunnel.status).toBe(401);
      const json = await resTunnel.json();
      expect(json.error.message).toContain("Cloudflare Tunnel");
    } finally {
      await gateway.stop();
    }
  });

  it("4. Concurrency Queue: Limita concorrência e rejeita com 429 QUEUE_FULL quando a fila enche", async () => {
    const testPort = ++port;
    process.env.AETERNUM_AI_GATEWAY_TOKEN = "test-token";

    // Provedor lento (200ms) para segurar os slots de execução
    const slowLLM = new MockTestLLMProvider("HEALTHY", 200);
    const router = new ProviderRouter({ llm: { primary: slowLLM } });

    // Fila restrita: 1 ativa, 1 em espera (máximo 2 requisições em voo)
    const gateway = new AeternumAIGateway({
      port: testPort,
      host: "127.0.0.1",
      authMode: "BEARER_TOKEN",
      router,
      concurrency: {
        maxConcurrent: 1,
        maxQueueSize: 1,
        queueTimeoutMs: 5000
      }
    });

    await gateway.start();
    try {
      const makeCall = () =>
        fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer test-token"
          },
          body: JSON.stringify({ messages: [{ role: "user", content: "teste de concorrência" }] })
        });

      // Dispara 3 requisições simultâneas:
      // Req 1: consome slot ativo (1/1)
      // Req 2: entra na fila (1/1)
      // Req 3: fila cheia -> deve ser rejeitada com 429 QUEUE_FULL
      const p1 = makeCall();
      const p2 = makeCall();
      const p3 = makeCall();

      const results = await Promise.all([p1, p2, p3]);
      const statusCodes = results.map((r) => r.status);

      expect(statusCodes).toContain(429);
      const failedRes = results.find((r) => r.status === 429);
      if (failedRes) {
        const json = await failedRes.json();
        expect(json.error.code).toBe("queue_full");
      }
    } finally {
      await gateway.stop();
    }
  });

  it("5. Health Check: Diagnóstico real retorna 200 quando HEALTHY e 503 quando UNAVAILABLE sem vazar segredos", async () => {
    const testPort = ++port;
    const mockLLM = new MockTestLLMProvider("HEALTHY");
    const router = new ProviderRouter({ llm: { primary: mockLLM } });

    const gateway = new AeternumAIGateway({
      port: testPort,
      host: "127.0.0.1",
      authMode: "BEARER_TOKEN",
      router
    });

    await gateway.start();
    try {
      // a) HEALTHY -> 200
      const resHealthy = await fetch(`${baseUrl(testPort)}/health`);
      expect(resHealthy.status).toBe(200);
      const dataHealthy = await resHealthy.json();
      expect(dataHealthy.status).toBe("HEALTHY");
      expect(dataHealthy.providers.llm_local).toBe("HEALTHY");

      // b) UNAVAILABLE -> 503
      mockLLM.setHealth("UNAVAILABLE");
      const resUnavailable = await fetch(`${baseUrl(testPort)}/health`);
      expect(resUnavailable.status).toBe(503);
      const dataUnavailable = await resUnavailable.json();
      expect(dataUnavailable.status).toBe("UNAVAILABLE");

      // Verificação de vazamento
      const serialized = JSON.stringify(dataUnavailable);
      expect(serialized).not.toContain("password");
      expect(serialized).not.toContain("secret");
      expect(serialized).not.toContain("token");
    } finally {
      await gateway.stop();
    }
  });

  it("6. HYBRID_AUTH + Protect with Access: Valida assinatura criptográfica RS256 fail-closed (iss, aud, exp, common_name) + Bearer independente", async () => {
    const testPort = ++port;
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" }
    });

    const expectedAud = "9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e";
    const expectedClientId = "a1b2c3d4e5f60718293a4b5c6d7e8f90.access";
    const expectedIssuer = "https://aeternum-atlas.cloudflareaccess.com";

    process.env.CF_ACCESS_JWT_PUBLIC_KEY = publicKey;
    process.env.CF_ACCESS_AUD = expectedAud;
    process.env.CF_ACCESS_ISSUER = expectedIssuer;
    process.env.CF_ACCESS_CLIENT_ID = expectedClientId;
    process.env.CF_ACCESS_REQUIRE_JWT = "true";
    process.env.AETERNUM_AI_GATEWAY_TOKEN = "strong-independent-origin-bearer-token-256bit";

    const signAccessJwt = (payloadObj: Record<string, unknown>, keyPem = privateKey) => {
      const headerB64 = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
      const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
      const sig = crypto.sign("RSA-SHA256", Buffer.from(`${headerB64}.${payloadB64}`), keyPem).toString("base64url");
      return `${headerB64}.${payloadB64}.${sig}`;
    };

    const nowSec = Math.floor(Date.now() / 1000);
    const validJwt = signAccessJwt({
      aud: [expectedAud],
      common_name: expectedClientId,
      exp: nowSec + 3600,
      iat: nowSec - 10,
      nbf: nowSec - 10,
      iss: expectedIssuer,
      type: "app"
    });

    const wrongAudJwt = signAccessJwt({
      aud: ["wrong-aud-tag"],
      common_name: expectedClientId,
      exp: nowSec + 3600,
      iss: expectedIssuer
    });

    const wrongIssJwt = signAccessJwt({
      aud: [expectedAud],
      common_name: expectedClientId,
      exp: nowSec + 3600,
      iss: "https://evil-tenant.cloudflareaccess.com"
    });

    const missingExpJwt = signAccessJwt({
      aud: [expectedAud],
      common_name: expectedClientId,
      iss: expectedIssuer
    });

    const expiredJwt = signAccessJwt({
      aud: [expectedAud],
      common_name: expectedClientId,
      exp: nowSec - 60,
      iss: expectedIssuer
    });

    const mockLLM = new MockTestLLMProvider("HEALTHY");
    const router = new ProviderRouter({ llm: { primary: mockLLM } });
    const gateway = new AeternumAIGateway({
      port: testPort,
      host: "127.0.0.1",
      authMode: "HYBRID_AUTH",
      router,
      disableAudioRoutes: true
    });

    await gateway.start();
    try {
      // a) JWT válido (iss + aud + exp + common_name + RS256) + Bearer válido -> 200
      const resOk = await fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cf-Access-Jwt-Assertion": validJwt,
          "Authorization": "Bearer strong-independent-origin-bearer-token-256bit"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "teste" }] })
      });
      expect(resOk.status).toBe(200);

      // b) JWT com AUD errado -> 401 (fail-closed)
      const resWrongAud = await fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cf-Access-Jwt-Assertion": wrongAudJwt,
          "Authorization": "Bearer strong-independent-origin-bearer-token-256bit"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "teste" }] })
      });
      expect(resWrongAud.status).toBe(401);

      // c) JWT com ISS errado -> 401 (fail-closed)
      const resWrongIss = await fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cf-Access-Jwt-Assertion": wrongIssJwt,
          "Authorization": "Bearer strong-independent-origin-bearer-token-256bit"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "teste" }] })
      });
      expect(resWrongIss.status).toBe(401);

      // d) JWT sem claim exp -> 401 (fail-closed)
      const resNoExp = await fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cf-Access-Jwt-Assertion": missingExpJwt,
          "Authorization": "Bearer strong-independent-origin-bearer-token-256bit"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "teste" }] })
      });
      expect(resNoExp.status).toBe(401);

      // e) JWT expirado -> 401 (fail-closed)
      const resExpired = await fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cf-Access-Jwt-Assertion": expiredJwt,
          "Authorization": "Bearer strong-independent-origin-bearer-token-256bit"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "teste" }] })
      });
      expect(resExpired.status).toBe(401);

      // f) JWT válido mas Bearer inválido -> 401 (fail-closed)
      const resBadBearer = await fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cf-Access-Jwt-Assertion": validJwt,
          "Authorization": "Bearer wrong-bearer"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "teste" }] })
      });
      expect(resBadBearer.status).toBe(401);

      // g) Credencial sintética local (cf_svc_...) -> 401 (fail-closed)
      process.env.CF_ACCESS_CLIENT_ID = "cf_svc_synthetic_local_placeholder.access";
      const resSynthetic = await fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cf-Access-Jwt-Assertion": validJwt,
          "Authorization": "Bearer strong-independent-origin-bearer-token-256bit"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "teste" }] })
      });
      expect(resSynthetic.status).toBe(401);
    } finally {
      delete process.env.CF_ACCESS_ISSUER;
      await gateway.stop();
    }
  });

  it("7. Bloqueio de Token de Desenvolvimento Exposto e Rotas Não Autorizadas (Áudio/Admin)", async () => {
    const testPort = ++port;
    const mockLLM = new MockTestLLMProvider("HEALTHY");
    const router = new ProviderRouter({ llm: { primary: mockLLM } });

    // a) Tentar configurar o token de teste legado exposto -> deve rejeitar com 401
    process.env.AETERNUM_AI_GATEWAY_TOKEN = "atlas_connectivity_p0_secret_token_12345";
    const gateway = new AeternumAIGateway({
      port: testPort,
      host: "127.0.0.1",
      authMode: "BEARER_TOKEN",
      router,
      disableAudioRoutes: true
    });

    await gateway.start();
    try {
      const resRevoked = await fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer atlas_connectivity_p0_secret_token_12345"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "oi" }] })
      });
      expect(resRevoked.status).toBe(401);
      const jsonRevoked = await resRevoked.json();
      expect(jsonRevoked.error.message).toContain("revogado");

      // b) Com token novo forte, rotas de áudio (/v1/stt/*, /v1/tts/*) e /admin devem retornar 404
      process.env.AETERNUM_AI_GATEWAY_TOKEN = "fresh-production-grade-token-999888777";
      for (const blockedPath of ["/v1/stt/transcribe", "/v1/tts/synthesize", "/v1/tts/stream", "/admin", "/v1/tasks"]) {
        const resBlocked = await fetch(`${baseUrl(testPort)}${blockedPath}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer fresh-production-grade-token-999888777"
          },
          body: JSON.stringify({})
        });
        expect(resBlocked.status).toBe(404);
      }
    } finally {
      await gateway.stop();
    }
  });

  it("8. Etapa B Hardening: iat obrigatório, rejeição de alg none/HS256, desambiguação de Tunnel UUID vs Client ID e Fail-Closed sem chave pública", async () => {
    const testPort = ++port;
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" }
    });

    const expectedAud = "82235e19823a4d91df317f7b9edbba27d6ad84e6b4bbdb9b1ec7971ecd0114da";
    const expectedClientId = "a1b2c3d4e5f60718293a4b5c6d7e8f90.access";
    const expectedIssuer = "https://raspy-flower-ca52.cloudflareaccess.com";

    process.env.CF_ACCESS_JWT_PUBLIC_KEY = publicKey;
    process.env.CF_ACCESS_AUD = expectedAud;
    process.env.CF_ACCESS_TEAM_DOMAIN = "https://raspy-flower-ca52.cloudflareaccess.com/";
    process.env.CF_ACCESS_CLIENT_ID = expectedClientId;
    process.env.AETERNUM_AI_GATEWAY_TOKEN = "strong-independent-origin-bearer-token-256bit";

    const signCustomJwt = (headerObj: Record<string, unknown>, payloadObj: Record<string, unknown>) => {
      const headerB64 = Buffer.from(JSON.stringify(headerObj)).toString("base64url");
      const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
      const sig = crypto.sign("RSA-SHA256", Buffer.from(`${headerB64}.${payloadB64}`), privateKey).toString("base64url");
      return `${headerB64}.${payloadB64}.${sig}`;
    };

    const nowSec = Math.floor(Date.now() / 1000);

    // 1. Sem claim iat -> 401
    const noIatJwt = signCustomJwt(
      { alg: "RS256", typ: "JWT" },
      { aud: [expectedAud], common_name: expectedClientId, exp: nowSec + 3600, iss: expectedIssuer }
    );

    // 2. Claim iat no futuro -> 401
    const futureIatJwt = signCustomJwt(
      { alg: "RS256", typ: "JWT" },
      { aud: [expectedAud], common_name: expectedClientId, exp: nowSec + 3600, iat: nowSec + 600, iss: expectedIssuer }
    );

    // 3. Algoritmo inesperado (HS256 / none) -> 401
    const algNoneJwt = `${Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url")}.${Buffer.from(
      JSON.stringify({ aud: [expectedAud], common_name: expectedClientId, exp: nowSec + 3600, iat: nowSec - 5, iss: expectedIssuer })
    ).toString("base64url")}.sig`;

    // 4. JWT válido
    const validJwt = signCustomJwt(
      { alg: "RS256", typ: "JWT" },
      { aud: [expectedAud], common_name: expectedClientId, exp: nowSec + 3600, iat: nowSec - 5, iss: expectedIssuer }
    );

    const mockLLM = new MockTestLLMProvider("HEALTHY");
    const router = new ProviderRouter({ llm: { primary: mockLLM } });
    const gateway = new AeternumAIGateway({
      port: testPort,
      host: "127.0.0.1",
      authMode: "HYBRID_AUTH",
      router,
      disableAudioRoutes: true
    });

    await gateway.start();
    try {
      for (const badToken of [noIatJwt, futureIatJwt, algNoneJwt]) {
        const res = await fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cf-Access-Jwt-Assertion": badToken,
            "Authorization": "Bearer strong-independent-origin-bearer-token-256bit"
          },
          body: JSON.stringify({ messages: [{ role: "user", content: "teste" }] })
        });
        expect(res.status).toBe(401);
      }

      // 5. Tunnel UUID configurado acidentalmente em CF_ACCESS_CLIENT_ID -> 401 Fail-Closed
      process.env.CF_ACCESS_CLIENT_ID = "b1fd6c11-0405-4cae-9f86-a986a99bc0b3";
      const resTunnelUuid = await fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cf-Access-Jwt-Assertion": validJwt,
          "Authorization": "Bearer strong-independent-origin-bearer-token-256bit"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "teste" }] })
      });
      expect(resTunnelUuid.status).toBe(401);
      const errJson = await resTunnelUuid.json();
      expect(errJson.error.message).toContain("UUID de túnel");

      // Restaurar Client ID válido, mas simular indisponibilidade de chave pública RS256 da Cloudflare
      process.env.CF_ACCESS_CLIENT_ID = expectedClientId;
      delete process.env.CF_ACCESS_JWT_PUBLIC_KEY;
      const resNoPubKey = await fetch(`${baseUrl(testPort)}/v1/llm/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cf-Access-Jwt-Assertion": validJwt,
          "Authorization": "Bearer strong-independent-origin-bearer-token-256bit"
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "teste" }] })
      });
      expect(resNoPubKey.status).toBe(401);
    } finally {
      delete process.env.CF_ACCESS_TEAM_DOMAIN;
      await gateway.stop();
    }
  });
});

