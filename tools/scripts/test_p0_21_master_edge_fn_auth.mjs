if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é proibido.");
}

import { getServiceRoleKey, getAnonKey } from "./supabase_admin_helper.mjs";
import crypto from "node:crypto";

const SUPABASE_URL = "https://hyivyrietgjdazgizafp.supabase.co";
const FN_URL = `${SUPABASE_URL}/functions/v1/send-beta-notification`;

function createForgedJwt(payload, fakeSecret = "fake-secret-key-12345678901234567890") {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", fakeSecret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

async function testEdgeFunctionAuth() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — P0.21-MASTER: TESTES CRIPTOGRÁFICOS DE SEGURANÇA NA EDGE FN   ");
  console.log("================================================================================\n");

  const serviceRoleKey = await getServiceRoleKey();
  const anonKey = await getAnonKey();

  const testCases = [
    {
      name: "1. Requisição SEM credenciais (Missing auth)",
      headers: { "Content-Type": "application/json" },
      expectedStatuses: [401],
      expectedCode: "AUTH_MISSING"
    },
    {
      name: "2. Requisição com chave pública anônima (ANON_KEY como Bearer)",
      headers: {
        "Authorization": `Bearer ${anonKey}`,
        "Content-Type": "application/json"
      },
      expectedStatuses: [401],
      expectedCode: "ANON_KEY_REJECTED"
    },
    {
      name: "3. Requisição com chave anônima no header apikey",
      headers: {
        "apikey": anonKey,
        "Content-Type": "application/json"
      },
      expectedStatuses: [401],
      expectedCode: "ANON_KEY_REJECTED"
    },
    {
      name: "4. Token malformado (String corrompida)",
      headers: {
        "Authorization": "Bearer malformed.invalid.token-xyz123",
        "Content-Type": "application/json"
      },
      expectedStatuses: [403],
      expectedCode: "AUTH_FORBIDDEN"
    },
    {
      name: "5. JWT FORJADO com claim { role: 'service_role' } assinado com chave falsa",
      headers: {
        "Authorization": `Bearer ${createForgedJwt({ role: "service_role", sub: "hacker" })}`,
        "Content-Type": "application/json"
      },
      expectedStatuses: [403],
      expectedCode: "AUTH_FORBIDDEN"
    },
    {
      name: "6. JWT FORJADO com claim { role: 'admin' } assinado com chave falsa",
      headers: {
        "Authorization": `Bearer ${createForgedJwt({ role: "admin", sub: "hacker-admin" })}`,
        "Content-Type": "application/json"
      },
      expectedStatuses: [403],
      expectedCode: "AUTH_FORBIDDEN"
    },
    {
      name: "7. JWT EXPIRADO com assinatura válida ou forjada",
      headers: {
        "Authorization": `Bearer ${createForgedJwt({ role: "admin", exp: Math.floor(Date.now() / 1000) - 3600 })}`,
        "Content-Type": "application/json"
      },
      expectedStatuses: [403],
      expectedCode: "AUTH_FORBIDDEN"
    },
    {
      name: "8. Credencial VÁLIDA do serviço interno (service_role key oficial)",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json"
      },
      expectedStatuses: [200],
      expectedCode: null // Sucesso na autenticação
    }
  ];

  let passedCount = 0;

  for (const tc of testCases) {
    let res = null;
    let body = null;
    try {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          res = await fetch(FN_URL, {
            method: "POST",
            headers: tc.headers,
            body: JSON.stringify({ trigger: "security_test" })
          });
          body = await res.json().catch(() => ({}));
          break;
        } catch (err) {
          if (attempt === 3) throw err;
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
      const statusOk = tc.expectedStatuses.includes(res.status);
      const codeOk = tc.expectedCode ? body.code === tc.expectedCode : true;

      if (statusOk && codeOk) {
        console.log(`[PASS] ${tc.name} -> HTTP ${res.status} (code: ${body.code || "OK"})`);
        passedCount++;
      } else {
        console.error(`[FAIL] ${tc.name} -> HTTP ${res.status} (esperado: ${tc.expectedStatuses.join("/")}), body:`, body);
      }
    } catch (err) {
      console.error(`[ERROR] ${tc.name} falhou com exceção:`, err.message);
    }
  }

  console.log(`\nResultado dos Testes de Segurança: ${passedCount}/${testCases.length} APROVADOS.`);
  if (passedCount !== testCases.length) {
    throw new Error(`Falha nos testes de segurança da Edge Function: ${passedCount}/${testCases.length}`);
  }
}

testEdgeFunctionAuth().catch(err => {
  console.error("ERRO:", err.message);
  process.exit(1);
});
