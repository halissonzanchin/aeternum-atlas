import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { isAcademicTutorAuthorizedRoute } from "../../src/utils/accessControl.js";
import {
  adminSectionFromPath,
  getAdminNavigationItems
} from "../../src/config/adminNavigation.js";
import { shellNavigationForRole } from "../../src/components/Layout/shellNavigation.js";
import {
  classifyStudentAccount,
  buildStudentRows,
  buildDashboardPayload,
  calculateContractedRevenue,
  STUDENT_ACCOUNT_CATEGORIES,
  buildGovernanceQuality,
  buildMostAccessedModels
} from "../../src/services/admin/institutionDashboardService.js";

console.log("===============================================================================");
console.log("SUITE DE TESTES: P0.21-ADM.2.1-R1 — ADMINISTRATIVE DATA TRUTH & QUALITY GATE");
console.log("===============================================================================\n");

const mockAdmin = {
  id: "19f44fd4-cba0-4a35-95c7-b1c5e3e9c5a0",
  email: "admin@aeternumatlas.com",
  role: "admin"
};

const mockSuperAdmin = {
  id: "3b0828cf-0fcf-4981-83b0-2940d4212332",
  email: "superadmin@aeternumatlas.com",
  role: "super_admin"
};

const mockStudent = {
  id: "a0168021-b8a2-4c35-8eab-c80240c10e07",
  email: "henriquebahia@aeternumatlas.com",
  role: "student"
};

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// GATE 1: ISOLAMENTO CONTEXTUAL DA MARINA ORB
// -----------------------------------------------------------------------------
console.log("--- GATE 1: Isolamento Contextual da Marina Orb ---");

runTest("Marina Orb é BLOQUEADA em todas as rotas administrativas e institucionais", () => {
  const adminPaths = [
    "/admin",
    "/admin/dashboard",
    "/admin/overview",
    "/admin/institution-students",
    "/admin/estimated-billing",
    "/admin/candidatos-beta",
    "/admin/beta-candidates",
    "/admin/settings",
    "/admin/models-3d",
    "/super-admin",
    "/super-admin/overview",
    "/super-admin/students",
    "/super-admin/candidatos-beta",
    "/super-admin/billing",
    "/super-admin/settings",
    "/institution",
    "/institution/dashboard",
    "/institution/overview",
    "/institution-admin",
    "/institution-admin/dashboard",
    "/institution-admin/students"
  ];

  for (const p of adminPaths) {
    const isAuthorized = isAcademicTutorAuthorizedRoute(p, mockAdmin, true);
    assert.strictEqual(
      isAuthorized,
      false,
      `A rota administrativa '${p}' DEVE bloquear a Marina Orb (retornou true)`
    );
  }
});

runTest("Marina Orb permanece 100% PRESERVADA nas rotas acadêmicas autorizadas", () => {
  const academicPaths = [
    "/dashboard",
    "/dashboard/overview",
    "/student/home",
    "/student/progress",
    "/professor/dashboard",
    "/coordinator/curriculum",
    "/rector/overview",
    "/models",
    "/models/cardiovascular",
    "/model/coracao-humano",
    "/atlas",
    "/atlas/viewer",
    "/flashcards",
    "/mind-map",
    "/quizzes",
    "/study-agenda",
    "/ai-tutor",
    "/ai-tutor/session",
    "/lessons/anatomia-1"
  ];

  for (const p of academicPaths) {
    const isAuthorized = isAcademicTutorAuthorizedRoute(p, mockStudent, true);
    assert.strictEqual(
      isAuthorized,
      true,
      `A rota acadêmica '${p}' DEVE permitir a Marina Orb (retornou false)`
    );
  }
});

runTest("Marina Orb permanece bloqueada em rotas públicas e pré-cadastrais", () => {
  const publicPaths = [
    "/",
    "/login",
    "/register",
    "/programa-beta",
    "/beta",
    "/forgot-password",
    "/recovery"
  ];

  for (const p of publicPaths) {
    const isAuthorized = isAcademicTutorAuthorizedRoute(p, mockAdmin, true);
    assert.strictEqual(
      isAuthorized,
      false,
      `A rota pública '${p}' DEVE bloquear a Marina Orb`
    );
  }
});

// -----------------------------------------------------------------------------
// GATE 2: CLASSIFICAÇÃO OPERACIONAL RIGOROSA & DIRETRIZ R1-03
// -----------------------------------------------------------------------------
console.log("\n--- GATE 2: Classificação Operacional Rigorosa ---");

runTest("Os 5 sócios fundadores são classificados como 'founder' via identificadores canônicos", () => {
  const founders = [
    { id: "a3911a5c-a3d0-4318-9d45-f6be6ac38fb4", email: "halissonzanchin@aeternumatlas.com", name: "Halisson Ricardo Zanchin Caceres" },
    { id: "a0168021-b8a2-4c35-8eab-c80240c10e07", email: "henriquebahia@aeternumatlas.com", name: "Victor Henrique Souza dos Santos" },
    { id: "f2591fae-8c18-4eb7-a97d-ae5ae90c5b34", email: "nicolasfigorelli@aeternumatlas.com", name: "Nicolas Figorelli Miranda Santos" },
    { id: "e9931f64-4de9-46fc-9e56-6705345406cb", email: "lucasparedes@aeternumatlas.com", name: "Lucas Alcides Paredes Gonzalez" },
    { id: "9f1cede4-3672-461b-bbe8-391dd59c988d", email: "edgartorales@aeternumatlas.com", name: "Edgar Osvaldo Torales Acosta" }
  ];

  for (const user of founders) {
    const category = classifyStudentAccount(user);
    assert.strictEqual(
      category.key,
      STUDENT_ACCOUNT_CATEGORIES.FOUNDER.key,
      `O usuário fundador ${user.email} deve ser classificado como 'founder'`
    );
  }
});

