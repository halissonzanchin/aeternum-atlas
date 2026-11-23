if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é proibido.");
}

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMgmtToken } from "./supabase_admin_helper.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = "hyivyrietgjdazgizafp";
const FUNCTION_PATH = path.resolve(__dirname, "../../supabase/functions/send-beta-notification/index.ts");

async function deployFunction() {
  console.log("=== DEPLOY DA EDGE FUNCTION 'send-beta-notification' NO SUPABASE ===");

  if (!fs.existsSync(FUNCTION_PATH)) {
    throw new Error(`Arquivo não encontrado: ${FUNCTION_PATH}`);
  }

  const token = getMgmtToken();
  const code = fs.readFileSync(FUNCTION_PATH);
  console.log(`Tamanho do código da função: ${code.length} bytes`);

  const form = new FormData();
  form.append("metadata", JSON.stringify({
    entrypoint_path: "index.ts",
    name: "send-beta-notification",
    verify_jwt: false
  }));
  form.append("file", new Blob([code], { type: "application/typescript" }), "index.ts");

  console.log(`Enviando deploy para a Supabase Management API (slug=send-beta-notification)...`);
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/deploy?slug=send-beta-notification`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Falha no deploy da função (HTTP ${res.status}): ${errText}`);
  }

  const data = await res.json();
  console.log(`\n>>> [DEPLOY CONCLUÍDO COM SUCESSO]`);
  console.log(`    Função: ${data.name} (${data.slug})`);
  console.log(`    Versão: v${data.version}`);
  console.log(`    Status: ${data.status}`);
  console.log(`    Endpoint: https://${PROJECT_REF}.supabase.co/functions/v1/send-beta-notification\n`);
}

deployFunction().catch(err => {
  console.error("ERRO NO DEPLOY:", err);
  process.exit(1);
});
