import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { AeternumAIGateway } from "../../packages/aeternum-vita/src/gateway/index.ts";
import { ProviderRouter } from "../../packages/aeternum-vita/src/providers/router/index.ts";
import { AtlasDaemonLLMProvider } from "../../packages/aeternum-vita/src/providers/local/atlas-daemon/AtlasDaemonLLMProvider.ts";
import { validateGatewayAuth } from "../../packages/aeternum-vita/src/gateway/middleware/auth.ts";
import { handleAiTutorRequest } from "../../supabase/functions/ai-tutor/index.ts";

const vaultPath = path.join(os.homedir(), ".cloudflared", ".gateway.env");
const certCachePath = path.join(os.homedir(), ".cloudflared", ".cf_access_public_certs.pem");

const vault = {};
for (const line of fs.readFileSync(vaultPath, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const idx = t.indexOf("=");
  if (idx > 0) {
    vault[t.slice(0, idx).trim()] = t.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
  }
}

const cachedCfPem = fs.existsSync(certCachePath) ? fs.readFileSync(certCachePath, "utf8").trim() : "";

function getGpuAndProcessMetrics() {
  let gpuInfo = "N/A";
  try {
    gpuInfo = execFileSync(
      "nvidia-smi",
      ["--query-gpu=name,memory.used,memory.total,utilization.gpu", "--format=csv,noheader,nounits"],
      { encoding: "utf8", timeout: 4000 }
    ).trim();
  } catch {}

  let procInfo = [];
  try {
    const raw = execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        "Get-Process | Where-Object { $_.ProcessName -match 'ollama|atlas-daemon|cloudflared' } | Select-Object ProcessName, Id, @{N='WorkingSetMB';E={[math]::Round($_.WorkingSet64 / 1MB, 1)}}, @{N='CPU_s';E={[math]::Round($_.CPU, 2)}} | ConvertTo-Json -Compress"
      ],
      { encoding: "utf8", timeout: 5000 }
    ).trim();
    if (raw) {
      const parsed = JSON.parse(raw);
      procInfo = Array.isArray(parsed) ? parsed : [parsed];
    }
  } catch {}

  return { gpuInfo, procInfo };
}

console.log("=================================================================");
console.log("  ETAPAS D, E & F: BENCHMARK REAL E HOMOLOGACAO CONTROLADA       ");
console.log("=================================================================");

// 1. Medição de Latência Pura de Autenticação Híbrida (RS256 + X.509 + TimingSafe Bearer)
const { publicKey: benchPubPem, privateKey: benchPrivPem } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" }
});

const normalizedIssuer = vault.CF_ACCESS_TEAM_DOMAIN.replace(/\/$/, "");
const nowSec = Math.floor(Date.now() / 1000);

process.env.CF_ACCESS_TEAM_DOMAIN = vault.CF_ACCESS_TEAM_DOMAIN;
process.env.CF_ACCESS_ISSUER = normalizedIssuer;
process.env.CF_ACCESS_AUD = vault.CF_ACCESS_AUD;
process.env.CF_ACCESS_CLIENT_ID = vault.CF_ACCESS_CLIENT_ID;
process.env.CF_ACCESS_REQUIRE_JWT = "true";
process.env.AETERNUM_AI_GATEWAY_TOKEN = vault.AETERNUM_AI_GATEWAY_TOKEN;
process.env.CF_ACCESS_JWT_PUBLIC_KEY = `${cachedCfPem}\n${benchPubPem}`;

const signBenchJwt = (payload) => {
  const h = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const p = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const s = crypto.sign("RSA-SHA256", Buffer.from(`${h}.${p}`), benchPrivPem).toString("base64url");
  return `${h}.${p}.${s}`;
};

const validJwt = signBenchJwt({
  aud: [vault.CF_ACCESS_AUD],
  iss: normalizedIssuer,
  common_name: vault.CF_ACCESS_CLIENT_ID,
  exp: nowSec + 3600,
  iat: nowSec - 5,
  nbf: nowSec - 5,
  type: "app"
});

const authIterations = 50;
const tAuth0 = performance.now();
for (let i = 0; i < authIterations; i++) {
  const r = validateGatewayAuth(
    {
      headers: {
        "cf-access-jwt-assertion": validJwt,
        authorization: `Bearer ${vault.AETERNUM_AI_GATEWAY_TOKEN}`
      },
      socket: { remoteAddress: "127.0.0.1" }
    },
    "HYBRID_AUTH"
  );
  if (!r.authenticated) throw new Error("Falha inesperada no benchmark de auth");
}
const avgAuthLatencyMs = Number(((performance.now() - tAuth0) / authIterations).toFixed(3));
console.log(`[1] Latencia Media de Validacao HYBRID_AUTH (RS256 + X.509 + Bearer): ${avgAuthLatencyMs} ms`);