runTest("Contas de QA e Automação são classificadas como 'qa'", () => {
  const qaUsers = [
    { email: "qa.voice.p0@aeternumatlas.com", name: "QA Voice Tester" },
    { email: "atlas-e2e-ai-tutor@aeternumatlas.com", name: "Atlas Production QA Test User" },
    { email: "test.automated@aeternumatlas.com", name: "Automated Tester" }
  ];

  for (const user of qaUsers) {
    const category = classifyStudentAccount(user);
    assert.strictEqual(
      category.key,
      STUDENT_ACCOUNT_CATEGORIES.QA.key,
      `A conta de QA ${user.email} deve ser classificada como 'qa'`
    );
  }
});

runTest("Conta de Demonstração é classificada como 'demo'", () => {
  const demoUser = { email: "demo.institucional@aeternumatlas.com", name: "Aeternum Atlas — Demonstração Institucional" };
  const category = classifyStudentAccount(demoUser);
  assert.strictEqual(
    category.key,
    STUDENT_ACCOUNT_CATEGORIES.DEMO.key,
    "A conta de demonstração institucional deve ser classificada como 'demo'"
  );
});

runTest("Participante Beta externo é classificado como 'beta' SOMENTE quando 'activated' na fonte autorizada", () => {
  // 1. Candidato pendente NÃO é beta ativo (sem confundir candidatura com acesso)
  const pendingApplicant = { id: "beta-cand-pending", email: "pendente@ufpe.br", name: "Candidato Pendente" };
  const pendingCategory = classifyStudentAccount(pendingApplicant, {
    betaApplications: [{ email: "pendente@ufpe.br", status: "pending", batch: "batch_1_30", source_origin: "web" }]
  });
  assert.strictEqual(
    pendingCategory.key,
    STUDENT_ACCOUNT_CATEGORIES.UNCLASSIFIED.key,
    "Candidatura pendente NÃO deve classificar como beta ativo"
  );

  // 2. Candidato apenas aprovado ou convidado NÃO é participante ativo (deve aguardar ativação)
  const approvedOnly = { id: "beta-cand-approved", email: "aprovado@ufpe.br", name: "Candidato Aprovado Sem Ativação" };
  const approvedCategory = classifyStudentAccount(approvedOnly, {
    betaApplications: [{ email: "aprovado@ufpe.br", status: "approved", batch: "batch_1_30", source_origin: "web" }]
  });
  assert.strictEqual(
    approvedCategory.key,
    STUDENT_ACCOUNT_CATEGORIES.UNCLASSIFIED.key,
    "Candidato aprovado mas não ativado NÃO deve ser considerado participante ativo"
  );

  const invitedOnly = { id: "beta-cand-invited", email: "convidado@ufpe.br", name: "Candidato Convidado Sem Ativação" };
  const invitedCategory = classifyStudentAccount(invitedOnly, {
    betaApplications: [{ email: "convidado@ufpe.br", status: "invited", batch: "batch_1_30", source_origin: "web" }]
  });
  assert.strictEqual(
    invitedCategory.key,
    STUDENT_ACCOUNT_CATEGORIES.UNCLASSIFIED.key,
    "Candidato convidado mas não ativado NÃO deve ser considerado participante ativo"
  );

  // 3. Candidato com status 'activated' na fonte autorizada É classificado como 'beta'
  const activatedCandidate = { id: "beta-cand-activated", email: "ativado@ufpe.br", name: "Participante Beta Ativado" };
  const activatedCategory = classifyStudentAccount(activatedCandidate, {
    activatedBetaUserIds: new Set(["beta-cand-activated"])
  });
  assert.strictEqual(
    activatedCategory.key,
    STUDENT_ACCOUNT_CATEGORIES.EXTERNAL_BETA.key,
    "Participante formalmente ativado na fonte autorizada deve ser 'beta'"
  );

  // 4. Quarentena sintética: lote synthetic_test NÃO é classificado como participante real
  const syntheticApplicant = { id: "beta-synth", email: "synth@test.com", name: "Candidato Sintético" };
  const syntheticCategory = classifyStudentAccount(syntheticApplicant, {
    betaApplications: [{ email: "synth@test.com", status: "activated", batch: "synthetic_test", source_origin: "test" }]
  });
  assert.strictEqual(
    syntheticCategory.key,
    STUDENT_ACCOUNT_CATEGORIES.UNCLASSIFIED.key,
    "Candidatura de quarentena sintética NÃO deve ser classificada como participante real"
  );
});

runTest("Matrícula acadêmica em turma NÃO é considerada vínculo comercial (R1-03)", () => {
  const studentWithClassOnly = { id: "std-acad-only", email: "aluno.turma@upe.br", name: "Aluno Matriculado Sem Contrato" };
  const category = classifyStudentAccount(studentWithClassOnly, {
    enrolledStudentIds: new Set(["std-acad-only"]) // Apenas vínculo com turma acadêmica
  });
  assert.strictEqual(
    category.key,
    STUDENT_ACCOUNT_CATEGORIES.UNCLASSIFIED.key,
    "Matrícula em turma acadêmica NÃO constitui vínculo comercial — deve ser 'unclassified'"
  );
});

runTest("Aluno com contrato comercial formalmente comprovado é classificado como 'commercial'", () => {
  const commercialStudent = { id: "std-comm-verified", email: "aluno.pago@instituicao.edu.br", name: "Aluno com Licença Comercial" };
  const category = classifyStudentAccount(commercialStudent, {
    verifiedCommercialStudentIds: new Set(["std-comm-verified"])
  });
  assert.strictEqual(
    category.key,
    STUDENT_ACCOUNT_CATEGORIES.COMMERCIAL.key,
    "Aluno com licença comercial faturável comprovada deve ser 'commercial'"
  );
});

// -----------------------------------------------------------------------------
// GATE 3: VERACIDADE DOS PERFIS ACADÊMICOS & ZERO PREENCHIMENTOS ARTIFICIAIS
// -----------------------------------------------------------------------------
console.log("\n--- GATE 3: Veracidade dos Perfis Acadêmicos ---");

