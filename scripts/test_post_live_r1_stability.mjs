// scripts/test_post_live_r1_stability.mjs
// Phase: AETERNUM-ATLAS-AI-POST-LIVE-R1
// Immediate stability snapshots & operational health audit

import fs from 'node:fs';

const PROD_SUPABASE_URL = "https://hyivyrietgjdazgizafp.supabase.co";
const PROD_EDGE_URL = `${PROD_SUPABASE_URL}/functions/v1/ai-tutor`;
const PROD_GATEWAY_URL = "https://aeternum-ai-gateway-prod.onrender.com";
const PROD_ORIGIN = "https://www.aeternumatlas.com";

const sbToken = process.env.SUPABASE_STAGING_ACCESS_TOKEN;
if (!sbToken) {
  console.error("Missing SUPABASE_STAGING_ACCESS_TOKEN");
  process.exit(1);
}

// 1. Get Production anon key
const keysRes = await fetch("https://api.supabase.com/v1/projects/hyivyrietgjdazgizafp/api-keys", {
  headers: { Authorization: "Bearer " + sbToken }
});
const keys = await keysRes.json();
const anonKey = keys.find(k => k.name === "anon")?.api_key;

// 2. Sign in with QA User
const { createClient } = await import("@supabase/supabase-js");
const sb = createClient(PROD_SUPABASE_URL, anonKey);
const { data: authData, error: authErr } = await sb.auth.signInWithPassword({
  email: "atlas-e2e-ai-tutor@aeternumatlas.com",
  password: process.env.AETERNUM_STAGING_QA_PASSWORD
});
if (authErr || !authData?.session?.access_token) {
  console.error("Auth failed:", authErr);
  process.exit(1);
}
const userToken = authData.session.access_token;
console.log("Logged in to Production as QA user:", authData.user.email);

const snapshots = [];

async function callProdAi(body, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    "Origin": options.origin || PROD_ORIGIN,
    "apikey": anonKey,
    ...(options.noAuth ? {} : { "Authorization": options.authHeader || `Bearer ${userToken}` })
  };
  const res = await fetch(PROD_EDGE_URL, {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body)
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    data,
    knowledgeState: res.headers.get("x-aeternum-knowledge-state"),
    aiCalls: parseInt(res.headers.get("x-aeternum-ai-calls") || "0", 10)
  };
}

console.log("\n=====================================================================");
console.log("RUNNING POST-LIVE R1 STABILITY AUDIT (5 SNAPSHOTS)");
console.log("=====================================================================\n");

// Snapshot 1: Infrastructure & Endpoint Health
console.log("--> Snapshot 1: Infrastructure & Endpoint Health");
const s1_gateway = await fetch(`${PROD_GATEWAY_URL}/health`);
const s1_gw_json = await s1_gateway.json();
const s1_frontend = await fetch(PROD_ORIGIN);
console.log(`  Gateway Health: HTTP ${s1_gateway.status} - Status: ${s1_gw_json.status}, Mode: ${s1_gw_json.mode}`);
console.log(`  Frontend Health: HTTP ${s1_frontend.status} (Vercel Production)`);
snapshots.push({
  id: "SNAP-01",
  name: "Infrastructure Health",
  pass: s1_gateway.status === 200 && s1_gw_json.status === "HEALTHY" && s1_frontend.status === 200
});

// Snapshot 2: Safe Engine Deterministic Performance
console.log("\n--> Snapshot 2: Safe Engine Deterministic Performance");
const s2_start = performance.now();
const s2_res = await callProdAi({ prompt: "O que é a clavícula?" });
const s2_lat = Math.round(performance.now() - s2_start);
console.log(`  Deterministic query: HTTP ${s2_res.status}, State: ${s2_res.knowledgeState}, Latency: ${s2_lat}ms, AI-Calls: ${s2_res.aiCalls}`);
snapshots.push({
  id: "SNAP-02",
  name: "Safe Engine Deterministic",
  pass: s2_res.status === 200 && s2_res.knowledgeState === "DETERMINISTIC_CANONICAL" && s2_res.aiCalls === 0
});

// Snapshot 3: Sovereign RAG & Cloud Gateway Synthesis
console.log("\n--> Snapshot 3: Sovereign RAG & Cloud Gateway Synthesis");
const s3_start = performance.now();
const s3_res = await callProdAi({ prompt: "Como se organiza o mediastino superior e quais estruturas o atravessam?" });
const s3_lat = Math.round(performance.now() - s3_start);
console.log(`  RAG query: HTTP ${s3_res.status}, State: ${s3_res.knowledgeState}, Latency: ${s3_lat}ms, AI-Calls: ${s3_res.aiCalls}`);
snapshots.push({
  id: "SNAP-03",
  name: "Sovereign RAG & Cloud Gateway",
  pass: s3_res.status === 200 && s3_res.knowledgeState === "SOURCE_GROUNDED_SYNTHESIS" && s3_res.aiCalls === 1
});

// Snapshot 4: Authentication & Perimeter Security Guard
console.log("\n--> Snapshot 4: Authentication & Perimeter Security Guard");
const s4_missing = await callProdAi({ prompt: "Teste" }, { noAuth: true });
const s4_anon = await callProdAi({ prompt: "Teste" }, { authHeader: `Bearer ${anonKey}` });
const s4_cors = await callProdAi({ prompt: "Teste" }, { origin: "https://evil.attacker.com" });
console.log(`  Missing Auth: HTTP ${s4_missing.status} (Expected 401)`);
console.log(`  Anon Bearer: HTTP ${s4_anon.status} (Expected 401)`);
console.log(`  Untrusted Origin: HTTP ${s4_cors.status} (Expected 403)`);
snapshots.push({
  id: "SNAP-04",
  name: "Auth & Perimeter Security",
  pass: s4_missing.status === 401 && s4_anon.status === 401 && s4_cors.status === 403
});

// Snapshot 5: Anatomical Safety, False Premise & B2 Quarantine Guard
console.log("\n--> Snapshot 5: Anatomical Safety, False Premise & B2 Quarantine Guard");
const s5_fp = await callProdAi({ prompt: "A clavícula se articula com a tíbia?" });
const s5_b2 = await callProdAi({ prompt: "Explique o padrão experimental EXP-UL-B2" });
console.log(`  False Premise Refusal: HTTP ${s5_fp.status}, State: ${s5_fp.knowledgeState}`);
console.log(`  B2 Quarantine Probe: HTTP ${s5_b2.status}, State: ${s5_b2.knowledgeState}`);
snapshots.push({
  id: "SNAP-05",
  name: "Anatomical & B2 Quarantine Guard",
  pass: s5_fp.status === 200 && s5_b2.status === 200 && !JSON.stringify(s5_b2.data).includes("EXP-UL-B2-APPROVED")
});

console.log("\n=====================================================================");
console.log("POST-LIVE R1 STABILITY AUDIT SUMMARY");
console.log("=====================================================================");
const passCount = snapshots.filter(s => s.pass).length;
snapshots.forEach(s => {
  console.log(`  [${s.pass ? "✅ PASS" : "❌ FAIL"}] ${s.id}: ${s.name}`);
});
console.log(`\nOVERALL POST-LIVE R1 HEALTH: ${passCount} / ${snapshots.length} PASS`);

if (passCount !== snapshots.length) {
  console.error("POST-LIVE R1 STABILITY FAILURE!");
  process.exit(1);
} else {
  console.log("\nSTATUS=VERIFIED_AETERNUM_ATLAS_POST_LIVE_R1_HEALTHY");
}
