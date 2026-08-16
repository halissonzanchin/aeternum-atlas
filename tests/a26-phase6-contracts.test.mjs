import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getAdminNavigationItems
} from "../src/config/adminNavigation.js";
import { navigationForRole } from "../src/config/roleNavigation.js";
import {
  canAccessRoute
} from "../src/services/permissions/permissionService.js";
import {
  administrationSourceState,
  createAdministrationAlerts,
  createAdministrationModelRows,
  createAdministrationSystemRows
} from "../src/pages/administration/administrationDecisionModel.js";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const page = await readFile(new URL("../src/pages/administration/AdministrativeOperationsPage.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/pages/administration/administrativeOperations.css", import.meta.url), "utf8");
const foundationCss = await readFile(new URL("../src/styles/A26Foundation.css", import.meta.url), "utf8");
const globalsCss = await readFile(new URL("../src/styles/globals.css", import.meta.url), "utf8");
const opticalGlassCss = await readFile(new URL("../src/styles/AeternumOpticalGlass.css", import.meta.url), "utf8");
const viewerPage = await readFile(new URL("../src/features/viewer/ViewerPage.jsx", import.meta.url), "utf8");
const progressService = await readFile(new URL("../src/services/progressService.js", import.meta.url), "utf8");
const dashboard = await readFile(new URL("../src/pages/dashboard/Dashboard.jsx", import.meta.url), "utf8");
const dashboardHook = await readFile(new URL("../src/features/dashboard/hooks/useDashboardData.js", import.meta.url), "utf8");
const modelViewer = await readFile(new URL("../src/components/ModelViewer/ModelViewer.jsx", import.meta.url), "utf8");
const analyticsService = await readFile(new URL("../src/services/analytics/analyticsService.js", import.meta.url), "utf8");
const weeklyStudyChart = await readFile(new URL("../src/features/dashboard/components/WeeklyStudyChart.jsx", import.meta.url), "utf8");
const progressDonut = await readFile(new URL("../src/components/Analytics/StrategicProgressDonut.jsx", import.meta.url), "utf8");
const tutorSession = await readFile(new URL("../src/context/AtlasAITutorSessionContext.jsx", import.meta.url), "utf8");
const tutorService = await readFile(new URL("../src/features/atlas-viewer/ai/atlasAITutorService.js", import.meta.url), "utf8");
const dashboardCss = await readFile(new URL("../src/features/dashboard/components/StudentDashboard.css", import.meta.url), "utf8");

const institutionAdmin = {
  id: "admin-contract",
  role: "institution_admin",
  status: "ativo",
  institutionId: "tenant-contract"
};

const superAdmin = {
  id: "super-contract",
  role: "super_admin",
  status: "ativo"
};

function routePath(item) {
  return Array.isArray(item) ? item[0] : item.path;
}

test("Admin e Superadmin recebem menus distintos e completos", () => {
  const adminItems = getAdminNavigationItems("/admin");
  const superItems = getAdminNavigationItems("/super-admin");
  const adminPaths = navigationForRole("institution_admin").map(routePath);
  const superPaths = navigationForRole("super_admin").map(routePath);

  assert.equal(adminItems.length, 12);
  assert.equal(superItems.length, 14);
  assert.equal(adminPaths.filter((path) => path === "/institution/dashboard").length, 1);
  assert.equal(adminPaths.includes("/admin/dashboard"), false);
  assert.equal(adminPaths.includes("/admin/digital-twins"), false);
  assert.ok(superPaths.includes("/super-admin/digital-twins"));
  assert.equal(superPaths.includes("/super-admin/atlas-migration"), false);
  assert.equal(superPaths.includes("/super-admin/atlas-certification"), false);
  assert.equal(superPaths.includes("/super-admin/aeternum-26-foundation"), false);
});

test("a canonicalização administrativa preserva o papel autenticado", () => {
  assert.match(app, /const basePath = user\?\.role === "super_admin" \? "\/super-admin" : "\/admin"/);
  assert.match(app, /getAdminNavigationItems\(basePath\)\.find/);
  assert.match(app, /path === "\/institution\/dashboard"\) return <Admin/);
  assert.match(app, /path === "\/super-admin"\) return <Admin/);
  assert.match(app, /pages\/administration\/AdministrativeOperationsPage/);
});

test("as rotas administrativas permanecem isoladas por permissão", () => {
  assert.equal(canAccessRoute(institutionAdmin, "/institution/dashboard"), true);
  assert.equal(canAccessRoute(institutionAdmin, "/admin/students"), true);
  assert.equal(canAccessRoute(institutionAdmin, "/super-admin"), false);
  assert.equal(canAccessRoute(superAdmin, "/super-admin"), true);
  assert.equal(canAccessRoute(superAdmin, "/admin/students"), true);
});