runTest("Perfil ausente NÃO recebe dados presumidos (MED-FUNDADOR, Medicina, 1º Semestre)", () => {
  const userWithoutProfile = {
    id: "9f1cede4-3672-461b-bbe8-391dd59c988d", // Edgar Torales
    email: "edgartorales@aeternumatlas.com",
    name: "Edgar Osvaldo Torales Acosta",
    role: "student",
    status: "active"
  };

  const rows = buildStudentRows({
    users: [userWithoutProfile],
    profiles: [],
    logs: [],
    models: [],
    profilesError: null
  });

  assert.strictEqual(rows.length, 1);
  const row = rows[0];

  assert.strictEqual(row.registration, "—", "Matrícula deve ser '—', nunca 'MED-FUNDADOR' ou 'PENDENTE'");
  assert.strictEqual(row.course, "—", "Curso deve ser '—', nunca 'Medicina' presumido");
  assert.strictEqual(row.semester, "—", "Semestre deve ser '—', nunca '1º Semestre' ou '1º Semestre (Homologação)'");
  assert.strictEqual(row.isProfileMissing, true, "isProfileMissing deve ser true");
  assert.strictEqual(row.profileStatus, "missing_profile", "profileStatus deve ser 'missing_profile'");
  assert.strictEqual(row.profileStatusLabel, "Não cadastrado", "profileStatusLabel deve ser 'Não cadastrado'");
});

runTest("Falha na consulta de perfil é distinguida de perfil inexistente", () => {
  const studentUser = {
    id: "std-query-fail",
    email: "aluno@universidade.edu.br",
    role: "student",
    status: "active"
  };

  const rows = buildStudentRows({
    users: [studentUser],
    profiles: [],
    logs: [],
    models: [],
    profilesError: new Error("PostgreSQL connection refused")
  });

  assert.strictEqual(rows.length, 1);
  const row = rows[0];
  assert.strictEqual(row.profileStatus, "query_error", "Status de falha de consulta deve ser 'query_error'");
  assert.strictEqual(row.profileStatusLabel, "Falha na consulta", "Rótulo deve ser 'Falha na consulta'");
});

runTest("Perfil real existente preserva integralmente os dados do banco", () => {
  const realUser = {
    id: "a3911a5c-a3d0-4318-9d45-f6be6ac38fb4",
    email: "halissonzanchin@aeternumatlas.com",
    name: "Halisson Ricardo Zanchin Caceres",
    role: "student",
    status: "active"
  };
  const realProfile = {
    user_id: realUser.id,
    course: "Medicina",
    semester: "1º Semestre",
    registration_number: "MED-2026-001"
  };

  const rows = buildStudentRows({
    users: [realUser],
    profiles: [realProfile],
    logs: [],
    models: []
  });

  assert.strictEqual(rows.length, 1);
  const row = rows[0];
  assert.strictEqual(row.registration, "MED-2026-001");
  assert.strictEqual(row.course, "Medicina");
  assert.strictEqual(row.semester, "1º Semestre");
  assert.strictEqual(row.isProfileMissing, false);
  assert.strictEqual(row.profileStatus, "available");
});

// -----------------------------------------------------------------------------
// GATE 4: INTELIGÊNCIA FINANCEIRA VERIFICÁVEL & DIRETRIZ R1-04
// -----------------------------------------------------------------------------
console.log("\n--- GATE 4: Inteligência Financeira Verificável (R1-04) ---");

runTest("Contrato não certificado retorna status 'not_configured' e receita nula via calculateContractedRevenue", () => {
  const uncertifiedInstitution = {
    id: "inst-1",
    contractedCapacity: 200,
    pricePerStudent: 45,
    contractCertified: false,
    contractStatus: "pilot"
  };

  const result = calculateContractedRevenue({
    selectedInstitution: uncertifiedInstitution,
    scope: "tenant"
  });

  assert.strictEqual(result.contractedRevenue, null, "Contrato não certificado DEVE ter receita contratada null");
  assert.strictEqual(result.financialStatus, "not_configured", "Status financeiro deve ser 'not_configured'");
  assert.strictEqual(result.currency, "BRL", "Moeda contratual oficial deve ser BRL");
  assert.strictEqual(result.currencySymbol, "R$", "Símbolo da moeda deve ser R$");
});

runTest("buildDashboardPayload não infere faturamento a partir de 'activeStudents * price' nem apresenta receita sem contrato", () => {
  const student1 = { id: "s-1", role: "student", status: "active", institution_id: "inst-test" };
  const student2 = { id: "s-2", role: "student", status: "active", institution_id: "inst-test" };

  const payload = buildDashboardPayload({
    scope: "tenant",
    selectedInstitution: {
      id: "inst-test",
      contractedCapacity: 100,
      pricePerStudent: 45,
      contractCertified: false // Piloto / não certificado
    },
    institutions: [],
    users: [student1, student2],
    profiles: [],
    logs: [],
    events: [],
    models: []
  });

  // Validação real da implementação da função:
  assert.strictEqual(payload.stats.contractedRevenue, null, "Receita contratada não certificada deve ser null");
  assert.strictEqual(payload.stats.estimatedRevenue, null, "Receita estimada deve ser null");
  assert.strictEqual(payload.stats.lostRevenue, null, "Receita perdida deve ser null");
  assert.strictEqual(payload.stats.financialStatus, "not_configured", "Status financeiro deve ser 'not_configured'");
  assert.strictEqual(payload.stats.currency, "BRL", "Moeda deve ser explicitamente BRL");
  
  // PROVA DE REGRESSÃO: garante que o cálculo 2 alunos * R$ 45 = R$ 90 NÃO é retornado
  assert.notStrictEqual(payload.stats.estimatedRevenue, 2 * 45, "NUNCA deve inferir faturamento de activeStudents * price");
});

// -----------------------------------------------------------------------------
// GATE 5: PRESENÇA ONLINE EM TEMPO REAL SEM FALLBACK HISTÓRICO (R1-01)
// -----------------------------------------------------------------------------
console.log("\n--- GATE 5: Presença Online em Tempo Real (R1-01) ---");

