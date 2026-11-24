if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é expressamente proibido no Aeternum Atlas.");
}

import { getMgmtToken, runSupabaseSql } from "./supabase_admin_helper.mjs";

const PROJECT_REF = "hyivyrietgjdazgizafp";

async function auditInfrastructure() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: AUDITORIA DA INFRAESTRUTURA DE NOTIFICAÇÕES (P0.21-E.4) ===");
  console.log("================================================================================\n");

  const token = getMgmtToken();

  // 1. Edge Functions implantadas no Supabase
  console.log("[1/6] Inspecionando Edge Functions no Supabase...");
  const fnRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/functions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!fnRes.ok) {
    console.error(`Erro ao consultar functions: HTTP ${fnRes.status} ${await fnRes.text()}`);
  } else {
    const functions = await fnRes.json();
    console.log(`Total de Edge Functions: ${functions.length}`);
    for (const fn of functions) {
      console.log(` - Slug: ${fn.slug} | Nome: ${fn.name} | Versão: v${fn.version} | Status: ${fn.status} | Atualizada em: ${fn.updated_at}`);
    }
  }

  // 2. Secrets da Edge Function no Supabase (apenas nomes, sem expor valores)
  console.log("\n[2/6] Inspecionando Secrets configuradas no Supabase...");
  const secRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!secRes.ok) {
    console.error(`Erro ao consultar secrets: HTTP ${secRes.status} ${await secRes.text()}`);
  } else {
    const secrets = await secRes.json();
    console.log(`Total de Secrets configuradas: ${secrets.length}`);
    const secretNames = secrets.map(s => s.name);
    console.log(`Nomes das Secrets: ${JSON.stringify(secretNames)}`);
    console.log(` - RESEND_API_KEY presente: ${secretNames.includes("RESEND_API_KEY")}`);
    console.log(` - RESEND_SENDER_EMAIL presente: ${secretNames.includes("RESEND_SENDER_EMAIL")}`);
    console.log(` - SUPABASE_SERVICE_ROLE_KEY presente: ${secretNames.includes("SUPABASE_SERVICE_ROLE_KEY")}`);
    console.log(` - LEGACY_SERVICE_ROLE_KEY presente: ${secretNames.includes("LEGACY_SERVICE_ROLE_KEY")}`);
  }

  // 3. Vault do Postgres
  console.log("\n[3/6] Inspecionando Supabase Vault...");
  try {
    const vaultSecrets = await runSupabaseSql(`
      SELECT id, name, description, created_at, updated_at 
      FROM vault.secrets;
    `);
    console.log("Segredos no Vault:", JSON.stringify(vaultSecrets, null, 2));
  } catch (err) {
    console.error("Erro ao consultar Vault:", err.message);
  }

  // 4. Supabase pg_cron jobs
  console.log("\n[4/6] Inspecionando cron jobs configurados (pg_cron)...");
  try {
    const cronJobs = await runSupabaseSql(`
      SELECT jobid, jobname, schedule, active, command 
      FROM cron.job;
    `);
    console.log("Cron Jobs:", JSON.stringify(cronJobs, null, 2));
  } catch (err) {
    console.error("Erro ao consultar cron.job:", err.message);
  }

  // 5. Configurações de sistema (platform_system_settings)
  console.log("\n[5/6] Inspecionando platform_system_settings...");
  try {
    const settings = await runSupabaseSql(`
      SELECT setting_key, setting_value, description, updated_at 
      FROM public.platform_system_settings 
      WHERE setting_key IN ('beta_registration_open', 'server_rate_limit_salt', 'supabase_service_role_key');
    `);
    console.log("Settings:", JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error("Erro ao consultar platform_system_settings:", err.message);
  }

  // 6. Estado das Tabelas e Filas
  console.log("\n[6/6] Inspecionando tabelas do programa beta...");
  try {
    const appStats = await runSupabaseSql(`
      SELECT status, batch, count(*) as count 
      FROM public.beta_applications 
      GROUP BY status, batch;
    `);
    console.log("Estatísticas de beta_applications:", JSON.stringify(appStats, null, 2));

    const outboxStats = await runSupabaseSql(`
      SELECT status, event_type, count(*) as count 
      FROM public.beta_email_notifications 
      GROUP BY status, event_type;
    `);
    console.log("Estatísticas de beta_email_notifications (outbox):", JSON.stringify(outboxStats, null, 2));

    const recentOutbox = await runSupabaseSql(`
      SELECT id, application_id, recipient_email, subject, status, attempts, error_message, provider, provider_message_id, created_at, sent_at
      FROM public.beta_email_notifications
      ORDER BY created_at DESC
      LIMIT 5;
    `);
    console.log("Notificações recentes na fila:", JSON.stringify(recentOutbox, null, 2));

  } catch (err) {
    console.error("Erro ao consultar tabelas:", err.message);
  }
}

auditInfrastructure()
  .then(() => {
    console.log("\n>>> Auditoria de infraestrutura concluída.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("FALHA NA AUDITORIA:", err);
    process.exit(1);
  });
