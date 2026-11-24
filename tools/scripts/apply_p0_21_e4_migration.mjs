if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é proibido.");
}

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runSupabaseSql } from "./supabase_admin_helper.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATION_PATH = path.resolve(__dirname, "../../supabase/migrations/20261124150000_p0_21_e4_resend_subject_alignment.sql");

async function applyMigration() {
  console.log("=== APLICANDO MIGRAÇÃO P0.21-E.4 NO SUPABASE ===");
  const sql = fs.readFileSync(MIGRATION_PATH, "utf8");
  console.log(`Lendo ${MIGRATION_PATH} (${sql.length} bytes)...`);
  const result = await runSupabaseSql(sql);
  console.log("Resultado da aplicação SQL:", result);
  console.log(">>> Migração P0.21-E.4 aplicada com sucesso.");
}

applyMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Falha ao aplicar migração:", err);
    process.exit(1);
  });