runTest("buildDashboardPayload retorna null para activeNow na ausência de heartbeat dedicado", () => {
  const now = new Date();
  const pastLog1 = {
    id: "l-1",
    user_id: "u-1",
    action: "view_model",
    duration_seconds: 300,
    created_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString() // 15 min atrás
  };
  const pastLog2 = {
    id: "l-2",
    user_id: "u-2",
    action: "view_model",
    duration_seconds: 600,
    created_at: new Date(now.getTime() - 40 * 60 * 1000).toISOString() // 40 min atrás
  };

  const payload = buildDashboardPayload({
    scope: "global",
    institutions: [],
    users: [],
    profiles: [],
    logs: [pastLog1, pastLog2],
    events: [],
    models: []
  });

  // Teste REAL chamando buildDashboardPayload:
  assert.strictEqual(payload.overviewMetrics.activeNow, null, "activeNow deve ser estritamente null");
  assert.strictEqual(payload.overviewMetrics.activeNowState, "unavailable");
  assert.strictEqual(payload.analytics.snapshot.activeUsersNow, null, "activeUsersNow deve ser estritamente null");
  assert.strictEqual(payload.overviewMetrics.recentActivity1h, 2, "recentActivity1h deve registrar 2 usuários na última hora");

  // PROVA DE REGRESSÃO: comprova que activeNow NÃO é igual a recentActivity1h nem a uniqueActiveUsers
  assert.notStrictEqual(payload.overviewMetrics.activeNow, payload.overviewMetrics.recentActivity1h);
  assert.notStrictEqual(payload.analytics.snapshot.activeUsersNow, payload.overviewMetrics.recentActivity1h);
});

// -----------------------------------------------------------------------------
// GATE 6: FONTES ANALÍTICAS CANÔNICAS (R1-01)
// -----------------------------------------------------------------------------
console.log("\n--- GATE 6: Fontes Analíticas Canônicas (R1-01) ---");

runTest("buildDashboardPayload deriva métricas exclusivamente de logs reais e ignora views legadas agregadas", () => {
  const now = new Date();
  const realLog1 = {
    id: "real-1",
    user_id: "u-real",
    action: "view_model",
    duration_seconds: 120,
    created_at: now.toISOString()
  };
  const realLog2 = {
    id: "real-2",
    user_id: "u-real",
    action: "view_model",
    duration_seconds: 180,
    created_at: now.toISOString()
  };

  // View legada simulando dados artificiais inflados
  const fakeLegacyViews = {
    usageSummary: {
      total_model_views: 99999,
      total_study_seconds: 8888888,
      unique_users: 7777
    }
  };

  const payload = buildDashboardPayload({
    scope: "global",
    institutions: [],
    users: [],
    profiles: [],
    logs: [realLog1, realLog2],
    events: [],
    models: [],
    views: fakeLegacyViews
  });

  // Comprova que as métricas são derivadas dos logs reais (2 acessos), NÃO da view legada (99999 acessos)
  assert.strictEqual(payload.overviewMetrics.accessesThisMonth, 2, "Acessos do mês devem vir dos logs reais (2)");
  assert.notStrictEqual(payload.overviewMetrics.accessesThisMonth, 99999, "NUNCA deve ler de views legadas");
  assert.strictEqual(payload.overviewMetrics.totalStudyHoursThisMonth, 0, "300 segundos = 0 horas arredondadas");
  assert.notStrictEqual(payload.overviewMetrics.totalStudyHoursThisMonth, Math.round(8888888 / 3600));
});

// -----------------------------------------------------------------------------
// GATE 7: CONSISTÊNCIA TEMPORAL DE PERÍODOS (DIRETRIZ R1-02)
// -----------------------------------------------------------------------------
console.log("\n--- GATE 7: Consistência Temporal de Períodos (R1-02) ---");

runTest("buildDashboardPayload alinha rigorosamente numerador e denominador na duração média do mês", () => {
  const now = new Date();
  
  // 1. Sessão de 60 dias atrás (mês anterior)
  const lastMonthDate = new Date(now);
  lastMonthDate.setMonth(now.getMonth() - 2);
  const oldLog = {
    id: "old-log",
    user_id: "u-old",
    action: "view_model",
    duration_seconds: 36000, // 10 horas
    created_at: lastMonthDate.toISOString()
  };

  // 2. Duas sessões deste mês: 600s + 600s = 1200s (20 minutos total, média 10 min/sessão)
  const currentLog1 = {
    id: "curr-1",
    user_id: "u-curr",
    action: "view_model",
    duration_seconds: 600,
    created_at: now.toISOString()
  };
  const currentLog2 = {
    id: "curr-2",
    user_id: "u-curr",
    action: "view_model",
    duration_seconds: 600,
    created_at: now.toISOString()
  };

  const payload = buildDashboardPayload({
    scope: "global",
    institutions: [],
    users: [],
    profiles: [],
    logs: [oldLog, currentLog1, currentLog2],
    events: [],
    models: []
  });

  // Mês corrente deve conter EXATAMENTE 2 acessos e média de 10 minutos (1200s / 2 / 60)
  assert.strictEqual(payload.overviewMetrics.accessesThisMonth, 2, "Acessos do mês devem contabilizar apenas sessões do mês corrente (2)");
  assert.strictEqual(payload.overviewMetrics.averageSessionMinutes, 10, "Duração média do mês deve ser 10 minutos (1200s / 2 sessões / 60)");

  // PROVA DE REGRESSÃO: garante que a duração média NÃO divide o tempo do mês por todas as sessões históricas (1200s / 3 sessões = 6.6 min)
  assert.notStrictEqual(payload.overviewMetrics.averageSessionMinutes, Math.round((1200 / 3) / 60));

  // Métricas all-time preservadas separadamente
  assert.strictEqual(payload.overviewMetrics.allTimeMetrics.totalModelViews, 3, "Total histórico deve registrar 3 acessos");
});

