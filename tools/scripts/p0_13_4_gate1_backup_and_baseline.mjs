/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.13.4
 * GATE 1: BACKUP E BASELINE DE PRODUÇÃO (SOMENTE-LEITURA)
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";

function getManagementToken() {
  const psCode = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class CredManager {
    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
    [DllImport("advapi32.dll", SetLastError = true)]
    public static extern bool CredFree(IntPtr credential);
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }
    public static string GetSecret(string target) {
        IntPtr credPtr;
        if (CredRead(target, 1, 0, out credPtr)) {
            try {
                CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
                if (cred.CredentialBlobSize > 0) {
                    byte[] blob = new byte[cred.CredentialBlobSize];
                    Marshal.Copy(cred.CredentialBlob, blob, 0, cred.CredentialBlobSize);
                    return Encoding.UTF8.GetString(blob);
                }
            } finally {
                CredFree(credPtr);
            }
        }
        return null;
    }
}
"@
[CredManager]::GetSecret("Supabase CLI:supabase")
`;
  const base64 = Buffer.from(psCode, "utf16le").toString("base64");
  return execSync(`powershell -NoProfile -EncodedCommand ${base64}`, { encoding: "utf8" }).trim();
}

const projectRef = "hyivyrietgjdazgizafp";
const token = getManagementToken();

async function runReadOnlyQuery(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query: sql, read_only: true })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Query failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function getEdgeFunctions() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/functions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) {
    return { error: `HTTP ${res.status}: ${await res.text()}` };
  }
  return res.json();
}

async function getAuthConfig() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) {
    return { error: `HTTP ${res.status}: ${await res.text()}` };
  }
  const full = await res.json();
  const relevant = {};
  for (const [k, v] of Object.entries(full)) {
    if (
      k.includes("session") ||
      k.includes("jwt") ||
      k.includes("refresh") ||
      k.includes("single") ||
      k.includes("inactivity") ||
      k.includes("timebox") ||
      k.includes("security") ||
      k.includes("site_url")
    ) {
      if (!k.includes("secret") && !k.includes("key") && !k.includes("password")) {
        relevant[k] = v;
      }
    }
  }
  return relevant;
}

async function main() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — P0.13.4: GATE 1 — BACKUP E BASELINE DE PRODUÇÃO");
  console.log("================================================================================\n");

  console.log(`[AUTH] Conectando ao projeto Supabase: ${projectRef}...`);

  // 1. Check applied migrations
  console.log("[1/8] Verificando histórico de migrations aplicadas...");
  const migrations = await runReadOnlyQuery(`
    SELECT version, name
    FROM supabase_migrations.schema_migrations
    ORDER BY version;
  `);

  const hasBase00 = migrations.some(m => m.version === "20261116000000");
  const hasBase01 = migrations.some(m => m.version === "20261116010000");
  const hasCand = migrations.some(m => m.version === "20261117210000");

  console.log(`- Migration 20261116000000 presente: ${hasBase00}`);
  console.log(`- Migration 20261116010000 presente: ${hasBase01}`);
  console.log(`- Migration candidata 20261117210000 JÁ aplicada: ${hasCand} (deve ser false)`);

  if (!hasBase01) {
    throw new Error("GATE 1 BLOQUEADO: Migration base 20261116010000 não encontrada no banco de produção.");
  }
  if (hasCand) {
    console.warn("ALERTA: Migration candidata 20261117210000 já consta como aplicada.");
  }

  // 2. Backup current RPCs
  console.log("\n[2/8] Extraindo definições atuais das RPCs de autenticação e sessão...");
  const rpcs = await runReadOnlyQuery(`
    SELECT
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS args,
      p.prosecdef AS security_definer,
      p.proconfig AS config,
      pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'register_or_transfer_session',
        'validate_session_guard',
        'revoke_active_session',
        'consume_ai_rate_limit_tiered',
        'admin_reset_user_session',
        'protect_user_license_attributes',
        'consume_ai_rate_limit',
        'is_current_jwt_session_active'
      )
    ORDER BY p.proname;
  `);
  console.log(`- Encontradas ${rpcs.length} funções instaladas.`);

  // 3. Backup columns of affected tables
  console.log("\n[3/8] Extraindo colunas e tipos das tabelas afetadas...");
  const columns = await runReadOnlyQuery(`
    SELECT
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('user_active_sessions', 'session_guard_events', 'ai_rate_limits', 'users')
    ORDER BY table_name, ordinal_position;
  `);

  // 4. Backup constraints and indexes
  console.log("\n[4/8] Extraindo constraints e índices...");
  const constraints = await runReadOnlyQuery(`
    SELECT
      conrelid::regclass::text AS table_name,
      conname AS constraint_name,
      contype AS constraint_type,
      pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid IN (
      'public.user_active_sessions'::regclass,
      'public.session_guard_events'::regclass,
      'public.ai_rate_limits'::regclass
    )
    ORDER BY table_name, conname;
  `);

  // 5. Backup RLS policies
  console.log("\n[5/8] Extraindo políticas RLS das tabelas públicas...");
  const policies = await runReadOnlyQuery(`
    SELECT
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);

  // 6. Prometheus clinical trial baseline snapshot
  console.log("\n[6/8] Extraindo baseline do Projeto Prometheus (Ensaio Clínico de Próteses)...");
  let prometheusBaseline = {};
  try {
    const promTables = await runReadOnlyQuery(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('participants', 'prostheses', 'weekly_submissions', 'trial_events');
    `);
    const tableNames = promTables.map(t => t.table_name);
    console.log(`- Tabelas Prometheus encontradas no schema: ${tableNames.join(", ") || "Nenhuma detectada com este prefixo"}`);

    if (tableNames.includes("participants")) {
      const partCount = await runReadOnlyQuery("SELECT count(*)::int as c FROM public.participants;");
      prometheusBaseline.participants_count = partCount[0]?.c || 0;
    }
    if (tableNames.includes("prostheses")) {
      const prosCount = await runReadOnlyQuery("SELECT count(*)::int as c FROM public.prostheses;");
      prometheusBaseline.prostheses_count = prosCount[0]?.c || 0;
    }
    if (tableNames.includes("weekly_submissions")) {
      const subCount = await runReadOnlyQuery("SELECT count(*)::int as c FROM public.weekly_submissions;");
      prometheusBaseline.weekly_submissions_count = subCount[0]?.c || 0;
    }
  } catch (err) {
    console.warn("- Consulta Prometheus em produção:", err.message);
    prometheusBaseline.note = "Tabelas Prometheus isoladas ou em schema separado.";
  }

  // 7. Supabase Auth Config & Edge Functions
  console.log("\n[7/8] Extraindo configuração do Supabase Auth e versões das Edge Functions...");
  const authConfig = await getAuthConfig();
  const edgeFunctions = await getEdgeFunctions();
  console.log(`- Edge Functions instaladas: ${Array.isArray(edgeFunctions) ? edgeFunctions.map(f => `${f.name} (v${f.version})`).join(", ") : "Erro ao listar"}`);

  // 8. Live production web headers and deployment metadata
  console.log("\n[8/8] Consultando headers de produção em https://www.aeternumatlas.com/...");
  let liveHeaders = {};
  try {
    const headRes = await fetch("https://www.aeternumatlas.com/", { method: "HEAD" });
    liveHeaders = {
      status: headRes.status,
      "x-vercel-id": headRes.headers.get("x-vercel-id"),
      "x-vercel-cache": headRes.headers.get("x-vercel-cache"),
      "server": headRes.headers.get("server"),
      "date": headRes.headers.get("date")
    };
    console.log("- Headers ao vivo obtidos:", liveHeaders);
  } catch (err) {
    console.warn("- Erro ao consultar live headers:", err.message);
  }

  // Compile Baseline Snapshot
  const baseline = {
    timestamp: new Date().toISOString(),
    projectRef,
    migrationsApplied: migrations,
    hasBase00,
    hasBase01,
    hasCandidateMigration: hasCand,
    rpcsInstalledCount: rpcs.length,
    rpcs,
    columns,
    constraints,
    policiesCount: policies.length,
    policies,
    prometheusBaseline,
    authConfig,
    edgeFunctions,
    liveProductionHeaders: liveHeaders
  };

  const backupPath = path.resolve(REPO_ROOT, "tools/scripts/p0_13_4_production_baseline_backup.json");
  fs.writeFileSync(backupPath, JSON.stringify(baseline, null, 2), "utf8");

  const artifactBackupPath = path.resolve(ARTIFACTS_DIR, "p0_13_4_production_baseline_backup.json");
  fs.writeFileSync(artifactBackupPath, JSON.stringify(baseline, null, 2), "utf8");

  console.log("\n================================================================================");
  console.log(`✓ GATE 1 APROVADO: Backup e Baseline registrados com sucesso!`);
  console.log(`  Arquivo salvo em: ${backupPath}`);
  console.log(`  Artefato salvo em: ${artifactBackupPath}`);
  console.log("================================================================================\n");
}

main().catch(err => {
  console.error("FATAL ERROR IN GATE 1:", err);
  process.exit(1);
});
