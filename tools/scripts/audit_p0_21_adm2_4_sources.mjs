import { runSupabaseSql } from "./supabase_admin_helper.mjs";
import fs from "fs";

async function main() {
  console.log("=== P0.21-ADM.2.4: FASE A — AUDITORIA DE FONTES DE TELEMETRIA E ATIVIDADE ACADÊMICA ===");
  
  // 1. List all tables and views in public schema
  const tablesAndViewsQuery = `
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;
  const tablesAndViews = await runSupabaseSql(tablesAndViewsQuery);
  console.log(`Found ${tablesAndViews.length} tables/views in public schema.`);

  // Candidate lists to specifically audit per prompt directive:
  // - viewer_learning_sessions
  // - viewer_learning_events
  // - platform_events
  // - model_access_logs
  // - Histórico acadêmico
  // - Flashcards (study_decks, flashcards, user_flashcard_reviews, etc.)
  // - Mapas mentais (mind_maps, etc.)
  // - Simulados (anatomical_quizzes, anatomical_quiz_questions, anatomical_quiz_attempts, anatomical_quiz_answers)
  // - Agenda acadêmica (study_agenda, study_agenda_events, etc.)
  // - Conversas e interações com Tutor IA (ai_tutor_sessions, chat_sessions, conversations, etc.)
  // - Perfis acadêmicos (profiles, auth.users)
  // - Instituições (institutions)
  // - Turmas (classes, turmas, institution_classes, etc.)
  // - Sessões de autenticação (auth.sessions, aeternum_active_sessions, etc.)
  // - Eventos de navegação

  const targetKeywords = [
    "viewer", "learning", "session", "event", "log", "model",
    "flashcard", "deck", "mind", "map", "quiz", "simulado",
    "agenda", "study", "tutor", "ai", "chat", "conversation",
    "profile", "institution", "class", "turma", "auth", "navigation"
  ];

  const matchedTables = tablesAndViews.filter(t => 
    targetKeywords.some(kw => t.table_name.toLowerCase().includes(kw))
  );

  console.log(`\nMatched candidate tables/views: ${matchedTables.length}`);

  const auditReport = [];

  for (const item of matchedTables) {
    const tableName = item.table_name;
    const isView = item.table_type === 'VIEW';
    
    // Columns
    const colsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `;
    const cols = await runSupabaseSql(colsQuery);

    // Row count
    let rowCount = null;
    let countErr = null;
    try {
      const countRes = await runSupabaseSql(`SELECT count(*)::bigint as count FROM public."${tableName}";`);
      rowCount = countRes[0]?.count != null ? Number(countRes[0].count) : null;
    } catch (e) {
      countErr = e.message;
    }

    // RLS Status
    const rlsQuery = `
      SELECT relrowsecurity, relforcerowsecurity
      FROM pg_class
      WHERE relname = '${tableName}' AND relnamespace = 'public'::regnamespace;
    `;
    const rlsRes = await runSupabaseSql(rlsQuery);
    const hasRls = rlsRes[0]?.relrowsecurity ?? false;

    // Policies
    const policiesQuery = `
      SELECT polname, polpermissive, polroles, polcmd, polqual, polwithcheck
      FROM pg_policy
      WHERE polrelid = 'public."${tableName}"'::regclass;
    `;
    let policies = [];
    try {
      policies = await runSupabaseSql(policiesQuery);
    } catch (e) {}

    // Indexes
    const indexQuery = `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = '${tableName}';
    `;
    let indexes = [];
    try {
      indexes = await runSupabaseSql(indexQuery);
    } catch (e) {}

    // Sample row
    let sample = null;
    try {
      const sampleRes = await runSupabaseSql(`SELECT * FROM public."${tableName}" LIMIT 1;`);
      sample = sampleRes[0] || null;
    } catch (e) {}

    // Date range / temporal coverage if timestamp column exists
    let temporalCoverage = null;
    const timeCol = cols.find(c => ['created_at', 'session_start', 'started_at', 'timestamp', 'date', 'updated_at'].includes(c.column_name));
    if (timeCol && rowCount && rowCount > 0) {
      try {
        const timeRangeRes = await runSupabaseSql(`
          SELECT 
            min("${timeCol.column_name}") as min_time,
            max("${timeCol.column_name}") as max_time
          FROM public."${tableName}";
        `);
        temporalCoverage = timeRangeRes[0];
      } catch (e) {}
    }

    auditReport.push({
      tableName,
      type: item.table_type,
      rowCount,
      countErr,
      hasRls,
      policyCount: policies.length,
      policies: policies.map(p => ({ name: p.polname, cmd: p.polcmd, roles: p.polroles })),
      columns: cols.map(c => ({ name: c.column_name, type: c.data_type, nullable: c.is_nullable })),
      indexes: indexes.map(i => ({ name: i.indexname, def: i.indexdef })),
      temporalCoverage,
      timeCol: timeCol?.column_name || null,
      sampleKeys: sample ? Object.keys(sample) : []
    });

    console.log(`Audited: ${tableName} (${item.table_type}) - Rows: ${rowCount} - RLS: ${hasRls} - Indexes: ${indexes.length}`);
  }

  // Also check RPCs / routines
  const rpcQuery = `
    SELECT routine_name, routine_type, data_type, security_type
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    ORDER BY routine_name;
  `;
  const rpcs = await runSupabaseSql(rpcQuery);
  const relevantRpcs = rpcs.filter(r => 
    targetKeywords.some(kw => r.routine_name.toLowerCase().includes(kw))
  );

  console.log(`\nFound ${relevantRpcs.length} relevant RPCs.`);

  // Write detailed findings to JSON
  const output = {
    auditedAt: new Date().toISOString(),
    totalTablesInPublic: tablesAndViews.length,
    auditedSources: auditReport,
    relevantRpcs
  };

  fs.writeFileSync("tools/scripts/audit_p0_21_adm2_4_sources_result.json", JSON.stringify(output, null, 2));
  console.log("\nResults written to tools/scripts/audit_p0_21_adm2_4_sources_result.json");
}

main().catch(err => {
  console.error("FATAL in audit script:", err);
  process.exit(1);
});
