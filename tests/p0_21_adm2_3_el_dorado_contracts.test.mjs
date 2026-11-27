import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  validateBetaApplication,
  buildBetaApplicationsCsvContent,
  exportBetaApplicationsCsv,
  sanitizeCsvFormula,
  fetchAllBetaApplicationsForExport
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

test("P0.21-ADM.2.3 — Hardening: Proteção contra Injeção de Fórmulas CSV (CWE-1236) e Exportação Não Truncada", () => {
  // Teste de sanitização contra gatilhos de formula injection (=, +, -, @, tab, cr)
  assert.equal(sanitizeCsvFormula("=cmd|' /C calc'!A0"), "'=cmd|' /C calc'!A0");
  assert.equal(sanitizeCsvFormula("+SUM(A1:A10)"), "'+SUM(A1:A10)");
  assert.equal(sanitizeCsvFormula("-1+1"), "'-1+1");
  assert.equal(sanitizeCsvFormula("@HYPERLINK('http://malicious.com')"), "'@HYPERLINK('http://malicious.com')");
  assert.equal(sanitizeCsvFormula("\tTABBED_VALUE"), "'\tTABBED_VALUE");
  assert.equal(sanitizeCsvFormula("\rCR_VALUE"), "'\rCR_VALUE");
  assert.equal(sanitizeCsvFormula("Valor Legítimo"), "Valor Legítimo");
  assert.equal(sanitizeCsvFormula(null), "");
  assert.equal(sanitizeCsvFormula(undefined), "");

  // Verificar que fetchAllBetaApplicationsForExport existe e é função
  assert.equal(typeof fetchAllBetaApplicationsForExport, "function");

  // Injeção de fórmula em buildBetaApplicationsCsvContent
  const testCandidate = [
    {
      protocol_number: "=1+1",
      full_name: "+Admin Exploit",
      email: "-test@med.br",
      institution_name: "@USP",
      course: "Medicina",
      academic_term: "1º Semestre",
      motivation: "Estudo acadêmico",
      status: "pending",
      batch: "batch_1_30"
    }
  ];

  const generatedCsv = buildBetaApplicationsCsvContent(testCandidate);
  assert.ok(generatedCsv.includes("\"'=1+1\""), "Deve neutralizar formula '=' no protocolo");
  assert.ok(generatedCsv.includes("\"'+Admin Exploit\""), "Deve neutralizar formula '+' no nome");
  assert.ok(generatedCsv.includes("\"'-test@med.br\""), "Deve neutralizar formula '-' no email");
  assert.ok(generatedCsv.includes("\"'@USP\""), "Deve neutralizar formula '@' na instituição");
});

test("P0.21-ADM.2.3 — Hardening: Tratamento Estrito de Indisponibilidade de Dados (Sem Falsos Zeros ou 30s)", () => {
  const serviceSrc = fs.readFileSync(path.resolve("src/services/beta/betaRegistrationService.js"), "utf8");
  const sectionSrc = fs.readFileSync(path.resolve("src/pages/administration/sections/BetaCandidatesManagementSection.jsx"), "utf8");

  // O serviço deve retornar isUnavailable: true e campos nulos em falha
  assert.ok(
    serviceSrc.includes("isUnavailable: true"),
    "betaRegistrationService deve retornar isUnavailable: true em falhas"
  );
  assert.ok(
    serviceSrc.includes("batch1Remaining: null"),
    "betaRegistrationService NÃO deve presumir 30 vagas livres em caso de erro"
  );

  // A UI deve renderizar traços '—' quando indisponível
  assert.ok(
    sectionSrc.includes('capacity?.isUnavailable || capacity?.total == null ? "—" : capacity.total'),
    "Métrica de total deve exibir '—' quando indisponível"
  );
  assert.ok(
    sectionSrc.includes('capacity?.isUnavailable || capacity?.batch1Approved == null ? "—" : `${capacity.batch1Approved} / 30`'),
    "Métrica de vagas aprovadas deve exibir '—' quando indisponível"
  );

  // Status activated deve estar presente nas opções da interface
  assert.ok(
    sectionSrc.includes('activated: "Ativados"'),
    "STATUS_LABELS deve incluir activated"
  );
  assert.ok(
    sectionSrc.includes('value="activated"'),
    "Modal de avaliação deve incluir opção para status activated"
  );
});

test("P0.21-ADM.2.3 — Hardening: Migration de RLS, Row Lock FOR UPDATE e Capacidade com Ativação", () => {
  const migPath = path.resolve("supabase/migrations/20261127000000_p0_21_adm_2_3_el_dorado_hardening.sql");
  const migSrc = fs.readFileSync(migPath, "utf8");

  // Revogação de UPDATE direto
  assert.ok(
    migSrc.includes("REVOKE UPDATE ON public.beta_applications FROM authenticated;"),
    "Migration DEVE revogar UPDATE direto de authenticated na tabela beta_applications"
  );

  // Row Lock FOR UPDATE
  assert.ok(
    migSrc.includes("FOR UPDATE;"),
    "admin_review_beta_application DEVE utilizar lock de linha FOR UPDATE"
  );

  // Advisory lock
  assert.ok(
    migSrc.includes("pg_advisory_xact_lock"),
    "admin_review_beta_application DEVE utilizar pg_advisory_xact_lock"
  );

  // Inclusão de activated e user_id no cômputo da capacidade
  assert.ok(
    migSrc.includes("(status IN ('approved', 'invited', 'activated') OR user_id IS NOT NULL)"),
    "Cômputo de capacidade DEVE incluir status activated e user_id vinculado"
  );

  // Validação de capacidade em mudança de lote
  assert.ok(
    migSrc.includes("v_current_app.batch IS DISTINCT FROM v_target_batch"),
    "Cômputo de capacidade DEVE revalidar quando houver transferência de lote"
  );

  // Exclusão de quarentena sintética
  assert.ok(
    migSrc.includes("batch != 'synthetic_test'"),
    "Cômputo de capacidade DEVE excluir quarentena sintética"
  );

  // RPC agregada get_beta_operational_summary
  assert.ok(
    migSrc.includes("CREATE OR REPLACE FUNCTION public.get_beta_operational_summary()"),
    "Migration DEVE criar RPC get_beta_operational_summary()"
  );
});
