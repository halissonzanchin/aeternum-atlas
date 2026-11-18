import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { calculateAnatomicalMasteryBySystem } from "../src/services/academicMetricsService.js";

const migrationSql = await readFile(new URL("../supabase/migrations/20261118120000_p0_16_academic_metrics_expansion.sql", import.meta.url), "utf8");

test("Migration SQL uses PostgreSQL range_agg for mathematically sound interval union", () => {
  assert.match(migrationSql, /range_agg\(r\)/);
  assert.match(migrationSql, /tstzrange\(\s*session_start/);
  assert.match(migrationSql, /EXTRACT\(EPOCH FROM \(upper\(un\) - lower\(un\)\)\)/);
});

test("Migration SQL deduplicates pending flashcards by card_id to prevent double-counting", () => {
  assert.match(migrationSql, /DISTINCT ON\s*\(card_id\)\s+card_id,\s+next_review_at/);
  assert.match(migrationSql, /ORDER BY\s+card_id,\s+reviewed_at DESC/);
});

test("Migration SQL enforces multi-tenant institutional isolation for administrators", () => {
  assert.match(migrationSql, /get_current_user_institution_id/);
  assert.match(migrationSql, /v_caller_inst <> v_target_inst/);
  assert.match(migrationSql, /administrador institucional não possui escopo sobre estudante de outra instituição/);
});

test("Migration SQL integrates FIRST SESSION WINS and inativity guard in RPCs and RLS", () => {
  assert.match(migrationSql, /is_current_jwt_session_active\(\)/);
  assert.match(migrationSql, /sessão inativa ou sobreposta por outro dispositivo/);
  assert.match(migrationSql, /REVOKE ALL ON FUNCTION public\.sync_student_model_progress FROM public, anon/);
  assert.match(migrationSql, /REVOKE ALL ON FUNCTION public\.get_student_academic_summary FROM public, anon/);
});

test("calculateAnatomicalMasteryBySystem does not inject fictitious denominators", () => {
  const modelsWithoutStructures = [
    { id: "mod-1", system: "Locomotor", isActive: true } // annotationsCount and markersCount missing
  ];
  
  const result = calculateAnatomicalMasteryBySystem({
    models: modelsWithoutStructures,
    explorationMetrics: { explorationByModel: [] },
    flashcardMetrics: {},
    quizMetrics: {}
  });

  const locomotor = result.find(s => s.systemName === "Locomotor");
  assert.ok(locomotor);
  assert.equal(locomotor.structuresTotal, 0, "structuresTotal must be 0 when no annotations exist (not fictitious 10)");
  assert.equal(locomotor.explorationCoveragePercent, 0);
});