// 2. Subir instância controlada de Gateway na porta 18081 apontando para o Atlas Daemon real (127.0.0.1:14555) e Ollama real (127.0.0.1:11434)
const realProvider = new AtlasDaemonLLMProvider({
  daemonBaseUrl: "http://127.0.0.1:14555",
  targetModel: "qwen3.5:4b",
  requestTimeoutMs: 45000
});
const router = new ProviderRouter({
  llm: { primary: realProvider }
});
const benchGateway = new AeternumAIGateway({
  port: 18081,
  host: "127.0.0.1",
  authMode: "HYBRID_AUTH",
  mode: "local_first",
  router,
  disableAudioRoutes: true,
  requestTimeoutMs: 45000,
  concurrency: {
    maxConcurrent: 1,
    maxQueueSize: 1,
    queueTimeoutMs: 30000
  }
});

await benchGateway.start();

try {
  const baselineHw = getGpuAndProcessMetrics();
  console.log(`[2] Hardware Baseline (Antes da Inferencia): GPU=[${baselineHw.gpuInfo}]`);

  // 3. Inferência Anatômica Real Unária via Gateway -> Atlas Code (14555) -> Ollama (11434, qwen3.5:4b)
  const tUnary0 = performance.now();
  const unaryRes = await fetch("http://127.0.0.1:18081/v1/llm/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cf-Access-Jwt-Assertion": validJwt,
      Authorization: `Bearer ${vault.AETERNUM_AI_GATEWAY_TOKEN}`
    },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: "Em até duas frases diretas, quais raízes nervosas formam o plexo braquial e qual região ele inerva?"
        }
      ],
      temperature: 0.2,
      maxTokens: 160
    })
  });
  const totalUnaryMs = Math.round(performance.now() - tUnary0);
  const unaryData = await unaryRes.json();
  const answerText = unaryData?.data?.text || "";
  const completionTokens = unaryData?.data?.usage?.completionTokens || Math.ceil(answerText.split(/\s+/).length * 1.3);
  const tokensPerSec = Number(((completionTokens / Math.max(totalUnaryMs, 1)) * 1000).toFixed(2));

  console.log(`[3] Inferencia Anatomica Real (Gateway -> Atlas Code -> Ollama qwen3.5:4b):`);
  console.log(`    - HTTP Status      : ${unaryRes.status}`);
  console.log(`    - Provedor Final   : ${unaryData?.metadata?.finalProvider} (model=${unaryData?.data?.modelId})`);
  console.log(`    - Tempo Total      : ${totalUnaryMs} ms`);
  console.log(`    - Tokens Estimados : ${completionTokens} tokens (~${tokensPerSec} tok/s)`);
  console.log(`    - Resposta (trecho): "${answerText.replace(/\s+/g, " ").slice(0, 160)}..."`);

  // 4. Streaming SSE & Medição de TTFT (Time to First Token)
  const tStream0 = performance.now();
  let ttftMs = null;
  let chunkCount = 0;
  let streamedChars = 0;
  const streamRes = await fetch("http://127.0.0.1:18081/v1/llm/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cf-Access-Jwt-Assertion": validJwt,
      Authorization: `Bearer ${vault.AETERNUM_AI_GATEWAY_TOKEN}`
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Qual nervo inerva o músculo deltoide?" }],
      temperature: 0.2,
      maxTokens: 100
    })
  });

  const reader = streamRes.body.getReader();
  const decoder = new TextDecoder();
  let done = false;
  while (!done) {
    const { value, done: d } = await reader.read();
    done = d;
    if (value) {
      if (ttftMs === null) {
        ttftMs = Math.round(performance.now() - tStream0);
      }
      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split("\n").filter((l) => l.startsWith("data: "));
      chunkCount += lines.length;
      streamedChars += chunkStr.length;
    }
  }
  const totalStreamMs = Math.round(performance.now() - tStream0);
  console.log(`[4] Streaming SSE (/v1/llm/stream): Status=${streamRes.status} | TTFT=${ttftMs} ms | Total=${totalStreamMs} ms | Eventos SSE=${chunkCount}`);

  // 5. Fluxo Completo Edge Function ai-tutor -> Gateway -> Atlas Daemon -> Ollama
  const mockSupabaseFactory = () => ({
    auth: {
      async getUser() {
        return { data: { user: { id: "uuid-halisson-canary-001" } }, error: null };
      }
    },
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return {
                    data: {
                      id: "uuid-halisson-canary-001",
                      institution_id: "inst-aeternum-001",
                      role: "student",
                      status: "active",
                      name: "Halisson"
                    },
                    error: null
                  };
                }
              };
            }
          };
        }
      };
    },
    async rpc(fnName) {
      if (fnName === "consume_ai_rate_limit") {
        return { data: [{ allowed: true, retry_after_seconds: 0 }], error: null };
      }
      if (fnName === "match_vita_sovereign_knowledge") {
        return {
          data: [
            {
              id: "src-latarjet-axila",
              book_title: "Latarjet & Ruiz Liard — Anatomia Humana",
              page_number: 518,
              content:
                "O nervo axilar (C5, C6) origina-se do fascículo posterior do plexo braquial, atravessa o espaço quadrangular acompanhado pela artéria circunflexa posterior do úmero e inerva os músculos deltoide e redondo menor.",
              lexical_rank: 0.98,
              retrieval_stage: 1,
              metadata: { chapter: "Nervos do Membro Superior" }
            }
          ],
          error: null
        };
      }
      return { data: [], error: null };
    }
  });

  // Fetch wrapper que simula a borda Cloudflare Access injetando o Cf-Access-Jwt-Assertion após validar CF-Access-Client-Id/Secret
  const edgeBridgeFetch = async (url, init = {}) => {
    const headers = new Headers(init.headers || {});
    if (headers.get("CF-Access-Client-Id") === vault.CF_ACCESS_CLIENT_ID && headers.get("CF-Access-Client-Secret")) {
      headers.set("Cf-Access-Jwt-Assertion", validJwt);
    }
    return fetch(url, { ...init, headers });
  };

  const tTutor0 = performance.now();
  const tutorReq = new Request("https://supabase.aeternumatlas.com/functions/v1/ai-tutor", {
    method: "POST",
    headers: {
      Origin: "https://www.aeternumatlas.com",
      Authorization: "Bearer supabase-student-session-jwt",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: "Descreva a origem fascicular, o trajeto pelo espaço quadrangular e os músculos inervados pelo nervo axilar."
        }
      ]
    })
  });

  const tutorRes = await handleAiTutorRequest(tutorReq, {
    env: {
      SUPABASE_URL: "https://mock.supabase.co",
      SUPABASE_ANON_KEY: "anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      ATLAS_LOCAL_AI_ENABLED: "true",
      ATLAS_LOCAL_AI_ALLOWLIST_UUIDS: "uuid-halisson-canary-001",
      ATLAS_LOCAL_GATEWAY_URL: "http://127.0.0.1:18081",
      ATLAS_LOCAL_GATEWAY_TOKEN: vault.AETERNUM_AI_GATEWAY_TOKEN,
      CF_ACCESS_CLIENT_ID: vault.CF_ACCESS_CLIENT_ID,
      CF_ACCESS_CLIENT_SECRET: "simulated-supabase-edge-secret"
    },
    createClient: mockSupabaseFactory,
    fetchFn: edgeBridgeFetch
  });
  const totalTutorMs = Math.round(performance.now() - tTutor0);
  const tutorJson = await tutorRes.json();
  console.log(`[5] Pipeline Completo (ai-tutor -> Access -> Gateway -> Atlas Code -> Ollama):`);
  console.log(`    - HTTP Status      : ${tutorRes.status}`);
  console.log(`    - Routing Header   : ${tutorRes.headers.get("X-Aeternum-AI-Routing")}`);
  console.log(`    - Source Header    : ${tutorRes.headers.get("X-Aeternum-AI-Source")}`);
  console.log(`    - Model Header     : ${tutorRes.headers.get("X-Aeternum-AI-Model")}`);
  console.log(`    - Fallback Header  : ${tutorRes.headers.get("X-Aeternum-AI-Fallback")}`);
  console.log(`    - Latencias (ms)   : ${JSON.stringify(tutorJson.latencies)} (Total=${totalTutorMs} ms)`);

  // 6. Teste de Cancelamento / Desconexão em Tempo Real
  const abortCtrl = new AbortController();
  const tCancel0 = performance.now();
  setTimeout(() => abortCtrl.abort(), 40);
  let cancelStatus = "NONE";
  try {
    await fetch("http://127.0.0.1:18081/v1/llm/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cf-Access-Jwt-Assertion": validJwt,
        Authorization: `Bearer ${vault.AETERNUM_AI_GATEWAY_TOKEN}`
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Explique a anatomia do coração." }]
      }),
      signal: abortCtrl.signal
    });
  } catch (err) {
    cancelStatus = err.name || "Aborted";
  }
  const cancelDurationMs = Math.round(performance.now() - tCancel0);
  await new Promise((r) => setTimeout(r, 150));
  const postCancelMetrics = benchGateway.getConcurrencyMetrics();
  console.log(`[6] Cancelamento de Requisicao (AbortController): Status=${cancelStatus} em ${cancelDurationMs} ms | Fila apos abort: active=${postCancelMetrics.activeCount}, queued=${postCancelMetrics.queueLength}`);

  const afterHw = getGpuAndProcessMetrics();
  console.log(`[7] Hardware Pos-Inferencia: GPU=[${afterHw.gpuInfo}]`);
  console.log(`    Processos Ativos: ${JSON.stringify(afterHw.procInfo)}`);
} finally {
  await benchGateway.stop();
}
console.log("=================================================================");
