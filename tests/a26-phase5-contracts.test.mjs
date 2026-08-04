import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createGovernanceAlerts,
  createGovernancePeriodSnapshot
} from "../src/pages/governance/governanceDecisionModel.js";
import {
  COORDINATOR_SECTIONS,
  RECTOR_SECTIONS,
  governanceSectionFromPath
} from "../src/config/governanceRoutes.js";
import { canAccessRoute } from "../src/services/permissions/permissionService.js";

const page = await readFile(new URL("../src/pages/governance/GovernanceRolePage.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/pages/governance/governanceRolePage.css", import.meta.url), "utf8");
const service = await readFile(new URL("../src/services/admin/institutionDashboardService.js", import.meta.url), "utf8");

const coordinator = {
  id: "coordinator-contract",
  role: "coordinator",
  status: "ativo",
  institutionId: "tenant-contract"
};

const rector = {
  id: "rector-contract",
  role: "rector",
  status: "ativo",
  institutionId: "tenant-contract"
};

test("todas as rotas da Fase 5 permanecem entregues", () => {
  assert.equal(Object.keys(COORDINATOR_SECTIONS).length, 6);
  assert.equal(Object.keys(RECTOR_SECTIONS).length, 5);

  Object.entries(COORDINATOR_SECTIONS).forEach(([section, item]) => {
    assert.equal(governanceSectionFromPath("coordinator", item.path), section);
  });
  Object.entries(RECTOR_SECTIONS).forEach(([section, item]) => {
    assert.equal(governanceSectionFromPath("rector", item.path), section);
  });
});

test("a experiência institucional declara papel, seção e origem", () => {
  assert.match(page, /data-testid="a26-governance-experience"/);
  assert.match(page, /data-a26-role=\{role\}/);
  assert.match(page, /data-a26-section=\{section\}/);
  assert.match(page, /data-a26-source=\{sourceLabel\}/);
  assert.match(page, /Supabase institucional · escopo do papel/);
  assert.match(page, /zero não significa ausência global/);
});

test("a Fase 5 consulta a estrutura acadêmica e certifica cobertura", () => {
  assert.match(service, /loadInstitutionRows\("academic_classes"/);
  assert.match(service, /loadInstitutionRows\("academic_class_students"/);
  assert.match(service, /loadInstitutionRows\("academic_subjects"/);
  assert.match(service, /function buildGovernanceQuality/);
  assert.match(service, /status: unavailable\.length \|\| viewErrors \? "partial" : "policy_scoped"/);
  assert.match(page, /CoverageDisclosure/);
});

test("comparações temporais são derivadas dos registros observados", () => {
  const reference = new Date("2026-07-29T12:00:00.000Z");
  const data = {
    raw: {
      logs: [
        { user_id: "a", duration_seconds: 600, created_at: "2026-07-28T12:00:00.000Z" },
        { user_id: "b", duration_seconds: 300, created_at: "2026-07-27T12:00:00.000Z" },
        { user_id: "a", duration_seconds: 120, created_at: "2026-07-20T12:00:00.000Z" }
      ],
      events: [
        { user_id: "a", created_at: "2026-07-28T12:00:00.000Z" }
      ]
    }
  };
  const snapshot = createGovernancePeriodSnapshot(data, 7, reference);

  assert.equal(snapshot.accesses.current, 2);
  assert.equal(snapshot.accesses.previous, 1);
  assert.equal(snapshot.studyMinutes.current, 15);
  assert.equal(snapshot.activeUsers.current, 2);
  assert.equal(snapshot.accesses.percent, 100);
});

test("prioridades de Coordenação e Reitoria são distinguíveis", () => {
  const data = {
    quality: { status: "policy_scoped", unavailable: [], viewErrors: 0 },
    students: [],
    raw: {
      users: [],
      academicClasses: [],
      academicSubjects: []
    },
    stats: { occupancyRate: 0 },
    platformHealth: { incidentsThisMonth: 0 }
  };
  const snapshot = createGovernancePeriodSnapshot({ raw: { logs: [], events: [] } }, 30);
  const coordinatorAlerts = createGovernanceAlerts("coordinator", data, snapshot);
  const rectorAlerts = createGovernanceAlerts("rector", data, snapshot);

  assert.ok(coordinatorAlerts.some((item) => item.id === "faculty-empty"));
  assert.ok(coordinatorAlerts.some((item) => item.id === "classes-empty"));
  assert.ok(rectorAlerts.some((item) => item.id === "engagement-empty"));
  assert.equal(rectorAlerts.some((item) => item.id === "faculty-empty"), false);
});

test("drill-down, filtros e estados vazios preservam o próximo passo", () => {
  assert.match(page, /A26SegmentedControl/);
  assert.match(page, /A26Modal/);
  assert.match(page, /Ver contexto/);
  assert.match(page, /Ver cobertura da fonte/);
  assert.match(page, /Retorno acadêmico não inferido/);
  assert.match(page, /A26EmptyState/);
});

test("a composição da Fase 5 é responsiva, tátil e sem novo blur direto", () => {
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /@media \(max-width:\s*1180px\)/);
  assert.match(css, /@media \(max-width:\s*860px\)/);
  assert.match(css, /@media \(max-width:\s*620px\)/);
  assert.match(css, /\.governance-table-scroll/);
  assert.doesNotMatch(css, /(?:-webkit-)?backdrop-filter\s*:/);
});

test("Coordenação e Reitoria permanecem isoladas por papel", () => {
  assert.equal(canAccessRoute(coordinator, "/coordinator/dashboard"), true);
  assert.equal(canAccessRoute(coordinator, "/rector/dashboard"), false);
  assert.equal(canAccessRoute(rector, "/rector/dashboard"), true);
  assert.equal(canAccessRoute(rector, "/coordinator/dashboard"), false);
});

