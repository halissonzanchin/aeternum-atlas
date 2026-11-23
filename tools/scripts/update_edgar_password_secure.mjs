// Script Administrativo Seguro para Definição da Senha de Edgar Torales (P0.20-S.1)
// Executado exclusivamente em memória pelo operador via set_edgar_password_interactive.ps1
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é expressamente proibido no Aeternum Atlas.");
}

import { createClient } from "@supabase/supabase-js";
import { runSupabaseSql, getServiceRoleKey } from "./supabase_admin_helper.mjs";

const SUPABASE_URL = "https://hyivyrietgjdazgizafp.supabase.co";
const EDGAR_EMAIL = "edgartorales@aeternumatlas.com";

async function updateEdgarPassword() {
  const newPassword = process.env.EDGAR_NEW_PASSWORD;
  if (!newPassword || newPassword.trim().length === 0) {
    throw new Error("Nenhuma senha fornecida na variável de ambiente EDGAR_NEW_PASSWORD.");
  }

  // Limpar imediatamente a variável de ambiente do processo
  delete process.env.EDGAR_NEW_PASSWORD;

  const users = await runSupabaseSql(`SELECT id FROM auth.users WHERE email = '${EDGAR_EMAIL}';`);
  if (!Array.isArray(users) || users.length === 0) {
    throw new Error(`Usuário ${EDGAR_EMAIL} não localizado em auth.users. Execute a padronização primeiro.`);
  }

  const userId = users[0].id;
  const serviceRoleKey = await getServiceRoleKey();
  const adminClient = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword
  });

  if (error) {
    throw new Error(`Falha ao atualizar senha via Supabase Auth Admin API: ${error.message}`);
  }

  console.log(`[SUCESSO] Senha atualizada com sucesso no Supabase Auth para: ${EDGAR_EMAIL} (UUID: ${userId}).`);
}

updateEdgarPassword().catch(err => {
  console.error("ERRO NA ATUALIZAÇÃO DE SENHA:", err.message);
  process.exit(1);
});
