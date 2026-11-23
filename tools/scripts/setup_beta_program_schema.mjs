if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é proibido.");
}

import { runSupabaseSql } from "./supabase_admin_helper.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATION_PATH = path.resolve(__dirname, "../../supabase/migrations/20261123000000_p0_21_e1_beta_applications.sql");

async function setupBetaSchema() {
  console.log("=== AETERNUM ATLAS: APLICAÇÃO DO SCHEMA HARDENED DO PROGRAMA BETA (P0.21-E.1.1) ===");

  const sql = fs.readFileSync(MIGRATION_PATH, "utf8");
  const res = await runSupabaseSql(sql);
  console.log("Resultado da migração:", res);
  console.log("Schema Hardened do Programa Beta configurado com sucesso!");
}

setupBetaSchema().catch(err => {
  console.error("FALHA NA CRIAÇÃO DO SCHEMA:", err);
  process.exit(1);
});