test("a experiência declara papel, seção, origem e estados honestos", () => {
  assert.match(page, /data-testid="a26-administration-experience"/);
  assert.match(page, /data-a26-role=\{scope\}/);
  assert.match(page, /data-a26-section=\{current\}/);
  assert.match(page, /data-a26-source=\{sourceState\.key\}/);
  assert.match(page, /A26LoadingState/);
  assert.match(page, /A26ErrorState/);
  assert.match(page, /A26EmptyState/);
  assert.match(page, /Coverage/);

  assert.equal(administrationSourceState({ source: "supabase", scope: "tenant" }, "ready").key, "observed");
  assert.equal(administrationSourceState({ source: "restricted" }, "ready").key, "restricted");
  assert.equal(administrationSourceState({ source: "supabase", quality: { status: "partial" } }, "ready").key, "partial");
});

test("analytics e heatmap derivam somente dos registros observados", () => {
  const data = {
    raw: {
      models: [
        { id: "brain", title: "Encéfalo", anatomical_system: "Nervoso" },
        { id: "heart", title: "Coração", anatomical_system: "Cardiovascular" }
      ]
    }
  };
  const snapshot = {
    currentLogs: [
      { model_id: "brain", duration_seconds: 1800 },
      { model_id: "brain", duration_seconds: 900 },
      { model_id: "heart", duration_seconds: 900 }
    ]
  };

  const systems = createAdministrationSystemRows(data, snapshot);
  const models = createAdministrationModelRows(data, snapshot);

  assert.deepEqual(systems.map((row) => [row.system, row.percentage]), [["Nervoso", 75], ["Cardiovascular", 25]]);
  assert.deepEqual(models.map((row) => [row.title, row.accesses, row.hours]), [["Encéfalo", 2, 0.8], ["Coração", 1, 0.3]]);
});

test("prioridades não ocultam leitura parcial nem inventam atividade", () => {
  const alerts = createAdministrationAlerts(
    "super_admin",
    {
      quality: { status: "partial", unavailable: ["academic_subjects"] },
      students: [],
      stats: { occupancyRate: 0 },
      platformHealth: { incidentsThisMonth: 0 }
    },
    { currentLogs: [] }
  );

  assert.equal(alerts[0].id, "partial-source");
  assert.ok(alerts.some((alert) => alert.id === "no-activity"));
});

test("o catálogo preserva Sketchfab e não anuncia motores ou pipelines removidos", () => {
  assert.match(page, /Sketchfab/);
  assert.match(page, /Planejado · não operacional/);
  assert.doesNotMatch(page, /atlasMigrationService|AtlasCertificationPipelinePage|atlas-migration|atlas-certification/);
  assert.doesNotMatch(viewerPage, /nativeEngine|AtlasViewer|AnatomyLayerPanel/);
  assert.doesNotMatch(viewerPage, /ViewerControls|viewer-command-dock|RightToolbar|engine=native|Camadas/);
  assert.equal(existsSync(new URL("../src/features/viewer/ViewerControls.jsx", import.meta.url)), false);
  assert.doesNotMatch(opticalGlassCss, /\.viewer-command-dock/);
});