runTest("Declaração explícita de cobertura e limites de consulta (R1-02)", () => {
  const payload = buildDashboardPayload({
    scope: "global",
    institutions: [],
    users: [],
    profiles: [],
    logs: Array.from({ length: 15 }, (_, i) => ({ id: `l-${i}`, created_at: new Date().toISOString() })),
    events: [],
    models: []
  });

  assert.ok(payload.sourceCoverage, "Payload deve conter o objeto 'sourceCoverage'");
  assert.strictEqual(payload.sourceCoverage.limits.viewerSessionsLimit, 5000);
  assert.strictEqual(payload.sourceCoverage.limits.platformEventsLimit, 2000);
  assert.strictEqual(payload.sourceCoverage.observedCounts.viewerSessions, 15);
  assert.strictEqual(payload.sourceCoverage.coverageStatus, "observed_sample");
  assert.strictEqual(typeof payload.sourceCoverage.limitationNotice, "string");
  assert.ok(payload.betaOperations, "Payload deve conter 'betaOperations'");
  assert.strictEqual(payload.betaOperations.scopeReviewRequiredInAdm23, true);
  assert.strictEqual(payload.betaOperations.registrationOpen, false);
});

// -----------------------------------------------------------------------------
// GATE 8: NAVEGAÇÃO DA OPERAÇÃO EL DORADO NO SHELL RENDERIZADO
// -----------------------------------------------------------------------------
console.log("\n--- GATE 8: Navegação da Operação El Dorado ---");

runTest("Operação El Dorado É RENDERIZADA no menu do shell para Super Admin e Admin", () => {
  const t = (k) => k;
  const superItems = shellNavigationForRole("super_admin", "/super-admin", t);
  const adminItems = shellNavigationForRole("admin", "/admin", t);

  const superElDorado = superItems.find(it => it.href.includes("candidatos-beta") || it.label.includes("El Dorado"));
  const adminElDorado = adminItems.find(it => it.href.includes("candidatos-beta") || it.label.includes("El Dorado"));

  assert.ok(superElDorado, "Super Admin DEVE possuir o item 'Operação El Dorado' no menu");
  assert.ok(adminElDorado, "Admin DEVE possuir o item 'Operação El Dorado' no menu");
  assert.strictEqual(superElDorado.href, "/super-admin/candidatos-beta");
  assert.strictEqual(adminElDorado.href, "/admin/candidatos-beta");
});

runTest("Operação El Dorado NÃO É EXPOSTA no menu para estudantes", () => {
  const t = (k) => k;
  const studentItems = shellNavigationForRole("student", "/student/home", t);
  const studentElDorado = studentItems.find(it => it.href?.includes("candidatos-beta") || it.label?.includes("El Dorado"));
  assert.strictEqual(studentElDorado, undefined, "Estudantes NUNCA devem ter Operação El Dorado no menu");
});

runTest("adminSectionFromPath resolve todas as rotas e aliases canônicos da Operação El Dorado", () => {
  const betaRoutes = [
    "/super-admin/candidatos-beta",
    "/super-admin/beta-candidates",
    "/super-admin/programa-beta",
    "/super-admin/beta",
    "/admin/candidatos-beta",
    "/admin/beta-candidates",
    "/admin/programa-beta",
    "/admin/beta",
    "/institution-admin/candidatos-beta",
    "/institution-admin/beta-candidates",
    "/institution-admin/programa-beta"
  ];

  for (const route of betaRoutes) {
    const section = adminSectionFromPath(route);
    assert.strictEqual(
      section,
      "beta_candidates",
      `A rota '${route}' deve resolver para 'beta_candidates'`
    );
  }
});

// -----------------------------------------------------------------------------
// GATE 9: PRESERVAÇÃO RIGOROSA DOS CONTRATOS HISTÓRICOS
// -----------------------------------------------------------------------------
console.log("\n--- GATE 9: Preservação de Contratos Históricos ---");

runTest("getAdminNavigationItems preserva contagens contratuais exatas (12 admin, 14 super-admin)", () => {
  const adminNav = getAdminNavigationItems("/admin");
  const superNav = getAdminNavigationItems("/super-admin");
  assert.strictEqual(adminNav.length, 12, "getAdminNavigationItems('/admin') DEVE ter exatamente 12 itens");
  assert.strictEqual(superNav.length, 14, "getAdminNavigationItems('/super-admin') DEVE ter exatamente 14 itens");
});

// -----------------------------------------------------------------------------
// GATE 10: TAXONOMIA DE GOVERNANÇA & ESTADOS DE COBERTURA
// -----------------------------------------------------------------------------
console.log("\n--- GATE 10: Taxonomia de Governança & Estados de Cobertura ---");

runTest("Tabela 'academic_subjects' como 'not_implemented' NÃO degrada a governança", () => {
  const cleanResults = {
    users: { rows: [mockAdmin], count: 1 },
    studentProfiles: { rows: [{ user_id: mockStudent.id }], count: 1 },
    activityLogs: { rows: [{ id: "log-1" }], count: 1 },
    platformEvents: { rows: [{ id: "event-1" }], count: 1 },
    models: { rows: [{ id: "model-1" }], count: 1 },
    classes: { rows: [{ id: "class-1" }], count: 1 },
    classMemberships: { rows: [{ id: "mem-1" }], count: 1 },
    subjects: { rows: [], count: 0, state: "not_implemented" }
  };

  const quality = buildGovernanceQuality({
    profile: mockAdmin,
    results: cleanResults,
    views: { viewErrors: [] }
  });

  assert.strictEqual(quality.status, "policy_scoped");
  assert.deepStrictEqual(quality.unavailable, []);
  assert.strictEqual(quality.tables.subjects.state, "not_implemented");
});

runTest("Falha operacional real em tabela canônica É capturada como 'unavailable' e 'partial'", () => {
  const degradedResults = {
    users: { rows: [], count: 0, error: new Error("PostgreSQL timeout") },
    studentProfiles: { rows: [], count: 0 },
    activityLogs: { rows: [], count: 0 },
    platformEvents: { rows: [], count: 0 },
    models: { rows: [], count: 0 },
    classes: { rows: [], count: 0 },
    classMemberships: { rows: [], count: 0 },
    subjects: { rows: [], count: 0, state: "not_implemented" }
  };

  const quality = buildGovernanceQuality({
    profile: mockAdmin,
    results: degradedResults,
    views: { viewErrors: [] }
  });

  assert.strictEqual(quality.status, "partial");
  assert.ok(quality.unavailable.includes("users"));
});

