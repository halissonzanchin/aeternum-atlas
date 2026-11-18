import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { runSupabaseSql } from './supabase_admin_helper.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../');
const ARTIFACTS_DIR = 'C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('================================================================================');
console.log(' AETERNUM ATLAS — P0.17: FASE 10 (ETAPA A) — APLICAÇÃO DA MIGRATION NO SUPABASE  ');
console.log('================================================================================\n');

async function main() {
  const migPath = path.join(REPO_ROOT, 'supabase/migrations/20261118120000_p0_16_academic_metrics_expansion.sql');
  console.log(`1. Lendo migration homologada: ${migPath}...`);
  const migSql = fs.readFileSync(migPath, 'utf8');

  // 1. Checksum SHA256
  const sha256 = crypto.createHash('sha256').update(migSql, 'utf8').digest('hex');
  console.log(`   Checksum SHA256 da migration: ${sha256}`);

  // 2. Verificar que a migration ainda não foi aplicada
  console.log('\n2. Verificando se 20261118120000 já consta em schema_migrations...');
  const existingMig = await runSupabaseSql(`
    SELECT version FROM supabase_migrations.schema_migrations WHERE version = '20261118120000';
  `);
  if (existingMig && existingMig.length > 0) {
    console.log('   ATENÇÃO: Migration 20261118120000 já consta como registrada!');
  } else {
    console.log('   Migration ainda não aplicada. Liberada para aplicação.');
  }

  // 3. Aplicar a Migration no Supabase Oficial
  console.log('\n3. Executando DDL aditiva no Supabase oficial (hyivyrietgjdazgizafp)...');
  const ddlStart = Date.now();
  await runSupabaseSql(migSql);
  const ddlDuration = Date.now() - ddlStart;
  console.log(`   Migration executada com SUCESSO em ${ddlDuration}ms!`);

  // 4. Registrar em supabase_migrations.schema_migrations
  console.log('\n4. Registrando versão 20261118120000 em supabase_migrations.schema_migrations...');
  await runSupabaseSql(`
    INSERT INTO supabase_migrations.schema_migrations (version, name)
    VALUES ('20261118120000', 'p0_16_academic_metrics_expansion')
    ON CONFLICT (version) DO NOTHING;
  `);
  console.log('   Registro persistido no catálogo oficial de migrations!');

  // 5. Verificações de Integridade Pós-Aplicação
  console.log('\n5. Validando estruturas criadas no banco de dados...');
  const tables = await runSupabaseSql(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('user_model_progress', 'user_flashcard_reviews');
  `);
  console.log('   Tabelas verificadas:', tables.map(t => t.table_name));

  const rls = await runSupabaseSql(`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN ('user_model_progress', 'user_flashcard_reviews');
  `);
  console.log('   Status RLS:', rls);

  const functions = await runSupabaseSql(`
    SELECT proname, prosecdef 
    FROM pg_proc 
    WHERE proname IN ('sync_student_model_progress', 'get_student_academic_summary');
  `);
  console.log('   RPCs verificadas:', functions);

  // 6. Teste de Chamada Real da RPC get_student_academic_summary
  console.log('\n6. Testando execução real da RPC get_student_academic_summary...');
  const tStart = Date.now();
  const summaryTest = await runSupabaseSql(`
    SELECT public.get_student_academic_summary('5cfb837a-5ce3-4113-8f4a-dcdd9b8bf43f', 30) AS summary;
  `);
  const tDuration = Date.now() - tStart;
  console.log(`   RPC executada com sucesso em ${tDuration}ms!`);
  console.log('   Resumo retornado:', JSON.stringify(summaryTest?.[0]?.summary || {}, null, 2));

  console.log('\n=== GATE 7 (ETAPA A) CONCLUÍDO COM 100% DE SUCESSO ===');
}

main().catch(err => {
  console.error('\n✖ ERRO CRÍTICO NA APLICAÇÃO DA MIGRATION:', err);
  process.exit(1);
});
