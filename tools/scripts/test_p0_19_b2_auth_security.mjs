import fs from "fs";

// P0.19-B.2: EDGE FUNCTION INTERNAL AUTHENTICATION & SECURITY AUDIT
// Target: https://hyivyrietgjdazgizafp.supabase.co/functions/v1/ai-tutor
// Strict TLS enabled with Windows Root Store (--use-system-ca)

const EDGE_FN_URL = "https://hyivyrietgjdazgizafp.supabase.co/functions/v1/ai-tutor";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXZ5cmlldGdqZGF6Z2l6YWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMDA2NjIsImV4cCI6MjA1ODY3NjY2Mn0.a45jYvKevg9dJ6wP7mP-gP5f3c5P4p7o7Y-7f7o7o7o"; // Safe public anon reference

async function testScenario(name, headers, expectedStatus, expectedCode) {
  console.log(`\nTestando Cenário: [${name}] ...`);
  const t0 = performance.now();
  try {
    const res = await fetch(EDGE_FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify({ message: "Anatomia da escápula", tool: "chat" })
    });
    const durationMs = Math.round(performance.now() - t0);
    const body = await res.json().catch(() => null);

    console.log(`HTTP Status: ${res.status} (esperado: ${expectedStatus}) [${durationMs}ms]`);
    console.log(`Resposta JSON:`, body);

    const statusMatch = res.status === expectedStatus;
    const codeMatch = !expectedCode || body?.code === expectedCode;
    const passed = statusMatch && codeMatch;

    console.log(`Veredito: ${passed ? "PASS (✔)" : "FAIL (✘)"}`);
    return { name, passed, status: res.status, body, durationMs };
  } catch (err) {
    console.error(`Erro de execução: ${err.message}`);
    return { name, passed: false, error: err.message };
  }
}

async function runAuthSecurityAudit() {
  console.log("=== P0.19-B.2: AUDITORIA DE SEGURANÇA E AUTENTICAÇÃO DA EDGE FUNCTION ===");
  console.log(`Alvo: ${EDGE_FN_URL}`);
  console.log(`TLS: Verificação Estrita com CA do Sistema Windows (--use-system-ca)\n`);

  const results = [];

  // Cenário 1: Sem nenhum header Authorization
  results.push(await testScenario(
    "1. Requisição sem Header Authorization",
    {},
    401,
    "AUTH_REQUIRED"
  ));

  // Cenário 2: Chave Anônima Pública usada como Bearer token
  results.push(await testScenario(
    "2. Chave Pública Anônima como Bearer Token",
    { "Authorization": `Bearer ${ANON_KEY}`, "apikey": ANON_KEY },
    401,
    "ANON_KEY_AS_BEARER_REJECTED"
  ));

  // Cenário 3: Bearer com token JWT malformado / lixo
  results.push(await testScenario(
    "3. Bearer com Token JWT Inválido / Malformado",
    { "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token_ficticio_invalido.assinatura_falsa", "apikey": ANON_KEY },
    401,
    "AUTH_INVALID"
  ));

  // Cenário 4: Bearer com token expirado
  const expiredJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.4pz-aeHBuHIOURLWAcf8NNJ89nvWDfe06_KG6Ci52Dk";
  results.push(await testScenario(
    "4. Bearer com Token JWT Expirado",
    { "Authorization": `Bearer ${expiredJwt}`, "apikey": ANON_KEY },
    401,
    "AUTH_INVALID"
  ));

  // Cenário 5: CORS Preflight (OPTIONS)
  console.log("\nTestando Cenário: [5. CORS Preflight OPTIONS] ...");
  const t0 = performance.now();
  const corsRes = await fetch(EDGE_FN_URL, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://www.aeternumatlas.com",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization, content-type, apikey"
    }
  });
  const corsDurationMs = Math.round(performance.now() - t0);
  const corsAllowOrigin = corsRes.headers.get("access-control-allow-origin");
  const corsAllowMethods = corsRes.headers.get("access-control-allow-methods");
  console.log(`OPTIONS Status: ${corsRes.status} (esperado: 200 ou 204) [${corsDurationMs}ms]`);
  console.log(`Access-Control-Allow-Origin: ${corsAllowOrigin}`);
  console.log(`Access-Control-Allow-Methods: ${corsAllowMethods}`);
  const corsPass = (corsRes.status === 200 || corsRes.status === 204) && (corsAllowOrigin === "*" || corsAllowOrigin?.includes("aeternumatlas.com"));
  console.log(`Veredito CORS: ${corsPass ? "PASS (✔)" : "FAIL (✘)"}`);
  results.push({ name: "5. CORS Preflight OPTIONS", passed: corsPass, status: corsRes.status, durationMs: corsDurationMs });

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  console.log(`\n=== RESUMO DA AUDITORIA DE SEGURANÇA ===`);
  console.log(`Total de Cenários: ${total}`);
  console.log(`Aprovados: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`Fail-Closed Garantido: ${passed === total ? "SIM — 100% BLINDADO" : "NÃO — REVISAR"}`);

  const artifactPath = "C:\\Users\\halis\\.gemini\\antigravity\\brain\\b63445c2-37f0-46a4-8ca8-5556eb65a8a3\\P0.19_B2_SEGURANCA_TLS_AUTH_DATA.json";
  fs.writeFileSync(artifactPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    endpoint: EDGE_FN_URL,
    totalScenarios: total,
    passedScenarios: passed,
    securityRate: `${((passed/total)*100).toFixed(1)}%`,
    failClosedCertified: passed === total,
    scenarios: results
  }, null, 2), "utf8");
  console.log(`\nArtifact written: ${artifactPath}`);
}

runAuthSecurityAudit().catch(console.error);
