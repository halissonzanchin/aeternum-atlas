import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  validateBetaApplication,
  buildBetaApplicationsCsvContent,
  exportBetaApplicationsCsv
} from "../src/services/beta/betaRegistrationService.js";
import { adminSectionFromPath } from "../src/config/adminNavigation.js";
import { shellNavigationForRole } from "../src/components/Layout/shellNavigation.js";

// =============================================================================
// AETERNUM ATLAS — P0.21-ADM.2.3: OPERAÇÃO EL DORADO CONTRACT SUITE
// GATES E7.1, E7.2, E7.3, TAXONOMIA DE SEGURANÇA E PRESERVAÇÃO
// =============================================================================

test("P0.21-ADM.2.3 — Gate E7.1: Validação Client-Side Estrita do Formulário de Candidatura", () => {
  // 1. Rejeição de formulário vazio
  const emptyErrors = validateBetaApplication({});
  assert.ok(emptyErrors.fullName, "Deve exigir nome completo");
  assert.ok(emptyErrors.email, "Deve exigir e-mail");
  assert.ok(emptyErrors.institutionName, "Deve exigir instituição de ensino");
  assert.ok(emptyErrors.course, "Deve exigir curso");
  assert.ok(emptyErrors.academicTerm, "Deve exigir período ou semestre");
  assert.ok(emptyErrors.primaryDevice, "Deve exigir dispositivo principal");
  assert.ok(emptyErrors.motivation, "Deve exigir motivação");
  assert.ok(emptyErrors.privacyConsent, "Deve exigir consentimento de privacidade (LGPD)");
  assert.ok(emptyErrors.termsConsent, "Deve exigir consentimento de termos do programa beta");

  // 2. Validação de tamanho mínimo do nome completo (>= 3 chars)
  const shortNameErrors = validateBetaApplication({ fullName: "Al" });
  assert.equal(shortNameErrors.fullName, "Nome completo deve ter pelo menos 3 caracteres.");

  // 3. Validação de formato de e-mail
  const badEmailErrors = validateBetaApplication({
    fullName: "Dra. Helena Barreto",
    email: "email-invalido-sem-dominio"
  });
  assert.ok(badEmailErrors.email, "Deve rejeitar e-mail inválido");

  // 4. Validação de tamanho da motivação (>= 10 chars)
  const shortMotErrors = validateBetaApplication({
    fullName: "Dra. Helena Barreto",
    email: "helena@usp.br",
    institutionName: "USP",
    course: "Medicina",
    academicTerm: "3º ano",
    primaryDevice: "Desktop / Notebook (Windows)",
    motivation: "Pouco",
    privacyConsent: true,
    termsConsent: true
  });
  assert.equal(shortMotErrors.motivation, "Compartilhe uma breve motivação (mínimo de 10 caracteres).");

  // 5. Aceitação de formulário válido completo
  const validErrors = validateBetaApplication({
    fullName: "Dra. Helena Barreto",
    email: "helena.barreto@fm.usp.br",
    institutionName: "Faculdade de Medicina da USP",
    course: "Medicina",
    academicTerm: "5º Semestre",
    primaryDevice: "Desktop / Notebook (Windows)",
    motivation: "Interesse em anatomia topográfica e estudo de peças cadavéricas 3D.",
    privacyConsent: true,
    termsConsent: true
  });
  assert.equal(Object.keys(validErrors).length, 0, "Formulário válido não deve gerar erros");
});

test("P0.21-ADM.2.3 — Gate E7.1: Banner de Pré-Lançamento e Desativação do Botão em registration_open=false", () => {
  const betaPageSrc = fs.readFileSync(path.resolve("src/pages/beta/BetaRegistrationPage.jsx"), "utf8");
  
  // Deve conter banner de pré-lançamento explícito
  assert.ok(
    betaPageSrc.includes("beta-prelaunch-banner"),
    "BetaRegistrationPage deve conter classe do banner de pré-lançamento"
  );
  assert.ok(
    betaPageSrc.includes("FASE DE PRÉ-LANÇAMENTO · INSCRIÇÕES EM BREVE"),
    "Deve conter aviso explícito de fase de pré-lançamento"
  );
  assert.ok(
    betaPageSrc.includes("disabled={!programStatus.registration_open || loading}"),
    "Botão de envio deve estar bloqueado quando registration_open for false"
  );
});

