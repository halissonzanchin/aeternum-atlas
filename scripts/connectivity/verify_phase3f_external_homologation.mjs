import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import dns from "node:dns/promises";

const vaultPath = path.join(os.homedir(), ".cloudflared", ".gateway.env");
const vault = {};
if (fs.existsSync(vaultPath)) {
  for (const line of fs.readFileSync(vaultPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx > 0) {
      vault[t.slice(0, idx).trim()] = t.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
}

const hostname = "atlas-code.aeternumatlas.com";
const targetUrl = `https://${hostname}/v1/llm/generate`;

console.log("=================================================================");
console.log("  ETAPA D: HOMOLOGACAO EXTERNA HTTPS PONTA A PONTA               ");
console.log("=================================================================");

let dnsResolved = false;
let resolvedAddresses = [];
try {
  const resolver = new dns.Resolver();
  resolver.setServers(["1.1.1.1", "8.8.8.8"]);
  resolvedAddresses = await resolver.resolve4(hostname);
  dnsResolved = resolvedAddresses.length > 0;
} catch {
  dnsResolved = false;
}

if (!dnsResolved) {
  console.log(`[DNS] ${hostname} -> NXDOMAIN (Public Hostname ainda nao salvo no painel Cloudflare Zero Trust).`);
  console.log(`[STATUS] Testes HTTPS externos registrados como BLOCKED (aguardando acao manual de 30s no painel Cloudflare).`);
  process.exit(0);
}

console.log(`[DNS] ${hostname} -> RESOLVIDO (${resolvedAddresses.join(", ")})`);

async function probeExternal(name, headers) {
  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Qual nervo inerva o músculo diafragma?" }],
        maxTokens: 120
      }),
      redirect: "manual"
    });
    return { name, status: res.status, location: res.headers.get("location") || "", body: await res.text().catch(() => "") };
  } catch (err) {
    return { name, status: 0, error: err?.message || String(err) };
  }
}

// 1. Sem credenciais -> Deve bloquear na borda Cloudflare Access (302 para login ou 403)
const r1 = await probeExternal("1. Sem credenciais", {});
// 2. Client ID desconhecido -> Bloqueada
const r2 = await probeExternal("2. Client ID desconhecido", {
  "CF-Access-Client-Id": "00000000000000000000000000000000.access",
  "CF-Access-Client-Secret": "invalid-secret"
});
// 3. Client Secret incorreto -> Bloqueada
const r3 = await probeExternal("3. Client Secret incorreto", {
  "CF-Access-Client-Id": vault.CF_ACCESS_CLIENT_ID || "",
  "CF-Access-Client-Secret": "wrong-client-secret-value"
});
// 4. Apenas Bearer, sem Access -> Bloqueada na borda Cloudflare
const r4 = await probeExternal("4. Apenas Bearer, sem Access", {
  Authorization: `Bearer ${vault.AETERNUM_AI_GATEWAY_TOKEN || ""}`
});

for (const r of [r1, r2, r3, r4]) {
  const blocked = r.status === 302 || r.status === 401 || r.status === 403;
  console.log(`[${blocked ? "PASS" : "FAIL"}] ${r.name} -> HTTP ${r.status}`);
}

const envSecret = process.env.CF_ACCESS_CLIENT_SECRET || "";
if (!envSecret) {
  console.log("[BLOCKED] 8 & 9. Access valido + Bearer valido -> CF_ACCESS_CLIENT_SECRET pertence exclusivamente ao backend Supabase (ausente no notebook por seguranca).");
} else {
  const rPosBadBearer = await probeExternal("7. Access valido, mas Bearer incorreto", {
    "CF-Access-Client-Id": vault.CF_ACCESS_CLIENT_ID || "",
    "CF-Access-Client-Secret": envSecret,
    Authorization: "Bearer wrong-origin-bearer"
  });
  console.log(`[${rPosBadBearer.status === 401 ? "PASS" : "FAIL"}] ${rPosBadBearer.name} -> HTTP ${rPosBadBearer.status}`);

  const rPosOk = await probeExternal("8 & 9. Access valido + Bearer valido (Inferencia Real Ollama)", {
    "CF-Access-Client-Id": vault.CF_ACCESS_CLIENT_ID || "",
    "CF-Access-Client-Secret": envSecret,
    Authorization: `Bearer ${vault.AETERNUM_AI_GATEWAY_TOKEN || ""}`
  });
  console.log(`[${rPosOk.status === 200 ? "PASS" : "FAIL"}] ${rPosOk.name} -> HTTP ${rPosOk.status}`);
}
console.log("=================================================================");
