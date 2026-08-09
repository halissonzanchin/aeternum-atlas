import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildStudySeries,
  buildSystemLearningMetrics,
  calculateLearningTotals
} from "../src/services/learningMetrics.js";

const storageSource = await readFile(
  new URL("../src/services/storage/storageService.js", import.meta.url),
  "utf8"
);
const telemetrySource = await readFile(
  new URL("../src/services/learningTelemetryService.js", import.meta.url),
  "utf8"
);
const authSource = await readFile(
  new URL("../src/services/auth/authService.js", import.meta.url),
  "utf8"
);
const viewerProgressSource = await readFile(
  new URL("../src/features/viewer/hooks/useViewerProgress.js", import.meta.url),
  "utf8"
);
const migrationSource = await readFile(
  new URL("../supabase/migrations/20260803000000_learning_telemetry_v2.sql", import.meta.url),
  "utf8"
);

test("sessões de conta e de estudo são separadas e registros duplicados não inflam o total", () => {
  const totals = calculateLearningTotals([
    { id: "account-1", scope: "account", activeSeconds: 300 },
    { id: "viewer-1", scope: "viewer", activeSeconds: 120 },
    { id: "viewer-1", scope: "viewer", activeSeconds: 120 },
    { id: "viewer-2", scope: "viewer", durationSeconds: 60 }
  ]);

  assert.deepEqual(totals, {
    connectedSeconds: 300,
    studySeconds: 180,
    accountSessions: 1,
    viewerSessions: 2
  });
});

test("as séries semanal, mensal e anual usam somente tempo ativo do Viewer", () => {
  const now = new Date(2026, 7, 3, 12, 0, 0);
  const sessions = [
    { id: "account", scope: "account", startedAt: new Date(2026, 7, 3, 9).toISOString(), activeSeconds: 3600 },
    { id: "today", scope: "viewer", startedAt: new Date(2026, 7, 3, 10).toISOString(), activeSeconds: 120 },
    { id: "yesterday", scope: "viewer", startedAt: new Date(2026, 7, 2, 10).toISOString(), activeSeconds: 60 },
    { id: "last-month", scope: "viewer", startedAt: new Date(2026, 6, 20, 10).toISOString(), activeSeconds: 180 }
  ];

  const week = buildStudySeries(sessions, "week", { now, language: "pt" });
  const month = buildStudySeries(sessions, "month", { now, language: "pt" });
  const year = buildStudySeries(sessions, "year", { now, language: "pt" });

  assert.equal(week.length, 7);
  assert.equal(week.reduce((sum, item) => sum + item.minutes, 0), 3);
  assert.equal(month.length, 6);
  assert.equal(month.reduce((sum, item) => sum + item.minutes, 0), 6);
  assert.equal(year.length, 12);
  assert.equal(year.reduce((sum, item) => sum + item.minutes, 0), 6);
  assert.equal(month.some(item => "start" in item || "end" in item), false);
});

test("desempenho por sistema combina tempo, cobertura de marcações e simulados reais", () => {
  const metrics = buildSystemLearningMetrics({
    models: [
      { id: "brain", slug: "encefalo", system: "Sistema Nervoso" },
      { id: "heart", system: "Sistema Cardiovascular" }
    ],
    sessions: [
      { id: "brain-session", scope: "viewer", modelId: "encefalo", activeSeconds: 600 },
      { id: "account-session", scope: "account", modelId: "brain", activeSeconds: 900 }
    ],
    events: [
      { id: "list", modelId: "brain", eventType: "annotation_list_loaded", eventData: { annotationCount: 3 } },
      { id: "focus-1", modelId: "brain", eventType: "annotation_focused", eventData: { annotationIndex: 0 } },
      { id: "focus-2", modelId: "brain", eventType: "annotation_selected", eventData: { annotationIndex: 1 } },
      { id: "focus-2", modelId: "brain", eventType: "annotation_selected", eventData: { annotationIndex: 1 } }
    ],
    quizResults: [
      { id: "quiz-1", modelId: "brain", score: 4, totalQuestions: 5 }
    ],
    completedModelIds: ["heart"]
  });

  const nervous = metrics.find(item => item.system === "Sistema Nervoso");
  const cardiovascular = metrics.find(item => item.system === "Sistema Cardiovascular");

  assert.equal(nervous.studyMinutes, 10);
  assert.equal(nervous.annotationViewed, 2);
  assert.equal(nervous.annotationTotal, 3);
  assert.equal(nervous.annotationCoveragePercent, 67);
  assert.equal(nervous.quizAttempts, 1);
  assert.equal(nervous.quizAccuracyPercent, 80);
  assert.equal(nervous.metricType, "quiz");
  assert.equal(nervous.percent, 80);
  assert.equal(cardiovascular.completionPercent, 100);
});

test("o contrato elimina a colisão histórica de chaves e preserva migração não destrutiva", () => {
  assert.match(storageSource, /analyticsEvents:\s*"aeternum_analytics_events_v2"/);
  assert.match(storageSource, /accessLogs:\s*"aeternum_model_access_logs_v2"/);
  assert.match(storageSource, /legacyTelemetry:\s*"aeternum_access_logs"/);
  assert.match(storageSource, /migrateLegacyTelemetryStorage/);
  assert.doesNotMatch(storageSource, /removeItem\(STORAGE_KEYS\.legacyTelemetry/);
});

test("o rastreador mede atividade, inatividade, visibilidade e heartbeat sem dupla duração", () => {
  assert.match(telemetrySource, /DEFAULT_IDLE_TIMEOUT_MS\s*=\s*90_000/);
  assert.match(telemetrySource, /DEFAULT_HEARTBEAT_MS\s*=\s*15_000/);
  assert.match(telemetrySource, /visibilitychange/);
  assert.match(telemetrySource, /pagehide/);
  assert.match(telemetrySource, /activeSeconds/);
  assert.match(telemetrySource, /idleSeconds/);
  assert.match(viewerProgressSource, /startTrackedLearningSession/);
  assert.doesNotMatch(viewerProgressSource, /trackModelAccess\([^)]*viewer_duration/);
});

test("eventos remotos aguardam a sessão-pai e preservam o log append-only", () => {
  assert.match(telemetrySource, /await persistSessionRemote\(parentSession\)/);
  assert.match(telemetrySource, /from\("viewer_learning_events"\)\.insert\(/);
  assert.doesNotMatch(
    telemetrySource,
    /from\("viewer_learning_events"\)\.upsert\(/
  );
  assert.match(telemetrySource, /error\.code !== "23505"/);
});

test("logout encerra e sincroniza a sessão antes de invalidar o JWT", () => {
  assert.match(telemetrySource, /finalizeTrackedLearningSessionsForUser/);
  assert.match(telemetrySource, /Promise\.allSettled\(trackers\.map\(tracker => tracker\.waitForRemote\(\)\)\)/);
  assert.match(
    authSource,
    /export async function logoutUser[\s\S]*await finalizeTrackedLearningSessionsForUser\(user\.id, "logout"\)[\s\S]*clearAuthProfile\(\)[\s\S]*await supabase\.auth\.signOut\(\)/
  );
});

test("a migração cria telemetria canônica com RLS por usuário e leitura institucional", () => {
  assert.match(migrationSource, /viewer_learning_sessions/);
  assert.match(migrationSource, /viewer_learning_events/);
  assert.match(migrationSource, /viewer_quiz_results/);
  assert.match(migrationSource, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migrationSource, /auth\.uid\(\) = user_id/);
  assert.match(migrationSource, /current_user_institution_id\(\)/);
});
