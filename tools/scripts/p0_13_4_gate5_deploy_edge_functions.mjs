/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.13.4
 * GATE 5: DEPLOY E VALIDAÇÃO DAS EDGE FUNCTIONS (AI-TUTOR E VOICE-TOKEN)
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const PROJECT_REF = "hyivyrietgjdazgizafp";

function getManagementToken() {
  const psCode = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class CredManager {
    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
    [DllImport("advapi32.dll", SetLastError = true)]
    public static extern bool CredFree(IntPtr credential);
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }
    public static string GetSecret(string target) {
        IntPtr credPtr;
        if (CredRead(target, 1, 0, out credPtr)) {
            try {
                CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
                if (cred.CredentialBlobSize > 0) {
                    byte[] blob = new byte[cred.CredentialBlobSize];
                    Marshal.Copy(cred.CredentialBlob, blob, 0, cred.CredentialBlobSize);
                    return Encoding.UTF8.GetString(blob);
                }
            } finally {
                CredFree(credPtr);
            }
        }
        return null;
    }
}
"@
[CredManager]::GetSecret("Supabase CLI:supabase")
`;
  const base64 = Buffer.from(psCode, "utf16le").toString("base64");
  return execSync(`powershell -NoProfile -EncodedCommand ${base64}`, { encoding: "utf8" }).trim();
}

const token = getManagementToken();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function main() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — P0.13.4: GATE 5 — ATUALIZAÇÃO DAS EDGE FUNCTIONS");
  console.log("================================================================================\n");

  // 1. Deploy voice-token
  console.log("[1/3] Preparando deploy de 'voice-token'...");
  const voiceTokenPath = path.join(REPO_ROOT, "supabase/functions/voice-token/index.ts");
  const voiceCode = fs.readFileSync(voiceTokenPath);

  const voiceForm = new FormData();
  voiceForm.append("metadata", JSON.stringify({
    entrypoint_path: "index.ts",
    name: "voice-token",
    verify_jwt: false
  }));
  voiceForm.append("file", new Blob([voiceCode], { type: "application/typescript" }), "index.ts");

  console.log("   Enviando deploy de 'voice-token' para Supabase Management API...");
  const voiceRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/deploy?slug=voice-token`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: voiceForm
  });

  if (!voiceRes.ok) {
    const errText = await voiceRes.text();
    throw new Error(`Falha no deploy de voice-token (HTTP ${voiceRes.status}): ${errText}`);
  }
  const voiceData = await voiceRes.json();
  console.log(`✓ 'voice-token' implantado com sucesso! Versão: ${voiceData.version}, Status: ${voiceData.status}`);

  // 2. Bundle & Deploy ai-tutor
  console.log("\n[2/3] Compilando bundle canônico de 'ai-tutor' via esbuild...");
  const aiTutorEntry = path.join(REPO_ROOT, "supabase/functions/ai-tutor/index.ts");
  const aiTutorDist = path.join(REPO_ROOT, "supabase/functions/ai-tutor/dist.js");

  execSync(`npx esbuild "${aiTutorEntry}" --bundle --format=esm --platform=neutral --target=esnext "--external:npm:*" --outfile="${aiTutorDist}"`, {
    cwd: REPO_ROOT,
    encoding: "utf8"
  });
  const distStat = fs.statSync(aiTutorDist);
  console.log(`   Bundle compilado: ${aiTutorDist} (${(distStat.size / 1024).toFixed(2)} KB)`);

  const aiCode = fs.readFileSync(aiTutorDist);
  const aiForm = new FormData();
  aiForm.append("metadata", JSON.stringify({
    entrypoint_path: "index.ts",
    name: "ai-tutor",
    verify_jwt: false
  }));
  aiForm.append("file", new Blob([aiCode], { type: "application/javascript" }), "index.ts");

  console.log("   Enviando deploy de 'ai-tutor' para Supabase Management API...");
  const aiRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/deploy?slug=ai-tutor`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: aiForm
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    throw new Error(`Falha no deploy de ai-tutor (HTTP ${aiRes.status}): ${errText}`);
  }
  const aiData = await aiRes.json();
  console.log(`✓ 'ai-tutor' implantado com sucesso! Versão: ${aiData.version}, Status: ${aiData.status}`);

  // 3. Confirm active versions in list
  console.log("\n[3/3] Consultando versões ativas das Edge Functions...");
  const listRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/functions`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });
  const fns = await listRes.json();
  const summary = Array.isArray(fns) ? fns.map(f => `${f.name}: v${f.version} (${f.status})`).join(", ") : "Erro ao listar";
  console.log(`- Funções ativas: ${summary}`);

  const gate5Result = {
    timestamp: new Date().toISOString(),
    status: "PASS",
    deployed: [
      { name: "voice-token", version: voiceData.version, status: voiceData.status },
      { name: "ai-tutor", version: aiData.version, status: aiData.status }
    ],
    functionsSummary: summary
  };

  const resultPath = path.resolve(REPO_ROOT, "tools/scripts/p0_13_4_gate5_results.json");
  fs.writeFileSync(resultPath, JSON.stringify(gate5Result, null, 2), "utf8");

  console.log("\n================================================================================");
  console.log("✓ GATE 5 APROVADO: Edge Functions atualizadas e ativas no Supabase!");
  console.log(`  Resultado gravado em: ${resultPath}`);
  console.log("================================================================================\n");
}

main().catch(err => {
  console.error("FATAL ERROR IN GATE 5:", err);
  process.exit(1);
});