test("P0.21-ADM.2.3 — Gate E7.2: Rotas Canônicas e Navegação Administrativa da Operação El Dorado", () => {
  // Rotas canônicas devem resolver para a seção 'beta_candidates'
  assert.equal(adminSectionFromPath("/super-admin/candidatos-beta"), "beta_candidates");
  assert.equal(adminSectionFromPath("/admin/candidatos-beta"), "beta_candidates");
  assert.equal(adminSectionFromPath("/institution-admin/candidatos-beta"), "beta_candidates");
  assert.equal(adminSectionFromPath("/super-admin/programa-beta"), "beta_candidates");
  assert.equal(adminSectionFromPath("/admin/programa-beta"), "beta_candidates");

  // Shell navigation: presente para super_admin e admin, ausente para student
  const dummyT = (k) => k;
  const superNav = shellNavigationForRole("super_admin", "/super-admin/dashboard", dummyT);
  const superBeta = superNav.find(item => item.id === "beta_candidates" || item.href?.includes("candidatos-beta"));
  assert.ok(superBeta, "Super admin deve possuir menu da Operação El Dorado");

  const adminNav = shellNavigationForRole("admin", "/admin/dashboard", dummyT);
  const adminBeta = adminNav.find(item => item.id === "beta_candidates" || item.href?.includes("candidatos-beta"));
  assert.ok(adminBeta, "Admin deve possuir menu da Operação El Dorado");

  const studentNav = shellNavigationForRole("student", "/student/dashboard", dummyT);
  const studentBeta = studentNav.find(item => item.id === "beta_candidates" || item.href?.includes("candidatos-beta"));
  assert.equal(studentBeta, undefined, "Estudante NÃO deve ter menu de gestão de candidatos beta");
});

test("P0.21-ADM.2.3 — Gate E7.2: Exportação Estruturada CSV com UTF-8 BOM e Delimitador ';' para Excel pt-BR", () => {
  const sampleApps = [
    {
      id: "app-1",
      protocol_number: "BETA-2026-A1B2C3D4",
      created_at: "2026-11-26T14:30:00Z",
      full_name: "Mariana Vasconcelos",
      email: "mariana@med.unicamp.br",
      institution_name: "UNICAMP",
      course: "Medicina",
      academic_term: "6º Semestre",
      student_group: "Turma A",
      student_id_number: "RA-123456",
      primary_device: "Desktop / Notebook (Windows)",
      country: "Brasil",
      referral_source: "Professor",
      motivation: "Estudo de cirurgia torácica e dissecção cadavérica.",
      status: "pending",
      batch: "batch_1_30",
      review_notes: "",
      reviewed_at: null,
      reviewed_by: null
    },
    {
      id: "app-synthetic",
      protocol_number: "BETA-2026-SYNTH01",
      created_at: "2026-11-26T14:35:00Z",
      full_name: "Candidato Sintético",
      email: "synthetic@audit.test",
      institution_name: "Audit Inst",
      course: "Medicina",
      academic_term: "1º Semestre",
      student_group: "QA",
      student_id_number: "QA-001",
      primary_device: "Desktop",
      country: "Brasil",
      referral_source: "QA Test",
      motivation: "Teste sintético de quarentena.",
      status: "rejected",
      batch: "synthetic_test",
      review_notes: "Registro isolado de auditoria",
      reviewed_at: "2026-11-26T14:36:00Z",
      reviewed_by: "qa-admin"
    }
  ];

  // 1. Geração com exclusão padrão de candidatos sintéticos
  const csvDefault = buildBetaApplicationsCsvContent(sampleApps, { excludeSynthetic: true });
  assert.ok(csvDefault.startsWith("\uFEFF"), "CSV deve iniciar com UTF-8 BOM (\\uFEFF)");
  assert.ok(csvDefault.includes(";"), "CSV deve utilizar ponto-e-vírgula (;) como delimitador");
  assert.ok(csvDefault.includes("Mariana Vasconcelos"), "Deve conter Mariana Vasconcelos");
  assert.ok(!csvDefault.includes("Candidato Sintético"), "Candidato sintético NÃO deve aparecer no CSV padrão");

  // 2. Geração com inclusão explícita de registros sintéticos (modo auditoria)
  const csvAudit = buildBetaApplicationsCsvContent(sampleApps, { excludeSynthetic: false });
  assert.ok(csvAudit.includes("Mariana Vasconcelos"));
  assert.ok(csvAudit.includes("Candidato Sintético"), "Candidato sintético deve aparecer no modo auditoria");

  // 3. Verificação dos 18 cabeçalhos canônicos
  const headerLine = csvAudit.split("\r\n")[0].replace("\uFEFF", "");
  const headers = headerLine.split(";");
  assert.equal(headers.length, 18, "CSV deve possuir exatamente 18 colunas");
  assert.equal(headers[0], "Protocolo");
  assert.equal(headers[1], "Data Submissão");
  assert.equal(headers[2], "Nome Completo");
  assert.equal(headers[3], "E-mail");
  assert.equal(headers[4], "Instituição");
  assert.equal(headers[5], "Curso");
  assert.equal(headers[6], "Período/Ano");
  assert.equal(headers[7], "Turma/Grupo");
  assert.equal(headers[8], "Matrícula");
  assert.equal(headers[9], "Dispositivo");
  assert.equal(headers[10], "País");
  assert.equal(headers[11], "Como Conheceu");
  assert.equal(headers[12], "Motivação");
  assert.equal(headers[13], "Status");
  assert.equal(headers[14], "Lote");
  assert.equal(headers[15], "Notas de Revisão");
  assert.equal(headers[16], "Data Avaliação");
  assert.equal(headers[17], "Avaliador");

  // 4. exportBetaApplicationsCsv em ambiente Node deve retornar string do CSV com segurança
  const exportRes = exportBetaApplicationsCsv(sampleApps);
  assert.ok(typeof exportRes === "string" && exportRes.startsWith("\uFEFF"));
});

