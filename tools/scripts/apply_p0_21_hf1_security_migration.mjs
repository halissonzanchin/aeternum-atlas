import fs from "fs";
import path from "path";
import { runSupabaseSql } from "./supabase_admin_helper.mjs";

async function applyMigration() {
  console.log("=== APLICANDO MIGRAÇÃO DE SEGURANÇA P0.21-HF.1 NO SUPABASE ===");

  const migrationPath = path.resolve("supabase/migrations/20261123180000_p0_21_hf1_security_hardening.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");

  const result = await runSupabaseSql(sql);
  console.log("Migração aplicada com sucesso!", result);

  // Verificações pós-migração:
  // 1. Verificar assinaturas das funções atualizadas
  const funcs = await runSupabaseSql(`
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.proname IN ('submit_beta_application', 'admin_review_beta_application', 'claim_next_beta_email_notification');
  `);
  console.log("Funções atualizadas:", funcs);

  // 2. Verificar permissões das funções
  const grants = await runSupabaseSql(`
    SELECT routine_name, grantee, privilege_type
    FROM information_schema.routine_privileges
    WHERE routine_schema = 'public'
    AND routine_name IN ('submit_beta_application', 'admin_review_beta_application', 'claim_next_beta_email_notification');
  `);
  console.log("Grants das funções:", grants);

  // 3. Confirmar remoção de supabase_service_role_key de platform_system_settings
  const settings = await runSupabaseSql(`
    SELECT setting_key, description, is_sensitive
    FROM public.platform_system_settings;
  `);
  console.log("Settings remanescentes em platform_system_settings:", settings);

  // 4. Confirmar que o segredo existe no vault
  const vaultSecrets = await runSupabaseSql(`
    SELECT name, description, created_at, updated_at
    FROM vault.secrets
    WHERE name = 'INTERNAL_SERVICE_ROLE_KEY';
  `);
  console.log("Vault status:", vaultSecrets);
}

applyMigration().catch(err => {
  console.error("Falha ao aplicar migração:", err);
  process.exit(1);
});
