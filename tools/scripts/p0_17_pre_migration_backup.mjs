import { runSupabaseSql } from './supabase_admin_helper.mjs';
import { writeFileSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const ARTIFACTS_DIR = 'C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3';

async function performBackup() {
  console.log("=== EXECUTANDO BACKUP PRÉ-MIGRATION P0.17 (GATE 6) ===");

  const tables = [
    'viewer_learning_sessions',
    'viewer_quiz_results',
    'anatomical_quiz_attempts',
    'ai_conversations',
    'user_active_sessions',
    'institutional_notifications',
    'user_notification_reads'
  ];

  const backupData = {
    timestamp: new Date().toISOString(),
    git_head: "release/p0-17-academic-dashboard-frosted-crystal",
    supabase_project: "hyivyrietgjdazgizafp",
    tables: {}
  };

  for (const table of tables) {
    console.log(`Exportando dados da tabela public.${table}...`);
    const rows = await runSupabaseSql(`SELECT * FROM public.${table};`);
    backupData.tables[table] = {
      count: Array.isArray(rows) ? rows.length : 0,
      rows: rows || []
    };
    console.log(`   ${table}: ${backupData.tables[table].count} registros salvos.`);
  }

  // Backup das definições de schemas e migrations já aplicadas
  console.log("Exportando histórico de migrations aplicadas...");
  const migs = await runSupabaseSql(`SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;`);
  backupData.applied_migrations = migs || [];

  const jsonStr = JSON.stringify(backupData, null, 2);
  const hash = createHash('sha256').update(jsonStr).digest('hex');
  backupData.sha256 = hash;

  const backupPath = path.join(ARTIFACTS_DIR, 'p0_17_backup_production_pre_migration.json');
  writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');

  console.log(`\nBackup concluído com SUCESSO!`);
  console.log(`Arquivo: ${backupPath}`);
  console.log(`SHA256: ${hash}`);
  console.log(`Tabelas preservadas: ${Object.keys(backupData.tables).length}`);
  console.log(`Migrations aplicadas registradas: ${backupData.applied_migrations.length}`);
}

performBackup().catch(err => {
  console.error("ERRO NO BACKUP PRÉ-MIGRATION:", err);
  process.exit(1);
});
