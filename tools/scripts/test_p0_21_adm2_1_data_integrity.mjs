import assert from "node:assert/strict";
import { isAcademicTutorAuthorizedRoute } from "../../src/utils/accessControl.js";
import {
  adminSectionFromPath,
  getAdminNavigationItems,
  adminNavigationItems
} from "../../src/config/adminNavigation.js";
import {
  classifyStudentAccount,
  STUDENT_ACCOUNT_CATEGORIES,
  CANONICAL_MODEL_METADATA,
  buildGovernanceQuality
} from "../../src/services/admin/institutionDashboardService.js";

console.log("===============================================================================");
console.log("SUITE DE TESTES: P0.21-ADM.2.1 — ADMINISTRATIVE DATA INTEGRITY & ANALYTICS");
console.log("===============================================================================\n");

const mockUser = {
  id: "19f44fd4-cba0-4a35-95c7-b1c5e3e9c5a0",
  email: "admin@aeternumatlas.com",
  role: "admin"
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

  for (const path of adminPaths) {
    const isAuthorized = isAcademicTutorAuthorizedRoute(path, mockUser, true);
    assert.strictEqual(
      isAuthorized,
      false,
      `A rota administrativa '${path}' DEVE bloquear a Marina Orb (retornou true)`
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

  for (const path of academicPaths) {
    const isAuthorized = isAcademicTutorAuthorizedRoute(path, mockStudent, true);
    assert.strictEqual(
      isAuthorized,
      true,
      `A rota acadêmica '${path}' DEVE permitir a Marina Orb (retornou false)`
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

  for (const path of publicPaths) {
    const isAuthorized = isAcademicTutorAuthorizedRoute(path, mockUser, true);
    assert.strictEqual(
      isAuthorized,
      false,
      `A rota pública '${path}' DEVE bloquear a Marina Orb`
    );
  }
});

// -----------------------------------------------------------------------------
// GATE 2: CLASSIFICAÇÃO RIGOROSA DAS CONTAS DE ESTUDANTES
// -----------------------------------------------------------------------------
console.log("\n--- GATE 2: Classificação das Contas de Estudantes ---");

runTest("Os 5 sócios fundadores são classificados como 'founder' (Homologação Interna)", () => {
  const founders = [
    { email: "halissonzanchin@aeternumatlas.com", name: "Halisson Ricardo Zanchin Caceres" },
    { email: "henriquebahia@aeternumatlas.com", name: "Victor Henrique Souza dos Santos" },
    { email: "nicolasfigorelli@aeternumatlas.com", name: "Nicolas Figorelli Miranda Santos" },
    { email: "lucasparedes@aeternumatlas.com", name: "Lucas Alcides Paredes Gonzalez" },
    { email: "edgartorales@aeternumatlas.com", name: "Edgar Osvaldo Torales Acosta" }
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
    { email: "atlas-e2e-ai-tutor@aeternumatlas.com", name: "Atlas Production QA Test User" }
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

runTest("Alunos regulares / institucionais são classificados como 'commercial'", () => {
  const standardStudent = { email: "aluno.medicina@universidade.edu.br", name: "Aluno Institucional" };
  const category = classifyStudentAccount(standardStudent);
  assert.strictEqual(
    category.key,
    STUDENT_ACCOUNT_CATEGORIES.COMMERCIAL.key,
    "Alunos regulares devem ser classificados como 'commercial'"
  );
});

// -----------------------------------------------------------------------------
// GATE 3: ALINHAMENTO DE NAVEGAÇÃO & ROTAS DA OPERAÇÃO EL DORADO
// -----------------------------------------------------------------------------
console.log("\n--- GATE 3: Navegação Administrativa & Operação El Dorado ---");

runTest("Módulo 'beta_candidates' é mapeado e resolve rotas e aliases canônicos", () => {
  const section1 = adminSectionFromPath("/admin/candidatos-beta");
  const section2 = adminSectionFromPath("/super-admin/candidatos-beta");
  assert.strictEqual(section1, "beta_candidates");
  assert.strictEqual(section2, "beta_candidates");
});

runTest("adminSectionFromPath resolve corretamente todas as rotas e aliases do Beta", () => {
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
      `A rota '${route}' deve resolver para 'beta_candidates' (resolveu para '${section}')`
    );
  }
});

runTest("Módulo 'announcements' está presente e resolve corretamente", () => {
  const announcementRoutes = [
    "/super-admin/comunicados",
    "/super-admin/announcements",
    "/admin/comunicados",
    "/admin/announcements",
    "/institution-admin/comunicados"
  ];

  for (const route of announcementRoutes) {
    const section = adminSectionFromPath(route);
    assert.strictEqual(
      section,
      "announcements",
      `A rota '${route}' deve resolver para 'announcements'`
    );
  }
});

// -----------------------------------------------------------------------------
// GATE 4: DICIONÁRIO DE MODELOS CANÔNICOS & ENRIQUECIMENTO DE SESSÕES
// -----------------------------------------------------------------------------
console.log("\n--- GATE 4: Dicionário de Modelos Canônicos ---");

runTest("IDs canônicos e legados resolvem para títulos humanos e sistemas anatômicos", () => {
  assert.strictEqual(
    CANONICAL_MODEL_METADATA["2c57a03b-2c77-4119-b8bb-676ea59e9190"]?.title,
    "Corte Sagital do Crânio Humano — Modelo Superficial 3D"
  );
  assert.strictEqual(
    CANONICAL_MODEL_METADATA["coracao-edicao-morgue"]?.title,
    "Coração Humano — Edição Especial Morgue"
  );
  assert.strictEqual(
    CANONICAL_MODEL_METADATA["corte-sagital-sistema-reprodutor-feminino"]?.title,
    "Corte Sagital da Pelve Feminina / Sistema Reprodutor"
  );
});

// -----------------------------------------------------------------------------
// GATE 5: TAXONOMIA DE QUALIDADE DE GOVERNANÇA & SANEAMENTO DE ALERTA
// -----------------------------------------------------------------------------
console.log("\n--- GATE 5: Taxonomia de Governança & Saneamento de Alertas ---");

runTest("Tabela 'academic_subjects' como 'not_implemented' NÃO rebaixa o status para 'partial'", () => {
  const cleanResults = {
    users: { rows: [mockUser], count: 1 },
    studentProfiles: { rows: [{ user_id: mockStudent.id }], count: 1 },
    activityLogs: { rows: [{ id: "log-1" }], count: 1 },
    platformEvents: { rows: [{ id: "event-1" }], count: 1 },
    models: { rows: [{ id: "model-1" }], count: 1 },
    classes: { rows: [{ id: "class-1" }], count: 1 },
    classMemberships: { rows: [{ id: "mem-1" }], count: 1 },
    subjects: { rows: [], count: 0, state: "not_implemented" }
  };

  const quality = buildGovernanceQuality({
    profile: mockUser,
    results: cleanResults,
    views: { viewErrors: [] }
  });

  assert.strictEqual(
    quality.status,
    "policy_scoped",
    "Com subjects 'not_implemented' e tabelas canônicas saudáveis, status deve ser 'policy_scoped'"
  );
  assert.deepStrictEqual(
    quality.unavailable,
    [],
    "A lista de tabelas unavailable DEVE estar vazia"
  );
  assert.strictEqual(
    quality.tables.subjects.state,
    "not_implemented",
    "subjects deve estar classificado como 'not_implemented'"
  );
});

runTest("Falha operacional real em tabela canônica É capturada como 'unavailable' e 'partial'", () => {
  const degradedResults = {
    users: { rows: [], count: 0, error: new Error("PostgreSQL connection timeout") },
    studentProfiles: { rows: [], count: 0 },
    activityLogs: { rows: [], count: 0 },
    platformEvents: { rows: [], count: 0 },
    models: { rows: [], count: 0 },
    classes: { rows: [], count: 0 },
    classMemberships: { rows: [], count: 0 },
    subjects: { rows: [], count: 0, state: "not_implemented" }
  };

  const quality = buildGovernanceQuality({
    profile: mockUser,
    results: degradedResults,
    views: { viewErrors: [] }
  });

  assert.strictEqual(
    quality.status,
    "partial",
    "Falha real em 'users' DEVE resultar em status 'partial'"
  );
  assert.ok(
    quality.unavailable.includes("users"),
    "A tabela 'users' DEVE constar na lista de unavailable"
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
