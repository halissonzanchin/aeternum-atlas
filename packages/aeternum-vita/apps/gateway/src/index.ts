import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { AeternumAIGateway } from "../../../src/gateway/index.ts";
import { ProviderRouter } from "../../../src/providers/router/index.ts";
import {
  AtlasDaemonLLMProvider,
  SpeachesSTTProvider,
  SpeachesTTSProvider,
  GeminiLLMProvider,
  DeepgramSTTProvider,
  CartesiaTTSProvider
} from "../../../src/providers/index.ts";
import { loadLocalCloudEnv } from "../../../src/providers/cloud/localSecretLoader.ts";

import { execFileSync } from "node:child_process";

function loadGatewayVaultEnv(): void {
  const vaultPath = process.env.ATLAS_GATEWAY_VAULT_FILE || path.join(os.homedir(), ".cloudflared", ".gateway.env");
  if (!fs.existsSync(vaultPath)) return;
  const content = fs.readFileSync(vaultPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[k] && v.length > 0) {
        process.env[k] = v;
      }
    }
  }
}

async function fetchJsonWithSystemCaFallback(url: string): Promise<any> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (res.ok) return await res.json();
  } catch {
    // Fallback para curl.exe nativo do Windows (usa Schannel / Windows Root Trust Store quando há antivírus/proxy TLS local)
  }
  const raw = execFileSync("curl.exe", ["-s", "--fail", "--max-time", "8", url], { encoding: "utf8" });
  return JSON.parse(raw);
}

import { checkPemCertificateValidity } from "../../../src/gateway/middleware/auth.ts";

function filterValidPemCerts(rawPem: string): string[] {
  const blocks =
    rawPem.match(
      /-----BEGIN (?:PUBLIC KEY|RSA PUBLIC KEY|CERTIFICATE)-----[\s\S]*?-----END (?:PUBLIC KEY|RSA PUBLIC KEY|CERTIFICATE)-----/g
    ) || [];
  return blocks.map((b) => b.trim()).filter((b) => checkPemCertificateValidity(b).valid);
}

export async function syncCloudflareAccessPublicCerts(forceRefresh: boolean = false): Promise<void> {
  const rawTeam = (process.env.CF_ACCESS_ISSUER || process.env.CF_ACCESS_TEAM_DOMAIN || "").trim();
  if (!rawTeam || rawTeam.startsWith("__PENDING")) return;

  const cleanDomain = rawTeam.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  const issuer = cleanDomain.endsWith(".cloudflareaccess.com")
    ? `https://${cleanDomain}`
    : `https://${cleanDomain}.cloudflareaccess.com`;

  process.env.CF_ACCESS_ISSUER = issuer;

  const existingPem = (process.env.CF_ACCESS_JWT_PUBLIC_KEY || "").trim();
  if (!forceRefresh && existingPem && filterValidPemCerts(existingPem).length > 0) return;

  const cachePath = path.join(os.homedir(), ".cloudflared", ".cf_access_public_certs.pem");

  try {
    const certsUrl = `${issuer}/cdn-cgi/access/certs`;
    const data: any = await fetchJsonWithSystemCaFallback(certsUrl);
    const certs: string[] = [];
    if (Array.isArray(data?.public_certs)) {
      for (const c of data.public_certs) {
        if (typeof c?.cert === "string" && checkPemCertificateValidity(c.cert).valid) {
          certs.push(c.cert.trim());
        }
      }
    } else if (typeof data?.public_cert?.cert === "string" && checkPemCertificateValidity(data.public_cert.cert).valid) {
      certs.push(data.public_cert.cert.trim());
    }
    if (certs.length > 0) {
      const joinedPem = certs.join("\n");
      process.env.CF_ACCESS_JWT_PUBLIC_KEY = joinedPem;
      try {
        fs.writeFileSync(cachePath, joinedPem, "utf8");
      } catch { }
      console.log(`[Cloudflare Access] ${certs.length} certificado(s) RS256 carregado(s) e validado(s) com sucesso.`);
      return;
    }
  } catch (err: any) {
    if (fs.existsSync(cachePath)) {
      const cachedPem = fs.readFileSync(cachePath, "utf8").trim();
      const validCached = filterValidPemCerts(cachedPem);
      if (validCached.length > 0) {
        process.env.CF_ACCESS_JWT_PUBLIC_KEY = validCached.join("\n");
        console.log(`[Cloudflare Access] ${validCached.length} certificado(s) RS256 válido(s) carregado(s) do cache local seguro (.cf_access_public_certs.pem).`);
        return;
      }
    }
    // Fail-closed se não houver certificados válidos online nem em cache
    if (forceRefresh && existingPem && filterValidPemCerts(existingPem).length === 0) {
      delete process.env.CF_ACCESS_JWT_PUBLIC_KEY;
    }
    console.warn(`[Cloudflare Access] Aviso ao buscar certificados RS256: ${err?.message || "erro"}`);
  }
}

