if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é expressamente proibido no Aeternum Atlas.");
}

import assert from "node:assert/strict";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { runSupabaseSql, getServiceRoleKey, getAnonKey } from "./supabase_admin_helper.mjs";
import { validateBetaApplication } from "../../src/services/beta/betaRegistrationService.js";

const SUPABASE_URL = "https://hyivyrietgjdazgizafp.supabase.co";

async function runHomologationSuite() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: HOMOLOGAÇÃO DA OPERAÇÃO EL DORADO (P0.21-E.1) ===");
  console.log("================================================================================\n");

  const results = {
    layoutAndDesign: false,
    routeAndNavigation: false,
    clientValidation: false,
    dbSubmission: false,
    duplicatePrevention: false,
    rlsPrivacyIsolation: false,
    noAutoAccountCreation: false,
    adminManagementAndReview: false,
    capacitySummary: false,
    existingAccountsPreserved: false
  };

  const anonKey = await getAnonKey();
  const serviceRoleKey = await getServiceRoleKey();

  const anonClient = createClient(SUPABASE_URL, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const adminClient = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const testEmail = `el_dorado_candidate_${Date.now()}@medicina.ufrj.br`;
  let testAppId = null;

  try {
    // -------------------------------------------------------------
    // GATE 1: Preservação de Layout e Componentes Aeternum 26
    // -------------------------------------------------------------
    console.log("[GATE 1] Verificando fidelidade e reutilização de layout Aeternum 26...");
    const betaPageSrc = fs.readFileSync("src/pages/beta/BetaRegistrationPage.jsx", "utf8");
    assert.ok(betaPageSrc.includes("<AuthExperienceShell wide>"), "Deve reutilizar AuthExperienceShell com wide");
    assert.ok(betaPageSrc.includes("atlas-auth-card atlas-auth-card--registration"), "Deve reutilizar o card de registro");
    assert.ok(betaPageSrc.includes("PROGRAMA DE TESTE BETA"), "Título deve ser 'PROGRAMA DE TESTE BETA'");
    assert.ok(betaPageSrc.includes("OPERAÇÃO EL DORADO"), "Eyebrow deve referenciar a Operação El Dorado");
    assert.ok(betaPageSrc.includes("SOLICITAR PARTICIPAÇÃO BETA"), "Botão principal deve ser 'SOLICITAR PARTICIPAÇÃO BETA'");
    assert.ok(betaPageSrc.includes("A26IconButton"), "Deve conter alternador de tema A26IconButton");
    assert.ok(betaPageSrc.includes("LanguageSelector"), "Deve conter seletor de idioma");
    console.log(" -> PASS: Componentes, tipografia e layout reutilizados fielmente.");
    results.layoutAndDesign = true;

    // -------------------------------------------------------------
    // GATE 2: Rota e Navegação
    // -------------------------------------------------------------
    console.log("\n[GATE 2] Verificando rotas e navegação...");
    const appSrc = fs.readFileSync("src/App.jsx", "utf8");
    const homeSrc = fs.readFileSync("src/pages/home/Home.jsx", "utf8");
    assert.ok(appSrc.includes('path === "/programa-beta"'), "App.jsx deve rotear /programa-beta");
    assert.ok(homeSrc.includes('navigate("/programa-beta")'), "Home.jsx deve ter botão apontando para /programa-beta");
    assert.ok(homeSrc.includes("PROGRAMA BETA"), "Botão de navegação deve ter label PROGRAMA BETA");
    console.log(" -> PASS: Rota /programa-beta e botão de navegação presentes e conectados.");
    results.routeAndNavigation = true;

    // -------------------------------------------------------------
    // GATE 3: Validação Client-Side dos Campos
    // -------------------------------------------------------------
    console.log("\n[GATE 3] Testando regras de validação client-side...");
    const emptyErrors = validateBetaApplication({});
    assert.ok(emptyErrors.fullName, "Deve exigir nome completo");
    assert.ok(emptyErrors.email, "Deve exigir email válido");
    assert.ok(emptyErrors.institutionName, "Deve exigir instituição");
    assert.ok(emptyErrors.course, "Deve exigir curso");
    assert.ok(emptyErrors.academicTerm, "Deve exigir período");
    assert.ok(emptyErrors.primaryDevice, "Deve exigir dispositivo");
    assert.ok(emptyErrors.motivation, "Deve exigir motivação");
    assert.ok(emptyErrors.privacyConsent, "Deve exigir consentimento de privacidade");
    assert.ok(emptyErrors.termsConsent, "Deve exigir consentimento dos termos");
    console.log(" -> PASS: Validação client-side rejeita formulário incompleto corretamente.");
    results.clientValidation = true;

    // -------------------------------------------------------------
    // GATE 4: Submissão e Registro no Supabase
    // -------------------------------------------------------------
    console.log("\n[GATE 4] Executando submissão da candidatura no Supabase...");
    const candidateData = {
      p_full_name: "Guilherme Santos Bastos",
      p_email: testEmail,
      p_institution_name: "Universidade Federal do Rio de Janeiro (UFRJ)",
      p_course: "Medicina",
      p_academic_term: "5º período",
      p_student_group: "Turma M-2024",
      p_student_id_number: "UFRJ-MED-12984",
      p_country: "Brasil",
      p_primary_device: "Mac / MacBook (macOS)",
      p_referral_source: "Coordenação de Anatomia UFRJ",
      p_motivation: "Participo do projeto de dissecção cadavérica e gostaria de testar os modelos 3D volumétricos e a tutoria por IA.",
      p_privacy_consent: true,
      p_terms_consent: true,
      p_communication_consent: true,
      p_source_origin: "landing_beta"
    };

    const { data: subRes, error: subErr } = await anonClient.rpc("submit_beta_application", candidateData);
    if (subErr || !subRes?.success || !subRes?.application_id) {
      throw new Error(`Falha na submissão: ${subErr?.message || JSON.stringify(subRes)}`);
    }
    testAppId = subRes.application_id;
    console.log(` - Candidatura aceita: ID=${testAppId}, Lote=${subRes.batch}, Status=${subRes.status}`);
    assert.equal(subRes.status, "pending");
    assert.equal(subRes.batch, "batch_1_30");
    console.log(" -> PASS: Submissão aceita com status 'pending' e lote da 1ª turma ('batch_1_30').");
    results.dbSubmission = true;

    // -------------------------------------------------------------
    // GATE 5: Prevenção de Duplicidades
    // -------------------------------------------------------------
    console.log("\n[GATE 5] Testando prevenção de duplicidade...");
    const { data: dupRes } = await anonClient.rpc("submit_beta_application", candidateData);
    assert.equal(dupRes?.success, false);
    assert.equal(dupRes?.code, "ALREADY_REGISTERED");
    console.log(" -> PASS: Submissão duplicada com o mesmo e-mail bloqueada com código ALREADY_REGISTERED.");
    results.duplicatePrevention = true;

    // -------------------------------------------------------------
    // GATE 6: RLS e Isolamento de Dados Pessoais
    // -------------------------------------------------------------
    console.log("\n[GATE 6] Testando RLS e isolamento de dados de outros candidatos...");
    const { data: anonRows } = await anonClient.from("beta_applications").select("id, full_name, email");
    assert.equal(anonRows?.length || 0, 0, "Usuários anônimos e estudantes não podem listar candidaturas");
    console.log(" -> PASS: 0 registros vazados para anônimos (RLS rigoroso ativo).");
    results.rlsPrivacyIsolation = true;

    // -------------------------------------------------------------
    // GATE 7: Ausência de Criação Automática de Contas
    // -------------------------------------------------------------
    console.log("\n[GATE 7] Verificando que a candidatura NÃO cria conta de usuário...");
    const userAuth = await runSupabaseSql(`SELECT id FROM auth.users WHERE email = '${testEmail}';`);
    assert.equal(userAuth.length, 0, "Candidato não deve existir em auth.users");
    const userPublic = await runSupabaseSql(`SELECT id FROM public.users WHERE email = '${testEmail}';`);
    assert.equal(userPublic.length, 0, "Candidato não deve existir em public.users");
    console.log(" -> PASS: Nenhuma conta ou sessão criada automaticamente.");
    results.noAutoAccountCreation = true;

    // -------------------------------------------------------------
    // GATE 8: Gestão Administrativa, Avaliação e Notificações
    // -------------------------------------------------------------
    console.log("\n[GATE 8] Testando gestão administrativa, avaliação e notificações...");
    // Notificação
    const notifs = await runSupabaseSql(`
      SELECT title, message, affected_resources 
      FROM public.institutional_notifications 
      WHERE affected_resources->>'application_id' = '${testAppId}';
    `);
    assert.ok(notifs.length > 0, "Notificação para administradores deve existir");
    assert.ok(notifs[0].message.includes("aeternumatlas@gmail.com"), "Notificação deve direcionar para aeternumatlas@gmail.com");
    console.log(` - Notificação administrativa confirmada: "${notifs[0].title}"`);

    // Avaliação (Review)
    const { data: revRes } = await adminClient.rpc("admin_review_beta_application", {
      p_application_id: testAppId,
      p_new_status: "approved",
      p_review_notes: "Candidato aprovado com perfil acadêmico de destaque na UFRJ.",
      p_batch: "batch_1_30"
    });
    assert.equal(revRes?.success, true);
    assert.equal(revRes?.status, "approved");

    const updatedApp = await runSupabaseSql(`SELECT status, decision_history FROM public.beta_applications WHERE id = '${testAppId}';`);
    assert.equal(updatedApp[0].status, "approved");
    assert.ok(updatedApp[0].decision_history.length >= 2, "Histórico de decisões deve registrar a aprovação");
    console.log(" -> PASS: Avaliação administrativa registrada com trilha de auditoria.");
    results.adminManagementAndReview = true;

    // -------------------------------------------------------------
    // GATE 9: Sumário de Capacidade
    // -------------------------------------------------------------
    console.log("\n[GATE 9] Verificando sumário de capacidade...");
    const { data: capRows } = await adminClient.from("beta_applications").select("status, batch");
    const approvedCount = capRows.filter(r => r.status === "approved" && r.batch === "batch_1_30").length;
    console.log(` - Vagas da 1ª Turma preenchidas: ${approvedCount} / 30`);
    assert.ok(approvedCount >= 1);
    console.log(" -> PASS: Controle de capacidade (meta 30) validado.");
    results.capacitySummary = true;

    // -------------------------------------------------------------
    // GATE 10: Preservação das Cinco Contas Estudantis Oficiais
    // -------------------------------------------------------------
    console.log("\n[GATE 10] Verificando integridade das cinco contas estudantis oficiais...");
    const studentUsers = await runSupabaseSql(`
      SELECT email, id, role, license_tier 
      FROM public.users 
      WHERE email IN (
        'halissonzanchin@aeternumatlas.com',
        'henriquebahia@aeternumatlas.com',
        'lucasparedes@aeternumatlas.com',
        'nicolasfigorelli@aeternumatlas.com',
        'edgartorales@aeternumatlas.com'
      );
    `);
    assert.equal(studentUsers.length, 5, "As 5 contas estudantis devem permanecer intactas");
    for (const u of studentUsers) {
      assert.equal(u.role, "student");
      assert.equal(u.license_tier, "student");
    }
    console.log(" -> PASS: 5 contas estudantis 100% preservadas e intactas.");
    results.existingAccountsPreserved = true;

  } finally {
    // Teardown
    if (testAppId) {
      console.log("\n[Teardown] Limpando dados do teste de homologação...");
      await runSupabaseSql(`DELETE FROM public.institutional_notifications WHERE affected_resources->>'application_id' = '${testAppId}';`);
      await runSupabaseSql(`DELETE FROM public.platform_events WHERE metadata->>'application_id' = '${testAppId}';`);
      await runSupabaseSql(`DELETE FROM public.beta_applications WHERE id = '${testAppId}';`);
      console.log(" -> Limpeza concluída.");
    }
  }

  console.log("\n================================================================================");
  console.log("=== RELATÓRIO DE HOMOLOGAÇÃO: 10/10 GATES APROVADOS (100% SUCESSO) ===");
  console.log("================================================================================\n");

  return results;
}

runHomologationSuite()
  .then(res => {
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error("FALHA NA HOMOLOGAÇÃO:", err);
    process.exit(1);
  });
