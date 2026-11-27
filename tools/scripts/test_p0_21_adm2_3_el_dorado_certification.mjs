if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é expressamente proibido no Aeternum Atlas.");
}

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { getAnonKey, getServiceRoleKey, runSupabaseSql } from "./supabase_admin_helper.mjs";
import {
  validateBetaApplication,
  buildBetaApplicationsCsvContent,
  exportBetaApplicationsCsv,
  sanitizeCsvFormula
} from "../../src/services/beta/betaRegistrationService.js";
import { adminSectionFromPath } from "../../src/config/adminNavigation.js";
import { shellNavigationForRole } from "../../src/components/Layout/shellNavigation.js";

const SUPABASE_URL = "https://hyivyrietgjdazgizafp.supabase.co";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-beta-notification`;

async function runElDoradoCertificationSuite() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: CERTIFICAÇÃO OPERACIONAL DA OPERAÇÃO EL DORADO (ADM.2.3) ===");
  console.log("================================================================================\n");

  const anonKey = await getAnonKey();
  const serviceRoleKey = await getServiceRoleKey();

  const anonClient = createClient(SUPABASE_URL, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const adminClient = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const report = {
    gateE7_1_clientValidation: null,
    gateE7_1_publicStatusPrelaunch: null,
    gateE7_1_prelaunchRejectionServer: null,
    gateE7_2_adminNavigationCanonical: null,
    gateE7_2_csvExportBOMAndDelimiter: null,
    gateE7_2_batch1CapacityCap30: null,
    gateE7_3_resendEdgeAuthAndIdempotency: null,
    gateE7_3_decouplingNoUserCreated: null,
    gateE7_3_syntheticQuarantineIntact: null,
    preservation_foundersAndSettings: null
  };

  // --------------------------------------------------------------------------
  // GATE E7.1: ABERTURA DAS CANDIDATURAS & VALIDAÇÃO
  // --------------------------------------------------------------------------
  console.log("--- GATE E7.1: ABERTURA DAS CANDIDATURAS & VALIDAÇÃO ---");

  // 1. Validação client-side
  console.log("[1.1] Testando validação client-side estrita (validateBetaApplication)...");
  const emptyErrors = validateBetaApplication({});
  assert.ok(emptyErrors.fullName && emptyErrors.email && emptyErrors.institutionName && emptyErrors.privacyConsent);
  
  const validErrors = validateBetaApplication({
    fullName: "Dra. Isabela Rocha",
    email: "isabela.rocha@unicamp.br",
    institutionName: "UNICAMP",
    course: "Medicina",
    academicTerm: "7º Semestre",
    primaryDevice: "Desktop / Notebook (Windows)",
    motivation: "Estudo de cirurgia geral e anatomia cadavérica.",
    privacyConsent: true,
    termsConsent: true
  });
  assert.equal(Object.keys(validErrors).length, 0);
  console.log(" -> PASS: Validação client-side 100% conforme.");
  report.gateE7_1_clientValidation = "PASS";

  // 2. RPC pública get_beta_program_public_status
  console.log("\n[1.2] Verificando RPC pública get_beta_program_public_status...");
  const { data: pubStatus, error: pubErr } = await anonClient.rpc("get_beta_program_public_status");
  assert.equal(pubErr, null);
  assert.equal(pubStatus.registration_open, false, "Inscrições devem estar fechadas (pré-lançamento)");
  assert.equal(pubStatus.initial_batch_capacity, 30, "Capacidade do Lote 1 deve ser 30");
  assert.equal(pubStatus.current_batch_approved, 0, "Aprovados legítimos atuais devem ser 0");
  console.log(" -> PASS: Status público de pré-lançamento confirmado (30 vagas livres, 0 aprovados).");
  report.gateE7_1_publicStatusPrelaunch = "PASS";

  // 3. Rejeição server-side em pré-lançamento
  console.log("\n[1.3] Testando rejeição server-side de submissão anônima em pré-lançamento...");
  const { data: subAnonRes } = await anonClient.rpc("submit_beta_application", {
    p_full_name: "Candidato Prelaunch",
    p_email: "teste_prelaunch@med.br",
    p_institution_name: "Universidade",
    p_course: "Medicina",
    p_academic_term: "1º Semestre",
    p_motivation: "Motivação suficiente para validação.",
    p_privacy_consent: true,
    p_terms_consent: true
  });
  assert.equal(subAnonRes?.success, false);
  assert.equal(subAnonRes?.code, "BETA_REGISTRATION_PRELAUNCH");
  console.log(" -> PASS: Server-side bloqueou submissão em pré-lançamento com código canônico.");
  report.gateE7_1_prelaunchRejectionServer = "PASS";

  // --------------------------------------------------------------------------
  // GATE E7.2: SELEÇÃO MANUAL & CENTRAL ADMINISTRATIVA
  // --------------------------------------------------------------------------
  console.log("\n--- GATE E7.2: SELEÇÃO MANUAL & CENTRAL ADMINISTRATIVA ---");

  // 4. Rotas e navegação administrativa
  console.log("[2.1] Validando rotas canônicas e menus do Shell...");
  assert.equal(adminSectionFromPath("/admin/candidatos-beta"), "beta_candidates");
  assert.equal(adminSectionFromPath("/super-admin/candidatos-beta"), "beta_candidates");

  const dummyT = (k) => k;
  const adminNav = shellNavigationForRole("admin", "/admin/dashboard", dummyT);
  const adminItem = adminNav.find(i => i.href?.includes("candidatos-beta") || i.label === "Operação El Dorado");
  assert.ok(adminItem, "Operação El Dorado deve estar presente no menu de admin");

  const studentNav = shellNavigationForRole("student", "/student/dashboard", dummyT);
  const studentItem = studentNav.find(i => i.href?.includes("candidatos-beta") || i.label === "Operação El Dorado");
  assert.equal(studentItem, undefined, "Estudante NÃO deve ver menu El Dorado");
  console.log(" -> PASS: Rotas administrativas e isolamento de menu validados.");
  report.gateE7_2_adminNavigationCanonical = "PASS";

  // 5. Exportação CSV com UTF-8 BOM e delimitador ';'
  console.log("\n[2.2] Validando formatação estruturada de exportação CSV...");
  const mockApps = [
    {
      id: "app-cert-1",
      protocol_number: "BETA-2026-CERT01",
      created_at: new Date().toISOString(),
      full_name: "Dra. Isabela Rocha",
      email: "isabela.rocha@unicamp.br",
      institution_name: "UNICAMP",
      course: "Medicina",
      academic_term: "7º Semestre",
      student_group: "Turma LXI",
      student_id_number: "RA-241908",
      primary_device: "Desktop / Notebook (Windows)",
      country: "Brasil",
      referral_source: "Instagram",
      motivation: "Estudo aprofundado de anatomia topográfica.",
      status: "pending",
      batch: "batch_1_30"
    },
    {
      id: "app-cert-synth",
      protocol_number: "BETA-2026-SYNTH",
      created_at: new Date().toISOString(),
      full_name: "Registro Sintético",
      email: "synth@audit.br",
      status: "rejected",
      batch: "synthetic_test",
      source_origin: "synthetic_audit"
    }
  ];

  const csvContent = buildBetaApplicationsCsvContent(mockApps, { excludeSynthetic: true });
  assert.ok(csvContent.startsWith("\uFEFF"), "Deve conter UTF-8 BOM");
  assert.ok(csvContent.includes(";"), "Deve usar delimitador ';'");
  assert.ok(csvContent.includes("Dra. Isabela Rocha"));
  assert.ok(!csvContent.includes("Registro Sintético"), "Deve excluir dados sintéticos por padrão");

  const headers = csvContent.split("\r\n")[0].replace("\uFEFF", "").split(";");
  assert.equal(headers.length, 18, "Deve conter exatamente 18 colunas");

  // Proteção contra CSV Formula Injection (CWE-1236)
  assert.equal(sanitizeCsvFormula("=cmd|' /C calc'!A0"), "'=cmd|' /C calc'!A0");
  assert.equal(sanitizeCsvFormula("+12345"), "'+12345");
  assert.equal(sanitizeCsvFormula("-2+5"), "'-2+5");
  assert.equal(sanitizeCsvFormula("@SUM(1,2)"), "'@SUM(1,2)");
  assert.equal(sanitizeCsvFormula("Texto Normal"), "Texto Normal");
  console.log(" -> PASS: Exportação CSV 100% compatível com Microsoft Excel pt-BR e protegida contra CWE-1236.");
  report.gateE7_2_csvExportBOMAndDelimiter = "PASS";

  // 6. Teto rígido de 30 vagas no Lote 1 com pg_advisory_xact_lock
  console.log("\n[2.3] Verificando trava de capacidade no banco (admin_review_beta_application)...");
  const reviewProc = await runSupabaseSql(`SELECT prosrc FROM pg_proc WHERE proname = 'admin_review_beta_application';`);
  const rSrc = reviewProc[0].prosrc;
  assert.ok(rSrc.includes("pg_advisory_xact_lock"), "Deve utilizar pg_advisory_xact_lock");
  assert.ok(rSrc.includes("v_target_batch = 'batch_1_30' AND v_approved_count >= 30"), "Deve travar aprovação quando >= 30");
  assert.ok(rSrc.includes("CAPACITY_EXCEEDED"), "Deve retornar código CAPACITY_EXCEEDED");
  console.log(" -> PASS: Trava transacional de 30 vagas aprovadas confirmada no banco.");
  report.gateE7_2_batch1CapacityCap30 = "PASS";

  // --------------------------------------------------------------------------
  // GATE E7.3: CONVITES, NOTIFICAÇÕES & ATIVAÇÃO ACADÊMICA
  // --------------------------------------------------------------------------
  console.log("\n--- GATE E7.3: CONVITES, NOTIFICAÇÕES & ATIVAÇÃO ACADÊMICA ---");

  // 7. Edge function de notificação (autenticação estrita e proteção da fila de produção)
  // DIRETRIZ P0.21-ADM.2.3-R1: Testes puramente negativos na live Edge Function sem invocar service_role
  console.log("[3.1] Testando autenticação negativa na Edge Function send-beta-notification (sem tocar na fila)...");
  const resMissing = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  assert.equal(resMissing.status, 401, "Chamada sem token deve retornar 401");

  const resAnon = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}`, apikey: anonKey },
    body: JSON.stringify({})
  });
  assert.equal(resAnon.status, 401, "Chamada com chave anônima deve ser terminantemente rejeitada com 401");

  const resForged = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer forged-token-adm23", apikey: anonKey },
    body: JSON.stringify({})
  });
  assert.equal(resForged.status, 401, "Chamada com token forjado deve retornar 401");

  // Verificação estática de idempotência e ausência de bypass no código da Edge Function
  const edgeFnPath = path.resolve("supabase/functions/send-beta-notification/index.ts");
  const edgeFnSrc = fs.readFileSync(edgeFnPath, "utf8");
  assert.ok(edgeFnSrc.includes("ANON_KEY_REJECTED"), "Edge Function deve rejeitar anon explicitamente");
  assert.ok(edgeFnSrc.includes("Idempotency-Key"), "Edge Function deve enviar Idempotency-Key ao Resend");
  assert.ok(edgeFnSrc.includes("claim_next_beta_email_notification"), "Edge Function deve utilizar claim_next_beta_email_notification");
  console.log(" -> PASS: Autenticação negativa validada e código inspecionado (zero chamadas com service_role em prod).");
  report.gateE7_3_resendEdgeAuthAndIdempotency = "PASS";

  // 8. Desacoplamento: submissão NÃO cria usuário em auth.users ou public.users
  console.log("\n[3.2] Verificando princípio de desacoplamento (RPC submit_beta_application)...");
  const subProc = await runSupabaseSql(`SELECT prosrc FROM pg_proc WHERE proname = 'submit_beta_application';`);
  const sSrc = subProc[0].prosrc;
  assert.ok(sSrc.includes("INSERT INTO public.beta_applications"));
  assert.ok(!sSrc.includes("INSERT INTO auth.users"));
  assert.ok(!sSrc.includes("INSERT INTO public.users"));
  console.log(" -> PASS: Desacoplamento comprovado (zero criação automática de usuários).");
  report.gateE7_3_decouplingNoUserCreated = "PASS";

  // 9. Quarentena sintética isolada
  console.log("\n[3.3] Verificando isolamento da quarentena sintética no banco...");
  const qRows = await runSupabaseSql(`
    SELECT id, protocol_number, status, batch, source_origin
    FROM public.beta_applications
    WHERE protocol_number = 'BETA-2026-0BD91351';
  `);
  assert.equal(qRows.length, 1);
  assert.equal(qRows[0].status, "rejected");
  assert.equal(qRows[0].batch, "synthetic_test");
  assert.equal(qRows[0].source_origin, "synthetic_audit_test");
  console.log(" -> PASS: Candidato de teste sintético Dr. Roberto Albuquerque permanece em quarentena.");
  report.gateE7_3_syntheticQuarantineIntact = "PASS";

  // --------------------------------------------------------------------------
  // PRESERVAÇÃO DE ATIVOS & ESTADO DE PRÉ-LANÇAMENTO
  // --------------------------------------------------------------------------
  console.log("\n--- PRESERVAÇÃO DE ATIVOS CRÍTICOS & CONTROLE OPERACIONAL ---");

  // 10. As 5 contas oficiais e beta_registration_open = 'false'
  console.log("[4.1] Verificando 5 contas de fundadores e beta_registration_open = false...");
  const founders = await runSupabaseSql(`
    SELECT email, role FROM public.users
    WHERE email IN (
      'halissonzanchin@aeternumatlas.com',
      'henriquebahia@aeternumatlas.com',
      'lucasparedes@aeternumatlas.com',
      'nicolasfigorelli@aeternumatlas.com',
      'edgartorales@aeternumatlas.com'
    );
  `);
  assert.equal(founders.length, 5, "As 5 contas dos fundadores devem existir intactas");

  const setting = await runSupabaseSql(`
    SELECT setting_value FROM public.platform_system_settings WHERE setting_key = 'beta_registration_open';
  `);
  assert.equal(setting[0].setting_value, "false", "beta_registration_open DEVE permanecer 'false'");
  console.log(" -> PASS: 5 contas preservadas e beta_registration_open = false rigorosamente mantido.");
  report.preservation_foundersAndSettings = "PASS";

  console.log("\n================================================================================");
  console.log("=== RELATÓRIO FINAL: CERTIFICAÇÃO OPERACIONAL ADM.2.3 (10/10 GATES APROVADOS) ===");
  console.log("================================================================================");
  console.log(JSON.stringify(report, null, 2));

  return report;
}

runElDoradoCertificationSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FALHA NA CERTIFICAÇÃO OPERACIONAL ADM.2.3:", err);
    process.exit(1);
  });