loadGatewayVaultEnv();
loadLocalCloudEnv();
await syncCloudflareAccessPublicCerts(false);

// Renovação periódica automática dos certificados públicos RS256 da Cloudflare (a cada 6h)
const certRefreshTimer = setInterval(() => {
  void syncCloudflareAccessPublicCerts(true);
}, 6 * 60 * 60 * 1000);
certRefreshTimer.unref();

const gatewayMode = (process.env.AETERNUM_AI_GATEWAY_MODE || "local_first").toLowerCase();
const allowPaidCloudFallback = process.env.ATLAS_ALLOW_PAID_CLOUD_FALLBACK === "true";

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
        primary: new AtlasDaemonLLMProvider({
          daemonBaseUrl: process.env.ATLAS_DAEMON_BASE_URL || "http://127.0.0.1:14555",
          targetModel: process.env.ATLAS_TARGET_MODEL || "qwen3.5:4b",
          authToken: process.env.ATLAS_DAEMON_AUTH_TOKEN
        }),
        fallback: allowPaidCloudFallback ? new GeminiLLMProvider({ modelId: "gemini-3.7-flash" }) : undefined
      },
      stt: {
        primary: new SpeachesSTTProvider({
          modelId: "Systran/faster-whisper-small",
          baseUrl: "http://127.0.0.1:8000",
          apiKey: process.env.SPEECH_API_KEY
        }),
        fallback: allowPaidCloudFallback ? new DeepgramSTTProvider({ modelId: "nova-3" }) : undefined
      },
      tts: {
        primary: new SpeachesTTSProvider({
          baseUrl: "http://127.0.0.1:8000",
          apiKey: process.env.SPEECH_API_KEY
        }),
        fallback: allowPaidCloudFallback
          ? new CartesiaTTSProvider({
              modelId: "sonic-3",
              apiVersion: "2026-08-14"
            })
          : undefined
      }
    };

const router = new ProviderRouter(routerConfig);

// Invariante de Segurança P0: bind estritamente em 127.0.0.1:8081 para gateway intermediário local
const port = Number(process.env.AETERNUM_AI_GATEWAY_PORT || process.env.PORT) || 8081;
const host = "127.0.0.1";
const authMode = (process.env.AETERNUM_AI_GATEWAY_AUTH_MODE as any) || "HYBRID_AUTH";

const gateway = new AeternumAIGateway({
  port,
  host,
  authMode,
  mode: gatewayMode,
  router,
  disableAudioRoutes: process.env.ATLAS_ALLOW_AUDIO !== "true",
  concurrency: {
    maxConcurrent: Number(process.env.ATLAS_MAX_CONCURRENT || 1),
    maxQueueSize: Number(process.env.ATLAS_MAX_QUEUE_SIZE || 1),
    queueTimeoutMs: Number(process.env.ATLAS_QUEUE_TIMEOUT_MS || 25000)
  }
});

gateway.start().then(() => {
  console.log(`Aeternum AI Gateway rodando em http://${host}:${port} (mode=${gatewayMode}, authMode=${authMode})`);
});