test("as ações do Sketchfab usam uma única faixa Aeternum 26 organizada por função", () => {
  assert.match(modelViewer, /className="viewer-control-strip viewer-model-actions"/);
  assert.match(modelViewer, /material="regular"/);
  assert.match(modelViewer, /actionGroups\.map/);
  assert.match(modelViewer, /data-action-group=\{group\.id\}/);
  assert.doesNotMatch(modelViewer, /aa-viewer-actions/);
  assert.doesNotMatch(modelViewer, /data-tooltip=\{t\(labelKey\)\}/);
  assert.match(foundationCss, /\.viewer-model-actions \.a26-button > \.a26-surface__refract\s*\{[\s\S]*?display:\s*none/);
  assert.doesNotMatch(globalsCss, /\.viewer-control-strip button(?::hover)?::after/);
});

test("o Viewer estudantil não expõe métricas operacionais de uso do modelo", () => {
  assert.doesNotMatch(modelViewer, /ModelAnalyticsCard|aa-model-usage|Uso do modelo/);
  assert.match(analyticsService, /export function getModelAnalytics\(modelId\)/);
  assert.match(analyticsService, /annotationClicks/);
  assert.match(analyticsService, /cameraResets/);
});

test("o progresso estudantil deriva de eventos observados sem estimativas artificiais", () => {
  assert.doesNotMatch(progressService, /estimatedMinutesForModel|Math\.max\(totalModels,\s*12\)|progressPercent\s*>=\s*50/);
  assert.match(progressService, /durationSeconds/);
  assert.match(progressService, /getCompletedModelIds/);
  assert.match(dashboardHook, /observedRecommendations/);
  assert.match(dashboardHook, /fetchLearningTelemetry/);
  assert.match(dashboardHook, /buildSystemLearningMetrics/);
  assert.match(dashboardHook, /buildStudySeries/);
  assert.doesNotMatch(dashboard, /recommendationCards|recommendationPaths/);
});

test("ações persistentes exigem fonte autorizada e confirmação explícita", () => {
  assert.match(page, /data\?\.source !== "supabase"/);
  assert.match(page, /A revisão exige uma sessão Supabase autorizada/);
  assert.match(page, /Esta ação altera o estado persistido da conta e exige confirmação explícita/);
  assert.match(page, /Confirmar aprovação/);
  assert.match(page, /Confirmar rejeição/);
});

test("a composição administrativa é responsiva, tátil e sem blur direto", () => {
  assert.match(css, /\.admin26-table-scroll/);
  assert.match(css, /overflow-x:\s*auto/);
  assert.match(page, /className="admin26-table-scroll" tabIndex="0"/);
  assert.match(page, /onKeyDown=\{handleTableKeyDown\}/);
  assert.match(page, /event\.currentTarget\.scrollLeft \+=/);
  assert.match(css, /\.admin26-table-scroll:focus-visible/);
  assert.match(css, /\.admin26-page \.admin26-toolbar\s*\{[\s\S]*?position:\s*sticky/);
  assert.match(page, /variant="ghost" onClick=\{\(\) => onInspect\(row\)\}>Ver contexto/);
  assert.match(css, /@media \(max-width:\s*1280px\)/);
  assert.match(css, /@media \(max-width:\s*1023px\)/);
  assert.match(css, /@media \(max-width:\s*760px\)/);
  assert.doesNotMatch(css, /(?:-webkit-)?backdrop-filter\s*:/);
  assert.match(foundationCss, /\.a26-button\s*\{[\s\S]*?min-height:\s*44px/);
  assert.match(css, /\.admin26-embedded-module button,[\s\S]*?min-height:\s*44px/);
});

test("Minha evolução preserva períodos legíveis e progresso proporcional aos dados", () => {
  assert.match(weeklyStudyChart, /const MAX_VISIBLE_BARS = 12/);
  assert.match(weeklyStudyChart, /function aggregateStudySeries\(data = \[\]\)/);
  assert.match(weeklyStudyChart, /const renderedData = aggregateStudySeries\(data\)/);
  assert.match(weeklyStudyChart, /gridTemplateColumns:\s*`repeat\(\$\{Math\.max\(renderedData\.length, 1\)\}, minmax\(0, 1fr\)\)`/);
  assert.match(progressDonut, /className="donut-sector-track"/);
  assert.match(progressDonut, /const activeEndAngle = sector\.startAngle \+ \(\(sector\.endAngle - sector\.startAngle\) \* sector\.percent\) \/ 100/);
  assert.match(dashboardCss, /\.learning-period-switch\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
});

test("o histórico do Tutor é cronológico, ampliado e não exibe comandos internos", () => {
  assert.match(tutorSession, /const MAX_MESSAGES = 160/);
  assert.match(tutorSession, /\.order\(["']created_at["'], \{ ascending: false \}\)/);
  assert.match(tutorSession, /remoteMessages\.slice\(\)\.reverse\(\)/);
  assert.match(tutorSession, /sanitizeTutorDisplayText/);
  assert.match(tutorService, /export function sanitizeTutorDisplayText/);
  assert.match(tutorService, /ACTION_TOKEN_PATTERN/);
  assert.match(tutorService, /PARTIAL_ACTION_TOKEN_PATTERN/);
});

test("o Viewer recebe o contêiner Liquid Glass sem reposicionar o token Atlas AI", () => {
  assert.match(foundationCss, /\.atlas-crystal-viewer \.viewer-canvas-panel\.is-sketchfab-mode\s*\{/);
  assert.match(foundationCss, /\.atlas-crystal-viewer \.viewer-control-strip\.viewer-model-actions\s*\{/);
  assert.match(foundationCss, /\.atlas-crystal-viewer \.aa-viewer-shell\s*\{/);
  assert.doesNotMatch(foundationCss, /\.atlas-crystal-viewer[^\n{]*(?:ai-orb|atlas-ai-token|atlas-ai-orb|ai-tutor-fab)[^{]*\{/i);
});