// -----------------------------------------------------------------------------
// GATE 11: AUDITORIA DE SEGURANÇA OPERACIONAL & VALIDAÇÃO TLS
// -----------------------------------------------------------------------------
console.log("\n--- GATE 11: Auditoria de Segurança & Validação Estrita de TLS ---");

runTest("Workflow de CI do GitHub Actions exige validação estrita de TLS (sem bypass)", () => {
  const ciPath = path.resolve(".github/workflows/aeternum-26-ci.yml");
  const ciContent = fs.readFileSync(ciPath, "utf-8");
  assert.strictEqual(
    ciContent.includes("NODE_TLS_REJECT_UNAUTHORIZED: '0'"),
    false,
    "CI GitHub Actions NÃO DEVE conter bypass de TLS"
  );
  assert.strictEqual(
    ciContent.includes('NODE_TLS_REJECT_UNAUTHORIZED: "0"'),
    false,
    "CI GitHub Actions NÃO DEVE conter bypass de TLS"
  );
});

runTest("Scripts de teste ativos e serviços de produção NÃO possuem bypass de TLS", () => {
  const criticalFiles = [
    "tools/scripts/test_p0_21_mobile_regression.mjs",
    "tools/scripts/test_p0_21_e6_1_academic_journeys.mjs",
    "src/services/admin/institutionDashboardService.js",
    "src/services/auth/authService.js"
  ];

  criticalFiles.forEach(file => {
    const fullPath = path.resolve(file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      const hasBypass = content.includes('NODE_TLS_REJECT_UNAUTHORIZED = "0"') ||
                        content.includes("NODE_TLS_REJECT_UNAUTHORIZED = '0'") ||
                        content.includes('NODE_TLS_REJECT_UNAUTHORIZED="0"');
      assert.strictEqual(
        hasBypass,
        false,
        `Arquivo ${file} NÃO DEVE conter bypass de TLS (NODE_TLS_REJECT_UNAUTHORIZED=0)`
      );
    }
  });
});

// =============================================================================
// GATE 12: ELIMINAÇÃO DE INDICADORES FIXADOS NO JSX (ADM.2.2-R1)
// =============================================================================
console.log("\n--- GATE 12: Eliminação de Indicadores Fixados no JSX (ADM.2.2-R1) ---");

runTest("AdministrativeOperationsPage NÃO DEVE conter '3.063 observadas' ou contagens estáticas no JSX", () => {
  const pagePath = path.resolve("src/pages/administration/AdministrativeOperationsPage.jsx");
  const content = fs.readFileSync(pagePath, "utf-8");
  assert.strictEqual(
    content.includes("3.063 observadas"),
    false,
    "AdministrativeOperationsPage NÃO DEVE conter a string fixa '3.063 observadas' no JSX"
  );
  assert.strictEqual(
    content.includes("3063 observadas"),
    false,
    "AdministrativeOperationsPage NÃO DEVE conter a string fixa '3063 observadas' no JSX"
  );
});

// =============================================================================
// GATE 13: CONEXÃO FUNCIONAL DOS BOTÕES DE NAVEGAÇÃO NO OVERVIEW (ADM.2.2-R1)
// =============================================================================
console.log("\n--- GATE 13: Conexão Funcional dos Botões de Navegação (ADM.2.2-R1) ---");

runTest("OverviewSection DEVE receber prop 'navigate' e conectar os botões de navegação canônicos", () => {
  const pagePath = path.resolve("src/pages/administration/AdministrativeOperationsPage.jsx");
  const content = fs.readFileSync(pagePath, "utf-8");
  
  // OverviewSection recebe navigate
  assert.ok(
    content.includes("navigate={navigate}") && content.includes("<OverviewSection"),
    "OverviewSection DEVE receber a prop navigate={navigate} no AdministrativeOperationsPage"
  );
  
  // Botões de navegação presentes e com handlers
  assert.ok(
    content.includes("Abrir Triagem") && content.includes("candidatos-beta"),
    "Botão 'Abrir Triagem' DEVE apontar para rota de candidatos beta"
  );
  assert.ok(
    content.includes("Ver Analytics Completo") && (content.includes("global-analytics") || content.includes("analytics")),
    "Botão 'Ver Analytics Completo' DEVE apontar para rota de analytics"
  );
  assert.ok(
    content.includes("Ver Todos") && (content.includes("institution-students") || content.includes("students")),
    "Botão 'Ver Todos' DEVE apontar para rota de alunos"
  );
});

// =============================================================================
// GATE 14: DERIVAÇÃO DE MAU E ALINHAMENTO DE PERÍODOS TEMPORAIS (ADM.2.2-R1)
// =============================================================================
console.log("\n--- GATE 14: Derivação Canônica de MAU (ADM.2.2-R1) ---");

runTest("buildDashboardPayload DEVE calcular 'mau' e 'monthlyActiveUsers' baseado unicamente em currentMonthLogs", () => {
  const now = new Date();
  const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 15).toISOString();
  const priorMonthDate = new Date(now.getFullYear(), now.getMonth() - 2, 10).toISOString();
  
  const sampleLogs = [
    { id: "log-1", user_id: "user-alpha", action: "view_model", duration_seconds: 600, created_at: currentMonthDate },
    { id: "log-2", user_id: "user-alpha", action: "view_model", duration_seconds: 300, created_at: currentMonthDate },
    { id: "log-3", user_id: "user-beta", action: "view_model", duration_seconds: 400, created_at: currentMonthDate },
    { id: "log-4", user_id: "user-gamma", action: "view_model", duration_seconds: 500, created_at: priorMonthDate }
  ];

  const payload = buildDashboardPayload({
    institution: { id: "inst-1", name: "Universidad Privada del Este" },
    users: [{ id: "user-alpha" }, { id: "user-beta" }],
    logs: sampleLogs,
    models: [],
    popularity: [],
    studentProfiles: []
  });

  // MAU deve ser 2 (apenas user-alpha e user-beta no mês corrente)
  assert.strictEqual(payload.stats.mau, 2, "stats.mau DEVE conter apenas usuários únicos com sessões no mês corrente");
  assert.strictEqual(payload.stats.monthlyActiveUsers, 2, "stats.monthlyActiveUsers DEVE ser igual a stats.mau");
  assert.strictEqual(payload.overviewMetrics.mau, 2, "overviewMetrics.mau DEVE ser igual a stats.mau");
  assert.strictEqual(payload.overviewMetrics.monthlyActiveUsers, 2, "overviewMetrics.monthlyActiveUsers DEVE ser igual a stats.mau");
});

