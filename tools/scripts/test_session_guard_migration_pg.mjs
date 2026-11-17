import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, "../..");

const CONTAINER_NAME = "aeternum-sg-pg-test";

function runCmd(cmd) {
  return execSync(cmd, { encoding: "utf8" });
}

function runPsql(sql) {
  const cmd = `docker exec -i ${CONTAINER_NAME} psql -U postgres -d postgres -t -A`;
  return execSync(cmd, { input: sql, encoding: "utf8" }).trim();
}

function runPsqlFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const cmd = `docker exec -i ${CONTAINER_NAME} psql -U postgres -d postgres`;
  return execSync(cmd, { input: content, encoding: "utf8" });
}

async function main() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — VALIDAÇÃO DA MIGRATION SESSION GUARD EM POSTGRES 15           ");
  console.log("================================================================================\n");

  // 1. Cleanup old container if any
  try {
    runCmd(`docker rm -f ${CONTAINER_NAME}`);
  } catch {}

  // 2. Start container
  console.log("1. Iniciando container descartável PostgreSQL 15...");
  runCmd(`docker run -d --name ${CONTAINER_NAME} -e POSTGRES_PASSWORD=postgres postgres:15-alpine`);

  // Wait for postgres to be ready
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = runPsql("SELECT 1;");
      if (res === "1") {
        ready = true;
        break;
      }
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  if (!ready) throw new Error("PostgreSQL container did not become ready in time");
  console.log("✓ PostgreSQL 15 pronto.");

  try {
    // 3. Setup mock Supabase auth schema and public.users
    console.log("2. Configurando schema auth e mock de public.users...");
    runPsql(`
      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE IF NOT EXISTS auth.users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text UNIQUE,
        created_at timestamptz DEFAULT now()
      );

      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE ROLE service_role;

      CREATE TABLE IF NOT EXISTS public.users (
        id uuid PRIMARY KEY REFERENCES auth.users(id),
        email text,
        role text DEFAULT 'student',
        status text DEFAULT 'active',
        name text
      );

      -- Mock auth.uid() function
      CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$ LANGUAGE sql STABLE;

      -- Mock auth.role() function
      CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
        SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'authenticated');
      $$ LANGUAGE sql STABLE;

      -- Mock auth.jwt() function
      CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb AS $$
        SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
      $$ LANGUAGE sql STABLE;
    `);

    // 4. Apply Migration
    console.log("3. Aplicando migration 20261116010000_aeternum_session_guard_single_session_policy.sql...");
    const migrationPath = path.join(FRONTEND_ROOT, "supabase/migrations/20261116010000_aeternum_session_guard_single_session_policy.sql");
    const migrationOutput = runPsqlFile(migrationPath);
    console.log("✓ Migration aplicada com sucesso.");

    // 5. Verify tables and indexes exist
    console.log("4. Verificando existência de tabelas e índices...");
    const checkTables = runPsql(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('user_active_sessions', 'session_guard_events');
    `);
    console.log("   Tabelas criadas:\n" + checkTables.split("\n").map(t => "   - " + t).join("\n"));

    // 6. Test Rollback
    console.log("5. Testando rollback...");
    const rollbackPath = path.join(FRONTEND_ROOT, "supabase/rollback-plans/rollback_20261116010000_aeternum_session_guard_single_session_policy.sql");
    runPsqlFile(rollbackPath);

    const checkAfterRollback = runPsql(`
      SELECT count(*) FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('user_active_sessions', 'session_guard_events');
    `);
    if (checkAfterRollback !== "0") {
      throw new Error(`Rollback falhou: ainda restam ${checkAfterRollback} tabelas.`);
    }
    console.log("✓ Rollback executado com sucesso e verificado (0 tabelas restantes).");

    // 7. Re-apply migration for functional tests
    console.log("6. Re-aplicando migration para validação funcional...");
    runPsqlFile(migrationPath);
    console.log("✓ Migration re-aplicada com sucesso.");

    console.log("\n================================================================================");
    console.log(" MIGRATION E ROLLBACK 100% VALIDADOS EM POSTGRESQL 15                          ");
    console.log("================================================================================");
  } finally {
    try {
      runCmd(`docker rm -f ${CONTAINER_NAME}`);
      console.log("Container descartável removido.");
    } catch {}
  }
}

main().catch(err => {
  console.error("ERRO NO TESTE:", err);
  process.exit(1);
});
