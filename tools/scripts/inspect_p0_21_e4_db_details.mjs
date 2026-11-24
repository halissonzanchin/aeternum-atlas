if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é proibido.");
}

import { runSupabaseSql } from "./supabase_admin_helper.mjs";

async function inspect() {
  console.log("=== COLUNAS DE BETA_EMAIL_NOTIFICATIONS ===");
  const cols = await runSupabaseSql(`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'beta_email_notifications'
    ORDER BY ordinal_position;
  `);
  console.log(cols);

  console.log("\n=== POLICIES EM BETA_APPLICATIONS E BETA_EMAIL_NOTIFICATIONS ===");
  const policies = await runSupabaseSql(`
    SELECT tablename, policyname, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename IN ('beta_applications', 'beta_email_notifications');
  `);
  console.log(policies);

  console.log("\n=== DEFINIÇÃO DE CLAIM_NEXT_BETA_EMAIL_NOTIFICATION ===");
  const rpcClaim = await runSupabaseSql(`
    SELECT proname, prosrc
    FROM pg_proc
    WHERE proname = 'claim_next_beta_email_notification';
  `);
  console.log(rpcClaim[0]?.prosrc);
}

inspect().catch(console.error);
