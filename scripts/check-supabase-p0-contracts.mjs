import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

async function readSourceTree(path = "src") {
  const directory = new URL(`../${path}/`, import.meta.url);
  const entries = await readdir(directory, { withFileTypes: true });
  const sources = await Promise.all(entries.map(async (entry) => {
    const entryPath = `${path}/${entry.name}`;
    if (entry.isDirectory()) return readSourceTree(entryPath);
    if (!/\.(?:js|jsx|ts|tsx)$/.test(entry.name)) return "";
    return read(entryPath);
  }));
  return sources.join("\n");
}

const [
  authContext,
  authService,
  edgeConfig,
  edgeFunction,
  tutorClient,
  cleanup,
  telemetry,
  aiMigration,
  knowledgeMigration,
  reconciliationCron,
  ingestionScript,
  modelViewer,
  modelService
] = await Promise.all([
  read("src/context/AuthContext.jsx"),
  read("src/services/auth/authService.js"),
  read("supabase/config.toml"),
  read("supabase/functions/ai-tutor/index.ts"),
  read("src/features/atlas-viewer/ai/atlasAITutorService.js"),
  read("supabase/migrations/20260804061848_p0_identity_cleanup.sql"),
  read("supabase/migrations/20260804054520_p0_telemetry_hardening.sql"),
  read("supabase/migrations/20260804054522_p0_ai_tutor.sql"),
  read("supabase/migrations/20260806191000_anatomical_knowledge_base.sql"),
  read("supabase/migrations/20260809040000_learning_session_reconciliation_cron.sql"),
  read("tools/scripts/ingest_anatomy_books.js"),
  read("src/components/ModelViewer/ModelViewer.jsx"),
  read("src/services/modelService.js")
]);

assert.doesNotMatch(authContext, /admin-demo|upe-presidente-franco/);
assert.doesNotMatch(authService, /VITE_DEFAULT_INSTITUTION_ID|configured_default/);
assert.match(edgeConfig, /verify_jwt\s*=\s*false/);
assert.match(edgeFunction, /auth\.getUser\(\)/);
assert.match(edgeFunction, /if \((?:req|request)\.method === "OPTIONS"\)/);
assert.match(edgeFunction, /http:\/\/127\.0\.0\.1:5174/);
assert.match(edgeFunction, /\.from\("users"\)/);
assert.match(edgeFunction, /gemini-2\.5-flash/);
assert.doesNotMatch(edgeFunction, /gemini-flash-latest|payload\.role|\{\s*messages,\s*context,\s*role\s*\}/);
assert.doesNotMatch(edgeFunction, /anon-student-session|fallback-user|acesso (?:completo|integral) aos livros/i);
assert.match(edgeFunction, /GEMINI_API_KEY/);
assert.match(edgeFunction, /consume_ai_rate_limit/);
assert.match(edgeFunction, /match_anatomical_knowledge/);
assert.match(edgeFunction, /gemini-embedding-2/);
assert.match(edgeFunction, /systemInstruction/);
assert.doesNotMatch(edgeFunction, /system_instruction/);
assert.match(tutorClient, /getSession\(\)/);
assert.match(tutorClient, /['"]Authorization['"]:\s*`Bearer \$\{accessToken\}`/);
assert.doesNotMatch(tutorClient, /eyJ[a-zA-Z0-9_-]{20,}/);
assert.match(cleanup, /legacy_cleanup_archive/);
assert.match(cleanup, /UPDATE public\.models_3d SET institution_id = official_id/);
assert.match(cleanup, /Proteção do tenant oficial violada/);
assert.doesNotMatch(cleanup, /DELETE FROM public\.institutions WHERE id = official_id/);
assert.match(telemetry, /reconcile_all_stale_learning_sessions/);
assert.match(telemetry, /REVOKE INSERT, UPDATE, DELETE ON public\.model_access_logs/);
assert.match(reconciliationCron, /aeternum-reconcile-learning-sessions/);
assert.match(reconciliationCron, /reconcile_all_stale_learning_sessions/);
assert.match(reconciliationCron, /'\* \* \* \* \*'/);
assert.match(aiMigration, /CREATE TABLE IF NOT EXISTS public\.ai_conversations/);
assert.match(aiMigration, /CREATE TABLE IF NOT EXISTS public\.ai_messages/);
assert.match(aiMigration, /ROW LEVEL SECURITY/);
assert.match(knowledgeMigration, /embedding extensions\.vector\(768\) NOT NULL/);
assert.match(knowledgeMigration, /TO service_role/);
assert.doesNotMatch(knowledgeMigration, /USING\s*\(\s*true\s*\)|TO\s+(?:PUBLIC|anon|authenticated)\s*;/i);
assert.match(ingestionScript, /gemini-embedding-2/);
assert.match(ingestionScript, /SUPABASE_SERVICE_ROLE_KEY/);
assert.doesNotMatch(ingestionScript, /VITE_SUPABASE_ANON_KEY|text-embedding-004/);
assert.doesNotMatch(modelViewer, /model_access_logs|logModelAccess|registerSupabaseModelAccess/);
assert.doesNotMatch(modelService, /atlas_cms_overrides|saveModelOverride|getModelOverrides/);
assert.match(modelService, /Modelo não encontrado no catálogo autorizado do Supabase/);

const runtimeTelemetryReaders = await Promise.all([
  "src/services/progressService.js",
  "src/services/teacher/teacherDashboardService.js",
  "src/services/admin/institutionDashboardService.js"
].map(async file => ({ file, source: await read(file) })));

runtimeTelemetryReaders.forEach(({ source }) => {
  assert.doesNotMatch(source, /\.from\(["']model_access_logs["']\)/);
});

const runtimeSource = await readSourceTree();
assert.doesNotMatch(runtimeSource, /atlas_cms_overrides/);

console.log("P0 contracts: identity, cleanup, telemetry and AI hardening approved.");