test("P0.21-ADM.2.3 — Gate E7.2: Componente Administrativo de Gestão e Triagem com 7 Filtros e Teto 30", () => {
  const sectionSrc = fs.readFileSync(path.resolve("src/pages/administration/sections/BetaCandidatesManagementSection.jsx"), "utf8");

  // 7 Filtros de status
  assert.ok(sectionSrc.includes("all: \"Todos\""));
  assert.ok(sectionSrc.includes("pending: \"Pendentes\""));
  assert.ok(sectionSrc.includes("under_review: \"Em Análise\""));
  assert.ok(sectionSrc.includes("approved: \"Aprovados\""));
  assert.ok(sectionSrc.includes("waitlisted: \"Lista de Espera\""));
  assert.ok(sectionSrc.includes("invited: \"Convidados\""));
  assert.ok(sectionSrc.includes("rejected: \"Rejeitados\""));

  // Indicador de Lote 1 com teto rígido de 30
  assert.ok(sectionSrc.includes("batch_1_30"));
  assert.ok(sectionSrc.includes("/ 30"), "Métricas devem exibir teto rígido de 30 vagas");

  // Modal de avaliação manual
  assert.ok(sectionSrc.includes("A26Modal"), "Deve utilizar A26Modal para triagem");
  assert.ok(sectionSrc.includes("reviewBetaApplication"), "Deve chamar reviewBetaApplication");
  assert.ok(sectionSrc.includes("Diretriz de Segurança"), "Modal deve conter aviso explícito de não criação automática de usuário");
});

test("P0.21-ADM.2.3 — Gate E7.3: Desacoplamento Absoluto entre Inscrição Pública e Provisionamento de Contas", () => {
  // A submissão pública (RPC submit_beta_application) JAMAIS insere em auth.users ou public.users
  const migrationSrc = fs.readFileSync(path.resolve("supabase/migrations/20261124150000_p0_21_e4_resend_subject_alignment.sql"), "utf8");
  
  assert.ok(
    migrationSrc.includes("INSERT INTO public.beta_applications"),
    "Deve inserir exclusivamente na tabela beta_applications"
  );
  assert.ok(
    !migrationSrc.includes("INSERT INTO auth.users"),
    "RPC pública JAMAIS deve inserir em auth.users"
  );
  assert.ok(
    !migrationSrc.includes("INSERT INTO public.users"),
    "RPC pública JAMAIS deve inserir em public.users"
  );
  assert.ok(
    migrationSrc.includes("'pending'"),
    "Candidatura deve ser sempre criada com status 'pending'"
  );
});

test("P0.21-ADM.2.3 — Gate E7.3: Edge Function send-beta-notification com Idempotência e Autenticação Estrita", () => {
  const edgeSrc = fs.readFileSync(path.resolve("supabase/functions/send-beta-notification/index.ts"), "utf8");
  
  // Rejeição estrita de chave anônima
  assert.ok(
    edgeSrc.includes("ANON_KEY_REJECTED"),
    "Edge function deve rejeitar chave anônima pública"
  );
  
  // Reserva atômica via RPC claim_next_beta_email_notification
  assert.ok(
    edgeSrc.includes("claim_next_beta_email_notification"),
    "Edge function deve utilizar claim_next_beta_email_notification"
  );

  // Idempotência no envio Resend
  assert.ok(
    edgeSrc.includes("Idempotency-Key"),
    "Edge function deve enviar cabeçalho Idempotency-Key ao Resend"
  );

  // Sanitização anti-XSS no corpo HTML
  assert.ok(
    edgeSrc.includes("escapeHtml"),
    "Edge function deve sanitizar campos do candidato contra injeção HTML"
  );
});

test("P0.21-ADM.2.3 — Preservação: 5 Contas dos Sócios Fundadores e Diretoria Executiva Intactas", () => {
  const serviceSrc = fs.readFileSync(path.resolve("src/services/admin/institutionDashboardService.js"), "utf8");
  
  // As 5 contas oficiais continuam mapeadas na categoria FOUNDER
  const founderEmails = [
    "halissonzanchin@aeternumatlas.com",
    "henriquebahia@aeternumatlas.com",
    "lucasparedes@aeternumatlas.com",
    "nicolasfigorelli@aeternumatlas.com",
    "edgartorales@aeternumatlas.com"
  ];

  for (const email of founderEmails) {
    assert.ok(
      serviceSrc.includes(email),
      `institutionDashboardService deve conter e-mail do sócio fundador: ${email}`
    );
  }
});
