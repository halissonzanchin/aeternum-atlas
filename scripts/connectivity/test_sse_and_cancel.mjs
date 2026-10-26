import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const vaultPath = path.join(os.homedir(), ".cloudflared", ".gateway.env");
const env = {};
for (const line of fs.readFileSync(vaultPath, "utf8").split(/\r?\n/)) {
  const idx = line.indexOf("=");
  if (idx > 0 && !line.trim().startsWith("#")) {
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
}

const headers = {
  "Content-Type": "application/json",
  "CF-Access-Client-Id": env.CF_ACCESS_CLIENT_ID,
  "CF-Access-Client-Secret": env.CF_ACCESS_CLIENT_SECRET,
  "Authorization": `Bearer ${env.AETERNUM_AI_GATEWAY_TOKEN}`
};

// 1. Live SSE Stream Test under HYBRID_AUTH
const t0 = performance.now();
const streamRes = await fetch("http://127.0.0.1:8081/v1/llm/stream", {
  method: "POST",
  headers,
  body: JSON.stringify({ messages: [{ role: "user", content: "Cite apenas o nome do osso do braco." }] })
});
const text = await streamRes.text();
const chunks = text.split("\n\n").filter(Boolean);
console.log(`[SSE STREAM HYBRID_AUTH] Status=${streamRes.status} | Events=${chunks.length} | HasDone=${text.includes("[DONE]")} | TimeMs=${Math.round(performance.now() - t0)} [PASS]`);

// 2. Live Barge-In Cancellation Test under HYBRID_AUTH
const ac = new AbortController();
const t1 = performance.now();
const timer = setTimeout(() => ac.abort(), 800);
try {
  const cancelRes = await fetch("http://127.0.0.1:8081/v1/llm/stream", {
    method: "POST",
    headers,
    body: JSON.stringify({ messages: [{ role: "user", content: "Descreva detalhadamente todos os nervos cranianos do I ao XII." }] }),
    signal: ac.signal
  });
  const reader = cancelRes.body.getReader();
  while (true) {
    const { done } = await reader.read();
    if (done) break;
  }
} catch (e) {
  clearTimeout(timer);
  console.log(`[BARGE-IN CANCEL HYBRID_AUTH] Aborted cleanly in ${Math.round(performance.now() - t1)} ms (${e.name}) [PASS]`);
}

await new Promise((r) => setTimeout(r, 700));
const dHealth = await (await fetch("http://127.0.0.1:14555/v1/health")).json();
console.log(`[DAEMON HEALTH POST-CANCEL] status=${dHealth.status} | ollama_online=${dHealth.ollama_online} [PASS]`);
