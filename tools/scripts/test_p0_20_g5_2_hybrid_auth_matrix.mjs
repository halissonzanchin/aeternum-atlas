import fs from "node:fs";
import { validateGatewayAuth } from "../../packages/aeternum-vita/src/gateway/middleware/auth.ts";

function loadEnvFile(path) {
  try {
    const c = fs.readFileSync(path, "utf8");
    for (const line of c.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const k = trimmed.slice(0, eqIdx).trim();
        const v = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
        if (!process.env[k] && v.length > 0) {
          process.env[k] = v;
        }
      }
    }
  } catch {}
}

loadEnvFile("C:\\Users\\halis\\.cloudflared\\.gateway.env");

async function run() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: HOMOLOGAÇÃO RIGOROSA DA AUTENTICAÇÃO HYBRID_AUTH        ===");
  console.log("=== Auditoria de Segurança P0.20-G.5.2 (7 Cenários de Segurança)             ===");
  console.log("================================================================================\n");

  const bearerToken = process.env.AETERNUM_AI_GATEWAY_TOKEN || "";
  const testSecret = process.env.AETERNUM_GATEWAY_LOCAL_TEST_SECRET || "";
  if (!bearerToken) throw new Error("AETERNUM_AI_GATEWAY_TOKEN não encontrado.");
  if (!testSecret) throw new Error("AETERNUM_GATEWAY_LOCAL_TEST_SECRET não encontrado.");

  const GATEWAY_URL = "http://127.0.0.1:8081/v1/llm/generate";
  const results = [];

  // Helper para chamada HTTP real ao Gateway na porta 8081
  async function testHttpCase(name, headers, expectedStatus, expectedReasonSubstring) {
    process.stdout.write(`1. [HTTP Live] ${name}... `);
    try {
      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Teste de segurança." }],
          maxTokens: 10
        })
      });
      const data = await res.json().catch(() => ({}));
      const statusOk = res.status === expectedStatus;
      const errorText = typeof data?.error === "object" ? (data.error.message || "") : String(data?.error || data?.message || "");
      const reasonOk = expectedReasonSubstring ? errorText.toLowerCase().includes(expectedReasonSubstring.toLowerCase()) : true;
      const passed = statusOk && reasonOk;

      if (passed) {
        console.log(`PASS (Status ${res.status}${errorText ? " - " + errorText.slice(0, 60) : ""})`);
      } else {
        console.log(`FAIL (Esperado: ${expectedStatus}, Obtido: ${res.status}, Detalhe: ${errorText})`);
      }

      results.push({
        name,
        type: "HTTP_LIVE",
        passed,
        expectedStatus,
        actualStatus: res.status,
        error: errorText
      });
      return passed;
    } catch (err) {
      console.log(`ERROR (${err.message})`);
      results.push({ name, type: "HTTP_LIVE", passed: false, error: err.message });
      return false;
    }
  }

  // 1. Ausência de Bearer Token
  await testHttpCase(
    "Cenário 1: Ausência de Bearer Token",
    {},
    401,
    "Cabeçalho Authorization Bearer ausente"
  );

  // 2. Bearer Token inválido
  await testHttpCase(
    "Cenário 2: Bearer Token inválido",
    { "Authorization": "Bearer token_falso_arbitrario_12345" },
    401,
    "Bearer Token inválido"
  );

  // 3. Ausência de Bypass Indevido (Loopback com Bearer válido, MAS SEM Local Test Secret e SEM Cloudflare)
  await testHttpCase(
    "Cenário 3: Ausência de Bypass Indevido (Loopback sem secret de teste)",
    { "Authorization": `Bearer ${bearerToken}` },
    401,
    "Cf-Access-Jwt-Assertion ausente"
  );

  // 4. Local Test Secret inválido
  await testHttpCase(
    "Cenário 4: Local Test Secret inválido",
    {
      "Authorization": `Bearer ${bearerToken}`,
      "x-aeternum-local-test-secret": "segredo_incorreto_ataque_teste"
    },
    401,
    "Cf-Access-Jwt-Assertion ausente"
  );

  // 5. Requisições via túnel público / Cabeçalhos Cloudflare simulados com tentativa de bypass
  await testHttpCase(
    "Cenário 5: Tentativa de Bypass com Cabeçalhos de Túnel Externo (cf-ray / cf-connecting-ip)",
    {
      "Authorization": `Bearer ${bearerToken}`,
      "x-aeternum-local-test-secret": testSecret,
      "cf-ray": "8e9999999999-GRU",
      "cf-connecting-ip": "177.18.29.40"
    },
    401,
    "Cf-Access-Jwt-Assertion ausente"
  );

  // 6. Requisição local autorizada (Loopback + Bearer Válido + Local Test Secret Válido)
  await testHttpCase(
    "Cenário 6: Requisição Local Autorizada (Loopback + Bearer + Local Test Secret)",
    {
      "Authorization": `Bearer ${bearerToken}`,
      "x-aeternum-local-test-secret": testSecret
    },
    200,
    null
  );

  // =========================================================================
  // PARTE 2: TESTES UNITÁRIOS DE MATRIZ CONTRA validateGatewayAuth
  // =========================================================================
  console.log("\n2. [Unit Matrix] Validando Defesa em Profundidade na Função validateGatewayAuth...");

  // Mock Request Helper
  function mockReq(options = {}) {
    return {
      headers: options.headers || {},
      socket: {
        remoteAddress: options.remoteAddress || "127.0.0.1"
      }
    };
  }

  // Unit 1: Requisição em produção tentando bypass local
  const prevEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    const resProd = validateGatewayAuth(
      mockReq({
        headers: {
          "authorization": `Bearer ${bearerToken}`,
          "x-aeternum-local-test-secret": testSecret
        },
        remoteAddress: "127.0.0.1"
      }),
      "HYBRID_AUTH"
    );
    const prodBypassBlocked = resProd.authenticated === false;
    console.log(`   - Bloqueio de Teste Local em Ambiente de Produção (NODE_ENV=production): ${prodBypassBlocked ? "PASS (Bloqueado com sucesso)" : "FAIL"}`);
    results.push({ name: "Unit: Production Environment Disallows Local Test Bypass", passed: prodBypassBlocked });
  } finally {
    process.env.NODE_ENV = prevEnv;
  }

  // Unit 2: Requisição de IP externo na rede local (ex: 192.168.1.50) tentando passar secret
  const resExternalIp = validateGatewayAuth(
    mockReq({
      headers: {
        "authorization": `Bearer ${bearerToken}`,
        "x-aeternum-local-test-secret": testSecret
      },
      remoteAddress: "192.168.1.50"
    }),
    "HYBRID_AUTH"
  );
  const externalIpBlocked = resExternalIp.authenticated === false;
  console.log(`   - Bloqueio de Teste Local vindo de IP não-loopback (192.168.1.50): ${externalIpBlocked ? "PASS (Bloqueado com sucesso)" : "FAIL"}`);
  results.push({ name: "Unit: Non-Loopback Remote Address Disallows Local Test Bypass", passed: externalIpBlocked });

  // Unit 3: Requisição legítima autorizada
  const resAuthorized = validateGatewayAuth(
    mockReq({
      headers: {
        "authorization": `Bearer ${bearerToken}`,
        "x-aeternum-local-test-secret": testSecret
      },
      remoteAddress: "127.0.0.1"
    }),
    "HYBRID_AUTH"
  );
  const authorizedPass = resAuthorized.authenticated === true && resAuthorized.userId === "hybrid_authorized_local_test";
  console.log(`   - Requisição Local Autorizada com Secret Soberano: ${authorizedPass ? "PASS (Autorizado)" : "FAIL"}`);
  results.push({ name: "Unit: Authorized Local Test Succeeds", passed: authorizedPass });

  const allPassed = results.every(r => r.passed);
  console.log(`\n================================================================================`);
  console.log(`VEREDITO DA HOMOLOGAÇÃO HYBRID_AUTH: ${allPassed ? "PASS (100% CONFORME)" : "FAIL"}`);
  console.log(`Total de Cenários Avaliados: ${results.length} | Aprovados: ${results.filter(r => r.passed).length}`);
  console.log(`================================================================================\n`);

  if (!allPassed) {
    process.exit(1);
  }
}

run().catch(e => {
  console.error("Erro fatal no teste de auth:", e);
  process.exit(1);
});
