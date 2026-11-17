// P0.13.1 — FASE 1: Auditoria Somente-Leitura do Banco Real e Auth Config
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

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
  // Filter only session/security/jwt settings (never dump secrets/smtp passwords)
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
  console.log("=== P0.13.1 FASE 1: AUDITORIA SOMENTE-LEITURA DO BANCO REAL ===");

  // 1. Inspect installed functions
  const functions = await runReadOnlyQuery(`
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
        'consume_ai_rate_limit'
      )
    ORDER BY p.proname;
  `);

  // 2. Inspect columns of user_active_sessions, session_guard_events, ai_rate_limits, users
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

  // 3. Check constraints on user_active_sessions and session_guard_events
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

  // 4. Check indexes
  const indexes = await runReadOnlyQuery(`
    SELECT
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('user_active_sessions', 'session_guard_events', 'ai_rate_limits')
    ORDER BY tablename, indexname;
  `);

  // 5. Check triggers
  const triggers = await runReadOnlyQuery(`
    SELECT
      event_object_table AS table_name,
      trigger_name,
      event_manipulation,
      action_timing,
      action_statement
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND event_object_table IN ('user_active_sessions', 'session_guard_events', 'ai_rate_limits', 'users')
    ORDER BY event_object_table, trigger_name;
  `);

  // 6. Check RLS policies across public schema
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

  // 7. Check table and routine grants
  const tableGrants = await runReadOnlyQuery(`
    SELECT
      table_name,
      grantee,
      string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND table_name IN ('user_active_sessions', 'session_guard_events', 'ai_rate_limits', 'users')
    GROUP BY table_name, grantee
    ORDER BY table_name, grantee;
  `);

  const routineGrants = await runReadOnlyQuery(`
    SELECT
      routine_name,
      grantee,
      string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
    FROM information_schema.role_routine_grants
    WHERE specific_schema = 'public'
      AND routine_name IN (
        'register_or_transfer_session',
        'validate_session_guard',
        'revoke_active_session',
        'consume_ai_rate_limit_tiered',
        'admin_reset_user_session',
        'protect_user_license_attributes',
        'consume_ai_rate_limit'
      )
    GROUP BY routine_name, grantee
    ORDER BY routine_name, grantee;
  `);

  // 8. Check applied migrations
  const migrations = await runReadOnlyQuery(`
    SELECT version, name
    FROM supabase_migrations.schema_migrations
    ORDER BY version;
  `);

  // 9. Summary of active sessions state (anonymized)
  const activeSessionsSummary = await runReadOnlyQuery(`
    SELECT
      status,
      COUNT(*)::int AS count,
      MIN(created_at) AS oldest_created_at,
      MAX(last_active_at) AS newest_last_active_at
    FROM public.user_active_sessions
    GROUP BY status
    ORDER BY status;
  `);

  const eventsSummary = await runReadOnlyQuery(`
    SELECT
      event_type,
      COUNT(*)::int AS count,
      MAX(created_at) AS latest_at
    FROM public.session_guard_events
    GROUP BY event_type
    ORDER BY count DESC;
  `);

  // 10. Check all public tables with RLS status
  const allTablesRls = await runReadOnlyQuery(`
    SELECT
      c.relname AS table_name,
      c.relrowsecurity AS rls_enabled,
      c.relforcerowsecurity AS rls_forced
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
    ORDER BY c.relname;
  `);

  // 11. Auth config
  const authConfig = await getAuthConfig();

  const report = {
    auditedAt: new Date().toISOString(),
    projectRef,
    mode: "READ_ONLY",
    authConfig,
    migrations,
    functions,
    columns,
    constraints,
    indexes,
    triggers,
    tableGrants,
    routineGrants,
    activeSessionsSummary,
    eventsSummary,
    allTablesRls,
    policies
  };

  const outPath = path.resolve("tools/scripts/p0_13_1_fase1_audit_results.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`Auditoria Fase 1 concluída. Salva em: ${outPath}`);
  console.log("Funções encontradas:", functions.map(f => `${f.function_name}(${f.args})`));
  console.log("Migrations aplicadas:", migrations);
  console.log("Auth Config (sessão):", JSON.stringify(authConfig, null, 2));
  console.log("Active Sessions Summary:", JSON.stringify(activeSessionsSummary, null, 2));
  console.log("Events Summary:", JSON.stringify(eventsSummary, null, 2));
}

main().catch(err => {
  console.error("Erro na auditoria Fase 1:", err);
  process.exit(1);
});
