// Teste de Contenção Estrita do VoiceStudio e Paridade Acadêmica (P0.20-S.1)
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é expressamente proibido no Aeternum Atlas.");
}

import { isVitaVoiceEnabled } from "../../src/services/voice/aeternumVitaConfig.js";

async function runVoiceContainmentSuite() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: BATERIA DE CONTENÇÃO DO VOICESTUDIO (P0.20-S.1)          ===");
  console.log("=== Validação Fail-Closed / Deny-by-Default de Entitlement de Servidor       ===");
  console.log("================================================================================\n");

  const students = [
    { email: "halissonzanchin@aeternumatlas.com", name: "Halisson Ricardo Zanchin Caceres" },
    { email: "henriquebahia@aeternumatlas.com", name: "Victor Henrique Souza dos Santos" },
    { email: "lucasparedes@aeternumatlas.com", name: "Lucas Alcides Paredes Gonzalez" },
    { email: "nicolasfigorelli@aeternumatlas.com", name: "Nicolas Figorelli Miranda Santos" },
    { email: "edgartorales@aeternumatlas.com", name: "Edgar Osvaldo Torales Acosta" },
    { email: "demo.institucional@aeternumatlas.com", name: "Aeternum Atlas — Demonstração Institucional" }
  ];

  let allPassed = true;

  console.log("[Teste 1] Avaliando as 5 contas estudantis oficiais + Demo...");
  for (const s of students) {
    const userObj = {
      email: s.email,
      role: "student",
      name: s.name,
      app_metadata: { provider: "email" },
      user_metadata: { name: s.name, role: "student" }
    };

    const isEnabled = isVitaVoiceEnabled(userObj);
    const pass = isEnabled === false;
    if (!pass) allPassed = false;
    console.log(` - ${s.email}: isVitaVoiceEnabled() = ${isEnabled} -> ${pass ? "PASS (BLOQUEADO)" : "FAIL"}`);
  }

  console.log("\n[Teste 2] Testando injeção maliciosa de claims no user_metadata...");
  const maliciousUser = {
    email: "halissonzanchin@aeternumatlas.com",
    role: "student",
    user_metadata: { voice_enabled: true, is_voice_pilot: true, voice_entitlement: "active" }, // Tentativa de bypass client-side
    app_metadata: { provider: "email" } // Sem entitlement de servidor
  };
  const malEnabled = isVitaVoiceEnabled(maliciousUser);
  const malPass = malEnabled === false;
  if (!malPass) allPassed = false;
  console.log(` - user_metadata falsificado no cliente: isVitaVoiceEnabled() = ${malEnabled} -> ${malPass ? "PASS (BLOQUEADO FAIL-CLOSED)" : "FAIL"}`);

  console.log("\n[Teste 3] Testando contexto não autenticado / nulo...");
  const nullEnabled = isVitaVoiceEnabled(null);
  const nullPass = nullEnabled === false;
  if (!nullPass) allPassed = false;
  console.log(` - Usuário nulo/anônimo: isVitaVoiceEnabled() = ${nullEnabled} -> ${nullPass ? "PASS (BLOQUEADO)" : "FAIL"}`);

  console.log("\n[Teste 4] Testando usuário participante piloto com entitlement administrativo legítimo no app_metadata...");
  const pilotUser1 = {
    email: "pilot_qa@aeternumatlas.com",
    role: "student",
    app_metadata: { provider: "email", voice_enabled: true }
  };
  const pilot1Enabled = isVitaVoiceEnabled(pilotUser1);
  const pilot1Pass = pilot1Enabled === true;
  if (!pilot1Pass) allPassed = false;
  console.log(` - Piloto legítimo (voice_enabled: true): isVitaVoiceEnabled() = ${pilot1Enabled} -> ${pilot1Pass ? "PASS (AUTORIZADO)" : "FAIL"}`);

  const pilotUser2 = {
    email: "pilot_qa2@aeternumatlas.com",
    role: "student",
    app_metadata: { provider: "email", is_voice_pilot: true }
  };
  const pilot2Enabled = isVitaVoiceEnabled(pilotUser2);
  const pilot2Pass = pilot2Enabled === true;
  if (!pilot2Pass) allPassed = false;
  console.log(` - Piloto legítimo (is_voice_pilot: true): isVitaVoiceEnabled() = ${pilot2Enabled} -> ${pilot2Pass ? "PASS (AUTORIZADO)" : "FAIL"}`);

  const pilotUser3 = {
    email: "pilot_qa3@aeternumatlas.com",
    role: "student",
    app_metadata: { provider: "email", voice_entitlement: "active" }
  };
  const pilot3Enabled = isVitaVoiceEnabled(pilotUser3);
  const pilot3Pass = pilot3Enabled === true;
  if (!pilot3Pass) allPassed = false;
  console.log(` - Piloto legítimo (voice_entitlement: 'active'): isVitaVoiceEnabled() = ${pilot3Enabled} -> ${pilot3Pass ? "PASS (AUTORIZADO)" : "FAIL"}`);

  console.log("\n================================================================================");
  console.log(`=== RESULTADO GERAL CONTENÇÃO VOICESTUDIO: ${allPassed ? "APROVADO (100% SEGURO)" : "REPROVADO"} ===`);
  console.log("================================================================================\n");

  if (!allPassed) process.exit(1);
}

runVoiceContainmentSuite().catch(err => {
  console.error("ERRO NO TESTE DE CONTENÇÃO:", err);
  process.exit(1);
});