// =============================================================================
// GATE 15: CONTRATO DE DADOS COMPLETO DO RANKING ANATÔMICO (ADM.2.2-R1)
// =============================================================================
console.log("\n--- GATE 15: Contrato Completo do Ranking Anatômico (ADM.2.2-R1) ---");

runTest("buildMostAccessedModels DEVE retornar contrato canônico com title, name, system, anatomicalSystem, accesses, views, studyHours e totalStudyHours", () => {
  const models = [
    { id: "model-heart", title: "Coração Humano", anatomical_system: "Sistema Cardiovascular" },
    { id: "model-brain", name: "Encéfalo 3D", category: "Sistema Nervoso" }
  ];
  const logs = [
    { model_id: "model-heart", duration_seconds: 7200, action: "view_model" },
    { model_id: "model-heart", duration_seconds: 3600, action: "view_model" },
    { model_id: "model-brain", duration_seconds: 1800, action: "view_model" }
  ];

  const result = buildMostAccessedModels({ logs, models, popularity: [] });
  assert.ok(result.length >= 2, "Deve retornar os 2 modelos acessados");
  
  const heart = result.find(m => m.id === "model-heart");
  assert.strictEqual(heart.title, "Coração Humano");
  assert.strictEqual(heart.name, "Coração Humano");
  assert.strictEqual(heart.anatomicalSystem, "Sistema Cardiovascular");
  assert.strictEqual(heart.system, "Sistema Cardiovascular");
  assert.strictEqual(heart.accesses, 2);
  assert.strictEqual(heart.views, 2);
  assert.strictEqual(heart.studyHours, 3);
  assert.strictEqual(heart.totalStudyHours, 3);
});

// =============================================================================
// GATE 16: PRESERVAÇÃO DO ESTADO DE CERTIFICAÇÃO PENDENTE DO PROGRAMA BETA (ADM.2.2-R1)
// =============================================================================
console.log("\n--- GATE 16: Preservação do Estado de Certificação Pendente do Beta (ADM.2.2-R1) ---");

runTest("betaOperationsSummary DEVE preservar isPendingCertification: true e não transformar valores inexistentes em 0", () => {
  const payload = buildDashboardPayload({
    institution: { id: "inst-1" },
    users: [],
    logs: [],
    models: [],
    popularity: [],
    studentProfiles: []
  });

  assert.strictEqual(
    payload.betaOperations.isPendingCertification,
    true,
    "betaOperations DEVE indicar isPendingCertification: true"
  );
  assert.strictEqual(
    payload.betaOperations.totalApplications,
    null,
    "totalApplications DEVE ser null quando em certificação para evitar coerção para 0"
  );
  assert.strictEqual(
    payload.betaOperations.pending,
    null,
    "pending DEVE ser null quando em certificação"
  );
  assert.strictEqual(
    payload.betaOperations.registrationOpen,
    false,
    "Inscrições Beta DEVEM permanecer fechadas"
  );
});

// =============================================================================
// GATE 17: GRÁFICO TEMPORAL EXECUTIVO DERIVADO DE VIEWER_LEARNING_SESSIONS (ADM.2.2-R1)
// =============================================================================
console.log("\n--- GATE 17: Gráfico Temporal Executivo em Núcleo 3 (ADM.2.2-R1) ---");

runTest("AdministrativeOperationsPage e CSS DEVEM conter suporte a admin26-trend-chart e renderizar createGovernanceSeries", () => {
  const pagePath = path.resolve("src/pages/administration/AdministrativeOperationsPage.jsx");
  const cssPath = path.resolve("src/pages/administration/administrativeOperations.css");
  
  const pageContent = fs.readFileSync(pagePath, "utf-8");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  assert.ok(
    pageContent.includes("admin26-trend-chart") && pageContent.includes("createGovernanceSeries(snapshot)"),
    "AdministrativeOperationsPage DEVE renderizar .admin26-trend-chart com dados de createGovernanceSeries(snapshot)"
  );
  assert.ok(
    cssContent.includes(".admin26-trend-chart") && cssContent.includes(".admin26-trend-track"),
    "administrativeOperations.css DEVE declarar estilos Liquid Glass para .admin26-trend-chart"
  );
});

// =============================================================================
// GATE 18: IDENTIFICAÇÃO INSTITUCIONAL CANÔNICA UPE (ADM.2.2-R1)
// =============================================================================
console.log("\n--- GATE 18: Identificação Institucional Canônica UPE (ADM.2.2-R1) ---");

runTest("AdministrativeOperationsPage NÃO DEVE conter 'Universidade de Pernambuco' como fallback institucional", () => {
  const pagePath = path.resolve("src/pages/administration/AdministrativeOperationsPage.jsx");
  const pageContent = fs.readFileSync(pagePath, "utf-8");
  
  assert.strictEqual(
    pageContent.includes("Universidade de Pernambuco"),
    false,
    "AdministrativeOperationsPage NÃO DEVE conter 'Universidade de Pernambuco' como fallback"
  );
  assert.ok(
    pageContent.includes("Instituição não identificada"),
    "AdministrativeOperationsPage DEVE usar 'Instituição não identificada' como fallback quando ausente"
  );
});

// =============================================================================
// GATE 19: GOVERNANÇA REAL DAS FONTES EM NÚCLEO 6 (ADM.2.2-R2)
// =============================================================================
console.log("\n--- GATE 19: Governança Real das Fontes em Núcleo 6 (ADM.2.2-R2) ---");

