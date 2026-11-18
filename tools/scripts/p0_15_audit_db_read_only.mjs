import { runSupabaseSql } from './supabase_admin_helper.mjs';
import fs from 'fs';
import path from 'path';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const ARTIFACTS_DIR = 'C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3';

async function auditDatabaseMetrics() {
  console.log('=== P0.15: AUDITORIA FORENSE DE DADOS NO SUPABASE (SOMENTE LEITURA) ===\n');

  // 1. List related tables
  const tables = await runSupabaseSql(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND (
        table_name LIKE '%learn%' 
        OR table_name LIKE '%quiz%' 
        OR table_name LIKE '%metric%' 
        OR table_name LIKE '%progress%'
        OR table_name LIKE '%favorite%'
        OR table_name LIKE '%study%'
        OR table_name LIKE '%session%'
        OR table_name LIKE '%ai_%'
        OR table_name LIKE '%card%'
        OR table_name LIKE '%user%'
        OR table_name LIKE '%profile%'
      )
    ORDER BY table_name;
  `);
  console.log('Tabelas relevantes identificadas:', tables.map(t => t.table_name));

  // 2. Schema inspection of learning tables
  const schemas = await runSupabaseSql(`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN (
        'viewer_learning_sessions',
        'viewer_learning_events',
        'viewer_quiz_results',
        'anatomical_quiz_attempts',
        'anatomical_quizzes',
        'anatomical_quiz_questions',
        'study_agenda',
        'study_agenda_events',
        'ai_conversations',
        'ai_messages',
        'user_active_sessions',
        'user_engagement_summary',
        'users',
        'student_profiles'
      )
    ORDER BY table_name, ordinal_position;
  `);

  const tableColumns = {};
  for (const row of schemas) {
    if (!tableColumns[row.table_name]) tableColumns[row.table_name] = [];
    tableColumns[row.table_name].push({
      column: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable,
      default: row.column_default
    });
  }

  // 3. Row counts for all relevant tables
  const countQueries = tables.map(t => `SELECT '${t.table_name}' AS tbl, count(*)::int AS cnt FROM public."${t.table_name}"`);
  const combinedCountsSql = countQueries.join(' UNION ALL ');
  const counts = await runSupabaseSql(combinedCountsSql);
  console.log('\nContagem de registros por tabela:');
  console.table(counts);

  // 4. Inspecionar viewer_learning_sessions em detalhe
  let sessionStats = null;
  if (tables.some(t => t.table_name === 'viewer_learning_sessions')) {
    sessionStats = await runSupabaseSql(`
      SELECT 
        scope,
        status,
        count(*)::int AS total_sessions,
        count(active_seconds)::int AS sessions_with_active_seconds,
        count(CASE WHEN active_seconds = 0 THEN 1 END)::int AS sessions_zero_active,
        round(avg(active_seconds)::numeric, 1) AS avg_active_seconds,
        round(avg(duration_seconds)::numeric, 1) AS avg_duration_seconds,
        min(active_seconds)::int AS min_active_seconds,
        max(active_seconds)::int AS max_active_seconds,
        min(duration_seconds)::int AS min_duration_seconds,
        max(duration_seconds)::int AS max_duration_seconds,
        min(session_start) AS earliest_session,
        max(session_start) AS latest_session
      FROM public.viewer_learning_sessions
      GROUP BY scope, status
      ORDER BY scope, status;
    `);
    console.log('\nEstatísticas de viewer_learning_sessions por scope e status:');
    console.table(sessionStats);
  }

  // 5. Inspecionar viewer_learning_events por tipo
  let eventStats = null;
  if (tables.some(t => t.table_name === 'viewer_learning_events')) {
    eventStats = await runSupabaseSql(`
      SELECT 
        event_type,
        count(*)::int AS total_events,
        min(created_at) AS earliest_event,
        max(created_at) AS latest_event
      FROM public.viewer_learning_events
      GROUP BY event_type
      ORDER BY total_events DESC;
    `);
    console.log('\nEstatísticas de viewer_learning_events por event_type:');
    console.table(eventStats);
  }

  // 6. Inspecionar viewer_quiz_results
  let quizStats = null;
  if (tables.some(t => t.table_name === 'viewer_quiz_results')) {
    quizStats = await runSupabaseSql(`
      SELECT 
        count(*)::int AS total_quiz_results,
        round(avg(score)::numeric, 2) AS avg_score,
        min(score)::numeric AS min_score,
        max(score)::numeric AS max_score,
        count(DISTINCT user_id)::int AS distinct_users,
        count(DISTINCT model_id)::int AS distinct_models,
        min(created_at) AS earliest,
        max(created_at) AS latest
      FROM public.viewer_quiz_results;
    `);
    console.log('\nEstatísticas de viewer_quiz_results:');
    console.table(quizStats);
  }

  // 7. Inspecionar anatomical_quiz_attempts
  let anatomicalQuizStats = null;
  if (tables.some(t => t.table_name === 'anatomical_quiz_attempts')) {
    anatomicalQuizStats = await runSupabaseSql(`
      SELECT 
        count(*)::int AS total_attempts,
        round(avg(percentage)::numeric, 2) AS avg_pct,
        min(percentage)::numeric AS min_pct,
        max(percentage)::numeric AS max_pct,
        count(DISTINCT user_id)::int AS distinct_users
      FROM public.anatomical_quiz_attempts;
    `);
    console.log('\nEstatísticas de anatomical_quiz_attempts:');
    console.table(anatomicalQuizStats);
  }

  // 8. Inspecionar ai_conversations e ai_messages
  let aiStats = null;
  if (tables.some(t => t.table_name === 'ai_conversations')) {
    aiStats = await runSupabaseSql(`
      SELECT 
        (SELECT count(*) FROM public.ai_conversations)::int AS total_conversations,
        (SELECT count(*) FROM public.ai_messages)::int AS total_messages,
        (SELECT count(DISTINCT user_id) FROM public.ai_conversations)::int AS users_with_convs;
    `);
    console.log('\nEstatísticas de IA (conversas e mensagens):');
    console.table(aiStats);
  }

  // 9. Inspecionar user_engagement_summary
  let engagementStats = null;
  if (tables.some(t => t.table_name === 'user_engagement_summary')) {
    engagementStats = await runSupabaseSql(`
      SELECT * FROM public.user_engagement_summary LIMIT 10;
    `);
    console.log('\nuser_engagement_summary rows:', engagementStats);
  }

  // 10. Inspecionar se existem colunas acadêmicas em student_profiles
  const studentProfileCols = tableColumns['student_profiles'] || [];
  console.log('\nColunas em student_profiles:', studentProfileCols.map(c => c.column));

  // 11. Salvar resultado consolidado da auditoria de banco
  const auditReportData = {
    timestamp: new Date().toISOString(),
    projectRef: 'hyivyrietgjdazgizafp',
    tablesFound: tables.map(t => t.table_name),
    tableColumns,
    tableRowCounts: counts,
    sessionStats,
    eventStats,
    quizStats,
    anatomicalQuizStats,
    aiStats,
    engagementStats
  };

  const outPath = path.join(ARTIFACTS_DIR, 'p0_15_database_metrics_audit.json');
  fs.writeFileSync(outPath, JSON.stringify(auditReportData, null, 2));
  console.log(`\n[SUCESSO] Auditoria de dados do banco salva em: ${outPath}`);
}

auditDatabaseMetrics().catch(err => {
  console.error('[ERRO NA AUDITORIA DE BANCO]', err);
  process.exit(1);
});
