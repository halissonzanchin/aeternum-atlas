/**
 * AETERNUM ATLAS — BATERIA DE TESTES DE AUTORIZAÇÃO VOICESTUDIO (P0 SEGURANÇA)
 * 
 * Validação dos 5 cenários exigidos:
 * 1. Usuário demo institucional (deve receber HTTP 403)
 * 2. Estudante comum sem claim administrativa (deve receber HTTP 403)
 * 3. Desenvolvedor / participante piloto autorizado (deve receber HTTP 201)
 * 4. Sessão expirada / token corrompido (deve receber HTTP 401)
 * 5. Requisição sem autenticação (deve receber HTTP 401 / 403)
 */

import crypto from "node:crypto";

function createJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", "test-secret").update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

async function runMatrix() {
  console.log("================================================================================");
  console.log(" BATERIA DE MATRIZ DE AUTORIZAÇÃO VOICESTUDIO (5 CENÁRIOS MANDATÓRIOS)         ");
  console.log("================================================================================\n");

  const results = [];
  const endpoint = "http://127.0.0.1:3001/functions/v1/voice-token";

  // 1. Usuário Demo
  console.log("--- CENÁRIO 1: Usuário Demo Institucional ---");
  const demoJwt = createJwt({
    sub: "5cfb837a-5ce3-4113-8f4a-dcdd9b8bf43f",
    email: "demo.institucional@aeternumatlas.com",
    app_metadata: { provider: "email" }
  });
  const res1 = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${demoJwt}`,
      "x-user-email": "demo.institucional@aeternumatlas.com"
    },
    body: JSON.stringify({ tutor_id: "marina", user_email: "demo.institucional@aeternumatlas.com" })
  });
  const data1 = await res1.json().catch(() => ({}));
  const pass1 = res1.status === 403 && data1.code === "VOICESTUDIO_NOT_PERMITTED";
  console.log(`Cenário 1: HTTP ${res1.status} | Code: ${data1.code} | Status: ${pass1 ? "PASS" : "FAIL"}`);
  results.push({ scenario: "1. Usuário Demo Institucional", expected: 403, got: res1.status, pass: pass1, detail: data1.error });

  // 2. Estudante Comum
  console.log("--- CENÁRIO 2: Estudante Comum (Sem Claim Administrativa de Voz) ---");
  const studentJwt = createJwt({
    sub: "a3911a5c-a3d0-4318-9d45-f6be6ac38fb4",
    email: "aluno_padrao@aeternumatlas.com",
    role: "authenticated",
    app_metadata: { provider: "email" }, // No voice_enabled
    user_metadata: { voice_enabled: true } // Client-injected fake claim! MUST BE IGNORED!
  });
  const res2 = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentJwt}`
    },
    body: JSON.stringify({ tutor_id: "marina" })
  });
  const data2 = await res2.json().catch(() => ({}));
  const pass2 = res2.status === 403 && data2.code === "VOICESTUDIO_NOT_PERMITTED";
  console.log(`Cenário 2: HTTP ${res2.status} | Code: ${data2.code} | Status: ${pass2 ? "PASS" : "FAIL"}`);
  results.push({ scenario: "2. Estudante Comum (Sem Claim de Voz)", expected: 403, got: res2.status, pass: pass2, detail: data2.error });

  // 3. Desenvolvedor / Participante Piloto Autorizado
  console.log("--- CENÁRIO 3: Desenvolvedor Autorizado (Com Claim Administrativa voice_enabled) ---");
  const devJwt = createJwt({
    sub: "428c8ce1-0a9b-4f2e-be02-6b8eef6d68f7",
    email: "qa.voice.p0@aeternumatlas.com",
    role: "authenticated",
    app_metadata: { provider: "email", voice_enabled: true } // Trustworthy claim
  });
  const res3 = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${devJwt}`
    },
    body: JSON.stringify({ tutor_id: "marina" })
  });
  const data3 = await res3.json().catch(() => ({}));
  const pass3 = res3.status === 201 && Boolean(data3.participant_token);
  console.log(`Cenário 3: HTTP ${res3.status} | Room: ${data3.room_name} | Token: ${Boolean(data3.participant_token)} | Status: ${pass3 ? "PASS" : "FAIL"}`);
  results.push({ scenario: "3. Desenvolvedor Autorizado", expected: 201, got: res3.status, pass: pass3, detail: `Token LiveKit emitido para sala ${data3.room_name}` });

  // 4. Sessão Expirada / Token Inválido
  console.log("--- CENÁRIO 4: Sessão Expirada / Token Inválido ---");
  const res4 = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer invalid.expired.token"
    },
    body: JSON.stringify({ tutor_id: "marina" })
  });
  const data4 = await res4.json().catch(() => ({}));
  const pass4 = res4.status === 403 || res4.status === 401; // Blocked
  console.log(`Cenário 4: HTTP ${res4.status} | Code: ${data4.code} | Status: ${pass4 ? "PASS" : "FAIL"}`);
  results.push({ scenario: "4. Sessão Expirada / Token Inválido", expected: "401/403", got: res4.status, pass: pass4, detail: data4.error });

  // 5. Requisição Sem Autenticação
  console.log("--- CENÁRIO 5: Requisição Sem Autenticação ---");
  const res5 = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ tutor_id: "marina" })
  });
  const data5 = await res5.json().catch(() => ({}));
  const pass5 = res5.status === 403 || res5.status === 401; // Blocked
  console.log(`Cenário 5: HTTP ${res5.status} | Code: ${data5.code} | Status: ${pass5 ? "PASS" : "FAIL"}`);
  results.push({ scenario: "5. Requisição Sem Autenticação", expected: "401/403", got: res5.status, pass: pass5, detail: data5.error });

  console.log("\n================================================================================");
  console.log(" RESULTADO DA MATRIZ DE AUTORIZAÇÃO VOICESTUDIO                                 ");
  console.log("================================================================================\n");

  let allPass = true;
  for (const r of results) {
    const mark = r.pass ? "[PASS]" : "[FAIL]";
    if (!r.pass) allPass = false;
    console.log(`${mark} ${r.scenario}: Esperado ${r.expected}, Recebido ${r.got} (${r.detail || ""})`);
  }

  console.log(`\nSTATUS FINAL DA MATRIZ: ${allPass ? "TODOS OS 5 CENÁRIOS HOMOLOGADOS COM SUCESSO!" : "FALHA NA MATRIZ"}\n`);
}

runMatrix().catch(e => {
  console.error("Erro fatal:", e);
  process.exit(1);
});
