import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [authContext, authService, edgeConfig, edgeFunction, cleanup, telemetry, aiMigration] = await Promise.all([
  read("src/context/AuthContext.jsx"),
  read("src/services/auth/authService.js"),
  read("supabase/config.toml"),
  read("supabase/functions/ai-tutor/index.ts"),
  read("supabase/migrations/20260804061848_p0_identity_cleanup.sql"),
  read("supabase/migrations/20260804054520_p0_telemetry_hardening.sql"),
  read("supabase/migrations/20260804054522_p0_ai_tutor.sql")
]);

assert.doesNotMatch(authContext, /admin-demo|upe-presidente-franco/);
assert.doesNotMatch(authService, /VITE_DEFAULT_INSTITUTION_ID|configured_default/);
assert.match(edgeConfig, /verify_jwt\s*=\s*true/);
assert.match(edgeFunction, /auth\.getUser\(\)/);
assert.match(edgeFunction, /\.from\("users"\)/);
assert.match(edgeFunction, /gemini-2\.5-flash/);
assert.doesNotMatch(edgeFunction, /gemini-flash-latest|payload\.role|\{\s*messages,\s*context,\s*role\s*\}/);
assert.match(edgeFunction, /GEMINI_API_KEY/);
assert.match(edgeFunction, /consume_ai_rate_limit/);
assert.match(cleanup, /legacy_cleanup_archive/);
assert.match(cleanup, /UPDATE public\.models_3d SET institution_id = official_id/);
assert.match(cleanup, /Proteção do tenant oficial violada/);
assert.doesNotMatch(cleanup, /DELETE FROM public\.institutions WHERE id = official_id/);
assert.match(telemetry, /reconcile_all_stale_learning_sessions/);
assert.match(telemetry, /REVOKE INSERT, UPDATE, DELETE ON public\.model_access_logs/);
assert.match(aiMigration, /CREATE TABLE IF NOT EXISTS public\.ai_conversations/);
assert.match(aiMigration, /CREATE TABLE IF NOT EXISTS public\.ai_messages/);
assert.match(aiMigration, /ROW LEVEL SECURITY/);

console.log("P0 contracts: identity, cleanup, telemetry and AI hardening approved.");
