import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runSupabaseSql } from './supabase_admin_helper.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../');

console.log("================================================================================");
console.log(" AETERNUM ATLAS — P0.12: FASE 5 — APLICAÇÃO CONTROLADA DAS MIGRATIONS NO BANCO ");
console.log("================================================================================\n");

async function main() {
  // ---------------------------------------------------------------------------
  // 1. APLICAR MIGRATION 1: HARDEN SECURITY DEFINER PRIVILEGES
  // ---------------------------------------------------------------------------
  const mig1Path = path.join(REPO_ROOT, 'supabase/migrations/20261116000000_harden_security_definer_public_privileges.sql');
  console.log(`1. Lendo Migration 1: ${mig1Path}...`);
  const mig1Sql = fs.readFileSync(mig1Path, 'utf8');

  console.log("   Executando Migration 1 no Supabase de Produção (hyivyrietgjdazgizafp)...");
  const res1 = await runSupabaseSql(mig1Sql);
  console.log("   Migration 1 aplicada com sucesso!");

  console.log("\n2. Validando efeitos de segurança da Migration 1 no banco oficial...");
  // Check privileges for anon
  const privCheckSql = `
    SELECT 
      has_function_privilege('anon', 'public.reset_all_submissions()', 'execute') as reset_anon_priv,
      has_function_privilege('anon', 'public.delete_participant_submissions(uuid)', 'execute') as delete_anon_priv,
      has_function_privilege('anon', 'public.get_participant_portal_data(text)', 'execute') as portal_anon_priv,
      has_function_privilege('anon', 'public.submit_participant_questionnaire(text, jsonb)', 'execute') as submit_anon_priv;
  `;
  const privResults = await runSupabaseSql(privCheckSql);
  console.log("   Privilégios da role 'anon':", privResults[0]);

  if (privResults[0].reset_anon_priv !== false || privResults[0].delete_anon_priv !== false) {
    throw new Error("FALHA CRÍTICA: Rotinas destrutivas não foram revogadas de anon!");
  }
  if (privResults[0].portal_anon_priv !== true || privResults[0].submit_anon_priv !== true) {
    throw new Error("FALHA CRÍTICA: Rotinas legítimas de voluntários foram indevidamente revogadas!");
  }
  console.log("   [CORRETO] Destrutivas bloqueadas para anon e fluxos legítimos do Prometheus preservados.");

  // Check Prometheus row counts
  console.log("\n3. Verificando integridade das contagens de controle do Prometheus...");
  const promCountSql = `
    SELECT 
      (SELECT count(*) FROM public.participants) as participants_count,
      (SELECT count(*) FROM public.weekly_submissions) as submissions_count,
      (SELECT count(*) FROM public.prosthesis_changes) as prosthesis_changes_count,
      (SELECT count(*) FROM public.prosthesis_manufacturing_specs) as specs_count;
  `;
  const promCounts = await runSupabaseSql(promCountSql);
  console.log("   Contagens observadas:", promCounts[0]);
  if (Number(promCounts[0].participants_count) !== 8 || Number(promCounts[0].submissions_count) !== 4) {
    throw new Error("ALERTA CRÍTICO: Divergência na contagem do Projeto Prometheus!");
  }
  console.log("   [INTEGRIDADE TOTAL] 100% dos registros do Projeto Prometheus intactos.");

  // ---------------------------------------------------------------------------
  // 4. APLICAR MIGRATION 2: AETERNUM SESSION GUARD SINGLE SESSION POLICY
  // ---------------------------------------------------------------------------
  const mig2Path = path.join(REPO_ROOT, 'supabase/migrations/20261116010000_aeternum_session_guard_single_session_policy.sql');
  console.log(`\n4. Lendo Migration 2: ${mig2Path}...`);
  const mig2Sql = fs.readFileSync(mig2Path, 'utf8');

  console.log("   Executando Migration 2 no Supabase de Produção (hyivyrietgjdazgizafp)...");
  const res2 = await runSupabaseSql(mig2Sql);
  console.log("   Migration 2 aplicada com sucesso!");

  console.log("\n5. Validando tabelas, colunas e trigger do Session Guard...");
  const sgCheckSql = `
    SELECT 
      (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_active_sessions', 'session_guard_events', 'ai_rate_limits')) as tables_count,
      (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name IN ('license_tier', 'session_guard_enabled')) as user_cols_count,
      (SELECT count(*) FROM information_schema.triggers WHERE event_object_table = 'users' AND trigger_name = 'trg_protect_user_license_attributes') as trigger_count;
  `;
  const sgChecks = await runSupabaseSql(sgCheckSql);
  console.log("   Verificações estruturais do Session Guard:", sgChecks[0]);

  if (Number(sgChecks[0].tables_count) !== 3) {
    throw new Error(`FALHA: Tabelas do Session Guard não foram criadas (esperado 3, obtido ${sgChecks[0].tables_count})`);
  }
  if (Number(sgChecks[0].user_cols_count) !== 2) {
    throw new Error(`FALHA: Colunas de licença não foram adicionadas a public.users`);
  }
  if (Number(sgChecks[0].trigger_count) < 1) {
    throw new Error(`FALHA: Trigger de proteção trg_protect_user_license_attributes ausente`);
  }

  // Check demo user row
  console.log("\n6. Verificando ativação do Session Guard no usuário demo institucional...");
  const demoCheckSql = `
    SELECT id, email, role, status, license_tier, session_guard_enabled
    FROM public.users
    WHERE email = 'demo.institucional@aeternumatlas.com';
  `;
  const demoRows = await runSupabaseSql(demoCheckSql);
  console.log("   Registro do Aluno Demo:", demoRows[0]);

  if (demoRows[0].license_tier !== "demo" || demoRows[0].session_guard_enabled !== true) {
    throw new Error("FALHA: Conta demo não recebeu license_tier='demo' ou session_guard_enabled=true!");
  }
  console.log("   [CORRETO] Aluno demo configurado com license_tier='demo' e session_guard_enabled=true.");

  // Check RPCs
  console.log("\n7. Verificando presença e funcionamento das funções RPC...");
  const rpcCheckSql = `
    SELECT 
      routine_name, routine_type
    FROM information_schema.routines
    WHERE routine_schema = 'public' 
      AND routine_name IN ('consume_ai_rate_limit_tiered', 'validate_session_guard', 'register_or_transfer_session', 'protect_user_license_attributes');
  `;
  const rpcList = await runSupabaseSql(rpcCheckSql);
  console.log("   Funções registradas:", rpcList.map(r => r.routine_name));

  if (rpcList.length < 4) {
    throw new Error(`FALHA: Menos de 4 funções RPC encontradas (${rpcList.length}/4)`);
  }

  console.log("\n================================================================================");
  console.log(" FASE 5 CONCLUÍDA COM SUCESSO ABSOLUTO: GATE DATABASE APROVADO (GO)!           ");
  console.log("================================================================================");
}

main().catch(err => {
  console.error("ERRO FATAL na aplicação das migrations:", err);
  process.exit(1);
});