runTest("Núcleo 6 e Command Header DEVEM derivar estados de data.quality.tables sem 'Conectado' estático", () => {
  const pagePath = path.resolve("src/pages/administration/AdministrativeOperationsPage.jsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  assert.ok(
    content.includes("formatTableState") && content.includes("getTableStateColor"),
    "AdministrativeOperationsPage DEVE utilizar formatTableState e getTableStateColor para Núcleo 6"
  );
  assert.ok(
    content.includes("data?.quality?.tables?.activityLogs") && content.includes("data?.quality?.tables?.platformEvents"),
    "Núcleo 6 DEVE consultar data.quality.tables para activityLogs e platformEvents"
  );
  assert.ok(
    content.includes("PostgREST Seguro"),
    "Command Header DEVE rotular PostgREST autenticado como 'PostgREST Seguro'"
  );
  assert.ok(
    content.includes("Session Guard Ativo"),
    "Command Header DEVE validar Session Guard ativo dinamicamente"
  );
});

// =============================================================================
// GATE 20: FILTROS RÁPIDOS QA/DEMO E CONSISTÊNCIA TEMPORAL (ADM.2.2-R2)
// =============================================================================
console.log("\n--- GATE 20: Filtros Rápidos QA/Demo e Consistência Temporal (ADM.2.2-R2) ---");

runTest("Filtros rápidos de discentes DEVEM incluir QA e Demo, e métricas mensais devem adotar badge 'mês corrente'", () => {
  const pagePath = path.resolve("src/pages/administration/AdministrativeOperationsPage.jsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  assert.ok(
    content.includes('key: "qa"') && content.includes('key: "demo"'),
    "Pílulas de filtro rápido DEVEM incluir as categorias 'qa' e 'demo'"
  );
  assert.ok(
    content.includes("Usuários 3D ativos no mês"),
    "Métrica de MAU institucional DEVE usar kicker 'Usuários 3D ativos no mês'"
  );
  assert.ok(
    content.includes("Modelos Anatômicos Mais Explorados — Histórico Observado"),
    "Ranking DEVE ser identificado como 'Modelos Anatômicos Mais Explorados — Histórico Observado'"
  );
});

// =============================================================================
// GATE 21: COERÇÃO NULA EM FALHA DE CONSULTA (ADM.2.2-R2)
// =============================================================================
console.log("\n--- GATE 21: Coerção Nula em Falha de Consulta (ADM.2.2-R2) ---");

runTest("buildDashboardPayload DEVE retornar null em métricas e coverage quando a fonte estiver unavailable", () => {
  const payload = buildDashboardPayload({
    institution: { id: "inst-1", name: "Universidad Privada del Este" },
    users: [{ id: "user-alpha" }],
    logs: [],
    models: [],
    studentProfiles: [],
    quality: {
      status: "partial",
      tables: {
        activityLogs: { state: "unavailable", rows: 0 },
        platformEvents: { state: "observed", rows: 10 }
      }
    }
  });

  assert.strictEqual(
    payload.overviewMetrics.accessesThisMonth,
    null,
    "accessesThisMonth DEVE ser null quando activityLogs falhar (unavailable)"
  );
  assert.strictEqual(
    payload.overviewMetrics.averageSessionMinutes,
    null,
    "averageSessionMinutes DEVE ser null quando activityLogs falhar"
  );
  assert.strictEqual(
    payload.overviewMetrics.mau,
    null,
    "mau DEVE ser null quando activityLogs falhar"
  );
  assert.strictEqual(
    payload.sourceCoverage.observedCounts.viewerSessions,
    null,
    "viewerSessions DEVE ser null quando activityLogs falhar"
  );
  assert.strictEqual(
    payload.sourceCoverage.coverageStatus,
    "partial_unavailable",
    "coverageStatus DEVE ser 'partial_unavailable' quando houver falha de consulta"
  );
  assert.strictEqual(
    payload.overviewMetrics.recentActivity1h,
    null,
    "recentActivity1h DEVE ser null quando activityLogs falhar, impedindo zero falso"
  );
});

// =============================================================================
// GATE 22: SANEAMENTO RESIDUAL ADM.2.2-R3 (RELEASE FREEZE)
// =============================================================================
console.log("\n--- GATE 22: Saneamento Residual ADM.2.2-R3 (Release Freeze) ---");

runTest("AdministrativeOperationsPage.jsx NÃO deve inferir Session Guard de data.source === 'supabase'", () => {
  const filePath = path.resolve(process.cwd(), "src/pages/administration/AdministrativeOperationsPage.jsx");
  const content = fs.readFileSync(filePath, "utf-8");

  assert.ok(
    !content.includes('data?.source === "supabase" && !guardState?.isUnavailable'),
    "NÃO deve inferir autorização do Session Guard a partir da origem Supabase"
  );
  assert.ok(
    content.includes("sessionGuardService.subscribe"),
    "DEVE utilizar subscrição reativa do sessionGuardService"
  );
  assert.ok(
    content.includes("isLogsUnavailable"),
    "DEVE verificar isLogsUnavailable para impedir zeros falsos em curva temporal e ranking"
  );
});

runTest("Operação El Dorado deve preservar capacidade 30 e availableSlots nulo antes da ADM.2.3", () => {
  const servicePath = path.resolve(process.cwd(), "src/services/admin/institutionDashboardService.js");
  const content = fs.readFileSync(servicePath, "utf-8");

  assert.ok(
    content.includes("capacityTotal: 30"),
    "Capacidade total planejada DEVE ser 30"
  );
  assert.ok(
    content.includes("availableSlots: null"),
    "availableSlots DEVE ser null antes da certificação de candidaturas na ADM.2.3"
  );
});

runTest("Suíte E2E de controle administrativo deve isolar conexões externas não autorizadas", () => {
  const testScriptPath = path.resolve(process.cwd(), "tools/scripts/test_p0_21_adm2_2_control_center.mjs");
  const content = fs.readFileSync(testScriptPath, "utf-8");

  assert.ok(
    content.includes('route.abort("blockedbyclient")'),
    "DEVE conter regra de bloqueio de conexões externas não autorizadas via blockedbyclient"
  );
});

console.log("\n===============================================================================");
console.log(`RESULTADO DA SUITE: ${passed} PASSOU | ${failed} FALHOU`);
console.log("===============================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
